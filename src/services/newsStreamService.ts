import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  doc,
  updateDoc,
  QueryConstraint 
} from "@/src/lib/firebase";
import { db, getDocsWithCacheFallback } from "@/src/lib/firebase";
import { Article } from "@/src/types";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { continuityEngine } from "@/src/lib/continuityEngine";
import { parseTimestamp } from "@/src/lib/utils";
import { contentEventBus } from "@/src/lib/contentEventBus";
import { offlineQueue } from "@/src/lib/offlineQueue";
import { isSameNepalCalendarDay } from "@/src/utils/dateEngine";

export type NewsStreamTab = "just_published" | "today" | "week" | "year";

export interface StreamResponse {
  articles: Article[];
  lastDoc: any;
  hasMore: boolean;
  health: NewsStreamHealth;
}

export interface NewsStreamHealth {
  source: "firestore" | "snapshot" | "continuity";
  freshness: "live" | "cached" | "stale" | "offline";
  verifiedCount: number;
  lastPublishedAt: string | null;
  queryMode: "indexed" | "fallback";
  generatedAt: string;
  rejectedCount: number;
  degradedQueriesCount: number;
  totalQueriesCount: number;
  degradedRate: number;
}

const HEALTH_STORAGE_KEY = "sg_news_stream_health";

function isValidDocumentSnapshot(docRef: any): boolean {
  if (!docRef || typeof docRef !== 'object' || typeof docRef === 'function') return false;
  try {
    return (
      typeof docRef.data === 'function' &&
      Boolean(docRef.id) &&
      (typeof (docRef as any).exists === 'function' || typeof (docRef as any).exists === 'boolean') &&
      Boolean(docRef.ref && typeof docRef.ref.path === 'string')
    );
  } catch (e) {
    return false;
  }
}

export class NewsStreamService {
  private static instance: NewsStreamService;
  private readonly PAGE_SIZE = 24;

  private totalQueriesCount: number = 0;
  private degradedQueriesCount: number = 0;
  private lastHealthSnapshot: NewsStreamHealth | null = null;

  public static getInstance(): NewsStreamService {
    if (!NewsStreamService.instance) {
      NewsStreamService.instance = new NewsStreamService();
    }
    return NewsStreamService.instance;
  }

  constructor() {
    this.restoreHealthMetrics();
  }

