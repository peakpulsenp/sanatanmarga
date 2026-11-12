import React from "react";
import { FileText, CheckCircle2, AlertTriangle, HardDrive, Database } from "lucide-react";

interface AuditMetricsCardsProps {
  totalCount: number;
  publishedCount: number;
  draftCount: number;
  reviewCount: number;
  firestoreCount: number;
  snapshotCount: number;
  registryCount: number;
}

export default function AuditMetricsCards({
  totalCount,
  publishedCount,
  draftCount,
  reviewCount,
  firestoreCount,
  snapshotCount,
  registryCount
}: AuditMetricsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-5 rounded-2xl bg-card border border-border-theme space-y-1">
        <div className="text-[10px] font-black uppercase text-muted-text flex items-center justify-between">
          <span>A. Firestore Total</span>
          <Database size={14} className="text-primary" />
        </div>
        <div className="text-2xl font-black text-card-foreground">{firestoreCount}</div>
        <div className="text-[11px] text-muted-text font-medium">Firestore डकुमेन्टहरू</div>
      </div>

      <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
        <div className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
          <span>B. Published / Restored</span>
          <CheckCircle2 size={14} className="text-emerald-500" />
        </div>
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{publishedCount}</div>
        <div className="text-[11px] text-muted-text font-medium">सक्रिय प्रकाशित समाचार</div>
      </div>

      <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-1">
        <div className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 flex items-center justify-between">
          <span>C. Snapshot OS Feed</span>
          <HardDrive size={14} className="text-blue-500" />
        </div>
        <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{snapshotCount}</div>
        <div className="text-[11px] text-muted-text font-medium">होमपेज/क्यास फिड</div>
      </div>

      <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1">
        <div className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 flex items-center justify-between">
          <span>D. Drafts / Inactive</span>
          <AlertTriangle size={14} className="text-amber-500" />
        </div>
        <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{reviewCount + draftCount}</div>
        <div className="text-[11px] text-muted-text font-medium">ड्राफ्ट वा समीक्षाधीन</div>
      </div>
    </div>
  );
}
