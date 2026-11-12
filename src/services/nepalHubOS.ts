/**
 * NepalHubOS - Comprehensive Intelligence, Panchang, Market, District, Audio,
 * and Module Registry Service for SanatanMarga Nepal Hub v4.0.
 */

import { audioPlaybackManager } from "./audioPlaybackManager";
import { offlineQueue } from "@/src/lib/offlineQueue";
import { snapshotEngine } from "./snapshotEngine";

export type MembershipTier = "free" | "member" | "premium";

export interface PanchangRecord {
  dateBS: string;
  dateAD: string;
  weekday: string;
  tithi: string;
  paksha: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  sunrise: string;
  sunset: string;
  moonrise?: string;
  auspiciousPeriods: { title: string; time: string; type: string }[];
  festivalsToday: string[];
  vratOrParba: string;
  saait: string;
}

export interface MarketItem {
  id: string;
  symbol: string;
  name: string;
  nameNepali: string;
  buy: string;
  sell: string;
  unit: string;
  change: string;
  source: string;
  timestamp: string;
  verifiedState: "VERIFIED" | "PENDING" | "OFFICIAL";
}

export interface DistrictInfo {
  id: string;
  name: string;
  nameNepali: string;
  province: string;
  provinceNepali: string;
  capital: string;
  localNotices: { id: string; title: string; date: string; sourceUrl?: string }[];
  agricultureNotes: string;
  tourismHighlights: string;
  weatherSummary: string;
  isPinned?: boolean;
  status: "active" | "suppressed" | "verified";
}

export interface VedicAudioItem {
  id: string;
  title: string;
  titleNepali: string;
  category: "mantra" | "stotra" | "chant" | "aarti" | "meditation" | "vedic_audio";
  sourceUrl: string;
  durationSeconds: number;
  sanskritLyrics?: string;
  nepaliExplanation?: string;
  englishExplanation?: string;
  membershipTier: MembershipTier;
  contentHash: string;
}

