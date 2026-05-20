# 🏥 Medical AI Assistant — `NewVoiceIntegration_T` Branch

> **For the frontend developer:** This branch adds full multilingual voice chat on top of the existing RAG-powered chat assistant. The backend and voice pipeline are complete and working. Your job is UI/UX visual improvements — this README tells you exactly what exists, what files to touch, and how to run everything.

---

## 📋 Table of Contents

1. [What's New in This Branch](#-whats-new-in-this-branch)
2. [How Voice Works (End-to-End)](#-how-voice-works-end-to-end)
3. [Project Structure](#-project-structure)
4. [Frontend File Guide (For UI Work)](#-frontend-file-guide-for-ui-work)
5. [Running the Project](#-running-the-project)
6. [Environment Variables](#-environment-variables)
7. [Voice States Reference](#-voice-states-reference)
8. [API Reference](#-api-reference)
9. [Original System Architecture](#-original-system-architecture)
10. [Benchmark Results](#-benchmark-results)
11. [Roadmap](#-roadmap)
12. [Disclaimer](#-disclaimer)

---

## 🆕 What's New in This Branch

This branch adds **real-time multilingual voice interaction** to the chat assistant. Users can now:

- 🎙️ Tap the mic button → speak in **any Indian language or English**
- 🤖 Get a RAG answer retrieved from their uploaded medical document
- 🔊 Hear the answer spoken back in the **same language** they asked in

### Files Added / Changed

| File | Status | What It Does |
|---|---|---|
| `backend/modules/voice_handler.py` | **NEW** | Full voice pipeline: STT → RAG → TTS |
| `frontend/src/hooks/useVoiceChat.js` | **NEW** | WebSocket client — manages mic, audio, state |
| `frontend/src/components/VoiceButton.jsx` | **NEW** | Standalone voice button component (available for reuse) |
| `frontend/public/pcm-processor.js` | **NEW** | AudioWorklet — captures raw PCM from microphone |
| `frontend/src/pages/ChatAssistant.jsx` | **MODIFIED** | Inline mic button, voice state UI, stop button |
| `backend/main.py` | **MODIFIED** | Added `/ws/voice` WebSocket endpoint |
| `backend/requirements.txt` | **MODIFIED** | Added `httpx`, `websockets` |
| `frontend/src/services/api.js` | **MODIFIED** | Added AbortController signal support |

### New `.env` Variable Required

```env
# Add this to backend/.env (in addition to existing keys)
SARVAM_API_KEY=sk_your_key_here
```

---

## 🔊 How Voice Works (End-to-End)

```
User taps mic
      │
      ▼
[Browser] Records mic audio as raw 16-bit PCM @ 16kHz
   via AudioWorklet (pcm-processor.js)
      │
      ▼ (binary WebSocket frames)
[Browser] Buffers all chunks in memory
      │
User taps mic again to stop
      │
      ▼ (sends full buffer + "end_of_audio" JSON signal)
[Backend WebSocket /ws/voice]
      │
      ▼
[voice_handler.py] Wraps PCM → WAV container
      │
      ▼ (POST multipart/form-data)
[Sarvam AI — Saaras v3 STT]
  Auto-detects language (hi/ta/te/kn/ml/bn/mr/gu/pa/or/en)
  Returns: transcript + language_code
      │
      ▼
[RAG Pipeline — run_rag(transcript)]
  FAISS vector search + BM25 keyword search
  Voyage AI reranking
  Groq LLM (Llama 3.3 70B) answer generation
  Returns: answer text + confidence + source pages
      │
      ▼
[voice_handler.py] Strips markdown from answer (no asterisks read aloud)
      │
      ▼ (POST JSON)
[Sarvam AI — Bulbul v2 TTS]
  Speaker: anushka
  Returns: base64 WAV audio
      │
      ▼ (WebSocket JSON messages back to browser)
[Browser] Displays transcript bubble + answer bubble
[Browser] Plays audio via <Audio> element
```

### WebSocket Messages (Browser ↔ Backend)

**Browser → Backend:**
| Frame Type | Content |
|---|---|
| Binary | Raw PCM audio chunks (sent continuously while recording) |
| JSON | `{"type": "end_of_audio"}` — signals recording done |

**Backend → Browser:**
| Message | When |
|---|---|
| `{"type": "processing"}` | STT call started |
| `{"type": "final_transcript", "text": "...", "language": "hi"}` | After STT |
| `{"type": "answer", "text": "...", "confidence": {...}, "sources": [...]}` | After RAG |
| `{"type": "audio_ready", "audio_b64": "...", "format": "wav"}` | After TTS |
| `{"type": "done"}` | Session complete |
| `{"type": "error", "message": "..."}` | Any failure |

---

## 📁 Project Structure

```
MedicalDocAIAssistant/
│
├── backend/
│   ├── main.py                    # FastAPI app + all HTTP/WS endpoints
│   ├── requirements.txt
│   ├── .env                       # ← you must create this (see below)
│   ├── venv/                      # Python virtual environment
│   └── modules/
│       ├── voice_handler.py       # 🆕 Voice pipeline (STT→RAG→TTS)
│       ├── rag_pipeline.py        # Core RAG logic
│       ├── hybrid_retrieval.py    # FAISS + BM25 search
│       ├── reranker.py            # Voyage AI reranking
│       ├── embeddings.py          # Voyage AI embeddings
│       ├── vector_store.py        # FAISS index management
│       ├── chunking.py            # PDF → text chunks
│       ├── pdf_parser.py          # PDF text extraction
│       ├── ocr.py                 # EasyOCR fallback for scanned PDFs
│       ├── confidence.py          # Confidence scoring
│       ├── safety.py              # Anti-hallucination guard
│       ├── prompts.py             # LLM system prompts
│       └── api_manager.py        # API key rotation
│
└── frontend/
    ├── public/
    │   └── pcm-processor.js       # 🆕 AudioWorklet for mic capture
    ├── src/
    │   ├── pages/
    │   │   ├── ChatAssistant.jsx  # 🔨 Main chat page (voice integrated here)
    │   │   ├── Upload.jsx         # PDF upload page
    │   │   ├── Summary.jsx        # Medical summary page
    │   │   └── Evidence.jsx       # Evidence viewer page
    │   ├── components/
    │   │   ├── VoiceButton.jsx    # 🆕 Standalone voice button (reusable)
    │   │   ├── ChatBubble.jsx     # Individual message bubble
    │   │   ├── ErrorAlert.jsx     # Error banner
    │   │   └── LoadingSpinner.jsx # Loading indicator
    │   ├── hooks/
    │   │   └── useVoiceChat.js    # 🆕 Voice WebSocket hook
    │   ├── context/
    │   │   └── DocumentContext.jsx # Global document + chat state
    │   ├── services/
    │   │   └── api.js             # All HTTP API calls
    │   ├── index.css              # Global styles (Tailwind + custom)
    │   └── main.jsx               # React entry point
    └── package.json
```

---

## 🎨 Frontend File Guide (For UI Work)

> **You're working on UI/UX visual changes.** Here's exactly where to look for each part of the interface.

### Pages

| Page | File | Route | What's on it |
|---|---|---|---|
| Upload | `src/pages/Upload.jsx` | `/` | PDF drag-and-drop, upload progress |
| Chat Assistant | `src/pages/ChatAssistant.jsx` | `/chat` | Chat bubbles, input bar, mic button, sidebar |
| Summary | `src/pages/Summary.jsx` | `/summary` | Medical summary cards |
| Evidence | `src/pages/Evidence.jsx` | `/evidence` | Source evidence viewer |

### Key Components

| Component | File | Used In |
|---|---|---|
| Chat message bubble | `src/components/ChatBubble.jsx` | `ChatAssistant.jsx` |
| Voice button (standalone) | `src/components/VoiceButton.jsx` | Available — not currently used inline |
| Error banner | `src/components/ErrorAlert.jsx` | All pages |
| Loading spinner | `src/components/LoadingSpinner.jsx` | All pages |

### Voice UI — Where to Edit

All voice UI in the chat lives in **`src/pages/ChatAssistant.jsx`**. Here's a map:

```jsx
// ── HEADER AREA (line ~165–215) ──────────────────────────────────
// Contains: title, Online/RAG Active/Voice Active badges, Stop button, Clear button
// Edit this to change the header look

// ── CHAT MESSAGES AREA (line ~220–290) ───────────────────────────
// Contains: empty state with suggested questions
//           chat bubbles (via <ChatBubble />)
//           "Analyzing records..." loading bubble (text queries)
//           "Transcribing & thinking…" bubble (voice processing)
//           "AI is speaking — tap ■ to stop" bubble (TTS playback)
// Edit this to change how messages look

// ── INPUT BAR (line ~295–370) ────────────────────────────────────
// Contains: error banners, listening waveform strip, textarea,
//           MIC BUTTON (inline, left of send), Send button
// Edit this to change the input area look

// ── SIDEBAR (line ~380–460) ──────────────────────────────────────
// Contains: Assistant Configuration card, Suggested Questions card
// Only visible on xl screens (1280px+)
```

### Voice State Values

The `voiceState` prop/variable cycles through these 4 values:

| State | What's Happening | UI Should Show |
|---|---|---|
| `"idle"` | Mic off, waiting | Grey mic icon, normal input |
| `"listening"` | Recording audio | Red pulsing mic, waveform strip, red input border |
| `"processing"` | STT + RAG + TTS running | Spinner in mic button, violet "thinking" bubble in chat |
| `"speaking"` | Audio playing back | Speaker icon in mic button, teal "AI is speaking" bubble |

### Global Styles

All design tokens (colors, spacing, animations) are in **`src/index.css`**. The project uses **Tailwind CSS** with custom utility classes defined there:

```css
/* Key custom classes you'll use */
.card              /* dark glassmorphism card */
.card-interactive  /* card with hover effect */
.btn-primary       /* cyan gradient button */
.btn-icon          /* small square icon button */
.badge-emerald     /* green status badge */
.badge-cyan        /* cyan badge */
.badge-violet      /* purple badge */
.label             /* section label text */
.heading-page      /* page heading */
.scrollbar-thin    /* thin custom scrollbar */
```

---

## 🚀 Running the Project

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Sarvam AI API key (get from [dashboard.sarvam.ai](https://dashboard.sarvam.ai))

### Step 1 — Backend

```powershell
# Navigate to backend
cd MedicalDocAIAssistant\backend

# Create virtual environment (first time only)
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start backend (important: set UTF-8 encoding for Hindi/multilingual logs)
$env:PYTHONIOENCODING="utf-8"
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

✅ You should see:
```
[APIKeyManager] Loaded 2 key(s) for Groq
[VectorStore] Loaded existing index with N vectors.
[Startup] Medical AI Assistant backend is ready.
INFO:     Application startup complete.
```

### Step 2 — Frontend

```powershell
# In a new terminal — navigate to frontend
cd MedicalDocAIAssistant\frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

### Available URLs

| URL | What |
|---|---|
| http://localhost:5173 | Upload page |
| http://localhost:5173/chat | Chat + Voice assistant |
| http://localhost:5173/summary | Medical summary |
| http://localhost:5173/evidence | Evidence viewer |
| http://localhost:8000/docs | Swagger API explorer |
| http://localhost:8000/health | Backend health check |

---

## 🔑 Environment Variables

Create `backend/.env` with all of the following:

```env
# Groq API keys — comma-separated, auto-rotated on rate-limit
GROQ_API_KEYS=gsk_key1,gsk_key2

# Voyage AI API key — for embeddings + reranking
VOYAGE_API_KEYS=pa-key1

# Sarvam AI API key — for voice STT + TTS (NEW in this branch)
SARVAM_API_KEY=sk_your_sarvam_key_here
```

> ⚠️ Without `SARVAM_API_KEY`, the voice mic button will show an error when clicked. Text chat works fine without it.

---

## 🎙️ Voice States Reference

The `useVoiceChat` hook (in `src/hooks/useVoiceChat.js`) exposes:

```js
const {
  voiceState,       // "idle" | "listening" | "processing" | "speaking"
  language,         // detected language code: "hi", "en", "ta", etc.
  errorMsg,         // string | null — voice-specific error
  startListening,   // () => void — opens WS + starts mic
  stopListening,    // () => void — sends audio to backend
  stopSpeaking,     // () => void — stops audio playback
  clearError,       // () => void — clears errorMsg
} = useVoiceChat({ onTranscript, onAnswer });
```

**Callbacks:**

```js
// Called when STT returns — adds user's spoken text to chat
onTranscript: ({ text }) => void

// Called when RAG answers — adds AI answer bubble to chat
onAnswer: ({ text, confidence, sources }) => void
```

**Supported Languages (auto-detected):**

| Code | Language |
|---|---|
| `hi` | Hindi |
| `en` | English |
| `ta` | Tamil |
| `te` | Telugu |
| `kn` | Kannada |
| `ml` | Malayalam |
| `bn` | Bengali |
| `mr` | Marathi |
| `gu` | Gujarati |
| `pa` | Punjabi |
| `or` | Odia |

---

## 📡 API Reference

### HTTP Endpoints

| Method | Endpoint | What |
|---|---|---|
| `GET` | `/health` | Health check — returns `{"status": "ok"}` |
| `POST` | `/upload` | Upload PDF — `multipart/form-data` with `file` field |
| `POST` | `/chat` | Send text message — `{"message": "..."}` |
| `GET` | `/questions` | Get AI-suggested questions for the current document |
| `GET` | `/summary` | Get medical summary of current document |

### WebSocket

| Endpoint | Protocol | What |
|---|---|---|
| `/ws/voice` | WebSocket | Full voice session (see flow diagram above) |

---

## 🏗️ Original System Architecture

```
PDF Upload
    │
    ▼
[pdf_parser.py] Text extraction (pdfplumber)
    │ fails?
    ▼
[ocr.py] EasyOCR fallback for scanned pages
    │
    ▼
[chunking.py] Split into ~400-token overlapping chunks
    │
    ▼
[embeddings.py] Voyage AI voyage-3 embeddings
    │
    ▼
[vector_store.py] FAISS index (persisted to disk)
[hybrid_retrieval.py] BM25 index (built at startup)

─────────────────────────────────────────────────

Query (text or voice transcript)
    │
    ▼
[hybrid_retrieval.py] FAISS cosine + BM25 keyword → top 20 chunks
    │
    ▼
[reranker.py] Voyage AI rerank-2 → top 5 chunks
    │
    ▼
[safety.py] Block if rerank_score < 0.10 (no relevant content)
    │
    ▼
[prompts.py] Build LLM prompt with chunks as context
    │
    ▼
[Groq API] llama-3.3-70b-versatile → answer text
    │
    ▼
[confidence.py] Score confidence: High / Medium / Low
    │
    ▼
API response: { answer, confidence, sources }
```

---

## 📊 Benchmark Results

*Test document: Kimberly Lawrence — Type 2 Diabetes + Peripheral Neuropathy*
*Model: Llama 3.3 70B + Voyage voyage-3*

| Metric | Score |
|---|---|
| Retrieval Recall@5 | **80.0%** (12/15) |
| Grounded QA Accuracy | **73.3%** (11/15) |
| Hallucination Rate | **26.7%** (4/15) |
| Confidence Calibration | **100.0%** (11/11 correct answers) |
| Avg ROUGE-L | **0.1317** |
| **Overall End-to-End** | **73.3%** |

---

## 🔒 Security

- File upload validated client-side (type + size) **and** server-side
- CORS restricted to `localhost:5173` only — no wildcard
- Anti-hallucination guard: blocks LLM if retrieval score < 0.10
- Grounding check: demotes High → Medium if answer words not found in source chunks
- API keys never exposed to frontend

---

## 🗺️ Roadmap

- [x] FAISS + BM25 hybrid retrieval
- [x] Voyage AI reranking
- [x] Confidence scoring + calibration
- [x] Anti-hallucination safety guard
- [x] Evaluation script (`run_eval.py`)
- [x] **Multilingual voice chat (this branch)**
- [ ] Streaming chat responses (SSE / token-by-token)
- [ ] Multi-document sessions
- [ ] User authentication (JWT)
- [ ] Redis session store
- [ ] Docker + docker-compose
- [ ] DICOM / HL7 support

---

## 👥 Team

| Developer | Owns |
|---|---|
| **Backend Lead** | `pdf_parser.py`, `ocr.py`, `chunking.py`, `entities.py`, `medical_summary.py` |
| **ML/API Lead** | `embeddings.py`, `vector_store.py`, `hybrid_retrieval.py`, `reranker.py`, `rag_pipeline.py`, `confidence.py`, `safety.py`, `prompts.py`, `api_manager.py`, `main.py`, `voice_handler.py` |
| **Frontend Lead** | Entire `frontend/` — all pages, context, API layer, components, voice UI |

---

## ⚠️ Disclaimer

> This system is a **development and research tool** for AI-assisted document analysis. It is **not certified for clinical use** and should **never** be used as the sole basis for medical decisions. All outputs must be reviewed by qualified healthcare professionals.

---

*Medical AI Assistant v1.1.0 — Powered by Groq + Voyage AI + Sarvam AI*
*Branch: `NewVoiceIntegration_T`*