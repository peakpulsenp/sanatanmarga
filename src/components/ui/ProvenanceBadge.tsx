import React, { useState } from "react";
import { CheckCircle2, TrendingUp, AlertTriangle, Info, HelpCircle, Database } from "lucide-react";
import { MetricClassification, MetricStatus, getMetricDefinition } from "@/src/services/dataDictionaryOS";

interface ProvenanceBadgeProps {
  type?: MetricClassification;
  metricId?: string;
  source?: string;
  calculation?: string;
  collection?: string;
  note?: string;
  status?: MetricStatus;
  size?: "sm" | "md";
  showTooltip?: boolean;
}

export default function ProvenanceBadge({
  type,
  metricId,
  source,
  calculation,
  collection,
  note,
  status,
  size = "sm",
  showTooltip = true
}: ProvenanceBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  // If a metricId is provided, pull canonical definition
  const def = metricId ? getMetricDefinition(metricId) : null;
  const effectiveType: MetricClassification = type || def?.type || "unconfigured";
  const effectiveSource = source || def?.source || "Unknown Source";
  const effectiveCalc = calculation || def?.calculation || "";
  const effectiveCollection = collection || def?.collection || "";
  const effectiveNote = note || def?.provenanceNote || "";
  const effectiveStatus = status || def?.status || "active";

  const sizeClasses = size === "sm" 
    ? "text-[10px] px-2 py-0.5" 
    : "text-xs px-2.5 py-1";

  const renderBadgeContent = () => {
    if (effectiveStatus === "not_configured" || effectiveType === "unconfigured") {
      return (
        <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 ${sizeClasses}`}>
          <Info size={11} className="text-slate-400" />
          <span>Tracking Not Configured</span>
        </span>
      );
    }

    if (effectiveStatus === "insufficient_data") {
      return (
        <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 ${sizeClasses}`}>
          <AlertTriangle size={11} className="text-rose-500" />
          <span>Insufficient Data</span>
        </span>
      );
    }

    if (effectiveType === "measured") {
      return (
        <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}>
          <CheckCircle2 size={11} className="text-emerald-500" />
          <span>✓ Measured</span>
        </span>
      );
    }

    if (effectiveType === "estimated") {
      return (
        <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 ${sizeClasses}`}>
          <span className="font-mono text-[11px]">≈</span>
          <span>Estimated</span>
        </span>
      );
    }

    // Projected
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 ${sizeClasses}`}>
        <TrendingUp size={11} className="text-indigo-500" />
        <span>↗ Projected</span>
      </span>
    );
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => showTooltip && setIsOpen(true)}
        onMouseLeave={() => showTooltip && setIsOpen(false)}
        className="focus:outline-none transition-transform hover:scale-105 cursor-pointer"
        title="View metric provenance & data source"
      >
        {renderBadgeContent()}
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 bottom-full left-0 mb-2 w-72 p-3 bg-popover text-popover-foreground rounded-2xl shadow-xl border border-border text-left space-y-2 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              Data Provenance
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-accent text-foreground">
              {effectiveType.toUpperCase()}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div>
              <span className="text-muted-foreground text-[10px] block">Source:</span>
              <span className="font-semibold text-foreground flex items-center gap-1">
                <Database size={11} className="text-primary" />
                {effectiveSource}
              </span>
            </div>

            {effectiveCollection && (
              <div>
                <span className="text-muted-foreground text-[10px] block">Collection / Entity:</span>
                <code className="text-[10px] bg-accent/60 px-1.5 py-0.5 rounded text-foreground font-mono">
                  {effectiveCollection}
                </code>
              </div>
            )}

            {effectiveCalc && (
              <div>
                <span className="text-muted-foreground text-[10px] block">Calculation:</span>
                <code className="text-[10px] bg-accent/60 px-1.5 py-0.5 rounded text-foreground font-mono block break-all">
                  {effectiveCalc}
                </code>
              </div>
            )}

            {effectiveNote && (
              <p className="text-[11px] text-muted-foreground leading-relaxed pt-1 border-t border-border/40">
                {effectiveNote}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
