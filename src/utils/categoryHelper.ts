import { BACKUP_CATEGORIES } from "@/src/constants/backupData";
import { CANONICAL_CATEGORIES, normalizeArticleCategory } from "@/src/constants/categories";

export function getCategoryDisplayName(categoryIdOrSlug?: string, lang: 'ne' | 'en' = 'ne'): string {
  if (!categoryIdOrSlug) return lang === 'en' ? "News" : "समाचार";
  
  const rawStr = String(categoryIdOrSlug).trim();
  const clean = rawStr.toLowerCase();
  
  // Try normalizeArticleCategory first
  const normalized = normalizeArticleCategory(clean);
  const canonicalFound = CANONICAL_CATEGORIES.find(
    c => c.slug === normalized.categorySlug || c.id === normalized.categoryId
  );
  if (canonicalFound) {
    return lang === 'en' ? canonicalFound.nameEnglish : canonicalFound.nameNepali;
  }

  // Check backup categories
  const found = BACKUP_CATEGORIES.find(c => 
    c.id.toLowerCase() === clean || 
    c.slug.toLowerCase() === clean ||
    c.nameNepali.toLowerCase() === clean ||
    c.nameEnglish.toLowerCase() === clean
  );

  if (found) {
    return lang === 'en' ? found.nameEnglish : found.nameNepali;
  }

  // Check localStorage dynamic categories if in browser
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("sg_dynamic_categories");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const dynFound = parsed.find((c: any) => 
            String(c.id).toLowerCase() === clean || 
            String(c.slug).toLowerCase() === clean ||
            String(c.nameNepali || "").toLowerCase() === clean
          );
          if (dynFound) {
            return lang === 'en' ? (dynFound.nameEnglish || dynFound.slug) : (dynFound.nameNepali || dynFound.name || dynFound.slug);
          }
        }
      }
    } catch (e) {}
  }

  // Fallback mappings for common slug/ID anomalies or raw Firestore IDs
  if (clean === "vhmsdnuvbop1my2wb5pd" || clean.includes("vhms")) {
    return lang === 'en' ? "Politics" : "राजनीति";
  }

  if (clean.length > 15 || clean === "general" || clean === "news" || clean === "samachar") {
    return lang === 'en' ? "General News" : "मुख्य समाचार";
  }

  // If it's a known slug
  const slugMap: Record<string, { ne: string; en: string }> = {
    politics: { ne: "राजनीति", en: "Politics" },
    rajniti: { ne: "राजनीति", en: "Politics" },
    desh: { ne: "देश", en: "National" },
    national: { ne: "देश", en: "National" },
    pradesh: { ne: "प्रदेश", en: "Province" },
    bishwo: { ne: "विश्व", en: "International" },
    world: { ne: "विश्व", en: "International" },
    sports: { ne: "खेलकुद", en: "Sports" },
    khelkud: { ne: "खेलकुद", en: "Sports" },
    tech: { ne: "प्रविधि", en: "Tech" },
    technology: { ne: "प्रविधि", en: "Tech" },
    economy: { ne: "अर्थ", en: "Economy" },
    artha: { ne: "अर्थ", en: "Economy" },
    entertainment: { ne: "मनोरञ्जन", en: "Entertainment" },
    vichar: { ne: "विचार", en: "Opinion" },
    opinion: { ne: "विचार", en: "Opinion" },
    culture: { ne: "संस्कृति", en: "Culture" },
    samaj: { ne: "समाज", en: "Society" }
  };

  if (slugMap[clean]) {
    return lang === 'en' ? slugMap[clean].en : slugMap[clean].ne;
  }

  // If it looks like an ID (alphanumeric 20+ chars) and didn't match, return a clean Nepali default
  if (/^[a-zA-Z0-9]{15,}$/.test(clean)) {
    return lang === 'en' ? "News" : "समाचार";
  }

  return categoryIdOrSlug;
}
