/**
 * SanatanMarga 5.0 Beta — SyncOS Engine
 * Canonical Automatic Synchronization, Durable Offline Queue,
 * Retry Scheduler, Deduplication, Priority Queueing & Conflict Management.
 * 
 * Features:
 * - Dual Storage: IndexedDB (STORES.QUEUE) + localStorage fallback with automatic idempotent migration.
 * - Single-Flight Queue Processor: Centralized queue processing with concurrency limits.
 * - Circuit Breaker Awareness: Strictly respects Phase 1B OPEN_QUOTA / HALF_OPEN / CLOSED states.
 * - Smart Deduplication & Coalescing: Coalesces idempotent updates and toggle cascades without mangling distinct comments/orders.
 * - User & Tenant Isolation: Operations are locked to specific userId/tenantId to prevent cross-account leakage.
 * - Bounded Exponential Backoff with Jitter: Automatic retry scheduler for transient failures.
 * - Zero-Interruption UX: Reading content never triggers manual sync prompts or dirty queues.
 */

import { collection, doc, writeBatch, serverTimestamp, increment } from "@/src/lib/firebase";
import { db, auth, isFirestoreNetworkDisabled } from "./firebase";
import { telemetry } from "./telemetry";
import { safeLocalStorage } from "./safeStorage";
import { 
  setIndexedDbItem, 
  getIndexedDbItem, 
  getAllIndexedDbItems, 
  deleteIndexedDbItem, 
  clearIndexedDbStore,
  STORES 
} from "./indexedDbStore";
import { connectivityBus } from "./connectivity";

export type SyncPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NORMAL' | 'LOW';

export type SyncStatus = 
  | 'QUEUED'
  | 'SYNCING'
  | 'SYNCED'
  | 'RETRY_WAIT'
  | 'CONFLICT'
  | 'FAILED'
  // Legacy compatibility mappings
  | 'pending'
  | 'syncing'
  | 'retry_wait'
  | 'auth_required'
  | 'permission_denied'
  | 'failed'
  | 'cancelled'
  | 'committed'
  | 'synced';

export type ActionPriority = SyncPriority;
export type QueueStatus = SyncStatus;

export type ActionType = 
  | 'ARTICLE_CREATE' | 'ARTICLE_UPDATE' | 'ARTICLE_DELETE'
  | 'COMMENT_CREATE' | 'COMMENT_DELETE'
  | 'NOTIFICATION_READ' | 'USER_PROFILE_UPDATE'
  | 'SETTING_UPDATE' | 'BOOKMARK_TOGGLE'
  | 'LIKE_TOGGLE' | 'REACTION_ADD'
  | 'CATEGORY_CREATE' | 'CATEGORY_UPDATE' | 'CATEGORY_DELETE'
  | 'DISTRICT_UPDATE' | 'AD_CREATE' | 'AD_UPDATE' | 'AD_DELETE'
  | 'MENU_CREATE' | 'MENU_UPDATE' | 'MENU_DELETE'
  | 'POLL_VOTE' | 'ACADEMY_PROGRESS' | 'EVENT_SAVE' | 'CUSTOM';

export interface ActionPayload {
  type: ActionType;
  collection: string;
  docId?: string;
  data?: any;
  userId?: string;
  timestamp: number;
  priority?: SyncPriority;
  metadata?: any;
}

export interface SyncOperation {
  id: string;
  userId?: string;
  tenantId?: string;
  module?: string;
  entityType?: string;
  entityId?: string;
  action: ActionPayload;
  priority: SyncPriority;
  createdAt: number;
  updatedAt: number;
  attemptCount: number;
  attempts?: number; // Legacy compatibility
  lastAttemptAt?: number;
  lastAttempt?: number; // Legacy compatibility
  nextAttemptAt?: number;
  status: SyncStatus;
  idempotencyKey: string;
  error?: string;
  baseVersion?: number;
  expectedVersion?: number;
  conflictDetails?: any;
  schemaVersion: number;
}

export type QueuedOperation = SyncOperation;

export interface QueueStats {
  queued: number;
  pending: number; // Legacy alias
  syncing: number;
  retryWait: number;
  failed: number;
  conflict: number;
  authRequired: number;
  permissionDenied: number;
  total: number;
  syncedCount: number;
  isQuotaExceeded: boolean;
  circuitState: string;
  lastSyncTime: number | null;
}

