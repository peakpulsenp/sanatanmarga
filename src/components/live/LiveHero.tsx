import { useState, useEffect } from "react";
import { 
  Share2, 
  Bookmark, 
  CheckCircle2, 
  MapPin, 
  Eye, 
  Calendar, 
  Sparkles, 
  AlertCircle,
  MessageSquare,
  MessageSquareOff,
  Maximize2,
  Tv,
  Globe,
  ExternalLink,
  X
} from "lucide-react";
import { LiveVideo, LiveStreamSettings, LiveChatPresentation } from "../../types/live";
import LivePlayer from "./LivePlayer";
import LiveChat from "./LiveChat";
import LiveBottomTicker from "./LiveBottomTicker";
import LiveTranslationCaptions from "./LiveTranslationCaptions";
import { toast } from "sonner";

interface LiveHeroProps {
  video?: LiveVideo;
  settings?: LiveStreamSettings;
}

const STORAGE_CHAT_PRESENTATION_KEY = "sanatan_live_chat_presentation_mode";

export default function LiveHero({ video, settings }: LiveHeroProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [chatPresentation, setChatPresentation] = useState<LiveChatPresentation>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHAT_PRESENTATION_KEY) as LiveChatPresentation;
      if (saved && ["overlay", "side", "hidden", "popout"].includes(saved)) {
        return saved;
      }
    } catch {}
    if (typeof window !== "undefined") {
      return window.innerWidth < 1024 ? "overlay" : "side";
    }
    return settings?.defaultChatPresentation || "side";
  });
  const [isMobileChatDrawerOpen, setIsMobileChatDrawerOpen] = useState(false);

  const handlePresentationChange = (mode: LiveChatPresentation) => {
    setChatPresentation(mode);
    try {
      localStorage.setItem(STORAGE_CHAT_PRESENTATION_KEY, mode);
    } catch {}
    toast.info(`च्याट मोड: ${mode === "overlay" ? "ओभरले (Overlay)" : mode === "side" ? "साइड (Side)" : mode === "popout" ? "पपआउट (Popout Window)" : "लुकाइएको (Hidden)"}`);
  };

  const handleShare = () => {
    if (navigator.share && video) {
      navigator.share({
        title: video.title,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("लिङ्क प्रतिलिपि गरियो (Link copied)");
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(!isBookmarked ? "लाइभ भिडियो संग्रह गरियो" : "संग्रह हटाइयो");
  };

  if (!video) {
    return (
      <section className="w-full bg-zinc-950 py-12 px-4 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <div className="inline-flex p-4 rounded-full bg-zinc-900 border border-zinc-800 text-amber-400">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-black text-zinc-100">हाल कुनै प्रत्यक्ष प्रसारण जारी छैन</h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            नयाँ प्रत्यक्ष प्रसारण सुरु हुनासाथ यहाँ देखिनेछ। कृपया आगामी कार्यक्रमहरू हेर्नुहोस्।
          </p>
        </div>
      </section>
    );
  }

  return (
    <section 
      id="sanatan-live-hero-section"
      className={`w-full bg-zinc-950 border-b border-zinc-800/80 transition-all duration-300 ${
        isTheaterMode ? "pt-0 pb-6 px-0" : "pt-4 pb-6 px-3 sm:px-6"
      }`}
    >
      <div className={`mx-auto space-y-4 ${isTheaterMode ? "max-w-full" : "max-w-7xl"}`}>
        
        {/* MAIN CINEMATIC VIEWPORT LAYOUT */}
        <div className="relative">
          {/* LAYOUT 1: SIDE MODE (GRID: 8 cols player + 4 cols chat on lg) */}
          {chatPresentation === "side" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Player Container */}
              <div className="lg:col-span-8 space-y-3">
                <div className="relative">
                  <LivePlayer 
                    video={video} 
                    isTheaterMode={isTheaterMode}
                    onToggleTheater={() => setIsTheaterMode(!isTheaterMode)}
                    chatPresentation={chatPresentation}
                    onChangeChatPresentation={handlePresentationChange}
                    onShare={handleShare}
                  />
                </div>
                {/* Sponsor ticker directly below player */}
                <LiveBottomTicker video={video} className="rounded-xl" />
              </div>

              {/* Chat Column (Desktop) */}
              <div className="hidden lg:block lg:col-span-4 h-[510px] sticky top-20">
                <LiveChat
                  liveVideoId={video.id}
                  settings={settings}
                  presentation={chatPresentation}
                  onChangePresentation={handlePresentationChange}
                  className="h-full"
                />
              </div>
            </div>
          )}

          {/* LAYOUT 2: OVERLAY MODE (TikTok Style: Chat overlays video player) */}
          {chatPresentation === "overlay" && (
            <div className="relative w-full space-y-3">
              <div className="relative w-full overflow-hidden rounded-2xl">
                <LivePlayer 
                  video={video} 
                  isTheaterMode={isTheaterMode}
                  onToggleTheater={() => setIsTheaterMode(!isTheaterMode)}
                  chatPresentation={chatPresentation}
                  onChangeChatPresentation={handlePresentationChange}
                  onShare={handleShare}
                  overlayChatNode={
                    <LiveChat
                      liveVideoId={video.id}
                      settings={settings}
                      presentation="overlay"
                      onChangePresentation={handlePresentationChange}
                      className="w-full h-full"
                    />
                  }
                />
              </div>

              <LiveTranslationCaptions />
              <LiveBottomTicker video={video} className="rounded-xl" />
            </div>
          )}

          {/* LAYOUT 3: HIDDEN MODE (Full width player + quick trigger to unhide) */}
          {chatPresentation === "hidden" && (
            <div className="w-full space-y-3">
              <div className="relative w-full">
                <LivePlayer 
                  video={video} 
                  isTheaterMode={isTheaterMode}
                  onToggleTheater={() => setIsTheaterMode(!isTheaterMode)}
                  chatPresentation={chatPresentation}
                  onChangeChatPresentation={handlePresentationChange}
                  onShare={handleShare}
                />

                {/* Floating Re-open Chat pill on top right */}
                <button
                  onClick={() => handlePresentationChange("side")}
                  className="hidden lg:flex absolute top-4 right-20 z-30 items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-amber-400 font-bold text-xs border border-amber-500/40 backdrop-blur-md shadow-xl transition-all cursor-pointer hover:scale-105"
                >
                  <MessageSquare size={13} />
                  <span>च्याट खोल्नुहोस्</span>
                </button>
              </div>

              <LiveTranslationCaptions />
              <LiveBottomTicker video={video} className="rounded-xl" />
            </div>
          )}

          {/* LAYOUT 4: POPOUT WINDOW MODE */}
          {chatPresentation === "popout" && (
            <div className="w-full space-y-3">
              <div className="relative w-full">
                <LivePlayer 
                  video={video} 
                  isTheaterMode={isTheaterMode}
                  onToggleTheater={() => setIsTheaterMode(!isTheaterMode)}
                  chatPresentation={chatPresentation}
                  onChangeChatPresentation={handlePresentationChange}
                  onShare={handleShare}
                />

                {/* FLOATING STANDALONE POPOUT CHAT DOCK */}
                <div className="fixed bottom-6 right-6 w-96 h-[540px] z-50 rounded-2xl shadow-2xl overflow-hidden border border-zinc-700 bg-zinc-950 flex flex-col animate-in slide-in-from-bottom-5">
                  <div className="bg-zinc-900 px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-white">पपआउट प्रत्यक्ष च्याट (Popout)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePresentationChange("side")}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-mono"
                        title="Re-dock to side"
                      >
                        Dock
                      </button>
                      <button
                        onClick={() => handlePresentationChange("hidden")}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    <LiveChat
                      liveVideoId={video.id}
                      settings={settings}
                      presentation="side"
                      onChangePresentation={handlePresentationChange}
                      className="h-full rounded-none border-0"
                    />
                  </div>
                </div>
              </div>

              <LiveTranslationCaptions />
              <LiveBottomTicker video={video} className="rounded-xl" />
            </div>
          )}
        </div>

        {/* MOBILE LIVE CHAT FLOATING DRAWER TRIGGER BUTTON */}
        <div className="lg:hidden flex items-center justify-between p-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-amber-400" />
            <span className="text-xs font-bold text-white">लाइभ च्याट र सहभागी</span>
          </div>
          <button
            onClick={() => setIsMobileChatDrawerOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-md cursor-pointer"
          >
            च्याट खोल्नुहोस् (Open Chat)
          </button>
        </div>

        {/* MOBILE BOTTOM SHEET CHAT DRAWER */}
        {isMobileChatDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end">
            <div className="bg-zinc-950 border-t border-zinc-700 rounded-t-3xl h-[80vh] w-full flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
              <LiveChat
                liveVideoId={video.id}
                settings={settings}
                isMobileDrawer={true}
                onCloseMobileDrawer={() => setIsMobileChatDrawerOpen(false)}
                className="h-full rounded-none border-0"
              />
            </div>
          </div>
        )}

        {/* STREAM METADATA HEADER */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* CATEGORY */}
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                {video.category || "विशेष प्रत्यक्ष"}
              </span>

              {/* LOCATION */}
              {(video.province || video.district) && (
                <span className="inline-flex items-center gap-1 text-zinc-400 font-medium">
                  <MapPin size={13} className="text-amber-500" />
                  {video.district ? `${video.district}, ` : ""}{video.province}
                </span>
              )}

              {/* LANGUAGE */}
              {video.language && (
                <span className="inline-flex items-center gap-1 text-zinc-400 font-medium">
                  <Globe size={13} className="text-amber-500" />
                  {video.language === "ne" ? "नेपाली" : video.language === "en" ? "English" : "मिश्रित"}
                </span>
              )}

              {/* START TIME */}
              {video.startedAt && (
                <span className="inline-flex items-center gap-1 text-zinc-400 font-mono text-[11px]">
                  <Calendar size={13} />
                  {new Date(video.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            {/* REAL VIEWER COUNT */}
            {typeof video.viewerCount === "number" && video.viewerCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 text-zinc-200 font-bold text-xs">
                <Eye size={14} className="text-red-500 animate-pulse" />
                <span>{video.viewerCount.toLocaleString("ne-NP")} दर्शक (Viewers)</span>
              </div>
            )}
          </div>

          {/* TITLE */}
          <h1 className="text-lg sm:text-2xl font-black text-white leading-snug">
            {video.title}
          </h1>

          {video.description && (
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-4xl">
              {video.description}
            </p>
          )}

          {/* BROADCASTER & ACTIONS BAR */}
          <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-sm">
                {video.broadcasterName ? video.broadcasterName.charAt(0) : "स"}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-zinc-100">
                    {video.broadcasterName || "सनातन मार्ग डिजिटल डेस्क"}
                  </span>
                  {video.sourceVerified && (
                    <CheckCircle2 size={15} className="text-emerald-400 fill-emerald-500/20" />
                  )}
                </div>
                <span className="text-xs text-zinc-400">आधिकारिक सञ्चार साझेदार</span>
              </div>
            </div>

            {/* SHARE & BOOKMARK */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all cursor-pointer"
              >
                <Share2 size={14} />
                <span>साझा गर्नुहोस्</span>
              </button>

              <button
                onClick={handleBookmark}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isBookmarked
                    ? "bg-amber-500 text-black border-amber-500"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700"
                }`}
              >
                <Bookmark size={14} />
                <span>{isBookmarked ? "संग्रहित" : "बुकमार्क"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
