import React from "react";
import { CheckCircle2, AlertCircle, RefreshCw, Layers, Sparkles } from "lucide-react";

interface AuditDiagnosticPanelProps {
  nonStandardStatusCount: number;
  unmappedCategoryCount: number;
  isSnapshotStale: boolean;
  onFixAll: () => void;
  actionLoading: boolean;
}

export default function AuditDiagnosticPanel({
  nonStandardStatusCount,
  unmappedCategoryCount,
  isSnapshotStale,
  onFixAll,
  actionLoading
}: AuditDiagnosticPanelProps) {
  const hasIssues = nonStandardStatusCount > 0 || unmappedCategoryCount > 0 || isSnapshotStale;

  return (
    <div className={`p-5 rounded-2xl border ${hasIssues ? "bg-amber-500/5 border-amber-500/30" : "bg-emerald-500/5 border-emerald-500/30"} space-y-4`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {hasIssues ? (
            <AlertCircle size={20} className="text-amber-500 shrink-0" />
          ) : (
            <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
          )}
          <div>
            <h3 className="text-sm font-black text-card-foreground">
              {hasIssues ? "Delivery Pipeline Diagnostics Alert" : "All Delivery Layers Synchronized & Healthy"}
            </h3>
            <p className="text-xs text-muted-text">
              {hasIssues 
                ? "Restored articles may be hidden due to status, category mismatch, or stale snapshot cache."
                : "Firestore, Snapshot OS, Category Normalizer, and Content Registry are fully in sync."}
            </p>
          </div>
        </div>

        {hasIssues && (
          <button
            onClick={onFixAll}
            disabled={actionLoading}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer shrink-0 transition-all"
          >
            <Sparkles size={14} />
            <span>Auto-Repair All Issues</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-card border border-border-theme flex items-center gap-3">
          <div className={`p-2 rounded-lg ${nonStandardStatusCount > 0 ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"}`}>
            <Layers size={16} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-card-foreground">1. Article Status Check</div>
            <div className="text-[10px] text-muted-text">
              {nonStandardStatusCount > 0 ? `${nonStandardStatusCount} articles need standardizing` : "All statuses valid"}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border-theme flex items-center gap-3">
          <div className={`p-2 rounded-lg ${unmappedCategoryCount > 0 ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"}`}>
            <Layers size={16} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-card-foreground">2. Category Normalization</div>
            <div className="text-[10px] text-muted-text">
              {unmappedCategoryCount > 0 ? `${unmappedCategoryCount} articles need category mapping` : "All categories mapped"}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border-theme flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isSnapshotStale ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"}`}>
            <RefreshCw size={16} className={isSnapshotStale ? "animate-spin" : ""} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-card-foreground">3. Snapshot Freshness</div>
            <div className="text-[10px] text-muted-text">
              {isSnapshotStale ? "Rebuild required to sync" : "Active & fresh"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
