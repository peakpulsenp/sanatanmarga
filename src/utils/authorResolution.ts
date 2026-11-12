/**
 * Author Resolution & Newsroom Attribution Engine
 * Enforces strict distinction between the Human/AI Generator (Author/Editor)
 * and the External News Publishers (Sources).
 */

export interface ResolvedAuthorInfo {
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: string;
  sourcePublishers: string[];
  sourceUrls: string[];
}

const KNOWN_PUBLISHER_DOMAINS = [
  "ratopati",
  "ratopati.com",
  "ekantipur",
  "ekantipur.com",
  "kantipur",
  "onlinekhabar",
  "onlinekhabar.com",
  "setopati",
  "setopati.com",
  "nagarik",
  "nagariknetwork",
  "nagariknews",
  "nagariknetwork.com",
  "annapurnapost",
  "annapurnapost.com",
  "gorkhapatra",
  "gorkhapatraonline",
  "gorkhapatraonline.com",
  "thehimalayantimes",
  "himalayantimes",
  "kathmandupost",
  "kathmandupost.com",
  "nepalkhabar",
  "nepalkhabar.com",
  "ujyaaloonline",
  "ujyaaloonline.com",
  "baahrakhari",
  "baahrakhari.com",
  "deshsanchar",
  "deshsanchar.com",
  "bizkhabar",
  "bizmandu",
  "merolagani",
  "arthasarokar",
  "bbc",
  "bbc.com",
  "reuters",
  "reuters.com",
  "apnews",
  "apnews.com",
  "aljazeera",
  "aljazeera.com"
];

/**
 * Checks if a given author string is actually a media publisher/domain rather than a human journalist/editor.
 */
export function isPublisherDomain(name?: string): boolean {
  if (!name || typeof name !== "string") return false;
  const lower = name.toLowerCase().trim();
  
  if (lower.includes(".com") || lower.includes(".np") || lower.includes(".org") || lower.includes("http")) {
    return true;
  }

  return KNOWN_PUBLISHER_DOMAINS.some(pub => {
    return lower === pub || lower.startsWith(pub) || lower.endsWith(pub);
  });
}

/**
 * Formats a clean, professional publisher brand name from a raw string or URL.
 */
export function formatPublisherName(raw: string): string {
  if (!raw) return "समाचार स्रोत";
  const trimmed = raw.trim();

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const hostname = new URL(trimmed).hostname.replace(/^www\./, "");
      if (hostname.includes("ratopati")) return "रातोपाटी (Ratopati)";
      if (hostname.includes("ekantipur") || hostname.includes("kantipur")) return "इकान्तिपुर (Ekantipur)";
      if (hostname.includes("onlinekhabar")) return "अनलाइनखबर (OnlineKhabar)";
      if (hostname.includes("setopati")) return "सेतोपाटी (Setopati)";
      if (hostname.includes("nagarik")) return "नागरिक (Nagarik)";
      if (hostname.includes("annapurna")) return "अन्नपूर्ण पोस्ट (Annapurna Post)";
      if (hostname.includes("gorkhapatra")) return "गोरखापत्र (Gorkhapatra)";
      if (hostname.includes("kathmandupost")) return "काठमाडौं पोस्ट (The Kathmandu Post)";
      if (hostname.includes("himalayantimes")) return "द हिमालयन टाइम्स (The Himalayan Times)";
      if (hostname.includes("nepalkhabar")) return "नेपालखबर (NepalKhabar)";
      if (hostname.includes("gov.np")) return "नेपाल सरकार (Government of Nepal)";
      return hostname;
    }
  } catch {
    // ignore URL parse errors
  }

  const lower = trimmed.toLowerCase();
  if (lower.includes("ratopati")) return "रातोपाटी (Ratopati)";
  if (lower.includes("ekantipur") || lower.includes("kantipur")) return "इकान्तिपुर (Ekantipur)";
  if (lower.includes("onlinekhabar")) return "अनलाइनखबर (OnlineKhabar)";
  if (lower.includes("setopati")) return "सेतोपाटी (Setopati)";
  if (lower.includes("nagarik")) return "नागरिक (Nagarik)";
  if (lower.includes("annapurna")) return "अन्नपूर्ण पोस्ट (Annapurna Post)";
  if (lower.includes("gorkhapatra")) return "गोरखापत्र (Gorkhapatra)";
  if (lower.includes("kathmandupost")) return "काठमाडौं पोस्ट (The Kathmandu Post)";
  if (lower.includes("himalayantimes")) return "द हिमालयन टाइम्स (The Himalayan Times)";
  if (lower.includes("nepalkhabar")) return "नेपालखबर (NepalKhabar)";

  return trimmed;
}

