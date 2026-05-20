import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function SummarySection({ title, items, icon, color }) {
  const [expanded, setExpanded] = useState(true);
  
  if (!items || items.length === 0) return null;

  const colorStyles = {
    rose:    { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20' },
    cyan:    { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/20' },
    amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
    violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  };

  const cs = colorStyles[color] || colorStyles.cyan;

  return (
    <div className={`card overflow-hidden border ${cs.border} bg-white/[0.02]`}>
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl ${cs.bg} flex items-center justify-center ${cs.text}`}>
            {icon}
          </div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cs.bg} ${cs.text}`}>
            {items.length}
          </span>
        </div>
        <div className="text-gray-500">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-white/[0.04]">
              <ul className="space-y-3 mt-4">
                {items.map((item, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${cs.text} bg-current mt-1.5 flex-shrink-0`} />
                    <span className="text-sm text-gray-300 leading-relaxed">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
