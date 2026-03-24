#  Kubeflow Docs Agent

## Live Demo
https://www.loom.com/share/9389c6aa0bae4e949d6024c4438838a4

> **Frontend:** 
> **Backend API:**
---

> **Agentic RAG system** that answers Kubeflow questions using multi-source retrieval across official docs, GitHub issues, and platform architecture/KEPs.



---

##  Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER BROWSER                          │
│              React + TypeScript (Vercel)                 │
└──────────────────────┬──────────────────────────────────┘
                       │ SSE Streaming
                       ▼
┌─────────────────────────────────────────────────────────┐
│              FastAPI Backend (Railway)                   │
│                                                          │
│  POST /chat ──► Intent Router ──► Tool Selector         │
│                                   │                      │
│                     ┌─────────────┼──────────────┐       │
│                     ▼             ▼              ▼       │
│              search_docs   search_issues  search_platform│
│                     │             │              │       │
│                     └─────────────┼──────────────┘       │
│                                   ▼                      │
│                         Milvus Lite (3 collections)      │
│                                   │                      │
│                                   ▼                      │
│                    Groq API (llama-3.1-8b-instant)       │
│                    Streaming Response                     │
└─────────────────────────────────────────────────────────┘

Data Sources Indexed:
  ├── kubeflow/website  ──► docs collection (100 pages)
  ├── kubeflow/docs-agent issues ──► issues collection
  ├── kubeflow/kubeflow issues ──► issues collection
  └── kubeflow/community proposals ──► platform collection
```

---

## Quick Start (3 commands)

```bash
git clone https://github.com/YOUR_USERNAME/kubeflow-docs-agent
cp backend/.env.example backend/.env && nano backend/.env
docker-compose up
```

Then visit **http://localhost:3000** for the UI, or **http://localhost:8000** for the API.

After startup, trigger ingestion:
```bash
curl -X POST http://localhost:8000/ingest -H "Content-Type: application/json" \
  -d '{"source": "docs", "mode": "incremental"}'
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` |  Yes | Free at [console.groq.com](https://console.groq.com) |
| `GITHUB_TOKEN` |  Yes | [github.com/settings/tokens](https://github.com/settings/tokens) — `public_repo` read scope |
| `MILVUS_URI` | No | Default: `./milvus_lite.db` — path to Milvus Lite file |
| `NAMESPACE` | No | Default: `docs-agent` — prefixes all collection names |
| `CORS_ORIGINS` | No | Default: `*` — or set to your Vercel domain |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` |  Yes | Your Railway backend URL, e.g. `https://your-app.railway.app` |

---

##  Solves Issues

This POC directly addresses the following open issues in the `kubeflow/docs-agent` repository:

| Issue | Problem | Fix |
|---|---|---|
| **#28** | New `MilvusClient` created per request (connection exhaustion) | Singleton `_MilvusClientSingleton` initialized once at startup, shared across all requests |
| **#10** | Collections dropped on every run (data loss) | Partition-based upsert using deterministic `chunk_id` — `_ensure_collections()` never drops |
| **#91** | Hardcoded namespace `docs-agent` throughout codebase | All values read from `os.getenv("NAMESPACE", "docs-agent")` and `os.getenv("MILVUS_URI")` |
| **Decommissioned model** | `llama3-8b-8192` removed from Groq | Updated to `llama-3.1-8b-instant` in `config.py` |
| **Single tool** | Only one MCP tool, no routing | 3 tools: `search_docs`, `search_issues`, `search_platform` with intent-based routing |
| **Per-request httpx** | `httpx.AsyncClient()` created per request | Singleton `_HttpClientSingleton` with connection pooling |
| **No monitoring** | No observability | `/metrics` endpoint: `query_count`, `tool_usage`, `avg_latency_ms`, `cache_hits` |
| **No multi-source** | Only one data source | 3 Milvus collections from 4 real GitHub data sources |

---

## API Endpoints

### `POST /chat`
Streaming chat with SSE.
```json
{ "query": "How do I install Kubeflow on GKE?", "session_id": "abc123" }
```
Stream events:
- `{"type": "tool_start", "tool_used": "search_docs"}`
- `{"type": "source", "sources": [...], "tool_used": "search_docs"}`
- `{"type": "token", "content": "To install Kubeflow..."}`
- `{"type": "done", "latency_ms": 1240, "tool_used": "search_docs"}`

### `POST /ingest`
Trigger data ingestion.
```json
{ "source": "docs", "mode": "incremental" }
```
Sources: `docs` | `issues` | `platform`
Modes: `incremental` (upsert) | `full` (upsert all)

### `GET /health`
Returns collection counts + model info.

### `GET /metrics`
Returns `query_count`, `tool_usage` breakdown, `avg_latency_ms`, `cache_hits`.

### `GET /collections/stats`
Per-collection entity counts.

---

##  Query Routing Logic

| Query contains | Routes to | Collection |
|---|---|---|
| bug, error, issue, not working, fails, exception, crash | `search_issues` | GitHub Issues |
| why, design, architecture, kep, decision, roadmap | `search_platform` | KEPs + Architecture |
| everything else | `search_docs` | Official Documentation |

---

##  Tech Stack

**Backend:** Python 3.11 · FastAPI · Milvus Lite · `sentence-transformers/all-MiniLM-L6-v2` · Groq `llama-3.1-8b-instant` · httpx · Pydantic v2

**Frontend:** React 18 · TypeScript · Vite · Kubeflow color palette

**Deployment:** Railway (backend) · Vercel (frontend)

---

##  Manual Deployment

### Backend → Railway

1. Push `backend/` to GitHub
2. Create new Railway project → "Deploy from GitHub"
3. Set environment variables in Railway dashboard
4. Railway auto-detects `railway.json` and `Dockerfile`

### Frontend → Vercel

1. Push `frontend/` to GitHub
2. Import to Vercel, set framework: Vite
3. Set `VITE_API_URL=https://your-railway-app.railway.app`
4. Deploy

### Post-deployment: Ingest data

```bash
# Ingest all three sources (takes ~5-10 mins total)
curl -X POST https://your-app.railway.app/ingest \
  -H "Content-Type: application/json" \
  -d '{"source": "docs", "mode": "incremental"}'

curl -X POST https://your-app.railway.app/ingest \
  -H "Content-Type: application/json" \
  -d '{"source": "issues", "mode": "incremental"}'

curl -X POST https://your-app.railway.app/ingest \
  -H "Content-Type: application/json" \
  -d '{"source": "platform", "mode": "incremental"}'
```

---

##  Project Structure

```
kubeflow-docs-agent/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, all endpoints
│   │   ├── agent.py             # Query routing + LLM streaming
│   │   ├── config.py            # Settings from env vars
│   │   ├── tools/
│   │   │   ├── search_docs.py
│   │   │   ├── search_issues.py
│   │   │   └── search_platform.py
│   │   ├── ingestion/
│   │   │   ├── ingest_docs.py
│   │   │   ├── ingest_issues.py
│   │   │   ├── ingest_platform.py
│   │   │   └── chunker.py
│   │   ├── db/
│   │   │   ├── milvus_client.py  # Singleton (fixes #28)
│   │   │   └── http_client.py    # Singleton httpx
│   │   └── models/
│   │       └── schemas.py
│   ├── Dockerfile
│   ├── railway.json
│   ├── requirements.txt
│   └── .env.example
├── frontend/                     # React + TypeScript
│   └── ...
├── docker-compose.yml
└── README.md
```
