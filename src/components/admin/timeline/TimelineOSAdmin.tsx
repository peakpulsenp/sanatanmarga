import React, { useState, useEffect } from "react";
import { 
  History, Plus, Search, Edit3, Trash2, Link2, 
  Sparkles, BookOpen, ShoppingBag, Landmark, X, Save, Layers,
  ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Download, 
  ExternalLink, FileCheck, Eye, EyeOff, Archive, Award
} from "lucide-react";
import { 
  TimelineEvent, 
  TimelineCategory, 
  TimelineStatus, 
  TimelineVerificationStatus,
  TimelineEra,
  resolveTimelineDate
} from "@/src/types/timeline";
import { timelineRepository } from "@/src/services/timeline/timelineRepository";
import { timelineSnapshotService } from "@/src/services/timeline/timelineSnapshotService";
import { TimelineAuditEngine, TimelineAuditReport } from "@/src/services/timeline/timelineAuditEngine";
import { useAuth } from "@/src/lib/auth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { CANONICAL_ENTITIES } from "@/src/services/knowledgeOS";

export default function TimelineOSAdmin() {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [auditReport, setAuditReport] = useState<TimelineAuditReport | null>(null);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [formData, setFormData] = useState({
    titleNepali: "",
    titleEnglish: "",
    yearBS: "",
    yearAD: "",
    startDate: "",
    endDate: "",
    era: "ancient" as TimelineEra,
    category: "monument" as TimelineCategory,
    location: "",
    district: "",
    province: "",
    summaryNepali: "",
    summaryEnglish: "",
    relatedKnowledgeNodeId: "",
    relatedArticleId: "",
    relatedProductId: "",
    status: "draft" as TimelineStatus,
    verificationStatus: "unverified" as TimelineVerificationStatus,
    sourceTitle: "",
    sourceUrls: "",
    sourceOrg: "",
    verifiedBy: "",
    confidenceScore: 0.95
  });

  const loadEvents = async () => {
    setLoading(true);
    try {
      // First try to fetch from Firestore repository
      const repoEvents = await timelineRepository.getAllEvents();
      if (repoEvents.length > 0) {
        setEvents(repoEvents);
      } else {
        // If Firestore is empty, load the initial verified public snapshot
        const snapshotEvents = await timelineSnapshotService.getPublicTimeline();
        setEvents(snapshotEvents);
      }
    } catch (e) {
      console.warn("Failed to load events from repository, falling back to snapshot:", e);
      const snapshotEvents = await timelineSnapshotService.getPublicTimeline();
      setEvents(snapshotEvents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const runAudit = () => {
    setIsRunningAudit(true);
    try {
      const rep = TimelineAuditEngine.runAudit(events);
      setAuditReport(rep);
      toast.success(`Timeline OS Audit Completed (Score: ${rep.overallScore}%)`);
    } catch (e) {
      toast.error("Failed to run Timeline OS audit");
    } finally {
      setIsRunningAudit(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      titleNepali: "",
      titleEnglish: "",
      yearBS: "२०८० वि.सं.",
      yearAD: "2023 AD",
      startDate: "2023",
      endDate: "",
      era: "modern",
      category: "historical_event",
      location: "काठमाडौँ, नेपाल",
      district: "काठमाडौँ",
      province: "बागमती प्रदेश",
      summaryNepali: "",
      summaryEnglish: "",
      relatedKnowledgeNodeId: "",
      relatedArticleId: "",
      relatedProductId: "",
      status: "draft",
      verificationStatus: "unverified",
      sourceTitle: "Official National Archive Records",
      sourceUrls: "https://nationalarchives.gov.np",
      sourceOrg: "National Archives Nepal",
      verifiedBy: user?.displayName || user?.email || "Editorial Authority",
      confidenceScore: 0.95
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (evt: TimelineEvent) => {
    setEditingId(evt.id);
    setFormData({
      titleNepali: evt.titleNepali || "",
      titleEnglish: evt.titleEnglish || "",
      yearBS: evt.yearBS || "",
      yearAD: evt.yearAD || "",
      startDate: evt.startDate || "",
      endDate: evt.endDate || "",
      era: evt.era || "ancient",
      category: evt.category || "monument",
      location: evt.location || "",
      district: evt.district || "",
      province: evt.province || "",
      summaryNepali: evt.summaryNepali || "",
      summaryEnglish: evt.summaryEnglish || "",
      relatedKnowledgeNodeId: evt.relatedKnowledgeNodeId || "",
      relatedArticleId: evt.relatedArticleId || "",
      relatedProductId: evt.relatedProductId || "",
      status: evt.status || "draft",
      verificationStatus: evt.verificationStatus || "unverified",
      sourceTitle: evt.sourceTitle || "",
      sourceUrls: (evt.sourceUrls || []).join("\n"),
      sourceOrg: evt.sourceOrg || "",
      verifiedBy: evt.verifiedBy || "",
      confidenceScore: typeof evt.confidenceScore === "number" ? evt.confidenceScore : 0.95
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titleNepali || !formData.titleEnglish) {
      toast.error("Please enter both Nepali and English titles.");
      return;
    }

    const actor = {
      uid: user?.uid || "admin",
      email: user?.email || "admin@sanatanmarga.com",
      role: user?.role || "admin"
    };

    const urlList = formData.sourceUrls
      .split("\n")
      .map(u => u.trim())
      .filter(u => u.length > 0);

    const payload: Partial<TimelineEvent> = {
      titleNepali: formData.titleNepali,
      titleEnglish: formData.titleEnglish,
      yearBS: formData.yearBS,
      yearAD: formData.yearAD,
      startDate: formData.startDate,
      endDate: formData.endDate,
      era: formData.era,
      category: formData.category,
      location: formData.location,
      district: formData.district,
      province: formData.province,
      summaryNepali: formData.summaryNepali,
      summaryEnglish: formData.summaryEnglish,
      relatedKnowledgeNodeId: formData.relatedKnowledgeNodeId || undefined,
      relatedArticleId: formData.relatedArticleId || undefined,
      relatedProductId: formData.relatedProductId || undefined,
      status: formData.status,
      verificationStatus: formData.verificationStatus,
      sourceTitle: formData.sourceTitle,
      sourceUrls: urlList,
      sourceOrg: formData.sourceOrg,
      verifiedBy: formData.verificationStatus === "verified" ? (formData.verifiedBy || actor.email) : undefined,
      verifiedAt: formData.verificationStatus === "verified" ? new Date().toISOString() : undefined,
      confidenceScore: formData.confidenceScore
    };

    try {
      if (editingId) {
        await timelineRepository.updateEvent(editingId, payload, actor);
        toast.success("Timeline event updated successfully!");
      } else {
        await timelineRepository.createEvent(payload, actor);
        toast.success("Timeline event created successfully!");
      }
      setIsModalOpen(false);
      loadEvents();
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    }
  };

  const handleQuickVerify = async (id: string) => {
    const actor = {
      uid: user?.uid || "admin",
      email: user?.email || "admin@sanatanmarga.com",
      role: user?.role || "admin"
    };
    try {
      await timelineRepository.verifyEvent(id, user?.displayName || actor.email, actor);
      toast.success("Event verified with provenance credentials!");
      loadEvents();
    } catch (e: any) {
      toast.error(`Verification error: ${e.message}`);
    }
  };

  const handleQuickPublish = async (id: string) => {
    const actor = {
      uid: user?.uid || "admin",
      email: user?.email || "admin@sanatanmarga.com",
      role: user?.role || "admin"
    };
    try {
      await timelineRepository.publishEvent(id, actor);
      toast.success("Event published to public timeline snapshot!");
      loadEvents();
    } catch (e: any) {
      toast.error(`Publish error: ${e.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this timeline milestone?")) return;
    const actor = {
      uid: user?.uid || "admin",
      email: user?.email || "admin@sanatanmarga.com",
      role: user?.role || "admin"
    };
    try {
      await timelineRepository.deleteEvent(id, actor);
      toast.success("Event deleted from timeline registry.");
      loadEvents();
    } catch (e: any) {
      toast.error(`Delete error: ${e.message}`);
    }
  };

  const handleExportSnapshot = async () => {
    setIsExporting(true);
    try {
      const payload = await timelineRepository.generateSnapshotPayload();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `timeline-snapshot-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${payload.events.length} published and verified milestones!`);
    } catch (e: any) {
      toast.error(`Export failed: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = 
      (e.titleNepali || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.titleEnglish || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.location || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.yearAD || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.yearBS || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "all" || e.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || e.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls Banner */}
      <div className="p-6 rounded-3xl bg-card border border-border-theme flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <History size={12} /> Timeline OS Governance R1
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={12} /> Snapshot-First Verified Engine
            </span>
          </div>
          <h2 className="text-xl font-black text-card-foreground">
            ऐतिहासिक समयरेखा तथा कालखण्ड व्यवस्थापन
          </h2>
          <p className="text-xs text-muted-text mt-0.5">
            Manage authoritative milestones across Lichhavi, Malla, Shah, and Modern eras with strict provenance gates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={runAudit}
            disabled={isRunningAudit}
            className="px-3.5 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ShieldCheck size={14} className={isRunningAudit ? "animate-spin" : ""} />
            <span>Run Truth Audit</span>
          </button>

          <button
            onClick={handleExportSnapshot}
            disabled={isExporting}
            className="px-3.5 py-2 bg-muted-area hover:bg-card border border-border-theme rounded-xl text-xs font-bold text-card-foreground flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download size={14} />
            <span>Export Snapshot</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
          >
            <Plus size={15} />
            <span>नयाँ ऐतिहासिक घटना (Add Event)</span>
          </button>
        </div>
      </div>

      {/* Audit Report Banner if Run */}
      {auditReport && (
        <div className="p-5 rounded-3xl bg-zinc-950 text-zinc-100 border border-zinc-800 space-y-3 font-mono text-xs shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-amber-400" />
              <span className="font-bold text-white uppercase tracking-wider">
                Timeline OS Production Truth Audit [TL-A to TL-T]
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                PASS: {auditReport.passedCount}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                WARN: {auditReport.warnCount}
              </span>
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                FAIL: {auditReport.failCount}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-primary/20 text-primary font-black">
                SCORE: {auditReport.overallScore}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto pt-1">
            {auditReport.checks.map(chk => (
              <div key={chk.code} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">[{chk.code}]</span>
                  <span className={`text-[10px] font-bold px-1.5 rounded ${
                    chk.status === "pass" ? "bg-emerald-500/20 text-emerald-400" :
                    chk.status === "warn" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
                  }`}>
                    {chk.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2">{chk.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
          <input
            type="text"
            placeholder="Search by title, era, location, year..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border-theme rounded-2xl text-xs text-card-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3.5 py-2.5 bg-card border border-border-theme rounded-2xl text-xs text-card-foreground font-bold focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="all">सबै वर्ग (All Categories)</option>
          <option value="monument">स्मारक र मन्दिर (Monument)</option>
          <option value="festival">पर्व र जात्रा (Festival)</option>
          <option value="scripture">शास्त्र र दर्शन (Scripture)</option>
          <option value="treaty">सन्धि र कानुन (Treaty & Law)</option>
          <option value="historical_event">ऐतिहासिक घटना (Historical Event)</option>
          <option value="manuscript">पाण्डुलिपि (Manuscript)</option>
          <option value="heritage">सम्पदा (Heritage)</option>
        </select>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-3.5 py-2.5 bg-card border border-border-theme rounded-2xl text-xs text-card-foreground font-bold focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="all">सबै स्थिति (All Statuses)</option>
          <option value="published">प्रकाशित (Published)</option>
          <option value="draft">मस्यौदा (Draft)</option>
          <option value="verified">प्रमाणित (Verified)</option>
          <option value="deprecated">स्थगित (Deprecated)</option>
          <option value="archived">अभिलेख (Archived)</option>
        </select>

        <button
          onClick={loadEvents}
          className="p-2.5 bg-card hover:bg-muted-area border border-border-theme rounded-2xl text-muted-text hover:text-card-foreground transition-colors cursor-pointer"
          title="Reload Events"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Events List Table / Cards */}
      <div className="bg-card border border-border-theme rounded-3xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border-theme bg-muted-area/30 flex items-center justify-between text-xs font-bold text-muted-text">
          <span>कुल ऐतिहासिक घटनाहरू: {filteredEvents.length}</span>
          <span className="font-mono">Timeline OS R1 Invariant Gate</span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-muted-text space-y-3">
            <History size={36} className="mx-auto text-muted-text/50" />
            <p className="text-sm font-bold text-card-foreground">कुनै ऐतिहासिक घटना फेला परेन।</p>
            <p className="text-xs">No timeline events match your current filter criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-theme">
            {filteredEvents.map(evt => {
              const dateInfo = resolveTimelineDate(evt);
              const isPublished = evt.status === "published";
              const isVerified = evt.verificationStatus === "verified";

              return (
                <div key={evt.id} className="p-4 sm:p-5 hover:bg-muted-area/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-black font-mono">
                        {dateInfo.displayYear}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-muted-area border border-border-theme text-[10px] font-bold text-muted-text uppercase">
                        {evt.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isPublished ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" :
                        evt.status === "deprecated" ? "bg-red-500/10 text-red-600 border border-red-500/20" :
                        "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                      }`}>
                        ● {evt.status}
                      </span>
                      {isVerified ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px] font-black flex items-center gap-1">
                          <CheckCircle2 size={10} /> Verified ({Math.round((evt.confidenceScore || 0.95) * 100)}%)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-bold">
                          Unverified
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-black text-card-foreground">
                      {evt.titleNepali} <span className="text-muted-text font-normal">({evt.titleEnglish})</span>
                    </h3>

                    <p className="text-xs text-muted-text line-clamp-2 leading-relaxed">
                      {evt.summaryNepali || evt.summaryEnglish}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xxs text-muted-text pt-1 font-mono">
                      {evt.location && <span>स्थान: {evt.location}</span>}
                      {evt.relatedKnowledgeNodeId && (
                        <span className="text-primary font-bold">Knowledge: {evt.relatedKnowledgeNodeId}</span>
                      )}
                      {evt.sourceTitle && <span>Source: {evt.sourceTitle}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isVerified && (
                      <button
                        onClick={() => handleQuickVerify(evt.id)}
                        className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Verify event"
                      >
                        <ShieldCheck size={13} />
                        <span>Verify</span>
                      </button>
                    )}

                    {!isPublished && isVerified && (
                      <button
                        onClick={() => handleQuickPublish(evt.id)}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Publish event"
                      >
                        <Eye size={13} />
                        <span>Publish</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEdit(evt)}
                      className="p-2 bg-muted-area hover:bg-card border border-border-theme rounded-xl text-card-foreground cursor-pointer transition-colors"
                      title="Edit event"
                    >
                      <Edit3 size={14} />
                    </button>

                    <button
                      onClick={() => handleDelete(evt.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl cursor-pointer transition-colors"
                      title="Delete event"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border-theme rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-6 my-8"
            >
              <div className="flex items-center justify-between border-b border-border-theme pb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <History size={20} />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-card-foreground">
                      {editingId ? "ऐतिहासिक घटना सम्पादन (Edit Milestone)" : "नयाँ ऐतिहासिक घटना प्रविष्टि (New Milestone)"}
                    </h3>
                    <p className="text-xxs text-muted-text">Timeline OS Authoritative Mutation & Provenance Gate</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-muted-text hover:text-card-foreground rounded-xl hover:bg-muted-area transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-card-foreground">घटनाको नाम (नेपाली) *</label>
                    <input
                      type="text"
                      required
                      value={formData.titleNepali}
                      onChange={e => setFormData({ ...formData, titleNepali: e.target.value })}
                      placeholder="उदा. चाँगुनारायण मानदेव अभिलेख स्थापना"
                      className="w-full px-3.5 py-2.5 bg-muted-area/40 border border-border-theme rounded-xl text-card-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-card-foreground">Title in English *</label>
                    <input
                      type="text"
                      required
                      value={formData.titleEnglish}
                      onChange={e => setFormData({ ...formData, titleEnglish: e.target.value })}
                      placeholder="e.g. King Manadeva Erects Changu Narayan Inscription"
                      className="w-full px-3.5 py-2.5 bg-muted-area/40 border border-border-theme rounded-xl text-card-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-card-foreground">वि.सं. वर्ष (BS Year)</label>
                    <input
                      type="text"
                      value={formData.yearBS}
                      onChange={e => setFormData({ ...formData, yearBS: e.target.value })}
                      placeholder="उदा. ५२१ वि.सं."
                      className="w-full px-3 py-2 bg-muted-area/40 border border-border-theme rounded-xl text-card-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-card-foreground">ईस्वी सन् वर्ष (AD Year)</label>
                    <input
                      type="text"
                      value={formData.yearAD}
                      onChange={e => setFormData({ ...formData, yearAD: e.target.value })}
                      placeholder="e.g. 464 AD or 249 BCE"
                      className="w-full px-3 py-2 bg-muted-area/40 border border-border-theme rounded-xl text-card-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-card-foreground">कालखण्ड (Era)</label>
                    <select
                      value={formData.era}
                      onChange={e => setFormData({ ...formData, era: e.target.value as TimelineEra })}
                      className="w-full px-3 py-2 bg-muted-area/40 border border-border-theme rounded-xl text-card-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="ancient">प्राचीन काल (Ancient)</option>
                      <option value="licchavi">लिच्छवि काल (Licchavi)</option>
                      <option value="malla">मल्ल काल (Malla)</option>
                      <option value="shah">शाह काल (Shah)</option>
                      <option value="rana">राणा काल (Rana)</option>
                      <option value="panchayat">पञ्चायत काल (Panchayat)</option>
                      <option value="constitutional">संवैधानिक काल (Constitutional)</option>
                      <option value="modern">आधुनिक काल (Modern)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-card-foreground">श्रेणी (Category)</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value as TimelineCategory })}
                      className="w-full px-3.5 py-2.5 bg-muted-area/40 border border-border-theme rounded-xl text-card-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="monument">स्मारक तथा मन्दिर (Monument)</option>
                      <option value="festival">पर्व तथा जात्रा (Festival)</option>
                      <option value="scripture">शास्त्र तथा ग्रन्थ (Scripture)</option>
                      <option value="treaty">सन्धि तथा कानुन (Treaty)</option>
                      <option value="historical_event">ऐतिहासिक घटना (Historical Event)</option>
                      <option value="manuscript">पाण्डुलिपि (Manuscript)</option>
                      <option value="heritage">सम्पदा (Heritage)</option>
                      <option value="person">व्यक्तित्व (Person)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-card-foreground">स्थान र जिल्ला (Location / District)</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      placeholder="उदा. चाँगुनारायण, भक्तपुर"
                      className="w-full px-3.5 py-2.5 bg-muted-area/40 border border-border-theme rounded-xl text-card-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-card-foreground">संक्षिप्त विवरण (नेपाली)</label>
                  <textarea
                    rows={2}
                    value={formData.summaryNepali}
                    onChange={e => setFormData({ ...formData, summaryNepali: e.target.value })}
                    placeholder="घटनाको ऐतिहासिक र सांस्कृतिक महत्त्व..."
                    className="w-full p-3 bg-muted-area/40 border border-border-theme rounded-xl text-card-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-card-foreground">Summary in English</label>
                  <textarea
                    rows={2}
                    value={formData.summaryEnglish}
                    onChange={e => setFormData({ ...formData, summaryEnglish: e.target.value })}
                    placeholder="Historical summary in English..."
                    className="w-full p-3 bg-muted-area/40 border border-border-theme rounded-xl text-card-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Relationships */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-muted-area/20 border border-border-theme">
                  <div className="space-y-1">
                    <label className="font-bold text-primary flex items-center gap-1">
                      <Sparkles size={11} /> Knowledge Node ID
                    </label>
                    <select
                      value={formData.relatedKnowledgeNodeId}
                      onChange={e => setFormData({ ...formData, relatedKnowledgeNodeId: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-card border border-border-theme rounded-lg text-card-foreground"
                    >
                      <option value="">None (कुनै छैन)</option>
                      {CANONICAL_ENTITIES.map(ent => (
                        <option key={ent.id} value={ent.id}>{ent.canonicalNameNp} ({ent.id})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-card-foreground flex items-center gap-1">
                      <BookOpen size={11} /> Related Article ID
                    </label>
                    <input
                      type="text"
                      value={formData.relatedArticleId}
                      onChange={e => setFormData({ ...formData, relatedArticleId: e.target.value })}
                      placeholder="e.g. art_101"
                      className="w-full px-2.5 py-1.5 bg-card border border-border-theme rounded-lg text-card-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-card-foreground flex items-center gap-1">
                      <ShoppingBag size={11} /> Store Product ID
                    </label>
                    <input
                      type="text"
                      value={formData.relatedProductId}
                      onChange={e => setFormData({ ...formData, relatedProductId: e.target.value })}
                      placeholder="e.g. book-gita-deluxe"
                      className="w-full px-2.5 py-1.5 bg-card border border-border-theme rounded-lg text-card-foreground"
                    />
                  </div>
                </div>

                {/* Provenance Gate Fields */}
                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                    <ShieldCheck size={14} />
                    <span>प्रमाणिकता तथा स्रोत विवरण (Provenance Metadata Gate)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-card-foreground">स्रोत ग्रन्थ वा निकाय (Source Title) *</label>
                      <input
                        type="text"
                        value={formData.sourceTitle}
                        onChange={e => setFormData({ ...formData, sourceTitle: e.target.value })}
                        placeholder="उदा. नेपाल राष्ट्रिय अभिलेखालय / UNESCO Registry"
                        className="w-full px-3 py-1.5 bg-card border border-border-theme rounded-lg text-card-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-card-foreground">प्रमाणीकरण गर्ने निकाय (Verified By)</label>
                      <input
                        type="text"
                        value={formData.verifiedBy}
                        onChange={e => setFormData({ ...formData, verifiedBy: e.target.value })}
                        placeholder="उदा. Archaeological Board of Nepal"
                        className="w-full px-3 py-1.5 bg-card border border-border-theme rounded-lg text-card-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-card-foreground">स्रोत URL हरू (Source URLs - One per line)</label>
                    <textarea
                      rows={2}
                      value={formData.sourceUrls}
                      onChange={e => setFormData({ ...formData, sourceUrls: e.target.value })}
                      placeholder="https://nationalarchives.gov.np&#10;https://whc.unesco.org/en/list/121"
                      className="w-full p-2.5 bg-card border border-border-theme rounded-lg text-card-foreground font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* Status and Verification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-card-foreground">प्रकाशन स्थिति (Status)</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as TimelineStatus })}
                      className="w-full px-3 py-2 bg-muted-area/40 border border-border-theme rounded-xl text-card-foreground"
                    >
                      <option value="draft">मस्यौदा (Draft)</option>
                      <option value="verified">प्रमाणित (Verified)</option>
                      <option value="published">सार्वजनिक (Published)</option>
                      <option value="deprecated">स्थगित (Deprecated)</option>
                      <option value="archived">अभिलेख (Archived)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-card-foreground">प्रमाणीकरण स्थिति (Verification)</label>
                    <select
                      value={formData.verificationStatus}
                      onChange={e => setFormData({ ...formData, verificationStatus: e.target.value as TimelineVerificationStatus })}
                      className="w-full px-3 py-2 bg-muted-area/40 border border-border-theme rounded-xl text-card-foreground"
                    >
                      <option value="unverified">अप्रमाणित (Unverified)</option>
                      <option value="pending">प्रक्रियामा (Pending Review)</option>
                      <option value="verified">पूर्ण प्रमाणित (Verified)</option>
                      <option value="rejected">अस्वीकृत (Rejected)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-theme">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-muted-area hover:bg-card border border-border-theme rounded-xl text-muted-text hover:text-card-foreground cursor-pointer font-bold transition-colors"
                  >
                    रद्द गर्नुहोस् (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-black shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Save size={15} />
                    <span>सुरक्षित गर्नुहोस् (Save Milestone)</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
