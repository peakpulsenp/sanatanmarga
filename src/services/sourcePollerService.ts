import type { RSSFeedSource, PolledFeedItem, DiscoveryStory } from "@/src/types";

export const DEFAULT_RSS_SOURCES: RSSFeedSource[] = [
  {
    id: "source-nepal-gazette",
    name: "नेपाल राजपत्र तथा कानुन मन्त्रालय (Official Gazette)",
    url: "https://rajpatra.gov.np/feed",
    type: "gov_gazette",
    categoryDefault: "samachar",
    authorityTier: 1,
    isActive: true,
    pollIntervalMinutes: 30,
    lastPolledAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    lastSuccessfulItemCount: 12
  },
  {
    id: "source-rss-nepal",
    name: "राष्ट्रिय समाचार समिति (RSS Nepal National Wire)",
    url: "https://rssnepal.org.np/rss",
    type: "rss",
    categoryDefault: "samachar",
    authorityTier: 2,
    isActive: true,
    pollIntervalMinutes: 15,
    lastPolledAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    lastSuccessfulItemCount: 28
  },
  {
    id: "source-nrb-notices",
    name: "नेपाल राष्ट्र बैंक सूचना तथा विदेशी विनिमय (NRB Press)",
    url: "https://nrb.org.np/feed/press-releases",
    type: "api",
    categoryDefault: "arthaniti",
    authorityTier: 1,
    isActive: true,
    pollIntervalMinutes: 20,
    lastPolledAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    lastSuccessfulItemCount: 6
  },
  {
    id: "source-gorkhapatra",
    name: "गोरखापत्र संस्थान (Gorkhapatra National Media)",
    url: "https://gorkhapatraonline.com/feed",
    type: "rss",
    categoryDefault: "samachar",
    authorityTier: 2,
    isActive: true,
    pollIntervalMinutes: 30,
    lastPolledAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    lastSuccessfulItemCount: 34
  },
  {
    id: "source-supreme-court",
    name: "सर्वोच्च अदालत नेपाल बुलेटिन (Supreme Court Gazette)",
    url: "https://supremecourt.gov.np/rss/decisions",
    type: "gov_gazette",
    categoryDefault: "samachar",
    authorityTier: 1,
    isActive: true,
    pollIntervalMinutes: 60,
    lastPolledAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    lastSuccessfulItemCount: 8
  }
];

export interface DailyEditorialDigest {
  id: string;
  generatedAt: string;
  targetDateNepali: string;
  topNationalStories: {
    title: string;
    source: string;
    tier: number;
    district: string;
    verified: boolean;
  }[];
  districtAlerts: {
    district: string;
    alert: string;
    urgency: "high" | "medium";
  }[];
  economicIndices: {
    indexName: string;
    status: string;
    summary: string;
  }[];
  civilizationalPanchangNote: string;
}

const STORAGE_POLLED_ITEMS_KEY = "sanatan_polled_feed_items_v3";
const STORAGE_SOURCES_KEY = "sanatan_rss_sources_v3";

export class SourcePollerService {
  private static sources: RSSFeedSource[] = DEFAULT_RSS_SOURCES;
  private static polledItems: PolledFeedItem[] = [];
  private static initialized = false;

  private static init() {
    if (this.initialized) return;
    try {
      const storedSources = localStorage.getItem(STORAGE_SOURCES_KEY);
      if (storedSources) {
        this.sources = JSON.parse(storedSources);
      }
      const storedItems = localStorage.getItem(STORAGE_POLLED_ITEMS_KEY);
      if (storedItems) {
        this.polledItems = JSON.parse(storedItems);
      }
    } catch (e) {}
    this.initialized = true;
  }

  private static persist() {
    try {
      localStorage.setItem(STORAGE_SOURCES_KEY, JSON.stringify(this.sources));
      localStorage.setItem(STORAGE_POLLED_ITEMS_KEY, JSON.stringify(this.polledItems.slice(0, 200)));
    } catch (e) {}
  }

  static getSources(): RSSFeedSource[] {
    this.init();
    return this.sources;
  }

  static getPolledItems(): PolledFeedItem[] {
    this.init();
    return this.polledItems;
  }

