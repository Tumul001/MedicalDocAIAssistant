"""
embeddings.py
Generates semantic embeddings using Voyage AI voyage-3.
Batches requests to respect API limits. (RISK-08)
Uses APIKeyManager for key rotation. (RISK-03)
"""

from modules.api_manager import voyage_manager
from typing import List
import voyageai

VOYAGE_MODEL = "voyage-3"   # voyage-large-3 does not exist in voyageai API; voyage-3 is the equivalent
BATCH_SIZE = 8


def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for a list of texts.
    Automatically batches and retries on failure.
    """
    if not texts:
        return []

    all_embeddings = []

    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i + BATCH_SIZE]

        def _call(api_key, _batch=batch):
            client = voyageai.Client(api_key=api_key)
            result = client.embed(_batch, model=VOYAGE_MODEL, input_type="document")
            return result.embeddings

        batch_embeddings = voyage_manager.call_with_retry(_call)
        all_embeddings.extend(batch_embeddings)

    print(f"[Embeddings] Generated {len(all_embeddings)} embeddings using {VOYAGE_MODEL}.")
    return all_embeddings


def embed_query(query: str) -> List[float]:
    """
    Generate embedding for a single query string.
    Uses input_type='query' for retrieval-optimized embedding.
    """
    def _call(api_key):
        client = voyageai.Client(api_key=api_key)
        result = client.embed([query], model=VOYAGE_MODEL, input_type="query")
        return result.embeddings[0]

    return voyage_manager.call_with_retry(_call)
