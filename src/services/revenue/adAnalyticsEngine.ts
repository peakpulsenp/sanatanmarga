/**
 * SanatanMarga RevenueOS v3.0 — Ad Analytics Engine & Delivery Aggregator
 * Fast, aggregated metrics engine for Advertiser & Admin dashboards.
 * Prevents Firestore-read scans by aggregating delivery events in memory and cache.
 */

import { Ad } from "@/src/types";
import { adDeliveryEventStore } from "../adDeliveryEventStore";

export interface CampaignDailyMetrics {
  campaignId: string;
  date: string; // YYYY-MM-DD
  impressions: number;
  viewableImpressions: number;
  clicks: number;
  uniqueUsers: number;
  spend: number;
  ctr: number;
  cpm: number;
  cpc: number;
}

export interface CampaignPerformanceBreakdown {
  campaignId: string;
  totalImpressions: number;
  viewableImpressions: number;
  totalClicks: number;
  uniqueReach: number;
  ctr: number;
  cpm: number;
  cpc: number;
  frequency: number;
  totalSpend: number;
  remainingBudget: number;
  byPlacement: Record<string, { impressions: number; viewable: number; clicks: number; ctr: number }>;
  byDevice: Record<string, { impressions: number; viewable: number; clicks: number; ctr: number }>;
  byLocation: Record<string, { impressions: number; viewable: number; clicks: number; ctr: number }>;
  dailyTrend: CampaignDailyMetrics[];
}

export class AdAnalyticsEngine {
  private dailyMetricsCache: Map<string, CampaignDailyMetrics[]> = new Map();

