import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocument } from '../../context/DocumentContext';
import { uploadPDF } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileCheck, X, Loader2, FileText, Lock } from 'lucide-react';

export default function SimpleUpload({ onSuccess }) {
  const { setDocumentLoaded, setUploadMeta } = useDocument();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const handleFile = useCallback((f) => {
    if (!f) return;
    setError(null);
    if (f.type !== 'application/pdf' && !f.name?.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file.');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File too large. Max 20 MB.');
      return;
    }
    setFile(f);
  }, []);

  const onDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };

  const handleUpload = async () => {
    if (!file || loading) return;
    setLoading(true);
    setProgress(10);
    const stages = [
      { pct: 30, delay: 800 },
      { pct: 60, delay: 1400 },
      { pct: 85, delay: 2200 },
    ];
    let i = 0;
    const iv = setInterval(() => {
      if (i < stages.length) { setProgress(stages[i].pct); i++; }
      else clearInterval(iv);
    }, 900);

    try {
      const data = await uploadPDF(file);
      clearInterval(iv);
      setProgress(100);
      setUploadMeta(data);
      setDocumentLoaded(true);
      setDone(true);
      setTimeout(() => onSuccess?.(), 800);
    } catch (err) {
      clearInterval(iv);
      setError(err?.message || 'Upload failed. Please try again.');
      setLoading(false);
      setProgress(0);
    }
  };

  if (done) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-3 py-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-emerald-500/15"
          style={{ border: '2px solid rgba(16,185,129,0.3)' }}>
          <FileCheck size={28} className="text-emerald-400" />
        </div>
        <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Report Ready!</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>You can now ask questions about your report</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <motion.label
        htmlFor="file-upload"
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        animate={{
          borderColor: dragging ? 'var(--accent)' : file ? 'rgba(16,185,129,0.4)' : 'var(--border)',
          background: dragging ? 'var(--accent-soft)' : file ? 'var(--success-soft)' : 'var(--bg-card)',
        }}
        className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all"
        style={{ minHeight: 160 }}
      >
        <input id="file-upload" type="file" accept=".pdf,application/pdf" className="hidden"
          onChange={e => handleFile(e.target.files[0])} />

        {loading ? (
          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              {progress < 40 ? 'Reading report...' : progress < 75 ? 'Processing content...' : 'Almost done...'}
            </p>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <motion.div className="h-full rounded-full"
                style={{ background: 'var(--accent)' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }} />
            </div>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center gap-2">
            <FileCheck size={32} className="text-emerald-400" />
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            <button onClick={(e) => { e.preventDefault(); setFile(null); }}
              className="flex items-center gap-1 text-xs mt-1 transition-colors"
              style={{ color: 'var(--text-muted)' }}>
              <X size={11} /> Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              <UploadCloud size={22} />
            </motion.div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {dragging ? 'Drop here' : 'Upload Medical Report'}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Drag & drop or <span style={{ color: 'var(--accent)' }}>browse</span> · PDF only · Max 20 MB
            </p>
            <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              <Lock size={10} /> Your report is private and secure
            </div>
          </div>
        )}
      </motion.label>

      {error && (
        <p className="text-sm text-center text-rose-400 flex items-center justify-center gap-2">
          <X size={13} /> {error}
        </p>
      )}

      {file && !loading && (
        <motion.button
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          onClick={handleUpload}
          className="btn-primary w-full text-base py-4 rounded-2xl"
          style={{ fontSize: '1rem' }}>
          <FileText size={18} /> Analyse My Report
        </motion.button>
      )}
    </div>
  );
}
