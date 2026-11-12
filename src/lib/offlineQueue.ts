import { collection, addDoc, doc, updateDoc, setDoc, deleteDoc } from "@/src/lib/firebase";
import { db, auth } from "./firebase";
import { syncOS, SyncOS, ActionPayload, QueuedOperation, ActionPriority, ActionType, QueueStatus, PayloadValidationResult, serializeData, deserializeClientData, normalizeFirestorePayload } from "./syncOS";

export { 
  syncOS, 
  SyncOS, 
  serializeData, 
  deserializeClientData, 
  normalizeFirestorePayload 
};

export type { 
  ActionPayload, 
  QueuedOperation, 
  ActionPriority, 
  ActionType, 
  QueueStatus, 
  PayloadValidationResult 
};

export const ADMIN_OR_STAFF_COLLECTIONS = new Set([
  'settings',
  'articles',
  'articleVersions',
  'categories',
  'announcements',
  'ads',
  'campaigns',
  'adCampaigns',
  'adCreatives',
  'auditLogs',
  'dualKeyApprovals',
  'disaster_recovery_logs',
  'archives',
  'snapshots',
  'roles',
  'permissions',
  'menus',
  'agents',
  'storyAssignments',
  'advertisers'
]);

export function isClientWriteAllowed(op: QueuedOperation): boolean {
  const { action } = op;
  const colName = action.collection;
  const type = (action.type as string) || '';
  const data = action.data;

  // 1. Explicit metadata authority check
  if ((action as any).authority === 'SERVER_ONLY' || (action as any).authority === 'ADMIN_ONLY' || (action as any).authority === 'EDITORIAL_SERVER_ONLY') {
    return false;
  }

  // 2. Publish operations must never fallback to client unless user is authenticated
  if (data?.status === 'published' || type.includes('PUBLISH') || type === 'ARTICLE_PUBLISH') {
    if (!auth.currentUser) return false;
  }

  // 3. Global settings, role changes, moderation, certification, admin config are server-only
  if (colName === 'settings' && data?.settingScope !== 'user') return false;
  if (type === 'SETTING_UPDATE' || type === 'GLOBAL_SETTINGS_UPDATE' || type === 'TENANT_SETTINGS_UPDATE') return false;
  if (type === 'ROLE_CHANGE' || type === 'USER_ROLE_UPDATE' || (colName === 'users' && data?.role !== undefined)) return false;
  if (type === 'MODERATION_ACTION' || colName === 'moderationActions' || colName === 'bannedUsers' || colName === 'reports' || colName === 'communityReports') return false;
  if (type === 'CERTIFICATE_ISSUE' || type === 'CERTIFICATION_UPDATE' || colName === 'certificate_verifications' || colName === 'certificates') return false;
  if (type === 'ADMIN_ACTION' || type === 'ADMIN_CONFIG_UPDATE' || type === 'SPONSOR_CAMPAIGN_UPDATE') return false;

  // 4. Restricted collections that require server-side execution
  const SERVER_ONLY_COLLECTIONS = new Set([
    'settings', 'menuItems', 'articleVersions', 'moderationActions', 'bannedUsers', 
    'certificate_verifications', 'certificates', 'notificationTemplates', 'notificationCampaigns', 
    'revenue_campaigns', 'store_order_audits', 'reports', 'communityReports'
  ]);

  if (SERVER_ONLY_COLLECTIONS.has(colName)) return false;

  return true;
}

/**
 * Legacy OfflineQueue wrapper delegating to SyncOS engine
 */
class OfflineQueue {
  public queueAction(action: Omit<ActionPayload, 'timestamp'>) {
    return syncOS.queueAction(action);
  }

  public async autoSync() {
    return syncOS.autoSync();
  }

  public async sync(force = false) {
    const res = await syncOS.processQueue(force);
    return res;
  }

  public async syncViaServer() {
    return syncOS.syncViaServer();
  }

  public getQueue() {
    return syncOS.getQueue();
  }

  public getQueueItems() {
    return syncOS.getQueue();
  }

  public getEventStore() {
    return syncOS.getEventStore();
  }

  public getPendingCount() {
    return syncOS.getPendingCount();
  }

  public getIsQuotaExceeded() {
    return syncOS.getIsQuotaExceeded();
  }

  public getStats() {
    return syncOS.getStats();
  }

  public cancelOperations(ids: string[]) {
    return syncOS.cancelOperations(ids);
  }

  public retryOperations(ids: string[]) {
    return syncOS.retryOperations(ids);
  }

  public clearEventStore() {
    return syncOS.clearEventStore();
  }

  public resetQuotaStatus() {
    return syncOS.resetQuotaStatus();
  }

