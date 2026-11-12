import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import SEOHead from "@/src/components/common/SEOHead";
import { 
  Clock, Share2, ChevronRight, User, Eye, 
  ArrowRight, Send, MapPin, AlertCircle, Bookmark, BookmarkCheck, 
  ExternalLink, BookOpen, Sparkles, Zap, ShieldCheck, 
  CheckCircle2, Maximize2, Minimize2, Sun, Moon, Coffee, Volume2, ArrowLeft
} from "lucide-react";
import { 
  db, safeOnSnapshot, getDoc, doc, updateDoc, collection, query, where, orderBy 
} from "@/src/lib/firebase";
import { telemetry } from "@/src/lib/telemetry";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import Sidebar from "@/src/components/layout/Sidebar";
import { formatDate, toNepaliDigits } from "@/src/lib/utils";
import type { Article } from "@/src/types";
import NepaliInput from "@/src/components/ui/NepaliInput";
import AdBanner from "@/src/components/ads/AdBanner";
import RelatedKnowledgeOSSection from "@/src/components/common/RelatedKnowledgeOSSection";
import CreatePostModal from "@/src/components/community/CreatePostModal";
import ArticleVideoPlayer from "@/src/components/news/ArticleVideoPlayer";
import { motion, useScroll, useSpring, AnimatePresence } from "motion/react";
import { useAuth } from "@/src/lib/auth";
import { useLanguage } from "@/src/context/LanguageContext";
import { resolveArticleAuthorAndSources } from "@/src/utils/authorResolution";
import { ArticleSkeleton } from "@/src/components/ui/PageLoaders";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { continuityEngine } from "@/src/lib/continuityEngine";
import { KnowledgeGraphEngine } from "@/src/services/knowledgeGraphService";
import { StoryEvolutionEngine } from "@/src/services/storyEvolutionEngine";
import { StoryEvolutionTimeline } from "@/src/components/news/StoryEvolutionTimeline";
import ArticleAudioReader from "@/src/components/news/ArticleAudioReader";
import StoreKnowledgeConnector from "@/src/components/knowledge/StoreKnowledgeConnector";
import FloatingActions from "@/src/components/layout/FloatingActions";
import ArticleProvenanceCard from "@/src/components/article/ArticleProvenanceCard";
import ArticleDistrictImpact from "@/src/components/article/ArticleDistrictImpact";
import ArticleStoryNetwork from "@/src/components/article/ArticleStoryNetwork";
import ArticleCrossLinks from "@/src/components/article/ArticleCrossLinks";
import ArticleEditorialTransparencyDrawer from "@/src/components/article/ArticleEditorialTransparencyDrawer";
import KnowledgeGraphSidebar from "@/src/components/article/KnowledgeGraphSidebar";
import ArticleActionsToolbar from "@/src/components/article/ArticleActionsToolbar";
import ShareDrawerModal from "@/src/components/article/ShareDrawerModal";
import ArticleModuleGate from "@/src/components/article/ArticleModuleGate";
import { toast } from "sonner";
import { offlineQueue } from "@/src/lib/offlineQueue";
import { useReadingPreferences, ReadingTheme } from "@/src/context/ReadingPreferencesContext";
import { useMediaOS } from "@/src/context/MediaOSContext";

interface Comment {
  id: string;
  articleId: string;
  userName: string;
  content: string;
  createdAt: any;
  isPinned?: boolean;
}

function webpSrcSet(url: string): string {
  if (url.includes(".webp")) {
    return `${url} 2x`;
  }
  if (url.includes("?")) {
    return `${url}&format=webp 2x, ${url} 1x`;
  }
  const dotIndex = url.lastIndexOf(".");
  if (dotIndex > 0) {
    const base = url.substring(0, dotIndex);
    const ext = url.substring(dotIndex);
    return `${base}.webp 2x, ${url} 1x`;
  }
  return `${url} 2x, ${url} 1x`;
}

