import os
from typing import List


class Settings:
    # API Keys
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")

    # Milvus
    MILVUS_URI: str = os.getenv("MILVUS_URI", "./milvus_lite.db")
    NAMESPACE: str = os.getenv("NAMESPACE", "docs-agent")

    # Collections
    DOCS_COLLECTION: str = f"{os.getenv('NAMESPACE', 'docs-agent')}_docs"
    ISSUES_COLLECTION: str = f"{os.getenv('NAMESPACE', 'docs-agent')}_issues"
    PLATFORM_COLLECTION: str = f"{os.getenv('NAMESPACE', 'docs-agent')}_platform"

    # CORS
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "*").split(",")

    # Model
    GROQ_MODEL: str = "llama-3.1-8b-instant"
    EMBED_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBED_DIM: int = 384

    # Chunking
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 100

    # Retrieval
    TOP_K: int = 5

    # Groq API
    GROQ_API_URL: str = "https://api.groq.com/openai/v1/chat/completions"


settings = Settings()
