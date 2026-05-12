import { useState } from 'react';
import { getSources } from '../services/api';
import SourceCard from '../components/SourceCard';
import ErrorAlert from '../components/ErrorAlert';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Layers, BookOpen, ShieldCheck, Command, Activity, 
  Pill, AlertTriangle, BarChart3, Terminal, Sparkles, RefreshCw,
  FileSearch, Filter
} from 'lucide-react';

const QUICK_SEARCHES = [
  { text: 'Glucose levels and trends', icon: <Activity size={13} /> },
  { text: 'Medication dosages', icon: <Pill size={13} /> },
  { text: 'Radiological findings', icon: <Sparkles size={13} /> },
  { text: 'Allergic reactions', icon: <AlertTriangle size={13} /> },
  { text: 'Vital signs', icon: <BarChart3 size={13} /> },
];

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
      setError(err?.response?.data?.detail || 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  const uniquePages = results ? [...new Set(results.map(r => r.page))].sort((a, b) => a - b) : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="badge-cyan">
          <FileSearch size={12} />
          <span>Source Verification</span>
        </div>
        <h1 className="heading-display text-3xl sm:text-4xl lg:text-5xl">
          Evidence Explorer
        </h1>
        <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
          Search for specific clinical findings with AI-powered semantic matching and source verification.
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/8 via-blue-500/8 to-violet-500/8 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="relative flex items-center gap-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-2 pl-5 focus-within:border-cyan-500/30 transition-all duration-300">
          <Search size={20} className="text-gray-600 group-focus-within:text-cyan-400 transition-colors flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search clinical topics, medications, diagnostic findings..."
            className="flex-1 bg-transparent text-base text-gray-100 placeholder-gray-600 outline-none font-medium"
          />
          <button
            onClick={handleSearch}
            disabled={!query.trim() || loading}
            className="btn-primary px-6 py-2.5 rounded-xl"
          >
            {loading ? <RefreshCw className="animate-spin" size={15} /> : 'Search'}
          </button>
        </div>
      </motion.div>

      {/* Results Area */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
            className="card py-16 flex flex-col items-center justify-center"
          >
            <div className="relative w-16 h-16 mb-5">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="text-cyan-400" size={20} />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Searching Sources</h3>
            <p className="text-sm text-gray-500">Performing hybrid retrieval & reranking...</p>
          </motion.div>
        )}

        {!loading && results !== null && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Result Stats */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="badge-cyan">
                <Layers size={11} />
                <span>{results.length} matches</span>
              </div>
              {uniquePages.length > 0 && (
                <div className="badge-violet">
                  <BookOpen size={11} />
                  <span>{uniquePages.length} pages</span>
                </div>
              )}
              <div className="badge-emerald">
                <ShieldCheck size={11} />
                <span>Verified</span>
              </div>
            </div>

            {/* Results Grid */}
            {results.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {results.map((chunk, idx) => (
                  <motion.div
                    key={chunk.chunk_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <SourceCard chunk={chunk} rank={idx + 1} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="card py-16 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-600 mb-4">
                  <Search size={22} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">No Results</h3>
                <p className="text-sm text-gray-500 max-w-sm text-center">
                  No matching sources found. Try different search terms.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {!loading && results === null && (
          <motion.div key="initial" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card py-16 flex flex-col items-center justify-center relative overflow-hidden"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-600 mb-5">
              <Terminal size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Search Document Evidence</h3>
            <p className="text-sm text-gray-500 max-w-md text-center leading-relaxed mb-8">
              Find exact source paragraphs from the medical document using semantic and keyword hybrid search.
            </p>
            
            <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
              {QUICK_SEARCHES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(q.text); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] hover:border-cyan-500/20 transition-all"
                >
                  {q.icon}
                  {q.text}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