  public exportQueueAsJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(syncOS.getQueue(), null, 2));
    if (typeof document !== 'undefined') {
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `pending_posts_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  }

  public importQueueFromJSON(jsonString: string) {
    try {
      const items = JSON.parse(jsonString);
      if (Array.isArray(items)) {
        let importedCount = 0;
        for (const item of items) {
          if (item && item.action && item.action.type) {
            syncOS.queueAction(item.action);
            importedCount++;
          } else if (item && item.type) {
            syncOS.queueAction(item);
            importedCount++;
          }
        }
        return { success: true, importedCount };
      }
    } catch (err: any) {
      console.error("Failed to import queue JSON:", err);
    }
    return { success: false, importedCount: 0 };
  }
}

export const offlineQueue = new OfflineQueue();

function extractCollectionAndDocId(docRef: any) {
  let colName = 'articles';
  let docId: string | undefined = undefined;

  if (docRef?.parent?.path) {
    colName = docRef.parent.path;
  } else if (docRef?.parent?.id) {
    colName = docRef.parent.id;
  } else if (docRef?.path) {
    const parts = docRef.path.split('/');
    if (parts.length > 1) {
      colName = parts[0];
      docId = parts[parts.length - 1];
    } else {
      colName = docRef.path;
    }
  } else if (typeof docRef === 'string') {
    const parts = docRef.split('/');
    if (parts.length > 1) {
      colName = parts[0];
      docId = parts[parts.length - 1];
    } else {
      colName = docRef;
    }
  }

  if (docRef?.id) {
    docId = docRef.id;
  }

  return { colName, docId };
}

export async function addDocWithQueue(collectionName: string, data: any) {
  let directDocId: string | null = null;
  let writeError: any = null;

  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    directDocId = docRef.id;
    console.log(`[SYNCOS_WRITE] canonical write success: ${collectionName}/${directDocId}`);
    
    if (collectionName === 'articles' && (data?.status === 'published' || data?.status === 'active')) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('content-mutated', {
          detail: {
            eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: 'ARTICLE_CREATED',
            entity: 'article',
            entityId: directDocId,
            operation: 'CREATE',
            data: { ...data, id: directDocId },
            userId: auth.currentUser?.uid,
            timestamp: new Date().toISOString()
          }
        }));
      }
    }
    return { id: directDocId, queued: false, directSuccess: true };
  } catch (err: any) {
    writeError = err;
    console.warn(`[SYNCOS_WRITE] Direct Firestore add failed for ${collectionName}:`, err?.message || err);
  }

  if (isPermissionError(writeError)) {
    return { id: 'permission_denied', queued: false, directSuccess: false, error: 'permission_denied' };
  }

  const isArticle = collectionName === 'articles';
  const actionType = isArticle ? 'ARTICLE_CREATE' : 'CUSTOM';

  console.log(`[SYNCOS_QUEUE] queued write: ${collectionName}`);
  syncOS.queueAction({
    type: actionType,
    collection: collectionName,
    docId: undefined,
    data,
    userId: auth.currentUser?.uid
  });
  return { id: 'queued', queued: true, directSuccess: false };
}

export async function updateDocWithQueue(docRef: any, data: any) {
  const { colName, docId } = extractCollectionAndDocId(docRef);
  let directSuccess = false;
  let writeError: any = null;

  try {
    const firestoreRef = (docRef && typeof docRef === 'object' && docRef.type === 'document')
      ? docRef
      : (colName && docId ? doc(db, colName, docId) : null);

    if (firestoreRef) {
      await updateDoc(firestoreRef, data);
      directSuccess = true;
      console.log(`[SYNCOS_WRITE] canonical write success: ${colName}/${docId}`);

      if (colName === 'articles' && (data?.status === 'published' || data?.status === 'active')) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('content-mutated', {
            detail: {
              eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              type: 'ARTICLE_UPDATED',
              entity: 'article',
              entityId: docId,
              operation: 'UPDATE',
              data: { ...data, id: docId },
              userId: auth.currentUser?.uid,
              timestamp: new Date().toISOString()
            }
          }));
        }
      }
      return { queued: false, directSuccess: true };
    }
  } catch (err: any) {
    writeError = err;
    console.warn(`[SYNCOS_WRITE] Direct Firestore update failed for ${colName}/${docId}:`, err?.message || err);
  }

  if (isPermissionError(writeError)) {
    return { queued: false, directSuccess: false, error: 'permission_denied' };
  }

  console.log(`[SYNCOS_QUEUE] queued update: ${colName}/${docId}`);
  syncOS.queueAction({
    type: colName === 'articles' ? 'ARTICLE_UPDATE' : 'CUSTOM',
    collection: colName,
    docId,
    data,
    userId: auth.currentUser?.uid
  });
  return { queued: true, directSuccess: false };
}

export async function setDocWithQueue(docRef: any, data: any, options?: any) {
  const { colName, docId } = extractCollectionAndDocId(docRef);
  let directSuccess = false;
  let writeError: any = null;

  try {
    const firestoreRef = (docRef && typeof docRef === 'object' && docRef.type === 'document')
      ? docRef
      : (colName && docId ? doc(db, colName, docId) : null);

    if (firestoreRef) {
      if (options) {
        await setDoc(firestoreRef, data, options);
      } else {
        await setDoc(firestoreRef, data);
      }
      directSuccess = true;
      console.log(`[SYNCOS_WRITE] canonical write success: ${colName}/${docId}`);

      if (colName === 'articles' && (data?.status === 'published' || data?.status === 'active')) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('content-mutated', {
            detail: {
              eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              type: 'ARTICLE_CREATED',
              entity: 'article',
              entityId: docId,
              operation: 'CREATE',
              data: { ...data, id: docId },
              userId: auth.currentUser?.uid,
              timestamp: new Date().toISOString()
            }
          }));
        }
      }
      return { queued: false, directSuccess: true };
    }
  } catch (err: any) {
    writeError = err;
    console.warn(`[SYNCOS_WRITE] Direct Firestore setDoc failed for ${colName}/${docId}:`, err?.message || err);
  }

  if (isPermissionError(writeError)) {
    return { queued: false, directSuccess: false, error: 'permission_denied' };
  }

  const isArticle = colName === 'articles';
  const actionType = isArticle ? (data?.status === 'published' ? 'ARTICLE_CREATE' : 'ARTICLE_UPDATE') : 'CUSTOM';

  console.log(`[SYNCOS_QUEUE] queued setDoc: ${colName}/${docId}`);
  syncOS.queueAction({
    type: actionType,
    collection: colName,
    docId,
    data,
    userId: auth.currentUser?.uid
  });
  return { queued: true, directSuccess: false };
}

export async function deleteDocWithQueue(docRef: any) {
  const { colName, docId } = extractCollectionAndDocId(docRef);
  let directSuccess = false;
  let writeError: any = null;

  try {
    const firestoreRef = (docRef && typeof docRef === 'object' && docRef.type === 'document')
      ? docRef
      : (colName && docId ? doc(db, colName, docId) : null);

    if (firestoreRef) {
      await deleteDoc(firestoreRef);
      directSuccess = true;
      console.log(`[SYNCOS_WRITE] canonical write success: ${colName}/${docId} (deleted)`);

      if (colName === 'articles') {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('content-mutated', {
            detail: {
              eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              type: 'ARTICLE_DELETED',
              entity: 'article',
              entityId: docId,
              operation: 'DELETE',
              userId: auth.currentUser?.uid,
              timestamp: new Date().toISOString()
            }
          }));
        }
      }
      return { queued: false, directSuccess: true };
    }
  } catch (err: any) {
    writeError = err;
    console.warn(`[SYNCOS_WRITE] Direct Firestore delete failed for ${colName}/${docId}:`, err?.message || err);
  }

  if (isPermissionError(writeError)) {
    return { queued: false, directSuccess: false, error: 'permission_denied' };
  }

  console.log(`[SYNCOS_QUEUE] queued delete: ${colName}/${docId}`);
  syncOS.queueAction({
    type: colName === 'articles' ? 'ARTICLE_DELETE' : 'CUSTOM',
    collection: colName,
    docId,
    userId: auth.currentUser?.uid
  });
  return { queued: true, directSuccess: false };
}

export function shouldEnqueueError(error: any) {
  if (isPermissionError(error)) {
    return false;
  }
  const msg = error?.message || "";
  const isQuota = msg.includes('resource-exhausted') || msg.includes('Quota exceeded');
  const isOffline = msg.includes('unavailable') || msg.includes('offline') || msg.includes('network');
  return isQuota || isOffline;
}

export function isPermissionError(error: any) {
  if (!error) return false;
  const code = (error.code || error.status || '').toString().toLowerCase();
  const msg = (error.message || (typeof error === 'string' ? error : '')).toString().toLowerCase();
  return (
    code.includes('permission-denied') ||
    code.includes('permission_denied') ||
    code === '403' ||
    msg.includes('permission') ||
    msg.includes('insufficient permissions') ||
    msg.includes('permission-denied') ||
    msg.includes('permission_denied') ||
    msg.includes('unauthorized') ||
    code.includes('unauthenticated') ||
    msg.includes('unauthenticated')
  );
}
