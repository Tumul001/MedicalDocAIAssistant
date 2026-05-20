# 🎙️ Voice 2.0 — MedicalDocAIAssistant

> **Branch:** `NewVoiceIntegration_T`
> **Last updated:** May 2026
> **For:** Frontend developer making UI/UX changes via Antigravity / Stitch

---

## What is Voice 2.0?

This branch adds **real-time multilingual voice chat** to the Medical AI Assistant.

A user can now:
1. **Tap the mic** in the chat input bar
2. **Speak** a clinical question in any Indian language (Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Punjabi, Odia, Malayalam) or English
3. **Tap the mic again** to stop
4. The AI **reads the answer back** in the detected language using the Anushka (Sarvam Bulbul v2) voice

**No manual language selection needed.** Language is auto-detected from speech.

---

## How the Pipeline Works (Frontend Dev Must Know)

```
User speaks
    │
    ▼
[Browser mic]  →  raw 16-bit PCM audio at 16 kHz
    │                (captured via AudioWorklet)
    ▼
[WebSocket /ws/voice]  →  sends PCM chunks to backend
    │                       sends "end_of_audio" JSON when mic stops
    ▼
[Backend: Sarvam STT]  →  converts speech to text + detects language
    │
    ▼
[Backend: RAG Pipeline]  →  queries the uploaded medical document
    │
    ▼
[Backend: Sarvam TTS]  →  converts answer text to audio (WAV, base64)
    │
    ▼
[Browser: Audio element]  →  plays the WAV response
```

### WebSocket Messages (Backend → Frontend)

The frontend receives these JSON messages from the backend in order:

| Message Type | When | Key Fields |
|---|---|---|
| `processing` | Right after audio received | — |
| `final_transcript` | STT complete | `text`, `language` |
| `answer` | RAG complete | `text`, `confidence`, `sources` |
| `audio_ready` | TTS complete | `audio_b64` (base64 WAV) |
| `done` | Session complete | — |
| `error` | Anything fails | `message` |

---

## Voice State Machine

The entire voice UI is driven by a single `voiceState` string. **This is what you build UI around.**

```
"idle"  ──tap mic──▶  "listening"  ──tap mic──▶  "processing"  ──▶  "speaking"  ──▶  "idle"
                                                                           │
                                                                    (audio ends or
                                                                     user taps stop)
```

| State | Meaning | What to show |
|---|---|---|
| `"idle"` | Waiting for user | Grey mic icon, normal input |
| `"listening"` | Recording audio | Red pulsing mic, waveform animation |
| `"processing"` | STT + RAG + TTS running | Spinner/loading indicator |
| `"speaking"` | Audio playing back | Speaker icon, "AI is speaking" |

---

## Frontend Files You'll Be Working With

### 🎯 Main Page (Most UI work happens here)

**`frontend/src/pages/ChatAssistant.jsx`**

This is the main chat page. Key parts:

```jsx
// Voice state comes from the hook — use this to conditionally show UI
const { voiceState, language, errorMsg, startListening, stopListening, stopSpeaking } = useVoiceChat(...)

// Single mic button handler — call this on mic click
const handleMicClick = () => {
  if (voiceState === 'idle')      return startListening();
  if (voiceState === 'listening') return stopListening();
  if (voiceState === 'speaking')  return stopSpeaking();
  // 'processing' → do nothing (show spinner)
};
```

The mic button is currently inside the text input row. You can freely move it, restyle it, or add animations — **just keep `handleMicClick` wired to its `onClick`**.

### 🎣 Voice Hook (Logic — don't touch unless needed)

**`frontend/src/hooks/useVoiceChat.js`**

This hook manages the entire voice pipeline. It:
- Opens the WebSocket to `ws://localhost:8000/ws/voice`
- Captures mic audio via AudioWorklet
- Sends PCM chunks to backend
- Receives transcript, answer, and audio
- Plays audio via `new Audio(data:audio/wav;base64,...)`
- Calls `onTranscript` and `onAnswer` callbacks when data arrives

**What it exposes:**

```js
const {
  voiceState,      // "idle" | "listening" | "processing" | "speaking"
  language,        // detected language code: "hi", "en", "ta", etc.
  errorMsg,        // string | null — show this in an error banner
  startListening,  // () => void — call to start recording
  stopListening,   // () => void — call to stop recording & process
  stopSpeaking,    // () => void — call to interrupt audio playback
  clearError,      // () => void — dismiss the error
} = useVoiceChat({ onTranscript, onAnswer });
```

### 🎤 AudioWorklet Processor (Do not touch)

**`frontend/public/pcm-processor.js`**

A Web Audio API processor that captures mic audio as raw 16-bit PCM at 16 kHz.
This file must stay in `frontend/public/` so it loads as a separate thread.

### 🎨 (Legacy) VoiceButton Component

**`frontend/src/components/VoiceButton.jsx`**

This was the original separate voice panel component (now unused in the main chat page — the mic is inline instead). You can safely ignore or repurpose this.

