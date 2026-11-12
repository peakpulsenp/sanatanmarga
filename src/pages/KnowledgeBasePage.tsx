import { useState, useEffect, useRef } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/src/components/layout/Header";
import SEOHead from "@/src/components/common/SEOHead";
import Footer from "@/src/components/layout/Footer";
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  MapPin, 
  Layers, 
  Network, 
  Landmark, 
  Compass, 
  ShieldCheck, 
  ChevronRight, 
  FileText,
  Tag,
  Info,
  Calendar,
  ExternalLink,
  Share2,
  Check,
  RefreshCw,
  AlertTriangle,
  FileCode
} from "lucide-react";
import type { 
  KnowledgeEntity, 
  KnowledgeEdge, 
  ScriptureReference, 
  KnowledgeSnapshotMeta,
  KnowledgeCategory 
} from "@/src/types/knowledge";
import { knowledgeSnapshotService } from "@/src/services/knowledge/knowledgeSnapshotService";
import { knowledgeGraphEngine } from "@/src/services/knowledge/knowledgeGraphEngine";
import KnowledgeGraphViewer from "@/src/components/knowledge/KnowledgeGraphViewer";
import SgisDashboard from "@/src/components/knowledge/SgisDashboard";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

const CATEGORIES: { id: string; nameNepali: string; category?: KnowledgeCategory }[] = [
  { id: "all", nameNepali: "सबै ज्ञान बिन्दुहरू" },
  { id: "temple", nameNepali: "मन्दिर / धाम", category: "temple" },
  { id: "scripture", nameNepali: "वैदिक ग्रन्थ", category: "scripture" },
  { id: "festival", nameNepali: "चाडपर्व", category: "festival" },
  { id: "figure", nameNepali: "महान् व्यक्तित्व", category: "figure" },
  { id: "heritage", nameNepali: "सांस्कृतिक सम्पदा", category: "heritage" },
  { id: "organization", nameNepali: "संस्था तथा निकाय", category: "organization" }
];

