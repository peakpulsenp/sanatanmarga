import { 
  TimelineEvent, 
  TimelineManifest, 
  TimelineGraphHealth,
  resolveTimelineDate,
  TimelineCategory
} from "@/src/types/timeline";
import { CANONICAL_ENTITIES } from "@/src/services/knowledgeOS";

export interface TimelineAuditCheckResult {
  code: string;
  name: string;
  category: "provenance" | "chronology" | "relationships" | "governance" | "manifest";
  status: "pass" | "warn" | "fail";
  description: string;
  details?: string;
  affectedCount?: number;
  affectedIds?: string[];
}

export interface TimelineAuditReport {
  timestamp: string;
  totalEvents: number;
  checks: TimelineAuditCheckResult[];
  passedCount: number;
  warnCount: number;
  failCount: number;
  overallScore: number;
}

const VALID_CATEGORIES: TimelineCategory[] = [
  "monument",
  "festival",
  "scripture",
  "treaty",
  "historical_event",
  "person",
  "heritage",
  "manuscript",
  "knowledge"
];

export class TimelineAuditEngine {
  /**
   * Run all 20 audit checks [TL-A] through [TL-T] against the timeline dataset
   */
  public static runAudit(
    events: TimelineEvent[],
    manifest?: TimelineManifest | null,
    health?: TimelineGraphHealth | null,
    validKnowledgeIds?: string[]
  ): TimelineAuditReport {
    const checks: TimelineAuditCheckResult[] = [];
    const knownKnowledgeIds = new Set<string>(
      validKnowledgeIds || CANONICAL_ENTITIES.map(e => e.id)
    );

    // [TL-A]: Public Snapshot Verification Gate
    const unpublished = events.filter(e => e.status !== "published");
    checks.push({
      code: "TL-A",
      name: "Public Snapshot Verification Gate",
      category: "governance",
      status: unpublished.length === 0 ? "pass" : "fail",
      description: "Ensure no unpublished or draft event exists in the public snapshot.",
      details: unpublished.length === 0 
        ? "All public snapshot events are published." 
        : `Found ${unpublished.length} unpublished events in snapshot.`,
      affectedCount: unpublished.length,
      affectedIds: unpublished.map(e => e.id)
    });

    // [TL-B]: Public Verification Status
    const unverified = events.filter(e => e.verificationStatus !== "verified");
    checks.push({
      code: "TL-B",
      name: "Public Verification Status",
      category: "governance",
      status: unverified.length === 0 ? "pass" : "fail",
      description: "Ensure all events in the public snapshot have verified status.",
      details: unverified.length === 0 
        ? "All public snapshot events are verified." 
        : `Found ${unverified.length} unverified events.`,
      affectedCount: unverified.length,
      affectedIds: unverified.map(e => e.id)
    });

    // [TL-C]: Provenance Completeness
    const missingProvenance = events.filter(e => 
      !e.sourceTitle && (!e.sourceUrls || e.sourceUrls.length === 0)
    );
    checks.push({
      code: "TL-C",
      name: "Provenance Source Completeness",
      category: "provenance",
      status: missingProvenance.length === 0 ? "pass" : "fail",
      description: "Ensure every published event has source documentation and citations.",
      details: missingProvenance.length === 0 
        ? "Every public event contains authoritative citations." 
        : `Found ${missingProvenance.length} events lacking source citations.`,
      affectedCount: missingProvenance.length,
      affectedIds: missingProvenance.map(e => e.id)
    });

    // [TL-D]: Verifier Identity & Timestamp
    const missingVerifier = events.filter(e => !e.verifiedBy || !e.verifiedAt);
    checks.push({
      code: "TL-D",
      name: "Verifier Identity & Timestamp Gate",
      category: "provenance",
      status: missingVerifier.length === 0 ? "pass" : "warn",
      description: "Ensure every verified event records verifier identity and timestamp.",
      details: missingVerifier.length === 0 
        ? "All events record verifier identity." 
        : `Found ${missingVerifier.length} events missing verifier identity.`,
      affectedCount: missingVerifier.length,
      affectedIds: missingVerifier.map(e => e.id)
    });

    // [TL-E]: Chronology Resolution Integrity
    const unresolvableChronology = events.filter(e => {
      try {
        const res = resolveTimelineDate(e);
        return typeof res.sortKey !== "number";
      } catch (err) {
        return true;
      }
    });
    checks.push({
      code: "TL-E",
      name: "Chronology Resolution Integrity",
      category: "chronology",
      status: unresolvableChronology.length === 0 ? "pass" : "fail",
      description: "Ensure resolveTimelineDate resolves every event without runtime exceptions.",
      details: unresolvableChronology.length === 0 
        ? "All events resolved cleanly through the chronology engine." 
        : `Found ${unresolvableChronology.length} events failing chronology parser.`,
      affectedCount: unresolvableChronology.length,
      affectedIds: unresolvableChronology.map(e => e.id)
    });

    // [TL-F]: Event ID Uniqueness
    const idMap = new Map<string, number>();
    events.forEach(e => {
      idMap.set(e.id, (idMap.get(e.id) || 0) + 1);
    });
    const duplicateIds = Array.from(idMap.entries()).filter(([_, count]) => count > 1).map(([id]) => id);
    checks.push({
      code: "TL-F",
      name: "Event ID Uniqueness",
      category: "manifest",
      status: duplicateIds.length === 0 ? "pass" : "fail",
      description: "Ensure all event IDs are uniquely defined without collisions.",
      details: duplicateIds.length === 0 
        ? "All event IDs are distinct and collision-free." 
        : `Duplicate IDs detected: ${duplicateIds.join(", ")}`,
      affectedCount: duplicateIds.length,
      affectedIds: duplicateIds
    });

    // [TL-G]: Historical Record Uniqueness
    const canonicalKeyMap = new Map<string, string[]>();
    events.forEach(e => {
      const key = `${(e.titleEnglish || "").toLowerCase().trim()}__${e.yearAD || e.yearBS || ""}`;
      if (key !== "__") {
        const existing = canonicalKeyMap.get(key) || [];
        existing.push(e.id);
        canonicalKeyMap.set(key, existing);
      }
    });
    const duplicateRecords = Array.from(canonicalKeyMap.entries()).filter(([_, ids]) => ids.length > 1);
    checks.push({
      code: "TL-G",
      name: "Historical Record Uniqueness",
      category: "manifest",
      status: duplicateRecords.length === 0 ? "pass" : "warn",
      description: "Ensure no duplicate historical events exist with identical title and date.",
      details: duplicateRecords.length === 0 
        ? "No duplicate historical events detected." 
        : `Found ${duplicateRecords.length} potential duplicate historical event groups.`,
      affectedCount: duplicateRecords.length,
      affectedIds: duplicateRecords.flatMap(([_, ids]) => ids)
    });

    // [TL-H]: Knowledge OS Relationship Resolution
    const invalidKnowledgeLinks = events.filter(e => {
      if (!e.relatedKnowledgeNodeId) return false;
      return !knownKnowledgeIds.has(e.relatedKnowledgeNodeId);
    });
    checks.push({
      code: "TL-H",
      name: "Knowledge OS Relationship Resolution",
      category: "relationships",
      status: invalidKnowledgeLinks.length === 0 ? "pass" : "warn",
      description: "Ensure relatedKnowledgeNodeId links resolve to real Knowledge Base nodes.",
      details: invalidKnowledgeLinks.length === 0 
        ? "All knowledge node links resolve to valid Knowledge Base entities." 
        : `Found ${invalidKnowledgeLinks.length} unresolved knowledge node links.`,
      affectedCount: invalidKnowledgeLinks.length,
      affectedIds: invalidKnowledgeLinks.map(e => e.id)
    });

    // [TL-I]: News Article Relationship Resolution
    const invalidArticleLinks = events.filter(e => {
      if (!e.relatedArticleId) return false;
      return typeof e.relatedArticleId !== "string" || e.relatedArticleId.trim().length === 0;
    });
    checks.push({
      code: "TL-I",
      name: "News Article Relationship Resolution",
      category: "relationships",
      status: invalidArticleLinks.length === 0 ? "pass" : "warn",
      description: "Ensure relatedArticleId links are properly structured.",
      details: invalidArticleLinks.length === 0 
        ? "All article relationships are properly structured." 
        : `Found ${invalidArticleLinks.length} invalid article references.`,
      affectedCount: invalidArticleLinks.length,
      affectedIds: invalidArticleLinks.map(e => e.id)
    });

    // [TL-J]: Store Product Relationship Resolution
    const invalidProductLinks = events.filter(e => {
      if (!e.relatedProductId) return false;
      return typeof e.relatedProductId !== "string" || e.relatedProductId.trim().length === 0;
    });
    checks.push({
      code: "TL-J",
      name: "Store Product Relationship Resolution",
      category: "relationships",
      status: invalidProductLinks.length === 0 ? "pass" : "warn",
      description: "Ensure relatedProductId links are properly structured.",
      details: invalidProductLinks.length === 0 
        ? "All store product references are properly structured." 
        : `Found ${invalidProductLinks.length} invalid product references.`,
      affectedCount: invalidProductLinks.length,
      affectedIds: invalidProductLinks.map(e => e.id)
    });

    // [TL-K]: Deprecated Exclusion Gate
    const deprecatedInSnapshot = events.filter(e => e.status === "deprecated");
    checks.push({
      code: "TL-K",
      name: "Deprecated Event Exclusion Gate",
      category: "governance",
      status: deprecatedInSnapshot.length === 0 ? "pass" : "fail",
      description: "Ensure deprecated events are strictly excluded from public snapshot.",
      details: deprecatedInSnapshot.length === 0 
        ? "No deprecated events present in public snapshot." 
        : `Found ${deprecatedInSnapshot.length} deprecated events in snapshot.`,
      affectedCount: deprecatedInSnapshot.length,
      affectedIds: deprecatedInSnapshot.map(e => e.id)
    });

    // [TL-L]: Archived Exclusion Gate
    const archivedInSnapshot = events.filter(e => e.status === "archived");
    checks.push({
      code: "TL-L",
      name: "Archived Event Exclusion Gate",
      category: "governance",
      status: archivedInSnapshot.length === 0 ? "pass" : "fail",
      description: "Ensure archived events are strictly excluded from public snapshot.",
      details: archivedInSnapshot.length === 0 
        ? "No archived events present in public snapshot." 
        : `Found ${archivedInSnapshot.length} archived events in snapshot.`,
      affectedCount: archivedInSnapshot.length,
      affectedIds: archivedInSnapshot.map(e => e.id)
    });

    // [TL-M]: Manifest Consistency
    let manifestStatus: "pass" | "warn" | "fail" = "pass";
    let manifestDetails = "Manifest matches snapshot event count.";
    if (manifest) {
      if (manifest.totalEvents !== events.length) {
        manifestStatus = "fail";
        manifestDetails = `Manifest totalEvents (${manifest.totalEvents}) does not match actual count (${events.length}).`;
      }
    } else {
      manifestStatus = "warn";
      manifestDetails = "Manifest metadata not provided or not loaded.";
    }
    checks.push({
      code: "TL-M",
      name: "Snapshot Manifest Consistency",
      category: "manifest",
      status: manifestStatus,
      description: "Verify that snapshot manifest event counts match the loaded snapshot.",
      details: manifestDetails
    });

    // [TL-N]: Snapshot Schema Version
    let schemaStatus: "pass" | "warn" | "fail" = "pass";
    let schemaDetails = "Schema version is modern (>= 1).";
    if (manifest) {
      if (typeof manifest.schemaVersion !== "number" || manifest.schemaVersion < 1) {
        schemaStatus = "fail";
        schemaDetails = `Invalid schema version: ${manifest.schemaVersion}`;
      } else {
        schemaDetails = `Snapshot schema version ${manifest.schemaVersion} verified.`;
      }
    } else {
      schemaStatus = "warn";
      schemaDetails = "Manifest schema version check deferred.";
    }
    checks.push({
      code: "TL-N",
      name: "Snapshot Schema Version Validation",
      category: "manifest",
      status: schemaStatus,
      description: "Verify that snapshot conforms to supported schema version.",
      details: schemaDetails
    });

    // [TL-O]: Deep Link Resolution
    const invalidDeepLinks = events.filter(e => !e.id || encodeURIComponent(e.id) !== e.id);
    checks.push({
      code: "TL-O",
      name: "Deep Link URL Safety",
      category: "relationships",
      status: invalidDeepLinks.length === 0 ? "pass" : "warn",
      description: "Ensure all event IDs are safe for URL path parameters (/timeline/:id).",
      details: invalidDeepLinks.length === 0 
        ? "All event IDs are URL-safe and cleanly addressable." 
        : `Found ${invalidDeepLinks.length} IDs requiring URL escaping.`,
      affectedCount: invalidDeepLinks.length,
      affectedIds: invalidDeepLinks.map(e => e.id)
    });

    // [TL-P]: Zero Synthetic Fallback Rule
    const syntheticEvents = events.filter(e => {
      const text = `${e.titleNepali} ${e.titleEnglish} ${e.summaryNepali} ${e.summaryEnglish}`.toLowerCase();
      return text.includes("lorem ipsum") || text.includes("placeholder") || text.includes("fake_") || text.includes("test-event-fake");
    });
    checks.push({
      code: "TL-P",
      name: "Zero Synthetic Fallback Rule",
      category: "provenance",
      status: syntheticEvents.length === 0 ? "pass" : "fail",
      description: "Strictly prohibit fake placeholder text, mock IDs, or synthetic stubs.",
      details: syntheticEvents.length === 0 
        ? "Zero synthetic data detected. All events are authentic." 
        : `Found ${syntheticEvents.length} events containing synthetic placeholder tokens.`,
      affectedCount: syntheticEvents.length,
      affectedIds: syntheticEvents.map(e => e.id)
    });

    // [TL-Q]: BS / AD Chronological Consistency
    const inconsistentDates: string[] = [];
    events.forEach(e => {
      if (e.yearBS && e.yearAD) {
        // Extract 4-digit BS
        const bsDigits = e.yearBS.replace(/[^\d]/g, "");
        const adDigits = e.yearAD.replace(/[^\d]/g, "");
        if (bsDigits.length === 4 && adDigits.length === 4) {
          const bsNum = parseInt(bsDigits, 10);
          const adNum = parseInt(adDigits, 10);
          const diff = bsNum - adNum;
          if (diff < 50 || diff > 65) {
            inconsistentDates.push(e.id);
          }
        }
      }
    });
    checks.push({
      code: "TL-Q",
      name: "BS / AD Era Offset Consistency",
      category: "chronology",
      status: inconsistentDates.length === 0 ? "pass" : "warn",
      description: "Verify that events specifying both BS and AD years have consistent epoch offsets (~57 years).",
      details: inconsistentDates.length === 0 
        ? "All dual-dated events have consistent calendar conversion." 
        : `Found ${inconsistentDates.length} events with anomalous BS/AD conversion gaps.`,
      affectedCount: inconsistentDates.length,
      affectedIds: inconsistentDates
    });

    // [TL-R]: Category Enum Integrity
    const invalidCategories = events.filter(e => !VALID_CATEGORIES.includes(e.category));
    checks.push({
      code: "TL-R",
      name: "Category Enum Integrity",
      category: "manifest",
      status: invalidCategories.length === 0 ? "pass" : "fail",
      description: "Ensure all events declare canonical category classifications.",
      details: invalidCategories.length === 0 
        ? "All event categories belong to the canonical timeline taxonomy." 
        : `Found ${invalidCategories.length} events with unrecognized categories.`,
      affectedCount: invalidCategories.length,
      affectedIds: invalidCategories.map(e => e.id)
    });

    // [TL-S]: Provenance URL Validity
    const invalidUrls: string[] = [];
    events.forEach(e => {
      if (e.sourceUrls && Array.isArray(e.sourceUrls)) {
        e.sourceUrls.forEach(url => {
          if (!url.startsWith("http://") && !url.startsWith("https://")) {
            invalidUrls.push(e.id);
          }
        });
      }
    });
    checks.push({
      code: "TL-S",
      name: "Provenance URL Validity",
      category: "provenance",
      status: invalidUrls.length === 0 ? "pass" : "fail",
      description: "Ensure all citation links are valid HTTP/HTTPS URLs.",
      details: invalidUrls.length === 0 
        ? "All provenance source URLs are valid web endpoints." 
        : `Found ${invalidUrls.length} invalid provenance URLs.`,
      affectedCount: invalidUrls.length,
      affectedIds: invalidUrls
    });

    // [TL-T]: High Confidence Integrity Gate
    const lowConfidence = events.filter(e => {
      if (typeof e.confidenceScore === "number") {
        return e.confidenceScore < 0.8;
      }
      return false;
    });
    checks.push({
      code: "TL-T",
      name: "High Confidence Integrity Gate",
      category: "governance",
      status: lowConfidence.length === 0 ? "pass" : "fail",
      description: "Ensure all public events satisfy the minimum confidence threshold (>= 0.80).",
      details: lowConfidence.length === 0 
        ? "All public events meet or exceed the 0.80 confidence threshold." 
        : `Found ${lowConfidence.length} events below the confidence threshold.`,
      affectedCount: lowConfidence.length,
      affectedIds: lowConfidence.map(e => e.id)
    });

    const passedCount = checks.filter(c => c.status === "pass").length;
    const warnCount = checks.filter(c => c.status === "warn").length;
    const failCount = checks.filter(c => c.status === "fail").length;
    const overallScore = Math.round(((passedCount + warnCount * 0.5) / checks.length) * 100);

    return {
      timestamp: new Date().toISOString(),
      totalEvents: events.length,
      checks,
      passedCount,
      warnCount,
      failCount,
      overallScore
    };
  }
}
