import { db, getDocsWithCacheFallback } from "@/src/lib/firebase";
import { collection, query, where, getDocs, limit } from "@/src/lib/firebase";
import type { KnowledgeNode, KnowledgeEdge, ScriptureReference, Article } from "@/src/types";

// Master Initial Knowledge Nodes Seed
export const SEED_KNOWLEDGE_NODES: KnowledgeNode[] = [
  {
    id: "pashupatinath",
    nameNepali: "श्री पशुपतिनाथ मन्दिर",
    nameEnglish: "Pashupatinath Temple",
    sanskrit: "श्रीपशुपतिनाथः",
    type: "temple",
    category: "temple",
    district: "काठमाडौँ",
    province: "बागमती प्रदेश",
    historicalPeriod: "पाँचौँ शताब्दी (Lichhavi Dynasty)",
    description: "काठमाडौँको वाग्मती नदी किनारमा अवस्थित विश्वप्रसिद्ध पावन ज्योतिर्लिङ्ग तथा युनेस्को विश्व सम्पदा सूचीमा सूचीकृत पवित्र वैदिक हिन्दू मन्दिर।",
    keyAttributes: {
      "मुख्य देवता": "भगवान शिव (पशुपतिनाथ)",
      "वास्तुकला": "पैगोडा शैली (नेपाली वास्तुकला)",
      "संरक्षक": "युनेस्को (UNESCO World Heritage)"
    },
    imageUrl: "https://images.unsplash.com/photo-1609137144869-37367123d57f?q=80&w=2070&auto=format&fit=crop",
    origin: "human",
    verificationStatus: "verified"
  },
  {
    id: "janaki-mandir",
    nameNepali: "जानकी मन्दिर (जनकपुरधाम)",
    nameEnglish: "Janaki Temple",
    sanskrit: "जानकी मन्दिरम्",
    type: "temple",
    category: "temple",
    district: "धनुषा",
    province: "मधेश प्रदेश",
    historicalPeriod: "वि.सं. १९६७ (१९१० ई.)",
    description: "माता सीताको जन्मभूमि जनकपुरधाममा निर्मित भव्य राजपूत तथा मुगल शैलीको विशाल मन्दिर, जसलाई नौलखा मन्दिर पनि भनिन्छ।",
    keyAttributes: {
      "मुख्य निर्माणकर्ता": "टीकमगढकी महारानी वृषभानु कुमारी",
      "शैली": "राजपुत-मुगल मिश्रित वास्तुकला",
      "वार्षिक उत्सव": "विवाह पञ्चमी, रामनवमी"
    },
    imageUrl: "https://images.unsplash.com/photo-1590001155093-a3c68ab0ac67?q=80&w=2070&auto=format&fit=crop",
    origin: "human",
    verificationStatus: "verified"
  },
  {
    id: "rigveda",
    nameNepali: "ऋग्वेद संहिता",
    nameEnglish: "Rigveda Samhita",
    sanskrit: "ऋग्वेदः",
    type: "scripture",
    category: "scripture",
    historicalPeriod: "वैदिक काल",
    description: "मानव सभ्यताको सबैभन्दा प्राचीन लिखित ग्रन्थ। यसमा १० मण्डल र १०२८ सूक्तहरू रहेका छन्, जसमा प्रकृति, ब्रह्म र सनातन जीवनदर्शनको व्याख्या छ।",
    keyAttributes: {
      "सूक्त सङ्ख्या": "१०२८ सूक्त",
      "मण्डल": "१० मण्डल",
      "भाषा": "वैदिक संस्कृत"
    },
    imageUrl: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=2070&auto=format&fit=crop",
    origin: "human",
    verificationStatus: "verified"
  },
  {
    id: "gita",
    nameNepali: "श्रीमद्भगवद्गीता",
    nameEnglish: "Bhagavad Gita",
    sanskrit: "श्रीमद्भगवद्गीता",
    type: "scripture",
    category: "scripture",
    historicalPeriod: "महाभारत काल (द्वापरयुग)",
    description: "महाभारतको भीष्मपर्व अन्तर्गत श्रीकृष्ण र अर्जुनबीचको धर्म, कर्म र मोक्ष सम्बन्धी पावन संवाद।",
    keyAttributes: {
      "अध्याय": "१८ अध्याय",
      "श्लोक सङ्ख्या": "७०० श्लोक",
      "प्रवक्ता": "भगवान श्रीकृष्ण"
    },
    imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2070&auto=format&fit=crop",
    origin: "human",
    verificationStatus: "verified"
  },
  {
    id: "karma",
    nameNepali: "कर्मयोग र कर्मसिद्धान्त",
    nameEnglish: "Karma Yoga & Philosophy",
    sanskrit: "कर्मयोगः",
    type: "concept",
    category: "concept",
    description: "फलको आसक्ति बिना कर्तव्यपालन गर्ने वैदिक सिद्धान्त। श्रीमद्भगवद्गीतामा कर्मयोगलाई जीवन मुक्तिको सुगम मार्ग मानिएको छ।",
    keyAttributes: {
      "मूल शास्त्र": "श्रीमद्भगवद्गीता (अध्याय २ र ३)",
      "मुख्य सिद्धान्त": "निष्काम कर्म (Action without attachment)",
      "लक्ष्य": "चित्त शुद्धि र मोक्ष"
    },
    imageUrl: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2070&auto=format&fit=crop",
    origin: "human",
    verificationStatus: "verified"
  },
  {
    id: "mustang",
    nameNepali: "मुस्ताङ हिमाली मण्डल",
    nameEnglish: "Mustang Himalayan District",
    type: "district",
    category: "heritage",
    district: "मुस्ताङ",
    province: "गण्डकी प्रदेश",
    historicalPeriod: "लो राज्य (Upper Mustang Kingdom)",
    description: "अन्नपूर्ण हिमशृङ्खला पारिको पावन हिमाली भूमि। मुक्तिनाथ तीर्थ, लोमान्थाङ दरबार, र प्राचीन बौद्ध-सनातन सांस्कृतिक धरोहरहरूको सङ्गमस्थल।",
    keyAttributes: {
      "मुख्यालय": "जोमसोम",
      "मुख्य तीर्थ": "मुक्तिनाथ धाम (१०८ धारा र ज्वालामाई)",
      "सांस्कृतिक विशेषता": "थकाली तथा भोटे संस्कृति"
    },
    imageUrl: "https://images.unsplash.com/photo-1546548970-71785318a17b?q=80&w=2070&auto=format&fit=crop",
    origin: "human",
    verificationStatus: "verified"
  },
  {
    id: "muktinath",
    nameNepali: "श्री मुक्तिनाथ धाम",
    nameEnglish: "Muktinath Dham",
    sanskrit: "श्रीमुक्तिनाथक्षेत्रम्",
    type: "temple",
    category: "temple",
    district: "मुस्ताङ",
    province: "गण्डकी प्रदेश",
    historicalPeriod: "प्राचीन सनातन-बौद्ध तीर्थ",
    description: "समुद्रसतहबाट ३,७१० मिटर उचाइमा अवस्थित हिन्दू तथा बौद्ध धर्मावलम्बीहरूको साझा पावन तीर्थस्थल, जहाँ १०८ धारा र प्राकृतिक ज्वाला बलिरहन्छ।",
    keyAttributes: {
      "मुख्य आकर्षण": "१०८ जलधारा, अखण्ड ज्वाला, शालग्राम शिला",
      "महत्व": "मोक्षदा तीर्थ (१०८ वैष्णव दिव्यदेशम मध्ये एक)",
      "साझा आस्था": "हिन्दू (विष्णु/शिव) र बौद्ध (लोकेश्वर)"
    },
    imageUrl: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=2070&auto=format&fit=crop",
    origin: "human",
    verificationStatus: "verified"
  },
  {
    id: "lumbini",
    nameNepali: "लुम्बिनी पावन तीर्थ",
    nameEnglish: "Lumbini Heritage Site",
    type: "heritage",
    category: "heritage",
    district: "रूपन्देही",
    province: "लुम्बिनी प्रदेश",
    historicalPeriod: "ई.पू. ६४२ (अशोक स्तम्भ २४९ ई.पू.)",
    description: "शान्तिका अग्रदूत गौतम बुद्धको पावन जन्मस्थल। सम्राट अशोकद्वारा स्थापित अशोक स्तम्भ र मायादेवी मन्दिर अवस्थित विश्व सम्पदा स्थल।",
    keyAttributes: {
      "महत्व": "विश्व शान्ति स्थल तथा बुद्ध जन्मभूमि",
      "ऐतिहासिक प्रमाण": "अशोक स्तम्भको ब्राह्मी लिपि",
      "संरक्षक": "लुम्बिनी विकास कोष"
    },
    imageUrl: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=2070&auto=format&fit=crop",
    origin: "human",
    verificationStatus: "verified"
  },
  {
    id: "dashain",
    nameNepali: "बडा दशैँ (विजया दशमी)",
    nameEnglish: "Dashain Festival",
    type: "festival",
    category: "festival",
    historicalPeriod: "प्राचीन सनातन परम्परा",
    description: "नेपाली समाजको सबैभन्दा ठूलो र महत्त्वपूर्ण राष्ट्रिय तथा सांस्कृतिक पर्व। आसुरी शक्तिमाथि दैवी शक्तिको विजयको प्रतीकको रूपमा १५ दिनसम्म मनाइन्छ।",
    keyAttributes: {
      "अवधि": "१५ दिन (आश्विन शुक्ल प्रतिपदा देखि पूर्णिमा)",
      "मुख्य विधि": "जमरा रोपण, नवदुर्गा पूजा, नवमी बलि/पूजा, टीका-प्रसाद",
      "सांस्कृतिक महत्व": "पारिवारिक मिलन र आशीर्वाद ग्रहण"
    },
    imageUrl: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2070&auto=format&fit=crop",
    origin: "human",
    verificationStatus: "verified"
  },
  {
    id: "krishna",
    nameNepali: "भगवान श्रीकृष्ण",
    nameEnglish: "Lord Krishna",
    sanskrit: "श्रीकृष्णः",
    type: "figure",
    category: "figure",
    historicalPeriod: "द्वापरयुग",
    description: "सनातन संस्कृतिमा भगवान विष्णुका पूर्ण अवतार। भगवद्गीताका उपदेष्टा, धर्म संस्थापक र योगेश्वर।",
    keyAttributes: {
      "मूल ग्रन्थ": "श्रीमद्भागवत, भगवद्गीता, महाभारत",
      "मुख्य सन्देश": "निष्काम कर्म, धर्म र अनन्य भक्ति"
    },
    imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2070&auto=format&fit=crop",
    origin: "human",
    verificationStatus: "verified"
  },
  // NEWSROOM KNOWLEDGE GRAPH ENTITIES (NewsOS v3.0)
  {
    id: "balen-shah",
    nameNepali: "बालेन्द्र शाह (बालेन)",
    nameEnglish: "Balendra Shah",
    type: "leader",
    category: "politics",
    district: "काठमाडौँ",
    province: "बागमती प्रदेश",
    description: "नेपालका प्रधानमन्त्री तथा स्वतन्त्र जनप्रिय नेता। पूर्व काठमाडौँ महानगरपालिका प्रमुख (मेयर)।",
    keyAttributes: {
      "पद": "प्रधानमन्त्री (Prime Minister of Nepal)",
      "कार्यकाल सुरु": "२०८२ चैत १४ (2026-03-27)",
      "अधिकार क्षेत्र": "नेपाल सरकार / सिंहदरबार"
    },
    imageUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=2070&auto=format&fit=crop",
    origin: "human",
    authorityTier: 1,
    verificationStatus: "verified"
  },
  {
    id: "kp-oli",
    nameNepali: "केपी शर्मा ओली",
    nameEnglish: "KP Sharma Oli",
    type: "leader",
    category: "politics",
    district: "झापा",
    province: "कोशी प्रदेश",
    description: "नेपालका पूर्व प्रधानमन्त्री तथा नेकपा (एमाले) का अध्यक्ष।",
    keyAttributes: {
      "पद": "पूर्व प्रधानमन्त्री (Former Prime Minister of Nepal)",
      "पार्टी": "नेकपा (एमाले)",
      "संसदीय क्षेत्र": "झापा-५"
    },
    imageUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=2070&auto=format&fit=crop",
    origin: "human",
    authorityTier: 1,
    verificationStatus: "verified"
  },
  {
    id: "cabinet-nepal",
    nameNepali: "नेपाल सरकार मन्त्रिपरिषद्",
    nameEnglish: "Council of Ministers Nepal (Cabinet)",
    type: "institution",
    category: "governance",
    district: "काठमाडौँ",
    province: "बागमती प्रदेश",
    description: "नेपालको सर्वोच्च कार्यकारी निकाय। सिंहदरबारबाट नीति, बजेट, अध्यादेश तथा सार्वजनिक प्रशासनका कार्यकारी निर्णयहरू सञ्चालन गर्दछ।",
    keyAttributes: {
      "मुख्यालय": "सिंहदरबार, काठमाडौँ",
      "संवैधानिक प्रावधान": "नेपालको संविधान भाग ७",
      "कार्यकारी प्रमुख": "प्रधानमन्त्री"
    },
    imageUrl: "https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=2070&auto=format&fit=crop",
    origin: "human",
    authorityTier: 1,
    verificationStatus: "verified"
  },
  {
    id: "finance-ministry",
    nameNepali: "अर्थ मन्त्रालय",
    nameEnglish: "Ministry of Finance",
    type: "ministry",
    category: "governance",
    district: "काठमाडौँ",
    province: "बागमती प्रदेश",
    description: "नेपालको राष्ट्रिय अर्थतन्त्र, राजस्व संकलन, वार्षिक बजेट निर्माण तथा वित्तीय नीति निर्माण गर्ने प्रमुख मन्त्रालय।",
    keyAttributes: {
      "मुख्यालय": "सिंहदरबार, काठमाडौँ",
      "सम्बद्ध निकाय": "नेपाल राष्ट्र बैंक, आन्तरिक राजस्व विभाग, भन्सार विभाग",
      "मुख्य जिम्मेवारी": "बजेट, मौद्रिक समन्वय, वैदेशिक सहायता"
    },
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop",
    origin: "human",
    authorityTier: 1,
    verificationStatus: "verified"
  },
  {
    id: "nepal-rastra-bank",
    nameNepali: "नेपाल राष्ट्र बैंक",
    nameEnglish: "Nepal Rastra Bank (NRB)",
    type: "institution",
    category: "economy",
    district: "काठमाडौँ",
    province: "बागमती प्रदेश",
    description: "नेपालको केन्द्रीय बैंक। मुलुकको मौद्रिक नीति, विदेशी मुद्रा सञ्चिति तथा वित्तीय स्थायित्व नियमन गर्ने सर्वोच्च स्वायत्त निकाय।",
    keyAttributes: {
      "स्थापना": "वि.सं. २०१३ वैशाख १४",
      "केन्द्रीय कार्यालय": "बालुवाटार, काठमाडौँ",
      "प्रमुख": "गभर्नर"
    },
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop",
    origin: "human",
    authorityTier: 1,
    verificationStatus: "verified"
  },
  {
    id: "civil-service-bill",
    nameNepali: "संघीय निजामती सेवा विधेयक",
    nameEnglish: "Federal Civil Service Bill",
    type: "legislation",
    category: "governance",
    district: "काठमाडौँ",
    province: "बागमती प्रदेश",
    description: "नेपालको संघ, प्रदेश र स्थानीय तहमा निजामती कर्मचारी प्रशासनलाई व्यवस्थित, पारदर्शी र संघीय संरचना अनुकूल बनाउने ऐतिहासिक कानुन।",
    keyAttributes: {
      "स्थिति": "संसदीय समितिमा छलफलमा",
      "सम्बन्धित मन्त्रालय": "सङ्घीय मामिला तथा सामान्य प्रशासन मन्त्रालय",
      "मुख्य विषय": "समावेशिता, अनिवार्य अवकाश उमेर, कर्मचारी समायोजन"
    },
    imageUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=2070&auto=format&fit=crop",
    origin: "human",
    authorityTier: 1,
    verificationStatus: "verified"
  },
  {
    id: "supreme-court-nepal",
    nameNepali: "सर्वोच्च अदालत नेपाल",
    nameEnglish: "Supreme Court of Nepal",
    type: "institution",
    category: "judiciary",
    district: "काठमाडौँ",
    province: "बागमती प्रदेश",
    description: "नेपालको न्यायपालिकाको सर्वोच्च अभिलेख अदालत। संविधान र कानुनको अन्तिम व्याख्याता तथा नागरिकको मौलिक हकको संरक्षक।",
    keyAttributes: {
      "स्थान": "रामशाहपथ, काठमाडौँ",
      "संवैधानिक हैसियत": "अभिलेख अदालत (Court of Record)",
      "प्रमुख": "प्रधानन्यायाधीश"
    },
    imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2070&auto=format&fit=crop",
    origin: "human",
    authorityTier: 1,
    verificationStatus: "verified"
  }
];

