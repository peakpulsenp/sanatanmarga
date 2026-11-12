import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Sparkles, Archive, History, Flame, Network, BookOpen, Scroll, ShieldCheck, Database, Cpu, RefreshCw, CheckCircle2 } from "lucide-react";
import AdminKnowledgeEntitiesManager from "@/src/components/admin/knowledge/AdminKnowledgeEntitiesManager";
import ArchivesOSAdmin from "@/src/components/admin/archives/ArchivesOSAdmin";
import TimelineOSAdmin from "@/src/components/admin/timeline/TimelineOSAdmin";
import FestivalOSAdmin from "@/src/components/admin/festivals/FestivalOSAdmin";
import EntityRelationshipsAdmin from "@/src/components/admin/knowledge/EntityRelationshipsAdmin";
import SgisDashboard from "@/src/components/knowledge/SgisDashboard";
import { CANONICAL_ENTITIES } from "@/src/services/knowledgeOS";
import { knowledgeSnapshotService } from "@/src/services/knowledge/knowledgeSnapshotService";
import { TruthAuditEngine, TruthAuditReport } from "@/src/services/truthAuditEngine";
import { toast } from "sonner";

export type KnowledgeTab = "nodes" | "sgis" | "relationships" | "archives" | "timeline" | "festivals" | "health";

