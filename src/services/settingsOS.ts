import { doc, getDoc } from "@/src/lib/firebase";
import { db, getDocWithCacheFallback } from "@/src/lib/firebase";
import { setDocWithQueue, offlineQueue } from "@/src/lib/offlineQueue";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { resetRotatingAiCache } from "@/src/services/rotatingAiService";

export interface SiteSettings {
  settingsVersion?: number;
  lastUpdated?: string;
  logoUrl: string;
  logoVerticalUrl?: string;
  siteName: string;
  siteTagline: string;
  brandSlogan: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  copyrightText?: string;
  footerText?: string;
  developerText?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  aboutUs?: string;
  contactUs?: string;
  termsContent?: string;
  privacyContent?: string;
  liveVideoUrl?: string;
  liveVideoType?: "youtube" | "facebook";
  sponsoredAds?: (string | { text: string; link?: string })[];
  adSenseClient?: string;
  adSenseSlot?: string;
  splashBgColor?: string;
  cornerRadius?: number;
  categoryHeroRadius?: number;
  postCardRadius?: number;
  tickerSpeed?: number;
  theme?: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    cornerRadius: number;
    categoryHeroRadius: number;
    postCardRadius?: number;
    tickerSpeed?: number;
  };
  aiNewsroomEnabled?: boolean;
  nepalHubEnabled?: boolean;
  saraswatiGraphEnabled?: boolean;
  chautariEnabled?: boolean;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  settingsVersion: 1,
  lastUpdated: new Date().toISOString(),
  logoUrl: "/logo.svg",
  logoVerticalUrl: "/logo-vertical.png",
  siteName: "सनातन मार्ग",
  siteTagline: "Media & News Portal",
  brandSlogan: "सत्य, तथ्य र निष्पक्ष समाचार",
  siteDescription: "सत्य, तथ्य र निष्पक्ष समाचार पोर्टल",
  contactEmail: "info@sanatanmarga.com",
  contactPhone: "+977-9705125527",
  address: "काठमाडौं, नेपाल",
  copyrightText: "© २०२६ Sanatan Marga। सर्वाधिकार सुरक्षित।",
  facebookUrl: "https://www.facebook.com/Sanatanmarga",
  twitterUrl: "https://x.com/Sanatanmarga",
  instagramUrl: "https://www.instagram.com/omsanatanmarga/",
  youtubeUrl: "https://www.youtube.com/@omSanatanMarga",
  developerText: "Milijuli Solutions",
  aiNewsroomEnabled: true,
  nepalHubEnabled: true,
  saraswatiGraphEnabled: true,
  chautariEnabled: true,
  theme: {
    primaryColor: "#D9381E",
    accentColor: "#F5A623",
    fontFamily: "Hind Siliguri",
    cornerRadius: 2,
    categoryHeroRadius: 40,
    postCardRadius: 24,
    tickerSpeed: 30,
  }
};

class SettingsOSManager {
  private localSettingsVersion = 1;
  private lastSyncTimestamp = new Date().toISOString();

  constructor() {
    this.loadLocalVersion();
  }

