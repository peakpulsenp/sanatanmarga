/**
 * Local-first Firebase compatibility layer (demo mode).
 *
 * SanatanMarga's UI was originally written against Firebase/Firestore. This
 * module implements the same functions on top of a browser-local document
 * store (see demoStore.ts), so every screen - public and admin - works without
 * cloud credentials, network access, Firestore quotas, or security rules.
 */
import {
  ensureDemoDb,
  getDemoCollection,
  getDemoDoc,
  addDemoDoc,
  setDemoDoc,
  updateDemoDoc,
  deleteDemoDoc,
  subscribeDemo,
  demoDbSummary,
  resetDemoDb,
} from "./demoStore";
import { auth, demoAuth, googleProvider } from "./authClient";
import { backendConfig, apiUrl } from "./backendConfig";
import {
  getBreakerSnapshot,
  tripBreaker,
  recordFirestoreSuccess,
  forceBreaker,
  shouldUseFallback,
  isQuotaError,
  flushJournal,
  enqueueWrite,
} from "./firestoreFallback";

export { auth, googleProvider };
export const messaging = null;
export const app = { name: "sanatanmarga-demo", options: {}, automaticDataCollectionEnabled: false };
export const db = { type: "demo-firestore", name: "sanatanmarga-demo" } as any;

export type DocumentData = Record<string, any>;

export interface DocumentReference<T = DocumentData> {
  type: "document";
  id: string;
  path: string;
  parent: CollectionReference<T>;
  firestore: any;
  converter: null;
}

export interface CollectionReference<T = DocumentData> {
  type: "collection";
  id: string;
  path: string;
  parent: DocumentReference | null;
  firestore: any;
}

export interface Query<T = DocumentData> {
  type: "query";
  path: string;
  collection: CollectionReference<T>;
  constraints: any[];
  firestore: any;
}

export interface QueryConstraint {
  type: string;
  [key: string]: any;
}

export interface DocumentSnapshot<T = DocumentData> {
  type: "document";
  id: string;
  ref: DocumentReference<T>;
  exists: () => boolean;
  data: () => T | undefined;
  get: (field: string) => any;
  metadata: { fromCache: boolean; hasPendingWrites: boolean };
}

export interface QuerySnapshot<T = DocumentData> {
  type: "query";
  docs: Array<DocumentSnapshot<T>>;
  size: number;
  empty: boolean;
  forEach: (cb: (doc: DocumentSnapshot<T>) => void) => void;
  docChanges: () => any[];
  metadata: { fromCache: boolean; hasPendingWrites: boolean };
}

export interface WriteBatch {
  set: (ref: DocumentReference, data: any, options?: SetOptions) => WriteBatch;
  update: (ref: DocumentReference, data: any) => WriteBatch;
  delete: (ref: DocumentReference) => WriteBatch;
  commit: () => Promise<void>;
}

export interface Transaction {
  get: (ref: DocumentReference) => Promise<DocumentSnapshot>;
  set: (ref: DocumentReference, data: any, options?: SetOptions) => Transaction;
  update: (ref: DocumentReference, data: any) => Transaction;
  delete: (ref: DocumentReference) => Transaction;
}

export interface SetOptions {
  merge?: boolean;
  mergeFields?: string[];
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
  TRANSACTION = "transaction",
  BATCH = "batch",
}

/* ------------------------------------------------------------------ */
/* References                                                          */
/* ------------------------------------------------------------------ */

function parentCollection(path: string): CollectionReference {
  const parts = path.split("/");
  const id = parts[parts.length - 1] || "";
  return {
    type: "collection",
    id,
    path: parts.slice(0, -1).join("/"),
    parent: null,
    firestore: db,
  } as CollectionReference;
}