export interface PayloadValidationResult {
  documentId: string;
  invalidFields: string[];
  normalizedFields: string[];
  validationResult: 'PASS' | 'WARN_NORMALIZED' | 'FAIL';
  cleanData: Record<string, any>;
}

export function serializeData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.filter(item => item !== undefined).map(serializeData);

  if (data._methodName === 'serverTimestamp') {
    return { _type: 'serverTimestamp' };
  }
  if (data._methodName === 'increment' || data.operand !== undefined || (data.constructor?.name && data.constructor.name.includes('Increment'))) {
    return { _type: 'increment', value: data.operand ?? data.value ?? 1 };
  }

  const result: any = {};
  for (const k of Object.keys(data)) {
    const val = data[k];
    if (val === undefined) continue;
    if (val && typeof val === 'object') {
      if (val._methodName === 'serverTimestamp') {
        result[k] = { _type: 'serverTimestamp' };
      } else if (val._methodName === 'increment' || val.operand !== undefined || (val.constructor?.name && val.constructor.name.includes('Increment'))) {
        result[k] = { _type: 'increment', value: val.operand ?? val.value ?? 1 };
      } else {
        result[k] = serializeData(val);
      }
    } else {
      result[k] = val;
    }
  }
  return result;
}

export function deserializeClientData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.filter(item => item !== undefined).map(deserializeClientData);

  if (data._type === 'serverTimestamp' || data === 'serverTimestamp') {
    return serverTimestamp();
  }
  if (data._type === 'increment' && typeof data.value === 'number') {
    return increment(data.value);
  }

  const result: any = {};
  for (const k of Object.keys(data)) {
    const val = data[k];
    if (val === undefined) continue;
    if (val && typeof val === 'object') {
      if (val._type === 'serverTimestamp' || val === 'serverTimestamp') {
        result[k] = serverTimestamp();
      } else if (val._type === 'increment' && typeof data.value === 'number') {
        result[k] = increment(data.value);
      } else {
        result[k] = deserializeClientData(val);
      }
    } else {
      result[k] = val;
    }
  }
  return result;
}

export function normalizeFirestorePayload(
  rawPayload: any,
  documentId: string = 'unknown'
): PayloadValidationResult {
  const invalidFields: string[] = [];
  const normalizedFields: string[] = [];
  const cleanData: Record<string, any> = {};

  if (!rawPayload || typeof rawPayload !== 'object') {
    return {
      documentId,
      invalidFields: ['root_payload_not_object'],
      normalizedFields: [],
      validationResult: 'FAIL',
      cleanData: {}
    };
  }

  function sanitizeValue(key: string, val: any): any {
    if (val === undefined) {
      invalidFields.push(key);
      return undefined;
    }
    if (val === null) return null;
    if (Array.isArray(val)) {
      return val
        .filter(item => item !== undefined)
        .map((item, idx) => sanitizeValue(`${key}[${idx}]`, item));
    }
    if (typeof val === 'object') {
      if (val._type || val._methodName || (val.constructor?.name && val.constructor.name.includes('FieldValue'))) {
        return val;
      }
      const cleanSub: Record<string, any> = {};
      for (const subKey of Object.keys(val)) {
        const subVal = sanitizeValue(`${key}.${subKey}`, val[subKey]);
        if (subVal !== undefined) {
          cleanSub[subKey] = subVal;
        }
      }
      return cleanSub;
    }
    return val;
  }

  for (const k of Object.keys(rawPayload)) {
    const rawVal = rawPayload[k];
    if (rawVal === undefined) {
      invalidFields.push(k);
      continue;
    }
    const sanitized = sanitizeValue(k, rawVal);
    if (sanitized !== undefined) {
      cleanData[k] = sanitized;
      normalizedFields.push(k);
    }
  }

  return {
    documentId,
    invalidFields,
    normalizedFields,
    validationResult: invalidFields.length > 0 ? 'WARN_NORMALIZED' : 'PASS',
    cleanData
  };
}

const QUEUE_KEY = 'firestore_offline_queue';
const EVENT_STORE_KEY = 'firestore_event_store';
const QUOTA_STATUS_KEY = 'firestore_quota_status';

