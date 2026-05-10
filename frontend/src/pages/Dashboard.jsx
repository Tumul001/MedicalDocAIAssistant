import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocument } from '../context/DocumentContext';
import { uploadPDF, getHealth } from '../services/api';
import UploadCard from '../components/UploadCard';
import ErrorAlert from '../components/ErrorAlert';

/**
 * Dashboard.jsx
 * - PDF upload
 * - Document metadata display after upload
 * - Backend health indicator
 * - Navigation to Chat and Summary
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const {
    documentLoaded, setDocumentLoaded,
    uploadMeta, setUploadMeta,
    isUploading, setIsUploading,
    uploadError, setUploadError,
  } = useDocument();

  const [backendOnline, setBackendOnline] = useState(null);

  // Health check on mount
  useEffect(() => {
    getHealth()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  const handleUpload = async (file) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const data = await uploadPDF(file);
      setUploadMeta(data);
      setDocumentLoaded(true);
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Upload failed. Check backend is running.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Upload a medical PDF to begin intelligent analysis</p>
      </div>

      {/* Backend health indicator */}
      <div className="flex items-center gap-2 px-4 py-3 glass rounded-xl border border-slate-700/40">
        <div className={`w-2.5 h-2.5 rounded-full ${
          backendOnline === null ? 'bg-slate-500 animate-pulse' :
          backendOnline ? 'bg-emerald-400 pulse-dot' : 'bg-red-500'
        }`} />
        <span className="text-xs text-slate-400">
          Backend: {backendOnline === null ? 'Checking…' : backendOnline ? 'Online ✓' : 'Offline — start uvicorn server'}
        </span>
      </div>

      {/* Error alert */}
      {uploadError && (
        <ErrorAlert message={uploadError} onDismiss={() => setUploadError(null)} />
      )}

      {/* Upload card */}
      <div className="glass rounded-2xl p-6 border border-slate-700/40">
        <h2 className="text-base font-semibold text-slate-200 mb-4">Upload Medical Document</h2>
        <UploadCard onUpload={handleUpload} isLoading={isUploading} />
      </div>

      {/* Document metadata */}
      {documentLoaded && uploadMeta && (
        <div className="glass rounded-2xl p-6 border border-emerald-700/30 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-900/40 border border-emerald-700/50 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-emerald-400">Document Processed Successfully</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pages', value: uploadMeta.page_count, icon: '📄' },
              { label: 'Chunks', value: uploadMeta.chunk_count, icon: '🔢' },
              { label: 'OCR Used', value: uploadMeta.used_ocr ? 'Yes' : 'No', icon: '🔍' },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-800/60 rounded-xl p-3 text-center">
                <div className="text-lg">{stat.icon}</div>
                <div className="text-lg font-bold text-white mt-1">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Quick action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              id="go-to-chat-btn"
              onClick={() => navigate('/chat')}
              className="flex-1 py-2.5 rounded-xl gradient-medical text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Ask Questions →
            </button>
            <button
              id="go-to-summary-btn"
              onClick={() => navigate('/summary')}
              className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-200 text-sm font-semibold hover:bg-slate-600 transition-colors"
            >
              View Summary →
            </button>
          </div>
        </div>
      )}

      {/* Getting started hint */}
      {!documentLoaded && (
        <div className="glass rounded-2xl p-5 border border-slate-700/30 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Supported Document Types</h3>
          <div className="grid grid-cols-2 gap-2">
            {['Lab Reports', 'Prescriptions', 'Discharge Summaries', 'Clinical Notes', 'Diagnostic Reports', 'Patient Records'].map(t => (
              <div key={t} className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-medical-500">✓</span> {t}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
