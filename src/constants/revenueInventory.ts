import { AdPosition } from "@/src/types";

export interface AdInventorySlot {
  id: string;
  key: AdPosition;
  nameEn: string;
  nameNe: string;
  tier: "hero" | "premium" | "native" | "audio" | "district" | "standard";
  placementGroup: "homepage" | "category" | "district" | "article" | "listenos";
  descriptionEn: string;
  descriptionNe: string;
  supportedFormats: ("banner" | "native_card" | "audio_preroll" | "sponsor_badge" | "queue_pill")[];
  dimensions?: string;
  baseCpmRateNpr: number;
  baseCpcRateNpr: number;
  flatMonthlyRateNpr: number;
  fillRatePct: number;
  activeCampaignsCount: number;
}

/**
 * Priority 1: Structured Publisher Ad Inventory Registry
 * 15 Clearly Defined Monetization Placements
 */
export const AD_INVENTORY_REGISTRY: AdInventorySlot[] = [
  // 1. Homepage Group
  {
    id: "inv-hp-1",
    key: "hero_slider",
    nameEn: "Homepage Hero Sponsor",
    nameNe: "गृह पृष्ठ मुख्य हिरो प्रायोजक",
    tier: "hero",
    placementGroup: "homepage",
    descriptionEn: "Top premium takeover & hero slider sponsorship on SanatanMarga main portal.",
    descriptionNe: "गृह पृष्ठको मुख्य समाचार स्लाइडर र शीर्ष स्थानमा उच्च प्रभावकारी ब्रान्डिङ।",
    supportedFormats: ["banner", "native_card"],
    dimensions: "1200x500 px / Responsive",
    baseCpmRateNpr: 280,
    baseCpcRateNpr: 35,
    flatMonthlyRateNpr: 180000,
    fillRatePct: 92,
    activeCampaignsCount: 2
  },
  {
    id: "inv-hp-2",
    key: "homepage_top",
    nameEn: "Homepage Premium Banner",
    nameNe: "गृह पृष्ठ प्रिमियम ब्यानर",
    tier: "premium",
    placementGroup: "homepage",
    descriptionEn: "High-visibility billboard placement beneath the breaking news marquee.",
    descriptionNe: "ताजा खबर पट्टी मुनि रहने प्रमुख दृश्य विज्ञापन स्थान।",
    supportedFormats: ["banner"],
    dimensions: "970x250 px / 728x90 px",
    baseCpmRateNpr: 220,
    baseCpcRateNpr: 28,
    flatMonthlyRateNpr: 120000,
    fillRatePct: 85,
    activeCampaignsCount: 3
  },
  {
    id: "inv-hp-3",
    key: "sponsored_story",
    nameEn: "Homepage Native Sponsored Story",
    nameNe: "गृह पृष्ठ प्रायोजित समाचार कथा (Native Story)",
    tier: "native",
    placementGroup: "homepage",
    descriptionEn: "Editorial-styled sponsored news feature embedded seamlessly in homepage grid.",
    descriptionNe: "गृह पृष्ठको समाचार ग्रिडमा सम्पादकीय ढाँचामा प्रस्तुत गरिने प्रायोजित आलेख।",
    supportedFormats: ["native_card"],
    dimensions: "16:9 Aspect Ratio / Card",
    baseCpmRateNpr: 320,
    baseCpcRateNpr: 45,
    flatMonthlyRateNpr: 150000,
    fillRatePct: 78,
    activeCampaignsCount: 2
  },
  {
    id: "inv-hp-4",
    key: "homepage_mid",
    nameEn: "Homepage Video Sponsor",
    nameNe: "गृह पृष्ठ भिडियो तथा मल्टिमिडिया प्रायोजक",
    tier: "premium",
    placementGroup: "homepage",
    descriptionEn: "Placement directly integrated within Multimedia Zone and Video feeds.",
    descriptionNe: "मल्टिमिडिया जोन र भिडियो स्ट्रिम सेक्सनमा प्रस्तुत गरिने विज्ञापन।",
    supportedFormats: ["banner", "native_card"],
    dimensions: "16:9 Video Box / 800x450 px",
    baseCpmRateNpr: 260,
    baseCpcRateNpr: 32,
    flatMonthlyRateNpr: 95000,
    fillRatePct: 70,
    activeCampaignsCount: 1
  },

  // 2. Category Group
  {
    id: "inv-cat-1",
    key: "category_top",
    nameEn: "Category Sponsor",
    nameNe: "विधागत मुख्य प्रायोजक (Category Sponsor)",
    tier: "premium",
    placementGroup: "category",
    descriptionEn: "Exclusive vertical header sponsorship (e.g. Economy, Politics, Tech, Sports).",
    descriptionNe: "अर्थ, राजनीति, प्रविधि, खेलकुद जस्ता विधागत पृष्ठको शीर्ष प्रायोजन।",
    supportedFormats: ["banner", "sponsor_badge"],
    dimensions: "1140x200 px",
    baseCpmRateNpr: 190,
    baseCpcRateNpr: 24,
    flatMonthlyRateNpr: 75000,
    fillRatePct: 65,
    activeCampaignsCount: 4
  },
  {
    id: "inv-cat-2",
    key: "category_bottom",
    nameEn: "Category Native Story",
    nameNe: "विधागत प्रायोजित समाचार (Category Native Story)",
    tier: "native",
    placementGroup: "category",
    descriptionEn: "In-feed brand story displayed within category feed streams.",
    descriptionNe: "विधागत समाचार फिडभित्र समावेश गरिने ब्रान्डेड आलेख।",
    supportedFormats: ["native_card"],
    dimensions: "Card Feed Format",
    baseCpmRateNpr: 210,
    baseCpcRateNpr: 26,
    flatMonthlyRateNpr: 60000,
    fillRatePct: 60,
    activeCampaignsCount: 2
  },
  {
    id: "inv-cat-3",
    key: "sidebar",
    nameEn: "Category Newsletter Sponsor",
    nameNe: "विधागत न्युजलेटर तथा साइडबार प्रायोजक",
    tier: "standard",
    placementGroup: "category",
    descriptionEn: "Sticky sidebar and newsletter digest branding.",
    descriptionNe: "साइडबार र दैनिक विधागत न्युजलेटरको समर्पित विज्ञापन स्थान।",
    supportedFormats: ["banner"],
    dimensions: "300x600 px / 300x250 px",
    baseCpmRateNpr: 160,
    baseCpcRateNpr: 20,
    flatMonthlyRateNpr: 50000,
    fillRatePct: 82,
    activeCampaignsCount: 5
  },

  // 3. District & Nepal Geography Group
  {
    id: "inv-dist-1",
    key: "mobile_sticky",
    nameEn: "District Sponsor",
    nameNe: "जिल्ला मुख्य प्रायोजक (District Sponsor)",
    tier: "district",
    placementGroup: "district",
    descriptionEn: "Local geo-targeted sponsor on specific Nepal 77 district news hubs.",
    descriptionNe: "नेपालका ७७ जिल्लाका स्थानीय समाचार पृष्ठहरूमा लक्षित स्थानीय व्यावसायिक प्रायोजन।",
    supportedFormats: ["banner", "sponsor_badge"],
    dimensions: "Responsive Geo Banner",
    baseCpmRateNpr: 180,
    baseCpcRateNpr: 22,
    flatMonthlyRateNpr: 35000,
    fillRatePct: 74,
    activeCampaignsCount: 8
  },
  {
    id: "inv-dist-2",
    key: "header",
    nameEn: "District Hero Sponsor",
    nameNe: "जिल्ला विशेष हिरो ब्यानर (District Hero)",
    tier: "district",
    placementGroup: "district",
    descriptionEn: "Prominent district portal banner for municipal business & local tourism.",
    descriptionNe: "पोखरा, काठमाडौं, बुटवल, धरान लगायतका मुख्य सहरका स्थानीय उद्योगीहरूको शीर्ष ब्यानर।",
    supportedFormats: ["banner"],
    dimensions: "1200x280 px",
    baseCpmRateNpr: 240,
    baseCpcRateNpr: 30,
    flatMonthlyRateNpr: 45000,
    fillRatePct: 68,
    activeCampaignsCount: 6
  },

  // 4. Article Reading Group
  {
    id: "inv-art-1",
    key: "article_top",
    nameEn: "Article Sponsor",
    nameNe: "आलेख शीर्ष प्रायोजक (Article Sponsor)",
    tier: "premium",
    placementGroup: "article",
    descriptionEn: "Prominent disclosure header above full-length investigative and breaking stories.",
    descriptionNe: "समाचार तथा आलेखको शीर्ष स्थानमा सम्पादकीय मर्यादा सहितको प्रिमियम ब्रान्डिङ।",
    supportedFormats: ["banner", "sponsor_badge"],
    dimensions: "800x120 px / Responsive",
    baseCpmRateNpr: 250,
    baseCpcRateNpr: 30,
    flatMonthlyRateNpr: 90000,
    fillRatePct: 88,
    activeCampaignsCount: 4
  },
  {
    id: "inv-art-2",
    key: "article_inline",
    nameEn: "Article In-Feed Sponsor",
    nameNe: "आलेख मध्यवर्ती विज्ञापन (In-Feed Sponsor)",
    tier: "standard",
    placementGroup: "article",
    descriptionEn: "Mid-article contextual banner matched to story keywords & districts.",
    descriptionNe: "समाचारको मध्य भागमा पाठकको ध्यानाकर्षण गराउने प्रासंगिक विज्ञापन।",
    supportedFormats: ["banner", "native_card"],
    dimensions: "728x90 px / 300x250 px",
    baseCpmRateNpr: 210,
    baseCpcRateNpr: 25,
    flatMonthlyRateNpr: 70000,
    fillRatePct: 90,
    activeCampaignsCount: 7
  },
  {
    id: "inv-art-3",
    key: "article_bottom",
    nameEn: "Article Audio Sponsor",
    nameNe: "आलेख अडियो तथा समाप्ति प्रायोजक",
    tier: "audio",
    placementGroup: "article",
    descriptionEn: "Positioned alongside the article text-to-speech audio player & comments.",
    descriptionNe: "आलेखको अडियो प्लेयर र पाठक प्रतिक्रिया सेक्सन नजिक रहने विज्ञापन।",
    supportedFormats: ["banner", "native_card"],
    dimensions: "Responsive Card",
    baseCpmRateNpr: 190,
    baseCpcRateNpr: 22,
    flatMonthlyRateNpr: 55000,
    fillRatePct: 75,
    activeCampaignsCount: 3
  },

  // 5. ListenOS Audio Ecosystem Group
  {
    id: "inv-aud-1",
    key: "homepage_bottom",
    nameEn: "ListenOS Sponsor",
    nameNe: "ListenOS मुख्य अडियो प्रायोजक",
    tier: "audio",
    placementGroup: "listenos",
    descriptionEn: "Continuous brand sponsorship on the floating and full-screen ListenOS persistent audio dock.",
    descriptionNe: "ListenOS अडियो प्लेयर डक र समाचार वाचनमा निरन्तर ब्रान्ड उपस्थिति।",
    supportedFormats: ["audio_preroll", "sponsor_badge"],
    dimensions: "Audio Player Badge / Visual Pill",
    baseCpmRateNpr: 350,
    baseCpcRateNpr: 50,
    flatMonthlyRateNpr: 110000,
    fillRatePct: 95,
    activeCampaignsCount: 2
  },
  {
    id: "inv-aud-2",
    key: "homepage_mid",
    nameEn: "ListenOS Pre-Roll Sponsor",
    nameNe: "ListenOS प्री-रोल प्रायोजन (Pre-Roll Voice/Badge)",
    tier: "audio",
    placementGroup: "listenos",
    descriptionEn: "Gentle 4-second audio billboard before news playback begins: 'This briefing is supported by...'",
    descriptionNe: "समाचार वाचन सुरु हुनुअघि ४ सेकेन्डको शिष्ट अडियो सूचना: 'यो बुलेटिनलाई... ले प्रायोजन गरेको छ'।",
    supportedFormats: ["audio_preroll"],
    dimensions: "Audio Stinger / Voiceover",
    baseCpmRateNpr: 400,
    baseCpcRateNpr: 60,
    flatMonthlyRateNpr: 140000,
    fillRatePct: 80,
    activeCampaignsCount: 1
  },
  {
    id: "inv-aud-3",
    key: "category_bottom",
    nameEn: "ListenOS Queue Sponsor",
    nameNe: "ListenOS क्यु प्रायोजक (Queue Sponsor)",
    tier: "audio",
    placementGroup: "listenos",
    descriptionEn: "Featured sponsor banner between queued news stories in the Up Next playlist.",
    descriptionNe: "अडियो प्लेलिस्टको समाचार सूचीबीच प्रदर्शित हुने आकर्षक विज्ञापन।",
    supportedFormats: ["queue_pill", "native_card"],
    dimensions: "Playlist Item Pill",
    baseCpmRateNpr: 200,
    baseCpcRateNpr: 25,
    flatMonthlyRateNpr: 50000,
    fillRatePct: 70,
    activeCampaignsCount: 2
  }
];

