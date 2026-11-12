import { NEPAL_PROVINCES } from "./adEngine";

export interface AdProduct {
  id: string;
  category: "Precision Display" | "Sponsored Knowledge" | "Live & Presenting" | "Geographic & Regional" | "Ecosystem Commerce";
  titleEn: string;
  titleNe: string;
  subtitleEn: string;
  subtitleNe: string;
  descriptionEn: string;
  inventorySource: "Knowledge OS" | "News & Editorial" | "Timeline OS" | "Archives OS" | "SGIS Hub" | "Live Media & Radio" | "Academy & Store";
  placements: string[];
  pricingModel: "CPM" | "CPC" | "Flat Monthly" | "Sponsorship Tier";
  baseRateNpr: number;
  rateUnit: string;
  keyBenefits: string[];
  mockupFormat: "banner" | "knowledge_card" | "live_banner" | "audio_preroll" | "store_spotlight";
}

export const ADVERTISING_PRODUCTS: AdProduct[] = [
  {
    id: "prod-precision-display",
    category: "Precision Display",
    titleEn: "Precision Display & High Impact Billboards",
    titleNe: "प्रिसिजन डिस्प्ले तथा हाइ-इम्प्याक्ट ब्यानरहरू",
    subtitleEn: "Uncluttered, viewability-optimized display placements across desktop & mobile",
    subtitleNe: "डेस्कटप र मोबाइलमा सफा र उच्च भिजिबिलिटी भएका डिस्प्ले स्थानहरू",
    descriptionEn: "Deliver maximum brand visibility using non-intrusive hero sliders, header billboards, in-read article banners, and sticky mobile units with 95%+ viewability.",
    inventorySource: "News & Editorial",
    placements: ["Hero Slider (1200x500)", "Header Billboard (970x250)", "Article In-Read (728x90)", "Mobile Sticky (320x50)", "Wallpaper Skin (300x1080)"],
    pricingModel: "CPM",
    baseRateNpr: 250,
    rateUnit: "per 1,000 Impressions",
    keyBenefits: [
      "Strict 1-ad-per-screen viewability rule",
      "No auto-expanding intrusive popups",
      "Contextual keyword alignment with editorial content",
      "High CTR display units"
    ],
    mockupFormat: "banner"
  },
  {
    id: "prod-sponsored-knowledge",
    category: "Sponsored Knowledge",
    titleEn: "Sponsored Knowledge & Heritage Nodes",
    titleNe: "प्रायोजित ज्ञान तथा सम्पदा कार्डहरू (Knowledge OS)",
    subtitleEn: "Align your brand with verified civilizational knowledge, festivals, and cultural heritage",
    subtitleNe: "सत्यापित सांस्कृतिक ज्ञान, पर्व तथा सम्पदा ग्रिडसँग ब्रान्डलाई जोड्नुहोस्",
    descriptionEn: "Position your brand as a patron of civilizational knowledge by sponsoring specific Knowledge OS entities, festival calendar nodes, or SGIS heritage locations.",
    inventorySource: "Knowledge OS",
    placements: ["Knowledge Entity Sidebar", "Festival Engine Presenting Badge", "SGIS Map Node Card", "Topic Hub Banner"],
    pricingModel: "Flat Monthly",
    baseRateNpr: 75000,
    rateUnit: "per Month / Topic Node",
    keyBenefits: [
      "100% Brand Safety: No sensationalism or political flame wars",
      "Perpetual evergreen engagement with heritage scholars & diaspora",
      "Verified 'Knowledge Patron' attestation badge",
      "Direct link to institution profile"
    ],
    mockupFormat: "knowledge_card"
  },
  {
    id: "prod-live-presenting",
    category: "Live & Presenting",
    titleEn: "Documentary & Live Presenting Partnerships",
    titleNe: "डकुमेन्ट्री तथा प्रत्यक्ष प्रसारण प्रायोजन",
    subtitleEn: "Exclusive co-branding on Live News, Radio Streams, and Cultural Documentaries",
    subtitleNe: "प्रत्यक्ष समाचार, रेडियो स्ट्रिम र सांस्कृतिक डकुमेन्ट्रीमा मुख्य प्रायोजक",
    descriptionEn: "Sponsor live video broadcasts, Nepal Hub cultural livestreams, audio pre-rolls on Radio Sanatan, and daily podcast briefings.",
    inventorySource: "Live Media & Radio",
    placements: ["Live Stream Lower-Third Banner", "Radio Pre-Roll Audio Spot (15s/30s)", "Daily Audio Briefing Presenter", "Documentary Co-Title"],
    pricingModel: "Sponsorship Tier",
    baseRateNpr: 150000,
    rateUnit: "per Broadcast / Month",
    keyBenefits: [
      "High-recall audio & video lower-third branding",
      "Direct reach during major cultural events & breaking live streams",
      "Dedicated presenter mention in audio intros",
      "Archived video stream persistent logo"
    ],
    mockupFormat: "live_banner"
  },
  {
    id: "prod-regional-sgis",
    category: "Geographic & Regional",
    titleEn: "Geographic & Regional SGIS Campaigns",
    titleNe: "भौगोलिक तथा प्रादेशिक SGIS अभियानहरू",
    subtitleEn: "Hyper-targeted local campaigns across Nepal's 77 Districts and 7 Provinces",
    subtitleNe: "नेपालका ७७ वटा जिल्ला र ७ प्रदेशमा लक्षित स्थानीय अभियानहरू",
    descriptionEn: "Run localized promotional campaigns targeting readers, tourists, and businesses in specific districts or provinces via SGIS Geographic Mapping & District Hubs.",
    inventorySource: "SGIS Hub",
    placements: ["District Hub Banner", "Province Portal Spotlight", "Local Temple/Heritage Map Spot", "Municipal Directory Feature"],
    pricingModel: "CPM",
    baseRateNpr: 180,
    rateUnit: "per 1,000 Local Impressions",
    keyBenefits: [
      "Target specific districts (e.g. Kathmandu, Kaski, Jhapa, Mustang)",
      "Zero waste impressions outside target geographic boundary",
      "Bilingual Nepali/English local contextual delivery",
      "Integration with local institution listings"
    ],
    mockupFormat: "banner"
  },
  {
    id: "prod-ecosystem-commerce",
    category: "Ecosystem Commerce",
    titleEn: "Knowledge Commerce & Ecosystem Placement",
    titleNe: "ज्ञान-वाणिज्य तथा इकोसिस्टम बजार",
    subtitleEn: "Integrate authentic products, courses, and books directly into Sanatan Store & Academy",
    subtitleNe: "सनातन स्टोर र एकेडेमीमा प्रामाणिक उत्पादन, पाठ्यक्रम र पुस्तकहरूको एकीकरण",
    descriptionEn: "Promote authentic heritage crafts, organic Nepali products, publications, and academic courses directly inside Sanatan Store and Academy catalog pages.",
    inventorySource: "Academy & Store",
    placements: ["Store Featured Product Card", "Academy Course Presenting Sponsor", "Institutional Directory Verified Listing", "Daily Digest Showcase"],
    pricingModel: "CPC",
    baseRateNpr: 45,
    rateUnit: "per Verified Click",
    keyBenefits: [
      "Direct conversion funnel for high-intent cultural consumers",
      "Verified Merchant badge in Sanatan Store",
      "Featured placement in daily email digest",
      "Audited conversion analytics"
    ],
    mockupFormat: "store_spotlight"
  }
];

