/**
 * Database Implementation
 * Supports: Firebase Firestore (primary) + Cloudflare R2 (fallback/cache)
 * Demo mode uses localStorage-backed store
 */

import type {
  IDatabase,
  DocumentData,
  DocumentReference,
  CollectionReference,
  Query,
  QueryConstraint,
  QuerySnapshot,
  DocumentSnapshot,
  WriteBatch,
  Transaction,
  SnapshotOptions,
} from "./config";

export type {
  IDatabase,
  DocumentData,
  DocumentReference,
  CollectionReference,
  Query,
  QueryConstraint,
  QuerySnapshot,
  DocumentSnapshot,
  WriteBatch,
  Transaction,
  SnapshotOptions,
};
import { getDemoCollection, getDemoDoc, setDemoDoc, addDemoDoc, updateDemoDoc, deleteDemoDoc, subscribeDemo, ensureDemoDb } from "../demoStore";
import { auth } from "../authClient";

/* ============================================================
 * Demo/Local Implementation (current)
 * ============================================================ */

class DemoDatabase implements IDatabase {
  private docConverter = {
    toFirestore: (data: any) => data,
    fromFirestore: (snap: any) => snap.data(),
  };

  async getDoc<T>(pathOrRef: string | DocumentReference<T>): Promise<T | null> {
    await ensureDemoDb();
    const path = typeof pathOrRef === "string" ? pathOrRef : pathOrRef.path;
    const data = getDemoDoc(path);
    return data as T | null;
  }

  async setDoc<T>(pathOrRef: string | DocumentReference<T>, data: T, merge = false): Promise<void> {
    await ensureDemoDb();
    const path = typeof pathOrRef === "string" ? pathOrRef : pathOrRef.path;
    setDemoDoc(path, data, merge);
  }

  async updateDoc<T>(pathOrRef: string | DocumentReference<T>, data: Partial<T>): Promise<void> {
    await ensureDemoDb();
    const path = typeof pathOrRef === "string" ? pathOrRef : pathOrRef.path;
    updateDemoDoc(path, data);
  }

  async deleteDoc(pathOrRef: string | DocumentReference<any>): Promise<void> {
    await ensureDemoDb();
    const path = typeof pathOrRef === "string" ? pathOrRef : pathOrRef.path;
    deleteDemoDoc(path);
  }

  async addDoc<T>(collectionPathOrRef: string | CollectionReference<T>, data: T): Promise<DocumentReference<T>> {
    await ensureDemoDb();
    const path = typeof collectionPathOrRef === "string" ? collectionPathOrRef : collectionPathOrRef.path;
    const created = addDemoDoc(path, data);
    return this.doc(path, created.id) as DocumentReference<T>;
  }

  async getDocs<T>(collectionPathOrRef: string | CollectionReference<T> | Query<T>, constraints?: QueryConstraint[]): Promise<T[]> {
    await ensureDemoDb();
    let queryRef: Query<T>;
    if (typeof collectionPathOrRef === "string") {
      queryRef = this.query(this.collection(collectionPathOrRef), ...(constraints || []));
    } else if ("constraints" in collectionPathOrRef) {
      queryRef = collectionPathOrRef as Query<T>;
    } else {
      queryRef = this.query(collectionPathOrRef as CollectionReference<T>, ...(constraints || []));
    }
    const snapshot = await this.executeQuery(queryRef);
    return snapshot.docs.map(d => d.data() as T);
  }

  async getDocByRef<T>(ref: DocumentReference<T>): Promise<T | null> {
    return this.getDoc(ref.path);
  }

  async setDocByRef<T>(ref: DocumentReference<T>, data: T, merge?: boolean): Promise<void> {
    return this.setDoc(ref.path, data, merge);
  }

  async updateDocByRef<T>(ref: DocumentReference<T>, data: Partial<T>): Promise<void> {
    return this.updateDoc(ref.path, data);
  }

