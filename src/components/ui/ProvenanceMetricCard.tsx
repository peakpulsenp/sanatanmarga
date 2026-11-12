import React from "react";
import { LucideIcon, Database, ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import ProvenanceBadge from "./ProvenanceBadge";
import { getMetricDefinition } from "@/src/services/dataDictionaryOS";

interface ProvenanceMetricCardProps {
  metricId: string;
  value: React.ReactNode;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: LucideIcon;
  customTitle?: string;
  customTitleNepali?: string;
  highlightColor?: "default" | "emerald" | "amber" | "indigo" | "rose";
}

export default function ProvenanceMetricCard({
  metricId,
  value,
  subtitle,
  trend,
  icon: Icon,
  customTitle,
  customTitleNepali,
  highlightColor = "default"
}: ProvenanceMetricCardProps) {
  const def = getMetricDefinition(metricId);

  const displayTitle = customTitleNepali || def.titleNepali || customTitle || def.title;
  const displayEnTitle = customTitle || def.title;

  return (
    <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden transition-all hover:border-primary/30">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            {displayTitle}
          </span>
          {displayEnTitle !== displayTitle && (
            <span className="text-[10px] text-muted-foreground/70 block">
              {displayEnTitle}
            </span>
          )}
        </div>

        <ProvenanceBadge metricId={metricId} />
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-black text-foreground font-mono tracking-tight">
          {value}
        </div>

        {Icon && (
          <div className="p-2 rounded-2xl bg-accent/60 text-primary">
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] truncate">
          <Database size={12} className="text-primary shrink-0" />
          <span className="truncate">{def.source}</span>
        </div>

        {trend && (
          <span
            className={`font-bold flex items-center gap-0.5 text-[11px] shrink-0 ${
              trend.isPositive ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {trend.isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
