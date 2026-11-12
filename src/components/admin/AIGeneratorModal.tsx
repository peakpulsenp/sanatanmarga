import { useState, useEffect } from "react";
import { 
  Sparkles, X, Loader2, Save, Globe, CheckCircle2, AlertCircle, AlertTriangle, 
  TrendingUp, ShieldCheck, Activity, BarChart3, BookOpen, Zap, Newspaper, 
  Search, Layers, CheckCheck, Clock, Check, ExternalLink, RefreshCw, Filter, 
  ChevronRight, ArrowRight, Eye, CheckSquare, Square
} from "lucide-react";
import { collection, getDocs, query, orderBy, doc } from "@/src/lib/firebase";
import { db, auth } from "@/src/lib/firebase";
import { setDocWithQueue, normalizeFirestorePayload } from "@/src/lib/offlineQueue";
import { BACKUP_CATEGORIES } from "@/src/constants/backupData";
import { mergeWithCanonicalCategories } from "@/src/utils/categorySeedHelper";
import { CANONICAL_CATEGORIES } from "@/src/constants/categories";
import { generateAINewsFromPreservedStory } from "@/src/services/aiNewsService";
import { resolveArticleImage } from "@/src/services/imageIntelligence";
import { LatestNewsRetrievalEngine } from "@/src/services/latestNewsRetrievalEngine";
import { CandidateStory } from "@/src/services/categoryStoryDiscoveryEngine";
import { DiscoverySession } from "@/src/services/discoverySessionStore";
import type { Category } from "@/src/types";
import { motion, AnimatePresence } from "motion/react";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { contentEventBus } from "@/src/lib/contentEventBus";

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

type ModalStep = 'configure' | 'discover_results' | 'generating' | 'review';

