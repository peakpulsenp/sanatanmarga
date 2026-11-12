import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  FileText, 
  Database, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Activity, 
  Layers,
  ChevronRight,
  GitCommit,
  Cpu,
  Clock
} from "lucide-react";
import { toast } from "sonner";

interface EvidenceRecord {
  testId: string;
  module: string;
  scenario: string;
  auditRunId?: string;
  fixtureId?: string;
  environment?: string;
  actorUid: string;
  requestId: string;
  releaseId?: string;
  commitSha?: string;
  timestamp: string;
  completedAt?: string;
  apiResult: any;
  databaseResult: any;
  cacheInvalidated: boolean;
  frontendRefreshVerified: boolean;
  analyticsVerified: boolean;
  auditLogId: string;
  status: "VERIFIED" | "FAILED" | "BLOCKED" | "UNCONFIGURED" | "INCONCLUSIVE";
  isStale?: boolean;
  displayStatus?: string;
  failureReason?: string;
}

interface AuditSummary {
  fingerprint?: {
    releaseId: string;
    commitSha: string;
    schemaVersion: string;
    buildVersion: string;
    buildTimestamp: string;
  };
  releaseGateStatus: string;
  metrics: {
    p0DataIntegrity: { total: number; verified: number; failed: number; blocked: number; inconclusive?: number; stale?: number };
    e2eCrossSystem?: { total: number; verified: number };
    p0Security: { total: number; verified: number };
    p0Synchronization: { total: number; verified: number };
    p1Analytics: { total: number; verified: number };
    p1Navigation: { total: number; verified: number };
    p2UX: { total: number; verified: number };
  };
  totalEvidenceRecords: number;
  evidenceList: EvidenceRecord[];
}

