import type { ReaderPreferences } from "@/src/types";

const STORAGE_KEY = "sanatan_reader_preferences_v1";

const DEFAULT_PREFERENCES: ReaderPreferences = {
  followedDistricts: ["काठमाडौं", "कास्की"],
  followedEntityIds: ["ent-cabinet-nepal", "ent-mof-nepal", "ent-supreme-court-nepal"],
  followedStoryArcIds: ["arc-tourism-policy-2026", "arc-hydropower-transmission-line-2026"],
  followedCategories: ["politics", "economy", "sanatan"],
  readingSpeedWpm: 220,
  offlineSyncEnabled: true,
  newsletterSubscribed: true,
  dailyDigestTime: "06:00"
};

export class ReaderPreferencesService {
  public static getPreferences(): ReaderPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn("Could not read reader preferences:", e);
    }
    return DEFAULT_PREFERENCES;
  }

  public static savePreferences(prefs: Partial<ReaderPreferences>): ReaderPreferences {
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save reader preferences:", e);
    }
    return updated;
  }

  public static toggleDistrict(district: string): ReaderPreferences {
    const prefs = this.getPreferences();
    const exists = prefs.followedDistricts.includes(district);
    const updatedDistricts = exists
      ? prefs.followedDistricts.filter(d => d !== district)
      : [...prefs.followedDistricts, district];
    return this.savePreferences({ followedDistricts: updatedDistricts });
  }

  public static toggleEntity(entityId: string): ReaderPreferences {
    const prefs = this.getPreferences();
    const exists = prefs.followedEntityIds.includes(entityId);
    const updatedEntities = exists
      ? prefs.followedEntityIds.filter(id => id !== entityId)
      : [...prefs.followedEntityIds, entityId];
    return this.savePreferences({ followedEntityIds: updatedEntities });
  }

  public static toggleStoryArc(arcId: string): ReaderPreferences {
    const prefs = this.getPreferences();
    const exists = prefs.followedStoryArcIds.includes(arcId);
    const updatedArcs = exists
      ? prefs.followedStoryArcIds.filter(id => id !== arcId)
      : [...prefs.followedStoryArcIds, arcId];
    return this.savePreferences({ followedStoryArcIds: updatedArcs });
  }
}
