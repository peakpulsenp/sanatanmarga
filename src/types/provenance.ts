/**
 * SanatanMarga Unified Provenance & Truth Contract
 * Production Truth OS v1.0
 * 
 * Every user-visible live value must have a provenance chain, freshness state,
 * timestamp, source identity, and failure state.
 */

export type TruthVerificationStatus = 
  | "verified" 
  | "pending" 
  | "failed" 
  | "unavailable";

export type TruthFreshnessStatus = 
  | "realtime" 
  | "fresh" 
  | "aging" 
  | "stale" 
  | "unavailable";

export type TruthProvenanceType = 
  | "official" 
  | "primary" 
  | "verified-secondary" 
  | "sgis" 
  | "realtime-ingest";

export type DataTruthBadgeState = 
  | "VERIFIED SGIS"
  | "REAL-TIME AUTO-INGEST"
  | "VERIFIED OFFICIAL SOURCE"
  | "VERIFIED SECONDARY"
  | "AWAITING VERIFIED SOURCE"
  | "STALE — NOT FOR LIVE DISPLAY"
  | "DATA TEMPORARILY UNAVAILABLE";

export interface ProvenanceRecord {
  sourceId: string;
  sourceName: string;
  sourceUrl?: string;
  fetchedAt: string;
  publishedAt?: string;
  verifiedAt?: string;

  verificationStatus: TruthVerificationStatus;
  freshnessStatus: TruthFreshnessStatus;
  provenanceType: TruthProvenanceType;

  confidence?: number;
  failureReason?: string;
  authorityScore?: number;
  telemetryProtocol?: "REST_API" | "GOV_FEED" | "SEISMIC_TELEMETRY" | "HYDROMET_SATELLITE" | "SNAPSHOT_OS";
}

/**
 * Calculates freshness status according to elapsed time since fetchedAt
 */
export function calculateFreshnessStatus(
  fetchedAtIso?: string,
  verificationStatus: TruthVerificationStatus = "verified"
): TruthFreshnessStatus {
  if (verificationStatus === "failed" || verificationStatus === "unavailable" || !fetchedAtIso) {
    return "unavailable";
  }

  try {
    const fetchedTime = new Date(fetchedAtIso).getTime();
    if (isNaN(fetchedTime)) return "unavailable";

    const elapsedMs = Math.max(0, Date.now() - fetchedTime);
    const elapsedMinutes = elapsedMs / (1000 * 60);

    if (elapsedMinutes < 2) {
      return "realtime";
    } else if (elapsedMinutes < 15) {
      return "fresh";
    } else if (elapsedMinutes < 240) { // 4 hours
      return "aging";
    } else {
      return "stale";
    }
  } catch {
    return "unavailable";
  }
}

/**
 * Formats relative age in Nepali and English for truth badges
 */
export function formatTruthRelativeAge(isoString?: string): { ne: string; en: string } {
  if (!isoString) return { ne: "अज्ञात समय", en: "Unknown time" };

  try {
    const time = new Date(isoString).getTime();
    if (isNaN(time)) return { ne: "अज्ञात", en: "Unknown" };

    const diffSeconds = Math.floor((Date.now() - time) / 1000);
    if (diffSeconds < 30) {
      return { ne: "भर्खरै (अहिले)", en: "Just now" };
    }
    if (diffSeconds < 60) {
      return { ne: `${diffSeconds} सेकेन्ड अगाडि`, en: `${diffSeconds}s ago` };
    }
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return { ne: `${diffMinutes} मिनेट अगाडि`, en: `${diffMinutes}m ago` };
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return { ne: `${diffHours} घण्टा अगाडि`, en: `${diffHours}h ago` };
    }
    const diffDays = Math.floor(diffHours / 24);
    return { ne: `${diffDays} दिन अगाडि`, en: `${diffDays}d ago` };
  } catch {
    return { ne: "समय त्रुटि", en: "Time error" };
  }
}

/**
 * Derives badge display state from a ProvenanceRecord
 */
export function getBadgeStateFromProvenance(record?: ProvenanceRecord): DataTruthBadgeState {
  if (!record) return "AWAITING VERIFIED SOURCE";

  if (record.verificationStatus === "unavailable" || record.freshnessStatus === "unavailable") {
    return "DATA TEMPORARILY UNAVAILABLE";
  }

  if (record.verificationStatus === "failed") {
    return "AWAITING VERIFIED SOURCE";
  }

  if (record.freshnessStatus === "stale") {
    return "STALE — NOT FOR LIVE DISPLAY";
  }

  if (record.freshnessStatus === "realtime" || record.provenanceType === "realtime-ingest") {
    return "REAL-TIME AUTO-INGEST";
  }

  if (record.provenanceType === "sgis") {
    return "VERIFIED SGIS";
  }

  if (record.provenanceType === "official") {
    return "VERIFIED OFFICIAL SOURCE";
  }

  return "VERIFIED SECONDARY";
}
