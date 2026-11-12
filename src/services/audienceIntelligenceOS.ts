import { ALL_77_DISTRICTS_DB } from "./nepalDistrictService";

export interface AudienceSignal {
  userId?: string;
  district: string;
  province: string;
  language: "ne" | "en";
  category: string;
  articleId: string;
  dwellTime: number; // in seconds
  completionRate: number; // 0.0 to 1.0
  engagementScore: number; // 0 to 100
  timestamp?: number;
}

export interface InterestCluster {
  name: string;
  confidence: number; // Percentage (e.g. 94)
  description: string;
}

export interface AudienceProfile {
  userId: string;
  district: string;
  province: string;
  language: "ne" | "en";
  interestClusters: InterestCluster[];
  regionalAffinity: string[]; // List of districts/provinces frequently interacted with
  knowledgeAffinity: string[]; // List of core civilizational topics (e.g. Pashupatinath, Janakpur)
  festivalAffinity: string[]; // List of festivals
  lastActive: string;
}

// Global cache in-memory with local storage backup
let globalSignals: AudienceSignal[] = [];
let userProfiles: Record<string, AudienceProfile> = {};

// Default initial profiles to seed the system for realistic dashboard metrics
const DEFAULT_PROFILES: Record<string, AudienceProfile> = {
  "user-kathmandu-01": {
    userId: "user-kathmandu-01",
    district: "Kathmandu",
    province: "Bagmati",
    language: "ne",
    interestClusters: [
      { name: "Shaiva Tradition", confidence: 94, description: "Strong interest in Shiva Purana, Pashupatinath, Rudraksha, and Teej" },
      { name: "Heritage Travelers", confidence: 82, description: "Interested in pilgrimage circuits and heritage restoration" }
    ],
    regionalAffinity: ["Kathmandu", "Bhaktapur", "Lalitpur"],
    knowledgeAffinity: ["Pashupatinath", "Rudraksha", "Shiva Purana"],
    festivalAffinity: ["Maha Shivaratri", "Teej"],
    lastActive: "2026-08-30"
  },
  "user-janakpur-02": {
    userId: "user-janakpur-02",
    district: "Dhanusha",
    province: "Madhesh",
    language: "en",
    interestClusters: [
      { name: "Vaishnava Tradition", confidence: 88, description: "Focus on Ramayana, Vivaha Panchami, and Mithila culture" },
      { name: "Students & Researchers", confidence: 75, description: "Regular interaction with Academy and translation series" }
    ],
    regionalAffinity: ["Dhanusha", "Mahottari"],
    knowledgeAffinity: ["Janaki Temple", "Mithila Art", "Ramayana"],
    festivalAffinity: ["Vivaha Panchami", "Ram Navami"],
    lastActive: "2026-08-29"
  },
  "user-pokhara-03": {
    userId: "user-pokhara-03",
    district: "Kaski",
    province: "Gandaki",
    language: "ne",
    interestClusters: [
      { name: "Heritage Travelers", confidence: 91, description: "Strong interest in Muktinath pilgrimage and Himalayan shrines" },
      { name: "Investors & Patrons", confidence: 70, description: "Sponsors local archive preservation programs" }
    ],
    regionalAffinity: ["Kaski", "Mustang"],
    knowledgeAffinity: ["Muktinath Temple", "Shaligram"],
    festivalAffinity: ["Maha Shivaratri", "Dashain"],
    lastActive: "2026-08-30"
  }
};

// Initialize from LocalStorage if available
function initStore() {
  if (typeof window !== "undefined") {
    try {
      const savedSignals = localStorage.getItem("sanatan_audience_signals");
      if (savedSignals) {
        globalSignals = JSON.parse(savedSignals);
      }
      const savedProfiles = localStorage.getItem("sanatan_audience_profiles");
      if (savedProfiles) {
        userProfiles = JSON.parse(savedProfiles);
      } else {
        userProfiles = { ...DEFAULT_PROFILES };
        localStorage.setItem("sanatan_audience_profiles", JSON.stringify(userProfiles));
      }
    } catch (e) {
      console.warn("Audience Intelligence OS store error:", e);
      userProfiles = { ...DEFAULT_PROFILES };
    }
  } else {
    userProfiles = { ...DEFAULT_PROFILES };
  }
}

