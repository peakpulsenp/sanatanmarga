import { collection, query, where, orderBy, limit, getDocs } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { SEED_STORYLINE_ARCS } from "./storyEvolutionEngine";
import { SEED_KNOWLEDGE_NODES } from "./knowledgeGraphService";

import { filterPublicArticles } from "@/src/utils/publicationHelper";

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").trim();
}

/**
 * Generate Google News XML Sitemap compliant with Google News indexing specifications.
 * Includes only articles published in the last 48 hours (or fallback to recent published articles).
 */
export async function generateGoogleNewsSitemap(preloadedArticles?: any[]): Promise<string> {
  let articles: any[] = [];

  if (preloadedArticles && preloadedArticles.length > 0) {
    articles = filterPublicArticles(preloadedArticles);
  } else {
    try {
      const fortyEightHoursAgo = new Date();
      fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

      const q = query(
        collection(db, "articles"),
        where("status", "==", "published"),
        orderBy("createdAt", "desc"),
        limit(500)
      );
      const snapshot = await getDocs(q);
      articles = filterPublicArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.warn("Could not query Firestore for news sitemap, using fallback empty list:", e);
    }
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n';

  for (const art of articles.slice(0, 1000)) {
    const url = `https://sanatanmarga.com/article/${art.id}`;
    const pubDate = art.createdAt 
      ? (typeof art.createdAt === 'string' ? art.createdAt : (art.createdAt.toDate ? art.createdAt.toDate().toISOString() : new Date(art.createdAt).toISOString()))
      : new Date().toISOString();
    const title = escapeXml(art.titleNepali || art.title || "समाचार");
    const lang = art.language === "en" ? "en" : "ne";

    xml += '  <url>\n';
    xml += `    <loc>${url}</loc>\n`;
    xml += '    <news:news>\n';
    xml += '      <news:publication>\n';
    xml += '        <news:name>सनातन मार्ग (Sanatan Marga)</news:name>\n';
    xml += `        <news:language>${lang}</news:language>\n`;
    xml += '      </news:publication>\n';
    xml += `      <news:publication_date>${pubDate}</news:publication_date>\n`;
    xml += `      <news:title>${title}</news:title>\n`;
    xml += '    </news:news>\n';
    xml += '  </url>\n';
  }

  xml += '</urlset>';
  return xml;
}

/**
 * Backward compatibility alias for generateNewsSitemap
 */
export async function generateNewsSitemap(preloadedArticles?: any[]): Promise<string> {
  return generateGoogleNewsSitemap(preloadedArticles);
}

/**
 * Generate standard URL set for all published news articles
 */
export async function generateArticlesSitemap(preloadedArticles?: any[]): Promise<string> {
  let articles: any[] = [];

  if (preloadedArticles && preloadedArticles.length > 0) {
    articles = filterPublicArticles(preloadedArticles);
  } else {
    try {
      const q = query(collection(db, "articles"), where("status", "==", "published"), limit(1000));
      const snap = await getDocs(q);
      articles = filterPublicArticles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.warn("Could not query Firestore for articles sitemap:", e);
    }
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  for (const art of articles) {
    const url = `https://sanatanmarga.com/article/${art.id}`;
    const lastMod = art.updatedAt 
      ? (typeof art.updatedAt === 'string' ? art.updatedAt : (art.updatedAt.toDate ? art.updatedAt.toDate().toISOString() : new Date().toISOString()))
      : new Date().toISOString();

    xml += '  <url>\n';
    xml += `    <loc>${url}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    if (art.featuredImage) {
      xml += '    <image:image>\n';
      xml += `      <image:loc>${escapeXml(art.featuredImage)}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(art.title || "")}</image:title>\n`;
      xml += '    </image:image>\n';
    }
    xml += '  </url>\n';
  }

  xml += '</urlset>';
  return xml;
}

/**
 * Generate Sitemap for Storylines and Knowledge Graph Entities
 */
export function generateStorylinesAndEntitiesSitemap(): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Storylines index & items
  xml += '  <url>\n';
  xml += '    <loc>https://sanatanmarga.com/storylines</loc>\n';
  xml += '    <changefreq>hourly</changefreq>\n';
  xml += '    <priority>0.9</priority>\n';
  xml += '  </url>\n';

  // Knowledge Hub
  xml += '  <url>\n';
  xml += '    <loc>https://sanatanmarga.com/knowledge</loc>\n';
  xml += '    <changefreq>daily</changefreq>\n';
  xml += '    <priority>0.8</priority>\n';
  xml += '  </url>\n';

  // Static Categories & Hubs
  const staticHubs = ["politics", "desh", "economy", "sports", "entertainment", "sanatan", "nepal-hub", "community", "models", "events"];
  for (const hub of staticHubs) {
    xml += '  <url>\n';
    xml += `    <loc>https://sanatanmarga.com/category/${hub}</loc>\n`;
    xml += '    <changefreq>hourly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  }

  xml += '</urlset>';
  return xml;
}

/**
 * Generate Master Sitemap Index (sitemap.xml)
 */
export function generateMasterSitemapIndex(): string {
  const now = new Date().toISOString();
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  xml += '  <sitemap>\n';
  xml += '    <loc>https://sanatanmarga.com/sitemap-news.xml</loc>\n';
  xml += `    <lastmod>${now}</lastmod>\n`;
  xml += '  </sitemap>\n';

  xml += '  <sitemap>\n';
  xml += '    <loc>https://sanatanmarga.com/sitemap-articles.xml</loc>\n';
  xml += `    <lastmod>${now}</lastmod>\n`;
  xml += '  </sitemap>\n';

  xml += '  <sitemap>\n';
  xml += '    <loc>https://sanatanmarga.com/sitemap-storylines.xml</loc>\n';
  xml += `    <lastmod>${now}</lastmod>\n`;
  xml += '  </sitemap>\n';

  xml += '</sitemapindex>';
  return xml;
}

/**
 * Generate RSS 2.0 Syndication Feed with full UTF-8 Nepali support
 */
export async function generateRssSyndicationFeed(preloadedArticles?: any[], categorySlug?: string): Promise<string> {
  let articles: any[] = [];

  if (preloadedArticles && preloadedArticles.length > 0) {
    articles = preloadedArticles;
  } else {
    try {
      let q = query(collection(db, "articles"), where("status", "==", "published"), orderBy("createdAt", "desc"), limit(50));
      if (categorySlug && categorySlug !== "all") {
        q = query(collection(db, "articles"), where("categoryId", "==", categorySlug), where("status", "==", "published"), orderBy("createdAt", "desc"), limit(50));
      }
      const snap = await getDocs(q);
      articles = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn("Could not query Firestore for RSS feed:", e);
    }
  }

  const nowRfc822 = new Date().toUTCString();
  const feedTitle = categorySlug 
    ? `सनातन मार्ग - ${categorySlug.toUpperCase()} फिड` 
    : "सनातन मार्ग | Sanatan Marga - राष्ट्रिय समाचार तथा विचार";

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">\n';
  xml += '  <channel>\n';
  xml += `    <title>${escapeXml(feedTitle)}</title>\n`;
  xml += '    <link>https://sanatanmarga.com</link>\n';
  xml += `    <atom:link href="https://sanatanmarga.com/rss${categorySlug ? `/${categorySlug}` : '.xml'}" rel="self" type="application/rss+xml" />\n`;
  xml += '    <description>सत्य, निष्पक्ष र राष्ट्रिय एकताको पक्षधर अग्रणी डिजिटल पत्रिका</description>\n';
  xml += '    <language>ne</language>\n';
  xml += `    <lastBuildDate>${nowRfc822}</lastBuildDate>\n`;
  xml += '    <image>\n';
  xml += '      <url>https://sanatanmarga.com/logo.png</url>\n';
  xml += '      <title>Sanatan Marga</title>\n';
  xml += '      <link>https://sanatanmarga.com</link>\n';
  xml += '    </image>\n';

  for (const art of articles.slice(0, 50)) {
    const link = `https://sanatanmarga.com/article/${art.id}`;
    const title = escapeXml(art.titleNepali || art.title || "समाचार");
    const rawDate = art.createdAt ? (typeof art.createdAt === 'string' ? art.createdAt : (art.createdAt.toDate ? art.createdAt.toDate() : new Date(art.createdAt))) : new Date();
    const pubDate = new Date(rawDate).toUTCString();
    const description = escapeXml(art.excerptNepali || art.excerpt || stripHtml(art.content || "").slice(0, 200));
    const author = escapeXml(art.authorName || "Sanatan Marga Desk");
    const category = escapeXml(art.categoryId || "समाचार");

    xml += '    <item>\n';
    xml += `      <title>${title}</title>\n`;
    xml += `      <link>${link}</link>\n`;
    xml += `      <guid isPermaLink="true">${link}</guid>\n`;
    xml += `      <pubDate>${pubDate}</pubDate>\n`;
    xml += `      <dc:creator>${author}</dc:creator>\n`;
    xml += `      <category>${category}</category>\n`;
    xml += `      <description>${description}</description>\n`;
    if (art.featuredImage) {
      xml += `      <enclosure url="${escapeXml(art.featuredImage)}" type="image/jpeg" length="0" />\n`;
    }
    if (art.content) {
      xml += `      <content:encoded><![CDATA[${art.content}]]></content:encoded>\n`;
    }
    xml += '    </item>\n';
  }

  xml += '  </channel>\n';
  xml += '</rss>';
  return xml;
}
