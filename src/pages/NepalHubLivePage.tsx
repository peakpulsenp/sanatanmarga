import { useState, useEffect } from "react";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import SEOHead from "@/src/components/common/SEOHead";
import ReactMarkdown from "react-markdown";
import { 
  Radio, Flame, ShieldAlert, Vote, Bell, Share2, Eye, MessageSquare, 
  Clock, ArrowLeft, Pin, Edit3, Trash2, Plus, Sparkles, ThumbsUp, 
  CheckCircle2, X, Send, Lock, Shield, Filter, Search, Globe, MapPin
} from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { 
  collection, query, orderBy, addDoc, deleteDoc, updateDoc, doc, 
  serverTimestamp, setDoc 
} from "@/src/lib/firebase";
import { db, safeOnSnapshot } from "@/src/lib/firebase";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { useAuth } from "@/src/lib/auth";
import { useLanguage } from "@/src/context/LanguageContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { provinces } from "@/src/lib/nepalData";
import { useNepalPreferences } from "@/src/components/nepal/PersonalizedNepalHub";

export interface LiveUpdateItem {
  id: string;
  category: "festivals" | "disaster" | "elections" | "national";
  time?: string;
  title: string;
  content: string;
  badge: string;
  urgency: "normal" | "high" | "urgent";
  lifecycleStatus?: "upcoming" | "live" | "developing" | "resolved" | "expired" | "retracted";
  verifiedSource?: string;
  sourceUrl?: string;
  whatChanged?: string;
  authorId?: string;
  authorName?: string;
  authorRole?: string;
  viewsCount?: number;
  sharesCount?: number;
  likesCount?: number;
  pinned?: boolean;
  createdAt?: any;
  updatedAt?: any;
  province?: string;
  district?: string;
}

