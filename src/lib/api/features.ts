/**
 * Feature Flags Implementation
 * Integrates with Feature Control OS for centralized feature management
 */

import type {
  IFeatureFlags,
  FeatureState,
  UserAccessContext,
} from "./config";

export type { IFeatureFlags, UserAccessContext };
import { featureControlOS } from "@/src/services/featureControlOS";

/* ============================================================
 * Feature Control OS Adapter
 * ============================================================ */

class FeatureControlAdapter implements IFeatureFlags {
  private listeners = new Map<string, Set<(featureId: string, state: FeatureState) => void>>();
  private initialized = false;
  private localDefaults: Record<string, FeatureState> = {};

  constructor(localDefaults?: Record<string, FeatureState>) {
    this.localDefaults = localDefaults || {};
    this.init();
  }

  private async init(): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      // Initialize Feature Control OS
      await featureControlOS.initRemoteConfig();
      this.initialized = true;

      // Listen for updates
      window.addEventListener("feature-control-updated", () => {
        this.notifyAll();
      });
    } catch (e) {
      console.warn("[FeatureFlags] Failed to initialize Feature Control OS:", e);
    }
  }

  private notifyAll(): void {
    for (const [featureId, callbacks] of this.listeners) {
      const state = this.getState(featureId);
      for (const cb of callbacks) {
        try { cb(featureId, state); } catch {}
      }
    }
  }

  isEnabled(featureId: string, userContext?: UserAccessContext): boolean {
    const state = this.getState(featureId, userContext);
    return state === "public" || (state === "beta" && userContext?.isBetaUser) || (state === "admin_only" && this.isAdmin(userContext));
  }

  getState(featureId: string, userContext?: UserAccessContext): FeatureState {
    // Check Feature Control OS first
    try {
      if (this.initialized) {
        const evaluation = featureControlOS.evaluateFeature(featureId, userContext || {});
        if (evaluation) return evaluation.effectiveState as FeatureState;
      }
    } catch {}

    // Fall back to local defaults
    if (this.localDefaults[featureId]) return this.localDefaults[featureId];

    // Default to off for unknown features
    return "off";
  }

  getAllStates(): Record<string, FeatureState> {
    const states: Record<string, FeatureState> = { ...this.localDefaults };

    if (this.initialized) {
      try {
        const config = featureControlOS.getConfig();
        for (const [id, state] of Object.entries(config.overrides)) {
          states[id] = state as FeatureState;
        }
      } catch {}
    }

    return states;
  }

  onChange(callback: (featureId: string, state: FeatureState) => void): () => void {
    const featureId = ""; // Will be called for all features
    if (!this.listeners.has(featureId)) this.listeners.set(featureId, new Set());
    this.listeners.get(featureId)!.add(callback);

    return () => {
      this.listeners.get(featureId)?.delete(callback);
    };
  }

  async refresh(): Promise<void> {
    if (this.initialized) {
      await featureControlOS.initRemoteConfig();
      this.notifyAll();
    }
  }

  private isAdmin(context?: UserAccessContext): boolean {
    return context?.role === "super_admin" || context?.role === "admin" || context?.role === "chief_editor";
  }
}

/* ============================================================
 * Static Feature Flags (for demo/static builds)
 * ============================================================ */

class StaticFeatureFlags implements IFeatureFlags {
  private states: Record<string, FeatureState>;
  private listeners = new Set<(featureId: string, state: FeatureState) => void>();

  constructor(overrides: Record<string, FeatureState> = {}) {
    // Default states matching LAUNCH_STANDARD profile
    this.states = {
      "core.news": "public",
      "core.search": "public",
      "core.auth": "public",
      "homepage.hero": "public",
      "homepage.breaking": "public",
      "homepage.ecosystem": "public",
      "homepage.bento": "public",
      "homepage.categoryNav": "public",
      "homepage.trendingStories": "public",
      "homepage.nepalMap": "public",
      "homepage.sgisShowcase": "public",
      "homepage.marketData": "public",
      "homepage.announcements": "public",
      "article.listen": "public",
      "article.comments": "admin_only",
      "article.provenance": "public",
      "article.districtImpact": "public",
      "article.storyNetwork": "public",
      "article.crossLinks": "public",
      "article.storeConnector": "public",
      "article.timeline": "public",
      "article.share": "public",
      "sidebar.global": "public",
      "sidebar.mostRead": "public",
      "sidebar.newsletter": "public",
      "sidebar.social": "public",
      "sidebar.ads": "public",
      "sidebar.knowledgeGraph": "public",
      "media.listenos": "public",
      "media.radio": "public",
      "media.live": "public",
      "media.video": "public",
      "ai.tts": "public",
      "ai.newsroom": "admin_only",
      "ai.translation": "admin_only",
      "ai.ocr": "admin_only",
      "ai.ask_sanatan": "public",
      "knowledge.base": "public",
      "knowledge.sgis": "public",
      "knowledge.timeline": "public",
      "knowledge.archives": "public",
      "knowledge.festivals": "public",
      "community.chautari": "public",
      "community.writing": "public",
      "community.events": "public",
      "commerce.store": "public",
      "revenue.ads": "public",
      "revenue.membership": "public",
      "training.academy": "public",
      "training.certification": "public",
      "notifications.push": "public",
      "notifications.center": "public",
      "nepalhub.main": "public",
      "nepalhub.situationRoom": "public",
      "blog.main": "public",
      "infra.snapshotOs": "public",
      "infra.featureControl": "public",
      "infra.auditTrail": "public",
      ...overrides,
    };
  }

  isEnabled(featureId: string, userContext?: UserAccessContext): boolean {
    const state = this.getState(featureId, userContext);
    return state === "public" || (state === "beta" && userContext?.isBetaUser) || (state === "admin_only" && this.isAdmin(userContext));
  }

  getState(featureId: string, userContext?: UserAccessContext): FeatureState {
    return this.states[featureId] || "off";
  }

  getAllStates(): Record<string, FeatureState> {
    return { ...this.states };
  }

  onChange(callback: (featureId: string, state: FeatureState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  async refresh(): Promise<void> {
    // No-op for static
  }

  private isAdmin(context?: UserAccessContext): boolean {
    return context?.role === "super_admin" || context?.role === "admin" || context?.role === "chief_editor";
  }
}

/* ============================================================
 * Factory
 * ============================================================ */

export function createFeatureFlags(config: any): IFeatureFlags {
  if (config.mode === "demo" || !config.features?.controlEndpoint) {
    return new StaticFeatureFlags(config.features?.localDefaults);
  }

  return new FeatureControlAdapter(config.features?.localDefaults);
}