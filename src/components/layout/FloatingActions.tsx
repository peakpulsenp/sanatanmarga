import { useState, useEffect, useRef } from "react";
import { 
  ArrowUp, Headphones, Bookmark, BookmarkCheck, Share2, 
  List, Compass, Layers, Sparkles, BookOpen, MapPin, 
  Video, Users, ChevronUp, X, Search, ListMusic, Check, Type
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMediaOS } from "@/src/context/MediaOSContext";
import { useLanguage } from "@/src/context/LanguageContext";
import { useNavigation } from "@/src/context/NavigationContext";
import { toast } from "sonner";

export interface FloatingActionsProps {
  onOpenTopics?: () => void;
  categories?: { id?: string; name: string; slug: string }[];
  articles?: { id: string; title: string; hasAudio?: boolean; category?: string }[];
  totalAvailableArticles?: number;
  articleData?: {
    id: string;
    title: string;
    content: string;
    language?: "ne" | "en";
    featuredImage?: string;
    category?: string;
  };
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
}

// Telemetry tracker for navigation usage metrics
export function trackNavigationTelemetry(action: string, metadata?: Record<string, any>) {
  try {
    const event = {
      action,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
      url: window.location.pathname,
    };
    window.dispatchEvent(new CustomEvent("navigation-telemetry", { detail: event }));
    const saved = JSON.parse(sessionStorage.getItem("nav_telemetry_buffer") || "[]");
    saved.push(event);
    if (saved.length > 100) saved.shift();
    sessionStorage.setItem("nav_telemetry_buffer", JSON.stringify(saved));
  } catch (e) {
    // Non-blocking
  }
}

