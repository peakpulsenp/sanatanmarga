/**
 * SANATANMARGA 5.0 BETA — CLIENT DEVELOPER & INFRASTRUCTURE OS SERVICE
 * Phase 3G: Developer API Platform, Webhooks, Telemetry & Diagnostics Client Interface
 */

import {
  DeveloperApiKey,
  DeveloperApiKeyScope,
  DeveloperWebhook,
  DeveloperWebhookEvent,
  WebhookDeliveryLog,
  InfrastructureHealthScorecard,
  DiagnosticProbeResult,
  DeveloperAuditLog,
  OpenApiEndpointDoc
} from "../types/developer";

export class ClientDeveloperOS {
  /**
   * List API keys for tenant workspace
   */
  async getApiKeys(tenantId: string): Promise<{ success: boolean; apiKeys: DeveloperApiKey[]; error?: string }> {
    try {
      const res = await fetch(`/api/developer/keys?tenantId=${encodeURIComponent(tenantId)}`, {
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, apiKeys: [], error: err.error || `HTTP ${res.status}` };
      }
      const data = await res.json();
      return { success: true, apiKeys: data.apiKeys || [] };
    } catch (e: any) {
      return { success: false, apiKeys: [], error: e.message || "Failed connecting to developer API" };
    }
  }

  /**
   * Create a new API Key for tenant
   */
  async createApiKey(
    tenantId: string,
    params: { name: string; scopes: DeveloperApiKeyScope[]; rateLimitRpm?: number; rateLimitDaily?: number }
  ): Promise<{ success: boolean; apiKey?: DeveloperApiKey; rawSecret?: string; error?: string }> {
    try {
      const res = await fetch("/api/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, ...params })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed creating API Key" };
      }
      return { success: true, apiKey: data.apiKey, rawSecret: data.rawSecret };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error creating API key" };
    }
  }

  /**
   * Revoke an active API key
   */
  async revokeApiKey(tenantId: string, keyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/developer/keys/${encodeURIComponent(keyId)}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed revoking API key" };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error revoking API key" };
    }
  }

  /**
   * Rotate an API key (Revokes old key, creates fresh key)
   */
  async rotateApiKey(
    tenantId: string,
    keyId: string
  ): Promise<{ success: boolean; newApiKey?: DeveloperApiKey; newRawSecret?: string; error?: string }> {
    try {
      const res = await fetch(`/api/developer/keys/${encodeURIComponent(keyId)}/rotate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed rotating API key" };
      }
      return { success: true, newApiKey: data.newApiKey, newRawSecret: data.newRawSecret };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error rotating API key" };
    }
  }

  /**
   * List Webhooks for tenant
   */
  async getWebhooks(tenantId: string): Promise<{ success: boolean; webhooks: DeveloperWebhook[]; error?: string }> {
    try {
      const res = await fetch(`/api/developer/webhooks?tenantId=${encodeURIComponent(tenantId)}`, {
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, webhooks: [], error: err.error || `HTTP ${res.status}` };
      }
      const data = await res.json();
      return { success: true, webhooks: data.webhooks || [] };
    } catch (e: any) {
      return { success: false, webhooks: [], error: e.message || "Failed fetching webhooks" };
    }
  }

  /**
   * Create new Webhook configuration
   */
  async createWebhook(
    tenantId: string,
    params: { name: string; targetUrl: string; events: DeveloperWebhookEvent[]; secret?: string }
  ): Promise<{ success: boolean; webhook?: DeveloperWebhook; error?: string }> {
    try {
      const res = await fetch("/api/developer/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, ...params })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed creating webhook" };
      }
      return { success: true, webhook: data.webhook };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error creating webhook" };
    }
  }

  /**
   * Delete Webhook configuration
   */
  async deleteWebhook(tenantId: string, webhookId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/developer/webhooks/${encodeURIComponent(webhookId)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed deleting webhook" };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error deleting webhook" };
    }
  }

  /**
   * Get Infrastructure Health Scorecard
   */
  async getHealthScorecard(): Promise<{ success: boolean; scorecard?: InfrastructureHealthScorecard; error?: string }> {
    try {
      const res = await fetch("/api/developer/health", {
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}` };
      }
      const data = await res.json();
      return { success: true, scorecard: data.scorecard || data };
    } catch (e: any) {
      return { success: false, error: e.message || "Failed fetching health scorecard" };
    }
  }

  /**
   * Run System Diagnostic Probes
   */
  async runDiagnosticProbes(): Promise<{ success: boolean; probes: DiagnosticProbeResult[]; error?: string }> {
    try {
      const res = await fetch("/api/developer/diagnostics/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, probes: [], error: data.error || "Failed running diagnostic probes" };
      }
      return { success: true, probes: data.probes || [] };
    } catch (e: any) {
      return { success: false, probes: [], error: e.message || "Network error running diagnostic probes" };
    }
  }

  /**
   * Fetch OpenAPI 3.0 Documentation Schema
   */
  async getOpenApiSchema(): Promise<{ success: boolean; schema?: any; error?: string }> {
    try {
      const res = await fetch("/api/developer/docs", {
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}` };
      }
      const data = await res.json();
      return { success: true, schema: data };
    } catch (e: any) {
      return { success: false, error: e.message || "Failed loading OpenAPI schema" };
    }
  }

  /**
   * Fetch Developer Audit Logs for tenant
   */
  async getAuditLogs(tenantId: string): Promise<{ success: boolean; logs: DeveloperAuditLog[]; error?: string }> {
    try {
      const res = await fetch(`/api/developer/audit?tenantId=${encodeURIComponent(tenantId)}`, {
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) {
        return { success: false, logs: [], error: `HTTP ${res.status}` };
      }
      const data = await res.json();
      return { success: true, logs: data.logs || [] };
    } catch (e: any) {
      return { success: false, logs: [], error: e.message || "Failed loading developer audit logs" };
    }
  }
}

export const clientDeveloperOS = new ClientDeveloperOS();
