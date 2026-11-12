import { 
  EXPANDED_ARCHIVE_RECORDS, 
  EXPANDED_TIMELINE_EVENTS, 
  EXPANDED_KNOWLEDGE_ENTITIES 
} from "@/src/data/authoritativeContent";
import { snapshotEngine } from "@/src/services/snapshotEngine";

export interface DiscoveryEntityCard {
  id: string;
  title: string;
  titleEnglish?: string;
  category: "knowledge" | "timeline" | "archives" | "sgis" | "news" | "store" | "academy" | "directory";
  summary: string;
  details?: Record<string, string>;
  image?: string;
  price?: number;
  instructor?: string;
  link: string;
  relatedIds?: string[];
  district?: string;
  province?: string;
}

export interface ConsolidatedDiscoveryResult {
  term: string;
  primaryClusterName?: string;
  primaryClusterDescription?: string;
  cards: DiscoveryEntityCard[];
  connectedCount: number;
}

export const crossEntitySearchEngine = {
  /**
   * Performs high-intent cross-OS civilizational entity search
   */
  async search(term: string): Promise<ConsolidatedDiscoveryResult> {
    const lowerTerm = term.trim().toLowerCase();
    const cards: DiscoveryEntityCard[] = [];

    if (!lowerTerm) {
      return { term, cards: [], connectedCount: 0 };
    }

    // 1. Query Knowledge OS (Nodes & Locations)
    const matchedKnowledge = EXPANDED_KNOWLEDGE_ENTITIES.filter(n => 
      (n.nameNepali || "").toLowerCase().includes(lowerTerm) || 
      (n.nameEnglish || "").toLowerCase().includes(lowerTerm) ||
      (n.category || "").toLowerCase().includes(lowerTerm) ||
      (n.district && n.district.toLowerCase().includes(lowerTerm)) ||
      (n.description || "").toLowerCase().includes(lowerTerm)
    );

    matchedKnowledge.forEach(n => {
      cards.push({
        id: `k-${n.id}`,
        title: n.nameNepali,
        titleEnglish: n.nameEnglish,
        category: "knowledge",
        summary: n.description || "सनातन सभ्यताको एक महत्वपूर्ण ज्ञान तथा सांस्कृतिक नोड।",
        details: {
          "श्रेणी (Category)": n.category || "तीर्थस्थल / सम्पदा",
          "जिल्ला (District)": (n as any).district || "नेपाल",
          "प्रदेश (Province)": (n as any).province || "बागमती"
        },
        link: "/knowledge",
        district: (n as any).district,
        province: (n as any).province
      });
    });

    // 2. Query Timeline OS (Civilizational Events)
    const matchedTimeline = EXPANDED_TIMELINE_EVENTS.filter(t => 
      t.titleNepali.toLowerCase().includes(lowerTerm) || 
      t.titleEnglish.toLowerCase().includes(lowerTerm) ||
      t.category.toLowerCase().includes(lowerTerm) || 
      t.location.toLowerCase().includes(lowerTerm) ||
      t.summaryNepali.toLowerCase().includes(lowerTerm)
    );

    matchedTimeline.forEach(t => {
      cards.push({
        id: `t-${t.id}`,
        title: t.titleNepali,
        titleEnglish: t.titleEnglish,
        category: "timeline",
        summary: t.summaryNepali,
        details: {
          "ऐतिहासिक समय (Era/Year)": `${t.yearBS} बी.एस. (${t.yearAD} AD)`,
          "स्थान (Location)": t.location,
          "सम्बन्धित कालखण्ड": t.category
        },
        link: "/timeline"
      });
    });

    // 3. Query Archives OS (Inscriptions & Epics)
    const matchedArchives = EXPANDED_ARCHIVE_RECORDS.filter(a => 
      a.title.toLowerCase().includes(lowerTerm) || 
      a.titleNepali.toLowerCase().includes(lowerTerm) ||
      a.era.toLowerCase().includes(lowerTerm) || 
      a.category.toLowerCase().includes(lowerTerm) ||
      a.summaryNepali.toLowerCase().includes(lowerTerm)
    );

    matchedArchives.forEach(a => {
      cards.push({
        id: `a-${a.id}`,
        title: a.titleNepali,
        titleEnglish: a.title,
        category: "archives",
        summary: a.summaryNepali,
        details: {
          "कालखण्ड (Era)": a.era,
          "दस्तावेज प्रकार (Type)": a.category,
          "उत्पत्ति वर्ष": `${a.yearBS} बी.एस.`
        },
        link: "/archives"
      });
    });

    // 4. SGIS Manuscript Integration (Saraswati Grantha Intelligence System)
    const sgisManuscripts = [
      { id: "sgis-shivadharma", title: "शिवधर्म शास्त्र (प्राचीन देवनागरी लिपिका ताम्रपत्र)", titleEnglish: "Shivadharma Shastra Epics", lang: "Sanskrit", origin: "Kathmandu Valley", century: "8th Century AD" },
      { id: "sgis-muluki-ain", title: "जङ्गबहादुर राणाको मुलुकी ऐन १९१० मूल प्रति", titleEnglish: "Muluki Ain 1854 Original Manuscript", lang: "Nepali", origin: "Gorkha/Lalitpur Royal Court", century: "19th Century" },
      { id: "sgis-janaki-mahatmya", title: "मिथिला महात्म्य - जानकी जन्म र राजा जनक वृत्तान्त", titleEnglish: "Mithila Mahatmya Manuscript", lang: "Sanskrit / Maithili", origin: "Janakpur Royal Archives", century: "11th Century AD" }
    ].filter(m => m.title.toLowerCase().includes(lowerTerm) || m.titleEnglish.toLowerCase().includes(lowerTerm));

    sgisManuscripts.forEach(m => {
      cards.push({
        id: `sgis-${m.id}`,
        title: m.title,
        titleEnglish: m.titleEnglish,
        category: "sgis",
        summary: `SGIS द्वारा स्क्यान गरिएको र ओसीआर (OCR) मार्फत अनुवाद गरिएको आधिकारिक प्राचीन हस्तलिखित अभिलेख दस्तावेज।`,
        details: {
          "मूल भाषा (Language)": m.lang,
          "शताब्दी / काल": m.century,
          "उत्पत्ति स्थल (Provenance)": m.origin
        },
        link: "/archives"
      });
    });

    // 5. Query News / Media OS
    try {
      const searchItems = await snapshotEngine.getSearchIndexSnapshot();
      const matchedArticles = (searchItems || []).filter((a: any) => 
        (a.title || "").toLowerCase().includes(lowerTerm) || 
        (a.content || "").toLowerCase().includes(lowerTerm)
      );

      matchedArticles.forEach((art: any) => {
        cards.push({
          id: `n-${art.id}`,
          title: art.title,
          category: "news",
          summary: art.excerpt || "सनातन मार्ग मिडिया नेटवर्कको आधिकारिक प्रमाणित समाचार रिपोर्ट।",
          details: {
            "विधा (Category)": art.category || "समाचार",
            "प्रकाशित मिति (Published)": "२०८३ भदौ"
          },
          link: `/article/${art.id}`,
          image: art.featuredImage
        });
      });
    } catch (e) {
      console.warn("Newsroom snapshot query skipped in search:", e);
    }

    // 6. Query Sanatan Store (Ecosystem Commerce Placements)
    const storeProducts = [
      { id: "sp_gita", name: "सचित्र श्रीमद्भगवद्गीता (नेपाली अनुवाद)", nameEnglish: "Bhagavad Gita Illustrated", price: 1250, category: "books", image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80", summary: "नेपाली भाषामा सचित्र र श्लोक-दर-श्लोक विस्तृत अर्थ सहितको ज्ञानप्रदायक भगवद्गीता।" },
      { id: "sp_rudraksha", name: "प्राकृतिक ५ मुखी रुद्राक्ष माला (पंचमुखी)", nameEnglish: "Pashupatinath 5-Mukhi Rudraksha", price: 850, category: "rosary", image: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=400&q=80", summary: "श्री पशुपतिनाथ क्षेत्रमा प्राण-प्रतिष्ठा गरिएको ५ मुखी शुद्ध नेपाली रुद्राक्ष माला।" },
      { id: "sp_mithila", name: "जनकपुर मिथिला हस्तकला तथा राम-जानकी चित्र", nameEnglish: "Janakpur Mithila Art (Mithila Kingdom)", price: 1800, category: "art", image: "https://images.unsplash.com/photo-1590001155093-a3c68ab0ac67?auto=format&fit=crop&w=400&q=80", summary: "जनकपुरका स्थानीय महिला कलाकारहरूद्वारा तयार पारिएको मौलिक मिथिला हस्तकला।" }
    ].filter(p => p.name.toLowerCase().includes(lowerTerm) || p.nameEnglish.toLowerCase().includes(lowerTerm));

    storeProducts.forEach(p => {
      cards.push({
        id: `store-${p.id}`,
        title: p.name,
        titleEnglish: p.nameEnglish,
        category: "store",
        summary: p.summary,
        price: p.price,
        image: p.image,
        link: "/store"
      });
    });

    // 7. Query Sanatan Academy (Educational Courses & Syllabuses)
    const academyCourses = [
      { id: "gita-intro", title: "श्रीमद्भगवद्गीता परिचय र जीवन दर्शन", titleEnglish: "Bhagavad Gita Philosophy & Ethics", instructor: "डा. स्वामी रामानन्द", summary: "दैनिक जीवनमा गीता दर्शन र मानसिक सन्तुलनको व्यवहारिक प्रयोग सिकाउने आधिकारिक पाठ्य-कोर्स।" },
      { id: "vedic-civilization", title: "वैदिक सभ्यता र नेपालको सांस्कृतिक इतिहास", titleEnglish: "Vedic Civilization & Pashupatinath History", instructor: "प्रा.डा. दिनेशराज पन्त", summary: "नेपालका प्राचीन तीर्थस्थलहरू, ऋषिमुनिहरू र वैदिक परम्पराबारे प्रामाणिक इतिहास अनुसन्धान।" },
      { id: "mithila-heritage", title: "जनकपुरधाम र मिथिला संस्कृति अध्ययन", titleEnglish: "Janakpur & Mithila Civilizational Heritage", instructor: "डा. रामानन्द साह", summary: "मैथिली भाषा, रामायण इतिहास र जानकी मन्दिरको सांस्कृतिक महत्वबारे विश्वविद्यालय स्तरको व्याख्यान।" }
    ].filter(c => c.title.toLowerCase().includes(lowerTerm) || c.titleEnglish.toLowerCase().includes(lowerTerm));

    academyCourses.forEach(c => {
      cards.push({
        id: `academy-${c.id}`,
        title: c.title,
        titleEnglish: c.titleEnglish,
        category: "academy",
        summary: c.summary,
        instructor: c.instructor,
        link: "/academy"
      });
    });

    // Determine descriptive primary clusters for key civilizational nodes
    let primaryClusterName = "";
    let primaryClusterDescription = "";

    if (lowerTerm.includes("pashupati") || lowerTerm.includes("shiva") || lowerTerm.includes("rudraksha")) {
      primaryClusterName = "श्री पशुपतिनाथ क्षेत्र तथा शैव दर्शन (Shaiva Legacy)";
      primaryClusterDescription = "काठमाडौँको वाग्मती तटमा अवस्थित शैव परम्पराको सर्वोच्च तीर्थस्थल, यससँग सम्बन्धित इतिहास, समयरेखा, पुरातात्विक अभिलेख, र अध्ययन सामग्रीहरूको एकीकृत सङ्ग्रह।";
    } else if (lowerTerm.includes("janaki") || lowerTerm.includes("janakpur") || lowerTerm.includes("mithila") || lowerTerm.includes("ram")) {
      primaryClusterName = "मिथिला सांस्कृतिक साम्राज्य तथा जानकी क्षेत्र (Mithila Legacy)";
      primaryClusterDescription = "माता जानकीको जन्मभूमि जनकपुरधाम, प्राचीन वैदेही साम्राज्य, रामायण इतिहास, र जीवन्त मिथिला हस्तकला तथा प्राज्ञिक अनुसन्धान श्रृंखलाको एकीकृत सङ्ग्रह।";
    } else if (lowerTerm.includes("gita") || lowerTerm.includes("krishna") || lowerTerm.includes("vedic")) {
      primaryClusterName = "वैदिक ज्ञान, गीता दर्शन र शैक्षिक पाठ्यक्रम (Vedic Wisdom)";
      primaryClusterDescription = "श्रीमद्भगवद्गीता र उपनिषद्को दार्शनिक आधार, सनातन अकाडेमीका स्तरीय कोर्ष र वैदिक सभ्यताको प्रामाणिक इतिहास।";
    }

    return {
      term,
      primaryClusterName: primaryClusterName || undefined,
      primaryClusterDescription: primaryClusterDescription || undefined,
      cards,
      connectedCount: cards.length
    };
  }
};
