
export type VerificationProvenance =
  | "LIVE_PROVIDER_VERIFIED"
  | "PROVIDER_DISCOVERY_ONLY"
  | "MANUAL_REGISTRATION"
  | "STATIC_SEED"
  | "TEST_FIXTURE"
  | "LEGACY_CONFIG"
  | "UNKNOWN";

export type VerificationEnvironment =
  | "PRODUCTION"
  | "STAGING"
  | "SANDBOX"
  | "FIXTURE";

/**
 * SANATANMARGA 5.0 BETA — AI OBSERVABILITY OS & MODEL CONTROL CENTER TYPES
 * Phase 3H: Workload Governance, Dynamic Gemini Model Registry, Tracing & Cost Accounting
 */

export type AiDomain =
  | "newsroom"
  | "translation"
  | "tts"
  | "sgis"
  | "seo"
  | "moderation"
  | "classification"
  | "summarization"
  | "metadata"
  | "knowledge";

export type AiOperationType =
  | "TEXT_GENERATION"
  | "STRUCTURED_GENERATION"
  | "CLASSIFICATION"
  | "EXTRACTION"
  | "TRANSLATION"
  | "TTS"
  | "OCR_CLEANUP"
  | "SUMMARIZATION"
  | "SEO_ASSIST"
  | "HEADLINE_ASSIST"
  | "MODERATION"
  | "ENTITY_EXTRACTION"
  | "EMBEDDING"
  | "GROUNDING";

export type AiBudgetClass = "LOW" | "STANDARD" | "HIGH" | "CRITICAL";

export type AiWorkloadStatus = "ACTIVE" | "PAUSED" | "DISABLED" | "DEPRECATED";

export interface AiWorkload {
  id: string;
  name: string;
  domain: AiDomain;
  operationType: AiOperationType;
  modelPolicyId: string;
  featureKey: string;
  tenantAware: boolean;
  userAware: boolean;
  reviewRequired: boolean;
  groundingRequired: boolean;
  timeoutMs: number;
  retryPolicyId: string;
  budgetClass: AiBudgetClass;
  status: AiWorkloadStatus;
}

export type AiModelLifecycleStatus =
  | "DISCOVERED"
  | "VERIFIED"
  | "ACTIVE"
  | "DEPRECATED"
  | "UNAVAILABLE"
  | "INCOMPATIBLE"
  | "RETIRED"
  | "UNVERIFIED";

export type AiModelCapability =
  | "TEXT_GENERATION"
  | "STRUCTURED_OUTPUT"
  | "STREAMING"
  | "IMAGE_INPUT"
  | "AUDIO_INPUT"
  | "VIDEO_INPUT"
  | "TTS"
  | "EMBEDDING"
  | "GROUNDING"
  | "LONG_CONTEXT"
  | "TOOL_USE";

export type AiModality = "TEXT" | "IMAGE" | "AUDIO" | "VIDEO";

export interface AiModelRegistryEntry {
  id: string;
  provider: "google_gemini";
  providerModelId: string;
  displayName: string;
  family: string;
  lifecycleStatus: AiModelLifecycleStatus;
  capabilities: AiModelCapability[];
  inputModalities: AiModality[];
  outputModalities: AiModality[];
  supportsStructuredOutput: boolean;
  supportsStreaming: boolean;
  supportsSystemInstruction: boolean;
  supportsTts: boolean;
  supportsEmbeddings: boolean;
  maxContextTokens?: number;
  maxOutputTokens?: number;
  discoveredAt?: string;
  lastVerifiedAt?: string;
  providerMetadataHash?: string;
  verificationProvenance: VerificationProvenance;
  verificationEnvironment: VerificationEnvironment;
  productionExecutable: boolean;
  notes?: string;
}

export type AiModelPolicyStatus = "ACTIVE" | "DEPRECATED" | "CANARY_ONLY" | "ARCHIVED";

export interface AiGenerationProfile {
  id: string;
  name: string;
  temperature: number;
  topP: number;
  maxOutputTokens: number;
  responseMimeType?: string;
  description?: string;
}

export interface AiModelPolicy {
  id: string;
  operationType: AiOperationType;
  primaryModelId: string;
  fallbackModelIds: string[];
  generationProfileId: string;
  promptCompatibilityVersion: string;
  status: AiModelPolicyStatus;
  version: number;
  updatedAt: string;
  updatedBy: string;
}

export interface AiModelPolicyHistoryEntry {
  policyId: string;
  version: number;
  primaryModelId: string;
  fallbackModelIds: string[];
  generationProfileId: string;
  promptCompatibilityVersion: string;
  activatedAt: string;
  activatedBy: string;
  reason: string;
  verificationResultSummary?: string;
}

