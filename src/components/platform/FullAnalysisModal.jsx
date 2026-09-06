import React from 'react';
import { 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  FileText,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Shield,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function FullAnalysisModal({ report, onClose }) {
  if (!report) return null;

  const isSIF = report.sif_precursor_assessment === 'YES' || report.isSIF;
  const analysis = report.ai_analysis || {};
  const hazard = report.identified_hazard || analysis.identified_hazard || 'Hazard Assessment Completed';
  const energy = analysis.energy_source || report.energy_source || 'Identified Energy Vector';
  const barrier = report.barrier_status || report.barrier_information || analysis.barrier_information || 'Critical Barrier Audited';
  const explanation = analysis.explanation || report.brief_explanation || report.explanation || 'AI analysis completed based on industrial safety precursor signals.';
  const recommendation = report.recommended_action || analysis.recommended_action || 'Enforce physical controls and verify critical barrier integrity.';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200 select-none">
      
      {/* Modal Dialog */}
      <div className="w-full max-w-3xl bg-[#0C1222]/98 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col max-h-[92vh] text-left">
        
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-[#0B132B] to-slate-950 border-b border-slate-800 text-white flex items-start justify-between gap-4 shadow-md">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-black px-3 py-1 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 backdrop-blur-md shadow-2xs">
                {report.report_reference || `REP-${report.id}`}
              </span>
              {report.report_date && (
                <span className="text-xs text-slate-300 font-mono flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{report.report_date}</span>
                </span>
              )}
              {report.report_type && (
                <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/80 font-semibold">
                  {report.report_type}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading">
              AI Safety Intelligence & Causal Analysis
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              SIF Precursor Assessment Engine • Oil India Limited
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 text-slate-200">
          
          {/* 1. SIF Potential Verdict Banner */}
          <div className={`p-5 rounded-2xl border flex items-center justify-between gap-4 shadow-lg ${
            isSIF 
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200' 
              : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
          }`}>
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                isSIF ? 'bg-gradient-to-tr from-amber-500 to-rose-600 text-white' : 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white'
              }`}>
                {isSIF ? <ShieldAlert className="w-6 h-6 stroke-[2.2]" /> : <ShieldCheck className="w-6 h-6 stroke-[2.2]" />}
              </div>
              <div>
                <div className="text-xs font-mono font-black uppercase tracking-wider text-slate-300">
                  {isSIF ? 'POTENTIAL SIF PRECURSOR DETECTED' : 'NON-SIF OBSERVATION'}
                </div>
                <div className="text-base sm:text-lg font-black mt-0.5 text-white">
                  {isSIF ? 'High Energy Release & Critical Fatality Risk' : 'Contained Observation / Low Energy'}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className={`text-xs font-mono font-black px-3 py-1.5 rounded-xl border shadow-2xs ${
                isSIF ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              }`}>
                {isSIF ? 'SIF PRECURSOR' : 'NON-SIF'}
              </span>
            </div>
          </div>

          {/* 2. Full Submitted Observation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-slate-300 font-mono uppercase tracking-wider">
                Submitted Safety Observation
              </span>
              {report.location && (
                <span className="text-slate-400 text-xs font-mono flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{report.location}</span>
                </span>
              )}
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm leading-relaxed text-slate-200">
              <p className="font-medium">
                {report.description || 'No observation description recorded.'}
              </p>
            </div>
          </div>

          {/* 3. Structured Hazard, Energy Vector & Barrier Audit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xs space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">IDENTIFIED HAZARD</span>
              <strong className="text-white block font-heading text-sm sm:text-base">
                {hazard}
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xs space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">ENERGY SOURCE</span>
              <strong className="text-amber-400 block font-heading text-sm sm:text-base flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{energy}</span>
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xs space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">BARRIER STATUS</span>
              <strong className="text-white block font-heading text-sm sm:text-base flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{barrier?.replace?.('_', ' ') || barrier}</span>
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xs space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">CLASSIFICATION VECTOR</span>
              <strong className="text-blue-400 block font-heading text-sm sm:text-base">
                {report.report_type || 'Industrial Incident'}
              </strong>
            </div>
          </div>

          {/* 4. SafetyAI Recommended Action */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-amber-500/40 text-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black text-amber-400 font-mono uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>SafetyAI Corrective Recommendation</span>
            </div>
            <p className="text-sm font-bold text-white leading-relaxed">
              {recommendation}
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            SafetyAI Engine • SIH PS 165
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs sm:text-sm font-black transition-all cursor-pointer shadow-md shadow-amber-500/20"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
}
