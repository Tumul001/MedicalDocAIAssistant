import { motion } from 'framer-motion';
import {
  Activity, Pill, AlertTriangle, BarChart3, CheckCircle2,
  Stethoscope, TrendingUp, ShieldAlert, ArrowRight, Sparkles
} from 'lucide-react';

const INSIGHT_TYPES = [
  {
    key: 'diseases',
    title: 'Clinical Diagnoses',
    icon: Stethoscope,
    color: 'rose',
    gradient: 'from-rose-500/10 to-rose-500/5',
    border: 'border-rose-500/20',
    iconBg: 'bg-rose-500/10',
    iconText: 'text-rose-400',
    dot: 'bg-rose-400',
    description: 'Identified conditions',
  },
  {
    key: 'medications',
    title: 'Medications',
    icon: Pill,
    color: 'cyan',
    gradient: 'from-cyan-500/10 to-cyan-500/5',
    border: 'border-cyan-500/20',
    iconBg: 'bg-cyan-500/10',
    iconText: 'text-cyan-400',
    dot: 'bg-cyan-400',
    description: 'Prescribed drugs',
  },
  {
    key: 'allergies',
    title: 'Allergies & Risks',
    icon: AlertTriangle,
    color: 'amber',
    gradient: 'from-amber-500/10 to-amber-500/5',
    border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/10',
    iconText: 'text-amber-400',
    dot: 'bg-amber-400',
    description: 'Known risk factors',
  },
  {
    key: 'abnormalities',
    title: 'Abnormal Findings',
    icon: BarChart3,
    color: 'violet',
    gradient: 'from-violet-500/10 to-violet-500/5',
    border: 'border-violet-500/20',
    iconBg: 'bg-violet-500/10',
    iconText: 'text-violet-400',
    dot: 'bg-violet-400',
    description: 'Lab & clinical flags',
  },
  {
    key: 'recommendations',
    title: 'Recommendations',
    icon: CheckCircle2,
    color: 'emerald',
    gradient: 'from-emerald-500/10 to-emerald-500/5',
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/10',
    iconText: 'text-emerald-400',
    dot: 'bg-emerald-400',
    description: 'Follow-up actions',
  },
];

function InsightCard({ config, items = [], index }) {
  const Icon = config.icon;
  const hasItems = items.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className={`relative overflow-hidden rounded-2xl border ${config.border} bg-gradient-to-br ${config.gradient} backdrop-blur-sm
        hover:border-opacity-50 hover:-translate-y-0.5 transition-all duration-300 group cursor-default`}
    >
      {/* Shimmer overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
        bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${config.iconBg} border ${config.border} flex items-center justify-center ${config.iconText}
              group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
              <Icon size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white leading-tight">{config.title}</h3>
              <p className="text-[10px] text-gray-600 font-medium mt-0.5">{config.description}</p>
            </div>
          </div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${config.iconBg} ${config.iconText} border ${config.border}`}>
            {items.length}
          </span>
        </div>

        {/* Items */}
        {hasItems ? (
          <ul className="space-y-2">
            {items.slice(0, 4).map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.07 + i * 0.04 }}
                className="flex items-start gap-2.5"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${config.dot} mt-1.5 flex-shrink-0`} />
                <span className="text-xs text-gray-300 leading-relaxed">{item}</span>
              </motion.li>
            ))}
            {items.length > 4 && (
              <li className={`flex items-center gap-1.5 text-[11px] font-medium ${config.iconText} pt-1`}>
                <ArrowRight size={10} />
                +{items.length - 4} more findings
              </li>
            )}
          </ul>
        ) : (
          <p className="text-xs text-gray-600 italic">No findings detected</p>
        )}
      </div>
    </motion.div>
  );
}

export default function InsightCards({ summary }) {
  if (!summary) return null;

  const totalFindings = INSIGHT_TYPES.reduce((sum, t) => sum + (summary[t.key]?.length || 0), 0);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Sparkles size={14} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">AI Medical Insights</h2>
            <p className="text-[10px] text-gray-600">{totalFindings} findings extracted</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Analysis complete
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {INSIGHT_TYPES.map((config, i) => (
          <InsightCard
            key={config.key}
            config={config}
            items={summary[config.key] || []}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
