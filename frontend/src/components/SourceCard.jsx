import { useState } from 'react';

/**
 * SourceCard.jsx
 * Displays one retrieved source chunk with page number and rerank score.
 * Text is truncated to 300 chars by default, expandable on click.
 */
export default function SourceCard({ chunk }) {
  const [expanded, setExpanded] = useState(false);
  const MAX_LEN = 300;

  const text = chunk.text || '';
  const isLong = text.length > MAX_LEN;
  const displayText = expanded ? text : text.slice(0, MAX_LEN);

  return (
    <div className="glass rounded-xl p-4 space-y-2 card-hover border border-slate-700/40">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-medical-400 bg-medical-900/30 border border-medical-700/40 px-2 py-1 rounded-lg">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Page {chunk.page}
        </span>
        {chunk.rerank_score !== null && chunk.rerank_score !== undefined && (
          <span className="text-xs text-slate-500">
            Score: <span className="text-slate-300 font-mono">{chunk.rerank_score.toFixed(3)}</span>
          </span>
        )}
      </div>

      {/* Text */}
      <p className="text-sm text-slate-300 leading-relaxed">
        {displayText}
        {isLong && !expanded && '…'}
      </p>

      {/* Expand / collapse */}
      {isLong && (
        <button
          id={`source-expand-${chunk.chunk_id}`}
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-medical-400 hover:text-medical-300 transition-colors font-medium"
        >
          {expanded ? '↑ Show less' : '↓ Show more'}
        </button>
      )}
    </div>
  );
}
