"""
reranker.py
Reranks retrieved chunks by:
1. FAISS semantic similarity score
2. BM25 keyword overlap
3. Medical terminology density
Returns top_k highest quality chunks.
"""

from typing import List, Dict

MEDICAL_TERMS = {
    "diagnosis", "prescription", "dosage", "allergy", "symptom",
    "disease", "medication", "lab", "blood", "glucose", "hemoglobin",
    "cholesterol", "fever", "infection", "surgery", "chronic",
    "acute", "biopsy", "radiology", "ecg", "mri", "ct scan",
    "abnormal", "normal", "elevated", "reduced", "prescribed",
    "mg", "ml", "mmol", "units", "tablet", "injection"
}


def rerank(chunks: List[Dict], query: str, top_k: int = 5) -> List[Dict]:
    """
    Score each chunk and return top_k best results.
    Combines: faiss_score + bm25_score + medical_term_density
    """
    query_lower = query.lower()

    def score(chunk: Dict) -> float:
        faiss_score = chunk.get("faiss_score", 0.0)
        bm25_score = chunk.get("bm25_score", 0.0)

        # Normalize bm25 (can be large values)
        bm25_normalized = min(bm25_score / 10.0, 1.0)

        text_lower = chunk["text"].lower()
        words = set(text_lower.split())
        medical_hits = len(words & MEDICAL_TERMS)
        medical_density = min(medical_hits / max(len(words), 1) * 10, 1.0)

        return (faiss_score * 0.5) + (bm25_normalized * 0.3) + (medical_density * 0.2)

    scored = [(chunk, score(chunk)) for chunk in chunks]
    scored.sort(key=lambda x: x[1], reverse=True)

    top_chunks = []
    for chunk, final_score in scored[:top_k]:
        result = dict(chunk)
        result["rerank_score"] = round(final_score, 4)
        top_chunks.append(result)

    return top_chunks