/**
 * Priority 9: House Ads Catalog
 * Fills inventory gracefully when no paid campaign is booked
 */
export interface HouseAd {
  id: string;
  type: "download_app" | "listenos" | "knowledge_hub" | "newsletter" | "chautari" | "membership";
  titleEn: string;
  titleNe: string;
  descriptionEn: string;
  descriptionNe: string;
  ctaTextEn: string;
  ctaTextNe: string;
  targetUrl: string;
  badgeEn: string;
  badgeNe: string;
  gradientClass: string;
  iconName: string;
  imageUrl: string;
}

export const DEFAULT_HOUSE_ADS: HouseAd[] = [
  {
    id: "house-1",
    type: "download_app",
    titleEn: "SanatanMarga Offline App",
    titleNe: "सनातनमार्ग मोबाइल एप र अफलाइन रिडिङ",
    descriptionEn: "Read verified news with zero lag, custom font sizing, and offline caching across Nepal.",
    descriptionNe: "इन्टरनेट बिना पनि ताजा समाचार पढ्नुहोस्, अफलाइन क्यासिङ र द्रुत गतिको सुविधा।",
    ctaTextEn: "Install PWA App",
    ctaTextNe: "एप डाउनलोड गर्नुहोस्",
    targetUrl: "/?source=house_app_install",
    badgeEn: "Mobile App",
    badgeNe: "मोबाइल एप",
    gradientClass: "from-rose-600 to-amber-600",
    iconName: "Smartphone",
    imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "house-2",
    type: "listenos",
    titleEn: "ListenOS News Briefing",
    titleNe: "ListenOS: कानमै सुन्नुहोस् आजको मुख्य समाचार",
    descriptionEn: "Turn any story into an AI-narrated Nepali audio bulletin with customizable speeds.",
    descriptionNe: "व्यस्त समयमा पनि नेपाली भाषामा स्पष्ट र शुद्ध अडियो समाचार वाचनको आनन्द लिनुहोस्।",
    ctaTextEn: "Listen Now",
    ctaTextNe: "अडियो सुन्नुहोस्",
    targetUrl: "/latest?listen=true",
    badgeEn: "ListenOS Audio",
    badgeNe: "अडियो बुलेटिन",
    gradientClass: "from-amber-600 to-orange-600",
    iconName: "Headphones",
    imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "house-3",
    type: "knowledge_hub",
    titleEn: "Saraswati Knowledge Graph",
    titleNe: "सरस्वती ज्ञान केन्द्र र वैदिक अभिलेख",
    descriptionEn: "Explore verified historical timelines, 77 Nepal district intelligence, and Vedic scriptures.",
    descriptionNe: "नेपालको ७७ जिल्लाको सांस्कृतिक सम्पदा, इतिहास र वैदिक ज्ञानको एकीकृत भण्डार।",
    ctaTextEn: "Explore Knowledge",
    ctaTextNe: "ज्ञान केन्द्र हेर्नुहोस्",
    targetUrl: "/knowledge",
    badgeEn: "Knowledge Graph",
    badgeNe: "ज्ञान केन्द्र",
    gradientClass: "from-indigo-600 to-sky-600",
    iconName: "BookOpen",
    imageUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "house-4",
    type: "newsletter",
    titleEn: "Daily Morning Digest",
    titleNe: "दैनिक बिहानी पञ्चाङ्ग तथा समाचार न्युजलेटर",
    descriptionEn: "Receive daily verified Nepal headlines, market updates, and Panchanga in your inbox.",
    descriptionNe: "हरेक बिहान मुख्य समाचार, सेयर बजार र तिथि-पञ्चाङ्ग सिधै आफ्नो इमेलमा प्राप्त गर्नुहोस्।",
    ctaTextEn: "Subscribe Free",
    ctaTextNe: "निःशुल्क सदस्यता लिनुहोस्",
    targetUrl: "/#newsletter",
    badgeEn: "Daily Digest",
    badgeNe: "दैनिक न्युजलेटर",
    gradientClass: "from-emerald-600 to-teal-600",
    iconName: "Mail",
    imageUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "house-5",
    type: "chautari",
    titleEn: "Chautari Reader Community",
    titleNe: "चौतारी: सचेत नागरिक र पाठकहरूको मञ्च",
    descriptionEn: "Engage in verified civic discussions, local community festivals, and opinion exchanges.",
    descriptionNe: "तथ्यमा आधारित स्वस्थ बहस, स्थानीय चाडपर्व र नागरिक संवादमा सहभागी बन्नुहोस्।",
    ctaTextEn: "Join Community",
    ctaTextNe: "चौतारीमा जोडिनुहोस्",
    targetUrl: "/community",
    badgeEn: "Chautari Forum",
    badgeNe: "नागरिक चौतारी",
    gradientClass: "from-purple-600 to-pink-600",
    iconName: "Users",
    imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "house-6",
    type: "membership",
    titleEn: "SanatanMarga Patron Membership",
    titleNe: "सनातनमार्ग संरक्षक सदस्यता (Patron Circle)",
    descriptionEn: "Support independent, verified journalism across Nepal. Ad-free reading & exclusive archives.",
    descriptionNe: "स्वतन्त्र र सत्यनिष्ठ पत्रकारितालाई साथ दिनुहोस्। विज्ञापनरहित अनुभव र विशेष अनुसन्धान।",
    ctaTextEn: "Become a Patron",
    ctaTextNe: "संरक्षक बन्नुहोस्",
    targetUrl: "/membership",
    badgeEn: "Support Journalism",
    badgeNe: "मिडिया सदस्यता",
    gradientClass: "from-amber-700 to-yellow-600",
    iconName: "ShieldCheck",
    imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=800"
  }
];

