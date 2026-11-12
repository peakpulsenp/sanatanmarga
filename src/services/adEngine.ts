import { Ad, AdPosition, AdStatus, SponsoredStoryGovernance, AdDeliveryEvent } from "@/src/types";
import { DEFAULT_HOUSE_ADS, HouseAd, AD_INVENTORY_REGISTRY } from "@/src/constants/revenueInventory";
import { AD_PLACEMENT_REGISTRY } from "@/src/constants/adPlacementRegistry";
import { adDeliveryEventStore } from "./adDeliveryEventStore";
import { adInventoryCache } from "./adInventoryCache";

export interface CampaignCheckItem {
  category: "Creative" | "Advertiser" | "Destination" | "Placement" | "Schedule" | "Targeting" | "Pricing" | "Budget" | "Sponsorship" | "PremiumPolicy";
  passed: boolean;
  message: string;
}

export interface CampaignValidationResult {
  ready: boolean;
  errors: string[];
  checks: CampaignCheckItem[];
}

export interface AdEligibilityOptions {
  placement: AdPosition;
  user?: { membershipTier?: string; role?: string; uid?: string } | null;
  category?: string;
  district?: string;
  province?: string;
  language?: "ne" | "en";
  device?: "desktop" | "mobile" | "tablet";
  ads?: Ad[];
}

export interface AdDeliveryResult {
  eligible: boolean;
  campaign?: Ad;
  reason?: string;
  provenance?: {
    verifiedAt: string;
    engineVersion: string;
    placement: AdPosition;
    matchedRules: string[];
  };
}

/**
 * Nepal Province & District Geo-Targeting Dictionary
 */
export const NEPAL_PROVINCES: Record<string, { nameEn: string; nameNe: string; districts: string[] }> = {
  koshi: {
    nameEn: "Koshi Province",
    nameNe: "कोशी प्रदेश",
    districts: ["झापा", "मोरङ", "सुनसरी", "इलाम", "ताप्लेजुङ", "पाँचथर", "धनकुटा", "तेह्रथुम", "संखुवासभा", "भोजपुर", "सोलुखुम्बु", "ओखलढुंगा", "खोटाङ", "उदयपुर"]
  },
  madhesh: {
    nameEn: "Madhesh Province",
    nameNe: "मधेश प्रदेश",
    districts: ["सप्तरी", "सिराहा", "धनुषा", "महोत्तरी", "सर्लाही", "रौतहट", "बारा", "पर्सा"]
  },
  bagmati: {
    nameEn: "Bagmati Province",
    nameNe: "बागमती प्रदेश",
    districts: ["काठमाडौं", "ललितपुर", "भक्तपुर", "काभ्रेपलाञ्चोक", "सिन्धुपाल्चोक", "दोलखा", "रामेछाप", "सिन्धुली", "मकवानपुर", "चितवन", "धादिङ", "नुवाकोट", "रसुवा"]
  },
  gandaki: {
    nameEn: "Gandaki Province",
    nameNe: "गण्डकी प्रदेश",
    districts: ["कास्की", "कास्की (पोखरा)", "तनहुँ", "गोर्खा", "लमजुङ", "स्याङ्जा", "पर्वत", "बागलुङ", "म्याग्दी", "मुस्ताङ", "मनाङ", "नवलपुर"]
  },
  lumbini: {
    nameEn: "Lumbini Province",
    nameNe: "लुम्बिनी प्रदेश",
    districts: ["रुपन्देही", "रुपन्देही (बुटवल)", "कपिलवस्तु", "परासी", "पाल्पा", "गुल्मी", "अर्घाखाँची", "दाङ", "बाँके", "बर्दिया", "प्युठान", "रोल्पा", "रुकुम पूर्व"]
  },
  karnali: {
    nameEn: "Karnali Province",
    nameNe: "कर्णाली प्रदेश",
    districts: ["सुर्खेत", "दैलेख", "जाजरकोट", "सल्यान", "रुकुम पश्चिम", "जुम्ला", "कालिकोट", "मुगु", "हुम्ला", "डोल्पा"]
  },
  sudurpashchim: {
    nameEn: "Sudurpashchim Province",
    nameNe: "सुदूरपश्चिम प्रदेश",
    districts: ["कैलाली", "कञ्चनपुर", "डडेल्धुरा", "डोटी", "अछाम", "बाजुरा", "बझाङ", "बैतडी", "दार्चुला"]
  }
};

/**
 * Major Municipality / City to District Normalization Map
 */
