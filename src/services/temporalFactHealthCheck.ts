import { TemporalKnowledgeOS } from "./temporalKnowledgeOS";
import { TemporalFactAuditor } from "./temporalFactAuditor";

export interface FactHealthTestResult {
  testName: string;
  referenceDate: string;
  expectedPm: string;
  actualPm: string;
  expectedPmNe: string;
  actualPmNe: string;
  resolverStatus: "PASS" | "FAIL";
  generationContextStatus: "PASS" | "FAIL";
  postGenAuditorStatus: "PASS" | "FAIL";
  auditDetails?: any;
}

export interface TemporalHealthSuiteReport {
  timestamp: string;
  overallStatus: "PASS" | "FAIL";
  currentFactTest: FactHealthTestResult;
  historicalFactTest: FactHealthTestResult;
}

export class TemporalFactHealthCheck {
  /**
   * Deterministically runs the production health test suite for Current Facts and Historical Facts.
   */
  public static runSuite(): TemporalHealthSuiteReport {
    // 1. CURRENT FACT TEST (Target Date: 2026-08-26)
    const currentDate = "2026-08-26";
    const currentPmFact = TemporalKnowledgeOS.resolveFact("prime_minister_of_nepal", currentDate);
    const actualPmName = currentPmFact ? currentPmFact.canonicalName : "UNRESOLVED";
    const actualPmNe = currentPmFact ? currentPmFact.displayName.ne : "UNRESOLVED";
    
    const currentResolverStatus = actualPmName === "Balendra Shah" ? "PASS" : "FAIL";

    const currentPromptContext = TemporalKnowledgeOS.generatePromptFactContext(currentDate);
    const currentGenContextStatus = 
      currentPromptContext.includes("Balendra Shah") && 
      currentPromptContext.includes("LEVEL 1 AUTHORITATIVE CURRENT FACTS") 
        ? "PASS" 
        : "FAIL";

    // Test Auditor with conflicting article sample ("प्रधानमन्त्री केपी शर्मा ओलीले...")
    const conflictingSample = "आज काठमाडौँमा प्रधानमन्त्री केपी शर्मा ओलीले सम्बोधन गर्नुभयो।";
    const auditResCurrent = TemporalFactAuditor.auditArticle(conflictingSample, currentDate);
    const currentAuditorStatus = auditResCurrent.status === "FAILED" && auditResCurrent.reason === "TEMPORAL_FACT_CONFLICT" ? "PASS" : "FAIL";

    const currentFactTest: FactHealthTestResult = {
      testName: "CURRENT FACT TEST",
      referenceDate: currentDate,
      expectedPm: "Balendra Shah",
      actualPm: actualPmName,
      expectedPmNe: "बालेन्द्र शाह",
      actualPmNe: actualPmNe,
      resolverStatus: currentResolverStatus,
      generationContextStatus: currentGenContextStatus,
      postGenAuditorStatus: currentAuditorStatus,
      auditDetails: auditResCurrent
    };

    // 2. HISTORICAL FACT TEST (Target Date: 2025-08-26)
    const historicalDate = "2025-08-26";
    const historicalPmFact = TemporalKnowledgeOS.resolveFact("prime_minister_of_nepal", historicalDate);
    const actualHistPmName = historicalPmFact ? historicalPmFact.canonicalName : "UNRESOLVED";
    const actualHistPmNe = historicalPmFact ? historicalPmFact.displayName.ne : "UNRESOLVED";

    const histResolverStatus = actualHistPmName === "Khadga Prasad Sharma Oli" ? "PASS" : "FAIL";

    const histPromptContext = TemporalKnowledgeOS.generatePromptFactContext(historicalDate);
    const histGenContextStatus = 
      histPromptContext.includes("Khadga Prasad Sharma Oli") 
        ? "PASS" 
        : "FAIL";

    // Test Auditor with historical sample ("प्रधानमन्त्री केपी शर्मा ओलीले 2025 मा सम्बोधन गर्नुभयो")
    const validHistoricalSample = "२०८२ भदौमा तात्कालिक प्रधानमन्त्री केपी शर्मा ओलीले सिंहदरबारमा बैठक बोलाउनुभयो।";
    const auditResHist = TemporalFactAuditor.auditArticle(validHistoricalSample, historicalDate);
    const histAuditorStatus = auditResHist.status === "PASSED" ? "PASS" : "FAIL";

    const historicalFactTest: FactHealthTestResult = {
      testName: "HISTORICAL FACT TEST",
      referenceDate: historicalDate,
      expectedPm: "Khadga Prasad Sharma Oli",
      actualPm: actualHistPmName,
      expectedPmNe: "केपी शर्मा ओली",
      actualPmNe: actualHistPmNe,
      resolverStatus: histResolverStatus,
      generationContextStatus: histGenContextStatus,
      postGenAuditorStatus: histAuditorStatus,
      auditDetails: auditResHist
    };

    const overallPass = 
      currentFactTest.resolverStatus === "PASS" &&
      currentFactTest.generationContextStatus === "PASS" &&
      currentFactTest.postGenAuditorStatus === "PASS" &&
      historicalFactTest.resolverStatus === "PASS" &&
      historicalFactTest.postGenAuditorStatus === "PASS";

    return {
      timestamp: new Date().toISOString(),
      overallStatus: overallPass ? "PASS" : "FAIL",
      currentFactTest,
      historicalFactTest
    };
  }
}
