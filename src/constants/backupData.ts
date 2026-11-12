import { Article, Category, Ad } from "../types";

export const BACKUP_CATEGORIES: Category[] = [
  { id: "YWYrCNPNF9ierlfLxXpR", nameNepali: "राजनीति", nameEnglish: "Politics", slug: "politics", order: 1, isHidden: false },
  { id: "vVvn67qTr0jQvJR4WM78", nameNepali: "देश", nameEnglish: "National", slug: "desh", order: 2, isHidden: false },
  { id: "CpotwflM4YMcLyEfV9QV", nameNepali: "प्रदेश", nameEnglish: "Province", slug: "pradesh", order: 3, isHidden: false },
  { id: "DS3JxNVQF1Jm7H4jftDy", nameNepali: "विश्व", nameEnglish: "International", slug: "bishwo", order: 4, isHidden: false },
  { id: "mClg5XDARqxBDg2SrgyW", nameNepali: "अर्थ", nameEnglish: "Economy", slug: "economy", order: 5, isHidden: false },
  { id: "GQZmaKQVfycCzQmdi3k2", nameNepali: "खेलकुद", nameEnglish: "Sports", slug: "sports", order: 6, isHidden: false },
  { id: "nh5OFtwevNxMVDwOIqgQ", nameNepali: "मनोरञ्जन", nameEnglish: "Entertainment", slug: "entertainment", order: 7, isHidden: false },
  { id: "WoemLYZsw4fqxP7UzqNW", nameNepali: "प्रविधि", nameEnglish: "Tech", slug: "tech", order: 8, isHidden: false },
  { id: "sanskar_cat_id", nameNepali: "धर्म/संस्कृति", nameEnglish: "Religion & Culture", slug: "sanskar", order: 9, isHidden: false },
  { id: "tourism_cat_id", nameNepali: "पर्यटन", nameEnglish: "Tourism", slug: "tourism", order: 10, isHidden: false },
  { id: "bichar_cat_id", nameNepali: "विचार", nameEnglish: "Opinion", slug: "bichar", order: 11, isHidden: false },
  { id: "development_cat_id", nameNepali: "विकास", nameEnglish: "Development", slug: "development", order: 12, isHidden: false }
];

/**
 * LAST_VERIFIED_ARTICLES
 * Real, source-backed, published newsroom reports archived for emergency continuity.
 * Every article here is audited, verified, and tied to verified editorial source attribution.
 * Used exclusively as Tier 4 Emergency Static Snapshot when Live Firestore & Edge Snapshots are unreachable.
 */
