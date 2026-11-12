import React, { useState, useEffect } from "react";
import { X, RefreshCw, Calendar, CheckCircle2, AlertTriangle, ShieldCheck, Clock, FileCode } from "lucide-react";
import { NewsroomFreshnessAudit, NewsroomFreshnessReport } from "@/src/services/newsroomFreshnessAudit";

interface NewsroomFreshnessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewsroomFreshnessModal({ isOpen, onClose }: NewsroomFreshnessModalProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<NewsroomFreshnessReport | null>(null);

  const runTest = async () => {
    setLoading(true);
    try {
      const result = await NewsroomFreshnessAudit.runLiveFreshnessRealityTest();
      setReport(result);
    } catch (e) {
      console.error("Failed to run newsroom freshness reality test:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runTest();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-950 border border-slate-800 text-slate-100 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Calendar size={26} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-3">
                <span>AI Newsroom Freshness Reality Gate</span>
                {report && (
                  <span className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    report.overallStatus === "PASS" 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}>
                    {report.overallStatus}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Strict Asia/Kathmandu Calendar Day Validation &amp; Source Timestamp Integrity
              </p>
            </div>
          </div>

          <button
            onClick={runTest}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-600/20 self-start md:self-auto"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Run Freshness Audit</span>
          </button>
        </div>

        {report && (
          <div className="space-y-6">
            {/* Top Stat Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Nepal Date</div>
                <div className="font-mono font-black text-amber-400 mt-1">
                  {report.nepalDate}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Timezone</div>
                <div className="font-mono font-black text-cyan-400 mt-1">
                  {report.timezone}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Stale → Gen</div>
                <div className="font-mono font-black text-emerald-400 mt-1">
                  {report.staleToGenerationCount}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Discovery Time Used</div>
                <div className="font-mono font-black text-emerald-400 mt-1">
                  {report.discoveryTimeUsedCount}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Temporal Violations</div>
                <div className="font-mono font-black text-emerald-400 mt-1">
                  {report.temporalViolationsCount}
                </div>
              </div>
            </div>

            {/* Matrix Formatted Output */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <FileCode size={14} className="text-amber-400" />
                  <span>SanatanMarga Newsroom Freshness Matrix</span>
                </h3>
                <span className="text-[10px] font-mono text-emerald-400">Strict Nepal Day Invariant Verified</span>
              </div>
              <pre className="bg-slate-950 border border-slate-800 text-amber-300 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
                {report.formattedMatrixText}
              </pre>
            </div>

            {/* Category Cards Breakdown */}
            <div className="space-y-3">
              <h3 className="font-black text-sm text-slate-200 flex items-center gap-2">
                <Clock size={16} className="text-amber-400" />
                <span>Category Freshness Gate Status</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.categorySummaries.map((cat) => (
                  <div key={cat.categorySlug} className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-black text-slate-100">{cat.categoryName}</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          cat.status === "OK" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {cat.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-[11px] text-slate-400 mt-2">
                        <div>
                          <div className="text-[9px] uppercase font-bold text-slate-400">Discovered</div>
                          <div className="font-mono font-bold text-slate-200">{cat.discovered}</div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase font-bold text-slate-400">Fresh</div>
                          <div className="font-mono font-bold text-emerald-400">{cat.fresh}</div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase font-bold text-slate-400">Stale</div>
                          <div className="font-mono font-bold text-red-400">{cat.stale}</div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase font-bold text-slate-400">Published</div>
                          <div className="font-mono font-bold text-cyan-400">{cat.publishedCount}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
