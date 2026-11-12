import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, SkipForward, ExternalLink, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import { VideoCampaign, AdPlacementType } from "@/src/types/advertising";
import { AcademyAdDecisionEngine } from "@/src/services/academyAdDecisionEngine";
import { advertisingStorage } from "@/src/services/advertisingStorage";
import { MembershipTier } from "@/src/services/articleModuleRegistry";
import { audioPlaybackManager } from "@/src/services/audioPlaybackManager";

interface AcademyVideoPlayerProps {
  courseId: string;
  courseTitle: string;
  courseCategory?: string;
  courseVideoUrl: string;
  thumbnailUrl?: string;
  userTier?: MembershipTier;
  onLessonComplete?: () => void;
}

type PlayerMode = "CHECKING_AD" | "AD_PLAYING" | "COURSE_PLAYING" | "COMPLETED";

export default function AcademyVideoPlayer({
  courseId,
  courseTitle,
  courseCategory,
  courseVideoUrl,
  thumbnailUrl,
  userTier = "free",
  onLessonComplete
}: AcademyVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [mode, setMode] = useState<PlayerMode>("CHECKING_AD");
  const [currentAd, setCurrentAd] = useState<VideoCampaign | null>(null);
  const [adPlacement, setAdPlacement] = useState<AdPlacementType>("pre-roll");
  
  // Controls & States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [skipSecondsLeft, setSkipSecondsLeft] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  // Telemetry milestone flags
  const [emitted25, setEmitted25] = useState(false);
  const [emitted50, setEmitted50] = useState(false);
  const [emitted75, setEmitted75] = useState(false);

  // Mid-roll tracking
  const [hasPlayedMidRoll, setHasPlayedMidRoll] = useState(false);

  // 1. Initial Pre-roll Ad Evaluation
  useEffect(() => {
    let isMounted = true;
    const checkPreRoll = async () => {
      setMode("CHECKING_AD");
      try {
        const decision = await AcademyAdDecisionEngine.selectAdForPlacement({
          courseId,
          category: courseCategory,
          userTier,
          placement: "pre-roll"
        });

        if (isMounted) {
          if (decision.shouldPlayAd && decision.campaign) {
            setCurrentAd(decision.campaign);
            setAdPlacement("pre-roll");
            setSkipSecondsLeft(decision.skipAfterSeconds || 5);
            audioPlaybackManager.pause();
            setCanSkip(false);
            setMode("AD_PLAYING");
            
            // Log Ad Start Telemetry
            advertisingStorage.logTelemetry({
              campaignId: decision.campaign.id,
              advertiserId: decision.campaign.advertiserId,
              courseId,
              placement: "pre-roll",
              userTier,
              eventType: "start"
            });
            advertisingStorage.logTelemetry({
              campaignId: decision.campaign.id,
              advertiserId: decision.campaign.advertiserId,
              courseId,
              placement: "pre-roll",
              userTier,
              eventType: "impression"
            });
          } else {
            // Direct to course video
            setMode("COURSE_PLAYING");
          }
        }
      } catch (e) {
        console.warn("Pre-roll decision error, bypassing to course video:", e);
        if (isMounted) setMode("COURSE_PLAYING");
      }
    };

    checkPreRoll();
    return () => { isMounted = false; };
  }, [courseId, courseCategory, userTier]);

  // 2. Skip Countdown Timer for Ads
  useEffect(() => {
    if (mode !== "AD_PLAYING") return;

    if (skipSecondsLeft <= 0) {
      setCanSkip(true);
      return;
    }

    const timer = setInterval(() => {
      setSkipSecondsLeft(prev => {
        if (prev <= 1) {
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, skipSecondsLeft]);

  // 3. Skip Ad Action
  const handleSkipAd = () => {
    if (currentAd) {
      advertisingStorage.logTelemetry({
        campaignId: currentAd.id,
        advertiserId: currentAd.advertiserId,
        courseId,
        placement: adPlacement,
        userTier,
        eventType: "skipped"
      });
    }
    transitionToCourse();
  };

  const transitionToCourse = () => {
    setCurrentAd(null);
    setMode("COURSE_PLAYING");
    setIsPlaying(true);
    setEmitted25(false);
    setEmitted50(false);
    setEmitted75(false);
  };

  // 4. Time Update & Milestone Tracking
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(cur);
    setDuration(dur);

    const pct = cur / dur;

    if (mode === "AD_PLAYING" && currentAd) {
      if (pct >= 0.25 && !emitted25) {
        setEmitted25(true);
        advertisingStorage.logTelemetry({
          campaignId: currentAd.id,
          advertiserId: currentAd.advertiserId,
          courseId,
          placement: adPlacement,
          userTier,
          eventType: "watch_25"
        });
      }
      if (pct >= 0.50 && !emitted50) {
        setEmitted50(true);
        advertisingStorage.logTelemetry({
          campaignId: currentAd.id,
          advertiserId: currentAd.advertiserId,
          courseId,
          placement: adPlacement,
          userTier,
          eventType: "watch_50"
        });
      }
      if (pct >= 0.75 && !emitted75) {
        setEmitted75(true);
        advertisingStorage.logTelemetry({
          campaignId: currentAd.id,
          advertiserId: currentAd.advertiserId,
          courseId,
          placement: adPlacement,
          userTier,
          eventType: "watch_75"
        });
      }
    } else if (mode === "COURSE_PLAYING") {
      // Check for mid-roll opportunity (e.g. at 50% or 300s)
      if (!hasPlayedMidRoll && cur >= 60 && dur > 120) {
        setHasPlayedMidRoll(true);
        triggerMidRollAd();
      }
    }
  };

  const triggerMidRollAd = async () => {
    try {
      const decision = await AcademyAdDecisionEngine.selectAdForPlacement({
        courseId,
        category: courseCategory,
        userTier,
        placement: "mid-roll"
      });
      if (decision.shouldPlayAd && decision.campaign) {
        if (videoRef.current) videoRef.current.pause();
        setCurrentAd(decision.campaign);
        setAdPlacement("mid-roll");
        setSkipSecondsLeft(decision.skipAfterSeconds || 5);
        setCanSkip(false);
        setMode("AD_PLAYING");

        advertisingStorage.logTelemetry({
          campaignId: decision.campaign.id,
          advertiserId: decision.campaign.advertiserId,
          courseId,
          placement: "mid-roll",
          userTier,
          eventType: "start"
        });
      }
    } catch (e) {
      console.warn("Mid-roll decision bypass:", e);
    }
  };

  // 5. Video Ended Handler
  const handleEnded = () => {
    if (mode === "AD_PLAYING" && currentAd) {
      advertisingStorage.logTelemetry({
        campaignId: currentAd.id,
        advertiserId: currentAd.advertiserId,
        courseId,
        placement: adPlacement,
        userTier,
        eventType: "completed"
      });
      transitionToCourse();
    } else if (mode === "COURSE_PLAYING") {
      setMode("COMPLETED");
      setIsPlaying(false);
      if (onLessonComplete) onLessonComplete();
    }
  };

  // 6. Hard Safety Fallback for Video Errors (CDN/Network Failure)
  const handleVideoError = (e: any) => {
    console.warn("[AcademyVideoPlayer] Video loading error encountered:", e);
    if (mode === "AD_PLAYING") {
      // AD FAILURE MUST NEVER BLOCK COURSE PLAYBACK! Immediately skip ad.
      transitionToCourse();
    }
  };

  const handleCtaClick = () => {
    if (currentAd) {
      advertisingStorage.logTelemetry({
        campaignId: currentAd.id,
        advertiserId: currentAd.advertiserId,
        courseId,
        placement: adPlacement,
        userTier,
        eventType: "click"
      });
      window.open(currentAd.destinationUrl, "_blank", "noopener,noreferrer");
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const currentSrc = mode === "AD_PLAYING" && currentAd ? currentAd.videoUrl : courseVideoUrl;

  return (
    <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group flex flex-col justify-between">
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        src={currentSrc || undefined}
        poster={thumbnailUrl || undefined}
        className="absolute inset-0 w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleVideoError}
        playsInline
      />

      {/* AD PLAYING OVERLAY */}
      {mode === "AD_PLAYING" && currentAd && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20">
          {/* Top Header Info Bar */}
          <div className="flex items-center justify-between pointer-events-auto bg-slate-950/80 backdrop-blur-md border border-slate-800/80 p-2.5 rounded-2xl">
            <div className="flex items-center gap-3">
              {currentAd.advertiserLogo ? (
                <img src={currentAd.advertiserLogo} alt={currentAd.advertiserName} className="w-8 h-8 rounded-xl object-cover border border-slate-700" />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                  AD
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/30">
                    Sponsored
                  </span>
                  <span className="text-xs font-bold text-white">{currentAd.advertiserName}</span>
                </div>
                <div className="text-[11px] text-slate-300 line-clamp-1">{currentAd.campaignName}</div>
              </div>
            </div>

            {/* Skip / Countdown Box */}
            <div className="flex items-center gap-2">
              {canSkip ? (
                <button
                  onClick={handleSkipAd}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
                >
                  <span>Skip Ad</span>
                  <SkipForward size={14} />
                </button>
              ) : (
                <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 text-slate-300 font-mono font-bold text-xs border border-slate-700/80 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Skip in {skipSecondsLeft}s</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom CTA Banner */}
          <div className="flex items-center justify-between pointer-events-auto bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3 rounded-2xl">
            <div className="text-xs font-medium text-slate-200">
              {currentAd.ctaText || "Click to learn more about our partner"}
            </div>
            <button
              onClick={handleCtaClick}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <span>{currentAd.ctaText ? "Visit Website" : "Learn More"}</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY CONTROLS (Normal Playback or Paused) */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col justify-between p-4 pointer-events-none">
        {/* Top Course Info Bar */}
        <div className="flex items-center justify-between text-white font-bold text-sm">
          <span>{courseTitle}</span>
          <span className="text-xs bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            {userTier === "premium" ? "Ad-Free Premium" : `${userTier.toUpperCase()} TIER`}
          </span>
        </div>

        {/* Center Big Play Toggle */}
        <div className="flex justify-center items-center">
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center hover:scale-110 transition-transform shadow-2xl cursor-pointer pointer-events-auto"
          >
            {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
          </button>
        </div>

        {/* Bottom Progress Bar & Volume */}
        <div className="flex items-center gap-3 text-white text-xs font-mono pointer-events-auto">
          <button onClick={togglePlay} className="p-1 hover:text-amber-400 cursor-pointer">
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          
          <div className="flex-grow h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />
          </div>

          <button onClick={toggleMute} className="p-1 hover:text-amber-400 cursor-pointer">
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
