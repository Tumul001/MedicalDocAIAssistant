# ANTIGRAVITY_MASTER_PROMPT.md
# Ultra-Detailed Autonomous Build Prompt
## Medical Document AI Assistant
## React + Vite + FastAPI + Hybrid RAG Platform
## Optimized for Google Antigravity Autonomous Execution

---

> ⚠️ **AGENT DIRECTIVE**: Read this document **completely and sequentially** before writing a single line of code. Every section is mandatory. Do NOT skip, summarize, or reinterpret any requirement. Execute exactly as specified.

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 0 — RISK REGISTER & CRITICAL WARNINGS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

> 🔴 **READ THIS SECTION FIRST. THESE ARE THE MOST COMMON FAILURE POINTS.**

## 🔴 RISK-01 — EasyOCR Import Freeze
**Severity: CRITICAL**
EasyOCR imports `torch` and downloads model weights on first use. This causes:
- Silent hangs during server startup
- Large memory spikes
- Timeout errors in production

**Mitigation Required:**
- Wrap all EasyOCR imports inside a try/except block
- Load EasyOCR reader lazily (only when OCR is actually triggered)
- Never import EasyOCR at module top-level
- Log a warning if EasyOCR fails to load and fall back gracefully

```python
# CORRECT PATTERN
def get_ocr_reader():
    try:
        import easyocr
        return easyocr.Reader(['en'], gpu=False)
    except Exception as e:
        print(f"[WARNING] EasyOCR unavailable: {e}")
        return None
```

---

## 🔴 RISK-02 — FAISS Index Persistence Between Sessions
**Severity: CRITICAL**
FAISS is an in-memory store. If the server restarts, all indexed documents are lost. Users will get empty retrieval results with no error.

**Mitigation Required:**
- Persist FAISS index to disk after every upload using `faiss.write_index()`
- Reload index from disk on server startup using `faiss.read_index()`
- Store chunk metadata (text, page, source) in a parallel `.pkl` file
- Always check if index file exists before attempting to load

```python
INDEX_PATH = "faiss_index.bin"
META_PATH = "faiss_meta.pkl"

# Save
faiss.write_index(index, INDEX_PATH)
with open(META_PATH, "wb") as f:
    pickle.dump(chunks_metadata, f)

# Load on startup
if os.path.exists(INDEX_PATH):
    index = faiss.read_index(INDEX_PATH)
    with open(META_PATH, "rb") as f:
        chunks_metadata = pickle.load(f)
```

---

## 🔴 RISK-03 — Voyage AI Model Name Mismatch
**Severity: CRITICAL**
The documentation mentions `voyage-large-2`. **This project uses `voyage-large-3` exclusively.** Using the wrong model name will cause a 400 API error from Voyage AI.

**Mitigation Required:**
- Hardcode `model="voyage-large-3"` in all embedding calls
- Never use `voyage-large-2`, `voyage-2`, or any other variant
- Validate model name at startup via a one-line test embedding

---

## 🔴 RISK-04 — BM25 Corpus Empty on Cold Start
**Severity: HIGH**
If the BM25 retriever is initialized before any documents are uploaded, it will crash with a division-by-zero or empty-corpus error when a query is made.

**Mitigation Required:**
- Guard all BM25 query calls with a corpus length check
- Return empty list if corpus is empty
- Reinitialize BM25 object after every document upload

```python
def bm25_search(query, top_k=5):
    if not bm25_corpus or len(bm25_corpus) == 0:
        return []
    ...
```

---

## 🔴 RISK-05 — CORS Blocking Frontend-Backend Communication
**Severity: HIGH**
React (Vite dev server at port 5173) will be blocked by FastAPI unless CORS is explicitly configured.

**Mitigation Required:**
- Add `CORSMiddleware` to FastAPI with explicit origins
- Never use wildcard `*` in production; use explicit localhost origins during development

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🔴 RISK-06 — Groq Rate Limit Causing Silent Failures
**Severity: HIGH**
Groq free-tier keys have per-minute token limits. When exceeded, the API returns a 429 error. Without proper handling, the entire RAG response fails silently.

**Mitigation Required:**
- Implement key rotation using `itertools.cycle`
- On 429 error, immediately rotate to the next key and retry
- Max retry attempts: 3 per request
- Log every key rotation event

---

## 🔴 RISK-07 — PyMuPDF Returning Empty Text on Scanned PDFs
**Severity: HIGH**
Many medical documents (lab reports, discharge summaries) are scanned images wrapped in a PDF container. `PyMuPDF` will extract zero or near-zero text from these.

**Mitigation Required:**
- After PyMuPDF extraction, count total characters across all pages
- If total characters < 100, trigger OCR fallback automatically
- This threshold check must happen inside `pdf_parser.py`, not in `main.py`

```python
def needs_ocr(extracted_text: str, threshold: int = 100) -> bool:
    clean = extracted_text.strip().replace("\n", "")
    return len(clean) < threshold
```