/**
 * Priority 7: Advertiser Quality Score (AQS) Mock / Seed Registry
 */
export interface AdvertiserScoreRecord {
  id: string;
  advertiserName: string;
  category: string;
  score: number; // 0-100
  tier: "trusted_partner" | "gold" | "silver" | "bronze";
  campaignCompletionRate: number;
  policyComplianceScore: number;
  creativeQualityRating: number;
  paymentHistoryScore: number;
  userComplaintsCount: number;
  autoApproveEligible: boolean;
  totalSpentNpr: number;
}

export const SAMPLE_ADVERTISER_SCORES: AdvertiserScoreRecord[] = [
  {
    id: "adv-ntc",
    advertiserName: "नेपाल टेलिकम (Nepal Telecom)",
    category: "Telecommunications",
    score: 98,
    tier: "trusted_partner",
    campaignCompletionRate: 100,
    policyComplianceScore: 100,
    creativeQualityRating: 4.9,
    paymentHistoryScore: 100,
    userComplaintsCount: 0,
    autoApproveEligible: true,
    totalSpentNpr: 1450000
  },
  {
    id: "adv-global",
    advertiserName: "ग्लोबल आइएमई बैंक (Global IME Bank)",
    category: "Banking & Finance",
    score: 94,
    tier: "trusted_partner",
    campaignCompletionRate: 98,
    policyComplianceScore: 98,
    creativeQualityRating: 4.8,
    paymentHistoryScore: 96,
    userComplaintsCount: 1,
    autoApproveEligible: true,
    totalSpentNpr: 820000
  },
  {
    id: "adv-dabur",
    advertiserName: "डाबर नेपाल (Dabur Nepal)",
    category: "Ayurveda & FMCG",
    score: 88,
    tier: "gold",
    campaignCompletionRate: 95,
    policyComplianceScore: 94,
    creativeQualityRating: 4.5,
    paymentHistoryScore: 92,
    userComplaintsCount: 2,
    autoApproveEligible: true,
    totalSpentNpr: 430000
  },
  {
    id: "adv-nic",
    advertiserName: "एनआईसी एशिया बैंक",
    category: "Banking & Financial Services",
    score: 82,
    tier: "gold",
    campaignCompletionRate: 90,
    policyComplianceScore: 92,
    creativeQualityRating: 4.2,
    paymentHistoryScore: 88,
    userComplaintsCount: 3,
    autoApproveEligible: false,
    totalSpentNpr: 350000
  },
  {
    id: "adv-fewa",
    advertiserName: "फेवा लेक साइड रिसोर्ट (Fewa Lake Resort)",
    category: "Tourism & Hospitality (Pokhara)",
    score: 75,
    tier: "silver",
    campaignCompletionRate: 85,
    policyComplianceScore: 88,
    creativeQualityRating: 4.0,
    paymentHistoryScore: 80,
    userComplaintsCount: 0,
    autoApproveEligible: false,
    totalSpentNpr: 120000
  },
  {
    id: "adv-karnali",
    advertiserName: "कर्णाली प्राङ्गारिक उद्योग (Karnali Organics)",
    category: "Agriculture & Local Enterprise (Dailekh)",
    score: 68,
    tier: "bronze",
    campaignCompletionRate: 80,
    policyComplianceScore: 85,
    creativeQualityRating: 3.8,
    paymentHistoryScore: 75,
    userComplaintsCount: 1,
    autoApproveEligible: false,
    totalSpentNpr: 45000
  }
];

