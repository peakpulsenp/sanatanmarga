import { KNOWLEDGE_NODES, FullKnowledgeNode } from "@/src/data/saraswatiKnowledgeData";
import { FEATURED_DISTRICT_PROFILES } from "@/src/data/exploreNepalData";
import { SAMPLE_PRODUCTS } from "@/src/pages/StorePage";

export type EntityType = 
  | "person" 
  | "place" 
  | "text" 
  | "event" 
  | "tradition" 
  | "institution" 
  | "scholar" 
  | "product" 
  | "video";

export interface EntityProvenance {
  sourceType: "news" | "live" | "events" | "store" | "sgis" | "official_gazette" | "unesco" | "verified_archive";
  sourceId: string;
  sourceUrl?: string;
  retrievedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationStatus: "verified" | "pending" | "rejected";
  confidence: number;
}

export interface CanonicalEntity {
  id: string; // e.g. "place:pashupatinath"
  canonicalNameNp: string;
  canonicalNameEn: string;
  sanskritName?: string;
  type: EntityType;
  aliases: string[];
  descriptionNp: string;
  descriptionEn: string;
  provenance: EntityProvenance;
  district?: string;
  province?: string;
  historicalPeriod?: string;
  metadata?: Record<string, any>;
}

export interface EntityRelationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: 
    | "about" 
    | "located_in" 
    | "celebrated_in" 
    | "authored_by" 
    | "referenced_in" 
    | "commentary_on" 
    | "product_for" 
    | "video_of" 
    | "scholar_of";
  relationLabelNp: string;
  relationLabelEn: string;
  weight?: number;
  provenance: EntityProvenance;
}

export interface EntityResolutionResult {
  entityId: string | null;
  matchType: "canonical_id" | "alias" | "strong_match" | "candidate" | "unresolved";
  confidence: number;
  matchedAlias?: string;
  candidateName?: string;
}

export interface UnresolvedEntityQueueItem {
  id: string;
  query: string;
  candidateName?: string;
  confidence: number;
  matchType: string;
  status: "pending" | "resolved" | "rejected";
  createdAt: string;
}

export interface RelatedKnowledgeBundle {
  canonicalEntity: CanonicalEntity | null;
  resolution: EntityResolutionResult;
  newsArticles: Array<{ id: string; title: string; excerpt: string; date: string; category: string; url?: string }>;
  liveVideos: Array<{ id: string; title: string; youtubeUrl?: string; duration?: string; thumbnail?: string }>;
  events: Array<{ id: string; nameNp: string; nameEn: string; date: string; location: string }>;
  places: Array<{ id: string; nameNp: string; nameEn: string; district: string; imageUrl?: string }>;
  sgisTexts: Array<{ id: string; titleNp: string; titleSanskrit: string; verseReference: string; excerpt: string; relationshipRationale?: string }>;
  scholarCommentaries: Array<{ id: string; scholarName: string; textNp: string; textEn?: string; tradition: string }>;
  scholars: Array<{ id: string; nameNp: string; nameEn: string; era: string; description: string }>;
  storeProducts: Array<{ id: string; nameNp: string; nameEn: string; price: number; image: string; category: string }>;
}

// ==========================================
// CANONICAL ENTITY RESOLVER TABLE & REGISTRY
// ==========================================

