import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { collection, query, where, orderBy, limit, getDocs, startAfter, Timestamp } from "@/src/lib/firebase";
import { db, getDocsWithCacheFallback, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { shareToChautari } from "@/src/utils/shareUtils";
import { Article } from "@/src/types";
import NepaliInput from "@/src/components/ui/NepaliInput";
import Header from "@/src/components/layout/Header";
import SEOHead from "@/src/components/common/SEOHead";
import Footer from "@/src/components/layout/Footer";
import { Link } from "react-router-dom";
import { Clock, Eye, Calendar, ChevronRight, Search, ArrowUp, MessageCircle, Share2, RefreshCw } from "lucide-react";
import { formatDate, parseTimestamp } from "@/src/lib/utils";
import { getCategoryDisplayName } from "@/src/utils/categoryHelper";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "@/src/context/LanguageContext";

type TimeRange = "just_published" | "today" | "week" | "year";

import { Skeleton } from "@/src/components/ui/Skeleton";
import { GridItemsSkeleton } from "@/src/components/ui/PageLoaders";
import CreatePostModal from "@/src/components/community/CreatePostModal";
import FloatingActions from "@/src/components/layout/FloatingActions";
import TopicsIndex from "@/src/components/news/TopicsIndex";

import { snapshotEngine } from "@/src/services/snapshotEngine";
import { continuityEngine } from "@/src/lib/continuityEngine";
import { newsStreamService } from "@/src/services/newsStreamService";
import { CANONICAL_CATEGORIES } from "@/src/constants/categories";

export default function LatestNewsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language, getLocalized } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  const initialTab: TimeRange = urlTab === "day" || urlTab === "today" 
    ? "today" 
    : urlTab === "week" 
    ? "week" 
    : urlTab === "year" 
    ? "year" 
    : "just_published";
  const [activeTab, setActiveTab] = useState<TimeRange>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTopics, setShowTopics] = useState(false);
  const [selectedArticleToShare, setSelectedArticleToShare] = useState<Article | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchArticles = useCallback(async (range: TimeRange, isLoadMore = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await newsStreamService.getLatestNewsStream(
        range,
        isLoadMore,
        isLoadMore ? lastDoc : null
      );

      let fetchedArticles = response.articles;

      // For Weekly and Yearly, apply trending algorithm if desired
      if (range === "week" || range === "year") {
        fetchedArticles = [...fetchedArticles].map(a => ({
          ...a,
          score: (a.views || 0) + ((a.commentCount || 0) * 5)
        })).sort((a: any, b: any) => b.score - a.score);
      }

      if (isLoadMore) {
        setArticles(prev => {
          // Prevent duplicates
          const existingIds = new Set(prev.map(p => p.id));
          const newArticles = fetchedArticles.filter(a => !existingIds.has(a.id));
          return [...prev, ...newArticles];
        });
      } else {
        setArticles(fetchedArticles);
      }

      setLastDoc(response.lastDoc);
      setHasMore(response.hasMore);
    } catch (err) {
      console.warn("Error fetching latest news stream, switching to continuity failover:", err);
      try {
        const fallbackArts = await continuityEngine.getRecentArticles(30);
        setArticles(fallbackArts);
      } catch (fallbackErr) {
        console.warn("Fallback fetch error:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  }, [lastDoc, loading]);

  useEffect(() => {
    setArticles([]);
    setLastDoc(null);
    setHasMore(true);
    fetchArticles(activeTab);
    setSearchParams({ tab: activeTab });

    const handleRebuilt = () => {
      fetchArticles(activeTab);
    };

    window.addEventListener("snapshot-rebuilt", handleRebuilt);
    window.addEventListener("article-created", handleRebuilt);
    window.addEventListener("article-updated", handleRebuilt);
    window.addEventListener("article-published", handleRebuilt);
    window.addEventListener("storage", handleRebuilt);

    return () => {
      window.removeEventListener("snapshot-rebuilt", handleRebuilt);
      window.removeEventListener("article-created", handleRebuilt);
      window.removeEventListener("article-updated", handleRebuilt);
      window.removeEventListener("article-published", handleRebuilt);
      window.removeEventListener("storage", handleRebuilt);
    };
  }, [activeTab]);

  const lastArticleRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchArticles(activeTab, true);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore, activeTab, fetchArticles]);

  const filteredArticles = articles.filter(art => {
    const title = getLocalized(art, 'title').toLowerCase();
    const excerpt = getLocalized(art, 'excerpt').toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = title.includes(q) || excerpt.includes(q) || (art.title && art.title.toLowerCase().includes(q));
    
    if (selectedCategory !== "all") {
      const artCat = (art.categoryName || art.categoryId || art.category || "").toLowerCase();
      const matchesCat = artCat.includes(selectedCategory.toLowerCase());
      return matchesSearch && matchesCat;
    }
    return matchesSearch;
  }).sort((a, b) => {
    const tA = parseTimestamp(a.canonicalPublishedAt || a.publishedAt || "");
    const tB = parseTimestamp(b.canonicalPublishedAt || b.publishedAt || "");
    return tB - tA;
  });

  const handleShare = (e: React.MouseEvent, article: Article) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate("/login");
    setSelectedArticleToShare(article);
    setShowShareModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={language === 'en' ? "Latest News - Breaking & Current Affairs" : "ताजा समाचार - पलपलको खबर"}
        description={language === 'en' 
          ? "Read breaking and latest news stories, political updates, economy, and social coverage on Sanatan Marga."
          : "सनातन मार्गमा पलपलका ताजा समाचार, देश-विदेशका प्रमुख घटनाक्रम, राजनीति, अर्थतन्त्र र सामाजिक क्षेत्रका तत्काल अपडेटहरू।"}
        url="/latest"
        keywords={["ताजा समाचार", "पलपलको खबर", "Nepal Breaking News", "Latest News Nepal", "Sanatan News"]}
      />
      <Header />
      
      <main className="flex-grow py-12">
        <div className="container-custom">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-card-foreground tracking-tight uppercase">
                  {language === 'en' ? "Latest News" : "ताजा समाचार"}
                </h1>
                <p className="text-muted-text font-medium">
                  {language === 'en' ? "Breaking updates and latest publications" : "भर्खरैका र महत्वपूर्ण समाचारहरू"}
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text z-10" size={18} />
                  <NepaliInput 
                    value={searchQuery}
                    onChange={(val) => setSearchQuery(val)}
                    placeholder={language === 'en' ? "Search news..." : "खोज्नुहोस्..."}
                    className="w-full bg-card border-border-theme border rounded-2xl py-3 pl-12 pr-4 text-sm font-medium shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all text-card-foreground placeholder:text-muted-text/30"
                  />
                </div>

                <div className="flex bg-card p-1.5 rounded-2xl shadow-sm border border-border-theme w-full md:w-auto overflow-x-auto gap-1 items-center">
                  {(["just_published", "today", "week", "year"] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setActiveTab(range)}
                      className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all cursor-pointer ${
                        activeTab === range 
                          ? "bg-primary text-white shadow-lg shadow-primary/20" 
                          : "text-muted-text hover:text-card-foreground hover:bg-muted-area"
                      }`}
                    >
                      {range === "just_published"
                        ? (language === 'en' ? "Just Published" : "भर्खरै")
                        : range === "today"
                        ? (language === 'en' ? "Today" : "आज") 
                        : range === "week" 
                        ? (language === 'en' ? "This Week" : "यो हप्ता") 
                        : (language === 'en' ? "This Year" : "यो वर्ष")}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setArticles([]);
                      setLastDoc(null);
                      fetchArticles(activeTab);
                    }}
                    disabled={loading}
                    title={language === 'en' ? "Refresh Feed" : "ताजा अपडेट"}
                    className="p-2.5 text-muted-text hover:text-primary rounded-xl hover:bg-muted-area transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={loading ? "animate-spin text-primary" : ""} />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filter Bar ("श्रेणी अनुसार" / According to Category) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : "bg-card border border-border-theme text-muted-text hover:text-card-foreground hover:bg-muted-area"
                }`}
              >
                {language === 'en' ? "All Categories" : "सबै विधा"}
              </button>
              {CANONICAL_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.nameNepali)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.nameNepali
                      ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                      : "bg-card border border-border-theme text-muted-text hover:text-card-foreground hover:bg-muted-area"
                  }`}
                >
                  {cat.nameNepali}
                </button>
              ))}
            </div>

            {loading && articles.length === 0 ? (
              <GridItemsSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredArticles.map((article, index) => {
                    const title = getLocalized(article, 'title');
                    const excerpt = getLocalized(article, 'excerpt');
                    return (
                      <motion.div
                        key={`${article.id || 'article'}-${index}`}
                        id={`article-${article.id}`}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        ref={index === filteredArticles.length - 1 ? lastArticleRef : null}
                        className="group bg-card rounded-3xl overflow-hidden border border-border-theme shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-primary/10 transition-all flex flex-col"
                      >
                        <Link to={`/article/${article.id}`} className="relative aspect-[16/10] overflow-hidden block">
                          <img 
                            src={article.featuredImage || null} 
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </Link>
                        
                        <div className="p-8 flex flex-col gap-4 flex-grow">
                          <div className="flex items-center gap-3">
                            <span className="bg-primary/10 text-primary text-xxs font-black px-3 py-1 rounded-full uppercase tracking-widest border border-primary/20">
                              {getCategoryDisplayName(article.categoryId, language)}
                            </span>
                            <span className="text-xxs font-bold text-muted-text uppercase tracking-widest flex items-center gap-1">
                              <Clock size={12} className="text-primary" /> {formatDate(article.canonicalPublishedAt || article.publishedAt || "", language)}
                            </span>
                          </div>

                          <Link to={`/article/${article.id}`}>
                            <h2 className="text-xl font-black text-card-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2 tracking-tight">
                              {title}
                            </h2>
                          </Link>

                          <p className="text-sm text-muted-text font-medium line-clamp-3 leading-relaxed">
                            {excerpt}
                          </p>

                          <div className="mt-auto pt-6 border-t border-border-theme flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xxs font-bold text-muted-text uppercase tracking-widest">
                              <span className="flex items-center gap-1"><Eye size={12} className="text-primary" /> {article.views}</span>
                              <span className="flex items-center gap-1"><MessageCircle size={12} className="text-primary" /> {article.commentCount || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => handleShare(e, article)}
                                className="p-2 text-muted-text hover:text-primary hover:bg-primary/5 rounded-xl transition-all cursor-pointer"
                                title={language === 'en' ? "Share to Chautari" : "चौतारीमा साझा गर्नुहोस्"}
                              >
                                <Share2 size={16} />
                              </button>
                              <Link to={`/article/${article.id}`} className="text-primary hover:translate-x-1 transition-transform">
                                <ChevronRight size={20} />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {loading && articles.length > 0 && (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {!loading && filteredArticles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
                <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center text-muted-text border border-border-theme">
                  <Calendar size={40} />
                </div>
                <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight">
                  {language === 'en' ? "No Stories Found" : "कुनै समाचार भेटिएन"}
                </h3>
                <p className="text-muted-text font-medium">
                  {searchQuery 
                    ? (language === 'en' ? `No results found for "${searchQuery}".` : `"${searchQuery}" को लागि कुनै परिणाम भेटिएन।`) 
                    : (language === 'en' ? "No stories published in this time period." : "यस अवधिमा कुनै समाचार प्रकाशित भएको छैन।")}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      
      <CreatePostModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        initialData={selectedArticleToShare ? {
          title: language === 'en' ? `Discussion on: ${getLocalized(selectedArticleToShare, 'title')}` : `समाचार बारे अपडेट: ${selectedArticleToShare.title}`,
          content: `${getLocalized(selectedArticleToShare, 'excerpt')}\n\n${language === 'en' ? "What are your thoughts on this? Let's discuss." : "यस बारे तपाईंको के धारणा छ? छलफल गरौं।"}`,
          imageUrl: selectedArticleToShare.featuredImage,
          category: "News",
          linkedArticleId: selectedArticleToShare.id
        } : undefined}
      />

      <FloatingActions articles={filteredArticles} />
    </div>
  );
}
