import React from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  FilePlus2, 
  UploadCloud, 
  FileText, 
  Activity, 
  CheckSquare, 
  Shield, 
  Building2, 
  LogOut, 
  Menu, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isCollapsed = false, 
  setIsCollapsed,
  isMobileOpen = false,
  setIsMobileOpen
}) {
  const { user, logout } = useAuth();

  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      subtitle: 'Real-Time Safety Intelligence', 
      icon: LayoutDashboard,
      badge: null 
    },
    { 
      id: 'ai_analysis', 
      label: 'AI Analysis', 
      subtitle: 'NLP & Causal Inference', 
      icon: Cpu,
      badge: 'AI'
    },
    { 
      id: 'submit_report', 
      label: 'Submit Report', 
      subtitle: 'Live Observation Ingestion', 
      icon: FilePlus2,
      badge: 'New'
    },
    { 
      id: 'bulk_upload', 
      label: 'Bulk Upload', 
      subtitle: 'Batch Dataset Ingestion', 
      icon: UploadCloud,
      badge: null 
    },
    { 
      id: 'all_reports', 
      label: 'All Reports', 
      subtitle: 'Registry & Incident Triage', 
      icon: FileText,
      badge: null 
    },
    { 
      id: 'weak_signals', 
      label: 'SIF Intelligence', 
      subtitle: 'Weak Signals & Precursors', 
      icon: Activity,
      badge: 'Live'
    },
    { 
      id: 'review_feedback', 
      label: 'Review & Feedback', 
      subtitle: 'Human-in-the-Loop Audit', 
      icon: CheckSquare,
      badge: null 
    },
  ];

  const organizationName = user?.organization_name || user?.organization_id || 'Oil India Limited';
  const officerName = user?.full_name || 'HSE Officer';
  const roleName = user?.role || 'CHIEF_HSE_AUDITOR';
  const initial = officerName.charAt(0).toUpperCase();

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Main Sidebar Component */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 
          bg-[#0A0E1A] text-slate-300 
          border-r border-slate-800/80 shadow-2xl 
          flex flex-col justify-between select-none 
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'lg:w-20' : 'lg:w-68'}
          ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Top Header / Brand Section */}
        <div className="shrink-0 border-b border-slate-800/80 bg-[#070A14]/80 backdrop-blur-md">
          <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
            
            {/* Expanded Brand View */}
            {!isCollapsed && (
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsCollapsed && setIsCollapsed(true)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer hidden lg:flex"
                  title="Collapse Sidebar"
                >
                  <Menu className="w-5 h-5 stroke-[2.2]" />
                </button>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
                    <Shield className="w-4 h-4 fill-slate-950/20 stroke-slate-950 stroke-[2.5]" />
                  </div>
                  <div className="truncate">
                    <div className="text-base font-black text-white tracking-tight font-heading flex items-center gap-1.5">
                      <span>Safety<span className="text-amber-400">AI</span></span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        PS 165
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono tracking-wider uppercase truncate">
                      Safety Intelligence
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Collapsed Brand View */}
            {isCollapsed && (
              <div className="flex flex-col items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsCollapsed && setIsCollapsed(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
                  title="Expand Sidebar"
                >
                  <Menu className="w-5 h-5 stroke-[2.2]" />
                </button>
              </div>
            )}

            {/* Mobile Close Button */}
            <div className="lg:hidden flex items-center">
              <button
                type="button"
                onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>

        {/* Navigation Items Area */}
        <div className="flex-1 overflow-y-auto py-3 px-2 sm:px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* Section Header (when expanded) */}
          {!isCollapsed && (
            <div className="px-3 pt-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
              Intelligence Platform
            </div>
          )}

          {/* Navigation Links */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <div key={item.id} className="relative group">
                <button
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center rounded-2xl transition-all duration-200 cursor-pointer text-left
                    ${isCollapsed ? 'justify-center p-3' : 'gap-3.5 px-3.5 py-3'}
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent text-white font-bold border-l-3 border-amber-400 shadow-sm shadow-amber-500/10'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 font-medium'
                    }
                  `}
                >
                  {/* Icon Container with active glow */}
                  <div 
                    className={`
                      rounded-xl shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-110
                      ${isCollapsed ? 'w-10 h-10' : 'w-8 h-8'}
                      ${
                        isActive 
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30' 
                          : 'bg-slate-800/80 text-slate-400 group-hover:text-amber-400 group-hover:bg-slate-800'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  </div>

                  {/* Expanded Item Text & Subtitle */}
                  {!isCollapsed && (
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs tracking-tight truncate font-sans">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded-full border shrink-0 ${
                            item.badge === 'Live'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className={`text-[10.5px] truncate leading-tight mt-0.5 ${isActive ? 'text-amber-300/80 font-normal' : 'text-slate-500'}`}>
                        {item.subtitle}
                      </div>
                    </div>
                  )}
                </button>

                {/* Floating Tooltip in Collapsed Mode */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold shadow-2xl border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 whitespace-nowrap min-w-36 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-amber-400">{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">{item.subtitle}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Section: Organization Profile & Logout */}
        <div className="shrink-0 p-3 border-t border-slate-800/80 bg-[#070A14]/80 backdrop-blur-md">
          
          {/* Expanded Profile Card */}
          {!isCollapsed && (
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-left shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-600 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                      <span>{officerName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {organizationName}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono">
                  <span className="text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60 truncate max-w-[120px]">
                    {roleName}
                  </span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Verified
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all duration-150 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out Platform</span>
              </button>
            </div>
          )}

          {/* Collapsed Profile & Logout */}
          {isCollapsed && (
            <div className="flex flex-col items-center gap-2">
              {/* Profile Avatar with Tooltip */}
              <div className="relative group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-600 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs cursor-default">
                  {initial}
                </div>
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#0F172A] text-white text-xs font-semibold shadow-2xl border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  <div className="font-bold text-amber-400">{officerName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{organizationName}</div>
                </div>
              </div>

              {/* Collapsed Logout Icon Button */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={logout}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#0F172A] text-rose-400 text-xs font-semibold shadow-2xl border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  Sign Out
                </div>
              </div>
            </div>
          )}

        </div>
      </aside>
    </>
  );
}
