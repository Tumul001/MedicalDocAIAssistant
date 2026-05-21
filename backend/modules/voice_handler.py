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


def _old_clean_for_tts(text: str) -> str:
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


def _normalize_decimals(text: str, language: str) -> str:
    """Replace decimals with a spoken 'point' word based on language."""
    import re

    point_words = {
        "en": "point",
        "hi": "दशमलव",
        "bn": "দশমিক",
        "ta": "புள்ளி",
        "te": "దశాంశం",
        "kn": "ದಶಮಾಂಶ",
        "ml": "ദശാംശം",
        "mr": "दशांश",
        "gu": "દશાંશ",
        "pa": "ਦਸ਼ਮਲਵ",
        "or": "ଦଶମିକ",
    }
    point_word = point_words.get(language.lower(), "point")

    def _replace(match: re.Match[str]) -> str:
        return f"{match.group(1)} {point_word} {match.group(2)}"

    return re.sub(r"(?<!\d)(\d+)\.(\d+)(?=\D|$)", _replace, text)


HI_NUMBERS_0_TO_99 = {
    0: "शून्य", 1: "एक", 2: "दो", 3: "तीन", 4: "चार", 5: "पाँच",
    6: "छह", 7: "सात", 8: "आठ", 9: "नौ", 10: "दस",
    11: "ग्यारह", 12: "बारह", 13: "तेरह", 14: "चौदह", 15: "पंद्रह",
    16: "सोलह", 17: "सत्रह", 18: "अठारह", 19: "उन्नीस", 20: "बीस",
    21: "इक्कीस", 22: "बाईस", 23: "तेईस", 24: "चौबीस", 25: "पच्चीस",
    26: "छब्बीस", 27: "सत्ताईस", 28: "अट्ठाईस", 29: "उनतीस", 30: "तीस",
    31: "इकतीस", 32: "बत्तीस", 33: "तैंतीस", 34: "चौंतीस", 35: "पैंतीस",
    36: "छत्तीस", 37: "सैंतीस", 38: "अड़तीस", 39: "उनतालीस", 40: "चालीस",
    41: "इकतालीस", 42: "बयालीस", 43: "तैंतालीस", 44: "चवालीस", 45: "पैंतालीस",
    46: "छियालीस", 47: "सैंतालीस", 48: "अड़तालीस", 49: "उनचास", 50: "पचास",
    51: "इक्यावन", 52: "बावन", 53: "तिरेपन", 54: "चौवन", 55: "पचपन",
    56: "छप्पन", 57: "सत्तावन", 58: "अट्ठावन", 59: "उनसठ", 60: "साठ",
    61: "इकसठ", 62: "बासठ", 63: "तिरेसठ", 64: "चौंसठ", 65: "पैंसठ",
    66: "छियासठ", 67: "सड़सठ", 68: "अड़सठ", 69: "उनहत्तर", 70: "सत्तर",
    71: "इकहत्तर", 72: "बहत्तर", 73: "तिहत्तर", 74: "चौहत्तर", 75: "पचहत्तर",
    76: "छिहत्तर", 77: "सतहत्तर", 78: "अठहत्तर", 79: "उनासी", 80: "अस्सी",
    81: "इक्यासी", 82: "बयासी", 83: "तिरासी", 84: "चौरासी", 85: "पचासी",
    86: "छियासी", 87: "सत्तासी", 88: "अट्ठासी", 89: "नवासी", 90: "नब्बे",
    91: "इक्यानवे", 92: "बानवे", 93: "तिरानवे", 94: "चौरानवे", 95: "पचानवे",
    96: "छियानवे", 97: "सत्तानवे", 98: "अट्ठानवे", 99: "निन्यानवे",
}

HI_ORDINALS = {
    1: "पहला", 2: "दूसरा", 3: "तीसरा", 4: "चौथा", 5: "पाँचवाँ",
    6: "छठा", 7: "सातवाँ", 8: "आठवाँ", 9: "नौवाँ", 10: "दसवाँ",
}

HI_DIGITS = {
    "0": "शून्य", "1": "एक", "2": "दो", "3": "तीन", "4": "चार",
    "5": "पाँच", "6": "छह", "7": "सात", "8": "आठ", "9": "नौ",
}


def _number_to_hindi(value: int) -> str:
    if value < 100:
        return HI_NUMBERS_0_TO_99[value]

    for scale, label in (
        (10_000_000, "करोड़"),
        (100_000, "लाख"),
        (1_000, "हज़ार"),
        (100, "सौ"),
    ):
        if value >= scale:
            quotient, remainder = divmod(value, scale)
            spoken = f"{_number_to_hindi(quotient)} {label}"
            if remainder:
                spoken = f"{spoken} {_number_to_hindi(remainder)}"
            return spoken

    return str(value)


def _number_to_words(value: str, language: str) -> str:
    if language.lower() != "hi":
        return value

    if "." in value:
        integer, fraction = value.split(".", 1)
        fraction_words = " ".join(HI_DIGITS[digit] for digit in fraction)
        return f"{_number_to_hindi(int(integer))} पॉइंट {fraction_words}"

    return _number_to_hindi(int(value))


def _ordinal_to_words(value: str, language: str) -> str:
    if language.lower() != "hi":
        return value

    number = int(value)
    if number in HI_ORDINALS:
        return HI_ORDINALS[number]
    return f"{_number_to_hindi(number)}वाँ"


def _convert_numbers_for_tts(text: str, language: str) -> str:
    import re

    text = re.sub(
        r"(?m)^\s*(\d+)\.\s+",
        lambda match: f"{_ordinal_to_words(match.group(1), language)} ",
        text,
    )
    text = re.sub(
        r"(?<![\w.])(\d+(?:\.\d+)?)\s*%",
        lambda match: f"{_number_to_words(match.group(1), language)} प्रतिशत"
        if language.lower() == "hi"
        else f"{match.group(1)} percent",
        text,
    )
    text = re.sub(
        r"(?<![\w.])\d+\.\d+(?![\w.])",
        lambda match: _number_to_words(match.group(0), language),
        text,
    )
    return re.sub(
        r"(?<![\w.])\d+(?![\w.])",
        lambda match: _number_to_words(match.group(0), language),
        text,
    )


def _clean_for_tts(text: str, language: str) -> str:
    """Strip markdown and normalize numbers before sending text to Sarvam TTS."""
    import re

    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    text = re.sub(r'\*{1,3}(.*?)\*{1,3}', r'\1', text)
    text = re.sub(r'`{1,3}(.*?)`{1,3}', r'\1', text, flags=re.S)
    text = re.sub(r'^\s*#{1,6}\s*', '', text, flags=re.M)
    text = re.sub(r'^\s*[-•–*]\s+', '', text, flags=re.M)
    text = re.sub(r'[*#_`~>|\\]', '', text)
    text = _convert_numbers_for_tts(text, language)
    text = re.sub(r'\n{2,}', '. ', text)
    text = re.sub(r'\n', ' ', text)
    text = re.sub(r'\s{2,}', ' ', text)
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

        normalized_answer = _clean_for_tts(answer_text, detected_language)
        tts_input = normalized_answer[:TTS_CHAR_LIMIT]
        if len(normalized_answer) > TTS_CHAR_LIMIT:
            tts_input = tts_input[: tts_input.rfind(" ")] + "..."

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
