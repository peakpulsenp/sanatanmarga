import { MembershipTier } from "@/src/services/articleModuleRegistry";

export type AdPlacementType = "pre-roll" | "mid-roll" | "post-roll";
export type CampaignStatus = "active" | "draft" | "paused" | "completed";

export interface Advertiser {
  id: string;
  name: string;
  logoUrl?: string;
  contactEmail?: string;
  website?: string;
  status: "active" | "inactive";
  createdAt: string;
}

export interface VideoCampaign {
  id: string;
  advertiserId: string;
  advertiserName: string;
  advertiserLogo?: string;
  campaignName: string;
  videoUrl: string;
  thumbnailUrl?: string;
  destinationUrl: string;
  ctaText?: string;
  startAt: string;
  endAt: string;
  status: CampaignStatus;
  priority: number; // 1 - 100
  dailyImpressionLimit: number;
  totalImpressionLimit: number;
  currentDailyImpressions: number;
  currentTotalImpressions: number;
  targetCourses: string[]; // empty means all courses
  targetCategories: string[]; // empty means all categories
  targetTiers: MembershipTier[]; // 'free' | 'member' | 'premium'
  frequencyCap: {
    maxAdsPerSession: number;
    everyNVideos: number; // e.g. 1 ad per 3 videos
  };
  skipAfterSeconds: number; // e.g. 5
  placements: AdPlacementType[];
  midRollChapterTimestampSeconds?: number; // e.g., 600 (10 mins)
  createdAt: string;
  updatedAt: string;
}

export type AdTelemetryEventType = 
  | "impression"
  | "start"
  | "watch_25"
  | "watch_50"
  | "watch_75"
  | "completed"
  | "skipped"
  | "click";

export interface VideoAdTelemetryEvent {
  id: string;
  campaignId: string;
  advertiserId: string;
  courseId: string;
  placement: AdPlacementType;
  userTier: MembershipTier;
  eventType: AdTelemetryEventType;
  timestamp: string;
  watchDurationSeconds?: number;
}

export interface CampaignAnalytics {
  campaignId: string;
  campaignName: string;
  advertiserName: string;
  impressions: number;
  starts: number;
  watch25: number;
  watch50: number;
  watch75: number;
  completions: number;
  skips: number;
  skipRate: number; // %
  clicks: number;
  ctr: number; // %
  averageWatchSeconds: number;
  estimatedRevenueNpr: number;
}
