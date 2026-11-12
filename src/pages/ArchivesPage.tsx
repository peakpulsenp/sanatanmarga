import React, { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import SEOHead from "@/src/components/common/SEOHead";
import { 
  Archive, 
  Search, 
  BookOpen, 
  Calendar, 
  Landmark, 
  Sparkles, 
  Download, 
  ExternalLink, 
  Filter, 
  ShieldCheck, 
  ScrollText, 
  History,
  Tag,
  ArrowUpDown,
  RefreshCw,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  Scroll
} from "lucide-react";
import { 
  ArchiveRecord, 
  ArchiveManifest, 
  ArchiveHealth, 
  ArchiveEra, 
  ArchiveCategory,
  resolveArchiveDate 
} from "@/src/services/archive/archiveTypes";
import { archiveSnapshotService } from "@/src/services/archive/archiveSnapshotService";
import { DataTruthBadge } from "@/src/components/common/DataTruthBadge";
import ArchiveDetailModal from "@/src/components/archive/ArchiveDetailModal";
import { useLanguage } from "@/src/context/LanguageContext";
import { motion, AnimatePresence } from "motion/react";

export default function ArchivesPage() {
  const { id: paramId } = useParams<{ id?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const queryRecordId = searchParams.get("record");
  const activeRecordId = paramId || queryRecordId;

  const [records, setRecords] = useState<ArchiveRecord[]>([]);
  const [manifest, setManifest] = useState<ArchiveManifest | null>(null);
  const [health, setHealth] = useState<ArchiveHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEra, setSelectedEra] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"chrono_asc" | "chrono_desc" | "verified" | "alpha">("chrono_asc");

  const [selectedRecord, setSelectedRecord] = useState<ArchiveRecord | null>(null);

  // Load public snapshot
  const loadSnapshot = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, man, hlth] = await Promise.all([
        archiveSnapshotService.getPublicArchives(),
        archiveSnapshotService.getArchiveManifest(),
        archiveSnapshotService.getArchiveHealth()
      ]);
      setRecords(data);
      setManifest(man);
      setHealth(hlth);
    } catch (err: any) {
      console.error("[ArchivesPage] Failed to fetch archives snapshot:", err);
      setError("अभिलेख स्न्यापसट अहिले उपलब्ध छैन। प्रमाणित अभिलेख पुनःसिंक भएपछि यहाँ देखिनेछ।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshot();
  }, []);

  // Sync selected record with URL params
  useEffect(() => {
    if (activeRecordId && records.length > 0) {
      const found = records.find(r => r.id.toLowerCase() === activeRecordId.toLowerCase());
      if (found) {
        setSelectedRecord(found);
      }
    } else if (!activeRecordId) {
      setSelectedRecord(null);
    }
  }, [activeRecordId, records]);

  const handleSelectRecord = (rec: ArchiveRecord) => {
    setSelectedRecord(rec);
    setSearchParams({ record: rec.id });
  };

  const handleCloseModal = () => {
    setSelectedRecord(null);
    if (paramId) {
      navigate("/archives");
    } else {
      setSearchParams({});
    }
  };

  // Filter & Search Logic
  const filteredAndSortedRecords = useMemo(() => {
    let result = records.filter(rec => {
      const matchesEra = selectedEra === "all" || rec.era === selectedEra;
      const matchesCat = selectedCategory === "all" || rec.category === selectedCategory;
      const s = (searchTerm || "").toLowerCase().trim();
      if (!s) return matchesEra && matchesCat;

      const searchableText = [
        rec.title,
        rec.titleNepali,
        rec.summary,
        rec.summaryNepali,
        rec.description,
        rec.location,
        rec.district,
        rec.province,
        rec.era,
        rec.category,
        rec.sourceTitle,
        rec.yearBS,
        rec.yearAD
      ].filter(Boolean).join(" ").toLowerCase();

      return matchesEra && matchesCat && searchableText.includes(s);
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "chrono_asc") {
        return resolveArchiveDate(a).sortKey - resolveArchiveDate(b).sortKey;
      }
      if (sortBy === "chrono_desc") {
        return resolveArchiveDate(b).sortKey - resolveArchiveDate(a).sortKey;
      }
      if (sortBy === "verified") {
        const timeA = new Date(a.verifiedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.verifiedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      }
      if (sortBy === "alpha") {
        const nameA = language === "en" ? a.title : a.titleNepali;
        const nameB = language === "en" ? b.title : b.titleNepali;
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    return result;
  }, [records, selectedEra, selectedCategory, searchTerm, sortBy, language]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEOHead
        title={
          selectedRecord 
            ? `${selectedRecord.titleNepali} (${selectedRecord.title}) | सनातन अभिलेखालय`
            : "सनातन ऐतिहासिक डिजिटल अभिलेखालय (Sanatan Archives OS) | सनातन मार्ग"
        }
        description={
          selectedRecord
            ? selectedRecord.summaryNepali || selectedRecord.summary
            : "नेपालको सभ्यतागत इतिहास, मल्ल तथा शाहकालीन पाण्डुलिपि, पञ्चायत तथा राणाकालीन ऐतिहासिक सन्धि दस्तावेज र संवैधानिक ऐतिहासिक अभिलेखको प्रमाणित खोज केन्द्र।"
        }
        url={selectedRecord ? `/archives/${selectedRecord.id}` : "/archives"}
      />
      <Header />

      <main className="flex-grow container-custom max-w-6xl py-8 md:py-12 space-y-8">
        {/* Banner Section */}
        <div className="bg-card border border-border-theme rounded-3xl p-6 md:p-10 space-y-4 shadow-sm relative overflow-hidden">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
              <Archive size={14} /> Civilizational Knowledge Vault • Archives OS
            </span>

            {manifest ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck size={14} />
                <span>अभिलेख स्न्यापसट • Verified Snapshot • v{manifest.snapshotVersion}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-muted-area text-muted-text border border-border-theme">
                <ShieldCheck size={14} />
                <span>प्रमाणित डिजिटल अभिलेखालय</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-display text-card-foreground tracking-tight">
            सनातन ऐतिहासिक डिजिटल अभिलेखालय (Archives OS)
          </h1>
          <p className="text-muted-text text-sm md:text-base max-w-3xl leading-relaxed">
            नेपालको सभ्यतागत इतिहास, मल्ल तथा शाहकालीन पाण्डुलिपि, पञ्चायत तथा राणाकालीन ऐतिहासिक सन्धि दस्तावेज र संवैधानिक ऐतिहासिक अभिलेखको प्रमाणित एवं स्थायी खोज केन्द्र।
          </p>

          {/* Search Bar & Filter Controls */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text w-4 h-4" />
                <input
                  type="text"
                  placeholder="अभिलेख, ताडपत्र, सन्धि, शिलालेख वा कालखण्ड खोज्नुहोस्..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-muted-area border border-border-theme text-sm font-bold text-foreground focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    aria-label="क्रमबद्ध गर्नुहोस् (Sort records)"
                    className="px-3.5 py-3 rounded-2xl bg-muted-area border border-border-theme text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="chrono_asc">कालक्रम: पुरानो पहिले (Oldest)</option>
                    <option value="chrono_desc">कालक्रम: नयाँ पहिले (Newest)</option>
                    <option value="verified">भर्खरै प्रमाणित (Recently Verified)</option>
                    <option value="alpha">वर्णानुक्रम (Alphabetical)</option>
                  </select>
                </div>

                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    aria-label="विधा छान्नुहोस् (Filter by category)"
                    className="px-3.5 py-3 rounded-2xl bg-muted-area border border-border-theme text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="all">सबै विधा (All Categories)</option>
                    <option value="manuscript">पाण्डुलिपि (Manuscript)</option>
                    <option value="treaty">सन्धि (Treaty)</option>
                    <option value="constitutional">संवैधानिक (Constitutional)</option>
                    <option value="historical_document">ऐतिहासिक दस्तावेज</option>
                    <option value="inscription">शिलालेख (Inscription)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Era Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: "all", label: "सबै कालखण्ड (All)" },
                { id: "ancient", label: "प्राचीन काल (Ancient)" },
                { id: "malla", label: "मल्ल काल (Malla)" },
                { id: "shah", label: "शाह काल (Shah)" },
                { id: "rana", label: "राणा शासन (Rana)" },
                { id: "panchayat", label: "पञ्चायत काल (Panchayat)" },
                { id: "modern", label: "आधुनिक काल (Modern)" }
              ].map(era => (
                <button
                  key={era.id}
                  onClick={() => setSelectedEra(era.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedEra === era.id
                      ? "bg-primary text-white shadow-xs"
                      : "bg-muted-area text-muted-text hover:text-foreground border border-border-theme"
                  }`}
                >
                  {era.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="p-16 text-center text-muted-text space-y-3">
            <RefreshCw size={28} className="mx-auto animate-spin text-primary" />
            <p className="text-sm font-bold">प्रमाणित ऐतिहासिक अभिलेखालय स्न्यापसट लोड हुँदैछ...</p>
          </div>
        ) : error || records.length === 0 ? (
          <div className="p-12 text-center bg-card border border-border-theme rounded-3xl space-y-3">
            <AlertCircle size={32} className="mx-auto text-amber-500" />
            <h3 className="text-base font-bold text-foreground">
              अभिलेख स्न्यापसट अहिले उपलब्ध छैन।
            </h3>
            <p className="text-xs text-muted-text max-w-md mx-auto">
              प्रमाणित अभिलेख पुनःसिंक भएपछि यहाँ देखिनेछ। कुनै पनि नक्कली वा बनावटी डेटा सार्वजनिक गरिँदैन।
            </p>
          </div>
        ) : (
          /* Records Grid Header & Grid */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-theme pb-3">
              <h3 className="text-sm font-black text-card-foreground flex items-center gap-2">
                <History size={18} className="text-amber-500" />
                <span>प्रमाणित ऐतिहासिक दस्तावेज तथा पाण्डुलिपिहरू ({filteredAndSortedRecords.length})</span>
              </h3>

              <div className="flex items-center gap-2 text-xs text-muted-text">
                <span>सत्यता स्रोत: <strong>राष्ट्रिय अभिलेखालय एवं इतिहास परिषद्</strong></span>
              </div>
            </div>

            {filteredAndSortedRecords.length === 0 ? (
              <div className="p-12 text-center bg-card border border-border-theme rounded-3xl space-y-2">
                <Search size={28} className="mx-auto text-muted-text opacity-40" />
                <p className="text-sm font-bold text-foreground">कुनै अभिलेख फेला परेन।</p>
                <p className="text-xs text-muted-text">कृपया खोज शब्द वा कालखण्ड फिल्टर परिवर्तन गर्नुहोस्।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredAndSortedRecords.map(rec => {
                  const dateInfo = resolveArchiveDate(rec);
                  return (
                    <div
                      key={rec.id}
                      onClick={() => handleSelectRecord(rec)}
                      className="bg-card border border-border-theme hover:border-primary/40 rounded-3xl p-6 transition-all shadow-xs hover:shadow-md space-y-4 flex flex-col justify-between cursor-pointer group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/20">
                            {dateInfo.displayYearNp}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {rec.sgisRecordId && (
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold border border-purple-500/20">
                                SGIS
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-muted-text uppercase bg-muted-area px-2 py-0.5 rounded-md">
                              {rec.category}
                            </span>
                          </div>
                        </div>

                        <h4 className="text-base font-bold text-card-foreground group-hover:text-primary transition-colors">
                          {language === "en" ? rec.title : rec.titleNepali}
                        </h4>

                        <p className="text-xs text-muted-text leading-relaxed line-clamp-3">
                          {language === "en" ? rec.summary : rec.summaryNepali}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-border-theme/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <DataTruthBadge
                            status="verified"
                            provenance="VERIFIED OFFICIAL SOURCE"
                            timestamp={rec.verifiedAt || rec.createdAt}
                            sourceName={rec.verifiedBy || "Sanatan Knowledge Council"}
                            size="xs"
                            showSourceLink={false}
                            showModalOnInfoClick={false}
                          />
                        </div>

                        <button className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all text-xs font-bold flex items-center gap-1">
                          <BookOpen size={12} />
                          <span>हेर्नुहोस्</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Detail Modal Component */}
      <AnimatePresence>
        {selectedRecord && (
          <ArchiveDetailModal
            record={selectedRecord}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
