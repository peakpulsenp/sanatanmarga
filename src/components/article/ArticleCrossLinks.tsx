import React from "react";
import { Radio, Calendar, ArrowRight, Flame, Sparkles, AlertCircle, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import type { Article } from "@/src/types";

interface ArticleCrossLinksProps {
  article: Article;
  language?: "ne" | "en";
}

export const ArticleCrossLinks: React.FC<ArticleCrossLinksProps> = ({
  article,
  language = "ne",
}) => {
  const isLive = article.isLiveSituation || Boolean(article.liveDispatchId);
  const hasEvent = Boolean(article.relatedEventId || article.relatedEventTitle);
  const isFestivalOrCultural = article.categoryId === "festivals" || article.categoryId === "sanskar" || article.category === "festivals";

  if (!isLive && !hasEvent && !isFestivalOrCultural) {
    return null;
  }

  return (
    <div id="article-cross-links" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Nepal Hub Live Cross-Link */}
      {isLive && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-5 flex items-center justify-between gap-4 transition-all hover:bg-red-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center relative">
              <Radio className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-red-600 dark:text-red-400 tracking-wider">
                  {language === "en" ? "Part of Active Live Situation" : "प्रत्यक्ष लाइभ घटनाक्रम"}
                </span>
              </div>
              <p className="text-xs font-bold text-card-foreground line-clamp-1 mt-0.5">
                {language === "en" ? "Track real-time dispatches on Nepal Hub" : "नेपाल हबमा स्थलगत प्रत्यक्ष सूचनाहरू हेर्नुहोस्"}
              </p>
            </div>
          </div>
          <Link
            to={article.liveDispatchId ? `/nepal-hub/live/${article.liveDispatchId}` : "/nepal-hub/live"}
            className="shrink-0 inline-flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-red-700 transition-colors shadow-sm"
          >
            <span>{language === "en" ? "Live Feed" : "लाइभ"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 2. Events OS Cross-Link */}
      {(hasEvent || isFestivalOrCultural) && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-5 flex items-center justify-between gap-4 transition-all hover:bg-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-300 tracking-wider">
                  {language === "en" ? "Events OS & Festival Calendar" : "इभेन्ट्स ओएस तथा पावन पर्व"}
                </span>
              </div>
              <p className="text-xs font-bold text-card-foreground line-clamp-1 mt-0.5">
                {article.relatedEventTitle || (language === "en" ? "View calendar schedule & ritual timings" : "तिथि, पूजा विधि तथा विशेष तालिका हेर्नुहोस्")}
              </p>
            </div>
          </div>
          <Link
            to={article.relatedEventId ? `/events/${article.relatedEventId}` : "/festivals"}
            className="shrink-0 inline-flex items-center gap-1.5 bg-amber-600 text-white px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-amber-700 transition-colors shadow-sm"
          >
            <span>{language === "en" ? "Timeline" : "तालिका"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default ArticleCrossLinks;
