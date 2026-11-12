import { useState, useRef, useEffect } from "react";
import { 
  Play, 
  Pause,
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  ExternalLink, 
  AlertTriangle,
  Radio,
  Calendar,
  Clock,
  Share2,
  Subtitles,
  Settings,
  Tv,
  Check,
  MessageSquare,
  MessageSquareOff,
  ShieldCheck,
  Eye,
  MapPin,
  Globe,
  Bell
} from "lucide-react";
import { LiveVideo, LiveQualityOption, LiveChatPresentation, LiveStreamTruthState } from "../../types/live";
import { LiveProviderService } from "../../services/liveProviderService";
import LiveLowerThirdOverlay from "./LiveLowerThirdOverlay";

interface LivePlayerProps {
  video?: LiveVideo;
  className?: string;
  autoPlay?: boolean;
  isTheaterMode?: boolean;
  onToggleTheater?: () => void;
  chatPresentation?: LiveChatPresentation;
  onChangeChatPresentation?: (mode: LiveChatPresentation) => void;
  onShare?: () => void;
  overlayChatNode?: React.ReactNode;
}

export default function LivePlayer({ 
  video, 
  className = "", 
  autoPlay = true,
  isTheaterMode = false,
  onToggleTheater,
  chatPresentation = "side",
  onChangeChatPresentation,
  onShare,
  overlayChatNode
}: LivePlayerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<LiveQualityOption>("Auto");
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [remindSet, setRemindSet] = useState(false);
  const [uptimeSeconds, setUptimeSeconds] = useState(1340);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const nativeVideoRef = useRef<HTMLVideoElement>(null);

  // Derive truthful state
  const getTruthState = (): LiveStreamTruthState => {
    if (!video) return "OFFLINE";
    if (video.isLive || video.status === "live") return "LIVE";
    if (video.status === "scheduled") return "SCHEDULED";
    if (video.status === "ended" || video.status === "archived" || video.status === "approved") return "REPLAY";
    return "OFFLINE";
  };

  const truthState = getTruthState();

  // Live timer tick
  useEffect(() => {
    if (truthState === "LIVE") {
      const interval = setInterval(() => {
        setUptimeSeconds(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [truthState]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (playerContainerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        playerContainerRef.current.requestFullscreen().catch(() => {});
      }
    }
  };

  const togglePiP = async () => {
    try {
      if (nativeVideoRef.current) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          setIsPipActive(false);
        } else if (document.pictureInPictureEnabled) {
          await nativeVideoRef.current.requestPictureInPicture();
          setIsPipActive(true);
        }
      }
    } catch (e) {
      console.warn("PiP not supported or failed:", e);
    }
  };

  const handleShareClick = () => {
    if (onShare) {
      onShare();
      return;
    }
    if (navigator.share && video) {
      navigator.share({
        title: video.title,
        text: `${video.title} - सनातन मार्ग प्रत्यक्ष प्रसारण`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("प्रसारण लिङ्क प्रतिलिपि गरियो! (Link copied)");
    }
  };

  if (!video || !video.sourceUrl) {
    return (
      <div className={`aspect-video w-full bg-zinc-950 rounded-2xl flex flex-col items-center justify-center p-8 border border-zinc-800 text-center relative overflow-hidden shadow-2xl ${className}`}>
        <div className="absolute inset-0 bg-radial from-amber-500/5 to-transparent pointer-events-none" />
        <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-amber-400/80 mb-3 shadow-inner">
          <Radio size={32} className="animate-pulse" />
        </div>
        <h4 className="font-bold text-zinc-100 text-base mb-1">प्रत्यक्ष प्रसारण स्टुडियो (Live Studio Offline)</h4>
        <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
          हाल कुनै प्रत्यक्ष प्रसारण सुरु भएको छैन। अर्को निर्धारित कार्यक्रमको लागि तलको तालिका हेर्नुहोस्।
        </p>
      </div>
    );
  }

  const resolved = LiveProviderService.resolveSource(video.embedUrl || video.sourceUrl, video.sourceType);

  return (
    <div 
      ref={playerContainerRef}
      id="sanatan-live-player-root"
      className={`relative group bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800/80 aspect-video w-full flex flex-col items-center justify-center select-none ${className}`}
    >
      {/* ================= 1. VIDEO RENDERING LAYERS ================= */}
      
      {/* 1A. SCHEDULED BROADCAST STATE */}
      {truthState === "SCHEDULED" && (
        <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 text-center relative z-10">
          {video.thumbnailUrl && (
            <img 
              src={video.thumbnailUrl} 
              alt={video.title} 
              className="absolute inset-0 w-full h-full object-cover opacity-25 blur-xs"
            />
          )}
          <div className="relative z-10 max-w-md space-y-3 bg-zinc-900/85 backdrop-blur-md p-6 rounded-2xl border border-zinc-700/60 shadow-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-xs uppercase tracking-wider">
              <Calendar size={14} />
              <span>आगामी प्रत्यक्ष प्रसारण (Scheduled)</span>
            </div>
            <h3 className="font-bold text-white text-lg leading-snug">{video.title}</h3>
            {video.scheduledAt && (
              <div className="text-xs text-zinc-300 flex items-center justify-center gap-2">
                <Clock size={14} className="text-amber-400" />
                <span>प्रसारण समय: {new Date(video.scheduledAt).toLocaleString("ne-NP")}</span>
              </div>
            )}
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => setRemindSet(!remindSet)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  remindSet 
                    ? "bg-emerald-500 text-black shadow-lg" 
                    : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600"
                }`}
              >
                <Bell size={14} />
                <span>{remindSet ? "सम्झौता दर्ता भयो (Reminder Set)" : "मलाई सूचना पठाउनुहोस्"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1B. ACTIVE YOUTUBE EMBED */}
      {truthState !== "SCHEDULED" && resolved.sourceType === "youtube" && resolved.embedCapability === "SUPPORTED_EMBED" && !hasError && (
        <iframe
          key={`yt-${resolved.externalId || video.id}`}
          src={`https://www.youtube.com/embed/${resolved.externalId || video.id}?autoplay=${autoPlay ? 1 : 0}&mute=${isMuted ? 1 : 0}&playsinline=1&enablejsapi=1&rel=0`}
          title={video.title}
          className="w-full h-full border-0 rounded-2xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        />
      )}

      {/* 1C. ACTIVE FACEBOOK EMBED */}
      {truthState !== "SCHEDULED" && resolved.sourceType === "facebook" && resolved.embedCapability === "SUPPORTED_EMBED" && !hasError && (
        <iframe
          key={`fb-${video.id}`}
          src={resolved.embedUrl}
          title={video.title}
          className="w-full h-full border-0 rounded-2xl"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        />
      )}

      {/* 1D. ACTIVE INSTAGRAM EMBED */}
      {truthState !== "SCHEDULED" && resolved.sourceType === "instagram" && resolved.embedCapability === "SUPPORTED_EMBED" && !hasError && (
        <iframe
          key={`ig-${video.id}`}
          src={resolved.embedUrl}
          title={video.title}
          className="w-full h-full border-0 rounded-2xl"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      )}

      {/* 1E. ACTIVE GENERIC / CUSTOM EMBED */}
      {truthState !== "SCHEDULED" && (resolved.sourceType === "external" || resolved.sourceType === "uploaded") && resolved.embedCapability === "SUPPORTED_EMBED" && !hasError && (
        <iframe
          key={`ext-${video.id}`}
          src={resolved.embedUrl}
          title={video.title}
          className="w-full h-full border-0 rounded-2xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        />
      )}

      {/* 1F. NATIVE VIDEO / HLS */}
      {truthState !== "SCHEDULED" && resolved.sourceType === "native" && !hasError && (
        <video
          ref={nativeVideoRef}
          src={resolved.embedUrl}
          controls={true}
          autoPlay={autoPlay}
          muted={isMuted}
          playsInline
          poster={video.thumbnailUrl}
          className="w-full h-full object-contain bg-black rounded-2xl"
        />
      )}

      {/* 1G. EXTERNAL LINK FALLBACK */}
      {truthState !== "SCHEDULED" && (resolved.embedCapability === "EXTERNAL_LINK_ONLY" || hasError || resolved.embedCapability === "UNAVAILABLE") && (
        <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 text-center relative">
          {video.thumbnailUrl && (
            <img 
              src={video.thumbnailUrl} 
              alt={video.title} 
              className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xs"
            />
          )}
          <div className="relative z-10 space-y-3">
            <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 inline-block shadow-inner">
              <Play size={28} />
            </div>
            <h4 className="font-bold text-white text-base max-w-md line-clamp-2">{video.title}</h4>
            <p className="text-xs text-zinc-400 max-w-sm">
              यो भिडियो बाह्य च्यानलमा उपलब्ध छ। प्रत्यक्ष हेर्नको लागि बाह्य लिङ्क खोल्नुहोस्।
            </p>
            <a
              href={video.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-lg cursor-pointer"
            >
              <span>{video.broadcasterName || "बाह्य प्लेटफर्ममा हेर्नुहोस्"}</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}

      {/* ================= 2. BROADCAST LOWER-THIRD AD ================= */}
      <LiveLowerThirdOverlay video={video} />

      {/* ================= 3. SIMULATED CAPTIONS (CC) ================= */}
      {showCaptions && (
        <div className="absolute bottom-14 inset-x-8 z-30 flex justify-center pointer-events-none animate-fade-in">
          <div className="bg-black/85 backdrop-blur-md px-4 py-1.5 rounded-lg border border-white/20 text-yellow-300 font-semibold text-xs sm:text-sm text-center shadow-2xl max-w-xl">
            [नेपाली उपशीर्षक] • {video.title} • प्रत्यक्ष संवाद र सम्पादकीय टिप्पणी प्रसारण
          </div>
        </div>
      )}

      {/* ================= 3B. TIKTOK OVERLAY CHAT LAYER ================= */}
      {chatPresentation === "overlay" && overlayChatNode && (
        <div className={`absolute left-3 sm:left-4 z-20 pointer-events-none transition-all duration-300 ${
          showCaptions ? "bottom-28 max-h-[45%]" : "bottom-14 max-h-[60%]"
        } max-w-[85%] sm:max-w-[420px] pb-[env(safe-area-inset-bottom)]`}>
          {overlayChatNode}
        </div>
      )}

      {/* ================= 4. OVERLAY TOP BAR ================= */}
      <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between pointer-events-none gap-2">
        {/* Left: Truthful Badges */}
        <div className="flex items-center gap-2 flex-wrap pointer-events-auto">
          {truthState === "LIVE" ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 text-white font-black text-[11px] tracking-wider uppercase shadow-xl backdrop-blur-md animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              लाइभ (LIVE) • {formatUptime(uptimeSeconds)}
            </span>
          ) : truthState === "SCHEDULED" ? (
            <span className="px-3 py-1 rounded-full bg-amber-500/90 text-black font-black text-[11px] tracking-wider uppercase shadow-lg backdrop-blur-md">
              तालिकाबद्ध (SCHEDULED)
            </span>
          ) : truthState === "REPLAY" ? (
            <span className="px-3 py-1 rounded-full bg-zinc-900/90 backdrop-blur-md border border-zinc-700/60 text-zinc-300 font-bold text-[11px]">
              पुनःप्रसारण (REPLAY / RECORDED)
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-zinc-900/90 backdrop-blur-md border border-zinc-700/60 text-zinc-400 font-bold text-[11px]">
              अफलाइन (OFFLINE)
            </span>
          )}

          {video.sourceVerified && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-[10px] backdrop-blur-md">
              <ShieldCheck size={11} />
              प्रमाणित स्रोत
            </span>
          )}

          {video.category && (
            <span className="hidden md:inline-block px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-700/50 text-zinc-300 font-medium text-[10px] backdrop-blur-md">
              {video.category}
            </span>
          )}

          {video.district && (
            <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-700/50 text-zinc-300 font-medium text-[10px] backdrop-blur-md">
              <MapPin size={10} className="text-amber-400" />
              {video.district}
            </span>
          )}
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Share Button */}
          <button
            onClick={handleShareClick}
            title="साझेदारी गर्नुहोस् (Share Stream)"
            aria-label="Share Stream"
            className="p-2 rounded-xl bg-black/60 hover:bg-black/90 backdrop-blur-md text-zinc-200 hover:text-white border border-white/10 transition-all cursor-pointer shadow-md"
          >
            <Share2 size={14} />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "सामान्य पर्दा (Exit Fullscreen)" : "पूर्ण पर्दा (Fullscreen)"}
            aria-label="Toggle Fullscreen"
            className="p-2 rounded-xl bg-black/60 hover:bg-black/90 backdrop-blur-md text-zinc-200 hover:text-white border border-white/10 transition-all cursor-pointer shadow-md"
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
        </div>
      </div>

      {/* ================= 5. OVERLAY BOTTOM CONTROLS BAR ================= */}
      <div className="absolute bottom-0 inset-x-0 z-20 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between gap-3 opacity-90 group-hover:opacity-100 transition-opacity">
        {/* Left: Stream Info & Broadcaster */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
              {video.title}
            </h4>
            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
              <span className="text-amber-400 font-medium">{video.broadcasterName || "सनातन मार्ग डिजिटल"}</span>
              {video.language && <span>• {video.language === "ne" ? "नेपाली" : video.language === "en" ? "English" : "मिश्रित"}</span>}
            </div>
          </div>
        </div>

        {/* Right: Comprehensive Controls (Mute, CC, Quality, PiP, Theater, Chat Presentation) */}
        <div className="flex items-center gap-1.5 shrink-0 relative">
          {/* Audio / Mute Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "ध्वनि चालु (Unmute)" : "ध्वनि बन्द (Mute)"}
            aria-label="Toggle Audio Mute"
            className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              !isMuted 
                ? "bg-amber-500 text-black border-amber-400 shadow-sm" 
                : "bg-black/60 hover:bg-black/90 text-zinc-300 border-white/10"
            }`}
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>

          {/* Captions Toggle */}
          <button
            onClick={() => setShowCaptions(!showCaptions)}
            title={showCaptions ? "उपशीर्षक बन्द (Turn CC off)" : "उपशीर्षक चालु (Turn CC on)"}
            aria-label="Toggle Subtitles"
            className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              showCaptions 
                ? "bg-amber-500 text-black border-amber-400 shadow-sm" 
                : "bg-black/60 hover:bg-black/90 text-zinc-300 border-white/10"
            }`}
          >
            <Subtitles size={13} />
            <span className="hidden sm:inline text-[10px]">CC</span>
          </button>

          {/* Quality Selector */}
          <div className="relative">
            <button
              onClick={() => setShowQualityMenu(!showQualityMenu)}
              title="गुणस्तर चयन गर्नुहोस् (Video Quality)"
              aria-label="Select Video Quality"
              className="p-1.5 px-2 rounded-lg bg-black/60 hover:bg-black/90 text-zinc-300 hover:text-white border border-white/10 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Settings size={12} />
              <span>{selectedQuality}</span>
            </button>

            {showQualityMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-32 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 rounded-xl shadow-2xl p-1.5 z-40 space-y-0.5 animate-in fade-in zoom-in-95">
                {(["Auto", "1080p", "720p", "480p", "360p"] as LiveQualityOption[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setSelectedQuality(q);
                      setShowQualityMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                      selectedQuality === q 
                        ? "bg-amber-500/20 text-amber-400 font-bold" 
                        : "text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    <span>{q}</span>
                    {selectedQuality === q && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PiP Button */}
          {resolved.sourceType === "native" && (
            <button
              onClick={togglePiP}
              title="पिक्चर-इन-पिक्चर (Picture-in-Picture)"
              aria-label="Picture-in-Picture"
              className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                isPipActive 
                  ? "bg-amber-500 text-black border-amber-400" 
                  : "bg-black/60 hover:bg-black/90 text-zinc-300 border-white/10"
              }`}
            >
              <Tv size={13} />
            </button>
          )}

          {/* Theater Mode Toggle */}
          {onToggleTheater && (
            <button
              onClick={onToggleTheater}
              title={isTheaterMode ? "साधारण मोड (Exit Theater Mode)" : "थिएटर मोड (Theater Mode)"}
              aria-label="Theater Mode"
              className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                isTheaterMode 
                  ? "bg-amber-500 text-black border-amber-400 shadow-sm" 
                  : "bg-black/60 hover:bg-black/90 text-zinc-300 border-white/10"
              }`}
            >
              <Tv size={13} />
            </button>
          )}

          {/* Chat Presentation Switcher Menu (Overlay / Side / Popout / Hidden) */}
          {onChangeChatPresentation && (
            <div className="relative">
              <button
                onClick={() => setShowChatMenu(!showChatMenu)}
                title="च्याट लेआउट चयन (Chat Mode)"
                aria-label="Select Chat Mode"
                className={`p-1.5 px-2.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  chatPresentation !== "hidden"
                    ? "bg-amber-500 text-black border-amber-400 shadow-sm"
                    : "bg-black/60 hover:bg-black/90 text-zinc-300 border-white/10"
                }`}
              >
                {chatPresentation === "hidden" ? <MessageSquareOff size={13} /> : <MessageSquare size={13} />}
                <span className="text-[10px] uppercase font-mono">
                  {chatPresentation === "overlay" ? "ओभरले" : chatPresentation === "side" ? "साइड" : chatPresentation === "popout" ? "पपआउट" : "लुकाइयो"}
                </span>
              </button>

              {showChatMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-44 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 rounded-xl shadow-2xl p-1.5 z-40 space-y-0.5 animate-in fade-in zoom-in-95">
                  <div className="text-[10px] font-bold text-zinc-400 px-2 py-1 uppercase tracking-wider border-b border-zinc-800">
                    च्याट प्रदर्शन मोड (Chat Mode)
                  </div>
                  {[
                    { id: "overlay", label: "ओभरले (TikTok Style)", sub: "भिडियो माथि तैरिने" },
                    { id: "side", label: "साइड (Side Dock)", sub: "छेउको कोलममा" },
                    { id: "popout", label: "पपआउट (Popout)", sub: "अलग्गै विन्डो" },
                    { id: "hidden", label: "लुकाइएको (Hidden)", sub: "च्याट बन्द" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        onChangeChatPresentation(mode.id as LiveChatPresentation);
                        setShowChatMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        chatPresentation === mode.id
                          ? "bg-amber-500/20 text-amber-400 font-bold"
                          : "text-zinc-300 hover:bg-zinc-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{mode.label}</span>
                        {chatPresentation === mode.id && <Check size={12} />}
                      </div>
                      <span className="text-[9px] text-zinc-500 block">{mode.sub}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
