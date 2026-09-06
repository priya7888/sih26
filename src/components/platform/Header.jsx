import React from 'react';
import { 
  Menu, 
  ChevronRight, 
  Calendar, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  PlusCircle, 
  ShieldAlert, 
  LogOut,
  Building2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ 
  activeTab = 'dashboard', 
  setActiveTab,
  isCollapsed = false, 
  setIsCollapsed,
  isMobileOpen = false,
  setIsMobileOpen,
  showSymbols = false,
  setShowSymbols
}) {
  const { user, logout } = useAuth();
  const organizationName = user?.organization_name || user?.organization_id || 'Oil India Limited';
  const officerName = user?.full_name || 'HSE Officer';
  const initial = officerName.charAt(0).toUpperCase();

  const tabTitles = {
    dashboard: {
      title: 'Safety Intelligence Dashboard',
      subtitle: 'Real-Time SIF Precursor Detection & Incident Triage'
    },
    ai_analysis: {
      title: 'Explainable AI Analysis',
      subtitle: 'NLP Hazard Isolation & Causal Energy Vector Mapping'
    },
    submit_report: {
      title: 'Submit Field Safety Report',
      subtitle: 'Real-time observation ingestion with automated AI classification'
    },
    bulk_upload: {
      title: 'Bulk Dataset Ingestion',
      subtitle: 'High-throughput enterprise ingestion for historical incidents'
    },
    all_reports: {
      title: 'All Safety Reports Registry',
      subtitle: 'Comprehensive incident log with precursor verification'
    },
    weak_signals: {
      title: 'SIF Intelligence & Precursors',
      subtitle: 'High-energy vector distribution & weak signal hotspot detection'
    },
    review_feedback: {
      title: 'Human-in-the-Loop Audit Queue',
      subtitle: 'Subject matter expert validation & AI continuous learning'
    }
  };

  const currentTabInfo = tabTitles[activeTab] || tabTitles.dashboard;

  return (
    <header className="h-16 bg-[#070A14]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-md select-none transition-all">
      
      {/* Left Area: Hamburger Toggle & Dynamic Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        
        {/* Hamburger Toggle Button */}
        <button
          type="button"
          onClick={() => {
            // On mobile, toggle mobile drawer. On desktop, toggle collapse
            if (window.innerWidth < 1024) {
              if (setIsMobileOpen) setIsMobileOpen(!isMobileOpen);
            } else {
              if (setIsCollapsed) setIsCollapsed(!isCollapsed);
            }
          }}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label="Toggle sidebar navigation"
        >
          <Menu className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Page Title & Breadcrumb */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-slate-400 hidden sm:inline">
              SafetyAI
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:inline shrink-0" />
            <h1 className="text-sm sm:text-base font-extrabold text-white font-heading tracking-tight truncate">
              {currentTabInfo.title}
            </h1>
            <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-2.5 h-2.5" />
              SIH PS 165
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium truncate hidden md:block mt-0.5">
            {currentTabInfo.subtitle}
          </p>
        </div>

      </div>

      {/* Right Area: Status, Quick Actions & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        
        {/* Toggle 5 Safety Symbols Button (Active only on dashboard) */}
        {activeTab === 'dashboard' && setShowSymbols && (
          <button
            type="button"
            onClick={() => setShowSymbols(!showSymbols)}
            title={showSymbols ? "Hide 5 Safety Symbols" : "Show 5 Safety Symbols"}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-150 cursor-pointer
              ${
                showSymbols
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
              }
            `}
          >
            <Sliders className="w-3.5 h-3.5 stroke-[2.2]" />
            <span className="hidden sm:inline">5 Symbols</span>
            {showSymbols ? (
              <ChevronUp className="w-3 h-3 stroke-[2.5]" />
            ) : (
              <ChevronDown className="w-3 h-3 stroke-[2.5]" />
            )}
          </button>
        )}

        {/* Quick Action: New Observation Entry Button */}
        {activeTab !== 'submit_report' && setActiveTab && (
          <button
            type="button"
            onClick={() => setActiveTab('submit_report')}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Report</span>
          </button>
        )}

        {/* Live Today Sync Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300 shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-semibold text-slate-200">Sept 6, 2026</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold text-emerald-400">5 Live Reports</span>
        </div>

        {/* User Profile Chip */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-600 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-amber-400/20 shrink-0">
            {initial}
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <div className="text-xs font-bold text-white truncate max-w-[120px]">
              {officerName}
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]">
              {organizationName}
            </div>
          </div>

          {/* Direct Sign Out Button */}
          <button
            type="button"
            onClick={logout}
            title="Sign Out Platform"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-500/30"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>

    </header>
  );
}