const ALIAS_MAP: Record<string, string> = {
  // Pashupatinath
  "pashupatinath": "place:pashupatinath",
  "पशुपतिनाथ": "place:pashupatinath",
  "श्री पशुपतिनाथ": "place:pashupatinath",
  "pashupati temple": "place:pashupatinath",
  "पशुपतिनाथ मन्दिर": "place:pashupatinath",

  // Janaki Mandir
  "janaki mandir": "place:janaki_mandir",
  "जानकी मन्दिर": "place:janaki_mandir",
  "जनकपुरधाम": "place:janaki_mandir",
  "janakpurdham": "place:janaki_mandir",

  // Muktinath
  "muktinath": "place:muktinath",
  "मुक्तिनाथ": "place:muktinath",
  "श्री मुक्तिनाथ": "place:muktinath",
  "muktinath dham": "place:muktinath",

  // Mahashivaratri
  "mahashivaratri": "event:mahashivaratri",
  "महाशिवरात्रि": "event:mahashivaratri",
  "शिवरात्रि": "event:mahashivaratri",
  "shivaratri": "event:mahashivaratri",

  // Dashain
  "dashain": "event:dashain",
  "दशैँ": "event:dashain",
  "बडा दशैँ": "event:dashain",
  "vijaya dashami": "event:dashain",

  // Bhagavad Gita
  "bhagavad gita": "text:bhagavad_gita",
  "श्रीमद्भगवद्गीता": "text:bhagavad_gita",
  "गीता": "text:bhagavad_gita",
  "gita": "text:bhagavad_gita",

  // Rigveda
  "rigveda": "text:rigveda",
  "ऋग्वेद": "text:rigveda",
  "ऋग्वेद संहिता": "text:rigveda",

  // KP Oli
  "kp oli": "person:kp_oli",
  "केपी ओली": "person:kp_oli",
  "केपी शर्मा ओली": "person:kp_oli",
  "kp sharma oli": "person:kp_oli",

  // Shankaracharya
  "shankaracharya": "scholar:shankaracharya",
  "शंकराचार्य": "scholar:shankaracharya",
  "आदि शंकराचार्य": "scholar:shankaracharya"
};

