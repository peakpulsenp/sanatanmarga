import { parseNewsTimestamp, ParsedTimestampResult } from "../utils/timestampParser";
import { isSameNepalCalendarDay, getNepalCalendarDateString, getNepalDate } from "../utils/dateEngine";

export interface FreshnessCandidate {
  id?: string;
  sourcePublishedAt?: string;
  originalPublishedAt?: string;
  canonicalPublishedAt?: string;
  publishedAt?: string;
  modifiedAt?: string;
  fetchedAt?: string;
  ingestedAt?: string;
  updatedAt?: string;
  generatedAt?: string;
  sourceUrl?: string;
  publisher?: string;
  discoveryTimestamp?: string;
  title?: string;
  status?: string;
  verificationStatus?: string;
  sourceDateConfidence?: "AUTHORITATIVE" | "DERIVED" | "UNVERIFIED";
}

export type FreshnessVerificationStatus = 
  | "FRESH" 
  | "SEMI_FRESH" 
  | "STALE" 
  | "NO_AUTHORITATIVE_TIMESTAMP" 
  | "FUTURE_TIMESTAMP_DRIFT" 
  | "UNKNOWN";

export interface FreshnessCandidateLog {
  url: string;
  resolvedPublishedDate: string;
  parserStrategyUsed: string;
  ageHours: number;
  decision: "ACCEPTED" | "REJECTED";
  rejectionReason?: string;
  evaluatedAt: string;
}

export interface FreshnessGateResult {
  isEligible: boolean;
  status: FreshnessVerificationStatus;
  rejectionReason?: string;
  freshnessScore: number;
  nepalDayMatch: boolean;
  ageHours: number;
  ageMinutes: number;
  canonicalPublishedAt: string;
  authoritativeTimestampUsed: string;
  nepalCalendarDate: string;
  todayNepalCalendarDate: string;
}

export interface FreshnessTelemetryMetrics {
  totalEvaluated: number;
  passedCount: number;
  staleRejectedCount: number;
  noTimestampRejectedCount: number;
  futureDriftRejectedCount: number;
  unknownRejectedCount: number;
  nepalDayVerifiedCount: number;
  lastEvaluatedAt: string;
  recentLogs?: FreshnessCandidateLog[];
}

const GLOBAL_FRESHNESS_TELEMETRY_KEY = "sanatan_freshness_gate_telemetry";
const inMemoryLogs: FreshnessCandidateLog[] = [];

const defaultTelemetry: FreshnessTelemetryMetrics = {
  totalEvaluated: 0,
  passedCount: 0,
  staleRejectedCount: 0,
  noTimestampRejectedCount: 0,
  futureDriftRejectedCount: 0,
  unknownRejectedCount: 0,
  nepalDayVerifiedCount: 0,
  lastEvaluatedAt: new Date().toISOString(),
  recentLogs: []
};

/**
 * LatestFreshnessGate
 * Authoritative editorial freshness gate for SanatanMarga /latest stream.
 * Invariants:
 * 1. Authoritative timestamp is source publishedAt, NEVER discoveryTimestamp, fetchedAt, or generatedAt.
 * 2. Hard freshness limit: max 72 hours age.
 * 3. Rejects STALE, UNKNOWN, NO_AUTHORITATIVE_TIMESTAMP.
 * 4. Zero-result policy: Returns zero results if no verified news from the freshness window exists.
 */
