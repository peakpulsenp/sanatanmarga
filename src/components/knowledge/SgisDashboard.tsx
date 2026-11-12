import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  FileText, 
  Layers, 
  Network, 
  ShieldCheck, 
  Upload, 
  Eye, 
  BookMarked, 
  Cpu, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  RefreshCw, 
  Download,
  Scroll,
  Award,
  ChevronRight,
  Globe,
  Database,
  Lock,
  Activity,
  Wand2,
  Scan,
  Languages,
  Diff,
  History,
  FileCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { 
  SgisOSService, 
  SgisGrantha, 
  SgisRole, 
  SgisLifecycleStatus, 
  SEED_SGIS_GRANTHAS 
} from "@/src/services/sgisOSService";
import SgisPipelineStepper from "./sgis/SgisPipelineStepper";
import SgisOcrStudio from "./sgis/SgisOcrStudio";
import SgisTextCleaner from "./sgis/SgisTextCleaner";
import SgisGranthaStructurer from "./sgis/SgisGranthaStructurer";
import SgisKnowledgeLinkStudio from "./sgis/SgisKnowledgeLinkStudio";
import SgisScholarReviewStudio from "./sgis/SgisScholarReviewStudio";
import SgisRagStudio from "./sgis/SgisRagStudio";
import SgisObservabilityStudio from "./sgis/SgisObservabilityStudio";
import SgisExportModal from "./sgis/SgisExportModal";