  private loadLocalVersion() {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("sg_site_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.settingsVersion === "number") {
          this.localSettingsVersion = parsed.settingsVersion;
        }
        if (parsed.lastUpdated) {
          this.lastSyncTimestamp = parsed.lastUpdated;
        }
      }
    } catch (e) {}
  }

  public getLocalSettingsVersion(): number {
    return this.localSettingsVersion;
  }

  public getLastSyncTimestamp(): string {
    return this.lastSyncTimestamp;
  }

  /**
   * Purges all local settings & cache keys
   */
  public purgeLocalSettingsCache() {
    if (typeof window === "undefined") return;
    try {
      const keysToPurge = [
        "sg_site_settings",
        "sg_site_theme",
        "adbanner_site_settings",
        "style_provider_site_settings",
        "sg_cache_settings_site",
        "sg_cache_settings_keys"
      ];
      
      keysToPurge.forEach(k => localStorage.removeItem(k));

      // Also clear any dynamic sg_cache_* matching settings
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes("settings") || key.includes("site_config"))) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {}

    // Reset rotating AI keys cache
    resetRotatingAiCache();

    // Clear snapshot engine memory cache
    snapshotEngine.clearCache();
  }

  /**
   * Saves settings with version incrementing & cache invalidation
   */
  public async saveSettings(
    newSettings: Partial<SiteSettings>,
    keysData?: {
      geminiApiKey?: string;
      openaiApiKey?: string;
      stabilityApiKey?: string;
      rotatingGeminiKeys?: string[];
    }
  ): Promise<{ success: boolean; version: number }> {
    try {
      // 1. Calculate next settings version
      let currentVersion = this.localSettingsVersion;
      try {
        const siteDoc = await getDoc(doc(db, "settings", "site"));
        if (siteDoc.exists() && typeof siteDoc.data()?.settingsVersion === "number") {
          currentVersion = siteDoc.data()?.settingsVersion;
        }
      } catch (e) {}

      const nextVersion = currentVersion + 1;
      const nowIso = new Date().toISOString();

      const mergedSettings: SiteSettings = {
        ...DEFAULT_SITE_SETTINGS,
        ...newSettings,
        settingsVersion: nextVersion,
        lastUpdated: nowIso
      };

      // 2. Queue Firestore writes
      await setDocWithQueue(doc(db, "settings", "site"), mergedSettings, { merge: true });

      if (keysData) {
        await setDocWithQueue(doc(db, "settings", "keys"), {
          ...keysData,
          settingsVersion: nextVersion,
          lastUpdated: nowIso
        }, { merge: true });
      }

      // 3. Purge cache & update local version tracking
      this.purgeLocalSettingsCache();
      this.localSettingsVersion = nextVersion;
      this.lastSyncTimestamp = nowIso;

      try {
        localStorage.setItem("sg_site_settings", JSON.stringify(mergedSettings));
      } catch (e) {}

      // 4. Broadcast events across components
      window.dispatchEvent(new CustomEvent("site-settings-updated", { detail: mergedSettings }));
      window.dispatchEvent(new CustomEvent("snapshot-rebuilt", { detail: { settingsVersion: nextVersion } }));
      
      // Trigger Snapshot Rebuild on server
      await snapshotEngine.triggerPublishRebuild("admin_settings_os");

      return { success: true, version: nextVersion };
    } catch (err) {
      console.error("SettingsOS: Save failed:", err);
      return { success: false, version: this.localSettingsVersion };
    }
  }

  /**
   * Force purge local cache & fetch fresh settings from Firestore
   */
  public async forcePurgeAndResync(): Promise<{
    success: boolean;
    settings: SiteSettings;
    version: number;
    message: string;
  }> {
    this.purgeLocalSettingsCache();

    let freshSettings: SiteSettings = { ...DEFAULT_SITE_SETTINGS };
    try {
      const siteDocRef = doc(db, "settings", "site");
      const siteSnap = await getDocWithCacheFallback(siteDocRef, `site_settings_force_${Date.now()}`);
      
      if (siteSnap.exists()) {
        const data = siteSnap.data();
        freshSettings = {
          ...DEFAULT_SITE_SETTINGS,
          ...data,
          settingsVersion: data.settingsVersion || (this.localSettingsVersion + 1),
          lastUpdated: data.lastUpdated || new Date().toISOString()
        };
      }

      this.localSettingsVersion = freshSettings.settingsVersion || 1;
      this.lastSyncTimestamp = freshSettings.lastUpdated || new Date().toISOString();

      try {
        localStorage.setItem("sg_site_settings", JSON.stringify(freshSettings));
      } catch (e) {}

      window.dispatchEvent(new CustomEvent("site-settings-updated", { detail: freshSettings }));
      window.dispatchEvent(new CustomEvent("snapshot-rebuilt", { detail: { settingsVersion: this.localSettingsVersion } }));

      return {
        success: true,
        settings: freshSettings,
        version: this.localSettingsVersion,
        message: `Settings cache purged & re-synced! Version ${this.localSettingsVersion} is now active.`
      };
    } catch (err: any) {
      console.error("SettingsOS: Force purge & re-sync error:", err);
      return {
        success: false,
        settings: freshSettings,
        version: this.localSettingsVersion,
        message: `Re-sync failed: ${err.message || String(err)}`
      };
    }
  }

  /**
   * Telemetry stats for Admin Governance Dashboard
   */
  public async getSettingsHealthTelemetry(): Promise<{
    firestoreVersion: number;
    localVersion: number;
    status: "HEALTHY" | "STALE_CACHE" | "SYNC_PENDING";
    lastSyncTime: string;
    pendingQueueCount: number;
  }> {
    let firestoreVersion = this.localSettingsVersion;
    try {
      const siteDoc = await getDoc(doc(db, "settings", "site"));
      if (siteDoc.exists() && typeof siteDoc.data()?.settingsVersion === "number") {
        firestoreVersion = siteDoc.data()?.settingsVersion;
      }
    } catch (e) {}

    const pendingCount = offlineQueue.getPendingCount();
    let status: "HEALTHY" | "STALE_CACHE" | "SYNC_PENDING" = "HEALTHY";

    if (pendingCount > 0) {
      status = "SYNC_PENDING";
    } else if (firestoreVersion > this.localSettingsVersion) {
      status = "STALE_CACHE";
    }

    return {
      firestoreVersion,
      localVersion: this.localSettingsVersion,
      status,
      lastSyncTime: this.lastSyncTimestamp,
      pendingQueueCount: pendingCount
    };
  }
}

export const settingsOS = new SettingsOSManager();
