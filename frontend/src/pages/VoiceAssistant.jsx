import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocument } from '../context/DocumentContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { sendChatMessage } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import WaveformVisualizer from '../components/voice/WaveformVisualizer';
import {
  Mic, Square, Volume2, VolumeX, Loader2, X,
  AlertCircle, Languages, CheckCircle2, Radio,
  FileText, ArrowRight, Brain, Globe, Zap, Shield
} from 'lucide-react';

const LANGUAGES = [
  { code: 'en-US', label: 'English',   native: 'English',    flag: '🇺🇸' },
  { code: 'hi-IN', label: 'Hindi',     native: 'हिंदी',       flag: '🇮🇳' },
  { code: 'bn-IN', label: 'Bengali',   native: 'বাংলা',       flag: '🇮🇳' },
  { code: 'ta-IN', label: 'Tamil',     native: 'தமிழ்',       flag: '🇮🇳' },
  { code: 'te-IN', label: 'Telugu',    native: 'తెలుగు',     flag: '🇮🇳' },
  { code: 'mr-IN', label: 'Marathi',   native: 'मराठी',       flag: '🇮🇳' },
  { code: 'gu-IN', label: 'Gujarati',  native: 'ગુજરાતી',    flag: '🇮🇳' },
  { code: 'kn-IN', label: 'Kannada',   native: 'ಕನ್ನಡ',     flag: '🇮🇳' },
];

const VS = { IDLE: 'idle', LISTENING: 'listening', PROCESSING: 'processing', SPEAKING: 'speaking', ERROR: 'error' };

