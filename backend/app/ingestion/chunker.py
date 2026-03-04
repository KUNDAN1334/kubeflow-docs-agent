"""
Chunking strategy:
- 800 token chunks with 100 token overlap
- Split on paragraph breaks first, then sentence boundaries
- Upsert-safe: deterministic chunk_id from source+index
"""

import hashlib
import re
from typing import List, Dict, Any


def _estimate_tokens(text: str) -> int:
    """Rough token estimation: ~4 chars per token."""
    return len(text) // 4


def _split_into_paragraphs(text: str) -> List[str]:
    """Split on double newlines (paragraph breaks)."""
    paragraphs = re.split(r"\n\s*\n", text)
    return [p.strip() for p in paragraphs if p.strip()]


def _split_into_sentences(text: str) -> List[str]:
    """Split on sentence boundaries."""
    sentences = re.split(r"(?<=[.!?])\s+", text)
    return [s.strip() for s in sentences if s.strip()]


def _make_chunk_id(source_url: str, chunk_index: int) -> str:
    """Deterministic chunk ID for upsert safety. Fixes Issue #10."""
    raw = f"{source_url}::{chunk_index}"
    return hashlib.sha256(raw.encode()).hexdigest()[:64]


def chunk_document(
    content: str,
    source_url: str,
    title: str,
    source_type: str,
    chunk_size: int = 800,
    overlap: int = 100,
    metadata: Dict[str, Any] = None,
) -> List[Dict[str, Any]]:
    """
    Chunk a document into overlapping segments.
    Returns list of chunk dicts ready for embedding + upsert.
    """
    if metadata is None:
        metadata = {}

    # Strip markdown frontmatter
    content = re.sub(r"^---\n.*?\n---\n", "", content, flags=re.DOTALL)
    content = content.strip()

    if not content:
        return []

    # For short documents (issues), keep together if under chunk_size
    token_count = _estimate_tokens(content)
    if token_count <= chunk_size:
        return [
            {
                "id": _make_chunk_id(source_url, 0),
                "chunk_id": _make_chunk_id(source_url, 0),
                "source_url": source_url,
                "url": source_url,
                "title": title,
                "content": content[:4000],  # Milvus varchar limit safety
                "source_type": source_type,
                "chunk_index": 0,
                "labels": metadata.get("labels", []),
                "issue_number": metadata.get("issue_number", 0),
            }
        ]

    # Split into paragraphs first
    paragraphs = _split_into_paragraphs(content)

    chunks = []
    current_tokens = 0
    current_parts: List[str] = []
    chunk_index = 0

    for para in paragraphs:
        para_tokens = _estimate_tokens(para)

        # If single paragraph exceeds chunk size, split by sentences
        if para_tokens > chunk_size:
            sentences = _split_into_sentences(para)
            for sentence in sentences:
                s_tokens = _estimate_tokens(sentence)
                if current_tokens + s_tokens > chunk_size and current_parts:
                    # Emit current chunk
                    chunk_text = " ".join(current_parts)
                    chunks.append(_build_chunk(
                        chunk_text, source_url, title, source_type,
                        chunk_index, metadata
                    ))
                    chunk_index += 1

                    # Overlap: keep last ~overlap tokens worth of content
                    overlap_text = chunk_text[-(overlap * 4):]
                    current_parts = [overlap_text]
                    current_tokens = _estimate_tokens(overlap_text)

                current_parts.append(sentence)
                current_tokens += s_tokens
        else:
            if current_tokens + para_tokens > chunk_size and current_parts:
                # Emit current chunk
                chunk_text = "\n\n".join(current_parts)
                chunks.append(_build_chunk(
                    chunk_text, source_url, title, source_type,
                    chunk_index, metadata
                ))
                chunk_index += 1

                # Overlap
                overlap_text = chunk_text[-(overlap * 4):]
                current_parts = [overlap_text]
                current_tokens = _estimate_tokens(overlap_text)

            current_parts.append(para)
            current_tokens += para_tokens

    # Final chunk
    if current_parts:
        chunk_text = "\n\n".join(current_parts)
        if chunk_text.strip():
            chunks.append(_build_chunk(
                chunk_text, source_url, title, source_type,
                chunk_index, metadata
            ))

    return chunks


def _build_chunk(
    text: str,
    source_url: str,
    title: str,
    source_type: str,
    chunk_index: int,
    metadata: Dict[str, Any],
) -> Dict[str, Any]:
    chunk_id = _make_chunk_id(source_url, chunk_index)
    return {
        "id": chunk_id,
        "chunk_id": chunk_id,
        "source_url": source_url,
        "url": source_url,
        "title": title,
        "content": text[:4000],  # Safety truncation for Milvus varchar
        "source_type": source_type,
        "chunk_index": chunk_index,
        "labels": metadata.get("labels", []),
        "issue_number": metadata.get("issue_number", 0),
    }
