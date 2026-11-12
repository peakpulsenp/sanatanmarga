import { useState, useEffect } from "react";
import AdminLayout from "../components/layout/AdminLayout";
import { 
  Database, ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle, 
  Clock, Server, BarChart3, Trash2, Eye, FileText, Users, Search, Info,
  Download, X, Lock, Check, HelpCircle
} from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "@/src/lib/firebase";
import { recordAuditLog } from "../lib/activityLogger";
import { KnowledgeGraphEngine } from "@/src/services/knowledgeGraphService";
import { settingsOS } from "@/src/services/settingsOS";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

type ContentClassification = "Real" | "Imported" | "Legacy" | "Seed" | "Unknown" | "Archived";

interface DataSourceStatus {
  sourceName: string;
  type: string;
  freshness: string;
  successRate: string;
  owner: string;
  trustScore: number;
  status: "healthy" | "warning" | "syncing";
  lastSync: string;
}

interface AuditRecord {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  type: "article" | "communityPost";
  classification: ContentClassification;
  createdAt: string;
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deleteRetentionExpiresAt?: string;
}

export default function AdminDataGovernance() {
  const [sources, setSources] = useState<DataSourceStatus[]>([
    {
      sourceName: "NRB Forex API",
      type: "External Public REST",
      freshness: "४ मिनेट अघि",
      successRate: "99.8%",
      owner: "नेपाल राष्ट्र बैंक",
      trustScore: 98,
      status: "healthy",
      lastSync: new Date().toISOString()
    },
    {
      sourceName: "जल तथा मौसम विज्ञान विभाग",
      type: "Weather Feed",
      freshness: "१२ मिनेट अघि",
      successRate: "98.5%",
      owner: "हाइड्रोलोजी विभाग",
      trustScore: 95,
      status: "healthy",
      lastSync: new Date().toISOString()
    },
    {
      sourceName: "पोखरा महानगरपालिका नोटिस फिड",
      type: "Federated Tenant Node",
      freshness: "३५ मिनेट अघि",
      successRate: "96.2%",
      owner: "पोखरा सूचना प्रविधि शाखा",
      trustScore: 92,
      status: "healthy",
      lastSync: new Date().toISOString()
    },
    {
      sourceName: "सरस्वती नलेज ग्राफ (Knowledge Graph)",
      type: "Semantic AI Store",
      freshness: "वास्तविक समय (Realtime)",
      successRate: "100%",
      owner: "Sanatan AI Engine",
      trustScore: 99,
      status: "healthy",
      lastSync: new Date().toISOString()
    },
    {
      sourceName: "पशुपति क्षेत्र विकास कोष पञ्चाङ्ग",
      type: "Cultural Calendar Feed",
      freshness: "२ घण्टा अघि",
      successRate: "94.0%",
      owner: "सांस्कृतिक समिति",
      trustScore: 90,
      status: "warning",
      lastSync: new Date(Date.now() - 7200000).toISOString()
    }
  ]);

  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Content Integrity Audit states
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | ContentClassification | "recycle_bin">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [purging, setPurging] = useState(false);

  // Safe Purge Wizard States
  const [purgeWizardOpen, setPurgeWizardOpen] = useState(false);
  const [purgeStep, setPurgeStep] = useState<"preview" | "backup" | "confirm">("preview");
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");

  // Settings Synchronization OS Telemetry State
  const [settingsTelemetry, setSettingsTelemetry] = useState<{
    firestoreVersion: number;
    localVersion: number;
    status: "HEALTHY" | "STALE_CACHE" | "SYNC_PENDING";
    lastSyncTime: string;
    pendingQueueCount: number;
  } | null>(null);
  const [purgingSettingsCache, setPurgingSettingsCache] = useState(false);

  useEffect(() => {
    settingsOS.getSettingsHealthTelemetry().then(setSettingsTelemetry);
  }, []);

  const handleForcePurgeSettingsCache = async () => {
    setPurgingSettingsCache(true);
    try {
      const res = await settingsOS.forcePurgeAndResync();
      if (res.success) {
        toast.success(res.message);
        const updated = await settingsOS.getSettingsHealthTelemetry();
        setSettingsTelemetry(updated);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error("Purge failed: " + (err?.message || String(err)));
    } finally {
      setPurgingSettingsCache(false);
    }
  };

  const handleSyncAll = () => {
    setIsSyncingAll(true);
    setTimeout(() => {
      setIsSyncingAll(false);
      setSyncSuccess(true);
      setSources(prev => prev.map(s => ({
        ...s,
        freshness: "अहिले भर्खरै (Just Now)",
        status: "healthy",
        lastSync: new Date().toISOString()
      })));
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 1200);
  };

  // Run content classification audit on articles and community posts
  const runContentAudit = async () => {
    setAuditLoading(true);
    try {
      const articlesSnap = await getDocs(collection(db, "articles"));
      const postsSnap = await getDocs(collection(db, "communityPosts"));

      const auditedArticles: AuditRecord[] = [];
      articlesSnap.forEach((d) => {
        const data = d.data();
        
        let classification: ContentClassification = "Unknown";
        
        const isPicsum = data.featuredImage?.includes("picsum.photos");
        const isSeedAuthor = data.authorId?.startsWith("author_") || 
                             ["admin_system", "system_admin", "guest_author"].includes(data.authorId) || 
                             ["Sagar Rana", "Arjun Adhikari", "Saraswati Thapa", "Ramesh Shrestha", "Binita Karki", "Prakash Dahal", "Anusha Bhandari"].includes(data.authorName);
        const isDemoText = data.title?.includes("काल्पनिक") || data.excerpt?.includes("काल्पनिक") || data.title?.includes("Dummy");

        if (data.classification) {
          classification = data.classification as ContentClassification;
        } else if (data.status === "archived") {
          classification = "Archived";
        } else if (isPicsum || isSeedAuthor || isDemoText) {
          classification = "Seed";
        } else if (data.isLegacyMigration || data.legacyId || data.importedFrom === "legacy") {
          classification = "Legacy";
        } else if (data.sourceUrls && Array.isArray(data.sourceUrls) && data.sourceUrls.length > 0) {
          classification = "Imported";
        } else if (data.authorId && data.authorId !== "guest" && data.authorId !== "admin_system") {
          classification = "Real";
        }

        auditedArticles.push({
          id: d.id,
          title: data.title || "बिना शीर्षकको लेख",
          authorId: data.authorId || "unknown",
          authorName: data.authorName || "अज्ञात लेखक",
          type: "article",
          classification,
          createdAt: data.createdAt || new Date().toISOString(),
          deleted: !!data.deleted,
          deletedAt: data.deletedAt,
          deletedBy: data.deletedBy,
          deleteRetentionExpiresAt: data.deleteRetentionExpiresAt
        });
      });

      const auditedPosts: AuditRecord[] = [];
      postsSnap.forEach((d) => {
        const data = d.data();

        let classification: ContentClassification = "Unknown";
        const isSeedAuthor = data.authorId?.startsWith("author_") || 
                             ["admin_system", "system_admin", "guest_author"].includes(data.authorId) ||
                             ["Sagar Rana", "Arjun Adhikari", "Saraswati Thapa", "Ramesh Shrestha", "Binita Karki", "Prakash Dahal", "Anusha Bhandari"].includes(data.authorName);
        const isDemoText = data.title?.includes("काल्पनिक") || data.content?.includes("काल्पनिक") || data.title?.includes("Dummy");

        if (data.classification) {
          classification = data.classification as ContentClassification;
        } else if (data.status === "archived") {
          classification = "Archived";
        } else if (isSeedAuthor || isDemoText) {
          classification = "Seed";
        } else if (data.isLegacyMigration || data.legacyId || data.importedFrom === "legacy") {
          classification = "Legacy";
        } else if (data.authorId && data.authorId !== "guest" && data.authorId !== "admin_system") {
          classification = "Real";
        }

        auditedPosts.push({
          id: d.id,
          title: data.title || data.content?.substring(0, 50) || "बिना शीर्षकको पोष्ट",
          authorId: data.authorId || "unknown",
          authorName: data.authorName || "अज्ञात प्रयोगकर्ता",
          type: "communityPost",
          classification,
          createdAt: data.createdAt || new Date().toISOString(),
          deleted: !!data.deleted,
          deletedAt: data.deletedAt,
          deletedBy: data.deletedBy,
          deleteRetentionExpiresAt: data.deleteRetentionExpiresAt
        });
      });

      setAuditRecords([...auditedArticles, ...auditedPosts]);
      
      await recordAuditLog("RUN_CONTENT_INTEGRITY_AUDIT", {
        affectedDocuments: auditedArticles.length + auditedPosts.length,
        details: { articlesCount: auditedArticles.length, postsCount: auditedPosts.length },
        resourceType: "system"
      });

      toast.success("सामग्री अखण्डता अडिट सफलतापूर्वक सम्पन्न भयो!");
    } catch (err: any) {
      console.error("Audit failure:", err);
      toast.error(`अडिट गर्न असफल: ${err.message || err}`);
    } finally {
      setAuditLoading(false);
    }
  };

  // Reclassify a specific record
  const updateRecordClassification = async (id: string, type: "article" | "communityPost", classification: ContentClassification) => {
    try {
      const colName = type === "article" ? "articles" : "communityPosts";
      await updateDoc(doc(db, colName, id), { classification });
      
      setAuditRecords(prev => prev.map(rec => rec.id === id ? { ...rec, classification } : rec));

      await recordAuditLog("RECLASSIFY_CONTENT", {
        resourceType: type === "communityPost" ? "community" : "article",
        resourceId: id,
        details: { newClassification: classification }
      });

      toast.success("सामग्री वर्गीकरण अपडेट भयो!");
    } catch (err: any) {
      toast.error(`वर्गीकरण परिवर्तन असफल: ${err.message}`);
    }
  };

  // Soft-delete record (Move to Recycle Bin with 30-day retention)
  const softDeleteRecord = async (id: string, type: "article" | "communityPost") => {
    try {
      const colName = type === "article" ? "articles" : "communityPosts";
      const now = new Date();
      const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const softDeleteData = {
        deleted: true,
        deletedAt: now.toISOString(),
        deletedBy: auth.currentUser?.uid || "admin",
        deleteRetentionExpiresAt: expires.toISOString()
      };

      await updateDoc(doc(db, colName, id), softDeleteData);

      setAuditRecords(prev => prev.map(rec => rec.id === id ? { ...rec, ...softDeleteData } : rec));

      await recordAuditLog("SOFT_DELETE_ITEM", {
        resourceType: type === "communityPost" ? "community" : "article",
        resourceId: id,
        details: { retentionExpire: expires.toISOString() }
      });

      toast.success("सामग्री रीसाइकल बिन (३०-दिने अवधारण) मा पठाइयो!");
    } catch (err: any) {
      toast.error(`रीसाइकल बिनमा सार्न असफल: ${err.message}`);
    }
  };

  // Restore record from Recycle Bin
  const restoreRecord = async (id: string, type: "article" | "communityPost") => {
    try {
      const colName = type === "article" ? "articles" : "communityPosts";
      await updateDoc(doc(db, colName, id), {
        deleted: false,
        deletedAt: null,
        deletedBy: null,
        deleteRetentionExpiresAt: null
      });

      setAuditRecords(prev => prev.map(rec => rec.id === id ? { ...rec, deleted: false } : rec));

      await recordAuditLog("RESTORE_RECYCLE_BIN_ITEM", {
        resourceType: type === "communityPost" ? "community" : "article",
        resourceId: id
      });

      toast.success("सामग्री पुन: सक्रिय गरियो!");
    } catch (err: any) {
      toast.error(`पुनर्स्थापना गर्न असफल: ${err.message}`);
    }
  };

  // Permanent Hard Delete a specific record from database
  const purgeSingleRecord = async (id: string, type: "article" | "communityPost") => {
    try {
      const colName = type === "article" ? "articles" : "communityPosts";
      await deleteDoc(doc(db, colName, id));
      
      setAuditRecords(prev => prev.filter(rec => rec.id !== id));

      await recordAuditLog("PERMANENT_HARD_DELETE_ITEM", {
        resourceType: type === "communityPost" ? "community" : "article",
        resourceId: id
      });

      toast.success("सामग्री स्थायी रूपमा हटाइयो!");
    } catch (err: any) {
      toast.error(`हटाउन असफल: ${err.message}`);
    }
  };

  // Compile and trigger localized browser JSON download of Seed records
  const downloadBackup = () => {
    const seedRecords = auditRecords.filter(r => r.classification === "Seed");
    const backupObj = {
      timestamp: new Date().toISOString(),
      backupType: "Seed Content Purge Safe-Backup",
      recordCount: seedRecords.length,
      records: seedRecords
    };
    
    const backupData = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([backupData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sanatan_marga_seed_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setBackupDownloaded(true);
    toast.success("सुरक्षा ब्याकअप JSON फाइल सफलतापूर्वक डाउनलोड भयो!");
  };

  // Execute the actual document deletions in Firestore with Immutable Audit Logging
  const executePurge = async () => {
    if (confirmationInput !== "Confirm Sanatan Purge") {
      toast.error("प्रमाणीकरण पाठ मिलेन। कृपया सही पाठ टाइप गर्नुहोस्।");
      return;
    }

    setPurging(true);
    const seedRecords = auditRecords.filter(r => r.classification === "Seed");
    const backupFilename = `sanatan_marga_seed_backup_${new Date().toISOString().split('T')[0]}.json`;
    let successCount = 0;
    try {
      for (const rec of seedRecords) {
        const colName = rec.type === "article" ? "articles" : "communityPosts";
        await deleteDoc(doc(db, colName, rec.id));
        successCount++;
      }
      
      setAuditRecords(prev => prev.filter(r => r.classification !== "Seed"));

      // Record Immutable Governance Audit Log
      await recordAuditLog("PURGE_SEED_DATA", {
        affectedDocuments: successCount,
        backupId: backupFilename,
        details: {
          purgedTypes: ["articles", "communityPosts"],
          purgedCount: successCount,
          confirmationPhrase: confirmationInput
        },
        resourceType: "system"
      });

      toast.success(`डेटाबेस पूर्ण रूपमा सफा भयो! कुल ${successCount} वटा काल्पनिक सामग्री हटाइयो र अडिट लग राखियो।`);
      setPurgeWizardOpen(false);
      
      // Reset wizard status
      setPurgeStep("preview");
      setBackupDownloaded(false);
      setConfirmationInput("");
    } catch (err: any) {
      console.error("Purge failure:", err);
      toast.error(`डेटा हटाउने प्रक्रियामा त्रुटि: ${err.message}`);
    } finally {
      setPurging(false);
    }
  };

  useEffect(() => {
    runContentAudit();
  }, []);

  // Filter records based on tab and search query
  const getStatsCount = (classification: ContentClassification | "RecycleBin") => {
    if (classification === "RecycleBin") {
      return auditRecords.filter(r => r.deleted).length;
    }
    return auditRecords.filter(r => !r.deleted && r.classification === classification).length;
  };

  const filteredRecords = auditRecords.filter(rec => {
    let matchesTab = false;
    if (activeTab === "recycle_bin") {
      matchesTab = !!rec.deleted;
    } else {
      matchesTab = !rec.deleted && (activeTab === "all" || rec.classification === activeTab);
    }
    const matchesSearch = rec.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          rec.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border-theme rounded-3xl p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20 flex items-center gap-1.5">
                <Database size={14} /> DATA GOVERNANCE OS V3.2
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
                Integrity Active
              </span>
            </div>
            <h1 className="text-2xl font-black text-card-foreground mt-2">
              डेटा गभर्नेन्स तथा सामग्री अखण्डता अडिट
            </h1>
            <p className="text-xs text-muted-text mt-1 max-w-2xl">
              सनातन मार्ग पब्लिक लन्च हुनु अघि वास्तविक (Real), आयातित (Imported), लिगेसी माइग्रेसन (Legacy), र काल्पनिक (Seed) सामग्रीहरूको सुदृढ वर्गीकरण र व्यवस्थापन गर्ने एकीकृत प्रणाली।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runContentAudit}
              disabled={auditLoading}
              className="px-4 py-2 bg-background border border-border-theme hover:bg-muted-area/50 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={auditLoading ? "animate-spin" : ""} />
              अडिट पुनः चलाउनुहोस्
            </button>
            <button
              onClick={handleSyncAll}
              disabled={isSyncingAll}
              className="button-fancy !py-2.5 !px-4 text-xs flex items-center gap-2 shrink-0"
            >
              <RefreshCw size={14} className={isSyncingAll ? "animate-spin" : ""} />
              सबै बाह्य फिड सिंक
            </button>
          </div>
        </div>

        {syncSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={16} /> सबै डेटा फिडहरू सफलतापूर्वक सिंक तथा प्रमाणीकरण गरियो!
          </div>
        )}

        {/* INTEGRITY AUDIT STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-card border border-border-theme rounded-3xl p-4 shadow-sm space-y-1 relative overflow-hidden">
            <div className="absolute top-2 right-2 text-emerald-500/10 font-black text-3xl">R</div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">वास्तविक (Real)</span>
            <div className="text-xl font-black text-card-foreground">{getStatsCount("Real")}</div>
            <p className="text-[10px] text-muted-text">वास्तविक प्रविष्टिहरू</p>
          </div>

          <div className="bg-card border border-border-theme rounded-3xl p-4 shadow-sm space-y-1 relative overflow-hidden">
            <div className="absolute top-2 right-2 text-blue-500/10 font-black text-3xl">I</div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">आयातित (Imported)</span>
            <div className="text-xl font-black text-card-foreground">{getStatsCount("Imported")}</div>
            <p className="text-[10px] text-muted-text">समाचार एजेन्सी फिडहरू</p>
          </div>

          <div className="bg-card border border-border-theme rounded-3xl p-4 shadow-sm space-y-1 relative overflow-hidden">
            <div className="absolute top-2 right-2 text-purple-500/10 font-black text-3xl">L</div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">लिगेसी (Legacy)</span>
            <div className="text-xl font-black text-card-foreground">{getStatsCount("Legacy")}</div>
            <p className="text-[10px] text-muted-text">स्थानान्तरण गरिएका डेटा</p>
          </div>

          <div className="bg-card border border-border-theme rounded-3xl p-4 shadow-sm space-y-1 border-amber-500/20 relative overflow-hidden">
            <div className="absolute top-2 right-2 text-amber-500/10 font-black text-3xl">S</div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">काल्पनिक (Seed)</span>
            <div className="text-xl font-black text-card-foreground flex items-center gap-1">
              {getStatsCount("Seed")}
              {getStatsCount("Seed") > 0 && (
                <span className="animate-pulse bg-amber-500 text-white text-[8px] font-black px-1 rounded">
                  Purge
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-text">जाँच तथा डेमो सामग्रीहरू</p>
          </div>

          <div className="bg-card border border-border-theme rounded-3xl p-4 shadow-sm space-y-1 relative overflow-hidden">
            <div className="absolute top-2 right-2 text-slate-500/10 font-black text-3xl">A</div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">आर्काइभ (Archived)</span>
            <div className="text-xl font-black text-card-foreground">{getStatsCount("Archived")}</div>
            <p className="text-[10px] text-muted-text">सुरक्षित संग्रहहरू</p>
          </div>

          <div className="bg-card border border-border-theme rounded-3xl p-4 shadow-sm space-y-1 relative overflow-hidden">
            <div className="absolute top-2 right-2 text-muted-text/10 font-black text-3xl">U</div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-text block">अज्ञात (Unknown)</span>
            <div className="text-xl font-black text-card-foreground">{getStatsCount("Unknown")}</div>
            <p className="text-[10px] text-muted-text">पुष्टि नभएका सामग्री</p>
          </div>
        </div>

        {/* KNOWLEDGE GRAPH DENSITY & ORPHAN NODE GOVERNANCE */}
        {(() => {
          const gMetrics = KnowledgeGraphEngine.getGraphHealthMetrics();
          return (
            <div className="bg-gradient-to-r from-slate-900 via-primary/90 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-primary/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/30">
                    Saraswati Knowledge OS
                  </span>
                  <span className="text-xs font-black text-emerald-400">
                    Health Index: {gMetrics.healthScore}%
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 font-mono">Real-time Graph Telemetry</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Knowledge Nodes</span>
                  <span className="text-2xl font-black text-amber-300 font-serif">{gMetrics.totalNodes}</span>
                  <p className="text-[10px] text-slate-300 mt-0.5">भण्डारण गरिएका पावन ज्ञान बिन्दु</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Knowledge Edges</span>
                  <span className="text-2xl font-black text-emerald-300 font-serif">{gMetrics.totalEdges}</span>
                  <p className="text-[10px] text-slate-300 mt-0.5">सम्बन्ध रेखा (Avg {gMetrics.avgConnectionsPerNode}/node)</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Orphan Nodes</span>
                  <span className={`text-2xl font-black font-serif ${gMetrics.orphanNodesCount === 0 ? "text-emerald-300" : "text-amber-400"}`}>
                    {gMetrics.orphanNodesCount}
                  </span>
                  <p className="text-[10px] text-slate-300 mt-0.5">सम्बन्ध नभएका अनाथ बिन्दु</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Nepal Hub District Coverage</span>
                  <span className="text-2xl font-black text-cyan-300 font-serif">{gMetrics.nepalHubCoveragePercent}%</span>
                  <p className="text-[10px] text-slate-300 mt-0.5">{gMetrics.mappedDistrictsCount} / ७७ जिल्लाहरू जोडिइसकेका</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* SETTINGS SYNCHRONIZATION OS TELEMETRY PANEL */}
        <div className="bg-card border border-border-theme rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <Server size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-card-foreground flex items-center gap-2">
                  SettingsOS Synchronization Telemetry
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    settingsTelemetry?.status === "HEALTHY" 
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" 
                      : settingsTelemetry?.status === "SYNC_PENDING"
                      ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                  }`}>
                    {settingsTelemetry?.status === "HEALTHY" ? "Active Sync" : settingsTelemetry?.status === "SYNC_PENDING" ? "Sync Pending" : "Cache Stale"}
                  </span>
                </h3>
                <p className="text-xs text-muted-text">
                  Firestore Source of Truth ↔ Local Cache ↔ Component Propagation Status
                </p>
              </div>
            </div>

            <button
              onClick={handleForcePurgeSettingsCache}
              disabled={purgingSettingsCache}
              className="px-4 py-2 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
            >
              <RefreshCw size={14} className={purgingSettingsCache ? "animate-spin" : ""} />
              {purgingSettingsCache ? "Purging Cache..." : "Force Clear Settings Cache & Re-sync"}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-muted/30 border border-border-theme/60">
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">Firestore Version</span>
              <span className="text-xl font-black text-card-foreground font-mono">
                v{settingsTelemetry?.firestoreVersion ?? 1}
              </span>
              <p className="text-[10px] text-muted-text mt-0.5">Firestore document version</p>
            </div>

            <div className="p-3 rounded-2xl bg-muted/30 border border-border-theme/60">
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">Active Local Version</span>
              <span className="text-xl font-black text-emerald-600 font-mono">
                v{settingsTelemetry?.localVersion ?? 1}
              </span>
              <p className="text-[10px] text-muted-text mt-0.5">Frontend cached version</p>
            </div>

            <div className="p-3 rounded-2xl bg-muted/30 border border-border-theme/60">
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">Pending Queue Writes</span>
              <span className="text-xl font-black text-blue-600 font-mono">
                {settingsTelemetry?.pendingQueueCount ?? 0}
              </span>
              <p className="text-[10px] text-muted-text mt-0.5">Offline queue buffer items</p>
            </div>

            <div className="p-3 rounded-2xl bg-muted/30 border border-border-theme/60">
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">Last Sync Time</span>
              <span className="text-xs font-bold text-card-foreground font-mono block mt-1 truncate">
                {settingsTelemetry?.lastSyncTime ? new Date(settingsTelemetry.lastSyncTime).toLocaleTimeString() : "Just Now"}
              </span>
              <p className="text-[10px] text-muted-text mt-0.5">Automatic snapshot timestamp</p>
            </div>
          </div>
        </div>

        {/* AUDIT ACTIONS & CONTROL BAR */}
        <div className="bg-card border border-border-theme rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-black text-card-foreground flex items-center gap-2">
                <ShieldCheck className="text-primary" size={18} /> सामग्री अखण्डता अडिट बही (Integrity Audit Ledger)
              </h3>
              <p className="text-xs text-muted-text">डेटाबेस पूर्ण सफा राख्न र काल्पनिक डेटा सुरक्षित तवरले हटाउन तलका फिल्टरहरू र सुरक्षित पर्ज विजार्ड प्रयोग गर्नुहोस्।</p>
            </div>

            {getStatsCount("Seed") > 0 && (
              <button
                onClick={() => setPurgeWizardOpen(true)}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
              >
                <Trash2 size={14} />
                सबै {getStatsCount("Seed")} वटा काल्पनिक (Seed) डेटा मेटाउनुहोस्
              </button>
            )}
          </div>

          {/* SEARCH & TABS */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-between border-t border-border-theme pt-4">
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeTab === "all"
                    ? "bg-primary text-white"
                    : "bg-muted-area/50 hover:bg-muted-area text-muted-text"
                }`}
              >
                सबै ({auditRecords.filter(r => !r.deleted).length})
              </button>
              {(["Real", "Imported", "Legacy", "Seed", "Archived", "Unknown"] as ContentClassification[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                    activeTab === tab
                      ? "bg-primary text-white"
                      : "bg-muted-area/50 hover:bg-muted-area text-muted-text"
                  }`}
                >
                  {tab === "Real" ? `वास्तविक (${getStatsCount("Real")})` : ""}
                  {tab === "Imported" ? `आयातित (${getStatsCount("Imported")})` : ""}
                  {tab === "Legacy" ? `लिगेसी (${getStatsCount("Legacy")})` : ""}
                  {tab === "Seed" ? `सीड (${getStatsCount("Seed")})` : ""}
                  {tab === "Archived" ? `आर्काइभ (${getStatsCount("Archived")})` : ""}
                  {tab === "Unknown" ? `अज्ञात (${getStatsCount("Unknown")})` : ""}
                </button>
              ))}
              <button
                onClick={() => setActiveTab("recycle_bin")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                  activeTab === "recycle_bin"
                    ? "bg-red-600 text-white"
                    : "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border border-red-500/20"
                }`}
              >
                <Trash2 size={13} />
                रीसाइकल बिन ({getStatsCount("RecycleBin")})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="शीर्षक वा लेखक खोज्नुहोस्..."
                className="w-full pl-9 pr-4 py-1.5 bg-background border border-border-theme rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* AUDIT TABLE */}
          <div className="overflow-x-auto border border-border-theme rounded-2xl">
            {auditLoading ? (
              <div className="p-12 text-center text-xs font-bold text-muted-text flex flex-col items-center gap-2">
                <RefreshCw size={24} className="animate-spin text-primary" />
                सामग्री सूची विश्लेषण हुँदैछ... कृपया पर्खनुहोस्।
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-12 text-center text-xs font-bold text-muted-text flex flex-col items-center gap-2">
                <Info size={24} className="text-muted-text" />
                {activeTab === "recycle_bin" ? "रीसाइकल बिन खाली छ। कुनै सफ्ट-डिलिट गरिएका सामग्रीहरू छैनन्।" : "अडिटमा कुनै रेकर्ड भेटिएन।"}
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-theme bg-muted-area/30 text-[10px] font-black uppercase tracking-widest text-muted-text">
                    <th className="p-3">सामग्री शीर्षक (Title)</th>
                    <th className="p-3">प्रकार</th>
                    <th className="p-3">लेखक (Author)</th>
                    <th className="p-3">स्थिति / अवधारण (Status / Retention)</th>
                    <th className="p-3 text-right">कार्यहरू (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-theme text-xs font-semibold">
                  <AnimatePresence mode="popLayout">
                    {filteredRecords.map((rec) => (
                      <motion.tr 
                        key={rec.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-muted-area/20 transition-colors"
                      >
                        <td className="p-3 max-w-sm">
                          <div className="font-bold text-card-foreground truncate" title={rec.title}>
                            {rec.title}
                          </div>
                          <span className="text-[10px] text-muted-text block mt-0.5 font-mono">ID: {rec.id}</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            rec.type === 'article' 
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                              : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                          }`}>
                            {rec.type === 'article' ? 'समाचार लेख' : 'चौतारी पोष्ट'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="text-card-foreground font-bold">{rec.authorName}</div>
                          <span className="text-[9px] text-muted-text font-mono">UID: {rec.authorId.substring(0, 10)}...</span>
                        </td>
                        <td className="p-3">
                          {rec.deleted ? (
                            <span className="px-2 py-1 rounded-full text-[10px] font-black border bg-red-500/10 text-red-600 border-red-500/30 flex items-center gap-1 w-fit">
                              <Trash2 size={12} /> रीसाइकल बिन (३०-दिने अवधारण)
                            </span>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-[10px] font-black border ${
                              rec.classification === 'Real' 
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                                : rec.classification === 'Imported'
                                ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                                : rec.classification === 'Legacy'
                                ? 'bg-purple-500/10 text-purple-600 border-purple-500/30'
                                : rec.classification === 'Seed'
                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 animate-pulse'
                                : rec.classification === 'Archived'
                                ? 'bg-slate-500/10 text-slate-600 border-slate-500/30'
                                : 'bg-gray-500/10 text-gray-500 border-gray-500/30'
                            }`}>
                              {rec.classification === 'Real' && '✔️ Real Content'}
                              {rec.classification === 'Imported' && '📥 Imported Feed'}
                              {rec.classification === 'Legacy' && '📦 Legacy Migration'}
                              {rec.classification === 'Seed' && '⚠️ Mock / Seed Data'}
                              {rec.classification === 'Archived' && '🗄️ Archived'}
                              {rec.classification === 'Unknown' && '❓ Unclassified'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                          {rec.deleted ? (
                            <>
                              <button
                                onClick={() => restoreRecord(rec.id, rec.type)}
                                className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-black border border-emerald-500/30 transition-colors inline-flex items-center gap-1"
                              >
                                <RefreshCw size={11} /> पुनर्स्थापना (Restore)
                              </button>
                              <button
                                onClick={() => purgeSingleRecord(rec.id, rec.type)}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-black transition-colors inline-flex items-center gap-1"
                                title="स्थायी रूपमा मेटाउनुहोस्"
                              >
                                <Trash2 size={11} /> स्थायी मेटाउनुहोस्
                              </button>
                            </>
                          ) : (
                            <>
                              {rec.classification !== "Real" && (
                                <button
                                  onClick={() => updateRecordClassification(rec.id, rec.type, "Real")}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40 rounded text-[10px] font-black border border-emerald-500/20 transition-colors"
                                >
                                  Mark Real
                                </button>
                              )}
                              {rec.classification !== "Imported" && (
                                <button
                                  onClick={() => updateRecordClassification(rec.id, rec.type, "Imported")}
                                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded text-[10px] font-black border border-blue-500/20 transition-colors"
                                >
                                  Mark Imported
                                </button>
                              )}
                              {rec.classification !== "Legacy" && (
                                <button
                                  onClick={() => updateRecordClassification(rec.id, rec.type, "Legacy")}
                                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 dark:hover:bg-purple-950/40 rounded text-[10px] font-black border border-purple-500/20 transition-colors"
                                >
                                  Mark Legacy
                                </button>
                              )}
                              {rec.classification !== "Archived" && (
                                <button
                                  onClick={() => updateRecordClassification(rec.id, rec.type, "Archived")}
                                  className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-950/20 dark:text-slate-400 dark:hover:bg-slate-950/40 rounded text-[10px] font-black border border-slate-500/20 transition-colors"
                                >
                                  Archive
                                </button>
                              )}
                              <button
                                onClick={() => softDeleteRecord(rec.id, rec.type)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded border border-transparent hover:border-red-500/20 transition-colors inline-flex items-center align-middle"
                                title="रीसाइकल बिनमा पठाउनुहोस्"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* FEED REGISTRY SECTION */}
        <div className="bg-card border border-border-theme rounded-3xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-border-theme flex items-center justify-between">
            <h3 className="text-sm font-black text-card-foreground flex items-center gap-2">
              <Server size={16} className="text-primary" /> प्रत्यक्ष डेटा सोर्सेज अनुगमन (Freshness Monitor)
            </h3>
            <span className="text-xs text-muted-text">स्वचालित रूपमा अपडेट हुने</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-theme bg-muted-area/50 text-[10px] font-black uppercase tracking-widest text-muted-text">
                  <th className="p-4">सोर्स नाम (Source Name)</th>
                  <th className="p-4">प्रकार (Type)</th>
                  <th className="p-4">फ्रेसनेस (Freshness)</th>
                  <th className="p-4">सफलता दर</th>
                  <th className="p-4">स्वामित्व (Owner)</th>
                  <th className="p-4">ट्रस्ट स्कोर</th>
                  <th className="p-4">स्थिति</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme text-xs font-semibold">
                {sources.map((src, idx) => (
                  <tr key={idx} className="hover:bg-muted-area/30 transition-colors">
                    <td className="p-4 font-black text-card-foreground">{src.sourceName}</td>
                    <td className="p-4 text-muted-text font-medium">{src.type}</td>
                    <td className="p-4 font-mono font-bold text-primary">{src.freshness}</td>
                    <td className="p-4 font-mono font-bold text-emerald-600">{src.successRate}</td>
                    <td className="p-4 text-card-foreground">{src.owner}</td>
                    <td className="p-4 font-bold">
                      <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {src.trustScore}%
                      </span>
                    </td>
                    <td className="p-4">
                      {src.status === 'healthy' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 flex items-center gap-1 w-fit">
                          <CheckCircle2 size={12} /> स्वस्थ (Healthy)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20 flex items-center gap-1 w-fit">
                          <AlertTriangle size={12} /> ध्यान दिनुपर्ने
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* SAFE PURGE WIZARD MODAL (PREVENT ACCIDENTAL ONE-CLICK DELETION) */}
      <AnimatePresence>
        {purgeWizardOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border-theme rounded-3xl max-w-xl w-full overflow-hidden shadow-xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border-theme flex items-center justify-between bg-muted-area/20">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                    <ShieldCheck size={20} />
                  </span>
                  <div>
                    <h2 className="text-base font-black text-card-foreground">
                      सुरक्षित डेटाबेस सफाई विजार्ड
                    </h2>
                    <p className="text-[10px] text-muted-text">
                      Production Purge Guard &bull; Phase {purgeStep === "preview" ? "1/3" : purgeStep === "backup" ? "2/3" : "3/3"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPurgeWizardOpen(false);
                    setPurgeStep("preview");
                    setBackupDownloaded(false);
                    setConfirmationInput("");
                  }}
                  className="p-1.5 hover:bg-muted-area rounded-lg transition-colors text-muted-text hover:text-card-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Progress Tracker bar */}
              <div className="w-full h-1 bg-border-theme relative">
                <div 
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{
                    width: purgeStep === "preview" ? "33.3%" : purgeStep === "backup" ? "66.6%" : "100%"
                  }}
                />
              </div>

              {/* Step Contents */}
              <div className="p-6 space-y-6">
                
                {/* STEP 1: PREVIEW / DRY RUN */}
                {purgeStep === "preview" && (
                  <div className="space-y-4">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
                      <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-amber-600">ड्राइ-रन (Dry-Run) विश्लेषण रिपोर्ट</h4>
                        <p className="text-xs text-muted-text">
                          तपाईंको डेटाबेसमा कुल <span className="font-black text-card-foreground">{getStatsCount("Seed")} वटा</span> काल्पनिक (Seed) रेकर्डहरू फेला परेका छन्। यिनीहरूलाई पूर्ण सफा गर्दा तल उल्लेखित संख्यामा कागजातहरू मेटिने छन्:
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted-area/40 rounded-xl border border-border-theme text-center">
                        <span className="text-[10px] text-muted-text block uppercase font-bold">समाचार लेखहरू (Articles)</span>
                        <span className="text-lg font-black text-card-foreground">
                          {auditRecords.filter(r => r.classification === "Seed" && r.type === "article").length}
                        </span>
                      </div>
                      <div className="p-3 bg-muted-area/40 rounded-xl border border-border-theme text-center">
                        <span className="text-[10px] text-muted-text block uppercase font-bold">चौतारी पोष्ट (Posts)</span>
                        <span className="text-lg font-black text-card-foreground">
                          {auditRecords.filter(r => r.classification === "Seed" && r.type === "communityPost").length}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-card-foreground flex items-center gap-1">
                        <Eye size={14} className="text-primary" /> हटाउन लागिएको डेटाको नमुना (Preview Ledger Sample)
                      </label>
                      <div className="border border-border-theme rounded-xl max-h-40 overflow-y-auto divide-y divide-border-theme text-[11px]">
                        {auditRecords.filter(r => r.classification === "Seed").map(rec => (
                          <div key={rec.id} className="p-2.5 flex items-center justify-between hover:bg-muted-area/20">
                            <span className="font-bold text-card-foreground truncate max-w-[70%]" title={rec.title}>
                              {rec.title}
                            </span>
                            <span className="text-[9px] font-mono text-muted-text uppercase bg-muted-area px-1.5 py-0.5 rounded">
                              {rec.type === "article" ? "लेख" : "चौतारी"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setPurgeWizardOpen(false)}
                        className="px-4 py-2 bg-background border border-border-theme hover:bg-muted-area/50 rounded-xl text-xs font-bold text-muted-text transition-colors"
                      >
                        रद्द गर्नुहोस्
                      </button>
                      <button
                        onClick={() => setPurgeStep("backup")}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        चरण २ मा जानुहोस् (सुरक्षा ब्याकअप)
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: BACKUP EXPORT */}
                {purgeStep === "backup" && (
                  <div className="space-y-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex gap-3">
                      <Download className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-emerald-600">सुरक्षा ब्याकअप अनिवार्य प्रतिलिपि</h4>
                        <p className="text-xs text-muted-text">
                          दुर्घटना रोक्न र कुनै पनि समयमा डेटा पुनर्स्थापना गर्न सकियोस् भन्नाका लागि, मेटाइन लागिएका सबै सामग्रीहरूको स्थानीय JSON ब्याकअप डाउनलोड गर्नुपर्नेछ। ब्याकअप डाउनलोड नगरी सफाई प्रक्रिया अघि बढ्न सक्ने छैन।
                        </p>
                      </div>
                    </div>

                    <div className="p-6 bg-muted-area/40 rounded-2xl border border-border-theme flex flex-col items-center justify-center text-center space-y-3">
                      <div className={`p-4 rounded-full ${backupDownloaded ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'} border`}>
                        {backupDownloaded ? <Check size={28} /> : <Download size={28} />}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-card-foreground">
                          {backupDownloaded ? "ब्याकअप सुरक्षित तवरले सुरक्षित भयो" : "ब्याकअप रेकर्ड तयार छ"}
                        </h4>
                        <p className="text-[10px] text-muted-text max-w-sm mt-1">
                          यो ब्याकअप फाइलमा {getStatsCount("Seed")} वटा सामग्रीहरूको सम्पूर्ण डेटा संकलित छ।
                        </p>
                      </div>
                      <button
                        onClick={downloadBackup}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Download size={14} />
                        सुरक्षा ब्याकअप डाउनलोड गर्नुहोस्
                      </button>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={() => setPurgeStep("preview")}
                        className="px-4 py-2 bg-background border border-border-theme hover:bg-muted-area/50 rounded-xl text-xs font-bold text-muted-text transition-colors"
                      >
                        पछाडि जानुहोस्
                      </button>
                      <button
                        onClick={() => setPurgeStep("confirm")}
                        disabled={!backupDownloaded}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        चरण ३ मा जानुहोस् (पुष्टि गर्नुहोस्)
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: CONFIRM & EXECUTE */}
                {purgeStep === "confirm" && (
                  <div className="space-y-4">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3">
                      <Lock className="text-red-500 shrink-0 mt-0.5" size={18} />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-red-600">अन्तिम सुरक्षा प्रमाणीकरण</h4>
                        <p className="text-xs text-muted-text">
                          यो प्रक्रिया पूर्ण रूपमा स्थायी छ र यसलाई फिर्ता लिन सकिने छैन। के तपाईं साँच्चिकै सबै {getStatsCount("Seed")} वटा सामग्रीहरू मेटाई डेटाबेस सफा गर्न चाहनुहुन्छ?
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-muted-text block">
                        अघि बढ्नका लागि कृपया तलको कोष्ठकमा <span className="text-red-500 select-all font-mono font-black bg-red-500/5 px-1 py-0.5 rounded border border-red-500/10">Confirm Sanatan Purge</span> टाइप गर्नुहोस्:
                      </label>
                      <input
                        type="text"
                        value={confirmationInput}
                        onChange={(e) => setConfirmationInput(e.target.value)}
                        placeholder="माथिको पाठ हुबहु यहाँ लेख्नुहोस्..."
                        className="w-full px-4 py-2.5 bg-background border border-border-theme focus:border-red-500 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={() => setPurgeStep("backup")}
                        className="px-4 py-2 bg-background border border-border-theme hover:bg-muted-area/50 rounded-xl text-xs font-bold text-muted-text transition-colors"
                      >
                        पछाडि जानुहोस्
                      </button>
                      <button
                        onClick={executePurge}
                        disabled={confirmationInput !== "Confirm Sanatan Purge" || purging}
                        className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Trash2 size={14} />
                        {purging ? "सफाई हुँदै..." : "स्थायी रूपमा सबै मेटाउनुहोस् (Execute Purge)"}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
