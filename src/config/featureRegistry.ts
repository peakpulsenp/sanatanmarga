/**
 * SANATANMARGA 4.2.7 — FEATURE CONTROL OS v1
 * CANONICAL TYPED FEATURE REGISTRY & ROLLOUT DEFINITIONS
 *
 * Principles:
 * 1. CODE EXISTS != FEATURE IS PUBLIC
 * 2. Hierarchical: If parent is OFF, descendants become effectively unavailable.
 * 3. Dependencies: If dependency is not satisfied, feature is unavailable.
 * 4. Safe defaults: System boots cleanly even with zero network/Firestore access.
 */

export type FeatureState = "off" | "admin_only" | "beta" | "public";

export type FeatureLifecycleState =
  | "BUILT"
  | "INTERNAL"
  | "STAFF_PREVIEW"
  | "BETA"
  | "RELEASED"
  | "MAINTENANCE"
  | "RETIRED";

export type FeatureExposure =
  | "HIDDEN"
  | "UTILITY"
  | "SECONDARY"
  | "PRIMARY"
  | "FEATURED";

export type FeatureCategory =
  | "core"
  | "homepage"
  | "article"
  | "navigation"
  | "sidebar"
  | "media"
  | "ai"
  | "knowledge"
  | "community"
  | "commerce"
  | "revenue"
  | "training"
  | "notifications"
  | "nepal_hub"
  | "blog"
  | "infrastructure";

export interface FeatureControls {
  navigation?: boolean;
  route?: boolean;
  component?: boolean;
  api?: boolean;
  backgroundJob?: boolean;
  snapshot?: boolean;
  seo?: boolean;
  listener?: boolean;
}

export interface FeatureDefinition {
  id: string;
  nameNe: string;
  nameEn: string;
  descriptionNe: string;
  descriptionEn: string;
  category: FeatureCategory;
  defaultState: FeatureState;
  lifecycle?: FeatureLifecycleState;
  exposure?: FeatureExposure;
  parentId?: string;
  dependencies?: string[];
  controls?: FeatureControls;
  critical?: boolean;
  impactWarningNe?: string;
  impactWarningEn?: string;
}

export interface FeatureEvaluation {
  featureId: string;
  enabled: boolean;
  visible: boolean;
  routeAllowed: boolean;
  mountAllowed: boolean;
  backgroundAllowed: boolean;
  snapshotAllowed: boolean;
  seoAllowed: boolean;
  listenerAllowed: boolean;
  directState: FeatureState;
  effectiveState: FeatureState;
  lifecycleState: FeatureLifecycleState;
  exposure: FeatureExposure;
  reason: string;
  missingDependencies?: string[];
  parentOff?: boolean;
  isRetired?: boolean;
}

export function mapStateToLifecycle(state: FeatureState): FeatureLifecycleState {
  switch (state) {
    case "public": return "RELEASED";
    case "beta": return "BETA";
    case "admin_only": return "INTERNAL";
    case "off": return "BUILT";
    default: return "BUILT";
  }
}

export function mapLifecycleToState(lifecycle: FeatureLifecycleState): FeatureState {
  switch (lifecycle) {
    case "RELEASED": return "public";
    case "BETA": return "beta";
    case "STAFF_PREVIEW":
    case "INTERNAL":
    case "MAINTENANCE": return "admin_only";
    case "BUILT":
    case "RETIRED": return "off";
    default: return "off";
  }
}

export interface FeatureAuditRecord {
  id: string;
  featureId: string;
  previousState: FeatureState;
  newState: FeatureState;
  actorId: string;
  actorEmail?: string;
  actorRole: string;
  timestamp: string;
  reason?: string;
  configVersion: number;
}

export interface FeatureControlConfig {
  version: number;
  updatedAt: string;
  updatedBy: string;
  overrides: Record<string, FeatureState>;
  auditTrail?: FeatureAuditRecord[];
}

export type RolloutPresetName =
  | "LAUNCH_MINIMAL"
  | "LAUNCH_STANDARD"
  | "BETA_STANDARD"
  | "BETA_EXPANDED"
  | "FULL_PLATFORM"
  | "EMERGENCY_MODE";

export interface RolloutProfile {
  id: RolloutPresetName;
  nameNe: string;
  nameEn: string;
  descriptionNe: string;
  descriptionEn: string;
  overrides: Record<string, FeatureState>;
}

/**
 * Canonical Feature Registry
 * Real feature inventory matching SanatanMarga 4.2.7 production codebase
 */