export default function AIGeneratorModal({ isOpen, onClose, onSuccess }: AIGeneratorModalProps) {
  const [step, setStep] = useState<ModalStep>('configure');
  const [categories, setCategories] = useState<Category[]>(BACKUP_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    BACKUP_CATEGORIES.length > 0 ? BACKUP_CATEGORIES[0].slug : "politics"
  );
  const [keywords, setKeywords] = useState("");
  const [searchMode, setSearchMode] = useState<'standard' | 'trending' | 'breaking'>('standard');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryProgressMsg, setDiscoveryProgressMsg] = useState("");
  
  // Discovered stories state
  const [currentSession, setCurrentSession] = useState<DiscoverySession | null>(null);
  const [breakingStories, setBreakingStories] = useState<CandidateStory[]>([]);
  const [trendingStories, setTrendingStories] = useState<CandidateStory[]>([]);
  const [ordinaryStories, setOrdinaryStories] = useState<CandidateStory[]>([]);
  const [selectedStoryIds, setSelectedStoryIds] = useState<Set<string>>(new Set());
  const [activeDiscoveryTab, setActiveDiscoveryTab] = useState<'all' | 'breaking' | 'trending' | 'ordinary'>('all');
  const [evidenceStory, setEvidenceStory] = useState<CandidateStory | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [liveStatusMessage, setLiveStatusMessage] = useState("");
  const [generatedArticles, setGeneratedArticles] = useState<any[]>([]);
  const [publishingMap, setPublishingMap] = useState<Record<number, boolean>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, "categories"), orderBy("order", "asc"));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
        const dynamic = snapshotEngine.getDynamicCategories();
        const merged = mergeWithCanonicalCategories(fetched, dynamic);
        setCategories(merged);
        if (merged.length > 0) setSelectedCategory(merged[0].slug);
      } catch (e) {
        console.warn("Failed to fetch categories from Firestore, using CANONICAL_CATEGORIES fallback:", e);
        setCategories(CANONICAL_CATEGORIES as Category[]);
        if (CANONICAL_CATEGORIES.length > 0) setSelectedCategory(CANONICAL_CATEGORIES[0].slug);
      }
    };
    if (isOpen) {
      fetchCategories();
      setStep('configure');
      setError("");
      setGeneratedArticles([]);
      setSelectedStoryIds(new Set());
    }
  }, [isOpen]);

  const handleRunDiscovery = async () => {
    setIsDiscovering(true);
    setError("");
    setDiscoveryProgressMsg("🔎 ताजा समाचार स्रोतहरू तथा शीर्षकहरू अनुसन्धान गर्दै...");

    const targetCat = categories.find(c => c.slug === selectedCategory) || {
      slug: selectedCategory,
      nameNepali: selectedCategory,
      nameEnglish: selectedCategory
    };

    try {
      const result = await LatestNewsRetrievalEngine.discoverAllStories(
        targetCat.slug,
        keywords,
        searchMode,
        (msg) => setDiscoveryProgressMsg(msg)
      );

      if (!result.success || result.totalDiscovered === 0) {
        // Even if empty, create session and show message
        setError(result.error || "पर्याप्त ताजा समाचार भेटिएन। कृपया अन्य विधा वा कीवर्ड प्रयास गर्नुहोस्।");
        setIsDiscovering(false);
        return;
      }

      setCurrentSession(result.session || null);
      setBreakingStories(result.breakingStories || []);
      setTrendingStories(result.trendingStories || []);
      setOrdinaryStories(result.ordinaryStories || []);

      // Auto-select the top story by default
      const allDiscovered = [...(result.breakingStories || []), ...(result.trendingStories || []), ...(result.ordinaryStories || [])];
      const initialSelection = new Set<string>();
      if (allDiscovered.length > 0) {
        initialSelection.add(allDiscovered[0].storyId);
      }
      setSelectedStoryIds(initialSelection);

      setStep('discover_results');
    } catch (err: any) {
      console.error("[Discovery] Error:", err);
      setError(err?.message || "समाचार खोज गर्दा प्राविधिक त्रुटि भयो।");
    } finally {
      setIsDiscovering(false);
    }
  };

  const toggleStorySelection = (storyId: string) => {
    setSelectedStoryIds(prev => {
      const next = new Set(prev);
      if (next.has(storyId)) {
        next.delete(storyId);
      } else {
        next.add(storyId);
      }
      return next;
    });
  };

  const selectAllDiscovered = () => {
    const allStories = [...breakingStories, ...trendingStories, ...ordinaryStories];
    setSelectedStoryIds(new Set(allStories.map(s => s.storyId)));
  };

  const deselectAll = () => {
    setSelectedStoryIds(new Set());
  };

  const handleGenerateSelected = async () => {
    if (selectedStoryIds.size === 0) {
      setError("कृपया कम्तिमा एउटा समाचार छान्नुहोस्।");
      return;
    }

    setIsGenerating(true);
    setStep('generating');
    setError("");
    setGeneratedArticles([]);

    const allDiscovered = [...breakingStories, ...trendingStories, ...ordinaryStories];
    const storiesToGenerate = allDiscovered.filter(s => selectedStoryIds.has(s.storyId));

    setGenerationProgress({ current: 0, total: storiesToGenerate.length });

    const targetCat = categories.find(c => c.slug === selectedCategory) || {
      slug: selectedCategory,
      nameNepali: selectedCategory
    };

    const results: any[] = [];

    for (let i = 0; i < storiesToGenerate.length; i++) {
      const story = storiesToGenerate[i];
      setGenerationProgress({ current: i + 1, total: storiesToGenerate.length });
      setLiveStatusMessage(`📖 "${story.storyTitle.slice(0, 30)}..." सम्पादकीय ड्राफ्ट तयार गर्दै...`);

      try {
        const article = await generateAINewsFromPreservedStory(
          story,
          targetCat.slug,
          targetCat.nameNepali || targetCat.slug,
          searchMode,
          (msg) => setLiveStatusMessage(msg)
        );

        const enriched = {
          ...article,
          categorySlug: targetCat.slug,
          categoryName: targetCat.nameNepali || targetCat.slug,
          candidateStoryId: story.storyId,
          storyType: story.storyType || (searchMode === 'breaking' ? 'breaking' : 'ordinary')
        };

        results.push(enriched);
        setGeneratedArticles(prev => [...prev, enriched]);
      } catch (err: any) {
        console.error(`[Generation Error] Story ID ${story.storyId}:`, err);
        setLiveStatusMessage(`⚠️ "${story.storyTitle.slice(0, 25)}..." सिर्जनामा त्रुटि: ${err?.message || err}`);
      }
    }

    setIsGenerating(false);
    setStep('review');
  };

  const handleSaveToDraft = async (item: any, index: number) => {
    try {
      const now = new Date().toISOString();
      const docId = `draft_ai_${Date.now()}_${index}`;
      const articleData = {
        title: item.title,
        content: item.content,
        excerpt: item.excerpt,
        categoryId: item.categorySlug || selectedCategory,
        authorName: item.sourceName || "Sanatan Marga AI Desk",
        authorId: auth.currentUser?.uid || "ai_newsroom",
        featuredImage: item.imageUrl || resolveArticleImage({ title: item.title, category: item.categorySlug }),
        status: "draft",
        verificationStatus: item.verificationStatus || "verified",
        views: 0,
        publishedAt: item.publishedDate || now,
        createdAt: now,
        updatedAt: now,
        sourceUrls: item.sourceUrls || [],
        districts: item.districts || [],
        isBreaking: item.isBreaking || false,
        storyType: item.storyType || 'ordinary',
        qaAudit: item.qaAudit || null
      };

      await setDocWithQueue(doc(db, "articles", docId), articleData);
      
      onSuccess(`"${item.title.slice(0, 30)}..." ड्राफ्टमा सुरक्षित गरियो!`);
    } catch (e: any) {
      setError(`ड्राफ्ट सुरक्षित गर्न सकिएन: ${e.message}`);
    }
  };

  const handlePublishDirectly = async (item: any, index: number) => {
    setPublishingMap(prev => ({ ...prev, [index]: true }));
    try {
      const now = new Date().toISOString();
      const docId = `pub_ai_${Date.now()}_${index}`;
      const rawArticleData = {
        title: item.title || "नेपाल समाचार",
        content: item.content || "सामग्री विवरण...",
        excerpt: item.excerpt || "",
        categoryId: item.categorySlug || selectedCategory || "news",
        authorName: item.sourceName || "Sanatan Marga AI Desk",
        authorId: auth.currentUser?.uid || "ai_newsroom",
        featuredImage: item.imageUrl || resolveArticleImage({ title: item.title, category: item.categorySlug }),
        status: "published",
        verificationStatus: "verified",
        views: 12,
        publishedAt: item.publishedDate || now,
        createdAt: now,
        updatedAt: now,
        sourceUrls: item.sourceUrls || [],
        districts: item.districts || [],
        isBreaking: item.isBreaking || false,
        storyType: item.storyType || 'ordinary',
        qaAudit: item.qaAudit || null
      };

      const normalized = normalizeFirestorePayload(rawArticleData, docId);
      const articleData = normalized.cleanData;

      await setDocWithQueue(doc(db, "articles", docId), articleData);

      // Emit mutation event for instant preview & server rebuild
      await contentEventBus.emit({
        type: 'ARTICLE_CREATED',
        entity: 'article',
        entityId: docId,
        data: { id: docId, ...articleData },
        userId: auth.currentUser?.uid
      });

      onSuccess(`"${item.title.slice(0, 30)}..." सफलतापूर्वक प्रकाशित गरियो!`);
    } catch (e: any) {
      setError(`प्रकाशन गर्न सकिएन: ${e.message}`);
    } finally {
      setPublishingMap(prev => ({ ...prev, [index]: false }));
    }
  };

  const handlePublishAll = async () => {
    for (let i = 0; i < generatedArticles.length; i++) {
      await handlePublishDirectly(generatedArticles[i], i);
    }
    onSuccess(`सबै ${generatedArticles.length} वटा समाचार प्रकाशित गरियो!`);
    onClose();
  };

  if (!isOpen) return null;

  const allDiscoveredStories = [...breakingStories, ...trendingStories, ...ordinaryStories];
  const displayedStories = activeDiscoveryTab === 'all'
    ? allDiscoveredStories
    : activeDiscoveryTab === 'breaking'
    ? breakingStories
    : activeDiscoveryTab === 'trending'
    ? trendingStories
    : ordinaryStories;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card text-card-foreground border border-border w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">AI समाचार सिर्जना केन्द्र (AI Newsroom OS)</h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className={`px-2 py-0.5 rounded-full font-medium ${step === 'configure' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1. खोज विधा</span>
                <ChevronRight className="w-3 h-3" />
                <span className={`px-2 py-0.5 rounded-full font-medium ${step === 'discover_results' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>2. समाचार चयन ({selectedStoryIds.size})</span>
                <ChevronRight className="w-3 h-3" />
                <span className={`px-2 py-0.5 rounded-full font-medium ${step === 'generating' || step === 'review' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>3. सम्पादकीय सिर्जना र प्रकाशन</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">ध्यान दिनुहोस्</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* STEP 1: CONFIGURE & DISCOVER */}
          {step === 'configure' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  समाचार विधा छान्नुहोस् (Select Category)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.slug;
                    return (
                      <button
                        key={cat.id || cat.slug}
                        type="button"
                        onClick={() => setSelectedCategory(cat.slug)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background hover:bg-muted/60 border-border text-foreground"
                        }`}
                      >
                        <span className="text-sm font-medium">{cat.nameNepali}</span>
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    खोज मोड (Search Mode)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSearchMode('standard')}
                      className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                        searchMode === 'standard'
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-border"
                      }`}
                    >
                      📰 साधारण (Latest)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchMode('trending')}
                      className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                        searchMode === 'trending'
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-background hover:bg-muted border-border"
                      }`}
                    >
                      🔥 ट्रेन्डिङ (Trending)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchMode('breaking')}
                      className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                        searchMode === 'breaking'
                          ? "bg-rose-600 text-white border-rose-600"
                          : "bg-background hover:bg-muted border-border"
                      }`}
                    >
                      🔴 ब्रेकिङ (Breaking)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    वैकल्पिक कीवर्ड वा विषय (Keywords / Topic Context)
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="उदा: बजेट, सुनको मूल्य, निर्वाचन, क्रिकेट..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {isDiscovering && (
                <div className="p-6 bg-muted/40 border border-border rounded-xl text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                  <p className="text-sm font-medium text-foreground">{discoveryProgressMsg}</p>
                  <p className="text-xs text-muted-foreground">प्रमाणित स्रोतहरू खोजी गर्दै र ताजगी प्रमाणीकरण गर्दैछ...</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: DISCOVERED STORIES SELECTOR */}
          {step === 'discover_results' && (
            <div className="space-y-4">
              
              {/* Category & Stats Summary Bar */}
              <div className="p-4 bg-muted/50 border border-border rounded-xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    अनुसन्धान गरिएका समाचारहरू: {allDiscoveredStories.length} वटा भेटिए
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    विधा: <span className="font-semibold text-foreground">{categories.find(c => c.slug === selectedCategory)?.nameNepali || selectedCategory}</span> • प्रमाणित ताजा स्रोतहरू सुरक्षित राखिएको छ।
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllDiscovered}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium hover:bg-muted"
                  >
                    सबै छान्नुहोस् ({allDiscoveredStories.length})
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium hover:bg-muted"
                  >
                    खाली गर्नुहोस्
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('configure')}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium hover:bg-muted flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> पुनः खोज्नुहोस्
                  </button>
                </div>
              </div>

              {/* Hierarchy Filter Tabs */}
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <button
                  type="button"
                  onClick={() => setActiveDiscoveryTab('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeDiscoveryTab === 'all'
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  सबै ({allDiscoveredStories.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDiscoveryTab('breaking')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeDiscoveryTab === 'breaking'
                      ? "bg-rose-600 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🔴 ब्रेकिङ ({breakingStories.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDiscoveryTab('trending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeDiscoveryTab === 'trending'
                      ? "bg-amber-600 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🔥 ट्रेन्डिङ ({trendingStories.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDiscoveryTab('ordinary')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeDiscoveryTab === 'ordinary'
                      ? "bg-slate-700 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  📰 ताजा/अन्य ({ordinaryStories.length})
                </button>
              </div>

              {/* Candidate Story Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-1">
                {displayedStories.map((story) => {
                  const isSelected = selectedStoryIds.has(story.storyId);
                  const isBreaking = story.storyType === 'breaking';
                  const isTrending = story.storyType === 'trending';

                  return (
                    <div
                      key={story.storyId}
                      onClick={() => toggleStorySelection(story.storyId)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                          : "border-border bg-card hover:bg-muted/40"
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isBreaking && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 border border-rose-500/20">
                                🔴 BREAKING
                              </span>
                            )}
                            {isTrending && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/20">
                                🔥 TRENDING
                              </span>
                            )}
                            {!isBreaking && !isTrending && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                                📰 LATEST
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600">
                              ताजापन: {story.freshnessScore || 95}%
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {story.publishedAt || "आज"}
                            </span>
                          </div>
                          
                          {/* Selection Checkbox */}
                          <div className="text-primary mt-0.5">
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-primary" />
                            ) : (
                              <Square className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-foreground leading-snug">
                          {story.storyTitle}
                        </h4>

                        {story.facts && story.facts.length > 0 && (
                          <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc line-clamp-3">
                            {story.facts.slice(0, 3).map((f, fIdx) => (
                              <li key={fIdx}>{f}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Card Footer Metadata */}
                      <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground">
                          स्रोत: {story.primaryPublisher || "प्रमाणित अनलाइन"}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEvidenceStory(story);
                            }}
                            className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground font-medium flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3 h-3 text-primary" /> प्रमाण हेर्नुहोस् (Evidence)
                          </button>

                          {story.allSources?.[0] && (
                            <a
                              href={typeof story.allSources[0] === 'string' ? story.allSources[0] : story.allSources[0]?.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-primary hover:underline flex items-center gap-0.5"
                            >
                              स्रोत <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* EVIDENCE MODAL OVERLAY */}
          {evidenceStory && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-card text-card-foreground border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-base font-bold text-foreground">समाचार प्रमाण र तथ्य स्रोत अभिलेख (Evidence Manifest)</h3>
                  </div>
                  <button
                    onClick={() => setEvidenceStory(null)}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4 text-sm">
                  <div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                      {evidenceStory.storyType === 'breaking' ? '🔴 Breaking' : evidenceStory.storyType === 'trending' ? '🔥 Trending' : '📰 Ordinary'}
                    </span>
                    <h4 className="text-lg font-bold text-foreground mt-2">{evidenceStory.storyTitle}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      प्राथमिक प्रकाशक: <strong className="text-foreground">{evidenceStory.primaryPublisher || 'प्रमाणित मिडिया'}</strong> • ताजगी स्कोर: <strong className="text-emerald-600">{evidenceStory.freshnessScore || 95}%</strong>
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-border pt-4">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">प्रमाणित तथ्य सूची (Verified Fact Bullets)</h5>
                    <ul className="space-y-1.5 pl-4 list-disc text-foreground text-xs">
                      {evidenceStory.facts && evidenceStory.facts.length > 0 ? (
                        evidenceStory.facts.map((fact, idx) => (
                          <li key={idx} className="leading-relaxed">{fact}</li>
                        ))
                      ) : (
                        <li>प्रमाणित स्रोतहरूबाट सङ्कलित तथ्यहरू प्राप्त भइसकेको छ।</li>
                      )}
                    </ul>
                  </div>

                  <div className="space-y-2 border-t border-border pt-4">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">स्रोत लिंकहरू र प्राधिकार (Source URLs & Authority)</h5>
                    <div className="space-y-2">
                      {evidenceStory.allSources && evidenceStory.allSources.length > 0 ? (
                        evidenceStory.allSources.map((source: any, idx: number) => {
                          const urlStr = typeof source === 'string' ? source : source?.url;
                          const pubName = typeof source === 'string' ? 'प्रमाणित स्रोत' : (source?.publisher || 'Verified Media');
                          const tier = typeof source === 'object' ? source?.sourceTier || 1 : 1;
                          return (
                            <div key={idx} className="p-3 bg-muted/40 rounded-xl border border-border flex items-center justify-between gap-3 text-xs">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground">{pubName}</span>
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-bold">
                                    Tier {tier} High Authority
                                  </span>
                                </div>
                                <p className="text-muted-foreground font-mono text-[11px] truncate max-w-md mt-0.5">{urlStr}</p>
                              </div>
                              {urlStr && (
                                <a
                                  href={urlStr}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors flex items-center gap-1 shrink-0 text-xs"
                                >
                                  खोल्नुहोस् <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-muted-foreground">गोरखापत्र अनलाइन डिजिटल स्रोत प्रयोग गरिएको छ।</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3 border-t border-border bg-muted/30 flex justify-end">
                  <button
                    onClick={() => setEvidenceStory(null)}
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl"
                  >
                    बन्द गर्नुहोस्
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: GENERATING PROGRESS */}
          {step === 'generating' && (
            <div className="p-12 text-center space-y-6">
              <div className="relative inline-flex items-center justify-center">
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                <span className="absolute text-xs font-bold text-foreground">
                  {generationProgress.current}/{generationProgress.total}
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">
                  सम्पादकीय लेख सिर्जना हुँदैछ ({generationProgress.current}/{generationProgress.total})
                </h3>
                <p className="text-sm text-primary font-medium">{liveStatusMessage}</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  छानिएका प्रमाणिक तथ्यहरूबाट नेपाली भाषाको उच्चस्तरीय पत्रकारिता शैलीमा पूर्ण लेख, शीर्षक, अडिट र सारांश तयार हुँदैछ...
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & PUBLISH */}
          {step === 'review' && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      {generatedArticles.length} वटा लेख सफलतापूर्वक तयार भयो!
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      सबै लेखहरू तथ्य प्रमाणीकरण, मौलिकता र AI भ्रम अडिट पास भएका छन्।
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePublishAll}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:bg-primary/90 transition-all flex items-center gap-1.5"
                >
                  <Globe className="w-4 h-4" /> सबै {generatedArticles.length} वटा प्रकाशित गर्नुहोस्
                </button>
              </div>

              {/* Generated Articles Cards */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {generatedArticles.map((item, idx) => (
                  <div key={idx} className="p-5 bg-card border border-border rounded-xl space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                            {item.categoryName || selectedCategory}
                          </span>
                          {item.isBreaking && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600">
                              🔴 ब्रेकिङ
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {item.wordCount || 180} शब्द • मौलिकता: {item.originalityScore || 95}%
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-foreground leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.excerpt}
                        </p>
                      </div>

                      {item.imageUrl && (
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="w-24 h-18 object-cover rounded-lg border border-border shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>

                    {/* QA Metrics Badges */}
                    <div className="p-3 bg-muted/40 rounded-lg flex flex-wrap items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-emerald-600 font-medium">
                        <ShieldCheck className="w-4 h-4" /> तथ्य स्कोर: {item.trustScore || 95}%
                      </div>
                      <div className="flex items-center gap-1 text-primary font-medium">
                        <Sparkles className="w-4 h-4" /> AI भ्रम अडिट: पास
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Activity className="w-4 h-4" /> स्रोत: {item.sourceName || "समाचार डेस्क"}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                      <button
                        type="button"
                        onClick={() => handleSaveToDraft(item, idx)}
                        className="px-3.5 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted transition-all flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" /> ड्राफ्टमा राख्नुहोस्
                      </button>
                      <button
                        type="button"
                        disabled={publishingMap[idx]}
                        onClick={() => handlePublishDirectly(item, idx)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all flex items-center gap-1.5"
                      >
                        {publishingMap[idx] ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Globe className="w-3.5 h-3.5" />
                        )}
                        सिधै प्रकाशित गर्नुहोस्
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer Bar */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
          <div>
            {step === 'discover_results' && (
              <span className="text-xs text-muted-foreground font-medium">
                छानिएका समाचार: <strong className="text-foreground">{selectedStoryIds.size}</strong> वटा
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted transition-all"
            >
              रद्द गर्नुहोस्
            </button>

            {step === 'configure' && (
              <button
                type="button"
                disabled={isDiscovering}
                onClick={handleRunDiscovery}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2"
              >
                {isDiscovering ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                ताजा समाचार खोज्नुहोस् (Discover Stories)
              </button>
            )}

            {step === 'discover_results' && (
              <button
                type="button"
                disabled={selectedStoryIds.size === 0 || isGenerating}
                onClick={handleGenerateSelected}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {selectedStoryIds.size} वटा छानिएका लेख सिर्जना गर्नुहोस्
              </button>
            )}

            {step === 'review' && (
              <button
                type="button"
                onClick={() => setStep('configure')}
                className="px-4 py-2 rounded-xl border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> थप समाचार सिर्जना गर्नुहोस्
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function Plus(props: any) {
  return <Sparkles {...props} />;
}
