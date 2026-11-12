import type { StorylineArc, StoryMilestone } from "@/src/types";

export const SEED_STORYLINE_ARCS: StorylineArc[] = [
  {
    id: "story-civil-service-bill",
    slug: "federal-civil-service-bill-2083",
    titleNepali: "संघीय निजामती सेवा विधेयक २०८३: प्रक्रिया र घटनाक्रम",
    titleEnglish: "Federal Civil Service Bill: Legislative Timeline & Outcomes",
    summaryNepali: "तीन तहका सरकारबीच कर्मचारी समायोजन, अनिवार्य अवकाश उमेर ६० वर्ष बनाउने प्रस्ताव, र श्रेणीगत व्यवस्थाको राष्ट्रिय बहस र निर्णयहरूको पूर्ण शृङ्खला।",
    summaryEnglish: "Comprehensive legislative journey of the Federal Civil Service Bill determining civil service retirement age, integration, and provincial quotas.",
    category: "arthaniti",
    districts: ["काठमाडौँ"],
    entityIds: ["cabinet-nepal", "civil-service-bill", "kp-oli", "supreme-court-nepal"],
    status: "developing",
    startedAt: "2026-07-15T08:00:00.000Z",
    lastUpdated: "2026-08-19T06:30:00.000Z",
    coverImage: "https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=2070&auto=format&fit=crop",
    subscriberCount: 1420,
    articleIds: ["art_sample_civil_service", "art_draft_1724050000000_abcde"],
    importanceTier: 1,
    milestones: [
      {
        id: "m-1",
        storyArcId: "story-civil-service-bill",
        date: "२०८३ साउन १",
        title: "मन्त्रिपरिषद्द्वारा विधेयकको मस्यौदा स्वीकृत",
        summary: "प्रधानमन्त्रीको अध्यक्षतामा बसेको मन्त्रिपरिषद् बैठकले विधेयक संसद्मा पेश गर्न सैद्धान्तिक स्वीकृति दियो।",
        type: "policy_announcement",
        importance: "high",
        verified: true,
        sourceLabel: "नेपाल सरकार राजपत्र",
        sourceUrl: "https://rajpatra.gov.np"
      },
      {
        id: "m-2",
        storyArcId: "story-civil-service-bill",
        date: "२०८३ साउन १२",
        title: "प्रतिनिधिसभामा विधेयक दर्ता र सैद्धान्तिक छलफल",
        summary: "सङ्घीय मामिला मन्त्रालयले प्रतिनिधिसभा सचिवालयमा विधेयक दर्ता गरायो। सांसदहरूद्वारा दफावार संशोधन प्रस्ताव दर्ता।",
        type: "breaking",
        importance: "high",
        verified: true,
        sourceLabel: "संसद् सचिवालय",
        sourceUrl: "https://parliament.gov.np"
      },
      {
        id: "m-3",
        storyArcId: "story-civil-service-bill",
        date: "२०८३ साउन २८",
        title: "राज्य व्यवस्था तथा सुशासन समितिमा दफावार छलफल",
        summary: "समितिमा अवकाश उमेर ५८ बाट ६० वर्ष बनाउने र ट्रेड युनियन अधिकारबारे पक्ष-विपक्षमा गहन छलफल सम्पन्न।",
        type: "committee_decision",
        importance: "high",
        verified: true,
        sourceLabel: "समिति कार्यदल",
        sourceUrl: "https://parliament.gov.np"
      },
      {
        id: "m-4",
        storyArcId: "story-civil-service-bill",
        date: "२०८३ भदौ ३",
        title: "कर्मचारी महासंघद्वारा संयुक्त ज्ञापनपत्र पेश",
        summary: "कर्मचारी हकहित संरक्षणका लागि समायोजन भएका कर्मचारीको वृत्तिविकास सुनिश्चित गर्न मागसहित सभामुखलाई ध्यानाकर्षण।",
        type: "public_protest",
        importance: "medium",
        verified: true,
        sourceLabel: "कर्मचारी संगठन"
      }
    ]
  },
  {
    id: "story-pashupati-masterplan",
    slug: "pashupatinath-masterplan-revamp",
    titleNepali: "पशुपतिनाथ क्षेत्र बृहत्तर गुरुयोजना र सम्पदा संरक्षण",
    titleEnglish: "Pashupatinath Area Masterplan & Heritage Preservation",
    summaryNepali: "विश्व सम्पदा सूचीकृत पशुपति क्षेत्रको प्राचीन वास्तुकला संरक्षण, वाग्मती स्वच्छता अभियान र भक्तजन सुव्यवस्थापनको बहुवर्षीय गुरुयोजना कार्यान्वयन।",
    summaryEnglish: "Multi-year implementation timeline for the UNESCO heritage conservation and spiritual corridor masterplan at Pashupatinath.",
    category: "sanskar",
    districts: ["काठमाडौँ"],
    entityIds: ["pashupatinath", "dashain"],
    status: "active",
    startedAt: "2026-05-10T10:00:00.000Z",
    lastUpdated: "2026-08-18T14:00:00.000Z",
    coverImage: "https://images.unsplash.com/photo-1609137144869-37367123d57f?q=80&w=2070&auto=format&fit=crop",
    subscriberCount: 2890,
    articleIds: [],
    importanceTier: 1,
    milestones: [
      {
        id: "m-p1",
        storyArcId: "story-pashupati-masterplan",
        date: "२०८३ जेठ १",
        title: "युनेस्को र संस्कृति मन्त्रालयद्वारा गुरुयोजना अनुमोदन",
        summary: "प्राचीन मन्दिर संरचनामा कुनै प्रतिकूल असर नपर्ने गरी वैदिक शैलीको भक्तजन विश्रामगृह र वाग्मती करिडोर योजना स्वीकृत।",
        type: "policy_announcement",
        importance: "high",
        verified: true,
        sourceLabel: "पशुपति क्षेत्र विकास कोष"
      },
      {
        id: "m-p2",
        storyArcId: "story-pashupati-masterplan",
        date: "२०८३ साउन १५",
        title: "वाग्मती नदी किनार सौन्दर्यीकरण र वृक्षारोपण सुरु",
        summary: "पावन वाग्मती तटमा ५ हजार रुद्राक्ष तथा बेलका बिरुवा रोप्ने हरित अभियानको शुभारम्भ।",
        type: "fact_finding",
        importance: "medium",
        verified: true
      }
    ]
  },
  {
    id: "story-monetary-policy-rebound",
    slug: "nepal-monetary-policy-economic-rebound",
    titleNepali: "मौद्रिक नीति २०८३/८४ र बैंकिङ तरलता सुधार",
    titleEnglish: "Monetary Policy 2083/84 & Banking Liquidity Trajectory",
    summaryNepali: "नेपाल राष्ट्र बैंकद्वारा ब्याजदर स्थायित्व, उत्पादनशील कर्जा प्रवाह र निर्माण क्षेत्रलाई गति दिन जारी गरिएको नीतिको प्रभाव र समीक्षा।",
    category: "arthaniti",
    districts: ["काठमाडौँ", "कास्की", "मोरङ"],
    entityIds: ["nepal-rastra-bank", "finance-ministry"],
    status: "active",
    startedAt: "2026-08-01T04:00:00.000Z",
    lastUpdated: "2026-08-19T05:00:00.000Z",
    coverImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop",
    subscriberCount: 1950,
    articleIds: [],
    importanceTier: 1,
    milestones: [
      {
        id: "m-m1",
        storyArcId: "story-monetary-policy-rebound",
        date: "२०८३ साउन ११",
        title: "केन्द्रीय बैंकद्वारा आर्थिक वर्षको मौद्रिक नीति सार्वजनिक",
        summary: "नीतिगत दर घटाइ ६ प्रतिशत कायम; घरजग्गा तथा सेयर कर्जाको जोखिमभारमा लचकता।",
        type: "policy_announcement",
        importance: "high",
        verified: true,
        sourceLabel: "नेपाल राष्ट्र बैंक"
      },
      {
        id: "m-m2",
        storyArcId: "story-monetary-policy-rebound",
        date: "२०८३ भदौ २",
        title: "बैंकिङ प्रणालीमा अधिक तरलता ६ खर्ब नाघ्यो",
        summary: "ब्याजदर न्यून विन्दुमा झरेपछि निजी क्षेत्रबाट कर्जाको मागमा क्रमिक सुधार देखिन थाल्यो।",
        type: "fact_finding",
        importance: "high",
        verified: true,
        sourceLabel: "नेपाल बैंकर्स संघ"
      }
    ]
  }
];

