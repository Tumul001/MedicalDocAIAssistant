import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Languages,
  Loader2,
  Mic,
  Radio,
  Square,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useDocument } from '../../context/DocumentContext';
import { useVoiceChat } from '../../hooks/useVoiceChat';
import WaveformVisualizer from './WaveformVisualizer';

const LANGUAGES = [
  { code: 'hi-IN', label: 'Hindi', flag: 'IN' },
  { code: 'en-US', label: 'English', flag: 'US' },
  { code: 'bn-IN', label: 'Bengali', flag: 'IN' },
  { code: 'ta-IN', label: 'Tamil', flag: 'IN' },
  { code: 'te-IN', label: 'Telugu', flag: 'IN' },
  { code: 'mr-IN', label: 'Marathi', flag: 'IN' },
  { code: 'gu-IN', label: 'Gujarati', flag: 'IN' },
  { code: 'kn-IN', label: 'Kannada', flag: 'IN' },
];

const DETECTED_LANGUAGE_NAMES = {
  hi: 'Hindi',
  en: 'English',
  bn: 'Bengali',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
  or: 'Odia',
};

const STATE = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
  ERROR: 'error',
};

const STATE_CONFIG = {
  [STATE.IDLE]: { label: 'Tap to speak', color: 'cyan', ring: 'rgba(6,182,212,0.2)' },
  [STATE.LISTENING]: { label: 'Listening...', color: 'rose', ring: 'rgba(244,63,94,0.3)' },
  [STATE.PROCESSING]: { label: 'Processing...', color: 'violet', ring: 'rgba(139,92,246,0.3)' },
  [STATE.SPEAKING]: { label: 'Speaking...', color: 'emerald', ring: 'rgba(16,185,129,0.3)' },
  [STATE.ERROR]: { label: 'Try again', color: 'rose', ring: 'rgba(244,63,94,0.2)' },
};

