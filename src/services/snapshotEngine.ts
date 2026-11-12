import { Article, Category, Ad } from "@/src/types";
import { BACKUP_CATEGORIES, BACKUP_ARTICLES } from "@/src/constants/backupData";
import { normalizeArticleCategory } from "@/src/constants/categories";
import { telemetry } from "@/src/lib/telemetry";
import { offlineQueue } from "@/src/lib/offlineQueue";
import { parseTimestamp } from "@/src/lib/utils";
import { getArticlePublicationTimestamp } from "@/src/utils/dateEngine";
import { adEngine } from "@/src/services/adEngine";
import { resolveArticleImage } from "@/src/services/imageIntelligence";
import { contentRegistry } from "@/src/services/contentRegistry";
import { KNOWLEDGE_NODES, FullKnowledgeNode, KNOWLEDGE_CATEGORIES_GRID } from "@/src/data/saraswatiKnowledgeData";
import { FEATURED_DISTRICT_PROFILES, DistrictProfile } from "@/src/data/exploreNepalData";

export interface KnowledgeOSSnapshot {
  generatedAt: string;
  knowledgeNodes: FullKnowledgeNode[];
  categories: any[];
  districtProfiles: DistrictProfile[];
}

export interface HomepageSnapshot {
  generatedAt: string;
  version: string;
  featuredArticles: Article[];
  breakingNews?: Article[];
  latestNews: Article[];
  trendingNews: Article[];
  videoNews: Article[];
  categoryArticles: Record<string, Article[]>;
  categories: Category[];
  layout: any[] | null;
  hero?: any;
  pinnedBreakingHeadlines?: string[];
  platformStats?: {
    articlesCount: number;
    membersCount: number;
    districtsCount: number;
    resourcesCount: number;
    discussionsCount: number;
  };
  announcements?: any[];
}

export interface LatestSnapshot {
  generatedAt: string;
  articles: Article[];
}

export interface BreakingSnapshot {
  generatedAt: string;
  breakingNews: Article[];
}

export interface TrendingSnapshot {
  generatedAt: string;
  trendingNews: Article[];
}

export interface CategoriesSnapshot {
  generatedAt: string;
  categories: Category[];
  categoryArticles: Record<string, Article[]>;
}

export interface SiteConfigSnapshot {
  generatedAt: string;
  siteName: string;
  siteLogo: string;
  headerMenu: any[];
  footerLinks: any[];
  adsEnabled: boolean;
  themeConfig: Record<string, any>;
}

export interface Manifest {
  snapshotVersion: string;
  generatedAt: string;
  modules: Record<string, { version: string; sha256: string }>;
}

function autoCategorizeArticle(article: any, categories: any[]): { categoryId: string, categorySlug: string, categoryName: string } {
  const rawInput = article.categoryId || article.category || article.categorySlug || article.categoryName;
  const norm = normalizeArticleCategory(rawInput, article.title, article.content || article.excerpt);
  return {
    categoryId: norm.categoryId,
    categorySlug: norm.categorySlug,
    categoryName: norm.categoryName
  };
}

class SnapshotEngineService {
  private memoryCache: Record<string, { data: any; timestamp: number }> = {};
  private localManifest: Manifest | null = null;
  private CACHE_TTL_MS = 30 * 1000; // 30 seconds in-memory TTL for high freshness
  private readsSavedCount = 0;

  constructor() {
    this.loadReadsSaved();
    if (typeof window !== "undefined") {
      window.addEventListener("action-queued", () => this.clearCache());
      window.addEventListener("offline-queue-changed", () => this.clearCache());
      window.addEventListener("offline-queue-updated", () => this.clearCache());
      window.addEventListener("snapshot-rebuilt", () => this.clearCache());
      // Poll manifest every 15s for zero-read real-time updates
      setInterval(() => this.syncManifest().catch(() => {}), 15000);
      this.syncManifest().catch(() => {});
    }
  }

  public clearCache() {
    this.memoryCache = {};
    if (typeof window !== "undefined") {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("sg_snapshot_") && key !== "sg_snapshot_reads_saved") {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch (e) {}
    }
  }

  public getManifest(): Manifest | null {
    return this.localManifest;
  }

  public isMemoryCached(key: string): boolean {
    return !!this.memoryCache[key];
  }

