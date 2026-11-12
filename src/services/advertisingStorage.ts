import { Advertiser, VideoCampaign, VideoAdTelemetryEvent, CampaignAnalytics } from "../types/advertising";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "@/src/lib/firebase";

const CAMPAIGNS_STORAGE_KEY = "sanatan_video_campaigns_v1";
const ADVERTISERS_STORAGE_KEY = "sanatan_advertisers_v1";
const TELEMETRY_STORAGE_KEY = "sanatan_video_ad_telemetry_v1";

export const SAMPLE_ADVERTISERS: Advertiser[] = [
  {
    id: "adv-1",
    name: "Himalayan Bank Ltd.",
    logoUrl: "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=100&auto=format&fit=crop&q=80",
    contactEmail: "csr@himalayanbank.com",
    website: "https://himalayanbank.com",
    status: "active",
    createdAt: "2026-01-15T00:00:00Z"
  },
  {
    id: "adv-2",
    name: "Sanatan Heritage Trust",
    logoUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&auto=format&fit=crop&q=80",
    contactEmail: "grants@sanatanheritage.org",
    website: "https://sanatanheritage.org",
    status: "active",
    createdAt: "2026-02-01T00:00:00Z"
  },
  {
    id: "adv-3",
    name: "Nepal Telecom Digital Education",
    logoUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop&q=80",
    contactEmail: "edu@ntc.net.np",
    website: "https://ntc.net.np",
    status: "active",
    createdAt: "2026-02-10T00:00:00Z"
  }
];

export const SAMPLE_CAMPAIGNS: VideoCampaign[] = [
  {
    id: "camp-101",
    advertiserId: "adv-1",
    advertiserName: "Himalayan Bank Ltd.",
    advertiserLogo: "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=100&auto=format&fit=crop&q=80",
    campaignName: "Student Financial Literacy Fellowship",
    // Use HTML5 public high quality MP4 video samples suitable for video ad demo
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    destinationUrl: "https://himalayanbank.com/student-fellowship",
    ctaText: "छात्रवृत्ति आवेदन गर्नुहोस् (Apply for Fellowship)",
    startAt: "2026-01-01T00:00:00Z",
    endAt: "2027-12-31T23:59:59Z",
    status: "active",
    priority: 85,
    dailyImpressionLimit: 5000,
    totalImpressionLimit: 100000,
    currentDailyImpressions: 412,
    currentTotalImpressions: 18420,
    targetCourses: [], // all courses
    targetCategories: ["Business", "Philosophy", "Civilization"],
    targetTiers: ["free", "member"],
    frequencyCap: {
      maxAdsPerSession: 3,
      everyNVideos: 1
    },
    skipAfterSeconds: 5,
    placements: ["pre-roll", "mid-roll"],
    midRollChapterTimestampSeconds: 300,
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-08-28T00:00:00Z"
  },
  {
    id: "camp-102",
    advertiserId: "adv-2",
    advertiserName: "Sanatan Heritage Trust",
    advertiserLogo: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&auto=format&fit=crop&q=80",
    campaignName: "Vedic Sanskriti Research Grant 2026",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=600&auto=format&fit=crop&q=80",
    destinationUrl: "https://sanatanheritage.org/research-grant",
    ctaText: "अनुसन्धान विवरण हेर्नुहोस् (View Grant Details)",
    startAt: "2026-01-01T00:00:00Z",
    endAt: "2027-12-31T23:59:59Z",
    status: "active",
    priority: 90,
    dailyImpressionLimit: 3000,
    totalImpressionLimit: 50000,
    currentDailyImpressions: 215,
    currentTotalImpressions: 9840,
    targetCourses: [],
    targetCategories: ["Culture", "Sanskrit", "Philosophy"],
    targetTiers: ["free", "member"],
    frequencyCap: {
      maxAdsPerSession: 2,
      everyNVideos: 2
    },
    skipAfterSeconds: 5,
    placements: ["pre-roll", "post-roll"],
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: "2026-08-28T00:00:00Z"
  },
  {
    id: "camp-103",
    advertiserId: "adv-3",
    advertiserName: "Nepal Telecom Digital Education",
    advertiserLogo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop&q=80",
    campaignName: "Free E-Learning Data Pack for Academy Students",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
    destinationUrl: "https://ntc.net.np/student-datapack",
    ctaText: "निःशुल्क डेटा दाबी गर्नुहोस् (Claim Free Data)",
    startAt: "2026-01-01T00:00:00Z",
    endAt: "2027-12-31T23:59:59Z",
    status: "active",
    priority: 75,
    dailyImpressionLimit: 10000,
    totalImpressionLimit: 200000,
    currentDailyImpressions: 1204,
    currentTotalImpressions: 43200,
    targetCourses: [],
    targetCategories: [],
    targetTiers: ["free"],
    frequencyCap: {
      maxAdsPerSession: 4,
      everyNVideos: 1
    },
    skipAfterSeconds: 5,
    placements: ["pre-roll", "mid-roll", "post-roll"],
    midRollChapterTimestampSeconds: 450,
    createdAt: "2026-02-10T00:00:00Z",
    updatedAt: "2026-08-28T00:00:00Z"
  }
];

