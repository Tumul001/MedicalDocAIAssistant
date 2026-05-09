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
