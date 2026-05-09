# IMPLEMENTATION_GUIDE.md
# Strict Autonomous Build Instructions
## React + Vite + FastAPI Medical RAG Platform
## Optimized for Google Antigravity Autonomous Development

---

# PRIMARY DIRECTIVE

Generate a complete end-to-end Medical Document AI Assistant using:

- React + Vite frontend
- FastAPI backend
- Hybrid Retrieval-Augmented Generation (RAG)
- Groq Llama-3 inference
- Voyage AI embeddings
- FAISS vector retrieval
- BM25 keyword retrieval

The implementation MUST prioritize:
1. Stability
2. Retrieval accuracy
3. Minimal hallucination
4. Lightweight deployment
5. Modular architecture
6. Minimal manual intervention

---

# MANDATORY TECHNOLOGY STACK

| Purpose | Required Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Routing | React Router DOM |
| API Communication | Axios |
| Backend | FastAPI |
| PDF Parsing | PyMuPDF |
| OCR | EasyOCR |
| Embeddings | Voyage AI |
| Vector Store | FAISS |
| Keyword Retrieval | rank_bm25 |
| RAG Framework | LangChain |
| LLM | Groq llama3-70b-8192 |
| Validation | Pydantic |
| Environment Variables | python-dotenv |

---

# STRICTLY FORBIDDEN

DO NOT USE:

❌ Next.js  
❌ Django  
❌ Flask  
❌ PostgreSQL  
❌ MongoDB  
❌ Redis  
❌ Kafka  
❌ Celery  
❌ Kubernetes  
❌ Docker  
❌ Microservices  
❌ Distributed systems  
❌ Multi-agent orchestration  
❌ Custom ML training  
❌ BioBERT fine-tuning  
❌ Heavy infrastructure  

The system MUST remain lightweight.

---

# REQUIRED PROJECT STRUCTURE

```text
medical-ai-assistant/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   └── App.jsx
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   │
│   ├── modules/
│   │   ├── api_manager.py
│   │   ├── pdf_parser.py
│   │   ├── ocr.py
│   │   ├── chunking.py
│   │   ├── embeddings.py
│   │   ├── hybrid_retrieval.py
│   │   ├── vector_store.py
│   │   ├── reranker.py
│   │   ├── rag_pipeline.py
│   │   ├── entities.py
│   │   ├── medical_summary.py
│   │   ├── confidence.py
│   │   ├── safety.py
│   │   └── prompts.py
```

---

# FRONTEND REQUIREMENTS

# Build React + Vite Frontend

The frontend MUST:
- be responsive
- use Tailwind CSS
- remain lightweight
- avoid heavy animations
- prioritize readability

---

# REQUIRED FRONTEND PAGES

## Dashboard
Features:
- PDF upload
- upload status
- metadata display

---

## Chat Assistant
Features:
- medical Q&A
- streaming responses
- source evidence
- confidence indicators

---

## Medical Summary
Display:
- diseases
- medications
- allergies
- abnormalities
- recommendations

---

## Source Evidence Viewer
Display:
- retrieved chunks
- source pages
- supporting evidence

---

# FRONTEND STATE MANAGEMENT

Use:
- React Context API

DO NOT use:
- Redux
- Zustand
- MobX

---

# FRONTEND API COMMUNICATION

Use:
```javascript
Axios
```

Create centralized API service layer.

---

# BACKEND REQUIREMENTS

# Build FastAPI Backend

FastAPI MUST handle:
- PDF uploads
- OCR processing
- embedding generation
- retrieval
- RAG inference
- structured extraction
- confidence scoring

---

# REQUIRED API ENDPOINTS

## POST /upload
Upload medical PDFs.

---

## POST /chat
Medical question answering.

---

## GET /summary
Return structured medical summary.

---

## GET /sources
Return retrieval evidence.

---

## GET /health
Health check endpoint.

---

# PDF PROCESSING REQUIREMENTS

Use:
```python
PyMuPDF
```

Requirements:
- page-wise extraction
- metadata preservation
- source tracking

---

# OCR REQUIREMENTS

Activate OCR ONLY if:
- scanned PDF detected
OR
- extracted text quality is weak

Use ONLY:
```python
EasyOCR
```

DO NOT use:
- PaddleOCR
- cloud OCR APIs

---

# CHUNKING REQUIREMENTS

Use:
```python
RecursiveCharacterTextSplitter
```

STRICT PARAMETERS:

```python
chunk_size = 700
chunk_overlap = 120
```

Store:
- chunk text
- source page
- metadata

---

# EMBEDDING REQUIREMENTS

Use ONLY:
```text
voyage-large-2
```

Requirements:
- semantic embeddings
- metadata preservation
- FAISS compatibility

---

# HYBRID RETRIEVAL REQUIREMENTS

MANDATORY.

Combine:
1. FAISS semantic retrieval
2. BM25 keyword retrieval

Use:
```python
rank_bm25
```

---

# HYBRID RETRIEVAL FLOW

