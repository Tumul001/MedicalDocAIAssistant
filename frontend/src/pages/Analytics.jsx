import { useState, useEffect } from 'react';
import { useDocument } from '../context/DocumentContext';
import { getHealth } from '../services/api';
import { motion } from 'framer-motion';
import { 
  BarChart3, Activity, Cpu, Database, Shield, Zap, Eye, Brain,
  FileText, Layers, Globe, CheckCircle2, AlertTriangle, Clock,
  Server, Wifi, Lock, Sparkles, TrendingUp, Hash
} from 'lucide-react';

function MetricCard({ icon: Icon, label, value, subtext, color = 'cyan', delay = 0 }) {
  const colors = {
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    white: 'bg-white/[0.04] border-white/[0.06] text-gray-400',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card p-5 hover:bg-white/[0.04] transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl ${colors[color]} border flex items-center justify-center`}>
          <Icon size={16} />
        </div>
        {subtext && (
          <span className="text-[10px] font-medium text-gray-600">{subtext}</span>
        )}
      </div>
      <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
      <p className="text-lg font-bold text-white tracking-tight">{value}</p>
    </motion.div>
  );
}

function StatusRow({ label, value, status = 'active' }) {
  const statusColors = {
    active: 'bg-emerald-400',
    warning: 'bg-amber-400',
    error: 'bg-rose-400',
    idle: 'bg-gray-600',
  };

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.03] last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${statusColors[status]}`} />
        <span className="text-sm font-medium text-gray-200">{value}</span>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { documentLoaded, uploadMeta, chatHistory, summary } = useDocument();
  const [health, setHealth] = useState(null);
  const [latency, setLatency] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      const start = performance.now();
      try {
        const data = await getHealth();
        setHealth(data);
        setLatency(Math.round(performance.now() - start));
      } catch {
        setHealth(null);
        setLatency(null);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const totalMessages = chatHistory.length;
  const aiResponses = chatHistory.filter(m => m.role === 'assistant').length;
  const avgConfidence = aiResponses > 0
    ? chatHistory.filter(m => m.role === 'assistant' && m.confidence).reduce((s, m) => s + m.confidence, 0) / aiResponses
    : 0;

  const summaryCategories = summary 
    ? ['diseases', 'medications', 'allergies', 'abnormalities', 'recommendations'].reduce((sum, k) => sum + (summary[k]?.length || 0), 0) 
    : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="badge-violet">
          <BarChart3 size={12} />
          <span>AI Observability</span>
        </div>
        <h1 className="heading-display text-3xl sm:text-4xl lg:text-5xl">
          Analytics Dashboard
        </h1>
        <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
          Real-time observability into the AI pipeline — retrieval metrics, inference performance, and system health.
        </p>
      </motion.div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard icon={Server} label="Backend" value={health ? 'Online' : 'Offline'} color={health ? 'emerald' : 'rose'} delay={0.05} />
        <MetricCard icon={Clock} label="API Latency" value={latency ? `${latency}ms` : '—'} color="cyan" delay={0.1} />
        <MetricCard icon={Database} label="Vectors" value={uploadMeta?.chunk_count || 0} color="violet" delay={0.15} />
        <MetricCard icon={FileText} label="Pages" value={uploadMeta?.page_count || 0} color="amber" delay={0.2} />
        <MetricCard icon={Activity} label="Messages" value={totalMessages} color="cyan" delay={0.25} />
        <MetricCard icon={TrendingUp} label="Avg Confidence" value={avgConfidence > 0 ? `${Math.round(avgConfidence * 100)}%` : '—'} color="emerald" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Status */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5 lg:col-span-1">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Cpu size={16} />
            </div>
            <div>
              <h3 className="heading-section text-sm">Pipeline Status</h3>
              <p className="label text-[10px] mt-0.5">Component health</p>
            </div>
          </div>
          
          <div className="space-y-0">
            <StatusRow label="LLM Engine" value="Llama 3.3 70B" status={health ? 'active' : 'idle'} />
            <StatusRow label="Groq Inference" value={health ? 'Connected' : 'Disconnected'} status={health ? 'active' : 'error'} />
            <StatusRow label="VoyageAI Embeddings" value={health ? 'Active' : 'Inactive'} status={health ? 'active' : 'idle'} />
            <StatusRow label="FAISS Index" value={documentLoaded ? 'Loaded' : 'Empty'} status={documentLoaded ? 'active' : 'idle'} />
            <StatusRow label="BM25 Index" value={documentLoaded ? 'Built' : 'Empty'} status={documentLoaded ? 'active' : 'idle'} />
            <StatusRow label="OCR Engine" value="Standby" status={uploadMeta?.used_ocr ? 'active' : 'idle'} />
          </div>
        </motion.div>

        {/* Retrieval Analytics */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-5 lg:col-span-1">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Layers size={16} />
            </div>
            <div>
              <h3 className="heading-section text-sm">Retrieval Analytics</h3>
              <p className="label text-[10px] mt-0.5">Search pipeline metrics</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {[
              { label: 'Vector Dimensions', value: '1024', desc: 'VoyageAI v3' },
              { label: 'Hybrid Mode', value: 'FAISS + BM25', desc: 'Dense + Sparse' },
              { label: 'Top-K Retrieval', value: '10 chunks', desc: 'Per query' },
              { label: 'Rerank Method', value: 'Cross-encoder', desc: 'Top-5 selection' },
              { label: 'Chunk Strategy', value: 'Page-based', desc: 'Sliding window' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300 font-medium">{item.label}</p>
                  <p className="text-[10px] text-gray-600">{item.desc}</p>
                </div>
                <span className="text-xs font-semibold text-gray-200 mono">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Safety & Trust */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-5 lg:col-span-1">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Shield size={16} />
            </div>
            <div>
              <h3 className="heading-section text-sm">Safety & Trust</h3>
              <p className="label text-[10px] mt-0.5">Guardrails & compliance</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {[
              { label: 'Hallucination Prevention', status: 'Active', icon: Eye, ok: true },
              { label: 'Source Grounding', status: 'Enforced', icon: CheckCircle2, ok: true },
              { label: 'Confidence Scoring', status: 'Enabled', icon: TrendingUp, ok: true },
              { label: 'Data Encryption', status: 'In-transit', icon: Lock, ok: true },
              { label: 'Medical Disclaimer', status: 'Active', icon: AlertTriangle, ok: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  <item.icon size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-300">{item.label}</p>
                </div>
                <span className={`text-[10px] font-semibold ${item.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Session Summary */}
      {documentLoaded && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="heading-section text-sm">Session Summary</h3>
              <p className="label text-[10px] mt-0.5">Current analysis session</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Document Pages', value: uploadMeta?.page_count || 0 },
              { label: 'Indexed Chunks', value: uploadMeta?.chunk_count || 0 },
              { label: 'Chat Messages', value: totalMessages },
              { label: 'Findings Extracted', value: summaryCategories },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                <p className="text-2xl font-bold text-white mb-1">{item.value}</p>
                <p className="text-[10px] text-gray-500 font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