export default function KnowledgeBasePage() {
  const { id: paramId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryEntityId = paramId || searchParams.get("entity") || searchParams.get("node") || searchParams.get("id");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [knowledgeView, setKnowledgeView] = useState<"entities" | "sgis">("entities");
  
  const [entities, setEntities] = useState<KnowledgeEntity[]>([]);
  const [edges, setEdges] = useState<KnowledgeEdge[]>([]);
  const [scriptureRefs, setScriptureRefs] = useState<ScriptureReference[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<KnowledgeEntity | null>(null);
  const [snapshotMeta, setSnapshotMeta] = useState<KnowledgeSnapshotMeta | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  
  // Breadcrumbs for graph traversal navigation
  const [breadcrumbs, setBreadcrumbs] = useState<KnowledgeEntity[]>([]);

  const detailContentRef = useRef<HTMLDivElement>(null);

  const scrollToDetail = () => {
    if (detailContentRef.current) {
      detailContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 1. Snapshot-First Loading (No real-time listeners, no client-side seeding)
  useEffect(() => {
    let isMounted = true;
    async function loadKnowledgeSnapshot() {
      setLoading(true);
      setErrorState(null);
      try {
        await knowledgeGraphEngine.load({ publicOnly: true });
        const { entities: loadedEntities, meta } = await knowledgeSnapshotService.getEntities({ publicOnly: true });
        const loadedEdges = await knowledgeSnapshotService.getEdges();
        const loadedRefs = await knowledgeSnapshotService.getReferences();

        if (isMounted) {
          setEntities(loadedEntities);
          setEdges(loadedEdges);
          setScriptureRefs(loadedRefs);
          setSnapshotMeta(meta);

          if (loadedEntities.length > 0) {
            // Initial selection based on URL parameter or default first
            if (queryEntityId) {
              const matched = loadedEntities.find(
                e => e.id.toLowerCase() === queryEntityId.toLowerCase() ||
                     e.canonicalId.toLowerCase() === queryEntityId.toLowerCase() ||
                     e.nameEnglish.toLowerCase() === queryEntityId.toLowerCase() ||
                     e.nameNepali === queryEntityId ||
                     (e.aliases && e.aliases.some(a => a.toLowerCase() === queryEntityId.toLowerCase()))
              );
              if (matched) {
                setSelectedEntity(matched);
                setBreadcrumbs([matched]);
              } else {
                setSelectedEntity(loadedEntities[0]);
                setBreadcrumbs([loadedEntities[0]]);
              }
            } else {
              setSelectedEntity(loadedEntities[0]);
              setBreadcrumbs([loadedEntities[0]]);
            }
          } else {
            setErrorState("NO_KNOWLEDGE_DATA");
          }
          setLoading(false);
        }
      } catch (err: any) {
        console.error("[KnowledgeBasePage] Snapshot load failed:", err);
        if (isMounted) {
          setErrorState("SNAPSHOT_UNAVAILABLE");
          setLoading(false);
        }
      }
    }

    loadKnowledgeSnapshot();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Respond to URL query entity change
  useEffect(() => {
    if (queryEntityId && entities.length > 0) {
      const match = entities.find(
        e => e.id.toLowerCase() === queryEntityId.toLowerCase() ||
             e.canonicalId.toLowerCase() === queryEntityId.toLowerCase() ||
             e.nameEnglish.toLowerCase() === queryEntityId.toLowerCase() ||
             e.nameNepali === queryEntityId ||
             (e.aliases && e.aliases.some(a => a.toLowerCase() === queryEntityId.toLowerCase()))
      );
      if (match && match.id !== selectedEntity?.id) {
        setSelectedEntity(match);
        setBreadcrumbs(prev => {
          if (prev.some(b => b.id === match.id)) return prev;
          return [...prev, match];
        });
        setTimeout(scrollToDetail, 80);
      }
    }
  }, [queryEntityId, entities]);

  // Handle user selecting an entity
  const handleSelectEntity = (entity: KnowledgeEntity) => {
    setSelectedEntity(entity);
    setSearchParams({ entity: entity.id });
    setBreadcrumbs(prev => {
      const existingIdx = prev.findIndex(b => b.id === entity.id);
      if (existingIdx >= 0) {
        return prev.slice(0, existingIdx + 1);
      }
      return [...prev, entity];
    });
    setTimeout(scrollToDetail, 50);
  };

  const handleNavigateBack = () => {
    if (breadcrumbs.length > 1) {
      const newBreadcrumbs = [...breadcrumbs];
      newBreadcrumbs.pop(); // remove current
      const previous = newBreadcrumbs[newBreadcrumbs.length - 1];
      setSelectedEntity(previous);
      setBreadcrumbs(newBreadcrumbs);
      setSearchParams({ entity: previous.id });
      setTimeout(scrollToDetail, 50);
    }
  };

  // Search & Filter Logic
  const filteredEntities = entities.filter((entity) => {
    const matchesCategory = selectedCategory === "all" || entity.category === selectedCategory;
    
    if (!searchTerm.trim()) return matchesCategory;

    const term = searchTerm.toLowerCase();
    const matchesNameNp = entity.nameNepali?.toLowerCase().includes(term);
    const matchesNameEn = entity.nameEnglish?.toLowerCase().includes(term);
    const matchesSanskrit = entity.sanskrit?.toLowerCase().includes(term);
    const matchesDesc = entity.description?.toLowerCase().includes(term);
    const matchesDistrict = entity.district?.toLowerCase().includes(term);
    const matchesProvince = entity.province?.toLowerCase().includes(term);
    const matchesCanonical = entity.canonicalId?.toLowerCase().includes(term);
    const matchesAliases = entity.aliases?.some(a => a.toLowerCase().includes(term));
    const matchesAttributes = Object.entries(entity.keyAttributes || {}).some(
      ([k, v]) => k.toLowerCase().includes(term) || String(v).toLowerCase().includes(term)
    );

    return matchesCategory && (
      matchesNameNp || 
      matchesNameEn || 
      matchesSanskrit || 
      matchesDesc || 
      matchesDistrict || 
      matchesProvince || 
      matchesCanonical || 
      matchesAliases || 
      matchesAttributes
    );
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      <SEOHead 
        title="सनातन ज्ञानकोष (Sanatan Knowledge OS) | SanatanMarga"
        description="नेपालका पावन मन्दिर, वैदिक ग्रन्थ, चाडपर्व, ऐतिहासिक धरोहर र सनातन सभ्यताको प्रमाणित ज्ञानकोष।"
        keywords="Sanatan Knowledge OS, नेपाल ज्ञानकोष, पशुपतिनाथ, मुक्तिनाथ, भगवद्गीता, ऋग्वेद, सनातन मन्दिर"
      />
      
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* TOP HERO & SEARCH BAR */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-primary/10 via-muted-area/30 to-card border border-border-theme p-6 sm:p-10 shadow-sm">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-black bg-primary text-white flex items-center gap-1.5 shadow-xs">
                <Network className="w-3.5 h-3.5" />
                SanatanMarga Knowledge OS R2
              </span>
              
              {snapshotMeta && (
                <span className="px-3 py-1 rounded-full text-xxs font-mono font-bold bg-muted-area text-muted-text border border-border-theme flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  SNAPSHOT v{snapshotMeta.snapshotVersion} ({snapshotMeta.source})
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-serif font-black text-card-foreground tracking-tight leading-tight">
              सनातन ज्ञानकोष र सभ्यता सञ्जाल
            </h1>

            <p className="text-sm sm:text-base text-muted-text leading-relaxed font-sans">
              नेपालका पावन मन्दिर, वैदिक शास्त्र, चाडपर्व, महान् व्यक्तित्व र सांस्कृतिक सम्पदाको प्रमाणित, सम्बन्ध-आधारित ज्ञान सञ्जाल (Knowledge Graph)।
            </p>

            {/* UNIFIED SEARCH INPUT */}
            <div className="relative pt-2">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-muted-text pointer-events-none" />
                <input
                  type="text"
                  placeholder="मन्दिर, ग्रन्थ, चाडपर्व, जिल्ला, देवता वा संस्कृत नाम खोज्नुहोस्..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-card border border-border-theme focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-medium text-foreground transition-all shadow-xs outline-hidden"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3.5 px-2 py-1 text-xs text-muted-text hover:text-foreground cursor-pointer"
                  >
                    हटाउनुहोस्
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* PRIMARY VIEW NAVIGATION: ENTITIES VS SGIS RESEARCH */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-muted-area border border-border-theme">
            <button
              onClick={() => setKnowledgeView("entities")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                knowledgeView === "entities"
                  ? "bg-card text-primary shadow-xs border border-border-theme"
                  : "text-muted-text hover:text-foreground"
              }`}
            >
              <Network className="w-4 h-4" />
              ज्ञानकोष सञ्जाल ({entities.length})
            </button>
            <button
              onClick={() => setKnowledgeView("sgis")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                knowledgeView === "sgis"
                  ? "bg-card text-primary shadow-xs border border-border-theme"
                  : "text-muted-text hover:text-foreground"
              }`}
            >
              <FileCode className="w-4 h-4" />
              SGIS शास्त्र अनुसन्धान
            </button>
          </div>

          <div className="text-xxs text-muted-text font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Public Read-Only Mode (Snapshot Verified)</span>
          </div>
        </div>

        {/* VIEW 1: SGIS DASHBOARD */}
        {knowledgeView === "sgis" ? (
          <div className="space-y-6">
            <SgisDashboard />
          </div>
        ) : (
          /* VIEW 2: KNOWLEDGE ENTITIES & GRAPH */
          <div className="space-y-8">
            
            {/* CATEGORY SELECTOR CHIPS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const count = cat.id === "all" 
                  ? entities.length 
                  : entities.filter(e => e.category === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                      selectedCategory === cat.id
                        ? "bg-primary text-white shadow-xs"
                        : "bg-card hover:bg-muted-area border border-border-theme text-muted-text hover:text-foreground"
                    }`}
                  >
                    <span>{cat.nameNepali}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      selectedCategory === cat.id ? "bg-white/20 text-white" : "bg-muted-area text-muted-text"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* SELECTED ENTITY DETAIL VIEWER (ANCHOR FOR DEEP LINK) */}
            <div ref={detailContentRef}>
              {selectedEntity ? (
                <KnowledgeGraphViewer
                  currentNode={selectedEntity}
                  allNodes={entities}
                  edges={edges}
                  scriptureRefs={scriptureRefs}
                  onSelectNode={handleSelectEntity}
                  breadcrumbs={breadcrumbs}
                  onNavigateBack={handleNavigateBack}
                />
              ) : loading ? (
                <div className="bg-card border border-border-theme rounded-3xl p-12 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
                  <p className="text-sm font-bold text-card-foreground">ज्ञानकोष विवरण लोड हुँदैछ...</p>
                </div>
              ) : null}
            </div>

            {/* KNOWLEDGE ENTITY CARDS BROWSER */}
            <section className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-serif font-black text-card-foreground">
                    ज्ञानकोष सूची ({filteredEntities.length})
                  </h2>
                </div>
                {searchTerm && (
                  <span className="text-xs text-muted-text">
                    खोज परिणाम: "{searchTerm}"
                  </span>
                )}
              </div>

              {filteredEntities.length === 0 ? (
                <div className="bg-card border border-dashed border-border-theme rounded-3xl p-12 text-center space-y-3">
                  <AlertTriangle className="w-10 h-10 text-amber-500/80 mx-auto" />
                  <h3 className="text-base font-bold text-card-foreground">कुनै ज्ञान बिन्दु फेला परेन</h3>
                  <p className="text-xs text-muted-text max-w-md mx-auto">
                    तपाईंले खोज्नुभएको शब्दसँग मिल्ने ज्ञान बिन्दु छैन। कृपया अन्य शब्द वा श्रेणी चयन गर्नुहोस्।
                  </p>
                  <button
                    onClick={() => { setSearchTerm(""); setSelectedCategory("all"); }}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    खोज रिसेट गर्नुहोस्
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredEntities.map((entity) => {
                    const isSelected = selectedEntity?.id === entity.id;

                    return (
                      <div
                        key={entity.id}
                        onClick={() => handleSelectEntity(entity)}
                        className={`group rounded-3xl p-5 bg-card border transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-xs hover:shadow-md ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/20 bg-primary/[0.02]"
                            : "border-border-theme hover:border-primary/40"
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 font-mono">
                              {entity.category}
                            </span>
                            {entity.district && (
                              <span className="text-xxs text-muted-text font-medium flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-primary shrink-0" />
                                {entity.district}
                              </span>
                            )}
                          </div>

                          <div className="flex gap-3 items-center">
                            <img 
                              src={entity.imageUrl || "https://images.unsplash.com/photo-1609137144869-37367123d57f?q=80&w=2070&auto=format&fit=crop"} 
                              alt={entity.nameNepali} 
                              className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-border-theme"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0 flex-1">
                              <h3 className="font-serif font-black text-base text-card-foreground group-hover:text-primary transition-colors truncate">
                                {entity.nameNepali}
                              </h3>
                              <p className="text-xs text-muted-text truncate font-sans">
                                {entity.nameEnglish}
                              </p>
                              {entity.sanskrit && (
                                <p className="text-xxs text-primary font-serif italic truncate">
                                  {entity.sanskrit}
                                </p>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-muted-text line-clamp-2 leading-relaxed font-sans">
                            {entity.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-border-theme/60 flex items-center justify-between text-xs">
                          <span className="text-xxs text-muted-text font-mono">
                            {entity.verificationStatus === "verified" ? "● VERIFIED" : "○ REVIEW"}
                          </span>
                          <span className="text-primary font-bold text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            सञ्जाल हेर्नुहोस्
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