export function doc(firestoreOrRef: any, ...segments: any[]): DocumentReference {
  const parts: string[] = [];
  if (firestoreOrRef && firestoreOrRef.type === "document") parts.push(firestoreOrRef.path);
  else if (firestoreOrRef && firestoreOrRef.type === "collection") parts.push(firestoreOrRef.path);
  for (const segment of segments) {
    if (segment === undefined || segment === null) continue;
    const value = String(segment);
    if (value.includes("/") && parts.length === 0) parts.push(value);
    else parts.push(value);
  }
  const path = parts.filter(Boolean).join("/");
  return {
    type: "document",
    id: path.split("/").pop() || path,
    path,
    parent: parentCollection(path),
    firestore: db,
    converter: null,
  };
}

export function collection(firestoreOrRef: any, ...segments: any[]): CollectionReference {
  const parts: string[] = [];
  if (firestoreOrRef && (firestoreOrRef.type === "collection" || firestoreOrRef.type === "document")) {
    parts.push(firestoreOrRef.path);
  }
  for (const segment of segments) {
    if (segment === undefined || segment === null) continue;
    parts.push(String(segment));
  }
  const path = parts.filter(Boolean).join("/");
  return {
    type: "collection",
    id: path.split("/").pop() || path,
    path,
    parent: null,
    firestore: db,
  } as CollectionReference;
}

export function query<T = DocumentData>(source: CollectionReference<T> | Query<T>, ...constraints: QueryConstraint[]): Query<T> {
  const base = (source as Query<T>)?.type === "query" ? (source as Query<T>) : null;
  return {
    type: "query",
    path: source.path,
    collection: base ? base.collection : (source as CollectionReference<T>),
    constraints: [...(base ? base.constraints : []), ...constraints],
    firestore: db,
  };
}

export function where(field: string, op: string, value: any): QueryConstraint {
  return { type: "where", field, op, value };
}
export function orderBy(field: string, direction: "asc" | "desc" = "asc"): QueryConstraint {
  return { type: "orderBy", field, direction };
}
export function limit(value: number): QueryConstraint {
  return { type: "limit", value };
}
export function limitToLast(value: number): QueryConstraint {
  return { type: "limitToLast", value };
}
export function startAfter(value: any): QueryConstraint {
  return { type: "startAfter", value };
}
export function startAt(value: any): QueryConstraint {
  return { type: "startAt", value };
}
export function endAt(value: any): QueryConstraint {
  return { type: "endAt", value };
}
export function endBefore(value: any): QueryConstraint {
  return { type: "endBefore", value };
}

/* ------------------------------------------------------------------ */
/* Values                                                              */
/* ------------------------------------------------------------------ */

export const serverTimestamp = () => ({ __serverTimestamp: true });
export const increment = (value: number) => ({ __increment: value });
export const arrayUnion = (...values: any[]) => ({ __arrayUnion: values });
export const arrayRemove = (...values: any[]) => ({ __arrayRemove: values });

export class Timestamp {
  seconds: number;
  nanoseconds: number;
  constructor(seconds: number, nanoseconds = 0) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }
  static now() {
    return Timestamp.fromMillis(Date.now());
  }
  static fromDate(date: Date) {
    return Timestamp.fromMillis(date.getTime());
  }
  static fromMillis(ms: number) {
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6);
  }
  toDate() {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1e6);
  }
  toMillis() {
    return this.seconds * 1000 + this.nanoseconds / 1e6;
  }
  isEqual(other: Timestamp) {
    return this.seconds === other.seconds && this.nanoseconds === other.nanoseconds;
  }
}

/* ------------------------------------------------------------------ */
/* Snapshot helpers                                                    */
/* ------------------------------------------------------------------ */

function readField(data: any, field: string): any {
  if (!field) return undefined;
  return field.split(".").reduce((acc: any, key: string) => (acc == null ? undefined : acc[key]), data);
}

function normalizeComparable(value: any): any {
  if (value instanceof Timestamp) return value.toMillis();
  if (value && typeof value === "object") {
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.seconds === "number") return value.seconds * 1000;
  }
  return value;
}

