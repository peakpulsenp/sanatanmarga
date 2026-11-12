import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Radio, MapPin, Clock, Pause, Play, Volume2, VolumeX, EyeOff, ChevronRight, MoreVertical } from "lucide-react";
import { useLanguage } from "@/src/context/LanguageContext";
import type { Article } from "@/src/types";

interface LiveOperationsTickerProps {
  articles?: Article[];
}

export default function LiveOperationsTicker({ articles = [] }: LiveOperationsTickerProps) {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // Preference state initialized from localStorage
  const [isPaused, setIsPaused] = useState(() => {
    return typeof window !== "undefined" && localStorage.getItem("ticker_preference_paused") === "true";
  });
  const [isMuted, setIsMuted] = useState(() => {
    return typeof window !== "undefined" && localStorage.getItem("ticker_preference_muted") === "true";
  });
  const [isHidden, setIsHidden] = useState(() => {
    return typeof window !== "undefined" && localStorage.getItem("ticker_preference_hidden") === "true";
  });

  // Listen to custom window events to restore/show live updates
  useEffect(() => {
    const handleVisibilityChange = () => {
      const hidden = localStorage.getItem("ticker_preference_hidden") === "true";
      setIsHidden(hidden);
    };

    window.addEventListener("ticker-visibility-changed", handleVisibilityChange);
    return () => {
      window.removeEventListener("ticker-visibility-changed", handleVisibilityChange);
    };
  }, []);

  const togglePause = () => {
    const next = !isPaused;
    setIsPaused(next);
    localStorage.setItem("ticker_preference_paused", String(next));
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem("ticker_preference_muted", String(next));
  };

  const toggleHide = () => {
    setIsHidden(true);
    localStorage.setItem("ticker_preference_hidden", "true");
    window.dispatchEvent(new CustomEvent("ticker-visibility-changed"));
  };

  // Fallback operational stories if articles empty
  const defaultItems = [
    {
      id: "live1",
      title: language === 'en' ? "Nepal Parliament Assembly approves national heritage & development bill" : "नेपाल व्यवस्थापिका संसदद्वारा राष्ट्रिय सम्पदा संरक्षण विधेयक पारित",
      location: "Kathmandu",
      timeAgo: "2 min ago",
      updatesCount: 3
    },
    {
      id: "live2",
      title: language === 'en' ? "Central Bank publishes second quarterly liquidity & economic update" : "नेपाल राष्ट्र बैंकद्वारा दोस्रो त्रैमासिक मौद्रिक नीति सार्वजनिक",
      location: "Central Bank",
      timeAgo: "15 min ago",
      updatesCount: 5
    },
    {
      id: "live3",
      title: language === 'en' ? "Saraswati Knowledge Graph integrates 120 ancient Vedic manuscripts" : "सरस्वती ज्ञान प्रणालीमा १२० नयाँ प्राचीन हस्तलिखित ग्रन्थ समावेश",
      location: "Janakpur",
      timeAgo: "1 hr ago",
      updatesCount: 2
    }
  ];

  const liveList = articles.length > 0 ? articles.map(a => ({
    id: a.id,
    title: a.title,
    location: (a as any).district || (a.districts && a.districts[0]) || "Kathmandu",
    timeAgo: "तुरुन्तै",
    updatesCount: ((a as any).viewsCount || (a as any).viewCount ? Math.floor(((a as any).viewsCount || (a as any).viewCount || 50) / 50) : 1) + 1
  })) : defaultItems;

  useEffect(() => {
    if (isPaused || isHidden || liveList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % liveList.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, isHidden, liveList.length]);

  if (isHidden) return null;

  const current = liveList[currentIndex] || liveList[0];

  return (
    <div id="live-operations-strip" className="w-full bg-card dark:bg-slate-950 text-card-foreground border-t border-b border-border-theme dark:border-zinc-800/80 py-1.5 px-4 shadow-sm select-none relative transition-colors">
      <div className="container-custom flex items-center justify-between gap-3">
        {/* LIVE Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            to="/nepal-hub"
            className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-1 sm:gap-1.5 shadow-md shadow-red-600/30 transition-all"
          >
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 sm:h-2 w-1.5 sm:w-2 bg-white"></span>
            </span>
            <Radio size={12} className="animate-pulse hidden sm:inline" />
            <span>LIVE</span>
          </Link>
        </div>

        {/* Live Story Metadata Strip */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
          <Link
            to={current.id ? `/article/${current.id}` : "/nepal-hub"}
            className="text-xs sm:text-sm font-bold text-foreground dark:text-slate-100 hover:text-primary transition-colors truncate block"
          >
            {current.title}
          </Link>

          {/* Location Badge */}
          <span className="hidden sm:flex items-center gap-1 bg-muted-area dark:bg-zinc-900 border border-border-theme dark:border-zinc-800 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">
            <MapPin size={9} />
            {current.location}
          </span>

          {/* Time & Updates count */}
          <span className="hidden lg:flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono shrink-0">
            <Clock size={10} />
            <span>{current.timeAgo}</span>
            <span>•</span>
            <span className="text-amber-300 font-bold">{current.updatesCount} Updates</span>
          </span>
        </div>

        {/* Operational Controls Desktop (Pause, Mute, Hide) */}
        <div className="hidden md:flex items-center gap-2 shrink-0 text-zinc-400">
          <button
            onClick={togglePause}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title={isPaused ? "Resume Ticker" : "Pause Ticker"}
          >
            {isPaused ? <Play size={14} className="text-amber-400" /> : <Pause size={14} />}
          </button>

          <button
            onClick={toggleMute}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title={isMuted ? "Unmute Audio Alerts" : "Mute Audio Alerts"}
          >
            {isMuted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} />}
          </button>

          <button
            onClick={toggleHide}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Hide Live Ticker"
          >
            <EyeOff size={14} />
          </button>
        </div>

        {/* Operational Controls Mobile: Three Dots Menu */}
        <div className="md:hidden relative shrink-0">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-1.5 hover:text-white hover:bg-zinc-800 text-zinc-400 rounded-lg transition-colors cursor-pointer"
            aria-label="Ticker actions"
          >
            <MoreVertical size={16} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 bottom-8 z-50 bg-slate-900 border border-zinc-800/80 rounded-xl shadow-2xl p-1 min-w-[120px] flex flex-col gap-0.5">
              <button
                onClick={() => {
                  togglePause();
                  setShowDropdown(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs font-bold text-slate-200 hover:bg-zinc-800 rounded-lg"
              >
                {isPaused ? <Play size={12} className="text-amber-400" /> : <Pause size={12} />}
                <span>{isPaused ? "Play" : "Pause"}</span>
              </button>

              <button
                onClick={() => {
                  toggleMute();
                  setShowDropdown(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs font-bold text-slate-200 hover:bg-zinc-800 rounded-lg"
              >
                {isMuted ? <Volume2 size={12} className="text-amber-400" /> : <VolumeX size={12} />}
                <span>{isMuted ? "Unmute" : "Mute"}</span>
              </button>

              <button
                onClick={() => {
                  toggleHide();
                  setShowDropdown(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg"
              >
                <EyeOff size={12} />
                <span>Hide Ticker</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
