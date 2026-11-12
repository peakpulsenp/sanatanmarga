/**
 * SANATANMARGA 4.2.7 — FEATURE CONTROL OS v1
 * React Integration: Provider, Hooks, FeatureGate & RouteFeatureGuard
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { featureControlOS, UserAccessContext } from "@/src/services/featureControlOS";
import { FeatureDefinition, FeatureState, FeatureEvaluation } from "@/src/config/featureRegistry";
import { useAuth } from "@/src/lib/auth";

interface FeatureControlContextType {
  version: number;
  isFeatureEnabled: (featureId: string) => boolean;
  evaluateFeature: (featureId: string) => FeatureEvaluation;
  isRouteAllowed: (featureId: string) => boolean;
  isComponentAllowed: (featureId: string) => boolean;
  canFetch: (featureId: string) => boolean;
  getEffectiveState: (featureId: string) => FeatureState;
  getDirectState: (featureId: string) => FeatureState;
  getDefinition: (featureId: string) => FeatureDefinition | undefined;
  getAllFeatures: () => FeatureDefinition[];
  setFeatureState: (
    featureId: string,
    newState: FeatureState,
    reason?: string
  ) => Promise<{ success: boolean; error?: string }>;
  applyRolloutProfile: (
    profileName: any,
    reason?: string
  ) => Promise<{ success: boolean; error?: string }>;
  resetToDefaults: (reason?: string) => Promise<{ success: boolean; error?: string }>;
  importConfigJson: (json: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  exportConfigJson: () => string;
  getSummaryStats: () => any;
  userContext: UserAccessContext;
}

const FeatureControlContext = createContext<FeatureControlContextType | null>(null);

export function FeatureControlProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [version, setVersion] = useState<number>(() => featureControlOS.getConfig().version);

  // Sync when feature-control-updated event fires
  useEffect(() => {
    const unsub = featureControlOS.subscribe(() => {
      setVersion(featureControlOS.getConfig().version);
    });
    return unsub;
  }, []);

  const userContext: UserAccessContext = useMemo(() => {
    return {
      role: user?.role || null,
      email: user?.email || null,
      uid: user?.uid || null,
      isBetaUser: (user as any)?.isBetaUser || false,
      previewMode: false
    };
  }, [user]);

  const value: FeatureControlContextType = useMemo(() => {
    return {
      version,
      isFeatureEnabled: (featureId: string) => featureControlOS.isFeatureEnabled(featureId, userContext),
      evaluateFeature: (featureId: string) => featureControlOS.evaluateFeature(featureId, userContext),
      isRouteAllowed: (featureId: string) => featureControlOS.isRouteAllowed(featureId, userContext),
      isComponentAllowed: (featureId: string) => featureControlOS.isComponentAllowed(featureId, userContext),
      canFetch: (featureId: string) => featureControlOS.canFetch(featureId, userContext),
      getEffectiveState: (featureId: string) => featureControlOS.getEffectiveState(featureId),
      getDirectState: (featureId: string) => featureControlOS.getDirectState(featureId),
      getDefinition: (featureId: string) => featureControlOS.getDefinition(featureId),
      getAllFeatures: () => featureControlOS.getAllFeatures(),
      setFeatureState: async (featureId: string, newState: FeatureState, reason?: string) => {
        const token = user ? await (user as any).getIdToken?.() : undefined;
        return featureControlOS.setFeatureState(
          featureId,
          newState,
          {
            id: user?.uid || "anon_admin",
            email: user?.email || undefined,
            role: user?.role || "admin",
            token
          },
          reason
        );
      },
      applyRolloutProfile: async (profileName: any, reason?: string) => {
        const token = user ? await (user as any).getIdToken?.() : undefined;
        return featureControlOS.applyRolloutProfile(
          profileName,
          {
            id: user?.uid || "anon_admin",
            email: user?.email || undefined,
            role: user?.role || "admin",
            token
          },
          reason
        );
      },
      resetToDefaults: async (reason?: string) => {
        const token = user ? await (user as any).getIdToken?.() : undefined;
        return featureControlOS.resetToDefaults(
          {
            id: user?.uid || "anon_admin",
            email: user?.email || undefined,
            role: user?.role || "admin",
            token
          },
          reason
        );
      },
      importConfigJson: async (json: string, reason?: string) => {
        const token = user ? await (user as any).getIdToken?.() : undefined;
        return featureControlOS.importConfigJson(
          json,
          {
            id: user?.uid || "anon_admin",
            email: user?.email || undefined,
            role: user?.role || "admin",
            token
          },
          reason
        );
      },
      exportConfigJson: () => featureControlOS.exportConfigJson(),
      getSummaryStats: () => featureControlOS.getSummaryStats(),
      userContext
    };
  }, [version, userContext, user]);

  return (
    <FeatureControlContext.Provider value={value}>
      {children}
    </FeatureControlContext.Provider>
  );
}

export function useFeatureControl() {
  const ctx = useContext(FeatureControlContext);
  if (!ctx) {
    // Graceful fallback outside provider
    return {
      version: 1,
      isFeatureEnabled: (id: string) => featureControlOS.isFeatureEnabled(id),
      evaluateFeature: (id: string) => featureControlOS.evaluateFeature(id),
      isRouteAllowed: (id: string) => featureControlOS.isRouteAllowed(id),
      isComponentAllowed: (id: string) => featureControlOS.isComponentAllowed(id),
      canFetch: (id: string) => featureControlOS.canFetch(id),
      getEffectiveState: (id: string) => featureControlOS.getEffectiveState(id),
      getDirectState: (id: string) => featureControlOS.getDirectState(id),
      getDefinition: (id: string) => featureControlOS.getDefinition(id),
      getAllFeatures: () => featureControlOS.getAllFeatures(),
      setFeatureState: async () => ({ success: false, error: "FeatureControlProvider not mounted" }),
      applyRolloutProfile: async () => ({ success: false, error: "FeatureControlProvider not mounted" }),
      resetToDefaults: async () => ({ success: false, error: "FeatureControlProvider not mounted" }),
      importConfigJson: async () => ({ success: false, error: "FeatureControlProvider not mounted" }),
      exportConfigJson: () => featureControlOS.exportConfigJson(),
      getSummaryStats: () => featureControlOS.getSummaryStats(),
      userContext: {}
    };
  }
  return ctx;
}

export function useFeature(featureId: string): boolean {
  const { isFeatureEnabled } = useFeatureControl();
  return isFeatureEnabled(featureId);
}

/**
 * React Component Gate
 * Strictly blocks mounting and child execution if component is not allowed.
 */
export function FeatureGate({
  feature,
  children,
  fallback = null
}: {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { evaluateFeature } = useFeatureControl();
  const evaluation = evaluateFeature(feature);
  if (!evaluation.mountAllowed) return <>{fallback}</>;
  return <>{children}</>;
}

/**
 * Route Feature Guard
 * Blocks route navigation and completely prevents mounting if route is not allowed.
 */
export function RouteFeatureGuard({
  feature,
  children,
  fallbackPath = "/",
  fallback = null
}: {
  feature: string;
  children: React.ReactNode;
  fallbackPath?: string;
  fallback?: React.ReactNode;
}) {
  const { evaluateFeature } = useFeatureControl();
  const evaluation = evaluateFeature(feature);
  const location = useLocation();

  if (!evaluation.routeAllowed) {
    console.warn(`[ROUTE_GUARD] Feature '${feature}' route blocked (${evaluation.reason}). Redirecting from ${location.pathname} to ${fallbackPath}`);
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={fallbackPath} replace state={{ from: location, blockedFeature: feature }} />;
  }

  return <>{children}</>;
}
