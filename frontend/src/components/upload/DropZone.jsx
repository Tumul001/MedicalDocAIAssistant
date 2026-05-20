import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud, FileCheck, X, Loader2, Lock,
  FileText, AlertCircle, CheckCircle2
} from 'lucide-react';
import { formatBytes, isPDFFile } from '../../utils/formatters';

const UPLOAD_STAGES = [
  { id: 'reading',    label: 'Reading document...',       pct: 15 },
  { id: 'extracting', label: 'Extracting text...',        pct: 40 },
  { id: 'chunking',   label: 'Chunking content...',       pct: 60 },
  { id: 'embedding',  label: 'Building vector index...',  pct: 80 },
  { id: 'indexing',   label: 'Finalizing RAG pipeline...', pct: 95 },
];

export default function DropZone({ onUpload, isLoading, uploadProgress = 0 }) {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = useCallback((f) => {
    if (!f) return;
    setError(null);
    if (!isPDFFile(f)) { setError('Only PDF files are accepted.'); return; }
    if (f.size > 20 * 1024 * 1024) { setError('File is too large. Maximum size is 20 MB.'); return; }
    setFile(f);
  }, []);

  const onDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };
  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onInputChange = (e) => handleFile(e.target.files[0]);

  // Determine which stage we're in during loading
  const currentStage = isLoading
    ? UPLOAD_STAGES.reduce((acc, s) => (uploadProgress >= s.pct ? s : acc), UPLOAD_STAGES[0])
    : null;

  return (
    <div className="space-y-4">
      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-4 py-3 bg-rose-500/[0.08] border border-rose-500/20 rounded-xl text-sm text-rose-300"
          >
            <AlertCircle size={14} className="flex-shrink-0 text-rose-400" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-300">
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop zone */}
      <motion.div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !file && !isLoading && fileInputRef.current?.click()}
        animate={{
          borderColor: dragging ? 'rgba(6,182,212,0.6)' : file ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)',
          backgroundColor: dragging ? 'rgba(6,182,212,0.05)' : file ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)',
        }}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center overflow-hidden transition-shadow duration-300
          ${dragging ? 'shadow-[0_0_50px_-10px_rgba(6,182,212,0.25)]' : ''}
          ${!file && !isLoading ? 'hover:border-cyan-500/30 hover:bg-white/[0.03]' : ''}
          ${isLoading ? 'cursor-default pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={onInputChange}
        />

        {/* Shimmer on drag */}
        {dragging && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="animate-shimmer" />
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* LOADING STATE */}
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-5"
            >
              {/* Animated AI brain icon */}
              <div className="relative w-16 h-16 mx-auto">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 border border-dashed border-cyan-500/25 rounded-full" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-2 border border-dotted border-violet-500/20 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={24} className="text-cyan-400 animate-spin" />
                </div>
              </div>

              <div>
                <p className="text-base font-semibold text-white mb-1">{currentStage?.label}</p>
                <p className="text-xs text-gray-500">{file?.name}</p>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-xs mx-auto">
                <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    initial={{ width: '5%' }}
                    animate={{ width: `${Math.max(uploadProgress, 5)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-2 text-center font-mono">{uploadProgress}%</p>
              </div>

              {/* Stage pills */}
              <div className="flex flex-wrap justify-center gap-2">
                {UPLOAD_STAGES.map((s) => (
                  <span key={s.id}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors
                      ${uploadProgress >= s.pct
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : s.id === currentStage?.id
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'bg-white/[0.03] text-gray-600 border border-white/[0.05]'
                      }`}
                  >
                    {uploadProgress >= s.pct ? '✓ ' : ''}{s.label.replace('...', '')}
                  </span>
                ))}
              </div>
            </motion.div>

          ) : file ? (
            /* FILE SELECTED */
            <motion.div
              key="selected"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileCheck size={26} />
              </div>
              <div>
                <p className="text-base font-semibold text-white truncate max-w-xs mx-auto">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">{formatBytes(file.size)} · PDF · Ready for analysis</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-rose-400 transition-colors mt-1"
              >
                <X size={12} /> Remove file
              </button>
            </motion.div>

          ) : (
            /* IDLE / DRAG PROMPT */
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center border transition-all
                  ${dragging
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-white/[0.04] border-white/[0.08] text-cyan-400 group-hover:border-cyan-500/30'
                  }`}
              >
                <UploadCloud size={26} />
              </motion.div>
              <div>
                <p className="text-base font-semibold text-white">
                  {dragging ? 'Drop your PDF here' : 'Drop medical PDF here'}
                </p>
                <p className="text-sm text-gray-500 mt-1">or <span className="text-cyan-400 underline underline-offset-2">click to browse</span></p>
              </div>
              <div className="flex items-center justify-center gap-4 text-[11px] text-gray-600 font-medium">
                <span className="flex items-center gap-1"><FileText size={10} /> PDF only</span>
                <span className="text-gray-700">•</span>
                <span>Max 20 MB</span>
                <span className="text-gray-700">•</span>
                <span className="flex items-center gap-1"><Lock size={10} /> Encrypted</span>
              </div>
              <p className="text-[10px] text-gray-600">Supports multilingual medical documents</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Submit button */}
      <motion.button
        onClick={() => file && !isLoading && onUpload?.(file)}
        disabled={!file || isLoading}
        whileHover={file && !isLoading ? { scale: 1.01 } : {}}
        whileTap={file && !isLoading ? { scale: 0.98 } : {}}
        className={`w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-300
          ${file && !isLoading
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:brightness-110'
            : 'bg-white/[0.04] text-gray-600 border border-white/[0.06] cursor-not-allowed'
          }`}
      >
        {isLoading ? (
          <><Loader2 size={16} className="animate-spin" /> Processing document...</>
        ) : file ? (
          <><CheckCircle2 size={16} /> Analyze with AI</>
        ) : (
          <><UploadCloud size={16} /> Select a PDF to upload</>
        )}
      </motion.button>
    </div>
  );
}
