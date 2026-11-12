import { collection, query, orderBy, limit, where, getDocs as firestoreGetDocs, DocumentData, QuerySnapshot, DocumentReference, getDoc as firestoreGetDoc } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { snapshotEngine, HomepageSnapshot } from "@/src/services/snapshotEngine";
import { Article, Category, Ad } from "@/src/types";
import { isArticleInCategory } from "@/src/constants/categories";
import { BACKUP_CATEGORIES, BACKUP_ARTICLES } from "@/src/constants/backupData";
import { snapshotResilienceGate, ContentSourceType } from "@/src/services/snapshotResilienceGate";
import { chautariStore } from "@/src/utils/chautariStore";

export interface DataFetchOptions {
  bypassCache?: boolean;
  maxAgeMs?: number;
  caller?: string;
}

/**
 * Checks if an error is due to Firestore quota exhaustion, rate limiting, or connection denial.
 */
export function isQuotaOrResourceError(error: any): boolean {
  if (!error) return false;
  const str = (
    (typeof error === "string" ? error : "") +
    (error.message || "") +
    (error.code || "") +
    (error.stack || "") +
    JSON.stringify(error || {})
  ).toLowerCase();

  return (
    str.includes("resource-exhausted") ||
    str.includes("resource_exhausted") ||
    str.includes("quota exceeded") ||
    str.includes("quota_exceeded") ||
    str.includes("exhausted") ||
    str.includes("internal assertion failed") ||
    str.includes("rate limit") ||
    str.includes("permission_denied") ||
    str.includes("permission-denied") ||
    str.includes("unavailable") ||
    error.code === "resource-exhausted" ||
    error.code === "unavailable" ||
    error.code === 8 ||
    error.code === 14
  );
}

/**
 * ContinuityEngine & ContentRepository
 * Unified Gateway for all content reads.
 * Guarantees zero empty UI states by providing complete, automatic failover:
 * 1. Firestore Read
 * 2. In-Memory / Snapshot Cache Failover
 * 3. Local Dynamic Store & Resilient Static Taxonomy Fallback
 */
export class ContinuityContentRepository {
  private static instance: ContinuityContentRepository;

  public static getInstance(): ContinuityContentRepository {
    if (!ContinuityContentRepository.instance) {
      ContinuityContentRepository.instance = new ContinuityContentRepository();
    }
    return ContinuityContentRepository.instance;
  }

  /**
   * Helper to check if Continuity Mode is explicitly enabled in client storage.
   */
  public isContinuityModeActive(): boolean {
    if (typeof window === "undefined") return false;
    try {
      return (
        localStorage.getItem("continuity_mode") === "true" ||
        localStorage.getItem("firestore_quota_status") === "true" ||
        localStorage.getItem("simulated_firestore_kill") === "true" ||
        localStorage.getItem("simulated_permission_denied") === "true"
      );
    } catch {
      return false;
    }
  }

  /**
   * Mark continuity mode enabled in browser storage when quota is exhausted
   */
  public activateContinuityMode(reason: string = "quota_exhausted"): void {
    if (typeof window === "undefined") return;
    try {
      console.warn(`[ContinuityEngine] Activating Continuity Mode. Reason: ${reason}`);
      localStorage.setItem("continuity_mode", "true");
      localStorage.setItem("firestore_quota_status", "true");
      window.dispatchEvent(new CustomEvent("firestore-quota-exceeded", { detail: { reason } }));
    } catch (e) {
      console.warn("[ContinuityEngine] Error writing continuity mode flag:", e);
    }
  }

