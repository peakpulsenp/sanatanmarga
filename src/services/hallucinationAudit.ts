import { Type } from "@google/genai";
import { generateWithRotation } from "./rotatingAiService";
import { NewsroomBrief } from "./discoveryEngine";
import { extractJson } from "../utils/jsonUtils";
import { TemporalFactAuditor } from "./temporalFactAuditor";

export interface HallucinationAuditResult {
  passed: boolean;
  score: number; // 0 to 100 (100 = completely clean)
  flaggedClaims: {
    type: "unverified_stat" | "invented_quote" | "invented_org" | "invented_date" | "invented_official";
    text: string;
    description: string;
    severity: "high" | "medium";
  }[];
  verdict: string;
}

/**
 * AI Hallucination Audit Layer - Priority 2
 * Analyzes generated content against the Ground Truth Editorial Brief to detect hallucinations.
 */
export const HallucinationAudit = {
  async auditArticle(
    title: string,
    content: string,
    brief: NewsroomBrief
  ): Promise<HallucinationAuditResult> {
    const plainText = content.replace(/<[^>]*>/g, " ").trim();

    const prompt = `You are a meticulous Newsroom Fact-Checker & Anti-Hallucination Agent for Sanatan Marga News Network.
Your absolute priority is to detect and flag any fabricated information (hallucinations) in the generated Nepali news article when compared against today's Ground Truth Editorial Brief.

GROUND TRUTH BRIEF:
${JSON.stringify(brief, null, 2)}

GENERATED ARTICLE TITLE: ${title}
GENERATED ARTICLE TEXT:
${plainText.substring(0, 4000)} // Analyze up to first 4k chars

Check for these FIVE specific hallucination types:
1. unverified_stat: Statistics, percentages, monetary amounts, or numeric counts mentioned in the text that are NOT grounded in or reasonably extrapolated from the brief's facts.
2. invented_quote: Direct or indirect quotes attributed to figures who are either entirely fictitious, or whose statements are not supported by the brief/sources.
3. invented_org: Spurious government departments, NGOs, or foreign organizations that are invented out of thin air.
4. invented_date: Dates that are self-contradictory, run contrary to current dynamic date context, or are placed randomly without historical truth.
5. invented_official: Names of politicians, CDOs, experts, or officers who are fictitious or not authorized in the brief.

Score the article from 0 to 100 (where 100 means absolutely NO hallucinations detected).
If the score is below 85, or if there is any 'high' severity fabrication, the article MUST fail the audit (passed: false) and require strict manual Editorial Review.

Return a JSON object matching the required schema. Ensure the fields are strictly correct.`;

    try {
      const response = await generateWithRotation({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2, // Low temperature for high precision/consistency
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                passed: { type: Type.BOOLEAN },
                score: { type: Type.INTEGER },
                flaggedClaims: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { 
                        type: Type.STRING, 
                        enum: ["unverified_stat", "invented_quote", "invented_org", "invented_date", "invented_official"] 
                      },
                      text: { type: Type.STRING },
                      description: { type: Type.STRING },
                      severity: { type: Type.STRING, enum: ["high", "medium"] }
                    },
                    required: ["type", "text", "description", "severity"]
                  }
                },
                verdict: { type: Type.STRING }
              },
              required: ["passed", "score", "flaggedClaims", "verdict"]
            }
          }
        }
      });

      if (response && response.text) {
        return extractJson<HallucinationAuditResult>(response.text);
      }
    } catch (e) {
      console.warn("[HallucinationAudit] Error during automated AI audit, compiling static safety fallback:", e);
    }

    // Static Safety Audit Fallback: Parse statistics and placeholder tags
    const flaggedClaims: HallucinationAuditResult["flaggedClaims"] = [];
    
    // Check for obvious placeholder tags in the content
    const placeholderRegex = /\[[^\]]+\]|{.*}/g;
    if (placeholderRegex.test(content)) {
      flaggedClaims.push({
        type: "invented_official",
        text: "Placeholder tag detected",
        description: "Content contains unresolved templates like [Name] or [Date]",
        severity: "high"
      });
    }

    // Check using Temporal Fact Auditor for exact time-scoped office-holder verification
    const temporalAudit = TemporalFactAuditor.auditArticle(content, brief.eventDateAD || "2026-08-26");
    if (temporalAudit.status === "FAILED" && temporalAudit.conflicts.length > 0) {
      for (const conflict of temporalAudit.conflicts) {
        flaggedClaims.push({
          type: "invented_official",
          text: conflict.foundInText,
          description: `Temporal Knowledge OS Conflict: Article claims '${conflict.foundInText}', but expected '${conflict.expectedCanonicalName} (${conflict.expectedDisplayNameNe})' for ${temporalAudit.articleDate}.`,
          severity: "high"
        });
      }
    }

    // Heuristics: search for percentages and verify if they exist in brief
    const percentMatches = content.match(/(\d+)\s*%/g) || [];
    for (const match of percentMatches) {
      const number = match.replace(/\D/g, "");
      const isGrounded = brief.facts.some(fact => fact.includes(number));
      if (!isGrounded && number !== "100") {
        flaggedClaims.push({
          type: "unverified_stat",
          text: match,
          description: `The percentage statistic '${match}' does not appear in the grounding facts.`,
          severity: "medium"
        });
      }
    }

    const score = flaggedClaims.length > 0 ? Math.max(50, 100 - (flaggedClaims.length * 15)) : 100;
    const passed = score >= 85;

    return {
      passed,
      score,
      flaggedClaims,
      verdict: flaggedClaims.length > 0 
        ? "लेखमा केही अपुष्ट तथ्याङ्क वा विवरणहरू फेला परेकाले सम्पादन टोलीद्वारा समीक्षा आवश्यक छ।" 
        : "लेखमा कुनै उल्लेखनीय त्रुटि वा भ्रम (Hallucinations) फेला परेन। सुरक्षित।"
    };
  }
};