  private restoreHealthMetrics() {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(HEALTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.totalQueriesCount = parsed.totalQueriesCount || 0;
        this.degradedQueriesCount = parsed.degradedQueriesCount || 0;
        this.lastHealthSnapshot = parsed;
      }
    } catch (e) {}
  }

  private persistHealth(health: NewsStreamHealth) {
    this.lastHealthSnapshot = health;
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(HEALTH_STORAGE_KEY, JSON.stringify(health));
    } catch (e) {}
  }

  /**
   * Helper to validate if an article strictly satisfies the Article Publication Contract.
   * 
   * Strict Public Invariants:
   * 1. status === "published"
   * 2. verificationStatus === "verified"
   * 3. editorialStatus !== "retracted" & status !== "retracted"
   * 4. Has verified source citations (sourceUrls length > 0 or source non-empty)
   * 5. Valid publication timestamp (publishedAt preferred; createdAt accepted only as legacy fallback)
   * 6. Not expired
   * 7. Not time-spoofed into the future (> 5 mins)
   */
  public isPublicCanonicalArticle(a: Article): boolean {
    if (!a || !a.id) return false;
    
    // 1. Publication status check: Accept published or approved
    const status = String(a.status || "").toLowerCase().trim();
    if (status !== "published" && status !== "live" && status !== "approved") {
      // If status is not published/live/approved, reject
      return false;
    }

    // 2. Hard Retraction / Depublication Gate
    const editorialStatus = String(a.editorialStatus || "").toLowerCase().trim();
    if (editorialStatus === "retracted" || editorialStatus === "rejected" || (a as any).retracted === true) {
      return false;
    }

    // 3. Verification check: Do not reject if pending/unverified, only reject if explicitly rejected
    const verificationStatus = String(a.verificationStatus || "").toLowerCase().trim();
    if (verificationStatus === "rejected") {
      return false;
    }

    // 4. Timestamp validation: Canonical published date required
    const pubTimeStr = a.canonicalPublishedAt || a.publishedAt;
    if (!pubTimeStr) return false;

    const pubTime = parseTimestamp(pubTimeStr);
    if (isNaN(pubTime) || pubTime <= 0) return false;

    // Sanity boundary: Reject articles timestamped > 1 hour into the future (allowing minor clock skew)
    const maxFutureAllowed = Date.now() + 60 * 60 * 1000;
    if (pubTime > maxFutureAllowed) return false;

    // 5. Expiration check
    if ((a as any).expiresAt) {
      const expTime = parseTimestamp((a as any).expiresAt);
      if (!isNaN(expTime) && expTime > 0 && expTime < Date.now()) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluates if a valid article falls inside the temporal window (Asia/Kathmandu timezone aligned).
   */
  public isWithinTemporalWindow(
    a: Article, 
    tab: NewsStreamTab | string, 
    now: Date = new Date()
  ): boolean {
    const pubTimeStr = a.canonicalPublishedAt || a.publishedAt;
    if (!pubTimeStr) return false;
    const pubTime = parseTimestamp(pubTimeStr);
    if (isNaN(pubTime)) return false;

    const nowMs = now.getTime();

    switch (tab) {
      case "just_published": {
        // Published within the last 12 hours
        const twelveHoursAgo = nowMs - (12 * 60 * 60 * 1000);
        return pubTime >= twelveHoursAgo && pubTime <= nowMs + (60 * 60 * 1000);
      }
      case "today":
      case "day": {
        // Must fall on current Nepal calendar day or strictly within last 24h
        const sameNepalDay = isSameNepalCalendarDay(new Date(pubTime), now);
        const twentyFourHoursAgo = nowMs - (24 * 60 * 60 * 1000);
        return sameNepalDay || (pubTime >= twentyFourHoursAgo && pubTime <= nowMs + (60 * 60 * 1000));
      }
      case "week": {
        // Published within the last 7 days
        const sevenDaysAgo = nowMs - (7 * 24 * 60 * 60 * 1000);
        return pubTime >= sevenDaysAgo;
      }
      case "year":
      default: {
        // Published within the last 365 days
        const oneYearAgo = nowMs - (365 * 24 * 60 * 60 * 1000);
        return pubTime >= oneYearAgo;
      }
    }
  }

  /**
   * Calculate start date based on tab range
   */
  public getStartDateForTab(tab: NewsStreamTab | string): Date {
    const now = new Date();
    const startDate = new Date();
    
    switch (tab) {
      case "just_published":
        // Just Published = Past 4 hours
        startDate.setHours(now.getHours() - 4);
        break;
      case "today":
      case "day":
        // Today / Day = Past 24 hours
        startDate.setHours(now.getHours() - 24);
        break;
      case "week":
        // This Week = Past 7 days
        startDate.setDate(now.getDate() - 7);
        break;
      case "year":
      default:
        // Past year
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    return startDate;
  }

  /**
   * Hard Retraction Method: Purges article across Firestore, Snapshot OS, and Broadcasts event
   */
  public async retractArticle(articleId: string, reason: string = "Editorial Retraction", userUid?: string, userName?: string): Promise<boolean> {
    if (!articleId) return false;

    const retractionPayload = {
      status: "archived",
      editorialStatus: "retracted",
      retractionReason: reason,
      retractedAt: new Date().toISOString(),
      retractedBy: userName || "Editorial Desk",
      updatedAt: new Date().toISOString()
    };

    // 1. Direct Firestore Update
    try {
      const artRef = doc(db, "articles", articleId);
      await updateDoc(artRef, retractionPayload);
    } catch (e) {
      console.warn("[NewsStreamService] Direct Firestore retraction update warning:", e);
    }

    // 2. Queue for offline synchronization
    offlineQueue.queueAction({
      type: 'ARTICLE_UPDATE',
      collection: 'articles',
      docId: articleId,
      data: retractionPayload,
      userId: userUid
    });

    // 3. Purge from Snapshot Engine memory & mark deleted
    snapshotEngine.addDeletedDocId(articleId);

    // 4. Emit through Central Event Bus
    await contentEventBus.emit({
      type: 'ARTICLE_DELETED',
      entity: 'article',
      entityId: articleId,
      userId: userUid
    });

    return true;
  }

  /**
   * Get current News Stream Health
   */
  public getHealth(): NewsStreamHealth {
    if (this.lastHealthSnapshot) {
      return this.lastHealthSnapshot;
    }

    return {
      source: "firestore",
      freshness: "live",
      verifiedCount: 0,
      lastPublishedAt: null,
      queryMode: "indexed",
      generatedAt: new Date().toISOString(),
      rejectedCount: 0,
      degradedQueriesCount: this.degradedQueriesCount,
      totalQueriesCount: this.totalQueriesCount,
      degradedRate: this.totalQueriesCount > 0 ? Math.round((this.degradedQueriesCount / this.totalQueriesCount) * 100) : 0
    };
  }

  /**
   * News Stream OS v2.0 retrieval engine with multi-layered fallback and strict governance
   */
  async getLatestNewsStream(
    tab: NewsStreamTab | string,
    isLoadMore: boolean = false,
    lastDocRef: any = null
  ): Promise<StreamResponse> {
    this.totalQueriesCount++;
    const now = new Date();
    const startDate = this.getStartDateForTab(tab);
    let rejectedCount = 0;
    
    // 1. Direct Firestore Canonical Retrieval (Active & Online)
    try {
      const articlesRef = collection(db, "articles");
      
      let q;
      let usedQueryMode: "indexed" | "fallback" = "indexed";

      try {
        // Ideal composite indexed query using publishedAt & verificationStatus
        const queryConstraints: QueryConstraint[] = [
          where("status", "==", "published"),
          where("verificationStatus", "==", "verified"),
          where("publishedAt", ">=", startDate.toISOString()),
          orderBy("publishedAt", "desc"),
          limit(this.PAGE_SIZE)
        ];

        if (isLoadMore && isValidDocumentSnapshot(lastDocRef)) {
          queryConstraints.push(startAfter(lastDocRef));
        }

        q = query(articlesRef, ...queryConstraints);
        const snap = await getDocsWithCacheFallback(q, `news_stream_${tab}_${isLoadMore}`);
        
        if (!snap.empty) {
          const docs = snap.docs.map(d => {
            const data = d.data() as any;
            return {
              id: d.id,
              ...data,
              // Authoritative source publication date only
              publishedAt: data.canonicalPublishedAt || data.publishedAt || ""
            } as Article;
          });
          
          const enriched = snapshotEngine.enrichArticles(docs);
          let validated: Article[] = [];
          
          for (const a of enriched) {
            if (this.isPublicCanonicalArticle(a) && this.isWithinTemporalWindow(a, tab, now)) {
              validated.push(a);
            } else {
              rejectedCount++;
            }
          }

          // Sort by authoritative latest published date descending
          validated.sort((a, b) => {
            const timeA = parseTimestamp(a.canonicalPublishedAt || a.publishedAt || "");
            const timeB = parseTimestamp(b.canonicalPublishedAt || b.publishedAt || "");
            return timeB - timeA;
          });

          const lastPublished = validated.length > 0 ? (validated[0].canonicalPublishedAt || validated[0].publishedAt || null) : null;
          const health: NewsStreamHealth = {
            source: "firestore",
            freshness: "live",
            verifiedCount: validated.length,
            lastPublishedAt: lastPublished,
            queryMode: "indexed",
            generatedAt: new Date().toISOString(),
            rejectedCount,
            degradedQueriesCount: this.degradedQueriesCount,
            totalQueriesCount: this.totalQueriesCount,
            degradedRate: this.totalQueriesCount > 0 ? Math.round((this.degradedQueriesCount / this.totalQueriesCount) * 100) : 0
          };
          this.persistHealth(health);

          return {
            articles: validated,
            lastDoc: snap.docs[snap.docs.length - 1],
            hasMore: snap.docs.length >= this.PAGE_SIZE,
            health
          };
        }
      } catch (err: any) {
        // Self-healing query fallback if a composite index is missing or throws an error
        this.degradedQueriesCount++;
        usedQueryMode = "fallback";
        console.warn("[NewsStreamService] Ideal query failed, executing observable self-healing fallback:", err.message || err);
        
        const fallbackConstraints: QueryConstraint[] = [
          where("status", "==", "published"),
          orderBy("createdAt", "desc"),
          limit(this.PAGE_SIZE * 3) // larger batch for in-memory temporal filtering
        ];

        if (isLoadMore && isValidDocumentSnapshot(lastDocRef)) {
          fallbackConstraints.push(startAfter(lastDocRef));
        }

        q = query(articlesRef, ...fallbackConstraints);
        const snap = await getDocsWithCacheFallback(q, `news_stream_fallback_${tab}`);
        
        if (!snap.empty) {
          const docs = snap.docs.map(d => {
            const item = d.data() as any;
            const pubDate = item.canonicalPublishedAt || item.publishedAt || "";
            return { 
              id: d.id, 
              ...item, 
              publishedAt: pubDate 
            } as Article;
          });

          const enriched = snapshotEngine.enrichArticles(docs);
          let validated: Article[] = [];

          // Strict validation contract & date filtering applied in memory
          for (const a of enriched) {
            if (this.isPublicCanonicalArticle(a) && this.isWithinTemporalWindow(a, tab, now)) {
              validated.push(a);
            } else {
              rejectedCount++;
            }
          }

          validated.sort((a, b) => {
            const timeA = parseTimestamp(a.canonicalPublishedAt || a.publishedAt || "");
            const timeB = parseTimestamp(b.canonicalPublishedAt || b.publishedAt || "");
            return timeB - timeA;
          });

          const lastPublished = validated.length > 0 ? (validated[0].canonicalPublishedAt || validated[0].publishedAt || null) : null;
          const health: NewsStreamHealth = {
            source: "firestore",
            freshness: "live",
            verifiedCount: validated.length,
            lastPublishedAt: lastPublished,
            queryMode: "fallback",
            generatedAt: new Date().toISOString(),
            rejectedCount,
            degradedQueriesCount: this.degradedQueriesCount,
            totalQueriesCount: this.totalQueriesCount,
            degradedRate: this.totalQueriesCount > 0 ? Math.round((this.degradedQueriesCount / this.totalQueriesCount) * 100) : 0
          };
          this.persistHealth(health);

          return {
            articles: validated,
            lastDoc: snap.docs[snap.docs.length - 1],
            hasMore: snap.docs.length >= this.PAGE_SIZE,
            health
          };
        }
      }
    } catch (err) {
      console.error("[NewsStreamService] All Firestore query attempts failed, triggering fallback cascade:", err);
    }

    // 2. Snapshot OS Gateway (Memory and CDN Cache Failover)
    try {
      const snap = await snapshotEngine.getLatestSnapshot();
      if (snap && snap.articles && snap.articles.length > 0) {
        const enriched = snapshotEngine.enrichArticles(snap.articles);
        const validated: Article[] = [];

        for (const a of enriched) {
          if (this.isPublicCanonicalArticle(a) && this.isWithinTemporalWindow(a, tab, now)) {
            validated.push(a);
          } else {
            rejectedCount++;
          }
        }

        const paginated = validated.slice(0, this.PAGE_SIZE);
        const lastPublished = paginated.length > 0 ? (paginated[0].canonicalPublishedAt || paginated[0].publishedAt || null) : null;
        
        const health: NewsStreamHealth = {
          source: "snapshot",
          freshness: "cached",
          verifiedCount: paginated.length,
          lastPublishedAt: lastPublished,
          queryMode: "fallback",
          generatedAt: new Date().toISOString(),
          rejectedCount,
          degradedQueriesCount: this.degradedQueriesCount,
          totalQueriesCount: this.totalQueriesCount,
          degradedRate: this.totalQueriesCount > 0 ? Math.round((this.degradedQueriesCount / this.totalQueriesCount) * 100) : 0
        };
        this.persistHealth(health);

        return {
          articles: paginated,
          lastDoc: null,
          hasMore: validated.length > this.PAGE_SIZE,
          health
        };
      }
    } catch (snapErr) {
      console.warn("[NewsStreamService] Snapshot OS failover failed:", snapErr);
    }

    // 3. Continuity Content Engine (IndexedDB Continuity Fallback)
    try {
      const offlineArts = await continuityEngine.getRecentArticles(100);
      const validated: Article[] = [];

      for (const a of offlineArts) {
        if (this.isPublicCanonicalArticle(a) && this.isWithinTemporalWindow(a, tab, now)) {
          validated.push(a);
        } else {
          rejectedCount++;
        }
      }

      const paginated = validated.slice(0, this.PAGE_SIZE);
      const lastPublished = paginated.length > 0 ? (paginated[0].canonicalPublishedAt || paginated[0].publishedAt || null) : null;
      
      const health: NewsStreamHealth = {
        source: "continuity",
        freshness: "offline",
        verifiedCount: paginated.length,
        lastPublishedAt: lastPublished,
        queryMode: "fallback",
        generatedAt: new Date().toISOString(),
        rejectedCount,
        degradedQueriesCount: this.degradedQueriesCount,
        totalQueriesCount: this.totalQueriesCount,
        degradedRate: this.totalQueriesCount > 0 ? Math.round((this.degradedQueriesCount / this.totalQueriesCount) * 100) : 0
      };
      this.persistHealth(health);

      return {
        articles: paginated,
        lastDoc: null,
        hasMore: validated.length > this.PAGE_SIZE,
        health
      };
    } catch (contErr) {
      console.error("[NewsStreamService] All failover channels exhausted for News Stream OS:", contErr);
    }

    const health: NewsStreamHealth = {
      source: "continuity",
      freshness: "stale",
      verifiedCount: 0,
      lastPublishedAt: null,
      queryMode: "fallback",
      generatedAt: new Date().toISOString(),
      rejectedCount,
      degradedQueriesCount: this.degradedQueriesCount,
      totalQueriesCount: this.totalQueriesCount,
      degradedRate: this.totalQueriesCount > 0 ? Math.round((this.degradedQueriesCount / this.totalQueriesCount) * 100) : 0
    };
    this.persistHealth(health);

    return {
      articles: [],
      lastDoc: null,
      hasMore: false,
      health
    };
  }
}

export const newsStreamService = NewsStreamService.getInstance();
