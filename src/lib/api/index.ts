/**
 * SanatanMarga Unified API Facade
 *
 * Single entry point for all backend services.
 * Automatically configures based on environment variables.
 * Provides both high-level service objects and low-level primitives.
 */

import { createApiConfigFromEnv, type ApiConfig, type BackendMode } from "./config";
import { createDatabase, type IDatabase, type DocumentReference, type CollectionReference, type Query, type QueryConstraint } from "./database";
import { createStorage, type IStorage } from "./storage";
import { createAiService, type IAiService } from "./ai";
import { createSnapshotSystem, type ISnapshotSystem } from "./snapshot";
import { createAuth, type IAuth, type User, type UserRole } from "./auth";
import { createFeatureFlags, type IFeatureFlags, type UserAccessContext } from "./features";

/* ============================================================
 * Main API Class
 * ============================================================ */

export class SanatanMargaApi {
  public readonly config: ApiConfig;
  public readonly db: IDatabase;
  public readonly storage: IStorage;
  public readonly ai: IAiService;
  public readonly snapshots: ISnapshotSystem;
  public readonly auth: IAuth;
  public readonly features: IFeatureFlags;

  private static instance: SanatanMargaApi | null = null;

  private constructor(config: ApiConfig) {
    this.config = config;
    this.db = createDatabase(config);
    this.storage = createStorage(config);
    this.ai = createAiService(config);
    this.snapshots = createSnapshotSystem(config, this.db, this.storage);
    this.auth = createAuth(config);
    this.features = createFeatureFlags(config);
  }

  static initialize(config?: Partial<ApiConfig>): SanatanMargaApi {
    const fullConfig = config ? { ...createApiConfigFromEnv(), ...config } : createApiConfigFromEnv();
    SanatanMargaApi.instance = new SanatanMargaApi(fullConfig);
    return SanatanMargaApi.instance;
  }

  static getInstance(): SanatanMargaApi {
    if (!SanatanMargaApi.instance) {
      SanatanMargaApi.instance = new SanatanMargaApi(createApiConfigFromEnv());
    }
    return SanatanMargaApi.instance;
  }

  static reset(): void {
    SanatanMargaApi.instance = null;
  }

  // Convenience methods for common operations
  async getCurrentUser(): Promise<User | null> {
    return this.auth.getCurrentUser();
  }

  async requireAuth(): Promise<User> {
    const user = await this.auth.getCurrentUser();
    if (!user) throw new Error("Authentication required");
    return user;
  }

  async requireRole(...roles: UserRole[]): Promise<User> {
    const user = await this.requireAuth();
    if (!roles.includes(user.role!)) throw new Error(`Requires role: ${roles.join(" or ")}`);
    return user;
  }

  isFeatureEnabled(featureId: string, userContext?: UserAccessContext): boolean {
    return this.features.isEnabled(featureId, userContext);
  }

  async getHomepage(): Promise<any> {
    return this.snapshots.getHomepageSnapshot();
  }

  async getArticle(articleId: string): Promise<any> {
    return this.snapshots.getArticleSnapshot(articleId);
  }

  async searchArticles(query: string, filters: any = {}): Promise<any[]> {
    // Use AI-powered search or database query
    return this.db.getDocs("articles", [
      this.db.where("status", "==", "published"),
      this.db.where("title", ">=", query),
      this.db.where("title", "<=", query + "\uf8ff"),
      this.db.limit(20),
    ]);
  }

