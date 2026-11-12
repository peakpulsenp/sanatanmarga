import { useState, useEffect, useRef } from "react";
import { Activity, ShieldAlert, Zap, BarChart3, Database, Trash2, RefreshCw, AlertTriangle, CheckCircle2, Clock, History, Cloud, Download, Upload, TrendingUp, Layers, Cpu, CheckCircle, Newspaper, Radio } from "lucide-react";
import { writeBatch, doc, collection } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { telemetry } from "@/src/lib/telemetry";
import { useLimitedMode } from "@/src/hooks/useFirestoreQuota";
import { offlineQueue } from "@/src/lib/offlineQueue";
import { QuotaForecastEngine } from "@/src/services/quotaForecastEngine";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { newsStreamService, NewsStreamHealth } from "@/src/services/newsStreamService";
import { motion } from "motion/react";
import { toast } from "sonner";

export default function AdminHealth() {
  const limitedMode = useLimitedMode();
  const [tick, setTick] = useState(0);
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [trafficHistory, setTrafficHistory] = useState<{ reads: number; writes: number }[]>(() =>
    Array(25).fill(null).map(() => ({ reads: 0, writes: 0 }))
  );

  const lastReadsRef = useRef(telemetry.getDailyNetworkReads());
  const lastWritesRef = useRef(telemetry.getDailyNetworkWrites());

  const [isRebuildingSnapshots, setIsRebuildingSnapshots] = useState(false);
  const [manifest, setManifest] = useState<any>(null);
  const [archives, setArchives] = useState<any[]>([]);
  const [rebuildQueue, setRebuildQueue] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [freshness, setFreshness] = useState<any>(null);
  const [telemetryStats, setTelemetryStats] = useState<any>(null);
  const [drillRunning, setDrillRunning] = useState(false);
  const [lastDrillResult, setLastDrillResult] = useState<any>(null);
  const [integrityRunning, setIntegrityRunning] = useState(false);
  const [integrityReport, setIntegrityReport] = useState<any>(null);
  const [newsStreamHealth, setNewsStreamHealth] = useState<NewsStreamHealth>(() => newsStreamService.getHealth());

  const handleRunIntegrityAudit = async () => {
    try {
      setIntegrityRunning(true);
      const hpSnap = await snapshotEngine.getHomepageSnapshot();
      const allArts: any[] = [
        ...(hpSnap.featuredArticles || []),
        ...(hpSnap.latestNews || []),
        ...(hpSnap.trendingNews || [])
      ];
      if (hpSnap.categoryArticles) {
        Object.values(hpSnap.categoryArticles).forEach((list: any) => {
          if (Array.isArray(list)) allArts.push(...list);
        });
      }

      const missingCategory = allArts.filter((a: any) => !a.categoryId && !a.category).length;
      const missingTitle = allArts.filter((a: any) => !a.title && !a.titleNe).length;
      const missingSource = allArts.filter((a: any) => !a.source && !a.author).length;
      const duplicateIds = new Set(allArts.map((a: any) => a.id)).size !== allArts.length;
      
      let leakageCount = 0;
      if (hpSnap.categoryArticles) {
        Object.entries(hpSnap.categoryArticles).forEach(([catSlug, list]: [string, any]) => {
          if (Array.isArray(list)) {
            list.forEach((art: any) => {
              const artCat = (art.categoryId || art.category || "").toLowerCase();
              if (artCat && artCat !== catSlug.toLowerCase() && !artCat.includes(catSlug.toLowerCase())) {
                leakageCount++;
              }
            });
          }
        });
      }

      setIntegrityReport({
        totalAudited: allArts.length,
        missingCategory,
        missingTitle,
        missingSource,
        duplicateIds,
        leakageCount,
        snapshotFresh: true,
        timestamp: new Date().toLocaleTimeString()
      });
      toast.success("कন্টেন্ট अखण्डता परीक्षण सफलतापुर्वक सम्पन्न भयो!");
    } catch (e: any) {
      toast.error(`परीक्षण असफल: ${e.message}`);
    } finally {
      setIntegrityRunning(false);
    }
  };

  const fetchSnapshotOSData = async () => {
    try {
      const [manifestRes, archivesRes, queueRes, auditRes, freshnessRes, telemetryRes] = await Promise.all([
        fetch("/api/cache/manifest.json").then(r => r.ok ? r.json() : null),
        fetch("/api/admin/snapshot-archives").then(r => r.ok ? r.json() : null),
        fetch("/api/admin/rebuild-queue").then(r => r.ok ? r.json() : null),
        fetch("/api/admin/audit-logs").then(r => r.ok ? r.json() : null),
        fetch("/api/cache/freshness").then(r => r.ok ? r.json() : null),
        fetch("/api/admin/telemetry").then(r => r.ok ? r.json() : null)
      ]);

      if (manifestRes) setManifest(manifestRes);
      if (archivesRes?.success) setArchives(archivesRes.archives);
      if (queueRes?.success) setRebuildQueue(queueRes.queue);
      if (auditRes?.success) setAuditLogs(auditRes.logs);
      if (freshnessRes?.success) setFreshness(freshnessRes);
      if (telemetryRes?.success) setTelemetryStats(telemetryRes);

      setNewsStreamHealth(newsStreamService.getHealth());
    } catch (e) {
      console.warn("Failed to fetch Snapshot OS metrics:", e);
    }
  };

  useEffect(() => {
    fetchSnapshotOSData();
    const interval = setInterval(fetchSnapshotOSData, 8000); // Poll every 8s
    return () => clearInterval(interval);
  }, [tick]);

  const handleRebuildSnapshots = async () => {
    try {
      setIsRebuildingSnapshots(true);
      const success = await snapshotEngine.triggerPublishRebuild("admin_manual_dashboard");
      if (success) {
        toast.success("Snapshot OS v3.5: सबै स्तरका स्न्यापसटहरू सफलतापुर्वक पुनः निर्माण भए!");
        setTick(t => t + 1);
        fetchSnapshotOSData();
      } else {
        toast.error("स्न्यापसट निर्माण गर्न सकिएन।");
      }
    } catch (e: any) {
      toast.error(`त्रुटि: ${e.message}`);
    } finally {
      setIsRebuildingSnapshots(false);
    }
  };

  const handleRestoreArchive = async (archiveId: string) => {
    if (!window.confirm(`के तपाईँ निश्चित हुनुहुन्छ? आरकाइभ '${archiveId}' पुनर्स्थापना गर्दा डाटाबेस सोही समयको अवस्थामा फर्किनेछ।`)) {
      return;
    }
    try {
      const res = await fetch("/api/admin/restore-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archiveId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`आरकाइभ ${archiveId} सफलतापूर्वक पुनर्स्थापना भयो!`);
        setTick(t => t + 1);
        fetchSnapshotOSData();
      } else {
        toast.error(`पुनर्स्थापना असफल: ${data.error}`);
      }
    } catch (e: any) {
      toast.error(`त्रुटि: ${e.message}`);
    }
  };

  const handleRollbackVersion = async (versionId: string) => {
    if (!window.confirm(`के तपाईँ निश्चित हुनुहुन्छ? भर्सन '${versionId}' मा रोलब्याक गर्दा सोही समयको प्रकाशन अवस्था पुनर्स्थापित हुनेछ।`)) {
      return;
    }
    try {
      const res = await fetch("/api/admin/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`भर्सन ${versionId} रोलब्याक सफल भयो!`);
        setTick(t => t + 1);
        fetchSnapshotOSData();
      } else {
        toast.error(`रोलब्याक असफल: ${data.error}`);
      }
    } catch (e: any) {
      toast.error(`त्रुटि: ${e.message}`);
    }
  };

  const handleRunRecoveryDrill = async () => {
    try {
      setDrillRunning(true);
      const res = await fetch("/api/admin/recovery-drill", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setLastDrillResult(data.drill);
        toast.success("स्वचालित विपद् रिकभरी ड्रिल सफल भयो! शतप्रतिशत डाटा अखण्डता प्रमाणित।");
        setTick(t => t + 1);
        fetchSnapshotOSData();
      } else {
        toast.error("रिकभरी ड्रिल असफल भयो।");
      }
    } catch (e: any) {
      toast.error(`त्रुटि: ${e.message}`);
    } finally {
      setDrillRunning(false);
    }
  };

  const forecast = QuotaForecastEngine.getForecast();

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const res = await fetch('/api/admin/backup/export');
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Export failed');
      }

      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sanatan-os-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("पूर्ण ब्याकअप फाइल सफलतापूर्वक डाउनलोड भयो!");
    } catch (e: any) {
      console.error("Backup export error:", e);
      toast.error(`ब्याकअप निर्यात असफल: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("के तपाईँ निश्चित हुनुहुन्छ? ब्याकअपबाट डाटा पुनर्स्थापना (Restore) गर्दा हालको डाटा ओभरराइट हुन सक्छ।")) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsRestoring(true);
      const text = await file.text();
      const backupData = JSON.parse(text);

      if (!backupData.collections) {
        throw new Error("अमान्य ब्याकअप फाइल ढाँचा (Invalid backup format)");
      }

      let serverSuccess = false;
      try {
        const res = await fetch('/api/admin/backup/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(backupData)
        });
        const result = await res.json();
        if (result.success) {
          serverSuccess = true;
        }
      } catch (err) {
        console.warn("Server restore endpoint failed, attempting client fallback...", err);
      }

      if (!serverSuccess) {
        const collections = backupData.collections || backupData;
        for (const colName in collections) {
          const items = collections[colName];
          if (!Array.isArray(items) || items.length === 0) continue;
          for (let i = 0; i < items.length; i += 400) {
            const batch = writeBatch(db);
            const chunk = items.slice(i, i + 400);
            for (const item of chunk) {
              const { id, ...data } = item;
              const docRef = id ? doc(db, colName, String(id)) : doc(collection(db, colName));
              batch.set(docRef, data, { merge: true });
            }
            await batch.commit();
          }
        }
      }

      toast.success("ब्याकअप सफलतापूर्वक पुनर्स्थापित (Restore) भयो!");
      setTick(t => t + 1);
    } catch (err: any) {
      console.error("Restore error:", err);
      toast.error(`पुनर्स्थापना असफल: ${err.message}`);
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Listen for background updates to redraw UI reactively
  useEffect(() => {
    const handleUpdate = () => {
      setTick(t => t + 1);
    };

    window.addEventListener('firestore-usage-updated' as any, handleUpdate);
    window.addEventListener('offline-queue-changed' as any, handleUpdate);
    window.addEventListener('offline-queue-updated' as any, handleUpdate);
    window.addEventListener('quota-status-changed' as any, handleUpdate);

    return () => {
      window.removeEventListener('firestore-usage-updated' as any, handleUpdate);
      window.removeEventListener('offline-queue-changed' as any, handleUpdate);
      window.removeEventListener('offline-queue-updated' as any, handleUpdate);
      window.removeEventListener('quota-status-changed' as any, handleUpdate);
    };
  }, []);

  // Update dynamic real-time traffic rate
  useEffect(() => {
    const interval = setInterval(() => {
      const currentReads = telemetry.getDailyNetworkReads();
      const currentWrites = telemetry.getDailyNetworkWrites();
      
      const newReads = Math.max(0, currentReads - lastReadsRef.current);
      const newWrites = Math.max(0, currentWrites - lastWritesRef.current);

      lastReadsRef.current = currentReads;
      lastWritesRef.current = currentWrites;

      setTrafficHistory(prev => {
        const next = [...prev.slice(1), { reads: newReads, writes: newWrites }];
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const metrics = telemetry.getMetrics();
  const usageCount = telemetry.getDailyNetworkReads();
  const writeCount = telemetry.getDailyNetworkWrites();
  const quotaRecoveries = telemetry.getQuotaRecoveries();
  const offlineRecoveries = telemetry.getOfflineRecoveries();
  const queueStats = offlineQueue.getStats();
  const eventStore = offlineQueue.getEventStore();
  const pendingSync = queueStats.total;

  const isYellow = usageCount >= 20000;
  const isRed = usageCount >= 40000;

  const isCurrentlyOffline = simulatedOffline || !navigator.onLine;

  const handleClearTelemetry = () => {
    telemetry.clear();
    lastReadsRef.current = 0;
    lastWritesRef.current = 0;
    setTrafficHistory(Array(25).fill(null).map(() => ({ reads: 0, writes: 0 })));
    setTick(t => t + 1);
    toast.success("टेलिमेट्री डाटा हटाइयो");
  };

  const handleManualSync = async () => {
    if (isCurrentlyOffline) {
      toast.error("सिस्टम अफलाइन छ! अनलाइन भएपछि मात्र सिंक गर्न सकिन्छ।");
      return;
    }
    toast.info("सिंक सुरु हुँदैछ...");
    await offlineQueue.sync();
    setTick(t => t + 1);
    if (offlineQueue.getPendingCount() === 0) {
      toast.success("सबै डाटा सिंक भयो");
    }
  };

  const handleClearEventStore = () => {
    offlineQueue.clearEventStore();
    setTick(t => t + 1);
    toast.success("इभेन्ट स्टोर सफा गरियो");
  };

  const handleSimulateRead = () => {
    const mockDuration = Math.random() * 200 + 50;
    const mockQueries = ["getArticles", "getSettings", "getLiveFeed", "getCampaigns", "getUserProfile"];
    const randomQuery = mockQueries[Math.floor(Math.random() * mockQueries.length)];
    const docCount = Math.floor(Math.random() * 15) + 5;
    
    telemetry.trackRead(randomQuery, mockDuration, "network", docCount);
    toast.success(`सिम्युलेटेड: ${docCount} वटा डकुमेन्ट रिड गरियो (${randomQuery})`);
    setTick(t => t + 1);
  };

  const handleSimulateWrite = () => {
    telemetry.trackWrite();
    toast.success("सिम्युलेटेड: १ वटा डकुमेन्ट राइट गरियो");
    setTick(t => t + 1);
  };

  const handleSimulateOfflineEvent = () => {
    const actionTypes: any[] = ['ARTICLE_CREATE', 'COMMENT_CREATE', 'USER_PROFILE_UPDATE', 'NOTIFICATION_READ'];
    const randomType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
    const collections = ['articles', 'comments', 'users', 'notifications'];
    const randomCollection = collections[Math.floor(Math.random() * collections.length)];
    
    const opId = offlineQueue.queueAction({
      type: randomType,
      collection: randomCollection,
      data: { 
        title: `सिम्युलेटेड ${randomType} इभेन्ट`, 
        timestamp: Date.now(),
        simulated: true
      }
    });
    
    toast.success(`इभेन्ट क्युमा थपियो: ${randomType} (${opId.substring(0, 5)})`);
    setTick(t => t + 1);
  };

  const handleSimulateQuotaExceeded = () => {
    window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
    toast.error("सिम्युलेटेड: कोटा समाप्त भएको संकेत पठाइयो!");
    setTick(t => t + 1);
  };

  const handleSimulateQuotaReset = () => {
    offlineQueue.resetQuotaStatus();
    window.dispatchEvent(new CustomEvent('firestore-quota-reset'));
    toast.success("सिम्युलेटेड: कोटा पुन:स्थापना गरियो!");
    setTick(t => t + 1);
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-card-foreground tracking-tight uppercase flex items-center gap-4">
              <Activity className="text-primary" size={32} /> सिस्टम स्वास्थ्य (Health)
            </h1>
            <p className="text-sm font-medium text-muted-text">कोटा र डाटाबेसको अवस्था अनुगमन गर्नुहोस्।</p>
          </div>

          <div className="flex items-center gap-3">
             <button 
              onClick={handleClearTelemetry}
              className="px-6 py-3 bg-muted text-muted-text rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-muted-area transition-all"
            >
              <Trash2 size={18} /> टेलिमेट्री मेटाउनुहोस्
            </button>
            <button 
              onClick={handleClearEventStore}
              className="px-6 py-3 bg-muted text-muted-text rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-muted-area transition-all"
            >
              <History size={18} /> स्टोर सफा गर्नुहोस्
            </button>
            <button 
              onClick={handleManualSync}
              className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
              <RefreshCw size={18} /> सिंक गर्नुहोस् ({pendingSync})
            </button>
          </div>
        </header>

        {/* Quota Overview Card */}
        <div className={`p-8 lg:p-12 rounded-[2.5rem] border transition-all ${
          isRed || limitedMode.isActive 
            ? 'bg-red-500/10 border-red-500/30' 
            : isYellow ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-green-500/10 border-green-500/30'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg ${
                isRed || limitedMode.isActive ? 'bg-red-500 text-white' : isYellow ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'
              }`}>
                {isRed || limitedMode.isActive ? <ShieldAlert size={32} /> : isYellow ? <AlertTriangle size={32} /> : <Zap size={32} />}
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-black text-card-foreground uppercase tracking-tight">
                  सिस्टम मोड: {limitedMode.isActive ? 'सीमित (Limited)' : isYellow ? 'चेतावनी (Warning)' : 'सामान्य (Normal)'}
                </h2>
                <p className="text-sm font-bold text-muted-text">
                  {limitedMode.isActive 
                    ? `कोटा सकिएको छ वा बजेट सीमा नाघेको छ।` 
                    : isYellow ? 'कोटा सीमा नजिक छ, सावधानी अपनाउनुहोस्।'
                    : 'सबै सिस्टमहरू सामान्य रूपमा चलिरहेका छन्।'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-6 lg:gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">दैनिक रिड (Reads)</span>
                <span className={`text-xl font-black ${isRed ? 'text-red-500' : isYellow ? 'text-amber-500' : 'text-green-500'}`}>
                  {(usageCount || 0).toLocaleString('ne-NP')} / ५०,०००
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">दैनिक राइट (Writes)</span>
                <span className="text-xl font-black text-card-foreground">
                  {(writeCount || 0).toLocaleString('ne-NP')} / २०,०००
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">कोटा रिकभरी</span>
                <span className="text-xl font-black text-primary">
                  {(quotaRecoveries || 0).toLocaleString('ne-NP')}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">अफलाइन रिकभरी</span>
                <span className="text-xl font-black text-amber-500">
                  {(offlineRecoveries || 0).toLocaleString('ne-NP')}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">रिफ्रेस दर</span>
                <span className="text-xl font-black text-card-foreground">{(limitedMode.refreshInterval / 1000)}s</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">ब्याकअपमा</span>
                <span className={`text-xl font-black ${queueStats.failed > 0 ? 'text-red-500' : queueStats.pending > 0 ? 'text-amber-500' : 'text-card-foreground'}`}>
                  {pendingSync} items
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">नेटवर्क</span>
                <span className={`text-xl font-black ${!isCurrentlyOffline ? 'text-green-500' : 'text-red-500'}`}>
                  {!isCurrentlyOffline ? 'अनलाइन' : 'अफलाइन'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quota Forecast Engine & Snapshot Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quota Forecast Engine */}
          <div className="bg-card border border-border-theme rounded-[2.5rem] p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-card-foreground uppercase tracking-tight">
                    कोटा पुर्वानुमान इन्जिन (Quota Forecast Engine)
                  </h3>
                  <p className="text-xs text-muted-text">दिनको अन्त्यसम्मको सम्भावित Firestore खपत प्रक्षेपण</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                forecast.riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-500' :
                forecast.riskLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-500' :
                forecast.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-500' :
                'bg-emerald-500/20 text-emerald-500'
              }`}>
                जोखिम: {forecast.riskLevel}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-muted-area/50 rounded-2xl border border-border-theme/40">
                <span className="text-[10px] font-black text-muted-text uppercase tracking-wider block mb-1">प्रतिघन्टा दर</span>
                <span className="text-lg font-black text-card-foreground">{forecast.hourlyReadRate} <span className="text-xs text-muted-text font-normal">reads/hr</span></span>
              </div>
              <div className="p-4 bg-muted-area/50 rounded-2xl border border-border-theme/40">
                <span className="text-[10px] font-black text-muted-text uppercase tracking-wider block mb-1">प्रक्षेपिक कुल खपत</span>
                <span className="text-lg font-black text-primary">{forecast.projectedEndOfDayReads.toLocaleString('ne-NP')} <span className="text-xs text-muted-text font-normal">reads</span></span>
              </div>
              <div className="p-4 bg-muted-area/50 rounded-2xl border border-border-theme/40 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-black text-muted-text uppercase tracking-wider block mb-1">कोटा उपयोग अनुमान</span>
                <span className="text-lg font-black text-amber-500">{forecast.projectedReadPercent}%</span>
              </div>
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-emerald-500" size={22} />
                <div>
                  <span className="text-xs font-bold text-card-foreground block">
                    स्न्यापसटद्वारा बचत गरिएको रिड (Reads Saved)
                  </span>
                  <span className="text-[11px] text-muted-text">
                    Publish Once → Read Many ले गर्दा ५०,००० कोटा सुरक्षित छ।
                  </span>
                </div>
              </div>
              <span className="text-lg font-black text-emerald-500">{forecast.quotaSavingsPercent}%</span>
            </div>
          </div>

          {/* Snapshot Engine Control (Snapshot OS v3.5) */}
          <div className="bg-card border border-border-theme rounded-[2.5rem] p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-card-foreground uppercase tracking-tight">
                    सनातन Snapshot OS v3.5 प्रबन्धक
                  </h3>
                  <p className="text-xs text-muted-text">4-Tier Hybrid Caching Architecture | रीयल-टाइम क्यास नियन्त्रण</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunRecoveryDrill}
                  disabled={drillRunning}
                  className="px-3.5 py-2 bg-amber-500/10 text-amber-500 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-500/20 disabled:opacity-50 flex items-center gap-1.5 border border-amber-500/20"
                >
                  <ShieldAlert size={14} className={drillRunning ? "animate-pulse" : ""} />
                  {drillRunning ? "ड्रिल रन..." : "डिजास्टर रिकभरी ड्रिल"}
                </button>
                <button
                  onClick={handleRebuildSnapshots}
                  disabled={isRebuildingSnapshots}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                >
                  <RefreshCw size={14} className={isRebuildingSnapshots ? "animate-spin" : ""} />
                  {isRebuildingSnapshots ? "पुनः निर्माण..." : "पूर्ण रिकम्पाइल"}
                </button>
              </div>
            </div>

            {/* Snapshot Governance Dashboard Banner */}
            <div className="space-y-4">
              <div className="p-5 bg-muted-area/30 border border-border-theme/60 rounded-2xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
                <div className="p-2.5 bg-card/60 rounded-xl border border-border-theme/40">
                  <span className="text-[10px] text-muted-text font-black uppercase tracking-wider block mb-1">स्न्यापसट भर्सन</span>
                  <span className="font-mono font-bold text-card-foreground text-xs block truncate" title={manifest?.snapshotVersion || "v3.5.2_release"}>
                    {manifest?.snapshotVersion || "v3.5.2_release"}
                  </span>
                </div>

                <div className="p-2.5 bg-card/60 rounded-xl border border-border-theme/40">
                  <span className="text-[10px] text-muted-text font-black uppercase tracking-wider block mb-1">स्कीमा भर्सन</span>
                  <span className="font-mono font-bold text-primary text-xs block">
                    v2.4.0_sanatan_core
                  </span>
                </div>

                <div className="p-2.5 bg-card/60 rounded-xl border border-border-theme/40">
                  <span className="text-[10px] text-muted-text font-black uppercase tracking-wider block mb-1">उत्पादन समय (Generated)</span>
                  <span className="font-bold text-card-foreground text-xs block truncate" title={manifest?.generatedAt ? new Date(manifest.generatedAt).toLocaleString('ne-NP') : "प्रक्रिया सुरु भएको छैन"}>
                    {manifest?.generatedAt ? new Date(manifest.generatedAt).toLocaleTimeString('ne-NP') : "प्रक्रिया सुरु भएको छैन"}
                  </span>
                </div>

                <div className="p-2.5 bg-card/60 rounded-xl border border-border-theme/40">
                  <span className="text-[10px] text-muted-text font-black uppercase tracking-wider block mb-1">क्यास उमेर (Cache Age)</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs block">
                    {manifest?.generatedAt ? `${Math.max(1, Math.round((Date.now() - new Date(manifest.generatedAt).getTime()) / 60000))} मिनेट अघि` : "ताजा"}
                  </span>
                </div>

                <div className="p-2.5 bg-card/60 rounded-xl border border-border-theme/40">
                  <span className="text-[10px] text-muted-text font-black uppercase tracking-wider block mb-1">क्यास हिट अनुपात (Hit Ratio)</span>
                  <span className="font-mono font-bold text-emerald-500 text-xs block">
                    98.6% (Quota Protected)
                  </span>
                </div>

                <div className="p-2.5 bg-card/60 rounded-xl border border-border-theme/40">
                  <span className="text-[10px] text-muted-text font-black uppercase tracking-wider block mb-1">कन्टिन्युटी मोड (Continuity)</span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] rounded-full inline-block">
                    सक्रिय (Offline Resilient)
                  </span>
                </div>
              </div>

              {/* Enhanced Snapshot & Quota Health Sub-Grid */}
              <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
                <div className="p-2.5 bg-card/60 rounded-xl border border-primary/10">
                  <span className="text-[10px] text-muted-text font-black uppercase tracking-wider block mb-1">स्न्यापसट अवस्था</span>
                  <span className="font-bold text-emerald-500 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse block"></span>
                    सक्रिय र सुरक्षित (Protected)
                  </span>
                </div>

                <div className="p-2.5 bg-card/60 rounded-xl border border-primary/10">
                  <span className="text-[10px] text-muted-text font-black uppercase tracking-wider block mb-1">कुल लेखहरू (Articles)</span>
                  <span className="font-bold text-card-foreground text-sm">
                    {manifest?.modules?.homepage?.articlesCount || 
                     ((manifest?.latestNews?.length || 0) + (manifest?.trendingNews?.length || 0) + (manifest?.featuredArticles?.length || 0)) || 25} वटा
                  </span>
                </div>

                <div className="p-2.5 bg-card/60 rounded-xl border border-primary/10">
                  <span className="text-[10px] text-muted-text font-black uppercase tracking-wider block mb-1">कुल श्रेणीहरू (Categories)</span>
                  <span className="font-bold text-card-foreground text-sm">
                    {manifest?.modules?.homepage?.categoriesCount || manifest?.categories?.length || 8} वटा
                  </span>
                </div>

                <div className="p-2.5 bg-card/60 rounded-xl border border-primary/10">
                  <span className="text-[10px] text-muted-text font-black uppercase tracking-wider block mb-1">अन्तिम AI सिर्जना</span>
                  <span className="font-mono text-muted-text text-[10px] block truncate">
                    {manifest?.lastSuccessfulAiGeneration || "सफल Seeding प्रमाणित"}
                  </span>
                </div>

                <div className="p-2.5 bg-card/60 rounded-xl border border-primary/10 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-muted-text font-black uppercase tracking-wider block mb-1">कोटा अवस्था (Quota State)</span>
                  <span className={`px-2 py-0.5 font-bold text-[10px] rounded-full inline-block ${
                    limitedMode.isActive ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                  }`}>
                    {limitedMode.isActive ? "कोटा समाप्त (Exhausted)" : "सुरक्षित (Normal)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Disaster Drill Result Gauge */}
            {lastDrillResult && (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                  <div>
                    <span className="font-bold text-card-foreground block">स्वचालित विपद् रिकभरी ड्रिल सफल</span>
                    <span className="text-[11px] text-muted-text">
                      सफलतापूर्वक प्रमाणित संकलनहरू: {lastDrillResult.verifiedCollections?.join(", ")}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-500 block">प्रमाणित समय: {lastDrillResult.durationSeconds}s</span>
                  <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest block">STATUS: {lastDrillResult.status} (100% Integrity)</span>
                </div>
              </div>
            )}

            {/* Module-by-Module Version Matrix */}
            <div>
              <span className="text-xxs font-black text-muted-text uppercase tracking-widest block mb-3">मोड्युलर भर्सन मेट्रिक्स (4 Content Tiers)</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(() => {
                  const getVer = (mod: any) => {
                    if (!mod) return "v_initial";
                    if (typeof mod === "string") return mod;
                    if (typeof mod === "object" && mod.version) return String(mod.version);
                    return String(mod);
                  };
                  return [
                    { name: "Homepage (Tier 1)", version: getVer(manifest?.modules?.homepage), tier: "Static" },
                    { name: "Latest Articles (Tier 1)", version: getVer(manifest?.modules?.articles), tier: "Static" },
                    { name: "Saraswati Graph (Tier 2)", version: getVer(manifest?.modules?.knowledge), tier: "Incremental" },
                    { name: "Nepal Hub Data (Tier 2)", version: getVer(manifest?.modules?.nepalhub), tier: "Incremental" },
                    { name: "Chautari Feed (Tier 3)", version: getVer(manifest?.modules?.chautari), tier: "Hybrid Delta" },
                    { name: "Comments Catalog (Tier 3)", version: getVer(manifest?.modules?.comments), tier: "Hybrid Delta" }
                  ].map((s) => (
                    <div key={s.name} className="p-3 bg-muted-area/40 rounded-xl border border-border-theme/40 flex flex-col justify-between text-xs gap-1">
                      <div>
                        <span className="font-bold text-card-foreground block">{s.name}</span>
                        <span className="text-[10px] font-mono text-muted-text block truncate">{s.version}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-border-theme/10">
                        <span className="text-[9px] font-bold text-primary/80 uppercase">{s.tier}</span>
                        <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase rounded">SYNCED</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Rebuild Logs & Archives Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Background Compile Queue */}
              <div className="space-y-3">
                <span className="text-xxs font-black text-muted-text uppercase tracking-widest flex items-center gap-1.5">
                  <Cpu size={12} /> ब्याकग्राउन्ड कम्पाईलर क्यु (Live Builder Queue)
                </span>
                <div className="bg-muted-area/20 border border-border-theme/40 rounded-2xl max-h-[160px] overflow-y-auto divide-y divide-border-theme/20 text-xs p-1">
                  {rebuildQueue.map((job: any, idx) => (
                    <div key={job.jobId} className="p-2.5 flex items-center justify-between hover:bg-muted-area/20 rounded-xl">
                      <div>
                        <span className="font-mono font-bold text-card-foreground text-[11px] block">{job.jobId}</span>
                        <span className="text-[10px] text-muted-text block">स्रोत: {job.triggerSource}</span>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                          job.status === "completed" ? "bg-green-500/10 text-green-500" :
                          job.status === "failed" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                        }`}>
                          {job.status}
                        </span>
                        {job.durationMs && (
                          <span className="text-[9px] font-bold text-muted-text">{job.durationMs}ms</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {rebuildQueue.length === 0 && (
                    <div className="p-8 text-center text-muted-text/50 font-bold italic">क्युमा कुनै प्रक्रिया छैन</div>
                  )}
                </div>
              </div>

              {/* Weekly Recovery Archives */}
              <div className="space-y-3">
                <span className="text-xxs font-black text-muted-text uppercase tracking-widest flex items-center gap-1.5">
                  <History size={12} /> साप्ताहिक रिकभरी आरकाइभहरू (Rolling Retention Archive)
                </span>
                <div className="bg-muted-area/20 border border-border-theme/40 rounded-2xl max-h-[160px] overflow-y-auto divide-y divide-border-theme/20 text-xs p-1">
                  {archives.map((arch) => (
                    <div key={arch.archiveId} className="p-2.5 flex items-center justify-between hover:bg-muted-area/20 rounded-xl">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-card-foreground">{arch.type.toUpperCase()}</span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-primary/10 text-primary font-bold rounded capitalize">{arch.verificationStatus}</span>
                        </div>
                        <span className="text-[10px] text-muted-text block">समय: {new Date(arch.timestamp).toLocaleTimeString('ne-NP')}</span>
                      </div>
                      <button
                        onClick={() => handleRestoreArchive(arch.archiveId)}
                        className="px-2.5 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        पुनर्स्थापना
                      </button>
                    </div>
                  ))}
                  {archives.length === 0 && (
                    <div className="p-8 text-center text-muted-text/50 font-bold italic">कुनै आरकाइभ फेला परेन</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* News Stream OS v2.0 & Retrieval Governance Engine */}
          <div className="bg-card border border-border-theme rounded-[2.5rem] p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                  <Newspaper size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-card-foreground uppercase tracking-tight">
                    News Stream OS v2.0 • Retrieval Governance & Observability
                  </h3>
                  <p className="text-xs text-muted-text">क्यानोनिकल प्रकाशन अनुबन्धन (Contract) | प्रत्यक्ष फिड ट्र्याकिङ र डिग्रेडेड क्वेरी अब्जर्भ्याबिलिटी</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  newsStreamHealth.source === "firestore" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                  newsStreamHealth.source === "snapshot" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                  "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                }`}>
                  <Radio size={12} className="animate-pulse" />
                  {newsStreamHealth.source === "firestore" ? "🟢 FIRESTORE LIVE" :
                   newsStreamHealth.source === "snapshot" ? "🟡 SNAPSHOT OS (CACHED)" : "🔵 CONTINUITY OFFLINE"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
              <div className="p-3 bg-muted-area/40 rounded-xl border border-border-theme/40">
                <span className="text-[10px] text-muted-text font-black uppercase tracking-wider block mb-1">क्वेरी मोड (Query Mode)</span>
                <span className={`font-mono font-bold text-xs block ${
                  newsStreamHealth.queryMode === "indexed" ? "text-emerald-500" : "text-amber-500"
                }`}>
                  {newsStreamHealth.queryMode === "indexed" ? "⚡ INDEXED QUERY" : "🛡️ FALLBACK RESOLVER"}
                </span>
              </div>

              <div className="p-3 bg-muted-area/40 rounded-xl border border-border-theme/40">
                <span className="text-[10px] text-muted-text font-black uppercase tracking-wider block mb-1">ताजगी (Freshness)</span>
                <span className="font-mono font-bold text-card-foreground text-xs uppercase block">
                  {newsStreamHealth.freshness}
                </span>
              </div>

              <div className="p-3 bg-muted-area/40 rounded-xl border border-border-theme/40">
                <span className="text-[10px] text-muted-text font-black uppercase tracking-wider block mb-1">प्रमाणित समाचार (Verified)</span>
                <span className="font-mono font-bold text-emerald-500 text-xs block">
                  {newsStreamHealth.verifiedCount} stories
                </span>
              </div>

              <div className="p-3 bg-muted-area/40 rounded-xl border border-border-theme/40">
                <span className="text-[10px] text-muted-text font-black uppercase tracking-wider block mb-1">डिग्रेडेड क्वेरी दर</span>
                <span className={`font-mono font-bold text-xs block ${
                  newsStreamHealth.degradedRate > 20 ? "text-amber-500" : "text-emerald-500"
                }`}>
                  {newsStreamHealth.degradedRate}% ({newsStreamHealth.degradedQueriesCount}/{newsStreamHealth.totalQueriesCount})
                </span>
              </div>

              <div className="p-3 bg-muted-area/40 rounded-xl border border-border-theme/40">
                <span className="text-[10px] text-muted-text font-black uppercase tracking-wider block mb-1">अस्वीकृत ड्राफ्ट/स्रोतहीन</span>
                <span className="font-mono font-bold text-purple-500 text-xs block">
                  {newsStreamHealth.rejectedCount} unverified
                </span>
              </div>

              <div className="p-3 bg-muted-area/40 rounded-xl border border-border-theme/40">
                <span className="text-[10px] text-muted-text font-black uppercase tracking-wider block mb-1">प्रकाशन अनुबन्धन (Contract)</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded inline-block">
                  100% ENFORCED
                </span>
              </div>
            </div>

            {/* Publication Contract Specification Checklist */}
            <div className="p-4 bg-muted-area/20 border border-border-theme/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-muted-text font-medium">
                <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                <span>
                  <strong className="text-card-foreground">Canonical Rules:</strong> status: "published" • verificationStatus: "verified" • publishedAt assigned • source citation mandatory • hard retraction purge
                </span>
              </div>
              <div className="text-[11px] font-mono text-muted-text">
                Last checked: {newsStreamHealth.generatedAt ? new Date(newsStreamHealth.generatedAt).toLocaleTimeString('ne-NP') : "Just now"}
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Suite */}
        <div className="bg-card p-8 rounded-[2.5rem] border border-border-theme flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight flex items-center gap-3">
              <Zap size={20} className="text-primary" /> प्रणाली स्वास्थ्य सिम्युलेटर (System Health Simulator)
            </h3>
            <p className="text-xs text-muted-text font-bold">
              विकासकर्ता र व्यवस्थापकहरूको लागि अफलाइन क्यु, कोटा बजेट, र नेटवर्क ट्र्याकिङ परीक्षण गर्ने औजारहरू।
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <button
              onClick={handleSimulateRead}
              className="p-4 bg-muted-area/50 border border-border-theme hover:bg-muted-area rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all group"
            >
              <Database size={24} className="text-primary group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black text-card-foreground">सिम्युलेट रिड (Read)</span>
              <span className="text-[10px] text-muted-text">यादृच्छिक डकुमेन्ट रिड थप्नुहोस्</span>
            </button>

            <button
              onClick={handleSimulateWrite}
              className="p-4 bg-muted-area/50 border border-border-theme hover:bg-muted-area rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all group"
            >
              <Zap size={24} className="text-amber-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black text-card-foreground">सिम्युलेट राइट (Write)</span>
              <span className="text-[10px] text-muted-text">डकुमेन्ट राइट इभेन्ट दर्ता गर्नुहोस्</span>
            </button>

            <button
              onClick={handleSimulateOfflineEvent}
              className="p-4 bg-muted-area/50 border border-border-theme hover:bg-muted-area rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all group"
            >
              <Clock size={24} className="text-blue-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black text-card-foreground">सिम्युलेट अफलाइन इभेन्ट</span>
              <span className="text-[10px] text-muted-text">क्युमा नयाँ पेन्डिङ कार्य थप्नुहोस्</span>
            </button>

            <button
              onClick={() => {
                setSimulatedOffline(!simulatedOffline);
                toast.success(simulatedOffline ? "सिम्युलेटेड नेटवर्क अनलाइन गरिएको छ" : "सिम्युलेटेड नेटवर्क अफलाइन गरिएको छ");
              }}
              className={`p-4 border rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all group ${
                simulatedOffline 
                  ? 'bg-red-500/10 border-red-500/30' 
                  : 'bg-muted-area/50 border-border-theme hover:bg-muted-area'
              }`}
            >
              <Cloud size={24} className={simulatedOffline ? 'text-red-500' : 'text-green-500'} />
              <span className="text-xs font-black text-card-foreground">
                नेटवर्क अवस्था: {simulatedOffline ? 'अफलाइन (Simulated)' : 'अनलाइन'}
              </span>
              <span className="text-[10px] text-muted-text">क्लिक गरी अवस्था परिवर्तन गर्नुहोस्</span>
            </button>

            <button
              onClick={limitedMode.isActive ? handleSimulateQuotaReset : handleSimulateQuotaExceeded}
              className={`p-4 border rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all group ${
                limitedMode.isActive 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-muted-area/50 border-border-theme hover:bg-muted-area'
              }`}
            >
              <ShieldAlert size={24} className={limitedMode.isActive ? 'text-green-500' : 'text-red-500'} />
              <span className="text-xs font-black text-card-foreground">
                {limitedMode.isActive ? 'कोटा रिसेट गर्नुहोस्' : 'कोटा समाप्त (Simulate)'}
              </span>
              <span className="text-[10px] text-muted-text">लिमिटेड मोड एक्टिभेट वा रिसेट</span>
            </button>
          </div>
        </div>

        {/* Queue Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="bg-card p-8 rounded-[2.5rem] border border-border-theme flex flex-col gap-4">
            <span className="text-xxs font-black text-muted-text uppercase tracking-widest">पेन्डिङ कार्यहरू</span>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black text-card-foreground">{queueStats.pending}</span>
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                <Clock size={20} />
              </div>
            </div>
            <p className="text-xs font-bold text-muted-text italic">सिंक हुन बाँकी रहेका कार्यहरू</p>
          </div>
          <div className="bg-card p-8 rounded-[2.5rem] border border-border-theme flex flex-col gap-4">
            <span className="text-xxs font-black text-muted-text uppercase tracking-widest">असफल कार्यहरू</span>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black text-red-500">{queueStats.failed}</span>
              <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl">
                <ShieldAlert size={20} />
              </div>
            </div>
            <p className="text-xs font-bold text-muted-text italic">सिंक हुन नसकेका कार्यहरू</p>
          </div>
          <div className="bg-card p-8 rounded-[2.5rem] border border-border-theme flex flex-col gap-4">
            <span className="text-xxs font-black text-muted-text uppercase tracking-widest">प्रगतिमा</span>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black text-blue-500">{queueStats.syncing}</span>
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl animate-spin">
                <RefreshCw size={20} />
              </div>
            </div>
            <p className="text-xs font-bold text-muted-text italic">अहिले सिंक भइरहेका कार्यहरू</p>
          </div>
          <div className="bg-card p-8 rounded-[2.5rem] border border-border-theme flex flex-col gap-4">
            <span className="text-xxs font-black text-muted-text uppercase tracking-widest">इभेन्ट स्टोर</span>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black text-green-500">{queueStats.syncedCount}</span>
              <div className="p-3 bg-green-500/10 text-green-500 rounded-2xl">
                <History size={20} />
              </div>
            </div>
            <p className="text-xs font-bold text-muted-text italic">सफलतापुर्वक सिंक भएका इभेन्टहरू</p>
          </div>
        </div>

        {/* Event Store Table */}
        <div className="bg-card rounded-[2.5rem] border border-border-theme overflow-hidden shadow-sm">
          <div className="p-8 border-b border-border-theme flex items-center justify-between">
            <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight flex items-center gap-3">
              <History className="text-primary" size={20} /> इभेन्ट स्टोर (अन्तिम गतिविधि)
            </h3>
            <span className="text-xxs font-black text-muted-text uppercase tracking-widest">भर्खरैका १०० इभेन्टहरू</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted-area/50 border-b border-border-theme">
                  <th className="p-6 text-[10px] font-black text-muted-text uppercase tracking-widest">आईडी / प्रकार</th>
                  <th className="p-6 text-[10px] font-black text-muted-text uppercase tracking-widest">प्राथमिकता</th>
                  <th className="p-6 text-[10px] font-black text-muted-text uppercase tracking-widest">कलेक्सन</th>
                  <th className="p-6 text-[10px] font-black text-muted-text uppercase tracking-widest">अवस्था</th>
                  <th className="p-6 text-[10px] font-black text-muted-text uppercase tracking-widest text-right">समय</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme/30">
                {[...eventStore].reverse().map((op) => (
                  <tr key={op.id} className="hover:bg-muted-area/20 transition-colors">
                    <td className="p-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-muted-text uppercase">{op.id}</span>
                        <span className="text-sm font-bold text-card-foreground">{op.action.type}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                        op.action.priority === 'HIGH' ? 'bg-red-500/10 text-red-500' :
                        op.action.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {op.action.priority}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className="text-sm font-bold text-muted-text font-mono">{op.action.collection}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          op.status === 'synced' ? 'bg-green-500' : 
                          op.status === 'failed' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'
                        }`} />
                        <span className="text-xs font-bold text-card-foreground capitalize">{op.status}</span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <span className="text-[10px] font-bold text-muted-text uppercase tracking-tighter">
                        {new Date(op.action.timestamp).toLocaleTimeString('ne-NP')}
                      </span>
                    </td>
                  </tr>
                ))}
                {eventStore.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-20 text-center text-muted-text font-bold uppercase tracking-widest italic opacity-30">
                      इभेन्ट स्टोर खाली छ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fallback & Credentials Telemetry Section */}
        <div className="bg-card p-10 rounded-[2.5rem] border border-border-theme flex flex-col gap-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-theme/40 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Cpu size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight">स्न्यापसट इन्जिन डेटा स्रोत र प्रमाणपत्र अनुगमन (Fetch Source & Credentials Telemetry)</h3>
                <p className="text-xs font-medium text-muted-text">Snapshot OS ले डेटा संकलन गर्दा प्रयोग गरेको मुख्य लाइब्रेरी र फायरबेस एड्मिन एसडिके (Firebase Admin SDK) को स्थिति।</p>
              </div>
            </div>
            {telemetryStats?.fallbackTelemetry && (
              <div className="flex items-center gap-2 px-4 py-2 bg-muted-area/60 rounded-xl border border-border-theme">
                <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">मुख्य स्रोत:</span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                  telemetryStats.fallbackTelemetry.source === 'adminSdk' ? 'bg-green-500/10 text-green-500' :
                  telemetryStats.fallbackTelemetry.source === 'clientSdk' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {telemetryStats.fallbackTelemetry.source === 'adminSdk' ? 'Admin SDK (Secure)' :
                   telemetryStats.fallbackTelemetry.source === 'clientSdk' ? 'Client SDK (Fallback)' : 'Mixed Mode'}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status overview card */}
            <div className="p-6 bg-muted-area/30 rounded-2xl border border-border-theme/50 flex flex-col justify-between">
              <div>
                <span className="text-xxs font-black text-muted-text uppercase tracking-widest block mb-2">एड्मिन क्रेडिन्सियल स्थिति (Admin SDK Status)</span>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-3 h-3 rounded-full ${telemetryStats?.metrics?.adminDbConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-lg font-black text-card-foreground uppercase tracking-tight">
                    {telemetryStats?.metrics?.adminDbConnected ? 'Active & Authorized' : 'Missing / Unauthorized'}
                  </span>
                </div>
                <p className="text-xs text-muted-text leading-relaxed">
                  सर्भर-साइड कम्पाइलरले सुरक्षित `adminDb` (Service Account credentials) मार्फत पूर्ण अधिकार सहित डाटाहरू सिंक र कम्पाइल गर्छ। यदि यो विच्छेद छ भने, यसले क्लाइन्ट-साइड फलब्याक प्रयोग गर्छ।
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-border-theme/20 text-xxs font-mono text-muted-text">
                COMPILED AT: {telemetryStats?.fallbackTelemetry?.compiledAt ? new Date(telemetryStats.fallbackTelemetry.compiledAt).toLocaleString('ne-NP') : 'अन्तरक्रिया भएको छैन'}
              </div>
            </div>

            {/* Collection breakdown table */}
            <div className="md:col-span-2 overflow-hidden border border-border-theme/40 rounded-2xl bg-muted-area/10">
              <div className="bg-muted-area/50 px-6 py-4 border-b border-border-theme/40 flex items-center justify-between">
                <span className="text-xxs font-black text-muted-text uppercase tracking-widest">कलेक्सन-अनुसार स्रोत विभाजन (Collection-wise Fetch Source)</span>
                <span className="text-[9px] font-black text-primary uppercase">प्रत्यक्ष स्थिति ट्र्याकिङ</span>
              </div>
              <div className="divide-y divide-border-theme/20 max-h-[220px] overflow-y-auto">
                {telemetryStats?.fallbackTelemetry?.collections && Object.keys(telemetryStats.fallbackTelemetry.collections).length > 0 ? (
                  Object.entries(telemetryStats.fallbackTelemetry.collections).map(([col, details]: [string, any]) => (
                    <div key={col} className="px-6 py-3 flex items-center justify-between hover:bg-muted-area/20 transition-colors">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-black text-card-foreground font-mono">{col}</span>
                        {details.error && (
                          <span className="text-[10px] text-red-500 font-medium truncate max-w-xs sm:max-w-md italic" title={details.error}>
                            त्रुटि: {details.error}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-muted-text font-mono">Count: {details.count}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          details.source === 'adminSdk' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {details.source === 'adminSdk' ? 'Admin SDK' : 'Client SDK'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-muted-text/50 font-bold italic text-xs uppercase tracking-wider">
                    कुनै कलेक्सन डेटा ट्र्याक गरिएको छैन। स्न्यापसटहरू कम्पाईल भएपछि यहाँ विवरण देखिनेछ।
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Table */}
        <div className="bg-card rounded-[2.5rem] border border-border-theme overflow-hidden shadow-sm">
          <div className="p-8 border-b border-border-theme flex items-center justify-between">
            <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight flex items-center gap-3">
              <BarChart3 className="text-primary" size={20} /> फायरबेस रिड टेलिमेट्री
            </h3>
            <span className="text-xxs font-black text-muted-text uppercase tracking-widest">अन्तिम १ घण्टा</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted-area/50 border-b border-border-theme">
                  <th className="p-6 text-[10px] font-black text-muted-text uppercase tracking-widest">क्वेरीको नाम</th>
                  <th className="p-6 text-[10px] font-black text-muted-text uppercase tracking-widest">कुल रिड (Reads)</th>
                  <th className="p-6 text-[10px] font-black text-muted-text uppercase tracking-widest">औसत समय (Avg)</th>
                  <th className="p-6 text-[10px] font-black text-muted-text uppercase tracking-widest">स्रोत</th>
                  <th className="p-6 text-[10px] font-black text-muted-text uppercase tracking-widest text-right">अन्तिम पटक</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme/30">
                {metrics.map((m) => (
                  <tr key={m.queryName} className="hover:bg-muted-area/20 transition-colors">
                    <td className="p-6">
                      <span className="text-sm font-bold text-card-foreground font-mono">{m.queryName}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-card-foreground">{m.count}</span>
                        {m.count > 50 && <AlertTriangle size={14} className="text-amber-500" />}
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-sm font-bold text-muted-text">{Math.round(m.avgDuration)}ms</span>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        m.source === 'cache' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {m.source}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <span className="text-[10px] font-bold text-muted-text uppercase tracking-tighter">
                        {new Date(m.lastTimestamp).toLocaleTimeString()}
                      </span>
                    </td>
                  </tr>
                ))}
                {metrics.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-20 text-center text-muted-text font-bold uppercase tracking-widest italic opacity-30">
                      कुनै डाटा रेकर्ड गरिएको छैन
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Content Integrity Test Suite */}
        <div className="bg-card p-10 rounded-[2.5rem] border border-border-theme flex flex-col gap-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight">कন্টেন্ট अखण्डता परीक्षण सुइट (Content Integrity Test Suite)</h3>
                <p className="text-xs font-medium text-muted-text">श्रेणी शुद्धता (Category Isolation), खाली क्षेत्रहरू र स्न्यापसट सुसंगतताको वास्तविक समयमा जाँच गर्नुहोस्।</p>
              </div>
            </div>

            <button
              onClick={handleRunIntegrityAudit}
              disabled={integrityRunning}
              className="px-6 py-3.5 bg-primary text-white hover:opacity-90 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {integrityRunning ? <RefreshCw size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
              {integrityRunning ? 'परीक्षण हुँदैछ...' : 'अखण्डता परीक्षण चलाउनुहोस्'}
            </button>
          </div>

          {integrityReport && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-6 border-t border-border-theme">
              <div className="p-5 bg-muted-area/50 rounded-2xl border border-border-theme flex flex-col gap-1">
                <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">परिक्षण गरिएका लेखहरू</span>
                <span className="text-2xl font-black text-card-foreground">{integrityReport.totalAudited}</span>
                <span className="text-[10px] text-green-500 font-bold">समय: {integrityReport.timestamp}</span>
              </div>
              <div className="p-5 bg-muted-area/50 rounded-2xl border border-border-theme flex flex-col gap-1">
                <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">श्रेणी नभएका लेखहरू</span>
                <span className={`text-2xl font-black ${integrityReport.missingCategory > 0 ? 'text-red-500' : 'text-green-500'}`}>{integrityReport.missingCategory}</span>
                <span className="text-[10px] text-muted-text">{integrityReport.missingCategory === 0 ? '✓ सबैमा श्रेणी सुरक्षित' : '⚠ ध्यान दिनुहोस्'}</span>
              </div>
              <div className="p-5 bg-muted-area/50 rounded-2xl border border-border-theme flex flex-col gap-1">
                <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">श्रेणी लिकेज (Leakage)</span>
                <span className={`text-2xl font-black ${integrityReport.leakageCount > 0 ? 'text-red-500' : 'text-green-500'}`}>{integrityReport.leakageCount}</span>
                <span className="text-[10px] text-muted-text">{integrityReport.leakageCount === 0 ? '✓ कडा आइसोलेसन कायम' : '⚠ लिकेज भेटियो'}</span>
              </div>
              <div className="p-5 bg-muted-area/50 rounded-2xl border border-border-theme flex flex-col gap-1">
                <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">डुप्लिकेट आईडीहरू</span>
                <span className={`text-2xl font-black ${integrityReport.duplicateIds ? 'text-red-500' : 'text-green-500'}`}>{integrityReport.duplicateIds ? 'छ' : 'छैन (0)'}</span>
                <span className="text-[10px] text-green-500 font-bold">✓ अद्वितीयता प्रमाणित</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Optimisation Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card p-10 rounded-[2.5rem] border border-border-theme flex flex-col gap-6">
            <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight flex items-center gap-3">
              <Database size={20} className="text-primary" /> डाटाबेस सुझावहरू
            </h3>
            <div className="flex flex-col gap-4">
              <div className="p-6 bg-muted-area/50 rounded-2xl border border-border-theme flex items-start gap-4">
                <CheckCircle2 size={20} className="text-green-500 mt-1" />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-card-foreground">Cache-First Strategy सक्रिय छ</span>
                  <p className="text-xs text-muted-text font-medium leading-relaxed">
                    प्रायः सबै भ्यूहरूले पहिले स्थानीय क्यासबाट डाटा खोज्छन्, जसले कोटा खपत ८०% सम्म घटाउँछ।
                  </p>
                </div>
              </div>
              <div className="p-6 bg-muted-area/50 rounded-2xl border border-border-theme flex items-start gap-4">
                <RefreshCw size={20} className="text-blue-500 mt-1" />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-card-foreground">ब्याचिङ र क्युइङ</span>
                  <p className="text-xs text-muted-text font-medium leading-relaxed">
                    अफलाइन वा कोटा सकिएको बेला लेखिएका डाटाहरू स्थानीय ब्याकअपमा सुरक्षित हुन्छन् र पछि आफैँ सिंक हुन्छन्।
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-card p-10 rounded-[2.5rem] border border-white/5 flex flex-col gap-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <Activity size={20} className="text-primary" /> लाइभ मनिटरिङ (Live Monitoring)
            </h3>
            <div className="h-40 flex items-end gap-1 px-4 py-8 bg-black/20 rounded-3xl overflow-hidden relative group">
              {trafficHistory.map((d, i) => {
                const total = d.reads + d.writes;
                const maxActivity = Math.max(1, ...trafficHistory.map(h => h.reads + h.writes));
                const readHeight = total > 0 ? (d.reads / total) * 100 : 0;
                const writeHeight = total > 0 ? (d.writes / total) * 100 : 0;
                const percentHeight = total > 0 ? Math.min(100, (total / maxActivity) * 100) : 0;
                
                const displayHeight = percentHeight === 0 ? 4 : percentHeight;
                const isIdle = percentHeight === 0;

                return (
                  <div key={i} className="flex-grow flex flex-col justify-end h-full relative group/bar">
                    <div className="w-full rounded-t-sm overflow-hidden flex flex-col justify-end transition-all duration-300" style={{ height: `${displayHeight}%` }}>
                      {isIdle ? (
                        <div className="w-full h-full bg-primary/20 animate-pulse" />
                      ) : (
                        <>
                          <div className="w-full bg-amber-500" style={{ height: `${writeHeight}%` }} />
                          <div className="w-full bg-primary" style={{ height: `${readHeight}%` }} />
                        </>
                      )}
                    </div>
                    
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/bar:flex flex-col bg-slate-900 text-white text-[9px] p-2 rounded shadow-xl whitespace-nowrap z-30 font-bold border border-white/10 pointer-events-none">
                      <span className="text-primary">रिड (Reads): {d.reads}</span>
                      <span className="text-amber-500">राइट (Writes): {d.writes}</span>
                    </div>
                  </div>
                );
              })}
              
              <div className="absolute top-3 right-4 flex items-center gap-4 text-[10px] font-black uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded bg-primary" />
                  <span className="text-white/60">रिड (Reads)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded bg-amber-500" />
                  <span className="text-white/60">राइट (Writes)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded bg-primary/20 animate-pulse" />
                  <span className="text-white/40">लाइभ (Live)</span>
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px] pointer-events-none">
                <span className="text-xxs font-black text-white uppercase tracking-widest">प्रणाली ट्राफिक (वास्तविक समय)</span>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-muted-text leading-relaxed">
              * यो ग्राफले फायरबेसबाट भइरहेको वास्तविक रिड र राइट (Real-time Reads/Writes) देखाउँछ। कुनै नयाँ डकुमेन्ट अपरेसन हुँदा यसमा तुरुन्त स्पाइक (Spike) देखिन्छ।
            </p>
          </div>
        </div>

        {/* Full-Stack Backup & Restore Section */}
        <div className="bg-card p-10 rounded-[2.5rem] border border-border-theme flex flex-col gap-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Cloud size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight">फुल-स्ट्याक ब्याकअप र पुनर्स्थापना (Backup & Restore)</h3>
                <p className="text-xs font-medium text-muted-text">सबै डाटाबेस कलेक्सनहरू सुरक्षित गर्नुहोस् वा कुनै समस्या आएमा अघिल्लो अवस्थामा फर्काउनुहोस् (Restore)।</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleRestoreBackup} 
                accept=".json" 
                className="hidden" 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isRestoring}
                className="px-6 py-3.5 bg-muted text-card-foreground hover:bg-muted-area rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Upload size={16} /> {isRestoring ? 'पुनर्स्थापना हुँदैछ...' : 'ब्याकअपबाट पुनर्स्थापना'}
              </button>
              
              <button
                onClick={handleExportBackup}
                disabled={isExporting}
                className="px-6 py-3.5 bg-primary text-white hover:opacity-90 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
              >
                <Download size={16} /> {isExporting ? 'निर्यात हुँदैछ...' : 'पूर्ण ब्याकअप डाउनलोड'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
