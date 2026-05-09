# 🏥 Medical AI Assistant

> A production-grade, hybrid RAG (Retrieval-Augmented Generation) platform for intelligent medical document analysis. Upload any medical PDF — lab reports, prescriptions, discharge summaries — and get grounded, evidence-backed answers powered by Groq LLaMA 3.3 and Voyage AI embeddings.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Directory](#project-directory)
- [Architecture](#architecture)
- [Detailed Workflow](#detailed-workflow)
- [Backend Modules](#backend-modules)
- [Frontend Components](#frontend-components)
- [API Reference](#api-reference)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Security & Validation](#security--validation)
- [Confidence Scoring System](#confidence-scoring-system)
- [Running the Application](#running-the-application)

---

## Overview

The Medical AI Assistant is a full-stack AI application that processes medical PDF documents and enables intelligent question-answering through a hybrid Retrieval-Augmented Generation (RAG) pipeline. It combines semantic vector search (FAISS) with keyword search (BM25) and uses Groq's LLaMA 3.3 70B model for grounded answer generation — ensuring every response is traceable to the source document.

---

## Features

| Feature | Description |
|---|---|
| 📤 **PDF Upload** | Drag-and-drop upload with 20MB limit and PDF-only validation |
| 🔍 **Hybrid Search** | FAISS semantic + BM25 keyword retrieval merged via Reciprocal Rank Fusion |
| 🤖 **Grounded Chat** | LLaMA 3.3 70B answers strictly from document context — no hallucination |
| 📊 **Confidence Scoring** | Two-signal scoring: retrieval quality + answer grounding |
| 🧬 **Medical Summary** | Auto-extracts diseases, medications, allergies, abnormalities, recommendations |
| 🔎 **Evidence Viewer** | Search and inspect raw retrieved document chunks with scores |
| 🔄 **OCR Fallback** | Automatic OCR (EasyOCR) for scanned/image-based PDFs |
| 🔑 **API Key Rotation** | Multi-key round-robin rotation for Groq and Voyage AI |
| 💾 **Index Persistence** | FAISS index persisted to disk; BM25 rebuilt from metadata on startup |
| 🛡️ **Safety Guard** | Rejects LLM calls when retrieval evidence is insufficient |

---

## Tech Stack

### Backend
| Package | Version | Role |
|---|---|---|
| `fastapi` | 0.136.1 | REST API framework |
| `uvicorn` | 0.46.0 | ASGI server |
| `pydantic` | 2.13.4 | Request/response validation |
| `python-multipart` | 0.0.27 | File upload handling |
| `python-dotenv` | 1.2.2 | Environment variable loading |
| `PyMuPDF` | 1.27.2.3 | PDF text extraction |
| `easyocr` | 1.7.2 | OCR for scanned PDFs |
| `voyageai` | 0.2.4 | Voyage AI `voyage-3` embeddings |
| `faiss-cpu` | 1.13.2 | Vector similarity search |
| `rank-bm25` | 0.2.2 | BM25 keyword search |
| `langchain-text-splitters` | 1.1.2 | Recursive character text splitting |
| `groq` | 1.2.0 | Groq LLaMA 3.3 70B API |
| `numpy` | 2.4.4 | Vector operations |
| `pillow` | 12.2.0 | Image processing for OCR |
| `httpx` | 0.28.1 | Async HTTP client |

### Frontend
| Package | Version | Role |
|---|---|---|
| `react` | 18.3.1 | UI framework |
| `react-router-dom` | 6.23.1 | Client-side routing |
| `axios` | 1.7.2 | HTTP requests to backend |
| `vite` | 5.2.13 | Build tool & dev server |
| `tailwindcss` | 3.4.4 | Utility-first CSS framework |

---

## Project Directory

```
medical-ai-assistant/
│
├── backend/
│   ├── main.py                    # FastAPI app entry point — all routes & middleware
│   ├── requirements.txt           # Pinned Python dependencies (== versions)
│   ├── .env                       # API keys (GROQ_API_KEYS, VOYAGE_API_KEYS)
│   ├── faiss_index.bin            # Persisted FAISS index (auto-generated)
│   ├── faiss_meta.pkl             # Persisted chunk metadata (auto-generated)
│   └── modules/
│       ├── __init__.py
│       ├── api_manager.py         # Multi-key rotation for Groq & Voyage AI
│       ├── chunking.py            # RecursiveCharacterTextSplitter (700 chars, 120 overlap)
│       ├── confidence.py          # Two-signal confidence: retrieval + answer grounding
│       ├── embeddings.py          # Voyage AI voyage-3 embeddings (batch=8)
│       ├── entities.py            # Pydantic v2 schemas for all request/response models
│       ├── hybrid_retrieval.py    # FAISS + BM25 → Reciprocal Rank Fusion
│       ├── medical_summary.py     # LLM-based structured entity extraction
│       ├── ocr.py                 # EasyOCR fallback for scanned PDFs
│       ├── pdf_parser.py          # PyMuPDF text extraction with OCR detection
│       ├── prompts.py             # Centralized LLM prompt templates
│       ├── rag_pipeline.py        # Full RAG orchestrator (retrieve → rerank → generate)
│       ├── reranker.py            # Score-based reranker: FAISS + BM25 + medical density
│       ├── safety.py              # Evidence sufficiency guard (anti-hallucination)
│       └── vector_store.py        # FAISS index build, search, persist, load
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx               # React entry point
│       ├── App.jsx                # Router setup with MainLayout wrapper
│       ├── index.css              # Global styles & custom CSS variables
│       ├── layouts/
│       │   └── MainLayout.jsx     # Sidebar + main content flex layout
│       ├── pages/
│       │   ├── Dashboard.jsx      # Upload page with health indicator
│       │   ├── ChatAssistant.jsx  # Medical Q&A chat interface
│       │   ├── MedicalSummary.jsx # Structured summary extraction
│       │   └── EvidenceViewer.jsx # Raw chunk search & inspection
│       ├── components/
│       │   ├── ChatBubble.jsx     # User/assistant message bubble with sources
│       │   ├── ConfidenceBadge.jsx# Normalized confidence level badge
│       │   ├── ErrorAlert.jsx     # Dismissible error banner
│       │   ├── LoadingSpinner.jsx # Animated loading indicator
│       │   ├── Navbar.jsx         # (utility navigation component)
│       │   ├── SourceCard.jsx     # Retrieved chunk display card
│       │   ├── SummarySection.jsx # Medical entity category card
│       │   └── UploadCard.jsx     # Drag-and-drop PDF uploader with validation
│       ├── context/
│       │   └── DocumentContext.jsx# Global state: document loaded, chat history, summary
│       ├── hooks/
│       │   └── useDocument.js     # Custom hook for document context
│       └── services/
│           └── api.js             # Axios instance + all API call functions
│
└── real_demo_medical_pdfs/        # Sample PDFs for testing
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)               │
│                        localhost:5173                        │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────┐  │
│  │Dashboard │  │ChatAssistant │  │ Medical  │  │Evidence│  │
│  │(Upload)  │  │  (Q&A Chat)  │  │ Summary  │  │Viewer  │  │
│  └────┬─────┘  └──────┬───────┘  └────┬─────┘  └───┬────┘  │
│       │               │               │             │       │
│       └───────────────┴───────────────┴─────────────┘       │
│                            Axios (api.js)                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP
┌──────────────────────────────▼──────────────────────────────┐
│                    BACKEND (FastAPI + Uvicorn)               │
│                        localhost:8000                        │
│                                                             │
│  POST /upload   POST /chat   GET /summary   GET /sources    │
│       │              │            │               │         │
│       ▼              ▼            ▼               ▼         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  RAG PIPELINE                       │    │
│  │                                                     │    │
│  │  PDF → Parse → OCR? → Chunk → Embed → FAISS+BM25   │    │
│  │                                                     │    │
│  │  Query → Embed → Hybrid Search → Rerank → Safety   │    │
│  │       → Groq LLaMA 3.3 70B → Confidence Score      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐    │
│  │  Voyage AI   │  │  Groq API    │  │ FAISS + BM25   │    │
│  │  voyage-3    │  │llama-3.3-70b │  │ (Local Index)  │    │
│  │  Embeddings  │  │  Versatile   │  │  + Disk Cache  │    │
│  └──────────────┘  └──────────────┘  └────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Detailed Workflow

### 1. Document Upload Pipeline

```
User selects PDF
      │
      ▼
[UploadCard.jsx] ──── Client-side validation ────▶ Reject if:
      │                                             • Not a PDF (file.type check)
      │                                             • > 20MB (file.size check)
      ▼
POST /upload (multipart/form-data)
      │
      ▼
[main.py /upload]
      │
      ├─ Validate: .pdf extension
      ├─ Validate: size <= 20MB (server-side, MAX_UPLOAD_BYTES)
      │
      ▼
[pdf_parser.py] extract_text_from_pdf()
      │  Uses PyMuPDF (fitz) to extract text per page
      │  Detects low-quality text: if avg chars/page < 100 → needs_ocr = True
      │
      ├─ needs_ocr = False ──▶ Use extracted pages directly
      │
      └─ needs_ocr = True ───▶ [ocr.py] extract_text_with_ocr()
                                 EasyOCR processes each PDF page as image
      │
      ▼
[chunking.py] chunk_pages()
      │  RecursiveCharacterTextSplitter
      │  chunk_size=700, chunk_overlap=120
      │  Separators: ["\n\n", "\n", ". ", " ", ""]
      │  Each chunk: {chunk_id, text, page, source}
      │
      ▼
[embeddings.py] embed_texts()
      │  Voyage AI voyage-3 model
      │  Batches of 8 chunks per API call
      │  input_type="document"
      │  Returns List[List[float]] dim=1024
      │
      ▼
[vector_store.py] build_index()
      │  FAISS IndexFlatIP (inner product = cosine after L2 normalization)
      │  Vectors normalized with faiss.normalize_L2()
      │  Index + metadata pickled to faiss_index.bin / faiss_meta.pkl
      │
[hybrid_retrieval.py] build_bm25()
      │  BM25Okapi built from tokenized chunk texts
      │  Stored in-memory (_bm25, _bm25_corpus)
      │
[medical_summary.py] set_document_text()
      │  Full document text stored in-memory for /summary endpoint
      │
      ▼
UploadResponse { success, message, page_count, chunk_count, used_ocr }
```

### 2. Chat / RAG Pipeline

```
User types question
      │
      ▼
POST /chat { question: string }
      │
      ▼
[rag_pipeline.py] run_rag(question)
      │
      ├─── Step 1: Hybrid Retrieval ──────────────────────────────────
      │    [embeddings.py] embed_query(question)
      │      Voyage AI voyage-3, input_type="query", dim=1024
      │
      │    [vector_store.py] faiss_search(query_embedding, top_k=10)
      │      Cosine similarity search → top 10 chunks
      │
      │    [hybrid_retrieval.py] bm25_search(question, top_k=10)
      │      BM25Okapi keyword scores → top 10 chunks (score > 0 only)
      │
      │    Reciprocal Rank Fusion (k=60):
      │      score(chunk) = Σ 1/(k + rank)  for FAISS and BM25 ranks
      │      Deduplicate by chunk_id, sort by combined RRF score
      │      Return top 10 merged chunks
      │
      ├─── Step 2: Reranking ─────────────────────────────────────────
      │    [reranker.py] rerank(retrieved, question, top_k=5)
      │      For each chunk:
      │        faiss_score     × 0.5  (semantic similarity)
      │        bm25_normalized × 0.3  (keyword relevance, capped at 1.0)
      │        medical_density × 0.2  (medical term count / total words × 10)
      │      Sort by combined score, return top 5 with rerank_score
      │
      ├─── Step 3: Safety Check ──────────────────────────────────────
      │    [safety.py] is_evidence_sufficient(top_chunks)
      │      Requires: len(chunks) >= 1 AND top rerank_score >= 0.10
      │      If fails → return fallback "Insufficient medical evidence..."
      │
      ├─── Step 4: Context Building ──────────────────────────────────
      │    Concatenate top chunk texts with [Page N] headers
      │    Inject into MEDICAL_SYSTEM_PROMPT template
      │
      ├─── Step 5: LLM Generation ────────────────────────────────────
      │    [api_manager.py] groq_manager.call_with_retry(_call_groq)
      │      Model: llama-3.3-70b-versatile
      │      Temperature: 0.1, Max tokens: 1024
      │      System: MEDICAL_SYSTEM_PROMPT (strict grounding rules)
      │      Auto-rotates API keys on 429/auth errors (up to 3 retries)
      │
      ├─── Step 6: Confidence Scoring ────────────────────────────────
      │    [confidence.py] compute_confidence(top_chunks, answer)
      │
      │    Signal 1 — Retrieval quality (rerank_score):
      │      High   if score >= 0.40
      │      Medium if score >= 0.22
      │      Low    otherwise
      │
      │    Signal 2 — Answer grounding:
      │      Extract content words from answer (len>2, not stopwords)
      │      Check fraction that appear in retrieved chunk texts
      │      grounding >= 0.75 + Medium → promote to High
      │      grounding >= 0.50 + Low    → promote to Medium
      │      grounding <  0.30 + High   → demote to Medium
      │
      └─── Step 7: Response Assembly ─────────────────────────────────
           ChatResponse {
             answer: string,
             confidence: { level, score },
             sources: [SourceChunk, ...]
           }
```

### 3. Medical Summary Pipeline

```
User clicks "Generate Summary"
      │
GET /summary
      │
[medical_summary.py] get_medical_summary()
      │
      ├─ If no document text → return empty MedicalSummary
      │
      ├─ Truncate text to first 6000 chars (token limit safety)
      │
      ├─ Format SUMMARY_EXTRACTION_PROMPT with document text
      │
      ├─ Groq LLaMA 3.3 70B (temperature=0.0 for determinism)
      │
      ├─ Strip markdown fences (```json ... ```)
      │
      └─ json.loads() → MedicalSummary {
           diseases, medications, allergies,
           abnormalities, recommendations
         }
```

### 4. Evidence Viewer Pipeline

```
User enters search query
      │
GET /sources?query=...
      │
hybrid_search(query, top_k=10)  →  rerank(results, query, top_k=5)
      │
Return List[SourceChunk] with chunk text, page, rerank_score
```

---

## Backend Modules

| Module | Key Function | Description |
|---|---|---|
| `main.py` | — | FastAPI app, CORS, startup events, all 5 routes |
| `api_manager.py` | `APIKeyManager` | Round-robin key rotation with retry on 429/auth errors |
| `pdf_parser.py` | `extract_text_from_pdf()` | PyMuPDF extraction + OCR need detection |
| `ocr.py` | `extract_text_with_ocr()` | EasyOCR per-page image rendering |
| `chunking.py` | `chunk_pages()` | 700-char overlapping chunks with page metadata |
| `embeddings.py` | `embed_texts()`, `embed_query()` | Voyage AI `voyage-3` (dim=1024), batch=8 |
| `vector_store.py` | `build_index()`, `faiss_search()` | FAISS IndexFlatIP with L2-normalized cosine |
| `hybrid_retrieval.py` | `hybrid_search()`, `build_bm25()` | RRF fusion of FAISS + BM25 results |
| `reranker.py` | `rerank()` | Weighted score: 0.5×FAISS + 0.3×BM25 + 0.2×density |
| `safety.py` | `is_evidence_sufficient()` | Min chunks=1, min rerank_score=0.10 |
| `rag_pipeline.py` | `run_rag()` | Orchestrates all 7 steps of the RAG pipeline |
| `confidence.py` | `compute_confidence()` | Retrieval quality + answer grounding dual signal |
| `medical_summary.py` | `get_medical_summary()` | JSON-structured entity extraction via LLM |
| `prompts.py` | — | `MEDICAL_SYSTEM_PROMPT`, `SUMMARY_EXTRACTION_PROMPT` |
| `entities.py` | — | Pydantic v2 models: ChatRequest, ChatResponse, etc. |

---

## Frontend Components

| Component | Purpose |
|---|---|
| `MainLayout.jsx` | Flex layout: `w-64 flex-shrink-0` sidebar + `flex-1` main content, `h-screen overflow-hidden` |
| `Dashboard.jsx` | PDF upload, backend health indicator, post-upload metadata card |
| `ChatAssistant.jsx` | Full-height chat UI, message history, Enter-to-send, source toggle |
| `MedicalSummary.jsx` | "Generate Summary" button, 5-category grid (2–3 cols responsive) |
| `EvidenceViewer.jsx` | Search bar, chunk results, pages covered, quick-search buttons |
| `UploadCard.jsx` | Drag-and-drop zone, file.type + file.size guards, progress feedback |
| `ChatBubble.jsx` | User (right, gradient) / assistant (left, glass) bubbles with sources |
| `ConfidenceBadge.jsx` | Piecewise-normalized % display: High→70-100%, Medium→40-70%, Low→0-40% |
| `SourceCard.jsx` | Chunk text, page number, rerank score display |
| `SummarySection.jsx` | Category card with colored border, icon, and item list |
| `ErrorAlert.jsx` | Dismissible red banner with × button |
| `LoadingSpinner.jsx` | Animated spinner with optional label |
| `DocumentContext.jsx` | Global React context: documentLoaded, uploadMeta, chatHistory, summary |
| `api.js` | Axios instance (baseURL=`http://localhost:8000`, timeout=120s), 5 API functions |

---

## API Reference

### `GET /health`
```json
Response: { "status": "ok", "version": "1.0.0" }
```

### `POST /upload`
```
Content-Type: multipart/form-data
Body: file (PDF, max 20MB)

Response 200: {
  "success": true,
  "message": "Document processed successfully.",
  "page_count": 3,
  "chunk_count": 6,
  "used_ocr": false
}
Response 400: { "detail": "Only PDF files are accepted." }
Response 400: { "detail": "File too large. Maximum allowed size is 20MB." }
Response 422: { "detail": "No text could be extracted from PDF." }
```

### `POST /chat`
```json
Request:  { "question": "What is the patient's name?" }
Response: {
  "answer": "The patient's name is Kimberly Lawrence.",
  "confidence": { "level": "High", "score": 0.2843 },
  "sources": [
    { "chunk_id": 0, "text": "...", "page": 1,
      "source": "page_1", "rerank_score": 0.2843 }
  ]
}
```

### `GET /summary`
```json
Response: {
  "diseases": ["Type 2 Diabetes Mellitus", "Peripheral Neuropathy"],
  "medications": ["Metformin 500mg", "Gabapentin 300mg"],
  "allergies": ["Penicillin"],
  "abnormalities": ["Elevated HbA1c"],
  "recommendations": ["Follow-up in 30 days"]
}
```

### `GET /sources?query=...`
```json
Response: [
  { "chunk_id": 2, "text": "...", "page": 1,
    "source": "page_1", "rerank_score": 0.31 }
]
```

---

## Setup & Installation

### Prerequisites
- Python 3.10+ (tested on 3.14)
- Node.js 18+
- Groq API key(s) — [console.groq.com](https://console.groq.com)
- Voyage AI API key — [dash.voyageai.com](https://dash.voyageai.com)

### Backend Setup

```powershell
# 1. Navigate to backend
cd medical-ai-assistant\backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate it
.\venv\Scripts\activate

# 4. Install pinned dependencies
pip install -r requirements.txt

# 5. Create .env file (see Environment Variables section)

# 6. Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```powershell
# 1. Navigate to frontend
cd medical-ai-assistant\frontend

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Environment Variables

Create `backend/.env`:

```env
# Groq API keys (comma-separated for rotation)
GROQ_API_KEYS=gsk_key1,gsk_key2

# Voyage AI API key (comma-separated for rotation)
VOYAGE_API_KEYS=pa-key1
```

**Key Rotation:** The `APIKeyManager` automatically rotates through multiple keys using `itertools.cycle`. On a 429 rate-limit or auth error, it advances to the next key and retries (up to 3 attempts with 1.5s delay).

---

## Security & Validation

### File Upload Guards (Two-Layer)

| Layer | Where | Checks |
|---|---|---|
| Client-side | `UploadCard.jsx` | `file.type !== 'application/pdf'` → reject, `file.size > 20*1024*1024` → reject |
| Server-side | `main.py /upload` | `.pdf` extension check, `len(file_bytes) > MAX_UPLOAD_BYTES` → HTTP 400 |

### CORS Policy
Restricted to explicit origins — never wildcard in production:
```python
allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"]
```

### Anti-Hallucination
- **Safety guard:** LLM call is blocked if `rerank_score < 0.10` or no chunks retrieved
- **Strict system prompt:** Model instructed to respond only from provided context
- **Grounding demotion:** If answer keywords don't appear in chunks (grounding < 30%), confidence demoted from High → Medium

---

## Confidence Scoring System

The confidence badge shown per answer uses two independent signals:

### Signal 1: Retrieval Quality
Based on the top chunk's `rerank_score` (weighted combination):
```
rerank_score = (faiss_cosine × 0.5) + (bm25_normalized × 0.3) + (medical_density × 0.2)
Realistic range: ~0.10 (no match) to ~0.55 (strong match)

Thresholds:
  High   ≥ 0.40
  Medium ≥ 0.22
  Low    < 0.22
```

### Signal 2: Answer Grounding
```
content_words = answer words with len > 2 and not in stopword list
grounding = count(words in retrieved chunks) / len(content_words)

Promotion rules:
  grounding ≥ 0.75 + Medium retrieval → High
  grounding ≥ 0.50 + Low retrieval   → Medium

Demotion rule:
  grounding < 0.30 + High retrieval  → Medium (hallucination risk)
```

### Display Normalization
Raw `rerank_score` is NOT shown as-is (would appear as 28%). Instead, piecewise linear mapping to human-friendly percentages:
```
High   (0.40–0.55) → maps to 70–100%
Medium (0.22–0.40) → maps to 40–70%
Low    (0.00–0.22) → maps to 0–40%
```

---

## Running the Application

```powershell
# Terminal 1 — Backend
cd medical-ai-assistant\backend
.\venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend
cd medical-ai-assistant\frontend
npm run dev
```

| URL | Description |
|---|---|
| http://localhost:5173 | Main application |
| http://localhost:5173/chat | Chat Assistant |
| http://localhost:5173/summary | Medical Summary |
| http://localhost:5173/evidence | Evidence Viewer |
| http://localhost:8000/docs | Swagger UI (API explorer) |
| http://localhost:8000/health | Backend health check |

### Expected Startup Output (Backend)
```
[APIKeyManager] Loaded 2 key(s) for Groq
[APIKeyManager] Loaded 1 key(s) for VoyageAI
[VectorStore] Loaded existing index with N vectors.
[BM25] Built BM25 index with N documents.
[Startup] Medical AI Assistant backend is ready.
INFO:     Application startup complete.
```

---

## Supported Document Types

- ✅ Lab Reports
- ✅ Prescriptions
- ✅ Discharge Summaries
- ✅ Clinical Notes
- ✅ Diagnostic Reports
- ✅ Patient Records
- ✅ Scanned/Image PDFs (via EasyOCR fallback)

---

*Medical AI Assistant v1.0.0 · Powered by Groq + Voyage AI*
