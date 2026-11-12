/**
 * SANATANMARGA 5.0 BETA — EDITORIAL WORKFLOW FOUNDATION TYPES
 * Phase 4B.1 / 4B.1R: Canonical Candidate Lifecycle, Source Evidence,
 * Freshness Evaluation, State Machine & Editorial Audit
 */

export type EditorialCandidateStatus =
  | "discovered"
  | "source_verified"
  | "pending_review"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "published"
  | "rejected"
  | "expired";

export type SourceFreshnessStatus =
  | "FRESH_BREAKING"
  | "FRESH_STANDARD"
  | "AGING"
  | "EXPIRED"
  | "FUTURE_DATED"
  | "UNKNOWN_TIMESTAMP";

export interface SourceVerificationDetails {
  httpStatus?: number;
  contentType?: string;
  checkedAt: string;
  responseTimeMs?: number;
  bytesRetrieved?: number;
  matchedSnippet?: string;
  verifiedMethod?: "http_probe" | "discovery_connector" | "manual_attestation";
}

export interface CandidateSourceEvidence {
  sourceUrl: string;
  canonicalUrl: string;
  publisher: string;
  publisherDomain: string;
  headline: string;
  publishedAt?: string;
  retrievedAt: string;
  verificationStatus: "verified" | "failed" | "unverified";
  verificationFailureReason?: string;
  verificationDetails?: SourceVerificationDetails;
  contentFingerprint: string;
  excerpt: string;
  retrievedEvidenceSnippet?: string;
  sourceTier?: 1 | 2 | 3 | 4;
  authorityScore?: number;
  isGovernmentPortal?: boolean;
}

export interface CandidateProposedDraft {
  headline: string;
  editorialHeadline?: string;
  summary: string;
  draftBody: string;
  category: string;
  categoryNepali?: string;
  districts?: string[];
  tags?: string[];
  imageKeywords?: string[];
  socialHook?: string;
  uncertaintyNotes?: string[];
  generatedModel: string;
  generatedAt: string;
  inputTokenEstimate?: number;
  outputTokenEstimate?: number;
}

export interface CandidateEditorialHistoryEntry {
  id: string;
  fromStatus: EditorialCandidateStatus;
  toStatus: EditorialCandidateStatus;
  actorUid: string;
  actorEmail?: string;
  actorName?: string;
  actorRole: string;
  timestamp: string;
  reason?: string;
  version: number;
}

export type SchedulingStatus =
  | "idle"
  | "scheduled"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface CandidateSchedule {
  publishAt: string; // ISO 8601 UTC timestamp
  timezone?: string; // IANA timezone for display (e.g. "Asia/Kathmandu")
  scheduledByUid: string;
  scheduledByName?: string;
  scheduledByEmail?: string;
  scheduledByRole?: string;
  scheduledAt: string;
  failureReason?: string;
}

export interface CandidatePublicationResult {
  success: boolean;
  articleId?: string;
  error?: string;
  errorCode?: string;
  executedAt: string;
}

export interface EditorialCandidate {
  id: string;
  status: EditorialCandidateStatus;
  version: number; // Monotonically increasing for optimistic concurrency locking
  title: string;
  category: string;
  categoryNepali?: string;
  district?: string;
  primarySource: CandidateSourceEvidence;
  corroboratingSources: CandidateSourceEvidence[];
  allSourceUrls: string[];
  contentFingerprint: string;
  freshnessScore: number;
  publishedAt?: string;
  discoveredAt: string;
  updatedAt: string;
  assignedToUid?: string;
  assignedToName?: string;
  proposedDraft?: CandidateProposedDraft;
  editorialNotes?: string;
  rejectionReason?: string;
  changesRequestedReason?: string;
  publishedArticleId?: string;
  publishedAtCanonical?: string;
  history: CandidateEditorialHistoryEntry[];
  tenantId?: string;
  requiresEditorialReview?: boolean;
  pendingSnapshotInvalidation?: boolean;
  // Scheduled Publishing OS (Phase 1A/1B)
  schedule?: CandidateSchedule;
  schedulingStatus?: SchedulingStatus;
  executionAttempts?: number;
  lastAttemptAt?: string;
  lastPublicationResult?: CandidatePublicationResult;
  leaseToken?: string | null;
  leaseExpiresAt?: string | null;
}

export interface ScheduleCandidateInput {
  publishAt: string;
  timezone?: string;
}

export interface UpdateDraftInput {
  headline?: string;
  summary?: string;
  draftBody?: string;
  category?: string;
  districts?: string[];
  tags?: string[];
  expectedVersion?: number;
}

export type OutboxJobStatus = "pending" | "processing" | "completed" | "failed";

export interface SnapshotInvalidationOutboxJob {
  id: string;
  candidateId: string;
  articleId: string;
  eventType: "article_publish" | "article_update" | "article_retract";
  triggerSource?: string;
  triggerEntity?: string;
  status: OutboxJobStatus;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: string;
  lockedUntil?: string | null;
  lockedBy?: string | null;
  claimToken?: string | null;
  lastError?: string | null;
  lastErrorCode?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface CreateCandidateInput {
  title: string;
  category: string;
  sourceUrl: string;
  publisher?: string;
  headline?: string;
  publishedAt?: string;
  excerpt: string;
  district?: string;
  corroboratingUrls?: string[];
  skipLiveNetworkProbe?: boolean; // For test environments with mock network
}

export interface PublishCandidateOptions {
  expectedVersion?: number;
  idempotencyKey?: string;
  notes?: string;
}

export interface FreshnessEvaluationResult {
  freshnessScore: number;
  ageHours?: number;
  status: SourceFreshnessStatus;
  isEligibleFreshNews: boolean;
  requiresEditorialReview?: boolean;
  notes?: string;
}
