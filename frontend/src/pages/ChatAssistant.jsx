import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocument } from '../context/DocumentContext';
import { sendChatMessage, getSuggestedQuestions } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Mic, Trash2, Brain, FileText,
  Bot, User, Copy, Check, ChevronRight,
  Volume2, Sparkles, Activity
} from 'lucide-react';

function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const copy = () => { navigator.clipboard.writeText(msg.content); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 group ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isUser ? '' : ''}`}
        style={{
          background: isUser ? 'var(--accent)' : 'var(--bg-card)',
          border: isUser ? 'none' : '1px solid var(--border)',
        }}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} style={{ color: 'var(--accent)' }} />}
      </div>

      <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <span className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}>{isUser ? 'You' : 'MedAssist AI'}</span>

        <div className="relative p-4 rounded-2xl"
          style={{
            background: isUser ? 'var(--accent-soft)' : 'var(--bg-card)',
            border: `1px solid ${isUser ? 'rgba(6,182,212,0.2)' : 'var(--border)'}`,
            borderRadius: isUser ? '20px 6px 20px 20px' : '6px 20px 20px 20px',
          }}>
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap"
            style={{ color: 'var(--text-primary)' }}>{msg.content}</p>

          <button onClick={copy}
            className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'var(--bg-elevated)' }}>
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} style={{ color: 'var(--text-muted)' }} />}
          </button>
        </div>

        {!isUser && (
          <div className="flex flex-col gap-2 mt-1 w-full">
            {msg.confidence != null && (
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  <Activity size={10} className="inline mr-1" />
                  {Math.round((msg.confidence.score || 0) * 100)}% Confidence
                </span>
              </div>
            )}
            
            {msg.sources && msg.sources.length > 0 && (
              <div className="space-y-1 w-full">
                {msg.sources.slice(0, 2).map((s, idx) => (
                  <div key={idx} className="p-2 rounded-xl text-xs" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-[10px]" style={{ color: 'var(--accent)' }}>Source {idx + 1} • Pg {s.page}</span>
                      {s.rerank_score != null && <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Match: {Math.round(s.rerank_score * 100)}%</span>}
                    </div>
                    <p className="text-[11px] line-clamp-2" style={{ color: 'var(--text-secondary)' }}>"{s.text}"</p>
                  </div>
                ))}
                
                <button onClick={() => navigate('/evidence')} 
                  className="w-full mt-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  <FileText size={12} /> Open Evidence Viewer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <Bot size={14} style={{ color: 'var(--accent)' }} />
      </div>
      <div className="px-4 py-3 rounded-2xl flex items-center gap-1"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px 20px 20px 20px' }}>
        {[0, 0.15, 0.3].map((d, i) => (
          <motion.div key={i} className="w-2 h-2 rounded-full"
            style={{ background: 'var(--accent)' }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 0.9, delay: d }} />
        ))}
      </div>
    </div>
  );
}

const FALLBACK_Q = [
  'What are the key findings in my report?',
  'Are there any abnormal values I should know about?',
  'What medications are prescribed?',
  'What follow-up care do I need?',
];

export default function ChatAssistant() {
  const navigate = useNavigate();
  const { documentLoaded, chatHistory, addChatMessage, clearChatHistory, suggestedQuestions, setSuggestedQuestions } = useDocument();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (documentLoaded && suggestedQuestions.length === 0) {
      getSuggestedQuestions().then(qs => { if (qs?.length) setSuggestedQuestions(qs); }).catch(() => {});
    }
  }, [documentLoaded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const send = async (text) => {
    const t = (text || input).trim();
    if (!t || loading) return;
    setInput('');
    addChatMessage({ id: Date.now(), role: 'user', content: t });
    setLoading(true);
    try {
      const res = await sendChatMessage(t);
      addChatMessage({ id: Date.now() + 1, role: 'assistant', content: res.answer, confidence: res.confidence, sources: res.sources });
    } catch {
      addChatMessage({ id: Date.now() + 1, role: 'assistant', content: 'Sorry, I could not reach the AI. Please try again.' });
    } finally { setLoading(false); }
  };

  const questions = suggestedQuestions.length > 0 ? suggestedQuestions : FALLBACK_Q;

  if (!documentLoaded) return (
    <div className="flex items-center justify-center h-full px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="surface-elevated p-10 rounded-3xl text-center max-w-sm w-full space-y-5">
        <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Brain size={28} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Upload a Report First</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Upload a medical PDF on the home screen to start asking questions.
          </p>
        </div>
        <button onClick={() => navigate('/')} className="btn-primary w-full rounded-2xl">
          <FileText size={16} /> Go to Home
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="flex h-full" style={{ background: 'var(--bg)' }}>
      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              <Sparkles size={17} />
            </div>
            <div>
              <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>AI Health Assistant</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Ready · RAG Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/voice')} className="btn-icon" title="Switch to Voice">
              <Mic size={15} />
            </button>
            <button onClick={clearChatHistory} className="btn-icon" title="Clear chat">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 scrollbar-thin">
          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-8">
              <div className="w-14 h-14 rounded-3xl flex items-center justify-center"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <Brain size={24} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Ask anything about your report</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Type your question or tap a suggestion below</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                {questions.slice(0, 4).map((q, i) => (
                  <motion.button key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => send(q)}
                    className="p-4 rounded-2xl text-left text-sm transition-all group"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <span className="leading-relaxed">{q}</span>
                    <div className="flex items-center gap-1 mt-2 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--accent)' }}>
                      Ask <ChevronRight size={10} />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            chatHistory.map(msg => <Bubble key={msg.id} msg={msg} />)
          )}
          {loading && <TypingDots />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-end gap-3 mt-4 p-3 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask about your report…"
              rows={1}
              className="flex-1 bg-transparent outline-none text-[15px] resize-none scrollbar-none py-1"
              style={{ color: 'var(--text-primary)', caretColor: 'var(--accent)' }}
            />
            <motion.button onClick={() => send()} disabled={!input.trim() || loading}
              whileTap={input.trim() ? { scale: 0.9 } : {}}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                background: input.trim() && !loading ? 'var(--accent)' : 'var(--border)',
                color: input.trim() && !loading ? '#fff' : 'var(--text-muted)',
              }}>
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={15} />}
            </motion.button>
          </div>
          <p className="text-center text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
            Enter to send · Shift+Enter for newline
          </p>
        </div>
      </div>

      {/* Right sidebar — desktop only */}
      <aside className="hidden xl:flex flex-col w-64 flex-shrink-0 p-4 gap-4 scrollbar-thin overflow-y-auto"
        style={{ borderLeft: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div>
          <p className="label mb-3">AI Configuration</p>
          <div className="surface rounded-2xl p-4 space-y-3">
            {[
              { k: 'Model',     v: 'Llama 3.3 70B' },
              { k: 'Retrieval', v: 'FAISS + BM25' },
              { k: 'Reranker',  v: 'Cross-encoder' },
            ].map(r => (
              <div key={r.k} className="flex justify-between">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.k}</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <p className="label mb-3">Suggestions</p>
          <div className="space-y-2">
            {questions.map((q, i) => (
              <button key={i} onClick={() => send(q)} disabled={loading}
                className="w-full text-left p-3 rounded-xl text-xs leading-relaxed transition-all"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
