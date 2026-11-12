import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { doc } from "@/src/lib/firebase";
import { db, safeOnSnapshot } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { useLanguage } from "@/src/context/LanguageContext";
import { formatDate } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Mail, MapPin, Calendar, Edit2, Edit3, Save, X, Camera, 
  Bookmark, Bell, Newspaper, Users, Crown, Flame, Award, 
  ArrowUpRight, Check, BookOpen, ShieldCheck, Activity, 
  Sparkles, Plus, ExternalLink, Heart, MessageSquare, MessageCircle, Wallet, RefreshCw,
  Zap, Compass, WifiOff, Database, Clock
} from "lucide-react";
import { toast } from "sonner";
import { logUserActivity, logLearningEvent } from "@/src/lib/memberIntelligence";
import { getIndexedDbItem, setIndexedDbItem, STORES } from "@/src/lib/indexedDbStore";
import { telemetry } from "@/src/lib/telemetry";
import { setDocWithQueue } from "@/src/lib/offlineQueue";
import { adminFetch } from "@/src/lib/adminFetch";

// Fast in-memory L1 cache across navigation
const memoryDashboardCache: Record<string, any> = {};

// Helper for snapshot sync freshness timestamp
function formatTimeAgo(isoString?: string, language: string = "ne") {
  if (!isoString) return language === "en" ? "Just now (Live)" : "भर्खरै (Live)";
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 45) return language === "en" ? "Just now (Live)" : "भर्खरै (Live)";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return language === "en" ? `${diffMin}m ago` : `${diffMin} मिनेट अगाडि`;
  const diffHr = Math.floor(diffMin / 60);
  return language === "en" ? `${diffHr}h ago` : `${diffHr} घण्टा अगाडि`;
}

// Deep Merge helper to prevent UI flicker and form resets on background revalidation
function mergeDashboardState(current: any, fresh: any) {
  const merged = {
    ...(current || {}),
    ...(fresh || {}),
    snapshot_version: fresh?.snapshot_version || current?.snapshot_version || "2.6.0",
    generatedAt: fresh?.generatedAt || current?.generatedAt || new Date().toISOString(),
    profile: { ...(current?.profile || {}), ...(fresh?.profile || {}) },
    stats: { ...(current?.stats || {}), ...(fresh?.stats || {}) },
    reputation: { ...(current?.reputation || {}), ...(fresh?.reputation || {}) },
    learningProgress: { ...(current?.learningProgress || {}), ...(fresh?.learningProgress || {}) },
    membership: { ...(current?.membership || {}), ...(fresh?.membership || {}) },
    userArticles: fresh?.userArticles?.length ? fresh.userArticles : (current?.userArticles || []),
    userComments: fresh?.userComments?.length ? fresh.userComments : (current?.userComments || []),
    chautariPosts: fresh?.chautariPosts?.length ? fresh.chautariPosts : (current?.chautariPosts || []),
    registeredEvents: fresh?.registeredEvents?.length ? fresh.registeredEvents : (current?.registeredEvents || []),
    activityLogs: fresh?.activityLogs?.length ? fresh.activityLogs : (current?.activityLogs || []),
    savedContent: fresh?.savedContent?.length ? fresh.savedContent : (current?.savedContent || []),
    notifications: fresh?.notifications?.length ? fresh.notifications : (current?.notifications || [])
  };

  // Synchronize client local app features if remote lists are empty
  try {
    if (!merged.savedContent || merged.savedContent.length === 0) {
      const localBookmarks = localStorage.getItem("sanatan_bookmarks") || localStorage.getItem("bookmarks");
      if (localBookmarks) {
        merged.savedContent = JSON.parse(localBookmarks);
      }
    }
  } catch (e) {}

  try {
    if (!merged.chautariPosts || merged.chautariPosts.length === 0) {
      const localPosts = localStorage.getItem("chautari_local_posts") || localStorage.getItem("sanatan_chautari_posts");
      if (localPosts) {
        merged.chautariPosts = JSON.parse(localPosts);
      }
    }
  } catch (e) {}

  // Recalculate stats with accurate client totals
  merged.stats = {
    ...(merged.stats || {}),
    savedCount: merged.savedContent?.length || merged.stats?.savedCount || 0,
    communityPosts: merged.chautariPosts?.length || merged.stats?.communityPosts || 0,
    communityComments: merged.userComments?.length || merged.stats?.communityComments || merged.stats?.comments || 0,
  };

  return merged;
}

