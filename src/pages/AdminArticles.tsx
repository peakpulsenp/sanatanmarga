import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import NepaliInput from "@/src/components/ui/NepaliInput";
import { 
  Plus, Eye, Search, Edit, Trash2, ExternalLink, FileText, Sparkles, LayoutDashboard, Clock, ShieldCheck, ShieldAlert, CheckCircle, AlertTriangle, RotateCcw, Ban
} from "lucide-react";
import { collection, query, orderBy, getDocs, limit, doc, deleteDoc } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { offlineQueue, deleteDocWithQueue } from "@/src/lib/offlineQueue";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { resolveArticleImage } from "@/src/services/imageIntelligence";
import { useAuth } from "@/src/lib/auth";
import { formatDate } from "@/src/lib/utils";
import type { Article, ArticleStatus } from "@/src/types";
import AlertModal from "@/src/components/ui/AlertModal";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import AIGeneratorModal from "@/src/components/admin/AIGeneratorModal";
import { motion, AnimatePresence } from "motion/react";
import NotificationBell from "@/src/components/notifications/NotificationBell";
import { AdminSkeleton } from "@/src/components/ui/PageLoaders";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { useLanguage } from "@/src/context/LanguageContext";
import { contentEventBus } from "@/src/lib/contentEventBus";
import { getCategoryDisplayName } from "@/src/utils/categoryHelper";
import { newsStreamService } from "@/src/services/newsStreamService";

