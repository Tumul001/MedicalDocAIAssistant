"""
vector_store.py
Manages FAISS vector index.
Persists index to disk to survive server restarts. (RISK-02)
"""

import faiss
import numpy as np
import pickle
import os
from typing import List, Dict, Optional

INDEX_PATH = "faiss_index.bin"
META_PATH = "faiss_meta.pkl"

# Global state
faiss_index: Optional[faiss.Index] = None
chunk_metadata: List[Dict] = []


def initialize_store():
    """Load existing index from disk if available."""
    global faiss_index, chunk_metadata

    if os.path.exists(INDEX_PATH) and os.path.exists(META_PATH):
        try:
            faiss_index = faiss.read_index(INDEX_PATH)
            with open(META_PATH, "rb") as f:
                chunk_metadata = pickle.load(f)
            print(f"[VectorStore] Loaded existing index with {faiss_index.ntotal} vectors.")
        except Exception as e:
            print(f"[VectorStore] Failed to load existing index: {e}. Starting fresh.")
            faiss_index = None
            chunk_metadata = []


def build_index(chunks: List[Dict], embeddings: List[List[float]]):
    """Build FAISS index from chunks and their embeddings."""
    global faiss_index, chunk_metadata

    if not embeddings:
        raise ValueError("[VectorStore] Cannot build index with empty embeddings.")

    dim = len(embeddings[0])
    index = faiss.IndexFlatIP(dim)  # Inner product (cosine similarity with normalized vecs)

    vectors = np.array(embeddings, dtype=np.float32)
    # Normalize for cosine similarity
    faiss.normalize_L2(vectors)
    index.add(vectors)

    faiss_index = index
    chunk_metadata = chunks

    # Persist to disk
    faiss.write_index(faiss_index, INDEX_PATH)
    with open(META_PATH, "wb") as f:
        pickle.dump(chunk_metadata, f)

    print(f"[VectorStore] Built and saved index with {index.ntotal} vectors.")


def faiss_search(query_embedding: List[float], top_k: int = 10) -> List[Dict]:
    """Search FAISS index and return top_k results with scores."""
    if faiss_index is None or faiss_index.ntotal == 0:
        print("[VectorStore] Index is empty. Returning no results.")
        return []

    query_vec = np.array([query_embedding], dtype=np.float32)
    faiss.normalize_L2(query_vec)

    scores, indices = faiss_index.search(query_vec, min(top_k, faiss_index.ntotal))

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx >= 0 and idx < len(chunk_metadata):
            result = dict(chunk_metadata[idx])
            result["faiss_score"] = float(score)
            results.append(result)

    return results
