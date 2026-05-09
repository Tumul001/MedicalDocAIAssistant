import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocument } from '../context/DocumentContext';
import { sendChatMessage } from '../services/api';
import ChatBubble from '../components/ChatBubble';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

/**
 * ChatAssistant.jsx
 * - Medical Q&A chat interface
 * - Shows confidence + source evidence per answer
 * - Guards: requires document uploaded first
 */
export default function ChatAssistant() {
  const navigate = useNavigate();
  const { documentLoaded, chatHistory, addChatMessage } = useDocument();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg = { id: Date.now(), role: 'user', content: q };
    addChatMessage(userMsg);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await sendChatMessage(q);
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.answer,
        confidence: res.confidence,
        sources: res.sources,
      };
      addChatMessage(assistantMsg);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to get response. Try again.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Guard: document not loaded
  if (!documentLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass rounded-2xl p-10 border border-slate-700/40 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-300">No Document Loaded</h2>
            <p className="text-sm text-slate-500 mt-1">Please upload a medical PDF first to start asking questions.</p>
          </div>
          <button
            id="go-upload-btn"
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-xl gradient-medical text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Upload Document →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">Chat Assistant</h1>
        <p className="text-slate-400 text-sm mt-1">Ask medical questions grounded in your uploaded document</p>
      </div>

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 mb-4">
        {chatHistory.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <p className="text-slate-500 text-sm">No messages yet. Ask a medical question below.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                'What diseases are mentioned?',
                'What medications are prescribed?',
                'What lab values are abnormal?',
                'What follow-up is recommended?',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-xs px-3 py-1.5 rounded-full glass border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-medical-600/50 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {chatHistory.map(msg => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="glass rounded-2xl rounded-tl-sm border border-slate-700/50 px-4 py-3">
              <LoadingSpinner size="sm" label="Analyzing medical context…" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Input area */}
      <div className="glass rounded-2xl border border-slate-700/40 p-3 flex gap-2 items-end">
        <textarea
          ref={inputRef}
          id="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a medical question…"
          rows={1}
          className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 resize-none outline-none max-h-36 overflow-y-auto leading-relaxed"
          style={{ minHeight: '36px' }}
        />
        <button
          id="chat-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className={`
            p-2.5 rounded-xl transition-all duration-200
            ${input.trim() && !loading
              ? 'gradient-medical text-white shadow-lg hover:opacity-90 active:scale-95'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
            }
          `}
          aria-label="Send message"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-slate-600 text-center mt-2">Press Enter to send · Shift+Enter for new line</p>
    </div>
  );
}
