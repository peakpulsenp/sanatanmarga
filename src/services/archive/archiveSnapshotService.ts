import { 
  ArchiveRecord, 
  ArchiveManifest, 
  ArchiveHealth,
  resolveArchiveDate
} from "./archiveTypes";

const CURRENT_SCHEMA_VERSION = 2;
const MIN_SUPPORTED_SCHEMA_VERSION = 1;
const SNAPSHOT_CACHE_KEY_PREFIX = "sm_archive_snapshot_";
const SNAPSHOT_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory TTL

export class ArchiveSnapshotService {
  private static instance: ArchiveSnapshotService;

  private memoryCache: {
    records?: { data: ArchiveRecord[]; timestamp: number };
    manifest?: { data: ArchiveManifest; timestamp: number };
    health?: { data: ArchiveHealth; timestamp: number };
  } = {};

  private constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("archive-snapshot-invalidated", () => this.invalidate());
    }
  }

  public static getInstance(): ArchiveSnapshotService {
    if (!ArchiveSnapshotService.instance) {
      ArchiveSnapshotService.instance = new ArchiveSnapshotService();
    }
    return ArchiveSnapshotService.instance;
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
        console.warn("[ArchiveSnapshot] LocalStorage eviction failed:", e);
      }
    }
  }

  /**
   * Load manifest metadata
   */
  public async getArchiveManifest(): Promise<ArchiveManifest | null> {
    const now = Date.now();
    if (this.memoryCache.manifest && (now - this.memoryCache.manifest.timestamp < SNAPSHOT_TTL_MS)) {
      return this.memoryCache.manifest.data;
    }

    try {
      const res = await fetch("/cache/archives/manifest.json", { cache: "no-cache" });
      if (res.ok) {
        const manifest: ArchiveManifest = await res.json();
        if (manifest && manifest.schemaVersion >= MIN_SUPPORTED_SCHEMA_VERSION) {
          this.memoryCache.manifest = { data: manifest, timestamp: now };
          return manifest;
        }
      }
    } catch (e) {
      console.warn("[ArchiveSnapshot] Failed to load manifest from static cache:", e);
    }

    return null;
  }

  /**
   * Load graph health metrics
   */
  public async getArchiveHealth(): Promise<ArchiveHealth | null> {
    const now = Date.now();
    if (this.memoryCache.health && (now - this.memoryCache.health.timestamp < SNAPSHOT_TTL_MS)) {
      return this.memoryCache.health.data;
    }

    try {
      const res = await fetch("/cache/archives/graph-health.json", { cache: "no-cache" });
      if (res.ok) {
        const health: ArchiveHealth = await res.json();
        this.memoryCache.health = { data: health, timestamp: now };
        return health;
      }
    } catch (e) {
      console.warn("[ArchiveSnapshot] Failed to load graph health:", e);
    }

    return null;
  }

  /**
   * Retrieve all public, verified archive records
   * Applies strict verification, provenance validation, and chronological sorting
   */
  public async getPublicArchives(): Promise<ArchiveRecord[]> {
    const now = Date.now();
    if (this.memoryCache.records && (now - this.memoryCache.records.timestamp < SNAPSHOT_TTL_MS)) {
      return this.memoryCache.records.data;
    }

    // Try LocalStorage cache
    if (typeof window !== "undefined") {
      try {
        const cachedStr = localStorage.getItem(`${SNAPSHOT_CACHE_KEY_PREFIX}records`);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (cached && cached.timestamp && (now - cached.timestamp < SNAPSHOT_TTL_MS) && Array.isArray(cached.data)) {
            this.memoryCache.records = { data: cached.data, timestamp: cached.timestamp };
            return cached.data;
          }
        }
      } catch (e) {
        // Continue to fetch
      }
    }

    try {
      const res = await fetch("/cache/archives/records.json", { cache: "no-cache" });
      if (res.ok) {
        const rawRecords: ArchiveRecord[] = await res.json();
        if (Array.isArray(rawRecords)) {
          // Strict public verification and provenance gate
          const verifiedRecords = rawRecords.filter(rec => {
            const isPublished = rec.status === "published";
            const isVerified = rec.verificationStatus === "verified";
            const hasSource = Boolean(rec.sourceTitle || (rec.sourceUrls && rec.sourceUrls.length > 0));
            const hasVerifier = Boolean(rec.verifiedBy);
            const isConfidenceAdequate = typeof rec.confidenceScore === "number" ? rec.confidenceScore >= 0.8 : true;
            return isPublished && isVerified && hasSource && hasVerifier && isConfidenceAdequate;
          });

          // Sort chronologically using resolveArchiveDate
          const sorted = verifiedRecords.sort((a, b) => {
            const dateA = resolveArchiveDate(a);
            const dateB = resolveArchiveDate(b);
            return dateA.sortKey - dateB.sortKey;
          });

          this.memoryCache.records = { data: sorted, timestamp: now };
          
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(`${SNAPSHOT_CACHE_KEY_PREFIX}records`, JSON.stringify({
                data: sorted,
                timestamp: now
              }));
            } catch (e) {}
          }

          return sorted;
        }
      }
    } catch (e) {
      console.error("[ArchiveSnapshot] Failed to fetch archives snapshot:", e);
    }

    return [];
  }

  /**
   * Retrieve a single record by ID from the public snapshot
   */
  public async getArchiveById(id: string): Promise<ArchiveRecord | null> {
    if (!id) return null;
    const records = await this.getPublicArchives();
    return records.find(r => r.id.toLowerCase() === id.toLowerCase()) || null;
  }
}

export const archiveSnapshotService = ArchiveSnapshotService.getInstance();