---

## 🔴 RISK-08 — Voyage AI Embedding Batch Size Limits
**Severity: MEDIUM**
Voyage AI has a maximum input batch size per API call. Sending hundreds of chunks at once will cause a 400 error.

**Mitigation Required:**
- Batch chunks in groups of maximum 8 items per API call
- Implement retry logic per batch
- Aggregate all embeddings after all batches complete

```python
BATCH_SIZE = 8
def embed_in_batches(texts, api_key):
    import voyageai
    client = voyageai.Client(api_key=api_key)
    all_embeddings = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i+BATCH_SIZE]
        result = client.embed(batch, model="voyage-large-3")
        all_embeddings.extend(result.embeddings)
    return all_embeddings
```

---

## 🔴 RISK-09 — LangChain Version Breaking API Compatibility
**Severity: MEDIUM**
LangChain undergoes frequent breaking changes between versions. Importing from the wrong subpath causes `ModuleNotFoundError` at startup.

**Mitigation Required:**
- Pin exact LangChain version in `requirements.txt`
- Use `langchain-text-splitters` package for `RecursiveCharacterTextSplitter`
- Validate all import paths before running

```
langchain==0.2.16
langchain-community==0.2.16
langchain-text-splitters==0.2.4
```

---

## 🔴 RISK-10 — React Context Not Wrapping All Routes
**Severity: MEDIUM**
If the `DocumentContext` provider is not wrapped around all routes in `App.jsx`, child pages will fail to access shared state silently.

**Mitigation Required:**
- Wrap `<BrowserRouter>` inside the Context Provider, not the other way around
- Test every page's access to context values before finalizing

---

## 🟡 RISK-11 — File Upload Size Limit in FastAPI
**Severity: MEDIUM**
FastAPI by default limits request body size. Large PDFs (>10MB) will return a 413 error.

**Mitigation Required:**
- Set `max_upload_size` explicitly using uvicorn configuration or middleware
- Validate file type on the frontend before upload (accept only `.pdf`)

---

## 🟡 RISK-12 — Tailwind CSS Not Purging / Not Found Classes
**Severity: LOW-MEDIUM**
If `tailwind.config.js` content paths are misconfigured, Tailwind classes won't compile and all styling will break silently.

**Mitigation Required:**
- Ensure content includes `"./src/**/*.{js,jsx,ts,tsx}"`
- Run `npm run dev` and verify styles render before writing more components

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 1 — PROJECT IDENTITY & MISSION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Project Name
`medical-ai-assistant`

## Mission Statement
Build a complete, production-style, lightweight Medical Document AI Platform that:
- accepts medical PDF uploads (lab reports, prescriptions, discharge summaries, clinical notes)
- extracts and indexes medical content using hybrid retrieval
- answers medical questions with source-grounded, confidence-aware responses
- generates structured patient summaries
- supports scanned PDFs via OCR fallback
- maintains high reliability through multi-key API failover
- deploys with zero heavy infrastructure

## Target Users
Healthcare professionals, medical students, and patients who need intelligent analysis of medical documents.

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 2 — MANDATORY TECHNOLOGY STACK
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Layer | Required Technology | Version / Notes |
|---|---|---|
| Frontend Framework | React | 18.x |
| Build Tool | Vite | 5.x |
| Styling | Tailwind CSS | 3.x |
| Routing | React Router DOM | 6.x |
| API Communication | Axios | 1.x |
| State Management | React Context API | Built-in |
| Backend Framework | FastAPI | 0.111.x |
| ASGI Server | Uvicorn | 0.29.x |
| PDF Parsing | PyMuPDF (fitz) | 1.24.x |
| OCR Engine | EasyOCR | 1.7.x |
| Embeddings | Voyage AI — `voyage-large-3` | voyageai SDK |
| Vector Store | FAISS (CPU) | faiss-cpu |
| Keyword Retrieval | rank_bm25 | 0.2.x |
| RAG Framework | LangChain + langchain-text-splitters | Pinned (see Risk-09) |
| LLM | Groq `llama3-70b-8192` | groq SDK |
| Validation | Pydantic | v2 |
| Env Management | python-dotenv | 1.x |
| Language | Python | 3.11 |

## ❌ STRICTLY FORBIDDEN TECHNOLOGIES

The following are explicitly banned. Do NOT introduce them for any reason:

| Banned | Reason |
|---|---|
| Next.js | Wrong framework |
| Django / Flask | Wrong backend |
| PostgreSQL / MongoDB / Redis | Heavy infrastructure |
| Celery / Kafka | Async overkill |
| Docker / Kubernetes | Deployment complexity |
| Microservices | Architecture violation |
| Redux / Zustand / MobX | Unnecessary state libraries |
| PaddleOCR / Cloud OCR APIs | Wrong OCR engine |
| BioBERT / Custom ML training | No custom training allowed |
| voyage-large-2 | Wrong model version |

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 3 — API CREDENTIALS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