export default function NepalHubLivePage() {
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const targetDispatchId = paramId || searchParams.get("id") || searchParams.get("dispatchId");

  const { user } = useAuth();
  const { preferences, setPreferences } = useNepalPreferences();
  const { language } = useLanguage();

  const [activeCategory, setActiveCategory] = useState<"all" | "festivals" | "disaster" | "elections" | "national">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-scroll to target dispatch item
  useEffect(() => {
    if (targetDispatchId && liveUpdates.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`live-update-${targetDispatchId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-4", "ring-primary", "ring-offset-2");
        }
      }, 200);
    }
  }, [targetDispatchId, liveUpdates]);

  // Location Filter State
  const [activeLocationTab, setActiveLocationTab] = useState<"all" | "mine" | "custom">("all");
  const [selectedProvince, setSelectedProvince] = useState("सम्पूर्ण");
  const [selectedDistrict, setSelectedDistrict] = useState("सम्पूर्ण");

  // New Post Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"festivals" | "disaster" | "elections" | "national">("festivals");
  const [urgency, setUrgency] = useState<"normal" | "high" | "urgent">("normal");
  const [badge, setBadge] = useState("समाचार कक्ष लाइभ");
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Post location fields
  const [postProvince, setPostProvince] = useState("सम्पूर्ण");
  const [postDistrict, setPostDistrict] = useState("सम्पूर्ण");

  // Editing Modal State
  const [editingItem, setEditingItem] = useState<LiveUpdateItem | null>(null);

  // Role Checks
  const role = user?.role || "guest";
  const isStaff = Boolean(user && ["super_admin", "admin", "chief_editor", "editor", "journalist", "moderator"].includes(role));
  const isAdmin = Boolean(user && ["super_admin", "admin"].includes(role));

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadFromSnapshot = async () => {
      try {
        const snap = await snapshotEngine.getNepalHubSnapshot();
        if (snap && Array.isArray(snap.liveUpdates) && snap.liveUpdates.length > 0) {
          if (isMounted) {
            setLiveUpdates(snap.liveUpdates);
            setIsLoading(false);
          }
        }
      } catch (e) {}

      // Always subscribe to Firestore listener to fetch live updates in real time
      const q = query(collection(db, "nepal_hub_live_updates"), orderBy("createdAt", "desc"));
      const unsub = safeOnSnapshot(
        q,
        async (snapshot) => {
          if (!isMounted) return;
          if (snapshot.empty) {
            setLiveUpdates([]);
          } else {
            const items: LiveUpdateItem[] = snapshot.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                category: data.category || "national",
                time: data.time || "भर्खरै",
                title: data.title || "",
                content: data.content || "",
                badge: data.badge || "लाइभ ब्रोडकास्ट",
                urgency: data.urgency || "normal",
                authorId: data.authorId || "",
                authorName: data.authorName || "नेपाल हब डेस्क",
                authorRole: data.authorRole || "सम्पादकीय टोली",
                viewsCount: data.viewsCount || 0,
                sharesCount: data.sharesCount || 0,
                likesCount: data.likesCount || 0,
                pinned: Boolean(data.pinned),
                createdAt: data.createdAt,
                province: data.province || "सम्पूर्ण",
                district: data.district || "सम्पूर्ण"
              };
            });
            items.sort((a, b) => {
              if (a.pinned && !b.pinned) return -1;
              if (!a.pinned && b.pinned) return 1;
              return 0;
            });
            setLiveUpdates(items);
          }
          setIsLoading(false);
        },
        "nepal_hub_live_updates"
      );
      return unsub;
    };

    const cleanupPromise = loadFromSnapshot();
    return () => {
      isMounted = false;
      cleanupPromise.then(unsub => {
        try {
          if (typeof unsub === "function") unsub();
        } catch (err) {
          console.warn("NepalHubLive cleanup error:", err);
        }
      });
    };
  }, []);

  // Handler: Add New Live Dispatch
  const handleCreateLiveDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("कृपया शीर्षक र विवरण भरिदिनुहोस्।");
      return;
    }

    if (!isStaff) {
      toast.error("यो सुविधा केवल पत्रकार तथा सम्पादकीय टोलीका लागि मात्र उपलब्ध छ।");
      return;
    }

    setIsSubmitting(true);
    try {
      const newDoc = {
        title: title.trim(),
        content: content.trim(),
        category,
        urgency,
        badge: badge.trim() || "समाचार कक्ष लाइभ",
        pinned: isPinned,
        time: "भर्खरै",
        authorId: user?.uid || "anon",
        authorName: user?.displayName || user?.email || "नेपाल हब ब्रोडकास्टर",
        authorRole: role === "admin" || role === "super_admin" ? "प्रशासक (Admin)" : role === "chief_editor" ? "मुख्य सम्पादक" : role === "editor" ? "सम्पादक" : "पत्रकार",
        viewsCount: 1,
        sharesCount: 0,
        likesCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        province: postProvince,
        district: postDistrict
      };

      const docRef = await addDoc(collection(db, "nepal_hub_live_updates"), newDoc);
      toast.success("लाइभ बुलेटिन सफलतापुर्वक ब्रोडकास्ट भयो!");

      const newItem: LiveUpdateItem = {
        id: docRef.id || `live_${Date.now()}`,
        title: title.trim(),
        content: content.trim(),
        category,
        urgency,
        badge: badge.trim() || "समाचार कक्ष लाइभ",
        pinned: isPinned,
        time: "भर्खरै",
        authorId: user?.uid || "anon",
        authorName: user?.displayName || user?.email || "नेपाल हब ब्रोडकास्टर",
        authorRole: role === "admin" || role === "super_admin" ? "प्रशासक (Admin)" : role === "chief_editor" ? "मुख्य सम्पादक" : role === "editor" ? "सम्पादक" : "पत्रकार",
        viewsCount: 1,
        sharesCount: 0,
        likesCount: 0,
        createdAt: new Date().toISOString(),
        province: postProvince,
        district: postDistrict
      };

      setLiveUpdates(prev => [newItem, ...prev]);
      snapshotEngine.triggerPublishRebuild("nepal_hub_live");

      // Reset form
      setTitle("");
      setContent("");
      setBadge("समाचार कक्ष लाइभ");
      setIsPinned(false);
      setPostProvince("सम्पूर्ण");
      setPostDistrict("सम्पूर्ण");
    } catch (err: any) {
      console.error("Error adding live update:", err);
      toast.error("लाइभ अपडेट पठाउन सकिएन: " + (err.message || "त्रुटि भयो"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Update Existing Dispatch
  const handleSaveEditedUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title.trim() || !editingItem.content.trim()) return;

    try {
      await updateDoc(doc(db, "nepal_hub_live_updates", editingItem.id), {
        title: editingItem.title.trim(),
        content: editingItem.content.trim(),
        category: editingItem.category,
        urgency: editingItem.urgency,
        badge: editingItem.badge,
        pinned: Boolean(editingItem.pinned),
        province: editingItem.province || "सम्पूर्ण",
        district: editingItem.district || "सम्पूर्ण",
        updatedAt: serverTimestamp()
      });

      toast.success("लाइभ अपडेट सफलतापुर्वक परिमार्जन भयो!");
      setEditingItem(null);
    } catch (err: any) {
      console.error("Error updating live item:", err);
      toast.error("परिमार्जन सेभ गर्न सकिएन।");
    }
  };

  // Handler: Delete Update
  const handleDeleteUpdate = async (id: string) => {
    if (!isStaff) {
      toast.error("तपाईंसँग यो सामग्री हटाउने अनुमति छैन।");
      return;
    }

    if (!confirm("के तपाईं यो लाइभ अपडेट हटाउन चाहनुहुन्छ?")) return;

    try {
      try {
        await deleteDoc(doc(db, "nepal_hub_live_updates", id));
      } catch (e) {}
      try {
        await deleteDoc(doc(db, "nepalHubLiveUpdates", id));
      } catch (e) {}
      try {
        snapshotEngine.triggerPublishRebuild("admin_nepal_hub_live_delete");
      } catch (e) {}
      toast.success("लाइभ अपडेट हटाइयो!");
    } catch (err: any) {
      console.error("Error deleting live item:", err);
      toast.error("हटाउन सकिएन।");
    }
  };

  // Handler: Toggle Pin
  const handleTogglePin = async (item: LiveUpdateItem) => {
    if (!isStaff) return;
    try {
      await updateDoc(doc(db, "nepal_hub_live_updates", item.id), {
        pinned: !item.pinned,
        updatedAt: serverTimestamp()
      });
      toast.success(item.pinned ? "पिन हटाइयो" : "शीर्षमा पिन गरियो!");
    } catch (e) {
      console.error("Error toggling pin:", e);
    }
  };

  // Handler: Reaction/Like
  const handleLikeUpdate = async (item: LiveUpdateItem) => {
    try {
      const newCount = (item.likesCount || 0) + 1;
      await updateDoc(doc(db, "nepal_hub_live_updates", item.id), {
        likesCount: newCount
      });
      toast.success("प्रतिक्रिया दर्ता भयो!");
    } catch (e) {
      console.error("Error liking item:", e);
    }
  };

  // Handler: Share
  const handleShare = async (item: LiveUpdateItem) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: item.content,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("लिङ्क क्लिपबोर्डमा कपी गरियो!");
      }
    } catch (e) {
      console.error("Share error:", e);
    }
  };

  // Filtered Updates
  const filteredUpdates = liveUpdates.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.badge.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesCategory || !matchesSearch) return false;

    // Location Filter
    let targetProvince = "सम्पूर्ण";
    let targetDistrict = "सम्पूर्ण";

    if (activeLocationTab === "mine") {
      targetProvince = preferences.province;
      targetDistrict = preferences.district;
    } else if (activeLocationTab === "custom") {
      targetProvince = selectedProvince;
      targetDistrict = selectedDistrict;
    }

    if (targetProvince === "सम्पूर्ण") {
      return true;
    }

    const itemProvince = item.province || "सम्पूर्ण";
    const itemDistrict = item.district || "सम्पूर्ण";

    // National bulletins are visible to everyone
    if (itemProvince === "सम्पूर्ण") {
      return true;
    }

    const normalizeLoc = (str?: string) => {
      if (!str) return "";
      return str.replace(/[ँं]/g, "").trim();
    };

    // Otherwise, province must match
    if (normalizeLoc(itemProvince) !== normalizeLoc(targetProvince)) {
      return false;
    }

    // If province matches, and user selected "सम्पूर्ण" for district, show everything in this province
    if (targetDistrict === "सम्पूर्ण") {
      return true;
    }

    // Otherwise, show if item is province-wide or matches district
    return itemDistrict === "सम्पूर्ण" || normalizeLoc(itemDistrict) === normalizeLoc(targetDistrict);
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors">
      <SEOHead 
        title={language === "en" ? "Live Dispatch & Events Center - Nepal Hub" : "प्रत्यक्ष राष्ट्रिय घटना तथा पर्व लाइभ सेन्टर - नेपाल हब"}
        description={language === "en" ? "Real-time dispatch stream, breaking festival alerts, disaster monitoring and national bulletins across Nepal's 7 provinces." : "चाडपर्व उत्सव, निर्वाचन, मौसम आपतकाल तथा प्रमुख राष्ट्रिय घटनाहरूको वास्तविक समय कभरेज र सम्पादकीय प्रत्यक्ष बुलेटिन।"}
      />
      <Header />

      <main className="flex-1 py-8 px-4 max-w-5xl mx-auto w-full space-y-8">
        
        {/* TOP BACK & HEADER BAR */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Link to="/nepal-hub" className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5">
              <ArrowLeft size={14} /> {language === "en" ? "Back to Nepal Hub" : "नेपाल हबमा फर्कनुहोस्"}
            </Link>

            {isAdmin && (
              <Link
                to="/admin/nepal-hub"
                className="px-3 py-1.5 rounded-xl bg-card border border-border-theme text-xs font-bold text-card-foreground hover:bg-muted-area flex items-center gap-1.5 shadow-sm"
              >
                <Shield size={14} className="text-primary" /> {language === "en" ? "Nepal Hub OS Admin" : "नेपाल हब OS एडमिन"}
              </Link>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-theme pb-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-black text-xs border border-red-500/20 flex items-center gap-1.5 animate-pulse">
                  <Radio size={14} /> LIVE EVENT CENTER OS V3.0
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/25">
                  24/7 National Dispatch Stream
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isStaff 
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                }`}>
                  {language === "en" 
                    ? (isStaff ? `Role: ${role.toUpperCase()} (Broadcaster)` : `Role: ${user ? role.toUpperCase() : "Guest"}`)
                    : (isStaff ? `भूमिका: ${role.toUpperCase()} (ब्रोडकास्टर अनुमति)` : `भूमिका: ${user ? role.toUpperCase() : "दर्शक (Guest)"}`)}
                </span>
              </div>

              <h1 className="text-2xl md:text-4xl font-black text-card-foreground mt-2 tracking-tight">
                {language === "en" ? "Live National Events & Festival Center" : "प्रत्यक्ष राष्ट्रिय घटना तथा पर्व लाइभ सेन्टर"}
              </h1>
              <p className="text-xs md:text-sm text-muted-text mt-1 max-w-2xl leading-relaxed">
                {language === "en"
                  ? "Real-time coverage and editorial dispatches for major cultural celebrations, disaster updates, elections, and national events."
                  : "चाडपर्व उत्सव, निर्वाचन, मौसम आपतकाल तथा प्रमुख राष्ट्रिय घटनाहरूको वास्तविक समय (Real-time) कभरेज र सम्पादकीय प्रत्यक्ष बुलेटिन।"}
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/20 text-center shrink-0 flex flex-col items-center justify-center min-w-[130px]">
              <span className="flex items-center gap-1 text-2xl font-black font-mono text-red-600 dark:text-red-400">
                <Radio size={18} className="animate-spin" /> LIVE
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-text mt-0.5">
                {liveUpdates.length} {language === "en" ? "Dispatches" : "ब्रोडकास्ट अपडेटहरू"}
              </span>
            </div>
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTER TABS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-muted-area rounded-2xl">
            {[
              { id: "all", label: language === "en" ? "All Updates" : "सबै अपडेट", icon: Radio },
              { id: "festivals", label: language === "en" ? "Festivals & Culture" : "चाडपर्व तथा संस्कृति", icon: Flame },
              { id: "disaster", label: language === "en" ? "Weather & Emergency" : "मौसम तथा आपतकाल", icon: ShieldAlert },
              { id: "elections", label: language === "en" ? "National Events" : "राष्ट्रिय घटना", icon: Vote }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                    activeCategory === tab.id
                      ? "bg-card text-card-foreground shadow-sm font-black border border-border-theme"
                      : "text-muted-text hover:text-card-foreground"
                  }`}
                >
                  <Icon size={14} className={activeCategory === tab.id ? "text-red-500" : ""} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[200px]">
            <Search size={14} className="absolute left-3.5 top-3 text-muted-text" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === "en" ? "Search live updates..." : "लाइभ अपडेट खोज्नुहोस्..."}
              className="w-full pl-9 pr-4 py-2 bg-card border border-border-theme rounded-2xl text-xs text-card-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* LOCATION-BASED FILTER SECTION */}
        <div className="bg-card border border-border-theme/80 rounded-3xl p-4 md:p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              <h3 className="text-xs md:text-sm font-black text-card-foreground">{language === "en" ? "Filter by Province & District" : "प्रदेश तथा जिल्ला अनुसार फिल्टर"}</h3>
            </div>
            
            {/* Filter Mode Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-muted-area p-1 rounded-xl text-xs">
              <button
                onClick={() => setActiveLocationTab("all")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  activeLocationTab === "all"
                    ? "bg-card text-card-foreground shadow-xs border border-border-theme/40"
                    : "text-muted-text hover:text-card-foreground"
                }`}
              >
                <Globe size={13} /> {language === "en" ? "National" : "सम्पूर्ण देश (National)"}
              </button>
              
              <button
                onClick={() => setActiveLocationTab("mine")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  activeLocationTab === "mine"
                    ? "bg-card text-card-foreground shadow-xs border border-border-theme/40"
                    : "text-muted-text hover:text-card-foreground"
                }`}
              >
                <MapPin size={13} /> {language === "en" ? `My Area (${preferences.district})` : `मेरो क्षेत्र (${preferences.district})`}
              </button>
              
              <button
                onClick={() => setActiveLocationTab("custom")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  activeLocationTab === "custom"
                    ? "bg-card text-card-foreground shadow-xs border border-border-theme/40"
                    : "text-muted-text hover:text-card-foreground"
                }`}
              >
                <Filter size={13} /> {language === "en" ? "Select Location" : "स्थान छान्नुहोस्"}
              </button>
            </div>
          </div>

          {/* Active selection values and descriptive labels */}
          <div className="text-[11px] text-muted-text border-t border-border-theme/40 pt-2.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              {activeLocationTab === "all" && (
                <span>सम्पूर्ण नेपालका राष्ट्रिय तथा सबै प्रदेश र जिल्लाका स्थानीय घटनाहरू देखाइदैछ।</span>
              )}
              {activeLocationTab === "mine" && (
                <span>तपाईंको सेभ गरिएको क्षेत्र <strong className="text-card-foreground">{preferences.district}, {preferences.province}</strong> का स्थानीय बुलेटिनहरू र महत्त्वपूर्ण राष्ट्रिय अलर्टहरू देखाइदैछ।</span>
              )}
              {activeLocationTab === "custom" && (
                <span>चयन गरिएको स्थान <strong className="text-card-foreground">{selectedDistrict === "सम्पूर्ण" ? "सबै जिल्लाहरू" : selectedDistrict}, {selectedProvince}</strong> का स्थानीय बुलेटिनहरू र महत्त्वपूर्ण राष्ट्रिय अलर्टहरू देखाइदैछ।</span>
              )}
            </div>

            {activeLocationTab === "mine" && (
              <Link to="/nepal-hub" className="text-primary hover:underline font-bold">
                (स्थान परिवर्तन गर्नुहोस्)
              </Link>
            )}
          </div>

          {/* Custom location selectors (Dropdowns) shown only if "custom" is selected */}
          {activeLocationTab === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[10px] text-muted-text font-bold mb-1">प्रदेश छान्नुहोस्</label>
                <select
                  value={selectedProvince}
                  onChange={(e) => {
                    setSelectedProvince(e.target.value);
                    setSelectedDistrict("सम्पूर्ण");
                  }}
                  className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs font-bold text-card-foreground focus:outline-none focus:border-primary"
                >
                  <option value="सम्पूर्ण">सबै प्रदेशहरू (All Provinces)</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-muted-text font-bold mb-1">जिल्ला छान्नुहोस्</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={selectedProvince === "सम्पूर्ण"}
                  className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs font-bold text-card-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                >
                  <option value="सम्पूर्ण">सबै जिल्लाहरू (All Districts)</option>
                  {selectedProvince !== "सम्पूर्ण" &&
                    provinces
                      .find((p) => p.name === selectedProvince)
                      ?.districts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* FRONTEND BROADCAST EDITOR CREATION PANEL (FOR STAFF / EDITORS / JOURNALISTS) */}
        {isStaff ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border-2 border-primary/30 rounded-3xl p-5 md:p-6 shadow-lg space-y-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-border-theme pb-3">
              <span className="text-xs md:text-sm font-black text-card-foreground flex items-center gap-2">
                <Bell size={16} className="text-primary animate-bounce" /> सम्पादकीय प्रत्यक्ष बुलेटिन थप्नुहोस् (Live Dispatch Panel)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold border border-emerald-500/20">
                Authorized Editor Mode
              </span>
            </div>

            <form onSubmit={handleCreateLiveDispatch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-muted-text mb-1">बुलेटिन शीर्षक *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="उदा: पशुपतिनाथ क्षेत्रमा जलराशी अर्पण सुरू"
                    className="w-full p-3 rounded-2xl bg-muted-area/60 border border-border-theme text-card-foreground text-xs font-bold outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-muted-text mb-1">विधा (Category)</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full p-3 rounded-2xl bg-muted-area/60 border border-border-theme text-card-foreground text-xs font-bold outline-none focus:border-primary"
                    >
                      <option value="festivals">चाडपर्व तथा संस्कृति</option>
                      <option value="disaster">मौसम तथा आपतकाल</option>
                      <option value="elections">राष्ट्रिय घटना</option>
                      <option value="national">अन्य राष्ट्रिय समाचार</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-text mb-1">संवेदनशीलता (Urgency)</label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as any)}
                      className="w-full p-3 rounded-2xl bg-muted-area/60 border border-border-theme text-card-foreground text-xs font-bold outline-none focus:border-primary"
                    >
                      <option value="normal">सामान्य (Normal)</option>
                      <option value="high">उच्च (High)</option>
                      <option value="urgent">आपतकालीन (Urgent)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Location Tag Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-muted-text mb-1">प्रदेश ट्याग (Province Tag)</label>
                  <select
                    value={postProvince}
                    onChange={(e) => {
                      setPostProvince(e.target.value);
                      setPostDistrict("सम्पूर्ण");
                    }}
                    className="w-full p-3 rounded-2xl bg-muted-area/60 border border-border-theme text-card-foreground text-xs font-bold outline-none focus:border-primary"
                  >
                    <option value="सम्पूर्ण">सम्पूर्ण नेपाल (राष्ट्रिय)</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-text mb-1">जिल्ला ट्याग (District Tag)</label>
                  <select
                    value={postDistrict}
                    onChange={(e) => setPostDistrict(e.target.value)}
                    disabled={postProvince === "सम्पूर्ण"}
                    className="w-full p-3 rounded-2xl bg-muted-area/60 border border-border-theme text-card-foreground text-xs font-bold outline-none focus:border-primary disabled:opacity-50"
                  >
                    <option value="सम्पूर्ण">सम्पूर्ण (प्रदेशव्यापी)</option>
                    {postProvince !== "सम्पूर्ण" &&
                      provinces
                        .find((p) => p.name === postProvince)
                        ?.districts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-text mb-1">घटनाको मुख्य विवरण (Live Content) *</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="यहाँ प्रत्यक्ष घटनाको पूर्ण विवरण लेख्नुहोस्..."
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-muted-area/60 border border-border-theme text-card-foreground text-xs outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-text text-[11px]">ब्याज लेबल:</span>
                    <input
                      type="text"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      placeholder="समाचार कक्ष लाइभ"
                      className="px-3 py-1.5 rounded-xl bg-muted-area border border-border-theme text-xs font-bold"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="w-4 h-4 accent-primary rounded"
                    />
                    <span className="text-muted-text text-[11px]">शीर्षमा पिन गर्नुहोस् (Pin to Top)</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="button-fancy !py-2.5 !px-6 text-xs flex items-center gap-2 font-bold w-full sm:w-auto justify-center"
                >
                  <Send size={14} />
                  {isSubmitting ? "ब्रोडकास्ट हुँदैछ..." : "लाइभ ब्रोडकास्ट प्रकाशित गर्नुहोस्"}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <div className="bg-card border border-border-theme/80 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-muted-area flex items-center justify-center text-muted-text shrink-0">
                <Lock size={18} />
              </div>
              <div>
                <p className="font-bold text-card-foreground">प्रत्यक्ष ब्रोडकास्टर मोड</p>
                <p className="text-muted-text mt-0.5">लाइभ अपडेट प्रकाशित र सम्पादन गर्न सम्पादकीय टोली वा पत्रकारको लगइन आवश्यक पर्दछ।</p>
              </div>
            </div>

            {!user ? (
              <Link to="/login" className="px-4 py-2 bg-primary text-white font-bold rounded-xl whitespace-nowrap shadow-sm hover:bg-primary/90">
                लगइन गर्नुहोस्
              </Link>
            ) : (
              <Link to="/profile" className="px-4 py-2 bg-muted-area border border-border-theme text-card-foreground font-bold rounded-xl whitespace-nowrap">
                पत्रकार भूमिका अनुरोध गर्नुहोस्
              </Link>
            )}
          </div>
        )}

        {/* TIMELINE FEED */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-text text-xs font-bold space-y-2">
            <Radio size={24} className="mx-auto animate-spin text-primary" />
            <p>लाइभ सेन्टर डाटा लोड हुँदैछ...</p>
          </div>
        ) : filteredUpdates.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-3xl border border-border-theme space-y-2">
            <Radio size={28} className="mx-auto text-muted-text" />
            <p className="text-sm font-bold text-card-foreground">कुनै लाइभ अपडेट भेटिएन</p>
            <p className="text-xs text-muted-text">कृपया अर्को विधा चयन गर्नुहोस् वा नयाँ ब्रोडकास्ट थप्नुहोस्।</p>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-5 before:w-0.5 before:bg-border-theme">
            {filteredUpdates.map((item) => (
              <div key={item.id} className="relative pl-12 space-y-2 group">
                {/* Timeline Dot Indicator */}
                <div
                  className={`absolute left-3.5 top-2 w-3.5 h-3.5 rounded-full border-2 border-background transition-all ${
                    item.pinned
                      ? "bg-amber-500 ring-4 ring-amber-500/20"
                      : item.urgency === "urgent"
                      ? "bg-red-500 ring-4 ring-red-500/20 animate-ping"
                      : "bg-primary"
                  }`}
                />

                <div
                  id={`live-update-${item.id}`}
                  className={`bg-card border rounded-3xl p-6 shadow-sm transition-all space-y-4 hover:shadow-md ${
                    item.pinned
                      ? "border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10"
                      : item.urgency === "urgent"
                      ? "border-red-500/40"
                      : "border-border-theme/80"
                  }`}
                >
                  {/* Top Bar on Card */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.urgency === "urgent"
                            ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                            : item.urgency === "high"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : "bg-primary/10 text-primary border-primary/20"
                        }`}
                      >
                        {item.badge}
                      </span>

                      {item.pinned && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-black border border-amber-500/30 flex items-center gap-1">
                          <Pin size={10} /> pinned
                        </span>
                      )}

                      {item.province && item.province !== "सम्पूर्ण" && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black border border-indigo-500/20 flex items-center gap-1">
                          <MapPin size={10} /> {item.district && item.district !== "सम्पूर्ण" ? `${item.district}, ` : ""}{item.province}
                        </span>
                      )}

                      <span className="text-[11px] font-mono text-muted-text flex items-center gap-1">
                        <Clock size={12} /> {item.time}
                      </span>
                    </div>

                    {/* FRONTEND EDITING & MANAGEMENT CONTROLS FOR STAFF */}
                    {isStaff && (
                      <div className="flex items-center gap-1 bg-muted-area/80 px-2 py-1 rounded-xl border border-border-theme">
                        <button
                          onClick={() => handleTogglePin(item)}
                          title={item.pinned ? "Unpin" : "Pin to Top"}
                          className={`p-1 rounded-lg hover:bg-card transition-all ${item.pinned ? "text-amber-500 font-bold" : "text-muted-text"}`}
                        >
                          <Pin size={13} />
                        </button>
                        <button
                          onClick={() => setEditingItem({ ...item })}
                          title="Edit Dispatch"
                          className="p-1 text-muted-text hover:text-primary hover:bg-card rounded-lg transition-all"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteUpdate(item.id)}
                          title="Delete Dispatch"
                          className="p-1 text-muted-text hover:text-red-500 hover:bg-card rounded-lg transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title & Body */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                        <CheckCircle2 size={11} /> प्रमाणित स्रोत: {item.verifiedSource || "नेपाल हब सम्पादकीय डेस्क"}
                      </span>
                      {item.lifecycleStatus && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          item.lifecycleStatus === 'live' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                          item.lifecycleStatus === 'developing' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                          item.lifecycleStatus === 'resolved' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                          'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                          {item.lifecycleStatus}
                        </span>
                      )}
                      {item.whatChanged && (
                        <span className="text-[10px] text-muted-text bg-muted-area px-2 py-0.5 rounded-md border border-border-theme">
                          अद्यावधिक: {item.whatChanged}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base md:text-xl font-black text-card-foreground leading-snug">
                      {item.title}
                    </h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-xs md:text-sm text-muted-text leading-relaxed font-medium">
                      <ReactMarkdown>
                        {(item.content || "")
                          .replace(/&lt;/g, "<")
                          .replace(/&gt;/g, ">")
                          .replace(/&amp;/g, "&")
                          .replace(/<br\s*[\/]?>/gi, "\n")
                          .replace(/<\/?p>/gi, "\n")
                          .replace(/<\/?b>/gi, "**")
                          .replace(/<\/?strong>/gi, "**")
                          .replace(/<\/?i>/gi, "*")
                          .replace(/<\/?em>/gi, "*")}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Author Meta & Reader Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border-theme/60 text-xs text-muted-text">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                        {item.authorName?.charAt(0) || "N"}
                      </div>
                      <span className="font-bold text-card-foreground text-[11px]">{item.authorName}</span>
                      <span className="text-[10px] text-muted-text bg-muted-area px-2 py-0.5 rounded-md">{item.authorRole}</span>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <button
                        onClick={() => handleLikeUpdate(item)}
                        className="flex items-center gap-1.5 hover:text-primary transition-colors font-bold"
                      >
                        <ThumbsUp size={14} /> {item.likesCount || 0}
                      </button>

                      <span className="flex items-center gap-1">
                        <Eye size={14} /> {item.viewsCount || 1}
                      </span>

                      <button
                        onClick={() => handleShare(item)}
                        className="flex items-center gap-1.5 text-primary font-bold hover:underline"
                      >
                        <Share2 size={14} /> {language === "en" ? "Share" : "सेयर"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* EDITING MODAL OVERLAY FOR STAFF */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border-theme rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 my-8"
            >
              <div className="flex items-center justify-between border-b border-border-theme pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 size={18} className="text-primary" />
                  <h3 className="text-base font-black text-card-foreground">लाइव बुलेटिन सम्पादन गर्नुहोस्</h3>
                </div>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-1.5 hover:bg-muted-area rounded-xl text-muted-text hover:text-card-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEditedUpdate} className="space-y-4 text-xs font-bold">
                <div>
                  <label className="block text-muted-text mb-1">बुलेटिन शीर्षक *</label>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-text mb-1">विधा (Category)</label>
                    <select
                      value={editingItem.category}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as any })}
                      className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-3 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="festivals">चाडपर्व तथा संस्कृति</option>
                      <option value="disaster">मौसम तथा आपतकाल</option>
                      <option value="elections">राष्ट्रिय घटना</option>
                      <option value="national">अन्य राष्ट्रिय समाचार</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-muted-text mb-1">संवेदनशीलता (Urgency)</label>
                    <select
                      value={editingItem.urgency}
                      onChange={(e) => setEditingItem({ ...editingItem, urgency: e.target.value as any })}
                      className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-3 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="normal">सामान्य (Normal)</option>
                      <option value="high">उच्च (High)</option>
                      <option value="urgent">आपतकालीन (Urgent)</option>
                    </select>
                  </div>
                </div>

                {/* Edit Location Tags */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-text mb-1">प्रदेश ट्याग (Province Tag)</label>
                    <select
                      value={editingItem.province || "सम्पूर्ण"}
                      onChange={(e) => {
                        setEditingItem({
                          ...editingItem,
                          province: e.target.value,
                          district: "सम्पूर्ण" // Reset district on province change
                        });
                      }}
                      className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-3 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="सम्पूर्ण">सम्पूर्ण नेपाल (राष्ट्रिय)</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-muted-text mb-1">जिल्ला ट्याग (District Tag)</label>
                    <select
                      value={editingItem.district || "सम्पूर्ण"}
                      onChange={(e) => setEditingItem({ ...editingItem, district: e.target.value })}
                      disabled={(editingItem.province || "सम्पूर्ण") === "सम्पूर्ण"}
                      className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-3 py-2.5 text-card-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                    >
                      <option value="सम्पूर्ण">सम्पूर्ण (प्रदेशव्यापी)</option>
                      {(editingItem.province || "सम्पूर्ण") !== "सम्पूर्ण" &&
                        provinces
                          .find((p) => p.name === editingItem.province)
                          ?.districts.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-muted-text mb-1">ब्याज टेक्स्ट</label>
                  <input
                    type="text"
                    value={editingItem.badge}
                    onChange={(e) => setEditingItem({ ...editingItem, badge: e.target.value })}
                    className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-muted-text mb-1">घटना विवरण (Content) *</label>
                  <textarea
                    value={editingItem.content}
                    onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                    rows={4}
                    className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(editingItem.pinned)}
                      onChange={(e) => setEditingItem({ ...editingItem, pinned: e.target.checked })}
                      className="w-4 h-4 accent-primary rounded"
                    />
                    <span className="text-card-foreground font-bold">शीर्षमा पिन गर्नुहोस्</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-theme">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 rounded-xl bg-muted-area font-bold hover:bg-muted-area/80"
                  >
                    रद्द
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary/90"
                  >
                    सेभ गर्नुहोस्
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