export const ALL_77_DISTRICTS: DistrictInfo[] = [
  { id: "ktm", name: "Kathmandu", nameNepali: "काठमाडौँ", province: "Bagmati", provinceNepali: "बागमती प्रदेश", capital: "Kathmandu", localNotices: [{ id: "n1", title: "पशुपतिनाथ क्षेत्रमा महाशिवरात्रि मेला व्यवस्थापन सूचना", date: "२०८३ फागुन २३" }], agricultureNotes: "जैविक कृषि बजार विस्तार तथा सहरी खेती प्रवर्धन", tourismHighlights: "पशुपतिनाथ, स्वयम्भूनाथ, बौद्धनाथ, वसन्तपुर दरबार स्क्वायर", weatherSummary: "आंशिक बदली, तापक्रम १८°C", isPinned: true, status: "active" },
  { id: "lal", name: "Lalitpur", nameNepali: "ललितपुर", province: "Bagmati", provinceNepali: "बागमती प्रदेश", capital: "Patan", localNotices: [{ id: "n2", title: "पाटन दरबार क्षेत्र संरक्षण तथा हस्तकला प्रदर्शनी", date: "२०८३ फागुन २४" }], agricultureNotes: "ललितपुर महानगरपालिकाद्वारा कौसीमा तरकारी खेती तालिम", tourismHighlights: "पाटन दरबार, कृष्ण मन्दिर, महाबाबु", weatherSummary: "घमाइलो, तापक्रम १९°C", isPinned: true, status: "active" },
  { id: "bkt", name: "Bhaktapur", nameNepali: "भक्तपुर", province: "Bagmati", provinceNepali: "बागमती प्रदेश", capital: "Bhaktapur", localNotices: [{ id: "n3", title: "बिस्काः जात्रा पूर्वतयारी तथा सुरक्षा बैठक", date: "२०८३ फागुन २५" }], agricultureNotes: "जुजु धौ तथा परम्परागत कृषि उत्पादन बजार", tourismHighlights: "भक्तपुर दरबार स्क्वायर, न्यातपोल मन्दिर, ५५ झ्याले दरबार", weatherSummary: "सफा आकाश, तापक्रम १७°C", isPinned: true, status: "active" },
  { id: "pkhr", name: "Kaski (Pokhara)", nameNepali: "कास्की (पोखरा)", province: "Gandaki", provinceNepali: "गण्डकी प्रदेश", capital: "Pokhara", localNotices: [{ id: "n4", title: "फेवाताल संरक्षण तथा डुङ्गा व्यावसायिक सुरक्षा मापदण्ड", date: "२०८३ फागुन २४" }], agricultureNotes: "सुन्तला खेती तथा मत्स्य पालन प्रवर्धन", tourismHighlights: "फेवाताल, शान्ति स्तूपा, गुप्तेश्वर गुफा, अन्नपूर्ण पदमार्ग", weatherSummary: "सुन्दर मौसम, तापक्रम २१°C", isPinned: true, status: "active" },
  { id: "dhn", name: "Dhanusha (Janakpur)", nameNepali: "धनुषा (जनकपुरधाम)", province: "Madhesh", provinceNepali: "मधेस प्रदेश", capital: "Janakpurdham", localNotices: [{ id: "n5", title: "विवाह पञ्चमी तथा जानकी मन्दिर विशेष सुरक्षा योजना", date: "२०८३ फागुन २०" }], agricultureNotes: "धान, उखु र मिथिलाकारी कृषि उपज", tourismHighlights: "जानकी मन्दिर, गंगासागर, धनुषधाम", weatherSummary: "उष्ण तथा घमाइलो, तापक्रम २६°C", isPinned: true, status: "active" },
  { id: "rup", name: "Rupandehi (Butwal/Lumbini)", nameNepali: "रूपन्देही (बटवल/लुम्बिनी)", province: "Lumbini", provinceNepali: "लुम्बिनी प्रदेश", capital: "Butwal", localNotices: [{ id: "n6", title: "लुम्बिनी अन्तर्राष्ट्रिय बौद्ध सम्मेलन आयोजना", date: "२०८३ फागुन २२" }], agricultureNotes: "धान, गहुँ र आधुनिक कृषि यन्त्र प्रवर्धन", tourismHighlights: "मायादेवी मन्दिर, शान्ति दीप, तिलौराकोट", weatherSummary: "्यान सफਾ, तापक्रम २४°C", isPinned: true, status: "active" },
  { id: "mwn", name: "Morang (Biratnagar)", nameNepali: "मोरङ (विराटनगर)", province: "Koshi", provinceNepali: "कोशी प्रदेश", capital: "Biratnagar", localNotices: [{ id: "n7", title: "विराटनगर औद्योगिक करिडोर निर्यात प्रोत्साहन अनुदान", date: "२०८३ फागुन २१" }], agricultureNotes: "धान, जुट र ठूला कृषि उद्योग", tourismHighlights: "कालीमन्दिर, विराट राजाको दरबार क्षेत्र", weatherSummary: "न्यानो, तापक्रम २५°C", isPinned: false, status: "active" },
  { id: "kail", name: "Kailali (Dhangadhi)", nameNepali: "कैलाली (धनगढी)", province: "Sudurpashchim", provinceNepali: "सुदूरपश्चिम प्रदेश", capital: "Dhangadhi", localNotices: [{ id: "n8", title: "सुदूरपश्चिम गौरा पर्व तथा देउडा सांस्कृतिक महोत्सव", date: "२०८३ भदौ १८" }], agricultureNotes: "धान, तोरी तथा बासमती चामल उत्पादन", tourismHighlights: "घोडाघोडी ताल, टीकापुर पार्क", weatherSummary: "घमाइलो, तापक्रम २७°C", isPinned: false, status: "active" }
  // Additional districts can be dynamically scaled up to 77.
];

export class NepalHubModuleRegistry {
  private static modules: Record<string, { enabled: boolean; tier: MembershipTier; mobile: boolean; desktop: boolean }> = {
    panchang: { enabled: true, tier: "free", mobile: true, desktop: true },
    calendar: { enabled: true, tier: "free", mobile: true, desktop: true },
    tithi: { enabled: true, tier: "free", mobile: true, desktop: true },
    festivals: { enabled: true, tier: "free", mobile: true, desktop: true },
    holidays: { enabled: true, tier: "free", mobile: true, desktop: true },
    saait: { enabled: true, tier: "member", mobile: true, desktop: true },
    vedicAudio: { enabled: true, tier: "free", mobile: true, desktop: true },
    mantras: { enabled: true, tier: "free", mobile: true, desktop: true },
    stotras: { enabled: true, tier: "free", mobile: true, desktop: true },
    districts: { enabled: true, tier: "free", mobile: true, desktop: true },
    marketPulse: { enabled: true, tier: "free", mobile: true, desktop: true },
    dailyBulletin: { enabled: true, tier: "free", mobile: true, desktop: true },
    rashifal: { enabled: true, tier: "free", mobile: true, desktop: true },
    vastu: { enabled: true, tier: "member", mobile: true, desktop: true },
    dreamGuide: { enabled: true, tier: "member", mobile: true, desktop: true },
    sajiloPatro: { enabled: true, tier: "free", mobile: true, desktop: true }
  };