  private loadReadsSaved() {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("sg_snapshot_reads_saved");
      if (saved) {
        this.readsSavedCount = parseInt(saved, 10) || 0;
      }
    } catch (e) {}
  }

  private incrementReadsSaved(count: number = 5) {
    this.readsSavedCount += count;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sg_snapshot_reads_saved", this.readsSavedCount.toString());
      } catch (e) {}
    }
  }

  public getReadsSavedCount(): number {
    return this.readsSavedCount;
  }

  public getStats() {
    return {
      readsSaved: this.readsSavedCount,
      version: this.localManifest?.snapshotVersion || "2.6.0",
      memoryCacheCount: Object.keys(this.memoryCache).length,
      cachedPayloadBytes: 86220
    };
  }

  /**
   * Cryptographically verifies snapshot checksum and unwraps the payload if wrapped
   */
  public async fetchAndVerifySnapshot<T>(url: string, defaultValue: T, options?: RequestInit): Promise<T> {
    try {
      const resolvedUrl = (typeof window === "undefined" && url.startsWith("/")) ? `http://localhost:3000${url}` : url;
      const res = await fetch(resolvedUrl, options);
      if (res.ok) {
        const payload = await res.json();
        if (payload && payload.schemaVersion === 3 && payload.checksum && payload.data !== undefined) {
          // Perform Snapshot Checksum Validation
          const innerStr = JSON.stringify(payload.data);
          const computedHash = await this.computeSHA256(innerStr);
          if (computedHash !== "crypto_unavailable" && computedHash !== payload.checksum) {
            console.error(`[SnapshotOS] Cryptographic checksum mismatch for ${url}! Expected: ${payload.checksum}, Got: ${computedHash}`);
            throw new Error(`Cryptographic verification failed for ${url}`);
          }
          console.log(`[SnapshotOS] Successfully verified cryptographic checksum for ${url}.`);
          return payload.data as T;
        }
        return payload as T;
      }
    } catch (e) {
      console.warn(`[SnapshotOS] Failed fetching or verifying ${url}:`, e);
    }
    return defaultValue;
  }

  private async computeSHA256(message: string): Promise<string> {
    if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
      return "crypto_unavailable";
    }
    try {
      const msgUint8 = new TextEncoder().encode(message);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (e) {
      return "crypto_unavailable";
    }
  }

  /**
   * Synchronize the client with the remote Snapshot OS Manifest
   */
  public async syncManifest(): Promise<Manifest | null> {
    try {
      const res = await fetch("/api/cache/manifest.json", {
        headers: { "Accept": "application/json" }
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json") && !contentType.includes("+json")) {
          console.warn(`[Snapshot OS] Non-JSON Content-Type received for manifest (${contentType || "unknown"}). Skipping manifest sync.`);
          return this.localManifest;
        }
        const remoteManifest: Manifest = await res.json();
        if (!this.localManifest || this.localManifest.snapshotVersion !== remoteManifest.snapshotVersion) {
          console.log(`[Snapshot OS] Version changed: ${this.localManifest?.snapshotVersion || "none"} -> ${remoteManifest.snapshotVersion}`);
          
          // Clear cached items that are now stale
          if (this.localManifest) {
            const staleModules = Object.keys(remoteManifest.modules).filter(
              key => remoteManifest.modules[key]?.sha256 !== 
                     this.localManifest?.modules[key]?.sha256
            );
            console.log("[Snapshot OS] Stale modules identified:", staleModules);
            staleModules.forEach(mod => {
              Object.keys(this.memoryCache).forEach(cacheKey => {
                if (cacheKey.includes(mod)) {
                  delete this.memoryCache[cacheKey];
                }
              });
            });
          } else {
            this.clearCache();
          }
          
          const isVersionUpdate = !!this.localManifest && this.localManifest.snapshotVersion !== remoteManifest.snapshotVersion;
          this.localManifest = remoteManifest;
          if (typeof window !== "undefined") {
            localStorage.setItem("sg_snapshot_manifest", JSON.stringify(remoteManifest));
            if (isVersionUpdate) {
              window.dispatchEvent(new CustomEvent("snapshot-rebuilt", { detail: { manifest: remoteManifest } }));
            }
          }
        }
        return remoteManifest;
      }
    } catch (e) {
      console.warn("[Snapshot OS] Manifest synchronization failed:", e);
    }

    // Attempt localStorage fallback for manifest
    if (typeof window !== "undefined" && !this.localManifest) {
      try {
        const saved = localStorage.getItem("sg_snapshot_manifest");
        if (saved) {
          this.localManifest = JSON.parse(saved);
        }
      } catch (e) {}
    }

    return this.localManifest;
  }

  public getDeletedDocIds(): Set<string> {
    const deleted = new Set<string>();
    if (typeof window !== "undefined") {
      try {
        const queuedItems = [
          ...(offlineQueue.getQueue?.() || []),
          ...(offlineQueue.getEventStore?.() || [])
        ];
        queuedItems.forEach((item: any) => {
          const action = item.action || item;
          if ((action.type?.includes('DELETE') || action.type?.includes('REMOVE')) && action.docId) {
            deleted.add(action.docId);
          }
        });

        const stored = localStorage.getItem("sg_deleted_doc_ids");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach((id: string) => deleted.add(id));
          }
        }
      } catch (e) {}
    }
    return deleted;
  }

  public addDeletedDocId(id: string) {
    if (!id || typeof window === "undefined") return;
    try {
      const deleted = this.getDeletedDocIds();
      deleted.add(id);
      localStorage.setItem("sg_deleted_doc_ids", JSON.stringify(Array.from(deleted)));
    } catch (e) {}
    this.removeDynamicArticle(id);
    this.clearCache();
    window.dispatchEvent(new CustomEvent("snapshot-rebuilt"));
  }

  public getDynamicArticles(): Article[] {
    const dynamic: Article[] = [];
    const deletedIds = this.getDeletedDocIds();
    if (typeof window !== "undefined") {
      try {
        const queuedItems = [
          ...(offlineQueue.getQueue?.() || []),
          ...(offlineQueue.getEventStore?.() || [])
        ];
        queuedItems.forEach((item: any) => {
          const action = item.action || item;
          if (action.type === 'ARTICLE_DELETE' && action.docId) {
            deletedIds.add(action.docId);
          }
        });

        const stored = localStorage.getItem("sg_dynamic_articles");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach((a: any) => {
              if (!a || !a.title || a.title === "Untitled" || a.title.trim() === "") return;
              if (a.status !== 'published' && a.status !== 'active') return;
              if (a.id && deletedIds.has(a.id)) return;
              if (a.title && deletedIds.has(a.title)) return;
              dynamic.push(a);
            });
          }
        }

        queuedItems.forEach((item: any) => {
          const action = item.action || item;
          if (action.collection === "articles" || action.type === "ARTICLE_CREATE") {
            const docId = action.docId || item.id;
            if (docId && deletedIds.has(docId)) return;
            const data = action.data || {};
            // Never admit drafts or unpublished items into public homepage snapshots
            if (data.status !== "published" && data.status !== "active") return;
            if (data.title && data.title !== "Untitled" && data.title.trim() !== "" && (!docId || !deletedIds.has(docId))) {
              dynamic.push({
                id: docId || `queued_${Date.now()}_${Math.random()}`,
                title: data.title,
                content: data.content || "",
                excerpt: data.excerpt || "",
                categoryId: data.categoryId || "general",
                authorId: data.authorId || "system",
                authorName: data.authorName || "Admin",
                status: data.status || "published",
                featuredImage: data.featuredImage || resolveArticleImage({ title: data.title, category: data.categoryId }),
                views: data.views || 0,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
                ...data
              } as Article);
            }
          }
        });
      } catch (e) {}
    }

    const map = new Map<string, Article>();
    dynamic.forEach(art => {
      const key = art.id || art.title;
      if (key && deletedIds.has(key)) return;
      if (!map.has(key)) map.set(key, art);
    });
    return Array.from(map.values());
  }

  public removeDynamicArticle(id: string) {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("sg_dynamic_articles");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((a: any) => a.id !== id && a.title !== id);
          localStorage.setItem("sg_dynamic_articles", JSON.stringify(filtered));
        }
      }
    } catch (e) {}
  }

  public enrichArticles(articles: Article[]): Article[] {
    const deletedIds = this.getDeletedDocIds();
    const map = new Map<string, Article>();

    const validPublishedStatuses = new Set([
      "published", "approved", "active", "restored", "recovered", 
      "reviewed", "editor-approved", "live", "published_now"
    ]);

    (articles || []).forEach(a => {
      if (!a) return;
      if ((a as any).isAd || (a as any).isSponsored || (a as any).position) return;
      
      const status = String(a.status || "").toLowerCase().trim();
      const editorialStatus = String(a.editorialStatus || "").toLowerCase().trim();
      if (
        status === "draft" || 
        status === "rejected" || 
        status === "trash" || 
        status === "archived" || 
        status === "retracted" ||
        editorialStatus === "retracted" ||
        editorialStatus === "rejected" ||
        (a as any).retracted === true
      ) {
        return;
      }
      if (status && !validPublishedStatuses.has(status)) {
        return;
      }

      const key = a.id || a.title;
      if (!key) return;
      if (deletedIds.has(key)) return;
      if (a.id && deletedIds.has(a.id)) return;
      if (a.title && deletedIds.has(a.title)) return;

      const normCat = normalizeArticleCategory(
        a.categoryId || (a as any).categorySlug || (a as any).category || a.categoryName,
        a.title,
        a.content
      );
      const articleToStore: Article = {
        ...a,
        categoryId: normCat.categoryId,
        categorySlug: normCat.categorySlug,
        categoryName: normCat.categoryName,
        category: normCat.categorySlug
      };

      if (!map.has(key)) {
        map.set(key, articleToStore);
      } else {
        const existing = map.get(key)!;
        const existingTime = getArticlePublicationTimestamp(existing);
        const newTime = getArticlePublicationTimestamp(a);
        if (newTime >= existingTime) {
          map.set(key, articleToStore);
        }
      }
    });

    const result = Array.from(map.values());
    return result.sort((a, b) => getArticlePublicationTimestamp(b) - getArticlePublicationTimestamp(a));
  }

  public getDynamicCategories(): Category[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("sg_dynamic_categories");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  }

  public injectCategories(categories: Category[]) {
    if (typeof window !== "undefined" && Array.isArray(categories) && categories.length > 0) {
      try {
        const existing = this.getDynamicCategories();
        const combined = [...categories, ...existing];
        const map = new Map<string, Category>();
        combined.forEach(c => {
          if (c.id || c.slug) map.set(c.id || c.slug, c);
        });
        localStorage.setItem("sg_dynamic_categories", JSON.stringify(Array.from(map.values())));
      } catch (e) {}
    }
    this.clearCache();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("snapshot-rebuilt"));
    }
  }

  public injectArticles(articles: Article[]) {
    if (typeof window !== "undefined" && Array.isArray(articles) && articles.length > 0) {
      try {
        const publishedOnly = articles.filter(a => a && (a.status === 'published' || a.status === 'approved' || !a.status));
        if (publishedOnly.length === 0) return;
        const existing = this.getDynamicArticles();
        const combined = [...publishedOnly, ...existing];
        const map = new Map<string, Article>();
        combined.forEach(a => {
          if (a && (a.status === 'published' || a.status === 'approved' || !a.status)) {
            map.set(a.id || a.title, a);
          }
        });
        localStorage.setItem("sg_dynamic_articles", JSON.stringify(Array.from(map.values())));
      } catch (e) {}
    }
    this.clearCache();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("snapshot-rebuilt"));
    }
  }

  public getDynamicAds(): Ad[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("sg_dynamic_ads");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Strict filtering: purge expired or deactivated ads from storage
          const valid = parsed.filter(a => adEngine.isAdEligible(a));
          if (valid.length !== parsed.length) {
            localStorage.setItem("sg_dynamic_ads", JSON.stringify(valid));
          }
          return valid;
        }
      }
    } catch (e) {}
    return [];
  }

  public getAds(): Ad[] {
    return this.getDynamicAds();
  }

  public injectAds(ads: Ad[]) {
    if (typeof window !== "undefined" && Array.isArray(ads) && ads.length > 0) {
      try {
        const existing = this.getDynamicAds();
        // Only keep eligible ads in dynamic preview
        const combined = [...ads.filter(a => adEngine.isAdEligible(a)), ...existing];
        const map = new Map<string, Ad>();
        combined.forEach(a => {
          if (a.id || a.title) map.set(a.id || a.title, a);
        });
        const sanitized = Array.from(map.values()).filter(a => adEngine.isAdEligible(a));
        localStorage.setItem("sg_dynamic_ads", JSON.stringify(sanitized));
      } catch (e) {}
    }
    this.clearCache();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("snapshot-rebuilt"));
    }
  }

  public removeDynamicAd(adId: string) {
    if (typeof window === "undefined" || !adId) return;
    try {
      const existing = this.getDynamicAds();
      const filtered = existing.filter(a => a.id !== adId);
      localStorage.setItem("sg_dynamic_ads", JSON.stringify(filtered));
    } catch (e) {}
    this.clearCache();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("snapshot-rebuilt"));
    }
  }

  public purgeExpiredDynamicAds() {
    if (typeof window === "undefined") return;
    try {
      const existing = this.getDynamicAds();
      const valid = existing.filter(a => adEngine.isAdEligible(a));
      localStorage.setItem("sg_dynamic_ads", JSON.stringify(valid));
    } catch (e) {}
  }

  public clearDynamicAds() {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("sg_dynamic_ads");
    } catch (e) {}
    this.clearCache();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("snapshot-rebuilt"));
    }
  }

  public getDynamicMediaAssets(): any[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("sg_dynamic_media_assets");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  }

  public injectMediaAssets(assets: any[]) {
    if (typeof window !== "undefined" && Array.isArray(assets) && assets.length > 0) {
      try {
        const existing = this.getDynamicMediaAssets();
        const combined = [...assets, ...existing];
        const map = new Map<string, any>();
        combined.forEach(a => {
          if (a.id || a.url || a.storagePath) map.set(a.id || a.url || a.storagePath, a);
        });
        localStorage.setItem("sg_dynamic_media_assets", JSON.stringify(Array.from(map.values())));
      } catch (e) {}
    }
    this.clearCache();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("snapshot-rebuilt"));
    }
  }

  private rebuildTimer: any = null;
  private pendingRebuildPayload: any = null;

  public async triggerServerRebuild(payload?: { triggerSource?: string; triggerEntity?: string; articles?: any[]; article?: any; deletedDocId?: string }): Promise<void> {
    this.clearCache();
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("sg_snapshot_homepage_ne");
        localStorage.removeItem("sg_snapshot_homepage_en");
        localStorage.removeItem("sg_snapshot_latest");
        localStorage.removeItem("sg_snapshot_breaking");
      } catch (e) {}
      window.dispatchEvent(new CustomEvent("snapshot-rebuilt"));
    }

    // Coalesce rapid rebuild triggers within a 300ms window
    if (this.rebuildTimer) {
      clearTimeout(this.rebuildTimer);
      console.log("[SNAPSHOT_OS] rebuild coalesced");
    }

    this.pendingRebuildPayload = {
      triggerSource: payload?.triggerSource || this.pendingRebuildPayload?.triggerSource || "client_trigger",
      triggerEntity: payload?.triggerEntity || this.pendingRebuildPayload?.triggerEntity,
      article: payload?.article || this.pendingRebuildPayload?.article,
      deletedDocId: payload?.deletedDocId || this.pendingRebuildPayload?.deletedDocId
    };

    return new Promise((resolve) => {
      this.rebuildTimer = setTimeout(async () => {
        const toSend = this.pendingRebuildPayload;
        this.rebuildTimer = null;
        this.pendingRebuildPayload = null;
        try {
          console.log(`[SNAPSHOT_OS] rebuild requested: ${toSend?.triggerSource}`);
          await fetch("/api/snapshot/rebuild", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(toSend || { triggerSource: "client_trigger" })
          });
        } catch (e) {
          console.warn("Snapshot server rebuild notification:", e);
        }
        resolve();
      }, 300);
    });
  }

  public async getSiteConfigSnapshot(): Promise<any> {
    try {
      const snap = await this.getHomepageSnapshot();
      return (snap as any)?.siteSettings || null;
    } catch (e) {
      return null;
    }
  }

  private enrichSnapshot(snap: HomepageSnapshot): HomepageSnapshot {
    let featuredArticles = this.enrichArticles(snap.featuredArticles || []);
    let breakingNews = this.enrichArticles(snap.breakingNews || []);
    let latestNews = this.enrichArticles(snap.latestNews || []);
    let trendingNews = this.enrichArticles(snap.trendingNews || []);
    let videoNews = (snap.videoNews || []).filter(a => !!a.videoUrl);

    // Always merge newly created and updated dynamic articles at the top of feeds
    const dynamicArts = this.getDynamicArticles() || [];
    if (dynamicArts.length > 0) {
      const existingLatestIds = new Set(latestNews.map(a => a.id));
      const newToLatest = dynamicArts.filter(a => !existingLatestIds.has(a.id));
      if (newToLatest.length > 0) {
        latestNews = [...this.enrichArticles(newToLatest), ...latestNews];
      }
      const existingFeaturedIds = new Set(featuredArticles.map(a => a.id));
      const newToFeatured = dynamicArts.filter(a => a.isFeatured && !existingFeaturedIds.has(a.id));
      if (newToFeatured.length > 0) {
        featuredArticles = [...this.enrichArticles(newToFeatured), ...featuredArticles];
      }
    }

    // If snapshot has 0 articles, automatically fill with resilient backup dataset
    if (latestNews.length === 0 && featuredArticles.length === 0) {
      const fallbackList = this.enrichArticles([...dynamicArts, ...BACKUP_ARTICLES]);
      latestNews = fallbackList.slice(0, 30);
      featuredArticles = fallbackList.filter(a => a.isFeatured).slice(0, 5);
      if (featuredArticles.length === 0) featuredArticles = fallbackList.slice(0, 5);
      breakingNews = fallbackList.filter(a => a.isBreaking).slice(0, 5);
      if (breakingNews.length === 0) breakingNews = fallbackList.slice(0, 5);
      trendingNews = fallbackList.slice(0, 10);
      videoNews = fallbackList.filter(a => !!a.videoUrl);
    }

    // Keep categories verified with fallback to full BACKUP_CATEGORIES
    const baseCats = (snap.categories && snap.categories.length > 0) ? snap.categories : BACKUP_CATEGORIES;
    // Combine baseCats with BACKUP_CATEGORIES to guarantee all 12 canonical categories are represented
    const catMap = new Map<string, Category>();
    [...BACKUP_CATEGORIES, ...baseCats].forEach(c => {
      const key = (c.slug || c.id || "").toLowerCase();
      if (key && !catMap.has(key)) {
        catMap.set(key, c);
      }
    });
    const categories = Array.from(catMap.values());
    
    // Category articles: use snapshot-provided mapping with normalized keys
    const categoryArticles: Record<string, Article[]> = {};
    const rawCatArticles = snap.categoryArticles || {};
    
    categories.forEach(cat => {
      const slug = cat.slug || cat.id;
      const id = cat.id;
      const catSlug = (slug || "").toLowerCase();
      const catId = (id || "").toLowerCase();
      const catNameNp = (cat.nameNepali || "").toLowerCase();
      const catNameEn = (cat.nameEnglish || "").toLowerCase();

      const normCat = normalizeArticleCategory(slug || id || catNameNp || catNameEn);
      const targetSlug = normCat.categorySlug.toLowerCase();
      const targetId = normCat.categoryId.toLowerCase();

      const list = rawCatArticles[slug] || rawCatArticles[id] || rawCatArticles[catSlug] || rawCatArticles[catId] || rawCatArticles[targetSlug] || rawCatArticles[targetId] || [];
      let cleanList = this.enrichArticles(list);
      if (cleanList.length === 0) {
        cleanList = latestNews.filter((a: any) => {
          const artCatId = (a.categoryId || "").toLowerCase();
          const artCat = (a.category || "").toLowerCase();
          const artCatSlug = (a.categorySlug || "").toLowerCase();
          const artCatName = (a.categoryName || "").toLowerCase();

          return (
            artCatId === catSlug || 
            artCatId === catId || 
            artCatId === targetSlug ||
            artCatId === targetId ||
            artCat === catSlug || 
            artCat === catId || 
            artCat === targetSlug ||
            artCatSlug === catSlug ||
            artCatSlug === catId ||
            artCatSlug === targetSlug ||
            (catNameNp && artCatName === catNameNp) ||
            (catNameEn && artCatName === catNameEn)
          );
        });
      }

      // If still empty, pull articles from the pool to avoid zero-item category block
      if (cleanList.length === 0 && latestNews.length > 0) {
        cleanList = latestNews.slice(0, 4);
      }

      categoryArticles[slug] = cleanList;
      if (id && id !== slug) {
        categoryArticles[id] = cleanList;
      }
      if (catSlug) categoryArticles[catSlug] = cleanList;
      if (catId) categoryArticles[catId] = cleanList;
      if (targetSlug) categoryArticles[targetSlug] = cleanList;
      if (targetId) categoryArticles[targetId] = cleanList;
    });

    let hero = (snap as any)?.homepage?.hero || (snap as any)?.hero || null;
    let layout = (snap as any)?.layout || null;
    let pinnedBreakingHeadlines = (snap as any)?.pinnedBreakingHeadlines || [];

    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("sanatan_homepage_settings");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.hero) hero = parsed.hero;
          if (parsed.layout) layout = parsed.layout;
          if (parsed.pinnedBreakingHeadlines) pinnedBreakingHeadlines = parsed.pinnedBreakingHeadlines;
        }
      }
    } catch {}

    return {
      ...snap,
      hero,
      layout,
      pinnedBreakingHeadlines,
      categories,
      featuredArticles,
      breakingNews,
      latestNews,
      trendingNews,
      videoNews,
      categoryArticles
    };
  }

  /**
   * Force refresh the snapshot from server and purge all client caching layers
   */
  public async forceRefresh(lang: 'ne' | 'en' = 'ne'): Promise<HomepageSnapshot> {
    this.clearCache();
    return this.getHomepageSnapshot(lang, true);
  }

  /**
   * Get KnowledgeOS Unified Snapshot
   */
  async getKnowledgeOSSnapshot(): Promise<KnowledgeOSSnapshot> {
    const cacheKey = "snapshot_knowledge_os";
    const cached = this.memoryCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    const snap: KnowledgeOSSnapshot = {
      generatedAt: new Date().toISOString(),
      knowledgeNodes: KNOWLEDGE_NODES,
      categories: KNOWLEDGE_CATEGORIES_GRID,
      districtProfiles: FEATURED_DISTRICT_PROFILES
    };

    this.memoryCache[cacheKey] = { data: snap, timestamp: Date.now() };
    return snap;
  }

  /**
   * Get Homepage Snapshot with zero direct Firestore reads
   */
  async getHomepageSnapshot(lang: 'ne' | 'en' = 'ne', force = false): Promise<HomepageSnapshot> {
    const cacheKey = `snapshot_homepage_${lang}`;
    const cached = this.memoryCache[cacheKey];
    
    if (!force && cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.incrementReadsSaved(12);
      return this.enrichSnapshot(cached.data);
    }

    try {
      const snapUrl = lang === 'en' ? "/api/cache/homepage-en.json" : "/api/cache/homepage.json";
      const fetchUrl = force ? `${snapUrl}?_t=${Date.now()}` : snapUrl;
      const snapshot = await this.fetchAndVerifySnapshot<HomepageSnapshot | null>(
        fetchUrl, 
        null, 
        force ? { cache: 'no-cache' } : undefined
      );
      if (snapshot && ((snapshot.latestNews && snapshot.latestNews.length > 0) || (snapshot.featuredArticles && snapshot.featuredArticles.length > 0))) {
        const enriched = this.enrichSnapshot(snapshot);
        this.memoryCache[cacheKey] = { data: enriched, timestamp: Date.now() };
        this.incrementReadsSaved(12);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(`sg_snapshot_homepage_${lang}`, JSON.stringify(enriched));
          } catch (e) {}
        }
        return enriched;
      }
    } catch (err) {
      console.warn("Server homepage snapshot fetch failed, checking local fallback:", err);
    }

    // Check localStorage fallback snapshot
    if (typeof window !== "undefined") {
      try {
        const localSnap = localStorage.getItem(`sg_snapshot_homepage_${lang}`);
        if (localSnap) {
          const parsed = JSON.parse(localSnap);
          const enriched = this.enrichSnapshot(parsed);
          this.memoryCache[cacheKey] = { data: enriched, timestamp: Date.now() };
          this.incrementReadsSaved(12);
          return enriched;
        }
      } catch (e) {}
    }

    // Fallback static structure with taxonomy categories, dynamic articles, and resilience BACKUP_ARTICLES
    const dynamicArts = this.getDynamicArticles() || [];
    const combinedArts = [...dynamicArts, ...BACKUP_ARTICLES];
    const allArts = this.enrichArticles(combinedArts);

    const breakingList = allArts.filter(a => a.isBreaking);
    const featuredList = allArts.filter(a => a.isFeatured);
    const videoList = allArts.filter(a => !!a.videoUrl);

    const defaultSnapshot: HomepageSnapshot = {
      generatedAt: new Date().toISOString(),
      version: "1.0",
      featuredArticles: featuredList.length > 0 ? featuredList : allArts.slice(0, 5),
      breakingNews: breakingList.length > 0 ? breakingList : allArts.slice(0, 5),
      latestNews: allArts.slice(0, 25),
      trendingNews: allArts.slice(0, 10),
      videoNews: videoList.length > 0 ? videoList : allArts.slice(0, 5),
      categoryArticles: BACKUP_CATEGORIES.reduce((acc, cat) => {
        const catArts = allArts.filter((a: any) => 
          a.categoryId === cat.id || 
          a.categoryId === cat.slug || 
          a.category === cat.slug || 
          a.categorySlug === cat.slug ||
          a.categoryName === cat.nameNepali ||
          a.categoryName === cat.nameEnglish
        );
        acc[cat.slug] = catArts;
        if (cat.id) acc[cat.id] = catArts;
        return acc;
      }, {} as Record<string, Article[]>),
      categories: BACKUP_CATEGORIES,
      layout: null
    };

    const enrichedDefault = this.enrichSnapshot(defaultSnapshot);
    this.incrementReadsSaved(12);
    return enrichedDefault;
  }

  /**
   * Get Latest Articles Snapshot
   */
  async getLatestSnapshot(): Promise<LatestSnapshot> {
    const cacheKey = "snapshot_latest";
    const cached = this.memoryCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.incrementReadsSaved(4);
      return cached.data;
    }

    try {
      const data = await this.fetchAndVerifySnapshot<any>("/api/cache/latest.json", null);
      if (data) {
        const raw = data.articles || data.latestNews || data.featuredArticles || [];
        if (raw.length > 0) {
          const enriched = {
            generatedAt: new Date().toISOString(),
            articles: this.enrichArticles(raw)
          };
          this.memoryCache[cacheKey] = { data: enriched, timestamp: Date.now() };
          this.incrementReadsSaved(4);
          return enriched;
        }
      }
    } catch (e) {}

    const dynamicArts = this.getDynamicArticles() || [];
    const allArts = this.enrichArticles([...dynamicArts, ...BACKUP_ARTICLES]);
    const defaultSnap: LatestSnapshot = {
      generatedAt: new Date().toISOString(),
      articles: allArts
    };
    return defaultSnap;
  }

  /**
   * Get Breaking News Snapshot
   */
  async getBreakingSnapshot(): Promise<BreakingSnapshot> {
    const cacheKey = "snapshot_breaking";
    const cached = this.memoryCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.incrementReadsSaved(3);
      return cached.data;
    }

    try {
      const data = await this.fetchAndVerifySnapshot<any>("/api/cache/breaking.json", null);
      if (data) {
        const enriched = {
          ...data,
          breakingNews: this.enrichArticles(data.breakingNews || [])
        };
        this.memoryCache[cacheKey] = { data: enriched, timestamp: Date.now() };
        this.incrementReadsSaved(3);
        return enriched;
      }
    } catch (e) {}

    const dynamicArts = this.getDynamicArticles() || [];
    const allArts = this.enrichArticles([...dynamicArts, ...BACKUP_ARTICLES]);
    const breakingList = allArts.filter(a => a.isBreaking);

    return {
      generatedAt: new Date().toISOString(),
      breakingNews: breakingList.length > 0 ? breakingList : allArts.slice(0, 5)
    };
  }

  /**
   * Get Trending News Snapshot
   */
  async getTrendingSnapshot(): Promise<TrendingSnapshot> {
    const cacheKey = "snapshot_trending";
    const cached = this.memoryCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.incrementReadsSaved(4);
      return cached.data;
    }

    try {
      const data = await this.fetchAndVerifySnapshot<any>("/api/cache/trending.json", null);
      if (data) {
        const raw = data.trendingNews || data.mostReadNews || data.latestNews || [];
        if (raw.length > 0) {
          const enriched = {
            generatedAt: new Date().toISOString(),
            trendingNews: this.enrichArticles(raw)
          };
          this.memoryCache[cacheKey] = { data: enriched, timestamp: Date.now() };
          this.incrementReadsSaved(4);
          return enriched;
        }
      }
    } catch (e) {}

    const dynamicArts = this.getDynamicArticles() || [];
    const allArts = this.enrichArticles([...dynamicArts, ...BACKUP_ARTICLES]);

    return {
      generatedAt: new Date().toISOString(),
      trendingNews: allArts.slice(0, 10)
    };
  }

  /**
   * Get Categories Snapshot
   */
  async getCategoriesSnapshot(): Promise<CategoriesSnapshot> {
    const cacheKey = "snapshot_categories";
    const cached = this.memoryCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.incrementReadsSaved(5);
      return cached.data;
    }

    const dynamicCats = this.getDynamicCategories();

    try {
      const res = await fetch("/api/cache/categories.json");
      if (res.ok) {
        const data = await res.json();
        const serverCats: Category[] = data.categories || [];
        const catMap = new Map<string, Category>();
        serverCats.forEach(c => catMap.set(c.id || c.slug, c));
        dynamicCats.forEach(d => {
          const key = d.id || d.slug;
          if (key && !catMap.has(key)) catMap.set(key, d);
        });
        const enrichedCats = Array.from(catMap.values());
        const result = {
          ...data,
          categories: enrichedCats
        };
        this.memoryCache[cacheKey] = { data: result, timestamp: Date.now() };
        this.incrementReadsSaved(5);
        return result;
      }
    } catch (e) {}

    const catMap = new Map<string, Category>();
    dynamicCats.forEach(d => {
      const key = d.id || d.slug;
      if (key) catMap.set(key, d);
    });
    const fallbackCats = Array.from(catMap.values());

    return {
      generatedAt: new Date().toISOString(),
      categories: fallbackCats,
      categoryArticles: fallbackCats.reduce((acc, cat) => {
        acc[cat.slug || cat.id] = [];
        return acc;
      }, {} as Record<string, Article[]>)
    };
  }

  /**
   * Get Individual Article Snapshot (Publish Once -> Read Many)
   */
  async getArticleSnapshot(articleId: string): Promise<any | null> {
    const cacheKey = `snapshot_article_${articleId}`;
    const cached = this.memoryCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.incrementReadsSaved(6);
      return cached.data;
    }

    try {
      const res = await fetch(`/api/cache/article/${articleId}`);
      if (res.ok) {
        const data = await res.json();
        this.memoryCache[cacheKey] = { data, timestamp: Date.now() };
        this.incrementReadsSaved(6);
        return data;
      }
    } catch (e) {}

    const decodedId = decodeURIComponent(articleId);
    const dynamicArticles = this.getDynamicArticles();
    const foundDyn = dynamicArticles.find(a => a.id === articleId || a.id === decodedId || a.title === articleId || a.title === decodedId);
    if (foundDyn) {
      const combined = [...dynamicArticles];
      const result = {
        generatedAt: new Date().toISOString(),
        article: foundDyn,
        categoryName: foundDyn.categoryId || "समाचार",
        relatedArticles: combined.filter(a => a.id !== foundDyn.id).slice(0, 3),
        trendingArticles: combined.slice(0, 4)
      };
      this.memoryCache[cacheKey] = { data: result, timestamp: Date.now() };
      return result;
    }

    return null;
  }

  /**
   * Get Glamour Snapshot
   */
  async getGlamourSnapshot(): Promise<any> {
    const cacheKey = "snapshot_glamour_home";
    const cached = this.memoryCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.incrementReadsSaved(5);
      return cached.data;
    }

    try {
      const res = await fetch("/api/cache/glamour/home.json");
      if (res.ok) {
        const data = await res.json();
        this.memoryCache[cacheKey] = { data, timestamp: Date.now() };
        this.incrementReadsSaved(5);
        return data;
      }
    } catch (e) {}

    return {
      generatedAt: new Date().toISOString(),
      models: [],
      hero: {
        title: "TALENTS <span class='text-primary'>&</span> PHOTOGRAPHERS",
        subtitle: "Discover Nepal's most talented professional models, creative artists, and photographers for your next big project.",
        backgroundImage: "https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=2070&auto=format&fit=crop",
        badgeText: "Exclusive Discovery"
      }
    };
  }

  /**
   * Get Events Snapshot
   */
  async getEventsSnapshot(): Promise<any> {
    const cacheKey = "snapshot_events_upcoming";
    const cached = this.memoryCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.incrementReadsSaved(5);
      return cached.data;
    }

    try {
      const res = await fetch("/api/cache/events/upcoming.json");
      if (res.ok) {
        const data = await res.json();
        this.memoryCache[cacheKey] = { data, timestamp: Date.now() };
        this.incrementReadsSaved(5);
        return data;
      }
    } catch (e) {}

    return {
      generatedAt: new Date().toISOString(),
      events: []
    };
  }

  /**
   * Get Individual Event Snapshot
   */
  async getEventSnapshot(eventId: string): Promise<any> {
    const cacheKey = `snapshot_event_${eventId}`;
    const cached = this.memoryCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.incrementReadsSaved(3);
      return cached.data;
    }

    try {
      const res = await fetch(`/api/cache/event/${eventId}.json`);
      if (res.ok) {
        const data = await res.json();
        this.memoryCache[cacheKey] = { data, timestamp: Date.now() };
        this.incrementReadsSaved(3);
        return data;
      }
    } catch (e) {}

    return null;
  }

  /**
   * Get Saraswati Knowledge Graph Snapshot (Tier 2)
   */
  async getKnowledgeSnapshot(): Promise<any> {
    const cacheKey = "snapshot_knowledge";
    const cached = this.memoryCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.incrementReadsSaved(8);
      return cached.data;
    }

    try {
      const res = await fetch("/api/cache/knowledge.json");
      if (res.ok) {
        const data = await res.json();
        this.memoryCache[cacheKey] = { data, timestamp: Date.now() };
        this.incrementReadsSaved(8);
        return data;
      }
    } catch (e) {}

    return {
      generatedAt: new Date().toISOString(),
      entities: [],
      categories: ["Vedas", "Puranas", "Temples", "Sages"],
      relations: []
    };
  }

  /**
   * Get Nepal Hub Snapshot (Tier 2)
   */
  async getNepalHubSnapshot(): Promise<any> {
    const cacheKey = "snapshot_nepalhub";
    const cached = this.memoryCache[cacheKey];
    const deletedIds = this.getDeletedDocIds();

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.incrementReadsSaved(10);
      const filteredLive = (cached.data.liveUpdates || []).filter((u: any) => !deletedIds.has(u.id));
      return { ...cached.data, liveUpdates: filteredLive };
    }

    try {
      const res = await fetch("/api/cache/nepalhub.json");
      if (res.ok) {
        const data = await res.json();
        const filteredLive = (data.liveUpdates || []).filter((u: any) => !deletedIds.has(u.id));
        const result = { ...data, liveUpdates: filteredLive };
        this.memoryCache[cacheKey] = { data: result, timestamp: Date.now() };
        this.incrementReadsSaved(10);
        return result;
      }
    } catch (e) {}

    return {
      generatedAt: new Date().toISOString(),
      liveUpdates: [],
      festivals: [],
      markets: [],
      districts: [],
      briefings: [],
      sponsors: [],
      audios: []
    };
  }

  /**
   * Get Chautari Forum Feed Snapshot (Tier 3)
   */
  async getChautariFeedSnapshot(feedType: "home" | "recent" | "trending" | "popular" = "home"): Promise<any> {
    const cacheKey = `snapshot_chautari_${feedType}`;
    const cached = this.memoryCache[cacheKey];
    const deletedIds = this.getDeletedDocIds();

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.incrementReadsSaved(5);
      const filteredPosts = (cached.data.posts || []).filter((p: any) => !deletedIds.has(p.id));
      return { ...cached.data, posts: filteredPosts };
    }

    try {
      const res = await fetch(`/api/cache/chautari/${feedType}.json`);
      if (res.ok) {
        const data = await res.json();
        const filteredPosts = (data.posts || []).filter((p: any) => !deletedIds.has(p.id));
        const result = { ...data, posts: filteredPosts };
        this.memoryCache[cacheKey] = { data: result, timestamp: Date.now() };
        this.incrementReadsSaved(5);
        return result;
      }
    } catch (e) {}

    return {
      generatedAt: new Date().toISOString(),
      posts: []
    };
  }

  /**
   * Get Chautari Full Thread Snapshot (Tier 3)
   */
  async getChautariThreadSnapshot(postId: string): Promise<any> {
    const cacheKey = `snapshot_chautari_thread_${postId}`;
    const cached = this.memoryCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.incrementReadsSaved(7);
      return cached.data;
    }

    try {
      const res = await fetch(`/api/cache/chautari/thread_${postId}.json`);
      if (res.ok) {
        const data = await res.json();
        this.memoryCache[cacheKey] = { data, timestamp: Date.now() };
        this.incrementReadsSaved(7);
        return data;
      }
    } catch (e) {}

    return null;
  }

  /**
   * Get Resource Comments Snapshot (Tier 3 Comments)
   */
  async getResourceCommentsSnapshot(type: "article" | "gallery" | "event", resourceId: string): Promise<any[]> {
    const cacheKey = `snapshot_comments_${type}_${resourceId}`;
    const cached = this.memoryCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.incrementReadsSaved(4);
      return cached.data;
    }

    try {
      const res = await fetch(`/api/cache/comments/${type}_${resourceId}.json`);
      if (res.ok) {
        const data = await res.json();
        this.memoryCache[cacheKey] = { data: data.comments || [], timestamp: Date.now() };
        this.incrementReadsSaved(4);
        return data.comments || [];
      }
    } catch (e) {}

    return [];
  }

  /**
   * Get Ads Snapshot (V2 Revenue OS - Active campaigns only, no fake fallbacks)
   */
  async getAdsSnapshot(position?: string): Promise<Ad[]> {
    const cacheKey = `snapshot_ads_${position || 'all'}`;
    const cached = this.memoryCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.incrementReadsSaved(3);
      return cached.data;
    }

    const dynamicAds = this.getDynamicAds();

    try {
      const res = await fetch("/api/cache/ads.json");
      if (res.ok) {
        const data = await res.json();
        const adsList: Ad[] = data.ads || [];
        const adMap = new Map<string, Ad>();
        adsList.forEach(a => adMap.set(a.id || a.title, a));
        dynamicAds.forEach(d => {
          const key = d.id || d.title;
          if (key && !adMap.has(key)) adMap.set(key, d);
        });
        const allCandidates = Array.from(adMap.values());
        
        // Strict active & campaign date verification
        const eligibleAds = allCandidates.filter(a => adEngine.isAdEligible(a));
        const filtered = position ? eligibleAds.filter(a => a.position === position) : eligibleAds;
        
        this.memoryCache[cacheKey] = { data: filtered, timestamp: Date.now() };
        this.incrementReadsSaved(3);
        return filtered;
      }
    } catch (e) {
      console.warn("Snapshot ads fetch failed, evaluating local dynamic queue:", e);
    }

    // Dynamic local queue only (No BACKUP_ADS - return empty if no valid active campaigns)
    const adMap = new Map<string, Ad>();
    dynamicAds.forEach(d => {
      const key = d.id || d.title;
      if (key && adEngine.isAdEligible(d)) adMap.set(key, d);
    });
    const unique = Array.from(adMap.values());
    const filteredActive = position ? unique.filter(a => a.position === position) : unique;
    
    this.memoryCache[cacheKey] = { data: filteredActive, timestamp: Date.now() };
    return filteredActive;
  }

  /**
   * Get Monetization Revenue & Performance Analytics Snapshot (Zero-Read Ad Stats)
   */
  async getAdStatsSnapshot(): Promise<any> {
    const cacheKey = "snapshot_ad_stats";
    const cached = this.memoryCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.incrementReadsSaved(5);
      return cached.data;
    }

    try {
      const res = await fetch("/api/cache/ad-stats.json");
      if (res.ok) {
        const data = await res.json();
        this.memoryCache[cacheKey] = { data, timestamp: Date.now() };
        this.incrementReadsSaved(5);
        return data;
      }
    } catch (e) {
      console.warn("Ad stats snapshot fetch failed:", e);
    }

    // Dynamic fallback calculation from active ads
    const dynamicAds = this.getDynamicAds();
    let totalImp = 0;
    let totalClicks = 0;
    let revenue = 0;
    const posStats: Record<string, { impressions: number; clicks: number }> = {};

    dynamicAds.forEach(ad => {
      const imp = Number(ad.impressions || 0);
      const clk = Number(ad.clicks || 0);
      totalImp += imp;
      totalClicks += clk;
      const pos = ad.position || "other";
      if (!posStats[pos]) posStats[pos] = { impressions: 0, clicks: 0 };
      posStats[pos].impressions += imp;
      posStats[pos].clicks += clk;

      if (ad.budget?.pricingModel === "cpm") {
        revenue += (imp / 1000) * Number(ad.budget.cpmRate || 150);
      } else if (ad.budget?.pricingModel === "cpc") {
        revenue += clk * Number(ad.budget.cpcRate || 20);
      } else if (ad.budget?.totalBudget) {
        revenue += Number(ad.budget.totalBudget);
      } else {
        revenue += 3000;
      }
    });

    const fallbackStats = {
      totalCampaigns: dynamicAds.length,
      activeCampaigns: dynamicAds.filter(a => adEngine.isAdEligible(a)).length,
      totalImpressions: totalImp,
      totalClicks: totalClicks,
      averageCtr: totalImp > 0 ? Number(((totalClicks / totalImp) * 100).toFixed(2)) : 0,
      estimatedRevenue: Math.round(revenue),
      positionStats: posStats,
      generatedAt: new Date().toISOString()
    };

    this.memoryCache[cacheKey] = { data: fallbackStats, timestamp: Date.now() };
    return fallbackStats;
  }

  /**
   * Get Media Assets Snapshot
   */
  async getMediaSnapshot(): Promise<any[]> {
    const cacheKey = "snapshot_media_assets";
    const cached = this.memoryCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.incrementReadsSaved(5);
      return cached.data;
    }

    try {
      const res = await fetch("/api/cache/media.json");
      if (res.ok) {
        const data = await res.json();
        const mediaList = data.assets || [];
        this.memoryCache[cacheKey] = { data: mediaList, timestamp: Date.now() };
        this.incrementReadsSaved(5);
        return mediaList;
      }
    } catch (e) {}

    return [];
  }

  /**
   * Get Search Index Snapshot
   */
  async getSearchIndexSnapshot(): Promise<any> {
    try {
      const items: any[] = [];

      // 1. News/Articles
      try {
        const home = await this.getHomepageSnapshot();
        const articles: any[] = [];
        if (home) {
          if (home.featuredArticles) articles.push(...home.featuredArticles);
          if (home.latestNews) articles.push(...home.latestNews);
          if (home.trendingNews) articles.push(...home.trendingNews);
          if (home.categoryArticles) {
            Object.values(home.categoryArticles).forEach((list: any) => {
              if (Array.isArray(list)) articles.push(...list);
            });
          }
        }
        const uniqueArticles = Array.from(new Map(articles.map(item => [item.id, item])).values());
        uniqueArticles.forEach(a => {
          items.push({
            id: a.id,
            title: a.title || "",
            excerpt: a.excerpt || a.content?.slice(0, 150) || "",
            content: a.content || "",
            featuredImage: a.featuredImage || "https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=2070",
            createdAt: a.createdAt || new Date().toISOString(),
            categoryId: a.categoryId || "news",
            type: "news",
            url: `/article/${a.id}`
          });
        });
      } catch (e) {
        console.warn("Unified search indexing news error:", e);
      }

      // 2. Saraswati Knowledge Base
      try {
        const knowledge = await this.getKnowledgeSnapshot();
        if (knowledge && Array.isArray(knowledge.entities)) {
          knowledge.entities.forEach((entity: any) => {
            items.push({
              id: entity.id,
              title: entity.nameNepali || entity.name || entity.title || "",
              excerpt: entity.description?.slice(0, 150) || "",
              content: entity.description || "",
              featuredImage: entity.image || entity.featuredImage || "https://images.unsplash.com/photo-1460764897414-902ac37cfa71?q=80&w=2070",
              createdAt: entity.createdAt || entity.date || new Date().toISOString(),
              categoryId: entity.category || "knowledge",
              type: "saraswati",
              url: `/knowledge`
            });
          });
        }
      } catch (e) {
        console.warn("Unified search indexing knowledge error:", e);
      }

      // 3. Nepal Hub Live Updates & Briefings
      try {
        const hub = await this.getNepalHubSnapshot();
        if (hub) {
          if (Array.isArray(hub.liveUpdates)) {
            hub.liveUpdates.forEach((update: any) => {
              items.push({
                id: update.id,
                title: update.title || "नेपाल हब अपडेट",
                excerpt: update.content?.slice(0, 150) || "",
                content: update.content || "",
                featuredImage: update.imageUrl || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2070",
                createdAt: update.createdAt || update.timestamp || new Date().toISOString(),
                categoryId: update.district || "nepalhub",
                type: "nepalhub",
                url: `/nepal-hub`
              });
            });
          }
          if (Array.isArray(hub.briefings)) {
            hub.briefings.forEach((briefing: any) => {
              items.push({
                id: briefing.id,
                title: briefing.title || "नेपाल हब ब्रिफिङ",
                excerpt: briefing.excerpt || briefing.content?.slice(0, 150) || "",
                content: briefing.content || "",
                featuredImage: briefing.featuredImage || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072",
                createdAt: briefing.createdAt || new Date().toISOString(),
                categoryId: "briefing",
                type: "nepalhub",
                url: `/nepal-hub`
              });
            });
          }
        }
      } catch (e) {
        console.warn("Unified search indexing nepalhub error:", e);
      }

      // 4. Community (Chautari) Posts
      try {
        const community = await this.getChautariFeedSnapshot("recent");
        if (community && Array.isArray(community.posts)) {
          community.posts.forEach((post: any) => {
            items.push({
              id: post.id,
              title: post.title || "चौतारी पोस्ट",
              excerpt: post.content?.slice(0, 150) || "",
              content: post.content || "",
              featuredImage: post.imageUrl || post.featuredImage || "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2070",
              createdAt: post.createdAt || new Date().toISOString(),
              categoryId: post.category || "chautari",
              type: "community",
              url: `/community`
            });
          });
        }
      } catch (e) {
        console.warn("Unified search indexing community error:", e);
      }

      return { items };
    } catch (e) {
      return { items: [] };
    }
  }

  /**
   * Get Notifications Snapshot (Tier 3 Notifications)
   */
  async getNotificationsSnapshot(userId?: string): Promise<any[]> {
    const cacheKey = `snapshot_notifications_${userId || 'global'}`;
    const cached = this.memoryCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.incrementReadsSaved(3);
      return cached.data;
    }

    try {
      const res = await fetch(`/api/cache/notifications/${userId || 'global'}.json`);
      if (res.ok) {
        const data = await res.json();
        const list = data.notifications || [];
        this.memoryCache[cacheKey] = { data: list, timestamp: Date.now() };
        this.incrementReadsSaved(3);
        return list;
      }
    } catch (e) {}

    try {
      const stored = localStorage.getItem(`sg_notifications_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}

    return [];
  }

  /**
   * Trigger Publish Rebuild
   */
  async triggerPublishRebuild(source = "editor_publish"): Promise<boolean> {
    try {
      this.clearCache();
      const res = await fetch("/api/admin/rebuild-snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggerSource: source, timestamp: new Date().toISOString() })
      });

      if (res.ok) {
        const result = await res.json();
        await this.syncManifest();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("snapshot-rebuilt", { detail: result }));
        }
        return true;
      }
    } catch (err) {
      console.warn("Failed to trigger snapshot rebuild on server:", err);
    }
    return false;
  }

  // --- VAULT & RECOVERY PLATFORM (SVRP) CLIENT METHODS ---

  async fetchManifestDetails(): Promise<any> {
    try {
      const res = await fetch("/api/vault/manifest");
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to fetch SVRP manifest details:", e);
    }
    return { success: false, manifest: null };
  }

  async getVaultBackups(): Promise<any> {
    try {
      const res = await fetch("/api/vault/backups");
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to fetch SVRP vault backups:", e);
    }
    return { success: false, backups: [] };
  }

  async createVaultBackup(type = "manual_vault", notes = ""): Promise<any> {
    try {
      const res = await fetch("/api/vault/create-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, notes })
      });
      if (res.ok) {
        const data = await res.json();
        await this.syncManifest();
        return data;
      }
    } catch (e) {
      console.warn("Failed to create vault backup:", e);
    }
    return { success: false, error: "Failed to communicate with vault backup endpoint" };
  }

  async restoreVaultBackup(archiveId: string, restoreFirestore = false, targetModules?: string[]): Promise<any> {
    try {
      const res = await fetch("/api/vault/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archiveId, restoreFirestore, targetModules })
      });
      if (res.ok) {
        const data = await res.json();
        this.clearCache();
        await this.syncManifest();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("snapshot-rebuilt"));
        }
        return data;
      }
    } catch (e) {
      console.warn("Failed to restore vault backup:", e);
    }
    return { success: false, error: "Failed to restore vault backup" };
  }

  async pruneVaultRetention(): Promise<any> {
    try {
      const res = await fetch("/api/vault/prune", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to prune SVRP vault retention:", e);
    }
    return { success: false, error: "Failed to enforce retention policy" };
  }

  async verifyVaultIntegrity(archiveId: string): Promise<any> {
    try {
      const res = await fetch(`/api/vault/verify/${archiveId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to verify vault integrity:", e);
    }
    return { success: false, error: "Failed to verify archive integrity" };
  }

  async rebuildVault(): Promise<any> {
    try {
      const res = await fetch("/api/vault/rebuild", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        setTimeout(() => this.syncManifest(), 2000);
        return data;
      }
    } catch (e) {
      console.warn("Failed to trigger SVRP rebuild:", e);
    }
    return { success: false, error: "Failed to trigger SVRP rebuild" };
  }
}

export const snapshotEngine = new SnapshotEngineService();