const LOCAL_STORAGE_STORYLINES_KEY = "sanatan_storyline_arcs_v3";
const LOCAL_STORAGE_FOLLOWED_KEY = "sanatan_followed_story_arcs";

export class StoryEvolutionEngine {
  private static storylines: StorylineArc[] = SEED_STORYLINE_ARCS;
  private static initialized = false;

  private static init() {
    if (this.initialized) return;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_STORYLINES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.storylines = parsed;
        }
      }
    } catch (e) {
      console.warn("[StoryEvolutionEngine] Failed to load from localStorage:", e);
    }
    this.initialized = true;
  }

  private static persist() {
    try {
      localStorage.setItem(LOCAL_STORAGE_STORYLINES_KEY, JSON.stringify(this.storylines));
    } catch (e) {}
  }

  static getStorylines(): StorylineArc[] {
    this.init();
    return this.storylines;
  }

  static getStorylineById(id: string): StorylineArc | undefined {
    this.init();
    return this.storylines.find(s => s.id === id || s.slug === id);
  }

  static getStorylineForArticle(articleId: string, articleTitle: string = "", district: string = ""): StorylineArc | undefined {
    this.init();
    // 1. Direct article ID match
    const directMatch = this.storylines.find(s => s.articleIds.includes(articleId));
    if (directMatch) return directMatch;

    // 2. Semantic title & district match
    const lowerTitle = articleTitle.toLowerCase();
    return this.storylines.find(s => {
      const titleNep = s.titleNepali.toLowerCase();
      if (lowerTitle.includes("निजामती") && titleNep.includes("निजामती")) return true;
      if (lowerTitle.includes("पशुपति") && titleNep.includes("पशुपति")) return true;
      if (lowerTitle.includes("मौद्रिक नीति") && titleNep.includes("मौद्रिक नीति")) return true;
      if (s.districts.includes(district) && s.districts.length === 1 && district === "काठमाडौँ" && (lowerTitle.includes("विधेयक") || lowerTitle.includes("अदालत"))) return true;
      return false;
    });
  }

  static addMilestone(storyArcId: string, milestone: Omit<StoryMilestone, "id" | "storyArcId">): StoryMilestone | null {
    this.init();
    const story = this.storylines.find(s => s.id === storyArcId);
    if (!story) return null;

    const newMilestone: StoryMilestone = {
      ...milestone,
      id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      storyArcId
    };

    story.milestones.push(newMilestone);
    story.lastUpdated = new Date().toISOString();
    this.persist();
    return newMilestone;
  }

  static isFollowingStory(storyArcId: string): boolean {
    try {
      const followed = JSON.parse(localStorage.getItem(LOCAL_STORAGE_FOLLOWED_KEY) || "[]");
      return Array.isArray(followed) && followed.includes(storyArcId);
    } catch (e) {
      return false;
    }
  }

  static toggleFollowStory(storyArcId: string): boolean {
    try {
      const followed: string[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_FOLLOWED_KEY) || "[]");
      const index = followed.indexOf(storyArcId);
      let isNowFollowing = false;

      if (index >= 0) {
        followed.splice(index, 1);
        isNowFollowing = false;
      } else {
        followed.push(storyArcId);
        isNowFollowing = true;
      }

      localStorage.setItem(LOCAL_STORAGE_FOLLOWED_KEY, JSON.stringify(followed));

      // Update story subscriber counter
      const story = this.storylines.find(s => s.id === storyArcId);
      if (story) {
        story.subscriberCount = Math.max(0, (story.subscriberCount || 0) + (isNowFollowing ? 1 : -1));
        this.persist();
      }

      return isNowFollowing;
    } catch (e) {
      return false;
    }
  }

  static getFollowedStorylines(): StorylineArc[] {
    this.init();
    try {
      const followed: string[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_FOLLOWED_KEY) || "[]");
      if (!Array.isArray(followed)) return [];
      return this.storylines.filter(s => followed.includes(s.id));
    } catch (e) {
      return [];
    }
  }
}