  async deleteDocByRef<T>(ref: DocumentReference<T>): Promise<void> {
    return this.deleteDoc(ref.path);
  }

  async addDocByRef<T>(ref: CollectionReference<T>, data: T): Promise<DocumentReference<T>> {
    return this.addDoc(ref.path, data);
  }

  // Query building
  collection(path: string): CollectionReference {
    return { type: "collection", id: path.split("/").pop() || path, path, parent: null };
  }

  doc(...segments: (string | CollectionReference | DocumentReference)[]): DocumentReference {
    const parts: string[] = [];
    for (const seg of segments) {
      if (typeof seg === "string") parts.push(seg);
      else if (seg && typeof seg === "object" && "path" in seg) parts.push(seg.path);
    }
    const path = parts.join("/");
    return { type: "document", id: path.split("/").pop() || path, path, parent: { type: "collection", id: path.split("/").slice(-2, -1)[0] || "", path: path.split("/").slice(0, -1).join("/") } };
  }

  query<T>(source: CollectionReference<T> | Query<T>, ...constraints: QueryConstraint[]): Query<T> {
    const base = (source as any).type === "query" ? source : null;
    return {
      type: "query",
      path: source.path,
      collection: base ? base.collection : (source as any),
      constraints: [...(base ? base.constraints : []), ...constraints],
    };
  }

  where(field: string, op: string, value: any): QueryConstraint { return { type: "where", field, op, value }; }
  orderBy(field: string, direction: "asc" | "desc" = "asc"): QueryConstraint { return { type: "orderBy", field, direction }; }
  limit(value: number): QueryConstraint { return { type: "limit", value }; }
  limitToLast(value: number): QueryConstraint { return { type: "limitToLast", value }; }
  startAt(value: any): QueryConstraint { return { type: "startAt", value }; }
  startAfter(value: any): QueryConstraint { return { type: "startAfter", value }; }
  endAt(value: any): QueryConstraint { return { type: "endAt", value }; }
  endBefore(value: any): QueryConstraint { return { type: "endBefore", value }; }

  private async executeQuery<T>(q: Query<T>): Promise<QuerySnapshot<T>> {
    let rows = getDemoCollection(q.path);

    for (const constraint of q.constraints || []) {
      if (constraint.type === "where") rows = rows.filter(row => this.matchWhere(row, constraint));
    }

    const orderConstraints = q.constraints.filter(c => c.type === "orderBy");
    if (orderConstraints.length) {
      rows = [...rows].sort((a, b) => {
        for (const order of orderConstraints) {
          const cmp = this.compareValues(this.readField(a, order.field), this.readField(b, order.field));
          if (cmp !== 0) return order.direction === "desc" ? -cmp : cmp;
        }
        return 0;
      });
    }

    const limitConstraint = q.constraints.find(c => c.type === "limit");
    if (limitConstraint) rows = rows.slice(0, limitConstraint.value);

    const docs = rows.map(row => this.makeDocSnapshot(`${q.path}/${row.id}`, row)) as any;
    return { docs, size: docs.length, empty: docs.length === 0 };
  }

  private matchWhere(doc: any, constraint: QueryConstraint): boolean {
    const value = this.readField(doc, constraint.field!);
    const target = constraint.value;
    switch (constraint.op) {
      case "==": return value === target;
      case "!=": return value !== target;
      case ">": return this.compareValues(value, target) > 0;
      case ">=": return this.compareValues(value, target) >= 0;
      case "<": return this.compareValues(value, target) < 0;
      case "<=": return this.compareValues(value, target) <= 0;
      case "in": return Array.isArray(target) && target.some(t => value === t);
      case "array-contains": return Array.isArray(value) && value.includes(target);
      default: return true;
    }
  }

  private readField(obj: any, field: string): any {
    return field.split(".").reduce((acc, key) => acc?.[key], obj);
  }

