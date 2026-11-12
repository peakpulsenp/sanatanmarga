import type { Query, DocumentReference, QuerySnapshot, DocumentSnapshot, DocumentData } from './firebase';

export interface QueryMetrics {
  queryName: string;
  count: number;
  lastTimestamp: number;
  source: "network" | "cache" | "unknown";
  avgDuration: number;
}

export interface UsageStats {
  dailyNetworkReads: number;
  dailyNetworkWrites: number;
  quotaRecoveries: number;
  offlineRecoveries: number;
  lastResetDate: string; // YYYY-MM-DD
}

class TelemetryTracker {
  metrics: Record<string, QueryMetrics> = {};
  usage: UsageStats = {
    dailyNetworkReads: 0,
    dailyNetworkWrites: 0,
    quotaRecoveries: 0,
    offlineRecoveries: 0,
    lastResetDate: new Date().toISOString().split('T')[0]
  };

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const storedMetrics = localStorage.getItem('firestore_telemetry');
      if (storedMetrics) {
        this.metrics = JSON.parse(storedMetrics);
      }
      
      const storedUsage = localStorage.getItem('firestore_usage');
      if (storedUsage) {
        const parsed = JSON.parse(storedUsage);
        this.usage = {
          dailyNetworkReads: parsed.dailyNetworkReads || 0,
          dailyNetworkWrites: parsed.dailyNetworkWrites || 0,
          quotaRecoveries: parsed.quotaRecoveries || 0,
          offlineRecoveries: parsed.offlineRecoveries || 0,
          lastResetDate: parsed.lastResetDate || new Date().toISOString().split('T')[0]
        };
        this.checkReset();
      }
    } catch (e) {}
  }

  private checkReset() {
    const today = new Date().toISOString().split('T')[0];
    if (this.usage.lastResetDate !== today) {
      this.usage.dailyNetworkReads = 0;
      this.usage.dailyNetworkWrites = 0;
      this.usage.quotaRecoveries = 0;
      this.usage.offlineRecoveries = 0;
      this.usage.lastResetDate = today;
      this.saveUsage();
    }
    if (this.usage.dailyNetworkReads === undefined) this.usage.dailyNetworkReads = 0;
    if (this.usage.dailyNetworkWrites === undefined) this.usage.dailyNetworkWrites = 0;
    if (this.usage.quotaRecoveries === undefined) this.usage.quotaRecoveries = 0;
    if (this.usage.offlineRecoveries === undefined) this.usage.offlineRecoveries = 0;
  }

  private saveUsage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('firestore_usage', JSON.stringify(this.usage));
    } catch (e) {}
  }

  trackQuotaRecovery() {
    this.checkReset();
    this.usage.quotaRecoveries += 1;
    this.saveUsage();
  }

  trackOfflineRecovery() {
    this.checkReset();
    this.usage.offlineRecoveries += 1;
    this.saveUsage();
  }

  getQuotaRecoveries() {
    this.checkReset();
    return this.usage.quotaRecoveries;
  }

  getOfflineRecoveries() {
    this.checkReset();
    return this.usage.offlineRecoveries;
  }

  trackDashboardHit(source: "cache" | "network") {
    this.checkReset();
    if (!this.metrics["dashboard_load"]) {
      this.metrics["dashboard_load"] = { queryName: "dashboard_load", count: 0, lastTimestamp: 0, source, avgDuration: 0 };
    }
    const m = this.metrics["dashboard_load"];
    m.count += 1;
    m.lastTimestamp = Date.now();
    m.source = source;

    if (source === "network") {
      this.usage.dailyNetworkReads += 1;
      this.saveUsage();
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("firestore_telemetry", JSON.stringify(this.metrics));
      } catch (e) {}
    }
  }

  getDashboardHitStats() {
    const m = this.metrics["dashboard_load"];
    return {
      totalLoads: m ? m.count : 0,
      lastSource: m ? m.source : "none",
      lastTimestamp: m ? m.lastTimestamp : 0
    };
  }

  trackRead(queryName: string, duration: number, source: "network" | "cache" | "unknown" = "unknown", docCount: number = 1) {
    if (!this.metrics[queryName]) {
      this.metrics[queryName] = { queryName, count: 0, lastTimestamp: 0, source, avgDuration: 0 };
    }
    const m = this.metrics[queryName];
    m.count += 1;
    m.lastTimestamp = Date.now();
    m.source = source;
    m.avgDuration = ((m.avgDuration * (m.count - 1)) + duration) / m.count;

    if (source === 'network') {
      this.checkReset();
      this.usage.dailyNetworkReads += docCount;
      this.saveUsage();
      
      // Notify budget changes
      window.dispatchEvent(new CustomEvent('firestore-usage-updated', { 
        detail: { 
          reads: this.usage.dailyNetworkReads,
          writes: this.usage.dailyNetworkWrites
        } 
      }));
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('firestore_telemetry', JSON.stringify(this.metrics));
      } catch (e) {}
    }
  }

  trackWrite() {
    this.checkReset();
    this.usage.dailyNetworkWrites += 1;
    this.saveUsage();
    
    window.dispatchEvent(new CustomEvent('firestore-usage-updated', { 
      detail: { 
        reads: this.usage.dailyNetworkReads,
        writes: this.usage.dailyNetworkWrites
      } 
    }));
  }

  getMetrics() {
    return Object.values(this.metrics).sort((a, b) => b.count - a.count);
  }

  getDailyNetworkReads() {
    this.checkReset();
    return this.usage.dailyNetworkReads;
  }

  getDailyNetworkWrites() {
    this.checkReset();
    return this.usage.dailyNetworkWrites;
  }
  
  clear() {
    this.metrics = {};
    this.usage.dailyNetworkReads = 0;
    this.usage.dailyNetworkWrites = 0;
    this.usage.quotaRecoveries = 0;
    this.usage.offlineRecoveries = 0;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('firestore_telemetry');
      localStorage.removeItem('firestore_usage');
    }
  }
}

export const telemetry = new TelemetryTracker();
