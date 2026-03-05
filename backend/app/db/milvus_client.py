"""
Singleton MilvusClient using milvus-lite directly.
Does NOT import from pymilvus ORM to avoid URI validation at import time.
"""

import logging
from typing import List, Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)


class _MilvusClientSingleton:
    _instance: Optional["_MilvusClientSingleton"] = None
    _client = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def initialize(self) -> None:
        if self._initialized and self._client is not None:
            return
        try:
            uri = settings.MILVUS_URI
            logger.info(f"Initializing MilvusClient at {uri}")
            # Import MilvusClient from milvus_lite directly — bypasses pymilvus ORM
            from milvus_lite.simple_local import SimpleLocal
            from pymilvus.milvus_client.milvus_client import MilvusClient
            self._client = MilvusClient(uri=uri)
            self._initialized = True
            self._ensure_collections()
            logger.info("MilvusClient ready")
        except ImportError:
            # Fallback: try standard pymilvus MilvusClient
            try:
                import os
                old = os.environ.pop("MILVUS_URI", None)
                from pymilvus import MilvusClient
                if old:
                    os.environ["MILVUS_URI"] = old
                self._client = MilvusClient(uri=settings.MILVUS_URI)
                self._initialized = True
                self._ensure_collections()
                logger.info("MilvusClient ready (fallback)")
            except Exception as e2:
                logger.error(f"MilvusClient fallback failed: {e2}")
                self._client = None
                self._initialized = False
                raise
        except Exception as e:
            logger.error(f"MilvusClient init error: {e}")
            self._client = None
            self._initialized = False
            raise

    def _ensure_collections(self) -> None:
        for col in [settings.DOCS_COLLECTION, settings.ISSUES_COLLECTION, settings.PLATFORM_COLLECTION]:
            if not self._client.has_collection(col):
                self._create_collection(col)
                logger.info(f"Created: {col}")
            else:
                logger.info(f"Exists: {col}")

    def _create_collection(self, name: str) -> None:
        self._client.create_collection(
            collection_name=name,
            dimension=settings.EMBED_DIM,
            primary_field_name="id",
            id_type="varchar",
            max_length=512,
            vector_field_name="embedding",
            metric_type="COSINE",
            auto_id=False,
        )

    @property
    def client(self):
        return self._client

    def upsert(self, collection_name: str, data: List[Dict[str, Any]]) -> int:
        if not data or self._client is None:
            return 0
        result = self._client.upsert(collection_name=collection_name, data=data)
        return result.get("upsert_count", len(data))

    def search(self, collection_name: str, query_vector: List[float],
               top_k: int = 5, output_fields: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        if self._client is None:
            return []
        if output_fields is None:
            output_fields = ["title", "url", "content", "source_type", "chunk_index", "labels"]
        results = self._client.search(
            collection_name=collection_name,
            data=[query_vector],
            limit=top_k,
            output_fields=output_fields,
        )
        return results[0] if results else []

    def get_collection_stats(self, collection_name: str) -> Dict[str, Any]:
        if self._client is None:
            raise RuntimeError("MilvusClient not initialized")
        stats = self._client.get_collection_stats(collection_name)
        return {"entity_count": int(stats.get("row_count", 0)), "status": "ok"}

    def has_collection(self, collection_name: str) -> bool:
        if self._client is None:
            return False
        return self._client.has_collection(collection_name)


milvus_singleton = _MilvusClientSingleton()

def get_milvus_client() -> _MilvusClientSingleton:
    return milvus_singleton