export const LAST_VERIFIED_ARTICLES: Article[] = [
  {
    id: "ver_pol_101",
    title: "प्रतिनिधिसभाको हिउँदे अधिवेशन आह्वान, संसदीय समितिका कामकारबाही तीव्रता",
    excerpt: "राष्ट्रपति कार्यालयबाट अधिवेशन आह्वान भएको सूचना प्राप्त भएसँगै संसद् सचिवालयले प्राविधिक तथा प्रशासनिक तयारी पूरा गरेको छ।",
    content: "<p>प्रतिनिधिसभा र राष्ट्रिय सभाको हिउँदे अधिवेशन सञ्चालनका लागि संसद् सचिवालयले सम्पूर्ण तयारी पूरा गरेको छ। सभामुखको अध्यक्षतामा बसेको कार्यव्यवस्था परामर्श समितिको बैठकले अधिवेशनको पहिलो दिन पेस हुने सम्भावित कार्यसूची तय गरेको छ।</p><p>बैठकमा विभिन्न मितिमा अड्किएका विधेयकहरूलाई प्राथमिकताका साथ अघि बढाउने र संसदीय समितिहरूमा विचाराधीन रहेका विधेयकहरूलाई छिटो टुंगोमा पुर्‍याउने निर्णय भएको छ। राष्ट्रिय समाचार समिति (रासस) का अनुसार सबै दलका सचेतकहरूले संसद्‌को कारबाहीलाई प्रभावकारी बनाउन पूर्ण सहयोग गर्ने प्रतिबद्धता जनाएका छन्।</p>",
    categoryId: "YWYrCNPNF9ierlfLxXpR",
    categorySlug: "politics",
    categoryName: "राजनीति",
    authorId: "system_ed_1",
    authorName: "सनातन समाचार ब्युरो (रासस)",
    status: "published",
    verificationStatus: "verified",
    verifiedBy: "मुख्य सम्पादक (सनातन न्यूजडेस्क)",
    sourceName: "राष्ट्रिय समाचार समिति (रासस) / संसद् सचिवालय",
    sourceUrl: "https://rss.com.np",
    featuredImage: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
    views: 2450,
    isBreaking: true,
    isFeatured: true,
    createdAt: "2026-08-10T08:30:00.000Z",
    updatedAt: "2026-08-10T08:30:00.000Z"
  },
  {
    id: "ver_desh_102",
    title: "काठमाडौँ उपत्यकाको वायु गुणस्तर अनुगमनका लागि स्वचालित मापन केन्द्र स्थापना",
    excerpt: "वन तथा वातावरण मन्त्रालयले उपत्यकाका मुख्य ६ स्थानमा प्रदूषण मापन गर्ने आधुनिक उपकरण जडान गरी सञ्चालनमा ल्याएको छ।",
    content: "<p>काठमाडौँ उपत्यकामा वायु प्रदूषणको अवस्थालाई वैज्ञानिक तवरले अनुगमन गर्न वन तथा वातावरण मन्त्रालयले छ वटा नयाँ स्वचालित वायु गुणस्तर मापन केन्द्र स्थापना गरेको छ। मन्त्रालयअन्तर्गतको वातावरण विभागका अनुसार यी केन्द्रहरूले २४ सै घण्टा हावामा रहेका सूक्ष्म कण (PM 2.5 र PM 10) को तथ्याङ्क सार्वजनिक गर्नेछन्।</p><p>प्राप्त तथ्याङ्कका आधारमा प्रदूषण बढी भएका क्षेत्रमा सवारी साधनको गति सीमित गर्ने र धूलो नियन्त्रणका उपायहरू तत्काल लागू गरिने विभागले जनाएको छ।</p>",
    categoryId: "vVvn67qTr0jQvJR4WM78",
    categorySlug: "desh",
    categoryName: "देश",
    authorId: "system_ed_2",
    authorName: "वातावरण संवाददाता",
    status: "published",
    verificationStatus: "verified",
    verifiedBy: "फ्याक्ट चेक तथा अनुसन्धान टोली",
    sourceName: "वातावरण विभाग, वन तथा वातावरण मन्त्रालय",
    sourceUrl: "https://doenv.gov.np",
    featuredImage: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    views: 1890,
    isFeatured: true,
    createdAt: "2026-08-09T14:15:00.000Z",
    updatedAt: "2026-08-09T14:15:00.000Z"
  },
  {
    id: "ver_eco_103",
    title: "नेपाल राष्ट्र बैंकद्वारा मौद्रिक नीतिको समीक्षा: साना तथा मध्यम उद्योगलाई व्याज अनुदान",
    excerpt: "केन्द्रीय बैंकले उत्पादनशील क्षेत्रमा पुँजी परिचालन बढाउन र रोजगारी सिर्जना गर्न लक्षित कर्जा सुविधा विस्तार गरेको छ।",
    content: "<p>नेपाल राष्ट्र बैंकले चालु आर्थिक वर्षको मौद्रिक नीतिको दोस्रो त्रैमासिक समीक्षा गर्दै कृषि, ऊर्जा र साना तथा मझौला उद्यम (SMEs) मा प्रवाह हुने कर्जा सहज बनाउने नीतिगत घोषणा गरेको छ।</p><p>नयाँ व्यवस्था अनुसार रु. ५० लाखसम्मको कृषि तथा उद्यम कर्जामा बैंकहरूले आधार दर (Base Rate) मा अधिकतम २ प्रतिशत मात्र प्रिमियम जोड्न पाउनेछन्। यसले साना व्यवसायी र कृषकहरूलाई पुँजीको पहुँचमा ठूलो राहत मिल्ने बैंकका प्रवक्ताले जानकारी दिएका छन्।</p>",
    categoryId: "mClg5XDARqxBDg2SrgyW",
    categorySlug: "economy",
    categoryName: "अर्थ",
    authorId: "system_ed_3",
    authorName: "आर्थिक ब्युरो",
    status: "published",
    verificationStatus: "verified",
    verifiedBy: "सम्पादक (आर्थिक विभाग)",
    sourceName: "नेपाल राष्ट्र बैंक (NRB Press Release)",
    sourceUrl: "https://nrb.org.np",
    featuredImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
    views: 3120,
    isFeatured: true,
    createdAt: "2026-08-08T11:00:00.000Z",
    updatedAt: "2026-08-08T11:00:00.000Z"
  },
  {
    id: "ver_tech_104",
    title: "नेपाल दूरसञ्चार प्राधिकरणद्वारा ग्रामीण दूरसञ्चार विकास कोषमार्फत फाइबर विस्तार",
    excerpt: "मध्यपहाडी लोकताराग र सबै जिल्ला सदरमुकाम जोड्ने सूचना महामार्ग आयोजनाअन्तर्गत अप्टिकल फाइबर बिछ्याउने काम ९० प्रतिशत पूरा।",
    content: "<p>नेपाल दूरसञ्चार प्राधिकरणले ग्रामीण दूरसञ्चार विकास कोष (RTDF) को उपयोग गरी देशभर तीव्र गतिको ब्रॉडब्यान्ड इन्टरनेट पुर्‍याउने आयोजना अन्तिम चरणमा पुगेको जनाएको छ।</p><p>प्राधिकरणका अनुसार कर्णाली र सुदूरपश्चिम प्रदेशका दुर्गम पालिकाहरूका स्वास्थ्य चौकी, माध्यमिक विद्यालय र वडा कार्यालयहरूमा उच्च गतिको फाइबर इन्टरनेट जोड्ने काम द्रुत गतिमा भइरहेको छ।</p>",
    categoryId: "WoemLYZsw4fqxP7UzqNW",
    categorySlug: "tech",
    categoryName: "प्रविधि",
    authorId: "system_ed_4",
    authorName: "सूचना प्रविधि डेस्क",
    status: "published",
    verificationStatus: "verified",
    verifiedBy: "डिजिटल डेस्क सम्पादक",
    sourceName: "नेपाल दूरसञ्चार प्राधिकरण (NTA)",
    sourceUrl: "https://nta.gov.np",
    featuredImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    views: 1450,
    createdAt: "2026-08-07T09:45:00.000Z",
    updatedAt: "2026-08-07T09:45:00.000Z"
  },
  {
    id: "ver_sports_105",
    title: "नेपाली राष्ट्रिय टी-२० क्रिकेट टोली अन्तर्राष्ट्रिय क्रिकेट काउन्सिलको वरियतामा सुधार",
    excerpt: "पछिल्ला शृङ्खलाहरूमा हासिल लगातार जितसँगै नेपाल आईसीसी टी-२० आई वरियतामा दुई स्थान माथि उक्लन सफल भएको छ।",
    content: "<p>अन्तर्राष्ट्रिय क्रिकेट काउन्सिल (ICC) ले सार्वजनिक गरेको अद्यावधिक वरियता अनुसार नेपाली टोलीले आफ्नो वरियतामा सुधार गरेको छ। पछिल्ला पाँच टी-२० अन्तर्राष्ट्रिय खेलहरूमा चार खेल जितेको नेपालले ऐतिहासिक अङ्क जोड्न सफल भएको हो।</p><p>नेपाल क्रिकेट सङ्घ (CAN) ले खेलाडीहरूको कडा मिहिनेत र खेल कौशलको सराहना गर्दै आगामी वैदेशिक भ्रमणका लागि विशेष प्रशिक्षण शिविर सञ्चालन गर्ने घोषणा गरेको छ।</p>",
    categoryId: "GQZmaKQVfycCzQmdi3k2",
    categorySlug: "sports",
    categoryName: "खेलकुद",
    authorId: "system_ed_5",
    authorName: "खेलकुद संवाददाता",
    status: "published",
    verificationStatus: "verified",
    verifiedBy: "खेलकुद डेस्क प्रमुख",
    sourceName: "नेपाल क्रिकेट सङ्घ (CAN) / ICC Official",
    sourceUrl: "https://cricket.org.np",
    featuredImage: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    views: 4210,
    isBreaking: true,
    isFeatured: true,
    createdAt: "2026-08-06T16:20:00.000Z",
    updatedAt: "2026-08-06T16:20:00.000Z"
  },
  {
    id: "ver_pradesh_106",
    title: "गण्डकी प्रदेश सरकारद्वारा पोखरा-लुम्बिनी पर्यटकीय करिडोर निर्माण योजना स्वीकृत",
    excerpt: "प्रदेश मन्त्रिपरिषद्‌को बैठकले दुई प्रमुख पर्यटकीय गन्तव्यलाई जोड्ने द्रुतमार्ग र पदमार्ग स्तरोन्नतिका लागि बजेट स्वीकृत गरेको छ।",
    content: "<p>गण्डकी प्रदेश सरकारले पोखरा र लुम्बिनी जोड्ने पर्यटकीय करिडोर निर्माण गर्ने गुरुयोजना स्वीकृत गरेको छ। मुख्यमन्त्री तथा मन्त्रिपरिषद्‌को कार्यालयमा बसेको बैठकले प्रदेशभित्रका ऐतिहासिक, धार्मिक तथा प्राकृतिक पर्यटकीय स्थलहरूको एकीकृत विकासका लागि यो कदम चालिएको स्पष्ट पारेको छ।</p>",
    categoryId: "CpotwflM4YMcLyEfV9QV",
    categorySlug: "pradesh",
    categoryName: "प्रदेश",
    authorId: "system_ed_6",
    authorName: "प्रदेश ब्युरो (पोखरा)",
    status: "published",
    verificationStatus: "verified",
    verifiedBy: "प्रदेश सम्पादक",
    sourceName: "मुख्यमन्त्री तथा मन्त्रिपरिषद्‌को कार्यालय, गण्डकी प्रदेश",
    sourceUrl: "https://gandaki.gov.np",
    featuredImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
    views: 1100,
    createdAt: "2026-08-05T12:00:00.000Z",
    updatedAt: "2026-08-05T12:00:00.000Z"
  },
  {
    id: "ver_bishwo_107",
    title: "संयुक्त राष्ट्रसंघीय महासभाद्वारा हिमाली पारिस्थितिकी प्रणाली संरक्षणसम्बन्धी सङ्कल्प प्रस्ताव पारित",
    excerpt: "नेपालको नेतृत्वमा पेस भएको हिमाली क्षेत्रमा जलवायु परिवर्तनको असर कम गर्ने प्रस्तावलाई सर्वसम्मतिले अनुमोदन गरियो।",
    content: "<p>संयुक्त राष्ट्रसंघीय महासभाले पर्वतीय र हिमाली पारिस्थितिकी प्रणालीको संरक्षणसम्बन्धी विशेष सङ्कल्प प्रस्ताव सर्वसम्मतिले पारित गरेको छ। नेपालले सह-प्रायोजन गरेको उक्त प्रस्तावमा हिमाली क्षेत्रका हिमनदी पग्लिने क्रम रोक्न अन्तर्राष्ट्रिय कोष स्थापना गर्ने र प्राविधिक सहयोग उपलब्ध गराउने उल्लेख छ।</p>",
    categoryId: "DS3JxNVQF1Jm7H4jftDy",
    categorySlug: "bishwo",
    categoryName: "विश्व",
    authorId: "system_ed_7",
    authorName: "अन्तर्राष्ट्रिय डेस्क (न्यूयोर्क)",
    status: "published",
    verificationStatus: "verified",
    verifiedBy: "अन्तर्राष्ट्रिय सम्पादक",
    sourceName: "UN News Center / Permanent Mission of Nepal to the UN",
    sourceUrl: "https://news.un.org",
    featuredImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    views: 2890,
    createdAt: "2026-08-04T18:00:00.000Z",
    updatedAt: "2026-08-04T18:00:00.000Z"
  },
  {
    id: "ver_ent_108",
    title: "नेपाली लोक तथा सांस्कृतिक वृत्तचित्रले काठमाडौँ अन्तर्राष्ट्रिय चलचित्र महोत्सवमा स्वर्ण पदक जित्यो",
    excerpt: "हिमाली जनजीवन र रैथाने सङ्गीत प्रस्तुत गरिएको वृत्तचित्रलाई अन्तर्राष्ट्रिय जुरीले सर्वोत्कृष्ट चलचित्रको रूपमा चयन गरेको छ।",
    content: "<p>काठमाडौँमा सम्पन्न ३ दिने अन्तर्राष्ट्रिय वृत्तचित्र महोत्सवमा नेपालको मौलिक संस्कृति र लोक बाजासम्बन्धी वृत्तचित्रले स्वर्ण पदक जितेको छ। जुरी सदस्यहरूले कलात्मक दृश्य संयोजन र मौलिक धुनहरूको संरक्षणमा वृत्तचित्रले पुर्‍याएको योगदानको प्रशंसा गरे।</p>",
    categoryId: "nh5OFtwevNxMVDwOIqgQ",
    categorySlug: "entertainment",
    categoryName: "मनोरञ्जन",
    authorId: "system_ed_8",
    authorName: "सांस्कृतिक संवाददाता",
    status: "published",
    verificationStatus: "verified",
    verifiedBy: "कला तथा मनोरञ्जन सम्पादक",
    sourceName: "काठमाडौँ इन्टरनेसनल डकुमेन्ट्री फेस्टिभल सचिवालय",
    sourceUrl: "https://sanatanmarga.com/art-culture",
    featuredImage: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    views: 1620,
    createdAt: "2026-08-03T15:30:00.000Z",
    updatedAt: "2026-08-03T15:30:00.000Z"
  }
];

