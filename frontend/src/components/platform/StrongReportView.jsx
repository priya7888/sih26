import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Cpu, 
  MapPin, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  FileText,
  Flame,
  Zap,
  Activity,
  AlertOctagon,
  RotateCcw
} from 'lucide-react';
import FullAnalysisModal from './FullAnalysisModal';

export default function StrongReportView() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadStrongReports();
  }, []);

  const loadStrongReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getReports();
      if (Array.isArray(res)) {
        // High-consequence / SIF precursor reports submitted by actual users
        const strongOnly = res
          .filter(r => r.sif_precursor_assessment === 'YES' || (r.ai_score && r.ai_score >= 80))
          .map(r => ({
            id: r.id,
            report_reference: r.report_reference,
            report_type: r.report_type || 'Near Miss',
            title: r.identified_hazard || `${r.report_type}: ${r.location || 'Industrial Facility'}`,
            description: r.description,
            location: r.location || 'Operational Area',
            facility_unit: r.incident_location_name || r.location || 'Operational Unit',
            report_date: r.report_date || (r.created_at ? r.created_at.slice(0, 10) : 'Recent'),
            sif_potential: r.sif_precursor_assessment === 'YES' 
              ? 'CRITICAL SIF POTENTIAL (CONFIRMED PRECURSOR)' 
              : 'ELEVATED RISK LEVEL',
            ai_confidence: r.sif_confidence || 92,
            risk_score: r.ai_score || 85,
            investigation_priority: (r.ai_score && r.ai_score >= 85) || r.sif_precursor_assessment === 'YES' 
              ? 'P1 IMMEDIATE MANDATORY STOP-WORK' 
              : 'P2 EXPEDITED AUDIT ENFORCEMENT',
            energy_source: r.energy_source || 'Pressurized Fluid / Chemical / Thermal Energy',
            barrier_status: r.barrier_status || (r.sif_precursor_assessment === 'YES' ? 'CRITICAL BARRIER COMPROMISED / MISSING' : 'BARRIER DEGRADED'),
            key_learnings: r.explanation || 'Requires strict barrier verification and continuous monitoring.'
          }));
        setReports(strongOnly);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error('Error fetching strong reports:', err);
      setError('Unable to load high-consequence reports from backend service.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto text-slate-800 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200/60 text-rose-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                High-Consequence SIF Reports
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Dynamic aggregation of genuine user reports exhibiting critical precursor signatures, high-energy vectors, or compromised barriers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadStrongReports}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <div className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 font-mono text-xs font-bold">
            {reports.length} Priority Precursor Cases
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 space-y-2">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium">Loading high-consequence reports...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-700 text-xs font-semibold">
          {error}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200/90 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No High-Consequence SIF Reports Logged Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            When user reports are submitted and classified by the AI engine as SIF precursors or high-risk incidents (Score &ge; 80), they will appear here dynamically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reports.map((report) => (
            <div 
              key={report.id || report.report_reference}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-xs hover:shadow-md transition-all space-y-4 relative overflow-hidden"
            >
              
              {/* Top Bar with Priority & AI Scores */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#FF5A36] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200/60">
                    {report.report_reference}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200/60">
                    {report.investigation_priority}
                  </span>
                  <span className="text-xs text-slate-500">
                    {report.location} • {report.report_date}
                  </span>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Risk Score</span>
                    <div className="text-lg font-black font-mono text-rose-600">{report.risk_score} / 100</div>
                  </div>
                </div>
              </div>

              {/* Headline & Description */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {report.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-2 bg-[#FBF9F6] p-3.5 rounded-xl border border-[#EAE6E1]">
                  {report.description}
                </p>
              </div>

              {/* Key Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#FBF9F6] border border-[#EAE6E1] space-y-1">
                  <span className="text-[10px] font-bold text-rose-600 uppercase font-mono flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    High-Energy Vector
                  </span>
                  <div className="text-xs font-medium text-slate-800">{report.energy_source}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FBF9F6] border border-[#EAE6E1] space-y-1">
                  <span className="text-[10px] font-bold text-[#FF5A36] uppercase font-mono flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    Barrier Integrity State
                  </span>
                  <div className="text-xs font-medium text-slate-800">{report.barrier_status}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FBF9F6] border border-[#EAE6E1] space-y-1">
                  <span className="text-[10px] font-bold text-purple-600 uppercase font-mono flex items-center gap-1">
                    <AlertOctagon className="w-3 h-3" />
                    SIF Consequence Potential
                  </span>
                  <div className="text-xs font-medium text-rose-600 font-semibold">{report.sif_potential}</div>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-end text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedReport(report)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B4A] to-[#FF5A36] hover:from-[#ff5934] hover:to-[#e64a27] text-white font-bold text-xs shadow-md shadow-orange-500/20 shrink-0 cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <span>Examine SIF Barrier Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {selectedReport && (
        <FullAnalysisModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

    </div>
  );
}
