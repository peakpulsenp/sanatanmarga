// Sanatan Marga Authoritative Historical & Civilizational Content Seeds

export interface AuthoritativeArchive {
  id: string;
  title: string;
  titleNepali: string;
  era: "panchayat" | "rana" | "shah" | "ancient" | "constitutional" | "modern";
  yearBS: string;
  yearAD: string;
  category: string;
  summary: string;
  summaryNepali: string;
  sourceDocumentUrl?: string;
  originalScriptUrl?: string;
  ocrText?: string;
  source?: string;
  sourceVerified?: boolean;
  relatedTimelineEventId?: string;
  relatedKnowledgeNodeId?: string;
  connectedEntities: string[];
}

export const EXPANDED_ARCHIVE_RECORDS: AuthoritativeArchive[] = [
  {
    id: "arch_sugauli_treaty_1816",
    title: "1816 Sugauli Treaty between the Kingdom of Nepal and the British East India Company",
    titleNepali: "सन् १८१६ को ऐतिहासिक सुगौली सन्धि (मूल दस्तावेज)",
    era: "shah",
    yearBS: "१८७२",
    yearAD: "1816",
    category: "राष्ट्रिय सन्धि र कूटनीति",
    summary: "Historic treaty establishing Nepal's modern territorial boundaries signed between Parish Bradshaw and Raj Guru Gajaraj Mishra.",
    summaryNepali: "नेपाल-अङ्ग्रेज युद्धपछि नेपालको आधुनिक अन्तर्राष्ट्रिय सीमा निर्धारण गर्ने ऐतिहासिक सम्झौता।",
    connectedEntities: ["शाह वंश", "नेपाल-अङ्ग्रेज युद्ध", "सुगौली सन्धि"]
  },
  {
    id: "arch_muluki_ain_1910",
    title: "Jang Bahadur Rana Muluki Ain 1910 BS (Original Legal Code)",
    titleNepali: "श्री ३ जङ्गबहादुर राणाको मुलुकी ऐन १९१० (नेपालको प्रथम लिखित कानुन)",
    era: "rana",
    yearBS: "१९१०",
    yearAD: "1854",
    category: "कानुनी इतिहास",
    summary: "First comprehensive codified civil and criminal legal system introduced under King Surendra Bikram Shah and PM Jang Bahadur Rana.",
    summaryNepali: "बेलायत यात्रापछि जङ्गबहादुर राणाद्वारा जारी गरिएको नेपालको पहिलो लिखित मुलुकी ऐन, जसले गुठी, धर्म र न्याय व्यवस्था बाँध्यो।",
    connectedEntities: ["राणा शासन", "मुलुकी ऐन", "जङ्गबहादुर राणा"]
  },
  {
    id: "arch_constitution_2004",
    title: "Government of Nepal Act 2004 BS (First Constitutional Attempt)",
    titleNepali: "नेपाल सरकारको वैधानिक कानुन २००४ (पद्म शम्शेरको सुधार)",
    era: "rana",
    yearBS: "२००४",
    yearAD: "1948",
    category: "संवैधानिक इतिहास",
    summary: "First written constitution of Nepal announced by PM Padma Shumsher attempting bicameral advisory governance.",
    summaryNepali: "श्री ३ पद्म शम्शेरद्वारा घोषणा गरिएको नेपालको प्रथम लिखित संवैधानिक दस्तावेज।",
    connectedEntities: ["राणा शासन", "पद्म शम्शेर", "संवैधानिक इतिहास"]
  },
  {
    id: "arch_constitution_2007",
    title: "Interim Government of Nepal Act 2007 BS (Post-Democracy)",
    titleNepali: "नेपालको अन्तरिम शासन विधान २००७ (प्रजातन्त्र घोषणापछिको संविधान)",
    era: "shah",
    yearBS: "२००७",
    yearAD: "1951",
    category: "संवैधानिक इतिहास",
    summary: "Fundamental charter promulgated by King Tribhuvan after the overthrow of 104-year Rana rule establishing constitutional monarchy.",
    summaryNepali: "१०४ वर्षे जहानियाँ राणा शासनको अन्त्यपछि राजा त्रिभुवनद्वारा घोषित लोकतान्त्रिक अन्तरिम विधान।",
    connectedEntities: ["शाह वंश", "राजा त्रिभुवन", "प्रजातन्त्र २००७"]
  },
  {
    id: "arch_1950_treaty",
    title: "1950 Nepal-India Treaty of Peace and Friendship",
    titleNepali: "सन् १९५० को नेपाल-भारत शान्ति तथा मैत्री सन्धि",
    era: "shah",
    yearBS: "२००७",
    yearAD: "1950",
    category: "राष्ट्रिय सन्धि र कूटनीति",
    summary: "Original bilateral treaty signed between Nepal PM Mohan Shumsher and Indian Ambassador C.P.N. Singh.",
    summaryNepali: "नेपालका श्री ३ महाराज मोहन शम्शेर र भारतीय राजदूत चन्देश्वरप्रसाद नारायण सिंहद्वारा हस्ताक्षरित कूटनीतिक सम्झौता।",
    connectedEntities: ["राणा शासन", "शाह वंश", "नेपाल भारत सम्बन्ध"]
  },
  {
    id: "arch_constitution_2015",
    title: "Constitution of the Kingdom of Nepal 2015 BS (Parliamentary System)",
    titleNepali: "नेपाल अधिराज्यको संविधान २०१५ (प्रथम संसदीय निर्वाचन)",
    era: "shah",
    yearBS: "२०१५",
    yearAD: "1959",
    category: "संवैधानिक इतिहास",
    summary: "Promulgated by King Mahendra paving the way for Nepal's first general election and BP Koirala's government.",
    summaryNepali: "राजा महेन्द्रद्वारा जारी संविधान जसअन्तर्गत नेपालमा प्रथम ऐतिहासिक आम निर्वाचन सम्पन्न भएको थियो।",
    connectedEntities: ["शाह वंश", "राजा महेन्द्र", "संसदीय व्यवस्था"]
  },
  {
    id: "arch_2019_constitution",
    title: "Constitution of Nepal 2019 BS (Panchayat System)",
    titleNepali: "नेपालको संविधान २०१९ (दलविहीन पञ्चायती व्यवस्था)",
    era: "panchayat",
    yearBS: "२०१९",
    yearAD: "1962",
    category: "संवैधानिक इतिहास",
    summary: "Charter framing the four-tier Panchayat system, national symbols, and Hindu state identity under King Mahendra.",
    summaryNepali: "राजा महेन्द्रद्वारा घोषित दलविहीन पञ्चायती व्यवस्था लागू गर्ने संवैधानिक दस्तावेज।",
    connectedEntities: ["पञ्चायत काल", "राजा महेन्द्र", "संवैधानिक इतिहास"]
  },
  {
    id: "arch_changunarayan_pillar",
    title: "Changu Narayan Licchavi King Manadeva Inscription 521 BS (464 AD)",
    titleNepali: "चाँगुनारायणको मानदेवको लिच्छविकालीन अभिलेख (संस्कृत शिलालेख ५२१ वि.सं.)",
    era: "ancient",
    yearBS: "५२१",
    yearAD: "464",
    category: "लिच्छवि पाषाण अभिलेख",
    summary: "Oldest verified stone inscription in Nepal detailing King Manadeva's military campaigns and mother Rajyavati.",
    summaryNepali: "नेपालको प्रमाणित सबैभन्दा पुरानो शिलापत्र, जसमा राजा मानदेवको विजय अभियान र संस्कृत काव्य कुँदिएको छ।",
    connectedEntities: ["लिच्छवि काल", "राजा मानदेव", "चाँगुनारायण"]
  },
  {
    id: "arch_valmiki_manuscript",
    title: "National Archives 14th Century Sanskrit Palm-Leaf Manuscript (Malla Era)",
    titleNepali: "नेपाल राष्ट्रिय अभिलेखालयमा सुरक्षित १४ औँ शताब्दीको ताडपत्र पाण्डुलिपि",
    era: "ancient",
    yearBS: "१४१०",
    yearAD: "1353",
    category: "संस्कृत पाण्डुलिपि र वेद",
    summary: "Rare Sanskrit palm-leaf manuscript preserved at the National Archives in Kathmandu.",
    summaryNepali: "काठमाडौँको भद्रकालीस्थित राष्ट्रिय अभिलेखालयमा सुरक्षित नेवारी लिपी र संस्कृत भाषाको दुर्लभ ताडपत्र ग्रन्थ।",
    connectedEntities: ["पशुपतिनाथ", "मल्ल काल", "संस्कृत पाण्डुलिपि"]
  },
  {
    id: "arch_constitution_2047",
    title: "Constitution of the Kingdom of Nepal 2047 BS (Constitutional Monarchy)",
    titleNepali: "नेपाल अधिराज्यको संविधान २०४७ (संवैधानिक राजतन्त्र र बहुदलीय प्रजातन्त्र)",
    era: "constitutional",
    yearBS: "२०४७",
    yearAD: "1990",
    category: "संवैधानिक इतिहास",
    summary: "Promulgated by King Birendra following the 1990 People's Movement restoring multi-party democracy.",
    summaryNepali: "२०४६ को जनआन्दोलनपछि राजा वीरेन्द्रद्वारा जारी गरिएको बहुदलीय प्रजातान्त्रिक संविधान।",
    connectedEntities: ["शाह वंश", "राजा वीरेन्द्र", "प्रजातन्त्र पुनर्बहाली"]
  },
  {
    id: "arch_cpa_2063",
    title: "Comprehensive Peace Accord 2063 BS (Historic Peace Agreement)",
    titleNepali: "विस्तृत शान्ति सम्झौता २०६३ (१० वर्षे सशस्त्र द्वन्द्वको औपचारिक अन्त्य)",
    era: "constitutional",
    yearBS: "२०६३",
    yearAD: "2006",
    category: "राष्ट्रिय सन्धि र कूटनीति",
    summary: "Historic peace agreement signed between the Government of Nepal (PM Girija Prasad Koirala) and CPN (Maoist) Chairman Prachanda ending a decade-long conflict.",
    summaryNepali: "वि.सं. २०६३ मङ्सिर ५ गते नेपाल सरकार र नेकपा (माओवादी) बीच सम्पन्न ऐतिहासिक शान्ति सम्झौता जसले १० वर्षे सशस्त्र द्वन्द्वलाई शान्तिपूर्ण अवतरण गरायो।",
    connectedEntities: ["विस्तृत शान्ति सम्झौता", "संविधान सभा", "शान्ति प्रक्रिया"]
  },
  {
    id: "arch_republic_proclamation_2065",
    title: "Proclamation of Federal Democratic Republic by 1st Constituent Assembly 2065 BS",
    titleNepali: "पहिलो संविधान सभाद्वारा सङ्घीय लोकतान्त्रिक गणतन्त्र घोषणा २०६५",
    era: "constitutional",
    yearBS: "२०६५",
    yearAD: "2008",
    category: "संवैधानिक इतिहास",
    summary: "Resolution passed by the historic first meeting of the Constituent Assembly abolishing the 240-year-old Shah monarchy.",
    summaryNepali: "वि.सं. २०६५ जेठ १५ गते संविधान सभाको ऐतिहासिक पहिलो बैठकद्वारा २४० वर्षे राजतन्त्र अन्त्य गरी नेपाललाई सङ्घीय लोकतान्त्रिक गणतन्त्र घोषणा गरेको प्रस्ताव।",
    connectedEntities: ["गणतन्त्र घोषणा", "संविधान सभा", "सङ्घीयता"]
  },
  {
    id: "arch_constitution_2072",
    title: "Constitution of Nepal 2072 BS (Supreme Law of the Federal Democratic Republic)",
    titleNepali: "नेपालको संविधान २०७२ (सङ्घीय लोकतान्त्रिक गणतन्त्रको मूल कानुन)",
    era: "constitutional",
    yearBS: "२०७२",
    yearAD: "2015",
    category: "संवैधानिक इतिहास",
    summary: "Promulgated on 20 September 2015 by the Constituent Assembly establishing a federal, secular, three-tier democratic republic with 35 parts and 308 articles.",
    summaryNepali: "वि.सं. २०७२ असोज ३ गते संविधान सभाबाट पारित ३५ भाग, ३०८ धारा र ९ अनुसूचीसहितको नेपालको वर्तमान सङ्घीय लोकतान्त्रिक संविधान।",
    connectedEntities: ["नेपालको संविधान २०७२", "संविधान सभा", "सङ्घीयता"]
  }
];

