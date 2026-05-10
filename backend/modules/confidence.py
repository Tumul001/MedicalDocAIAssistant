"""
confidence.py
Computes confidence level based on TWO signals:
  1. Retrieval quality (rerank_score from FAISS + BM25 + medical density)
  2. Answer grounding  (fraction of answer keywords that appear in retrieved chunks)

The grounding signal corrects a key weakness: query-to-chunk similarity is
inherently low for conversational questions ("What is the patient's name?")
even when the answer is verbatim in the document. Grounding catches this.
"""

import re
from typing import List, Dict

# ---------- Retrieval thresholds (calibrated to reranker range 0.10–0.55) ----------
HIGH_THRESHOLD   = 0.40
MEDIUM_THRESHOLD = 0.22

# Stopwords excluded from grounding check
_STOPWORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "has", "have", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "of", "in", "on", "at",
    "to", "for", "with", "by", "from", "up", "and", "or", "but", "nor",
    "so", "yet", "both", "either", "that", "this", "their", "which",
    "patient", "based", "according", "document", "states", "notes",
    "information", "provided", "shows", "indicates", "mentions",
}


def _grounding_score(answer: str, chunks: List[Dict]) -> float:
    """
    Fraction of meaningful answer words that appear in the retrieved context.
    Returns 0.0 – 1.0. Higher = answer is directly supported by the text.
    """
    if not chunks or not answer:
        return 0.0

    context_text = " ".join(c.get("text", "").lower() for c in chunks)

    # Extract meaningful words (length > 2, not stopwords, no punctuation)
    tokens = re.findall(r"[a-zA-Z0-9']+", answer.lower())
    content_words = [t for t in tokens if len(t) > 2 and t not in _STOPWORDS]

    if not content_words:
        return 0.5  # neutral — can't assess

    matched = sum(1 for w in content_words if w in context_text)
    return matched / len(content_words)


def compute_confidence(chunks: List[Dict], answer: str = "") -> Dict:
    """
    Compute confidence from retrieval quality + answer grounding.

    Grounding override rules:
      - grounding >= 0.75 AND retrieval is Medium → promote to High
      - grounding >= 0.50 AND retrieval is Low    → promote to Medium
      - grounding <  0.30                         → cap at Medium (answer not well supported)

    Returns:
        {"level": "High"|"Medium"|"Low", "score": float}
    """
    if not chunks:
        return {"level": "Low", "score": 0.0}

    # Signal 1: retrieval quality
    top_score = chunks[0].get("rerank_score", chunks[0].get("faiss_score", 0.0))

    if top_score >= HIGH_THRESHOLD:
        level = "High"
    elif top_score >= MEDIUM_THRESHOLD:
        level = "Medium"
    else:
        level = "Low"

    # Signal 2: answer grounding (only when an answer is provided)
    if answer:
        grounding = _grounding_score(answer, chunks)

        # Promote: answer is directly in the retrieved text
        if grounding >= 0.75 and level == "Medium":
            level = "High"
        elif grounding >= 0.50 and level == "Low":
            level = "Medium"

        # Demote: answer keywords barely appear in context (hallucination risk)
        if grounding < 0.30 and level == "High":
            level = "Medium"

    return {"level": level, "score": round(top_score, 4)}
