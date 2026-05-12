import { motion } from 'framer-motion';
import { User, Stethoscope, ShieldCheck, ChevronRight, FileText, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';

export default function ChatBubble({ message }) {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let confidenceLevel = null;
  let displayScore = null;

  if (message.confidence) {
    if (typeof message.confidence === 'object' && message.confidence !== null) {
      confidenceLevel = message.confidence.level?.toLowerCase() || 'low';
      // Normalize raw score (0.0 to ~0.55) to a 0-100% scale that looks right to users
      const rawScore = message.confidence.score || 0;
      if (confidenceLevel === 'high') {
        displayScore = Math.min(99, Math.max(85, Math.round((rawScore / 0.5) * 100)));
      } else if (confidenceLevel === 'medium') {
        displayScore = Math.min(84, Math.max(50, Math.round((rawScore / 0.3) * 100)));
      } else {
        displayScore = Math.min(49, Math.max(10, Math.round((rawScore / 0.2) * 100)));
      }
    } else {
      const numConf = Number(message.confidence);
      if (!isNaN(numConf)) {
        confidenceLevel = numConf >= 0.8 ? 'high' : numConf >= 0.5 ? 'medium' : 'low';
        displayScore = Math.round(numConf * 100);
      }
    }
  }

  const confidenceColors = {
    high: 'badge-emerald',
    medium: 'badge-amber',
    low: 'badge-rose',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} gap-2`}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 px-1 ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center 
          ${isAssistant 
            ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 text-cyan-400' 
            : 'bg-white/[0.06] border border-white/[0.08] text-gray-400'
          }`}>
          {isAssistant ? <Stethoscope size={13} /> : <User size={13} />}
        </div>
        <span className="text-[11px] font-medium text-gray-500">
          {isAssistant ? 'MedAssist AI' : 'You'}
        </span>
        {isAssistant && confidenceLevel && displayScore !== null && (
          <div className={`${confidenceColors[confidenceLevel]} py-0.5 text-[9px]`}>
            <ShieldCheck size={9} />
            {displayScore}%
          </div>
        )}
      </div>

      {/* Message Body */}
      <div className={`max-w-[85%] relative group
        ${isAssistant 
          ? 'bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-tl-sm px-5 py-4' 
          : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl rounded-tr-sm px-5 py-3.5'
        }`}>
        
        {isAssistant ? (
          <div className="prose-ai">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm leading-relaxed font-medium">{message.content}</p>
        )}

        {/* Sources */}
        {isAssistant && message.sources?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <p className="label text-[9px] mb-2.5">Referenced Sources</p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-cyan-500/20 transition-all cursor-pointer group/source text-[10px]">
                  <FileText size={10} className="text-cyan-500" />
                  <span className="font-medium text-gray-400 group-hover/source:text-white transition-colors">Page {source.page}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Copy button for assistant messages */}
        {isAssistant && (
          <button 
            onClick={handleCopy}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-gray-600 hover:text-white hover:bg-white/[0.08] opacity-0 group-hover:opacity-100 transition-all"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
        )}
      </div>
    </motion.div>
  );
}
