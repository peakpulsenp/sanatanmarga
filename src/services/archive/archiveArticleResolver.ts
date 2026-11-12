import { snapshotEngine } from "@/src/services/snapshotEngine";

export interface ResolvedArticleLink {
  id: string;
  title: string;
  route: string;
  category?: string;
  publishedAt?: string;
}

export class ArchiveArticleResolver {
  /**
   * Resolves an array of article IDs to published articles
   */
  public static async resolveArticleIds(articleIds: string[] = []): Promise<ResolvedArticleLink[]> {
    if (!articleIds || articleIds.length === 0) return [];

    const targetSet = new Set(articleIds.map(id => id.toLowerCase().trim()));
    const resolved: ResolvedArticleLink[] = [];

    try {
      const snap = await snapshotEngine.getHomepageSnapshot();
      if (snap) {
        const pool = [
          ...(snap.featuredArticles || []),
          ...(snap.latestNews || []),
          ...(snap.trendingNews || []),
          ...(snap.videoNews || []),
          ...Object.values(snap.categoryArticles || {}).flat()
        ];

        for (const art of pool) {
          if (!art || !art.id) continue;
          if (targetSet.has(art.id.toLowerCase())) {
            resolved.push({
              id: art.id,
              title: art.title,
              route: `/news/${art.id}`,
              category: art.category,
              publishedAt: art.publishedAt
            });
            targetSet.delete(art.id.toLowerCase());
          }
        }
      }
    } catch (e) {
      console.warn("[ArchiveArticleResolver] Snapshot lookup error:", e);
    }

    return resolved;
  }
}
