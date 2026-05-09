/**
 * ConfidenceBadge.jsx
 * Renders a colored badge for High / Medium / Low confidence levels.
 * Score is normalized from the reranker's realistic range (0.10–0.55)
 * to a human-friendly 0–100% display value.
 */

// Piecewise normalization: maps raw rerank scores to display percentages
// High  (≥0.40): maps 0.40–0.55 → 70–100%
// Medium(≥0.22): maps 0.22–0.40 → 40–70%
// Low   (<0.22): maps 0.00–0.22 → 0–40%
function normalizeScore(score) {
  if (score >= 0.40) {
    return Math.min(100, Math.round(((score - 0.40) / (0.55 - 0.40)) * 30 + 70));
  } else if (score >= 0.22) {
    return Math.round(((score - 0.22) / (0.40 - 0.22)) * 30 + 40);
  } else {
    return Math.max(0, Math.round((score / 0.22) * 40));
  }
}

export default function ConfidenceBadge({ level, score }) {
  const config = {
    High:   { bg: 'bg-emerald-900/40', text: 'text-emerald-400', border: 'border-emerald-700/50', dot: 'bg-emerald-400' },
    Medium: { bg: 'bg-amber-900/40',   text: 'text-amber-400',   border: 'border-amber-700/50',   dot: 'bg-amber-400'   },
    Low:    { bg: 'bg-red-900/40',     text: 'text-red-400',     border: 'border-red-700/50',     dot: 'bg-red-400'     },
  };

  const cfg = config[level] || config.Low;
  const displayPct = score !== undefined ? normalizeScore(score) : null;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {level} Confidence
      {displayPct !== null && (
        <span className="opacity-60 font-normal">({displayPct}%)</span>
      )}
    </span>
  );
}