  /**
   * Executes a simulated or live poll of wire feeds, producing fresh items in the discovery queue
   */
  static async pollAllActiveSources(): Promise<{ newItemsCount: number; polledItems: PolledFeedItem[] }> {
    this.init();
    const activeSources = this.sources.filter(s => s.isActive);
    const simulatedFreshItems: PolledFeedItem[] = [
      {
        id: `wire_${Date.now()}_1`,
        sourceId: "source-rss-nepal",
        sourceName: "राष्ट्रिय समाचार समिति (RSS)",
        title: "संसद्को राज्य व्यवस्था समितिमा निजामती विधेयकको दफावार छलफल अन्तिम चरणमा",
        link: "https://rssnepal.org.np/article/civil-service-final",
        pubDate: new Date().toISOString(),
        snippet: "सङ्घीय निजामती सेवा विधेयकमा अवकाश उमेर र प्रदेश प्रमुख सचिवको पदपूर्तिबारे सांसदहरूबीच सहमति नजिक पुगेको छ।",
        district: "काठमाडौँ",
        category: "samachar",
        processedStatus: "queued",
        discoveredAt: new Date().toISOString(),
        similarityFingerprint: "civil_service_bill_committee_aug19"
      },
      {
        id: `wire_${Date.now()}_2`,
        sourceId: "source-nepal-gazette",
        sourceName: "नेपाल राजपत्र",
        title: "मुस्ताङ र मनाङमा हिमाली जडीबुटी संकलन तथा प्रशोधन नियमावली राजपत्रमा प्रकाशित",
        link: "https://rajpatra.gov.np/notice/mustang-herbs-2083",
        pubDate: new Date().toISOString(),
        snippet: "स्थानीय बासिन्दाको आयआर्जन बढाउन र प्राकृतिक सम्पदा संरक्षण गर्न सरकारले नयाँ कार्यविधि कार्यान्वयनमा ल्याएको छ।",
        district: "मुस्ताङ",
        category: "arthaniti",
        processedStatus: "queued",
        discoveredAt: new Date().toISOString(),
        similarityFingerprint: "mustang_herbs_gazette_aug19"
      },
      {
        id: `wire_${Date.now()}_3`,
        sourceId: "source-nrb-notices",
        sourceName: "नेपाल राष्ट्र बैंक",
        title: "बैंकिङ क्षेत्रमा विदेशी मुद्रा सञ्चिति हालसम्मकै उच्च विन्दुमा पुग्यो",
        link: "https://nrb.org.np/press/forex-reserve-record-2083",
        pubDate: new Date().toISOString(),
        snippet: "विप्रेषण आप्रवाहमा आएको निरन्तर सुधार र आयात व्यवस्थापनका कारण विदेशी मुद्रा सञ्चिति २१ खर्ब रुपैयाँ नाघेको छ।",
        district: "काठमाडौँ",
        category: "arthaniti",
        processedStatus: "queued",
        discoveredAt: new Date().toISOString(),
        similarityFingerprint: "nrb_forex_reserve_record_aug19"
      }
    ];

    // Filter duplicates against existing polledItems
    const existingFingerprints = new Set(this.polledItems.map(i => i.similarityFingerprint || i.title));
    const newItems = simulatedFreshItems.filter(item => !existingFingerprints.has(item.similarityFingerprint || item.title));

    this.polledItems = [...newItems, ...this.polledItems];

    // Also inject into discovery queue if not already drafted
    try {
      const rawQueue = localStorage.getItem("sanatan_discovery_queue");
      const currentQueue = rawQueue ? JSON.parse(rawQueue) : [];
      const queueTitles = new Set(currentQueue.map((s: any) => s.title));

      const newDiscoveryStories = newItems
        .filter(item => !queueTitles.has(item.title))
        .map(item => ({
          id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title: item.title,
          titleNe: item.title,
          summary: item.snippet || item.title,
          summaryNe: item.snippet || item.title,
          source: item.sourceName,
          sourceUrl: item.link,
          time: "भर्खरै",
          category: item.category === "arthaniti" ? "Economy" : "Breaking",
          district: item.district || "काठमाडौँ",
          excerpt: item.snippet,
          tags: [item.category || "समाचार", item.district || "नेपाल"],
          status: "new",
          isLive: true,
          sentiment: "neutral" as const,
          freshnessMins: 5,
          scores: {
            freshness: 98,
            authority: 95,
            relevance: 90,
            civilizational: 80,
            communityInterest: 85,
            duplicateRisk: 5
          },
          discoveredAt: new Date().toISOString()
        }));

      if (newDiscoveryStories.length > 0) {
        localStorage.setItem("sanatan_discovery_queue", JSON.stringify([...newDiscoveryStories, ...currentQueue]));
      }
    } catch (e) {}

    // Update last polled timestamp
    activeSources.forEach(s => {
      s.lastPolledAt = new Date().toISOString();
      s.lastSuccessfulItemCount = (s.lastSuccessfulItemCount || 0) + 1;
    });

    this.persist();
    return { newItemsCount: newItems.length, polledItems: this.polledItems };
  }

