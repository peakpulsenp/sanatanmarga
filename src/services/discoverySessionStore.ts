import { CandidateStory, CategoryDiscoveryOutput } from "./categoryStoryDiscoveryEngine";
import { PreGenerationFactManifest } from "./temporalKnowledgeOS";

export interface DiscoverySession {
  id: string;
  category: string;
  categoryNepali: string;
  discoveredAt: string;
  expiresAt: string;
  searchMode: 'standard' | 'trending' | 'breaking';
  keywords?: string;
  totalDiscovered: number;
  validFreshSourcesCount: number;
  breakingStories: CandidateStory[];
  trendingStories: CandidateStory[];
  ordinaryStories: CandidateStory[];
  allStories: CandidateStory[];
  schemaVersion: string;
}

const STORAGE_KEY = "sanatan_discovery_sessions_v1";

class DiscoverySessionStore {
  private sessions: Map<string, DiscoverySession> = new Map();
  private storyIndex: Map<string, { session: DiscoverySession; story: CandidateStory }> = new Map();

  constructor() {
    this.loadFromStorage();

    // Clean expired sessions periodically
    if (typeof setInterval !== "undefined") {
      setInterval(() => this.cleanup(), 10 * 60 * 1000);
    }
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: DiscoverySession[] = JSON.parse(raw);
      const now = Date.now();

      parsed.forEach(session => {
        if (new Date(session.expiresAt).getTime() > now) {
          this.sessions.set(session.id, session);
          session.allStories.forEach(s => {
            this.storyIndex.set(s.storyId || "", { session, story: s });
          });
        }
      });
      console.log(`[DISCOVERY_SESSION_STORE] Hydrated ${this.sessions.size} persistent sessions from storage.`);
    } catch (err) {
      console.warn("[DISCOVERY_SESSION_STORE] Failed to hydrate persistent sessions:", err);
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      const array = Array.from(this.sessions.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(array));
    } catch (err) {
      console.warn("[DISCOVERY_SESSION_STORE] Storage save warning:", err);
    }
  }

  public createSession(
    category: string,
    categoryNepali: string,
    output: CategoryDiscoveryOutput,
    searchMode: 'standard' | 'trending' | 'breaking' = 'standard',
    keywords?: string
  ): DiscoverySession {
    const id = `disc_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 1 hour TTL

    const allStories: CandidateStory[] = [
      ...output.breakingStories,
      ...output.trendingStories,
      ...output.ordinaryStories
    ];

    // Ensure all stories have a unique stable ID and immutable evidence manifest
    allStories.forEach((story, idx) => {
      if (!story.storyId) {
        story.storyId = `${id}_story_${idx + 1}_${story.storyType || 'ordinary'}`;
      }
      story.discoveryTimestamp = story.discoveryTimestamp || now.toISOString();
    });

    const session: DiscoverySession = {
      id,
      category,
      categoryNepali,
      discoveredAt: now.toISOString(),
      expiresAt,
      searchMode,
      keywords,
      totalDiscovered: output.totalCandidateSourcesDiscovered || allStories.length,
      validFreshSourcesCount: output.validFreshSourcesCount || allStories.length,
      breakingStories: output.breakingStories,
      trendingStories: output.trendingStories,
      ordinaryStories: output.ordinaryStories,
      allStories,
      schemaVersion: "v3.8.4"
    };

    this.sessions.set(id, session);
    
    // Index individual stories for rapid O(1) lookup
    allStories.forEach(s => {
      if (s.storyId) {
        this.storyIndex.set(s.storyId, { session, story: s });
      }
    });

    this.saveToStorage();

    console.log(`[DISCOVERY_SESSION_STORE] Created session ${id} with ${allStories.length} preserved candidate stories (${output.breakingStories.length} Breaking, ${output.trendingStories.length} Trending, ${output.ordinaryStories.length} Ordinary).`);

    return session;
  }

  public getSession(id: string): DiscoverySession | undefined {
    return this.sessions.get(id);
  }

  public getStory(storyId: string): { session: DiscoverySession; story: CandidateStory } | undefined {
    return this.storyIndex.get(storyId);
  }

  public getStoryBySessionAndCandidate(sessionId: string, candidateId: string): { session: DiscoverySession; story: CandidateStory } | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    const story = session.allStories.find(s => s.storyId === candidateId || s.clusterId === candidateId);
    if (!story) return undefined;
    return { session, story };
  }

  public cleanup() {
    const now = Date.now();
    let modified = false;
    for (const [id, sess] of this.sessions.entries()) {
      if (new Date(sess.expiresAt).getTime() < now) {
        sess.allStories.forEach(s => {
          if (s.storyId) this.storyIndex.delete(s.storyId);
        });
        this.sessions.delete(id);
        modified = true;
      }
    }
    if (modified) {
      this.saveToStorage();
    }
  }
}

export const discoverySessionStore = new DiscoverySessionStore();

