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
