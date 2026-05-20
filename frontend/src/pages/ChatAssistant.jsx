import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocument } from '../context/DocumentContext';
import { sendChatMessage, getSuggestedQuestions } from '../services/api';
import { useVoiceChat } from '../hooks/useVoiceChat';
import ChatBubble from '../components/ChatBubble';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Trash2, Stethoscope, Activity, ShieldCheck,
  ChevronRight, MessageSquare, Brain,
  FileText, HelpCircle, Mic, MicOff, Square,
  Volume2, Loader2
} from 'lucide-react';

// ── Language display names ───────────────────────────────────────────────────
const LANG_NAMES = {
  hi: 'Hindi', ta: 'Tamil', te: 'Telugu', kn: 'Kannada',
  ml: 'Malayalam', bn: 'Bengali', mr: 'Marathi', gu: 'Gujarati',
  pa: 'Punjabi', or: 'Odia', en: 'English',
};

export default function ChatAssistant() {
  const navigate = useNavigate();
  const {
    documentLoaded, chatHistory, addChatMessage, clearChatHistory,
    suggestedQuestions, setSuggestedQuestions
  } = useDocument();

  const [input, setInput]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [fetchingQuestions, setFetchingQ] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const abortRef  = useRef(null);

  // ── Suggested questions ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (documentLoaded && suggestedQuestions.length === 0 && !fetchingQuestions) {
        setFetchingQ(true);
        try {
          const q = await getSuggestedQuestions();
          if (q?.length > 0) setSuggestedQuestions(q);
        } catch { /* silent */ }
        finally { setFetchingQ(false); }
      }
    };
    load();
  }, [documentLoaded, suggestedQuestions.length, fetchingQuestions, setSuggestedQuestions]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  // ── Text chat handler ──────────────────────────────────────────────────────
  const handleSendMessage = async (textOverride) => {
    const finalInput = (typeof textOverride === 'string' ? textOverride : input).trim();
    if (!finalInput || loading) return;

    addChatMessage({ id: Date.now(), role: 'user', content: finalInput });
    if (typeof textOverride !== 'string') setInput('');
    setLoading(true);
    setError(null);
    abortRef.current = new AbortController();

    try {
      const res = await sendChatMessage(finalInput, abortRef.current.signal);
      addChatMessage({
        id:         Date.now() + 1,
        role:       'assistant',
        content:    res.answer,
        confidence: res.confidence,
        sources:    res.sources,
      });
    } catch (err) {
      if (err?.name !== 'CanceledError' && err?.name !== 'AbortError') {
        setError(err?.response?.data?.detail || 'Failed to get response.');
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  // ── Stop everything ────────────────────────────────────────────────────────
  const handleStop = () => {
    abortRef.current?.abort();
    setLoading(false);
    if (voiceState === 'processing' || voiceState === 'listening') stopListening();
    if (voiceState === 'speaking') stopSpeaking();
  };

  // ── Voice callbacks ────────────────────────────────────────────────────────
  const handleVoiceTranscript = ({ text }) => {
    addChatMessage({ id: Date.now(), role: 'user', content: text, isVoice: true });
  };

  const handleVoiceAnswer = ({ text, confidence, sources }) => {
    addChatMessage({
      id: Date.now() + 1, role: 'assistant',
      content: text, confidence, sources, isVoice: true,
    });
  };

  const {
    voiceState, language, errorMsg: voiceError,
    startListening, stopListening, stopSpeaking, clearError: clearVoiceError,
  } = useVoiceChat({ onTranscript: handleVoiceTranscript, onAnswer: handleVoiceAnswer });

  const isVoiceActive = voiceState !== 'idle';
  const langLabel     = LANG_NAMES[language] || 'EN';

  // ── Fallback questions ─────────────────────────────────────────────────────
  const FALLBACK_Q = [
    'What are the key clinical findings?',
    'Are there any critical lab values?',
    'List all prescribed medications.',
    'What follow-up care is recommended?',
  ];
  const questions = suggestedQuestions.length > 0 ? suggestedQuestions : FALLBACK_Q;

  // ── Mic button logic ───────────────────────────────────────────────────────
  const handleMicClick = () => {
    if (voiceState === 'idle')      return startListening();
    if (voiceState === 'listening') return stopListening();
    if (voiceState === 'speaking')  return stopSpeaking();
    // processing — do nothing (show spinner)
  };

  // ── Not-loaded guard ───────────────────────────────────────────────────────
  if (!documentLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card w-full p-12">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-600 mx-auto mb-6">
            <MessageSquare size={28} />
          </div>
          <h2 className="heading-page mb-3">AI Assistant</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Upload a medical document first to start asking clinical questions.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary w-full">
            <FileText size={16} /> Upload Document
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Main layout ────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full gap-6">

      {/* ── Chat column ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Stethoscope size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Clinical Assistant</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="badge-emerald py-0.5 text-[10px]">
                  <div className="w-1 h-1 rounded-full bg-emerald-400" /> Online
                </div>
                <div className="badge-cyan py-0.5 text-[10px]">RAG Active</div>
                {isVoiceActive && (
                  <div className="badge-violet py-0.5 text-[10px]">
                    <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
                    {voiceState === 'listening'  ? 'Listening…'  :
                     voiceState === 'processing' ? 'Processing…' :
                     voiceState === 'speaking'   ? 'Speaking…'   : 'Voice Active'}
                    {language && voiceState !== 'idle' && ` · ${langLabel}`}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Stop button — appears when anything is in flight */}
            {(loading || isVoiceActive) && (
              <button
                onClick={handleStop}
                title="Stop"
                className="btn-icon text-rose-400 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20"
              >
                <Square size={13} fill="currentColor" />
              </button>
            )}
            <button
              onClick={clearChatHistory}
              className="btn-icon hover:text-rose-400 hover:border-rose-500/20"
              title="Clear chat"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Conversation card */}
        <div className="flex-1 card p-0 flex flex-col min-h-0 overflow-hidden">

          {/* Scrollable messages */}
          <div className="flex-1 overflow-y-auto px-5 py-6 scrollbar-thin flex flex-col">

            {/* Empty state */}
            {chatHistory.length === 0 && !isVoiceActive && !loading && (
              <div className="flex flex-col items-center justify-center flex-1 py-12 px-4">
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center text-center max-w-md"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-white/[0.06] flex items-center justify-center text-gray-500 mb-5">
                    <Brain size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1.5">Start a Conversation</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Type a question below or tap the <span className="text-cyan-400 font-medium">🎙 mic</span> to speak in any language.
                  </p>
                  <p className="text-xs text-gray-600 mb-8">Supports English, Hindi, Tamil, Telugu & more Indian languages.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                    {questions.slice(0, 4).map((text, i) => (
                      <button key={i} onClick={() => handleSendMessage(text)} className="card-interactive p-4 text-left">
                        <p className="text-xs font-medium text-gray-300 leading-relaxed line-clamp-2">{text}</p>
                        <div className="flex items-center gap-1.5 mt-2.5 text-[10px] font-medium text-gray-600">
                          Ask this <ChevronRight size={10} />
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}

            {/* Messages + indicators */}
            <div className="space-y-6">
              <AnimatePresence initial={false}>
                {chatHistory.map(msg => <ChatBubble key={msg.id} message={msg} />)}
              </AnimatePresence>

              {/* Text loading bubble */}
              {loading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-tl-sm px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[0, 0.15, 0.3].map((delay, i) => (
                          <motion.div key={i} animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay }}
                            className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        ))}
                      </div>
                      <span className="text-[11px] font-medium text-gray-500">Analyzing records...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Voice processing bubble */}
              {voiceState === 'processing' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="bg-violet-500/[0.08] border border-violet-500/20 rounded-2xl rounded-tl-sm px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[0, 0.2, 0.4].map((delay, i) => (
                          <motion.div key={i} animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1, delay }}
                            className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                        ))}
                      </div>
                      <span className="text-[11px] font-medium text-violet-400">Transcribing & thinking…</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* AI speaking bubble */}
              {voiceState === 'speaking' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="bg-teal-500/[0.08] border border-teal-500/20 rounded-2xl rounded-tl-sm px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Volume2 size={13} className="text-teal-400 animate-pulse" />
                      <span className="text-[11px] font-medium text-teal-400">AI is speaking — tap ■ to stop</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div ref={bottomRef} />
          </div>

          {/* ── Input area ── */}
          <div className="p-4 bg-white/[0.01] border-t border-white/[0.06] space-y-3">

            {/* Voice error */}
            <AnimatePresence>
              {voiceError && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <ErrorAlert message={voiceError} onDismiss={clearVoiceError} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Text error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <ErrorAlert message={error} onDismiss={() => setError(null)} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Listening indicator strip */}
            <AnimatePresence>
              {voiceState === 'listening' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-rose-500/[0.08] border border-rose-500/20">
                    <div className="flex gap-1">
                      {[0, 0.1, 0.2, 0.1, 0.15].map((delay, i) => (
                        <motion.div key={i}
                          animate={{ scaleY: [0.4, 1, 0.4] }}
                          transition={{ repeat: Infinity, duration: 0.7, delay }}
                          style={{ height: `${12 + (i % 3) * 5}px` }}
                          className="w-0.5 rounded-full bg-rose-400 origin-bottom"
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-rose-400">Listening… tap the mic to stop</span>
                    <span className="ml-auto text-[10px] text-rose-500/70 font-medium">🎙 Recording</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main input row */}
            <div className="relative group/input">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 rounded-2xl blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className={`relative flex items-end gap-2 bg-white/[0.03] border rounded-2xl p-3 transition-all duration-300
                ${voiceState === 'listening'
                  ? 'border-rose-500/40 shadow-[0_0_16px_rgba(244,63,94,0.12)]'
                  : 'border-white/[0.08] focus-within:border-cyan-500/30'}`}>

                {/* Mic button — inline, left of send */}
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={voiceState === 'processing' || !documentLoaded}
                  title={
                    voiceState === 'idle'       ? 'Click to speak (any language)'  :
                    voiceState === 'listening'  ? 'Click to stop recording'        :
                    voiceState === 'speaking'   ? 'Click to stop playback'         :
                                                  'Processing…'
                  }
                  className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
                    ${voiceState === 'listening'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                      : voiceState === 'speaking'
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                      : voiceState === 'processing'
                      ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20 cursor-wait'
                      : 'bg-white/[0.04] text-gray-500 border border-white/[0.06] hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/20'}`}
                >
                  {voiceState === 'listening'  ? <MicOff   size={15} /> :
                   voiceState === 'processing' ? <Loader2  size={15} className="animate-spin" /> :
                   voiceState === 'speaking'   ? <Volume2  size={15} /> :
                                                 <Mic      size={15} />}
                </button>

                {/* Text input */}
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    voiceState === 'listening'  ? 'Recording… tap mic to stop'        :
                    voiceState === 'processing' ? 'Processing your voice query…'      :
                    voiceState === 'speaking'   ? 'AI is speaking…'                   :
                                                  'Ask a clinical question…'
                  }
                  disabled={isVoiceActive}
                  rows={1}
                  className="flex-1 bg-transparent text-gray-100 placeholder-gray-600 resize-none outline-none text-sm leading-relaxed py-1.5 px-1 min-h-[32px] max-h-[120px] disabled:opacity-40"
                />

                {/* Send button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || loading || isVoiceActive}
                  className={`p-2.5 rounded-xl transition-all duration-200 flex-shrink-0
                    ${input.trim() && !loading && !isVoiceActive
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 active:scale-95'
                      : 'bg-white/[0.04] text-gray-600'}`}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-medium">
                  <Activity size={10} /> Online
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-medium">
                  <ShieldCheck size={10} /> Verified Sources
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-700 font-medium">
                <Mic size={9} className="text-gray-600" />
                <span>Tap mic to speak · Enter to send</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right sidebar ── */}
      <aside className="hidden xl:flex flex-col w-72 gap-4 h-full flex-shrink-0">
        <div className="card p-5 flex flex-col gap-4">
          <h3 className="label">Assistant Configuration</h3>
          <div className="space-y-3">
            {[
              { label: 'Model',     value: 'Llama 3.3 70B',    icon: <Brain size={13} className="text-cyan-400" /> },
              { label: 'Retrieval', value: 'Hybrid RAG',       icon: <Activity size={13} className="text-emerald-400" /> },
              { label: 'Voice STT', value: 'Sarvam Saaras v3', icon: <Mic size={13} className="text-violet-400" /> },
              { label: 'Voice TTS', value: 'Sarvam Bulbul v3 · Simran', icon: <Volume2 size={13} className="text-amber-400" /> },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-600 font-medium">{item.label}</p>
                  <p className="text-xs font-semibold text-gray-300 truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle size={13} className="text-cyan-400" />
            <h3 className="label">Suggested Questions</h3>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto scrollbar-thin pr-1">
            {fetchingQuestions ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-600">
                <LoadingSpinner size="sm" label="" />
                <p className="text-[10px] font-medium">Generating questions...</p>
              </div>
            ) : (
              questions.map((text, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(text)}
                  disabled={loading || isVoiceActive}
                  className="w-full text-left p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[11px] text-gray-400 hover:text-white hover:bg-white/[0.05] hover:border-cyan-500/20 transition-all duration-200 leading-relaxed group cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex-1 line-clamp-2">{text}</span>
                    <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </aside>

    </div>
  );
}