```text
User Query
    ↓
FAISS Semantic Search
    +
BM25 Keyword Search
    ↓
Merge Results
    ↓
Rerank Results
    ↓
Top Medical Context
```

---

# RERANKING REQUIREMENTS

Rerank chunks using:
- semantic similarity
- keyword overlap
- medical terminology relevance

Return:
```python
top_k = 5
```

highest-quality chunks.

---

# MULTI-API KEY MANAGEMENT

MANDATORY FEATURE.

Create:
```text
backend/modules/api_manager.py
```

Responsibilities:
- load multiple API keys
- rotate keys automatically
- retry failed requests
- switch keys on rate-limit errors
- prevent crashes

Use:
```python
itertools.cycle
```

AND:
```python
python-dotenv
```

---

# REQUIRED ENVIRONMENT VARIABLES

```env
GROQ_API_KEYS=key1,key2,key3
VOYAGE_API_KEYS=vkey1,vkey2
```

---

# LLM REQUIREMENTS

Use ONLY:
```text
Groq llama3-70b-8192
```

Recommended:
```python
temperature = 0.1
```

Goals:
- low hallucination
- deterministic behavior
- factual consistency

---

# STRICT MEDICAL PROMPTING

Use EXACT behavior.

```text
You are a highly accurate medical document assistant.

STRICT RULES:
1. Use ONLY the provided medical context.
2. Do NOT hallucinate.
3. If information is unavailable, say:
   "Insufficient medical evidence found in uploaded document."
4. Be medically precise.
5. Prioritize factual correctness over completeness.
```

---

# STRUCTURED EXTRACTION REQUIREMENTS

Extract:
- diseases
- medications
- allergies
- symptoms
- abnormalities
- recommendations

Use:
- Pydantic
- regex
- structured LLM outputs

DO NOT train custom models.

---

# REQUIRED PYDANTIC SCHEMA

```python
class MedicalSummary(BaseModel):
    diseases: list[str]
    medications: list[str]
    allergies: list[str]
    abnormalities: list[str]
    recommendations: list[str]
```

---

# CONFIDENCE SCORING REQUIREMENTS

Required logic:

```python
if similarity_score > 0.80:
    confidence = "High"

elif similarity_score > 0.60:
    confidence = "Medium"

else:
    confidence = "Low"
```

Display confidence in the frontend UI.

---

# SAFETY VALIDATION REQUIREMENTS

Before generating final answers:
- validate retrieval quality
- validate evidence sufficiency
- detect hallucination risk

If evidence is weak:
```text
Insufficient medical evidence found in uploaded document.
```

This behavior is mandatory.

---

# SOURCE EVIDENCE REQUIREMENTS

Every response MUST include:
- source chunk
- source page number
- supporting evidence

---

# REQUIRED FRONTEND DEPENDENCIES

Include:
- react
- vite
- tailwindcss
- axios
- react-router-dom

---

# REQUIRED BACKEND DEPENDENCIES

Include:
- fastapi
- uvicorn
- langchain
- faiss-cpu
- pymupdf
- easyocr
- rank-bm25
- pydantic
- voyageai
- groq
- python-dotenv

---

# ERROR HANDLING REQUIREMENTS

Handle gracefully:
- invalid PDFs
- OCR failures
- API failures
- rate limits
- embedding failures
- empty retrievals
- missing API keys

The application MUST avoid crashing.

---

# PERFORMANCE REQUIREMENTS

The system MUST:
- remain lightweight
- load quickly
- support moderate PDF sizes
- minimize memory usage
- optimize retrieval speed

---

# IMPLEMENTATION ORDER

# PHASE 1 — CORE FRONTEND/BACKEND

Build:
1. React + Vite frontend
2. FastAPI backend
3. PDF upload
4. Text extraction
5. Chunking
6. Embeddings
7. FAISS indexing
8. BM25 retrieval
9. Basic RAG QA

---

# PHASE 2 — ADVANCED FEATURES

Build:
1. Structured extraction
2. Confidence scoring
3. Source citations
4. OCR fallback
5. Multi-key failover
6. Safety validation

---

# PHASE 3 — FINAL POLISH

Build:
1. Better UI styling
2. Loading indicators
3. Error handling
4. Session cleanup
5. Responsive optimization

---

# EXECUTION REQUIREMENTS

# Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

---

# FINAL SUCCESS CRITERIA

The implementation is successful ONLY if:

✅ React frontend works correctly  
✅ FastAPI backend works correctly  
✅ PDF upload works  
✅ OCR fallback works  
✅ Hybrid retrieval works accurately  
✅ Answers remain grounded  
✅ Hallucinations are minimized  
✅ Source evidence is displayed  
✅ Confidence scoring works  
✅ Multi-key failover works  
✅ Deployment remains lightweight  
✅ Minimal manual intervention required  

---

# FINAL DIRECTIVE

Generate a clean, modular, production-style Medical AI Platform following ALL requirements exactly.

Do NOT overengineer the architecture.

Prioritize:
- correctness
- retrieval quality
- grounded medical reasoning
- reliability
- lightweight deployment
- autonomous implementation compatibility