/**
 * Priority 10: Membership Revenue Tiers
 */
export interface MembershipTierData {
  id: string;
  nameEn: string;
  nameNe: string;
  monthlyNpr: number;
  annualNpr: number;
  activeSubscribers: number;
  mrrNpr: number;
  retentionRatePct: number;
  churnRatePct: number;
  ltvNpr: number;
  badgeColor: string;
  features: string[];
}

export const MEMBERSHIP_TIERS: MembershipTierData[] = [
  {
    id: "free",
    nameEn: "Free Patron",
    nameNe: "साधारण पाठक (Free Patron)",
    monthlyNpr: 0,
    annualNpr: 0,
    activeSubscribers: 42500,
    mrrNpr: 0,
    retentionRatePct: 78.4,
    churnRatePct: 4.5,
    ltvNpr: 0,
    badgeColor: "bg-slate-500",
    features: ["All news articles", "Daily audio headlines", "Public Knowledge Graph access", "Community comments"]
  },
  {
    id: "sadhak",
    nameEn: "Sadhak Tier",
    nameNe: "साधक सदस्य (Sadhak Tier)",
    monthlyNpr: 299,
    annualNpr: 2990,
    activeSubscribers: 1840,
    mrrNpr: 550160,
    retentionRatePct: 93.5,
    churnRatePct: 2.1,
    ltvNpr: 4200,
    badgeColor: "bg-blue-600",
    features: ["Ad-free high speed reading", "Full ListenOS playlist sync", "Sadhak badge in Chautari", "Weekly investigative analysis"]
  },
  {
    id: "sanrakshak",
    nameEn: "Sanrakshak Tier",
    nameNe: "संरक्षक सदस्य (Sanrakshak Tier)",
    monthlyNpr: 999,
    annualNpr: 9990,
    activeSubscribers: 380,
    mrrNpr: 379620,
    retentionRatePct: 96.8,
    churnRatePct: 1.2,
    ltvNpr: 15800,
    badgeColor: "bg-amber-600",
    features: ["Everything in Sadhak", "Sanrakshak Honor Wall listing", "Monthly editorial briefing with editors", "Full Vedic archive & manuscript downloads"]
  },
  {
    id: "corporate",
    nameEn: "Corporate Patron",
    nameNe: "संस्थागत संरक्षक (Corporate Patron)",
    monthlyNpr: 4999,
    annualNpr: 49990,
    activeSubscribers: 45,
    mrrNpr: 224955,
    retentionRatePct: 98.5,
    churnRatePct: 0.8,
    ltvNpr: 78000,
    badgeColor: "bg-emerald-600",
    features: ["Multi-user organization seats (10 users)", "Saraswati Knowledge Graph Data API access", "District intelligence database export", "Priority sponsor governance & verified partner badge"]
  }
];

/**
 * Priority 11: Rate Card Matrix (Publisher Commercial Pricing Model)
 */
export interface RateCardSlot {
  slotId: string;
  key: AdPosition;
  nameNe: string;
  nameEn: string;
  placementGroup: "homepage" | "category" | "district" | "article" | "listenos";
  dailyRateNpr: number;
  weeklyRateNpr: number;
  monthlyRateNpr: number;
  cpmRateNpr: number;
  minDurationDays: number;
  categoryPremiumPct: {
    economy: number;
    politics: number;
    technology: number;
    sports: number;
    dharma: number;
  };
  districtPremiumPct: {
    kathmandu: number;
    kaski: number;
    morang: number;
    rupandehi: number;
    chitwan: number;
    nationwide: number;
  };
}

