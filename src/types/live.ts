export type LiveVideoSourceType = 
  | "youtube" 
  | "facebook" 
  | "instagram" 
  | "native" 
  | "external" 
  | "uploaded";

export type LiveVideoStatus = 
  | "draft" 
  | "pending_review" 
  | "approved" 
  | "scheduled" 
  | "live" 
  | "ended" 
  | "archived" 
  | "rejected";

export type LiveStreamTruthState = "LIVE" | "SCHEDULED" | "REPLAY" | "OFFLINE";

export type LiveStreamBroadcastState = 
  | "SCHEDULED" 
  | "STARTING" 
  | "LIVE" 
  | "ENDING" 
  | "REPLAY" 
  | "OFFLINE";

export type LiveStreamConnectionState = 
  | "CONNECTED" 
  | "DEGRADED" 
  | "RECONNECTING" 
  | "FAILED";

export type LiveEmbedCapability = 
  | "SUPPORTED_EMBED" 
  | "SUPPORTED_API" 
  | "EXTERNAL_LINK_ONLY" 
  | "UNAVAILABLE";

export type EditorialStatus = 
  | "unverified" 
  | "verified" 
  | "rejected";

export type LiveChatPresentation = "overlay" | "side" | "hidden" | "popout";

export type LiveQualityOption = "Auto" | "1080p" | "720p" | "480p" | "360p";

export interface LiveSponsorInfo {
  id?: string;
  name: string;
  logoUrl?: string;
  targetUrl?: string;
  textNoticeNe?: string;
  textNoticeEn?: string;
  campaignId?: string;
  ctaText?: string;
}

export interface LiveSponsorCampaign {
  id: string;
  advertiserId: string;
  advertiserName: string;
  campaignName: string;
  placement: "LIVE_BOTTOM_TICKER" | "LIVE_VIDEO_LOWER_THIRD";
  headlineNe: string;
  headlineEn?: string;
  logoUrl?: string;
  destinationUrl: string;
  ctaText?: string;
  scrollSpeed?: "slow" | "normal" | "fast";
  priority: number; // 1 to 100
  startAt: string;
  endAt: string;
  status: "active" | "paused" | "completed" | "draft";
  targetCategories?: string[]; // empty = all
  targetDistricts?: string[]; // empty = all
  targetTiers?: ("free" | "member" | "patron" | "sadhak" | "sanrakshak" | "corporate")[]; // premium is always zero-ad
  frequencySeconds?: number;
  currentImpressions?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LiveVideo {
  id: string;
  title: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;

  sourceType: LiveVideoSourceType;
  sourceUrl: string;
  embedUrl?: string;
  externalId?: string;
  thumbnailUrl?: string;

  status: LiveVideoStatus;
  category?: string;
  tags?: string[];

  province?: string;
  district?: string;

  language?: "ne" | "en" | "mixed";

  broadcasterName?: string;
  broadcasterId?: string;

  isFeatured?: boolean;
  isLive?: boolean;

  startedAt?: string;
  endedAt?: string;
  scheduledAt?: string;

  viewerCount?: number;
  viewCount?: number;
  duration?: string;

  createdAt: string;
  updatedAt: string;
  publishedAt?: string;

  editorialStatus: EditorialStatus;
  sourceVerified: boolean;
  embedCapability: LiveEmbedCapability;

  revenuePlacement?: string;
  sponsorInfo?: LiveSponsorInfo;
}

export interface LiveChatMessage {
  id: string;
  liveVideoId: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  message: string;

  status: "visible" | "pending" | "hidden" | "deleted";
  createdAt: string;

  role?: string;
  membershipTier?: "free" | "patron" | "sadhak" | "sanrakshak" | "corporate";
  isOfficial?: boolean;
  isPinned?: boolean;
  isModerator?: boolean;
  badge?: string;

  replyTo?: {
    messageId: string;
    displayName: string;
    snippet: string;
  };

  reactions?: Record<string, number>; // emoji -> count, e.g. { "🙏": 14, "❤️": 7 }
  userReactions?: Record<string, string[]>; // emoji -> [userIds]

  moderatedBy?: string;
  moderationReason?: string;
}

export interface LiveParticipant {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
  membershipTier: "free" | "patron" | "sadhak" | "sanrakshak" | "corporate";
  isMuted?: boolean;
  mutedUntil?: string; // ISO date string
  isBanned?: boolean;
  joinedAt: string;
  isChatter: boolean;
  isStaff: boolean;
  messageCount?: number;
}

export interface LiveModerationAction {
  id: string;
  timestamp: string;
  action: 
    | "delete_message" 
    | "hide_message" 
    | "pin_message" 
    | "unpin_message" 
    | "mute_user" 
    | "timeout_user" 
    | "stream_ban" 
    | "global_ban" 
    | "approve_message";
  targetUserId?: string;
  targetUserName?: string;
  targetMessageId?: string;
  moderatorUserId: string;
  moderatorName: string;
  durationMinutes?: number;
  reason?: string;
}

export interface LiveStreamSettings {
  chatEnabled: boolean;
  slowModeSeconds: number;
  requireAuthentication: boolean;
  allowLinks: boolean;
  allowImages: boolean;
  memberOnlyChat?: boolean;
  verifiedOnlyChat?: boolean;
  moderationMode: "auto" | "require_approval" | "disabled";
  keywordBlocklist?: string[];
  defaultChatPresentation?: LiveChatPresentation;
  featuredLiveVideoId?: string;
  heroSponsorAdId?: string;
  activeTickerCampaignIds?: string[];
  activeLowerThirdCampaignIds?: string[];
}

export interface SocialSourceConfig {
  id: string;
  platform: "youtube" | "facebook" | "instagram" | "other";
  channelName: string;
  channelUrl: string;
  externalPlatformId?: string;
  autoIngestEnabled: boolean;
  lastSyncAt?: string;
  verifiedBy: string;
  status: "active" | "paused" | "disabled";
}

export interface LiveAnalyticsSummary {
  activeStreamsCount: number;
  scheduledStreamsCount: number;
  totalApprovedVideosCount: number;
  totalMeasuredViews: number;
  totalChatMessages: number;
  topCategory: string;
  topSourcePlatform: string;
  lastUpdated: string;
}
