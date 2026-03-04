from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum


class SourceType(str, Enum):
    docs = "docs"
    issues = "issues"
    platform = "platform"


class ToolType(str, Enum):
    search_docs = "search_docs"
    search_issues = "search_issues"
    search_platform = "search_platform"


class IngestMode(str, Enum):
    incremental = "incremental"
    full = "full"


# --- Request Models ---

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    session_id: str = Field(default="default")


class IngestRequest(BaseModel):
    source: SourceType
    mode: IngestMode = IngestMode.incremental


# --- Response Models ---

class SourceDocument(BaseModel):
    title: str
    url: str
    score: float
    source_type: SourceType
    chunk_index: int = 0
    snippet: str = ""


class ChatResponse(BaseModel):
    tool_used: ToolType
    sources: List[SourceDocument]
    answer: str
    latency_ms: int
    session_id: str


class StreamChunk(BaseModel):
    type: Literal["tool_start", "source", "token", "done", "error"]
    content: Optional[str] = None
    tool_used: Optional[str] = None
    sources: Optional[List[SourceDocument]] = None
    latency_ms: Optional[int] = None


class IngestResponse(BaseModel):
    source: SourceType
    mode: IngestMode
    chunks_indexed: int
    status: str
    message: str


class HealthResponse(BaseModel):
    status: str
    collections: dict
    embed_model: str
    groq_model: str


class CollectionStats(BaseModel):
    collection: str
    entity_count: int
    status: str


class MetricsResponse(BaseModel):
    query_count: int
    tool_usage: dict
    avg_latency_ms: float
    cache_hits: int
    collections: List[CollectionStats]


# --- Internal Models ---

class ChunkDocument(BaseModel):
    chunk_id: str
    source: str
    url: str
    title: str
    content: str
    chunk_index: int
    source_type: str
    labels: List[str] = []
    issue_number: Optional[int] = None
