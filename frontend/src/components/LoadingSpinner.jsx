/**
 * LoadingSpinner.jsx
 * Clean animated loading spinner.
 */
export default function LoadingSpinner({ size = 'md', label = 'Loading…' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-4">
      <svg
        className={`${sizeClasses[size]} animate-spin text-cyan-400`}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path
          className="opacity-80"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {label && <p className="text-xs text-gray-500 font-medium">{label}</p>}
    </div>
  );
}
