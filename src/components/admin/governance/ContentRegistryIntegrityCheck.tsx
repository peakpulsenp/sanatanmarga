import React from "react";
import { CheckCircle2, AlertTriangle, ShieldCheck, Database, HardDrive, ArrowRightLeft } from "lucide-react";

interface ContentRegistryIntegrityCheckProps {
  registryRecords: number;
  missingRegistryEntries: number;
  orphanFirestoreArticles: number;
  snapshotDrift: number;
  onSyncRegistry?: () => void;
  isSyncing?: boolean;
}

export default function ContentRegistryIntegrityCheck({
  registryRecords,
  missingRegistryEntries,
  orphanFirestoreArticles,
  snapshotDrift,
  onSyncRegistry,
  isSyncing = false
}: ContentRegistryIntegrityCheckProps) {
  const isHealthy = missingRegistryEntries === 0 && orphanFirestoreArticles === 0 && snapshotDrift === 0;

  return (
    <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-theme pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            <h3 className="text-sm font-black text-card-foreground uppercase tracking-wider">
              Content Registry Integrity Check (कन्टेन्ट रजिस्ट्री निष्ठा)
            </h3>
          </div>
          <p className="text-xs text-muted-text">
            `contentRegistry.ts` मार्फत सबै समाचारका भेरियन्ट र आईडी लक गरी "समाचार हराउने" समस्याको स्थायी रोकथाम।
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isHealthy ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Registry Lock Active (Zero Drift)
            </span>
          ) : (
            <button
              onClick={onSyncRegistry}
              disabled={isSyncing}
              className="px-3.5 py-1.5 rounded-xl bg-primary text-white font-black text-xs hover:bg-primary/90 flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <ArrowRightLeft size={14} className={isSyncing ? "animate-spin" : ""} />
              <span>{isSyncing ? "सिंक हुँदैछ..." : "Sync All to Registry"}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Registry Records */}
        <div className="p-4 rounded-2xl bg-muted-area/40 border border-border-theme space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">
            Registry Records
          </span>
          <div className="text-2xl font-black text-card-foreground">
            {registryRecords}
          </div>
          <p className="text-[10px] text-muted-text">कन्टेन्ट रजिस्ट्रीमा लक</p>
        </div>

        {/* Card 2: Missing Registry Entries */}
        <div className={`p-4 rounded-2xl border space-y-1 ${
          missingRegistryEntries > 0 ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-muted-area/40 border-border-theme"
        }`}>
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">
            Missing Registry Entries
          </span>
          <div className={`text-2xl font-black ${missingRegistryEntries > 0 ? "text-rose-500" : "text-emerald-500"}`}>
            {missingRegistryEntries}
          </div>
          <p className="text-[10px] text-muted-text">
            {missingRegistryEntries > 0 ? "रजिस्ट्रीमा दर्ता नभएका" : "सबै दर्ता प्रमाणित"}
          </p>
        </div>

        {/* Card 3: Orphan Firestore Articles */}
        <div className={`p-4 rounded-2xl border space-y-1 ${
          orphanFirestoreArticles > 0 ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-muted-area/40 border-border-theme"
        }`}>
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">
            Orphan Firestore Articles
          </span>
          <div className={`text-2xl font-black ${orphanFirestoreArticles > 0 ? "text-amber-500" : "text-emerald-500"}`}>
            {orphanFirestoreArticles}
          </div>
          <p className="text-[10px] text-muted-text">
            {orphanFirestoreArticles > 0 ? "अनाथ पाण्डुलिपि/अभिलेख" : "कुनै पनि अनाथ छैन"}
          </p>
        </div>

        {/* Card 4: Snapshot Drift */}
        <div className={`p-4 rounded-2xl border space-y-1 ${
          snapshotDrift > 0 ? "bg-sky-500/10 border-sky-500/20 text-sky-500" : "bg-muted-area/40 border-border-theme"
        }`}>
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">
            Snapshot Drift
          </span>
          <div className={`text-2xl font-black ${snapshotDrift > 0 ? "text-sky-500" : "text-emerald-500"}`}>
            {snapshotDrift}
          </div>
          <p className="text-[10px] text-muted-text">
            {snapshotDrift > 0 ? "संस्करण भिन्नता" : "०% क्यास ड्रिफ्ट"}
          </p>
        </div>
      </div>
    </div>
  );
}