> ⚠️ Store these in `backend/.env` only. Never hardcode in source files.

```env
# backend/.env

GROQ_API_KEYS=YOUR GROK API KEYS

VOYAGE_API_KEYS=YOUR VOYAGE API KEY
```

> ⚠️ `GROQ_API_KEYS` is a comma-separated list of two keys. The `APIKeyManager` will rotate between them.
> ⚠️ `VOYAGE_API_KEYS` has one key. The manager must still support multi-key rotation pattern for future scalability.

### backend/.env.example (commit this, not .env)
```env
GROQ_API_KEYS=your_groq_key_1,your_groq_key_2
VOYAGE_API_KEYS=your_voyage_key_1
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 4 — COMPLETE PROJECT STRUCTURE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate EXACTLY this file tree. Do not add or remove any files without explicit justification.

```text
medical-ai-assistant/
│
├── frontend/
│   ├── public/
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── UploadCard.jsx
│   │   │   ├── ChatBubble.jsx
│   │   │   ├── ConfidenceBadge.jsx
│   │   │   ├── SourceCard.jsx
│   │   │   ├── SummarySection.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorAlert.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ChatAssistant.jsx
│   │   │   ├── MedicalSummary.jsx
│   │   │   └── EvidenceViewer.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── context/
│   │   │   └── DocumentContext.jsx
│   │   │
│   │   ├── hooks/
│   │   │   └── useDocument.js
│   │   │
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env                    ← NOT committed
│   ├── .env.example            ← committed
│   ├── faiss_index.bin         ← auto-generated, NOT committed
│   ├── faiss_meta.pkl          ← auto-generated, NOT committed
│   │
│   └── modules/
│       ├── __init__.py
│       ├── api_manager.py
│       ├── pdf_parser.py
│       ├── ocr.py
│       ├── chunking.py
│       ├── embeddings.py
│       ├── vector_store.py
│       ├── hybrid_retrieval.py
│       ├── reranker.py
│       ├── rag_pipeline.py
│       ├── entities.py
│       ├── medical_summary.py
│       ├── confidence.py
│       ├── safety.py
│       └── prompts.py
│
└── .gitignore
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 5 — BACKEND IMPLEMENTATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 5.1 — requirements.txt

```text
fastapi==0.111.0
uvicorn==0.29.0
python-multipart==0.0.9
python-dotenv==1.0.1
pydantic==2.7.1
pymupdf==1.24.5
easyocr==1.7.1
voyageai==0.2.3
faiss-cpu==1.8.0
rank-bm25==0.2.2
langchain==0.2.16
langchain-community==0.2.16
langchain-text-splitters==0.2.4
groq==0.9.0
httpx==0.27.0
numpy==1.26.4
pillow==10.3.0
```

> ⚠️ Pin ALL versions exactly as shown. Do NOT use `>=` ranges. This prevents runtime breakage.

---

## 5.2 — modules/api_manager.py

> ⚠️ **COMPLEX MODULE — READ CAREFULLY**
> This module is the single most critical infrastructure component. A bug here breaks ALL API calls.

```python
"""
api_manager.py
Manages multi-key rotation for Groq and Voyage AI.
Uses itertools.cycle for infinite round-robin rotation.
"""

import os
import itertools
import time
from dotenv import load_dotenv

load_dotenv()


class APIKeyManager:
    """
    Rotates through a list of API keys.
    On rate-limit or auth failure, auto-advances to the next key.
    """

    def __init__(self, env_var: str, service_name: str):
        raw = os.getenv(env_var, "")
        keys = [k.strip() for k in raw.split(",") if k.strip()]

        if not keys:
            raise ValueError(
                f"[APIKeyManager] No API keys found for {service_name}. "
                f"Check your .env file for variable: {env_var}"
            )

        self.service_name = service_name
        self.keys = keys
        self._cycle = itertools.cycle(keys)
        self._current = next(self._cycle)
        print(f"[APIKeyManager] Loaded {len(keys)} key(s) for {service_name}")

    def get_key(self) -> str:
        return self._current

    def rotate(self):
        """Advance to the next key in the rotation."""
        self._current = next(self._cycle)
        print(f"[APIKeyManager] Rotated to next key for {self.service_name}")

    def call_with_retry(self, func, max_retries: int = 3):
        """
        Execute func(api_key) with automatic key rotation on failure.
        Retries up to max_retries times across different keys.
        """
        last_error = None
        for attempt in range(max_retries):
            try:
                return func(self.get_key())
            except Exception as e:
                error_str = str(e).lower()
                last_error = e
                if "429" in error_str or "rate" in error_str or "auth" in error_str:
                    print(
                        f"[APIKeyManager] Attempt {attempt + 1}/{max_retries} "
                        f"failed for {self.service_name}: {e}. Rotating key."
                    )
                    self.rotate()
                    time.sleep(1.5)
                else:
                    raise e
        raise RuntimeError(
            f"[APIKeyManager] All {max_retries} attempts failed for "
            f"{self.service_name}. Last error: {last_error}"
        )


# Singleton instances — initialized once on module load
groq_manager = APIKeyManager("GROQ_API_KEYS", "Groq")
voyage_manager = APIKeyManager("VOYAGE_API_KEYS", "VoyageAI")
```