  private compareValues(a: any, b: any): number {
    if (a === b) return 0;
    if (a == null) return -1;
    if (b == null) return 1;
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b));
  }

  private makeDocSnapshot(path: string, data: any): DocumentSnapshot {
    return {
      type: "document",
      id: path.split("/").pop() || path,
      ref: this.doc(path),
      exists: () => true,
      data: () => ({ ...data }),
      get: (field: string) => this.readField(data, field),
      metadata: { fromCache: false, hasPendingWrites: false },
    };
  }

  // Realtime
  onSnapshot<T>(pathOrRef: string | CollectionReference<T> | Query<T> | DocumentReference<T>, callback: (data: T[]) => void, _options?: SnapshotOptions): () => void {
    const path = typeof pathOrRef === "string" ? pathOrRef : pathOrRef.path;
    let closed = false;
    let lastData = "";

    const deliver = () => {
      if (closed) return;
      try {
        const rows = getDemoCollection(path);
        const serialized = JSON.stringify(rows);
        if (serialized === lastData) return;
        lastData = serialized;
        callback(rows as T[]);
      } catch {}
    };

    ensureDemoDb().then(() => {
      deliver();
      const unsub = subscribeDemo(path, deliver);
      return () => { closed = true; unsub(); };
    });

    return () => { closed = true; };
  }

  // Batch/Transaction
  batch(): WriteBatch {
    const ops: Array<() => Promise<void>> = [];
    return {
      set: (ref, data, merge) => { ops.push(() => this.setDoc(ref, data, merge)); return this.batch(); },
      update: (ref, data) => { ops.push(() => this.updateDoc(ref, data)); return this.batch(); },
      delete: (ref) => { ops.push(() => this.deleteDoc(ref)); return this.batch(); },
      async commit() { await Promise.all(ops.map(o => o())); },
    };
  }

  async runTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    const transaction: Transaction = {
      get: (ref) => this.getDoc(ref),
      set: (ref, data, merge) => { this.setDoc(ref, data, merge); return transaction; },
      update: (ref, data) => { this.updateDoc(ref, data); return transaction; },
      delete: (ref) => { this.deleteDoc(ref); return transaction; },
    };
    return fn(transaction);
  }

  // Admin
  async listCollections(path: string): Promise<string[]> {
    await ensureDemoDb();
    // In demo mode, we can't easily list collections
    return [];
  }

  async getCollectionSize(path: string): Promise<number> {
    await ensureDemoDb();
    const rows = getDemoCollection(path);
    return rows.length;
  }
}

/* ============================================================
 * Firebase Implementation (Production)
 * ============================================================ */

class FirebaseDatabase implements IDatabase {
  private db: any;
  private app: any;

  constructor(config: any) {
    this.initializeApp(config);
  }

  private initializeApp(config: any) {
    // Dynamic import to avoid bundling firebase in demo builds
    import("firebase/app").then(({ initializeApp, getApps }) => {
      if (getApps().length === 0) {
        this.app = initializeApp(config);
      } else {
        this.app = getApps()[0];
      }
      return import("firebase/firestore");
    }).then(({ getFirestore, connectFirestoreEmulator }) => {
      this.db = getFirestore(this.app);
      if (config.useEmulator) {
        connectFirestoreEmulator(this.db, config.emulatorHost || "localhost", config.emulatorPort || 8080);
      }
    }).catch(console.error);
  }

  private ensureDb() {
    if (!this.db) throw new Error("Firestore not initialized");
    return this.db;
  }

  async getDoc<T>(pathOrRef: string | DocumentReference<T>): Promise<T | null> {
    const { getDoc, doc } = await import("firebase/firestore");
    const ref = typeof pathOrRef === "string" ? doc(this.ensureDb(), pathOrRef) : this.toFirestoreRef(pathOrRef);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() as T : null;
  }

  async setDoc<T>(pathOrRef: string | DocumentReference<T>, data: T, merge = false): Promise<void> {
    const { setDoc, doc } = await import("firebase/firestore");
    const ref = typeof pathOrRef === "string" ? doc(this.ensureDb(), pathOrRef) : this.toFirestoreRef(pathOrRef);
    await setDoc(ref, data, { merge });
  }

