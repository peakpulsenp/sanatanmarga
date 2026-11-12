import { Article } from "../types";

export interface TempleInfo {
  name: string;
  desc: string;
  image?: string;
  heritageStatus?: string;
}

export interface FestivalInfo {
  name: string;
  date: string;
  desc: string;
}

export interface TourismHighlight {
  title: string;
  desc: string;
  tag: string;
  image?: string;
}

export interface LocalBusiness {
  name: string;
  type: string;
  rating: string;
  contact?: string;
}

export interface RelatedKnowledgeNodeLink {
  id: string;
  name: string;
  type: "temple" | "scripture" | "festival" | "figure" | "heritage" | "organization" | "geography" | "history";
}

export interface DistrictProfile {
  id: string; // slug e.g. "mustang"
  nameNepali: string;
  nameEnglish: string;
  province: string;
  provinceId: number;
  population: string;
  altitude: string;
  headquarters: string;
  heroImage: string;
  updatedAt: string;
  readCount: number;
  isTrending?: boolean;
  isFeatured?: boolean;
  overview: string;
  history: string;
  majorTemples: TempleInfo[];
  festivals: FestivalInfo[];
  tourismHighlights: TourismHighlight[];
  localBusinesses: LocalBusiness[];
  relatedKnowledgeNodes: RelatedKnowledgeNodeLink[];
  latestStoriesCount?: number;
}

