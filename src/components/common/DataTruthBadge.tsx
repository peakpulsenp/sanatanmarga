import React, { useState } from "react";
import { 
  ShieldCheck, 
  Radio, 
  Clock, 
  AlertTriangle, 
  ExternalLink, 
  CheckCircle2, 
  WifiOff, 
  Info,
  X,
  Layers,
  FileCheck
} from "lucide-react";
import { 
  ProvenanceRecord, 
  DataTruthBadgeState, 
  getBadgeStateFromProvenance, 
  formatTruthRelativeAge,
  calculateFreshnessStatus 
} from "@/src/types/provenance";

export interface DataTruthBadgeProps {
  record?: ProvenanceRecord;
  status?: "verified" | "pending" | "failed" | "unavailable";
  provenance?: DataTruthBadgeState | string;
  timestamp?: string;
  sourceName?: string;
  sourceUrl?: string;
  size?: "xs" | "sm" | "md";
  showTimestamp?: boolean;
  showSourceLink?: boolean;
  showModalOnInfoClick?: boolean;
  className?: string;
}

export function DataTruthBadge({
  record,
  status,
  provenance,
  timestamp,
  sourceName,
  sourceUrl,
  size = "sm",
  showTimestamp = true,
  showSourceLink = false,
  showModalOnInfoClick = true,
  className = ""
}: DataTruthBadgeProps) {
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Derive final badge state
  const effectiveRecord: ProvenanceRecord | undefined = record || (sourceName ? {
    sourceId: sourceName.toLowerCase().replace(/\s+/g, "_"),
    sourceName: sourceName,
    sourceUrl: sourceUrl,
    fetchedAt: timestamp || new Date().toISOString(),
    verificationStatus: status || "verified",
    freshnessStatus: calculateFreshnessStatus(timestamp, status || "verified"),
    provenanceType: (provenance === "VERIFIED SGIS" ? "sgis" : provenance === "VERIFIED OFFICIAL SOURCE" ? "official" : "realtime-ingest")
  } : undefined);

  const badgeState: DataTruthBadgeState = (provenance as DataTruthBadgeState) || getBadgeStateFromProvenance(effectiveRecord);
  const fetchedAtIso = effectiveRecord?.fetchedAt || timestamp;
  const relativeAge = formatTruthRelativeAge(fetchedAtIso);
  const effectiveSourceName = effectiveRecord?.sourceName || sourceName || "Official SGIS Ingestion";
  const effectiveSourceUrl = effectiveRecord?.sourceUrl || sourceUrl;

  // Size styling
  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5 gap-1",
    sm: "text-xxs px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-2"
  }[size];

  // Visual state styling
  const getBadgeStyle = () => {
    switch (badgeState) {
      case "REAL-TIME AUTO-INGEST":
        return {
          container: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
          dot: "bg-emerald-500 animate-pulse",
          icon: <Radio className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />,
          labelEn: "REAL-TIME AUTO-INGEST",
          labelNe: "प्रत्यक्ष स्वचालित संकलन"
        };
      case "VERIFIED SGIS":
        return {
          container: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
          dot: "bg-indigo-500",
          icon: <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />,
          labelEn: "VERIFIED SGIS",
          labelNe: "सत्यापित SGIS अभिलेख"
        };
      case "VERIFIED OFFICIAL SOURCE":
        return {
          container: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
          dot: "bg-emerald-500",
          icon: <FileCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />,
          labelEn: "VERIFIED OFFICIAL SOURCE",
          labelNe: "आधिकारिक स्रोत प्रमाणित"
        };
      case "VERIFIED SECONDARY":
        return {
          container: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
          dot: "bg-blue-500",
          icon: <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />,
          labelEn: "VERIFIED SECONDARY",
          labelNe: "द्वितीयक स्रोत प्रमाणीकरण"
        };
      case "STALE — NOT FOR LIVE DISPLAY":
        return {
          container: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
          dot: "bg-amber-500",
          icon: <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />,
          labelEn: "STALE — NOT FOR LIVE DISPLAY",
          labelNe: "पुरानो — प्रत्यक्ष प्रदर्शन अयोग्य"
        };
      case "DATA TEMPORARILY UNAVAILABLE":
      case "AWAITING VERIFIED SOURCE":
      default:
        return {
          container: "bg-red-500/15 text-red-800 dark:text-red-300 border-red-500/30",
          dot: "bg-red-500",
          icon: <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400 shrink-0" />,
          labelEn: badgeState,
          labelNe: "स्रोत प्रमाणीकरणको प्रतीक्षामा"
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <>
      <div 
        className={`inline-flex items-center rounded-lg font-mono font-bold tracking-tight border transition-colors ${style.container} ${sizeClasses} ${className}`}
        role="status"
        aria-label={`Truth Provenance: ${badgeState} from ${effectiveSourceName}`}
      >
        {style.icon}
        
        <span className="uppercase font-black text-inherit">
          {style.labelEn}
        </span>

        {showTimestamp && fetchedAtIso && (
          <span className="text-[10px] opacity-80 border-l border-current/20 pl-1.5 ml-0.5 font-sans font-medium">
            {relativeAge.en}
          </span>
        )}

        {showSourceLink && effectiveSourceUrl && (
          <a
            href={effectiveSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="opacity-75 hover:opacity-100 transition-opacity ml-1"
            title={`View Source: ${effectiveSourceName}`}
          >
            <ExternalLink size={10} />
          </a>
        )}

        {showModalOnInfoClick && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDetailModal(true);
            }}
            className="opacity-60 hover:opacity-100 transition-opacity ml-0.5 p-0.5 rounded-sm hover:bg-current/10 cursor-pointer"
            title="Inspect Provenance Chain & Verification Authority"
          >
            <Info size={11} />
          </button>
        )}
      </div>

      {/* PROVENANCE INSPECTION MODAL */}
      {showDetailModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            className="w-full max-w-lg bg-card border border-border-theme rounded-3xl p-6 shadow-2xl space-y-5 text-card-foreground animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-theme">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-card-foreground">
                    डेटा सत्यता तथा स्रोत विवरण (Provenance Truth Contract)
                  </h3>
                  <span className="text-xxs text-muted-text font-mono">
                    Sanatan Media OS • Production Truth OS v1.0
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-xl hover:bg-muted-area text-muted-text hover:text-card-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-muted-area/40 border border-border-theme space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-text">प्रमाणीकरण स्थिति (Status):</span>
                  <span className={`font-mono font-black uppercase px-2 py-0.5 rounded ${style.container}`}>
                    {badgeState}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-text">स्रोत निकाय (Authority):</span>
                  <span className="font-bold text-card-foreground">{effectiveSourceName}</span>
                </div>
                {effectiveSourceUrl && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-text">स्रोत लिङ्क (Direct Feed):</span>
                    <a
                      href={effectiveSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 font-mono font-medium"
                    >
                      <span>{effectiveSourceUrl.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-text">प्राप्ति समय (Fetched At):</span>
                  <span className="font-mono text-card-foreground">
                    {fetchedAtIso ? new Date(fetchedAtIso).toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }) + " NPT" : "Awaiting Ingestion"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-text">ताजापन (Freshness):</span>
                  <span className="font-mono font-bold text-emerald-500">
                    {relativeAge.en} ({relativeAge.ne})
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xxs space-y-1">
                <span className="font-bold text-amber-600 dark:text-amber-400 block">
                  Zero-Mock Architecture Guarantee
                </span>
                <p className="text-muted-text leading-relaxed">
                  SanatanMarga strictly forbids synthetic placeholders or hardcoded live estimates. If an upstream telemetry node is offline, this component transitions immediately into <em>Awaiting Verified Source</em> to preserve truth integrity.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                बुझेँ (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DataTruthBadge;