  // Health check
  async healthCheck(): Promise<{ status: "healthy" | "degraded" | "unhealthy"; services: Record<string, boolean> }> {
    const services = {
      database: false,
      storage: false,
      ai: false,
      snapshots: false,
      auth: false,
      features: false,
    };

    try {
      await this.db.getDoc("_health/check");
      services.database = true;
    } catch {}

    try {
      await this.storage.list("", { maxResults: 1 });
      services.storage = true;
    } catch {}

    try {
      const quota = await this.ai.getQuotaStatus();
      services.ai = !quota.isExceeded;
    } catch {}

    try {
      const health = await this.snapshots.getHealth();
      services.snapshots = health.status !== "failed";
    } catch {}

    try {
      const user = this.auth.getCurrentUser();
      services.auth = true; // Auth always available in demo
    } catch {}

    try {
      this.features.getAllStates();
      services.features = true;
    } catch {}

    const healthyCount = Object.values(services).filter(Boolean).length;
    const status = healthyCount >= 5 ? "healthy" : healthyCount >= 3 ? "degraded" : "unhealthy";

    return { status, services };
  }
}

/* ============================================================
 * React Hooks (for use in components)
 * ============================================================ */

import { useState, useEffect, useCallback } from "react";

export function useApi(): SanatanMargaApi {
  const [api] = useState(() => SanatanMargaApi.getInstance());
  return api;
}

export function useAuth() {
  const api = useApi();
  const [user, setUser] = useState<User | null>(api.auth.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = api.auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, [api]);

  const signIn = useCallback(async (email: string, password: string) => {
    return api.auth.signInWithEmailAndPassword(email, password);
  }, [api]);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    return api.auth.createUserWithEmailAndPassword(email, password, displayName);
  }, [api]);

  const signOut = useCallback(async () => {
    return api.auth.signOut();
  }, [api]);

  return { user, loading, signIn, signUp, signOut, isAuthenticated: !!user };
}

export function useFeature(featureId: string) {
  const api = useApi();
  const [enabled, setEnabled] = useState(() => api.features.isEnabled(featureId));

  useEffect(() => {
    const unsub = api.features.onChange((id, state) => {
      if (id === featureId) setEnabled(state === "public" || state === "beta");
    });
    return unsub;
  }, [api, featureId]);

  return enabled;
}

export function useFeatureFlags() {
  const api = useApi();
  return api.features;
}

export function useSnapshot<T>(fetcher: (snapshots: ISnapshotSystem) => Promise<T>, deps: any[] = []) {
  const api = useApi();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcher(api.snapshots)
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [api, ...deps]);

  return { data, loading, error, refetch: () => fetcher(api.snapshots).then(setData).catch(setError) };
}

/* ============================================================
 * High-level Service Helpers
 * ============================================================ */

// Articles
export async function getArticles(filters: {
  category?: string;
  status?: string;
  limit?: number;
  offset?: number;
  featured?: boolean;
  breaking?: boolean;
  district?: string;
} = {}): Promise<any[]> {
  const api = SanatanMargaApi.getInstance();
  const constraints: QueryConstraint[] = [];

  if (filters.status) constraints.push(api.db.where("status", "==", filters.status));
  else constraints.push(api.db.where("status", "==", "published"));

  if (filters.category) constraints.push(api.db.where("categorySlug", "==", filters.category));
  if (filters.featured) constraints.push(api.db.where("isFeatured", "==", true));
  if (filters.breaking) constraints.push(api.db.where("isBreaking", "==", true));
  if (filters.district) constraints.push(api.db.where("districtTags", "array-contains", filters.district));

  constraints.push(api.db.orderBy("publishedAt", "desc"));
  if (filters.limit) constraints.push(api.db.limit(filters.limit));
  if (filters.offset) constraints.push(api.db.startAfter({ id: filters.offset } as any)); // Simplified

  return api.db.getDocs("articles", constraints);
}

export async function getArticleBySlug(slug: string): Promise<any | null> {
  const api = SanatanMargaApi.getInstance();
  // Would use a slug index in production
  const articles = await api.db.getDocs("articles", [
    api.db.where("slug", "==", slug),
    api.db.limit(1),
  ]);
  return articles[0] || null;
}

// Categories
export async function getCategories(): Promise<any[]> {
  const api = SanatanMargaApi.getInstance();
  return api.db.getDocs("categories", [api.db.orderBy("order", "asc")]);
}

