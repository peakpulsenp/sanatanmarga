export type SgisLifecycleStatus =
  | "UPLOADED"
  | "OCR_PROCESSING"
  | "OCR_COMPLETE"
  | "CLEANUP"
  | "TRANSLITERATION"
  | "TRANSLATION"
  | "SCHOLAR_REVIEW"
  | "VERIFIED"
  | "LIBRARY_PUBLISHED"
  | "RAG_INDEXED";

export const LIFECYCLE_ORDER: SgisLifecycleStatus[] = [
  "UPLOADED",
  "OCR_PROCESSING",
  "OCR_COMPLETE",
  "CLEANUP",
  "TRANSLITERATION",
  "TRANSLATION",
  "SCHOLAR_REVIEW",
  "VERIFIED",
  "LIBRARY_PUBLISHED",
  "RAG_INDEXED"
];

export type SgisRagStatus = "NOT_INDEXED" | "INDEXED" | "REINDEX_REQUIRED";

export type SgisRole = "Admin" | "Archivist" | "Translator" | "Scholar" | "Editor" | "RAG_Manager";

export type SgisAction =
  | "ocr_upload"
  | "text_cleanup"
  | "translate"
  | "transliterate"
  | "scholar_review"
  | "publish"
  | "manage_rag";

export type SgisAuditEventType =
  | "MANUSCRIPT_UPLOADED"
  | "OCR_COMPLETED"
  | "TEXT_CORRECTED"
  | "TEXT_CLEANUP_APPLIED"
  | "GRANTHA_STRUCTURED"
  | "KNOWLEDGE_LINKED"
  | "KNOWLEDGE_GRAPH_LINKED"
  | "TRANSLITERATION_CREATED"
  | "TRANSLITERATION_GENERATED"
  | "TRANSLATION_CREATED"
  | "SCHOLAR_APPROVED"
  | "SCHOLAR_REJECTED"
  | "VERSION_RESTORED"
  | "ROLLED_BACK"
  | "LIBRARY_PUBLISHED"
  | "RAG_INDEXED"
  | "RAG_INVALIDATED"
  | "EXPORT_CREATED";

export interface SgisAuditEvent {
  id: string;
  actor: string;
  actorRole: SgisRole;
  timestamp: string;
  manuscriptId: string;
  version: number;
  action: SgisAuditEventType;
  previousValueHash?: string;
  newValueHash?: string;
  reason: string;
}

export interface CanonicalTextVersion {
  version: number;
  versionTag: string;
  text: string;
  changedBy: string;
  changedAt: string;
  changeReason: string;
  approvedBy?: string;
  previousVersionId?: string;
}

export interface ManuscriptMetadata {
  repositoryName: string;
  accessionNumber: string;
  script: "Devanagari" | "Prachalit_Newari" | "Ranjana" | "Sharada" | "Grantha_Script" | "Brahmi";
  estimatedCentury: string;
  material: "Palm_Leaf" | "Paper" | "Copper_Plate" | "Birch_Bark";
  preservationStatus: "excellent" | "fragile" | "damaged";
  digitalImagesCount: number;
  digitizedBy: string;
  originalFileName: string;
  originalFileUrl?: string;
  imagePreviewBase64?: string;
}

export interface GranthaVerse {
  chapter: number;
  verseNumber: number;
  sanskritVerse: string;
  iastTransliteration: string;
  translations: {
    language: "ne" | "en";
    translatorName: string;
    translationType: "human_verified" | "ai_assisted";
    text: string;
    reviewStatus: "approved" | "pending";
    version: number;
  }[];
  commentaries: {
    id: string;
    scholarName: string;
    tradition: string;
    commentaryText: string;
    isAiSummary?: boolean;
  }[];
}

