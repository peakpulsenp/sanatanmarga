import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import SEOHead from "@/src/components/common/SEOHead";
import { 
  Share2, ShieldCheck, ExternalLink, Play, Radio, Eye, Heart, 
  Search, Filter, Check, Copy, MessageSquare, Sparkles, Tv, Globe,
  ArrowRight, Users, Bell, Bookmark, Video, Volume2, HelpCircle, X, RefreshCw, Clock
} from "lucide-react";
import { collection, query, orderBy, where } from "@/src/lib/firebase";
import { db, getDocs } from "@/src/lib/firebase";
import { SocialAccount, SocialPost, SocialPlatform, SocialContentType } from "@/src/types";
import { defaultSocialAccounts, defaultSocialPosts } from "@/src/data/defaultSocialData";
import { checkAndSyncSocialChannelsAndPosts } from "@/src/services/socialSyncService";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import VideoEmbed from "@/src/components/common/VideoEmbed";
import { useLanguage } from "@/src/context/LanguageContext";

export default function SocialHubPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>(defaultSocialAccounts);
  const [posts, setPosts] = useState<SocialPost[]>(defaultSocialPosts);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  // Filters
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedContentType, setSelectedContentType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Video / Post Modal Preview
  const [activeMediaPost, setActiveMediaPost] = useState<SocialPost | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleAutoFetchSocialMetrics = () => {
    setIsSyncing(true);
    toast.loading(language === "en" 
      ? "Auto-fetching live views, likes and profile updates from social channels..." 
      : "मुख्य सामाजिक सञ्जाल पेजहरूबाट ताजा दृष्यहरू, लाइक्स र प्रोफाइल तस्वीरहरू अटो-फेच हुँदैछ...");
    setTimeout(async () => {
      await checkAndSyncSocialChannelsAndPosts(true);
      setIsSyncing(false);
      toast.dismiss();
      toast.success(language === "en" ? "Successfully refreshed social metrics!" : "सफलतापूर्वक २४ घण्टाको अटो-सिंक र प्रोफाइल अपडेट सम्पन्न गरियो!");
    }, 1200);
  };

  // Load from Firestore with fallback & 24h auto-sync
  useEffect(() => {
    const fetchSocialData = async () => {
      try {
        await checkAndSyncSocialChannelsAndPosts(false);

        const accQ = query(collection(db, "socialAccounts"), orderBy("order", "asc"));
        const accSnap = await getDocs(accQ);
        if (!accSnap.empty) {
          const docs = accSnap.docs.map(d => ({ id: d.id, ...d.data() } as SocialAccount)).filter(a => a.isActive);
          if (docs.length > 0) setAccounts(docs);
        }

        const postQ = query(collection(db, "socialPosts"), orderBy("createdAt", "desc"));
        const postSnap = await getDocs(postQ);
        if (!postSnap.empty) {
          const docs = postSnap.docs.map(d => ({ id: d.id, ...d.data() } as SocialPost));
          if (docs.length > 0) setPosts(docs);
        }
      } catch (err) {
        console.warn("Using fallback social data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSocialData();
  }, []);

  // Copy share link
  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success(language === "en" ? "Link copied to clipboard!" : "लिङ्क कपी गरियो!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Accounts
  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          acc.handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (acc.description && acc.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPlatform = selectedPlatform === "all" || acc.platform === selectedPlatform;
    return matchesSearch && matchesPlatform;
  });

  // Filtered Posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (post.caption && post.caption.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPlatform = selectedPlatform === "all" || post.platform === selectedPlatform;
    const matchesType = selectedContentType === "all" || post.contentType === selectedContentType;
    return matchesSearch && matchesPlatform && matchesType;
  });

  // Platform badges with custom colors
  const getPlatformInfo = (platform: SocialPlatform) => {
    const config: Record<SocialPlatform, { name: string; color: string; bg: string; border: string }> = {
      youtube: { name: "YouTube", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
      facebook: { name: "Facebook", color: "text-blue-600", bg: "bg-blue-600/10", border: "border-blue-600/30" },
      twitter: { name: "X (Twitter)", color: "text-sky-500", bg: "bg-sky-500/10", border: "border-sky-500/30" },
      instagram: { name: "Instagram", color: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/30" },
      tiktok: { name: "TikTok", color: "text-slate-900 dark:text-slate-100", bg: "bg-slate-900/10 dark:bg-slate-100/10", border: "border-slate-800/20" },
      telegram: { name: "Telegram", color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
      whatsapp: { name: "WhatsApp", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
      spotify: { name: "Spotify Podcast", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30" },
      threads: { name: "Threads", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30" },
      linkedin: { name: "LinkedIn", color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/30" }
    };
    return config[platform] || { name: platform, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" };
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 flex flex-col">
      <SEOHead 
        title={language === "en" ? "Social Hub - Sanatan Marga" : "सामाजिक सञ्जाल हब - सनातन मार्ग"}
        description={language === "en" ? "Official Sanatan Marga social channels: YouTube, Facebook, WhatsApp, Instagram, podcasts, and video feeds." : "सनातन मार्ग आधिकारिक सामाजिक सञ्जाल हब, भिडियो, रिल्स, पडकास्ट तथा सामाजिक च्यानलहरू।"}
      />
      <Header />
      <div className="flex-1 pb-20">

      {/* HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background pt-10 pb-12 border-b border-border-theme/60">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 bg-card border border-border-theme px-4 py-1.5 rounded-full shadow-sm text-xs font-black text-primary uppercase tracking-widest">
              <Sparkles size={14} className="animate-pulse text-amber-500" />
              <span>{language === "en" ? "Sanatan Marga Official Social Hub" : "सनातन मार्ग आधिकारिक सामाजिक सञ्जाल हब"}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
              {language === "en" ? "Connect with Sanatan Media" : "सनातन मिडियासँग जोडिनुहोस्"}
            </h1>

            <p className="text-base sm:text-lg text-muted-text font-medium leading-relaxed">
              {language === "en" 
                ? "The official digital voice for Sanatan Dharma, Vedic culture, daily Panchang, spiritual discourses, and uplifting reels."
                : "सनातन धर्म, वैदिक संस्कृति, दैनिक पञ्चाङ्ग, धर्मशास्त्र प्रवचन, राष्ट्रिय समाचार तथा भक्तिमय रिल्सको आधिकारिक डिजिटल आवाज।"}
            </p>
          </div>

          {/* Quick Platform Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-red-500">380K+</div>
              <div className="text-xs font-bold text-muted-text">{language === "en" ? "YouTube Subscribers" : "युट्युब सब्सक्राइबर"}</div>
            </div>

            <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-blue-600">520K+</div>
              <div className="text-xs font-bold text-muted-text">{language === "en" ? "Facebook Followers" : "फेसबुक फलोअर्स"}</div>
            </div>

            <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-emerald-500">150K+</div>
              <div className="text-xs font-bold text-muted-text">{language === "en" ? "WhatsApp Members" : "ह्वाट्सएप सदस्य"}</div>
            </div>

            <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-pink-500">210K+</div>
              <div className="text-xs font-bold text-muted-text">{language === "en" ? "Instagram Followers" : "इन्स्टाग्राम फलोअर्स"}</div>
            </div>
          </div>

        </div>
      </section>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-12">

        {/* SEARCH & FILTER BAR */}
        <div className="bg-card border border-border-theme rounded-3xl p-4 shadow-md space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
              <input
                type="text"
                placeholder={language === "en" ? "Search channels or content..." : "खाता वा सामाग्री खोज्नुहोस्..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-muted-area border border-border-theme text-xs font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {/* Auto Fetch Button */}
            <button
              onClick={handleAutoFetchSocialMetrics}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all shrink-0"
            >
              <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
              <span>{isSyncing ? (language === "en" ? "Syncing..." : "सिंक हुँदैछ...") : (language === "en" ? "Auto-Fetch Metrics" : "अटो-फेच दृष्यहरू र लाइक्स")}</span>
            </button>

            {/* Platform Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar w-full md:w-auto pb-1 md:pb-0">
              <button
                onClick={() => setSelectedPlatform("all")}
                className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all ${
                  selectedPlatform === "all"
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-muted-area text-muted-text hover:text-foreground border border-border-theme/60"
                }`}
              >
                {language === "en" ? "All" : "सबै"}
              </button>

              {["youtube", "facebook", "instagram", "twitter", "whatsapp", "telegram", "tiktok", "spotify"].map((p) => {
                const info = getPlatformInfo(p as SocialPlatform);
                const isSel = selectedPlatform === p;
                return (
                  <button
                    key={p}
                    onClick={() => setSelectedPlatform(p)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1.5 border ${
                      isSel
                        ? `${info.bg} ${info.color} ${info.border} shadow-sm font-black`
                        : "bg-muted-area text-muted-text border-border-theme/60 hover:text-foreground"
                    }`}
                  >
                    <span>{info.name}</span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* 24-Hour Auto-Sync Status Notice */}
          <div className="flex items-center justify-between bg-muted-area/50 border border-border-theme/60 px-4 py-2 rounded-2xl text-[11px] font-bold text-muted-text">
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-primary animate-pulse" />
              <span>
                {language === "en" 
                  ? "Official social accounts and media feeds are synchronized every 24 hours automatically." 
                  : "आधिकारिक सामाजिक च्यानल तथा पेजहरूको प्रोफाइल तस्वीर र फिड प्रत्येक २४ घण्टामा स्वचालित रूपमा सिंक हुन्छ।"}
              </span>
            </div>
            <span className="text-emerald-600 dark:text-emerald-400 font-black shrink-0">● {language === "en" ? "24/7 Live Sync" : "२४/७ लाइभ सिंक"}</span>
          </div>
        </div>

        {/* SECTION 1: OFFICIAL ACCOUNTS GRID */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-border-theme pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                <Share2 className="text-primary" size={24} />
                <span>{language === "en" ? "Official Channels & Pages" : "आधिकारिक सामाजिक च्यानल तथा पेजहरू"}</span>
              </h2>
              <p className="text-xs text-muted-text font-medium mt-1">
                {language === "en" ? "Official verified handles of Sanatan Marga" : "सनातन मार्ग र सनातन मिडियाका आधिकारिक verified ह्यान्डलहरू"}
              </p>
            </div>

            <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
              {filteredAccounts.length} {language === "en" ? "Channels" : "च्यानलहरू"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredAccounts.map((acc) => {
              const platformInfo = getPlatformInfo(acc.platform);
              return (
                <motion.div
                  key={acc.id}
                  whileHover={{ y: -4 }}
                  className="bg-card border border-border-theme rounded-3xl p-5 shadow-sm hover:shadow-2xl transition-all flex flex-col justify-between gap-5 relative group"
                >
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="relative">
                        <img
                          src={acc.avatarUrl || "https://picsum.photos/seed/sanatan/200/200"}
                          alt={acc.name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-border-theme shadow-md group-hover:border-primary transition-colors"
                        />
                        {acc.isVerified && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 shadow-md">
                            <ShieldCheck size={14} />
                          </div>
                        )}
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${platformInfo.bg} ${platformInfo.color} ${platformInfo.border}`}>
                        {platformInfo.name}
                      </span>
                    </div>

                    {/* Title & Handle */}
                    <div>
                      <h3 className="text-base font-black text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {acc.name}
                      </h3>
                      <p className="text-xs font-bold text-primary">{acc.handle}</p>
                    </div>

                    {/* Followers & Category */}
                    <div className="flex items-center justify-between text-xs bg-muted-area/80 px-3 py-2 rounded-2xl border border-border-theme/60">
                      <span className="font-bold text-muted-text">{language === "en" ? "Community:" : "समुदाय:"}</span>
                      <span className="font-black text-foreground">{acc.followerCount || (language === "en" ? "Active" : "सक्रिय")}</span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-text line-clamp-2 font-medium leading-relaxed">
                      {acc.description}
                    </p>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-border-theme/60 flex items-center gap-2">
                    <a
                      href={acc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/20"
                    >
                      <span>{language === "en" ? "Follow / Join" : "फलो / जोडिनुहोस्"}</span>
                      <ExternalLink size={14} />
                    </a>

                    <button
                      onClick={() => handleCopyLink(acc.url, acc.id)}
                      className="p-2.5 rounded-2xl bg-muted-area hover:bg-muted-area/80 text-foreground border border-border-theme text-xs font-bold transition-all"
                      title={language === "en" ? "Copy Link" : "लिङ्क कपी गर्नुहोस्"}
                    >
                      {copiedId === acc.id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: FEATURED SOCIAL POSTS & VIDEOS */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                <Video className="text-primary" size={24} />
                <span>{language === "en" ? "Feeds, Videos & Podcasts" : "सनातन फिड, भिडियो तथा पडकास्टहरू"}</span>
              </h2>
              <p className="text-xs text-muted-text font-medium mt-1">
                {language === "en" 
                  ? "Bhagavad Gita discourses, Pashupatinath Aarti, daily panchang and top video highlights" 
                  : "ताजा श्रीमद्भगवद्गीता प्रवचन, पशुपतिनाथ आरती, दैनिक पञ्चाङ्ग र मुख्य समाचारहरू"}
              </p>
            </div>

            {/* Content Type Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => setSelectedContentType("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${
                  selectedContentType === "all"
                    ? "bg-foreground text-background font-black"
                    : "bg-muted-area text-muted-text hover:text-foreground"
                }`}
              >
                {language === "en" ? "All Types" : "सबै प्रकार"}
              </button>
              <button
                onClick={() => setSelectedContentType("video")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${
                  selectedContentType === "video"
                    ? "bg-foreground text-background font-black"
                    : "bg-muted-area text-muted-text hover:text-foreground"
                }`}
              >
                {language === "en" ? "Videos" : "भिडियो"}
              </button>
              <button
                onClick={() => setSelectedContentType("reel")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${
                  selectedContentType === "reel"
                    ? "bg-foreground text-background font-black"
                    : "bg-muted-area text-muted-text hover:text-foreground"
                }`}
              >
                {language === "en" ? "Reels / Shorts" : "रिल्स/शर्ट्स"}
              </button>
              <button
                onClick={() => setSelectedContentType("podcast")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${
                  selectedContentType === "podcast"
                    ? "bg-foreground text-background font-black"
                    : "bg-muted-area text-muted-text hover:text-foreground"
                }`}
              >
                {language === "en" ? "Podcasts" : "पडकास्ट"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => {
              const platformInfo = getPlatformInfo(post.platform);
              return (
                <motion.div
                  key={post.id}
                  whileHover={{ y: -4 }}
                  className="bg-card border border-border-theme rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4 p-5">
                    
                    {/* Media Player Card Header / Thumbnail */}
                    <div 
                      onClick={() => setActiveMediaPost(post)}
                      className="relative aspect-video rounded-2xl overflow-hidden bg-black cursor-pointer group-hover:shadow-lg transition-all"
                    >
                      {post.thumbnailUrl?.trim() ? (
                        <img
                          src={post.thumbnailUrl || null}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-primary/30 to-amber-500/20 text-foreground font-black text-sm">
                          {post.title}
                        </div>
                      )}

                      {/* Play Overlay Button */}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <Play size={24} className="fill-current ml-1" />
                        </div>
                      </div>

                      {/* Platform Tag */}
                      <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black border backdrop-blur-md ${platformInfo.bg} ${platformInfo.color} ${platformInfo.border}`}>
                        {platformInfo.name}
                      </span>

                      {/* Video Duration / Type Badge */}
                      <span className="absolute bottom-3 right-3 bg-black/80 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                        {post.contentType}
                      </span>
                    </div>

                    {/* Author Info */}
                    <div className="flex items-center justify-between text-xs font-bold text-muted-text">
                      <span className="text-primary">{post.authorName || (language === "en" ? "Sanatan Media" : "सनातन मिडिया")}</span>
                      <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(language === "en" ? 'en-US' : 'ne-NP') : (language === "en" ? "Just now" : "भर्खरै")}</span>
                    </div>

                    {/* Title */}
                    <h3 
                      onClick={() => setActiveMediaPost(post)}
                      className="text-base font-black text-foreground line-clamp-2 leading-snug cursor-pointer hover:text-primary transition-colors"
                    >
                      {post.title}
                    </h3>

                    {/* Caption */}
                    {post.caption && (
                      <p className="text-xs text-muted-text line-clamp-2 font-medium leading-relaxed">
                        {post.caption}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs font-bold text-muted-text pt-2 border-t border-border-theme/60">
                      <span className="flex items-center gap-1">
                        <Eye size={14} className="text-primary" />
                        {post.viewsCount?.toLocaleString() || 0} {language === "en" ? "views" : "दृष्यहरू"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={14} className="text-red-500" />
                        {post.likesCount?.toLocaleString() || 0} {language === "en" ? "likes" : "लाइक्स"}
                      </span>
                    </div>

                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-muted-area/50 border-t border-border-theme/60 flex items-center gap-2">
                    <button
                      onClick={() => setActiveMediaPost(post)}
                      className="flex-1 py-2.5 rounded-2xl bg-card hover:bg-muted-area text-foreground border border-border-theme text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      <Play size={14} className="text-primary fill-current" />
                      <span>{language === "en" ? "Play Now" : "प्ले गर्नुहोस्"}</span>
                    </button>

                    <a
                      href={post.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2.5 rounded-2xl bg-muted-area hover:bg-muted-area/80 text-foreground border border-border-theme text-xs font-bold flex items-center gap-1 transition-all"
                      title={language === "en" ? "Open in platform" : "सोसल प्लेटफर्ममा खोल्नुहोस्"}
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

      </div>

      {/* MEDIA PLAYER MODAL */}
      <AnimatePresence>
        {activeMediaPost && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border-theme rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl space-y-4 p-6 relative"
            >
              <button
                onClick={() => setActiveMediaPost(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-muted-area text-foreground flex items-center justify-center font-bold hover:bg-primary hover:text-white transition-colors z-20"
              >
                <X size={18} />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-2 pr-10">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-primary/10 text-primary uppercase">
                    {activeMediaPost.platform} • {activeMediaPost.contentType}
                  </span>
                  <h3 className="text-lg font-black text-foreground line-clamp-1">
                    {activeMediaPost.title}
                  </h3>
                </div>

                {/* Embed video player iframe if YouTube */}
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-border-theme shadow-inner">
                  <VideoEmbed 
                    url={activeMediaPost.url}
                    title={activeMediaPost.title}
                    poster={activeMediaPost.thumbnailUrl}
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <p className="text-sm font-medium text-muted-text leading-relaxed">
                    {activeMediaPost.caption || activeMediaPost.title}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-border-theme">
                    <span className="text-xs font-bold text-primary">
                      {activeMediaPost.authorName} ({activeMediaPost.authorHandle})
                    </span>

                    <a
                      href={activeMediaPost.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-black flex items-center gap-1.5 hover:bg-primary/20 transition-colors"
                    >
                      <span>{language === "en" ? "View Original Post" : "मूल पोष्ट हेर्नुहोस्"}</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}
