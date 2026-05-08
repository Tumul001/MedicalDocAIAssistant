# 🏥 Medical Document AI Assistant
### Hybrid RAG-Powered Medical Intelligence Platform

> Upload a medical PDF. Ask clinical questions. Get grounded, evidence-backed answers.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5+-646CFF?style=flat&logo=vite&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-Latest-1C3C3C?style=flat)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Team & Contributions](#-team--contributions)
- [Limitations](#-limitations)
- [Disclaimer](#-disclaimer)

---

## 🔍 Overview

The **Medical Document AI Assistant** is a full-stack, locally-run AI platform for medical document intelligence. It combines **semantic vector search** (FAISS) and **keyword retrieval** (BM25) into a hybrid RAG pipeline, powered by **Groq LLaMA 3 70B** for inference and **Voyage AI `voyage-large-3`** for embeddings — all on free-tier APIs with zero cloud cost.

Upload any medical PDF — discharge summaries, cardiology consults, pathology reports — and instantly get:
- Structured extraction of diagnoses, medications, allergies, and more
- Conversational Q&A grounded strictly in the document
- Confidence scoring on every answer
- Source evidence citations with page references
- Hallucination prevention via safety validation

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **PDF Upload** | Drag-and-drop medical PDFs with EasyOCR fallback for scanned documents |
| 🔍 **Hybrid Retrieval** | FAISS semantic search + BM25 keyword search merged and reranked |
| 🤖 **Conversational Q&A** | Multi-turn chat with full conversation history awareness |
| 🧬 **Structured Extraction** | Auto-extracts diseases, medications, allergies, symptoms, abnormalities |
| 📊 **Confidence Scoring** | Every answer rated High / Medium / Low based on retrieval quality |
| 🛡️ **Safety Validation** | Blocks LLM calls when evidence is insufficient — no hallucinations |
| 📌 **Source Citations** | Every response includes the exact document chunks that support it |
| 🔑 **Multi-Key Failover** | Auto-rotates API keys to handle free-tier rate limits gracefully |
| 💡 **4-Page React UI** | Dashboard, Chat Assistant, Medical Summary, Source Evidence Viewer |

---

## 🛠 Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| React 18 + Vite | UI framework + dev server |
| Tailwind CSS | Styling |
| React Router DOM | Page routing |
| React Context API | Global state management |
| Axios | HTTP client |

### Backend
| Tool | Purpose |
|---|---|
| FastAPI | REST API framework |
| Python 3.11+ | Backend language |
| Uvicorn | ASGI server |
| Pydantic v2 | Request/response validation |
| LangChain | RAG orchestration |

### AI / ML
| Tool | Purpose |
|---|---|
| Groq `llama3-70b-8192` | LLM inference (free tier) |
| Voyage AI `voyage-large-3` | Semantic embeddings (free tier) |
| FAISS-CPU | Vector similarity search (in-RAM) |
| rank-bm25 | BM25 keyword retrieval |
| PyMuPDF | PDF text extraction |
| EasyOCR | OCR fallback for scanned PDFs |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              React Frontend  (localhost:5173)                │
│  Dashboard │ Chat Assistant │ Medical Summary │ Sources      │
└────────────────────────┬────────────────────────────────────┘
                         │  Axios (via Vite proxy)
┌────────────────────────▼────────────────────────────────────┐
│              FastAPI Backend  (localhost:8000)               │
│  POST /upload │ POST /chat │ GET /summary │ GET /sources     │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   PDF Processing    Hybrid RAG     Extraction
   ─────────────    ──────────     ──────────
   PyMuPDF           FAISS          Groq 70B
   EasyOCR  ──►   +  BM25    ──►   Structured
   Chunking       Reranker         NER Output
          │              │
          ▼              ▼
    Voyage AI       Groq LLM
   voyage-large-3  llama3-70b
   (Embeddings)    (Answers)
```

### Upload Flow

```
User uploads PDF
      │
      ▼
PyMuPDF extracts text
      │
      ├─── Text quality OK? ──NO──► EasyOCR fallback
      │
      ▼
Split into chunks (700 chars, 120 overlap)
      │
      ├──► Voyage AI embeds chunks ──► FAISS index (RAM)
      │
      ├──► BM25 index built from chunks (RAM)
      │
      └──► Groq 70B extracts entities ──► MedicalSummary
```

### Query Flow

```
User asks question
      │
      ▼
Hybrid Search (FAISS top-10 + BM25 top-10)
      │
      ▼
Reranker → top-5 chunks
      │
      ├──► Confidence Score (High / Medium / Low)
      │
      ├──► Safety Check (evidence sufficient?)
      │         │
      │         └──NO──► "Insufficient medical evidence found."
      │
      ▼
Groq LLaMA 3 70B generates grounded answer
      │
      ▼
Return: answer + confidence + source citations
```

---

## 📁 Project Structure

```
medical-ai-assistant/
│
├── backend/
│   ├── main.py                    # FastAPI app, routes, session store
│   ├── requirements.txt
│   ├── .env                       # API keys (not committed)
│   ├── .env.example               # Safe template
│   └── modules/
│       ├── api_manager.py         # Multi-key rotation + failover
│       ├── pdf_parser.py          # PDF → raw text
│       ├── ocr.py                 # EasyOCR fallback
│       ├── chunking.py            # Text → Document chunks
│       ├── embeddings.py          # Voyage AI wrapper
│       ├── vector_store.py        # FAISS index
│       ├── hybrid_retrieval.py    # FAISS + BM25 merge
│       ├── reranker.py            # Combined score reranking
│       ├── rag_pipeline.py        # LangChain RAG chain
│       ├── entities.py            # Groq structured NER
│       ├── medical_summary.py     # Pydantic schema
│       ├── confidence.py          # Similarity → confidence label
│       ├── safety.py              # Evidence sufficiency check
│       └── prompts.py             # All LLM prompt templates
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Root + React Router setup
│   │   ├── context/
│   │   │   └── AppContext.jsx     # Global state
│   │   ├── services/
│   │   │   └── api.js             # All Axios calls
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Upload + entity overview
│   │   │   ├── ChatAssistant.jsx  # Conversational Q&A
│   │   │   ├── MedicalSummary.jsx # Structured summary
│   │   │   └── SourceEvidence.jsx # Chunk viewer
│   │   └── components/
│   │       ├── Navbar.jsx
│   │       ├── ConfidenceBadge.jsx
│   │       └── SourceCard.jsx
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md
```

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

## ⚠️ Limitations

- **In-memory sessions** — uploading state is lost on backend restart; re-upload required
- **Single document per session** — cannot query across multiple records simultaneously
- **PDF only** — no DICOM, Word documents, or HL7 support currently
- **EasyOCR is CPU-only** — first-run downloads ~100MB model weights; subsequent calls are fast
- **Free-tier rate limits** — mitigated by multi-key rotation; add more keys for heavy usage
- **Not clinically certified** — development and research use only

---

## 🔭 Roadmap

- [ ] FAISS disk persistence (survive backend restarts)
- [ ] Multi-document sessions
- [ ] Streaming chat responses (SSE)
- [ ] Redis-backed session store
- [ ] User authentication (JWT)
- [ ] DICOM and HL7 support

---

## 📄 License

This project is licensed under the MIT License.

---

## 🏥 Disclaimer

> This system is a **development and research tool** for AI-assisted document analysis. It is **not certified for clinical use** and should **never** be used as the sole basis for medical decisions. All outputs must be reviewed by qualified healthcare professionals.

---

<p align="center">
  Built with FastAPI · React · LangChain · Groq · Voyage AI
</p>
