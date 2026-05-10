"""
ocr.py
OCR fallback using EasyOCR.
Only activated when PDF text extraction is insufficient.
Reader is loaded lazily to avoid startup hangs. (RISK-01)
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
