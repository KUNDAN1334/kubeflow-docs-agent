"""
Ingestion for GitHub Issues from kubeflow/docs-agent and kubeflow/kubeflow.
Includes title, body, labels, resolution comments.
"""

import logging
import time
import requests
from typing import List, Dict, Any

from app.config import settings
from app.ingestion.chunker import chunk_document
from app.db.milvus_client import get_milvus_client

logger = logging.getLogger(__name__)


def fetch_issues_from_repo(
    repo: str,
    github_token: str = "",
    state: str = "closed",
    labels: str = "",
    per_page: int = 100,
) -> List[Dict[str, Any]]:
    headers = {"Accept": "application/vnd.github.v3+json"}
    if github_token:
        headers["Authorization"] = f"token {github_token}"

    params = {"state": state, "per_page": per_page}
    if labels:
        params["labels"] = labels

    try:
        resp = requests.get(
            f"https://api.github.com/repos/{repo}/issues",
            headers=headers,
            params=params,
            timeout=30,
        )
        resp.raise_for_status()
        issues = resp.json()
    except Exception as e:
        logger.error(f"Failed to fetch issues from {repo}: {e}")
        return []

    result = []
    for issue in issues:
        if not isinstance(issue, dict) or not issue.get("body"):
            continue
        # Skip pull requests
        if issue.get("pull_request"):
            continue

        # Fetch resolution comments
        comments_text = ""
        comments_url = issue.get("comments_url", "")
        if comments_url and issue.get("comments", 0) > 0:
            try:
                comments_resp = requests.get(
                    comments_url, headers=headers, timeout=10
                )
                if comments_resp.status_code == 200:
                    comments = comments_resp.json()
                    # Get last 3 comments as resolution context
                    for c in comments[-3:]:
                        if c.get("body"):
                            comments_text += f"\n\nComment by {c['user']['login']}:\n{c['body']}"
            except Exception:
                pass

        full_content = f"# {issue['title']}\n\n{issue['body']}"
        if comments_text:
            full_content += f"\n\n## Resolution Comments\n{comments_text}"

        result.append({
            "source": "issues",
            "url": issue["html_url"],
            "title": issue["title"],
            "content": full_content,
            "issue_number": issue["number"],
            "labels": [label["name"] for label in issue.get("labels", [])],
        })

    logger.info(f"Fetched {len(result)} issues from {repo}")
    return result


def fetch_kubeflow_issues(github_token: str = "") -> List[Dict[str, Any]]:
    all_issues = []

    # Primary: kubeflow/docs-agent issues
    docs_agent_issues = fetch_issues_from_repo(
        "kubeflow/docs-agent",
        github_token=github_token,
        state="closed",
        per_page=30,
    )
    all_issues.extend(docs_agent_issues)

    time.sleep(0.5)

    # Secondary: kubeflow/kubeflow bug + question issues
    kf_bug_issues = fetch_issues_from_repo(
        "kubeflow/kubeflow",
        github_token=github_token,
        state="closed",
        labels="bug",
        per_page=20,
    )
    all_issues.extend(kf_bug_issues)

    time.sleep(0.5)

    kf_question_issues = fetch_issues_from_repo(
        "kubeflow/kubeflow",
        github_token=github_token,
        state="closed",
        labels="question",
        per_page=20,
    )
    all_issues.extend(kf_question_issues)

    logger.info(f"Total issues fetched: {len(all_issues)}")
    return all_issues


def ingest_issues(github_token: str = "", mode: str = "incremental") -> Dict[str, Any]:
    from sentence_transformers import SentenceTransformer

    milvus = get_milvus_client()
    embed_model = SentenceTransformer(settings.EMBED_MODEL)

    issues = fetch_kubeflow_issues(github_token or settings.GITHUB_TOKEN)
    if not issues:
        return {"chunks_indexed": 0, "status": "warning", "message": "No issues fetched"}

    total_chunks = 0

    for issue in issues:
        chunks = chunk_document(
            content=issue["content"],
            source_url=issue["url"],
            title=issue["title"],
            source_type="issues",
            metadata={
                "labels": issue.get("labels", []),
                "issue_number": issue.get("issue_number", 0),
            },
        )

        if not chunks:
            continue

        texts = [c["content"] for c in chunks]
        embeddings = embed_model.encode(texts, batch_size=4, show_progress_bar=False)

        data = []
        for chunk, embedding in zip(chunks, embeddings):
            chunk["vector"] = embedding.tolist()
            data.append(chunk)

        upserted = milvus.upsert(settings.ISSUES_COLLECTION, data)
        total_chunks += upserted

    logger.info(f"Issues ingestion complete: {total_chunks} chunks upserted")
    return {
        "chunks_indexed": total_chunks,
        "status": "success",
        "message": f"Upserted {total_chunks} issue chunks from {len(issues)} issues",
    }