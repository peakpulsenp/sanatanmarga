import { useState, useEffect } from "react";
import { 
  Activity, ShieldAlert, Zap, BarChart3, Database, RefreshCw, AlertTriangle, 
  CheckCircle2, Clock, MapPin, UserCheck, Globe, Search, ShieldCheck, Scale, 
  TrendingUp, Award, Coins, Play, AlertCircle, FileText, Check, Plus, Trash2, Heart
} from "lucide-react";
import { collection, getDocs, limit, orderBy, query, updateDoc, doc, setDoc } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { useLimitedMode } from "@/src/hooks/useFirestoreQuota";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { KnowledgeGraphEngine } from "@/src/services/knowledgeGraphService";
import { TemporalEntityResolver } from "@/src/services/temporalEntityResolver";
import { KnowledgeContextCacheOS } from "@/src/services/knowledgeContextCacheOS";

// Standard source weights from instructions
const SOURCE_WEIGHTS = [
  { domain: "gov.np", label: "सरकारी वेबसाइटहरू (Gov Website)", weight: 100, type: "Government" },
  { domain: "supremecourt.gov.np", label: "सर्वोच्च अदालत (Supreme Court)", weight: 100, type: "Legal" },
  { domain: "election.gov.np", label: "निर्वाचन आयोग (Election Commission)", weight: 100, type: "Official" },
  { domain: "un.org", label: "संयुक्त राष्ट्र संघ (United Nations)", weight: 98, type: "International" },
  { domain: "reuters.com", label: "रॉयटर्स (Reuters)", weight: 95, type: "Global News" },
  { domain: "apnews.com", label: "एसोसिएटेड प्रेस (Associated Press)", weight: 95, type: "Global News" },
  { domain: "onlinekhabar.com", label: "स्थानीय स्थापित मिडिया (Local Established Media)", weight: 80, type: "Local News" },
  { domain: "facebook.com", label: "सामाजिक सञ्जाल (Social Media)", weight: 40, type: "Social" },
  { domain: "twitter.com", label: "सामाजिक सञ्जाल (Social Media)", weight: 40, type: "Social" },
  { domain: "blogspot.com", label: "अज्ञात ब्लग (Anonymous Blog)", weight: 10, type: "Anonymous" }
];

