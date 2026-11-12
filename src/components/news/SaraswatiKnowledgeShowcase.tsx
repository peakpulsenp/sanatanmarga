import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  Sparkles, 
  Search, 
  ChevronRight, 
  Network, 
  Landmark, 
  Crown, 
  Scroll, 
  Compass, 
  Layers, 
  X, 
  PlayCircle, 
  FileText, 
  ExternalLink,
  ShoppingBag,
  ArrowRight,
  Flame,
  CheckCircle2,
  Calendar,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  KNOWLEDGE_CATEGORIES_GRID, 
  getFeaturedKnowledgeNode, 
  getTrendingKnowledgeNodes, 
  getKnowledgeNode, 
  FullKnowledgeNode 
} from "@/src/data/saraswatiKnowledgeData";
import { useLanguage } from "@/src/context/LanguageContext";

interface SaraswatiKnowledgeShowcaseProps {
  onOpenNodeDetail?: (nodeId: string) => void;
}

export default function SaraswatiKnowledgeShowcase({ onOpenNodeDetail }: SaraswatiKnowledgeShowcaseProps) {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal / Node Detail State
  const [selectedNode, setSelectedNode] = useState<FullKnowledgeNode | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "archives" | "articles" | "courses" | "videos" | "festivals" | "store" | "graph">("overview");

  const featuredNode = getFeaturedKnowledgeNode();
  const trendingNodes = getTrendingKnowledgeNodes();

  const handleOpenNode = (nodeId: string, initialTab: typeof activeTab = "overview") => {
    const node = getKnowledgeNode(nodeId);
    setSelectedNode(node);
    setActiveTab(initialTab);
    if (onOpenNodeDetail) onOpenNodeDetail(nodeId);
  };

  return (
    <div className="bg-card rounded-[2.5rem] border border-border-theme p-6 lg:p-12 shadow-md flex flex-col gap-10 relative overflow-hidden">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-theme/60 pb-8">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sacred/10 border border-sacred/20 text-sacred text-xxs font-black tracking-widest uppercase w-fit">
            <Sparkles size={12} className="animate-pulse" />
            <span>सरस्वती ज्ञान विज्ञान मञ्च (Saraswati KnowledgeOS 2.0)</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-black text-card-foreground tracking-tight">
            {language === 'en' ? "Nepal's Living Civilizational Knowledge Graph" : "सरस्वती ज्ञान विज्ञान मञ्च — कालजयी सभ्यता र ज्ञानको सञ्जाल"}
          </h2>
          <p className="text-xs font-bold text-muted-text max-w-3xl leading-relaxed">
            वैदिक शास्त्र, इतिहास, ऐतिहासिक व्यक्तित्व, मन्दिर, कानुन र दर्शनलाई जीवन्त ज्ञानग्राफ (Knowledge Graph) मार्फत अध्ययन र अनुसन्धान गर्नुहोस्।
          </p>
        </div>

        <Link
          to="/knowledge"
          className="text-xs font-black text-sacred hover:text-sacred/80 flex items-center gap-1.5 shrink-0 bg-sacred/10 border border-sacred/30 px-5 py-3 rounded-2xl hover:bg-sacred hover:text-white transition-all duration-300"
        >
          <span>ज्ञानकोषका सबै नोडहरू</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* 2. Search Knowledge Bar & Trending Knowledge Pills */}
      <div className="flex flex-col gap-4 bg-muted-area/10 p-6 rounded-3xl border border-border-theme/50">
        <div className="relative w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sacred" />
          <input
            type="text"
            placeholder="ज्ञानकोष खोज्नुहोस् (उदा. पशुपतिनाथ, भगवद्गीता, लिच्छवि काल, मुलुकी ऐन)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchTerm.trim()) {
                handleOpenNode(searchTerm.trim());
              }
            }}
            className="w-full bg-card border border-border-theme rounded-2xl pl-12 pr-4 py-3.5 text-xs font-bold text-card-foreground placeholder:text-muted-text focus:outline-none focus:border-sacred focus:ring-1 focus:ring-sacred transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xxs font-black text-muted-text uppercase tracking-widest flex items-center gap-1">
            <Flame size={12} className="text-sacred" /> चर्चित ज्ञान नोडहरू:
          </span>
          {trendingNodes.map((node) => (
            <button
              key={node.id}
              onClick={() => handleOpenNode(node.id)}
              className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-card hover:bg-sacred hover:text-white border border-border-theme/60 text-card-foreground transition-all duration-200"
            >
              {node.nameNepali} ({node.nameEnglish})
            </button>
          ))}
        </div>
      </div>

      {/* 3. Featured Knowledge Node Card */}
      <div className="bg-gradient-to-r from-sacred/10 via-purple-500/5 to-amber-500/10 border border-sacred/30 rounded-3xl p-6 lg:p-8 flex flex-col lg:flex-row gap-8 items-center">
        <div className="w-full lg:w-1/3 aspect-video lg:aspect-square rounded-2xl overflow-hidden relative shadow-md shrink-0">
          <img
            src={featuredNode.heroImage || "https://images.unsplash.com/photo-1609137144869-37367123d57f?q=80&w=1200&auto=format&fit=crop"}
            alt={featuredNode.nameNepali}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 bg-sacred text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase">
            मुख्य ज्ञान नोड
          </div>
        </div>

        <div className="flex flex-col gap-4 flex-grow">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-card text-sacred border border-sacred/20 text-xxs font-black px-3 py-1 rounded-full">
              {featuredNode.categoryNameNepali}
            </span>
            <span className="text-xs font-mono text-muted-text">
              कालखण्ड: {featuredNode.historicalPeriod}
            </span>
          </div>

          <h3 className="text-2xl lg:text-3xl font-black text-card-foreground">
            {featuredNode.nameNepali}
            {featuredNode.sanskritName && (
              <span className="text-base text-sacred font-normal italic block font-serif">
                ({featuredNode.sanskritName})
              </span>
            )}
          </h3>

          <p className="text-xs font-semibold text-muted-text leading-relaxed">
            {featuredNode.summary}
          </p>

          {/* Action Buttons: Read, Explore, Timeline, Archives, Related Articles */}
          <div className="flex flex-wrap gap-2.5 pt-2">
            <button
              onClick={() => handleOpenNode(featuredNode.id, "overview")}
              className="bg-sacred text-white hover:bg-sacred/90 text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>अध्ययन गर्नुहोस् (Read)</span>
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => handleOpenNode(featuredNode.id, "graph")}
              className="bg-card hover:bg-sacred hover:text-white border border-sacred/30 text-sacred text-xs font-black px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Network size={14} />
              <span>ज्ञानग्राफ (Explore Graph)</span>
            </button>
            <button
              onClick={() => handleOpenNode(featuredNode.id, "timeline")}
              className="bg-card hover:bg-muted-area border border-border-theme text-card-foreground text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all"
            >
              कालक्रम (Timeline)
            </button>
            <button
              onClick={() => handleOpenNode(featuredNode.id, "archives")}
              className="bg-card hover:bg-muted-area border border-border-theme text-card-foreground text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all"
            >
              ऐतिहासिक संग्रह (Archives)
            </button>
          </div>
        </div>
      </div>

      {/* 4. 📂 Knowledge Categories (Visual Grid) */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-border-theme/40 pb-3">
          <h3 className="text-lg font-extrabold text-card-foreground">
            📂 ज्ञान वर्गहरू (Knowledge Categories)
          </h3>
          <span className="text-xxs font-black text-sacred uppercase tracking-widest font-mono">
            ८ वटा प्रमुख विधा
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {KNOWLEDGE_CATEGORIES_GRID.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleOpenNode(cat.id)}
              className="bg-card border border-border-theme/80 hover:border-sacred/60 p-5 rounded-2xl cursor-pointer group transition-all duration-300 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-sacred/10 border border-sacred/20 text-sacred flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                  <BookOpen size={20} />
                </div>
                <span className="text-xxs font-mono font-bold text-muted-text bg-muted-area px-2 py-0.5 rounded-full">
                  {cat.count}+ नोडहरू
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-1">
                <h4 className="text-sm font-black text-card-foreground group-hover:text-sacred transition-colors">
                  {cat.nameNepali}
                </h4>
                <span className="text-xxs font-bold text-muted-text font-mono uppercase">
                  {cat.nameEnglish}
                </span>
                <p className="text-xs text-muted-text/80 line-clamp-2 mt-1 leading-relaxed">
                  {cat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Interactive Knowledge Node Modal & Graph Experience */}
      <AnimatePresence>
        {selectedNode && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 lg:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border-theme rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl relative"
            >
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-sacred/20 via-purple-500/10 to-amber-500/10 p-6 md:p-8 border-b border-border-theme relative shrink-0">
                <button
                  onClick={() => setSelectedNode(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black text-white p-2 rounded-full border border-white/20 transition-all z-10"
                >
                  <X size={18} />
                </button>

                <div className="flex flex-col gap-2 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span className="bg-sacred text-white text-xxs font-black px-3 py-0.5 rounded-full uppercase">
                      {selectedNode.categoryNameNepali}
                    </span>
                    {selectedNode.district && (
                      <span className="bg-card text-card-foreground text-xxs font-bold px-3 py-0.5 rounded-full border border-border-theme">
                        {selectedNode.district}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-card-foreground">
                    {selectedNode.nameNepali}
                  </h3>
                  <p className="text-xs font-semibold text-muted-text">
                    {selectedNode.summary}
                  </p>
                </div>
              </div>

              {/* Modal Navigation Tabs */}
              <div className="flex overflow-x-auto bg-muted-area/30 border-b border-border-theme px-6 py-2 gap-2 shrink-0 custom-scrollbar">
                {[
                  { id: "overview", label: "📖 सार (Overview)" },
                  { id: "graph", label: "🕸 ज्ञानग्राफ (Connections)" },
                  { id: "timeline", label: "⏳ कालक्रम (Timeline)" },
                  { id: "archives", label: "📜 ऐतिहासिक दस्ताबेज (Archives)" },
                  { id: "articles", label: "📰 सम्बन्धित सामग्री" },
                  { id: "courses", label: "🎓 पाठ्यक्रम (Courses)" },
                  { id: "videos", label: "🎥 भिडियो" },
                  { id: "festivals", label: "🎉 पर्व" },
                  { id: "store", label: "🛒 सामग्री" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? "bg-sacred text-white shadow-md"
                        : "bg-card hover:bg-muted-area text-card-foreground border border-border-theme/40"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Modal Body */}
              <div className="p-6 md:p-8 overflow-y-auto flex-grow custom-scrollbar space-y-6">
                {activeTab === "overview" && (
                  <div className="flex flex-col gap-4">
                    <h4 className="text-base font-black text-card-foreground">विस्तृत विवरण</h4>
                    <div className="text-xs text-card-foreground/90 leading-relaxed whitespace-pre-line bg-muted-area/10 p-5 rounded-2xl border border-border-theme/40">
                      {selectedNode.fullOverview}
                    </div>
                  </div>
                )}

                {/* 🕸 Interactive Knowledge Graph Visualization */}
                {activeTab === "graph" && (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-black text-card-foreground flex items-center gap-2">
                        <Network size={18} className="text-sacred" />
                        जीवन्त ज्ञान सम्बन्ध सञ्जाल (Explore Connections)
                      </h4>
                      <span className="text-xxs font-mono font-bold text-sacred">
                        {selectedNode.graphConnections.length} सम्बन्धित नोडहरू
                      </span>
                    </div>

                    <div className="bg-black/95 rounded-2xl p-6 border border-sacred/30 relative min-h-[320px] flex flex-col items-center justify-center overflow-hidden">
                      {/* Interactive Graph SVG Lines */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {selectedNode.graphConnections.map((conn, idx) => (
                          <line
                            key={conn.id}
                            x1="50%"
                            y1="50%"
                            x2={`${20 + (idx * 28) % 70}%`}
                            y2={`${20 + (idx * 35) % 70}%`}
                            stroke="#e11d48"
                            strokeWidth="1.5"
                            strokeDasharray="4 2"
                            className="opacity-60 animate-pulse"
                          />
                        ))}
                      </svg>

                      {/* Center Node */}
                      <div className="z-10 bg-sacred text-white p-4 rounded-2xl shadow-xl border border-white/20 text-center font-black text-sm max-w-[200px]">
                        {selectedNode.nameNepali}
                      </div>

                      {/* Surrounding Connected Nodes */}
                      <div className="flex flex-wrap justify-center gap-4 mt-8 z-10">
                        {selectedNode.graphConnections.map((conn) => (
                          <button
                            key={conn.id}
                            onClick={() => handleOpenNode(conn.targetId)}
                            className="bg-card hover:bg-sacred hover:text-white border border-sacred/40 text-card-foreground px-4 py-2 rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2"
                          >
                            <span className="text-[9px] text-sacred uppercase block font-mono">
                              [{conn.relationLabelNepali}]
                            </span>
                            <span>{conn.targetId}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "timeline" && (
                  <div className="space-y-4">
                    {selectedNode.timeline.length > 0 ? (
                      selectedNode.timeline.map((item, idx) => (
                        <div key={idx} className="flex gap-4 border-l-2 border-sacred pl-4 py-1">
                          <div>
                            <span className="text-xs font-mono font-black text-sacred">{item.year}</span>
                            <h5 className="text-sm font-black text-card-foreground">{item.title}</h5>
                            <p className="text-xs text-muted-text mt-1">{item.description}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-text">यस नोडको कालक्रम अद्यावधिक हुँदैछ...</p>
                    )}
                  </div>
                )}

                {activeTab === "archives" && (
                  <div className="space-y-4">
                    {selectedNode.historicalDocuments.length > 0 ? (
                      selectedNode.historicalDocuments.map((doc, idx) => (
                        <div key={idx} className="bg-muted-area/20 border border-border-theme p-4 rounded-2xl flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="bg-sacred/10 text-sacred text-[9px] font-black px-2 py-0.5 rounded-full">
                                {doc.type}
                              </span>
                              <span className="text-xs font-mono font-bold text-muted-text">{doc.year}</span>
                            </div>
                            <h5 className="text-sm font-black text-card-foreground mt-1">{doc.title}</h5>
                            <p className="text-xs text-muted-text mt-1">{doc.summary}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-text">ऐतिहासिक दस्ताबेजहरू अध्ययन प्रक्रियामा छन्...</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
