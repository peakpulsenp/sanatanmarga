import React, { useState, useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import type { Ad, AdPosition } from "@/src/types";
import { adEngine } from "@/src/services/adEngine";
import AdDisclosure from "./AdDisclosure";

interface AdRendererProps {
  ad: Ad;
  position: AdPosition;
  className?: string;
  category?: string;
  district?: string;
  pageViewId?: string;
  sessionId?: string;
}

export default function AdRenderer({
  ad,
  position,
  className = "",
  category,
  district,
  pageViewId,
  sessionId
}: AdRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasRecordedImpression = useRef(false);

  const isValidSponsored = !ad.isSponsored || Boolean(ad.advertiserName && ad.advertiserName.trim());
  const imageSrc = ad.imageUrl || (ad as any).featuredImage;
  const isRenderable = isValidSponsored && Boolean(imageSrc);

  // Viewability Impression Observer (50% threshold)
  useEffect(() => {
    if (!isRenderable) return;

    hasRecordedImpression.current = false;
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !hasRecordedImpression.current) {
          hasRecordedImpression.current = true;
          adEngine.recordImpression(ad, {
            category,
            district,
            pageViewId,
            sessionId
          });
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [ad, category, district, pageViewId, sessionId, isRenderable]);

  if (!isRenderable) {
    return null;
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    adEngine.trackClick(ad, { category, district, pageViewId, sessionId });
  };

  return (
    <div
      ref={containerRef}
      id={`ad-renderer-${position}-${ad.id}`}
      className={`relative w-full overflow-hidden rounded-2xl md:rounded-[2rem] border border-border-theme shadow-xs bg-card text-card-foreground group transition-colors ${className}`}
    >
      <a
        href={ad.linkUrl || "#"}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block w-full h-full relative focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      >
        <img
          src={imageSrc}
          alt={ad.title || "विज्ञापन"}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.01]"
          loading="lazy"
        />

        {/* Bottom Right Ad Tag Badge */}
        <div className="absolute bottom-2.5 right-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/90 text-xxs font-black uppercase tracking-widest px-2.5 py-1 rounded-full z-10 flex items-center gap-1 pointer-events-none">
          <span>Ad</span>
          <ExternalLink className="w-3 h-3 opacity-80" />
        </div>
      </a>

      {/* Top Overlay: Disclosure & Info Button (rendered as sibling of <a> to prevent invalid interactive nesting in DOM) */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-auto">
        <AdDisclosure ad={ad} category={category} district={district} />
      </div>
    </div>
  );
}