  async updateDoc<T>(pathOrRef: string | DocumentReference<T>, data: Partial<T>): Promise<void> {
    const { updateDoc, doc } = await import("firebase/firestore");
    const ref = typeof pathOrRef === "string" ? doc(this.ensureDb(), pathOrRef) : this.toFirestoreRef(pathOrRef);
    await updateDoc(ref, data);
  }

  async deleteDoc(pathOrRef: string | DocumentReference<any>): Promise<void> {
    const { deleteDoc, doc } = await import("firebase/firestore");
    const ref = typeof pathOrRef === "string" ? doc(this.ensureDb(), pathOrRef) : this.toFirestoreRef(pathOrRef);
    await deleteDoc(ref);
  }

  async addDoc<T>(collectionPathOrRef: string | CollectionReference<T>, data: T): Promise<DocumentReference<T>> {
    const { addDoc, collection, doc } = await import("firebase/firestore");
    const ref = typeof collectionPathOrRef === "string" ? collection(this.ensureDb(), collectionPathOrRef) : this.toFirestoreCollectionRef(collectionPathOrRef);
    const docRef = await addDoc(ref, data);
    return this.fromFirestoreDocRef(docRef) as DocumentReference<T>;
  }

  async getDocs<T>(collectionPathOrRef: string | CollectionReference<T> | Query<T>, constraints?: QueryConstraint[]): Promise<T[]> {
    const { getDocs, query, collection, where, orderBy, limit, limitToLast, startAt, startAfter, endAt, endBefore } = await import("firebase/firestore");
    let q: any;
    if (typeof collectionPathOrRef === "string") {
      q = query(collection(this.ensureDb(), collectionPathOrRef), ...this.toFirestoreConstraints(constraints || []));
    } else if ("constraints" in collectionPathOrRef) {
      q = this.toFirestoreQuery(collectionPathOrRef as Query<any>);
    } else {
      q = query(this.toFirestoreCollectionRef(collectionPathOrRef as CollectionReference<any>), ...this.toFirestoreConstraints(constraints || []));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as T[];
  }

  // Realtime
  onSnapshot<T>(pathOrRef: string | CollectionReference<T> | Query<T> | DocumentReference<T>, callback: (data: T[]) => void, options?: SnapshotOptions): () => void {
    const { onSnapshot, query, collection, doc, where, orderBy, limit, limitToLast, startAt, startAfter, endAt, endBefore } = require("firebase/firestore");
    let q: any;
    if (typeof pathOrRef === "string") {
      if (pathOrRef.includes("/") && !pathOrRef.endsWith("/")) {
        // Could be doc or collection - try collection first
        q = collection(this.ensureDb(), pathOrRef);
      } else {
        q = collection(this.ensureDb(), pathOrRef);
      }
    } else if ("constraints" in pathOrRef) {
      q = this.toFirestoreQuery(pathOrRef as Query<any>);
    } else if (pathOrRef.type === "document") {
      q = doc(this.ensureDb(), pathOrRef.path);
    } else {
      q = this.toFirestoreCollectionRef(pathOrRef);
    }

    const unsub = onSnapshot(q, (snap: any) => {
      if (snap.docs) {
        callback(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as T[]);
      } else if (snap.exists()) {
        callback([{ id: snap.id, ...snap.data() }] as T[]);
      } else {
        callback([]);
      }
    }, options);

    return unsub;
  }

  batch(): WriteBatch {
    const { writeBatch } = require("firebase/firestore");
    const fbBatch = writeBatch(this.ensureDb());
    const ops: Array<() => void> = [];
    return {
      set: (ref, data, merge) => { ops.push(() => fbBatch.set(this.toFirestoreRef(ref), data, { merge })); return this.batch(); },
      update: (ref, data) => { ops.push(() => fbBatch.update(this.toFirestoreRef(ref), data)); return this.batch(); },
      delete: (ref) => { ops.push(() => fbBatch.delete(this.toFirestoreRef(ref))); return this.batch(); },
      async commit() { await fbBatch.commit(); },
    };
  }

  async runTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    const { runTransaction } = await import("firebase/firestore");
    return runTransaction(this.ensureDb(), async (fbTx) => {
      const transaction: Transaction = {
        get: (ref) => fbTx.get(this.toFirestoreRef(ref)),
        set: (ref, data, merge) => { fbTx.set(this.toFirestoreRef(ref), data, { merge }); return transaction; },
        update: (ref, data) => { fbTx.update(this.toFirestoreRef(ref), data); return transaction; },
        delete: (ref) => { fbTx.delete(this.toFirestoreRef(ref)); return transaction; },
      };
      return fn(transaction);
    });
  }

