import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocument } from '../context/DocumentContext';
import { getSources } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, FileText, BookOpen, ChevronDown, ChevronUp,
  AlertCircle, Loader2, Hash, Star, Sparkles, ArrowRight
} from 'lucide-react';

function SourceCard({ chunk, index }) {
  const [expanded, setExpanded] = useState(false);
  const score = chunk.rerank_score;
  const scoreColor = score >= 0.7 ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
    : score >= 0.4 ? 'text-amber-400 border-amber-500/20 bg-amber-500/10'
    : 'text-rose-400 border-rose-500/20 bg-rose-500/10';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="card hover:border-white/[0.12] transition-all duration-300"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0 text-xs font-bold font-mono">
              {index + 1}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Page {chunk.page}</span>
                <span className="text-[10px] font-mono text-gray-600 truncate">{chunk.chunk_id}</span>
              </div>
              {chunk.source && (
                <p className="text-[10px] text-gray-600 truncate mt-0.5">{chunk.source}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {score != null && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${scoreColor}`}>
                {(score * 100).toFixed(0)}%
              </span>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/[0.06] transition-all"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        {/* Preview */}
        <p className={`text-xs text-gray-400 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {chunk.text}
        </p>

        {/* Expand toggle */}
        {chunk.text?.length > 200 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-[10px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
          >
            {expanded ? 'Show less' : 'Read full excerpt'}
            {expanded ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3 overflow-hidden relative">
      <div className="animate-shimmer" />
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-white/[0.04]" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 w-24 bg-white/[0.04] rounded-full" />
          <div className="h-2 w-16 bg-white/[0.03] rounded-full" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2 w-full bg-white/[0.03] rounded-full" />
        <div className="h-2 w-4/5 bg-white/[0.03] rounded-full" />
        <div className="h-2 w-3/5 bg-white/[0.03] rounded-full" />
      </div>
    </div>
  );
}

export default function EvidenceViewer() {
  const navigate = useNavigate();
  const { documentLoaded } = useDocument();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await getSources(query);
      setResults(data || []);
    } catch (err) {
      setError(err?.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const EXAMPLE_QUERIES = [
    'blood glucose levels', 'prescribed medications', 'patient diagnosis',
    'abnormal findings', 'treatment recommendations',
  ];

  if (!documentLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card w-full p-12">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-600 mx-auto mb-6">
            <BookOpen size={28} />
          </div>
          <h2 className="heading-page mb-3">Evidence Search</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Upload a medical PDF to enable semantic evidence search across your document.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary w-full">
            <FileText size={16} /> Upload Document
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="badge-emerald"><Sparkles size={12} /><span>Semantic Evidence Retrieval</span></div>
        <h1 className="heading-display text-3xl sm:text-4xl lg:text-5xl">Evidence Search</h1>
        <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
          Search for specific clinical evidence, findings, or keywords across the indexed medical document.
          Results are reranked by relevance score.
        </p>
      </motion.div>

      {/* Search box */}
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSearch}
        className="relative group/search"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 rounded-2xl blur-xl opacity-0 group-focus-within/search:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="relative flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-4 focus-within:border-cyan-500/30 transition-all duration-300">
          <Search size={18} className="text-gray-500 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for clinical findings, medications, diagnoses..."
            className="flex-1 bg-transparent text-gray-100 placeholder-gray-600 outline-none text-sm"
            autoFocus
          />
          <motion.button
            type="submit"
            disabled={!query.trim() || loading}
            whileTap={query.trim() ? { scale: 0.96 } : {}}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0
              ${query.trim() && !loading
                ? 'bg-cyan-500 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'bg-white/[0.04] text-gray-600 cursor-not-allowed'
              }`}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {loading ? 'Searching...' : 'Search'}
          </motion.button>
        </div>
      </motion.form>

      {/* Example queries */}
      {!searched && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2"
        >
          <span className="text-[11px] text-gray-600 font-medium py-1.5">Try:</span>
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => { setQuery(q); }}
              className="px-3 py-1.5 text-[11px] font-medium rounded-full bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:border-cyan-500/20 hover:bg-cyan-500/[0.06] transition-all"
            >
              {q}
            </button>
          ))}
        </motion.div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-4 py-3 bg-rose-500/[0.08] border border-rose-500/20 rounded-xl text-sm text-rose-300"
          >
            <AlertCircle size={14} className="text-rose-400 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 border-2 border-gray-600 border-t-cyan-400 rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Searching {query}...</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </motion.div>
        ) : searched && results.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="card py-16 flex flex-col items-center justify-center text-center"
          >
            <Search size={32} className="text-gray-700 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Results Found</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              No matching evidence found for "{query}". Try different search terms.
            </p>
          </motion.div>
        ) : results.length > 0 ? (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="badge-cyan">
                  <Hash size={11} />
                  <span>{results.length} results</span>
                </div>
                <span className="text-xs text-gray-600">for "{query}"</span>
              </div>
              <div className="flex items-center gap-2">
                <Star size={12} className="text-amber-400" />
                <span className="text-[11px] text-gray-500 font-medium">Sorted by relevance</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((chunk, i) => (
                <SourceCard key={chunk.chunk_id || i} chunk={chunk} index={i} />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
