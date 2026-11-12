/**
 * Central Content Event Bus (SanatanMarga Architecture)
 * 
 * Provides guaranteed, traceable end-to-end synchronization across:
 * 1. Admin UI Mutations (Create, Update, Delete, Status Change, Feature/Unfeature)
 * 2. Local Dynamic Snapshot Injection (Instant 0ms preview)
 * 3. Local Invalidation & Deleted IDs Set
 * 4. Server Snapshot OS Rebuild & Manifest Version Bump
 * 5. Frontend Subscriber Notifications (CustomEvent + Broadcaster)
 */

export type ContentMutationType = 
  | 'ARTICLE_CREATED'
  | 'ARTICLE_UPDATED'
  | 'ARTICLE_DELETED'
  | 'ARTICLE_STATUS_CHANGED'
  | 'ARTICLE_FEATURED_TOGGLED'
  | 'CATEGORY_MUTATED'
  | 'AD_MUTATED'
  | 'COMMUNITY_MUTATED'
  | 'KNOWLEDGE_MUTATED';

export interface ContentMutationEvent {
  eventId?: string;
  type: ContentMutationType;
  entity: 'article' | 'category' | 'ad' | 'community' | 'knowledge' | 'event';
  entityId: string;
  operation?: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'UNPUBLISH';
  revision?: number;
  snapshotVersion?: string;
  frontendInvalidation?: boolean;
  data?: any;
  userId?: string;
  timestamp: string;
}

class ContentEventBus {
  private listeners: Array<(event: ContentMutationEvent) => void> = [];
  private broadcastChannel: BroadcastChannel | null = null;
  private seenEventIds = new Set<string>();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('content-mutated', ((e: CustomEvent<ContentMutationEvent>) => {
        if (e.detail) {
          this.notifyLocalSubscribers(e.detail);
        }
      }) as EventListener);

      if ('BroadcastChannel' in window) {
        try {
          this.broadcastChannel = new BroadcastChannel('sanatan_content_sync');
          this.broadcastChannel.onmessage = (e) => {
            if (e.data && e.data.type) {
              this.applyIncomingEvent(e.data);
            }
          };
        } catch (err) {}
      }

      window.addEventListener('storage', (e) => {
        if (e.key === 'sanatan_last_content_mutation' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.applyIncomingEvent(parsed);
          } catch (err) {}
        }
      });
    }
  }

  public subscribe(callback: (event: ContentMutationEvent) => void): () => void {
    if (typeof callback !== 'function') return () => {};
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyLocalSubscribers(event: ContentMutationEvent) {
    this.listeners.forEach(cb => {
      try {
        cb(event);
      } catch (err) {
        console.warn('[ContentEventBus] Subscriber error:', err);
      }
    });
  }

  private async applyIncomingEvent(fullEvent: ContentMutationEvent) {
    const eventId = fullEvent.eventId || `${fullEvent.type}_${fullEvent.entityId}_${fullEvent.timestamp}`;
    if (this.seenEventIds.has(eventId)) {
      return; // Deduplicated
    }
    this.seenEventIds.add(eventId);
    if (this.seenEventIds.size > 200) {
      const first = this.seenEventIds.values().next().value;
      if (first) this.seenEventIds.delete(first);
    }

    try {
      const { snapshotEngine } = await import('../services/snapshotEngine');
      if (fullEvent.type === 'ARTICLE_DELETED' || fullEvent.type.includes('DELETE')) {
        snapshotEngine.addDeletedDocId(fullEvent.entityId);
        snapshotEngine.removeDynamicArticle(fullEvent.entityId);
      }

      if (fullEvent.data && (fullEvent.type === 'ARTICLE_CREATED' || fullEvent.type === 'ARTICLE_UPDATED' || fullEvent.type === 'ARTICLE_STATUS_CHANGED' || fullEvent.type === 'ARTICLE_FEATURED_TOGGLED')) {
        const status = fullEvent.data.status;
        if (status === 'published' || status === 'active' || !status) {
          snapshotEngine.injectArticles([fullEvent.data]);
        } else if (status === 'draft' || status === 'rejected' || status === 'retracted') {
          snapshotEngine.removeDynamicArticle(fullEvent.entityId);
        }
      }
      snapshotEngine.clearCache();
    } catch (e) {
      // Fallback
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('content-mutated', { detail: fullEvent }));
      window.dispatchEvent(new CustomEvent('snapshot-rebuilt', { detail: { event: fullEvent } }));
    }
  }

  /**
   * Emit a mutation event and execute the unified sync pipeline
   */
  public async emit(event: Omit<ContentMutationEvent, 'timestamp'>): Promise<void> {
    const derivedOp = event.operation || (
      event.type.includes('CREATED') ? 'CREATE' :
      event.type.includes('DELETED') ? 'DELETE' :
      event.type.includes('STATUS') ? 'PUBLISH' : 'UPDATE'
    );

    const fullEvent: ContentMutationEvent = {
      eventId: event.eventId || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      operation: derivedOp,
      revision: event.revision || Date.now(),
      snapshotVersion: event.snapshotVersion || "v3.8.4",
      frontendInvalidation: event.frontendInvalidation ?? true,
      ...event,
      timestamp: new Date().toISOString()
    };

    console.log(`[CONTENT_EVENT] mutation emitted: [${fullEvent.type}] (${fullEvent.operation}) for ${fullEvent.entity} ID: ${fullEvent.entityId}`);

    // Apply locally first
    this.applyIncomingEvent(fullEvent);

    // Broadcast across all open browser tabs
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(fullEvent);
      } catch (err) {}
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sanatan_last_content_mutation', JSON.stringify(fullEvent));
      } catch (err) {}
    }

    // Stage 4: Trigger Server Rebuild & Manifest Increment
    console.log(`[CRUD] Snapshot Rebuild Started (calling server pipeline)...`);
    try {
      const { snapshotEngine } = await import('../services/snapshotEngine');
      await snapshotEngine.triggerServerRebuild({
        triggerSource: `event_bus_${fullEvent.type.toLowerCase()}`,
        triggerEntity: `${fullEvent.entity}_${fullEvent.entityId}`,
        article: fullEvent.data,
        deletedDocId: (fullEvent.operation === 'DELETE' || fullEvent.type.includes('DELETE')) ? fullEvent.entityId : undefined
      });
      console.log(`[CRUD] Snapshot Rebuild Queued on Server with Instant Cache Purge`);
    } catch (err) {
      console.warn(`[CRUD] Server rebuild trigger error:`, err);
    }
  }
}

export const contentEventBus = new ContentEventBus();
export default contentEventBus;
