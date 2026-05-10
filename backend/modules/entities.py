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
