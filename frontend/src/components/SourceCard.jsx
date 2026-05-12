import { motion } from 'framer-motion';
import { FileText, MapPin, ExternalLink, Hash, TrendingUp } from 'lucide-react';

export default function SourceCard({ chunk, rank }) {
  const score = chunk.rerank_score;
  const scorePercent = score ? Math.round(score * 100) : null;
  const scoreColor = scorePercent >= 80 ? 'text-emerald-400' : scorePercent >= 50 ? 'text-amber-400' : 'text-gray-500';

  return (
    <div className="card-interactive p-5 group/source">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <FileText size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Source #{rank || chunk.chunk_id}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                <MapPin size={9} /> Page {chunk.page}
              </div>
              {scorePercent !== null && (
                <div className={`flex items-center gap-1 text-[10px] font-semibold ${scoreColor}`}>
                  <TrendingUp size={9} /> {scorePercent}% relevance
                </div>
              )}
            </div>
          </div>
        </div>
        
        {rank && (
          <div className="badge-white text-[10px] py-0.5">
            <Hash size={9} />
            Rank {rank}
          </div>
        )}
      </div>

      {/* Text Content */}
      <div className="relative pl-3 border-l-2 border-cyan-500/15 group-hover/source:border-cyan-500/30 transition-colors">
        <p className="text-sm text-gray-400 leading-relaxed group-hover/source:text-gray-300 transition-colors line-clamp-4">
          "{chunk.text}"
        </p>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between">
        <span className="text-[10px] text-gray-600 font-medium">
          {chunk.source || 'Document Extract'}
        </span>
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-600 group-hover/source:text-cyan-400 transition-colors">
          View full <ExternalLink size={9} />
        </div>
      </div>
    </div>
  );
}
