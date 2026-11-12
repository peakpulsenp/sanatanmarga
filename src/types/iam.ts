/**
 * SANATANMARGA 5.0 BETA — USERS, IAM & PROFILE OPERATIONS TYPES
 * Phase 3E: Canonical Identity, Multi-Role & Permissions Matrix, Session Operations, Field Mutation Policy
 */

import { UserRole } from "./index";

export type UserAccountStatus = 
  | "ACTIVE" 
  | "SUSPENDED" 
  | "DISABLED" 
  | "BANNED" 
  | "PENDING" 
  | "DELETED";

export type FieldMutationClass = 
  | "USER_EDITABLE" 
  | "ADMIN_EDITABLE" 
  | "SECURITY_ONLY" 
  | "SYSTEM_MANAGED" 
  | "IMMUTABLE";

export interface FieldMutationPolicy {
  fieldName: string;
  mutationClass: FieldMutationClass;
  allowedRoles?: UserRole[];
  description: string;
}

import type { TenantMembership } from "./tenant";
export type { TenantMembership };

export interface UserSession {
  sessionId: string;
  uid: string;
  createdAt: string;
  lastSeenAt: string;
  revokedAt?: string;
  deviceClass?: "desktop" | "mobile" | "tablet" | "unknown";
  clientLabel?: string;
  ipSummary?: string;
  userAgentSummary?: string;
  securityVersion: number;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  categories?: string[];
  digest?: "instant" | "daily" | "weekly" | "off";
  breakingNews?: boolean;
}

export interface ModerationState {
  warningsCount: number;
  lastWarningAt?: string;
  moderationNotes?: string;
  isRestrictedFromCommunity?: boolean;
}

export interface UserAccount {
  uid: string;
  email?: string;
  displayName?: string;
  avatar?: string;
  photoURL?: string;
  status: UserAccountStatus;
  primaryLanguage?: "ne" | "en" | "hi";
  createdAt: string;
  updatedAt: string;
  lastSeenAt?: string;
  profileVersion: number;
  securityVersion: number;
  
  // Security & IAM Authority
  role: UserRole;
  roles?: UserRole[];
  customPermissions?: string[];
  tenantId?: string;
  tenantMemberships?: Record<string, TenantMembership>;
  
  // Profile Information
  bio?: string;
  district?: string;
  location?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  publicProfileVisibility?: "PUBLIC" | "MEMBERS_ONLY" | "PRIVATE";
  
  // Integrated OS pointers
  notificationPreferences?: NotificationPreferences;
  moderationState?: ModerationState;
}

export interface ClientCapabilityProjection {
  canView: boolean;
  canEdit: boolean;
  canPublish: boolean;
  canDelete: boolean;
  canModerate: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManageSettings: boolean;
  canManageRevenue: boolean;
  canVerifySGIS: boolean;
  canManageAcademy: boolean;
  _source: "UX_HINT_ONLY";
}

export interface EffectivePermissionsResult {
  uid: string;
  roles: string[];
  permissions: string[];
  tenantId?: string;
  securityVersion: number;
  status: UserAccountStatus;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  capabilities: ClientCapabilityProjection;
  evaluatedAt: string;
}

export interface CanonicalPermissionItem {
  key: string;
  domain: "news" | "media" | "live" | "radio" | "revenue" | "community" | "users" | "roles" | "governance" | "events" | "sgis" | "academy";
  description: string;
  scope: "global" | "tenant" | "resource";
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const CANONICAL_FIELD_POLICIES: Record<string, FieldMutationClass> = {
  // USER_EDITABLE
  displayName: "USER_EDITABLE",
  avatar: "USER_EDITABLE",
  photoURL: "USER_EDITABLE",
  bio: "USER_EDITABLE",
  district: "USER_EDITABLE",
  location: "USER_EDITABLE",
  website: "USER_EDITABLE",
  socialLinks: "USER_EDITABLE",
  primaryLanguage: "USER_EDITABLE",
  publicProfileVisibility: "USER_EDITABLE",
  notificationPreferences: "USER_EDITABLE",
  
  // ADMIN_EDITABLE
  status: "ADMIN_EDITABLE",
  moderationState: "ADMIN_EDITABLE",
  tenantMemberships: "ADMIN_EDITABLE",
  
  // SECURITY_ONLY
  role: "SECURITY_ONLY",
  roles: "SECURITY_ONLY",
  customPermissions: "SECURITY_ONLY",
  securityVersion: "SECURITY_ONLY",
  
  // SYSTEM_MANAGED
  createdAt: "SYSTEM_MANAGED",
  updatedAt: "SYSTEM_MANAGED",
  lastSeenAt: "SYSTEM_MANAGED",
  profileVersion: "SYSTEM_MANAGED",
  
  // IMMUTABLE
  uid: "IMMUTABLE",
  email: "IMMUTABLE"
};

// --- EXPLICIT IAM & PROFILE PROJECTIONS ---

export interface PublicUserProfile {
  uid: string;
  displayName: string;
  avatar?: string;
  photoURL?: string;
  bio?: string;
  district?: string;
  location?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  primaryLanguage?: "ne" | "en" | "hi";
  publicProfileVisibility?: "PUBLIC" | "MEMBERS_ONLY" | "PRIVATE";
  createdAt: string;
}

export interface PrivateUserProfile extends PublicUserProfile {
  email?: string;
  notificationPreferences?: NotificationPreferences;
  updatedAt: string;
  profileVersion: number;
}

export interface UserSecurityState {
  uid: string;
  role: UserRole;
  roles?: UserRole[];
  status: UserAccountStatus;
  securityVersion: number;
  activeSessionsCount: number;
  lastSeenAt?: string;
  customPermissionsCount: number;
  tenantId?: string;
}

export interface AdminUserSummary {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  status: UserAccountStatus;
  createdAt: string;
  lastSeenAt?: string;
  securityVersion: number;
  tenantId?: string;
}

export type EffectivePermissionProjection = EffectivePermissionsResult;

// --- IAM STORAGE ABSTRACTION INTERFACE ---

export type IamStoreMode = "FIRESTORE_CANONICAL" | "LOCAL_FALLBACK" | "TEST_MOCK";

export interface IIamStore {
  readonly mode: IamStoreMode;
  loadUsers(): Promise<UserAccount[]> | UserAccount[];
  saveUsers(users: UserAccount[]): Promise<void> | void;
  loadSessions(): Promise<UserSession[]> | UserSession[];
  saveSessions(sessions: UserSession[]): Promise<void> | void;
  loadAuditLogs(): Promise<any[]> | any[];
  saveAuditLogs(logs: any[]): Promise<void> | void;
  getUser(uid: string): Promise<UserAccount | null> | UserAccount | null;
  saveUser(user: UserAccount): Promise<void> | void;
  updateUserAtomic?(
    uid: string,
    mutateFn: (user: UserAccount) => Partial<UserAccount>,
    expectedSecurityVersion?: number
  ): Promise<{ success: boolean; user?: UserAccount; error?: string }>;
}

