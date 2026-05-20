/**
 * utils/formatters.js
 * Shared utility functions for the MedAssist AI frontend.
 */

/** Format bytes to human-readable string */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Format seconds to MM:SS */
export function formatDuration(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** Format confidence 0-1 to percentage string */
export function formatConfidence(value) {
  if (value == null) return '—';
  return `${Math.round(value * 100)}%`;
}

/** Truncate string to maxLen with ellipsis */
export function truncate(str, maxLen = 80) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/** Get relative time string */
export function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

/** Capitalize first letter */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Generate unique ID */
export function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Map confidence to color class */
export function confidenceColor(value) {
  if (value == null) return 'text-gray-500';
  if (value >= 0.8) return 'text-emerald-400';
  if (value >= 0.5) return 'text-amber-400';
  return 'text-rose-400';
}

/** Get file extension */
export function getFileExtension(filename) {
  return filename?.split('.').pop()?.toLowerCase() || '';
}

/** Check if string is a valid PDF filename */
export function isPDFFile(file) {
  if (!file) return false;
  const isPDFType = file.type === 'application/pdf';
  const isPDFName = file.name?.toLowerCase().endsWith('.pdf');
  return isPDFType || isPDFName;
}
