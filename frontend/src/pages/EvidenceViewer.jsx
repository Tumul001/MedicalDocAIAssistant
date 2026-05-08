import { useState } from 'react';
import { getSources } from '../services/api';
import SourceCard from '../components/SourceCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

/**
 * EvidenceViewer.jsx
 * - Search input for queries
 * - Displays list of SourceCard components with retrieved chunks
 * - Shows chunk count and page numbers
 */
export default function EvidenceViewer() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSources(q);
      setResults(data);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Search failed. Ensure a document is uploaded and backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const uniquePages = results
    ? [...new Set(results.map(r => r.page))].sort((a, b) => a - b)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Evidence Viewer</h1>
        <p className="text-slate-400 text-sm mt-1">Search for specific medical topics and see supporting document chunks</p>
      </div>

      {/* Search bar */}
      <div className="glass rounded-2xl border border-slate-700/40 p-4 flex gap-3 items-center">
        <svg className="w-5 h-5 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          id="evidence-search-input"
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search medical evidence… (e.g. glucose levels, medications)"
          className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
        />
        <button
          id="evidence-search-btn"
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className={`
            px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
            ${query.trim() && !loading
              ? 'gradient-medical text-white hover:opacity-90'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }
          `}
        >
          Search
        </button>
      </div>

      {/* Error */}
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Loading */}
      {loading && <LoadingSpinner label="Retrieving evidence…" />}

      {/* Results metadata */}
      {!loading && results !== null && (
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span>
            <span className="text-white font-semibold">{results.length}</span> chunks retrieved
          </span>
          {uniquePages.length > 0 && (
            <span>
              from pages: <span className="text-slate-300 font-mono">{uniquePages.join(', ')}</span>
            </span>
          )}
        </div>
      )}

      {/* Results */}
      {!loading && results && results.length > 0 && (
        <div className="space-y-3">
          {results.map(chunk => (
            <SourceCard key={chunk.chunk_id} chunk={chunk} />
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && results && results.length === 0 && (
        <div className="glass rounded-2xl p-10 border border-slate-700/40 text-center space-y-2">
          <p className="text-2xl">🔍</p>
          <p className="text-slate-400 text-sm">No relevant evidence found for this query.</p>
          <p className="text-slate-500 text-xs">Try a different search term or ensure a document is uploaded.</p>
        </div>
      )}

      {/* Initial state */}
      {!loading && results === null && (
        <div className="glass rounded-2xl p-10 border border-slate-700/40 text-center space-y-3">
          <p className="text-2xl">📚</p>
          <p className="text-slate-400 text-sm">Enter a search term above to retrieve supporting evidence from your medical document.</p>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {['blood glucose', 'prescribed medications', 'abnormal values', 'diagnosis'].map(q => (
              <button
                key={q}
                onClick={() => setQuery(q)}
                className="text-xs px-3 py-1.5 rounded-full glass border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-medical-600/50 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