export const RATE_CARD_MATRIX: RateCardSlot[] = [
  {
    slotId: "rc-hp-1",
    key: "hero_slider",
    nameNe: "गृह पृष्ठ मुख्य हिरो प्रायोजक",
    nameEn: "Homepage Hero Sponsor",
    placementGroup: "homepage",
    dailyRateNpr: 8000,
    weeklyRateNpr: 48000,
    monthlyRateNpr: 180000,
    cpmRateNpr: 280,
    minDurationDays: 3,
    categoryPremiumPct: { economy: 25, politics: 30, technology: 15, sports: 10, dharma: 10 },
    districtPremiumPct: { kathmandu: 25, kaski: 15, morang: 10, rupandehi: 10, chitwan: 10, nationwide: 0 }
  },
  {
    slotId: "rc-hp-2",
    key: "homepage_top",
    nameNe: "गृह पृष्ठ प्रिमियम ब्यानर",
    nameEn: "Homepage Premium Banner",
    placementGroup: "homepage",
    dailyRateNpr: 5500,
    weeklyRateNpr: 32000,
    monthlyRateNpr: 120000,
    cpmRateNpr: 220,
    minDurationDays: 3,
    categoryPremiumPct: { economy: 20, politics: 20, technology: 15, sports: 10, dharma: 10 },
    districtPremiumPct: { kathmandu: 25, kaski: 15, morang: 10, rupandehi: 10, chitwan: 10, nationwide: 0 }
  },
  {
    slotId: "rc-hp-3",
    key: "sponsored_story",
    nameNe: "गृह पृष्ठ प्रायोजित समाचार कथा (Native Story)",
    nameEn: "Homepage Native Sponsored Story",
    placementGroup: "homepage",
    dailyRateNpr: 7000,
    weeklyRateNpr: 42000,
    monthlyRateNpr: 150000,
    cpmRateNpr: 320,
    minDurationDays: 7,
    categoryPremiumPct: { economy: 30, politics: 15, technology: 25, sports: 15, dharma: 15 },
    districtPremiumPct: { kathmandu: 30, kaski: 20, morang: 15, rupandehi: 15, chitwan: 15, nationwide: 0 }
  },
  {
    slotId: "rc-hp-4",
    key: "homepage_mid",
    nameNe: "गृह पृष्ठ भिडियो तथा मल्टिमिडिया प्रायोजक",
    nameEn: "Homepage Video Sponsor",
    placementGroup: "homepage",
    dailyRateNpr: 4500,
    weeklyRateNpr: 26000,
    monthlyRateNpr: 95000,
    cpmRateNpr: 260,
    minDurationDays: 3,
    categoryPremiumPct: { economy: 20, politics: 20, technology: 20, sports: 25, dharma: 10 },
    districtPremiumPct: { kathmandu: 20, kaski: 15, morang: 10, rupandehi: 10, chitwan: 10, nationwide: 0 }
  },
  {
    slotId: "rc-cat-1",
    key: "category_top",
    nameNe: "विधागत मुख्य प्रायोजक (Category Header)",
    nameEn: "Category Sponsor",
    placementGroup: "category",
    dailyRateNpr: 3500,
    weeklyRateNpr: 20000,
    monthlyRateNpr: 75000,
    cpmRateNpr: 190,
    minDurationDays: 3,
    categoryPremiumPct: { economy: 35, politics: 25, technology: 20, sports: 15, dharma: 15 },
    districtPremiumPct: { kathmandu: 20, kaski: 15, morang: 10, rupandehi: 10, chitwan: 10, nationwide: 0 }
  },
  {
    slotId: "rc-cat-2",
    key: "category_bottom",
    nameNe: "विधागत प्रायोजित समाचार (Category Feed)",
    nameEn: "Category Native Story",
    placementGroup: "category",
    dailyRateNpr: 2800,
    weeklyRateNpr: 16000,
    monthlyRateNpr: 60000,
    cpmRateNpr: 210,
    minDurationDays: 5,
    categoryPremiumPct: { economy: 30, politics: 20, technology: 20, sports: 15, dharma: 15 },
    districtPremiumPct: { kathmandu: 20, kaski: 15, morang: 10, rupandehi: 10, chitwan: 10, nationwide: 0 }
  },
  {
    slotId: "rc-cat-3",
    key: "sidebar",
    nameNe: "विधागत न्युजलेटर तथा साइडबार प्रायोजक",
    nameEn: "Category Newsletter Sponsor",
    placementGroup: "category",
    dailyRateNpr: 2400,
    weeklyRateNpr: 14000,
    monthlyRateNpr: 50000,
    cpmRateNpr: 160,
    minDurationDays: 3,
    categoryPremiumPct: { economy: 25, politics: 20, technology: 15, sports: 10, dharma: 10 },
    districtPremiumPct: { kathmandu: 20, kaski: 10, morang: 10, rupandehi: 10, chitwan: 10, nationwide: 0 }
  },
  {
    slotId: "rc-dist-1",
    key: "mobile_sticky",
    nameNe: "जिल्ला मुख्य प्रायोजक (District Sponsor)",
    nameEn: "District Sponsor",
    placementGroup: "district",
    dailyRateNpr: 1600,
    weeklyRateNpr: 9500,
    monthlyRateNpr: 35000,
    cpmRateNpr: 180,
    minDurationDays: 7,
    categoryPremiumPct: { economy: 15, politics: 15, technology: 10, sports: 10, dharma: 15 },
    districtPremiumPct: { kathmandu: 40, kaski: 30, morang: 20, rupandehi: 20, chitwan: 20, nationwide: 0 }
  },
  {
    slotId: "rc-dist-2",
    key: "header",
    nameNe: "जिल्ला विशेष हिरो ब्यानर (District Hero)",
    nameEn: "District Hero Sponsor",
    placementGroup: "district",
    dailyRateNpr: 2200,
    weeklyRateNpr: 12500,
    monthlyRateNpr: 45000,
    cpmRateNpr: 240,
    minDurationDays: 5,
    categoryPremiumPct: { economy: 20, politics: 15, technology: 10, sports: 10, dharma: 15 },
    districtPremiumPct: { kathmandu: 40, kaski: 30, morang: 25, rupandehi: 25, chitwan: 25, nationwide: 0 }
  },
  {
    slotId: "rc-art-1",
    key: "article_top",
    nameNe: "आलेख शीर्ष प्रायोजक (Article Header)",
    nameEn: "Article Sponsor",
    placementGroup: "article",
    dailyRateNpr: 4200,
    weeklyRateNpr: 24000,
    monthlyRateNpr: 90000,
    cpmRateNpr: 250,
    minDurationDays: 3,
    categoryPremiumPct: { economy: 25, politics: 25, technology: 15, sports: 10, dharma: 15 },
    districtPremiumPct: { kathmandu: 25, kaski: 15, morang: 10, rupandehi: 10, chitwan: 10, nationwide: 0 }
  },
  {
    slotId: "rc-art-2",
    key: "article_inline",
    nameNe: "आलेख मध्यवर्ती विज्ञापन (In-Feed Contextual)",
    nameEn: "Article In-Feed Sponsor",
    placementGroup: "article",
    dailyRateNpr: 3200,
    weeklyRateNpr: 19000,
    monthlyRateNpr: 70000,
    cpmRateNpr: 210,
    minDurationDays: 3,
    categoryPremiumPct: { economy: 20, politics: 20, technology: 15, sports: 15, dharma: 10 },
    districtPremiumPct: { kathmandu: 25, kaski: 15, morang: 10, rupandehi: 10, chitwan: 10, nationwide: 0 }
  },
  {
    slotId: "rc-art-3",
    key: "article_bottom",
    nameNe: "आलेख अडियो तथा समाप्ति प्रायोजक",
    nameEn: "Article Audio Sponsor",
    placementGroup: "article",
    dailyRateNpr: 2600,
    weeklyRateNpr: 15000,
    monthlyRateNpr: 55000,
    cpmRateNpr: 190,
    minDurationDays: 3,
    categoryPremiumPct: { economy: 15, politics: 15, technology: 15, sports: 10, dharma: 15 },
    districtPremiumPct: { kathmandu: 20, kaski: 15, morang: 10, rupandehi: 10, chitwan: 10, nationwide: 0 }
  },
  {
    slotId: "rc-aud-1",
    key: "homepage_bottom",
    nameNe: "ListenOS मुख्य अडियो प्रायोजक (Audio Dock)",
    nameEn: "ListenOS Sponsor",
    placementGroup: "listenos",
    dailyRateNpr: 5000,
    weeklyRateNpr: 30000,
    monthlyRateNpr: 110000,
    cpmRateNpr: 350,
    minDurationDays: 5,
    categoryPremiumPct: { economy: 20, politics: 20, technology: 20, sports: 15, dharma: 15 },
    districtPremiumPct: { kathmandu: 25, kaski: 20, morang: 15, rupandehi: 15, chitwan: 15, nationwide: 0 }
  },
  {
    slotId: "rc-aud-2",
    key: "homepage_mid",
    nameNe: "ListenOS प्री-रोल प्रायोजन (Pre-Roll Voice/Badge)",
    nameEn: "ListenOS Pre-Roll Sponsor",
    placementGroup: "listenos",
    dailyRateNpr: 6500,
    weeklyRateNpr: 38000,
    monthlyRateNpr: 140000,
    cpmRateNpr: 400,
    minDurationDays: 5,
    categoryPremiumPct: { economy: 25, politics: 25, technology: 20, sports: 20, dharma: 15 },
    districtPremiumPct: { kathmandu: 30, kaski: 20, morang: 15, rupandehi: 15, chitwan: 15, nationwide: 0 }
  },
  {
    slotId: "rc-aud-3",
    key: "category_bottom",
    nameNe: "ListenOS क्यु प्रायोजक (Playlist Next Sponsor)",
    nameEn: "ListenOS Queue Sponsor",
    placementGroup: "listenos",
    dailyRateNpr: 2400,
    weeklyRateNpr: 14000,
    monthlyRateNpr: 50000,
    cpmRateNpr: 200,
    minDurationDays: 3,
    categoryPremiumPct: { economy: 15, politics: 15, technology: 15, sports: 10, dharma: 10 },
    districtPremiumPct: { kathmandu: 20, kaski: 15, morang: 10, rupandehi: 10, chitwan: 10, nationwide: 0 }
  }
];

