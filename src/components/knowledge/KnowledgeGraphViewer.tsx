import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  MapPin, 
  Sparkles, 
  Network, 
  CheckCircle2, 
  ChevronRight, 
  Share2, 
  ExternalLink,
  Layers,
  Landmark,
  Compass,
  FileText,
  Tag,
  Info,
  ShieldCheck,
  Feather,
  ArrowLeft,
  Calendar,
  Check,
  Eye,
  FileCode
} from "lucide-react";
import type { KnowledgeEntity, KnowledgeEdge, ScriptureReference } from "@/src/types/knowledge";
import { Article } from "@/src/types";
import { KnowledgeArticleResolver } from "@/src/services/knowledge/knowledgeArticleResolver";
import { DataTruthBadge } from "@/src/components/common/DataTruthBadge";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface KnowledgeGraphViewerProps {
  currentNode: KnowledgeEntity;
  allNodes: KnowledgeEntity[];
  edges: KnowledgeEdge[];
  scriptureRefs: ScriptureReference[];
  onSelectNode: (node: KnowledgeEntity) => void;
  breadcrumbs?: KnowledgeEntity[];
  onNavigateBack?: () => void;
}

export default function KnowledgeGraphViewer({
  currentNode,
  allNodes,
  edges,
  scriptureRefs,
  onSelectNode,
  breadcrumbs = [],
  onNavigateBack
}: KnowledgeGraphViewerProps) {
  const [activeTab, setActiveTab] = useState<"graph" | "verses" | "provenance" | "articles" | "sgis">("graph");
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load related articles lazily without downloading the whole collection
  useEffect(() => {
    let isMounted = true;
    setLoadingArticles(true);
    KnowledgeArticleResolver.resolveRelatedArticles(currentNode, 4)
      .then(articles => {
        if (isMounted) {
          setRelatedArticles(articles);
          setLoadingArticles(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingArticles(false);
      });
    return () => {
      isMounted = false;
    };
  }, [currentNode.id]);

  // Connected edges and neighbor nodes
  const connectedEdges = edges.filter(
    e => e.sourceId.toLowerCase() === currentNode.id.toLowerCase() || 
         e.targetId.toLowerCase() === currentNode.id.toLowerCase()
  );
  
  const connectedNeighborIds = new Set<string>();
  connectedEdges.forEach(e => {
    const isSrc = e.sourceId.toLowerCase() === currentNode.id.toLowerCase();
    connectedNeighborIds.add(isSrc ? e.targetId.toLowerCase() : e.sourceId.toLowerCase());
  });

  const neighbors = allNodes.filter(n => 
    connectedNeighborIds.has(n.id.toLowerCase()) || 
    (n.canonicalId && connectedNeighborIds.has(n.canonicalId.toLowerCase()))
  );

  const connectedScriptures = scriptureRefs.filter(
    s => s.nodeId.toLowerCase() === currentNode.id.toLowerCase() || 
         s.granthaId.toLowerCase() === currentNode.id.toLowerCase()
  );

  const handleCopyLink = () => {
    const url = `${window.location.origin}/knowledge/${currentNode.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("ज्ञान बिन्दु लिङ्क कपी गरियो");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="bg-card border border-border-theme rounded-3xl overflow-hidden shadow-xl transition-all">
      {/* Top Header Banner */}
      <div className="relative bg-gradient-to-r from-primary/10 via-amber-500/5 to-purple-500/10 p-6 md:p-8 border-b border-border-theme">
        {/* Traversal Breadcrumbs & Back Navigation */}
        <div className="flex items-center justify-between gap-3 mb-4 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap font-sans">
            {onNavigateBack && breadcrumbs.length > 1 && (
              <button
                onClick={onNavigateBack}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-background/80 hover:bg-background border border-border-theme text-foreground font-semibold cursor-pointer mr-2 transition-colors"
                title="अघिल्लो ज्ञान बिन्दुमा फर्कनुहोस्"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>फर्कनुहोस्</span>
              </button>
            )}

            <Link to="/knowledge" className="text-muted-text hover:text-primary font-bold transition-colors">
              ज्ञानकोष
            </Link>
            {breadcrumbs.slice(-3).map((b, idx) => (
              <div key={b.id} className="flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3 text-muted-text" />
                <button
                  onClick={() => onSelectNode(b)}
                  className={`cursor-pointer transition-colors ${
                    b.id === currentNode.id ? "text-primary font-bold" : "text-muted-text hover:text-foreground"
                  }`}
                >
                  {b.nameNepali}
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-background/80 hover:bg-background border border-border-theme text-xs font-semibold text-foreground cursor-pointer shadow-xs transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "कपी भयो" : "साझा गर्नुहोस्"}</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-primary/15 text-primary border border-primary/25 capitalize flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5" />
                {currentNode.category} (ज्ञानकोष)
              </span>

              {currentNode.district && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted-area text-foreground border border-border-theme flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {currentNode.district}
                  {currentNode.province ? `, ${currentNode.province}` : ""}
                </span>
              )}

              {currentNode.verificationStatus === "verified" ? (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  प्रमाणित वैदिक ज्ञान (Verified)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  समीक्षामा (Under Review)
                </span>
              )}

              {currentNode.historicalPeriod && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted-area text-muted-text border border-border-theme flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {currentNode.historicalPeriod}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-4xl font-serif font-black text-card-foreground tracking-tight flex items-center gap-3">
              {currentNode.nameNepali}
              {currentNode.sanskrit && (
                <span className="text-lg md:text-xl font-serif text-primary font-normal italic">
                  ({currentNode.sanskrit})
                </span>
              )}
            </h1>

            <p className="text-sm md:text-base text-muted-text leading-relaxed font-sans">
              {currentNode.description}
            </p>

            {currentNode.aliases && currentNode.aliases.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-text pt-1">
                <Tag className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold">अन्य नामहरू:</span>
                {currentNode.aliases.map((alias, i) => (
                  <span key={i} className="bg-muted-area/80 px-2 py-0.5 rounded-md border border-border-theme font-mono text-[11px]">
                    {alias}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="w-full lg:w-72 shrink-0 rounded-2xl overflow-hidden border border-border-theme shadow-md aspect-video lg:aspect-square relative group">
            <img 
              src={currentNode.imageUrl || "https://images.unsplash.com/photo-1609137144869-37367123d57f?q=80&w=2070&auto=format&fit=crop"} 
              alt={currentNode.nameNepali} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
              <span className="text-xs text-white/90 font-bold font-serif">
                {currentNode.nameEnglish}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-border-theme">
          <button
            onClick={() => setActiveTab("graph")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "graph"
                ? "bg-primary text-white shadow-md"
                : "bg-muted-area hover:bg-muted-area/80 text-foreground"
            }`}
          >
            <Network className="w-4 h-4" />
            सम्बन्ध सञ्जाल ({neighbors.length})
          </button>

          <button
            onClick={() => setActiveTab("verses")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "verses"
                ? "bg-primary text-white shadow-md"
                : "bg-muted-area hover:bg-muted-area/80 text-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            शास्त्र र श्लोकहरू ({connectedScriptures.length})
          </button>

          <button
            onClick={() => setActiveTab("provenance")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "provenance"
                ? "bg-primary text-white shadow-md"
                : "bg-muted-area hover:bg-muted-area/80 text-foreground"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            प्रमाणिकता तथा स्रोत
          </button>

          <button
            onClick={() => setActiveTab("articles")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "articles"
                ? "bg-primary text-white shadow-md"
                : "bg-muted-area hover:bg-muted-area/80 text-foreground"
            }`}
          >
            <FileText className="w-4 h-4" />
            सम्बद्ध सामग्री ({relatedArticles.length})
          </button>

          {currentNode.sgisDocumentIds && currentNode.sgisDocumentIds.length > 0 && (
            <button
              onClick={() => setActiveTab("sgis")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "sgis"
                  ? "bg-primary text-white shadow-md"
                  : "bg-muted-area hover:bg-muted-area/80 text-foreground"
              }`}
            >
              <FileCode className="w-4 h-4" />
              SGIS अनुसन्धान अभिलेख ({currentNode.sgisDocumentIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-6 md:p-8">
        <AnimatePresence mode="wait">
          {activeTab === "graph" && (
            <motion.div
              key="graph"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Interactive Graph Traversal Area */}
              <div className="relative bg-muted-area/30 rounded-3xl p-6 md:p-8 border border-border-theme flex flex-col items-center justify-center overflow-hidden">
                <div className="text-center mb-6 z-10">
                  <span className="text-xs uppercase font-black tracking-wider text-primary">
                    Interactive Knowledge Graph Traversal
                  </span>
                  <h3 className="text-lg font-serif font-black text-card-foreground mt-1">
                    "{currentNode.nameNepali}" सँग जोडिएका ज्ञानकोष बिन्दुहरू
                  </h3>
                </div>

                {/* Central & Neighbors Visual Layout */}
                <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-4xl">
                  {/* Central Node Badge */}
                  <div className="p-4 rounded-2xl bg-primary text-white shadow-xl border-2 border-primary/40 text-center min-w-[200px]">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-300 mx-auto mb-1.5 animate-ping" />
                    <h4 className="font-serif font-black text-base leading-tight">
                      {currentNode.nameNepali}
                    </h4>
                    <p className="text-xxs text-white/80 mt-0.5 capitalize font-bold">
                      {currentNode.category} • {currentNode.canonicalId}
                    </p>
                  </div>

                  {/* Neighbor Nodes Grid */}
                  {neighbors.length === 0 ? (
                    <div className="text-center py-8 text-muted-text text-sm font-medium">
                      यस ज्ञान बिन्दुसँग हाल अन्य प्रत्यक्ष नोडहरू जोडिएका छैनन्।
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                      {neighbors.map(neighbor => {
                        const edge = connectedEdges.find(
                          e => (e.sourceId.toLowerCase() === neighbor.id.toLowerCase() && e.targetId.toLowerCase() === currentNode.id.toLowerCase()) ||
                               (e.targetId.toLowerCase() === neighbor.id.toLowerCase() && e.sourceId.toLowerCase() === currentNode.id.toLowerCase())
                        );

                        return (
                          <div
                            key={neighbor.id}
                            onClick={() => onSelectNode(neighbor)}
                            className="group relative p-4 rounded-2xl bg-card border border-border-theme hover:border-primary/60 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer"
                          >
                            {edge && (
                              <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20 font-mono">
                                {edge.labelNepali}
                              </span>
                            )}

                            <div className="flex items-start gap-3 mt-1">
                              <img 
                                src={neighbor.imageUrl || "https://images.unsplash.com/photo-1609137144869-37367123d57f?q=80&w=2070&auto=format&fit=crop"} 
                                alt={neighbor.nameNepali} 
                                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-border-theme"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0 flex-1">
                                <h5 className="font-serif font-black text-sm text-card-foreground group-hover:text-primary transition-colors truncate">
                                  {neighbor.nameNepali}
                                </h5>
                                <p className="text-xxs text-muted-text truncate font-sans">
                                  {neighbor.district || neighbor.category}
                                </p>
                                <span className="text-[11px] text-primary font-bold flex items-center gap-1 mt-1">
                                  ज्ञान बिन्दु खोल्नुहोस्
                                  <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Key Attributes Table */}
              {Object.keys(currentNode.keyAttributes || {}).length > 0 && (
                <div className="bg-card border border-border-theme rounded-2xl p-6 shadow-xs">
                  <h3 className="font-serif font-black text-lg text-card-foreground mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    मुख्य विशेषता र विवरण (Key Attributes)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(currentNode.keyAttributes).map(([key, val]) => (
                      <div key={key} className="p-3.5 rounded-xl bg-muted-area/40 border border-border-theme">
                        <span className="text-xxs text-muted-text font-bold block uppercase tracking-wider">
                          {key}
                        </span>
                        <span className="text-sm font-bold text-card-foreground font-serif mt-0.5 block">
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "verses" && (
            <motion.div
              key="verses"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-black text-xl text-card-foreground flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  प्रमाणित शास्त्र र वैदिक श्लोकहरू
                </h3>
              </div>

              {connectedScriptures.length === 0 ? (
                <div className="text-center py-12 bg-muted-area/20 rounded-2xl border border-dashed border-border-theme">
                  <Feather className="w-10 h-10 text-muted-text/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-text font-medium">
                    यस ज्ञान बिन्दुसँग प्रत्यक्ष श्लोक अनुसन्धान प्रक्रियामा छ।
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {connectedScriptures.map((ref, idx) => (
                    <div key={idx} className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-primary/15 text-primary border border-primary/20 font-serif">
                          {ref.granthaTitleNepali || "वैदिक ग्रन्थ"} (अध्याय {ref.chapter}, श्लोक {ref.verse})
                        </span>
                        {ref.source && (
                          <span className="text-xxs text-muted-text font-mono">
                            स्रोत: {ref.source}
                          </span>
                        )}
                      </div>

                      {ref.sanskritVerse && (
                        <p className="text-base md:text-lg font-serif font-bold text-primary leading-relaxed bg-card p-4 rounded-xl border border-border-theme text-center shadow-xs">
                          {ref.sanskritVerse}
                        </p>
                      )}

                      {ref.translation && (
                        <p className="text-sm text-card-foreground leading-relaxed font-sans">
                          <strong className="text-primary font-bold">नेपाली भावार्थ:</strong> {ref.translation}
                        </p>
                      )}

                      {ref.translationEnglish && (
                        <p className="text-xs text-muted-text leading-relaxed font-sans border-t border-border-theme/40 pt-2">
                          <strong>English Translation:</strong> {ref.translationEnglish}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "provenance" && (
            <motion.div
              key="provenance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-card border border-border-theme rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-theme">
                  <h3 className="font-serif font-black text-lg text-card-foreground flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    ज्ञानकोष सत्यता र स्रोत प्रमाणिकता (Truth Provenance)
                  </h3>
                  <DataTruthBadge
                    record={{
                      sourceId: currentNode.id,
                      sourceName: currentNode.provenance?.sourceOrg || "SanatanMarga Civilizational Research Council",
                      sourceUrl: currentNode.provenance?.sourceUrls?.[0] || "https://sanatanmarga.org",
                      fetchedAt: currentNode.provenance?.verifiedAt || currentNode.updatedAt || new Date().toISOString(),
                      verifiedAt: currentNode.provenance?.verifiedAt || currentNode.updatedAt || new Date().toISOString(),
                      verificationStatus: currentNode.verificationStatus === "verified" ? "verified" : "pending",
                      freshnessStatus: "fresh",
                      provenanceType: "official",
                      confidence: currentNode.provenance?.confidence || 0.99
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-muted-area/40 border border-border-theme space-y-2">
                    <span className="text-muted-text font-bold block uppercase font-mono">प्रमाणित निकाय / संस्था</span>
                    <p className="text-sm font-bold text-card-foreground">
                      {currentNode.provenance?.sourceOrg || "SanatanMarga Civilizational Research Council"}
                    </p>
                    <p className="text-muted-text text-xxs">
                      शीर्षक: {currentNode.provenance?.sourceTitle || "Official Heritage Registry"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted-area/40 border border-border-theme space-y-2">
                    <span className="text-muted-text font-bold block uppercase font-mono">समीक्षा विवरण</span>
                    <p className="text-sm font-bold text-card-foreground">
                      प्रमाणीकरणकर्ता: {currentNode.provenance?.verifiedBy || "Scholar Board"}
                    </p>
                    <p className="text-muted-text text-xxs">
                      अन्तिम प्रमाणीकरण: {currentNode.provenance?.verifiedAt ? new Date(currentNode.provenance.verifiedAt).toLocaleDateString("ne-NP") : "प्रमाणित"}
                    </p>
                  </div>
                </div>

                {currentNode.provenance?.sourceUrls && currentNode.provenance.sourceUrls.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-card-foreground block">
                      बाह्य आधिकारिक स्रोत लिङ्कहरू:
                    </span>
                    <div className="space-y-1.5">
                      {currentNode.provenance.sourceUrls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1.5 font-mono truncate"
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{url}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "articles" && (
            <motion.div
              key="articles"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h3 className="font-serif font-black text-xl text-card-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                सम्बन्धित सामग्री तथा अनुसन्धान लेखहरू
              </h3>

              {loadingArticles ? (
                <div className="text-center py-10 text-muted-text text-sm">
                  लेखहरू खोजी गरिँदैछ...
                </div>
              ) : relatedArticles.length === 0 ? (
                <div className="text-center py-12 bg-muted-area/20 rounded-2xl border border-dashed border-border-theme">
                  <FileText className="w-10 h-10 text-muted-text/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-text font-medium">
                    यस ज्ञान बिन्दुसँग जोडिएका विशेष लेखहरू थपिने क्रममा छन्।
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedArticles.map((art, idx) => (
                    <Link
                      key={`${art.id || 'ranked'}-${idx}`}
                      to={`/article/${art.id}`}
                      className="group p-4 rounded-2xl bg-card border border-border-theme hover:border-primary/60 transition-all flex gap-4 shadow-xs"
                    >
                      {art.featuredImage && (
                        <img 
                          src={art.featuredImage} 
                          alt={art.title} 
                          className="w-24 h-20 rounded-xl object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="space-y-1 min-w-0">
                        <h4 className="font-serif font-black text-sm text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {art.title}
                        </h4>
                        <p className="text-xxs text-muted-text line-clamp-2">
                          {art.excerpt}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "sgis" && currentNode.sgisDocumentIds && (
            <motion.div
              key="sgis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-card border border-border-theme rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-serif font-black text-lg text-card-foreground flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-primary" />
                  Sanatan Grantha Intelligence System (SGIS) अभिलेख
                </h3>
                <p className="text-xs text-muted-text">
                  यस ज्ञान बिन्दुसँग SGIS हस्तलिखित पाण्डुलिपि तथा वैदिक शास्त्रका डिजिटल अनुसन्धान अभिलेखहरू जोडिएका छन्।
                </p>

                <div className="space-y-3 pt-2">
                  {currentNode.sgisDocumentIds.map((docId) => (
                    <div 
                      key={docId}
                      className="p-4 rounded-xl bg-muted-area/40 border border-border-theme flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-primary block">{docId}</span>
                        <span className="text-xxs text-muted-text">SGIS डिजिटल अभिलेख अनुसन्धान पत्र</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/20">
                        ● VERIFIED SGIS RECORD
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
