"""
Singleton embedding model — loaded ONCE at startup.
Prevents OOM by avoiding repeated model loads per request.
"""
import logging
from typing import List

logger = logging.getLogger(__name__)

_model = None


def get_embed_model():
    global _model
    if _model is None:
        logger.info("Loading embedding model (one-time)...")
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(
            "sentence-transformers/all-MiniLM-L6-v2",
            device="cpu",
        )
        # Force garbage collection after load
        import gc
        gc.collect()
        logger.info("Embedding model loaded")
    return _model


def embed_query(query: str) -> List[float]:
    model = get_embed_model()
    return model.encode([query], normalize_embeddings=True)[0].tolist()


def embed_texts(texts: List[str], batch_size: int = 4) -> List[List[float]]:
    model = get_embed_model()
    embeddings = model.encode(texts, batch_size=batch_size, normalize_embeddings=True)
    return [e.tolist() for e in embeddings]