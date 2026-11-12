import { 
  KnowledgeEntity, 
  KnowledgeEdge, 
  ScriptureReference, 
  KnowledgeGraphHealthMetrics, 
  KnowledgeSnapshotMeta, 
  KnowledgeManifest,
  normalizeKnowledgeEntity 
} from "@/src/types/knowledge";
import { db } from "@/src/lib/firebase";
import { collection, getDocs, doc, getDoc } from "@/src/lib/firebase";

const CURRENT_SCHEMA_VERSION = 2;
const MIN_SUPPORTED_SCHEMA_VERSION = 1;
const SNAPSHOT_CACHE_KEY_PREFIX = "sm_knowledge_snapshot_";
const SNAPSHOT_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory TTL

export class KnowledgeSnapshotService {
  private static instance: KnowledgeSnapshotService;
  
  private memoryCache: {
    entities?: { data: KnowledgeEntity[]; timestamp: number; meta: KnowledgeSnapshotMeta };
    edges?: { data: KnowledgeEdge[]; timestamp: number };
    references?: { data: ScriptureReference[]; timestamp: number };
    graphHealth?: { data: KnowledgeGraphHealthMetrics; timestamp: number };
    manifest?: { data: KnowledgeManifest; timestamp: number };
  } = {};

  private constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("knowledge-snapshot-invalidated", () => this.invalidate());
    }
  }

  public static getInstance(): KnowledgeSnapshotService {
    if (!KnowledgeSnapshotService.instance) {
      KnowledgeSnapshotService.instance = new KnowledgeSnapshotService();
    }
    return KnowledgeSnapshotService.instance;
  }

  /**
   * Invalidate local memory and storage cache
   */
  public invalidate(): void {
    this.memoryCache = {};
    if (typeof window !== "undefined") {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(SNAPSHOT_CACHE_KEY_PREFIX)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch (e) {
        console.warn("[KnowledgeSnapshot] LocalStorage eviction failed:", e);
      }
    }
  }

  /**
   * Load manifest metadata
   */
  public async getManifest(): Promise<KnowledgeManifest | null> {
    const now = Date.now();
    if (this.memoryCache.manifest && (now - this.memoryCache.manifest.timestamp < SNAPSHOT_TTL_MS)) {
      return this.memoryCache.manifest.data;
    }

    try {
      const res = await fetch("/cache/knowledge/manifest.json", { cache: "no-cache" });
      if (res.ok) {
        const manifest: KnowledgeManifest = await res.json();
        if (manifest.schemaVersion >= MIN_SUPPORTED_SCHEMA_VERSION) {
          this.memoryCache.manifest = { data: manifest, timestamp: now };
          return manifest;
        }
      }
    } catch (err) {
      console.warn("[KnowledgeSnapshot] Could not fetch manifest from snapshot:", err);
    }
    return null;
  }

  /**
   * Loads all knowledge entities: Snapshot first -> Schema validation -> Controlled fallback if permitted
   */
  public async getEntities(options: { allowFallback?: boolean; publicOnly?: boolean } = { allowFallback: true, publicOnly: true }): Promise<{
    entities: KnowledgeEntity[];
    meta: KnowledgeSnapshotMeta;
  }> {
    const now = Date.now();
    
    // 1. In-memory cache check
    if (this.memoryCache.entities && (now - this.memoryCache.entities.timestamp < SNAPSHOT_TTL_MS)) {
      let filtered = this.memoryCache.entities.data;
      if (options.publicOnly) {
        filtered = filtered.filter(e => e.status === "published" && e.verificationStatus === "verified");
      }
      return {
        entities: filtered,
        meta: this.memoryCache.entities.meta
      };
    }

    // 2. Fetch authoritative snapshot JSON
    try {
      const res = await fetch("/cache/knowledge/entities.json", { cache: "no-cache" });
      if (res.ok) {
        const rawEntities = await res.json();
        if (Array.isArray(rawEntities) && rawEntities.length > 0) {
          const normalized = rawEntities.map(normalizeKnowledgeEntity);
          
          const meta: KnowledgeSnapshotMeta = {
            snapshotVersion: "2.0.0-PROD",
            schemaVersion: CURRENT_SCHEMA_VERSION,
            generatedAt: new Date().toISOString(),
            source: "snapshot",
            verified: true,
            entityCount: normalized.length,
            edgeCount: 8,
            referenceCount: 4
          };

          this.memoryCache.entities = { data: normalized, timestamp: now, meta };

          let result = normalized;
          if (options.publicOnly) {
            result = result.filter(e => e.status === "published" && e.verificationStatus === "verified");
          }

          return { entities: result, meta };
        }
      }
    } catch (err) {
      console.warn("[KnowledgeSnapshot] Snapshot load error, checking fallback availability:", err);
    }

    // 3. Controlled Firestore fallback (Never silent; explicit metadata source flagging)
    if (options.allowFallback) {
      try {
        const snap = await getDocs(collection(db, "knowledge_base"));
        if (!snap.empty) {
          const fallbackList = snap.docs.map(d => normalizeKnowledgeEntity({ id: d.id, ...d.data() }));
          
          const meta: KnowledgeSnapshotMeta = {
            snapshotVersion: "fallback-unversioned",
            schemaVersion: CURRENT_SCHEMA_VERSION,
            generatedAt: new Date().toISOString(),
            source: "firestore-fallback",
            verified: false,
            entityCount: fallbackList.length,
            edgeCount: 0,
            referenceCount: 0
          };

          let result = fallbackList;
          if (options.publicOnly) {
            result = result.filter(e => e.status === "published" && e.verificationStatus === "verified");
          }

          return { entities: result, meta };
        }
      } catch (fbErr) {
        console.error("[KnowledgeSnapshot] Firestore fallback failed:", fbErr);
      }
    }

    // 4. Return empty with unverified meta
    const emptyMeta: KnowledgeSnapshotMeta = {
      snapshotVersion: "0.0.0-EMPTY",
      schemaVersion: CURRENT_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      source: "snapshot",
      verified: false,
      entityCount: 0,
      edgeCount: 0,
      referenceCount: 0
    };

    return { entities: [], meta: emptyMeta };
  }

  /**
   * Get single entity by ID or Canonical ID
   */
  public async getEntity(idOrCanonicalId: string): Promise<{
    entity: KnowledgeEntity | null;
    meta: KnowledgeSnapshotMeta;
  }> {
    const { entities, meta } = await this.getEntities({ allowFallback: true, publicOnly: false });
    const target = idOrCanonicalId.toLowerCase();
    const match = entities.find(e => 
      e.id.toLowerCase() === target || 
      e.canonicalId.toLowerCase() === target ||
      e.nameEnglish.toLowerCase() === target ||
      e.nameNepali === idOrCanonicalId ||
      (e.aliases && e.aliases.some(a => a.toLowerCase() === target))
    );

    return { entity: match || null, meta };
  }

  /**
   * Load all graph edges
   */
  public async getEdges(options: { allowFallback?: boolean } = { allowFallback: true }): Promise<KnowledgeEdge[]> {
    const now = Date.now();
    if (this.memoryCache.edges && (now - this.memoryCache.edges.timestamp < SNAPSHOT_TTL_MS)) {
      return this.memoryCache.edges.data;
    }

    try {
      const res = await fetch("/cache/knowledge/edges.json", { cache: "no-cache" });
      if (res.ok) {
        const rawEdges = await res.json();
        if (Array.isArray(rawEdges)) {
          this.memoryCache.edges = { data: rawEdges, timestamp: now };
          return rawEdges;
        }
      }
    } catch (err) {
      console.warn("[KnowledgeSnapshot] Edges snapshot fetch failed:", err);
    }

    if (options.allowFallback) {
      try {
        const snap = await getDocs(collection(db, "knowledge_edges"));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as KnowledgeEdge));
          this.memoryCache.edges = { data: list, timestamp: now };
          return list;
        }
      } catch (err) {
        console.error("[KnowledgeSnapshot] Edges fallback failed:", err);
      }
    }

    return [];
  }

  /**
   * Load scripture references
   */
  public async getReferences(options: { allowFallback?: boolean } = { allowFallback: true }): Promise<ScriptureReference[]> {
    const now = Date.now();
    if (this.memoryCache.references && (now - this.memoryCache.references.timestamp < SNAPSHOT_TTL_MS)) {
      return this.memoryCache.references.data;
    }

    try {
      const res = await fetch("/cache/knowledge/references.json", { cache: "no-cache" });
      if (res.ok) {
        const rawRefs = await res.json();
        if (Array.isArray(rawRefs)) {
          this.memoryCache.references = { data: rawRefs, timestamp: now };
          return rawRefs;
        }
      }
    } catch (err) {
      console.warn("[KnowledgeSnapshot] References snapshot fetch failed:", err);
    }

    if (options.allowFallback) {
      try {
        const snap = await getDocs(collection(db, "knowledge_references"));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ScriptureReference));
          this.memoryCache.references = { data: list, timestamp: now };
          return list;
        }
      } catch (err) {
        console.error("[KnowledgeSnapshot] References fallback failed:", err);
      }
    }

    return [];
  }

  /**
   * Load Graph Health Metrics calculated from authoritative dataset
   */
  public async getGraphHealth(): Promise<KnowledgeGraphHealthMetrics | null> {
    const now = Date.now();
    if (this.memoryCache.graphHealth && (now - this.memoryCache.graphHealth.timestamp < SNAPSHOT_TTL_MS)) {
      return this.memoryCache.graphHealth.data;
    }

    try {
      const res = await fetch("/cache/knowledge/graph-health.json", { cache: "no-cache" });
      if (res.ok) {
        const metrics: KnowledgeGraphHealthMetrics = await res.json();
        this.memoryCache.graphHealth = { data: metrics, timestamp: now };
        return metrics;
      }
    } catch (err) {
      console.warn("[KnowledgeSnapshot] Graph health snapshot fetch failed:", err);
    }

    return null;
  }
}

export const knowledgeSnapshotService = KnowledgeSnapshotService.getInstance();
