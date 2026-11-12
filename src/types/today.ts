export interface TodayCalendar {
  bsDate: string; // e.g., "भदौ १३, २०८३"
  adDate: string; // e.g., "August 28, 2026"
  dayOfWeek: string; // e.g., "बिहीवार"
  tithi: string; // e.g., "शुक्ल पक्ष द्वितीया"
  nakshatra: string; // e.g., "उत्तराफाल्गुनी"
  yoga: string; // e.g., "ब्रह्म"
  karana: string; // e.g., "बालव"
  sunrise: string; // e.g., "05:32 AM"
  sunset: string; // e.g., "06:45 PM"
  festivals: string[]; // e.g., ["श्रीकृष्ण जन्माष्टमी विशेष", "ऋषिपञ्चमी पूर्वसन्ध्या"]
}

export interface NationalIntelligenceItem {
  id: string;
  category: 'breaking' | 'politics' | 'economy' | 'society' | 'technology';
  title: string;
  summary: string;
  source: string;
  timeAgo: string;
  whyItMatters: string;
  impactScore: number; // 1-100
}

export interface DistrictIntelligenceNode {
  districtId: string;
  districtNameNepali: string;
  districtNameEnglish: string;
  province: string;
  intelligenceActivity: 'High' | 'Moderate' | 'Emerging';
  activityScore: number; // 1-100
  metrics: {
    newsCount: number;
    govtNoticesCount: number;
    marketActivity: string;
    agriStatus: string;
    tourismStatus: string;
    weatherAlert: string;
  };
  latestLocalNotice: string;
}

export interface MarketPulseData {
  forexRates: {
    usd: string;
    eur: string;
    gbp: string;
    inr: string;
  };
  civicIndicators: {
    hydroGeneration: string;
    remittanceInflow: string;
    provincesCovered: string;
  };
  whyItMattersMarket: string;
}

export interface VedicAudioItem {
  id: string;
  title: string;
  language: string;
  script: string;
  tradition: string;
  deityOrTopic: string;
  duration: string;
  source: string;
  transliteration: string;
  meaning: string;
  collection: 'Veda' | 'Upanishad' | 'Stotra' | 'Mantra' | 'Chalisa' | 'Aarti' | 'Shloka' | 'Meditation' | 'Festival' | 'Morning' | 'Evening';
  audioVersion: string;
  provenance: string;
  membershipTier: 'Free' | 'Member' | 'Premium';
  audioUrl?: string;
}

export interface WhatChangedDelta {
  id: string;
  category: string;
  yesterdayState: string;
  todayState: string;
  deltaImpact: string;
  timestamp: string;
}

export interface TodayObject {
  dateKey: string;
  calendar: TodayCalendar;
  nationalIntelligence: NationalIntelligenceItem[];
  districtsIntelligence: DistrictIntelligenceNode[];
  marketPulse: MarketPulseData;
  dharmaCulture: {
    dailyMantra: {
      sanskrit: string;
      transliteration: string;
      meaning: string;
      deity: string;
    };
    dailyStotra: {
      title: string;
      excerpt: string;
    };
  };
  whatChangedDeltas: WhatChangedDelta[];
  dailyBulletin: {
    title: string;
    summary: string;
    audioDuration: string;
    bulletinPoints: string[];
  };
}