function compareValues(a: any, b: any): number {
  const av = normalizeComparable(a);
  const bv = normalizeComparable(b);
  if (av === bv) return 0;
  if (av === undefined || av === null) return -1;
  if (bv === undefined || bv === null) return 1;
  if (typeof av === "number" && typeof bv === "number") return av - bv;
  if (typeof av === "string" && typeof bv === "string") {
    const ad = Date.parse(av);
    const bd = Date.parse(bv);
    if (!Number.isNaN(ad) && !Number.isNaN(bd)) return ad - bd;
    return av.localeCompare(bv);
  }
  return String(av).localeCompare(String(bv));
}

function matches(docData: any, constraint: any): boolean {
  const value = readField(docData, constraint.field);
  const target = constraint.value;
  switch (constraint.op) {
    case "==":
      return value === target || normalizeComparable(value) === normalizeComparable(target);
    case "!=":
      return !(value === target);
    case ">":
      return compareValues(value, target) > 0;
    case ">=":
      return compareValues(value, target) >= 0;
    case "<":
      return compareValues(value, target) < 0;
    case "<=":
      return compareValues(value, target) <= 0;
    case "in":
      return Array.isArray(target) && target.some((t: any) => value === t || normalizeComparable(value) === normalizeComparable(t));
    case "not-in":
      return Array.isArray(target) && !target.some((t: any) => value === t);
    case "array-contains":
      return Array.isArray(value) && value.some((v: any) => v === target);
    case "array-contains-any":
      return Array.isArray(value) && Array.isArray(target) && value.some((v: any) => target.includes(v));
    default:
      return true;
  }
}

function docSnapshot(path: string, data: DocumentData | null): DocumentSnapshot {
  return {
    type: "document",
    id: path.split("/").pop() || path,
    ref: doc(db, path),
    exists: () => data !== null,
    data: () => (data ? { ...data } : undefined),
    get: (field: string) => (data ? readField(data, field) : undefined),
    metadata: { fromCache: false, hasPendingWrites: false },
  };
}

