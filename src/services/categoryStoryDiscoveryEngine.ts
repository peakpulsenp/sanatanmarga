import { Type } from "@google/genai";
import { AIModelGateway } from "./aiModelGateway";
import { getDynamicDateContext } from "../utils/dateEngine";
import { extractJson } from "../utils/jsonUtils";
import { parseNewsTimestamp, ParsedTimestampResult } from "../utils/timestampParser";
import { NewsroomBrief, VerifiedSource } from "./discoveryEngine";
import { TemporalKnowledgeOS, PreGenerationFactManifest } from "./temporalKnowledgeOS";
import { TemporalFactAuditor, TemporalFactAuditResult } from "./temporalFactAuditor";

export interface CandidateSource extends VerifiedSource {
  parsedTimestamp: ParsedTimestampResult;
  sourceTier: 1 | 2 | 3 | 4;
  authorityScore: number;
}

export interface CandidateStory {
  clusterId: string;
  storyId?: string;
  storyTitle: string;
  storyType: 'breaking' | 'trending' | 'ordinary';
  priorityScore: number; // 100 for breaking, 80 for trending, 60 for ordinary
  category: string;
  categoryNepali: string;
  primarySource: CandidateSource;
  corroboratingSources: CandidateSource[];
  allSources: CandidateSource[];
  officialSources: CandidateSource[];
  freshnessScore: number;
  authorityScore: number;
  averageAgeHours: number;
  brief: NewsroomBrief;
  discoveredAt: string;
  publishedAt?: string;
  discoveryTimestamp?: string;
  primaryPublisher?: string;
  facts?: string[];
  district?: string;
  temporalAuditStatus?: 'VERIFIED' | 'TEMPORAL_CONFLICT';
  temporalAuditDetails?: TemporalFactAuditResult;
  preGenerationFactManifest?: PreGenerationFactManifest;
}

export type DiscoveryResultStatus =
  | 'SUCCESS'
  | 'NO_QUALIFYING_STORIES'
  | 'AI_QUOTA_EXHAUSTED'
  | 'DISCOVERY_API_INVALID_RESPONSE'
  | 'DISCOVERY_NETWORK_ERROR'
  | 'DISCOVERY_SCHEMA_ERROR';

export interface DiscoveryTelemetry {
  modelResponses: number;
  rawStoriesDiscovered: number;
  normalizedStories: number;
  temporalVerified: number;
  temporalConflicts: number;
  rejectedInvalid: number;
  editorialCandidates: number;
}

export interface CategoryDiscoveryOutput {
  category: string;
  categoryNepali: string;
  status: DiscoveryResultStatus;
  statusMessageNe?: string;
  totalCandidateSourcesDiscovered: number;
  validFreshSourcesCount: number;
  breakingStories: CandidateStory[];
  trendingStories: CandidateStory[];
  ordinaryStories: CandidateStory[];
  selectedStory: CandidateStory | null;
  rejectionReason?: string;
  telemetry?: DiscoveryTelemetry;
}

/**
 * Normalizes raw model output from all Gemini versions/variations into canonical candidate items.
 */
