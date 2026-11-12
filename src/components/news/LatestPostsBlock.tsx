import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Eye, ChevronRight, Share2, ChevronDown } from "lucide-react";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { formatDate, parseTimestamp } from "@/src/lib/utils";
import type { Article } from "@/src/types";
import { subDays } from "date-fns";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { shareToChautari } from "@/src/utils/shareUtils";
import { useAuth } from "@/src/lib/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "@/src/context/LanguageContext";

export default function LatestPostsBlock({ 
  initialArticles, 
  onShare 
}: { 
  initialArticles: Article[], 
  onShare?: (article: Article) => void 
}) {
  const { t, language, getLocalized } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"day" | "week" | "month" | "all" | "category">("day");
  const [selectedCategory, setSelectedCategory] = useState<string>("samachar");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadArticles = async () => {
      setLoading(true);
      try {
        const hpSnap = await snapshotEngine.getHomepageSnapshot(language as any);
        const latestFromSnap = hpSnap.latestNews || hpSnap.featuredArticles || [];
        const combined = [...latestFromSnap, ...(initialArticles || [])];
        
        const uniqueMap = new Map<string, Article>();
        combined.forEach(a => {
          const key = a.id || (a.title ? a.title.trim().toLowerCase() : Math.random().toString());
          if (!uniqueMap.has(key)) uniqueMap.set(key, a);
        });
        const pool = Array.from(uniqueMap.values());

        if (!isMounted) return;

        if (filter === "day") {
          const now = new Date();
          const last72h = now.getTime() - 72 * 60 * 60 * 1000;
          const recentOnly = pool.filter(a => parseTimestamp(a.createdAt) >= last72h);
          const articlesToDisplay = recentOnly.length > 0 ? recentOnly : pool;
          setArticles(articlesToDisplay.slice(0, 6));
        } else if (filter === "category") {
          const categoryOnly = pool.filter(a => a.categoryId === selectedCategory || a.categorySlug === selectedCategory || a.category === selectedCategory);
          setArticles(categoryOnly.length > 0 ? categoryOnly.slice(0, 6) : pool.slice(0, 6));
        } else {
          let startDate: Date;
          const now = new Date();
          if (filter === "week") startDate = subDays(now, 7);
          else if (filter === "month") startDate = subDays(now, 30);
          else startDate = subDays(now, 3650);

          const filteredByDate = pool.filter(a => parseTimestamp(a.createdAt) >= startDate.getTime());
          const listToScore = filteredByDate.length > 0 ? filteredByDate : pool;
          const scored = listToScore.map(a => ({
            ...a,
            score: (a.views || 0) + ((a.commentCount || 0) * 5)
          }));
          setArticles(scored.sort((a, b) => b.score - a.score).slice(0, 6));
        }
      } catch (err) {
        console.warn("Failed to load latest posts from snapshot, using initialArticles:", err);
        if (isMounted) {
          setArticles((initialArticles || []).slice(0, 6));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadArticles();
    return () => {
      isMounted = false;
    };
  }, [filter, selectedCategory, initialArticles, language]);

  const handleShareToChautari = async (e: React.MouseEvent, article: Article) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate("/login");
    
    if (onShare) {
      onShare(article);
    } else {
      try {
        const postId = await shareToChautari(article, user as any);
        if (postId) {
          toast.success(language === 'en' ? "Shared to Chautari!" : "चौतारीमा साझा गरियो!");
          navigate(`/community/post/${postId}`);
        }
      } catch (err) {
        console.error("Error sharing to Chautari:", err);
        toast.error(language === 'en' ? "Failed to share." : "साझा गर्न असमर्थ भयो।");
      }
    }
  };

  return (
    <div className="bg-card p-6 md:p-8 rounded-[40px] shadow-sm border border-border-theme">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-8 md:mb-10">
        <div className="flex flex-col gap-1">
          <motion.h3 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-xl md:text-2xl font-black text-card-foreground uppercase tracking-tight"
          >
            {t("latestNews")}
          </motion.h3>
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: 64 }}
            className="h-1.5 bg-primary rounded-full"
          ></motion.div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Sub-Category selector (only visible if filter is 'category') */}
          {filter === "category" && (
            <div className="flex items-center gap-1 bg-muted-area/50 p-1 rounded-xl border border-border-theme">
              {[
                { id: "samachar", label: language === 'en' ? "News" : "समाचार" },
                { id: "vichar", label: language === 'en' ? "Opinion" : "विचार" },
                { id: "adhyatma", label: language === 'en' ? "Spiritual" : "अध्यात्म" },
                { id: "kala", label: language === 'en' ? "Arts" : "कला" },
                { id: "vigyan", label: language === 'en' ? "Science" : "विज्ञान" }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                    selectedCategory === cat.id
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-text hover:text-card-foreground hover:bg-muted-area"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* Elegant Dropdown Container */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border-theme text-primary rounded-2xl shadow-sm hover:bg-muted-area/30 transition-all font-black text-xs min-w-[140px] justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                {filter === "day"
                  ? (language === 'en' ? "Today" : "आज")
                  : filter === "week"
                  ? (language === 'en' ? "This Week" : "यो हप्ता")
                  : filter === "month"
                  ? (language === 'en' ? "This Month" : "यो महिना")
                  : filter === "all"
                  ? (language === 'en' ? "All Time" : "सबै समय")
                  : (language === 'en' ? "By Category" : "विधा अनुसार")}
              </span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isDropdownOpen && (
              <>
                {/* Overlay to close the dropdown when clicking outside */}
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border-theme rounded-2xl shadow-xl py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                  {[
                    { id: "day", label: language === 'en' ? "Today" : "आज (Today)", icon: Clock },
                    { id: "week", label: language === 'en' ? "This Week" : "यो हप्ता (This Week)", icon: Clock },
                    { id: "month", label: language === 'en' ? "This Month" : "यो महिना (This Month)", icon: Clock },
                    { id: "all", label: language === 'en' ? "All Time" : "सबै समय (All Time)", icon: Clock },
                    { id: "category", label: language === 'en' ? "By Category" : "विधा अनुसार (By Category)", icon: Clock }
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          setFilter(option.id as any);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4.5 py-2.5 text-xs font-bold transition-all flex items-center gap-2 hover:bg-muted-area/50 ${
                          filter === option.id
                            ? "text-primary bg-primary/5 font-black"
                            : "text-card-foreground hover:text-primary"
                        }`}
                      >
                        <Icon size={12} className={filter === option.id ? "text-primary" : "text-muted-text"} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-5 p-4">
                <Skeleton className="w-20 h-20 md:w-28 md:h-28 rounded-2xl flex-shrink-0" />
                <div className="flex flex-col gap-3 flex-grow py-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </div>
              </div>
            ))
          ) : (
            articles.map((article, index) => {
              const localizedTitle = getLocalized(article, "title") || article.title;
              return (
                <motion.div 
                  key={`${article.id || 'latest'}-feed-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                  className="relative group"
                >
                  <Link 
                    to={`/article/${article.id}`} 
                    className="flex items-center gap-5 md:gap-7 p-4 rounded-[32px] hover:bg-muted-area/50 transition-all border border-transparent hover:border-border-theme/50 shadow-sm hover:shadow-[0_15px_40px_-15px_rgba(0,114,181,0.15)] h-full group/card bg-card/20"
                  >
                    <div className="relative w-20 h-20 md:w-28 md:h-28 flex-shrink-0 overflow-hidden rounded-[24px] shadow-lg border border-border-theme/30">
                      <img 
                        src={article.featuredImage || null} 
                        alt={localizedTitle}
                        className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/5 group-hover/card:bg-transparent transition-colors"></div>
                    </div>
                    <div className="flex flex-col gap-3 flex-grow pr-10">
                      <h4 className="text-sm md:text-xl font-black text-card-foreground group-hover/card:text-primary leading-tight line-clamp-2 transition-colors tracking-tight">
                        {localizedTitle}
                      </h4>
                      <div className="flex items-center gap-5 text-[10px] md:text-[11px] font-black text-muted-text uppercase tracking-widest">
                        <span className="flex items-center gap-2 bg-muted-area/50 px-3 py-1.5 rounded-full"><Clock size={14} className="text-primary" /> {formatDate(article.createdAt, language)}</span>
                        <span className="hidden xs:flex items-center gap-2 px-1"><Eye size={14} className="text-primary" /> {article.views}</span>
                      </div>
                    </div>
                  </Link>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleShareToChautari(e, article)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 p-4 bg-card border border-border-theme text-primary rounded-full shadow-2xl opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all hover:bg-primary hover:text-white z-10 cursor-pointer"
                    title={language === 'en' ? "Share to Chautari" : "चौतारीमा साझा गर्नुहोस्"}
                  >
                    <Share2 size={18} />
                  </motion.button>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <div className="mt-10 pt-10 border-t border-border-theme flex justify-center">
        <Link 
          to={`/latest?tab=${filter}`} 
          className="group/btn relative px-10 py-4 bg-primary/5 hover:bg-primary text-primary hover:text-white rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 overflow-hidden shadow-lg shadow-primary/5 hover:shadow-primary/20"
        >
          <span className="relative z-10">{t("viewAll")}</span>
          <ChevronRight size={18} className="relative z-10 transition-transform group-hover/btn:translate-x-1" />
          <div className="absolute inset-0 bg-primary translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
        </Link>
      </div>
    </div>
  );
}