function buildQuerySnapshot(q: Query<any>): QuerySnapshot {
  const constraints = q.constraints || [];
  let rows = getDemoCollection(q.path);

  for (const constraint of constraints) {
    if (constraint.type === "where") rows = rows.filter((row) => matches(row, constraint));
  }

  const orderConstraints = constraints.filter((c) => c.type === "orderBy");
  if (orderConstraints.length) {
    rows = [...rows].sort((a, b) => {
      for (const order of orderConstraints) {
        const cmp = compareValues(readField(a, order.field), readField(b, order.field));
        if (cmp !== 0) return order.direction === "desc" ? -cmp : cmp;
      }
      return 0;
    });
  }

  const startAfterConstraint = constraints.find((c) => c.type === "startAfter");
  if (startAfterConstraint) {
    const cursorData = startAfterConstraint.value?.data ? startAfterConstraint.value.data() : startAfterConstraint.value;
    if (cursorData && orderConstraints[0]) {
      const field = orderConstraints[0].field;
      const cursorValue = readField(cursorData, field);
      rows = rows.filter((row) => compareValues(readField(row, field), cursorValue) > 0);
    } else if (typeof startAfterConstraint.value === "object" && startAfterConstraint.value?.id) {
      const index = rows.findIndex((r) => r.id === startAfterConstraint.value.id);
      if (index >= 0) rows = rows.slice(index + 1);
    }
  }

  const limitConstraint = constraints.find((c) => c.type === "limit");
  const limitLastConstraint = constraints.find((c) => c.type === "limitToLast");
  if (limitConstraint) rows = rows.slice(0, limitConstraint.value);
  if (limitLastConstraint) rows = rows.slice(-limitLastConstraint.value);

  const docs = rows.map((row) => docSnapshot(`${q.path}/${row.id}`, row));
  const snapshot: QuerySnapshot = {
    type: "query",
    docs,
    size: docs.length,
    empty: docs.length === 0,
    forEach: (cb) => docs.forEach(cb),
    docChanges: () => [],
    metadata: { fromCache: false, hasPendingWrites: false },
  };
  return snapshot;
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export async function getDocs<T = DocumentData>(
  q: Query<T> | CollectionReference<T>,
  _options?: any,
): Promise<QuerySnapshot<T>> {
  await ensureDemoDb();
  const queryRef: Query<T> = (q as any).type === "query" ? (q as Query<T>) : query(q as CollectionReference<T>);
  return buildQuerySnapshot(queryRef) as QuerySnapshot<T>;
}

export async function getDoc<T = DocumentData>(
  ref: DocumentReference<T>,
  _options?: any,
): Promise<DocumentSnapshot<T>> {
  await ensureDemoDb();
  return docSnapshot(ref.path, getDemoDoc(ref.path)) as DocumentSnapshot<T>;
}

export const getDocsWithCacheFallback = getDocs;
export const getDocWithCacheFallback = getDoc;
export const getDocsFromCache = getDocs;
export const getDocFromCache = getDoc;

/* ------------------------------------------------------------------ */
/* Realtime R2 Snapshot Sync Helper                                    */
/* ------------------------------------------------------------------ */

export async function syncDocumentSnapshotToR2(
  collectionName: string,
  docId: string,
  data?: any,
  isDelete?: boolean,
): Promise<void> {
  if (!backendConfig.hasApiGateway) return;
  try {
    await fetch(apiUrl("/api/snapshots/sync-doc"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collection: collectionName,
        id: docId,
        data: data || {},
        isDelete: !!isDelete,
      }),
    });
  } catch (e) {
    // Non-blocking fire-and-forget; journal cron sync acts as fallback
  }
}

/* ------------------------------------------------------------------ */
/* Writes (3-Tier: Firebase -> Localhost/IndexedDB -> Cloudflare R2)   */
/* ------------------------------------------------------------------ */

export async function setDoc<T = DocumentData>(
  reference: DocumentReference<T>,
  data: any,
  options?: SetOptions,
): Promise<void> {
  const path = reference.path;
  const parts = path.split("/");
  const col = parts[0];
  const docId = parts[1] || parts[parts.length - 1];

  // Tier 1: Firebase Quota Check & Fallback Queuing
  if (backendConfig.mode === "firebase") {
    if (shouldUseFallback()) {
      enqueueWrite({ kind: "set", path, data, merge: !!options?.merge });
      flushJournal().catch(() => {});
    }
  }

  // Tier 2: Localhost / IndexedDB (Instant UI response + durable storage)
  await ensureDemoDb();
  setDemoDoc(path, data || {}, !!options?.merge);

  // Tier 3: Realtime Cloudflare R2 Snapshot Sync
  syncDocumentSnapshotToR2(col, docId, getDemoDoc(path) || data, false).catch(() => {});
}

export async function updateDoc<T = DocumentData>(
  reference: DocumentReference<T>,
  ...args: any[]
): Promise<void> {
  const path = reference.path;
  const parts = path.split("/");
  const col = parts[0];
  const docId = parts[1] || parts[parts.length - 1];
  const payload = args.find((arg) => arg && typeof arg === "object") || {};

  // Tier 1: Firebase Quota Check & Fallback Queuing
  if (backendConfig.mode === "firebase") {
    if (shouldUseFallback()) {
      enqueueWrite({ kind: "update", path, data: payload });
      flushJournal().catch(() => {});
    }
  }

  // Tier 2: Localhost / IndexedDB
  await ensureDemoDb();
  updateDemoDoc(path, payload);

  // Tier 3: Realtime Cloudflare R2 Snapshot Sync
  syncDocumentSnapshotToR2(col, docId, getDemoDoc(path) || payload, false).catch(() => {});
}

