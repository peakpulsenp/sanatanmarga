import { Article } from "@/src/types";
import { KnowledgeEntity } from "@/src/types/knowledge";
import { snapshotEngine } from "../snapshotEngine";
import { db } from "@/src/lib/firebase";
import { collection, query, where, limit, getDocs } from "@/src/lib/firebase";

export class KnowledgeArticleResolver {
  /**
   * Resolves related articles for a KnowledgeEntity without unbounded collection scans.
   * Checks snapshot cache first, then targeted index queries.
   */
  static async resolveRelatedArticles(entity: KnowledgeEntity, maxResults = 4): Promise<Article[]> {
    if (!entity) return [];

    const results: Article[] = [];
    const seenIds = new Set<string>();

    // 1. Snapshot engine cache lookup
    try {
      const snap = await snapshotEngine.getHomepageSnapshot();
      if (snap) {
        const pool: Article[] = [
          ...(snap.featuredArticles || []),
          ...(snap.latestNews || []),
          ...(snap.trendingNews || []),
          ...(snap.videoNews || []),
          ...Object.values(snap.categoryArticles || {}).flat()
        ];

        for (const art of pool) {
          if (!art || !art.id) continue;
          if (seenIds.has(art.id)) continue;

          let isMatch = false;

          // Direct ID match
          if (entity.relatedArticleIds && entity.relatedArticleIds.includes(art.id)) {
            isMatch = true;
          }
          // Direct knowledge entity tag match
          else if ((art as any).knowledgeEntityIds && (art as any).knowledgeEntityIds.includes(entity.id)) {
            isMatch = true;
          }
          // Title / Excerpt textual match
          else if (art.title && (art.title.includes(entity.nameNepali) || art.title.includes(entity.nameEnglish))) {
            isMatch = true;
          }
          // District match for local heritage
          else if (entity.district && (art as any).district === entity.district && entity.category === "temple") {
            isMatch = true;
          }

          if (isMatch) {
            seenIds.add(art.id);
            results.push(art);
            if (results.length >= maxResults) {
              return results;
            }
          }
        }
      }
    } catch (err) {
      console.warn("[KnowledgeArticleResolver] Snapshot lookup error:", err);
    }

    if (results.length >= maxResults) {
      return results;
    }

    // 2. Targeted Firestore query for explicit `relatedArticleIds` if declared
    if (entity.relatedArticleIds && entity.relatedArticleIds.length > 0) {
      const neededIds = entity.relatedArticleIds.filter(id => !seenIds.has(id)).slice(0, maxResults - results.length);
      for (const artId of neededIds) {
        try {
          const artSnap = await getDocs(query(collection(db, "articles"), where("__name__", "==", artId), limit(1)));
          if (!artSnap.empty) {
            const docData = artSnap.docs[0].data() as Article;
            const art = { id: artSnap.docs[0].id, ...docData };
            if (art.status === "published") {
              seenIds.add(art.id);
              results.push(art);
            }
          }
        } catch (e) {
          // ignore single article fetch errors
        }
      }
    }

    return results;
  }
}