export const FEATURED_DISTRICT_PROFILES: DistrictProfile[] = [
  {
    id: "mustang",
    nameNepali: "मुस्ताङ",
    nameEnglish: "Mustang",
    province: "गण्डकी प्रदेश",
    provinceId: 4,
    population: "१४,४५२",
    altitude: "२,८००m - ३,८००m",
    headquarters: "जोमसोम (Jomsom)",
    heroImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop",
    updatedAt: "२०८२ फागुन १२",
    readCount: 42800,
    isTrending: true,
    isFeatured: true,
    latestStoriesCount: 18,
    overview: "हिमालयपारिको रहस्यमयी भूमि मुस्ताङ, जहाँ प्राचीन लो संस्कृति, मुक्तिनाथ मन्दिर, नीलगिरि हिमशृङ्खला र तिब्बती सीमावर्ती सभ्यताको अद्भुत संगम पाइन्छ।",
    history: "ऐतिहासिक लो साम्राज्य (Kingdom of Lo) को रूपमा प्रसिद्ध मुस्ताङ १४ औँ शताब्दीमा राजा आमे पालद्वारा स्थापित भएको मानिन्छ। कागबेनी, लोमान्थाङका गुफाहरू र बौद्ध गुम्बाहरूले यहाँको सहस्राब्दी पुरानो इतिहास बोकेका छन्।",
    majorTemples: [
      { name: "मुक्तिनाथ मन्दिर", desc: "१०८ धारा तथा ज्वालामाई ज्योति, जहाँ वैष्णव र बौद्ध धर्मावलम्बीहरू समान भक्तिभावले पूजा गर्छन्।", heritageStatus: "पवित्र तीर्थस्थल" },
      { name: "लोमान्थाङ थुपचेन गुम्बा", desc: "१५ औँ शताब्दीमा निर्मित विशाल शाक्यकालीन बौद्ध गुम्बा र प्राचीन भित्तेचित्र।", heritageStatus: "सांस्कृतिक सम्पदा" },
      { name: "कागबेनी मन्दिर", desc: "कालीगण्डकी र पिण्ड खोलाको संगमस्थल, जहाँ श्राद्ध तथा पितृ तर्पण गरिन्छ।" }
    ],
    festivals: [
      { name: "तिजी पर्व (Tiji Festival)", date: "जेठ महिना (३ दिने)", desc: "लोमान्थाङमा दैत्यमाथि धर्मको विजयको रूपमा मनाइने मुखौटा नृत्य पर्व।" },
      { name: "यार्तुङ पर्व (Yartung)", date: "भदौ महिना", desc: "बाली भित्र्याएपछि घोडादौड प्रतियोगिता र खुसीयाली साटासाट गर्ने पर्व।" }
    ],
    tourismHighlights: [
      { title: "लोमान्थाङ पर्खाल सहर", desc: "विश्वको दुर्लभ माटोको पर्खालभित्र घेरिएको ऐतिहासिक शाही दरबार सहर।", tag: "इतिहास" },
      { title: "कालीगण्डकी खोंच र शालिग्राम", desc: "संसारको सबैभन्दा गहिरो खोंच र भगवान् विष्णुको साक्षात रूप शालिग्राम शिला।", tag: "प्रकृति र धर्म" },
      { title: "मरङ्का गुफाहरू (Sky Caves)", desc: "पहाडको भीरमा खोपिएका १०,००० भन्दा बढी रहस्यमय मानव निर्मित गुफाहरू।", tag: "पुरातत्त्व" }
    ],
    localBusinesses: [
      { name: "जोमसोम एप्पल फार्म & रक्सी उद्योग", type: "कृषि उत्पाद", rating: "४.८ ★" },
      { name: "लोमान्थाङ हेरिटेज रिसोर्ट", type: "आतिथ्य सेवा", rating: "४.९ ★" },
      { name: "कागबेनी याक चाम होटल", type: "स्थानीय परिकार", rating: "४.७ ★" }
    ],
    relatedKnowledgeNodes: [
      { id: "muktinath", name: "मुक्तिनाथ क्षेत्र", type: "temple" },
      { id: "saligram", name: "शालिग्राम शिला दर्शन", type: "scripture" },
      { id: "lo-manthang", name: "लोमान्थाङ साम्राज्य", type: "history" }
    ]
  },
  {
    id: "kathmandu",
    nameNepali: "काठमाडौँ",
    nameEnglish: "Kathmandu",
    province: "बागमती प्रदेश",
    provinceId: 3,
    population: "२०,४१,५८७",
    altitude: "१,४००m",
    headquarters: "काठमाडौँ महानगरपालिका",
    heroImage: "https://images.unsplash.com/photo-1609137144869-37367123d57f?q=80&w=1200&auto=format&fit=crop",
    updatedAt: "२०८२ फागुन १२",
    readCount: 128500,
    isTrending: true,
    isFeatured: true,
    latestStoriesCount: 142,
    overview: "नेपालको राजधानी, मन्दिरै मन्दिरको सहर र युनेस्को विश्व सम्पदा सूचीकृत काठमाडौँ उपत्यकाको मुटु, जहाँ काष्ठमण्डप, पशुपतिनाथ र वसन्तपुर दरबार स्क्वायर अवस्थित छ।",
    history: "लिच्छवि, मल्ल र शाह राजाकालीन काठमाडौँ नेवार सांस्कृतिक कला, काष्ठकला, धातुकला र गुठी परम्पराको महान् संगम हो। अशुंवर्मा, गुणकामदेव र पृथ्वीनारायण शाहको इतिहास यससँग गाँसिएको छ।",
    majorTemples: [
      { name: "पशुपतिनाथ मन्दिर", desc: "विश्वभरका सनातन धर्मावलम्बीहरूको सर्वोच्च आस्थाको केन्द्र र ज्योतिर्लिङ्ग।", heritageStatus: "युनेस्को सम्पदा" },
      { name: "स्वयम्भूनाथ स्तूप", desc: "काठमाडौँ उपत्यकाको प्रागैतिहासिक जग र बौद्ध-सनातन सहअस्तित्वको प्रतीक।", heritageStatus: "युनेस्को सम्पदा" },
      { name: "गुह्येश्वरी शक्तिपीठ", desc: "५१ शक्तिपीठमध्ये एक प्रमुख महाशक्तिपीठ।" }
    ],
    festivals: [
      { name: "इन्द्रजात्रा (येँयाः)", date: "भदौ/असोज", desc: "जीवन्त देवी कुमारी रथयात्रा र लाखे नृत्यको भव्य पर्व।" },
      { name: "महाशिवरात्रि", date: "फागुन कृष्ण चतुर्दशी", desc: "पशुपति क्षेत्रमा लाखौँ श्रद्धालुको उपस्थितिमा मनाइने महामहोत्सव।" }
    ],
    tourismHighlights: [
      { title: "वसन्तपुर दरबार स्क्वायर", desc: "मल्लकालीन कलाकृति, कुमारी घर र काष्ठमण्डप।", tag: "सम्पदा" },
      { title: "बूढानीलकण्ठ नारायण", desc: "पानीमा तैरिरहेको एकै शिलाबाट खोपिएको विशाल विष्णु मूर्ति।", tag: "मन्दिर" },
      { title: "शिवपुरी नागार्जुन राष्ट्रिय निकुञ्ज", desc: "काठमाडौँको हरियाली, पदयात्रा र बागमती उद्गमस्थल (वाग्द्वार)।", tag: "प्रकृति" }
    ],
    localBusinesses: [
      { name: "ठमेल हस्तकला तथा पश्मिना हाउस", type: "सांस्कृतिक व्यापार", rating: "४.९ ★" },
      { name: "असन मसला & जडीबुटी बजार", type: "परम्परागत बजार", rating: "४.८ ★" }
    ],
    relatedKnowledgeNodes: [
      { id: "pashupatinath", name: "पशुपतिनाथ", type: "temple" },
      { id: "licchavi-era", name: "लिच्छवि काल", type: "history" },
      { id: "swayambhunath", name: "स्वयम्भूनाथ", type: "temple" }
    ]
  },
  {
    id: "pokhara",
    nameNepali: "पोखरा (कास्की)",
    nameEnglish: "Pokhara (Kaski)",
    province: "गण्डकी प्रदेश",
    provinceId: 4,
    population: "५,१८,५३५",
    altitude: "८२७m",
    headquarters: "पोखरा महानगरपालिका",
    heroImage: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=1200&auto=format&fit=crop",
    updatedAt: "२०८२ फागुन ११",
    readCount: 94200,
    isTrending: true,
    isFeatured: true,
    latestStoriesCount: 65,
    overview: "नेपालको पर्यटकीय राजधानी पोखरा, फेवाताल, अन्नपूर्ण तथा माछापुच्छ्रे हिमशृङ्खलाको काखमा अवस्थित प्राकृतिक एवं धार्मिक स्वर्ग।",
    history: "शाहवंशीय राजा र २४ से राज्यकालदेखि नै पोखरा व्यापारिक मार्ग र कास्कीकोट राज्यको भाग रहँदै आएको छ। विन्ध्यवासिनी र तालबाराही मन्दिर यसका सांस्कृतिक स्तम्भ हुन्।",
    majorTemples: [
      { name: "तालबाराही मन्दिर", desc: "फेवातालको बीच टापुमा स्थित प्रसिद्ध भगवती मन्दिर।" },
      { name: "विन्ध्यवासिनी मन्दिर", desc: "पोखरा सहरको अग्लो टाकुरामा स्थापित शक्तिपीठ।" },
      { name: "पुम्डीकोट विशाल महादेव", desc: "५१ फिट अग्लो विशाल शिव मूर्ति र अन्नपूर्ण भ्युपोइन्ट।" }
    ],
    festivals: [
      { name: "फेवा महोत्सव & नव वर्ष", date: "बैशाख १", desc: "लेकसाइडमा आयोजना हुने फुड, म्युजिक र सांस्कृतिक झाँकी।" },
      { name: "विन्ध्यवासिनी नवदुर्गा पूजा", date: "बडादसैँ", desc: "विशेष पूजा र नौ दिनसम्म चल्ने धार्मिक अनुष्ठान।" }
    ],
    tourismHighlights: [
      { title: "फेवाताल र बेगनासताल", desc: "डुङ्गा सयर र माछापुच्छ्रेको दोहोरो छाया दर्शन।", tag: "प्रकृति" },
      { title: "सारङ्कोट सुर्योदय", desc: "अन्नपूर्ण हिमशृङ्खला र प्याराग्लाइडिङको अन्तर्राष्ट्रिय केन्द्र।", tag: "साहस" }
    ],
    localBusinesses: [
      { name: "लेकसाइड अर्गानिक क्याफे & बेकरी", type: "पर्यटन सेवा", rating: "४.९ ★" },
      { name: "माछापुच्छ्रे प्याराग्लाइडिङ क्लब", type: "साहसिक पर्यटन", rating: "४.८ ★" }
    ],
    relatedKnowledgeNodes: [
      { id: "annapurna-circuit", name: "अन्नपूर्ण पदमार्ग", type: "geography" },
      { id: "bindhyabasini", name: "विन्ध्यवासिनी पीठ", type: "temple" }
    ]
  },
  {
    id: "janakpur",
    nameNepali: "जनकपुर (धनुषा)",
    nameEnglish: "Janakpur (Dhanusha)",
    province: "मधेस प्रदेश",
    provinceId: 2,
    population: "७,६५,३४०",
    altitude: "७४m",
    headquarters: "जनकपुरधाम",
    heroImage: "https://images.unsplash.com/photo-1590001155093-a3c68ab0ac67?q=80&w=1200&auto=format&fit=crop",
    updatedAt: "२०८२ फागुन १०",
    readCount: 88100,
    isTrending: true,
    isFeatured: true,
    latestStoriesCount: 52,
    overview: "त्रेतायुगीन मिथिला राज्यको राजधानी जनकपुरधाम, माता सीताको जन्मस्थान, राजा जनकको ज्ञानभूमि र भव्य जानकी मन्दिरको सहर।",
    history: "रामायणकालीन इतिहास बोकेको जनकपुरधाम वैदिक दर्शन, अष्टावक्र-जनक संवाद र मिथिला चित्रकलाको उद्गमस्थल हो।",
    majorTemples: [
      { name: "जानकी मन्दिर", desc: "मुगल र राजपूत वास्तुकलाको विशाल ५२ कोठडीको नौलखा मन्दिर।" },
      { name: "राम मन्दिर र विवाह मण्डप", desc: "सीता-राम विवाह सम्पन्न भएको ऐतिहासिक पवित्र प्राङ्गण।" },
      { name: "धनुषसागर र गंगासागर", desc: "प्राचीन ५२ पोखरीहरू मध्ये मुख्य पवित्र पोखरीहरू।" }
    ],
    festivals: [
      { name: "विवाह पञ्चमी", date: "मङ्सिर शुक्ल पञ्चमी", desc: "लाखौँ श्रद्धालुको उपस्थितिमा राम-सीता विवाह झाँकी र उत्सव।" },
      { name: "छठ पर्व", date: "कार्तिक शुक्ल षष्ठी", desc: "गंगासागर र धनुषसागरमा सूर्यदेवको भव्य पूजा।" }
    ],
    tourismHighlights: [
      { title: "मिथिला आर्ट इन्स्टिच्युट", desc: "विश्वप्रसिद्ध मिथिला भित्तेचित्र र हस्तकला।", tag: "संस्कृति" },
      { title: "जनकपुर-जयनगर ब्रोडगेज रेल", desc: "नेपालको एकमात्र सञ्चालित रेल सेवा।", tag: "यात्रा" }
    ],
    localBusinesses: [
      { name: "मिथिला पेन्टिङ महिला विकास केन्द्र", type: "हस्तकला", rating: "४.९ ★" },
      { name: "जनकपुर मिठाई एवं पेडा भण्डार", type: "स्थानीय परिकार", rating: "४.८ ★" }
    ],
    relatedKnowledgeNodes: [
      { id: "janaki-mandir", name: "जानकी मन्दिर", type: "temple" },
      { id: "ramayana", name: "रामायण मिथिला सन्दर्भ", type: "scripture" }
    ]
  },
  {
    id: "ilam",
    nameNepali: "इलाम",
    nameEnglish: "Ilam",
    province: "कोशी प्रदेश",
    provinceId: 1,
    population: "२,९०,२५४",
    altitude: "१,४०५m",
    headquarters: "इलाम बजार",
    heroImage: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1200&auto=format&fit=crop",
    updatedAt: "२०८२ फागुन ०९",
    readCount: 56300,
    isTrending: true,
    latestStoriesCount: 38,
    overview: "हरियाली चिया बगान, ६ 'अ' (अदुवा, अलेँंची, अम्लिसो, ओलन, अकबरे, ओखर) को खानी र कन्यामको मनोरम दृश्यका लागि प्रसिद्ध पूर्वी पहाडको गहना।",
    history: "सुगौली सन्धि अघिदेखि नै पूर्वी सीमाना रक्षा र लेप्चा तथा किराँती सांस्कृतिक परम्पराको ऐतिहासिक केन्द्र।",
    majorTemples: [
      { name: "माईपोखरी", desc: "९ वटा कुना भएको धार्मिक तथा जैविक विविधतायुक्त पवित्र पोखरी (रामसार क्षेत्र)।" },
      { name: "गजुरमुखी देवी", desc: "वाकसिद्धि दिने जनविश्वास रहेको प्रसिद्ध शक्तिपीठ।" }
    ],
    festivals: [
      { name: "माईपोखरी मेला", date: "कार्तिक एकादशी", desc: "धार्मिक स्नान, पूजा र मेला।" }
    ],
    tourismHighlights: [
      { title: "कन्याम चिया बगान", desc: "चियाको थुम्का र कञ्चनजङ्घाको मनमोहक दृश्यावलोकन।", tag: "प्रकृति" },
      { title: "श्रीअन्तु सूर्योदय", desc: "नेपालमा सबैभन्दा पहिले सूर्योदय देखिने टाकुरा।", tag: "दृश्यावलोकन" }
    ],
    localBusinesses: [
      { name: "कन्याम चिया प्रशोधन उद्योग", type: "अर्गानिक चिया", rating: "४.९ ★" },
      { name: "इलाम चीज तथा ललीपप उद्योग", type: "दुग्धजन्य उत्पाद", rating: "४.८ ★" }
    ],
    relatedKnowledgeNodes: [
      { id: "maipokhari", name: "माईपोखरी रामसार", type: "geography" },
      { id: "kirat-mundhum", name: "मुन्धुम संस्कृति", type: "scripture" }
    ]
  },
  {
    id: "lumbini",
    nameNepali: "लुम्बिनी (रुपन्देही)",
    nameEnglish: "Lumbini (Rupandehi)",
    province: "लुम्बिनी प्रदेश",
    provinceId: 5,
    population: "११,२१,९५७",
    altitude: "११०m",
    headquarters: "भैरहवा (सिद्धार्थनगर)",
    heroImage: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=1200&auto=format&fit=crop",
    updatedAt: "२०८२ फागुन १२",
    readCount: 110400,
    isTrending: true,
    isFeatured: true,
    latestStoriesCount: 78,
    overview: "भगवान् बुद्धको पावन जन्मस्थल, विश्व शान्तिको मुहान र युनेस्को विश्व सम्पदा सूचीकृत लुम्बिनी, जहाँ मायादेवी मन्दिर र अशोक स्तम्भ अवस्थित छ।",
    history: "ईशापूर्व ६०४ मा शाक्यमुनि बुद्धको जन्म भएको पवित्र उद्यान। सम्राट अशोकद्वारा सन् ई.पू. २४९ मा स्थापित अशोक स्तम्भले यसको ऐतिहासिकता प्रमाणित गर्दछ।",
    majorTemples: [
      { name: "मायादेवी मन्दिर", desc: "भगवान् बुद्धको जन्म स्मारक शिला र पवित्र पुष्करिणी पोखरी।" },
      { name: "अशोक स्तम्भ", desc: "ब्राह्मी लिपिमा 'हिद बुधे जाते शाक्यमुनीति' लेखिएको प्राचीन शिलालेख स्तम्भ।" }
    ],
    festivals: [
      { name: "बुद्ध जयन्ती", date: "वैशाख पूर्णिमा", desc: "अन्तर्राष्ट्रिय बौद्ध सम्मेलन र दीप प्रज्ज्वलन।" }
    ],
    tourismHighlights: [
      { title: "अन्तर्राष्ट्रिय गुम्बा क्षेत्र", desc: "विश्वका २५ भन्दा बढी राष्ट्रका कलात्मक बौद्ध विहारहरू।", tag: "वास्तुकला" },
      { title: "गौतम बुद्ध अन्तर्राष्ट्रिय विमानस्थल", desc: "दक्षिण एसियाको नयाँ हवाई प्रवेशद्वार।", tag: "पूर्वाधार" }
    ],
    localBusinesses: [
      { name: "लुम्बिनी पिस प्यालेस रिसोर्ट", type: "आतिथ्य सेवा", rating: "४.८ ★" }
    ],
    relatedKnowledgeNodes: [
      { id: "lumbini", name: "लुम्बिनी पावन उद्यान", type: "heritage" },
      { id: "buddha-dharma", name: "धम्मपद र बौद्ध दर्शन", type: "scripture" }
    ]
  }
];