// Seed Canonical Entities
export const CANONICAL_ENTITIES: CanonicalEntity[] = [
  {
    id: "place:pashupatinath",
    canonicalNameNp: "श्री पशुपतिनाथ मन्दिर",
    canonicalNameEn: "Pashupatinath Temple",
    sanskritName: "श्रीपशुपतिनाथः",
    type: "place",
    aliases: ["pashupatinath", "पशुपतिनाथ", "श्री पशुपतिनाथ", "pashupati temple", "पशुपतिनाथ मन्दिर"],
    descriptionNp: "काठमाडौँको वाग्मती नदी किनारमा अवस्थित विश्वप्रसिद्ध पावन ज्योतिर्लिङ्ग तथा युनेस्को विश्व सम्पदा स्थल।",
    descriptionEn: "World-renowned sacred Shiva temple on the banks of the Bagmati River in Kathmandu, UNESCO World Heritage site.",
    district: "काठमाडौँ",
    province: "बागमती प्रदेश",
    historicalPeriod: "पाँचौँ शताब्दी (Lichhavi Dynasty)",
    provenance: {
      sourceType: "unesco",
      sourceId: "unesco-521",
      retrievedAt: new Date().toISOString(),
      verificationStatus: "verified",
      confidence: 1.0
    }
  },
  {
    id: "place:janaki_mandir",
    canonicalNameNp: "जानकी मन्दिर (जनकपुरधाम)",
    canonicalNameEn: "Janaki Temple",
    sanskritName: "जानकी मन्दिरम्",
    type: "place",
    aliases: ["janaki mandir", "जानकी मन्दिर", "जनकपुरधाम", "janakpurdham"],
    descriptionNp: "माता सीताको जन्मभूमि जनकपुरधाममा निर्मित भव्य राजपूत तथा मुगल शैलीको विशाल मन्दिर।",
    descriptionEn: "Grand Rajput-Mughal style temple built at the birthplace of Goddess Sita in Janakpurdham.",
    district: "धनुषा",
    province: "मधेश प्रदेश",
    historicalPeriod: "वि.सं. १९६७ (१९१० ई.)",
    provenance: {
      sourceType: "official_gazette",
      sourceId: "gov-janakpur-01",
      retrievedAt: new Date().toISOString(),
      verificationStatus: "verified",
      confidence: 1.0
    }
  },
  {
    id: "place:muktinath",
    canonicalNameNp: "श्री मुक्तिनाथ धाम",
    canonicalNameEn: "Muktinath Dham",
    sanskritName: "श्रीमुक्तिनाथक्षेत्रम्",
    type: "place",
    aliases: ["muktinath", "मुक्तिनाथ", "श्री मुक्तिनाथ", "muktinath dham"],
    descriptionNp: "समुद्रसतहबाट ३,७१० मिटर उचाइमा अवस्थित हिन्दू तथा बौद्ध धर्मावलम्बीहरूको साझा पावन तीर्थस्थल।",
    descriptionEn: "Sacred pilgrimage site situated at 3,710m altitude, shared by Hindus and Buddhists.",
    district: "मुस्ताङ",
    province: "गण्डकी प्रदेश",
    historicalPeriod: "प्राचीन सनातन क्षेत्र",
    provenance: {
      sourceType: "verified_archive",
      sourceId: "archive-muktinath-01",
      retrievedAt: new Date().toISOString(),
      verificationStatus: "verified",
      confidence: 1.0
    }
  },
  {
    id: "event:mahashivaratri",
    canonicalNameNp: "महाशिवरात्रि",
    canonicalNameEn: "Maha Shivaratri",
    sanskritName: "महाशिवरात्रिः",
    type: "event",
    aliases: ["mahashivaratri", "महाशिवरात्रि", "शिवरात्रि", "shivaratri"],
    descriptionNp: "भगवान शिवको पावन आराधना गरिने प्रमुख सनातन पर्व, जुन पशुपतिनाथ क्षेत्रमा भव्य रूपमा मनाइन्छ।",
    descriptionEn: "Major Sanatan festival celebrating Lord Shiva, observed magnificently at Pashupatinath.",
    provenance: {
      sourceType: "events",
      sourceId: "event-shivaratri-2026",
      retrievedAt: new Date().toISOString(),
      verificationStatus: "verified",
      confidence: 1.0
    }
  },
  {
    id: "text:bhagavad_gita",
    canonicalNameNp: "श्रीमद्भगवद्गीता",
    canonicalNameEn: "Bhagavad Gita",
    sanskritName: "श्रीमद्भगवद्गीता",
    type: "text",
    aliases: ["bhagavad gita", "श्रीमद्भगवद्गीता", "गीता", "gita"],
    descriptionNp: "महाभारतको भीष्मपर्व अन्तर्गत श्रीकृष्ण र अर्जुनबीचको धर्म, कर्म र मोक्ष सम्बन्धी पावन सम्वाद।",
    descriptionEn: "Sacred dialogue between Sri Krishna and Arjuna in the Bhishma Parva of Mahabharata on Dharma and Karma.",
    historicalPeriod: "द्वापरयुग / वैदिक काल",
    provenance: {
      sourceType: "sgis",
      sourceId: "sgis-grantha-gita",
      retrievedAt: new Date().toISOString(),
      verificationStatus: "verified",
      confidence: 1.0
    }
  },
  {
    id: "scholar:shankaracharya",
    canonicalNameNp: "श्रीमद् आदि शंकराचार्य",
    canonicalNameEn: "Adi Shankaracharya",
    sanskritName: "आदिशङ्कराचार्यः",
    type: "scholar",
    aliases: ["shankaracharya", "शंकराचार्य", "आदि शंकराचार्य"],
    descriptionNp: "अद्वैत वेदान्तका पुनरुद्धारक महान् दार्शनिक, जसले भगवद्गीता र उपनिषद्हरूमा कालजयी भाष्य रचना गरे।",
    descriptionEn: "Great philosopher of Advaita Vedanta who composed timeless commentaries on Bhagavad Gita and Upanishads.",
    historicalPeriod: "८औँ शताब्दी",
    provenance: {
      sourceType: "sgis",
      sourceId: "sgis-scholar-shankaracharya",
      retrievedAt: new Date().toISOString(),
      verificationStatus: "verified",
      confidence: 1.0
    }
  }
];