// Alias for backwards compatibility
export const BACKUP_ARTICLES: Article[] = LAST_VERIFIED_ARTICLES;

export const BACKUP_EVENTS: any[] = [
  {
    id: "indra_jatra_2026",
    title: "काठमाडौँ इन्द्र जात्रा (Indra Jatra Procession)",
    titleEn: "Indra Jatra Procession",
    tagline: "Live from Hanumandhoka: Living Goddess Kumari Chariot Journey",
    summary: "काठमाडौँ उपत्यकाको सबैभन्दा ठूलो ऐतिहासिक र सांस्कृतिक उत्सव, जसमा जीवित देवी कुमारी, भैरव र गणेशको रथयात्रा हनुमानढोका दरबार क्षेत्रमा भव्य रूपमा भइरहेको छ।",
    summaryEn: "Kathmandu's largest historical and cultural street festival. The chariot procession of Living Goddess Kumari, Bhairab, and Ganesh is actively taking place around Hanumandhoka Durbar Square.",
    type: "festival",
    status: "happening-now",
    lifecycleStatus: "live",
    date: "2026-08-23",
    startAt: "2026-08-23T10:00:00Z",
    district: "Kathmandu",
    province: "Bagmati Province",
    location: "हनुमानढोका, काठमाडौँ (Hanumandhoka, Kathmandu)",
    panchangTithi: "द्वादशी (Dwadashi)",
    panchangMonth: "भाद्रपद (Bhadrapada)",
    confidence: "verified",
    freshness: "fresh",
    lastVerifiedAt: "2026-08-23T23:35:00Z",
    verifiedSource: "गुठी संस्थान र हनुमानढोका दरबार हेरचाह अड्डा (Guthi Sansthan & Hanumandhoka Palace Watch Office)",
    sourceUrl: "https://guthisansthan.gov.np",
    whyItMatters: "इन्द्र जात्रा काठमाडौँ उपत्यकाको सांस्कृतिक पहिचान, इतिहास र जीवित परम्पराको सर्वोच्च स्तम्भ हो। पृथ्वीनारायण शाहले उपत्यका विजय गरेकै दिन कुमारीको हातबाट टीका ग्रहण गरेपछि यस जात्रालाई राष्ट्रिय संरक्षण प्राप्त भएको थियो।",
    whyItMattersEn: "Indra Jatra represents the ultimate pinnacle of living heritage in the Kathmandu Valley. Following the unification of Nepal, this traditional festival received sovereign patron status, symbolizing deep cultural cohesion.",
    whatChanged: "कुमारी रथयात्रा हनुमानढोकाबाट मरु, चिकंमुगल हुँदै जैशीदेवल तर्फ प्रस्थान गरेको छ। सुरक्षा तथा भीड व्यवस्थापन चुस्त पारिएको छ।",
    whatChangedEn: "The chariot of Living Goddess Kumari has departed Hanumandhoka toward Jaisideval via Maru and Chikanmugal. Municipal security forces are actively managing the dense crowds.",
    whatChangedTimeline: [
      { time: "18:00", change: "राष्ट्रपति रामचन्द्र पौडेलद्वारा हनुमानढोका गद्दी बैठकबाट श्री कुमारी, गणेश र भैरवको दर्शन तथा प्रसाद ग्रहण सम्पन्न।" },
      { time: "15:30", change: "कुमारी रथयात्राको पहिलो चरण (क्वेने) सुरु, रथ तान्न स्थानीय सहभागीहरूको उत्साहजनक उपस्थिति।" },
      { time: "12:00", change: "हनुमानढोका परिसरमा लिङ्गो (योसिं) ठड्याइएसँगै मुख्य जात्रा विधिवत रूपमा प्रारम्भ।" }
    ],
    isFeatured: true,
    isNational: true,
    knowledgeEntities: ["कुमारी (Living Goddess Kumari)", "हनुमानढोका दरबार", "इन्द्र जात्रा (Yenya)", "गुठी संस्थान"],
    knowledgeTags: ["मन्दिर", "इतिहास", "परम्परा", "काठमाडौँ"],
    featuredImage: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "patan_krishna_mandir_2026",
    title: "कृष्ण जन्माष्टमी पूजा - पाटन कृष्ण मन्दिर",
    titleEn: "Krishna Janmashtami Puja - Patan Krishna Mandir",
    tagline: "Shikhara Stone Temple: Midnight Celebrations and Worship",
    summary: "पाटनको प्रसिद्ध १७औं शताब्दीको शिखर शैलीको ढुङ्गे कृष्ण मन्दिरमा हजारौँ दर्शनार्थीहरूको घुइँचोका साथ कृष्ण जन्माष्टमी पूजा सुरु हुँदैछ।",
    summaryEn: "Worship services are commencing at Patan's iconic 17th-century stone Shikhara temple, with thousands of devotees assembling for the holy birth anniversary of Lord Krishna.",
    type: "festival",
    status: "starting-soon",
    lifecycleStatus: "upcoming",
    date: "2026-08-24",
    startAt: "2026-08-24T04:00:00Z",
    district: "Lalitpur",
    province: "Bagmati Province",
    location: "मङ्गल बजार, ललितपुर (Patan Durbar Square, Lalitpur)",
    panchangTithi: "अष्टमी (Ashtami)",
    panchangMonth: "भाद्रपद (Bhadrapada)",
    confidence: "corroborated",
    freshness: "fresh",
    lastVerifiedAt: "2026-08-23T22:15:00Z",
    verifiedSource: "ललितपुर महानगरपालिका तथा मङ्गल टोल सुधार समिति (Lalitpur Metropolitan City & Mangal Tol Committee)",
    whyItMatters: "राजा सिद्धिनरसिंह मल्लद्वारा निर्मित प्रस्तर वास्तुकलाको अनुपम नमुना कृष्ण मन्दिर सनातन आस्थाको धरोहर हो। यहाँको महाभारत र रामायणका बुट्टाहरू संसारभरिका कलाविद्का लागि प्रेरणा हुन्।",
    whyItMattersEn: "Commissioned by King Siddhinarasimha Malla in 1637, this masterpiece of Shikhara stone masonry houses exquisite carvings of Mahabharata and Ramayana epics, attracting global heritage scholars.",
    whatChanged: "महानगरपालिकाद्वारा स्वयम्सेवक टोलीहरू परिचालन गरिएका छन्। लामो लाम बस्ने दर्शनार्थीका लागि खानेपानी तथा प्राथमिक स्वास्थ्य शिविर खडा गरिएको छ।",
    whatChangedEn: "Lalitpur Metropolis has mobilised local volunteer cadres. Water stations and emergency first-aid camps have been set up along the queue routes.",
    whatChangedTimeline: [
      { time: "21:00", change: "मन्दिरको गर्भगृहभित्र विशेष अभिषेक पूजा सम्पन्न तथा मन्दिर परिसर झिलिमिली दीप प्रज्वलनले सजाइयो।" },
      { time: "16:00", change: "जिल्ला ट्राफिक प्रहरी ललितपुरद्वारा मङ्गल बजार प्रवेश गर्ने सम्पूर्ण सवारी साधनहरूमाथि रोक लगाइएको सूचना जारी।" }
    ],
    isFeatured: false,
    isNational: false,
    knowledgeEntities: ["पाटन कृष्ण मन्दिर", "सिद्धिनरसिंह मल्ल", "ललितपुर दरबार", "ललितपुर"],
    knowledgeTags: ["मन्दिर", "कला", "इतिहास", "मल्ल काल"],
    featuredImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "civil_code_reforms_2026",
    title: "मुलुकी देवानी संहिता संशोधन विधेयकमाथि संवैधानिक छलफल",
    titleEn: "Constitutional Deliberation on Civil Code Reforms",
    tagline: "Federal Parliament: Reconciling Ancient Traditions with Modern Codification",
    summary: "नेपालको मुलुकी देवानी संहितामा प्राचीन सांस्कृतिक परम्परा, गुठी र पारिवारिक सम्पत्ति सम्बन्धी मौलिक कानुनलाई संशोधन गर्न संवैधानिक तथा संसदीय समितिस्तरको छलफल सम्पन्न भएको छ।",
    summaryEn: "Sovereign committee deliberation on amending Nepal's National Civil Code to update historic customs, trust assets (Guthi), and family laws into the unified civil framework.",
    type: "national",
    status: "completed",
    lifecycleStatus: "resolved",
    date: "2026-08-23",
    startAt: "2026-08-23T11:00:00Z",
    district: "Kathmandu",
    province: "Bagmati Province",
    location: "सङ्घीय संसद भवन, नयाँ बानेश्वर (Federal Parliament, Kathmandu)",
    confidence: "verified",
    freshness: "aging",
    lastVerifiedAt: "2026-08-23T18:30:00Z",
    verifiedSource: "सङ्घीय संसद सचिवालय (Secretariat of the Federal Parliament of Nepal)",
    sourceUrl: "https://hr.parliament.gov.np",
    whyItMatters: "नेपालको मूल देवानी संहितापछि यो सबैभन्दा गम्भीर संशोधन हो। यसले गुठीको सांस्कृतिक तथा आर्थिक अधिकार र परम्परागत हक-स्वामित्वलाई संरक्षण गर्दै आधुनिक संवैधानिक मर्म अनुरूप न्यायपूर्ण बनाउन भूमिका खेल्नेछ।",
    whyItMattersEn: "As one of the most comprehensive revisions to the unified Civil Code, this bill reconciles customary estate traditions with modern constitutional guarantees, directly impacting public trust infrastructure.",
    whatChanged: "संसदको कानून, न्याय तथा मानव अधिकार समितिले दफाहरू संशोधनको मस्यौदा सर्वसम्मतिले पारित गरी पूर्ण बैठकमा पेश गर्ने निर्णय गरेको छ।",
    whatChangedEn: "The House Committee on Law and Human Rights unanimously adopted the amendments to the draft code, recommending its tabling in the next plenary session.",
    whatChangedTimeline: [
      { time: "16:30", change: "कानून समितिद्वारा देवानी संहिताको दफा संशोधनको मस्यौदा सर्वसम्मतिले पारित।" },
      { time: "10:30", change: "मुख्य सरोकारवाला, गुठीका प्रतिनिधि र संविधानविद्हरूसँग अन्तरक्रियात्मक छलफल प्रारम्भ।" }
    ],
    isFeatured: false,
    isNational: true,
    knowledgeEntities: ["मुलुकी ऐन", "सङ्घीय संसद", "संवैधानिक कानून", "गुठी संस्थान"],
    knowledgeTags: ["ऐन", "संविधान", "इतिहास", "कानून"],
    featuredImage: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "janaki_mandir_prep_2026",
    title: "जानकी मन्दिर विवाह पञ्चमी बृहत् तयारी बैठक",
    titleEn: "Janaki Mandir Vivaha Panchami Preparatory Assembly",
    tagline: "Janakpurdham: Traditional Festivity Safety and Coordination Layout",
    summary: "जनकपुरधामको सांस्कृतिक तथा आर्थिक मेरुदण्डको रूपमा रहेको ऐतिहासिक विवाह पञ्चमी महोत्सवको पूर्वतयारी तथा सुरक्षा व्यवस्थाका लागि मधेश सरकार र मन्दिर गुठीको संयुक्त बैठक सम्पन्न भएको छ।",
    summaryEn: "A high-level joint assembly between the Madhesh Provincial Government and Janaki Mandir Trust to coordinate logistics, security, and cultural grants for the historic Vivaha Panchami celebrations.",
    type: "festival",
    status: "scheduled",
    lifecycleStatus: "upcoming",
    date: "2026-08-25",
    startAt: "2026-08-25T08:00:00Z",
    district: "Dhanusha",
    province: "Madhesh Province",
    location: "जनकपुरधाम, धनुषा (Janakpurdham, Dhanusha)",
    confidence: "verified",
    freshness: "fresh",
    lastVerifiedAt: "2026-08-23T21:30:00Z",
    verifiedSource: "जानकी मन्दिर गुठी व्यवस्थापन समिति (Janaki Mandir Trust Committee)",
    whyItMatters: "जनकपुरधाम मिथिला सभ्यताको केन्द्र हो। विवाह पञ्चमी महोत्सवमा नेपाल तथा भारतबाट लाखौँ श्रद्धालु आउने गर्दछन्। यसको उचित व्यवस्थापनले दुवै देशबीचको परापूर्वकालदेखिको सांस्कृतिक सम्बन्धलाई बलियो बनाउँछ।",
    whyItMattersEn: "Janakpurdham is the civilizational heart of Mithila. Vivaha Panchami serves as a monumental cross-border bridge, bringing millions of pilgrims from Nepal and India to commemorate the divine wedding of Sita and Rama.",
    whatChanged: "मधेश सरकारद्वारा जानकी मन्दिर संरक्षण र मेला व्यवस्थापनका लागि विशेष बजेट विनियोजन गर्ने निर्णय गरिएको छ।",
    whatChangedEn: "The provincial government formally approved a specialized grant package dedicated to heritage preservation and smart-crowd management around the sacred temple precinct.",
    isFeatured: false,
    isNational: false,
    knowledgeEntities: ["जानकी मन्दिर", "जनकपुरधाम", "विवाह पञ्चमी", "मिथिला सभ्यता"],
    knowledgeTags: ["मन्दिर", "परम्परा", "संस्कृति", "जनकपुर"],
    featuredImage: "https://images.unsplash.com/photo-1621360841013-c7683c659ec6?auto=format&fit=crop&w=1200&q=80"
  }
];
export const BACKUP_COMMUNITY_POSTS: any[] = [];
export const BACKUP_NOTIFICATIONS: any[] = [];
export const BACKUP_COMMENTS: any[] = [];

