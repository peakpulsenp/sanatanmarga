import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { continuityEngine } from "@/src/lib/continuityEngine";
import { useAuth } from "@/src/lib/auth";
import { CommunityPost } from "@/src/types";
import { db, collection, query, orderBy, safeOnSnapshot } from "@/src/lib/firebase";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import SEOHead from "@/src/components/common/SEOHead";
import PostCard from "@/src/components/community/PostCard";
import CreatePostModal from "@/src/components/community/CreatePostModal";
import { TrendingUp, Clock, Plus, Hash, Image as ImageIcon, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CommunitySkeleton } from "@/src/components/ui/PageLoaders";
import { parseTimestamp } from "@/src/lib/utils";
import { useLanguage } from "@/src/context/LanguageContext";
import { chautariStore } from "@/src/utils/chautariStore";

export default function CommunityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState<"new" | "top">("new");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const CATEGORIES = [
    { id: "all", label: language === 'en' ? "All" : "सबै" },
    { id: "News", label: language === 'en' ? "News" : "समाचार" },
    { id: "Market", label: language === 'en' ? "Market" : "बजार" },
    { id: "Advice", label: language === 'en' ? "Advice" : "सुझाव" },
    { id: "Showcase", label: language === 'en' ? "Showcase" : "प्रदर्शनी" },
    { id: "General", label: language === 'en' ? "General" : "सामान्य" }
  ];

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const combinePosts = (remotePosts: CommunityPost[]) => {
      const localPosts = chautariStore.getLocalPosts();
      const map = new Map<string, CommunityPost>();
      
      // Add remote posts
      remotePosts.forEach(p => {
        if (p && p.id) map.set(p.id, p);
      });

      // Add local posts (prefixed or recently created/shared)
      localPosts.forEach(p => {
        if (p && p.id) map.set(p.id, p);
      });

      let all = Array.from(map.values());

      // Filter out deleted/hidden posts
      all = all.filter(p => !p.status || (p.status !== "removed" && p.status !== "flagged"));

      // Category filter
      if (selectedCategory && selectedCategory !== "all") {
        all = all.filter(p => p.category === selectedCategory);
      }

      // Sort
      return all.sort((a, b) => {
        if (sortBy === "top") {
          const scoreA = (a.upvotes || 0) - (a.downvotes || 0);
          const scoreB = (b.upvotes || 0) - (b.downvotes || 0);
          return scoreB - scoreA;
        }
        const timeA = parseTimestamp(a.createdAt);
        const timeB = parseTimestamp(b.createdAt);
        return timeB - timeA;
      });
    };

    const loadFeed = async () => {
      try {
        const feedType = sortBy === "new" ? "recent" : "trending";
        const feedPosts = await continuityEngine.getRecentPosts(feedType, 40);
        if (isMounted) {
          setPosts(combinePosts(feedPosts as CommunityPost[]));
          setLoading(false);
        }
      } catch (e) {
        if (isMounted) {
          setPosts(combinePosts([]));
          setLoading(false);
        }
      }
    };

    // Live real-time Firestore listener with safe circuit-breaker handling
    const q = query(collection(db, "communityPosts"), orderBy("createdAt", "desc"));
    const unsubFirestore = safeOnSnapshot(q, (snapshot) => {
      if (!isMounted) return;
      const remote = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as CommunityPost[];
      setPosts(combinePosts(remote));
      setLoading(false);
    }, "community_posts_feed");

    const handleLocalUpdate = () => {
      if (isMounted) {
        setPosts(prev => combinePosts(prev));
      }
    };

    window.addEventListener("chautari-post-created", handleLocalUpdate);
    window.addEventListener("chautari-post-deleted", handleLocalUpdate);
    window.addEventListener("chautari-vote-changed", handleLocalUpdate);
    window.addEventListener("offline-queue-changed", handleLocalUpdate);

    loadFeed();
    return () => {
      isMounted = false;
      if (unsubFirestore) unsubFirestore();
      window.removeEventListener("chautari-post-created", handleLocalUpdate);
      window.removeEventListener("chautari-post-deleted", handleLocalUpdate);
      window.removeEventListener("chautari-vote-changed", handleLocalUpdate);
      window.removeEventListener("offline-queue-changed", handleLocalUpdate);
    };
  }, [sortBy, selectedCategory]);

  if (loading) return <CommunitySkeleton />;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={language === 'en' ? "Chautari - Sanatan Public Discussion Community" : "चौतारी - सनातन सार्वजनिक छलफल मञ्च"}
        description={language === 'en' ? "Chautari is a vibrant public space for Nepali news discourse, cultural exchange, thoughts, and community sharing." : "चौतारी - सनातन मार्गको नागरिक संवाद तथा विचार आदानप्रदान गर्ने खुला डिजिटल मञ्च।"}
        url="/community"
      />
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Feed */}
          <div className="flex-1 space-y-4">
            {/* Category Filter - Sticky under Ticker */}
            <div className="sticky top-[100px] md:top-[124px] z-30 bg-background/80 backdrop-blur-md border-b border-border-theme -mx-4 px-4 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar overflow-hidden">
               {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border cursor-pointer ${
                    (selectedCategory === cat.id || (cat.id === "all" && !selectedCategory))
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-muted-area/50 text-muted-text border-border-theme/50 hover:border-primary/30"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Create Post Bar (Reddit Style) */}
            <div className="bg-card rounded-xl p-3 border border-border-theme flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black shrink-0 border border-primary/20">
                {user?.displayName?.charAt(0) || "U"}
              </div>
              <button 
                onClick={() => user ? setShowCreateModal(true) : navigate("/login")}
                className="flex-1 bg-muted-area/50 hover:bg-muted-area border border-border-theme/50 rounded-lg px-4 py-2 text-muted-text/50 text-sm font-medium text-left transition-colors cursor-pointer"
              >
                {language === 'en' ? "Create a post or share your thought..." : "नयाँ पोस्ट वा आफ्नो विचार लेख्नुहोस्..."}
              </button>
              <button 
                onClick={() => user ? setShowCreateModal(true) : navigate("/login")} 
                className="p-2 hover:bg-muted-area rounded-lg text-muted-text transition-colors cursor-pointer"
                title={language === 'en' ? "Upload Media" : "फोटो थप्नुहोस्"}
              >
                <ImageIcon size={20} />
              </button>
            </div>

            {/* Sort & Filter */}
            <div className="flex items-center justify-between bg-card p-2 px-3 rounded-xl border border-border-theme shadow-sm">
               <div className="flex items-center gap-1 bg-muted-area/50 p-1 rounded-lg">
                <button
                  onClick={() => setSortBy("new")}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-black transition-all cursor-pointer ${
                    sortBy === "new" ? "bg-card shadow-sm text-primary" : "text-muted-text hover:text-card-foreground"
                  }`}
                >
                  <Clock size={16} /> {language === 'en' ? "Newest" : "ताजा"}
                </button>
                <button
                  onClick={() => setSortBy("top")}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-black transition-all cursor-pointer ${
                    sortBy === "top" ? "bg-card shadow-sm text-primary" : "text-muted-text hover:text-card-foreground"
                  }`}
                >
                  <TrendingUp size={16} /> {language === 'en' ? "Popular" : "चर्चित"}
                </button>
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {posts.length > 0 ? (
                  posts.map(post => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      key={post.id}
                    >
                      <PostCard post={post} />
                    </motion.div>
                  ))
                ) : (
                  <div className="bg-card rounded-2xl p-16 text-center border border-border-theme shadow-sm" key="empty">
                    <p className="text-muted-text font-bold">
                      {language === 'en' ? "No posts found in this section." : "यस विधामा कुनै पोस्ट भेटिएन।"}
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar (Desktop) */}
          <aside className="hidden lg:block w-80 space-y-4 shrink-0">
            <div className="sticky top-24 space-y-4">
              {/* Active Communities (Reddit Style) */}
              <div className="bg-card rounded-2xl border border-border-theme overflow-hidden shadow-sm">
                <div className="p-4 bg-primary/5 border-b border-border-theme">
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                    {language === 'en' ? "POPULAR CHAUTARI TOPICS" : "चर्चित चौतारी विषयहरू"}
                  </h3>
                </div>
                <div className="p-2 space-y-1">
                  {CATEGORIES.filter(c => c.id !== "all").slice(0, 4).map((com, index) => (
                    <div
                      key={com.id}
                      onClick={() => setSelectedCategory(com.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-muted-area group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black group-hover:bg-primary/20 transition-colors">
                          {index + 1}
                        </div>
                        <div className="text-left leading-tight">
                          <p className="text-xs font-black text-card-foreground">c/{com.id}</p>
                          <p className="text-[9px] text-muted-text font-bold">{com.label}</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedCategory(com.id); }}
                        className="px-3 py-1 bg-primary text-white text-[10px] font-black rounded-full shadow-sm hover:brightness-110 relative z-10 cursor-pointer"
                      >
                        {language === 'en' ? "View" : "हेर्नुहोस्"}
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setSelectedCategory("all")}
                    className="w-full py-2 text-[10px] font-black text-primary hover:bg-muted-area rounded-xl transition-colors uppercase tracking-widest mt-1 cursor-pointer"
                  >
                    {language === 'en' ? "View All" : "सबै हेर्नुहोस्"}
                  </button>
                </div>
              </div>

              {/* Category Browser */}
              <div className="bg-card rounded-2xl border border-border-theme overflow-hidden shadow-sm">
                <div className="p-4 bg-muted-area/30 border-b border-border-theme">
                  <h3 className="text-[10px] font-black text-muted-text uppercase tracking-[0.2em]">
                    {language === 'en' ? "COMMUNITY EXPLORER" : "विधा अन्वेषक"}
                  </h3>
                </div>
                <div className="p-2 space-y-1">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                        (selectedCategory === cat.id || (cat.id === "all" && !selectedCategory))
                          ? "bg-primary/10 text-primary"
                          : "text-muted-text hover:bg-muted-area hover:text-card-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="opacity-50">{cat.id === "all" ? <Hash size={18} /> : "c/"}</span>
                        {cat.label}
                      </div>
                      {(selectedCategory === cat.id || (cat.id === "all" && !selectedCategory)) && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guidelines */}
              <div className="bg-card rounded-2xl border border-border-theme p-5 shadow-sm">
                <h4 className="text-xs font-black text-card-foreground mb-4 uppercase tracking-widest opacity-70">
                  {language === 'en' ? "Community Guidelines" : "चौतारी आचारसंहिता"}
                </h4>
                <ul className="space-y-3 text-xs text-muted-text font-medium leading-relaxed">
                  <li className="flex gap-2">
                    <span>1.</span> {language === 'en' ? "Be respectful, cordial and constructive." : "शिष्ट, सभ्य र रचनात्मक छलफल गर्नुहोस्।"}
                  </li>
                  <li className="flex gap-2">
                    <span>2.</span> {language === 'en' ? "Share verified news, culture, and positive insights." : "प्रमाणित तथ्य, ज्ञान र सकारात्मक सन्देश प्रवाह गर्नुहोस्।"}
                  </li>
                  <li className="flex gap-2">
                    <span>3.</span> {language === 'en' ? "Strictly avoid hate speech, misinformation or spam." : "भ्रामक सूचना, घृणास्पद अभिव्यक्ति वा स्प्याम निषेध छ।"}
                  </li>
                </ul>
              </div>
              
              <div className="p-4 text-[10px] text-muted-text font-medium leading-relaxed opacity-50">
                &copy; 2026 Chautari Community • Sanatan Marga Open Discourse Network.
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      <CreatePostModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </div>
  );
}
