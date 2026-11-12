import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, RefreshCw, CheckCircle2, Zap } from "lucide-react";

interface AuditHeaderActionsProps {
  actionLoading: boolean;
  onPurgeAndRebuild: () => void;
  onStandardizeStatuses: () => void;
  onSyncRegistry: () => void;
}

export default function AuditHeaderActions({
  actionLoading,
  onPurgeAndRebuild,
  onStandardizeStatuses,
  onSyncRegistry
}: AuditHeaderActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Link to="/admin" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <ArrowLeft size={14} /> Admin
          </Link>
          <span className="text-muted-text">•</span>
          <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck size={12} /> Newsroom Diagnostics
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-card-foreground">
          Content Recovery & Snapshot Audit
        </h1>
        <p className="text-xs md:text-sm text-muted-text">
          Firestore, Snapshot OS, Category Normalization, र Content Registry को प्रत्यक्ष स्थिति जाँच।
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onSyncRegistry}
          disabled={actionLoading}
          className="px-3 py-2 rounded-xl bg-card hover:bg-muted-area text-xs font-bold flex items-center gap-1.5 border border-border-theme cursor-pointer transition-all shadow-sm"
          title="Sync all Firestore records to Registry"
        >
          <Zap size={14} className="text-amber-500" />
          <span>Sync Registry</span>
        </button>

        <button
          onClick={onStandardizeStatuses}
          disabled={actionLoading}
          className="px-3.5 py-2 rounded-xl bg-muted-area hover:bg-muted-area/80 text-xs font-bold flex items-center gap-1.5 border border-border-theme cursor-pointer transition-all"
          title="Batch fix all restored/approved statuses to published"
        >
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span>Normalize Statuses</span>
        </button>

        <button
          onClick={onPurgeAndRebuild}
          disabled={actionLoading}
          className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-primary/90 flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer transition-all"
        >
          <RefreshCw size={14} className={actionLoading ? "animate-spin" : ""} />
          <span>1-Click Rebuild & Purge</span>
        </button>
      </div>
    </div>
  );
}
