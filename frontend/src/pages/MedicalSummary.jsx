import { useNavigate } from 'react-router-dom';
import { useDocument } from '../context/DocumentContext';
import { getMedicalSummary } from '../services/api';
import SummarySection from '../components/SummarySection';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { useState } from 'react';

/**
 * MedicalSummary.jsx
 * - "Generate Summary" button
 * - Grid of SummarySection components per category
 * - Guards: requires document uploaded first
 */
export default function MedicalSummary() {
  const navigate = useNavigate();
  const { documentLoaded, summary, setSummary } = useDocument();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMedicalSummary();
      setSummary(data);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to generate summary.');
    } finally {
      setLoading(false);
    }
  };

  const SECTIONS = [
    { key: 'diseases',        title: 'Diseases & Diagnoses',   icon: '🦠', color: 'red'     },
    { key: 'medications',     title: 'Medications',             icon: '💊', color: 'medical' },
    { key: 'allergies',       title: 'Allergies',               icon: '⚠️', color: 'amber'   },
    { key: 'abnormalities',   title: 'Abnormal Findings',       icon: '📊', color: 'violet'  },
    { key: 'recommendations', title: 'Recommendations',         icon: '✅', color: 'emerald' },
  ];

  // Guard: no document
  if (!documentLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass rounded-2xl p-10 border border-slate-700/40 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl">
            📋
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-300">No Document Loaded</h2>
            <p className="text-sm text-slate-500 mt-1">Upload a medical PDF to generate a structured summary.</p>
          </div>
          <button
            id="go-upload-from-summary-btn"
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-xl gradient-medical text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Upload Document →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Medical Summary</h1>
          <p className="text-slate-400 text-sm mt-1">AI-extracted structured summary from your document</p>
        </div>
        <button
          id="generate-summary-btn"
          onClick={handleGenerate}
          disabled={loading}
          className={`
            px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
            ${loading
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'gradient-medical text-white shadow-lg hover:opacity-90 active:scale-95'
            }
          `}
        >
          {loading ? 'Generating…' : summary ? 'Regenerate' : 'Generate Summary'}
        </button>
      </div>

      {/* Error */}
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Loading */}
      {loading && <LoadingSpinner label="Extracting medical entities…" />}

      {/* Summary grid */}
      {!loading && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {SECTIONS.map(s => (
            <SummarySection
              key={s.key}
              title={s.title}
              items={summary[s.key]}
              icon={s.icon}
              color={s.color}
            />
          ))}
        </div>
      )}

      {/* Placeholder when no summary yet */}
      {!loading && !summary && (
        <div className="glass rounded-2xl p-10 border border-slate-700/40 text-center space-y-3">
          <p className="text-3xl">🩺</p>
          <p className="text-slate-400 text-sm">Click "Generate Summary" to extract diseases, medications, allergies, abnormalities, and recommendations from your document.</p>
        </div>
      )}
    </div>
  );
}
