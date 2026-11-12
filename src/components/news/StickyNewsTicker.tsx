import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, ChevronRight, TrendingUp, Radio } from "lucide-react";
import { useLanguage } from "@/src/context/LanguageContext";
import type { Article } from "@/src/types";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { motion, AnimatePresence } from "motion/react";
import { getCategoryDisplayName } from "@/src/utils/categoryHelper";

interface StickyNewsTickerProps {
  articles?: Article[];
}

export default function StickyNewsTicker({ articles: propArticles }: StickyNewsTickerProps) {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [fetchedArticles, setFetchedArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (propArticles && propArticles.length > 0) return;

    let isMounted = true;
    const fetchArticles = async () => {
      try {
        const hpSnap = await snapshotEngine.getHomepageSnapshot();
        const raw = [
          ...((hpSnap as any)?.heroArticles || []),
          ...((hpSnap as any)?.hero ? [(hpSnap as any).hero] : []),
          ...(hpSnap?.breakingNews || []),
          ...(hpSnap?.latestNews || []),
          ...(hpSnap?.trendingNews || [])
        ];

        const map = new Map<string, Article>();
        raw.forEach((a: any) => {
          if (a && a.id) map.set(a.id, a);
        });

        const unique = Array.from(map.values());
        if (isMounted && unique.length > 0) {
          setFetchedArticles(unique);
        }
      } catch (err) {
        console.warn("StickyNewsTicker snapshot fetch error:", err);
      }
    };

    fetchArticles();
    return () => { isMounted = false; };
  }, [propArticles]);

  const activeArticles = (propArticles && propArticles.length > 0) ? propArticles : fetchedArticles;

  // Resilient fallback logic: Prioritize breaking and featured news, but also include normal news so ticker has multiple items to scroll
  const sortedArticles = [...activeArticles].sort((a, b) => {
    const aVal = (a.isBreaking ? 3 : 0) + (a.isFeatured ? 1 : 0);
    const bVal = (b.isBreaking ? 3 : 0) + (b.isFeatured ? 1 : 0);
    return bVal - aVal;
  });

  const displayArticles = sortedArticles.slice(0, 15);

  useEffect(() => {
    if (isPaused || displayArticles.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % displayArticles.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, displayArticles.length]);

  if (displayArticles.length === 0) return null;

  const current = displayArticles[currentIndex] || displayArticles[0];

  return (
    <div 
      className="bg-zinc-950 text-white border-y border-zinc-800 py-2.5 px-4 shadow-md sticky top-[60px] lg:top-[90px] z-30 transition-all select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container-custom flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          <Link 
            to="/latest" 
            className="bg-red-600 text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 shadow-lg shadow-red-600/30 hover:bg-red-700 transition-colors animate-pulse"
          >
            <Zap size={12} className="fill-white" />
            {language === 'en' ? 'Recent Updates' : 'ताजा अपडेट'}
          </Link>

          <div className="overflow-hidden relative h-6 flex-1 flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full flex items-center"
              >
                <Link 
                  to={`/article/${current.id}`}
                  className="text-xs lg:text-sm font-bold text-zinc-200 hover:text-amber-400 truncate flex items-center gap-2 transition-colors w-full"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span className="truncate">{current.title}</span>
                  <span className="text-[10px] text-zinc-400 font-mono shrink-0 hidden sm:inline bg-zinc-800/80 px-1.5 py-0.5 rounded">
                    {getCategoryDisplayName(current.categoryId, language)}
                  </span>
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 shrink-0 text-xs font-semibold text-zinc-400">
          <Link to="/latest" className="flex items-center gap-1 hover:text-amber-400 transition-colors">
            {language === 'en' ? 'More Live Feeds' : 'थप अपडेटहरू'} <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
