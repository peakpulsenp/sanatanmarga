/**
 * Local demo data store.
 *
 * This replaces the hosted Firebase/Firestore backend with a local-first,
 * in-browser data layer so the full SanatanMarga UI (including admin screens)
 * runs without cloud credentials. Reads come from /demo/seed.json plus any
 * edits stored in localStorage. Writes are persisted locally.
 */

import {
  setIndexedDbItem,
  getIndexedDbItem,
  getAllIndexedDbItems,
  deleteIndexedDbItem,
} from "./indexedDbStore";

export type DemoDocument = Record<string, any>;

const DB_STORAGE_KEY = "sm_demo_db_overrides_v1";
const SEED_URL = "/demo/seed.json";
const EVENT_NAME = "sm-demo-db-changed";

interface Overrides {
  sets: Record<string, DemoDocument>;
  deletes: string[];
  customCollections: Record<string, DemoDocument[]>;
}

const emptyOverrides = (): Overrides => ({ sets: {}, deletes: [], customCollections: {} });

let overrides: Overrides = emptyOverrides();
let baseCollections: Record<string, DemoDocument[]> = {};
let baseDocuments: Record<string, DemoDocument> = {};
let readyPromise: Promise<void> | null = null;
let memoryDb: Record<string, Map<string, DemoDocument>> = {};
let loaded = false;

const listeners = new Map<string, Set<(payload: any) => void>>();

function loadOverrides() {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      overrides = {
        sets: parsed?.sets && typeof parsed.sets === "object" ? parsed.sets : {},
        deletes: Array.isArray(parsed?.deletes) ? parsed.deletes : [],
        customCollections:
          parsed?.customCollections && typeof parsed.customCollections === "object"
            ? parsed.customCollections
            : {},
      };
    }
  } catch {
    overrides = emptyOverrides();
  }
}

function saveOverrides() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // storage may be full or blocked - keep working in memory
  }
}

function buildMemoryDb() {
  memoryDb = {};
  const put = (path: string, data: DemoDocument) => {
    const slash = path.lastIndexOf("/");
    if (slash < 0) return;
    const col = path.slice(0, slash);
    const id = path.slice(slash + 1);
    if (!memoryDb[col]) memoryDb[col] = new Map();
    memoryDb[col].set(id, { id, ...data });
  };

  for (const [col, docs] of Object.entries(baseCollections)) {
    for (const doc of docs) {
      if (doc && doc.id !== undefined) put(`${col}/${doc.id}`, doc);
    }
  }
  for (const [path, doc] of Object.entries(baseDocuments)) put(path, doc);

  for (const [path, doc] of Object.entries(overrides.sets)) put(path, doc);
  for (const path of overrides.deletes) {
    const slash = path.lastIndexOf("/");
    const col = path.slice(0, slash);
    const id = path.slice(slash + 1);
    memoryDb[col]?.delete(id);
  }
  for (const [col, docs] of Object.entries(overrides.customCollections)) {
    if (!memoryDb[col]) memoryDb[col] = new Map();
    for (const doc of docs) {
      if (doc && doc.id !== undefined) memoryDb[col].set(String(doc.id), { id: String(doc.id), ...doc });
    }
  }
}

export function isDemoDbReady(): boolean {
  return loaded;
}

export function ensureDemoDb(): Promise<void> {
  if (readyPromise) return readyPromise;
  loadOverrides();
  readyPromise = (async () => {
    try {
      const res = await fetch(SEED_URL, { cache: "no-cache" });
      if (res.ok) {
        const seed = await res.json();
        baseCollections = seed?.collections || {};
        baseDocuments = seed?.documents || {};
      } else {
        console.warn("[DemoDB] Seed not found at", SEED_URL, "- starting with empty data");
      }
    } catch (err) {
      console.warn("[DemoDB] Could not load seed:", err);
    }
    try {
      const stores = [
        "snapshots",
        "articles",
        "events",
        "comments",
        "community_posts",
        "knowledge_nodes",
        "notifications",
        "ads",
        "media_assets",
      ] as const;
      for (const st of stores) {
        const items = await getAllIndexedDbItems<any>(st as any);
        if (Array.isArray(items)) {
          for (const item of items) {
            if (st === "snapshots") {
              if (item?._path && item?.data) {
                overrides.sets[item._path] = item.data;
              }
            } else if (item?.id) {
              overrides.sets[`${st}/${item.id}`] = item;
            }
          }
        }
      }
    } catch {}
    buildMemoryDb();
    loaded = true;
    emit("__all__");
  })();
  return readyPromise;
}

function emit(path: string) {
  for (const [key, subs] of listeners.entries()) {
    if (key === path || key === "__all__" || path.startsWith(`${key}/`) || key.startsWith(`${path}/`)) {
      subs.forEach((cb) => {
        try {
          cb({ path });
        } catch (err) {
          console.warn("[DemoDB] listener error", err);
        }
      });
    }
  }
}

export function subscribeDemo(path: string, cb: (payload: any) => void): () => void {
  if (!listeners.has(path)) listeners.set(path, new Set());
  listeners.get(path)!.add(cb);
  return () => {
    listeners.get(path)?.delete(cb);
  };
}

