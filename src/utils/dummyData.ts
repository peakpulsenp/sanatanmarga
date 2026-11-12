import { collection, getDocs } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { setDocWithQueue, offlineQueue } from "@/src/lib/offlineQueue";
import { seedDatabase, dummyCategories as seedCategories } from "@/src/lib/seedData";

export const addDummyData = async (authorId: string) => {
  if (import.meta.env.PROD) {
    console.warn("Automatic content seeding is disabled in production to protect database integrity.");
    return;
  }

  // Check if dummy data already exists
  try {
    const articlesSnapshot = await getDocs(collection(db, "articles"));
    if (!articlesSnapshot.empty) {
      return;
    }
  } catch (e) {
    // Proceed with seed if read fails
  }

  // 1. Add site settings if not exist
  try {
    await setDocWithQueue("settings/site", {
      siteName: "सनातन मार्ग",
      siteDescription: "हामी सत्य, तथ्य र निष्पक्ष समाचार सम्प्रेषणका लागि प्रतिबद्ध छौं। समाजका हरेक पक्षलाई समेट्दै हामी तपाईंलाई सुसूचित गराउने प्रयासमा छौं।",
      logoUrl: "/logo.png",
      contactEmail: "info@sanatanmarga.com",
      contactPhone: "+977-9705125527",
      address: "काठमाडौं, नेपाल",
      facebookUrl: "https://www.facebook.com/Sanatanmarga",
      twitterUrl: "https://x.com/Sanatanmarga",
      instagramUrl: "https://www.instagram.com/omsanatanmarga/",
      youtubeUrl: "https://www.youtube.com/@omSanatanMarga",
      footerText: "सर्वाधिकार सुरक्षित।"
    });
    await offlineQueue.syncViaServer();
  } catch (e) {
    console.warn("addDummyData settings queue warning:", e);
  }

  // 2. Use the AI Seeding logic to generate high-quality content
  const allCategorySlugs = seedCategories.map(c => c.slug!);
  await seedDatabase(allCategorySlugs);
};

