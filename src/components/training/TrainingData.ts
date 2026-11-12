// SanatanMarga Training & Certification Center - Core Curriculum & Data Structure
// Enterprise-grade educational framework for Media, Knowledge, Governance, Commerce, Academy & Civilizational Intelligence

export interface Lesson {
  id: string;
  title: string;
  titleNepali: string;
  durationMinutes: number;
  description: string;
  descriptionNepali: string;
  learningObjectives: string[];
  keyTakeaways: string[];
  annotatedFeatures: {
    title: string;
    description: string;
    tag: string;
    uiSelectorHint?: string;
  }[];
  stepByStepGuide: {
    stepNumber: number;
    title: string;
    instructions: string;
    proTip?: string;
  }[];
  beforeAfterComparison?: {
    beforeLabel: string;
    beforeText: string;
    afterLabel: string;
    afterText: string;
  };
  workflowDiagramType?: "ecosystem" | "ai_pipeline" | "sgis" | "rbac" | "snapshot" | "revenue" | "commerce";
}

export interface TrainingTrack {
  id: string;
  slug: string;
  number: number;
  title: string;
  titleNepali: string;
  tagline: string;
  taglineNepali: string;
  targetPersonas: string[];
  targetPersonasNepali: string[];
  iconName: string;
  color: string;
  gradient: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Executive";
  estimatedTime: string;
  lessons: Lesson[];
  diagramTitle?: string;
  diagramDescription?: string;
  associatedCertId?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  questionNepali: string;
  options: string[];
  optionsNepali: string[];
  correctAnswerIndex: number;
  explanation: string;
  explanationNepali: string;
}

export interface CertificationPath {
  id: string;
  code: string;
  title: string;
  titleNepali: string;
  role: string;
  roleNepali: string;
  description: string;
  descriptionNepali: string;
  prerequisites: string[];
  passingScorePercent: number;
  badgeIcon: string;
  accentColor: string;
  trackId: string;
  questions: QuizQuestion[];
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  titleNepali: string;
  category: "Getting Started" | "AI Newsroom" | "MediaOS" | "SGIS" | "Commerce" | "Governance" | "Admin & Telemetry" | "Troubleshooting";
  tags: string[];
  summary: string;
  summaryNepali: string;
  steps: string[];
  troubleshootingTips?: string[];
  relatedTrackId?: string;
}

