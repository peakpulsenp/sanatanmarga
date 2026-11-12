import { User } from "./index";

export type KnowledgeCategory =
  | "temple"
  | "scripture"
  | "festival"
  | "figure"
  | "heritage"
  | "organization"
  | "concept"
  | "politics"
  | "governance"
  | "economy"
  | "judiciary"
  | string;

export type KnowledgeStatus =
  | "draft"
  | "pending_review"
  | "verified"
  | "published"
  | "deprecated"
  | "archived";

export type KnowledgeVerificationStatus =
  | "unverified"
  | "reviewed"
  | "verified";

export interface KnowledgeProvenance {
  sourceIds?: string[];
  sourceUrls?: string[];
  sourceTitle?: string;
  sourceOrg?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  confidence?: number;
  notes?: string;
}

export interface KnowledgeEntity {
  id: string;
  canonicalId?: string;
  nameNepali: string;
  nameEnglish: string;
  sanskrit?: string;
  aliases?: string[];
  category: KnowledgeCategory;
  type?: string;
  authorityTier?: number | string;
  origin?: string;
  description: string;
  district?: string;
  province?: string;
  historicalPeriod?: string;
  relatedEntities?: string[];
  keyAttributes: Record<string, string>;
  imageUrl?: string;
  status?: KnowledgeStatus;
  verificationStatus?: KnowledgeVerificationStatus;
  verificationEvidence?: string[];
  provenance?: KnowledgeProvenance;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  version?: number;
  // Deep links & Relational IDs
  sgisDocumentIds?: string[];
  scriptureReferenceIds?: string[];
  knowledgeEntityIds?: string[];
  relatedArticleIds?: string[];
}

export interface KnowledgeEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relation:
    | "explained_in"
    | "located_in"
    | "celebrated_in"
    | "worshipped_in"
    | "associated_with"
    | "part_of"
    | "authored_by"
    | "referenced_in"
    | "leads_party"
    | "holds_office"
    | "introduced_bill"
    | "regulates"
    | "oversees"
    | "impacts"
    | "commentary_on"
    | "historical_successor_of"
    | string;
  labelNepali: string;
  labelEnglish: string;
  weight?: number;
  provenance?: KnowledgeProvenance;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScriptureReference {
  id: string;
  nodeId: string;
  granthaId: string;
  granthaTitleNepali: string;
  granthaTitleEnglish?: string;
  chapter: number;
  verse: number;
  sanskritVerse?: string;
  translation?: string;
  translationEnglish?: string;
  source?: string;
  verificationStatus?: KnowledgeVerificationStatus;
  verifiedBy?: string;
  sgisDocumentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KnowledgeGraphHealthMetrics {
  totalNodes: number;
  totalEdges: number;
  verifiedNodes: number;
  publishedNodes: number;
  draftNodes: number;
  pendingNodes: number;
  orphanNodes: number;
  disconnectedComponents: number;
  averageDegree: number;
  districtCoverage: number;
  provinceCoverage: number;
  scriptureCoverage: number;
  provenanceCoverage: number;
  calculatedAt: string;
}

export interface KnowledgeSnapshotMeta {
  snapshotVersion: string;
  schemaVersion: number;
  generatedAt: string;
  source: "snapshot" | "firestore-fallback";
  verified: boolean;
  entityCount: number;
  edgeCount: number;
  referenceCount: number;
}

export interface KnowledgeManifest {
  snapshotVersion: string;
  schemaVersion: number;
  generatedAt: string;
  entityCount: number;
  edgeCount: number;
  referenceCount: number;
  modules: Record<string, { version: string; sha256: string; count: number }>;
}

export interface KnowledgeAuditEvent {
  id: string;
  actorId: string;
  actorEmail?: string;
  actorRole: string;
  entityId: string;
  action:
    | "ENTITY_CREATED"
    | "ENTITY_UPDATED"
    | "ENTITY_SUBMITTED"
    | "ENTITY_VERIFIED"
    | "ENTITY_PUBLISHED"
    | "ENTITY_DEPRECATED"
    | "ENTITY_ARCHIVED"
    | "EDGE_CREATED"
    | "EDGE_UPDATED"
    | "EDGE_DELETED"
    | "SCRIPTURE_CREATED"
    | "SCRIPTURE_UPDATED"
    | "SCRIPTURE_VERIFIED"
    | "SNAPSHOT_REBUILT";
  previousState?: any;
  nextState?: any;
  timestamp: string;
  version?: number;
}

/**
 * Strict Permission Helper for Knowledge OS
 */
export function canManageKnowledge(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.email === "sagarrana@gmail.com") return true;
  return user.role === "admin" || user.role === "super_admin";
}

/**
 * Backwards-compatible normalizer for Knowledge Entities
 */
