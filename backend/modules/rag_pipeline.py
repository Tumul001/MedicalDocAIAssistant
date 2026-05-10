"""
rag_pipeline.py
Orchestrates the full RAG pipeline:
1. Hybrid retrieval
2. Reranking
3. Safety check
4. Groq LLM generation
"""

from modules.hybrid_retrieval import hybrid_search
from modules.reranker import rerank
from modules.safety import is_evidence_sufficient, get_fallback_response
from modules.confidence import compute_confidence
from modules.prompts import MEDICAL_SYSTEM_PROMPT
from modules.api_manager import groq_manager
from modules.entities import ChatResponse, SourceChunk
import groq as groq_sdk


def run_rag(question: str) -> ChatResponse:
    """
    Full RAG pipeline for a medical question.
    """
    # Step 1: Hybrid retrieval
    retrieved = hybrid_search(question, top_k=10)

    # Step 2: Reranking
    top_chunks = rerank(retrieved, question, top_k=5)

    # Step 3: Safety check
    if not is_evidence_sufficient(top_chunks):
        return ChatResponse(
            answer=get_fallback_response(),
            confidence={"level": "Low", "score": 0.0},
            sources=[]
        )

    # Step 4: Build context
    context = "\n\n---\n\n".join(
        [f"[Page {c['page']}]\n{c['text']}" for c in top_chunks]
    )

    system_prompt = MEDICAL_SYSTEM_PROMPT.format(context=context)

    # Step 5: LLM generation with key rotation
    def _call_groq(api_key: str) -> str:
        client = groq_sdk.Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            temperature=0.1,
            max_tokens=1024
        )
        return response.choices[0].message.content

    answer = groq_manager.call_with_retry(_call_groq)

    # Step 6: Confidence scoring (retrieval quality + answer grounding)
    confidence = compute_confidence(top_chunks, answer=answer)

    # Step 7: Format sources
    sources = [
        SourceChunk(
            chunk_id=c["chunk_id"],
            text=c["text"],
            page=c["page"],
            source=c["source"],
            rerank_score=c.get("rerank_score")
        )
        for c in top_chunks
    ]

    return ChatResponse(answer=answer, confidence=confidence, sources=sources)