export const LatestFreshnessGate = {
  /**
   * Evaluates candidate story against strict 72h and authoritative timestamp constraints.
   */
  verify(candidate: FreshnessCandidate, referenceTime: Date = new Date()): FreshnessGateResult {
    const todayNepal = getNepalCalendarDateString(referenceTime);
    const candidateUrl = candidate.sourceUrl || candidate.id || "unknown_candidate";

    // 1. Resolve authoritative source publication timestamp.
    // fetchedAt, ingestedAt, updatedAt, generatedAt, discoveryTimestamp MUST NEVER substitute.
    const authoritativeTimestamp = 
      (candidate.sourcePublishedAt && candidate.sourcePublishedAt.trim()) ||
      (candidate.originalPublishedAt && candidate.originalPublishedAt.trim()) ||
      (candidate.canonicalPublishedAt && candidate.canonicalPublishedAt.trim()) ||
      (candidate.publishedAt && candidate.publishedAt.trim());

    if (!authoritativeTimestamp) {
      this.recordTelemetry("noTimestampRejectedCount");
      this.logCandidate({
        url: candidateUrl,
        resolvedPublishedDate: "",
        parserStrategyUsed: "none",
        ageHours: 999999,
        decision: "REJECTED",
        rejectionReason: "REJECT_NO_VERIFIABLE_PUBLISH_DATE",
        evaluatedAt: referenceTime.toISOString()
      });
      return {
        isEligible: false,
        status: "NO_AUTHORITATIVE_TIMESTAMP",
        rejectionReason: "REJECT_NO_VERIFIABLE_PUBLISH_DATE",
        freshnessScore: 0,
        nepalDayMatch: false,
        ageHours: 999999,
        ageMinutes: 999999,
        canonicalPublishedAt: "",
        authoritativeTimestampUsed: "none",
        nepalCalendarDate: "",
        todayNepalCalendarDate: todayNepal
      };
    }

    const parsed = parseNewsTimestamp(authoritativeTimestamp, referenceTime);
    if (!parsed.isParsedSuccessfully || !parsed.isoString) {
      const reason = parsed.rejectionReason || "REJECT_NO_VERIFIABLE_PUBLISH_DATE";
      this.recordTelemetry(reason === "FUTURE_TIMESTAMP_DRIFT" ? "futureDriftRejectedCount" : "unknownRejectedCount");
      this.logCandidate({
        url: candidateUrl,
        resolvedPublishedDate: authoritativeTimestamp,
        parserStrategyUsed: parsed.parseMethod,
        ageHours: parsed.ageHours,
        decision: "REJECTED",
        rejectionReason: reason,
        evaluatedAt: referenceTime.toISOString()
      });
      return {
        isEligible: false,
        status: reason === "FUTURE_TIMESTAMP_DRIFT" ? "FUTURE_TIMESTAMP_DRIFT" : "UNKNOWN",
        rejectionReason: reason,
        freshnessScore: 0,
        nepalDayMatch: false,
        ageHours: parsed.ageHours,
        ageMinutes: parsed.ageMinutes,
        canonicalPublishedAt: "",
        authoritativeTimestampUsed: authoritativeTimestamp,
        nepalCalendarDate: "",
        todayNepalCalendarDate: todayNepal
      };
    }

    const candidateDate = new Date(parsed.isoString);
    const nowMs = referenceTime.getTime();
    const candidateNepalDate = getNepalCalendarDateString(candidateDate);

    // 2. Future Timestamp Drift Guard (> 1 hour ahead)
    if (candidateDate.getTime() > nowMs + 60 * 60 * 1000) {
      this.recordTelemetry("futureDriftRejectedCount");
      this.logCandidate({
        url: candidateUrl,
        resolvedPublishedDate: parsed.isoString,
        parserStrategyUsed: parsed.parseMethod,
        ageHours: 0,
        decision: "REJECTED",
        rejectionReason: "FUTURE_TIMESTAMP_DRIFT",
        evaluatedAt: referenceTime.toISOString()
      });
      return {
        isEligible: false,
        status: "FUTURE_TIMESTAMP_DRIFT",
        rejectionReason: "FUTURE_TIMESTAMP_DRIFT",
        freshnessScore: 0,
        nepalDayMatch: false,
        ageHours: 0,
        ageMinutes: 0,
        canonicalPublishedAt: parsed.isoString,
        authoritativeTimestampUsed: authoritativeTimestamp,
        nepalCalendarDate: candidateNepalDate,
        todayNepalCalendarDate: todayNepal
      };
    }

    // 3. Nepal Calendar Day Evaluation & Strict 72h Gate
    const isTodayInNepal = isSameNepalCalendarDay(candidateDate, referenceTime);
    const isWithin72Hours = parsed.ageHours <= 72;

    // Hard Gate: Must be within 72 hours max
    const isFreshStatus = (parsed.freshnessStatus === "FRESH" || parsed.freshnessStatus === "SEMI_FRESH") && isWithin72Hours;
    const isEligible = isFreshStatus;

    let rejectionReason: string | undefined = undefined;
    if (!isEligible) {
      if (parsed.ageHours > 72) {
        rejectionReason = "STALE_SOURCE_72H";
      } else {
        rejectionReason = parsed.rejectionReason || `Story is classified as ${parsed.freshnessStatus} and does not meet freshness criteria.`;
      }
    }

    if (isEligible) {
      this.recordTelemetry("passedCount");
      if (isTodayInNepal) this.recordTelemetry("nepalDayVerifiedCount");
    } else {
      this.recordTelemetry("staleRejectedCount");
    }

    this.logCandidate({
      url: candidateUrl,
      resolvedPublishedDate: parsed.isoString,
      parserStrategyUsed: parsed.parseMethod,
      ageHours: parsed.ageHours,
      decision: isEligible ? "ACCEPTED" : "REJECTED",
      rejectionReason,
      evaluatedAt: referenceTime.toISOString()
    });

    return {
      isEligible,
      status: isEligible ? parsed.freshnessStatus : "STALE",
      rejectionReason,
      freshnessScore: parsed.freshnessScore,
      nepalDayMatch: isTodayInNepal,
      ageHours: parsed.ageHours,
      ageMinutes: parsed.ageMinutes,
      canonicalPublishedAt: parsed.isoString,
      authoritativeTimestampUsed: authoritativeTimestamp,
      nepalCalendarDate: candidateNepalDate,
      todayNepalCalendarDate: todayNepal
    };
  },

  /**
   * Filters an array of candidate stories, returning only those that strictly pass the gate.
   * If zero qualify, returns empty array with zero-result status flag.
   */
  filterLatestCandidates<T extends FreshnessCandidate>(
    candidates: T[],
    referenceTime: Date = new Date()
  ): { eligibleStories: T[]; zeroResultReason?: string; totalEvaluated: number; passedCount: number } {
    if (!candidates || candidates.length === 0) {
      return {
        eligibleStories: [],
        zeroResultReason: "NO_CANDIDATES_DISCOVERED",
        totalEvaluated: 0,
        passedCount: 0
      };
    }

    const results = candidates.map(c => ({
      candidate: c,
      verification: this.verify(c, referenceTime)
    }));

    const passed = results.filter(r => r.verification.isEligible).map(r => r.candidate);

    return {
      eligibleStories: passed,
      zeroResultReason: passed.length === 0 ? "NO_QUALIFYING_STORIES" : undefined,
      totalEvaluated: candidates.length,
      passedCount: passed.length
    };
  },

  /**
   * Telemetry getters and persistence
   */
  getTelemetry(): FreshnessTelemetryMetrics {
    let result = defaultTelemetry;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(GLOBAL_FRESHNESS_TELEMETRY_KEY);
        if (stored) result = JSON.parse(stored);
      } catch (e) {}
    }
    result.recentLogs = [...inMemoryLogs].slice(-50);
    return result;
  },

  recordTelemetry(metricKey: keyof Omit<FreshnessTelemetryMetrics, "totalEvaluated" | "lastEvaluatedAt" | "recentLogs">) {
    if (typeof window === "undefined") return;
    try {
      const current = this.getTelemetry();
      current.totalEvaluated = (current.totalEvaluated || 0) + 1;
      current[metricKey] = (current[metricKey] || 0) + 1;
      current.lastEvaluatedAt = new Date().toISOString();
      localStorage.setItem(GLOBAL_FRESHNESS_TELEMETRY_KEY, JSON.stringify(current));
    } catch (e) {}
  },

  logCandidate(log: FreshnessCandidateLog) {
    inMemoryLogs.push(log);
    if (inMemoryLogs.length > 100) {
      inMemoryLogs.shift();
    }
    if (typeof window !== "undefined") {
      try {
        const current = this.getTelemetry();
        current.recentLogs = inMemoryLogs.slice(-30);
        localStorage.setItem(GLOBAL_FRESHNESS_TELEMETRY_KEY, JSON.stringify(current));
      } catch (e) {}
    }
  },

  getRecentLogs(): FreshnessCandidateLog[] {
    return [...inMemoryLogs];
  }
};