/**
 * Priority 12: Commercial Sponsorship Packages Catalog
 */
export interface SponsorshipPackage {
  id: string;
  key: string;
  nameNe: string;
  nameEn: string;
  category: "festival" | "province" | "business" | "heritage";
  pricingNpr: number;
  duration: string;
  discountPct: number;
  badge: string;
  descriptionNe: string;
  descriptionEn: string;
  includedPlacements: string[];
  expectedImpressions: string;
  expectedReach: string;
  features: string[];
}

export const SPONSORSHIP_PACKAGES: SponsorshipPackage[] = [
  {
    id: "pkg-fest-1",
    key: "festival_grand",
    nameNe: "महापर्व दशैं-तिहार-महाशिवरात्रि विशेष प्याकेज (Festival Mega Package)",
    nameEn: "Festival & Mahotsav Mega Package",
    category: "festival",
    pricingNpr: 250000,
    duration: "१५ दिन (Peak Festival Window)",
    discountPct: 28,
    badge: "Most Popular for Brands",
    descriptionNe: "नेपालका महान चाडपर्वहरूमा सम्पूर्ण डिजिटल पोर्टल, अडियो स्ट्रिम र सामाजिक फिडमा सर्वोच्च ब्रान्डिङ।",
    descriptionEn: "High-impact cross-platform takeover across Homepage Hero, Live Stream broadcast, and Push Notifications during major festivals.",
    includedPlacements: [
      "Homepage Hero Slider Takeover (१००% SOV)",
      "प्रत्यक्ष लाइभ स्ट्रिम 'Presented By' ब्यानर",
      "दैनिक बिहानी पञ्चाङ्ग तथा न्युजलेटर शीर्ष ब्रान्ड",
      "१ वटा विशिष्ट प्रायोजित आलेख (Sponsored Deep-Dive)"
    ],
    expectedImpressions: "६,५०,०००+ Views",
    expectedReach: "२,२०,०००+ Unique Readers",
    features: [
      "Exclusive Festival Hub Branding",
      "Instant push notification brand mention",
      "Social media Chautari pinned post",
      "Zero-lag SnapshotOS cached delivery"
    ]
  },
  {
    id: "pkg-prov-1",
    key: "province_dominance",
    nameNe: "प्रादेशिक अधिपत्य प्याकेज (Province Dominance Package)",
    nameEn: "Province Dominance Package (Bagmati/Gandaki/Koshi)",
    category: "province",
    pricingNpr: 120000,
    duration: "३० दिन (१ महिना)",
    discountPct: 22,
    badge: "Regional Enterprise",
    descriptionNe: "बागमती, गण्डकी, कोशी वा लुम्बिनी प्रदेशका सम्पूर्ण जिल्ला समाचार पृष्ठहरूमा १००% स्थानीय उपस्थिति।",
    descriptionEn: "Dominate regional audience across selected province's district news hubs and municipality feeds with localized messaging.",
    includedPlacements: [
      "छनोट गरिएको प्रदेशका सम्पूर्ण जिल्ला शीर्ष ब्यानर (District Hero)",
      "स्थानीय नगरपालिका समाचार फिडमा Contextual Ads",
      "२ वटा स्थानीय व्यावसायिक सफलता कथा (Brand Stories)"
    ],
    expectedImpressions: "३,४०,०००+ Views",
    expectedReach: "१,१०,०००+ Local Citizens",
    features: [
      "100% Geo-Fenced to chosen Province/Districts",
      "High local conversion CTR (avg 3.6%)",
      "District business directory verified tag"
    ]
  },
  {
    id: "pkg-biz-1",
    key: "nepse_economy",
    nameNe: "अर्थ, बैंक एवं सेयरबजार नेतृत्व प्याकेज (NEPSE & Corporate Leader)",
    nameEn: "Economy & NEPSE Corporate Leader",
    category: "business",
    pricingNpr: 175000,
    duration: "३० दिन (१ महिना)",
    discountPct: 20,
    badge: "Financial & Tech",
    descriptionNe: "दैनिक सेयर बजार (NEPSE) लाइभ अपडेट, वित्तीय विश्लेषण र अर्थ विधामा प्रमुख प्रायोजक।",
    descriptionEn: "Exclusive sponsorship for Banks, Insurance, Fintech, and Real Estate across live market data and daily business briefing.",
    includedPlacements: [
      "Economy Category Top Billboard (१००% SOV)",
      "Live NEPSE Market Ticker 'Powered By' Badge",
      "दैनिक आर्थिक न्युजलेटर शीर्ष स्थान",
      "ListenOS वित्तीय बुलेटिन प्री-रोल प्रायोजन"
    ],
    expectedImpressions: "४,८०,०००+ Business Views",
    expectedReach: "१,५०,०००+ Investors & Decision Makers",
    features: [
      "High-income demographic reach",
      "Interactive stock widget logo presence",
      "Weekly market analysis co-branding"
    ]
  },
  {
    id: "pkg-cult-1",
    key: "heritage_tourism",
    nameNe: "सनातन ज्ञान एवं सांस्कृतिक सम्पदा प्याकेज (Heritage & Tourism)",
    nameEn: "Saraswati Heritage & Tourism Package",
    category: "heritage",
    pricingNpr: 95000,
    duration: "३० दिन (१ महिना)",
    discountPct: 25,
    badge: "Culture & Hospitality",
    descriptionNe: "सरस्वती ज्ञान केन्द्र, नेपालका मन्दिर-सम्पदा निर्देशिका र सांस्कृतिक यात्रा आलेखहरूको विशेष सहकार्य।",
    descriptionEn: "Perfect for Eco-Resorts, Ayurvedic brands, Cultural Institutions, and Heritage Tourism across Saraswati Knowledge Graph.",
    includedPlacements: [
      "Saraswati Knowledge Graph Header Banner",
      "नेपाल तीर्थस्थल तथा सम्पदा निर्देशिका प्रायोजन",
      "१ वटा सांस्कृतिक वृत्तचित्र/आलेख फिचर"
    ],
    expectedImpressions: "२,५०,०००+ Cultured Views",
    expectedReach: "९५,०००+ Heritage Seekers",
    features: [
      "Permanent inclusion in Saraswati Knowledge Graph archives",
      "High trust and spiritual engagement",
      "Non-intrusive elegant presentation"
    ]
  }
];

