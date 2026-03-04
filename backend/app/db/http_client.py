"""
Singleton httpx.AsyncClient — fixes per-request client creation.
One client reused across all requests with connection pooling.
"""

import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class _HttpClientSingleton:
    _instance: Optional["_HttpClientSingleton"] = None
    _client: Optional[httpx.AsyncClient] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def initialize(self) -> None:
        if self._client is not None and not self._client.is_closed:
            return
        logger.info("Initializing singleton httpx.AsyncClient")
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(60.0, connect=10.0),
            limits=httpx.Limits(max_connections=50, max_keepalive_connections=20),
            follow_redirects=True,
        )
        logger.info("httpx.AsyncClient initialized")

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            logger.info("httpx.AsyncClient closed")

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            raise RuntimeError("HttpClient not initialized. Call initialize() first.")
        return self._client


http_singleton = _HttpClientSingleton()


def get_http_client() -> _HttpClientSingleton:
    return http_singleton
