import { doc, setDoc } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";

export type AdAuditAction = 
  | "CAMPAIGN_CREATED"
  | "CAMPAIGN_UPDATED"
  | "CAMPAIGN_SUBMITTED"
  | "CAMPAIGN_APPROVED"
  | "CAMPAIGN_REJECTED"
  | "CAMPAIGN_SCHEDULED"
  | "CAMPAIGN_ACTIVATED"
  | "CAMPAIGN_PAUSED"
  | "CAMPAIGN_COMPLETED"
  | "CAMPAIGN_EXPIRED"
  | "CAMPAIGN_ARCHIVED"
  | "CAMPAIGN_DELETED";

export interface AdAuditLog {
  id: string;
  campaignId: string;
  action: AdAuditAction;
  actorId: string;
  actorRole: string;
  timestamp: string;
  previousStatus?: string;
  newStatus?: string;
  previousState?: any;
  newState?: any;
  reason?: string;
  metadata?: Record<string, any>;
}

const LOCAL_AUDIT_KEY = "sanatan_ad_audit_logs";

class AdAuditLogger {
  private logs: AdAuditLog[] = [];

  constructor() {
    this.loadLocalLogs();
  }

  private loadLocalLogs() {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(LOCAL_AUDIT_KEY);
      if (raw) {
        this.logs = JSON.parse(raw);
      }
    } catch {
      this.logs = [];
    }
  }

  private saveLocalLogs() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(this.logs.slice(-100)));
    } catch {}
  }

  public async log(entry: Omit<AdAuditLog, "id" | "timestamp">): Promise<AdAuditLog> {
    const fullLog: AdAuditLog = {
      ...entry,
      id: `ad_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString()
    };

    this.logs.push(fullLog);
    this.saveLocalLogs();

    // Persist to Firestore if online
    try {
      await setDoc(doc(db, "adAuditLogs", fullLog.id), fullLog);
    } catch (err) {
      console.warn("Could not save adAuditLog to Firestore (offline/permission):", err);
    }

    return fullLog;
  }

  public getLogs(): AdAuditLog[] {
    return [...this.logs];
  }

  public getLogsForCampaign(campaignId: string): AdAuditLog[] {
    return this.logs.filter(l => l.campaignId === campaignId);
  }
}

export const adAuditLogger = new AdAuditLogger();
