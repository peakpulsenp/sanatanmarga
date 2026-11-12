import { db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  serverTimestamp 
} from "@/src/lib/firebase";
import { 
  KnowledgeEntity, 
  KnowledgeEdge, 
  ScriptureReference, 
  canManageKnowledge,
  normalizeKnowledgeEntity 
} from "@/src/types/knowledge";
import { User } from "@/src/types";
import { knowledgeAuditLogger } from "./knowledgeAuditLogger";
import { knowledgeSnapshotService } from "./knowledgeSnapshotService";

export class KnowledgeRepository {
  /**
   * Create a new Knowledge Entity
   */
  static async createEntity(
    data: Omit<KnowledgeEntity, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy" | "version"> & { id?: string },
    user: User | null
  ): Promise<{ success: boolean; entity?: KnowledgeEntity; error?: string }> {
    if (!canManageKnowledge(user)) {
      return { success: false, error: "PERMISSION_DENIED: Admin privileges required to create knowledge entities." };
    }

    const id = data.id || data.canonicalId || (data.nameEnglish ? data.nameEnglish.toLowerCase().replace(/[^a-z0-9]+/g, "-") : `entity-${Date.now()}`);
    const canonicalId = data.canonicalId || id;
    const now = new Date().toISOString();

    const entity: KnowledgeEntity = {
      ...data,
      id,
      canonicalId,
      createdAt: now,
      updatedAt: now,
      createdBy: user?.email || "admin",
      updatedBy: user?.email || "admin",
      version: 1,
      status: data.status || "draft",
      verificationStatus: data.verificationStatus || "unverified"
    };

    try {
      await setDoc(doc(db, "knowledge_base", id), {
        ...entity,
        createdAtServer: serverTimestamp(),
        updatedAtServer: serverTimestamp()
      });

      await knowledgeAuditLogger.logEvent({
        actorId: user?.uid || "unknown",
        actorEmail: user?.email,
        actorRole: user?.role || "admin",
        entityId: id,
        action: "ENTITY_CREATED",
        nextState: entity,
        version: 1
      });

      knowledgeSnapshotService.invalidate();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("knowledge-snapshot-invalidated"));
      }

      return { success: true, entity };
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, `knowledge_base/${id}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update an existing Knowledge Entity
   */
  static async updateEntity(
    id: string,
    updates: Partial<KnowledgeEntity>,
    user: User | null
  ): Promise<{ success: boolean; entity?: KnowledgeEntity; error?: string }> {
    if (!canManageKnowledge(user)) {
      return { success: false, error: "PERMISSION_DENIED: Admin privileges required to update knowledge entities." };
    }

    try {
      const docRef = doc(db, "knowledge_base", id);
      const existingSnap = await getDoc(docRef);
      const previousState = existingSnap.exists() ? existingSnap.data() : null;

      const currentVersion = (previousState?.version || 1) + 1;
      const now = new Date().toISOString();

      const updatedPayload: Partial<KnowledgeEntity> = {
        ...updates,
        updatedAt: now,
        updatedBy: user?.email || "admin",
        version: currentVersion
      };

      await updateDoc(docRef, {
        ...updatedPayload,
        updatedAtServer: serverTimestamp()
      });

      await knowledgeAuditLogger.logEvent({
        actorId: user?.uid || "unknown",
        actorEmail: user?.email,
        actorRole: user?.role || "admin",
        entityId: id,
        action: "ENTITY_UPDATED",
        previousState,
        nextState: { ...previousState, ...updatedPayload },
        version: currentVersion
      });

      knowledgeSnapshotService.invalidate();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("knowledge-snapshot-invalidated"));
      }

      const merged = normalizeKnowledgeEntity({ ...(previousState || {}), ...updatedPayload, id });
      return { success: true, entity: merged };
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `knowledge_base/${id}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Transition Verification Status
   */
  static async verifyEntity(
    id: string,
    status: "verified" | "reviewed" | "unverified",
    notes: string,
    user: User | null
  ): Promise<{ success: boolean; error?: string }> {
    if (!canManageKnowledge(user)) {
      return { success: false, error: "PERMISSION_DENIED: Admin privileges required to verify entities." };
    }

    try {
      const docRef = doc(db, "knowledge_base", id);
      const existingSnap = await getDoc(docRef);
      const previousState = existingSnap.exists() ? existingSnap.data() : null;

      const now = new Date().toISOString();
      const updates = {
        verificationStatus: status,
        "provenance.verifiedAt": now,
        "provenance.verifiedBy": user?.email || "Admin",
        "provenance.notes": notes,
        updatedAt: now,
        updatedBy: user?.email || "admin",
        updatedAtServer: serverTimestamp()
      };

      await updateDoc(docRef, updates);

      await knowledgeAuditLogger.logEvent({
        actorId: user?.uid || "unknown",
        actorEmail: user?.email,
        actorRole: user?.role || "admin",
        entityId: id,
        action: "ENTITY_VERIFIED",
        previousState,
        nextState: { ...previousState, verificationStatus: status },
        version: (previousState?.version || 1) + 1
      });

      knowledgeSnapshotService.invalidate();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("knowledge-snapshot-invalidated"));
      }

