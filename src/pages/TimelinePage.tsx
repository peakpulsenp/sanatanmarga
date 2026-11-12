import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import SEOHead from "@/src/components/common/SEOHead";
import { 
  History, 
  Sparkles, 
  BookOpen, 
  Landmark, 
  ShoppingBag, 
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  FileCheck,
  ChevronRight,
  RefreshCw,
  Info,
  Clock,
  ArrowUpDown,
  Filter,
  X
} from "lucide-react";
import { useLanguage } from "@/src/context/LanguageContext";
import { 
  TimelineEvent, 
  TimelineCategory, 
  TimelineEra, 
  TimelineManifest,
  resolveTimelineDate 
} from "@/src/types/timeline";
import { timelineSnapshotService } from "@/src/services/timeline/timelineSnapshotService";
import { DataTruthBadge } from "@/src/components/common/DataTruthBadge";
import { motion, AnimatePresence } from "motion/react";

export default function TimelinePage() {
  const { language } = useLanguage();
  const { id: paramEventId } = useParams<{ id?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryEventId = searchParams.get("event");
  const targetDeepLinkId = paramEventId || queryEventId;

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [manifest, setManifest] = useState<TimelineManifest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEra, setSelectedEra] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [activeEvent, setActiveEvent] = useState<TimelineEvent | null>(null);

  // Load public snapshot
  useEffect(() => {
    let isMounted = true;

    async function fetchTimeline() {
      setLoading(true);
      setError(null);
      try {
        const [data, manifestData] = await Promise.all([
          timelineSnapshotService.getPublicTimeline(),
          timelineSnapshotService.getManifest()
        ]);
        if (isMounted) {
          setEvents(data);
          setManifest(manifestData);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load public timeline snapshot");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchTimeline();

    // Listen for snapshot invalidation events emitted by admin updates
    const handleInvalidation = () => {
      fetchTimeline();
    };
    window.addEventListener("timeline-snapshot-invalidated", handleInvalidation);

    return () => {
      isMounted = false;
      window.removeEventListener("timeline-snapshot-invalidated", handleInvalidation);
    };
  }, []);

  // Handle deep link resolution
  useEffect(() => {
    if (targetDeepLinkId && events.length > 0) {
      const found = events.find(e => e.id === targetDeepLinkId);
      if (found) {
        setActiveEvent(found);
      }
    }
  }, [targetDeepLinkId, events]);

  // Categories config
  const categories = [
    { id: "all", labelNepali: "सबै विधा", labelEnglish: "All Categories" },
    { id: "monument", labelNepali: "मन्दिर र स्मारक", labelEnglish: "Monuments & Temples" },
    { id: "festival", labelNepali: "चाडपर्व र जात्रा", labelEnglish: "Festivals & Rites" },
    { id: "scripture", labelNepali: "शास्त्र र दर्शन", labelEnglish: "Scriptures & Epics" },
    { id: "treaty", labelNepali: "ऐतिहासिक सन्धि", labelEnglish: "Treaties & Decrees" },
    { id: "historical_event", labelNepali: "ऐतिहासिक घटना", labelEnglish: "Historical Events" },
    { id: "manuscript", labelNepali: "पाण्डुलिपि", labelEnglish: "Manuscripts" },
    { id: "heritage", labelNepali: "सम्पदा र कला", labelEnglish: "Heritage & Art" }
  ];

  // Eras config
  const eras = [
    { id: "all", labelNepali: "सबै कालखण्ड", labelEnglish: "All Eras" },
    { id: "ancient", labelNepali: "प्राचीन काल", labelEnglish: "Ancient Era" },
    { id: "licchavi", labelNepali: "लिच्छवि काल", labelEnglish: "Licchavi Era" },
    { id: "malla", labelNepali: "मल्ल काल", labelEnglish: "Malla Era" },
    { id: "shah", labelNepali: "शाह काल", labelEnglish: "Shah Era" },
    { id: "modern", labelNepali: "आधुनिक काल", labelEnglish: "Modern Era" }
  ];

  // Filtered and chronologically sorted events
  const filteredEvents = useMemo(() => {
    let result = events.filter(evt => {
      const titleNp = (evt.titleNepali || "").toLowerCase();
      const titleEn = (evt.titleEnglish || "").toLowerCase();
      const summaryNp = (evt.summaryNepali || "").toLowerCase();
      const summaryEn = (evt.summaryEnglish || "").toLowerCase();
      const loc = (evt.location || "").toLowerCase();
      const yBS = (evt.yearBS || "").toLowerCase();
      const yAD = (evt.yearAD || "").toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || (
        titleNp.includes(q) ||
        titleEn.includes(q) ||
        summaryNp.includes(q) ||
        summaryEn.includes(q) ||
        loc.includes(q) ||
        yBS.includes(q) ||
        yAD.includes(q)
      );

      const matchesCat = selectedCategory === "all" || evt.category === selectedCategory;
      const matchesEra = selectedEra === "all" || evt.era === selectedEra;

      return matchesSearch && matchesCat && matchesEra;
    });

    // Chronological sort using resolveTimelineDate sortKey
    result.sort((a, b) => {
      const dateA = resolveTimelineDate(a);
      const dateB = resolveTimelineDate(b);
      return sortOrder === "asc" ? dateA.sortKey - dateB.sortKey : dateB.sortKey - dateA.sortKey;
    });

    return result;
  }, [events, searchQuery, selectedCategory, selectedEra, sortOrder]);

  const handleSelectEvent = (evt: TimelineEvent) => {
    setActiveEvent(evt);
    setSearchParams({ event: evt.id });
  };

  const handleCloseDetail = () => {
    setActiveEvent(null);
    setSearchParams({});
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEOHead
        title={language === "en" ? "Civilizational Timeline OS - Sanatan Marga" : "सभ्यतागत समयरेखा OS - सनातन मार्ग"}
        description="Authoritative, snapshot-first chronological engine indexing verified historical milestones, monuments, festivals, and treaties of Nepal."
        url="/timeline"
      />
      <Header />

      <main className="flex-grow container-custom max-w-5xl py-8 md:py-12 space-y-8">
        
        {/* Banner Section */}
        <div className="bg-card border border-border-theme rounded-3xl p-6 md:p-8 space-y-6 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />
          
          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <History size={14} /> Timeline OS R1 • Civilizational Chronology Engine
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xxs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck size={12} /> Verified Snapshot
              </span>
              {manifest && (
                <span className="text-xxs font-mono text-muted-text hidden sm:inline">
                  Snapshot: {manifest.snapshotVersion} ({manifest.totalEvents} Milestones)
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-4xl font-black text-card-foreground tracking-tight">
              {language === "en" ? "Civilizational Timeline of Nepal" : "नेपालको सभ्यतागत तथा ऐतिहासिक समयरेखा"}
            </h1>
            
            <p className="text-xs sm:text-sm text-muted-text max-w-3xl leading-relaxed">
              {language === "en" 
                ? "An authoritative, provenance-grounded chronological record indexing monuments, festivals, treaties, and philosophy across Licchavi, Malla, Shah, and Modern eras."
                : "प्राचीन, लिच्छवि, मल्ल, शाह तथा आधुनिक कालका प्रमाणित ऐतिहासिक घटना, मन्दिर स्थापना, चाडपर्व र सन्धिहरूलाई आधिकारिक स्रोत र प्रमाण सहित अन्वेषण गर्नुहोस्।"}
            </p>
          </div>

          {/* Search and Era Control */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-3 pt-4 border-t border-border-theme">
            <div className="md:col-span-6 relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
              <input
                type="text"
                placeholder={language === "en" ? "Search milestones, years, places, keywords..." : "ऐतिहासिक घटना, वर्ष, स्थान वा शब्द खोज्नुहोस्..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-muted-area/40 border border-border-theme rounded-2xl text-xs text-card-foreground focus:outline-none focus:border-primary transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-card-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedEra}
                onChange={e => setSelectedEra(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-muted-area/40 border border-border-theme rounded-2xl text-xs font-bold text-card-foreground focus:outline-none focus:border-primary cursor-pointer"
              >
                {eras.map(era => (
                  <option key={era.id} value={era.id}>
                    {language === "en" ? era.labelEnglish : era.labelNepali}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 flex items-center gap-2">
              <button
                onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                className="w-full px-3.5 py-2.5 bg-muted-area/40 hover:bg-muted-area border border-border-theme rounded-2xl text-xs font-bold text-card-foreground flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowUpDown size={14} />
                <span>{sortOrder === "asc" ? (language === "en" ? "Oldest First" : "प्राचीन पहिले") : (language === "en" ? "Newest First" : "नवीनतम पहिले")}</span>
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="relative z-10 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-primary text-white shadow-xs"
                    : "bg-muted-area text-muted-text hover:text-card-foreground border border-border-theme/80"
                }`}
              >
                {language === "en" ? cat.labelEnglish : cat.labelNepali}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-muted-text px-1">
          <span>
            {language === "en" ? `Showing ${filteredEvents.length} verified milestone(s)` : `कुल ${filteredEvents.length} प्रमाणित ऐतिहासिक कोशहरू प्रदर्शित`}
          </span>
          <span className="font-mono text-xxs">
            SanatanMarga Timeline Engine v1.0
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-16 rounded-3xl bg-card border border-border-theme text-center space-y-4 shadow-xs">
            <RefreshCw size={32} className="mx-auto text-primary animate-spin" />
            <p className="text-sm font-black text-card-foreground">
              समयरेखा तथ्याङ्क लोड हुँदैछ (Loading Authoritative Timeline Snapshot)...
            </p>
            <p className="text-xs text-muted-text">
              Zero-Firestore snapshot-first pipeline verification in progress.
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-center space-y-3">
            <Info size={32} className="mx-auto text-amber-500" />
            <p className="text-sm font-black text-card-foreground">
              समयरेखा स्न्यापशट पुनःप्राप्ति त्रुटि (Snapshot Retrieval Notice)
            </p>
            <p className="text-xs text-muted-text">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredEvents.length === 0 && (
          <div className="p-16 rounded-3xl bg-card border border-border-theme text-center space-y-3 shadow-xs">
            <History size={40} className="mx-auto text-muted-text/40" />
            <h3 className="text-base font-black text-card-foreground">
              {language === "en" ? "No Milestones Found" : "कुनै ऐतिहासिक कोश फेला परेन"}
            </h3>
            <p className="text-xs text-muted-text max-w-md mx-auto">
              {language === "en"
                ? "No verified events matched your filter criteria. Try resetting filters or searching with different terms."
                : "तपाईंको खोजी वा फिल्टर अनुसार कुनै ऐतिहासिक घटना भेटिएन। कृपया अन्य शब्द वा वर्ग चयन गर्नुहोस्।"}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedEra("all");
              }}
              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-block"
            >
              {language === "en" ? "Reset All Filters" : "सबै फिल्टर रिसेट गर्नुहोस्"}
            </button>
          </div>
        )}

        {/* Timeline Events Feed */}
        {!loading && !error && filteredEvents.length > 0 && (
          <div className="relative pl-6 md:pl-10 border-l-2 border-amber-500/30 space-y-10">
            {filteredEvents.map(evt => {
              const dateInfo = resolveTimelineDate(evt);
              const isSelected = activeEvent?.id === evt.id;

              return (
                <div 
                  key={evt.id} 
                  id={`timeline-event-${evt.id}`}
                  className="relative group scroll-mt-24"
                >
                  {/* Marker Node on Timeline */}
                  <div className={`absolute -left-[31px] md:-left-[47px] top-1.5 w-5 h-5 rounded-full bg-background border-4 transition-all ${
                    isSelected 
                      ? "border-primary scale-125 ring-4 ring-primary/20" 
                      : "border-amber-500 group-hover:scale-125"
                  }`} />

                  {/* Event Card */}
                  <div className={`bg-card border rounded-3xl p-6 sm:p-7 transition-all shadow-xs space-y-4 ${
                    isSelected 
                      ? "border-primary ring-2 ring-primary/20 bg-primary/[0.02]" 
                      : "border-border-theme hover:border-primary/40"
                  }`}>
                    
                    {/* Header: Date + Location + Verification */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-theme pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black font-mono tracking-wider border border-amber-500/20">
                          {dateInfo.displayYear}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-muted-area border border-border-theme text-xxs font-bold text-muted-text uppercase">
                          {evt.category}
                        </span>
                        {evt.era && (
                          <span className="px-2 py-0.5 rounded-full bg-muted-area/60 text-xxs font-bold text-muted-text">
                            {evt.era} era
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {evt.location && (
                          <span className="text-xs font-bold text-muted-text flex items-center gap-1">
                            <MapPin size={12} className="text-amber-500" /> {evt.location}
                          </span>
                        )}
                        <DataTruthBadge
                          status={evt.verificationStatus === "verified" ? "verified" : "pending"}
                          sourceName={evt.sourceOrg || evt.sourceTitle || "Verified Archive"}
                          sourceUrl={evt.sourceUrls?.[0]}
                          size="sm"
                        />
                      </div>
                    </div>

                    {/* Title & Summary */}
                    <div className="space-y-2">
                      <h3 className="text-lg md:text-xl font-black text-card-foreground">
                        {language === "en" ? evt.titleEnglish : evt.titleNepali}
                      </h3>
                      
                      {language === "en" && evt.titleNepali && (
                        <p className="text-xs text-muted-text font-medium">
                          मूल: {evt.titleNepali}
                        </p>
                      )}
                      
                      {language !== "en" && evt.titleEnglish && (
                        <p className="text-xs text-muted-text font-medium">
                          En: {evt.titleEnglish}
                        </p>
                      )}

                      <p className="text-xs sm:text-sm text-muted-text leading-relaxed pt-1">
                        {language === "en" ? (evt.summaryEnglish || evt.summaryNepali) : (evt.summaryNepali || evt.summaryEnglish)}
                      </p>
                    </div>

                    {/* Cross-OS Integrated Knowledge Links */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border-theme/60">
                      {evt.relatedKnowledgeNodeId && (
                        <Link 
                          to={`/knowledge/${evt.relatedKnowledgeNodeId}`} 
                          className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-500/20 flex items-center gap-1.5 transition-colors"
                        >
                          <Sparkles size={13} />
                          <span>Knowledge OS Node ({evt.relatedKnowledgeNodeId})</span>
                        </Link>
                      )}

                      {evt.relatedArticleId && (
                        <Link 
                          to={`/articles/${evt.relatedArticleId}`} 
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20 flex items-center gap-1.5 transition-colors"
                        >
                          <BookOpen size={13} />
                          <span>Verified News Article</span>
                        </Link>
                      )}

                      {evt.relatedProductId && (
                        <Link 
                          to={`/store?product=${evt.relatedProductId}`} 
                          className="px-3 py-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-bold border border-violet-500/20 flex items-center gap-1.5 transition-colors"
                        >
                          <ShoppingBag size={13} />
                          <span>Store Heritage Item</span>
                        </Link>
                      )}

                      <button
                        onClick={() => handleSelectEvent(evt)}
                        className="ml-auto px-3 py-1.5 rounded-xl bg-muted-area hover:bg-card border border-border-theme text-xs font-bold text-card-foreground flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <FileCheck size={13} className="text-emerald-500" />
                        <span>{language === "en" ? "View Provenance" : "स्रोत र प्रमाण"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* PROVENANCE DETAIL MODAL / DRAWER */}
      <AnimatePresence>
        {activeEvent && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border-theme rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-6 my-8"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-border-theme pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full inline-block font-mono">
                    {resolveTimelineDate(activeEvent).displayYear} • {activeEvent.category}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-card-foreground">
                    {language === "en" ? activeEvent.titleEnglish : activeEvent.titleNepali}
                  </h3>
                </div>
                <button
                  onClick={handleCloseDetail}
                  className="p-2 text-muted-text hover:text-card-foreground rounded-xl hover:bg-muted-area transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-text uppercase tracking-wider">
                  {language === "en" ? "Historical Milestone Summary" : "ऐतिहासिक सारांश"}
                </h4>
                <p className="text-xs sm:text-sm text-card-foreground leading-relaxed">
                  {language === "en" ? (activeEvent.summaryEnglish || activeEvent.summaryNepali) : (activeEvent.summaryNepali || activeEvent.summaryEnglish)}
                </p>
              </div>

              {/* Provenance Box */}
              <div className="p-4 rounded-2xl bg-muted-area/30 border border-border-theme space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-border-theme/60 pb-2">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <ShieldCheck size={15} />
                    <span>प्रमाणिकता विवरण (Provenance Metadata)</span>
                  </div>
                  <span className="text-xxs font-mono font-bold text-muted-text">
                    Confidence: {Math.round((activeEvent.confidenceScore || 0.95) * 100)}%
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {activeEvent.sourceTitle && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-muted-text">मूल ग्रन्थ वा स्रोत (Source Title):</span>
                      <strong className="text-card-foreground font-semibold">{activeEvent.sourceTitle}</strong>
                    </div>
                  )}

                  {activeEvent.sourceOrg && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-muted-text">प्रमाणित निकाय (Authority Org):</span>
                      <strong className="text-card-foreground font-semibold">{activeEvent.sourceOrg}</strong>
                    </div>
                  )}

                  {activeEvent.verifiedBy && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-muted-text">सम्पादकीय प्रमाणीकरण (Verified By):</span>
                      <strong className="text-card-foreground font-semibold">{activeEvent.verifiedBy}</strong>
                    </div>
                  )}

                  {activeEvent.verifiedAt && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-muted-text">प्रमाणीकरण मिति (Timestamp):</span>
                      <span className="font-mono text-card-foreground">{new Date(activeEvent.verifiedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Direct Citation URLs */}
                {activeEvent.sourceUrls && activeEvent.sourceUrls.length > 0 && (
                  <div className="pt-2 border-t border-border-theme/60 space-y-1.5">
                    <span className="text-xxs font-bold text-muted-text uppercase tracking-wider block">
                      आधिकारिक सन्दर्भ लिङ्कहरू (Verified Citation Links):
                    </span>
                    <div className="space-y-1">
                      {activeEvent.sourceUrls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-primary hover:underline text-xs font-mono break-all"
                        >
                          <ExternalLink size={12} className="shrink-0" />
                          <span className="truncate">{url}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Connected Modules */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {activeEvent.relatedKnowledgeNodeId && (
                  <Link
                    to={`/knowledge/${activeEvent.relatedKnowledgeNodeId}`}
                    className="flex-1 px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-500/20 text-center transition-colors"
                  >
                    Open Knowledge Node
                  </Link>
                )}
                {activeEvent.relatedArticleId && (
                  <Link
                    to={`/articles/${activeEvent.relatedArticleId}`}
                    className="flex-1 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20 text-center transition-colors"
                  >
                    Open Related Article
                  </Link>
                )}
                <button
                  onClick={handleCloseDetail}
                  className="px-4 py-2 bg-muted-area hover:bg-card border border-border-theme rounded-xl text-xs font-bold text-card-foreground transition-colors cursor-pointer"
                >
                  बन्द गर्नुहोस् (Close)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
