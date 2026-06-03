"""
safety.py
Validates retrieval quality before generating answers.
Prevents hallucination by detecting weak evidence.
"""

from typing import List, Dict

INSUFFICIENT_EVIDENCE_RESPONSE = (
    "Insufficient medical evidence found in uploaded document."
)

MIN_CHUNKS_REQUIRED = 1
# Lowered from 0.10 → 0.04 so that general/meta questions
# (which score low on BM25 but have moderate FAISS hits) still
# reach the LLM. The LLM prompt now handles the "no relevant
# context" case itself, so the safety gate only needs to catch
# truly empty retrievals (index empty or query completely off-topic).
MIN_RERANK_SCORE = 0.04


def is_evidence_sufficient(chunks: List[Dict]) -> bool:
    """
    Return True only if retrieval produced usable medical context.
    """
    if not chunks or len(chunks) < MIN_CHUNKS_REQUIRED:
        return False

    top_score = chunks[0].get("rerank_score", 0.0)
    return top_score >= MIN_RERANK_SCORE


def get_fallback_response() -> str:
    return INSUFFICIENT_EVIDENCE_RESPONSE
