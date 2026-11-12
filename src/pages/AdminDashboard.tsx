import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, FileText, Users, Settings, LogOut, 
  Plus, Eye, Clock, TrendingUp, Search, Bell, 
  CheckCircle, AlertCircle, Send, Database, Menu, Mail, Sparkles
} from "lucide-react";
import { collection, query, orderBy, limit, getDocs, addDoc, where, updateDoc, deleteDoc, doc } from "@/src/lib/firebase";
import { signOut } from "@/src/lib/authClient";
import { db, handleFirestoreError, OperationType, safeOnSnapshot } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { formatDate } from "@/src/lib/utils";
import { seedDatabase, dummyCategories } from "@/src/lib/seedData";
import type { Article } from "@/src/types";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import AlertModal from "@/src/components/ui/AlertModal";
import CategorySelectionModal from "@/src/components/admin/CategorySelectionModal";
import AIGeneratorModal from "@/src/components/admin/AIGeneratorModal";
import SnapshotCoverageDashboard from "@/src/components/admin/SnapshotCoverageDashboard";
import SnapshotTraceDashboard from "@/src/components/admin/SnapshotTraceDashboard";
import { motion, AnimatePresence } from "motion/react";
import NotificationBell from "@/src/components/notifications/NotificationBell";
import { AdminSkeleton } from "@/src/components/ui/PageLoaders";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { useLimitedMode } from "@/src/hooks/useFirestoreQuota";
import { getDocsWithCacheFallback } from "@/src/lib/firebase";
import { offlineQueue } from "@/src/lib/offlineQueue";
import { resolveArticleImage } from "@/src/services/imageIntelligence";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { getCategoryDisplayName } from "@/src/utils/categoryHelper";
import { toast } from "sonner";
import { ShieldAlert, AlertTriangle, RefreshCw, Zap } from "lucide-react";
import { useLanguage } from "@/src/context/LanguageContext";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { t, language, getLocalized } = useLanguage();
  const limitedMode = useLimitedMode();
  const navigate = useNavigate();
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [recentLimit, setRecentLimit] = useState<10 | 25 | 50 | 100>(10);
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState(0);
  const [seedMessage, setSeedMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(offlineQueue.getPendingCount());
  
  const [alertInfo, setAlertInfo] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' }>({
    show: false,
    title: "",
    message: "",
    type: 'success'
  });
  const [stats, setStats] = useState({
    totalViews: 0,
    publishedCount: 0,
    pendingDrafts: 0,
    publishedToday: 0,
    newMessages: 0,
    reviewCount: 0
  });
  const [quickDraft, setQuickDraft] = useState({ title: "", category: "politics" });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annForm, setAnnForm] = useState({
    id: "",
    title: "",
    content: "",
    type: "info" as "info" | "warning" | "success" | "critical",
    published: true,
    isPinned: false
  });

  const fetchAnnouncements = async () => {
    try {
      const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAnnouncements(list);
    } catch (err: any) {
      console.warn("Error fetching announcements (using fallback):", err?.message || err);
      setAnnouncements([
        {
          id: "default-1",
          title: "सनातन मार्ग समाचार कक्षमा स्वागत छ",
          content: "दैनिक ताजा समाचार, सम्पादकीय र विश्लेषणहरूको लागि नियमित रूपमा भ्रमण गर्नुहोस्।",
          type: "info",
          published: true,
          isPinned: true,
          createdAt: new Date().toISOString()
        }
      ]);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annForm.title || !annForm.content) {
      toast.error("शीर्षक र विवरण आवश्यक छ।");
      return;
    }

    try {
      const annData = {
        title: annForm.title,
        content: annForm.content,
        type: annForm.type,
        published: annForm.published,
        isPinned: annForm.isPinned,
        updatedAt: new Date().toISOString(),
        createdBy: user?.displayName || "Admin"
      };

      if (annForm.id) {
        const docRef = doc(db, "announcements", annForm.id);
        await updateDoc(docRef, annData);
        toast.success("सूचना सफलतापूर्वक परिमार्जन गरियो।");
      } else {
        await addDoc(collection(db, "announcements"), {
          ...annData,
          createdAt: new Date().toISOString()
        });
        toast.success("नयाँ सूचना थपियो।");
      }
      setShowAnnModal(false);
      setAnnForm({ id: "", title: "", content: "", type: "info", published: true, isPinned: false });
      await snapshotEngine.triggerServerRebuild();
      fetchAnnouncements();
    } catch (err) {
      console.error("Error saving announcement:", err);
      toast.error("सूचना सुरक्षित गर्न सकिएन।");
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm("के तपाईं यो सूचना स्थायी रूपमा हटाउन चाहनुहुन्छ?")) return;
    try {
      await deleteDoc(doc(db, "announcements", id));
      toast.success("सूचना हटाइयो।");
      await snapshotEngine.triggerServerRebuild();
      fetchAnnouncements();
    } catch (err) {
      console.error("Error deleting announcement:", err);
      toast.error("सूचना हटाउन सकिएन।");
    }
  };

  const handleTogglePublish = async (ann: any) => {
    try {
      const docRef = doc(db, "announcements", ann.id);
      await updateDoc(docRef, { published: !ann.published });
      toast.success(ann.published ? "सूचना अभिलेख (archived) गरियो।" : "सूचना प्रकाशित गरियो।");
      await snapshotEngine.triggerServerRebuild();
      fetchAnnouncements();
    } catch (err) {
      console.error("Error toggling publication:", err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSeed = async () => {
    setShowCategoryModal(true);
  };

  const confirmSeed = async (selectedCategories: string[], count: number) => {
    setShowCategoryModal(false);
    setSeeding(true);
    setSeedProgress(0);
    setSeedMessage("सुरु गर्दै...");
    
    try {
      const result = await seedDatabase(selectedCategories, count, (progress, message) => {
        setSeedProgress(progress);
        setSeedMessage(message);
      });
      
      setSeeding(false);
      if (result.success) {
        setAlertInfo({
          show: true,
          title: "सफलता!",
          message: "डेटाबेस सफलतापूर्वक सीड गरियो!",
          type: 'success'
        });
      } else {
        setAlertInfo({
          show: true,
          title: "त्रुटि!",
          message: `डेटाबेस सीड गर्दा समस्या आयो: ${result.error}`,
          type: 'error'
        });
      }
    } catch (err) {
      console.error("Critical error during seeding:", err);
      setSeeding(false);
      setAlertInfo({
        show: true,
        title: "क्रिटिकल त्रुटि!",
        message: `क्रिटिकल त्रुटि: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error'
      });
    }
  };

  useEffect(() => {
    const isStaff = user && [
      'super_admin', 'admin', 'editorial_admin', 'chief_editor', 'senior_editor', 
      'editor', 'reporter', 'contributor', 'researcher', 'moderator', 'analyst'
    ].includes(user.role);
    if (authLoading || !user || !isStaff) return;

    const fetchAdminData = async () => {
      setPendingSyncCount(offlineQueue.getPendingCount());
      try {
        const q = query(
          collection(db, "articles"), 
          orderBy("createdAt", "desc"), 
          limit(recentLimit)
        );
        const snapshot = await getDocsWithCacheFallback(q);
        const allRecent = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
        setRecentArticles(allRecent);
        
        let views = 0;
        let drafts = 0;
        let reviews = 0;
        let published = 0;
        allRecent.forEach(a => {
          views += a.views || 0;
          if (a.status === "draft") drafts++;
          if (a.status === "under_review") reviews++;
          if (!a.status || a.status === "published") published++;
        });
        setStats(prev => ({ ...prev, totalViews: views, publishedCount: published, pendingDrafts: drafts, reviewCount: reviews }));
        
        const msgSnapshot = await getDocsWithCacheFallback(collection(db, "contactMessages"));
        const newCount = msgSnapshot.docs.filter(doc => doc.data().status === "new").length;
        setStats(prev => ({ ...prev, newMessages: newCount }));
      } catch (err) {
        console.error("Admin dashboard fetch error:", err);
      }
    };

    fetchAdminData();
    const interval = setInterval(fetchAdminData, limitedMode.refreshInterval);
    return () => clearInterval(interval);
  }, [user, authLoading, limitedMode.refreshInterval, recentLimit]);

  const handleQuickDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDraft.title) return;
    
    try {
      await addDoc(collection(db, "articles"), {
        ...quickDraft,
        content: "",
        excerpt: "",
        authorId: user?.uid,
        authorName: user?.displayName,
        status: "draft",
        featuredImage: resolveArticleImage({ title: quickDraft.title, category: quickDraft.category }),
        views: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setQuickDraft({ title: "", category: "politics" });
      alert("ड्राफ्ट सुरक्षित गरियो!");
    } catch (err) {
      console.error("Error saving draft:", err);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        {/* Modals */}
        <CategorySelectionModal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          onConfirm={confirmSeed}
          categories={dummyCategories as any}
        />

        <AIGeneratorModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onSuccess={(message) => {
            setAlertInfo({
              show: true,
              title: language === "en" ? "Success!" : "सफलता!",
              message: message,
              type: "success"
            });
          }}
        />

        <AlertModal
          isOpen={alertInfo.show}
          title={alertInfo.title}
          message={alertInfo.message}
          type={alertInfo.type}
          onClose={() => setAlertInfo(prev => ({ ...prev, show: false }))}
        />

        {/* Seeding Progress Overlay */}
        <AnimatePresence>
          {seeding && (
            <div className="fixed inset-0 z-[100000] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-card rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl flex flex-col gap-8 border border-border-theme"
              >
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <Database size={40} />
                </div>
                <div className="flex flex-col gap-2 text-center">
                  <h3 className="text-2xl font-black text-card-foreground uppercase tracking-tight">
                    {language === "en" ? "Seeding Database" : "डेटा सीडिङ हुँदैछ"}
                  </h3>
                  <p className="text-sm font-medium text-muted-text leading-relaxed">{seedMessage}</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="h-4 w-full bg-muted rounded-full overflow-hidden border-4 border-muted/50">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${seedProgress}%` }}
                      transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xxs font-black uppercase tracking-widest text-muted-text">
                      {language === "en" ? "Progress" : "प्रगति"}
                    </span>
                    <span className="text-sm font-black text-primary font-mono">{Math.round(seedProgress)}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                  <p className="text-xxs font-bold text-orange-700 uppercase tracking-wider leading-tight">
                    {language === "en" 
                      ? "Please do not close this window. System is generating content." 
                      : "कृपया यो विन्डो बन्द नगर्नुहोस्। एआईले सामग्री सिर्जना गर्दैछ।"}
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12 mt-12 lg:mt-0">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl lg:text-3xl font-black text-card-foreground tracking-tight">
              {language === "en" ? `Welcome, ${user?.displayName || "Editor"}!` : `नमस्ते, ${user?.displayName || "सम्पादक"}!`}
            </h1>
            <p className="text-sm font-medium text-muted-text">
              {language === "en" ? "Here are today's editorial updates and analytics." : "आजको समाचार र अपडेटहरू यहाँ छन्।"}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 lg:gap-6">
            <div className="relative hidden xl:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" size={18} />
              <input 
                type="text" 
                placeholder={t("searchPlaceholder", "खोज्नुहोस्...")} 
                className="bg-card border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium shadow-sm focus:ring-2 focus:ring-primary/20 outline-none w-64 transition-all text-card-foreground placeholder:text-muted-text/50"
              />
            </div>
            <NotificationBell />
            <button 
              onClick={handleSeed}
              disabled={seeding}
              className="bg-muted text-card-foreground px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-bold text-xs lg:text-sm flex items-center gap-2 hover:bg-muted/80 transition-all disabled:opacity-50 border border-border-theme/50"
            >
              <Database size={20} /> <span className="hidden sm:inline">{seeding ? (language === "en" ? "Seeding..." : "सीडिङ...") : (language === "en" ? "Seed Data" : "डमी डेटा")}</span>
            </button>
            <button 
              onClick={() => setIsAIModalOpen(true)}
              className="bg-purple-600 text-white px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-bold text-xs lg:text-sm flex items-center gap-2 shadow-lg shadow-purple-600/20 hover:scale-105 transition-transform animate-pulse"
            >
              <Sparkles size={20} /> <span>{language === "en" ? "AI News Creator" : "AI समाचार सिर्जना"}</span>
            </button>
            <Link to="/admin/editor" className="bg-primary text-white px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-bold text-xs lg:text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              <Plus size={20} /> {language === "en" ? "New Article" : "नयाँ समाचार"}
            </Link>
          </div>
        </header>

        {/* Snapshot OS Coverage Health Score & Resilience Diagnostic */}
        <SnapshotCoverageDashboard />

        {/* Snapshot & CRUD Data Flow Trace (0-Read Pipeline) */}
        <SnapshotTraceDashboard />

        {/* Resilience & Quota Warning */}
        {limitedMode.isActive && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-red-500/10 border border-red-500/30 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-red-600 dark:text-red-400 uppercase tracking-tight">
                  {language === "en" ? "Limited Mode Active (Quota Safe)" : "सीमित मोड सक्रिय (Limited Mode)"}
                </h3>
                <p className="text-xs font-bold text-red-500/70">
                  {language === "en" 
                    ? "Read quota exhausted. Operating on snapshot cache and local resilience mode." 
                    : "कोटा सकिएको छ। प्रणाली अहिले सुरक्षित मोडमा चलिरहेको छ।"}
                </p>
              </div>
            </div>
            <Link to="/admin/health" className="px-6 py-2 bg-red-500 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all">
              {language === "en" ? "View Health Status" : "स्वास्थ्य विवरण हेर्नुहोस्"}
            </Link>
          </motion.div>
        )}

        {limitedMode.isWarning && !limitedMode.isActive && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-amber-500/10 border border-amber-500/30 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight">
                  {language === "en" ? "Quota Warning" : "कोटा चेतावनी (Quota Warning)"}
                </h3>
                <p className="text-xs font-bold text-amber-500/70">
                  {language === "en" 
                    ? "Read quota threshold reached. Articles are securely preserved via snapshot cache." 
                    : "आजको डाटा रिड सीमा नजिक छ। नयाँ समाचारहरू सुरक्षित रूपमा सुरक्षित हुनेछन्।"}
                </p>
              </div>
            </div>
            <Link to="/admin/health" className="px-6 py-2 bg-amber-500 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-amber-600 transition-all">
              {language === "en" ? "View Details" : "विवरण हेर्नुहोस्"}
            </Link>
          </motion.div>
        )}

        {/* Sync Status Card if pending */}
        {pendingSyncCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-6 bg-primary/5 border border-primary/20 rounded-[2rem] flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 animate-pulse">
                <RefreshCw size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-primary uppercase tracking-tight">
                  {language === "en" ? "Sync Pending" : "सिंक पेन्डिङ छ"}
                </h3>
                <p className="text-xs font-bold text-muted-text">
                  {language === "en" 
                    ? `${pendingSyncCount} editorial actions pending sync.` 
                    : `${pendingSyncCount} वटा कार्यहरू सिंक हुन बाँकी छन्।`}
                </p>
              </div>
            </div>
            <button 
              onClick={async () => {
                toast.info(language === "en" ? "Sync starting..." : "सिंक सुरु हुँदैछ...");
                await offlineQueue.sync();
                setPendingSyncCount(offlineQueue.getPendingCount());
              }}
              className="px-6 py-2 bg-primary text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
            >
              {language === "en" ? "Sync Now" : "सिंक गर्नुहोस्"}
            </button>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-8 mb-12">
          <div className="bg-card p-6 lg:p-8 rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-border-theme flex flex-col gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-500/10 text-blue-500 rounded-xl lg:rounded-2xl flex items-center justify-center">
              <Eye size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl lg:text-3xl font-black text-card-foreground">
                {language === "en" ? (stats.totalViews).toLocaleString() : (stats.totalViews).toLocaleString('ne-NP')}
              </span>
              <span className="text-xxs font-bold text-muted-text uppercase tracking-widest">
                {language === "en" ? "Total Article Views" : "हालका लेख भ्युज"}
              </span>
            </div>
          </div>
          <div className="bg-card p-6 lg:p-8 rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-border-theme flex flex-col gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-500/10 text-green-500 rounded-xl lg:rounded-2xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl lg:text-3xl font-black text-card-foreground">
                {language === "en" ? (stats.publishedCount).toLocaleString() : (stats.publishedCount).toLocaleString('ne-NP')}
              </span>
              <span className="text-xxs font-bold text-muted-text uppercase tracking-widest">
                {language === "en" ? "Published Articles" : "प्रकाशित लेखहरू"}
              </span>
            </div>
          </div>
          <div className="bg-card p-6 lg:p-8 rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-border-theme flex flex-col gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-500/10 text-purple-500 rounded-xl lg:rounded-2xl flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl lg:text-3xl font-black text-card-foreground">
                {language === "en" ? (stats.reviewCount).toLocaleString() : (stats.reviewCount).toLocaleString('ne-NP')}
              </span>
              <span className="text-xxs font-bold text-muted-text uppercase tracking-widest">
                {language === "en" ? "Under Review" : "समीक्षा बाँकी"}
              </span>
            </div>
          </div>
          <div className="bg-card p-6 lg:p-8 rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-border-theme flex flex-col gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-amber-500/10 text-amber-500 rounded-xl lg:rounded-2xl flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl lg:text-3xl font-black text-card-foreground">
                {language === "en" ? (stats.pendingDrafts).toLocaleString() : (stats.pendingDrafts).toLocaleString('ne-NP')}
              </span>
              <span className="text-xxs font-bold text-muted-text uppercase tracking-widest">
                {language === "en" ? "Pending Drafts" : "पेन्डिङ ड्राफ्ट"}
              </span>
            </div>
          </div>
          <div className="bg-card p-6 lg:p-8 rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-border-theme flex flex-col gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-500/10 text-red-500 rounded-xl lg:rounded-2xl flex items-center justify-center">
              <Mail size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl lg:text-3xl font-black text-card-foreground">
                {language === "en" ? (stats.newMessages).toLocaleString() : (stats.newMessages).toLocaleString('ne-NP')}
              </span>
              <span className="text-xxs font-bold text-muted-text uppercase tracking-widest">
                {language === "en" ? "New Messages" : "नयाँ सन्देश"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Articles */}
          <div className="lg:col-span-8 bg-card rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-border-theme p-6 lg:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <h3 className="text-lg lg:text-xl font-black text-card-foreground uppercase tracking-tight">
                  {language === "en" ? "Recent Publications" : "हालै प्रकाशित सामाग्री"}
                </h3>
                
                {/* Select dropdown */}
                <select
                  value={recentLimit}
                  onChange={(e) => setRecentLimit(Number(e.target.value) as any)}
                  className="bg-muted-area border border-border-theme rounded-xl px-2.5 py-1 text-xs font-black text-primary focus:outline-none cursor-pointer"
                >
                  <option value={10}>{language === "en" ? "Latest 10" : "नवीनतम १०"}</option>
                  <option value={25}>{language === "en" ? "Latest 25" : "नवीनतम २५"}</option>
                  <option value={50}>{language === "en" ? "Latest 50" : "नवीनतम ५०"}</option>
                  <option value={100}>{language === "en" ? "Latest 100" : "नवीनतम १००"}</option>
                </select>
              </div>
              <Link to="/admin/articles" className="text-primary text-sm font-bold hover:underline">
                {language === "en" ? "View All" : "सबै हेर्नुहोस्"}
              </Link>
            </div>
            <div className="flex flex-col gap-4 lg:gap-6">
              {recentArticles.map((article) => (
                <div key={article.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-border-theme/30 last:border-0 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl flex-shrink-0 overflow-hidden shadow-md">
                      <img src={article.featuredImage || null} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h4 className="text-sm font-bold text-card-foreground line-clamp-1">{getLocalized(article, 'title')}</h4>
                      <div className="flex items-center gap-3 text-xxs font-bold text-muted-text uppercase tracking-widest">
                        <span className="text-primary font-black">{getCategoryDisplayName(article.categoryId, language === "en" ? "en" : "ne")}</span>
                        <span>•</span>
                        <span>{formatDate(article.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className={`px-3 py-1 rounded-full text-xxs font-black uppercase tracking-widest ${
                      article.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {article.status === 'published' ? (language === "en" ? "Published" : "प्रकाशित") : (language === "en" ? "Draft" : "ड्राफ्ट")}
                    </span>
                    <Link to={`/admin/editor/${article.id}`} className="p-2 text-muted-text hover:text-primary transition-all">
                      <FileText size={18} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Draft Widget */}
          <div className="lg:col-span-4 flex flex-col gap-6 lg:gap-8">
            <div className="bg-slate-900 p-6 lg:p-10 rounded-3xl lg:rounded-[2.5rem] shadow-2xl flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <Send size={24} className="text-primary" />
                <h3 className="text-lg lg:text-xl font-black uppercase tracking-tight text-white">
                  {language === "en" ? "Quick Draft" : "क्विक ड्राफ्ट"}
                </h3>
              </div>
              <form onSubmit={handleQuickDraft} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">
                    {t("title", "शीर्षक")}
                  </label>
                  <input 
                    type="text" 
                    value={quickDraft.title}
                    onChange={(e) => setQuickDraft({ ...quickDraft, title: e.target.value })}
                    placeholder={language === "en" ? "Article title..." : "समाचारको शीर्षक..."} 
                    className="w-full bg-white/10 border-none rounded-xl lg:rounded-2xl py-3 lg:py-4 px-4 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">
                    {t("category", "विधा")}
                  </label>
                  <select 
                    value={quickDraft.category}
                    onChange={(e) => setQuickDraft({ ...quickDraft, category: e.target.value })}
                    className="w-full bg-white/10 border-none rounded-xl lg:rounded-2xl py-3 lg:py-4 px-4 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                  >
                    <option value="politics" className="bg-slate-900">{language === "en" ? "Politics" : "राजनीति"}</option>
                    <option value="desh" className="bg-slate-900">{language === "en" ? "National" : "देश"}</option>
                    <option value="sports" className="bg-slate-900">{language === "en" ? "Sports" : "खेलकुद"}</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-primary text-white py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 mt-2"
                >
                  {language === "en" ? "Save Draft" : "ड्राफ्ट सुरक्षित गर्नुहोस्"}
                </button>
              </form>
            </div>

            <div className="bg-card p-6 lg:p-10 rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-border-theme flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle size={24} className="text-primary" />
                  <h3 className="text-lg lg:text-xl font-black text-card-foreground uppercase tracking-tight">
                    {t("notifications", "सूचना")}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setAnnForm({ id: "", title: "", content: "", type: "info", published: true, isPinned: false });
                    setShowAnnModal(true);
                  }}
                  className="flex items-center gap-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl hover:bg-primary/90 transition-all shadow-sm"
                >
                  <Plus size={12} /> {language === "en" ? "Add" : "थप्नुहोस्"}
                </button>
              </div>

              <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-1">
                {announcements.length === 0 ? (
                  <div className="p-4 bg-muted-area rounded-2xl border border-border-theme text-center">
                    <p className="text-xs font-bold text-muted-text">
                      {language === "en" ? "No announcements yet." : "कुनै सूचना उपलब्ध छैन।"}
                    </p>
                  </div>
                ) : (
                  announcements.map((ann) => (
                    <div key={ann.id} className="p-4 bg-muted-area rounded-2xl border border-border-theme flex flex-col gap-2 relative group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-md leading-none ${
                            ann.type === "critical" ? "bg-red-500 text-white" : "bg-primary text-white"
                          }`}>
                            {ann.type === "critical" ? (language === "en" ? "Critical" : "आपतकालीन") : (language === "en" ? "Update" : "नयाँ अपडेट")}
                          </span>
                          {!ann.published && (
                            <span className="text-[9px] font-black bg-slate-500 text-white px-1.5 py-0.5 rounded-md leading-none uppercase tracking-widest">
                              {language === "en" ? "Draft" : "ड्राफ्ट"}
                            </span>
                          )}
                          {ann.isPinned && (
                            <span className="text-[9px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded-md leading-none uppercase tracking-widest">
                              {language === "en" ? "Pinned" : "पिन गरिएको"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => handleTogglePublish(ann)}
                            className="text-[9px] font-black text-primary hover:underline"
                            title={ann.published ? "Archive" : "Publish"}
                          >
                            {ann.published ? (language === "en" ? "Archive" : "अभिलेख") : (language === "en" ? "Publish" : "प्रकाशित")}
                          </button>
                          <span className="text-muted-text text-[9px]">•</span>
                          <button
                            onClick={() => {
                              setAnnForm({
                                id: ann.id,
                                title: ann.title,
                                content: ann.content,
                                type: ann.type,
                                published: ann.published,
                                isPinned: ann.isPinned || false
                              });
                              setShowAnnModal(true);
                            }}
                            className="text-[9px] font-black text-card-foreground hover:text-primary"
                          >
                            {t("edit", "सम्पादन")}
                          </button>
                          <span className="text-muted-text text-[9px]">•</span>
                          <button
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            className="text-[9px] font-black text-red-500 hover:underline"
                          >
                            {t("delete", "हटाउनुहोस्")}
                          </button>
                        </div>
                      </div>
                      <h4 className="text-xs font-black text-card-foreground leading-snug">{ann.title}</h4>
                      <p className="text-[11px] font-medium text-muted-text leading-relaxed">
                        {ann.content}
                      </p>
                      <span className="text-[9px] font-bold text-muted-text self-end mt-1">
                        {ann.createdBy} • {formatDate(ann.createdAt || ann.updatedAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Announcement Creation/Edition Modal */}
      {showAnnModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border-theme rounded-3xl p-6 lg:p-8 max-w-md w-full shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight">
              {annForm.id 
                ? (language === "en" ? "Edit Announcement" : "सूचना सम्पादन गर्नुहोस्") 
                : (language === "en" ? "Add Announcement" : "नयाँ सूचना थप्नुहोस्")}
            </h3>
            <form onSubmit={handleSaveAnnouncement} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">
                  {language === "en" ? "Subject / Title" : "विषय / शीर्षक"}
                </label>
                <input
                  type="text"
                  value={annForm.title}
                  onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                  placeholder={language === "en" ? "Announcement subject..." : "सूचनाको मुख्य विषय..."}
                  className="w-full bg-muted-area border border-border-theme rounded-xl py-3 px-4 text-sm font-semibold text-card-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">
                  {language === "en" ? "Full Description" : "पूर्ण विवरण"}
                </label>
                <textarea
                  value={annForm.content}
                  onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                  placeholder={language === "en" ? "Enter detailed announcement details here..." : "सूचनाको विस्तृत जानकारी यहाँ राख्नुहोस्..."}
                  rows={4}
                  className="w-full bg-muted-area border border-border-theme rounded-xl py-3 px-4 text-sm font-semibold text-card-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xxs font-black text-muted-text uppercase tracking-widest">
                    {language === "en" ? "Type" : "प्रकार"}
                  </label>
                  <select
                    value={annForm.type}
                    onChange={(e) => setAnnForm({ ...annForm, type: e.target.value as any })}
                    className="w-full bg-muted-area border border-border-theme rounded-xl py-3 px-4 text-sm font-semibold text-card-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                  >
                    <option value="info">{language === "en" ? "Info" : "सामान्य (Info)"}</option>
                    <option value="success">{language === "en" ? "Success" : "सफलता (Success)"}</option>
                    <option value="warning">{language === "en" ? "Warning" : "सचेत (Warning)"}</option>
                    <option value="critical">{language === "en" ? "Critical" : "आपतकालीन (Critical)"}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xxs font-black text-muted-text uppercase tracking-widest">
                    {language === "en" ? "Status" : "स्थिति"}
                  </label>
                  <select
                    value={annForm.published ? "published" : "draft"}
                    onChange={(e) => setAnnForm({ ...annForm, published: e.target.value === "published" })}
                    className="w-full bg-muted-area border border-border-theme rounded-xl py-3 px-4 text-sm font-semibold text-card-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                  >
                    <option value="published">{language === "en" ? "Live" : "प्रकाशित (Live)"}</option>
                    <option value="draft">{language === "en" ? "Draft" : "मस्यौदा (Draft)"}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={annForm.isPinned}
                  onChange={(e) => setAnnForm({ ...annForm, isPinned: e.target.checked })}
                  className="rounded border-border-theme text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="isPinned" className="text-xs font-bold text-card-foreground cursor-pointer select-none">
                  {language === "en" ? "Pin to top" : "यो सूचना माथि पिन गर्नुहोस् (Pin to top)"}
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAnnModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-border-theme text-xs font-black text-muted-text hover:bg-muted-area transition-all"
                >
                  {t("cancel", "रद्द गर्नुहोस्")}
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-primary/90 transition-all"
                >
                  {t("save", "सुरक्षित गर्नुहोस्")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
