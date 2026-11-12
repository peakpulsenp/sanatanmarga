import type { Ad } from "@/src/types";

export interface TelemetryMetrics {
  cacheHitCount: number;
  cacheMissCount: number;
  impressionCount: number;
  clickCount: number;
  suppressedPremiumCount: number;
  suppressedStatusCount: number;
  suppressedFrequencyCount: number;
  houseAdCount: number;
  noInventoryCount: number;
}

class AdInventoryCacheService {
  private cache: Ad[] = [];
  private lastUpdated: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

  private telemetry: TelemetryMetrics = {
    cacheHitCount: 0,
    cacheMissCount: 0,
    impressionCount: 0,
    clickCount: 0,
    suppressedPremiumCount: 0,
    suppressedStatusCount: 0,
    suppressedFrequencyCount: 0,
    houseAdCount: 0,
    noInventoryCount: 0
  };

  /**
   * Gets cached inventory if valid, tracking cache hit/miss telemetry.
   */
  public getInventory(): Ad[] | null {
    if (this.cache.length > 0 && Date.now() - this.lastUpdated < this.CACHE_TTL_MS) {
      this.incrementTelemetry("cacheHitCount");
      return this.cache;
    }

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("sanatan_ad_inventory_cache");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.cache = parsed;
            this.lastUpdated = Date.now();
            this.incrementTelemetry("cacheHitCount");
            return this.cache;
          }
        }
      } catch (e) {
        // Fallback to cache miss
      }
    }

    this.incrementTelemetry("cacheMissCount");
    return null;
  }

  /**
   * Explicitly sets the active ad inventory cache.
   */
  public setInventory(ads: Ad[]): void {
    const activeAds = ads.filter((a) => a.isActive && a.status === "active");
    this.cache = activeAds;
    this.lastUpdated = Date.now();

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sanatan_ad_inventory_cache", JSON.stringify(activeAds));
      } catch (e) {
        // Ignore storage errors
      }
    }
  }

  /**
   * Invalidates cache immediately upon campaign status update or approval.
   */
  public invalidateCache(): void {
    this.cache = [];
    this.lastUpdated = 0;
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("sanatan_ad_inventory_cache");
      } catch (e) {
        // Ignore
      }
    }
  }

  /**
   * Tracks telemetric events for system health monitoring.
   */
  public incrementTelemetry(key: keyof TelemetryMetrics): void {
    if (this.telemetry[key] !== undefined) {
      this.telemetry[key] += 1;
    }
  }

  /**
   * Returns current telemetry snapshot.
   */
  public getTelemetry(): TelemetryMetrics {
    return { ...this.telemetry };
  }

  /**
   * Resets telemetry counters.
   */
  public resetTelemetry(): void {
    this.telemetry = {
      cacheHitCount: 0,
      cacheMissCount: 0,
      impressionCount: 0,
      clickCount: 0,
      suppressedPremiumCount: 0,
      suppressedStatusCount: 0,
      suppressedFrequencyCount: 0,
      houseAdCount: 0,
      noInventoryCount: 0
    };
  }
}

export const adInventoryCache = new AdInventoryCacheService();
