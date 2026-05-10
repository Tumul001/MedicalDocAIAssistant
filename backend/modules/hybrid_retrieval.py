"""
hybrid_retrieval.py
Combines FAISS semantic search and BM25 keyword search.
Merges results using reciprocal rank fusion.
Guards against empty corpus. (RISK-04)
"""

from rank_bm25 import BM25Okapi
from modules.vector_store import faiss_search
from modules.embeddings import embed_query
from typing import List, Dict, Optional

# BM25 corpus state
_bm25: Optional[BM25Okapi] = None
_bm25_corpus: List[Dict] = []


def build_bm25(chunks: List[Dict]):
    """Build BM25 index from document chunks."""
    global _bm25, _bm25_corpus

    if not chunks:
        print("[BM25] Warning: Empty chunk list. BM25 not built.")
        return

    _bm25_corpus = chunks
    tokenized = [chunk["text"].lower().split() for chunk in chunks]
    _bm25 = BM25Okapi(tokenized)
    print(f"[BM25] Built BM25 index with {len(chunks)} documents.")


def bm25_search(query: str, top_k: int = 10) -> List[Dict]:
    """BM25 keyword search."""
    # RISK-04: guard against empty corpus
    if _bm25 is None or not _bm25_corpus:
        return []

    tokenized_query = query.lower().split()
    scores = _bm25.get_scores(tokenized_query)

    top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]

    results = []
    for idx in top_indices:
        if scores[idx] > 0:
            result = dict(_bm25_corpus[idx])
            result["bm25_score"] = float(scores[idx])
            results.append(result)

    return results


def hybrid_search(query: str, top_k: int = 10) -> List[Dict]:
    """
    Combine FAISS and BM25 results using Reciprocal Rank Fusion.
    Returns merged and deduplicated results ranked by combined score.
    """
    query_embedding = embed_query(query)
    faiss_results = faiss_search(query_embedding, top_k=top_k)
    bm25_results = bm25_search(query, top_k=top_k)

    # Reciprocal Rank Fusion
    rrf_scores = {}
    k = 60  # RRF constant

    for rank, result in enumerate(faiss_results):
        cid = result["chunk_id"]
        rrf_scores[cid] = rrf_scores.get(cid, 0) + 1.0 / (k + rank + 1)

    for rank, result in enumerate(bm25_results):
        cid = result["chunk_id"]
        rrf_scores[cid] = rrf_scores.get(cid, 0) + 1.0 / (k + rank + 1)

    # Merge unique results
    all_chunks = {r["chunk_id"]: r for r in faiss_results + bm25_results}

    ranked = sorted(
        all_chunks.values(),
        key=lambda r: rrf_scores.get(r["chunk_id"], 0),
        reverse=True
    )

    return ranked[:top_k]