// Master Initial Knowledge Edges
export const SEED_KNOWLEDGE_EDGES: KnowledgeEdge[] = [
  {
    id: "edge-1",
    sourceId: "karma",
    targetId: "gita",
    relation: "explained_in",
    labelNepali: "गीतामा व्याख्या गरिएको",
    labelEnglish: "Explained in Bhagavad Gita"
  },
  {
    id: "edge-2",
    sourceId: "krishna",
    targetId: "gita",
    relation: "authored_by",
    labelNepali: "श्रीकृष्णद्वारा उपदिष्ट",
    labelEnglish: "Spoken by Lord Krishna"
  },
  {
    id: "edge-3",
    sourceId: "pashupatinath",
    targetId: "dashain",
    relation: "associated_with",
    labelNepali: "दशैँमा पावन पूजा गरिने",
    labelEnglish: "Worshipped during Dashain"
  },
  {
    id: "edge-4",
    sourceId: "muktinath",
    targetId: "mustang",
    relation: "located_in",
    labelNepali: "मुस्ताङमा अवस्थित",
    labelEnglish: "Located in Mustang"
  },
  {
    id: "edge-5",
    sourceId: "janaki-mandir",
    targetId: "rigveda",
    relation: "referenced_in",
    labelNepali: "वैदिक परम्परासँग जोडिएको",
    labelEnglish: "Linked to Vedic Tradition"
  },
  {
    id: "edge-6",
    sourceId: "pashupatinath",
    targetId: "rigveda",
    relation: "referenced_in",
    labelNepali: "ऋग्वेद रुद्र सूक्तमा वर्णित",
    labelEnglish: "Referenced in Rudra Sukta"
  },
  {
    id: "edge-7",
    sourceId: "mustang",
    targetId: "lumbini",
    relation: "associated_with",
    labelNepali: "नेपालको पावन तीर्थ मार्ग",
    labelEnglish: "Nepal Pilgrimage Corridor"
  },
  // Newsroom Graph Relations (NewsOS v3.0)
  {
    id: "edge-news-1",
    sourceId: "kp-oli",
    targetId: "cabinet-nepal",
    relation: "holds_office",
    labelNepali: "मन्त्रिपरिषद्का अध्यक्ष / प्रधानमन्त्री",
    labelEnglish: "Chairs Cabinet / Prime Minister"
  },
  {
    id: "edge-news-2",
    sourceId: "cabinet-nepal",
    targetId: "civil-service-bill",
    relation: "introduced_bill",
    labelNepali: "संसद्मा विधेयक दर्ता तथा सिफारिस",
    labelEnglish: "Approved & Recommended Bill"
  },
  {
    id: "edge-news-3",
    sourceId: "finance-ministry",
    targetId: "nepal-rastra-bank",
    relation: "regulates",
    labelNepali: "मौद्रिक तथा वित्तीय नीति समन्वय",
    labelEnglish: "Fiscal & Monetary Policy Coordination"
  },
  {
    id: "edge-news-4",
    sourceId: "supreme-court-nepal",
    targetId: "civil-service-bill",
    relation: "oversees",
    labelNepali: "संवैधानिक परीक्षण तथा फैसला",
    labelEnglish: "Constitutional Review & Orders"
  },
  {
    id: "edge-news-5",
    sourceId: "kp-oli",
    targetId: "finance-ministry",
    relation: "oversees",
    labelNepali: "मन्त्रालयको समग्र सुपरिवेक्षण",
    labelEnglish: "Executive Oversight"
  }
];

