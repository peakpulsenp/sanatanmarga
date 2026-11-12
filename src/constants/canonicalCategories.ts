/**
 * SANATANMEDIA 5.0 — 12 CANONICAL NEWS CATEGORIES (Section 4.2.1)
 *
 * Topic Boundary Rule (Section 4.2.2):
 * Gold, silver, NEPSE, and stock-market topics are permitted strictly as newsroom
 * discovery and editorial reporting topics under Economy, Business, Markets & Policy.
 * Dedicated live rate panels, NEPSE tickers, stock trackers, or trading UIs are forbidden.
 */

export interface CanonicalNewsCategory {
  id: string;
  slug: string;
  nameNe: string;
  nameEn: string;
  descriptionNe: string;
  descriptionEn: string;
  subtopics: string[];
  order: number;
}

export const CANONICAL_12_NEWS_CATEGORIES: CanonicalNewsCategory[] = [
  {
    id: "cat-national-governance",
    slug: "politics",
    nameNe: "१. राष्ट्रिय, शासन र सार्वजनिक नीति",
    nameEn: "1. National & Governance",
    descriptionNe: "संसद्, सरकार, संविधान, कूटनीति, कानून र सार्वजनिक प्रशासन।",
    descriptionEn: "Parliament, government, constitution, diplomacy, judiciary, and public administration.",
    subtopics: ["Parliament", "Federal Government", "Constitution", "Judiciary", "Public Policy"],
    order: 1
  },
  {
    id: "cat-economy-markets",
    slug: "economy",
    nameNe: "२. अर्थतन्त्र, व्यापार, बजार र नीति",
    nameEn: "2. Economy, Business, Markets & Policy",
    descriptionNe: "बजेट, बैंकिङ, राष्ट्र बैंक नीति, ऊर्जा, व्यापार र बजार समाचार (सुनचाँदी/नेप्से समाचार रिपोर्टिङ मात्र)।",
    descriptionEn: "Macroeconomics, banking, NRB policy, trade, infrastructure, and market news reporting (editorial coverage of gold/silver/NEPSE policy & trends only).",
    subtopics: ["Fiscal Policy", "Banking & NRB", "Hydropower & Trade", "Market News Reporting", "Commodities & Bullion News"],
    order: 2
  },
  {
    id: "cat-society-civic",
    slug: "society",
    nameNe: "३. समाज र नागरिक जीवन",
    nameEn: "3. Society & Civic Life",
    descriptionNe: "सामाजिक न्याय, जनजीवन, बसाइँसराइ, प्रवास र नागरिक सरोकार।",
    descriptionEn: "Social cohesion, diaspora, demographics, public welfare, and civic life.",
    subtopics: ["Civic Welfare", "Diaspora", "Urbanization", "Social Justice"],
    order: 3
  },
  {
    id: "cat-culture-dharma",
    slug: "culture",
    nameNe: "४. संस्कृति, धर्म, दर्शन र सम्पदा",
    nameEn: "4. Culture, Dharma, Philosophy & Heritage",
    descriptionNe: "सनातन दर्शन, वैदिक परम्परा, मन्दिर सम्पदा, जात्रा, पुरातत्व र सभ्यता।",
    descriptionEn: "Sanatan philosophy, Vedic traditions, temple heritage, jatras, archaeology, and civilization.",
    subtopics: ["Sanatan Philosophy", "Heritage Conservation", "Festivals & Jatras", "Epigraphy & Manuscripts"],
    order: 4
  },
  {
    id: "cat-science-tech",
    slug: "technology",
    nameNe: "५. विज्ञान, प्रविधि र नवप्रवर्तन",
    nameEn: "5. Science, Technology & Innovation",
    descriptionNe: "कृत्रिम बुद्धिमत्ता (AI), डिजिटल पूर्वाधार, साइबर सुरक्षा र वैज्ञानिक अनुसन्धान।",
    descriptionEn: "Artificial intelligence, digital public infrastructure, cybersecurity, and scientific research.",
    subtopics: ["AI & Computing", "Digital Nepal", "Cybersecurity", "Space & Astronomy"],
    order: 5
  },
  {
    id: "cat-education-youth",
    slug: "education",
    nameNe: "६. शिक्षा, युवा र सीप",
    nameEn: "6. Education, Youth & Skills",
    descriptionNe: "विश्वविद्यालय, गुरुकुल शिक्षा, पाठ्यक्रम, छात्रवृत्ति र युवा रोजगारी।",
    descriptionEn: "Universities, Gurukul pedagogy, curriculum reform, research fellowships, and youth skills.",
    subtopics: ["Higher Education", "Gurukul & Sanskrit", "Youth Employment", "Academic Research"],
    order: 6
  },
  {
    id: "cat-health-environment",
    slug: "health",
    nameNe: "७. स्वास्थ्य, आयुर्वेद, वातावरण र जलवायु",
    nameEn: "7. Health, Ayurveda, Environment & Climate",
    descriptionNe: "जनस्वास्थ्य, आयुर्वेद र योग, हिमालय पर्यावरण, जलवायु परिवर्तन र विपद् जोखिम।",
    descriptionEn: "Public health, Ayurveda & Yoga, Himalayan ecology, climate resilience, and biodiversity.",
    subtopics: ["Public Health", "Ayurveda & Wellness", "Himalayan Climate", "Conservation"],
    order: 7
  },
  {
    id: "cat-provinces-districts",
    slug: "provinces",
    nameNe: "८. प्रदेश र ७७ जिल्ला",
    nameEn: "8. Provinces & Districts",
    descriptionNe: "सातै प्रदेश र ७७ वटै जिल्लाका स्थानीय सरकार, विकास र क्षेत्रीय गतिविधि।",
    descriptionEn: "Local governance, development projects, and regional reporting across all 7 provinces and 77 districts.",
    subtopics: ["Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"],
    order: 8
  },
  {
    id: "cat-south-asia-world",
    slug: "world",
    nameNe: "९. दक्षिण एसिया र विश्व",
    nameEn: "9. South Asia & World",
    descriptionNe: "भूराजनीति, छिमेकी सम्बन्ध, अन्तर्राष्ट्रिय संस्था र विश्व घटनाक्रम।",
    descriptionEn: "Geopolitics, South Asian regional affairs, international treaties, and global developments.",
    subtopics: ["South Asia", "Geopolitics", "Global Economy", "Nepali Missions Abroad"],
    order: 9
  },
  {
    id: "cat-opinion-analysis",
    slug: "opinion",
    nameNe: "१०. विचार, सम्पादकीय र विश्लेषण",
    nameEn: "10. Opinion, Editorial & Deep Analysis",
    descriptionNe: "सम्पादकीय दृष्टिकोण, विज्ञ स्तम्भ, नीति बहस र दार्शनिक विमर्श।",
    descriptionEn: "Editorial board positions, scholarly op-eds, policy debates, and civilizational essays.",
    subtopics: ["Editorial", "Columns", "Policy Debate", "Book & Grantha Reviews"],
    order: 10
  },
  {
    id: "cat-fact-check",
    slug: "fact-check",
    nameNe: "११. तथ्य जाँच र व्याख्या (Fact Check & Explainers)",
    nameEn: "11. Fact Check & Explainers",
    descriptionNe: "भ्रामक सूचनाको खण्डन, प्राथमिक स्रोत प्रमाणीकरण र जटिल विषयको सरल व्याख्या।",
    descriptionEn: "Primary-source verification, debunking misinformation, and deep background explainers.",
    subtopics: ["Source Verification", "Policy Explainers", "Data Fact-Check"],
    order: 11
  },
  {
    id: "cat-special-reports",
    slug: "investigations",
    nameNe: "१२. विशेष रिपोर्ट र खोज पत्रकारिता",
    nameEn: "12. Special Reports & Investigations",
    descriptionNe: "गहन खोजमूलक रिपोर्टिङ, सार्वजनिक जवाफदेहिता र दस्तावेज आधारित अनुसन्धान।",
    descriptionEn: "Long-form investigative journalism, public accountability audits, and documentary dossiers.",
    subtopics: ["Accountability", "Heritage Dossiers", "Special Series"],
    order: 12
  }
];

