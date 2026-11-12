import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, Plus, Search, Eye, Edit, Trash2, ExternalLink, FileText, Check, X, 
  MapPin, AlertCircle, TrendingUp, RotateCw, Building2, Globe, ArrowRight, ShieldCheck,
  ChevronRight, ThumbsUp, Calendar, Loader2, RefreshCw
} from "lucide-react";
import { collection, query, orderBy, addDoc, doc, deleteDoc, limit } from "@/src/lib/firebase";
import { db, safeOnSnapshot, getDocs, setDoc, updateDoc } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { motion, AnimatePresence } from "motion/react";
import { extractJson } from "@/src/utils/jsonUtils";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { resolveArticleImage } from "@/src/services/imageIntelligence";
import { contentEventBus } from "@/src/lib/contentEventBus";
import { SourcePollerService, DailyEditorialDigest } from "@/src/services/sourcePollerService";
import { normalizeArticleCategory } from "@/src/constants/categories";
import { Radio, Newspaper, DownloadCloud } from "lucide-react";
import DiscoveryQAMetrics from "@/src/components/admin/discovery/DiscoveryQAMetrics";

interface DiscoveryStory {
  id: string;
  title: string;
  titleNe?: string;
  summary: string;
  summaryNe?: string;
  category: string;
  source: string;
  sourceUrl?: string;
  freshnessMins: number;
  district: string;
  isGovNotice: boolean;
  governmentDept?: string;
  status: "new" | "drafted" | "ignored" | "published";
  scores?: {
    freshness?: number;
    authority?: number;
    relevance?: number;
    civilizational?: number;
    communityInterest?: number;
    duplicateRisk?: number;
  };
  scoreBreakdown?: {
    freshness?: number;
    authority?: number;
    relevance?: number;
    civilizationalImpact?: number;
    communityInterest?: number;
    duplicateRisk?: number;
  };
  tags: string[];
  createdAt: string;
}