export default function SgisDashboard() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "library" | "ocr" | "cleanup" | "structuring" | "knowledge_links" | "scholar_review" | "rag" | "health"
  >("overview");

  // Active Role State for RBAC
  const [currentRole, setCurrentRole] = useState<SgisRole>("Admin");

  const [manuscripts, setManuscripts] = useState<SgisGrantha[]>(SEED_SGIS_GRANTHAS);
  const [selectedManuscript, setSelectedManuscript] = useState<SgisGrantha>(SEED_SGIS_GRANTHAS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Load manuscripts on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const ms = await SgisOSService.getManuscripts();
        if (ms && ms.length > 0) {
          setManuscripts(ms);
          setSelectedManuscript(ms[0]);
        }
      } catch {} finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleManuscriptCreated = (newMs: SgisGrantha) => {
    setManuscripts(prev => [newMs, ...prev]);
    setSelectedManuscript(newMs);
    SgisOSService.saveManuscript(newMs);
    setActiveTab("cleanup");
  };

  const handleManuscriptUpdated = (updatedMs: SgisGrantha) => {
    setManuscripts(prev => prev.map(m => (m.id === updatedMs.id ? updatedMs : m)));
    setSelectedManuscript(updatedMs);
    SgisOSService.saveManuscript(updatedMs);
  };

  const filteredManuscripts = manuscripts.filter(m => {
    const q = searchQuery.toLowerCase();
    return (
      (m.titleNepali || "").toLowerCase().includes(q) ||
      (m.titleSanskrit || "").toLowerCase().includes(q) ||
      (m.accessionNumber || "").toLowerCase().includes(q) ||
      (m.author || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-background text-foreground pb-20">
      {/* Top Banner Header */}
      <div className="border-b border-border-theme bg-card/60 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sacred/10 border border-sacred/20 text-sacred flex items-center justify-center shadow-sm">
              <Scroll size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-foreground tracking-tight">
                  SGIS • सरस्वती ग्रन्थ इन्टेलिजेन्स प्रणाली
                </h1>
                <span className="text-[10px] font-black bg-sacred/10 text-sacred border border-sacred/20 px-2 py-0.5 rounded-full">
                  v3.8 Production
                </span>
              </div>
              <p className="text-[11px] text-muted-text">
                प्राचीन पाण्डुलिपि OCR, द्विदण्ड (॥) शुद्धीकरण, ज्ञानकोष समन्वय एवं सरस्वती RAG नियन्त्रण कक्ष
              </p>
            </div>
          </div>

          {/* Role Switcher & Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-muted-area p-1 rounded-xl border border-border-theme text-xs">
              <span className="text-[10px] font-black uppercase text-muted-text pl-1.5">भूमिका (Role):</span>
              {(["Admin", "Scholar", "Archivist", "Editor"] as SgisRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setCurrentRole(r);
                    toast.info(`सक्रिय भूमिका: '${r}' परिवर्तन भयो।`);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    currentRole === r
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-text hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowExportModal(true)}
              className="px-3 py-1.5 rounded-xl border border-border-theme bg-background hover:bg-muted-area text-xs font-bold text-foreground transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download size={14} /> Export (TEI/JSON)
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {[
            { id: "overview", label: "सिंहावलोकन (Overview)", icon: Activity },
            { id: "library", label: "ग्रन्थ सूची (Manuscripts)", icon: BookOpen },
            { id: "ocr", label: "१-२. OCR निष्कर्षण (Scan/OCR)", icon: Scan },
            { id: "cleanup", label: "३. शुद्धीकरण (Cleanup & Danda)", icon: Wand2 },
            { id: "structuring", label: "४. ग्रन्थ संरचना (Verses/IAST)", icon: BookMarked },
            { id: "knowledge_links", label: "५. ज्ञानकोष लिङ्किङ (Knowledge Graph)", icon: Network },
            { id: "scholar_review", label: "६. विद्वत् समीक्षा (Editorial)", icon: Award },
            { id: "rag", label: "सरस्वती RAG (Study Assistant)", icon: MessageSquare },
            { id: "health", label: "स्वास्थ्य एवं अब्जर्भ्याबिलिटी", icon: Cpu }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-text hover:text-foreground hover:bg-muted-area/50"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Visual Pipeline Stepper */}
        {selectedManuscript && (
          <SgisPipelineStepper
            currentStatus={selectedManuscript.lifecycleStatus}
            onSelectStep={(status) => {
              if (status === "UPLOADED" || status === "OCR_COMPLETE") setActiveTab("ocr");
              else if (status === "CLEANUP") setActiveTab("cleanup");
              else if (status === "TRANSLITERATION" || status === "TRANSLATION") setActiveTab("structuring");
              else if (status === "SCHOLAR_REVIEW" || status === "VERIFIED") setActiveTab("scholar_review");
            }}
          />
        )}

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-card border border-border-theme shadow-sm space-y-1">
                <span className="text-[10px] font-black uppercase text-muted-text">कुल पाण्डुलिपिहरू</span>
                <p className="text-2xl font-black text-foreground">{manuscripts.length}</p>
                <p className="text-[10px] text-muted-text">राष्ट्रिय अभिलेखालय एवं डिजिटल भल्ट</p>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border-theme shadow-sm space-y-1">
                <span className="text-[10px] font-black uppercase text-muted-text">सार्वजनिक प्रकाशित</span>
                <p className="text-2xl font-black text-emerald-600">
                  {manuscripts.filter(m => m.isPublishedToLibrary).length}
                </p>
                <p className="text-[10px] text-muted-text">विद्वत् प्रमाणित ग्रन्थहरू</p>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border-theme shadow-sm space-y-1">
                <span className="text-[10px] font-black uppercase text-muted-text">RAG Indexed Records</span>
                <p className="text-2xl font-black text-primary">
                  {manuscripts.filter(m => m.isIndexedInRag).length}
                </p>
                <p className="text-[10px] text-muted-text">सरस्वती RAG अनुसन्धान योग्य</p>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border-theme shadow-sm space-y-1">
                <span className="text-[10px] font-black uppercase text-muted-text">प्रतीक्षारत समीक्षा</span>
                <p className="text-2xl font-black text-amber-600">
                  {manuscripts.filter(m => m.scholarValidationStatus === "pending").length}
                </p>
                <p className="text-[10px] text-muted-text">विद्वान् प्रमाणीकरण बाँकी</p>
              </div>
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                onClick={() => setActiveTab("ocr")}
                className="p-5 rounded-2xl bg-card border border-border-theme shadow-sm hover:border-primary/50 transition-all cursor-pointer space-y-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-all">
                  <Scan size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">१. नयाँ पाण्डुलिपि OCR स्क्यान</h3>
                  <p className="text-xs text-muted-text mt-1">
                    ताडपत्र, भोजपत्र वा PDF स्क्यान अपलोड गरी लिपि पहिचान एवं OCR निष्कर्षण गर्नुहोस्।
                  </p>
                </div>
                <span className="text-xs font-bold text-primary flex items-center gap-1">
                  स्टुडियो खोल्नुहोस् <ChevronRight size={14} />
                </span>
              </div>

              <div 
                onClick={() => setActiveTab("cleanup")}
                className="p-5 rounded-2xl bg-card border border-border-theme shadow-sm hover:border-amber-500/50 transition-all cursor-pointer space-y-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-all">
                  <Wand2 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">२. पाठ शुद्धीकरण एवं द्विदण्ड (॥)</h3>
                  <p className="text-xs text-muted-text mt-1">
                    संस्कृत व्याकरण, '।।' बाट '॥' मानकीकरण र दोहोरो हलन्त हटाएर शुद्धिकरण गर्नुहोस्।
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                  शुद्धीकरण सुरु गर्नुहोस् <ChevronRight size={14} />
                </span>
              </div>

              <div 
                onClick={() => setActiveTab("rag")}
                className="p-5 rounded-2xl bg-card border border-border-theme shadow-sm hover:border-purple-500/50 transition-all cursor-pointer space-y-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-all">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">३. सरस्वती RAG सहायक</h3>
                  <p className="text-xs text-muted-text mt-1">
                    पाण्डुलिपि भल्टमा आधारित प्रामाणिक अनुसन्धान एवं प्रश्नोत्तर (No Source = No Answer)।
                  </p>
                </div>
                <span className="text-xs font-bold text-purple-600 flex items-center gap-1">
                  प्रश्नोत्तर सहायक खोल्नुहोस् <ChevronRight size={14} />
                </span>
              </div>
            </div>

            {/* Currently Active Selected Manuscript Preview Card */}
            {selectedManuscript && (
              <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-theme pb-3">
                  <div>
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">
                      चयनित पाण्डुलिपि (Active Record)
                    </span>
                    <h3 className="text-base font-black text-foreground mt-1">
                      {selectedManuscript.titleNepali} ({selectedManuscript.accessionNumber})
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-text">
                      {selectedManuscript.manuscriptMetadata?.repositoryName || "SGIS Digital Vault"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-muted-text">मूल संस्कृत पाठ:</span>
                    <div className="p-3.5 rounded-xl bg-muted-area/40 border border-border-theme font-serif text-sm text-foreground">
                      {selectedManuscript.originalText}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-muted-text">नेपाली भावार्थ:</span>
                    <div className="p-3.5 rounded-xl bg-muted-area/40 border border-border-theme text-xs text-foreground leading-relaxed">
                      {selectedManuscript.translationNepali || "अनुवाद प्रक्रियामा छ..."}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Granthas Library */}
        {activeTab === "library" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border-theme rounded-2xl p-4 shadow-sm">
              <div className="relative flex-1 min-w-[240px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="पाण्डुलिपि नाम, Accession No, लेखक वा लिपि खोज्नुहोस्..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border-theme text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <button
                onClick={() => setActiveTab("ocr")}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm shadow-primary/20 cursor-pointer"
              >
                <Plus size={14} /> नयाँ पाण्डुलिपि थप्नुहोस् (New Manuscript)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredManuscripts.map((ms) => {
                const isSelected = selectedManuscript.id === ms.id;
                return (
                  <div
                    key={ms.id}
                    onClick={() => setSelectedManuscript(ms)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? "bg-primary/5 border-primary shadow-md shadow-primary/10"
                        : "bg-card border border-border-theme hover:border-primary/40 hover:bg-muted-area/30"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-mono">
                          {ms.accessionNumber}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          ms.isPublishedToLibrary
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                        }`}>
                          {ms.lifecycleStatus}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-foreground line-clamp-1">{ms.titleNepali}</h4>
                      <p className="text-xs font-serif text-muted-text line-clamp-2 mt-1">{ms.originalText}</p>
                    </div>

                    <div className="pt-2 border-t border-border-theme flex items-center justify-between text-[11px] text-muted-text">
                      <span>लिपि: <strong className="text-foreground">{ms.manuscriptMetadata?.script || "Devanagari"}</strong></span>
                      <span className="text-emerald-600 font-bold">
                        {Math.round((ms.ocrConfidence || 0.98) * 100)}% OCR
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: OCR Studio */}
        {activeTab === "ocr" && (
          <SgisOcrStudio
            currentRole={currentRole}
            selectedManuscript={selectedManuscript}
            onManuscriptCreated={handleManuscriptCreated}
          />
        )}

        {/* Tab 4: Text Cleanup */}
        {activeTab === "cleanup" && selectedManuscript && (
          <SgisTextCleaner
            selectedManuscript={selectedManuscript}
            currentRole={currentRole}
            onManuscriptUpdated={handleManuscriptUpdated}
          />
        )}

        {/* Tab 5: Grantha Structuring */}
        {activeTab === "structuring" && selectedManuscript && (
          <SgisGranthaStructurer
            selectedManuscript={selectedManuscript}
            currentRole={currentRole}
            onManuscriptUpdated={handleManuscriptUpdated}
          />
        )}

        {/* Tab 6: Knowledge Links */}
        {activeTab === "knowledge_links" && selectedManuscript && (
          <SgisKnowledgeLinkStudio
            selectedManuscript={selectedManuscript}
            currentRole={currentRole}
            onManuscriptUpdated={handleManuscriptUpdated}
          />
        )}

        {/* Tab 7: Scholar Review */}
        {activeTab === "scholar_review" && selectedManuscript && (
          <SgisScholarReviewStudio
            selectedManuscript={selectedManuscript}
            currentRole={currentRole}
            onManuscriptUpdated={handleManuscriptUpdated}
          />
        )}

        {/* Tab 8: Saraswati RAG Assistant */}
        {activeTab === "rag" && (
          <SgisRagStudio manuscripts={manuscripts} />
        )}

        {/* Tab 9: Pipeline Health & Observability */}
        {activeTab === "health" && (
          <SgisObservabilityStudio manuscripts={manuscripts} />
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && selectedManuscript && (
        <SgisExportModal
          grantha={selectedManuscript}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
