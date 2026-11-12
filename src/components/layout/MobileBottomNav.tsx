import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { routeNotification } from "@/src/utils/notificationRouter";
import { 
  Home, 
  Search, 
  Bell, 
  User, 
  Sparkles, 
  Newspaper, 
  Radio, 
  Users, 
  Calendar, 
  X, 
  CheckCheck,
  ChevronRight,
  ShieldCheck,
  Camera,
  MessageSquare,
  Compass,
  BookOpen,
  Headphones,
  LayoutDashboard,
  Settings,
  Database,
  Store,
  Crown,
  GraduationCap,
  Layers,
  Bookmark,
  BookmarkCheck,
  Share2,
  ArrowUp,
  SlidersHorizontal,
  ListMusic,
  Check,
  RotateCcw,
  Type,
  Menu,
  ListFilter,
  Volume2,
  Video,
  MapPin,
  Flame,
  MessageCircle,
  Copy,
  ExternalLink,
  ChevronUp,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/src/lib/auth";
import { useLanguage } from "@/src/context/LanguageContext";
import { usePermissions } from "@/src/context/PermissionsContext";
import { useMediaOS } from "@/src/context/MediaOSContext";
import { useNavigation, NavOverlayType } from "@/src/context/NavigationContext";
import { db, getDocsWithCacheFallback, collection, query, where, orderBy, limit, doc, writeBatch } from "@/src/lib/firebase";
import type { Notification } from "@/src/types";
import { useFeatureControl } from "@/src/context/FeatureControlContext";
import CreatePostModal from "@/src/components/community/CreatePostModal";
import AIGeneratorModal from "@/src/components/admin/AIGeneratorModal";
import NavigationIntegrityModal from "@/src/components/admin/navigation/NavigationIntegrityModal";
import RoleContentCreationModal from "./RoleContentCreationModal";
import { toast } from "sonner";
import { 
  getAuthorizedAdminSections, 
  isRouteActive 
} from "@/src/services/navigationOS";

export default function MobileBottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { hasPermission } = usePermissions();
  const mediaOS = useMediaOS();
  const { 
    activeOverlay, 
    setActiveOverlay, 
    contextData, 
    fontSize, 
    setFontSize 
  } = useNavigation();
  const { isFeatureEnabled } = useFeatureControl();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isRolePostModalOpen, setIsRolePostModalOpen] = useState(false);
  const [isIntegrityModalOpen, setIsIntegrityModalOpen] = useState(false);
  const [postModalData, setPostModalData] = useState<{ title?: string; imageUrl?: string; category?: string }>({});
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [isAddedToQueue, setIsAddedToQueue] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  const lastScrollYRef = useRef(0);
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isHomePage = location.pathname === "/";
  const isArticlePage = location.pathname.startsWith("/article/");
  const isLatestPage = location.pathname === "/latest";
  const isCategoryPage = location.pathname.startsWith("/category/") || location.pathname.startsWith("/news");
  const isRadioPage = location.pathname === "/radio" || location.pathname === "/listen";

  // Admin sections from canonical registry
  const adminSections = getAuthorizedAdminSections(user?.role, hasPermission);

  // Compile Homepage dynamic jump sections
  const categoriesList = contextData.categories || [];
  const homepageSections = [
    {
      id: "featured-newsroom-section",
      name: language === "en" ? "Top Newsroom" : "मुख्य समाचार",
      icon: Sparkles,
    },
    ...categoriesList.map((c) => ({
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
  ];

  // Auto-hide navigation on rapid down-scroll, reveal on up-scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      if (docHeight > 0) {
        setReadingProgress(Math.min(100, Math.max(0, Math.round((currentScrollY / docHeight) * 100))));
      }

      if (currentScrollY > 160 && currentScrollY > lastScrollYRef.current + 18) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollYRef.current - 12 || currentScrollY <= 60) {
        setIsVisible(true);
      }
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Homepage Section Observer
  useEffect(() => {
    if (!isHomePage) return;

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -55% 0px",
      threshold: 0.05,
    };

    const sectionElements = homepageSections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSectionId(entry.target.id);
        }
      });
    }, observerOptions);

    sectionElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isHomePage, categoriesList.length]);

  // Keyboard awareness on mobile
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        setIsKeyboardActive(true);
      }
    };
    const handleBlur = () => {
      setIsKeyboardActive(false);
    };

    window.addEventListener("focusin", handleFocus);
    window.addEventListener("focusout", handleBlur);
    return () => {
      window.removeEventListener("focusin", handleFocus);
      window.removeEventListener("focusout", handleBlur);
    };
  }, []);

  // Load notifications when tab requested
  const handleOpenNotifications = async () => {
    setActiveOverlay("notifications");
    if (!user?.uid || !db) return;
    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "in", [user.uid, "all", "broadcast"]),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const snapshot = await getDocsWithCacheFallback(q);
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    } catch (e) {
      console.warn("Notifications fallback", e);
    }
  };

  const markAllAsRead = async () => {
    if (!db || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        if (!n.isRead) {
          batch.update(doc(db, "notifications", n.id), { isRead: true });
        }
      });
      await batch.commit();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success(language === "en" ? "All notifications marked as read" : "सबै सूचनाहरू पढिएको भनी चिन्ह लगाइयो");
    } catch (e) {
      toast.error("Failed to update notifications");
    }
  };

  // Smooth scroll to target with sticky header compensation
  const scrollToTarget = (targetId: string) => {
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
    setActiveOverlay("none");
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setActiveOverlay("none");
  };

  // Article actions
  const handleListenToArticle = async () => {
    const article = contextData.articleData;
    if (!article) return;
    try {
      await mediaOS.playArticle({
        id: article.id,
        title: article.title,
        content: article.content || article.excerpt || "",
        categoryId: article.category || "News",
      } as any);
      toast.success(
        language === "en"
          ? "Playing article audio in ListenOS..."
          : "समाचारको आवाज ListenOS मा बजिरहेको छ..."
      );
      setActiveOverlay("none");
    } catch (err) {
      toast.error(language === "en" ? "Failed to play audio." : "आवाज बजाउन असफल भयो।");
    }
  };

  const handleAddToQueue = () => {
    const article = contextData.articleData;
    if (!article) return;
    try {
      mediaOS.enqueueArticle({
        id: article.id,
        title: article.title,
        content: article.content || article.excerpt || "",
        categoryId: article.category || "News",
      } as any);
      setIsAddedToQueue(true);
      toast.success(language === "en" ? "Added to ListenOS audio queue" : "ListenOS अडियो सूचीमा थपियो");
      setTimeout(() => setIsAddedToQueue(false), 3000);
    } catch (e) {
      toast.error(language === "en" ? "Could not add to queue" : "सूचीमा थप्न सकिएन");
    }
  };

  const handleShareStory = async (platform?: string) => {
    const shareUrl = window.location.href;
    const shareTitle = contextData.articleData?.title || "SanatanMarga News";

    if (platform === "whatsapp") {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + " " + shareUrl)}`, "_blank");
    } else if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
    } else if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
    } else if (platform === "copy") {
      navigator.clipboard.writeText(shareUrl);
      toast.success(language === "en" ? "Link copied to clipboard!" : "लिङ्क क्लिपबोर्डमा प्रतिलिपि गरियो!");
    } else if (contextData.onShare) {
      contextData.onShare();
    } else if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
      } catch (e) {
        // Cancelled
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success(language === "en" ? "Link copied to clipboard!" : "लिङ्क क्लिपबोर्डमा प्रतिलिपि गरियो!");
    }
    setActiveOverlay("none");
  };

  // Determine 5th button label & icon based on current page
  const getMoreButtonConfig = () => {
    if (isAdminRoute) {
      return {
        label: language === "en" ? "Admin" : "एडमिन",
        icon: Settings,
        overlay: "more_admin" as NavOverlayType
      };
    }
    if (isArticlePage) {
      return {
        label: language === "en" ? "Actions" : "कार्य",
        icon: SlidersHorizontal,
        overlay: "contextual" as NavOverlayType
      };
    }
    if (isHomePage) {
      return {
        label: language === "en" ? "Sections" : "विधाहरू",
        icon: Compass,
        overlay: "contextual" as NavOverlayType
      };
    }
    if (isLatestPage) {
      return {
        label: language === "en" ? "Stories" : "समाचार",
        icon: ListFilter,
        overlay: "contextual" as NavOverlayType
      };
    }
    if (isCategoryPage) {
      return {
        label: language === "en" ? "Topics" : "विधा",
        icon: Layers,
        overlay: "contextual" as NavOverlayType
      };
    }
    return {
      label: language === "en" ? "More" : "थप",
      icon: Menu,
      overlay: "more_public" as NavOverlayType
    };
  };

  const moreBtn = getMoreButtonConfig();
  const isReporter = user?.role === "admin" || user?.role === "super_admin" || user?.role === "editor" || user?.role === "chief_editor" || user?.role === "journalist";
  const isCurrentlyVisible = isVisible && !isKeyboardActive;

  return (
    <>
      <NavigationIntegrityModal
        isOpen={isIntegrityModalOpen}
        onClose={() => setIsIntegrityModalOpen(false)}
      />

      {/* =========================================================================
          1. PRIMARY FULL-WIDTH BOTTOM NAVIGATION (Always Visible, Zero Floating Gaps)
          ========================================================================= */}
      <div
        className={`fixed bottom-0 left-0 right-0 w-full z-50 lg:hidden pointer-events-auto transition-transform duration-300 ${
          isCurrentlyVisible ? "translate-y-0" : "translate-y-full"
        }`}
        id="mobile-primary-bottom-nav"
      >
        <nav
          className="w-full bg-card/98 backdrop-blur-2xl border-t border-border-theme shadow-2xl flex items-center justify-between text-card-foreground px-2"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)", paddingTop: "6px" }}
          aria-label="Mobile Navigation"
        >
          {isAdminRoute ? (
            /* ================= ADMIN MOBILE SHELL ================= */
            <>
              {/* 1. Dashboard */}
              <Link
                to="/admin"
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  isRouteActive(location.pathname, { path: "/admin", activePattern: "^/admin(/mission-control)?$" } as any)
                    ? "text-primary font-black scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Admin Dashboard"
              >
                <LayoutDashboard size={20} className={location.pathname === "/admin" ? "stroke-[2.5px]" : "stroke-2"} />
                <span className="text-[10px] mt-0.5 font-bold tracking-tight">
                  {language === "en" ? "Dashboard" : "ड्यासबोर्ड"}
                </span>
              </Link>

              {/* 2. Newsroom */}
              <Link
                to="/admin/editor"
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  isRouteActive(location.pathname, { path: "/admin/editor" } as any)
                    ? "text-primary font-black scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Newsroom Editor"
              >
                <Newspaper size={20} className={location.pathname.startsWith("/admin/editor") ? "stroke-[2.5px]" : "stroke-2"} />
                <span className="text-[10px] mt-0.5 font-bold tracking-tight">
                  {language === "en" ? "Newsroom" : "न्यूजरुम"}
                </span>
              </Link>

              {/* 3. CENTER POST BUTTON WITH ANIMATED GRADIENT MESH STROKE */}
              <div className="flex flex-col items-center justify-center flex-1 relative -mt-4 z-20">
                <button
                  onClick={() => setIsRolePostModalOpen(true)}
                  className="relative group focus:outline-none cursor-pointer flex flex-col items-center"
                  aria-label={language === "en" ? "Post & Create Content" : "सामग्री पोष्ट तथा सिर्जना"}
                  title={language === "en" ? "Post & Create Content" : "सामग्री पोष्ट तथा सिर्जना गर्नुहोस्"}
                >
                  {/* Animated Gradient Mesh Stroke Ring without Ambient Glow */}
                  <div className="relative p-[2.5px] rounded-full overflow-hidden">
                    <div className="absolute -inset-[100%] gradient-mesh-stroke" />
                    
                    {/* Inner Central Solid Circle */}
                    <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-primary via-amber-600 to-amber-500 text-white flex items-center justify-center group-hover:scale-105 active:scale-95 transition-transform shadow-md">
                      <Plus 
                        size={24} 
                        className="stroke-[3px] transition-transform duration-300 group-hover:rotate-90" 
                      />
                    </div>
                  </div>

                  <span className="text-[9px] sm:text-[10px] mt-0.5 font-black text-amber-600 dark:text-amber-400 tracking-tight leading-none group-hover:text-primary transition-colors">
                    {language === "en" ? "Post" : "पोष्ट"}
                  </span>
                </button>
              </div>

              {/* 4. Media */}
              <Link
                to="/admin/media"
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  isRouteActive(location.pathname, { path: "/admin/media", activePattern: "^/admin/media" } as any)
                    ? "text-primary font-black scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Media & Radio"
              >
                <Radio size={20} className={location.pathname.startsWith("/admin/media") ? "stroke-[2.5px]" : "stroke-2"} />
                <span className="text-[10px] mt-0.5 font-bold tracking-tight">
                  {language === "en" ? "Media" : "मिडिया"}
                </span>
              </Link>

              {/* 5. More Admin */}
              <button
                onClick={() => setActiveOverlay("more_admin")}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  activeOverlay === "more_admin"
                    ? "text-primary font-black scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Admin Directory"
              >
                <Settings size={20} className={activeOverlay === "more_admin" ? "stroke-[2.5px]" : "stroke-2"} />
                <span className="text-[10px] mt-0.5 font-bold tracking-tight">
                  {language === "en" ? "More" : "थप"}
                </span>
              </button>
            </>
          ) : (
            /* ================= PUBLIC READER SHELL ================= */
            <>
              {/* 1. Home */}
              <Link
                to="/"
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  location.pathname === "/"
                    ? "text-primary font-black scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Home"
              >
                <Home size={20} className={location.pathname === "/" ? "stroke-[2.5px]" : "stroke-2"} />
                <span className="text-[10px] mt-0.5 font-bold tracking-tight">
                  {language === "en" ? "Home" : "गृह"}
                </span>
              </Link>

              {/* 2. News */}
              <Link
                to="/latest"
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  location.pathname === "/latest" || location.pathname === "/news"
                    ? "text-primary font-black scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Latest News"
              >
                <Newspaper size={20} className={location.pathname === "/latest" || location.pathname === "/news" ? "stroke-[2.5px]" : "stroke-2"} />
                <span className="text-[10px] mt-0.5 font-bold tracking-tight">
                  {language === "en" ? "News" : "समाचार"}
                </span>
              </Link>

              {/* 3. Live / Radio */}
              <Link
                to="/radio"
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  isRadioPage || location.pathname.startsWith("/live")
                    ? "text-primary font-black scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Live & Radio"
              >
                <div className="relative">
                  <Radio size={20} className={isRadioPage || location.pathname.startsWith("/live") ? "stroke-[2.5px] text-accent" : "stroke-2"} />
                  {mediaOS.isPlaying && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent animate-ping" />
                  )}
                </div>
                <span className="text-[10px] mt-0.5 font-bold tracking-tight">
                  {language === "en" ? "Live/Radio" : "लाइभ/रेडियो"}
                </span>
              </Link>

              {/* 4. SGIS (Sanatan Grantha & Intelligence System) */}
              <Link
                to="/knowledge"
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  location.pathname.startsWith("/knowledge") || location.pathname.startsWith("/sgis") || location.pathname.startsWith("/archives")
                    ? "text-primary font-black scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="SGIS Grantha & Knowledge"
              >
                <BookOpen
                  size={20}
                  className={
                    location.pathname.startsWith("/knowledge") || location.pathname.startsWith("/sgis") || location.pathname.startsWith("/archives")
                      ? "stroke-[2.5px]"
                      : "stroke-2"
                  }
                />
                <span className="text-[10px] mt-0.5 font-bold tracking-tight">
                  {language === "en" ? "SGIS" : "ग्रन्थ/SGIS"}
                </span>
              </Link>

              {/* 5. Contextual More / Action Drawer */}
              <button
                onClick={() => setActiveOverlay(moreBtn.overlay)}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
                  activeOverlay !== "none"
                    ? "text-primary font-black scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label={moreBtn.label}
              >
                <div className="relative">
                  <moreBtn.icon size={20} className={activeOverlay !== "none" ? "stroke-[2.5px]" : "stroke-2"} />
                  {isArticlePage && contextData.isBookmarked && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent" />
                  )}
                </div>
                <span className="text-[10px] mt-0.5 font-bold tracking-tight">
                  {moreBtn.label}
                </span>
              </button>
            </>
          )}
        </nav>
      </div>

      {/* =========================================================================
          2. CONTEXTUAL ACTION DRAWER (Unified Action Sheet for Zero-Overlap Architecture)
          ========================================================================= */}
      <AnimatePresence>
        {activeOverlay !== "none" && (
          <div className="fixed inset-0 z-60 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveOverlay("none")}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer"
            />

            {/* Bottom Sheet Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="relative w-full max-w-lg bg-card text-card-foreground rounded-t-3xl border-t border-border-theme shadow-2xl p-5 pb-10 z-10 max-h-[86vh] flex flex-col"
              role="dialog"
              aria-modal="true"
            >
              {/* Drag Handle */}
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-4 shrink-0" />

              {/* Close Button */}
              <button
                onClick={() => setActiveOverlay("none")}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted-area text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Close action drawer"
              >
                <X size={20} />
              </button>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6">

                {/* ==========================================
                    CASE A: ARTICLE READING CONTEXTUAL ACTIONS
                    ========================================== */}
                {isArticlePage && activeOverlay === "contextual" && (
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-border-theme">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                          <SlidersHorizontal size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-card-foreground">
                            {language === "en" ? "Article Actions & Reader Assistant" : "समाचार कार्य तथा पाठक सहायक"}
                          </h3>
                          <p className="text-[10px] text-muted-foreground font-medium truncate max-w-xs">
                            {contextData.articleData?.title || "SanatanMarga Reader"}
                          </p>
                        </div>
                      </div>
                      {readingProgress > 0 && (
                        <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {readingProgress}% read
                        </span>
                      )}
                    </div>

                    {/* 1. Primary Audio Actions (ListenOS) */}
                    <div className="space-y-2">
                      <h4 className="text-xxs font-black uppercase tracking-wider text-muted-foreground ml-1">
                        {language === "en" ? "ListenOS Audio" : "श्रव्य समाचार (ListenOS)"}
                      </h4>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          onClick={handleListenToArticle}
                          className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 transition-all text-left cursor-pointer"
                        >
                          <Headphones size={18} className="text-amber-500 shrink-0" />
                          <div>
                            <span className="text-xs font-black block leading-tight">
                              {mediaOS.isPlaying ? (language === "en" ? "Now Playing" : "बजिरहेको छ") : (language === "en" ? "Listen in ListenOS" : "समाचार सुन्नुहोस्")}
                            </span>
                            <span className="text-[9px] opacity-75 font-semibold">
                              {language === "en" ? "Nepali AI Audio TTS" : "नेपाली AI वाचन स्वर"}
                            </span>
                          </div>
                        </button>

                        <button
                          onClick={handleAddToQueue}
                          className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                            isAddedToQueue
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold"
                              : "bg-card hover:bg-muted-area border-border-theme text-card-foreground"
                          }`}
                        >
                          {isAddedToQueue ? <Check size={18} className="text-emerald-500 shrink-0" /> : <ListMusic size={18} className="text-primary shrink-0" />}
                          <div>
                            <span className="text-xs font-black block leading-tight">
                              {isAddedToQueue ? (language === "en" ? "Added to Queue" : "सूचीमा थपियो") : (language === "en" ? "Add to Audio Queue" : "प्लेलिस्टमा थप्नुहोस्")}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-semibold">
                              {language === "en" ? "ListenOS Playlist" : "श्रव्य संग्रह"}
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* 2. Reader Assistant & Typography Sizing */}
                    <div className="p-3.5 bg-muted-area/50 rounded-2xl border border-border-theme space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xxs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Type size={13} />
                          {language === "en" ? "Text Sizing (Reader Mode)" : "फन्ट आकार परिवर्तन"}
                        </span>
                        <span className="text-[10px] font-bold text-primary uppercase">{fontSize}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {(["sm", "md", "lg", "xl"] as const).map((size) => (
                          <button
                            key={size}
                            onClick={() => setFontSize(size)}
                            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                              fontSize === size
                                ? "bg-primary text-white shadow-sm"
                                : "bg-card hover:bg-muted-area border border-border-theme/60 text-card-foreground"
                            }`}
                          >
                            {size === "sm" ? "A- सानो" : size === "md" ? "A सामान्य" : size === "lg" ? "A+ ठूलो" : "A++ मुख्य"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Bookmark & Discussion Shortcuts */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => {
                          if (contextData.onToggleBookmark) {
                            contextData.onToggleBookmark();
                          }
                        }}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                          contextData.isBookmarked
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold"
                            : "bg-card hover:bg-muted-area border-border-theme text-card-foreground"
                        }`}
                      >
                        {contextData.isBookmarked ? (
                          <BookmarkCheck size={18} className="text-amber-500 shrink-0" />
                        ) : (
                          <Bookmark size={18} className="text-primary shrink-0" />
                        )}
                        <div>
                          <span className="text-xs font-black block leading-tight">
                            {contextData.isBookmarked
                              ? (language === "en" ? "Bookmarked" : "सुरक्षित गरियो")
                              : (language === "en" ? "Save Story" : "बुकमार्क गर्नुहोस्")}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-semibold">
                            {language === "en" ? "Read Later" : "पछि पढ्नुहोस्"}
                          </span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setActiveOverlay("none");
                          if (contextData.onShareToChautari) {
                            contextData.onShareToChautari();
                          } else {
                            navigate("/community");
                          }
                        }}
                        className="flex items-center gap-2.5 p-3 rounded-2xl bg-primary/5 hover:bg-primary/10 border border-primary/20 text-card-foreground transition-all text-left cursor-pointer"
                      >
                        <MessageSquare size={18} className="text-primary shrink-0" />
                        <div>
                          <span className="text-xs font-black block leading-tight">
                            {language === "en" ? "Chautari Discuss" : "चौतारीमा छलफल"}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-semibold">
                            {language === "en" ? "Community Forum" : "पाठक टिप्पणी"}
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* 4. Social Sharing Drawer */}
                    <div className="space-y-2">
                      <h4 className="text-xxs font-black uppercase tracking-wider text-muted-foreground ml-1">
                        {language === "en" ? "Share Story" : "समाचार साझा गर्नुहोस्"}
                      </h4>
                      <div className="grid grid-cols-4 gap-2">
                        <button
                          onClick={() => handleShareStory("whatsapp")}
                          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/20 transition-all cursor-pointer"
                        >
                          <MessageCircle size={18} />
                          <span className="text-[10px] font-bold mt-1">WhatsApp</span>
                        </button>
                        <button
                          onClick={() => handleShareStory("facebook")}
                          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] border border-[#1877F2]/20 transition-all cursor-pointer"
                        >
                          <Share2 size={18} />
                          <span className="text-[10px] font-bold mt-1">Facebook</span>
                        </button>
                        <button
                          onClick={() => handleShareStory("twitter")}
                          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/20 transition-all cursor-pointer"
                        >
                          <Share2 size={18} />
                          <span className="text-[10px] font-bold mt-1">X / Twitter</span>
                        </button>
                        <button
                          onClick={() => handleShareStory("copy")}
                          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-card hover:bg-muted-area text-card-foreground border border-border-theme transition-all cursor-pointer"
                        >
                          <Copy size={18} className="text-primary" />
                          <span className="text-[10px] font-bold mt-1">{language === "en" ? "Copy" : "प्रतिलिपि"}</span>
                        </button>
                      </div>
                    </div>

                    {/* 5. Scroll to Top & Next Navigation */}
                    <button
                      onClick={scrollToTop}
                      className="w-full p-3 rounded-2xl bg-card hover:bg-muted-area border border-border-theme flex items-center justify-center gap-2 text-xs font-bold text-card-foreground transition-all cursor-pointer"
                    >
                      <ArrowUp size={16} className="text-primary" />
                      <span>{language === "en" ? "Scroll to Top of Story" : "समाचारको सुरुमा जानुहोस्"}</span>
                    </button>
                  </div>
                )}

                {/* ==========================================
                    CASE B: HOMEPAGE SECTIONS & JUMP DECK
                    ========================================== */}
                {isHomePage && activeOverlay === "contextual" && (
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-border-theme">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                          <Compass size={18} className="animate-spin-slow" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-card-foreground">
                            {language === "en" ? "Homepage Section Navigator" : "गृहपृष्ठ विधा नेभिगेसन"}
                          </h3>
                          <p className="text-[10px] text-muted-foreground font-medium">
                            {language === "en" ? "Jump directly to any news zone" : "कुनै पनि खण्डमा सिधै जानुहोस्"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={scrollToTop}
                        className="px-2.5 py-1 rounded-xl bg-muted-area hover:bg-primary hover:text-white text-muted-foreground transition-colors text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowUp size={12} /> {language === "en" ? "Top" : "शीर्ष"}
                      </button>
                    </div>

                    {/* Quick Search trigger inside Jump Sheet */}
                    <button
                      onClick={() => {
                        setActiveOverlay("none");
                        window.dispatchEvent(new CustomEvent("open-command-palette"));
                      }}
                      className="w-full flex items-center gap-2.5 p-3 rounded-2xl bg-muted-area/60 hover:bg-primary hover:text-white transition-all text-xs font-bold text-muted-foreground group cursor-pointer border border-border-theme/50"
                    >
                      <Search size={16} className="text-primary group-hover:text-white shrink-0" />
                      <span className="truncate">
                        {language === "en" ? "Search news, topics & archives..." : "समाचार, विधा र खोज्नुहोस्..."}
                      </span>
                      <span className="ml-auto text-[10px] font-mono opacity-60">⌘K</span>
                    </button>

                    {/* Interactive Sections List */}
                    <div className="space-y-1.5 divide-y divide-border-theme/40">
                      {homepageSections.map((sec, idx) => {
                        const IconComponent = sec.icon || Layers;
                        const isActive = activeSectionId === sec.id;
                        return (
                          <button
                            key={`${sec.id}-${idx}`}
                            onClick={() => scrollToTarget(sec.id)}
                            className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group cursor-pointer ${
                              isActive
                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                : "text-card-foreground hover:bg-primary hover:text-white"
                            }`}
                          >
                            <span className="flex items-center gap-3 truncate">
                              <span
                                className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${
                                  isActive
                                    ? "bg-white scale-125 ring-2 ring-white/40 animate-pulse"
                                    : "bg-primary/40 group-hover:bg-white"
                                }`}
                              />
                              <IconComponent
                                size={16}
                                className={isActive ? "text-white shrink-0" : "text-primary group-hover:text-white shrink-0"}
                              />
                              <span className="truncate text-xs">{sec.name}</span>
                            </span>
                            <ChevronRight
                              size={16}
                              className={`shrink-0 transition-transform ${
                                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ==========================================
                    CASE C: LATEST NEWS / CATEGORY STORY NAVIGATOR
                    ========================================== */}
                {(isLatestPage || isCategoryPage) && activeOverlay === "contextual" && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-border-theme">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                          <ListFilter size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-card-foreground">
                            {language === "en" ? "Stories Navigator" : "समाचार सूची नेभिगेसन"}
                          </h3>
                          <p className="text-[10px] text-muted-foreground font-medium">
                            {contextData.articles?.length || 0} {language === "en" ? "loaded stories" : "समाचारहरू उपलब्ध"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={scrollToTop}
                        className="px-2.5 py-1 rounded-xl bg-muted-area hover:bg-primary hover:text-white text-muted-foreground transition-colors text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowUp size={12} /> {language === "en" ? "Top" : "शीर्ष"}
                      </button>
                    </div>

                    {/* Loaded Stories List */}
                    <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar">
                      {contextData.articles && contextData.articles.length > 0 ? (
                        contextData.articles.slice(0, 20).map((art, idx) => (
                          <button
                            key={`${art.id}-${idx}`}
                            onClick={() => scrollToTarget(`article-${art.id}`)}
                            className="w-full text-left p-2.5 rounded-xl text-xs font-bold text-card-foreground hover:bg-primary hover:text-white transition-all flex items-start gap-2.5 group cursor-pointer"
                          >
                            <span className="w-5 h-5 rounded-full bg-muted-area group-hover:bg-white/20 text-muted-foreground group-hover:text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="line-clamp-2 leading-tight flex-1">
                              {art.title}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="py-8 text-center text-muted-foreground text-xs font-bold">
                          {language === "en" ? "No story links available" : "कुनै समाचार फेला परेन"}
                        </div>
                      )}
                    </div>

                    {/* Topic Explorer for Category Page */}
                    {isCategoryPage && contextData.onOpenTopics && (
                      <button
                        onClick={() => {
                          setActiveOverlay("none");
                          contextData.onOpenTopics!();
                        }}
                        className="w-full p-3 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
                      >
                        <Layers size={16} />
                        <span>{language === "en" ? "Open Topics Index" : "विषयगत ज्ञान सूची"}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* ==========================================
                    CASE D: GENERAL PUBLIC "MORE" DIRECTORY
                    ========================================== */}
                {(activeOverlay === "more_public" || (activeOverlay === "contextual" && !isArticlePage && !isHomePage && !isLatestPage && !isCategoryPage)) && (
                  <div className="space-y-6">
                    {/* User profile card */}
                    <div className="flex items-center justify-between p-4 bg-muted-area/50 rounded-2xl border border-border-theme/40">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black">
                          {user?.email ? user.email[0].toUpperCase() : <User size={22} />}
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-card-foreground">
                            {user ? user.displayName || user.email : "Sanatan Reader"}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold inline-block mt-0.5">
                            {user ? (language === "en" ? "Registered Member" : "दर्ता सदस्य") : "Guest"}
                          </span>
                        </div>
                      </div>

                      {/* Notifications trigger */}
                      <button
                        onClick={handleOpenNotifications}
                        className="relative p-2.5 rounded-xl hover:bg-muted-area text-muted-foreground hover:text-foreground transition-colors border border-border-theme cursor-pointer"
                        aria-label="Show alerts"
                      >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black leading-none animate-bounce">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Member Contextual Creation shortcut */}
                    {user && (
                      <div className="space-y-2.5">
                        <h4 className="text-xxs font-black uppercase tracking-wider text-muted-foreground ml-1">
                          {language === "en" ? "Creation Hub" : "सिर्जना हब"}
                        </h4>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            onClick={() => {
                              setActiveOverlay("none");
                              setPostModalData({ category: "Chautari" });
                              setIsPostModalOpen(true);
                            }}
                            className="flex items-center gap-2.5 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/20 text-left transition-colors cursor-pointer"
                          >
                            <MessageSquare size={16} className="text-primary" />
                            <span className="text-xs font-bold text-card-foreground">
                              {language === "en" ? "Create Post" : "समुदाय पोस्ट"}
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveOverlay("none");
                              setPostModalData({ imageUrl: "upload", category: "Gallery" });
                              setIsPostModalOpen(true);
                            }}
                            className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 text-left transition-colors cursor-pointer"
                          >
                            <Camera size={16} className="text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs font-bold text-card-foreground">
                              {language === "en" ? "Share Photo" : "तस्बिर पोस्ट"}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Navigation Grid (Sanatan Platform Ecosystem) */}
                    <div className="space-y-2.5">
                      <h4 className="text-xxs font-black uppercase tracking-wider text-muted-foreground ml-1">
                        {language === "en" ? "Explore Sanatan Platform" : "सनातन प्लेटफर्म अन्वेषण"}
                      </h4>
                      <div className="grid grid-cols-2 gap-2.5">
                        <Link
                          to="/knowledge"
                          onClick={() => setActiveOverlay("none")}
                          className="flex items-center gap-3 p-3.5 rounded-2xl bg-card hover:bg-muted-area border border-border-theme transition-all group"
                        >
                          <BookOpen size={18} className="text-primary group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold">{language === "en" ? "Knowledge Base" : "ज्ञानकोष"}</span>
                        </Link>
                        {isFeatureEnabled("nepalhub.main") && (
                          <Link
                            to="/nepal-hub"
                            onClick={() => setActiveOverlay("none")}
                            className="flex items-center gap-3 p-3.5 rounded-2xl bg-card hover:bg-muted-area border border-border-theme transition-all group"
                          >
                            <Compass size={18} className="text-red-500 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold flex items-center gap-1">
                              {language === "en" ? "Nepal Hub" : "नेपाल Hub"}
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                            </span>
                          </Link>
                        )}
                        {isFeatureEnabled("knowledge.archives") && (
                          <Link
                            to="/archives"
                            onClick={() => setActiveOverlay("none")}
                            className="flex items-center gap-3 p-3.5 rounded-2xl bg-card hover:bg-muted-area border border-border-theme transition-all group"
                          >
                            <Database size={18} className="text-primary group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold">{language === "en" ? "Archives" : "अभिलेख"}</span>
                          </Link>
                        )}
                        {isFeatureEnabled("training.academy") && (
                          <Link
                            to="/academy"
                            onClick={() => setActiveOverlay("none")}
                            className="flex items-center gap-3 p-3.5 rounded-2xl bg-card hover:bg-muted-area border border-border-theme transition-all group"
                          >
                            <GraduationCap size={18} className="text-amber-500 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold">{language === "en" ? "Academy" : "अकादेमी"}</span>
                          </Link>
                        )}
                        {isFeatureEnabled("community.chautari") && (
                          <Link
                            to="/community"
                            onClick={() => setActiveOverlay("none")}
                            className="flex items-center gap-3 p-3.5 rounded-2xl bg-card hover:bg-muted-area border border-border-theme transition-all group"
                          >
                            <Users size={18} className="text-primary group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold">{language === "en" ? "Chautari" : "चौतारी"}</span>
                          </Link>
                        )}
                        {isFeatureEnabled("commerce.store") && (
                          <Link
                            to="/store"
                            onClick={() => setActiveOverlay("none")}
                            className="flex items-center gap-3 p-3.5 rounded-2xl bg-card hover:bg-muted-area border border-border-theme transition-all group"
                          >
                            <Store size={18} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold">{language === "en" ? "Store" : "पसल"}</span>
                          </Link>
                        )}
                        {isFeatureEnabled("community.events") && (
                          <Link
                            to="/events"
                            onClick={() => setActiveOverlay("none")}
                            className="flex items-center gap-3 p-3.5 rounded-2xl bg-card hover:bg-muted-area border border-border-theme transition-all group"
                          >
                            <Calendar size={18} className="text-primary group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold">{language === "en" ? "Events" : "कार्यक्रम"}</span>
                          </Link>
                        )}
                        {isFeatureEnabled("revenue.membership") && (
                          <Link
                            to="/membership"
                            onClick={() => setActiveOverlay("none")}
                            className="flex items-center gap-3 p-3.5 rounded-2xl bg-card hover:bg-muted-area border border-border-theme transition-all group"
                          >
                            <Crown size={18} className="text-amber-500 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold">{language === "en" ? "Membership" : "सदस्यता"}</span>
                          </Link>
                        )}
                        <Link
                          to="/storylines"
                          onClick={() => setActiveOverlay("none")}
                          className="flex items-center gap-3 p-3.5 rounded-2xl bg-card hover:bg-muted-area border border-border-theme transition-all group"
                        >
                          <Layers size={18} className="text-primary group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold">{language === "en" ? "Storylines" : "स्टोरीलाइन्स"}</span>
                        </Link>
                        <Link
                          to="/my-sanatan"
                          onClick={() => setActiveOverlay("none")}
                          className="flex items-center gap-3 p-3.5 rounded-2xl bg-card hover:bg-muted-area border border-border-theme transition-all group"
                        >
                          <User size={18} className="text-primary group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold">{language === "en" ? "My Sanatan" : "मेरो सनातन"}</span>
                        </Link>
                      </div>
                    </div>

                    {/* Admin Switcher for staff */}
                    {isReporter && (
                      <button
                        onClick={() => {
                          setActiveOverlay("none");
                          navigate("/admin");
                        }}
                        className="w-full p-4 rounded-2xl bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/20 flex items-center justify-between text-left transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <ShieldCheck size={20} className="text-purple-600 dark:text-purple-400" />
                          <div>
                            <h4 className="font-bold text-xs text-purple-700 dark:text-purple-400">
                              {language === "en" ? "Switch to Admin Mission Control" : "एडमिन मिसन कन्ट्रोलमा जानुहोस्"}
                            </h4>
                            <p className="text-[10px] text-purple-600/75 dark:text-purple-400/75">
                              {language === "en" ? "Editorial, Broadcast, Governance & Tools" : "सम्पादकीय, प्रसारण, सुशासन तथा प्रणाली"}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-purple-500" />
                      </button>
                    )}

                    {/* Footer Links */}
                    <div className="flex justify-center gap-4 text-xxs font-bold uppercase tracking-wider text-muted-foreground pt-4 border-t border-border-theme">
                      <Link to="/about" onClick={() => setActiveOverlay("none")} className="hover:underline">{language === "en" ? "About" : "हाम्रो बारेमा"}</Link>
                      <span>•</span>
                      <Link to="/contact" onClick={() => setActiveOverlay("none")} className="hover:underline">{language === "en" ? "Contact" : "सम्पर्क"}</Link>
                      <span>•</span>
                      <Link to="/terms" onClick={() => setActiveOverlay("none")} className="hover:underline">{language === "en" ? "Terms" : "शर्तहरू"}</Link>
                      <span>•</span>
                      <Link to="/privacy" onClick={() => setActiveOverlay("none")} className="hover:underline">{language === "en" ? "Privacy" : "गोपनीयता"}</Link>
                    </div>
                  </div>
                )}

                {/* ==========================================
                    CASE E: ADMIN WORKSPACE DIRECTORY
                    ========================================== */}
                {activeOverlay === "more_admin" && (
                  <div className="space-y-5">
                    <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ShieldCheck size={22} className="text-purple-400" />
                        <div>
                          <h4 className="font-black text-xs text-card-foreground uppercase tracking-wide">
                            {language === "en" ? "Admin Workspace Directory" : "सम्पूर्ण एडमिन मोड्युलहरू"}
                          </h4>
                          <p className="text-[10px] text-purple-400 font-bold">
                            {user?.role?.toUpperCase() || "STAFF"} • {user?.email}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsIntegrityModalOpen(true)}
                        className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 text-[10px] font-bold flex items-center gap-1 border border-purple-500/30 cursor-pointer"
                      >
                        Audit
                      </button>
                    </div>

                    <div className="space-y-5">
                      {adminSections.map(section => (
                        <div key={section.id} className="space-y-2">
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                              {language === "en" ? section.titleEn : section.titleNe}
                            </span>
                            <span className="text-[10px] text-muted-foreground">({section.items.length})</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {section.items.map(item => {
                              const Icon = item.icon;
                              const label = language === "en" ? item.labelEn : item.labelNe;
                              const active = isRouteActive(location.pathname, item);

                              return (
                                <Link
                                  key={item.id}
                                  to={item.path}
                                  onClick={() => setActiveOverlay("none")}
                                  className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left ${
                                    active
                                      ? "bg-primary text-primary-foreground border-primary font-bold shadow-md shadow-primary/20"
                                      : "bg-card hover:bg-muted-area border-border-theme text-card-foreground"
                                  }`}
                                >
                                  <div className={`p-1.5 rounded-lg ${active ? "bg-white/20" : "bg-primary/10 text-primary"} shrink-0`}>
                                    <Icon size={16} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold truncate leading-tight">{label}</div>
                                    {item.badge && (
                                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-black inline-block mt-0.5">
                                        {language === "en" ? item.badge.textEn : item.badge.textNe}
                                      </span>
                                    )}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Public Portal Switcher */}
                    <button
                      onClick={() => {
                        setActiveOverlay("none");
                        navigate("/");
                      }}
                      className="w-full p-3.5 rounded-2xl bg-primary/10 hover:bg-primary/15 border border-primary/20 flex items-center justify-between text-left transition-all cursor-pointer mt-4"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen size={18} className="text-primary" />
                        <div>
                          <h4 className="font-bold text-xs text-primary">
                            {language === "en" ? "Switch to Public Reader Mode" : "सार्वजनिक पाठक मोडमा जानुहोस्"}
                          </h4>
                          <p className="text-[10px] text-muted-foreground">
                            {language === "en" ? "Return to read news & explore" : "समाचार पढ्न र अन्वेषण गर्न"}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-primary" />
                    </button>
                  </div>
                )}

                {/* ==========================================
                    CASE F: NOTIFICATIONS DRAWER
                    ========================================== */}
                {activeOverlay === "notifications" && (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between pb-3 border-b border-border-theme shrink-0">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                          <Bell size={20} />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-card-foreground">
                            {language === "en" ? "Notifications" : "सूचनाहरू"}
                          </h3>
                        </div>
                      </div>

                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCheck size={14} /> {language === "en" ? "Mark all as read" : "सबै पढिएको"}
                        </button>
                      )}
                    </div>

                    <div className="flex-grow mt-4 space-y-2.5">
                      {notifications.length === 0 ? (
                        <div className="py-14 text-center text-muted-foreground space-y-2">
                          <Bell size={32} className="mx-auto opacity-30" />
                          <p className="text-xs font-bold uppercase tracking-wider">
                            {language === "en" ? "No new notifications" : "कुनै नयाँ सूचना छैन"}
                          </p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setActiveOverlay(null);
                              routeNotification(n, navigate);
                            }}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-primary/40 ${
                              !n.isRead
                                ? "bg-primary/5 border-primary/20"
                                : "bg-muted-area/30 border-border-theme/40"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="text-xs font-black text-card-foreground">{n.title}</h4>
                              {n.createdAt && (
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap font-bold">
                                  {new Date(n.createdAt).toLocaleTimeString("ne-NP", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* External Modals */}
      <CreatePostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        initialData={postModalData}
      />

      <AIGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSuccess={msg => {
          toast.success(msg);
          setIsAiModalOpen(false);
        }}
      />

      {/* Role-Based Content Creation Hub Modal */}
      <RoleContentCreationModal
        isOpen={isRolePostModalOpen}
        onClose={() => setIsRolePostModalOpen(false)}
        onOpenCommunityPost={(initData) => {
          if (initData) setPostModalData(initData);
          setIsPostModalOpen(true);
        }}
        onOpenAiGenerator={() => setIsAiModalOpen(true)}
      />
    </>
  );
}
