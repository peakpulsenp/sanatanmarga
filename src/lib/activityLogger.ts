import { db, auth } from "./firebase";
import { collection, serverTimestamp } from "@/src/lib/firebase";
import { addDocWithQueue } from "./offlineQueue";

export interface ActivityLog {
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resourceType: "article" | "assignment" | "campaign" | "event" | "user" | "system" | "community" | "ad";
  resourceId: string;
  metadata: any;
  timestamp: any;
}

export async function logActivity(
  action: string, 
  resourceType: ActivityLog["resourceType"], 
  resourceId: string = "none", 
  metadata: any = {}
) {
  try {
    const user = auth.currentUser;
    
    // Attempt to extract role from user claims or default safely
    let role = "reader";
    if (user) {
      // If the profile holds custom role claims we retrieve it or fetch from localStorage
      const cachedProfile = localStorage.getItem("sanatan_user_profile");
      if (cachedProfile) {
        try {
          const parsed = JSON.parse(cachedProfile);
          if (parsed.role) role = parsed.role;
        } catch (e) {}
      }
    }

    const logEntry: ActivityLog = {
      actorId: user?.uid || "anonymous",
      actorName: user?.displayName || "Anonymous Guest",
      actorEmail: user?.email || "anonymous@sanatanmarga.com",
      actorRole: role,
      action,
      resourceType,
      resourceId,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : {},
      timestamp: serverTimestamp()
    };

    // Use addDocWithQueue to ensure activity logging doesn't fail due to quota
    const result = await addDocWithQueue("activityLogs", logEntry);
    const logId = (result as any)?.id || "queued";
    console.log(`Activity logged [${action}] id: ${logId}`);
    return logId;
  } catch (error) {
    console.error("Failed to write activity log:", error);
    return null;
  }
}

export interface GovernanceAuditLog {
  action: string;
  performedBy: string;
  performedByEmail: string;
  affectedDocuments?: number;
  backupId?: string;
  details?: Record<string, any>;
  resourceType?: string;
  resourceId?: string;
  timestamp: any;
}

export async function recordAuditLog(
  action: string,
  options: {
    affectedDocuments?: number;
    backupId?: string;
    details?: Record<string, any>;
    resourceType?: ActivityLog["resourceType"];
    resourceId?: string;
  } = {}
) {
  const user = auth.currentUser;
  const performedBy = user?.uid || "admin_uid";
  const performedByEmail = user?.email || "admin@sanatanmarga.com";

  const auditRecord: GovernanceAuditLog = {
    action,
    performedBy,
    performedByEmail,
    affectedDocuments: options.affectedDocuments ?? 1,
    backupId: options.backupId,
    details: options.details ?? {},
    resourceType: options.resourceType || "system",
    resourceId: options.resourceId || "none",
    timestamp: serverTimestamp()
  };

  try {
    // 1. Write to Firestore auditLogs collection via offlineQueue (requires signed-in user)
    if (user) {
      await addDocWithQueue("auditLogs", auditRecord);
    }
  } catch (e) {
    console.warn("Firestore audit log failed:", e);
  }

  try {
    // 2. Write to activityLogs
    await logActivity(action, options.resourceType || "system", options.resourceId || "none", {
      affectedDocuments: options.affectedDocuments,
      backupId: options.backupId,
      ...options.details
    });
  } catch (e) {
    console.warn("Activity log failed:", e);
  }

  try {
    // 3. Post to backend /api/admin/audit-logs
    await fetch("/api/admin/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        performedBy,
        performedByEmail,
        affectedDocuments: options.affectedDocuments,
        backupId: options.backupId,
        details: options.details,
        resourceType: options.resourceType,
        resourceId: options.resourceId
      })
    });
  } catch (e) {
    console.warn("API audit log failed:", e);
  }
}

export interface EventGovernanceLog {
  who: {
    userId: string;
    email: string;
    name: string;
    role: string;
  };
  what: string; // e.g., "verification", "canonicalization", "deduplication", "lifecycle_change", "retract"
  when: string;
  before: any;
  after: any;
  why: string;
  source: string;
  ipSession: string;
}

export async function logEventGovernanceAction(options: {
  eventId: string;
  actionType: "verify" | "canonicalize" | "deduplicate" | "lifecycle_change" | "source_approve" | "festival_edit" | "publish" | "retract" | "expire" | "merge" | "delete";
  beforeState: any;
  afterState: any;
  why: string;
  source: string;
}) {
  const user = auth.currentUser;
  
  let role = "contributor";
  const cachedProfile = localStorage.getItem("sanatan_user_profile");
  if (cachedProfile) {
    try {
      const parsed = JSON.parse(cachedProfile);
      if (parsed.role) role = parsed.role;
    } catch (e) {}
  }

  const logData: EventGovernanceLog = {
    who: {
      userId: user?.uid || "system_uid",
      email: user?.email || "system@sanatanmarga.com",
      name: user?.displayName || "System Automator",
      role: role
    },
    what: options.actionType.toUpperCase(),
    when: new Date().toISOString(),
    before: options.beforeState || null,
    after: options.afterState || null,
    why: options.why || "Standard editorial process",
    source: options.source || "Events OS Command Center",
    ipSession: `session_${Math.random().toString(36).substring(2, 10)}`
  };

  try {
    // 1. Record via recordAuditLog so it goes through Firestore and API
    await recordAuditLog(`EVENT_${options.actionType.toUpperCase()}`, {
      resourceType: "event",
      resourceId: options.eventId,
      details: {
        who: logData.who,
        before: logData.before,
        after: logData.after,
        why: logData.why,
        source: logData.source,
        ipSession: logData.ipSession
      }
    });

    // 2. Also save specifically to a dedicated eventGovernanceLogs local list for real-time reactive displays in the workspace
    const existingLogs = localStorage.getItem("event_governance_logs") || "[]";
    const logs = JSON.parse(existingLogs);
    logs.unshift({
      id: `GOV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventId: options.eventId,
      ...logData
    });
    localStorage.setItem("event_governance_logs", JSON.stringify(logs.slice(0, 100)));

  } catch (error) {
    console.error("Failed logging event governance action:", error);
  }
}
