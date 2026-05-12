import { ShieldCheck, Shield, ShieldAlert } from 'lucide-react';

export default function ConfidenceBadge({ level, score }) {
  const config = {
    high: { 
      icon: <ShieldCheck size={11} />, 
      className: 'badge-emerald',
      label: 'High'
    },
    medium: { 
      icon: <Shield size={11} />, 
      className: 'badge-amber',
      label: 'Medium'
    },
    low: { 
      icon: <ShieldAlert size={11} />, 
      className: 'badge-rose',
      label: 'Low'
    }
  };

  const c = config[level] || config.medium;

  return (
    <div className={c.className}>
      {c.icon}
      <span>{c.label} {score && `${Math.round(score * 100)}%`}</span>
    </div>
  );
}
