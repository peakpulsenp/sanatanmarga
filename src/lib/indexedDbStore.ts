/**
 * Sanatan Marga — Snapshot OS v5
 * IndexedDB Enterprise Storage Engine
 * 
 * High-performance client database replacing LocalStorage for bulk datasets.
 * Manages object stores for snapshots, articles, comments, community posts, ads,
 * media assets, notifications, events, knowledge nodes, telemetry, and offline mutations.
 */

const DB_NAME = 'sanatan_snapshot_db';
const DB_VERSION = 1;

export interface StorageQuotaInfo {
  usage: number;
  quota: number;
  percentUsed: number;
}

export const STORES = {
  SNAPSHOTS: 'snapshots',
  ARTICLES: 'articles',
  COMMENTS: 'comments',
  COMMUNITY_POSTS: 'community_posts',
  ADS: 'ads',
  MEDIA_ASSETS: 'media_assets',
  NOTIFICATIONS: 'notifications',
  EVENTS: 'events',
  KNOWLEDGE_NODES: 'knowledge_nodes',
  TELEMETRY: 'telemetry',
  QUEUE: 'queue',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

let dbPromise: Promise<IDBDatabase> | null = null;

function isIndexedDbSupported(): boolean {
  return typeof window !== 'undefined' && Boolean(window.indexedDB);
}

function getDB(): Promise<IDBDatabase> {
  if (!isIndexedDbSupported()) {
    return Promise.reject(new Error('IndexedDB is not supported in this environment'));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      Object.values(STORES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          if (storeName === STORES.QUEUE) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          } else if (storeName === STORES.SNAPSHOTS) {
            db.createObjectStore(storeName, { keyPath: 'version' });
          } else {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            store.createIndex('updatedAt', 'updatedAt', { unique: false });
          }
        }
      });
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };

      resolve(db);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

export async function setIndexedDbItem<T extends { id?: string; [key: string]: any }>(
  storeName: StoreName,
  key: string,
  data: T
): Promise<void> {
  if (!isIndexedDbSupported()) return;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const record = { ...data, id: data.id || key, _updatedAt: Date.now() };
      const req = store.put(record);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // Quiet fallback
  }
}

export async function setIndexedDbBulk<T extends { id?: string; [key: string]: any }>(
  storeName: StoreName,
  items: T[]
): Promise<void> {
  if (!isIndexedDbSupported()) return;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      items.forEach((item) => {
        const id = item.id || item.slug || item.key || JSON.stringify(item);
        store.put({ ...item, id, _updatedAt: Date.now() });
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    // Quiet fallback
  }
}

export async function getIndexedDbItem<T>(storeName: StoreName, key: string): Promise<T | null> {
  if (!isIndexedDbSupported()) return null;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);

      req.onsuccess = () => resolve((req.result as T) || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    return null;
  }
}

export async function getAllIndexedDbItems<T>(storeName: StoreName): Promise<T[]> {
  if (!isIndexedDbSupported()) return [];
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    return [];
  }
}

export async function deleteIndexedDbItem(storeName: StoreName, key: string): Promise<void> {
  if (!isIndexedDbSupported()) return;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // Quiet fallback
  }
}

export async function clearIndexedDbStore(storeName: StoreName): Promise<void> {
  if (!isIndexedDbSupported()) return;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // Quiet fallback
  }
}

export async function getStorageQuota(): Promise<StorageQuotaInfo | null> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const { usage, quota } = await navigator.storage.estimate();
      const usageBytes = usage || 0;
      const quotaBytes = quota || 1;
      return {
        usage: usageBytes,
        quota: quotaBytes,
        percentUsed: Number(((usageBytes / quotaBytes) * 100).toFixed(2)),
      };
    } catch (e) {
      console.warn('Storage estimate failed:', e);
    }
  }
  return null;
}
