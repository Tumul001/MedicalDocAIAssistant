"""
medical_summary.py
Generates structured medical summary and suggested questions using LLM extraction.
"""

import json
import re
from modules.api_manager import groq_manager
from modules.prompts import SUMMARY_EXTRACTION_PROMPT, QUESTIONS_GENERATION_PROMPT
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
            model="llama-3.3-70b-versatile",
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


def get_suggested_questions() -> list:
    """Generate dynamic clinical questions based on the stored document."""
    if not _document_text.strip():
        return []

    truncated = _document_text[:6000]
    prompt = QUESTIONS_GENERATION_PROMPT.format(document_text=truncated)

    def _call(api_key: str) -> str:
        client = groq_sdk.Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=512
        )
        return response.choices[0].message.content

    raw = groq_manager.call_with_retry(_call)

    try:
        # Strip markdown fences if present
        clean = re.sub(r"```json|```", "", raw).strip()
        return json.loads(clean)
    except Exception as e:
        print(f"[Questions] JSON parse failed: {e}. Returning default list.")
        return [
            "Summarize the primary diagnostic findings.",
            "List any identified medication conflicts.",
            "What are the recommended next steps?",
            "Identify any abnormal lab results.",
            "What is the patient's allergy profile?"
        ]
