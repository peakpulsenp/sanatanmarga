/**
 * SANATANMARGA 5.0 BETA — PHASE 3D
 * Language & Translation OS Type Definitions
 * 
 * Complete definitions for Language Registry, Translation Records,
 * Language Provenance, Source Versioning, Roman Nepali Input,
 * and Scholarly Sanskrit / IAST Transliteration.
 */

export type CanonicalLanguageCode = "ne" | "en" | "hi";

export interface LanguageDefinition {
  code: CanonicalLanguageCode;
  label: string;
  nativeLabel: string;
  script: "Devanagari" | "Latin";
  direction: "ltr";
  isDefault: boolean;
  publicEnabled: boolean;
  editorialEnabled: boolean;
  translationEnabled: boolean;
  ttsEnabled: boolean;
}

export const CANONICAL_LANGUAGES: Record<CanonicalLanguageCode, LanguageDefinition> = {
  ne: {
    code: "ne",
    label: "Nepali",
    nativeLabel: "नेपाली",
    script: "Devanagari",
    direction: "ltr",
    isDefault: true,
    publicEnabled: true,
    editorialEnabled: true,
    translationEnabled: true,
    ttsEnabled: true
  },
  en: {
    code: "en",
    label: "English",
    nativeLabel: "English",
    script: "Latin",
    direction: "ltr",
    isDefault: false,
    publicEnabled: true,
    editorialEnabled: true,
    translationEnabled: true,
    ttsEnabled: true
  },
  hi: {
    code: "hi",
    label: "Hindi",
    nativeLabel: "हिन्दी",
    script: "Devanagari",
    direction: "ltr",
    isDefault: false,
    publicEnabled: false, // Feature-controlled availability
    editorialEnabled: true,
    translationEnabled: true,
    ttsEnabled: true
  }
};

export type LanguageProvenance =
  | "HUMAN_AUTHORED"
  | "HUMAN_TRANSLATED"
  | "AI_ASSISTED"
  | "AI_TRANSLATED"
  | "REVIEWED"
  | "PUBLISHED";

export type TranslationStatus =
  | "NOT_REQUESTED"
  | "DRAFT"
  | "AI_GENERATED"
  | "IN_REVIEW"
  | "REVIEWED"
  | "PUBLISHED"
  | "STALE"
  | "REJECTED";

export interface TranslatedFields {
  title?: string;
  deck?: string;
  summary?: string;
  body?: string;
  caption?: string;
  seoHeadline?: string;
  seoDescription?: string;
  socialHook?: string;
  [key: string]: string | undefined;
}

export interface FactualFidelityReport {
  isValid: boolean;
  issues: string[];
  numbersChecked: number;
  datesChecked: number;
  urlsChecked: number;
  discrepancies: Array<{
    type: "NUMBER" | "DATE" | "URL" | "STRUCTURE";
    sourceVal: string;
    targetVal?: string;
    message: string;
  }>;
}

export interface TranslationRecord {
  translationId: string;
  sourceEntityType: "article" | "knowledge" | "blog" | "chautari" | "event" | "announcement";
  sourceEntityId: string;
  sourceLanguage: CanonicalLanguageCode;
  targetLanguage: CanonicalLanguageCode;
  sourceVersion: number;
  sourceContentHash: string;
  targetEntityId?: string;
  translatedFields: TranslatedFields;
  originalAiFields?: TranslatedFields;
  humanEditedFields?: string[];
  provenance: LanguageProvenance;
  status: TranslationStatus;
  model?: string;
  modelVersion?: string;
  promptVersion?: string;
  generatedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerNotes?: string;
  publishedAt?: string;
  publishedBy?: string;
  confidence?: number;
  fidelityReport?: FactualFidelityReport;
  tenantId: string;
  staleReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type RomanNepaliMode = "OFF" | "LIVE" | "REVIEW";

export type ProtectedTokenType =
  | "EMAIL"
  | "URL"
  | "PASSWORD"
  | "API_KEY"
  | "CODE"
  | "IDENTIFIER"
  | "PHONE"
  | "HASHTAG"
  | "FILE_PATH";

export interface ProtectedTokenMatch {
  type: ProtectedTokenType;
  token: string;
  start: number;
  end: number;
}

export interface TransliterationCandidate {
  roman: string;
  devanagari: string;
  alternatives: string[];
  confidence: number;
}

export interface ScholarlyTransliterationResult {
  sourceText: string;
  targetText: string;
  sourceScript: "Devanagari" | "IAST";
  targetScript: "Devanagari" | "IAST";
  diacriticsPreserved: boolean;
  standard: "IAST_1912_CANONICAL";
  provenance: LanguageProvenance;
}

export interface LanguageOSAdminSummary {
  status: "healthy" | "degraded" | "error";
  totalTranslations: number;
  translationsByStatus: Record<TranslationStatus, number>;
  translationsByLanguage: Record<CanonicalLanguageCode, number>;
  staleTranslationsCount: number;
  pendingReviewCount: number;
  publishedTranslationsCount: number;
  recentAuditLogs: Array<{ action: string; meta: any; timestamp: string }>;
  aiProviderHealth: {
    provider: string;
    model: string;
    isConfigured: boolean;
    rateLimitRemaining?: number;
  };
}
