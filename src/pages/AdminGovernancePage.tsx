import React, { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import SEOHead from "@/src/components/common/SEOHead";
import { ShieldCheck, ShieldAlert, Database, Lock } from "lucide-react";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { contentRegistry } from "@/src/services/contentRegistry";
import { collection, getDocs, doc, writeBatch } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { toast } from "sonner";
import AuditHeaderActions from "@/src/components/admin/audit/AuditHeaderActions";
import AuditMetricsCards from "@/src/components/admin/audit/AuditMetricsCards";
import AuditDiagnosticPanel from "@/src/components/admin/audit/AuditDiagnosticPanel";
import AuditArticleTable from "@/src/components/admin/audit/AuditArticleTable";
import GovernanceEntityTab from "@/src/components/admin/governance/GovernanceEntityTab";
import GovernanceRulesTab from "@/src/components/admin/governance/GovernanceRulesTab";
import GovernanceSearchTab from "@/src/components/admin/governance/GovernanceSearchTab";
import CategoryIntegrityMonitor from "@/src/components/admin/governance/CategoryIntegrityMonitor";
import ContentRegistryIntegrityCheck from "@/src/components/admin/governance/ContentRegistryIntegrityCheck";
import { normalizeArticleCategory, CANONICAL_CATEGORIES } from "@/src/constants/categories";
import { Search } from "lucide-react";

export default function AdminGovernancePage() {
  const [activeTab, setActiveTab] = useState<"audit" | "entities" | "rules" | "search">("audit");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [firestoreArticles, setFirestoreArticles] = useState<any[]>([]);
  const [snapshotArticles, setSnapshotArticles] = useState<any[]>([]);
  const [registryCount, setRegistryCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadAuditData = async () => {
    setLoading(true);
    try {
      const snap = await snapshotEngine.getHomepageSnapshot();
      setSnapshotArticles(snap.latestNews || []);
      if (db) {
        const fsSnap = await getDocs(collection(db, "articles"));
        setFirestoreArticles(fsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
      const reg = await contentRegistry.auditRegistryIntegrity();
      setRegistryCount(reg.total);
    } catch (e) {
      console.warn("Governance load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  const handlePurgeAndRebuild = async () => {
    setActionLoading(true);
    try {
      await snapshotEngine.forceRefresh();
      toast.success("Snapshot OS Rebuilt and Purged!");
      await loadAuditData();
    } catch (e) {
      toast.error("Rebuild failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStandardizeStatuses = async () => {
    setActionLoading(true);
    try {
      if (db) {
        const batch = writeBatch(db);
        let count = 0;
        firestoreArticles.forEach(a => {
          const s = String(a.status || "").toLowerCase();
          const norm = normalizeArticleCategory(a.categoryId || a.category, a.title, a.content);
          if (s !== "published" && s !== "draft" && s !== "rejected") {
            batch.update(doc(db, "articles", a.id), {
              status: "published",
              categoryId: norm.categoryId,
              category: norm.categorySlug,
              updatedAt: new Date().toISOString()
            });
            count++;
          }
        });
        if (count > 0) await batch.commit();
      }
      await handlePurgeAndRebuild();
    } catch (e) {
      toast.error("Standardize failed");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout title="GovernanceOS">
      <SEOHead title="GovernanceOS - डेटा सुशासन तथा अडिट | Sanatan Marga Admin" />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-1">
              <ShieldCheck size={14} /> GovernanceOS • Unified Platform Governance & Audit
            </div>
            <h1 className="text-2xl font-black text-card-foreground">सुशासन तथा गुणस्तर नियन्त्रण</h1>
          </div>
          <div className="flex items-center gap-2 bg-muted-area p-1 rounded-2xl border border-border-theme overflow-x-auto">
            {[
              { id: "audit", label: "Content Audit", icon: ShieldAlert },
              { id: "entities", label: "Entity Integrity", icon: Database },
              { id: "rules", label: "Governance Rules", icon: Lock },
              { id: "search", label: "Search Index & Health", icon: Search }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-card text-card-foreground shadow-sm font-black text-primary"
                    : "text-muted-text hover:text-card-foreground"
                }`}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {activeTab === "audit" && (
          <div className="space-y-6">
            <AuditHeaderActions
              actionLoading={actionLoading}
              onPurgeAndRebuild={handlePurgeAndRebuild}
              onStandardizeStatuses={handleStandardizeStatuses}
              onSyncRegistry={async () => {
                await contentRegistry.syncAllArticles(firestoreArticles);
                toast.success("Synced to registry");
                await loadAuditData();
              }}
            />
            {/* Priority 2: Category Integrity Monitor */}
            <CategoryIntegrityMonitor
              missingCategoryCount={firestoreArticles.filter(a => !a.categoryId && !a.category).length}
              legacyCategoryCount={firestoreArticles.filter(a => {
                const cat = (a.categoryId || a.category || "").toLowerCase();
                return cat === "samachar" || cat === "news" || cat === "breaking" || cat === "updates";
              }).length}
              unknownCategoryCount={firestoreArticles.filter(a => {
                const cat = (a.categoryId || a.category || "").toLowerCase();
                if (!cat) return false;
                const match = CANONICAL_CATEGORIES.some(c => c.id.toLowerCase() === cat || c.slug.toLowerCase() === cat || c.nameNepali === cat);
                return !match;
              }).length}
              onAutoFixCategories={handleStandardizeStatuses}
              isFixing={actionLoading}
            />

            {/* Priority 4: Content Registry Integrity Check */}
            <ContentRegistryIntegrityCheck
              registryRecords={registryCount}
              missingRegistryEntries={Math.max(0, firestoreArticles.length - registryCount)}
              orphanFirestoreArticles={0}
              snapshotDrift={Math.abs(firestoreArticles.length - snapshotArticles.length)}
              onSyncRegistry={async () => {
                setActionLoading(true);
                try {
                  await contentRegistry.syncAllArticles(firestoreArticles);
                  toast.success("सबै समाचार कन्टेन्ट रजिस्ट्रीमा सफलतापूर्वक सिंक गरियो!");
                  await loadAuditData();
                } catch (e) {
                  toast.error("सिंक प्रक्रियामा त्रुटि");
                } finally {
                  setActionLoading(false);
                }
              }}
              isSyncing={actionLoading}
            />

            <AuditMetricsCards
              totalCount={firestoreArticles.length}
              publishedCount={firestoreArticles.filter(a => a.status === "published" || !a.status).length}
              draftCount={firestoreArticles.filter(a => a.status === "draft").length}
              reviewCount={firestoreArticles.filter(a => a.status === "review").length}
              firestoreCount={firestoreArticles.length}
              snapshotCount={snapshotArticles.length}
              registryCount={registryCount}
            />
            <AuditDiagnosticPanel
              nonStandardStatusCount={firestoreArticles.filter(a => a.status && a.status !== "published" && a.status !== "draft").length}
              unmappedCategoryCount={0}
              isSnapshotStale={false}
              onFixAll={handleStandardizeStatuses}
              actionLoading={actionLoading}
            />
            <AuditArticleTable
              loading={loading}
              articles={firestoreArticles}
              snapshotArticles={snapshotArticles}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </div>
        )}
        {activeTab === "entities" && <GovernanceEntityTab />}
        {activeTab === "rules" && <GovernanceRulesTab />}
        {activeTab === "search" && <GovernanceSearchTab />}
      </div>
    </AdminLayout>
  );
}