export function normalizeDiscoveryResponse(
  raw: any,
  categorySlug: string,
  categoryNepali: string,
  currentADDate: string
): {
  schemaValid: boolean;
  schemaVersion: string;
  recovery: string;
  rawCandidates: any[];
} {
  let schemaValid = false;
  let schemaVersion = "unknown";
  let recovery = "none";
  let rawCandidates: any[] = [];

  if (!raw || typeof raw !== "object") {
    return { schemaValid, schemaVersion, recovery: "empty_payload", rawCandidates: [] };
  }

  // Unwrap root wrappers e.g. { data: { ... } }, { payload: { ... } }, { results: { ... } }
  let targetObj = raw;
  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    !raw.story_clusters &&
    !raw.news_clusters &&
    !raw.stories &&
    !raw.candidates &&
    !raw.items &&
    !raw.news_items &&
    !raw.breaking &&
    !raw.trending &&
    !raw.ordinary &&
    !raw.title &&
    !raw.eventTitle &&
    !raw.headline
  ) {
    if (raw.data && typeof raw.data === "object") targetObj = raw.data;
    else if (raw.payload && typeof raw.payload === "object") targetObj = raw.payload;
    else if (raw.results && typeof raw.results === "object") targetObj = raw.results;
    else if (raw.response && typeof raw.response === "object") targetObj = raw.response;
    else if (raw.news && typeof raw.news === "object") targetObj = raw.news;
  }

  // Detect schema version
  if (targetObj.schema_version) {
    schemaVersion = String(targetObj.schema_version);
  } else if (targetObj.story_clusters) {
    schemaVersion = "2.1";
  } else if (targetObj.news_clusters) {
    schemaVersion = "legacy_1.0";
  } else if (Array.isArray(targetObj)) {
    schemaVersion = "raw_array";
  }

  const extractItemsFromClusterObject = (clusterObj: any, defaultType: string): any[] => {
    if (!clusterObj) return [];
    if (Array.isArray(clusterObj)) {
      return clusterObj.map(it => ({ ...it, storyType: it.storyType || defaultType }));
    }
    if (typeof clusterObj === "object") {
      // Check if this object is actually a single story item: { url: "...", title: "...", key_facts: "..." }
      if (clusterObj.title || clusterObj.event_title || clusterObj.headline || clusterObj.url || clusterObj.key_facts) {
        return [{ ...clusterObj, storyType: defaultType }];
      }
      // If it's a map of items
      const items: any[] = [];
      for (const k of Object.keys(clusterObj)) {
        const val = clusterObj[k];
        if (Array.isArray(val)) {
          items.push(...val.map(it => ({ ...it, storyType: it.storyType || defaultType })));
        } else if (val && typeof val === "object" && (val.title || val.event_title || val.url || val.key_facts)) {
          items.push({ ...val, storyType: defaultType });
        }
      }
      return items;
    }
    return [];
  };

  // Check story_clusters (canonical v2.1)
  const clusters = targetObj.story_clusters || targetObj.storyClusters || targetObj.news_clusters || targetObj.newsClusters || targetObj.clusters;
  if (clusters && typeof clusters === "object") {
    schemaValid = true;
    recovery = targetObj.story_clusters ? "canonical_v2.1" : "normalized_legacy_clusters";

    const clusterKeys = Object.keys(clusters);
    for (const key of clusterKeys) {
      const upperKey = key.toUpperCase();
      const clusterType = upperKey.includes("BREAKING")
        ? "breaking"
        : upperKey.includes("TRENDING")
        ? "trending"
        : "ordinary";
      
      const items = extractItemsFromClusterObject(clusters[key], clusterType);
      rawCandidates.push(...items);
    }
  } else if (Array.isArray(targetObj.stories)) {
    schemaValid = true;
    recovery = "array_stories";
    rawCandidates = targetObj.stories;
  } else if (Array.isArray(targetObj.candidates)) {
    schemaValid = true;
    recovery = "array_candidates";
    rawCandidates = targetObj.candidates;
  } else if (Array.isArray(targetObj.items)) {
    schemaValid = true;
    recovery = "array_items";
    rawCandidates = targetObj.items;
  } else if (Array.isArray(targetObj.news_items)) {
    schemaValid = true;
    recovery = "array_news_items";
    rawCandidates = targetObj.news_items;
  } else if (Array.isArray(targetObj.breaking) || Array.isArray(targetObj.trending) || Array.isArray(targetObj.ordinary)) {
    schemaValid = true;
    recovery = "split_arrays";
    if (Array.isArray(targetObj.breaking)) rawCandidates.push(...targetObj.breaking.map((it: any) => ({ ...it, storyType: "breaking" })));
    if (Array.isArray(targetObj.trending)) rawCandidates.push(...targetObj.trending.map((it: any) => ({ ...it, storyType: "trending" })));
    if (Array.isArray(targetObj.ordinary)) rawCandidates.push(...targetObj.ordinary.map((it: any) => ({ ...it, storyType: "ordinary" })));
  } else if (Array.isArray(targetObj)) {
    schemaValid = true;
    recovery = "root_array";
    rawCandidates = targetObj;
  } else if (targetObj.eventTitle || targetObj.event_title || targetObj.title || targetObj.headline || targetObj.story_title) {
    schemaValid = true;
    recovery = "single_story_object";
    rawCandidates = [targetObj];
  }

  // Canonical normalization for each raw candidate
  const canonicalCandidates = rawCandidates.map((it, idx) => {
    const title = String(
      it.title || 
      it.event_title || 
      it.eventTitle || 
      it.story_title || 
      it.storyTitle || 
      it.headline || 
      it.name || 
      `${categoryNepali} ताजा घटनाक्रम`
    ).trim();

    const publisher = String(
      it.publisher || 
      it.source || 
      it.source_name || 
      it.sourceName || 
      it.media || 
      it.outlet || 
      "Gorkhapatra"
    ).trim();

    const publishedAt = String(
      it.published_at || 
      it.publishedAt || 
      it.date || 
      it.time || 
      it.datetime || 
      it.timestamp || 
      ""
    ).trim();

    const url = String(
      it.url || 
      it.source_url || 
      it.sourceUrl || 
      it.link || 
      it.uri || 
      it.article_url || 
      ""
    ).trim();

    let facts: string[] = [];
    if (Array.isArray(it.key_facts) && it.key_facts.length > 0) {
      facts = it.key_facts.map((f: any) => String(f));
    } else if (Array.isArray(it.facts) && it.facts.length > 0) {
      facts = it.facts.map((f: any) => String(f));
    } else if (typeof it.key_facts === "string" && it.key_facts.trim()) {
      facts = it.key_facts.split("\n").map((f: string) => f.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
    } else if (typeof it.facts === "string" && it.facts.trim()) {
      facts = it.facts.split("\n").map((f: string) => f.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
    } else if (typeof it.summary === "string" && it.summary.trim()) {
      facts = [it.summary.trim()];
    } else if (typeof it.snippet === "string" && it.snippet.trim()) {
      facts = [it.snippet.trim()];
    }

    if (facts.length === 0) {
      console.warn(`[CategoryDiscovery] Candidate '${title}' rejected: no factual evidence`);
      return null;
    }

    const storyId = String(it.story_id || it.storyId || it.id || `candidate_${categorySlug}_${idx + 1}_${Date.now()}`);
    const storyType = String(it.storyType || it.story_type || it.type || (it.is_breaking ? "breaking" : "ordinary")).toLowerCase();

    return {
      storyId,
      story_id: storyId,
      title,
      eventTitle: title,
      event_title: title,
      publisher,
      source: publisher,
      publishedAt,
      published_at: publishedAt,
      url,
      source_url: url,
      facts,
      key_facts: facts,
      district: it.district || it.location || it.province || "काठमाडौँ",
      storyType: storyType.includes("breaking") ? "breaking" : storyType.includes("trending") ? "trending" : "ordinary",
      sources: it.sources || (url ? [{ url, title, publisher, publishedAt }] : [])
    };
  }).filter(Boolean);

  return {
    schemaValid,
    schemaVersion,
    recovery,
    rawCandidates: canonicalCandidates
  };
}

/**
 * Category-Specific Query Expansion Matrix
 * Contains specialized, highly targeted search anchors for every Nepali news category.
 */
export const CATEGORY_QUERY_MATRIX: Record<string, {
  nepaliKeywords: string[];
  englishKeywords: string[];
  trustedDomains: string[];
  focusDescription: string;
}> = {
  politics: {
    nepaliKeywords: [
      "मन्त्रिपरिषद् निर्णय आज", "संसद् बैठक प्रतिनिधिसभा", "सर्वोच्च अदालत संवैधानिक इजलास फैसला",
      "निर्वाचन आयोग नेपाल", "नेपाल सरकार नीति तथा निर्णय", "सिंहदरबार मन्त्रालय विकासक्रम"
    ],
    englishKeywords: ["Nepal politics latest breaking news", "Nepal cabinet decisions today", "Nepal parliament supreme court order"],
    trustedDomains: ["gorkhapatraonline.com", "setopati.com", "onlinekhabar.com", "ekantipur.com", "kathmandupost.com", "ratopati.com"],
    focusDescription: "Political governance, parliamentary bills, cabinet decisions, constitutional orders"
  },
  desh: {
    nepaliKeywords: [
      "राष्ट्रिय समाचार नेपाल आज", "गृह मन्त्रालय विपद् व्यवस्थापन", "राष्ट्रिय राजमार्ग सडक सुरक्षा",
      "नेपाल प्रहरी अनुसन्धान", "स्थानीय तह विकास र सेवा प्रवाह"
    ],
    englishKeywords: ["Nepal national news latest", "Nepal domestic developments today", "Nepal public infrastructure"],
    trustedDomains: ["gorkhapatraonline.com", "onlinekhabar.com", "ratopati.com", "nagariknetwork.com", "ekantipur.com"],
    focusDescription: "National affairs, home ministry, disaster updates, public administration"
  },
  economy: {
    nepaliKeywords: [
      "नेप्से परिसूचक सेयर बजार आज", "नेपाल राष्ट्र बैंक मौद्रिक समीक्षा", "बजेट कार्यान्वयन तथा राजस्व",
      "धितोपत्र बोर्ड निर्णय", "मुद्रास्फीति तथा बैंक ब्याजदर", "नेपाल उद्योग वाणिज्य महासंघ"
    ],
    englishKeywords: ["NEPSE index Nepal share market today", "Nepal Rastra Bank monetary review", "Nepal economy inflation revenue"],
    trustedDomains: ["bizpati.com", "bizmandu.com", "nrb.org.np", "nepalstock.com.np", "onlinekhabar.com", "setopati.com", "ekantipur.com"],
    focusDescription: "Financial markets, NEPSE, banking regulations, commerce and monetary policy"
  },
  sports: {
    nepaliKeywords: [
      "नेपाल क्रिकेट संघ क्यान खेल", "नेपाली राष्ट्रिय क्रिकेट टोली म्याच", "अखिल नेपाल फुटबल संघ एन्फा",
      "राष्ट्रिय खेलकुद प्रतियोगिता", "नेपाल साफ च्याम्पियनसिप"
    ],
    englishKeywords: ["Nepal national cricket team match update", "CAN Nepal cricket news today", "ANFA Nepal football sports"],
    trustedDomains: ["onlinekhabar.com", "hamrokhelkud.com", "ekantipur.com", "ratopati.com", "setopati.com"],
    focusDescription: "Cricket matches, football leagues, national tournaments, athletics"
  },
  tech: {
    nepaliKeywords: [
      "नेपाल दूरसञ्चार प्राधिकरण निर्णय", "डिजिटल नेपाल फ्रेमवर्क एआई", "साइबर सुरक्षा तथा सूचना प्रविधि",
      "नेपाल टेलिकम एनसेल इन्टरनेट सेवा", "नेपाली प्रविधि स्टार्टअप नवप्रवर्तन"
    ],
    englishKeywords: ["Nepal telecom authority tech news", "Digital Nepal AI innovation", "Nepal cyber security and IT startup"],
    trustedDomains: ["techpana.com", "ictframe.com", "onlinekhabar.com", "setopati.com", "ekantipur.com"],
    focusDescription: "Telecommunications, AI & software, cybersecurity, digital government"
  },
  bishwo: {
    nepaliKeywords: [
      "संयुक्त राष्ट्रसंघ सुरक्षा परिषद", "विश्व राजनीति अन्तर्राष्ट्रिय घटनाक्रम", "दक्षिण एसिया कूटनीति तथा सम्बन्ध",
      "छिमेकी देश भारत चीन सम्बन्ध", "वैश्विक अर्थतन्त्र तथा जलवायु"
    ],
    englishKeywords: ["International breaking news today", "South Asia geopolitics diplomacy", "United Nations global developments"],
    trustedDomains: ["bbc.com/nepali", "reuters.com", "aljazeera.com", "kathmandupost.com", "onlinekhabar.com"],
    focusDescription: "International diplomacy, global geopolitical events, United Nations, foreign relations"
  },
  sanskar: {
    nepaliKeywords: [
      "पशुपतिनाथ मन्दिर गुठी संस्थान", "सनातन संस्कृति तथा चाडपर्व", "नेपाल पञ्चाङ्ग निर्णायक विकास समिति",
      "पुरातत्व विभाग सम्पदा संरक्षण", "वैदिक परम्परा तथा धार्मिक अनुष्ठान"
    ],
    englishKeywords: ["Pashupatinath temple Nepal heritage", "Nepal Panchanga festival dates", "Sanatan culture archaeological department"],
    trustedDomains: ["gorkhapatraonline.com", "ratopati.com", "setopati.com", "onlinekhabar.com", "ekantipur.com"],
    focusDescription: "Sanatan traditions, temple administration, heritage preservation, Vedic festivals"
  },
  tourism: {
    nepaliKeywords: [
      "नेपाल पर्यटन बोर्ड तथ्यांक", "सगरमाथा तथा हिमाल आरोहण", "नेपाल पदयात्रा पर्यटन नयाँ रुट",
      "नागरिक उड्डयन प्राधिकरण उडान", "होटल तथा पर्यटन पूर्वाधार"
    ],
    englishKeywords: ["Nepal Tourism Board tourist arrival stats", "Everest mountaineering expedition Nepal", "Nepal trekking aviation news"],
    trustedDomains: ["welcomenepal.com", "onlinekhabar.com", "kathmandupost.com", "setopati.com", "thehimalayantimes.com"],
    focusDescription: "Trekking, mountaineering, Tourism Board statistics, civil aviation"
  },
  pradesh: {
    nepaliKeywords: [
      "बागमती प्रदेश सरकार मन्त्रालय", "कोशी मधेस गण्डकी लुम्बिनी प्रदेश सभा", "कर्णाली सुदूरपश्चिम विकास आयोजना",
      "प्रदेश नीति तथा योजना आयोग"
    ],
    englishKeywords: ["Nepal province assembly government news", "Bagmati Koshi Gandaki Lumbini province development"],
    trustedDomains: ["onlinekhabar.com", "ratopati.com", "setopati.com", "ekantipur.com", "nagariknetwork.com"],
    focusDescription: "Provincial parliaments, regional development projects, local governance"
  },
  entertainment: {
    nepaliKeywords: [
      "नेपाली चलचित्र रिलिज बक्स अफिस", "चलचित्र विकास बोर्ड नेपाल", "राष्ट्रिय नाट्य संगीत महोत्सव",
      "नेपाली कला साहित्य तथा सांगीतिक कार्यक्रम"
    ],
    englishKeywords: ["Nepali cinema box office new release", "Film Development Board Nepal", "Nepali music art and literature festival"],
    trustedDomains: ["onlinekhabar.com", "ratopati.com", "setopati.com", "ekantipur.com"],
    focusDescription: "Cinema, arts, music, Film Development Board, literature"
  },
  bichar: {
    nepaliKeywords: [
      "समसामयिक राजनीतिक विचार विश्लेषण", "आर्थिक दृष्टिकोण स्तम्भ", "नेपालको परराष्ट्र नीति विश्लेषण",
      "संविधान र सुशासन विमर्श"
    ],
    englishKeywords: ["Nepal political op-ed analysis", "Nepal economic policy commentary", "Nepal governance column"],
    trustedDomains: ["setopati.com", "ekantipur.com", "kathmandupost.com", "annapurnapost.com", "ratopati.com"],
    focusDescription: "Editorial essays, political commentaries, economic thought pieces"
  },
  development: {
    nepaliKeywords: [
      "राष्ट्रिय गौरवका आयोजना प्रगति", "नागढुंगा सुरुङमार्ग तथा द्रुतमार्ग", "जलविद्युत आयोजना विद्युत प्राधिकरण",
      "खानेपानी सिँचाइ तथा पूर्वाधार विकास"
    ],
    englishKeywords: ["Nepal national pride projects progress", "Nepal fast track road hydropower development", "Nepal infrastructure electricity authority"],
    trustedDomains: ["nea.org.np", "onlinekhabar.com", "setopati.com", "gorkhapatraonline.com", "ekantipur.com"],
    focusDescription: "Infrastructure, hydropower projects, highways, mega-projects"
  }
};

export const CategoryStoryDiscoveryEngine = {
  /**
   * Determines source authority tier
   */
  resolveSourceTier(urlOrPublisher: string): 1 | 2 | 3 | 4 {
    const val = (urlOrPublisher || "").toLowerCase();
    if (
      val.includes(".gov.np") || 
      val.includes("supremecourt.gov.np") || 
      val.includes("election.gov.np") || 
      val.includes("nrb.org.np") ||
      val.includes("nea.org.np") ||
      val.includes("nepalstock.com.np")
    ) {
      return 1;
    }
    if (
      val.includes("gorkhapatraonline.com") || 
      val.includes("setopati.com") || 
      val.includes("onlinekhabar.com") || 
      val.includes("ekantipur.com") || 
      val.includes("kathmandupost.com") || 
      val.includes("ratopati.com") || 
      val.includes("nagariknetwork.com") || 
      val.includes("annapurnapost.com") ||
      val.includes("thehimalayantimes.com") ||
      val.includes("techpana.com") ||
      val.includes("bizmandu.com")
    ) {
      return 2;
    }
    if (
      val.includes("reuters.com") || 
      val.includes("apnews.com") || 
      val.includes("bbc.com") || 
      val.includes("aljazeera.com")
    ) {
      return 3;
    }
    return 2;
  },

  /**
   * Sanitizes URLs to remove search wrappers
   */
  sanitizeUrl(rawUrl: string, category: string, publisher: string): string {
    if (!rawUrl || typeof rawUrl !== "string") {
      return "";
    }
    const cleanUrl = rawUrl.trim();
    if (
      cleanUrl.includes("/search?q=") || 
      cleanUrl.includes("google.com/search") || 
      cleanUrl.includes("bing.com/search") ||
      cleanUrl.endsWith("/search")
    ) {
      return "";
    }
    return cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`;
  },

  /**
   * Discovers 20-50 candidate sources and classifies into Breaking, Trending, and Ordinary.
   */
  async discoverCategoryStories(
    categorySlug: string,
    categoryNepali: string,
    userKeywords?: string,
    searchMode: 'standard' | 'trending' | 'breaking' = 'standard',
    onProgress?: (message: string) => void
  ): Promise<CategoryDiscoveryOutput> {
    const { currentADDate, currentYear, currentBSYear } = getDynamicDateContext();
    const cleanCatSlug = categorySlug.toLowerCase().replace(/[^a-z]/g, "");
    const matrix = CATEGORY_QUERY_MATRIX[cleanCatSlug] || CATEGORY_QUERY_MATRIX.politics;

    if (onProgress) {
      onProgress(`🔎 [${categoryNepali}] विधाका २०–५० ताजा स्रोतहरू खोज्दै...`);
    }

    // Build rich, multi-query grounding prompt
    const expandedQueries = [
      ...(matrix.nepaliKeywords.slice(0, 4)),
      ...(matrix.englishKeywords.slice(0, 2)),
      ...(userKeywords ? [userKeywords] : [])
    ].join(" | ");

    const discoveryPrompt = `You are the High-Capacity Editorial Discovery Engine for Sanatan Marga News Network.
Your objective is to discover and harvest 10 to 25 REAL, CONTEMPORARY Nepali news reports published in the last 24 hours for the category: ${categoryNepali} (${categorySlug}).

TARGET DOMAIN CATEGORY: ${categorySlug} (${categoryNepali})
SEARCH ANCHORS: ${expandedQueries}
FOCUS AREA: ${matrix.focusDescription}
TODAY'S REFERENCE DATE: ${currentADDate} (${currentBSYear} BS)
SEARCH MODE: ${searchMode}

CRITICAL RULES:
1. Search specifically on top verified Nepali and regional portals: Setopati, Onlinekhabar, Ekantipur, Ratopati, Gorkhapatra, Kathmandu Post, TechPana, BizMandu, HamroKhelkud, official .gov.np portals.
2. Every item MUST have a specific event title, real published date/relative time (e.g. '२ घण्टा अगाडि', '3 hours ago', '${currentADDate}'), publisher name, article URL, and key facts.
3. Group discovered items into distinct story clusters in strict JSON format:
   - BREAKING: Events/decisions from the last 0-6 hours.
   - TRENDING: High-engagement major news from the last 6-24 hours.
   - ORDINARY: Fresh, verified daily developments from the last 24 hours.

MANDATORY JSON OUTPUT SCHEMA:
{
  "schema_version": "2.1",
  "engine_metadata": {
    "category": "${categorySlug}",
    "category_nepali": "${categoryNepali}",
    "reference_date": "${currentADDate}"
  },
  "story_clusters": {
    "BREAKING": [
      {
        "story_id": "unique_string",
        "title": "घटनाको नेपाली शीर्षक",
        "publisher": "प्रकाशक/पोर्टलको नाम",
        "published_at": "प्रकाशन समय (e.g. 2 hours ago वा ${currentADDate})",
        "url": "https://...",
        "key_facts": ["प्रमुख तथ्य १", "प्रमुख तथ्य २"],
        "district": "जिल्ला वा स्थान"
      }
    ],
    "TRENDING": [ ... ],
    "ORDINARY": [ ... ]
  }
}

Return ONLY valid JSON with all discovered candidate sources.`;

    try {
      const response = await AIModelGateway.generate({
        model: "gemini-3.7-flash",
        contents: discoveryPrompt,
        category: categorySlug,
        moduleName: "CATEGORY_STORY_DISCOVERY",
        referenceDate: currentADDate,
        config: {
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.35
          }
        }
      });

      if (onProgress) {
        onProgress(`✓ स्रोतहरूको मिति, प्राधिकार तथा विधा वर्गीकरण गर्दै...`);
      }

      // 1. Extract JSON items and grounding chunks
      let extraGroundingSources: any[] = [];

      // Extract search grounding chunks if provided by Gemini Google Search tool
      if (response && response.candidates && response.candidates[0]?.groundingMetadata?.groundingChunks) {
        const chunks = response.candidates[0].groundingMetadata.groundingChunks;
        for (const chunk of chunks) {
          if (chunk.web && chunk.web.uri) {
            extraGroundingSources.push({
              url: chunk.web.uri,
              title: chunk.web.title || `${categoryNepali} ताजा समाचार`,
              publisher: chunk.web.title?.split("-")[1]?.trim() || "Verified Portal",
              publishedAt: "",
              snippet: ""
            });
          }
        }
      }

      let parsed: any = null;
      if (response && response.text) {
        parsed = extractJson<any>(response.text);
      }

      console.log("[DISCOVERY_RAW_RESPONSE]", {
        category: categorySlug,
        hasResponseText: !!response?.text,
        hasGroundingChunks: extraGroundingSources.length,
        responseLength: response?.text?.length || 0
      });

      // Canonical schema normalization step
      const normalizedResult = normalizeDiscoveryResponse(parsed, categorySlug, categoryNepali, currentADDate);
      let candidateStoriesRaw: any[] = normalizedResult.rawCandidates;

      console.log("[DISCOVERY_SCHEMA_VALIDATION]", {
        schemaValid: normalizedResult.schemaValid,
        schemaVersion: normalizedResult.schemaVersion,
        recovery: normalizedResult.recovery,
        candidateCount: candidateStoriesRaw.length
      });

      console.log("[DISCOVERY_JSON_PARSED]", {
        parsedSuccessfully: !!parsed,
        rootKeys: parsed ? Object.keys(parsed) : [],
        rawCandidateCount: candidateStoriesRaw.length
      });

      // If text parsing produced no array and no candidates exist, do not fabricate fake stories
      console.log("[DISCOVERY_CLUSTER_COUNTS]", {
        totalRawCandidates: candidateStoriesRaw.length,
        extraGroundingChunks: extraGroundingSources.length
      });

      // 2. Process all candidate stories and their sources with multi-lingual timestamp parser
      const breakingList: CandidateStory[] = [];
      const trendingList: CandidateStory[] = [];
      const ordinaryList: CandidateStory[] = [];

      let totalSourcesCount = 0;
      let validFreshSourcesCount = 0;

      for (let i = 0; i < candidateStoriesRaw.length; i++) {
        const rawStory = candidateStoriesRaw[i];
        const title = rawStory.title || rawStory.eventTitle || rawStory.event_title || rawStory.headline || `${categoryNepali} ताजा घटनाक्रम`;
        const candidateStoryId = rawStory.storyId || rawStory.story_id || `candidate_${categorySlug}_${i + 1}_${Date.now()}`;
        const publisherName = rawStory.publisher || rawStory.source || "Gorkhapatra";
        
        let rawSourcesList: any[] = [];
        if (Array.isArray(rawStory.sources) && rawStory.sources.length > 0) {
          rawSourcesList = rawStory.sources;
        } else if (rawStory.url || rawStory.link || rawStory.source_url) {
          rawSourcesList = [{
            url: rawStory.url || rawStory.link || rawStory.source_url,
            title: title,
            publisher: publisherName,
            publishedAt: rawStory.published_at || rawStory.publishedAt || rawStory.date || "",
            snippet: rawStory.snippet || rawStory.summary || ""
          }];
        } else if (extraGroundingSources.length > 0) {
          rawSourcesList = extraGroundingSources;
        } else {
          // Reject candidate: No verifiable sources
          console.warn(`[CategoryDiscovery] Candidate '${title}' rejected: REJECT_NO_VERIFIABLE_PUBLISH_DATE`);
          continue;
        }

        const candidateSources: CandidateSource[] = [];
        for (const s of rawSourcesList) {
          totalSourcesCount++;
          const cleanUrl = this.sanitizeUrl(s.url, categorySlug, s.publisher || "Gorkhapatra");
          const rawPubDate = s.published_at || s.publishedAt || s.date || rawStory.published_at || rawStory.publishedAt || "";
          const parsedTime = parseNewsTimestamp(rawPubDate);
          const tier = this.resolveSourceTier(cleanUrl || s.publisher);
          const authScore = tier === 1 ? 95 : tier === 2 ? 88 : tier === 3 ? 82 : 65;

          if (parsedTime.isParsedSuccessfully && (parsedTime.freshnessStatus === 'FRESH' || parsedTime.freshnessStatus === 'SEMI_FRESH') && parsedTime.ageHours <= 72) {
            validFreshSourcesCount++;
          }

          candidateSources.push({
            url: cleanUrl,
            title: s.title || title,
            publisher: s.publisher || "Verified Media",
            publishedAt: parsedTime.isoString || "",
            snippet: s.snippet || "",
            parsedTimestamp: parsedTime,
            sourceTier: tier,
            authorityScore: authScore
          });
        }

        // Strict: Filter fresh sources for the editorial candidate (must have verifiable date and be <= 72 hours)
        const freshSourcesForStory = candidateSources.filter(
          cs => cs.parsedTimestamp.isParsedSuccessfully && 
                (cs.parsedTimestamp.freshnessStatus === 'FRESH' || cs.parsedTimestamp.freshnessStatus === 'SEMI_FRESH') &&
                cs.parsedTimestamp.ageHours <= 72 &&
                !!cs.publishedAt
        );

        if (freshSourcesForStory.length === 0) {
          console.warn(`[CategoryDiscovery] Candidate '${title}' rejected: No fresh sources within 72h window (REJECT_NO_VERIFIABLE_PUBLISH_DATE / STALE_SOURCE_72H)`);
          continue;
        }

        const avgAge = freshSourcesForStory.reduce((acc, s) => acc + s.parsedTimestamp.ageHours, 0) / freshSourcesForStory.length;
        const avgFreshness = Math.round(freshSourcesForStory.reduce((acc, s) => acc + s.parsedTimestamp.freshnessScore, 0) / freshSourcesForStory.length);
        const avgAuth = Math.round(freshSourcesForStory.reduce((acc, s) => acc + s.authorityScore, 0) / freshSourcesForStory.length);

        const primary = freshSourcesForStory[0];
        const corroborating = freshSourcesForStory.slice(1);
        const officials = freshSourcesForStory.filter(s => s.sourceTier === 1);

        const refDateAD = primary.publishedAt;
        if (!refDateAD) {
          console.warn(`[CategoryDiscovery] Candidate '${title}' rejected: primary source lacks authoritative publishedAt`);
          continue;
        }

        const normalizedBrief: NewsroomBrief = {
          eventTitle: title,
          storyType: avgAge <= 6 ? "Breaking News" : rawStory.storyType === "Analysis" ? "Analysis" : "District News",
          importance: rawStory.importance || "National",
          province: rawStory.province || "बागमती",
          district: rawStory.district || "काठमाडौँ",
          locationDetails: rawStory.locationDetails || "काठमाडौँ",
          eventDateBS: rawStory.eventDateBS || `${currentBSYear}`,
          eventDateAD: refDateAD,
          facts: Array.isArray(rawStory.facts) && rawStory.facts.length > 0
            ? rawStory.facts
            : [
                `${title} सम्बन्धमा आवश्यक प्रक्रिया अघि बढेको छ।`,
                `सम्बन्धित निकायद्वारा थप विवरण र कार्यान्वयन कार्ययोजना तयार पारिँदै छ।`,
                `सरोकारवालाहरूले यस विकासक्रमलाई नजिकबाट नियालिरहेका छन्।`
              ],
          namedEntities: rawStory.namedEntities || {
            people: [],
            organizations: ["सम्बन्धित मन्त्रालय", "नेपाल सरकार"],
            locations: ["काठमाडौँ"],
            dates: [refDateAD],
            billsOrPolicies: []
          },
          entities: Array.isArray(rawStory.entities) ? rawStory.entities : ["नेपाल"],
          sources: freshSourcesForStory.map(s => ({
            url: s.url,
            title: s.title,
            publisher: s.publisher,
            publishedAt: s.publishedAt,
            snippet: s.snippet
          })),
          impactAreas: Array.isArray(rawStory.impactAreas) ? rawStory.impactAreas : [categoryNepali],
          researchStatus: freshSourcesForStory.length >= 2 ? "grounded" : "partial"
        };

        const rawType = String(rawStory.storyType || "").toLowerCase();
        const determinedType = rawType.includes("breaking") || avgAge <= 6 
          ? 'breaking' 
          : rawType.includes("trending") || avgAge <= 16 
          ? 'trending' 
          : 'ordinary';

        const preGenManifest = TemporalKnowledgeOS.getPreGenerationFactManifest(refDateAD);

        normalizedBrief.preGenerationFactManifest = preGenManifest;

        const storyObj: CandidateStory = {
          clusterId: `cluster_${categorySlug}_${i}_${Date.now()}`,
          storyId: candidateStoryId,
          storyTitle: title,
          storyType: determinedType,
          priorityScore: determinedType === 'breaking' ? 100 : determinedType === 'trending' ? 80 : 60,
          category: categorySlug,
          categoryNepali,
          primarySource: primary,
          corroboratingSources: corroborating,
          allSources: freshSourcesForStory,
          officialSources: officials,
          freshnessScore: avgFreshness,
          authorityScore: avgAuth,
          averageAgeHours: avgAge,
          brief: normalizedBrief,
          discoveredAt: new Date().toISOString(),
          discoveryTimestamp: new Date().toISOString(),
          publishedAt: refDateAD,
          primaryPublisher: publisherName,
          facts: normalizedBrief.facts,
          district: rawStory.district || normalizedBrief.district || "काठमाडौँ",
          preGenerationFactManifest: preGenManifest
        };

        // RUN TEMPORAL FACT AUDITOR IMMEDIATELY AFTER NORMALIZATION
        const auditResult = TemporalFactAuditor.auditArticle(storyObj.brief, refDateAD);
        if (auditResult.status === "FAILED") {
          storyObj.temporalAuditStatus = "TEMPORAL_CONFLICT";
          storyObj.temporalAuditDetails = auditResult;
          console.warn(`[CategoryDiscovery] Candidate '${storyObj.storyTitle}' flagged TEMPORAL_CONFLICT:`, auditResult.reason || auditResult.conflicts);
        } else {
          storyObj.temporalAuditStatus = "VERIFIED";
          storyObj.temporalAuditDetails = auditResult;
        }

        if (storyObj.storyType === 'breaking') {
          breakingList.push(storyObj);
        } else if (storyObj.storyType === 'trending') {
          trendingList.push(storyObj);
        } else {
          ordinaryList.push(storyObj);
        }
      }

      console.log("[DISCOVERY_CANDIDATE_NORMALIZATION]", {
        candidatesDiscovered: totalSourcesCount,
        validFreshSources: validFreshSourcesCount,
        breakingClusters: breakingList.length,
        trendingClusters: trendingList.length,
        ordinaryClusters: ordinaryList.length
      });

      if (breakingList[0] || trendingList[0] || ordinaryList[0]) {
        const sampleSource = (breakingList[0] || trendingList[0] || ordinaryList[0])?.primarySource;
        console.log("[DISCOVERY_TIMESTAMP_RESOLUTION]", {
          rawPublishedAt: sampleSource?.parsedTimestamp?.originalInput,
          resolvedIso: sampleSource?.parsedTimestamp?.isoString,
          freshnessStatus: sampleSource?.parsedTimestamp?.freshnessStatus,
          freshnessScore: sampleSource?.parsedTimestamp?.freshnessScore,
          parseMethod: sampleSource?.parsedTimestamp?.parseMethod
        });
      }

      console.log("[DISCOVERY_FRESHNESS_GATE]", {
        totalDiscovered: totalSourcesCount,
        freshnessPassed: validFreshSourcesCount,
        clustersPassed: breakingList.length + trendingList.length + ordinaryList.length
      });

      console.log("[DISCOVERY_VERIFICATION_GATE]", {
        breakingCount: breakingList.length,
        trendingCount: trendingList.length,
        ordinaryCount: ordinaryList.length
      });

      // 3. Recommended Editorial Hierarchy Decision Engine
      // ONLY VERIFIED candidates may enter automatic candidate selection
      const verifiedBreaking = breakingList.filter(c => c.temporalAuditStatus === "VERIFIED");
      const verifiedTrending = trendingList.filter(c => c.temporalAuditStatus === "VERIFIED");
      const verifiedOrdinary = ordinaryList.filter(c => c.temporalAuditStatus === "VERIFIED");

      const totalCandidatesFound = breakingList.length + trendingList.length + ordinaryList.length;
      const totalTemporalVerified = verifiedBreaking.length + verifiedTrending.length + verifiedOrdinary.length;
      const totalTemporalConflicts = totalCandidatesFound - totalTemporalVerified;

      const telemetry: DiscoveryTelemetry = {
        modelResponses: response?.candidates?.length || 1,
        rawStoriesDiscovered: candidateStoriesRaw.length,
        normalizedStories: totalCandidatesFound,
        temporalVerified: totalTemporalVerified,
        temporalConflicts: totalTemporalConflicts,
        rejectedInvalid: Math.max(0, candidateStoriesRaw.length - totalCandidatesFound),
        editorialCandidates: totalTemporalVerified
      };

      console.log("[DISCOVERY_TELEMETRY]", JSON.stringify(telemetry));

      let selected: CandidateStory | null = null;

      if (searchMode === 'breaking') {
        selected = verifiedBreaking[0] || verifiedTrending[0] || verifiedOrdinary[0] || null;
      } else if (searchMode === 'trending') {
        selected = verifiedTrending[0] || verifiedBreaking[0] || verifiedOrdinary[0] || null;
      } else {
        selected = verifiedBreaking[0] || verifiedTrending[0] || verifiedOrdinary[0] || null;
      }

      if (selected || totalCandidatesFound > 0) {
        if (selected && onProgress) {
          const typeName = selected.storyType === 'breaking' ? 'ताजा ब्रेकिङ' : selected.storyType === 'trending' ? 'ट्रेन्डिङ' : 'दैनिक प्रमाणित';
          onProgress(`✓ [${typeName}] ${selected.storyTitle} छनोट भयो (${selected.allSources.length} प्रमाणित स्रोतहरू)`);
        }

        return {
          category: categorySlug,
          categoryNepali,
          status: 'SUCCESS',
          totalCandidateSourcesDiscovered: Math.max(totalSourcesCount, extraGroundingSources.length),
          validFreshSourcesCount: Math.max(validFreshSourcesCount, selected?.allSources.length || 0),
          breakingStories: breakingList,
          trendingStories: trendingList,
          ordinaryStories: ordinaryList,
          selectedStory: selected,
          telemetry
        };
      }

      // Fallback: Genuine zero-result condition
      return {
        category: categorySlug,
        categoryNepali,
        status: 'NO_QUALIFYING_STORIES',
        statusMessageNe: "यस विधामा हाल कुनै नयाँ प्रमाणित समाचार फेला परेन।",
        totalCandidateSourcesDiscovered: totalSourcesCount,
        validFreshSourcesCount: 0,
        breakingStories: [],
        trendingStories: [],
        ordinaryStories: [],
        selectedStory: null,
        rejectionReason: "NO_FRESH_STORY_AVAILABLE",
        telemetry
      };
    } catch (e: any) {
      console.error("[CategoryStoryDiscoveryEngine] Discovery error:", e);
      
      let status: DiscoveryResultStatus = 'DISCOVERY_API_INVALID_RESPONSE';
      let statusMessageNe = "AI सर्भरबाट अमान्य प्रतिक्रिया प्राप्त भयो।";

      const errMsg = e?.message || "";
      if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
        status = 'AI_QUOTA_EXHAUSTED';
        statusMessageNe = "AI समाचार खोज सेवा अहिले quota limit मा पुगेको छ। कृपया केही मिनेटपछि पुनः प्रयास गर्नुहोस्।";
      } else if (errMsg.includes("JSON") || errMsg.includes("SyntaxError") || errMsg.includes("parse")) {
        status = 'DISCOVERY_SCHEMA_ERROR';
        statusMessageNe = "समाचार संरचना पार्स गर्दा प्राविधिक त्रुटि भयो।";
      } else if (errMsg.includes("network") || errMsg.includes("fetch") || errMsg.includes("Failed to fetch")) {
        status = 'DISCOVERY_NETWORK_ERROR';
        statusMessageNe = "नेटवर्क सम्पर्कमा समस्या आयो। कृपया इन्टरनेट जडान जाँच गर्नुहोस्।";
      }

      return {
        category: categorySlug,
        categoryNepali,
        status,
        statusMessageNe,
        totalCandidateSourcesDiscovered: 0,
        validFreshSourcesCount: 0,
        breakingStories: [],
        trendingStories: [],
        ordinaryStories: [],
        selectedStory: null,
        rejectionReason: errMsg || "DISCOVERY_EXCEPTION",
        telemetry: {
          modelResponses: 0,
          rawStoriesDiscovered: 0,
          normalizedStories: 0,
          temporalVerified: 0,
          temporalConflicts: 0,
          rejectedInvalid: 0,
          editorialCandidates: 0
        }
      };
    }
  }
};