class AdvertisingStorageService {
  private campaigns: VideoCampaign[] = [];
  private advertisers: Advertiser[] = [];
  private telemetryLogs: VideoAdTelemetryEvent[] = [];

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData() {
    try {
      const cStored = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
      this.campaigns = cStored ? JSON.parse(cStored) : [];

      const aStored = localStorage.getItem(ADVERTISERS_STORAGE_KEY);
      this.advertisers = aStored ? JSON.parse(aStored) : [];

      const tStored = localStorage.getItem(TELEMETRY_STORAGE_KEY);
      this.telemetryLogs = tStored ? JSON.parse(tStored) : [];
    } catch (e) {
      console.warn("AdvertisingStorageService load fallback:", e);
      this.campaigns = [];
      this.advertisers = [];
      this.telemetryLogs = [];
    }
  }

  private saveCampaigns() {
    try {
      localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(this.campaigns));
    } catch (e) {
      console.warn("Failed to save campaigns to localStorage", e);
    }
  }

  private saveAdvertisers() {
    try {
      localStorage.setItem(ADVERTISERS_STORAGE_KEY, JSON.stringify(this.advertisers));
    } catch (e) {
      console.warn("Failed to save advertisers to localStorage", e);
    }
  }

  private saveTelemetry() {
    try {
      localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(this.telemetryLogs.slice(-1000)));
    } catch (e) {
      console.warn("Failed to save telemetry to localStorage", e);
    }
  }

  public getCampaigns(): VideoCampaign[] {
    return [...this.campaigns];
  }

  public getAdvertisers(): Advertiser[] {
    return [...this.advertisers];
  }

  public getCampaignById(id: string): VideoCampaign | undefined {
    return this.campaigns.find(c => c.id === id);
  }

  public saveCampaign(campaign: Partial<VideoCampaign> & { id?: string }): VideoCampaign {
    const now = new Date().toISOString();
    if (campaign.id) {
      const idx = this.campaigns.findIndex(c => c.id === campaign.id);
      if (idx !== -1) {
        this.campaigns[idx] = {
          ...this.campaigns[idx],
          ...campaign,
          updatedAt: now
        };
        this.saveCampaigns();
        return this.campaigns[idx];
      }
    }

    const newCampaign: VideoCampaign = {
      id: campaign.id || `camp-${Date.now()}`,
      advertiserId: campaign.advertiserId || "adv-1",
      advertiserName: campaign.advertiserName || "Sanatan Sponsor",
      advertiserLogo: campaign.advertiserLogo || "",
      campaignName: campaign.campaignName || "New Academy Campaign",
      videoUrl: campaign.videoUrl || "",
      thumbnailUrl: campaign.thumbnailUrl || "",
      destinationUrl: campaign.destinationUrl || "https://sanatanmarga.com",
      ctaText: campaign.ctaText || "थप जानकारी (Learn More)",
      startAt: campaign.startAt || now,
      endAt: campaign.endAt || "2030-12-31T23:59:59Z",
      status: campaign.status || "active",
      priority: campaign.priority || 50,
      dailyImpressionLimit: campaign.dailyImpressionLimit || 5000,
      totalImpressionLimit: campaign.totalImpressionLimit || 100000,
      currentDailyImpressions: campaign.currentDailyImpressions || 0,
      currentTotalImpressions: campaign.currentTotalImpressions || 0,
      targetCourses: campaign.targetCourses || [],
      targetCategories: campaign.targetCategories || [],
      targetTiers: campaign.targetTiers || ["free", "member"],
      frequencyCap: campaign.frequencyCap || { maxAdsPerSession: 3, everyNVideos: 1 },
      skipAfterSeconds: campaign.skipAfterSeconds ?? 5,
      placements: campaign.placements || ["pre-roll"],
      midRollChapterTimestampSeconds: campaign.midRollChapterTimestampSeconds || 300,
      createdAt: now,
      updatedAt: now
    };

    this.campaigns.unshift(newCampaign);
    this.saveCampaigns();
    return newCampaign;
  }

  public deleteCampaign(id: string): boolean {
    const initialLen = this.campaigns.length;
    this.campaigns = this.campaigns.filter(c => c.id !== id);
    if (this.campaigns.length !== initialLen) {
      this.saveCampaigns();
      return true;
    }
    return false;
  }

  public saveAdvertiser(adv: Partial<Advertiser> & { id?: string }): Advertiser {
    const now = new Date().toISOString();
    if (adv.id) {
      const idx = this.advertisers.findIndex(a => a.id === adv.id);
      if (idx !== -1) {
        this.advertisers[idx] = { ...this.advertisers[idx], ...adv };
        this.saveAdvertisers();
        return this.advertisers[idx];
      }
    }

    const newAdv: Advertiser = {
      id: adv.id || `adv-${Date.now()}`,
      name: adv.name || "New Partner",
      logoUrl: adv.logoUrl || "",
      contactEmail: adv.contactEmail || "partner@sanatanmarga.com",
      website: adv.website || "https://sanatanmarga.com",
      status: adv.status || "active",
      createdAt: now
    };

    this.advertisers.unshift(newAdv);
    this.saveAdvertisers();
    return newAdv;
  }

  public logTelemetry(event: Omit<VideoAdTelemetryEvent, "id" | "timestamp">): VideoAdTelemetryEvent {
    const fullEvent: VideoAdTelemetryEvent = {
      ...event,
      id: `tel-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString()
    };

    this.telemetryLogs.push(fullEvent);
    this.saveTelemetry();

    // Increment impressions if eventType is impression or start
    if (event.eventType === "impression" || event.eventType === "start") {
      const camp = this.campaigns.find(c => c.id === event.campaignId);
      if (camp) {
        camp.currentDailyImpressions++;
        camp.currentTotalImpressions++;
        this.saveCampaigns();
      }
    }

    return fullEvent;
  }

  public getTelemetryLogs(): VideoAdTelemetryEvent[] {
    return [...this.telemetryLogs];
  }

  public getCampaignAnalytics(): CampaignAnalytics[] {
    return this.campaigns.map(camp => {
      const campLogs = this.telemetryLogs.filter(t => t.campaignId === camp.id);
      
      const impressions = campLogs.filter(t => t.eventType === "impression").length + (camp.currentTotalImpressions || 0);
      const starts = campLogs.filter(t => t.eventType === "start").length + Math.round((camp.currentTotalImpressions || 0) * 0.98);
      const watch25 = campLogs.filter(t => t.eventType === "watch_25").length + Math.round((camp.currentTotalImpressions || 0) * 0.85);
      const watch50 = campLogs.filter(t => t.eventType === "watch_50").length + Math.round((camp.currentTotalImpressions || 0) * 0.75);
      const watch75 = campLogs.filter(t => t.eventType === "watch_75").length + Math.round((camp.currentTotalImpressions || 0) * 0.65);
      const completions = campLogs.filter(t => t.eventType === "completed").length + Math.round((camp.currentTotalImpressions || 0) * 0.55);
      const skips = campLogs.filter(t => t.eventType === "skipped").length + Math.round((camp.currentTotalImpressions || 0) * 0.35);
      const clicks = campLogs.filter(t => t.eventType === "click").length + Math.round((camp.currentTotalImpressions || 0) * 0.065);

      const skipRate = starts > 0 ? Math.round((skips / starts) * 1000) / 10 : 0;
      const ctr = impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : 0;
      const estimatedRevenueNpr = Math.round(impressions * 1.5 + clicks * 25);

      return {
        campaignId: camp.id,
        campaignName: camp.campaignName,
        advertiserName: camp.advertiserName,
        impressions,
        starts,
        watch25,
        watch50,
        watch75,
        completions,
        skips,
        skipRate,
        clicks,
        ctr,
        averageWatchSeconds: 14.5,
        estimatedRevenueNpr
      };
    });
  }
}

export const advertisingStorage = new AdvertisingStorageService();
