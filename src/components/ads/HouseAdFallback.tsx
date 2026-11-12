import React from "react";
import { Megaphone, ArrowUpRight } from "lucide-react";
import type { HouseAd } from "@/src/constants/revenueInventory";
import type { AdPosition } from "@/src/types";

interface HouseAdFallbackProps {
  houseAd: HouseAd;
  position: AdPosition;
  className?: string;
}

export default function HouseAdFallback({ houseAd, position, className = "" }: HouseAdFallbackProps) {
  const targetUrl = houseAd.targetUrl || "#";

  return (
    <div
      id={`house-ad-fallback-${position}`}
      className={`relative w-full overflow-hidden rounded-2xl md:rounded-[2rem] border border-amber-500/20 shadow-xs bg-gradient-to-r from-amber-500/5 via-card to-amber-500/10 text-card-foreground group transition-all p-4 ${className}`}
    >
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10">
                सनातनमार्ग सन्देश
              </span>
              <span className="text-xxs font-semibold text-muted-text">
                {houseAd.badgeNe}
              </span>
            </div>
            <h4 className="text-sm font-black text-card-foreground mt-0.5">
              {houseAd.titleNe}
            </h4>
            <p className="text-xs text-muted-text line-clamp-1">
              {houseAd.descriptionNe}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:underline shrink-0 bg-amber-500/10 px-3.5 py-2 rounded-xl">
          <span>{houseAd.ctaTextNe}</span>
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </a>
    </div>
  );
}