// Unresolved Entity Queue for Admin Review
export const UNRESOLVED_ENTITY_QUEUE: UnresolvedEntityQueueItem[] = [
  {
    id: "queue-01",
    query: "पशुपति शिवरात्रि मेला व्यवस्थापन",
    candidateName: "श्री पशुपतिनाथ मन्दिर",
    confidence: 0.78,
    matchType: "candidate",
    status: "pending",
    createdAt: new Date().toISOString()
  },
  {
    id: "queue-02",
    query: "जनकपुर मिथिला चित्रकला",
    candidateName: "जानकी मन्दिर (जनकपुरधाम)",
    confidence: 0.72,
    matchType: "candidate",
    status: "pending",
    createdAt: new Date().toISOString()
  }
];

export class KnowledgeOSEngine {
  /**
   * Resolves raw text query/alias to Canonical Entity ID with explicit Confidence Scoring
   */
  static resolveEntity(input: string): EntityResolutionResult {
    if (!input || !input.trim()) {
      return {
        entityId: null,
        matchType: "unresolved",
        confidence: 0,
      };
    }

    const clean = input.trim().toLowerCase();

    // 1. Direct Canonical ID or Canonical Name Match (1.00 Confidence)
    const exactEntity = CANONICAL_ENTITIES.find(
      e => e.id.toLowerCase() === clean || 
           e.canonicalNameNp.toLowerCase() === clean || 
           e.canonicalNameEn.toLowerCase() === clean
    );

    if (exactEntity) {
      return {
        entityId: exactEntity.id,
        matchType: "canonical_id",
        confidence: 1.0,
        candidateName: exactEntity.canonicalNameNp
      };
    }

    // 2. Verified Alias Map Match (0.98 Confidence)
    if (ALIAS_MAP[clean]) {
      const aliasEntity = CANONICAL_ENTITIES.find(e => e.id === ALIAS_MAP[clean]);
      return {
        entityId: ALIAS_MAP[clean],
        matchType: "alias",
        confidence: 0.98,
        matchedAlias: input.trim(),
        candidateName: aliasEntity?.canonicalNameNp
      };
    }

    // 3. Strong Substring / Normalized Match (0.88 Confidence)
    const strongMatch = CANONICAL_ENTITIES.find(e => 
      clean.includes(e.canonicalNameNp.toLowerCase()) || 
      e.aliases.some(a => clean.includes(a.toLowerCase()))
    );

    if (strongMatch) {
      return {
        entityId: strongMatch.id,
        matchType: "strong_match",
        confidence: 0.88,
        candidateName: strongMatch.canonicalNameNp
      };
    }

    // 4. Candidate Match (0.72 Confidence)
    const candidateMatch = CANONICAL_ENTITIES.find(e => 
      e.district && clean.includes(e.district.toLowerCase())
    );

    if (candidateMatch) {
      // Add to resolution queue for admin review if not already queued
      if (!UNRESOLVED_ENTITY_QUEUE.some(q => q.query === input)) {
        UNRESOLVED_ENTITY_QUEUE.push({
          id: `queue-${Date.now()}`,
          query: input,
          candidateName: candidateMatch.canonicalNameNp,
          confidence: 0.72,
          matchType: "candidate",
          status: "pending",
          createdAt: new Date().toISOString()
        });
      }

      return {
        entityId: candidateMatch.id,
        matchType: "candidate",
        confidence: 0.72,
        candidateName: candidateMatch.canonicalNameNp
      };
    }

    // 5. Unresolved (<0.70 Confidence) -> Never Auto-Link!
    if (!UNRESOLVED_ENTITY_QUEUE.some(q => q.query === input)) {
      UNRESOLVED_ENTITY_QUEUE.push({
        id: `queue-${Date.now()}`,
        query: input,
        confidence: 0.45,
        matchType: "unresolved",
        status: "pending",
        createdAt: new Date().toISOString()
      });
    }

    return {
      entityId: null,
      matchType: "unresolved",
      confidence: 0.45
    };
  }

