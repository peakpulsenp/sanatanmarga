import type { Notification, NotificationTargetType } from "@/src/types";
import { resolveCanonicalDestination, validateNotificationTarget } from "@/src/services/canonicalDestinationResolver";
import { continuityEngine } from "@/src/lib/continuityEngine";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { toast } from "sonner";

export interface ResolvedNotificationRoute {
  path: string;
  targetType: NotificationTargetType;
  entityId?: string;
  isExternal: boolean;
  isFallback?: boolean;
}

/**
 * Single Canonical Source of Truth for Notification Deep-Link Resolution (Notifications OS 5.0).
 *
 * Guaranteed exact mapping across all 20+ entity types:
 * - article          -> /article/:id
 * - blog_post        -> /blog/:id
 * - chautari_post    -> /chautari/post/:id
 * - chautari_thread  -> /chautari/thread/:id
 * - chautari_group   -> /chautari/group/:id
 * - comment          -> /article/:parentId#comment-:id OR /chautari/post/:parentId#comment-:id
 * - academy_course   -> /academy/course/:id
 * - training_track   -> /academy/track/:id
 * - event            -> /event/:id
 * - nepal_hub        -> /nepal-hub
 * - nepal_hub_update -> /nepal-hub/update/:id
 * - live_dispatch    -> /live/:id
 * - knowledge_entity -> /knowledge/:id
 * - glamour_album    -> /glamour/:id
 * - admin_review_item -> /admin/review/:id
 * - admin_backup_drill -> /admin/recovery/drill/:id
 * - admin_feature_control -> /admin/feature-control?feature=:id
 * - security_advisory -> /security/advisories/:id
 * - system_announcement -> /announcements/:id
 *
 * Never falls back to /latest or /news if an entity was deleted or invalid; routes to /target-unavailable.
 */
export function resolveNotificationTarget(notification: Partial<Notification> | any): ResolvedNotificationRoute {
  if (!notification) {
    return {
      path: "/target-unavailable?reason=INVALID_TARGET",
      targetType: "article",
      isExternal: false,
      isFallback: true
    };
  }

  // 1. Extract raw link if present and external
  const rawLink = notification.link || notification.linkUrl || notification.url;
  if (rawLink && typeof rawLink === "string" && (rawLink.startsWith("http://") || rawLink.startsWith("https://"))) {
    return { path: rawLink, targetType: "external" as any, isExternal: true };
  }

  // 2. Identify entity type
  const rawType = (
    notification.entityType ||
    notification.targetType ||
    notification.type ||
    ""
  ).toString().toLowerCase();

  // Extract candidate entity identifier
  const entityId = (
    notification.entityId ||
    notification.targetId ||
    notification.targetSlug ||
    notification.articleId ||
    notification.postId ||
    notification.courseId ||
    notification.eventId ||
    notification.liveDispatchId ||
    notification.manuscriptId ||
    notification.extra?.entityId ||
    notification.extra?.articleId ||
    notification.extra?.postId ||
    notification.extra?.courseId ||
    notification.extra?.eventId ||
    notification.extra?.liveDispatchId ||
    notification.extra?.manuscriptId ||
    ""
  );

  // Normalize legacy entity type aliases
  let canonicalEntityType = rawType;
  if (["new_article", "article_published", "article_submitted", "article_approved", "article_rejected"].includes(rawType)) {
    canonicalEntityType = "article";
  } else if (["community_post", "post", "post_reported", "moderator_action"].includes(rawType)) {
    canonicalEntityType = "chautari_post";
  } else if (["reply_received", "comment_flagged"].includes(rawType)) {
    canonicalEntityType = "comment";
  } else if (["course_published", "assignment_created", "course"].includes(rawType)) {
    canonicalEntityType = "academy_course";
  } else if (["event_created"].includes(rawType)) {
    canonicalEntityType = "event";
  } else if (["live_video", "live_stream", "live"].includes(rawType)) {
    canonicalEntityType = "live_dispatch";
  }

  // If entity type is still unknown, infer from available IDs
  if (!canonicalEntityType) {
    if (notification.articleId || notification.extra?.articleId) canonicalEntityType = "article";
    else if (notification.postId || notification.extra?.postId) canonicalEntityType = "chautari_post";
    else if (notification.courseId || notification.extra?.courseId) canonicalEntityType = "academy_course";
    else if (notification.eventId || notification.extra?.eventId) canonicalEntityType = "event";
    else if (notification.liveDispatchId || notification.extra?.liveDispatchId) canonicalEntityType = "live_dispatch";
    else canonicalEntityType = "system_announcement";
  }

  // Resolve via CanonicalDestinationResolver
  const resolved = resolveCanonicalDestination({
    entityType: canonicalEntityType,
    entityId,
    metadata: notification.metadata || notification.extra
  });

  return {
    path: resolved.canonicalUrl,
    targetType: (resolved.entityType as any) || "article",
    entityId: resolved.entityId,
    isExternal: false,
    isFallback: resolved.status !== "VALID"
  };
}

/**
 * Alias for backward compatibility
 */
export const getNotificationDeepLink = resolveNotificationTarget;

/**
 * Verify entity existence before navigating. If entity was deleted or missing,
 * gracefully routes to /target-unavailable with informative banner.
 */
export async function verifyNotificationTargetExistence(notification: Partial<Notification> | any): Promise<ResolvedNotificationRoute> {
  const resolved = resolveNotificationTarget(notification);
  if (resolved.isExternal || resolved.isFallback || !resolved.entityId) {
    return resolved;
  }

  if (resolved.targetType === "article") {
    // Check continuityEngine first, then snapshotEngine
    const article = await continuityEngine.getArticleById(resolved.entityId).catch(() => null);
    if (!article) {
      const snapArticles = snapshotEngine.getDynamicArticles() || [];
      const foundInSnap = snapArticles.find((a: any) => a.id === resolved.entityId);
      if (!foundInSnap) {
        return {
          path: `/target-unavailable?reason=TARGET_NOT_FOUND&entityType=article&entityId=${encodeURIComponent(resolved.entityId)}`,
          targetType: "article",
          entityId: resolved.entityId,
          isExternal: false,
          isFallback: true
        };
      }
    }
  }

  return resolved;
}

/**
 * Programmatically navigate to a notification's target URL with existence verification.
 */
export async function routeNotification(notification: Partial<Notification> | any, navigate?: (path: string) => void) {
  const resolved = await verifyNotificationTargetExistence(notification);
  
  if (resolved.isFallback && notification?.entityId) {
    toast.info("सम्बन्धित सामग्री फेला परेन वा निष्क्रिय गरिएको छ।");
  }

  if (resolved.isExternal) {
    window.open(resolved.path, "_blank", "noopener,noreferrer");
    return;
  }

  if (navigate) {
    navigate(resolved.path);
  } else if (typeof window !== "undefined") {
    window.location.href = resolved.path;
  }
}