// 10 Comprehensive Training Tracks
export const TRAINING_TRACKS: TrainingTrack[] = [
  {
    id: "track-welcome",
    slug: "welcome-to-sanatanmarga",
    number: 1,
    title: "Welcome to SanatanMarga Platform",
    titleNepali: "सनातनमार्ग प्लेटफर्म स्वागत तथा आधारशिला",
    tagline: "The Digital Civilizational Operating System for Nepal and Global Diaspora",
    taglineNepali: "नेपाल तथा विश्वभरिका सनातन समुदायका लागि डिजिटल सभ्यता सञ्चालन प्रणाली",
    targetPersonas: ["New Users", "Readers", "Stakeholders", "Investors"],
    targetPersonasNepali: ["नयाँ प्रयोगकर्ता", "पाठक", "लगानीकर्ता", "सरोकारवाला"],
    iconName: "Compass",
    color: "amber",
    gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
    level: "Beginner",
    estimatedTime: "25 mins",
    associatedCertId: "cert_reader",
    diagramTitle: "Civilizational Architecture & 6 Foundational Pillars",
    diagramDescription: "Understanding the interconnected Media, Knowledge, Governance, Commerce, Academy, and Civilizational Intelligence layers.",
    lessons: [
      {
        id: "welcome-1",
        title: "Platform Mission & Civilizational Scope",
        titleNepali: "प्लेटफर्मको उद्देश्य र सभ्यतागत महत्व",
        durationMinutes: 6,
        description: "Explore the core philosophy of SanatanMarga—bridging ancient Vedic heritage, authentic journalism, and cutting-edge web architecture.",
        descriptionNepali: "सनातनमार्गको मूल दर्शन, वैदिक सम्पदाको संरक्षण, सत्य-आधारित पत्रकारिता र आधुनिक वेब प्रविधिको संगम बुझ्नुहोस्।",
        learningObjectives: [
          "Understand the 6 pillars of the SanatanMarga ecosystem",
          "Identify how SanatanMarga protects truth through strict verification gates",
          "Navigate the dual Nepali-English bilingual interface seamlessly"
        ],
        keyTakeaways: [
          "SanatanMarga is not a regular news blog; it is a full Digital Civilizational Operating System.",
          "Every module is designed around the core principle: 'No Source = No Story'.",
          "Bilingual architecture provides parity across English and Nepali speakers."
        ],
        annotatedFeatures: [
          {
            title: "Smart Command Palette (Cmd+K)",
            description: "Instant access to all news, 77 districts, scriptures, live audio, and admin controls.",
            tag: "UI Shortcut",
            uiSelectorHint: "Press Cmd+K anywhere"
          },
          {
            title: "Panchang & Tithi Indicator",
            description: "Authoritative Bikram Sambat calendar, daily Tithi, and astronomical timings in real time.",
            tag: "Cultural Context"
          },
          {
            title: "Bilingual Language Switcher",
            description: "Effortlessly toggle between Nepali and English while preserving page context.",
            tag: "Accessibility"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Access the Homepage",
            instructions: "Navigate to the root URL and observe the multi-tier header with live market ticker, trust policy, and fast links."
          },
          {
            stepNumber: 2,
            title: "Launch Command Palette",
            instructions: "Press Cmd+K (or Ctrl+K on Windows) to open the universal system launcher. Type 'Radio' or 'Gita' to jump anywhere."
          },
          {
            stepNumber: 3,
            title: "Select Your Preferred Theme & Font Scale",
            instructions: "Use the Sun/Moon toggle in the top bar to switch between Light Mode and high-contrast Dark Mode, plus the 'A+' accessibility scale."
          }
        ],
        beforeAfterComparison: {
          beforeLabel: "Traditional Media Portals",
          beforeText: "Ad-cluttered layouts, sensational clickbait, slow loading, unverified sources, and siloed content.",
          afterLabel: "SanatanMarga OS",
          afterText: "Verified source attribution, zero dark-patterns, offline-first resilience, and civilizational knowledge graphs."
        },
        workflowDiagramType: "ecosystem"
      },
      {
        id: "welcome-2",
        title: "Navigation & Command Control Overview",
        titleNepali: "नेभिगेसन तथा कमान्ड कन्ट्रोल अवलोकन",
        durationMinutes: 8,
        description: "Master the intuitive navigation structure: Mega-menus, 77-District Hub, Mobile Bottom Bar, and User Profile.",
        descriptionNepali: "मेगा मेनु, ७७ जिल्ला हब, मोबाइल बटम बार र व्यक्तिगत प्रोफाइलको प्रभावकारी प्रयोग सिक्नुहोस्।",
        learningObjectives: [
          "Navigate through all 8 primary categories",
          "Locate local news by selecting specific provinces and districts",
          "Configure your PWA offline installation"
        ],
        keyTakeaways: [
          "Nepal Hub aggregates stories from all 77 districts with spatial grouping.",
          "Offline mode enables caching of read articles via Service Workers and IndexedDB.",
          "Mobile-first responsive design guarantees touch targets of at least 44px."
        ],
        annotatedFeatures: [
          {
            title: "Nepal 77 District Hub",
            description: "Interactive province-level drilldown to find local verified events.",
            tag: "Geospatial"
          },
          {
            title: "Live Operations Ticker",
            description: "Real-time updates on breaking news, live streams, and system alerts.",
            tag: "Telemetry"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Open Nepal Hub",
            instructions: "Click on 'देश (७७ जिल्ला)' in the main menu to open the regional intelligence map."
          },
          {
            stepNumber: 2,
            title: "Filter by Province",
            instructions: "Select your home province (e.g. बागमती, कोशी, गण्डकी) to see verified municipal reports."
          },
          {
            stepNumber: 3,
            title: "Install PWA on Device",
            instructions: "Click 'Install App' in the top bar or browser prompt to add SanatanMarga to your phone's home screen."
          }
        ]
      }
    ]
  },
  {
    id: "track-reader",
    slug: "reader-training",
    number: 2,
    title: "Reader & Community Scholar Training",
    titleNepali: "पाठक तथा समुदाय सदस्य प्रशिक्षण",
    tagline: "Maximizing Your Daily News, Audio Listening, and Civilizational Discourse",
    taglineNepali: "दैनिक समाचार, अडियो सुन्ने सुविधा र सभ्यतागत विमर्शको पूर्ण उपयोग",
    targetPersonas: ["Readers", "Researchers", "Community Members", "Students"],
    targetPersonasNepali: ["पाठक", "अध्येता", "समुदाय सदस्य", "विद्यार्थी"],
    iconName: "BookOpen",
    color: "blue",
    gradient: "from-blue-500/20 via-indigo-500/10 to-transparent",
    level: "Beginner",
    estimatedTime: "30 mins",
    associatedCertId: "cert_reader",
    diagramTitle: "News Discovery & Reading Experience Architecture",
    diagramDescription: "From verified article feed to audio text-to-speech, bookmark storage, and community discussion.",
    lessons: [
      {
        id: "reader-1",
        title: "News Article Anatomy & Fact Provenance",
        titleNepali: "समाचारको संरचना र तथ्य प्रमाण विश्लेषण",
        durationMinutes: 10,
        description: "Understand the visual markers of verified news: Source cards, fact bullets, timestamp freshness badges, and editorial bylaws.",
        descriptionNepali: "प्रमाणित समाचारका संकेतहरू: स्रोत कार्ड, तथ्य बुलेट, समय ताजापन सूचक र सम्पादकीय आचारसंहिता बुझ्नुहोस्।",
        learningObjectives: [
          "Inspect verified publisher links and cross-references on every article",
          "Interpret the 72-hour Freshness Badge (Fresh vs. Archive)",
          "Distinguish primary reporting from editorial analysis"
        ],
        keyTakeaways: [
          "Every genuine story contains a 'Verified Sources' badge with clickable external evidence.",
          "If a claim has no credible corroboration, it will never enter the verified feed.",
          "Articles include Devanagari text-to-speech audio for hands-free listening."
        ],
        annotatedFeatures: [
          {
            title: "Provenance & Fact Box",
            description: "Lists primary sources, publication timestamps, and cross-checking status.",
            tag: "Transparency"
          },
          {
            title: "Audio Read Aloud",
            description: "Listen to the entire article with natural cadence speech synthesis.",
            tag: "Accessibility"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Open Any Article",
            instructions: "Click an article card on the homepage or category feed."
          },
          {
            stepNumber: 2,
            title: "Verify Source Provenance",
            instructions: "Scroll to the 'प्रमाणित स्रोतहरू (Verified Sources)' section to view direct external citations."
          },
          {
            stepNumber: 3,
            title: "Listen to Article Audio",
            instructions: "Click the 'सुन्नुहोस् (Listen)' button under the headline to stream high-clarity voice narration."
          }
        ]
      },
      {
        id: "reader-2",
        title: "Chautari Discourse & Community Guidelines",
        titleNepali: "चौतारी संवाद र समुदाय आचारसंहिता",
        durationMinutes: 8,
        description: "Engage in civilized discussions in Sanatan Chautari—Nepal's sovereign civic discourse forum.",
        descriptionNepali: "नेपालको मर्यादित सार्वजनिक विमर्श स्थल 'सनातन चौतारी' मा कसरी सकारात्मक छलफल गर्ने सिक्नुहोस्।",
        learningObjectives: [
          "Create thoughtful discussion threads in Chautari",
          "Abide by the respectful, civil discourse policy",
          "Upvote quality analysis and report harassment or misinformation"
        ],
        keyTakeaways: [
          "Chautari promotes constructive, dignified conversations without abusive spam.",
          "Discussions are categorized by topics (National, Philosophy, Economy, Tech).",
          "Community karma reflects verified engagement and constructive input."
        ],
        annotatedFeatures: [
          {
            title: "Topic Tags",
            description: "Categorize discussions into Culture, Economy, Governance, and Technology.",
            tag: "Organization"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Visit Chautari",
            instructions: "Navigate to /community or click 'चौतारी' in the navigation bar."
          },
          {
            stepNumber: 2,
            title: "Start a New Discussion",
            instructions: "Click 'नयाँ छलफल सुरु गर्नुहोस्', choose a topic tag, and write your perspective clearly."
          },
          {
            stepNumber: 3,
            title: "Interact Respectfully",
            instructions: "Reply to fellow citizens with polite language and cite factual evidence where possible."
          }
        ]
      }
    ]
  },
  {
    id: "track-ai-newsroom",
    slug: "ai-newsroom-training",
    number: 3,
    title: "AI Newsroom OS & Fact Verification",
    titleNepali: "एआई न्यूजरुम प्रणाली तथा तथ्य प्रमाणीकरण",
    tagline: "The World's Most Rigorous Automated Journalism Pipeline: 'No Source = No Story'",
    taglineNepali: "विश्वकै सबैभन्दा कडा स्वचालित पत्रकारिता पाइपलाइन: 'प्रमाण छैन त समाचार छैन'",
    targetPersonas: ["Journalists", "Editors", "Newsroom Directors", "Fact Checkers"],
    targetPersonasNepali: ["पत्रकार", "सम्पादक", "न्यूजरुम निर्देशक", "तथ्य जाँचकर्ता"],
    iconName: "Sparkles",
    color: "purple",
    gradient: "from-purple-500/20 via-pink-500/10 to-transparent",
    level: "Intermediate",
    estimatedTime: "45 mins",
    associatedCertId: "cert_journalist",
    diagramTitle: "AI Newsroom 6-Stage Autonomous Pipeline",
    diagramDescription: "From Google Grounding discovery to the 72-hour freshness gate, temporal fact audit, and final editorial publication.",
    lessons: [
      {
        id: "newsroom-1",
        title: "Discovery Engine & Google Grounding",
        titleNepali: "खोज इन्जिन र गुगल ग्राउन्डिङ प्रक्रिया",
        durationMinutes: 12,
        description: "How SanatanMarga's discovery engine retrieves live candidate stories using real Google search grounding, filtering out spam and SEO noise.",
        descriptionNepali: "सनातनमार्गको खोज इन्जिनले कसरी वास्तविक गुगल ग्राउन्डिङद्वारा भरपर्दो समाचार फेला पार्छ र स्पाम हटाउँछ।",
        learningObjectives: [
          "Understand how Gemini models use real-time Google search grounding",
          "Identify authentic publisher domains (e.g. Gorkhapatra, Ratopati, Setopati, OnlineKhabar)",
          "Inspect raw discovery candidate payloads and metadata"
        ],
        keyTakeaways: [
          "The system never queries ungrounded generative models for news events.",
          "Discovery queries are tailored per category with precise time boundaries.",
          "Search query URLs (e.g. google.com/search) are immediately stripped out as invalid."
        ],
        annotatedFeatures: [
          {
            title: "Canonical URL Validator",
            description: "Rejects Bing/Google search redirect wrappers and extracts the true publisher link.",
            tag: "Security & Source Truth"
          },
          {
            title: "Category Story Discovery Engine",
            description: "Executes periodic scans across Politics, Economy, Science, Province, and Sports.",
            tag: "Automation"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Navigate to Admin Discovery",
            instructions: "Log in as an Editor and visit /admin/discovery."
          },
          {
            stepNumber: 2,
            title: "Trigger a Category Scan",
            instructions: "Select 'अर्थ (Economy)' or 'राजनीति (Politics)' and click 'Discover Stories'."
          },
          {
            stepNumber: 3,
            title: "Inspect Grounding Proof",
            instructions: "Observe the returned candidate cards with explicit source URLs and extracted quotes."
          }
        ],
        workflowDiagramType: "ai_pipeline"
      },
      {
        id: "newsroom-2",
        title: "The 72-Hour Freshness Gate & Temporal Fact Audit",
        titleNepali: "७२-घण्टा ताजापन नियम र समय तथ्य परीक्षण",
        durationMinutes: 14,
        description: "Enforce strict temporal integrity: Why ambiguous phrases like 'आज' or 'हिजो' without explicit timestamps are rejected by the system.",
        descriptionNepali: "कडा समय-सीमा नियम: किन स्पष्ट मिति नभएका 'आज' वा 'हिजो' जस्ता अस्पष्ट समाचार प्रणालीले अस्वीकार गर्छ।",
        learningObjectives: [
          "Calculate article freshness against Asia/Kathmandu reference time",
          "Audit publication timestamps using the multi-engine timestamp parser",
          "Identify and reject stale articles older than 72 hours"
        ],
        keyTakeaways: [
          "A news story must be published within the last 72 hours to enter the 'Latest News' stream.",
          "Ambiguous relative phrases are rejected unless confirmed by an authoritative ISO timestamp.",
          "SanatanMarga operates under a fail-closed policy: If evidence is uncertain, generation halts."
        ],
        annotatedFeatures: [
          {
            title: "Timestamp Parser Engine",
            description: "Parses Bikram Sambat, English relative, and Devanagari numerals into authoritative UTC.",
            tag: "Date Precision"
          },
          {
            title: "Fail-Closed Gatekeeper",
            description: "Throws DISCOVERY_FAILED_NO_VERIFIED_SOURCES rather than generating placeholder text.",
            tag: "Zero Hallucination"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Review Candidate Timestamps",
            instructions: "Inspect the parsed published date on each candidate card in the editorial queue."
          },
          {
            stepNumber: 2,
            title: "Verify Freshness Status",
            instructions: "Confirm that the tag reads 'FRESH' (<= 24h) or 'SEMI_FRESH' (<= 72h). Stale items are flagged in red."
          },
          {
            stepNumber: 3,
            title: "Approve for Generation",
            instructions: "Only proceed to generate full drafts for candidates with verified timestamps."
          }
        ]
      },
      {
        id: "newsroom-3",
        title: "Editorial Queue, Four-Eyes Review & Publishing",
        titleNepali: "सम्पादकीय लाम, दोहोरो समीक्षा र प्रकाशन विधि",
        durationMinutes: 10,
        description: "Step-by-step workflow for journalists drafting articles, editor review, four-eyes approval, and instant multi-channel push.",
        descriptionNepali: "पत्रकारले लेख लेख्ने, सम्पादकले दोहोरो जाँच गर्ने र तुरुन्तै विभिन्न च्यानलमा प्रकाशन गर्ने विधि।",
        learningObjectives: [
          "Edit AI-generated drafts for journalistic voice and nuances",
          "Attach verified high-resolution images with proper copyright credits",
          "Publish to live feed and dispatch breaking news push notifications"
        ],
        keyTakeaways: [
          "AI proposes drafts, but human editorial oversight ensures legal, cultural, and ethical accuracy.",
          "Images must have explicit photographer attribution and descriptive alt-text.",
          "Publishing immediately invalidates the static snapshot cache for real-time freshness."
        ],
        annotatedFeatures: [
          {
            title: "Markdown & WYSIWYG Editor",
            description: "Clean writing interface with live Devanagari preview and SEO analyzer.",
            tag: "Editorial Tool"
          },
          {
            title: "Instant Push Dispatch",
            description: "Sends Web Push alerts to subscribed readers for breaking national events.",
            tag: "Distribution"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Open Editorial Command Center",
            instructions: "Navigate to /admin/command-center or /admin/editor."
          },
          {
            stepNumber: 2,
            title: "Review Draft Content",
            instructions: "Check headline accuracy, verify quotes, and confirm geographic tags (Province/District)."
          },
          {
            stepNumber: 3,
            title: "Publish to Production",
            instructions: "Click 'Publish Story' to deploy the article to the live web and PWA feeds."
          }
        ]
      }
    ]
  },
  {
    id: "track-media-os",
    slug: "media-os-training",
    number: 4,
    title: "MediaOS, RadioOS & Live Broadcasting",
    titleNepali: "मिडिया सञ्चालन, रेडियो र प्रत्यक्ष प्रसारण",
    tagline: "Operating 24/7 Digital Radio, Live Video Feeds, and High-Performance Media Assets",
    taglineNepali: "२४/७ डिजिटल रेडियो, प्रत्यक्ष भिडियो फिड र उच्च क्षमताको मिडिया व्यवस्थापन",
    targetPersonas: ["Media Operators", "Audio Engineers", "Broadcasters", "Content Creators"],
    targetPersonasNepali: ["मिडिया अपरेटर", "अडियो इन्जिनियर", "प्रसारक", "सामग्री निर्माता"],
    iconName: "Radio",
    color: "red",
    gradient: "from-red-500/20 via-rose-500/10 to-transparent",
    level: "Intermediate",
    estimatedTime: "35 mins",
    associatedCertId: "cert_media_operator",
    diagramTitle: "MediaOS Multi-Format Ingestion & Distribution",
    diagramDescription: "Low-latency streaming architecture connecting RadioOS audio queues, Live YouTube relays, and responsive CDN assets.",
    lessons: [
      {
        id: "media-1",
        title: "RadioOS 24/7 Audio Broadcasting & Scheduling",
        titleNepali: "रेडियो ओएस २४/७ अडियो प्रसारण र तालिका व्यवस्थापन",
        durationMinutes: 12,
        description: "Manage Sanatan Radio's continuous 24/7 stream: Bhajans, Vedic chanting, hourly news bulletins, and spiritual discourse.",
        descriptionNepali: "सनातन रेडियोको निरन्तर प्रसारण व्यवस्थापन: भजन, वैदिक मन्त्र, घण्टे समाचार र आध्यात्मिक प्रवचन।",
        learningObjectives: [
          "Understand HLS and Icecast stream ingestion in RadioOS",
          "Schedule hourly news bulletins and daily morning Aarati",
          "Monitor live listener telemetry and bitrate health"
        ],
        keyTakeaways: [
          "The persistent audio player floats across page navigation without interrupting playback.",
          "RadioOS supports fallback audio tracks if the live feed encounters upstream packet loss.",
          "Audio metadata broadcasts current track title and presenter in real time."
        ],
        annotatedFeatures: [
          {
            title: "Persistent Mini-Player",
            description: "Sticky audio bar with volume slider, play/pause, and station switcher.",
            tag: "Continuous Playback"
          },
          {
            title: "Admin Radio Scheduler",
            description: "Visual time-block scheduler for morning prayers, news, and evening Satsang.",
            tag: "Broadcast Management"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Launch Public Radio",
            instructions: "Click 'सनातन रेडियो' or navigate to /radio to experience the listener interface."
          },
          {
            stepNumber: 2,
            title: "Open Admin Radio Management",
            instructions: "Access /admin/radio to view active audio feeds and playlist schedules."
          },
          {
            stepNumber: 3,
            title: "Add a Sponsor Audio Bump",
            instructions: "Configure pre-roll or mid-roll audio sponsor notices via Sponsor Audio OS."
          }
        ]
      },
      {
        id: "media-2",
        title: "LiveOS Video Feeds & Media Asset Ingestion",
        titleNepali: "प्रत्यक्ष भिडियो फिड र मिडिया लाइब्रेरी व्यवस्थापन",
        durationMinutes: 10,
        description: "Set up live temple broadcasts, national press briefings, and organize the central Media Assets library.",
        descriptionNepali: "मन्दिरको प्रत्यक्ष दर्शन, राष्ट्रिय पत्रकार सम्मेलन प्रसारण र केन्द्रीय मिडिया लाइब्रेरी व्यवस्थापन।",
        learningObjectives: [
          "Embed and monitor YouTube Live and RTMP streams",
          "Upload, tag, and auto-convert images to modern WebP format",
          "Apply copyright metadata, captions, and watermarking"
        ],
        keyTakeaways: [
          "Live streams display real-time live tickers and integrated live chat moderation.",
          "All media uploaded to /admin/media-assets is indexed with search tags and compression.",
          "Heavy video files utilize external CDNs to prevent server bandwidth exhaustion."
        ],
        annotatedFeatures: [
          {
            title: "Live Stream Hub (/live)",
            description: "Multi-camera selector for Pashupatinath, Muktinath, and national events.",
            tag: "Live Video"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Configure Live Stream",
            instructions: "Navigate to /admin/live, input the video ID or stream URL, and enter the live event title."
          },
          {
            stepNumber: 2,
            title: "Upload Press Photos",
            instructions: "In /admin/media-assets, drag-and-drop event photos to generate optimized thumbnails."
          },
          {
            stepNumber: 3,
            title: "Attach to News Stories",
            instructions: "Use the Media Picker in the article editor to insert approved photos with automatic attribution."
          }
        ]
      }
    ]
  },
  {
    id: "track-academy-assessment",
    slug: "assessment-academy-training",
    number: 5,
    title: "AssessmentOS & Academy Course Management",
    titleNepali: "मूल्यांकन प्रणाली तथा अकादेमी पाठ्यक्रम व्यवस्थापन",
    tagline: "Empowering Educators to Create Courses, Conduct Anti-Cheat Exams, and Issue Verified Certificates",
    taglineNepali: "शिक्षकहरूलाई पाठ्यक्रम निर्माण, परीक्षा सञ्चालन र प्रमाणित प्रमाणपत्र जारी गर्न सक्षम बनाउने",
    targetPersonas: ["Course Instructors", "Scholars", "Academic Deans", "Examiners"],
    targetPersonasNepali: ["पाठ्यक्रम प्रशिक्षक", "विद्वान", "शैक्षिक प्रमुख", "परीक्षक"],
    iconName: "GraduationCap",
    color: "emerald",
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    level: "Intermediate",
    estimatedTime: "40 mins",
    associatedCertId: "cert_academy_instructor",
    diagramTitle: "Course Lifecycle, Assessment & Verification Pipeline",
    diagramDescription: "From curriculum design and lesson authoring to time-locked assessments and cryptographic HMAC certification.",
    lessons: [
      {
        id: "academy-1",
        title: "Course Builder & Lesson Curriculum Design",
        titleNepali: "पाठ्यक्रम निर्माण तथा पाठ योजना तयारी",
        durationMinutes: 12,
        description: "Create engaging academic programs covering Vedic philosophy, Sanskrit grammar, Nepalese art, and civilizational history.",
        descriptionNepali: "वैदिक दर्शन, संस्कृत व्याकरण, नेपाली कला र सभ्यतागत इतिहास समेटिएका आकर्षक पाठ्यक्रम बनाउने विधि।",
        learningObjectives: [
          "Structure modular courses with units, lessons, and reading materials",
          "Attach video lectures, downloadable PDFs, and practice quizzes",
          "Set enrollment criteria and prerequisite levels (Beginner, Intermediate, Advanced)"
        ],
        keyTakeaways: [
          "Courses can be self-paced or cohort-based with scheduled live sessions.",
          "Every course requires clear learning outcomes and verifiable syllabus milestones.",
          "Lesson progress is tracked automatically in the student's personal profile."
        ],
        annotatedFeatures: [
          {
            title: "Admin Course Builder",
            description: "Intuitive curriculum organizer with drag-and-drop lesson reordering.",
            tag: "Pedagogy"
          },
          {
            title: "Bilingual Course Details",
            description: "Displays parallel Devanagari and English lesson outlines.",
            tag: "Inclusivity"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Access Admin Academy",
            instructions: "Navigate to /admin/academy and click 'नयाँ कोर्स सिर्जना गर्नुहोस्'."
          },
          {
            stepNumber: 2,
            title: "Define Course Metadata",
            instructions: "Enter the course title in Nepali and English, instructor bio, duration, and thumbnail banner."
          },
          {
            stepNumber: 3,
            title: "Add Modules & Lessons",
            instructions: "Add lesson blocks with video links, study text, and review questions."
          }
        ]
      },
      {
        id: "academy-2",
        title: "Exam Engine & Cryptographic Certificate Issuance",
        titleNepali: "परीक्षा प्रणाली र डिजिटल प्रमाणपत्र प्रमाणीकरण",
        durationMinutes: 12,
        description: "Configure online examinations with randomized questions, passing thresholds, and automatic tamper-proof certificate generation.",
        descriptionNepali: "अनलाइन परीक्षा, समय सीमा, उत्तीर्णाङ्क र स्वतः सुरक्षित डिजिटल प्रमाणपत्र जारी गर्ने तरिका।",
        learningObjectives: [
          "Build multi-choice and scenario-based assessment question banks",
          "Set passing score thresholds (typically 75% for professional tracks)",
          "Inspect the SHA-256 HMAC digital signature on generated certificates"
        ],
        keyTakeaways: [
          "Certificates contain a unique serial number (e.g. SM-CERT-2026-XXXX) and verification URL.",
          "Anyone in the world can verify the certificate's validity at /verify-certificate/:certId.",
          "The backend verifies the cryptographic checksum to prevent forged credentials."
        ],
        annotatedFeatures: [
          {
            title: "Certificate Verification OS (/verify-certificate)",
            description: "Public anti-forgery verification engine connected to the official registry.",
            tag: "Trust & Credibility"
          },
          {
            title: "Student Results Portal (/academy/results)",
            description: "Central leaderboard, transcript, and certificate download center.",
            tag: "Student Success"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Create an Assessment",
            instructions: "In Admin Academy, click 'Assessments' and define the question pool and time limit."
          },
          {
            stepNumber: 2,
            title: "Take Test as Student",
            instructions: "Students answer questions and receive instant scoring and detailed answer explanations."
          },
          {
            stepNumber: 3,
            title: "Verify Issued Certificate",
            instructions: "Visit /verify-certificate, input the serial number, and verify the official digital seal."
          }
        ]
      }
    ]
  },
  {
    id: "track-sgis",
    slug: "sgis-training",
    number: 6,
    title: "SGIS: Sanatan Geospatial & Knowledge Intelligence",
    titleNepali: "एसजिआइएस: सनातन भौगोलिक तथा ज्ञान बौद्धिकता",
    tagline: "Digitizing Ancient Manuscripts, OCR Processing, and Building Sacred Knowledge Graphs",
    taglineNepali: "प्राचीन पाण्डुलिपि डिजिटलाइजेसन, ओसिआर प्रशोधन र ज्ञान सञ्जाल निर्माण",
    targetPersonas: ["SGIS Researchers", "Archivists", "Historians", "Linguists"],
    targetPersonasNepali: ["एसजिआइएस अन्वेषक", "अभिलेखपाल", "इतिहासकार", "भाषाशास्त्री"],
    iconName: "Scroll",
    color: "cyan",
    gradient: "from-cyan-500/20 via-blue-500/10 to-transparent",
    level: "Advanced",
    estimatedTime: "45 mins",
    associatedCertId: "cert_sgis_researcher",
    diagramTitle: "SGIS Manuscript Ingestion & Semantic Knowledge Pipeline",
    diagramDescription: "From high-resolution palm-leaf scanning to Devanagari OCR, Sanskrit grammatical parsing, and graph node linking.",
    lessons: [
      {
        id: "sgis-1",
        title: "Manuscript Scanning & High-Precision OCR",
        titleNepali: "पाण्डुलिपि स्क्यानिङ र उच्च परिशुद्ध ओसिआर",
        durationMinutes: 14,
        description: "Digitize historical palm-leaf, copperplate, and stone inscriptions (शिलालेख) using automated character recognition.",
        descriptionNepali: "ताडपत्र, भोजपत्र, ताम्रपत्र र शिलालेखहरूलाई आधुनिक क्यारेक्टर पहिचान प्रविधिद्वारा डिजिटलाइज गर्ने विधि।",
        learningObjectives: [
          "Upload high-resolution manuscript plates (Newari, Brahmi, Devanagari)",
          "Run OCR extraction and review transliterated text side-by-side with raw plate scans",
          "Identify and correct archaic conjunct characters and scribal ligatures"
        ],
        keyTakeaways: [
          "SGIS preserves fragile cultural heritage against environmental decay.",
          "Every manuscript record retains physical provenance: provenance location, folio number, and material.",
          "Extracted text is indexed for full-text Sanskrit and Nepali semantic search."
        ],
        annotatedFeatures: [
          {
            title: "Manuscript Viewer & Loupe",
            description: "Deep-zoom pan-and-scan inspection of fragile historical folios.",
            tag: "Digital Humanities"
          },
          {
            title: "OCR Correction Interface",
            description: "Two-pane editor comparing original manuscript image against transcribed text.",
            tag: "Verification"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Navigate to SGIS Console",
            instructions: "Access /admin/knowledge?tab=sgis or /admin/sgis."
          },
          {
            stepNumber: 2,
            title: "Upload Inscription Image",
            instructions: "Select a high-resolution image of a Licchavi stone inscription or manuscript page."
          },
          {
            stepNumber: 3,
            title: "Trigger OCR & Transliteration",
            instructions: "Click 'Run SGIS Extraction' and review the generated Devanagari text and English summary."
          }
        ],
        workflowDiagramType: "sgis"
      },
      {
        id: "sgis-2",
        title: "Knowledge Graphs & 'Ask Sanatan' Grounding",
        titleNepali: "ज्ञान सञ्जाल (Knowledge Graph) र आस्क सनातन एआई",
        durationMinutes: 12,
        description: "Connect deities, sacred geographic shrines, historical dynasties, and philosophical texts into an interconnected semantic graph.",
        descriptionNepali: "देवता, तीर्थस्थल, ऐतिहासिक राजवंश र दार्शनिक ग्रन्थहरूलाई आपसमा जोड्ने ज्ञान सञ्जाल।",
        learningObjectives: [
          "Model entity relationships (e.g. Pashupatinath -> Shiva -> Bagmati -> Licchavi Era)",
          "Ground 'Ask Sanatan AI' with verified knowledge nodes to prevent hallucinations",
          "Explore the interactive 3D/2D Knowledge Graph visualizer"
        ],
        keyTakeaways: [
          "Knowledge graphs allow readers to discover related temples and rituals organically.",
          "'Ask Sanatan' AI synthesizes answers strictly grounded in these verified nodes.",
          "Geospatial coordinates map sacred pilgrim routes across all seven provinces."
        ],
        annotatedFeatures: [
          {
            title: "Interactive Knowledge Graph (/knowledge)",
            description: "Explore nodes and dynamic force-directed relationship links.",
            tag: "Semantic Web"
          },
          {
            title: "Ask Sanatan AI (/ask-sanatan)",
            description: "Grounded conversational assistant for Vedic philosophy and Nepalese heritage.",
            tag: "AI Grounding"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Open Knowledge Base",
            instructions: "Visit /knowledge and search for any historical entity (e.g. 'मुक्तिनाथ' or 'चाणक्य')."
          },
          {
            stepNumber: 2,
            title: "Inspect Related Entities",
            instructions: "Observe the linked nodes for connected texts, geographical coordinates, and festivals."
          },
          {
            stepNumber: 3,
            title: "Query Ask Sanatan AI",
            instructions: "Ask a complex cultural question and notice the direct citations to knowledge base nodes."
          }
        ]
      }
    ]
  },
  {
    id: "track-commerce-store",
    slug: "commerce-store-training",
    number: 7,
    title: "Commerce & Store Operations",
    titleNepali: "वाणिज्य तथा अनलाइन स्टोर सञ्चालन",
    tagline: "Managing Authentic Cultural Merchandise, Inventory, and WhatsApp One-Click Checkout",
    taglineNepali: "प्रामाणिक सांस्कृतिक सामग्री, मौज्दात र ह्वाट्सएप एक-क्लिक खरिद व्यवस्थापन",
    targetPersonas: ["Commerce Managers", "Merchants", "Artisans", "Store Operators"],
    targetPersonasNepali: ["वाणिज्य प्रबन्धक", "व्यापारी", "शिल्पकार", "स्टोर अपरेटर"],
    iconName: "ShoppingBag",
    color: "green",
    gradient: "from-green-500/20 via-emerald-500/10 to-transparent",
    level: "Beginner",
    estimatedTime: "30 mins",
    associatedCertId: "cert_commerce_manager",
    diagramTitle: "Store Order Lifecycle & WhatsApp Dispatch Architecture",
    diagramDescription: "How customer orders travel from product catalog display to zero-friction WhatsApp confirmation and fulfillment.",
    lessons: [
      {
        id: "commerce-1",
        title: "Product Catalog & Inventory Management",
        titleNepali: "सामग्री सूची र मौज्दात (Inventory) व्यवस्थापन",
        durationMinutes: 10,
        description: "Add and organize sacred goods: Authentic Rudraksha, Shaligram, Vedic literature, handcrafted brass idols, and herbal incense.",
        descriptionNepali: "पवित्र सामग्री थप्ने तरिका: प्रामाणिक रुद्राक्ष, शालिग्राम, धार्मिक पुस्तक, काँस-तामाका मूर्ति र प्राकृतिक धुप।",
        learningObjectives: [
          "Create product listings with bilingual descriptions, prices in NPR, and high-res photos",
          "Track real-time inventory counts and set low-stock automated alerts",
          "Manage categories: Books, Puja Items, Sacred Wear, Handicrafts"
        ],
        keyTakeaways: [
          "Every sacred item must include provenance notes (e.g. Muktinath Shaligram authenticity).",
          "Out-of-stock items automatically display a 'पुनः आउँदैछ (Restocking Soon)' badge.",
          "Prices support NPR with international currency estimation for the diaspora."
        ],
        annotatedFeatures: [
          {
            title: "Sanatan Store (/store)",
            description: "Elegant storefront with categories, customer reviews, and clear specifications.",
            tag: "E-Commerce"
          },
          {
            title: "Admin Store Console (/admin/store)",
            description: "Product inventory manager, pricing editor, and sales analytics.",
            tag: "Operations"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Navigate to Admin Store",
            instructions: "Visit /admin/store or /admin/commerce to view the product catalog."
          },
          {
            stepNumber: 2,
            title: "Add a New Item",
            instructions: "Click 'नयाँ उत्पादन थप्नुहोस्', specify title, price in NPR, stock count, and upload photos."
          },
          {
            stepNumber: 3,
            title: "Verify Public Listing",
            instructions: "Go to /store to confirm that your new product appears with correct pricing and tags."
          }
        ],
        workflowDiagramType: "commerce"
      },
      {
        id: "commerce-2",
        title: "WhatsApp Checkout & Customer Fulfillment",
        titleNepali: "ह्वाट्सएप अर्डर र ग्राहक सेवा व्यवस्थापन",
        durationMinutes: 8,
        description: "Why SanatanMarga leverages WhatsApp for 95% of orders: Zero payment friction, direct trust, and instant confirmation in Nepal.",
        descriptionNepali: "किन सनातनमार्गले ह्वाट्सएप अर्डर रोजेको छ: शून्य झन्झट, प्रत्यक्ष विश्वास र तुरुन्तै अर्डर पुष्टि।",
        learningObjectives: [
          "Understand how the WhatsApp One-Click checkout payload is formatted",
          "Process incoming orders, confirm delivery addresses, and dispatch parcels",
          "Update order statuses: Pending -> Confirmed -> Shipped -> Delivered"
        ],
        keyTakeaways: [
          "Customers in Nepal strongly prefer direct WhatsApp chat for order personalization.",
          "The system pre-populates item names, quantity, price, and delivery location into the chat.",
          "Merchants can accept Fonepay/eSewa QR receipts directly within the WhatsApp conversation."
        ],
        annotatedFeatures: [
          {
            title: "WhatsApp 1-Click Button",
            description: "Direct link opening WhatsApp with formatted order summary ready to send.",
            tag: "Conversion"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Test WhatsApp Checkout",
            instructions: "On /store, click on any product and hit 'WhatsApp बाट अर्डर गर्नुहोस्'."
          },
          {
            stepNumber: 2,
            title: "Inspect Generated Message",
            instructions: "Notice how the product title, SKU, and total amount are automatically formatted."
          },
          {
            stepNumber: 3,
            title: "Track in Commerce Analytics",
            instructions: "View conversion rates and popular products in /admin/commerce-analytics."
          }
        ]
      }
    ]
  },
  {
    id: "track-revenue-os",
    slug: "revenue-os-training",
    number: 8,
    title: "Advertisement & RevenueOS Training",
    titleNepali: "विज्ञापन तथा आम्दानी प्रणाली (RevenueOS)",
    tagline: "Monetizing Sovereign Digital Media with Dignity: High-Yield Ethical Ads & Sponsor Audio",
    taglineNepali: "मर्यादित डिजिटल विज्ञापन, पारदर्शी आम्दानी र प्रायोजक व्यवस्थापन",
    targetPersonas: ["Advertisers", "Sponsors", "Revenue Directors", "Media Sales"],
    targetPersonasNepali: ["विज्ञापनदाता", "प्रायोजक", "आम्दानी निर्देशक", "मिडिया सेल्स"],
    iconName: "TrendingUp",
    color: "amber",
    gradient: "from-amber-500/20 via-yellow-500/10 to-transparent",
    level: "Intermediate",
    estimatedTime: "35 mins",
    associatedCertId: "cert_editor",
    diagramTitle: "RevenueOS Ad Placement Registry & Impression Telemetry",
    diagramDescription: "Transparent tracking from client impression hooks to House Ad fallbacks, advertiser dashboards, and daily billing.",
    lessons: [
      {
        id: "revenue-1",
        title: "Ad Placements & House Ad Fallback Architecture",
        titleNepali: "विज्ञापन स्थान (Ad Slots) र हाउस एड सुरक्षा प्रणाली",
        durationMinutes: 10,
        description: "Master the standardized ad inventory slots: Header Leaderboard, Inline News Content, Sidebar Rectangles, and Audio Bumps.",
        descriptionNepali: "हेडर ब्यानर, समाचार भित्रका स्थान, साइडबार र रेडियो अडियो विज्ञापनहरूको व्यवस्थापन।",
        learningObjectives: [
          "Understand the Ad Placement Registry in src/constants/adPlacementRegistry.ts",
          "Configure ethical advertising guidelines (no gambling, adult content, or predatory loans)",
          "Inspect how the House Ad fallback prevents unsightly empty spaces when inventory is unfilled"
        ],
        keyTakeaways: [
          "SanatanMarga protects visual dignity: Ads are clearly marked with 'विज्ञापन (Advertisement)'.",
          "If no paid campaign is active for a slot, high-value internal promotions (Store, Academy) automatically render.",
          "Ad tracking utilizes anonymous client telemetry without invasive third-party tracking cookies."
        ],
        annotatedFeatures: [
          {
            title: "Standardized Ad Slots",
            description: "Responsive slots optimized for 728x90, 300x250, and 320x50 mobile formats.",
            tag: "Ad Tech"
          },
          {
            title: "House Ad Fallback Engine",
            description: "Ensures 100% fill rate with culturally enriching platform promotions.",
            tag: "Design Integrity"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Open Admin Revenue Console",
            instructions: "Navigate to /admin/revenue or /admin/revenue-os."
          },
          {
            stepNumber: 2,
            title: "Review Active Campaigns",
            instructions: "Inspect running banner campaigns, start/end dates, and daily impression caps."
          },
          {
            stepNumber: 3,
            title: "Create a Campaign",
            instructions: "Click 'नयाँ क्याम्पेन', upload banner creative, enter target destination URL, and activate."
          }
        ],
        workflowDiagramType: "revenue"
      },
      {
        id: "revenue-2",
        title: "Advertiser Portal & Real-time Telemetry",
        titleNepali: "विज्ञापनदाता पोर्टल र प्रत्यक्ष प्रभाव मापन",
        durationMinutes: 8,
        description: "How corporate brands and institutions monitor their campaigns in the self-service Advertiser Portal.",
        descriptionNepali: "व्यावसायिक ब्रान्ड तथा संस्थाहरूले आफ्ना विज्ञापनको प्रभाव मापन गर्ने पोर्टलको प्रयोग।",
        learningObjectives: [
          "Navigate the public Advertiser Dashboard at /advertiser",
          "Track verified impressions, click-through rates (CTR), and demographic reach",
          "Generate professional proof-of-performance billing reports"
        ],
        keyTakeaways: [
          "Clients receive transparent, verifiable metrics without bot inflation.",
          "Advertisers can target specific categories (e.g. Economy or Technology readers).",
          "Sponsor audio spots on Sanatan Radio offer unprecedented captive audio engagement."
        ],
        annotatedFeatures: [
          {
            title: "Advertiser Portal (/advertiser)",
            description: "Self-service dashboard displaying real-time impressions, clicks, and remaining balance.",
            tag: "Client Portal"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Visit Advertiser Portal",
            instructions: "Go to /advertiser or /advertiser/dashboard to explore the client view."
          },
          {
            stepNumber: 2,
            title: "Filter by Date Range",
            instructions: "Select a custom date range to see daily impression spikes and top-performing banners."
          },
          {
            stepNumber: 3,
            title: "Export Performance Report",
            instructions: "Click 'Download Summary' to export a PDF report for stakeholders."
          }
        ]
      }
    ]
  },
  {
    id: "track-governance-audit",
    slug: "governance-audit-training",
    number: 9,
    title: "GovernanceOS & Sovereign Audit Architecture",
    titleNepali: "सुशासन, अनुमति प्रणाली र अडिट लेजर",
    tagline: "Enterprise RBAC Security, Four-Eyes Publishing Approval, and Immutable System Audit Trails",
    taglineNepali: "सुरक्षित भूमिका व्यवस्थापन, दोहोरो स्वीकृति र अकाट्य प्रणाली अडिट लेजर",
    targetPersonas: ["Governance Officers", "Security Auditors", "Compliance Leads", "Admins"],
    targetPersonasNepali: ["सुशासन अधिकृत", "सुरक्षा अडिटर", "अनुपालन प्रमुख", "प्रशासक"],
    iconName: "ShieldCheck",
    color: "purple",
    gradient: "from-purple-500/20 via-violet-500/10 to-transparent",
    level: "Advanced",
    estimatedTime: "40 mins",
    associatedCertId: "cert_platform_admin",
    diagramTitle: "RBAC Permission Matrix & Four-Eyes Approval Flow",
    diagramDescription: "Hierarchical privilege boundaries separating Readers, Journalists, Editors, and Platform SuperAdmins.",
    lessons: [
      {
        id: "governance-1",
        title: "Role-Based Access Control (RBAC) & Privileges",
        titleNepali: "भूमिकामा आधारित पहुँच नियन्त्रण (RBAC)",
        durationMinutes: 12,
        description: "Understand the granular permission matrix: Who can write, who can edit, who can publish, and who can modify system settings.",
        descriptionNepali: "कसले लेख्ने, कसले सम्पादन गर्ने, कसले प्रकाशन गर्ने र कसले सेटिङ बदल्न पाउने भन्ने नियम बुझ्नुहोस्।",
        learningObjectives: [
          "Examine the roles: SuperAdmin, Admin, Editor, Journalist, Contributor, Reader",
          "Understand how ProtectedPermissionRoute shields sensitive admin endpoints",
          "Safely assign and revoke privileges in /admin/users"
        ],
        keyTakeaways: [
          "Principle of Least Privilege: Users only receive the rights necessary for their tasks.",
          "Journalists can submit drafts, but only certified Editors can approve public publishing.",
          "Permission changes are logged in the immutable audit ledger with timestamp and administrator ID."
        ],
        annotatedFeatures: [
          {
            title: "User Management Console (/admin/users)",
            description: "Search users, assign role badges, and toggle permissions with one click.",
            tag: "Security"
          },
          {
            title: "ProtectedPermissionRoute",
            description: "Frontend and backend dual-layer route enforcement preventing privilege escalation.",
            tag: "Zero-Trust"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Access User Management",
            instructions: "Navigate to /admin/users (requires users.manage permission)."
          },
          {
            stepNumber: 2,
            title: "Inspect Role Badges",
            instructions: "Observe the color-coded badges: Admin (Purple), Editor (Blue), Reader (Green)."
          },
          {
            stepNumber: 3,
            title: "Modify a Role",
            instructions: "Upgrade a trusted writer from 'Reader' to 'Journalist' to enable article drafting."
          }
        ],
        workflowDiagramType: "rbac"
      },
      {
        id: "governance-2",
        title: "Immutable Audit Ledger & Compliance Reviews",
        titleNepali: "अपरिवर्तनीय अडिट लेजर र कानूनी अनुपालन",
        durationMinutes: 10,
        description: "Trace every critical platform action: Article edits, deletions, role grants, breaking alerts, and configuration adjustments.",
        descriptionNepali: "प्रणालीमा भएका हरेक परिवर्तन, सम्पादन, डिलिसन र सेटिङ परिवर्तनको अकाट्य अभिलेख।",
        learningObjectives: [
          "Audit historical entries in /admin/audit and /admin/governance",
          "Identify who published or modified an article during breaking news",
          "Comply with national media transparency and digital privacy regulations"
        ],
        keyTakeaways: [
          "Audit logs cannot be secretly altered or deleted by staff members.",
          "Every action records actor ID, user agent, IP hash, and timestamp.",
          "The Transparency page (/transparency) provides public accountability metrics."
        ],
        annotatedFeatures: [
          {
            title: "Audit Center (/admin/audit)",
            description: "Live search and filter across all system events and operator logs.",
            tag: "Accountability"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Open Audit Center",
            instructions: "Navigate to /admin/audit or /admin/governance."
          },
          {
            stepNumber: 2,
            title: "Filter by Event Type",
            instructions: "Select 'Article Published' or 'Permission Modified' to see recent administrative actions."
          },
          {
            stepNumber: 3,
            title: "Verify Public Transparency",
            instructions: "Visit /transparency to inspect the public-facing governance report."
          }
        ]
      }
    ]
  },
  {
    id: "track-admin-mission-control",
    slug: "admin-mission-control-training",
    number: 10,
    title: "Admin Mission Control & SnapshotOS",
    titleNepali: "प्रशासकीय मिसन कन्ट्रोल तथा स्न्यापसट ओएस",
    tagline: "Total Command of Platform Telemetry, Multi-Tier Resilience, and Disaster Recovery",
    taglineNepali: "प्रणालीको सम्पूर्ण टेलिमेट्री, बहु-तह सुरक्षा र विपद् पुनरुत्थानको नेतृत्व",
    targetPersonas: ["System Administrators", "DevOps Engineers", "Technical Directors", "CTO"],
    targetPersonasNepali: ["प्रणाली प्रशासक", "डेभअप्स इन्जिनियर", "प्राविधिक निर्देशक", "प्रमुख प्रविधि अधिकृत"],
    iconName: "LayoutDashboard",
    color: "rose",
    gradient: "from-rose-500/20 via-red-500/10 to-transparent",
    level: "Executive",
    estimatedTime: "50 mins",
    associatedCertId: "cert_platform_admin",
    diagramTitle: "Multi-Tier Resilience & SnapshotOS Fallback Architecture",
    diagramDescription: "How SanatanMarga survives database outages by gracefully cascading from Firestore to IndexedDB and Static JSON Snapshots.",
    lessons: [
      {
        id: "admin-1",
        title: "Platform Health, Telemetry & NavigationOS",
        titleNepali: "प्रणाली स्वास्थ्य, टेलिमेट्री र नेभिगेसन ओएस",
        durationMinutes: 14,
        description: "Monitor live application pulse: Route health, API latency, Firestore quotas, Gemini AI consumption, and memory usage.",
        descriptionNepali: "प्रणालीको प्रत्यक्ष अवस्था: रुट स्वास्थ्य, एपिआइ गति, फायरस्टोर कोटा र जेमिनाई एआई खपत मापन।",
        learningObjectives: [
          "Understand the health check assertions in assertNavigationOSHealth()",
          "Monitor AI API token quotas to prevent 429 RESOURCE_EXHAUSTED errors",
          "Inspect server-side health at /api/health and /admin/system-health"
        ],
        keyTakeaways: [
          "NavigationOS actively tests internal links to prevent 404 broken routes.",
          "When Gemini AI quota approaches 90%, the system switches to scheduled batching.",
          "Real-time telemetry reports active listeners, concurrent readers, and server response time."
        ],
        annotatedFeatures: [
          {
            title: "Mission Control Dashboard (/admin/mission-control)",
            description: "High-density cockpit showing system pulse, active users, and error rates.",
            tag: "Central Cockpit"
          },
          {
            title: "AI Observability (/admin/ai-observability)",
            description: "Detailed breakdown of Gemini model latency, token costs, and grounding accuracy.",
            tag: "AI Telemetry"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Enter Mission Control",
            instructions: "Navigate to /admin/mission-control or /admin/platform-health."
          },
          {
            stepNumber: 2,
            title: "Review Health Status Cards",
            instructions: "Confirm that Database, Media CDN, AI Grounding, and Static Cache all show green 'OPTIMAL'."
          },
          {
            stepNumber: 3,
            title: "Run System Diagnostic",
            instructions: "Click 'Run Diagnostic Scan' to test all 18 production smoke-test subsystems."
          }
        ],
        workflowDiagramType: "snapshot"
      },
      {
        id: "admin-2",
        title: "SnapshotOS Multi-Tier Offline Architecture",
        titleNepali: "स्न्यापसट ओएस बहु-तह अफलाइन आर्किटेक्चर",
        durationMinutes: 14,
        description: "Why SanatanMarga never dies: The three-tier fallback architecture (Firestore -> IndexedDB/LocalCache -> Static Snapshot).",
        descriptionNepali: "किन सनातनमार्ग कहिल्यै बन्द हुँदैन: फायरस्टोर, इन्डेक्सडिडिबी र स्ट्याटिक स्न्यापसटको तीन-तह प्रणाली।",
        learningObjectives: [
          "Understand how snapshotEngine generates static cache at /cache/*.json",
          "Test offline survival by simulating complete network disconnection",
          "Rehydrate and generate fresh snapshots on demand in /admin/disaster-recovery"
        ],
        keyTakeaways: [
          "If cloud databases experience an outage, readers see zero downtime via static snapshots.",
          "Snapshots contain full homepage data, categories, and top 50 recent verified articles.",
          "Rehydration automatically detects schema changes and synchronizes transparently."
        ],
        annotatedFeatures: [
          {
            title: "Snapshot Engine (/src/services/snapshotEngine.ts)",
            description: "Sovereign data archiving and client fallback recovery framework.",
            tag: "Resilience"
          },
          {
            title: "Disaster Recovery Console (/admin/disaster-recovery)",
            description: "One-click snapshot generation, cache flush, and database rollback controls.",
            tag: "Disaster Preparedness"
          }
        ],
        stepByStepGuide: [
          {
            stepNumber: 1,
            title: "Inspect Static Snapshot",
            instructions: "Check browser Network tab for /cache/homepage_snapshot.json and observe the instantaneous HTTP 200 load."
          },
          {
            stepNumber: 2,
            title: "Simulate Offline Mode",
            instructions: "In DevTools Network tab, choose 'Offline' and reload the homepage—observe seamless rendering."
          },
          {
            stepNumber: 3,
            title: "Trigger Snapshot Rebuild",
            instructions: "In /admin/disaster-recovery, click 'Generate Fresh Snapshot' to capture the latest state."
          }
        ]
      }
    ]
  }
];