export interface MarketDifferentiationPoint {
  dimension: string;
  traditionalNewsPortals: string;
  socialNetworks: string;
  sanatanMargaNetwork: string;
}

export const MARKET_POSITIONING_MATRIX: MarketDifferentiationPoint[] = [
  {
    dimension: "Content Horizon",
    traditionalNewsPortals: "Short-lived viral news cycle (24-hour decay)",
    socialNetworks: "Ephemeral, fast-scrolling feed clutter",
    sanatanMargaNetwork: "Evergreen Knowledge OS + Living News + Historical Timeline"
  },
  {
    dimension: "Brand Safety",
    traditionalNewsPortals: "High risk of adjacency to political flame wars",
    socialNetworks: "Unfiltered algorithmic toxic & unverified content",
    sanatanMargaNetwork: "100% Moderated, Authenticated Civilizational Provenance"
  },
  {
    dimension: "Audience Intent",
    traditionalNewsPortals: "Passive headline scanning & clickbait skimming",
    socialNetworks: "Low-intent passive doomscrolling",
    sanatanMargaNetwork: "High-intent scholars, diaspora leaders, heritage enthusiasts"
  },
  {
    dimension: "Ad Inventory Quality",
    traditionalNewsPortals: "Cluttered programmatic ads & invasive popups",
    socialNetworks: "Interleaved sponsored posts with low transparency",
    sanatanMargaNetwork: "Direct value-driven institutional & ecosystem partnerships"
  },
  {
    dimension: "Geographic Mapping",
    traditionalNewsPortals: "Generic IP geo-location without local depth",
    socialNetworks: "Broad interest targeting based on tracking",
    sanatanMargaNetwork: "SGIS Precision Mapping across Nepal's 77 Districts & 7 Provinces"
  }
];

export interface CampaignEstimateInput {
  budgetNpr: number;
  productCategory: string;
  durationDays: number;
  targetProvince?: string;
}

export function calculateCampaignEstimate(input: CampaignEstimateInput) {
  const selectedProd = ADVERTISING_PRODUCTS.find((p) => p.category === input.productCategory) || ADVERTISING_PRODUCTS[0];
  const rate = selectedProd.baseRateNpr;

  let estImpressions = 0;
  let estClicks = 0;
  let estReach = 0;

  if (selectedProd.pricingModel === "CPM") {
    estImpressions = Math.round((input.budgetNpr / rate) * 1000);
    estClicks = Math.round(estImpressions * 0.032); // 3.2% average CTR
    estReach = Math.round(estImpressions * 0.65);
  } else if (selectedProd.pricingModel === "CPC") {
    estClicks = Math.round(input.budgetNpr / rate);
    estImpressions = Math.round(estClicks / 0.04);
    estReach = Math.round(estImpressions * 0.7);
  } else {
    // Flat Monthly / Sponsorship
    estImpressions = Math.round((input.budgetNpr / 200) * 1000);
    estClicks = Math.round(estImpressions * 0.045);
    estReach = Math.round(estImpressions * 0.8);
  }

  return {
    selectedProduct: selectedProd,
    estImpressions: estImpressions.toLocaleString(),
    estClicks: estClicks.toLocaleString(),
    estReach: estReach.toLocaleString(),
    avgCtr: "3.2% - 4.5%",
    dailyPacingNpr: Math.round(input.budgetNpr / Math.max(1, input.durationDays)),
    provenanceScore: "99.8% Verified",
  };
}
