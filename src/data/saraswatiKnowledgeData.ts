import { Article } from "../types";

export interface KnowledgeNodeCategory {
  id: string;
  nameNepali: string;
  nameEnglish: string;
  iconName: string;
  description: string;
  count: number;
}

export const KNOWLEDGE_CATEGORIES_GRID: KnowledgeNodeCategory[] = [
  { id: "scriptures", nameNepali: "शास्त्र र ग्रन्थ", nameEnglish: "Scriptures & Vedas", iconName: "BookOpen", description: "चार वेद, १८ पुराण, उपनिषद् र गीता", count: 124 },
  { id: "history", nameNepali: "इतिहास र कालखण्ड", nameEnglish: "History & Eras", iconName: "Landmark", description: "किरात, लिच्छवि, मल्ल र शाह काल", count: 86 },
  { id: "temples", nameNepali: "शक्तिपीठ र मन्दिर", nameEnglish: "Temples & Sacred Sites", iconName: "Sparkles", description: "पशुपतिनाथ, मुक्तिनाथ, जानकी मन्दिर", count: 210 },
  { id: "figures", nameNepali: "ऐतिहासिक व्यक्तित्व", nameEnglish: "Historical Figures", iconName: "Crown", description: "ऋषिमुनि, जनक, अशुंवर्मा, पृथ्बीनारायण", count: 95 },
  { id: "constitutions", nameNepali: "ऐतिहासिक कानुन र विधान", nameEnglish: "Constitutions & Laws", iconName: "Scroll", description: "मुलुकी ऐन, धर्मशास्त्र, नीतिशास्त्र", count: 42 },
  { id: "geography", nameNepali: "सांस्कृतिक भूगोल", nameEnglish: "Cultural Geography", iconName: "Compass", description: "पवित्र नदी, हिमालय, धाम र तीर्थ", count: 130 },
  { id: "festivals", nameNepali: "वैदिक तथा स्थानीय पर्व", nameEnglish: "Festivals & Rituals", iconName: "Sparkles", description: "शिवरात्रि, दूर्गापूजा, इन्द्रजात्रा, छठ", count: 115 },
  { id: "science", nameNepali: "ऋषि चिन्तन तथा विज्ञान", nameEnglish: "Vedic Science & Philosophy", iconName: "Layers", description: "आयुर्वेद, खगोल, वास्तु, गणित र योग", count: 78 }
];

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationLabelNepali: string;
  relationLabelEnglish: string;
}

export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  source?: string;
}

export interface HistoricalArchiveDoc {
  title: string;
  year: string;
  type: string;
  summary: string;
  downloadUrl?: string;
}

export interface FullKnowledgeNode {
  id: string; // slug e.g. "pashupatinath"
  nameNepali: string;
  nameEnglish: string;
  sanskritName?: string;
  category: string; // e.g. "temples", "scriptures", "figures", etc.
  categoryNameNepali: string;
  summary: string;
  fullOverview: string;
  heroImage: string;
  district?: string;
  province?: string;
  historicalPeriod?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  timeline: TimelineEvent[];
  historicalDocuments: HistoricalArchiveDoc[];
  relatedArticlesCount: number;
  relatedCourses: Array<{ title: string; level: string; duration: string }>;
  relatedVideos: Array<{ title: string; duration: string; url: string }>;
  relatedFestivals: Array<{ name: string; date: string }>;
  relatedStoreItems: Array<{ name: string; price: string; image: string }>;
  graphConnections: GraphEdge[];
}