// Scripture References Seed
export const SEED_SCRIPTURE_REFERENCES: ScriptureReference[] = [
  {
    id: "ref-1",
    nodeId: "karma",
    granthaId: "gita",
    granthaTitleNepali: "श्रीमद्भगवद्गीता",
    granthaTitleEnglish: "Bhagavad Gita",
    chapter: 2,
    verse: 47,
    sanskritVerse: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
    translation: "कर्म गर्नमा मात्र तिम्रो अधिकार छ, फलमा कहिल्यै छैन। त्यसैले फलको हेतु नबन र अकर्ममा पनि तिम्रो आसक्ति नहोस्।"
  },
  {
    id: "ref-2",
    nodeId: "karma",
    granthaId: "gita",
    granthaTitleNepali: "श्रीमद्भगवद्गीता",
    granthaTitleEnglish: "Bhagavad Gita",
    chapter: 3,
    verse: 8,
    sanskritVerse: "नियतं कुरु कर्म त्वं कर्म ज्यायो ह्यकर्मणः। शरीरयात्रापि च ते न प्रसिद्ध्येद् अकर्मणः॥",
    translation: "शास्त्रविहित कर्तव्य कर्म गर, किनभने अकर्मभन्दा कर्म श्रेष्ठ छ। कर्म नगर्दा तिम्रो शरीरयात्रा पनि चल्न सक्दैन।"
  },
  {
    id: "ref-3",
    nodeId: "rigveda",
    granthaId: "rigveda",
    granthaTitleNepali: "ऋग्वेद संहिता",
    granthaTitleEnglish: "Rigveda Samhita",
    chapter: 10,
    verse: 121,
    sanskritVerse: "हिरण्यगर्भः समवर्तताग्रे भूतस्य जातौ पतिरेक आसीत्। स दाधार पृथिवीं द्यामुतेमां कस्मै देवाय हविषा विधेम॥",
    translation: "सृष्टिको आरम्भमा हिरण्यगर्भ (प्रकाशपुञ्ज परमात्मा) मात्र विद्यमान हुनुहुन्थ्यो, उहाँ नै समस्त चराचर जगतका एकमात्र स्वामी हुनुहुन्छ।"
  }
];

