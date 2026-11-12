import { useState, useEffect } from "react";
import { ExternalLink, Sparkles, Volume2 } from "lucide-react";
import { LiveVideo, LiveSponsorCampaign } from "../../types/live";
import { LiveService } from "../../services/liveService";
import { useAuth } from "../../lib/auth";

interface LiveBottomTickerProps {
  video?: LiveVideo;
  className?: string;
}

export default function LiveBottomTicker({ video, className = "" }: LiveBottomTickerProps) {
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<LiveSponsorCampaign | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Check tier (premium users have zero ads)
    const userTier = user?.membershipTier || "free";
    const activeCamp = LiveService.getActiveCampaignForStream(video, "LIVE_BOTTOM_TICKER", userTier);
    setCampaign(activeCamp);
  }, [video?.id, video?.category, video?.district, user?.membershipTier]);

  if (!campaign) return null;

  return (
    <div 
      id="live-bottom-sponsor-ticker"
      className={`w-full bg-gradient-to-r from-amber-950/90 via-zinc-900/95 to-amber-950/90 border-y border-amber-500/30 py-2 px-3 flex items-center overflow-hidden backdrop-blur-md shadow-md ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center gap-2 shrink-0 bg-amber-500 text-black px-2.5 py-0.5 rounded font-black text-[10px] uppercase tracking-wider shadow-xs">
        <Sparkles size={12} className="animate-pulse" />
        <span>प्रायोजक (Sponsor)</span>
      </div>

      <div className="flex-1 overflow-hidden relative mx-3 flex items-center">
        <div 
          className={`flex items-center whitespace-nowrap gap-8 text-xs text-zinc-100 font-medium ${isPaused ? "" : "animate-marquee"}`}
          style={{
            animationDuration: campaign.scrollSpeed === "fast" ? "18s" : campaign.scrollSpeed === "slow" ? "35s" : "25s"
          }}
        >
          <span className="font-bold text-amber-300">
            {campaign.headlineNe}
          </span>

          {campaign.headlineEn && (
            <span className="text-zinc-400 font-normal">
              • {campaign.headlineEn}
            </span>
          )}

          <span className="text-amber-400/80 font-bold">
            [{campaign.advertiserName}]
          </span>

          <span className="font-bold text-amber-300">
            {campaign.headlineNe}
          </span>
        </div>
      </div>

      {campaign.destinationUrl && (
        <a
          href={campaign.destinationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 text-[11px] font-bold transition-all cursor-pointer"
        >
          <span>{campaign.ctaText || "हेर्नुहोस्"}</span>
          <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
}
