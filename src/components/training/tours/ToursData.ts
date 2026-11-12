export interface TourStep {
  id: string;
  title: string;
  titleNepali: string;
  targetRoute: string;
  targetSelectorHint: string;
  elementName: string;
  elementNameNepali: string;
  description: string;
  descriptionNepali: string;
  proTip: string;
  proTipNepali: string;
  mockupType: "reader_view" | "journalist_editor" | "ai_newsroom_gate" | "sgis_ocr" | "mediaos_player" | "revenue_inventory" | "governance_audit" | "admin_telemetry";
  highlightCoordinates: { x: number; y: number; width: number; height: number }; // percentage based
}

export interface ProductTour {
  id: string;
  slug: string;
  title: string;
  titleNepali: string;
  targetRole: string;
  targetRoleNepali: string;
  estimatedMinutes: number;
  badgeColor: string;
  summary: string;
  summaryNepali: string;
  steps: TourStep[];
}

export const PRODUCT_TOURS: ProductTour[] = [
  {
    id: "tour-reader",
    slug: "first-time-reader-tour",
    title: "First-Time Reader Tour",
    titleNepali: "पहिलो पटक आएका पाठकका लागि भ्रमण",
    targetRole: "Reader / Citizen",
    targetRoleNepali: "पाठक तथा नागरिक",
    estimatedMinutes: 4,
    badgeColor: "amber",
    summary: "Master the fundamental reading, TTS audio playback, Devanagari typography, and Chautari community discourse tools.",
    summaryNepali: "वाचन, अडियो प्लेयर, देवनागरी फन्ट नियन्त्रण र चौतारी संवाद सुविधाहरू सजिलै बुझ्नुहोस्।",
    steps: [
      {
        id: "r1",
        title: "Devanagari & English Bilingual Toggle",
        titleNepali: "देवनागरी र अंग्रेजी भाषा परिवर्तन",
        targetRoute: "/",
        targetSelectorHint: "header [data-lang-toggle]",
        elementName: "Language Switcher",
        elementNameNepali: "भाषा स्विच",
        description: "Seamlessly switch between original Nepali and English translations with preserved civilizational nuances and terms.",
        descriptionNepali: "मौलिक नेपाली र अंग्रेजी अनुवाद बीच तुरुन्त परिवर्तन गर्नुहोस्।",
        proTip: "Press 'L' on your keyboard anytime to toggle language quickly.",
        proTipNepali: "भाषा परिवर्तनका लागि किबोर्डमा 'L' थिच्न सक्नुहुन्छ।",
        mockupType: "reader_view",
        highlightCoordinates: { x: 75, y: 5, width: 22, height: 10 }
      },
      {
        id: "r2",
        title: "Typography & Font Scaling Engine",
        titleNepali: "फन्ट र दृश्य आकार समायोजन",
        targetRoute: "/news",
        targetSelectorHint: ".reading-controls",
        elementName: "Dyslexia & Devanagari Sizer",
        elementNameNepali: "देवनागरी अक्षर आकार नियन्त्रक",
        description: "Adjust font size, line spacing, and contrast settings designed specifically for clear Devanagari conjunct rendering.",
        descriptionNepali: "देवनागरी अक्षरहरूको स्पष्टताका लागि अक्षरको आकार, उज्यालो र दूरी मिलाउनुहोस्।",
        proTip: "Activate the 'High-Legibility Devanagari' mode for reading long historical analyses without eye strain.",
        proTipNepali: "लामो लेखहरू पढ्दा आँखा नदुख्ने 'उच्च स्पष्टता' मोड प्रयोग गर्नुहोस्।",
        mockupType: "reader_view",
        highlightCoordinates: { x: 55, y: 15, width: 40, height: 12 }
      },
      {
        id: "r3",
        title: "24/7 Persistent Audio News Player (TTS)",
        titleNepali: "२४/७ अडियो समाचार प्लेयर",
        targetRoute: "/news",
        targetSelectorHint: ".sticky-audio-bar",
        elementName: "Audio Playback Dock",
        elementNameNepali: "अडियो प्लेयर डक",
        description: "Listen to natural Nepali text-to-speech audio for any article while continuing to browse other sections of the portal without interruption.",
        descriptionNepali: "समाचार पढ्न फुर्सद नहुँदा प्रकृतिक नेपाली आवाजमा सुन्दै अन्य पृष्ठहरू हेर्नुहोस्।",
        proTip: "The audio mini-player stays pinned at the bottom and remembers your playback position across reloads.",
        proTipNepali: "मिनी-प्लेयर तल रहनेछ र तपाईंको अडियो रोकेको ठाउँ सुरक्षित राख्नेछ।",
        mockupType: "reader_view",
        highlightCoordinates: { x: 5, y: 80, width: 90, height: 15 }
      },
      {
        id: "r4",
        title: "Chautari Civil Community Discourse",
        titleNepali: "चौतारी सामुदायिक शिष्ट संवाद",
        targetRoute: "/community",
        targetSelectorHint: ".chautari-feed",
        elementName: "Chautari Discourse Forum",
        elementNameNepali: "चौतारी संवाद थलो",
        description: "Engage in verified, spam-free discussions adhering to the Sanatan Dharma code of respectful inquiry and respectful rebuttal.",
        descriptionNepali: "सभ्य, अनुशासित र तथ्यपरक संवादमा भाग लिनुहोस्।",
        proTip: "Comments require phone or email verification to eliminate automated bot harassment.",
        proTipNepali: "नक्कली बोट रोक्न टिप्पणीका लागि प्रमाणीकरण अनिवार्य छ।",
        mockupType: "reader_view",
        highlightCoordinates: { x: 10, y: 30, width: 80, height: 45 }
      }
    ]
  },
  {
    id: "tour-journalist",
    slug: "journalist-tour",
    title: "Journalist & Field Reporter Tour",
    titleNepali: "पत्रकार तथा स्थलगत संवाददाता भ्रमण",
    targetRole: "Journalist / Field Reporter",
    targetRoleNepali: "पत्रकार तथा संवाददाता",
    estimatedMinutes: 5,
    badgeColor: "emerald",
    summary: "Learn field dispatch drafting, photographic attribution, geographical metadata tagging, and sub-72h source verification.",
    summaryNepali: "समाचार मस्यौदा, तस्बिर स्रोत प्रमाणीकरण, भौगोलिक ट्यागिङ र ७२ घण्टे स्रोत नियम बुझ्नुहोस्।",
    steps: [
      {
        id: "j1",
        title: "Field Dispatch Entry & Rich Editor",
        titleNepali: "स्थलगत समाचार प्रविष्टि",
        targetRoute: "/editor/new",
        targetSelectorHint: ".editor-title-input",
        elementName: "Dispatch Drafting Workspace",
        elementNameNepali: "मस्यौदा सम्पादन क्षेत्र",
        description: "Compose multi-lingual headlines, bylines, and body text with automatic local drafting protection.",
        descriptionNepali: "शीर्षक, उपशीर्षक र समाचार सामग्री प्रविष्ट गर्नुहोस्; इन्टरनेट काटिए पनि मस्यौदा सुरक्षित रहन्छ।",
        proTip: "Drafts auto-save to IndexedDB every 5 seconds—you will never lose a word even on spotty Himalayan 2G.",
        proTipNepali: "हरेक ५ सेकेन्डमा मस्यौदा स्वतः सुरक्षित हुन्छ।",
        mockupType: "journalist_editor",
        highlightCoordinates: { x: 15, y: 15, width: 70, height: 25 }
      },
      {
        id: "j2",
        title: "Mandatory Source Link Attribution",
        titleNepali: "अनिवार्य स्रोत लिङ्क तथा उद्धरण",
        targetRoute: "/editor/new",
        targetSelectorHint: ".source-attribution-panel",
        elementName: "Source Verification Registry",
        elementNameNepali: "स्रोत प्रमाणीकरण प्यानल",
        description: "SanatanMarga enforces 'No Source = No Story'. At least two authoritative primary source URLs or field witness affidavits are required.",
        descriptionNepali: "कम्तीमा २ वटा आधिकारिक प्राथमिक स्रोत लिङ्क अनिवार्य रूपमा समावेश गर्नुपर्दछ।",
        proTip: "Anonymous sources must be countersigned by a Senior Editor (L3+).",
        proTipNepali: "गोप्य स्रोतका लागि वरिष्ठ सम्पादकको स्वीकृति आवश्यक पर्छ।",
        mockupType: "journalist_editor",
        highlightCoordinates: { x: 15, y: 45, width: 70, height: 20 }
      },
      {
        id: "j3",
        title: "Submitting to Editorial Desk (Four-Eyes Gate)",
        titleNepali: "सम्पादकीय डेस्कमा पेश गर्ने प्रक्रिया",
        targetRoute: "/editor/queue",
        targetSelectorHint: ".submit-for-review-btn",
        elementName: "Editorial Queue Dispatcher",
        elementNameNepali: "सम्पादन डेस्क पठाइ",
        description: "Once submitted, the article enters the pre-publication queue for automated fact-checking and human editor review.",
        descriptionNepali: "पेश गरेपछि समाचार एआई तथ्य जाँच र मानव सम्पादकको समीक्षामा जान्छ।",
        proTip: "Track the real-time review status badge directly from your journalist dashboard.",
        proTipNepali: "आफ्नो ड्यासबोर्डबाट समाचारको प्रगति स्थिति प्रत्यक्ष हेर्नुहोस्।",
        mockupType: "journalist_editor",
        highlightCoordinates: { x: 60, y: 70, width: 30, height: 15 }
      }
    ]
  },
  {
    id: "tour-ai-newsroom",
    slug: "ai-newsroom-tour",
    title: "AI Newsroom OS Tour",
    titleNepali: "एआई न्यूजरूम प्रणाली भ्रमण",
    targetRole: "AI Newsroom Operator / Editor",
    targetRoleNepali: "एआई न्यूजरूम सञ्चालक",
    estimatedMinutes: 6,
    badgeColor: "purple",
    summary: "Discover the 6-stage autonomous pipeline: Google Search Grounding, 72h freshness gate, fact corroboration, and fail-closed publication.",
    summaryNepali: "गुगल सर्च ग्राउन्डिङ, ७२ घण्टे ताजापन गेट, तथ्य प्रमाणीकरण र स्वचालित सुरक्षा प्रणाली बुझ्नुहोस्।",
    steps: [
      {
        id: "ai1",
        title: "Google Search Grounding Ingestion",
        titleNepali: "गुगल सर्च ग्राउन्डिङ संकलन",
        targetRoute: "/ai-newsroom",
        targetSelectorHint: ".grounding-query-panel",
        elementName: "Search Grounding Pipeline",
        elementNameNepali: "ग्राउन्डिङ संकलन केन्द्र",
        description: "The AI agent ingests verified real-time events via Google Search Grounding, querying reputable news outlets and civilizational archives.",
        descriptionNepali: "एआई एजेन्टले गुगल सर्च ग्राउन्डिङ मार्फत वास्तविक समयका प्रमाणित घटना संकलन गर्दछ।",
        proTip: "Grounding queries are capped to a strict domain whitelist to prevent blog gossip contamination.",
        proTipNepali: "अप्रमाणित हल्ला रोक्न केवल मान्यताप्राप्त स्रोत मात्र स्वीकार गरिन्छ।",
        mockupType: "ai_newsroom_gate",
        highlightCoordinates: { x: 5, y: 15, width: 35, height: 35 }
      },
      {
        id: "ai2",
        title: "The Strict 72-Hour Freshness Gate",
        titleNepali: "कडा ७२-घण्टे ताजापन सुरक्षा गेट",
        targetRoute: "/ai-newsroom",
        targetSelectorHint: ".freshness-gate-card",
        elementName: "Temporal Gate Inspector",
        elementNameNepali: "समय सीमा निरीक्षक",
        description: "Any story older than 72 hours without fresh corroboration is automatically downgraded from breaking news to historical commentary.",
        descriptionNepali: "७२ घण्टाभन्दा पुरानो समाचारलाई ताजा समाचारको रूपमा प्रकाशन हुन दिइँदैन।",
        proTip: "Freshness timestamps are cryptographically verified against HTTP Last-Modified headers.",
        proTipNepali: "समयको प्रमाणीकरण सर्भरको प्राविधिक हेडरद्वारा जाचिन्छ।",
        mockupType: "ai_newsroom_gate",
        highlightCoordinates: { x: 45, y: 15, width: 50, height: 35 }
      },
      {
        id: "ai3",
        title: "Corroboration Matrix & Fail-Closed Guard",
        titleNepali: "तथ्य पुष्टीकरण र स्वचालित अस्वीकार प्रणाली",
        targetRoute: "/ai-newsroom",
        targetSelectorHint: ".corroboration-matrix",
        elementName: "Fact Corroboration Engine",
        elementNameNepali: "तथ्य पुष्टीकरण इन्जिन",
        description: "If an incoming draft lacks independent corroboration or exhibits unverified sensationalist bias, it is terminated with zero production impact.",
        descriptionNepali: "दोहोरो स्रोत नभेटिएमा वा भ्रामक देखिएमा समाचार तुरुन्त रोकिन्छ।",
        proTip: "Fail-closed means: When in doubt, do NOT publish. Integrity always supersedes speed.",
        proTipNepali: "शंका लागेमा समाचार रोक्नु नै हाम्रो पहिलो धर्म हो।",
        mockupType: "ai_newsroom_gate",
        highlightCoordinates: { x: 10, y: 55, width: 80, height: 35 }
      }
    ]
  },
  {
    id: "tour-sgis",
    slug: "sgis-tour",
    title: "SGIS Civilizational Epigraphy Tour",
    titleNepali: "एसजिआइएस सभ्यतागत अभिलेख भ्रमण",
    targetRole: "Epigraphist / Scholar / Digitizer",
    targetRoleNepali: "अभिलेखविद् तथा अनुसन्धाता",
    estimatedMinutes: 6,
    badgeColor: "cyan",
    summary: "Explore palm-leaf manuscript preservation, Brahmi & Licchavi script OCR, RDF knowledge graph mapping, and Ask Sanatan AI grounding.",
    summaryNepali: "ताडपत्र पाण्डुलिपि संरक्षण, ब्राह्मी र लिच्छवि लिपि ओसीआर, ज्ञान ग्राफ र एआई ग्राउन्डिङ सिक्नुहोस्।",
    steps: [
      {
        id: "s1",
        title: "High-DPI Manuscript & Stone Squeeze Ingestion",
        titleNepali: "उच्च गुणस्तर पाण्डुलिपि तथा शिलापत्र अपलोड",
        targetRoute: "/sgis",
        targetSelectorHint: ".manuscript-upload-dropzone",
        elementName: "Preservation Ingestion Hub",
        elementNameNepali: "अभिलेख संकलन हब",
        description: "Upload 1200+ DPI scans of palm-leaf folios, birch-bark (bhojpatra), or 3D photogrammetric stone inscription rubbings.",
        descriptionNepali: "ताडपत्र, भोजपत्र र शिलालेखका उच्च गुणस्तरीय तस्विरहरू सुरक्षित अपलोड गर्नुहोस्।",
        proTip: "Preserves raw TIFF metadata alongside radiometric calibration data.",
        proTipNepali: "मूल तस्विरको गुणस्तर र प्राविधिक विवरण सुरक्षित राखिन्छ।",
        mockupType: "sgis_ocr",
        highlightCoordinates: { x: 5, y: 15, width: 45, height: 40 }
      },
      {
        id: "s2",
        title: "Multi-Script OCR & Line Segmentation",
        titleNepali: "बहु-लिपि ओसीआर र रेखा विभाजन",
        targetRoute: "/sgis",
        targetSelectorHint: ".ocr-segmentation-viewer",
        elementName: "Glyph Segmentation Canvas",
        elementNameNepali: "लिपि विश्लेषण क्यानभास",
        description: "The AI recognizes Sanskrit conjuncts, Brahmi strokes, and Licchavi character ligatures, segmenting degraded lines with bounding boxes.",
        descriptionNepali: "प्राचीन लिच्छवि र ब्राह्मी अक्षरहरूलाई एआईले पहिचान गरी देवनागरीमा बदल्छ।",
        proTip: "You can manually adjust bounding boxes for chipped stone letters to retrain the neural epigraphy model.",
        proTipNepali: "मेटिएका वा फुटेका अक्षरहरूलाई आफैं हातले मिलाउन सकिन्छ।",
        mockupType: "sgis_ocr",
        highlightCoordinates: { x: 52, y: 15, width: 43, height: 40 }
      },
      {
        id: "s3",
        title: "RDF Knowledge Graph & Shastric Grounding",
        titleNepali: "ज्ञान ग्राफ र शास्त्रीय सम्बन्ध",
        targetRoute: "/sgis",
        targetSelectorHint: ".knowledge-graph-viewer",
        elementName: "Civilizational Triplestore",
        elementNameNepali: "सभ्यतागत ज्ञान सञ्जाल",
        description: "Transcribed texts link directly to geographical shrines, ruling monarchs, Saka era dates, and foundational Vedic commentaries.",
        descriptionNepali: "अभिलेखका शब्दहरूलाई मन्दिर, राजाहरू, संवत् र ग्रन्थहरूसँग जोडिन्छ।",
        proTip: "Every node in the graph feeds the 'Ask Sanatan' conversational AI for infallible, cited answers.",
        proTipNepali: "यसबाट 'आस्क सनातन' एआईले प्रमाणित उत्तर दिन सक्छ।",
        mockupType: "sgis_ocr",
        highlightCoordinates: { x: 10, y: 60, width: 80, height: 35 }
      }
    ]
  },
  {
    id: "tour-mediaos",
    slug: "mediaos-tour",
    title: "MediaOS & 24/7 Radio Broadcasting Tour",
    titleNepali: "मिडिया प्रणाली र रेडियो प्रसारण भ्रमण",
    targetRole: "Broadcast Engineer / Audio Producer",
    targetRoleNepali: "रेडियो प्राविधिक तथा अडियो निर्माता",
    estimatedMinutes: 5,
    badgeColor: "rose",
    summary: "Learn continuous HLS stream management, temple relays, live program scheduling, and the persistent non-stop mini-player.",
    summaryNepali: "निरन्तर २४/७ अडियो स्ट्रिमिङ, मन्दिर प्रत्यक्ष प्रसारण र कार्यक्रम तालिका बुझ्नुहोस्।",
    steps: [
      {
        id: "m1",
        title: "24/7 Radio Live Broadcast Stream Dock",
        titleNepali: "२४/७ निरन्तर रेडियो स्ट्रिम डक",
        targetRoute: "/radio",
        targetSelectorHint: ".live-radio-hero",
        elementName: "Master Stream Switcher",
        elementNameNepali: "मुख्य प्रसारण नियन्त्रक",
        description: "Monitor the primary audio stream health, bitrate, active listeners, and automatic silent fallback backup audio.",
        descriptionNepali: "रेडियो प्रसारणको गुणस्तर, श्रोता संख्या र प्राविधिक अवस्था निगरानी गर्नुहोस्।",
        proTip: "If the live studio link drops, the automated fallback loop kicks in within 400ms without broadcast dead air.",
        proTipNepali: "इन्टरनेट काटिएमा ४०० मिलिसेकेन्डभित्र ब्याकअप भजन स्वतः बज्छ।",
        mockupType: "mediaos_player",
        highlightCoordinates: { x: 10, y: 15, width: 80, height: 35 }
      },
      {
        id: "m2",
        title: "Sacred Temple Live Video Relays",
        titleNepali: "पवित्र मन्दिर प्रत्यक्ष प्रसारण",
        targetRoute: "/media",
        targetSelectorHint: ".temple-relay-grid",
        elementName: "Temple Relay Orchestrator",
        elementNameNepali: "मन्दिर रिले व्यवस्थापक",
        description: "Manage high-definition live feeds from Pashupatinath, Muktinath, Janakpur Dham, and Mount Kailash.",
        descriptionNepali: "पशुपतिनाथ, मुक्तिनाथ, जनकपुरधामका प्रत्यक्ष दृश्यहरू व्यवस्थापन गर्नुहोस्।",
        proTip: "Feeds adapt automatically to viewers' bandwidth from 1080p down to 360p mobile stream.",
        proTipNepali: "इन्टरनेटको गति अनुसार भिडियो गुणस्तर स्वतः परिवर्तन हुन्छ।",
        mockupType: "mediaos_player",
        highlightCoordinates: { x: 10, y: 55, width: 80, height: 40 }
      }
    ]
  },
  {
    id: "tour-revenue",
    slug: "revenueos-tour",
    title: "RevenueOS & Sponsor Inventory Tour",
    titleNepali: "राजस्व तथा प्रायोजक व्यवस्थापन भ्रमण",
    targetRole: "Advertiser / Commercial Executive",
    targetRoleNepali: "विज्ञापनदाता तथा वाणिज्य प्रबन्धक",
    estimatedMinutes: 5,
    badgeColor: "amber",
    summary: "Manage ethical cultural sponsor inventory, radio audio spots, impression tracking, and transparent settlement ledgers.",
    summaryNepali: "संवेदनशील सांस्कृतिक विज्ञापन, रेडियो स्पट र पारदर्शी हिसाब-किताब बुझ्नुहोस्।",
    steps: [
      {
        id: "rv1",
        title: "Ethical Ad Placement & Clean Inventory",
        titleNepali: "मर्यादित विज्ञापन स्थान व्यवस्थापन",
        targetRoute: "/sponsor",
        targetSelectorHint: ".ad-inventory-grid",
        elementName: "Inventory Slot Matrix",
        elementNameNepali: "विज्ञापन स्लट तालिका",
        description: "Configure banner, in-feed, and audio sponsor slots with strict cultural appropriateness filters (no gambling, alcohol, or predatory loans).",
        descriptionNepali: "मर्यादित स्थानहरूमा विज्ञापन मिलाउनुहोस्; जुवा वा मदिराका विज्ञापन पूर्ण रूपमा निषेध छन्।",
        proTip: "Every creative must pass an editorial review gate before being activated in rotation.",
        proTipNepali: "विज्ञापन सक्रिय हुनु अघि सम्पादकीय स्वीकृति अनिवार्य छ।",
        mockupType: "revenue_inventory",
        highlightCoordinates: { x: 10, y: 15, width: 80, height: 35 }
      },
      {
        id: "rv2",
        title: "Real-Time Verified Impression Analytics",
        titleNepali: "वास्तविक समयको विज्ञापन प्रभाव विश्लेषण",
        targetRoute: "/sponsor",
        targetSelectorHint: ".impression-telemetry-chart",
        elementName: "Ad Telemetry Ledger",
        elementNameNepali: "विज्ञापन प्रभाव विवरण",
        description: "Track genuine human impressions and clicks verified against bot fraud algorithms.",
        descriptionNepali: "नक्कली बोट क्लिक हटाएर वास्तविक मानिसहरूले हेरेको संख्या मात्र गणना हुन्छ।",
        proTip: "Advertisers can download cryptographically signed audit logs for financial accounting.",
        proTipNepali: "लेखापरीक्षणका लागि प्रमाणित प्रतिवेदन डाउनलोड गर्न सकिन्छ।",
        mockupType: "revenue_inventory",
        highlightCoordinates: { x: 10, y: 55, width: 80, height: 35 }
      }
    ]
  },
  {
    id: "tour-governance",
    slug: "governanceos-tour",
    title: "GovernanceOS & Four-Eyes Approval Tour",
    titleNepali: "सुशासन तथा चार-आँखे स्वीकृति भ्रमण",
    targetRole: "Truth Guardian / Ombudsman / Lead Editor",
    targetRoleNepali: "सुशासन संरक्षक तथा मुख्य सम्पादक",
    estimatedMinutes: 6,
    badgeColor: "violet",
    summary: "Master zero-trust RBAC (L1-L5), tamper-proof audit trails, correction notices, and mandatory multi-editor approval.",
    summaryNepali: "५ तहको अधिकार प्रणाली, मेटाउन नसकिने अडिट लग र अनिवार्य दुई सम्पादक स्वीकृति बुझ्नुहोस्।",
    steps: [
      {
        id: "g1",
        title: "Zero-Trust RBAC Privilege Matrix",
        titleNepali: "शून्य-विश्वास अधिकार तालिका (RBAC)",
        targetRoute: "/governance",
        targetSelectorHint: ".rbac-tier-table",
        elementName: "RBAC Role Controller",
        elementNameNepali: "अधिकार तालिका नियन्त्रक",
        description: "Inspect least-privilege roles from Reader (L1), Journalist (L2), Editor (L3), Executive Editor (L4), to SuperAdmin (L5).",
        descriptionNepali: "पाठक (L1) देखि मुख्य प्रशासक (L5) सम्मका सीमित र सुरक्षित अधिकारहरू हेर्नुहोस्।",
        proTip: "No single individual—not even the founder—can unilaterally bypass editorial standards without dual-signature signoff.",
        proTipNepali: "कसैले पनि नियम विपरीत एक्लै समाचार प्रकाशित वा मेटाउन सक्दैन।",
        mockupType: "governance_audit",
        highlightCoordinates: { x: 10, y: 15, width: 80, height: 35 }
      },
      {
        id: "g2",
        title: "Immutable Cryptographic Audit Trail",
        titleNepali: "सुरक्षित र स्थायी अडिट लग",
        targetRoute: "/governance",
        targetSelectorHint: ".audit-log-stream",
        elementName: "Audit Ledger Timeline",
        elementNameNepali: "अडिट विवरण समयरेखा",
        description: "Every editorial edit, permission change, and article retraction is hashed and logged permanently.",
        descriptionNepali: "समाचारमा गरिएको सानो संशोधन वा अधिकार परिवर्तनको विवरण कहिल्यै मेटिँदैन।",
        proTip: "Audit logs can be exported as an SHA-256 verifiable JSON bundle for press council inspections.",
        proTipNepali: "प्रेस काउन्सिल वा कानुनी प्रयोजनका लागि अडिट फाइल डाउनलोड गर्न सकिन्छ।",
        mockupType: "governance_audit",
        highlightCoordinates: { x: 10, y: 55, width: 80, height: 35 }
      }
    ]
  },
  {
    id: "tour-admin",
    slug: "admin-mission-control-tour",
    title: "Admin Mission Control & Infrastructure Tour",
    titleNepali: "प्रशासक मिसन कन्ट्रोल तथा पूर्वाधार भ्रमण",
    targetRole: "System Administrator / DevOps",
    targetRoleNepali: "प्रणाली प्रशासक तथा डेभअप्स",
    estimatedMinutes: 6,
    badgeColor: "blue",
    summary: "Command tenant federation, SnapshotOS 3-tier disaster recovery, cache purging, and telemetry observability.",
    summaryNepali: "स्न्यापसट प्रणाली, ३-तहको सुरक्षा ब्याकअप, क्यास व्यवस्थापन र प्रणाली स्वास्थ्य निगरानी बुझ्नुहोस्।",
    steps: [
      {
        id: "a1",
        title: "SnapshotOS 3-Tier Fallback Health",
        titleNepali: "स्न्यापसट ३-तह ब्याकअप स्वास्थ्य",
        targetRoute: "/admin",
        targetSelectorHint: ".snapshot-sync-widget",
        elementName: "Resilience Orchestrator",
        elementNameNepali: "सुरक्षा ब्याकअप नियन्त्रक",
        description: "Check synchronization between live Firestore, browser IndexedDB, and static CDN JSON snapshots for 100% blackout-proof delivery.",
        descriptionNepali: "इन्टरनेट अवरुद्ध वा सर्भर डाउन हुँदा पनि पाठकले समाचार पढ्न पाउने गरी ३ तहको ब्याकअप जाँच गर्नुहोस्।",
        proTip: "Force a global snapshot freeze right before running high-risk system updates.",
        proTipNepali: "प्रणाली अपडेट गर्नु अघि 'स्न्यापसट सुरक्षित' बटन थिच्नुहोस्।",
        mockupType: "admin_telemetry",
        highlightCoordinates: { x: 10, y: 15, width: 80, height: 35 }
      },
      {
        id: "a2",
        title: "Multi-Tenant Federation & Shard Status",
        titleNepali: "बहु-संस्था फेडरेशन तथा शाखा व्यवस्थापन",
        targetRoute: "/admin",
        targetSelectorHint: ".tenant-manager-card",
        elementName: "Tenant Federation Hub",
        elementNameNepali: "संस्था फेडरेशन हब",
        description: "Oversee regional diaspora portals (Nepal, USA, UK, India, Australia) sharing a unified knowledge graph and security policy.",
        descriptionNepali: "विश्वभरिका सनातन शाखाहरूको साझा ज्ञान र सुरक्षा नियमहरू एउटै ठाउँबाट हेर्नुहोस्।",
        proTip: "Tenant-specific content can be segregated while sharing global civilizational archives.",
        proTipNepali: "स्थानीय समाचार छुट्टाछुट्टै राख्दै विश्वव्यापी ज्ञान साझा गर्न सकिन्छ।",
        mockupType: "admin_telemetry",
        highlightCoordinates: { x: 10, y: 55, width: 80, height: 35 }
      }
    ]
  }
];