export default function VoiceAssistant({ selectedLanguage, onLanguageChange, compact = false }) {
  const { documentLoaded, addChatMessage } = useDocument();
  const [aiResponse, setAiResponse] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const {
    voiceState: hookVoiceState,
    finalText: transcript,
    language: detectedLanguage,
    errorMsg,
    startListening,
    stopListening,
    stopSpeaking,
    clearError,
  } = useVoiceChat({
    playAudio: !isMuted,
    onTranscript: ({ text }) => {
      addChatMessage({ id: Date.now(), role: 'user', content: text, isVoice: true });
    },
    onAnswer: ({ text, confidence, sources }) => {
      setAiResponse(text);
      addChatMessage({
        id: Date.now() + 1,
        role: 'assistant',
        content: text,
        confidence,
        sources,
        isVoice: true,
      });
    },
  });

  const voiceState = errorMsg ? STATE.ERROR : hookVoiceState;
  const cfg = STATE_CONFIG[voiceState];
  const currentLang = LANGUAGES.find((lang) => lang.code === selectedLanguage) || LANGUAGES[1];
  const isActive = voiceState !== STATE.IDLE && voiceState !== STATE.ERROR;
  const micSize = compact ? 'w-16 h-16' : 'w-24 h-24';
  const iconSize = compact ? 22 : 32;

  const handleMicPress = async () => {
    if (voiceState === STATE.LISTENING) {
      stopListening();
      return;
    }

    if (voiceState !== STATE.IDLE && voiceState !== STATE.ERROR) return;

    setAiResponse('');
    clearError();
    startListening();
  };

  const handleCancel = () => {
    if (voiceState === STATE.LISTENING) stopListening();
    stopSpeaking();
    setAiResponse('');
    clearError();
  };

  return (
    <div className={`flex flex-col items-center gap-6 ${compact ? 'py-2' : 'py-6'}`}>
      <div className="relative w-full max-w-xs">
        <button
          onClick={() => setShowLangMenu(!showLangMenu)}
          className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.07] hover:border-white/[0.12] transition-all"
        >
          <div className="flex items-center gap-2">
            <Languages size={14} className="text-cyan-400" />
            <span className="font-medium">{currentLang.flag} {currentLang.label}</span>
          </div>
          <span className="text-[10px] text-gray-600 font-medium uppercase tracking-wider">UI hint</span>
        </button>

        <AnimatePresence>
          {showLangMenu && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 left-0 right-0 z-50 bg-gray-900 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange?.(lang.code);
                    setShowLangMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                    lang.code === selectedLanguage
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{lang.flag} {lang.label}</span>
                  {lang.code === selectedLanguage && <CheckCircle2 size={12} className="text-cyan-400 ml-1" />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!compact && (
        <div className="w-full max-w-sm">
          <WaveformVisualizer
            isActive={voiceState === STATE.LISTENING || voiceState === STATE.SPEAKING}
            barCount={28}
            color={voiceState === STATE.SPEAKING ? 'emerald' : 'cyan'}
            height={52}
          />
        </div>
      )}

      <div className="relative flex items-center justify-center">
        {(voiceState === STATE.LISTENING || voiceState === STATE.SPEAKING) && (
          <>
            {[1, 2, 3].map((index) => (
              <motion.div
                key={index}
                className="absolute rounded-full border"
                style={{ borderColor: cfg.ring }}
                animate={{
                  width: [`${compact ? 64 : 96}px`, `${(compact ? 64 : 96) + index * 40}px`],
                  height: [`${compact ? 64 : 96}px`, `${(compact ? 64 : 96) + index * 40}px`],
                  opacity: [0.6, 0],
                }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  delay: index * 0.45,
                  ease: 'easeOut',
                }}
              />
            ))}
          </>
        )}

        <motion.button
          onClick={handleMicPress}
          disabled={voiceState === STATE.PROCESSING || (!documentLoaded && voiceState === STATE.IDLE)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className={`relative ${micSize} rounded-full flex items-center justify-center transition-all duration-300 z-10 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500/50 ${
            voiceState === STATE.LISTENING
              ? 'bg-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.5)]'
              : voiceState === STATE.SPEAKING
                ? 'bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.5)]'
                : voiceState === STATE.PROCESSING
                  ? 'bg-violet-600 shadow-[0_0_30px_rgba(139,92,246,0.4)]'
                  : voiceState === STATE.ERROR
                    ? 'bg-rose-600/80 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                    : 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)]'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          aria-label={cfg.label}
        >
          <AnimatePresence mode="wait">
            {voiceState === STATE.PROCESSING ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Loader2 size={iconSize} className="text-white animate-spin" />
              </motion.div>
            ) : voiceState === STATE.LISTENING ? (
              <motion.div key="stop" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}>
                <Square size={iconSize} className="text-white fill-white" />
              </motion.div>
            ) : voiceState === STATE.SPEAKING ? (
              <motion.div key="speaking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Volume2 size={iconSize} className="text-white" />
              </motion.div>
            ) : voiceState === STATE.ERROR ? (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AlertCircle size={iconSize} className="text-white" />
              </motion.div>
            ) : (
              <motion.div key="mic" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}>
                <Mic size={iconSize} className="text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="flex flex-col items-center gap-1">
        <AnimatePresence mode="wait">
          <motion.p
            key={voiceState}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`text-sm font-semibold tracking-wide ${
              voiceState === STATE.LISTENING
                ? 'text-rose-400'
                : voiceState === STATE.SPEAKING
                  ? 'text-emerald-400'
                  : voiceState === STATE.PROCESSING
                    ? 'text-violet-400'
                    : voiceState === STATE.ERROR
                      ? 'text-rose-400'
                      : 'text-gray-400'
            }`}
          >
            {voiceState === STATE.LISTENING && <Radio size={13} className="inline mr-1.5 animate-pulse" />}
            {cfg.label}
          </motion.p>
        </AnimatePresence>

        {!documentLoaded && voiceState === STATE.IDLE && (
          <p className="text-[11px] text-gray-600 text-center">Upload a medical PDF to enable voice queries</p>
        )}

        {detectedLanguage && voiceState !== STATE.IDLE && (
          <p className="text-[11px] text-gray-600 text-center">
            Detected: {DETECTED_LANGUAGE_NAMES[detectedLanguage] || detectedLanguage}
          </p>
        )}
      </div>

      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-sm"
          >
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Radio size={10} className="text-cyan-400 animate-pulse" />
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">You said</span>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed italic">"{transcript}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aiResponse && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-sm"
          >
            <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Volume2 size={10} className="text-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-500 font-medium uppercase tracking-wider">
                  {voiceState === STATE.SPEAKING ? 'AI speaking' : 'AI response'}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{aiResponse}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm bg-rose-500/[0.08] border border-rose-500/20 rounded-xl px-4 py-3 flex items-start gap-2"
          >
            <AlertCircle size={14} className="text-rose-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-rose-300 leading-relaxed">{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`btn-icon text-xs flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
            isMuted ? 'text-rose-400 border-rose-500/20 bg-rose-500/[0.06]' : 'text-gray-500 hover:text-gray-300'
          }`}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          <span className="text-[11px] font-medium">{isMuted ? 'Muted' : 'Playback On'}</span>
        </button>

        {isActive && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleCancel}
            className="btn-icon text-xs flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-500 hover:text-rose-400 transition-all"
          >
            <X size={14} />
            <span className="text-[11px] font-medium">Cancel</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