export async function addDoc<T = DocumentData>(
  reference: CollectionReference<T>,
  data: any,
  _options?: any,
): Promise<DocumentReference<T>> {
  // Tier 2 first to generate deterministic document ID
  await ensureDemoDb();
  const created = addDemoDoc(reference.path, data || {});
  const path = `${reference.path}/${created.id}`;
  const col = reference.path.split("/")[0];
  const docId = created.id;

  // Tier 1: Firebase Quota Check & Fallback Queuing
  if (backendConfig.mode === "firebase") {
    if (shouldUseFallback()) {
      enqueueWrite({ kind: "set", path, data: created });
      flushJournal().catch(() => {});
    }
  }

  // Tier 3: Realtime Cloudflare R2 Snapshot Sync
  syncDocumentSnapshotToR2(col, docId, created, false).catch(() => {});

  return doc(db, path) as DocumentReference<T>;
}

export async function deleteDoc<T = DocumentData>(
  reference: DocumentReference<T>,
  _options?: any,
): Promise<void> {
  const path = reference.path;
  const parts = path.split("/");
  const col = parts[0];
  const docId = parts[1] || parts[parts.length - 1];

  // Tier 1: Firebase Quota Check & Fallback Queuing
  if (backendConfig.mode === "firebase") {
    if (shouldUseFallback()) {
      enqueueWrite({ kind: "delete", path });
      flushJournal().catch(() => {});
    }
  }

  // Tier 2: Localhost / IndexedDB
  await ensureDemoDb();
  deleteDemoDoc(path);

  // Tier 3: Realtime Cloudflare R2 Snapshot Sync
  syncDocumentSnapshotToR2(col, docId, null, true).catch(() => {});
}

export function writeBatch(_firestoreInstance: any = db): WriteBatch {
  const operations: Array<() => void> = [];
  const batch: WriteBatch = {
    set(ref, data, options) {
      operations.push(() => {
        setDoc(ref, data, options).catch(() => {});
      });
      return batch;
    },
    update(ref, data) {
      operations.push(() => {
        updateDoc(ref, data).catch(() => {});
      });
      return batch;
    },
    delete(ref) {
      operations.push(() => {
        deleteDoc(ref).catch(() => {});
      });
      return batch;
    },
    async commit() {
      await ensureDemoDb();
      for (const op of operations) op();
    },
  };
  return batch;
}

export async function runTransaction<T>(
  _firestoreInstance: any,
  updateFunction: (transaction: Transaction) => Promise<T>,
): Promise<T> {
  await ensureDemoDb();
  const transaction: Transaction = {
    get: (ref) => getDoc(ref),
    set: (ref, data, options) => {
      setDemoDoc(ref.path, resolveTransactionValue(data), !!options?.merge);
      return transaction;
    },
    update: (ref, data) => {
      updateDemoDoc(ref.path, resolveTransactionValue(data));
      return transaction;
    },
    delete: (ref) => {
      deleteDemoDoc(ref.path);
      return transaction;
    },
  };
  return updateFunction(transaction);
}

function resolveTransactionValue(value: any): any {
  if (Array.isArray(value)) return value.map(resolveTransactionValue);
  if (value && typeof value === "object") {
    if ((value as any).__serverTimestamp) return new Date().toISOString();
    const out: any = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveTransactionValue(v);
    return out;
  }
  return value;
}

/* ------------------------------------------------------------------ */
/* Realtime listeners                                                  */
/* ------------------------------------------------------------------ */

function snapshotFor(target: Query | DocumentReference | CollectionReference): DocumentSnapshot | QuerySnapshot {
  if ((target as any).type === "document") {
    const ref = target as DocumentReference;
    return docSnapshot(ref.path, getDemoDoc(ref.path));
  }
  const q: Query = (target as any).type === "query" ? (target as Query) : query(target as CollectionReference);
  return buildQuerySnapshot(q);
}

