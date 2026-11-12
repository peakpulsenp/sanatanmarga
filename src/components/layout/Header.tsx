import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Search, Menu, X, User, Clock, TrendingUp, Bell, CheckCircle, AlertCircle, 
  Info, MessageSquare, LogOut, LayoutDashboard, FileText, ChevronDown, Camera, 
  DownloadCloud, Sun, Moon, Globe, Share2, Command, Building2, Compass, BookOpen, 
  ShieldAlert, AlertTriangle, Radio, Sparkles, Calendar, Bookmark, Send, PlusCircle, 
  ShoppingBag, Crown, Scroll, GraduationCap, Users, Play, HelpCircle, Settings, Headphones,
  ShieldCheck, FileCheck, Briefcase, Award
} from "lucide-react";
import { collection, query, orderBy, limit, safeOnSnapshot as onSnapshot, doc, updateDoc, writeBatch, where, getDoc, getDocs } from "@/src/lib/firebase";
import { db, auth, getDocsWithCacheFallback } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { useTenant } from "@/src/lib/tenantContext";
import { useTheme } from "@/src/components/StyleProvider";
import { usePWAInstall } from "@/src/hooks/usePWAInstall";
import { provinces } from "@/src/lib/nepalData";
import type { Notification, Article, Category, MenuItem } from "@/src/types";
import { toast } from "sonner";
import { signOut } from "@/src/lib/authClient";
import CommandPalette from "@/src/components/search/CommandPalette";
import PendingSyncBadge from "@/src/components/admin/PendingSyncBadge";
import LogoImage from "@/src/components/ui/LogoImage";
import NepaliDate from "nepali-datetime";
import { motion, AnimatePresence } from "motion/react";
import LanguageSwitcher from "@/src/components/ui/LanguageSwitcher";
import { useLanguage } from "@/src/context/LanguageContext";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import NotificationBell from "@/src/components/notifications/NotificationBell";
import LiveOperationsTicker from "@/src/components/news/LiveOperationsTicker";
import { useFeatureControl } from "@/src/context/FeatureControlContext";

