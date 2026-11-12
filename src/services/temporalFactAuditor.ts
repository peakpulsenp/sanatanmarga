import { TemporalKnowledgeOS, TemporalFactRecord } from "./temporalKnowledgeOS";

export interface TemporalFactConflict {
  entity: string;
  roleTitle: string;
  expectedCanonicalName: string;
  expectedDisplayNameNe: string;
  foundInText: string;
  snippet: string;
}

export interface TemporalFactAuditResult {
  status: "PASSED" | "FAILED";
  reason?: string;
  entity?: string;
  expected?: string;
  generated?: string;
  articleDate: string;
  auditedAt: string;
  conflicts: TemporalFactConflict[];
  passedChecksCount: number;
  totalChecksCount: number;
}

export class TemporalFactAuditor {
  /**
   * Post-Generation Temporal Fact Auditor
   * Extracts political and government claims from generated article text
   * and compares them against the Temporal Knowledge OS registry for the target date.
   */
  public static auditArticle(
    articleContent: string | Record<string, any>,
    referenceDate?: string | Date
  ): TemporalFactAuditResult {
    const dateObj = referenceDate ? (typeof referenceDate === "string" ? new Date(referenceDate) : referenceDate) : new Date("2026-08-26T00:00:00+05:45");
    const dateStr = dateObj.toISOString().split("T")[0];

    // Convert input to searchable text
    let fullText = "";
    if (typeof articleContent === "string") {
      fullText = articleContent;
    } else if (articleContent && typeof articleContent === "object") {
      fullText = [
        articleContent.headline,
        articleContent.editorialHeadline,
        articleContent.leadParagraph,
        articleContent.mainDevelopments,
        articleContent.backgroundContext,
        articleContent.stakeholderReactions,
        articleContent.publicImpact,
        articleContent.analysis,
        articleContent.futureOutlook,
        articleContent.conclusion,
        articleContent.content
      ].filter(Boolean).join("\n\n");
    }

    const conflicts: TemporalFactConflict[] = [];
    let totalChecksCount = 0;
    let passedChecksCount = 0;

    // 1. Audit Prime Minister of Nepal
    totalChecksCount++;
    const pmFact = TemporalKnowledgeOS.resolveFact("prime_minister_of_nepal", dateObj);
    if (pmFact) {
      const isBalenActive = pmFact.canonicalName === "Balendra Shah";

      // If Balen Shah is active PM for this date, check if text incorrectly claims KP Oli or Prachanda is current PM or current government
      if (isBalenActive) {
        const falsePmPatterns = [
          /प्रधानमन्त्री\s+(?:केपी\s+शर्मा\s+ओली|केपी\s+ओली|खड्गप्रसाद\s+ओली|ओली)/i,
          /Prime\s+Minister\s+(?:K\.?P\.?\s+Sharma\s+Oli|K\.?P\.?\s+Oli|Khadga\s+Prasad\s+Oli|Oli)/i,
          /(?:केपी\s+शर्मा\s+ओली|केपी\s+ओली|ओली)\s*नेतृत्वको\s*सरकार/i,
          /ओली\s*सरकार/i,
          /(?:KP\s+Oli|K\.?P\.?\s+Sharma\s+Oli|Oli)['’]?s\s+(?:government|administration|cabinet)/i,
          /(?:KP\s+Oli|K\.?P\.?\s+Sharma\s+Oli),\s*Nepal['’]?s\s+(?:prime\s+minister|PM)/i,
          /प्रधानमन्त्री\s+(?:पुष्पकमल\s+दाहाल|प्रचण्ड)/i,
          /Prime\s+Minister\s+(?:Pushpa\s+Kamal\s+Dahal|Prachanda)/i
        ];

        for (const pattern of falsePmPatterns) {
          const match = fullText.match(pattern);
          if (match) {
            const foundText = match[0];

            // Allow if text explicitly specifies former/ex/पूर्व/भूतपूर्व preceding or near the match
            const matchIndex = fullText.indexOf(foundText);
            const prefixSnippet = fullText.slice(Math.max(0, matchIndex - 30), matchIndex).toLowerCase();
            if (prefixSnippet.includes("पूर्व") || prefixSnippet.includes("भूतपूर्व") || prefixSnippet.includes("former") || prefixSnippet.includes("ex-")) {
              continue; // Valid historical mention of former PM
            }

            const start = Math.max(0, matchIndex - 40);
            const end = Math.min(fullText.length, matchIndex + foundText.length + 40);
            const snippet = fullText.slice(start, end).replace(/\n/g, " ");

            conflicts.push({
              entity: "prime_minister_of_nepal",
              roleTitle: "Prime Minister of Nepal",
              expectedCanonicalName: pmFact.canonicalName,
              expectedDisplayNameNe: pmFact.displayName.ne,
              foundInText: foundText,
              snippet: snippet
            });
            break;
          }
        }
      } else {
        // Historical check: if KP Oli is expected PM for this historical date, verify text doesn't claim Balen was PM back then
        const falseHistoricalPatterns = [
          /प्रधानमन्त्री\s+(?:बालेन्द्र\s+शाह|बालेन\s+शाह|बालेन)/i,
          /Prime\s+Minister\s+(?:Balendra\s+Shah|Balen\s+Shah|Balen)/i
        ];

        for (const pattern of falseHistoricalPatterns) {
          const match = fullText.match(pattern);
          if (match) {
            const foundText = match[0];
            const matchIndex = fullText.indexOf(foundText);
            const start = Math.max(0, matchIndex - 40);
            const end = Math.min(fullText.length, matchIndex + foundText.length + 40);
            const snippet = fullText.slice(start, end).replace(/\n/g, " ");

            conflicts.push({
              entity: "prime_minister_of_nepal",
              roleTitle: "Prime Minister of Nepal",
              expectedCanonicalName: pmFact.canonicalName,
              expectedDisplayNameNe: pmFact.displayName.ne,
              foundInText: foundText,
              snippet: snippet
            });
            break;
          }
        }
      }

      if (conflicts.length === 0) {
        passedChecksCount++;
      }
    }

    // 2. Audit President of Nepal
    totalChecksCount++;
    const presidentFact = TemporalKnowledgeOS.resolveFact("president_of_nepal", dateObj);
    if (presidentFact) {
      const falsePresidentPatterns = [
        /राष्ट्रपति\s+(?:विद्यादेवी\s+भण्डारी|विद्या\s+भण्डारी)/i,
        /President\s+(?:Bidya\s+Devi\s+Bhandari|Bidya\s+Bhandari)/i
      ];
      if (presidentFact.canonicalName === "Ram Chandra Poudel") {
        for (const pattern of falsePresidentPatterns) {
          const match = fullText.match(pattern);
          if (match) {
            conflicts.push({
              entity: "president_of_nepal",
              roleTitle: "President of Nepal",
              expectedCanonicalName: presidentFact.canonicalName,
              expectedDisplayNameNe: presidentFact.displayName.ne,
              foundInText: match[0],
              snippet: match[0]
            });
            break;
          }
        }
      }
      if (conflicts.filter(c => c.entity === "president_of_nepal").length === 0) {
        passedChecksCount++;
      }
    }

    const hasFailed = conflicts.length > 0;
    const primaryConflict = conflicts[0];

    return {
      status: hasFailed ? "FAILED" : "PASSED",
      reason: hasFailed ? "TEMPORAL_FACT_CONFLICT" : undefined,
      entity: primaryConflict ? primaryConflict.entity : undefined,
      expected: primaryConflict ? primaryConflict.expectedCanonicalName : undefined,
      generated: primaryConflict ? primaryConflict.foundInText : undefined,
      articleDate: dateStr,
      auditedAt: new Date().toISOString(),
      conflicts,
      passedChecksCount,
      totalChecksCount
    };
  }
}
