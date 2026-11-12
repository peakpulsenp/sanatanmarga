import { VideoCampaign, AdPlacementType } from "../types/advertising";
import { MembershipTier, articleModuleRegistry } from "./articleModuleRegistry";
import { advertisingStorage } from "./advertisingStorage";

export interface AdDecisionParams {
  courseId: string;
  category?: string;
  userTier: MembershipTier;
  placement: AdPlacementType;
  videoPlaybackCount?: number;
}

export interface AdDecisionResult {
  shouldPlayAd: boolean;
  campaign: VideoCampaign | null;
  reason?: string;
  skipAfterSeconds: number;
}

export const AcademyAdDecisionEngine = {
  /**
   * Evaluates ad placement and selects the optimal qualifying campaign.
   * Guaranteed non-blocking fallback if no campaign qualifies.
   */
  async selectAdForPlacement(params: AdDecisionParams): Promise<AdDecisionResult> {
    const { courseId, category, userTier, placement, videoPlaybackCount = 1 } = params;

    // 1. Membership Entitlement & Module Registry Check
    // PREMIUM users have absolute 0-ad entitlement via academy_ad_free rule!
    const isAdFreeEntitled = userTier === "premium" || articleModuleRegistry.hasAccess("academy_ad_free", userTier);
    if (isAdFreeEntitled) {
      return {
        shouldPlayAd: false,
        campaign: null,
        reason: "User tier 'premium' is entitled to zero-ad learning experience",
        skipAfterSeconds: 0
      };
    }

    // Check if video ads module is globally enabled
    if (!articleModuleRegistry.isModuleEnabled("academy_video_ads")) {
      return {
        shouldPlayAd: false,
        campaign: null,
        reason: "Academy video ads module disabled in ArticleModuleRegistry",
        skipAfterSeconds: 0
      };
    }

    // 2. Fetch Active Campaigns
    const allCampaigns = advertisingStorage.getCampaigns();
    const nowIso = new Date().toISOString();

    // 3. Filter Candidates
    const qualifying = allCampaigns.filter(camp => {
      // Status check
      if (camp.status !== "active") return false;

      // Date window check
      if (camp.startAt && camp.startAt > nowIso) return false;
      if (camp.endAt && camp.endAt < nowIso) return false;

      // Placement check
      if (camp.placements && !camp.placements.includes(placement)) return false;

      // Audience Tier check
      if (camp.targetTiers && camp.targetTiers.length > 0) {
        if (!camp.targetTiers.includes(userTier)) return false;
      }

      // Impression budget checks
      if (camp.totalImpressionLimit > 0 && camp.currentTotalImpressions >= camp.totalImpressionLimit) {
        return false;
      }
      if (camp.dailyImpressionLimit > 0 && camp.currentDailyImpressions >= camp.dailyImpressionLimit) {
        return false;
      }

      // Course targeting
      if (camp.targetCourses && camp.targetCourses.length > 0) {
        if (!camp.targetCourses.includes(courseId)) return false;
      }

      // Category targeting
      if (category && camp.targetCategories && camp.targetCategories.length > 0) {
        if (!camp.targetCategories.includes(category)) return false;
      }

      // Frequency Cap check (e.g. 1 ad every N videos)
      if (camp.frequencyCap && camp.frequencyCap.everyNVideos > 1) {
        if (videoPlaybackCount % camp.frequencyCap.everyNVideos !== 0) {
          return false;
        }
      }

      return true;
    });

    if (qualifying.length === 0) {
      return {
        shouldPlayAd: false,
        campaign: null,
        reason: "No qualifying active campaign matched targeting & budget rules",
        skipAfterSeconds: 0
      };
    }

    // 4. Sort by priority descending
    qualifying.sort((a, b) => (b.priority || 50) - (a.priority || 50));
    const selected = qualifying[0];

    return {
      shouldPlayAd: true,
      campaign: selected,
      skipAfterSeconds: selected.skipAfterSeconds || 5
    };
  }
};