export const FEATURED_KNOWLEDGE_NODE: FullKnowledgeNode = {
  id: "pashupatinath",
  nameNepali: "पशुपतिनाथ मन्दिर",
  nameEnglish: "Pashupatinath Temple",
  sanskritName: "श्री पशुपतिनाथ महादेव",
  category: "temples",
  categoryNameNepali: "शक्तिपीठ र मन्दिर",
  district: "काठमाडौँ",
  province: "बागमती प्रदेश",
  historicalPeriod: "ईशापूर्व ५ औँ शताब्दी / लिच्छवि काल",
  heroImage: "https://images.unsplash.com/photo-1609137144869-37367123d57f?q=80&w=1200&auto=format&fit=crop",
  isFeatured: true,
  isTrending: true,
  summary: "विश्वका समस्त सनातन धर्मावलम्बीहरूको परम आस्थाको केन्द्र, १२ ज्योतिर्लिङ्ग मध्येको शिरोभाग मानिने बागमती नदी किनारस्थित पवित्र पशुपतिनाथ ज्योतिर्लिङ्ग।",
  fullOverview: `पशुपतिनाथ मन्दिर नेपालको काठमाडौँमा बागमती नदीको किनारमा अवस्थित विश्वप्रसिद्ध हिन्दू मन्दिर हो। यो मन्दिर भगवान् शिवको पशुपति (समस्त प्राणीका स्वामी) रूपलाई समर्पित छ।

वैदिक साहित्य तथा स्कन्द पुराणको हिमवत्खण्डमा पशुपति क्षेत्रलाई अत्यन्त पवित्र पाशुपत क्षेत्रको रूपमा वर्णन गरिएको छ। राजा अशुंवर्मा, जयदेव द्वितीय तथा मल्ल राजाहरूले यस मन्दिरको जीर्णोद्धार र गुठी व्यवस्थापनमा महत्त्वपूर्ण योगदान दिएका थिए।`,
  timeline: [
    { year: "ई.पू. ३००", title: "पाशुपत क्षेत्र स्थापना", description: "किरातकालीन तथा प्रागैतिहासिक शिवलिङ्ग उपासनाको सुरुवात।" },
    { year: "ई.सं. ५३५ (वि.सं. ५९२)", title: "अंशुवर्माको शिलालेख", description: "राजा अंशुवर्माद्वारा 'पशुपतिपादअनुगृहीत' उपाधि धारण र मन्दिर गुठी स्थापना।" },
    { year: "ई.सं. १४०९ (वि.सं. १४६६)", title: "मल्लकालीन पुनर्निर्माण", description: "राजा ज्योतिर्मल्लद्वारा द्वि-तले प्यागोडा शैली मन्दिरको भव्य निर्माण।" },
    { year: "ई.सं. १९७९", title: "युनेस्को विश्व सम्पदा सूचीकरण", description: "युनेस्कोद्वारा पशुपतिनाथ क्षेत्रलाई विश्व सांस्कृतिक सम्पदा घोषणा।" }
  ],
  historicalDocuments: [
    { title: "राजा अंशुवर्माको चाँगु-पशुपति शिलालेख", year: "६०५ ई.सं.", type: "शिलालेख", summary: "पशुपतिनाथ क्षेत्रको संरक्षण र राजकोषबाट दिइने दान सम्बन्धी प्रमाण।" },
    { title: "हिमवत्खण्ड पशुपति महात्म्य", year: "प्राचीन संस्कृत ग्रन्थ", type: "पाण्डुलिपि", summary: "पशुपति ज्योतिर्लिङ्गको उत्पत्ति र पाशुपत योग दर्शनको व्याख्या।" }
  ],
  relatedArticlesCount: 42,
  relatedCourses: [
    { title: "पाशुपत दर्शन र शिवसंहिता", level: "उच्च", duration: "१२ घण्टा" },
    { title: "नेपालका लिच्छविकालीन मन्दिर वास्तुकला", level: "मध्यम", duration: "८ घण्टा" }
  ],
  relatedVideos: [
    { title: "पशुपतिनाथ: सहस्राब्दीको इतिहास र रहस्य", duration: "२४ मिनेट", url: "https://www.youtube.com/watch?v=1La4QzGeaaQ" },
    { title: "सन्ध्या आरती र बागमती पावन यात्रा", duration: "१५ मिनेट", url: "https://www.youtube.com/watch?v=1La4QzGeaaQ" }
  ],
  relatedFestivals: [
    { name: "महाशिवरात्रि महामहोत्सव", date: "फागुन कृष्ण चतुर्दशी" },
    { name: "तीज (हरितालिका)", date: "भाद्र शुक्ल तृतीया" },
    { name: "बालाचतुर्दशी (सतबीज छर्ने पर्व)", date: "मंसिर कृष्ण चतुर्दशी" }
  ],
  relatedStoreItems: [
    { name: "प्रमाणित नेपाली रुद्राक्ष (५ मुखी)", price: "रु १,५००", image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=400&auto=format&fit=crop" },
    { name: "पशुपति सन्ध्या आरती भष्म एवं प्रसाद", price: "रु ५००", image: "https://images.unsplash.com/photo-1609137144869-37367123d57f?q=80&w=400&auto=format&fit=crop" }
  ],
  graphConnections: [
    { id: "e1", sourceId: "pashupatinath", targetId: "shiva", relationLabelNepali: "इष्टदेव / स्वरूप", relationLabelEnglish: "Deity Manifestation" },
    { id: "e2", sourceId: "pashupatinath", targetId: "licchavi-era", relationLabelNepali: "संरक्षक राजवंश", relationLabelEnglish: "Patron Dynasty" },
    { id: "e3", sourceId: "pashupatinath", targetId: "kathmandu", relationLabelNepali: "भौगोलिक अवस्थिति", relationLabelEnglish: "Geographic Location" },
    { id: "e4", sourceId: "pashupatinath", targetId: "maha-shivaratri", relationLabelNepali: "मुख्य उत्सव", relationLabelEnglish: "Primary Festival" },
    { id: "e5", sourceId: "pashupatinath", targetId: "rudraksha", relationLabelNepali: "पवित्र वस्तु", relationLabelEnglish: "Sacred Artifact" },
    { id: "e6", sourceId: "pashupatinath", targetId: "unesco-heritage", relationLabelNepali: "विश्व सम्पदा मान्यता", relationLabelEnglish: "UNESCO Heritage" }
  ]
};

export const TRENDING_KNOWLEDGE_NODES: FullKnowledgeNode[] = [
  FEATURED_KNOWLEDGE_NODE,
  {
    id: "gita",
    nameNepali: "श्रीमद्भगवद्गीता",
    nameEnglish: "Bhagavad Gita",
    sanskritName: "श्रीमद्भगवद्गीता",
    category: "scriptures",
    categoryNameNepali: "शास्त्र र ग्रन्थ",
    historicalPeriod: "द्वापर युग / महाभारतकालीन",
    heroImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop",
    isTrending: true,
    summary: "कुरुक्षेत्रको युद्धभूमिमा भगवान् श्रीकृष्णद्वारा अर्जुनलाई दिइएको ७०० श्लोकको शाश्वत उपदेश, कर्मयोग र ज्ञानको महासागर।",
    fullOverview: "श्रीमद्भगवद्गीता महाभारतको भीष्मपर्वको २५ देखि ४२ सम्मका १८ अध्यायहरूको संगालो हो। यसले जीवनको प्रत्येक द्वन्द्वमा विवेकपूर्ण निर्णय लिन मार्गदर्शन गर्दछ।",
    timeline: [
      { year: "द्वापर युग", title: "कुरुक्षेत्र उपदेश", description: "भगवान् श्रीकृष्णद्वारा अर्जुनलाई १८ अध्याय गीता उपदेश।" }
    ],
    historicalDocuments: [
      { title: "श्रीमद्भगवद्गीता शाङ्करभाष्य", year: "८ औँ शताब्दी", type: "भाष्य", summary: "आदि शङ्कराचार्यद्वारा रचित अद्वैत वेदान्त भाष्य।" }
    ],
    relatedArticlesCount: 156,
    relatedCourses: [{ title: "भगवद्गीता १८ अध्याय अध्ययन", level: "प्रारम्भिक", duration: "२० घण्टा" }],
    relatedVideos: [{ title: "गीता कर्मयोग व्यावहारिक व्याख्या", duration: "४५ मिनेट", url: "https://www.youtube.com/watch?v=1La4QzGeaaQ" }],
    relatedFestivals: [{ name: "गीता जयन्ती", date: "मार्गशीर्ष शुक्ल एकादशी" }],
    relatedStoreItems: [{ name: "श्रीमद्भगवद्गीता नेपाली अनुवाद (सचित्र)", price: "रु १,२५०", image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=400&auto=format&fit=crop" }],
    graphConnections: [
      { id: "eg1", sourceId: "gita", targetId: "krishna", relationLabelNepali: "उपदेशक", relationLabelEnglish: "Teacher" },
      { id: "eg2", sourceId: "gita", targetId: "mahabharata", relationLabelNepali: "मूल ग्रन्थ भाग", relationLabelEnglish: "Parent Epic" },
      { id: "eg3", sourceId: "gita", targetId: "karma-yoga", relationLabelNepali: "मुख्य दर्शन", relationLabelEnglish: "Core Philosophy" }
    ]
  },
  {
    id: "prithvi-narayan-shah",
    nameNepali: "राष्ट्रनिर्माता श्री ५ बडामहाराजाधिराज पृथ्वीनारायण शाह",
    nameEnglish: "King Prithvi Narayan Shah",
    category: "figures",
    categoryNameNepali: "ऐतिहासिक व्यक्तित्व",
    district: "गोरखा",
    historicalPeriod: "वि.सं. १७७९ - १८३१ (विशाल नेपाल एकीकरण)",
    heroImage: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=1200&auto=format&fit=crop",
    isTrending: true,
    summary: "साना साना बाइसे-चौबिसे राज्यहरूमा विभाजित नेपाललाई भौगोलिक तथा सांस्कृतिक रूपमा एकताबद्ध गर्ने आधुनिक विशाल नेपालका राष्ट्रनिर्माता।",
    fullOverview: "वि.सं. १७७९ पौष २७ गते गोरखामा जन्मिनुभएका पृथ्वीनारायण शाहले वि.सं. १८०१ मा नुवाकोट विजय गर्दै नेपाल एकीकरण अभियान सुरु गर्नुभयो। उहाँको 'दिव्योपदेश' नेपालको परराष्ट्र, अर्थ र सुशासनको ऐतिहासिक कूटनीतिक मार्गदर्शक दस्ताबेज हो।",
    timeline: [
      { year: "वि.सं. १७७९", title: "शुभ जन्म", description: "गोरखा दरबारमा जन्म।" },
      { year: "वि.सं. १८०१", title: "नुवाकोट विजय", description: "एकीकरण अभियानको पहिलो सफलता।" },
      { year: "वि.सं. १८२५", title: "काठमाडौँ उपत्यका विजय", description: "काठमाडौँलाई विशाल नेपालको राजधानी घोषणा।" }
    ],
    historicalDocuments: [
      { title: "श्री ५ बडामहाराजाधिराजको दिव्य उपदेश", year: "वि.सं. १८३१", type: "राजकीय उपदेश", summary: "नेपाल दुई ढुङ्गाबीचको तरुल हो, घुस लिने र दिने दुवै देशका शत्रु हुन्।" }
    ],
    relatedArticlesCount: 88,
    relatedCourses: [{ title: "विशाल नेपाल एकीकरणको इतिहास", level: "मध्यम", duration: "१० घण्टा" }],
    relatedVideos: [{ title: "दिव्योपदेश र आधुनिक नेपालको कूटनीति", duration: "३० मिनेट", url: "https://www.youtube.com/watch?v=1La4QzGeaaQ" }],
    relatedFestivals: [{ name: "राष्ट्रिय एकता दिवस (पृथ्वी जयन्ती)", date: "पौष २७ गते" }],
    relatedStoreItems: [{ name: "दिव्योपदेश संग्रह (हार्डकभर)", price: "रु ८५०", image: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=400&auto=format&fit=crop" }],
    graphConnections: [
      { id: "ep1", sourceId: "prithvi-narayan-shah", targetId: "gorkha", relationLabelNepali: "उद्गम स्थल", relationLabelEnglish: "Origin" },
      { id: "ep2", sourceId: "prithvi-narayan-shah", targetId: "divyopadesh", relationLabelNepali: "कालजयी उपदेश", relationLabelEnglish: "Stateman's Doctrine" }
    ]
  },
  {
    id: "janaki-mandir",
    nameNepali: "जानकी मन्दिर",
    nameEnglish: "Janaki Temple",
    category: "temples",
    categoryNameNepali: "शक्तिपीठ र मन्दिर",
    district: "धनुषा",
    province: "मधेस प्रदेश",
    historicalPeriod: "वि.सं. १९६७ (टीकमगढकी महारानी वृषभानु)",
    heroImage: "https://images.unsplash.com/photo-1590001155093-a3c68ab0ac67?q=80&w=1200&auto=format&fit=crop",
    isTrending: true,
    summary: "माता सीताको सम्झनामा निर्मित नौलखा मन्दिर, जहाँ मिथिला कला र हिन्दू-मुगल वास्तुकलाको अनुपम नमुना देख्न सकिन्छ।",
    fullOverview: "जनकपुरधामस्थित जानकी मन्दिर राजा जनक र माता सीताको प्राचीन इतिहाससँग गाँसिएको छ।",
    timeline: [
      { year: "वि.सं. १९६७", title: "नौलखा मन्दिर निर्माण", description: "९ लाख चाँदीका रुपैयाँ लागतमा भव्य निर्माण।" }
    ],
    historicalDocuments: [],
    relatedArticlesCount: 64,
    relatedCourses: [],
    relatedVideos: [],
    relatedFestivals: [{ name: "विवाह पञ्चमी", date: "मंसिर शुक्ल पञ्चमी" }],
    relatedStoreItems: [],
    graphConnections: [
      { id: "ej1", sourceId: "janaki-mandir", targetId: "sita", relationLabelNepali: "मुख्य देवी", relationLabelEnglish: "Deity" },
      { id: "ej2", sourceId: "janaki-mandir", targetId: "janakpur", relationLabelNepali: "अवस्थिति", relationLabelEnglish: "Location" }
    ]
  },
  {
    id: "rigveda",
    nameNepali: "ऋग्वेद संहिता",
    nameEnglish: "Rigveda Samhita",
    sanskritName: "ऋग्वेदः",
    category: "scriptures",
    categoryNameNepali: "शास्त्र र ग्रन्थ",
    historicalPeriod: "मानव सभ्यताको प्राचीनतम वैदिक ग्रन्थ",
    heroImage: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1200&auto=format&fit=crop",
    isTrending: true,
    summary: "मानव जातिको सबभन्दा पुरानो लिखित ग्रन्थ, १० मण्डल, १०२८ सूक्त र १०,५५२ ऋचाहरूको ज्ञान भण्डार।",
    fullOverview: "ऋग्वेद वैदिक धर्म र दर्शनको आधारशिला हो। यसमा गायत्री मन्त्र, पुरुष सूक्त, नासदीय सूक्त र देवी सूक्तजस्ता दार्शनिक ऋचाहरू छन्।",
    timeline: [],
    historicalDocuments: [],
    relatedArticlesCount: 92,
    relatedCourses: [],
    relatedVideos: [],
    relatedFestivals: [],
    relatedStoreItems: [],
    graphConnections: [
      { id: "er1", sourceId: "rigveda", targetId: "gayatri-mantra", relationLabelNepali: "प्रमुख मन्त्र", relationLabelEnglish: "Key Mantra" }
    ]
  },
  {
    id: "muluki-ain",
    nameNepali: "मुलुकी ऐन १९१०",
    nameEnglish: "Muluki Ain 1910",
    category: "constitutions",
    categoryNameNepali: "ऐतिहासिक कानुन र विधान",
    historicalPeriod: "वि.सं. १९१० (श्री ३ जङ्गबहादुर राणा)",
    heroImage: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=1200&auto=format&fit=crop",
    isTrending: true,
    summary: "नेपालको पहिलो लिखित संहिताबद्ध ऐन, जसले मुलुकको न्यायिक, प्रशासनिक र कानुनी प्रणालीलाई व्यवस्थापन गर्‍यो।",
    fullOverview: "जङ्गबहादुर राणाले बेलायत भ्रमणपछि फ्रान्सेली नेपोलियन कोडबाट प्रभावित भई वि.सं. १९१० मा मुलुकी ऐन जारी गराउनुभएको थियो।",
    timeline: [
      { year: "वि.सं. १९१० पौष २७", title: "मुलुकी ऐन लालमोहर", description: "नेपालमा पहिलो पटक लिखित कानुनी संहिता लागू।" }
    ],
    historicalDocuments: [],
    relatedArticlesCount: 34,
    relatedCourses: [],
    relatedVideos: [],
    relatedFestivals: [],
    relatedStoreItems: [],
    graphConnections: [
      { id: "em1", sourceId: "muluki-ain", targetId: "jang-bahadur", relationLabelNepali: "प्रणेता", relationLabelEnglish: "Enactor" }
    ]
  }
];

export const KNOWLEDGE_NODES: FullKnowledgeNode[] = [
  FEATURED_KNOWLEDGE_NODE,
  ...TRENDING_KNOWLEDGE_NODES.filter(n => n.id !== FEATURED_KNOWLEDGE_NODE.id),
  {
    id: "muktinath",
    nameNepali: "मुक्तिनाथ क्षेत्र (Muktinath)",
    nameEnglish: "Muktinath Temple & Sacred Zone",
    sanskritName: "श्री मुक्तिनाथ धाम",
    category: "temples",
    categoryNameNepali: "शक्तिपीठ र मन्दिर",
    district: "मुस्ताङ",
    province: "गण्डकी प्रदेश",
    historicalPeriod: "प्राचीन वैदिक / बौद्ध काल",
    heroImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop",
    isTrending: false,
    summary: "१०८ धारा र ज्वालामाई ज्योति अवस्थित हिमाली महातीर्थ, जहाँ वैष्णव र बौद्ध धर्मावलम्बीहरू समान भक्तिभावले मुक्ति प्राप्तिका लागि पुग्छन्।",
    fullOverview: "मुक्तिनाथ धाम (३,८००m) मुस्ताङ जिल्लामा अन्नपूर्ण हिमशृङ्खलाको काखमा अवस्थित छ। वैष्णव परम्परा अनुसार यो १०८ दिव्य देशमहरू मध्ये मुक्ति प्रदायक पवित्रतम धाम हो।",
    timeline: [
      { year: "प्राचीन काल", title: "शालिग्राम उत्पत्ति", description: "कालीगण्डकी नदीमा चक्राङ्कित शालिग्राम शिला प्रकटीकरण।" },
      { year: "वि.सं. १८६३", title: "महारानी सुवर्णप्रभाद्वारा मन्दिर निर्माण", description: "तामाको छाना र १०८ गौमुखी धारा स्थापना।" }
    ],
    historicalDocuments: [],
    relatedArticlesCount: 52,
    relatedCourses: [],
    relatedVideos: [],
    relatedFestivals: [{ name: "यार्तुङ पर्व", date: "भदौ महिना" }],
    relatedStoreItems: [{ name: "प्राकृतिक कालीगण्डकी शालिग्राम", price: "रु २,१००", image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=400&auto=format&fit=crop" }],
    graphConnections: [
      { id: "emk1", sourceId: "muktinath", targetId: "mustang", relationLabelNepali: "अवस्थिति", relationLabelEnglish: "District Location" },
      { id: "emk2", sourceId: "muktinath", targetId: "saligram", relationLabelNepali: "सम्बद्ध शिला", relationLabelEnglish: "Sacred Stone" },
      { id: "emk3", sourceId: "muktinath", targetId: "vishnu", relationLabelNepali: "इष्टदेव", relationLabelEnglish: "Deity" }
    ]
  },
  {
    id: "swayambhunath",
    nameNepali: "स्वयम्भूनाथ महाचैत्य",
    nameEnglish: "Swayambhunath Stupa",
    category: "heritage",
    categoryNameNepali: "विश्व सम्पदा र चैत्य",
    district: "काठमाडौँ",
    province: "बागमती प्रदेश",
    historicalPeriod: "ईशापूर्व ५ औँ शताब्दी / किरात-लिच्छवि काल",
    heroImage: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=1200&auto=format&fit=crop",
    isTrending: false,
    summary: "काठमाडौँ उपत्यकाको प्रादुर्भावसँग गाँसिएको स्वयम्भू ज्योतिरूप महाचैत्य, युनेस्को सांस्कृतिक विश्व सम्पदा।",
    fullOverview: "नागदहको रूपमा रहेको काठमाडौँ उपत्यकामा महामञ्जुश्रीले चोभारको डाँडो काटेर जल निकास गरेपछि स्वयम्भू ज्योति स्तूपको रूपमा प्रकट भएको धार्मिक मान्यता छ।",
    timeline: [
      { year: "वि.सं. पूर्व ५००", title: "स्वयम्भू ज्योति उत्पत्ति", description: "काठमाडौँ उपत्यकाको उत्पत्ति कथा।" }
    ],
    historicalDocuments: [],
    relatedArticlesCount: 45,
    relatedCourses: [],
    relatedVideos: [],
    relatedFestivals: [{ name: "बुद्ध जयन्ती", date: "वैशाख पूर्णमा" }],
    relatedStoreItems: [],
    graphConnections: [
      { id: "esw1", sourceId: "swayambhunath", targetId: "kathmandu", relationLabelNepali: "भौगोलिक अवस्थिति", relationLabelEnglish: "Location" },
      { id: "esw2", sourceId: "swayambhunath", targetId: "manjushree", relationLabelNepali: "उपत्यका जल निकासकर्ता", relationLabelEnglish: "Valley Origin" }
    ]
  },
  {
    id: "hanuman-dhoka",
    nameNepali: "हनुमानढोका राजदरबार",
    nameEnglish: "Hanuman Dhoka Palace",
    category: "history",
    categoryNameNepali: "इतिहास र कालखण्ड",
    district: "काठमाडौँ",
    province: "बागमती प्रदेश",
    historicalPeriod: "मल्ल तथा शाह राजवंश काल",
    heroImage: "https://images.unsplash.com/photo-1609137144869-37367123d57f?q=80&w=1200&auto=format&fit=crop",
    isTrending: false,
    summary: "मल्ल राजाहरू र शाह राजाहरूको ऐतिहासिक दरबार परिसर, वसन्तपुर क्षेत्रको कलात्मक धरोहर।",
    fullOverview: "प्रताप मल्लद्वारा हनुमानको मूर्ति स्थापना गरिएपछि हनुमानढोका नामाकरण भएको यो दरबार क्षेत्र काठमाडौँको ऐतिहासिक तथा राजनीतिक केन्द्र हो।",
    timeline: [],
    historicalDocuments: [],
    relatedArticlesCount: 38,
    relatedCourses: [],
    relatedVideos: [],
    relatedFestivals: [{ name: "इन्द्रजात्रा", date: "भाद्र शुक्ल चतुर्दशी" }],
    relatedStoreItems: [],
    graphConnections: [
      { id: "ehd1", sourceId: "hanuman-dhoka", targetId: "kathmandu", relationLabelNepali: "स्थान", relationLabelEnglish: "District Location" },
      { id: "ehd2", sourceId: "hanuman-dhoka", targetId: "malla-dynasty", relationLabelNepali: "निर्माता राजवंश", relationLabelEnglish: "Dynasty" }
    ]
  },
  {
    id: "indra-jatra",
    nameNepali: "इन्द्रजात्रा (येँण्याः पर्व)",
    nameEnglish: "Indra Jatra Festival",
    category: "festivals",
    categoryNameNepali: "वैदिक तथा स्थानीय पर्व",
    district: "काठमाडौँ",
    province: "बागमती प्रदेश",
    historicalPeriod: "वि.सं. १२ औँ शताब्दी (गुणकामदेव मल्ल)",
    heroImage: "https://images.unsplash.com/photo-1590001155093-a3c68ab0ac67?q=80&w=1200&auto=format&fit=crop",
    isTrending: false,
    summary: "देवराज इन्द्र र जीवित देवी कुमारीको रथयात्रा गरिने काठमाडौँ उपत्यकाको विशालतम सांस्कृतिक पर्व।",
    fullOverview: "इन्द्रध्वजोत्थान, जीवित देवी श्री कुमारी, भैरव र गणेशको रथयात्रा, र मझाः लाखे नृत्य यस जात्राका मुख्य आकर्षण हुन्।",
    timeline: [],
    historicalDocuments: [],
    relatedArticlesCount: 40,
    relatedCourses: [],
    relatedVideos: [],
    relatedFestivals: [],
    relatedStoreItems: [],
    graphConnections: [
      { id: "eij1", sourceId: "indra-jatra", targetId: "kathmandu", relationLabelNepali: "उत्सव स्थल", relationLabelEnglish: "Location" },
      { id: "eij2", sourceId: "indra-jatra", targetId: "kumari", relationLabelNepali: "जीवित देवी रथयात्रा", relationLabelEnglish: "Living Goddess" }
    ]
  },
  {
    id: "licchavi-era",
    nameNepali: "लिच्छवि काल (नेपालको स्वर्ण युग)",
    nameEnglish: "Licchavi Dynasty & Golden Era",
    category: "history",
    categoryNameNepali: "इतिहास र कालखण्ड",
    historicalPeriod: "ई.सं. ४०० - ७५०",
    heroImage: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=1200&auto=format&fit=crop",
    isTrending: false,
    summary: "मानदेव, अंशुवर्मा र शिवदेव जस्ता दूरदर्शी राजाहरूको शासनकाल, जसलाई नेपालको संस्कृत कला, वास्तु र कूटनीतिको स्वर्ण युग मानिन्छ।",
    fullOverview: "लिच्छवि कालमा चांगुनारायणको शिलालेख, पशुपतिनाथ क्षेत्रको विकास र भृकुटीको तिब्बत विवाह मार्फत चीन-तिब्बत व्यापार र सांस्कृतिक सम्बन्ध विस्तार भएको थियो।",
    timeline: [],
    historicalDocuments: [],
    relatedArticlesCount: 60,
    relatedCourses: [],
    relatedVideos: [],
    relatedFestivals: [],
    relatedStoreItems: [],
    graphConnections: [
      { id: "eli1", sourceId: "licchavi-era", targetId: "pashupatinath", relationLabelNepali: "संरक्षित मन्दिर", relationLabelEnglish: "Patronage" },
      { id: "eli2", sourceId: "licchavi-era", targetId: "anshuverma", relationLabelNepali: "प्रमुख महाराजा", relationLabelEnglish: "Great King" }
    ]
  }
];

export function getKnowledgeNodes(): FullKnowledgeNode[] {
  return KNOWLEDGE_NODES;
}

export function getFeaturedKnowledgeNode(): FullKnowledgeNode {
  return KNOWLEDGE_NODES.find(n => n.isFeatured) || KNOWLEDGE_NODES[0];
}

export function getTrendingKnowledgeNodes(): FullKnowledgeNode[] {
  return KNOWLEDGE_NODES.filter(n => n.isTrending);
}

export function getKnowledgeNodesByDistrict(districtNameOrSlug: string): FullKnowledgeNode[] {
  if (!districtNameOrSlug) return [];
  const q = districtNameOrSlug.toLowerCase().trim();
  return KNOWLEDGE_NODES.filter(
    n => (n.district && n.district.toLowerCase().includes(q)) ||
         n.id.toLowerCase().includes(q)
  );
}

export function getKnowledgeNode(nodeIdOrQuery?: string): FullKnowledgeNode {
  if (!nodeIdOrQuery) return getFeaturedKnowledgeNode();
  const q = nodeIdOrQuery.toLowerCase().trim();

  const found = KNOWLEDGE_NODES.find(
    n => n.id.toLowerCase() === q ||
         n.nameNepali.toLowerCase() === q ||
         n.nameEnglish.toLowerCase().includes(q)
  );

  if (found) return found;

  const title = nodeIdOrQuery.charAt(0).toUpperCase() + nodeIdOrQuery.slice(1);
  return {
    id: q,
    nameNepali: title,
    nameEnglish: title,
    category: "history",
    categoryNameNepali: "ज्ञानकोष सम्बद्ध",
    heroImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop",
    summary: `${title} सम्बन्धी प्रमाणिक ज्ञान, इतिहास र वैदिक सन्दर्भ सूची।`,
    fullOverview: `${title} नेपालको इतिहास र संस्कृतिसँग जोडिएको महत्त्वपूर्ण धरोहर/शास्त्र हो।`,
    timeline: [],
    historicalDocuments: [],
    relatedArticlesCount: 10,
    relatedCourses: [],
    relatedVideos: [],
    relatedFestivals: [],
    relatedStoreItems: [],
    graphConnections: [
      { id: "fallback-1", sourceId: q, targetId: "sanatan-culture", relationLabelNepali: "सांस्कृतिक सम्बन्ध", relationLabelEnglish: "Cultural Link" }
    ]
  };
}