/**
 * Priority 13: Nepal Tax, Invoicing & VAT Compliance Engine (13% VAT, PAN validation, TDS)
 */
export interface TaxInvoiceRecord {
  id: string;
  invoiceNumber: string; // Format: SM-INV-2083-XXXX
  advertiserId: string;
  advertiserName: string;
  advertiserPan: string; // 9-digit IRD PAN
  advertiserAddress: string;
  campaignTitle: string;
  invoiceDate: string;
  dueDate: string;
  taxableAmountNpr: number;
  vatRatePct: number; // 13%
  vatAmountNpr: number;
  tdsRatePct: number; // 1.5%
  tdsAmountNpr: number;
  totalPayableNpr: number;
  netReceivableNpr: number; // Total Payable minus Advance TDS
  paymentStatus: "paid" | "unpaid" | "partially_paid" | "overdue";
  paymentMethod?: "esewa" | "khalti" | "connectips" | "fonepay" | "bank_transfer";
  paymentReference?: string;
  notes?: string;
}

export const SAMPLE_TAX_INVOICES: TaxInvoiceRecord[] = [
  {
    id: "inv-2083-001",
    invoiceNumber: "SM-INV-2083-0142",
    advertiserId: "adv-ntc",
    advertiserName: "नेपाल टेलिकम (Nepal Telecom Limited)",
    advertiserPan: "300054210",
    advertiserAddress: "भद्रकाली प्लाजा, काठमाडौँ",
    campaignTitle: "4G/5G डेटा र फाइबर इन्टरनेट राष्ट्रिय प्रवर्द्धन",
    invoiceDate: "2026-08-01",
    dueDate: "2026-08-25",
    taxableAmountNpr: 180000,
    vatRatePct: 13,
    vatAmountNpr: 23400,
    tdsRatePct: 1.5,
    tdsAmountNpr: 2700,
    totalPayableNpr: 203400,
    netReceivableNpr: 200700,
    paymentStatus: "paid",
    paymentMethod: "bank_transfer",
    paymentReference: "NBL-TXN-98421045",
    notes: "साउन महिनाको गृह पृष्ठ हिरो प्रायोजन भुक्तानी सम्पन्न।"
  },
  {
    id: "inv-2083-002",
    invoiceNumber: "SM-INV-2083-0143",
    advertiserId: "adv-global",
    advertiserName: "ग्लोबल आइएमई बैंक लिमिटेड",
    advertiserPan: "301289456",
    advertiserAddress: "कमलादी, काठमाडौँ",
    campaignTitle: "ग्लोबल स्मार्ट प्लस मोबाइल बैंकिङ अभियान",
    invoiceDate: "2026-08-10",
    dueDate: "2026-08-30",
    taxableAmountNpr: 120000,
    vatRatePct: 13,
    vatAmountNpr: 15600,
    tdsRatePct: 1.5,
    tdsAmountNpr: 1800,
    totalPayableNpr: 135600,
    netReceivableNpr: 133800,
    paymentStatus: "paid",
    paymentMethod: "connectips",
    paymentReference: "CIPS-2083-847291",
    notes: "गृह पृष्ठ प्रिमियम ब्यानर तथा अर्थ पृष्ठ प्रायोजन।"
  },
  {
    id: "inv-2083-003",
    invoiceNumber: "SM-INV-2083-0144",
    advertiserId: "adv-fewa",
    advertiserName: "फेवा लेक साइड रिसोर्ट प्रा. लि.",
    advertiserPan: "601824901",
    advertiserAddress: "लेकसाइड ६, पोखरा (कास्की)",
    campaignTitle: "पोखरा मनसुन तथा फेस्टिभल हलिडे प्याकेज",
    invoiceDate: "2026-08-15",
    dueDate: "2026-09-05",
    taxableAmountNpr: 45000,
    vatRatePct: 13,
    vatAmountNpr: 5850,
    tdsRatePct: 1.5,
    tdsAmountNpr: 675,
    totalPayableNpr: 50850,
    netReceivableNpr: 50175,
    paymentStatus: "unpaid",
    notes: "कास्की जिल्ला हब मुख्य प्रायोजक सम्झौता।"
  },
  {
    id: "inv-2083-004",
    invoiceNumber: "SM-INV-2083-0145",
    advertiserId: "adv-karnali",
    advertiserName: "कर्णाली प्राङ्गारिक उद्योग प्रा. लि.",
    advertiserPan: "604512398",
    advertiserAddress: "नारायण नगरपालिका १, दैलेख",
    campaignTitle: "कर्णालीको शुद्ध हिमाली सिमी तथा मह ब्रान्डिङ",
    invoiceDate: "2026-07-20",
    dueDate: "2026-08-10",
    taxableAmountNpr: 20000,
    vatRatePct: 13,
    vatAmountNpr: 2600,
    tdsRatePct: 1.5,
    tdsAmountNpr: 300,
    totalPayableNpr: 22600,
    netReceivableNpr: 22300,
    paymentStatus: "overdue",
    notes: "म्याद समाप्त भइसकेकोले ताकेता इमेल प्रेषित।"
  }
];