export default function VoiceAssistantPage() {
  const navigate = useNavigate();
  const { documentLoaded, addChatMessage } = useDocument();
  const [language, setLanguage] = useLocalStorage('preferred-language', 'en-US');
  const [vs, setVs] = useState(VS.IDLE);
  const [transcript, setTranscript] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [error, setError] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [showLang, setShowLang] = useState(false);

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError('Speech recognition not supported. Please use Chrome.'); setVs(VS.ERROR); return; }
    setError(''); setTranscript(''); setAiAnswer('');
    setVs(VS.LISTENING);

    const rec = new SR();
    rec.lang = language;
    rec.continuous = false;
    rec.interimResults = true;

    let finalText = '';
    rec.onresult = e => {
      finalText = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(finalText);
    };

    rec.onend = async () => {
      if (!finalText.trim()) { setVs(VS.IDLE); return; }
      setVs(VS.PROCESSING);
      addChatMessage({ id: Date.now(), role: 'user', content: finalText });
      try {
        const res = await sendChatMessage(finalText);
        const answer = res.answer || 'I understand your question.';
        setAiAnswer(answer);
        addChatMessage({ id: Date.now() + 1, role: 'assistant', content: answer, confidence: res.confidence, sources: res.sources });
        setVs(VS.SPEAKING);
        if (!isMuted && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(answer);
          u.lang = language; u.rate = 0.92;
          u.onend = () => setVs(VS.IDLE);
          u.onerror = () => setVs(VS.IDLE);
          window.speechSynthesis.speak(u);
        } else { setTimeout(() => setVs(VS.IDLE), 4000); }
      } catch { setError('Could not reach AI. Please try again.'); setVs(VS.ERROR); }
    };

    rec.onerror = e => { if (e.error !== 'aborted') { setError('Could not understand. Please try again.'); setVs(VS.ERROR); } };
    rec.start();
    window._rec = rec;
  }, [language, isMuted, addChatMessage]);

  const handleMic = () => {
    if (vs === VS.LISTENING) { window._rec?.stop(); window._rec = null; return; }
    if (vs === VS.SPEAKING) { window.speechSynthesis?.cancel(); setVs(VS.IDLE); return; }
    if (vs === VS.IDLE || vs === VS.ERROR) startListening();
  };

  const cancel = () => {
    window._rec?.abort(); window._rec = null;
    window.speechSynthesis?.cancel();
    setVs(VS.IDLE); setTranscript(''); setAiAnswer(''); setError('');
  };

  const micStyle = {
    [VS.IDLE]:       { bg: 'var(--accent)',   glow: 'rgba(6,182,212,0.4)',   label: 'Tap to speak' },
    [VS.LISTENING]:  { bg: '#f43f5e',         glow: 'rgba(244,63,94,0.4)',  label: 'Listening…' },
    [VS.PROCESSING]: { bg: '#8b5cf6',         glow: 'rgba(139,92,246,0.4)', label: 'Thinking…' },
    [VS.SPEAKING]:   { bg: '#10b981',         glow: 'rgba(16,185,129,0.4)', label: 'Speaking…' },
    [VS.ERROR]:      { bg: '#f59e0b',         glow: 'rgba(245,158,11,0.3)', label: 'Try again' },
  }[vs];

  return (
    <div className="min-h-full flex flex-col items-center px-4 py-8 gap-8 max-w-xl mx-auto"
      style={{ background: 'var(--bg)' }}>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 30%, ${micStyle.glow} 0%, transparent 60%)`,
        transition: 'background 0.6s ease',
      }} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2 relative">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Voice Assistant</h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Speak naturally — AI answers in your language
        </p>
      </motion.div>

      {/* No document warning */}
      {!documentLoaded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="w-full p-4 rounded-2xl flex items-center gap-3"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-400">No report uploaded</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Upload a report to get medical answers</p>
          </div>
          <button onClick={() => navigate('/')}
            className="flex items-center gap-1 text-xs font-semibold text-amber-400 whitespace-nowrap">
            Upload <ArrowRight size={12} />
          </button>
        </motion.div>
      )}

      {/* Language selector */}
      <div className="relative">
        <button onClick={() => setShowLang(o => !o)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <Languages size={14} style={{ color: 'var(--accent)' }} />
          {currentLang.flag} {currentLang.native}
        </button>
        <AnimatePresence>
          {showLang && (
            <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 rounded-2xl overflow-hidden shadow-2xl min-w-[200px]"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div className="fixed inset-0 z-[-1]" onClick={() => setShowLang(false)} />
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => { setLanguage(l.code); setShowLang(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                  style={{ background: l.code === language ? 'var(--accent-soft)' : 'transparent', color: l.code === language ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  <span className="text-lg">{l.flag}</span>
                  <span className="font-medium">{l.native}</span>
                  {l.code === language && <CheckCircle2 size={12} className="ml-auto" />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Waveform */}
      <WaveformVisualizer isActive={vs === VS.LISTENING || vs === VS.SPEAKING} barCount={24} height={48}
        color={vs === VS.SPEAKING ? 'emerald' : 'cyan'} />

      {/* Mic button */}
      <div className="relative flex items-center justify-center">
        {(vs === VS.LISTENING || vs === VS.SPEAKING) && [1, 2, 3].map(i => (
          <motion.div key={i} className="absolute rounded-full"
            style={{ border: `1px solid ${micStyle.glow}` }}
            animate={{ width: [112, 112 + i * 48], height: [112, 112 + i * 48], opacity: [0.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }} />
        ))}

        <motion.button onClick={handleMic}
          disabled={vs === VS.PROCESSING || (!documentLoaded && vs === VS.IDLE)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.93 }}
          className="w-28 h-28 rounded-full flex items-center justify-center z-10 relative focus:outline-none transition-all duration-300"
          style={{ background: micStyle.bg, boxShadow: `0 8px 40px ${micStyle.glow}` }}>
          {vs === VS.PROCESSING
            ? <Loader2 size={40} className="text-white animate-spin" />
            : vs === VS.LISTENING
            ? <Square size={36} className="text-white fill-white" />
            : vs === VS.SPEAKING
            ? <Volume2 size={36} className="text-white" />
            : <Mic size={40} className="text-white" />}
        </motion.button>
      </div>

      {/* Status */}
      <AnimatePresence mode="wait">
        <motion.div key={vs} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="flex flex-col items-center gap-1">
          <p className="text-base font-semibold" style={{
            color: vs === VS.LISTENING ? '#f43f5e' : vs === VS.SPEAKING ? '#10b981' :
              vs === VS.PROCESSING ? '#8b5cf6' : vs === VS.ERROR ? '#f59e0b' : 'var(--text-muted)'
          }}>
            {vs === VS.LISTENING && <><Radio size={13} className="inline mr-1.5 animate-pulse" /></>}
            {micStyle.label}
          </p>
          {!documentLoaded && vs === VS.IDLE && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Upload a medical report first</p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Transcript */}
      <AnimatePresence>
        {transcript && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="w-full surface p-4 rounded-2xl">
            <p className="label mb-2">You said</p>
            <p className="text-base italic" style={{ color: 'var(--text-primary)' }}>"{transcript}"</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Response */}
      <AnimatePresence>
        {aiAnswer && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="w-full surface-elevated p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Volume2 size={14} className="text-emerald-400 animate-pulse" />
              <p className="label">AI Response</p>
            </div>
            <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{aiAnswer}</p>
            <button
              onClick={() => { window.speechSynthesis?.cancel(); const u = new SpeechSynthesisUtterance(aiAnswer); u.lang = language; u.rate = 0.92; window.speechSynthesis?.speak(u); }}
              className="btn-secondary w-full rounded-2xl">
              <Volume2 size={16} /> Listen Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mute + Cancel */}
      <div className="flex items-center gap-3">
        <button onClick={() => setIsMuted(m => !m)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: isMuted ? '#f43f5e' : 'var(--text-secondary)' }}>
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
        {(vs !== VS.IDLE && vs !== VS.ERROR) && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            onClick={cancel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <X size={14} /> Cancel
          </motion.button>
        )}
      </div>

      {/* Features grid */}
      <div className="w-full grid grid-cols-2 gap-3 mt-4">
        {[
          { icon: Globe, label: '10+ Languages', desc: 'Hindi, Tamil, Bengali…', color: '#06b6d4' },
          { icon: Zap,   label: 'Instant AI',    desc: 'Powered by Groq',        color: '#8b5cf6' },
          { icon: Brain, label: 'RAG Grounded',  desc: 'From your report',        color: '#10b981' },
          { icon: Shield,label: 'Private',       desc: 'Data stays local',        color: '#f59e0b' },
        ].map((f, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.07 }}
            className="surface p-4 rounded-2xl">
            <f.icon size={18} style={{ color: f.color }} className="mb-2" />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{f.label}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
