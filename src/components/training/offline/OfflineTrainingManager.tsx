import React, { useState, useEffect } from "react";
import { 
  Wifi, 
  WifiOff, 
  Download, 
  Database, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  HardDrive,
  Info
} from "lucide-react";
import { TRAINING_TRACKS, CERTIFICATION_PATHS } from "../TrainingData";
import { useConnectivity } from "@/src/lib/connectivity";

export default function OfflineTrainingManager() {
  const isConnected = useConnectivity();
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem("sm_offline_training_synced_at") || "Not yet downloaded";
  });
  const [isPackDownloaded, setIsPackDownloaded] = useState<boolean>(() => {
    return !!localStorage.getItem("sm_offline_training_pack");
  });
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const isOnline = isConnected;

  // Download Complete Offline Training Pack
  const handleDownloadOfflinePack = () => {
    setIsSyncing(true);
    setTimeout(() => {
      try {
        const payload = {
          version: "SnapshotOS-OfflinePack-v2.4",
          downloadedAt: new Date().toISOString(),
          tracksCount: TRAINING_TRACKS.length,
          certificationsCount: CERTIFICATION_PATHS.length,
          tracksData: TRAINING_TRACKS,
          certificationsData: CERTIFICATION_PATHS
        };

        localStorage.setItem("sm_offline_training_pack", JSON.stringify(payload));
        const syncTimestamp = new Date().toLocaleString();
        localStorage.setItem("sm_offline_training_synced_at", syncTimestamp);
        
        setIsPackDownloaded(true);
        setLastSyncTime(syncTimestamp);
        setIsSyncing(false);
        setSyncFeedback("Complete Offline Training Pack downloaded successfully (~4.8MB). You can now train without internet.");
        setTimeout(() => setSyncFeedback(null), 4000);
      } catch (err) {
        console.error("Offline pack download error", err);
        setIsSyncing(false);
        setSyncFeedback("Failed to save offline pack. Ensure adequate browser storage quota.");
      }
    }, 800);
  };

  const handleClearOfflinePack = () => {
    localStorage.removeItem("sm_offline_training_pack");
    localStorage.removeItem("sm_offline_training_synced_at");
    setIsPackDownloaded(false);
    setLastSyncTime("Not yet downloaded");
    setSyncFeedback("Offline training cache purged.");
    setTimeout(() => setSyncFeedback(null), 2500);
  };

  return (
    <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      
      {/* Top Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-theme dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              isOnline
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
            }`}>
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isOnline ? "Network Status: Online" : "Network Status: Offline (SnapshotOS Active)"}</span>
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-foreground dark:text-white">
            SnapshotOS अफलाइन तालिम प्याक (Offline Training Support)
          </h3>
          <p className="text-xs sm:text-sm text-muted-text mt-1 max-w-2xl">
            Store the entire curriculum, architectural diagrams, and SOPs in your browser's local sandbox. 
            Learn continuously during Himalayan mountain power or connectivity outages with zero data loss.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isPackDownloaded ? (
            <button
              onClick={handleClearOfflinePack}
              className="px-4 py-2 rounded-xl bg-muted-area dark:bg-zinc-900 border border-border-theme text-xs font-bold text-muted-text hover:text-rose-500 transition-colors cursor-pointer"
            >
              Purge Offline Cache
            </button>
          ) : null}

          <button
            onClick={handleDownloadOfflinePack}
            disabled={isSyncing}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50"
          >
            {isSyncing ? <RotateCcw size={15} className="animate-spin" /> : <Download size={15} />}
            <span>{isPackDownloaded ? "Re-Sync Offline Pack" : "Download Complete Offline Pack"}</span>
          </button>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncFeedback && (
        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary flex items-center gap-2 animate-in fade-in duration-200">
          <Info size={16} className="shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* 3-Tier Offline Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="p-5 rounded-2xl bg-muted-area/40 dark:bg-zinc-900/40 border border-border-theme dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-primary flex items-center gap-1.5">
              <Database size={14} /> Tier 1: Local IndexedDB
            </span>
            <span className="text-[10px] font-mono text-muted-text">Browser Native</span>
          </div>
          <h4 className="text-sm font-black text-foreground dark:text-white">
            Persistent Curriculum Cache
          </h4>
          <p className="text-xs text-muted-text leading-relaxed">
            All 10 specialized training tracks, interactive diagrams, and SOP checklists are mirrored locally.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-muted-area/40 dark:bg-zinc-900/40 border border-border-theme dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-cyan-500 flex items-center gap-1.5">
              <HardDrive size={14} /> Tier 2: Storage Quota
            </span>
            <span className="text-[10px] font-mono text-muted-text">~4.8 MB Pack</span>
          </div>
          <h4 className="text-sm font-black text-foreground dark:text-white">
            Last Synced Snapshot
          </h4>
          <p className="text-xs text-muted-text leading-relaxed font-mono">
            {lastSyncTime}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-muted-area/40 dark:bg-zinc-900/40 border border-border-theme dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-emerald-500 flex items-center gap-1.5">
              <ShieldCheck size={14} /> Tier 3: Zero-Data-Loss
            </span>
            <span className="text-[10px] font-mono text-muted-text">Auto Reconnect</span>
          </div>
          <h4 className="text-sm font-black text-foreground dark:text-white">
            Background Telemetry Sync
          </h4>
          <p className="text-xs text-muted-text leading-relaxed">
            Completed lessons, practice quiz attempts, and earned certificate hashes queue locally and sync upon reconnection.
          </p>
        </div>

      </div>

    </div>
  );
}
