"""
Tool: search_docs
Searches the Kubeflow official documentation collection.
"""

import logging
from typing import List, Dict, Any

from app.config import settings
from app.db.milvus_client import get_milvus_client

logger = logging.getLogger(__name__)

from app.db.embed_model import embed_query


def search_docs(query: str, top_k: int = None) -> List[Dict[str, Any]]:
    """
    Search the Kubeflow documentation collection.
    Returns ranked list of relevant chunks.
    """
    if top_k is None:
        top_k = settings.TOP_K

    milvus = get_milvus_client()
    query_embedding = embed_query(query)

    results = milvus.search(
        collection_name=settings.DOCS_COLLECTION,
        query_vector=query_embedding,
        top_k=top_k,
        output_fields=["title", "url", "content", "source_type", "chunk_index"],
    )

    sources = []
    for hit in results:
        entity = hit.get("entity", {})
        sources.append({
            "title": entity.get("title", "Kubeflow Documentation"),
            "url": entity.get("url", "https://www.kubeflow.org/docs/"),
            "content": entity.get("content", ""),
            "source_type": "docs",
            "chunk_index": entity.get("chunk_index", 0),
            "score": round(float(hit.get("distance", 0)), 4),
            "snippet": entity.get("content", "")[:200],
        })

    logger.info(f"search_docs: query='{query[:50]}' returned {len(sources)} results")
    return sources