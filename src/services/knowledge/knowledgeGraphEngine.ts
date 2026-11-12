import { KnowledgeEntity, KnowledgeEdge, KnowledgeGraphHealthMetrics, ScriptureReference } from "@/src/types/knowledge";
import { knowledgeSnapshotService } from "./knowledgeSnapshotService";

export interface GraphNodeWithDegree {
  entity: KnowledgeEntity;
  degree: number;
  inDegree: number;
  outDegree: number;
  neighborIds: string[];
}

export interface GraphPath {
  nodes: KnowledgeEntity[];
  edges: KnowledgeEdge[];
  length: number;
}

export class KnowledgeGraphEngine {
  private entities: Map<string, KnowledgeEntity> = new Map();
  private edges: KnowledgeEdge[] = [];
  private references: ScriptureReference[] = [];
  private adjacencyList: Map<string, Array<{ targetId: string; edge: KnowledgeEdge }>> = new Map();
  private isLoaded = false;

  /**
   * Initializes or refreshes the graph engine using the snapshot service
   */
  public async load(options: { publicOnly?: boolean } = { publicOnly: true }): Promise<void> {
    const { entities } = await knowledgeSnapshotService.getEntities(options);
    const edges = await knowledgeSnapshotService.getEdges();
    const references = await knowledgeSnapshotService.getReferences();

    this.entities.clear();
    this.adjacencyList.clear();

    entities.forEach(e => {
      this.entities.set(e.id.toLowerCase(), e);
      if (e.canonicalId && e.canonicalId !== e.id) {
        this.entities.set(e.canonicalId.toLowerCase(), e);
      }
      this.adjacencyList.set(e.id.toLowerCase(), []);
    });

    this.edges = edges;
    this.references = references;

    edges.forEach(edge => {
      const src = edge.sourceId.toLowerCase();
      const tgt = edge.targetId.toLowerCase();

      if (!this.adjacencyList.has(src)) {
        this.adjacencyList.set(src, []);
      }
      this.adjacencyList.get(src)!.push({ targetId: tgt, edge });

      // If bidirectional traversal is needed
      if (!this.adjacencyList.has(tgt)) {
        this.adjacencyList.set(tgt, []);
      }
      this.adjacencyList.get(tgt)!.push({ targetId: src, edge });
    });

    this.isLoaded = true;
  }

  public getEntity(idOrCanonicalId: string): KnowledgeEntity | undefined {
    return this.entities.get(idOrCanonicalId.toLowerCase());
  }

  public getAllEntities(): KnowledgeEntity[] {
    // Unique entities only
    const unique = new Map<string, KnowledgeEntity>();
    this.entities.forEach(e => unique.set(e.id, e));
    return Array.from(unique.values());
  }

  public getAllEdges(): KnowledgeEdge[] {
    return [...this.edges];
  }

  public getAllReferences(): ScriptureReference[] {
    return [...this.references];
  }

  /**
   * Get direct neighbor edges for an entity
   */
  public getEdgesForEntity(entityId: string): KnowledgeEdge[] {
    const target = entityId.toLowerCase();
    return this.edges.filter(
      e => e.sourceId.toLowerCase() === target || e.targetId.toLowerCase() === target
    );
  }

  /**
   * Get related connected entities for an entity
   */
  public getRelatedEntities(entityId: string): Array<{ entity: KnowledgeEntity; edge: KnowledgeEdge; direction: "outgoing" | "incoming" }> {
    const target = entityId.toLowerCase();
    const results: Array<{ entity: KnowledgeEntity; edge: KnowledgeEdge; direction: "outgoing" | "incoming" }> = [];
    const seen = new Set<string>();

    for (const edge of this.edges) {
      const src = edge.sourceId.toLowerCase();
      const tgt = edge.targetId.toLowerCase();

      if (src === target) {
        const neighbor = this.entities.get(tgt);
        if (neighbor && !seen.has(neighbor.id)) {
          seen.add(neighbor.id);
          results.push({ entity: neighbor, edge, direction: "outgoing" });
        }
      } else if (tgt === target) {
        const neighbor = this.entities.get(src);
        if (neighbor && !seen.has(neighbor.id)) {
          seen.add(neighbor.id);
          results.push({ entity: neighbor, edge, direction: "incoming" });
        }
      }
    }

    return results;
  }

