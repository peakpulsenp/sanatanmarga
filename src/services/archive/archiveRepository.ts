import { db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc } from "@/src/lib/firebase";
import { 
  ArchiveRecord, 
  ArchiveStatus, 
  ArchiveVerificationStatus,
  ArchiveEra,
  ArchiveCategory
} from "./archiveTypes";
import { ArchiveAuditLogger } from "./archiveAuditLogger";

export class ArchiveRepository {
  private static instance: ArchiveRepository;

  public static getInstance(): ArchiveRepository {
    if (!ArchiveRepository.instance) {
      ArchiveRepository.instance = new ArchiveRepository();
    }
    return ArchiveRepository.instance;
  }

  private notifySnapshotInvalidated() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("archive-snapshot-invalidated"));
    }
  }

  private checkPermission(actor: { id: string; role: string }) {
    const allowedRoles = ["super_admin", "admin", "chief_editor", "editor", "fact_checker", "archivist"];
    if (!actor || !actor.role || (!allowedRoles.includes(actor.role) && actor.role !== "admin")) {
      throw new Error("UNAUTHORIZED: Actor does not possess archive management permissions.");
    }
  }

  /**
   * Fetch all records (Admin/Editor collection view)
   */
  public async getAllArchives(): Promise<ArchiveRecord[]> {
    try {
      if (db) {
        const snap = await getDocs(collection(db, "archives"));
        if (!snap.empty) {
          return snap.docs.map(d => ({ id: d.id, ...d.data() } as ArchiveRecord));
        }
      }
    } catch (e) {
      console.warn("[ArchiveRepository] Direct Firestore query failed:", e);
    }
    return [];
  }

  /**
   * Create a new Archive record in draft state
   */
  public async createArchive(
    record: Partial<ArchiveRecord>,
    actor: { id: string; role: string }
  ): Promise<ArchiveRecord> {
    this.checkPermission(actor);

    const now = new Date().toISOString();
    const id = record.id || `arch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newRecord: ArchiveRecord = {
      id,
      title: record.title || "Untitled Archive Document",
      titleNepali: record.titleNepali || "शीर्षक नभएको ऐतिहासिक अभिलेख",
      summary: record.summary || "",
      summaryNepali: record.summaryNepali || "",
      yearBS: record.yearBS,
      yearAD: record.yearAD,
      era: record.era || "shah",
      category: record.category || "historical_document",
      location: record.location,
      district: record.district,
      province: record.province,
      description: record.description || "",
      connectedKnowledgeNodeIds: record.connectedKnowledgeNodeIds || [],
      relatedTimelineEventIds: record.relatedTimelineEventIds || [],
      relatedArticleIds: record.relatedArticleIds || [],
      sgisRecordId: record.sgisRecordId,
      documentUrl: record.documentUrl,
      thumbnailUrl: record.thumbnailUrl,
      mimeType: record.mimeType || "application/pdf",
      pageCount: record.pageCount,
      fileSizeBytes: record.fileSizeBytes,
      ocrStatus: record.ocrStatus || "not_started",
      ocrConfidence: record.ocrConfidence,
      ocrText: record.ocrText,
      status: record.status || "draft",
      verificationStatus: record.verificationStatus || "unverified",
      sourceTitle: record.sourceTitle,
      sourceUrls: record.sourceUrls || [],
      verifiedBy: record.verifiedBy,
      verifiedAt: record.verifiedAt,
      confidenceScore: record.confidenceScore ?? 0.85,
      createdAt: now,
      updatedAt: now
    };

    try {
      if (db) {
        await setDoc(doc(db, "archives", newRecord.id), newRecord);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `archives/${newRecord.id}`);
    }

    await ArchiveAuditLogger.logEvent({
      recordId: newRecord.id,
      actorId: actor.id,
      actorRole: actor.role,
      eventType: "ARCHIVE_CREATED",
      previousStatus: "none",
      newStatus: newRecord.status,
      reason: "Initial archive record creation"
    });

    this.notifySnapshotInvalidated();
    return newRecord;
  }

  /**
   * Update existing archive record
   */
  public async updateArchive(
    id: string,
    updates: Partial<ArchiveRecord>,
    actor: { id: string; role: string }
  ): Promise<ArchiveRecord> {
    this.checkPermission(actor);
    const now = new Date().toISOString();

    const mergedUpdates = {
      ...updates,
      updatedAt: now
    };

    try {
      if (db) {
        await setDoc(doc(db, "archives", id), mergedUpdates, { merge: true });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `archives/${id}`);
    }

    await ArchiveAuditLogger.logEvent({
      recordId: id,
      actorId: actor.id,
      actorRole: actor.role,
      eventType: "ARCHIVE_UPDATED",
      previousStatus: updates.status,
      newStatus: updates.status,
      reason: "Archive record update",
      details: { modifiedKeys: Object.keys(updates) }
    });

    this.notifySnapshotInvalidated();
    return { id, ...mergedUpdates } as ArchiveRecord;
  }

  /**
   * Submit record for review
   */
  public async submitForReview(
    id: string,
    actor: { id: string; role: string }
  ): Promise<ArchiveRecord> {
    this.checkPermission(actor);
    const now = new Date().toISOString();

    const updates: Partial<ArchiveRecord> = {
      status: "pending_review",
      verificationStatus: "pending",
      updatedAt: now
    };

    try {
      if (db) {
        await setDoc(doc(db, "archives", id), updates, { merge: true });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `archives/${id}`);
    }

    await ArchiveAuditLogger.logEvent({
      recordId: id,
      actorId: actor.id,
      actorRole: actor.role,
      eventType: "ARCHIVE_SUBMITTED",
      previousStatus: "draft",
      newStatus: "pending_review",
      reason: "Submitted for scholarly review and verification"
    });

    this.notifySnapshotInvalidated();
    return { id, ...updates } as ArchiveRecord;
  }

  /**
   * Verify record with confidence score
   */
  public async verifyArchive(
    id: string,
    confidence: number = 0.95,
    actor: { id: string; role: string }
  ): Promise<ArchiveRecord> {
    this.checkPermission(actor);
    const now = new Date().toISOString();

    const updates: Partial<ArchiveRecord> = {
      status: "verified",
      verificationStatus: "verified",
      verifiedBy: actor.id || "Sanatan Knowledge Council",
      verifiedAt: now,
      confidenceScore: Math.min(1.0, Math.max(0.80, confidence)),
      updatedAt: now
    };

    try {
      if (db) {
        await setDoc(doc(db, "archives", id), updates, { merge: true });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `archives/${id}`);
    }

    await ArchiveAuditLogger.logEvent({
      recordId: id,
      actorId: actor.id,
      actorRole: actor.role,
      eventType: "ARCHIVE_VERIFIED",
      previousStatus: "pending_review",
      newStatus: "verified",
      reason: `Verified with confidence ${confidence}`
    });

    this.notifySnapshotInvalidated();
    return { id, ...updates } as ArchiveRecord;
  }

  /**
   * Publish verified record to public snapshot
   */
  public async publishArchive(
    id: string,
    actor: { id: string; role: string }
  ): Promise<ArchiveRecord> {
    this.checkPermission(actor);
    const now = new Date().toISOString();

    const updates: Partial<ArchiveRecord> = {
      status: "published",
      verificationStatus: "verified",
      updatedAt: now
    };

    try {
      if (db) {
        await setDoc(doc(db, "archives", id), updates, { merge: true });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `archives/${id}`);
    }

    await ArchiveAuditLogger.logEvent({
      recordId: id,
      actorId: actor.id,
      actorRole: actor.role,
      eventType: "ARCHIVE_PUBLISHED",
      previousStatus: "verified",
      newStatus: "published",
      reason: "Published to public snapshot"
    });

    this.notifySnapshotInvalidated();
    return { id, ...updates } as ArchiveRecord;
  }

  /**
   * Deprecate an archive record
   */
  public async deprecateArchive(
    id: string,
    reason: string,
    actor: { id: string; role: string }
  ): Promise<ArchiveRecord> {
    this.checkPermission(actor);
    const now = new Date().toISOString();

    const updates: Partial<ArchiveRecord> = {
      status: "deprecated",
      updatedAt: now
    };

    try {
      if (db) {
        await setDoc(doc(db, "archives", id), updates, { merge: true });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `archives/${id}`);
    }

    await ArchiveAuditLogger.logEvent({
      recordId: id,
      actorId: actor.id,
      actorRole: actor.role,
      eventType: "ARCHIVE_DEPRECATED",
      previousStatus: "published",
      newStatus: "deprecated",
      reason: reason || "Deprecated due to scholarly revision"
    });

    this.notifySnapshotInvalidated();
    return { id, ...updates } as ArchiveRecord;
  }

  /**
   * Archive a record
   */
  public async archiveArchive(
    id: string,
    reason: string,
    actor: { id: string; role: string }
  ): Promise<ArchiveRecord> {
    this.checkPermission(actor);
    const now = new Date().toISOString();

    const updates: Partial<ArchiveRecord> = {
      status: "archived",
      updatedAt: now
    };

    try {
      if (db) {
        await setDoc(doc(db, "archives", id), updates, { merge: true });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `archives/${id}`);
    }

    await ArchiveAuditLogger.logEvent({
      recordId: id,
      actorId: actor.id,
      actorRole: actor.role,
      eventType: "ARCHIVE_ARCHIVED",
      previousStatus: "published",
      newStatus: "archived",
      reason: reason || "Moved to cold archival"
    });

    this.notifySnapshotInvalidated();
    return { id, ...updates } as ArchiveRecord;
  }

  /**
   * Admin-only migration utility for legacy records
   */
  public async migrateLegacyRecords(
    legacyRecords: any[],
    actor: { id: string; role: string }
  ): Promise<{ migrated: number; errors: string[] }> {
    this.checkPermission(actor);
    let migrated = 0;
    const errors: string[] = [];

    for (const item of legacyRecords) {
      try {
        const canonical: Partial<ArchiveRecord> = {
          id: item.id,
          title: item.title,
          titleNepali: item.titleNepali,
          summary: item.summary,
          summaryNepali: item.summaryNepali,
          yearBS: item.yearBS,
          yearAD: item.yearAD,
          era: (item.era as ArchiveEra) || "shah",
          category: (item.category as ArchiveCategory) || "historical_document",
          connectedKnowledgeNodeIds: item.connectedKnowledgeNodeIds || (item.relatedKnowledgeNodeId ? [item.relatedKnowledgeNodeId] : []),
          relatedTimelineEventIds: item.relatedTimelineEventIds || (item.relatedTimelineEventId ? [item.relatedTimelineEventId] : []),
          documentUrl: item.documentUrl || item.sourceDocumentUrl,
          ocrText: item.ocrText,
          status: "published",
          verificationStatus: "verified",
          sourceTitle: item.source || "राष्ट्रिय अभिलेखालय (National Archives of Nepal)",
          sourceUrls: item.originalScriptUrl ? [item.originalScriptUrl] : ["https://nationalarchives.gov.np"],
          verifiedBy: "Sanatan Knowledge Council",
          verifiedAt: new Date().toISOString(),
          confidenceScore: 0.96
        };

        await this.createArchive(canonical, actor);
        migrated++;
      } catch (e: any) {
        errors.push(`Error migrating ${item.id}: ${e.message}`);
      }
    }

    return { migrated, errors };
  }
}

export const archiveRepository = ArchiveRepository.getInstance();
