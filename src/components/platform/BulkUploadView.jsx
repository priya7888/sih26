import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  ShieldCheck, 
  Play, 
  Check, 
  ArrowRight,
  RefreshCw,
  FileText,
  Clock,
  Sparkles,
  Layers,
  Database,
  Cpu
} from 'lucide-react';

export default function BulkUploadView({ onSelectReport, onOpenAllReports }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Sample batch ingestion records
  const sampleBatchResults = [
    {
      id: 101,
      ref: 'OIL-BATCH-01',
      date: '2026-09-06',
      site: 'Drill Floor Rig 9 (Moran Deep)',
      type: 'NEAR_MISS',
      desc: 'Rotary table spinning chain caught on glove during connection makeup. Drill console emergency brake hit within 1 second.',
      isSIF: true,
      conf: 95.1,
      hazard: 'Kinetic Dynamic Mechanical Hazard'
    },
    {
      id: 102,
      ref: 'OIL-BATCH-02',
      date: '2026-09-06',
      site: 'Bay 2 Heavy Fabrication',
      type: 'UNSAFE_CONDITION',
      desc: 'Acetylene cutting cylinder stored horizontally without safety cap in welding staging yard.',
      isSIF: true,
      conf: 91.8,
      hazard: 'Compressed Flammable Gas Cylinder Hazard'
    },
    {
      id: 103,
      ref: 'OIL-BATCH-03',
      date: '2026-09-05',
      site: 'Wellhead Pad-4 Gathering Station',
      type: 'UNSAFE_CONDITION',
      desc: 'Minor oil drip from sample cock valve nipple onto concrete drip pan. Containment intact.',
      isSIF: false,
      conf: 89.2,
      hazard: 'Routine Environmental Housekeeping'
    },
    {
      id: 104,
      ref: 'OIL-BATCH-04',
      date: '2026-09-05',
      site: 'Gas Sweetening Plant',
      type: 'NEAR_MISS',
      desc: 'Contractor scaffold plank shifted 4 inches under worker foot at 6m elevation due to loose tie-wire.',
      isSIF: true,
      conf: 93.6,
      hazard: 'Fall from Elevation (>1.8m)'
    },
    {
      id: 105,
      ref: 'OIL-BATCH-05',
      date: '2026-09-04',
      site: 'Central Warehouse Yard',
      type: 'UNSAFE_ACT',
      desc: 'Forklift operator driving with empty pallet raised 1.5m off ground during transport across yard.',
      isSIF: false,
      conf: 87.0,
      hazard: 'Vehicle Operation Procedure Deviation'
    }
  ];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadComplete(false);
      setProgress(0);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadComplete(false);
      setProgress(0);
    }
  };

  const handleSimulateBatchAnalysis = () => {
    if (!selectedFile) {
      // Pick default sample file if none selected
      setSelectedFile({ name: 'OIL_Historical_Safety_Observations_Q3.csv', size: 245000 });
    }

    setIsProcessing(true);
    setProgress(10);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setUploadComplete(true);
          return 100;
        }
        return prev + 18;
      });
    }, 300);
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 select-none">
      
      {/* 1. Header / Ingestion Pipeline Hero Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#0C1222]/90 backdrop-blur-2xl border border-slate-800/90 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading">
                  Bulk Historical Reports Ingestion Pipeline
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono font-bold border border-blue-500/30">
                  Batch NLP Engine
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                Upload historical Unsafe Act, Unsafe Condition, or Near-Miss CSV registries for automated batch SIF triage.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800 shrink-0">
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span>Max file size: 50 MB (CSV, TSV)</span>
        </div>
      </div>

      {/* 2. Visual Pipeline Flow Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#0C1222]/80 border border-slate-800/90 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-bold text-xs shrink-0">
            01
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              1. CSV Data Ingestion
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Auto-detects reference IDs, observation text, incident dates, and site locations.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0C1222]/80 border border-slate-800/90 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono font-bold text-xs shrink-0">
            02
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              2. Batch NLP Parsing
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Concurrent extraction of energy vectors, mechanical forces, and physical barrier states.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0C1222]/80 border border-slate-800/90 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs shrink-0">
            03
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              3. AI Precursor Triage
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Calibrated classification against the 20-25% SIF fatality precursor benchmark.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Drag & Drop Upload Zone */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-10 sm:p-12 rounded-3xl backdrop-blur-2xl transition-all duration-200 text-center space-y-5 relative border-2 border-dashed ${
          isDragging
            ? 'bg-[#0A1628] border-amber-400 shadow-2xl shadow-amber-500/20 scale-[1.01]'
            : selectedFile
            ? 'bg-[#0C1222]/95 border-amber-500/50 shadow-xl'
            : 'bg-[#0C1222]/90 border-slate-700/80 hover:border-amber-500/60 shadow-xl'
        }`}
      >
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileChange} 
          className="absolute inset-0 opacity-0 cursor-pointer z-10"
        />

        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transition-transform duration-200 ${
          selectedFile 
            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 scale-105 shadow-lg shadow-amber-500/15'
            : 'bg-slate-900 border border-slate-700/80 text-amber-400 shadow-md'
        }`}>
          <FileSpreadsheet className="w-8 h-8" />
        </div>

        <div className="space-y-1.5 max-w-lg mx-auto">
          <h3 className="text-base sm:text-lg font-bold text-white">
            {selectedFile ? selectedFile.name : 'Drag and drop your historical CSV file here'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {selectedFile 
              ? `${(selectedFile.size / 1024).toFixed(1)} KB • File loaded and validated for batch processing` 
              : 'or click to browse from local computer (standard HSSE column headers auto-mapped)'}
          </p>
        </div>

        <div className="pt-2 flex justify-center gap-3 relative z-20">
          <button
            type="button"
            onClick={handleSimulateBatchAnalysis}
            disabled={isProcessing}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2 hover:scale-[1.02] active:scale-98"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Executing Batch Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Start Batch AI Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Batch Progress Bar */}
      {isProcessing && (
        <div className="p-6 rounded-3xl bg-[#0C1222]/95 backdrop-blur-2xl border border-slate-800 shadow-xl space-y-3 animate-in fade-in">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Multi-Core NLP Extraction & SIF Precursor Classification...</span>
            </span>
            <span className="font-bold text-amber-400 font-mono text-sm">{progress}%</span>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div 
              className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 h-full rounded-full transition-all duration-300 shadow-xs shadow-amber-500/30" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      )}

      {/* 5. Batch Processing Results Summary */}
      {uploadComplete && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Summary Stat Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#0C1222]/90 backdrop-blur-2xl border border-slate-800 shadow-xl space-y-1">
              <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Total Ingested</span>
              <strong className="text-2xl sm:text-3xl font-black text-white font-mono">150</strong>
              <span className="text-[11px] text-slate-500 font-mono block">100% Parsed Without Error</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#0C1222]/90 backdrop-blur-2xl border border-amber-500/40 shadow-xl shadow-amber-500/5 space-y-1">
              <span className="text-xs text-amber-400 font-mono uppercase tracking-wider font-bold block">SIF Precursors</span>
              <strong className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">36 (24.0%)</strong>
              <span className="text-[11px] text-amber-300/80 font-mono block">Aligned with 20-25% Target</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#0C1222]/90 backdrop-blur-2xl border border-emerald-500/40 shadow-xl shadow-emerald-500/5 space-y-1">
              <span className="text-xs text-emerald-400 font-mono uppercase tracking-wider font-bold block">Non-SIF Observations</span>
              <strong className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">114 (76.0%)</strong>
              <span className="text-[11px] text-emerald-300/80 font-mono block">Low-Energy Routine Hazards</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#0C1222]/90 backdrop-blur-2xl border border-slate-800 shadow-xl space-y-1">
              <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Execution Time</span>
              <strong className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">1.8s</strong>
              <span className="text-[11px] text-slate-500 font-mono block">Throughput: ~83.3 records/sec</span>
            </div>
          </div>

          {/* Table Preview of Ingested Batch */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0C1222]/90 backdrop-blur-2xl border border-slate-800/90 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-heading">
                  Batch Analysis Sample Preview
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any row to display the full explainable AI diagnostic dossier.
                </p>
              </div>

              <button
                onClick={onOpenAllReports}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800 hover:border-amber-500/40 transition-all self-start sm:self-auto"
              >
                <span>View All In Historical Registry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="p-3.5">Reference & Date</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 w-80">Free-Text Observation</th>
                    <th className="p-3.5">AI SIF Verdict</th>
                    <th className="p-3.5">Confidence</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {sampleBatchResults.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => onSelectReport({
                        id: item.id,
                        report_reference: item.ref,
                        report_date: item.date,
                        location: item.site,
                        report_type: item.type,
                        description: item.desc,
                        sif_precursor_assessment: item.isSIF ? 'YES' : 'NO',
                        identified_hazard: item.hazard
                      })}
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="p-3.5 font-mono">
                        <div className="font-bold text-amber-400 group-hover:underline">
                          {item.ref}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {item.date}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 text-[10px] font-mono font-semibold border border-slate-800">
                          {item.type.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-3.5 max-w-sm">
                        <p className="line-clamp-2 text-slate-300 leading-relaxed font-medium">
                          {item.desc}
                        </p>
                      </td>

                      <td className="p-3.5">
                        {item.isSIF ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] border border-amber-500/40">
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

                      <td className="p-3.5 font-mono font-bold text-slate-300">
                        {item.conf}%
                      </td>

                      <td className="p-3.5 text-right">
                        <button className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-400 text-amber-400 hover:text-slate-950 font-bold text-[11px] border border-amber-500/30 transition-all cursor-pointer">
                          Inspect →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
