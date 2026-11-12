import { Category } from "@/src/types";

export interface CanonicalCategory extends Category {
  id: string;
  slug: string;
  nameNepali: string;
  nameEnglish: string;
  order: number;
}

export const CANONICAL_CATEGORIES: CanonicalCategory[] = [
  { id: "YWYrCNPNF9ierlfLxXpR", slug: "politics", nameNepali: "राजनीति", nameEnglish: "Politics", order: 1 },
  { id: "vVvn67qTr0jQvJR4WM78", slug: "desh", nameNepali: "देश", nameEnglish: "National", order: 2 },
  { id: "CpotwflM4YMcLyEfV9QV", slug: "pradesh", nameNepali: "प्रदेश", nameEnglish: "Province", order: 3 },
  { id: "DS3JxNVQF1Jm7H4jftDy", slug: "bishwo", nameNepali: "विश्व", nameEnglish: "International", order: 4 },
  { id: "mClg5XDARqxBDg2SrgyW", slug: "economy", nameNepali: "अर्थ", nameEnglish: "Economy", order: 5 },
  { id: "GQZmaKQVfycCzQmdi3k2", slug: "sports", nameNepali: "खेलकुद", nameEnglish: "Sports", order: 6 },
  { id: "nh5OFtwevNxMVDwOIqgQ", slug: "entertainment", nameNepali: "मनोरञ्जन", nameEnglish: "Entertainment", order: 7 },
  { id: "WoemLYZsw4fqxP7UzqNW", slug: "tech", nameNepali: "प्रविधि", nameEnglish: "Tech", order: 8 },
  { id: "sanskar_cat_id", slug: "sanskar", nameNepali: "धर्म/संस्कृति", nameEnglish: "Religion & Culture", order: 9 },
  { id: "tourism_cat_id", slug: "tourism", nameNepali: "पर्यटन", nameEnglish: "Tourism", order: 10 },
  { id: "bichar_cat_id", slug: "bichar", nameNepali: "विचार", nameEnglish: "Opinion", order: 11 },
  { id: "development_cat_id", slug: "development", nameNepali: "विकास", nameEnglish: "Development", order: 12 }
];

export interface NormalizedCategoryResult {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  category: string;
}

/**
 * Maps raw, AI-generated, or legacy category inputs (English/Nepali/slang)
 * to one of the canonical App Categories.
 * Includes intelligent text keyword fallbacks for generic terms like "Breaking" or "samachar".
 */
