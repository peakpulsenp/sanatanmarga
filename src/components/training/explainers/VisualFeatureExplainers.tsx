import React, { useState } from "react";
import { 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  ChevronRight, 
  Eye, 
  Info,
  ShieldAlert,
  Cpu,
  Scroll,
  ShoppingBag,
  GraduationCap
} from "lucide-react";

interface CalloutPoint {
  id: number;
  label: string;
  labelNepali: string;
  x: number; // percentage
  y: number; // percentage
  detail: string;
  detailNepali: string;
}

interface FeatureExplainerItem {
  id: string;
  title: string;
  titleNepali: string;
  subtitle: string;
  mockupVisualType: string;
  mockupDescription: string;
  callouts: CalloutPoint[];
  benefits: string[];
  commonMistakes: string[];
  bestPractices: string[];
}

interface FeatureCategory {
  id: string;
  name: string;
  nameNepali: string;
  icon: any;
  color: string;
  items: FeatureExplainerItem[];
}

const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    id: "ai_newsroom",
    name: "AI Newsroom OS",
    nameNepali: "एआई न्यूजरूम प्रणाली",
    icon: Cpu,
    color: "purple",
    items: [
      {
        id: "ai_draft",
        title: "Autonomous Draft Generation",
        titleNepali: "स्वचालित मस्यौदा निर्माण",
        subtitle: "Google Search Grounded Real-Time Ingestion",
        mockupVisualType: "ai_draft_canvas",
        mockupDescription: "The ingest engine evaluates trending real-time events, querying Google Search Grounding with strict entity filters.",
        callouts: [
          { id: 1, label: "Entity Extraction Filter", labelNepali: "संस्था पहिचान फिल्टर", x: 20, y: 25, detail: "Detects verifiable actors, locations, and legal bodies, discarding subjective blog speculation.", detailNepali: "प्रमाणित व्यक्ति, ठाउँ र निकाय मात्र पहिचान गर्दछ।" },
          { id: 2, label: "Temporal Timestamp Header", labelNepali: "समयसीमा हेडर", x: 75, y: 25, detail: "Ensures the original event occurred within 72 hours. Stale news older than 72h triggers an automatic fail-closed stop.", detailNepali: "७२ घण्टाभित्रको घटना मात्र स्वीकार गर्दछ।" },
          { id: 3, label: "Devanagari Bilingual Generator", labelNepali: "देवनागरी द्विभाषिक मस्यौदा", x: 50, y: 65, detail: "Generates culturally natural Nepali alongside English with preserved technical and shastric terms.", detailNepali: "शुद्ध नेपाली भाषामा मस्यौदा तयार गर्दछ।" }
        ],
        benefits: [
          "Cuts draft drafting latency from 45 minutes down to 35 seconds",
          "Eliminates subjective journalist bias by anchoring strictly to factual entities",
          "Guarantees standard Devanagari grammatical structures and spelling consistency"
        ],
        commonMistakes: [
          "Relying on social media gossip without waiting for primary wire confirmation",
          "Attempting to bypass the 72-hour freshness gate by modifying article publication dates",
          "Translating complex Sanskrit legal terms with generic Western colloquialisms"
        ],
        bestPractices: [
          "Always inspect the entity verification score before approving the AI draft",
          "Verify that named locations (district, municipality) match official Nepali geography",
          "Cross-reference live wire reports with the platform's historical knowledge graph"
        ]
      },
      {
        id: "ai_verify",
        title: "Source Verification & Grounding Engine",
        titleNepali: "स्रोत प्रमाणीकरण तथा ग्राउन्डिङ इन्जिन",
        subtitle: "Multi-Source Corroboration & Citation Registry",
        mockupVisualType: "ai_verify_canvas",
        mockupDescription: "Validates incoming citations against domain trustworthiness rankings, requiring at least two independent primary URLs.",
        callouts: [
          { id: 1, label: "Domain Trust Matrix", labelNepali: "स्रोत विश्वास्यता तालिका", x: 30, y: 20, detail: "Assigns algorithmic trust scores (0.0 to 1.0) based on historical retraction rates and editorial transparency.", detailNepali: "स्रोतको विश्वसनीयता अंक ० देखि १ सम्म निर्धारण गर्छ।" },
          { id: 2, label: "Citation Cross-Matcher", labelNepali: "उद्धरण दोहोरो परीक्षण", x: 50, y: 55, detail: "Compares quotes across multiple independent agencies to detect synthetic alterations.", detailNepali: "उद्धरणहरूलाई विभिन्न समाचार संस्थासँग तुलना गर्छ।" },
          { id: 3, label: "Fail-Closed Gate Trigger", labelNepali: "अस्वीकार सुरक्षा ट्रिगर", x: 80, y: 75, detail: "Instantly terminates the pipeline if source URLs return 404, paywalled spam, or spoofed domains.", detailNepali: "अस्पष्ट वा नक्कली स्रोत देखिए तुरुन्त रोक्छ।" }
        ],
        benefits: [
          "Zero false-attribution incidents across over 10,000 published articles",
          "Automated protection against coordinated propaganda campaigns",
          "Full link transparency directly visible to end readers via the citation drawer"
        ],
        commonMistakes: [
          "Treating an opinion editorial (Op-Ed) as a primary factual news citation",
          "Submitting recursive circular citations where Site A quotes Site B which quotes Site A",
          "Omitting the exact paragraph timestamp for video or audio interview sources"
        ],
        bestPractices: [
          "Provide direct links to government gazettes, court orders, or eyewitness field notes",
          "Ensure secondary sources are organizationally independent of the primary claimant",
          "Keep archived snapshots in the offline backup registry in case external links rot"
        ]
      },
      {
        id: "ai_factcheck",
        title: "Deep Fact Check & Bias Analysis",
        titleNepali: "गहिरो तथ्य जाँच तथा पूर्वाग्रह विश्लेषण",
        subtitle: "Zero Hallucination Validation Engine",
        mockupVisualType: "ai_factcheck_canvas",
        mockupDescription: "Runs multi-layered claim decomposition, verifying numeric figures, historical dates, and legal precedents.",
        callouts: [
          { id: 1, label: "Numerical Claim Extractor", labelNepali: "संख्यात्मक तथ्य परीक्षण", x: 25, y: 35, detail: "Verifies casualty counts, budgets, and percentages against official ministry whitepapers.", detailNepali: "बजेट र तथ्याङ्क मन्त्रालयको विवरणसँग जाँच्छ।" },
          { id: 2, label: "Civilizational Bias Detector", labelNepali: "सांस्कृतिक पूर्वाग्रह पहिचान", x: 65, y: 35, detail: "Flags anti-indigenous slurs or historically distorted narratives regarding Nepali traditions.", detailNepali: "सांस्कृतिक अपमान वा विकृति तुरुन्त चिन्हित गर्छ।" },
          { id: 3, label: "Fact Confidence Gauge", labelNepali: "तथ्य विश्वास्यता स्तर", x: 50, y: 75, detail: "Requires a minimum 92% algorithmic confidence score before enabling editor approval.", detailNepali: "कम्तीमा ९२% अंक नआएसम्म समाचार अघि बढ्दैन।" }
        ],
        benefits: [
          "Eliminates statistical misrepresentation and inflated sensationalist headlines",
          "Protects sacred heritage sites from defamatory historical inaccuracies",
          "Produces an auditable verification trail that withstands regulatory scrutiny"
        ],
        commonMistakes: [
          "Assuming high semantic fluency equals factual accuracy in AI outputs",
          "Ignoring discrepancy alerts between Gregorian calendar and Bikram Sambat dates",
          "Overlooking subtle clickbait modifications made during headline drafting"
        ],
        bestPractices: [
          "Manually audit every claim highlighted in amber (<95% confidence score)",
          "Verify Bikram Sambat (B.S.) conversion dates using the internal Panchang calendar API",
          "Require signed corroboration from local shrine trustees for heritage disputes"
        ]
      },
      {
        id: "ai_publish",
        title: "Four-Eyes Publishing Workflow",
        titleNepali: "चार-आँखे अन्तिम प्रकाशन प्रक्रिया",
        subtitle: "Strict Multi-Editor Signoff & Real-Time Push",
        mockupVisualType: "ai_publish_canvas",
        mockupDescription: "Requires dual cryptographic signatures from independent editors before dispatching to the live portal and PWA push notifications.",
        callouts: [
          { id: 1, label: "Editorial Queue Status", labelNepali: "सम्पादकीय लाम स्थिति", x: 20, y: 25, detail: "Displays pending drafts prioritized by urgency and algorithmic fact confidence.", detailNepali: "सम्पादकको पर्खाइमा रहेका समाचारहरूको लाम।" },
          { id: 2, label: "Dual Signature Ledger", labelNepali: "दोहोरो हस्ताक्षर विवरण", x: 50, y: 55, detail: "Both Editor A (Reviewer) and Editor B (Publisher) must sign with distinct security tokens.", detailNepali: "दुई जना भिन्न सम्पादकको डिजिटल हस्ताक्षर अनिवार्य छ।" },
          { id: 3, label: "Multi-Channel Broadcast Dispatch", labelNepali: "बहु-च्यानल प्रसारण प्रेषण", x: 80, y: 65, detail: "Pushes simultaneously to web portal, mobile PWA, Telegram bot, and the 24/7 radio ticker.", detailNepali: "वेबसाइट, मोबाइल एप, टेलिग्राम र रेडियोमा एकैपटक सम्प्रेषण हुन्छ।" }
        ],
        benefits: [
          "Guarantees that no single rogue operator can publish unvetted material",
          "Instant global distribution in under 200ms via distributed Edge CDN nodes",
          "Automatic generation of persistent audio TTS files upon publishing"
        ],
        commonMistakes: [
          "Sharing editor credentials to quickly bypass the dual-signature requirement",
          "Publishing breaking news before the automated TTS narration has rendered",
          "Failing to categorize emergency alerts under the high-priority disaster ticker"
        ],
        bestPractices: [
          "Enforce hardware security key (FIDO2) or authenticator token for Editor B",
          "Review the mobile preview snapshot to ensure Devanagari text wraps cleanly",
          "Check the SnapshotOS cache invalidator to verify instant reader availability"
        ]
      }
    ]
  },
  {
    id: "sgis",
    name: "SGIS Epigraphy & Preservation",
    nameNepali: "एसजिआइएस अभिलेख तथा पाण्डुलिपि",
    icon: Scroll,
    color: "cyan",
    items: [
      {
        id: "sgis_upload",
        title: "High-DPI Manuscript Digitization",
        titleNepali: "उच्च गुणस्तर पाण्डुलिपि डिजिटलाइजेसन",
        subtitle: "1200+ DPI Raw Archival Ingestion",
        mockupVisualType: "sgis_upload_canvas",
        mockupDescription: "Ingests raw multi-spectral scans of palm-leaf (tadpatra), birch-bark (bhojpatra), and stone inscription rubbings.",
        callouts: [
          { id: 1, label: "Color Calibration Target", labelNepali: "रङ प्रमाणीकरण चार्ट", x: 20, y: 25, detail: "Uses standard 24-patch X-Rite charts to ensure true pigment preservation across centuries.", detailNepali: "प्राकृतिक रङ सुरक्षित राख्न वैज्ञानिक चार्ट प्रयोग गरिन्छ।" },
          { id: 2, label: "Folio Edge & Binding Hole Inspector", labelNepali: "पाना किनारा र धागो प्वाल निरीक्षक", x: 50, y: 50, detail: "Automatically detects missing fragments, insect damage, and original cord bindings.", detailNepali: "कीराले खाएको वा च्यातिएको भाग पहिचान गर्छ।" },
          { id: 3, label: "TIFF Metadata Inscription", labelNepali: "स्थायी अभिलेख मेटाडाटा", x: 80, y: 70, detail: "Embeds library accession numbers, donor names, and climate storage conditions.", detailNepali: "पुस्तकालय दर्ता नम्बर र भण्डारण अवस्था सुरक्षित गर्छ।" }
        ],
        benefits: [
          "Prevents irrevocable civilizational loss due to earthquake, mold, or decay",
          "Enables scholars worldwide to examine fragile manuscripts without physical handling",
          "Retains archival-grade resolution suitable for future AI models and 3D printing"
        ],
        commonMistakes: [
          "Scanning palm-leaves under high-heat halogen lamps that cause brittle curling",
          "Cropping out manuscript margins containing critical original scribe colophons",
          "Compressing archival masters using lossy JPEG compression"
        ],
        bestPractices: [
          "Use non-contact cool LED illumination calibrated to 5000K daylight balance",
          "Store uncompressed TIFF files alongside cryptographic SHA-256 integrity hashes",
          "Record ambient humidity and temperature during every digitization session"
        ]
      },
      {
        id: "sgis_ocr",
        title: "Ancient Script OCR & Neural Segmentation",
        titleNepali: "प्राचीन लिपि ओसीआर तथा न्यूरल विभाजन",
        subtitle: "Brahmi, Licchavi & Sanskrit Conjunct Parsing",
        mockupVisualType: "sgis_ocr_canvas",
        mockupDescription: "Identifies glyph contours, segmenting fused ligature strokes and ancient vowel signs (matras).",
        callouts: [
          { id: 1, label: "Bounding Box Binarization", labelNepali: "अक्षर घेरा विभाजन", x: 25, y: 35, detail: "Separates stone surface cracks from intentional incised chisel grooves.", detailNepali: "ढुङ्गाको चिरा र कुँदिएको अक्षर बीच फरक छुट्याउँछ।" },
          { id: 2, label: "Licchavi Character Probability", labelNepali: "लिच्छवि लिपि सम्भाव्यता", x: 50, y: 50, detail: "Calculates glyph confidence based on 5th-century Manadeva inscription models.", detailNepali: "पाँचौँ शताब्दीको मानदेवकालीन लिच्छवि लिपिसँग तुलना गर्छ।" },
          { id: 3, label: "Devanagari Live Mapping", labelNepali: "देवनागरी प्रत्यक्ष रूपान्तरण", x: 75, y: 65, detail: "Projects the deciphered glyph into standard Devanagari in real-time.", detailNepali: "पुरातन अक्षरलाई तुरुन्त आधुनिक देवनागरीमा उतार्छ।" }
        ],
        benefits: [
          "Accelerates manuscript transcription from months of manual labor to hours",
          "Accurately deciphers eroded stone inscriptions that are illegible to the naked eye",
          "Continually improves accuracy through human-in-the-loop expert corrections"
        ],
        commonMistakes: [
          "Forcing standard modern Devanagari rules onto archaic Licchavi orthography",
          "Confusing weathered stone abrasions with the 'anusvara' dot (ं)",
          "Ignoring irregular line curvature common on hand-carved stone steles"
        ],
        bestPractices: [
          "Calibrate the OCR segmentation threshold on a well-preserved reference line first",
          "Utilize oblique raking light photos to reveal shallow chisel depressions",
          "Always pair machine OCR output with an accredited epigraphist review"
        ]
      },
      {
        id: "sgis_graph",
        title: "Civilizational Knowledge Graphs & AI Grounding",
        titleNepali: "सभ्यतागत ज्ञान ग्राफ तथा एआई ग्राउन्डिङ",
        subtitle: "RDF Triplestore & 'Ask Sanatan' Integration",
        mockupVisualType: "sgis_graph_canvas",
        mockupDescription: "Connects deciphered texts to geographical shrines, ruling monarchs, Saka era dates, and philosophical commentaries.",
        callouts: [
          { id: 1, label: "Ontological Entity Node", labelNepali: "ज्ञान सञ्जाल बिन्दु (Node)", x: 30, y: 30, detail: "Represents shrines (e.g. Pashupatinath), monarchs (e.g. Amsuvarma), and sacred rivers.", detailNepali: "पवित्र स्थल, राजा र नदीहरूलाई सम्बन्धित बिन्दुमा जोड्छ।" },
          { id: 2, label: "Relationship Vector Edge", labelNepali: "सम्बन्ध रेखा (Edge)", x: 55, y: 45, detail: "Defines historical relations: 'Granted Land To', 'Built Shrine In', 'Authored By'.", detailNepali: "ऐतिहासिक घटना र सम्बन्धहरूको व्याख्या गर्छ।" },
          { id: 3, label: "'Ask Sanatan' Grounding Bridge", labelNepali: "आस्क सनातन ग्राउन्डिङ पुल", x: 80, y: 70, detail: "Feeds verified ontological facts into Gemini RAG for hallucination-free answers.", detailNepali: "एआईले उत्तर दिँदा यही प्रमाणित ज्ञान प्रयोग गर्छ।" }
        ],
        benefits: [
          "Answers complex civilizational questions with infallible primary citations",
          "Reveals forgotten trade routes, dynastic alliances, and temple patronage records",
          "Provides an open semantic web endpoint for global Indological research"
        ],
        commonMistakes: [
          "Treating mythological poetic metaphors as chronological administrative dates",
          "Creating duplicate disconnected nodes for the same historical king or queen",
          "Overlooking local Newari and Maithili epigraphic variations of Sanskrit names"
        ],
        bestPractices: [
          "Anchor all calendar dates to both the Bikram Sambat (B.S.) and Saka Era frameworks",
          "Attach geotagged coordinates (lat/lng) to every mentioned ancient toponym",
          "Require peer-reviewed scholarly consensus before merging contested dynastic lineages"
        ]
      }
    ]
  },
  {
    id: "store",
    name: "Sacred Store & Commerce",
    nameNepali: "सनातन स्टोर तथा वाणिज्य",
    icon: ShoppingBag,
    color: "amber",
    items: [
      {
        id: "store_product",
        title: "Sacred Artifact Creation & Provenance",
        titleNepali: "पवित्र वस्तु दर्ता तथा उत्पत्ति प्रमाणीकरण",
        subtitle: "Authenticity Certification & Consecration Ledger",
        mockupVisualType: "store_product_canvas",
        mockupDescription: "Registers handcrafted brass deities, Rudraksha beads, handloom pashmina, and traditional ayurvedic formulations.",
        callouts: [
          { id: 1, label: "Artisan Provenance Stamp", labelNepali: "शिल्पकार परिचय छाप", x: 25, y: 30, detail: "Documents the Master Newar metalsmith, casting technique, and village of origin.", detailNepali: "मूर्तिकारको नाम र निर्माण विधिको प्रमाण।" },
          { id: 2, label: "Temple Consecration Seal (Prana Pratishtha)", labelNepali: "प्राण प्रतिष्ठा प्रमाणीकरण", x: 50, y: 55, detail: "Includes video documentation and date of ceremonial puja at accredited shrines.", detailNepali: "मन्दिरमा गरिएको विशेष पूजाको भिडियो प्रमाण।" },
          { id: 3, label: "Dynamic Inventory Thresholds", labelNepali: "स्टक सतर्कता सीमा", x: 75, y: 65, detail: "Triggers automated low-stock warnings to avoid overselling limited handcrafted lots.", detailNepali: "सीमित हस्तकला सकिन लाग्दा पूर्व जानकारी दिन्छ।" }
        ],
        benefits: [
          "Protects indigenous artisans from counterfeit commercial replicas",
          "Provides buyers with tamper-proof certificates of sacred consecration",
          "Eliminates unethical dropshipping of mass-produced plastic religious trinkets"
        ],
        commonMistakes: [
          "Failing to specify exact bronze alloy ratios (Ashtadhatu composition)",
          "Using non-standard sizing metrics for traditional Himalayan bells and singing bowls",
          "Promising spiritual guarantees or making superstitious medical claims"
        ],
        bestPractices: [
          "Include high-resolution macro photography of artisan signature stamps",
          "Provide lab-tested optical verification for sacred Nepali Rudraksha beads",
          "Package sacred artifacts in eco-friendly handmade Lokta paper with blessed sacred thread"
        ]
      },
      {
        id: "store_orders",
        title: "Order Dispatch & WhatsApp Integration",
        titleNepali: "अर्डर प्रेषण तथा ह्वाट्सएप समन्वय",
        subtitle: "Frictionless Himalayan Logistics & Instant Notifications",
        mockupVisualType: "store_orders_canvas",
        mockupDescription: "Dispatches customer orders with one-click WhatsApp status notifications, courier tracking, and digital receipt generation.",
        callouts: [
          { id: 1, label: "WhatsApp Status Dispatcher", labelNepali: "ह्वाट्सएप सूचना प्रेषक", x: 20, y: 35, detail: "Sends real-time bilingual delivery updates directly to the customer's phone.", detailNepali: "ग्राहकको मोबाइलमा तुरुन्त डेलिभरी जानकारी पुग्छ।" },
          { id: 2, label: "Courier Integration Dock", labelNepali: "ढुवानी कम्पनी समन्वय", x: 50, y: 55, detail: "Generates airway bills for remote mountain delivery and international DHL express.", detailNepali: "पहाडी जिल्ला र विदेशका लागि पार्सल ट्र्याकिङ कोड दिन्छ।" },
          { id: 3, label: "Cryptographic Invoice Seal", labelNepali: "डिजिटल बिल छाप", x: 80, y: 70, detail: "Emits tax-compliant digital invoices stamped with cryptographic verification.", detailNepali: "कर नियमानुसारको डिजिटल बिल जारी गर्छ।" }
        ],
        benefits: [
          "Reduces customer support inquiries by 75% via automated WhatsApp alerts",
          "Provides transparent door-to-door tracking from Kathmandu artisans to global diaspora",
          "Ensures zero lost packages through multi-carrier redundancy"
        ],
        commonMistakes: [
          "Shipping fragile terracotta or brass statues without shock-absorbing custom foam",
          "Neglecting customs paperwork declarations for international cultural artifact exports",
          "Entering customer phone numbers without country calling codes (+977)"
        ],
        bestPractices: [
          "Perform secondary visual inspection of artifact condition prior to sealing package",
          "Enforce fragile handling insurance on all high-value consecrated brass deities",
          "Send immediate post-delivery care instructions for maintaining sacred metal patinas"
        ]
      }
    ]
  },
  {
    id: "academy",
    name: "Academy & AssessmentOS",
    nameNepali: "सनातन अकादेमी तथा परीक्षा प्रणाली",
    icon: GraduationCap,
    color: "emerald",
    items: [
      {
        id: "academy_courses",
        title: "Course Curriculum Authoring",
        titleNepali: "पाठ्यक्रम निर्माण तथा व्यवस्थापन",
        subtitle: "Modular Shastric & Modern Civilization Studies",
        mockupVisualType: "academy_courses_canvas",
        mockupDescription: "Authors structured video lectures, downloadable Lokta PDFs, audio chants, and lesson prerequisites.",
        callouts: [
          { id: 1, label: "Prerequisite Enforcer", labelNepali: "पूर्वसर्त सुरक्षा गेट", x: 25, y: 30, detail: "Ensures students complete foundational ethics before unlocking advanced shastras.", detailNepali: "आधारभूत ज्ञान हासिल गरेपछि मात्र जटिल विषय खुल्छ।" },
          { id: 2, label: "Bilingual Lecture Material", labelNepali: "द्विभाषिक अध्ययन सामग्री", x: 50, y: 55, detail: "Pairs original Sanskrit verses with Nepali commentary and English annotations.", detailNepali: "मूल संस्कृत श्लोक, नेपाली भावार्थ र अंग्रेजी व्याख्या।" },
          { id: 3, label: "Downloadable Offline Study Pack", labelNepali: "अफलाइन अध्ययन प्याक", x: 75, y: 65, detail: "Compiles all lesson notes into lightweight PDFs for low-bandwidth Himalayan study.", detailNepali: "इन्टरनेट नहुँदा पनि पढ्न मिल्ने गरी पिडिएफ डाउनलोड।" }
        ],
        benefits: [
          "Preserves rare oral pedagogical lineages from accredited pandits and scholars",
          "Allows self-paced learning adapted to busy working professionals and students",
          "Maintains high pedagogical standards with mandatory lesson completion tracking"
        ],
        commonMistakes: [
          "Creating oversized video files without 360p mobile-optimized adaptive bitrate streams",
          "Presenting contested sectarian viewpoints as universal orthodox dogma",
          "Omitting critical transliteration guides for students unfamiliar with Devanagari"
        ],
        bestPractices: [
          "Structure courses into digestible 8-12 minute video modules",
          "Include interactive pronunciation practice for classical Sanskrit Vedic chants",
          "Attach primary scriptural citations for every philosophical claim made in lectures"
        ]
      },
      {
        id: "academy_assessment",
        title: "Anti-Cheat Quizzes & Cryptographic Certs",
        titleNepali: "सुरक्षित परीक्षा तथा डिजिटल प्रमाणपत्र",
        subtitle: "HMAC-SHA256 Verifiable Credential Issuance",
        mockupVisualType: "academy_assessment_canvas",
        mockupDescription: "Administers randomized anti-cheat question banks and generates cryptographically signed certificates verifiable at /verify/:certId.",
        callouts: [
          { id: 1, label: "Randomized Question Bank", labelNepali: "क्रमपरिवर्तित प्रश्न तालिका", x: 20, y: 35, detail: "Shuffles question order and distractor options for every student session.", detailNepali: "परीक्षामा चिटिङ रोक्न प्रश्न र विकल्पहरू स्वतः बदलिन्छन्।" },
          { id: 2, label: "Passing Threshold Enforcer", labelNepali: "उत्तीर्णाङ्क सुरक्षा सीमा", x: 50, y: 55, detail: "Requires 80%+ mastery to graduate, preventing superficial certificate collection.", detailNepali: "कम्तीमा ८०% अंक ल्याउनेले मात्र प्रमाणपत्र पाउँछन्।" },
          { id: 3, label: "Public /verify Signature Seal", labelNepali: "सार्वजनिक प्रमाणीकरण छाप", x: 80, y: 70, detail: "Generates a unique QR code linked to the public cryptographic verification ledger.", detailNepali: "क्युआर कोड स्क्यान गरी प्रमाणपत्र सक्कली भएको प्रमाणित गर्न सकिन्छ।" }
        ],
        benefits: [
          "Zero forged credentials—employers and universities can verify authenticity in seconds",
          "Guarantees true competence in civilizational philosophy and technical operations",
          "Printable vector SVG output suitable for formal framing and archival preservation"
        ],
        commonMistakes: [
          "Setting passing thresholds too low (<70%), diluting the prestige of the credential",
          "Exposing question answers in client-side JavaScript source code",
          "Failing to record the candidate's unique credential identifier in the permanent ledger"
        ],
        bestPractices: [
          "Shuffle distractors dynamically using server-validated cryptographic seeds",
          "Expire unverified test attempts after 45 minutes to prevent external search collusion",
          "Link all earned certificates directly to the scholar's public SanatanMarga profile"
        ]
      }
    ]
  }
];