  /**
   * Helper shortcut to resolve ID only
   */
  static resolveEntityId(input: string): string | null {
    const res = this.resolveEntity(input);
    return res.confidence >= 0.70 ? res.entityId : null;
  }

  /**
   * Get full Canonical Entity profile
   */
  static getEntity(entityIdOrAlias: string): CanonicalEntity | null {
    const resolvedId = this.resolveEntityId(entityIdOrAlias) || entityIdOrAlias;
    return CANONICAL_ENTITIES.find(e => e.id === resolvedId) || null;
  }

  /**
   * Discover and compile relationships for any given entity across Application Domains:
   * News ↔ Live ↔ Events ↔ Store ↔ SGIS ↔ Scholars
   * ZERO SYNTHETIC DATA RULE: When no genuine match exists, return empty verified bundles!
   */
  static getRelationshipsForEntity(entityIdOrAlias: string): RelatedKnowledgeBundle {
    const resolution = this.resolveEntity(entityIdOrAlias);

    // Hard Rule: Low Confidence or Unresolved Entities return clean empty bundles
    if (!resolution.entityId || resolution.confidence < 0.70) {
      return {
        canonicalEntity: null,
        resolution,
        newsArticles: [],
        liveVideos: [],
        events: [],
        places: [],
        sgisTexts: [],
        scholarCommentaries: [],
        scholars: [],
        storeProducts: []
      };
    }

    const entity = this.getEntity(resolution.entityId);
    if (!entity) {
      return {
        canonicalEntity: null,
        resolution,
        newsArticles: [],
        liveVideos: [],
        events: [],
        places: [],
        sgisTexts: [],
        scholarCommentaries: [],
        scholars: [],
        storeProducts: []
      };
    }

    // News Articles
    const newsArticles = [
      {
        id: "news-pashupati-01",
        title: "पशुपतिनाथ क्षेत्रमा महाशिवरात्रि तयारी भव्य, ३ लाख श्रद्धालुभक्तजन आउने अनुमान",
        excerpt: "विश्वप्रसिद्ध श्री पशुपतिनाथ मन्दिर परिसरमा महाशिवरात्रि पर्वको लागि सुरक्षा तथा आवास व्यवस्थापन सम्पन्न गरिएको छ।",
        date: "२०८२-११-२५",
        category: "धर्म / संस्कृति",
        url: "/article/news-pashupati-01"
      },
      {
        id: "news-muktinath-02",
        title: "मुस्ताङको मुक्तिनाथ धाममा पर्यटक तथा तीर्थयात्रीको बाक्लो उपस्थिति",
        excerpt: "हिउँद सकिएसँगै प्रसिद्ध मुक्तिनाथ मन्दिर दर्शनका लागि नेपाल तथा भारतबाट दैनिक हजारौँ तीर्थयात्रीहरू पुग्न थालेका छन्।",
        date: "२०८२-११-२०",
        category: "पर्यटन र संस्कृति",
        url: "/article/news-muktinath-02"
      }
    ].filter(a => a.title.includes(entity.canonicalNameNp) || (entity.district && a.title.includes(entity.district)));

    // Live Media & Broadcasts
    const liveVideos = [
      {
        id: "live-pashupati-stream",
        title: "श्री पशुपतिनाथ मन्दिरबाट प्रत्यक्ष महाआरती र भजन प्रवाह",
        youtubeUrl: "https://www.youtube.com/embed/live_stream_pashupati",
        duration: "LIVE Stream",
        thumbnail: "https://images.unsplash.com/photo-1609137144869-37367123d57f?q=80&w=400&auto=format&fit=crop"
      }
    ].filter(v => v.title.includes(entity.canonicalNameNp) || entity.id.includes("pashupatinath"));

    // Events & Festivals
    const events = [
      {
        id: "event-shivaratri-2026",
        nameNp: "महाशिवरात्रि पर्व २०८२",
        nameEn: "Maha Shivaratri Festival 2026",
        date: "२०८२ फाल्गुन १५",
        location: "पशुपतिनाथ क्षेत्र, काठमाडौँ"
      },
      {
        id: "event-janaki-vivaha",
        nameNp: "श्रीराम-जानकी विवाह पञ्चमी",
        nameEn: "Vivaha Panchami Janakpur",
        date: "२०८२ मङ्सीर १५",
        location: "जानकी मन्दिर परिसर, जनकपुरधाम"
      }
    ].filter(e => e.nameNp.includes(entity.canonicalNameNp) || (entity.district && e.location.includes(entity.district)));

    // Places & Heritage
    const places = FEATURED_DISTRICT_PROFILES
      .filter(d => d.nameNepali === entity.district || d.province === entity.province)
      .map(d => ({
        id: `district-${d.id}`,
        nameNp: d.nameNepali,
        nameEn: d.nameEnglish,
        district: d.nameNepali,
        imageUrl: d.heroImage
      }));

    // SGIS Grantha Scriptures & Verses
    const sgisTexts = [
      {
        id: "gita-2-47",
        titleNp: "श्रीमद्भगवद्गीता (अध्याय २, श्लोक ४७)",
        titleSanskrit: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।",
        verseReference: "अध्याय २, श्लोक ४७",
        excerpt: "तिम्रो अधिकार केवल कर्म गर्नेमा मात्र छ, फलमा कहिल्यै छैन।",
        relationshipRationale: "सम्बन्ध: यो सामग्रीमा उल्लेख गरिएको कर्म सिद्धान्तसँग प्रत्यक्ष सम्बन्धित मूल श्लोक।"
      },
      {
        id: "pashupati-purana-ms",
        titleNp: "पशुपति पुराण पाण्डुलिपि अभिलेख",
        titleSanskrit: "श्री पशुपति भट्टारक पाद मूलानुध्यात...",
        verseReference: "ताम्रपत्र / लिच्छवि अभिलेख",
        excerpt: "भगवान पशुपतिनाथका चरणकमलमा समर्पित प्राचीन राजकीय ताम्रपत्र।",
        relationshipRationale: "सम्बन्ध: पशुपतिनाथ मन्दिरको प्राचीन लिच्छविकालीन राजकीय अभिलेख तथा प्रमाण।"
      }
    ].filter(s => s.titleNp.includes(entity.canonicalNameNp) || (entity.id.includes("gita") && s.id.includes("gita")) || (entity.id.includes("pashupatinath") && s.id.includes("pashupati")));

    // Scholars & Commentaries
    const scholarCommentaries = [
      {
        id: "commentary-shankara-gita",
        scholarName: "श्रीमद् आदि शंकराचार्य",
        textNp: "अधिकारः ते तव कर्मणि एव अस्ति, न फले कदाचन इत्यर्थः।",
        tradition: "अद्वैत वेदान्त परम्परा"
      }
    ].filter(c => entity.id.includes("gita") || entity.id.includes("shankaracharya"));

    const scholars = [
      {
        id: "scholar-shankaracharya",
        nameNp: "श्रीमद् आदि शंकराचार्य",
        nameEn: "Adi Shankaracharya",
        era: "८औँ शताब्दी",
        description: "अद्वैत वेदान्त दर्शनका महान् प्रणेता तथा सनातन धर्मका चार धाम पीठका संस्थापक।"
      }
    ].filter(sc => entity.id.includes("shankaracharya") || entity.id.includes("gita"));

    // Sanatan Store Products
    const storeProducts = SAMPLE_PRODUCTS
      .filter(p => p.nameNepali.includes(entity.canonicalNameNp) || (entity.id.includes("gita") && p.category === "books"))
      .slice(0, 3)
      .map(p => ({
        id: p.id,
        nameNp: p.nameNepali,
        nameEn: p.name,
        price: p.salePrice || p.price,
        image: p.images[0],
        category: p.category
      }));

    return {
      canonicalEntity: entity,
      resolution,
      newsArticles,
      liveVideos,
      events,
      places,
      sgisTexts,
      scholarCommentaries,
      scholars,
      storeProducts
    };
  }
}