export default function Header() {
  const { t, getLocalized, language } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const { user } = useAuth();
  const { isFeatureEnabled } = useFeatureControl();
  const { isDarkMode, toggleDarkMode, siteSettings } = useTheme();
  const { isInstallable, installApp } = usePWAInstall();
  const [currentDate, setCurrentDate] = useState("");
  const [panchangText, setPanchangText] = useState("");
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [trustMessageIndex, setTrustMessageIndex] = useState(0);
  const [fontSize, setFontSize] = useState<"normal" | "large">("normal");
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeroHidden, setIsHeroHidden] = useState(() => {
    return typeof window !== "undefined" && localStorage.getItem("homepageHeroHidden") === "true";
  });
  const [isTickerHidden, setIsTickerHidden] = useState(() => {
    return typeof window !== "undefined" && localStorage.getItem("ticker_preference_hidden") === "true";
  });

  // Listen for open command palette event
  useEffect(() => {
    const handleOpenPalette = () => setIsCommandPaletteOpen(true);
    window.addEventListener("open-command-palette", handleOpenPalette);
    return () => window.removeEventListener("open-command-palette", handleOpenPalette);
  }, []);

  const handleShowHero = () => {
    localStorage.removeItem("homepageHeroHidden");
    setIsHeroHidden(false);
    window.dispatchEvent(new CustomEvent("hero-visibility-changed"));
  };

  const handleShowTicker = () => {
    localStorage.removeItem("ticker_preference_hidden");
    setIsTickerHidden(false);
    window.dispatchEvent(new CustomEvent("ticker-visibility-changed"));
  };

  useEffect(() => {
    const handleHeroVis = () => {
      setIsHeroHidden(localStorage.getItem("homepageHeroHidden") === "true");
    };
    const handleTickerVis = () => {
      setIsTickerHidden(localStorage.getItem("ticker_preference_hidden") === "true");
    };
    window.addEventListener("hero-visibility-changed", handleHeroVis);
    window.addEventListener("ticker-visibility-changed", handleTickerVis);
    return () => {
      window.removeEventListener("hero-visibility-changed", handleHeroVis);
      window.removeEventListener("ticker-visibility-changed", handleTickerVis);
    };
  }, []);

  // Layer 1: Rotating Trust Messages
  const trustMessages = [
    "✓ No Source = No Story",
    "✓ AI Assisted, Human Verified",
    "✓ 77 District Coverage Active",
    "✓ ArchivesOS Online",
    "✓ Snapshot Integrity 99.9%"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTrustMessageIndex(prev => (prev + 1) % trustMessages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateDateAndPanchang = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const engDate = now.toLocaleDateString('en-US', options);
      const nepDateObj = new NepaliDate();
      const nepDate = nepDateObj.formatNepali('YYYY MMMM D, dddd');
      
      setCurrentDate(`वि.सं. ${nepDateObj.formatNepali('YYYY MMMM D')}`);
      setPanchangText("कृष्ण पक्ष अष्टमी | गाईजात्रा");
    };
    updateDateAndPanchang();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setIsProfileOpen(false);
    navigate("/login");
  };

  const { logoUrl, siteName, brandSlogan } = siteSettings;

  return (
    <>
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />

      {/* LAYER 1: Utility Intelligence Bar (32px) */}
      <div className="bg-muted-area dark:bg-[#08080a] text-foreground dark:text-zinc-300 border-b border-border-theme dark:border-zinc-800/80 text-[11px] font-medium tracking-wide hidden md:block relative z-30 select-none transition-colors">
        <div className="container-custom flex justify-between items-center h-8 px-4">
          {/* Left: BS Date + Panchang Info */}
          <div className="flex items-center gap-2.5 text-muted-text dark:text-zinc-300 font-bold">
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <Calendar size={13} />
              {currentDate}
            </span>
            <span className="text-border-theme dark:text-zinc-600">|</span>
            <span className="text-muted-text dark:text-zinc-400 font-semibold">{panchangText}</span>
            <PendingSyncBadge />
          </div>

          {/* Center: Rotating Platform Trust Indicator */}
          <div className="flex items-center justify-center overflow-hidden h-full max-w-sm px-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={trustMessageIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-amber-600 dark:text-amber-400 font-bold tracking-wide text-center truncate flex items-center gap-1.5 text-[11px]"
              >
                <Sparkles size={12} className="text-amber-500 shrink-0" />
                <span>{trustMessages[trustMessageIndex]}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Header Live Data Block: Official NRB Forex & Civic Telemetry */}
          <div className="hidden lg:flex items-center gap-3 text-[10px] font-black text-muted-text dark:text-zinc-400 shrink-0">
            <span className="text-border-theme dark:text-zinc-700 font-normal">|</span>
            <Link to="/nepal-hub" className="flex items-center gap-0.5 hover:text-primary transition-colors">
              नेपाल हब: <span className="text-emerald-600 dark:text-emerald-400">७ प्रदेश • ७७ जिल्ला</span>
            </Link>
            <span className="text-border-theme dark:text-zinc-800 font-normal">•</span>
            <span className="flex items-center gap-0.5">
              जलविद्युत्: <span className="text-amber-600 dark:text-amber-400">३,१४० MW</span>
            </span>
            <span className="text-border-theme dark:text-zinc-800 font-normal">•</span>
            <span className="flex items-center gap-0.5">
              NRB USD: <span className="text-emerald-600 dark:text-emerald-400">१३४.५० ▲</span>
            </span>
          </div>

          {/* Right: Language, Theme, Accessibility, Install */}
          <div className="flex items-center gap-3">
            {isInstallable && (
              <button
                onClick={installApp}
                className="hover:text-primary text-foreground dark:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer font-bold"
              >
                <DownloadCloud size={13} /> App
              </button>
            )}

            <button
              onClick={() => setFontSize(prev => prev === "normal" ? "large" : "normal")}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-card dark:bg-zinc-900 border border-border-theme dark:border-zinc-800 hover:text-primary transition-colors cursor-pointer text-foreground"
              title="Toggle Accessibility Font Scale"
            >
              {fontSize === "normal" ? "A+" : "A"}
            </button>

            <LanguageSwitcher variant="minimal" />

            <button 
              onClick={toggleDarkMode}
              className="p-1 text-foreground dark:text-zinc-200 hover:text-primary transition-colors rounded cursor-pointer"
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          </div>
        </div>
      </div>

      {/* LAYER 2: Main Command Navigation Header (Smart Compressible Header 80px -> 56px) */}
      <header className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        isScrolled 
          ? 'bg-card/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-xl border-b border-border-theme dark:border-zinc-800/90' 
          : 'bg-card/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-border-theme dark:border-zinc-800/60'
      }`}>
        <div className={`container-custom px-4 flex items-center justify-between gap-6 transition-all duration-200 ${
          isScrolled ? 'py-1.5' : 'py-2.5 sm:py-3'
        }`}>
          
          {/* Logo Zone */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className={`bg-white dark:bg-zinc-900 rounded-xl p-1.5 flex items-center justify-center border border-amber-500/30 shadow-lg shadow-amber-500/5 transition-all duration-200 group-hover:border-amber-500 group-hover:shadow-amber-500/20 overflow-hidden ${
              isScrolled ? 'w-8 h-8' : 'w-10 h-10'
            }`}>
              <LogoImage src={logoUrl} alt={siteName} className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className={`font-black tracking-tight text-foreground dark:text-white uppercase leading-none group-hover:text-primary transition-colors ${
                isScrolled ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
              }`}>
                SANATAN <span className="text-primary">MARGA</span>
              </span>
              {!isScrolled && (
                <span className="text-[9px] font-bold text-muted-text dark:text-zinc-400 tracking-wider uppercase mt-0.5 hidden sm:block">
                  Digital Civilizational Operating System
                </span>
              )}
            </div>
          </Link>

          {/* Core Desktop 8-Item Navigation Menu */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-bold uppercase tracking-wider">
            {/* 1. समाचार (News) */}
            <div 
              className="relative group py-2 px-3 hover:bg-muted-area dark:hover:bg-zinc-800/60 rounded-xl transition-all cursor-pointer"
              onMouseEnter={() => setActiveMegaMenu('news')}
              onMouseLeave={() => setActiveMegaMenu(null)}
            >
              <div className="flex items-center gap-1 text-foreground dark:text-zinc-200 group-hover:text-primary">
                <span>समाचार</span>
                <ChevronDown size={13} className="transition-transform group-hover:rotate-180" />
              </div>
              {activeMegaMenu === 'news' && (
                <div className="absolute top-full left-0 w-[560px] bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-2xl shadow-2xl p-6 z-50 grid grid-cols-3 gap-2.5 text-left normal-case">
                  <Link to="/latest" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-primary flex items-center gap-2 col-span-2">
                    <Sparkles size={16} /> ताजा समाचार (Latest News)
                  </Link>
                  <Link to="/nepal-hub" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Globe size={14} /> ७ प्रदेश • ७७ जिल्ला
                  </Link>
                  <Link to="/category/politics" className="p-2 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">१. राजनीति (Politics)</Link>
                  <Link to="/category/desh" className="p-2 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">२. देश (Desh)</Link>
                  <Link to="/category/pradesh" className="p-2 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">३. प्रदेश (Pradesh)</Link>
                  <Link to="/category/bishwo" className="p-2 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">४. विश्व (Bishwo)</Link>
                  <Link to="/category/economy" className="p-2 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">५. अर्थ (Economy)</Link>
                  <Link to="/category/sports" className="p-2 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">६. खेलकुद (Sports)</Link>
                  <Link to="/category/entertainment" className="p-2 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">७. मनोरञ्जन (Entertainment)</Link>
                  <Link to="/category/tech" className="p-2 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">८. प्रविधि (Tech)</Link>
                  <Link to="/category/sanskar" className="p-2 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">९. संस्कार (Sanskar)</Link>
                  <Link to="/category/tourism" className="p-2 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">१०. पर्यटन (Tourism)</Link>
                  <Link to="/category/bichar" className="p-2 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">११. विचार (Bichar)</Link>
                  <Link to="/category/development" className="p-2 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">१२. विकास (Development)</Link>
                </div>
              )}
            </div>

            {/* 2. ज्ञानकोष (Knowledge Base) */}
            <div 
              className="relative group py-2 px-3 hover:bg-muted-area dark:hover:bg-zinc-800/60 rounded-xl transition-all cursor-pointer"
              onMouseEnter={() => setActiveMegaMenu('knowledge')}
              onMouseLeave={() => setActiveMegaMenu(null)}
            >
              <div className="flex items-center gap-1 text-foreground dark:text-zinc-200 group-hover:text-primary">
                <span>ज्ञानकोष</span>
                <ChevronDown size={13} className="transition-transform group-hover:rotate-180" />
              </div>
              {activeMegaMenu === 'knowledge' && (
                <div className="absolute top-full left-0 w-[520px] bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-2xl shadow-2xl p-6 z-50 grid grid-cols-2 gap-3 text-left normal-case">
                  <Link to="/ask-sanatan" className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2 border border-amber-500/30 col-span-2">
                    <Sparkles size={16} className="text-amber-500 animate-pulse" /> सोध्नुहोस् (Ask Sanatan AI)
                  </Link>
                  <Link to="/knowledge" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-primary flex items-center gap-2">
                    <BookOpen size={16} /> Knowledge Graph
                  </Link>
                  <Link to="/timeline" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">कालक्रम (Timeline)</Link>
                  <Link to="/festivals" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">चाडपर्व तथा पात्रो</Link>
                  <Link to="/directory" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">मठ-मन्दिर र संस्था</Link>
                  <Link to="/knowledge" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">सारस्वती ग्रन्थालय</Link>
                </div>
              )}
            </div>

            {/* 3. अभिलेख (ArchivesOS) */}
            <div 
              className="relative group py-2 px-3 hover:bg-muted-area dark:hover:bg-zinc-800/60 rounded-xl transition-all cursor-pointer"
              onMouseEnter={() => setActiveMegaMenu('archives')}
              onMouseLeave={() => setActiveMegaMenu(null)}
            >
              <div className="flex items-center gap-1 text-foreground dark:text-zinc-200 group-hover:text-primary">
                <span>अभिलेख</span>
                <ChevronDown size={13} className="transition-transform group-hover:rotate-180" />
              </div>
              {activeMegaMenu === 'archives' && (
                <div className="absolute top-full left-0 w-[450px] bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-2xl shadow-2xl p-6 z-50 grid grid-cols-2 gap-3 text-left normal-case">
                  <Link to="/archives" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">संविधान</Link>
                  <Link to="/archives" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">ऐतिहासिक सन्धि</Link>
                  <Link to="/archives" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">ऐन तथा कानून</Link>
                  <Link to="/archives" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">राजपत्र (Gazette)</Link>
                  <Link to="/archives" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">शिलालेख</Link>
                  <Link to="/archives" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200">पाण्डुलिपि</Link>
                </div>
              )}
            </div>

            {/* 4. अकादेमी (Academy) */}
            <div 
              className="relative group py-2 px-3 hover:bg-muted-area dark:hover:bg-zinc-800/60 rounded-xl transition-all cursor-pointer"
              onMouseEnter={() => setActiveMegaMenu('academy')}
              onMouseLeave={() => setActiveMegaMenu(null)}
            >
              {isFeatureEnabled('training.academy') && (
                <>
                  <div className="flex items-center gap-1 text-foreground dark:text-zinc-200 group-hover:text-primary">
                    <span>अकादेमी</span>
                    <ChevronDown size={13} className="transition-transform group-hover:rotate-180" />
                  </div>
                  {activeMegaMenu === 'academy' && (
                    <div className="absolute top-full left-0 w-[440px] bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-2xl shadow-2xl p-6 z-50 flex flex-col gap-2 text-left normal-case">
                      <Link to="/training" className="p-2.5 rounded-xl hover:bg-amber-500/10 dark:hover:bg-amber-500/20 text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2 border border-amber-500/20">
                        <Award size={16} /> Training & Certification Center (तालिम केन्द्र)
                      </Link>
                      <Link to="/academy" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-primary flex items-center gap-2">
                        <GraduationCap size={16} /> Courses & Civilization Studies
                      </Link>
                      <Link to="/verify-certificate" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                        <ShieldCheck size={16} /> Certificate Verification OS
                      </Link>
                      <Link to="/academy/results" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200 flex items-center gap-2">
                        <FileCheck size={16} /> Student Assessment Results
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 5. समुदाय (Chautari Community) */}
            <div 
              className="relative group py-2 px-3 hover:bg-muted-area dark:hover:bg-zinc-800/60 rounded-xl transition-all cursor-pointer"
              onMouseEnter={() => setActiveMegaMenu('community')}
              onMouseLeave={() => setActiveMegaMenu(null)}
            >
              {isFeatureEnabled('community.chautari') && (
                <>
                  <div className="flex items-center gap-1 text-foreground dark:text-zinc-200 group-hover:text-primary">
                    <span>समुदाय</span>
                    <ChevronDown size={13} className="transition-transform group-hover:rotate-180" />
                  </div>
                  {activeMegaMenu === 'community' && (
                    <div className="absolute top-full left-0 w-[440px] bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-2xl shadow-2xl p-6 z-50 flex flex-col gap-2 text-left normal-case">
                      <Link to="/community" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-primary flex items-center gap-2">
                        <Users size={16} /> चौतारी (Chautari Forums)
                      </Link>
                      <Link to="/events" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200 flex items-center gap-2">
                        <Calendar size={16} /> कार्यक्रमहरू (Events & Festivals)
                      </Link>
                      <Link to="/models" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200 flex items-center gap-2">
                        <Crown size={16} /> प्रतिभा तथा कलाकार (Talents)
                      </Link>
                      <Link to="/social" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200 flex items-center gap-2">
                        <Share2 size={16} /> सामाजिक सञ्जाल (Social Hub)
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 6. स्टोर (Sanatan Store) */}
            <div 
              className="relative group py-2 px-3 hover:bg-muted-area dark:hover:bg-zinc-800/60 rounded-xl transition-all cursor-pointer"
              onMouseEnter={() => setActiveMegaMenu('store')}
              onMouseLeave={() => setActiveMegaMenu(null)}
            >
              {isFeatureEnabled('commerce.store') && (
                <>
                  <div className="flex items-center gap-1 text-foreground dark:text-zinc-200 group-hover:text-primary">
                    <span>स्टोर</span>
                    <ChevronDown size={13} className="transition-transform group-hover:rotate-180" />
                  </div>
                  {activeMegaMenu === 'store' && (
                    <div className="absolute top-full left-0 w-[420px] bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-2xl shadow-2xl p-6 z-50 flex flex-col gap-2 text-left normal-case">
                      <Link to="/store" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-primary flex items-center gap-2">
                        <ShoppingBag size={16} /> Sanatan Books, Maps & Art
                      </Link>
                      <Link to="/membership" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-primary flex items-center gap-1.5">
                        <Crown size={15} /> Membership & Patrons
                      </Link>
                      <Link to="/advertiser" className="p-2.5 rounded-xl hover:bg-muted-area dark:hover:bg-zinc-900 text-sm font-bold text-foreground dark:text-zinc-200 flex items-center gap-1.5">
                        <Briefcase size={15} /> Advertiser & Sponsor Portal
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 7. लाइभ (Live Center) */}
            {isFeatureEnabled('media.live') && (
              <Link 
                to="/live" 
                className="py-2 px-3 text-red-600 dark:text-red-400 hover:bg-muted-area dark:hover:bg-zinc-800/60 rounded-xl transition-all flex items-center gap-1.5 font-black"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>लाइभ</span>
              </Link>
            )}

            {/* 7.5 रेडियो र श्रव्य (Sanatan Radio OS) */}
            {isFeatureEnabled('media.radio') && (
              <Link 
                to="/radio" 
                className="py-2 px-3 text-amber-600 dark:text-amber-400 hover:bg-muted-area dark:hover:bg-zinc-800/60 rounded-xl transition-all flex items-center gap-1.5 font-black"
                title="Sanatan Radio OS"
              >
                <Radio size={14} className="text-amber-500 animate-pulse" />
                <span>रेडियो</span>
              </Link>
            )}

            {/* 7.6 सोध्नुहोस् (Ask Sanatan AI) */}
            <Link
              to="/ask-sanatan"
              className="py-2 px-3 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 rounded-xl transition-all flex items-center gap-1.5 font-black shadow-sm"
              title="Ask Sanatan Civilizational AI"
            >
              <Sparkles size={14} className="text-amber-500 animate-pulse" />
              <span>सोध्नुहोस्</span>
            </Link>

            {/* 7.6 एडमिन ड्यासबोर्ड (Direct Admin shortcut for Admin users) */}
            {user && ['super_admin', 'admin', 'chief_editor', 'editor'].includes(user?.role || '') && (
              <Link
                to="/admin"
                className="py-2 px-3 bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 rounded-xl transition-all flex items-center gap-1.5 font-bold"
                title="Admin Mission Control"
              >
                <LayoutDashboard size={14} />
                <span>एडमिन</span>
              </Link>
            )}

            {/* 8. खोज (Command Palette CMD+K Trigger) */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="py-2 px-3 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 rounded-xl transition-all flex items-center gap-1.5 font-bold cursor-pointer"
            >
              <Search size={14} />
              <span>खोज</span>
              <kbd className="px-1.5 py-0.5 bg-muted-area dark:bg-slate-900 border border-border-theme dark:border-zinc-800 rounded text-[9px] font-mono text-muted-text dark:text-zinc-300">⌘K</kbd>
            </button>
          </nav>

          {/* Reader Intelligence Zone (Right) */}
          <div className="hidden lg:flex items-center gap-3">
            {isHeroHidden && (
              <button
                onClick={handleShowHero}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Restore Homepage Hero Banner"
              >
                <span>🎬 Show Hero</span>
              </button>
            )}

            {isTickerHidden && (
              <button
                onClick={handleShowTicker}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/40 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Restore Live Ticker"
              >
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping shrink-0" />
                <span>Show Live Updates</span>
              </button>
            )}

            <NotificationBell iconSize={18} className="text-foreground dark:text-zinc-300 hover:text-primary hover:bg-muted-area dark:hover:bg-zinc-800/50" />

            {/* My Sanatan / Auth Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 bg-muted-area dark:bg-zinc-900 border border-border-theme dark:border-zinc-800 hover:border-amber-500/40 px-3 py-1.5 rounded-full text-xs font-bold text-amber-600 dark:text-amber-400 transition-all cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>My Sanatan</span>
                  <ChevronDown size={13} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1 text-xs">
                    <Link to={`/profile/${user.uid}`} className="flex items-center gap-2.5 p-2.5 hover:bg-muted-area dark:hover:bg-zinc-900 rounded-xl font-bold text-foreground dark:text-zinc-200" onClick={() => setIsProfileOpen(false)}>
                      <User size={15} className="text-amber-500" /> My Dashboard
                    </Link>
                    <Link to="/saved" className="flex items-center gap-2.5 p-2.5 hover:bg-muted-area dark:hover:bg-zinc-900 rounded-xl font-bold text-foreground dark:text-zinc-200" onClick={() => setIsProfileOpen(false)}>
                      <Bookmark size={15} className="text-amber-500" /> Bookmarks & Saved
                    </Link>
                    <Link to="/academy" className="flex items-center gap-2.5 p-2.5 hover:bg-muted-area dark:hover:bg-zinc-900 rounded-xl font-bold text-foreground dark:text-zinc-200" onClick={() => setIsProfileOpen(false)}>
                      <GraduationCap size={15} className="text-amber-500" /> Courses & Academy
                    </Link>
                    <Link to="/training" className="flex items-center gap-2.5 p-2.5 hover:bg-muted-area dark:hover:bg-zinc-900 rounded-xl font-bold text-amber-600 dark:text-amber-400" onClick={() => setIsProfileOpen(false)}>
                      <Award size={15} /> Training & Certifications
                    </Link>
                    <Link to="/store" className="flex items-center gap-2.5 p-2.5 hover:bg-muted-area dark:hover:bg-zinc-900 rounded-xl font-bold text-foreground dark:text-zinc-200" onClick={() => setIsProfileOpen(false)}>
                      <ShoppingBag size={15} className="text-amber-500" /> Orders & Downloads
                    </Link>
                    <Link to="/membership" className="flex items-center gap-2.5 p-2.5 hover:bg-muted-area dark:hover:bg-zinc-900 rounded-xl font-bold text-amber-600 dark:text-amber-400" onClick={() => setIsProfileOpen(false)}>
                      <Crown size={15} /> Membership & Tier
                    </Link>
                    {['super_admin', 'admin', 'chief_editor', 'editor'].includes(user.role) && (
                      <Link to="/admin" className="flex items-center gap-2.5 p-2.5 hover:bg-amber-500/10 rounded-xl font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20" onClick={() => setIsProfileOpen(false)}>
                        <LayoutDashboard size={15} /> Admin Mission Control
                      </Link>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 p-2.5 hover:bg-red-500/10 dark:hover:bg-red-950/40 rounded-xl font-bold text-red-600 dark:text-red-400 text-left cursor-pointer">
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                to="/login" 
                className="bg-primary hover:bg-primary/90 text-white font-black text-xs px-4 py-2 rounded-full shadow-lg shadow-primary/20 transition-all flex items-center gap-1.5"
              >
                <User size={14} />
                <span>लगइन</span>
              </Link>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="p-2 text-amber-600 dark:text-amber-400 hover:bg-muted-area dark:hover:bg-zinc-800/50 rounded-lg"
            >
              <Search size={20} />
            </button>
            <NotificationBell iconSize={20} className="text-foreground dark:text-zinc-300" />
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-foreground dark:text-zinc-200 hover:text-primary transition-colors rounded-lg bg-muted-area dark:bg-zinc-800/50"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Over Drawer */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 lg:hidden bg-card dark:bg-slate-950 border-t border-border-theme dark:border-zinc-800 p-6 flex flex-col gap-6 shadow-2xl z-50 max-h-[85vh] overflow-y-auto">
            <div className="flex flex-col gap-4">
              {isHeroHidden && (
                <button
                  onClick={() => {
                    handleShowHero();
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm cursor-pointer shadow-md"
                >
                  <span>🎬 Show Homepage Hero Banner</span>
                </button>
              )}

              {isTickerHidden && (
                <button
                  onClick={() => {
                    handleShowTicker();
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm cursor-pointer shadow-md"
                >
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-ping shrink-0" />
                  <span>Show Live Updates Ticker</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsCommandPaletteOpen(true);
                }}
                className="w-full bg-muted-area dark:bg-zinc-900 border border-border-theme dark:border-zinc-800 p-3 rounded-2xl flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400"
              >
                <span className="flex items-center gap-2"><Search size={16} /> CMD + K Search Palette</span>
                <kbd className="px-2 py-0.5 bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded text-[10px] font-mono text-muted-text">⌘K</kbd>
              </button>

              <div className="flex flex-col gap-2">
                <Link to="/latest" onClick={() => setIsMenuOpen(false)} className="text-base font-bold py-2 border-b border-border-theme dark:border-zinc-900 text-foreground dark:text-zinc-200">1. समाचार (Latest News)</Link>
                <Link to="/ask-sanatan" onClick={() => setIsMenuOpen(false)} className="text-base font-bold py-2 border-b border-border-theme dark:border-zinc-900 text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500 animate-pulse" /> 2. सोध्नुहोस् (Ask Sanatan AI)
                </Link>
                <Link to="/live" onClick={() => setIsMenuOpen(false)} className="text-base font-bold py-2 border-b border-border-theme dark:border-zinc-900 text-red-600 dark:text-red-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> 3. प्रत्यक्ष भिडियो (Live Streaming)
                </Link>
                <Link to="/radio" onClick={() => setIsMenuOpen(false)} className="text-base font-bold py-2 border-b border-border-theme dark:border-zinc-900 text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Radio size={18} className="animate-pulse" /> 4. सनातन रेडियो (Sanatan Radio 24/7)
                </Link>
                <Link to="/knowledge" onClick={() => setIsMenuOpen(false)} className="text-base font-bold py-2 border-b border-border-theme dark:border-zinc-900 text-foreground dark:text-zinc-200">5. ज्ञानकोष (Knowledge Base)</Link>
                <Link to="/archives" onClick={() => setIsMenuOpen(false)} className="text-base font-bold py-2 border-b border-border-theme dark:border-zinc-900 text-foreground dark:text-zinc-200">6. ऐतिहासिक अभिलेख (ArchivesOS)</Link>
                <Link to="/academy" onClick={() => setIsMenuOpen(false)} className="text-base font-bold py-2 border-b border-border-theme dark:border-zinc-900 text-foreground dark:text-zinc-200">7. सनातन अकादेमी (Academy & Courses)</Link>
                <Link to="/training" onClick={() => setIsMenuOpen(false)} className="text-base font-bold py-2 border-b border-border-theme dark:border-zinc-900 text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Award size={18} /> 8. तालिम तथा प्रमाणीकरण (Training & Certifications)
                </Link>
                <Link to="/verify-certificate" onClick={() => setIsMenuOpen(false)} className="text-base font-bold py-2 border-b border-border-theme dark:border-zinc-900 text-emerald-600 dark:text-emerald-400">9. प्रमाणपत्र प्रमाणीकरण (Verify Certificate)</Link>
                <Link to="/community" onClick={() => setIsMenuOpen(false)} className="text-base font-bold py-2 border-b border-border-theme dark:border-zinc-900 text-foreground dark:text-zinc-200">10. चौतारी समुदाय (Community)</Link>
                <Link to="/events" onClick={() => setIsMenuOpen(false)} className="text-base font-bold py-2 border-b border-border-theme dark:border-zinc-900 text-foreground dark:text-zinc-200">11. कार्यक्रमहरू (Events & Festivals)</Link>
                <Link to="/store" onClick={() => setIsMenuOpen(false)} className="text-base font-bold py-2 border-b border-border-theme dark:border-zinc-900 text-foreground dark:text-zinc-200">12. सनातन स्टोर र सदस्यता (Store & Membership)</Link>
                <Link to="/timeline" onClick={() => setIsMenuOpen(false)} className="text-base font-bold py-2 border-b border-border-theme dark:border-zinc-900 text-foreground dark:text-zinc-200">13. कालक्रम तथा समयरेखा (Timeline)</Link>
                <Link to="/nepal-hub" onClick={() => setIsMenuOpen(false)} className="text-base font-bold py-2 border-b border-border-theme dark:border-zinc-900 text-foreground dark:text-zinc-200">14. नेपाल हब (77 Districts)</Link>
                <Link to="/about" onClick={() => setIsMenuOpen(false)} className="text-base font-bold py-2 border-b border-border-theme dark:border-zinc-900 text-foreground dark:text-zinc-200">15. हाम्रोबारे र सुशासन (About & Transparency)</Link>
                
                {user && ['super_admin', 'admin', 'chief_editor', 'editor'].includes(user?.role || '') && (
                  <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="text-base font-bold py-3 mt-2 border border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl px-4 flex items-center gap-2 shadow-md">
                    <LayoutDashboard size={18} /> एडमिन मिसन कन्ट्रोल (Admin Mission Control)
                  </Link>
                )}
              </div>

              {!user && (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full bg-primary text-white text-center font-bold py-3 rounded-2xl mt-2"
                >
                  लगइन / दर्ता (Login)
                </Link>
              )}
            </div>
          </div>
        )}

        {/* LAYER 3: Live Operations Ticker (Sticky with Header) */}
        <LiveOperationsTicker />
      </header>
    </>
  );
}
