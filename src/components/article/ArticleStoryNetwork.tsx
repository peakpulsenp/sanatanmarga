import React from "react";
import { GitCommit, ArrowRight, ArrowLeft, Clock, Sparkles, Network, BookOpen, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import type { Article } from "@/src/types";
import { formatDate } from "@/src/lib/utils";

interface ArticleStoryNetworkProps {
  currentArticle: Article;
  relatedArticles?: Article[];
  nextArticle?: Article | null;
  language?: "ne" | "en";
}

export const ArticleStoryNetwork: React.FC<ArticleStoryNetworkProps> = ({
  currentArticle,
  relatedArticles = [],
  nextArticle = null,
  language = "ne",
}) => {
  const previousStory = relatedArticles.length > 0 ? relatedArticles[0] : null;
  const followUpStory = nextArticle || (relatedArticles.length > 1 ? relatedArticles[1] : null);

  const getTitle = (art: Article) => {
    if (language === "en") {
      return art.title_en || art.titleEn || art.title;
    }
    return art.title;
  };

  return (
    <div id="article-story-network" className="bg-card border border-border-theme rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border-theme/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-card-foreground">
              {language === "en" ? "Story Evolution Network & Progression Graph" : "समाचार शृङ्खला तथा घटनाक्रम सञ्जाल"}
            </h3>
            <p className="text-[11px] font-medium text-muted-text">
              {language === "en" ? "Contextual timeline connecting origins, active report, and subsequent outcomes" : "पृष्ठभूमि, वर्तमान प्रतिवेदन तथा आगामी परिणामको अन्तरसम्बन्ध"}
            </p>
          </div>
        </div>

        <Link
          to="/storylines"
          className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3.5 py-1.5 rounded-full"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{language === "en" ? "Explore Storylines" : "पूर्ण शृङ्खलाहरू"}</span>
        </Link>
      </div>

        {/* 3-Node Connected Story Sequence: Mobile Vertical Progression & Desktop 3-Column Graph */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {/* Step 1: Previous / Origin Story */}
          <div className="bg-muted-area/50 border border-border-theme/70 rounded-2xl p-5 flex flex-col justify-between space-y-4 relative group hover:border-primary/50 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-text flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3 text-muted-text hidden md:inline" />
                  <span className="md:hidden">१.</span>
                  {language === "en" ? "Background Origin" : "पृष्ठभूमि तथा प्रारम्भ"}
                </span>
                <span className="text-xxs px-2 py-0.5 rounded-full bg-border-theme/40 text-muted-text font-bold">
                  {language === "en" ? "Precedent" : "प्रारम्भिक"}
                </span>
              </div>
              {previousStory ? (
                <Link to={`/article/${previousStory.id}`} className="block">
                  <h4 className="text-xs font-black text-card-foreground group-hover:text-primary transition-colors line-clamp-3 leading-snug break-words">
                    {getTitle(previousStory)}
                  </h4>
                </Link>
              ) : (
                <p className="text-xs font-medium text-muted-text italic">
                  {language === "en" ? "Primary incident recorded as initiating chapter" : "यस घटनाको प्रारम्भिक आधिकारिक प्रतिवेदन"}
                </p>
              )}
            </div>
            {previousStory && (
              <div className="text-[10px] font-bold text-muted-text flex items-center gap-1 pt-2 border-t border-border-theme/40">
                <Clock className="w-3 h-3 text-primary shrink-0" />
                <span className="truncate">{formatDate(previousStory.createdAt, language)}</span>
              </div>
            )}
          </div>

          {/* Mobile connecting indicator */}
          <div className="md:hidden flex justify-center -my-2 text-primary/60">
            <ArrowRight className="w-4 h-4 rotate-90" />
          </div>

          {/* Step 2: Current Active Anchor (Highlight) */}
          <div className="bg-primary/5 border-2 border-primary rounded-2xl p-5 flex flex-col justify-between space-y-4 relative shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                  <GitCommit className="w-3.5 h-3.5 shrink-0" />
                  <span className="md:hidden">२.</span>
                  {language === "en" ? "Active Focal Point" : "वर्तमान प्रत्यक्ष घटना"}
                </span>
                <span className="text-xxs px-2 py-0.5 rounded-full bg-primary text-white font-black animate-pulse">
                  {language === "en" ? "Current" : "अहिले"}
                </span>
              </div>
              <h4 className="text-xs font-black text-card-foreground line-clamp-3 leading-snug break-words">
                {getTitle(currentArticle)}
              </h4>
            </div>
            <div className="text-[10px] font-bold text-primary flex items-center gap-1 pt-2 border-t border-primary/20">
              <Clock className="w-3 h-3 shrink-0" />
              <span className="truncate">{formatDate(currentArticle.createdAt, language)}</span>
            </div>
          </div>

          {/* Mobile connecting indicator */}
          <div className="md:hidden flex justify-center -my-2 text-primary/60">
            <ArrowRight className="w-4 h-4 rotate-90" />
          </div>

          {/* Step 3: What Happens Next / Follow-Up */}
          <div className="bg-muted-area/50 border border-border-theme/70 rounded-2xl p-5 flex flex-col justify-between space-y-4 relative group hover:border-primary/50 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-text flex items-center gap-1">
                  <span className="md:hidden">३.</span>
                  {language === "en" ? "Next Development" : "आगामी विकासक्रम"}
                  <ArrowRight className="w-3 h-3 text-muted-text hidden md:inline" />
                </span>
                <span className="text-xxs px-2 py-0.5 rounded-full bg-border-theme/40 text-muted-text font-bold">
                  {language === "en" ? "Evolution" : "विकास"}
                </span>
              </div>
              {followUpStory ? (
                <Link to={`/article/${followUpStory.id}`} className="block">
                  <h4 className="text-xs font-black text-card-foreground group-hover:text-primary transition-colors line-clamp-3 leading-snug break-words">
                    {getTitle(followUpStory)}
                  </h4>
                </Link>
              ) : (
                <p className="text-xs font-medium text-muted-text italic">
                  {language === "en" ? "Our newsroom is tracking evolving updates on this story." : "हाम्रो समाचार कक्षले यस घटनाको थप विकासक्रम अनुगमन गरिरहेको छ।"}
                </p>
              )}
            </div>
            {followUpStory ? (
              <div className="text-[10px] font-bold text-muted-text flex items-center gap-1 pt-2 border-t border-border-theme/40">
                <Clock className="w-3 h-3 text-primary shrink-0" />
                <span className="truncate">{formatDate(followUpStory.createdAt, language)}</span>
              </div>
            ) : (
              <div className="text-[10px] font-bold text-primary flex items-center gap-1 pt-2 border-t border-border-theme/40">
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>{language === "en" ? "Live Monitoring Active" : "प्रत्यक्ष निगरानी जारी"}</span>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default ArticleStoryNetwork;
