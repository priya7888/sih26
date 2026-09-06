import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  Download, 
  ChevronRight, 
  MapPin, 
  FileText,
  Sparkles,
  X,
  Database,
  Calendar
} from 'lucide-react';
import { api } from '../../services/api';

export default function AllReportsView({ onSelectReport }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSif, setFilterSif] = useState('ALL'); // 'ALL', 'SIF_ONLY', 'NON_SIF'

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.getReports();
      setReports(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    const isSIF = r.sif_precursor_assessment === 'YES';
    
    // Filter SIF vs Non-SIF
    if (filterSif === 'SIF_ONLY' && !isSIF) return false;
    if (filterSif === 'NON_SIF' && isSIF) return false;

    // Search query
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.report_reference?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.location?.toLowerCase().includes(q) ||
      r.identified_hazard?.toLowerCase().includes(q) ||
      r.report_type?.toLowerCase().includes(q)
    );
  });

  const sifCount = reports.filter(r => r.sif_precursor_assessment === 'YES').length;
  const nonSifCount = reports.length - sifCount;

  // Export CSV functionality
  const handleExportCSV = () => {
    if (filteredReports.length === 0) return;
    const headers = ['Reference', 'Date', 'Location', 'Type', 'SIF Classification', 'Hazard', 'Description'];
    const rows = filteredReports.map(r => [
      `"${r.report_reference || ''}"`,
      `"${r.report_date || ''}"`,
      `"${r.location || ''}"`,
      `"${r.report_type || ''}"`,
      `"${r.sif_precursor_assessment === 'YES' ? 'SIF POTENTIAL' : 'NON-SIF'}"`,
      `"${(r.identified_hazard || '').replace(/"/g, '""')}"`,
      `"${(r.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SafetyAI_Reports_${filterSif}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-32 flex flex-col items-center justify-center space-y-4 select-none">
        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin shadow-lg shadow-amber-500/20" />
        <p className="text-base text-white font-bold tracking-tight font-heading">
          Loading Safety Intelligence Registry...
        </p>
        <p className="text-xs text-slate-400 font-mono">
          Querying all ingested historical & real-time observations
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 select-none">
      
      {/* 1. Header / Registry Hero Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#0C1222]/90 backdrop-blur-2xl border border-slate-800/90 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading">
                  Safety Reports & Precursor Triage Registry
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono font-bold border border-blue-500/30">
                  {reports.length} Records Verified
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                Full ledger of field observations, near-misses, and AI SIF precursor determinations.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filteredReports.length === 0}
          className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold border border-slate-800 hover:border-slate-700 flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-xs disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Export Filtered CSV ({filteredReports.length})</span>
        </button>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="p-6 rounded-3xl bg-[#0C1222]/90 backdrop-blur-2xl border border-slate-800/90 shadow-xl space-y-4">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search reports by ID (e.g. REP-ID001), site, hazard type, or narrative keywords..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-950/90 text-xs sm:text-sm text-white placeholder-slate-500 rounded-xl border border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-medium transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs: ALL, SIF POTENTIAL, NON-SIF */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterSif('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterSif === 'ALL'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              All Ingested Records ({reports.length})
            </button>

            <button
              onClick={() => setFilterSif('SIF_ONLY')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                filterSif === 'SIF_ONLY'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Potential SIF Precursors ({sifCount})</span>
            </button>

            <button
              onClick={() => setFilterSif('NON_SIF')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                filterSif === 'NON_SIF'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Non-SIF Observations ({nonSifCount})</span>
            </button>
          </div>

          <span className="text-xs font-mono text-slate-400">
            Displaying <strong className="text-white font-bold">{filteredReports.length}</strong> matching observations
          </span>
        </div>

      </div>

      {/* 3. Reports Registry Table */}
      <div className="rounded-3xl bg-[#0C1222]/90 backdrop-blur-2xl border border-slate-800/90 shadow-xl overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-base font-bold text-slate-200">No safety records matched your criteria.</p>
            <button
              onClick={() => { setFilterSif('ALL'); setSearchTerm(''); }}
              className="text-xs font-bold text-amber-400 hover:underline cursor-pointer"
            >
              Reset search query and category filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="p-4">Reference & Date</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 w-96">Observation Narrative</th>
                  <th className="p-4">AI SIF Verdict</th>
                  <th className="p-4">Identified Hazard</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredReports.map((r) => {
                  const isSIF = r.sif_precursor_assessment === 'YES';

                  return (
                    <tr
                      key={r.id}
                      onClick={() => onSelectReport(r)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="p-4 font-mono">
                        <div className="font-bold text-amber-400 group-hover:underline flex items-center gap-1.5">
                          <span>{r.report_reference}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{r.report_date || '2026-09-06'}</span>
                        </div>
                        {r.location && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate max-w-[140px]">
                            <MapPin className="w-3 h-3 text-slate-600" />
                            <span>{r.location}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold border ${
                          r.raw_type === 'NEAR_MISS' || r.report_type?.includes('Near')
                            ? 'bg-purple-950/60 text-purple-300 border-purple-800/50'
                            : r.raw_type === 'UNSAFE_ACT' || r.report_type?.includes('Act')
                            ? 'bg-blue-950/60 text-blue-300 border-blue-800/50'
                            : 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                        }`}>
                          {r.report_type || 'Near-Miss'}
                        </span>
                      </td>

                      <td className="p-4 max-w-sm">
                        <p className="line-clamp-2 text-slate-300 leading-relaxed font-medium">
                          {r.description}
                        </p>
                      </td>

                      <td className="p-4">
                        {isSIF ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] border border-amber-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                            <span>SIF POTENTIAL</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/40">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>NON-SIF</span>
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-slate-300 max-w-xs truncate font-mono text-[11px]">
                        {r.identified_hazard || 'Pending Analysis'}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectReport(r);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-400 text-amber-400 hover:text-slate-950 border border-amber-500/30 font-bold text-xs transition-all cursor-pointer"
                        >
                          Full Analysis →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
