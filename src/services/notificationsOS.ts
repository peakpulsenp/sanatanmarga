/**
 * SANATANMARGA 5.0 BETA — CLIENT NOTIFICATIONS OS SERVICE
 * Phase 3A: Client-side orchestrator for Public Announcements, Private Inbox, Offline Cache, Push Token Sync & Exact Resolution
 */

import {
  NotificationItem,
  NotificationInboxResponse,
  NotificationFilterOptions
} from "../types/notifications";
import { resolveCanonicalDestination } from "./canonicalDestinationResolver";

const PUBLIC_ANNOUNCEMENTS_STORAGE_KEY = "sm_public_announcements_cache_v5";
const USER_INBOX_STORAGE_KEY_PREFIX = "sm_user_inbox_cache_v5_";

class ClientNotificationsOS {
  private localAnnouncements: NotificationItem[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.restoreOfflineAnnouncements();
  }

  private restoreOfflineAnnouncements() {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(PUBLIC_ANNOUNCEMENTS_STORAGE_KEY);
        if (stored) {
          this.localAnnouncements = JSON.parse(stored);
        }
      }
    } catch (e) {
      console.warn("[NotificationsOS] Could not restore local announcements cache:", e);
    }
  }

  private persistOfflineAnnouncements(items: NotificationItem[]) {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(PUBLIC_ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(items));
      }
    } catch (e) {
      console.warn("[NotificationsOS] Could not persist offline announcements cache:", e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error("[NotificationsOS] Listener error:", err);
      }
    });
  }

  private inFlightAnnouncementsPromise: Promise<NotificationItem[]> | null = null;
  private lastAnnouncementsFetchTime = 0;
  private lastNetworkFailureTime = 0;
  private readonly FAILURE_BACKOFF_MS = 15000; // 15s backoff after network failure
  private requestCounter = 0;

  /**
   * Fetch public announcements (Snapshot cache with offline fallback & in-flight request coalescing)
   */
  public async getPublicAnnouncements(options?: { limit?: number; reason?: string }): Promise<NotificationItem[]> {
    const now = Date.now();
    const isOnline = typeof navigator === "undefined" || navigator.onLine;

    // 1. If offline, immediately return local offline cache without attempting network
    if (!isOnline) {
      return this.localAnnouncements;
    }

    // 2. If we recently encountered a network failure, serve offline cache during backoff window
    if (now - this.lastNetworkFailureTime < this.FAILURE_BACKOFF_MS) {
      return this.localAnnouncements;
    }

    // 3. Coalesce concurrent in-flight requests (joins existing shared promise)
    if (this.inFlightAnnouncementsPromise) {
      return this.inFlightAnnouncementsPromise;
    }

    const reqId = ++this.requestCounter;
    const reqUrl = "/api/notifications/announcements?limit=" + (options?.limit || 20);

    this.inFlightAnnouncementsPromise = (async () => {
      try {
        const res = await fetch(reqUrl);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data.items || [];
          this.localAnnouncements = items;
          this.persistOfflineAnnouncements(items);
          this.lastAnnouncementsFetchTime = Date.now();
          return items;
        } else {
          this.lastNetworkFailureTime = Date.now();
          console.warn(`[NotificationsOS] HTTP ${res.status} for ${reqUrl}, serving offline cache`);
        }
      } catch (err) {
        this.lastNetworkFailureTime = Date.now();
        console.warn(`[NotificationsOS] Network fetch failed (req #${reqId}) for ${reqUrl}, using offline fallback:`, err);
      } finally {
        this.inFlightAnnouncementsPromise = null;
      }

      // Try local pre-built snapshot fallback
      try {
        const snapRes = await fetch("/snapshots/announcements.json");
        if (snapRes.ok) {
          const snapData = await snapRes.json();
          const items = Array.isArray(snapData) ? snapData : snapData.items || [];
          this.localAnnouncements = items;
          this.persistOfflineAnnouncements(items);
          return items;
        }
      } catch {
        // Ignore snapshot fetch error
      }

      return this.localAnnouncements;
    })();

    return this.inFlightAnnouncementsPromise;
  }

  /**
   * Fetch user's private inbox
   */
  public async getUserInbox(
    userId: string,
    options?: NotificationFilterOptions
  ): Promise<NotificationInboxResponse> {
    const storageKey = `${USER_INBOX_STORAGE_KEY_PREFIX}${userId}`;
    let cachedItems: NotificationItem[] = [];

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          cachedItems = JSON.parse(stored);
        }
      } catch (e) {
        console.warn("[NotificationsOS] Offline inbox read error:", e);
      }
    }

    try {
      const query = new URLSearchParams();
      if (options?.unreadOnly) query.append("unreadOnly", "true");
      if (options?.limit) query.append("limit", options.limit.toString());
      if (options?.offset) query.append("offset", options.offset.toString());

      const res = await fetch(`/api/notifications/inbox/${encodeURIComponent(userId)}?${query.toString()}`);
      if (res.ok) {
        const data: NotificationInboxResponse = await res.json();
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(data.items));
        }
        return data;
      }
    } catch (err) {
      console.warn("[NotificationsOS] Failed to fetch live inbox, serving offline cache:", err);
    }

    const unreadCount = cachedItems.filter((i) => !i.isRead).length;
    return {
      items: cachedItems,
      unreadCount,
      totalCount: cachedItems.length,
      hasMore: false
    };
  }

  /**
   * Mark single notification as read
   */
  public async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    const storageKey = `${USER_INBOX_STORAGE_KEY_PREFIX}${userId}`;
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const items: NotificationItem[] = JSON.parse(stored);
          const target = items.find((i) => i.id === notificationId);
          if (target) {
            target.isRead = true;
            target.readAt = new Date().toISOString();
            localStorage.setItem(storageKey, JSON.stringify(items));
          }
        }
      }
    } catch {
      // Ignore
    }

    try {
      const res = await fetch(`/api/notifications/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, notificationId })
      });
      this.notify();
      return res.ok;
    } catch {
      this.notify();
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  public async markAllAsRead(userId: string): Promise<boolean> {
    const storageKey = `${USER_INBOX_STORAGE_KEY_PREFIX}${userId}`;
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const items: NotificationItem[] = JSON.parse(stored);
          items.forEach((i) => {
            i.isRead = true;
            i.readAt = new Date().toISOString();
          });
          localStorage.setItem(storageKey, JSON.stringify(items));
        }
      }
    } catch {
      // Ignore
    }

    try {
      const res = await fetch(`/api/notifications/read-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      this.notify();
      return res.ok;
    } catch {
      this.notify();
      return false;
    }
  }

  /**
   * Register push device
   */
  public async registerPushDevice(data: {
    userId?: string;
    deviceToken: string;
    platform?: "web" | "android" | "ios";
    topics?: string[];
  }): Promise<{ success: boolean; registrationId?: string }> {
    try {
      const res = await fetch("/api/notifications/devices/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.userId,
          deviceToken: data.deviceToken,
          platform: data.platform || "web",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          topics: data.topics || ["announcements", "articles"]
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error("[NotificationsOS] Push device registration error:", err);
    }
    return { success: false };
  }

  /**
   * Unregister push device
   */
  public async unregisterPushDevice(userId: string | undefined, deviceToken: string): Promise<boolean> {
    try {
      const res = await fetch("/api/notifications/devices/unregister", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, deviceToken })
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Resolve exact canonical destination URL for item
   */
  public getCanonicalUrl(item: NotificationItem | { entityType: string; entityId: string }): string {
    const res = resolveCanonicalDestination({
      entityType: item.entityType,
      entityId: item.entityId
    });
    return res.canonicalUrl;
  }
}

export const notificationsOS = new ClientNotificationsOS();
