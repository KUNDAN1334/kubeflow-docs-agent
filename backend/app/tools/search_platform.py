"""
Tool: search_platform
Searches the Platform Architecture / KEPs collection.
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


def search_platform(query: str, top_k: int = None) -> List[Dict[str, Any]]:
    """
    Search Kubeflow platform architecture docs, KEPs, and design decisions.
    Returns ranked list of relevant architecture documents.
    """
    if top_k is None:
        top_k = settings.TOP_K

    milvus = get_milvus_client()
    query_embedding = embed_query(query)

    results = milvus.search(
        collection_name=settings.PLATFORM_COLLECTION,
        query_vector=query_embedding,
        top_k=top_k,
        output_fields=["title", "url", "content", "source_type", "chunk_index"],
    )

    sources = []
    for hit in results:
        entity = hit.get("entity", {})
        sources.append({
            "title": entity.get("title", "Kubeflow Architecture"),
            "url": entity.get("url", "https://www.kubeflow.org/docs/started/architecture/"),
            "content": entity.get("content", ""),
            "source_type": "platform",
            "chunk_index": entity.get("chunk_index", 0),
            "score": round(float(hit.get("distance", 0)), 4),
            "snippet": entity.get("content", "")[:200],
        })

    logger.info(f"search_platform: query='{query[:50]}' returned {len(sources)} results")
    return sources