---

## What the Current UI Looks Like

```
┌─────────────────────────────────────────────────────────────────┐
│  🩺 Clinical Assistant                         [■ Stop] [🗑]   │
│     ● Online  RAG Active  [● Listening… · Hindi]               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [chat messages appear here]                                    │
│                                                                 │
│  ● ● ●  Transcribing & thinking…   ← voice processing bubble   │
│  🔊  AI is speaking — tap ■ to stop ← speaking bubble          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─── Listening strip (only while recording) ────────────────┐ │
│  │ ▌▌▌▌▌  Listening… tap the mic to stop        🎙 Recording │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🎙  [  Ask a clinical question…              ] [➤ Send] │  │
│  └──────────────────────────────────────────────────────────┘  │
│     ⚡ Online  ✓ Verified Sources      🎙 Tap mic to speak     │
└─────────────────────────────────────────────────────────────────┘
```

---

## UI/UX Changes You Can Make Freely

These are purely visual — no logic changes needed:

### ✅ Safe to restyle/animate
- The mic button shape, size, color, position
- The listening waveform strip (currently 5 animated bars)
- The "processing" and "speaking" chat bubbles
- The stop button in the header
- The voice state badge in the header (`● Listening… · Hindi`)
- Error banners
- The overall input bar layout

### ✅ Safe to add
- Haptic feedback on mic tap (mobile)
- Microphone permission request UI
- A tooltip/onboarding nudge ("Tap to speak in Hindi, English...")
- Speaking progress animation (audio duration bar)
- Language flag emoji next to detected language badge

### ⚠️ Change carefully (logic is tied to these)
- The mic button's `onClick` handler — must call `handleMicClick()`
- The stop button's `onClick` — must call `handleStop()`
- The `voiceState` conditional rendering logic

### ❌ Don't touch
- `useVoiceChat.js` internals
- `pcm-processor.js`
- `voice_handler.py` on the backend

---

## Running Locally

### Backend
```powershell
cd backend
.\venv\Scripts\activate
# Windows — must set UTF-8 or Hindi text crashes the console
$env:PYTHONIOENCODING="utf-8"
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Environment Variables (Backend)

File: `backend/.env`

```env
SARVAM_API_KEY=sk_...        # Speech-to-Text + Text-to-Speech
GROQ_API_KEY=gsk_...         # LLM (Llama 3.3 70B)
VOYAGE_AI_API_KEY=pa-...     # Embeddings for RAG
```

> ⚠️ Never commit `.env` to git. It's in `.gitignore`.

---

## Voice API Details (Sarvam AI)

| Feature | Details |
|---|---|
| STT Model | `saaras:v3` |
| STT Endpoint | `POST https://api.sarvam.ai/speech-to-text` |
| Audio format | WAV (16 kHz, mono, 16-bit PCM) |
| Language detection | Automatic (`language_code: "unknown"`) |
| TTS Model | `bulbul:v2` |
| TTS Endpoint | `POST https://api.sarvam.ai/text-to-speech` |
| TTS Voice | `anushka` (female, Indian English + Indian languages) |
| TTS Output | WAV audio as base64 in `audios[0]` |

**Supported languages for voice:**
`hi` Hindi · `ta` Tamil · `te` Telugu · `kn` Kannada · `ml` Malayalam
`bn` Bengali · `mr` Marathi · `gu` Gujarati · `pa` Punjabi · `or` Odia · `en` English

---

## Key Files Map

```
MedicalDocAIAssistant/
├── backend/
│   ├── main.py                        ← WebSocket route /ws/voice registered here
│   ├── modules/
│   │   └── voice_handler.py           ← ALL voice logic (STT, RAG, TTS)
│   └── .env                           ← API keys (not in git)
│
└── frontend/
    ├── public/
    │   └── pcm-processor.js           ← AudioWorklet (mic capture worker)
    └── src/
        ├── hooks/
        │   └── useVoiceChat.js        ← Voice state machine + WebSocket client
        ├── components/
        │   └── VoiceButton.jsx        ← Legacy component (unused, available)
        └── pages/
            └── ChatAssistant.jsx      ← Main chat UI (mic button lives here)
```

---

## What Was Changed From Previous Version

| Area | Before | After |
|---|---|---|
| STT | WebSocket streaming (beta, broken) | REST API POST (production, working) |
| TTS | None | Sarvam Bulbul v2, anushka voice |
| Audio capture | None | AudioWorklet PCM at 16 kHz |
| Voice UX | Not implemented | Inline mic in input bar |
| Language support | English only | 11 Indian languages + English, auto-detected |
| Markdown in TTS | Would read `**asterisks**` aloud | Stripped before TTS |
| Audio playback | AudioContext (buggy) | `new Audio()` element (reliable) |

---

*For backend questions, check `voice_handler.py` — it's well-commented.*
*For voice API docs, see [docs.sarvam.ai](https://docs.sarvam.ai)*
