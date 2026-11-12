/**
 * SANATANMARGA 5.0 BETA — PHASE 3C
 * Client Reader Activity OS 5.0
 * 
 * Local-first, privacy-conscious reader activity tracking,
 * coarse progress milestones, background-safe dwell accumulation,
 * bounded event buffering, and continuation foundations.
 */

import {
  ReaderActivityEvent,
  ReaderActivityEventType,
  ReadProgressMilestone,
  DwellTimeBucket,
  DeviceClass,
  ContinueReadingItem,
  ReadingHistoryItem,
  AudienceIngestBatchRequest
} from "@/src/types/readerActivity";

export class ReaderActivityOS {
  private localQueue: ReaderActivityEvent[] = [];
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly FLUSH_BATCH_SIZE = 10;
  private readonly INACTIVITY_SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  private anonymousId: string | null = null;
  private sessionId: string | null = null;
  private sessionLastActive: number = 0;
  private currentUserId: string | null = null;

  // Active Dwell & Milestone Deduplication state
  private activeArticleId: string | null = null;
  private activeArticleStartTime: number = 0;
  private activeArticleDwellSeconds: number = 0;
  private activeDwellInterval: any = null;
  private recordedMilestones = new Set<string>(); // key: `${sessionId}_${articleId}_${milestone}`
  private recordedCompletions = new Set<string>(); // key: `${sessionId}_${articleId}`
  private recordedOpens = new Set<string>(); // key: `${sessionId}_${articleId}`
  private recordedPageViews = new Set<string>(); // key: `${sessionId}_${route}`

