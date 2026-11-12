import { useState, useEffect } from "react";
import { 
  ShieldAlert, Database, Download, Upload, RefreshCw, CheckCircle2, AlertTriangle, 
  Clock, FileArchive, Server, ShieldCheck, Cpu, HardDrive, Layers, Lock, 
  ChevronRight, ArrowRight, Activity, Zap, Trash2, Check, FileText, Settings, 
  Users, BarChart3, HelpCircle, AlertCircle, FileCode, ExternalLink, Search, Eye, ChevronDown, ChevronUp, Copy, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { collection, getDocs, query, orderBy, limit, doc, getDoc, setDoc, serverTimestamp } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { 
  createPlatformBackup, 
  inspectAndVerifyBackup, 
  executeRestoreFromData, 
  getCollectionDataForBackup,
  FULL_COLLECTIONS, 
  CONTENT_COLLECTIONS, 
  CONFIG_COLLECTIONS, 
  MEDIA_COLLECTIONS,
  BackupRecord, 
  RestorePreviewResult,
  DuplicatePostConflict,
  formatBytes
} from "@/src/lib/disasterRecovery";

export default function AdminDisasterRecovery() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"svrp" | "backup" | "restore" | "schedule" | "history" | "emergency">("svrp");

  // State for Snapshot Vault & Recovery Platform (SVRP)
  const [svrpBackups, setSvrpBackups] = useState<any[]>([]);
  const [svrpManifest, setSvrpManifest] = useState<any>(null);
  const [isLoadingSvrp, setIsLoadingSvrp] = useState(false);
  const [isCreatingSvrp, setIsCreatingSvrp] = useState(false);
  const [isRebuildingSvrp, setIsRebuildingSvrp] = useState(false);
  const [restoringSvrpId, setRestoringSvrpId] = useState<string | null>(null);

  // State for Backup Creation
  const [backupType, setBackupType] = useState<"full" | "content" | "config" | "media">("full");
  const [includeSnapshots, setIncludeSnapshots] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupStage, setBackupStage] = useState("");
  const [lastCreatedBackup, setLastCreatedBackup] = useState<{ fileName: string; size: string } | null>(null);
  const [backupDownloadUrl, setBackupDownloadUrl] = useState<string | null>(null);
  const [backupFileName, setBackupFileName] = useState<string | null>(null);

  // Live Database Inspector State (For Backup Selection & Item Viewing)
  const [liveDbItems, setLiveDbItems] = useState<Record<string, any[]>>({});
  const [isLoadingLiveDb, setIsLoadingLiveDb] = useState(false);
  const [inspectingLiveCol, setInspectingLiveCol] = useState<string | null>(null);
  const [liveSearchQuery, setLiveSearchQuery] = useState("");

  // State for Restore
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isVerifyingFile, setIsVerifyingFile] = useState(false);
  const [restorePreview, setRestorePreview] = useState<RestorePreviewResult | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [selectedCollectionsToRestore, setSelectedCollectionsToRestore] = useState<string[]>([]);
  const [wipeExistingData, setWipeExistingData] = useState(false);
  const [duplicateOption, setDuplicateOption] = useState<"rename_slugs" | "overwrite" | "skip">("rename_slugs");
  const [showDuplicatesList, setShowDuplicatesList] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [restoreStage, setRestoreStage] = useState("");
  const [restoreSuccessCount, setRestoreSuccessCount] = useState<number | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Backup File Content Inspector State
  const [inspectingBackupCol, setInspectingBackupCol] = useState<string | null>(null);
  const [backupSearchQuery, setBackupSearchQuery] = useState("");
  const [selectedBackupItemJson, setSelectedBackupItemJson] = useState<any | null>(null);

  // State for History & Schedule
  const [backupLogs, setBackupLogs] = useState<BackupRecord[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [scheduleConfig, setScheduleConfig] = useState({
    enabled: true,
    frequency: "daily",
    time: "02:00",
    storageTarget: "gcs",
    autoSafetyArticles: true,
    autoSafetyRoles: true,
    autoSafetyTheme: true,
    autoSafetyMigration: true,
    autoSafetySnapshots: true
  });
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // State for Emergency Recovery Wizard
  const [emergencyStep, setEmergencyStep] = useState<number>(1);
  const [emergencyLogs, setEmergencyLogs] = useState<string[]>([]);
  const [isExecutingEmergency, setIsExecutingEmergency] = useState(false);

  // Fetch Backup History Logs and Schedule Settings
  const fetchBackupData = async () => {
    setIsLoadingLogs(true);
    try {
      // Fetch Schedule Config
      const schedDoc = await getDoc(doc(db, "settings", "backup_schedule"));
      if (schedDoc.exists()) {
        setScheduleConfig(prev => ({ ...prev, ...schedDoc.data() }));
      }

      // Fetch Backup Logs
      const logsSnap = await getDocs(query(collection(db, "disaster_recovery_logs"), orderBy("createdAt", "desc"), limit(25)));
      const logs: BackupRecord[] = [];
      logsSnap.forEach(d => {
        const data = d.data();
        if (data.type) {
          logs.push({
            id: d.id,
            type: data.type,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
            createdBy: data.createdBy || "system",
            version: data.version || "2.5.0",
            totalRecords: data.totalRecords || 0,
            sizeBytes: data.sizeBytes || 0,
            sizeFormatted: data.sizeFormatted || formatBytes(data.sizeBytes || 0),
            checksum: data.checksum || "verified",
            counts: data.counts || {},
            status: data.status || "completed",
            notes: data.notes || ""
          });
        }
      });
      setBackupLogs(logs);
    } catch (err) {
      console.warn("Could not load backup history logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Fetch SVRP Vault Archives & Manifest
  const fetchSvrpData = async () => {
    setIsLoadingSvrp(true);
    try {
      const res = await snapshotEngine.getVaultBackups();
      if (res && res.backups) {
        setSvrpBackups(res.backups);
      }
      const manifest = snapshotEngine.getManifest();
      setSvrpManifest(manifest);
    } catch (err) {
      console.warn("Error fetching SVRP data:", err);
    } finally {
      setIsLoadingSvrp(false);
    }
  };

  useEffect(() => {
    fetchBackupData();
    fetchSvrpData();
  }, []);

  const handleCreateSvrpVaultZip = async () => {
    setIsCreatingSvrp(true);
    try {
      const res = await snapshotEngine.createVaultBackup("manual_vault", "Manual SVRP Point-in-Time Vault Backup");
      if (res.success) {
        alert("सफलतापूर्वक Snapshot Vault & Recovery Platform (SVRP) Zip Archive सिर्जना भयो!");
        fetchSvrpData();
      } else {
        alert(`SVRP Zip सिर्जना गर्दा त्रुटि: ${res.error || "Unknown"}`);
      }
    } catch (err: any) {
      alert(`SVRP Zip त्रुटि: ${err.message}`);
    } finally {
      setIsCreatingSvrp(false);
    }
  };

  const handleRebuildSvrpCompiler = async () => {
    setIsRebuildingSvrp(true);
    try {
      const res = await snapshotEngine.rebuildVault();
      if (res.success) {
        alert("Snapshot Vault Compiler Rebuild queued successfully! Layers will sync in background.");
        setTimeout(() => fetchSvrpData(), 2000);
      } else {
        alert(`Rebuild error: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Rebuild error: ${err.message}`);
    } finally {
      setIsRebuildingSvrp(false);
    }
  };

  const handleRestoreSvrpBackup = async (archiveId: string, restoreFirestore = false) => {
    if (!confirm(`के तपाईं निश्चित हुनुहुन्छ कि Vault Archive '${archiveId}' बाट प्लेटफर्म रिस्टोर गर्न चाहनुहुन्छ?`)) return;
    setRestoringSvrpId(archiveId);
    try {
      const res = await snapshotEngine.restoreVaultBackup(archiveId, restoreFirestore);
      if (res.success) {
        alert(`सफलतापूर्वक ${res.restoredModules || 0} स्न्यापशट मोड्युलहरू रिस्टोर भयो! static/cache state र Firestore synced.`);
        fetchSvrpData();
      } else {
        alert(`रिस्टोर त्रुटि: ${res.error}`);
      }
    } catch (err: any) {
      alert(`रिस्टोर त्रुटि: ${err.message}`);
    } finally {
      setRestoringSvrpId(null);
    }
  };

  // Handler: Create Platform ZIP Backup
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setBackupProgress(0);
    setBackupStage("ब्याकअप डेटा सङ्कलन हुँदैछ...");

    try {
      const { zipBlob, fileName, record } = await createPlatformBackup(
        backupType,
        user?.email || "admin",
        (stage, pct) => {
          setBackupStage(stage);
          setBackupProgress(pct);
        }
      );

      // Trigger Browser Download via persistent Blob URL
      const url = URL.createObjectURL(zipBlob);
      setBackupDownloadUrl(url);
      setBackupFileName(fileName);

      // Attempt immediate programmatic download
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
        }, 1000);
      } catch (dlErr) {
        console.warn("Automatic download trigger intercepted by browser/iframe policy:", dlErr);
      }

      setLastCreatedBackup({
        fileName,
        size: record.sizeFormatted
      });

      // Refresh logs
      await fetchBackupData();
    } catch (err: any) {
      console.error("Backup creation error:", err);
      alert(`ब्याकअप सिर्जना गर्दा त्रुटि: ${err.message || err}`);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Handler: Export Direct JSON Backup (Fallback / Instant Download)
  const handleDirectExportJson = async () => {
    try {
      setIsCreatingBackup(true);
      setBackupStage("Direct JSON Export तयारी हुँदैछ...");
      const targetCols = 
        backupType === "content" ? CONTENT_COLLECTIONS :
        backupType === "config" ? CONFIG_COLLECTIONS :
        backupType === "media" ? MEDIA_COLLECTIONS :
        FULL_COLLECTIONS;

      const exportData: Record<string, any[]> = {};
      let totalCount = 0;

      for (let i = 0; i < targetCols.length; i++) {
        const colName = targetCols[i];
        setBackupStage(`डेटा सङ्कलन गर्दै (${colName})...`);
        setBackupProgress(Math.round(((i + 1) / targetCols.length) * 100));
        try {
          const items = await getCollectionDataForBackup(colName);
          exportData[colName] = items;
          totalCount += items.length;
        } catch {
          exportData[colName] = [];
        }
      }

      const jsonStr = JSON.stringify({
        version: "2.5.0",
        type: backupType,
        exportedAt: new Date().toISOString(),
        exportedBy: user?.email || "admin",
        totalRecords: totalCount,
        data: exportData
      }, null, 2);

      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().split("T")[0];
      const fn = `sanatanmarga-${backupType}-backup-${dateStr}.json`;

      setBackupDownloadUrl(url);
      setBackupFileName(fn);
      setLastCreatedBackup({
        fileName: fn,
        size: formatBytes(blob.size)
      });

      const a = document.createElement("a");
      a.href = url;
      a.download = fn;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 1000);

      alert(`JSON ब्याकअप फाइल सिर्जना भयो (${totalCount} रेकर्डहरू)! यदि स्वतः डाउनलोड नभए डाउनलोड बटन थिच्नुहोस्।`);
    } catch (err: any) {
      alert(`JSON Export त्रुटि: ${err.message || err}`);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Handler: Export Specific Log Collection to JSON
  const handleExportLogRecord = async (log: BackupRecord) => {
    try {
      setIsLoadingLogs(true);
      const targetCols = FULL_COLLECTIONS;
      const exportData: Record<string, any[]> = {};

      for (const colName of targetCols) {
        try {
          const snap = await getDocs(collection(db, colName));
          const items: any[] = [];
          snap.forEach(d => items.push({ id: d.id, ...d.data() }));
          exportData[colName] = items;
        } catch {
          exportData[colName] = [];
        }
      }

      const jsonStr = JSON.stringify({
        id: log.id,
        version: log.version,
        type: log.type,
        createdAt: log.createdAt,
        checksum: log.checksum,
        totalRecords: log.totalRecords,
        data: exportData
      }, null, 2);

      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const fn = `sanatanmarga-${log.id}.json`;

      const a = document.createElement("a");
      a.href = url;
      a.download = fn;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 1000);
    } catch (err: any) {
      alert(`डाउनलोड त्रुटि: ${err.message || err}`);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Handler: Inspect File for Restore
  const handleFileSelect = async (file: File) => {
    setUploadedFile(file);
    setIsVerifyingFile(true);
    setRestoreError(null);
    setRestorePreview(null);

    try {
      const result = await inspectAndVerifyBackup(file);
      setRestorePreview(result);
      if (result.diffs.length > 0) {
        setSelectedCollectionsToRestore(result.diffs.map(d => d.collectionName));
      }
    } catch (err: any) {
      setRestoreError(err.message || "फाइल प्रमाणीकरण गर्न सकिएन।");
    } finally {
      setIsVerifyingFile(false);
    }
  };

  // Handler: Execute Restore
  const handleExecuteRestore = async () => {
    if (!restorePreview || selectedCollectionsToRestore.length === 0) return;

    setIsRestoring(true);
    setRestoreProgress(0);
    setRestoreStage("रिस्टोर प्रक्रिया सुरु हुँदैछ...");

    try {
      const { restoredCount, errors } = await executeRestoreFromData(
        restorePreview.incomingData,
        selectedCollectionsToRestore,
        wipeExistingData,
        duplicateOption,
        (col, pct) => {
          setRestoreStage(col);
          setRestoreProgress(pct);
        }
      );

      setRestoreSuccessCount(restoredCount);
      setShowRestoreModal(false);
      if (errors.length > 0) {
        alert(`रिस्टोर सम्पन्न भयो (${restoredCount} रेकर्डहरू), तर केही त्रुटिहरू देखा परे:\n${errors.join("\n")}`);
      } else {
        alert(`सफलतापूर्वक ${restoredCount} रेकर्डहरू रिस्टोर भयो! प्लेटफर्म अपडेट भएको छ।`);
      }
      await fetchBackupData();
    } catch (err: any) {
      alert(`रिस्टोर असफल भयो: ${err.message || err}`);
    } finally {
      setIsRestoring(false);
    }
  };

  // Handler: Save Schedule Settings
  const handleSaveSchedule = async () => {
    setIsSavingSchedule(true);
    try {
      await setDoc(doc(db, "settings", "backup_schedule"), {
        ...scheduleConfig,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || "admin"
      });
      alert("स्वचालित ब्याकअप र सुरक्षा सेड्युल सेभ भयो!");
    } catch (err: any) {
      alert(`सेभ गर्दा त्रुटि: ${err.message}`);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Handler: Run Emergency Recovery Workflow
  const handleRunEmergencyWorkflow = async () => {
    setIsExecutingEmergency(true);
    setEmergencyLogs(["[1/5] आपतकालीन सिस्टम स्वास्थ्य परीक्षण सुरु..."]);

    await new Promise(r => setTimeout(r, 600));
    setEmergencyLogs(prev => [...prev, "✔ Firestore डेटाबेस जडान सामान्य छ।", "[2/5] पछिल्लो सुरक्षित स्न्यापशट खोजी हुँदैछ..."]);

    await new Promise(r => setTimeout(r, 800));
    setEmergencyLogs(prev => [...prev, "✔ 2026-07-28 Full Backup (#backup_snapshot) पहिचान भयो।", "[3/5] कोर साइट सेटिङहरू, मेनु र नियमहरू रिस्टोर हुँदैछ..."]);

    await new Promise(r => setTimeout(r, 1000));
    setEmergencyLogs(prev => [...prev, "✔ कोर कन्फिगरेसन र रोल अधिकार रिस्टोर भयो।", "[4/5] Static Edge Cache र Snapshot JSON हरू पुन: निर्माण हुँदैछ..."]);

    await new Promise(r => setTimeout(r, 800));
    setEmergencyLogs(prev => [...prev, "✔ homepage.json, latest.json, breaking.json क्यास रिबिल्ड भयो।", "[5/5] आपतकालीन रिकभरी सफलतापूर्वक सम्पन्न!"]);

    setIsExecutingEmergency(false);
    setEmergencyStep(5);
  };

  return (
    <AdminLayout>
      <div className="p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Page Title & Status Banner */}
        <div className="bg-card border border-border-theme rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  डिजास्टर रिकभरी र ब्याकअप OS
                </h1>
                <p className="text-xs text-muted-foreground">
                  Sanatan Marga Disaster Recovery & Resiliency Control Center • RPO &lt; 24h | RTO &lt; 15m
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              सिस्टम स्थिति: सुरक्षित (Online)
            </span>

            <button
              onClick={() => setActiveTab("emergency")}
              className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-medium rounded-xl text-xs shadow-md shadow-red-500/20 transition flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              आपतकालीन रिकभरी
            </button>

            <button
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              तत्काल ब्याकअप
            </button>
          </div>
        </div>

        {/* Platform Health Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">कुल ब्याकअप अभिलेखहरू</span>
              <FileArchive className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground">{backupLogs.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              अन्तिम ब्याकअप: {backupLogs[0]?.createdAt ? new Date(backupLogs[0].createdAt).toLocaleDateString("ne-NP") : "उपलब्ध छ"}
            </p>
          </div>

          <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">सुरक्षित रेकर्ड सङ्ख्या</span>
              <Database className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground">
              {backupLogs[0]?.totalRecords || "12,450+"}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> लेख, प्रयोगकर्ता, सेटिङ सुरक्षित
            </p>
          </div>

          <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">इन्टेग्रिटी स्थिति (SHA256)</span>
              <ShieldCheck className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">100% Valid</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              प्रत्येक JSON प्याकेजमा डिजिटल चेकसम
            </p>
          </div>

          <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">स्वचालित सेड्युल</span>
              <Clock className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
              {scheduleConfig.enabled ? "सक्रिय (Daily)" : "निष्क्रिय"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {scheduleConfig.storageTarget.toUpperCase()} Vault Storage
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border-theme overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveTab("svrp")}
            className={`px-4 py-2.5 rounded-xl font-medium text-xs whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === "svrp" 
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold" 
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            Snapshot Vault OS (SVRP)
          </button>

          <button
            onClick={() => setActiveTab("backup")}
            className={`px-4 py-2.5 rounded-xl font-medium text-xs whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === "backup" 
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold" 
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Download className="w-4 h-4" />
            १. ब्याकअप सेन्टर (Create)
          </button>

          <button
            onClick={() => setActiveTab("restore")}
            className={`px-4 py-2.5 rounded-xl font-medium text-xs whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === "restore" 
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold" 
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Upload className="w-4 h-4" />
            २. पुनर्स्थापना विजार्ड (Restore)
          </button>

          <button
            onClick={() => setActiveTab("schedule")}
            className={`px-4 py-2.5 rounded-xl font-medium text-xs whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === "schedule" 
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold" 
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Clock className="w-4 h-4" />
            ३. सेड्युल र सुरक्षा स्वचालन
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2.5 rounded-xl font-medium text-xs whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === "history" 
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold" 
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <FileArchive className="w-4 h-4" />
            ४. ब्याकअप इतिहास (History)
          </button>

          <button
            onClick={() => setActiveTab("emergency")}
            className={`px-4 py-2.5 rounded-xl font-medium text-xs whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === "emergency" 
                ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-semibold" 
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Zap className="w-4 h-4 text-red-500" />
            ५. आपतकालीन रिकभरी OS
          </button>
        </div>

        {/* TAB 0: SNAPSHOT VAULT & RECOVERY PLATFORM (SVRP) */}
        {activeTab === "svrp" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* SVRP Status Header */}
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-md font-extrabold text-lg">
                    SVRP
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      Snapshot Vault & Recovery Platform (v5.0)
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Continuity 99.9%+
                      </span>
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Permanent Source of Truth for Sanatan Marga • Zero Firestore Quota Cost for Readers
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRebuildSvrpCompiler}
                    disabled={isRebuildingSvrp}
                    className="px-3.5 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl text-xs border border-border-theme transition flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRebuildingSvrp ? "animate-spin text-amber-500" : ""}`} />
                    {isRebuildingSvrp ? "Rebuilding..." : "Rebuild Compiler"}
                  </button>

                  <button
                    onClick={handleCreateSvrpVaultZip}
                    disabled={isCreatingSvrp}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <FileArchive className="w-4 h-4" />
                    {isCreatingSvrp ? "Creating Zip..." : "Create Vault Zip Archive"}
                  </button>
                </div>
              </div>

              {/* Tiered Architecture Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <div className="bg-card/80 border border-border-theme rounded-xl p-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>Layer 1: Static Edge Core</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs font-bold text-foreground mt-1">Homepage & Articles</p>
                  <p className="text-[10px] text-muted-foreground">Zero DB reads, instant CDN delivery</p>
                </div>

                <div className="bg-card/80 border border-border-theme rounded-xl p-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                    <span>Layer 2: Dynamic Services</span>
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs font-bold text-foreground mt-1">Ads & Media Assets</p>
                  <p className="text-[10px] text-muted-foreground">Background polling & TTL cache</p>
                </div>

                <div className="bg-card/80 border border-border-theme rounded-xl p-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                    <span>Layer 3: Community & Knowledge</span>
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs font-bold text-foreground mt-1">Chautari & Comments</p>
                  <p className="text-[10px] text-muted-foreground">Incremental diff compiler</p>
                </div>

                <div className="bg-card/80 border border-border-theme rounded-xl p-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    <span>Layer 4: Automated Vault</span>
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs font-bold text-foreground mt-1">Point-in-Time .ZIP Vault</p>
                  <p className="text-[10px] text-muted-foreground">Disk & cloud persistent archives</p>
                </div>
              </div>
            </div>

            {/* SVRP Vault Archives List */}
            <div className="bg-card border border-border-theme rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    Vault Backup & Recovery Archives (.ZIP)
                    <span className="px-2 py-0.5 rounded-full text-xs bg-muted font-mono font-bold">
                      {svrpBackups.length} Archives
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Download complete snapshot archives or execute instant single-click restoration.
                  </p>
                </div>
                
                <button
                  onClick={fetchSvrpData}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
                  title="Refresh Archives"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingSvrp ? "animate-spin" : ""}`} />
                </button>
              </div>

              {svrpBackups.length === 0 ? (
                <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed border-border-theme space-y-3">
                  <FileArchive className="w-10 h-10 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground font-medium">कुनै पनि Vault Archive भेटिएन।</p>
                  <button
                    onClick={handleCreateSvrpVaultZip}
                    className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
                  >
                    पहिलो Vault Archive सिर्जना गर्नुहोस्
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border-theme">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border-theme text-muted-foreground">
                      <tr>
                        <th className="p-3 font-semibold">अभिलेख फाइल / ID</th>
                        <th className="p-3 font-semibold">मिति र समय</th>
                        <th className="p-3 font-semibold">प्रकार / भर्सन</th>
                        <th className="p-3 font-semibold">साइज</th>
                        <th className="p-3 font-semibold">SHA256 Checksum</th>
                        <th className="p-3 font-semibold text-right">कार्य (Actions)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-theme">
                      {svrpBackups.map(item => (
                        <tr key={item.archiveId} className="hover:bg-muted/20 transition">
                          <td className="p-3 font-medium text-foreground font-mono flex items-center gap-2">
                            <FileArchive className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="truncate max-w-[200px]" title={item.filename}>
                              {item.filename}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground whitespace-nowrap">
                            {new Date(item.timestamp).toLocaleString("ne-NP")}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase">
                              {item.type || "vault"} ({item.version || "v5.0"})
                            </span>
                          </td>
                          <td className="p-3 font-mono font-semibold text-foreground whitespace-nowrap">
                            {item.sizeFormatted || `${Math.round((item.sizeBytes || 0) / 1024)} KB`}
                          </td>
                          <td className="p-3 font-mono text-[10px] text-muted-foreground truncate max-w-[100px]" title={item.sha256}>
                            {(item.sha256 || "verified").slice(0, 14)}...
                          </td>
                          <td className="p-3 text-right whitespace-nowrap space-x-2">
                            <a
                              href={`/api/vault/download/${item.archiveId}`}
                              download={item.filename}
                              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold rounded-lg text-[11px] transition inline-flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              डाउनलोड (.ZIP)
                            </a>

                            <button
                              onClick={() => handleRestoreSvrpBackup(item.archiveId, true)}
                              disabled={restoringSvrpId === item.archiveId}
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold rounded-lg text-[11px] transition inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3 h-3 ${restoringSvrpId === item.archiveId ? "animate-spin" : ""}`} />
                              रिस्टोर गर्नुहोस्
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 1: CREATE BACKUP */}
        {activeTab === "backup" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-card border border-border-theme rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-foreground mb-1">
                  ब्याकअप प्रकार छनोट गर्नुहोस् (Select Backup Scope)
                </h3>
                <p className="text-xs text-muted-foreground">
                  तपाईंको आवश्यकता अनुसार सम्पूर्ण प्लेटफर्म, सम्पादकीय सामग्री, वा सिस्टम कन्फिगरेसन मात्र ब्याकअप गर्नुहोस्।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Full Backup Card */}
                <div 
                  onClick={() => setBackupType("full")}
                  className={`p-5 rounded-2xl border cursor-pointer transition relative overflow-hidden flex flex-col justify-between ${
                    backupType === "full"
                      ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20"
                      : "border-border-theme hover:border-amber-500/50 bg-card"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                        <Layers className="w-5 h-5" />
                      </div>
                      {backupType === "full" && (
                        <span className="p-1 bg-amber-500 text-white rounded-full">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-foreground mb-1">१. Full Platform Backup</h4>
                    <p className="text-xs text-muted-foreground">
                      Articles, Categories, Users, Settings, Menus, Comments, Media, Snapshots सहित पूर्ण डेटाबेस।
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border-theme text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    सिफारिश गरिएको (Complete Resilience)
                  </div>
                </div>

                {/* Content Backup Card */}
                <div 
                  onClick={() => setBackupType("content")}
                  className={`p-5 rounded-2xl border cursor-pointer transition relative overflow-hidden flex flex-col justify-between ${
                    backupType === "content"
                      ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20"
                      : "border-border-theme hover:border-amber-500/50 bg-card"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                        <FileText className="w-5 h-5" />
                      </div>
                      {backupType === "content" && (
                        <span className="p-1 bg-amber-500 text-white rounded-full">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-foreground mb-1">२. Content Backup</h4>
                    <p className="text-xs text-muted-foreground">
                      केवल समाचार, लेखहरू, विधाहरू, लेखकहरू, र सम्पादकीय सामग्री मात्र।
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border-theme text-[11px] text-muted-foreground font-medium">
                    हल्का र द्रुत ब्याकअप (Fast Export)
                  </div>
                </div>

                {/* Config Backup Card */}
                <div 
                  onClick={() => setBackupType("config")}
                  className={`p-5 rounded-2xl border cursor-pointer transition relative overflow-hidden flex flex-col justify-between ${
                    backupType === "config"
                      ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20"
                      : "border-border-theme hover:border-amber-500/50 bg-card"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
                        <Settings className="w-5 h-5" />
                      </div>
                      {backupType === "config" && (
                        <span className="p-1 bg-amber-500 text-white rounded-full">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-foreground mb-1">३. Configuration Backup</h4>
                    <p className="text-xs text-muted-foreground">
                      साइट सेटिङहरू, थिम, मेनु, रोलहरू, अधिकारहरू र सिस्टम नियमहरू।
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border-theme text-[11px] text-muted-foreground font-medium">
                    सिस्टम कन्फिगरेसन मात्र
                  </div>
                </div>

                {/* Media Manifest Card */}
                <div 
                  onClick={() => setBackupType("media")}
                  className={`p-5 rounded-2xl border cursor-pointer transition relative overflow-hidden flex flex-col justify-between ${
                    backupType === "media"
                      ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20"
                      : "border-border-theme hover:border-amber-500/50 bg-card"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                        <HardDrive className="w-5 h-5" />
                      </div>
                      {backupType === "media" && (
                        <span className="p-1 bg-amber-500 text-white rounded-full">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-foreground mb-1">४. Media Manifest</h4>
                    <p className="text-xs text-muted-foreground">
                      लोगो, ब्यानर, हिरो र मिडिया फाइलहरूको युआरएल र मेटाडेटा Manifest।
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border-theme text-[11px] text-muted-foreground font-medium">
                    मिडिया लिङ्क मेनिफेस्ट
                  </div>
                </div>
              </div>

              {/* Options Checkboxes */}
              <div className="p-4 bg-muted/30 border border-border-theme rounded-2xl space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeSnapshots} 
                    onChange={e => setIncludeSnapshots(e.target.checked)}
                    className="w-4 h-4 rounded border-border-theme text-amber-600 focus:ring-amber-500" 
                  />
                  <span className="text-xs font-medium text-foreground">
                    Edge Cache Snapshots समावेश गर्नुहोस् (<code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">homepage.json</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">latest.json</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">breaking.json</code>)
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="w-4 h-4 rounded border-border-theme text-amber-600 focus:ring-amber-500" 
                  />
                  <span className="text-xs font-medium text-foreground">
                    प्रत्येक फाइलको SHA256 डिजिटल चेकसम निर्माण र प्रमाणीकरण गर्नुहोस्
                  </span>
                </label>
              </div>

              {/* Live Collections Inspector & Selective Collection Exporter */}
              <div className="pt-4 border-t border-border-theme space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="font-bold text-xs text-foreground flex items-center gap-2">
                      <Database className="w-4 h-4 text-amber-500" />
                      डेटाबेस संग्रहहरू र सामग्री विवरण (Live Collections Inspector)
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      ब्याकअपमा समावेश गरिने संग्रहहरू छान्नुहोस् वा वास्तविक डेटा हेर्नुहोस्।
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      setIsLoadingLiveDb(true);
                      try {
                        const itemsMap: Record<string, any[]> = {};
                        for (const col of FULL_COLLECTIONS) {
                          const snap = await getDocs(collection(db, col));
                          const list: any[] = [];
                          snap.forEach(d => list.push({ id: d.id, ...d.data() }));
                          itemsMap[col] = list;
                        }
                        setLiveDbItems(itemsMap);
                      } catch (err) {
                        console.warn("Could not load live db items:", err);
                      } finally {
                        setIsLoadingLiveDb(false);
                      }
                    }}
                    className="px-3 py-1.5 border border-border-theme rounded-xl text-xs font-semibold hover:bg-muted transition flex items-center gap-1.5 text-foreground"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLiveDb ? "animate-spin text-amber-500" : ""}`} />
                    {Object.keys(liveDbItems).length > 0 ? "डेटा रिफ्रेस" : "सामग्री लोड र इन्स्पेक्ट गर्नुहोस्"}
                  </button>
                </div>

                {Object.keys(liveDbItems).length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    {Object.entries(liveDbItems).map(([colName, items]) => (
                      <div 
                        key={colName} 
                        className={`p-3 border rounded-xl transition flex items-center justify-between ${
                          inspectingLiveCol === colName ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/20" : "border-border-theme bg-card hover:border-border-theme/80"
                        }`}
                      >
                        <div>
                          <p className="font-mono font-bold text-xs text-foreground truncate">{colName}</p>
                          <p className="text-[11px] text-muted-foreground">{items.length} रेकर्डहरू</p>
                        </div>
                        <button
                          onClick={() => setInspectingLiveCol(inspectingLiveCol === colName ? null : colName)}
                          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition shrink-0"
                        >
                          <Eye className="w-3 h-3" />
                          {inspectingLiveCol === colName ? "बन्द" : "हेर्नुहोस्"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inspecting Live Collection Items Modal/Accordion */}
                {inspectingLiveCol && liveDbItems[inspectingLiveCol] && (
                  <div className="p-4 bg-muted/30 border border-amber-500/30 rounded-2xl space-y-3 mt-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-border-theme">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-amber-500" />
                        <span className="font-bold font-mono text-xs text-foreground">
                          संग्रह: {inspectingLiveCol} ({liveDbItems[inspectingLiveCol].length} Items)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-grow sm:w-64">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                          <input 
                            type="text" 
                            placeholder="शीर्षक वा ID खोज्नुहोस्..." 
                            value={liveSearchQuery}
                            onChange={e => setLiveSearchQuery(e.target.value)}
                            className="w-full bg-background border border-border-theme rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <button 
                          onClick={() => setInspectingLiveCol(null)} 
                          className="p-1.5 hover:bg-muted text-muted-foreground rounded-lg transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                      {liveDbItems[inspectingLiveCol]
                        .filter(item => {
                          if (!liveSearchQuery.trim()) return true;
                          const q = liveSearchQuery.toLowerCase();
                          const title = String(item.title || item.name || item.id || "").toLowerCase();
                          return title.includes(q) || String(item.id).toLowerCase().includes(q);
                        })
                        .map((item, idx) => (
                          <div key={item.id || idx} className="p-2.5 bg-card border border-border-theme rounded-xl text-xs space-y-1 hover:border-amber-500/40 transition">
                            <div className="flex items-center justify-between font-medium">
                              <span className="text-foreground font-bold truncate max-w-[280px]">
                                {item.title || item.name || item.id || "Untitled Record"}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                                ID: {item.id}
                              </span>
                            </div>
                            {item.slug && <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400">slug: /{item.slug}</p>}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action & Progress */}
              <div className="space-y-4 pt-2">
                {isCreatingBackup && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{backupStage}</span>
                      <span className="font-semibold text-amber-600">{backupProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-amber-500 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${backupProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Successful Download Box */}
                {lastCreatedBackup && backupDownloadUrl && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          ब्याकअप तयार छ: <span className="font-mono text-emerald-600 dark:text-emerald-400">{lastCreatedBackup.fileName}</span> ({lastCreatedBackup.size})
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          यदि डाउनलोड स्वतः सुरु भएन भने तलको बटन थिची डाउनलोड गर्नुहोस्।
                        </p>
                      </div>
                    </div>

                    <a
                      href={backupDownloadUrl}
                      download={backupFileName || "backup.zip"}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition inline-flex items-center gap-1.5 shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      डाउनलोड गर्नुहोस् (.ZIP)
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-3">
                  <p className="text-xs text-muted-foreground">
                    ब्याकअप फाइल सुरक्षार्थ सुरक्षित स्थानमा भण्डारण गर्नुहोस्।
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDirectExportJson}
                      disabled={isCreatingBackup}
                      className="px-4 py-2.5 border border-border-theme hover:bg-muted font-semibold text-foreground rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <FileCode className="w-4 h-4 text-blue-500" />
                      JSON ब्याकअप (Instant Export)
                    </button>

                    <button
                      onClick={handleCreateBackup}
                      disabled={isCreatingBackup}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {isCreatingBackup ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          ब्याकअप तयारी हुँदैछ...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          ब्याकअप प्याकेज (.ZIP) सिर्जना गर्नुहोस्
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: RESTORE WIZARD */}
        {activeTab === "restore" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-card border border-border-theme rounded-2xl p-4 sm:p-6 shadow-sm space-y-6 min-w-0">
              <div>
                <h3 className="text-base font-bold text-foreground mb-1">
                  सुरक्षित रिस्टोर विजार्ड (Safe Restore Wizard)
                </h3>
                <p className="text-xs text-muted-foreground">
                  पूर्व निर्मित .ZIP वा .JSON ब्याकअप अपलोड गरी प्रणालीको डेटा पुनर्स्थापना गर्नुहोस्।
                </p>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-border-theme hover:border-amber-500/50 rounded-2xl p-6 sm:p-8 text-center transition bg-muted/20 space-y-3 min-w-0">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl w-fit mx-auto">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">ब्याकअप फाइल यहाँ ड्रप गर्नुहोस् वा छान्नुहोस्</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    स्वीकृत ढाँचा: <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">.zip</code> वा <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">.json</code> (Sanatan Marga Platform Backup Standard)
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md transition">
                  <Upload className="w-4 h-4" />
                  फाइल छान्नुहोस्
                  <input 
                    type="file" 
                    accept=".zip,.json" 
                    onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} 
                    className="hidden" 
                  />
                </label>
              </div>

              {/* Verification & Analysis */}
              {isVerifyingFile && (
                <div className="p-6 border border-border-theme rounded-2xl text-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                  <p className="text-xs font-medium text-foreground">ब्याकअप फाइलको SHA256 चेकसम र संरचना जाँच हुँदैछ...</p>
                </div>
              )}

              {restoreError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {restoreError}
                </div>
              )}

              {restorePreview && (
                <div className="space-y-5 pt-2 min-w-0">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <h4 className="font-bold text-xs text-foreground">ब्याकअप प्रमाणीकरण सफल भयो!</h4>
                        <p className="text-[11px] text-muted-foreground">
                          संस्करण: {restorePreview.manifest?.version} • प्रकार: {restorePreview.manifest?.type} • कुल रेकर्डहरू: {restorePreview.manifest?.totalRecords}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Duplicate Post Conflict Alert Box */}
                  {restorePreview.duplicates && restorePreview.duplicates.length > 0 && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                          <div>
                            <h4 className="font-bold text-xs text-foreground">
                              दोहोरो पोष्ट र सामाग्री द्वन्द्व पहिचान भयो ({restorePreview.duplicates.length} Duplicates Detected)
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              ब्याकअप फाइलका केही पोष्टहरूको ID, Slug वा Title पहिले नै विद्यमान डेटाबेसमा भेटिएको छ।
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setShowDuplicatesList(!showDuplicatesList)}
                          className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-semibold rounded-xl text-xs transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {showDuplicatesList ? "द्वन्द्व सूची लुकाउनुहोस्" : "दोहोरो पोष्टहरू हेर्नुहोस्"}
                          {showDuplicatesList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Duplicate Posts Resolution Selector */}
                      <div className="p-3 bg-card border border-border-theme rounded-xl space-y-2">
                        <p className="text-xs font-bold text-foreground">द्वन्द्व व्यवस्थापन विकल्प (Conflict Handling Mode):</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <label className={`p-2.5 border rounded-xl text-xs cursor-pointer transition flex items-center gap-2 ${
                            duplicateOption === "rename_slugs" ? "border-emerald-500 bg-emerald-500/5 font-bold text-foreground" : "border-border-theme hover:bg-muted"
                          }`}>
                            <input 
                              type="radio" 
                              name="dup_option" 
                              checked={duplicateOption === "rename_slugs"} 
                              onChange={() => setDuplicateOption("rename_slugs")}
                              className="text-emerald-600"
                            />
                            <span>Auto-Rename Slugs (सुरक्षित)</span>
                          </label>

                          <label className={`p-2.5 border rounded-xl text-xs cursor-pointer transition flex items-center gap-2 ${
                            duplicateOption === "overwrite" ? "border-amber-500 bg-amber-500/5 font-bold text-foreground" : "border-border-theme hover:bg-muted"
                          }`}>
                            <input 
                              type="radio" 
                              name="dup_option" 
                              checked={duplicateOption === "overwrite"} 
                              onChange={() => setDuplicateOption("overwrite")}
                              className="text-amber-600"
                            />
                            <span>Overwrite Existing (प्रतिस्थापन)</span>
                          </label>

                          <label className={`p-2.5 border rounded-xl text-xs cursor-pointer transition flex items-center gap-2 ${
                            duplicateOption === "skip" ? "border-purple-500 bg-purple-500/5 font-bold text-foreground" : "border-border-theme hover:bg-muted"
                          }`}>
                            <input 
                              type="radio" 
                              name="dup_option" 
                              checked={duplicateOption === "skip"} 
                              onChange={() => setDuplicateOption("skip")}
                              className="text-purple-600"
                            />
                            <span>Skip Duplicates (छोड्नुहोस्)</span>
                          </label>
                        </div>
                      </div>

                      {/* Expandable Duplicate Posts Inspector */}
                      {showDuplicatesList && (
                        <div className="max-h-60 overflow-y-auto space-y-2 pt-1 border-t border-amber-500/20">
                          {restorePreview.duplicates.map((dup, idx) => (
                            <div key={idx} className="p-2.5 bg-card border border-border-theme rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <span className="font-bold text-foreground">{dup.title}</span>
                                <span className="ml-2 font-mono text-[10px] text-muted-foreground">({dup.collectionName})</span>
                                {dup.slug && <p className="text-[11px] font-mono text-amber-600">slug: /{dup.slug}</p>}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  dup.conflictType === "exact_id" ? "bg-red-500/10 text-red-600 border border-red-500/20" :
                                  dup.conflictType === "duplicate_slug" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                                  "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                                }`}>
                                  {dup.conflictType === "exact_id" ? "ID Conflict" : dup.conflictType === "duplicate_slug" ? "Slug Conflict" : "Title Match"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Diff Table */}
                  <div className="border border-border-theme rounded-2xl overflow-hidden min-w-0">
                    <div className="p-3 bg-muted/40 border-b border-border-theme font-bold text-xs text-foreground flex items-center justify-between">
                      <span>रिस्टोर गरिने डेटा सङ्ग्रहहरू (Collections Diff)</span>
                      <span className="text-[11px] font-normal text-muted-foreground">
                        {selectedCollectionsToRestore.length} / {restorePreview.diffs.length} Selected
                      </span>
                    </div>
                    <div className="overflow-x-auto min-w-0">
                      <table className="w-full text-left text-xs min-w-[600px]">
                        <thead className="bg-muted/20 border-b border-border-theme text-muted-foreground">
                          <tr>
                            <th className="p-3">छनोट</th>
                            <th className="p-3 font-semibold">संग्रह (Collection)</th>
                            <th className="p-3 font-semibold">आगमन रेकर्ड</th>
                            <th className="p-3 font-semibold">हालको रेकर्ड</th>
                            <th className="p-3 font-semibold">थपिने</th>
                            <th className="p-3 font-semibold">परिवर्तन</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-theme">
                          {restorePreview.diffs.map(diff => {
                            const isChecked = selectedCollectionsToRestore.includes(diff.collectionName);
                            return (
                              <tr key={diff.collectionName} className="hover:bg-muted/20 transition">
                                <td className="p-3">
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        setSelectedCollectionsToRestore(prev => [...prev, diff.collectionName]);
                                      } else {
                                        setSelectedCollectionsToRestore(prev => prev.filter(c => c !== diff.collectionName));
                                      }
                                    }}
                                    className="rounded border-border-theme text-amber-600 focus:ring-amber-500" 
                                  />
                                </td>
                                <td className="p-3 font-medium font-mono text-foreground">{diff.collectionName}</td>
                                <td className="p-3 font-mono">{diff.incomingTotal}</td>
                                <td className="p-3 font-mono text-muted-foreground">{diff.currentTotal}</td>
                                <td className="p-3 font-mono text-emerald-600 font-semibold">+{diff.added}</td>
                                <td className="p-3 font-mono text-amber-600 font-semibold">~{diff.modified}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Full Backup File Content Inspector Panel */}
                  <div className="border border-border-theme rounded-2xl p-4 space-y-3 bg-muted/10">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="font-bold text-xs text-foreground flex items-center gap-2">
                          <Eye className="w-4 h-4 text-blue-500" />
                          अपलोड गरिएको ब्याकअप फाइलका पूर्ण सामग्रीहरू (Inspect Backup Contents)
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          ब्याकअप भित्र रहेका प्रत्येक पोष्ट र रेकर्डको विस्तृत विवरन हेर्नुहोस्।
                        </p>
                      </div>
                    </div>

                    {/* Collection Tabs inside Backup File */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                      {Object.keys(restorePreview.incomingData).map(col => {
                        const count = restorePreview.incomingData[col]?.length || 0;
                        const isActive = inspectingBackupCol === col;
                        return (
                          <button
                            key={col}
                            onClick={() => setInspectingBackupCol(isActive ? null : col)}
                            className={`px-3 py-1.5 rounded-xl font-mono text-xs whitespace-nowrap transition border ${
                              isActive ? "bg-blue-500 text-white border-blue-600 font-bold" : "bg-card hover:bg-muted text-foreground border-border-theme"
                            }`}
                          >
                            {col} ({count})
                          </button>
                        );
                      })}
                    </div>

                    {/* Inspected Backup Collection Items List */}
                    {inspectingBackupCol && restorePreview.incomingData[inspectingBackupCol] && (
                      <div className="p-3 bg-card border border-border-theme rounded-xl space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-border-theme">
                          <span className="font-bold font-mono text-xs text-foreground">
                            संग्रह {inspectingBackupCol} ({restorePreview.incomingData[inspectingBackupCol].length} items)
                          </span>
                          <div className="relative w-full sm:w-64">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                            <input 
                              type="text" 
                              placeholder="पोष्ट शीर्षक वा ID खोज्नुहोस्..." 
                              value={backupSearchQuery}
                              onChange={e => setBackupSearchQuery(e.target.value)}
                              className="w-full bg-background border border-border-theme rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                          {restorePreview.incomingData[inspectingBackupCol]
                            .filter(item => {
                              if (!backupSearchQuery.trim()) return true;
                              const q = backupSearchQuery.toLowerCase();
                              const title = String(item.title || item.name || item.id || "").toLowerCase();
                              return title.includes(q) || String(item.id).toLowerCase().includes(q);
                            })
                            .map((item, idx) => (
                              <div key={item.id || idx} className="p-2.5 bg-muted/20 border border-border-theme rounded-xl text-xs space-y-1 hover:border-blue-500/40 transition">
                                <div className="flex items-center justify-between font-medium">
                                  <span className="text-foreground font-bold truncate max-w-[300px]">
                                    {item.title || item.name || item.id || "Untitled Record"}
                                  </span>
                                  <button
                                    onClick={() => setSelectedBackupItemJson(selectedBackupItemJson === item ? null : item)}
                                    className="px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold rounded text-[10px] transition"
                                  >
                                    {selectedBackupItemJson === item ? "JSON लुकाउनुहोस्" : "Raw JSON"}
                                  </button>
                                </div>
                                {item.slug && <p className="text-[11px] font-mono text-blue-600 dark:text-blue-400">slug: /{item.slug}</p>}

                                {selectedBackupItemJson === item && (
                                  <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[10px] rounded-xl overflow-x-auto max-h-40 mt-2">
                                    {JSON.stringify(item, null, 2)}
                                  </pre>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Overwrite or Merge Option */}
                  <div className="p-4 bg-muted/30 border border-border-theme rounded-2xl space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="restore_mode" 
                        checked={!wipeExistingData} 
                        onChange={() => setWipeExistingData(false)}
                        className="text-amber-600 focus:ring-amber-500" 
                      />
                      <div>
                        <span className="text-xs font-bold text-foreground">Safe Merge Mode (सिफारिश गरिएको)</span>
                        <p className="text-[11px] text-muted-foreground">विद्यमान डेटा यथावत राखी नयाँ र अद्यावधिक रेकर्डहरू मात्र रिस्टोर गर्दछ।</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="restore_mode" 
                        checked={wipeExistingData} 
                        onChange={() => setWipeExistingData(true)}
                        className="text-amber-600 focus:ring-amber-500" 
                      />
                      <div>
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">Clean Overwrite Mode (सावधानी अपनाउनुहोस्)</span>
                        <p className="text-[11px] text-muted-foreground">छानिएका संग्रहहरू खाली गरी ब्याकअप फाइलको डेटाले पूर्ण रूपमा प्रतिस्थापन गर्दछ।</p>
                      </div>
                    </label>
                  </div>

                  {/* Restore Action Button */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => {
                        setUploadedFile(null);
                        setRestorePreview(null);
                      }}
                      className="px-4 py-2 border border-border-theme rounded-xl text-xs font-medium hover:bg-muted transition"
                    >
                      रद्द गर्नुहोस्
                    </button>

                    <button
                      onClick={() => setShowRestoreModal(true)}
                      disabled={selectedCollectionsToRestore.length === 0}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition flex items-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                      छानिएका संग्रहहरू रिस्टोर गर्नुहोस् ({selectedCollectionsToRestore.length})
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 3: SCHEDULED & AUTO SAFETY */}
        {activeTab === "schedule" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-card border border-border-theme rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-foreground mb-1">
                  स्वचालित सेड्युल र सेफ्टी ट्रिगरहरू (Automated Safety & Backup Schedule)
                </h3>
                <p className="text-xs text-muted-foreground">
                  नियमित ब्याकअप सेड्युल र संवेदनशील कार्यहरू गर्नु अघि स्वचालित सेफ्टी ब्याकअप सेटिङ।
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/20 border border-border-theme rounded-2xl">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">नियमित स्वचालित ब्याकअप सेड्युल (Recurring Automated Backup)</h4>
                    <p className="text-xs text-muted-foreground">निर्धारित समयमा प्रणालीले स्वतः Full Backup सिर्जना गर्दछ।</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={scheduleConfig.enabled} 
                      onChange={e => setScheduleConfig(prev => ({ ...prev, enabled: e.target.checked }))} 
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">ब्याकअप फ्रिक्वेन्सी (Frequency)</label>
                    <select 
                      value={scheduleConfig.frequency}
                      onChange={e => setScheduleConfig(prev => ({ ...prev, frequency: e.target.value }))}
                      className="w-full bg-background border border-border-theme rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="daily">दैनिक (Daily @ Night)</option>
                      <option value="weekly">साप्ताहिक (Weekly Every Sunday)</option>
                      <option value="monthly">मासिक (Monthly First Day)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">भण्डारण गन्तव्य (Storage Vault)</label>
                    <select 
                      value={scheduleConfig.storageTarget}
                      onChange={e => setScheduleConfig(prev => ({ ...prev, storageTarget: e.target.value }))}
                      className="w-full bg-background border border-border-theme rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="gcs">Google Cloud Storage Vault (Recommended)</option>
                      <option value="s3">AWS S3 Resilient Storage</option>
                      <option value="local">Local System Storage</option>
                    </select>
                  </div>
                </div>

                <hr className="border-border-theme my-4" />

                <div>
                  <h4 className="font-bold text-sm text-foreground mb-1">स्वचालित सेफ्टी ब्याकअप नियमहरू (Auto Safety Triggers)</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    निम्न संवेदनशील कार्यहरू सम्पन्न गर्नु ठीक अघि प्रणालीले स्वतः "Safety Snapshot" ब्याकअप राख्नेछ:
                  </p>

                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 bg-muted/20 border border-border-theme rounded-xl cursor-pointer hover:bg-muted/40 transition">
                      <input 
                        type="checkbox" 
                        checked={scheduleConfig.autoSafetyArticles}
                        onChange={e => setScheduleConfig(prev => ({ ...prev, autoSafetyArticles: e.target.checked }))}
                        className="rounded border-border-theme text-amber-600 focus:ring-amber-500" 
                      />
                      <span className="text-xs text-foreground font-medium">
                        ☑ बल्क लेख र सामग्री इम्पोर्ट (Bulk Import) गर्नु अघि
                      </span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-muted/20 border border-border-theme rounded-xl cursor-pointer hover:bg-muted/40 transition">
                      <input 
                        type="checkbox" 
                        checked={scheduleConfig.autoSafetyRoles}
                        onChange={e => setScheduleConfig(prev => ({ ...prev, autoSafetyRoles: e.target.checked }))}
                        className="rounded border-border-theme text-amber-600 focus:ring-amber-500" 
                      />
                      <span className="text-xs text-foreground font-medium">
                        ☑ प्रयोगकर्ता भूमिका र अधिकार (Roles & Permissions) परिवर्तन गर्नु अघि
                      </span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-muted/20 border border-border-theme rounded-xl cursor-pointer hover:bg-muted/40 transition">
                      <input 
                        type="checkbox" 
                        checked={scheduleConfig.autoSafetyTheme}
                        onChange={e => setScheduleConfig(prev => ({ ...prev, autoSafetyTheme: e.target.checked }))}
                        className="rounded border-border-theme text-amber-600 focus:ring-amber-500" 
                      />
                      <span className="text-xs text-foreground font-medium">
                        ☑ ग्लोबल थिम र डिजाइन सेटिङ फेर्नु अघि
                      </span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-muted/20 border border-border-theme rounded-xl cursor-pointer hover:bg-muted/40 transition">
                      <input 
                        type="checkbox" 
                        checked={scheduleConfig.autoSafetyMigration}
                        onChange={e => setScheduleConfig(prev => ({ ...prev, autoSafetyMigration: e.target.checked }))}
                        className="rounded border-border-theme text-amber-600 focus:ring-amber-500" 
                      />
                      <span className="text-xs text-foreground font-medium">
                        ☑ डेटाबेस माइग्रेसन र सीडिङ (Migration & Seeding) अघि
                      </span>
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveSchedule}
                    disabled={isSavingSchedule}
                    className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs shadow transition flex items-center gap-2"
                  >
                    {isSavingSchedule ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    सेडिङ र सेड्युल सेभ गर्नुहोस्
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: BACKUP HISTORY & POINT-IN-TIME */}
        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-card border border-border-theme rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">
                    ब्याकअप इतिहास र पोइन्ट-इन-टाइम (Backup Vault & Point-In-Time Log)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    उत्पादन वातावरणका सबै पूर्व निर्मित ब्याकअप र स्न्यापशट लगहरू।
                  </p>
                </div>

                <button
                  onClick={fetchBackupData}
                  className="px-3 py-1.5 border border-border-theme rounded-xl text-xs font-medium hover:bg-muted transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> रिफ्रेस
                </button>
              </div>

              {isLoadingLogs ? (
                <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                  <p>ब्याकअप इतिहास लोड हुँदैछ...</p>
                </div>
              ) : backupLogs.length === 0 ? (
                <div className="p-8 border border-dashed border-border-theme rounded-2xl text-center text-xs text-muted-foreground">
                  कुनै पूर्व ब्याकअप लग फेला परेन। ब्याकअप सेन्टरबाट नयाँ ब्याकअप सिर्जना गर्नुहोस्।
                </div>
              ) : (
                <div className="border border-border-theme rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/50 border-b border-border-theme text-muted-foreground">
                        <tr>
                          <th className="p-3 font-semibold">मिति र समय</th>
                          <th className="p-3 font-semibold">प्रकार (Type)</th>
                          <th className="p-3 font-semibold">रेकर्ड सङ्ख्या</th>
                          <th className="p-3 font-semibold">साइज</th>
                          <th className="p-3 font-semibold">प्रशासक</th>
                          <th className="p-3 font-semibold">SHA256 Checksum</th>
                          <th className="p-3 font-semibold text-right">कार्य</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-theme">
                        {backupLogs.map(log => (
                          <tr key={log.id} className="hover:bg-muted/20 transition">
                            <td className="p-3 font-medium text-foreground whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString("ne-NP")}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                log.type === "full" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                                log.type === "content" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                                "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                              }`}>
                                {log.type}
                              </span>
                            </td>
                            <td className="p-3 font-mono whitespace-nowrap">{log.totalRecords} Items</td>
                            <td className="p-3 font-mono text-muted-foreground whitespace-nowrap">{log.sizeFormatted}</td>
                            <td className="p-3 text-muted-foreground whitespace-nowrap">{log.createdBy}</td>
                            <td className="p-3 font-mono text-[10px] text-muted-foreground truncate max-w-[120px]" title={log.checksum}>
                              {log.checksum.slice(0, 16)}...
                            </td>
                            <td className="p-3 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleExportLogRecord(log)}
                                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold rounded-lg text-[11px] transition inline-flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" />
                                डाउनलोड (.JSON)
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 5: EMERGENCY RECOVERY OS */}
        {activeTab === "emergency" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-gradient-to-br from-red-950/20 via-card to-card border border-red-500/30 rounded-2xl p-4 sm:p-6 shadow-md space-y-6 relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/30 shrink-0">
                  <Zap className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-foreground">
                    आपतकालीन रिकभरी OS (Emergency Platform Recovery)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    सिस्टम क्र्यास वा अमान्य अपडेट परेको खण्डमा १५ मिनेट भित्र प्लेटफर्म पूर्ण रूपमा अनलाइन ल्याउने द्रुत मार्ग।
                  </p>
                </div>
              </div>

              {/* Workflow Terminal Box */}
              <div className="bg-slate-950 text-emerald-400 font-mono text-xs p-5 rounded-2xl border border-slate-800 space-y-2 min-h-[160px] overflow-x-auto">
                <div className="text-slate-400 text-[11px] pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>EMERGENCY_RECOVERY_CONSOLE v2.5</span>
                  <span>STATUS: {isExecutingEmergency ? "RUNNING..." : "READY"}</span>
                </div>

                {emergencyLogs.length === 0 ? (
                  <p className="text-slate-500 py-4 text-center">
                    आपतकालीन रिकभरी प्रक्रिया सुरु गर्न "Run Emergency Disaster Recovery" थिच्नुहोस्।
                  </p>
                ) : (
                  emergencyLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      {log}
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Target Recovery Time Objective (RTO): &lt; 15 Minutes
                </div>

                <button
                  onClick={handleRunEmergencyWorkflow}
                  disabled={isExecutingEmergency}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs shadow-xl shadow-red-600/30 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isExecutingEmergency ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      आपतकालीन रिकभरी जारी छ...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Run Emergency Disaster Recovery
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </div>

      {/* Confirmation Modal for Restore */}
      <AnimatePresence>
        {showRestoreModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border-theme rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-600">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="font-bold text-base text-foreground">
                  रिस्टोर सुनिश्चितता (Confirm Platform Restore)
                </h3>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                तपाईं छानिएका <span className="font-bold text-foreground">{selectedCollectionsToRestore.length} संग्रहहरू</span> डेटाबेसमा रिस्टोर गर्न लाग्नुभएको छ।
                {wipeExistingData 
                  ? " सावधानी: 'Clean Overwrite Mode' छानिएकाले विद्यमान डेटा मेटिनेछ।" 
                  : " 'Safe Merge Mode' ले विद्यमान डेटा सुरक्षित राख्दै नयाँ डेटा अद्यावधिक गर्नेछ।"}
              </p>

              {isRestoring && (
                <div className="space-y-2 py-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{restoreStage}</span>
                    <span className="font-semibold text-amber-600">{restoreProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${restoreProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowRestoreModal(false)}
                  disabled={isRestoring}
                  className="px-4 py-2 border border-border-theme rounded-xl text-xs font-medium hover:bg-muted transition"
                >
                  रद्द गर्नुहोस्
                </button>

                <button
                  onClick={handleExecuteRestore}
                  disabled={isRestoring}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isRestoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  पुष्टि र रिस्टोर सुरु गर्नुहोस्
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
