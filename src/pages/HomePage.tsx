import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Eye, TrendingUp, ChevronRight, Play, ChevronLeft, Compass, BookOpen, Users, Newspaper } from "lucide-react";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import Sidebar from "@/src/components/layout/Sidebar";
import FloatingActions from "@/src/components/layout/FloatingActions";
import MultimediaZone from "@/src/components/news/MultimediaZone";
import LatestPostsBlock from "@/src/components/news/LatestPostsBlock";
import { formatDate, parseTimestamp } from "@/src/lib/utils";
import { getArticlePublicationTimestamp } from "@/src/utils/dateEngine";
import CategoryBlock from "@/src/components/news/CategoryBlock";
import AdBanner from "@/src/components/ads/AdBanner";
import MarketDataWidget from "@/src/components/news/MarketDataWidget";
import HeroFeaturedSlider from "@/src/components/news/HeroFeaturedSlider";
import SEOHead from "@/src/components/common/SEOHead";
import type { Article, Category } from "@/src/types";
import { motion, AnimatePresence } from "motion/react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableSection } from "@/src/components/news/SortableSection";
import { HomeSkeleton, CommunitySkeleton } from "@/src/components/ui/PageLoaders";
import PushNotificationPrompt from "@/src/components/ui/PushNotificationPrompt";
import CreatePostModal from "@/src/components/community/CreatePostModal";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { CANONICAL_CATEGORIES, normalizeArticleCategory } from "@/src/constants/categories";
import { continuityEngine } from "@/src/lib/continuityEngine";
import { contentEventBus } from "@/src/lib/contentEventBus";
import { offlineQueue, setDocWithQueue } from "@/src/lib/offlineQueue";
import { db, doc, safeOnSnapshot } from "@/src/lib/firebase";
import { useLanguage } from "@/src/context/LanguageContext";
import { FeatureGate } from "@/src/context/FeatureControlContext";
import { preloadAllRecentNewsAudio } from "@/src/services/ttsClient";

// Import the new modular homepage experience components
import AnnouncementsSystem from "@/src/components/news/AnnouncementsSystem";
import NepalInteractiveMap from "@/src/components/news/NepalInteractiveMap";
import SaraswatiKnowledgeShowcase from "@/src/components/news/SaraswatiKnowledgeShowcase";
import CommunityOnboarding from "@/src/components/news/CommunityOnboarding";

import CinematicHeroVideo, { HeroConfig } from "@/src/components/news/CinematicHeroVideo";
import BreakingNewsStrip from "@/src/components/news/BreakingNewsStrip";
import CategoryNavGrid from "@/src/components/news/CategoryNavGrid";
import FeaturedStoriesGrid from "@/src/components/news/FeaturedStoriesGrid";
import EditorialBentoGrid from "@/src/components/news/EditorialBentoGrid";
import { safeLocalStorage } from "@/src/lib/safeStorage";
import SectionErrorBoundary from "@/src/components/common/SectionErrorBoundary";

import DistrictIntelligenceHub from "@/src/components/nepal/DistrictIntelligenceHub";
import IntelligenceWidgets from "@/src/components/news/IntelligenceWidgets";
import VedicAudioHub from "@/src/components/media/VedicAudioHub";
import PatroTools from "@/src/components/nepal/PatroTools";

