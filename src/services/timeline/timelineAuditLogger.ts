import { db } from "@/src/lib/firebase";
import { collection, addDoc, serverTimestamp } from "@/src/lib/firebase";

export type TimelineAuditAction = 
  | "create_event"
  | "update_event"
  | "verify_event"
  | "reject_event"
  | "publish_event"
  | "deprecate_event"
  | "archive_event"
  | "delete_event"
  | "export_snapshot"
  | "sync_provenance";

export interface TimelineAuditEntry {
  action: TimelineAuditAction;
  targetEventId: string;
  actorId: string;
  actorEmail?: string;
  actorRole?: string;
  details?: Record<string, any>;
  timestamp?: any;
}

export class TimelineAuditLogger {
  public static async log(entry: TimelineAuditEntry): Promise<void> {
    try {
      await addDoc(collection(db, "timeline_audit_logs"), {
        ...entry,
        timestamp: serverTimestamp(),
        clientTimestamp: new Date().toISOString()
      });
    } catch (e) {
      console.warn("[TimelineAuditLogger] Failed to write audit log entry:", e);
    }
  }
}