/**
 * Resolves authoritative author and separated source publishers for any article.
 */
export function resolveArticleAuthorAndSources(article: any, currentUser?: any): ResolvedAuthorInfo {
  const rawAuthorName = article?.authorName || article?.author || "";
  const rawAuthorId = article?.authorId || article?.generatedByUserId || article?.generatedBy || "";
  const rawAuthorAvatar = article?.authorPhoto || article?.authorAvatar || "";
  
  // Extract all potential source candidates
  const extractedSources: string[] = [];

  if (Array.isArray(article?.sourcePublishers)) {
    extractedSources.push(...article.sourcePublishers);
  }
  if (Array.isArray(article?.sourceUrls)) {
    extractedSources.push(...article.sourceUrls);
  }
  if (article?.source) {
    extractedSources.push(String(article.source));
  }
  if (article?.sourceName) {
    extractedSources.push(String(article.sourceName));
  }
  if (Array.isArray(article?.sources)) {
    article.sources.forEach((s: any) => {
      if (typeof s === "string") extractedSources.push(s);
      else if (s?.publisher) extractedSources.push(s.publisher);
      else if (s?.url) extractedSources.push(s.url);
      else if (s?.title) extractedSources.push(s.title);
    });
  }

  // Check if authorName is accidentally an external publisher
  let finalAuthorName = rawAuthorName;
  let finalAuthorRole = article?.authorRole || "सम्पादक • सनातनमार्ग (Editor • SanatanMarga)";
  let finalAuthorId = rawAuthorId || "sanatan_newsroom";
  let finalAuthorAvatar = rawAuthorAvatar;

  if (isPublisherDomain(rawAuthorName) || !rawAuthorName || rawAuthorName === "ai_discovery" || rawAuthorName === "ai_agent") {
    if (rawAuthorName && isPublisherDomain(rawAuthorName)) {
      extractedSources.unshift(rawAuthorName);
    }

    // Default to Current Logged-in Editor or Senior Editorial Byline
    if (currentUser?.displayName) {
      finalAuthorName = currentUser.displayName;
      finalAuthorId = currentUser.uid || "editor_user";
      finalAuthorAvatar = currentUser.photoURL || "";
      finalAuthorRole = currentUser.role === "admin" ? "प्रधान सम्पादक • सनातनमार्ग" : "सम्पादक • सनातनमार्ग";
    } else {
      finalAuthorName = "सागर राणा (Sagar Rana)";
      finalAuthorRole = "सम्पादक • सनातनमार्ग (Editor • SanatanMarga)";
      finalAuthorId = "editor_sagar";
    }
  }

  // Deduplicate and format source publishers
  const uniquePublisherMap = new Map<string, string>();
  const cleanSourceUrls: string[] = [];

  extractedSources.forEach(s => {
    if (!s) return;
    const str = String(s).trim();
    if (!str) return;

    if (str.startsWith("http://") || str.startsWith("https://")) {
      cleanSourceUrls.push(str);
    }
    
    const formatted = formatPublisherName(str);
    if (formatted && !uniquePublisherMap.has(formatted.toLowerCase())) {
      uniquePublisherMap.set(formatted.toLowerCase(), formatted);
    }
  });

  const sourcePublishers = Array.from(uniquePublisherMap.values());

  return {
    authorId: finalAuthorId,
    authorName: finalAuthorName,
    authorAvatar: finalAuthorAvatar,
    authorRole: finalAuthorRole,
    sourcePublishers: sourcePublishers.length > 0 ? sourcePublishers : ["राष्ट्रिय समाचार समिति (RSS)", "सनातनमार्ग समाचार डेस्क"],
    sourceUrls: Array.from(new Set(cleanSourceUrls))
  };
}