export function normalizeArticleCategory(
  rawInput?: string,
  titleText?: string,
  contentText?: string
): NormalizedCategoryResult {
  const cleanInput = (rawInput || "").toString().trim().toLowerCase();
  const strippedInput = cleanInput.replace(/_cat_id|_cat|cat_|_id/g, "").trim();
  const fullText = ((titleText || "") + " " + (contentText || "")).toLowerCase();

  // Helper to construct normalized return object
  const makeResult = (cat: CanonicalCategory): NormalizedCategoryResult => ({
    categoryId: cat.id,
    categorySlug: cat.slug,
    categoryName: cat.nameNepali,
    category: cat.slug
  });

  // 1. Direct match by ID, Slug, or Stripped input
  const matchBySlugOrId = CANONICAL_CATEGORIES.find(
    c => c.id.toLowerCase() === cleanInput || 
         c.slug.toLowerCase() === cleanInput ||
         c.slug.toLowerCase() === strippedInput ||
         c.id.toLowerCase() === strippedInput
  );
  if (matchBySlugOrId) return makeResult(matchBySlugOrId);

  // 2. Direct match by Nepali or English name
  const matchByName = CANONICAL_CATEGORIES.find(
    c => c.nameNepali.toLowerCase() === cleanInput || c.nameEnglish.toLowerCase() === cleanInput
  );
  if (matchByName) return makeResult(matchByName);

  // 3. Category Synonym Dictionary
  if (cleanInput.includes("politic") || cleanInput.includes("राजनीति") || cleanInput.includes("संसद") || cleanInput.includes("चुनाव")) {
    return makeResult(CANONICAL_CATEGORIES[0]); // politics
  }
  if (
    cleanInput.includes("econ") ||
    cleanInput.includes("finance") ||
    cleanInput.includes("arth") ||
    cleanInput.includes("market") ||
    cleanInput.includes("nepse") ||
    cleanInput.includes("gold") ||
    cleanInput.includes("silver") ||
    cleanInput.includes("bullion") ||
    cleanInput.includes("stock") ||
    cleanInput.includes("अर्थ") ||
    cleanInput.includes("बजेट") ||
    cleanInput.includes("बैंक") ||
    cleanInput.includes("नेप्से") ||
    cleanInput.includes("सुन") ||
    cleanInput.includes("चाँदी") ||
    cleanInput.includes("सेयर")
  ) {
    return makeResult(CANONICAL_CATEGORIES[4]); // economy
  }
  if (cleanInput.includes("relig") || cleanInput.includes("cultur") || cleanInput.includes("sanskar") || cleanInput.includes("धर्म") || cleanInput.includes("संस्कृति") || cleanInput.includes("पशुपति") || cleanInput.includes("मन्दिर") || cleanInput.includes("पञ्चाङ्ग")) {
    return makeResult(CANONICAL_CATEGORIES[8]); // sanskar
  }
  if (cleanInput.includes("touris") || cleanInput.includes("पर्यटन") || cleanInput.includes("पदयात्रा") || cleanInput.includes("होटल")) {
    return makeResult(CANONICAL_CATEGORIES[9]); // tourism
  }
  if (cleanInput.includes("internat") || cleanInput.includes("bishwo") || cleanInput.includes("world") || cleanInput.includes("विश्व") || cleanInput.includes("विदेश")) {
    return makeResult(CANONICAL_CATEGORIES[3]); // bishwo
  }
  if (cleanInput.includes("sport") || cleanInput.includes("खेलकुद") || cleanInput.includes("खेल") || cleanInput.includes("क्रिकेट") || cleanInput.includes("फुटबल")) {
    return makeResult(CANONICAL_CATEGORIES[5]); // sports
  }
  if (cleanInput.includes("entertain") || cleanInput.includes("मनोरञ्जन") || cleanInput.includes("सिनेमा") || cleanInput.includes("कला")) {
    return makeResult(CANONICAL_CATEGORIES[6]); // entertainment
  }
  if (cleanInput.includes("tech") || cleanInput.includes("प्रविधि") || cleanInput.includes("इन्टरनेट") || cleanInput.includes("मोबाइल") || cleanInput.includes("डिजिटल")) {
    return makeResult(CANONICAL_CATEGORIES[7]); // tech
  }
  if (cleanInput.includes("pradesh") || cleanInput.includes("province") || cleanInput.includes("प्रदेश") || cleanInput.includes("बागमती") || cleanInput.includes("गण्डकी") || cleanInput.includes("कोशी") || cleanInput.includes("लुम्बिनी") || cleanInput.includes("मधेस") || cleanInput.includes("कर्णाली") || cleanInput.includes("सुदूरपश्चिम")) {
    return makeResult(CANONICAL_CATEGORIES[2]); // pradesh
  }
  if (cleanInput.includes("bichar") || cleanInput.includes("opinion") || cleanInput.includes("विचार") || cleanInput.includes("सम्पादकीय") || cleanInput.includes("स्तम्भ")) {
    return makeResult(CANONICAL_CATEGORIES[10]); // bichar
  }
  if (cleanInput.includes("development") || cleanInput.includes("विकास") || cleanInput.includes("पूर्वाधार") || cleanInput.includes("हाइवे") || cleanInput.includes("सडक")) {
    return makeResult(CANONICAL_CATEGORIES[11]); // development
  }

  // 4. Keyword text inspection for generic inputs ("Breaking", "Government Notices", "Disaster Alerts", "samachar", "general", etc.)
  if (fullText.length > 0) {
    if (fullText.includes("संसद्") || fullText.includes("मन्त्री") || fullText.includes("राजनीति") || fullText.includes("निर्वाचन") || fullText.includes("राष्ट्रपति") || fullText.includes("प्रधानमन्त्री")) {
      return makeResult(CANONICAL_CATEGORIES[0]); // politics
    }
    if (fullText.includes("अर्थ") || fullText.includes("बजेट") || fullText.includes("राष्ट्र बैंक") || fullText.includes("व्यापार") || fullText.includes("मुद्रा") || fullText.includes("कर") || fullText.includes("सेयर")) {
      return makeResult(CANONICAL_CATEGORIES[4]); // economy
    }
    if (fullText.includes("पशुपति") || fullText.includes("मन्दिर") || fullText.includes("धर्म") || fullText.includes("संस्कृति") || fullText.includes("गुठी") || fullText.includes("पूजा") || fullText.includes("जात्रा")) {
      return makeResult(CANONICAL_CATEGORIES[8]); // sanskar
    }
    if (fullText.includes("पर्यटन") || fullText.includes("पर्वतारोहण") || fullText.includes("पोखरा") || fullText.includes("लुम्बिनी") || fullText.includes("मुस्ताङ")) {
      return makeResult(CANONICAL_CATEGORIES[9]); // tourism
    }
    if (fullText.includes("प्रविधि") || fullText.includes("इन्टरनेट") || fullText.includes("टेलिकम") || fullText.includes("एआई") || fullText.includes("साइबर")) {
      return makeResult(CANONICAL_CATEGORIES[7]); // tech
    }
    if (fullText.includes("विश्व") || fullText.includes("अमेरिका") || fullText.includes("चीन") || fullText.includes("भारत") || fullText.includes("संयुक्त राष्ट्रसंघ")) {
      return makeResult(CANONICAL_CATEGORIES[3]); // bishwo
    }
  }

  // 5. Default fallback: National ("देश")
  return makeResult(CANONICAL_CATEGORIES[1]); // desh
}