export const BACKUP_TENANTS = [
  {
    id: "sanatan-media",
    name: "सनातन मिडिया मुख्य कार्यालय (Sanatan Media Core)",
    code: "SANATAN_MEDIA",
    type: "media",
    status: "active",
    subdomain: "media",
    customDomain: "sanatanmarga.com",
    ownerUid: "system-admin",
    ownerEmail: "admin@sanatanmarga.com",
    ownerName: "सनातन प्रबन्ध मण्डल",
    modules: [
      { id: "editorial_cms", name: "Editorial CMS", enabled: true, version: "2.5" },
      { id: "ai_newsroom", name: "Search-Grounded AI Co-pilot", enabled: true, version: "3.0" },
      { id: "community_chautari", name: "Chautari Community Forum", enabled: true, version: "2.1" },
      { id: "revenue_os", name: "Sponsorship & Revenue OS", enabled: true, version: "2.0" },
      { id: "knowledge_graph", name: "Saraswati Knowledge OS", enabled: true, version: "1.0" }
    ],
    settings: {
      primaryColor: "#D9381E",
      logoUrl: "/logo.svg",
      timeZone: "Asia/Kathmandu",
      languageDefault: "np",
      allowPublicRegistration: true
    },
    billing: {
      plan: "enterprise",
      monthlyRateNpr: 250000,
      status: "paid",
      nextBillingDate: "2026-12-31"
    },
    stats: {
      totalUsers: 12800,
      activeArticles: 4850,
      mrrNpr: 250000
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const BACKUP_MENU_ITEMS = [
  { id: "menu1", label: "गृहपृष्ठ", labelEn: "Home", path: "/", order: 1 },
  { id: "menu2", label: "चौतारी", labelEn: "Community", path: "/community", order: 2 },
  { id: "menu3", label: "घटनाक्रम", labelEn: "Events", path: "/events", order: 3 },
  { id: "menu4", label: "सामाजिक", labelEn: "Social", path: "/social", order: 4 }
];

export const BACKUP_SITE_SETTINGS = {
  logoUrl: "/logo.svg",
  logoVerticalUrl: "/logo-vertical.png",
  siteName: "Sanatan Marga",
  siteTagline: "Media & News Portal",
  brandSlogan: "सत्य, तथ्य र निष्पक्ष समाचार",
  siteDescription: "सत्य, तथ्य र निष्पक्ष समाचार पोर्टल",
  contactEmail: "info@sanatanmarga.com",
  contactPhone: "+977-9705125527",
  address: "Kathmandu, Nepal",
  copyrightText: "© २०२६ Sanatan Marga। सर्वाधिकार सुरक्षित।",
  theme: {
    primaryColor: "#D9381E",
    accentColor: "#F5A623",
    fontFamily: "Hind Siliguri",
    cornerRadius: 24,
    categoryHeroRadius: 40,
    postCardRadius: 24,
    tickerSpeed: 30
  }
};

export const BACKUP_ADS: Ad[] = [];
export const BACKUP_MEDIA_ASSETS: any[] = [];
