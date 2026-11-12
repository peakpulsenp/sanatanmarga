import React, { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import SEOHead from "@/src/components/common/SEOHead";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { contentRegistry } from "@/src/services/contentRegistry";
import { BACKUP_ARTICLES, BACKUP_CATEGORIES } from "@/src/constants/backupData";
import { normalizeArticleCategory } from "@/src/constants/categories";
import { collection, getDocs, doc, writeBatch } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { toast } from "sonner";
import AuditHeaderActions from "@/src/components/admin/audit/AuditHeaderActions";
import AuditMetricsCards from "@/src/components/admin/audit/AuditMetricsCards";
import AuditDiagnosticPanel from "@/src/components/admin/audit/AuditDiagnosticPanel";
import AuditArticleTable from "@/src/components/admin/audit/AuditArticleTable";
import ProductionRealityAuditDashboard from "@/src/components/admin/audit/ProductionRealityAuditDashboard";

export default function AdminContentAudit() {
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
      const homepageSnap = await snapshotEngine.getHomepageSnapshot();
      setSnapshotArticles(homepageSnap.latestNews || []);

      let fsArts: any[] = [];
      if (db) {
        try {
          const snap = await getDocs(collection(db, "articles"));
          fsArts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
          console.warn("Firestore fetch in audit:", e);
        }
      }
      setFirestoreArticles(fsArts);

      const regAudit = await contentRegistry.auditRegistryIntegrity();
      setRegistryCount(regAudit.total);
    } catch (err) {
      console.error("Audit load failed:", err);
      toast.error("Audit data load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  const combinedAll = Array.from(
    new Map([...firestoreArticles, ...snapshotArticles, ...BACKUP_ARTICLES].map(a => [a.id || a.title, a])).values()
  );

  const nonStandardList = firestoreArticles.filter(a => {
    const s = String(a.status || "").toLowerCase();
    return s && s !== "published" && s !== "draft" && s !== "rejected";
  });

  const unmappedCategories = firestoreArticles.filter(a => {
    const cat = String(a.categoryId || a.category || "").toLowerCase();
    return !cat || cat === "undefined" || cat === "null" || cat === "general";
  });

  const isSnapshotStale = firestoreArticles.length > 0 && snapshotArticles.length < Math.min(10, firestoreArticles.length);

  const handlePurgeAndRebuild = async () => {
    setActionLoading(true);
    try {
      await snapshotEngine.forceRefresh();
      toast.success("Snapshot OS Rebuilt and All Edge Caches Purged!");
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
          const norm = normalizeArticleCategory(a.categoryId || a.category || a.categorySlug, a.title, a.content);
          if (s !== "published" && s !== "draft" && s !== "rejected") {
            const ref = doc(db, "articles", a.id);
            batch.update(ref, {
              status: "published",
              categoryId: norm.categoryId,
              category: norm.categorySlug,
              categorySlug: norm.categorySlug,
              categoryName: norm.categoryName,
              updatedAt: new Date().toISOString()
            });
            count++;
          }
        });
        if (count > 0) {
          await batch.commit();
          toast.success(`${count} वटा समाचारहरूलाई "Published" र Category मानकमा अध्यावधिक गरियो!`);
        }
      }
      await handlePurgeAndRebuild();
    } catch (e) {
      toast.error("Status standardization failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncRegistry = async () => {
    setActionLoading(true);
    try {
      const count = await contentRegistry.syncAllArticles([...firestoreArticles, ...snapshotArticles]);
      toast.success(`${count} Articles Synchronized to Content Registry!`);
      await loadAuditData();
    } catch (e) {
      toast.error("Registry sync failed");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredArticles = combinedAll.filter(a => {
    const matchesSearch = (a.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (a.categoryId || "").toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "published") return matchesSearch && (a.status === "published" || !a.status || a.status === "approved");
    if (statusFilter === "draft") return matchesSearch && a.status === "draft";
    if (statusFilter === "restored") return matchesSearch && (a.status === "restored" || a.status === "recovered" || a.status === "approved");
    return matchesSearch;
  });

  return (
    <AdminLayout title="Content Recovery Audit">
      <SEOHead title="Content Recovery Audit - Sanatan Marga Admin" description="Sanatan Marga Newsroom Content Audit & Snapshot Health Recovery" />
      <div className="space-y-8">
        <ProductionRealityAuditDashboard />
        <AuditHeaderActions
          actionLoading={actionLoading}
          onPurgeAndRebuild={handlePurgeAndRebuild}
          onStandardizeStatuses={handleStandardizeStatuses}
          onSyncRegistry={handleSyncRegistry}
        />
        <AuditMetricsCards
          totalCount={combinedAll.length}
          publishedCount={combinedAll.filter(a => a.status === "published" || !a.status || a.status === "approved").length}
          draftCount={combinedAll.filter(a => a.status === "draft").length}
          reviewCount={combinedAll.filter(a => a.status === "editor_review" || a.status === "fact_checking").length}
          firestoreCount={firestoreArticles.length}
          snapshotCount={snapshotArticles.length}
          registryCount={registryCount}
        />
        <AuditDiagnosticPanel
          nonStandardStatusCount={nonStandardList.length}
          unmappedCategoryCount={unmappedCategories.length}
          isSnapshotStale={isSnapshotStale}
          onFixAll={handleStandardizeStatuses}
          actionLoading={actionLoading}
        />
        <AuditArticleTable
          loading={loading}
          articles={filteredArticles}
          snapshotArticles={snapshotArticles}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      </div>
    </AdminLayout>
  );
}
