import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocument } from '../context/DocumentContext';
import { getMedicalSummary } from '../services/api';
import SummarySection from '../components/SummarySection';
import ErrorAlert from '../components/ErrorAlert';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Stethoscope, RefreshCw, Activity, Pill, AlertTriangle, 
  BarChart3, CheckCircle2, ArrowRight, ClipboardList, FileText,
  Download, Share2, Zap, Brain, Sparkles
} from 'lucide-react';

export default function MedicalSummary() {
  const navigate = useNavigate();
  const { documentLoaded, summary, setSummary } = useDocument();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMedicalSummary();
      setSummary(data);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to generate summary.');
    } finally {
      setLoading(false);
    }
  };

  const SECTIONS = [
    { key: 'diseases',        title: 'Clinical Diagnoses',   icon: <Activity size={16} className="text-rose-400" />,     color: 'rose' },
    { key: 'medications',     title: 'Medications',          icon: <Pill size={16} className="text-cyan-400" />,          color: 'cyan' },
    { key: 'allergies',       title: 'Allergies & Risks',    icon: <AlertTriangle size={16} className="text-amber-400" />, color: 'amber' },
    { key: 'abnormalities',   title: 'Abnormal Findings',    icon: <BarChart3 size={16} className="text-violet-400" />,  color: 'violet' },
    { key: 'recommendations', title: 'Recommendations',      icon: <CheckCircle2 size={16} className="text-emerald-400" />, color: 'emerald' },
  ];

  if (!documentLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card w-full p-12">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-600 mx-auto mb-6">
            <ClipboardList size={28} />
          </div>
          <h2 className="heading-page mb-3">Clinical Summary</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Upload a medical document to generate a structured clinical analysis.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary w-full">
            <FileText size={16} />
            Upload Document
          </button>
        </motion.div>
      </div>
    );
  }

  const totalFindings = summary 
    ? SECTIONS.reduce((sum, s) => sum + (summary[s.key]?.length || 0), 0) 
    : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="badge-cyan">
            <Sparkles size={12} />
            <span>AI-Powered Analysis</span>
          </div>
          <h1 className="heading-display text-3xl sm:text-4xl lg:text-5xl">
            Clinical Summary
          </h1>
          <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
            Automated extraction of medical entities, diagnoses, and clinical observations from patient records.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-3 flex-shrink-0">
          {summary && (
            <>
              <button className="btn-icon" title="Download">
                <Download size={15} />
              </button>
              <button className="btn-icon" title="Share">
                <Share2 size={15} />
              </button>
            </>
          )}
          <button onClick={handleGenerate} disabled={loading} className="btn-primary">
            {loading ? <RefreshCw className="animate-spin" size={15} /> : <Zap size={15} />}
            {loading ? 'Analyzing...' : summary ? 'Regenerate' : 'Generate Summary'}
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <ErrorAlert message={error} onDismiss={() => setError(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="card py-20 flex flex-col items-center justify-center"
          >
            <div className="relative w-20 h-20 mb-6">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border border-dashed border-cyan-500/20 rounded-full" />
              <motion.div animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className="absolute inset-2 border border-dotted border-violet-500/15 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="text-cyan-400 animate-pulse" size={28} />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Analyzing Document</h3>
            <p className="text-sm text-gray-500">Extracting clinical entities and observations...</p>
          </motion.div>
        ) : summary ? (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Summary Stats */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="badge-white">
                <ClipboardList size={11} />
                <span>{totalFindings} findings extracted</span>
              </div>
              <div className="badge-emerald">
                <CheckCircle2 size={11} />
                <span>Analysis complete</span>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {SECTIONS.map((s, idx) => (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                >
                  <SummarySection
                    title={s.title}
                    items={summary[s.key]}
                    icon={s.icon}
                    color={s.color}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="initial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card py-16 flex flex-col items-center justify-center text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-600 mb-5 group hover:text-cyan-400 transition-colors cursor-default">
              <ClipboardList size={28} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Ready to Analyze</h3>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-6">
              Generate a structured clinical summary with automated entity extraction from the uploaded document.
            </p>
            <button onClick={handleGenerate} className="btn-primary">
              <Zap size={15} />
              Generate Summary
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
