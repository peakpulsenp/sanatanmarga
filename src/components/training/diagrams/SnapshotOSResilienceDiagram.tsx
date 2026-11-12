import React, { useState } from "react";
import { 
  Database, 
  HardDrive, 
  FileArchive, 
  RefreshCw, 
  CheckCircle2, 
  Wifi, 
  WifiOff, 
  Layers,
  ArrowDown
} from "lucide-react";

interface ResilienceTier {
  tier: number;
  name: string;
  nameNepali: string;
  source: string;
  latency: string;
  offlineCapable: boolean;
  color: string;
  accentBg: string;
  description: string;
  role: string;
}

const TIERS: ResilienceTier[] = [
  {
    tier: 1,
    name: "Primary Real-Time Firestore",
    nameNepali: "प्राथमिक क्लाउड फायरस्टोर",
    source: "Google Cloud Firestore Distributed DB",
    latency: "< 80ms",
    offlineCapable: false,
    color: "text-amber-500",
    accentBg: "bg-amber-500/10 border-amber-500/30",
    description: "Live real-time bidirectional subscriptions for breaking stories, live audio manifests, and active comments.",
    role: "Normal operations with high-speed internet connectivity."
  },
  {
    tier: 2,
    name: "Secondary IndexedDB / CacheOS",
    nameNepali: "दोस्रो स्थानीय क्यास (IndexedDB)",
    source: "Browser Client IndexedDB & ServiceWorker Cache",
    latency: "< 5ms",
    offlineCapable: true,
    color: "text-blue-500",
    accentBg: "bg-blue-500/10 border-blue-500/30",
    description: "Client-side indexed cache storing up to 100 recent articles, audio loops, and user preferences locally.",
    role: "Engages when user is in the Himalayan mountain regions, planes, or intermittent 2G/3G networks."
  },
  {
    tier: 3,
    name: "Immutable Static Snapshot JSON",
    nameNepali: "तेस्रो अपरिवर्तनीय स्थिर स्न्यापसट",
    source: "Edge CDN pre-rendered /snapshots/snapshot_latest.json",
    latency: "< 15ms",
    offlineCapable: true,
    color: "text-emerald-500",
    accentBg: "bg-emerald-500/10 border-emerald-500/30",
    description: "Emergency read-only failover archive regenerated every 15 minutes. Guarantees 100% uptime even if database is paused.",
    role: "Disaster recovery, high-traffic surge absorption, and zero-downtime database maintenance."
  }
];

export default function SnapshotOSResilienceDiagram() {
  const [simulatedNetwork, setSimulatedNetwork] = useState<"online" | "intermittent" | "offline">("online");

  return (
    <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-theme dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            <RefreshCw size={14} /> High-Availability Infrastructure
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground dark:text-white mt-1">
            SnapshotOS 3-Tier Failover Architecture
          </h3>
          <p className="text-xs sm:text-sm text-muted-text dark:text-zinc-400 mt-1">
            How SanatanMarga achieves 99.99% uptime and zero-blank-screen reliability across Nepal.
          </p>
        </div>

        {/* Network Simulator Toggle */}
        <div className="flex items-center bg-muted-area dark:bg-zinc-900 p-1 rounded-xl border border-border-theme dark:border-zinc-800">
          <button
            onClick={() => setSimulatedNetwork("online")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              simulatedNetwork === "online" 
                ? "bg-emerald-500 text-white shadow-sm" 
                : "text-muted-text hover:text-foreground"
            }`}
          >
            <Wifi size={13} /> Cloud 4G/5G
          </button>
          <button
            onClick={() => setSimulatedNetwork("intermittent")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              simulatedNetwork === "intermittent" 
                ? "bg-amber-500 text-white shadow-sm" 
                : "text-muted-text hover:text-foreground"
            }`}
          >
            <Layers size={13} /> 2G Edge
          </button>
          <button
            onClick={() => setSimulatedNetwork("offline")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              simulatedNetwork === "offline" 
                ? "bg-rose-500 text-white shadow-sm" 
                : "text-muted-text hover:text-foreground"
            }`}
          >
            <WifiOff size={13} /> Offline
          </button>
        </div>
      </div>

      {/* 3 Tier Stack Visualizer */}
      <div className="space-y-4 my-6">
        {TIERS.map((tier) => {
          const isPrimaryInSim = 
            (simulatedNetwork === "online" && tier.tier === 1) ||
            (simulatedNetwork === "intermittent" && tier.tier === 2) ||
            (simulatedNetwork === "offline" && tier.tier === 3);

          return (
            <div 
              key={tier.tier}
              className={`p-5 rounded-2xl border transition-all ${
                isPrimaryInSim 
                  ? `${tier.accentBg} ring-2 ring-primary/40 shadow-lg scale-[1.01]` 
                  : "bg-muted-area/40 dark:bg-zinc-900/40 border-border-theme dark:border-zinc-800 opacity-60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className={`p-3 rounded-xl bg-card dark:bg-zinc-800 ${tier.color} shadow-sm`}>
                    {tier.tier === 1 && <Database size={22} />}
                    {tier.tier === 2 && <HardDrive size={22} />}
                    {tier.tier === 3 && <FileArchive size={22} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-muted-text">Tier 0{tier.tier}</span>
                      <h4 className="text-base font-black text-foreground dark:text-white">
                        {tier.name}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                        {tier.nameNepali}
                      </span>
                    </div>
                    <p className="text-xs text-muted-text dark:text-zinc-400 mt-0.5">
                      {tier.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-muted-text block uppercase font-mono">Access Latency</span>
                    <span className="text-xs font-black text-foreground dark:text-white font-mono">{tier.latency}</span>
                  </div>
                  {isPrimaryInSim && (
                    <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-bold animate-pulse">
                      Active Responder
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Disaster Recovery Guarantee */}
      <div className="bg-muted-area/60 dark:bg-zinc-900/60 border border-border-theme dark:border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
          <span className="text-xs text-muted-text dark:text-zinc-300">
            <strong className="text-foreground dark:text-white">Zero Blank Screen Guarantee: </strong> 
            If Firebase has an outage or network drops, SnapshotOS automatically falls back to static CDN json and local storage seamlessly without throwing React errors.
          </span>
        </div>
        <div className="text-xs font-mono text-muted-text shrink-0">
          Fallback strategy: Stale-While-Revalidate
        </div>
      </div>
    </div>
  );
}