/**
 * Authoritative verification function to determine if an article belongs to a target category.
 * Matches against canonical category ID, slug, Nepali name, English name, and article category variants.
 */
export function isArticleInCategory(
  article: any,
  targetCategory: { id?: string; slug?: string; nameNepali?: string; nameEnglish?: string } | string
): boolean {
  if (!article) return false;

  const targetRaw = typeof targetCategory === "string" 
    ? targetCategory 
    : (targetCategory.slug || targetCategory.id || targetCategory.nameNepali || targetCategory.nameEnglish || "");
  
  if (!targetRaw) return false;

  const targetClean = targetRaw.trim().toLowerCase();
  const targetNorm = normalizeArticleCategory(targetClean);
  const targetSlug = (targetNorm.categorySlug || "").toLowerCase();
  const targetId = (targetNorm.categoryId || "").toLowerCase();
  const targetName = (targetNorm.categoryName || "").toLowerCase();

  // All candidate strings present on the article
  const candidateStrings: string[] = [
    article.categoryId,
    article.categorySlug,
    article.category,
    article.categoryName,
    article.catId,
    article.catSlug,
  ].filter(Boolean).map((s: any) => String(s).trim().toLowerCase());

  // 1. Direct match on any candidate string against target identifiers
  for (const s of candidateStrings) {
    if (
      s === targetSlug || 
      s === targetId || 
      s === targetName || 
      s === targetClean ||
      (targetSlug && s.includes(targetSlug))
    ) {
      return true;
    }
  }

  // 2. Normalized category match on candidate strings
  for (const s of candidateStrings) {
    const aNorm = normalizeArticleCategory(s);
    if (
      aNorm.categorySlug.toLowerCase() === targetSlug ||
      aNorm.categoryId.toLowerCase() === targetId ||
      aNorm.categoryName.toLowerCase() === targetName
    ) {
      return true;
    }
  }

  // 3. Fallback: Content keyword match for generic category markers ("news", "samachar", "latest")
  const isGeneric = candidateStrings.length === 0 || candidateStrings.every(s => 
    s === "news" || s === "samachar" || s === "latest" || s === "article" || s === "general"
  );
  if (isGeneric && (article.title || article.content || article.excerpt)) {
    const contentNorm = normalizeArticleCategory(undefined, article.title, article.content || article.excerpt);
    if (
      contentNorm.categorySlug.toLowerCase() === targetSlug ||
      contentNorm.categoryId.toLowerCase() === targetId
    ) {
      return true;
    }
  }

  return false;
}