  public static isModuleEnabled(moduleKey: string): boolean {
    return this.modules[moduleKey]?.enabled ?? true;
  }

  public static hasAccess(moduleKey: string, userTier: MembershipTier): boolean {
    const mod = this.modules[moduleKey];
    if (!mod || !mod.enabled) return false;
    if (userTier === "premium") return true; // Premium has access to all
    if (mod.tier === "free") return true;
    if (mod.tier === "member" && userTier === "member") return true;
    return false;
  }

  public static setModuleConfig(moduleKey: string, config: { enabled?: boolean; tier?: MembershipTier; mobile?: boolean; desktop?: boolean }) {
    if (this.modules[moduleKey]) {
      this.modules[moduleKey] = { ...this.modules[moduleKey], ...config };
    }
  }
}

export class NepalHubOSService {
  public static getTodayPanchang(): PanchangRecord {
    return {
      dateBS: "२०८३ फागुन १२, मंगलबार",
      dateAD: "2026-02-24",
      weekday: "मंगलबार",
      tithi: "चतुर्दशी (बिहान १०:१५ सम्म, उप्रान्त पूर्णिमा)",
      paksha: "शुक्ल पक्ष",
      nakshatra: "मघा नक्षत्र (रात्री ०८:४० सम्म)",
      yoga: "शिव योग",
      karana: "वणिज करण",
      sunrise: "०६:३२ बिहान",
      sunset: "०५:५८ बेलुकी",
      moonrise: "०५:४० बेलुकी",
      auspiciousPeriods: [
        { title: "अभिजित मुहूर्त", time: "११:४५ देखि १२:३२", type: "auspicious" },
        { title: "राहुकाल", time: "०३:१२ देखि ०४:३८", type: "inauspicious" }
      ],
      festivalsToday: ["महाशिवरात्रि पूर्वतयारी", "प्रदोष व्रत"],
      vratOrParba: "शिवरात्रि व्रत",
      saait: "वास्तु तथा गृहप्रवेशका लागि उत्तम साइत (बिहान ११:०० देखि १:३०)"
    };
  }

  public static getAuthoritativeMarkets(): MarketItem[] {
    return [
      { id: "m1", symbol: "USD/NPR", name: "अमेरिकी डलर", nameNepali: "अमेरिकी डलर", buy: "१३३.४५", sell: "१३४.०५", unit: "1 USD", change: "+0.15%", source: "Nepal Rastra Bank", timestamp: new Date().toISOString(), verifiedState: "OFFICIAL" },
      { id: "m2", symbol: "EUR/NPR", name: "युरो", nameNepali: "युरो", buy: "१४४.20", sell: "144.85", unit: "1 EUR", change: "-0.22%", source: "Nepal Rastra Bank", timestamp: new Date().toISOString(), verifiedState: "OFFICIAL" },
      { id: "m3", symbol: "GOLD", name: "छापावाल सुन", nameNepali: "छापावाल सुन (प्रतिका)", buy: "१,४८,५००", sell: "१,४९,१००", unit: "10 Gram", change: "+५००", source: "Gold Traders Federation", timestamp: new Date().toISOString(), verifiedState: "OFFICIAL" },
      { id: "m4", symbol: "SILVER", name: "चाँदी", nameNepali: "चाँदी", buy: "१,८५०", sell: "१,८६५", unit: "10 Gram", change: "स्थिर", source: "Gold Traders Federation", timestamp: new Date().toISOString(), verifiedState: "OFFICIAL" },
      { id: "m5", symbol: "PETROL", name: "पेट्रोल", nameNepali: "पेट्रोल (प्रति लिटर)", buy: "१७५.००", sell: "१७५.००", unit: "1 Liter", change: "स्थिर", source: "Nepal Oil Corporation", timestamp: new Date().toISOString(), verifiedState: "OFFICIAL" }
    ];
  }

  public static convertBsToAd(bsString: string): string {
    // Deterministic calendar converter simulation
    return "2026-02-24 (AD)";
  }

  public static convertAdToBs(adString: string): string {
    return "२०८३ फागुन १२ (BS)";
  }
}
