/**
 * SANATANMARGA 5.0 BETA — NOTIFICATIONS OS CANONICAL TYPES
 * Phase 3A: Canonical Destinations, Public/Private Segregation, Push & Device Registry, Exact Deep-Linking
 */

export type NotificationEntityType =
  | "article"
  | "blog_post"
  | "chautari_post"
  | "chautari_thread"
  | "chautari_group"
  | "nepal_hub"
  | "nepal_hub_update"
  | "event"
  | "academy_course"
  | "training_track"
  | "glamour_album"
  | "knowledge_entity"
  | "live_dispatch"
  | "comment"
  | "admin_review_item"
  | "admin_backup_drill"
  | "admin_feature_control"
  | "security_advisory"
  | "system_announcement";

export type NotificationDeliveryChannel = "in_app" | "web_push" | "email_digest";

export type NotificationPriority = "low" | "normal" | "high" | "critical";

export type NotificationVisibility = "public_announcement" | "private_user" | "role_restricted";

export type NotificationTargetValidationStatus =
  | "VALID"
  | "ENTITY_DELETED"
  | "FEATURE_DISABLED"
  | "TARGET_NOT_FOUND"
  | "UNAUTHORIZED"
  | "INVALID_TARGET";

export interface CanonicalDestinationResult {
  status: NotificationTargetValidationStatus;
  canonicalUrl: string;
  entityType: NotificationEntityType;
  entityId: string;
  reason?: string;
  fallbackAvailable?: boolean;
  alternativeSuggestions?: { title: string; url: string }[];
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  entityType: NotificationEntityType;
  entityId: string;
  canonicalUrl: string;
  imageUrl?: string;
  badgeUrl?: string;
  iconUrl?: string;
  priority: NotificationPriority;
  visibility: NotificationVisibility;
  channels: NotificationDeliveryChannel[];
  recipientUserId?: string;
  targetRoles?: string[];
  tenantId?: string;
  isPublicAnnouncement: boolean;
  isRead: boolean;
  readAt?: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  dedupeKey?: string;
  metadata?: Record<string, any>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  url: string;
  icon?: string;
}

export interface PushDeviceRegistration {
  registrationId: string;
  userId?: string;
  tenantId?: string;
  deviceToken: string;
  platform: "web" | "android" | "ios";
  userAgent?: string;
  topics: string[];
  registeredAt: string;
  lastActiveAt: string;
  status: "active" | "inactive" | "unregistered";
}

export interface NotificationFilterOptions {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  entityType?: NotificationEntityType;
  visibility?: NotificationVisibility;
  since?: string;
}

export interface NotificationInboxResponse {
  items: NotificationItem[];
  unreadCount: number;
  totalCount: number;
  hasMore: boolean;
  lastEvaluatedTimestamp?: string;
}

export interface NotificationDispatchPayload {
  title: string;
  body: string;
  entityType: NotificationEntityType;
  entityId: string;
  recipientUserId?: string;
  targetRoles?: string[];
  tenantId?: string;
  isPublicAnnouncement?: boolean;
  channels?: NotificationDeliveryChannel[];
  priority?: NotificationPriority;
  imageUrl?: string;
  metadata?: Record<string, any>;
  actions?: NotificationAction[];
  dedupeKey?: string;
}

export interface NotificationDispatchResult {
  success: boolean;
  notificationId?: string;
  canonicalUrl: string;
  dispatchedChannels: NotificationDeliveryChannel[];
  pushRecipientCount?: number;
  error?: string;
}

export interface NotificationHealthTelemetry {
  status: "healthy" | "degraded" | "failing";
  metrics: {
    totalDispatched: number;
    publicAnnouncementsCount: number;
    activeRegisteredDevices: number;
    webPushDeliverySuccessRate: number;
    canonicalResolutionSuccessRate: number;
    avgDeliveryLatencyMs: number;
    lastDispatchedAt?: string;
  };
  storageStatus: {
    snapshotAnnouncementsCached: boolean;
    deviceRegistryActive: boolean;
    circuitBreakerOpen: boolean;
  };
}