export default function FloatingActions({
  onOpenTopics,
  categories = [],
  articles = [],
  totalAvailableArticles,
  articleData,
  isBookmarked = false,
  onToggleBookmark,
}: FloatingActionsProps) {
  const { registerContextData, openContextualDrawer, fontSize, setFontSize } = useNavigation();
  const [showDesktopTools, setShowDesktopTools] = useState(false);
  const [showDesktopJumps, setShowDesktopJumps] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [isAddedToQueue, setIsAddedToQueue] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const mediaOS = useMediaOS();
  const { language } = useLanguage();

  const isHomePage = location.pathname === "/";
  const isLatestPage = location.pathname === "/latest";
  const isArticlePage = location.pathname.startsWith("/article/");
  const isCategoryPage = location.pathname.startsWith("/category/") || location.pathname.startsWith("/news");

  // Sync data with Unified Navigation Context for Mobile Bottom Nav & Drawer
  const categoriesCount = categories.length;
  const articlesCount = articles.length;
  const articleId = articleData?.id;
  const articleTitle = articleData?.title;

  useEffect(() => {
    registerContextData({
      type: isHomePage 
        ? "homepage" 
        : isArticlePage 
        ? "article" 
        : isLatestPage 
        ? "latest" 
        : isCategoryPage 
        ? "category" 
        : "general",
      categories,
      articles,
      articleData,
      isBookmarked,
      onToggleBookmark,
      onOpenTopics,
      totalAvailableArticles,
    });
  }, [
    registerContextData,
    location.pathname,
    categoriesCount,
    articlesCount,
    articleId,
    articleTitle,
    isBookmarked,
    totalAvailableArticles,
    onToggleBookmark,
    onOpenTopics
  ]);

  // Scroll tracking for desktop quick widget and reading progress (throttled via requestAnimationFrame)
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          
          if (docHeight > 0) {
            setReadingProgress(Math.min(100, Math.max(0, Math.round((currentScrollY / docHeight) * 100))));
          }

          setShowDesktopTools(currentScrollY > 240);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTarget = (targetId: string) => {
    trackNavigationTelemetry("jump_deck_click", { targetId });
    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 96;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: "smooth"
      });

      element.classList.remove("highlight-target");
      void element.offsetWidth;
      element.classList.add("highlight-target");
      setTimeout(() => {
        element.classList.remove("highlight-target");
      }, 2600);
    }
    setShowDesktopJumps(false);
  };

  const scrollToTop = () => {
    trackNavigationTelemetry("scroll_to_top_click");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleListenInDesktop = async () => {
    if (!articleData) return;
    try {
      trackNavigationTelemetry("tts_listen_start", { articleId: articleData.id });
      await mediaOS.playArticle({
        id: articleData.id,
        title: articleData.title,
        content: articleData.content || "",
        categoryId: articleData.category || "News",
      } as any);
      toast.success(
        language === "en"
          ? "Playing in ListenOS..."
          : "ListenOS मा बजिरहेको छ..."
      );
    } catch (e) {
      toast.error("Audio playback error");
    }
  };

  // Compile Homepage sections dynamically
  const homepageSections = isHomePage
    ? [
        {
          id: "featured-newsroom-section",
          name: language === "en" ? "Top Newsroom" : "मुख्य समाचार",
          icon: Sparkles,
        },
        ...categories.map((c) => ({
          id: `category-${c.slug}`,
          name: c.name,
          icon: Layers,
        })),
        {
          id: "multimedia-zone-section",
          name: language === "en" ? "Multimedia Video Zone" : "मल्टिमिडिया भिडियो",
          icon: Video,
        },
        {
          id: "explore-nepal-section",
          name: language === "en" ? "Nepal Hub (77 Districts)" : "नेपाल हब (७७ जिल्ला)",
          icon: MapPin,
        },
        {
          id: "saraswati-knowledge-section",
          name: language === "en" ? "Knowledge Hub" : "सरस्वती ज्ञानकोष",
          icon: BookOpen,
        },
        {
          id: "join-community-section",
          name: language === "en" ? "Chautari Community" : "चौतारी समुदाय",
          icon: Users,
        },
      ]
    : [];

  /* On Mobile (< 1024px), everything is natively integrated inside MobileBottomNav & Contextual Drawer.
     On Desktop (>= 1024px), provide a subtle, non-intrusive floating utility when scrolled. */
  if (!showDesktopTools) return null;

  return (
    <div className={`hidden lg:flex fixed right-6 ${mediaOS.playerState !== "hidden" ? "bottom-24" : "bottom-8"} z-50 flex-col items-end gap-2.5 pointer-events-auto transition-all duration-300`}>
      {/* Desktop Jump Deck Overlay */}
      <AnimatePresence>
        {showDesktopJumps && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ duration: 0.15 }}
            className="w-80 max-h-[60vh] bg-card/98 backdrop-blur-2xl rounded-2xl shadow-2xl border border-border-theme overflow-hidden flex flex-col text-card-foreground mb-2"
          >
            <div className="px-4 py-3 bg-muted-area/50 border-b border-border-theme flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Compass size={16} className="text-primary" />
                <h4 className="text-xs font-black uppercase tracking-wider text-card-foreground">
                  {isHomePage
                    ? (language === "en" ? "Homepage Sections" : "गृहपृष्ठ विधाहरू")
                    : isLatestPage
                    ? (language === "en" ? "Loaded Stories" : "समाचार सूची")
                    : (language === "en" ? "Section Navigator" : "नेभिगेसन सूची")}
                </h4>
              </div>
              <button
                onClick={() => setShowDesktopJumps(false)}
                className="p-1 rounded-full hover:bg-muted-area text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar max-h-72">
              {isHomePage ? (
                homepageSections.map((sec, idx) => {
                  const Icon = sec.icon || Layers;
                  return (
                    <button
                      key={`${sec.id}-${idx}`}
                      onClick={() => scrollToTarget(sec.id)}
                      className="w-full text-left p-2.5 rounded-xl text-xs font-bold text-card-foreground hover:bg-primary hover:text-white transition-all flex items-center gap-2.5 cursor-pointer group"
                    >
                      <Icon size={14} className="text-primary group-hover:text-white shrink-0" />
                      <span className="truncate">{sec.name}</span>
                    </button>
                  );
                })
              ) : articles.length > 0 ? (
                articles.slice(0, 15).map((art, idx) => (
                  <button
                    key={`${art.id}-${idx}`}
                    onClick={() => scrollToTarget(`article-${art.id}`)}
                    className="w-full text-left p-2 rounded-xl text-xs font-bold text-card-foreground hover:bg-primary hover:text-white transition-all flex items-start gap-2 cursor-pointer group"
                  >
                    <span className="w-4 h-4 rounded-full bg-muted-area group-hover:bg-white/20 text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="line-clamp-2 leading-tight flex-1">{art.title}</span>
                  </button>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground font-semibold">
                  {language === "en" ? "No jump links" : "कुनै सूची उपलब्ध छैन"}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Floating Action Pill */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-card/95 backdrop-blur-xl border border-border-theme shadow-xl">
        {(isHomePage || isLatestPage || isCategoryPage) && (
          <button
            onClick={() => setShowDesktopJumps(!showDesktopJumps)}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              showDesktopJumps ? "bg-primary text-white" : "hover:bg-muted-area text-card-foreground"
            }`}
            title={language === "en" ? "Section Navigator" : "खण्ड नेभिगेटर"}
          >
            <Compass size={18} />
          </button>
        )}

        {isArticlePage && (
          <>
            <button
              onClick={handleListenInDesktop}
              className="p-2 rounded-full hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
              title={language === "en" ? "Listen in ListenOS" : "ListenOS मा सुन्नुहोस्"}
            >
              <Headphones size={18} />
            </button>

            {onToggleBookmark && (
              <button
                onClick={onToggleBookmark}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isBookmarked ? "text-amber-500 bg-amber-500/10" : "hover:bg-muted-area text-card-foreground"
                }`}
                title={isBookmarked ? "Saved" : "Save Story"}
              >
                {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              </button>
            )}
          </>
        )}

        <button
          onClick={scrollToTop}
          className="p-2 rounded-full hover:bg-primary hover:text-white text-card-foreground transition-all cursor-pointer relative group"
          title={language === "en" ? "Scroll to top" : "माथि जानुहोस्"}
        >
          <ArrowUp size={18} />
          {readingProgress > 0 && (
            <span className="absolute -top-2 -left-1 px-1.5 py-0.5 rounded-full bg-primary text-white text-[9px] font-mono font-bold">
              {readingProgress}%
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
