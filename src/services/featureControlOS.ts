/**
 * SANATANMARGA 4.2.7 — FEATURE CONTROL OS v1
 * Centralized Launch Control, Gradual Rollout & Kill-Switch System
 *
 * Rules:
 * 1. Zero public Firestore listeners.
 * 2. Multi-tier resolution: Memory -> Safe Storage -> Snapshot OS (/api/cache/feature-control.json) -> Compiled Defaults.
 * 3. Hierarchical inheritance & dependency validation.
 * 4. Last-known-good persistence.
 */

import {
  FeatureState,
  FeatureLifecycleState,
  FeatureExposure,
  FeatureDefinition,
  FeatureEvaluation,
  FeatureControlConfig,
  FeatureAuditRecord,
  CANONICAL_FEATURE_REGISTRY,
  ROLLOUT_PROFILES,
  RolloutPresetName,
  mapStateToLifecycle
} from "@/src/config/featureRegistry";
import { safeLocalStorage } from "@/src/lib/safeStorage";
import { resolveApiUrl } from "@/src/lib/apiConfig";
import { listenerRegistry, isContinuityModeActive } from "@/src/lib/firebase";

const STORAGE_KEY = "sanatan_feature_control_v1";
const LAST_KNOWN_GOOD_KEY = "sanatan_feature_control_lkg_v1";
const EVENT_NAME = "feature-control-updated";

export interface UserAccessContext {
  role?: string | null;
  email?: string | null;
  uid?: string | null;
  isBetaUser?: boolean;
  previewMode?: boolean;
  tenantId?: string | null;
  tenantOverrides?: Record<string, FeatureState>;
}

class FeatureControlOS {
  private config: FeatureControlConfig;
  private registryMap: Map<string, FeatureDefinition> = new Map();
  private isLoadedFromRemote = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    // Populate registry lookup map
    CANONICAL_FEATURE_REGISTRY.forEach(item => {
      this.registryMap.set(item.id, item);
    });

    // Initialize with safe compiled defaults
    this.config = this.getCompiledDefaultConfig();

    // Hydrate synchronously from local storage or last known good
    this.hydrateFromLocalStorage();

