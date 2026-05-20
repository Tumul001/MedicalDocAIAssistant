"""
voice_handler.py
Bridges browser WebSocket ↔ Sarvam STT REST ↔ RAG pipeline ↔ Sarvam TTS

Flow per voice query:
  1. Accept browser WebSocket
  2. Collect all raw 16-bit PCM chunks from browser until "end_of_audio"
  3. Wrap PCM in a WAV header
  4. POST to Sarvam saaras:v3 REST STT (production API, not the old beta WS)
  5. On transcript → run_rag(transcript)
  6. POST to Sarvam Bulbul-v2 TTS
  7. Send transcript + answer + audio back to browser
"""

import json
import base64
import os
import struct
import traceback

import httpx
from fastapi import WebSocket, WebSocketDisconnect
from dotenv import load_dotenv

from modules.rag_pipeline import run_rag

load_dotenv()

# ── Sarvam endpoints (production REST APIs) ──────────────────────────────────
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")
SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"

# ── Language → (BCP-47 code, speaker name) ───────────────────────────────────
LANG_MAP: dict[str, tuple[str, str]] = {
    "hi": ("hi-IN", "anushka"),
    "ta": ("ta-IN", "anushka"),
    "te": ("te-IN", "anushka"),
    "kn": ("kn-IN", "anushka"),
    "ml": ("ml-IN", "anushka"),
    "bn": ("bn-IN", "anushka"),
    "mr": ("mr-IN", "anushka"),
    "gu": ("gu-IN", "anushka"),
    "pa": ("pa-IN", "anushka"),
    "or": ("or-IN", "anushka"),
    "en": ("en-IN", "anushka"),   # fallback
}

# Sarvam TTS accepts ~500 chars per call
TTS_CHAR_LIMIT = 500


def _clean_for_tts(text: str) -> str:
    """Strip markdown symbols so TTS reads clean natural text."""
    import re
    text = re.sub(r'\*{1,3}(.*?)\*{1,3}', r'\1', text)   # **bold**, *italic*, ***both***
    text = re.sub(r'#{1,6}\s*', '', text)                  # ### headings
    text = re.sub(r'`{1,3}.*?`{1,3}', '', text, flags=re.S)  # `code` blocks
    text = re.sub(r'^\s*[-•–*]\s+', '', text, flags=re.M)  # bullet points
    text = re.sub(r'^\s*\d+\.\s+', '', text, flags=re.M)   # numbered lists
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)   # [links](url) → text
    text = re.sub(r'[_~>|\\]', '', text)                   # remaining symbols
    text = re.sub(r'\n{2,}', '. ', text)                   # blank lines → pause
    text = re.sub(r'\n', ' ', text)                        # single newlines → space
    text = re.sub(r'\s{2,}', ' ', text)                    # collapse whitespace
    return text.strip()


def _get_lang_pair(detected: str) -> tuple[str, str]:
    """Return (bcp47, speaker) for a 2-letter ISO language code."""
    return LANG_MAP.get(detected.lower(), ("en-IN", "anushka"))


def _pcm_to_wav(
    pcm_bytes: bytes,
    sample_rate: int = 16000,
    num_channels: int = 1,
    bits_per_sample: int = 16,
) -> bytes:
    """Wrap raw signed 16-bit PCM bytes in a minimal WAV container."""
    byte_rate   = sample_rate * num_channels * bits_per_sample // 8
    block_align = num_channels * bits_per_sample // 8
    data_size   = len(pcm_bytes)

    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        36 + data_size,   # total file size minus the first 8 bytes
        b"WAVE",
        b"fmt ",
        16,               # fmt chunk size (PCM)
        1,                # audio format (PCM = 1)
        num_channels,
        sample_rate,
        byte_rate,
        block_align,
        bits_per_sample,
        b"data",
        data_size,
    )
    return header + pcm_bytes


async def _call_stt(pcm_bytes: bytes) -> tuple[str, str]:
    """
    POST raw PCM (wrapped as WAV) to Sarvam REST STT.
    Returns (transcript, 2-letter language code).
    Raises on failure.
    """
    wav_bytes = _pcm_to_wav(pcm_bytes)
    print(f"[STT] Sending {len(wav_bytes)} bytes to Sarvam STT")

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            SARVAM_STT_URL,
            headers={"api-subscription-key": SARVAM_API_KEY},
            files={"file": ("audio.wav", wav_bytes, "audio/wav")},
            data={
                "model":            "saaras:v3",
                "language_code":    "unknown",   # auto-detect
                "with_timestamps":  "false",
                "with_disfluences": "false",
            },
        )

    if resp.status_code == 200:
        data     = resp.json()
        transcript = data.get("transcript", "")
        lang_raw   = data.get("language_code", "en-IN") or "en-IN"
        language   = lang_raw.split("-")[0].lower()
        safe_transcript = transcript[:80].encode("ascii", errors="replace").decode("ascii")
        print(f"[STT] Transcript: '{safe_transcript}' | Language: {language}")
        return transcript, language
    else:
        raise RuntimeError(f"STT API error {resp.status_code}: {resp.text[:300]}")