export const normalizeStory = (story: any): DiscoveryStory => {
  const scoresObj = story?.scores || story?.scoreBreakdown || {};
  return {
    ...story,
    id: story?.id || `story_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: story?.title || "ताजा राष्ट्रिय अपडेट",
    titleNe: story?.titleNe || story?.title || "ताजा राष्ट्रिय अपडेट",
    summary: story?.summary || story?.excerpt || story?.snippet || "नेपालको पछिल्लो घटनाक्रम र नागरिक सरोकारका मुख्य सवालहरू।",
    summaryNe: story?.summaryNe || story?.summary || story?.excerpt || story?.snippet || "नेपालको पछिल्लो घटनाक्रम र नागरिक सरोकारका मुख्य सवालहरू।",
    category: story?.category || "Breaking",
    source: story?.source || story?.sourceName || "गोरखापत्र",
    sourceUrl: story?.sourceUrl || story?.link || "",
    freshnessMins: Number(story?.freshnessMins) || 15,
    district: story?.district || "काठमाडौँ",
    isGovNotice: Boolean(story?.isGovNotice),
    governmentDept: story?.governmentDept || "",
    status: (story?.status === "pending" || !story?.status) ? "new" : story.status,
    scores: {
      freshness: Number(scoresObj.freshness ?? scoresObj.freshnessScore) || 95,
      authority: Number(scoresObj.authority ?? scoresObj.authorityScore) || 90,
      relevance: Number(scoresObj.relevance ?? scoresObj.relevanceScore) || 85,
      civilizational: Number(scoresObj.civilizational ?? scoresObj.civilizationalImpact) || 75,
      communityInterest: Number(scoresObj.communityInterest) || 80,
      duplicateRisk: Number(scoresObj.duplicateRisk) || 10
    },
    tags: Array.isArray(story?.tags) && story.tags.length > 0 ? story.tags : ["#ताजाअपडेट", "#नेपाल"],
    createdAt: story?.createdAt || story?.discoveredAt || new Date().toISOString()
  };
};

interface HotTopic {
  tag: string;
  description: string;
  descriptionNe: string;
  category: string;
  volume: string;
}

interface ExistingArticle {
  id: string;
  title: string;
}

export default function AdminDiscovery() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // States
  const [stories, setStories] = useState<DiscoveryStory[]>([]);
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [existingArticles, setExistingArticles] = useState<ExistingArticle[]>([]);
  const [selectedStory, setSelectedStory] = useState<DiscoveryStory | null>(null);
  
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isPollingWires, setIsPollingWires] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isScanningTopics, setIsScanningTopics] = useState(false);
  const [showDigestModal, setShowDigestModal] = useState(false);
  const [morningDigest, setMorningDigest] = useState<DailyEditorialDigest | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("new");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Handle RSS & Wire Polling
  const handlePollWires = async () => {
    setIsPollingWires(true);
    try {
      const result = await SourcePollerService.pollAllActiveSources();
      
      // Refresh local queue
      const rawQueue = localStorage.getItem("sanatan_discovery_queue");
      if (rawQueue) {
        const parsed = JSON.parse(rawQueue);
        if (Array.isArray(parsed)) {
          const normalized = parsed.map(normalizeStory);
          setStories(normalized);
          setSelectedStory(normalized[0] || null);
        }
      }
      
      showAlert(
        "तार सेवा तथा राजपत्र पोल सम्पन्न!",
        `${result.newItemsCount} नयाँ आधिकारिक समाचार/सूचना राष्ट्रिय फिडबाट प्राप्त भई खोज सूचीमा थपियो।`,
        "success"
      );
    } catch (err: any) {
      showAlert("पोलिङ असफल", err?.message || "तार सेवाबाट डेटा ल्याउन सकिएन।", "error");
    } finally {
      setIsPollingWires(false);
    }
  };

  // Handle 06:00 AM Morning Editorial Briefing
  const handleOpenMorningDigest = () => {
    const digest = SourcePollerService.generateDailyEditorialDigest();
    setMorningDigest(digest);
    setShowDigestModal(true);
  };
  
  const [alert, setAlert] = useState<{ show: boolean; title: string; message: string; type: "success" | "error" }>({
    show: false,
    title: "",
    message: "",
    type: "success"
  });

  // Category Normalization
  const normalizeCategory = (cat?: string): string => {
    if (!cat) return "Breaking";
    const c = cat.toLowerCase();
    if (c.includes("break") || c.includes("ताजा") || c.includes("प्रमुख")) return "Breaking";
    if (c.includes("gov") || c.includes("notice") || c.includes("सूचना") || c.includes("सरकारी")) return "Government Notices";
    if (c.includes("disaster") || c.includes("flood") || c.includes("weather") || c.includes("विपद्") || c.includes("मौसम") || c.includes("पहिरो")) return "Disaster Alerts";
    if (c.includes("politic") || c.includes("राजनीति") || c.includes("संसद")) return "Politics";
    if (c.includes("econ") || c.includes("finance") || c.includes("अर्थ") || c.includes("बजेट")) return "Economy";
    if (c.includes("touris") || c.includes("पर्यटन") || c.includes("पदयात्रा")) return "Tourism";
    if (c.includes("religio") || c.includes("cultur") || c.includes("धर्म") || c.includes("संस्कृति") || c.includes("पशुपति") || c.includes("मन्दिर")) return "Religion & Culture";
    if (c.includes("internat") || c.includes("विश्व") || c.includes("विदेश")) return "International";
    return cat;
  };

  // Load Discovered Stories and existing articles
  useEffect(() => {
    // 0. Instant Local Storage hydration
    try {
      const cached = localStorage.getItem("sanatan_discovery_queue");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map(normalizeStory);
          setStories(normalized);
          setSelectedStory(prev => prev ? normalizeStory(prev) : normalized[0]);
        }
      }
    } catch (e) {
      console.warn("Could not read local discovery queue cache:", e);
    }

    // 1. Stories Listener
    const storiesQuery = query(collection(db, "discoveryQueue"), orderBy("createdAt", "desc"), limit(100));
    const unsubscribeStories = safeOnSnapshot(storiesQuery, (snapshot) => {
      if (snapshot && snapshot.docs && snapshot.docs.length > 0) {
        const docs = snapshot.docs.map(doc => normalizeStory({ id: doc.id, ...doc.data() }));
        setStories(docs);
        try {
          localStorage.setItem("sanatan_discovery_queue", JSON.stringify(docs));
        } catch (e) {}
        setSelectedStory(prev => {
          if (!prev) return docs[0];
          const matched = docs.find(d => d.id === prev.id);
          return matched || docs[0];
        });
      }
    }, "admin_discovery_stories");

    // 2. Existing articles for Duplicate Prevention
    const articlesQuery = query(collection(db, "articles"), orderBy("createdAt", "desc"), limit(50));
    const unsubscribeArticles = safeOnSnapshot(articlesQuery, (snapshot) => {
      if (snapshot && snapshot.docs) {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, title: doc.data().title } as ExistingArticle));
        setExistingArticles(docs);
      }
    }, "admin_discovery_articles");

    // 3. Load Hot Topics static or from cache
    const loadHotTopics = async () => {
      try {
        const topicsQuery = query(collection(db, "hotTopics"), limit(10));
        const snap = await getDocs(topicsQuery);
        if (snap.docs.length > 0) {
          setHotTopics(snap.docs.map(doc => doc.data() as HotTopic));
        } else {
          // Default fallbacks
          setHotTopics([
            { tag: "#TourismPolicy", description: "Government draft approval of new Tourism standard 2026", descriptionNe: "नयाँ पर्यटन नीति २०८३ को मस्यौदा पारित", category: "Tourism", volume: "High" },
            { tag: "#FloodAlert", description: "DHM Nepal issued severe orange level alert in Karnali basin", descriptionNe: "जल तथा मौसम विज्ञान विभागद्वारा कर्णालीमा उच्च सतर्कता", category: "Disaster", volume: "Urgent" },
            { tag: "#ShivaratriPrep", description: "Pashupati Area Development Trust began religious preparations", descriptionNe: "पशुपति क्षेत्र विकास कोषद्वारा महाशिवरात्रीको विशेष तयारी", category: "Festivals", volume: "High" },
            { tag: "#VanguardBudget", description: "Ministry of Finance prioritizing rural tourism development", descriptionNe: "अर्थ मन्त्रालयद्वारा ग्रामीण पर्यटन विकासका लागि बजेट प्राथमिकता", category: "Economy", volume: "Medium" }
          ]);
        }
      } catch (err) {
        console.warn("Could not load hot topics from Firestore, using defaults:", err);
      }
    };
    
    loadHotTopics();

    return () => {
      unsubscribeStories();
      unsubscribeArticles();
    };
  }, []);

  // Show Alert helper
  const showAlert = (title: string, message: string, type: "success" | "error") => {
    setAlert({ show: true, title, message, type });
    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // 1. Run AI Discovery Engine
  const handleTriggerDiscovery = async () => {
    setIsDiscovering(true);
    try {
      const response = await fetch("/api/gemini/newsroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discover-news" })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to discover news");

      const parsed = extractJson(data.text);
      const rawDiscovered = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' ? [parsed] : []);
      
      if (rawDiscovered.length === 0) {
        throw new Error("कुनै नयाँ समाचार फेला परेन। कृपया पुनः प्रयास गर्नुहोस्।");
      }

      // Format and normalize discovered stories
      const normalizedDiscovered: DiscoveryStory[] = rawDiscovered.map((story: any, idx: number) => {
        const storyId = story.id || `story_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`;
        return {
          id: storyId,
          title: story.title || "ताजा राष्ट्रिय अपडेट",
          titleNe: story.titleNe || story.title || "ताजा राष्ट्रिय अपडेट",
          summary: story.summary || "नेपालको पछिल्लो घटनाक्रम र नागरिक सरोकारका मुख्य सवालहरू।",
          summaryNe: story.summaryNe || story.summary || "नेपालको पछिल्लो घटनाक्रम र नागरिक सरोकारका मुख्य सवालहरू।",
          category: normalizeCategory(story.category),
          source: story.source || "गोरखापत्र",
          sourceUrl: story.sourceUrl || "",
          freshnessMins: Number(story.freshnessMins) || 15,
          district: story.district || "काठमाडौँ",
          isGovNotice: Boolean(story.isGovNotice),
          governmentDept: story.governmentDept || "",
          status: "new" as const,
          scores: {
            freshness: Number(story.scores?.freshness) || 95,
            authority: Number(story.scores?.authority) || 90,
            relevance: Number(story.scores?.relevance) || 85,
            civilizational: Number(story.scores?.civilizational) || 75,
            communityInterest: Number(story.scores?.communityInterest) || 80,
            duplicateRisk: Number(story.scores?.duplicateRisk) || 10
          },
          tags: Array.isArray(story.tags) && story.tags.length > 0 ? story.tags : ["#ताजाअपडेट", "#नेपाल"],
          createdAt: story.createdAt || new Date().toISOString()
        };
      });

      // Update state and cache immediately so the UI is 100% reactive
      setStories(prev => {
        const map = new Map<string, DiscoveryStory>();
        normalizedDiscovered.forEach(s => map.set(s.id, s));
        prev.forEach(s => {
          if (!map.has(s.id)) map.set(s.id, s);
        });
        const merged = Array.from(map.values());
        try {
          localStorage.setItem("sanatan_discovery_queue", JSON.stringify(merged));
        } catch (e) {}
        return merged;
      });

      // Set active filters to show new stories instantly
      setStatusFilter("new");
      setCategoryFilter("all");
      if (normalizedDiscovered.length > 0) {
        setSelectedStory(normalizedDiscovered[0]);
      }

      // Persist stories to Firestore in background
      for (const story of normalizedDiscovered) {
        setDoc(doc(db, "discoveryQueue", story.id), story).catch(err => {
          console.warn(`Could not sync story ${story.id} to Firestore:`, err?.message || err);
        });
      }

      showAlert("खोज सफल!", `एआईले ${normalizedDiscovered.length} वटा नयाँ ब्रेकिङ समाचार र सूचना फेला पारेको छ।`, "success");
    } catch (err: any) {
      console.error("AI Discovery failed:", err);
      showAlert("त्रुटि!", err.message || "समाचार खोज्न सकिएन।", "error");
    } finally {
      setIsDiscovering(false);
    }
  };

  // 2. Scan Hot Topics
  const handleScanHotTopics = async () => {
    setIsScanningTopics(true);
    try {
      const response = await fetch("/api/gemini/newsroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discover-hot-topics" })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to scan trending topics");

      const parsed = extractJson(data.text);
      const scanned: HotTopic[] = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' ? [parsed] : []);
      
      // Save/overwrite topics
      for (const topic of scanned) {
        if (topic && topic.tag) {
          const docId = topic.tag.replace("#", "");
          await setDoc(doc(db, "hotTopics", docId), topic);
        }
      }
      setHotTopics(scanned);
      showAlert("ट्रेन्डिङ स्क्यान सम्पन्न!", "नेपालभरका पछिल्ला ६ चर्चित ट्रेन्डिङ ह्यासट्यागहरू अद्यावधिक भए।", "success");
    } catch (err: any) {
      console.error("Scanning hot topics failed:", err);
      showAlert("त्रुटि!", err.message || "ट्रेन्डिङ स्क्यान गर्न सकिएन।", "error");
    } finally {
      setIsScanningTopics(false);
    }
  };

  // 3. One Click Ignore
  const handleIgnoreStory = async (storyId: string) => {
    try {
      setStories(prev => {
        const next = prev.map(s => s.id === storyId ? { ...s, status: "ignored" as const } : s);
        try { localStorage.setItem("sanatan_discovery_queue", JSON.stringify(next)); } catch (e) {}
        return next;
      });
      if (selectedStory?.id === storyId) {
        setSelectedStory(prev => prev ? { ...prev, status: "ignored" } : null);
      }
      updateDoc(doc(db, "discoveryQueue", storyId), {
        status: "ignored"
      }).catch(e => console.warn("Firestore ignore sync:", e));
      
      showAlert("हटाइयो", "यस स्टोरीलाई खोज सूचीबाट हटाइयो।", "success");
    } catch (err: any) {
      showAlert("त्रुटि!", "अवस्था परिवर्तन गर्न सकिएन।", "error");
    }
  };

  // 4. Duplicate Prevention Similarity Formula
  const getHeadlineSimilarity = (title1: string, title2: string): number => {
    if (!title1 || !title2) return 0;
    const clean = (t: string) => t.toLowerCase().replace(/[^\w\s\u0900-\u097F]/g, "").split(/\s+/).filter(Boolean);
    const words1 = new Set(clean(title1));
    const words2 = new Set(clean(title2));
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    if (union.size === 0) return 0;
    return Math.round((intersection.size / union.size) * 100);
  };

  // Get matching duplicate existing story
  const findExistingDuplicate = (storyTitle: string) => {
    let highestSim = 0;
    let matchingTitle = "";
    let matchingId = "";

    for (const art of existingArticles) {
      const sim = getHeadlineSimilarity(storyTitle, art.title);
      if (sim > highestSim) {
        highestSim = sim;
        matchingTitle = art.title;
        matchingId = art.id;
      }
    }
    return { similarity: highestSim, title: matchingTitle, id: matchingId };
  };

  // 5. One Click Generate Nepali Draft
  const handleGenerateDraft = async (story: DiscoveryStory) => {
    setIsGeneratingDraft(true);
    try {
      const response = await fetch("/api/gemini/newsroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-discovery-draft",
          payload: story
        })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to generate draft content");

      const draftContent = extractJson(data.text) || {};
      const fallbackTitle = story.titleNe || story.title || "ताजा अपडेट";
      const fallbackExcerpt = story.summaryNe || story.summary || "नेपालको पछिल्लो घटनाक्रम र नागरिक सरोकारका मुख्य सवालहरू।";
      const fallbackDistrict = (story.district && story.district !== "None") ? story.district : "काठमाडौँ";
      const fallbackCategory = story.category === "Breaking" ? "samachar" : story.category === "Economy" ? "arthaniti" : story.category === "Religion & Culture" ? "sanskar" : "nepal-hub";

      const finalTitle = draftContent.title || fallbackTitle;
      const finalExcerpt = draftContent.excerpt || fallbackExcerpt;
      const finalDistrict = draftContent.district || fallbackDistrict;
      const finalContent = draftContent.content || `<p class="lead-text">${finalExcerpt}</p><h2>मुख्य घटनाक्रम</h2><p>यस घटनाक्रमका विषयमा विस्तृत अनुसन्धान तथा तथ्य संकलन भइरहेको छ। सम्बन्धित निकायहरूले आवश्यक कदम चाल्ने क्रम जारी राखेका छन्।</p><h2>पृष्ठभूमि तथा सन्दर्भ</h2><p>नेपालको समसामयिक परिवेशमा यस प्रकृतिका विषयहरूले नीतिगत तथा सामाजिक क्षेत्रमा महत्वपूर्ण प्रभाव पार्दछन्।</p><h2>स्थानीय प्रभाव (${finalDistrict})</h2><p>${finalDistrict} तथा आसपासका क्षेत्रहरूमा यसको प्रत्यक्ष प्रभाव देखिएको छ। स्थानीय बासिन्दा तथा सरोकारवालाहरूले आवश्यक सावधानी अपनाउन आग्रह गरेका छन्।</p><h2>निष्कर्ष</h2><p>सम्बन्धित निकायबाट थप निर्णय र औपचारिक सूचना आउन बाँकी छ।</p>`;

      // Normalize Category to Canonical App Category
      const rawCatInput = draftContent.categoryId || story.category;
      const catNorm = normalizeArticleCategory(rawCatInput, finalTitle, finalExcerpt);

      const articleId = `art_draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Create new comprehensive Article draft
      const newArticle = {
        id: articleId,
        title: finalTitle,
        editorialHeadline: draftContent.editorialHeadline || finalTitle,
        seoHeadline: draftContent.seoHeadline || `${finalTitle.slice(0, 55)} | सनातन मार्ग`,
        seoDescription: draftContent.seoDescription || finalExcerpt.slice(0, 155),
        socialHeadline: draftContent.socialHeadline || finalTitle,
        excerpt: finalExcerpt,
        content: finalContent,
        categoryId: catNorm.categoryId,
        categorySlug: catNorm.categorySlug,
        categoryName: catNorm.categoryName,
        category: catNorm.categorySlug,
        authorId: user?.uid || "editor_sagar",
        authorName: user?.displayName || "सागर राणा (Sagar Rana)",
        authorRole: user?.role === "admin" ? "प्रधान सम्पादक • सनातनमार्ग" : "सम्पादक • सनातनमार्ग",
        authorPhoto: user?.photoURL || "",
        authorAvatar: user?.photoURL || "",
        generatedByUserId: user?.uid || "editor_sagar",
        generatedByUserName: user?.displayName || "सागर राणा (Sagar Rana)",
        sourcePublishers: [story.source || "गोरखापत्र", "राष्ट्रिय समाचार समिति (RSS)"].filter(Boolean),
        status: "draft" as const,
        views: 0,
        isBreaking: story.category === "Breaking",
        isFeatured: false,
        district: finalDistrict,
        districts: [finalDistrict].filter(Boolean),
        tags: Array.isArray(draftContent.tags) && draftContent.tags.length > 0 ? draftContent.tags : (story.tags || ["ताजाअपडेट", "नेपाल"]),
        source: story.source || "समाचार कक्ष",
        sourceName: story.source || "समाचार कक्ष",
        sourceUrls: story.sourceUrl ? [story.sourceUrl] : [],
        verificationStatus: "verified" as const,
        featuredImage: resolveArticleImage({ category: catNorm.categorySlug }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Inject into snapshot engine immediately
      try {
        snapshotEngine.injectArticles([newArticle as any]);
      } catch (e) {}

      // 2. Persist locally to storage for instant multi-tab and offline loading
      try {
        localStorage.setItem(`sg_local_articles_${articleId}`, JSON.stringify(newArticle));
        sessionStorage.setItem(`sanatan_edit_draft_${articleId}`, JSON.stringify(newArticle));
      } catch (e) {}

      // 3. Save to Firestore in background
      setDoc(doc(db, "articles", articleId), newArticle).catch(err => {
        console.warn("Firestore save draft sync:", err);
      });

      // 4. Emit content event
      try {
        contentEventBus.emit({
          type: 'ARTICLE_CREATED',
          entity: 'article',
          entityId: articleId,
          data: newArticle
        });
      } catch (e) {}

      // 5. Update story status to drafted locally and in storage
      setStories(prev => {
        const next = prev.map(s => s.id === story.id ? { ...s, status: "drafted" as const } : s);
        try { localStorage.setItem("sanatan_discovery_queue", JSON.stringify(next)); } catch (e) {}
        return next;
      });

      if (selectedStory?.id === story.id) {
        setSelectedStory(prev => prev ? { ...prev, status: "drafted" } : null);
      }

      // Update story status to drafted in Firestore
      updateDoc(doc(db, "discoveryQueue", story.id), {
        status: "drafted"
      }).catch(e => console.warn("Firestore draft status sync:", e));

      showAlert("ड्राफ्ट तयार!", "नेपाली सम्पादकीय मस्यौदा सफलतापूर्वक तयार भयो। सम्पादक प्यानल खोलिँदैछ...", "success");
      
      // Redirect to Admin Editor with both ID and explicit state
      setTimeout(() => {
        navigate(`/admin/editor/${articleId}`, { state: { article: newArticle } });
      }, 700);
    } catch (err: any) {
      console.error("Draft generation failed:", err);
      showAlert("त्रुटि!", err.message || "ड्राफ्ट तयार गर्न सकिएन।", "error");
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // Categories helper
  const categoriesList = [
    { id: "all", label: "सबै विधा" },
    { id: "Breaking", label: "🔥 ब्रेकिङ" },
    { id: "Government Notices", label: "🏛️ सरकारी सूचना" },
    { id: "Disaster Alerts", label: "🚨 विपद् सतर्कता" },
    { id: "Politics", label: "राजनिति" },
    { id: "Economy", label: "अर्थतन्त्र" },
    { id: "Tourism", label: "पर्यटन" },
    { id: "Religion & Culture", label: "धर्म र संस्कृति" },
    { id: "International", label: "अन्तर्राष्ट्रिय" }
  ];

  // Filtered stories
  const filteredStories = stories.filter(story => {
    const matchesCategory = categoryFilter === "all" || story.category === categoryFilter;
    
    const matchesSearch = !searchQuery || 
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (story.titleNe && story.titleNe.toLowerCase().includes(searchQuery.toLowerCase())) ||
      story.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (story.summaryNe && story.summaryNe.toLowerCase().includes(searchQuery.toLowerCase())) ||
      story.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (story.tags && story.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesSearch) return false;

    if (statusFilter === "all") return matchesCategory;
    if (statusFilter === "duplicate") {
      const dup = findExistingDuplicate(story.title);
      return matchesCategory && (dup.similarity > 60 || (story.scores?.duplicateRisk || 0) > 50);
    }
    if (statusFilter === "uncategorized") {
      return matchesCategory && (!story.category || story.category === "General" || story.category === "Uncategorized");
    }
    if (statusFilter === "published") {
      return matchesCategory && (story.status === "published" || story.status === "drafted");
    }
    return matchesCategory && story.status === statusFilter;
  });

  const duplicateStoriesCount = stories.filter(s => {
    const dup = findExistingDuplicate(s.title);
    return dup.similarity > 60 || (s.scores?.duplicateRisk || 0) > 50;
  }).length;

  const uncategorizedCount = stories.filter(s => !s.category || s.category === "General" || s.category === "Uncategorized").length;
  const publishedStoriesCount = stories.filter(s => s.status === "published" || s.status === "drafted").length;
  const rejectedStoriesCount = stories.filter(s => s.status === "ignored").length;
  const needsReviewStoriesCount = stories.filter(s => s.status === "new" || !s.status).length;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-100 space-y-6">
        
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="text-amber-500 animate-pulse" size={24} />
              <h1 className="text-3xl font-black tracking-tight font-sans">समाचार खोज केन्द्र (Discovery Center)</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              वास्तविक-समय एआई वेब खोज (Grounding), सरकारी सूचना मनिटर र डुप्लिकेट जोखिम जाँच।
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleOpenMorningDigest}
              className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-800 px-4 py-2.5 rounded-xl font-bold text-xs transition duration-200 cursor-pointer"
              title="06:00 AM Daily Editorial Morning Briefing"
            >
              <Newspaper size={16} className="text-purple-600 dark:text-purple-400" />
              बिहानी ब्रिफिङ (06:00 AM)
            </button>
            <button
              onClick={handlePollWires}
              disabled={isPollingWires}
              className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-800 px-4 py-2.5 rounded-xl font-bold text-xs transition duration-200 cursor-pointer disabled:opacity-50"
              title="Poll National Wire Agencies & Official Gazette"
            >
              {isPollingWires ? <Loader2 size={16} className="animate-spin text-blue-600" /> : <Radio size={16} className="text-blue-600 dark:text-blue-400" />}
              तार सेवा तथा राजपत्र (Wire Poller)
            </button>
            <button
              onClick={handleScanHotTopics}
              disabled={isScanningTopics}
              className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs transition duration-200 cursor-pointer disabled:opacity-50"
            >
              {isScanningTopics ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
              ट्रेन्डिङ स्क्यान
            </button>
            <button
              onClick={handleTriggerDiscovery}
              disabled={isDiscovering}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-5 py-2.5 rounded-xl font-black text-xs shadow-lg shadow-amber-500/15 hover:scale-[1.02] active:scale-[0.98] transition duration-200 cursor-pointer disabled:opacity-50"
            >
              {isDiscovering ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              नयाँ खोज (AI Scan)
            </button>
          </div>
        </div>

        {/* Priority 1: Discovery Center QA Dashboard */}
        <DiscoveryQAMetrics
          totalCount={stories.length}
          publishedCount={publishedStoriesCount}
          rejectedCount={rejectedStoriesCount}
          needsReviewCount={needsReviewStoriesCount}
          duplicateCount={duplicateStoriesCount}
          uncategorizedCount={uncategorizedCount}
          currentFilter={statusFilter}
          onFilterSelect={(filter) => setStatusFilter(filter)}
        />

        {/* Alert Notification Popup */}
        <AnimatePresence>
          {alert.show && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
                alert.type === "success" 
                  ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/90 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200" 
                  : "bg-rose-50 border-rose-200 dark:bg-rose-950/90 dark:border-rose-800 text-rose-800 dark:text-rose-200"
              }`}
            >
              <ShieldCheck size={20} className={alert.type === "success" ? "text-emerald-500" : "text-rose-500"} />
              <div className="flex flex-col">
                <span className="font-bold text-sm leading-none mb-1">{alert.title}</span>
                <span className="text-xs font-semibold opacity-90">{alert.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hot Topics Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 mb-8 border border-slate-100 dark:border-slate-700/50 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-primary" size={18} />
            <span className="font-extrabold text-sm uppercase tracking-wider">नेपालका मुख्य हट टपिक्स (AI Trend Insights)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {hotTopics.map((topic, idx) => (
              <div 
                key={idx}
                className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-900/40 transition duration-150 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-xs text-amber-600 dark:text-amber-400 font-mono tracking-tight">{topic.tag}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    topic.volume === "Urgent" 
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400" 
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                  }`}>{topic.volume}</span>
                </div>
                <p className="text-xs font-bold leading-tight line-clamp-1 mb-0.5">{topic.descriptionNe}</p>
                <p className="text-[10px] text-slate-400 line-clamp-1">{topic.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Discovery Feed Filters */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Feed Block */}
          <div className="w-full lg:w-2/3">
            
            {/* Filter Tabs and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setStatusFilter("new")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-tight transition duration-150 cursor-pointer ${
                    statusFilter === "new" 
                      ? "bg-primary text-white shadow-lg shadow-primary/10" 
                      : "bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  नयाँ फेला परेका ({stories.filter(s => s.status === "new").length})
                </button>
                <button
                  onClick={() => setStatusFilter("drafted")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-tight transition duration-150 cursor-pointer ${
                    statusFilter === "drafted" 
                      ? "bg-primary text-white shadow-lg shadow-primary/10" 
                      : "bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  मस्यौदा भएका ({stories.filter(s => s.status === "drafted").length})
                </button>
                <button
                  onClick={() => setStatusFilter("ignored")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-tight transition duration-150 cursor-pointer ${
                    statusFilter === "ignored" 
                      ? "bg-primary text-white shadow-lg shadow-primary/10" 
                      : "bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  हटाएका ({stories.filter(s => s.status === "ignored").length})
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="शीर्षक, विवरण वा स्रोत खोज्नुहोस्..."
                    className="w-full bg-white dark:bg-slate-800 text-xs font-bold border border-slate-200 dark:border-slate-700/60 pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Category Dropdown */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full sm:w-auto bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {categoriesList.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* List of Discovered Stories */}
            <div className="flex flex-col gap-4">
              {filteredStories.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col items-center justify-center">
                  <Globe size={48} className="text-slate-300 dark:text-slate-600 mb-4 animate-pulse" />
                  <span className="font-extrabold text-lg mb-1">अहिले कुनै समाचार छैन</span>
                  <p className="text-slate-400 text-xs max-w-sm">
                    कृपया "नयाँ समाचार खोज्नुहोस्" बटनमा क्लिक गरी एआई इन्जिनलाई वेब स्क्यान गर्न लगाउनुहोस्।
                  </p>
                </div>
              ) : (
                filteredStories.map((story) => {
                  const dup = findExistingDuplicate(story.title);
                  const isHighRisk = dup.similarity > 60;
                  
                  return (
                    <div
                      key={story.id}
                      onClick={() => setSelectedStory(story)}
                      className={`bg-white dark:bg-slate-800 p-5 rounded-2xl border transition duration-200 cursor-pointer hover:shadow-xl ${
                        selectedStory?.id === story.id 
                          ? "border-primary dark:border-primary" 
                          : "border-slate-100 dark:border-slate-700/40 hover:border-slate-200 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight ${
                            story.category === "Breaking" 
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400" 
                              : story.category === "Government Notices"
                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400"
                              : story.category === "Disaster Alerts"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400"
                          }`}>
                            {story.category === "Breaking" ? "🔥 Breaking" : story.category === "Government Notices" ? "🏛️ Notice" : story.category === "Disaster Alerts" ? "🚨 Alert" : story.category}
                          </span>
                          
                          {story.district !== "None" && (
                            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-bold font-mono">
                              <MapPin size={12} className="text-primary" />
                              {story.district}
                            </span>
                          )}

                          {story.isGovNotice && story.governmentDept && (
                            <span className="bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30 px-2 py-0.5 rounded-md text-[10px] font-black">
                              {story.governmentDept}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400 font-bold font-mono whitespace-nowrap">
                          {story.freshnessMins} min ago
                        </span>
                      </div>

                      <h3 className="text-lg font-black leading-snug tracking-tight mb-2 hover:text-primary transition-colors">
                        {story.titleNe || story.title}
                      </h3>

                      {story.titleNe && story.titleNe !== story.title && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium italic mb-3 line-clamp-1">
                          Original: {story.title}
                        </p>
                      )}

                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-2 mb-4">
                        {story.summaryNe || story.summary}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-700/40">
                        <span className="text-[11px] text-slate-400 font-bold">
                          स्रोत: <span className="text-slate-600 dark:text-slate-300 font-black">{story.source}</span>
                        </span>

                        {/* Duplicate warning bar */}
                        {isHighRisk && (
                          <div className="flex items-center gap-1 text-rose-500 dark:text-rose-400 text-xs font-black animate-pulse">
                            <AlertCircle size={14} />
                            <span>{dup.similarity}% डुप्लिकेट जोखिम ({dup.title.substring(0, 20)}...)</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleIgnoreStory(story.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition"
                            title="Ignore story"
                          >
                            <X size={16} />
                          </button>
                          
                          {story.status === "new" && (
                            <button
                              onClick={() => handleGenerateDraft(story)}
                              disabled={isGeneratingDraft}
                              className="flex items-center gap-1 bg-primary/5 hover:bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer"
                            >
                              <Sparkles size={14} />
                              सम्पादकीय लेख जेनेरेट गर्नुहोस्
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sidebar / Detail Panel */}
          <div className="w-full lg:w-1/3">
            <AnimatePresence mode="wait">
              {selectedStory ? (
                <motion.div
                  key={selectedStory.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-lg sticky top-6"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4 mb-5">
                    <span className="font-extrabold text-sm uppercase tracking-wider text-slate-400">विस्तृत रिपोर्ट (Analytics)</span>
                    <button
                      onClick={() => setSelectedStory(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Smart Scores Radar/Progress Bars */}
                  {(() => {
                    const sc: any = selectedStory.scores || selectedStory.scoreBreakdown || {};
                    const freshnessVal = Number(sc.freshness) || 95;
                    const authorityVal = Number(sc.authority) || 90;
                    const relevanceVal = Number(sc.relevance) || 85;
                    const civilizationalVal = Number(sc.civilizational ?? sc.civilizationalImpact) || 75;
                    const communityVal = Number(sc.communityInterest) || 80;
                    const duplicateRiskVal = Number(sc.duplicateRisk) || 10;
                    const smartScore = Math.round((freshnessVal + authorityVal + relevanceVal + civilizationalVal + communityVal - duplicateRiskVal) / 5);

                    return (
                      <>
                        <h4 className="text-sm font-black uppercase tracking-tight text-slate-400 mb-4">
                          AI स्मार्ट स्कोरिङ (Smart Score: {smartScore})
                        </h4>

                        <div className="flex flex-col gap-3.5 mb-6">
                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span>ताजगी (Freshness)</span>
                              <span className="font-mono">{freshnessVal}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${freshnessVal}%` }}></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span>स्रोत विश्वसनीयता (Authority)</span>
                              <span className="font-mono">{authorityVal}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-sky-500 h-full rounded-full" style={{ width: `${authorityVal}%` }}></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span>क्षेत्रीय/राष्ट्रिय सान्दर्भिकता (Relevance)</span>
                              <span className="font-mono">{relevanceVal}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${relevanceVal}%` }}></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span>सांस्कृतिक/वैचारिक महत्त्व (Civilizational)</span>
                              <span className="font-mono">{civilizationalVal}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${civilizationalVal}%` }}></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span>सामुदायिक चासो (Community Interest)</span>
                              <span className="font-mono">{communityVal}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-pink-500 h-full rounded-full" style={{ width: `${communityVal}%` }}></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span>डुप्लिकेट जोखिम (Duplicate Risk)</span>
                              <span className="font-mono text-rose-500">{duplicateRiskVal}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-rose-500 h-full rounded-full" style={{ width: `${duplicateRiskVal}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* District / Meta */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-6 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-400">स्रोत यूआरएल:</span>
                      {selectedStory.sourceUrl ? (
                        <a 
                          href={selectedStory.sourceUrl.startsWith("http") ? selectedStory.sourceUrl : `https://${selectedStory.sourceUrl}`} 
                          target="_blank" 
                          referrerPolicy="no-referrer"
                          rel="noopener noreferrer" 
                          className="text-primary font-black hover:underline flex items-center gap-0.5"
                        >
                          वेबसाइट हेर्नुहोस् <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="font-mono text-slate-400">Not Available</span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-400">जिल्ला OS हब:</span>
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-black">{selectedStory.district}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-400">सरकारी नोटिस मनिटर:</span>
                      <span className="font-black">{selectedStory.isGovNotice ? "🏛️ सक्रिय" : "❌ निष्क्रिय"}</span>
                    </div>
                  </div>

                  {/* Summary Details */}
                  <h4 className="text-xs font-black uppercase tracking-tight text-slate-400 mb-2">एआई विवरण सारांश (Summary)</h4>
                  <p className="text-xs font-bold leading-relaxed mb-6">{selectedStory.summaryNe || selectedStory.summary}</p>

                  {/* Tag list */}
                  <div className="flex flex-wrap gap-1.5 mb-8">
                    {selectedStory.tags.map((t, i) => (
                      <span key={i} className="bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-500">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Bottom Action buttons */}
                  {selectedStory.status === "new" && (
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => handleGenerateDraft(selectedStory)}
                        disabled={isGeneratingDraft}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-700 text-white font-black text-xs py-3.5 rounded-xl shadow-lg shadow-primary/10 transition cursor-pointer disabled:opacity-50"
                      >
                        {isGeneratingDraft ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        सम्पादकीय लेख जेनेरेट गर्नुहोस्
                      </button>
                      <button
                        onClick={() => handleIgnoreStory(selectedStory.id)}
                        className="w-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                      >
                        खोज सूचीबाट हटाउनुहोस् (Ignore)
                      </button>
                    </div>
                  )}

                  {selectedStory.status === "drafted" && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl text-center flex flex-col items-center">
                      <Check className="text-emerald-500 mb-1" size={24} />
                      <span className="text-xs font-black text-emerald-800 dark:text-emerald-400">यो स्टोरी ड्राफ्ट भइसकेको छ</span>
                      <p className="text-[10px] text-slate-400 mt-1">
                        यो समाचारको नेपाली अनुवाद र मस्यौदा "सामग्री व्यवस्थापन &gt; समाचारहरू" अन्तर्गत ड्राफ्ट क्युमा सुरक्षित छ।
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="bg-slate-100/50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400 dark:text-slate-500 text-xs py-16 sticky top-6">
                  <FileText size={32} className="mx-auto mb-3 opacity-40" />
                  स्टोरी चयन गर्नुहोस् वा विस्तृत रिपोर्ट हेर्नुहोस्।
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* 06:00 AM Morning Editorial Digest Modal */}
        <AnimatePresence>
          {showDigestModal && morningDigest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                      <Newspaper size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white font-sans">
                        बिहानी सम्पादकीय ब्रिफिङ (06:00 AM Digest)
                      </h2>
                      <p className="text-xs font-semibold text-slate-500">
                        {morningDigest.targetDateNepali}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDigestModal(false)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Civilizational & Panchang Note */}
                <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-slate-800 dark:text-slate-200 text-xs leading-relaxed">
                  <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">
                    🕉️ दैनिक पञ्चाङ्ग तथा सम्पादकीय संकल्प:
                  </span>
                  {morningDigest.civilizationalPanchangNote}
                </div>

                {/* Top National Stories */}
                <div className="mb-6">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    शीर्ष राष्ट्रिय प्राथमिकताका विषयहरू (Top Stories)
                  </h3>
                  <div className="space-y-2.5">
                    {morningDigest.topNationalStories.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-3"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span className="font-semibold">{item.source}</span>
                            <span>•</span>
                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{item.district}</span>
                            <span>•</span>
                            <span className="text-emerald-600 font-bold">Tier {item.tier} Verified</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Economic & District Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-blue-500" /> आर्थिक परिसूचक
                    </h4>
                    {morningDigest.economicIndices.map((eco, idx) => (
                      <div key={idx} className="mb-2 last:mb-0 text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{eco.indexName}:</span>{" "}
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{eco.status}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">{eco.summary}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-amber-500" /> जिल्लागत अलर्ट
                    </h4>
                    {morningDigest.districtAlerts.map((alt, idx) => (
                      <div key={idx} className="mb-2 last:mb-0 text-xs">
                        <span className="font-bold text-amber-600 dark:text-amber-400">[{alt.district}]:</span>{" "}
                        <span className="text-slate-700 dark:text-slate-300">{alt.alert}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setShowDigestModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    बन्द गर्नुहोस्
                  </button>
                  <button
                    onClick={() => {
                      setShowDigestModal(false);
                      handlePollWires();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/90"
                  >
                    नयाँ तार फिड रिफ्रेस गर्नुहोस्
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
}