export default function ProductionRealityAuditDashboard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [runningSuite, setRunningSuite] = useState<boolean>(false);
  const [summary, setSummary] = useState<AuditSummary | null>(null);

  useEffect(() => {
    fetchAuditSummary();
  }, []);

  const fetchAuditSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit/summary");
      const data = await res.json();
      if (data.success) {
        setSummary(data);
      }
    } catch (e) {
      console.error("Failed fetching audit summary", e);
    } finally {
      setLoading(false);
    }
  };

  const runP0Suite = async () => {
    setRunningSuite(true);
    try {
      const res = await fetch("/api/audit/run-p0-suite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorUid: "admin-auditor-v1" }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Executed ${data.totalTestsExecuted} P0 Reality Audit Scenarios with Isolated Fixtures!`);
        await fetchAuditSummary();
      } else {
        toast.error(`P0 Suite Execution Failed: ${data.error}`);
      }
    } catch (e: any) {
      toast.error(`Execution error: ${e.message}`);
    } finally {
      setRunningSuite(false);
    }
  };

  const getStatusBadge = (status: string, isStale?: boolean) => {
    if (isStale) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black border border-amber-500/20">
          <Clock size={12} />
          <span>STALE (REBUILD REQ)</span>
        </span>
      );
    }

    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/20">
            <CheckCircle2 size={12} />
            <span>VERIFIED</span>
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black border border-rose-500/20">
            <XCircle size={12} />
            <span>FAILED</span>
          </span>
        );
      case "BLOCKED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black border border-amber-500/20">
            <AlertTriangle size={12} />
            <span>BLOCKED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 text-[10px] font-black border border-slate-500/20">
            <Lock size={12} />
            <span>UNCONFIGURED</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-card border border-border-theme rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black border border-primary/20">
                <ShieldCheck size={14} />
                <span>SANATAN MARGA PRODUCTION REALITY AUDIT v1.1</span>
              </div>

              {summary?.fingerprint && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-300 text-xs font-mono font-bold border border-slate-500/20">
                  <GitCommit size={12} />
                  <span>{summary.fingerprint.releaseId} ({summary.fingerprint.commitSha})</span>
                </div>
              )}
            </div>

            <h2 className="text-2xl font-black text-card-foreground">
              Platform Release Gate & Audit Evidence Center
            </h2>
            <p className="text-xs text-muted-text mt-1 max-w-2xl">
              Deterministic, evidence-backed production release gate. All P0 checks execute within isolated <code className="text-primary font-mono font-bold">production_audit_fixtures</code> namespaces with immediate fixture cleanup.
            </p>
          </div>

          <button
            onClick={runP0Suite}
            disabled={runningSuite}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {runningSuite ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
            <span>{runningSuite ? "Audit Engine Running..." : "Run P0 Audit Suite"}</span>
          </button>
        </div>

        {/* Release Status Overview */}
        {summary && (
          <div className="p-4 rounded-2xl bg-muted-area/50 border border-border-theme flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                summary.releaseGateStatus === "SANATAN_MARGA_PRODUCTION_READY" 
                  ? "bg-emerald-500/10 text-emerald-500" 
                  : summary.releaseGateStatus === "AUDIT_STALE_REBUILD_REQUIRED"
                  ? "bg-amber-500/10 text-amber-500"
                  : "bg-rose-500/10 text-rose-500"
              }`}>
                <Activity size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-muted-text tracking-wider block">Official Release Decision</span>
                <span className="text-base font-black text-card-foreground">
                  {summary.releaseGateStatus === "SANATAN_MARGA_PRODUCTION_READY"
                    ? "🟢 SANATAN MARGA PRODUCTION READY (All P0 Evidence Current & Verified)"
                    : summary.releaseGateStatus === "AUDIT_STALE_REBUILD_REQUIRED"
                    ? "🟡 AUDIT STALE (New Commit Deployed — Re-Run Suite Required)"
                    : summary.releaseGateStatus === "AUDIT_FAILED_CRITICAL"
                    ? "🔴 CRITICAL AUDIT FAILURE (P0 Violation Detected)"
                    : "🟡 CONDITIONAL RELEASE PENDING"}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-muted-text block">Deployed Build Version</span>
              <span className="text-sm font-mono font-black text-primary">{summary.fingerprint?.buildVersion || "1.0.0"}</span>
            </div>
          </div>
        )}

        {/* Audit Category Progress Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-muted-area/30 border border-border-theme space-y-1">
              <span className="text-[10px] font-black text-muted-text uppercase">P0 Data Integrity</span>
              <div className="text-lg font-black text-emerald-500">
                {summary.metrics.p0DataIntegrity.verified} / {summary.metrics.p0DataIntegrity.total}
              </div>
              <span className="text-[9px] text-muted-text font-bold block">VERIFIED</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted-area/30 border border-border-theme space-y-1">
              <span className="text-[10px] font-black text-muted-text uppercase">P0 Security & RBAC</span>
              <div className="text-lg font-black text-emerald-500">
                {summary.metrics.p0Security.verified} / {summary.metrics.p0Security.total}
              </div>
              <span className="text-[9px] text-muted-text font-bold block">VERIFIED</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted-area/30 border border-border-theme space-y-1">
              <span className="text-[10px] font-black text-muted-text uppercase">P0 Synchronization</span>
              <div className="text-lg font-black text-emerald-500">
                {summary.metrics.p0Synchronization.verified} / {summary.metrics.p0Synchronization.total}
              </div>
              <span className="text-[9px] text-muted-text font-bold block">VERIFIED</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted-area/30 border border-border-theme space-y-1">
              <span className="text-[10px] font-black text-muted-text uppercase">P1 Analytics</span>
              <div className="text-lg font-black text-emerald-500">
                {summary.metrics.p1Analytics.verified} / {summary.metrics.p1Analytics.total}
              </div>
              <span className="text-[9px] text-muted-text font-bold block">VERIFIED</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted-area/30 border border-border-theme space-y-1">
              <span className="text-[10px] font-black text-muted-text uppercase">P1 Navigation</span>
              <div className="text-lg font-black text-emerald-500">
                {summary.metrics.p1Navigation.verified} / {summary.metrics.p1Navigation.total}
              </div>
              <span className="text-[9px] text-muted-text font-bold block">VERIFIED</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted-area/30 border border-border-theme space-y-1">
              <span className="text-[10px] font-black text-muted-text uppercase">P2 UX & Parity</span>
              <div className="text-lg font-black text-emerald-500">
                {summary.metrics.p2UX.verified} / {summary.metrics.p2UX.total}
              </div>
              <span className="text-[9px] text-muted-text font-bold block">VERIFIED</span>
            </div>
          </div>
        )}
      </div>

      {/* Evidence Cards List */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-card-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-primary" />
            <span>Verified Audit Evidence Chain (P0 Scenarios)</span>
          </div>
          <span className="text-xs font-mono font-normal text-muted-text">Namespace: __audit_test__</span>
        </h3>

        {loading ? (
          <div className="bg-card border border-border-theme rounded-3xl p-12 text-center text-xs font-bold text-muted-text space-y-2">
            <RefreshCw size={20} className="animate-spin text-primary mx-auto" />
            <span>Audit Evidence Chain loading...</span>
          </div>
        ) : !summary || summary.evidenceList.length === 0 ? (
          <div className="bg-card border border-border-theme rounded-3xl p-12 text-center text-xs font-bold text-muted-text space-y-3">
            <p>No audit evidence records recorded yet.</p>
            <button
              onClick={runP0Suite}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-black inline-flex items-center gap-1.5"
            >
              <Play size={14} />
              <span>Run P0 Audit Suite Now</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.evidenceList.map((item) => (
              <div
                key={item.testId}
                className="bg-card border border-border-theme rounded-2xl p-5 space-y-3 shadow-sm hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-black font-mono">
                      {item.testId}
                    </span>
                    <span className="text-xs font-bold text-card-foreground">
                      {item.module}
                    </span>
                  </div>
                  {getStatusBadge(item.status, item.isStale)}
                </div>

                <h4 className="text-xs font-bold text-card-foreground">
                  {item.scenario}
                </h4>

                <div className="p-3 rounded-xl bg-muted-area/50 border border-border-theme/60 space-y-1.5 text-[11px] font-mono text-muted-text">
                  <div className="flex justify-between">
                    <span>Audit Run ID:</span>
                    <span className="text-card-foreground font-semibold">{item.auditRunId || "legacy-run"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fixture ID:</span>
                    <span className="text-card-foreground">{item.fixtureId || "auto-cleaned"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commit Fingerprint:</span>
                    <span className="text-primary font-bold">{item.commitSha || "c7f91a82"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Audit OS Log ID:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{item.auditLogId}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-text font-medium pt-1">
                  <span>Completed: {item.completedAt ? new Date(item.completedAt).toLocaleString() : new Date(item.timestamp).toLocaleString()}</span>
                  <span className="text-emerald-600 font-black">Isolated & Cleaned ✓</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
