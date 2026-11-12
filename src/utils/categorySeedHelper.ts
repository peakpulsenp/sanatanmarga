import { doc } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { Category } from "@/src/types";
import { CANONICAL_CATEGORIES, CanonicalCategory } from "@/src/constants/categories";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { setDocWithQueue } from "@/src/lib/offlineQueue";

export const STANDARD_CATEGORY_NAMES: Record<string, { ne: string; en: string }> = {
  politics: { ne: "राजनीति", en: "Politics" },
  desh: { ne: "देश", en: "National" },
  pradesh: { ne: "प्रदेश", en: "Province" },
  bishwo: { ne: "विश्व", en: "International" },
  sports: { ne: "खेलकुद", en: "Sports" },
  entertainment: { ne: "मनोरञ्जन", en: "Entertainment" },
  economy: { ne: "अर्थ", en: "Economy" },
  tech: { ne: "प्रविधि", en: "Tech" },
  sanskar: { ne: "धर्म/संस्कृति", en: "Religion & Culture" },
  tourism: { ne: "पर्यटन", en: "Tourism" },
  bichar: { ne: "विचार", en: "Opinion" },
  development: { ne: "विकास", en: "Development" },
  marga: { ne: "मार्ग", en: "Marga" },
  sanatan: { ne: "सनातन", en: "Sanatan" }
};

export function cleanCategoryItem(c: any): Category {
  const slug = String(c.slug || c.id || "").toLowerCase().trim();
  const std = STANDARD_CATEGORY_NAMES[slug];

  let nameNepali = String(c.nameNepali || c.name || c.title || "").trim();
  if (!nameNepali || /^[a-zA-Z0-9]{15,}$/.test(nameNepali) || nameNepali === c.id) {
    nameNepali = std?.ne || c.nameEnglish || slug;
  }

  let nameEnglish = String(c.nameEnglish || c.name || "").trim();
  if (!nameEnglish || /^[a-zA-Z0-9]{15,}$/.test(nameEnglish) || nameEnglish === c.id) {
    nameEnglish = std?.en || slug;
  }

  return {
    id: c.id || slug,
    slug: c.slug || slug || c.id,
    nameNepali: nameNepali || "विधा",
    nameEnglish: nameEnglish || "Category",
    order: Number(c.order ?? 99),
    homepageStyle: c.homepageStyle || "grid",
    postCount: Number(c.postCount || 0),
    isHidden: Boolean(c.isHidden)
  };
}

export function mergeWithCanonicalCategories(fetched: Category[], dynamic: Category[]): Category[] {
  const map = new Map<string, Category>();

  // 1. Seed with canonical categories as foundation
  CANONICAL_CATEGORIES.forEach((cat: CanonicalCategory) => {
    const cleaned = cleanCategoryItem(cat);
    map.set(cleaned.slug.toLowerCase(), cleaned);
    map.set(cleaned.id, cleaned);
  });

  // 2. Overlay fetched Firestore categories and dynamic categories
  [...fetched, ...dynamic].forEach(item => {
    if (!item) return;
    const cleaned = cleanCategoryItem(item);
    const key = (cleaned.slug || cleaned.id).toLowerCase();
    if (key && key !== "undefined" && key !== "null") {
      map.set(key, cleaned);
    }
  });

  // 3. Deduplicate by slug
  const uniqueBySlug = new Map<string, Category>();
  Array.from(map.values()).forEach(cat => {
    const slug = (cat.slug || cat.id).toLowerCase();
    if (!uniqueBySlug.has(slug)) {
      uniqueBySlug.set(slug, cat);
    }
  });

  const result = Array.from(uniqueBySlug.values());
  result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return result;
}

export async function seedDefaultCategoriesToFirestore(): Promise<{ count: number; success: boolean }> {
  try {
    for (const cat of CANONICAL_CATEGORIES) {
      const catData = {
        nameNepali: cat.nameNepali,
        nameEnglish: cat.nameEnglish,
        slug: cat.slug,
        order: cat.order,
        homepageStyle: "grid",
        postCount: 0,
        isHidden: false
      };
      
      await setDocWithQueue(doc(db, "categories", cat.id), catData, { merge: true });
    }

    snapshotEngine.injectCategories(CANONICAL_CATEGORIES as Category[]);
    snapshotEngine.triggerPublishRebuild("seed_default_categories");
    return { count: CANONICAL_CATEGORIES.length, success: true };
  } catch (error) {
    console.error("Error seeding default categories:", error);
    return { count: 0, success: false };
  }
}
