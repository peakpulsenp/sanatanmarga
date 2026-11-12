import type { Article } from "@/src/types";
import { sponsorAudioRegistry } from "./sponsorAudioRegistry";
import type { MembershipTier } from "./articleModuleRegistry";

export interface PlaylistItem {
  id: string;
  articleId: string;
  title: string;
  category?: string;
  district?: string;
  imageUrl?: string;
  contentSummary: string;
  duration?: number;
  audioUrl?: string;
  addedAt: string;
  slug?: string;
  // Sponsor Audio Extensions
  isSponsor?: boolean;
  sponsorName?: string;
  sponsorLogoUrl?: string;
  sponsorCampaignId?: string;
  skipAllowed?: boolean;
}

export interface ExcludedArticleDiagnostic {
  articleId: string;
  title: string;
  reason: string;
}

export interface ListenOSDiagnostics {
  nepalDate: string;
  todayPublishedCount: number;
  verifiedCount: number;
  eligibleAudioCount: number;
  cachedAudioCount: number;
  networkAudioAvailableCount: number;
  excludedArticles: ExcludedArticleDiagnostic[];
  sponsorTracksCount: number;
  activeUserTier: MembershipTier;
}

export interface SavedPlaylist {
  id: string;
  title: string;
  items: PlaylistItem[];
  createdAt: string;
  itemCount: number;
}

const STORAGE_KEY_QUEUE = "sanatan_media_queue_v1";
const STORAGE_KEY_SAVED_PLAYLISTS = "sanatan_media_saved_playlists_v1";
const STORAGE_KEY_STATE = "sanatan_media_state_v1";

/**
 * SanatanMarga Playlist & Queue Engine
 * Handles queue management, dynamic category/district briefings, and session persistence.
 */
export class PlaylistEngine {
  /**
   * Converts an Article into a standard PlaylistItem
   */
  public static articleToPlaylistItem(article: Article): PlaylistItem {
    const rawTitle = (article as any)?.titleNepali || article?.title || (article as any)?.titleEnglish || "";
    const cleanTitle = rawTitle.replace(/<[^>]*>?/gm, '').trim() || "सनातन मार्ग विशेष समाचार";
    
    const rawSummary = article?.content || (article as any)?.summary || article?.excerpt || cleanTitle;
    const cleanSummary = typeof rawSummary === 'string' 
      ? rawSummary.replace(/<[^>]*>?/gm, '').trim() 
      : cleanTitle;

    return {
      id: `item-${article?.id || Math.random().toString(36).substring(2)}-${Date.now()}`,
      articleId: String(article?.id || `art-${Date.now()}`),
      title: cleanTitle,
      category: article?.categoryName || article?.category || "समाचार",
      district: (article as any)?.district || (article?.districts && article?.districts[0]) || undefined,
      imageUrl: article?.featuredImage || (article as any)?.imageUrl || "",
      contentSummary: cleanSummary,
      audioUrl: (article as any)?.audioUrl || (article as any)?.tts?.audioUrl || undefined,
      addedAt: new Date().toISOString(),
      slug: article?.slug || "",
    };
  }

  /**
   * Generates a "Listen to This Page" queue from a list of articles
   */
  public static createListenToThisPageQueue(
    articles: Article[],
    pageTitle: string
  ): { queueTitle: string; items: PlaylistItem[] } {
    const validArticles = (articles || []).filter(a => a && a.title);
    const items = validArticles.map(a => this.articleToPlaylistItem(a));
    return {
      queueTitle: `🎧 ${pageTitle} — Listen Queue`,
      items,
    };
  }

  /**
   * Generates a "Today's Daily Briefing" queue
   */
  public static createDailyBriefingQueue(
    articles: Article[]
  ): { queueTitle: string; items: PlaylistItem[] } {
    const topArticles = (articles || []).slice(0, 10);
    const items = topArticles.map(a => this.articleToPlaylistItem(a));
    return {
      queueTitle: "🎧 आजको दैनिक बुलेटिन (Today's Daily Briefing)",
      items,
    };
  }