// Events
export async function getEvents(filters: { status?: string; upcoming?: boolean; limit?: number } = {}): Promise<any[]> {
  const api = SanatanMargaApi.getInstance();
  const constraints: QueryConstraint[] = [];

  if (filters.status) constraints.push(api.db.where("status", "==", filters.status));
  else constraints.push(api.db.where("status", "==", "published"));

  if (filters.upcoming) constraints.push(api.db.where("startDate", ">=", new Date().toISOString()));

  constraints.push(api.db.orderBy("startDate", "asc"));
  if (filters.limit) constraints.push(api.db.limit(filters.limit));

  return api.db.getDocs("events", constraints);
}

// Knowledge
export async function getKnowledgeNodes(filters: { category?: string; type?: string; limit?: number } = {}): Promise<any[]> {
  const api = SanatanMargaApi.getInstance();
  const constraints: QueryConstraint[] = [];

  if (filters.category) constraints.push(api.db.where("category", "==", filters.category));
  if (filters.type) constraints.push(api.db.where("type", "==", filters.type));
  if (filters.limit) constraints.push(api.db.limit(filters.limit));

  return api.db.getDocs("knowledge_nodes", constraints);
}

// Community
export async function getCommunityPosts(filters: { category?: string; limit?: number } = {}): Promise<any[]> {
  const api = SanatanMargaApi.getInstance();
  const constraints: QueryConstraint[] = [api.db.orderBy("createdAt", "desc")];
  if (filters.category) constraints.push(api.db.where("category", "==", filters.category));
  if (filters.limit) constraints.push(api.db.limit(filters.limit));
  return api.db.getDocs("community_posts", constraints);
}

// Store
export async function getProducts(filters: { category?: string; featured?: boolean; limit?: number } = {}): Promise<any[]> {
  const api = SanatanMargaApi.getInstance();
  const constraints: QueryConstraint[] = [api.db.where("status", "==", "active")];
  if (filters.category) constraints.push(api.db.where("category", "==", filters.category));
  if (filters.featured) constraints.push(api.db.where("featured", "==", true));
  constraints.push(api.db.orderBy("createdAt", "desc"));
  if (filters.limit) constraints.push(api.db.limit(filters.limit));
  return api.db.getDocs("products", constraints);
}

// AI Helpers
export async function askSanatan(question: string, context?: string): Promise<string> {
  const api = SanatanMargaApi.getInstance();
  const prompt = `You are Ask Sanatan, a grounded research assistant for Sanatan Marga. 
Answer based on Vedic scriptures, historical records, and verified knowledge.
${context ? `Context: ${context}` : ""}
Question: ${question}
Provide a well-sourced answer with citations.`;

  const result = await api.ai.generateText(prompt, { temperature: 0.3, maxTokens: 2048 });
  return result.text;
}

export async function generateArticleSummary(article: any): Promise<string> {
  const api = SanatanMargaApi.getInstance();
  const prompt = `Summarize this article in 2-3 sentences for a news preview:
Title: ${article.title}
Content: ${article.content?.slice(0, 3000)}`;

  const result = await api.ai.generateText(prompt, { temperature: 0.5, maxTokens: 200 });
  return result.text;
}

export async function synthesizeArticleAudio(article: any, voice?: string): Promise<ArrayBuffer> {
  const api = SanatanMargaApi.getInstance();
  const text = `${article.title}. ${article.excerpt}. ${article.content?.slice(0, 5000)}`;
  const result = await api.ai.synthesizeSpeech(text, { voice: voice || "Kore", format: "mp3" });
  return result.audioData;
}

/* ============================================================
 * Auto-initialization
 * ============================================================ */

// Initialize on import (client-side)
if (typeof window !== "undefined") {
  // Defer to allow env vars to be set
  setTimeout(() => {
    try {
      SanatanMargaApi.getInstance();
    } catch (e) {
      console.warn("[SanatanMargaApi] Auto-init failed:", e);
    }
  }, 0);
}

export { SanatanMargaApi as default };