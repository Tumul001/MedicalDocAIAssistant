import { useState } from 'react';
import ConfidenceBadge from './ConfidenceBadge';
import SourceCard from './SourceCard';

/**
 * ChatBubble.jsx
 * Renders a single chat message.
 * - User messages: right-aligned blue bubble
 * - Assistant messages: left-aligned with confidence badge + collapsible sources
 */
export default function ChatBubble({ message }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Avatar */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full gradient-medical flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-xs text-slate-400 font-medium">Medical AI</span>
          </div>
        )}

        {/* Bubble */}
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-medical-600 text-white rounded-tr-sm'
            : 'glass text-slate-200 rounded-tl-sm border border-slate-700/50'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Confidence badge (assistant only) */}
        {!isUser && message.confidence && (
          <div className="mt-2 ml-1">
            <ConfidenceBadge level={message.confidence.level} score={message.confidence.score} />
          </div>
        )}

        {/* Sources toggle (assistant only) */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 ml-1">
            <button
              id={`sources-toggle-${message.id}`}
              onClick={() => setSourcesOpen(!sourcesOpen)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${sourcesOpen ? 'rotate-90' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {message.sources.length} source{message.sources.length !== 1 ? 's' : ''} retrieved
            </button>
            {sourcesOpen && (
              <div className="mt-2 space-y-2">
                {message.sources.map(src => (
                  <SourceCard key={src.chunk_id} chunk={src} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