export const CANONICAL_FEATURE_REGISTRY: FeatureDefinition[] = [
  // ========================================================
  // 1. CORE MODULES
  // ========================================================
  {
    id: "core.news",
    nameNe: "समाचार प्रणाली",
    nameEn: "News & Article System",
    descriptionNe: "मुख्य समाचार तथा लेख सम्पादन, प्रदर्शन तथा खोज",
    descriptionEn: "Core news articles, reading, categorization and detail view",
    category: "core",
    defaultState: "public",
    critical: true,
    controls: { navigation: true, route: true, component: true, api: true, snapshot: true, seo: true }
  },
  {
    id: "core.search",
    nameNe: "खोज प्रणाली",
    nameEn: "Global Search Engine",
    descriptionNe: "समाचार, लेख तथा सामग्रीको खोजी इन्जिन",
    descriptionEn: "Cross-entity search engine across all published content",
    category: "core",
    defaultState: "public",
    dependencies: ["core.news"],
    controls: { navigation: true, route: true, component: true, api: true }
  },
  {
    id: "core.auth",
    nameNe: "प्रयोगकर्ता प्रमाणीकरण",
    nameEn: "User Authentication & IAM",
    descriptionNe: "लगइन, दर्ता तथा भूमिकामा आधारित पहुँच नियन्त्रण",
    descriptionEn: "Firebase Auth, profile management, and RBAC authorization",
    category: "core",
    defaultState: "public",
    critical: true,
    controls: { route: true, component: true, api: true }
  },

  // ========================================================
  // 2. HOMEPAGE BLOCKS
  // ========================================================
  {
    id: "homepage.hero",
    nameNe: "गृहपृष्ठ सिनेमेटिक हिरो",
    nameEn: "Homepage Cinematic Video Hero",
    descriptionNe: "मुख्य पृष्ठको शीर्ष भिडियो तथा मुख्य समाचार ब्यानर",
    descriptionEn: "Cinematic hero video and top editorial showcase banner",
    category: "homepage",
    defaultState: "public",
    controls: { component: true }
  },
  {
    id: "homepage.breaking",
    nameNe: "ताजा ब्रेकिङ समाचार स्ट्रिप",
    nameEn: "Breaking News Ticker Strip",
    descriptionNe: "गृहपृष्ठमा तत्काल ताजा समाचार देखाउने स्ट्रिप",
    descriptionEn: "Real-time ticker showcasing urgent breaking updates",
    category: "homepage",
    defaultState: "public",
    controls: { component: true, snapshot: true }
  },
  {
    id: "homepage.ecosystem",
    nameNe: "सनातन चार स्तम्भ प्रणाली",
    nameEn: "Four Pillars & Live Statistics",
    descriptionNe: "सनातन मार्गको ४ आधार स्तम्भ तथा प्रत्यक्ष तथ्याङ्क",
    descriptionEn: "Sanatan civilizational pillars and dynamic ecosystem metric counters",
    category: "homepage",
    defaultState: "public",
    controls: { component: true }
  },
  {
    id: "homepage.bento",
    nameNe: "सम्पादकीय बेन्टो ग्रिड",
    nameEn: "Editorial Bento Grid",
    descriptionNe: "मुख्य समाचारहरूको आधुनिक बेन्टो लेआउट ग्रिड",
    descriptionEn: "Responsive responsive bento grid showcasing lead and secondary stories",
    category: "homepage",
    defaultState: "public",
    controls: { component: true }
  },
  {
    id: "homepage.categoryNav",
    nameNe: "विधा अन्वेषण ग्रिड",
    nameEn: "Category Navigation Grid",
    descriptionNe: "समाचार विधा अनुसार अन्वेषण गर्ने ग्रिड खण्ड",
    descriptionEn: "Visual category exploration tiles on homepage",
    category: "homepage",
    defaultState: "public",
    controls: { component: true }
  },
  {
    id: "homepage.trendingStories",
    nameNe: "ट्रेन्डिङ तथा सम्पादक रोजाइ ग्रिड",
    nameEn: "Trending & Editor's Picks Grid",
    descriptionNe: "सर्वाधिक पढिएका र सम्पादकले छानेका सामग्री",
    descriptionEn: "Curated trending articles and editorial highlights",
    category: "homepage",
    defaultState: "public",
    controls: { component: true }
  },
  {
    id: "homepage.nepalMap",
    nameNe: "नेपाल अन्तरक्रियात्मक नक्सा",
    nameEn: "Explore Nepal Interactive Map",
    descriptionNe: "७ प्रदेश र ७७ जिल्लाको अन्तरक्रियात्मक नक्सा र समाचार",
    descriptionEn: "Interactive 7-province geographic exploration map",
    category: "homepage",
    defaultState: "public",
    controls: { component: true }
  },
  {
    id: "homepage.sgisShowcase",
    nameNe: "सरस्वती ज्ञान विज्ञान प्रदर्शन",
    nameEn: "Saraswati Knowledge Showcase",
    descriptionNe: "गृहपृष्ठमा प्राचीन ग्रन्थ तथा पाण्डुलिपि झलक",
    descriptionEn: "Homepage preview carousel of ancient manuscripts and Vedic wisdom",
    category: "homepage",
    defaultState: "public",
    controls: { component: true }
  },
  {
    id: "homepage.marketData",
    nameNe: "नेपाल बजार तथ्याङ्क विजेट",
    nameEn: "Market Data & Forex Widget",
    descriptionNe: "सुनचाँदी, विदेशी मुद्रा तथा सेयर बजारको प्रत्यक्ष दर",
    descriptionEn: "Bullion, foreign exchange and financial indicators widget",
    category: "homepage",
    defaultState: "public",
    controls: { component: true }
  },
  {
    id: "homepage.announcements",
    nameNe: "सूचना तथा घोषणाहरू",
    nameEn: "Announcements Notification Bar",
    descriptionNe: "गृहपृष्ठको सूचना पट्टी",
    descriptionEn: "Dismissible announcement banner for editorial alerts",
    category: "homepage",
    defaultState: "public",
    controls: { component: true }
  },

  // ========================================================
  // 3. ARTICLE PAGE COMPONENTS
  // ========================================================
  {
    id: "article.listen",
    nameNe: "लेख अडियो पाठक (ListenOS)",
    nameEn: "Article Audio Reader (ListenOS)",
    descriptionNe: "लेखको भ्वाइस अडियो सुन्ने प्लेयर र स्पीड कन्ट्रोलर",
    descriptionEn: "In-article TTS audio player with native Nepali voice playback",
    category: "article",
    defaultState: "public",
    dependencies: ["media.listenos"],
    controls: { component: true, api: true }
  },
  {
    id: "article.comments",
    nameNe: "लेख टिप्पणी तथा छलफल",
    nameEn: "Article Comments Section",
    descriptionNe: "पाठकहरूको अन्तरक्रिया तथा प्रतिक्रिया प्रणाली",
    descriptionEn: "Reader comment submissions and pinned discussion threads",
    category: "article",
    defaultState: "public",
    controls: { component: true, api: true }
  },
  {
    id: "article.provenance",
    nameNe: "सम्पादकीय स्रोत तथा सत्यता कार्ड",
    nameEn: "Editorial Provenance & Fact-Check Card",
    descriptionNe: "लेखको स्रोत, तथ्य प्रमाणीकरण र सम्पादकीय जवाफदेहिता",
    descriptionEn: "Cryptographic provenance, primary sources and journalistic audit trail",
    category: "article",
    defaultState: "public",
    controls: { component: true }
  },
  {
    id: "article.districtImpact",
    nameNe: "जिल्ला प्रभाव तथा स्थानीय सम्बन्ध",
    nameEn: "District Impact & Geo Relevance",
    descriptionNe: "नेपालका जिल्लाहरूसँग समाचारको सम्बन्ध र प्रभाव",
    descriptionEn: "Geographic tagging and district-specific impact context",
    category: "article",
    defaultState: "public",
    controls: { component: true }
  },
  {
    id: "article.storyNetwork",
    nameNe: "समाचार सञ्जाल र विकासक्रम",
    nameEn: "Story Network & Related Threads",
    descriptionNe: "यस समाचारसँग सम्बन्धित विगत तथा निरन्तर कथाहरू",
    descriptionEn: "Cross-narrative relational story network mapping",
    category: "article",
    defaultState: "public",
    controls: { component: true }
  },
  {
    id: "article.crossLinks",
    nameNe: "ज्ञानकोष क्रस-लिंकहरू",
    nameEn: "Knowledge Graph In-Article Links",
    descriptionNe: "लेखभित्रका वैदिक तथा शास्त्रीय अवधारणाहरूको लिङ्क",
    descriptionEn: "Interactive links to relevant knowledge nodes and scriptures",
    category: "article",
    defaultState: "public",
    dependencies: ["knowledge.base"],
    controls: { component: true }
  },
  {
    id: "article.storeConnector",
    nameNe: "सम्बन्धित पुस्तक तथा सामग्री सिफारिस",
    nameEn: "Sanatan Store Book Connector",
    descriptionNe: "लेखसँग मिल्ने पुस्तक वा वस्तु पसलबाट सिफारिस",
    descriptionEn: "Contextual merchandise and sacred scripture purchase suggestions",
    category: "article",
    defaultState: "public",
    dependencies: ["commerce.store"],
    controls: { component: true }
  },
  {
    id: "article.timeline",
    nameNe: "घटनाक्रम टाइमलाइन",
    nameEn: "Story Evolution Timeline",
    descriptionNe: "दीर्घकालीन समाचारहरूको क्रमिक ऐतिहासिक टाइमलाइन",
    descriptionEn: "Chronological event timeline for developing civilizational topics",
    category: "article",
    defaultState: "public",
    controls: { component: true }
  },
  {
    id: "article.share",
    nameNe: "सामाजिक तथा चौतारी साझेदारी",
    nameEn: "Social & Chautari Sharing",
    descriptionNe: "फेसबुक, एक्स, ह्वाट्सएप र चौतारीमा साझा गर्ने उपकरण",
    descriptionEn: "Social sharing drawer and Chautari forum cross-post capability",
    category: "article",
    defaultState: "public",
    controls: { component: true }
  },

  // ========================================================
  // 4. SIDEBAR WIDGETS
  // ========================================================
  {
    id: "sidebar.global",
    nameNe: "साइडबार समग्र प्रणाली",
    nameEn: "Global Sidebar Container",
    descriptionNe: "वेबसाइटको मुख्य तथा लेख साइडबार कन्टेनर",
    descriptionEn: "Parent container for all contextual sidebar widgets",
    category: "sidebar",
    defaultState: "public",
    controls: { component: true }
  },
  {
    id: "sidebar.mostRead",
    nameNe: "साइडबार: धेरै पढिएको",
    nameEn: "Sidebar: Most Read Articles",
    descriptionNe: "साइडबारमा धेरै पढिएका लेखहरूको सूची",
    descriptionEn: "Ranked list of trending and most read articles",
    category: "sidebar",
    defaultState: "public",
    parentId: "sidebar.global",
    controls: { component: true }
  },
  {
    id: "sidebar.newsletter",
    nameNe: "साइडबार: न्यूजलेटर सदस्यता",
    nameEn: "Sidebar: Newsletter Subscription",
    descriptionNe: "इमेल न्यूजलेटर ग्राहक दर्ता विजेट",
    descriptionEn: "Newsletter email signup widget",
    category: "sidebar",
    defaultState: "public",
    parentId: "sidebar.global",
    controls: { component: true, api: true }
  },
  {
    id: "sidebar.social",
    nameNe: "साइडबार: सामाजिक सञ्जाल लिङ्कहरू",
    nameEn: "Sidebar: Social Media Connect",
    descriptionNe: "८ प्रमुख सामाजिक सञ्जालमा जोडिने विजेट",
    descriptionEn: "Social follow buttons with follower counts",
    category: "sidebar",
    defaultState: "public",
    parentId: "sidebar.global",
    controls: { component: true }
  },
  {
    id: "sidebar.ads",
    nameNe: "साइडबार: विज्ञापन",
    nameEn: "Sidebar: Sponsored Ad Banner",
    descriptionNe: "साइडबारभित्र देखिने प्रायोजित विज्ञापन",
    descriptionEn: "Display advertisements in sidebar slots",
    category: "sidebar",
    defaultState: "public",
    parentId: "sidebar.global",
    dependencies: ["revenue.ads"],
    controls: { component: true }
  },
  {
    id: "sidebar.knowledgeGraph",
    nameNe: "साइडबार: ज्ञान ग्राफ विजेट",
    nameEn: "Sidebar: Knowledge Graph Mini-Widget",
    descriptionNe: "लेखको छेउमा सम्बन्धित ज्ञान नोडहरूको प्रदर्शन",
    descriptionEn: "Contextual knowledge nodes linked in article sidebar",
    category: "sidebar",
    defaultState: "public",
    parentId: "sidebar.global",
    dependencies: ["knowledge.base"],
    controls: { component: true }
  },

  // ========================================================
  // 5. MEDIA & LISTENOS
  // ========================================================
  {
    id: "media.listenos",
    nameNe: "लिसन ओएस (ListenOS अडियो)",
    nameEn: "ListenOS Audio Platform",
    descriptionNe: "R2 अडियो क्यास र नेपालीसहित बहुभाषी टीटीएस अडियो पूर्वाधार",
    descriptionEn: "Deterministic R2 audio storage, SHA-256 caching and voice synthesis",
    category: "media",
    defaultState: "public",
    impactWarningNe: "ListenOS बन्द गर्दा सम्पूर्ण लेख अडियो, नयाँ अडियो उत्पादन तथा प्लेब्याक रोकिनेछ।",
    impactWarningEn: "Disabling ListenOS hides audio players and suspends TTS synthesis worldwide.",
    controls: { navigation: true, route: true, component: true, api: true, backgroundJob: true }
  },
  {
    id: "media.radio",
    nameNe: "सनातन रेडियो तथा पडकास्ट",
    nameEn: "Sanatan Radio & Live Streaming",
    descriptionNe: "प्रत्यक्ष वैदिक रेडियो स्ट्रिम, भजन तथा प्रवचन",
    descriptionEn: "Continuous Vedic audio streaming and podcast channels",
    category: "media",
    defaultState: "public",
    controls: { navigation: true, route: true, component: true, api: true }
  },
  {
    id: "media.live",
    nameNe: "प्रत्यक्ष भिडियो प्रसारण (LiveOS)",
    nameEn: "Live Video Broadcasting (LiveOS)",
    descriptionNe: "युट्युब प्रत्यक्ष स्ट्रिम तथा विशेष धार्मिक/राष्ट्रिय प्रसारण",
    descriptionEn: "Live video hub, event streams and interactive live chat",
    category: "media",
    defaultState: "public",
    controls: { navigation: true, route: true, component: true, api: true }
  },
  {
    id: "media.video",
    nameNe: "भिडियो समाचार तथा डकुमेन्ट्री",
    nameEn: "Video News & Documentaries",
    descriptionNe: "मल्टिमिडिया जोन तथा भिडियो समाचार ग्यालरी",
    descriptionEn: "Video news stories and civilizational documentary embeds",
    category: "media",
    defaultState: "public",
    controls: { navigation: true, route: true, component: true }
  },

  // ========================================================
  // 6. AI CAPABILITIES (COST & QUOTA GOVERNANCE)
  // ========================================================
  {
    id: "ai.tts",
    nameNe: "जेमिनी टीटीएस आवाज उत्पादन",
    nameEn: "Gemini Text-to-Speech Engine",
    descriptionNe: "नयाँ लेखहरूको लागि जेमिनी टीटीएसबाट नेपाली आवाज बनाउने कार्य",
    descriptionEn: "Backend Gemini speech synthesis for articles and manuscripts",
    category: "ai",
    defaultState: "public",
    dependencies: ["media.listenos"],
    impactWarningNe: "टीटीएस बन्द गर्दा जेमिनी कोटा खपत तुरुन्त रोकिन्छ तर पुराना अडियोहरू सुरक्षित रहन्छन्।",
    impactWarningEn: "Disabling Gemini TTS immediately halts API quota spend; existing R2 audios remain intact.",
    controls: { api: true, backgroundJob: true }
  },
  {
    id: "ai.newsroom",
    nameNe: "एआई सम्पादकीय सहायक",
    nameEn: "AI Newsroom Editorial Assistant",
    descriptionNe: "लेख संक्षेपीकरण, शीर्षक सुझाव र अनुवाद सहयोग",
    descriptionEn: "Staff-only AI writing copilot, headline analyzer, and grammar polish",
    category: "ai",
    defaultState: "admin_only",
    controls: { component: true, api: true }
  },
  {
    id: "ai.translation",
    nameNe: "बहुभाषी अनुवाद इन्जिन",
    nameEn: "Multilingual AI Translation",
    descriptionNe: "नेपाली, अंग्रेजी तथा संस्कृतबीच स्वचालित अनुवाद",
    descriptionEn: "Automatic content translation across English, Nepali, and Sanskrit",
    category: "ai",
    defaultState: "admin_only",
    controls: { component: true, api: true }
  },
  {
    id: "ai.ask_sanatan",
    nameNe: "सोध्नुहोस् सनातन (Ask Sanatan AI)",
    nameEn: "Ask Sanatan Grounded Research Assistant",
    descriptionNe: "सनातन ज्ञानकोष र अभिलेखालयमा आधारित एआई अनुसन्धान सहायक (Phase 9 Complete • Grounded Research Engine)",
    descriptionEn: "Grounded conversational research agent powered by Saraswati Knowledge OS and SGIS",
    category: "ai",
    defaultState: "public",
    lifecycle: "RELEASED",
    exposure: "FEATURED",
    impactWarningNe: "प्रामाणिक ग्रन्थ र शिलालेखमा आधारित शून्य-भ्रम अनुसन्धान प्रणाली।",
    impactWarningEn: "Grounded in verified historical inscriptions and authentic Vedic corpus.",
    controls: { component: true, api: true, navigation: true, route: true }
  },
  {
    id: "language.translation",
    nameNe: "भाषा तथा अनुवाद सेवा",
    nameEn: "Language & Translation OS",
    descriptionNe: "अनुवाद, समीक्षा तथा प्रकाशन व्यवस्थापन",
    descriptionEn: "Server translation lifecycle, review workflow, and multi-language delivery",
    category: "core",
    defaultState: "public",
    controls: { component: true, api: true }
  },
  {
    id: "language.roman_nepali",
    nameNe: "रोमन नेपाली टाइपिङ",
    nameEn: "Roman Nepali Transliteration",
    descriptionNe: "स्थानीय अफलाइन रोमन नेपाली इनपुट रुपान्तरण",
    descriptionEn: "Local offline-capable Roman Nepali to Devanagari transliteration",
    category: "core",
    defaultState: "public",
    controls: { component: true }
  },
  {
    id: "language.scholarly_transliteration",
    nameNe: "पाण्डित्यपूर्ण संस्कृत र IAST रुपान्तरण",
    nameEn: "Scholarly Sanskrit & IAST Transliteration",
    descriptionNe: "देवनागरी र IAST लिपिबीच द्वि-दिशात्मक पाण्डित्य रुपान्तरण",
    descriptionEn: "Bidirectional scholarly transliteration for SGIS manuscripts and Knowledge",
    category: "core",
    defaultState: "public",
    controls: { component: true, api: true }
  },
  {
    id: "ai.ocr",
    nameNe: "प्राचीन पाण्डुलिपि ओसीआर",
    nameEn: "Manuscript AI OCR & Vision",
    descriptionNe: "देवनागरी र रञ्जना लिपिको ओसीआर तथा पाठ प्रशोधन",
    descriptionEn: "Vision model transcription and manuscript cleaning for SGIS",
    category: "ai",
    defaultState: "admin_only",
    controls: { component: true, api: true, backgroundJob: true }
  },

  // ========================================================
  // 7. KNOWLEDGE & SGIS
  // ========================================================
  {
    id: "knowledge.base",
    nameNe: "सारस्वती ज्ञानकोष (KnowledgeOS)",
    nameEn: "Saraswati Knowledge Base",
    descriptionNe: "वैदिक ग्रन्थ, दार्शनिक अवधारणा र ऐतिहासिक व्यक्तित्व अभिलेख",
    descriptionEn: "Civilizational knowledge graph, philosophy nodes, and scripture index",
    category: "knowledge",
    defaultState: "public",
    controls: { navigation: true, route: true, component: true, api: true, snapshot: true, seo: true }
  },
  {
    id: "knowledge.sgis",
    nameNe: "एसजीआईएस डिजिटल ग्रन्थालय (SGIS)",
    nameEn: "SGIS Ancient Manuscript Library",
    descriptionNe: "दुर्लभ पाण्डुलिपिहरूको डिजिटल संरक्षण र अनुसन्धान मञ्च",
    descriptionEn: "Sacred Grantha Intelligence System for manuscript preservation",
    category: "knowledge",
    defaultState: "public",
    dependencies: ["knowledge.base"],
    controls: { navigation: true, route: true, component: true, api: true }
  },
  {
    id: "knowledge.timeline",
    nameNe: "सनातन ऐतिहासिक कालक्रम",
    nameEn: "Sanatan Civilization Timeline",
    descriptionNe: "सत्ययुगदेखि आधुनिक कालसम्मको घटनाक्रम र युग विभाजन",
    descriptionEn: "Interactive historical epoch timeline and era explorer",
    category: "knowledge",
    defaultState: "public",
    dependencies: ["knowledge.base"],
    controls: { navigation: true, route: true, component: true }
  },
  {
    id: "knowledge.archives",
    nameNe: "अभिलेखालय तथा दस्तावेज",
    nameEn: "Historical Archives & Treaties",
    descriptionNe: "ऐतिहासिक सन्धि, सम्झौता र दुर्लभ सरकारी दस्तावेजहरू",
    descriptionEn: "Repository of historical treaties, decrees, and institutional records",
    category: "knowledge",
    defaultState: "public",
    dependencies: ["knowledge.base"],
    controls: { navigation: true, route: true, component: true }
  },
  {
    id: "knowledge.festivals",
    nameNe: "नेपाल चाडपर्व तथा पञ्चाङ्ग इन्जिन",
    nameEn: "Nepal Festival & Panchang Engine",
    descriptionNe: "तिथि, चाडपर्व तथा धार्मिक उत्सव गणना इन्जिन",
    descriptionEn: "Lunar calendar calculations, festival alerts, and auspicious timings",
    category: "knowledge",
    defaultState: "public",
    controls: { navigation: true, route: true, component: true }
  },

  // ========================================================
  // 8. COMMUNITY & CHAUTARI
  // ========================================================
  {
    id: "community.chautari",
    nameNe: "सनातन चौतारी समुदाय",
    nameEn: "Sanatan Chautari Community Hub",
    descriptionNe: "पाठकहरूको छलफल चौतारी, प्रश्नोत्तर र नागरिक संवाद",
    descriptionEn: "Public community forums, discourse threads, and civic dialogue",
    category: "community",
    defaultState: "public",
    controls: { navigation: true, route: true, component: true, api: true }
  },
  {
    id: "community.writing",
    nameNe: "चौतारी नयाँ पोष्ट तथा टिप्पणी लेखन",
    nameEn: "Community Post & Comment Creation",
    descriptionNe: "नयाँ पोष्ट राख्ने, टिप्पणी गर्ने र मत दिने क्षमता",
    descriptionEn: "Ability for registered users to create new threads and comments",
    category: "community",
    defaultState: "public",
    parentId: "community.chautari",
    dependencies: ["core.auth"],
    controls: { component: true, api: true }
  },
  {
    id: "community.events",
    nameNe: "कार्यक्रम तथा उत्सव सञ्जाल",
    nameEn: "Events & Cultural Calendar",
    descriptionNe: "सार्वजनिक धार्मिक, सांस्कृतिक तथा साहित्यिक कार्यक्रमहरू",
    descriptionEn: "Public cultural gatherings, discourses, and festive events",
    category: "community",
    defaultState: "public",
    dependencies: ["core.news"],
    controls: { navigation: true, route: true, component: true, api: true, snapshot: true }
  },

  // ========================================================
  // 9. COMMERCE & STORE
  // ========================================================
  {
    id: "commerce.store",
    nameNe: "सनातन पसल (Sanatan Store)",
    nameEn: "Sanatan Sacred Merchandise Store",
    descriptionNe: "धार्मिक ग्रन्थ, पूजा सामग्री तथा सात्त्विक उत्पादन बिक्री",
    descriptionEn: "Sacred books, traditional handicrafts, and heritage merchandise",
    category: "commerce",
    defaultState: "public",
    controls: { navigation: true, route: true, component: true, api: true }
  },

  // ========================================================
  // 10. REVENUE & ADVERTISING
  // ========================================================
  {
    id: "revenue.ads",
    nameNe: "विज्ञापन तथा प्रायोजन इन्जिन",
    nameEn: "Ad Delivery & Sponsorship Engine",
    descriptionNe: "ब्यानर, प्रायोजित सामग्री तथा स्थानीय विज्ञापन प्रदर्शन",
    descriptionEn: "Contextual ad serving, impression tracking, and rotation engine",
    category: "revenue",
    defaultState: "public",
    controls: { component: true, api: true }
  },
  {
    id: "revenue.membership",
    nameNe: "संरक्षक सदस्यता (Patron Program)",
    nameEn: "Sanatan Patron Membership",
    descriptionNe: "पाठकहरूको आर्थिक योगदान तथा सदस्यता योजना",
    descriptionEn: "Paid tiers, patron perks, and institutional memberships",
    category: "revenue",
    defaultState: "public",
    controls: { navigation: true, route: true, component: true, api: true }
  },

  // ========================================================
  // 11. TRAINING & COMPETENCY
  // ========================================================
  {
    id: "training.academy",
    nameNe: "सनातन एकेडेमी तथा तालिम",
    nameEn: "Sanatan Academy & Training Center",
    descriptionNe: "पत्रकारिता, संस्कृति र प्राविधिक सीप तालिम कक्षाहरू",
    descriptionEn: "Journalism ethics, cultural pedagogy courses, and student cohorts",
    category: "training",
    defaultState: "public",
    controls: { navigation: true, route: true, component: true, api: true }
  },
  {
    id: "training.certification",
    nameNe: "डिजिटल प्रमाणपत्र प्रमाणीकरण",
    nameEn: "Digital Certificate Verification",
    descriptionNe: "तालिम पूरा गरेका विद्यार्थीको प्रमाणपत्र अनलाइन जाँच",
    descriptionEn: "Public tamper-evident QR certificate verification portal",
    category: "training",
    defaultState: "public",
    dependencies: ["training.academy"],
    controls: { navigation: true, route: true, component: true }
  },

  // ========================================================
  // 12. NOTIFICATIONS
  // ========================================================
  {
    id: "notifications.push",
    nameNe: "वेब पुश नोटिफिकेसन (FCM/VAPID)",
    nameEn: "Browser Web Push Notifications",
    descriptionNe: "ब्राउजरमा ताजा समाचार र ब्रेकिङ अलर्ट पठाउने प्रणाली",
    descriptionEn: "Firebase Cloud Messaging service worker push delivery",
    category: "notifications",
    defaultState: "public",
    impactWarningNe: "पुश सूचना बन्द गर्दा सेवाकर्मी दर्ता स्थगित हुनेछ र पाठकलाई नयाँ प्रम्प्ट देखिने छैन।",
    impactWarningEn: "Disabling push stops FCM registration prompts and notification dispatch.",
    controls: { component: true, api: true, backgroundJob: true }
  },
  {
    id: "notifications.center",
    nameNe: "इन-एप नोटिफिकेसन सेन्टर",
    nameEn: "In-App Notification Center Drawer",
    descriptionNe: "प्रयोगकर्ताको घण्टी आइकन र व्यक्तिगत सूचना सूची",
    descriptionEn: "Personal user activity alerts and system notification drawer",
    category: "notifications",
    defaultState: "public",
    controls: { component: true }
  },

  // ========================================================
  // 12B. AUDIENCE OS & READER ACTIVITY (PHASE 3C)
  // ========================================================
  {
    id: "audience.activity",
    nameNe: "पाठक गतिविधि सङ्कलन प्रणाली",
    nameEn: "Reader Activity Ingestion OS",
    descriptionNe: "गोपनीयतायुक्त पाठक गतिविधि, प्रगति ट्र्याकिङ र स्थानीय बफरिङ",
    descriptionEn: "Privacy-conscious reader activity, progress milestones and bounded batch buffering",
    category: "core",
    defaultState: "public",
    controls: { api: true, backgroundJob: true }
  },
  {
    id: "audience.history",
    nameNe: "पढाइ इतिहास तथा निरन्तरता",
    nameEn: "Reading History & Continue Reading",
    descriptionNe: "स्थानीय तथा प्रमाणित पाठकको हालै पढेका लेख र पढाइ निरन्तरता",
    descriptionEn: "Local and authenticated continue reading and privacy-conscious reading history",
    category: "core",
    defaultState: "public",
    controls: { component: true, api: true }
  },
  {
    id: "audience.aggregates",
    nameNe: "पाठक समूह तथा सार्वजनिक तथ्याङ्क",
    nameEn: "Audience Aggregation & Public Metrics",
    descriptionNe: "व्यक्तिगत पहिचानविहीन एकत्रित दर्शक संख्या र सम्पादकीय तथ्याङ्क",
    descriptionEn: "De-identified aggregated content metrics, dwell analysis and editorial telemetry",
    category: "core",
    defaultState: "public",
    controls: { component: true, api: true }
  },

  // ========================================================
  // 13. NEPAL HUB & SITUATION ROOM
  // ========================================================
  {
    id: "nepalhub.main",
    nameNe: "नेपाल हब तथा जिल्ला प्रोफाइल",
    nameEn: "Nepal Hub & District Network",
    descriptionNe: "७ प्रदेश, ७७ जिल्लाको स्थिति कक्ष र स्थानीय समाचार",
    descriptionEn: "National situation room, district intelligence, and provincial coverage",
    category: "nepal_hub",
    defaultState: "public",
    controls: { navigation: true, route: true, component: true, api: true }
  },
  {
    id: "nepalhub.situationRoom",
    nameNe: "प्रत्यक्ष संकट तथा स्थिति कक्ष",
    nameEn: "Live Situation Room & Emergency Feeds",
    descriptionNe: "बाढी, पहिरो, मौसम र राष्ट्रिय आपतकालीन प्रत्यक्ष अपडेट",
    descriptionEn: "Crisis monitoring, natural disaster bulletins and live feeds",
    category: "nepal_hub",
    defaultState: "public",
    parentId: "nepalhub.main",
    controls: { route: true, component: true }
  },

  // ========================================================
  // 14. SANATAN BLOG
  // ========================================================
  {
    id: "blog.main",
    nameNe: "सनातन विचार तथा ब्लग",
    nameEn: "Sanatan Perspectives Blog",
    descriptionNe: "विचार, स्तम्भ, खोजमूलक शृङ्खला तथा विद्वत आलेखहरू",
    descriptionEn: "In-depth civilizational essays, op-eds, author series and thought leadership",
    category: "blog",
    defaultState: "public",
    controls: { navigation: true, route: true, component: true, api: true, seo: true }
  },

  // ========================================================
  // 15. INFRASTRUCTURE & RECOVERY (CRITICAL PROTECTED)
  // ========================================================
  {
    id: "infra.snapshotOs",
    nameNe: "स्न्यापसट ओएस (Snapshot OS क्यासिङ)",
    nameEn: "Snapshot OS & Static Resilience",
    descriptionNe: "फायरस्टोर बिना उच्च गतिको स्थिर JSON क्यास र R2 वितरण",
    descriptionEn: "High-speed atomic JSON publication and read-continuity caching",
    category: "infrastructure",
    defaultState: "public",
    critical: true,
    controls: { api: true, snapshot: true }
  },
  {
    id: "infra.featureControl",
    nameNe: "फिचर कन्ट्रोल ओएस (लन्च व्यवस्थापन)",
    nameEn: "Feature Control OS & Launch Governance",
    descriptionNe: "केन्द्रीकृत फिचर नियन्त्रण, रोलआउट र किल-स्विच प्रणाली",
    descriptionEn: "Centralized release governance, kill-switches and role gating",
    category: "infrastructure",
    defaultState: "public",
    critical: true,
    controls: { component: true, api: true }
  },
  {
    id: "infra.auditTrail",
    nameNe: "लेखापरीक्षण लग (AuditOS)",
    nameEn: "Security & Governance Audit Trail",
    descriptionNe: "प्रणालीमा भएका हरेक संवेदनशील परिवर्तनको रेकर्ड",
    descriptionEn: "Immutable audit log of all administrative actions and security mutations",
    category: "infrastructure",
    defaultState: "public",
    critical: true,
    controls: { api: true }
  }
];