export default function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, getLocalized } = useLanguage();
  const { scrollYProgress, scrollY } = useScroll();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollPercentage, setScrollPercentage] = useState(0);

  // Centralized Reading Preferences & Focus Mode
  const {
    theme: focusTheme,
    setTheme: setFocusTheme,
    fontSize: readingFontSize,
    fontScaleStep,
    fontScalePercentage,
    increaseFontSize,
    decreaseFontSize,
    isFocusMode,
    setIsFocusMode,
    toggleFocusMode,
    themeTokens,
    fontTokens
  } = useReadingPreferences();

  const mediaOS = useMediaOS();
  const isThisArticlePlaying = !!(mediaOS && mediaOS.isPlaying && mediaOS.currentTrack?.articleId === id);
  const audioSectionRef = useRef<HTMLDivElement>(null);

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const unsubScroll = scrollYProgress.on("change", (v) => {
      setScrollPercentage(Math.round(v * 100));
    });
    const unsubTop = scrollY.on("change", (latest) => {
      setShowScrollTop(latest > 450);
    });
    return () => {
      unsubScroll();
      unsubTop();
    };
  }, [scrollYProgress, scrollY]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const [article, setArticle] = useState<Article | null>(null);
  const [categoryName, setCategoryName] = useState<string>("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [nextArticle, setNextArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [activeTab, setActiveTab] = useState<'related' | 'trending'>('related');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSocialShareDrawer, setShowSocialShareDrawer] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Auto-sync articles when opened to flush any pending sync actions
    offlineQueue.autoSync().catch(() => {});

    const fetchArticleData = async () => {
      try {
        setLoading(true);

        // Fetch complete article bundle via Snapshot OS & Continuity Engine
        const bundle = await continuityEngine.getArticleBundle(id);
        
        if (bundle.article) {
          setArticle(bundle.article);
          setCategoryName(bundle.categoryName);
          if (bundle.relatedArticles.length > 0) {
            const seen = new Set<string>();
            const uniqueRelated = bundle.relatedArticles.filter(a => {
              if (!a?.id || seen.has(a.id)) return false;
              seen.add(a.id);
              return true;
            });
            setRelatedArticles(uniqueRelated);
          }
          if (bundle.trendingArticles.length > 0) {
            const seen = new Set<string>();
            const uniqueTrending = bundle.trendingArticles.filter(a => {
              if (!a?.id || seen.has(a.id)) return false;
              seen.add(a.id);
              return true;
            });
            setTrendingArticles(uniqueTrending);
          }
          setNextArticle(bundle.nextArticle);

          // Check if article is bookmarked
          if (user?.uid) {
            try {
              const bookmarkRef = doc(db, "users", user.uid, "bookmarks", id);
              const bookmarkSnap = await getDoc(bookmarkRef);
              setIsBookmarked(bookmarkSnap.exists());
            } catch (e) {}
          }

          // Phase 1B Policy: View events tracked via lightweight telemetry without offline queue pollution or doc-level write-modify-read
          telemetry.trackRead(`article_view_${id}`, 0, 'cache', 1);
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticleData();

    // Load comments from snapshotEngine first for instant render
    const loadComments = async () => {
      try {
        const snapComments = await snapshotEngine.getResourceCommentsSnapshot("article", id);
        
        // Find queued comments for this article
        const queuedActions = offlineQueue.getQueue?.() || [];
        const queuedComments = queuedActions
          .filter((a: any) => (a.collection === "comments" || a.type === "COMMENT_CREATE") && a.data?.articleId === id)
          .map((a: any) => ({
            id: a.docId || `queued_${Date.now()}`,
            articleId: id,
            userName: a.data?.userName || "अतिथि पाठक",
            content: a.data?.content || "",
            createdAt: new Date().toISOString()
          } as Comment));

        const combined = [...queuedComments, ...snapComments];
        const unique = Array.from(new Map(combined.map(c => [c.id, c])).values());
        unique.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

        setComments(unique);
      } catch (e) {
        console.warn("Snapshot comments load error:", e);
      }
    };

    loadComments();

    // Fetch live comments with safeOnSnapshot
    const commentsQ = query(
      collection(db, "comments"),
      where("articleId", "==", id),
      orderBy("createdAt", "desc")
    );

    const unsubComments = safeOnSnapshot(commentsQ, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      fetchedComments.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
      if (fetchedComments.length > 0) {
        setComments(fetchedComments);
      }
    }, "comments/article");

    return () => unsubComments();
  }, [id, user]);

  const handlePinComment = async (commentId: string, currentPinnedStatus: boolean) => {
    if (!user || user.role === 'user') return;
    try {
      const commentRef = doc(db, "comments", commentId);
      await updateDoc(commentRef, { isPinned: !currentPinnedStatus });
    } catch (error) {
      console.error("Error pinning comment:", error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentName.trim() || !commentText.trim()) return;

    setIsSubmitting(true);
    setCommentError(null);
    try {
      const commentId = Math.random().toString(36).substring(2, 15);
      offlineQueue.queueAction({
        type: 'COMMENT_CREATE',
        collection: 'comments',
        docId: commentId,
        data: {
          articleId: id,
          userName: commentName.trim(),
          content: commentText.trim(),
          createdAt: new Date().toISOString(),
          isPinned: false
        }
      });

      const newComment: Comment = {
        id: commentId,
        articleId: id,
        userName: commentName.trim(),
        content: commentText.trim(),
        createdAt: new Date().toISOString(),
        isPinned: false
      };

      setComments(prev => [newComment, ...prev]);
      setCommentText("");
      toast.success(language === 'en' ? "Comment posted successfully!" : "प्रतिक्रिया सफलतापूर्वक थपियो!");
    } catch (error) {
      console.error("Error adding comment:", error);
      setCommentError(language === 'en' ? "Failed to post comment. Please try again." : "प्रतिक्रिया पठाउन सकिएन। पुन: प्रयास गर्नुहोस्।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleBookmark = async () => {
    if (!user) {
      toast.error(language === 'en' ? "Please sign in to bookmark articles" : "लेख सुरक्षित गर्न कृपया लगइन गर्नुहोस्");
      return;
    }
    if (!id || !article) return;

    try {
      if (isBookmarked) {
        offlineQueue.queueAction({
          type: 'BOOKMARK_TOGGLE',
          collection: `users/${user.uid}/bookmarks`,
          docId: id,
          userId: user.uid
        });
        setIsBookmarked(false);
        toast.info(language === 'en' ? "Article removed from bookmarks." : "लेख सुरक्षित सूचीबाट हटाइयो।");
      } else {
        offlineQueue.queueAction({
          type: 'BOOKMARK_TOGGLE',
          collection: `users/${user.uid}/bookmarks`,
          docId: id,
          data: {
            articleId: id,
            title: article.title,
            featuredImage: article.featuredImage,
            categoryId: article.categoryId,
            createdAt: new Date().toISOString()
          },
          userId: user.uid
        });
        setIsBookmarked(true);
        toast.success(language === 'en' ? "Article saved to bookmarks!" : "लेख सुरक्षित गरियो!");
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  const handleAudioToggle = () => {
    if (isThisArticlePlaying) {
      if (mediaOS) mediaOS.togglePlay();
    } else {
      if (audioSectionRef.current) {
        audioSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (mediaOS && article) {
        mediaOS.playArticle(article);
      }
    }
  };

  // Helper for Prose Font Size Step (falls back to fontTokens)
  const getProseFontClass = () => {
    return fontTokens.bodyClass;
  };

  // Focus Theme Canvas Wrapper
  const getFocusThemeClass = () => {
    return themeTokens.canvasClass;
  };

  // Format and wrap tables safely with overflow containers
  const displayContent = useMemo(() => {
    if (!article) return "";
    let content = getLocalized(article, 'content') || article.content || "";
    
    // Automatically wrap any uncontained <table> in responsive overflow-x-auto container
    content = content.replace(
      /(<table[\s\S]*?<\/table>)/gi,
      '<div className="overflow-x-auto my-6 rounded-2xl border border-border-theme/60 bg-muted-area/20 w-full">$1</div>'
    );
    return content;
  }, [article, language]);

  const rawContent = useMemo(() => {
    if (!article) return "";
    return getLocalized(article, 'content') || article.content || "";
  }, [article, language]);

  const displayTitle = useMemo(() => {
    if (!article) return "";
    return getLocalized(article, 'title') || article.title;
  }, [article, language]);

  const displayExcerpt = useMemo(() => {
    if (!article) return "";
    return getLocalized(article, 'excerpt') || article.excerpt;
  }, [article, language]);

  // Resolved Author Attribution & Source Transparency
  const authorInfo = useMemo(() => {
    if (!article) return {
      authorName: "सम्पादकीय टोली",
      authorRole: "सम्पादक • सनातनमार्ग",
      authorAvatar: null,
      sourcePublishers: [],
      sourceUrls: []
    };
    return resolveArticleAuthorAndSources(article, language as any);
  }, [article, language]);

  // Estimated Reading Time
  const estimatedReadingMinutes = useMemo(() => {
    if (!rawContent) return 3;
    const wordCount = rawContent.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 180));
  }, [rawContent]);

  const [matchedStoryline, setMatchedStoryline] = useState<any>(null);
  const [relatedKnowledgeNodes, setRelatedKnowledgeNodes] = useState<any[]>([]);

  useEffect(() => {
    if (!article) return;
    const storyline = StoryEvolutionEngine.getStorylineForArticle(
      article.id,
      article.title,
      article.districts?.[0] || ""
    );
    setMatchedStoryline(storyline);
    const nodes = KnowledgeGraphEngine.getRelatedNodesForArticle(article);
    setRelatedKnowledgeNodes(nodes.slice(0, 3));
  }, [article, rawContent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <ArticleSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-16 h-16 bg-muted-area rounded-3xl flex items-center justify-center mx-auto text-muted-text">
            <AlertCircle size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-card-foreground">
              {language === 'en' ? "Article Not Found" : "समाचार फेला परेन"}
            </h2>
            <p className="text-xs text-muted-text max-w-md mx-auto">
              {language === 'en' 
                ? "The requested article may have been moved or is no longer available." 
                : "तपाईंले खोज्नुभएको लेख स्थानान्तरण गरिएको वा मेटाइएको हुनसक्छ।"}
            </p>
          </div>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-xs font-black rounded-2xl shadow-md hover:bg-primary/90 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>{language === 'en' ? "Back to Homepage" : "गृहपृष्ठमा फर्कनुहोस्"}</span>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${getFocusThemeClass()}`}
      data-reading-theme={focusTheme}
      id="article-page-root"
    >
      <SEOHead 
        title={`${displayTitle} | सनातन मार्ग`}
        description={displayExcerpt.slice(0, 160)}
        image={article.featuredImage}
        url={`/article/${article.id}`}
        type="article"
        publishedTime={article.createdAt}
        author={authorInfo.authorName}
        section={categoryName || article.categoryId}
        keywords={`${article.categoryId}, नेपाल, समाचार, सनातन मार्ग, ${authorInfo.sourcePublishers.join(", ")}`}
      />

      {/* Reading Progress Bar (Fixed Top 0) */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 md:h-1.5 bg-gradient-to-r from-amber-500 via-primary to-amber-600 z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Focus Mode Navigation Bar */}
      {isFocusMode ? (
        <header 
          className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 py-3 transition-colors ${
            themeTokens.toolbarBgClass
          } ${themeTokens.borderClass}`}
          id="focus-mode-header"
        >
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <button 
              onClick={() => setIsFocusMode(false)}
              className="flex items-center gap-2 text-xs md:text-sm font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
              id="exit-focus-mode-btn"
            >
              <Minimize2 size={16} />
              <span>{language === 'en' ? "Exit Focus Mode" : "ध्यानपूर्वक पढाइ बन्द गर्नुहोस्"}</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Palette Switcher */}
              <div className={`flex items-center gap-1 p-1 rounded-xl border ${themeTokens.mutedClass} ${themeTokens.borderClass}`} id="focus-theme-selector">
                <button
                  onClick={() => setFocusTheme('clean')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    focusTheme === 'clean' 
                      ? 'bg-card shadow-xs text-primary font-black' 
                      : 'text-muted-text hover:text-foreground'
                  }`}
                  title="Clean Light Theme"
                  id="focus-theme-clean-btn"
                >
                  <Sun size={13} />
                  <span className="hidden sm:inline">Clean</span>
                </button>
                <button
                  onClick={() => setFocusTheme('parchment')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    focusTheme === 'parchment' 
                      ? 'bg-card text-amber-700 dark:text-amber-300 shadow-xs font-black' 
                      : 'text-muted-text hover:text-foreground'
                  }`}
                  title="Parchment Theme"
                  id="focus-theme-parchment-btn"
                >
                  <Coffee size={13} />
                  <span className="hidden sm:inline">Parchment</span>
                </button>
                <button
                  onClick={() => setFocusTheme('night')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    focusTheme === 'night' 
                      ? 'bg-card text-amber-400 shadow-xs font-black' 
                      : 'text-muted-text hover:text-foreground'
                  }`}
                  title="Night Mode Theme"
                  id="focus-theme-night-btn"
                >
                  <Moon size={13} />
                  <span className="hidden sm:inline">Night</span>
                </button>
              </div>

              {/* Font Size Adjuster */}
              <div className={`flex items-center p-1 rounded-xl border ${themeTokens.mutedClass} ${themeTokens.borderClass}`} id="focus-font-controls">
                <button
                  onClick={decreaseFontSize}
                  className="px-2 py-1 text-xs font-bold text-muted-text hover:text-foreground transition-colors cursor-pointer select-none active:scale-95"
                  title="Decrease Font Size"
                  id="focus-font-decrease"
                >
                  A-
                </button>
                <span className="text-[11px] font-mono px-1.5 font-bold text-muted-text min-w-[36px] text-center select-none" id="focus-font-indicator">
                  {fontScalePercentage}
                </span>
                <button
                  onClick={increaseFontSize}
                  className="px-2 py-1 text-xs font-bold text-muted-text hover:text-foreground transition-colors cursor-pointer select-none active:scale-95"
                  title="Increase Font Size"
                  id="focus-font-increase"
                >
                  A+
                </button>
              </div>

              {/* Scroll Percentage Indicator */}
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                {language === 'ne' ? `${toNepaliDigits(scrollPercentage)}%` : `${scrollPercentage}%`}
              </span>
            </div>
          </div>
        </header>
      ) : (
        <Header />
      )}

      {/* Main Container */}
      <div className={`transition-all duration-300 ${isFocusMode ? 'py-6 md:py-12' : 'py-6 md:py-10'}`}>
        <AnimatePresence mode="wait">
          <motion.main 
            key={id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`mx-auto px-4 sm:px-5 transition-all ${isFocusMode ? 'max-w-3xl' : 'max-w-7xl'}`}
          >
            {/* Breadcrumb Navigation (Hidden in Focus Mode) */}
            {!isFocusMode && (
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-text flex-wrap">
                  <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
                    {language === 'en' ? "Home" : "गृहपृष्ठ"}
                  </Link>
                  <ChevronRight size={12} />
                  <Link to={`/category/${article.categoryId}`} className="hover:text-primary transition-colors">
                    {categoryName || article.categoryId}
                  </Link>
                  {article.districts && article.districts[0] && (
                    <>
                      <ChevronRight size={12} />
                      <span className="text-primary font-bold">{article.districts[0]}</span>
                    </>
                  )}
                </div>

                {/* Focus Mode Quick Enter Button */}
                <button
                  onClick={() => setIsFocusMode(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all cursor-pointer border border-amber-500/20 shadow-xs"
                  title={language === 'en' ? "Enter Focus Reading Mode" : "ध्यानपूर्वक पढाइ मोड सुरु गर्नुहोस्"}
                >
                  <Maximize2 size={13} />
                  <span>{language === 'en' ? "Focus Mode" : "ध्यानपूर्वक पढाइ"}</span>
                </button>
              </div>
            )}

            {/* Asymmetric Layout: Primary Reading Core + Secondary Sticky Intelligence Rail */}
            <div className={`grid grid-cols-1 ${isFocusMode ? 'w-full' : 'lg:grid-cols-12 gap-8 lg:gap-12'}`}>
              
              {/* PRIMARY EDITORIAL COLUMN (Standardized to max-w-3xl Reading Container) */}
              <div className={`${isFocusMode ? 'w-full' : 'lg:col-span-8 order-1'} flex flex-col gap-6 md:gap-8 min-w-0`}>
                
                {/* 1. Article Header Zone */}
                <div className="flex flex-col gap-4 md:gap-5">
                  
                  {/* Category Pill & Verification Status */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="bg-primary text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-xs">
                      {categoryName || article.categoryId}
                    </span>

                    {article.isBreaking && (
                      <span className="bg-red-600 text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full animate-pulse flex items-center gap-1 shadow-xs">
                        <Zap size={11} className="fill-current" /> {language === 'en' ? "Breaking" : "ताजा ब्रेकिङ"}
                      </span>
                    )}

                    <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <ShieldCheck size={12} /> {language === 'en' ? "Verified" : "तथ्य प्रमाणित"}
                    </span>

                    <span className="bg-muted text-muted-foreground text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <BookOpen size={12} className="text-primary" />
                      {language === 'en' ? `${estimatedReadingMinutes} min read` : `${toNepaliDigits(estimatedReadingMinutes)} मिनेट पढाइ`}
                    </span>
                  </div>

                  {/* Sponsored Content Declaration if applicable */}
                  {article.isSponsored && (
                    <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-card-foreground shadow-xs">
                      <div className="flex items-center gap-3.5">
                        {article.sponsorLogo ? (
                          <img 
                            src={article.sponsorLogo} 
                            srcSet={webpSrcSet(article.sponsorLogo)}
                            alt={article.sponsorName || "Sponsor"} 
                            className="w-12 h-12 object-contain rounded-2xl bg-white p-1.5 border border-amber-500/30 shadow-xs"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-black flex items-center justify-center text-sm shadow-xs">
                            PR
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-white text-[11px] font-black uppercase tracking-wider">
                              {language === 'en' ? "Sponsored" : "प्रायोजित (Sponsored)"}
                            </span>
                            <span className="text-xs font-black text-amber-700 dark:text-amber-300">
                              {article.sponsorName || (language === 'en' ? "Partner Advertiser" : "प्रायोजक साझेदार")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {language === 'en' ? "Published: " : "प्रकाशन: "} 
                            <span className="font-semibold">{formatDate(article.createdAt, language)}</span>
                          </p>
                        </div>
                      </div>

                      {article.sponsorUrl && (
                        <a
                          href={article.sponsorUrl}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                        >
                          {language === 'en' ? "Visit Partner" : "प्रायोजक वेबसाइट"} <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Responsive Headline (Fluid typography + Break-words) */}
                  <h1 className={`${fontTokens.h1Class} font-black ${themeTokens.textClass} leading-[1.18] tracking-tight break-words`} id="article-main-headline">
                    {displayTitle}
                  </h1>

                  {/* Author Attribution & Metadata Bar */}
                  <div className={`flex flex-wrap items-center justify-between gap-4 py-3.5 border-y ${themeTokens.borderClass}`}>
                    <Link
                      to={article.authorId ? `/profile/${article.authorId}` : `/profile/${encodeURIComponent(authorInfo.authorName)}`}
                      className="flex items-center gap-3 group/author cursor-pointer"
                    >
                      <div className="w-11 h-11 bg-muted-area rounded-2xl flex items-center justify-center text-muted-text overflow-hidden border-2 border-border-theme shadow-xs shrink-0 group-hover/author:border-primary transition-colors">
                        {authorInfo.authorAvatar ? (
                          <img src={authorInfo.authorAvatar} srcSet={webpSrcSet(authorInfo.authorAvatar)} alt={authorInfo.authorName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-amber-600 to-amber-700 text-white flex items-center justify-center font-black text-sm">
                            {authorInfo.authorName.slice(0, 2)}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-card-foreground tracking-tight group-hover/author:text-primary transition-colors">
                            {authorInfo.authorName}
                          </span>
                          <span className="w-1 h-1 bg-primary rounded-full"></span>
                          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                            {authorInfo.authorRole}
                          </span>
                        </div>
                        
                        {authorInfo.sourcePublishers.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-text">
                            <span className="font-semibold">{language === 'en' ? "Sources: " : "मूल स्रोत: "}</span>
                            <span className="truncate max-w-[200px] sm:max-w-xs font-medium text-foreground">
                              {authorInfo.sourcePublishers.slice(0, 3).join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex items-center gap-3 text-xs font-bold text-muted-text">
                      <span className="flex items-center gap-1"><Clock size={13} className="text-primary" /> {formatDate(article.createdAt, language)}</span>
                      <span className="flex items-center gap-1"><Eye size={13} className="text-primary" /> {article.views}</span>
                    </div>
                  </div>

                  {/* P0 REQUIREMENT: Primary Article Actions Toolbar (Always Visible, Mobile & Desktop) */}
                  <ArticleActionsToolbar 
                    isBookmarked={isBookmarked}
                    onToggleBookmark={toggleBookmark}
                    onOpenShare={() => setShowSocialShareDrawer(true)}
                    onToggleFocusMode={toggleFocusMode}
                    fontScaleStep={fontScaleStep}
                    fontScalePercentage={fontScalePercentage}
                    onFontScaleChange={(delta) => delta > 0 ? increaseFontSize() : decreaseFontSize()}
                    currentTheme={focusTheme}
                    onThemeChange={setFocusTheme}
                    isAudioPlaying={isThisArticlePlaying}
                    onToggleAudio={handleAudioToggle}
                    language={language as any}
                  />

                  {/* Cross Links */}
                  {!isFocusMode && <ArticleCrossLinks article={article} language={language as any} />}
                </div>

                {/* 2. Hero Image / Video Container (Aspect Ratio & Mobile Overflow Proof) */}
                {article.videoUrl ? (
                  <ArticleVideoPlayer
                    videoUrl={article.videoUrl}
                    posterImage={article.featuredImage}
                    title={displayTitle}
                  />
                ) : (
                  <div className="relative w-full max-w-full aspect-video overflow-hidden rounded-2xl md:rounded-3xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 group">
                    <img 
                      src={article.featuredImage || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200"} 
                      srcSet={article.featuredImage ? webpSrcSet(article.featuredImage) : webpSrcSet("https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200")}
                      alt={displayTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                  </div>
                )}

                {/* Inline Banner Ad */}
                {!isFocusMode && <AdBanner position="article_inline" category={article?.categoryId} />}

                {/* 3. Core Reading Canvas (max-w-3xl Reading Container) */}
                <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
                  
                   {/* ListenOS Audio Reader Engine with ref */}
                  <div ref={audioSectionRef}>
                    <ArticleModuleGate module="listenOS">
                      <ArticleAudioReader 
                        title={displayTitle} 
                        content={rawContent} 
                        language={language as any} 
                        article={article}
                      />
                    </ArticleModuleGate>
                  </div>

                  {/* Excerpt Lead Callout */}
                  {displayExcerpt && (
                    <div className={`p-5 sm:p-6 rounded-2xl border-l-4 border-primary italic ${fontTokens.leadClass} font-bold leading-relaxed shadow-xs break-words ${themeTokens.leadBgClass}`}>
                      {displayExcerpt}
                    </div>
                  )}

                  {/* Main Article Content (Prose + Mobile Table Wrapping) */}
                  <div className="prose prose-nepali max-w-none break-words overflow-hidden w-full" id="article-content-container">
                    <div 
                      className={`article-content-body reading-prose-body ${fontTokens.bodyClass} ${themeTokens.textClass} space-y-6`}
                      dangerouslySetInnerHTML={{ __html: displayContent }} 
                    />
                  </div>

                  {/* SGIS Source Transparency & Fact Provenance Box */}
                  <ArticleModuleGate module="sgisProvenance">
                    <div className="mt-6 p-5 sm:p-6 bg-muted-area/60 rounded-2xl md:rounded-3xl border border-border-theme space-y-4">
                      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-border-theme">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <ShieldCheck size={18} />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-card-foreground uppercase tracking-wide">
                              {language === 'en' ? "Newsroom Source Transparency & Provenance" : "स्रोत पारदर्शीता तथा सत्यता विवरण"}
                            </h4>
                            <p className="text-[11px] text-muted-text font-medium">
                              {language === 'en' ? "Independent journalistic verification & editorial oversight" : "सनातनमार्ग सम्पादकीय निर्देशिका बमोजिम बहुपक्षीय स्रोत परीक्षण"}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
                          {language === 'en' ? "Strictly Fact-Checked" : "तथ्य प्रमाणित (Fact-Checked)"}
                        </span>
                      </div>

                      {/* Source Badges */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-muted-text">
                          {language === 'en' ? "Verified Sources & References:" : "प्रामाणिक समाचार स्रोतहरू:"}
                        </span>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {authorInfo.sourcePublishers.map((pub, idx) => (
                            <span 
                              key={`pub-${idx}`}
                              className="px-3 py-1.5 rounded-xl bg-background border border-border-theme text-xs font-bold text-foreground flex items-center gap-1.5 shadow-xs"
                            >
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              {pub}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Direct Reference URLs if present */}
                      {authorInfo.sourceUrls.length > 0 && (
                        <div className="pt-2">
                          <span className="text-xs font-bold text-muted-text">
                            {language === 'en' ? "External Evidence Links:" : "बाह्य सन्दर्भ लिङ्कहरू:"}
                          </span>
                          <div className="flex flex-col gap-1.5 mt-2">
                            {authorInfo.sourceUrls.map((url, idx) => (
                              <a
                                key={`url-${idx}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1.5 break-all"
                              >
                                <ExternalLink size={12} className="shrink-0" />
                                <span className="overflow-wrap-anywhere break-all">{url}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ArticleModuleGate>

                  {/* Mobile Intelligence Stack (< lg viewports) */}
                  {!isFocusMode && (
                    <div className="flex flex-col gap-6 lg:hidden pt-4">
                      <ArticleModuleGate module="sgisProvenance">
                        <ArticleProvenanceCard article={article} language={language as any} />
                      </ArticleModuleGate>
                      <ArticleModuleGate module="districtImpact">
                        <ArticleDistrictImpact article={article} language={language as any} />
                      </ArticleModuleGate>
                      <ArticleStoryNetwork
                        currentArticle={article}
                        relatedArticles={relatedArticles}
                        nextArticle={nextArticle}
                        language={language as any}
                      />
                      <ArticleModuleGate module="transparencyDrawer">
                        <ArticleEditorialTransparencyDrawer
                          article={article}
                          language={language as any}
                          userRole={user?.role}
                        />
                      </ArticleModuleGate>
                    </div>
                  )}

                  {/* Storyline Evolution */}
                  {!isFocusMode && matchedStoryline && (
                    <StoryEvolutionTimeline 
                      storyline={matchedStoryline} 
                      currentArticleId={article.id} 
                    />
                  )}

                  {/* Saraswati Knowledge Graph Hub */}
                  {!isFocusMode && relatedKnowledgeNodes.length > 0 && (
                    <ArticleModuleGate module="knowledgeGraph">
                      <div className="bg-card border border-border-theme rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                              <BookOpen size={16} />
                            </div>
                            <div>
                              <h3 className="text-sm md:text-base font-black text-card-foreground">
                                {language === 'en' ? "Knowledge Graph Context" : "सम्बन्धित ज्ञानकोष सन्दर्भ (Knowledge Graph)"}
                              </h3>
                              <p className="text-[11px] text-muted-text font-medium">
                                {language === 'en' ? "Connected institutions and concepts" : "यस समाचारसँग सम्बन्धित संस्थागत र नीतिगत सन्दर्भहरू"}
                              </p>
                            </div>
                          </div>
                          <Link 
                            to="/knowledge" 
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            {language === 'en' ? "Full Graph" : "ज्ञानकोष"} <ChevronRight size={14} />
                          </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                          {relatedKnowledgeNodes.map(node => (
                            <Link
                              key={node.id}
                              to={`/knowledge?entity=${node.id}`}
                              className="p-3.5 rounded-2xl bg-muted-area/50 border border-border-theme hover:border-primary/40 hover:bg-muted-area transition-all flex flex-col justify-between gap-2 group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                                  {node.type}
                                </span>
                                {node.district && (
                                  <span className="text-[10px] font-bold text-muted-text flex items-center gap-1">
                                    <MapPin size={10} /> {node.district}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs font-bold text-card-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {language === 'en' ? (node.nameEnglish || node.nameNepali) : node.nameNepali}
                              </h4>
                              <p className="text-[11px] text-muted-text line-clamp-2">
                                {node.description}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </ArticleModuleGate>
                  )}

                  {/* Sanatan Store Knowledge Connector */}
                  {!isFocusMode && (
                    <StoreKnowledgeConnector 
                      tags={article.districts} 
                      category={categoryName || article.categoryId} 
                      title={article.title} 
                    />
                  )}

                  {/* Districts & Category Tags */}
                  {!isFocusMode && (
                    <div className="flex flex-col gap-4 py-6 border-t border-border-theme">
                      {article.districts && article.districts.length > 0 && (
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-xxs font-black text-muted-text uppercase tracking-widest mr-2 flex items-center gap-1.5">
                            <MapPin size={12} className="text-primary" /> {language === 'en' ? "Districts:" : "जिल्लाहरू:"}
                          </span>
                          {article.districts.map(district => (
                            <Link 
                              key={district} 
                              to={`/district/${district}`} 
                              className="bg-primary/5 text-primary px-3.5 py-1.5 rounded-full text-xs font-black hover:bg-primary hover:text-white transition-all uppercase tracking-widest shadow-xs flex items-center gap-1.5"
                            >
                              <MapPin size={10} /> {district}
                            </Link>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xxs font-black text-muted-text uppercase tracking-widest mr-2">
                          {language === 'en' ? "Category:" : "विधा:"}
                        </span>
                        <Link to={`/category/${article.categoryId}`} className="bg-muted-area text-foreground px-3.5 py-1.5 rounded-full text-xs font-black hover:bg-primary hover:text-white transition-all uppercase tracking-widest shadow-xs">
                          {categoryName || article.categoryId}
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* KnowledgeOS Cross-Domain Engine */}
                  {!isFocusMode && <RelatedKnowledgeOSSection entityIdOrAlias={article.title} className="my-4" />}

                  {/* Comments Section */}
                  {!isFocusMode && (
                    <ArticleModuleGate module="comments">
                      <div className="bg-muted-area/50 p-5 sm:p-7 rounded-3xl border border-border-theme flex flex-col gap-6">
                        <div className="flex flex-col gap-1">
                          <h3 className="text-lg sm:text-xl font-black text-card-foreground uppercase tracking-tight">
                            {language === 'en' ? "Leave a Comment" : "प्रतिक्रिया दिनुहोस्"}
                          </h3>
                          <p className="text-xs text-muted-text">
                            {language === 'en' ? "Share your civilizational thoughts on this story" : "यस समाचारमा तपाईंको विचार व्यक्त गर्नुहोस्"}
                          </p>
                        </div>

                        {/* Comment Input Form */}
                        <form onSubmit={handleCommentSubmit} className="flex flex-col gap-3.5">
                          {commentError && (
                            <div className="bg-red-500/10 text-red-500 p-3 rounded-2xl flex items-center gap-2 text-xs font-bold border border-red-500/20">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              {commentError}
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-xxs font-black text-muted-text uppercase tracking-widest ml-1">
                                {language === 'en' ? "Your Name" : "तपाईंको नाम"}
                              </label>
                              <NepaliInput 
                                value={commentName}
                                onChange={(val) => setCommentName(val)}
                                placeholder={language === 'en' ? "Enter your name" : "नाम लेख्नुहोस्"}
                                className="w-full bg-card border border-border-theme rounded-2xl py-3 px-4 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-xs text-foreground placeholder:text-muted-text"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xxs font-black text-muted-text uppercase tracking-widest ml-1">
                              {language === 'en' ? "Comment" : "प्रतिक्रिया"}
                            </label>
                            <NepaliInput 
                              value={commentText}
                              onChange={(val) => setCommentText(val)}
                              placeholder={language === 'en' ? "Write your thoughts here..." : "यहाँ प्रतिक्रिया लेख्नुहोस्..."}
                              rows={3}
                              type="textarea"
                              className="w-full bg-card border border-border-theme rounded-2xl py-3 px-4 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-xs resize-none text-foreground placeholder:text-muted-text"
                            />
                          </div>
                          <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-primary/90 transition-all w-fit shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer"
                          >
                            <Send size={14} />
                            {isSubmitting 
                              ? (language === 'en' ? "Submitting..." : "पठाउँदै...") 
                              : (language === 'en' ? "Submit Comment" : "प्रतिक्रिया पठाउनुहोस्")}
                          </button>
                        </form>

                        {/* Comments List */}
                        <div className="flex flex-col gap-4 pt-4 border-t border-border-theme">
                          <h4 className="text-xs font-black text-card-foreground uppercase tracking-widest">
                            {language === 'en' ? `Comments (${comments.length})` : `सबै प्रतिक्रियाहरू (${comments.length})`}
                          </h4>
                          <div className="flex flex-col gap-3">
                            {comments.length > 0 ? (
                              comments.map((comment) => (
                                <div 
                                  key={comment.id} 
                                  className={`p-4 rounded-2xl shadow-xs border flex gap-3 relative ${
                                    comment.isPinned ? 'bg-primary/5 border-primary/20' : 'bg-card border-border-theme'
                                  }`}
                                >
                                  <div className="w-9 h-9 bg-muted-area rounded-xl flex items-center justify-center text-muted-text shrink-0">
                                    <User size={18} />
                                  </div>
                                  <div className="flex flex-col gap-1 w-full min-w-0">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-card-foreground">{comment.userName}</span>
                                        <span className="text-xxs font-bold text-muted-text">
                                          {comment.createdAt ? formatDate(comment.createdAt, language) : (language === 'en' ? "Just now" : "भर्खरै")}
                                        </span>
                                      </div>
                                      {user && (user.role === 'admin' || user.role === 'editor') && (
                                        <button 
                                          onClick={() => handlePinComment(comment.id, !!comment.isPinned)}
                                          className={`text-xxs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                                            comment.isPinned ? 'bg-muted-area text-muted-text hover:bg-border-theme' : 'bg-primary/10 text-primary hover:bg-primary/20'
                                          }`}
                                        >
                                          {comment.isPinned ? (language === 'en' ? 'Unpin' : 'अनपिन') : (language === 'en' ? 'Pin' : 'पिन')}
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-xs text-foreground leading-relaxed break-words">{comment.content}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="py-6 text-center text-muted-text text-xs font-bold uppercase tracking-widest">
                                {language === 'en' ? "No comments yet. Be the first to share your thoughts!" : "कुनै प्रतिक्रिया छैन। पहिलो विचार राख्नुहोस्!"}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </ArticleModuleGate>
                  )}

                  {/* Related Stories */}
                  {!isFocusMode && (
                    <ArticleModuleGate module="relatedStories">
                      <div className="py-6 border-t border-border-theme flex flex-col gap-6">
                        <div className="flex flex-col items-center gap-3 text-center">
                          <span className="text-xxs font-black text-muted-text uppercase tracking-widest">
                            {language === 'en' ? "Read Next Story" : "थप समाचारहरू"}
                          </span>
                          <div className="flex items-center gap-2 p-1 bg-muted-area rounded-full">
                            <button 
                              onClick={() => setActiveTab('related')}
                              className={`px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                                activeTab === 'related' ? 'bg-card text-primary shadow-xs' : 'text-muted-text hover:text-foreground'
                              }`}
                            >
                              {language === 'en' ? "Related" : "सम्बन्धित"}
                            </button>
                            <button 
                              onClick={() => setActiveTab('trending')}
                              className={`px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                                activeTab === 'trending' ? 'bg-card text-primary shadow-xs' : 'text-muted-text hover:text-foreground'
                              }`}
                            >
                              {language === 'en' ? "Trending" : "ट्रेन्डिङ"}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {(activeTab === 'related' ? relatedArticles : trendingArticles).slice(0, 4).map((item, idx) => (
                            <Link 
                              key={`${item.id || 'art'}-${activeTab}-${idx}`} 
                              to={`/article/${item.id}`} 
                              className="group flex gap-3 p-3 bg-muted-area/50 rounded-2xl hover:bg-card hover:shadow-md transition-all border border-transparent hover:border-border-theme"
                            >
                              <div className="w-18 h-18 rounded-xl overflow-hidden shrink-0 shadow-xs">
                                <img src={item.featuredImage || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200"} srcSet={webpSrcSet(item.featuredImage || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200")} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              </div>
                              <div className="flex flex-col justify-between min-w-0">
                                <h4 className="text-xs sm:text-sm font-black text-card-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                  {getLocalized(item, 'title')}
                                </h4>
                                <div className="flex items-center gap-2 text-xxs font-bold text-muted-text uppercase tracking-wider">
                                  <span>{formatDate(item.createdAt, language)}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1"><Eye size={10} /> {item.views}</span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>

                        {nextArticle && (
                          <div className="flex justify-center pt-2">
                            <Link 
                              to={`/article/${nextArticle.id}`} 
                              className="group flex flex-col items-center gap-1.5 text-center max-w-md p-4 rounded-2xl bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-all"
                            >
                              <span className="text-xxs font-black text-primary uppercase tracking-widest">
                                {language === 'en' ? "Up Next" : "आगामी समाचार"}
                              </span>
                              <h4 className="text-sm sm:text-base font-black text-card-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                                {getLocalized(nextArticle, 'title')}
                              </h4>
                              <div className="flex items-center gap-1 text-primary font-black text-xs uppercase tracking-widest mt-0.5">
                                {language === 'en' ? "Read Now" : "अहिले पढ्नुहोस्"} <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                              </div>
                            </Link>
                          </div>
                        )}
                      </div>
                    </ArticleModuleGate>
                  )}

                  {/* Mobile Sidebar (< lg) */}
                  {!isFocusMode && (
                    <div className="lg:hidden pt-4 border-t border-border-theme">
                      <Sidebar />
                    </div>
                  )}

                </div>
              </div>

              {/* SECONDARY SIDEBAR COLUMN (Order 2 Desktop) */}
              {!isFocusMode && (
                <div className="hidden lg:block lg:col-span-4 order-2 relative space-y-6">
                  <div className="sticky top-[90px] space-y-6">
                    <KnowledgeGraphSidebar article={article} />
                    <ArticleModuleGate module="sgisProvenance">
                      <ArticleProvenanceCard article={article} language={language as any} />
                    </ArticleModuleGate>
                    <ArticleModuleGate module="districtImpact">
                      <ArticleDistrictImpact article={article} language={language as any} />
                    </ArticleModuleGate>
                    <ArticleStoryNetwork
                      currentArticle={article}
                      relatedArticles={relatedArticles}
                      nextArticle={nextArticle}
                      language={language as any}
                    />
                    <ArticleModuleGate module="transparencyDrawer">
                      <ArticleEditorialTransparencyDrawer
                        article={article}
                        language={language as any}
                        userRole={user?.role}
                      />
                    </ArticleModuleGate>
                    <Sidebar />
                  </div>
                </div>
              )}

            </div>
          </motion.main>
        </AnimatePresence>
      </div>

      {!isFocusMode && <Footer />}

      {/* Social Share Drawer Modal (WhatsApp, Facebook, X, Telegram, Copy Link, Native Mobile Share) */}
      <ShareDrawerModal 
        isOpen={showSocialShareDrawer}
        onClose={() => setShowSocialShareDrawer(false)}
        title={displayTitle}
        excerpt={displayExcerpt}
        category={categoryName || article.categoryId}
        url={typeof window !== 'undefined' ? window.location.href : ""}
        onOpenChautari={() => setShowShareModal(true)}
        language={language as any}
      />

      {/* Chautari Community Post Creation Modal */}
      <CreatePostModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        initialData={article ? {
          title: language === 'en' ? `Discussion on: ${getLocalized(article, 'title')}` : `समाचार छलफल: ${article.title}`,
          content: `${getLocalized(article, 'excerpt')}\n\n${language === 'en' ? "What are your thoughts on this? Let's discuss." : "यस विषयमा तपाईंको के धारणा छ? छलफल गरौं।"}`,
          imageUrl: article.featuredImage,
          category: "News",
          linkedArticleId: article.id
        } : undefined}
      />

      {/* Floating Action Menu */}
      {!isFocusMode && (
        <FloatingActions 
          articleData={article ? {
            id: article.id,
            title: displayTitle,
            content: rawContent,
            language: language as any,
            category: categoryName || article.categoryId || "News",
            featuredImage: article.featuredImage,
          } : undefined}
          isBookmarked={isBookmarked}
          onToggleBookmark={toggleBookmark}
        />
      )}
    </div>
  );
}