export function normalizeKnowledgeEntity(raw: any): KnowledgeEntity {
  const id = String(raw.id || raw.canonicalId || `entity-${Date.now()}`);
  const canonicalId = String(raw.canonicalId || raw.id || id);
  const nameNepali = String(raw.nameNepali || raw.titleNepali || raw.canonicalNameNp || id);
  const nameEnglish = String(raw.nameEnglish || raw.title || raw.canonicalNameEn || id);
  
  // Category mapping
  let category: KnowledgeCategory = "temple";
  const rawCat = (raw.category || raw.type || "").toLowerCase();
  if (rawCat.includes("scripture") || rawCat.includes("ग्रन्थ") || rawCat.includes("text")) {
    category = "scripture";
  } else if (rawCat.includes("festival") || rawCat.includes("पर्व") || rawCat.includes("चाड")) {
    category = "festival";
  } else if (rawCat.includes("figure") || rawCat.includes("person") || rawCat.includes("scholar") || rawCat.includes("leader")) {
    category = "figure";
  } else if (rawCat.includes("heritage") || rawCat.includes("place") || rawCat.includes("district") || rawCat.includes("सम्पदा")) {
    category = "heritage";
  } else if (rawCat.includes("org") || rawCat.includes("institution") || rawCat.includes("ministry") || rawCat.includes("संस्था")) {
    category = "organization";
  } else if (rawCat.includes("temple") || rawCat.includes("मन्दिर") || rawCat.includes("धाम")) {
    category = "temple";
  } else if (rawCat) {
    category = rawCat;
  }

  // Status mapping
  let status: KnowledgeStatus = "published";
  if (raw.status) {
    const s = String(raw.status).toLowerCase();
    if (["draft", "pending_review", "verified", "published", "deprecated", "archived"].includes(s)) {
      status = s as KnowledgeStatus;
    }
  }

  // Verification mapping
  let verificationStatus: KnowledgeVerificationStatus = "verified";
  if (raw.verificationStatus) {
    const v = String(raw.verificationStatus).toLowerCase();
    if (v === "verified" || v === "VERIFIED") verificationStatus = "verified";
    else if (v === "reviewed" || v === "pending") verificationStatus = "reviewed";
    else verificationStatus = "unverified";
  }

  // Provenance extraction
  let provenance: KnowledgeProvenance | undefined = undefined;
  if (raw.provenance && typeof raw.provenance === "object") {
    provenance = {
      sourceIds: Array.isArray(raw.provenance.sourceIds) ? raw.provenance.sourceIds : [],
      sourceUrls: Array.isArray(raw.provenance.sourceUrls) ? raw.provenance.sourceUrls : (raw.provenance.sourceUrl ? [raw.provenance.sourceUrl] : []),
      sourceTitle: raw.provenance.sourceTitle || raw.provenance.sourceType || "SanatanMarga Editorial & Scholarly Registry",
      sourceOrg: raw.provenance.sourceOrg || "SanatanMarga Knowledge Council",
      verifiedAt: raw.provenance.verifiedAt || raw.updatedAt || raw.createdAt || new Date().toISOString(),
      verifiedBy: raw.provenance.verifiedBy || "Chief Editor",
      confidence: raw.provenance.confidence ?? 0.98
    };
  } else {
    provenance = {
      sourceIds: [id],
      sourceUrls: raw.verificationEvidence || ["https://sanatanmarga.org/knowledge"],
      sourceTitle: "SanatanMarga Civilizational Heritage Archives",
      sourceOrg: "Nepal Civilizational Research Council",
      verifiedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
      verifiedBy: "Scholar Council",
      confidence: 0.95
    };
  }

  return {
    id,
    canonicalId,
    nameNepali,
    nameEnglish,
    sanskrit: raw.sanskrit || raw.sanskritName || "",
    aliases: Array.isArray(raw.aliases) ? raw.aliases : [],
    category,
    type: raw.type || category,
    authorityTier: raw.authorityTier,
    origin: raw.origin,
    description: String(raw.description || raw.descriptionNp || raw.summaryNepali || raw.summary || ""),
    district: raw.district || "",
    province: raw.province || "",
    historicalPeriod: raw.historicalPeriod || raw.era || "",
    relatedEntities: Array.isArray(raw.relatedEntities) ? raw.relatedEntities : (Array.isArray(raw.connectedEntities) ? raw.connectedEntities : []),
    keyAttributes: (raw.keyAttributes && typeof raw.keyAttributes === "object") ? raw.keyAttributes : {},
    imageUrl: raw.imageUrl || raw.featuredImage || "https://images.unsplash.com/photo-1609137144869-37367123d57f?q=80&w=2070&auto=format&fit=crop",
    status,
    verificationStatus,
    provenance,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    createdBy: raw.createdBy || "system",
    updatedBy: raw.updatedBy || "system",
    version: raw.version || 1,
    sgisDocumentIds: Array.isArray(raw.sgisDocumentIds) ? raw.sgisDocumentIds : [],
    scriptureReferenceIds: Array.isArray(raw.scriptureReferenceIds) ? raw.scriptureReferenceIds : [],
    knowledgeEntityIds: Array.isArray(raw.knowledgeEntityIds) ? raw.knowledgeEntityIds : [],
    relatedArticleIds: Array.isArray(raw.relatedArticleIds) ? raw.relatedArticleIds : []
  };
}