export default function ProfilePage() {
  const { uid: routeUid } = useParams();
  const { user: currentUser } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const targetUid = routeUid || currentUser?.uid || "guest";
  const isOwnProfile = !routeUid || routeUid === currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isContinuityMode, setIsContinuityMode] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "articles" | "library" | "chautari" | "comments" | "events" | "learning" | "reputation" | "activity" | "notifications" | "membership" | "settings"
  >("overview");

  // Edit profile state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    displayName: "",
    bio: "",
    location: "",
    photoURL: ""
  });

  // Learning progress edit modal
  const [isStudyModalOpen, setIsStudyModalOpen] = useState(false);
  const [studyInput, setStudyInput] = useState({
    versesRead: 0,
    granthasExplored: 0,
    hoursStudied: 0
  });

  // Hydrate forms from data payload
  const hydrateFormData = (json: any) => {
    if (!json) return;
    setEditFormData({
      displayName: json.profile?.displayName || "",
      bio: json.profile?.bio || "",
      location: json.profile?.location || (language === 'en' ? "Kathmandu, Nepal" : "काठमाडौँ, नेपाल"),
      photoURL: json.profile?.photoURL || ""
    });
    setStudyInput({
      versesRead: json.learningProgress?.versesRead || 0,
      granthasExplored: json.learningProgress?.granthasExplored || 0,
      hoursStudied: json.learningProgress?.hoursStudied || 0
    });
  };

  // Fetch /api/dashboard data with Stale-While-Revalidate & Cascade
  const fetchDashboardData = async (uidToFetch: string, isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    let cachedFound = false;

    // L1: Memory Cache check
    if (memoryDashboardCache[uidToFetch]) {
      setDashboardData((prev: any) => mergeDashboardState(prev, memoryDashboardCache[uidToFetch]));
      hydrateFormData(memoryDashboardCache[uidToFetch]);
      setLoading(false);
      cachedFound = true;
      telemetry.trackDashboardHit("cache");
    }

    // L2: IndexedDB check if not found in memory
    if (!cachedFound) {
      try {
        const idbData = await getIndexedDbItem<any>(STORES.SNAPSHOTS, `dash_${uidToFetch}`);
        if (idbData && idbData.success) {
          memoryDashboardCache[uidToFetch] = idbData;
          setDashboardData((prev: any) => mergeDashboardState(prev, idbData));
          hydrateFormData(idbData);
          setLoading(false);
          cachedFound = true;
          telemetry.trackDashboardHit("cache");
        }
      } catch (e) {}
    }

    // L3: LocalStorage fallback
    if (!cachedFound) {
      try {
        const lsData = localStorage.getItem(`sg_dash_${uidToFetch}`);
        if (lsData) {
          const parsed = JSON.parse(lsData);
          if (parsed && parsed.success) {
            memoryDashboardCache[uidToFetch] = parsed;
            setDashboardData((prev: any) => mergeDashboardState(prev, parsed));
            hydrateFormData(parsed);
            setLoading(false);
            cachedFound = true;
            telemetry.trackDashboardHit("cache");
          }
        }
      } catch (e) {}
    }

    // Background Revalidate / Network Fetch
    try {
      const res = await fetch(`/api/dashboard?uid=${encodeURIComponent(uidToFetch)}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success) {
          memoryDashboardCache[uidToFetch] = json;
          setDashboardData((prev: any) => mergeDashboardState(prev, json));
          if (!isEditModalOpen && !isStudyModalOpen) {
            hydrateFormData(json);
          }
          setIsContinuityMode(false);
          telemetry.trackDashboardHit("network");

          // Save to IndexedDB and LocalStorage asynchronously
          setIndexedDbItem(STORES.SNAPSHOTS, `dash_${uidToFetch}`, { id: `dash_${uidToFetch}`, ...json }).catch(() => {});
          try {
            localStorage.setItem(`sg_dash_${uidToFetch}`, JSON.stringify(json));
          } catch (e) {}
        }
      } else {
        if (cachedFound) setIsContinuityMode(true);
      }
    } catch (err) {
      console.warn("Continuity Mode active for /api/dashboard:", err);
      if (cachedFound || dashboardData) {
        setIsContinuityMode(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchDashboardData(targetUid);
    return () => {
      isMounted = false;
    };
  }, [targetUid]);

  // Optional live listener for user doc updates
  useEffect(() => {
    if (!targetUid || targetUid === "guest") return;
    const unsub = safeOnSnapshot(doc(db, "users", targetUid), (snap) => {
      if (snap.exists()) {
        const uData = snap.data();
        setDashboardData((prev: any) => prev ? {
          ...prev,
          profile: { ...prev.profile, ...uData }
        } : prev);
      }
    }, `users/${targetUid}`);

    return () => unsub();
  }, [targetUid]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nowIso = new Date().toISOString();
      const profileUpdate = {
        displayName: editFormData.displayName || "",
        bio: editFormData.bio || "",
        location: editFormData.location || "",
        photoURL: editFormData.photoURL || "",
        updatedAt: nowIso
      };

      // 1. Direct Firestore offline-capable write via setDocWithQueue
      if (targetUid && targetUid !== "guest") {
        await setDocWithQueue(doc(db, "users", targetUid), profileUpdate, { merge: true }).catch(() => {});
      }

      // 2. Server API sync with authenticated headers
      await adminFetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: targetUid,
          ...editFormData
        })
      }).catch(() => null);

      // 3. Immediately reflect in local state and memory cache for zero-latency UX
      setDashboardData((prev: any) => {
        const next = {
          ...(prev || {}),
          profile: {
            ...(prev?.profile || {}),
            ...profileUpdate
          }
        };
        memoryDashboardCache[targetUid] = next;
        try {
          localStorage.setItem(`sg_dash_${targetUid}`, JSON.stringify(next));
          setIndexedDbItem(STORES.SNAPSHOTS, `dash_${targetUid}`, next).catch(() => {});
        } catch (e) {}
        return next;
      });

      // 4. Notify snapshot engine
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("snapshot-rebuilt", {
            detail: { collection: "users", docId: targetUid, timestamp: Date.now() }
          })
        );
      }

      toast.success(language === 'en' ? "Profile updated successfully!" : "प्रोफाइल सफलतापूर्वक अद्यावधिक गरियो!");
      setIsEditModalOpen(false);
      fetchDashboardData(targetUid, true);
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(language === 'en' ? "An unknown error occurred" : "अज्ञात त्रुटि देखा पर्यो");
    }
  };

  const handleQuickVerseStudy = async (count: number = 5) => {
    try {
      await logLearningEvent(targetUid, "shrimad-bhagavad-gita", "श्रीमद्भगवद्गीता", "2.11", "read", count * 120);
      toast.success(language === 'en' 
        ? `Saraswati Knowledge OS: +${count} verses study logged successfully!` 
        : `सरस्वती Knowledge OS: +${count} श्लोक स्वाध्याय सफलतापूर्वक दर्ता गरियो!`);
      fetchDashboardData(targetUid, true);
    } catch (err) {
      toast.error(language === 'en' ? "Could not record study" : "स्वाध्याय रेकर्ड गर्न सकिएन");
    }
  };

  const handleSaveLearningProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nowIso = new Date().toISOString();
      const progressPayload = {
        uid: targetUid,
        ...studyInput,
        updatedAt: nowIso
      };

      if (targetUid && targetUid !== "guest") {
        await setDocWithQueue(doc(db, "user_learning_progress", targetUid), progressPayload, { merge: true }).catch(() => {});
      }

      await adminFetch("/api/user/learning-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progressPayload)
      }).catch(() => null);

      setDashboardData((prev: any) => {
        const next = {
          ...(prev || {}),
          learningProgress: {
            ...(prev?.learningProgress || {}),
            ...studyInput
          }
        };
        memoryDashboardCache[targetUid] = next;
        try {
          localStorage.setItem(`sg_dash_${targetUid}`, JSON.stringify(next));
          setIndexedDbItem(STORES.SNAPSHOTS, `dash_${targetUid}`, next).catch(() => {});
        } catch (e) {}
        return next;
      });

      await logUserActivity(targetUid, "learning_updated", `सरस्वती OS: ${studyInput.versesRead} श्लोक स्वाध्याय रेकर्ड गरियो`);
      toast.success(language === 'en' ? "Knowledge journey progress saved!" : "ज्ञान यात्रा प्रगति रेकर्ड गरियो!");
      setIsStudyModalOpen(false);
      fetchDashboardData(targetUid, true);
    } catch (err) {
      toast.error(language === 'en' ? "Could not save study progress" : "अध्ययन रेकर्ड सुरक्षित गर्न सकिएन");
    }
  };

  const handleRemoveBookmark = async (itemId: string) => {
    try {
      await fetch(`/api/user/saved-content/${itemId}?uid=${targetUid}`, { method: "DELETE" }).catch(() => {});
      setDashboardData((prev: any) => {
        if (!prev) return prev;
        const filtered = (prev.savedContent || []).filter((s: any) => s.id !== itemId);
        return { ...prev, savedContent: filtered, stats: { ...(prev.stats || {}), savedCount: filtered.length } };
      });
      toast.success(language === 'en' ? "Removed from personal library" : "सङ्ग्रहबाट हटाइयो");
    } catch (err) {
      toast.error(language === 'en' ? "Could not remove item" : "हटाउन सकिएन");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <Header />
        <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-16 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-muted-text">
            {language === 'en' ? "Loading Member Command Center..." : "सनातन सदस्य कमाण्ड सेन्टर लोड हुँदैछ..."}
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  const profile = dashboardData?.profile || {};
  const stats = dashboardData?.stats || {};
  const userArticles = dashboardData?.userArticles || [];
  const userComments = dashboardData?.userComments || [];
  const activityLogs = dashboardData?.activityLogs || [];
  const savedContent = dashboardData?.savedContent || [];
  const chautariPosts = dashboardData?.chautariPosts || [];
  const registeredEvents = dashboardData?.registeredEvents || [];
  const learningProgress = dashboardData?.learningProgress || {};
  const reputation = dashboardData?.reputation || {};
  const notifications = dashboardData?.notifications || [];
  const membership = dashboardData?.membership || {};

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* TOP COMMAND CENTER HEADER BAR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted-area/50 border border-border-theme rounded-2xl px-6 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isContinuityMode ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-text">
                {language === 'en' ? "PERSONAL MEMBER COMMAND CENTER" : "व्यक्तिगत सदस्य कमाण्ड सेन्टर"}
              </span>
              <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md text-[10px] font-mono font-bold">
                Snapshot v{dashboardData?.snapshot_version || "2.6.0"}
              </span>
              <span className="text-[11px] font-bold text-muted-text flex items-center gap-1">
                <Database size={12} className="text-primary" /> {language === 'en' ? "Updated:" : "अद्यावधिक:"} {formatTimeAgo(dashboardData?.generatedAt, language)}
              </span>
              {isContinuityMode && (
                <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full text-[10px] font-bold flex items-center gap-1">
                  <WifiOff size={10} /> {language === 'en' ? "Continuity Mode" : "कन्टिन्युटी मोड"}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-card-foreground tracking-tight mt-0.5">
              {language === 'en' ? "Sanatan Member Command Center" : "सनातन सदस्य कमाण्ड सेन्टर"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDashboardData(targetUid, true)}
              disabled={refreshing}
              className="px-4 py-2 bg-card border border-border-theme hover:bg-muted/60 rounded-xl text-xs font-bold text-card-foreground flex items-center gap-2 transition-all shadow-sm"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-primary" : ""} />
              <span>{language === 'en' ? "Refresh Data" : "डाटा रिफ्रेस"}</span>
            </button>
            {isOwnProfile && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-primary/20 transition-all"
              >
                <Edit2 size={14} />
                <span>{language === 'en' ? "Edit Profile" : "प्रोफाइल सम्पादन"}</span>
              </button>
            )}
          </div>
        </div>

        {/* SECTION 1 — IDENTITY CARD */}
        <div className="bg-card border border-border-theme rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left z-10 w-full md:w-auto">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-primary/10 border-4 border-primary/20 flex items-center justify-center text-primary text-4xl font-black shadow-inner flex-shrink-0">
                {profile.photoURL && profile.photoURL !== "" ? (
                  <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                ) : (
                  (profile.displayName || "S")[0].toUpperCase()
                )}
              </div>
              {isOwnProfile && (
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-105 transition-transform"
                  title={language === 'en' ? "Change photo" : "फोटो फेर्नुहोस्"}
                >
                  <Camera size={14} />
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck size={12} /> {membership.status || (language === 'en' ? "Active Member" : "सक्रिय सदस्य")}
                </span>
                <span className="px-3 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Award size={12} /> {reputation.rank || (language === 'en' ? "Knowledge Explorer" : "ज्ञान अन्वेषक")}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-card-foreground tracking-tight">
                {profile.displayName || (language === 'en' ? "Sanatan Reader" : "सनातन पाठक")}
              </h2>

              <p className="text-xs sm:text-sm text-muted-text font-medium max-w-lg leading-relaxed">
                {profile.bio || (language === 'en' 
                  ? "Regular news explorer, cultural researcher, and active contributor in Chautari forum." 
                  : "सनातन मार्गमा नियमित समाचार अध्ययन, संस्कृति अन्वेषण तथा चौतारी फोरममा सक्रिय विचार प्रवाह।")}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted-text pt-1 font-bold">
                <span className="flex items-center gap-1">
                  <MapPin size={14} className="text-primary" /> {profile.location || (language === 'en' ? "Kathmandu, Nepal" : "काठमाडौँ, नेपाल")}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} className="text-primary" /> {language === 'en' ? "Member Since:" : "सदस्यता:"} {profile.memberSince || (language === 'en' ? "Aug 2026" : "२०८३ साउन")}
                </span>
                <span className="flex items-center gap-1">
                  <Mail size={14} className="text-primary" /> {profile.email || "pathak@sanatan.org"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-muted-area/70 border border-border-theme p-6 rounded-2xl flex flex-col items-center text-center gap-2 z-10 w-full md:w-56 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">
              {language === 'en' ? "Contribution Score" : "योगदान अंक (Score)"}
            </span>
            <span className="text-4xl font-black text-primary font-mono tracking-tight">{reputation.score || 120}</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <Sparkles size={12} /> {reputation.rank?.split('(')[0] || "Level 2 Contributor"}
            </span>
          </div>
        </div>

        {/* SECTION 2 — PERSONAL STATISTICS (LIVE AGGREGATION) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div 
            onClick={() => setActiveTab('articles')}
            className="bg-card border border-border-theme p-5 sm:p-6 rounded-3xl shadow-sm space-y-2 relative overflow-hidden group hover:border-primary/50 transition-all cursor-pointer hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between text-muted-text">
              <span className="text-xs font-black uppercase tracking-wider">
                {language === 'en' ? "Published Articles" : "प्रकाशित लेखहरू"}
              </span>
              <div className="p-2 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                <Newspaper size={18} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-card-foreground font-mono">
              {stats.articlesPublished || userArticles.length || 0} <span className="text-xs font-bold text-muted-text font-sans">{language === 'en' ? "items" : "वटा"}</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <Check size={12} /> {language === 'en' ? "Author Contribution" : "लेखक योगदान"}
            </p>
          </div>

          <div 
            onClick={() => setActiveTab('chautari')}
            className="bg-card border border-border-theme p-5 sm:p-6 rounded-3xl shadow-sm space-y-2 relative overflow-hidden group hover:border-purple-500/50 transition-all cursor-pointer hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between text-muted-text">
              <span className="text-xs font-black uppercase tracking-wider">
                {language === 'en' ? "Community Posts" : "समुदाय पोस्ट"}
              </span>
              <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Users size={18} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-card-foreground font-mono">
              {stats.communityPosts || chautariPosts.length || 0} <span className="text-xs font-bold text-muted-text font-sans">{language === 'en' ? "posts" : "वटा"}</span>
            </div>
            <p className="text-[11px] text-purple-600 font-bold flex items-center gap-1">
              <MessageSquare size={12} /> {language === 'en' ? "Chautari Discussions" : "चौतारी छलफल"}
            </p>
          </div>

          <div 
            onClick={() => setActiveTab('comments')}
            className="bg-card border border-border-theme p-5 sm:p-6 rounded-3xl shadow-sm space-y-2 relative overflow-hidden group hover:border-blue-500/50 transition-all cursor-pointer hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between text-muted-text">
              <span className="text-xs font-black uppercase tracking-wider">
                {language === 'en' ? "Comments & Feedback" : "प्रतिक्रिया तथा टिप्पणी"}
              </span>
              <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Heart size={18} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-card-foreground font-mono">
              {stats.communityComments || stats.comments || userComments.length || 0} <span className="text-xs font-bold text-muted-text font-sans">{language === 'en' ? "comments" : "वटा"}</span>
            </div>
            <p className="text-[11px] text-blue-600 font-bold flex items-center gap-1">
              <Flame size={12} /> {language === 'en' ? "Interaction Rate" : "अन्तरक्रिया दर"}
            </p>
          </div>

          <div 
            onClick={() => setActiveTab('library')}
            className="bg-card border border-border-theme p-5 sm:p-6 rounded-3xl shadow-sm space-y-2 relative overflow-hidden group hover:border-amber-500/50 transition-all cursor-pointer hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between text-muted-text">
              <span className="text-xs font-black uppercase tracking-wider">
                {language === 'en' ? "Saved Knowledge" : "सुरक्षित सङ्ग्रह"}
              </span>
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Bookmark size={18} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-card-foreground font-mono">
              {stats.savedCount || savedContent.length || 0} <span className="text-xs font-bold text-muted-text font-sans">{language === 'en' ? "saved" : "वटा"}</span>
            </div>
            <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
              <BookOpen size={12} /> {language === 'en' ? "Personal Library" : "व्यक्तिगत पुस्तकालय"}
            </p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex overflow-x-auto gap-2 border-b border-border-theme pb-2 scrollbar-none">
          {[
            { id: 'overview', label: language === 'en' ? 'Overview' : 'समग्र कमाण्ड (Overview)' },
            { id: 'articles', label: language === 'en' ? `My Articles (${userArticles.length})` : `मेरो लेखहरू (${userArticles.length})` },
            { id: 'library', label: language === 'en' ? `Saved Articles (${savedContent.length})` : `सुरक्षित ज्ञान (${savedContent.length})` },
            { id: 'chautari', label: language === 'en' ? `Chautari Posts (${chautariPosts.length})` : `चौतारी विचार (${chautariPosts.length})` },
            { id: 'comments', label: language === 'en' ? `My Comments (${userComments.length})` : `मेरो टिप्पणीहरू (${userComments.length})` },
            { id: 'events', label: language === 'en' ? `My Events (${registeredEvents.length})` : `मेरो कार्यक्रमहरू (${registeredEvents.length})` },
            { id: 'learning', label: language === 'en' ? 'Knowledge Journey' : 'ज्ञान यात्रा (Saraswati OS)' },
            { id: 'reputation', label: language === 'en' ? 'Reputation' : 'समुदाय प्रतिष्ठा (Reputation)' },
            { id: 'activity', label: language === 'en' ? 'Activity Timeline' : 'हालैका गतिविधि (Activity)' },
            { id: 'notifications', label: language === 'en' ? `Notifications (${notifications.length})` : `सूचना केन्द्र (${notifications.length})` },
            { id: 'membership', label: language === 'en' ? 'Membership' : 'सदस्यता केन्द्र (Membership)' },
            { id: 'settings', label: language === 'en' ? 'Settings' : 'खाता सेटिङ्स (Settings)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-muted/50 text-muted-text hover:bg-muted hover:text-card-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW COMPREHENSIVE VIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              
              {/* SECTION 3 — RECENT ACTIVITY FEED SUMMARY */}
              <div className="bg-card border border-border-theme rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-border-theme pb-4">
                  <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight flex items-center gap-2">
                    <Activity size={20} className="text-primary" /> {language === 'en' ? "Recent Activity Feed" : "हालैका गतिविधि (Recent Activity Feed)"}
                  </h3>
                  <button onClick={() => setActiveTab('activity')} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    {language === 'en' ? "View All" : "सबै हेर्नुहोस्"} <ArrowUpRight size={14} />
                  </button>
                </div>

                <div className="space-y-4">
                  {activityLogs.length > 0 ? (
                    activityLogs.slice(0, 5).map((act: any, idx: number) => (
                      <div key={act.id || idx} className="flex items-start gap-4 p-4 rounded-2xl bg-muted-area/50 border border-border-theme/60">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-xl flex-shrink-0 mt-0.5">
                          <Sparkles size={16} />
                        </div>
                        <div className="flex-grow space-y-1">
                          <h4 className="text-sm font-bold text-card-foreground">{act.title || act.action}</h4>
                          <div className="flex items-center gap-3 text-[11px] text-muted-text font-medium">
                            <span className="font-mono">{act.createdAt ? formatDate(act.createdAt, language) : (language === 'en' ? "Recently" : "हालै")}</span>
                            <span>•</span>
                            <span className="uppercase text-primary font-bold">{act.type || (language === 'en' ? "Activity" : "गतिविधि")}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-muted-text">
                      {language === 'en' ? "No recent activities recorded yet." : "अहिलेसम्म कुनै गतिविधि दर्ता भएको छैन।"}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 5 — LEARNING JOURNEY QUICK SUMMARY */}
              <div className="bg-card border border-border-theme rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-border-theme pb-4">
                  <div>
                    <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight flex items-center gap-2">
                      <BookOpen size={20} className="text-primary" /> {language === 'en' ? "Saraswati Knowledge OS Learning Journey" : "सरस्वती Knowledge OS ज्ञान यात्रा"}
                    </h3>
                    <p className="text-xs text-muted-text mt-0.5">
                      {language === 'en' ? "Sanatan scripture, verses, and philosophical research log" : "सनातन ग्रन्थ, श्लोक तथा अनुसन्धान अध्ययन विवरण"}
                    </p>
                  </div>
                  <button onClick={() => setIsStudyModalOpen(true)} className="px-3.5 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <Plus size={14} /> {language === 'en' ? "Add Study Log" : "अध्ययन थप्नुहोस्"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="bg-muted-area/60 p-4 rounded-2xl border border-border-theme">
                    <span className="text-[10px] font-black uppercase text-muted-text block">
                      {language === 'en' ? "Verses Studied" : "अध्ययन गरिएका श्लोक"}
                    </span>
                    <span className="text-2xl font-black text-card-foreground font-mono">{learningProgress.versesRead || 42}</span>
                  </div>
                  <div className="bg-muted-area/60 p-4 rounded-2xl border border-border-theme">
                    <span className="text-[10px] font-black uppercase text-muted-text block">
                      {language === 'en' ? "Granthas Explored" : "अन्वेषित ग्रन्थहरू"}
                    </span>
                    <span className="text-2xl font-black text-primary font-mono">{learningProgress.granthasExplored || 3}</span>
                  </div>
                  <div className="bg-muted-area/60 p-4 rounded-2xl border border-border-theme">
                    <span className="text-[10px] font-black uppercase text-muted-text block">
                      {language === 'en' ? "Total Study Time" : "कुल अध्ययन समय"}
                    </span>
                    <span className="text-2xl font-black text-purple-600 font-mono">
                      {learningProgress.hoursStudied || 14.5} {language === 'en' ? "hrs" : "घण्टा"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-card-foreground">
                    <span>{language === 'en' ? "Overall Knowledge Journey Progress" : "ज्ञान यात्रा समग्र प्रगति"}</span>
                    <span className="font-mono text-primary">{learningProgress.progressPercentage || 26}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-500" style={{ width: `${learningProgress.progressPercentage || 26}%` }} />
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT SIDEBAR ON OVERVIEW */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* SECTION 6 — COMMUNITY REPUTATION WIDGET */}
              <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-wider text-muted-text flex items-center gap-2">
                  <Award size={16} className="text-amber-500" /> {language === 'en' ? "Community Reputation & Badges" : "समुदाय प्रतिष्ठा र ब्याजहरू"}
                </h4>
                
                <div className="space-y-3">
                  <div className="p-4 bg-muted-area/60 rounded-2xl border border-border-theme space-y-1">
                    <span className="text-[10px] font-black text-muted-text uppercase">{language === 'en' ? "Current Rank" : "वर्तमान दर्जा"}</span>
                    <h5 className="text-base font-black text-card-foreground">{reputation.rank || (language === 'en' ? "Knowledge Explorer" : "ज्ञान अन्वेषक")}</h5>
                    <p className="text-xs text-muted-text">
                      {language === 'en' ? "Respected reader in Sanatan knowledge and Chautari forum." : "सनातन ज्ञान तथा चौतारी फोरममा सम्मानित पाठक।"}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-black uppercase text-muted-text block">
                      {language === 'en' ? "Earned Badges:" : "प्राप्त ब्याजहरू (Badges):"}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(reputation.badges || (language === 'en' ? ["Knowledge Explorer", "Regular Reader", "Chautari Member"] : ["ज्ञान अन्वेषक", "नियमित पाठक", "चौतारी फोरम सदस्य"])).map((b: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold flex items-center gap-1">
                          <Crown size={12} /> {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 8 — MEMBERSHIP STATUS WIDGET */}
              <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-text flex items-center gap-2">
                    <Crown size={16} className="text-emerald-500" /> {language === 'en' ? "Membership Status" : "सदस्यता स्थिति"}
                  </h4>
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase">
                    {membership.plan || "Premium"}
                  </span>
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-black text-card-foreground">{membership.status || (language === 'en' ? "Active Premium Member" : "सक्रिय प्रिमियम सदस्य")}</h5>
                  <p className="text-xs text-muted-text">
                    {language === 'en' ? "Renewal Date: " : "नवीकरण मिति: "}
                    <span className="font-mono font-bold text-card-foreground">{membership.renewalDate || (language === 'en' ? "2027/03/28" : "२०८३/१२/१५")}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-border-theme">
                  <button onClick={() => setActiveTab('membership')} className="w-full py-2.5 bg-muted-area hover:bg-muted border border-border-theme rounded-2xl text-xs font-bold text-card-foreground flex items-center justify-center gap-2 transition-colors">
                    <span>{language === 'en' ? "View Membership Benefits" : "सदस्यता सुविधाहरू हेर्नुहोस्"}</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: RECENT ACTIVITY FEED */}
        {activeTab === 'activity' && (
          <div className="bg-card border border-border-theme rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight flex items-center gap-2">
              <Activity size={20} className="text-primary" /> {language === 'en' ? "Activity Logs" : "पूर्ण गतिविधि विवरण (Activity Logs)"}
            </h3>
            <div className="space-y-4">
              {activityLogs.length > 0 ? (
                activityLogs.map((act: any, idx: number) => (
                  <div key={act.id || idx} className="p-5 bg-muted-area/50 rounded-2xl border border-border-theme flex items-start gap-4 justify-between">
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                        {act.type || (language === 'en' ? "Activity" : "गतिविधि")}
                      </span>
                      <h4 className="text-base font-bold text-card-foreground">{act.title || act.action}</h4>
                      <p className="text-xs text-muted-text font-mono">
                        {act.createdAt ? formatDate(act.createdAt, language) : (language === 'en' ? "Recently" : "हालै")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-muted-text">
                  {language === 'en' ? "No activity logs found." : "कुनै गतिविधि भेटिएन।"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: MY ARTICLES & ESSAYS */}
        {activeTab === 'articles' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight flex items-center gap-2">
                  <Newspaper size={20} className="text-primary" /> {language === 'en' ? "My Articles & Dharma Research" : "मेरो प्रकाशित लेख तथा धर्म अनुसन्धान"}
                </h3>
                <p className="text-xs text-muted-text mt-0.5">
                  {language === 'en' ? "Articles written or published by you across Sanatan Marga" : "तपाईंले सनातन मार्गमा लेख्नुभएका वा प्रकाशित गर्नुभएका लेखहरू"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-text font-mono">
                  {language === 'en' ? `Total ${userArticles.length} articles` : `कुल ${userArticles.length} वटा लेखहरू`}
                </span>
                <Link to="/write" className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-1.5 hover:bg-primary/95 transition-all">
                  <Plus size={14} />
                  <span>{language === 'en' ? "Write New Article" : "नयाँ लेख लेख्नुहोस्"}</span>
                </Link>
              </div>
            </div>

            {userArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userArticles.map((art: any) => (
                  <div key={art.id} className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase">
                          {art.category || (language === 'en' ? "Sanatan Dharma" : "सनातन धर्म")}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          art.status === 'draft' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
                        }`}>
                          {art.status || "published"}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {art.title}
                      </h4>
                      <p className="text-xs text-muted-text line-clamp-3 leading-relaxed">
                        {art.summary || art.excerpt || art.content}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border-theme space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-text font-mono">
                        <span className="flex items-center gap-1"><Clock size={12} /> {art.createdAt ? formatDate(art.createdAt, language) : (language === 'en' ? "Recently" : "हालै")}</span>
                        <span className="flex items-center gap-1 font-bold"><Flame size={12} className="text-amber-500" /> {art.views || 0} {language === 'en' ? "reads" : "पठन"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/article/${art.slug || art.id}`}
                          className="flex-1 py-2 bg-muted-area hover:bg-muted text-card-foreground text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <span>{language === 'en' ? "Read" : "पढ्नुहोस्"}</span>
                          <ExternalLink size={13} />
                        </Link>
                        <Link 
                          to={`/write?edit=${art.id}`}
                          className="px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded-xl flex items-center justify-center transition-colors"
                          title={language === 'en' ? "Edit Article" : "सम्पादन गर्नुहोस्"}
                        >
                          <Edit3 size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border-theme rounded-3xl p-12 text-center space-y-4">
                <Newspaper size={48} className="mx-auto text-muted-text/40" />
                <h4 className="text-base font-black text-card-foreground">
                  {language === 'en' ? "No Articles Published Yet" : "कुनै लेख प्रकाशित गरिएको छैन"}
                </h4>
                <p className="text-xs text-muted-text max-w-md mx-auto">
                  {language === 'en' ? "Share your knowledge on Vedic philosophy, Nepal's cultural heritage, and Sanatan wisdom with thousands of readers." : "वैदिक दर्शन, नेपालको सांस्कृतिक सम्पदा तथा सनातन ज्ञानमा आधारित आफ्ना विचार हजारौं पाठकसँग साटासाट गर्नुहोस्।"}
                </p>
                <Link to="/write" className="inline-flex px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary/95 transition-all">
                  {language === 'en' ? "Write First Article" : "पहिलो लेख लेख्नुहोस्"}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SAVED KNOWLEDGE (PERSONAL LIBRARY) */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight flex items-center gap-2">
                <Bookmark size={20} className="text-amber-500" /> {language === 'en' ? "Personal Saved Knowledge Library" : "व्यक्तिगत सुरक्षित ज्ञान पुस्तकालय"}
              </h3>
              <span className="text-xs font-bold text-muted-text font-mono">
                {language === 'en' ? `Total ${savedContent.length} items` : `कुल ${savedContent.length} वटा वस्तुहरू`}
              </span>
            </div>

            {savedContent.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {savedContent.map((item: any, idx: number) => (
                  <div key={item.id || idx} className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase">
                          {item.category || (language === 'en' ? "Knowledge" : "ज्ञान")}
                        </span>
                        <span className="text-[10px] font-bold text-muted-text uppercase font-mono">{item.type || "article"}</span>
                      </div>
                      <h4 className="text-base font-black text-card-foreground hover:text-primary transition-colors cursor-pointer">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-text font-mono">
                        {language === 'en' ? "Saved: " : "सुरक्षित: "}{item.savedAt ? formatDate(item.savedAt, language) : (language === 'en' ? "Recently" : "हालै")}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border-theme flex items-center justify-between gap-2">
                      <Link to={item.url || `/article/${item.linkedArticleId || item.id}`} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                        <span>{language === 'en' ? "Read Article" : "अध्ययन गर्नुहोस्"}</span>
                        <ExternalLink size={14} />
                      </Link>
                      <button 
                        onClick={() => handleRemoveBookmark(item.id)}
                        className="text-xs text-muted-text hover:text-red-500 font-bold px-2 py-1 hover:bg-red-500/10 rounded-lg transition-colors"
                        title={language === 'en' ? "Remove from Library" : "सङ्ग्रहबाट हटाउनुहोस्"}
                      >
                        {language === 'en' ? "Remove" : "हटाउनुहोस्"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border-theme rounded-3xl p-12 text-center space-y-4">
                <Bookmark size={48} className="mx-auto text-muted-text/40" />
                <h4 className="text-base font-black text-card-foreground">
                  {language === 'en' ? "Library is Empty" : "पुस्तकालय खाली छ"}
                </h4>
                <p className="text-xs text-muted-text max-w-md mx-auto">
                  {language === 'en' ? "Your saved articles, research, and wisdom bookmarks will appear here." : "तपाईंले सुरक्षित गर्नुभएका समाचार, अनुसन्धान लेख तथा ज्ञान विन्दुहरू यहाँ देखिनेछन्।"}
                </p>
                <Link to="/" className="inline-flex px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary/95 transition-all">
                  {language === 'en' ? "Explore Articles" : "ज्ञान विन्दुहरू अन्वेषण गर्नुहोस्"}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB: CHAUTARI POSTS */}
        {activeTab === 'chautari' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight flex items-center gap-2">
                <MessageSquare size={20} className="text-primary" /> {language === 'en' ? "My Chautari Posts & Discussions" : "मेरो चौतारी विचार तथा छलफलहरू"}
              </h3>
              <span className="text-xs font-bold text-muted-text font-mono">
                {language === 'en' ? `Total ${chautariPosts.length} posts` : `कुल ${chautariPosts.length} वटा विचारहरू`}
              </span>
            </div>

            {chautariPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {chautariPosts.map((post: any) => (
                  <div key={post.id} className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase">
                          {post.category || (language === 'en' ? "Discussion" : "सामान्य छलफल")}
                        </span>
                        <span className="text-[10px] font-bold text-muted-text font-mono">{post.createdAt ? formatDate(post.createdAt, language) : (language === 'en' ? "Recently" : "हालै")}</span>
                      </div>
                      <h4 className="text-base font-black text-card-foreground">
                        {post.title}
                      </h4>
                      <p className="text-xs text-muted-text line-clamp-3">
                        {post.content}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border-theme flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs font-bold text-muted-text">
                        <span className="flex items-center gap-1"><Heart size={14} className="text-red-500" /> {post.upvotes || 0}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={14} /> {post.commentsCount || 0}</span>
                      </div>
                      <Link to={`/community`} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                        <span>{language === 'en' ? "Open Discussion" : "छलफलमा जानुहोस्"}</span>
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border-theme rounded-3xl p-12 text-center space-y-4">
                <MessageSquare size={48} className="mx-auto text-muted-text/40" />
                <h4 className="text-base font-black text-card-foreground">
                  {language === 'en' ? "No Posts Published Yet" : "कुनै विचार पोस्ट गरिएको छैन"}
                </h4>
                <p className="text-xs text-muted-text max-w-md mx-auto">
                  {language === 'en' ? "You haven't posted any thoughts or inquiries in the Sanatan Chautari forum yet." : "तपाईंले सनातन चौतारी फोरममा अहिलेसम्म कुनै विषय वा जिज्ञासा राख्नुभएको छैन।"}
                </p>
                <Link to="/community" className="inline-flex px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary/95 transition-all">
                  {language === 'en' ? "Post First Discussion" : "पहिलो विचार पोस्ट गर्नुहोस्"}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB: MY COMMENTS & FEEDBACK */}
        {activeTab === 'comments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight flex items-center gap-2">
                  <MessageCircle size={20} className="text-primary" /> {language === 'en' ? "My Comments & Discussion Replies" : "मेरो टिप्पणी तथा छलफल प्रतिक्रियाहरू"}
                </h3>
                <p className="text-xs text-muted-text mt-0.5">
                  {language === 'en' ? "All your contributions and thoughts shared across articles and Chautari" : "लेख तथा चौतारी संवादहरूमा तपाईंले राख्नुभएका प्रतिक्रियाहरू"}
                </p>
              </div>
              <span className="text-xs font-bold text-muted-text font-mono">
                {language === 'en' ? `Total ${userComments.length} comments` : `कुल ${userComments.length} वटा टिप्पणीहरू`}
              </span>
            </div>

            {userComments.length > 0 ? (
              <div className="space-y-4">
                {userComments.map((c: any, idx: number) => (
                  <div key={c.id || idx} className="bg-card border border-border-theme rounded-3xl p-6 space-y-3 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-0.5 bg-blue-500/10 text-blue-600 rounded-full text-[10px] font-black uppercase">
                        {c.articleTitle ? (language === 'en' ? "Article Comment" : "लेख टिप्पणी") : (language === 'en' ? "Chautari Reply" : "चौतारी प्रतिक्रिया")}
                      </span>
                      <span className="text-[10px] font-bold text-muted-text font-mono">
                        {c.createdAt ? formatDate(c.createdAt, language) : (language === 'en' ? "Recently" : "हालै")}
                      </span>
                    </div>

                    {c.articleTitle && (
                      <p className="text-xs font-bold text-primary">
                        {language === 'en' ? "On Article: " : "लेख: "} <span className="underline">{c.articleTitle}</span>
                      </p>
                    )}

                    <p className="text-sm font-medium text-card-foreground bg-muted-area/40 p-4 rounded-2xl border border-border-theme/40 leading-relaxed">
                      "{c.content || c.text || c.comment}"
                    </p>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3 text-xs text-muted-text">
                        <span className="flex items-center gap-1 font-bold"><Heart size={13} className="text-red-500" /> {c.likes || c.upvotes || 0}</span>
                      </div>
                      {c.articleId && (
                        <Link to={`/article/${c.articleId}`} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                          <span>{language === 'en' ? "View In Article" : "लेखमा हेर्नुहोस्"}</span>
                          <ExternalLink size={13} />
                        </Link>
                      )}
                      {c.postId && (
                        <Link to={`/community`} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                          <span>{language === 'en' ? "View In Chautari" : "चौतारीमा हेर्नुहोस्"}</span>
                          <ExternalLink size={13} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border-theme rounded-3xl p-12 text-center space-y-4">
                <MessageCircle size={48} className="mx-auto text-muted-text/40" />
                <h4 className="text-base font-black text-card-foreground">
                  {language === 'en' ? "No Comments Found" : "कुनै टिप्पणी भेटिएन"}
                </h4>
                <p className="text-xs text-muted-text max-w-md mx-auto">
                  {language === 'en' ? "Engage with articles and community posts to share perspectives and earn reputation points." : "लेखहरू तथा चौतारीमा आफ्नो विचार व्यक्त गर्नुहोस् र मर्यादा अङ्क आर्जन गर्नुहोस्।"}
                </p>
                <Link to="/" className="inline-flex px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary/95 transition-all">
                  {language === 'en' ? "Read & Comment" : "लेखहरू पढ्नुहोस्"}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB: REGISTERED EVENTS */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight flex items-center gap-2">
                <Calendar size={20} className="text-primary" /> {language === 'en' ? "My Cultural & Panchanga Events" : "मेरो सांस्कृतिक तथा पञ्चाङ्ग कार्यक्रमहरू"}
              </h3>
              <span className="text-xs font-bold text-muted-text font-mono">
                {language === 'en' ? `Total ${registeredEvents.length} registrations` : `कुल ${registeredEvents.length} वटा दर्ताहरू`}
              </span>
            </div>

            {registeredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {registeredEvents.map((reg: any) => (
                  <div key={reg.id} className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase">
                          {reg.status || (language === 'en' ? "Registered" : "दर्ता भएको")}
                        </span>
                        <span className="text-[10px] font-bold text-muted-text font-mono">{language === 'en' ? "Registered: " : "दर्ता: "}{reg.registeredAt ? formatDate(reg.registeredAt, language) : (language === 'en' ? "Recently" : "हालै")}</span>
                      </div>
                      <h4 className="text-base font-black text-card-foreground">
                        {reg.eventTitle || (language === 'en' ? "Cultural Celebration / Puja" : "सांस्कृतिक उत्सव छलफल / पूजा")}
                      </h4>
                      <div className="space-y-1.5 text-xs text-muted-text font-medium">
                        <p className="flex items-center gap-1.5"><Calendar size={13} /> {reg.eventDate || (language === 'en' ? "Upcoming Ekadashi / Special Festival" : "आगामी एकादशी / विशेष पर्व")}</p>
                        <p className="flex items-center gap-1.5"><MapPin size={13} /> {reg.eventLocation || (language === 'en' ? "Sanatan Marg Virtual Chautari" : "सनातन मार्ग भर्चुअल चौतारी")}</p>
                      </div>
                    </div>

                    <Link to="/events" className="pt-3 border-t border-border-theme text-xs font-bold text-primary flex items-center justify-center gap-1 hover:underline bg-muted-area/50 py-2 rounded-xl border border-border-theme/40">
                      <span>{language === 'en' ? "View Event Details" : "कार्यक्रम विवरण हेर्नुहोस्"}</span>
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border-theme rounded-3xl p-12 text-center space-y-4">
                <Calendar size={48} className="mx-auto text-muted-text/40" />
                <h4 className="text-base font-black text-card-foreground">
                  {language === 'en' ? "No Registered Events" : "कुनै कार्यक्रम दर्ता गरिएको छैन"}
                </h4>
                <p className="text-xs text-muted-text max-w-md mx-auto">
                  {language === 'en' ? "You have not registered for any religious, cultural festivals, or knowledge symposia yet." : "तपाईंले अहिलेसम्म कुनै पनि धार्मिक, सांस्कृतिक पर्व वा ज्ञान गोष्ठीमा सहभागिता जनाउनुभएको छैन।"}
                </p>
                <Link to="/events" className="inline-flex px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary/95 transition-all">
                  {language === 'en' ? "Explore Events" : "कार्यक्रमहरू खोज्नुहोस्"}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: LEARNING JOURNEY (SARASWATI OS) */}
        {activeTab === 'learning' && (
          <div className="bg-card border border-border-theme rounded-3xl p-8 space-y-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-card-foreground flex items-center gap-2">
                  <BookOpen size={24} className="text-primary" /> {language === 'en' ? "Saraswati Knowledge OS Study Journey" : "सरस्वती Knowledge OS पठन यात्रा"}
                </h3>
                <p className="text-xs text-muted-text mt-1">
                  {language === 'en' ? "Sanatan philosophy, Vedas, Puranas, and research analytics" : "सनातन दर्शन, वेद, पुराण तथा अनुसन्धान अध्ययन विश्लेषण"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleQuickVerseStudy(5)} 
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 hover:bg-emerald-700 transition-all"
                >
                  <Zap size={14} /> {language === 'en' ? "+5 Verses Quick Log" : "+५ श्लोक शीघ्र दर्ता"}
                </button>
                <button onClick={() => setIsStudyModalOpen(true)} className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-1">
                  <Plus size={16} /> {language === 'en' ? "Log Study Progress" : "अध्ययन प्रगति दर्ता"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 bg-muted-area/60 rounded-3xl border border-border-theme text-center space-y-2">
                <span className="text-xs font-black text-muted-text uppercase">{language === 'en' ? "Verses Studied" : "अध्ययन गरिएका श्लोक"}</span>
                <div className="text-4xl font-black text-card-foreground font-mono">{learningProgress.versesRead || 0}</div>
                <span className="text-[11px] text-emerald-600 font-bold">{language === 'en' ? "Gita & Vedic Verses" : "श्रीमद्भगवद्गीता तथा वेद"}</span>
              </div>
              <div className="p-6 bg-muted-area/60 rounded-3xl border border-border-theme text-center space-y-2">
                <span className="text-xs font-black text-muted-text uppercase">{language === 'en' ? "Granthas Explored" : "अन्वेषित ग्रन्थहरू"}</span>
                <div className="text-4xl font-black text-primary font-mono">{learningProgress.granthasExplored || 0}</div>
                <span className="text-[11px] text-primary font-bold">{language === 'en' ? "Original Texts" : "मूल ग्रन्थ अध्ययन"}</span>
              </div>
              <div className="p-6 bg-muted-area/60 rounded-3xl border border-border-theme text-center space-y-2">
                <span className="text-xs font-black text-muted-text uppercase">{language === 'en' ? "Study Time" : "अध्ययन समय"}</span>
                <div className="text-4xl font-black text-purple-600 font-mono">{learningProgress.hoursStudied || 0} {language === 'en' ? "hrs" : "घण्टा"}</div>
                <span className="text-[11px] text-purple-600 font-bold">{language === 'en' ? "Time Dedicated" : "ज्ञानार्जन समय"}</span>
              </div>
              <div className="p-6 bg-muted-area/60 rounded-3xl border border-border-theme text-center space-y-2">
                <span className="text-xs font-black text-muted-text uppercase">{language === 'en' ? "Completed Topics" : "पूर्ण विषयहरू"}</span>
                <div className="text-4xl font-black text-amber-600 font-mono">{learningProgress.topicsCompleted || 0}</div>
                <span className="text-[11px] text-amber-600 font-bold">{language === 'en' ? "Milestones" : "अध्याय सफलता"}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: COMMUNITY REPUTATION */}
        {activeTab === 'reputation' && (
          <div className="bg-card border border-border-theme rounded-3xl p-8 space-y-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-border-theme pb-4">
              <div>
                <h3 className="text-xl font-black text-card-foreground flex items-center gap-2">
                  <Award size={24} className="text-amber-500" /> {language === 'en' ? "Community Reputation & Badges (Reputation OS)" : "समुदाय प्रतिष्ठा र ब्याज केन्द्र (Reputation OS)"}
                </h3>
                <p className="text-xs text-muted-text mt-1">
                  {language === 'en' ? "Reputation calculated based on direct platform contributions, reading, and self-study" : "प्रत्यक्ष प्लेटफर्म योगदान, लेख पठन तथा स्वाध्यायका आधारमा गणना गरिएको प्रतिष्ठा"}
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-600 font-black text-xs rounded-full border border-amber-500/20">
                Level {reputation.rankLevel || 1} Honor
              </span>
            </div>

            {/* NEXT RANK PROGRESS BAR */}
            <div className="p-6 bg-muted-area/50 rounded-2xl border border-border-theme space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-card-foreground">{language === 'en' ? "Next Rank Progress:" : "अग्लो मर्यादा रैंक प्रगति:"}</span>
                <span className="text-primary font-mono">{reputation.score || 0} / {reputation.nextRankThreshold || 300} {language === 'en' ? "pts" : "अङ्क"} ({reputation.progressToNextRank || 0}%)</span>
              </div>
              <div className="w-full bg-border-theme/40 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, Math.min(100, reputation.progressToNextRank || 0))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-muted-area/60 rounded-3xl border border-border-theme space-y-3">
                <span className="text-xs font-black text-muted-text uppercase">{language === 'en' ? "Total Contribution Points" : "कुल योगदान अङ्क"}</span>
                <div className="text-4xl font-black text-card-foreground font-mono">{reputation.score || 120}</div>
                <p className="text-xs text-muted-text">{language === 'en' ? "Total merit points calculated by verified reputation engine." : "प्रमाणित सर्भर-साइड रेप्युटेसन इन्जिनद्वारा गणना गरिएको कुल मर्यादा।"}</p>
              </div>
              <div className="p-6 bg-muted-area/60 rounded-3xl border border-border-theme space-y-3">
                <span className="text-xs font-black text-muted-text uppercase">{language === 'en' ? "Current Rank" : "वर्तमान मर्यादा रैंक"}</span>
                <div className="text-lg font-black text-primary">{reputation.rank || (language === 'en' ? "Knowledge Explorer" : "ज्ञान अन्वेषक")}</div>
                <p className="text-xs text-muted-text">{language === 'en' ? "Verified honor title in Sanatan Marg forum." : "सनातन मार्ग चौतारी फोरममा प्रमाणित मर्यादा दर्जा।"}</p>
              </div>
              <div className="p-6 bg-muted-area/60 rounded-3xl border border-border-theme space-y-3">
                <span className="text-xs font-black text-muted-text uppercase">{language === 'en' ? "Earned Badges" : "प्राप्त सम्मान/ब्याजहरू"}</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(reputation.badges || (language === 'en' ? ["Knowledge Explorer", "Regular Reader"] : ["ज्ञान अन्वेषक", "नियमित पाठक"])).map((b: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl text-xs font-bold flex items-center gap-1">
                      <Crown size={12} /> {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* REPUTATION AUDIT LEDGER */}
            <div className="p-6 bg-muted-area/40 rounded-3xl border border-border-theme space-y-4">
              <h4 className="text-sm font-black text-card-foreground uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-500" /> {language === 'en' ? "Transparent Reputation Ledger Audit" : "पारदर्शी प्रतिष्ठा अङ्क विवरण (Reputation Ledger Audit)"}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3 bg-card rounded-2xl border border-border-theme flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-500" />
                    <span className="text-xs font-bold text-card-foreground">{language === 'en' ? "Welcome / Member Bonus" : "स्वागत / सदस्यता बोनस"}</span>
                  </div>
                  <span className="text-xs font-mono font-black text-emerald-600">+50</span>
                </div>
                <div className="p-3 bg-card rounded-2xl border border-border-theme flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Newspaper size={16} className="text-primary" />
                    <span className="text-xs font-bold text-card-foreground">{language === 'en' ? `Published Articles (${stats.articlesPublished || 0})` : `प्रकाशित लेखहरू (${stats.articlesPublished || 0})`}</span>
                  </div>
                  <span className="text-xs font-mono font-black text-emerald-600">+{(stats.articlesPublished || 0) * 30}</span>
                </div>
                <div className="p-3 bg-card rounded-2xl border border-border-theme flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-blue-500" />
                    <span className="text-xs font-bold text-card-foreground">{language === 'en' ? `Chautari Posts (${stats.communityPosts || 0})` : `चौतारी पोस्टहरू (${stats.communityPosts || 0})`}</span>
                  </div>
                  <span className="text-xs font-mono font-black text-emerald-600">+{(stats.communityPosts || 0) * 15}</span>
                </div>
                <div className="p-3 bg-card rounded-2xl border border-border-theme flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-purple-500" />
                    <span className="text-xs font-bold text-card-foreground">{language === 'en' ? `Discussion Comments (${stats.comments || 0})` : `छलफल टिप्पणीहरू (${stats.comments || 0})`}</span>
                  </div>
                  <span className="text-xs font-mono font-black text-emerald-600">+{(stats.comments || 0) * 5}</span>
                </div>
                <div className="p-3 bg-card rounded-2xl border border-border-theme flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold text-card-foreground">{language === 'en' ? `Verses Self-Study (${learningProgress.versesRead || 0})` : `श्लोक स्वाध्याय (${learningProgress.versesRead || 0})`}</span>
                  </div>
                  <span className="text-xs font-mono font-black text-emerald-600">+{(learningProgress.versesRead || 0) * 1}</span>
                </div>
                <div className="p-3 bg-card rounded-2xl border border-border-theme flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass size={16} className="text-indigo-500" />
                    <span className="text-xs font-bold text-card-foreground">{language === 'en' ? `Granthas Explored (${learningProgress.granthasExplored || 0})` : `मूल ग्रन्थ अन्वेषण (${learningProgress.granthasExplored || 0})`}</span>
                  </div>
                  <span className="text-xs font-mono font-black text-emerald-600">+{(learningProgress.granthasExplored || 0) * 10}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="bg-card border border-border-theme rounded-3xl p-8 space-y-6 shadow-sm">
            <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight flex items-center gap-2">
              <Bell size={20} className="text-primary" /> {language === 'en' ? "Notifications Center" : "सूचना केन्द्र (Notifications)"}
            </h3>
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((n: any, idx: number) => {
                  const artId = n.articleId || n.extra?.articleId;
                  const pstId = n.postId || n.extra?.postId;
                  const evtId = n.eventId || n.extra?.eventId;

                  const notifLink = n.link || n.linkUrl || n.url || (
                    artId ? `/article/${artId}` :
                    pstId ? `/community/post/${pstId}` :
                    evtId ? `/events/${evtId}` :
                    '/latest'
                  );
                  return (
                    <Link 
                      key={n.id || idx} 
                      to={notifLink} 
                      className="p-4 bg-muted-area/50 hover:bg-muted-area rounded-2xl border border-border-theme/60 hover:border-primary/50 flex items-center justify-between text-xs transition-all group block"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${n.isRead ? 'bg-muted-text/40' : 'bg-primary'}`} />
                        <div className="space-y-0.5">
                          <span className="font-bold text-card-foreground group-hover:text-primary transition-colors block">{n.title}</span>
                          {n.message && <span className="text-[11px] text-muted-text line-clamp-1">{n.message}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-text font-mono text-[10px]">{n.time || (n.createdAt ? formatDate(n.createdAt, language) : (language === 'en' ? "Recently" : "हालै"))}</span>
                        <ExternalLink size={13} className="text-muted-text group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-muted-text">
                  {language === 'en' ? "No notifications at this time." : "यस समयमा कुनै सूचना छैन।"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: MEMBERSHIP CENTER */}
        {activeTab === 'membership' && (
          <div className="bg-card border border-border-theme rounded-3xl p-8 space-y-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-6">
              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-black uppercase tracking-wider">
                  {membership.status || (language === 'en' ? "Active Premium Member" : "सक्रिय प्रिमियम सदस्य")}
                </span>
                <h3 className="text-2xl font-black text-card-foreground mt-2">
                  {language === 'en' ? "Sanatan Marg Premium Membership" : "सनातन मार्ग प्रिमियम सदस्यता"}
                </h3>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-muted-text font-bold block">{language === 'en' ? "Renewal Date" : "नवीकरण मिति"}</span>
                <span className="text-sm font-black text-card-foreground font-mono">{membership.renewalDate || (language === 'en' ? "2027/03/28" : "२०८३/१२/१५")}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-muted-text uppercase tracking-wider">
                {language === 'en' ? "Your Premium Benefits:" : "तपाईंका प्रिमियम सुविधाहरू:"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(membership.benefits || (language === 'en' ? [
                  "Full access to all premium articles & research",
                  "Ad-free clean reading experience",
                  "Exclusive webinars and Chautari forum access"
                ] : [
                  "सबै प्रिमियम लेखहरूमा निःशुल्क पहुँच",
                  "विज्ञापनरहित पठन अनुभव",
                  "विशेष वेबिनार र चौतारी फोरम पहुँच"
                ])).map((b: string, i: number) => (
                  <div key={i} className="p-4 bg-muted-area/60 rounded-2xl border border-border-theme flex items-center gap-3 text-xs font-bold text-card-foreground">
                    <Check size={18} className="text-emerald-600 flex-shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NEPAL PAYMENT GATEWAYS INTEGRATION CARD */}
            <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-primary font-black text-sm uppercase">
                <Wallet size={18} /> {language === 'en' ? "Digital Payment Gateways (eSewa / Khalti / IME Pay)" : "डिजिटल भुक्तानी गेटवे (eSewa / Khalti / IME Pay)"}
              </div>
              <p className="text-xs text-muted-text">
                {language === 'en'
                  ? "Integrated with Nepal's premier digital wallets eSewa, Khalti, and IME Pay for seamless renewal and contributions."
                  : "नेपालका प्रमुख डिजिटल वालेटहरू eSewa, Khalti तथा IME Pay मार्फत प्रिमियम सदस्यता तथा योगदान नवीकरण तयारी अवस्थामा रहेको छ।"}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase">eSewa Ready</span>
                <span className="px-3 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-black uppercase">Khalti Ready</span>
                <span className="px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase">IME Pay Ready</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: ACCOUNT SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-card border border-border-theme rounded-3xl p-8 space-y-6 shadow-sm">
            <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight flex items-center gap-2">
              <User size={20} className="text-primary" /> {language === 'en' ? "Account Settings & Personal Information" : "खाता सेटिङ्स र व्यक्तिगत विवरण"}
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-text uppercase">{language === 'en' ? "Display Name" : "नाम (Display Name)"}</label>
                <input 
                  type="text" 
                  value={editFormData.displayName} 
                  onChange={(e) => setEditFormData({ ...editFormData, displayName: e.target.value })}
                  className="w-full bg-muted-area/50 border border-border-theme rounded-2xl px-4 py-3 text-sm font-bold text-card-foreground focus:outline-none focus:border-primary" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-text uppercase">{language === 'en' ? "Location" : "ठेगाना (Location)"}</label>
                <input 
                  type="text" 
                  value={editFormData.location} 
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  className="w-full bg-muted-area/50 border border-border-theme rounded-2xl px-4 py-3 text-sm font-bold text-card-foreground focus:outline-none focus:border-primary" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-text uppercase">{language === 'en' ? "Bio" : "परिचय (Bio)"}</label>
                <textarea 
                  rows={3}
                  value={editFormData.bio} 
                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                  className="w-full bg-muted-area/50 border border-border-theme rounded-2xl px-4 py-3 text-sm font-bold text-card-foreground focus:outline-none focus:border-primary" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-text uppercase">{language === 'en' ? "Email (Immutable)" : "इमेल (Email - अपरिवर्तनीय)"}</label>
                <input 
                  type="email" 
                  disabled 
                  value={profile.email || "pathak@sanatan.org"} 
                  className="w-full bg-muted-area/50 border border-border-theme rounded-2xl px-4 py-3 text-sm font-bold text-muted-text cursor-not-allowed" 
                />
              </div>

              <button type="submit" className="px-6 py-3 bg-primary text-white hover:bg-primary/90 rounded-2xl text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-2">
                <Save size={16} />
                <span>{language === 'en' ? "Save Changes" : "परिवर्तनहरू सुरक्षित गर्नुहोस्"}</span>
              </button>
            </form>
          </div>
        )}

      </main>

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card border border-border-theme rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-border-theme pb-4">
                <h3 className="text-lg font-black text-card-foreground">{language === 'en' ? "Edit Profile Information" : "प्रोफाइल विवरण सम्पादन गर्नुहोस्"}</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-muted rounded-full">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-text uppercase">{language === 'en' ? "Display Name" : "नाम (Display Name)"}</label>
                  <input type="text" value={editFormData.displayName} onChange={(e) => setEditFormData({ ...editFormData, displayName: e.target.value })} className="w-full bg-muted-area border border-border-theme rounded-xl px-4 py-2.5 text-sm font-bold text-card-foreground" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-text uppercase">{language === 'en' ? "Location" : "ठेगाना (Location)"}</label>
                  <input type="text" value={editFormData.location} onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })} className="w-full bg-muted-area border border-border-theme rounded-xl px-4 py-2.5 text-sm font-bold text-card-foreground" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-text uppercase">{language === 'en' ? "Profile Photo URL" : "प्रोफाइल फोटो URL"}</label>
                  <input type="text" value={editFormData.photoURL} onChange={(e) => setEditFormData({ ...editFormData, photoURL: e.target.value })} className="w-full bg-muted-area border border-border-theme rounded-xl px-4 py-2.5 text-sm font-bold text-card-foreground" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-text uppercase">{language === 'en' ? "Bio" : "बायो (Bio)"}</label>
                  <textarea rows={3} value={editFormData.bio} onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })} className="w-full bg-muted-area border border-border-theme rounded-xl px-4 py-2.5 text-sm font-bold text-card-foreground" />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 bg-muted rounded-xl text-xs font-bold">{language === 'en' ? "Cancel" : "रद्द गर्नुहोस्"}</button>
                  <button type="submit" className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20">{language === 'en' ? "Save" : "सुरक्षित गर्नुहोस्"}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STUDY PROGRESS LOG MODAL */}
      <AnimatePresence>
        {isStudyModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card border border-border-theme rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-border-theme pb-4">
                <h3 className="text-lg font-black text-card-foreground">{language === 'en' ? "Log Saraswati OS Knowledge Progress" : "सरस्वती OS ज्ञान यात्रा रेकर्ड थप्नुहोस्"}</h3>
                <button onClick={() => setIsStudyModalOpen(false)} className="p-2 hover:bg-muted rounded-full">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveLearningProgress} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-text uppercase">{language === 'en' ? "Verses Studied Count" : "अध्ययन गरिएका श्लोक संख्या"}</label>
                  <input type="number" value={studyInput.versesRead} onChange={(e) => setStudyInput({ ...studyInput, versesRead: parseInt(e.target.value) || 0 })} className="w-full bg-muted-area border border-border-theme rounded-xl px-4 py-2.5 text-sm font-bold font-mono text-card-foreground" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-text uppercase">{language === 'en' ? "Granthas Explored Count" : "अन्वेषित ग्रन्थ संख्या"}</label>
                  <input type="number" value={studyInput.granthasExplored} onChange={(e) => setStudyInput({ ...studyInput, granthasExplored: parseInt(e.target.value) || 0 })} className="w-full bg-muted-area border border-border-theme rounded-xl px-4 py-2.5 text-sm font-bold font-mono text-card-foreground" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-text uppercase">{language === 'en' ? "Total Study Hours" : "कुल अध्ययन समय (घण्टा)"}</label>
                  <input type="number" step="0.5" value={studyInput.hoursStudied} onChange={(e) => setStudyInput({ ...studyInput, hoursStudied: parseFloat(e.target.value) || 0 })} className="w-full bg-muted-area border border-border-theme rounded-xl px-4 py-2.5 text-sm font-bold font-mono text-card-foreground" />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsStudyModalOpen(false)} className="px-5 py-2.5 bg-muted rounded-xl text-xs font-bold">{language === 'en' ? "Cancel" : "रद्द गर्नुहोस्"}</button>
                  <button type="submit" className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20">{language === 'en' ? "Save" : "सुरक्षित गर्नुहोस्"}</button>
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
