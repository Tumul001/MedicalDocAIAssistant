import { motion } from 'framer-motion';

export default function TypingIndicator({ label = 'Analyzing records...' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="flex justify-start"
    >
      <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-tl-sm px-5 py-3.5 max-w-xs">
        <div className="flex gap-1">
          {[0, 0.15, 0.3].map((delay, i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 0.9, delay, ease: 'easeInOut' }}
              className="w-1.5 h-1.5 rounded-full bg-cyan-400"
            />
          ))}
        </div>
        <span className="text-[11px] font-medium text-gray-500">{label}</span>
      </div>
    </motion.div>
  );
}
