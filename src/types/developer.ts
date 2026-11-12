/**
 * SANATANMARGA 5.0 BETA — PHASE 3G TYPE DEFINITIONS
 * Developer & Infrastructure OS: API Keys, Webhooks, System Diagnostics & Telemetry
 */

export type DeveloperApiKeyScope =
  | "articles:read"
  | "articles:write"
  | "knowledge:query"
  | "community:read"
  | "community:write"
  | "analytics:read"
  | "fcm:push"
  | "webhooks:manage"
  | "telemetry:read"
  | "tenant:manage"
  | "system:diagnostics"
  | "infrastructure:read"
  | "infrastructure:operate"
  | "break_glass";

export interface ScopeRegistryEntry {
  scope: DeveloperApiKeyScope;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  allowedOwnerType: "PLATFORM_ONLY" | "TENANT_ALLOWED";
  requiredCreatorPermission: string;
  description: string;
}

export const CANONICAL_SCOPE_REGISTRY: Record<DeveloperApiKeyScope, ScopeRegistryEntry> = {
  "articles:read": {
    scope: "articles:read",
    riskLevel: "LOW",
    allowedOwnerType: "TENANT_ALLOWED",
    requiredCreatorPermission: "api_keys.create",
    description: "Read public and tenant-bound editorial articles"
  },
  "articles:write": {
    scope: "articles:write",
    riskLevel: "HIGH",
    allowedOwnerType: "TENANT_ALLOWED",
    requiredCreatorPermission: "article.publish",
    description: "Create and publish articles via API"
  },
  "knowledge:query": {
    scope: "knowledge:query",
    riskLevel: "LOW",
    allowedOwnerType: "TENANT_ALLOWED",
    requiredCreatorPermission: "api_keys.create",
    description: "Query knowledge entities and cultural datasets"
  },
  "community:read": {
    scope: "community:read",
    riskLevel: "LOW",
    allowedOwnerType: "TENANT_ALLOWED",
    requiredCreatorPermission: "api_keys.create",
    description: "Read community discussions and Chautari threads"
  },
  "community:write": {
    scope: "community:write",
    riskLevel: "HIGH",
    allowedOwnerType: "TENANT_ALLOWED",
    requiredCreatorPermission: "community.moderate",
    description: "Post messages or moderation signals into Chautari"
  },
  "analytics:read": {
    scope: "analytics:read",
    riskLevel: "LOW",
    allowedOwnerType: "TENANT_ALLOWED",
    requiredCreatorPermission: "api_keys.create",
    description: "Access aggregated readership and tenant metrics"
  },
  "fcm:push": {
    scope: "fcm:push",
    riskLevel: "CRITICAL",
    allowedOwnerType: "PLATFORM_ONLY",
    requiredCreatorPermission: "super_admin",
    description: "Trigger push notifications to client devices"
  },
  "webhooks:manage": {
    scope: "webhooks:manage",
    riskLevel: "HIGH",
    allowedOwnerType: "TENANT_ALLOWED",
    requiredCreatorPermission: "api_keys.create",
    description: "Register and configure outbound webhook endpoints"
  },
  "telemetry:read": {
    scope: "telemetry:read",
    riskLevel: "LOW",
    allowedOwnerType: "TENANT_ALLOWED",
    requiredCreatorPermission: "api_keys.create",
    description: "Read tenant health and latency telemetry"
  },
  "tenant:manage": {
    scope: "tenant:manage",
    riskLevel: "HIGH",
    allowedOwnerType: "TENANT_ALLOWED",
    requiredCreatorPermission: "tenant.manage",
    description: "Modify tenant configuration settings"
  },
  "system:diagnostics": {
    scope: "system:diagnostics",
    riskLevel: "MEDIUM",
    allowedOwnerType: "PLATFORM_ONLY",
    requiredCreatorPermission: "super_admin",
    description: "Run diagnostic system probes and view health scorecards"
  },
  "infrastructure:read": {
    scope: "infrastructure:read",
    riskLevel: "LOW",
    allowedOwnerType: "PLATFORM_ONLY",
    requiredCreatorPermission: "infrastructure.read",
    description: "Observe system infrastructure, R2 object explorer, and health"
  },
  "infrastructure:operate": {
    scope: "infrastructure:operate",
    riskLevel: "HIGH",
    allowedOwnerType: "PLATFORM_ONLY",
    requiredCreatorPermission: "infrastructure.operate",
    description: "Trigger snapshot rebuilds, cache flushes, and operational tasks"
  },
  "break_glass": {
    scope: "break_glass",
    riskLevel: "CRITICAL",
    allowedOwnerType: "PLATFORM_ONLY",
    requiredCreatorPermission: "infrastructure.break_glass",
    description: "Initiate emergency break-glass sessions for restricted operations"
  }
};

export type DeveloperKeyStatus = "ACTIVE" | "SUSPENDED" | "REVOKED" | "EXPIRED";

