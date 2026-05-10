import { NavLink } from 'react-router-dom';

/**
 * Navbar.jsx
 * Top navigation bar (used as a supplementary component).
 * Primary navigation is handled by MainLayout sidebar.
 */
export default function Navbar() {
  return (
    <nav className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-800">
      <NavLink to="/" end className={({ isActive }) =>
        `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          isActive ? 'text-medical-400 bg-medical-900/20' : 'text-slate-400 hover:text-slate-200'
        }`
      }>Dashboard</NavLink>
      <NavLink to="/chat" className={({ isActive }) =>
        `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          isActive ? 'text-medical-400 bg-medical-900/20' : 'text-slate-400 hover:text-slate-200'
        }`
      }>Chat</NavLink>
      <NavLink to="/summary" className={({ isActive }) =>
        `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          isActive ? 'text-medical-400 bg-medical-900/20' : 'text-slate-400 hover:text-slate-200'
        }`
      }>Summary</NavLink>
      <NavLink to="/evidence" className={({ isActive }) =>
        `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          isActive ? 'text-medical-400 bg-medical-900/20' : 'text-slate-400 hover:text-slate-200'
        }`
      }>Evidence</NavLink>
    </nav>
  );
}
