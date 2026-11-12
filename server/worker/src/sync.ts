import type { Env } from "./types";
import { todayUtc, safeKey, getSnapshotBucket } from "./util";

export interface SyncResult {
  success: boolean;
  attempted: number;
  replayed: number;
  failed: number;
  quotaAvailable: boolean;
  error?: string;
}

/**
 * Probe Firebase Firestore to check if quota is available.
 */
export async function probeFirebaseQuota(env: Env): Promise<boolean> {
  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId) return false;

  const probeUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/_health/probe`;

  try {
    const res = await fetch(probeUrl, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });

    // 429 means Quota Exceeded (Resource Exhausted)
    if (res.status === 429) {
      return false;
    }

    // 200, 404, or 403 (rules) all mean Firestore engine is UP and quota is NOT exhausted
    return true;
  } catch (err) {
    console.warn("[AutoSync] Probe network error:", err);
    return false;
  }
}

/**
 * Transform plain JSON values to Firestore REST API typed values
 */
function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === "string") return { stringValue: val };
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue),
      },
    };
  }
  if (typeof val === "object") {
    if (val.__timestamp) {
      return { timestampValue: new Date(val.__timestamp).toISOString() };
    }
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

/**
 * Replay a single pending operation to Firestore REST API
 */
async function replayOpToFirestore(op: any, projectId: string): Promise<boolean> {
  const path = op.path;
  if (!path) return true;

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;

  try {
    if (op.kind === "delete") {
      const res = await fetch(url, { method: "DELETE" });
      return res.status !== 429;
    }

    // create or update
    const fields: Record<string, any> = {};
    const rawData = op.data || {};
    for (const [k, v] of Object.entries(rawData)) {
      fields[k] = toFirestoreValue(v);
    }

    const body = JSON.stringify({ fields });
    const method = op.kind === "update" ? "PATCH" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (res.status === 429) {
      return false; // Quota hit again
    }

    return true;
  } catch (e) {
    console.warn("[AutoSync] Replay request error:", e);
    return false;
  }
}

/**
 * Cron scheduled job handler: Auto-sync pending R2 journal ops to Firebase
 */
export async function handleScheduledSync(env: Env): Promise<SyncResult> {
  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    return { success: false, attempted: 0, replayed: 0, failed: 0, quotaAvailable: false, error: "No FIREBASE_PROJECT_ID" };
  }

  // 1. Check if Firebase quota is available
  const quotaOk = await probeFirebaseQuota(env);
  if (!quotaOk) {
    console.info("[AutoSync] Firebase quota exhausted, skipping scheduled replay.");
    return { success: true, attempted: 0, replayed: 0, failed: 0, quotaAvailable: false };
  }

  // 2. Read pending journal operations from Cloudflare R2
  const bucket = getSnapshotBucket(env);
  const listed = await bucket.list({ prefix: "journal/pending/", limit: 100 });
  if (!listed.objects.length) {
    return { success: true, attempted: 0, replayed: 0, failed: 0, quotaAvailable: true };
  }

  let replayed = 0;
  let failed = 0;
  const collectionsToUpdate = new Set<string>();

  for (const objMeta of listed.objects) {
    try {
      const obj = await bucket.get(objMeta.key);
      if (!obj) continue;

      const record: any = await obj.json();
      const ok = await replayOpToFirestore(record, projectId);

      if (ok) {
        // Move to applied
        const appliedKey = `journal/applied/${objMeta.key.split("/").pop()}`;
        await bucket.put(appliedKey, JSON.stringify(record), {
          httpMetadata: { contentType: "application/json" },
          customMetadata: { replayedAt: new Date().toISOString(), syncedBy: "worker_cron" },
        });
        await bucket.delete(objMeta.key);

        if (record.opId) {
          await bucket.delete(`journal/index/${record.opId}.json`).catch(() => {});
        }

        if (record.path) {
          const col = record.path.split("/")[0];
          if (col) collectionsToUpdate.add(col);
        }

        replayed += 1;
      } else {
        failed += 1;
        break; // If quota hit during replay, stop early
      }
    } catch (err) {
      console.warn("[AutoSync] Failed processing op:", objMeta.key, err);
      failed += 1;
    }
  }

  // 3. Log sync summary to R2
  const today = todayUtc();
  const logKey = `system/sync-logs/${today}.json`;
  try {
    const existingObj = await bucket.get(logKey);
    const existingLogs: any[] = existingObj ? (await existingObj.json() as any[]) : [];
    existingLogs.push({
      timestamp: new Date().toISOString(),
      replayed,
      failed,
      pendingRemaining: listed.objects.length - replayed,
    });
    await bucket.put(logKey, JSON.stringify(existingLogs.slice(-50)), {
      httpMetadata: { contentType: "application/json" },
    });
  } catch {}

  console.info(`[AutoSync] Completed: ${replayed} replayed, ${failed} failed.`);
  return { success: true, attempted: listed.objects.length, replayed, failed, quotaAvailable: true };
}
