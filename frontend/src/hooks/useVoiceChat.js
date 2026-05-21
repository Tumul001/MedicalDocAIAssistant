/**
 * useVoiceChat.js
 *
 * React hook that manages the full voice pipeline:
 *   idle → listening → processing → speaking → idle
 *
 * Architecture change (v2):
 *   Instead of streaming PCM chunks to the backend in real-time (which
 *   required a Sarvam WebSocket STT endpoint that is no longer available),
 *   we now:
 *     1. Buffer all PCM chunks locally in the browser while the mic is open
 *     2. On stopListening(), send the entire recording as a single binary
 *        message followed by {"type":"end_of_audio"}
 *     3. Backend POSTs the full WAV to Sarvam REST STT, then runs RAG + TTS
 *
 * This matches the Sarvam production REST API (POST /speech-to-text).
 */

import { useState, useRef, useCallback, useEffect } from "react";

const WS_URL      = "ws://localhost:8000/ws/voice";
const SAMPLE_RATE = 16000;

export function useVoiceChat({ onTranscript, onAnswer, playAudio = true }) {
  // ── Public state ──────────────────────────────────────────────────────────
  const [voiceState, setVoiceState]   = useState("idle");
  // "idle" | "listening" | "processing" | "speaking"
  const [interimText, setInterimText] = useState("");
  const [finalText,   setFinalText]   = useState("");
  const [errorMsg,    setErrorMsg]    = useState(null);
  const [language,    setLanguage]    = useState("en");

  // ── Internal refs ─────────────────────────────────────────────────────────
  const wsRef          = useRef(null);
  const audioCtxRef    = useRef(null);
  const workletNodeRef = useRef(null);
  const sourceNodeRef  = useRef(null);
  const streamRef      = useRef(null);
  const playbackRef    = useRef(null);
  const audioChunksRef = useRef([]);   // ← buffer PCM chunks here

  // ── Cleanup helper ────────────────────────────────────────────────────────
  const _cleanupAudio = useCallback(() => {
    workletNodeRef.current?.disconnect();
    sourceNodeRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    workletNodeRef.current = null;
    sourceNodeRef.current  = null;
    streamRef.current      = null;
    audioChunksRef.current = [];
  }, []);

  // ── Play base64 WAV audio ─────────────────────────────────────────────────
  const _playAudio = useCallback((base64Wav) => {
    if (!playAudio) {
      setVoiceState('idle');
      return;
    }

    try {
      playbackRef.current?.pause();
      const audio = new Audio(`data:audio/wav;base64,${base64Wav}`);
      playbackRef.current = audio;
      setVoiceState('speaking');
      audio.onended = () => {
        playbackRef.current = null;
        setVoiceState('idle');
      };
      audio.onerror = (e) => {
        console.error('[Voice] Audio playback error:', e);
        playbackRef.current = null;
        setVoiceState('idle');
      };
      audio.play().catch(err => {
        console.error('[Voice] play() failed:', err);
        playbackRef.current = null;
        setVoiceState('idle');
      });
    } catch (err) {
      console.error('[Voice] Audio setup failed:', err);
      setVoiceState('idle');
    }
  }, [playAudio]);

  // ── Handle messages from backend WebSocket ────────────────────────────────
  const _handleMessage = useCallback((event) => {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }

    switch (data.type) {

      case "processing":
        setVoiceState("processing");
        break;

      case "final_transcript":
        setFinalText(data.text || "");
        setInterimText("");
        setLanguage(data.language || "en");
        onTranscript?.({ text: data.text, language: data.language });
        break;

      case "answer":
        onAnswer?.({
          text:       data.text,
          confidence: data.confidence,
          sources:    data.sources,
        });
        break;

      case "audio_ready":
        _playAudio(data.audio_b64);
        break;

      case "done":
        if (!playbackRef.current) setVoiceState("idle");
        break;

      case "error":
        setErrorMsg(data.message || "Voice error");
        setVoiceState("idle");
        break;

      default:
        break;
    }
  }, [onTranscript, onAnswer, _playAudio, voiceState]);

  // ── Start listening ───────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    setErrorMsg(null);
    setInterimText("");
    setFinalText("");
    audioChunksRef.current = [];

    // 1. Microphone permission
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
    } catch (err) {
      setErrorMsg("Microphone permission denied. Please allow mic access and try again.");
      return;
    }

    // 2. AudioContext at 16 kHz
    const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
    audioCtxRef.current = audioCtx;

    // 3. Load the AudioWorklet PCM processor
    try {
      await audioCtx.audioWorklet.addModule("/pcm-processor.js");
    } catch (err) {
      setErrorMsg("AudioWorklet failed to load. Try reloading the page.");
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    // 4. Open backend WebSocket
    const ws = new WebSocket(WS_URL);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      // 5. Wire AudioWorklet → local buffer (NOT sent immediately)
      const source  = audioCtx.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(audioCtx, "pcm-processor");

      worklet.port.onmessage = (e) => {
        // Buffer the PCM chunk — we'll send everything at once on stop
        audioChunksRef.current.push(e.data);
      };

      source.connect(worklet);
      sourceNodeRef.current  = source;
      workletNodeRef.current = worklet;

      setVoiceState("listening");
    };

    ws.onmessage = _handleMessage;

    ws.onerror = () => {
      setErrorMsg("Connection to backend failed. Is the server running?");
      setVoiceState("idle");
      _cleanupAudio();
    };

    ws.onclose = () => {
      _cleanupAudio();
    };
  }, [_handleMessage, _cleanupAudio]);

  // ── Stop listening — send full audio buffer to backend ───────────────────
  const stopListening = useCallback(() => {
    // Grab chunks BEFORE _cleanupAudio resets the ref
    const chunks = [...audioChunksRef.current];

    // Stop capturing audio (this resets audioChunksRef)
    _cleanupAudio();

    // Close AudioContext to release hardware mic
    audioCtxRef.current?.close();
    audioCtxRef.current = null;

    if (chunks.length === 0) {
      wsRef.current?.close();
      setVoiceState("idle");
      return;
    }

    // Send the entire buffered PCM as one binary message
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Concatenate all Int16 ArrayBuffers into one
      const totalBytes = chunks.reduce((sum, c) => sum + c.byteLength, 0);
      const combined   = new Uint8Array(totalBytes);
      let offset       = 0;
      for (const chunk of chunks) {
        combined.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }
      wsRef.current.send(combined.buffer);

      // Signal backend that audio is complete
      wsRef.current.send(JSON.stringify({ type: "end_of_audio" }));
      // Stay in processing state until backend replies
      setVoiceState("processing");
    } else {
      setErrorMsg("Connection to backend failed. Is the server running?");
      setVoiceState("idle");
    }

    audioChunksRef.current = [];
  }, [_cleanupAudio]);

  // ── Stop speaking early ───────────────────────────────────────────────────
  const stopSpeaking = useCallback(() => {
    playbackRef.current?.pause();
    if (playbackRef.current) {
      playbackRef.current.currentTime = 0;
      playbackRef.current = null;
    }
    setVoiceState("idle");
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      _cleanupAudio();
      playbackRef.current?.pause();
      playbackRef.current = null;
      wsRef.current?.close();
      audioCtxRef.current?.close();
    };
  }, [_cleanupAudio]);

  return {
    voiceState,    // "idle" | "listening" | "processing" | "speaking"
    interimText,   // always "" now (REST STT doesn't stream partials)
    finalText,     // confirmed transcript
    language,      // detected language code
    errorMsg,      // null or error string
    startListening,
    stopListening,
    stopSpeaking,
    clearError: () => setErrorMsg(null),
  };
}
