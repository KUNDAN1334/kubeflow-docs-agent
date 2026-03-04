"""
Ingestion for Kubeflow Official Documentation.
Fetches markdown from kubeflow/website GitHub repo.
Uses upsert (never drop) - fixes Issue #10.
"""

import logging
import time
import requests
from typing import List, Dict, Any

from app.config import settings
from app.ingestion.chunker import chunk_document
from app.db.milvus_client import get_milvus_client

logger = logging.getLogger(__name__)


def fetch_kubeflow_docs(github_token: str = "") -> List[Dict[str, Any]]:
    headers = {}
    if github_token:
        headers["Authorization"] = f"token {github_token}"

    logger.info("Fetching Kubeflow website file tree...")
    try:
        resp = requests.get(
            "https://api.github.com/repos/kubeflow/website/git/trees/master?recursive=1",
            headers=headers,
            timeout=30,
        )
        resp.raise_for_status()
        tree = resp.json()
    except Exception as e:
        logger.error(f"Failed to fetch file tree: {e}")
        return []

    md_files = [
        f for f in tree.get("tree", [])
        if f["path"].startswith("content/en/docs") and f["path"].endswith(".md")
    ][:100]

    logger.info(f"Found {len(md_files)} documentation files to fetch")

    docs = []
    for i, f in enumerate(md_files):
        raw_url = f"https://raw.githubusercontent.com/kubeflow/website/master/{f['path']}"
        try:
            content_resp = requests.get(raw_url, headers=headers, timeout=15)
            if content_resp.status_code != 200:
                continue
            content = content_resp.text

            source_url = (
                "https://www.kubeflow.org/"
                + f["path"].replace("content/en/", "").replace(".md", "/")
            )
            title = (
                f["path"].split("/")[-1].replace(".md", "").replace("-", " ").title()
            )

            docs.append({
                "source": "docs",
                "url": source_url,
                "title": title,
                "content": content,
            })

            if (i + 1) % 10 == 0:
                logger.info(f"Fetched {i + 1}/{len(md_files)} docs")
                time.sleep(0.5)  # Rate limiting

        except Exception as e:
            logger.warning(f"Failed to fetch {f['path']}: {e}")
            continue

    logger.info(f"Successfully fetched {len(docs)} documentation pages")
    return docs


def ingest_docs(github_token: str = "", mode: str = "incremental") -> Dict[str, Any]:
    """
    Ingest Kubeflow docs into Milvus.
    Uses upsert — never drops the collection.
    """
    from sentence_transformers import SentenceTransformer

    milvus = get_milvus_client()
    embed_model = SentenceTransformer(settings.EMBED_MODEL)

    docs = fetch_kubeflow_docs(github_token or settings.GITHUB_TOKEN)
    if not docs:
        return {"chunks_indexed": 0, "status": "warning", "message": "No docs fetched"}

    total_chunks = 0

    for doc in docs:
        chunks = chunk_document(
            content=doc["content"],
            source_url=doc["url"],
            title=doc["title"],
            source_type="docs",
        )

        if not chunks:
            continue

        # Embed all chunks in batch
        texts = [c["content"] for c in chunks]
        embeddings = embed_model.encode(texts, batch_size=32, show_progress_bar=False)

        data = []
        for chunk, embedding in zip(chunks, embeddings):
            chunk["embedding"] = embedding.tolist()
            data.append(chunk)

        upserted = milvus.upsert(settings.DOCS_COLLECTION, data)
        total_chunks += upserted

    logger.info(f"Docs ingestion complete: {total_chunks} chunks upserted")
    return {
        "chunks_indexed": total_chunks,
        "status": "success",
        "message": f"Upserted {total_chunks} doc chunks from {len(docs)} pages",
    }
