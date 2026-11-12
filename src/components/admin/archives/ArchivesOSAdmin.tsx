import React, { useState, useEffect } from "react";
import {
  Archive, Plus, Search, Edit3, Trash2, CheckCircle2,
  FileText, Link2, RefreshCw, X, Save, Eye, Sparkles, Filter,
  ExternalLink, AlertTriangle, ShieldCheck, Download, History,
  Scroll, Cpu, Check, ArrowRight, Layers, Upload
} from "lucide-react";
import {
  ArchiveRecord,
  ArchiveStatus,
  ArchiveVerificationStatus,
  ArchiveEra,
  ArchiveCategory,
  ArchiveManifest,
  ArchiveHealth,
  resolveArchiveDate
} from "@/src/services/archive/archiveTypes";
import { archiveRepository } from "@/src/services/archive/archiveRepository";
import { archiveSnapshotService } from "@/src/services/archive/archiveSnapshotService";
import { ArchiveAuditEngine, ArchiveAuditReport } from "@/src/services/archive/archiveAuditEngine";
import { ArchiveAuditLogger, ArchiveAuditLogEntry } from "@/src/services/archive/archiveAuditLogger";
import { EXPANDED_ARCHIVE_RECORDS } from "@/src/data/authoritativeContent";
import { useAuth } from "@/src/lib/auth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export default function ArchivesOSAdmin() {
  const { user } = useAuth();
  const [records, setRecords] = useState<ArchiveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEra, setSelectedEra] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ArchiveRecord | null>(null);
  const [auditReport, setAuditReport] = useState<ArchiveAuditReport | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [historyRecordId, setHistoryRecordId] = useState<string | null>(null);
  const [historyLogs, setHistoryLogs] = useState<ArchiveAuditLogEntry[]>([]);
  const [migrating, setMigrating] = useState(false);
  const [manifest, setManifest] = useState<ArchiveManifest | null>(null);
  const [health, setHealth] = useState<ArchiveHealth | null>(null);

  const actor = {
    id: user?.email || user?.uid || "admin@sanatanmarga.org",
    role: user?.role || "admin"
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Try to load all admin records from repository
      const repoRecords = await archiveRepository.getAllArchives();
      const manifestData = await archiveSnapshotService.getArchiveManifest();
      const healthData = await archiveSnapshotService.getArchiveHealth();
      setManifest(manifestData);
      setHealth(healthData);

      if (repoRecords && repoRecords.length > 0) {
        setRecords(repoRecords);
      } else {
        // Fallback to snapshot records for view
        const snapshotRecords = await archiveSnapshotService.getPublicArchives();
        setRecords(snapshotRecords);
      }
    } catch (e) {
      console.error("[ArchivesOSAdmin] Failed to load data:", e);
      toast.error("अभिलेख डेटा लोड गर्न त्रुटि भयो।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Form state
  const [formData, setFormData] = useState<Partial<ArchiveRecord>>({
    title: "",
    titleNepali: "",
    summary: "",
    summaryNepali: "",
    yearBS: "",
    yearAD: "",
    era: "shah",
    category: "historical_document",
    location: "Kathmandu",
    district: "Kathmandu",
    province: "Bagmati",
    description: "",
    connectedKnowledgeNodeIds: [],
    relatedTimelineEventIds: [],
    relatedArticleIds: [],
    sgisRecordId: "",
    documentUrl: "",
    ocrText: "",
    status: "draft",
    verificationStatus: "unverified",
    sourceTitle: "राष्ट्रिय अभिलेखालय (National Archives of Nepal)",
    sourceUrls: ["https://nationalarchives.gov.np"],
    verifiedBy: "Sanatan Knowledge Council",
    confidenceScore: 0.95
  });

  const handleOpenCreate = () => {
    setEditingRecord(null);
    setFormData({
      id: `arch_${Date.now()}`,
      title: "",
      titleNepali: "",
      summary: "",
      summaryNepali: "",
      yearBS: "२०८०",
      yearAD: "2023",
      era: "modern",
      category: "historical_document",
      location: "Kathmandu",
      district: "Kathmandu",
      province: "Bagmati",
      description: "",
      connectedKnowledgeNodeIds: [],
      relatedTimelineEventIds: [],
      relatedArticleIds: [],
      sgisRecordId: "",
      documentUrl: "",
      ocrText: "",
      status: "draft",
      verificationStatus: "unverified",
      sourceTitle: "राष्ट्रिय अभिलेखालय (National Archives of Nepal)",
      sourceUrls: ["https://nationalarchives.gov.np"],
      verifiedBy: "Sanatan Knowledge Council",
      confidenceScore: 0.95
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: ArchiveRecord) => {
    setEditingRecord(rec);
    setFormData({ ...rec });
    setIsModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.titleNepali) {
      toast.error("कृपया नेपाली र अंग्रेजी शीर्षक अनिवार्य भर्नुहोस्।");
      return;
    }

    try {
      if (editingRecord) {
        await archiveRepository.updateArchive(editingRecord.id, formData, actor);
        toast.success("अभिलेख सफलतापूर्वक अद्यावधिक गरियो।");
      } else {
        await archiveRepository.createArchive(formData, actor);
        toast.success("नयाँ अभिलेख सफलतापूर्वक सिर्जना गरियो।");
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(`त्रुटि: ${err.message || "Operation failed"}`);
    }
  };

  const handleStatusChange = async (rec: ArchiveRecord, nextStatus: ArchiveStatus) => {
    try {
      if (nextStatus === "pending_review") {
        await archiveRepository.submitForReview(rec.id, actor);
        toast.success("समीक्षाका लागि पठाइयो।");
      } else if (nextStatus === "verified") {
        await archiveRepository.verifyArchive(rec.id, 0.96, actor);
        toast.success("अभिलेख प्रमाणित गरियो।");
      } else if (nextStatus === "published") {
        await archiveRepository.publishArchive(rec.id, actor);
        toast.success("सार्वजनिक स्न्यापसटमा प्रकाशित गरियो।");
      } else if (nextStatus === "deprecated") {
        const reason = window.prompt("Deprecation Reason / खारेजीको कारण:");
        if (reason) {
          await archiveRepository.deprecateArchive(rec.id, reason, actor);
          toast.warning("अभिलेख खारेज गरियो।");
        }
      } else if (nextStatus === "archived") {
        const reason = window.prompt("Archival Reason / सङ्ग्रह कारण:");
        if (reason) {
          await archiveRepository.archiveArchive(rec.id, reason, actor);
          toast.info("अभिलेख कोल्ड आर्काइभमा सारियो।");
        }
      }
      await loadData();
    } catch (e: any) {
      toast.error(`स्थिति परिवर्तन गर्न असफल: ${e.message}`);
    }
  };

  const handleRunIntegrityAudit = () => {
    const report = ArchiveAuditEngine.runAudit(records, manifest, health);
    setAuditReport(report);
    setShowAuditModal(true);
    if (report.failCount === 0) {
      toast.success(`अभिलेख स्वास्थ अडिट सफल! स्कोर: ${report.overallScore}%`);
    } else {
      toast.error(`अडिटमा ${report.failCount} असफलता फेला पर्‍यो।`);
    }
  };

  const handleViewAuditHistory = async (recId: string) => {
    setHistoryRecordId(recId);
    const logs = await ArchiveAuditLogger.getLogs(recId, 30);
    setHistoryLogs(logs);
  };

  const handleMigrateLegacy = async () => {
    if (!window.confirm("के तपाईं पुरानो EXPANDED_ARCHIVE_RECORDS लाई प्रमाणित मेटाडाटा सहित आयात गर्न चाहनुहुन्छ?")) {
      return;
    }
    setMigrating(true);
    try {
      const res = await archiveRepository.migrateLegacyRecords(EXPANDED_ARCHIVE_RECORDS, actor);
      toast.success(`${res.migrated} पुरानो अभिलेख सफलतापूर्वक आयात तथा प्रमाणित भयो!`);
      await loadData();
    } catch (e: any) {
      toast.error(`आयात असफल: ${e.message}`);
    } finally {
      setMigrating(false);
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesEra = selectedEra === "all" || r.era === selectedEra;
    const matchesCat = selectedCategory === "all" || r.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || r.status === selectedStatus;
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      (r.title || "").toLowerCase().includes(s) ||
      (r.titleNepali || "").includes(searchTerm) ||
      (r.id || "").toLowerCase().includes(s) ||
      (r.sourceTitle || "").toLowerCase().includes(s);
    return matchesEra && matchesCat && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* OS Banner */}
      <div className="bg-card border border-border-theme rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Archives OS R1 • Verified Governance
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={12} /> Snapshot-First Active
            </span>
          </div>
          <h2 className="text-xl font-black text-card-foreground">
            ऐतिहासिक अभिलेखालय प्रशासन एवं जीवनचक्र व्यवस्थापन
          </h2>
          <p className="text-xs text-muted-text">
            प्रमाणित पाण्डुलिपि, सन्धि, शिलालेख तथा संवैधानिक दस्तावेजहरूको आधिकारिक सम्पादन, SGIS म्यापिङ र सत्यता अडिट।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunIntegrityAudit}
            className="px-3.5 py-2 rounded-2xl bg-muted-area hover:bg-muted text-foreground border border-border-theme text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Cpu size={14} className="text-primary" />
            <span>सत्यता अडिट [AR-A..T]</span>
          </button>

          <button
            onClick={handleMigrateLegacy}
            disabled={migrating}
            className="px-3.5 py-2 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Layers size={14} />
            <span>{migrating ? "आयात हुँदै..." : "लिगेसी डेटा सिङ्क"}</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-2xl bg-primary hover:bg-primary/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>नयाँ अभिलेख थप्नुहोस्</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-muted-text uppercase">कुल अभिलेख (Total)</span>
          <p className="text-2xl font-black text-foreground mt-1">{records.length}</p>
          <span className="text-[10px] text-muted-text">व्यवस्थापन सूचीमा</span>
        </div>
        <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-muted-text uppercase">सार्वजनिक (Published)</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {records.filter(r => r.status === "published").length}
          </p>
          <span className="text-[10px] text-emerald-600">स्न्यापसटमा उपलब्ध</span>
        </div>
        <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-muted-text uppercase">प्रमाणित (Verified)</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {records.filter(r => r.verificationStatus === "verified").length}
          </p>
          <span className="text-[10px] text-muted-text">उच्च विश्वसनीयता ≥०.८</span>
        </div>
        <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-muted-text uppercase">SGIS जोडिएका (Grantha)</span>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {records.filter(r => r.sgisRecordId).length}
          </p>
          <span className="text-[10px] text-purple-600">पाण्डुलिपि इन्टेलिजेन्स</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text w-4 h-4" />
            <input
              type="text"
              placeholder="अभिलेख शीर्षक, ID, वा स्रोत खोज्नुहोस्..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted-area border border-border-theme text-xs font-bold text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedEra}
              onChange={e => setSelectedEra(e.target.value)}
              className="px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-xs font-bold text-foreground focus:outline-none"
            >
              <option value="all">सबै कालखण्ड (All Eras)</option>
              <option value="ancient">प्राचीन काल (Ancient)</option>
              <option value="malla">मल्ल काल (Malla)</option>
              <option value="shah">शाह काल (Shah)</option>
              <option value="rana">राणा शासन (Rana)</option>
              <option value="panchayat">पञ्चायत काल (Panchayat)</option>
              <option value="modern">आधुनिक काल (Modern)</option>
            </select>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-xs font-bold text-foreground focus:outline-none"
            >
              <option value="all">सबै विधा (All Categories)</option>
              <option value="manuscript">पाण्डुलिपि (Manuscript)</option>
              <option value="treaty">सन्धि (Treaty)</option>
              <option value="constitutional">संवैधानिक (Constitutional)</option>
              <option value="historical_document">ऐतिहासिक दस्तावेज</option>
              <option value="inscription">शिलालेख (Inscription)</option>
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-xs font-bold text-foreground focus:outline-none"
            >
              <option value="all">सबै स्थिति (All Status)</option>
              <option value="published">Published (सार्वजनिक)</option>
              <option value="verified">Verified (प्रमाणित)</option>
              <option value="pending_review">Pending Review (समीक्षा)</option>
              <option value="draft">Draft (मस्यौदा)</option>
              <option value="deprecated">Deprecated (खारेज)</option>
              <option value="archived">Archived (संग्रहित)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Record Table / List */}
      <div className="bg-card border border-border-theme rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border-theme flex items-center justify-between">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2">
            <Archive size={16} className="text-amber-500" />
            <span>अभिलेख सूची ({filteredRecords.length})</span>
          </h3>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-text hover:text-foreground cursor-pointer transition-colors"
            title="रिफ्रेस गर्नुहोस्"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-muted-text space-y-2">
            <Archive size={32} className="mx-auto opacity-30" />
            <p className="text-sm font-bold">कुनै अभिलेख फेला परेन।</p>
            <p className="text-xs">खोज सर्त परिवर्तन गर्नुहोस् वा नयाँ अभिलेख थप्नुहोस्।</p>
          </div>
        ) : (
          <div className="divide-y divide-border-theme overflow-x-auto">
            {filteredRecords.map(rec => {
              const dateInfo = resolveArchiveDate(rec);
              return (
                <div key={rec.id} className="p-4 hover:bg-muted-area/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase">
                        {dateInfo.displayYearNp}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-muted-area text-muted-text text-[10px] font-bold uppercase">
                        {rec.era} • {rec.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${rec.status === "published"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : rec.status === "verified"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : rec.status === "pending_review"
                            ? "bg-amber-500/10 text-amber-600"
                            : rec.status === "draft"
                              ? "bg-muted-area text-muted-text"
                              : "bg-red-500/10 text-red-600"
                        }`}>
                        {rec.status}
                      </span>
                      {rec.sgisRecordId && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-black">
                          SGIS: {rec.sgisRecordId}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-foreground">
                      {rec.titleNepali}
                    </h4>
                    <p className="text-xs text-muted-text font-mono">
                      {rec.title}
                    </p>
                    <p className="text-xs text-muted-text line-clamp-1">
                      {rec.summaryNepali || rec.summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-text pt-1">
                      <span>स्रोत: <strong className="text-foreground">{rec.sourceTitle || "अज्ञात"}</strong></span>
                      {rec.verifiedBy && <span>प्रमाणक: <strong>{rec.verifiedBy}</strong></span>}
                      {typeof rec.confidenceScore === "number" && (
                        <span>विश्वसनीयता: <strong className="text-emerald-600">{Math.round(rec.confidenceScore * 100)}%</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status transition dropdown / action buttons */}
                    {rec.status === "draft" && (
                      <button
                        onClick={() => handleStatusChange(rec, "pending_review")}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 text-xs font-bold transition-all cursor-pointer"
                      >
                        समीक्षा पठाउनुहोस्
                      </button>
                    )}
                    {rec.status === "pending_review" && (
                      <button
                        onClick={() => handleStatusChange(rec, "verified")}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 text-xs font-bold transition-all cursor-pointer"
                      >
                        प्रमाणित गर्नुहोस्
                      </button>
                    )}
                    {(rec.status === "verified" || rec.status === "draft") && (
                      <button
                        onClick={() => handleStatusChange(rec, "published")}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all cursor-pointer"
                      >
                        प्रकाशित गर्नुहोस्
                      </button>
                    )}
                    {rec.status === "published" && (
                      <button
                        onClick={() => handleStatusChange(rec, "deprecated")}
                        className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 text-xs font-bold transition-all cursor-pointer"
                      >
                        खारेज (Deprecate)
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEdit(rec)}
                      className="p-2 rounded-xl bg-muted-area hover:bg-muted text-foreground transition-all cursor-pointer"
                      title="सम्पादन गर्नुहोस्"
                    >
                      <Edit3 size={14} />
                    </button>

                    <button
                      onClick={() => handleViewAuditHistory(rec.id)}
                      className="p-2 rounded-xl bg-muted-area hover:bg-muted text-muted-text hover:text-foreground transition-all cursor-pointer"
                      title="अडिट इतिहास"
                    >
                      <History size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit / Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border-theme rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-border-theme pb-4">
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Archive size={18} className="text-amber-500" />
                  <span>{editingRecord ? "अभिलेख सम्पादन" : "नयाँ अभिलेख सिर्जना"}</span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-text cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-4 text-xs font-bold">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-muted-text">नेपाली शीर्षक (Nepali Title) *</label>
                    <input
                      type="text"
                      required
                      value={formData.titleNepali || ""}
                      onChange={e => setFormData({ ...formData, titleNepali: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-muted-area border border-border-theme text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-muted-text">अंग्रेजी शीर्षक (English Title) *</label>
                    <input
                      type="text"
                      required
                      value={formData.title || ""}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-muted-area border border-border-theme text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-muted-text">वर्ष (BS Year)</label>
                    <input
                      type="text"
                      value={formData.yearBS || ""}
                      onChange={e => setFormData({ ...formData, yearBS: e.target.value })}
                      placeholder="वि.सं. १९१०"
                      className="w-full p-2.5 rounded-xl bg-muted-area border border-border-theme text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-muted-text">वर्ष (AD Year)</label>
                    <input
                      type="text"
                      value={formData.yearAD || ""}
                      onChange={e => setFormData({ ...formData, yearAD: e.target.value })}
                      placeholder="1854"
                      className="w-full p-2.5 rounded-xl bg-muted-area border border-border-theme text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-muted-text">कालखण्ड (Era)</label>
                    <select
                      value={formData.era || "shah"}
                      onChange={e => setFormData({ ...formData, era: e.target.value as ArchiveEra })}
                      className="w-full p-2.5 rounded-xl bg-muted-area border border-border-theme text-foreground focus:outline-none"
                    >
                      <option value="ancient">प्राचीन काल (Ancient)</option>
                      <option value="malla">मल्ल काल (Malla)</option>
                      <option value="shah">शाह काल (Shah)</option>
                      <option value="rana">राणा शासन (Rana)</option>
                      <option value="panchayat">पञ्चायत काल (Panchayat)</option>
                      <option value="modern">आधुनिक काल (Modern)</option>
                      <option value="unknown">अज्ञात (Unknown)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-muted-text">विधा (Category)</label>
                    <select
                      value={formData.category || "historical_document"}
                      onChange={e => setFormData({ ...formData, category: e.target.value as ArchiveCategory })}
                      className="w-full p-2.5 rounded-xl bg-muted-area border border-border-theme text-foreground focus:outline-none"
                    >
                      <option value="manuscript">पाण्डुलिपि (Manuscript)</option>
                      <option value="treaty">सन्धि (Treaty)</option>
                      <option value="constitutional">संवैधानिक (Constitutional)</option>
                      <option value="historical_document">ऐतिहासिक दस्तावेज</option>
                      <option value="inscription">शिलालेख (Inscription)</option>
                      <option value="map">नक्सा (Map)</option>
                      <option value="photograph">तस्बिर (Photograph)</option>
                      <option value="government_record">सरकारी अभिलेख</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-muted-text">नेपाली सारांश (Nepali Summary)</label>
                    <textarea
                      rows={3}
                      value={formData.summaryNepali || ""}
                      onChange={e => setFormData({ ...formData, summaryNepali: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-muted-area border border-border-theme text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-muted-text">अंग्रेजी सारांश (English Summary)</label>
                    <textarea
                      rows={3}
                      value={formData.summary || ""}
                      onChange={e => setFormData({ ...formData, summary: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-muted-area border border-border-theme text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Provenance Fields */}
                <div className="p-4 rounded-2xl bg-muted-area/50 border border-border-theme space-y-3">
                  <h4 className="text-xs font-black text-card-foreground flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span>प्रमाणिकता तथा स्रोत मेटाडाटा (Provenance Verification)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-muted-text">स्रोत संस्था / शीर्षक (Source Title)</label>
                      <input
                        type="text"
                        value={formData.sourceTitle || ""}
                        onChange={e => setFormData({ ...formData, sourceTitle: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-card border border-border-theme text-foreground focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-muted-text">प्रमाणक व्यक्ति/निकाय (Verified By)</label>
                      <input
                        type="text"
                        value={formData.verifiedBy || ""}
                        onChange={e => setFormData({ ...formData, verifiedBy: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-card border border-border-theme text-foreground focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-muted-text">दस्तावेज लिङ्क / फाइल (Document URL / Upload)</label>
                        <label className="text-[11px] font-bold text-amber-500 hover:text-amber-400 cursor-pointer flex items-center gap-1">
                          <Upload size={12} />
                          <span>फाइल अपलोड</span>
                          <input
                            type="file"
                            accept=".pdf,image/*,.txt"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const url = URL.createObjectURL(file);
                                setFormData(prev => ({
                                  ...prev,
                                  documentUrl: url,
                                  titleNepali: prev.titleNepali || file.name.replace(/\.[^/.]+$/, "")
                                }));
                                toast.success("अभिलेख दस्तावेज फाइल लोड भयो!");
                              }
                            }}
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        value={formData.documentUrl || ""}
                        onChange={e => setFormData({ ...formData, documentUrl: e.target.value })}
                        placeholder="https://... वा माथि फाइल अपलोड छान्नुहोस्"
                        className="w-full p-2.5 rounded-xl bg-card border border-border-theme text-foreground focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-muted-text">SGIS पाण्डुलिपि ID (SGIS Manuscript Link)</label>
                      <input
                        type="text"
                        value={formData.sgisRecordId || ""}
                        onChange={e => setFormData({ ...formData, sgisRecordId: e.target.value })}
                        placeholder="sgis_nyayavikashini_1380"
                        className="w-full p-2.5 rounded-xl bg-card border border-border-theme text-foreground focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-text">OCR पाठ्यांश (Extracted Sanskrit/Nepali OCR Text)</label>
                  <textarea
                    rows={4}
                    value={formData.ocrText || ""}
                    onChange={e => setFormData({ ...formData, ocrText: e.target.value })}
                    placeholder="मूल अभिलेखबाट अनुक्रमित गरिएको पाठ..."
                    className="w-full p-2.5 rounded-xl bg-muted-area border border-border-theme text-foreground font-mono focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-theme">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-muted-area hover:bg-muted text-foreground cursor-pointer"
                  >
                    रद्द गर्नुहोस्
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <Save size={14} />
                    <span>सुरक्षित गर्नुहोस्</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Audit Report Modal */}
      <AnimatePresence>
        {showAuditModal && auditReport && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border-theme rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-border-theme pb-4">
                <div className="flex items-center gap-2">
                  <Cpu size={18} className="text-primary" />
                  <h3 className="text-lg font-black text-foreground">
                    अभिलेखालय सत्यता अडिट रिपोर्ट [AR-A..T]
                  </h3>
                </div>
                <button
                  onClick={() => setShowAuditModal(false)}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-text cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-xs font-bold text-emerald-600">उत्तीर्ण (Pass)</span>
                  <p className="text-2xl font-black text-emerald-600">{auditReport.passedCount}</p>
                </div>
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-xs font-bold text-amber-600">चेतावनी (Warn)</span>
                  <p className="text-2xl font-black text-amber-600">{auditReport.warnCount}</p>
                </div>
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                  <span className="text-xs font-bold text-red-600">असफल (Fail)</span>
                  <p className="text-2xl font-black text-red-600">{auditReport.failCount}</p>
                </div>
              </div>

              <div className="divide-y divide-border-theme space-y-3">
                {auditReport.checks.map(check => (
                  <div key={check.code} className="pt-3 flex items-start gap-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shrink-0 ${check.status === "pass"
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : check.status === "warn"
                        ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                        : "bg-red-500/10 text-red-600 border border-red-500/20"
                      }`}>
                      {check.code}
                    </span>

                    <div className="space-y-0.5 flex-1">
                      <h4 className="text-xs font-bold text-foreground">{check.name}</h4>
                      <p className="text-[11px] text-muted-text">{check.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Audit History Log Modal */}
      <AnimatePresence>
        {historyRecordId && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border-theme rounded-3xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border-theme pb-3">
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <History size={16} className="text-amber-500" />
                  <span>अडिट इतिहास: {historyRecordId}</span>
                </h3>
                <button
                  onClick={() => setHistoryRecordId(null)}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-text cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {historyLogs.length === 0 ? (
                <p className="text-xs text-muted-text text-center py-6">यस अभिलेखको लागि कुनै अडिट लग छैन।</p>
              ) : (
                <div className="space-y-3">
                  {historyLogs.map(log => (
                    <div key={log.id} className="p-3 rounded-2xl bg-muted-area/50 border border-border-theme text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">{log.eventType}</span>
                        <span className="text-[10px] text-muted-text">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-muted-text text-[11px]">{log.reason}</p>
                      <div className="text-[10px] text-muted-text">द्वारा: <strong>{log.actorId}</strong> ({log.actorRole})</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
