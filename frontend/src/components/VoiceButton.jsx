/**
 * VoiceButton.jsx
 *
 * A self-contained voice control button with four visual states:
 *   idle       — grey mic icon, click to start
 *   listening  — red pulsing ring + live interim transcript
 *   processing — spinning arc (waiting for RAG + TTS)
 *   speaking   — teal speaker icon + "AI is speaking" + stop button
 *
 * All animations are pure CSS (no Framer Motion) so they run
 * smoothly even on low-end devices.
 */

import { useRef, useEffect } from "react";
import { Mic, MicOff, Square, Volume2, Loader2 } from "lucide-react";

// Language display names for the detected-language badge
const LANG_NAMES = {
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  bn: "Bengali",
  mr: "Marathi",
  gu: "Gujarati",
  pa: "Punjabi",
  or: "Odia",
  en: "English",
};

export default function VoiceButton({
  voiceState,       // "idle" | "listening" | "processing" | "speaking"
  interimText,      // partial transcript while listening
  finalText,        // confirmed transcript after listening
  language,         // 2-letter ISO code ("hi", "ta", ...)
  errorMsg,
  onStart,          // called when user clicks mic
  onStop,           // called when user releases / clicks stop
  onStopSpeaking,   // called when user wants to interrupt TTS
  onClearError,
  disabled = false, // true when no document is loaded
}) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  // ── Waveform canvas animation while listening ─────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (voiceState !== "listening") {
      cancelAnimationFrame(animRef.current);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const ctx   = canvas.getContext("2d");
    let   frame = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars   = 18;
      const gap    = 3;
      const barW   = (canvas.width - (bars - 1) * gap) / bars;
      const midY   = canvas.height / 2;

      for (let i = 0; i < bars; i++) {
        // Each bar oscillates at a slightly different phase → wave effect
        const phase  = (frame * 0.06) + (i * 0.35);
        const height = 4 + Math.abs(Math.sin(phase)) * (midY - 6);
        const x      = i * (barW + gap);

        ctx.fillStyle = "rgba(6, 182, 212, 0.75)"; // cyan-500
        ctx.beginPath();
        ctx.roundRect(x, midY - height / 2, barW, height, 2);
        ctx.fill();
      }

      frame++;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [voiceState]);

  // ── Derived values ────────────────────────────────────────────────────────
  const isListening  = voiceState === "listening";
  const isProcessing = voiceState === "processing";
  const isSpeaking   = voiceState === "speaking";
  const isIdle       = voiceState === "idle";

  const langLabel = LANG_NAMES[language] || language?.toUpperCase() || "EN";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-3 w-full">

      {/* ── Error banner ── */}
      {errorMsg && (
        <div className="w-full flex items-start gap-3 px-4 py-3 rounded-xl
                        bg-rose-500/10 border border-rose-500/20 text-sm text-rose-300">
          <span className="flex-1 leading-relaxed">{errorMsg}</span>
          <button
            onClick={onClearError}
            className="text-rose-400 hover:text-rose-200 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Transcript area (shows while listening or just after) ── */}
      {(isListening || finalText) && (
        <div className="w-full min-h-[44px] px-4 py-3 rounded-xl
                        bg-white/[0.03] border border-white/[0.06]
                        text-sm text-gray-300 leading-relaxed">
          {isListening && interimText ? (
            <span className="text-gray-400 italic">{interimText}</span>
          ) : finalText ? (
            <span>{finalText}</span>
          ) : isListening ? (
            <span className="text-gray-600 italic">Listening…</span>
          ) : null}
        </div>
      )}

      {/* ── Waveform canvas (only while listening) ── */}
      {isListening && (
        <canvas
          ref={canvasRef}
          width={220}
          height={40}
          className="opacity-90"
          aria-hidden="true"
        />
      )}

      {/* ── Main button row ── */}
      <div className="flex items-center gap-3">

        {/* Primary mic / stop button */}
        {isSpeaking ? (
          /* Stop-speaking button */
          <button
            onClick={onStopSpeaking}
            title="Stop AI response"
            className="w-14 h-14 rounded-full flex items-center justify-center
                       bg-teal-500/20 border-2 border-teal-400/50
                       text-teal-400 hover:bg-teal-500/30
                       transition-all duration-200 active:scale-95"
          >
            <Square size={22} />
          </button>
        ) : isListening ? (
          /* Stop-recording button — pulsing red ring */
          <button
            onClick={onStop}
            title="Stop recording"
            style={{ animation: "voice-pulse 1.4s ease-in-out infinite" }}
            className="w-14 h-14 rounded-full flex items-center justify-center
                       bg-rose-500/25 border-2 border-rose-400
                       text-rose-400 hover:bg-rose-500/40
                       transition-colors duration-200 active:scale-95"
          >
            <MicOff size={22} />
          </button>
        ) : isProcessing ? (
          /* Processing spinner — not clickable */
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center
                       bg-amber-500/10 border-2 border-amber-400/40 text-amber-400"
            title="Processing…"
          >
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : (
          /* Idle mic button */
          <button
            onClick={disabled ? undefined : onStart}
            disabled={disabled}
            title={disabled ? "Upload a document first" : "Click to speak"}
            className={`w-14 h-14 rounded-full flex items-center justify-center
                        border-2 transition-all duration-200 active:scale-95
                        ${disabled
                          ? "bg-white/[0.03] border-white/[0.08] text-gray-700 cursor-not-allowed"
                          : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                        }`}
          >
            <Mic size={22} />
          </button>
        )}

        {/* Status + language label */}
        <div className="flex flex-col gap-1">
          <span className={`text-xs font-semibold tracking-wide uppercase
            ${isListening  ? "text-rose-400"  :
              isProcessing ? "text-amber-400" :
              isSpeaking   ? "text-teal-400"  :
                             "text-gray-500"  }`}>
            {isListening  ? "Listening…"   :
             isProcessing ? "Processing…"  :
             isSpeaking   ? "AI Speaking"  :
             disabled     ? "No Document"  :
                            "Tap to Speak" }
          </span>

          {/* Detected language badge — only show after first voice use */}
          {!isIdle && language && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium
                             text-gray-500 bg-white/[0.04] border border-white/[0.06]
                             rounded-md px-2 py-0.5 w-fit">
              🌐 {langLabel}
            </span>
          )}
        </div>
      </div>

      {/* ── Speaking indicator bar ── */}
      {isSpeaking && (
        <div className="flex items-center gap-1.5 py-2">
          {[0, 0.1, 0.2, 0.1, 0.15].map((delay, i) => (
            <div
              key={i}
              style={{ animationDelay: `${delay}s` }}
              className="w-1 rounded-full bg-teal-400 animate-bounce"
              /* height alternates via nth-child in CSS — we use inline style instead */
              {...{ style: { animationDelay: `${delay}s`, height: `${8 + (i % 3) * 4}px` } }}
            />
          ))}
          <span className="ml-2 text-xs text-teal-400 font-medium">Speaking</span>
        </div>
      )}

      {/* ── Pulse keyframe (injected once) ── */}
      <style>{`
        @keyframes voice-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.45); }
          50%       { box-shadow: 0 0 0 10px rgba(244, 63, 94, 0); }
        }
      `}</style>
    </div>
  );
}