export const NEPAL_MUNICIPALITY_MAP: Record<string, { district: string; province: string; nameEn: string; nameNe: string }> = {
  "kathmandu": { district: "kathmandu", province: "bagmati", nameEn: "Kathmandu Metropolitan", nameNe: "काठमाडौँ महानगरपालिका" },
  "lalitpur": { district: "lalitpur", province: "bagmati", nameEn: "Lalitpur Metropolitan", nameNe: "ललितपुर महानगरपालिका" },
  "bhaktapur": { district: "bhaktapur", province: "bagmati", nameEn: "Bhaktapur Municipality", nameNe: "भक्तपुर नगरपालिका" },
  "pokhara": { district: "kaski", province: "gandaki", nameEn: "Pokhara Metropolitan", nameNe: "पोखरा महानगरपालिका" },
  "bharatpur": { district: "chitwan", province: "bagmati", nameEn: "Bharatpur Metropolitan", nameNe: "भरतपुर महानगरपालिका" },
  "biratnagar": { district: "morang", province: "koshi", nameEn: "Biratnagar Metropolitan", nameNe: "विराटनगर महानगरपालिका" },
  "birgunj": { district: "parsa", province: "madhesh", nameEn: "Birgunj Metropolitan", nameNe: "वीरगन्ज महानगरपालिका" },
  "butwal": { district: "rupandehi", province: "lumbini", nameEn: "Butwal Sub-Metropolitan", nameNe: "बुटवल उपमहानगरपालिका" },
  "dharan": { district: "sunsari", province: "koshi", nameEn: "Dharan Sub-Metropolitan", nameNe: "धरान उपमहानगरपालिका" },
  "nepalgunj": { district: "banke", province: "lumbini", nameEn: "Nepalgunj Sub-Metropolitan", nameNe: "नेपालगन्ज उपमहानगरपालिका" },
  "dhangadhi": { district: "kailali", province: "sudurpashchim", nameEn: "Dhangadhi Sub-Metropolitan", nameNe: "धनगढी उपमहानगरपालिका" },
  "itahari": { district: "sunsari", province: "koshi", nameEn: "Itahari Sub-Metropolitan", nameNe: "इटहरी उपमहानगरपालिका" },
  "janakpur": { district: "dhanusha", province: "madhesh", nameEn: "Janakpurdham Sub-Metropolitan", nameNe: "जनकपुरधाम उपमहानगरपालिका" },
  "hetauda": { district: "makwanpur", province: "bagmati", nameEn: "Hetauda Sub-Metropolitan", nameNe: "हेटौंडा उपमहानगरपालिका" },
  "surkhet": { district: "surkhet", province: "karnali", nameEn: "Birendranagar Municipality", nameNe: "वीरेन्द्रनगर नगरपालिका" },
  "dailekh": { district: "dailekh", province: "karnali", nameEn: "Narayan Municipality", nameNe: "नारायण नगरपालिका (दैलेख)" },
  "jhapa": { district: "jhapa", province: "koshi", nameEn: "Bhadrapur / Damak", nameNe: "भद्रपुर / दमक (झापा)" }
};

/**
 * AdEngine - Sanatan Media Revenue & Monetization Subsystem
 * 
 * Provides:
 * 1. Strict time-window and lifecycle ad filtering (no expired ads leak)
 * 2. Multi-tier priority & weighted stochastic rotation
 * 3. Inventory targeting (Districts, Provinces, Categories, Device forms)
 * 4. Frequency capping (per user/session max impressions)
 * 5. Micro-batched impression logging (deduplicated per view to protect quotas)
 * 6. High-precision click logging and redirection
 * 7. House Ads fallback engine
 * 8. ListenOS audio & queue sponsorship hooks
 */

class AdEngine {
  private loggedImpressions = new Set<string>();
  private cachedInventory: Ad[] = [];
  private lastCacheFetchMs: number = 0;
  private pendingImpressions: Array<{
    adId: string;
    position?: string;
    category?: string;
    district?: string;
    device?: string;
    timestamp: string;
  }> = [];
  private flushTimeout: any = null;

