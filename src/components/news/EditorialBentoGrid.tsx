import React from "react";
import { Link } from "react-router-dom";
import { 
  Sparkles, Flame, Clock, TrendingUp, Radio, MapPin, 
  BookOpen, Calendar, ArrowUpRight, Volume2, ShieldCheck, 
  ExternalLink, ChevronRight, Activity, Sun, Moon
} from "lucide-react";
import type { Article } from "@/src/types";
import { formatDate } from "@/src/lib/utils";
import { useLanguage } from "@/src/context/LanguageContext";
import { useMediaOS } from "@/src/context/MediaOSContext";

interface EditorialBentoGridProps {
  leadStory?: Article;
  secondaryStories?: Article[];
  latestNews?: Article[];
  marketPulse?: {
    nepse?: string;
    nepseChange?: string;
    gold?: string;
    silver?: string;
    usdNpr?: string;
  };
  weatherData?: {
    city?: string;
    temp?: string;
    condition?: string;
  };
  panchangText?: string;
  festivalText?: string;
  className?: string;
}

export default function EditorialBentoGrid({
  leadStory,
  secondaryStories = [],
  latestNews = [],
  marketPulse = {
    nepse: "2,745.20",
    nepseChange: "+14.80 (0.54%)",
    gold: "रु १,६०,५००",
    silver: "रु १,९८०",
    usdNpr: "रु १३४.८०"
  },
  weatherData = {
    city: "काठमाडौँ (Kathmandu)",
    temp: "२२°C",
    condition: "आंशिक बदली (Partly Cloudy)"
  },
  panchangText = "वि.सं. २०८३ भाद्र १४ | कृष्ण पक्ष अष्टमी | चन्द्र राशि: वृष",
  festivalText = "आसन्न: श्रीकृष्ण जन्माष्टमी (३ दिन बाँकी)",
  className = ""
}: EditorialBentoGridProps) {
  const { language, t } = useLanguage();
  const mediaOS = useMediaOS();

  const handlePlayAudio = (e: React.MouseEvent, article: Article) => {
    e.preventDefault();
    e.stopPropagation();
    mediaOS.playArticle({
      id: article.id,
      title: article.title,
      content: article.content || article.excerpt || "",
      categoryId: article.category || "News",
    } as any);
  };

  const topSecondary = secondaryStories.slice(0, 2);
  const streamNews = latestNews.slice(0, 4);

  return (
    <section 
      id="editorial-bento-grid-3" 
      className={`w-full py-6 md:py-8 bg-background border-b border-border-theme/40 ${className}`}
      aria-label="Editorial Bento Grid"
    >
      <div className="container-custom px-4 sm:px-6">
        
        {/* Bento Grid Header / Intelligence Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-5 border-b border-border-theme/60">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-5 bg-primary rounded-full shadow-xs" />
            <h2 className="text-sm sm:text-base font-black text-card-foreground tracking-tight flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <span>{language === "en" ? "Editorial Bento & Command Grid" : "सम्पादकीय बेन्टो तथा कमान्ड ग्रिड"}</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px] uppercase font-mono tracking-wider hidden sm:inline-block">
              UX 3.0
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-muted-text">
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>{language === "en" ? "Source Verified" : "प्रमाणित स्रोत"}</span>
            </span>
            <span className="text-border-theme">•</span>
            <span className="flex items-center gap-1 text-primary font-bold">
              <Activity size={13} className="animate-pulse" />
              <span>LIVE FEED</span>
            </span>
          </div>
        </div>

        {/* 12-Column Responsive Bento Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5">
          
          {/* =========================================================================
              SLOT 1: LEAD HERO STORY (7 Cols Desktop / 12 Cols Mobile)
              ========================================================================= */}
          <div className="md:col-span-12 lg:col-span-7 flex flex-col">
            {leadStory ? (
              <Link
                to={`/article/${leadStory.id}`}
                className="group relative flex-1 min-h-[380px] sm:min-h-[440px] rounded-3xl overflow-hidden bg-card border border-border-theme shadow-md hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col justify-end p-5 sm:p-7"
              >
                {/* Background Image with Cinematic Overlay */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={leadStory.featuredImage || (leadStory as any).imageUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200"}
                    alt={leadStory.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />
                </div>

                {/* Hero Tags & Badges */}
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-primary text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                      {(leadStory as any).categoryName || (leadStory as any).category || (language === "en" ? "Lead Story" : "मुख्य समाचार")}
                    </span>

                    {leadStory.districts && leadStory.districts[0] && (
                      <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                        <MapPin size={11} />
                        <span>{leadStory.districts[0]}</span>
                      </span>
                    )}

                    <span className="text-white/70 text-[11px] font-mono flex items-center gap-1">
                      <Clock size={12} />
                      <span>{formatDate(leadStory.createdAt)}</span>
                    </span>
                  </div>

                  {/* Headline */}
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight group-hover:text-amber-300 transition-colors drop-shadow-md">
                    {leadStory.title}
                  </h3>

                  {/* Excerpt */}
                  {leadStory.excerpt && (
                    <p className="text-xs sm:text-sm text-zinc-200 line-clamp-2 leading-relaxed max-w-2xl font-medium">
                      {leadStory.excerpt}
                    </p>
                  )}

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/15">
                    <span className="text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      <span>{language === "en" ? "Read Full Coverage" : "विस्तृत समाचार पढ्नुहोस्"}</span>
                      <ArrowUpRight size={14} />
                    </span>

                    <button
                      onClick={(e) => handlePlayAudio(e, leadStory)}
                      className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-amber-500 hover:text-black text-white text-xs font-black backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Listen to story audio"
                    >
                      <Volume2 size={14} />
                      <span>{language === "en" ? "Listen" : "सुन्नुहोस्"}</span>
                    </button>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex-1 min-h-[380px] rounded-3xl bg-muted-area/50 border border-border-theme flex items-center justify-center p-6 text-center text-muted-text">
                No lead story loaded
              </div>
            )}
          </div>

          {/* =========================================================================
              SLOT 2: NEPAL HUB COMMAND CENTER & MARKET PULSE (5 Cols Desktop)
              ========================================================================= */}
          <div className="md:col-span-12 lg:col-span-5 flex flex-col gap-4">
            
            {/* 2A: Nepal Command Center Widget */}
            <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border-theme shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-border-theme/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <MapPin size={15} />
                  </span>
                  <span className="text-xs font-black text-card-foreground uppercase tracking-tight">
                    {language === "en" ? "Nepal Command Center" : "नेपाल कमान्ड सेन्टर"}
                  </span>
                </div>
                <Link to="/nepal-hub" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5">
                  <span>{language === "en" ? "77-Districts" : "७७ जिल्ला"}</span>
                  <ChevronRight size={12} />
                </Link>
              </div>

              {/* Weather & Panchang Row */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-2xl bg-muted-area/50 border border-border-theme/60 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-text font-bold">
                    <span>{weatherData.city}</span>
                    <Sun size={12} className="text-amber-500" />
                  </div>
                  <div className="text-base font-black text-card-foreground">{weatherData.temp}</div>
                  <div className="text-[10px] text-muted-text truncate">{weatherData.condition}</div>
                </div>

                <div className="p-2.5 rounded-2xl bg-muted-area/50 border border-border-theme/60 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-text font-bold">
                    <span>पञ्चाङ्ग (Panchang)</span>
                    <Moon size={12} className="text-primary" />
                  </div>
                  <div className="text-xs font-black text-card-foreground leading-tight line-clamp-2">
                    {panchangText}
                  </div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold truncate">
                    {festivalText}
                  </div>
                </div>
              </div>

              {/* Civic & NRB Forex Reference */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] font-black uppercase text-muted-text tracking-wider">
                  <span className="flex items-center gap-1">
                    <TrendingUp size={11} className="text-emerald-500" />
                    <span>{language === "en" ? "Civic & Forex Reference" : "विनिमय तथा नागरिक सूचक"}</span>
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">NRB VERIFIED</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-muted-area/40 border border-border-theme/50">
                    <span className="text-[9px] text-muted-text block">USD/NPR</span>
                    <span className="text-[11px] font-black text-card-foreground">{marketPulse.usdNpr}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-muted-area/40 border border-border-theme/50">
                    <span className="text-[9px] text-muted-text block">प्रदेश (Provinces)</span>
                    <span className="text-[11px] font-black text-card-foreground">७ प्रदेश</span>
                  </div>
                  <div className="p-2 rounded-xl bg-muted-area/40 border border-border-theme/50">
                    <span className="text-[9px] text-muted-text block">जिल्ला (Districts)</span>
                    <span className="text-[11px] font-black text-card-foreground">७७ जिल्ला</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2B: Saraswati Knowledge & Cultural Audio Hub */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-card via-card to-amber-500/5 border border-border-theme shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-border-theme/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-primary/10 text-primary">
                    <BookOpen size={15} />
                  </span>
                  <span className="text-xs font-black text-card-foreground uppercase tracking-tight">
                    {language === "en" ? "Knowledge & Audio OS" : "ज्ञानकोष तथा श्रव्य संग्रह"}
                  </span>
                </div>
                <Link to="/knowledge" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5">
                  <span>{language === "en" ? "SGIS Hub" : "सरस्वती कोष"}</span>
                  <ChevronRight size={12} />
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-border-theme shadow-sm relative group">
                  <img
                    src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=300"
                    alt="Sanatan Manuscript"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Radio size={16} className="text-white" />
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                    {language === "en" ? "Featured Scripture & Manuscript" : "विशेष पाण्डुलिपि वाचन"}
                  </span>
                  <h4 className="text-xs font-black text-card-foreground leading-snug truncate">
                    ऋग्वेद मण्डल १ सूक्त १ (सस्वर वैदिक मन्त्रोच्चारण)
                  </h4>
                  <p className="text-[10px] text-muted-text line-clamp-1">
                    Authentic recitation with Sanskrit-Nepali contextual commentary.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Link
                  to="/radio"
                  className="flex-1 py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary hover:text-white text-primary text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <Radio size={13} />
                  <span>{language === "en" ? "Listen to Live Radio" : "रेडियो सुन्नुहोस्"}</span>
                </Link>
                <Link
                  to="/timeline"
                  className="py-2 px-3 rounded-xl bg-muted-area hover:bg-muted-area/80 text-card-foreground text-xs font-bold transition-all text-center"
                >
                  {language === "en" ? "Timeline" : "समयरेखा"}
                </Link>
              </div>
            </div>

          </div>

        </div>

        {/* =========================================================================
            SLOT 3: LATEST BREAKING STORIES STRIP (4 Reflowed Cards)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4 sm:mt-5">
          {streamNews.map((news, idx) => (
            <Link
              key={news.id || idx}
              to={`/article/${news.id}`}
              className="group p-3.5 rounded-2xl bg-card border border-border-theme shadow-xs hover:shadow-md hover:border-primary/30 transition-all flex flex-col justify-between min-h-[140px]"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-muted-text font-mono">
                  <span className="font-black text-primary uppercase">
                    {news.categoryName || news.category || "News"}
                  </span>
                  <span>{formatDate(news.createdAt)}</span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-card-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                  {news.title}
                </h4>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border-theme/50 text-[10px] text-muted-text font-bold">
                <span className="group-hover:text-card-foreground transition-colors flex items-center gap-1">
                  <span>{language === "en" ? "Read story" : "विस्तृत"}</span>
                  <ArrowUpRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
                {news.districts && news.districts[0] && (
                  <span className="text-amber-600 dark:text-amber-400">{news.districts[0]}</span>
                )}
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