---

## 5.3 — modules/pdf_parser.py

```python
"""
pdf_parser.py
Extracts text from PDFs using PyMuPDF.
Returns page-wise text with metadata.
Detects scanned PDFs and signals OCR fallback.
"""

import fitz  # PyMuPDF
from typing import List, Dict


def extract_text_from_pdf(file_bytes: bytes) -> Dict:
    """
    Extract text from each page of the PDF.
    Returns:
        {
            "pages": [{"page": 1, "text": "..."}, ...],
            "full_text": "...",
            "needs_ocr": True/False,
            "page_count": N
        }
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages = []
    full_text = ""

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")
        pages.append({
            "page": page_num + 1,
            "text": text
        })
        full_text += text + "\n"

    doc.close()

    return {
        "pages": pages,
        "full_text": full_text,
        "needs_ocr": _needs_ocr(full_text),
        "page_count": len(pages)
    }


def _needs_ocr(text: str, threshold: int = 100) -> bool:
    """Return True if extracted text is too sparse (scanned PDF)."""
    clean = text.strip().replace("\n", "").replace(" ", "")
    return len(clean) < threshold
```

---

## 5.4 — modules/ocr.py

> ⚠️ **HIGH RISK — See RISK-01. Lazy loading is mandatory.**

```python
"""
ocr.py
OCR fallback using EasyOCR.
Only activated when PDF text extraction is insufficient.
Reader is loaded lazily to avoid startup hangs.
"""

import fitz
import numpy as np
from typing import List, Dict

_ocr_reader = None


def _get_reader():
    """Lazy loader for EasyOCR reader."""
    global _ocr_reader
    if _ocr_reader is None:
        try:
            import easyocr
            print("[OCR] Loading EasyOCR model (first time may take 30s)...")
            _ocr_reader = easyocr.Reader(['en'], gpu=False)
            print("[OCR] EasyOCR model loaded successfully.")
        except Exception as e:
            print(f"[OCR] WARNING: Could not load EasyOCR: {e}")
            _ocr_reader = None
    return _ocr_reader


def extract_text_with_ocr(file_bytes: bytes) -> List[Dict]:
    """
    Use EasyOCR to extract text from each page of a scanned PDF.
    Returns list of {"page": N, "text": "..."} dicts.
    Falls back to empty text if OCR is unavailable.
    """
    reader = _get_reader()
    if reader is None:
        return [{"page": 1, "text": "[OCR unavailable]"}]

    doc = fitz.open(stream=file_bytes, filetype="pdf")
    results = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        # Render page to image at 2x resolution for better OCR accuracy
        mat = fitz.Matrix(2.0, 2.0)
        pix = page.get_pixmap(matrix=mat)
        img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(
            pix.height, pix.width, pix.n
        )

        try:
            ocr_result = reader.readtext(img_array, detail=0, paragraph=True)
            text = "\n".join(ocr_result)
        except Exception as e:
            print(f"[OCR] Page {page_num + 1} failed: {e}")
            text = ""

        results.append({"page": page_num + 1, "text": text})

    doc.close()
    return results
```

---

## 5.5 — modules/chunking.py

```python
"""
chunking.py
Splits medical document text into overlapping chunks.
Preserves page metadata for source tracking.
"""

from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List, Dict


CHUNK_SIZE = 700
CHUNK_OVERLAP = 120


def chunk_pages(pages: List[Dict]) -> List[Dict]:
    """
    Split page texts into chunks.
    Each chunk preserves its source page number.

    Args:
        pages: [{"page": 1, "text": "..."}, ...]

    Returns:
        [{"chunk_id": 0, "text": "...", "page": 1, "source": "page_1"}, ...]
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""]
    )

    all_chunks = []
    chunk_id = 0

    for page_data in pages:
        page_num = page_data["page"]
        text = page_data["text"].strip()

        if not text:
            continue

        splits = splitter.split_text(text)
        for split_text in splits:
            if split_text.strip():
                all_chunks.append({
                    "chunk_id": chunk_id,
                    "text": split_text.strip(),
                    "page": page_num,
                    "source": f"page_{page_num}"
                })
                chunk_id += 1

    print(f"[Chunking] Created {len(all_chunks)} chunks from {len(pages)} pages.")
    return all_chunks
```

---

## 5.6 — modules/embeddings.py

