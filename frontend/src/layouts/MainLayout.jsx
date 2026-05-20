import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useDocument } from '../context/DocumentContext';
import { useTheme } from '../context/ThemeContext';
import { getHealth } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, FileText, Mic, Sparkles, Settings,
  Menu, X, Heart, Sun, Moon, Wifi, WifiOff,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const NAV = [
  { path: '/',          label: 'Home',      icon: Home,      desc: 'Upload & voice' },
  { path: '/chat',      label: 'AI Chat',   icon: Sparkles,  desc: 'Ask questions' },
  { path: '/voice',     label: 'Voice',     icon: Mic,       desc: 'Speak & listen' },
  { path: '/summary',   label: 'Reports',   icon: FileText,  desc: 'Medical insights' },
  { path: '/analytics', label: 'Insights',  icon: Sparkles,  desc: 'AI analytics' },
];

export default function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [online, setOnline] = useState(null);
  const { documentLoaded } = useDocument();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    const check = async () => {
      try { await getHealth(); setOnline(true); }
      catch { setOnline(false); }
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b flex-shrink-0 ${isMobile ? 'justify-between' : collapsed ? 'justify-center' : 'gap-3'}`}
        style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #6366f1)' }}>
            <Heart size={16} className="text-white" strokeWidth={2.5} />
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>MedAssist AI</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Health Companion</p>
            </div>
          )}
        </div>
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="btn-icon">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-none">
        {NAV.map(item => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <NavLink key={item.path} to={item.path}
              className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              style={{
                background: isActive ? 'var(--accent-soft)' : 'transparent',
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div layoutId="nav-indicator"
                  className="absolute left-0 w-[3px] h-5 rounded-r-full"
                  style={{ background: 'var(--accent)' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'}`}
                style={{ background: isActive ? 'var(--accent-soft)' : 'transparent' }}>
                <Icon size={17} />
              </div>

              {(!collapsed || isMobile) && (
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] font-semibold ${isActive ? 'text-[var(--accent)]' : ''}`}>{item.label}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
              )}

              {/* Tooltip when collapsed */}
              {collapsed && !isMobile && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
                  opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-lg transition-all translate-x-[-4px] group-hover:translate-x-0"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-2 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        {/* Status dot */}
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--bg-card)' }}>
            {online === true ? <Wifi size={12} className="text-emerald-400" /> : <WifiOff size={12} className="text-rose-400" />}
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
              {online === true ? 'AI Backend Online' : online === false ? 'Backend Offline' : 'Connecting...'}
            </span>
            {documentLoaded && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme}
            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all text-[13px] font-medium"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-card)' }}>
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            {(!collapsed || isMobile) && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          {!isMobile && (
            <button onClick={() => setCollapsed(!collapsed)} className="btn-icon flex-shrink-0">
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden noise" style={{ background: 'var(--bg)' }}>

      {/* ── Desktop Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="hidden lg:block flex-shrink-0 relative overflow-hidden"
        style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      >
        <SidebarContent />
      </motion.aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar — mobile only */}
        <header className="lg:hidden h-14 flex items-center justify-between px-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="btn-icon">
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #6366f1)' }}>
                <Heart size={13} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>MedAssist AI</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {documentLoaded && <div className="badge-emerald"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Ready</div>}
            <button onClick={toggleTheme} className="btn-icon">
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[60] lg:hidden"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-72 z-[70] lg:hidden overflow-hidden"
              style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>
              <SidebarContent isMobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
