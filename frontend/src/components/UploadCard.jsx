import { useRef, useState } from 'react';
import ErrorAlert from './ErrorAlert';

/**
 * UploadCard.jsx
 * Drag-and-drop PDF upload with fallback file input.
 * Shows upload progress and error states.
 */
export default function UploadCard({ onUpload, isLoading }) {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    setError(null);
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File too large. Maximum size is 20MB.');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleInputChange = (e) => {
    handleFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (selectedFile && !isLoading) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className="space-y-4">
      {/* Client-side validation error */}
      {error && (
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      )}

      {/* Drop zone */}
      <div
        id="pdf-dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center
          transition-all duration-200
          ${dragging
            ? 'border-medical-500 bg-medical-900/20 scale-[1.01]'
            : selectedFile
              ? 'border-emerald-600/60 bg-emerald-900/10'
              : 'border-slate-700 hover:border-medical-600/60 hover:bg-medical-900/10 bg-slate-900/40'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          id="pdf-file-input"
          onChange={handleInputChange}
        />

        {selectedFile ? (
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-900/40 border border-emerald-700/50 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-emerald-400">{selectedFile.name}</p>
            <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline"
            >
              Change file
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <svg className="w-7 h-7 text-medical-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Drop your PDF here</p>
              <p className="text-xs text-slate-500 mt-1">or click to browse — PDF files only</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload button */}
      <button
        id="upload-submit-btn"
        onClick={handleUpload}
        disabled={!selectedFile || isLoading}
        className={`
          w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200
          ${selectedFile && !isLoading
            ? 'gradient-medical text-white shadow-lg shadow-medical-900/50 hover:opacity-90 active:scale-95'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing document…
          </span>
        ) : 'Upload & Process PDF'}
      </button>
    </div>
  );
}
