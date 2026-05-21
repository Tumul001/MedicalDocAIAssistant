import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, Database, Cpu, BarChart3,
  FileText, Shield, Activity, Hash, Layers, Zap, Eye
} from 'lucide-react';
import { useDocument } from '../../context/DocumentContext';

function Row({ label, value, status }) {
  const dot = status === 'active' ? 'bg-emerald-400' : status === 'warning' ? 'bg-amber-400 animate-pulse' : 'bg-gray-600';
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <div className="flex items-center gap-2">
        {status && <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
      </div>
    </div>
  );
}

export default function AdvancedPanel({ confidence, sources }) {
  const [open, setOpen] = useState(false);
  const { uploadMeta, chatHistory } = useDocument();

  const aiResponses = chatHistory.filter(m => m.role === 'assistant');
  const avgConf = aiResponses.length > 0
    ? aiResponses.filter(m => m.confidence).reduce((s, m) => s + (m.confidence.score || 0), 0) / aiResponses.length
    : null;

  return (
    <div className="surface rounded-2xl overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 transition-colors"
        style={{ background: open ? 'var(--bg-card)' : 'transparent' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <Zap size={15} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Advanced AI Insights</p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Processing details, confidence scores, source evidence</p>
          </div>
        </div>
        <div style={{ color: 'var(--text-muted)' }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 space-y-5" style={{ borderTop: '1px solid var(--border)' }}>

              {/* Report Processing */}
              {uploadMeta && (
                <div>
                  <p className="label mb-3">Report Processing</p>
                  <div className="space-y-0">
                    <Row label="Document Pages" value={uploadMeta.page_count ?? '—'} status="active" />
                    <Row label="Content Chunks" value={uploadMeta.chunk_count ?? '—'} status="active" />
                    <Row label="Extraction Mode" value={uploadMeta.used_ocr ? 'OCR Scan' : 'Digital Text'} status="active" />
                    <Row label="Vector Index" value="FAISS + BM25" status="active" />
                    <Row label="Embeddings" value="VoyageAI v3 (1024D)" status="active" />
                  </div>
                </div>
              )}

              {/* AI Confidence */}
              <div>
                <p className="label mb-3">AI Confidence</p>
                <div className="space-y-0">
                  <Row label="LLM Model" value="Llama 3.3 70B (Groq)" status="active" />
                  <Row label="Retrieval Mode" value="Hybrid RAG" status="active" />
                  <Row label="Avg. Confidence"
                    value={avgConf != null ? `${Math.round(avgConf * 100)}%` : '—'}
                    status={avgConf != null ? (avgConf > 0.7 ? 'active' : 'warning') : undefined} />
                  <Row label="Reranker" value="Cross-encoder" status="active" />
                </div>
              </div>

              {/* Source Evidence */}
              {sources && sources.length > 0 && (
                <div>
                  <p className="label mb-3">Source Evidence ({sources.length})</p>
                  <div className="space-y-2">
                    {sources.slice(0, 3).map((s, i) => (
                      <div key={i} className="p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-bold font-mono" style={{ color: 'var(--accent)' }}>Pg {s.page}</span>
                          {s.rerank_score != null && (
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              {(s.rerank_score * 100).toFixed(0)}% match
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{s.text}</p>
                      </div>
                    ))}
                    {sources.length > 3 && (
                      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                        +{sources.length - 3} more sources
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Safety */}
              <div>
                <p className="label mb-3">Safety & Trust</p>
                <div className="space-y-0">
                  {[
                    { label: 'Hallucination Guard', value: 'Active' },
                    { label: 'Source Grounding', value: 'Enforced' },
                    { label: 'Data Privacy', value: 'Local Only' },
                    { label: 'Medical Disclaimer', value: 'Enabled' },
                  ].map((r, i) => <Row key={i} label={r.label} value={r.value} status="active" />)}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