  /**
   * Generates a "District Audio Briefing" queue
   */
  public static createDistrictQueue(
    districtName: string,
    articles: Article[]
  ): { queueTitle: string; items: PlaylistItem[] } {
    const districtArticles = (articles || []).filter(a => {
      const d = (a as any).district || (a.districts && a.districts[0]) || "";
      return d.toLowerCase().includes(districtName.toLowerCase());
    });
    const items = districtArticles.map(a => this.articleToPlaylistItem(a));
    return {
      queueTitle: `🎧 ${districtName} श्रव्य खबर (District Briefing)`,
      items,
    };
  }

  /**
   * Generates a "Category Briefing" queue
   */
  public static createCategoryQueue(
    categoryName: string,
    articles: Article[]
  ): { queueTitle: string; items: PlaylistItem[] } {
    const categoryArticles = (articles || []).filter(a => {
      const c = a.categoryName || a.category || "";
      return c.toLowerCase().includes(categoryName.toLowerCase());
    });
    const items = categoryArticles.map(a => this.articleToPlaylistItem(a));
    return {
      queueTitle: `🎧 ${categoryName} — Category Audio Briefing`,
      items,
    };
  }

  /**
   * Saves queue state to local storage for persistent cross-session resume
   */
  public static saveSessionState(state: {
    queue: PlaylistItem[];
    currentIndex: number;
    currentTime: number;
    queueTitle: string;
  }): void {
    try {
      localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(state));
    } catch (e) {
      console.warn("[PlaylistEngine] Unable to save session state:", e);
    }
  }

  /**
   * Restores session state from local storage
   */
  public static loadSessionState(): {
    queue: PlaylistItem[];
    currentIndex: number;
    currentTime: number;
    queueTitle: string;
  } | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_QUEUE);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /**
   * Retrieves saved user playlists with fallback sample playlists if empty
   */
  public static getSavedPlaylists(): SavedPlaylist[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SAVED_PLAYLISTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("[PlaylistEngine] Error reading saved playlists:", e);
    }

    // Honest empty state: no playlists saved yet
    return [];
  }

  /**
   * Deletes a saved playlist by ID
   */
  public static deletePlaylist(playlistId: string): SavedPlaylist[] {
    const existing = this.getSavedPlaylists();
    const updated = existing.filter(p => p.id !== playlistId);
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_PLAYLISTS, JSON.stringify(updated));
    } catch (e) {
      console.warn("[PlaylistEngine] Error deleting playlist:", e);
    }
    return updated;
  }

  /**
   * Saves a new playlist
   */
  public static savePlaylist(title: string, items: PlaylistItem[]): SavedPlaylist[] {
    const existing = this.getSavedPlaylists();
    const newPlaylist: SavedPlaylist = {
      id: `pl-${Date.now()}`,
      title,
      items,
      createdAt: new Date().toISOString(),
      itemCount: items.length,
    };
    const updated = [newPlaylist, ...existing];
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_PLAYLISTS, JSON.stringify(updated));
    } catch (e) {
      console.warn("[PlaylistEngine] Error saving playlist:", e);
    }
    return updated;
  }
}

/**
 * ListenOS Sponsor & Editorial Playlist Policy Engine
 * Governs strict separation between editorial news and sponsor audio campaigns,
 * while maintaining the invariant: EDITORIAL NEWS CAN NEVER BE DISPLACED.
 */
