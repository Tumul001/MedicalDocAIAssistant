import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Brain, Globe, Shield, Zap } from 'lucide-react';
import VoiceAssistant from '../components/voice/VoiceAssistant';
import { useDocument } from '../context/DocumentContext';
import { useLocalStorage } from '../hooks/useLocalStorage';

const FEATURES = [
  { icon: Globe, label: 'Auto language', desc: 'Sarvam detects speech language', color: '#06b6d4' },
  { icon: Zap, label: 'RAG answers', desc: 'Grounded in the uploaded report', color: '#8b5cf6' },
  { icon: Brain, label: 'Medical context', desc: 'Uses the same clinical pipeline', color: '#10b981' },
  { icon: Shield, label: 'Verified sources', desc: 'Adds evidence to chat history', color: '#f59e0b' },
];

export default function VoiceAssistantPage() {
  const navigate = useNavigate();
  const { documentLoaded } = useDocument();
  const [language, setLanguage] = useLocalStorage('preferred-language', 'en-US');

  return (
    <div
      className="min-h-full flex flex-col items-center px-4 py-8 gap-8 max-w-xl mx-auto"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(6,182,212,0.14) 0%, transparent 60%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2 relative"
      >
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Voice Assistant
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Speak naturally. The backend transcribes, answers, and reads back.
        </p>
      </motion.div>

      {!documentLoaded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full p-4 rounded-2xl flex items-center gap-3"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
        >
          <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-400">No report uploaded</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Upload a report before asking document-grounded voice questions.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-xs font-semibold text-amber-400 whitespace-nowrap"
          >
            Upload <ArrowRight size={12} />
          </button>
        </motion.div>
      )}

      <VoiceAssistant
        selectedLanguage={language}
        onLanguageChange={setLanguage}
      />

      <div className="w-full grid grid-cols-2 gap-3 mt-2">
        {FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.06 }}
              className="surface p-4 rounded-2xl"
            >
              <Icon size={18} style={{ color: feature.color }} className="mb-2" />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {feature.label}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {feature.desc}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