  /**
   * Retrieve homepage snapshot with complete failover guarantee
   */
  async getHomepageData(lang: "ne" | "en" = "ne"): Promise<HomepageSnapshot> {
    const isKilled = snapshotResilienceGate.isFirestoreKilled() || snapshotResilienceGate.isPermissionDenied();
    try {
      const snap = await snapshotEngine.getHomepageSnapshot(lang);
      if (snap && ((snap.latestNews && snap.latestNews.length > 0) || (snap.featuredArticles && snap.featuredArticles.length > 0))) {
        const isMem = snapshotEngine.isMemoryCached("homepage");
        const src: ContentSourceType = isMem ? "memory_cache" : "server_snapshot";
        const docCount = (snap.latestNews?.length || 0) + (snap.featuredArticles?.length || 0);
        const genTime = new Date(snap.generatedAt || Date.now()).getTime();
        const ageMs = Date.now() - genTime;

        snapshotResilienceGate.recordContentSourceUsed({
          route: "/",
          resource: "articles",
          source: src,
          snapshotVersion: snap.version || "v3.8.4",
          snapshotAgeMs: ageMs,
          documentCount: docCount,
          fallbackLevel: isMem ? 1 : 3,
          firestoreAttempted: !isKilled,
          firestoreFailureCode: isKilled ? "UNAVAILABLE" : null,
          reason: isKilled ? "firestore_unavailable_snapshot_active" : "snapshot_available"
        });
        return snap;
      }
    } catch (err) {
      console.warn("[ContinuityEngine] snapshotEngine.getHomepageSnapshot failed, falling back:", err);
    }

    // Direct fallback from snapshot engine memory or backup structure
    const dynamicArticles = snapshotEngine.getDynamicArticles();
    const allArts = snapshotEngine.enrichArticles([...dynamicArticles, ...BACKUP_ARTICLES]);

    const breakingList = allArts.filter(a => a.isBreaking);
    const featuredList = allArts.filter(a => a.isFeatured);
    const videoList = allArts.filter(a => !!a.videoUrl);

    snapshotResilienceGate.recordContentSourceUsed({
      route: "/",
      resource: "articles",
      source: "backup_fallback",
      snapshotVersion: "v3.8.4_backup",
      snapshotAgeMs: 0,
      documentCount: allArts.length,
      fallbackLevel: 4,
      firestoreAttempted: true,
      reason: "backup_fallback_active"
    });

    return {
      generatedAt: new Date().toISOString(),
      version: "continuity_fallback",
      featuredArticles: featuredList.length > 0 ? featuredList : allArts.slice(0, 5),
      breakingNews: breakingList.length > 0 ? breakingList : allArts.slice(0, 5),
      latestNews: allArts.slice(0, 25),
      trendingNews: allArts.slice(0, 10),
      videoNews: videoList.length > 0 ? videoList : allArts.slice(0, 5),
      categoryArticles: BACKUP_CATEGORIES.reduce((acc, cat) => {
        const catArts = allArts.filter(a => 
          a.categoryId === cat.id || 
          a.categoryId === cat.slug || 
          (a as any).category === cat.slug || 
          (a as any).categorySlug === cat.slug ||
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
  }

  /**
   * Retrieve recent published articles for duplicate checks, AI discovery, or feeds.
   * Runs Firestore query if healthy; fails over instantly to Snapshot OS / dynamic articles on quota exhaustion.
   */
  async getRecentArticles(limitCount: number = 30, category?: string): Promise<Article[]> {
    const isContinuity = this.isContinuityModeActive();
    const isKilled = snapshotResilienceGate.isFirestoreKilled() || snapshotResilienceGate.isPermissionDenied();
    const route = category ? `/category/${category}` : "/latest";

    if (!isContinuity && !isKilled) {
      try {
        const articlesRef = collection(db, "articles");
        let q;
        if (category) {
          q = query(
            articlesRef,
            where("categoryId", "==", category),
            where("status", "==", "published"),
            orderBy("createdAt", "desc"),
            limit(limitCount)
          );
        } else {
          q = query(
            articlesRef,
            where("status", "==", "published"),
            orderBy("createdAt", "desc"),
            limit(limitCount)
          );
        }

        const snap = await firestoreGetDocs(q);
        if (!snap.empty) {
          const list = snap.docs.map(d => {
            const data = d.data() as any;
            let createdAt = data.createdAt;
            if (createdAt && typeof createdAt.toDate === "function") {
              createdAt = createdAt.toDate().toISOString();
            }
            return { id: d.id, ...data, createdAt } as Article;
          });
          const enriched = snapshotEngine.enrichArticles(list);
          snapshotResilienceGate.recordContentSourceUsed({
            route,
            resource: "articles",
            source: "firestore_live",
            snapshotVersion: "live",
            snapshotAgeMs: 0,
            documentCount: enriched.length,
            fallbackLevel: 5,
            firestoreAttempted: true,
            reason: "firestore_live_query"
          });
          return enriched;
        }
      } catch (err: any) {
        console.warn("[ContinuityEngine] Firestore getRecentArticles failed. Checking quota failover:", err?.message || err);
        if (isQuotaOrResourceError(err)) {
          this.activateContinuityMode(err?.message || "QuotaExhausted");
        }
      }
    }

    // Failover: Load from Snapshot Engine
    try {
      const latestSnap = await snapshotEngine.getLatestSnapshot();
      if (latestSnap && latestSnap.articles && latestSnap.articles.length > 0) {
        let arts = latestSnap.articles;
        if (category) {
          arts = arts.filter(a => isArticleInCategory(a, category));
        }
        if (arts.length > 0) {
          const res = arts.slice(0, limitCount);
          snapshotResilienceGate.recordContentSourceUsed({
            route,
            resource: "articles",
            source: "server_snapshot",
            snapshotVersion: "v3.8.4",
            snapshotAgeMs: Date.now() - new Date(latestSnap.generatedAt || Date.now()).getTime(),
            documentCount: res.length,
            fallbackLevel: 3,
            firestoreAttempted: !isKilled,
            firestoreFailureCode: isKilled ? "UNAVAILABLE" : null,
            reason: isKilled ? "firestore_unavailable_snapshot_served" : "snapshot_available"
          });
          return res;
        }
      }

      const homeSnap = await snapshotEngine.getHomepageSnapshot();
      if (homeSnap) {
        let allArts = [
          ...(homeSnap.latestNews || []),
          ...(homeSnap.featuredArticles || []),
          ...(homeSnap.trendingNews || [])
        ];
        if (homeSnap.categoryArticles) {
          Object.values(homeSnap.categoryArticles).forEach(list => {
            if (Array.isArray(list)) allArts.push(...list);
          });
        }
        const enriched = snapshotEngine.enrichArticles(allArts);
        if (category) {
          const catClean = category.toLowerCase().trim();
          const filtered = enriched.filter(a =>
            (a.categoryId && a.categoryId.toLowerCase() === catClean) ||
            ((a as any).category && (a as any).category.toLowerCase() === catClean)
          );
          if (filtered.length > 0) {
            const res = filtered.slice(0, limitCount);
            snapshotResilienceGate.recordContentSourceUsed({
              route,
              resource: "articles",
              source: "server_snapshot",
              snapshotVersion: "v3.8.4",
              snapshotAgeMs: 0,
              documentCount: res.length,
              fallbackLevel: 3,
              firestoreAttempted: !isKilled,
              reason: "homepage_snapshot_category_served"
            });
            return res;
          }
        }
        if (enriched.length > 0) {
          const res = enriched.slice(0, limitCount);
          snapshotResilienceGate.recordContentSourceUsed({
            route,
            resource: "articles",
            source: "server_snapshot",
            snapshotVersion: "v3.8.4",
            snapshotAgeMs: 0,
            documentCount: res.length,
            fallbackLevel: 3,
            firestoreAttempted: !isKilled,
            reason: "homepage_snapshot_served"
          });
          return res;
        }
      }
    } catch (snapErr) {
      console.warn("[ContinuityEngine] Snapshot failover failed in getRecentArticles:", snapErr);
    }

    // Dynamic local + resilience fallback
    const dynamicArticles = snapshotEngine.getDynamicArticles();
    const allArts = snapshotEngine.enrichArticles([...dynamicArticles, ...BACKUP_ARTICLES]);
    let filtered = allArts;
    if (category) {
      filtered = allArts.filter(a => isArticleInCategory(a, category));
    }
    const finalArts = category ? filtered.slice(0, limitCount) : allArts.slice(0, limitCount);

    snapshotResilienceGate.recordContentSourceUsed({
      route,
      resource: "articles",
      source: "backup_fallback",
      snapshotVersion: "v3.8.4_backup",
      snapshotAgeMs: 0,
      documentCount: finalArts.length,
      fallbackLevel: 4,
      firestoreAttempted: true,
      reason: "backup_fallback_active"
    });

    return finalArts;
  }

  /**
   * Retrieve single article with complete failover
   */
  async getArticleById(id: string): Promise<Article | null> {
    const bundle = await this.getArticleBundle(id);
    return bundle.article;
  }

  /**
   * Retrieve full article view bundle (article, category, related, trending, next)
   * with 0 Firestore reads via Snapshot OS & memory caches.
   */
  async getArticleBundle(id: string): Promise<{
    article: Article | null;
    categoryName: string;
    relatedArticles: Article[];
    trendingArticles: Article[];
    nextArticle: Article | null;
  }> {
    if (!id) {
      return { article: null, categoryName: "", relatedArticles: [], trendingArticles: [], nextArticle: null };
    }

    const route = `/article/${id}`;
    const isKilled = snapshotResilienceGate.isFirestoreKilled() || snapshotResilienceGate.isPermissionDenied();

    try {
      const snap = await snapshotEngine.getArticleSnapshot(id);
      if (snap && snap.article) {
        snapshotResilienceGate.recordContentSourceUsed({
          route,
          resource: "article",
          source: "server_snapshot",
          snapshotVersion: "v3.8.4",
          snapshotAgeMs: 0,
          documentCount: 1,
          fallbackLevel: 3,
          firestoreAttempted: !isKilled,
          reason: "article_snapshot_available"
        });

        return {
          article: snap.article as Article,
          categoryName: snap.categoryName || snap.article.categoryId || "विविध",
          relatedArticles: snap.relatedArticles || [],
          trendingArticles: snap.trendingArticles || [],
          nextArticle: snap.nextArticle || null
        };
      }
    } catch (e) {
      console.warn(`[ContinuityEngine] getArticleSnapshot failed for id=${id}:`, e);
    }

    // Dynamic / fallback resolution
    const dynamicArticles = snapshotEngine.getDynamicArticles();
    const allArts = snapshotEngine.enrichArticles([...dynamicArticles, ...BACKUP_ARTICLES]);
    const decodedId = decodeURIComponent(id);
    const found = allArts.find(a => 
      a.id === id || 
      a.id === decodedId || 
      a.title === id || 
      a.title === decodedId || 
      (a as any).slug === id || 
      (a as any).slug === decodedId
    );

    if (found) {
      const related = allArts
        .filter(a => a.id !== found.id && a.categoryId === found.categoryId)
        .slice(0, 3);
      const trending = allArts
        .filter(a => a.id !== found.id)
        .slice(0, 4);

      snapshotResilienceGate.recordContentSourceUsed({
        route,
        resource: "article",
        source: "backup_fallback",
        snapshotVersion: "v3.8.4_backup",
        snapshotAgeMs: 0,
        documentCount: 1,
        fallbackLevel: 4,
        firestoreAttempted: false,
        reason: "dynamic_backup_article_found"
      });

      return {
        article: found,
        categoryName: found.categoryName || found.categoryId || "विविध",
        relatedArticles: related.length > 0 ? related : allArts.filter(a => a.id !== found.id).slice(0, 3),
        trendingArticles: trending,
        nextArticle: related[0] || allArts.find(a => a.id !== found.id) || null
      };
    }

    // Return null if non-existent or deleted
    snapshotResilienceGate.recordContentSourceUsed({
      route,
      resource: "article",
      source: "backup_fallback",
      snapshotVersion: "v3.8.4_backup",
      snapshotAgeMs: 0,
      documentCount: 0,
      fallbackLevel: 4,
      firestoreAttempted: false,
      reason: "article_not_found"
    });

    return { 
      article: null, 
      categoryName: "", 
      relatedArticles: allArts.slice(0, 3), 
      trendingArticles: allArts.slice(0, 4), 
      nextArticle: null 
    };
  }

  /**
   * Retrieve categories with complete failover
   */
  async getCategories(): Promise<Category[]> {
    try {
      const snap = await snapshotEngine.getCategoriesSnapshot();
      if (snap && snap.categories && snap.categories.length > 0) {
        snapshotResilienceGate.recordContentSourceUsed({
          route: "/categories",
          resource: "categories",
          source: "server_snapshot",
          snapshotVersion: "v3.8.4",
          snapshotAgeMs: 0,
          documentCount: snap.categories.length,
          fallbackLevel: 3,
          firestoreAttempted: false,
          reason: "categories_snapshot_served"
        });
        return snap.categories;
      }
    } catch (e) {
      console.warn("[ContinuityEngine] getCategoriesSnapshot failed:", e);
    }

    snapshotResilienceGate.recordContentSourceUsed({
      route: "/categories",
      resource: "categories",
      source: "backup_fallback",
      snapshotVersion: "v3.8.4_backup",
      snapshotAgeMs: 0,
      documentCount: BACKUP_CATEGORIES.length,
      fallbackLevel: 4,
      firestoreAttempted: false,
      reason: "backup_categories_served"
    });
    return BACKUP_CATEGORIES;
  }

  /**
   * Retrieve active ads with zero fake ads and complete failover
   */
  async getAds(position?: string): Promise<Ad[]> {
    try {
      const ads = await snapshotEngine.getAdsSnapshot(position);
      snapshotResilienceGate.recordContentSourceUsed({
        route: "/ads",
        resource: "ads",
        source: "server_snapshot",
        snapshotVersion: "v3.8.4",
        snapshotAgeMs: 0,
        documentCount: ads.length,
        fallbackLevel: 3,
        firestoreAttempted: false,
        reason: "ads_snapshot_served"
      });
      return ads;
    } catch (e) {
      console.warn("[ContinuityEngine] getAdsSnapshot failed:", e);
      return [];
    }
  }

  /**
   * Retrieve Chautari community posts with Snapshot OS & local chautariStore failover
   */
  async getRecentPosts(feedType: "recent" | "trending" = "recent", limitCount: number = 30): Promise<any[]> {
    try {
      const snap = await snapshotEngine.getChautariFeedSnapshot(feedType);
      if (snap && Array.isArray(snap.posts) && snap.posts.length > 0) {
        const res = snap.posts.slice(0, limitCount);
        snapshotResilienceGate.recordContentSourceUsed({
          route: "/community",
          resource: "posts",
          source: "server_snapshot",
          snapshotVersion: "v3.8.4",
          snapshotAgeMs: 0,
          documentCount: res.length,
          fallbackLevel: 3,
          firestoreAttempted: false,
          reason: "chautari_snapshot_served"
        });
        return res;
      }
    } catch (e) {
      console.warn("[ContinuityEngine] getChautariFeedSnapshot failed, falling back:", e);
    }

    try {
      const local = chautariStore.getLocalPosts();
      if (local && local.length > 0) {
        const res = local.slice(0, limitCount);
        snapshotResilienceGate.recordContentSourceUsed({
          route: "/community",
          resource: "posts",
          source: "indexeddb_snapshot",
          snapshotVersion: "v3.8.4_local",
          snapshotAgeMs: 0,
          documentCount: res.length,
          fallbackLevel: 2,
          firestoreAttempted: false,
          reason: "chautari_local_store_served"
        });
        return res;
      }
    } catch (e) {}

    return [];
  }

  /**
   * Retrieve search index items for instant client queries without Firestore scans
   */
  async getSearchIndex(): Promise<any[]> {
    try {
      const snap = await snapshotEngine.getSearchIndexSnapshot();
      if (snap && Array.isArray(snap.items) && snap.items.length > 0) {
        snapshotResilienceGate.recordContentSourceUsed({
          route: "/search",
          resource: "search_index",
          source: "server_snapshot",
          snapshotVersion: "v3.8.4",
          snapshotAgeMs: 0,
          documentCount: snap.items.length,
          fallbackLevel: 3,
          firestoreAttempted: false,
          reason: "search_index_snapshot_served"
        });
        return snap.items;
      }
    } catch (e) {
      console.warn("[ContinuityEngine] getSearchIndexSnapshot failed:", e);
    }

    // Fallback: build search items dynamically from snapshot engine latest articles
    try {
      const articles = await this.getRecentArticles(60);
      const items = articles.map(art => ({
        id: art.id,
        title: art.title,
        title_en: (art as any).title_en || (art as any).titleEnglish || "",
        excerpt: art.excerpt || "",
        excerpt_en: (art as any).excerpt_en || "",
        content: art.content || "",
        categoryId: art.categoryId || "",
        type: "news",
        url: `/article/${art.id}`
      }));

      snapshotResilienceGate.recordContentSourceUsed({
        route: "/search",
        resource: "search_index",
        source: "backup_fallback",
        snapshotVersion: "v3.8.4_dynamic",
        snapshotAgeMs: 0,
        documentCount: items.length,
        fallbackLevel: 4,
        firestoreAttempted: false,
        reason: "dynamic_search_index_generated"
      });
      return items;
    } catch (e) {
      return [];
    }
  }

  /**
   * Retrieve knowledge entities with complete Snapshot OS failover
   */
  async getKnowledgeEntities(): Promise<any[]> {
    try {
      const snapEntities = await snapshotEngine.getKnowledgeSnapshot();
      if (snapEntities && snapEntities.length > 0) {
        snapshotResilienceGate.recordContentSourceUsed({
          route: "/knowledge",
          resource: "knowledge",
          source: "server_snapshot",
          snapshotVersion: "v3.8.4",
          snapshotAgeMs: 0,
          documentCount: snapEntities.length,
          fallbackLevel: 3,
          firestoreAttempted: false,
          reason: "knowledge_snapshot_served"
        });
        return snapEntities;
      }
    } catch (e) {
      console.warn("[ContinuityEngine] getKnowledgeSnapshot failed:", e);
    }
    return [];
  }
}

export const continuityEngine = ContinuityContentRepository.getInstance();
export const contentRepository = continuityEngine;