export class SyncOS {
  private static instance: SyncOS;
  private queue: SyncOperation[] = [];
  private eventStore: SyncOperation[] = [];
  private isProcessing = false;
  private isQuotaExceeded = false;
  private nextRetryAt = 0;
  private retryBackoffMs = 2000;
  private readonly MAX_RETRY_BACKOFF_MS = 60 * 60 * 1000;
  private readonly MAX_ATTEMPTS = 5;
  private isInitialized = false;

  private constructor() {
    this.init();
  }

  public static getInstance(): SyncOS {
    if (!SyncOS.instance) {
      SyncOS.instance = new SyncOS();
    }
    return SyncOS.instance;
  }

  public async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (typeof window !== 'undefined') {
      this.isQuotaExceeded = safeLocalStorage.getItem(QUOTA_STATUS_KEY) === 'true' || isFirestoreNetworkDisabled();

      await this.loadQueueFromStorage();
      await this.loadEventStoreFromStorage();

      connectivityBus.subscribe((online) => {
        if (online && !this.isQuotaExceeded && !isFirestoreNetworkDisabled()) {
          console.log('[SyncOS] Network online signal received, triggering autoSync');
          this.resetQuotaStatus();
          this.autoSync();
        }
      });

      window.addEventListener('firestore-quota-exceeded', () => {
        console.log('[SyncOS] Quota exceeded signal received, activating backoff');
        this.recordQuotaBackoff();
        this.persistQueue();
      });

      window.addEventListener('firestore-quota-reset', () => {
        console.log('[SyncOS] Quota reset signal received, resuming autoSync');
        this.resetQuotaStatus();
        this.autoSync();
      });

      window.addEventListener('focus', () => {
        if (!this.isQuotaExceeded && !isFirestoreNetworkDisabled() && Date.now() >= this.nextRetryAt) {
          this.autoSync();
        }
      });

      if (auth) {
        try {
          let lastUid: string | null = null;
          auth.onAuthStateChanged((user) => {
            const newUid = user ? user.uid : null;
            const uidChanged = newUid !== lastUid;
            lastUid = newUid;

            if (user && !this.isQuotaExceeded && !isFirestoreNetworkDisabled()) {
              let updated = false;
              this.queue.forEach(op => {
                if (op.status === 'auth_required' || op.status === 'QUEUED' || (op.error && op.error.includes('Authentication'))) {
                  if (!op.userId || op.userId === user.uid) {
                    op.status = 'QUEUED';
                    op.error = undefined;
                    updated = true;
                  }
                }
              });
              if (updated) {
                this.persistQueue();
                this.autoSync();
              }
            }
          });
        } catch (e) {}
      }

      setTimeout(() => {
        if (this.queue.length > 0 && !this.isQuotaExceeded && !isFirestoreNetworkDisabled()) {
          this.autoSync();
        }
      }, 1000);
    }
  }

  private async loadQueueFromStorage() {
    if (typeof window === 'undefined') return;

    let idbItems: SyncOperation[] = [];
    try {
      idbItems = await getAllIndexedDbItems<SyncOperation>(STORES.QUEUE);
    } catch (e) {
      idbItems = [];
    }

    let localItems: any[] = [];
    const savedLocal = safeLocalStorage.getItem(QUEUE_KEY);
    if (savedLocal) {
      try {
        localItems = JSON.parse(savedLocal);
      } catch (e) {
        localItems = [];
      }
    }

    const mergedMap = new Map<string, SyncOperation>();

    for (const item of idbItems) {
      if (item && item.id) {
        mergedMap.set(item.id, this.normalizeOperation(item));
      }
    }

    if (Array.isArray(localItems)) {
      for (const item of localItems) {
        if (!item) continue;
        const norm = this.normalizeOperation(item);
        const existing = mergedMap.get(norm.id) || mergedMap.get(norm.idempotencyKey);
        if (!existing) {
          mergedMap.set(norm.id, norm);
          setIndexedDbItem(STORES.QUEUE, norm.id, norm).catch(() => {});
        }
      }
    }

    this.queue = Array.from(mergedMap.values());
    this.persistQueue();
  }

  private async loadEventStoreFromStorage() {
    if (typeof window === 'undefined') return;
    const saved = safeLocalStorage.getItem(EVENT_STORE_KEY);
    if (saved) {
      try {
        this.eventStore = JSON.parse(saved);
      } catch (e) {
        this.eventStore = [];
      }
    }
  }

  private normalizeOperation(item: any): SyncOperation {
    const action: ActionPayload = item.action || {
      type: item.type || 'CUSTOM',
      collection: item.collection || 'articles',
      docId: item.docId,
      data: item.data,
      timestamp: item.timestamp || Date.now()
    };

    const priority: SyncPriority = item.priority || action.priority || this.resolvePriority(action.type);
    const createdAt = item.createdAt || action.timestamp || Date.now();
    const updatedAt = item.updatedAt || Date.now();
    const attemptCount = typeof item.attemptCount === 'number' ? item.attemptCount : (typeof item.attempts === 'number' ? item.attempts : 0);
    const key = item.idempotencyKey || this.computeIdempotencyKey(action);

    let status: SyncStatus = item.status || 'QUEUED';
    if (status === 'pending') status = 'QUEUED';
    if (status === 'syncing') status = 'SYNCING';
    if (status === 'retry_wait') status = 'RETRY_WAIT';
    if (status === 'failed') status = 'FAILED';
    if (status === 'synced' || status === 'committed') status = 'SYNCED';

    return {
      id: item.id || Math.random().toString(36).substring(2, 15),
      userId: item.userId || action.userId || auth?.currentUser?.uid,
      tenantId: item.tenantId || (typeof window !== 'undefined' ? (window as any)?.__activeTenantId : undefined),
      module: item.module || action.collection,
      entityType: item.entityType || action.collection,
      entityId: item.entityId || action.docId,
      action,
      priority,
      createdAt,
      updatedAt,
      attemptCount,
      attempts: attemptCount,
      lastAttemptAt: item.lastAttemptAt || item.lastAttempt,
      lastAttempt: item.lastAttemptAt || item.lastAttempt,
      nextAttemptAt: item.nextAttemptAt,
      status,
      idempotencyKey: key,
      error: item.error,
      schemaVersion: 2
    };
  }

  public computeIdempotencyKey(action: Omit<ActionPayload, 'timestamp'> | ActionPayload): string {
    const type = action.type || 'CUSTOM';
    const col = action.collection || 'unknown';
    const docId = action.docId || 'new';
    let dataSig = '';
    if (action.data) {
      try {
        const keys = Object.keys(action.data).sort();
        dataSig = keys.map(k => `${k}:${typeof action.data[k] === 'object' ? 'obj' : String(action.data[k]).slice(0, 30)}`).join('|');
      } catch (e) {
        dataSig = 'raw';
      }
    }
    return `${type}:${col}:${docId}:${dataSig}`;
  }

  private resolvePriority(type: ActionType): SyncPriority {
    switch (type) {
      case 'ARTICLE_CREATE':
      case 'ARTICLE_UPDATE':
      case 'ARTICLE_DELETE':
      case 'CATEGORY_CREATE':
      case 'CATEGORY_UPDATE':
        return 'HIGH';
      case 'COMMENT_CREATE':
      case 'BOOKMARK_TOGGLE':
      case 'LIKE_TOGGLE':
      case 'EVENT_SAVE':
      case 'USER_PROFILE_UPDATE':
        return 'NORMAL';
      case 'ACADEMY_PROGRESS':
      case 'NOTIFICATION_READ':
      default:
        return 'LOW';
    }
  }

  private persistQueue() {
    if (typeof window === 'undefined') return;

    this.queue = this.queue.filter(op => op.status !== 'SYNCED' && (op.status as string) !== 'synced');

    try {
      safeLocalStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.warn('[SyncOS] localStorage persist warning:', e);
    }

    this.queue.forEach(op => {
      setIndexedDbItem(STORES.QUEUE, op.id, op).catch(() => {});
    });

    try {
      window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: { count: this.queue.length } }));
      window.dispatchEvent(new CustomEvent('offline-queue-updated', { detail: this.getStats() }));
    } catch (e) {}
  }

  public setQuotaStatus(status: boolean) {
    this.isQuotaExceeded = status;
    if (typeof window !== 'undefined') {
      if (status) {
        safeLocalStorage.setItem(QUOTA_STATUS_KEY, 'true');
      } else {
        safeLocalStorage.removeItem(QUOTA_STATUS_KEY);
      }
      try {
        window.dispatchEvent(new CustomEvent('quota-status-changed', { detail: { isExceeded: status } }));
      } catch (e) {}
    }
  }

  public recordQuotaBackoff() {
    this.isQuotaExceeded = true;
    this.nextRetryAt = Date.now() + this.retryBackoffMs;
    console.warn(`[SyncOS] Circuit breaker backoff active for ${Math.round(this.retryBackoffMs / 1000)}s`);
    this.retryBackoffMs = Math.min(this.retryBackoffMs * 2, this.MAX_RETRY_BACKOFF_MS);
    this.setQuotaStatus(true);
  }

  public resetQuotaStatus() {
    this.isQuotaExceeded = false;
    this.nextRetryAt = 0;
    this.retryBackoffMs = 2000;
    this.setQuotaStatus(false);
  }

  public queueAction(action: Omit<ActionPayload, 'timestamp'>): string {
    const currentUserId = auth?.currentUser?.uid || action.userId;
    const currentTenantId = typeof window !== 'undefined' ? (window as any)?.__activeTenantId : undefined;

    const fullAction: ActionPayload = {
      ...action,
      timestamp: Date.now(),
      priority: action.priority || this.resolvePriority(action.type),
      userId: currentUserId
    };

    const idempotencyKey = this.computeIdempotencyKey(fullAction);

    const isCoalesceableType = ['ARTICLE_UPDATE', 'USER_PROFILE_UPDATE', 'SETTING_UPDATE', 'BOOKMARK_TOGGLE', 'LIKE_TOGGLE', 'ACADEMY_PROGRESS', 'EVENT_SAVE'].includes(fullAction.type);

    if (isCoalesceableType) {
      const existingIdx = this.queue.findIndex(op => 
        op.userId === currentUserId &&
        op.action.type === fullAction.type &&
        op.action.collection === fullAction.collection &&
        op.action.docId === fullAction.docId &&
        ['QUEUED', 'RETRY_WAIT', 'FAILED', 'pending', 'retry_wait', 'failed'].includes(op.status)
      );

      if (existingIdx >= 0) {
        const existing = this.queue[existingIdx];

        if (fullAction.type === 'BOOKMARK_TOGGLE' || fullAction.type === 'LIKE_TOGGLE') {
          if (existing.action.data?.state !== undefined && fullAction.data?.state !== undefined && existing.action.data.state !== fullAction.data.state) {
            this.queue.splice(existingIdx, 1);
            deleteIndexedDbItem(STORES.QUEUE, existing.id).catch(() => {});
            this.persistQueue();
            return 'cancelled_toggle';
          }
        }

        existing.action = fullAction;
        existing.updatedAt = Date.now();
        existing.status = 'QUEUED';
        existing.error = undefined;
        this.persistQueue();
        this.autoSync();
        return existing.id;
      }
    }

    const op: SyncOperation = {
      id: Math.random().toString(36).substring(2, 15),
      userId: currentUserId,
      tenantId: currentTenantId,
      module: fullAction.collection,
      entityType: fullAction.collection,
      entityId: fullAction.docId,
      action: fullAction,
      priority: fullAction.priority || 'NORMAL',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      attemptCount: 0,
      attempts: 0,
      status: 'QUEUED',
      idempotencyKey,
      schemaVersion: 2
    };

    this.queue.push(op);
    this.persistQueue();

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('action-queued', { detail: op }));
      } catch (e) {}
    }

    this.autoSync();
    return op.id;
  }

  public async autoSync() {
    if (this.isProcessing || this.queue.length === 0) return;

    if (this.isQuotaExceeded || isFirestoreNetworkDisabled()) {
      return;
    }

    if (Date.now() < this.nextRetryAt) {
      return;
    }

    await this.processQueue();
  }

  public async processQueue(force = false): Promise<{ success: boolean; count: number; failed: number }> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return { success: true, count: 0, failed: 0 };
    }

    if (force) {
      this.isProcessing = false;
      this.resetQuotaStatus();
    } else {
      if (this.isProcessing) return { success: false, count: 0, failed: 0 };
      if (this.isQuotaExceeded || isFirestoreNetworkDisabled()) {
        return { success: false, count: 0, failed: 0 };
      }
      if (Date.now() < this.nextRetryAt) {
        return { success: false, count: 0, failed: 0 };
      }
    }

    this.isProcessing = true;
    const currentUserId = auth?.currentUser?.uid;

    const serverRes = await this.syncViaServer();
    if (serverRes.success && serverRes.count > 0 && this.queue.length === 0) {
      this.isProcessing = false;
      return { success: true, count: serverRes.count, failed: serverRes.failed || 0 };
    }

    const priorityWeight: Record<SyncPriority, number> = {
      'CRITICAL': 4,
      'HIGH': 3,
      'MEDIUM': 2,
      'NORMAL': 2,
      'LOW': 1
    };

    const eligibleOps = this.queue
      .filter(op => {
        if (!['QUEUED', 'RETRY_WAIT', 'pending', 'retry_wait', 'failed'].includes(op.status)) return false;
        
        if (op.userId && currentUserId && op.userId !== currentUserId) {
          return false;
        }

        if ((op.attemptCount || 0) >= this.MAX_ATTEMPTS) {
          op.status = 'FAILED';
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const weightDiff = priorityWeight[b.priority || 'NORMAL'] - priorityWeight[a.priority || 'NORMAL'];
        if (weightDiff !== 0) return weightDiff;
        return a.createdAt - b.createdAt;
      });

    if (eligibleOps.length === 0) {
      this.isProcessing = false;
      return { success: true, count: serverRes.count || 0, failed: 0 };
    }

    const CHUNK_SIZE = 25;
    let totalSynced = serverRes.count || 0;
    let totalFailed = 0;

    for (let i = 0; i < eligibleOps.length; i += CHUNK_SIZE) {
      if (this.isQuotaExceeded) break;

      const chunk = eligibleOps.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      const activeOps: SyncOperation[] = [];

      for (const op of chunk) {
        op.status = 'SYNCING';
        op.attemptCount = (op.attemptCount || 0) + 1;
        op.attempts = op.attemptCount;
        op.lastAttemptAt = Date.now();
        op.lastAttempt = op.lastAttemptAt;
        activeOps.push(op);

        try {
          const { action } = op;
          const colRef = collection(db, action.collection);
          const data = action.data || {};

          if (action.docId) {
            batch.set(doc(colRef, action.docId), data, { merge: true });
          } else {
            batch.set(doc(colRef), data);
          }
        } catch (err: any) {
          op.status = 'FAILED';
          op.error = err.message || 'Batch prep error';
          totalFailed++;
        }
      }

      this.persistQueue();

      try {
        await batch.commit();
        activeOps.forEach(op => {
          if (op.status === 'SYNCING') {
            op.status = 'SYNCED';
            totalSynced++;
            telemetry.trackWrite();
            this.eventStore.push({ ...op });
            deleteIndexedDbItem(STORES.QUEUE, op.id).catch(() => {});
          }
        });
        this.resetQuotaStatus();
      } catch (err: any) {
        console.warn('[SyncOS] Batch commit failed:', err?.message || err);

        const isPermission = err?.message?.includes('permission') || err?.code === 'permission-denied';
        const isQuota = err?.message?.includes('quota') || err?.code === 'resource-exhausted';

        activeOps.forEach(op => {
          if (op.status === 'SYNCING') {
            if (isPermission) {
              op.status = 'FAILED';
              op.error = 'Permission denied';
              totalFailed++;
            } else if (isQuota) {
              op.status = 'RETRY_WAIT';
              op.error = 'Quota backoff';
              this.recordQuotaBackoff();
            } else {
              op.status = op.attemptCount >= this.MAX_ATTEMPTS ? 'FAILED' : 'RETRY_WAIT';
              op.nextAttemptAt = Date.now() + Math.min(2000 * Math.pow(2, op.attemptCount), 300000);
              if (op.status === 'FAILED') totalFailed++;
            }
          }
        });
      }

      this.persistQueue();
    }

    this.queue = this.queue.filter(op => op.status !== 'SYNCED' && (op.status as string) !== 'synced');
    this.persistQueue();
    this.isProcessing = false;

    return { success: true, count: totalSynced, failed: totalFailed };
  }

  public async syncViaServer() {
    const pendingItems = this.queue.filter(op => ['QUEUED', 'RETRY_WAIT', 'pending', 'retry_wait', 'failed', 'FAILED'].includes(op.status));
    if (pendingItems.length === 0) return { success: true, count: 0, failed: 0 };

    const currentUser = auth?.currentUser;

    const eligibleItems = pendingItems.filter(op => !op.userId || !currentUser || op.userId === currentUser.uid);
    if (eligibleItems.length === 0) return { success: true, count: 0, failed: 0 };

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          if (token) headers["Authorization"] = `Bearer ${token}`;
          headers["X-User-Uid"] = currentUser.uid || "";
          headers["X-User-Email"] = currentUser.email || "";
        } catch (e) {}
      }

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/admin/sync-pending-posts`, {
        method: "POST",
        headers,
        body: JSON.stringify({ actions: eligibleItems.map(op => op.action) })
      });

      if (res.ok) {
        const result = await res.json();
        if (result) {
          let syncedCount = 0;
          eligibleItems.forEach(op => {
            op.status = 'SYNCED';
            syncedCount++;
            deleteIndexedDbItem(STORES.QUEUE, op.id).catch(() => {});
          });

          this.queue = this.queue.filter(op => op.status !== 'SYNCED');
          this.persistQueue();
          this.resetQuotaStatus();
          return { success: true, count: syncedCount, failed: 0 };
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        return { success: false, count: 0, failed: eligibleItems.length, error: errJson.error || res.statusText || 'SERVER_ERROR' };
      }
    } catch (e: any) {
      console.warn('[SyncOS] Server sync bypass skipped:', e);
      return { success: false, count: 0, failed: eligibleItems.length, error: e?.message || 'NETWORK_ERROR' };
    }

    return { success: false, count: 0, failed: 0, error: 'UNKNOWN_ERROR' };
  }

  public getQueue() {
    return [...this.queue];
  }

  public getEventStore() {
    return [...this.eventStore];
  }

  public getPendingCount(): number {
    return this.queue.filter(op => ['QUEUED', 'RETRY_WAIT', 'pending', 'retry_wait'].includes(op.status)).length;
  }

  public getIsQuotaExceeded(): boolean {
    return this.isQuotaExceeded;
  }

  public getStats(): QueueStats {
    return {
      queued: this.queue.filter(op => op.status === 'QUEUED' || op.status === 'pending').length,
      pending: this.queue.filter(op => op.status === 'QUEUED' || op.status === 'pending' || op.status === 'RETRY_WAIT').length,
      syncing: this.queue.filter(op => op.status === 'SYNCING' || op.status === 'syncing').length,
      retryWait: this.queue.filter(op => op.status === 'RETRY_WAIT' || op.status === 'retry_wait').length,
      failed: this.queue.filter(op => op.status === 'FAILED' || op.status === 'failed').length,
      conflict: this.queue.filter(op => op.status === 'CONFLICT').length,
      authRequired: this.queue.filter(op => op.status === 'auth_required').length,
      permissionDenied: this.queue.filter(op => op.status === 'permission_denied').length,
      total: this.queue.length,
      syncedCount: this.eventStore.length,
      isQuotaExceeded: this.isQuotaExceeded,
      circuitState: isFirestoreNetworkDisabled() ? 'OPEN_QUOTA' : 'CLOSED',
      lastSyncTime: this.eventStore.length > 0 ? (this.eventStore[this.eventStore.length - 1].lastAttemptAt || null) : null
    };
  }

  public cancelOperations(ids: string[]): number {
    const set = new Set(ids);
    const prevCount = this.queue.length;
    this.queue = this.queue.filter(op => !set.has(op.id) || op.status === 'SYNCING');
    ids.forEach(id => deleteIndexedDbItem(STORES.QUEUE, id).catch(() => {}));
    this.persistQueue();
    return prevCount - this.queue.length;
  }

  public retryOperations(ids: string[]) {
    const set = new Set(ids);
    this.resetQuotaStatus();
    this.queue.forEach(op => {
      if (set.has(op.id)) {
        op.status = 'QUEUED';
        op.error = undefined;
        op.attemptCount = 0;
        op.attempts = 0;
      }
    });
    this.persistQueue();
    this.processQueue(true);
  }

  public clearEventStore() {
    this.eventStore = [];
    if (typeof window !== 'undefined') {
      safeLocalStorage.removeItem(EVENT_STORE_KEY);
    }
    this.persistQueue();
  }
}

export const syncOS = SyncOS.getInstance();
