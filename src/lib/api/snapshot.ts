/**
 * Snapshot System Implementation
 * Supports: Static JSON files (current), R2-backed dynamic snapshots, Firebase-backed generation
 */

import type {
  ISnapshotSystem,
  SnapshotModule,
  HomepageSnapshot,
  LatestSnapshot,
  BreakingSnapshot,
  TrendingSnapshot,
  CategoriesSnapshot,
  ArticleSnapshot,
  EventSnapshot,
  KnowledgeSnapshot,
  Manifest,
  RebuildResult,
  ModuleRebuildResult,
  IntegrityResult,
  IntegrityMismatch,
  SnapshotHealth,
  Article,
  Category,
  Event,
  KnowledgeNode,
  KnowledgeCategory,
  KnowledgeRelation,
  KnowledgeLink,
  PlatformStats,
} from "./config";

export type { ISnapshotSystem };
import { createDatabase } from "./database";
import { createStorage } from "./storage";
import { getArticlePublicationTimestamp } from "@/src/utils/dateEngine";

/* ============================================================
 * Static Snapshot Reader (Current Implementation)
 * ============================================================ */

class StaticSnapshotReader implements ISnapshotSystem {
  private baseUrl: string;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_TTL = 30000; // 30 seconds

  constructor(baseUrl: string = "/snapshots") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const cacheKey = `${this.baseUrl}${path}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) {
      // Try alternative paths
      const altPaths = this.getAlternativePaths(path);
      for (const alt of altPaths) {
        const altRes = await fetch(`${this.baseUrl}${alt}`);
        if (altRes.ok) {
          const data = await altRes.json();
          this.cache.set(cacheKey, { data, timestamp: Date.now() });
          return data;
        }
      }
      throw new Error(`Snapshot not found: ${path}`);
    }

    const data = await res.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  private getAlternativePaths(path: string): string[] {
    const clean = path.replace(/^\//, "").replace(/\.json$/, "");
    const alts: string[] = [];

    if (clean.startsWith("article/")) {
      const id = clean.slice("article/".length);
      alts.push(`/article_${id}.json`, `/snapshots/article_${id}.json`, `/snapshots/modules/article/${id}.json`);
    } else if (clean.startsWith("event/")) {
      const id = clean.slice("event/".length);
      alts.push(`/event_${id}.json`, `/events/${id}.json`);
    } else if (clean.startsWith("chautari/")) {
      alts.push(`/chautari/${clean.slice("chautari/".length)}`);
    } else if (clean.startsWith("comments/")) {
      alts.push(`/comments/${clean.slice("comments/".length)}`);
    } else if (clean.startsWith("events/")) {
      alts.push(`/events/${clean.slice("events/".length)}`);
    } else if (clean.startsWith("nepal_hub/")) {
      alts.push(`/nepal_hub/${clean.slice("nepal_hub/".length)}`);
    } else if (clean.startsWith("settings/")) {
      alts.push(`/settings/${clean.slice("settings/".length)}`, `/site_config.json`);
    } else if (clean === "manifest.json") {
      alts.push(`/demo/manifest.json`);
    } else if (clean === "knowledge.json") {
      alts.push(`/knowledge/graph.json`, `/knowledge/index.json`);
    } else if (clean.startsWith("collection/")) {
      alts.push(`/demo/collections/${clean.slice("collection/".length)}.json`);
    } else if (clean.startsWith("homepage")) {
      alts.push(`/${clean}`);
    } else if (clean === "site_config.json") {
      alts.push(`/site_config.json`, `/settings/site.json`);
    } else if (clean === "nepalhub.json") {
      alts.push(`/nepalhub.json`, `/nepal_hub/live.json`);
    } else {
      alts.push(`/${clean}`);
    }

    return alts;
  }

  async getHomepageSnapshot(): Promise<HomepageSnapshot> {
    return this.fetchJson("/homepage.json");
  }

  async getLatestSnapshot(): Promise<LatestSnapshot> {
    return this.fetchJson("/latest.json");
  }

  async getBreakingSnapshot(): Promise<BreakingSnapshot> {
    return this.fetchJson("/breaking.json");
  }

  async getTrendingSnapshot(): Promise<TrendingSnapshot> {
    return this.fetchJson("/trending.json");
  }

  async getCategoriesSnapshot(): Promise<CategoriesSnapshot> {
    return this.fetchJson("/categories.json");
  }

  async getArticleSnapshot(articleId: string): Promise<ArticleSnapshot> {
    const data = await this.fetchJson<any>(`/article/${articleId}.json`);
    return {
      article: data.article,
      relatedArticles: data.relatedArticles || [],
      knowledgeLinks: data.knowledgeLinks || [],
      audioUrl: data.audioUrl,
      generatedAt: data.generatedAt,
    };
  }

  async getEventSnapshot(eventId: string): Promise<EventSnapshot> {
    const data = await this.fetchJson<any>(`/event/${eventId}.json`);
    return { event: data.event, generatedAt: data.generatedAt };
  }

  async getKnowledgeSnapshot(): Promise<KnowledgeSnapshot> {
    const [nodes, categories, relations] = await Promise.all([
      this.fetchJson<KnowledgeNode[]>("/knowledge/nodes.json").catch(() => []),
      this.fetchJson<KnowledgeCategory[]>("/knowledge/categories.json").catch(() => []),
      this.fetchJson<KnowledgeRelation[]>("/knowledge/relations.json").catch(() => []),
    ]);
    return { generatedAt: new Date().toISOString(), nodes, categories, relations };
  }

  async getManifest(): Promise<Manifest> {
    return this.fetchJson("/manifest.json");
  }

  // Write operations not supported in static mode
  async rebuildAll(): Promise<RebuildResult> {
    return { success: false, modulesRebuilt: [], durationMs: 0, errors: ["Static mode: rebuild not supported"] };
  }

  async rebuildModule(module: SnapshotModule): Promise<ModuleRebuildResult> {
    return { module, success: false, itemCount: 0, durationMs: 0, sha256: "", errors: ["Static mode: rebuild not supported"] };
  }

  async invalidateCache(module?: SnapshotModule): Promise<void> {
    if (module) {
      // Clear specific module cache
      const prefix = `/${module}`;
      for (const key of this.cache.keys()) {
        if (key.includes(prefix)) this.cache.delete(key);
      }
    } else {
      this.cache.clear();
    }
  }

  async verifyIntegrity(module: SnapshotModule): Promise<IntegrityResult> {
    return {
      module,
      valid: true,
      expectedSha256: "",
      actualSha256: "",
      itemCount: 0,
      mismatches: [],
    };
  }

  async getHealth(): Promise<SnapshotHealth> {
    const manifest = await this.getManifest().catch(() => null);
    return {
      status: manifest ? "healthy" : "stale",
      lastGenerated: {} as Record<SnapshotModule, string>,
      cacheHitRate: 0,
      readsSaved: 0,
      errors: manifest ? [] : ["Manifest not found"],
    };
  }
}

/* ============================================================
 * Dynamic Snapshot Generator (Firebase + R2)
 * ============================================================ */

interface SnapshotGeneratorConfig {
  db: any;
  storage: any;
  r2Prefix: string;
  publicUrl: string;
}

class DynamicSnapshotGenerator implements ISnapshotSystem {
  private config: SnapshotGeneratorConfig;
  private db: any;
  private storage: any;

  constructor(config: SnapshotGeneratorConfig) {
    this.config = config;
    this.db = config.db;
    this.storage = config.storage;
  }

  private async fetchArticles(filters: any = {}): Promise<Article[]> {
    // Query articles from database
    const { getDocs, collection, query, where, orderBy, limit, limitToLast } = await import("firebase/firestore");
    let q = query(collection(this.db, "articles"));

    if (filters.status) q = query(q, where("status", "==", filters.status));
    if (filters.categoryId) q = query(q, where("categoryId", "==", filters.categoryId));
    if (filters.isBreaking) q = query(q, where("isBreaking", "==", true));
    if (filters.isFeatured) q = query(q, where("isFeatured", "==", true));
    if (filters.districtTag) q = query(q, where("districtTags", "array-contains", filters.districtTag));

    q = query(q, orderBy("publishedAt", "desc"));
    if (filters.limit) q = query(q, limit(filters.limit));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Article[];
  }

  private async fetchCategories(): Promise<Category[]> {
    const { getDocs, collection, query, orderBy } = await import("firebase/firestore");
    const q = query(collection(this.db, "categories"), orderBy("order", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Category[];
  }

  private async fetchEvents(filters: any = {}): Promise<Event[]> {
    const { getDocs, collection, query, where, orderBy, limit } = await import("firebase/firestore");
    let q = query(collection(this.db, "events"));
    if (filters.status) q = query(q, where("status", "==", filters.status));
    q = query(q, orderBy("startDate", "asc"));
    if (filters.limit) q = query(q, limit(filters.limit));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Event[];
  }

  private async fetchKnowledgeNodes(): Promise<KnowledgeNode[]> {
    const { getDocs, collection } = await import("firebase/firestore");
    const snapshot = await getDocs(collection(this.db, "knowledge_nodes"));
    return snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as KnowledgeNode[];
  }

  private async fetchKnowledgeCategories(): Promise<KnowledgeCategory[]> {
    const { getDocs, collection, query, orderBy } = await import("firebase/firestore");
    const q = query(collection(this.db, "knowledge_categories"), orderBy("order", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as KnowledgeCategory[];
  }

  private async fetchKnowledgeRelations(): Promise<KnowledgeRelation[]> {
    const { getDocs, collection } = await import("firebase/firestore");
    const snapshot = await getDocs(collection(this.db, "knowledge_relations"));
    return snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as KnowledgeRelation[];
  }

  private async generateHomepage(): Promise<HomepageSnapshot> {
    const [featured, breaking, latest, trending, video, categories, categoryArticles] = await Promise.all([
      this.fetchArticles({ isFeatured: true, limit: 5 }),
      this.fetchArticles({ isBreaking: true, limit: 10 }),
      this.fetchArticles({ status: "published", limit: 20 }),
      this.fetchArticles({ status: "published", limit: 10 }), // trending logic
      this.fetchArticles({ categoryId: "video", status: "published", limit: 10 }),
      this.fetchCategories(),
      this.fetchCategoryArticles(),
    ]);

    const platformStats = await this.getPlatformStats();

    return {
      generatedAt: new Date().toISOString(),
      version: `v${Date.now()}`,
      featuredArticles: featured,
      breakingNews: breaking,
      latestNews: latest,
      trendingNews: trending,
      videoNews: video,
      categoryArticles,
      categories,
      layout: null,
      platformStats,
      announcements: [],
    };
  }

  private async fetchCategoryArticles(): Promise<Record<string, Article[]>> {
    const categories = await this.fetchCategories();
    const result: Record<string, Article[]> = {};

    for (const cat of categories.slice(0, 15)) {
      result[cat.slug] = await this.fetchArticles({ categoryId: cat.id, limit: 5 });
    }

    return result;
  }

  private async getPlatformStats(): Promise<PlatformStats> {
    const { getCountFromServer, collection, query, where } = await import("firebase/firestore");

    const [articlesCount, membersCount, districtsCount, resourcesCount, discussionsCount] = await Promise.all([
      getCountFromServer(query(collection(this.db, "articles"), where("status", "==", "published"))),
      getCountFromServer(collection(this.db, "users")),
      getCountFromServer(collection(this.db, "districts")),
      getCountFromServer(collection(this.db, "knowledge_nodes")),
      getCountFromServer(collection(this.db, "community_posts")),
    ]);

    return {
      articlesCount: articlesCount.data().count,
      membersCount: membersCount.data().count,
      districtsCount: districtsCount.data().count,
      resourcesCount: resourcesCount.data().count,
      discussionsCount: discussionsCount.data().count,
    };
  }

  private async uploadSnapshot(module: SnapshotModule, data: any): Promise<string> {
    const path = `${this.config.r2Prefix}/${module}.json`;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });

    const result = await this.storage.upload(path, blob, {
      contentType: "application/json",
      cacheControl: "public, max-age=300, s-maxage=600",
    });

    return result.downloadUrl;
  }

  private sha256(str: string): string {
    // Simple hash for demo - use crypto.subtle in production
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, "0");
  }

  // ISnapshotSystem implementation
  async getHomepageSnapshot(): Promise<HomepageSnapshot> {
    return this.generateHomepage();
  }

  async getLatestSnapshot(): Promise<LatestSnapshot> {
    const articles = await this.fetchArticles({ status: "published", limit: 50 });
    return { generatedAt: new Date().toISOString(), articles };
  }

  async getBreakingSnapshot(): Promise<BreakingSnapshot> {
    const breakingNews = await this.fetchArticles({ isBreaking: true, limit: 20 });
    return { generatedAt: new Date().toISOString(), breakingNews };
  }

  async getTrendingSnapshot(): Promise<TrendingSnapshot> {
    const trendingNews = await this.fetchArticles({ status: "published", limit: 20 });
    return { generatedAt: new Date().toISOString(), trendingNews };
  }

  async getCategoriesSnapshot(): Promise<CategoriesSnapshot> {
    const [categories, categoryArticles] = await Promise.all([
      this.fetchCategories(),
      this.fetchCategoryArticles(),
    ]);
    return { generatedAt: new Date().toISOString(), categories, categoryArticles };
  }

  async getArticleSnapshot(articleId: string): Promise<ArticleSnapshot> {
    const { getDoc, doc } = await import("firebase/firestore");
    const snap = await getDoc(doc(this.db, "articles", articleId));
    if (!snap.exists()) throw new Error(`Article not found: ${articleId}`);

    const article = { id: snap.id, ...snap.data() } as Article;
    const related = await this.fetchArticles({ categoryId: article.categoryId, limit: 5 });
    const knowledgeLinks: KnowledgeLink[] = []; // Would query knowledge graph

    return {
      article,
      relatedArticles: related.filter(a => a.id !== articleId),
      knowledgeLinks,
      audioUrl: article.audioUrl,
      generatedAt: new Date().toISOString(),
    };
  }

  async getEventSnapshot(eventId: string): Promise<EventSnapshot> {
    const { getDoc, doc } = await import("firebase/firestore");
    const snap = await getDoc(doc(this.db, "events", eventId));
    if (!snap.exists()) throw new Error(`Event not found: ${eventId}`);

    return { event: { id: snap.id, ...snap.data() } as Event, generatedAt: new Date().toISOString() };
  }

  async getKnowledgeSnapshot(): Promise<KnowledgeSnapshot> {
    const [nodes, categories, relations] = await Promise.all([
      this.fetchKnowledgeNodes(),
      this.fetchKnowledgeCategories(),
      this.fetchKnowledgeRelations(),
    ]);
    return { generatedAt: new Date().toISOString(), nodes, categories, relations };
  }

  async getManifest(): Promise<Manifest> {
    const modules = [
      "homepage", "latest", "breaking", "trending", "categories",
      "articles", "events", "knowledge", "nepal-hub", "media", "ads"
    ];

    const moduleHashes: Record<string, { version: string; sha256: string }> = {};
    for (const module of modules) {
      try {
        let data: any;
        switch (module) {
          case "homepage": data = await this.getHomepageSnapshot(); break;
          case "latest": data = await this.getLatestSnapshot(); break;
          case "breaking": data = await this.getBreakingSnapshot(); break;
          case "trending": data = await this.getTrendingSnapshot(); break;
          case "categories": data = await this.getCategoriesSnapshot(); break;
          default: data = { generatedAt: new Date().toISOString() };
        }
        const json = JSON.stringify(data);
        moduleHashes[module] = { version: `v${Date.now()}`, sha256: this.sha256(json) };
      } catch {
        moduleHashes[module] = { version: "error", sha256: "" };
      }
    }

    return {
      snapshotVersion: `v${Date.now()}`,
      generatedAt: new Date().toISOString(),
      modules: moduleHashes,
    };
  }

  async rebuildAll(): Promise<RebuildResult> {
    const start = Date.now();
    const modules: SnapshotModule[] = [
      "homepage", "latest", "breaking", "trending", "categories",
      "articles", "events", "knowledge", "nepal-hub", "media", "ads"
    ];
    const rebuilt: SnapshotModule[] = [];
    const errors: string[] = [];

    for (const module of modules) {
      try {
        await this.rebuildModule(module);
        rebuilt.push(module);
      } catch (e) {
        errors.push(`${module}: ${e}`);
      }
    }

    return { success: errors.length === 0, modulesRebuilt: rebuilt, durationMs: Date.now() - start, errors };
  }

  async rebuildModule(module: SnapshotModule): Promise<ModuleRebuildResult> {
    const start = Date.now();
    let data: any;
    let itemCount = 0;

    switch (module) {
      case "homepage":
        data = await this.getHomepageSnapshot();
        itemCount = (data as HomepageSnapshot).latestNews.length;
        break;
      case "latest":
        data = await this.getLatestSnapshot();
        itemCount = (data as LatestSnapshot).articles.length;
        break;
      case "breaking":
        data = await this.getBreakingSnapshot();
        itemCount = (data as BreakingSnapshot).breakingNews.length;
        break;
      case "trending":
        data = await this.getTrendingSnapshot();
        itemCount = (data as TrendingSnapshot).trendingNews.length;
        break;
      case "categories":
        data = await this.getCategoriesSnapshot();
        itemCount = (data as CategoriesSnapshot).categories.length;
        break;
      case "knowledge":
        data = await this.getKnowledgeSnapshot();
        itemCount = (data as KnowledgeSnapshot).nodes.length;
        break;
      default:
        data = { generatedAt: new Date().toISOString() };
    }

    const json = JSON.stringify(data, null, 2);
    const sha256 = this.sha256(json);
    await this.uploadSnapshot(module, data);

    return { module, success: true, itemCount, durationMs: Date.now() - start, sha256, errors: [] };
  }

  async invalidateCache(module?: SnapshotModule): Promise<void> {
    // Invalidate CDN cache if using Cloudflare
    if (module) {
      // Purge specific module
    } else {
      // Purge all
    }
  }

  async verifyIntegrity(module: SnapshotModule): Promise<IntegrityResult> {
    const manifest = await this.getManifest();
    const expected = manifest.modules[module]?.sha256 || "";
    const result = await this.rebuildModule(module);
    const actual = result.sha256;

    return {
      module,
      valid: expected === actual && expected !== "",
      expectedSha256: expected,
      actualSha256: actual,
      itemCount: result.itemCount,
      mismatches: expected !== actual ? [{ path: module, expected, actual }] : [],
    };
  }

  async getHealth(): Promise<SnapshotHealth> {
    const manifest = await this.getManifest();
    const errors: string[] = [];

    for (const [module, info] of Object.entries(manifest.modules)) {
      if (info.sha256 === "error") errors.push(`${module}: generation failed`);
    }

    return {
      status: errors.length === 0 ? "healthy" : errors.length < 3 ? "degraded" : "failed",
      lastGenerated: Object.fromEntries(
        Object.entries(manifest.modules).map(([k, v]) => [k as SnapshotModule, v.version])
      ) as any,
      cacheHitRate: 0, // Would track from CDN
      readsSaved: 0, // Would track from analytics
      errors,
    };
  }
}

/* ============================================================
 * Hybrid Snapshot System
 * ============================================================ */

export class HybridSnapshotSystem implements ISnapshotSystem {
  private staticReader: StaticSnapshotReader;
  private dynamicGenerator: DynamicSnapshotGenerator | null;
  private mode: "static" | "dynamic" | "hybrid";

  constructor(
    staticBaseUrl: string,
    dynamicConfig?: SnapshotGeneratorConfig,
    mode: "static" | "dynamic" | "hybrid" = "hybrid"
  ) {
    this.staticReader = new StaticSnapshotReader(staticBaseUrl);
    this.dynamicGenerator = dynamicConfig ? new DynamicSnapshotGenerator(dynamicConfig) : null;
    this.mode = mode;
  }

  private getReader(): ISnapshotSystem {
    if (this.mode === "static") return this.staticReader;
    if (this.mode === "dynamic") return this.dynamicGenerator!;
    // Hybrid: prefer static for reads, dynamic for writes
    return this.staticReader;
  }

  private getWriter(): ISnapshotSystem {
    if (!this.dynamicGenerator) throw new Error("Dynamic generator not configured");
    return this.dynamicGenerator;
  }

  // Read operations (use static in hybrid mode)
  async getHomepageSnapshot(): Promise<HomepageSnapshot> { return this.getReader().getHomepageSnapshot(); }
  async getLatestSnapshot(): Promise<LatestSnapshot> { return this.getReader().getLatestSnapshot(); }
  async getBreakingSnapshot(): Promise<BreakingSnapshot> { return this.getReader().getBreakingSnapshot(); }
  async getTrendingSnapshot(): Promise<TrendingSnapshot> { return this.getReader().getTrendingSnapshot(); }
  async getCategoriesSnapshot(): Promise<CategoriesSnapshot> { return this.getReader().getCategoriesSnapshot(); }
  async getArticleSnapshot(articleId: string): Promise<ArticleSnapshot> { return this.getReader().getArticleSnapshot(articleId); }
  async getEventSnapshot(eventId: string): Promise<EventSnapshot> { return this.getReader().getEventSnapshot(eventId); }
  async getKnowledgeSnapshot(): Promise<KnowledgeSnapshot> { return this.getReader().getKnowledgeSnapshot(); }
  async getManifest(): Promise<Manifest> { return this.getReader().getManifest(); }

  // Write operations (require dynamic)
  async rebuildAll(): Promise<RebuildResult> { return this.getWriter().rebuildAll(); }
  async rebuildModule(module: SnapshotModule): Promise<ModuleRebuildResult> { return this.getWriter().rebuildModule(module); }
  async invalidateCache(module?: SnapshotModule): Promise<void> {
    this.staticReader.invalidateCache(module);
    if (this.dynamicGenerator) await this.dynamicGenerator.invalidateCache(module);
  }

  async verifyIntegrity(module: SnapshotModule): Promise<IntegrityResult> { return this.getWriter().verifyIntegrity(module); }
  async getHealth(): Promise<SnapshotHealth> { return this.getWriter().getHealth(); }
}

/* ============================================================
 * Factory
 * ============================================================ */

export function createSnapshotSystem(config: any, db?: any, storage?: any): ISnapshotSystem {
  const staticBaseUrl = config.snapshot?.staticBaseUrl || "/snapshots";

  if (!config.snapshot?.enabled || config.mode === "demo") {
    return new StaticSnapshotReader(staticBaseUrl);
  }

  if (config.mode === "firebase+r2" && db && storage && config.snapshot?.r2Prefix) {
    return new HybridSnapshotSystem(
      staticBaseUrl,
      { db, storage, r2Prefix: config.snapshot.r2Prefix, publicUrl: config.r2?.publicUrl || "" },
      "hybrid"
    );
  }

  if (config.mode === "r2-only" && db && storage && config.snapshot?.r2Prefix) {
    return new HybridSnapshotSystem(
      staticBaseUrl,
      { db, storage, r2Prefix: config.snapshot.r2Prefix, publicUrl: config.r2?.publicUrl || "" },
      "dynamic"
    );
  }

  return new StaticSnapshotReader(staticBaseUrl);
}