  private isTabVisible: boolean = true;
  private flushTimer: any = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.initClientState();
    }
  }

  private initClientState() {
    this.isTabVisible = typeof document !== "undefined" ? document.visibilityState === "visible" : true;

    // Listen for tab visibility changes to pause/resume active dwell
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        const visible = document.visibilityState === "visible";
        this.isTabVisible = visible;
        if (!visible) {
          this.flushBuffer();
        }
      });
    }

    // Periodic flush timer (every 25 seconds)
    this.flushTimer = setInterval(() => {
      this.flushBuffer();
    }, 25000);

    // Load queued events from localStorage if any
    try {
      const saved = localStorage.getItem("sanatan_activity_queue");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.localQueue = parsed.slice(-this.MAX_QUEUE_SIZE);
        }
      }
    } catch (e) {}
  }

  // --- IDENTITY & SESSION MANAGEMENT ---
  public getOrCreateAnonymousId(): string {
    if (this.anonymousId) return this.anonymousId;
    if (typeof window === "undefined") return "server_anon";

    try {
      const stored = localStorage.getItem("sanatan_anon_id");
      if (stored && stored.length > 10) {
        this.anonymousId = stored;
        return stored;
      }
    } catch (e) {}

    // Generate random, non-fingerprinted UUID
    const randomId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `anon_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;

    this.anonymousId = randomId;
    try {
      localStorage.setItem("sanatan_anon_id", randomId);
    } catch (e) {}

    return randomId;
  }

  public rotateAnonymousId(): string {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("sanatan_anon_id");
      } catch (e) {}
    }
    this.anonymousId = null;
    return this.getOrCreateAnonymousId();
  }

  public getSessionId(): string {
    const now = Date.now();
    if (this.sessionId && (now - this.sessionLastActive) < this.INACTIVITY_SESSION_TIMEOUT_MS) {
      this.sessionLastActive = now;
      return this.sessionId;
    }

    // Rotate session token
    this.sessionId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `sess_${Math.random().toString(36).substring(2)}${now.toString(36)}`;
    this.sessionLastActive = now;
    return this.sessionId;
  }

  public setUser(userId: string | null) {
    if (this.currentUserId !== userId) {
      // Partition boundary: user switch detected
      this.currentUserId = userId;
      // Do not leak user A session milestones to user B
      this.recordedMilestones.clear();
      this.recordedCompletions.clear();
      this.recordedOpens.clear();
    }
  }

  private detectDeviceClass(): DeviceClass {
    if (typeof window === "undefined") return "unknown";
    const width = window.innerWidth || 1024;
    if (width < 640) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  }

  // --- EVENT ENQUEUE & BUFFER MANAGEMENT ---
  public enqueueEvent(
    eventType: ReaderActivityEventType,
    options: {
      entityType?: ReaderActivityEvent["entityType"];
      entityId?: string;
      route?: string;
      source?: ReaderActivityEvent["source"];
      metadata?: ReaderActivityEvent["metadata"];
      language?: "ne" | "en" | "all";
      consentClass?: "essential" | "analytics";
    } = {}
  ): ReaderActivityEvent {
    const now = new Date().toISOString();
    const eventId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `ev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const event: ReaderActivityEvent = {
      eventId,
      eventType,
      occurredAt: now,
      sessionId: this.getSessionId(),
      userId: this.currentUserId || undefined,
      anonymousId: !this.currentUserId ? this.getOrCreateAnonymousId() : undefined,
      tenantId: "sanatan-media",
      entityType: options.entityType,
      entityId: options.entityId,
      route: options.route || (typeof window !== "undefined" ? window.location.pathname : undefined),
      source: options.source || "direct",
      metadata: options.metadata ? JSON.parse(JSON.stringify(options.metadata)) : {},
      language: options.language || "ne",
      deviceClass: this.detectDeviceClass(),
      consentClass: options.consentClass || "analytics",
      schemaVersion: 1
    };

    // Buffer Bounds: Drop oldest non-essential events if capacity reached
    if (this.localQueue.length >= this.MAX_QUEUE_SIZE) {
      const dropIndex = this.localQueue.findIndex(e => e.consentClass !== "essential");
      if (dropIndex >= 0) {
        this.localQueue.splice(dropIndex, 1);
      } else {
        this.localQueue.shift();
      }
    }

    this.localQueue.push(event);
    this.persistQueueLocal();

    // Auto-flush if batch threshold reached or if high-priority essential event
    if (this.localQueue.length >= this.FLUSH_BATCH_SIZE || options.consentClass === "essential") {
      this.flushBuffer();
    }

    return event;
  }

  private persistQueueLocal() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sanatan_activity_queue", JSON.stringify(this.localQueue));
      } catch (e) {}
    }
  }

  // --- BUFFER FLUSH & NETWORK SYNC ---
  public async flushBuffer(): Promise<boolean> {
    if (this.localQueue.length === 0 || typeof window === "undefined") {
      return true;
    }

    // Check circuit breaker status from window or memory if available
    const isCircuitOpen = (window as any)?.__FIRESTORE_CIRCUIT_OPEN__ === true;
    if (isCircuitOpen) {
      // Pause flush during quota conservation
      return false;
    }

    const batchEvents = this.localQueue.slice(0, 50);
    const payload: AudienceIngestBatchRequest = {
      events: batchEvents,
      clientSentAt: new Date().toISOString(),
      tenantId: "sanatan-media"
    };

    try {
      const res = await fetch("/api/audience/events/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Remove successfully flushed events
        const sentIds = new Set(batchEvents.map(e => e.eventId));
        this.localQueue = this.localQueue.filter(e => !sentIds.has(e.eventId));
        this.persistQueueLocal();
        return true;
      }
    } catch (err) {
      // Network failure: retain in local buffer with bounded limits
    }

    return false;
  }

  // --- PAGE VIEW & ARTICLE TRACKING ---
  public trackPageView(route: string, source: ReaderActivityEvent["source"] = "direct") {
    const sess = this.getSessionId();
    const dedupKey = `${sess}_${route}`;
    if (this.recordedPageViews.has(dedupKey)) {
      return; // Deduplicated
    }
    this.recordedPageViews.add(dedupKey);

    this.enqueueEvent("PAGE_VIEW", {
      route,
      source,
      consentClass: "analytics"
    });
  }

  public trackArticleOpen(articleId: string, metadata: { title?: string; category?: string; language?: "ne" | "en" } = {}) {
    const sess = this.getSessionId();
    const dedupKey = `${sess}_${articleId}`;
    if (this.recordedOpens.has(dedupKey)) {
      return; // Emitted once per article session
    }
    this.recordedOpens.add(dedupKey);

    // Initialize dwell timer for this article
    this.activeArticleId = articleId;
    this.activeArticleStartTime = Date.now();
    this.activeArticleDwellSeconds = 0;

    this.enqueueEvent("ARTICLE_OPEN", {
      entityType: "article",
      entityId: articleId,
      route: `/article/${articleId}`,
      language: metadata.language || "ne",
      metadata: { targetId: metadata.category },
      consentClass: "analytics"
    });

    // Record in local reading history
    this.recordLocalHistory({
      entityId: articleId,
      entityType: "article",
      title: metadata.title || articleId,
      visitedAt: new Date().toISOString(),
      language: metadata.language || "ne",
      canonicalUrl: `/article/${articleId}`,
      category: metadata.category
    });

    // Start background-safe dwell ticker
    if (this.activeDwellInterval) clearInterval(this.activeDwellInterval);
    this.activeDwellInterval = setInterval(() => {
      if (this.isTabVisible && this.activeArticleId === articleId) {
        this.activeArticleDwellSeconds += 1;
      }
    }, 1000);
  }

  public trackReadProgress(articleId: string, milestone: ReadProgressMilestone) {
    const sess = this.getSessionId();
    const dedupKey = `${sess}_${articleId}_${milestone}`;
    if (this.recordedMilestones.has(dedupKey)) {
      return; // Coarse milestones emitted at most once
    }
    this.recordedMilestones.add(dedupKey);

    const dwellBucket = this.getDwellBucket(this.activeArticleDwellSeconds);

    this.enqueueEvent("ARTICLE_READ_PROGRESS", {
      entityType: "article",
      entityId: articleId,
      metadata: {
        milestone,
        dwellSeconds: this.activeArticleDwellSeconds,
        dwellBucket
      },
      consentClass: "analytics"
    });

    // Update local continue reading progress
    this.recordLocalContinueReading({
      entityId: articleId,
      entityType: "article",
      title: articleId,
      progressPercent: milestone,
      lastReadAt: new Date().toISOString(),
      language: "ne",
      canonicalUrl: `/article/${articleId}`
    });

    // Check Article Completion Rule (e.g. milestone >= 75 and dwell >= 15s)
    if (milestone >= 75 && this.activeArticleDwellSeconds >= 15) {
      this.trackArticleComplete(articleId);
    }
  }

  public trackArticleComplete(articleId: string) {
    const sess = this.getSessionId();
    const dedupKey = `${sess}_${articleId}`;
    if (this.recordedCompletions.has(dedupKey)) {
      return; // Emitted at most once per session
    }
    this.recordedCompletions.add(dedupKey);

    const dwellBucket = this.getDwellBucket(this.activeArticleDwellSeconds);

    this.enqueueEvent("ARTICLE_COMPLETE", {
      entityType: "article",
      entityId: articleId,
      metadata: {
        milestone: 100,
        dwellSeconds: this.activeArticleDwellSeconds,
        dwellBucket
      },
      consentClass: "analytics"
    });

    // Remove from continue reading once complete
    this.removeLocalContinueReading(articleId);
  }

  private getDwellBucket(seconds: number): DwellTimeBucket {
    if (seconds < 15) return "<15s";
    if (seconds <= 60) return "15_60s";
    if (seconds <= 180) return "1_3m";
    if (seconds <= 600) return "3_10m";
    return "10m_plus";
  }

  // --- SAVE / BOOKMARK & FOLLOWING ---
  public trackSave(entityId: string, entityType: ReaderActivityEvent["entityType"] = "article") {
    this.enqueueEvent("SAVE", {
      entityType,
      entityId,
      consentClass: "essential"
    });
  }

  public trackUnsave(entityId: string, entityType: ReaderActivityEvent["entityType"] = "article") {
    this.enqueueEvent("UNSAVE", {
      entityType,
      entityId,
      consentClass: "essential"
    });
  }

  public trackFollow(targetType: "topic" | "author" | "category" | "district", targetId: string) {
    this.enqueueEvent("FOLLOW", {
      entityType: targetType as any,
      entityId: targetId,
      metadata: { targetType, targetId },
      consentClass: "essential"
    });
  }

  public trackUnfollow(targetType: "topic" | "author" | "category" | "district", targetId: string) {
    this.enqueueEvent("UNFOLLOW", {
      entityType: targetType as any,
      entityId: targetId,
      metadata: { targetType, targetId },
      consentClass: "essential"
    });
  }

  public trackNotificationOpen(notificationId: string, targetUrl: string) {
    this.enqueueEvent("NOTIFICATION_OPEN", {
      route: targetUrl,
      metadata: { notificationId },
      source: "notification",
      consentClass: "analytics"
    });
  }

  public trackMediaPlay(mediaId: string, mediaType: "audio" | "video" | "radio" | "podcast" = "audio") {
    this.enqueueEvent("MEDIA_PLAY", {
      entityType: "media",
      entityId: mediaId,
      metadata: { mediaType },
      consentClass: "analytics"
    });
  }

  public trackMediaComplete(mediaId: string, mediaType: "audio" | "video" | "radio" | "podcast" = "audio") {
    this.enqueueEvent("MEDIA_COMPLETE", {
      entityType: "media",
      entityId: mediaId,
      metadata: { mediaType },
      consentClass: "analytics"
    });
  }

  // --- LOCAL READING HISTORY & CONTINUE READING ---
  private getHistoryStorageKey(): string {
    return `sanatan_history_${this.currentUserId || "anon"}`;
  }

  private getContinueReadingStorageKey(): string {
    return `sanatan_continue_reading_${this.currentUserId || "anon"}`;
  }

  public getReadingHistory(): ReadingHistoryItem[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(this.getHistoryStorageKey());
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  public recordLocalHistory(item: ReadingHistoryItem) {
    if (typeof window === "undefined") return;
    try {
      const list = this.getReadingHistory().filter(h => h.entityId !== item.entityId);
      list.unshift(item);
      const bounded = list.slice(0, 50);
      localStorage.setItem(this.getHistoryStorageKey(), JSON.stringify(bounded));
    } catch (e) {}
  }

  public clearReadingHistory() {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(this.getHistoryStorageKey());
      localStorage.removeItem(this.getContinueReadingStorageKey());
      if (this.currentUserId) {
        fetch("/api/me/activity/history", { method: "DELETE" }).catch(() => {});
      }
    } catch (e) {}
  }

  public getContinueReading(): ContinueReadingItem[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(this.getContinueReadingStorageKey());
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  public recordLocalContinueReading(item: ContinueReadingItem) {
    if (typeof window === "undefined") return;
    try {
      const list = this.getContinueReading().filter(c => c.entityId !== item.entityId);
      list.unshift(item);
      const bounded = list.slice(0, 20);
      localStorage.setItem(this.getContinueReadingStorageKey(), JSON.stringify(bounded));
    } catch (e) {}
  }

  public removeLocalContinueReading(entityId: string) {
    if (typeof window === "undefined") return;
    try {
      const list = this.getContinueReading().filter(c => c.entityId !== entityId);
      localStorage.setItem(this.getContinueReadingStorageKey(), JSON.stringify(list));
    } catch (e) {}
  }
}

export const readerActivityOS = new ReaderActivityOS();
