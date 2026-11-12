import { db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit } from "@/src/lib/firebase";
import { KnowledgeAuditEvent } from "@/src/types/knowledge";

class KnowledgeAuditLoggerService {
  private memoryLogs: KnowledgeAuditEvent[] = [];
  private readonly MAX_MEMORY_LOGS = 100;

  /**
   * Records a strictly structured Knowledge OS audit event
   */
  public async logEvent(event: Omit<KnowledgeAuditEvent, "id" | "timestamp">): Promise<KnowledgeAuditEvent> {
    const fullEvent: KnowledgeAuditEvent = {
      ...event,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString()
    };

    // Keep in memory buffer
    this.memoryLogs.unshift(fullEvent);
    if (this.memoryLogs.length > this.MAX_MEMORY_LOGS) {
      this.memoryLogs.pop();
    }

    // Persist to Firestore knowledge_audit_logs asynchronously
    try {
      if (typeof window !== "undefined") {
        await addDoc(collection(db, "knowledge_audit_logs"), {
          ...fullEvent
        });
      }
    } catch (err) {
      console.error("[KnowledgeAuditLogger] Firestore audit write failed:", err);
      // We do not silently swallow, but return the event recorded in memory for audit continuity
    }

    return fullEvent;
  }

  /**
   * Retrieves recent audit events for admin console
   */
  public async getRecentLogs(maxCount = 50): Promise<KnowledgeAuditEvent[]> {
    try {
      const q = query(
        collection(db, "knowledge_audit_logs"),
        orderBy("timestamp", "desc"),
        limit(maxCount)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as KnowledgeAuditEvent));
      }
    } catch (err) {
      console.warn("[KnowledgeAuditLogger] Fallback to in-memory audit logs:", err);
    }

    return this.memoryLogs.slice(0, maxCount);
  }

  public getMemoryLogs(): KnowledgeAuditEvent[] {
    return [...this.memoryLogs];
  }
}

export const knowledgeAuditLogger = new KnowledgeAuditLoggerService();
