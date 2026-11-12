import { useState, useEffect } from "react";
import { ChevronRight, Play, Eye, Compass, BookOpen, Users, Globe, Sparkles, X, Tv } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "@/src/context/LanguageContext";

export interface HeroConfig {
  enabled: boolean;
  type: "youtube" | "local" | "image";
  videoUrl?: string;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  allowUserHide?: boolean;
  mediaOpacity?: number;
  overlayColor?: string;
  overlayOpacity?: number;
  blurAmount?: number;
  textShadow?: string;
  textOpacity?: number;
  themeStyle?: "dark" | "light" | "gold" | "crimson";
}

interface CinematicHeroVideoProps {
  heroConfig?: HeroConfig;
  platformStats?: {
    articlesCount?: number;
    membersCount?: number;
    districtsCount?: number;
    resourcesCount?: number;
    discussionsCount?: number;
  };
  onHideHero?: () => void;
}

export default function CinematicHeroVideo({
  heroConfig,
  platformStats,
  onHideHero
}: CinematicHeroVideoProps) {
  const { language, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasVideoError, setHasVideoError] = useState(false);

  // Default Pashupatinath/Himalaya aerial background YouTube video if none provided
  const defaultYouTubeUrl = "https://www.youtube.com/watch?v=1La4QzGeaaQ";
  const rawVideoUrl = heroConfig?.videoUrl || defaultYouTubeUrl;

  // Extract YouTube Video ID safely
  const getYouTubeId = (url: string) => {
    if (!url) return "1La4QzGeaaQ";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : "1La4QzGeaaQ";
  };

  const videoId = getYouTubeId(rawVideoUrl);
  // Construct embed URL with autoplay, muted, no controls, looping and valid origin (fixes Error 153)
  const originParam = typeof window !== "undefined" && window.location.origin
    ? `&origin=${encodeURIComponent(window.location.origin)}`
    : "";
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&rel=0&enablejsapi=1${originParam}`;

  const mediaOpacity = (heroConfig?.mediaOpacity ?? 75) / 100;
  const overlayColor = heroConfig?.overlayColor ?? "#020617";
  const overlayOpacityRaw = heroConfig?.overlayOpacity ?? 15;
  const blurAmount = heroConfig?.blurAmount ?? 0.5;
  const textShadowValue = heroConfig?.textShadow ?? "0 4px 16px rgba(0,0,0,0.95), 0 0 32px rgba(0,0,0,0.7), -1px -1px 0 rgba(0,0,0,0.4), 1px -1px 0 rgba(0,0,0,0.4), -1px 1px 0 rgba(0,0,0,0.4), 1px 1px 0 rgba(0,0,0,0.4)";
  const textOpacity = (heroConfig?.textOpacity ?? 100) / 100;
  const themeStyle = heroConfig?.themeStyle ?? "dark";

  const heroTitle = heroConfig?.title || (language === 'en' ? 'SANATAN MARGA' : 'सनातन मार्ग');
  const heroSubtitle = heroConfig?.subtitle || (language === 'en' ? "Nepal's Civilizational Media Network" : "नेपालको सभ्यतामूलक डिजिटल मिडिया सञ्जाल");

  const stats = {
    articles: platformStats?.articlesCount || 1240,
    knowledge: platformStats?.resourcesCount || 450,
    archives: 85,
    districts: platformStats?.districtsCount || 77
  };

  // Hex opacity helper
  const opacityHex = Math.round(overlayOpacityRaw * 2.55).toString(16).padStart(2, '0');
  const overlayBg = `${overlayColor}${opacityHex}`;

  // Theme-specific styles
  const isLightTheme = themeStyle === "light";
  const isGoldTheme = themeStyle === "gold";
  const isCrimsonTheme = themeStyle === "crimson";

  const textThemeClass = isLightTheme ? "text-slate-900" : "text-white";
  const subtitleThemeClass = isLightTheme ? "text-slate-700" : "text-slate-200";
  const badgeThemeClass = isGoldTheme 
    ? "bg-amber-500/25 border-amber-400 text-amber-300"
    : isCrimsonTheme
    ? "bg-red-500/25 border-red-500 text-red-300"
    : isLightTheme
    ? "bg-slate-200/50 border-slate-300 text-slate-800"
    : "bg-amber-500/20 border-amber-500/40 text-amber-300";

  const sponsorThemeClass = isGoldTheme
    ? "bg-amber-950/80 border-amber-500/40 text-amber-100"
    : isCrimsonTheme
    ? "bg-red-950/80 border-red-500/40 text-red-100"
    : isLightTheme
    ? "bg-slate-100/90 border-slate-300 text-slate-800"
    : "bg-slate-900/80 border-amber-500/30 text-slate-200";

  const ctaThemeClass = isGoldTheme
    ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/30"
    : isCrimsonTheme
    ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/30"
    : isLightTheme
    ? "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-950/20"
    : "bg-primary hover:bg-primary/90 text-white shadow-primary/30";

  return (
    <section 
      style={{ backgroundColor: overlayColor }}
      className="relative w-full overflow-hidden text-white border-b border-border-theme/40 transition-all duration-300 min-h-[85vh] sm:min-h-[calc(100svh-90px)] flex flex-col justify-center"
    >
      {/* Background Media Engine */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {heroConfig?.type === "image" || hasVideoError ? (
          <img
            src={heroConfig?.imageUrl || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=2000"}
            alt="Hero Scenery"
            style={{ opacity: mediaOpacity }}
            className="w-full h-full object-cover object-center"
          />
        ) : heroConfig?.type === "local" && heroConfig.videoUrl ? (
          <video
            src={heroConfig.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            onError={() => setHasVideoError(true)}
            style={{ opacity: mediaOpacity }}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
            {/* Ambient Background image underneath iframe to prevent black flash/blank space */}
            <img
              src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=2000"
              alt="Himalayan Backdrop"
              className="absolute inset-0 w-full h-full object-cover object-center -z-10"
              style={{ opacity: mediaOpacity * 0.8 }}
            />
            <iframe
              src={embedUrl}
              title="Cinematic Nepal Aerial Background"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[56.25vw] min-h-full min-w-[177.78vh] object-cover pointer-events-none filter contrast-105 brightness-105"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              onError={() => setHasVideoError(true)}
              style={{ border: 0, opacity: mediaOpacity }}
            />
          </div>
        )}

        {/* Ambient Overlay Gradients & Blur */}
        <div 
          style={{ background: `linear-gradient(to top, ${overlayColor} 0%, ${overlayColor}66 50%, ${overlayColor}22 100%)` }}
          className="absolute inset-0" 
        />
        <div 
          style={{ backgroundColor: overlayBg }}
          className="absolute inset-0" 
        />
        <div 
          style={{ backdropFilter: `blur(${blurAmount}px)`, WebkitBackdropFilter: `blur(${blurAmount}px)` }}
          className="absolute inset-0" 
        />
      </div>

      {/* Top Controls Overlay (Hide Hero Button) */}
      {(heroConfig?.allowUserHide ?? true) && (
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={onHideHero}
            className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow-lg backdrop-blur-md transition-all cursor-pointer group"
            title="Hide hero banner"
          >
            <X size={16} className="text-amber-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>
      )}

      {/* Hero Content Area */}
      <div className="relative z-20 container-custom flex flex-col items-center justify-center my-auto py-12 sm:py-16 md:py-20 px-4">
        {/* Center Main Titles */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto gap-3 md:gap-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none drop-shadow-2xl ${textThemeClass}`}
            style={{ textShadow: textShadowValue, opacity: textOpacity }}
          >
            {heroTitle}
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`w-28 h-1 my-1 ${isGoldTheme ? "bg-amber-400" : isCrimsonTheme ? "bg-red-500" : "bg-gradient-to-r from-transparent via-amber-500 to-transparent"}`}
          />

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className={`text-base sm:text-xl md:text-2xl font-bold tracking-wide max-w-2xl drop-shadow-md ${subtitleThemeClass}`}
            style={{ textShadow: textShadowValue !== "none" ? "0 2px 8px rgba(0,0,0,0.95), 0 0 16px rgba(0,0,0,0.6)" : "none", opacity: textOpacity }}
          >
            {heroSubtitle}
          </motion.p>

          <p 
            className={`text-xs md:text-sm font-semibold tracking-wider uppercase ${isLightTheme ? "text-slate-800" : "text-amber-300/90"}`}
            style={{ textShadow: !isLightTheme && textShadowValue !== "none" ? "0 1px 4px rgba(0,0,0,0.9)" : "none" }}
          >
            77 Districts • Knowledge Graph • Archives • Live News
          </p>

          {/* Action Button */}
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => {
                const target = document.getElementById("breaking-news-strip") || document.getElementById("latest-news-section");
                target?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`font-black text-sm px-7 py-3.5 rounded-2xl shadow-xl transition-all flex items-center gap-2 cursor-pointer group ${ctaThemeClass}`}
            >
              <span>{heroConfig?.ctaText || (language === 'en' ? 'Latest News' : 'ताजा समाचार')}</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
