import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Check, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { formatConfidence, confidenceColor } from '../../utils/formatters';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/[0.06] transition-all opacity-0 group-hover/bubble:opacity-100" title="Copy">
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const [showSources, setShowSources] = useState(false);
  const hasSources = message.sources?.length > 0;
  const hasConfidence = message.confidence != null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={`flex gap-3 group/bubble ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5
        ${isUser
          ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
          : 'bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-white/[0.08]'
        }`}>
        {isUser
          ? <User size={14} className="text-white" />
          : <Bot size={14} className="text-violet-400" />
        }
      </div>

      {/* Bubble */}
      <div className={`flex flex-col gap-1.5 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>

        {/* Role label */}
        <span className="text-[10px] text-gray-600 font-medium px-1">
          {isUser ? 'You' : 'MedAssist AI'}
        </span>

        {/* Content */}
        <div className={`relative rounded-2xl px-4 py-3 group/content
          ${isUser
            ? 'bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border border-cyan-500/20 rounded-tr-sm'
            : 'bg-white/[0.03] border border-white/[0.06] rounded-tl-sm'
          }`}>

          {isUser ? (
            <p className="text-sm text-gray-100 leading-relaxed">{message.content}</p>
          ) : (
            <div className="prose-ai">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Copy button */}
          <div className={`absolute top-2 ${isUser ? 'left-2' : 'right-2'}`}>
            <CopyButton text={message.content} />
          </div>
        </div>

        {/* Footer: confidence + sources */}
        {!isUser && (hasConfidence || hasSources) && (
          <div className="flex flex-wrap items-center gap-2 px-1">
            {hasConfidence && (
              <span className={`text-[10px] font-semibold ${confidenceColor(message.confidence)}`}>
                {formatConfidence(message.confidence)} confidence
              </span>
            )}

            {hasSources && (
              <button
                onClick={() => setShowSources(!showSources)}
                className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-cyan-400 font-medium transition-colors"
              >
                <BookOpen size={10} />
                {message.sources.length} source{message.sources.length > 1 ? 's' : ''}
                {showSources ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
            )}
          </div>
        )}

        {/* Sources list */}
        {showSources && hasSources && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-lg space-y-2 pl-1"
          >
            {message.sources.map((src, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold text-cyan-400 font-mono">Pg {src.page}</span>
                  {src.rerank_score != null && (
                    <span className="text-[10px] text-gray-600">score: {src.rerank_score.toFixed(3)}</span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">{src.text}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
