import { Type } from "@google/genai";
import { generateWithRotation } from "./rotatingAiService";
import { extractJson } from "../utils/jsonUtils";

export interface ArticleTranslationInput {
  title: string;
  excerpt?: string;
  content?: string;
  seoHeadline?: string;
  seoDescription?: string;
  socialHook?: string;
}

export interface ArticleTranslationResult {
  title_en: string;
  excerpt_en: string;
  content_en: string;
  seoHeadline_en: string;
  seoDescription_en: string;
  socialHook_en: string;
}

export interface KnowledgeTranslationInput {
  title: string;
  sanskritText?: string;
  romanText?: string;
  nepaliMeaning?: string;
  commentary?: string;
}

export interface KnowledgeTranslationResult {
  title_en: string;
  englishMeaning: string;
  englishCommentary: string;
  romanText: string;
}

/**
 * Translates a complete article from Nepali to English while maintaining 
 * journalistic style, proper HTML tag structure (<p>, <h2>, <blockquote>), and technical context.
 */
export async function translateArticleToEnglish(input: ArticleTranslationInput): Promise<ArticleTranslationResult> {
  const prompt = `You are a professional bi-lingual senior newsroom translator and editor for Sanatan Marga.

Translate the following news story from Nepali to English.

NEPALI SOURCE:
Title: ${input.title}
SEO Headline: ${input.seoHeadline || input.title}
SEO Description: ${input.seoDescription || input.excerpt || ""}
Excerpt/Summary: ${input.excerpt || ""}
Social Hook: ${input.socialHook || ""}
Article Body (HTML formatted):
${input.content || ""}

TRANSLATION RULES:
1. Maintain high journalistic quality in English suitable for international readers and Reuters/BBC publication standards.
2. Preserve ALL HTML formatting tags (<p>, <h2>, <blockquote>, <strong>, <em>, <ul/li>) exactly as in the original body.
3. Translate names of Nepali locations, districts, and government institutions accurately with standardized English spellings (e.g. Kathmandu, Pashupatinath, Ministry of Home Affairs).
4. Do NOT omit any paragraph or detail.

Return strictly a JSON object with the requested fields.`;

  const modelsToTry = [
    "gemini-3.7-flash",
    "gemini-3.1-flash-lite"
  ];

  let response: any = null;
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      response = await generateWithRotation({
        model,
        contents: prompt,
        config: {
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 8192,
            temperature: 0.3, // Lower temperature for faithful translation
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title_en: { type: Type.STRING, description: "Professional English title" },
                excerpt_en: { type: Type.STRING, description: "English summary excerpt" },
                content_en: { type: Type.STRING, description: "Full HTML body in English preserving HTML tags" },
                seoHeadline_en: { type: Type.STRING, description: "SEO title in English" },
                seoDescription_en: { type: Type.STRING, description: "SEO description in English" },
                socialHook_en: { type: Type.STRING, description: "Social media post in English with emojis" }
              },
              required: ["title_en", "excerpt_en", "content_en", "seoHeadline_en", "seoDescription_en"]
            }
          }
        }
      });
      if (response && response.text) break;
    } catch (err) {
      console.warn(`Translation Error with model ${model}:`, err);
      lastError = err;
    }
  }

  if (!response || !response.text) {
    throw new Error(lastError?.message || "अंग्रेजी अनुवाद गर्न सकिएन। कृपया पुनः प्रयास गर्नुहोस्।");
  }

  const parsed = extractJson(response.text);
  return {
    title_en: parsed.title_en || input.title,
    excerpt_en: parsed.excerpt_en || input.excerpt || "",
    content_en: parsed.content_en || input.content || "",
    seoHeadline_en: parsed.seoHeadline_en || input.seoHeadline || input.title,
    seoDescription_en: parsed.seoDescription_en || input.seoDescription || input.excerpt || "",
    socialHook_en: parsed.socialHook_en || input.socialHook || ""
  };
}

/**
 * Translates Saraswati Knowledge Hub scripture entry (Sanskrit -> Roman + Nepali + English)
 */
export async function translateKnowledgeEntry(input: KnowledgeTranslationInput): Promise<KnowledgeTranslationResult> {
  const prompt = `You are a Vedic scholar and translator for Sanatan Marga Saraswati Knowledge Hub.

Analyze and translate this spiritual / philosophical text:
Title: ${input.title}
Sanskrit Shloka: ${input.sanskritText || ""}
Nepali Translation: ${input.nepaliMeaning || ""}
Commentary: ${input.commentary || ""}

Provide:
1. Exact Roman IAST / simplified Roman transliteration for the Sanskrit text.
2. Fluent, scholarly English translation of the shloka / meaning.
3. Detailed English commentary explaining the spiritual, philosophical, and historical context.
4. Professional English title.

Return strictly as JSON matching the schema.`;

  const response = await generateWithRotation({
    model: "gemini-3.7-flash",
    contents: prompt,
    config: {
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 4096,
        temperature: 0.2,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title_en: { type: Type.STRING, description: "English title" },
            romanText: { type: Type.STRING, description: "Romanized Sanskrit transliteration" },
            englishMeaning: { type: Type.STRING, description: "Clear English translation of scripture" },
            englishCommentary: { type: Type.STRING, description: "Scholarly English commentary" }
          },
          required: ["title_en", "romanText", "englishMeaning", "englishCommentary"]
        }
      }
    }
  });

  if (!response || !response.text) {
    throw new Error("ज्ञान केन्द्र अनुवाद असफल भयो।");
  }

  return extractJson(response.text);
}