  public getCampaignMetrics(campaign: Ad): CampaignPerformanceBreakdown {
    const events = adDeliveryEventStore.getCampaignEvents(campaign.id);
    const totalBudget = Math.round(Number(campaign.budget?.totalBudget || 10000));
    
    let impressions = 0;
    let viewableImpressions = 0;
    let clicks = 0;
    const uniqueUsersSet = new Set<string>();
    const byPlacement: Record<string, { impressions: number; viewable: number; clicks: number; ctr: number }> = {};
    const byDevice: Record<string, { impressions: number; viewable: number; clicks: number; ctr: number }> = {};
    const byLocation: Record<string, { impressions: number; viewable: number; clicks: number; ctr: number }> = {};
    const dailyMap = new Map<string, { impressions: number; viewable: number; clicks: number; users: Set<string> }>();

    events.forEach((evt) => {
      const dateStr = evt.timestamp.slice(0, 10);
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, { impressions: 0, viewable: 0, clicks: 0, users: new Set() });
      }
      const dayObj = dailyMap.get(dateStr)!;

      const userIdent = (evt as any).userId || (evt as any).userHash || evt.sessionId;
      if (userIdent) {
        uniqueUsersSet.add(userIdent);
        dayObj.users.add(userIdent);
      }

      // Placement Breakdown
      const pos = evt.placement || campaign.position || "unknown";
      if (!byPlacement[pos]) byPlacement[pos] = { impressions: 0, viewable: 0, clicks: 0, ctr: 0 };

      // Device Breakdown
      const dev = (evt as any).device || evt.deviceClass || "desktop";
      if (!byDevice[dev]) byDevice[dev] = { impressions: 0, viewable: 0, clicks: 0, ctr: 0 };

      // Location Breakdown
      const loc = (evt as any).district || (evt as any).province || "All Nepal";
      if (!byLocation[loc]) byLocation[loc] = { impressions: 0, viewable: 0, clicks: 0, ctr: 0 };

      if (evt.eventType === "impression") {
        impressions++;
        dayObj.impressions++;
        byPlacement[pos].impressions++;
        byDevice[dev].impressions++;
        byLocation[loc].impressions++;

        if (evt.verified) {
          viewableImpressions++;
          dayObj.viewable++;
          byPlacement[pos].viewable++;
          byDevice[dev].viewable++;
          byLocation[loc].viewable++;
        }
      } else if (evt.eventType === "click") {
        clicks++;
        dayObj.clicks++;
        byPlacement[pos].clicks++;
        byDevice[dev].clicks++;
        byLocation[loc].clicks++;
      }
    });

    // Fall back to campaign record stats if store events are lower (for legacy compatibility)
    if (campaign.impressions && campaign.impressions > impressions) {
      impressions = campaign.impressions;
      viewableImpressions = Math.round(impressions * 0.85);
    }
    if (campaign.clicks && campaign.clicks > clicks) {
      clicks = campaign.clicks;
    }

    // Calculate CTR, CPM, CPC, Spend
    const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
    
    let totalSpend = 0;
    const pricingModel = campaign.budget?.pricingModel || "cpm";
    const cpmRate = Number(campaign.budget?.cpmRate || 150);
    const cpcRate = Number(campaign.budget?.cpcRate || 20);

    if (pricingModel === "cpm") {
      totalSpend = Math.round((impressions / 1000) * cpmRate);
    } else if (pricingModel === "cpc") {
      totalSpend = Math.round(clicks * cpcRate);
    } else {
      totalSpend = Math.round(Math.min(totalBudget, totalBudget * 0.5));
    }

    totalSpend = Math.min(totalSpend, totalBudget);
    const remainingBudget = Math.max(0, totalBudget - totalSpend);
    const cpm = impressions > 0 ? Number(((totalSpend / impressions) * 1000).toFixed(2)) : cpmRate;
    const cpc = clicks > 0 ? Number((totalSpend / clicks).toFixed(2)) : cpcRate;
    const uniqueReach = Math.max(uniqueUsersSet.size, Math.round(impressions * 0.6) || 1);
    const frequency = uniqueReach > 0 ? Number((impressions / uniqueReach).toFixed(2)) : 1;

    // Calculate CTRs for breakdowns
    Object.keys(byPlacement).forEach(k => {
      const p = byPlacement[k];
      p.ctr = p.impressions > 0 ? Number(((p.clicks / p.impressions) * 100).toFixed(2)) : 0;
    });
    Object.keys(byDevice).forEach(k => {
      const d = byDevice[k];
      d.ctr = d.impressions > 0 ? Number(((d.clicks / d.impressions) * 100).toFixed(2)) : 0;
    });
    Object.keys(byLocation).forEach(k => {
      const l = byLocation[k];
      l.ctr = l.impressions > 0 ? Number(((l.clicks / l.impressions) * 100).toFixed(2)) : 0;
    });

    // Generate daily trend array
    const dailyTrend: CampaignDailyMetrics[] = Array.from(dailyMap.entries()).map(([dateStr, obj]) => {
      const daySpend = pricingModel === "cpm" 
        ? Math.round((obj.impressions / 1000) * cpmRate)
        : Math.round(obj.clicks * cpcRate);
      const dayCtr = obj.impressions > 0 ? Number(((obj.clicks / obj.impressions) * 100).toFixed(2)) : 0;

      return {
        campaignId: campaign.id,
        date: dateStr,
        impressions: obj.impressions,
        viewableImpressions: obj.viewable,
        clicks: obj.clicks,
        uniqueUsers: obj.users.size,
        spend: daySpend,
        ctr: dayCtr,
        cpm,
        cpc
      };
    });

    // If dailyTrend is empty (no events), create a default entry for current date
    if (dailyTrend.length === 0) {
      dailyTrend.push({
        campaignId: campaign.id,
        date: new Date().toISOString().slice(0, 10),
        impressions,
        viewableImpressions,
        clicks,
        uniqueUsers: uniqueReach,
        spend: totalSpend,
        ctr,
        cpm,
        cpc
      });
    }

    return {
      campaignId: campaign.id,
      totalImpressions: impressions,
      viewableImpressions,
      totalClicks: clicks,
      uniqueReach,
      ctr,
      cpm,
      cpc,
      frequency,
      totalSpend,
      remainingBudget,
      byPlacement,
      byDevice,
      byLocation,
      dailyTrend
    };
  }
}

export const adAnalyticsEngine = new AdAnalyticsEngine();
