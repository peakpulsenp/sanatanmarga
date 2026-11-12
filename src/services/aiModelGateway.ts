/**
 * Central AI Model Gateway for SanatanMarga Media OS
 * 
 * All Gemini invocations across the system MUST pass through AIModelGateway.
 * Features:
 * 1. Global model quota tracking & circuit breaker cooldowns.
 * 2. Automatic injection of Level-1 Temporal Knowledge OS Facts into AI prompt context.
 * 3. Fallback rotation across Gemini model chains.
 * 4. Structured logging and telemetry.
 */

import { generateWithRotation } from "./rotatingAiService";
import { TemporalKnowledgeOS } from "./temporalKnowledgeOS";
import { KnowledgeContextCacheOS } from "./knowledgeContextCacheOS";

export interface AIModelGatewayRequest {
  model?: string;
  contents: any;
  config?: any;
  category?: string;
  district?: string;
  topic?: string;
  sgisQuery?: string;
  moduleName?: string;
  requestId?: string;
  referenceDate?: string | Date;
  skipTemporalInjection?: boolean;
  skipContextCache?: boolean;
}

export interface AIModelGatewayResponse {
  text: string;
  modelUsed?: string;
  candidates?: any[];
  usageMetadata?: any;
  rawResponse?: any;
}

export class AIModelGateway {
  /**
   * Central entry point for all Gemini calls across SanatanMarga.
   * Leverages KnowledgeContextCacheOS for prefix caching and context routing.
   */
  public static async generate(request: AIModelGatewayRequest): Promise<AIModelGatewayResponse> {
    const targetModel = request.model || "gemini-3.7-flash";
    const refDate = request.referenceDate || new Date("2026-08-26T00:00:00+05:45");
    
    let processedContents = request.contents;

    // Use KnowledgeContextCacheOS to structure prompt with Prefix Caching (Tier 1 -> Tier 2 -> Tier 3 -> Tier 4)
    if (!request.skipContextCache && typeof processedContents === "string") {
      const temporalFactContext = TemporalKnowledgeOS.generatePromptFactContext(refDate);
      processedContents = KnowledgeContextCacheOS.buildStructuredCachePrompt({
        category: request.category,
        district: request.district,
        topic: request.topic,
        sgisQuery: request.sgisQuery,
        rawUserPrompt: processedContents,
        temporalFactContext: request.skipTemporalInjection ? undefined : temporalFactContext
      });
    } else if (!request.skipTemporalInjection) {
      // Inject Level 1 Authoritative Temporal Knowledge OS Context unless explicitly skipped
      const temporalFactContext = TemporalKnowledgeOS.generatePromptFactContext(refDate);
      if (typeof processedContents === "string") {
        if (!processedContents.includes("LEVEL 1 AUTHORITATIVE CURRENT FACTS")) {
          processedContents = `${temporalFactContext}\n\n${processedContents}`;
        }
      } else if (Array.isArray(processedContents)) {
        const textParts = processedContents.map(part => typeof part === "string" ? part : part?.text || "").join("\n");
        if (!textParts.includes("LEVEL 1 AUTHORITATIVE CURRENT FACTS")) {
          processedContents = [temporalFactContext, ...processedContents];
        }
      }
    }

    console.log(`[AIModelGateway] Dispatching request (module=${request.moduleName || 'GENERAL'}, model=${targetModel}, category=${request.category || 'all'})`);

    const rawResult = await generateWithRotation({
      model: targetModel,
      contents: processedContents,
      config: request.config,
      category: request.category,
      moduleName: request.moduleName,
      requestId: request.requestId
    });

    if (rawResult?.usageMetadata) {
      KnowledgeContextCacheOS.recordProviderUsage(rawResult.usageMetadata);
    }

    return {
      text: typeof rawResult === "string" ? rawResult : rawResult?.text || JSON.stringify(rawResult),
      modelUsed: rawResult?.model || targetModel,
      candidates: rawResult?.candidates || [],
      usageMetadata: rawResult?.usageMetadata,
      rawResponse: rawResult
    };
  }
}