export function getDistrictProfile(districtNameOrSlug?: string): DistrictProfile {
  if (!districtNameOrSlug) return FEATURED_DISTRICT_PROFILES[0];
  const query = districtNameOrSlug.toLowerCase().trim();

  const found = FEATURED_DISTRICT_PROFILES.find(
    d => d.id.toLowerCase() === query ||
         d.nameNepali.toLowerCase() === query ||
         d.nameEnglish.toLowerCase() === query ||
         d.nameNepali.includes(query) ||
         d.nameEnglish.toLowerCase().includes(query)
  );

  if (found) return found;

  // Fallback dynamic profile construction for any of the 77 districts
  const formattedTitle = districtNameOrSlug.charAt(0).toUpperCase() + districtNameOrSlug.slice(1);
  return {
    id: query,
    nameNepali: formattedTitle,
    nameEnglish: formattedTitle,
    province: "नेपाल",
    provinceId: 3,
    population: "१,५०,०००+",
    altitude: "१,२००m",
    headquarters: `${formattedTitle} बजार`,
    heroImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop",
    updatedAt: "हालै अद्यावधिक",
    readCount: 12500,
    latestStoriesCount: 12,
    overview: `${formattedTitle} जिल्लाको स्थानीय संस्कृति, ऐतिहासिक धरोहर, धार्मिक स्थलहरू र ताजा समाचारहरू।`,
    history: `${formattedTitle} जिल्लाको ऐतिहासिक पृष्ठभूमि, स्थानीय संस्कृति र पहिचान।`,
    majorTemples: [
      { name: `${formattedTitle} प्रसिद्ध मन्दिर`, desc: "स्थानीय आस्था र पूजाअर्चनाको मुख्य केन्द्र।" }
    ],
    festivals: [
      { name: "स्थानीय पर्व एवं मेला", date: "वर्षभरि", desc: "परम्परागत झाँकी र सांस्कृतिक उत्सव।" }
    ],
    tourismHighlights: [
      { title: `${formattedTitle} प्राकृतिक दृश्यावलोकन`, desc: "स्थानीय पदयात्रा र सुन्दर प्रकृति।", tag: "प्रकृति" }
    ],
    localBusinesses: [
      { name: `${formattedTitle} लोकल प्रडक्ट्स`, type: "व्यापार", rating: "४.५ ★" }
    ],
    relatedKnowledgeNodes: [
      { id: "nepal-heritage", name: "नेपाल सांस्कृतिक सम्पदा", type: "heritage" }
    ]
  };
}
