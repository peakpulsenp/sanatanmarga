import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import type { Article } from "@/src/types";
import { formatDate } from "@/src/lib/utils";
import { useLanguage } from "@/src/context/LanguageContext";

interface FeaturedStoriesGridProps {
  featuredArticles?: Article[];
  latestNews?: Article[];
  trendingNews?: Article[];
  onShare?: (article: Article) => void;
}

export default function FeaturedStoriesGrid({
  latestNews = [],
  trendingNews = [],
}: FeaturedStoriesGridProps) {
  const { language } = useLanguage();

  // Pick 6 Trending / Editor's Picks
  const trendingStories = trendingNews.length >= 6 
    ? trendingNews.slice(0, 6) 
    : latestNews.slice(0, 6);

  if (trendingStories.length === 0) return null;

  return (
    <section id="trending-editor-picks-section" className="w-full py-8 bg-background border-b border-border-theme/40">
      <div className="container-custom px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between pb-3 mb-5 border-b border-border-theme/60">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 bg-primary rounded-full" />
            <h2 className="text-sm md:text-base font-black text-card-foreground uppercase tracking-tight flex items-center gap-1.5">
              <Flame size={16} className="text-primary" />
              <span>{language === 'en' ? 'Trending & Editor Picks' : 'ट्रेन्डिङ तथा सम्पादकीय रोजाई'}</span>
            </h2>
          </div>
          <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest hidden sm:inline-block">
            Verified Integrity
          </span>
        </div>

        {/* Grid layout of 6 Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {trendingStories.map((story, idx) => (
            <Link
              key={`${story.id || 'tr'}-trend-${idx}`}
              to={`/article/${story.id}`}
              className="group flex flex-col justify-between gap-3 p-3.5 rounded-2xl bg-card border border-border-theme shadow-xs hover:shadow-md hover:border-primary/30 transition-all duration-250 min-h-[120px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-primary/20 group-hover:text-primary/45 transition-colors font-mono">
                  #{idx + 1}
                </span>
                <span className="text-[9px] font-bold text-muted-text uppercase tracking-wider font-mono">
                  {formatDate(story.createdAt)}
                </span>
              </div>

              <h3 className="text-xs font-bold text-card-foreground group-hover:text-primary transition-colors leading-snug line-clamp-3">
                {story.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
