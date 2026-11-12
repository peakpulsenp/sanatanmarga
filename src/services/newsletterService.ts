import { collection, query, where, orderBy, limit, getDocs } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { Article } from "@/src/types";

export async function generateWeeklyNewsletter() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const q = query(
    collection(db, "articles"),
    where("status", "==", "published"),
    where("createdAt", ">=", sevenDaysAgo.toISOString()),
    orderBy("views", "desc"),
    limit(5)
  );

  const snapshot = await getDocs(q);
  const articles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));

  let html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h1 style="color: #2563eb;">Sanatan Marga: Weekly Digest</h1>
      <p style="font-size: 16px;">यहाँ यस हप्ताका सबैभन्दा लोकप्रिय समाचारहरू छन्:</p>
      <hr style="border: 1px solid #eee;" />
  `;

  articles.forEach(article => {
    html += `
      <div style="margin-bottom: 20px;">
        <img src="${article.featuredImage}" style="width: 100%; border-radius: 8px;" />
        <h2 style="margin-bottom: 5px;"><a href="https://sanatanmarga.com/article/${article.id}" style="color: #000; text-decoration: none;">${article.title}</a></h2>
        <p style="font-size: 14px; color: #666;">${article.excerpt}</p>
      </div>
    `;
  });

  html += `
      <div style="margin-top: 30px; font-size: 12px; color: #999;">
        <p>यो इमेल तपाईंलाई पठाएको हो किनकि तपाईंले सदस्यता लिनुभएको छ।</p>
      </div>
    </div>
  `;

  return html;
}
