import { useState, useEffect } from "react";
import { 
  Languages, Globe, Sparkles, CheckCircle2, AlertTriangle, Search, 
  RefreshCw, Loader2, Edit3, ArrowRight, BookOpen, Layers, Check, ShieldCheck
} from "lucide-react";
import { collection, query, orderBy, getDocs, doc, updateDoc, limit, where } from "@/src/lib/firebase";
import { db, getDocsWithCacheFallback } from "@/src/lib/firebase";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { useAuth } from "@/src/lib/auth";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { translateArticleToEnglish } from "@/src/services/translationService";
import type { Article } from "@/src/types";
import { toast } from "sonner";

export default function AdminTranslationDashboard() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'missing' | 'translated'>('missing');
  const [searchQuery, setSearchQuery] = useState('');
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [batchTranslating, setBatchTranslating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Selected article for side-by-side editing
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [editForm, setEditForm] = useState({
    title_en: '',
    excerpt_en: '',
    content_en: '',
    seoHeadline_en: '',
    seoDescription_en: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "articles"),
        orderBy("createdAt", "desc"),
        limit(150)
      );
      const snap = await getDocsWithCacheFallback(q);
      let items: Article[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Article));

      if (items.length === 0) {
        try {
          const hpSnap = await snapshotEngine.getHomepageSnapshot();
          const snapshotArticlesMap = new Map<string, Article>();
          
          const addIfNew = (list: Article[]) => {
            (list || []).forEach(a => {
              if (a && (a.id || (a as any).slug)) {
                const key = a.id || (a as any).slug;
                snapshotArticlesMap.set(key, { ...a, id: key });
              }
            });
          };

          addIfNew(hpSnap.featuredArticles);
          addIfNew(hpSnap.latestNews);
          addIfNew(hpSnap.trendingNews);
          addIfNew(hpSnap.breakingNews || []);
          addIfNew(hpSnap.videoNews);
          
          if (hpSnap.categoryArticles) {
            Object.values(hpSnap.categoryArticles).forEach(list => {
              addIfNew(list);
            });
          }

          items = Array.from(snapshotArticlesMap.values());
        } catch (snapErr) {
          console.warn("Could not load backup articles from snapshot:", snapErr);
        }
      }

      setArticles(items);
    } catch (err) {
      console.error("Error fetching articles for translation dashboard:", err);
      toast.error("समाचार सूची लोड गर्न सकिएन");
    } finally {
      setLoading(false);
    }
  };

  const handleSingleTranslate = async (article: Article) => {
    setTranslatingId(article.id);
    try {
      const res = await translateArticleToEnglish({
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        seoHeadline: article.seoHeadline || article.title,
        seoDescription: article.seoDescription || article.excerpt,
        socialHook: article.socialHook
      });

      const docRef = doc(db, "articles", article.id);
      await updateDoc(docRef, {
        title_en: res.title_en,
        excerpt_en: res.excerpt_en,
        content_en: res.content_en,
        seoHeadline_en: res.seoHeadline_en,
        seoDescription_en: res.seoDescription_en,
        socialHook_en: res.socialHook_en,
        updatedAt: new Date().toISOString()
      });

      // Local state update
      setArticles(prev => prev.map(a => a.id === article.id ? {
        ...a,
        ...res
      } : a));

      if (selectedArticle?.id === article.id) {
        setEditForm({
          title_en: res.title_en,
          excerpt_en: res.excerpt_en,
          content_en: res.content_en,
          seoHeadline_en: res.seoHeadline_en,
          seoDescription_en: res.seoDescription_en
        });
      }

      toast.success(`"${article.title.substring(0, 20)}..." सफलतापूर्वक अंग्रेजीमा अनुवाद भयो!`);
    } catch (err: any) {
      console.error("Translation error:", err);
      toast.error(err.message || "अनुवाद प्रक्रिया असफल भयो");
    } finally {
      setTranslatingId(null);
    }
  };

  const handleBatchTranslate = async () => {
    const missingArticles = articles.filter(a => !a.title_en || a.title_en.trim().length === 0);
    if (missingArticles.length === 0) {
      toast.info("अनुवाद गर्न बाँकी कुनै पनि समाचार भेटिएन!");
      return;
    }

    setBatchTranslating(true);
    setBatchProgress({ current: 0, total: missingArticles.length });

    let successCount = 0;
    for (let i = 0; i < missingArticles.length; i++) {
      const art = missingArticles[i];
      setBatchProgress({ current: i + 1, total: missingArticles.length });
      try {
        const res = await translateArticleToEnglish({
          title: art.title,
          excerpt: art.excerpt,
          content: art.content,
          seoHeadline: art.seoHeadline || art.title,
          seoDescription: art.seoDescription || art.excerpt,
          socialHook: art.socialHook
        });

        await updateDoc(doc(db, "articles", art.id), {
          title_en: res.title_en,
          excerpt_en: res.excerpt_en,
          content_en: res.content_en,
          seoHeadline_en: res.seoHeadline_en,
          seoDescription_en: res.seoDescription_en,
          socialHook_en: res.socialHook_en,
          updatedAt: new Date().toISOString()
        });

        setArticles(prev => prev.map(a => a.id === art.id ? { ...a, ...res } : a));
        successCount++;
      } catch (err) {
        console.warn(`Failed batch translation for ${art.id}:`, err);
      }
    }

    setBatchTranslating(false);
    toast.success(`अटो-अनुवाद सम्पन्न! ${successCount}/${missingArticles.length} समाचार अनुवाद गरिए।`);
  };

  const handleOpenEdit = (article: Article) => {
    setSelectedArticle(article);
    setEditForm({
      title_en: article.title_en || '',
      excerpt_en: article.excerpt_en || '',
      content_en: article.content_en || '',
      seoHeadline_en: article.seoHeadline_en || article.title_en || '',
      seoDescription_en: article.seoDescription_en || article.excerpt_en || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedArticle) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "articles", selectedArticle.id), {
        ...editForm,
        updatedAt: new Date().toISOString()
      });

      setArticles(prev => prev.map(a => a.id === selectedArticle.id ? { ...a, ...editForm } : a));
      toast.success("अंग्रेजी संस्करण सुरक्षित गरियो!");
      setSelectedArticle(null);
    } catch (err) {
      console.error("Save edit error:", err);
      toast.error("सुरक्षित गर्न सकिएन");
    } finally {
      setIsSaving(false);
    }
  };

  const totalArticles = articles.length;
  const translatedArticles = articles.filter(a => a.title_en && a.title_en.trim().length > 0);
  const missingArticles = articles.filter(a => !a.title_en || a.title_en.trim().length === 0);
  const coveragePercent = totalArticles > 0 ? Math.round((translatedArticles.length / totalArticles) * 100) : 0;

  const filteredList = articles.filter(a => {
    const isTranslated = !!(a.title_en && a.title_en.trim().length > 0);
    if (filter === 'missing' && isTranslated) return false;
    if (filter === 'translated' && !isTranslated) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNe = a.title.toLowerCase().includes(q) || (a.excerpt && a.excerpt.toLowerCase().includes(q));
      const matchEn = a.title_en && a.title_en.toLowerCase().includes(q);
      return matchNe || matchEn;
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-primary p-8 text-white shadow-xl">
          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 font-bold text-xs uppercase tracking-widest border border-white/15">
              <Languages size={14} /> Dual-Language Architecture V1.0
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-serif tracking-tight leading-tight">
              नेपाली ↔ English द्वैध-भाषा समाचार हब
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              स्न्यापसट आर्किटेक्चर र Firestore कोटा बचतलाई कायम राख्दै उच्च-गुणस्तरीय AI अनुवाद प्रणाली। पाठकहरूका लागि zero-latency मा नेपाली र अंग्रेजी स्विच।
            </p>
          </div>
          <Globe className="absolute -right-8 -bottom-8 w-64 h-64 text-white/5 pointer-events-none" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl bg-card border border-border-theme shadow-sm space-y-2">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              कुल प्रकाशित समाचार
              <BookOpen size={16} className="text-primary" />
            </div>
            <div className="text-3xl font-black">{totalArticles}</div>
            <div className="text-xxs text-muted-foreground">नेपाली मूल स्रोतहरू</div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border-theme shadow-sm space-y-2">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              अंग्रेजी अनुवाद कभरेज
              <Globe size={16} className="text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{coveragePercent}%</div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${coveragePercent}%` }} />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border-theme shadow-sm space-y-2">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              अंग्रेजी अनुवाद बाँकी
              <AlertTriangle size={16} className="text-amber-500" />
            </div>
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400">{missingArticles.length}</div>
            <div className="text-xxs text-amber-600/80 dark:text-amber-400/80">AI बाट स्वचालित अनुवाद सम्भव</div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border-theme shadow-sm space-y-2">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              पूर्ण अनुवादित
              <ShieldCheck size={16} className="text-blue-500" />
            </div>
            <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{translatedArticles.length}</div>
            <div className="text-xxs text-blue-600/80 dark:text-blue-400/80">Dual Snapshot तयार</div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border-theme">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setFilter('missing')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                filter === 'missing' 
                  ? 'bg-amber-500 text-white shadow-md' 
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              <AlertTriangle size={14} /> अनुवाद बाँकी ({missingArticles.length})
            </button>
            <button
              onClick={() => setFilter('translated')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                filter === 'translated' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              <CheckCircle2 size={14} /> पूर्ण अनुवादित ({translatedArticles.length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                filter === 'all' 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              <Layers size={14} /> सबै ({totalArticles})
            </button>
          </div>

          {/* Search Input & Batch Action */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="समाचार खोज्नुहोस्..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-border-theme bg-background text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <button
              onClick={handleBatchTranslate}
              disabled={batchTranslating || missingArticles.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shrink-0 transition-all"
            >
              {batchTranslating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  अनुवाद गरिँदै ({batchProgress.current}/{batchProgress.total})...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  सबै बाँकी (Batch AI Translate)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Articles Table / List */}
        <div className="bg-card rounded-2xl border border-border-theme overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <Loader2 size={28} className="animate-spin text-primary mx-auto" />
              <p className="text-xs font-bold text-muted-foreground">समाचार डेटाबेस लोड हुँदैछ...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Globe size={32} className="text-muted-foreground/50 mx-auto" />
              <p className="text-sm font-bold text-muted-foreground">कुनै पनि समाचार भेटिएन</p>
            </div>
          ) : (
            <div className="divide-y divide-border-theme">
              {filteredList.map((article) => {
                const isTranslated = !!(article.title_en && article.title_en.trim().length > 0);
                const isTranslating = translatingId === article.id;

                return (
                  <div key={article.id} className="p-5 hover:bg-muted/30 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 max-w-3xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isTranslated ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold text-xxs flex items-center gap-1">
                            <CheckCircle2 size={12} /> English Available
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 font-bold text-xxs flex items-center gap-1">
                            <AlertTriangle size={12} /> Needs Translation
                          </span>
                        )}
                        <span className="text-xxs font-semibold text-muted-foreground">
                          {article.categoryName || article.categoryId}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm sm:text-base leading-snug line-clamp-1">
                        🇳🇵 {article.title}
                      </h3>

                      {isTranslated ? (
                        <p className="text-xs text-muted-foreground italic font-medium line-clamp-1">
                          🇬🇧 {article.title_en}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {article.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                      <button
                        onClick={() => handleOpenEdit(article)}
                        className="px-3.5 py-2 rounded-xl border border-border-theme hover:bg-muted font-bold text-xs flex items-center gap-1.5 transition-all"
                      >
                        <Edit3 size={14} />
                        {isTranslated ? 'सम्पादन / Review' : 'Side-by-Side'}
                      </button>

                      <button
                        onClick={() => handleSingleTranslate(article)}
                        disabled={isTranslating}
                        className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        {isTranslating ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            अनुवाद हुँदैछ...
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            {isTranslated ? 'पुनः अनुवाद (Re-Translate)' : 'AI Translate'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side-by-Side Dual Language Modal */}
        {selectedArticle && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="bg-card w-full max-w-5xl rounded-3xl border border-border-theme shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-border-theme flex items-center justify-between bg-muted/40">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Languages size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-base sm:text-lg">द्वैध-भाषा सम्पादन (Side-by-Side Dual Language Editor)</h2>
                    <p className="text-xs text-muted-foreground">नेपाली स्रोत सन्दर्भ र अंग्रेजी अनुवाद सम्पादन</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Nepali Source */}
                <div className="space-y-4 p-5 rounded-2xl bg-muted/20 border border-border-theme">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                      🇳🇵 नेपाली मूल (Read-Only)
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xxs font-bold text-muted-foreground uppercase">शीर्षक (Title)</label>
                    <div className="p-3 rounded-xl bg-background border border-border-theme font-bold text-sm">
                      {selectedArticle.title}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xxs font-bold text-muted-foreground uppercase">सारांश (Excerpt)</label>
                    <div className="p-3 rounded-xl bg-background border border-border-theme text-xs leading-relaxed">
                      {selectedArticle.excerpt}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xxs font-bold text-muted-foreground uppercase">मुख्य समाचार सामग्री (HTML Body)</label>
                    <div 
                      className="p-3 rounded-xl bg-background border border-border-theme text-xs leading-relaxed max-h-60 overflow-y-auto prose dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                    />
                  </div>
                </div>

                {/* Right Column: English Translation */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      🇬🇧 English Version (Editable)
                    </span>
                    <button
                      onClick={() => handleSingleTranslate(selectedArticle)}
                      disabled={translatingId === selectedArticle.id}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Sparkles size={12} /> Auto AI Translate
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xxs font-bold text-muted-foreground uppercase">English Title</label>
                    <input
                      type="text"
                      value={editForm.title_en}
                      onChange={e => setEditForm({ ...editForm, title_en: e.target.value })}
                      placeholder="e.g. Pashupatinath Temple Special Puja Completed..."
                      className="w-full p-3 rounded-xl border border-border-theme bg-background font-bold text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xxs font-bold text-muted-foreground uppercase">English Excerpt</label>
                    <textarea
                      rows={3}
                      value={editForm.excerpt_en}
                      onChange={e => setEditForm({ ...editForm, excerpt_en: e.target.value })}
                      placeholder="English summary..."
                      className="w-full p-3 rounded-xl border border-border-theme bg-background text-xs outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xxs font-bold text-muted-foreground uppercase">English Article Body (HTML)</label>
                    <textarea
                      rows={8}
                      value={editForm.content_en}
                      onChange={e => setEditForm({ ...editForm, content_en: e.target.value })}
                      placeholder="<p>Article body in English...</p>"
                      className="w-full p-3 rounded-xl border border-border-theme bg-background text-xs font-mono outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-border-theme flex items-center justify-end gap-3 bg-muted/20">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-5 py-2.5 rounded-xl border border-border-theme font-bold text-xs hover:bg-muted transition-colors"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  सुरक्षित गर्नुहोस् (Save English)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