export function safeOnSnapshot<T = DocumentData>(
  queryOrRef: Query<T> | DocumentReference<T> | CollectionReference<T>,
  onNext: (snapshot: any) => void,
  onErrorOrOptionsOrName?: ((error: any) => void) | any,
  _optionsOrName?: any,
): () => void {
  const path = (queryOrRef as any).path || "";
  let closed = false;
  let lastSerialized = "";

  const deliver = () => {
    if (closed) return;
    try {
      const snap = snapshotFor(queryOrRef as any);
      const serialized = JSON.stringify((snap as any).docs ? (snap as any).docs.map((d: any) => d.data()) : (snap as any).data());
      if (serialized === lastSerialized) return;
      lastSerialized = serialized;
      onNext(snap);
    } catch (err) {
      if (typeof onErrorOrOptionsOrName === "function") onErrorOrOptionsOrName(err);
    }
  };

  ensureDemoDb().then(() => {
    deliver();
    const unsubscribe = subscribeDemo(path, () => deliver());
    cleanup = unsubscribe;
  });

  let cleanup: (() => void) | undefined;
  return () => {
    closed = true;
    cleanup?.();
  };
}

export const onSnapshot = safeOnSnapshot;

/* ------------------------------------------------------------------ */
/* Diagnostics / compatibility no-ops                                  */
/* ------------------------------------------------------------------ */

export class FirestoreCircuitBreaker {
  getState() {
    const snap = getBreakerSnapshot();
    return snap.state.toUpperCase();
  }
  allowRead() {
    return !shouldUseFallback();
  }
  trip(error?: any) {
    tripBreaker(error || { code: "manual-trip" });
  }
  recordSuccess() {
    recordFirestoreSuccess();
  }
  recordFailure(error?: any) {
    tripBreaker(error);
  }
  executeHealthProbe() {
    return Promise.resolve(!shouldUseFallback());
  }
  getTelemetry() {
    const snap = getBreakerSnapshot();
    return {
      state: snap.state.toUpperCase(),
      lastOpenedAt: snap.openedAt ? new Date(snap.openedAt).toISOString() : null,
      cooldownUntil: snap.cooldownUntil ? new Date(snap.cooldownUntil).toISOString() : null,
      consecutiveFailures: snap.trips,
      blockedReadCount: snap.fallbackReads,
      fallbackServedCount: snap.fallbackReads,
      lastError: snap.lastError,
      probeInFlight: snap.state === "half_open",
      activeListenersCount: 0,
      queuedWritesCount: snap.queuedWrites,
    };
  }
  _forceState(state: "CLOSED" | "OPEN") {
    forceBreaker(state === "OPEN" ? "open" : "closed");
  }
}

export const firestoreCircuitBreaker = new FirestoreCircuitBreaker();

export function isFirestoreNetworkDisabled() {
  return shouldUseFallback();
}
export const isContinuityModeActive = isFirestoreNetworkDisabled;
export function isQuotaOrContinuityError(error: any) {
  return isQuotaError(error);
}
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  if (isQuotaError(error)) {
    tripBreaker(error);
  }
  return {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: { userId: null, email: null, emailVerified: false, isAnonymous: false, tenantId: null, providerInfo: [] },
  };
}
export const listenerRegistry = {
  register(unsub: () => void) {
    return unsub;
  },
  killAll() {},
  killByFeature(_featureId?: string) {
    return 0;
  },
  getActiveCount() {
    return 0;
  },
};
export function executeSingleFlight<T>(_key: string, fn: () => Promise<T>): Promise<T> {
  return fn();
}
export async function recoverFirestore(): Promise<void> {
  recordFirestoreSuccess();
}
export async function flushLocalStorageToServerAndR2(): Promise<void> {
  await flushJournal();
}
export function setLogLevel() {}
export { demoDbSummary, resetDemoDb, enqueueWrite };
