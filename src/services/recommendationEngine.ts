import { snapshotEngine } from "./snapshotEngine";

export interface RecommendationItem {
  id: string;
  title: string;
  type: "article" | "course" | "product" | "festival" | "institution";
  category: string;
  score: number;
  url: string;
  image?: string;
  reason: string;
}

export class RecommendationEngine {
  /**
   * Generates graph-aware personalized recommendations for a given topic or user profile
   */
  static async getRecommendationsForContext(contextKeywords: string[] = ["पशुपतिनाथ", "गीता"]): Promise<RecommendationItem[]> {
    try {
      const searchItems = await snapshotEngine.getSearchIndexSnapshot();
      const recommendations: RecommendationItem[] = [];

      (searchItems || []).forEach((item: any) => {
        let score = 0;
        let matchedKeyword = "";

        contextKeywords.forEach(kw => {
          const lowerKw = kw.toLowerCase();
          const text = [item.title, item.excerpt, item.content].join(" ").toLowerCase();
          if (text.includes(lowerKw)) {
            score += 25;
            matchedKeyword = kw;
          }
        });

        // Boost items based on freshness
        if (item.createdAt) {
          const daysOld = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          if (daysOld < 7) score += 15;
        }

        if (score > 0) {
          recommendations.push({
            id: item.id,
            title: item.title,
            type: "article",
            category: item.categoryId || "समाचार",
            score,
            url: item.url || `/article/${item.id}`,
            image: item.featuredImage,
            reason: `'${matchedKeyword}' ज्ञानकोष नोडसँग जोडिएको`
          });
        }
      });

      // Add related Academy Course
      recommendations.push({
        id: "gita-intro",
        title: "श्रीमद्भगवद्गीता परिचय र जीवन दर्शन",
        type: "course",
        category: "अकाडेमी",
        score: 90,
        url: "/academy/course/gita-intro",
        image: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=400&q=80",
        reason: "गीता ज्ञानकोष नोडसँग प्रत्यक्ष सम्बन्धित"
      });

      // Add related Store Product
      recommendations.push({
        id: "sp_gita",
        title: "सचित्र श्रीमद्भगवद्गीता (नेपाली अनुवाद)",
        type: "product",
        category: "सनातन बजार",
        score: 85,
        url: "/store",
        image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80",
        reason: "पाठकहरूको अत्यधिक रोजाइमा परेको ग्रन्थ"
      });

      return recommendations.sort((a, b) => b.score - a.score);
    } catch (e) {
      console.warn("Recommendation engine calculation error:", e);
      return [];
    }
  }
}