> ⚠️ **HIGH RISK — See RISK-03 (wrong model) and RISK-08 (batch size).**

```python
"""
embeddings.py
Generates semantic embeddings using Voyage AI voyage-large-3.
Batches requests to respect API limits.
Uses APIKeyManager for key rotation.
"""

from modules.api_manager import voyage_manager
from typing import List
import voyageai

VOYAGE_MODEL = "voyage-large-3"   # ← DO NOT CHANGE TO voyage-large-2
BATCH_SIZE = 8


def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for a list of texts.
    Automatically batches and retries on failure.
    """
    if not texts:
        return []

    all_embeddings = []

    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i + BATCH_SIZE]

        def _call(api_key):
            client = voyageai.Client(api_key=api_key)
            result = client.embed(batch, model=VOYAGE_MODEL, input_type="document")
            return result.embeddings

        batch_embeddings = voyage_manager.call_with_retry(_call)
        all_embeddings.extend(batch_embeddings)

    print(f"[Embeddings] Generated {len(all_embeddings)} embeddings using {VOYAGE_MODEL}.")
    return all_embeddings


def embed_query(query: str) -> List[float]:
    """
    Generate embedding for a single query string.
    Uses input_type='query' for retrieval-optimized embedding.
    """
    def _call(api_key):
        client = voyageai.Client(api_key=api_key)
        result = client.embed([query], model=VOYAGE_MODEL, input_type="query")
        return result.embeddings[0]

    return voyage_manager.call_with_retry(_call)
```

---

## 5.7 — modules/vector_store.py

> ⚠️ **HIGH RISK — See RISK-02. FAISS persistence is mandatory.**

```python
"""
vector_store.py
Manages FAISS vector index.
Persists index to disk to survive server restarts.
"""

import faiss
import numpy as np
import pickle
import os
from typing import List, Dict, Optional

INDEX_PATH = "faiss_index.bin"
META_PATH = "faiss_meta.pkl"

# Global state
faiss_index: Optional[faiss.Index] = None
chunk_metadata: List[Dict] = []


def initialize_store():
    """Load existing index from disk if available."""
    global faiss_index, chunk_metadata

    if os.path.exists(INDEX_PATH) and os.path.exists(META_PATH):
        try:
            faiss_index = faiss.read_index(INDEX_PATH)
            with open(META_PATH, "rb") as f:
                chunk_metadata = pickle.load(f)
            print(f"[VectorStore] Loaded existing index with {faiss_index.ntotal} vectors.")
        except Exception as e:
            print(f"[VectorStore] Failed to load existing index: {e}. Starting fresh.")
            faiss_index = None
            chunk_metadata = []


def build_index(chunks: List[Dict], embeddings: List[List[float]]):
    """Build FAISS index from chunks and their embeddings."""
    global faiss_index, chunk_metadata

    if not embeddings:
        raise ValueError("[VectorStore] Cannot build index with empty embeddings.")

    dim = len(embeddings[0])
    index = faiss.IndexFlatIP(dim)  # Inner product (cosine similarity with normalized vecs)

    vectors = np.array(embeddings, dtype=np.float32)
    # Normalize for cosine similarity
    faiss.normalize_L2(vectors)
    index.add(vectors)

    faiss_index = index
    chunk_metadata = chunks

    # Persist to disk
    faiss.write_index(faiss_index, INDEX_PATH)
    with open(META_PATH, "wb") as f:
        pickle.dump(chunk_metadata, f)

    print(f"[VectorStore] Built and saved index with {index.ntotal} vectors.")


def faiss_search(query_embedding: List[float], top_k: int = 10) -> List[Dict]:
    """Search FAISS index and return top_k results with scores."""
    if faiss_index is None or faiss_index.ntotal == 0:
        print("[VectorStore] Index is empty. Returning no results.")
        return []

    query_vec = np.array([query_embedding], dtype=np.float32)
    faiss.normalize_L2(query_vec)

    scores, indices = faiss_index.search(query_vec, min(top_k, faiss_index.ntotal))

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx >= 0 and idx < len(chunk_metadata):
            result = dict(chunk_metadata[idx])
            result["faiss_score"] = float(score)
            results.append(result)

    return results
```

---

## 5.8 — modules/hybrid_retrieval.py

> ⚠️ **HIGH RISK — See RISK-04. Guard against empty corpus.**

```python
"""
hybrid_retrieval.py
Combines FAISS semantic search and BM25 keyword search.
Merges results using reciprocal rank fusion.
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
```

---

## 5.9 — modules/reranker.py

```python
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
```

---

## 5.10 — modules/prompts.py

