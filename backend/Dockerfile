FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y build-essential curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install marshmallow first at pinned version, then rest
RUN pip install --no-cache-dir marshmallow==3.21.3
RUN pip install --no-cache-dir -r requirements.txt

# Force correct marshmallow version AFTER all other installs
RUN pip install --no-cache-dir --force-reinstall marshmallow==3.21.3

# Pre-download embedding model
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

# Copy application code
COPY app/ ./app/

# Create directory for Milvus Lite database
RUN mkdir -p /app/data

# Copy pre-ingested Milvus DB
COPY local_milvus.db /app/data/milvus_lite.db

ENV MILVUS_URI=/app/data/milvus_lite.db
ENV NAMESPACE=docs_agent
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

EXPOSE 8000

# Shell form: $PORT gets expanded at runtime (Render injects PORT)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}