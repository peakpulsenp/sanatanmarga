/**
 * SanatanMarga RevenueOS v3.0 — Delivery Event Store & Analytics Engine
 * 
 * Manages immutable AdDeliveryEvents with strict anti-double-counting guarantees,
 * deterministic event keys, and real-time campaign performance analytics.
 */

import { AdDeliveryEvent, CampaignFinancials, Ad } from "@/src/types";
import { db } from "@/src/lib/firebase";
import { doc, setDoc, collection, getDocs, query, where } from "@/src/lib/firebase";

const STORAGE_KEY_EVENTS = "sanatan_ad_delivery_events";
const eventDedupeSet = new Set<string>();

export class AdDeliveryEventStore {
  private events: AdDeliveryEvent[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EVENTS);
      if (raw) {
        this.events = JSON.parse(raw);
        this.events.forEach(e => eventDedupeSet.add(e.id));
      }
    } catch {
      this.events = [];
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      // Keep last 1000 events locally for fast analytics
      const slice = this.events.slice(-1000);
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(slice));
    } catch {}
  }

  /**
   * Deterministic Event Key Generator
   * Form: ${campaignId}:${pageViewId || 'session'}:${placement}:${eventType}
   */
  public generateEventKey(
    campaignId: string,
    pageViewId: string | undefined,
    placement: string,
    eventType: "impression" | "click"
  ): string {
    const pvId = pageViewId || `session_${Math.floor(Date.now() / 60000)}`;
    return `${campaignId}:${pvId}:${placement}:${eventType}`;
  }

  /**
   * Records an immutable delivery event with strict deduplication.
   * Returns true if recorded, false if duplicate.
   */
  public recordEvent(event: AdDeliveryEvent): boolean {
    if (!event.id || eventDedupeSet.has(event.id)) {
      return false; // Idempotency check: duplicate event ignored
    }

    eventDedupeSet.add(event.id);
    this.events.push(event);
    this.saveToStorage();

    // Async sync to Firestore (fire & forget, server-first write with failover)
    if (db) {
      setDoc(doc(db, "adDeliveryEvents", event.id), event).catch(() => {
        // Safe fail: local event remains stored
      });
    }

    return true;
  }

  /**
   * Retrieves all recorded delivery events for a given campaign.
   */
  public getCampaignEvents(campaignId: string): AdDeliveryEvent[] {
    return this.events.filter(e => e.campaignId === campaignId);
  }

  /**
   * Calculates real-time analytics for a campaign from verified delivery events.
   */
  public getCampaignAnalytics(campaign: Ad) {
    const campaignId = campaign.id || "";
    const cEvents = this.getCampaignEvents(campaignId);

    const impressionsFromEvents = cEvents.filter(e => e.eventType === "impression").length;
    const clicksFromEvents = cEvents.filter(e => e.eventType === "click").length;

    // Use event count if higher than legacy counter
    const impressions = Math.max(campaign.impressions || 0, impressionsFromEvents);
    const clicks = Math.max(campaign.clicks || 0, clicksFromEvents);
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    // Daily breakdown
    const dailyMap: Record<string, { impressions: number; clicks: number }> = {};
    cEvents.forEach(e => {
      const date = e.timestamp.split("T")[0] || "Today";
      if (!dailyMap[date]) dailyMap[date] = { impressions: 0, clicks: 0 };
      if (e.eventType === "impression") dailyMap[date].impressions++;
      if (e.eventType === "click") dailyMap[date].clicks++;
    });

    const dailyTrend = Object.entries(dailyMap).map(([date, counts]) => ({
      date,
      impressions: counts.impressions,
      clicks: counts.clicks,
      ctr: counts.impressions > 0 ? Number(((counts.clicks / counts.impressions) * 100).toFixed(2)) : 0
    }));

    // Placement breakdown
    const placementMap: Record<string, { impressions: number; clicks: number }> = {};
    cEvents.forEach(e => {
      const pl = e.placement || "unknown";
      if (!placementMap[pl]) placementMap[pl] = { impressions: 0, clicks: 0 };
      if (e.eventType === "impression") placementMap[pl].impressions++;
      if (e.eventType === "click") placementMap[pl].clicks++;
    });

    // Device breakdown
    const deviceMap: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    cEvents.forEach(e => {
      if (e.eventType === "impression") {
        const dev = e.deviceClass || "desktop";
        deviceMap[dev] = (deviceMap[dev] || 0) + 1;
      }
    });

    return {
      impressions,
      clicks,
      ctr: Number(ctr.toFixed(2)),
      dailyTrend,
      placementBreakdown: placementMap,
      deviceBreakdown: deviceMap
    };
  }

  /**
   * Derives truthful financial metrics for a campaign based on actual rates and delivery events.
   * Enforces invariants:
   * Delivered <= Contracted
   * Invoiced <= Delivered
   * Collected <= Invoiced
   * Remaining Budget >= 0
   */
  public calculateCampaignFinancials(campaign: Ad, invoicedNpr: number = 0, collectedNpr: number = 0): CampaignFinancials {
    const campaignId = campaign.id || "unknown";
    const contracted = Number(campaign.budget?.totalBudget || 0);

    const analytics = this.getCampaignAnalytics(campaign);
    let delivered = 0;

    if (campaign.budget?.pricingModel === "cpm") {
      const cpmRate = Number(campaign.budget.cpmRate || 150);
      delivered = (analytics.impressions / 1000) * cpmRate;
    } else if (campaign.budget?.pricingModel === "cpc") {
      const cpcRate = Number(campaign.budget.cpcRate || 20);
      delivered = analytics.clicks * cpcRate;
    } else {
      // flat_rate or standard budget spend
      if (campaign.status === "completed") {
        delivered = contracted;
      } else if (campaign.status === "active") {
        const spent = Number(campaign.budget?.spent || 0);
        delivered = Math.max(spent, Math.min(contracted, Math.round(contracted * (analytics.impressions / 10000))));
      } else {
        delivered = Number(campaign.budget?.spent || 0);
      }
    }

    // Strict math bounds
    delivered = Math.round(Math.min(contracted > 0 ? contracted : delivered, delivered));
    const invoiced = Math.min(delivered, Math.round(invoicedNpr));
    const collected = Math.min(invoiced, Math.round(collectedNpr));
    const outstanding = Math.max(0, invoiced - collected);
    const remaining = Math.max(0, contracted - delivered);

    return {
      campaignId,
      contractedRevenue: contracted,
      deliveredRevenue: delivered,
      invoicedRevenue: invoiced,
      collectedRevenue: collected,
      outstandingRevenue: outstanding,
      remainingBudget: remaining
    };
  }
}

export const adDeliveryEventStore = new AdDeliveryEventStore();