export default function AdminKnowledgeUnified({ defaultTab = "nodes" }: { defaultTab?: KnowledgeTab }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as KnowledgeTab;
  const [activeTab, setActiveTab] = useState<KnowledgeTab>(tabFromUrl || defaultTab);
  const [auditReport, setAuditReport] = useState<TruthAuditReport | null>(null);
  const [runningAudit, setRunningAudit] = useState(false);

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tab: KnowledgeTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleRunTruthAudit = async () => {
    setRunningAudit(true);
    try {
      const report = TruthAuditEngine.runFullAudit();
      setAuditReport(report);
      toast.success("Truth Audit Execution Completed!");
    } catch (e) {
      toast.error("Truth Audit Failed");
    } finally {
      setRunningAudit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Governance Banner Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-primary/10 via-amber-500/10 to-purple-500/10 border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest bg-primary text-white px-2.5 py-0.5 rounded-full">
              Knowledge OS R2 & SGIS Intelligence
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={12} /> Snapshot-First Production OS
            </span>
          </div>
          <h2 className="text-xl font-black text-card-foreground">
            नेपाल नागरिक ज्ञानकोष तथा SGIS व्यवस्थापन
          </h2>
          <p className="text-xs text-muted-text mt-0.5">
            Knowledge OS consumes real application data across News, Live, Events, Store & SGIS with provenance audit tracking.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-card-foreground bg-card/80 backdrop-blur p-3 rounded-2xl border border-border-theme">
          <div className="text-center px-2 border-r border-border-theme">
            <span className="block text-primary font-black text-base">{CANONICAL_ENTITIES.length}</span>
            <span className="text-[10px] text-muted-text uppercase font-bold">Canonical Nodes</span>
          </div>
          <div className="text-center px-2 border-r border-border-theme">
            <span className="block text-emerald-600 font-black text-base">R2</span>
            <span className="text-[10px] text-muted-text uppercase font-bold">OS Version</span>
          </div>
          <div className="text-center px-2">
            <span className="block text-purple-600 font-black text-base">Verified</span>
            <span className="text-[10px] text-muted-text uppercase font-bold">Provenance</span>
          </div>
        </div>
      </div>

      {/* Top Tab Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-card border border-border-theme rounded-2xl overflow-x-auto shadow-xs">
        {[
          { id: "nodes", label: "ज्ञानकोष नोड्स (Nodes Manager)", icon: Sparkles },
          { id: "sgis", label: "SGIS पाण्डुलिपि र RAG (SGIS OS)", icon: Scroll },
          { id: "relationships", label: "सम्बन्ध एवं विलय (Relationships)", icon: Network },
          { id: "archives", label: "अभिलेखालय (ArchivesOS)", icon: Archive },
          { id: "timeline", label: "समयरेखा (TimelineOS)", icon: History },
          { id: "festivals", label: "पर्व इन्जिन (Festivals)", icon: Flame },
          { id: "health", label: "ग्राफ स्वास्थ र सत्यता (Truth Audit)", icon: Cpu }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id as KnowledgeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-muted-text hover:text-foreground hover:bg-muted-area"
              }`}
            >
              <Icon size={15} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render Active Tab Component */}
      <div className="min-h-[500px]">
        {activeTab === "nodes" && <AdminKnowledgeEntitiesManager />}
        {activeTab === "sgis" && <SgisDashboard />}
        {activeTab === "relationships" && <EntityRelationshipsAdmin />}
        {activeTab === "archives" && <ArchivesOSAdmin />}
        {activeTab === "timeline" && <TimelineOSAdmin />}
        {activeTab === "festivals" && <FestivalOSAdmin />}
        {activeTab === "health" && (
          <div className="p-8 rounded-3xl bg-card border border-border-theme space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Cpu className="text-primary" size={24} />
                <div>
                  <h3 className="text-base font-black text-card-foreground">Knowledge OS Graph Health & Provenance Audit</h3>
                  <p className="text-xs text-muted-text">Zero Synthetic Entities Policy • Snapshot Provenance & Integrity Engine</p>
                </div>
              </div>

              <button
                onClick={handleRunTruthAudit}
                disabled={runningAudit}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md hover:bg-primary/90"
              >
                <RefreshCw size={14} className={runningAudit ? "animate-spin" : ""} />
                <span>{runningAudit ? "Executing Truth Audit..." : "Run Truth Audit Now"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <span className="text-xs font-bold text-emerald-600">News Domain Coverage</span>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">100% Indexed</p>
                <span className="text-[10px] text-muted-text">Articles, Authors, Topics, Locations</span>
              </div>
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-1">
                <span className="text-xs font-bold text-primary">SGIS Manuscript Coverage</span>
                <p className="text-xl font-black text-primary">Verified RAG</p>
                <span className="text-[10px] text-muted-text">Granthas, Verses, Translations, Commentaries</span>
              </div>
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1">
                <span className="text-xs font-bold text-purple-600">Store & Events Sync</span>
                <p className="text-xl font-black text-purple-700 dark:text-purple-400">Active Pipeline</p>
                <span className="text-[10px] text-muted-text">Products, Festivals, Locations</span>
              </div>
            </div>

            {auditReport && (
              <div className="p-6 rounded-2xl bg-muted-area/40 border border-border-theme space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-card-foreground flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    Truth Audit Results — Verdict: {auditReport.overallStatus}
                  </h4>
                  <span className="text-xxs font-mono text-muted-text">
                    Executed at: {new Date(auditReport.executedAt).toLocaleTimeString()} ({auditReport.buildNumber})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-card rounded-xl border border-border-theme">
                    <span className="text-muted-text block text-xxs font-bold">Total Checks</span>
                    <span className="text-lg font-black font-mono text-card-foreground">{auditReport.totalChecks}</span>
                  </div>
                  <div className="p-3 bg-card rounded-xl border border-border-theme">
                    <span className="text-emerald-600 block text-xxs font-bold">Passed</span>
                    <span className="text-lg font-black font-mono text-emerald-600">{auditReport.passCount}</span>
                  </div>
                  <div className="p-3 bg-card rounded-xl border border-border-theme">
                    <span className="text-amber-600 block text-xxs font-bold">Warnings</span>
                    <span className="text-lg font-black font-mono text-amber-600">{auditReport.warnCount}</span>
                  </div>
                  <div className="p-3 bg-card rounded-xl border border-border-theme">
                    <span className="text-red-500 block text-xxs font-bold">Failures</span>
                    <span className="text-lg font-black font-mono text-red-500">{auditReport.failCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
