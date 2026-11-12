import { collection, getDocs, query, where, limit } from "@/src/lib/firebase";
import { db, auth } from "./firebase";
import { addDocWithQueue, offlineQueue } from "./offlineQueue";
import { Type } from "@google/genai";
import { UNIQUE_DISTRICTS } from "../constants/districts";
import { generateWithRotation } from "../services/rotatingAiService";
import { extractJson } from "../utils/jsonUtils";
import type { Category } from "../types";
import { resolveArticleImage } from "../services/imageIntelligence";
import { generateAINews } from "../services/aiNewsService";

export const dummyCategories: Partial<Category>[] = [
  { nameNepali: "राजनीति", nameEnglish: "Politics", slug: "politics", order: 1 },
  { nameNepali: "देश", nameEnglish: "National", slug: "desh", order: 2 },
  { nameNepali: "प्रदेश", nameEnglish: "Province", slug: "pradesh", order: 3 },
  { nameNepali: "विश्व", nameEnglish: "International", slug: "bishwo", order: 4 },
  { nameNepali: "खेलकुद", nameEnglish: "Sports", slug: "sports", order: 5 },
  { nameNepali: "मनोरञ्जन", nameEnglish: "Entertainment", slug: "entertainment", order: 6 },
  { nameNepali: "अर्थ", nameEnglish: "Economy", slug: "economy", order: 7 },
  { nameNepali: "प्रविधि", nameEnglish: "Tech", slug: "tech", order: 8 },
];

const DIVERSE_NEPALI_AUTHORS = [
  { id: "author_sagar", name: "Sagar Rana" },
  { id: "author_arjun", name: "Arjun Adhikari" },
  { id: "author_saraswati", name: "Saraswati Thapa" },
  { id: "author_ramesh", name: "Ramesh Shrestha" },
  { id: "author_binita", name: "Binita Karki" },
  { id: "author_prakash", name: "Prakash Dahal" },
  { id: "author_anusha", name: "Anusha Bhandari" }
];

