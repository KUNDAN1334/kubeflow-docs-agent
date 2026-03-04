"""
Singleton MilvusClient — fixes Issue #28 (connection pooling).
Uses MilvusClient directly from pymilvus — works with milvus-lite file paths.
"""

import logging
from typing import List, Dict, Any, Optional

from app.config import settings

logger = logging.getLogger(__name__)


class _MilvusClientSingleton:
    _instance: Optional["_MilvusClientSingleton"] = None
    _client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def initialize(self) -> None:
        if self._client is not None:
            return
        # Import here to avoid module-level ORM init that reads Config.MILVUS_URI
        from pymilvus import MilvusClient
        logger.info(f"Initializing MilvusClient at {settings.MILVUS_URI}")
        self._client = MilvusClient(uri=settings.MILVUS_URI)
        self._ensure_collections()
        logger.info("MilvusClient initialized and collections ready")

    def _ensure_collections(self) -> None:
        """Create collections if they don't exist. NEVER drop. Fixes Issue #10."""
        for collection_name in [
            settings.DOCS_COLLECTION,
            settings.ISSUES_COLLECTION,
            settings.PLATFORM_COLLECTION,
        ]:
            if not self._client.has_collection(collection_name):
                logger.info(f"Creating collection: {collection_name}")
                self._create_collection(collection_name)
            else:
                logger.info(f"Collection exists: {collection_name}")

    def _create_collection(self, collection_name: str) -> None:
        self._client.create_collection(
            collection_name=collection_name,
            dimension=settings.EMBED_DIM,
            primary_field_name="id",
            id_type="varchar",
            max_length=512,
            vector_field_name="embedding",
            metric_type="COSINE",
            auto_id=False,
        )
        logger.info(f"Created collection: {collection_name}")

    @property
    def client(self):
        if self._client is None:
            raise RuntimeError("MilvusClient not initialized. Call initialize() first.")
        return self._client

    def upsert(self, collection_name: str, data: List[Dict[str, Any]]) -> int:
        if not data:
            return 0
        result = self._client.upsert(collection_name=collection_name, data=data)
        return result.get("upsert_count", len(data))

    def search(
        self,
        collection_name: str,
        query_vector: List[float],
        top_k: int = 5,
        output_fields: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        if output_fields is None:
            output_fields = ["title", "url", "content", "source_type", "chunk_index", "labels"]
        results = self._client.search(
            collection_name=collection_name,
            data=[query_vector],
            limit=top_k,
            output_fields=output_fields,
        )
        if not results:
            return []
        return results[0]

    def get_collection_stats(self, collection_name: str) -> Dict[str, Any]:
        try:
            stats = self._client.get_collection_stats(collection_name)
            return {"entity_count": int(stats.get("row_count", 0)), "status": "ok"}
        except Exception as e:
            return {"entity_count": 0, "status": f"error: {str(e)}"}

    def has_collection(self, collection_name: str) -> bool:
        return self._client.has_collection(collection_name)


milvus_singleton = _MilvusClientSingleton()


def get_milvus_client() -> _MilvusClientSingleton:
    return milvus_singleton