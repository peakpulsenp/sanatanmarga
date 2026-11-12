import { db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { collection, doc, setDoc, getDocs, query, where, orderBy, limit } from "@/src/lib/firebase";
import { ArchiveStatus } from "./archiveTypes";

export type ArchiveAuditEventType =
  | "ARCHIVE_CREATED"
  | "ARCHIVE_UPDATED"
  | "ARCHIVE_SUBMITTED"
  | "ARCHIVE_OCR_STARTED"
  | "ARCHIVE_OCR_COMPLETED"
  | "ARCHIVE_OCR_FAILED"
  | "ARCHIVE_VERIFIED"
  | "ARCHIVE_PUBLISHED"
  | "ARCHIVE_REJECTED"
  | "ARCHIVE_DEPRECATED"
  | "ARCHIVE_ARCHIVED";

export interface ArchiveAuditLogEntry {
  id: string;
  recordId: string;
  actorId: string;
  actorRole: string;
  timestamp: string;
  eventType: ArchiveAuditEventType;
  previousStatus?: ArchiveStatus | string;
  newStatus?: ArchiveStatus | string;
  reason?: string;
  details?: Record<string, any>;
}

export class ArchiveAuditLogger {
  private static memoryLogs: ArchiveAuditLogEntry[] = [];

  /**
   * Log an audit event for an archive record
   */
  public static async logEvent(
    params: {
      recordId: string;
      actorId: string;
      actorRole: string;
      eventType: ArchiveAuditEventType;
      previousStatus?: ArchiveStatus | string;
      newStatus?: ArchiveStatus | string;
      reason?: string;
      details?: Record<string, any>;
    }
  ): Promise<ArchiveAuditLogEntry> {
    const timestamp = new Date().toISOString();
    const entryId = `arch_audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const entry: ArchiveAuditLogEntry = {
      id: entryId,
      recordId: params.recordId,
      actorId: params.actorId || "system",
      actorRole: params.actorRole || "system",
      timestamp,
      eventType: params.eventType,
      previousStatus: params.previousStatus,
      newStatus: params.newStatus,
      reason: params.reason || "Standard Archive OS lifecycle action",
      details: params.details || {}
    };

    // Store in in-memory buffer
    ArchiveAuditLogger.memoryLogs.unshift(entry);
    if (ArchiveAuditLogger.memoryLogs.length > 200) {
      ArchiveAuditLogger.memoryLogs.pop();
    }

    // Persist to Firestore if available
    try {
      if (db) {
        await setDoc(doc(db, "archive_audit_logs", entry.id), entry);
      }
    } catch (err) {
      console.warn("[ArchiveAuditLogger] Firestore audit logging skipped/fallback:", err);
    }

    return entry;
  }

  /**
   * Get recent audit logs for a record or globally
   */
  public static async getLogs(recordId?: string, max: number = 50): Promise<ArchiveAuditLogEntry[]> {
    if (recordId) {
      const filtered = ArchiveAuditLogger.memoryLogs.filter(l => l.recordId === recordId);
      if (filtered.length > 0) return filtered.slice(0, max);
    } else {
      if (ArchiveAuditLogger.memoryLogs.length > 0) return ArchiveAuditLogger.memoryLogs.slice(0, max);
    }

    try {
      if (db) {
        const col = collection(db, "archive_audit_logs");
        const q = recordId 
          ? query(col, where("recordId", "==", recordId), limit(max))
          : query(col, limit(max));
        
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as ArchiveAuditLogEntry);
      }
    } catch (e) {
      // Fallback to memory
    }

    return ArchiveAuditLogger.memoryLogs.slice(0, max);
  }
}