  async listCollections(path: string): Promise<string[]> {
    const { listCollections } = await import("firebase/firestore");
    const cols = await listCollections(this.ensureDb().collection(path));
    return cols.map((c: any) => c.id);
  }

  async getCollectionSize(path: string): Promise<number> {
    const { getCountFromServer, collection, query, where } = await import("firebase/firestore");
    const snap = await getCountFromServer(query(collection(this.ensureDb(), path)));
    return snap.data().count;
  }

  where(field: string, op: string, value: any): QueryConstraint { return { type: "where", field, op, value }; }
  orderBy(field: string, direction: "asc" | "desc" = "asc"): QueryConstraint { return { type: "orderBy", field, direction }; }
  limit(value: number): QueryConstraint { return { type: "limit", value }; }
  startAfter(value: any): QueryConstraint { return { type: "startAfter", value }; }

  // Helpers
  private toFirestoreRef(ref: DocumentReference): any {
    const { doc } = require("firebase/firestore");
    return doc(this.ensureDb(), ref.path);
  }

  private toFirestoreCollectionRef(ref: CollectionReference): any {
    const { collection } = require("firebase/firestore");
    return collection(this.ensureDb(), ref.path);
  }

  private toFirestoreQuery(q: Query): any {
    const { query, collection, where, orderBy, limit, limitToLast, startAt, startAfter, endAt, endBefore } = require("firebase/firestore");
    let base = this.toFirestoreCollectionRef(q.collection || { id: q.path.split("/").pop() || q.path, path: q.path });
    for (const c of q.constraints) {
      switch (c.type) {
        case "where": base = query(base, where(c.field, c.op || c.operator, c.value)); break;
        case "orderBy": base = query(base, orderBy(c.field, c.direction)); break;
        case "limit": base = query(base, limit(c.value)); break;
        case "limitToLast": base = query(base, limitToLast(c.value)); break;
        case "startAt": base = query(base, startAt(c.value)); break;
        case "startAfter": base = query(base, startAfter(c.value)); break;
        case "endAt": base = query(base, endAt(c.value)); break;
        case "endBefore": base = query(base, endBefore(c.value)); break;
      }
    }
    return base;
  }

  private toFirestoreConstraints(constraints: QueryConstraint[]): any[] {
    const { where, orderBy, limit, limitToLast, startAt, startAfter, endAt, endBefore } = require("firebase/firestore");
    return constraints.map(c => {
      switch (c.type) {
        case "where": return where(c.field, c.op || c.operator, c.value);
        case "orderBy": return orderBy(c.field, c.direction);
        case "limit": return limit(c.value);
        case "limitToLast": return limitToLast(c.value);
        case "startAt": return startAt(c.value);
        case "startAfter": return startAfter(c.value);
        case "endAt": return endAt(c.value);
        case "endBefore": return endBefore(c.value);
      }
    });
  }

  private fromFirestoreDocRef(ref: any): DocumentReference {
    return { type: "document", id: ref.id, path: ref.path, parent: null };
  }
}

/* ============================================================
 * R2 Fallback Storage Layer (for large documents/blobs)
 * ============================================================ */

