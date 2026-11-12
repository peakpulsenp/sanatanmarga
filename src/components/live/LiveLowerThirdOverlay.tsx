import { useState, useEffect } from "react";
import { ExternalLink, X, Award } from "lucide-react";
import { LiveVideo, LiveSponsorCampaign } from "../../types/live";
import { LiveService } from "../../services/liveService";
import { useAuth } from "../../lib/auth";

interface LiveLowerThirdOverlayProps {
  video?: LiveVideo;
  className?: string;
}

export default function LiveLowerThirdOverlay({ video, className = "" }: LiveLowerThirdOverlayProps) {
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<LiveSponsorCampaign | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const userTier = user?.membershipTier || "free";
    const activeCamp = LiveService.getActiveCampaignForStream(video, "LIVE_VIDEO_LOWER_THIRD", userTier);
    setCampaign(activeCamp);
    setIsDismissed(false);
    setIsVisible(true);
  }, [video?.id, video?.category, video?.district, user?.membershipTier]);

  if (!campaign || isDismissed || !isVisible) return null;

  return (
    <div 
      id="live-lower-third-sponsor-overlay"
      className={`absolute bottom-16 left-4 z-30 max-w-sm sm:max-w-md bg-zinc-950/90 hover:bg-zinc-950/95 backdrop-blur-md border border-amber-500/40 rounded-xl p-3 shadow-2xl transition-all duration-300 pointer-events-auto ${className}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
          <Award size={12} className="text-amber-400" />
          <span>लाइभ प्रायोजक • {campaign.advertiserName}</span>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-zinc-400 hover:text-white p-0.5 rounded hover:bg-zinc-800 transition-colors"
          title="बन्द गर्नुहोस्"
          aria-label="Dismiss Sponsor Overlay"
        >
          <X size={13} />
        </button>
      </div>

      <p className="text-xs font-bold text-white line-clamp-2 leading-relaxed mb-2">
        {campaign.headlineNe}
      </p>

      {campaign.destinationUrl && (
        <a
          href={campaign.destinationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-bold transition-all shadow-sm"
        >
          <span>{campaign.ctaText || "थप जान्नुहोस्"}</span>
          <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
}
