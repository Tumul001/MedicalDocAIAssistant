/**
 * LoadingSpinner.jsx
 * Centered animated loading spinner using Tailwind animate-spin.
 */
export default function LoadingSpinner({ size = 'md', label = 'Loading…' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <svg
        className={`${sizeClasses[size]} animate-spin text-medical-500`}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {label && <p className="text-sm text-slate-400">{label}</p>}
    </div>
  );
}
