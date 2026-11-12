import { CANONICAL_ENTITIES, CanonicalEntity } from "@/src/services/knowledgeOS";
import { knowledgeSnapshotService } from "@/src/services/knowledge/knowledgeSnapshotService";

export interface ResolvedKnowledgeLink {
  id: string;
  name: string;
  nameNepali: string;
  category?: string;
  route: string;
  isResolved: boolean;
}

export class ArchiveKnowledgeResolver {
  /**
   * Resolves an array of knowledge node IDs to canonical knowledge entities
   */
  public static async resolveKnowledgeIds(ids: string[] = []): Promise<ResolvedKnowledgeLink[]> {
    if (!ids || ids.length === 0) return [];

    let publicNodes: Array<{ id: string; canonicalNameEn?: string; canonicalNameNp?: string; nameEnglish?: string; nameNepali?: string; type?: string; category?: string }> = CANONICAL_ENTITIES;
    
    try {
      const snapResult = await knowledgeSnapshotService.getEntities({ publicOnly: true });
      if (snapResult && snapResult.entities && snapResult.entities.length > 0) {
        publicNodes = snapResult.entities.map(e => ({
          id: e.id,
          canonicalNameEn: e.nameEnglish,
          canonicalNameNp: e.nameNepali,
          type: e.category
        }));
      }
    } catch (e) {
      // Fallback to CANONICAL_ENTITIES
    }

    const nodeMap = new Map<string, any>();
    publicNodes.forEach(node => {
      nodeMap.set(node.id.toLowerCase(), node);
      if (node.canonicalNameEn) nodeMap.set(node.canonicalNameEn.toLowerCase(), node);
      if (node.canonicalNameNp) nodeMap.set(node.canonicalNameNp.toLowerCase(), node);
    });

    const results: ResolvedKnowledgeLink[] = [];

    for (const rawId of ids) {
      if (!rawId) continue;
      const cleanId = rawId.trim().toLowerCase();
      const matched = nodeMap.get(cleanId);

      if (matched) {
        results.push({
          id: matched.id,
          name: matched.canonicalNameEn || matched.nameEnglish || matched.id,
          nameNepali: matched.canonicalNameNp || matched.nameNepali || matched.canonicalNameEn || matched.id,
          category: matched.type || matched.category,
          route: `/knowledge/${matched.id}`,
          isResolved: true
        });
      } else {
        // Find if any entity matches partially
        const partial = publicNodes.find(n => 
          n.id.toLowerCase().includes(cleanId) ||
          ((n.canonicalNameNp || n.nameNepali) && (n.canonicalNameNp || n.nameNepali)!.includes(rawId)) ||
          ((n.canonicalNameEn || n.nameEnglish) && (n.canonicalNameEn || n.nameEnglish)!.toLowerCase().includes(cleanId))
        );
        if (partial) {
          results.push({
            id: partial.id,
            name: partial.canonicalNameEn || partial.nameEnglish || partial.id,
            nameNepali: partial.canonicalNameNp || partial.nameNepali || partial.canonicalNameEn || partial.id,
            category: partial.type || partial.category,
            route: `/knowledge/${partial.id}`,
            isResolved: true
          });
        }
      }
    }

    return results;
  }
}
