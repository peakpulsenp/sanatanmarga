import { Type } from "@google/genai";
import { generateWithRotation } from "./rotatingAiService";
import { NewsroomBrief } from "./discoveryEngine";
import { extractJson } from "../utils/jsonUtils";

export interface HeadlinePackage {
  editorialHeadline: string; // The primary high-information broadsheet headline (Subject + Action + Consequence)
  seoHeadline: string;       // Keyword-rich, under 65 chars for Google Search
  socialHeadline: string;    // Engaging hook with curiosity/impact
  confidenceScore: number;   // 0-100 score of specificity
}

/**
 * Headline Intelligence Engine - Layer 2
 * Ensures headlines are specific, action-packed, informative, and free of generic filler.
 * Rejects "विषयमा बहस" or "समसामयिक छलफल" in favor of factual Subject + Action + Impact.
 */
export const HeadlineEngine = {
  // Generic phrases that MUST NOT pass as headlines
  VAGUE_PATTERNS: [
    /समसामयिक\s*राजनीतिक\s*विषय/i,
    /विषयमा\s*गहन\s*बहस/i,
    /विषयमा\s*समीक्षा/i,
    /छलफल\s*भएको\s*छ/i,
    /नीतिगत\s*प्राथमिकतामा\s*बहस/i,
    /क्षेत्रको\s*विकास/i,
    /समसामयिक\s*विषयमा\s*छलफल/i
  ],

  /**
   * Generates a 3-tier headline package from the concrete editorial brief.
   */
  async generateHeadline(brief: NewsroomBrief, category: string): Promise<HeadlinePackage> {
    const prompt = `You are the Senior Chief Copy Editor & Headline Master for Sanatan Marga Newsroom.
Your task is to write high-information, journalistic Nepali headlines based on the Editorial Brief below.

CRITICAL RULES FOR HEADLINES:
1. BAN VAGUE TOPIC DESCRIPTORS: Never write headlines like "संसदमा समसामयिक राजनीतिक बहस" or "आर्थिक विषयमा गहन समीक्षा".
2. SUBJECT + ACTION + IMPACT: The headline MUST state WHO did WHAT and WHAT HAPPENS AS A RESULT.
   - Example Bad: "संसदमा विधेयकमाथि छलफल"
   - Example Good: "संघीय निजामती सेवा विधेयक समितिबाट सर्वसम्मत पारित, कर्मचारीको उमेर हद ६० वर्ष हुने"
3. ACCURACY: Use real names, bill titles, or data points from the brief.

BRIEF:
Event: ${brief.eventTitle}
Entities: ${(brief.entities || []).join(", ")}
People: ${(brief.namedEntities?.people || []).join(", ")}
Bills/Policies: ${(brief.namedEntities?.billsOrPolicies || []).join(", ")}
Location: ${brief.locationDetails || brief.district}
Key Facts:
${(brief.facts || []).map((f, i) => `${i + 1}. ${f}`).join("\n")}

Generate a JSON object with:
- editorialHeadline: Clear, authoritative broadsheet headline (10-18 words, Nepali)
- seoHeadline: High-search factual headline with primary keyword under 65 chars (Nepali)
- socialHeadline: High-engagement headline/hook for Facebook/Twitter (Nepali)
- confidenceScore: Integer 80-100 indicating specificity`;

    try {
      const response = await generateWithRotation({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                editorialHeadline: { type: Type.STRING },
                seoHeadline: { type: Type.STRING },
                socialHeadline: { type: Type.STRING },
                confidenceScore: { type: Type.INTEGER }
              },
              required: ["editorialHeadline", "seoHeadline", "socialHeadline", "confidenceScore"]
            }
          }
        }
      });

      if (response && response.text) {
        const pkg = extractJson<HeadlinePackage>(response.text);
        if (pkg && pkg.editorialHeadline) {
          return this.sanitizeAndValidate(pkg, brief);
        }
      }
    } catch (e) {
      console.warn("[HeadlineEngine] Fallback headline generation due to API error:", e);
    }

    return this.generateRuleBasedHeadline(brief, category);
  },

  /**
   * Validates that the headline does not contain banned vague phrases.
   * If vague, enriches it with concrete entities and action.
   */
  sanitizeAndValidate(pkg: HeadlinePackage, brief: NewsroomBrief): HeadlinePackage {
    let headline = pkg.editorialHeadline;
    const isVague = this.VAGUE_PATTERNS.some(pattern => pattern.test(headline));

    if (isVague || headline.length < 15) {
      const primaryEntity = brief.namedEntities?.people?.[0] || brief.namedEntities?.billsOrPolicies?.[0] || brief.namedEntities?.organizations?.[0] || brief.entities?.[0] || "";
      const factSummary = brief.facts?.[0] || brief.eventTitle;
      
      if (factSummary && primaryEntity && !factSummary.includes("समसामयिक")) {
        headline = factSummary.length > 90 ? factSummary.substring(0, 90) : factSummary;
      } else {
        headline = brief.eventTitle || headline;
      }
    }

    return {
      editorialHeadline: headline,
      seoHeadline: pkg.seoHeadline || headline.substring(0, 65),
      socialHeadline: pkg.socialHeadline || headline,
      confidenceScore: isVague ? 80 : Math.max(88, pkg.confidenceScore || 90)
    };
  },

  /**
   * Rule-based fallback headline generation when AI is unavailable.
   */
  generateRuleBasedHeadline(brief: NewsroomBrief, category: string): HeadlinePackage {
    const primaryTitle = brief.eventTitle || (brief.facts?.[0] ? brief.facts[0].split(/[।.?!]/)[0] : `${category} सम्बन्धी राष्ट्रिय निर्णय`);
    
    return {
      editorialHeadline: primaryTitle,
      seoHeadline: primaryTitle.substring(0, 65),
      socialHeadline: `ताजा अपडेट: ${primaryTitle}`,
      confidenceScore: 85
    };
  }
};
