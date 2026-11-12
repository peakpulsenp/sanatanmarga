/**
 * SANATANMARGA 5.0 BETA — CANONICAL DESTINATION RESOLVER
 * Phase 3A: Single Source of Truth for Notification Deep-Link Resolution
 *
 * MANDATORY REQUIREMENT:
 * Every notification MUST resolve to its exact canonical destination.
 * A missing or unavailable destination MUST gracefully resolve to /target-unavailable
 * with explicit reason codes, NEVER falling back blindly to /latest or /news.
 */

import {
  NotificationEntityType,
  CanonicalDestinationResult,
  NotificationTargetValidationStatus
} from "../types/notifications";

export interface DestinationResolutionParams {
  entityType: NotificationEntityType | string;
  entityId: string;
  metadata?: Record<string, any>;
  tenantId?: string;
  featureFlags?: Record<string, boolean>;
}

export interface ValidationContext {
  articles?: Record<string, any>;
  categories?: Record<string, any>;
  events?: Record<string, any>;
  knowledge?: Record<string, any>;
  features?: Record<string, boolean>;
  userRole?: string;
  userId?: string;
}

/**
 * Deterministic mapping of entity types to URL generators
 */
const CANONICAL_PATH_PATTERNS: Record<
  NotificationEntityType,
  (id: string, meta?: Record<string, any>) => string
> = {
  article: (id) => `/article/${encodeURIComponent(id)}`,
  blog_post: (id) => `/blog/${encodeURIComponent(id)}`,
  chautari_post: (id) => `/chautari/post/${encodeURIComponent(id)}`,
  chautari_thread: (id) => `/chautari/thread/${encodeURIComponent(id)}`,
  chautari_group: (id) => `/chautari/group/${encodeURIComponent(id)}`,
  nepal_hub: () => `/nepal-hub`,
  nepal_hub_update: (id) => (id && id !== "overview" ? `/nepal-hub/update/${encodeURIComponent(id)}` : `/nepal-hub`),
  event: (id) => `/event/${encodeURIComponent(id)}`,
  academy_course: (id) => `/academy/course/${encodeURIComponent(id)}`,
  training_track: (id) => `/academy/track/${encodeURIComponent(id)}`,
  glamour_album: (id) => `/glamour/${encodeURIComponent(id)}`,
  knowledge_entity: (id) => `/knowledge/${encodeURIComponent(id)}`,
  live_dispatch: (id) => `/live/${encodeURIComponent(id)}`,
  comment: (id, meta) => {
    const parentType = meta?.parentEntityType || "article";
    const parentId = meta?.parentEntityId || id;
    const parentPath = parentType === "chautari_post" 
      ? `/chautari/post/${encodeURIComponent(parentId)}` 
      : `/article/${encodeURIComponent(parentId)}`;
    return `${parentPath}#comment-${encodeURIComponent(id)}`;
  },
  admin_review_item: (id) => `/admin/review/${encodeURIComponent(id)}`,
  admin_backup_drill: (id) => `/admin/recovery/drill/${encodeURIComponent(id)}`,
  admin_feature_control: (id) => (id ? `/admin/feature-control?feature=${encodeURIComponent(id)}` : `/admin/feature-control`),
  security_advisory: (id) => `/security/advisories/${encodeURIComponent(id)}`,
  system_announcement: (id) => `/announcements/${encodeURIComponent(id)}`
};

/**
 * Resolves any notification entity to its exact canonical destination URL.
 */
export function resolveCanonicalDestination(
  params: DestinationResolutionParams
): CanonicalDestinationResult {
  const { entityType, entityId, metadata } = params;

  if (!entityType) {
    return {
      status: "INVALID_TARGET",
      canonicalUrl: `/target-unavailable?reason=INVALID_TARGET&entityType=unknown`,
      entityType: "system_announcement",
      entityId: "",
      reason: "Entity type is missing or undefined."
    };
  }

  const normalizedType = entityType.toLowerCase() as NotificationEntityType;
  const generator = CANONICAL_PATH_PATTERNS[normalizedType];

  if (!generator) {
    return {
      status: "INVALID_TARGET",
      canonicalUrl: `/target-unavailable?reason=INVALID_TARGET&entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId || "")}`,
      entityType: normalizedType,
      entityId: entityId || "",
      reason: `Unknown entity type: ${entityType}`
    };
  }

  if (!entityId && normalizedType !== "nepal_hub" && normalizedType !== "admin_feature_control") {
    return {
      status: "INVALID_TARGET",
      canonicalUrl: `/target-unavailable?reason=INVALID_TARGET&entityType=${encodeURIComponent(normalizedType)}`,
      entityType: normalizedType,
      entityId: "",
      reason: `Entity ID is required for type '${normalizedType}'.`
    };
  }

  const canonicalUrl = generator(entityId || "", metadata);

  return {
    status: "VALID",
    canonicalUrl,
    entityType: normalizedType,
    entityId: entityId || "",
    fallbackAvailable: false
  };
}

/**
 * Validates whether a target entity is accessible and exists in context or snapshot
 */
export function validateNotificationTarget(
  target: { entityType: NotificationEntityType; entityId: string },
  context?: ValidationContext
): {
  status: NotificationTargetValidationStatus;
  reason?: string;
  suggestedFallbackUrl?: string;
} {
  const { entityType, entityId } = target;

  if (!entityId && entityType !== "nepal_hub") {
    return {
      status: "INVALID_TARGET",
      reason: "Entity ID is missing.",
      suggestedFallbackUrl: "/target-unavailable?reason=INVALID_TARGET"
    };
  }

  // Feature flag check
  if (context?.features) {
    const featureKey = mapEntityToFeatureKey(entityType);
    if (featureKey && context.features[featureKey] === false) {
      return {
        status: "FEATURE_DISABLED",
        reason: `Feature module '${featureKey}' is currently disabled by administrator.`,
        suggestedFallbackUrl: `/target-unavailable?reason=FEATURE_DISABLED&feature=${featureKey}`
      };
    }
  }

  // Article existence check
  if (entityType === "article" && context?.articles) {
    const article = context.articles[entityId];
    if (!article) {
      return {
        status: "TARGET_NOT_FOUND",
        reason: `Article '${entityId}' not found in canonical registry.`,
        suggestedFallbackUrl: `/target-unavailable?reason=TARGET_NOT_FOUND&entityType=article&entityId=${encodeURIComponent(entityId)}`
      };
    }
    if (article.isDeleted || article.status === "deleted") {
      return {
        status: "ENTITY_DELETED",
        reason: `Article '${entityId}' has been deleted or archived.`,
        suggestedFallbackUrl: `/target-unavailable?reason=ENTITY_DELETED&entityType=article&entityId=${encodeURIComponent(entityId)}`
      };
    }
  }

  return {
    status: "VALID"
  };
}

function mapEntityToFeatureKey(entityType: NotificationEntityType): string | null {
  switch (entityType) {
    case "academy_course":
    case "training_track":
      return "academy";
    case "glamour_album":
      return "glamour";
    case "chautari_post":
    case "chautari_thread":
    case "chautari_group":
      return "chautari";
    case "knowledge_entity":
      return "knowledgeGraph";
    case "live_dispatch":
      return "liveNews";
    case "nepal_hub":
    case "nepal_hub_update":
      return "nepalHub";
    default:
      return null;
  }
}