export default function HomePage() {
  const { t, language } = useLanguage();

  // Helper to read initial cached snapshot synchronously
  const getInitialSnapshot = () => {
    try {
      const lang = language === "en" ? "en" : "ne";
      const cached = safeLocalStorage.getItem(`sg_snapshot_homepage_${lang}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }
    return null;
  };

  const initialSnap = getInitialSnapshot();

  const [featuredArticles, setFeaturedArticles] = useState<Article[]>(() => initialSnap?.featuredArticles || []);
  const [latestNews, setLatestNews] = useState<Article[]>(() => initialSnap?.latestNews || []);
  const [breakingNews, setBreakingNews] = useState<Article[]>(() => initialSnap?.breakingNews || []);
  const [videoNews, setVideoNews] = useState<Article[]>(() => initialSnap?.videoNews || []);
  const [categories, setCategories] = useState<Category[]>(() => initialSnap?.categories || []);
  const [categoryArticles, setCategoryArticles] = useState<Record<string, Article[]>>(() => initialSnap?.categoryArticles || {});

  const [isHeroHidden, setIsHeroHidden] = useState(() => {
    return safeLocalStorage.getItem("homepageHeroHidden") === "true";
  });
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(() => {
    try {
      const stored = safeLocalStorage.getItem("sanatan_homepage_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.hero) return parsed.hero;
      }
    } catch (e) {}
    return {
      enabled: true,
      type: "youtube",
      videoUrl: "https://www.youtube.com/watch?v=1La4QzGeaaQ",
      title: "Sanatan Marga",
      subtitle: "Nepal's Civilizational Media Network",
      ctaText: "Latest News",
      allowUserHide: true,
    };
  });

  const [layoutConfig, setLayoutConfig] = useState<any>(() => {
    try {
      const stored = safeLocalStorage.getItem("sanatan_homepage_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.layout) return parsed.layout;
      }
    } catch (e) {}
    return {
      hero: true,
      breakingNews: true,
      categoryGrid: true,
      featuredStories: true,
      latestNews: true,
      categoryBlocks: true,
      districtIntelligence: true,
      knowledgeOS: true,
      communityOnboarding: true,
    };
  });

  const [pinnedHeadlines, setPinnedHeadlines] = useState<string[]>(() => {
    try {
      const stored = safeLocalStorage.getItem("sanatan_homepage_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.pinnedBreakingHeadlines)) return parsed.pinnedBreakingHeadlines;
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    const applyHomepageSettings = (data: any) => {
      if (!data) return;
      if (data.hero) setHeroConfig(data.hero);
      if (data.layout) setLayoutConfig((prev: any) => ({ ...prev, ...data.layout }));
      if (Array.isArray(data.pinnedBreakingHeadlines)) setPinnedHeadlines(data.pinnedBreakingHeadlines);
    };

    const unsub = safeOnSnapshot(
      doc(db, "settings", "homepage"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          applyHomepageSettings(data);
          safeLocalStorage.setItem("sanatan_homepage_settings", JSON.stringify(data));
        }
      },
      "homepage_settings_live"
    );

    const handleSettingsEvent = (e: any) => {
      if (e?.detail) applyHomepageSettings(e.detail);
    };
    window.addEventListener("sanatan_homepage_settings_updated", handleSettingsEvent);

    return () => {
      if (typeof unsub === "function") unsub();
      window.removeEventListener("sanatan_homepage_settings_updated", handleSettingsEvent);
    };
  }, []);

  useEffect(() => {
    const handleHeroVis = () => {
      setIsHeroHidden(safeLocalStorage.getItem("homepageHeroHidden") === "true");
    };
    window.addEventListener("hero-visibility-changed", handleHeroVis);
    return () => window.removeEventListener("hero-visibility-changed", handleHeroVis);
  }, []);

  const handleHideHero = () => {
    safeLocalStorage.setItem("homepageHeroHidden", "true");
    setIsHeroHidden(true);
    window.dispatchEvent(new CustomEvent("hero-visibility-changed"));
  };

  const DEFAULT_CATEGORIES: Category[] = [
    { id: "politics", nameNepali: "राजनीति", nameEnglish: "Politics", slug: "politics", order: 1 },
    { id: "desh", nameNepali: "देश", nameEnglish: "National", slug: "desh", order: 2 },
    { id: "pradesh", nameNepali: "प्रदेश", nameEnglish: "Provinces", slug: "pradesh", order: 3 },
    { id: "economy", nameNepali: "अर्थ", nameEnglish: "Economy", slug: "economy", order: 4 },
    { id: "sports", nameNepali: "खेलकुद", nameEnglish: "Sports", slug: "sports", order: 5 },
    { id: "tech", nameNepali: "प्रविधि", nameEnglish: "Technology", slug: "tech", order: 6 },
    { id: "bishwo", nameNepali: "विश्व", nameEnglish: "World", slug: "bishwo", order: 7 },
    { id: "entertainment", nameNepali: "मनोरञ्जन", nameEnglish: "Entertainment", slug: "entertainment", order: 8 }
  ];

  const getCategoryArticles = (catSlug?: string, catId?: string): Article[] => {
    const slug = (catSlug || "").toLowerCase();
    const id = (catId || "").toLowerCase();
    const norm = normalizeArticleCategory(catSlug || catId);
    const normSlug = (norm.categorySlug || "").toLowerCase();
    const normId = (norm.categoryId || "").toLowerCase();

    const direct = (
      categoryArticles[slug] ||
      categoryArticles[id] ||
      categoryArticles[normSlug] ||
      categoryArticles[normId] ||
      []
    );

    const pool = [...latestNews, ...featuredArticles, ...mostReadNews];
    const poolMatched = pool.filter(a => {
      if (!a) return false;
      const catName = String(a.categoryName || a.category || "").toLowerCase();
      const catSlugStr = String(a.categorySlug || a.categoryId || "").toLowerCase();
      const aNorm = normalizeArticleCategory(catSlugStr || catName, a.title, a.content || a.excerpt);

      return (
        (slug && (catSlugStr === slug || catName === slug || aNorm.categorySlug.toLowerCase() === slug)) ||
        (id && (catSlugStr === id || catName === id || aNorm.categoryId.toLowerCase() === id)) ||
        (normSlug && (catSlugStr === normSlug || aNorm.categorySlug.toLowerCase() === normSlug)) ||
        (normId && (catSlugStr === normId || aNorm.categoryId.toLowerCase() === normId))
      );
    });

    const combined = [...poolMatched, ...direct];
    const unique = Array.from(new Map(combined.filter(a => a?.id).map(a => [a.id, a])).values());
    return unique.sort((a, b) => parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt));
  };

  const [mostReadNews, setMostReadNews] = useState<Article[]>(() => initialSnap?.trendingNews || []);
  const [layout, setLayout] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(() => !(initialSnap?.featuredArticles?.length || initialSnap?.latestNews?.length));

  // Platform statistics pulled dynamically from Snapshot OS
  const [platformStats, setPlatformStats] = useState({
    articlesCount: 0,
    membersCount: 0,
    districtsCount: 77,
    resourcesCount: 0,
    discussionsCount: 0
  });
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id && layout) {
      const oldIndex = layout.findIndex((s) => s.id === active.id);
      const newIndex = layout.findIndex((s) => s.id === over.id);
      const newLayout = arrayMove(layout, oldIndex, newIndex);
      setLayout(newLayout);
      safeLocalStorage.setItem("sanatan_homepage_layout", JSON.stringify(newLayout));
      setDocWithQueue(doc(db, "settings", "homepageLayout"), {
        sections: newLayout,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => { });
    }
  };

  useEffect(() => {
    const loadSnapshot = async (forceRefresh = false) => {
      try {
        if (forceRefresh || (!featuredArticles.length && !latestNews.length)) {
          setLoading(true);
        }
        const snapshot = await snapshotEngine.getHomepageSnapshot(language === "en" ? "en" : "ne", forceRefresh);
        const newsToUse = snapshot.latestNews || [];
        const baseCats = snapshot.categories && snapshot.categories.length > 0 ? snapshot.categories : CANONICAL_CATEGORIES;
        const catMap = new Map<string, Category>();
        [...CANONICAL_CATEGORIES, ...baseCats].forEach(c => {
          const norm = normalizeArticleCategory(c.slug || c.id || c.nameNepali || c.nameEnglish);
          if (!catMap.has(norm.categorySlug)) {
            catMap.set(norm.categorySlug, {
              id: norm.categoryId,
              slug: norm.categorySlug,
              nameNepali: norm.categoryName,
              nameEnglish: c.nameEnglish || norm.categorySlug,
              order: c.order || 99
            });
          }
        });
        const rawCats = Array.from(catMap.values());
        const validCategories: Category[] = [];
        let catArticles = snapshot.categoryArticles || {};

        const normalizeKey = (value?: unknown): string =>
          String(value ?? "").trim().toLowerCase();

        // Step 1: Initialize Global Deduplication Set
        const renderedIds = new Set<string>();

        // Step 2: Deduplicate Featured Articles (Hero Section takes precedence)
        const rawFeatured = snapshot.featuredArticles || newsToUse || [];
        const finalFeatured: Article[] = [];
        rawFeatured.forEach((a: any) => {
          if (a && a.id && !renderedIds.has(a.id)) {
            finalFeatured.push(a);
            renderedIds.add(a.id);
          }
        });

        // Step 3: Deduplicate Latest News (removes any already featured)
        const finalLatest: Article[] = [];
        newsToUse.forEach((a: any) => {
          if (a && a.id && !renderedIds.has(a.id)) {
            finalLatest.push(a);
            renderedIds.add(a.id);
          }
        });

        // Step 4: Deduplicate Most Read (Trending) news (removes any already featured or in latest)
        const rawTrending = snapshot.trendingNews || newsToUse || [];
        const finalTrending: Article[] = [];
        rawTrending.forEach((a: any) => {
          if (a && a.id && !renderedIds.has(a.id)) {
            finalTrending.push(a);
            renderedIds.add(a.id);
          }
        });

        // If lists ended up empty due to strict deduplication, backfill gracefully
        if (finalFeatured.length === 0 && rawFeatured.length > 0) {
          finalFeatured.push(...rawFeatured.slice(0, 5));
        }
        if (finalLatest.length === 0 && newsToUse.length > 0) {
          finalLatest.push(...newsToUse.slice(0, 15));
        }
        if (finalTrending.length === 0 && rawTrending.length > 0) {
          finalTrending.push(...rawTrending.slice(0, 5));
        }

        rawCats.forEach((cat: any) => {
          if (cat.isHidden) return;
          const s = normalizeKey(cat.slug || cat.id);
          const n = normalizeKey(cat.nameNepali || cat.name || cat.nameEnglish);

          const isRandomId = /^[a-z0-9]{15,}$/.test(s);
          const hasRealName = n && !/^[a-z0-9]{15,}$/.test(n);

          if (
            !s ||
            s === "समाचार" ||
            s === "general" ||
            s === "news" ||
            s === "samachar" ||
            s === "undefined" ||
            s === "null" ||
            n === "समाचार" ||
            n === "news" ||
            n === "samachar" ||
            (isRandomId && !hasRealName && !["politics", "desh", "pradesh", "bishwo", "sports", "entertainment", "economy", "tech"].includes(s))
          ) {
            return;
          }

          validCategories.push(cat);

          const normCat = normalizeArticleCategory(cat.slug || cat.id || cat.nameNepali || cat.nameEnglish);
          const keys = [
            cat.id,
            cat.slug,
            cat.name,
            cat.nameNepali,
            cat.nameEnglish,
            normCat.categoryId,
            normCat.categorySlug,
            normCat.categoryName,
          ].map(normalizeKey).filter(Boolean);

          const collected: Article[] = [];

          // 1. Check snapshot.categoryArticles
          Object.entries(catArticles).forEach(([key, articles]) => {
            if (keys.includes(normalizeKey(key)) && Array.isArray(articles)) {
              collected.push(...(articles as Article[]));
            }
          });

          // 2. Always check latest news and other sections to include latest articles
          const sources = [
            ...(newsToUse || []),
            ...(snapshot.latestNews || []),
            ...(snapshot.featuredArticles || []),
            ...(snapshot.trendingNews || []),
            ...(snapshot.videoNews || []),
          ];
          sources.forEach(article => {
            if (!article) return;
            const aNorm = normalizeArticleCategory(
              article.categoryId || (article as any).categorySlug || (article as any).category || article.categoryName,
              article.title,
              article.content
            );
            const articleKeys = [
              article.categoryId,
              (article as any).categorySlug,
              (article as any).category,
              article.categoryName,
              aNorm.categoryId,
              aNorm.categorySlug,
              aNorm.categoryName
            ].map(normalizeKey).filter(Boolean);

            if (articleKeys.some(k => keys.includes(k))) {
              collected.push(article);
            }
          });

          // Deduplicate within the category
          const uniqueMatch = Array.from(
            new Map(
              collected
                .filter(a => a?.id)
                .map(a => [a.id, a])
            ).values()
          ).sort((a, b) => parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt));

          // Cascading filter: prioritize unrendered articles first to eliminate duplication
          let finalCategoryList = uniqueMatch.filter(a => !renderedIds.has(a.id));
          if (finalCategoryList.length < 3) {
            // Backfill with already rendered ones to keep grid rich
            const extra = uniqueMatch.filter(a => renderedIds.has(a.id));
            finalCategoryList = [...finalCategoryList, ...extra];
          }

          const trimmedList = finalCategoryList.slice(0, 6);

          const keySlug = normalizeKey(cat.slug || cat.id);
          if (keySlug) catArticles[keySlug] = trimmedList;
          if (cat.id) catArticles[cat.id] = trimmedList;
          if (cat.slug) catArticles[cat.slug] = trimmedList;
        });

        const finalCategories = validCategories.length > 0 ? validCategories : DEFAULT_CATEGORIES;
        setCategories(finalCategories);
        setFeaturedArticles(finalFeatured);
        setLatestNews(finalLatest);
        setMostReadNews(finalTrending);
        setVideoNews(snapshot.videoNews || newsToUse.filter(a => a.videoUrl));
        if (snapshot.breakingNews && Array.isArray(snapshot.breakingNews)) {
          setBreakingNews(snapshot.breakingNews);
        }
        if (Array.isArray(snapshot.layout)) {
          setLayout(snapshot.layout);
        } else if (snapshot.layout && typeof snapshot.layout === "object") {
          setLayoutConfig((prev: any) => ({ ...prev, ...snapshot.layout }));
        }

        const storedSettings = safeLocalStorage.getItem("sanatan_homepage_settings");
        let hasCustomHero = false;
        try {
          if (storedSettings) {
            const parsed = JSON.parse(storedSettings);
            if (parsed.hero) hasCustomHero = true;
          }
        } catch {}

        if (!hasCustomHero) {
          if ((snapshot as any)?.homepage?.hero) {
            setHeroConfig((snapshot as any).homepage.hero);
          } else if ((snapshot as any)?.hero) {
            setHeroConfig((snapshot as any).hero);
          }
        }
        if (Array.isArray((snapshot as any)?.pinnedBreakingHeadlines) && pinnedHeadlines.length === 0) {
          setPinnedHeadlines((snapshot as any).pinnedBreakingHeadlines);
        }

        if (snapshot.platformStats) {
          setPlatformStats(snapshot.platformStats);
        }

        if (Array.isArray(snapshot.announcements)) {
          setAnnouncements(snapshot.announcements);
        }

        setCategoryArticles(catArticles);

        // Warm audio cache for recent articles that already have pre-generated audio
        const articlesWithAudio = [...finalFeatured, ...finalLatest, ...finalTrending].filter(
          (art) => Boolean((art as any).audioUrl || (art as any).tts?.audioUrl)
        );
        if (articlesWithAudio.length > 0) {
          preloadAllRecentNewsAudio(articlesWithAudio).catch(() => { });
        }
      } catch (err) {
        console.warn("Snapshot load error, activating failover dataset:", err);
        try {
          const fallbackSnap = await continuityEngine.getHomepageData();
          const fallbackFeatured = fallbackSnap.featuredArticles || [];
          const fallbackLatest = fallbackSnap.latestNews || [];
          const fallbackTrending = fallbackSnap.trendingNews || fallbackSnap.latestNews || [];
          setCategories(fallbackSnap.categories?.length ? fallbackSnap.categories : DEFAULT_CATEGORIES);
          setFeaturedArticles(fallbackFeatured);
          setLatestNews(fallbackLatest);
          setMostReadNews(fallbackTrending);
          setVideoNews(fallbackSnap.videoNews || []);
          setCategoryArticles(fallbackSnap.categoryArticles || {});

          const fallbackWithAudio = [...fallbackFeatured, ...fallbackLatest, ...fallbackTrending].filter(
            (art) => Boolean((art as any).audioUrl || (art as any).tts?.audioUrl)
          );
          if (fallbackWithAudio.length > 0) {
            preloadAllRecentNewsAudio(fallbackWithAudio).catch(() => { });
          }
        } catch (failoverErr) {
          console.warn("Failover snapshot also failed:", failoverErr);
        }
      } finally {
        setLoading(false);
      }
    };

    loadSnapshot();
    offlineQueue.autoSync().catch(() => { });

    const handleRebuilt = () => {
      loadSnapshot(true);
    };

    const unsubscribeEventBus = contentEventBus?.subscribe
      ? contentEventBus.subscribe(() => {
        loadSnapshot(true);
      })
      : () => { };

    window.addEventListener("snapshot-rebuilt", handleRebuilt);
    window.addEventListener("content-mutated", handleRebuilt);

    return () => {
      if (typeof unsubscribeEventBus === "function") {
        unsubscribeEventBus();
      }
      window.removeEventListener("snapshot-rebuilt", handleRebuilt);
      window.removeEventListener("content-mutated", handleRebuilt);
    };
  }, []);

  const [mostReadTab, setMostReadTab] = useState<"day" | "week" | "year">("day");
  const [selectedArticleToShare, setSelectedArticleToShare] = useState<Article | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShareClick = (article: Article) => {
    setSelectedArticleToShare(article);
    setShowShareModal(true);
  };

  const filteredMostRead = () => {
    const now = new Date();
    let startDate = new Date();
    if (mostReadTab === "day") startDate.setHours(now.getHours() - 24);
    else if (mostReadTab === "week") startDate.setDate(now.getDate() - 7);
    else if (mostReadTab === "year") startDate.setFullYear(now.getFullYear() - 1);

    const organicArticles = mostReadNews.filter(a =>
      !(a as any).isAd &&
      !(a as any).isSponsored &&
      !(a as any).position &&
      (!(a as any).linkUrl || (a.content && a.content.length > 20))
    );

    const filtered = organicArticles.filter(a => {
      const pubTs = getArticlePublicationTimestamp(a);
      return pubTs >= startDate.getTime();
    });

    const scored = filtered.map(article => {
      const pubTs = getArticlePublicationTimestamp(article);
      const daysOld = Math.max(0, (now.getTime() - pubTs) / (1000 * 60 * 60 * 24));
      const score = (article.views || 100) / (daysOld + 1);
      return { ...article, score };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, 5);
  };

  const getRenderableLayout = () => {
    if (!layout) return null;

    const manuallyAddedCategoryIds = layout.filter(s => s.type === 'category').map(s => s.categoryId);
    const activeCategories = categories.filter(cat => {
      if (manuallyAddedCategoryIds.includes(cat.slug) || manuallyAddedCategoryIds.includes(cat.id)) return false;
      return true;
    });

    const autoCategorySections = activeCategories.map(cat => ({
      id: `auto_cat_${cat.id}`,
      type: 'category',
      categoryId: cat.slug,
      isAuto: true
    }));

    const firstCatIndex = layout.findIndex(s => s.type === 'category');

    let finalLayout = [...layout];
    if (firstCatIndex !== -1) {
      finalLayout.splice(firstCatIndex, 0, ...autoCategorySections);
    } else {
      finalLayout = [...finalLayout, ...autoCategorySections];
    }

    return finalLayout;
  };

  const renderSection = (section: any) => {
    switch (section.type) {
      case 'slider':
        return (
          <div key={section.id} className="mb-6">
            <HeroFeaturedSlider articles={featuredArticles} />
            {/* Show MarketDataWidget under slider only on mobile in layout mode */}
            <div className="block lg:hidden mt-6">
              <MarketDataWidget />
            </div>
          </div>
        );
      case 'most_read':
        return (
          <div key={section.id} className="flex flex-col gap-6 mb-12">
            <div className="bg-card p-8 rounded-3xl shadow-sm border border-border-theme">
              <h3 className="text-xl font-black text-card-foreground border-l-4 border-accent pl-4 uppercase tracking-tight mb-6">धेरै पढिएको</h3>
              <div className="flex flex-col gap-6">
                {filteredMostRead().map((article, index) => (
                  <Link key={`${article.id || 'mr'}-top-${index}`} to={`/article/${article.id}`} className="group flex items-start gap-4">
                    <div className="text-4xl font-black text-muted-area group-hover:text-primary/20 transition-colors leading-none pt-1 w-10 flex-shrink-0 text-center">{index + 1}</div>
                    <div className="flex flex-col gap-2 flex-grow min-w-0">
                      <h4 className="text-sm font-bold text-card-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">{article.title}</h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="block lg:hidden">
            </div>
          </div>
        );
      case 'latest_news':
        return <div key={section.id} className="mb-12"><LatestPostsBlock initialArticles={latestNews} onShare={handleShareClick} /></div>;
      case 'category':
        const cat = categories.find(c => c.slug === section.categoryId || c.id === section.categoryId);
        if (!cat) return null;
        return (
          <div key={section.id} className="mb-12">
            <CategoryBlock category={cat} articles={getCategoryArticles(cat.slug, cat.id)} onShare={handleShareClick} />
          </div>
        );
      case 'multimedia':
        return <div key={section.id} className="mb-12"><MultimediaZone articles={videoNews} onShare={handleShareClick} /></div>;
      case 'ad_banner':
        return <AdBanner key={section.id} position={section.adPosition || "homepage_mid"} className="mb-12" />;
      default:
        return null;
    }
  };

  const mostReadSection = (
    <div className="flex flex-col gap-6 bg-card p-6 rounded-3xl border border-border-theme shadow-sm">
      <div className="flex items-center justify-between border-b-2 border-border-theme pb-4">
        <h3 className="text-lg font-black text-card-foreground border-l-4 border-accent pl-4 uppercase tracking-tight">
          धेरै पढिएको
        </h3>
        <Link to="/trending" className="text-accent hover:text-accent/80 transition-colors">
          <TrendingUp size={18} />
        </Link>
      </div>

      <div className="flex bg-muted-area p-1 rounded-xl">
        {(["day", "week", "year"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMostReadTab(tab)}
            className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${mostReadTab === tab ? "bg-card text-primary shadow-sm" : "text-muted-text hover:text-foreground"
              }`}
          >
            {tab === "day" ? "आज" : tab === "week" ? "यो हप्ता" : "यो वर्ष"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        {loading ? (
          <div className="flex flex-col gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-4 animate-pulse">
                <div className="w-8 h-8 bg-muted-area rounded-lg flex-shrink-0" />
                <div className="flex-grow flex flex-col gap-2">
                  <div className="h-3 bg-muted-area rounded w-full" />
                  <div className="h-3 bg-muted-area rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMostRead().length > 0 ? (
          filteredMostRead().map((article, index) => (
            <Link key={`${article.id || 'mr'}-sec-${index}`} to={`/article/${article.id}`} className="group flex items-start gap-4">
              <div className="text-3xl font-black text-muted-area group-hover:text-primary/20 transition-colors leading-none pt-1 w-8 flex-shrink-0 text-center">
                {index + 1}
              </div>
              <div className="flex flex-col gap-1.5 flex-grow min-w-0">
                <h4 className="text-xs font-bold text-card-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                  {article.title}
                </h4>
                <div className="flex items-center gap-3">
                  <span className="text-[8px] font-bold text-muted-text uppercase tracking-widest">
                    {formatDate(article.createdAt)}
                  </span>
                  <span className="text-[8px] font-bold text-primary flex items-center gap-1">
                    <Eye size={10} /> {article.views}
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-8 text-muted-text text-xs font-bold">
            कुनै समाचार उपलब्ध छैन
          </div>
        )}
      </div>
    </div>
  );

  if (loading && !layout) return <HomeSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col bg-[var(--background)] transition-colors duration-300"
    >
      <SEOHead
        title="सत्य, तथ्य र निष्पक्ष - नेपालको अग्रणी डिजिटल समाचार तथा ज्ञान सञ्जाल"
        description="सनातन मार्ग - नेपालको भरपर्दो डिजिटल मिडिया तथा सांस्कृतिक पोर्टल। ताजा राष्ट्रिय-अन्तर्राष्ट्रिय समाचार, राजनीति, नेपाल हब पञ्चाङ्ग पात्रो, बजार भाउ, र सरस्वती ज्ञान सञ्जाल।"
        url="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Sanatan Marga Home",
          "description": "सत्य, तथ्य र निष्पक्ष नेपाली डिजिटल मिडिया तथा सांस्कृतिक पोर्टल",
          "url": "https://sanatanmarga.com/"
        }}
      />
      <Header />

      <main className="flex-grow">
        {/* 1. Cinematic Hero Video (Controlled by heroConfig and layoutConfig.hero) */}
        {layoutConfig.hero !== false && !isHeroHidden && heroConfig.enabled ? (
          <FeatureGate feature="homepage.hero">
            <SectionErrorBoundary sectionName="cinematic-hero">
              <CinematicHeroVideo
                heroConfig={heroConfig}
                onHideHero={handleHideHero}
              />
            </SectionErrorBoundary>
          </FeatureGate>
        ) : null}

        {/* Breaking News Ticker (Controlled by layoutConfig.breakingNews) */}
        {layoutConfig.breakingNews !== false && (
          <SectionErrorBoundary sectionName="breaking-news">
            <BreakingNewsStrip
              articles={
                pinnedHeadlines.length > 0
                  ? pinnedHeadlines.map((title, i) => ({
                      id: `pinned-${i}`,
                      title,
                      createdAt: new Date().toISOString(),
                    } as any))
                  : breakingNews
              }
            />
          </SectionErrorBoundary>
        )}

        {/* 2. Our Solemn Commitment */}
              <section id="our-solemn-commitment-section" className="py-8 sm:py-10 bg-card relative z-20 overflow-hidden border-b border-border-theme/40">
                <div className="container-custom grid grid-cols-1 lg:grid-cols-12 gap-8 items-center px-4">
                  <div className="lg:col-span-6 flex flex-col gap-4">
                    <span className="text-xxs font-black text-primary tracking-[0.25em] uppercase">
                      {language === 'en' ? 'OUR SOLEMN COMMITMENT' : 'हाम्रो प्रतिबद्धता'}
                    </span>
                    <h2 className="text-2xl lg:text-3xl font-black text-card-foreground tracking-tight leading-tight">
                      {language === 'en'
                        ? 'Preserving Knowledge, Empowering Society, and Uniting Nepal Digitally.'
                        : 'ज्ञानको संरक्षण, समाजको सशक्तिकरण, र नेपालको डिजिटल एकता।'}
                    </h2>
                    <p className="text-xs sm:text-sm font-bold text-muted-text leading-relaxed">
                      {language === 'en'
                        ? 'Sanatan Marga is a national initiative to preserve and vitalize Nepal’s historic cultural heritage, philosophical thinking, and local grassroots realities through modern digital journalism. We are a nexus for civic dialogue and cultural wisdom.'
                        : 'सनातन मार्ग नेपालको ऐतिहासिक सांस्कृतिक धरोहर, दार्शनिक चिन्तन, र स्थानीय यथार्थलाई आधुनिक डिजिटल माध्यमबाट जीवन्त राख्ने महाअभियान हो। हामी साधारण समाचार पोर्टल मात्र होइनौं, हामी नेपालको आत्मिक र बौद्धिक पहिचानको संरक्षण र प्रवर्द्धन गर्ने माध्यम हौं।'}
                    </p>
                  </div>
                  <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-background p-4 rounded-2xl border border-border-theme text-center flex flex-col gap-2 justify-center h-36 shadow-xs">
                      <span className="text-xs sm:text-sm font-black text-primary">
                        {language === 'en' ? 'Preserving Knowledge' : 'ज्ञानको संरक्षण'}
                      </span>
                      <span className="text-[10px] font-bold text-muted-text leading-normal">
                        {language === 'en' ? 'Digital documentation of Vedic scriptures and philosophical wisdom.' : 'हाम्रा वैदिक शास्त्र, ग्रन्थ र अमूल्य दार्शनिक सम्पदाको डिजिटल अभिलेखीकरण।'}
                      </span>
                    </div>
                    <div className="bg-background p-4 rounded-2xl border border-border-theme text-center flex flex-col gap-2 justify-center h-36 shadow-xs">
                      <span className="text-xs sm:text-sm font-black text-primary">
                        {language === 'en' ? 'Strengthening Communities' : 'समुदाय सशक्तिकरण'}
                      </span>
                      <span className="text-[10px] font-bold text-muted-text leading-normal">
                        {language === 'en' ? 'Fostering enlightened dialogue and collaboration through Chautari forums.' : 'नेपाली समाजमा सुसंस्कृत संवाद र सहकार्यका लागि चौतारी फोरमको प्रवर्द्धन।'}
                      </span>
                    </div>
                    <div className="bg-background p-4 rounded-2xl border border-border-theme text-center flex flex-col gap-2 justify-center h-36 shadow-xs">
                      <span className="text-xs sm:text-sm font-black text-primary">
                        {language === 'en' ? 'Connecting Nepal' : 'नेपालको एकता'}
                      </span>
                      <span className="text-[10px] font-bold text-muted-text leading-normal">
                        {language === 'en' ? 'Uniting local stories and perspectives from all 77 districts.' : '७७ जिल्लाका स्थानीय कथा र मुद्दाहरूलाई डिजिटल मानचित्रमा एकाकार गर्दै राष्ट्रिय एकता।'}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

            {/* 3. Ecosystem Architecture (The Four Pillars) */}
            <FeatureGate feature="homepage.ecosystem">
              <section id="homepage-intro" className="py-8 sm:py-10 bg-background relative z-20 border-b border-border-theme/40">
                <div className="container-custom flex flex-col gap-8 px-4">
                  <div className="flex flex-col items-center text-center gap-1">
                    <span className="text-xxs font-black text-primary tracking-[0.25em] uppercase">{language === 'en' ? 'Ecosystem Architecture' : 'संरचनात्मक प्रारूप'}</span>
                    <h2 className="text-2xl lg:text-3xl font-black text-card-foreground tracking-tight">
                      {language === 'en' ? 'The Four Pillars of Sanatan Marga' : 'सनातन मार्गका चार स्तम्भहरू'}
                    </h2>
                    <div className="w-12 h-0.5 bg-primary mt-1" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Card 1: Nepal Hub Intelligence */}
                    <div className="bg-card p-6 rounded-2xl border border-border-theme flex flex-col gap-4 shadow-xs hover:shadow-md transition-all duration-300">
                      <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
                        <Compass size={18} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-sm font-black text-card-foreground">
                          {language === 'en' ? 'Nepal Hub Intelligence' : 'नेपाल हब इन्टेलिजेन्स'}
                        </h3>
                        <ul className="text-[11px] font-bold text-muted-text flex flex-col gap-1 list-disc list-inside">
                          <li>{language === 'en' ? 'District Intelligence' : '७७ जिल्लाको प्रत्यक्ष विवरण'}</li>
                          <li>{language === 'en' ? 'Development Tracking' : 'विकास तथा बजार ट्र्याकिङ'}</li>
                          <li>{language === 'en' ? 'Knowledge Graph Integration' : 'भू-सांस्कृतिक ज्ञान प्रणाली'}</li>
                        </ul>
                      </div>
                    </div>

                    {/* Card 2: Saraswati Knowledge OS */}
                    <div className="bg-card p-6 rounded-2xl border border-border-theme flex flex-col gap-4 shadow-xs hover:shadow-md transition-all duration-300">
                      <div className="w-10 h-10 bg-sacred/10 text-sacred rounded-xl flex items-center justify-center shrink-0">
                        <BookOpen size={18} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-sm font-black text-card-foreground">
                          {language === 'en' ? 'Saraswati Knowledge OS' : 'सरस्वती ज्ञान केन्द्र'}
                        </h3>
                        <ul className="text-[11px] font-bold text-muted-text flex flex-col gap-1 list-disc list-inside">
                          <li>{language === 'en' ? 'Scriptures & Granthas' : 'वैदिक शास्त्र तथा ग्रन्थहरू'}</li>
                          <li>{language === 'en' ? 'Authentic Research' : 'प्रमाणिक अनुसन्धान र भाष्य'}</li>
                          <li>{language === 'en' ? 'Translations & Digital Library' : 'द्विभाषिक अनुवाद र पुस्तकालय'}</li>
                        </ul>
                      </div>
                    </div>

                    {/* Card 3: Chautari Community */}
                    <div className="bg-card p-6 rounded-2xl border border-border-theme flex flex-col gap-4 shadow-xs hover:shadow-md transition-all duration-300">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                        <Users size={18} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-sm font-black text-card-foreground">
                          {language === 'en' ? 'Chautari Community' : 'चौतारी समुदाय'}
                        </h3>
                        <ul className="text-[11px] font-bold text-muted-text flex flex-col gap-1 list-disc list-inside">
                          <li>{language === 'en' ? 'Forums & Discussions' : 'विचार, विमर्श र बौद्धिक छलफल'}</li>
                          <li>{language === 'en' ? 'Public Participation' : 'नागरिक सहभागिता'}</li>
                          <li>{language === 'en' ? 'Reputation & Verified Badges' : 'योगदान अंक र प्रमाणीकरण'}</li>
                        </ul>
                      </div>
                    </div>

                    {/* Card 4: Media OS */}
                    <div className="bg-card p-6 rounded-2xl border border-border-theme flex flex-col gap-4 shadow-xs hover:shadow-md transition-all duration-300">
                      <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center shrink-0">
                        <Newspaper size={18} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-sm font-black text-card-foreground">
                          {language === 'en' ? 'Media OS' : 'मिडिया ओएस'}
                        </h3>
                        <ul className="text-[11px] font-bold text-muted-text flex flex-col gap-1 list-disc list-inside">
                          <li>{language === 'en' ? 'Live Newsroom' : 'प्रत्यक्ष न्युजरुम ब्रिफिङ'}</li>
                          <li>{language === 'en' ? 'Responsible Journalism' : 'तथ्यपरक र जिम्मेवार पत्रकारिता'}</li>
                          <li>{language === 'en' ? 'Storytelling & Multimedia' : 'भिडियो तथा मल्टिमिडिया कथा'}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* 2nd Live Data Block: Under Four Pillars (Ecosystem Architecture) - Real-time statistics/counters */}
                  <div className="mt-4 pt-8 border-t border-border-theme/40">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
                      <div className="flex flex-col gap-1">
                        <span className="text-2xl lg:text-3xl font-black text-primary font-mono">
                          {language === 'en' ? platformStats.articlesCount.toLocaleString('en-US') : platformStats.articlesCount.toLocaleString('ne-NP')}
                        </span>
                        <span className="text-[10px] font-black text-muted-text uppercase tracking-wider">
                          {language === 'en' ? 'Published Articles' : 'प्रकाशित लेखहरू'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-2xl lg:text-3xl font-black text-primary font-mono">
                          {language === 'en' ? platformStats.membersCount.toLocaleString('en-US') : platformStats.membersCount.toLocaleString('ne-NP')}
                        </span>
                        <span className="text-[10px] font-black text-muted-text uppercase tracking-wider">
                          {language === 'en' ? 'Active Members' : 'सक्रिय सदस्यहरू'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-2xl lg:text-3xl font-black text-primary font-mono">
                          {language === 'en' ? platformStats.districtsCount.toLocaleString('en-US') : platformStats.districtsCount.toLocaleString('ne-NP')}
                        </span>
                        <span className="text-[10px] font-black text-muted-text uppercase tracking-wider">
                          {language === 'en' ? 'Covered Districts' : 'समेटिएका जिल्लाहरू'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-2xl lg:text-3xl font-black text-primary font-mono">
                          {language === 'en' ? platformStats.resourcesCount.toLocaleString('en-US') : platformStats.resourcesCount.toLocaleString('ne-NP')}
                        </span>
                        <span className="text-[10px] font-black text-muted-text uppercase tracking-wider">
                          {language === 'en' ? 'Knowledge Resources' : 'ज्ञान स्रोतहरू'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-2xl lg:text-3xl font-black text-primary font-mono">
                          {language === 'en' ? platformStats.discussionsCount.toLocaleString('en-US') : platformStats.discussionsCount.toLocaleString('ne-NP')}
                        </span>
                        <span className="text-[10px] font-black text-muted-text uppercase tracking-wider">
                          {language === 'en' ? 'Community Discussions' : 'समुदाय छलफल'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </FeatureGate>

            {/* 4. Category Grid (Explore Categories) */}
            {layoutConfig.categoryGrid !== false && (
              <FeatureGate feature="homepage.ecosystem">
                <SectionErrorBoundary sectionName="category-nav">
                  <CategoryNavGrid categories={categories} />
                </SectionErrorBoundary>
              </FeatureGate>
            )}

            {/* 5. Trending and Editor Picks */}
            {layoutConfig.featuredStories !== false && (
              <FeatureGate feature="homepage.trendingStories">
                <SectionErrorBoundary sectionName="featured-stories">
                  <FeaturedStoriesGrid
                    latestNews={latestNews}
                    trendingNews={mostReadNews}
                    onShare={handleShareClick}
                  />
                </SectionErrorBoundary>
              </FeatureGate>
            )}

            {/* 6. नेपाल खोज सञ्जाल (Explore Nepal OS Showcase) */}
            {layoutConfig.districtIntelligence !== false && (
              <FeatureGate feature="homepage.nepalMap">
                <section id="explore-nepal-section" className="py-8 sm:py-10 bg-muted-area/5 border-t border-b border-border-theme/60 relative z-20">
                  <div className="container-custom">
                    <SectionErrorBoundary sectionName="nepal-map">
                      <NepalInteractiveMap />
                    </SectionErrorBoundary>
                  </div>
                </section>
              </FeatureGate>
            )}

            {/* 7. सरस्वती ज्ञान विज्ञान मञ्च (Saraswati Knowledge Hub OS Showcase) */}
            {layoutConfig.knowledgeOS !== false && (
              <FeatureGate feature="homepage.sgisShowcase">
                <section id="saraswati-knowledge-section" className="py-8 sm:py-10 bg-background relative z-20">
                  <div className="container-custom space-y-8">
                    <SectionErrorBoundary sectionName="saraswati-showcase">
                      <SaraswatiKnowledgeShowcase />
                    </SectionErrorBoundary>
                  </div>
                </section>
              </FeatureGate>
            )}

        {/* UX 3.0 Bento + Editorial Grid (Dominant Responsive Hero & Live Command Stream) */}
        <FeatureGate feature="homepage.bento">
          <SectionErrorBoundary sectionName="editorial-bento">
            <EditorialBentoGrid
              leadStory={featuredArticles[0] || latestNews[0]}
              secondaryStories={featuredArticles.slice(1, 4)}
              latestNews={latestNews.slice(0, 4)}
            />
          </SectionErrorBoundary>
        </FeatureGate>

        {/* SECTION 8 — Latest News (Containing the existing modular slider, grid and blocks) */}
        <section id="latest-news-section" className={`${isHeroHidden ? 'pt-2 pb-12' : 'py-8 sm:py-10'} bg-background relative z-20 scroll-mt-20`}>
          {/* Dynamic dismissible Announcement Marquee system loaded directly inside news section */}
          <FeatureGate feature="homepage.announcements">
            <SectionErrorBoundary sectionName="announcements">
              <AnnouncementsSystem initialAnnouncements={announcements} />
            </SectionErrorBoundary>
          </FeatureGate>

          {layout ? (
            <div className="container-custom">
              {/* Show MarketDataWidget only on desktop at the top in layout mode */}
              <div className="hidden lg:block mb-8">
                <FeatureGate feature="homepage.marketData">
                  <SectionErrorBoundary sectionName="market-data-desktop-layout">
                    <MarketDataWidget />
                  </SectionErrorBoundary>
                </FeatureGate>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                <div className="lg:col-span-8 flex flex-col">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={layout?.map(s => s.id) || []} strategy={verticalListSortingStrategy}>
                      {getRenderableLayout()?.map((section) => (
                        <SortableSection key={section.id} id={section.id}>
                          <SectionErrorBoundary sectionName={`layout-${section.id}`}>
                            {renderSection(section)}
                          </SectionErrorBoundary>
                        </SortableSection>
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
                <div className="lg:col-span-4 relative">
                  <div className="sticky top-[94px] flex flex-col gap-8 transition-all duration-300">
                    <Sidebar hideMostRead={true} onShare={handleShareClick} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="container-custom">
                {/* Show MarketDataWidget only on desktop at the top in non-layout mode */}
                <div className="hidden lg:block mb-8">
                  <SectionErrorBoundary sectionName="market-data-desktop">
                    <MarketDataWidget />
                  </SectionErrorBoundary>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  <div className="lg:col-span-8 flex flex-col gap-8">
                    {/* Featured Slider */}
                    <SectionErrorBoundary sectionName="hero-slider">
                      <HeroFeaturedSlider articles={featuredArticles} />
                    </SectionErrorBoundary>

                    {/* Market Watch for Mobile (Under Hero Slider) */}
                    <div className="block lg:hidden my-6">
                      <SectionErrorBoundary sectionName="market-data-mobile">
                        <MarketDataWidget />
                      </SectionErrorBoundary>
                    </div>

                    {/* Latest News */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                    >
                      <SectionErrorBoundary sectionName="latest-posts">
                        <LatestPostsBlock initialArticles={latestNews} onShare={handleShareClick} />
                      </SectionErrorBoundary>
                    </motion.div>

                    {/* Push Notification Prompt */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      className="my-12"
                    >
                      <SectionErrorBoundary sectionName="push-notifications">
                        <PushNotificationPrompt />
                      </SectionErrorBoundary>
                    </motion.div>

                    {/* Most Read Algorithm (Mobile Only) */}
                    <div className="block lg:hidden flex flex-col gap-6">
                      {mostReadSection}
                    </div>

                    {/* Dynamic Categories (First 2) */}
                    {categories.slice(0, 2).map((cat, idx) => (
                      <motion.div
                        key={cat.id || cat.slug || `cat_top_${idx}`}
                        id={`category-${cat.slug}`}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                      >
                        <CategoryBlock
                          category={cat}
                          articles={getCategoryArticles(cat.slug, cat.id)}
                          onShare={handleShareClick}
                        />
                      </motion.div>
                    ))}

                    {/* Mid-page Ad Banner */}
                    <AdBanner position="homepage_mid" className="my-6" />
                  </div>

                  <div className="lg:col-span-4 relative">
                    <div className="sticky top-[94px] flex flex-col gap-8 transition-all duration-300">
                      {/* Most Read Algorithm (Desktop Only) */}
                      <div className="hidden lg:block">
                        {mostReadSection}
                      </div>

                      {/* Sidebar */}
                      <Sidebar hideMostRead={true} onShare={handleShareClick} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Multimedia Zone */}
              <div className="my-10">
                <SectionErrorBoundary sectionName="multimedia-zone">
                  <MultimediaZone articles={videoNews} onShare={handleShareClick} />
                </SectionErrorBoundary>
              </div>

              {/* Remaining Dynamic Categories */}
              <div className="container-custom">
                <div className="flex flex-col gap-10">
                  {categories.slice(2).map((cat, index) => (
                    <motion.div
                      key={cat.id || cat.slug || `cat_rem_${index}`}
                      id={`category-${cat.slug}`}
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: (index % 3) * 0.1 }}
                    >
                      <CategoryBlock
                        category={cat}
                        articles={getCategoryArticles(cat.slug, cat.id)}
                        onShare={handleShareClick}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        {/* SECTION 9 — Join The Community (Become a Member, Join Chautari, Contribute) */}
        {layoutConfig.communityOnboarding !== false && (
          <section id="join-community-section" className="py-20 bg-muted-area/5 border-t border-border-theme/60 relative z-20">
            <div className="container-custom">
              <CommunityOnboarding />
            </div>
          </section>
        )}
      </main>

      <Footer />

      <CreatePostModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        initialData={selectedArticleToShare ? {
          title: `समाचार बारे अपडेट: ${selectedArticleToShare.title}`,
          content: `${selectedArticleToShare.excerpt}\n\nयस बारे तपाईंको के धारणा छ? छलफल गरौं।`,
          imageUrl: selectedArticleToShare.featuredImage,
          category: "News",
          linkedArticleId: selectedArticleToShare.id
        } : undefined}
      />

      <FloatingActions
        categories={categories.map(c => ({
          id: c.id,
          name: language === 'en' ? (c.nameEnglish || c.nameNepali) : (c.nameNepali || c.nameEnglish),
          slug: c.slug
        }))}
      />
    </motion.div>
  );
}
