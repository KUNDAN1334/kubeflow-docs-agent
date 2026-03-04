"""
Agentic RAG core:
- Intent-based query routing to 3 tools
- Context assembly from retrieved chunks
- Streaming LLM generation via Groq API (llama-3.1-8b-instant)
- Fixes: decommissioned model, multi-source retrieval, per-request httpx
"""

import json
import logging
import time
from typing import AsyncGenerator, Dict, Any, List

from app.config import settings
from app.db.http_client import get_http_client
from app.tools.search_docs import search_docs
from app.tools.search_issues import search_issues
from app.tools.search_platform import search_platform

logger = logging.getLogger(__name__)

PROMPT_TEMPLATE = """You are the Kubeflow Documentation Assistant — an expert on Kubeflow, MLOps, and Kubernetes-based ML platforms.

Answer ONLY based on the context provided below. Always cite your sources with URLs.

Context from {source_type} ({num_sources} sources):
{retrieved_chunks}

User Question: {query}

Rules:
- If the answer is not in the context, say honestly: "I could not find this in the Kubeflow documentation."
- Always include the source URL(s) in your answer
- Be concise and technically precise
- For bugs/errors, suggest the specific fix if found in the context
- Format code blocks with proper markdown (```yaml, ```python, etc.)
- For architecture questions, explain the design rationale
- Keep responses focused and under 600 words unless the question requires more detail

Answer:"""


def route_query(query: str) -> str:
    """
    Route query to the appropriate tool based on intent.
    Fixes Issue: Single MCP tool → 3 tools with intent routing.
    """
    query_lower = query.lower()

    issue_keywords = [
        "bug", "error", "issue", "not working", "fails", "broken",
        "crash", "fix", "problem", "exception", "traceback", "cannot",
        "can't", "doesn't work", "failed", "stuck", "help me",
    ]

    platform_keywords = [
        "why", "design", "architecture", "kep", "decision", "roadmap",
        "how does kubeflow", "what is the reason", "proposal", "enhancement",
        "component design", "pipeline design", "how is kubeflow designed",
        "internal", "under the hood",
    ]

    if any(w in query_lower for w in issue_keywords):
        return "search_issues"
    elif any(w in query_lower for w in platform_keywords):
        return "search_platform"
    else:
        return "search_docs"


def _assemble_context(sources: List[Dict[str, Any]], max_chars: int = 6000) -> str:
    """Assemble retrieved chunks into a context string."""
    context_parts = []
    total_chars = 0

    for i, source in enumerate(sources):
        content = source.get("content", source.get("snippet", ""))
        title = source.get("title", "Unknown")
        url = source.get("url", "")
        score = source.get("score", 0)

        chunk = f"[Source {i+1}] {title} (relevance: {score:.2f})\nURL: {url}\n{content}"

        if total_chars + len(chunk) > max_chars:
            remaining = max_chars - total_chars
            if remaining > 200:
                chunk = chunk[:remaining] + "..."
            else:
                break

        context_parts.append(chunk)
        total_chars += len(chunk)

    return "\n\n---\n\n".join(context_parts)


async def run_agent(query: str) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Main agentic loop with streaming.
    Yields stream chunks: tool_start, source, token, done.
    """
    start_time = time.time()

    # Step 1: Route the query
    tool_name = route_query(query)
    yield {"type": "tool_start", "tool_used": tool_name}

    # Step 2: Retrieve relevant chunks
    try:
        if tool_name == "search_issues":
            sources = search_issues(query)
        elif tool_name == "search_platform":
            sources = search_platform(query)
        else:
            sources = search_docs(query)
    except Exception as e:
        logger.error(f"Search failed for tool {tool_name}: {e}")
        sources = []

    # Yield sources
    yield {"type": "source", "sources": sources, "tool_used": tool_name}

    # Step 3: Assemble context
    source_type_labels = {
        "search_docs": "Kubeflow Documentation",
        "search_issues": "GitHub Issues",
        "search_platform": "Platform Architecture & KEPs",
    }
    source_label = source_type_labels.get(tool_name, "Documentation")

    if sources:
        context = _assemble_context(sources)
    else:
        context = "No relevant documentation found for this query."

    prompt = PROMPT_TEMPLATE.format(
        source_type=source_label,
        num_sources=len(sources),
        retrieved_chunks=context,
        query=query,
    )

    # Step 4: Stream from Groq API (llama-3.1-8b-instant — fixes decommissioned model)
    http = get_http_client()

    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1024,
        "temperature": 0.1,
        "stream": True,
    }

    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with http.client.stream(
            "POST",
            settings.GROQ_API_URL,
            json=payload,
            headers=headers,
        ) as response:
            if response.status_code != 200:
                error_text = await response.aread()
                logger.error(f"Groq API error {response.status_code}: {error_text}")
                yield {"type": "token", "content": f"Error calling Groq API: {response.status_code}"}
            else:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str.strip() == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            delta = data["choices"][0]["delta"]
                            if "content" in delta and delta["content"]:
                                yield {"type": "token", "content": delta["content"]}
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue

    except Exception as e:
        logger.error(f"Streaming error: {e}")
        yield {"type": "token", "content": f"I encountered an error generating the response: {str(e)}"}

    # Step 5: Done
    latency_ms = int((time.time() - start_time) * 1000)
    yield {"type": "done", "latency_ms": latency_ms, "tool_used": tool_name}