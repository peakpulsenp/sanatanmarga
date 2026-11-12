import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Clock, Eye, ChevronLeft, ChevronRight, Play, X, Video, Megaphone, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatDate } from "@/src/lib/utils";
import type { Article, Ad } from "@/src/types";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import VideoEmbed from "@/src/components/common/VideoEmbed";
import { useLanguage } from "@/src/context/LanguageContext";

interface HeroFeaturedSliderProps {
  articles: Article[];
  className?: string;
}

export type SlideItem =
  | { type: "article"; id: string; data: Article }
  | { type: "ad"; id: string; data: Ad };

export default function HeroFeaturedSlider({ articles, className = "" }: HeroFeaturedSliderProps) {
  const { t, language, getLocalized } = useLanguage();
  const [heroAds, setHeroAds] = useState<Ad[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  // Fetch active ads for position 'hero_slider' via SnapshotOS
  useEffect(() => {
    let isMounted = true;

    const fetchHeroAds = async () => {
      try {
        const snapshotAds = await snapshotEngine.getAdsSnapshot("hero_slider");
        if (snapshotAds && snapshotAds.length > 0 && isMounted) {
          setHeroAds(snapshotAds);
        } else if (isMounted) {
          setHeroAds([]);
        }
      } catch (e) {
        if (isMounted) setHeroAds([]);
      }
    };

    fetchHeroAds();

    const handleRebuilt = () => {
      fetchHeroAds();
    };
    window.addEventListener("snapshot-rebuilt", handleRebuilt);
    return () => {
      isMounted = false;
      window.removeEventListener("snapshot-rebuilt", handleRebuilt);
    };
  }, []);

  // Combine articles and ads into slides list
  const slides = useMemo<SlideItem[]>(() => {
    const items: SlideItem[] = [];
    if (!articles || articles.length === 0) return items;

    articles.forEach((article, idx) => {
      const artId = article.id || `fallback_${idx}_${article.slug || 'art'}`;
      items.push({ type: "article", id: `art-${artId}`, data: article });
      // Insert an ad slide after every 2 articles if hero ads are available
      if ((idx + 1) % 2 === 0 && heroAds.length > 0) {
        const adIndex = Math.floor(idx / 2) % heroAds.length;
        const ad = heroAds[adIndex];
        if (ad && (ad.imageUrl || (ad as any).featuredImage)) {
          const adId = ad.id || `ad_idx_${adIndex}`;
          items.push({ type: "ad", id: `ad-${adId}-${idx}`, data: ad });
        }
      }
    });

    // If less than 2 articles exist or extra ads exist, append remaining ads
    if (articles.length < 2 && heroAds.length > 0) {
      heroAds.forEach((ad, i) => {
        if (ad && (ad.imageUrl || (ad as any).featuredImage)) {
          const adId = ad.id || `ad_extra_${i}`;
          items.push({ type: "ad", id: `ad-${adId}-${i}`, data: ad });
        }
      });
    }

    return items;
  }, [articles, heroAds]);

  // Ensure currentSlide is within bounds when slides change
  useEffect(() => {
    if (currentSlide >= slides.length && slides.length > 0) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  // Auto-play interval (disabled when video is playing)
  useEffect(() => {
    if (slides.length <= 1 || isPlayingVideo) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [slides.length, isPlayingVideo]);

  if (!slides || slides.length === 0) return null;

  const currentItem = slides[currentSlide] || slides[0];

  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setIsPlayingVideo(false);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setIsPlayingVideo(false);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className={`relative group ${className}`}>
      <div className="relative aspect-[4/3] sm:aspect-[16/9] md:aspect-[2/1] lg:aspect-[2.2/1] overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl bg-slate-900 border border-border-theme/30">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            {currentItem.type === "article" ? (
              (() => {
                const article = currentItem.data;
                const localizedTitle = getLocalized(article, "title") || article.title;
                if (isPlayingVideo && article.videoUrl) {
                  return (
                    <VideoEmbed 
                      url={article.videoUrl}
                      title={localizedTitle}
                      onClose={() => setIsPlayingVideo(false)}
                    />
                  );
                }

                return (
                  <div className="relative w-full h-full">
                    <Link to={`/article/${article.id}`} className="block w-full h-full group/link">
                      <img
                        src={article.featuredImage || "/placeholder.jpg"}
                        alt={localizedTitle}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/link:scale-105"
                        referrerPolicy="no-referrer"
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10 p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col justify-end gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 flex-wrap relative z-10">
                          <span className="bg-accent text-white text-[8px] md:text-[10px] lg:text-xs font-black px-2.5 py-1 md:px-3.5 md:py-1 rounded-full uppercase tracking-widest shadow-lg shadow-accent/20">
                            {language === 'en' ? 'Featured News' : 'विशेष समाचार'}
                          </span>
                          {article.videoUrl && (
                            <span className="bg-red-600 text-white text-[8px] md:text-[10px] lg:text-xs font-black px-2.5 py-1 md:px-3.5 md:py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1 animate-pulse">
                              <Video size={12} />
                              {language === 'en' ? 'Video Report' : 'भिडियो समाचार'}
                            </span>
                          )}
                        </div>

                        <h2 className="relative z-10 text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-white leading-[1.15] tracking-tight group-hover/link:text-primary transition-colors line-clamp-2 md:line-clamp-3">
                          {localizedTitle}
                        </h2>

                        <div className="relative z-10 flex items-center gap-3 md:gap-6 text-[8px] md:text-[10px] lg:text-xs font-bold text-slate-300 uppercase tracking-widest">
                          <span className="flex items-center gap-1 md:gap-2">
                            <Clock size={12} className="text-primary" /> {formatDate(article.createdAt, language)}
                          </span>
                          <span className="hidden xs:flex items-center gap-1 md:gap-2">
                            <Eye size={12} className="text-primary" /> {article.views} {language === 'en' ? 'Views' : 'पटक हेरिएको'}
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* Big Center Play Video Button overlay if article has videoUrl */}
                    {article.videoUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsPlayingVideo(true);
                        }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 group/play flex items-center gap-3 bg-red-600/90 hover:bg-red-600 text-white px-5 py-3 sm:px-6 sm:py-3.5 rounded-full shadow-2xl backdrop-blur-md border border-white/30 transition-all hover:scale-105 active:scale-95"
                        title={language === 'en' ? 'Play Video' : 'भिडियो प्ले गर्नुहोस्'}
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-red-600 flex items-center justify-center shadow-lg group-hover/play:scale-110 transition-transform">
                          <Play size={20} className="fill-current translate-x-0.5" />
                        </div>
                        <span className="text-xs sm:text-sm font-black uppercase tracking-wider hidden xs:inline">
                          {language === 'en' ? 'Play Video' : 'भिडियो प्ले गर्नुहोस्'}
                        </span>
                      </button>
                    )}
                  </div>
                );
              })()
            ) : (
              /* ADVERTISEMENT SLIDE */
              (() => {
                const ad = currentItem.data;
                const imageSrc = ad?.imageUrl || (ad as any)?.featuredImage;
                if (!imageSrc) return null;
                const isExternal = ad.linkUrl?.startsWith("http");

                return (
                  <div className="relative w-full h-full">
                    <a
                      href={ad.linkUrl || "#"}
                      target={isExternal ? "_blank" : "_self"}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className="block w-full h-full group/adlink"
                    >
                      <img
                        src={imageSrc}
                        alt={ad.title || "Ad"}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/adlink:scale-105"
                        referrerPolicy="no-referrer"
                      />

                      {/* Gradient Overlay for Ad */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20 p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col justify-end gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 flex-wrap relative z-10">
                          <span className="bg-amber-500 text-black text-[8px] md:text-[10px] lg:text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-xl flex items-center gap-1.5 border border-amber-300">
                            <Megaphone size={12} className="fill-current" />
                            {language === 'en' ? 'Sponsored' : 'विज्ञापन (Sponsored)'}
                          </span>
                        </div>

                        <h2 className="relative z-10 text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-white leading-[1.15] tracking-tight group-hover/adlink:text-amber-400 transition-colors line-clamp-2 md:line-clamp-3">
                          {ad.title}
                        </h2>

                        <div className="relative z-10 flex items-center gap-3">
                          <span className="inline-flex items-center gap-2 bg-amber-500/90 hover:bg-amber-400 text-black text-xs font-black px-4 py-2 rounded-full shadow-lg backdrop-blur-md transition-all group-hover/adlink:scale-105">
                            <span>{language === 'en' ? 'Visit Website' : 'वेबसाइटमा जानुहोस्'}</span>
                            <ExternalLink size={12} />
                          </span>
                        </div>
                      </div>
                    </a>
                  </div>
                );
              })()
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 flex items-center gap-2 z-20">
          <button
            type="button"
            onClick={handlePrev}
            className="p-2 sm:p-3 bg-black/50 hover:bg-primary backdrop-blur-md text-white rounded-full transition-all border border-white/10 shadow-lg active:scale-95"
            title="अघिल्लो स्लाइड"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="p-2 sm:p-3 bg-black/50 hover:bg-primary backdrop-blur-md text-white rounded-full transition-all border border-white/10 shadow-lg active:scale-95"
            title="पछिल्लो स्लाइड"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Slide Indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 z-20 flex items-center gap-1.5 max-w-[50%] overflow-x-auto no-scrollbar">
            {slides.map((slide, idx) => {
              const isAd = slide.type === "ad";
              return (
                <button
                  key={slide.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlayingVideo(false);
                    setCurrentSlide(idx);
                  }}
                  className={`h-2 rounded-full transition-all flex-shrink-0 ${
                    idx === currentSlide
                      ? isAd
                        ? "w-7 bg-amber-400"
                        : "w-7 bg-primary"
                      : isAd
                      ? "w-2 bg-amber-500/50 hover:bg-amber-400"
                      : "w-2 bg-white/40 hover:bg-white/80"
                  }`}
                  title={isAd ? "विज्ञापन स्लाइड" : "समाचार स्लाइड"}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