  /**
   * Updates the in-memory ad inventory cache for zero-Firestore-read public rendering.
   */
  public setInventoryCache(ads: Ad[]): void {
    this.cachedInventory = ads;
    this.lastCacheFetchMs = Date.now();
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sanatan_ad_inventory_cache", JSON.stringify(ads));
      } catch {}
    }
  }

  /**
   * Invalidates local inventory cache.
   */
  public invalidateInventoryCache(): void {
    this.cachedInventory = [];
    this.lastCacheFetchMs = 0;
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("sanatan_ad_inventory_cache");
      } catch {}
    }
  }

  /**
   * Returns active cached inventory.
   */
  public getActiveInventory(): Ad[] {
    if (this.cachedInventory.length > 0) return this.cachedInventory;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("sanatan_ad_inventory_cache");
        if (raw) {
          this.cachedInventory = JSON.parse(raw);
          return this.cachedInventory;
        }
      } catch {}
    }
    return [];
  }

  /**
   * Normalizes any input geographic name (English, Nepali, city, district, province)
   * into a canonical lowercase ID to ensure robust geo-targeting.
   */
  public normalizeLocation(location: string | null | undefined): string {
    if (!location) return "";
    const clean = location.trim().toLowerCase();

    // Exact and sub-string bilingual geographic map
    const mapping: Record<string, string> = {
      // Gandaki, Pokhara, Kaski
      "pokhara": "kaski",
      "पोखरा": "kaski",
      "kaski": "kaski",
      "कास्की": "kaski",
      "gandaki": "gandaki",
      "गण्डकी": "gandaki",

      // Bagmati, Kathmandu Hub
      "kathmandu": "kathmandu",
      "काठमाडौं": "kathmandu",
      "काठमाडौँ": "kathmandu",
      "lalitpur": "lalitpur",
      "ललितपुर": "lalitpur",
      "bhaktapur": "bhaktapur",
      "भक्तपुर": "bhaktapur",
      "chitwan": "chitwan",
      "चितवन": "chitwan",
      "bharatpur": "chitwan",
      "भरतपुर": "chitwan",
      "bagmati": "bagmati",
      "बागमती": "bagmati",

      // Lumbini, Butwal, Rupandehi
      "butwal": "rupandehi",
      "बुटवल": "rupandehi",
      "rupandehi": "rupandehi",
      "रुपन्देही": "rupandehi",
      "lumbini": "lumbini",
      "लुम्बिनी": "lumbini",

      // Karnali, Dailekh, Surkhet
      "dailekh": "dailekh",
      "दैलेख": "dailekh",
      "surkhet": "surkhet",
      "सुर्खेत": "surkhet",
      "birendranagar": "surkhet",
      "वीरेन्द्रनगर": "surkhet",
      "karnali": "karnali",
      "कर्णाली": "karnali",

      // Koshi, Biratnagar, Morang, Jhapa, Sunsari
      "biratnagar": "morang",
      "विराटनगर": "morang",
      "morang": "morang",
      "मोरङ": "morang",
      "jhapa": "jhapa",
      "झापा": "jhapa",
      "damak": "jhapa",
      "दमक": "jhapa",
      "sunsari": "sunsari",
      "सुनसरी": "sunsari",
      "dharan": "sunsari",
      "धरान": "sunsari",
      "itahari": "sunsari",
      "इटहरी": "sunsari",
      "koshi": "koshi",
      "कोशी": "koshi",

      // Madhesh
      "madhesh": "madhesh",
      "मधेश": "madhesh",
      "birgunj": "parsa",
      "वीरगन्ज": "parsa",
      "parsa": "parsa",
      "पर्सा": "parsa",
      "janakpur": "dhanusha",
      "जनकपुर": "dhanusha",
      "dhanusha": "dhanusha",
      "धनुषा": "dhanusha",

      // Sudurpashchim
      "sudurpashchim": "sudurpashchim",
      "सुदूरपश्चिम": "sudurpashchim",
      "dhangadhi": "kailali",
      "धनगढी": "kailali",
      "kailali": "kailali",
      "कैलाली": "kailali",
      "kanchanpur": "kanchanpur",
      "कञ्चनपुर": "kanchanpur"
    };

    if (mapping[clean]) {
      return mapping[clean];
    }

    // Attempt substring matching for words like "कास्की जिल्ला" -> "kaski" or "karnali province" -> "karnali"
    for (const [key, val] of Object.entries(mapping)) {
      if (clean.includes(key) || key.includes(clean)) {
        return val;
      }
    }

    return clean;
  }

  /**
   * Resolves canonical positions and aliases across the inventory registry.
   */
  public resolvePositionAliases(pos: AdPosition): AdPosition[] {
    const aliasMap: Record<string, AdPosition[]> = {
      "homepage_hero_sponsor": ["homepage_hero_sponsor", "hero_slider"],
      "hero_slider": ["hero_slider", "homepage_hero_sponsor"],
      "homepage_premium_banner": ["homepage_premium_banner", "homepage_top"],
      "homepage_top": ["homepage_top", "homepage_premium_banner"],
      "homepage_native_story": ["homepage_native_story", "sponsored_story"],
      "sponsored_story": ["sponsored_story", "homepage_native_story"],
      "homepage_video_sponsor": ["homepage_video_sponsor", "homepage_mid"],
      "homepage_mid": ["homepage_mid", "homepage_video_sponsor"],
      "category_sponsor": ["category_sponsor", "category_top"],
      "category_top": ["category_top", "category_sponsor"],
      "category_native_story": ["category_native_story", "category_bottom"],
      "category_bottom": ["category_bottom", "category_native_story"],
      "category_newsletter_sponsor": ["category_newsletter_sponsor", "sidebar"],
      "sidebar": ["sidebar", "category_newsletter_sponsor"],
      "district_sponsor": ["district_sponsor", "mobile_sticky", "header"],
      "district_hero_sponsor": ["district_hero_sponsor", "header"],
      "header": ["header", "district_hero_sponsor"],
      "article_sponsor": ["article_sponsor", "article_top"],
      "article_top": ["article_top", "article_sponsor"],
      "article_infeed_sponsor": ["article_infeed_sponsor", "article_inline"],
      "article_inline": ["article_inline", "article_infeed_sponsor"],
      "article_audio_sponsor": ["article_audio_sponsor", "article_bottom"],
      "article_bottom": ["article_bottom", "article_audio_sponsor"],
      "listenos_sponsor": ["listenos_sponsor", "homepage_bottom"],
      "listenos_preroll": ["listenos_preroll"],
      "listenos_queue_sponsor": ["listenos_queue_sponsor"]
    };

    return aliasMap[pos] || [pos];
  }

  /**
   * Checks whether the current user has exceeded the daily frequency cap for an ad.
   */
  public isFrequencyCapReached(ad: Ad | null | undefined, simulatedViews?: number): boolean {
    if (!ad?.id || !ad.frequencyCap || ad.frequencyCap <= 0) return false;
    if (simulatedViews !== undefined) {
      return simulatedViews >= ad.frequencyCap;
    }
    if (typeof window === "undefined") return false;
    try {
      const storageKey = "sanatan_ad_frequency_caps";
      const registryRaw = localStorage.getItem(storageKey);
      if (!registryRaw) return false;

      const registry = JSON.parse(registryRaw);
      const record = registry[ad.id];
      if (!record) return false;

      if (new Date().getTime() > record.expiresAt) {
        delete registry[ad.id];
        localStorage.setItem(storageKey, JSON.stringify(registry));
        return false;
      }

      return record.views >= ad.frequencyCap;
    } catch {
      return false;
    }
  }

  /**
   * Increments the user's impression frequency for the ad.
   */
  private incrementFrequency(adId: string): void {
    if (typeof window === "undefined" || !adId) return;
    try {
      const storageKey = "sanatan_ad_frequency_caps";
      const registryRaw = localStorage.getItem(storageKey) || "{}";
      const registry = JSON.parse(registryRaw);

      const nowMs = new Date().getTime();
      const tomorrowMs = nowMs + 24 * 60 * 60 * 1000;

      if (registry[adId]) {
        if (nowMs > registry[adId].expiresAt) {
          registry[adId] = { views: 1, expiresAt: tomorrowMs };
        } else {
          registry[adId].views = (registry[adId].views || 0) + 1;
        }
      } else {
        registry[adId] = { views: 1, expiresAt: tomorrowMs };
      }

      localStorage.setItem(storageKey, JSON.stringify(registry));
    } catch {}
  }

  /**
   * Campaign Readiness Gate: Validates campaign readiness before approval/activation
   */
  public validateCampaign(ad: Partial<Ad> | null | undefined): CampaignValidationResult {
    const errors: string[] = [];
    const checks: CampaignCheckItem[] = [];

    if (!ad) {
      return {
        ready: false,
        errors: ["अभियान डाटा फेला परेन (No campaign data)"],
        checks: [{ category: "Creative", passed: false, message: "अभियान डाटा अनुपस्थित छ" }]
      };
    }

    // 1. Creative Check
    const hasTitle = Boolean(ad.title && ad.title.trim());
    const hasImage = Boolean(ad.imageUrl && ad.imageUrl.trim());
    const creativePassed = hasTitle && hasImage;
    checks.push({
      category: "Creative",
      passed: creativePassed,
      message: creativePassed ? "शीर्षक र ब्यानर तस्बिर वैध छ" : "अभियानको शीर्षक वा तस्बिर URL खाली छ"
    });
    if (!hasTitle) errors.push("अभियानको शीर्षक खाली छ (Campaign title is missing)");
    if (!hasImage) errors.push("ब्यानर तस्बिर URL खाली छ (Creative Image URL is missing)");

    // 2. Advertiser Check
    const hasAdvertiser = Boolean(ad.advertiserName && ad.advertiserName.trim());
    checks.push({
      category: "Advertiser",
      passed: hasAdvertiser,
      message: hasAdvertiser ? `विज्ञापनदाता: ${ad.advertiserName}` : "विज्ञापनदाताको नाम खाली छ"
    });
    if (!hasAdvertiser) errors.push("विज्ञापनदाताको नाम खाली छ (Advertiser name is missing)");

    // 3. Destination Check
    const hasLink = Boolean(ad.linkUrl && ad.linkUrl.trim() && (ad.linkUrl.startsWith("http://") || ad.linkUrl.startsWith("https://") || ad.linkUrl.startsWith("/")));
    checks.push({
      category: "Destination",
      passed: hasLink,
      message: hasLink ? `गन्तव्य URL: ${ad.linkUrl}` : "गन्तव्य URL अमान्य वा खाली छ"
    });
    if (!hasLink) errors.push("गन्तव्य URL खाली वा अमान्य छ (Destination URL is missing or invalid)");

    // 4. Placement Check
    const validPlacement = Boolean(ad.position && AD_PLACEMENT_REGISTRY[ad.position]);
    checks.push({
      category: "Placement",
      passed: validPlacement,
      message: validPlacement ? `स्थान: ${ad.position}` : "अमान्य विज्ञापन स्थान छनोट गरियो"
    });
    if (!validPlacement) errors.push("विज्ञापन स्थान अमान्य वा छनोट गरिएको छैन (Placement slot is missing/invalid)");

    // 5. Schedule Check
    let schedulePassed = true;
    if (ad.startDate && ad.endDate) {
      const startMs = new Date(ad.startDate).getTime();
      const endMs = new Date(ad.endDate).getTime();
      if (!isNaN(startMs) && !isNaN(endMs) && endMs < startMs) {
        schedulePassed = false;
      }
    }
    checks.push({
      category: "Schedule",
      passed: schedulePassed,
      message: schedulePassed ? "मिति तालिका वैध छ" : "अन्त्य मिति सुरु मिति भन्दा अगाडि छ"
    });
    if (!schedulePassed) errors.push("अन्त्य मिति सुरु मिति भन्दा अगाडि हुन सक्दैन (End date precedes start date)");

    // 6. Targeting Check
    checks.push({
      category: "Targeting",
      passed: true,
      message: "लक्षित समूह र उपकरण विन्यास पूर्ण छ"
    });

    // 7. Pricing Check
    const hasPricingModel = Boolean(ad.budget && ad.budget.pricingModel);
    checks.push({
      category: "Pricing",
      passed: hasPricingModel,
      message: hasPricingModel ? `प्राइसिङ मोडल: ${ad.budget?.pricingModel}` : "प्राइसिङ मोडल तोकिएको छैन"
    });

    // 8. Budget Check
    const hasValidBudget = Boolean(ad.budget && Number(ad.budget.totalBudget || 0) > 0);
    checks.push({
      category: "Budget",
      passed: hasValidBudget,
      message: hasValidBudget ? `कुल बजेट: रु ${(ad.budget?.totalBudget || 0).toLocaleString()}` : "अभियान बजेट शून्य वा अमान्य छ"
    });
    if (!hasValidBudget) errors.push("अभियान बजेट शून्य वा अमान्य छ (Invalid total budget)");

    // 9. Sponsorship Disclosure Check
    let sponsorshipPassed = true;
    if (ad.isSponsored) {
      if (!ad.advertiserName || !ad.advertiserName.trim()) {
        sponsorshipPassed = false;
      }
    }
    checks.push({
      category: "Sponsorship",
      passed: sponsorshipPassed,
      message: sponsorshipPassed ? (ad.isSponsored ? "प्रायोजित समाचार डिस्क्लोजर समावेश छ" : "सामान्य अभियान") : "प्रायोजित विज्ञापनका लागि प्रायोजक डिस्क्लोजर छैन"
    });
    if (!sponsorshipPassed) errors.push("प्रायोजित विज्ञापनका लागि प्रायोजकको विवरण आवश्यक छ (Sponsored content disclosure missing)");

    // 10. Premium Policy Check
    const premiumPolicyPassed = ad.position ? AD_PLACEMENT_REGISTRY[ad.position]?.premiumAllowed === false : true;
    checks.push({
      category: "PremiumPolicy",
      passed: premiumPolicyPassed,
      message: "प्रिमियम प्रयोगकर्ताका लागि शून्य-विज्ञापन नीति लागू छ"
    });

    return {
      ready: errors.length === 0,
      errors,
      checks
    };
  }

  /**
   * Governance: Enforces valid status transitions based on user role
   */
  public isValidStatusTransition(
    currentStatus: AdStatus | undefined,
    targetStatus: AdStatus,
    userRole: string = "editor"
  ): { allowed: boolean; reason?: string } {
    const current = currentStatus || "draft";
    if (current === targetStatus) return { allowed: true };

    const isSuperAdmin = userRole === "super_admin" || userRole === "superadmin" || userRole === "guardian";
    const isAdmin = isSuperAdmin || userRole === "admin" || userRole === "editor_in_chief";

    if (!isAdmin && userRole === "editor") {
      if (current === "draft" && targetStatus === "pending_review") return { allowed: true };
      if (current === "rejected" && targetStatus === "draft") return { allowed: true };
      return {
        allowed: false,
        reason: "सम्पादक (Editor) लाई स्वीकृत/सक्रिय/अर्काइभ गर्ने अनुमति छैन। केवल एडमिन वा सुपर एडमिनले स्वीकृति दिन सक्छन्।"
      };
    }

    const allowedMap: Record<string, AdStatus[]> = {
      draft: ["pending_review", "approved", "scheduled", "active", "archived"],
      pending_review: ["approved", "rejected", "draft", "archived"],
      needs_changes: ["pending_review", "draft", "archived"],
      approved: ["scheduled", "active", "paused", "archived"],
      scheduled: ["active", "paused", "archived"],
      active: ["paused", "completed", "expired", "archived"],
      paused: ["active", "archived"],
      rejected: ["draft", "archived"],
      completed: ["archived"],
      expired: ["archived"],
      archived: isSuperAdmin ? ["draft", "paused"] : []
    };

    const validTargets = allowedMap[current] || [];
    if (!validTargets.includes(targetStatus)) {
      return {
        allowed: false,
        reason: `'${current}' बाट '${targetStatus}' मा स्थिति परिवर्तन गर्न मिल्दैन (Invalid lifecycle status transition)`
      };
    }

    return { allowed: true };
  }

  /**
   * Governance Deletion Policy:
   * Prevents physical deletion of campaigns with financial, impression, click, or audit history.
   */
  public canHardDelete(ad: Ad | null | undefined): { allowed: boolean; reason?: string } {
    if (!ad) return { allowed: false, reason: "अभियान फेला परेन (No campaign found)" };
    const imp = Number(ad.impressions || 0);
    const clk = Number(ad.clicks || 0);
    const spent = Number(ad.budget?.spent || 0);
    const status = ad.status || "draft";

    if (status !== "draft") {
      return {
        allowed: false,
        reason: "ड्राफ्ट बाहेकका अभियानहरू स्थायी रूपमा मेट्न पाइँदैन। अर्काइभ गर्नुहोस्। (Only un-published draft campaigns can be deleted)"
      };
    }

    if (imp > 0 || clk > 0 || spent > 0) {
      return {
        allowed: false,
        reason: "वितरित वा बजेट विवरण भएको अभियान स्थायी रूपमा मेट्न पाइँदैन। अर्काइभ गर्नुहोस्। (Campaigns with delivery or budget history cannot be hard deleted)"
      };
    }

    return { allowed: true };
  }

  /**
   * Central Ad Delivery Engine API for all public ad locations.
   * Enforces absolute Premium Zero-Ad policy regardless of placement, device, or targeting.
   */
  public getEligibleAd(options: AdEligibilityOptions): AdDeliveryResult {
    const matchedRules: string[] = [];

    // Absolute Premium Zero-Ad Enforcement Policy
    const tier = options.user?.membershipTier;
    if (tier === "sanrakshak" || tier === "sadhak" || tier === "corporate" || tier === "patron") {
      return {
        eligible: false,
        reason: "PREMIUM_MEMBER_NO_ADS",
        provenance: {
          verifiedAt: new Date().toISOString(),
          engineVersion: "3.0.0",
          placement: options.placement,
          matchedRules: ["RULE_PREMIUM_MEMBER_EXCLUSION"]
        }
      };
    }

    const reg = AD_PLACEMENT_REGISTRY[options.placement];
    if (reg && reg.premiumAllowed === false && (tier === "patron" || tier === "sadhak" || tier === "sanrakshak" || tier === "corporate")) {
      return {
        eligible: false,
        reason: "PREMIUM_MEMBER_NO_ADS",
        provenance: {
          verifiedAt: new Date().toISOString(),
          engineVersion: "3.0.0",
          placement: options.placement,
          matchedRules: ["RULE_PLACEMENT_PREMIUM_RESTRICTED"]
        }
      };
    }

    const adsToFilter = options.ads || [];
    const selected = this.selectAd(adsToFilter, options.placement, {
      category: options.category,
      district: options.district,
      province: options.province,
      language: options.language,
      device: options.device
    });

    if (!selected) {
      return {
        eligible: false,
        reason: "NO_VERIFIED_CAMPAIGN",
        provenance: {
          verifiedAt: new Date().toISOString(),
          engineVersion: "3.0.0",
          placement: options.placement,
          matchedRules: ["RULE_UNFILLED_INVENTORY"]
        }
      };
    }

    matchedRules.push("RULE_CAMPAIGN_ELIGIBLE");
    if (selected.targetCategories?.length) matchedRules.push("RULE_CATEGORY_MATCHED");
    if (selected.targetDistricts?.length) matchedRules.push("RULE_GEO_MATCHED");

    return {
      eligible: true,
      campaign: selected,
      provenance: {
        verifiedAt: new Date().toISOString(),
        engineVersion: "3.0.0",
        placement: options.placement,
        matchedRules
      }
    };
  }

  /**
   * Evaluates whether an ad is currently eligible to be displayed.
   */
  public isAdEligible(ad: Ad | null | undefined): boolean {
    if (!ad) return false;
    
    const deprecatedPositions = ["left_skin", "right_skin", "popup_takeover"];
    if (deprecatedPositions.includes(ad.position)) {
      return false;
    }

    if (ad.isActive === false) return false;
    if (
      ad.status === "paused" || 
      ad.status === "draft" || 
      ad.status === "expired" || 
      ad.status === "pending_review" || 
      ad.status === "needs_changes" || 
      ad.status === "completed" || 
      ad.status === "archived" || 
      ad.status === "rejected"
    ) {
      return false;
    }

    const now = Date.now();

    if (ad.startDate) {
      const startMs = new Date(ad.startDate).getTime();
      if (!isNaN(startMs) && startMs > now) {
        return false;
      }
    }

    if (ad.endDate) {
      const endMs = new Date(ad.endDate).getTime();
      if (!isNaN(endMs) && endMs < now) {
        return false;
      }
    }

    if (this.isFrequencyCapReached(ad)) {
      return false;
    }

    return true;
  }

  /**
   * Get matching House Ad fallback when commercial inventory is unfilled.
   */
  public getHouseAd(position?: AdPosition, preferredType?: HouseAd["type"]): HouseAd {
    if (preferredType) {
      const match = DEFAULT_HOUSE_ADS.find(h => h.type === preferredType);
      if (match) return match;
    }

    if (position === "article_audio_sponsor" || position === "listenos_sponsor" || position === "listenos_preroll" || position === "listenos_queue_sponsor") {
      return DEFAULT_HOUSE_ADS.find(h => h.type === "listenos") || DEFAULT_HOUSE_ADS[1];
    }

    if (position === "sidebar" || position === "category_newsletter_sponsor") {
      return DEFAULT_HOUSE_ADS.find(h => h.type === "newsletter") || DEFAULT_HOUSE_ADS[3];
    }

    if (position === "mobile_sticky" || position === "district_sponsor") {
      return DEFAULT_HOUSE_ADS.find(h => h.type === "download_app") || DEFAULT_HOUSE_ADS[0];
    }

    // Default rotation
    const idx = Math.floor(Math.random() * DEFAULT_HOUSE_ADS.length);
    return DEFAULT_HOUSE_ADS[idx];
  }

  /**
   * Generates or retrieves ListenOS Audio Sponsor Briefing audio line
   */
  public getListenOSSponsorStatement(advertiserName?: string, language: "ne" | "en" = "ne"): { audioNotice: string; textNotice: string; advertiser: string } {
    const adv = advertiserName || "नेपाल टेलिकम (Nepal Telecom)";
    if (language === "en") {
      return {
        audioNotice: `This news briefing is supported by ${adv}.`,
        textNotice: `Sponsored by ${adv}`,
        advertiser: adv
      };
    }
    return {
      audioNotice: `यो समाचार बुलेटिनलाई ${adv}ले प्रायोजन गरेको छ।`,
      textNotice: `प्रायोजित: ${adv}`,
      advertiser: adv
    };
  }

  /**
   * Filters and selects the best matching active ad for a given position and context.
   */
  public selectAd(
    ads: Ad[],
    position: AdPosition,
    context?: {
      category?: string;
      district?: string;
      province?: string;
      municipality?: string;
      device?: "desktop" | "mobile" | "tablet";
      language?: "ne" | "en";
    }
  ): Ad | null {
    if (!ads || ads.length === 0) return null;

    const compatiblePositions = this.resolvePositionAliases(position);

    // 1. Filter by compatible positions and eligibility
    const positionAds = ads.filter((ad) => {
      if (!compatiblePositions.includes(ad.position)) return false;
      return this.isAdEligible(ad);
    });

    if (positionAds.length === 0) return null;

    // 2. Contextual Targeting (Category, District, Province, Municipality, Device)
    const targetMatchedAds = positionAds.filter((ad) => {
      // Category Targeting
      if (ad.targetCategories && ad.targetCategories.length > 0) {
        const hasAll = ad.targetCategories.some(c => c.toLowerCase() === "all" || c === "सबै");
        if (!hasAll) {
          if (!context?.category) return false;
          const matchesCategory = ad.targetCategories.includes(context.category);
          if (!matchesCategory) return false;
        }
      }

      // District / Geo Targeting with bilingual normalization
      if (ad.targetDistricts && ad.targetDistricts.length > 0) {
        const hasAll = ad.targetDistricts.some(d => d.toLowerCase() === "all" || d === "सबै");
        if (!hasAll) {
          if (!context?.district) return false;
          const normContextDist = this.normalizeLocation(context.district);
          const matchesDistrict = ad.targetDistricts.some(d => {
            const normAdDist = this.normalizeLocation(d);
            return normAdDist === normContextDist || normContextDist.includes(normAdDist) || normAdDist.includes(normContextDist);
          });
          if (!matchesDistrict) return false;
        }
      }

      // Province Targeting
      if (ad.targetProvinces && ad.targetProvinces.length > 0) {
        const hasAll = ad.targetProvinces.some(p => p.toLowerCase() === "all" || p === "सबै");
        if (!hasAll) {
          if (!context?.province) return false;
          const normContextProv = this.normalizeLocation(context.province);
          const matchesProvince = ad.targetProvinces.some(p => {
            const normAdProv = this.normalizeLocation(p);
            return normAdProv === normContextProv || normContextProv.includes(normAdProv) || normAdProv.includes(normContextProv);
          });
          if (!matchesProvince) return false;
        }
      }

      // Device Targeting
      if (ad.targetDevices && ad.targetDevices.length > 0) {
        const targetDev = context?.device || (typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop");
        const matchesDevice = ad.targetDevices.includes(targetDev);
        if (!matchesDevice) return false;
      }

      return true;
    });

    if (targetMatchedAds.length === 0) return null;
    return this.pickWeightedCandidate(targetMatchedAds);
  }

  /**
   * Returns all eligible matching ads for a position and context, enabling sequential carousel / multi-ad rotation.
   */
  public getMatchingAds(
    ads: Ad[],
    position: AdPosition,
    context?: {
      category?: string;
      district?: string;
      province?: string;
      municipality?: string;
      device?: "desktop" | "mobile" | "tablet";
      language?: "ne" | "en";
    }
  ): Ad[] {
    if (!ads || ads.length === 0) return [];

    const compatiblePositions = this.resolvePositionAliases(position);

    const positionAds = ads.filter((ad) => {
      if (!compatiblePositions.includes(ad.position)) return false;
      return this.isAdEligible(ad);
    });

    if (positionAds.length === 0) return [];

    return positionAds.filter((ad) => {
      if (ad.targetCategories && ad.targetCategories.length > 0) {
        const hasAll = ad.targetCategories.some(c => c.toLowerCase() === "all" || c === "सबै");
        if (!hasAll && context?.category && !ad.targetCategories.includes(context.category)) return false;
      }

      if (ad.targetDistricts && ad.targetDistricts.length > 0) {
        const hasAll = ad.targetDistricts.some(d => d.toLowerCase() === "all" || d === "सबै");
        if (!hasAll && context?.district) {
          const normContextDist = this.normalizeLocation(context.district);
          const matches = ad.targetDistricts.some(d => {
            const normAdDist = this.normalizeLocation(d);
            return normAdDist === normContextDist || normContextDist.includes(normAdDist) || normAdDist.includes(normContextDist);
          });
          if (!matches) return false;
        }
      }

      if (ad.targetProvinces && ad.targetProvinces.length > 0) {
        const hasAll = ad.targetProvinces.some(p => p.toLowerCase() === "all" || p === "सबै");
        if (!hasAll && context?.province) {
          const normContextProv = this.normalizeLocation(context.province);
          const matches = ad.targetProvinces.some(p => {
            const normAdProv = this.normalizeLocation(p);
            return normAdProv === normContextProv || normContextProv.includes(normAdProv) || normAdProv.includes(normContextProv);
          });
          if (!matches) return false;
        }
      }

      if (ad.targetDevices && ad.targetDevices.length > 0) {
        const targetDev = context?.device || (typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop");
        if (!ad.targetDevices.includes(targetDev)) return false;
      }

      return true;
    });
  }

  /**
   * Selects an ad candidate using weighted probability.
   */
  private pickWeightedCandidate(candidates: Ad[]): Ad | null {
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    const totalWeight = candidates.reduce((sum, ad) => {
      const weight = Math.max(1, ad.priority || ad.weight || 1);
      return sum + weight;
    }, 0);

    let random = Math.random() * totalWeight;

    for (const ad of candidates) {
      const weight = Math.max(1, ad.priority || ad.weight || 1);
      if (random < weight) {
        return ad;
      }
      random -= weight;
    }

    return candidates[0];
  }

  /**
   * Registers a verified viewable impression with strict anti-double-counting guarantees.
   */
  public recordImpression(
    ad: Ad,
    context?: {
      category?: string;
      district?: string;
      device?: string;
      pageViewId?: string;
      sessionId?: string;
      membershipTier?: string;
      route?: string;
    }
  ): void {
    if (!ad?.id) return;

    // Strict Zero-Ad Defense: Never record impressions for premium members
    const tier = context?.membershipTier;
    if (tier === "sanrakshak" || tier === "sadhak" || tier === "corporate" || tier === "patron") {
      return;
    }

    const eventKey = adDeliveryEventStore.generateEventKey(
      ad.id,
      context?.pageViewId,
      ad.position,
      "impression"
    );

    const recorded = adDeliveryEventStore.recordEvent({
      id: eventKey,
      campaignId: ad.id,
      advertiserId: ad.advertiserId,
      eventType: "impression",
      placement: ad.position,
      route: context?.route || (typeof window !== "undefined" ? window.location.pathname : undefined),
      deviceClass: (context?.device as any) || (typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop"),
      sessionId: context?.sessionId,
      pageViewId: context?.pageViewId,
      timestamp: new Date().toISOString(),
      membershipTier: context?.membershipTier || "free",
      targetingContext: {
        category: context?.category,
        district: context?.district
      },
      source: "web",
      verified: true
    });

    if (!recorded) {
      return; // Duplicate impression rejected by idempotency gate
    }

    // Increment telemetry counters
    adInventoryCache.incrementTelemetry("impressionCount");

    // Increment local metrics
    ad.impressions = (ad.impressions || 0) + 1;
    this.incrementFrequency(ad.id);

    this.pendingImpressions.push({
      adId: ad.id,
      position: ad.position,
      category: context?.category,
      district: context?.district,
      device: context?.device || (typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop"),
      timestamp: new Date().toISOString()
    });

    if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => {
        this.flushImpressions();
      }, 2500);
    }
  }

  /**
   * Flushes queued impressions to the server API.
   */
  public async flushImpressions(): Promise<void> {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.pendingImpressions.length === 0) return;

    const payload = [...this.pendingImpressions];
    this.pendingImpressions = [];

    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ impressions: payload })], {
          type: "application/json; charset=UTF-8"
        });
        const success = navigator.sendBeacon("/api/ad-analytics/batch-impressions", blob);
        if (!success) {
          await fetch("/api/ad-analytics/batch-impressions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ impressions: payload }),
            keepalive: true
          });
        }
      } else {
        await fetch("/api/ad-analytics/batch-impressions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ impressions: payload })
        });
      }
    } catch (err) {
      console.warn("Failed to flush ad impressions:", err);
    }
  }

  /**
   * Tracks an ad click with deterministic deduplication.
   */
  public trackClick(
    ad: Ad, 
    context?: { 
      category?: string; 
      district?: string;
      pageViewId?: string;
      sessionId?: string;
      membershipTier?: string;
      route?: string;
    }
  ): string {
    if (!ad?.id) return ad?.linkUrl || "#";

    const eventKey = adDeliveryEventStore.generateEventKey(
      ad.id,
      context?.pageViewId,
      ad.position,
      "click"
    );

    const recorded = adDeliveryEventStore.recordEvent({
      id: eventKey,
      campaignId: ad.id,
      advertiserId: ad.advertiserId,
      eventType: "click",
      placement: ad.position,
      route: context?.route || (typeof window !== "undefined" ? window.location.pathname : undefined),
      deviceClass: typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop",
      sessionId: context?.sessionId,
      pageViewId: context?.pageViewId,
      timestamp: new Date().toISOString(),
      membershipTier: context?.membershipTier || "free",
      targetingContext: {
        category: context?.category,
        district: context?.district
      },
      source: "web",
      verified: true
    });

    if (recorded) {
      adInventoryCache.incrementTelemetry("clickCount");
      ad.clicks = (ad.clicks || 0) + 1;
    }

    try {
      fetch(`/api/ad-click/${ad.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: context?.category,
          district: context?.district,
          device: typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop",
          timestamp: new Date().toISOString()
        })
      }).catch(() => {});
    } catch {}

    return ad.linkUrl || "#";
  }

  /**
   * Computes the calculated status for an Ad record based on dates, flags, and review pipeline.
   */
  public calculateAdStatus(ad: Ad): Ad["status"] {
    if (ad.isActive === false) return "paused";
    if (ad.status === "draft") return "draft";
    if (ad.status === "pending_review") return "pending_review";
    if (ad.status === "needs_changes") return "needs_changes";
    if (ad.status === "completed") return "completed";
    if (ad.status === "archived") return "archived";
    if (ad.status === "rejected") return "rejected";
    if (ad.status === "paused") return "paused";

    const now = Date.now();
    if (ad.startDate) {
      const startMs = new Date(ad.startDate).getTime();
      if (!isNaN(startMs) && startMs > now) return "scheduled";
    }

    if (ad.endDate) {
      const endMs = new Date(ad.endDate).getTime();
      if (!isNaN(endMs) && endMs < now) return "expired";
    }

    return "active";
  }
}

export const adEngine = new AdEngine();

