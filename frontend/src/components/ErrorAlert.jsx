import { motion } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

/**
 * ErrorAlert.jsx
 * Premium dismissible error toast with animation.
 */
export default function ErrorAlert({ message, onDismiss }) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      id="error-alert"
      className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 backdrop-blur-xl"
    >
      <AlertCircle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-sm text-rose-300 leading-relaxed">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-rose-400 hover:text-rose-300 transition-colors flex-shrink-0 p-0.5"
          aria-label="Dismiss error"
        >
          <X size={14} />
        </button>
      )}
    </motion.div>
  );
}
