import { useRef, useState } from 'react';
import ErrorAlert from './ErrorAlert';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, UploadCloud, CheckCircle2, X, Loader2, FileCheck, Shield } from 'lucide-react';

export default function UploadCard({ onUpload, isLoading }) {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    setError(null);
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPDF) { setError('Only PDF files are accepted.'); return; }
    if (file.size > 20 * 1024 * 1024) { setError('File too large. Maximum size is 20MB.'); return; }
    setSelectedFile(file);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };
  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleInputChange = (e) => handleFile(e.target.files[0]);
  const handleUpload = () => { if (selectedFile && !isLoading) onUpload(selectedFile); };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <ErrorAlert message={error} onDismiss={() => setError(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center
          transition-all duration-300 overflow-hidden group
          ${dragging
            ? 'border-cyan-400 bg-cyan-500/[0.06] shadow-[0_0_40px_-10px_rgba(6,182,212,0.2)]'
            : selectedFile
              ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
              : 'border-white/[0.08] bg-white/[0.02] hover:border-cyan-500/30 hover:bg-white/[0.04]'
          }
        `}
      >
        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleInputChange} />

        {dragging && <div className="animate-shimmer pointer-events-none" />}

        <AnimatePresence mode="wait">
          {selectedFile ? (
            <motion.div key="selected" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
              <div className="w-14 h-14 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileCheck size={24} />
              </div>
              <div>
                <p className="text-base font-semibold text-white">{selectedFile.name}</p>
                <p className="text-xs text-gray-500 mt-1">{formatSize(selectedFile.size)} • Ready for analysis</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-rose-400 transition-colors"
              >
                <X size={12} /> Remove
              </button>
            </motion.div>
          ) : (
            <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="w-14 h-14 mx-auto rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-cyan-400 group-hover:text-cyan-300 group-hover:border-cyan-500/20 transition-all">
                <UploadCloud size={24} />
              </div>
              <div>
                <p className="text-base font-semibold text-white">Upload Medical Record</p>
                <p className="text-sm text-gray-500 mt-1">Drag & drop a PDF or click to browse</p>
              </div>
              <div className="flex justify-center gap-4">
                <span className="text-[11px] text-gray-600 font-medium">PDF only</span>
                <span className="text-gray-800">•</span>
                <span className="text-[11px] text-gray-600 font-medium">Max 20MB</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <button
        id="upload-submit-btn"
        onClick={handleUpload}
        disabled={!selectedFile || isLoading}
        className={`btn w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200
          ${selectedFile && !isLoading
            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:brightness-110 active:scale-[0.98]'
            : 'bg-white/[0.04] text-gray-600 border border-white/[0.06] cursor-not-allowed'
          }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            Processing Document...
          </>
        ) : (
          <>
            <FileText size={16} />
            Analyze Document
          </>
        )}
      </button>
    </div>
  );
}
