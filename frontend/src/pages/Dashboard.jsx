import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocument } from '../context/DocumentContext';
import { uploadPDF } from '../services/api';
import UploadCard from '../components/UploadCard';
import ErrorAlert from '../components/ErrorAlert';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, ShieldCheck, Activity, Cpu, Database, BarChart3, 
  MessageSquare, ClipboardList, Search, ArrowRight, Sparkles,
  Zap, Lock, Globe, Layers, Brain
} from 'lucide-react';

const CAPABILITIES = [
  { 
    icon: MessageSquare, 
    title: 'AI Medical Chat', 
    desc: 'Context-aware clinical assistant powered by hybrid RAG retrieval',
    color: 'cyan',
    path: '/chat'
  },
  { 
    icon: ClipboardList, 
    title: 'Clinical Summary', 
    desc: 'Automated extraction of diagnoses, medications, and findings',
    color: 'violet',
    path: '/summary'
  },
  { 
    icon: Search, 
    title: 'Evidence Search', 
    desc: 'Semantic search with reranked source verification',
    color: 'emerald',
    path: '/evidence'
  },
  { 
    icon: BarChart3, 
    title: 'AI Analytics', 
    desc: 'Retrieval confidence metrics and pipeline observability',
    color: 'amber',
    path: '/analytics'
  },
];

const colorClasses = {
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', glow: 'group-hover:shadow-[0_0_30px_-8px_rgba(6,182,212,0.3)]' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', glow: 'group-hover:shadow-[0_0_30px_-8px_rgba(139,92,246,0.3)]' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: 'group-hover:shadow-[0_0_30px_-8px_rgba(16,185,129,0.3)]' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', glow: 'group-hover:shadow-[0_0_30px_-8px_rgba(245,158,11,0.3)]' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { documentLoaded, setDocumentLoaded, setUploadMeta, uploadMeta } = useDocument();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async (file) => {
    setIsUploading(true);
    setError(null);
    try {
      const data = await uploadPDF(file);
      setUploadMeta(data);
      setDocumentLoaded(true);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ── Hero Section ── */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 max-w-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="badge-cyan">
              <Sparkles size={12} />
              <span>AI-Powered Clinical Intelligence</span>
            </div>
          </div>

          <h1 className="heading-display">
            Medical Document<br />
            <span className="text-gradient">Intelligence.</span>
          </h1>
          
          <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
            Upload medical PDFs for AI-powered analysis, clinical summarization, and evidence-based diagnostic insights.
          </p>
        </motion.div>

        {/* Quick Stats - only after upload */}
        {documentLoaded && uploadMeta && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-3"
          >
            {[
              { label: 'Pages', value: uploadMeta.page_count, icon: FileText },
              { label: 'Chunks', value: uploadMeta.chunk_count, icon: Database },
              { label: 'Mode', value: uploadMeta.used_ocr ? 'OCR' : 'Text', icon: Cpu },
            ].map((stat, i) => (
              <div key={i} className="card px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-cyan-400">
                  <stat.icon size={14} />
                </div>
                <div>
                  <p className="label text-[10px]">{stat.label}</p>
                  <p className="text-sm font-bold text-white">{stat.value}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Upload Section — 3 cols */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-3 card overflow-visible"
        >
          <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <FileText size={18} />
              </div>
              <div>
                <h2 className="heading-section">Document Upload</h2>
                <p className="label mt-0.5">Secure medical record ingestion</p>
              </div>
            </div>
            <div className="badge-emerald hidden sm:flex">
              <Lock size={11} />
              <span>Encrypted</span>
            </div>
          </div>

          <div className="p-6">
            <UploadCard onUpload={handleUpload} isLoading={isUploading} />
          </div>
        </motion.div>

        {/* Sidebar Status — 2 cols */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 card flex flex-col"
        >
          <div className="p-6 border-b border-white/[0.06]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-gray-400">
                <Activity size={18} />
              </div>
              <div>
                <h2 className="heading-section">System Status</h2>
                <p className="label mt-0.5">Pipeline readiness</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 flex flex-col">
            {documentLoaded ? (
              <div className="flex flex-col h-full">
                <div className="space-y-5 flex-1">
                  {[
                    { label: 'Document Status', value: 'Processed', status: 'success' },
                    { label: 'Vector Index', value: `${uploadMeta?.chunk_count || 0} vectors`, status: 'success' },
                    { label: 'Extraction', value: uploadMeta?.used_ocr ? 'OCR Mode' : 'Text Mode', status: 'success' },
                    { label: 'RAG Pipeline', value: 'Ready', status: 'success' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-400">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'success' ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                        <span className="text-sm font-medium text-gray-200">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => navigate('/chat')}
                  className="btn-primary w-full mt-6"
                >
                  <MessageSquare size={16} />
                  Open AI Assistant
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-600 mb-5">
                  <Brain size={28} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Awaiting Data</h3>
                <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                  Upload a medical PDF to initialize the AI analysis pipeline.
                </p>

                <div className="w-full mt-8 pt-6 border-t border-white/[0.06] space-y-3">
                  {[
                    { label: 'LLM Engine', value: 'Llama 3.3 70B' },
                    { label: 'Embeddings', value: 'VoyageAI' },
                    { label: 'Security', value: 'HIPAA Ready' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{row.label}</span>
                      <span className="text-xs font-medium text-gray-400">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Capabilities Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="heading-section">Platform Capabilities</h2>
          <span className="label">{CAPABILITIES.length} modules</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CAPABILITIES.map((cap, i) => {
            const cc = colorClasses[cap.color];
            const Icon = cap.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <button 
                  onClick={() => navigate(cap.path)}
                  className={`card-interactive w-full text-left p-5 group ${cc.glow}`}
                >
                  <div className={`w-10 h-10 rounded-xl ${cc.bg} border ${cc.border} flex items-center justify-center ${cc.text} mb-4 transition-transform duration-200 group-hover:scale-110`}>
                    <Icon size={18} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{cap.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{cap.desc}</p>
                  <div className="flex items-center gap-1.5 mt-3 text-[11px] font-medium text-gray-600 group-hover:text-cyan-400 transition-colors">
                    Explore <ArrowRight size={12} />
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── System Bar ── */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap items-center gap-6 pt-4 border-t border-white/[0.04]"
      >
        {[
          { icon: Zap, label: 'Low Latency Inference' },
          { icon: ShieldCheck, label: 'Privacy Compliant' },
          { icon: Globe, label: 'Hybrid RAG Engine' },
          { icon: Layers, label: 'Multi-model Architecture' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-gray-600">
            <item.icon size={13} />
            <span className="text-[11px] font-medium">{item.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 20 }} 
            className="fixed bottom-6 right-6 z-[100] max-w-md"
          >
            <ErrorAlert message={error} onDismiss={() => setError(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
