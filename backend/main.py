"""
main.py
FastAPI application entry point.
Registers all routes and middleware.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from modules.entities import (
    ChatRequest, ChatResponse, UploadResponse,
    MedicalSummary, HealthResponse, SourceChunk
)
from modules.pdf_parser import extract_text_from_pdf
from modules.ocr import extract_text_with_ocr
from modules.chunking import chunk_pages
from modules.embeddings import embed_texts
from modules.vector_store import build_index, initialize_store
from modules.hybrid_retrieval import build_bm25
from modules.rag_pipeline import run_rag
from modules.medical_summary import get_medical_summary, set_document_text, get_suggested_questions
from modules.voice_handler import handle_voice_websocket   # ← NEW
from typing import List
import uvicorn

app = FastAPI(
    title="Medical AI Assistant API",
    description="Hybrid RAG platform for medical document analysis",
    version="1.0.0"
)

# RISK-05: Explicit CORS origins — never use wildcard in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# RISK-02: Load existing FAISS index and rebuild BM25 on startup
@app.on_event("startup")
async def startup_event():
    from modules.vector_store import chunk_metadata
    initialize_store()
    # Rebuild BM25 from persisted chunk metadata so it survives reloads
    from modules.vector_store import chunk_metadata as loaded_meta
    if loaded_meta:
        build_bm25(loaded_meta)
        print(f"[Startup] BM25 rebuilt from {len(loaded_meta)} persisted chunks.")
    print("[Startup] Medical AI Assistant backend is ready.")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", version="1.0.0")


@app.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    file_bytes = await file.read()

    # File size validation — reject before any processing
    MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20MB
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File too large. Maximum allowed size is 20MB.")

    # Extract text
    extracted = extract_text_from_pdf(file_bytes)
    used_ocr = False

    # RISK-07: Auto OCR fallback if text is sparse
    if extracted["needs_ocr"]:
        print("[Upload] Low-quality text detected. Activating OCR fallback.")
        ocr_pages = extract_text_with_ocr(file_bytes)
        pages = ocr_pages
        used_ocr = True
    else:
        pages = extracted["pages"]

    # Chunk
    chunks = chunk_pages(pages)
    if not chunks:
        raise HTTPException(status_code=422, detail="No text could be extracted from PDF.")

    # Embed (RISK-08: batched internally)
    texts = [c["text"] for c in chunks]
    embeddings = embed_texts(texts)

    # Build indexes (RISK-02: persisted to disk)
    build_index(chunks, embeddings)
    build_bm25(chunks)

    # Store document text for summary generation
    full_text = "\n".join([p["text"] for p in pages])
    set_document_text(full_text)

    return UploadResponse(
        success=True,
        message="Document processed successfully.",
        page_count=extracted["page_count"],
        chunk_count=len(chunks),
        used_ocr=used_ocr
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    response = run_rag(request.question)
    return response


@app.get("/summary", response_model=MedicalSummary)
async def get_summary():
    return get_medical_summary()


@app.get("/questions", response_model=List[str])
async def get_questions():
    """Return dynamically generated clinical questions for the document."""
    return get_suggested_questions()


@app.get("/sources", response_model=List[SourceChunk])
async def get_sources(query: str = ""):
    """Return top sources for a given query."""
    if not query.strip():
        return []
    from modules.hybrid_retrieval import hybrid_search
    from modules.reranker import rerank
    from modules.entities import SourceChunk
    retrieved = hybrid_search(query, top_k=10)
    top = rerank(retrieved, query, top_k=5)
    return [
        SourceChunk(
            chunk_id=c["chunk_id"],
            text=c["text"],
            page=c["page"],
            source=c["source"],
            rerank_score=c.get("rerank_score")
        )
        for c in top
    ]


# ── Voice WebSocket endpoint ─────────────────────────────────────────────────
@app.websocket("/ws/voice")
async def voice_chat(websocket: WebSocket):
    """
    Live multilingual voice chat endpoint.
    Bridges browser audio → Sarvam STT → RAG → Sarvam TTS → browser audio.
    See modules/voice_handler.py for full documentation.
    """
    await handle_voice_websocket(websocket)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