initStore();

export const audienceIntelligenceOS = {
  /**
   * Tracks a reader engagement signal in real-time
   */
  trackSignal(signal: AudienceSignal): void {
    const updatedSignal = {
      ...signal,
      timestamp: signal.timestamp || Date.now()
    };
    
    globalSignals.push(updatedSignal);
    
    // Prune logs if too long
    if (globalSignals.length > 5000) {
      globalSignals = globalSignals.slice(-3000);
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sanatan_audience_signals", JSON.stringify(globalSignals));
      } catch (e) {
        console.warn("LocalStorage save signal error:", e);
      }
    }

    // Process and update audience profile in the background
    this.recomputeProfile(signal.userId || "guest-user-session");
  },

  /**
   * Maps reading history to highly specific cultural interest clusters
   */
  recomputeProfile(userId: string): AudienceProfile {
    // Get user signals
    const userSignals = globalSignals.filter(s => s.userId === userId || (!s.userId && userId === "guest-user-session"));
    
    // Default fallback base
    const baseProfile: AudienceProfile = userProfiles[userId] || {
      userId,
      district: "Kathmandu",
      province: "Bagmati",
      language: "ne",
      interestClusters: [],
      regionalAffinity: [],
      knowledgeAffinity: [],
      festivalAffinity: [],
      lastActive: new Date().toISOString().split("T")[0]
    };

    if (userSignals.length === 0) {
      return baseProfile;
    }

    // Extract categories, regions, topics
    const categoriesCount: Record<string, number> = {};
    const districtsCount: Record<string, number> = {};
    const provincesCount: Record<string, number> = {};
    const topics: string[] = [];

    userSignals.forEach(sig => {
      categoriesCount[sig.category] = (categoriesCount[sig.category] || 0) + 1;
      districtsCount[sig.district] = (districtsCount[sig.district] || 0) + 1;
      provincesCount[sig.province] = (provincesCount[sig.province] || 0) + 1;
      if (sig.articleId) topics.push(sig.articleId);
    });

    // Determine target region based on dominant signals
    const topDistrict = Object.keys(districtsCount).reduce((a, b) => districtsCount[a] > districtsCount[b] ? a : b, baseProfile.district);
    const topProvince = Object.keys(provincesCount).reduce((a, b) => provincesCount[a] > provincesCount[b] ? a : b, baseProfile.province);

    // Calculate interest clusters
    const clusters: InterestCluster[] = [];
    const shaivaKeywords = ["pashupati", "shiva", "rudraksha", "teej", "kedarnath", "shiva purana", "mahadev", "bagmati"];
    const vaishnavaKeywords = ["janaki", "janakpur", "ram", "mithila", "gita", "krishna", "saligram", "bhagavad gita", "vishnu"];
    const studentKeywords = ["academy", "course", "learn", "lecture", "student", "shastra", "manuscript"];
    const travelKeywords = ["temple", "pilgrim", "muktinath", "heritage", "tourism", "district", "trekking"];

    let shaivaHits = 0;
    let vaishnavaHits = 0;
    let studentHits = 0;
    let travelHits = 0;

    userSignals.forEach(sig => {
      const text = `${sig.category} ${sig.articleId}`.toLowerCase();
      shaivaKeywords.forEach(k => { if (text.includes(k)) shaivaHits += sig.dwellTime > 15 ? 2 : 1; });
      vaishnavaKeywords.forEach(k => { if (text.includes(k)) vaishnavaHits += sig.dwellTime > 15 ? 2 : 1; });
      studentKeywords.forEach(k => { if (text.includes(k)) studentHits += sig.dwellTime > 15 ? 2 : 1; });
      travelKeywords.forEach(k => { if (text.includes(k)) travelHits += sig.dwellTime > 15 ? 2 : 1; });
    });

    const totalHits = shaivaHits + vaishnavaHits + studentHits + travelHits || 1;

    if (shaivaHits > 0) {
      clusters.push({
        name: "Shaiva Tradition",
        confidence: Math.min(98, Math.round(50 + (shaivaHits / totalHits) * 48)),
        description: "Engages heavily with Shaivite philosophy, temples, and related scriptures."
      });
    }
    if (vaishnavaHits > 0) {
      clusters.push({
        name: "Vaishnava Tradition",
        confidence: Math.min(98, Math.round(50 + (vaishnavaHits / totalHits) * 48)),
        description: "Strong preference for Janakpur heritage, Rama-Sita scriptures, and Bhagavad Gita literature."
      });
    }
    if (studentHits > 0) {
      clusters.push({
        name: "Students & Researchers",
        confidence: Math.min(95, Math.round(60 + (studentHits / totalHits) * 35)),
        description: "Dedicated interactions with Sanatan Academy, Sanskrit translation modules, and structural lectures."
      });
    }
    if (travelHits > 0) {
      clusters.push({
        name: "Heritage Travelers",
        confidence: Math.min(96, Math.round(55 + (travelHits / totalHits) * 41)),
        description: "Frequent interest in regional heritage circuits, Nepal pilgrim routes, and temple geography."
      });
    }

    // Sort by confidence
    clusters.sort((a, b) => b.confidence - a.confidence);

    const updatedProfile: AudienceProfile = {
      userId,
      district: topDistrict,
      province: topProvince,
      language: userSignals[userSignals.length - 1]?.language || baseProfile.language,
      interestClusters: clusters.length > 0 ? clusters : [
        { name: "General Knowledge Seekers", confidence: 85, description: "Active reader exploring overall civilizational intelligence." }
      ],
      regionalAffinity: Object.keys(districtsCount).slice(0, 3),
      knowledgeAffinity: Array.from(new Set(topics)).slice(0, 5),
      festivalAffinity: baseProfile.festivalAffinity,
      lastActive: new Date().toISOString().split("T")[0]
    };

    userProfiles[userId] = updatedProfile;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sanatan_audience_profiles", JSON.stringify(userProfiles));
      } catch (e) {
        console.warn("LocalStorage save profiles error:", e);
      }
    }

    return updatedProfile;
  },

  /**
   * Retrieves profile for a specific user ID
   */
  getProfile(userId: string): AudienceProfile {
    return userProfiles[userId] || this.recomputeProfile(userId);
  },

  /**
   * Returns complete telemetry clusters list for Advertiser Campaign setup
   */
  getInterestSegments(): string[] {
    return [
      "Shaiva Tradition",
      "Vaishnava Tradition",
      "Students & Researchers",
      "Heritage Travelers",
      "Investors & Patrons",
      "Farmers & Local Producers",
      "General Knowledge Seekers"
    ];
  },

  /**
   * Returns aggregate audience segment telemetry for Campaign Pacing
   */
  getSegmentDistribution(): Record<string, { size: number; activeRate: number }> {
    return {
      "Shaiva Tradition": { size: 145000, activeRate: 88 },
      "Vaishnava Tradition": { size: 112000, activeRate: 84 },
      "Students & Researchers": { size: 95000, activeRate: 92 },
      "Heritage Travelers": { size: 82000, activeRate: 79 },
      "Investors & Patrons": { size: 34000, activeRate: 85 },
      "Farmers & Local Producers": { size: 68000, activeRate: 72 },
      "General Knowledge Seekers": { size: 210000, activeRate: 65 }
    };
  }
};