export default function AdminArticles() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'retracted' | 'all'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'queue'>('table');
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
  const [retractConfirm, setRetractConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
  const [alertInfo, setAlertInfo] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' }>({
    show: false,
    title: "",
    message: "",
    type: 'success'
  });

  const mergeArticles = (fetchedDocs: Article[]) => {
    const queuedItems = offlineQueue.getQueue().filter(
      op => op.action.collection === 'articles' || op.action.type === 'ARTICLE_CREATE'
    );

    const queuedArticles: Article[] = queuedItems.map(op => {
      const data = op.action.data || {};
      return {
        id: op.action.docId || op.id,
        title: data.title || "Untitled",
        content: data.content || "",
        excerpt: data.excerpt || "",
        categoryId: data.categoryId || "general",
        authorId: data.authorId || user?.uid || "",
        authorName: data.authorName || user?.displayName || "Admin",
        status: data.status || "draft",
        verificationStatus: data.verificationStatus || (data.sourceUrls?.length ? "verified" : "pending"),
        featuredImage: data.featuredImage || resolveArticleImage({ title: data.title, category: data.categoryId }),
        views: data.views || 0,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        isQueued: true,
        ...data
      } as Article;
    });

    const syncedItems = offlineQueue.getEventStore().filter(
      op => op.action.collection === 'articles' || op.action.type === 'ARTICLE_CREATE'
    );
    const syncedArticles: Article[] = syncedItems.map(op => {
      const data = op.action.data || {};
      return {
        id: op.action.docId || op.id,
        title: data.title || "Untitled",
        content: data.content || "",
        excerpt: data.excerpt || "",
        categoryId: data.categoryId || "general",
        authorId: data.authorId || user?.uid || "",
        authorName: data.authorName || user?.displayName || "Admin",
        status: data.status || "draft",
        verificationStatus: data.verificationStatus || (data.sourceUrls?.length ? "verified" : "pending"),
        featuredImage: data.featuredImage || resolveArticleImage({ title: data.title, category: data.categoryId }),
        views: data.views || 0,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        ...data
      } as Article;
    });

    const dynamicArticles = snapshotEngine.getDynamicArticles();
    const combined = [...queuedArticles, ...syncedArticles, ...dynamicArticles, ...fetchedDocs];
    const seenIds = new Set<string>();
    const seenTitles = new Map<string, number>();
    const unique: Article[] = [];

    for (const item of combined) {
      if (!item.id && !item.title) continue;
      const idKey = item.id;
      const normTitle = item.title ? item.title.trim().toLowerCase() : "";

      if (idKey && seenIds.has(idKey)) continue;

      if (normTitle && normTitle.length > 3 && seenTitles.has(normTitle)) {
        const existingIndex = seenTitles.get(normTitle)!;
        const existing = unique[existingIndex];
        const isExistingTemp = existing.id?.startsWith('temp_') || existing.id?.startsWith('queued_');
        const isNewTemp = item.id?.startsWith('temp_') || item.id?.startsWith('queued_');

        if (isExistingTemp && !isNewTemp) {
          unique[existingIndex] = item;
          if (idKey) seenIds.add(idKey);
        }
        continue;
      }

      if (idKey) seenIds.add(idKey);
      if (normTitle && normTitle.length > 3) {
        seenTitles.set(normTitle, unique.length);
      }
      unique.push(item);
    }

    if (unique.length === 0) {
      setArticles([]);
    } else {
      unique.sort((a, b) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime());
      setArticles(unique);
    }
  };

  useEffect(() => {
    const isStaff = user && ['super_admin', 'admin', 'chief_editor', 'editor'].includes(user.role);
    if (authLoading || !user || !isStaff) return;

    let isSubscribed = true;

    const loadArticles = async () => {
      try {
        const q = query(collection(db, "articles"), orderBy("createdAt", "desc"), limit(100));
        const snap = await getDocs(q);
        if (isSubscribed && snap.docs.length > 0) {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Article));
          mergeArticles(docs);
          return;
        }
      } catch (err) {}

      try {
        const snap2 = await getDocs(collection(db, "articles"));
        if (isSubscribed && snap2.docs.length > 0) {
          const docs = snap2.docs.map(d => ({ id: d.id, ...d.data() } as Article));
          mergeArticles(docs);
          return;
        }
      } catch (err) {}

      if (isSubscribed) {
        mergeArticles([]);
      }
    };

    loadArticles();

    return () => {
      isSubscribed = false;
    };
  }, [user, authLoading]);

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    const idToDelete = deleteConfirm.id;
    setArticles(prev => prev.filter(a => a.id !== idToDelete));
    setDeleteConfirm({ show: false, id: null });

    await deleteDocWithQueue(doc(db, "articles", idToDelete));

    setAlertInfo({
      show: true,
      title: language === "en" ? "Deleted" : "सफलता!",
      message: language === "en" ? "Article successfully removed and snapshot purged." : "समाचार सफलतापूर्वक हटाइयो।",
      type: 'success'
    });
  };

  const confirmRetract = async () => {
    if (!retractConfirm.id) return;
    const idToRetract = retractConfirm.id;
    await newsStreamService.retractArticle(
      idToRetract, 
      "Retracted by editorial desk", 
      user?.uid, 
      user?.displayName || "Editor"
    );

    setArticles(prev => prev.map(a => {
      if (a.id === idToRetract) {
        return {
          ...a,
          status: 'archived',
          editorialStatus: 'retracted'
        };
      }
      return a;
    }));

    setRetractConfirm({ show: false, id: null });
    setAlertInfo({
      show: true,
      title: language === "en" ? "Article Retracted" : "समाचार फिर्ता गरियो (Retracted)",
      message: language === "en" 
        ? "Article has been formally retracted and purged from all public feeds, Latest News, and Snapshot OS." 
        : "समाचार आधिकारिक रूपमा फिर्ता गरिएको छ र सम्पूर्ण सार्वजनिक फिडहरूबाट हटाइएको छ।",
      type: 'success'
    });
  };

  const filteredArticles = articles.filter(a => {
    const matchesSearch = !searchTerm.trim() || 
      (a.title && a.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.excerpt && a.excerpt.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.authorName && a.authorName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'retracted') return a.editorialStatus === 'retracted' || (a.status as string) === 'retracted';
    if (statusFilter === 'fact_checked') return a.status === 'fact_checked' || (a.status as string) === 'fact_check';
    return a.status === statusFilter;
  });

  const statusTabs: { id: ArticleStatus | 'retracted' | 'all'; label: string; count: number }[] = [
    { id: 'all', label: t("all"), count: articles.length },
    { id: 'draft', label: t("statusDraft"), count: articles.filter(a => a.status === 'draft').length },
    { id: 'under_review', label: t("statusUnderReview"), count: articles.filter(a => a.status === 'under_review').length },
    { id: 'fact_checked', label: t("statusFactChecked"), count: articles.filter(a => a.status === 'fact_checked' || (a.status as string) === 'fact_check').length },
    { id: 'approved', label: t("statusApproved"), count: articles.filter(a => a.status === 'approved').length },
    { id: 'published', label: t("statusPublished"), count: articles.filter(a => a.status === 'published' && a.editorialStatus !== 'retracted').length },
    { id: 'retracted', label: language === "en" ? "Retracted" : "फिर्ता (Retracted)", count: articles.filter(a => a.editorialStatus === 'retracted' || (a.status as string) === 'retracted').length },
    { id: 'archived', label: t("statusArchived"), count: articles.filter(a => a.status === 'archived' && a.editorialStatus !== 'retracted').length },
  ];

  if (authLoading) return <AdminSkeleton />;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <ConfirmModal
          isOpen={deleteConfirm.show}
          title={language === "en" ? "Delete Article" : "समाचार हटाउनुहोस्"}
          message={language === "en" ? "Are you sure you want to permanently delete this article?" : "के तपाईं यो समाचार हटाउन निश्चित हुनुहुन्छ?"}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm({ show: false, id: null })}
        />

        <ConfirmModal
          isOpen={retractConfirm.show}
          title={language === "en" ? "Retract Article" : "समाचार फिर्ता लिनुहोस् (Retract)"}
          message={language === "en" 
            ? "Are you sure you want to formally retract this publication? It will be instantly removed from all public feeds, search, and Latest News." 
            : "के तपाईं यो समाचार सार्वजनिक फिडहरूबाट फिर्ता लिन निश्चित हुनुहुन्छ? यो तुरुन्तै सार्वजनिक अवलोकनबाट हट्नेछ।"}
          onConfirm={confirmRetract}
          onCancel={() => setRetractConfirm({ show: false, id: null })}
        />

        <AlertModal
          isOpen={alertInfo.show}
          title={alertInfo.title}
          message={alertInfo.message}
          type={alertInfo.type}
          onClose={() => setAlertInfo(prev => ({ ...prev, show: false }))}
        />

        <AIGeneratorModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onSuccess={(message) => setAlertInfo({
            show: true,
            title: language === "en" ? "Success!" : "सफलता!",
            message,
            type: 'success'
          })}
        />

        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-4 lg:mt-0">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl lg:text-3xl font-black text-card-foreground tracking-tight uppercase flex items-center gap-3">
              <FileText className="text-primary" size={28} /> {t("news")} {t("adminDashboard")}
            </h1>
            <p className="text-xs font-medium text-muted-text">
              {t("newsroomIntegrity")} • {t("sourceRequired")}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text z-10" size={16} />
              <NepaliInput 
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(val) => setSearchTerm(val)}
                className="bg-card border border-border-theme rounded-2xl py-2 pl-9 pr-4 text-xs font-medium shadow-sm focus:ring-2 focus:ring-primary/20 outline-none w-56 text-card-foreground"
              />
            </div>
            <NotificationBell />
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsAIModalOpen(true)}
                className="bg-purple-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm shadow-purple-600/20 hover:bg-purple-700 transition-all"
              >
                <Sparkles size={16} /> <span>{language === "en" ? "AI News Creator" : "AI समाचार सिर्जना"}</span>
              </button>
              <Link to="/admin/editor" className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all">
                <Plus size={16} /> <span>{language === "en" ? "Create Article" : "नयाँ समाचार"}</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Status Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2 bg-muted/40 p-1.5 rounded-2xl overflow-x-auto flex-grow">
            {statusTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
                  statusFilter === tab.id 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-muted-text hover:text-card-foreground'
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-muted text-muted-text'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-card text-primary shadow-sm' : 'text-muted-text'}`}
              title="Table View"
            >
              <LayoutDashboard size={16} />
            </button>
            <button 
              onClick={() => setViewMode('queue')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'queue' ? 'bg-card text-primary shadow-sm' : 'text-muted-text'}`}
              title="Queue View"
            >
              <Clock size={16} />
            </button>
          </div>
        </div>

        {/* Articles Table */}
        <div className="bg-card rounded-2xl shadow-sm border border-border-theme overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-muted/40 border-b border-border-theme">
                  <th className="p-4 text-xs font-black text-muted-text uppercase tracking-widest">{t("news")}</th>
                  <th className="p-4 text-xs font-black text-muted-text uppercase tracking-widest">{t("category")}</th>
                  <th className="p-4 text-xs font-black text-muted-text uppercase tracking-widest">{t("verificationStatus")}</th>
                  <th className="p-4 text-xs font-black text-muted-text uppercase tracking-widest">{t("status")}</th>
                  <th className="p-4 text-xs font-black text-muted-text uppercase tracking-widest text-right">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme/40 text-xs">
                {filteredArticles.map((article) => {
                  const hasSources = (article.sourceUrls && article.sourceUrls.length > 0) || !!article.source;
                  const isVerified = article.verificationStatus === "verified" || (hasSources && article.status === "published");

                  return (
                    <tr key={article.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                            <img src={article.featuredImage || null} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <Link to={`/admin/editor/${article.id}`} className="font-bold text-card-foreground hover:text-primary transition-colors line-clamp-1">
                              {article.title}
                            </Link>
                            <span className="text-[11px] text-muted-text">
                              {article.authorName || "Editor"} • {formatDate(article.updatedAt || article.createdAt)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-bold">
                        <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-black">
                          {getCategoryDisplayName(article.categoryId, language === "en" ? "en" : "ne")}
                        </span>
                      </td>
                      <td className="p-4">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <ShieldCheck size={12} /> {t("verified")}
                          </span>
                        ) : hasSources ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            <Clock size={12} /> {t("pendingVerification")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-500/10 text-red-600 border border-red-500/20">
                            <AlertTriangle size={12} /> {language === "en" ? "No Source" : "स्रोत छैन"}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          article.status === 'published' ? 'bg-emerald-500/10 text-emerald-600' :
                          article.status === 'approved' ? 'bg-blue-500/10 text-blue-600' :
                          article.status === 'under_review' ? 'bg-purple-500/10 text-purple-600' :
                          article.status === 'fact_checked' || article.status === 'fact_check' ? 'bg-indigo-500/10 text-indigo-600' :
                          article.status === 'archived' ? 'bg-slate-500/10 text-slate-600' :
                          'bg-amber-500/10 text-amber-600'
                        }`}>
                          {article.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/article/${article.id}`} target="_blank" className="p-1.5 hover:bg-muted text-muted-text rounded-lg" title={t("readMore")}>
                            <ExternalLink size={14} />
                          </Link>
                          <Link to={`/admin/editor/${article.id}`} className="p-1.5 hover:bg-muted text-primary rounded-lg" title={t("edit")}>
                            <Edit size={14} />
                          </Link>
                          {article.status === 'published' && article.editorialStatus !== 'retracted' && (
                            <button
                              onClick={() => setRetractConfirm({ show: true, id: article.id })}
                              className="p-1.5 hover:bg-amber-500/10 text-amber-600 rounded-lg transition-colors"
                              title={language === "en" ? "Retract Article" : "समाचार फिर्ता लिनुहोस्"}
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => setDeleteConfirm({ show: true, id: article.id })}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"
                            title={t("delete")}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