// 8 Official SanatanMarga Certifications with Complete Quiz Banks
export const CERTIFICATIONS: CertificationPath[] = [
  {
    id: "cert_reader",
    code: "SM-CERT-RDR",
    title: "SanatanMarga Certified Reader",
    titleNepali: "सनातनमार्ग प्रमाणित पाठक",
    role: "Reader & Civilizational Scholar",
    roleNepali: "पाठक तथा सभ्यता अन्वेषक",
    description: "Demonstrates comprehensive mastery of news discovery, fact verification checking, audio streaming, and respectful community discourse in Sanatan Chautari.",
    descriptionNepali: "समाचार खोज, तथ्य प्रमाण परीक्षण, अडियो सुन्ने सुविधा र चौतारीमा सभ्य विमर्शको पूर्ण ज्ञान प्रमाणित गर्दछ।",
    prerequisites: ["Welcome to SanatanMarga", "Reader & Community Scholar Training"],
    passingScorePercent: 75,
    badgeIcon: "BookOpen",
    accentColor: "blue",
    trackId: "track-reader",
    questions: [
      {
        id: "q_rdr_1",
        question: "What is SanatanMarga's foundational editorial policy regarding news publication?",
        questionNepali: "समाचार प्रकाशन सम्बन्धमा सनातनमार्गको आधारभूत सम्पादकीय नीति कुन हो?",
        options: [
          "Publish first, verify later to capture traffic",
          "No Source = No Story (strictly require real verifiable sources)",
          "Allow rumors if trending on social media",
          "Publish only government-issued press releases"
        ],
        optionsNepali: [
          "पहिला समाचार छाप्ने, पछि पुष्टि गर्ने",
          "प्रमाण छैन त समाचार छैन (No Source = No Story)",
          "सामाजिक सञ्जालमा भाइरल भए जे पनि छाप्ने",
          "सरकारी विज्ञप्ति मात्र छाप्ने"
        ],
        correctAnswerIndex: 1,
        explanation: "SanatanMarga enforces a fail-closed policy: If an event lacks verified, authoritative sources, it will never be generated or published.",
        explanationNepali: "सनातनमार्गले प्रमाण नभएका कुनै पनि घटनालाई समाचारको रूपमा प्रकाशन गर्दैन।"
      },
      {
        id: "q_rdr_2",
        question: "How can readers quickly jump to any district, category, or command in the platform?",
        questionNepali: "पाठकले कुनै पनि जिल्ला, विधा वा आदेशमा तुरुन्तै कसरी पुग्न सक्छन्?",
        options: [
          "Only by scrolling to the bottom footer",
          "By pressing the universal Command Palette shortcut (Cmd+K / Ctrl+K)",
          "By sending an email to the support desk",
          "By refreshing the browser 3 times"
        ],
        optionsNepali: [
          "फुटरसम्म स्क्रोल गरेर मात्र",
          "कमान्ड प्यालेट सर्टकट (Cmd+K / Ctrl+K) थिचेर",
          "इमेल पठाएर",
          "ब्राउजर रिफ्रेस गरेर"
        ],
        correctAnswerIndex: 1,
        explanation: "The Smart Command Palette (Cmd+K) provides instant universal search across all 77 districts, news topics, scriptures, and live features.",
        explanationNepali: "Cmd+K वा Ctrl+K थिचेर सिधै कमान्ड प्यालेटबाट कुनै पनि पृष्ठमा पुग्न सकिन्छ।"
      },
      {
        id: "q_rdr_3",
        question: "Where can readers listen to live 24/7 continuous spiritual music, chanting, and news bulletins?",
        questionNepali: "पाठकले २४/७ निरन्तर भजन, मन्त्र र समाचार बुलेटिन कहाँ सुन्न सक्छन्?",
        options: [
          "Only on FM radio stations in Kathmandu",
          "In the dedicated RadioOS player at /radio and the persistent audio bar",
          "By downloading raw MP3 files manually",
          "On external third-party video sites"
        ],
        optionsNepali: [
          "काठमाडौँका एफएम रेडियोमा मात्र",
          "/radio वा तल देखिने अडियो प्लेयर पट्टीमा",
          "एमपीथ्री फाइल डाउनलोड गरेर",
          "अन्य भिडियो वेबसाइटमा गएर"
        ],
        correctAnswerIndex: 1,
        explanation: "RadioOS provides a persistent, uninterrupted 24/7 streaming player that continues playing while navigating across the entire application.",
        explanationNepali: "सनातन रेडियोले पृष्ठ परिवर्तन गर्दा पनि नरोकिने निरन्तर २४/७ प्रसारण दिन्छ।"
      },
      {
        id: "q_rdr_4",
        question: "What does the 72-hour Freshness Gate ensure for articles in the 'Latest News' stream?",
        questionNepali: "'ताजा समाचार' मा ७२-घण्टाको नियमले के सुनिश्चित गर्छ?",
        options: [
          "Articles are automatically deleted after 72 hours",
          "Only stories published within the last 72 hours are qualified as current news",
          "Readers can only read articles for 72 hours before paying",
          "Staff members must rest every 72 hours"
        ],
        optionsNepali: [
          "७२ घण्टापछि समाचार डिलिट हुन्छ",
          "पछिल्लो ७२ घण्टाभित्र प्रमाणित भएका समाचार मात्र ताजा सूचीमा आउँछन्",
          "७२ घण्टापछि पैसा तिर्नुपर्छ",
          "कर्मचारीले ७२ घण्टामा बिदा पाउँछन्"
        ],
        correctAnswerIndex: 1,
        explanation: "Articles older than 72 hours are classified as archives and cannot be presented as breaking or latest events.",
        explanationNepali: "७२ घण्टाभन्दा पुराना समाचारलाई ताजा समाचारको रूपमा प्रस्तुत गर्न पाइँदैन।"
      }
    ]
  },
  {
    id: "cert_journalist",
    code: "SM-CERT-JRN",
    title: "SanatanMarga Certified Journalist",
    titleNepali: "सनातनमार्ग प्रमाणित पत्रकार",
    role: "Field Correspondent & Investigative Reporter",
    roleNepali: "स्थलगत संवाददाता तथा खोज पत्रकार",
    description: "Validates expertise in AI newsroom discovery, source corroboration, district-level reporting, and ethical factual storytelling.",
    descriptionNepali: "एआई खोज इन्जिन, स्रोत प्रमाणीकरण, जिल्लागत समाचार संकलन र तथ्यमा आधारित पत्रकारिताको दक्षता प्रमाणित गर्दछ।",
    prerequisites: ["AI Newsroom OS & Fact Verification", "Welcome to SanatanMarga"],
    passingScorePercent: 80,
    badgeIcon: "Sparkles",
    accentColor: "purple",
    trackId: "track-ai-newsroom",
    questions: [
      {
        id: "q_jrn_1",
        question: "What happens if a discovered news candidate only has a search query URL (e.g. google.com/search) rather than a direct publisher link?",
        questionNepali: "यदि खोजिएको समाचारमा सिधा प्रकाशकको लिङ्क नभएर सर्च इन्जिनको URL मात्र भए के हुन्छ?",
        options: [
          "The system fabricates a placeholder link to proceed",
          "The candidate is rejected with DISCOVERY_FAILED_NO_VERIFIED_SOURCES",
          "The AI generates an article and guesses the sources",
          "The story is immediately published to trending"
        ],
        optionsNepali: [
          "प्रणालीले आफैँ नक्कली लिङ्क बनाएर अघि बढ्छ",
          "DISCOVERY_FAILED_NO_VERIFIED_SOURCES भन्दै अस्वीकार हुन्छ",
          "एआईले मनगढन्ते स्रोत अनुमान गर्छ",
          "तुरुन्तै ट्रेन्डिङमा छापिन्छ"
        ],
        correctAnswerIndex: 1,
        explanation: "SanatanMarga strictly rejects search URLs or fake placeholder domains. A real, verified publisher domain is mandatory.",
        explanationNepali: "सर्च क्वेरी वा अमान्य लिङ्क भएका समाचारहरू तुरुन्तै अस्वीकृत हुन्छन्।"
      },
      {
        id: "q_jrn_2",
        question: "Why does the timestamp parser reject ambiguous relative terms like 'आज' or 'हिजो' without explicit timestamps?",
        questionNepali: "समय पार्सरले किन स्पष्ट मिति नभएका 'आज' वा 'हिजो' जस्ता शब्दहरूलाई अस्वीकार गर्छ?",
        options: [
          "Because Nepali terms are not supported in computers",
          "To prevent fabricating inaccurate publication dates that could misrepresent stale events as fresh",
          "Because journalists must only write in English",
          "Because articles must be published at midnight"
        ],
        optionsNepali: [
          "कम्प्युटरमा नेपाली नबुझिने भएकाले",
          "पुराना समाचारलाई ताजा भनी नक्कली समय सिर्जना हुन नदिन",
          "अंग्रेजीमा मात्र लेख्नुपर्ने भएकाले",
          "मध्यरातमा मात्र समाचार छाप्नुपर्ने भएकाले"
        ],
        correctAnswerIndex: 1,
        explanation: "Inventing an arbitrary hour for 'today' or 'yesterday' risks presenting stale news as fresh. An authoritative timestamp is required.",
        explanationNepali: "मनगढन्ते समय बनाएर पाठकलाई झुक्याउन नदिन स्पष्ट मिति अनिवार्य गरिएको हो।"
      },
      {
        id: "q_jrn_3",
        question: "What is the minimum number of independent sources required to verify an ordinary non-breaking event?",
        questionNepali: "सामान्य (गैर-ब्रेकिङ) समाचार प्रमाणित गर्न कम्तीमा कतिवटा स्वतन्त्र स्रोत आवश्यक पर्दछ?",
        options: [
          "Zero sources are needed if written nicely",
          "At least two independent, corroborated sources",
          "Only one anonymous rumor",
          "Ten sources from the same media group"
        ],
        optionsNepali: [
          "राम्रो भाषा भए स्रोत चाहिँदैन",
          "कम्तीमा २ वटा स्वतन्त्र प्रमाणित स्रोतहरू",
          "एउटा अपुष्ट हल्ला भए पुग्छ",
          "एउटै मिडियाका १० वटा लिङ्क"
        ],
        correctAnswerIndex: 1,
        explanation: "Non-breaking analysis requires corroboration from at least two distinct, independent publishers.",
        explanationNepali: "गैर-ब्रेकिङ समाचारका लागि कम्तीमा दुई स्वतन्त्र स्रोतको पुष्ट्याइँ चाहिन्छ।"
      },
      {
        id: "q_jrn_4",
        question: "When drafting an article in the SanatanMarga Editor, what should a journalist do regarding image credits?",
        questionNepali: "सनातनमार्ग सम्पादकमा लेख तयार गर्दा तस्बिरको प्रतिलिपि अधिकार सम्बन्धमा के गर्नुपर्छ?",
        options: [
          "Take random images from Google Images without credit",
          "Always provide explicit photographer/agency attribution and descriptive alt-text",
          "Claim all photos were taken by themselves",
          "Never attach any images to articles"
        ],
        optionsNepali: [
          "गुगलबाट बिना नाम तस्बिर चोर्ने",
          "फोटो खिच्ने व्यक्ति वा एजेन्सीको स्पष्ट नाम र क्याप्सन उल्लेख गर्ने",
          "सबै फोटो मेरै हो भन्ने",
          "फोटो कहिल्यै नराख्ने"
        ],
        correctAnswerIndex: 1,
        explanation: "Intellectual property and ethical respect require clear photo attribution and descriptive alt-text.",
        explanationNepali: "तस्बिरको स्पष्ट स्रोत, फोटोग्राफरको नाम र क्याप्सन अनिवार्य हुन्छ।"
      }
    ]
  },
  {
    id: "cert_editor",
    code: "SM-CERT-EDT",
    title: "SanatanMarga Certified Editor",
    titleNepali: "सनातनमार्ग प्रमाणित सम्पादक",
    role: "Senior Newsroom Editor & Truth Guardian",
    roleNepali: "वरिष्ठ सम्पादक तथा तथ्य संरक्षक",
    description: "Certifies four-eyes approval competence, fact corroboration audit, headline accuracy, breaking news dispatch, and editorial ethics.",
    descriptionNepali: "दोहोरो स्वीकृति प्रक्रिया, तथ्य अडिट, शीर्षक शुद्धता र सम्पादकीय आचारसंहिताको उच्च ज्ञान प्रमाणित गर्दछ।",
    prerequisites: ["AI Newsroom OS & Fact Verification", "GovernanceOS & Sovereign Audit Architecture"],
    passingScorePercent: 80,
    badgeIcon: "ShieldCheck",
    accentColor: "purple",
    trackId: "track-ai-newsroom",
    questions: [
      {
        id: "q_edt_1",
        question: "What is the purpose of the 'Four-Eyes Principle' in the SanatanMarga publishing workflow?",
        questionNepali: "सनातनमार्गको प्रकाशन विधिमा 'दोहोरो स्वीकृति (Four-Eyes Principle)' को उद्देश्य के हो?",
        options: [
          "Requiring two pairs of glasses while typing",
          "Ensuring no single person can unilaterally write and publish without independent editorial review",
          "Printing two copies of every newspaper",
          "Requiring two passwords to log in"
        ],
        optionsNepali: [
          "टाइप गर्दा दुईवटा चस्मा लगाउनु",
          "कुनै पनि व्यक्तिले एकलौटी रूपमा बिना सम्पादकीय जाँच समाचार सिधै छाप्न नपाउने नियम",
          "पत्रिकाका दुई प्रति छाप्नु",
          "दुईवटा पासवर्ड राख्नु"
        ],
        correctAnswerIndex: 1,
        explanation: "The four-eyes principle mandates that drafted articles undergo independent review by a certified editor before reaching readers.",
        explanationNepali: "कुनै पनि लेख पाठकसमक्ष पुग्नुअघि अर्को सम्पादकले दोहोरो जाँच गर्नैपर्छ।"
      },
      {
        id: "q_edt_2",
        question: "If a breaking news draft contains an unsubstantiated emotional claim, what must the Editor do?",
        questionNepali: "यदि ब्रेकिङ समाचारमा भावनात्मक र अपुष्ट दाबी समावेश भए सम्पादकले के गर्नुपर्छ?",
        options: [
          "Make the headline even more exaggerated to get clicks",
          "Remove the unverified claim or send the draft back to the reporter for factual citation",
          "Ignore the claim because breaking news doesn't need truth",
          "Delete the entire website"
        ],
        optionsNepali: [
          "भ्युज पाउन शीर्षक अझै उत्तेजक बनाउने",
          "अपुष्ट दाबी हटाउने वा ठोस प्रमाण ल्याउन पत्रकारलाई फिर्ता पठाउने",
          "ब्रेकिङ न्युजमा सत्य चाहिँदैन भनेर बेवास्ता गर्ने",
          "वेबसाइट नै डिलिट गर्ने"
        ],
        correctAnswerIndex: 1,
        explanation: "Editors are the truth guardians: Clickbait and unsubstantiated claims must be expunged before publication.",
        explanationNepali: "सम्पादकले अपुष्ट दाबी हटाएर तथ्यपरक प्रमाण मात्र राख्नुपर्छ।"
      },
      {
        id: "q_edt_3",
        question: "What happens to the static snapshot cache immediately when an Editor publishes a new article?",
        questionNepali: "सम्पादकले नयाँ समाचार प्रकाशित गर्नासाथ स्न्यापसट क्यासमा के हुन्छ?",
        options: [
          "Nothing changes for 24 hours",
          "The cache is selectively invalidated so readers immediately receive the updated feed",
          "All previous articles are wiped out",
          "The server restarts completely"
        ],
        optionsNepali: [
          "२४ घण्टासम्म केही परिवर्तन हुँदैन",
          "क्यास तुरुन्तै अद्यावधिक भई पाठकले नयाँ समाचार देख्न पाउँछन्",
          "पुराना सबै समाचार हराउँछन्",
          "सर्भर नै बन्द हुन्छ"
        ],
        correctAnswerIndex: 1,
        explanation: "Publishing triggers automated cache invalidation, ensuring readers see fresh updates without latency.",
        explanationNepali: "प्रकाशनपछि क्यास स्वतः अपडेट भएर पाठकलाई ताजा समाचार पुग्छ।"
      },
      {
        id: "q_edt_4",
        question: "How are retraction or correction notices handled on SanatanMarga if an error is identified post-publication?",
        questionNepali: "प्रकाशनपछि समाचारमा कुनै गल्ती भेटिएमा सनातनमार्गमा कसरी सच्याइन्छ?",
        options: [
          "Secretly delete the article and pretend it never existed",
          "Add a transparent, timestamped 'सम्पादकीय सच्याइ (Editorial Correction)' note explaining the change",
          "Blame the junior intern publicly",
          "Deny all errors"
        ],
        optionsNepali: [
          "चुपचाप डिलिट गरेर केही भएकै छैन जस्तो गर्ने",
          "स्पष्ट समय खुलाएर 'सम्पादकीय सच्याइ' नोटसहित पारदर्शिता जनाउने",
          "सहयोगी कर्मचारीलाई दोष दिने",
          "गल्ती स्वीकार नगर्ने"
        ],
        correctAnswerIndex: 1,
        explanation: "Journalistic credibility demands transparent, visible corrections rather than stealth deletions.",
        explanationNepali: "गल्ती भएमा मिति र समयसहित खुला रूपमा सच्याइएको सूचना राखिन्छ।"
      }
    ]
  },
  {
    id: "cert_media_operator",
    code: "SM-CERT-MED",
    title: "SanatanMarga Certified Media Operator",
    titleNepali: "सनातनमार्ग प्रमाणित मिडिया अपरेटर",
    role: "Broadcast Engineer & Audio/Video Director",
    roleNepali: "प्रसारण इन्जिनियर तथा अडियो/भिडियो निर्देशक",
    description: "Covers 24/7 RadioOS stream management, audio schedule automation, LiveOS video relays, and media asset CDN optimization.",
    descriptionNepali: "रेडियो प्रसारण सञ्चालन, अडियो तालिका, प्रत्यक्ष भिडियो रिले र मिडिया अप्टिमाइजेसनको पूर्ण ज्ञान।",
    prerequisites: ["MediaOS, RadioOS & Live Broadcasting"],
    passingScorePercent: 80,
    badgeIcon: "Radio",
    accentColor: "red",
    trackId: "track-media-os",
    questions: [
      {
        id: "q_med_1",
        question: "Why is persistent audio playback a core architectural feature of SanatanMarga?",
        questionNepali: "सनातनमार्गमा पृष्ठ परिवर्तन गर्दा पनि अडियो निरन्तर बजिरहने सुविधा किन राखिएको हो?",
        options: [
          "To force users to listen against their will",
          "To allow continuous listening to bhajans, mantras, and news bulletins while freely browsing the site",
          "Because browsers require constant sound",
          "To consume extra mobile data"
        ],
        optionsNepali: [
          "पाठकलाई जबरजस्ती सुनाउन",
          "पाठकले समाचार वा ग्रन्थ पढ्दै गर्दा पनि भजन र समाचार नरोकिई सुन्न सकून् भनेर",
          "ब्राउजरको नियम भएर",
          "मोबाइल डाटा धेरै खर्च गर्न"
        ],
        correctAnswerIndex: 1,
        explanation: "Persistent state management in MediaOSProvider keeps audio streaming seamlessly across page transitions.",
        explanationNepali: "पाठकले वेबसाइटका अन्य पृष्ठहरू पढ्दा पनि रेडियो वा अडियो नरोकिई बजिरहन्छ।"
      },
      {
        id: "q_med_2",
        question: "What image format does MediaOS prefer for all uploaded newsroom assets to maximize speed in Nepal?",
        questionNepali: "नेपालको इन्टरनेट गतिलाई ध्यानमा राखी मिडिया ओएसले तस्बिरका लागि कुन आधुनिक ढाँचा प्राथमिकता दिन्छ?",
        options: [
          "Uncompressed 50MB BMP",
          "Modern optimized WebP or compressed JPEG",
          "GIF animations only",
          "TIFF format"
        ],
        optionsNepali: [
          "५० एमबीको भारी बीएमपी",
          "अत्यन्त हलुका तथा स्पष्ट WebP वा कम्प्रेस्ड JPEG",
          "जीआईएफ एनिमेसन मात्र",
          "टिफ (TIFF) ढाँचा"
        ],
        correctAnswerIndex: 1,
        explanation: "WebP provides superior compression and fast loading even on slower 3G/4G connections across Nepal.",
        explanationNepali: "WebP ले उच्च गुणस्तर कायम राख्दै डाटा धेरै कम खपत गर्दछ।"
      },
      {
        id: "q_med_3",
        question: "How does RadioOS handle an unexpected disconnection from the primary Icecast/HLS broadcast server?",
        questionNepali: "यदि मुख्य प्रसारण सर्भरमा अवरोध आएमा रेडियो ओएसले कसरी व्यवस्थापन गर्छ?",
        options: [
          "Crashes the user's browser",
          "Gracefully fails over to local backup audio tracks and displays a reconnecting indicator",
          "Calls the police",
          "Mutes the computer forever"
        ],
        optionsNepali: [
          "ब्राउजर बन्द गरिदिने",
          "स्वतः वैकल्पिक ब्याकअप ट्रयाक बजाउने र पुनः जोड्ने प्रयास गर्ने",
          "प्रहरीलाई खबर गर्ने",
          "सधैंका लागि आवाज बन्द गर्ने"
        ],
        correctAnswerIndex: 1,
        explanation: "RadioOS features an automatic recovery loop and local audio fallback to maintain seamless user experience.",
        explanationNepali: "मुख्य फिड टुट्दा ब्याकअप अडियो बज्छ र प्रणालीले पुनः जोड्ने प्रयास जारी राख्छ।"
      },
      {
        id: "q_med_4",
        question: "Where can an operator schedule morning Aarati, afternoon Pravachan, and hourly news bulletins?",
        questionNepali: "अपरेटरले बिहानी आरती, दिउँसोको प्रवचन र घण्टे समाचार तालिका कहाँ व्यवस्थापन गर्छन्?",
        options: [
          "In /admin/radio using the visual broadcast scheduler",
          "By writing on a physical whiteboard only",
          "In the customer checkout cart",
          "In the phone settings"
        ],
        optionsNepali: [
          "/admin/radio को दृश्य प्रसारण तालिकाबाट",
          "हातले डायरीमा लेखेर",
          "सपिङ कार्टमा गएर",
          "मोबाइल सेटिङमा"
        ],
        correctAnswerIndex: 0,
        explanation: "The visual scheduler in /admin/radio controls real-time audio track switching and automated hourly announcements.",
        explanationNepali: "/admin/radio मार्फत कुन समयमा कुन अडियो वा कार्यक्रम बज्ने तालिका मिलाउन सकिन्छ।"
      }
    ]
  },
  {
    id: "cert_sgis_researcher",
    code: "SM-CERT-SGIS",
    title: "SanatanMarga Certified SGIS Researcher",
    titleNepali: "सनातनमार्ग प्रमाणित एसजिआइएस अनुसन्धानकर्ता",
    role: "Manuscript Specialist & Epigraphist",
    roleNepali: "पाण्डुलिपि विशेषज्ञ तथा अभिलेख अनुसन्धाता",
    description: "Validates expertise in ancient manuscript scanning, Licchavi/Newari OCR correction, semantic knowledge graph linking, and civilizational research.",
    descriptionNepali: "प्राचीन पाण्डुलिपि डिजिटलाइजेसन, लिच्छवि/नेवारी ओसिआर, ज्ञान सञ्जाल र सभ्यतागत अनुसन्धानको दक्षता।",
    prerequisites: ["SGIS: Sanatan Geospatial & Knowledge Intelligence"],
    passingScorePercent: 80,
    badgeIcon: "Scroll",
    accentColor: "cyan",
    trackId: "track-sgis",
    questions: [
      {
        id: "q_sgis_1",
        question: "What is the primary role of the SGIS (Sanatan Geospatial & Knowledge Intelligence) system?",
        questionNepali: "एसजिआइएस (SGIS) प्रणालीको मुख्य काम के हो?",
        options: [
          "Selling plane tickets to foreign countries",
          "Digitizing, transcribing, and linking ancient manuscripts, inscriptions, and cultural shrines into a semantic knowledge graph",
          "Playing video games",
          "Replacing real professors with fictional characters"
        ],
        optionsNepali: [
          "हवाई टिकट बेच्ने",
          "प्राचीन पाण्डुलिपि, शिलालेख र धार्मिक स्थललाई डिजिटलाइज गरी ज्ञान सञ्जालमा जोड्ने",
          "भिडियो गेम खेलाउने",
          "विद्वानहरूको सट्टा काल्पनिक पात्र खडा गर्ने"
        ],
        correctAnswerIndex: 1,
        explanation: "SGIS preserves civilizational heritage by digitizing manuscripts and interconnecting shrines, dynasties, and texts.",
        explanationNepali: "ऐतिहासिक सम्पदा, ताडपत्र र शिलालेखलाई डिजिटल प्रविधिबाट सुरक्षित राख्ने काम एसजिआइएसको हो।"
      },
      {
        id: "q_sgis_2",
        question: "Why is side-by-side human review essential after running automated OCR on historical palm-leaf manuscripts?",
        questionNepali: "प्राचीन पाण्डुलिपिको ओसिआरपछि मानव विशेषज्ञद्वारा दोहोरो जाँच किन अनिवार्य हुन्छ?",
        options: [
          "Because machines can misread archaic ligatures, faded ink, and scribal variations",
          "It is not needed; machines are always 100% infallible",
          "To waste time",
          "Because computers cannot read Sanskrit text at all"
        ],
        optionsNepali: [
          "पुरानो लिपि, खुइलिएको मसी र संयुक्त अक्षर मेसिनले गल्ती पढ्न सक्ने हुनाले",
          "आवश्यक छैन, मेसिन कहिल्यै गल्ती गर्दैन",
          "समय बिताउन",
          "कम्प्युटरले संस्कृत नबुझ्ने भएकाले"
        ],
        correctAnswerIndex: 0,
        explanation: "Historical epigraphy requires scholarly verification to correct faded ligatures and complex conjunct characters.",
        explanationNepali: "खुइलिएका अक्षर र प्राचीन लिपिका जटिलतालाई मानवीय विद्वताले सच्याउनुपर्छ।"
      },
      {
        id: "q_sgis_3",
        question: "How does the 'Ask Sanatan' conversational AI utilize the SGIS Knowledge Graph?",
        questionNepali: "'आस्क सनातन' एआईले एसजिआइएस ज्ञान सञ्जालको प्रयोग कसरी गर्दछ?",
        options: [
          "It ignores the graph and invents answers randomly",
          "It uses verified nodes (deities, scriptures, shrines) as strict grounding to ensure zero hallucination",
          "It searches social media gossip",
          "It refuses to answer any questions"
        ],
        optionsNepali: [
          "सञ्जाललाई बेवास्ता गरी मनगढन्ते उत्तर दिन्छ",
          "प्रमाणित ग्रन्थ र अभिलेखका नोड्सलाई आधार मानी सत्य उत्तर मात्र दिन्छ",
          "सामाजिक सञ्जालको गफ खोज्छ",
          "कुनै पनि उत्तर दिन अस्वीकार गर्छ"
        ],
        correctAnswerIndex: 1,
        explanation: "Semantic grounding binds the LLM to verified historical nodes, eliminating speculative hallucinations.",
        explanationNepali: "प्रमाणित ज्ञान सञ्जालको आधारमा मात्र उत्तर दिइने भएकाले एआईले काल्पनिक कुरा बोल्दैन।"
      },
      {
        id: "q_sgis_4",
        question: "In the SGIS spatial database, what key attributes must be attached to a historical temple node?",
        questionNepali: "एसजिआइएस नक्सामा कुनै ऐतिहासिक मन्दिर जोड्दा कुन विवरण अनिवार्य चाहिन्छ?",
        options: [
          "Only the price of admission",
          "Geographic coordinates, primary deity, historical dynasty/era, sacred texts referencing it, and district",
          "The name of nearby restaurants only",
          "A random number"
        ],
        optionsNepali: [
          "टिकटको मूल्य मात्र",
          "भौगोलिक अक्षांश/देशान्तर, मुख्य देवता, ऐतिहासिक काल/राजवंश, ग्रन्थ प्रमाण र जिल्ला",
          "नजिकैको चिया पसलको नाम",
          "कुनै पनि मनपरी नम्बर"
        ],
        correctAnswerIndex: 1,
        explanation: "Complete cultural provenance requires spatial coordinates, historical dynasty, and textual citations.",
        explanationNepali: "स्थान, देवता, स्थापना काल, ग्रन्थको सन्दर्भ र जिल्लाको विवरण अनिवार्य हुन्छ।"
      }
    ]
  },
  {
    id: "cert_academy_instructor",
    code: "SM-CERT-INS",
    title: "SanatanMarga Certified Academy Instructor",
    titleNepali: "सनातनमार्ग प्रमाणित अकादेमी शिक्षक",
    role: "Pedagogy Specialist & Curriculum Designer",
    roleNepali: "शिक्षण विधि विशेषज्ञ तथा पाठ्यक्रम निर्माता",
    description: "Covers course syllabus authoring, multimedia lesson creation, randomized anti-cheat exam design, and verified certificate generation.",
    descriptionNepali: "पाठ्यक्रम निर्माण, मल्टिमिडिया पाठ तयारी, परीक्षा सञ्चालन र प्रमाणित डिजिटल प्रमाणपत्र जारी गर्ने विधि।",
    prerequisites: ["AssessmentOS & Academy Course Management"],
    passingScorePercent: 80,
    badgeIcon: "GraduationCap",
    accentColor: "emerald",
    trackId: "track-academy-assessment",
    questions: [
      {
        id: "q_ins_1",
        question: "What makes SanatanMarga Academy completion certificates tamper-proof and verifiable worldwide?",
        questionNepali: "सनातनमार्ग अकादेमीका प्रमाणपत्रहरू विश्वभर प्रमाणीकरण गर्न सकिने र किर्ते हुन नसक्ने कसरी बनाइएका छन्?",
        options: [
          "They are printed on golden paper",
          "They contain a cryptographic SHA-256 HMAC signature and unique serial number verifiable at /verify-certificate",
          "They have an embossed rubber stamp only",
          "They cannot be verified by anyone"
        ],
        optionsNepali: [
          "सुनौलो कागजमा प्रिन्ट गरेर",
          "क्रिप्टोग्राफिक HMAC हस्ताक्षर र अद्वितीय सिरियल नम्बर /verify-certificate मा जाँच गर्न सकिने भएर",
          "रबरको छाप लगाएर मात्र",
          "कसैले पनि जाँच गर्न नसक्ने बनाएर"
        ],
        correctAnswerIndex: 1,
        explanation: "Every certificate has a unique ID and HMAC signature stored securely on the server for instant verification.",
        explanationNepali: "प्रत्येक प्रमाणपत्रमा अद्वितीय सिरियल नम्बर र डिजिटल हस्ताक्षर हुन्छ जसलाई अनलाइन जाँच्न सकिन्छ।"
      },
      {
        id: "q_ins_2",
        question: "When creating an assessment for a certification course, what is the standard recommended passing threshold?",
        questionNepali: "प्रमाणीकरण परीक्षामा सामान्यतया न्यूनतम उत्तीर्णाङ्क कति प्रतिशत राखिन्छ?",
        options: [
          "20% (almost everyone passes without studying)",
          "75% to 80% (ensuring solid mastery of principles)",
          "100% only (zero mistakes allowed on anything)",
          "0% (passing is optional)"
        ],
        optionsNepali: [
          "२०% (नपढ्नेले पनि पाउने)",
          "७५% देखि ८०% (गम्भीर ज्ञान र दक्षता सुनिश्चित गर्न)",
          "१००% मात्र (एउटा पनि गल्ती हुन नहुने)",
          "०% (परीक्षा औपचारिकता मात्र)"
        ],
        correctAnswerIndex: 1,
        explanation: "A 75% to 80% passing threshold guarantees that certified practitioners possess genuine competence.",
        explanationNepali: "७५% देखि ८०% उत्तीर्णाङ्कले विद्यार्थीको वास्तविक क्षमता र ज्ञान प्रमाणित गर्दछ।"
      },
      {
        id: "q_ins_3",
        question: "How does the Academy platform help students track their individual academic progress?",
        questionNepali: "अकादेमीले विद्यार्थीलाई आफ्नो पढाइको प्रगति हेर्न कसरी मद्दत गर्दछ?",
        options: [
          "Students must call the teacher every evening",
          "Through the Student Results Portal (/academy/results) showing completed lessons, scores, and downloadable certificates",
          "By sending postal letters once a year",
          "It does not track progress"
        ],
        optionsNepali: [
          "दिनहुँ शिक्षकलाई फोन गरेर सोध्नुपर्छ",
          "/academy/results पोर्टलमा पूरा भएका पाठ, प्राप्ताङ्क र प्रमाणपत्र देखाएर",
          "वर्षको एक पटक हुलाकबाट चिठी पठाएर",
          "कुनै रेकर्ड नराखेर"
        ],
        correctAnswerIndex: 1,
        explanation: "The Results Portal tracks lesson completions, historical quiz scores, and issued certificates in real time.",
        explanationNepali: "विद्यार्थीले आफ्नो ड्यासबोर्डमा सम्पूर्ण नतिजा र प्रमाणपत्र तुरुन्तै हेर्न सक्छन्।"
      },
      {
        id: "q_ins_4",
        question: "What types of learning content can an instructor embed into a SanatanMarga lesson?",
        questionNepali: "शिक्षकले पाठभित्र कुन-कुन प्रकारका शैक्षिक सामग्री समावेश गर्न सक्छन्?",
        options: [
          "Only plain black-and-white text",
          "Structured Devanagari text, video lectures, audio recitations, downloadable PDF manuscripts, and quizzes",
          "Only external advertising links",
          "Spreadsheet files only"
        ],
        optionsNepali: [
          "सादा अक्षर मात्र",
          "नेपाली/संस्कृत पाठ, भिडियो कक्षा, अडियो मन्त्र, अध्ययन सामग्री (PDF) र अभ्यास प्रश्नहरू",
          "विज्ञापनका लिङ्क मात्र",
          "एक्सेल फाइल मात्र"
        ],
        correctAnswerIndex: 1,
        explanation: "Multimodal learning empowers holistic comprehension of philosophical, historical, and practical concepts.",
        explanationNepali: "भिडियो, अडियो, ग्रन्थ पाठ र प्रश्नोत्तर सबै एउटै पाठमा मिलाउन सकिन्छ।"
      }
    ]
  },
  {
    id: "cert_commerce_manager",
    code: "SM-CERT-COM",
    title: "SanatanMarga Certified Commerce Manager",
    titleNepali: "सनातनमार्ग प्रमाणित वाणिज्य प्रबन्धक",
    role: "Store Administrator & Artisan Liaison",
    roleNepali: "स्टोर प्रशासक तथा शिल्पकार समन्वयकर्ता",
    description: "Validates mastery of cultural merchandise catalogs, inventory control, WhatsApp one-click commerce, and customer order fulfillment.",
    descriptionNepali: "सांस्कृतिक सामग्री सूची, मौज्दात नियन्त्रण, ह्वाट्सएप अर्डर र ग्राहक सेवा व्यवस्थापनको दक्षता।",
    prerequisites: ["Commerce & Store Operations"],
    passingScorePercent: 75,
    badgeIcon: "ShoppingBag",
    accentColor: "green",
    trackId: "track-commerce-store",
    questions: [
      {
        id: "q_com_1",
        question: "Why does Sanatan Store utilize WhatsApp One-Click Direct Checkout as its primary customer flow in Nepal?",
        questionNepali: "सनातन स्टोरले नेपालमा ह्वाट्सएप एक-क्लिक खरिदलाई मुख्य माध्यम किन बनाएको हो?",
        options: [
          "Because online payments do not exist in Nepal",
          "Because direct chat builds high personal trust, simplifies address verification, and allows instant QR payment confirmation without checkout friction",
          "Because WhatsApp owns SanatanMarga",
          "To avoid speaking with customers"
        ],
        optionsNepali: [
          "नेपालमा अनलाइन भुक्तानी नभएर",
          "प्रत्यक्ष संवादले विश्वास बढाउने, ठेगाना स्पष्ट हुने र बिना झन्झट क्यूआरबाट भुक्तानी पुष्टि गर्न सकिने भएकाले",
          "ह्वाट्सएपको स्वामित्व भएकाले",
          "ग्राहकसँग बोल्न नपरोस् भनेर"
        ],
        correctAnswerIndex: 1,
        explanation: "WhatsApp checkout eliminates checkout friction and enables personalized support, building strong customer loyalty.",
        explanationNepali: "ग्राहकले सिधै संवाद गरी ठेगाना र क्यूआर भुक्तानी पठाउन सक्ने भएकाले यो विधि सबैभन्दा प्रभावकारी छ।"
      },
      {
        id: "q_com_2",
        question: "When managing sacred items like Muktinath Shaligram or authentic Rudraksha, what must be included in the product description?",
        questionNepali: "शालिग्राम वा रुद्राक्ष जस्ता पवित्र सामग्री राख्दा विवरणमा के खुलाउनै पर्छ?",
        options: [
          "Fake promises of winning lotteries",
          "Authenticity provenance, physical characteristics (Mukhi, origin), handling care, and sacred origin",
          "Only the price and no other details",
          "Personal opinions only"
        ],
        optionsNepali: [
          "चिठ्ठा पर्छ भन्ने नक्कली दाबी",
          "प्रामाणिकताको स्रोत, मुखी/उत्पत्ति, हेरचाह विधि र धार्मिक मर्यादा",
          "मूल्य मात्र, अरु केही नलेख्ने",
          "व्यक्तिगत गफ"
        ],
        correctAnswerIndex: 1,
        explanation: "Ethical spiritual commerce requires complete transparency regarding origin, authenticity, and proper respect.",
        explanationNepali: "सामग्रीको उत्पत्तिको ठाउँ, प्रामाणिकता र धार्मिक मर्यादा स्पष्ट खुलाउनुपर्छ।"
      },
      {
        id: "q_com_3",
        question: "What happens in the customer-facing store when a product's inventory count reaches zero?",
        questionNepali: "स्टोरमा कुनै सामग्रीको मौज्दात (Stock) शून्य भएमा के देखिन्छ?",
        options: [
          "The website shows an error and crashes",
          "The item displays a clear 'पुनः आउँदैछ (Restocking Soon)' badge and disables checkout to prevent overselling",
          "Customers are still charged money anyway",
          "The item is renamed to another product"
        ],
        optionsNepali: [
          "वेबसाइट क्र्यास हुन्छ",
          "'पुनः आउँदैछ' सन्देश देखिन्छ र सामान सकिएको सूचना पाइन्छ",
          "सामान नभए पनि पैसा काटिन्छ",
          "अर्कै सामानको नाम राखिन्छ"
        ],
        correctAnswerIndex: 1,
        explanation: "Automated inventory guards prevent customer disappointment and overselling.",
        explanationNepali: "सामान सकिएपछि स्वतः सूचना देखिन्छ र ग्राहक झुक्किने अवस्था आउँदैन।"
      },
      {
        id: "q_com_4",
        question: "Where can a commerce manager track sales metrics, popular categories, and customer inquiry volume?",
        questionNepali: "वाणिज्य प्रबन्धकले बिक्री विवरण, लोकप्रिय सामग्री र ग्राहक सोधपुछ कहाँ हेर्न सक्छन्?",
        options: [
          "In /admin/commerce-analytics and /admin/store",
          "In the browser history",
          "On the public homepage footer only",
          "In the phone contacts list"
        ],
        optionsNepali: [
          "/admin/commerce-analytics र /admin/store कन्सोलमा",
          "ब्राउजरको हिस्ट्रीमा",
          "गृहपृष्ठको पुछारमा",
          "फोन बुकमा"
        ],
        correctAnswerIndex: 0,
        explanation: "The commerce dashboard aggregates sales volume, inventory turnover, and customer inquiry trends.",
        explanationNepali: "प्रशासकीय स्टोर कन्सोलमा सम्पूर्ण व्यापारिक विश्लेषण र विवरण उपलब्ध हुन्छ।"
      }
    ]
  },
  {
    id: "cert_platform_admin",
    code: "SM-CERT-ADM",
    title: "SanatanMarga Certified Platform Administrator",
    titleNepali: "सनातनमार्ग प्रमाणित प्रणाली प्रशासक",
    role: "System Architect & Mission Controller",
    roleNepali: "प्रणाली वास्तुकार तथा मिसन कन्ट्रोलर",
    description: "The highest operational certification: Total mastery of SnapshotOS resilience, RBAC governance, AI quota observability, telemetry, and disaster recovery.",
    descriptionNepali: "सर्वोच्च प्राविधिक प्रमाणीकरण: स्न्यापसट ओएस, भूमिका व्यवस्थापन, एआई कोटा, टेलिमेट्री र विपद् व्यवस्थापन।",
    prerequisites: ["Admin Mission Control & SnapshotOS", "GovernanceOS & Sovereign Audit Architecture"],
    passingScorePercent: 85,
    badgeIcon: "LayoutDashboard",
    accentColor: "rose",
    trackId: "track-admin-mission-control",
    questions: [
      {
        id: "q_adm_1",
        question: "What is the three-tier resilience fallback hierarchy that keeps SanatanMarga online during network or database failures?",
        questionNepali: "डेटाबेस वा इन्टरनेट अवरोध हुँदा पनि सनातनमार्गलाई सधैं चालु राख्ने तीन-तहको प्रणाली कुन हो?",
        options: [
          "Cloud SQL -> Excel -> Word",
          "Firestore -> IndexedDB / Local Cache -> Static Snapshot JSON (/cache/*.json)",
          "Internet -> Radio -> Newspaper",
          "Server 1 -> Server 2 -> Server 3"
        ],
        optionsNepali: [
          "क्लाउड एसक्युएल -> एक्सेल -> वर्ड",
          "फायरस्टोर (Firestore) -> स्थानीय क्यास (IndexedDB) -> स्ट्याटिक स्न्यापसट (Static JSON)",
          "इन्टरनेट -> रेडियो -> पत्रिका",
          "सर्भर १ -> सर्भर २ -> सर्भर ३"
        ],
        correctAnswerIndex: 1,
        explanation: "If Firestore fails or is rate-limited, the application cascades to IndexedDB, and finally to static snapshots in /cache/*.json.",
        explanationNepali: "पहिला फायरस्टोर, नभए स्थानीय क्यास र अन्त्यमा स्ट्याटिक स्न्यापसटबाट डाटा खुल्छ।"
      },
      {
        id: "q_adm_2",
        question: "What does the NavigationOS health check (assertNavigationOSHealth) accomplish upon application mount?",
        questionNepali: "एप सुरु हुँदा नेभिगेसन ओएस (assertNavigationOSHealth) ले के गर्दछ?",
        options: [
          "Deletes the database",
          "Validates all core application route mappings, ensuring zero 404 links and healthy AppShell architecture",
          "Changes user passwords",
          "Slows down the browser"
        ],
        optionsNepali: [
          "डेटाबेस डिलिट गर्ने",
          "सबै मुख्य रुटहरू सही छन् भनी जाँच गर्ने र कुनै पनि पृष्ठ नबिग्रिएको सुनिश्चित गर्ने",
          "पासवर्ड बदल्ने",
          "ब्राउजर ढिलो बनाउने"
        ],
        correctAnswerIndex: 1,
        explanation: "NavigationOS actively verifies route integrity at boot time to guarantee zero blank screens or dead ends.",
        explanationNepali: "कुनै पनि लिङ्क वा रुट नबिग्रियोस् भनी प्रणालीले सुरुमै परीक्षण गर्दछ।"
      },
      {
        id: "q_adm_3",
        question: "When monitoring Gemini AI API usage in /admin/ai-observability, what is the critical reason to track quota consumption?",
        questionNepali: "एआई अवलोकन (/admin/ai-observability) मा जेमिनाई कोटा हेर्नु किन महत्वपूर्ण छ?",
        options: [
          "Because AI tokens are unlimited and need no tracking",
          "To proactively prevent 429 RESOURCE_EXHAUSTED errors and maintain smooth autonomous discovery without interruption",
          "To show off colorful charts to visitors",
          "Because the law requires counting tokens"
        ],
        optionsNepali: [
          "कोटा असीमित भएर हेर्नै नपर्ने भएर",
          "४२९ कोटा सकिने (RESOURCE_EXHAUSTED) समस्या आउन नदिन र समाचार खोज नरोकिन",
          "रंगीन चार्ट देखाउन मात्र",
          "कानूनले गन्नुपर्छ भनेकाले"
        ],
        correctAnswerIndex: 1,
        explanation: "Proactive quota monitoring ensures the newsroom paces requests and prevents API rate limits.",
        explanationNepali: "एआई कोटा सकिएर प्रणाली नअड्कियोस् भनी समयमै व्यवस्थापन गर्न टेलिमेट्री चाहिन्छ।"
      },
      {
        id: "q_adm_4",
        question: "In the event of an emergency data corruption, how can an administrator restore the platform to a known good state?",
        questionNepali: "कुनै आपतकालीन समस्या आएमा प्रशासकले प्रणालीलाई कसरी सुरक्षित अवस्थामा फर्काउन सक्छन्?",
        options: [
          "By turning off the electricity",
          "By utilizing Disaster Recovery (/admin/disaster-recovery) to rehydrate and apply a verified snapshot restore",
          "By deleting all user accounts",
          "By starting from scratch"
        ],
        optionsNepali: [
          "बिजुलीको स्विच बन्द गरेर",
          "/admin/disaster-recovery बाट प्रमाणित स्न्यापसट रिस्टोर गरी तुरुन्तै पूर्ववत् बनाएर",
          "सबै प्रयोगकर्ताको खाता मेटेर",
          "सुरुदेखि फेरि बनाएर"
        ],
        correctAnswerIndex: 1,
        explanation: "The Disaster Recovery console enables verified snapshot rollback and instant state recovery.",
        explanationNepali: "विपद् व्यवस्थापन कन्सोलबाट सुरक्षित स्न्यापसटमार्फत प्रणाली तुरुन्तै ब्युँताउन सकिन्छ।"
      }
    ]
  }
];