export interface OCRCandidateCorrection {
  id: string;
  manuscriptId?: string;
  pageNumber?: number;
  rawOcrText: string;
  suggestedCorrection: string;
  reason: string;
  confidence: number;
  submittedBy: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface SgisTranslationRecord {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  mode: "ai_assisted" | "manual";
  translatedText: string;
  translatorName: string;
  version: number;
  status: "pending" | "in_review" | "approved" | "rejected";
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface SgisTransliterationRecord {
  id: string;
  sourceScript: string;
  transliterationSystem: "IAST" | "Romanized" | "Devanagari" | "Prachalit_Newari" | "Ranjana";
  transliteratedText: string;
  createdBy: string;
  createdAt: string;
  reviewStatus: "pending" | "approved";
  version: number;
}

export interface SgisKnowledgeLink {
  entityId: string;
  canonicalName: string;
  entityType: string;
  relevanceReason: string;
  confidence: number;
  linkedAt: string;
}

export interface SgisGrantha {
  id: string;
  accessionNumber: string;
  titleSanskrit: string;
  titleNepali: string;
  titleEnglish: string;
  category: "vedas" | "upanishads" | "puranas" | "itihasa" | "manuscript" | "institutional_sop";
  author: string;
  historicalPeriod: string;
  originalText: string;
  canonicalTextVersions?: CanonicalTextVersion[];
  transliterationIAST: string;
  transliterationRomanized?: string;
  translationNepali?: string;
  translationEnglish?: string;
  manuscriptMetadata?: ManuscriptMetadata;
  verses?: GranthaVerse[];
  ocrPipelineStatus: "raw_ocr" | "normalized" | "candidate_corrections" | "editor_approved" | "canonical_text";
  lifecycleStatus: SgisLifecycleStatus;
  ragStatus: SgisRagStatus;
  ocrConfidence: number;
  scholarValidationStatus: "pending" | "in_review" | "editor_approved" | "canonical_text";
  isPublishedToLibrary: boolean;
  isIndexedInRag: boolean;
  versionHistory: CanonicalTextVersion[];
  translations: SgisTranslationRecord[];
  transliterations: SgisTransliterationRecord[];
  candidateCorrections: OCRCandidateCorrection[];
  knowledgeLinks?: SgisKnowledgeLink[];
  tags: string[];
  auditTrail?: SgisAuditEvent[];
  dateAdded: string;
}

export interface OCRExtractionRequest {
  imageBufferBase64?: string;
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
  sampleText?: string;
  targetScript?: string;
  repositoryName?: string;
  material?: string;
  applyPreprocessing?: boolean;
}

export type SgisConfidenceTier = 
  | "auto_process"                  // >90%
  | "review_suggested"             // 70-90%
  | "ocr_review_required"          // 50-70%
  | "scholar_verification_required"; // <50%

export interface SgisManuscriptCondition {
  physicalCondition: "excellent" | "good" | "fair" | "fragile" | "severely_damaged";
  inkFade: "none" | "minor" | "moderate" | "severe";
  tearsOrHoles: "none" | "minor" | "moderate" | "severe";
  legibility?: string;
  preservationAdvice?: string;
  recoveryStrategy?: string;
}

export interface SgisErrorDetails {
  code?: number | string;
  title: string;
  reason: string;
  solutions: string[];
  note?: string;
  retryAfterSeconds?: number;
}

export interface OCRExtractionResponse {
  success: boolean;
  code?: string;
  retryable?: boolean;
  retryAfterSeconds?: number;
  accessionNumber: string;
  detectedScript: string;
  estimatedCentury: string;
  confidenceScore: number;
  confidenceTier?: SgisConfidenceTier;
  conditionAnalysis?: SgisManuscriptCondition;
  manuscriptCondition?: SgisManuscriptCondition;
  preprocessingApplied?: string[];
  rawExtractedText: string;
  lineCount: number;
  wordCount: number;
  extractedCharCount?: number;
  modelUsed?: string;
  isReviewRequired?: boolean;
  qualityAssessment: "excellent" | "fragile" | "damaged";
  lineSegments: Array<{ lineIndex: number; text: string; confidence: number }>;
  suggestedTitle: {
    sanskrit: string;
    nepali: string;
    english: string;
  };
  error?: string;
  errorDetails?: SgisErrorDetails;
  telemetryAudit?: {
    fileMimeType: string;
    fileSizeKb: number;
    modelChainAttempted: string[];
    latencyMs: number;
    zeroFallbackEnforced: boolean;
  };
}

export interface CleanupRequest {
  text: string;
  language?: string;
  autoFixPunctuation?: boolean;
  normalizeSandhi?: boolean;
  options?: {
    normalizeDanda?: boolean;
    fixHalant?: boolean;
    fixAnusvara?: boolean;
    removeNoise?: boolean;
  };
}

export interface PublicationPreflightResult {
  isEligible: boolean;
  accessionNumber: string;
  checklist: {
    hasMetadata: boolean;
    hasOriginalFile: boolean;
    hasOcrText: boolean;
    hasLanguageAndScript: boolean;
    hasProvenance: boolean;
    isScholarVerified: boolean;
  };
  missingRequirements: string[];
}

export interface CleanupResponse {
  success: boolean;
  cleanedText: string;
  normalizationCount: number;
  candidateCorrections: OCRCandidateCorrection[];
  diffSummary: {
    dandaNormalized: number;
    halantFixed: number;
    anusvaraFixed: number;
    whitespaceCleaned: boolean;
  };
  error?: string;
}

export interface GranthaStructureRequest {
  text: string;
  granthaTitle?: string;
  category?: string;
}

export interface GranthaStructureResponse {
  success: boolean;
  verses: GranthaVerse[];
  iastComplete: string;
  nepaliTranslationSummary: string;
  englishTranslationSummary: string;
  error?: string;
}

export interface KnowledgeLinkRequest {
  text: string;
  title?: string;
  granthaId?: string;
}

export interface KnowledgeLinkResponse {
  success: boolean;
  matchedEntities: SgisKnowledgeLink[];
  suggestedCategories: string[];
  timelineEraLinks: Array<{ eraName: string; century: string; significance: string }>;
  error?: string;
}

export interface SgisPipelineHealth {
  status: "healthy" | "degraded" | "error";
  totalManuscripts: number;
  publishedCount: number;
  ragIndexedCount: number;
  pendingScholarReviews: number;
  averageOcrLatencyMs: number;
  ocrSuccessRatePercent: number;
  activeModelChain: string[];
  lastOcrTimestamp?: string;
}
