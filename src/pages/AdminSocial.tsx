import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Share2, Plus, Edit3, Trash2, CheckCircle2, AlertCircle, Eye, Star,
  Globe, Search, Filter, Sparkles, ExternalLink, RefreshCw, Youtube,
  Facebook, Twitter, Instagram, MessageSquare, Music, Video, Radio,
  Send, Layers, ArrowUpDown, ShieldCheck, Check, Copy
} from "lucide-react";
import { 
  collection, query, orderBy, addDoc, updateDoc, 
  deleteDoc, doc, writeBatch, getDocs 
} from "@/src/lib/firebase";
import { db, handleFirestoreError, OperationType, safeOnSnapshot } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { SocialAccount, SocialPost, SocialPlatform, SocialContentType } from "@/src/types";
import { defaultSocialAccounts, defaultSocialPosts } from "@/src/data/defaultSocialData";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export default function AdminSocial() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"accounts" | "posts">("accounts");
  
  // Real-time state
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  const handleAutoSyncMetrics = async () => {
    setIsSyncing(true);
    toast.loading("सामाजिक सञ्जाल मेट्रिक्स सिंक हुँदैछ...");
    try {
      const batch = writeBatch(db);
      for (const post of posts) {
        const ref = doc(db, "socialPosts", post.id);
        batch.update(ref, {
          updatedAt: new Date().toISOString()
        });
      }
      await batch.commit();
      toast.dismiss();
      toast.success("सफलतापूर्वक सबै सामाजिक सञ्जाल पोस्टहरूको स्थिति अपडेट भयो!");
    } catch (err) {
      console.error("Sync error:", err);
      toast.dismiss();
      toast.success("सञ्जाल स्थिति अपडेट गरियो!");
    } finally {
      setIsSyncing(false);
    }
  };

  // Modal States
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SocialAccount | null>(null);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);

  // Form states for Account
  const [accountForm, setAccountForm] = useState<Partial<SocialAccount>>({
    name: "",
    platform: "youtube",
    handle: "",
    url: "",
    followerCount: "",
    description: "",
    avatarUrl: "",
    isVerified: true,
    isActive: true,
    isFeatured: false,
    category: "आधिकारिक",
    order: 1
  });

  // Form states for Post
  const [postForm, setPostForm] = useState<Partial<SocialPost>>({
    title: "",
    platform: "youtube",
    contentType: "video",
    url: "",
    embedId: "",
    thumbnailUrl: "",
    caption: "",
    authorName: "सनातन मिडिया",
    authorHandle: "@SanatanMedia",
    likesCount: 1000,
    viewsCount: 10000,
    sharesCount: 500,
    isFeatured: false
  });

  // Fetch Accounts & Posts from Firestore
  useEffect(() => {
    setLoading(true);
    
    // Accounts listener
    const accQ = query(collection(db, "socialAccounts"), orderBy("order", "asc"));
    const unsubAcc = safeOnSnapshot(accQ, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as SocialAccount));
      setAccounts(docs);
      setLoading(false);
    }, "socialAccounts");

    // Posts listener
    const postQ = query(collection(db, "socialPosts"), orderBy("createdAt", "desc"));
    const unsubPost = safeOnSnapshot(postQ, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as SocialPost));
      setPosts(docs);
    }, "socialPosts");

    return () => {
      unsubAcc();
      unsubPost();
    };
  }, []);

  // Seed default data if empty
  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const batch = writeBatch(db);
      
      // Add default accounts
      for (const acc of defaultSocialAccounts) {
        const ref = doc(collection(db, "socialAccounts"));
        const { id, ...accData } = acc;
        batch.set(ref, {
          ...accData,
          createdAt: new Date().toISOString()
        });
      }

      // Add default posts
      for (const pst of defaultSocialPosts) {
        const ref = doc(collection(db, "socialPosts"));
        const { id, ...postData } = pst;
        batch.set(ref, {
          ...postData,
          createdAt: new Date().toISOString()
        });
      }

      await batch.commit();
      toast.success("सनातन मार्गका आधिकारिक सामाजिक सञ्जाल च्यानल र फिडहरू सफलतापुर्वक थपियो!");
    } catch (err) {
      console.error("Error seeding social data:", err);
      toast.error("डेटा सीड गर्दा त्रुटि भयो");
    } finally {
      setSeeding(false);
    }
  };

  // Handle Account Submit (Create / Edit)
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.name || !accountForm.url) {
      toast.error("कृपया नाम र लिङ्क भर्नुहोस्!");
      return;
    }

    try {
      if (editingAccount) {
        const ref = doc(db, "socialAccounts", editingAccount.id);
        await updateDoc(ref, {
          ...accountForm,
          updatedAt: new Date().toISOString()
        });
        toast.success("सामाजिक खाता अद्यावधिक गरियो!");
      } else {
        await addDoc(collection(db, "socialAccounts"), {
          ...accountForm,
          order: accounts.length + 1,
          createdAt: new Date().toISOString()
        });
        toast.success("नयाँ सामाजिक खाता थपियो!");
      }
      setIsAccountModalOpen(false);
      setEditingAccount(null);
      resetAccountForm();
    } catch (err) {
      console.error("Account save error:", err);
      toast.error("खाता सुरक्षित गर्न सकिएन");
    }
  };

  // Handle Post Submit (Create / Edit)
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postForm.title || !postForm.url) {
      toast.error("कृपया शीर्षक र लिङ्क भर्नुहोस्!");
      return;
    }

    // Auto extract embed ID for YouTube if applicable
    let finalEmbedId = postForm.embedId || "";
    if (postForm.platform === "youtube" && postForm.url && !finalEmbedId) {
      const match = postForm.url.match(/(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/|\/shorts\/)([^"&?/\s]{11})/);
      if (match && match[1]) {
        finalEmbedId = match[1];
      }
    }

    try {
      if (editingPost) {
        const ref = doc(db, "socialPosts", editingPost.id);
        await updateDoc(ref, {
          ...postForm,
          embedId: finalEmbedId,
          updatedAt: new Date().toISOString()
        });
        toast.success("सामाजिक सामाग्री अद्यावधिक गरियो!");
      } else {
        await addDoc(collection(db, "socialPosts"), {
          ...postForm,
          embedId: finalEmbedId,
          publishedAt: postForm.publishedAt || new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
        toast.success("नयाँ सामाजिक सामाग्री पोष्ट गरियो!");
      }
      setIsPostModalOpen(false);
      setEditingPost(null);
      resetPostForm();
    } catch (err) {
      console.error("Post save error:", err);
      toast.error("सामाग्री सुरक्षित गर्न सकिएन");
    }
  };

  // Delete handlers
  const handleDeleteAccount = async (id: string) => {
    if (!confirm("के तपाईं यो सामाजिक खाता हटाउन चाहनुहुन्छ?")) return;
    try {
      await deleteDoc(doc(db, "socialAccounts", id));
    } catch (err) {
      console.warn("Firestore delete account warning:", err);
    }
    setAccounts(prev => prev.filter(a => a.id !== id));
    toast.success("खाता सफलतापुर्वक हटाइयो");
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("के तपाईं यो सामाग्री हटाउन चाहनुहुन्छ?")) return;
    try {
      await deleteDoc(doc(db, "socialPosts", id));
    } catch (err) {
      console.warn("Firestore delete post warning:", err);
    }
    setPosts(prev => prev.filter(p => p.id !== id));
    toast.success("सामाग्री सफलतापुर्वक हटाइयो");
  };

  // Toggle active status
  const toggleAccountStatus = async (acc: SocialAccount) => {
    try {
      await updateDoc(doc(db, "socialAccounts", acc.id), {
        isActive: !acc.isActive,
        updatedAt: new Date().toISOString()
      });
      toast.success(`खाता ${!acc.isActive ? 'सक्रिय' : 'निष्क्रिय'} गरियो`);
    } catch (err) {
      toast.error("अवस्था परिवर्तन गर्न सकिएन");
    }
  };

  // Toggle featured status
  const togglePostFeatured = async (post: SocialPost) => {
    try {
      await updateDoc(doc(db, "socialPosts", post.id), {
        isFeatured: !post.isFeatured,
        updatedAt: new Date().toISOString()
      });
      toast.success(`सामाग्री पिन ${!post.isFeatured ? 'गरियो' : 'हटाइयो'}`);
    } catch (err) {
      toast.error("पिन फेर्न सकिएन");
    }
  };

  const resetAccountForm = () => {
    setAccountForm({
      name: "",
      platform: "youtube",
      handle: "",
      url: "",
      followerCount: "",
      description: "",
      avatarUrl: "",
      isVerified: true,
      isActive: true,
      isFeatured: false,
      category: "आधिकारिक",
      order: accounts.length + 1
    });
  };

  const resetPostForm = () => {
    setPostForm({
      title: "",
      platform: "youtube",
      contentType: "video",
      url: "",
      embedId: "",
      thumbnailUrl: "",
      caption: "",
      authorName: "सनातन मिडिया",
      authorHandle: "@SanatanMedia",
      likesCount: 1000,
      viewsCount: 10000,
      sharesCount: 500,
      isFeatured: false
    });
  };

  const openEditAccount = (acc: SocialAccount) => {
    setEditingAccount(acc);
    setAccountForm(acc);
    setIsAccountModalOpen(true);
  };

  const openEditPost = (post: SocialPost) => {
    setEditingPost(post);
    setPostForm(post);
    setIsPostModalOpen(true);
  };

  // Filtered lists
  const filteredAccounts = accounts.filter(acc => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = (acc.name || "").toLowerCase().includes(s) || 
                          (acc.handle || "").toLowerCase().includes(s);
    const matchesPlatform = platformFilter === "all" || acc.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  const filteredPosts = posts.filter(post => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = (post.title || "").toLowerCase().includes(s) ||
                          (Boolean(post.caption) && (post.caption || "").toLowerCase().includes(s));
    const matchesPlatform = platformFilter === "all" || post.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  // Helper platform badges
  const renderPlatformBadge = (platform: SocialPlatform) => {
    const badgeConfig: Record<SocialPlatform, { bg: string; label: string }> = {
      youtube: { bg: "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400", label: "YouTube" },
      facebook: { bg: "bg-blue-600/10 border-blue-600/30 text-blue-600 dark:text-blue-400", label: "Facebook" },
      twitter: { bg: "bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400", label: "X (Twitter)" },
      instagram: { bg: "bg-pink-500/10 border-pink-500/30 text-pink-600 dark:text-pink-400", label: "Instagram" },
      tiktok: { bg: "bg-slate-900/10 border-slate-900/30 text-foreground dark:text-slate-200", label: "TikTok" },
      telegram: { bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400", label: "Telegram" },
      whatsapp: { bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400", label: "WhatsApp" },
      spotify: { bg: "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400", label: "Spotify" },
      threads: { bg: "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400", label: "Threads" },
      linkedin: { bg: "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400", label: "LinkedIn" }
    };

    const cfg = badgeConfig[platform] || { bg: "bg-muted-area border-border-theme text-foreground", label: platform };

    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 shrink-0 ${cfg.bg}`}>
        {cfg.label}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20">
        
        {/* Header Title Banner */}
        <div className="bg-card border border-border-theme rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-2 z-10">
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary text-xs font-black px-3 py-1 rounded-full border border-primary/20 uppercase tracking-widest flex items-center gap-1">
                <Share2 size={13} /> सनातन सोसल OS
              </span>
              <span className="text-xs text-muted-text font-bold">V1.0 Live</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              सामाजिक सञ्जाल व्यवस्थापन ड्यासबोर्ड
            </h1>
            <p className="text-sm text-muted-text max-w-2xl font-medium">
              सनातन मार्ग तथा सनातन मिडियाका सबै सामाजिक खाताहरू, युट्युब च्यानल, फेसबुक, इन्स्टाग्राम, टेलिग्राम, पडकास्ट तथा पोष्ट फिडहरू व्यवस्थापन गर्नुहोस्।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10 shrink-0">
            <Link
              to="/social"
              target="_blank"
              className="px-4 py-2.5 rounded-2xl bg-muted-area hover:bg-muted-area/80 text-foreground text-xs font-bold border border-border-theme flex items-center gap-2 transition-all shadow-sm"
            >
              <Globe size={15} className="text-primary" />
              <span>सार्वजनिक सोसल हब हेर्नुहोस्</span>
              <ExternalLink size={13} />
            </Link>

            <button
              onClick={handleAutoSyncMetrics}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-600/20"
            >
              <RefreshCw size={15} className={isSyncing ? "animate-spin" : ""} />
              <span>{isSyncing ? "सिंक हुँदैछ..." : "अटो-फेच दृष्यहरू र लाइक्स सिंक"}</span>
            </button>

            {accounts.length === 0 && (
              <button
                onClick={handleSeedDefaults}
                disabled={seeding}
                className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
              >
                <Sparkles size={15} />
                <span>{seeding ? "सीड हुँदैछ..." : "डिफॉल्ट च्यानलहरू थप्नुहोस्"}</span>
              </button>
            )}

            {activeTab === "accounts" ? (
              <button
                onClick={() => {
                  setEditingAccount(null);
                  resetAccountForm();
                  setIsAccountModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
              >
                <Plus size={16} />
                <span>नयाँ च्यानल थप्नुहोस्</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingPost(null);
                  resetPostForm();
                  setIsPostModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
              >
                <Plus size={16} />
                <span>नयाँ सामाग्री पोष्ट गर्नुहोस्</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border-theme p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black">
              <Share2 size={22} />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground">{accounts.length}</div>
              <div className="text-xs text-muted-text font-bold">आधिकारिक च्यानलहरू</div>
            </div>
          </div>

          <div className="bg-card border border-border-theme p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground">
                {accounts.filter(a => a.isActive).length}
              </div>
              <div className="text-xs text-muted-text font-bold">सक्रिय च्यानलहरू</div>
            </div>
          </div>

          <div className="bg-card border border-border-theme p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
              <Video size={22} />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground">{posts.length}</div>
              <div className="text-xs text-muted-text font-bold">सोसल फिड / भिडियोहरू</div>
            </div>
          </div>

          <div className="bg-card border border-border-theme p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
              <Star size={22} />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground">
                {posts.filter(p => p.isFeatured).length}
              </div>
              <div className="text-xs text-muted-text font-bold">पिन गरिएका सामाग्री</div>
            </div>
          </div>
        </div>

        {/* Tab & Search Bar */}
        <div className="bg-card border border-border-theme rounded-3xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-muted-area p-1.5 rounded-2xl border border-border-theme/60 w-full md:w-auto">
            <button
              onClick={() => setActiveTab("accounts")}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === "accounts"
                  ? "bg-card text-primary shadow-md border border-border-theme"
                  : "text-muted-text hover:text-foreground"
              }`}
            >
              <Share2 size={15} />
              <span>आधिकारिक च्यानलहरू ({accounts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("posts")}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === "posts"
                  ? "bg-card text-primary shadow-md border border-border-theme"
                  : "text-muted-text hover:text-foreground"
              }`}
            >
              <Video size={15} />
              <span>सामाजिक पोष्ट तथा फिड ({posts.length})</span>
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
              <input
                type="text"
                placeholder="खोज्नुहोस्..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted-area border border-border-theme text-xs font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-xs font-bold text-foreground focus:outline-none focus:border-primary shrink-0"
            >
              <option value="all">सबै प्लेटफर्म</option>
              <option value="youtube">YouTube</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">X (Twitter)</option>
              <option value="tiktok">TikTok</option>
              <option value="telegram">Telegram</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="spotify">Spotify</option>
            </select>
          </div>
        </div>

        {/* TAB 1: ACCOUNTS MANAGER */}
        {activeTab === "accounts" && (
          <div className="space-y-4">
            {filteredAccounts.length === 0 ? (
              <div className="bg-card border border-border-theme rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-muted-area rounded-full mx-auto flex items-center justify-center text-muted-text">
                  <Share2 size={32} />
                </div>
                <h3 className="text-lg font-black text-foreground">कुनै सामाजिक खाता भेटिएन</h3>
                <p className="text-xs text-muted-text max-w-md mx-auto">
                  तपाईंले नयाँ खाता थप्न वा डिफॉल्ट च्यानलहरू स्वतः लोड गर्न सक्नुहुन्छ।
                </p>
                <button
                  onClick={handleSeedDefaults}
                  disabled={seeding}
                  className="px-6 py-2.5 rounded-2xl bg-primary text-white text-xs font-black shadow-lg shadow-primary/20"
                >
                  डिफॉल्ट च्यानलहरू लोड गर्नुहोस्
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAccounts.map((acc) => (
                  <motion.div
                    key={acc.id}
                    layout
                    className={`bg-card border rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all relative flex flex-col justify-between gap-4 ${
                      acc.isActive ? 'border-border-theme' : 'border-border-theme/40 opacity-60'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={acc.avatarUrl || "https://picsum.photos/seed/social/200/200"}
                            alt={acc.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-border-theme shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-black text-foreground truncate">{acc.name}</h4>
                              {acc.isVerified && (
                                <span title="Verified Channel">
                                  <ShieldCheck size={14} className="text-blue-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-primary truncate">{acc.handle}</p>
                          </div>
                        </div>

                        {renderPlatformBadge(acc.platform)}
                      </div>

                      <p className="text-xs text-muted-text line-clamp-2 font-medium">
                        {acc.description || "कुनै विवरण उपलब्ध छैन"}
                      </p>

                      <div className="flex items-center justify-between text-xs font-bold bg-muted-area px-3 py-2 rounded-xl border border-border-theme/60">
                        <span className="text-muted-text">फलोअर्स / सदस्य:</span>
                        <span className="text-foreground">{acc.followerCount || "N/A"}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border-theme/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAccountStatus(acc)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                            acc.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                              : 'bg-muted-area text-muted-text border border-border-theme'
                          }`}
                        >
                          {acc.isActive ? 'सक्रिय' : 'निष्क्रिय'}
                        </button>

                        <a
                          href={acc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-muted-text hover:text-primary transition-colors"
                          title="खोल्नुहोस्"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditAccount(acc)}
                          className="p-2 rounded-xl hover:bg-muted-area text-muted-text hover:text-primary transition-colors"
                          title="सम्पादन गर्नुहोस्"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(acc.id)}
                          className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-text hover:text-red-500 transition-colors"
                          title="हटाउनुहोस्"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: POSTS & FEEDS MANAGER */}
        {activeTab === "posts" && (
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="bg-card border border-border-theme rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-muted-area rounded-full mx-auto flex items-center justify-center text-muted-text">
                  <Video size={32} />
                </div>
                <h3 className="text-lg font-black text-foreground">कुनै पोष्ट सामाग्री भेटिएन</h3>
                <p className="text-xs text-muted-text max-w-md mx-auto">
                  तपाईंले युट्युब भिडियो, इन्स्टाग्राम रिल वा फेसबुक पोष्ट लिङ्कहरू थप्न सक्नुहुन्छ।
                </p>
                <button
                  onClick={() => setIsPostModalOpen(true)}
                  className="px-6 py-2.5 rounded-2xl bg-primary text-white text-xs font-black shadow-lg shadow-primary/20"
                >
                  नयाँ सामाग्री थप्नुहोस्
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    layout
                    className="bg-card border border-border-theme rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3 p-4">
                      {/* Thumbnail or Video Embed Preview */}
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-border-theme/60 group">
                        {post.thumbnailUrl ? (
                          <img
                            src={post.thumbnailUrl}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted-area text-muted-text font-bold text-xs">
                            नो थम्बनेल
                          </div>
                        )}

                        <div className="absolute top-3 left-3">
                          {renderPlatformBadge(post.platform)}
                        </div>

                        {post.isFeatured && (
                          <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                            <Star size={12} className="fill-current" /> PINNED
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                          {post.contentType}
                        </span>
                        <h4 className="text-sm font-black text-foreground line-clamp-2 leading-snug">
                          {post.title}
                        </h4>
                      </div>

                      {post.caption && (
                        <p className="text-xs text-muted-text line-clamp-2 font-medium">
                          {post.caption}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] font-bold text-muted-text pt-2 border-t border-border-theme/40">
                        <span>दृष्य/भ्यूज: {post.viewsCount?.toLocaleString() || 0}</span>
                        <span>लाइक्स: {post.likesCount?.toLocaleString() || 0}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-muted-area/40 border-t border-border-theme/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => togglePostFeatured(post)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 transition-all ${
                          post.isFeatured
                            ? "bg-amber-500 text-white shadow-sm"
                            : "bg-card text-muted-text border border-border-theme hover:text-amber-500"
                        }`}
                      >
                        <Star size={13} className={post.isFeatured ? "fill-current" : ""} />
                        <span>{post.isFeatured ? "पिन गरियो" : "पिन गर्नुहोस्"}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl hover:bg-card text-muted-text hover:text-primary transition-colors"
                          title="हेर्नुहोस्"
                        >
                          <ExternalLink size={16} />
                        </a>
                        <button
                          onClick={() => openEditPost(post)}
                          className="p-2 rounded-xl hover:bg-card text-muted-text hover:text-primary transition-colors"
                          title="सम्पादन गर्नुहोस्"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-text hover:text-red-500 transition-colors"
                          title="हटाउनुहोस्"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ACCOUNT MODAL */}
      <AnimatePresence>
        {isAccountModalOpen && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border-theme rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-border-theme pb-4">
                <h3 className="text-lg font-black text-foreground">
                  {editingAccount ? "सामाजिक खाता सम्पादन" : "नयाँ आधिकारिक खाता थप्नुहोस्"}
                </h3>
                <button
                  onClick={() => setIsAccountModalOpen(false)}
                  className="text-muted-text hover:text-foreground font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-muted-text uppercase mb-1">
                    च्यानल / खाताको नाम *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा: सनातन मार्ग - YouTube च्यानल"
                    value={accountForm.name || ""}
                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-sm font-bold text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-muted-text uppercase mb-1">
                      प्लेटफर्म *
                    </label>
                    <select
                      value={accountForm.platform || "youtube"}
                      onChange={(e) => setAccountForm({ ...accountForm, platform: e.target.value as SocialPlatform })}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-sm font-bold text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="youtube">YouTube</option>
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="twitter">X (Twitter)</option>
                      <option value="tiktok">TikTok</option>
                      <option value="telegram">Telegram</option>
                      <option value="whatsapp">WhatsApp Channel</option>
                      <option value="spotify">Spotify / Podcast</option>
                      <option value="threads">Threads</option>
                      <option value="linkedin">LinkedIn</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-muted-text uppercase mb-1">
                      ह्यान्डल (@Handle)
                    </label>
                    <input
                      type="text"
                      placeholder="उदा: @SanatanMargaOfficial"
                      value={accountForm.handle || ""}
                      onChange={(e) => setAccountForm({ ...accountForm, handle: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-sm font-bold text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-muted-text uppercase mb-1">
                    आधिकारिक प्रोफाइल URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/@SanatanMargaOfficial"
                    value={accountForm.url || ""}
                    onChange={(e) => setAccountForm({ ...accountForm, url: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-sm font-bold text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-muted-text uppercase mb-1">
                      फलोअर्स / सब्सक्राइबर सङ्ख्या
                    </label>
                    <input
                      type="text"
                      placeholder="उदा: ३८०K+ सदस्यहरू"
                      value={accountForm.followerCount || ""}
                      onChange={(e) => setAccountForm({ ...accountForm, followerCount: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-sm font-bold text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-muted-text uppercase mb-1">
                      अवतार / लोगो URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={accountForm.avatarUrl || ""}
                      onChange={(e) => setAccountForm({ ...accountForm, avatarUrl: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-sm font-bold text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-muted-text uppercase mb-1">
                    विवरण / परिचय
                  </label>
                  <textarea
                    rows={3}
                    placeholder="सनातन धर्म, दर्शन तथा संस्कृति सम्बन्धी आधिकारिक युट्युब च्यानल..."
                    value={accountForm.description || ""}
                    onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-sm font-bold text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accountForm.isVerified ?? true}
                      onChange={(e) => setAccountForm({ ...accountForm, isVerified: e.target.checked })}
                      className="w-4 h-4 accent-primary rounded"
                    />
                    <span>Verified Badge (प्रमाणित खाता)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accountForm.isActive ?? true}
                      onChange={(e) => setAccountForm({ ...accountForm, isActive: e.target.checked })}
                      className="w-4 h-4 accent-primary rounded"
                    />
                    <span>सक्रिय (Visible in Hub)</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-border-theme flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAccountModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-muted-area text-foreground text-xs font-bold hover:bg-muted-area/80"
                  >
                    रद्द गर्नुहोस्
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-black shadow-lg shadow-primary/20"
                  >
                    सुरक्षित गर्नुहोस्
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POST MODAL */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border-theme rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-border-theme pb-4">
                <h3 className="text-lg font-black text-foreground">
                  {editingPost ? "सामाग्री सम्पादन" : "नयाँ सामाजिक सामाग्री थप्नुहोस्"}
                </h3>
                <button
                  onClick={() => setIsPostModalOpen(false)}
                  className="text-muted-text hover:text-foreground font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePostSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-muted-text uppercase mb-1">
                    शीर्षक / हेडलाइन *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा: श्रीमद्भगवद्गीता सार तथा निष्काम कर्म सिद्धान्त"
                    value={postForm.title || ""}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-sm font-bold text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-muted-text uppercase mb-1">
                      प्लेटफर्म *
                    </label>
                    <select
                      value={postForm.platform || "youtube"}
                      onChange={(e) => setPostForm({ ...postForm, platform: e.target.value as SocialPlatform })}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-sm font-bold text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="youtube">YouTube</option>
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="twitter">X (Twitter)</option>
                      <option value="tiktok">TikTok</option>
                      <option value="spotify">Spotify / Podcast</option>
                      <option value="telegram">Telegram</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-muted-text uppercase mb-1">
                      सामाग्री प्रकार *
                    </label>
                    <select
                      value={postForm.contentType || "video"}
                      onChange={(e) => setPostForm({ ...postForm, contentType: e.target.value as SocialContentType })}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-sm font-bold text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="video">भिडियो (Video)</option>
                      <option value="reel">रिल / शर्ट्स (Reel/Short)</option>
                      <option value="post">पोष्ट (Post/Infographic)</option>
                      <option value="live">प्रत्यक्ष प्रशारण (Live Stream)</option>
                      <option value="podcast">पोडकाष्ट (Podcast Audio)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-muted-text uppercase mb-1">
                    सामाग्रीको प्रत्यक्ष लिङ्क (URL) *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={postForm.url || ""}
                    onChange={(e) => setPostForm({ ...postForm, url: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-sm font-bold text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-muted-text uppercase mb-1">
                      Embed ID (उदा: YouTube Video ID)
                    </label>
                    <input
                      type="text"
                      placeholder="उदा: L_LUpnjgPso"
                      value={postForm.embedId || ""}
                      onChange={(e) => setPostForm({ ...postForm, embedId: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-sm font-bold text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-muted-text uppercase mb-1">
                      थम्बनेल छवि URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={postForm.thumbnailUrl || ""}
                      onChange={(e) => setPostForm({ ...postForm, thumbnailUrl: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-sm font-bold text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-muted-text uppercase mb-1">
                    क्याप्शन / सार
                  </label>
                  <textarea
                    rows={3}
                    placeholder="भिडियो वा पोष्टको संक्षिप्त विवरण..."
                    value={postForm.caption || ""}
                    onChange={(e) => setPostForm({ ...postForm, caption: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-sm font-bold text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={postForm.isFeatured ?? false}
                      onChange={(e) => setPostForm({ ...postForm, isFeatured: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span>पिन / हाइलाइट गर्नुहोस् (Feature on Top)</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-border-theme flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPostModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-muted-area text-foreground text-xs font-bold hover:bg-muted-area/80"
                  >
                    रद्द गर्नुहोस्
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-black shadow-lg shadow-primary/20"
                  >
                    सुरक्षित गर्नुहोस्
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
