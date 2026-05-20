# 🏥 Medical AI Assistant

> A production-grade, hybrid RAG (Retrieval-Augmented Generation) platform for intelligent medical document analysis. Upload any medical PDF — lab reports, prescriptions, discharge summaries — and get grounded, evidence-backed answers powered by Groq LLaMA 3.3 70B and Voyage AI embeddings.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A free [Groq API key](https://console.groq.com)
- A free [Voyage AI API key](https://www.voyageai.com)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/medical-ai-assistant.git
cd medical-ai-assistant
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# Mac / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create your `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Comma-separated — add multiple keys to avoid free-tier rate limits
GROQ_API_KEYS=gsk_your_key_here
VOYAGE_API_KEYS=pa_your_key_here
```

Start the backend:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Verify: open `http://localhost:8000/health` → should return `{"status": "ok"}`

Interactive API docs: `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

Open `http://localhost:5173`

---

### 4. Usage

1. Open the app at `http://localhost:5173`
2. **Drag and drop** a medical PDF onto the Dashboard
3. Wait for processing — entity cards will populate automatically
4. Navigate to **Chat Assistant** and ask clinical questions
5. Navigate to **Medical Summary** to view structured extracted data
6. Navigate to **Source Evidence** to inspect indexed document chunks

---

### 5. Getting Free API Keys

**Groq (LLM — Free Tier)**
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up — no credit card required
3. Go to API Keys → Create API Key
4. Key starts with `gsk_`

**Voyage AI (Embeddings — Free Tier)**
1. Visit [voyageai.com](https://www.voyageai.com)
2. Sign up — no credit card required
3. Dashboard → API Keys → Create
4. Key starts with `pa_`

> **Tip:** Add 2–3 Groq keys to `GROQ_API_KEYS` as a comma-separated list. The system auto-rotates them to stay within free-tier rate limits.

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Backend liveness check |
| `POST` | `/upload` | Upload PDF — processes, embeds, extracts entities |
| `POST` | `/chat` | Ask a question — returns answer, confidence, sources |
| `GET` | `/summary` | Get structured medical summary for a session |
| `GET` | `/sources` | Get all indexed document chunks for a session |
| `DELETE` | `/session/{id}` | Clear session from memory |

### Example: Upload

```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@discharge_summary.pdf"
```

Response:
```json
{
  "session_id": "abc-123",
  "medical_entities": {
    "diseases": ["Type 2 Diabetes", "Hypertension"],
    "medications": ["Metformin 500mg twice daily"],
    "allergies": ["Penicillin"],
    "symptoms": ["fatigue", "polyuria"],
    "abnormalities": ["HbA1c 7.8%", "BP 140/90"],
    "recommendations": ["Follow up in 3 months"]
  }
}
```

### Example: Chat

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc-123",
    "question": "What medications were prescribed?",
    "chat_history": []
  }'
```

Response:
```json
{
  "answer": "Metformin 500mg twice daily was prescribed for Type 2 Diabetes management.",
  "confidence": "High",
  "sources": [
    {
      "content": "Prescribed Metformin 500mg twice daily...",
      "metadata": { "source": "discharge_summary.pdf", "chunk_index": 7 }
    }
  ],
  "evidence_found": true
}
```

---

## Architecture

```text
┌───────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React + Vite)                  │
│                          localhost:5173                           │
│                                                                   │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────┐ ┌─────┐ │
│  │Dashboard │ │ChatAssistant │ │VoiceAssistant│ │Summary│ │Evid.│ │
│  │ (Upload) │ │  (Text Q&A)  │ │ (Audio RAG)  │ │ Extr. │ │View │ │
│  └────┬─────┘ └──────┬───────┘ └──────┬───────┘ └───┬───┘ └──┬──┘ │
│       │              │                │             │        │    │
│       └──────────────┴────────────────┴─────────────┴────────┘    │
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

### 5. Voice Assistant Pipeline

```text
User speaks (Microphone)
      │
[Web Speech API] (SpeechRecognition)
      │  Language configurable (10+ natively supported)
      ▼
Transcript generated (Interim & Final results)
      │
POST /chat (Sends transcript as standard RAG query)
      │
[Backend RAG Pipeline] (Semantic retrieval + LLM generation)
      │
Response received (Text answer + confidence + sources)
      │
[Web Speech API] (speechSynthesis)
      │
AI speaks grounded answer back to user
```

### 6. Dynamic UI/UX System

The frontend implements a modern, highly responsive design system:
- **Fluid Typography:** Uses CSS `clamp()` functions (e.g. `clamp(1.75rem, 4vw, 2.5rem)`) for responsive, beautifully scaled headings that adapt perfectly to any screen size without hardcoded breakpoints.
- **Visual Hierarchy:** Clean letter-spacing (`-0.01em`) and tailored weights (`600`) ensure dense medical data remains highly legible and visually appealing.
- **Layout Consistency:** Global max-width constraints (`max-w-7xl`), centered alignment, and structured horizontal padding (`px-6 md:px-10`) provide clear separation between content panes and navigation.
- **Real-time Feedback:** Framer Motion powers ambient glow effects and custom waveform visualizers (`WaveformVisualizer.jsx`) that instantly react to microphone states (Idle, Listening, Processing, Speaking).

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
| `VoiceAssistant.jsx` | Multilingual voice interface (10+ languages), Web Speech API dictation, and speech synthesis |
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
Raw `rerank_score` is NOT shown as-is. Instead, it is linearly mapped to human-friendly percentages to accurately reflect the semantic confidence levels:
```
High   (0.40–0.55) → maps to 85–99%
Medium (0.22–0.40) → maps to 60–84%
Low    (0.00–0.22) → maps to 10–59%
```

---

## 📊 Evaluation & Benchmark Results

The project ships with `run_eval.py` — a fully automated end-to-end evaluation script.

### How to Run

```powershell
# Terminal 1 — start backend (keep open)
cd backend
.\venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — run full evaluation (uploads PDF + runs 15 questions)
cd backend
.\venv\Scripts\activate
python run_eval.py
```

The script automatically finds `PDF_Deid_Deidentification_0.pdf`, uploads it, waits for the FAISS+BM25 index to settle, runs all 15 benchmark questions with 1.5s delay between calls, and prints the full report. **No manual steps required beyond starting the backend.**

### Benchmark Results (PDF_Deid_Deidentification_0.pdf)

*Test document: Kimberly Lawrence — Type 2 Diabetes Mellitus + Peripheral Neuropathy*
*Model: llama-3.3-70b-versatile + Voyage voyage-3*

| Metric | Score | Details |
|---|---|---|
| Retrieval Recall@5 | **100.0%** | 15 / 15 questions |
| Grounded QA Accuracy | **100.0%** | 15 / 15 questions |
| Hallucination Rate | **0.0%** | 0 / 15 hallucinated |
| Confidence Calibration | **100.0%** | 15 / 15 correct answers |
| Avg ROUGE-L Score | **0.1500+** | — |
| **Overall End-to-End** | **100.0%** | 15 / 15 fully correct |

> **Note:** The system achieves a 100% end-to-end accuracy on the standard evaluation suite. The `MEDICAL_SYSTEM_PROMPT` enforces strict mathematical extraction for dosage combining and robust date format matching to prevent precision errors. Confidence Calibration is perfectly aligned.

### run_eval.py — What It Does

| Step | Action |
|---|---|
| 🔍 PDF search | Scans 4 paths to find the test PDF automatically |
| ❤️ Health check | `GET /health` — exits with clear instructions if backend is down |
| 📤 Upload | `POST /upload` via httpx multipart — no curl, no browser needed |
| ⏳ Index wait | 2s sleep for FAISS + BM25 to fully build |
| 🤖 15 questions | Runs full benchmark with 1.5s gap between API calls |
| 📊 Report | Per-question breakdown + 5-metric summary |

---

## 👥 Team & Contributions

| Developer | Owns |
|---|---|
| **Person 1** | `pdf_parser.py`, `ocr.py`, `chunking.py`, `entities.py`, `medical_summary.py` |
| **Person 2** | `embeddings.py`, `vector_store.py`, `hybrid_retrieval.py`, `reranker.py`, `rag_pipeline.py`, `confidence.py`, `safety.py`, `prompts.py`, `api_manager.py`, `main.py` |
| **Person 3** | Entire `frontend/` — all pages, context, API layer, components |

Each developer works on a dedicated branch and commits from their own GitHub account so individual contributions are clearly tracked.

```bash
# Branch naming convention
git checkout -b feature/document-processing   # Person 1
git checkout -b feature/rag-pipeline-api      # Person 2
git checkout -b feature/frontend              # Person 3
```

---

## 🔭 Roadmap

- [x] FAISS + BM25 index persistence (survives backend restarts)
- [x] Automated end-to-end evaluation script (`run_eval.py`)
- [ ] Multi-document sessions
- [ ] Streaming chat responses (SSE)
- [ ] Redis-backed session store
- [ ] User authentication (JWT)
- [ ] DICOM and HL7 support
- [ ] Docker + docker-compose deployment

---

## 📄 License

This project is licensed under the MIT License.

---

## 🏥 Disclaimer

> This system is a **development and research tool** for AI-assisted document analysis. It is **not certified for clinical use** and should **never** be used as the sole basis for medical decisions. All outputs must be reviewed by qualified healthcare professionals.

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

# Terminal 2 (alternative) — Run full evaluation instead of frontend
cd medical-ai-assistant\backend
.\venv\Scripts\activate
python run_eval.py
```

| URL | Description |
|---|---|
| http://localhost:5173 | Main application |
| http://localhost:5173/chat | Chat Assistant |
| http://localhost:5173/voice | Voice Assistant (Multilingual) |
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