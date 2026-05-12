import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function SummarySection({ title, items, icon, color = 'cyan' }) {
  const [expanded, setExpanded] = useState(true);
  
  const colorMap = {
    cyan:    { badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',    dot: 'bg-cyan-400',    glow: 'hover:shadow-[0_0_24px_-8px_rgba(6,182,212,0.2)]' },
    emerald: { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400', glow: 'hover:shadow-[0_0_24px_-8px_rgba(16,185,129,0.2)]' },
    amber:   { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',   dot: 'bg-amber-400',   glow: 'hover:shadow-[0_0_24px_-8px_rgba(245,158,11,0.2)]' },
    rose:    { badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',     dot: 'bg-rose-400',    glow: 'hover:shadow-[0_0_24px_-8px_rgba(244,63,94,0.2)]' },
    violet:  { badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20',  dot: 'bg-violet-400',  glow: 'hover:shadow-[0_0_24px_-8px_rgba(139,92,246,0.2)]' },
  };

  const c = colorMap[color] || colorMap.cyan;
  const count = items?.length || 0;

  return (
    <div className={`card transition-all duration-300 ${c.glow}`}>
      {/* Header */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${c.badge}`}>
            {count}
          </span>
          {expanded ? <ChevronUp size={14} className="text-gray-600" /> : <ChevronDown size={14} className="text-gray-600" />}
        </div>
      </button>

      {/* Items */}
      <motion.div 
        initial={false}
        animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-4 pt-1">
          {count > 0 ? (
            <ul className="space-y-2.5">
              {items.map((item, i) => (
                <motion.li 
                  key={i} 
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-start gap-3 group/item"
                >
                  <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot} opacity-60 group-hover/item:opacity-100 transition-opacity`} />
                  <span className="text-sm text-gray-400 leading-relaxed group-hover/item:text-gray-200 transition-colors">
                    {item}
                  </span>
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-600 italic text-center py-3">No data found</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
