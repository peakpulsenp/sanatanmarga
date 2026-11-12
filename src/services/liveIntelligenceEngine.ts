import { db } from "../lib/firebase";
import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, limit } from "@/src/lib/firebase";

export interface IntelligenceFeedItem {
  id: string;
  category: "forex" | "metal" | "weather" | "festival" | "notice" | "market";
  title: string;
  description: string;
  province: string;
  district: string;
  municipality?: string;
  source: string;
  timestamp: string;
  importance: "high" | "normal" | "urgent";
  metadata?: Record<string, any>;
}

export const defaultIntelligenceFeed: IntelligenceFeedItem[] = [
  {
    id: "intel-1",
    category: "festival",
    title: "नागपञ्चमी पर्व भोलि: नाग देवताको पूजा तथा ढोकामा नागको चित्र टाँस्ने विधि",
    description: "साउन शुक्ल पञ्चमीका दिन नाग देवताको पूजा आराधना गरि घरको ढोकामा नागको चित्र टाँस्ने परम्परा अनुसार सम्पूर्ण तयारी पूरा भएको छ।",
    province: "बागमती प्रदेश",
    district: "काठमाडौँ",
    municipality: "काठमाडौँ महानगरपालिका",
    source: "पशुपति क्षेत्र विकास कोष / नेपाल पञ्चाङ्ग निर्णायक समिति",
    timestamp: new Date().toISOString(),
    importance: "high",
    metadata: { daysLeft: 1, entityId: "nag-panchami" }
  },
  {
    id: "intel-2",
    category: "forex",
    title: "नेपाल राष्ट्र बैंक विनिमय दर: अमेरिकी डलर १३५.२०",
    description: "आजको विदेशी मुद्रा विनिमय दर अनुसार अमेरिकी डलर १ को खरिददर १३५.२० र बिक्रीदर १३५.८० कायम भएको छ।",
    province: "बागमती प्रदेश",
    district: "काठमाडौँ",
    municipality: "काठमाडौँ महानगरपालिका",
    source: "नेपाल राष्ट्र बैंक",
    timestamp: new Date().toISOString(),
    importance: "normal",
    metadata: { usdBuy: 135.20, usdSell: 135.80 }
  },
  {
    id: "intel-3",
    category: "metal",
    title: "सुनको मूल्यमा वृद्धि: छापावाल सुन प्रति तोला रु १,५४,२००",
    description: "नेपाल सुनचाँदी व्यवसायी महासङ्घका अनुसार आज छापावाल सुनको मूल्य प्रतितोला रु ४०० ले बढेर रु १,५४,२०० पुगेको छ।",
    province: "बागमती प्रदेश",
    district: "काठमाडौँ",
    municipality: "काठमाडौँ महानगरपालिका",
    source: "नेपाल सुनचाँदी व्यवसायी महासङ्घ",
    timestamp: new Date().toISOString(),
    importance: "normal",
    metadata: { goldFine: 154200, silver: 1840 }
  },
  {
    id: "intel-4",
    category: "notice",
    title: "पोखरा महानगरपालिका: फेवाताल संरक्षण तथा किनार फुटट्र्याक सौन्दर्यीकरणसम्बन्धी सार्वजनिक सूचना",
    description: "फेवातालको मापदण्ड क्षेत्रभित्रका संरचना व्यवस्थापन र ताल किनारलाई व्यवस्थित बनाउने योजना अन्तर्गत सम्बन्धित सबैमा अनुरोध गरिएको छ।",
    province: "गण्डकी प्रदेश",
    district: "पोखरा",
    municipality: "पोखरा महानगरपालिका",
    source: "पोखरा महानगरपालिका कार्यालय",
    timestamp: new Date().toISOString(),
    importance: "urgent",
    metadata: { noticeType: "municipal" }
  },
  {
    id: "intel-5",
    category: "weather",
    title: "बागमती र गण्डकी प्रदेशका केही स्थानमा हल्कादेखि मध्यम वर्षाको सम्भावना",
    description: "मौसम पूर्वानुमान महाशाखाका अनुसार आज दिउँसो देशका पहाडी भू-भागका केही स्थानहरूमा मेघगर्जन र चट्याङसहित हल्का वर्षाको सम्भावना छ।",
    province: "बागमती प्रदेश",
    district: "काठमाडौँ",
    municipality: "काठमाडौँ महानगरपालिका",
    source: "जल तथा मौसम विज्ञान विभाग",
    timestamp: new Date().toISOString(),
    importance: "normal",
    metadata: { temp: "26°C", condition: "आंशिक बदली" }
  }
];

export async function fetchLiveIntelligenceFeed(): Promise<IntelligenceFeedItem[]> {
  try {
    if (!db) return defaultIntelligenceFeed;
    const ref = collection(db, "nepalHubIntelligence");
    const q = query(ref, orderBy("timestamp", "desc"), limit(20));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Seed initial intelligence items
      for (const item of defaultIntelligenceFeed) {
        await setDoc(doc(db, "nepalHubIntelligence", item.id), item);
      }
      return defaultIntelligenceFeed;
    }

    const items: IntelligenceFeedItem[] = [];
    snapshot.forEach(docSnap => {
      items.push(docSnap.data() as IntelligenceFeedItem);
    });
    return items;
  } catch (error) {
    console.warn("Failed to fetch live intelligence feed from Firestore, using default:", error);
    return defaultIntelligenceFeed;
  }
}

export async function triggerLiveIntelligencePipeline() {
  // Simulated Automated Intelligence Pipeline:
  // NRB Forex + Weather + Calendar + RSS + Federation Feeds -> Normalization -> Classification -> Feed
  const timestamp = new Date().toISOString();
  const newItems: IntelligenceFeedItem[] = [
    {
      id: `intel-auto-${Date.now()}-1`,
      category: "notice",
      title: "जनस्वास्थ्य आपतकालीन सूचना: वर्षायाममा पानीजन्य रोगबाट बच्न सतर्कता अपनाउन अनुरोध",
      description: "स्वास्थ्य तथा जनसङ्ख्या मन्त्रालयद्वारा जारी विशेष बुलेटिनमा खानेपानी उमालेर मात्र पिउन र सरसफाइमा विशेष ध्यान दिन आग्रह गरिएको छ।",
      province: "बागमती प्रदेश",
      district: "काठमाडौँ",
      municipality: "काठमाडौँ महानगरपालिका",
      source: "स्वास्थ्य तथा जनसङ्ख्या मन्त्रालय (Federated Feed)",
      timestamp,
      importance: "urgent"
    },
    {
      id: `intel-auto-${Date.now()}-2`,
      category: "market",
      title: "NEPSE सूचकांकमा १८.४५ अंकको वृद्धि, कुल कारोबार ७.२४ अर्ब",
      description: "शेयर बजारमा आज बैंकिङ र जलविद्युत समूहमा देखिएको खरीद चापका कारण NEPSE परिसूचक २,७५८.४० विन्दुमा पुगेको छ।",
      province: "बागमती प्रदेश",
      district: "काठमाडौँ",
      municipality: "काठमाडौँ महानगरपालिका",
      source: "नेपाल स्टक एक्सचेन्ज (NEPSE Live Engine)",
      timestamp,
      importance: "normal"
    }
  ];

  if (db) {
    for (const item of newItems) {
      await setDoc(doc(db, "nepalHubIntelligence", item.id), item);
    }
  }

  return newItems;
}