```python
"""
prompts.py
Centralized prompt templates.
Medical system prompt enforces grounded responses only.
"""

MEDICAL_SYSTEM_PROMPT = """You are a highly accurate medical document assistant.

STRICT RULES:
1. Answer ONLY using the provided medical context below.
2. Do NOT hallucinate, infer, or assume any information not present in the context.
3. If the answer cannot be found in the provided context, respond EXACTLY with:
   "Insufficient medical evidence found in uploaded document."
4. Be medically precise and use correct clinical terminology.
5. Do NOT provide general medical advice beyond what the document states.
6. Prioritize factual correctness over response completeness.
7. Always reference specific findings from the document when possible.

Medical Context:
{context}"""


SUMMARY_EXTRACTION_PROMPT = """You are a medical information extraction engine.

Extract ONLY information explicitly mentioned in the document below.
Return a valid JSON object with EXACTLY these fields:
{{
    "diseases": ["list of diseases or diagnoses"],
    "medications": ["list of medications with dosages if available"],
    "allergies": ["list of allergies"],
    "abnormalities": ["list of abnormal findings"],
    "recommendations": ["list of recommendations or follow-up actions"]
}}

Rules:
- Use ONLY information present in the document
- Return empty lists [] if a category has no mentions
- Do NOT add general medical knowledge
- Output ONLY the JSON object, no other text

Medical Document:
{document_text}"""
```

---

## 5.11 — modules/confidence.py

```python
"""
confidence.py
Computes confidence level based on retrieval quality.
"""

from typing import List, Dict


def compute_confidence(chunks: List[Dict]) -> Dict:
    """
    Compute confidence from top retrieved chunk scores.
    Returns:
        {"level": "High"|"Medium"|"Low", "score": float}
    """
    if not chunks:
        return {"level": "Low", "score": 0.0}

    top_score = chunks[0].get("rerank_score", chunks[0].get("faiss_score", 0.0))

    if top_score > 0.80:
        level = "High"
    elif top_score > 0.60:
        level = "Medium"
    else:
        level = "Low"

    return {"level": level, "score": round(top_score, 4)}
```

---

## 5.12 — modules/safety.py

```python
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
MIN_RERANK_SCORE = 0.10


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
```

---

## 5.13 — modules/entities.py (Pydantic Schemas)

```python
"""
entities.py
Pydantic v2 schemas for request/response validation.
"""

from pydantic import BaseModel
from typing import List, Optional


class MedicalSummary(BaseModel):
    diseases: List[str] = []
    medications: List[str] = []
    allergies: List[str] = []
    abnormalities: List[str] = []
    recommendations: List[str] = []


class SourceChunk(BaseModel):
    chunk_id: int
    text: str
    page: int
    source: str
    rerank_score: Optional[float] = None


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    confidence: dict
    sources: List[SourceChunk]


class UploadResponse(BaseModel):
    success: bool
    message: str
    page_count: int
    chunk_count: int
    used_ocr: bool


class HealthResponse(BaseModel):
    status: str
    version: str
```

---

## 5.14 — modules/rag_pipeline.py

> ⚠️ **COMPLEX MODULE — Core of the entire system.**

```python
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
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            temperature=0.1,
            max_tokens=1024
        )
        return response.choices[0].message.content

    answer = groq_manager.call_with_retry(_call_groq)

    # Step 6: Confidence scoring
    confidence = compute_confidence(top_chunks)

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
```

---

## 5.15 — modules/medical_summary.py

```python
"""
medical_summary.py
Generates structured medical summary using LLM extraction.
"""

import json
import re
from modules.api_manager import groq_manager
from modules.prompts import SUMMARY_EXTRACTION_PROMPT
from modules.entities import MedicalSummary
import groq as groq_sdk

# Session-level document text cache
_document_text: str = ""


def set_document_text(text: str):
    global _document_text
    _document_text = text


def get_medical_summary() -> MedicalSummary:
    """Extract structured medical entities from the stored document."""
    if not _document_text.strip():
        return MedicalSummary()

    # Truncate to avoid token limit (use first 6000 chars)
    truncated = _document_text[:6000]
    prompt = SUMMARY_EXTRACTION_PROMPT.format(document_text=truncated)

    def _call(api_key: str) -> str:
        client = groq_sdk.Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=1024
        )
        return response.choices[0].message.content

    raw = groq_manager.call_with_retry(_call)

    # Parse JSON safely
    try:
        # Strip markdown fences if present
        clean = re.sub(r"```json|```", "", raw).strip()
        data = json.loads(clean)
        return MedicalSummary(**data)
    except Exception as e:
        print(f"[Summary] JSON parse failed: {e}. Returning empty summary.")
        return MedicalSummary()
```

---

## 5.16 — main.py