export interface DeveloperApiKey {
  id: string;
  tenantId: string;
  keyName: string;
  keyPrefix: string; // e.g., "sk_sutra_live_9a8f..."
  secretHash?: string; // Hashed full secret
  scopes: DeveloperApiKeyScope[];
  status: DeveloperKeyStatus;
  rateLimitRpm: number;
  rateLimitDaily: number;
  requestsCountToday: number;
  requestsTotal: number;
  createdAt: string;
  lastUsedAt?: string;
  lastUsedIp?: string;
  expiresAt?: string;
  createdBy: string;
}

export type DeveloperWebhookEvent =
  | "article.published"
  | "article.updated"
  | "tenant.updated"
  | "user.created"
  | "comment.flagged"
  | "event.created"
  | "notification.sent"
  | "system.health_alert"
  | "security.advisory"
  | "knowledge.updated";

export type DeveloperWebhookStatus = "ACTIVE" | "PAUSED" | "DISABLED" | "FAILED_DISABLED";

export interface DeveloperWebhook {
  id: string;
  tenantId: string;
  name: string;
  targetUrl: string;
  secret: string; // HMAC signing secret
  events: DeveloperWebhookEvent[];
  status: DeveloperWebhookStatus;
  failureCount: number;
  lastTriggeredAt?: string;
  lastResponseCode?: number;
  createdAt: string;
  createdBy: string;
}

export type WebhookDeliveryStatus = "PENDING" | "DELIVERED" | "FAILED" | "RETRYING";

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  tenantId: string;
  event: DeveloperWebhookEvent;
  payload: Record<string, any>;
  status: WebhookDeliveryStatus;
  attempts: number;
  maxAttempts: number;
  responseCode?: number;
  responseBody?: string;
  durationMs?: number;
  signature: string;
  scheduledAt: string;
  deliveredAt?: string;
  nextRetryAt?: string;
  error?: string;
}

export type InfrastructureAccessLevel = "OBSERVE" | "OPERATE" | "BREAK_GLASS";

export interface BreakGlassSession {
  id: string;
  actorUid: string;
  reason: string;
  operationClass: string;
  environment: string;
  startedAt: string;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  actionsExecuted: number;
}

export type ComponentHealthStatus = "OK" | "DEGRADED" | "CRITICAL" | "UNREACHABLE" | "CIRCUIT_OPEN" | "UNCONFIGURED";

export interface InfrastructureComponentHealth {
  status: ComponentHealthStatus;
  message: string;
  latencyMs: number;
  details?: Record<string, any>;
}

export interface InfrastructureHealthScorecard {
  overallStatus: "HEALTHY" | "DEGRADED" | "CRITICAL";
  overallScore: number; // 0-100
  timestamp: string;
  components: {
    firestoreGateway: InfrastructureComponentHealth;
    snapshotEngine: InfrastructureComponentHealth;
    r2Storage: InfrastructureComponentHealth;
    fcmPush: InfrastructureComponentHealth;
    featureControl: InfrastructureComponentHealth;
    syncOS: InfrastructureComponentHealth;
    developerOS: InfrastructureComponentHealth;
  };
  metrics: {
    memoryUsageMb: number;
    activeConnections: number;
    uptimeSeconds: number;
    requestsPerMinute: number;
    avgLatencyMs: number;
  };
}

export interface DiagnosticProbeResult {
  probeId: string;
  componentName: string;
  status: "PASS" | "WARN" | "FAIL";
  durationMs: number;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface DeveloperAuditLog {
  id: string;
  tenantId: string;
  actorUid: string;
  action: string;
  resourceId: string;
  ipAddress?: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface R2ClientInventoryItem {
  clientName: string;
  purpose: string;
  bucketVariableName: string;
  endpointVariableName: string;
  publicUrlVariableName: string;
  writeCapability: boolean;
  status: "ACTIVE" | "UNCONFIGURED" | "DEGRADED";
}

export interface R2ObjectExplorerItem {
  key: string;
  sizeBytes: number;
  mimeType: string;
  eTag?: string;
  hashSha256?: string;
  lastModified: string;
  isReferencedInManifest: boolean;
  namespace: string;
}

export interface R2ObjectExplorerListResult {
  objects: R2ObjectExplorerItem[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
  boundedPrefix: string;
}

export interface R2StorageVerificationResult {
  status: "VERIFIED" | "PARTIAL" | "UNVERIFIED";
  verificationMethod: "LIVE_R2_CYCLE" | "LIVE_CYCLE" | "STATIC_PROBE" | "NONE";
  payloadHash?: string;
  roundtripLatencyMs?: number;
  reason?: string;
  timestamp: string;
  steps?: Record<string, { status: "PASS" | "FAIL" | "SKIPPED"; reason?: string; details?: any }>;
}

export interface OpenApiEndpointDoc {
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  summary: string;
  description: string;
  requiredScopes: DeveloperApiKeyScope[];
  parameters?: Array<{ name: string; in: "query" | "path" | "header"; required: boolean; type: string; description: string }>;
  requestBodyExample?: Record<string, any>;
  responseExample: Record<string, any>;
}