export class PlaylistPolicyEngine {
  public static buildListenOSPlaylist(
    rawArticles: Article[],
    userTier: MembershipTier = 'free'
  ): { queueTitle: string; items: PlaylistItem[]; diagnostics: ListenOSDiagnostics } {
    const nepalOffsetMs = 345 * 60 * 1000;
    const nowMs = Date.now();
    const todayNepalDate = new Date(nowMs + nepalOffsetMs).toISOString().split('T')[0];

    const excludedArticles: ExcludedArticleDiagnostic[] = [];
    const eligibleEditorialArticles: Article[] = [];

    let publishedCount = 0;
    let verifiedCount = 0;

    (rawArticles || []).forEach((art) => {
      if (!art || !art.id) return;
      const title = (art as any)?.titleNepali || art.title || "अज्ञात शीर्षक";

      // 1. Status Check
      const isPublished = art.status === 'published' || (art as any).isPublished !== false;
      if (!isPublished || (art.status as string) === 'draft' || (art.status as string) === 'auto_draft_flagged') {
        excludedArticles.push({
          articleId: art.id,
          title,
          reason: `unpublished (status: ${art.status || 'draft'})`
        });
        return;
      }
      publishedCount++;

      // 2. Verification Check
      const isVerified = (art as any).isUnverified !== true && (art as any).qaAudit?.status !== 'FAILED';
      if (!isVerified) {
        excludedArticles.push({
          articleId: art.id,
          title,
          reason: "source not verified (SGIS audit failed)"
        });
        return;
      }
      verifiedCount++;

      // 3. Nepal Calendar Date Check (Authoritative canonicalPublishedAt / publishedAt only)
      const artDateRaw = art.canonicalPublishedAt || art.publishedAt;
      if (!artDateRaw) {
        excludedArticles.push({
          articleId: art.id,
          title,
          reason: "REJECT_NO_VERIFIABLE_PUBLISH_DATE: missing canonical publishedAt"
        });
        return;
      }
      const artDateNepalStr = new Date(new Date(artDateRaw).getTime() + nepalOffsetMs).toISOString().split('T')[0];

      if (artDateNepalStr !== todayNepalDate) {
        excludedArticles.push({
          articleId: art.id,
          title,
          reason: `publishedAt = previous Nepal calendar day (${artDateNepalStr} vs today ${todayNepalDate})`
        });
        return;
      }

      eligibleEditorialArticles.push(art);
    });

    // Convert eligible editorial articles to PlaylistItems
    const editorialItems = eligibleEditorialArticles.map((a) => PlaylistEngine.articleToPlaylistItem(a));

    // Retrieve eligible sponsor tracks based on verified membership tier
    const sponsorTracks = sponsorAudioRegistry.getEligibleSponsorTracks(userTier, 'all');

    // Interleave sponsor tracks cleanly into editorial items without displacing news
    const finalQueueItems: PlaylistItem[] = [];
    
    // Insertion interval: free = every 3 news items, member = every 6 news items, premium = never
    const frequency = userTier === 'member' ? 6 : 3;
    let sponsorIndex = 0;

    if (userTier === 'premium' || sponsorTracks.length === 0) {
      finalQueueItems.push(...editorialItems);
    } else {
      editorialItems.forEach((item, idx) => {
        finalQueueItems.push(item);
        // Interleave sponsor audio item after frequency interval if sponsor tracks available
        if ((idx + 1) % frequency === 0 && sponsorIndex < sponsorTracks.length) {
          finalQueueItems.push(sponsorTracks[sponsorIndex % sponsorTracks.length]);
          sponsorIndex++;
        }
      });
    }

    const cachedAudioCount = editorialItems.filter((i) => Boolean(i.audioUrl)).length;
    const networkAudioAvailableCount = editorialItems.length;

    const diagnostics: ListenOSDiagnostics = {
      nepalDate: todayNepalDate,
      todayPublishedCount: publishedCount,
      verifiedCount,
      eligibleAudioCount: editorialItems.length,
      cachedAudioCount,
      networkAudioAvailableCount,
      excludedArticles,
      sponsorTracksCount: sponsorTracks.length,
      activeUserTier: userTier
    };

    return {
      queueTitle: `🎧 ListenOS — आजका मुख्य समाचार (${todayNepalDate})`,
      items: finalQueueItems,
      diagnostics
    };
  }
}