```python
"""
main.py
FastAPI application entry point.
Registers all routes and middleware.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
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
from modules.medical_summary import get_medical_summary, set_document_text
from typing import List
import uvicorn

app = FastAPI(
    title="Medical AI Assistant API",
    description="Hybrid RAG platform for medical document analysis",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load existing FAISS index on startup
@app.on_event("startup")
async def startup_event():
    initialize_store()
    print("[Startup] Medical AI Assistant backend is ready.")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", version="1.0.0")


@app.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    file_bytes = await file.read()

    # Extract text
    extracted = extract_text_from_pdf(file_bytes)
    used_ocr = False

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

    # Embed
    texts = [c["text"] for c in chunks]
    embeddings = embed_texts(texts)

    # Build indexes
    build_index(chunks, embeddings)
    build_bm25(chunks)

    # Store document text for summary
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


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 6 — FRONTEND IMPLEMENTATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 6.1 — package.json

```json
{
  "name": "medical-ai-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1",
    "axios": "^1.7.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "^5.2.13"
  }
}
```

---

## 6.2 — vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

---

## 6.3 — tailwind.config.js

> ⚠️ **See RISK-12. Content paths must be correct.**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
        }
      }
    },
  },
  plugins: [],
}
```

---

## 6.4 — src/services/api.js

```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 120000,  // 2 minutes for LLM responses
});

export const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await API.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const sendChatMessage = async (question) => {
  const res = await API.post('/chat', { question });
  return res.data;
};

export const getMedicalSummary = async () => {
  const res = await API.get('/summary');
  return res.data;
};

export const getSources = async (query) => {
  const res = await API.get('/sources', { params: { query } });
  return res.data;
};

export const getHealth = async () => {
  const res = await API.get('/health');
  return res.data;
};
```

---

## 6.5 — src/context/DocumentContext.jsx

> ⚠️ **See RISK-10. This must wrap the entire app.**

```jsx
import { createContext, useContext, useState } from 'react';

const DocumentContext = createContext(null);

export const DocumentProvider = ({ children }) => {
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [uploadMeta, setUploadMeta] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const addChatMessage = (message) => {
    setChatHistory(prev => [...prev, message]);
  };

  const clearAll = () => {
    setDocumentLoaded(false);
    setUploadMeta(null);
    setChatHistory([]);
    setSummary(null);
  };

  return (
    <DocumentContext.Provider value={{
      documentLoaded, setDocumentLoaded,
      uploadMeta, setUploadMeta,
      chatHistory, addChatMessage,
      summary, setSummary,
      isUploading, setIsUploading,
      uploadError, setUploadError,
      clearAll
    }}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocument = () => {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error('useDocument must be used within DocumentProvider');
  return ctx;
};
```

---

## 6.6 — src/App.jsx

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DocumentProvider } from './context/DocumentContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import ChatAssistant from './pages/ChatAssistant';
import MedicalSummary from './pages/MedicalSummary';
import EvidenceViewer from './pages/EvidenceViewer';

function App() {
  return (
    <DocumentProvider>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<ChatAssistant />} />
            <Route path="/summary" element={<MedicalSummary />} />
            <Route path="/evidence" element={<EvidenceViewer />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </DocumentProvider>
  );
}