/**
 * Priority 14: Campaign Forecasting & Impression Estimator Algorithm
 */
export interface ForecastInput {
  slotKeys: AdPosition[];
  districts?: string[];
  province?: string;
  category?: string;
  durationDays: number;
  dailyBudgetNpr?: number;
  daypartingHours?: "all_day" | "morning_peak" | "evening_peak" | "business_hours";
}

export interface ForecastOutput {
  expectedImpressions: number;
  expectedReachUnique: number;
  estimatedCtrPct: number;
  estimatedClicks: number;
  baseCostNpr: number;
  discountPct: number;
  taxableCostNpr: number;
  vat13PctNpr: number;
  tds15PctNpr: number;
  totalCostNpr: number;
  availableCapacityPct: number;
  confidenceScore: "High" | "Medium" | "Estimated";
}

export function calculateCampaignForecast(input: ForecastInput): ForecastOutput {
  const { slotKeys, districts = [], category = "all", durationDays = 7, daypartingHours = "all_day" } = input;
  
  let totalDailyImpressions = 0;
  let totalDailyBaseCost = 0;
  let weightedCtrSum = 0;

  slotKeys.forEach(key => {
    const slot = AD_INVENTORY_REGISTRY.find(s => s.key === key) || AD_INVENTORY_REGISTRY[0];
    const rate = RATE_CARD_MATRIX.find(r => r.key === key) || RATE_CARD_MATRIX[0];
    
    // Base daily estimate per slot
    let dailySlotImp = (slot.flatMonthlyRateNpr / (slot.baseCpmRateNpr || 200)) * 1000 / 30;
    let dailySlotCost = rate.dailyRateNpr;

    // Geo-multiplier
    if (districts.length > 0 && !districts.includes("all")) {
      const isMetro = districts.some(d => ["काठमाडौं", "कास्की", "चितवन", "kathmandu", "kaski", "chitwan"].includes(d.toLowerCase()));
      if (isMetro) {
        dailySlotImp = dailySlotImp * 0.45; // Metro share of traffic
        dailySlotCost = dailySlotCost * 1.25; // Metro premium
      } else {
        dailySlotImp = dailySlotImp * 0.15; // Local district traffic
        dailySlotCost = dailySlotCost * 0.85; // Local district discount
      }
    }

    // Category multiplier
    if (category === "economy") {
      dailySlotCost = dailySlotCost * 1.25;
    } else if (category === "technology" || category === "politics") {
      dailySlotCost = dailySlotCost * 1.15;
    }

    // Dayparting factor
    if (daypartingHours === "morning_peak" || daypartingHours === "evening_peak") {
      dailySlotImp = dailySlotImp * 0.65;
    } else if (daypartingHours === "business_hours") {
      dailySlotImp = dailySlotImp * 0.55;
    }

    totalDailyImpressions += dailySlotImp;
    totalDailyBaseCost += dailySlotCost;
    weightedCtrSum += (slot.tier === "native" ? 4.2 : slot.tier === "hero" ? 3.8 : slot.tier === "audio" ? 3.5 : 2.8);
  });

  const avgCtr = slotKeys.length > 0 ? (weightedCtrSum / slotKeys.length) : 3.2;
  const rawImpressions = Math.round(totalDailyImpressions * durationDays);
  const rawReach = Math.round(rawImpressions * 0.48); // Unique user ratio model
  const expectedClicks = Math.round((rawImpressions * avgCtr) / 100);

  // Duration Discount Model (7 days = 0%, 15 days = 10%, 30 days = 20%, 90 days = 35%)
  let discountPct = 0;
  if (durationDays >= 90) discountPct = 35;
  else if (durationDays >= 30) discountPct = 20;
  else if (durationDays >= 15) discountPct = 10;

  const baseCost = Math.round(totalDailyBaseCost * durationDays);
  const taxableCost = Math.round(baseCost * (1 - discountPct / 100));
  const vatAmount = Math.round(taxableCost * 0.13);
  const tdsAmount = Math.round(taxableCost * 0.015);
  const totalCost = taxableCost + vatAmount;

  return {
    expectedImpressions: Math.max(rawImpressions, 5000),
    expectedReachUnique: Math.max(rawReach, 2000),
    estimatedCtrPct: Number(avgCtr.toFixed(2)),
    estimatedClicks: Math.max(expectedClicks, 150),
    baseCostNpr: baseCost,
    discountPct,
    taxableCostNpr: taxableCost,
    vat13PctNpr: vatAmount,
    tds15PctNpr: tdsAmount,
    totalCostNpr: totalCost,
    availableCapacityPct: 84, // Real-time estimated capacity
    confidenceScore: durationDays > 14 ? "High" : "Estimated"
  };
}


/**
 * Priority 8: Creative Review Pipeline Workflow States
 */
export const CREATIVE_REVIEW_STAGES = [
  { id: "draft", labelEn: "Draft", labelNe: "मस्यौदा (Draft)", color: "bg-slate-500 text-white" },
  { id: "pending_review", labelEn: "Pending Review", labelNe: "समीक्षा प्रतिक्षा (Pending)", color: "bg-amber-500 text-white" },
  { id: "needs_changes", labelEn: "Needs Changes", labelNe: "परिमार्जन आवश्यक (Needs Changes)", color: "bg-orange-500 text-white" },
  { id: "approved", labelEn: "Approved", labelNe: "स्वीकृत (Approved)", color: "bg-teal-600 text-white" },
  { id: "scheduled", labelEn: "Scheduled", labelNe: "तालिकाबद्ध (Scheduled)", color: "bg-blue-600 text-white" },
  { id: "active", labelEn: "Active / Live", labelNe: "सक्रिय (Live)", color: "bg-emerald-600 text-white" },
  { id: "completed", labelEn: "Completed", labelNe: "सम्पन्न (Completed)", color: "bg-purple-600 text-white" },
  { id: "archived", labelEn: "Archived", labelNe: "अभिलेख (Archived)", color: "bg-gray-600 text-white" }
];
