"""
Kubeflow Docs Agent — FastAPI Backend
Endpoints: /chat (streaming), /ingest, /health, /metrics, /collections/stats
"""

import asyncio
import json
import logging
import os
import time
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.config import settings
from app.db.milvus_client import get_milvus_client
from app.db.http_client import get_http_client
from app.models.schemas import (
    ChatRequest,
    IngestRequest,
    IngestResponse,
    HealthResponse,
    MetricsResponse,
    CollectionStats,
    SourceType,
)
from app.agent import run_agent

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# In-memory metrics store
_metrics: Dict[str, Any] = {
    "query_count": 0,
    "tool_usage": {"search_docs": 0, "search_issues": 0, "search_platform": 0},
    "latencies": [],
    "cache_hits": 0,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize singletons on startup, clean up on shutdown."""
    logger.info("Starting Kubeflow Docs Agent...")

    # Initialize HTTP client singleton
    http = get_http_client()
    await http.initialize()

    # Initialize Milvus singleton (non-blocking if DB not ready)
    try:
        milvus = get_milvus_client()
        milvus.initialize()
        logger.info("Milvus initialized successfully")
    except Exception as e:
        logger.warning(f"Milvus init warning (may need ingestion first): {e}")

    logger.info("Kubeflow Docs Agent ready")
    yield

    # Cleanup
    http = get_http_client()
    await http.close()
    logger.info("Shutdown complete")


app = FastAPI(
    title="Kubeflow Docs Agent",
    description="Agentic RAG for Kubeflow documentation, issues, and platform architecture",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def stream_chat_response(request: ChatRequest):
    """
    Generator for streaming chat responses.
    Yields SSE-formatted JSON chunks.
    """
    global _metrics

    _metrics["query_count"] += 1
    tool_used_ref = {"tool": "search_docs"}
    sources_ref = {"sources": []}

    async for chunk in run_agent(request.query):
        chunk_type = chunk.get("type")

        if chunk_type == "tool_start":
            tool = chunk.get("tool_used", "search_docs")
            tool_used_ref["tool"] = tool
            _metrics["tool_usage"][tool] = _metrics["tool_usage"].get(tool, 0) + 1
            yield f"data: {json.dumps(chunk)}\n\n"

        elif chunk_type == "source":
            sources_ref["sources"] = chunk.get("sources", [])
            # Serialize sources for SSE
            payload = {
                "type": "source",
                "sources": [
                    {
                        "title": s.get("title", ""),
                        "url": s.get("url", ""),
                        "score": s.get("score", 0),
                        "source_type": s.get("source_type", "docs"),
                        "snippet": s.get("snippet", s.get("content", ""))[:200],
                    }
                    for s in sources_ref["sources"]
                ],
                "tool_used": chunk.get("tool_used", "search_docs"),
            }
            yield f"data: {json.dumps(payload)}\n\n"

        elif chunk_type == "token":
            yield f"data: {json.dumps({'type': 'token', 'content': chunk.get('content', '')})}\n\n"

        elif chunk_type == "done":
            latency = chunk.get("latency_ms", 0)
            _metrics["latencies"].append(latency)
            if len(_metrics["latencies"]) > 1000:
                _metrics["latencies"] = _metrics["latencies"][-1000:]

            payload = {
                "type": "done",
                "latency_ms": latency,
                "tool_used": tool_used_ref["tool"],
                "sources_count": len(sources_ref["sources"]),
            }
            yield f"data: {json.dumps(payload)}\n\n"

        elif chunk_type == "error":
            yield f"data: {json.dumps({'type': 'error', 'content': chunk.get('content', 'Unknown error')})}\n\n"


@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Streaming chat endpoint.
    Returns Server-Sent Events (SSE) stream.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY not configured. Please set the environment variable.",
        )

    return StreamingResponse(
        stream_chat_response(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/ingest", response_model=IngestResponse)
async def ingest(request: IngestRequest, background_tasks: BackgroundTasks):
    """
    Trigger data ingestion for a specific source.
    Uses upsert — never drops collections. Fixes Issue #10.
    """
    source = request.source
    mode = request.mode

    try:
        if source == SourceType.docs:
            from app.ingestion.ingest_docs import ingest_docs
            result = ingest_docs(github_token=settings.GITHUB_TOKEN, mode=mode.value)

        elif source == SourceType.issues:
            from app.ingestion.ingest_issues import ingest_issues
            result = ingest_issues(github_token=settings.GITHUB_TOKEN, mode=mode.value)

        elif source == SourceType.platform:
            from app.ingestion.ingest_platform import ingest_platform
            result = ingest_platform(github_token=settings.GITHUB_TOKEN, mode=mode.value)

        else:
            raise HTTPException(status_code=400, detail=f"Unknown source: {source}")

        return IngestResponse(
            source=source,
            mode=mode,
            chunks_indexed=result.get("chunks_indexed", 0),
            status=result.get("status", "unknown"),
            message=result.get("message", ""),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ingestion failed for {source}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    milvus = get_milvus_client()

    collections = {}
    for name, col in [
        ("docs", settings.DOCS_COLLECTION),
        ("issues", settings.ISSUES_COLLECTION),
        ("platform", settings.PLATFORM_COLLECTION),
    ]:
        try:
            stats = milvus.get_collection_stats(col)
            collections[name] = stats
        except Exception as e:
            collections[name] = {"status": f"error: {str(e)}", "entity_count": 0}

    return HealthResponse(
        status="ok",
        collections=collections,
        embed_model=settings.EMBED_MODEL,
        groq_model=settings.GROQ_MODEL,
    )


@app.get("/metrics", response_model=MetricsResponse)
async def metrics():
    """
    Monitoring metrics endpoint. Fixes: No monitoring issue.
    Returns: query_count, tool_used breakdown, avg latency, cache_hits.
    """
    milvus = get_milvus_client()

    collection_stats = []
    for col_name in [
        settings.DOCS_COLLECTION,
        settings.ISSUES_COLLECTION,
        settings.PLATFORM_COLLECTION,
    ]:
        try:
            stats = milvus.get_collection_stats(col_name)
            collection_stats.append(
                CollectionStats(
                    collection=col_name,
                    entity_count=stats.get("entity_count", 0),
                    status=stats.get("status", "ok"),
                )
            )
        except Exception as e:
            collection_stats.append(
                CollectionStats(
                    collection=col_name,
                    entity_count=0,
                    status=f"error: {str(e)}",
                )
            )

    avg_latency = (
        sum(_metrics["latencies"]) / len(_metrics["latencies"])
        if _metrics["latencies"]
        else 0.0
    )

    return MetricsResponse(
        query_count=_metrics["query_count"],
        tool_usage=_metrics["tool_usage"],
        avg_latency_ms=round(avg_latency, 2),
        cache_hits=_metrics["cache_hits"],
        collections=collection_stats,
    )


@app.get("/collections/stats")
async def collection_stats():
    """Detailed collection statistics."""
    milvus = get_milvus_client()

    stats = {}
    for source, col_name in [
        ("docs", settings.DOCS_COLLECTION),
        ("issues", settings.ISSUES_COLLECTION),
        ("platform", settings.PLATFORM_COLLECTION),
    ]:
        try:
            s = milvus.get_collection_stats(col_name)
            stats[source] = {
                "collection": col_name,
                "entity_count": s.get("entity_count", 0),
                "status": s.get("status", "ok"),
            }
        except Exception as e:
            stats[source] = {
                "collection": col_name,
                "entity_count": 0,
                "status": f"error: {str(e)}",
            }

    return stats


@app.get("/")
async def root():
    return {
        "name": "Kubeflow Docs Agent",
        "version": "1.0.0",
        "description": "Agentic RAG for Kubeflow documentation",
        "endpoints": {
            "chat": "POST /chat",
            "ingest": "POST /ingest",
            "health": "GET /health",
            "metrics": "GET /metrics",
            "stats": "GET /collections/stats",
        },
        "model": settings.GROQ_MODEL,
        "collections": {
            "docs": settings.DOCS_COLLECTION,
            "issues": settings.ISSUES_COLLECTION,
            "platform": settings.PLATFORM_COLLECTION,
        },
    }
