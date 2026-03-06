FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y build-essential curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install marshmallow first at pinned version
RUN pip install --no-cache-dir marshmallow==3.21.3

# Install without torch (use CPU-only torch)
RUN pip install --no-cache-dir \
    fastapi==0.111.0 \
    uvicorn[standard]==0.30.1 \
    milvus-lite==2.4.12 \
    pymilvus==2.4.3 \
    httpx==0.27.0 \
    pydantic==2.7.1 \
    python-dotenv==1.0.1 \
    requests==2.32.3 \
    numpy==1.26.4

# Install torch CPU-only (much smaller than full torch)
RUN pip install --no-cache-dir torch==2.1.0 --index-url https://download.pytorch.org/whl/cpu

# Install sentence-transformers after CPU torch
RUN pip install --no-cache-dir \
    sentence-transformers==3.0.1 \
    transformers==4.40.0 \
    huggingface-hub==0.23.0

# Re-pin marshmallow
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
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT