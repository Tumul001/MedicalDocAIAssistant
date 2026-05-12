import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useDocument } from '../context/DocumentContext';
import { useTheme } from '../context/ThemeContext';
import { getHealth } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  MessageSquare, 
  ClipboardList, 
  Search, 
  BarChart3,
  Menu, 
  X, 
  Activity,
  Heart,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Shield,
  Sun,
  Moon
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, description: 'Upload & overview' },
  { path: '/chat', label: 'AI Chat', icon: MessageSquare, description: 'Medical assistant' },
  { path: '/summary', label: 'Summary', icon: ClipboardList, description: 'Clinical analysis' },
  { path: '/evidence', label: 'Evidence', icon: Search, description: 'Source search' },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, description: 'AI insights' },
];

export default function MainLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(null);
  const { documentLoaded } = useDocument();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();

  // Health check
  useEffect(() => {
    const check = async () => {
      try {
        await getHealth();
        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentPage = NAV_ITEMS.find(item => item.path === location.pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 bg-mesh noise">

      {/* ─── Desktop Sidebar ─── */}
      <motion.aside 
        animate={{ width: sidebarCollapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="hidden lg:flex flex-col bg-white/[0.02] border-r border-white/[0.06] z-50 relative overflow-hidden"
      >
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-white/[0.06] ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg glow-sm">
            <Heart className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col min-w-0"
              >
                <span className="text-sm font-bold text-white tracking-tight">MedAssist</span>
                <span className="text-[10px] text-gray-500 font-medium">AI Platform</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-none">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-cyan-500/10 text-cyan-400' 
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'
                  }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200
                  ${isActive 
                    ? 'bg-cyan-500/15 text-cyan-400' 
                    : 'bg-transparent group-hover:bg-white/[0.04]'
                  }`}>
                  <Icon size={18} />
                </div>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col min-w-0"
                    >
                      <span className={`text-[13px] font-semibold truncate ${isActive ? 'text-cyan-400' : ''}`}>
                        {item.label}
                      </span>
                      <span className="text-[10px] text-gray-600 truncate">{item.description}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-indicator"
                    className="absolute left-0 w-[3px] h-6 bg-cyan-400 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                {/* Collapsed tooltip */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 border border-white/[0.1] text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 translate-x-[-8px] group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap z-[100] shadow-xl">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 space-y-2 border-t border-white/[0.06]">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] transition-all"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0">
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[13px] font-medium">
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* ─── Main Viewport ─── */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top Bar */}
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-white/[0.06] bg-white/[0.01] backdrop-blur-xl z-30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden btn-icon"
            >
              <Menu size={18} />
            </button>
            
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 font-medium hidden sm:inline">MedAssist</span>
              <span className="text-gray-700 hidden sm:inline">/</span>
              <span className="font-semibold text-white">{currentPage?.label || 'Dashboard'}</span>
            </div>

            {documentLoaded && (
              <div className="badge-emerald ml-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Document Active</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Backend Status */}
            <div className={`badge ${backendOnline === true ? 'badge-emerald' : backendOnline === false ? 'badge-rose' : 'badge-white'} hidden sm:flex`}>
              {backendOnline === true ? <Wifi size={12} /> : backendOnline === false ? <WifiOff size={12} /> : <Activity size={12} />}
              <span>{backendOnline === true ? 'Online' : backendOnline === false ? 'Offline' : 'Checking'}</span>
            </div>

            <div className="badge-white hidden md:flex">
              <Shield size={12} />
              <span>HIPAA</span>
            </div>

            <button className="btn-icon" onClick={toggleTheme} aria-label="Toggle Theme">
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button className="btn-icon relative">
              <Bell size={16} />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </button>

            <button className="btn-icon">
              <Settings size={16} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto relative scrollbar-thin">
          {/* Ambient background glows */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/[0.04] blur-[150px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/[0.03] blur-[150px] pointer-events-none" />

          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8 h-full relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ─── Mobile Sidebar Overlay ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-72 bg-gray-950 border-r border-white/[0.08] p-4 z-[70] lg:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Heart className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white">MedAssist</span>
                    <p className="text-[10px] text-gray-500">AI Platform</p>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="btn-icon">
                  <X size={18} />
                </button>
              </div>

              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all
                        ${isActive 
                          ? 'bg-cyan-500/10 text-cyan-400' 
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
