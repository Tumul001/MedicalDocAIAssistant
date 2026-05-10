/**
 * SummarySection.jsx
 * Displays one category from MedicalSummary as a labeled list.
 * Shows an empty state if the list is empty.
 */
export default function SummarySection({ title, items, icon, color = 'medical' }) {
  const colorMap = {
    medical: { badge: 'bg-medical-900/30 border-medical-700/40 text-medical-400', dot: 'bg-medical-500' },
    emerald: { badge: 'bg-emerald-900/30 border-emerald-700/40 text-emerald-400', dot: 'bg-emerald-500' },
    amber:   { badge: 'bg-amber-900/30 border-amber-700/40 text-amber-400',       dot: 'bg-amber-500'   },
    red:     { badge: 'bg-red-900/30 border-red-700/40 text-red-400',             dot: 'bg-red-500'     },
    violet:  { badge: 'bg-violet-900/30 border-violet-700/40 text-violet-400',    dot: 'bg-violet-500'  },
  };

  const c = colorMap[color] || colorMap.medical;

  return (
    <div className="glass rounded-2xl p-5 space-y-3 border border-slate-700/40">
      {/* Header */}
      <div className="flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full border ${c.badge}`}>
          {items?.length || 0}
        </span>
      </div>

      {/* Items */}
      {items && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500 italic">No {title.toLowerCase()} found in document</p>
      )}
    </div>
  );
}
