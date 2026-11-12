import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Eye, TrendingUp, ChevronRight, Hash } from "lucide-react";
import { collection, query, where, orderBy, limit } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { getCategoryDisplayName } from "@/src/utils/categoryHelper";
import { formatDate, extractHashtags } from "@/src/lib/utils";
import type { Article, CommunityPost } from "@/src/types";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { continuityEngine } from "@/src/lib/continuityEngine";
import { useLanguage } from "@/src/context/LanguageContext";
import SEOHead from "@/src/components/common/SEOHead";

import { TrendingSkeleton } from "@/src/components/ui/PageLoaders";

export default function TrendingPage() {
  const { t, language, getLocalized } = useLanguage();
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<[string, number][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        let organic: Article[] = [];
        const snap = await snapshotEngine.getTrendingSnapshot();
        if (snap && snap.trendingNews && snap.trendingNews.length > 0) {
          organic = snap.trendingNews.filter((a: any) => !a.isAd && !a.isSponsored && !a.position && (!a.linkUrl || (a.content && a.content.length > 20)));
        }

        // Fallback to continuity engine articles if empty
        if (organic.length === 0) {
          try {
            const docsList = await continuityEngine.getRecentArticles(15);
            organic = [...docsList].sort((a, b) => (b.views || 0) - (a.views || 0));
          } catch (dbErr) {
            console.warn("Continuity trending fallback query failed:", dbErr);
          }
        }

        setTrendingArticles(organic);

        // Extract trending hashtags dynamically from these articles
        const hashtagsMap: Record<string, number> = {};
        organic.forEach(art => {
          const contentText = `${art.title} ${art.content || ""} ${art.excerpt || ""}`;
          const tags = extractHashtags ? extractHashtags(contentText) : [];
          tags.forEach(tag => {
            const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
            hashtagsMap[cleanTag] = (hashtagsMap[cleanTag] || 0) + 1;
          });
        });

        // Add default Sanatan trending hashtags if none are found
        if (Object.keys(hashtagsMap).length === 0) {
          hashtagsMap["#धर्म"] = 10;
          hashtagsMap["#संस्कृति"] = 8;
          hashtagsMap["#नेपाल"] = 7;
          hashtagsMap["#पञ्चाङ्ग"] = 5;
          hashtagsMap["#समाचार"] = 4;
        }

        const sortedTags = Object.entries(hashtagsMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8);
        setTrendingHashtags(sortedTags);
      } catch (error) {
        console.warn("Error fetching trending data, using failover:", error);
        try {
          const fallbackArts = await continuityEngine.getRecentArticles(15);
          setTrendingArticles(fallbackArts);
        } catch (fErr) {
          console.warn("Failover trending fetch failed:", fErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  if (loading) return <TrendingSkeleton />;

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      <SEOHead
        title={language === 'en' ? "Trending News & Topics" : "ट्रेन्डिङ - चर्चित समाचार र विषयहरू"}
        description={language === 'en' ? "Explore most read, viral, and trending stories across Nepal and the diaspora on Sanatan Marga." : "हाम्रो विशेष एल्गोरिदमद्वारा छानिएका अहिलेका सबैभन्दा लोकप्रिय र चर्चामा रहेका समाचारहरू।"}
        url="/trending"
      />
      <Header />
      
      <main className="flex-grow py-12">
        <div className="container-custom">
          {/* Page Header */}
          <div className="flex flex-col gap-8 mb-12">
            <div className="flex items-center gap-3 text-accent transition-transform hover:scale-[1.02]">
              <TrendingUp size={32} strokeWidth={3} />
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-card-foreground">
                {language === 'en' ? "Trending" : "ट्रेन्डिङ"}
              </h1>
            </div>
            
            {/* Trending Hashtags */}
            {trendingHashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {trendingHashtags.map(([tag, count]) => (
                  <Link 
                    key={tag}
                    to={`/search?q=${encodeURIComponent(tag)}`}
                    className="flex items-center gap-1.5 bg-muted-area text-muted-text hover:text-primary hover:bg-primary/10 px-4 py-2 rounded-full text-xs font-bold transition-all border border-border-theme"
                  >
                    <Hash size={14} /> {tag} ({count})
                  </Link>
                ))}
              </div>
            )}
            
            <p className="text-muted-text font-medium max-w-2xl">
              {language === 'en' 
                ? "The most read, shared, and discussed stories curated algorithmically across the network."
                : "हाम्रो विशेष एल्गोरिदमद्वारा छानिएका अहिलेका सबैभन्दा लोकप्रिय र चर्चामा रहेका समाचारहरू र चौतारीका विषयहरू।"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trendingArticles.map((article, index) => {
              const title = getLocalized(article, 'title');
              return (
                <Link 
                  key={`${article.id || 'trend'}-${index}`} 
                  to={`/article/${article.id}`}
                  className="group bg-card rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-border-theme flex flex-col"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={article.featuredImage || null} 
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 bg-accent text-white text-xxs font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                      #{index + 1} Trending
                    </div>
                  </div>
                  <div className="p-8 flex flex-col gap-4 flex-grow">
                    <div className="flex items-center gap-2 text-xxs font-black text-primary uppercase tracking-widest">
                      {getCategoryDisplayName(article.categoryId, language)}
                    </div>
                    <h2 className="text-xl font-black text-card-foreground group-hover:text-primary transition-colors leading-tight line-clamp-3">
                      {title}
                    </h2>
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-border-theme">
                      <div className="flex items-center gap-4 text-xxs font-bold text-muted-text uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Clock size={14} /> {formatDate(article.createdAt, language)}</span>
                        <span className="flex items-center gap-1.5 text-primary"><Eye size={14} /> {article.views}</span>
                      </div>
                      <ChevronRight size={20} className="text-muted-text group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
