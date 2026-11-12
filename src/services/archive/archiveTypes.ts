export type ArchiveEra = 
  | "ancient"
  | "malla"
  | "shah"
  | "rana"
  | "panchayat"
  | "modern"
  | "unknown";

export type ArchiveCategory =
  | "manuscript"
  | "treaty"
  | "constitutional"
  | "historical_document"
  | "inscription"
  | "map"
  | "photograph"
  | "government_record"
  | "other";

export type ArchiveStatus =
  | "draft"
  | "pending_review"
  | "verified"
  | "published"
  | "deprecated"
  | "archived";

export type ArchiveVerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";

export type ArchiveOcrStatus =
  | "not_started"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "needs_review";

export interface ArchiveRecord {
  id: string;

  title: string;
  titleNepali: string;

  summary: string;
  summaryNepali: string;

  yearBS?: string;
  yearAD?: string;

  era: ArchiveEra;
  category: ArchiveCategory;

  location?: string;
  district?: string;
  province?: string;

  description?: string;

  connectedKnowledgeNodeIds?: string[];
  relatedTimelineEventIds?: string[];
  relatedArticleIds?: string[];

  sgisRecordId?: string;

  documentUrl?: string;
  thumbnailUrl?: string;

  mimeType?: string;
  pageCount?: number;
  fileSizeBytes?: number;

  ocrStatus?: ArchiveOcrStatus;
  ocrConfidence?: number;
  ocrText?: string;

  status: ArchiveStatus;
  verificationStatus: ArchiveVerificationStatus;

  sourceTitle?: string;
  sourceUrls?: string[];

  verifiedBy?: string;
  verifiedAt?: string;
  confidenceScore?: number;

  createdAt?: string;
  updatedAt?: string;
}

export interface ArchiveManifest {
  snapshotVersion: string;
  schemaVersion: number;
  generatedAt: string;
  generatedBy: string;
  totalRecords: number;
  verifiedRecords: number;
  publishedRecords: number;
  checksum?: string;
}

export interface ArchiveHealth {
  calculatedAt?: string;
  totalRecords: number;
  verifiedRecords: number;
  publishedRecords?: number;
  orphanedRecords: number;
  knowledgeLinks: number;
  timelineLinks: number;
  sgisLinks: number;
  articleLinks: number;
  brokenRelationships: number;
  eraDistribution?: Record<string, number>;
  categoryDistribution?: Record<string, number>;
  averageConfidence?: number;
}

/**
 * Normalizes Nepali numerals to English numerals
 */
export function devanagariToNumber(str: string): number {
  const devanagariDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  let res = "";
  for (const ch of str) {
    const idx = devanagariDigits.indexOf(ch);
    if (idx !== -1) {
      res += idx.toString();
    } else if (/[0-9]/.test(ch)) {
      res += ch;
    }
  }
  return res ? parseInt(res, 10) : NaN;
}

/**
 * Resolves chronological sort key from ArchiveRecord
 * Prioritizes yearAD -> yearBS (converted with ~57 yr offset) -> unknown
 */
export function resolveArchiveDate(record: ArchiveRecord): {
  displayYear: string;
  displayYearNp: string;
  sortKey: number;
  isUnknown: boolean;
} {
  // If yearAD exists
  if (record.yearAD) {
    const num = parseInt(record.yearAD.replace(/[^0-9-]/g, ""), 10);
    if (!isNaN(num)) {
      return {
        displayYear: `${num} AD`,
        displayYearNp: `सन् ${num}`,
        sortKey: num,
        isUnknown: false
      };
    }
  }

  // If yearBS exists
  if (record.yearBS) {
    const bsNum = devanagariToNumber(record.yearBS);
    if (!isNaN(bsNum)) {
      const approxAD = bsNum - 57;
      return {
        displayYear: `${record.yearBS} BS (~${approxAD} AD)`,
        displayYearNp: `वि.सं. ${record.yearBS}`,
        sortKey: approxAD,
        isUnknown: false
      };
    }
  }

  // Fallback by era if date is unknown
  const eraFallbackOrder: Record<ArchiveEra, number> = {
    ancient: 500,
    malla: 1400,
    shah: 1800,
    rana: 1880,
    panchayat: 1970,
    modern: 2010,
    unknown: 9999
  };

  return {
    displayYear: "Date Unknown",
    displayYearNp: "अज्ञात मिति",
    sortKey: eraFallbackOrder[record.era] || 9999,
    isUnknown: true
  };
}