function resolveValue(value: any): any {
  if (Array.isArray(value)) return value.map(resolveValue);
  if (value && typeof value === "object") {
    if ((value as any).__serverTimestamp) return new Date().toISOString();
    if ((value as any).__increment !== undefined) return (value as any).__increment;
    if (Array.isArray((value as any).__arrayUnion)) return (value as any).__arrayUnion;
    if (Array.isArray((value as any).__arrayRemove)) return [];
    if ((value as any).__timestamp) return (value as any).__timestamp;
    const out: DemoDocument = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveValue(v);
    return out;
  }
  return value;
}

function mergeUpdates(existing: DemoDocument, updates: DemoDocument): DemoDocument {
  const next: DemoDocument = { ...existing };
  for (const [key, raw] of Object.entries(updates)) {
    if (raw && typeof raw === "object") {
      if ((raw as any).__serverTimestamp) {
        next[key] = new Date().toISOString();
        continue;
      }
      if ((raw as any).__increment !== undefined) {
        next[key] = (Number(next[key]) || 0) + Number((raw as any).__increment);
        continue;
      }
      if (Array.isArray((raw as any).__arrayUnion)) {
        const arr = Array.isArray(next[key]) ? next[key] : [];
        next[key] = Array.from(new Set([...arr, ...(raw as any).__arrayUnion]));
        continue;
      }
      if (Array.isArray((raw as any).__arrayRemove)) {
        const arr = Array.isArray(next[key]) ? next[key] : [];
        next[key] = arr.filter((v: any) => !(raw as any).__arrayRemove.includes(v));
        continue;
      }
    }
    next[key] = resolveValue(raw);
  }
  return next;
}

export function getDemoDoc(path: string): DemoDocument | null {
  const slash = path.lastIndexOf("/");
  if (slash < 0) return null;
  const col = path.slice(0, slash);
  const id = path.slice(slash + 1);
  return memoryDb[col]?.get(id) || null;
}

export function getDemoCollection(path: string): DemoDocument[] {
  const col = path.replace(/^\/+|\/+$/g, "");
  return Array.from(memoryDb[col]?.values() || []);
}

export function setDemoDoc(path: string, data: DemoDocument, merge = false) {
  const slash = path.lastIndexOf("/");
  if (slash < 0) return;
  const col = path.slice(0, slash);
  const id = path.slice(slash + 1);
  if (!memoryDb[col]) memoryDb[col] = new Map();
  const existing = memoryDb[col].get(id) || {};
  const next = merge
    ? mergeUpdates(existing, resolveValue(data))
    : { id, ...resolveValue(data) };
  next.id = id;
  memoryDb[col].set(id, next);

  if (overrides.deletes.includes(path)) {
    overrides.deletes = overrides.deletes.filter((p) => p !== path);
  }
  overrides.sets[path] = next;
  if (!baseCollections[col] && !overrides.customCollections[col]) {
    overrides.customCollections[col] = getDemoCollection(col);
  }
  saveOverrides();
  setIndexedDbItem("snapshots", path, { id: path, _path: path, data: next, updatedAt: Date.now() }).catch(() => {});
  const dedicatedStores: Record<string, string> = {
    articles: "articles",
    events: "events",
    comments: "comments",
    community_posts: "community_posts",
    knowledge_nodes: "knowledge_nodes",
    notifications: "notifications",
    ads: "ads",
    media_assets: "media_assets",
  };
  if (dedicatedStores[col]) {
    setIndexedDbItem(dedicatedStores[col] as any, id, next).catch(() => {});
  }
  emit(path);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { path } }));
  }
}

export function updateDemoDoc(path: string, updates: DemoDocument) {
  setDemoDoc(path, updates, true);
}

export function deleteDemoDoc(path: string) {
  const slash = path.lastIndexOf("/");
  if (slash < 0) return;
  const col = path.slice(0, slash);
  const id = path.slice(slash + 1);
  memoryDb[col]?.delete(id);
  delete overrides.sets[path];
  if (!overrides.deletes.includes(path)) overrides.deletes.push(path);
  saveOverrides();
  deleteIndexedDbItem("snapshots", path).catch(() => {});
  const dedicatedStores: Record<string, string> = {
    articles: "articles",
    events: "events",
    comments: "comments",
    community_posts: "community_posts",
    knowledge_nodes: "knowledge_nodes",
    notifications: "notifications",
    ads: "ads",
    media_assets: "media_assets",
  };
  if (dedicatedStores[col]) {
    deleteIndexedDbItem(dedicatedStores[col] as any, id).catch(() => {});
  }
  emit(path);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { path } }));
  }
}

export function addDemoDoc(colPath: string, data: DemoDocument): DemoDocument {
  const id =
    (data && (data.id as string)) ||
    `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const doc = { ...resolveValue(data), id };
  setDemoDoc(`${colPath}/${id}`, doc);
  return doc;
}

export function resetDemoDb() {
  overrides = emptyOverrides();
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(DB_STORAGE_KEY);
    } catch {}
  }
  buildMemoryDb();
  emit("__all__");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { path: "__all__" } }));
  }
}

export function demoDbSummary() {
  const collections: Record<string, number> = {};
  for (const [col, docs] of Object.entries(memoryDb)) collections[col] = docs.size;
  return {
    ready: loaded,
    collections,
    overrides: {
      sets: Object.keys(overrides.sets).length,
      deletes: overrides.deletes.length,
    },
  };
}