    // Trigger async non-blocking fetch from static Snapshot OS endpoint
    if (typeof window !== "undefined") {
      this.initRemoteConfig();
    }
  }

  private getCompiledDefaultConfig(): FeatureControlConfig {
    const overrides: Record<string, FeatureState> = {};
    CANONICAL_FEATURE_REGISTRY.forEach(item => {
      overrides[item.id] = item.defaultState;
    });

    return {
      version: 1,
      updatedAt: "2026-09-24T00:00:00.000Z",
      updatedBy: "system_compiler",
      overrides,
      auditTrail: []
    };
  }

  private hydrateFromLocalStorage(): void {
    try {
      const stored = safeLocalStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.overrides === "object" && typeof parsed.version === "number") {
          this.config = parsed;
          return;
        }
      }

      // Check last-known-good fallback
      const lkg = safeLocalStorage.getItem(LAST_KNOWN_GOOD_KEY);
      if (lkg) {
        const parsedLkg = JSON.parse(lkg);
        if (parsedLkg && typeof parsedLkg.overrides === "object") {
          this.config = parsedLkg;
        }
      }
    } catch (e) {
      console.warn("[FEATURE_CONTROL_OS] Local storage hydration warning:", e);
    }
  }

  /**
   * Non-blocking snapshot fetch
   * Queries Snapshot OS endpoint /api/cache/feature-control.json
   * ZERO Firestore listeners!
   */
  public async initRemoteConfig(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        const url = resolveApiUrl("/api/cache/feature-control.json");
        const res = await fetch(url, {
          headers: { "Accept": "application/json" },
          cache: "no-cache"
        });

        if (res.ok) {
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json") || contentType.includes("+json")) {
            const remoteConfig = await res.json();
            if (remoteConfig && typeof remoteConfig.overrides === "object" && typeof remoteConfig.version === "number") {
              // Validate incoming config
              if (remoteConfig.version >= this.config.version || !this.isLoadedFromRemote) {
                this.config = remoteConfig;
                this.isLoadedFromRemote = true;
                this.persistConfigLocally(remoteConfig);
                this.dispatchUpdateEvent();
                console.info(`[FEATURE_CONTROL_OS] Hydrated remote snapshot config v${remoteConfig.version}`);
              }
            }
          }
        }
      } catch (err) {
        // Safe degraded continuity: remain on local/compiled defaults
        console.warn("[FEATURE_CONTROL_OS] Snapshot endpoint unavailable, using local cache/defaults:", err);
      }
    })();

    return this.loadPromise;
  }

  private persistConfigLocally(cfg: FeatureControlConfig): void {
    try {
      const str = JSON.stringify(cfg);
      safeLocalStorage.setItem(STORAGE_KEY, str);
      safeLocalStorage.setItem(LAST_KNOWN_GOOD_KEY, str);
    } catch (e) {
      console.warn("[FEATURE_CONTROL_OS] Local persist failed:", e);
    }
  }

  private dispatchUpdateEvent(): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { version: this.config.version } }));
    }
  }

  // ========================================================
  // RESOLUTION ENGINE
  // ========================================================

  /**
   * Get direct configured state for a feature
   */
  public getDirectState(featureId: string): FeatureState {
    if (this.config.overrides && this.config.overrides[featureId] !== undefined) {
      return this.config.overrides[featureId];
    }
    const def = this.registryMap.get(featureId);
    return def ? def.defaultState : "off";
  }

  /**
   * Get effective state taking parent hierarchy into account
   */
  public getEffectiveState(featureId: string): FeatureState {
    const evaluation = this.evaluateFeature(featureId);
    return evaluation.effectiveState;
  }

  /**
   * Central Canonical Feature Evaluator (Phase 1E)
   * Resolves lifecycle, hierarchy, dependencies, cycle safety, tenant and role authorization.
   */
  public evaluateFeature(
    featureId: string,
    context?: UserAccessContext,
    visited?: Set<string>
  ): FeatureEvaluation {
    const def = this.registryMap.get(featureId);
    if (!def) {
      return {
        featureId,
        enabled: false,
        visible: false,
        routeAllowed: false,
        mountAllowed: false,
        backgroundAllowed: false,
        snapshotAllowed: false,
        seoAllowed: false,
        listenerAllowed: false,
        directState: "off",
        effectiveState: "off",
        lifecycleState: "BUILT",
        exposure: "HIDDEN",
        reason: "UNKNOWN_FEATURE"
      };
    }

    if (def.lifecycle === "RETIRED") {
      return {
        featureId,
        enabled: false,
        visible: false,
        routeAllowed: false,
        mountAllowed: false,
        backgroundAllowed: false,
        snapshotAllowed: false,
        seoAllowed: false,
        listenerAllowed: false,
        directState: "off",
        effectiveState: "off",
        lifecycleState: "RETIRED",
        exposure: "HIDDEN",
        reason: "FEATURE_RETIRED",
        isRetired: true
      };
    }

    // Cycle safety
    const currentVisited = visited ? new Set(visited) : new Set<string>();
    if (currentVisited.has(featureId)) {
      console.warn(`[FEATURE_CONTROL_OS] Dependency cycle detected involving '${featureId}'`);
      return {
        featureId,
        enabled: false,
        visible: false,
        routeAllowed: false,
        mountAllowed: false,
        backgroundAllowed: false,
        snapshotAllowed: false,
        seoAllowed: false,
        listenerAllowed: false,
        directState: "off",
        effectiveState: "off",
        lifecycleState: "BUILT",
        exposure: "HIDDEN",
        reason: "DEPENDENCY_CYCLE"
      };
    }
    currentVisited.add(featureId);

    // Direct configured state
    let direct = this.getDirectState(featureId);

    // Tenant-level overrides (additive restriction: cannot exceed global availability)
    if (context?.tenantOverrides && context.tenantOverrides[featureId] !== undefined) {
      const tenantState = context.tenantOverrides[featureId];
      if (direct === "off" && tenantState !== "off") {
        // Tenant cannot force-enable a globally disabled feature
      } else if (direct === "public" && tenantState !== "public") {
        direct = tenantState;
      }
    }

    let effectiveState = direct;
    let parentOff = false;

    // Check parent state
    if (def.parentId) {
      const parentEval = this.evaluateFeature(def.parentId, context, currentVisited);
      if (!parentEval.enabled || parentEval.effectiveState === "off") {
        effectiveState = "off";
        parentOff = true;
      } else if (parentEval.effectiveState === "admin_only" && direct === "public") {
        effectiveState = "admin_only";
      } else if (parentEval.effectiveState === "beta" && direct === "public") {
        effectiveState = "beta";
      }
    }

    // Check dependencies
    const missingDependencies: string[] = [];
    if (def.dependencies && def.dependencies.length > 0) {
      for (const depId of def.dependencies) {
        const depEval = this.evaluateFeature(depId, context, currentVisited);
        if (!depEval.enabled || depEval.effectiveState === "off") {
          effectiveState = "off";
          missingDependencies.push(depId);
        }
      }
    }

    let isEmergencyShutdown = false;
    if (typeof window !== "undefined" && isContinuityModeActive()) {
      const emergencyOverride = ROLLOUT_PROFILES.EMERGENCY_MODE.overrides[featureId];
      if (emergencyOverride === "off") {
        effectiveState = "off";
        isEmergencyShutdown = true;
      }
    }

    const role = (context?.role || "").toLowerCase();
    const isSuperAdmin = role === "super_admin" || role === "superadmin";
    const isStaff = isSuperAdmin || role === "admin" || role === "editor" || role === "chief_editor";

    let enabled = false;
    let reason = "OK";

    if (isEmergencyShutdown) {
      enabled = false;
      reason = "CIRCUIT_BREAKER_EMERGENCY";
    } else if (parentOff) {
      enabled = false;
      reason = "PARENT_DISABLED";
    } else if (missingDependencies.length > 0) {
      enabled = false;
      reason = "DEPENDENCY_UNSATISFIED";
    } else if (effectiveState === "public") {
      enabled = true;
      reason = "PUBLIC_ACCESS";
    } else if (effectiveState === "beta") {
      if (isStaff || !!context?.isBetaUser) {
        enabled = true;
        reason = "BETA_ACCESS";
      } else {
        enabled = false;
        reason = "BETA_ONLY";
      }
    } else if (effectiveState === "admin_only") {
      if (isStaff) {
        enabled = true;
        reason = "STAFF_ACCESS";
      } else {
        enabled = false;
        reason = "STAFF_ONLY";
      }
    } else if (effectiveState === "off") {
      if (context?.previewMode && isSuperAdmin) {
        enabled = true;
        reason = "SUPERADMIN_PREVIEW";
      } else {
        enabled = false;
        reason = "FEATURE_DISABLED";
      }
    }

    const controls = def.controls || {};
    const exposure = def.exposure || (effectiveState === "public" ? "PRIMARY" : "SECONDARY");
    const lifecycle = def.lifecycle || mapStateToLifecycle(effectiveState);

    const visible = enabled && (controls.navigation !== false) && exposure !== "HIDDEN";
    const routeAllowed = enabled && (controls.route !== false);
    const mountAllowed = enabled && (controls.component !== false);
    const backgroundAllowed = enabled && (controls.backgroundJob !== false);
    const snapshotAllowed = enabled && (controls.snapshot !== false);
    const seoAllowed = enabled && (controls.seo !== false) && exposure !== "HIDDEN" && effectiveState === "public";
    const listenerAllowed = enabled && (controls.listener !== false);

    return {
      featureId,
      enabled,
      visible,
      routeAllowed,
      mountAllowed,
      backgroundAllowed,
      snapshotAllowed,
      seoAllowed,
      listenerAllowed,
      directState: direct,
      effectiveState,
      lifecycleState: lifecycle,
      exposure,
      reason,
      missingDependencies: missingDependencies.length > 0 ? missingDependencies : undefined,
      parentOff
    };
  }

  /**
   * Check if a feature is enabled for a given user context
   */
  public evaluate(featureId: string, context?: UserAccessContext): boolean {
    return this.isFeatureEnabled(featureId, context);
  }

  public isFeatureEnabled(featureId: string, context?: UserAccessContext): boolean {
    return this.evaluateFeature(featureId, context).enabled;
  }

  public isFeatureAllowed(featureId: string, context?: UserAccessContext): boolean {
    return this.evaluateFeature(featureId, context).enabled;
  }

  public isRouteAllowed(featureId: string, context?: UserAccessContext): boolean {
    return this.evaluateFeature(featureId, context).routeAllowed;
  }

  public isComponentAllowed(featureId: string, context?: UserAccessContext): boolean {
    return this.evaluateFeature(featureId, context).mountAllowed;
  }

  public isListenerAllowed(featureId: string, context?: UserAccessContext): boolean {
    return this.evaluateFeature(featureId, context).listenerAllowed;
  }

  public isBackgroundAllowed(featureId: string, context?: UserAccessContext): boolean {
    return this.evaluateFeature(featureId, context).backgroundAllowed;
  }

  public isSnapshotAllowed(featureId: string, context?: UserAccessContext): boolean {
    return this.evaluateFeature(featureId, context).snapshotAllowed;
  }

  public isSeoAllowed(featureId: string, context?: UserAccessContext): boolean {
    return this.evaluateFeature(featureId, context).seoAllowed;
  }

  public canFetch(featureId: string, context?: UserAccessContext): boolean {
    return this.evaluateFeature(featureId, context).enabled;
  }

  /**
   * Get registry definition
   */
  public getDefinition(featureId: string): FeatureDefinition | undefined {
    return this.registryMap.get(featureId);
  }

  /**
   * Get all registered features
   */
  public getAllFeatures(): FeatureDefinition[] {
    return CANONICAL_FEATURE_REGISTRY;
  }

  /**
   * Get full current configuration
   */
  public getConfig(): FeatureControlConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Get feature counts summary
   */
  public getSummaryStats() {
    let publicCount = 0;
    let betaCount = 0;
    let adminOnlyCount = 0;
    let offCount = 0;
    let criticalCount = 0;

    CANONICAL_FEATURE_REGISTRY.forEach(item => {
      if (item.critical) criticalCount++;
      const state = this.getEffectiveState(item.id);
      if (state === "public") publicCount++;
      else if (state === "beta") betaCount++;
      else if (state === "admin_only") adminOnlyCount++;
      else offCount++;
    });

    return {
      total: CANONICAL_FEATURE_REGISTRY.length,
      publicCount,
      betaCount,
      adminOnlyCount,
      offCount,
      criticalCount
    };
  }

  // ========================================================
  // ADMINISTRATIVE MUTATIONS (PROTECTED)
  // ========================================================

  /**
   * Update feature state locally and trigger server/Snapshot sync
   */
  public async setFeatureState(
    featureId: string,
    newState: FeatureState,
    actor: { id: string; email?: string; role: string; token?: string },
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const def = this.registryMap.get(featureId);
    if (!def) return { success: false, error: "Feature not recognized" };

    const previousState = this.getDirectState(featureId);
    if (previousState === newState) return { success: true };

    // Prevent turning off critical features without super_admin
    if (def.critical && newState === "off" && actor.role !== "super_admin") {
      return { success: false, error: "Critical features cannot be turned off without Super Admin credentials" };
    }

    const nextVersion = this.config.version + 1;
    const newOverrides = { ...this.config.overrides, [featureId]: newState };

    const auditRecord: FeatureAuditRecord = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      featureId,
      previousState,
      newState,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      timestamp: new Date().toISOString(),
      reason: reason || "Admin feature state toggle",
      configVersion: nextVersion
    };

    const updatedConfig: FeatureControlConfig = {
      version: nextVersion,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.email || actor.id,
      overrides: newOverrides,
      auditTrail: [auditRecord, ...(this.config.auditTrail || []).slice(0, 49)]
    };

    // Apply to local state first
    this.config = updatedConfig;
    this.persistConfigLocally(updatedConfig);
    this.dispatchUpdateEvent();

    if (newState === "off") {
      try {
        listenerRegistry.killByFeature(featureId);
      } catch (err) {
        console.warn("[FEATURE_CONTROL_OS] Listener teardown warning:", err);
      }
    }

    // Sync with backend API
    try {
      const url = resolveApiUrl("/api/admin/features/update");
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(actor.token ? { "Authorization": `Bearer ${actor.token}` } : {})
        },
        body: JSON.stringify({
          featureId,
          newState,
          actor,
          reason,
          fullConfig: updatedConfig
        })
      });

      if (!res.ok) {
        console.warn("[FEATURE_CONTROL_OS] Server update returned status:", res.status);
      }
    } catch (e) {
      console.warn("[FEATURE_CONTROL_OS] Server sync notification failed (relying on local/continuity):", e);
    }

    return { success: true };
  }

  /**
   * Apply rollout preset profile
   */
  public async applyRolloutProfile(
    profileName: RolloutPresetName,
    actor: { id: string; email?: string; role: string; token?: string },
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const profile = ROLLOUT_PROFILES[profileName];
    if (!profile) return { success: false, error: "Unknown rollout profile" };

    const nextVersion = this.config.version + 1;
    const newOverrides = { ...this.config.overrides, ...profile.overrides };

    const auditRecord: FeatureAuditRecord = {
      id: `audit_prof_${Date.now()}`,
      featureId: `preset:${profileName}`,
      previousState: "public",
      newState: "public",
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      timestamp: new Date().toISOString(),
      reason: reason || `Applied rollout preset ${profile.nameEn}`,
      configVersion: nextVersion
    };

    const updatedConfig: FeatureControlConfig = {
      version: nextVersion,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.email || actor.id,
      overrides: newOverrides,
      auditTrail: [auditRecord, ...(this.config.auditTrail || []).slice(0, 49)]
    };

    this.config = updatedConfig;
    this.persistConfigLocally(updatedConfig);
    this.dispatchUpdateEvent();

    Object.entries(newOverrides).forEach(([fId, st]) => {
      if (st === "off") {
        try {
          listenerRegistry.killByFeature(fId);
        } catch (_) {}
      }
    });

    try {
      const url = resolveApiUrl("/api/admin/features/profile");
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(actor.token ? { "Authorization": `Bearer ${actor.token}` } : {})
        },
        body: JSON.stringify({ profileName, actor, reason, fullConfig: updatedConfig })
      });
    } catch (e) {
      console.warn("[FEATURE_CONTROL_OS] Server preset sync error:", e);
    }

    return { success: true };
  }

  /**
   * Reset to compiled defaults
   */
  public async resetToDefaults(
    actor: { id: string; email?: string; role: string; token?: string },
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (actor.role !== "super_admin") {
      return { success: false, error: "Only Super Admin can reset Feature Control to defaults" };
    }

    const defConfig = this.getCompiledDefaultConfig();
    defConfig.version = this.config.version + 1;
    defConfig.updatedAt = new Date().toISOString();
    defConfig.updatedBy = actor.email || actor.id;

    const auditRecord: FeatureAuditRecord = {
      id: `audit_reset_${Date.now()}`,
      featureId: "system:reset_defaults",
      previousState: "public",
      newState: "public",
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      timestamp: new Date().toISOString(),
      reason: reason || "Reset to compiled default states",
      configVersion: defConfig.version
    };

    defConfig.auditTrail = [auditRecord, ...(this.config.auditTrail || []).slice(0, 49)];

    this.config = defConfig;
    this.persistConfigLocally(defConfig);
    this.dispatchUpdateEvent();

    try {
      const url = resolveApiUrl("/api/admin/features/reset");
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(actor.token ? { "Authorization": `Bearer ${actor.token}` } : {})
        },
        body: JSON.stringify({ actor, reason, fullConfig: defConfig })
      });
    } catch (e) {
      console.warn("[FEATURE_CONTROL_OS] Server reset sync error:", e);
    }

    return { success: true };
  }

  /**
   * Export config as JSON string
   */
  public exportConfigJson(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import config JSON
   */
  public async importConfigJson(
    jsonStr: string,
    actor: { id: string; email?: string; role: string; token?: string },
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed.overrides !== "object") {
        return { success: false, error: "Invalid JSON format: missing 'overrides' object" };
      }

      // Check critical features
      for (const [featId, st] of Object.entries(parsed.overrides)) {
        const def = this.registryMap.get(featId);
        if (def && def.critical && st === "off" && actor.role !== "super_admin") {
          return { success: false, error: `Cannot set critical feature ${featId} to 'off' without Super Admin privileges` };
        }
      }

      const nextVersion = (parsed.version || this.config.version) + 1;
      const updated: FeatureControlConfig = {
        version: nextVersion,
        updatedAt: new Date().toISOString(),
        updatedBy: actor.email || actor.id,
        overrides: { ...parsed.overrides },
        auditTrail: [
          {
            id: `audit_import_${Date.now()}`,
            featureId: "system:import_json",
            previousState: "public",
            newState: "public",
            actorId: actor.id,
            actorEmail: actor.email,
            actorRole: actor.role,
            timestamp: new Date().toISOString(),
            reason: reason || "Imported feature configuration JSON",
            configVersion: nextVersion
          },
          ...(this.config.auditTrail || []).slice(0, 49)
        ]
      };

      this.config = updated;
      this.persistConfigLocally(updated);
      this.dispatchUpdateEvent();

      return { success: true };
    } catch (e: any) {
      return { success: false, error: `Import failed: ${e.message}` };
    }
  }

  public subscribe(callback: () => void): () => void {
    if (typeof window === "undefined") return () => {};
    window.addEventListener(EVENT_NAME, callback);
    return () => window.removeEventListener(EVENT_NAME, callback);
  }
}

export const featureControlOS = new FeatureControlOS();