export class KnowledgeGraphEngine {
  private static nodes: KnowledgeNode[] = SEED_KNOWLEDGE_NODES;
  private static edges: KnowledgeEdge[] = SEED_KNOWLEDGE_EDGES;
  private static scriptures: ScriptureReference[] = SEED_SCRIPTURE_REFERENCES;

  /**
   * Loads or merges knowledge nodes from Firestore or cache fallback
   */
  static async getNodes(): Promise<KnowledgeNode[]> {
    try {
      const q = query(collection(db, "knowledge_base"), limit(100));
      const snap = await getDocsWithCacheFallback(q, "knowledge_base");
      if (!snap.empty) {
        const firestoreNodes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeNode));
        if (firestoreNodes.length > 0) {
          this.nodes = firestoreNodes;
          return this.nodes;
        }
      }
    } catch (e) {
      console.warn("[KnowledgeGraphEngine] Loaded from local seed fallback");
    }
    return this.nodes;
  }

  /**
   * Retrieves a target node and all connected graph neighbors
   */
  static async getNodeWithNeighbors(nodeId: string) {
    const allNodes = await this.getNodes();
    const node = allNodes.find(n => n.id === nodeId) || allNodes[0];

    const connectedEdges = this.edges.filter(e => e.sourceId === node.id || e.targetId === node.id);
    const connectedNodeIds = new Set<string>();
    connectedEdges.forEach(e => {
      connectedNodeIds.add(e.sourceId === node.id ? e.targetId : e.sourceId);
    });

    const neighbors = allNodes.filter(n => connectedNodeIds.has(n.id));
    const scriptureRefs = this.scriptures.filter(s => s.nodeId === node.id || s.granthaId === node.id);

    return {
      node,
      connectedEdges,
      neighbors,
      scriptureRefs
    };
  }

  /**
   * Calculates a dynamic relationship relevance score between two entities
   * Score = (Shared Nodes * 3) + (Shared Category * 2) + (Shared Location * 2)
   */
  static calculateRelevanceScore(nodeA: KnowledgeNode, nodeB: KnowledgeNode): number {
    if (nodeA.id === nodeB.id) return 100;
    let score = 0;

    if (nodeA.category === nodeB.category) score += 20;
    if (nodeA.district && nodeA.district === nodeB.district) score += 30;
    if (nodeA.province && nodeA.province === nodeB.province) score += 15;

    // Check shared edge connections
    const edgesA = new Set(this.edges.filter(e => e.sourceId === nodeA.id || e.targetId === nodeA.id).map(e => e.sourceId === nodeA.id ? e.targetId : e.sourceId));
    const edgesB = new Set(this.edges.filter(e => e.sourceId === nodeB.id || e.targetId === nodeB.id).map(e => e.sourceId === nodeB.id ? e.targetId : e.sourceId));

    edgesA.forEach(neighborId => {
      if (edgesB.has(neighborId)) score += 25;
    });

    return score;
  }

  /**
   * Searches Knowledge Graph with semantic expanders
   */
  static searchGraph(term: string) {
    const cleanTerm = term.trim().toLowerCase();
    if (!cleanTerm) {
      return {
        directMatches: this.nodes,
        relatedConcepts: [],
        relatedScriptures: [],
        relatedPlaces: []
      };
    }

    const directMatches = this.nodes.filter(n => 
      (n.nameNepali || "").toLowerCase().includes(cleanTerm) ||
      (n.nameEnglish || "").toLowerCase().includes(cleanTerm) ||
      (n.sanskrit && n.sanskrit.toLowerCase().includes(cleanTerm)) ||
      (n.description || "").toLowerCase().includes(cleanTerm) ||
      (n.district && n.district.toLowerCase().includes(cleanTerm))
    );

    const directNodeIds = new Set(directMatches.map(m => m.id));

    // Expand connected nodes via edges
    const connectedIds = new Set<string>();
    this.edges.forEach(e => {
      if (directNodeIds.has(e.sourceId)) connectedIds.add(e.targetId);
      if (directNodeIds.has(e.targetId)) connectedIds.add(e.sourceId);
    });

    const relatedNodes = this.nodes.filter(n => connectedIds.has(n.id) && !directNodeIds.has(n.id));

    return {
      directMatches,
      relatedConcepts: relatedNodes.filter(n => n.type === "concept" || n.type === "figure"),
      relatedScriptures: relatedNodes.filter(n => n.type === "scripture"),
      relatedPlaces: relatedNodes.filter(n => n.type === "temple" || n.type === "heritage" || n.type === "district" || n.type === "place"),
      scriptureVerses: this.scriptures.filter(s => 
        s.sanskritVerse?.toLowerCase().includes(cleanTerm) ||
        s.translation?.toLowerCase().includes(cleanTerm) ||
        s.granthaTitleNepali?.toLowerCase().includes(cleanTerm)
      )
    };
  }

  /**
   * Dynamically ranks and connects Articles to a Knowledge Node
   */
  static rankArticlesForNode(node: KnowledgeNode, articles: Article[]): Article[] {
    if (!node || !articles || !Array.isArray(articles)) return [];

    const nodeNameNep = (node.nameNepali || "").toLowerCase();
    const nodeNameEng = (node.nameEnglish || "").toLowerCase();

    return articles.map(art => {
      if (!art) return { article: null, score: 0 };
      let score = 0;
      const title = (art.title || "").toLowerCase();
      const excerpt = (art.excerpt || "").toLowerCase();

      if (nodeNameNep && (title.includes(nodeNameNep) || excerpt.includes(nodeNameNep))) {
        if (title.includes(nodeNameNep)) score += 50;
        if (excerpt.includes(nodeNameNep)) score += 25;
      }
      if (nodeNameEng && (title.includes(nodeNameEng) || excerpt.includes(nodeNameEng))) {
        if (title.includes(nodeNameEng)) score += 50;
        if (excerpt.includes(nodeNameEng)) score += 25;
      }
      
      const artAny = art as any;
      if (artAny.districts && Array.isArray(artAny.districts) && node.district && artAny.districts.includes(node.district)) score += 30;
      if (artAny.district && node.district && artAny.district === node.district) score += 30;

      // Check knowledgeEntities on article
      if (artAny.knowledgeEntities && Array.isArray(artAny.knowledgeEntities)) {
        if (artAny.knowledgeEntities.includes(node.id) || (node.nameNepali && artAny.knowledgeEntities.includes(node.nameNepali))) {
          score += 60;
        }
      }

      return { article: art, score };
    })
    .filter(item => item.article && item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.article as Article);
  }

  /**
   * Discovers and ranks Knowledge Nodes related to an Article
   */
  static getRelatedNodesForArticle(article: Article): KnowledgeNode[] {
    if (!article) return [];
    const title = (article.title || "").toLowerCase();
    const excerpt = (article.excerpt || "").toLowerCase();
    const content = (article.content || "").toLowerCase();
    const artAny = article as any;
    const taggedEntities = Array.isArray(artAny.knowledgeEntities) ? artAny.knowledgeEntities : [];
    const districts = Array.isArray(artAny.districts) ? artAny.districts : (artAny.district ? [artAny.district] : []);

    const scored = this.nodes.map(node => {
      let score = 0;
      const nodeNameNep = (node.nameNepali || "").toLowerCase();
      const nodeNameEng = (node.nameEnglish || "").toLowerCase();

      if (taggedEntities.includes(node.id) || (node.nameNepali && taggedEntities.includes(node.nameNepali))) {
        score += 100;
      }
      if (nodeNameNep && title.includes(nodeNameNep)) score += 60;
      if (nodeNameEng && title.includes(nodeNameEng)) score += 50;
      if (nodeNameNep && excerpt.includes(nodeNameNep)) score += 30;
      if (nodeNameNep && content.includes(nodeNameNep)) score += 15;
      if (node.district && districts.includes(node.district)) score += 20;

      return { node, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.node);

    return scored.slice(0, 5);
  }

  /**
   * Computes comprehensive Graph Health, Density, Orphan Nodes, and Nepal Hub Coverage metrics
   */
  static getGraphHealthMetrics() {
    const totalNodes = this.nodes.length;
    const totalEdges = this.edges.length;

    // Map degree of each node
    const degreeMap = new Map<string, number>();
    this.nodes.forEach(n => degreeMap.set(n.id, 0));

    this.edges.forEach(e => {
      degreeMap.set(e.sourceId, (degreeMap.get(e.sourceId) || 0) + 1);
      degreeMap.set(e.targetId, (degreeMap.get(e.targetId) || 0) + 1);
    });

    const orphanNodes = this.nodes.filter(n => (degreeMap.get(n.id) || 0) === 0);
    const avgConnectionsPerNode = totalNodes > 0 ? Number(((totalEdges * 2) / totalNodes).toFixed(2)) : 0;

    // Nepal Hub Coverage (Mapped districts & places vs 77 total districts)
    const mappedDistricts = new Set(
      this.nodes.map(n => n.district).filter((d): d is string => Boolean(d))
    );

    const nepalHubCoveragePercent = Math.min(100, Math.round((mappedDistricts.size / 77) * 100));

    // Calculate Graph Health Index (0 - 100)
    // Higher density and zero orphans boost the score
    const orphanPenalty = orphanNodes.length * 10;
    const densityBonus = Math.min(50, avgConnectionsPerNode * 15);
    const healthScore = Math.max(0, Math.min(100, Math.round(50 + densityBonus - orphanPenalty)));

    return {
      totalNodes,
      totalEdges,
      avgConnectionsPerNode,
      orphanNodesCount: orphanNodes.length,
      orphanNodes,
      mappedDistrictsCount: mappedDistricts.size,
      nepalHubCoveragePercent,
      healthScore
    };
  }

  /**
   * Automatic Entity Extraction for Article Ingestion
   * Scans text for knowledge nodes and identifies relationships
   */
  static extractEntitiesFromContent(title: string = "", content: string = "") {
    const safeTitle = (title || "").toLowerCase();
    const safeContent = (content || "").toLowerCase();
    const fullText = `${safeTitle} ${safeContent}`;
    const matchedNodes: { node: KnowledgeNode; confidence: number; matchSource: string }[] = [];

    this.nodes.forEach(node => {
      let confidence = 0;
      let matchSource = "";

      const nepName = (node.nameNepali || "").toLowerCase();
      const engName = (node.nameEnglish || "").toLowerCase();
      const district = node.district ? node.district.toLowerCase() : "";

      if ((nepName && safeTitle.includes(nepName)) || (engName && safeTitle.includes(engName))) {
        confidence += 0.9;
        matchSource = "Title match";
      } else if ((nepName && fullText.includes(nepName)) || (engName && fullText.includes(engName))) {
        confidence += 0.7;
        matchSource = "Content match";
      }

      if (district && fullText.includes(district)) {
        confidence += 0.2;
      }

      if (confidence >= 0.5) {
        matchedNodes.push({ node, confidence: Math.min(1.0, Number(confidence.toFixed(2))), matchSource });
      }
    });

    return matchedNodes.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Authority Layer Isolation Guard:
   * Ingests or promotes a Knowledge Node ONLY if backed by Tier 1 (Govt/Gazette/Official) or Tier 2 (Verified Independent Media).
   * Rejects AI generated outputs or unverified community content (Tier 3/4) from corrupting the Knowledge Graph authority layer.
   */
  static ingestVerifiedAuthorityNode(
    newNode: Omit<KnowledgeNode, "id">,
    sourceUrls: string[] = [],
    authorityTier: 1 | 2 | 3 | 4 = 2
  ): { success: boolean; node?: KnowledgeNode; message: string } {
    // Authority Isolation Hard Gate
    if (authorityTier > 2) {
      return {
        success: false,
        message: `AUTHORITY_REJECTED: Tier ${authorityTier} content (AI Editorial / UGC) cannot update the Knowledge Graph Authority Layer. Only Tier 1 (Govt/Official) and Tier 2 (Verified Independent Media) sources are permitted.`
      };
    }

    const validSources = (sourceUrls || []).filter(u => u && u.startsWith("http"));
    if (validSources.length === 0 && authorityTier > 1) {
      return {
        success: false,
        message: `AUTHORITY_REJECTED: No verified external source URLs provided for Knowledge Graph node ingestion.`
      };
    }

    const nodeId = newNode.nameEnglish ? newNode.nameEnglish.toLowerCase().replace(/[^a-z0-9]+/g, "-") : `node-${Date.now()}`;
    const createdNode: KnowledgeNode = {
      ...newNode,
      id: nodeId,
      authorityTier,
      origin: "verified_ai",
      verificationStatus: "verified",
      verificationEvidence: validSources
    };

    const existingIndex = this.nodes.findIndex(n => n.id === nodeId || n.nameNepali === newNode.nameNepali);
    if (existingIndex >= 0) {
      // Upgrade existing node if new tier is equal or higher authority
      if (Number(this.nodes[existingIndex].authorityTier || 3) >= authorityTier) {
        this.nodes[existingIndex] = {
          ...this.nodes[existingIndex],
          ...createdNode,
          authorityTier
        };
      }
    } else {
      this.nodes.push(createdNode);
    }

    return {
      success: true,
      node: createdNode,
      message: `Node '${createdNode.nameNepali}' successfully ingested into Knowledge Graph Authority Layer (Tier ${authorityTier}).`
    };
  }

  /**
   * Returns graph nodes filtered strictly by minimum required authority tier
   */
  static getAuthorityNodes(maxTier: 1 | 2 | 3 = 2): KnowledgeNode[] {
    return this.nodes.filter(n => Number(n.authorityTier || (n.origin === "human" ? 1 : 2)) <= maxTier);
  }

  /**
   * Returns all knowledge edges in memory or seeded
   */
  static getEdges(): KnowledgeEdge[] {
    return this.edges;
  }

  /**
   * Automatically replaces first occurrence of detected knowledge entities in article HTML
   * with a high-contrast, clickable entity pill linking to the Knowledge Hub
   */
  static autoLinkEntitiesInHtml(htmlContent: string): { linkedHtml: string; detectedNodes: KnowledgeNode[] } {
    if (!htmlContent) return { linkedHtml: "", detectedNodes: [] };

    let linkedHtml = htmlContent;
    const detectedNodes: KnowledgeNode[] = [];
    const replacedIds = new Set<string>();

    // Sort by name length descending so specific terms like 'श्री पशुपतिनाथ मन्दिर' match before generic 'मन्दिर'
    const sortedNodes = [...this.nodes].sort((a, b) => (b.nameNepali?.length || 0) - (a.nameNepali?.length || 0));

    for (const node of sortedNodes) {
      if (!node.nameNepali || node.nameNepali.length < 3 || replacedIds.has(node.id)) continue;
      
      const term = node.nameNepali;
      // Ensure we don't replace inside HTML tags or existing links
      const regex = new RegExp(`(?<!<[^>]*)${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![^<]*>)`, 'g');
      
      if (regex.test(linkedHtml)) {
        let replaced = false;
        linkedHtml = linkedHtml.replace(regex, (match) => {
          if (!replaced) {
            replaced = true;
            detectedNodes.push(node);
            replacedIds.add(node.id);
            return `<a href="/knowledge?node=${node.id}" class="inline-flex items-center gap-1 font-semibold text-primary hover:underline bg-primary/10 px-1.5 py-0.5 rounded text-sm transition-colors" title="${node.nameNepali} (${node.category})">${match}</a>`;
          }
          return match;
        });
      }
    }

    return { linkedHtml, detectedNodes };
  }
}
