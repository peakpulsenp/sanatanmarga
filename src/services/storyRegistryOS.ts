import { doc, setDoc, getDoc, collection, getDocs, query, where, orderBy, limit } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";

export interface CanonicalStoryRecord {
  storyId: string;
  category: string;
  categoryNepali?: string;
  storyType: 'breaking' | 'trending' | 'ordinary';
  headline: string;
  headlineNepali?: string;
  summary?: string;
  geographicScope: 'national' | 'provincial' | 'local' | 'international';
  districtsAffected: string[];
  knowledgeEntities: string[];
  canonicalEntities?: string[];
  firstSeenAt: string;
  lastUpdatedAt: string;
  sourceCount: number;
  sources: Array<{
    url?: string;
    publisher?: string;
    publishedAt?: string;
    snippet?: string;
  }>;
  status: 'active' | 'evolving' | 'archived' | 'merged';
  articleIds: string[];
  storyHash?: string;
}

const LOCAL_STORY_REGISTRY_KEY = "sanatan_canonical_story_registry_v1";

class StoryRegistryOSService {
  private static instance: StoryRegistryOSService;

  public static getInstance(): StoryRegistryOSService {
    if (!StoryRegistryOSService.instance) {
      StoryRegistryOSService.instance = new StoryRegistryOSService();
    }
    return StoryRegistryOSService.instance;
  }

  private getLocalRegistry(): Record<string, CanonicalStoryRecord> {
    try {
      const data = localStorage.getItem(LOCAL_STORY_REGISTRY_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveLocalRegistry(registry: Record<string, CanonicalStoryRecord>): void {
    try {
      localStorage.setItem(LOCAL_STORY_REGISTRY_KEY, JSON.stringify(registry));
    } catch (e) {
      console.warn("[StoryRegistryOS] Local storage save error:", e);
    }
  }

  /**
   * Register or evolve an existing canonical story record
   */
  public async registerOrUpdateStory(params: {
    storyId?: string;
    category: string;
    categoryNepali?: string;
    storyType: 'breaking' | 'trending' | 'ordinary';
    headline: string;
    summary?: string;
    geographicScope?: 'national' | 'provincial' | 'local' | 'international';
    districtsAffected?: string[];
    knowledgeEntities?: string[];
    sources?: any[];
    articleId?: string;
    storyHash?: string;
  }): Promise<CanonicalStoryRecord> {
    const now = new Date().toISOString();
    const id = params.storyId || params.storyHash || `story_${params.category}_${Date.now()}`;
    const local = this.getLocalRegistry();
    const existing = local[id];

    // Auto-detect geographic scope if not provided
    let scope: 'national' | 'provincial' | 'local' | 'international' = params.geographicScope || 'national';
    if (!params.geographicScope && params.districtsAffected && params.districtsAffected.length > 0) {
      scope = params.districtsAffected.length > 3 ? 'national' : 'local';
    }

    const mergedArticleIds = Array.from(new Set([
      ...(existing?.articleIds || []),
      ...(params.articleId ? [params.articleId] : [])
    ]));

    const mergedEntities = Array.from(new Set([
      ...(existing?.knowledgeEntities || []),
      ...(params.knowledgeEntities || [])
    ]));

    const mergedDistricts = Array.from(new Set([
      ...(existing?.districtsAffected || []),
      ...(params.districtsAffected || [])
    ]));

    const record: CanonicalStoryRecord = {
      storyId: id,
      category: params.category,
      categoryNepali: params.categoryNepali || existing?.categoryNepali,
      storyType: params.storyType,
      headline: params.headline,
      headlineNepali: params.headline,
      summary: params.summary || existing?.summary || "",
      geographicScope: scope,
      districtsAffected: mergedDistricts,
      knowledgeEntities: mergedEntities,
      canonicalEntities: mergedEntities,
      firstSeenAt: existing?.firstSeenAt || now,
      lastUpdatedAt: now,
      sourceCount: Math.max(existing?.sourceCount || 0, params.sources?.length || 1),
      sources: params.sources || existing?.sources || [],
      status: existing ? 'evolving' : 'active',
      articleIds: mergedArticleIds,
      storyHash: params.storyHash || existing?.storyHash || id
    };

    local[id] = record;
    this.saveLocalRegistry(local);

    if (db) {
      try {
        await setDoc(doc(db, "canonical_story_registry", id), record, { merge: true });
      } catch (err) {
        console.warn("[StoryRegistryOS] Firestore persist notice:", err);
      }
    }

    return record;
  }

  /**
   * Find matching canonical story by entity overlap or category/headline similarity
   */
  public async findMatchingStory(query: {
    category?: string;
    districts?: string[];
    entities?: string[];
    headline?: string;
  }): Promise<CanonicalStoryRecord | null> {
    const local = this.getLocalRegistry();
    const all = Object.values(local);

    for (const story of all) {
      if (query.category && story.category === query.category) {
        // Check district overlap
        if (query.districts && query.districts.length > 0) {
          const hasDistrictOverlap = query.districts.some(d => story.districtsAffected.includes(d));
          if (hasDistrictOverlap) return story;
        }
        // Check entity overlap
        if (query.entities && query.entities.length > 0) {
          const hasEntityOverlap = query.entities.some(e => story.knowledgeEntities.includes(e));
          if (hasEntityOverlap) return story;
        }
      }
    }

    return null;
  }

  /**
   * Get all active and evolving stories
   */
  public async getStories(limitCount = 50): Promise<CanonicalStoryRecord[]> {
    try {
      if (db) {
        const q = query(
          collection(db, "canonical_story_registry"),
          orderBy("lastUpdatedAt", "desc"),
          limit(limitCount)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => d.data() as CanonicalStoryRecord);
        }
      }
    } catch (e) {
      // Fallback to local
    }

    const local = this.getLocalRegistry();
    return Object.values(local)
      .sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime())
      .slice(0, limitCount);
  }
}

export const storyRegistryOS = StoryRegistryOSService.getInstance();
