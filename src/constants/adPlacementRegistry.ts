import { AdPosition } from "@/src/types";

export interface AdPlacementConfig {
  key: AdPosition;
  label: string;
  dimensions: string;
  category: "High Impact" | "Premium" | "Display" | "Standard" | "In-Read" | "Wallpaper" | "Mobile" | "Native" | "Audio";
  supportedDevices: ("desktop" | "mobile" | "tablet")[];
  premiumAllowed: boolean; // Must be false for premium tiers
  frequencyLimit?: number;
  requiresDisclosure?: boolean;
}

export const AD_PLACEMENT_REGISTRY: Record<AdPosition, AdPlacementConfig> = {
  hero_slider: {
    key: "hero_slider",
    label: "हिरो स्लाइडर (Hero Slider)",
    dimensions: "1200 x 600 px",
    category: "High Impact",
    supportedDevices: ["desktop", "tablet"],
    premiumAllowed: false
  },
  header: {
    key: "header",
    label: "मुख्य हेडर ब्यानर (Header Top)",
    dimensions: "728 x 90 px / 970 x 90 px",
    category: "Premium",
    supportedDevices: ["desktop", "tablet"],
    premiumAllowed: false
  },
  homepage_top: {
    key: "homepage_top",
    label: "गृहपृष्ठ शीर्ष (Homepage Top)",
    dimensions: "970 x 250 px",
    category: "Display",
    supportedDevices: ["desktop", "tablet"],
    premiumAllowed: false
  },
  homepage_mid: {
    key: "homepage_mid",
    label: "गृहपृष्ठ मध्य (Homepage Mid)",
    dimensions: "970 x 250 px",
    category: "Display",
    supportedDevices: ["desktop", "tablet", "mobile"],
    premiumAllowed: false
  },
  homepage_bottom: {
    key: "homepage_bottom",
    label: "गृहपृष्ठ तल (Homepage Bottom)",
    dimensions: "970 x 250 px",
    category: "Display",
    supportedDevices: ["desktop", "tablet", "mobile"],
    premiumAllowed: false
  },
  sidebar: {
    key: "sidebar",
    label: "साइडबार स्क्वायर (Sidebar)",
    dimensions: "300 x 250 px / 336 x 280 px",
    category: "Standard",
    supportedDevices: ["desktop"],
    premiumAllowed: false
  },
  article_top: {
    key: "article_top",
    label: "समाचार शीर्ष (Article Top)",
    dimensions: "728 x 90 px",
    category: "In-Read",
    supportedDevices: ["desktop", "tablet", "mobile"],
    premiumAllowed: false
  },
  article_inline: {
    key: "article_inline",
    label: "समाचार भित्र (Article Inline)",
    dimensions: "728 x 90 px / 300 x 250 px",
    category: "In-Read",
    supportedDevices: ["desktop", "tablet", "mobile"],
    premiumAllowed: false
  },
  article_bottom: {
    key: "article_bottom",
    label: "समाचार तल (Article Bottom)",
    dimensions: "970 x 250 px",
    category: "Display",
    supportedDevices: ["desktop", "tablet", "mobile"],
    premiumAllowed: false
  },
  blog_header: {
    key: "blog_header",
    label: "ब्लग हेडर (Blog Header)",
    dimensions: "970 x 250 px",
    category: "Premium",
    supportedDevices: ["desktop", "tablet", "mobile"],
    premiumAllowed: false
  },
  blog_sidebar: {
    key: "blog_sidebar",
    label: "ब्लग साइडबार (Blog Sidebar)",
    dimensions: "300 x 250 px / 336 x 280 px",
    category: "Standard",
    supportedDevices: ["desktop"],
    premiumAllowed: false
  },
  blog_inline: {
    key: "blog_inline",
    label: "ब्लग आलेख भित्र (Blog Inline)",
    dimensions: "728 x 90 px / 300 x 250 px",
    category: "In-Read",
    supportedDevices: ["desktop", "tablet", "mobile"],
    premiumAllowed: false
  },
  blog_bottom: {
    key: "blog_bottom",
    label: "ब्लग तल (Blog Bottom)",
    dimensions: "970 x 250 px",
    category: "Display",
    supportedDevices: ["desktop", "tablet", "mobile"],
    premiumAllowed: false
  },
  category_top: {
    key: "category_top",
    label: "क्याटगोरी शीर्ष (Category Top)",
    dimensions: "970 x 250 px",
    category: "Display",
    supportedDevices: ["desktop", "tablet"],
    premiumAllowed: false
  },
  category_bottom: {
    key: "category_bottom",
    label: "क्याटगोरी तल (Category Bottom)",
    dimensions: "970 x 250 px",
    category: "Display",
    supportedDevices: ["desktop", "tablet"],
    premiumAllowed: false
  },
  left_skin: {
    key: "left_skin",
    label: "बायाँ ब्याकग्राउन्ड स्किन (Left Skin)",
    dimensions: "300 x 1080 px",
    category: "Wallpaper",
    supportedDevices: ["desktop"],
    premiumAllowed: false
  },
  right_skin: {
    key: "right_skin",
    label: "दायाँ ब्याकग्राउन्ड स्किन (Right Skin)",
    dimensions: "300 x 1080 px",
    category: "Wallpaper",
    supportedDevices: ["desktop"],
    premiumAllowed: false
  },
  mobile_sticky: {
    key: "mobile_sticky",
    label: "मोबाइल स्टिकी ब्यानर (Mobile Sticky)",
    dimensions: "320 x 50 px",
    category: "Mobile",
    supportedDevices: ["mobile"],
    premiumAllowed: false
  },
  popup_takeover: {
    key: "popup_takeover",
    label: "पपअप टेकओभर (Modal Takeover)",
    dimensions: "600 x 600 px",
    category: "High Impact",
    supportedDevices: ["desktop", "mobile"],
    premiumAllowed: false
  },
  sponsored_story: {
    key: "sponsored_story",
    label: "प्रायोजित समाचार कार्ड (Sponsored Story)",
    dimensions: "1200 x 675 px",
    category: "Native",
    supportedDevices: ["desktop", "tablet", "mobile"],
    premiumAllowed: false,
    requiresDisclosure: true
  },
  homepage_hero_sponsor: {
    key: "homepage_hero_sponsor",
    label: "गृहपृष्ठ हिरो प्रायोजक",
    dimensions: "1200 x 600 px",
    category: "High Impact",
    supportedDevices: ["desktop", "tablet"],
    premiumAllowed: false
  },
  homepage_premium_banner: {
    key: "homepage_premium_banner",
    label: "गृहपृष्ठ प्रिमियम ब्यानर",
    dimensions: "970 x 250 px",
    category: "Premium",
    supportedDevices: ["desktop", "tablet"],
    premiumAllowed: false
  },
  homepage_native_story: {
    key: "homepage_native_story",
    label: "गृहपृष्ठ नेटिभ स्टोरी",
    dimensions: "1200 x 675 px",
    category: "Native",
    supportedDevices: ["desktop", "tablet", "mobile"],
    premiumAllowed: false,
    requiresDisclosure: true
  },
  homepage_video_sponsor: {
    key: "homepage_video_sponsor",
    label: "गृहपृष्ठ भिडियो प्रायोजक",
    dimensions: "970 x 250 px",
    category: "Display",
    supportedDevices: ["desktop", "tablet"],
    premiumAllowed: false
  },
  category_sponsor: {
    key: "category_sponsor",
    label: "विधा प्रायोजक (Category Sponsor)",
    dimensions: "970 x 250 px",
    category: "Display",
    supportedDevices: ["desktop", "tablet"],
    premiumAllowed: false
  },
  category_native_story: {
    key: "category_native_story",
    label: "विधा नेटिभ स्टोरी",
    dimensions: "1200 x 675 px",
    category: "Native",
    supportedDevices: ["desktop", "tablet", "mobile"],
    premiumAllowed: false,
    requiresDisclosure: true
  },
  category_newsletter_sponsor: {
    key: "category_newsletter_sponsor",
    label: "न्यूजलेटर प्रायोजक",
    dimensions: "300 x 250 px",
    category: "Standard",
    supportedDevices: ["desktop", "mobile"],
    premiumAllowed: false
  },
  district_sponsor: {
    key: "district_sponsor",
    label: "जिल्ला ब्यानर प्रायोजक",
    dimensions: "728 x 90 px",
    category: "Standard",
    supportedDevices: ["desktop", "mobile"],
    premiumAllowed: false
  },
  district_hero_sponsor: {
    key: "district_hero_sponsor",
    label: "जिल्ला हिरो प्रायोजक",
    dimensions: "970 x 250 px",
    category: "High Impact",
    supportedDevices: ["desktop", "tablet"],
    premiumAllowed: false
  },
  article_sponsor: {
    key: "article_sponsor",
    label: "समाचार मुख्य प्रायोजक",
    dimensions: "728 x 90 px",
    category: "In-Read",
    supportedDevices: ["desktop", "tablet", "mobile"],
    premiumAllowed: false
  },
  article_infeed_sponsor: {
    key: "article_infeed_sponsor",
    label: "समाचार इन्फिड प्रायोजक",
    dimensions: "728 x 90 px",
    category: "In-Read",
    supportedDevices: ["desktop", "tablet", "mobile"],
    premiumAllowed: false
  },
  article_audio_sponsor: {
    key: "article_audio_sponsor",
    label: "अडियो बुलेटिन प्रायोजक",
    dimensions: "300 x 250 px",
    category: "Audio",
    supportedDevices: ["desktop", "tablet", "mobile"],
    premiumAllowed: false,
    requiresDisclosure: true
  },
  listenos_sponsor: {
    key: "listenos_sponsor",
    label: "ListenOS मुख्य प्रायोजक",
    dimensions: "300 x 250 px",
    category: "Audio",
    supportedDevices: ["desktop", "tablet", "mobile"],
    premiumAllowed: false,
    requiresDisclosure: true
  },
  listenos_preroll: {
    key: "listenos_preroll",
    label: "ListenOS प्रि-रोल अडियो",
    dimensions: "Audio Stream",
    category: "Audio",
    supportedDevices: ["desktop", "tablet", "mobile"],
    premiumAllowed: false,
    requiresDisclosure: true
  },
  listenos_queue_sponsor: {
    key: "listenos_queue_sponsor",
    label: "ListenOS क्यु प्रायोजक",
    dimensions: "300 x 250 px",
    category: "Audio",
    supportedDevices: ["desktop", "tablet", "mobile"],
    premiumAllowed: false,
    requiresDisclosure: true
  }
};
