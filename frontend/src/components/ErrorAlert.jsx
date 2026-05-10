import { useState } from 'react';

/**
 * ErrorAlert.jsx
 * Dismissible red alert box for error messages.
 */
export default function ErrorAlert({ message, onDismiss }) {
  const [visible, setVisible] = useState(true);

  if (!visible || !message) return null;

  const dismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div
      id="error-alert"
      className="flex items-start gap-3 p-4 rounded-xl bg-red-900/30 border border-red-700/50 text-red-400"
    >
      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="flex-1 text-sm leading-relaxed">{message}</p>
      <button
        onClick={dismiss}
        className="text-red-500 hover:text-red-300 transition-colors flex-shrink-0"
        aria-label="Dismiss error"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
