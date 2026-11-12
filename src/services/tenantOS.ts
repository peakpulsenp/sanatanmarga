/**
 * SANATANMARGA 5.0 BETA — CLIENT TENANT OS SERVICE
 * Phase 3F: Workspace Switching, Module Entitlement & Cache Partitioning
 */

import { Tenant, TenantMembership, PLATFORM_TENANT_ID, CANONICAL_TENANT_MODULES } from "@/src/types/tenant";

export const DEFAULT_PLATFORM_TENANT: Tenant = {
  id: PLATFORM_TENANT_ID,
  slug: "sanatan-media",
  code: "SANATAN_MEDIA",
  name: "सनातन मिडिया मुख्य कार्यालय (Sanatan Media Core)",
  status: "ACTIVE",
  type: "PLATFORM",
  branding: {
    name: "Sanatan Marga",
    primaryColor: "#d97706",
    logoUrl: "/logo.svg",
    defaultLanguage: "ne",
    timeZone: "Asia/Kathmandu",
    allowPublicRegistration: true
  },
  settings: {
    primaryColor: "#d97706",
    logoUrl: "/logo.svg",
    timeZone: "Asia/Kathmandu",
    languageDefault: "ne",
    allowPublicRegistration: true
  },
  enabledModules: [...CANONICAL_TENANT_MODULES],
  configurationVersion: 1,
  tenantSecurityVersion: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export class ClientTenantOS {
  private activeTenantId: string = PLATFORM_TENANT_ID;
  private memoryCache: Map<string, any> = new Map();

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sutra_active_tenant_id");
      if (saved) {
        this.activeTenantId = saved;
      }
    }
  }

  public getActiveTenantId(): string {
    return this.activeTenantId;
  }

  public setActiveTenantId(tenantId: string) {
    this.activeTenantId = tenantId;
    if (typeof window !== "undefined") {
      localStorage.setItem("sutra_active_tenant_id", tenantId);
    }
  }

  public getPartitionedCacheKey(uid: string, tenantId: string, resourceKey: string): string {
    return `tenant_cache_${tenantId}_${uid}_${resourceKey}`;
  }

  public setPartitionedData(uid: string, tenantId: string, resourceKey: string, data: any): void {
    const key = this.getPartitionedCacheKey(uid, tenantId, resourceKey);
    this.memoryCache.set(key, data);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(key, JSON.stringify(data));
      } catch (e) {}
    }
  }

  public getPartitionedData(uid: string, tenantId: string, resourceKey: string): any | null {
    const key = this.getPartitionedCacheKey(uid, tenantId, resourceKey);
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem(key);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
    }
    return null;
  }

  public clearTenantPrivateCache(tenantId: string): void {
    const prefix = `tenant_cache_${tenantId}_`;
    for (const k of Array.from(this.memoryCache.keys())) {
      if (k.startsWith(prefix)) {
        this.memoryCache.delete(k);
      }
    }
    if (typeof window !== "undefined") {
      try {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith(prefix)) {
            sessionStorage.removeItem(k);
          }
        }
      } catch (e) {}
    }
  }

  public isModuleEnabled(tenant: Tenant | undefined, moduleId: string): boolean {
    if (!tenant) return false;
    if (Array.isArray(tenant.enabledModules)) {
      return tenant.enabledModules.includes(moduleId);
    }
    if (Array.isArray(tenant.modules)) {
      const found = tenant.modules.find(m => m.id === moduleId);
      return found ? found.enabled : false;
    }
    return false;
  }
}

export const clientTenantOS = new ClientTenantOS();