// Searchable Help Center & Knowledge Base
export const KNOWLEDGE_BASE_ARTICLES: KnowledgeArticle[] = [
  {
    id: "kb-01",
    title: "How to use the Smart Command Palette (Cmd+K)",
    titleNepali: "स्मार्ट कमान्ड प्यालेट (Cmd+K) कसरी प्रयोग गर्ने?",
    category: "Getting Started",
    tags: ["Search", "Keyboard Shortcuts", "Navigation"],
    summary: "Instant navigation across all 77 districts, news topics, scriptures, and admin controls with zero mouse clicks.",
    summaryNepali: "माउस बिना नै ७७ जिल्ला, समाचार, ग्रन्थ र सेटिङमा एकै सेकेन्डमा पुग्ने विधि।",
    steps: [
      "Press Cmd+K on macOS or Ctrl+K on Windows/Linux from any screen.",
      "Type keywords like 'Radio', 'Gita', 'Jhapa', 'Economy', or 'Admin'.",
      "Use Up/Down arrow keys to highlight your destination and hit Enter."
    ],
    troubleshootingTips: [
      "If the shortcut does not trigger, click the Search icon in the header bar.",
      "Ensure your browser extension is not intercepting the Cmd+K keybinding."
    ]
  },
  {
    id: "kb-02",
    title: "Understanding the 'No Source = No Story' Policy",
    titleNepali: "'प्रमाण छैन त समाचार छैन' नीतिको मर्म",
    category: "AI Newsroom",
    tags: ["Editorial", "Fact Checking", "Truth Gate"],
    summary: "Why SanatanMarga will never publish ungrounded rumors or hallucinated AI stories.",
    summaryNepali: "किन सनातनमार्गले अपुष्ट हल्ला वा मनगढन्ते समाचार कहिल्यै प्रकाशित गर्दैन।",
    steps: [
      "Discovery queries execute real Google Search Grounding to extract primary source URLs.",
      "Candidate articles must verify through the 72-hour freshness gate.",
      "At least two independent credible publishers must corroborate the factual evidence."
    ],
    troubleshootingTips: [
      "If discovery returns DISCOVERY_FAILED_NO_VERIFIED_SOURCES, it means no authoritative reports currently exist for that search query.",
      "Never fabricate a URL to force a story through the gate."
    ]
  },
  {
    id: "kb-03",
    title: "Troubleshooting Audio Stream Buffering on RadioOS",
    titleNepali: "रेडियो सुन्दा अड्किने (Buffering) समस्याको समाधान",
    category: "MediaOS",
    tags: ["Radio", "Audio", "Buffering", "Stream"],
    summary: "Quick steps to maintain crystal-clear audio playback even on slow 2G/3G mobile networks.",
    summaryNepali: "कमजोर इन्टरनेटमा पनि रेडियो नअड्किई सुन्ने तरिका।",
    steps: [
      "Click Pause and then Play again to refresh the audio buffer.",
      "Switch to the 'Low Bitrate (64kbps)' mode if available on mobile.",
      "Ensure background data usage is enabled for the SanatanMarga PWA."
    ],
    troubleshootingTips: [
      "If audio stops when your phone locks, verify that your browser has background audio permission.",
      "Clear browser cache if the station stream loops the same 10-second segment."
    ]
  },
  {
    id: "kb-04",
    title: "How to Verify an Official Certificate Online",
    titleNepali: "आधिकारिक प्रमाणपत्र अनलाइन कसरी प्रमाणीकरण गर्ने?",
    category: "Governance",
    tags: ["Certificate", "Verification", "Anti-Forgery", "HMAC"],
    summary: "Check the authenticity of any SanatanMarga certificate in real time using its unique serial number.",
    summaryNepali: "कुनै पनि प्रमाणपत्रको आधिकारिकता सिरियल नम्बर हालेर तुरुन्तै जाँच्ने तरिका।",
    steps: [
      "Navigate to /verify-certificate.",
      "Enter the Certificate ID (e.g. SM-CERT-2026-XXXX) found on the document.",
      "Click 'Verify Certificate' to view student name, course title, issue timestamp, and official digital seal."
    ],
    troubleshootingTips: [
      "Ensure you enter the exact ID including hyphens.",
      "If a certificate shows 'Tampered or Invalid', it means the HMAC signature did not match server records."
    ]
  },
  {
    id: "kb-05",
    title: "Handling 429 RESOURCE_EXHAUSTED in AI Grounding",
    titleNepali: "एआई कोटा सकिँदा (४२९ त्रुटि) कसरी व्यवस्थापन गर्ने?",
    category: "Admin & Telemetry",
    tags: ["API", "Gemini", "Quota", "Error 429"],
    summary: "How the system fails closed gracefully without corrupting database state when external AI quotas are reached.",
    summaryNepali: "एआई कोटा सकिँदा प्रणाली सुरक्षित रूपमा कसरी रोकिन्छ र डाटा जोगिन्छ।",
    steps: [
      "Inspect /admin/ai-observability to view recent token consumption trends.",
      "Wait for the quota reset window (usually top of the hour for rate limits).",
      "During peak load, switch to manual editorial drafting; existing published news continues to serve smoothly."
    ],
    troubleshootingTips: [
      "Never generate synthetic fake text when AI quota fails.",
      "Check server environment variable GEMINI_API_KEY if errors persist."
    ]
  },
  {
    id: "kb-06",
    title: "How to Place an Order via WhatsApp One-Click Checkout",
    titleNepali: "ह्वाट्सएप मार्फत सामग्री अर्डर गर्ने तरिका",
    category: "Commerce",
    tags: ["Store", "WhatsApp", "Orders", "Checkout"],
    summary: "Simple 3-step guide for purchasing sacred items, books, and handicrafts directly via WhatsApp.",
    summaryNepali: "रुद्राक्ष, धार्मिक पुस्तक र पूजा सामग्री ह्वाट्सएपबाट सजिलै मगाउने विधि।",
    steps: [
      "Browse the catalog on /store and click your chosen product.",
      "Click the green 'WhatsApp बाट अर्डर गर्नुहोस्' button.",
      "Your WhatsApp app will open with the pre-filled item name and price. Send the message and share your delivery address."
    ],
    troubleshootingTips: [
      "Ensure WhatsApp or WhatsApp Web is installed on your device.",
      "You can send payment receipts (Fonepay/eSewa) directly in the chat."
    ]
  }
];

export const CERTIFICATION_PATHS = CERTIFICATIONS;

