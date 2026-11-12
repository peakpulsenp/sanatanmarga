/**
 * SanatanMarga RevenueOS v3.0 — Campaign Service
 * Authoritative campaign lifecycle & state management.
 */

import { Ad, AdStatus } from "@/src/types";
import { snapshotEngine } from "../snapshotEngine";
import { offlineQueue } from "@/src/lib/offlineQueue";
import { db } from "@/src/lib/firebase";
import { doc, setDoc, getDocs, collection, query, where, orderBy } from "@/src/lib/firebase";

export type CampaignLifecycleState = 
  | "draft"
  | "under_review"
  | "approved"
  | "active"
  | "paused"
  | "completed"
  | "rejected"
  | "cancelled";

export class CampaignService {
  private memoryCampaigns: Map<string, Ad> = new Map();

  constructor() {
    this.hydrateFromSnapshot();
  }

  private hydrateFromSnapshot() {
    try {
      const ads = snapshotEngine.getDynamicAds();
      ads.forEach((ad) => {
        if (ad.id) this.memoryCampaigns.set(ad.id, ad);
      });
    } catch (e) {}
  }

  public getCampaignsForAdvertiserSync(advertiserId: string, isAdmin = false): Ad[] {
    this.hydrateFromSnapshot();
    const all = Array.from(this.memoryCampaigns.values());
    if (isAdmin) {
      return all.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
    return all
      .filter((ad) => ad.advertiserId === advertiserId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  public async getCampaignsForAdvertiser(advertiserId: string, isAdmin = false): Promise<Ad[]> {
    return this.getCampaignsForAdvertiserSync(advertiserId, isAdmin);
  }

  public getCampaignById(id: string): Ad | undefined {
    return this.memoryCampaigns.get(id);
  }

  public async saveCampaign(campaign: Ad, auditActor: string): Promise<Ad> {
    const nowIso = new Date().toISOString();
    const updated: Ad = {
      ...campaign,
      updatedAt: nowIso,
      createdAt: campaign.createdAt || nowIso
    };

    this.memoryCampaigns.set(updated.id, updated);

    // Update Snapshot Engine
    snapshotEngine.removeDynamicAd(updated.id);
    snapshotEngine.injectAds([updated]);

    // Queue for durable offline sync
    offlineQueue.queueAction({
      type: "AD_UPDATE",
      collection: "ads",
      docId: updated.id,
      data: updated
    });

    if (db) {
      try {
        await setDoc(doc(db, "ads", updated.id), updated as any, { merge: true });
      } catch (e) {}
    }

    return updated;
  }

  public async updateCampaignStatus(id: string, status: AdStatus, reason?: string): Promise<Ad | null> {
    const campaign = this.getCampaignById(id);
    if (!campaign) return null;

    const isActive = status === "active";
    const updated: Ad = {
      ...campaign,
      status,
      isActive,
      updatedAt: new Date().toISOString()
    };

    return this.saveCampaign(updated, "system_governance");
  }

  public calculateContractValue(campaign: Ad): number {
    return Math.round(Number(campaign.budget?.totalBudget || 10000));
  }
}

export const campaignService = new CampaignService();
