import React from "react";
import { Link } from "react-router-dom";
import { Bell, AlertTriangle, AlertCircle, Info, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { AdminAttentionItem } from "@/src/types";

interface MissionAlertsTabProps {
  attentionItems?: AdminAttentionItem[];
}

export default function MissionAlertsTab({ attentionItems }: MissionAlertsTabProps) {
  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />;
      case "HIGH":
      case "WARNING":
        return <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />;
      default:
        return <Info size={16} className="text-sky-500 shrink-0 mt-0.5" />;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">Critical</span>;
      case "HIGH":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">High</span>;
      case "WARNING":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">Warning</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-500 border border-sky-500/20">Info</span>;
    }
  };

  const items = attentionItems || [
    {
      attentionId: "att_init_1",
      domain: "PLATFORM",
      type: "CONTINUITY_ACTIVE",
      severity: "INFO" as const,
      title: "Snapshot OS Continuity Engine Active",
      description: "Edge delivery cache serving verified canonical articles across all districts.",
      targetRoute: "/admin/system-health",
      createdAt: new Date().toISOString(),
      status: "ACTIVE" as const,
      source: "SnapshotOS",
      dedupeKey: "PLATFORM_CONTINUITY"
    },
    {
      attentionId: "att_init_2",
      domain: "PLATFORM",
      type: "R2_LOCAL_FALLBACK",
      severity: "WARNING" as const,
      title: "Cloudflare R2 Operating in Local Fallback",
      description: "Live R2 credentials unverified. Storing and serving objects via verified local disk fallback.",
      targetRoute: "/admin/disaster-recovery",
      createdAt: new Date().toISOString(),
      status: "ACTIVE" as const,
      source: "DisasterRecoveryService",
      dedupeKey: "PLATFORM_R2_LOCAL_FALLBACK"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border-theme pb-3">
          <h3 className="text-sm font-black text-card-foreground uppercase tracking-wider flex items-center gap-2">
            <Bell size={16} className="text-primary" />
            <span>सक्रिय प्रणाली ध्यानयोग्य विषयहरू (Actionable Attention Items)</span>
          </h3>
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            {items.length} सक्रिय
          </span>
        </div>

        <div className="space-y-3">
          {items.map((al) => (
            <div 
              key={al.attentionId} 
              className="p-4 rounded-2xl bg-muted-area/40 border border-border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {getSeverityIcon(al.severity)}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-black text-card-foreground group-hover:text-primary transition-colors">
                      {al.title}
                    </h4>
                    {getSeverityBadge(al.severity)}
                    <span className="text-[10px] font-mono text-muted-text">
                      {new Date(al.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-text leading-relaxed">
                    {al.description}
                  </p>
                </div>
              </div>

              {al.targetRoute && (
                <Link
                  to={al.targetRoute}
                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 self-end sm:self-center transition-colors"
                >
                  <span>कारबाही गर्नुहोस्</span>
                  <ArrowUpRight size={13} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