export interface AiModelVerificationResult {
  modelId: string;
  providerModelId: string;
  verifiedAt: string;
  reachable: boolean;
  requestSuccess: boolean;
  latencyMs: number;
  normalizedError?: string;
  structuredOutputVerified: boolean;
  ttsVerified: boolean;
  streamingVerified: boolean;
  verificationProvenance: VerificationProvenance;
  verificationEnvironment: VerificationEnvironment;
  productionExecutable: boolean;
  health: "HEALTHY" | "DEGRADED" | "RATE_LIMITED" | "UNAVAILABLE" | "UNVERIFIED" | "DISABLED";
  rawDiagnostics?: Record<string, any>;
}

export interface AiCanaryResult {
  canaryId: string;
  candidateModelId: string;
  currentModelId: string;
  workloadId: string;
  passed: boolean;
  schemaValidity: boolean;
  latencyMs: number;
  tokenCount: number;
  providerFailures: number;
  outputCompleteness: boolean;
  executedAt: string;
  error?: string;
}

export type AiNormalizedError =
  | "RATE_LIMITED"
  | "QUOTA_EXHAUSTED"
  | "AUTH_FAILED"
  | "MODEL_UNAVAILABLE"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "INVALID_REQUEST"
  | "CONTENT_BLOCKED"
  | "OUTPUT_PARSE_FAILED"
  | "PROVIDER_ERROR"
  | "UNKNOWN";

export type AiJobStatus =
  | "QUEUED"
  | "RUNNING"
  | "WAITING_RETRY"
  | "WAITING_REVIEW"
  | "RATE_LIMITED"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED";

export type AiReviewStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUPERSEDED";

export interface AiRequestContext {
  requestId: string;
  traceId: string;
  workloadId: string;
  operationType: AiOperationType;
  modelPolicyId: string;
  modelPolicyVersion: number;
  tenantId?: string;
  actorUid?: string;
  resourceType?: string;
  resourceId?: string;
  promptTemplateId?: string;
  promptTemplateVersion?: string;
  startedAt: string;
}

export interface AiJobAttempt {
  attemptNumber: number;
  model: string;
  startedAt: string;
  durationMs: number;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  normalizedError?: AiNormalizedError;
  retryDelayMs?: number;
}

export interface AiTokenUsage {
  inputTokens: number | "NOT_REPORTED";
  outputTokens: number | "NOT_REPORTED";
  totalTokens: number | "NOT_REPORTED";
  cachedTokens?: number | "NOT_REPORTED";
  audioSeconds?: number;
}

export interface AiEstimatedCost {
  currency: "USD";
  estimatedInputCost: number;
  estimatedOutputCost: number;
  estimatedTotalCost: number;
  pricingVersion: string;
  label: "ESTIMATED_COST";
}

export interface AiJobTrace {
  id: string;
  traceId: string;
  workloadId: string;
  operationType: AiOperationType;
  tenantId: string;
  actorUid?: string;
  resourceType?: string;
  resourceId?: string;
  modelPolicyId: string;
  modelPolicyVersion: number;
  actualModelId?: string;
  status: AiJobStatus;
  attempts: AiJobAttempt[];
  startedAt: string;
  completedAt?: string;
  failureCode?: AiNormalizedError;
  reviewStatus: AiReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  outputRef?: string;
  outputHash?: string;
  inputHash?: string;
  inputSizeChars?: number;
  groundingReferences?: string[];
  riskSignals?: ("NO_GROUNDING" | "CITATION_MISMATCH" | "SOURCE_CONFLICT" | "SCHEMA_FAILURE" | "UNSUPPORTED_ENTITY" | "STALE_SOURCE")[];
  usage?: AiTokenUsage;
  estimatedCost?: AiEstimatedCost;
  cacheHit?: boolean;
}

export interface PromptTemplate {
  id: string;
  name: string;
  domain: AiDomain;
  version: string;
  operationType: AiOperationType;
  systemTemplateHash: string;
  userTemplateHash: string;
  responseSchemaVersion?: string;
  status: "DRAFT" | "ACTIVE" | "DEPRECATED" | "RETIRED";
  createdAt: string;
  description?: string;
}

export interface AiFailureAlert {
  id: string;
  dedupKey: string;
  workloadId: string;
  modelId: string;
  failureCode: AiNormalizedError;
  tenantId: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  firstSeen: string;
  lastSeen: string;
  count: number;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  message: string;
}

export interface AiHealthScorecard {
  overallStatus: "HEALTHY" | "DEGRADED" | "CRITICAL";
  domains: Record<string, {
    health: "HEALTHY" | "DEGRADED" | "RATE_LIMITED" | "UNAVAILABLE" | "PAUSED";
    totalRequests: number;
    failureCount: number;
    fallbackCount: number;
    quotaAlertActive: boolean;
    stuckJobsCount: number;
    pendingReviewsCount: number;
  }>;
  recentRequestsCount: number;
  activeFailureAlertsCount: number;
  evaluatedAt: string;
}

export interface AiPricingEntry {
  modelId: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  audioPricePerMinute?: number;
  pricingVersion: string;
  effectiveDate: string;
}
