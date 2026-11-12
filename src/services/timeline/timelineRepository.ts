import { db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from "@/src/lib/firebase";
import { 
  TimelineEvent, 
  TimelineManifest, 
  TimelineGraphHealth,
  resolveTimelineDate 
} from "@/src/types/timeline";
import { TimelineAuditLogger } from "./timelineAuditLogger";

export class TimelineRepository {
  private static instance: TimelineRepository;
  private readonly collectionName = "timeline_events";

  private constructor() {}

  public static getInstance(): TimelineRepository {
    if (!TimelineRepository.instance) {
      TimelineRepository.instance = new TimelineRepository();
    }
    return TimelineRepository.instance;
  }

  /**
   * Fetch all timeline events from Firestore (Admin use only)
   */
  public async getAllEvents(): Promise<TimelineEvent[]> {
    try {
      const q = query(collection(db, this.collectionName), orderBy("updatedAt", "desc"));
      const snap = await getDocs(q);
      if (snap.empty) {
        // Fallback to non-ordered query if index missing
        const plainSnap = await getDocs(collection(db, this.collectionName));
        return plainSnap.docs.map(d => ({ id: d.id, ...d.data() } as TimelineEvent));
      }
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as TimelineEvent));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, this.collectionName);
      return [];
    }
  }

  /**
   * Fetch a single event by ID
   */
  public async getEvent(id: string): Promise<TimelineEvent | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as TimelineEvent;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${this.collectionName}/${id}`);
      return null;
    }
  }

  /**
   * Create a new timeline event with validation
   */
  public async createEvent(
    data: Partial<TimelineEvent>,
    actor: { uid: string; email?: string; role?: string }
  ): Promise<string> {
    const id = data.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newEvent: TimelineEvent = {
      id,
      titleNepali: data.titleNepali || "",
      titleEnglish: data.titleEnglish || "",
      summaryNepali: data.summaryNepali || "",
      summaryEnglish: data.summaryEnglish || "",
      yearBS: data.yearBS || "",
      yearAD: data.yearAD || "",
      startDate: data.startDate || "",
      endDate: data.endDate || "",
      era: data.era || "ancient",
      location: data.location || "",
      district: data.district || "",
      province: data.province || "",
      category: data.category || "monument",
      relatedKnowledgeNodeId: data.relatedKnowledgeNodeId || "",
      relatedArticleId: data.relatedArticleId || "",
      relatedProductId: data.relatedProductId || "",
      relatedManuscriptId: data.relatedManuscriptId || "",
      status: data.status || "draft",
      verificationStatus: data.verificationStatus || "unverified",
      sourceTitle: data.sourceTitle || "",
      sourceUrls: data.sourceUrls || [],
      sourceOrg: data.sourceOrg || "",
      verifiedBy: data.verifiedBy || "",
      verifiedAt: data.verifiedAt || "",
      confidenceScore: typeof data.confidenceScore === "number" ? data.confidenceScore : 0.85,
      createdAt: now,
      updatedAt: now,
      createdBy: actor.uid,
      updatedBy: actor.uid,
      version: 1
    };

    try {
      await setDoc(doc(db, this.collectionName, id), newEvent);
      await TimelineAuditLogger.log({
        action: "create_event",
        targetEventId: id,
        actorId: actor.uid,
        actorEmail: actor.email,
        actorRole: actor.role,
        details: { titleNepali: newEvent.titleNepali, status: newEvent.status }
      });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${this.collectionName}/${id}`);
      throw error;
    }
  }

  /**
   * Update an existing timeline event
   */
  public async updateEvent(
    id: string,
    updates: Partial<TimelineEvent>,
    actor: { uid: string; email?: string; role?: string }
  ): Promise<void> {
    const now = new Date().toISOString();
    const docRef = doc(db, this.collectionName, id);

    try {
      const existing = await this.getEvent(id);
      const newVersion = (existing?.version || 1) + 1;

      await updateDoc(docRef, {
        ...updates,
        updatedAt: now,
        updatedBy: actor.uid,
        version: newVersion
      });

      await TimelineAuditLogger.log({
        action: "update_event",
        targetEventId: id,
        actorId: actor.uid,
        actorEmail: actor.email,
        actorRole: actor.role,
        details: updates
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.collectionName}/${id}`);
      throw error;
    }
  }

  /**
   * Authoritative verification gate
   */
  public async verifyEvent(
    id: string,
    verifierName: string,
    actor: { uid: string; email?: string; role?: string }
  ): Promise<void> {
    const existing = await this.getEvent(id);
    if (!existing) throw new Error("Event not found");

    if (!existing.sourceTitle && (!existing.sourceUrls || existing.sourceUrls.length === 0)) {
      throw new Error("Cannot verify event without provenance (sourceTitle or sourceUrls)");
    }

    const now = new Date().toISOString();
    await this.updateEvent(id, {
      verificationStatus: "verified",
      verifiedBy: verifierName || actor.email || "Editorial Council",
      verifiedAt: now,
      confidenceScore: Math.max(existing.confidenceScore || 0.85, 0.95)
    }, actor);

    await TimelineAuditLogger.log({
      action: "verify_event",
      targetEventId: id,
      actorId: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      details: { verifiedBy: verifierName }
    });
  }

  /**
   * Publish an event (requires verified status and valid provenance)
   */
  public async publishEvent(
    id: string,
    actor: { uid: string; email?: string; role?: string }
  ): Promise<void> {
    const existing = await this.getEvent(id);
    if (!existing) throw new Error("Event not found");

    if (existing.verificationStatus !== "verified") {
      throw new Error("Event must be verified before publishing");
    }

    if (!existing.sourceTitle && (!existing.sourceUrls || existing.sourceUrls.length === 0)) {
      throw new Error("Event must contain provenance sources before publishing");
    }

    await this.updateEvent(id, {
      status: "published"
    }, actor);

    await TimelineAuditLogger.log({
      action: "publish_event",
      targetEventId: id,
      actorId: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role
    });
  }

  /**
   * Deprecate an event
   */
  public async deprecateEvent(
    id: string,
    actor: { uid: string; email?: string; role?: string }
  ): Promise<void> {
    await this.updateEvent(id, {
      status: "deprecated"
    }, actor);

    await TimelineAuditLogger.log({
      action: "deprecate_event",
      targetEventId: id,
      actorId: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role
    });
  }

  /**
   * Archive an event
   */
  public async archiveEvent(
    id: string,
    actor: { uid: string; email?: string; role?: string }
  ): Promise<void> {
    await this.updateEvent(id, {
      status: "archived"
    }, actor);

    await TimelineAuditLogger.log({
      action: "archive_event",
      targetEventId: id,
      actorId: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role
    });
  }

  /**
   * Delete an event permanently
   */
  public async deleteEvent(
    id: string,
    actor: { uid: string; email?: string; role?: string }
  ): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, id));
      await TimelineAuditLogger.log({
        action: "delete_event",
        targetEventId: id,
        actorId: actor.uid,
        actorEmail: actor.email,
        actorRole: actor.role
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${this.collectionName}/${id}`);
      throw error;
    }
  }

  /**
   * Generate clean snapshot export payload from current database state
   */
  public async generateSnapshotPayload(): Promise<{
    events: TimelineEvent[];
    manifest: TimelineManifest;
    health: TimelineGraphHealth;
  }> {
    const all = await this.getAllEvents();
    
    // Only published and verified events enter public snapshot
    const publicEvents = all.filter(e => e.status === "published" && e.verificationStatus === "verified");

    // Sort chronologically
    const sorted = publicEvents.sort((a, b) => {
      return resolveTimelineDate(a).sortKey - resolveTimelineDate(b).sortKey;
    });

    const categoryDistribution: Record<string, number> = {};
    const districts = new Set<string>();
    let validChronologyCount = 0;
    let pendingChronologyCount = 0;
    let resolvedKnowledge = 0;
    let resolvedArticles = 0;
    let resolvedProducts = 0;
    let totalConfidence = 0;

    sorted.forEach(evt => {
      categoryDistribution[evt.category] = (categoryDistribution[evt.category] || 0) + 1;
      if (evt.district) districts.add(evt.district);
      const dateRes = resolveTimelineDate(evt);
      if (dateRes.isPending) {
        pendingChronologyCount++;
      } else {
        validChronologyCount++;
      }
      if (evt.relatedKnowledgeNodeId) resolvedKnowledge++;
      if (evt.relatedArticleId) resolvedArticles++;
      if (evt.relatedProductId) resolvedProducts++;
      totalConfidence += (evt.confidenceScore || 0.85);
    });

    const now = new Date().toISOString();
    const manifest: TimelineManifest = {
      snapshotVersion: `1.${Date.now()}.0-PROD`,
      schemaVersion: 2,
      generatedAt: now,
      generatedBy: "Timeline OS Governance Admin",
      totalEvents: sorted.length,
      verifiedEvents: sorted.length,
      publishedEvents: sorted.length,
      checksum: `tl_sha256_${Date.now().toString(16)}`
    };

    const health: TimelineGraphHealth = {
      calculatedAt: now,
      totalEvents: sorted.length,
      verifiedEvents: sorted.length,
      publishedEvents: sorted.length,
      categoryDistribution,
      districtCoverage: districts.size,
      validChronologyCount,
      pendingChronologyCount,
      resolvedKnowledgeLinks: resolvedKnowledge,
      resolvedArticleLinks: resolvedArticles,
      resolvedProductLinks: resolvedProducts,
      averageConfidence: sorted.length > 0 ? Number((totalConfidence / sorted.length).toFixed(2)) : 0
    };

    return {
      events: sorted,
      manifest,
      health
    };
  }
}

export const timelineRepository = TimelineRepository.getInstance();