/**
 * Validate that there are no cyclical dependencies in the registry
 */
export function validateFeatureDependencyAcyclic(
  registry: FeatureDefinition[] = CANONICAL_FEATURE_REGISTRY
): { valid: boolean; cycle?: string[] } {
  const map = new Map<string, string[]>();
  registry.forEach(f => {
    const deps = [...(f.dependencies || [])];
    if (f.parentId) deps.push(f.parentId);
    map.set(f.id, deps);
  });

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function hasCycle(node: string): boolean {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    const neighbors = map.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        path.push(neighbor);
        return true;
      }
    }

    recStack.delete(node);
    path.pop();
    return false;
  }

  for (const f of registry) {
    if (!visited.has(f.id)) {
      if (hasCycle(f.id)) {
        return { valid: false, cycle: [...path] };
      }
    }
  }

  return { valid: true };
}

// Self-check at module evaluation
const validation = validateFeatureDependencyAcyclic();
if (!validation.valid) {
  console.error("[FEATURE_CONTROL_OS] Fatal: Cyclical dependency detected in registry:", validation.cycle);
}

/**
 * ROLLOUT PRESET PROFILES
 */
export const ROLLOUT_PROFILES: Record<RolloutPresetName, RolloutProfile> = {
  // Safe minimal launch: Focus on core news, homepage, search, basic articles
  LAUNCH_MINIMAL: {
    id: "LAUNCH_MINIMAL",
    nameNe: "न्यूनतम लन्च प्रोफाइल (Launch Minimal)",
    nameEn: "Launch Minimal Profile",
    descriptionNe: "मुख्य समाचार, गृहपृष्ठ, खोजी तथा विज्ञापन मात्र खुला। चौतारी, तालिम, एसजीआईएस र महँगा एआई बन्द।",
    descriptionEn: "Essential journalism, news, search and revenue active. Community, SGIS, Training, Store and heavy AI in Off/Admin-only.",
    overrides: {
      "core.news": "public",
      "core.search": "public",
      "core.auth": "public",
      "homepage.hero": "public",
      "homepage.breaking": "public",
      "homepage.ecosystem": "public",
      "homepage.bento": "public",
      "homepage.categoryNav": "public",
      "homepage.trendingStories": "public",
      "homepage.nepalMap": "public",
      "homepage.sgisShowcase": "off",
      "homepage.marketData": "public",
      "homepage.announcements": "public",
      "article.listen": "admin_only",
      "article.comments": "off",
      "article.provenance": "public",
      "article.districtImpact": "public",
      "article.storyNetwork": "public",
      "article.crossLinks": "public",
      "article.storeConnector": "off",
      "article.timeline": "public",
      "article.share": "public",
      "sidebar.global": "public",
      "sidebar.mostRead": "public",
      "sidebar.newsletter": "public",
      "sidebar.social": "public",
      "sidebar.ads": "public",
      "sidebar.knowledgeGraph": "public",
      "media.listenos": "admin_only",
      "media.radio": "public",
      "media.live": "public",
      "media.video": "public",
      "ai.tts": "admin_only",
      "ai.newsroom": "admin_only",
      "ai.translation": "admin_only",
      "ai.ocr": "admin_only",
      "ai.ask_sanatan": "public",
      "knowledge.base": "public",
      "knowledge.sgis": "admin_only",
      "knowledge.timeline": "public",
      "knowledge.archives": "public",
      "knowledge.festivals": "public",
      "community.chautari": "off",
      "community.writing": "off",
      "community.events": "off",
      "commerce.store": "off",
      "revenue.ads": "public",
      "revenue.membership": "public",
      "training.academy": "off",
      "training.certification": "off",
      "notifications.push": "off",
      "notifications.center": "public",
      "nepalhub.main": "public",
      "nepalhub.situationRoom": "off",
      "blog.main": "public",
      "infra.snapshotOs": "public",
      "infra.featureControl": "public",
      "infra.auditTrail": "public"
    }
  },

  // Standard production launch: Enables ListenOS, store, notifications
  LAUNCH_STANDARD: {
    id: "LAUNCH_STANDARD",
    nameNe: "मानक उत्पादन प्रोफाइल (Launch Standard)",
    nameEn: "Launch Standard Profile",
    descriptionNe: "सम्पूर्ण समाचार, लिसन ओएस अडियो, ज्ञानकोष, ब्लग, पसल तथा पुश सूचना खुला। चौतारी तथा तालिम बिटामा।",
    descriptionEn: "Complete news, ListenOS audio, knowledge base, blog, store and push active. Community and academy in Beta/Admin.",
    overrides: {
      "core.news": "public",
      "core.search": "public",
      "core.auth": "public",
      "homepage.hero": "public",
      "homepage.breaking": "public",
      "homepage.ecosystem": "public",
      "homepage.bento": "public",
      "homepage.categoryNav": "public",
      "homepage.trendingStories": "public",
      "homepage.nepalMap": "public",
      "homepage.sgisShowcase": "public",
      "homepage.marketData": "public",
      "homepage.announcements": "public",
      "article.listen": "public",
      "article.comments": "admin_only",
      "article.provenance": "public",
      "article.districtImpact": "public",
      "article.storyNetwork": "public",
      "article.crossLinks": "public",
      "article.storeConnector": "public",
      "article.timeline": "public",
      "article.share": "public",
      "sidebar.global": "public",
      "sidebar.mostRead": "public",
      "sidebar.newsletter": "public",
      "sidebar.social": "public",
      "sidebar.ads": "public",
      "sidebar.knowledgeGraph": "public",
      "media.listenos": "public",
      "media.radio": "public",
      "media.live": "public",
      "media.video": "public",
      "ai.tts": "public",
      "ai.newsroom": "admin_only",
      "ai.translation": "admin_only",
      "ai.ocr": "admin_only",
      "ai.ask_sanatan": "public",
      "knowledge.base": "public",
      "knowledge.sgis": "public",
      "knowledge.timeline": "public",
      "knowledge.archives": "public",
      "knowledge.festivals": "public",
      "community.chautari": "public",
      "community.writing": "public",
      "community.events": "public",
      "commerce.store": "public",
      "revenue.ads": "public",
      "revenue.membership": "public",
      "training.academy": "public",
      "training.certification": "public",
      "notifications.push": "public",
      "notifications.center": "public",
      "nepalhub.main": "public",
      "nepalhub.situationRoom": "public",
      "blog.main": "public",
      "infra.snapshotOs": "public",
      "infra.featureControl": "public",
      "infra.auditTrail": "public"
    }
  },

  // Beta Standard platform profile
  BETA_STANDARD: {
    id: "BETA_STANDARD",
    nameNe: "मानक बिटा प्रोफाइल (Beta Standard)",
    nameEn: "Beta Standard Profile",
    descriptionNe: "मानक उत्पादन प्रोफाइल जस्तै, चौतारी तथा तालिम बिटा प्रयोगकर्ताका लागि खुला।",
    descriptionEn: "Standard beta profile with community, academy and core modules accessible to beta testers.",
    overrides: {
      "core.news": "public",
      "core.search": "public",
      "core.auth": "public",
      "homepage.hero": "public",
      "homepage.breaking": "public",
      "homepage.ecosystem": "public",
      "homepage.bento": "public",
      "homepage.categoryNav": "public",
      "homepage.trendingStories": "public",
      "homepage.nepalMap": "public",
      "homepage.sgisShowcase": "public",
      "homepage.marketData": "public",
      "homepage.announcements": "public",
      "article.listen": "public",
      "article.comments": "beta",
      "article.provenance": "public",
      "article.districtImpact": "public",
      "article.storyNetwork": "public",
      "article.crossLinks": "public",
      "article.storeConnector": "public",
      "article.timeline": "public",
      "article.share": "public",
      "sidebar.global": "public",
      "sidebar.mostRead": "public",
      "sidebar.newsletter": "public",
      "sidebar.social": "public",
      "sidebar.ads": "public",
      "sidebar.knowledgeGraph": "public",
      "media.listenos": "public",
      "media.radio": "public",
      "media.live": "public",
      "media.video": "public",
      "ai.tts": "public",
      "ai.newsroom": "admin_only",
      "ai.translation": "admin_only",
      "ai.ocr": "admin_only",
      "ai.ask_sanatan": "public",
      "knowledge.base": "public",
      "knowledge.sgis": "public",
      "knowledge.timeline": "public",
      "knowledge.archives": "public",
      "knowledge.festivals": "public",
      "community.chautari": "public",
      "community.writing": "public",
      "community.events": "public",
      "commerce.store": "public",
      "revenue.ads": "public",
      "revenue.membership": "public",
      "training.academy": "public",
      "training.certification": "public",
      "notifications.push": "public",
      "notifications.center": "public",
      "nepalhub.main": "public",
      "nepalhub.situationRoom": "public",
      "blog.main": "public",
      "infra.snapshotOs": "public",
      "infra.featureControl": "public",
      "infra.auditTrail": "public"
    }
  },

  // Expanded beta platform
  BETA_EXPANDED: {
    id: "BETA_EXPANDED",
    nameNe: "विस्तारित बिटा प्रोफाइल (Beta Expanded)",
    nameEn: "Beta Expanded Profile",
    descriptionNe: "सबै सुविधाहरू खुला, नयाँ प्रायोगिक सुविधाहरू बिटा प्रयोगकर्ताका लागि उपलब्ध।",
    descriptionEn: "Full platform open with interactive and emerging modules accessible to beta audience.",
    overrides: {
      "community.chautari": "public",
      "community.writing": "public",
      "article.comments": "public",
      "training.academy": "public",
      "training.certification": "public",
      "media.live": "public",
      "ai.newsroom": "beta",
      "ai.translation": "beta",
      "ai.ocr": "beta",
      "ai.ask_sanatan": "public"
    }
  },

  // Full platform (all default capabilities active)
  FULL_PLATFORM: {
    id: "FULL_PLATFORM",
    nameNe: "पूर्ण सनातन प्लेटफर्म (Full Platform)",
    nameEn: "Full Platform Profile",
    descriptionNe: "सम्पूर्ण फिचरहरू सार्वजनिक र प्रशासकीय मोड अनुसार पूर्ण सक्रिय।",
    descriptionEn: "All product capabilities running at maximum production capacity.",
    overrides: {} // Preserves canonical defaults
  },

  // Emergency / Continuity mode during Firestore quota exhaustion or provider outage
  EMERGENCY_MODE: {
    id: "EMERGENCY_MODE",
    nameNe: "आपतकालीन निरन्तरता मोड (Emergency / Continuity)",
    nameEn: "Emergency Continuity Mode",
    descriptionNe: "कोटा वा बाह्य एपीआई समस्यामा महँगा कार्य (AI, TTS, Live, Community) तुरुन्त बन्द, समाचार पाठक सुरक्षित।",
    descriptionEn: "Instantly shuts down Gemini AI, ListenOS generation, Live video, and community writes to preserve zero-cost static reading.",
    overrides: {
      "media.listenos": "public",
      "article.listen": "public",
      "ai.tts": "off",
      "ai.newsroom": "off",
      "ai.translation": "off",
      "ai.ocr": "off",
      "ai.ask_sanatan": "public",
      "media.live": "public",
      "community.writing": "off",
      "notifications.push": "off",
      "revenue.ads": "public",
      "core.news": "public",
      "core.search": "public",
      "infra.snapshotOs": "public"
    }
  }
};
