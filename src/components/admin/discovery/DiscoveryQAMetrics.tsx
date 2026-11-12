import React from "react";
import { 
  Sparkles, CheckCircle2, XCircle, AlertCircle, 
  Copy, Layers, Filter, ShieldCheck, RefreshCw 
} from "lucide-react";

interface DiscoveryQAMetricsProps {
  totalCount: number;
  publishedCount: number;
  rejectedCount: number;
  needsReviewCount: number;
  duplicateCount: number;
  uncategorizedCount: number;
  currentFilter: string;
  onFilterSelect: (filter: string) => void;
}

export default function DiscoveryQAMetrics({
  totalCount,
  publishedCount,
  rejectedCount,
  needsReviewCount,
  duplicateCount,
  uncategorizedCount,
  currentFilter,
  onFilterSelect
}: DiscoveryQAMetricsProps) {
  const cards = [
    {
      id: "all",
      label: "Discovered Stories",
      labelNp: "कुल खोजिएका समाचार",
      count: totalCount,
      icon: Sparkles,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
      activeBg: "ring-2 ring-primary bg-primary/15"
    },
    {
      id: "published",
      label: "Published",
      labelNp: "प्रकाशित भइसकेका",
      count: publishedCount,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      activeBg: "ring-2 ring-emerald-500 bg-emerald-500/15"
    },
    {
      id: "new",
      label: "Needs Review",
      labelNp: "समीक्षा आवश्यक",
      count: needsReviewCount,
      icon: AlertCircle,
      color: "text-sky-500",
      bg: "bg-sky-500/10 border-sky-500/20",
      activeBg: "ring-2 ring-sky-500 bg-sky-500/15"
    },
    {
      id: "duplicate",
      label: "Duplicate Risk",
      labelNp: "दोहोरिन सक्ने जोखिम",
      count: duplicateCount,
      icon: Copy,
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
      activeBg: "ring-2 ring-amber-500 bg-amber-500/15"
    },
    {
      id: "uncategorized",
      label: "Uncategorized",
      labelNp: "अवर्गीकृत (No Cat)",
      count: uncategorizedCount,
      icon: Layers,
      color: "text-rose-500",
      bg: "bg-rose-500/10 border-rose-500/20",
      activeBg: "ring-2 ring-rose-500 bg-rose-500/15"
    },
    {
      id: "ignored",
      label: "Rejected / Ignored",
      labelNp: "अस्वीकृत / हटाइएका",
      count: rejectedCount,
      icon: XCircle,
      color: "text-zinc-500",
      bg: "bg-muted-area border-border-theme",
      activeBg: "ring-2 ring-zinc-400 bg-muted-area"
    }
  ];

  return (
    <div className="bg-card border border-border-theme rounded-3xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-border-theme pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary" />
          <h3 className="text-xs sm:text-sm font-black text-card-foreground uppercase tracking-wider">
            Discovery Center QA & Routing Dashboard
          </h3>
        </div>
        <span className="text-[10px] font-mono text-muted-text font-bold">
          v5.0 Pipeline Gate
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card) => {
          const isSelected = currentFilter === card.id;
          return (
            <button
              key={card.id}
              onClick={() => onFilterSelect(card.id)}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                card.bg
              } ${isSelected ? card.activeBg : "hover:scale-[1.02]"}`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-text truncate">
                  {card.label}
                </span>
                <card.icon size={14} className={card.color} />
              </div>
              <div>
                <div className={`text-xl font-black ${card.color}`}>
                  {card.count}
                </div>
                <div className="text-[10px] text-muted-text truncate mt-0.5">
                  {card.labelNp}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
