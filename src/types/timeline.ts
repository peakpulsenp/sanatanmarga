export type TimelineCategory =
  | "monument"
  | "festival"
  | "scripture"
  | "treaty"
  | "historical_event"
  | "person"
  | "heritage"
  | "manuscript"
  | "knowledge";

export type TimelineStatus = 
  | "draft" 
  | "pending_review" 
  | "verified" 
  | "published" 
  | "deprecated" 
  | "archived";

export type TimelineVerificationStatus = 
  | "unverified" 
  | "pending" 
  | "verified" 
  | "rejected";

export type TimelineEra = 
  | "ancient" 
  | "licchavi" 
  | "malla" 
  | "shah" 
  | "rana" 
  | "panchayat" 
  | "constitutional" 
  | "modern";

export interface TimelineProvenance {
  sourceTitle: string;
  sourceUrls: string[];
  sourceOrg?: string;
  verifiedBy: string;
  verifiedAt: string;
  confidenceScore: number;
}

export interface TimelineEvent {
  id: string;
  titleNepali: string;
  titleEnglish: string;
  summaryNepali: string;
  summaryEnglish: string;

  yearBS?: string;
  yearAD?: string;
  startDate?: string;
  endDate?: string;

  era?: TimelineEra;

  location?: string;
  district?: string;
  province?: string;

  category: TimelineCategory;

  relatedKnowledgeNodeId?: string;
  relatedArticleId?: string;
  relatedProductId?: string;
  relatedManuscriptId?: string;

  status: TimelineStatus;
  verificationStatus: TimelineVerificationStatus;

  sourceTitle?: string;
  sourceUrls?: string[];
  sourceOrg?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  confidenceScore?: number;

  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  version?: number;
}

export interface TimelineManifest {
  snapshotVersion: string;
  schemaVersion: number;
  generatedAt: string;
  generatedBy: string;
  totalEvents: number;
  verifiedEvents: number;
  publishedEvents: number;
  checksum?: string;
}

export interface TimelineGraphHealth {
  calculatedAt: string;
  totalEvents: number;
  verifiedEvents: number;
  publishedEvents: number;
  categoryDistribution: Record<string, number>;
  districtCoverage: number;
  validChronologyCount: number;
  pendingChronologyCount: number;
  resolvedKnowledgeLinks: number;
  resolvedArticleLinks: number;
  resolvedProductLinks: number;
  averageConfidence: number;
}

export interface ChronologicalDateResult {
  sortKey: number; // numeric year in AD, negative for BCE, 999999 for pending
  displayYear: string;
  isPending: boolean;
}

/**
 * Robust Chronological Date Resolver
 * Priority: startDate -> yearAD -> yearBS conversion -> pending
 */
export function resolveTimelineDate(event: Partial<TimelineEvent>): ChronologicalDateResult {
  // 1. startDate check (ISO date format YYYY-MM-DD or year)
  if (event.startDate) {
    const match = event.startDate.match(/^(-?\d+)/);
    if (match) {
      const year = parseInt(match[1], 10);
      if (!isNaN(year)) {
        return {
          sortKey: year,
          displayYear: `${year} AD`,
          isPending: false
        };
      }
    }
  }

  // 2. yearAD check
  if (event.yearAD) {
    const clean = event.yearAD.trim();
    // Handle BCE / BC
    const bceMatch = clean.match(/(\d+)\s*(?:BCE|BC|ई\.पू\.)/i);
    if (bceMatch) {
      const year = -parseInt(bceMatch[1], 10);
      return {
        sortKey: year,
        displayYear: `${bceMatch[1]} BCE`,
        isPending: false
      };
    }

    // Century parsing e.g. "5th Century AD" -> 450
    const centuryMatch = clean.match(/(\d+)(?:st|nd|rd|th)?\s*Century\s*AD/i);
    if (centuryMatch) {
      const century = parseInt(centuryMatch[1], 10);
      const approxYear = (century - 1) * 100 + 50;
      return {
        sortKey: approxYear,
        displayYear: clean,
        isPending: false
      };
    }

    // Direct 4-digit AD year
    const yearMatch = clean.match(/(\d{3,4})/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      return {
        sortKey: year,
        displayYear: `${year} AD`,
        isPending: false
      };
    }
  }

  // 3. yearBS conversion
  if (event.yearBS) {
    const devanagariDigits = "०१२३४५६७८९";
    let normalized = "";
    for (const char of event.yearBS) {
      const idx = devanagariDigits.indexOf(char);
      if (idx !== -1) {
        normalized += idx;
      } else if (/\d/.test(char)) {
        normalized += char;
      }
    }

    if (normalized.length >= 3) {
      const bsYear = parseInt(normalized.slice(0, 4), 10);
      if (!isNaN(bsYear) && bsYear > 100 && bsYear < 3000) {
        const adYear = Math.round(bsYear - 56.7);
        return {
          sortKey: adYear,
          displayYear: `${event.yearBS} BS (~${adYear} AD)`,
          isPending: false
        };
      }
    }
  }

  // 4. Undetermined / Ancient Mythological / Pending
  return {
    sortKey: 999999,
    displayYear: event.yearBS || event.yearAD || "काल निर्धारण बाँकी (Chronology Pending)",
    isPending: true
  };
}