interface R2DocumentMetadata {
  path: string;
  size: number;
  updatedAt: string;
  contentType: string;
  sha256: string;
}

class R2FallbackStore {
  private config: any;
  private baseUrl: string;

  constructor(config: any) {
    this.config = config;
    this.baseUrl = config.publicUrl || `https://${config.bucket}.${config.accountId}.r2.dev`;
  }

  private async signRequest(method: string, path: string, body?: any): Promise<RequestInit> {
    // AWS SigV4 signing for R2
    const { Signer } = await import("@aws-sdk/signature-v4");
    const { Sha256 } = await import("@aws-crypto/sha256-js");
    const { defaultProvider } = await import("@aws-sdk/credential-provider-node");

    const signer = new Signer({
      credentials: defaultProvider(),
      region: "auto",
      service: "s3",
      sha256: Sha256,
    });

    const url = new URL(`${this.baseUrl}${path}`);
    const request = new Request(url.toString(), { method, body: body ? JSON.stringify(body) : undefined });
    const signed = await signer.sign(request);
    return { ...signed, headers: { ...signed.headers, "Content-Type": "application/json" } };
  }

  async put(path: string, data: any): Promise<void> {
    const init = await this.signRequest("PUT", path, data);
    const res = await fetch(`${this.baseUrl}${path}`, { ...init, body: JSON.stringify(data) });
    if (!res.ok) throw new Error(`R2 PUT failed: ${res.status}`);
  }

  async get(path: string): Promise<any> {
    const init = await this.signRequest("GET", path);
    const res = await fetch(`${this.baseUrl}${path}`, init);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`R2 GET failed: ${res.status}`);
    return res.json();
  }

  async delete(path: string): Promise<void> {
    const init = await this.signRequest("DELETE", path);
    const res = await fetch(`${this.baseUrl}${path}`, init);
    if (!res.ok && res.status !== 404) throw new Error(`R2 DELETE failed: ${res.status}`);
  }

  async list(prefix: string): Promise<string[]> {
    const init = await this.signRequest("GET", `?prefix=${encodeURIComponent(prefix)}&list-type=2`);
    const res = await fetch(`${this.baseUrl}?prefix=${encodeURIComponent(prefix)}&list-type=2`, init);
    if (!res.ok) throw new Error(`R2 LIST failed: ${res.status}`);
    const xml = await res.text();
    // Parse XML for keys
    return [];
  }
}

/* ============================================================
 * Hybrid Database (Firebase + R2 Fallback)
 * ============================================================ */

export class HybridDatabase implements IDatabase {
  private firebase: FirebaseDatabase;
  private r2: R2FallbackStore;
  private demo: DemoDatabase;
  private mode: "firebase" | "firebase+r2" | "r2-only" | "demo";
  private largeDocThreshold = 500 * 1024; // 500KB - docs larger go to R2

  constructor(firebaseConfig: any, r2Config: any, mode: "firebase" | "firebase+r2" | "r2-only" | "demo" = "firebase+r2") {
    this.firebase = new FirebaseDatabase(firebaseConfig);
    this.r2 = new R2FallbackStore(r2Config);
    this.demo = new DemoDatabase();
    this.mode = mode;
  }

  private async useDemo(): Promise<boolean> {
    return this.mode === "demo" || !(await this.firebaseReady());
  }

  private async firebaseReady(): Promise<boolean> {
    try {
      await this.firebase.getDoc("_health/check");
      return true;
    } catch {
      return false;
    }
  }

  private getImplementation(): IDatabase {
    if (this.mode === "demo") return this.demo;
    if (this.mode === "r2-only") throw new Error("R2-only mode not fully implemented for queries");
    return this.firebase;
  }

  // Delegate all methods to the active implementation
  async getDoc<T>(pathOrRef: string | DocumentReference<T>): Promise<T | null> {
    const impl = this.getImplementation();
    return impl.getDoc(pathOrRef);
  }