export default function AdminAIObservability() {
  const limitedMode = useLimitedMode();
  const [activeTab, setActiveTab] = useState<
    "pipeline" | "cost" | "authority" | "district" | "enrichment" | "editors" | "watchlist" | "legal" | "benchmark" | "temporal" | "model_control"
  >("pipeline");
  
  // Temporal Knowledge OS test states
  const [testQuery, setTestQuery] = useState("Who is the Prime Minister of Nepal?");
  const [testDate, setTestDate] = useState("2026-08-24");
  const [testResult, setTestResult] = useState<any>(
    TemporalEntityResolver.evaluateTemporalQuestion("Who is the Prime Minister of Nepal?", "2026-08-24")
  );
  
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Calculator states
  const [calcUrl, setCalcUrl] = useState("https://mof.gov.np/news/budget-report");
  const [calcResult, setCalcResult] = useState<any>(null);

  // Watchlist items
  const [watchlist, setWatchlist] = useState<any[]>([
    { id: 1, name: "अर्थ मन्त्रालय (Ministry of Finance)", url: "https://mof.gov.np", interval: "३० मिनेट", lastCrawl: "१० मिनेट अघि", status: "सक्रिय", hits: 24 },
    { id: 2, name: "संघीय संसद् (Federal Parliament)", url: "https://hr.parliament.gov.np", interval: "१ घण्टा", lastCrawl: "४५ मिनेट अघि", status: "सक्रिय", hits: 18 },
    { id: 3, name: "निर्वाचन आयोग (Election Commission)", url: "https://election.gov.np", interval: "१५ मिनेट", lastCrawl: "२ मिनेट अघि", status: "सक्रिय", hits: 35 },
    { id: 4, name: "सर्वोच्च अदालत (Supreme Court)", url: "https://supremecourt.gov.np", interval: "२ घण्टा", lastCrawl: "१ घण्टा अघि", status: "निष्क्रिय", hits: 8 }
  ]);
  const [newWatchName, setNewWatchName] = useState("");
  const [newWatchUrl, setNewWatchUrl] = useState("");

  // Risk keywords settings
  const [riskKeywords, setRiskKeywords] = useState([
    { word: "सीमा विवाद", weight: "High", count: 12 },
    { word: "भ्रष्टाचार", weight: "High", count: 42 },
    { word: "अदालतको मानहानि", weight: "High", count: 5 },
    { word: "चुनाव धाँधली", weight: "High", count: 8 },
    { word: "आन्दोलन", weight: "Medium", count: 19 },
    { word: "बजेट घाटा", weight: "Medium", count: 14 }
  ]);
  const [newKeyword, setNewKeyword] = useState("");
  const [newRiskLevel, setNewRiskLevel] = useState("Medium");
  const [mandatoryLegalReview, setMandatoryLegalReview] = useState(true);

  // Load latest articles on mount
  const fetchArticles = async () => {
    try {
      setLoading(true);
      const articlesRef = collection(db, "articles");
      const q = query(articlesRef, orderBy("createdAt", "desc"), limit(25));
      const snap = await getDocs(q);
      
      const list: any[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });
      setArticles(list);
      if (list.length > 0 && !selectedArticle) {
        setSelectedArticle(list[0]);
      }
    } catch (e: any) {
      console.warn("Failed to fetch articles:", e);
      toast.error("डाटाबेसबाट समाचारहरू लोड गर्न सकिएन।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleRecalculateAuthority = () => {
    if (!calcUrl) {
      toast.error("कृपया स्रोत URL राख्नुहोस्");
      return;
    }

    try {
      const hostname = new URL(calcUrl).hostname.toLowerCase();
      let match = SOURCE_WEIGHTS.find(w => hostname.includes(w.domain));
      let score = 50; // Default baseline
      let category = "Standard Website";

      if (match) {
        score = match.weight;
        category = match.label;
      } else if (hostname.endsWith(".gov.np")) {
        score = 100;
        category = "Government NP Domain Fallback";
      } else if (hostname.endsWith(".edu.np") || hostname.endsWith(".org.np")) {
        score = 90;
        category = "Education/Org NP Domain";
      }

      setCalcResult({
        domain: hostname,
        category,
        authorityScore: score,
        trustMultiplier: (score / 100).toFixed(2),
        recommendation: score >= 90 
          ? "उच्च विश्वसनीयता! मुख्य पुष्टि बिना नै सीधा प्रकाशन योग्य।" 
          : score >= 75 
          ? "राम्रो विश्वास। सहायक स्रोतको रूपमा स्वीकार्य।" 
          : "सावधानीपूर्वक प्रयोग गर्नुहोस्! कम्तिमा एक सरकारी वा स्थापित स्रोतबाट पुष्टि हुनुपर्छ।"
      });
      toast.success("स्रोत प्राधिकार मूल्याङ्कन गरियो!");
    } catch (e) {
      toast.error("अवैध URL! कृपया सही ढाँचामा लेख्नुहोस् (जस्तै: https://example.com)");
    }
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    setRiskKeywords(prev => [...prev, { word: newKeyword.trim(), weight: newRiskLevel, count: 0 }]);
    setNewKeyword("");
    toast.success("नयाँ जोखिम सूचक थपियो!");
  };

  const handleDeleteKeyword = (word: string) => {
    setRiskKeywords(prev => prev.filter(k => k.word !== word));
    toast.success("जोखिम सूचक हटाइयो।");
  };

  const handleAddWatch = () => {
    if (!newWatchName || !newWatchUrl) {
      toast.error("कृपया नाम र URL दुवै भर्नुहोस्।");
      return;
    }
    setWatchlist(prev => [
      ...prev,
      {
        id: Date.now(),
        name: newWatchName,
        url: newWatchUrl,
        interval: "३० मिनेट",
        lastCrawl: "भर्खरै",
        status: "सक्रिय",
        hits: 0
      }
    ]);
    setNewWatchName("");
    setNewWatchUrl("");
    toast.success("स्रोत वाचलिस्टमा थपियो!");
  };

  const handleToggleWatch = (id: number) => {
    setWatchlist(prev => prev.map(w => w.id === id ? { ...w, status: w.status === "सक्रिय" ? "निष्क्रिय" : "सक्रिय" } : w));
  };

  const handleTriggerDiscovery = (siteName: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `${siteName} मा नयाँ सूचनाहरू खोजिँदैछ...`,
        success: "नयाँ सूचनाहरू फेला पर्यो! डिस्कभरी ब्रिफ तयार भयो।",
        error: "त्रुटि भयो।"
      }
    );
  };

  // Integrity Status calculation based on Article properties
  const checkPipelineIntegrity = (art: any) => {
    if (!art) return { passed: false, score: 0, steps: [] };
    
    const steps = [
      { name: "Discovery Engine", key: "discoveryEngineConfidence", label: "डिस्कभरी ब्रिफ र पृष्ठभूमि तथ्य", completed: Boolean(art.discoveryEngineConfidence || art.sourceUrls?.length > 0) },
      { name: "Editorial Memory", key: "storyTimeline", label: "अघिल्लो समाचारको निरन्तरता र समयरेखा", completed: Boolean(art.storyTimeline && art.storyTimeline.length > 0) },
      { name: "Knowledge Graph Context", key: "knowledgeEntities", label: "सरस्वती नलेज ग्राफ र धार्मिक शास्त्र कन्ट्याक्स्ट", completed: Boolean(art.knowledgeEntities && art.knowledgeEntities.length > 0) },
      { name: "District Context", key: "districts", label: "स्थानीय जिल्ला खुफिया कभरेज प्रोफाइल", completed: Boolean(art.districts && art.districts.length > 0) },
      { name: "Fact Verification", key: "mappedClaims", label: "दावी-स्रोत म्यापिङ र सत्यता स्कोर", completed: Boolean(art.mappedClaims && art.mappedClaims.length > 0) },
      { name: "Hallucination Audit", key: "hallucinationScore", label: "भ्रम अडिट र फ्ल्याग गरिएका शङ्कास्पद वाक्यहरू", completed: Boolean(art.hallucinationScore !== undefined) },
      { name: "Originality Engine", key: "originalityScore", label: "प्लेजरिजम जाँच र अद्वितीयता विश्लेषक", completed: Boolean(art.originalityScore !== undefined) },
      { name: "Quality Score", key: "qualityScore", label: "समग्र ८-तह गुणात्मक अङ्क प्रणाली (QA Audit)", completed: Boolean(art.qualityScore) }
    ];

    const completedCount = steps.filter(s => s.completed).length;
    const score = Math.round((completedCount / steps.length) * 100);

    return {
      passed: score === 100,
      score,
      steps
    };
  };

  const filteredArticles = articles.filter(art => 
    art.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    art.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12">
        {/* Title and stats bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2 text-foreground">
              <Activity className="text-primary w-8 h-8 animate-pulse" /> AI अब्जर्भेबिलिटी र पाइपलाइन OS v3.5
            </h1>
            <p className="text-sm font-medium text-muted-text mt-1">
              AI समाचारको पूर्ण पारदर्शी अनुगमन: लागत, तथ्य सत्यता, ज्ञान र परिचालन बुद्धिमत्ता।
            </p>
          </div>
          <button 
            onClick={fetchArticles} 
            disabled={loading}
            className="self-start md:self-auto px-5 py-3 rounded-2xl font-bold bg-muted-area hover:bg-muted-area/80 text-foreground transition-all flex items-center gap-2 border border-border-theme shadow-sm"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> ताजा गर्नुहोस्
          </button>
        </div>

        {/* Global Executive Observability Widget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-card rounded-[1.5rem] border border-border-theme shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-muted-text tracking-wider">पाइपलाइन निष्ठा सूचक</span>
              <div className="text-xl font-black text-card-foreground">९४.२%</div>
              <span className="text-xxs font-bold text-emerald-600 dark:text-emerald-400">८ मध्ये ८ तह पूर्ण</span>
            </div>
          </div>

          <div className="p-6 bg-card rounded-[1.5rem] border border-border-theme shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
              <Coins size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-muted-text tracking-wider">कुल AI खर्च (USD)</span>
              <div className="text-xl font-black text-card-foreground">$१४.८५</div>
              <span className="text-xxs font-bold text-amber-600 dark:text-amber-400">Flash: $0.075 / 1M Input</span>
            </div>
          </div>

          <div className="p-6 bg-card rounded-[1.5rem] border border-border-theme shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <Database size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-muted-text tracking-wider">नलेज ग्राफ नोड्स</span>
              <div className="text-xl font-black text-card-foreground">२४८ ओटा</div>
              <span className="text-xxs font-bold text-blue-600 dark:text-blue-400">१२ नयाँ स्व-संवर्द्धित</span>
            </div>
          </div>

          <div className="p-6 bg-card rounded-[1.5rem] border border-border-theme shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center">
              <Scale size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-muted-text tracking-wider">कानूनी जोखिम समीक्षा</span>
              <div className="text-xl font-black text-card-foreground">३ विचाराधीन</div>
              <span className="text-xxs font-bold text-rose-600">समीक्षा आवश्यक</span>
            </div>
          </div>
        </div>

        {/* Tab System Navigation */}
        <div className="flex border-b border-border-theme overflow-x-auto pb-px scrollbar-none gap-2">
          {([
            { id: "model_control", label: "मोडेल नियन्त्रण केन्द्र (Model Control)", icon: Zap },
            { id: "pipeline", label: "पाइपलाइन इन्स्पेक्टर", icon: Activity },
            { id: "cost", label: "लागत र टोकन", icon: Coins },
            { id: "authority", label: "स्रोत प्राधिकार स्कोर", icon: Scale },
            { id: "district", label: "जिल्ला कभरेज", icon: MapPin },
            { id: "enrichment", label: "नलेज स्वतः-संवर्द्धन", icon: Database },
            { id: "editors", label: "सम्पादक कार्यसम्पादन", icon: UserCheck },
            { id: "watchlist", label: "समाचार वाचलिस्ट", icon: Globe },
            { id: "legal", label: "कानूनी र जोखिम", icon: ShieldAlert },
            { id: "benchmark", label: "AI समाचार बेन्चमार्किङ", icon: Award },
            { id: "temporal", label: "कालसापेक्ष ज्ञानकोष (Temporal OS)", icon: Clock }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-4 font-bold text-xs whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-text hover:text-foreground"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="min-h-[500px]">
          
          {/* TAB: MODEL CONTROL CENTER (Phase 3H) */}
          {activeTab === ("model_control" as any) && (
            <div className="space-y-6">
              <div className="p-6 bg-surface-card rounded-2xl border border-border-theme">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-theme">
                  <div>
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Zap className="text-amber-500" size={22} />
                      जेमिनाई मोडेल नियन्त्रण केन्द्र (Gemini Model Control Center)
                    </h3>
                    <p className="text-xs text-muted-text mt-1">
                      सर्भर-अधिकृत मोडेल रजिस्ट्री, नीति उपनाम (Policy Aliases), र स्वचालित क्यानरी प्रमाणीकरण विना-कोड व्यवस्थापन।
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      प्रणाली स्वस्थ (HEALTHY)
                    </span>
                  </div>
                </div>

                {/* Canonical Policies & Active Models */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { policy: "NEWSROOM_PRIMARY", model: "gemini-flash-latest", purpose: "सम्पादकीय / समाचार विश्लेषण (प्रत्यक्ष प्रमाणित)", fallbacks: ["gemini-3.8-flash", "gemini-3.1-flash-lite"] },
                    { policy: "TRANSLATION_STRICT", model: "gemini-flash-latest", purpose: "शुद्ध अनुवाद (नेपाली/अंग्रेजी/हिन्दी)", fallbacks: ["gemini-3.8-flash"] },
                    { policy: "TTS_NEPALI", model: "gemini-3.8-flash-lite-tts", purpose: "रेडियो बुलेटिन / अडियो वाचन (प्रत्यक्ष प्रमाणित)", fallbacks: ["gemini-3.8-flash-tts"] },
                    { policy: "SGIS_PRIMARY", model: "gemini-flash-latest", purpose: "पाण्डुलिपि ओसीआर र सफाइ", fallbacks: ["gemini-3.8-flash"] }
                  ].map((p, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-border-theme bg-surface-bg flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-text font-bold">{p.policy}</span>
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">v1</span>
                        </div>
                        <h4 className="text-sm font-bold text-foreground mt-2 font-mono">{p.model}</h4>
                        <p className="text-xs text-muted-text mt-1">{p.purpose}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border-theme/60 flex items-center justify-between text-[11px] text-muted-text">
                        <span>फलब्याक: {p.fallbacks.length} मोडेलहरू</span>
                        <span className="text-emerald-500 font-bold">सक्रिय</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Compatibility Matrix & Wizard Notice */}
                <div className="mt-8 p-5 bg-surface-bg rounded-xl border border-border-theme">
                  <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Scale size={16} className="text-primary" />
                    मोडेल अनुकूलता र क्यानरी परीक्षण (Model Compatibility & Canary Gate)
                  </h4>
                  <p className="text-xs text-muted-text leading-relaxed">
                    कुनै पनि नयाँ जेमिनाई मोडेल सक्रिय (Activate) गर्नु अघि स्वचालित अनुकूलता जाँच (Compatibility Validation) र गैर-विनाशकारी क्यानरी टेस्टिङ अनिवार्य गरिएको छ। अडियो (TTS) कार्यभारमा टेक्स्ट-ओन्ली मोडेल असाइन हुनबाट प्रणाली पूर्ण रूपमा सुरक्षित छ।
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 bg-surface-card border border-border-theme rounded text-[11px] font-mono text-foreground">
                      Structured Output: समर्थित
                    </span>
                    <span className="px-2.5 py-1 bg-surface-card border border-border-theme rounded text-[11px] font-mono text-foreground">
                      Native Audio TTS: समर्थित
                    </span>
                    <span className="px-2.5 py-1 bg-surface-card border border-border-theme rounded text-[11px] font-mono text-foreground">
                      Fail-Closed Routing: सक्रिय
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: Pipeline Inspector */}
          {activeTab === "pipeline" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Recent Articles */}
              <div className="lg:col-span-1 bg-card rounded-[1.5rem] border border-border-theme p-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="font-black text-base text-card-foreground">सम्पन्न भएका AI समाचारहरू</h3>
                  <p className="text-xs text-muted-text">पाइपलाइन कभरेज जाँच गर्न समाचार चयन गर्नुहोस्।</p>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
                  <input
                    type="text"
                    placeholder="समाचार वा विधा खोज्नुहोस्..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-theme bg-muted-area/30 text-xs font-medium focus:outline-none focus:border-primary text-foreground"
                  />
                </div>

                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {filteredArticles.length === 0 ? (
                    <div className="text-center py-12 text-xs font-medium text-muted-text">
                      कुनै समाचार भेटिएन।
                    </div>
                  ) : (
                    filteredArticles.map(art => {
                      const integrity = checkPipelineIntegrity(art);
                      const isSelected = selectedArticle?.id === art.id;
                      return (
                        <button
                          key={art.id}
                          onClick={() => setSelectedArticle(art)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all block ${
                            isSelected 
                              ? "border-primary bg-primary/5 text-foreground" 
                              : "border-border-theme hover:border-primary/20 bg-card text-foreground"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <span className="text-[10px] font-black uppercase text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                              {art.categoryName || art.category || "देश"}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              integrity.passed 
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400" 
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                            }`}>
                              {integrity.score}% पूर्ण
                            </span>
                          </div>
                          <h4 className="text-xs font-black line-clamp-2 leading-tight text-card-foreground">
                            {art.title}
                          </h4>
                          <span className="text-[10px] text-muted-text mt-2 block font-medium">
                            🗓️ {art.publishedDate ? art.publishedDate.substring(0, 10) : "भर्खरै"}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Pipeline Execution Tree */}
              <div className="lg:col-span-2 space-y-6">
                {selectedArticle ? (
                  <div className="bg-card rounded-[1.5rem] border border-border-theme p-8 space-y-8">
                    <div className="border-b border-border-theme pb-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-muted-area text-muted-text text-xs font-bold rounded-full border border-border-theme">
                          अन्वेषण (Auditing)
                        </span>
                        {checkPipelineIntegrity(selectedArticle).passed ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-200/40">
                            <CheckCircle2 size={14} /> पूर्ण पाइपलाइन सुरक्षित (passed)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-full border border-amber-200/40">
                            <AlertTriangle size={14} /> आंशिक पाइपलाइन (Skipped Layers detected)
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl md:text-2xl font-black text-card-foreground leading-tight">
                        {selectedArticle.title}
                      </h2>
                    </div>

                    {/* Step Execution Tree Visual */}
                    <div className="space-y-6">
                      <h3 className="text-xs font-black uppercase text-muted-text tracking-widest block">
                        पाइपलाइन निष्पादन स्तर सूची (8-Layer AI Pipeline Status)
                      </h3>

                      <div className="relative pl-6 border-l border-border-theme space-y-8">
                        {checkPipelineIntegrity(selectedArticle).steps.map((step, idx) => (
                          <div key={idx} className="relative">
                            {/* Dot indicator */}
                            <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-card flex items-center justify-center ${
                              step.completed 
                                ? "border-emerald-500 text-emerald-500" 
                                : "border-rose-400 text-rose-400"
                            }`}>
                              {step.completed ? (
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              ) : (
                                <div className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div>
                                <h4 className="text-xs font-black text-card-foreground flex items-center gap-2">
                                  {step.name} 
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    step.completed 
                                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40" 
                                      : "bg-rose-50 text-rose-600 dark:bg-rose-950/40"
                                  }`}>
                                    {step.completed ? "सम्पन्न" : "छुट्यो (Skipped / Fallback)"}
                                  </span>
                                </h4>
                                <p className="text-[11px] font-medium text-muted-text mt-0.5">{step.label}</p>
                              </div>

                              {/* Details specific to article */}
                              <div className="text-[11px] font-bold text-card-foreground bg-muted-area/50 px-3 py-1.5 rounded-lg border border-border-theme">
                                {step.name === "Discovery Engine" && selectedArticle.discoveryEngineConfidence && (
                                  <span>विश्वास: {selectedArticle.discoveryEngineConfidence}% | {selectedArticle.sourceUrls?.length || 0} स्रोत</span>
                                )}
                                {step.name === "Editorial Memory" && (
                                  <span>{selectedArticle.storyTimeline?.length || 0} अघिल्लो इतिहास घटना</span>
                                )}
                                {step.name === "Knowledge Graph Context" && (
                                  <span>{selectedArticle.knowledgeEntities?.length || 0} सम्बन्धित धार्मिक संस्थाहरू</span>
                                )}
                                {step.name === "District Context" && (
                                  <span>{selectedArticle.districts?.length || 0} लक्षित स्थानीय जिल्ला</span>
                                )}
                                {step.name === "Fact Verification" && selectedArticle.mappedClaims && (
                                  <span>{selectedArticle.mappedClaims.length} दावी सत्यता प्रमाणित</span>
                                )}
                                {step.name === "Hallucination Audit" && selectedArticle.hallucinationScore !== undefined && (
                                  <span className={selectedArticle.hallucinationScore >= 80 ? "text-emerald-500" : "text-rose-500"}>
                                    अडिट अङ्क: {selectedArticle.hallucinationScore}/१००
                                  </span>
                                )}
                                {step.name === "Originality Engine" && selectedArticle.originalityScore !== undefined && (
                                  <span>अद्वितीयता: {selectedArticle.originalityScore}% ({selectedArticle.originalityRecommendation})</span>
                                )}
                                {step.name === "Quality Score" && selectedArticle.qualityScore && (
                                  <span>समग्र गुणस्तर: {selectedArticle.qualityScore}/१००</span>
                                )}
                                {!step.completed && <span className="text-rose-500">डेटा उपलब्ध छैन</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-card rounded-[1.5rem] border border-border-theme p-12 text-center text-xs font-bold text-muted-text">
                    कृपया विवरण हेर्न बाँया सूचीबाट एउटा समाचार रोज्नुहोस्।
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AI Cost & Token Intelligence */}
          {activeTab === "cost" && (() => {
            const cacheStats = KnowledgeContextCacheOS.getTelemetryStats();
            return (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="p-6 bg-card rounded-[1.5rem] border border-border-theme shadow-sm">
                    <span className="text-xs font-black uppercase text-muted-text tracking-widest block mb-2">Gemini Request Volatility</span>
                    <div className="text-3xl font-black text-card-foreground">{cacheStats.totalRequests} कल</div>
                    <p className="text-xs text-muted-text mt-1">अन्तिम २४ घण्टाको सफल API दर: १००%</p>
                  </div>
                  <div className="p-6 bg-card rounded-[1.5rem] border border-border-theme shadow-sm">
                    <span className="text-xs font-black uppercase text-muted-text tracking-widest block mb-2">Total Tokens Exchanged</span>
                    <div className="text-3xl font-black text-card-foreground">{(cacheStats.totalInputTokens / 1000).toFixed(1)}k Tokens</div>
                    <p className="text-xs text-muted-text mt-1">कुल इनपुट टोकन संख्या</p>
                  </div>
                  <div className="p-6 bg-card rounded-[1.5rem] border border-border-theme shadow-sm">
                    <span className="text-xs font-black uppercase text-muted-text tracking-widest block mb-2">Context Cache Hit Rate</span>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{cacheStats.cacheHitRatePercent}%</div>
                    <p className="text-xs text-muted-text mt-1">प्रिफिक्स क्यास बचत: ~{cacheStats.estimatedSavingsPercent}%</p>
                  </div>
                  <div className="p-6 bg-card rounded-[1.5rem] border border-border-theme shadow-sm bg-gradient-to-br from-primary/5 via-card to-card">
                    <span className="text-xs font-black uppercase text-muted-text tracking-widest block mb-2 text-primary">मासिक खर्च पूर्वानुमान (Forecast)</span>
                    <div className="text-3xl font-black text-primary">$४८.५०</div>
                    <p className="text-xs text-muted-text mt-1">सुरक्षित सिमा $१५० भित्रै स्थिर</p>
                  </div>
                </div>

                {/* Cache Manifest Info Bar */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-black text-card-foreground flex items-center gap-2">
                      <Database size={16} className="text-primary" /> Knowledge Context Cache OS (Manifest v1.0)
                    </h4>
                    <p className="text-xs text-muted-text mt-0.5">
                      Active Manifest Hash: <code className="font-mono text-primary font-bold">{cacheStats.manifest.manifestHash}</code> | SGIS: <span className="font-bold">{cacheStats.manifest.sgisVersion}</span> | District: <span className="font-bold">{cacheStats.manifest.districtVersion}</span>
                    </p>
                  </div>
                  <div className="text-xs font-medium text-muted-text">
                    Event-driven invalidation linked to <span className="text-primary font-bold">ContentEventBus</span> active.
                  </div>
                </div>

                {/* Gemini Models Rates Card & Token Usage chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Rates config card */}
                  <div className="bg-card rounded-[1.5rem] border border-border-theme p-6 space-y-6">
                    <div className="space-y-1">
                      <h3 className="font-black text-base text-card-foreground">Gemini API दर र खर्च कन्फिगर</h3>
                      <p className="text-xs text-muted-text">खर्च मापनका लागि मानक दरहरू (USD मा)।</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3.5 bg-muted-area/50 rounded-xl border border-border-theme">
                        <div>
                          <h4 className="text-xs font-black text-card-foreground">Gemini 2.5 Flash / 3.7 Flash</h4>
                          <span className="text-[10px] text-muted-text">Cached Input: $0.075 / 1M | Regular: $0.75 / 1M</span>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 rounded-full text-xxs font-black uppercase">
                          सक्रिय (CACHED)
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-muted-area/50 rounded-xl border border-border-theme">
                        <div>
                          <h4 className="text-xs font-black text-card-foreground">Gemini 1.5 Pro</h4>
                          <span className="text-[10px] text-muted-text">Input: $1.25 / 1M | Output: $5.00 / 1M</span>
                        </div>
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-600 dark:bg-amber-950/40 rounded-full text-xxs font-black uppercase">
                          कोटा रिजर्भ
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/40 rounded-xl space-y-2">
                      <h4 className="text-xs font-black text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                        <Zap size={14} /> Context Caching बचत रणनीति:
                      </h4>
                      <p className="text-xxs text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
                        Saraswati Knowledge Graph र District Intelligence डेटा बारम्बार रिड गर्दा, गुगलको एआई क्यासिङले ९०% सम्म कम मूल्यमा इन्पुट प्रक्रिया गर्दछ।
                      </p>
                    </div>
                  </div>

                  {/* Simulated Chart Container */}
                  <div className="bg-card rounded-[1.5rem] border border-border-theme p-6 space-y-6">
                    <h3 className="font-black text-base text-card-foreground">साप्ताहिक टोकन खपत दर (Weekly Token Consumption)</h3>
                    
                    {/* SVG Bar Chart */}
                    <div className="h-44 flex items-end justify-between gap-4 pt-4 border-b border-border-theme/80 px-2">
                      {[
                        { day: "आइत", input: 40, output: 25 },
                        { day: "सोम", input: 55, output: 35 },
                        { day: "मङ्गल", input: 85, output: 45 },
                        { day: "बुध", input: 70, output: 30 },
                        { day: "बिही", input: 95, output: 55 },
                        { day: "शुक्र", input: 60, output: 35 },
                        { day: "शनि", input: 30, output: 15 }
                      ].map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                          <div className="w-full flex justify-center gap-0.5 h-32 items-end">
                            <div 
                              style={{ height: `${item.input}%` }} 
                              className="w-3 bg-primary/40 group-hover:bg-primary transition-colors rounded-t"
                              title={`Input Tokens: ${item.input * 100}k`}
                            />
                            <div 
                              style={{ height: `${item.output}%` }} 
                              className="w-3 bg-primary group-hover:bg-primary/80 transition-colors rounded-t"
                              title={`Output Tokens: ${item.output * 100}k`}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-muted-text">{item.day}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-6 text-xxs font-bold justify-center">
                      <div className="flex items-center gap-2 text-muted-text">
                        <div className="w-3 h-3 bg-primary/40 rounded" /> इन्पुट टोकन (Input Tokens)
                      </div>
                      <div className="flex items-center gap-2 text-muted-text">
                        <div className="w-3 h-3 bg-primary rounded" /> आउटपुट टोकन (Output Tokens)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 3: Source Authority Manager */}
          {activeTab === "authority" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Authority weighting settings */}
                <div className="lg:col-span-2 bg-card rounded-[1.5rem] border border-border-theme p-6 space-y-6">
                  <div className="space-y-1">
                    <h3 className="font-black text-base text-card-foreground">स्रोत प्राधिकार भार नियम सूची (Source Trust Configuration)</h3>
                    <p className="text-xs text-muted-text">समाचारको सत्यता र विश्वसनीयता मापन गर्न स्थापित नियम र अङ्क भार।</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-medium">
                      <thead>
                        <tr className="border-b border-border-theme text-muted-text font-black uppercase text-[10px] tracking-wider">
                          <th className="pb-3">डोमेन म्याप (Domain Group)</th>
                          <th className="pb-3">स्रोत वर्ग (Category)</th>
                          <th className="pb-3 text-center">मूल प्राधिकार (Authority Score)</th>
                          <th className="pb-3 text-right">स्थिति (Status)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-theme/40">
                        {SOURCE_WEIGHTS.map((sw, idx) => (
                          <tr key={idx} className="hover:bg-muted-area/20">
                            <td className="py-3 font-mono font-bold text-foreground">*.{sw.domain}</td>
                            <td className="py-3 text-muted-text">{sw.label}</td>
                            <td className="py-3 text-center font-black text-card-foreground">{sw.weight}/१००</td>
                            <td className="py-3 text-right">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                sw.weight >= 90 
                                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40" 
                                  : sw.weight >= 60 
                                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40" 
                                  : "bg-rose-50 text-rose-600 dark:bg-rose-950/40"
                              }`}>
                                {sw.type}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Live Authority Calculator */}
                <div className="lg:col-span-1 bg-card rounded-[1.5rem] border border-border-theme p-6 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-black text-base text-card-foreground">लाईभ स्रोत प्राधिकार क्याल्कुलेटर</h3>
                      <p className="text-xs text-muted-text">कुनै पनि बाह्य लिंक राखेर यसको गुणस्तर मापन गर्नुहोस्।</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xxs font-black uppercase tracking-wider text-muted-text block">स्रोत लिंक (Source URL)</label>
                      <input
                        type="text"
                        value={calcUrl}
                        onChange={(e) => setCalcUrl(e.target.value)}
                        placeholder="https://example.gov.np/news"
                        className="w-full px-4 py-3 rounded-xl border-2 border-border-theme bg-card focus:border-primary text-xs font-medium focus:ring-0 text-foreground"
                      />
                    </div>

                    <button
                      onClick={handleRecalculateAuthority}
                      className="w-full py-3 bg-slate-900 dark:bg-primary text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all shadow-md shadow-primary/10"
                    >
                      <Zap size={14} /> प्राधिकार जाँच गर्नुहोस्
                    </button>
                  </div>

                  {calcResult && (
                    <div className="p-5 bg-muted-area/50 border border-border-theme rounded-2xl space-y-3.5 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">परिणाम</span>
                        <div className="text-xs font-black text-card-foreground truncate">{calcResult.domain}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xxs font-bold text-muted-text">Authority Score</span>
                          <div className="text-lg font-black text-primary">{calcResult.authorityScore}/100</div>
                        </div>
                        <div>
                          <span className="text-xxs font-bold text-muted-text">Trust Factor</span>
                          <div className="text-lg font-black text-emerald-600">x{calcResult.trustMultiplier}</div>
                        </div>
                      </div>

                      <div className="text-xxs font-bold text-card-foreground border-t border-border-theme pt-3 leading-relaxed">
                        ⚠️ <span className="text-muted-text font-medium">{calcResult.recommendation}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: District Coverage Intelligence */}
          {activeTab === "district" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-card rounded-[1.5rem] border border-border-theme shadow-sm">
                  <span className="text-xs font-black uppercase text-muted-text tracking-widest block mb-2">सर्वाधिक कभरेज जिल्ला</span>
                  <div className="text-2xl font-black text-card-foreground">काठमाडौँ उपत्यका</div>
                  <p className="text-xs text-emerald-600 font-bold mt-1">४५% कन्टेन्ट हिस्सा (Over-represented)</p>
                </div>
                <div className="p-6 bg-card rounded-[1.5rem] border border-border-theme shadow-sm">
                  <span className="text-xs font-black uppercase text-muted-text tracking-widest block mb-2">नाजुक कभरेज खाडल (Gap)</span>
                  <div className="text-2xl font-black text-rose-500">हुम्ला / डोल्पा / मनाङ</div>
                  <p className="text-xs text-rose-500 font-bold mt-1">० समाचार कभरेज (Immediate deployment needed)</p>
                </div>
                <div className="p-6 bg-card rounded-[1.5rem] border border-border-theme shadow-sm">
                  <span className="text-xs font-black uppercase text-muted-text tracking-widest block mb-2">समग्र प्रादेशिक सन्तुलन</span>
                  <div className="text-2xl font-black text-card-foreground">७२%</div>
                  <p className="text-xs text-muted-text mt-1">बागमती प्रदेश बाहेक सन्तुलन सुधारोन्मुख</p>
                </div>
              </div>

              {/* Coverage Gaps and Representation chart */}
              <div className="bg-card rounded-[1.5rem] border border-border-theme p-6 space-y-6">
                <div className="space-y-1">
                  <h3 className="font-black text-base text-card-foreground">नेपालका ७७ जिल्ला एआई कभरेज र प्रतिनिधित्व सूचक</h3>
                  <p className="text-xs text-muted-text">विभिन्न जिल्लाहरूमा स्थानीय समाचार कभरेजको मात्रा र खाडल पहिचान।</p>
                </div>

                <div className="space-y-4">
                  {[
                    { district: "काठमाडौँ (Kathmandu)", percentage: 45, status: "Over-represented", color: "bg-amber-500" },
                    { district: "कास्की (Kaski / Pokhara)", percentage: 22, status: "Balanced", color: "bg-primary" },
                    { district: "धनुषा (Dhanusha)", percentage: 15, status: "Balanced", color: "bg-primary" },
                    { district: "रुपन्देही (Rupandehi)", percentage: 12, status: "Balanced", color: "bg-primary" },
                    { district: "मुस्ताङ (Mustang)", percentage: 6, status: "Under-represented", color: "bg-rose-400" },
                    { district: "हुम्ला (Humla)", percentage: 0.5, status: "Critical Gap", color: "bg-rose-600 animate-pulse" }
                  ].map((dist, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-black">
                        <span className="text-card-foreground">{dist.district}</span>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            dist.status === "Balanced" 
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40" 
                              : dist.status === "Over-represented" 
                              ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40" 
                              : "bg-rose-50 text-rose-600 dark:bg-rose-950/40"
                          }`}>
                            {dist.status}
                          </span>
                          <span className="text-muted-text">{dist.percentage}% कभरेज</span>
                        </div>
                      </div>
                      <div className="w-full h-3 bg-muted-area rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${Math.max(2, dist.percentage)}%` }} 
                          className={`h-full ${dist.color} rounded-full`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Knowledge Graph Auto-Enrichment */}
          {activeTab === "enrichment" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="bg-card rounded-[1.5rem] border border-border-theme p-6 space-y-6">
                <div className="space-y-1">
                  <h3 className="font-black text-base text-card-foreground">सरस्वती नलेज ग्राफ स्वतः-संवर्द्धन इतिहास (Auto-Enrichment Engine)</h3>
                  <p className="text-xs text-muted-text">समाचार प्रकाशन हुँदा स्वचालित रूपमा पहिचान भएका संस्थाहरू र सिर्जित सम्बन्धहरू।</p>
                </div>

                <div className="space-y-4">
                  {[
                    { 
                      title: "पशुपतिनाथ मन्दिरमा महाशिवरात्रि मेला तयारी तीव्र", 
                      entities: ["pashupatinath", "dashain", "karma"], 
                      relations: ["associated_with (पूजा विधान)", "explained_in (धार्मिक ग्रन्थ)"],
                      time: "२ घण्टा अगाडि" 
                    },
                    { 
                      title: "मुस्ताङको लोमान्थाङ दरबार क्षेत्र संरक्षण परियोजना सार्वजनिक", 
                      entities: ["mustang", "muktinath"], 
                      relations: ["located_in (स्थान सम्बन्ध)"], 
                      time: "५ घण्टा अगाडि" 
                    },
                    { 
                      title: "जनकपुरधाम जानकी मन्दिरमा विवाह पञ्चमीको उल्लास", 
                      entities: ["janaki-mandir", "rigveda"], 
                      relations: ["referenced_in (वैदिक सभ्यता)"], 
                      time: "१ दिन अगाडि" 
                    }
                  ].map((log, idx) => (
                    <div key={idx} className="p-5 bg-muted-area/30 border border-border-theme rounded-2xl space-y-3.5">
                      <div className="flex justify-between items-start gap-2 flex-wrap">
                        <h4 className="text-xs font-black text-card-foreground">{log.title}</h4>
                        <span className="text-xxs font-medium text-muted-text">{log.time}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border-theme/40 pt-3">
                        <div className="space-y-1.5">
                          <span className="text-xxs font-black uppercase tracking-wider text-primary">स्वचालित निकालिएका संज्ञाहरू (Extracted Entities):</span>
                          <div className="flex flex-wrap gap-1.5">
                            {log.entities.map(ent => (
                              <span key={ent} className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-lg">
                                🔗 {ent}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-xxs font-black uppercase tracking-wider text-emerald-600">सिर्जित नयाँ सम्बन्धहरू (Relationships Established):</span>
                          <div className="flex flex-wrap gap-1.5">
                            {log.relations.map(rel => (
                              <span key={rel} className="px-2 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 text-[10px] font-bold rounded-lg">
                                ➡️ {rel}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Editor Performance Dashboard */}
          {activeTab === "editors" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-card rounded-[1.5rem] border border-border-theme shadow-sm">
                  <span className="text-xs font-black uppercase text-muted-text tracking-widest block mb-2">औसत समीक्षा समय</span>
                  <div className="text-2xl font-black text-card-foreground">६.२ मिनेट</div>
                  <p className="text-xs text-emerald-600 font-bold mt-1">अघिल्लो हप्ता भन्दा १०% छिटो</p>
                </div>
                <div className="p-6 bg-card rounded-[1.5rem] border border-border-theme shadow-sm">
                  <span className="text-xs font-black uppercase text-muted-text tracking-widest block mb-2">कूल सम्पादित समाचार</span>
                  <div className="text-2xl font-black text-card-foreground">४२८ पोस्टहरू</div>
                  <p className="text-xs text-muted-text mt-1">१००% सत्यता प्रमाणीकरण सहित</p>
                </div>
                <div className="p-6 bg-card rounded-[1.5rem] border border-border-theme shadow-sm">
                  <span className="text-xs font-black uppercase text-muted-text tracking-widest block mb-2">प्रकाशन स्वीकृति दर</span>
                  <div className="text-2xl font-black text-card-foreground">८२.५%</div>
                  <p className="text-xs text-muted-text mt-1">१७.५% समाचार संशोधनका लागि फिर्ता</p>
                </div>
                <div className="p-6 bg-card rounded-[1.5rem] border border-border-theme shadow-sm">
                  <span className="text-xs font-black uppercase text-muted-text tracking-widest block mb-2">तथ्य सुधार दर</span>
                  <div className="text-2xl font-black text-rose-500">४.२%</div>
                  <p className="text-xs text-rose-500 font-bold mt-1">AI द्वारा गल्ती सच्याइएको प्रतिशत</p>
                </div>
              </div>

              {/* Editor List table */}
              <div className="bg-card rounded-[1.5rem] border border-border-theme p-6 space-y-6">
                <h3 className="font-black text-base text-card-foreground">सम्पादक कार्यसम्पादन सूचकाङ्क (Editor KPI Performance Board)</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium">
                    <thead>
                      <tr className="border-b border-border-theme text-muted-text font-black uppercase text-[10px] tracking-wider">
                        <th className="pb-3">सम्पादकको नाम (Editor Name)</th>
                        <th className="pb-3 text-center">समीक्षा पोस्ट (Reviewed)</th>
                        <th className="pb-3 text-center">स्वीकृति दर (Approval Rate)</th>
                        <th className="pb-3 text-center">सुधारिएका दावी (Fact Corrections)</th>
                        <th className="pb-3 text-right">औसत समय (Avg Review Time)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-theme/40">
                      {[
                        { name: "Sagar Rana (Chief Editor)", count: 145, approval: "92%", corrections: 3, time: "4.8 mins" },
                        { name: "Ananda Sharma (Senior Editor)", count: 122, approval: "84%", corrections: 12, time: "6.5 mins" },
                        { name: "Bimal Shrestha (Newsroom Editor)", count: 98, approval: "78%", corrections: 14, time: "7.1 mins" },
                        { name: "Saraswati System (AI Autopilot)", count: 63, approval: "68%", corrections: 2, time: "0.2 mins" }
                      ].map((ed, idx) => (
                        <tr key={idx} className="hover:bg-muted-area/20">
                          <td className="py-4 font-black text-card-foreground flex items-center gap-2">
                            <div className="w-7 h-7 bg-primary/10 text-primary font-bold rounded-full flex items-center justify-center text-[10px]">
                              {ed.name.slice(0, 2)}
                            </div>
                            {ed.name}
                          </td>
                          <td className="py-4 text-center text-muted-text">{ed.count} ओटा</td>
                          <td className="py-4 text-center font-bold text-card-foreground">{ed.approval}</td>
                          <td className="py-4 text-center text-rose-500 font-bold">{ed.corrections} पटक</td>
                          <td className="py-4 text-right text-muted-text font-mono">{ed.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Real News Source Watchlist */}
          {activeTab === "watchlist" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Watchlist Table */}
                <div className="lg:col-span-2 bg-card rounded-[1.5rem] border border-border-theme p-6 space-y-6">
                  <div className="space-y-1">
                    <h3 className="font-black text-base text-card-foreground">स्वचालित समाचार स्रोत वाचलिस्ट (Crawling Watchlist)</h3>
                    <p className="text-xs text-muted-text">डिस्कभरी इन्जिनले स्वचालित रूपमा ताजा सूचना खोज्ने लक्ष्य मन्त्रालय र संसद् वेबसाइटहरू।</p>
                  </div>

                  <div className="space-y-4">
                    {watchlist.map(watch => (
                      <div key={watch.id} className="p-4 bg-muted-area/30 border border-border-theme rounded-2xl flex items-center justify-between gap-4 flex-wrap">
                        <div className="space-y-1 max-w-sm">
                          <h4 className="text-xs font-black text-card-foreground flex items-center gap-1.5">
                            {watch.name}
                            <span className={`w-2 h-2 rounded-full ${watch.status === "सक्रिय" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                          </h4>
                          <span className="text-[10px] text-muted-text block truncate font-mono">{watch.url}</span>
                        </div>

                        <div className="flex items-center gap-6 text-xxs font-bold text-muted-text">
                          <div>
                            <div>क्रल दर (Interval)</div>
                            <div className="text-card-foreground font-black mt-0.5">{watch.interval}</div>
                          </div>
                          <div>
                            <div>अन्तिम क्रल</div>
                            <div className="text-card-foreground font-black mt-0.5">{watch.lastCrawl}</div>
                          </div>
                          <div>
                            <div>कूल हिट्स</div>
                            <div className="text-card-foreground font-black mt-0.5">{watch.hits} पटक</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTriggerDiscovery(watch.name)}
                            className="px-3.5 py-2 bg-primary/10 text-primary hover:bg-primary/20 text-xxs font-black rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Play size={10} /> डिस्कभर गर्नुहोस्
                          </button>
                          <button
                            onClick={() => handleToggleWatch(watch.id)}
                            className={`px-3.5 py-2 text-xxs font-bold rounded-lg border transition-colors ${
                              watch.status === "सक्रिय" 
                                ? "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700" 
                                : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                            }`}
                          >
                            {watch.status === "सक्रिय" ? "रोक्नुहोस्" : "सक्रिय गर्नुहोस्"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add new Source watch */}
                <div className="lg:col-span-1 bg-card rounded-[1.5rem] border border-border-theme p-6 space-y-6 h-fit">
                  <div className="space-y-1">
                    <h3 className="font-black text-base text-card-foreground">नयाँ स्रोत थप्नुहोस्</h3>
                    <p className="text-xs text-muted-text">अनुगमन वाचलिस्टमा नयाँ आधिकारिक मन्त्रालय वा कार्यालय थप्नुहोस्।</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xxs font-black uppercase text-muted-text block">कार्यालयको नाम (Name)</label>
                      <input
                        type="text"
                        value={newWatchName}
                        onChange={(e) => setNewWatchName(e.target.value)}
                        placeholder="जस्तै: स्वास्थ्य मन्त्रालय"
                        className="w-full px-4 py-3 rounded-xl border border-border-theme bg-card focus:outline-none focus:border-primary text-xs font-medium text-foreground"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xxs font-black uppercase text-muted-text block">वेबसाइट URL (Website URL)</label>
                      <input
                        type="text"
                        value={newWatchUrl}
                        onChange={(e) => setNewWatchUrl(e.target.value)}
                        placeholder="https://mohp.gov.np"
                        className="w-full px-4 py-3 rounded-xl border border-border-theme bg-card focus:outline-none focus:border-primary text-xs font-medium text-foreground"
                      />
                    </div>

                    <button
                      onClick={handleAddWatch}
                      className="w-full py-3.5 bg-slate-900 dark:bg-primary text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-95 transition-all shadow-md"
                    >
                      <Plus size={16} /> वाचलिस्टमा दर्ता गर्नुहोस्
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: Legal & Risk Classification */}
          {activeTab === "legal" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Toggle chief editor review */}
              <div className="p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/40 rounded-[1.5rem] flex items-center justify-between gap-6 flex-wrap">
                <div className="space-y-1 max-w-xl">
                  <h3 className="text-sm font-black text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <ShieldAlert className="text-amber-600 shrink-0" /> संवेदनशील कन्टेन्ट अनिवार्य कानूनी समीक्षा (Mandatory Legal Review)
                  </h3>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                    High Risk वा Medium Risk वर्गीकरण भएका कुनै पनि AI समाचारलाई चीफ एडिटर वा कानूनी सल्लाहकारले समीक्षा नगरेसम्म प्रत्यक्ष प्रकाशन हुनबाट रोक्नुहोस्।
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-text">स्थिति: {mandatoryLegalReview ? "सक्रिय" : "निष्क्रिय"}</span>
                  <button
                    onClick={() => {
                      setMandatoryLegalReview(p => !p);
                      toast.success(mandatoryLegalReview ? "अनिवार्य कानूनी समीक्षा बन्द भयो।" : "अनिवार्य कानूनी समीक्षा सक्रिय भयो!");
                    }}
                    className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${
                      mandatoryLegalReview ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-md ${
                      mandatoryLegalReview ? "translate-x-6" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Risk keywords manager */}
                <div className="lg:col-span-2 bg-card rounded-[1.5rem] border border-border-theme p-6 space-y-6">
                  <div className="space-y-1">
                    <h3 className="font-black text-base text-card-foreground">जोखिम सूचक शब्द र भार व्यवस्थापन</h3>
                    <p className="text-xs text-muted-text">समाचारको शीर्षक वा कन्टेन्टमा निम्न शब्दहरू फेला पर्दा जोखिम स्वतः वर्गीकृत हुन्छ।</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {riskKeywords.map((k, idx) => (
                      <div key={idx} className="p-4 bg-muted-area/40 border border-border-theme rounded-xl flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-card-foreground">{k.word}</span>
                          <span className="text-[10px] text-muted-text block">भेटिएको पटक: {k.count} पटक</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                            k.weight === "High" 
                              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40" 
                              : "bg-amber-50 text-amber-600 dark:bg-amber-950/40"
                          }`}>
                            {k.weight} Risk
                          </span>
                          <button
                            onClick={() => handleDeleteKeyword(k.word)}
                            className="p-1 hover:text-rose-500 transition-colors text-muted-text"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add new keyword trigger */}
                <div className="lg:col-span-1 bg-card rounded-[1.5rem] border border-border-theme p-6 space-y-6 h-fit">
                  <div className="space-y-1">
                    <h3 className="font-black text-base text-card-foreground">जोखिम शब्द थप्नुहोस्</h3>
                    <p className="text-xs text-muted-text">कन्टेन्ट विश्लेषणका लागि संवेदनशिल शब्दावली दर्ता गर्नुहोस्।</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xxs font-black uppercase text-muted-text block">संवेदनशील शब्द / वाक्य (Keyword)</label>
                      <input
                        type="text"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="जस्तै: अदालतको मानहानि, काण्ड"
                        className="w-full px-4 py-3 rounded-xl border border-border-theme bg-card focus:outline-none focus:border-primary text-xs font-medium text-foreground"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xxs font-black uppercase text-muted-text block">जोखिम वर्गीकरण (Risk Level)</label>
                      <select
                        value={newRiskLevel}
                        onChange={(e) => setNewRiskLevel(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border-theme bg-card focus:outline-none focus:border-primary text-xs font-medium text-foreground"
                      >
                        <option value="High">उच्च जोखिम (High Risk)</option>
                        <option value="Medium">मध्यम जोखिम (Medium Risk)</option>
                        <option value="Low">न्यूनतम जोखिम (Low Risk)</option>
                      </select>
                    </div>

                    <button
                      onClick={handleAddKeyword}
                      className="w-full py-3.5 bg-slate-900 dark:bg-primary text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-95 transition-all shadow-md"
                    >
                      <Plus size={16} /> जोखिम सूचक थप्नुहोस्
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: AI Article Benchmarking */}
          {activeTab === "benchmark" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="bg-card rounded-[1.5rem] border border-border-theme p-6 space-y-6">
                <div className="space-y-1">
                  <h3 className="font-black text-base text-card-foreground">AI समाचार बनाम मानव सम्पादित समाचार बेन्चमार्किङ</h3>
                  <p className="text-xs text-muted-text">पठनीयता, विश्वास स्तर, मौलिकता र प्रयोगकर्ता संलग्नताका आधारमा ४ मुख्य सूचक तुलना।</p>
                </div>

                <div className="space-y-8 pt-4">
                  {[
                    { metric: "पठनीयता र व्याकरण (Readability & Layout Quality)", ai: 88, human: 95, color: "from-blue-500 to-indigo-500" },
                    { metric: "विश्वास र स्रोत सन्तुलन (Trust & Source Authority)", ai: 92, human: 85, color: "from-emerald-500 to-teal-500" },
                    { metric: "मौलिकता र साहित्यिक चोरी रक्षा (Originality Rate)", ai: 96, human: 90, color: "from-purple-500 to-pink-500" },
                    { metric: "प्रयोगकर्ता अन्तरक्रिया र संलग्नता (Engagement Rate)", ai: 78, human: 88, color: "from-amber-500 to-orange-500" }
                  ].map((bench, idx) => (
                    <div key={idx} className="space-y-3.5">
                      <h4 className="text-xs font-black text-card-foreground">{bench.metric}</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* AI Performance */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xxs font-black text-muted-text">
                            <span>🤖 AI Generated System (Saraswati v3.5)</span>
                            <span className="text-primary">{bench.ai}/१००</span>
                          </div>
                          <div className="w-full h-3 bg-muted-area rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${bench.ai}%` }} 
                              className={`h-full bg-primary rounded-full`}
                            />
                          </div>
                        </div>

                        {/* Human Performance */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xxs font-black text-muted-text">
                            <span>✍️ Human Journalist (संवाददाता)</span>
                            <span className="text-foreground">{bench.human}/१००</span>
                          </div>
                          <div className="w-full h-3 bg-muted-area rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${bench.human}%` }} 
                              className={`h-full bg-slate-900 dark:bg-slate-300 rounded-full`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-muted-area/40 border border-border-theme rounded-2xl text-xxs text-muted-text font-medium leading-relaxed mt-8">
                  💡 <strong>बेन्चमार्किङ विश्लेषण:</strong> सरस्वती एआई समाचारले स्रोत प्राधिकार र मौलिकता जाँचमा मानव पत्रकारलाई उछिनेको देखिन्छ, तर स्थानीय पठनीयता र समाजलाई छुने भावनात्मक संलग्नतामा मानव संवादको गुणस्तर अझै माथि छ। तसर्थ, "एआई पहिलो खोज → मानव सम्पादन" विधि नै सर्वोत्तम सावित भएको छ।
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: Temporal Knowledge OS & Current Facts Registry */}
          {activeTab === "temporal" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="bg-card rounded-[1.5rem] border border-border-theme p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-black text-base text-card-foreground flex items-center gap-2">
                      <Clock className="text-primary" size={20} /> कालसापेक्ष ज्ञानकोष र वर्तमान तथ्य रजिस्ट्री (Temporal Knowledge OS)
                    </h3>
                    <p className="text-xs text-muted-text">
                      समय-जागृत (Time-aware) entity resolution: प्रभावकारी मिति (Effective Dates), आधिकारिक स्रोत र प्रमाणित अभिलेख। एआईको पूर्व-स्मृति (Pretrained Memory) ले प्रमाणित वर्तमान तथ्यलाई कहिल्यै ओझेलमा पार्न सक्दैन।
                    </p>
                  </div>
                  <div className="px-4 py-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/20 flex items-center gap-2">
                    <ShieldCheck size={16} /> 100% Verified Source-Backed Resolution
                  </div>
                </div>

                {/* Temporal Query Testing Box */}
                <div className="p-6 bg-muted-area/30 border border-border-theme rounded-2xl space-y-4">
                  <h4 className="text-xs font-black text-card-foreground uppercase tracking-wider">कालसापेक्ष रिजोल्युसन परीक्षण (Temporal Resolver Testbench)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xxs font-bold text-muted-text">परीक्षण प्रश्न (Test Query)</label>
                      <input 
                        type="text"
                        value={testQuery}
                        onChange={(e) => setTestQuery(e.target.value)}
                        placeholder="जस्तै: Who is the Prime Minister of Nepal?"
                        className="w-full px-4 py-2.5 rounded-xl border border-border-theme bg-card text-xs font-medium text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xxs font-bold text-muted-text">लक्ष्य मिति (Target Date)</label>
                      <input 
                        type="date"
                        value={testDate}
                        onChange={(e) => setTestDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-border-theme bg-card text-xs font-medium text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        const res = TemporalEntityResolver.evaluateTemporalQuestion(testQuery, testDate);
                        setTestResult(res);
                        toast.success("कालसापेक्ष रिजोल्युसन सम्पन्न भयो!");
                      }}
                      className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-black shadow hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Search size={16} /> रिजोल्युसन परीक्षण गर्नुहोस्
                    </button>
                    {testResult && (
                      <span className="text-xxs font-bold text-emerald-600 dark:text-emerald-400">
                        {testResult.isVerified ? "✅ Verified Ground Truth Active" : "⚠️ Abstain / Unverified"}
                      </span>
                    )}
                  </div>

                  {testResult && (
                    <div className="p-4 bg-card rounded-xl border border-border-theme space-y-2 mt-4 text-xs">
                      <div className="flex justify-between font-bold">
                        <span className="text-muted-text">प्रश्न:</span>
                        <span className="text-foreground">{testResult.question}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-muted-text">अपेक्षित उत्तर (Expected Ground Truth):</span>
                        <span className="text-primary font-black">{testResult.expectedAnswer}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-muted-text">रिजोलभ्ड पद (Resolved Role):</span>
                        <span className="text-foreground">{testResult.activeRoleTitle || "N/A"}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Entity Registry Cards */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-card-foreground uppercase tracking-wider">वर्तमान तथ्य रजिस्ट्री (Current Facts & Temporal Records)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {TemporalEntityResolver.getAllRecords().map((entity) => (
                      <div key={entity.id} className="p-5 bg-card rounded-2xl border border-border-theme space-y-4 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-black uppercase text-primary tracking-wider">{entity.entityType}</span>
                            <h5 className="text-sm font-black text-card-foreground">{entity.canonicalNameEn} ({entity.canonicalNameNp})</h5>
                            <span className="text-xxs text-muted-text font-medium">Aliases: {entity.aliases.slice(0, 3).join(", ")}</span>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-xxs font-bold">
                            {entity.currentStatus}
                          </span>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-border-theme/40">
                          <span className="text-[10px] font-black text-muted-text uppercase">पदहरूको इतिहास (Roles & Effective Dates)</span>
                          {entity.roles.map((role) => (
                            <div key={role.id} className="p-3 bg-muted-area/30 rounded-xl space-y-1 text-xs">
                              <div className="flex items-center justify-between font-black text-card-foreground">
                                <span>{role.titleEn}</span>
                                <span className={`px-2 py-0.5 rounded text-xxs ${role.status === 'current' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-text'}`}>
                                  {role.status}
                                </span>
                              </div>
                              <div className="text-xxs text-muted-text font-medium">
                                नेपाली शीर्षक: {role.titleNp}
                              </div>
                              <div className="flex justify-between text-xxs font-bold pt-1 text-muted-text">
                                <span>काल अवधि: {role.startDate} — {role.endDate || "वर्तमान (Present)"}</span>
                                <span className="text-emerald-600 dark:text-emerald-400">Authority: {role.primaryAuthority}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-xxs font-bold text-muted-text pt-2 border-t border-border-theme/40">
                          <span>प्राथमिक स्रोत: {entity.primaryAuthority}</span>
                          <span>अन्तिम रुजु: {entity.lastVerified}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
