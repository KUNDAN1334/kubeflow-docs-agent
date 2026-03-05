"""
Ingestion for Kubeflow Platform Architecture and KEPs (Kubeflow Enhancement Proposals).
Sources: kubeflow/community proposals + architecture overview page.
"""

import logging
import time
import requests
from typing import List, Dict, Any

from app.config import settings
from app.ingestion.chunker import chunk_document
from app.db.milvus_client import get_milvus_client

logger = logging.getLogger(__name__)


def fetch_keps(github_token: str = "") -> List[Dict[str, Any]]:
    headers = {"Accept": "application/vnd.github.v3+json"}
    if github_token:
        headers["Authorization"] = f"token {github_token}"

    logger.info("Fetching Kubeflow community file tree for KEPs...")
    try:
        resp = requests.get(
            "https://api.github.com/repos/kubeflow/community/git/trees/master?recursive=1",
            headers=headers,
            timeout=30,
        )
        resp.raise_for_status()
        tree = resp.json()
    except Exception as e:
        logger.error(f"Failed to fetch community file tree: {e}")
        return []

    kep_files = [
        f for f in tree.get("tree", [])
        if "proposals" in f["path"] and f["path"].endswith(".md")
    ][:50]

    logger.info(f"Found {len(kep_files)} KEP/proposal files")

    keps = []
    for i, f in enumerate(kep_files):
        raw_url = f"https://raw.githubusercontent.com/kubeflow/community/master/{f['path']}"
        try:
            content_resp = requests.get(raw_url, headers=headers, timeout=15)
            if content_resp.status_code != 200:
                continue
            content = content_resp.text

            title = (
                f["path"].split("/")[-1].replace(".md", "").replace("-", " ").title()
            )
            source_url = f"https://github.com/kubeflow/community/blob/master/{f['path']}"

            keps.append({
                "source": "platform",
                "url": source_url,
                "title": title,
                "content": content,
            })

            if (i + 1) % 10 == 0:
                logger.info(f"Fetched {i + 1}/{len(kep_files)} KEPs")
                time.sleep(0.5)

        except Exception as e:
            logger.warning(f"Failed to fetch {f['path']}: {e}")
            continue

    return keps


def fetch_architecture_docs(github_token: str = "") -> List[Dict[str, Any]]:
    """Fetch architecture overview page from Kubeflow website."""
    headers = {}
    if github_token:
        headers["Authorization"] = f"token {github_token}"

    architecture_paths = [
        "content/en/docs/started/architecture.md",
        "content/en/docs/components/pipelines/overview.md",
        "content/en/docs/components/katib/overview.md",
        "content/en/docs/components/training/overview.md",
    ]

    docs = []
    for path in architecture_paths:
        raw_url = f"https://raw.githubusercontent.com/kubeflow/website/master/{path}"
        try:
            resp = requests.get(raw_url, headers=headers, timeout=15)
            if resp.status_code != 200:
                continue
            content = resp.text
            source_url = (
                "https://www.kubeflow.org/"
                + path.replace("content/en/", "").replace(".md", "/")
            )
            title = path.split("/")[-1].replace(".md", "").replace("-", " ").title()
            docs.append({
                "source": "platform",
                "url": source_url,
                "title": f"Architecture: {title}",
                "content": content,
            })
        except Exception as e:
            logger.warning(f"Failed to fetch {path}: {e}")

    return docs


def fetch_platform_architecture(github_token: str = "") -> List[Dict[str, Any]]:
    keps = fetch_keps(github_token)
    arch_docs = fetch_architecture_docs(github_token)
    all_docs = keps + arch_docs
    logger.info(f"Total platform/architecture docs fetched: {len(all_docs)}")
    return all_docs


def ingest_platform(github_token: str = "", mode: str = "incremental") -> Dict[str, Any]:
    from sentence_transformers import SentenceTransformer

    milvus = get_milvus_client()
    embed_model = SentenceTransformer(settings.EMBED_MODEL)

    docs = fetch_platform_architecture(github_token or settings.GITHUB_TOKEN)
    if not docs:
        return {"chunks_indexed": 0, "status": "warning", "message": "No platform docs fetched"}

    total_chunks = 0

    for doc in docs:
        chunks = chunk_document(
            content=doc["content"],
            source_url=doc["url"],
            title=doc["title"],
            source_type="platform",
        )

        if not chunks:
            continue

        texts = [c["content"] for c in chunks]
        embeddings = embed_model.encode(texts, batch_size=32, show_progress_bar=False)

        data = []
        for chunk, embedding in zip(chunks, embeddings):
            chunk["vector"] = embedding.tolist()
            data.append(chunk)

        upserted = milvus.upsert(settings.PLATFORM_COLLECTION, data)
        total_chunks += upserted

    logger.info(f"Platform ingestion complete: {total_chunks} chunks upserted")
    return {
        "chunks_indexed": total_chunks,
        "status": "success",
        "message": f"Upserted {total_chunks} platform chunks from {len(docs)} docs",
    }