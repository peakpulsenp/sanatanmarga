import { KnowledgeLinkRequest, KnowledgeLinkResponse, SgisKnowledgeLink } from "./types";
import { CANONICAL_ENTITIES } from "@/src/services/knowledgeOS";
import { auth } from "@/src/lib/firebase";

export class SgisKnowledgeLinker {
  /**
   * Auto-links manuscript text against Knowledge OS entities and historical graph
   */
  static async linkToKnowledgeGraph(req: KnowledgeLinkRequest): Promise<KnowledgeLinkResponse> {
    let idToken: string | undefined;
    try {
      if (auth.currentUser) {
        idToken = await auth.currentUser.getIdToken();
      }
    } catch (e) {
      console.warn("Could not get auth token for knowledge linking:", e);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (idToken) {
      headers["Authorization"] = `Bearer ${idToken}`;
    }

    const baseUrl = typeof window !== "undefined" ? "" : (process.env.API_BASE_URL || "http://localhost:3000");

    try {
      const response = await fetch(`${baseUrl}/api/sgis/knowledge/link`, {
        method: "POST",
        headers,
        body: JSON.stringify(req)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `SGIS Knowledge Link Error (${response.status})`);
      }

      return await response.json();
    } catch (err: any) {
      console.warn("[SGIS KnowledgeLinker] Backend linking failed, evaluating against local Knowledge OS graph:", err);
      return this.localGraphLinking(req.text, req.title);
    }
  }

  /**
   * Local Knowledge OS matching algorithm
   */
  static localGraphLinking(text: string, title?: string): KnowledgeLinkResponse {
    const combinedContent = `${title || ""} ${text || ""}`.toLowerCase();
    const matchedEntities: SgisKnowledgeLink[] = [];
    const suggestedCategories = new Set<string>();

    CANONICAL_ENTITIES.forEach(entity => {
      const nameNp = entity.canonicalNameNp.toLowerCase();
      const nameEn = entity.canonicalNameEn.toLowerCase();
      const sanskrit = (entity.sanskritName || "").toLowerCase();
      const aliases = (entity.aliases || []).map(a => a.toLowerCase());

      let isMatch = false;
      let relevanceReason = "";

      if (combinedContent.includes(nameNp)) {
        isMatch = true;
        relevanceReason = `पाण्डुलिपिमा '${entity.canonicalNameNp}' प्रत्यक्ष उल्लेख गरिएको छ।`;
      } else if (sanskrit && combinedContent.includes(sanskrit)) {
        isMatch = true;
        relevanceReason = `संस्कृत नाम '${entity.sanskritName}' सँग मिल्यो।`;
      } else if (aliases.some(alias => combinedContent.includes(alias))) {
        isMatch = true;
        relevanceReason = `समानार्थी वा उपनाम सँग मिल्यो।`;
      }

      if (isMatch) {
        matchedEntities.push({
          entityId: entity.id,
          canonicalName: entity.canonicalNameNp,
          entityType: entity.type,
          relevanceReason,
          confidence: 0.95,
          linkedAt: new Date().toISOString()
        });

        if (entity.type === "place") suggestedCategories.add("तीर्थ एवं भूगोल");
        if (entity.type === "tradition") suggestedCategories.add("परम्परा एवं दर्शन");
        if (entity.type === "person" || entity.type === "scholar") suggestedCategories.add("ऋषि एवं विद्वान्");
      }
    });

    // Default fallback matches if specific keywords appear
    if (matchedEntities.length === 0) {
      if (combinedContent.includes("शान्ति") || combinedContent.includes("उपनिषद्")) {
        matchedEntities.push({
          entityId: "tradition:vedanta",
          canonicalName: "वेदान्त दर्शन",
          entityType: "tradition",
          relevanceReason: "वैदिक शान्तिमन्त्र र उपनिषद् सन्दर्भ",
          confidence: 0.9,
          linkedAt: new Date().toISOString()
        });
      }
      if (combinedContent.includes("गीता") || combinedContent.includes("कर्म")) {
        matchedEntities.push({
          entityId: "scholar:vedavyasa",
          canonicalName: "महर्षि वेदव्यास",
          entityType: "scholar",
          relevanceReason: "श्रीमद्भगवद्गीता र महाभारत प्रणेता",
          confidence: 0.92,
          linkedAt: new Date().toISOString()
        });
      }
    }

    const timelineEraLinks = [
      { eraName: "वैदिक काल", century: "प्राचीन काल", significance: "मूल मन्त्र तथा उपनिषद् रचना काल" },
      { eraName: "लिच्छवि काल", century: "वि.सं. ५औँ-८औँ शताब्दी", significance: "नेपालमा ताडपत्र पाण्डुलिपि लिपिबद्ध युग" }
    ];

    return {
      success: true,
      matchedEntities,
      suggestedCategories: Array.from(suggestedCategories),
      timelineEraLinks
    };
  }
}
