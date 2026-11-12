import React from "react";
import { Sparkles, ExternalLink, ShieldCheck } from "lucide-react";
import { useAuth } from "@/src/lib/auth";
import { canRenderAd } from "@/src/lib/adGate";
import type { Ad } from "@/src/types";

interface SponsoredStoryCardProps {
  ad: Ad;
  className?: string;
}

export default function SponsoredStoryCard({ ad, className = "" }: SponsoredStoryCardProps) {
  const { user } = useAuth();

  if (!canRenderAd({ user, placement: "sponsored_story" })) {
    return null;
  }

  if (!ad || !ad.title) return null;

  return (
    <article className={`group relative bg-card border border-amber-500/20 dark:border-amber-500/10 rounded-2xl overflow-hidden p-4 sm:p-5 shadow-sm hover:shadow-md transition-all ${className}`}>
      {/* Top Sponsored Tag Header */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-border-theme/60 text-xxs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>प्रायोजित सामग्री • Sponsored Story</span>
        </div>
        <div className="flex items-center gap-1 text-muted-text font-medium">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span>{ad.advertiserName || "Sanatan Partner"}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {/* Creative Image */}
        {ad.imageUrl && (
          <div className="w-full sm:w-48 h-32 rounded-xl overflow-hidden shrink-0 bg-muted-area relative">
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Story Body */}
        <div className="flex-1 space-y-2">
          <h3 className="text-base sm:text-lg font-black text-card-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
            {ad.title}
          </h3>
          {ad.notes && (
            <p className="text-xs text-muted-text line-clamp-2 leading-relaxed">
              {ad.notes}
            </p>
          )}

          <div className="pt-2 flex items-center justify-between">
            <a
              href={ad.linkUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              <span>थप जानकारी लिनुहोस् (Explore)</span>
              <ExternalLink size={12} />
            </a>
            <span className="text-xxs text-muted-text font-mono">
              Sponsored by {ad.advertiserName || "Partner"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