  async setDoc<T>(pathOrRef: string | DocumentReference<T>, data: T, merge = false): Promise<void> {
    const path = typeof pathOrRef === "string" ? pathOrRef : pathOrRef.path;
    const size = JSON.stringify(data).length;

    // Write to primary
    const impl = this.getImplementation();
    await impl.setDoc(pathOrRef, data, merge);

    // Mirror large docs to R2 for fallback
    if (size > this.largeDocThreshold && this.mode === "firebase+r2") {
      try {
        await this.r2.put(`docs/${path}`, data);
      } catch (e) {
        console.warn("[HybridDB] R2 mirror failed:", e);
      }
    }
  }

  async updateDoc<T>(pathOrRef: string | DocumentReference<T>, data: Partial<T>): Promise<void> {
    const impl = this.getImplementation();
    await impl.updateDoc(pathOrRef, data);
  }

  async deleteDoc(pathOrRef: string | DocumentReference<any>): Promise<void> {
    const path = typeof pathOrRef === "string" ? pathOrRef : pathOrRef.path;
    const impl = this.getImplementation();
    await impl.deleteDoc(pathOrRef);

    if (this.mode === "firebase+r2") {
      try { await this.r2.delete(`docs/${path}`); } catch {}
    }
  }

  async addDoc<T>(collectionPathOrRef: string | CollectionReference<T>, data: T): Promise<DocumentReference<T>> {
    const impl = this.getImplementation();
    return impl.addDoc(collectionPathOrRef, data);
  }

  async getDocs<T>(collectionPathOrRef: string | CollectionReference<T> | Query<T>, constraints?: QueryConstraint[]): Promise<T[]> {
    const impl = this.getImplementation();
    return impl.getDocs(collectionPathOrRef, constraints);
  }

  onSnapshot<T>(pathOrRef: any, callback: any, options?: SnapshotOptions): () => void {
    const impl = this.getImplementation();
    return (impl as any).onSnapshot(pathOrRef, callback, options);
  }

  batch(): WriteBatch {
    const impl = this.getImplementation();
    return impl.batch();
  }

  async runTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    const impl = this.getImplementation();
    return impl.runTransaction(fn);
  }

  async listCollections(path: string): Promise<string[]> {
    const impl = this.getImplementation();
    return impl.listCollections(path);
  }

  async getCollectionSize(path: string): Promise<number> {
    const impl = this.getImplementation();
    return impl.getCollectionSize(path);
  }

  // Query helpers
  collection(path: string): CollectionReference { return this.demo.collection(path); }
  doc(path: string): DocumentReference { return this.demo.doc(path); }
  query<T>(source: CollectionReference<T> | Query<T>, ...constraints: QueryConstraint[]): Query<T> { return this.demo.query(source, ...constraints); }
  where(field: string, op: string, value: any): QueryConstraint { return this.demo.where(field, op, value); }
  orderBy(field: string, direction?: "asc" | "desc"): QueryConstraint { return this.demo.orderBy(field, direction); }
  limit(value: number): QueryConstraint { return this.demo.limit(value); }
  limitToLast(value: number): QueryConstraint { return this.demo.limitToLast(value); }
  startAt(value: any): QueryConstraint { return this.demo.startAt(value); }
  startAfter(value: any): QueryConstraint { return this.demo.startAfter(value); }
  endAt(value: any): QueryConstraint { return this.demo.endAt(value); }
  endBefore(value: any): QueryConstraint { return this.demo.endBefore(value); }
}

/* ============================================================
 * Factory Function
 * ============================================================ */

export function createDatabase(config: any): IDatabase {
  if (config.mode === "demo" || !config.firebase) {
    return new DemoDatabase();
  }

  if (config.mode === "firebase+r2" && config.r2) {
    return new HybridDatabase(config.firebase, config.r2, "firebase+r2");
  }

  if (config.mode === "firebase") {
    return new FirebaseDatabase(config.firebase);
  }

  return new DemoDatabase();
}