export default App;
```

---

## 6.7 — Component Specifications

### src/components/ConfidenceBadge.jsx
Renders a colored badge based on confidence level:
- `"High"` → green badge (`bg-green-100 text-green-800`)
- `"Medium"` → yellow badge (`bg-yellow-100 text-yellow-800`)
- `"Low"` → red badge (`bg-red-100 text-red-800`)

### src/components/SourceCard.jsx
Displays one retrieved source chunk with:
- Page number label
- Truncated chunk text (max 300 chars, expandable)
- Rerank score display

### src/components/ChatBubble.jsx
Renders a single chat message with:
- User/assistant distinction (right/left alignment)
- Assistant messages include ConfidenceBadge below the answer
- Source list at bottom (collapsed by default, expandable)

### src/components/UploadCard.jsx
File upload drag-and-drop card with:
- Drag-and-drop zone
- File input fallback (`.pdf` only)
- Upload progress display
- Error alert if upload fails

### src/components/LoadingSpinner.jsx
Simple centered spinner for loading states. Use Tailwind `animate-spin`.

### src/components/ErrorAlert.jsx
Red alert box with error message. Dismissible.

### src/components/SummarySection.jsx
Displays one category from MedicalSummary (e.g., "Diseases") as a labeled list. Shows empty state if list is empty.

### src/layouts/MainLayout.jsx
Outer layout wrapper with:
- Responsive sidebar navigation (Dashboard, Chat, Summary, Evidence)
- Mobile hamburger menu
- `<main>` content area
- Footer with version info

---

## 6.8 — Page Specifications

### src/pages/Dashboard.jsx
- Upload card (UploadCard component)
- On successful upload: display document metadata (pages, chunks, OCR used)
- Navigation buttons to Chat and Summary pages
- Health check indicator (green dot if backend is reachable)

### src/pages/ChatAssistant.jsx
- Chat history display (ChatBubble components)
- Input box + send button
- Loading state while waiting for response
- Guard: if no document loaded, show "Please upload a document first"

### src/pages/MedicalSummary.jsx
- "Generate Summary" button
- Grid of SummarySection components for each category
- Loading state during generation
- Guard: if no document loaded, show placeholder

### src/pages/EvidenceViewer.jsx
- Search input for queries
- Display list of SourceCard components
- Show chunk count and page numbers

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 7 — EXECUTION COMMANDS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Backend
```bash
cd medical-ai-assistant/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and edit environment variables
cp .env.example .env
# (already pre-filled in Part 3 above)

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend
```bash
cd medical-ai-assistant/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Access the app at: `http://localhost:5173`
API available at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 8 — .gitignore
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```gitignore
# Backend
backend/.env
backend/venv/
backend/__pycache__/
backend/modules/__pycache__/
backend/*.bin
backend/*.pkl
backend/*.log

# Frontend
frontend/node_modules/
frontend/dist/

# Python
*.pyc
*.pyo
__pycache__/
.pytest_cache/

# OS
.DS_Store
Thumbs.db
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 9 — IMPLEMENTATION PHASES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Execute in STRICT ORDER. Do not skip phases.

## PHASE 1 — Foundation (Do this first)
1. Create full directory structure exactly as specified in Part 4
2. Create `backend/requirements.txt` (Part 5.1)
3. Create `backend/.env` with API keys (Part 3)
4. Create `backend/.env.example`
5. Create `backend/modules/__init__.py` (empty file)
6. Create `frontend/package.json` (Part 6.1)
7. Create `frontend/vite.config.js` (Part 6.2)
8. Create `frontend/tailwind.config.js` (Part 6.3)

## PHASE 2 — Backend Core
1. `api_manager.py` (Part 5.2) ← CRITICAL, build first
2. `entities.py` (Part 5.13)
3. `pdf_parser.py` (Part 5.3)
4. `ocr.py` (Part 5.4)
5. `chunking.py` (Part 5.5)
6. `embeddings.py` (Part 5.6)
7. `vector_store.py` (Part 5.7)
8. `hybrid_retrieval.py` (Part 5.8)
9. `reranker.py` (Part 5.9)
10. `prompts.py` (Part 5.10)
11. `confidence.py` (Part 5.11)
12. `safety.py` (Part 5.12)
13. `rag_pipeline.py` (Part 5.14)
14. `medical_summary.py` (Part 5.15)
15. `main.py` (Part 5.16)

## PHASE 3 — Frontend Core
1. `src/services/api.js` (Part 6.4)
2. `src/context/DocumentContext.jsx` (Part 6.5)
3. `src/App.jsx` (Part 6.6)
4. All components (Part 6.7) — build in order listed
5. All pages (Part 6.8) — build in order listed
6. `src/main.jsx` — standard Vite React entry point

## PHASE 4 — Integration & Polish
1. Test upload → chunking → embedding → retrieval pipeline end-to-end
2. Test chat with a medical question
3. Test summary generation
4. Verify CORS is working between ports 5173 and 8000
5. Verify FAISS persists after server restart
6. Verify OCR fallback activates for a scanned PDF
7. Verify confidence badges render correctly
8. Verify key rotation works (test with invalid first key)
9. Add responsive CSS for mobile viewports
10. Add loading states to all async operations

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 10 — FINAL SUCCESS CHECKLIST
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

> Agent MUST verify every item before declaring the build complete.

| # | Checkpoint | How to Verify |
|---|---|---|
| 1 | React frontend renders at localhost:5173 | Open browser |
| 2 | FastAPI backend responds at localhost:8000/health | GET /health returns `{"status":"ok"}` |
| 3 | PDF upload succeeds | POST /upload with a PDF, returns chunk_count > 0 |
| 4 | FAISS index persists after restart | Restart backend, query still works |
| 5 | OCR fallback activates on scanned PDF | Upload image-only PDF, used_ocr=true in response |
| 6 | Hybrid retrieval returns results | POST /chat returns sources array |
| 7 | Confidence badge renders | Chat response shows High/Medium/Low |
| 8 | Medical summary generates | GET /summary returns non-empty categories |
| 9 | Groq key rotation works | Temporarily invalidate first key, second key picks up |
| 10 | Insufficient evidence response triggers | Ask question about content not in document |
| 11 | CORS does not block frontend | Chat works from browser without CORS errors in console |
| 12 | Tailwind styles render | Components have correct colors and layout |
| 13 | All 4 frontend pages navigate correctly | Click all nav links |
| 14 | Error states display gracefully | Upload non-PDF file, verify error alert |
| 15 | voyage-large-3 is used exclusively | Check embeddings.py VOYAGE_MODEL constant |

---

> ✅ Build is complete when ALL 15 checkpoints pass.
> ❌ Do NOT declare success if any checkpoint fails.
> 🔁 If a checkpoint fails, return to the relevant RISK entry in Part 0 for the fix.

---

*Generated for Google Antigravity Autonomous Execution*
*Medical AI Assistant — v1.0.0*