async def _call_tts(text: str, lang_code: str, speaker: str) -> bytes | None:
    """
    POST to Sarvam Bulbul-v2 TTS.
    Returns raw WAV bytes or None on failure.
    """
    payload = {
        "inputs":               [text],
        "target_language_code": lang_code,
        "speaker":              speaker,
        "model":                "bulbul:v2",
    }
    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type":         "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(SARVAM_TTS_URL, json=payload, headers=headers)
        if resp.status_code == 200:
            audios = resp.json().get("audios", [])
            if audios:
                return base64.b64decode(audios[0])
        else:
            print(f"[TTS] Sarvam returned {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        print(f"[TTS] Error: {e}")
    return None


async def handle_voice_websocket(websocket: WebSocket) -> None:
    """
    Main WebSocket handler. Called from main.py @app.websocket("/ws/voice").

    Browser sends:
      - binary frames : raw signed 16-bit PCM at 16 kHz mono
      - JSON text    : {"type": "end_of_audio"} when mic is released

    Browser receives (JSON text frames):
      - {"type": "processing"}
      - {"type": "final_transcript", "text": "...", "language": "hi"}
      - {"type": "answer", "text": "...", "confidence": {...}, "sources": [...]}
      - {"type": "audio_ready", "audio_b64": "...", "format": "wav"}
      - {"type": "done"}
      - {"type": "error", "message": "..."}
    """
    await websocket.accept()
    print("[Voice] Browser connected")

    try:
        # ── Validate API key is configured ─────────────────────────────────
        if not SARVAM_API_KEY:
            await websocket.send_json({
                "type":    "error",
                "message": "SARVAM_API_KEY is not set in backend/.env",
            })
            return

        # ── 1. Collect all PCM chunks until browser signals end ─────────────
        pcm_chunks: list[bytes] = []

        while True:
            message = await websocket.receive()

            if message["type"] == "websocket.disconnect":
                print("[Voice] Browser disconnected during recording")
                return

            raw_bytes = message.get("bytes")
            raw_text  = message.get("text")

            if raw_bytes:
                pcm_chunks.append(raw_bytes)

            elif raw_text:
                try:
                    data = json.loads(raw_text)
                    if data.get("type") == "end_of_audio":
                        print(f"[Voice] Received end_of_audio. Chunks: {len(pcm_chunks)}")
                        break
                except json.JSONDecodeError:
                    pass

        if not pcm_chunks:
            await websocket.send_json({
                "type":    "error",
                "message": "No audio received. Please try again.",
            })
            return

        # ── 2. Notify browser we are processing ────────────────────────────
        await websocket.send_json({"type": "processing"})

        # ── 3. Transcribe via Sarvam REST STT ──────────────────────────────
        pcm_bytes = b"".join(pcm_chunks)
        transcript, detected_language = await _call_stt(pcm_bytes)

        if not transcript.strip():
            await websocket.send_json({
                "type":    "error",
                "message": "Could not transcribe audio. Please speak clearly and try again.",
            })
            return

        await websocket.send_json({
            "type":     "final_transcript",
            "text":     transcript,
            "language": detected_language,
        })

        # ── 4. Run RAG pipeline ─────────────────────────────────────────────
        rag_response = run_rag(transcript)
        answer_text  = rag_response.answer

        await websocket.send_json({
            "type":       "answer",
            "text":       answer_text,
            "confidence": rag_response.confidence,
            "sources":    [s.dict() for s in rag_response.sources],
        })

        # ── 5. Generate TTS audio ───────────────────────────────────────────
        lang_code, speaker = _get_lang_pair(detected_language)

        clean_answer = _clean_for_tts(answer_text)
        tts_input = clean_answer[:TTS_CHAR_LIMIT]
        if len(clean_answer) > TTS_CHAR_LIMIT:
            tts_input = tts_input[: tts_input.rfind(" ")] + "…"

        audio_bytes = await _call_tts(tts_input, lang_code, speaker)

        if audio_bytes:
            await websocket.send_json({
                "type":      "audio_ready",
                "audio_b64": base64.b64encode(audio_bytes).decode(),
                "format":    "wav",
            })
        else:
            print("[Voice] TTS failed — text-only answer sent")

        await websocket.send_json({"type": "done"})
        print(
            f"[Voice] Session complete. "
            f"Language: {detected_language}, "
            f"Transcript: '{transcript[:60]}...'"
        )

    except WebSocketDisconnect:
        print("[Voice] Browser disconnected mid-session")

    except Exception as exc:
        print(f"[Voice] Unexpected error: {exc}")
        traceback.print_exc()
        try:
            await websocket.send_json({
                "type":    "error",
                "message": "An unexpected error occurred. Please try again.",
            })
        except Exception:
            pass