export interface AuthoritativeTimelineEvent {
  id: string;
  yearBS: string;
  yearAD: string;
  titleNepali: string;
  titleEnglish: string;
  category: "festival" | "history" | "scripture" | "treaty" | "monument";
  summaryNepali: string;
  summaryEnglish: string;
  location: string;
  relatedArticleId?: string;
  relatedKnowledgeNodeId?: string;
  relatedCourseId?: string;
  relatedProductId?: string;
}

export const EXPANDED_TIMELINE_EVENTS: AuthoritativeTimelineEvent[] = [
  {
    id: "evt_pashupati_est",
    yearBS: "प्राचीन काल",
    yearAD: "5th Century AD",
    titleNepali: "श्री पशुपतिनाथ मन्दिर स्थापना तथा लिच्छवि काल",
    titleEnglish: "Pashupatinath Temple & Licchavi Era Foundation",
    category: "monument",
    summaryNepali: "राजा सुपुष्पद्वारा पशुपतिनाथ क्षेत्रमा प्रथम देवल निर्माण र लिच्छवि सम्वत्‌मा पूजा परम्परा स्थापित।",
    summaryEnglish: "First temple construction at Pashupatinath by Licchavi King Supushpa and ritual traditions.",
    location: "काठमाडौँ",
    relatedKnowledgeNodeId: "pashupatinath",
    relatedArticleId: "art_pashupati_heritage"
  },
  {
    id: "evt_manadeva_changunarayan",
    yearBS: "५२१",
    yearAD: "464 AD",
    titleNepali: "राजा मानदेवद्वारा चाँगुनारायण गरुडध्वज अभिलेख स्थापना",
    titleEnglish: "King Manadeva Erects Changu Narayan Inscription",
    category: "history",
    summaryNepali: "नेपालको पहिलो ऐतिहासिक प्रमाणित शिलापत्र, जसले लिच्छवि राज्यको विस्तार र वैदिक संस्कृत परम्परा झल्काउँछ।",
    summaryEnglish: "Nepal's earliest verified stone inscription recording Licchavi sovereignty and classical Sanskrit culture.",
    location: "भक्तपुर (चाँगु)",
    relatedKnowledgeNodeId: "changunarayan"
  },
  {
    id: "evt_janakpur_ramjanaki",
    yearBS: "त्रेता युग / प्राचीन",
    yearAD: "Ancient Period",
    titleNepali: "राजा जनक र सीता-राम विवाह परम्परा (जनकपुरधाम)",
    titleEnglish: "King Janak & Sita-Ram Divine Heritage (Janakpurdham)",
    category: "scripture",
    summaryNepali: "मिथिला राजधानी जनकपुरमा विवाह पञ्चमी पर्व र सीता-राम प्राचीन सांस्कृतिक सामीप्य।",
    summaryEnglish: "Vivaha Panchami heritage and ancient Mithila kingdom traditions in Janakpurdham.",
    location: "धनुषा (जनकपुर)",
    relatedKnowledgeNodeId: "janaki-mandir"
  },
  {
    id: "evt_prithvi_narayan_unification",
    yearBS: "१८२५",
    yearAD: "1768 AD",
    titleNepali: "श्री ५ बडामहाराजाधिराज पृथ्वीनारायण शाहद्वारा काठमाडौँ उपत्यका विजय र नेपाल एकीकरण",
    titleEnglish: "Prithvi Narayan Shah Unification of Nepal & Kathmandu Valley Entry",
    category: "history",
    summaryNepali: "इन्द्रजात्राको दिन काठमाडौँ प्रवेश गरी विशाल नेपाल अधिराज्यको एकीकरण तथा दिव्य उपदेशको जग।",
    summaryEnglish: "Unification of the Kingdom of Nepal during Indra Jatra establishing Divya Upadesh foundational doctrine.",
    location: "काठमाडौँ",
    relatedKnowledgeNodeId: "prithvi-narayan-shah"
  },
  {
    id: "evt_sugauli_treaty_1816",
    yearBS: "१८७२",
    yearAD: "1816 AD",
    titleNepali: "ऐतिहासिक सुगौली सन्धि र नेपालको आधुनिक सीमा निर्धारण",
    titleEnglish: "1816 Sugauli Treaty and Modern Border Delineation",
    category: "treaty",
    summaryNepali: "नेपाल-अङ्ग्रेज युद्धपछि नेपाल र इस्ट इन्डिया कम्पनीबीचको ऐतिहासिक सम्झौता।",
    summaryEnglish: "Historic treaty establishing Nepal's modern territorial boundaries with British India.",
    location: "मकवानपुर / सुगौली"
  },
  {
    id: "evt_muluki_ain_1910",
    yearBS: "१९१०",
    yearAD: "1853 AD",
    titleNepali: "श्री ५ सुरेन्द्र र जङ्गबहादुर राणाद्वारा मुलुकी ऐन जारी",
    titleEnglish: "Promulgation of Muluki Ain 1853 (Rana Era Legal Code)",
    category: "treaty",
    summaryNepali: "नेपालको प्रथम लिखित कानुनी संहिता, जसले धार्मिक परम्परा, गुठी प्रथा र सामाजिक नियमहरूलाई परिभाषित गर्‍यो।",
    summaryEnglish: "Nepal's first comprehensive codified legal system defining Guthi system and civic rights.",
    location: "काठमाडौँ"
  },
  {
    id: "evt_tribhuvan_democracy_2007",
    yearBS: "२००७",
    yearAD: "1951 AD",
    titleNepali: "राजा त्रिभुवनद्वारा प्रजातन्त्रको ऐतिहासिक घोषणा",
    titleEnglish: "King Tribhuvan Historical Proclamation of Democracy",
    category: "history",
    summaryNepali: "फागुन ७ गते १०४ वर्षे राणा शासन समाप्त भई प्रजातन्त्र र संवैधानिक शासनको प्रारम्भ।",
    summaryEnglish: "Historic Royal Proclamation ending 104-year Rana oligarchy and establishing democratic rule.",
    location: "काठमाडौँ (हनुमानढोका)",
    relatedKnowledgeNodeId: "tribhuvan-shah"
  },
  {
    id: "evt_mahashivaratri_festival",
    yearBS: "वार्षिक पर्व",
    yearAD: "Annual Festival",
    titleNepali: "महाशिवरात्रि राष्ट्रिय महापर्व (पशुपतिनाथ)",
    titleEnglish: "Maha Shivaratri Grand Festival (Pashupatinath)",
    category: "festival",
    summaryNepali: "फाल्गुन कृष्ण चतुर्दशीमा लाखौँ साधु-सन्त र भक्तजन भेला हुने नेपालको सबैभन्दा ठूलो शैव महोत्सव।",
    summaryEnglish: "Nepal's grandest Shaiva festival attracting millions of pilgrims to Pashupatinath.",
    location: "काठमाडौँ",
    relatedKnowledgeNodeId: "pashupatinath"
  },
  {
    id: "evt_dashain_festival",
    yearBS: "वार्षिक पर्व",
    yearAD: "Annual Festival",
    titleNepali: "वडा दशैँ (श्री दुर्गा पूजा र विजयादशमी)",
    titleEnglish: "Wada Dashain (Durga Puja & Vijaya Dashami)",
    category: "festival",
    summaryNepali: "आश्विन शुक्ल प्रतिपदादेखि पूर्णिमासम्म मनाइने नेपालको सबैभन्दा ठूलो राष्ट्रिय तथा सांस्कृतिक पर्व।",
    summaryEnglish: "Nepal's grandest civilizational festival celebrating victory of Dharma over Adharma.",
    location: "नेपालभरि",
    relatedProductId: "digital-sanatan-panchang-pdf"
  },
  {
    id: "evt_1960_royal_coup",
    yearBS: "२०१७",
    yearAD: "1960 AD",
    titleNepali: "राजा महेन्द्रद्वारा प्रथम जननिर्वाचित सरकार विघटन र प्रत्यक्ष शासन (पुस १ गते)",
    titleEnglish: "King Mahendra Dissolution of Elected Government & Royal Takeover",
    category: "history",
    summaryNepali: "प्रथम जननिर्वाचित प्रधानमन्त्री बीपी कोइरालाको सरकार विघटन गरी दलविहीन पञ्चायती व्यवस्थाको जग बसालिएको ऐतिहासिक घटना।",
    summaryEnglish: "Dissolution of BP Koirala's democratically elected cabinet and inception of partyless Panchayat system.",
    location: "काठमाडौँ",
    relatedKnowledgeNodeId: "bp-koirala"
  },
  {
    id: "evt_1980_referendum",
    yearBS: "२०३७",
    yearAD: "1980 AD",
    titleNepali: "ऐतिहासिक राष्ट्रिय जनमत सङ्ग्रह (सुधारिएको पञ्चायत बनाम बहुदल)",
    titleEnglish: "National Referendum on Panchayat vs Multi-party Democracy",
    category: "history",
    summaryNepali: "२०३६ सालको विद्यार्थी आन्दोलनपछि राजा वीरेन्द्रद्वारा घोषित राष्ट्रिय जनमत सङ्ग्रह सम्पन्न।",
    summaryEnglish: "Nationwide referendum held following student protests offering choice between reformed Panchayat and multi-party democracy.",
    location: "नेपालभरि",
    relatedKnowledgeNodeId: "king-birendra"
  },
  {
    id: "evt_1990_jana_andolan",
    yearBS: "२०४६",
    yearAD: "1990 AD",
    titleNepali: "ऐतिहासिक जनआन्दोलन १ र बहुदलीय प्रजातन्त्र पुनर्बहाली",
    titleEnglish: "1990 People's Movement (Jana Andolan I) & Democracy Restoration",
    category: "history",
    summaryNepali: "नेपाली कांग्रेस र संयुक्त वाममोर्चाको संयुक्त आन्दोलनपछि ३० वर्षे पञ्चायती व्यवस्था अन्त्य भई बहुदलीय प्रजातन्त्र पुनर्स्थापित।",
    summaryEnglish: "Mass civil movement leading to the collapse of Panchayat rule and enactment of 2047 Constitution.",
    location: "काठमाडौँ",
    relatedKnowledgeNodeId: "king-birendra"
  },
  {
    id: "evt_2006_jana_andolan_2",
    yearBS: "२०६३",
    yearAD: "2006 AD",
    titleNepali: "ऐतिहासिक १९ दिने जनआन्दोलन २ र प्रतिनिधि सभा पुनर्स्थापना (वैशाख ११)",
    titleEnglish: "19-Day People's Movement II & Parliament Reinstatement",
    category: "history",
    summaryNepali: "सात राजनीतिक दल र माओवादीको संयुक्त आन्दोलनपछि संसद् पुनर्स्थापना भई लोकतन्त्रको नयाँ युग आरम्भ।",
    summaryEnglish: "Grand democratic uprising forcing the restoration of House of Representatives and initiating peace roadmap.",
    location: "काठमाडौँ"
  },
  {
    id: "evt_2006_cpa",
    yearBS: "२०६३",
    yearAD: "2006 AD",
    titleNepali: "ऐतिहासिक विस्तृत शान्ति सम्झौता (मङ्सिर ५)",
    titleEnglish: "Comprehensive Peace Accord (CPA)",
    category: "treaty",
    summaryNepali: "१० वर्षे सशस्त्र द्वन्द्वको औपचारिक अन्त्य गरी हतियार व्यवस्थापन र संविधान सभा निर्वाचनको मार्गप्रशस्त।",
    summaryEnglish: "Historic pact ending 10-year insurgency, disarming combatants, and paving way for Constituent Assembly elections.",
    location: "काठमाडौँ (नयाँ बानेश्वर)"
  },
  {
    id: "evt_2008_republic",
    yearBS: "२०६५",
    yearAD: "2008 AD",
    titleNepali: "संविधान सभाद्वारा नेपाललाई सङ्घीय लोकतान्त्रिक गणतन्त्र घोषणा (जेठ १५)",
    titleEnglish: "Abolition of Monarchy & Declaration of Federal Democratic Republic",
    category: "history",
    summaryNepali: "प्रथम संविधान सभाको पहिलो ऐतिहासिक बैठकद्वारा २४० वर्षे शाह राजतन्त्रको अन्त्य र गणतन्त्र स्थापना।",
    summaryEnglish: "Historic resolution of the 1st Constituent Assembly declaring Nepal a Federal Democratic Republic.",
    location: "काठमाडौँ (अन्तर्राष्ट्रिय सम्मेलन केन्द्र)"
  },
  {
    id: "evt_2015_constitution",
    yearBS: "२०७२",
    yearAD: "2015 AD",
    titleNepali: "नेपाली जनताका प्रतिनिधिद्वारा संविधान सभाबाट 'नेपालको संविधान २०७२' जारी (असोज ३)",
    titleEnglish: "Promulgation of the Constitution of Nepal 2015 (Ashoj 3)",
    category: "treaty",
    summaryNepali: "सात दशक लामो नेपाली जनताको संविधान सभाबाट आफ्नै संविधान बनाउने सपना साकार भएको ऐतिहासिक दिन।",
    summaryEnglish: "Promulgation of the supreme law enshrining federalism, secularism, and three-tier governance.",
    location: "काठमाडौँ (संविधान सभा भवन)",
    relatedKnowledgeNodeId: "constitution-2072"
  }
];

