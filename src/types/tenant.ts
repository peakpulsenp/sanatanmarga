/**
 * SANATANMARGA 5.0 BETA — TENANT OPERATIONS & BOUNDARIES TYPES
 * Phase 3F: Canonical Tenant Registry, Memberships, Multi-Tenant IAM, Workspace Isolation & SEC-05
 */

export type CanonicalTenantStatus = "ACTIVE" | "SUSPENDED" | "DISABLED" | "ARCHIVED";
export type LegacyTenantStatus = "active" | "trial" | "suspended" | "pending_onboarding";
export type TenantStatus = CanonicalTenantStatus | LegacyTenantStatus;

export type CanonicalTenantType = "PLATFORM" | "MEDIA" | "PARTNER" | "INSTITUTION" | "CLIENT";
export type LegacyTenantType = "media" | "school" | "college" | "ngo" | "municipality" | "hospital" | "corporate";
export type TenantType = CanonicalTenantType | LegacyTenantType;

export type CanonicalMembershipStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED";
export type LegacyMembershipStatus = "active" | "inactive" | "suspended";
export type MembershipStatus = CanonicalMembershipStatus | LegacyMembershipStatus;

export interface TenantBranding {
  name?: string;
  primaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  timeZone?: string;
  defaultLanguage?: "ne" | "en" | "hi";
  allowPublicRegistration?: boolean;
}

export interface TenantSettings {
  primaryColor?: string;
  customDomain?: string;
  logoUrl?: string;
  timeZone?: string;
  languageDefault?: "ne" | "en" | "hi" | "np";
  allowPublicRegistration?: boolean;
  general?: Record<string, any>;
  editorial?: {
    allowDraftSubmissions?: boolean;
    requireReviewBeforePublish?: boolean;
    autoGenerateSeo?: boolean;
  };
  community?: {
    moderationLevel?: "STRICT" | "STANDARD" | "RELAXED";
    allowAnonymousReading?: boolean;
  };
  academy?: {
    allowCertificates?: boolean;
    passingScorePercent?: number;
  };
  events?: {
    allowPublicCandidateProposals?: boolean;
  };
  commerce?: {
    currency?: "NPR" | "INR" | "USD";
  };
  notifications?: {
    enablePushAlerts?: boolean;
  };
}

export interface TenantModuleItem {
  id: string;
  name: string;
  enabled: boolean;
  version: string;
}

export interface TenantLimits {
  maxUsers?: number;
  maxStorageBytes?: number;
  maxAiUsage?: number;
}

export interface Tenant {
  id: string; // Canonical identifier (e.g. "sanatan-media")
  slug: string;
  code?: string;
  name: string;
  status: TenantStatus;
  type: TenantType;
  branding?: TenantBranding;
  settings: TenantSettings;
  enabledModules: string[];
  modules?: TenantModuleItem[]; // Legacy backward compatibility
  configurationVersion: number;
  tenantSecurityVersion: number;
  ownerUid?: string;
  ownerEmail?: string;
  ownerName?: string;
  subdomain?: string;
  customDomain?: string;
  limits?: TenantLimits;
  billing?: {
    plan: string;
    monthlyRateNpr?: number;
    status: string;
    nextBillingDate?: string;
  };
  stats?: {
    totalUsers?: number;
    activeArticles?: number;
    mrrNpr?: number;
  };
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface TenantMembership {
  id?: string; // `${tenantId}_${uid}`
  tenantId: string;
  uid: string;
  status: MembershipStatus;
  roles: string[]; // ["tenant_admin", "editor", "contributor", etc.]
  permissions?: string[];
  joinedAt: string;
  updatedAt: string;
  invitedBy?: string;
}

export interface TenantHealth {
  tenantId: string;
  status: "HEALTHY" | "DEGRADED" | "MISCONFIGURED" | "SUSPENDED";
  hasAdmin: boolean;
  activeMembersCount: number;
  orphanMembershipsCount: number;
  invalidModulesCount: number;
  crossTenantReferencesCount: number;
  featureConflictsCount: number;
  configurationVersion: number;
  issues: string[];
  evaluatedAt: string;
}

export interface TenantAuditLog {
  id: string;
  timestamp: string;
  tenantId: string;
  actorUid: string;
  actorRole: string;
  action: string;
  targetUid?: string;
  before?: any;
  after?: any;
  details?: any;
  hash: string;
  previousHash: string;
}

export interface TenantEffectiveContext {
  tenantId: string;
  tenant: Tenant;
  membership?: TenantMembership;
  roles: string[];
  permissions: string[];
  enabledModules: string[];
  isPlatformTenant: boolean;
  isTenantAdmin: boolean;
  isSuperAdmin: boolean;
}

export const PLATFORM_TENANT_ID = "sanatan-media";
export const CANONICAL_TENANT_MODULES = [
  "news",
  "community",
  "academy",
  "knowledge",
  "events",
  "store",
  "media",
  "radio",
  "revenue"
] as const;
