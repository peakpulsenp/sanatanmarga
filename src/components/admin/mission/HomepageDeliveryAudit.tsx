import React from "react";
import { CheckCircle2, AlertTriangle, RefreshCw, Radio, Layers, Database, Globe } from "lucide-react";

interface HomepageDeliveryAuditProps {
  firestorePublished: number;
  snapshotPublished: number;
  homepageRendered: number;
  onForceSync?: () => void;
  isSyncing?: boolean;
}

export default function HomepageDeliveryAudit({
  firestorePublished,
  snapshotPublished,
  homepageRendered,
  onForceSync,
  isSyncing = false
}: HomepageDeliveryAuditProps) {
  // Integrity is verified if Snapshot count and Homepage count match Firestore published count
  const isHealthy = firestorePublished > 0 && 
    snapshotPublished >= firestorePublished && 
    homepageRendered >= firestorePublished;

  const isStale = !isHealthy && (snapshotPublished < firestorePublished || homepageRendered < snapshotPublished);

  return (
    <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-theme pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Radio size={18} className={isHealthy ? "text-emerald-500" : "text-amber-500"} />
            <h3 className="text-sm font-black text-card-foreground uppercase tracking-wider">
              Homepage Delivery Audit (डेलिभरी निष्ठा अडिट)
            </h3>
          </div>
          <p className="text-xs text-muted-text">
            Firestore DB, Edge Snapshot OS र प्रत्यक्ष गृहपृष्ठ बीच ०% डेटा ड्रिफ्ट प्रमाणीकरण।
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isHealthy ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-black flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Full Synchronization (100% Green)
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-black flex items-center gap-1.5">
                <AlertTriangle size={14} /> Snapshot Drift Detected
              </span>
              {onForceSync && (
                <button
                  onClick={onForceSync}
                  disabled={isSyncing}
                  className="px-3 py-1 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                  <span>{isSyncing ? "सिंक..." : "Force Sync"}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Firestore Published */}
        <div className="p-4 rounded-2xl bg-muted-area/40 border border-border-theme space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-text flex items-center gap-1.5">
              <Database size={13} className="text-amber-500" /> Firestore Published
            </span>
            <span className="text-[10px] font-mono text-muted-text font-bold">Tier 3 (DB)</span>
          </div>
          <div className="text-2xl font-black text-card-foreground">
            {firestorePublished}
          </div>
          <p className="text-[10px] text-muted-text">अभिलेखालयमा सुरक्षित समाचार</p>
        </div>

        {/* Metric 2: Snapshot Published */}
        <div className="p-4 rounded-2xl bg-muted-area/40 border border-border-theme space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-text flex items-center gap-1.5">
              <Layers size={13} className="text-sky-500" /> Snapshot Published
            </span>
            <span className="text-[10px] font-mono text-muted-text font-bold">Tier 1 (Edge)</span>
          </div>
          <div className={`text-2xl font-black ${
            snapshotPublished >= firestorePublished ? "text-emerald-500" : "text-amber-500"
          }`}>
            {snapshotPublished}
          </div>
          <p className="text-[10px] text-muted-text">
            {snapshotPublished >= firestorePublished ? "क्यासमा उपलब्ध (2ms)" : "क्यास अपडेट आवश्यक"}
          </p>
        </div>

        {/* Metric 3: Homepage Rendered */}
        <div className="p-4 rounded-2xl bg-muted-area/40 border border-border-theme space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-text flex items-center gap-1.5">
              <Globe size={13} className="text-emerald-500" /> Homepage Rendered
            </span>
            <span className="text-[10px] font-mono text-muted-text font-bold">Live Reader View</span>
          </div>
          <div className={`text-2xl font-black ${
            homepageRendered >= firestorePublished ? "text-emerald-500" : "text-amber-500"
          }`}>
            {homepageRendered}
          </div>
          <p className="text-[10px] text-muted-text">
            {homepageRendered >= firestorePublished ? "सबै विधामा प्रत्यक्ष दृश्य" : "केही समाचार विधामा छुटेको हुन सक्छ"}
          </p>
        </div>
      </div>
    </div>
  );
}
