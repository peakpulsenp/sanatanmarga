/**
 * SANATANMARGA 5.0 BETA — COMPOSITION OS TYPES
 * Phase 3B: Homepage Manager, Composition OS, Presentation-Independent Slot Engine,
 * Validation Engine & Behavioral Contracts
 */

export const VALID_SECTION_TYPES = [
  "hero",
  "breaking_news",
  "latest_feed",
  "category_grid",
  "video_showcase",
  "trending_bento",
  "live_broadcast",
  "announcements",
  "chautari_community",
  "academy_courses",
  "knowledge_spotlight",
  "ads_slot"
] as const;

export type SectionType = typeof VALID_SECTION_TYPES[number];

export const VALID_SLOT_ENTITY_TYPES = [
  "article",
  "blog_post",
  "chautari_post",
  "chautari_thread",
  "event",
  "academy_course",
  "knowledge_entity",
  "live_dispatch",
  "announcement",
  "ad_placement"
] as const;

export type SlotEntityType = typeof VALID_SLOT_ENTITY_TYPES[number];

export interface SlotEntityRef {
  entityType: SlotEntityType;
  entityId: string;
  slotIndex: number;
  customTitle?: string;
  customTitleNe?: string;
  customImage?: string;
  isPinned?: boolean;
  publishedAt?: string;
}

export interface SectionRule {
  autoFillStrategy?: "latest" | "most_read" | "category_matched" | "feature_flagged" | "manual_only";
  categoryId?: string;
  categorySlug?: string;
  maxItems: number;
  fallbackStrategy?: "fill_recent" | "hide_section" | "target_unavailable";
  scheduledStart?: string;
  scheduledEnd?: string;
  featureFlagRequirement?: string;
  allowDuplicates?: boolean;
}

export interface HomepageSectionConfig {
  id: string;
  type: SectionType;
  title: string;
  titleNe: string;
  order: number;
  isEnabled: boolean;
  rule: SectionRule;
  pinnedSlots: SlotEntityRef[];
}

export type CompositionLifecycleStatus = "draft" | "active" | "scheduled" | "archived";

export interface ScheduleConfig {
  scheduledPublishAt?: string;
  scheduledUnpublishAt?: string;
}

export interface HomepageComposition {
  id: string; // e.g., "active", "draft_v102", "sched_v103"
  version: number;
  previousVersion?: number;
  revisionHash?: string;
  status: CompositionLifecycleStatus;
  schedule?: ScheduleConfig;
  sections: HomepageSectionConfig[];
  language: "all" | "ne" | "en";
  updatedAt: string;
  updatedBy: string;
  publishedAt?: string;
  publishedBy?: string;
}

export interface HomepageCompositionBaseline {
  capturedAt: string;
  categoriesCount: number;
  articlesCount: number;
  featuredCount: number;
  latestCount: number;
  categoryArticlesMapKeys: string[];
  activeAdPlacementKeys: string[];
  conditionalSectionsPresent: {
    live: boolean;
    events: boolean;
    announcements: boolean;
    knowledge: boolean;
  };
  snapshotSizeBytes: number;
  compositionConfigSource: string;
}

export type CompositionReadAuditOp =
  | "homepage_composition_active"
  | "homepage_composition_draft"
  | "homepage_content_picker"
  | "homepage_rule_preview"
  | "homepage_version_history";

export interface CompositionValidationResult {
  valid: boolean;
  blockingErrors: string[];
  warnings: string[];
  checkedAt: string;
}

export interface HomepageCardProjection {
  id: string;
  title: string;
  summary: string;
  canonicalUrl: string;
  category?: string;
  categoryId?: string;
  publishedAt?: string;
  media?: {
    url?: string;
    thumbnail?: string;
    alt?: string;
    caption?: string;
  };
  isPinned?: boolean;
  entityType: string;
}

export interface AdminAttentionCase {
  code:
    | "BROKEN_HOMEPAGE_REFERENCE"
    | "SCHEDULE_CONFLICT"
    | "PUBLISH_FAILED"
    | "DELIVERY_FAILED"
    | "INVALID_SECTION"
    | "EDIT_CONFLICT";
  message: string;
  severity: "critical" | "warning";
  entityId?: string;
  sectionId?: string;
  timestamp: string;
}
