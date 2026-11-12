/**
 * SANATANMARGA 5.0 BETA — PHASE 3C
 * Reader Activity & Audience OS Type Definitions
 * 
 * Privacy-conscious reader activity, coarse progress milestones,
 * bounded local-first event queue, and aggregated audience metrics.
 */

export type ReaderActivityEventType =
  | "PAGE_VIEW"
  | "ARTICLE_OPEN"
  | "ARTICLE_READ_PROGRESS"
  | "ARTICLE_COMPLETE"
  | "CONTENT_DWELL_BUCKET"
  | "SAVE"
  | "UNSAVE"
  | "FOLLOW"
  | "UNFOLLOW"
  | "SEARCH_SUBMITTED"
  | "NOTIFICATION_OPEN"
  | "MEDIA_PLAY"
  | "MEDIA_COMPLETE"
  | "EVENT_VIEW"
  | "KNOWLEDGE_VIEW"
  | "BLOG_VIEW"
  | "CHAUTARI_VIEW"
  | "COURSE_VIEW";

export const VALID_ACTIVITY_EVENT_TYPES: ReaderActivityEventType[] = [
  "PAGE_VIEW",
  "ARTICLE_OPEN",
  "ARTICLE_READ_PROGRESS",
  "ARTICLE_COMPLETE",
  "CONTENT_DWELL_BUCKET",
  "SAVE",
  "UNSAVE",
  "FOLLOW",
  "UNFOLLOW",
  "SEARCH_SUBMITTED",
  "NOTIFICATION_OPEN",
  "MEDIA_PLAY",
  "MEDIA_COMPLETE",
  "EVENT_VIEW",
  "KNOWLEDGE_VIEW",
  "BLOG_VIEW",
  "CHAUTARI_VIEW",
  "COURSE_VIEW"
];

export type ReadProgressMilestone = 25 | 50 | 75 | 100;

export type DwellTimeBucket = "<15s" | "15_60s" | "1_3m" | "3_10m" | "10m_plus";

export type DeviceClass = "mobile" | "tablet" | "desktop" | "unknown";

export type ActivitySource =
  | "direct"
  | "search"
  | "social"
  | "internal"
  | "notification"
  | "homepage"
  | "external_referrer";

export interface ReaderActivityMetadata {
  milestone?: ReadProgressMilestone;
  dwellBucket?: DwellTimeBucket;
  dwellSeconds?: number;
  targetType?: "topic" | "author" | "category" | "district" | "entity";
  targetId?: string;
  query?: string;
  referrerDomain?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  mediaType?: "audio" | "video" | "radio" | "podcast";
  playbackDurationSeconds?: number;
  notificationId?: string;
  isInternalPreview?: boolean;
}

export interface ReaderActivityEvent {
  eventId: string;
  eventType: ReaderActivityEventType;
  occurredAt: string;
  sessionId: string;
  userId?: string;
  anonymousId?: string;
  tenantId?: string;
  entityType?: "article" | "blog_post" | "event" | "knowledge_entity" | "chautari_post" | "academy_course" | "media" | "route" | "topic" | "author" | "category" | "district";
  entityId?: string;
  route?: string;
  source?: ActivitySource;
  metadata?: ReaderActivityMetadata;
  language?: "ne" | "en" | "all";
  deviceClass?: DeviceClass;
  consentClass?: "essential" | "analytics";
  schemaVersion: number;
}

export interface ContinueReadingItem {
  entityId: string;
  entityType: string;
  title: string;
  summary?: string;
  progressPercent: number; // 25, 50, 75, 100
  lastReadAt: string;
  language: "ne" | "en" | "all";
  canonicalUrl: string;
  category?: string;
  categoryId?: string;
  mediaUrl?: string;
}

export interface ReadingHistoryItem {
  entityId: string;
  entityType: string;
  title: string;
  visitedAt: string;
  language: "ne" | "en" | "all";
  canonicalUrl: string;
  category?: string;
  completed?: boolean;
}

export interface ContentAudienceAggregate {
  entityType: string;
  entityId: string;
  period: "hourly" | "daily" | "weekly" | "all_time";
  views: number;
  uniqueSessionsApprox: number;
  completions: number;
  saves: number;
  shares: number;
  notificationOpens: number;
  avgDwellSecondsApprox: number;
  deviceBreakdown: Record<DeviceClass, number>;
  languageBreakdown: Record<string, number>;
  lastUpdated: string;
}

export interface AudienceIngestBatchRequest {
  events: ReaderActivityEvent[];
  clientSentAt: string;
  tenantId?: string;
}

export interface AudienceIngestBatchResponse {
  success: boolean;
  accepted: number;
  rejected: number;
  deduplicated: number;
  errors?: string[];
}

export interface AudienceAdminSummary {
  period: string;
  totalViews: number;
  totalUniqueSessionsEstimate: number;
  totalCompletions: number;
  avgDwellSecondsEstimate: number;
  dwellBucketDistribution: Record<DwellTimeBucket, number>;
  topContent: Array<{
    entityId: string;
    entityType: string;
    title?: string;
    views: number;
    completions: number;
  }>;
  pipelineHealth: {
    status: "healthy" | "degraded" | "paused";
    circuitBreakerOpen: boolean;
    eventsIngested24h: number;
    eventsRejected24h: number;
    eventsDeduplicated24h: number;
    activeSessionsEstimate: number;
    lastAggregationTimestamp: string;
  };
}
