import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, Check, ChevronDown, Globe } from 'lucide-react';

export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', label: 'English',   native: 'English',    flag: '🇺🇸', short: 'EN' },
  { code: 'hi-IN', label: 'Hindi',     native: 'हिंदी',       flag: '🇮🇳', short: 'HI' },
  { code: 'bn-IN', label: 'Bengali',   native: 'বাংলা',       flag: '🇮🇳', short: 'BN' },
  { code: 'ta-IN', label: 'Tamil',     native: 'தமிழ்',       flag: '🇮🇳', short: 'TA' },
  { code: 'te-IN', label: 'Telugu',    native: 'తెలుగు',     flag: '🇮🇳', short: 'TE' },
  { code: 'mr-IN', label: 'Marathi',   native: 'मराठी',       flag: '🇮🇳', short: 'MR' },
  { code: 'gu-IN', label: 'Gujarati',  native: 'ગુજરાતી',    flag: '🇮🇳', short: 'GU' },
  { code: 'kn-IN', label: 'Kannada',   native: 'ಕನ್ನಡ',     flag: '🇮🇳', short: 'KA' },
  { code: 'pa-IN', label: 'Punjabi',   native: 'ਪੰਜਾਬੀ',    flag: '🇮🇳', short: 'PA' },
  { code: 'ml-IN', label: 'Malayalam', native: 'മലയാളം',     flag: '🇮🇳', short: 'ML' },
];

export default function LanguageSelector({ value, onChange, compact = false }) {
  const [open, setOpen] = useState(false);
  const current = SUPPORTED_LANGUAGES.find(l => l.code === value) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04]
          hover:bg-white/[0.07] hover:border-white/[0.12] transition-all duration-200
          ${compact ? 'px-2.5 py-2 text-xs' : 'px-3 py-2.5 text-sm'}`}
        aria-label="Select language"
        aria-expanded={open}
      >
        <Globe size={compact ? 12 : 14} className="text-cyan-400 flex-shrink-0" />
        <span className="text-gray-300 font-medium">{current.flag} {compact ? current.short : current.native}</span>
        <ChevronDown
          size={12}
          className={`text-gray-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute top-full mt-2 right-0 z-50 min-w-[200px] bg-gray-900/95 backdrop-blur-xl
                border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden py-1"
            >
              {/* Header */}
              <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2">
                <Languages size={12} className="text-cyan-400" />
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Select Language</span>
              </div>

              {/* Language list */}
              <div className="max-h-64 overflow-y-auto py-1 scrollbar-thin">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { onChange?.(lang.code); setOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors
                      ${lang.code === value
                        ? 'bg-cyan-500/10 text-cyan-300'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base leading-none">{lang.flag}</span>
                      <div className="text-left">
                        <p className="text-xs font-semibold leading-tight">{lang.native}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5">{lang.label}</p>
                      </div>
                    </div>
                    {lang.code === value && <Check size={12} className="text-cyan-400 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
