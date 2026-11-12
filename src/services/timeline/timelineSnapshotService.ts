import { 
  TimelineEvent, 
  TimelineManifest, 
  TimelineGraphHealth,
  resolveTimelineDate
} from "@/src/types/timeline";

const CURRENT_SCHEMA_VERSION = 2;
const MIN_SUPPORTED_SCHEMA_VERSION = 1;
const SNAPSHOT_CACHE_KEY_PREFIX = "sm_timeline_snapshot_";
const SNAPSHOT_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory TTL

export class TimelineSnapshotService {
  private static instance: TimelineSnapshotService;

  private memoryCache: {
    events?: { data: TimelineEvent[]; timestamp: number };
    manifest?: { data: TimelineManifest; timestamp: number };
    graphHealth?: { data: TimelineGraphHealth; timestamp: number };
  } = {};

  private constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("timeline-snapshot-invalidated", () => this.invalidate());
    }
  }

  public static getInstance(): TimelineSnapshotService {
    if (!TimelineSnapshotService.instance) {
      TimelineSnapshotService.instance = new TimelineSnapshotService();
    }
    return TimelineSnapshotService.instance;
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
        console.warn("[TimelineSnapshot] LocalStorage eviction failed:", e);
      }
    }
  }

  /**
   * Load manifest metadata
   */
  public async getManifest(): Promise<TimelineManifest | null> {
    const now = Date.now();
    if (this.memoryCache.manifest && (now - this.memoryCache.manifest.timestamp < SNAPSHOT_TTL_MS)) {
      return this.memoryCache.manifest.data;
    }

    try {
      const res = await fetch("/cache/timeline/manifest.json", { cache: "no-cache" });
      if (res.ok) {
        const manifest: TimelineManifest = await res.json();
        if (manifest.schemaVersion >= MIN_SUPPORTED_SCHEMA_VERSION) {
          this.memoryCache.manifest = { data: manifest, timestamp: now };
          return manifest;
        }
      }
    } catch (e) {
      console.warn("[TimelineSnapshot] Failed to load manifest from static cache:", e);
    }

    return null;
  }

  /**
   * Load graph health metrics
   */
  public async getGraphHealth(): Promise<TimelineGraphHealth | null> {
    const now = Date.now();
    if (this.memoryCache.graphHealth && (now - this.memoryCache.graphHealth.timestamp < SNAPSHOT_TTL_MS)) {
      return this.memoryCache.graphHealth.data;
    }

    try {
      const res = await fetch("/cache/timeline/graph-health.json", { cache: "no-cache" });
      if (res.ok) {
        const health: TimelineGraphHealth = await res.json();
        this.memoryCache.graphHealth = { data: health, timestamp: now };
        return health;
      }
    } catch (e) {
      console.warn("[TimelineSnapshot] Failed to load graph health:", e);
    }

    return null;
  }

  /**
   * Retrieve all public, verified timeline events
   * Applies strict verification, provenance validation, and chronology sorting
   */
  public async getPublicTimeline(): Promise<TimelineEvent[]> {
    const now = Date.now();
    if (this.memoryCache.events && (now - this.memoryCache.events.timestamp < SNAPSHOT_TTL_MS)) {
      return this.memoryCache.events.data;
    }

    // Try LocalStorage cache
    if (typeof window !== "undefined") {
      try {
        const cachedStr = localStorage.getItem(`${SNAPSHOT_CACHE_KEY_PREFIX}events`);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (cached && cached.timestamp && (now - cached.timestamp < SNAPSHOT_TTL_MS) && Array.isArray(cached.data)) {
            this.memoryCache.events = { data: cached.data, timestamp: cached.timestamp };
            return cached.data;
          }
        }
      } catch (e) {
        // Continue to fetch
      }
    }

    try {
      const res = await fetch("/cache/timeline/events.json", { cache: "no-cache" });
      if (res.ok) {
        const rawEvents: TimelineEvent[] = await res.json();
        if (Array.isArray(rawEvents)) {
          // Strict public verification gate
          const verifiedEvents = rawEvents.filter(evt => {
            const isPublished = evt.status === "published";
            const isVerified = evt.verificationStatus === "verified";
            const hasSource = Boolean(evt.sourceTitle || (evt.sourceUrls && evt.sourceUrls.length > 0));
            const hasVerifier = Boolean(evt.verifiedBy);
            const isConfidenceAdequate = typeof evt.confidenceScore === "number" ? evt.confidenceScore >= 0.8 : true;
            return isPublished && isVerified && hasSource && hasVerifier && isConfidenceAdequate;
          });

          // Sort chronologically using resolveTimelineDate
          const sorted = verifiedEvents.sort((a, b) => {
            const dateA = resolveTimelineDate(a);
            const dateB = resolveTimelineDate(b);
            return dateA.sortKey - dateB.sortKey;
          });

          this.memoryCache.events = { data: sorted, timestamp: now };
          
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(`${SNAPSHOT_CACHE_KEY_PREFIX}events`, JSON.stringify({
                data: sorted,
                timestamp: now
              }));
            } catch (e) {}
          }

          return sorted;
        }
      }
    } catch (e) {
      console.error("[TimelineSnapshot] Failed to fetch timeline snapshot:", e);
    }

    return [];
  }

  /**
   * Retrieve a single event by ID from the public snapshot
   */
  public async getEventById(id: string): Promise<TimelineEvent | null> {
    if (!id) return null;
    const events = await this.getPublicTimeline();
    return events.find(e => e.id.toLowerCase() === id.toLowerCase()) || null;
  }
}

export const timelineSnapshotService = TimelineSnapshotService.getInstance();
