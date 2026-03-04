"""
Tool: search_issues
Searches the GitHub Issues collection for bug reports and resolutions.
"""

import logging
from typing import List, Dict, Any

from app.config import settings
from app.db.milvus_client import get_milvus_client

logger = logging.getLogger(__name__)

_embed_model = None


def _get_embed_model():
    global _embed_model
    if _embed_model is None:
        from sentence_transformers import SentenceTransformer
        _embed_model = SentenceTransformer(settings.EMBED_MODEL)
    return _embed_model


def search_issues(query: str, top_k: int = None) -> List[Dict[str, Any]]:
    """
    Search GitHub issues for bug reports, error resolutions, and known problems.
    Returns ranked list of relevant issues.
    """
    if top_k is None:
        top_k = settings.TOP_K

    milvus = get_milvus_client()
    embed_model = _get_embed_model()

    query_embedding = embed_model.encode([query])[0].tolist()

    results = milvus.search(
        collection_name=settings.ISSUES_COLLECTION,
        query_vector=query_embedding,
        top_k=top_k,
        output_fields=["title", "url", "content", "source_type", "chunk_index", "labels"],
    )

    sources = []
    for hit in results:
        entity = hit.get("entity", {})
        sources.append({
            "title": entity.get("title", "GitHub Issue"),
            "url": entity.get("url", "https://github.com/kubeflow/docs-agent/issues"),
            "content": entity.get("content", ""),
            "source_type": "issues",
            "chunk_index": entity.get("chunk_index", 0),
            "score": round(float(hit.get("distance", 0)), 4),
            "labels": entity.get("labels", []),
            "snippet": entity.get("content", "")[:200],
        })

    logger.info(f"search_issues: query='{query[:50]}' returned {len(sources)} results")
    return sources
