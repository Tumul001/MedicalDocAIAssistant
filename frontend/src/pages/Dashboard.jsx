import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocument } from '../context/DocumentContext';
import { getMedicalSummary } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import SimpleUpload from '../components/home/SimpleUpload';
import AdvancedPanel from '../components/home/AdvancedPanel';
import {
  MessageSquare, Stethoscope, Pill, ShieldCheck, TrendingUp,
  RotateCcw, Sparkles, CheckCircle2, Mic
} from 'lucide-react';

const INSIGHT_TYPES = [
  { key: 'diseases',        icon: Stethoscope, label: 'Diagnosis',       color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
  { key: 'medications',     icon: Pill,        label: 'Medications',     color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  { key: 'recommendations', icon: CheckCircle2,label: 'Recommendations', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { key: 'abnormalities',   icon: TrendingUp,  label: 'Risk Factors',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { documentLoaded, summary, setSummary } = useDocument();
  const [showUpload, setShowUpload] = useState(!documentLoaded);

  const handleUploadSuccess = async () => {
    setShowUpload(false);
    try { const s = await getMedicalSummary(); setSummary(s); } catch {}
  };

  return (
    <div className="min-h-full flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Ambient gradient */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 30% 20%, rgba(6,182,212,0.06) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(139,92,246,0.05) 0%, transparent 55%)'
      }} />

      <div className="relative flex-1 flex flex-col items-center justify-start px-4 pt-8 pb-12 max-w-2xl mx-auto w-full gap-8">

        {/* ── Hero ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-1"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid rgba(6,182,212,0.2)' }}>
            <Sparkles size={11} /> AI Health Companion
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            MedAssist AI
          </h1>
          <p className="text-base" style={{ color: 'var(--text-secondary)', maxWidth: 380, margin: '0 auto' }}>
            Upload your medical report to get personalized insights and ask questions.
          </p>
        </motion.div>

        {/* ── Upload Section ── */}
        <AnimatePresence>
          {showUpload && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              className="w-full surface-elevated p-6 rounded-3xl">
              <p className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>1</span>
                Upload Your Medical Report
              </p>
              <SimpleUpload onSuccess={handleUploadSuccess} />
            </motion.div>
          )}
        </AnimatePresence>

        {documentLoaded && !showUpload && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 text-sm font-medium transition-all"
            style={{ color: 'var(--accent)' }}>
            <RotateCcw size={14} /> Upload a different report
          </motion.button>
        )}

        {/* ── Insight Cards ── */}
        <AnimatePresence>
          {summary && !showUpload && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-4">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Health Insights from Your Report
              </p>
              <div className="grid grid-cols-2 gap-3">
                {INSIGHT_TYPES.map((t, i) => {
                  const Icon = t.icon;
                  const items = summary[t.key] || [];
                  if (!items.length) return null;
                  return (
                    <motion.div key={t.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="surface p-4 rounded-2xl space-y-2.5 hover:-translate-y-0.5 transition-transform cursor-default">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: t.bg, color: t.color }}>
                          <Icon size={15} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: t.color }}>{t.label}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{items.length} found</p>
                        </div>
                      </div>
                      <ul className="space-y-1.5">
                        {items.slice(0, 3).map((item, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: t.color }} />
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item}</p>
                          </li>
                        ))}
                        {items.length > 3 && (
                          <li className="text-[10px] font-medium" style={{ color: 'var(--text-muted)', paddingLeft: '0.75rem' }}>
                            +{items.length - 3} more
                          </li>
                        )}
                      </ul>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Quick Actions ── */}
        {documentLoaded && !showUpload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/voice')}
              className="flex items-center gap-3 p-4 rounded-2xl transition-all surface-hover surface"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}>
                <Mic size={16} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Voice AI</p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Speak naturally</p>
              </div>
            </button>
            <button onClick={() => navigate('/chat')}
              className="flex items-center gap-3 p-4 rounded-2xl transition-all surface-hover surface"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(6,182,212,0.1)', color: 'var(--accent)' }}>
                <MessageSquare size={16} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Text Chat</p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Type your question</p>
              </div>
            </button>
          </motion.div>
        )}

        {/* ── Advanced Panel ── */}
        {documentLoaded && !showUpload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
            <AdvancedPanel />
          </motion.div>
        )}

      </div>
    </div>
  );
}