export const EXPANDED_KNOWLEDGE_ENTITIES = [
  {
    id: "pashupatinath",
    nameNepali: "श्री पशुपतिनाथ मन्दिर",
    nameEnglish: "Pashupatinath Temple",
    category: "temple" as const,
    district: "काठमाडौँ",
    historicalPeriod: "पाँचौँ शताब्दी (Lichhavi Dynasty)",
    description: "काठमाडौँको वाग्मती नदी किनारमा अवस्थित विश्वप्रसिद्ध पावन ज्योतिर्लिङ्ग तथा युनेस्को विश्व सम्पदा सूचीमा सूचीकृत पवित्र वैदिक हिन्दू मन्दिर।",
    relatedEntities: ["महाशिवरात्रि", "वाग्मती", "काठमाडौँ", "शैव सम्प्रदाय", "सुपुष्प"],
    keyAttributes: {
      "मुख्य देवता": "भगवान शिव (पशुपतिनाथ)",
      "वास्तुकला": "द्वि-तह पैगोडा शैली (नेपाली वास्तुकला)",
      "संरक्षक": "पशुपति क्षेत्र विकास कोष / UNESCO",
      "पुजारी": "मूल भट्ट तथा भट्ट परम्परा"
    },
    imageUrl: "https://images.unsplash.com/photo-1609137144869-37367123d57f?q=80&w=2070&auto=format&fit=crop",
    version: 1,
    status: "published"
  },
  {
    id: "janaki-mandir",
    nameNepali: "जानकी मन्दिर (जनकपुरधाम)",
    nameEnglish: "Janaki Temple (Janakpurdham)",
    category: "temple" as const,
    district: "धनुषा (जनकपुर)",
    historicalPeriod: "वि.सं. १९६७ (१९१० ई.)",
    description: "माता सीताको जन्मभूमि जनकपुरधाममा निर्मित भव्य राजपूत तथा मुगल शैलीको विशाल मन्दिर, जसलाई नौलखा मन्दिर पनि भनिन्छ।",
    relatedEntities: ["सीता माता", "विवाह पञ्चमी", "जनकपुरधाम", "रामायण", "मिथिला"],
    keyAttributes: {
      "मुख्य निर्माणकर्ता": "टीकमगढकी महारानी वृषभानु कुमारी",
      "शैली": "राजपुत-मुगल मिश्रित वास्तुकला",
      "वार्षिक उत्सव": "विवाह पञ्चमी, रामनवमी"
    },
    imageUrl: "https://images.unsplash.com/photo-1590001155093-a3c68ab0ac67?q=80&w=2070&auto=format&fit=crop",
    version: 1,
    status: "published"
  },
  {
    id: "muktinath",
    nameNepali: "श्री मुक्तिनाथ धाम (मुक्ति क्षेत्र)",
    nameEnglish: "Muktinath Dham",
    category: "temple" as const,
    district: "मुस्ताङ",
    historicalPeriod: "प्राचीन वैदिक काल",
    description: "समुद्र सतहबाट ३,७१० मिटर उचाइमा अवस्थित हिन्दू तथा बौद्ध दुवै धर्मावलम्बीको पावन संगम स्थल, १०८ धारा र प्राकृतिक ज्वाला।",
    relatedEntities: ["१०८ धारा", "दामोदर कुण्ड", "मुस्ताङ", "शालिग्राम"],
    keyAttributes: {
      "उचाइ": "३,७१० मिटर (मुस्ताङ)",
      "पवित्रता": "१०८ जलधारा तथा अखण्ड ज्वाला",
      "विशेषता": "हिन्दू-बौद्ध साझा तीर्थ"
    },
    imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2070&auto=format&fit=crop",
    version: 1,
    status: "published"
  },
  {
    id: "lumbini",
    nameNepali: "लुम्बिनी पावन तीर्थ",
    nameEnglish: "Lumbini Heritage Site",
    category: "heritage" as const,
    district: "रूपन्देही",
    historicalPeriod: "ई.पू. ६४२ (अशोक स्तम्भ २४९ ई.पू.)",
    description: "शान्तिका अग्रदूत गौतम बुद्धको पावन जन्मस्थल। सम्राट अशोकद्वारा स्थापित अशोक स्तम्भ र मायादेवी मन्दिर अवस्थित विश्व सम्पदा स्थल।",
    relatedEntities: ["गौतम बुद्ध", "अशोक स्तम्भ", "मायादेवी मन्दिर", "रूपन्देही"],
    keyAttributes: {
      "महत्व": "विश्व शान्ति स्थल तथा बुद्ध जन्मभूमि",
      "ऐतिहासिक प्रमाण": "अशोक स्तम्भको ब्राह्मी लिपि",
      "संरक्षक": "लुम्बिनी विकास कोष"
    },
    imageUrl: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=2070&auto=format&fit=crop",
    version: 1,
    status: "published"
  },
  {
    id: "bhagavad_gita",
    nameNepali: "श्रीमद्भगवद्गीता",
    nameEnglish: "Srimad Bhagavad Gita",
    category: "scripture" as const,
    historicalPeriod: "द्वापर युग (महाभारत काल)",
    description: "महाभारत भीष्मपर्व अन्तर्गत भगवान श्रीकृष्णद्वारा कुरुक्षेत्र युद्धभूमिमा अर्जुनलाई प्रदान गरिएको ७०० श्लोकको निष्काम कर्मयोग दर्शन।",
    relatedEntities: ["श्रीकृष्ण", "अर्जुन", "कर्मयोग", "महाभारत"],
    keyAttributes: {
      "अध्याय": "१८ अध्याय",
      "श्लोक": "७०० श्लोक",
      "मूल सन्देश": "निष्काम कर्मयोग तथा आत्मज्ञान"
    },
    imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=2070&auto=format&fit=crop",
    version: 1,
    status: "published"
  },
  {
    id: "rigveda",
    nameNepali: "ऋग्वेद संहिता",
    nameEnglish: "Rigveda Samhita",
    category: "scripture" as const,
    historicalPeriod: "वैदिक काल",
    description: "मानव सभ्यताको सबैभन्दा प्राचीन लिखित ग्रन्थ। यसमा १० मण्डल र १०२८ सूक्तहरू रहेका छन्, जसमा प्रकृति, ब्रह्म र सनातन जीवनदर्शनको व्याख्या छ।",
    relatedEntities: ["गायत्री मन्त्र", "वैदिक सभ्यता", "सामवेद", "उपनिषद्"],
    keyAttributes: {
      "सूक्त सङ्ख्या": "१०२८ सूक्त",
      "मण्डल": "१० मण्डल",
      "भाषा": "वैदिक संस्कृत"
    },
    imageUrl: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=2070&auto=format&fit=crop",
    version: 1,
    status: "published"
  },
  {
    id: "upanishads",
    nameNepali: "१०८ उपनिषद् (वेदान्त दर्शन)",
    nameEnglish: "Principal Upanishads (Vedanta)",
    category: "scripture" as const,
    historicalPeriod: "उत्तर-वैदिक काल",
    description: "वेदको ज्ञानकाण्ड अर्थात् वेदान्त दर्शन, जसमा ईश, केन, कठ, मुण्डक, माण्डुक्य आदि प्रमुख ११ उपनिषद् र 'तत् त्वम् असि' जस्ता महावाक्य छन्।",
    relatedEntities: ["आदि शङ्कराचार्य", "अद्वैत वेदान्त", "ब्रह्मसूत्र", "वेद"],
    keyAttributes: {
      "प्रमुख उपनिषद्": "ईश, केन, कठ, प्रश्न, मुण्डक, माण्डुक्य, तैत्तिरीय",
      "केन्द्रीय दर्शन": "जीव र ब्रह्मको अभेद सत्य"
    },
    imageUrl: "https://images.unsplash.com/photo-1532012164546-f432f2e3edd8?q=80&w=2070&auto=format&fit=crop",
    version: 1,
    status: "published"
  },
  {
    id: "prithvi-narayan-shah",
    nameNepali: "बडामहाराजाधिराज श्री ५ पृथ्वीनारायण शाह",
    nameEnglish: "King Prithvi Narayan Shah",
    category: "figure" as const,
    historicalPeriod: "वि.सं. १७७९ - १८३१",
    description: "आधुनिक विशाल नेपाल राज्यका राष्ट्रनिर्माता तथा 'नेपाल चार वर्ण छत्तीस जातको साझा फूलबारी हो' भन्ने दिव्य उपदेशका प्रणेता।",
    relatedEntities: ["नेपाल एकीकरण", "दिव्य उपदेश", "गोरखा", "शाह वंश"],
    keyAttributes: {
      "जन्म": "वि.सं. १७७९ पौष २७ (गोरखा)",
      "महत्व": "आधुनिक नेपालका राष्ट्रनिर्माता",
      "सिद्धान्त": "दिव्य उपदेश (कूटनीति, अर्थतन्त्र र राष्ट्रिय सुरक्षा)"
    },
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=2070&auto=format&fit=crop",
    version: 1,
    status: "published"
  },
  {
    id: "tribhuvan-shah",
    nameNepali: "राष्ट्रपिता राजा त्रिभुवन वीरविक्रम शाह",
    nameEnglish: "King Tribhuvan Bir Bikram Shah",
    category: "figure" as const,
    historicalPeriod: "वि.सं. १९६३ - २०११",
    description: "१०४ वर्षे जहानियाँ राणा शासनको अन्त्य गरी वि.सं. २००७ सालमा प्रजातन्त्र स्थापना गर्न नेतृत्वदायी भूमिका निर्वाह गर्ने राष्ट्रपिता।",
    relatedEntities: ["प्रजातन्त्र २००७", "शाह वंश", "नेपालको अन्तरिम विधान"],
    keyAttributes: {
      "ऐतिहासिक योगदान": "प्रजातन्त्र घोषणा वि.सं. २००७ फागुन ७",
      "उपाधि": "राष्ट्रपिता"
    },
    imageUrl: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?q=80&w=2070&auto=format&fit=crop",
    version: 1,
    status: "published"
  },
  {
    id: "bp-koirala",
    nameNepali: "विश्वेश्वरप्रसाद कोइराला (बीपी)",
    nameEnglish: "Bishweshwar Prasad Koirala (BP)",
    category: "figure" as const,
    historicalPeriod: "वि.सं. १९७१ - २०३९",
    description: "नेपालका प्रथम जननिर्वाचित प्रधानमन्त्री, प्रजातान्त्रिक समाजवादका प्रणेता तथा नेपाली साहित्यका मूर्धन्य मनोवैज्ञानिक कथाकार एवं उपन्यासकार।",
    relatedEntities: ["प्रजातन्त्र २००७", "संसदीय व्यवस्था", "प्रजातान्त्रिक समाजवाद", "आत्मवृत्तान्त"],
    keyAttributes: {
      "पद": "प्रथम जननिर्वाचित प्रधानमन्त्री (२०१६)",
      "दर्शन": "प्रजातान्त्रिक समाजवाद र राष्ट्रिय मेलमिलाप",
      "साहित्यिक योगदान": "दोषी चश्मा, सुम्निमा, नरेन्द्रदाइ, तीन घुम्ती"
    },
    imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=2070&auto=format&fit=crop",
    version: 1,
    status: "published"
  },
  {
    id: "king-birendra",
    nameNepali: "श्री ५ महाराजाधिराज वीरेन्द्र वीरविक्रम शाह",
    nameEnglish: "King Birendra Bir Bikram Shah",
    category: "figure" as const,
    historicalPeriod: "वि.सं. २००२ - २०५८",
    description: "नेपाललाई 'शान्ति क्षेत्र' प्रस्ताव गर्ने दूरदर्शी राजा तथा वि.सं. २०४७ को बहुदलीय प्रजातान्त्रिक संविधान घोषणा गर्ने जनप्रिय राष्ट्रप्रमुख।",
    relatedEntities: ["शान्ति क्षेत्र प्रस्ताव", "सार्क स्थापना", "२०४७ को संविधान", "जनमत सङ्ग्रह २०३७"],
    keyAttributes: {
      "ऐतिहासिक प्रस्ताव": "नेपाललाई शान्ति क्षेत्र घोषित गरियोस् (२०३१)",
      "संविधान": "२०४७ को संवैधानिक राजतन्त्रको संविधान जारी",
      "क्षेत्रीय कूटनीति": "सार्क (SAARC) को सह-संस्थापक"
    },
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=2070&auto=format&fit=crop",
    version: 1,
    status: "published"
  },
  {
    id: "constitution-2072",
    nameNepali: "नेपालको संविधान २०७२",
    nameEnglish: "Constitution of Nepal 2015",
    category: "scripture" as const,
    historicalPeriod: "वि.सं. २०७२ (2015 AD)",
    description: "नेपाली जनताका निर्वाचित प्रतिनिधिद्वारा संविधान सभाबाट निर्मित नेपालको सर्वोच्च मूल कानुन। यसले सङ्घीय लोकतान्त्रिक गणतन्त्र र धर्मनिरपेक्षता संस्थागत गर्दछ।",
    relatedEntities: ["संविधान सभा", "सङ्घीयता", "मौलिक हक", "तीन तहको सरकार"],
    keyAttributes: {
      "संरचना": "३५ भाग, ३०८ धारा, ९ अनुसूची",
      "जारी मिति": "वि.सं. २०७२ असोज ३ गते",
      "मूल विशेषता": "सङ्घीय लोकतान्त्रिक गणतन्त्र, समावेशी समानुपातिक प्रतिनिधित्व"
    },
    imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2070&auto=format&fit=crop",
    version: 1,
    status: "published"
  },
  {
    id: "muluki-ain-code",
    nameNepali: "मुलुकी ऐन १९१० (नेपालको प्रथम संहिता)",
    nameEnglish: "Muluki Ain 1910 BS (First Legal Code of Nepal)",
    category: "scripture" as const,
    historicalPeriod: "वि.सं. १९१० (1854 AD)",
    description: "श्री ३ जङ्गबहादुर राणाको पालामा जारी भएको नेपालको पहिलो एकीकृत लिखित कानुन तथा सामाजिक-न्यायिक संहिता।",
    relatedEntities: ["जङ्गबहादुर राणा", "कौशल अड्डा", "ऐतिहासिक कानुन", "१९१० वि.सं."],
    keyAttributes: {
      "जारी वर्ष": "वि.सं. १९१० (१८६४ AD)",
      "प्रणेता": "श्री ५ सुरेन्द्र तथा श्री ३ जङ्गबहादुर राणा",
      "महत्त्व": "नेपालको पहिलो लिखित कानुनी दस्तावेज"
    },
    imageUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=2070&auto=format&fit=crop",
    version: 1,
    status: "published"
  }
];