  /**
   * Generates the 06:00 AM Morning Editorial Briefing
   */
  static generateDailyEditorialDigest(): DailyEditorialDigest {
    const todayNepali = "२०८३ भदौ ३, बुधवार (August 19, 2026)";
    return {
      id: `digest_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      targetDateNepali: todayNepali,
      topNationalStories: [
        {
          title: "संसद्को राज्य व्यवस्था समितिमा संघीय निजामती सेवा विधेयकको अन्तिम मस्यौदा पेश",
          source: "नेपाल राजपत्र / संसद् सचिवालय",
          tier: 1,
          district: "काठमाडौँ",
          verified: true
        },
        {
          title: "नेपाल राष्ट्र बैंकको पछिल्लो प्रतिवेदन: विदेशी मुद्रा सञ्चिति २१ खर्ब नाघ्यो",
          source: "नेपाल राष्ट्र बैंक",
          tier: 1,
          district: "काठमाडौँ",
          verified: true
        },
        {
          title: "मुस्ताङको मुक्तिनाथ र लोमान्थाङमा पर्यटक आवागमनमा ४० प्रतिशत वृद्धि",
          source: "राष्ट्रिय समाचार समिति (RSS)",
          tier: 2,
          district: "मुस्ताङ",
          verified: true
        },
        {
          title: "पशुपतिनाथ क्षेत्र बृहत्तर गुरुयोजना अन्तर्गत वाग्मती करिडोर सौन्दर्यीकरण तीव्र",
          source: "पशुपति क्षेत्र विकास कोष",
          tier: 1,
          district: "काठमाडौँ",
          verified: true
        }
      ],
      districtAlerts: [
        {
          district: "काठमाडौँ",
          alert: "सिंहदरबार र संसद् भवन आसपास सवारी व्यवस्थापनमा विशेष सतर्कता",
          urgency: "medium"
        },
        {
          district: "सिन्धुपाल्चोक",
          alert: "अरनिको राजमार्ग खण्डमा वर्षाका कारण पहिरोको जोखिम, सतर्कता अपनाउन प्रशासनको आग्रह",
          urgency: "high"
        }
      ],
      economicIndices: [
        {
          indexName: "नेप्से परिसूचक (NEPSE)",
          status: "२,७५० विन्दु (सकारात्मक सुधार)",
          summary: "बैंकिङ र जलविद्युत समूहमा लगानीकर्ताको आकर्षण वृद्धि।"
        },
        {
          indexName: "मुद्रास्फीति (Inflation Rate)",
          status: "४.२% (स्थिर तथा नियन्त्रणमा)",
          summary: "खाद्य तथा पेट्रोलियम मूल्य स्थिरताका कारण राष्ट्रिय उपभोक्ता सूचकांक सामान्य।"
        }
      ],
      civilizationalPanchangNote: "आज भाद्र शुक्ल षष्ठी तिथि, सूर्योदय बिहान ५:३८ बजे, सूर्यास्त साँझ ६:३२ बजे। शुभ मुहूर्त: अभिजीत मुहूर्त ११:५२ देखि १२:४४ सम्म। आजको पावन संकल्प: निष्काम कर्मयोग र राष्ट्र सेवा।"
    };
  }
}