export default function VisualFeatureExplainers() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ai_newsroom");
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const [activeCalloutId, setActiveCalloutId] = useState<number | null>(1);

  const currentCategory = FEATURE_CATEGORIES.find(c => c.id === selectedCategory) || FEATURE_CATEGORIES[0];
  const currentItem = currentCategory.items[selectedItemIndex] || currentCategory.items[0];

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedItemIndex(0);
    setActiveCalloutId(1);
  };

  const handleSelectItem = (index: number) => {
    setSelectedItemIndex(index);
    setActiveCalloutId(1);
  };

  return (
    <div className="space-y-8">
      
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-theme dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-wider mb-2">
            <Eye size={14} />
            <span>Interactive Architectural Feature Explainers</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground dark:text-white">
            सुविधा विश्लेषण तथा सञ्चालन मार्गदर्शिका
          </h2>
          <p className="text-xs sm:text-sm text-muted-text dark:text-zinc-400 mt-1 max-w-3xl">
            Deep-dive into every major subsystem of SanatanMarga with high-fidelity visual diagrams, 
            interactive callout hotspots, quantifiable benefits, common pitfalls, and certified operational best practices.
          </p>
        </div>
      </div>

      {/* Category Pills Switcher */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {FEATURE_CATEGORIES.map((cat) => {
          const IconComp = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2.5 shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                  : "bg-card dark:bg-zinc-900 border border-border-theme dark:border-zinc-800 text-muted-text hover:text-foreground hover:bg-muted-area"
              }`}
            >
              <IconComp size={18} />
              <span>{cat.name}</span>
              <span className="text-[11px] opacity-80 font-normal">({cat.nameNepali})</span>
            </button>
          );
        })}
      </div>

      {/* Sub-item Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-border-theme/60 dark:border-zinc-800/80">
        {currentCategory.items.map((item, idx) => {
          const isSelected = selectedItemIndex === idx;

          return (
            <button
              key={item.id}
              onClick={() => handleSelectItem(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? "bg-foreground text-background dark:bg-white dark:text-zinc-900 shadow-sm"
                  : "text-muted-text hover:text-foreground hover:bg-muted-area"
              }`}
            >
              <span>{item.title}</span>
            </button>
          );
        })}
      </div>

      {/* Feature Explainer Main Display Canvas */}
      <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
        
        {/* Header Summary */}
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
            {currentItem.subtitle}
          </span>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <h3 className="text-xl sm:text-2xl font-black text-foreground dark:text-white">
              {currentItem.title} ({currentItem.titleNepali})
            </h3>
            <span className="text-xs font-mono text-muted-text">
              {currentItem.callouts.length} Interactive Hotspots
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-text dark:text-zinc-300 leading-relaxed max-w-4xl">
            {currentItem.mockupDescription}
          </p>
        </div>

        {/* Visual Mockup Stage with Interactive Callout Pins */}
        <div className="relative w-full h-80 sm:h-96 bg-slate-950 rounded-2xl border-2 border-slate-800 overflow-hidden shadow-2xl flex flex-col">
          
          {/* Mockup Top Application Header */}
          <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-3 text-slate-300 font-bold">SanatanMarga CoreOS :: {currentCategory.name}</span>
            </div>
            <span className="text-[11px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              Interactive Explainer Mode
            </span>
          </div>

          {/* Canvas Background UI Simulator */}
          <div className="relative flex-1 p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-black overflow-hidden flex flex-col justify-center items-center">
            
            {/* Structural UI Mockup Grid Backdrop */}
            <div className="w-full max-w-2xl h-full border border-slate-800/80 rounded-xl p-4 bg-slate-900/40 backdrop-blur-sm flex flex-col gap-3 pointer-events-none opacity-40">
              <div className="h-6 w-1/4 bg-slate-700 rounded-md" />
              <div className="h-16 w-full bg-slate-800 rounded-lg" />
              <div className="grid grid-cols-3 gap-3 flex-1">
                <div className="bg-slate-800/60 rounded-lg p-2 flex flex-col gap-2">
                  <div className="h-3 w-3/4 bg-slate-700 rounded" />
                  <div className="h-3 w-1/2 bg-slate-700 rounded" />
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2 flex flex-col gap-2">
                  <div className="h-3 w-3/4 bg-slate-700 rounded" />
                  <div className="h-3 w-1/2 bg-slate-700 rounded" />
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2 flex flex-col gap-2">
                  <div className="h-3 w-3/4 bg-slate-700 rounded" />
                  <div className="h-3 w-1/2 bg-slate-700 rounded" />
                </div>
              </div>
            </div>

            {/* Interactive Numbered Hotspot Pins */}
            {currentItem.callouts.map((point) => {
              const isActive = activeCalloutId === point.id;

              return (
                <button
                  key={point.id}
                  onClick={() => setActiveCalloutId(point.id)}
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 cursor-pointer flex items-center justify-center ${
                    isActive 
                      ? "scale-125 z-30" 
                      : "scale-100 hover:scale-110 z-20"
                  }`}
                  title={point.label}
                >
                  <div className={`relative flex items-center justify-center ${
                    isActive ? "animate-bounce" : ""
                  }`}>
                    {/* Ripple Ping on Active */}
                    {isActive && (
                      <span className="absolute w-12 h-12 rounded-full bg-primary/40 animate-ping" />
                    )}
                    
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shadow-xl border-2 transition-colors ${
                      isActive 
                        ? "bg-primary text-white border-white ring-4 ring-primary/30" 
                        : "bg-slate-800 text-slate-200 border-primary/50 hover:border-primary hover:text-white"
                    }`}>
                      {point.id}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Overlay Active Callout Floating Card */}
            {activeCalloutId !== null && (
              <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 bg-slate-900/95 border border-primary/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {(() => {
                  const activePt = currentItem.callouts.find(p => p.id === activeCalloutId) || currentItem.callouts[0];
                  return (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                          HOTSPOT 0{activePt.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {activePt.labelNepali}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-white">
                        {activePt.label}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {activePt.detail}
                      </p>
                      <p className="text-[11px] text-slate-400 italic">
                        {activePt.detailNepali}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

          </div>

        </div>

        {/* Deep Dive 3-Column Grid: Benefits, Common Mistakes, Best Practices */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          
          {/* Column 1: Core Operational Benefits */}
          <div className="p-6 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={16} />
              <span>Core Benefits (प्रमुख फाइदाहरू)</span>
            </div>
            <ul className="space-y-3">
              {currentItem.benefits.map((b, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-foreground dark:text-zinc-200 flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                  <span className="leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Common Mistakes to Avoid */}
          <div className="p-6 rounded-2xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
              <AlertTriangle size={16} />
              <span>Common Mistakes (हुन सक्ने गल्तीहरू)</span>
            </div>
            <ul className="space-y-3">
              {currentItem.commonMistakes.map((m, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-foreground dark:text-zinc-200 flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-2" />
                  <span className="leading-relaxed">{m}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Certified Best Practices */}
          <div className="p-6 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Lightbulb size={16} />
              <span>Best Practices (सर्वोत्तम अभ्यासहरू)</span>
            </div>
            <ul className="space-y-3">
              {currentItem.bestPractices.map((bp, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-foreground dark:text-zinc-200 flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                  <span className="leading-relaxed">{bp}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