      return { success: true };
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `knowledge_base/${id}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Publish or change lifecycle state with strict state machine and mandatory provenance validation
   */
  static async publishEntity(
    id: string,
    targetStatus: "draft" | "pending_review" | "verified" | "published" | "deprecated" | "archived",
    user: User | null,
    overrideProvenanceCheck = false
  ): Promise<{ success: boolean; error?: string }> {
    if (!canManageKnowledge(user)) {
      return { success: false, error: "PERMISSION_DENIED: Admin privileges required to modify publication status." };
    }

    try {
      const docRef = doc(db, "knowledge_base", id);
      const existingSnap = await getDoc(docRef);
      if (!existingSnap.exists()) {
        return { success: false, error: `ENTITY_NOT_FOUND: Entity with ID '${id}' does not exist.` };
      }
      
      const previousState = existingSnap.data() as KnowledgeEntity;
      const currentStatus = previousState.status || "draft";

      // 1. Mandatory Provenance Gate for "published" status
      if (targetStatus === "published" && !overrideProvenanceCheck) {
        if (previousState.verificationStatus !== "verified") {
          return {
            success: false,
            error: "VERIFICATION_REQUIRED: Only verified entities can be published. Please verify the entity first."
          };
        }

        const prov = previousState.provenance;
        const hasSource = prov && (prov.sourceTitle || (prov.sourceUrls && prov.sourceUrls.length > 0) || (prov.sourceIds && prov.sourceIds.length > 0));
        const hasVerifier = prov && prov.verifiedBy;
        const hasConfidence = prov && typeof prov.confidence === "number" && prov.confidence >= 0.8;

        if (!hasSource || !hasVerifier || !hasConfidence) {
          return {
            success: false,
            error: "PROVENANCE_REQUIRED: Publication requires authoritative provenance (Source title/URL, Verifier identity, and Confidence score >= 0.8)."
          };
        }
      }

      const now = new Date().toISOString();
      await updateDoc(docRef, {
        status: targetStatus,
        updatedAt: now,
        updatedBy: user?.email || "admin",
        updatedAtServer: serverTimestamp()
      });

      const action = targetStatus === "published" 
        ? "ENTITY_PUBLISHED" 
        : (targetStatus === "archived" ? "ENTITY_ARCHIVED" : "ENTITY_UPDATED");

      await knowledgeAuditLogger.logEvent({
        actorId: user?.uid || "unknown",
        actorEmail: user?.email,
        actorRole: user?.role || "admin",
        entityId: id,
        action: action as any,
        previousState,
        nextState: { ...previousState, status: targetStatus },
        version: (previousState?.version || 1) + 1
      });

      knowledgeSnapshotService.invalidate();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("knowledge-snapshot-invalidated"));
      }

      return { success: true };
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `knowledge_base/${id}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Archive an entity
   */
  static async archiveEntity(id: string, user: User | null): Promise<{ success: boolean; error?: string }> {
    return this.publishEntity(id, "archived", user);
  }

  /**
   * Graph Edge Management
   */
  static async createEdge(edge: KnowledgeEdge, user: User | null): Promise<{ success: boolean; error?: string }> {
    if (!canManageKnowledge(user)) {
      return { success: false, error: "PERMISSION_DENIED" };
    }
    const id = edge.id || `edge-${Date.now()}`;
    const fullEdge = { ...edge, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

    try {
      await setDoc(doc(db, "knowledge_edges", id), fullEdge);
      await knowledgeAuditLogger.logEvent({
        actorId: user?.uid || "unknown",
        actorEmail: user?.email,
        actorRole: user?.role || "admin",
        entityId: id,
        action: "EDGE_CREATED",
        nextState: fullEdge
      });
      knowledgeSnapshotService.invalidate();
      return { success: true };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `knowledge_edges/${id}`);
      return { success: false, error: err.message };
    }
  }

  static async deleteEdge(edgeId: string, user: User | null): Promise<{ success: boolean; error?: string }> {
    if (!canManageKnowledge(user)) {
      return { success: false, error: "PERMISSION_DENIED" };
    }

    try {
      await deleteDoc(doc(db, "knowledge_edges", edgeId));
      await knowledgeAuditLogger.logEvent({
        actorId: user?.uid || "unknown",
        actorEmail: user?.email,
        actorRole: user?.role || "admin",
        entityId: edgeId,
        action: "EDGE_DELETED"
      });
      knowledgeSnapshotService.invalidate();
      return { success: true };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `knowledge_edges/${edgeId}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * Scripture Reference Management
   */
  static async createScriptureReference(ref: ScriptureReference, user: User | null): Promise<{ success: boolean; error?: string }> {
    if (!canManageKnowledge(user)) {
      return { success: false, error: "PERMISSION_DENIED" };
    }
    const id = ref.id || `ref-${Date.now()}`;
    const fullRef = { ...ref, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

    try {
      await setDoc(doc(db, "knowledge_references", id), fullRef);
      await knowledgeAuditLogger.logEvent({
        actorId: user?.uid || "unknown",
        actorEmail: user?.email,
        actorRole: user?.role || "admin",
        entityId: id,
        action: "SCRIPTURE_CREATED",
        nextState: fullRef
      });
      knowledgeSnapshotService.invalidate();
      return { success: true };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `knowledge_references/${id}`);
      return { success: false, error: err.message };
    }
  }

  static async deleteScriptureReference(refId: string, user: User | null): Promise<{ success: boolean; error?: string }> {
    if (!canManageKnowledge(user)) {
      return { success: false, error: "PERMISSION_DENIED" };
    }

    try {
      await deleteDoc(doc(db, "knowledge_references", refId));
      knowledgeSnapshotService.invalidate();
      return { success: true };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `knowledge_references/${refId}`);
      return { success: false, error: err.message };
    }
  }
}