  /**
   * Get Scripture references for an entity
   */
  public getReferencesForEntity(entityId: string): ScriptureReference[] {
    const target = entityId.toLowerCase();
    return this.references.filter(r => r.nodeId.toLowerCase() === target);
  }

  /**
   * Breadth-First-Search shortest path between two entities
   */
  public findShortestPath(sourceId: string, targetId: string): GraphPath | null {
    const src = sourceId.toLowerCase();
    const tgt = targetId.toLowerCase();

    if (!this.entities.has(src) || !this.entities.has(tgt)) return null;
    if (src === tgt) {
      const node = this.entities.get(src)!;
      return { nodes: [node], edges: [], length: 0 };
    }

    const queue: string[] = [src];
    const visited = new Set<string>([src]);
    const parentMap = new Map<string, { prevId: string; edge: KnowledgeEdge }>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === tgt) break;

      const neighbors = this.adjacencyList.get(current) || [];
      for (const { targetId: nextNodeId, edge } of neighbors) {
        if (!visited.has(nextNodeId)) {
          visited.add(nextNodeId);
          parentMap.set(nextNodeId, { prevId: current, edge });
          queue.push(nextNodeId);
        }
      }
    }

    if (!parentMap.has(tgt)) return null;

    // Reconstruct path
    const pathNodes: KnowledgeEntity[] = [];
    const pathEdges: KnowledgeEdge[] = [];
    let curr = tgt;

    while (curr !== src) {
      const node = this.entities.get(curr);
      if (node) pathNodes.unshift(node);
      const step = parentMap.get(curr);
      if (!step) break;
      pathEdges.unshift(step.edge);
      curr = step.prevId;
    }
    const startNode = this.entities.get(src);
    if (startNode) pathNodes.unshift(startNode);

    return {
      nodes: pathNodes,
      edges: pathEdges,
      length: pathEdges.length
    };
  }

  /**
   * Identifies orphan nodes (nodes with 0 connected edges)
   */
  public getOrphanEntities(): KnowledgeEntity[] {
    const all = this.getAllEntities();
    return all.filter(e => {
      const target = e.id.toLowerCase();
      const hasEdge = this.edges.some(edge => 
        edge.sourceId.toLowerCase() === target || edge.targetId.toLowerCase() === target
      );
      return !hasEdge;
    });
  }

  /**
   * Runs an exhaustive Graph Integrity Diagnostic gate
   */
  public runIntegrityAudit(): {
    isValid: boolean;
    totalEntities: number;
    totalEdges: number;
    totalReferences: number;
    orphanNodes: string[];
    brokenEdges: Array<{ edgeId: string; missingSource?: string; missingTarget?: string }>;
    selfReferencingEdges: string[];
    duplicateEdges: string[];
    unverifiedPublishedNodes: string[];
    missingProvenancePublishedNodes: string[];
    brokenScriptureReferences: Array<{ refId: string; missingNodeId: string }>;
  } {
    const allEntities = this.getAllEntities();
    const entityIdSet = new Set(allEntities.map(e => e.id.toLowerCase()));
    
    // Add canonical IDs to valid set as well
    allEntities.forEach(e => {
      if (e.canonicalId) entityIdSet.add(e.canonicalId.toLowerCase());
    });

    const brokenEdges: Array<{ edgeId: string; missingSource?: string; missingTarget?: string }> = [];
    const selfReferencingEdges: string[] = [];
    const duplicateEdges: string[] = [];
    const seenEdgePairs = new Set<string>();

    this.edges.forEach(edge => {
      const src = edge.sourceId.toLowerCase();
      const tgt = edge.targetId.toLowerCase();

      if (src === tgt) {
        selfReferencingEdges.push(edge.id);
      }

      const pairKey = `${src}->${tgt}:${edge.relation || ""}`;
      if (seenEdgePairs.has(pairKey)) {
        duplicateEdges.push(edge.id);
      } else {
        seenEdgePairs.add(pairKey);
      }

      const missingSrc = !entityIdSet.has(src);
      const missingTgt = !entityIdSet.has(tgt);

      if (missingSrc || missingTgt) {
        brokenEdges.push({
          edgeId: edge.id,
          missingSource: missingSrc ? edge.sourceId : undefined,
          missingTarget: missingTgt ? edge.targetId : undefined
        });
      }
    });

    const orphanNodes = this.getOrphanEntities().map(e => e.id);
    const unverifiedPublishedNodes: string[] = [];
    const missingProvenancePublishedNodes: string[] = [];

    allEntities.forEach(e => {
      if (e.status === "published") {
        if (e.verificationStatus !== "verified") {
          unverifiedPublishedNodes.push(e.id);
        }
        const prov = e.provenance;
        const hasSource = prov && (prov.sourceTitle || (prov.sourceUrls && prov.sourceUrls.length > 0) || (prov.sourceIds && prov.sourceIds.length > 0));
        const hasVerifier = prov && prov.verifiedBy;
        if (!hasSource || !hasVerifier) {
          missingProvenancePublishedNodes.push(e.id);
        }
      }
    });

    const brokenScriptureReferences: Array<{ refId: string; missingNodeId: string }> = [];
    this.references.forEach(ref => {
      if (!entityIdSet.has(ref.nodeId.toLowerCase())) {
        brokenScriptureReferences.push({ refId: ref.id, missingNodeId: ref.nodeId });
      }
    });

    const isValid = brokenEdges.length === 0 && 
                    selfReferencingEdges.length === 0 && 
                    duplicateEdges.length === 0 && 
                    unverifiedPublishedNodes.length === 0 &&
                    missingProvenancePublishedNodes.length === 0 &&
                    brokenScriptureReferences.length === 0;

    return {
      isValid,
      totalEntities: allEntities.length,
      totalEdges: this.edges.length,
      totalReferences: this.references.length,
      orphanNodes,
      brokenEdges,
      selfReferencingEdges,
      duplicateEdges,
      unverifiedPublishedNodes,
      missingProvenancePublishedNodes,
      brokenScriptureReferences
    };
  }

  /**
   * Calculates actual Graph Health Metrics strictly from the loaded dataset
   */
  public calculateHealthMetrics(): KnowledgeGraphHealthMetrics {
    const allEntities = this.getAllEntities();
    const totalNodes = allEntities.length;
    const totalEdges = this.edges.length;

    let verifiedNodes = 0;
    let publishedNodes = 0;
    let draftNodes = 0;
    let pendingNodes = 0;
    let withScriptures = 0;
    let withProvenance = 0;
    const districts = new Set<string>();
    const provinces = new Set<string>();

    allEntities.forEach(e => {
      if (e.verificationStatus === "verified") verifiedNodes++;
      if (e.status === "published") publishedNodes++;
      else if (e.status === "draft") draftNodes++;
      else if (e.status === "pending_review") pendingNodes++;

      if (e.district) districts.add(e.district);
      if (e.province) provinces.add(e.province);

      if ((e.scriptureReferenceIds && e.scriptureReferenceIds.length > 0) || this.getReferencesForEntity(e.id).length > 0) {
        withScriptures++;
      }
      if (e.provenance && (e.provenance.sourceIds?.length || e.provenance.sourceUrls?.length || e.provenance.sourceTitle)) {
        withProvenance++;
      }
    });

    const orphans = this.getOrphanEntities().length;
    const avgDegree = totalNodes > 0 ? Number(((totalEdges * 2) / totalNodes).toFixed(2)) : 0;
    const districtCoverage = totalNodes > 0 ? Math.min(100, Math.round((districts.size / 77) * 100)) : 0;
    const provinceCoverage = totalNodes > 0 ? Math.min(100, Math.round((provinces.size / 7) * 100)) : 0;
    const scriptureCoverage = totalNodes > 0 ? Math.round((withScriptures / totalNodes) * 100) : 0;
    const provenanceCoverage = totalNodes > 0 ? Math.round((withProvenance / totalNodes) * 100) : 0;

    return {
      totalNodes,
      totalEdges,
      verifiedNodes,
      publishedNodes,
      draftNodes,
      pendingNodes,
      orphanNodes: orphans,
      disconnectedComponents: orphans > 0 ? 1 + orphans : 1,
      averageDegree: avgDegree,
      districtCoverage,
      provinceCoverage,
      scriptureCoverage,
      provenanceCoverage,
      calculatedAt: new Date().toISOString()
    };
  }
}

export const knowledgeGraphEngine = new KnowledgeGraphEngine();