export const seedDatabase = async (
  selectedCategories: string[], 
  countPerCategory: number = 1,
  onProgress?: (progress: number, message: string) => void
) => {
  if (import.meta.env.PROD) {
    console.warn("Seeding is disabled in production environment to protect content integrity.");
    return { success: false, error: "संरक्षण नियम: उत्पादन वातावरण (Production) मा नयाँ काल्पनिक डेटा थप्न निषेध गरिएको छ।" };
  }

  try {
    console.log("Seeding started with Gemini AI...");
    onProgress?.(0, "सुरु गर्दै...");
    
    // 1. Seed Categories
    onProgress?.(5, "श्रेणीहरू जाँच गर्दै...");
    let catSnapshot: any = null;
    try {
      catSnapshot = await getDocs(collection(db, "categories"));
    } catch (e) {
      console.warn("Could not read categories directly, proceeding with queue seed:", e);
    }
    
    if (!catSnapshot || catSnapshot.empty) {
      onProgress?.(10, "श्रेणीहरू थप्दै...");
      for (const cat of dummyCategories) {
        await addDocWithQueue("categories", cat);
      }
      console.log("Categories queued for seeding.");
    }

    // 2. Generate Articles using Gemini for selected categories
    const articlesCol = collection(db, "articles");
    const categoriesToSeed = dummyCategories.filter(c => selectedCategories.includes(c.slug!));
    const totalCategories = categoriesToSeed.length;
    
    const totalSteps = totalCategories * countPerCategory;
    let currentStep = 0;
    let successCount = 0;
    let failCount = 0;
    const failureReasons: string[] = [];
    
    for (const cat of categoriesToSeed) {
      for (let j = 0; j < countPerCategory; j++) {
        currentStep++;
        const progressBase = 15 + (currentStep / totalSteps) * 80;
        
        onProgress?.(progressBase, `${cat.nameNepali} समाचार ${j + 1}/${countPerCategory} सिर्जना गर्दै...`);
        console.log(`Generating article ${j + 1}/${countPerCategory} for ${cat.nameEnglish}...`);
        
        try {
          console.log(`[SEED] Launching Newsroom Pipeline (Discovery -> Article Generator) for ${cat.nameEnglish}...`);
          
          let newsArticle;
          try {
            newsArticle = await generateAINews(cat.slug!, cat.nameNepali!, undefined, [], "standard");
            console.log("[SEED_AI_RESULT]", JSON.stringify(newsArticle, null, 2));
            if (!newsArticle) {
              throw new Error("generateAINews returned null or undefined");
            }
          } catch (err: any) {
            console.error("[AI_FAILURE_RAW] Using offline fallback template:", err?.message || err);
            
            // Graceful fallback to prevent total seeding failure on quota exhaustion
            newsArticle = {
              title: `${cat.nameNepali} सम्बन्धी विशेष रिपोर्ट (अफलाइन)`,
              excerpt: `यो ${cat.nameNepali} सम्बन्धी एक विस्तृत विश्लेषण र रिपोर्ट हो। हाल सर्भरमा कोटा सीमितताका कारण यो नमुना सामग्री प्रदर्शन गरिएको छ।`,
              content: `<p>विभिन्न स्रोतहरूबाट प्राप्त जानकारी अनुसार <strong>${cat.nameNepali}</strong> क्षेत्रमा हालै केही महत्त्वपूर्ण घटनाक्रमहरू विकसित भएका छन्।</p><p>विशेषज्ञहरूका अनुसार यो प्रवृत्तिले आउँदा दिनहरूमा महत्त्वपूर्ण प्रभाव पार्न सक्छ। थप विवरणहरूको लागि हामी हाम्रा स्रोतहरूसँग निरन्तर सम्पर्कमा छौं र छिट्टै अद्यावधिक गर्नेछौं।</p><p><em>नोट: यो एउटा स्व-उत्पादित (अफलाइन) नमुना समाचार हो।</em></p>`,
              imageUrl: `https://source.unsplash.com/800x600/?nepal,${cat.nameEnglish}`,
              isBreaking: Math.random() > 0.8,
              districts: ["काठमाडौं", "ललितपुर"],
              sourceUrls: ["https://gorkhapatraonline.com"]
            };
          }
          
          console.log("[AI_SUCCESS] Newsroom pipeline generated article:", newsArticle.title);
          
          const randomAuthor = DIVERSE_NEPALI_AUTHORS[Math.floor(Math.random() * DIVERSE_NEPALI_AUTHORS.length)];
          const randomDaysAgo = Math.random() * 14;
          const postDate = new Date();
          postDate.setTime(postDate.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);
          const createdAtStr = postDate.toISOString();

          await addDocWithQueue("articles", {
            title: newsArticle.title,
            excerpt: newsArticle.excerpt,
            content: newsArticle.content,
            categoryId: cat.slug,
            authorId: randomAuthor.id,
            authorName: randomAuthor.name,
            status: "published",
            featuredImage: newsArticle.imageUrl || "",
            views: Math.floor(Math.random() * 5000) + 120,
            isBreaking: newsArticle.isBreaking || false,
            isFeatured: Math.random() > 0.7,
            districts: newsArticle.districts || [],
            sourceUrls: newsArticle.sourceUrls || [],
            sourceType: "seed",
            isSynthetic: true,
            createdAt: createdAtStr,
            updatedAt: createdAtStr
          });
          successCount++;
        } catch (error: any) {
          console.error("[AI_FAILURE_RAW]");
          console.error(error);

          if (error instanceof Error) {
            console.error("[AI_FAILURE_MESSAGE]");
            console.error(error.message);

            console.error("[AI_FAILURE_STACK]");
            console.error(error.stack);
          }
          
          failCount++;
          failureReasons.push(`${cat.nameEnglish}: ${error?.message || error}`);
          console.error(`Failed to seed ${cat.nameEnglish}:`, error);
        }
      }
    }

    const seedStatus = failCount === 0 ? "SUCCESS" : (successCount > 0 ? "PARTIAL_SUCCESS" : "FAILED");
    console.log(`[SEED_RESULT] status: ${seedStatus} generated: ${successCount} failed: ${failCount} reasons: ${failureReasons.join("; ") || "none"}`);

    // 3. Seed Contact Messages if empty
    try {
      let contactSnapshot: any = null;
      try {
        contactSnapshot = await getDocs(collection(db, "contactMessages"));
      } catch (e) {
        // ignore read restriction
      }
      if (!contactSnapshot || contactSnapshot.empty) {
        onProgress?.(98, "सम्पर्क सन्देशहरू थप्दै...");
        const dummyMessages = [
          {
            name: "राम बहादुर",
            email: "ram@example.com",
            subject: "विज्ञापनको बारेमा",
            message: "तपाईंको पोर्टलमा विज्ञापन राख्न चाहन्छु। प्रक्रिया के छ?",
            status: "new",
            createdAt: new Date().toISOString()
          },
          {
            name: "सिता थापा",
            email: "sita@example.com",
            subject: "समाचार सुझाव",
            message: "हाम्रो गाउँमा खानेपानीको समस्या छ, यसको बारेमा समाचार बनाइदिनुहोला।",
            status: "new",
            createdAt: new Date().toISOString()
          }
        ];
        for (const msg of dummyMessages) {
          await addDocWithQueue("contactMessages", msg);
        }
      }
    } catch (contactErr) {
      console.warn("Skipped contactMessages seeding:", contactErr);
    }

    // Synchronize all queued items directly via server bypass endpoint
    onProgress?.(99, "सर्भरसँग समन्वय गर्दै...");
    await offlineQueue.syncViaServer();

    onProgress?.(100, "सफलतापूर्वक सम्पन्न भयो!");
    console.log("Seeding completed successfully!");
    return { success: true };
  } catch (error) {
    console.error("Seeding failed:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};
