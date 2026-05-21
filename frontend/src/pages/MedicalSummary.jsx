import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocument } from '../context/DocumentContext';
import { getMedicalSummary } from '../services/api';
import SummarySection from '../components/SummarySection';
import ErrorAlert from '../components/ErrorAlert';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Stethoscope, RefreshCw, Activity, Pill, AlertTriangle, 
  BarChart3, CheckCircle2, ClipboardList, FileText,
  Download, Share2, Zap, Brain, Sparkles, Hash
} from 'lucide-react';

const SECTIONS = [
  { key: 'diseases',        title: 'Clinical Diagnoses',   icon: <Stethoscope size={16} />,     color: 'rose'    },
  { key: 'medications',     title: 'Medications',          icon: <Pill size={16} />,            color: 'cyan'    },
  { key: 'allergies',       title: 'Allergies & Risks',    icon: <AlertTriangle size={16} />,   color: 'amber'   },
  { key: 'abnormalities',   title: 'Abnormal Findings',    icon: <BarChart3 size={16} />,       color: 'violet'  },
  { key: 'recommendations', title: 'Recommendations',      icon: <CheckCircle2 size={16} />,    color: 'emerald' },
];

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
      setError(err?.response?.data?.detail || err?.message || 'Failed to generate summary.');
    } finally {
      setLoading(false);
    }
  };

  if (!documentLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card w-full p-12">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-600 mx-auto mb-6">
            <ClipboardList size={28} />
          </div>
          <h2 className="heading-page mb-3">Clinical Summary</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Upload a medical document to generate a structured AI clinical analysis.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary w-full">
            <FileText size={16} /> Upload Document
          </button>
        </motion.div>
      </div>
    );
  }

  const totalFindings = summary 
    ? SECTIONS.reduce((sum, s) => sum + (summary[s.key]?.length || 0), 0) 
    : 0;

  return (
    <div className="space-y-6 px-6 md:px-10 pt-8 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="badge-emerald"><Sparkles size={12} /><span>AI-Powered Extraction</span></div>
          <h1 className="heading-display">Clinical Summary</h1>
          <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
            Automated AI extraction of medical entities, diagnoses, and clinical observations from patient records.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-3 flex-shrink-0">
          {summary && (
            <>
              <button className="btn-icon text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/30" title="Download PDF Report">
                <Download size={15} />
              </button>
              <button className="btn-icon text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/30" title="Share findings">
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
            className="card py-24 flex flex-col items-center justify-center"
          >
            <div className="relative w-20 h-20 mb-8">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border border-dashed border-cyan-500/30 rounded-full" />
              <motion.div animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className="absolute inset-2 border border-dotted border-violet-500/20 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="text-cyan-400 animate-pulse" size={32} />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Extracting Clinical Data</h3>
            <p className="text-sm text-gray-500 max-w-sm text-center leading-relaxed">
              Using NLP to identify conditions, medications, and actionable recommendations.
            </p>
          </motion.div>
        ) : summary ? (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            
            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="badge-cyan">
                <Hash size={11} />
                <span>{totalFindings} entities extracted</span>
              </div>
              <div className="badge-emerald">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>High Confidence</span>
              </div>
              <div className="badge-violet ml-auto hidden sm:flex">
                <Activity size={11} />
                <span>Structured Output</span>
              </div>
            </div>

            {/* Layout: Grid for sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <SummarySection title={SECTIONS[0].title} items={summary[SECTIONS[0].key]} icon={SECTIONS[0].icon} color={SECTIONS[0].color} />
                <SummarySection title={SECTIONS[2].title} items={summary[SECTIONS[2].key]} icon={SECTIONS[2].icon} color={SECTIONS[2].color} />
                <SummarySection title={SECTIONS[4].title} items={summary[SECTIONS[4].key]} icon={SECTIONS[4].icon} color={SECTIONS[4].color} />
              </div>
              <div className="space-y-4">
                <SummarySection title={SECTIONS[1].title} items={summary[SECTIONS[1].key]} icon={SECTIONS[1].icon} color={SECTIONS[1].color} />
                <SummarySection title={SECTIONS[3].title} items={summary[SECTIONS[3].key]} icon={SECTIONS[3].icon} color={SECTIONS[3].color} />
              </div>
            </div>

          </motion.div>
        ) : (
          <motion.div 
            key="initial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card py-20 flex flex-col items-center justify-center text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-white/[0.06] flex items-center justify-center text-cyan-400 mb-6 glow-sm">
              <Activity size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">AI Pipeline Ready</h3>
            <p className="text-sm text-gray-500 max-w-md leading-relaxed mb-8">
              The document has been successfully processed. Click below to initiate the LLM extraction pipeline and generate a structured clinical summary.
            </p>
            <button onClick={handleGenerate} className="btn-primary shadow-lg shadow-cyan-500/20">
              <Zap size={16} /> Start Extraction Pipeline
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
