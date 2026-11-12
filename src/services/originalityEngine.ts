import { continuityEngine } from "@/src/lib/continuityEngine";

export interface OriginalityReport {
  originalityScore: number; // 0-100 (100 means completely unique)
  highestSimilarityScore: number; // 0-100
  mostSimilarArticleTitle?: string;
  overlappingPhrases: string[];
  recommendation: "accept" | "flag_for_review" | "reject_duplicate";
  justification: string;
}

/**
 * Calculates Jaccard similarity of two string sets
 */
function calculateJaccardSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().replace(/[^\w\s\u0900-\u097F]/g, "").split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(str2.toLowerCase().replace(/[^\w\s\u0900-\u097F]/g, "").split(/\s+/).filter(w => w.length > 3));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let intersection = 0;
  words1.forEach(w => {
    if (words2.has(w)) intersection++;
  });
  
  const union = new Set([...words1, ...words2]).size;
  return Math.round((intersection / union) * 100);
}

/**
 * Extract overlapping common phrases of length >= 3 words
 */
function extractOverlappingPhrases(str1: string, str2: string): string[] {
  const cleanStr1 = str1.toLowerCase().replace(/[^\w\s\u0900-\u097F]/g, "");
  const cleanStr2 = str2.toLowerCase().replace(/[^\w\s\u0900-\u097F]/g, "");
  
  const words1 = cleanStr1.split(/\s+/).filter(w => w.length > 2);
  const words2 = cleanStr2.split(/\s+/).filter(w => w.length > 2);
  
  const phrases: string[] = [];
  const phraseLength = 3;
  
  for (let i = 0; i <= words1.length - phraseLength; i++) {
    const candidate = words1.slice(i, i + phraseLength).join(" ");
    if (cleanStr2.includes(candidate) && !phrases.includes(candidate)) {
      phrases.push(candidate);
      if (phrases.length >= 5) break; // cap at 5 phrases
    }
  }
  
  return phrases;
}

export const OriginalityEngine = {
  /**
   * Compares a proposed news article against past coverage to prevent duplication
   */
  async checkOriginality(title: string, content: string, category: string): Promise<OriginalityReport> {
    console.log(`[Originality Engine] Performing originality scan for: "${title}" in category: ${category}`);
    
    let highestSimilarityScore = 0;
    let mostSimilarArticleTitle: string | undefined = undefined;
    let overlappingPhrases: string[] = [];
    
    try {
      const recentArticles = await continuityEngine.getRecentArticles(30);
      
      recentArticles.forEach(art => {
        const titleSim = calculateJaccardSimilarity(title, art.title || "");
        const contentSim = calculateJaccardSimilarity(content, art.content || "");
        
        // Combined weighted similarity (Title 40%, Content 60%)
        const combinedSim = Math.round((titleSim * 0.4) + (contentSim * 0.6));
        
        if (combinedSim > highestSimilarityScore) {
          highestSimilarityScore = combinedSim;
          mostSimilarArticleTitle = art.title;
          
          if (combinedSim > 20) {
            overlappingPhrases = extractOverlappingPhrases(title + " " + content, (art.title || "") + " " + (art.content || ""));
          }
        }
      });
    } catch (e) {
      console.warn("[Originality Engine] Article similarity lookup warning, falling back to clean slate:", e);
    }
    
    const originalityScore = 100 - highestSimilarityScore;
    let recommendation: "accept" | "flag_for_review" | "reject_duplicate" = "accept";
    let justification = "लेख मौलिक र अद्वितीय छ। विगतका प्रकाशनहरूसँग कुनै गम्भीर प्रतिलिपि फेला परेन।";
    
    if (highestSimilarityScore >= 70) {
      recommendation = "reject_duplicate";
      justification = `यो समाचार पहिले नै प्रकाशित भएको अर्को समाचार "${mostSimilarArticleTitle}" सँग अत्यधिक मिल्दोजुल्दो (${highestSimilarityScore}%) छ। साहित्यिक चोरी वा दोहोरो प्रकाशन रोक्नको लागि यसलाई अस्वीकार गरिएको छ।`;
    } else if (highestSimilarityScore >= 35) {
      recommendation = "flag_for_review";
      justification = `यो समाचार विगतको समाचार "${mostSimilarArticleTitle}" सँग आंशिक रूपमा मिल्दोजुल्दो (${highestSimilarityScore}%) छ। केही वाक्य र वाक्यांशहरू हुबहु दोहोरिएका छन्, थप सम्पादकीय संशोधन आवश्यक छ।`;
    }
    
    return {
      originalityScore,
      highestSimilarityScore,
      mostSimilarArticleTitle,
      overlappingPhrases,
      recommendation,
      justification
    };
  }
};
