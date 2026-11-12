/**
 * SANATANMARGA 5.0 — PHASE 2E ADMIN MODULE REGISTRY
 * Authoritative, Typed, Capability-Aware Admin Module Registry & Access Evaluator.
 */

export type AdminDomain =
  | "COMMAND_CENTER"
  | "EDITORIAL"
  | "MEDIA"
  | "KNOWLEDGE"
  | "COMMUNITY"
  | "ACADEMY"
  | "EVENTS_COMMERCE"
  | "REVENUE"
  | "AUDIENCE"
  | "AI_AUTOMATION"
  | "PLATFORM";

export type AdminModuleStatus =
  | "ACTIVE"
  | "INTERNAL"
  | "BETA"
  | "DEPRECATED"
  | "MAINTENANCE"
  | "RETIRED";

export type NavigationVisibility =
  | "ALWAYS"
  | "STAFF_ONLY"
  | "ADMIN_ONLY"
  | "SUPER_ADMIN_ONLY"
  | "INTERNAL";

export type ModuleAccessDecision =
  | "VISIBLE"
  | "HIDDEN"
  | "DISABLED"
  | "UNAUTHORIZED"
  | "FEATURE_OFF"
  | "DEPENDENCY_BLOCKED"
  | "MAINTENANCE"
  | "TENANT_BLOCKED";

export interface AdminModule {
  moduleId: string;
  label: string;
  localizedLabel?: {
    ne: string;
    en: string;
  };
  description: string;
  localizedDescription?: {
    ne: string;
    en: string;
  };
  domain: AdminDomain;
  route: string;
  icon: string;
  featureKey?: string;
  requiredPermissions: string[];
  allowedRoles?: string[];
  tenantAware: boolean;
  navigationVisibility: NavigationVisibility;
  searchKeywords: string[];
  status: AdminModuleStatus;
  priority: number;
  badgeProviderKey?: string;
  healthProviderKey?: string;
  children?: AdminModule[];
  dependencies?: string[];
  legacyAliases?: string[];
}

export interface AdminUserContext {
  uid?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  isSuperAdmin?: boolean;
  tenantId?: string;
  featureStates?: Record<string, string>;
  isMaintenanceMode?: boolean;
}

export interface AdminDomainMeta {
  domain: AdminDomain;
  labelNe: string;
  labelEn: string;
  descriptionNe: string;
  descriptionEn: string;
  order: number;
}

export const ADMIN_DOMAINS: Record<AdminDomain, AdminDomainMeta> = {
  COMMAND_CENTER: {
    domain: "COMMAND_CENTER",
    labelNe: "कमान्ड सेन्टर",
    labelEn: "Command Center",
    descriptionNe: "समग्र प्लेटफर्म नियन्त्रण तथा अपरेसन अवलोकन",
    descriptionEn: "Unified operations and platform command control",
    order: 1
  },
  EDITORIAL: {
    domain: "EDITORIAL",
    labelNe: "सम्पादकीय तथा न्यूजरुम",
    labelEn: "Editorial & Newsroom",
    descriptionNe: "समाचार सम्पादन, समीक्षा, वर्गीकरण र गृहपृष्ठ व्यवस्थापन",
    descriptionEn: "Newsroom editing, review queues, and publishing",
    order: 2
  },
  MEDIA: {
    domain: "MEDIA",
    labelNe: "मिडिया तथा प्रसारण",
    labelEn: "Media & Broadcast",
    descriptionNe: "मिडिया लाइब्रेरी, रेडियो, अडियो र सम्पत्ति अखण्डता",
    descriptionEn: "Media storage, RadioOS broadcast, and asset integrity",
    order: 3
  },
  KNOWLEDGE: {
    domain: "KNOWLEDGE",
    labelNe: "ज्ञान तथा सभ्यता",
    labelEn: "Knowledge & Civilization",
    descriptionNe: "SGIS पाण्डुलिपि, ज्ञानकोष, नेपाल हब, र सभ्यता टाइमलाइन",
    descriptionEn: "SGIS archives, Sanatan GyanKosh, and civilization timeline",
    order: 4
  },
  COMMUNITY: {
    domain: "COMMUNITY",
    labelNe: "समुदाय तथा चौतारी",
    labelEn: "Community & Moderation",
    descriptionNe: "चौतारी फोरम, प्रयोगकर्ता संवाद, र सुरक्षा मोडरेसन",
    descriptionEn: "Chautari forums, reader dialogues, and content moderation",
    order: 5
  },
  ACADEMY: {
    domain: "ACADEMY",
    labelNe: "एकेडेमी तथा प्रशिक्षण",
    labelEn: "Academy & Learning",
    descriptionNe: "पाठ्यक्रम, मूल्याङ्कन, प्रमाणिकरण र प्राज्ञिक व्यवस्थापन",
    descriptionEn: "Curriculum, assessments, and learning management",
    order: 6
  },
  EVENTS_COMMERCE: {
    domain: "EVENTS_COMMERCE",
    labelNe: "सांस्कृतिक उत्सव तथा स्टोर",
    labelEn: "Events & Commerce",
    descriptionNe: "धार्मिक पर्व, कार्यक्रम र सनातन ई-कमर्स व्यवस्थापन",
    descriptionEn: "Cultural festivals, calendar, and commerce catalog",
    order: 7
  },
  REVENUE: {
    domain: "REVENUE",
    labelNe: "राजस्व तथा प्रायोजन",
    labelEn: "Revenue & Ads",
    descriptionNe: "विज्ञापन अभियान्ता, प्रायोजक र RevenueOS विश्लेषण",
    descriptionEn: "Monetization, campaigns, and RevenueOS analytics",
    order: 8
  },
  AUDIENCE: {
    domain: "AUDIENCE",
    labelNe: "प्रयोगकर्ता तथा पहुँच",
    labelEn: "Audience & Access",
    descriptionNe: "प्रयोगकर्ता भूमिका, अनुमति, सदस्यता र सूचना व्यवस्थापन",
    descriptionEn: "User accounts, role assignment, and subscriber alerts",
    order: 9
  },
  AI_AUTOMATION: {
    domain: "AI_AUTOMATION",
    labelNe: "एआई तथा स्वचालन",
    labelEn: "AI & Automation",
    descriptionNe: "एआई न्यूजरुम, अनुवाद प्रणाली र मोडेल अवलोकन",
    descriptionEn: "AI newsroom, automated translation, and model telemetry",
    order: 10
  },
  PLATFORM: {
    domain: "PLATFORM",
    labelNe: "प्लेटफर्म पूर्वाधार",
    labelEn: "Platform & Infrastructure",
    descriptionNe: "सुविधा नियन्त्रण, स्न्यापसट, विपद् पुनर्स्थापना र सुरक्षा",
    descriptionEn: "Feature control, Snapshot OS, DR, and system health",
    order: 11
  }
};

/**
 * CANONICAL ADMIN MODULE CATALOG
 * All real admin modules registered with declarative requirements.
 */
export const ADMIN_MODULES: AdminModule[] = [
  // 1. COMMAND CENTER
  {
    moduleId: "command.mission_control",
    label: "Mission Control",
    localizedLabel: { ne: "मिशन कन्ट्रोल", en: "Mission Control" },
    description: "Real-time unified platform operational dashboard and health telemetry",
    localizedDescription: { ne: "एकीकृत प्लेटफर्म सञ्चालन तथा प्रणाली स्वास्थ्य अवलोकन", en: "Real-time unified platform operations" },
    domain: "COMMAND_CENTER",
    route: "/admin",
    icon: "Zap",
    requiredPermissions: [],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "senior_editor", "editor"],
    tenantAware: false,
    navigationVisibility: "ALWAYS",
    searchKeywords: ["dashboard", "home", "mission", "control", "status", "overview"],
    status: "ACTIVE",
    priority: 100,
    legacyAliases: ["/admin/operations", "/admin/platform-health", "/admin/mission-control"]
  },
  {
    moduleId: "command.snapshot_center",
    label: "Snapshot Center",
    localizedLabel: { ne: "स्न्यापसट सेन्टर", en: "Snapshot Center" },
    description: "Centralized snapshot publishing, module generation diffs, dry-run validation, and 1-click rollback",
    localizedDescription: { ne: "केन्द्रीय स्न्यापसट प्रकाशन, संस्करण तुलना र रोलब्याक", en: "Centralized snapshot publishing and rollback" },
    domain: "COMMAND_CENTER",
    route: "/admin/snapshots",
    icon: "Layers",
    requiredPermissions: ["news.publish"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "chief_editor", "senior_editor", "editor"],
    tenantAware: true,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["snapshot", "snapshots", "publish", "version", "rollback", "manifest", "r2"],
    status: "ACTIVE",
    priority: 98
  },
  {
    moduleId: "command.review_inbox",
    label: "Review Inbox",
    localizedLabel: { ne: "समीक्षा इनबक्स", en: "Review Inbox" },
    description: "Universal operational inbox for pending drafts, verifications, and approvals",
    localizedDescription: { ne: "सम्पादकीय, मोडरेसन र प्रमाणीकरणका लागि एकीकृत इनबक्स", en: "Universal pending review queue" },
    domain: "COMMAND_CENTER",
    route: "/admin/review",
    icon: "Inbox",
    requiredPermissions: ["news.edit"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "senior_editor", "editor", "moderator"],
    tenantAware: true,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["review", "inbox", "pending", "approvals", "queue", "drafts"],
    status: "ACTIVE",
    priority: 95,
    badgeProviderKey: "PENDING_REVIEWS"
  },

  // 2. EDITORIAL
  {
    moduleId: "editorial.articles",
    label: "Articles & News",
    localizedLabel: { ne: "समाचार तथा लेखहरू", en: "Articles & News" },
    description: "Manage, publish, schedule, and curate news articles and reports",
    localizedDescription: { ne: "समाचार मस्यौदा, सम्पादन, अनुसूची र प्रकाशन व्यवस्थापन", en: "Manage news articles and reports" },
    domain: "EDITORIAL",
    route: "/admin/articles",
    icon: "FileText",
    featureKey: "core.news",
    requiredPermissions: ["news.edit"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "senior_editor", "editor", "reporter"],
    tenantAware: true,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["articles", "news", "stories", "posts", "editorial"],
    status: "ACTIVE",
    priority: 90
  },
  {
    moduleId: "editorial.editor_new",
    label: "New Article Editor",
    localizedLabel: { ne: "नयाँ समाचार सम्पादक", en: "New Article Editor" },
    description: "Full-fidelity rich text editor with TTS and SEO metadata controls",
    localizedDescription: { ne: "नयाँ समाचार तथा लेख सिर्जना सम्पादक", en: "Create new article or news item" },
    domain: "EDITORIAL",
    route: "/admin/editor",
    icon: "PenTool",
    featureKey: "core.news",
    requiredPermissions: ["news.create"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "senior_editor", "editor", "reporter", "contributor"],
    tenantAware: true,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["write", "editor", "create", "new article"],
    status: "ACTIVE",
    priority: 85
  },
  {
    moduleId: "editorial.verification",
    label: "Source & Fact Verification",
    localizedLabel: { ne: "स्रोत तथा तथ्य प्रमाणीकरण", en: "Source & Fact Verification" },
    description: "No Source = No Story gate, claim-to-source verification, and fact-checker sign-off",
    localizedDescription: { ne: "समाचार स्रोत दर्ता, दाबी जाँच र तथ्य प्रमाणीकरण", en: "Source registry and fact-check verification" },
    domain: "EDITORIAL",
    route: "/admin/verification",
    icon: "CheckCircle2",
    featureKey: "core.news",
    requiredPermissions: ["news.edit"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "chief_editor", "senior_editor", "editor", "fact_checker"],
    tenantAware: true,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["source", "fact check", "verification", "claims", "evidence", "provenance"],
    status: "ACTIVE",
    priority: 82
  },
  {
    moduleId: "editorial.categories",
    label: "Categories Taxonomy",
    localizedLabel: { ne: "विधा तथा श्रेणी", en: "Categories Taxonomy" },
    description: "Organize taxonomy, parent-child hierarchies, and topic hubs",
    localizedDescription: { ne: "समाचार वर्गीकरण तथा विषयगत विधा व्यवस्थापन", en: "Category hierarchy and taxonomy" },
    domain: "EDITORIAL",
    route: "/admin/categories",
    icon: "Tag",
    requiredPermissions: ["settings.manage"],
    allowedRoles: ["super_admin", "admin", "editorial_admin"],
    tenantAware: false,
    navigationVisibility: "ADMIN_ONLY",
    searchKeywords: ["categories", "taxonomy", "topics", "hierarchy"],
    status: "ACTIVE",
    priority: 80
  },
  {
    moduleId: "editorial.homepage",
    label: "Homepage Layout OS",
    localizedLabel: { ne: "गृहपृष्ठ संरचना", en: "Homepage Layout OS" },
    description: "Visual layout management for breaking banners, hero grids, and feeds",
    localizedDescription: { ne: "गृहपृष्ठको प्रमुख समाचार, ब्यानर र लेआउट व्यवस्थापन", en: "Homepage editorial layout" },
    domain: "EDITORIAL",
    route: "/admin/homepage",
    icon: "Layout",
    requiredPermissions: ["news.override"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "senior_editor"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["homepage", "layout", "hero", "breaking", "pin"],
    status: "ACTIVE",
    priority: 75
  },
  {
    moduleId: "editorial.discovery",
    label: "Editorial Discovery",
    localizedLabel: { ne: "खोज तथा अनुसन्धान", en: "Editorial Discovery" },
    description: "Content trend analytics, topic clusters, and regional news discovery",
    localizedDescription: { ne: "ट्रेन्डिङ विषयवस्तु र अनुसन्धान विश्लेषण", en: "Trend discovery and topic research" },
    domain: "EDITORIAL",
    route: "/admin/discovery",
    icon: "Compass",
    requiredPermissions: ["news.edit"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "senior_editor", "editor"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["discovery", "trends", "clusters", "insights"],
    status: "ACTIVE",
    priority: 70
  },

  // 3. MEDIA
  {
    moduleId: "media.live_tv",
    label: "MediaOS / Live TV",
    localizedLabel: { ne: "प्रत्यक्ष प्रसारण (Live TV)", en: "MediaOS / Live TV" },
    description: "Live TV broadcast streams, fallback stream health, VOD episodes, and schedule",
    localizedDescription: { ne: "प्रत्यक्ष टिभी प्रसारण, कार्यक्रम तालिका र भिडियो व्यवस्थापन", en: "Live TV streams, schedules, and VOD" },
    domain: "MEDIA",
    route: "/admin/live",
    icon: "Tv",
    featureKey: "media.live",
    requiredPermissions: ["media.upload"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "senior_editor", "media_producer", "editor"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["live", "tv", "video", "stream", "broadcast", "mediaos"],
    status: "ACTIVE",
    priority: 95
  },
  {
    moduleId: "media.library",
    label: "Media Library & Assets",
    localizedLabel: { ne: "मिडिया लाइब्रेरी", en: "Media Library & Assets" },
    description: "Content-addressed storage assets, uploads, and image intelligence",
    localizedDescription: { ne: "तस्वीर, श्रव्य र भिडियो सम्पत्ति व्यवस्थापन", en: "Media asset library" },
    domain: "MEDIA",
    route: "/admin/media-assets",
    icon: "Image",
    requiredPermissions: ["media.upload"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "senior_editor", "editor", "reporter"],
    tenantAware: true,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["media", "images", "photos", "uploads", "r2", "storage"],
    status: "ACTIVE",
    priority: 90,
    legacyAliases: ["/admin/media", "/admin/media-library", "/admin/media-os"]
  },
  {
    moduleId: "media.radio",
    label: "RadioOS Broadcast",
    localizedLabel: { ne: "सनातन रेडियो व्यवस्थापन", en: "RadioOS Broadcast" },
    description: "24/7 radio stream scheduling, sound branding, and automated bulletins",
    localizedDescription: { ne: "रेडियो तालिका, बुलेटिन र प्रसारण व्यवस्थापन", en: "Radio scheduling and broadcasts" },
    domain: "MEDIA",
    route: "/admin/radio",
    icon: "Radio",
    featureKey: "media.listenos",
    requiredPermissions: ["radio.manage"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "senior_editor"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["radio", "broadcast", "audio", "bulletin", "stream"],
    status: "ACTIVE",
    priority: 85
  },
  {
    moduleId: "media.listen",
    label: "ListenOS / Podcasts & Audio",
    localizedLabel: { ne: "पोडकास्ट तथा श्रव्य (ListenOS)", en: "ListenOS / Podcasts & Audio" },
    description: "Podcast shows, episodes, chapter markers, transcripts, and article narration",
    localizedDescription: { ne: "पोडकास्ट शृङ्खला, एपिसोड, अध्याय र ट्रान्सक्रिप्ट व्यवस्थापन", en: "Podcast shows, episodes, and transcripts" },
    domain: "MEDIA",
    route: "/admin/listen",
    icon: "Headphones",
    featureKey: "media.listenos",
    requiredPermissions: ["radio.manage"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "senior_editor", "media_producer", "radio_producer", "editor"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["listen", "listenos", "podcast", "podcasts", "episodes", "audio", "transcripts"],
    status: "ACTIVE",
    priority: 82
  },
  {
    moduleId: "media.sponsor_audio",
    label: "Sponsor Audio OS",
    localizedLabel: { ne: "प्रायोजक अडियो व्यवस्थापन", en: "Sponsor Audio OS" },
    description: "Audio jingles, sponsor announcements, and playback analytics",
    localizedDescription: { ne: "अडियो जिङ्गल र प्रायोजक सन्देश व्यवस्थापन", en: "Audio jingles and sponsor clips" },
    domain: "MEDIA",
    route: "/admin/sponsor-audio",
    icon: "Volume2",
    featureKey: "media.listenos",
    requiredPermissions: ["sponsors.manage"],
    allowedRoles: ["super_admin", "admin", "revenue_manager"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["audio", "sponsor", "jingle", "commercial"],
    status: "ACTIVE",
    priority: 80
  },

  // 4. KNOWLEDGE & CIVILIZATION
  {
    moduleId: "knowledge.sgis",
    label: "SGIS / Grantha Archive",
    localizedLabel: { ne: "सनातन ग्रन्थ अभिलेख (SGIS)", en: "SGIS / Grantha Archive" },
    description: "Sanatan Grantha & Intelligence System: manuscripts, verse citations, SHA-256 provenance, and scholarly review",
    localizedDescription: { ne: "पाण्डुलिपि, श्लोक उद्धरण, ह्यास प्रमाणीकरण र विद्वान समीक्षा", en: "Manuscripts, verse citations, and scholarly review" },
    domain: "KNOWLEDGE",
    route: "/admin/sgis",
    icon: "BookOpen",
    featureKey: "knowledge.base",
    requiredPermissions: ["news.edit"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "senior_editor", "sgis_scholar", "manuscript_curator", "researcher", "editor"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["sgis", "grantha", "manuscript", "sanskrit", "shloka", "citation"],
    status: "ACTIVE",
    priority: 95
  },
  {
    moduleId: "knowledge.base",
    label: "Knowledge Graph & Citations",
    localizedLabel: { ne: "ज्ञान ग्राफ तथा उद्धरण", en: "Knowledge Graph & Citations" },
    description: "Vedic knowledge graph, philosophical entities, cross-module citations, and cultural heritage",
    localizedDescription: { ne: "दार्शनिक ज्ञान ग्राफ, उद्धरण र सांस्कृतिक सम्पदा नोडहरू", en: "Knowledge graph entities and citation registry" },
    domain: "KNOWLEDGE",
    route: "/admin/knowledge",
    icon: "BookOpen",
    featureKey: "knowledge.base",
    requiredPermissions: ["news.edit"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "senior_editor", "sgis_scholar", "researcher"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["knowledge", "gyankosh", "vedic", "entities", "philosophy", "citations"],
    status: "ACTIVE",
    priority: 90,
    legacyAliases: ["/admin/knowledge-os", "/admin/festivals"]
  },
  {
    moduleId: "knowledge.nepal_hub",
    label: "Nepal Intelligence Hub",
    localizedLabel: { ne: "नेपाल हब इन्टेलिजेन्स", en: "Nepal Intelligence Hub" },
    description: "77 districts civic intelligence, temple heritage, and regional monitoring",
    localizedDescription: { ne: "७७ जिल्लाका सम्पदा, घटना र नागरिक तथ्याङ्क", en: "77 District civic intelligence" },
    domain: "KNOWLEDGE",
    route: "/admin/nepal-hub",
    icon: "MapPin",
    featureKey: "knowledge.nepal_hub",
    requiredPermissions: ["news.edit"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "senior_editor", "researcher"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["nepal", "districts", "heritage", "civic", "intelligence"],
    status: "ACTIVE",
    priority: 85,
    legacyAliases: ["/admin/intelligence-os", "/admin/knowledge-hub", "/admin/hub-os"]
  },
  {
    moduleId: "knowledge.timeline",
    label: "Civilization Timeline",
    localizedLabel: { ne: "सभ्यता टाइमलाइन", en: "Civilization Timeline" },
    description: "Chronological Vedic eras, historical treaties, and cultural milestones",
    localizedDescription: { ne: "सनातन सभ्यता र ऐतिहासिक कालक्रम व्यवस्थापन", en: "Chronological civilization milestones" },
    domain: "KNOWLEDGE",
    route: "/admin/timeline",
    icon: "Clock",
    featureKey: "knowledge.timeline",
    requiredPermissions: ["news.edit"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "researcher"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["timeline", "history", "chronology", "eras"],
    status: "ACTIVE",
    priority: 80
  },
  {
    moduleId: "knowledge.archives",
    label: "Historical Archives",
    localizedLabel: { ne: "ऐतिहासिक अभिलेख", en: "Historical Archives" },
    description: "Archival documents, ancient texts, and digitised preservation records",
    localizedDescription: { ne: "डिजिटल अभिलेखालय तथा ऐतिहासिक दस्तावेज", en: "Historical archives and documents" },
    domain: "KNOWLEDGE",
    route: "/admin/archives",
    icon: "Archive",
    featureKey: "knowledge.archives",
    requiredPermissions: ["news.edit"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "researcher"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["archives", "records", "manuscripts", "history"],
    status: "ACTIVE",
    priority: 75
  },

  // 5. COMMUNITY
  {
    moduleId: "community.chautari_admin",
    label: "Chautari Posts & Discussions",
    localizedLabel: { ne: "चौतारी छलफल व्यवस्थापन", en: "Chautari Posts & Discussions" },
    description: "Community discussion posts, topic moderation, and user engagement",
    localizedDescription: { ne: "चौतारी पोस्ट, विषय तथा पाठक संवाद", en: "Manage community discussions" },
    domain: "COMMUNITY",
    route: "/admin/community",
    icon: "MessageSquare",
    featureKey: "community.chautari",
    requiredPermissions: ["community.moderate"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "moderator"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["community", "chautari", "posts", "discussions"],
    status: "ACTIVE",
    priority: 90
  },
  {
    moduleId: "community.moderation",
    label: "Moderation & Reports",
    localizedLabel: { ne: "सामग्री मोडरेसन", en: "Moderation & Reports" },
    description: "Review flagged comments, spam reports, and offensive content alerts",
    localizedDescription: { ne: "उजुरी परेका टिप्पणी तथा संवेदनशील सामग्री समीक्षा", en: "Flagged comments and user reports" },
    domain: "COMMUNITY",
    route: "/admin/moderation",
    icon: "ShieldAlert",
    requiredPermissions: ["community.moderate"],
    allowedRoles: ["super_admin", "admin", "moderator"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["moderation", "reports", "flags", "spam", "abuse"],
    status: "ACTIVE",
    priority: 85,
    badgeProviderKey: "MODERATION_FLAGS"
  },
  {
    moduleId: "community.social",
    label: "Social Hub Distribution",
    localizedLabel: { ne: "सामाजिक सञ्जाल हब", en: "Social Hub Distribution" },
    description: "Automated social media broadcasting to X/Twitter, Facebook, and Telegram",
    localizedDescription: { ne: "सामाजिक सञ्जालमा समाचार प्रसारण व्यवस्थापन", en: "Social media syndication" },
    domain: "COMMUNITY",
    route: "/admin/social",
    icon: "Share2",
    requiredPermissions: ["news.publish"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "senior_editor"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["social", "twitter", "x", "telegram", "facebook", "broadcast"],
    status: "ACTIVE",
    priority: 80
  },

  // 6. ACADEMY & TALENT
  {
    moduleId: "academy.courses",
    label: "Sanatan Academy Courses",
    localizedLabel: { ne: "सनातन एकेडेमी", en: "Sanatan Academy Courses" },
    description: "Curriculum courses, lessons, syllabus PDFs, and student registrations",
    localizedDescription: { ne: "वैदिक तथा संस्कृत अनलाइन पाठ्यक्रम व्यवस्थापन", en: "Curriculum and course management" },
    domain: "ACADEMY",
    route: "/admin/academy",
    icon: "GraduationCap",
    featureKey: "training.academy",
    requiredPermissions: ["news.edit"],
    allowedRoles: ["super_admin", "admin", "editorial_admin"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["academy", "courses", "learning", "students"],
    status: "ACTIVE",
    priority: 90,
    legacyAliases: ["/admin/video-ads"]
  },
  {
    moduleId: "academy.competency",
    label: "Competency, Assessments & Certificates",
    localizedLabel: { ne: "दक्षता, मूल्याङ्कन र प्रमाणपत्र", en: "Competency, Assessments & Certificates" },
    description: "Competency tracks, grading rubrics, certificate issuance/revocation, and verification logs",
    localizedDescription: { ne: "दक्षता मूल्याङ्कन, रुब्रिक र प्रमाणपत्र प्रमाणीकरण व्यवस्थापन", en: "Competency rubrics and certificate management" },
    domain: "ACADEMY",
    route: "/admin/training",
    icon: "ShieldCheck",
    featureKey: "training.academy",
    requiredPermissions: ["news.edit"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "acharya", "editor"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["competency", "training", "certificates", "assessments", "rubrics", "gurukul"],
    status: "ACTIVE",
    priority: 88
  },
  {
    moduleId: "academy.models",
    label: "Creative Models & Talent",
    localizedLabel: { ne: "मोडेल तथा प्रतिभा हब", en: "Creative Models & Talent" },
    description: "Photographer and talent portfolio verification and collaboration",
    localizedDescription: { ne: "सांस्कृतिक मोडल र प्रतिभा प्रोफाइल व्यवस्थापन", en: "Cultural models and talent profiles" },
    domain: "ACADEMY",
    route: "/admin/models",
    icon: "Camera",
    requiredPermissions: ["news.edit"],
    allowedRoles: ["super_admin", "admin", "editorial_admin"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["models", "talent", "portfolio", "creatives"],
    status: "ACTIVE",
    priority: 85
  },

  // 7. EVENTS & COMMERCE
  {
    moduleId: "events.panchang",
    label: "Panchang, Festivals & Events",
    localizedLabel: { ne: "पञ्चाङ्ग, पर्व तथा पात्रो", en: "Panchang, Festivals & Events" },
    description: "Daily Bikram Sambat / AD Panchang (Tithi, Nakshatra, Yoga, Karana), auspicious timings, and festival guides",
    localizedDescription: { ne: "दैनिक पञ्चाङ्ग, तिथि, नक्षत्र, शुभ साइत र पर्व व्यवस्थापन", en: "Daily BS/AD Panchang and festival calendar" },
    domain: "EVENTS_COMMERCE",
    route: "/admin/panchang",
    icon: "Calendar",
    featureKey: "knowledge.festivals",
    requiredPermissions: ["events.edit"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "senior_editor", "acharya", "editor"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["panchang", "tithi", "nakshatra", "bikram sambat", "festivals", "calendar"],
    status: "ACTIVE",
    priority: 95
  },
  {
    moduleId: "events.manager",
    label: "Cultural Events & Festivals",
    localizedLabel: { ne: "कार्यक्रम तथा जात्रा", en: "Cultural Events & Festivals" },
    description: "Festival calendar, temple events, event recurrence, and venue coordination",
    localizedDescription: { ne: "धार्मिक पर्व, जात्रा र सांस्कृतिक कार्यक्रम व्यवस्थापन", en: "Festival and event calendar" },
    domain: "EVENTS_COMMERCE",
    route: "/admin/events",
    icon: "Calendar",
    featureKey: "community.events",
    requiredPermissions: ["events.edit"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "senior_editor"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["events", "festivals", "jatra", "calendar"],
    status: "ACTIVE",
    priority: 90
  },
  {
    moduleId: "commerce.store",
    label: "Sanatan Store & Products",
    localizedLabel: { ne: "सनातन स्टोर व्यवस्थापन", en: "Sanatan Store & Products" },
    description: "Vedic books, sacred items, inventory, and order fulfillment",
    localizedDescription: { ne: "धार्मिक पुस्तक, पूजन सामग्री र अर्डर व्यवस्थापन", en: "Sacred store items and orders" },
    domain: "EVENTS_COMMERCE",
    route: "/admin/store",
    icon: "ShoppingBag",
    featureKey: "commerce.store",
    requiredPermissions: ["settings.manage"],
    allowedRoles: ["super_admin", "admin"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["store", "shop", "products", "orders", "commerce"],
    status: "ACTIVE",
    priority: 85,
    legacyAliases: ["/admin/commerce"]
  },
  {
    moduleId: "commerce.analytics",
    label: "Commerce Analytics",
    localizedLabel: { ne: "व्यापार विश्लेषण", en: "Commerce Analytics" },
    description: "Order volumes, average order value, and product performance trends",
    localizedDescription: { ne: "बिक्री तथा अर्डर विश्लेषणात्मक तथ्याङ्क", en: "Sales and revenue metrics" },
    domain: "EVENTS_COMMERCE",
    route: "/admin/commerce-analytics",
    icon: "TrendingUp",
    featureKey: "commerce.store",
    requiredPermissions: ["revenue.view"],
    allowedRoles: ["super_admin", "admin", "revenue_manager"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["commerce", "sales", "analytics", "orders"],
    status: "ACTIVE",
    priority: 80
  },

  // 8. REVENUE
  {
    moduleId: "revenue.dashboard",
    label: "RevenueOS Overview",
    localizedLabel: { ne: "राजस्व ड्यासबोर्ड", en: "RevenueOS Overview" },
    description: "Unified financial performance, subscription tiers, and sponsor revenue",
    localizedDescription: { ne: "समग्र वित्तीय कार्यसम्पादन तथा सदस्यता विश्लेषण", en: "Financial analytics and income" },
    domain: "REVENUE",
    route: "/admin/revenue-os",
    icon: "DollarSign",
    requiredPermissions: ["revenue.view"],
    allowedRoles: ["super_admin", "admin", "revenue_manager"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["revenue", "finance", "earnings", "income", "membership"],
    status: "ACTIVE",
    priority: 90,
    legacyAliases: ["/admin/revenue", "/admin/executive"]
  },
  {
    moduleId: "revenue.ads",
    label: "Campaigns & Advertising",
    localizedLabel: { ne: "विज्ञापन व्यवस्थापन", en: "Campaigns & Advertising" },
    description: "Manage banner slots, direct client campaigns, impressions, and CTRs",
    localizedDescription: { ne: "वेब तथा मोबाइल विज्ञापन स्लट र सम्झौता व्यवस्थापन", en: "Ad inventory and advertiser campaigns" },
    domain: "REVENUE",
    route: "/admin/ads",
    icon: "Megaphone",
    requiredPermissions: ["ads.manage"],
    allowedRoles: ["super_admin", "admin", "revenue_manager"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["ads", "advertising", "banners", "campaigns", "sponsors"],
    status: "ACTIVE",
    priority: 85
  },

  {
    moduleId: "revenue.membership",
    label: "Membership & Access Tiers",
    localizedLabel: { ne: "सदस्यता तथा पहुँच तह", en: "Membership & Access Tiers" },
    description: "Manage Reader, Member, Patron, Scholar, and Institutional tiers, benefits, and entitlements",
    localizedDescription: { ne: "सदस्यता योजना, सुविधा र संरक्षक अधिकार व्यवस्थापन", en: "Membership plans, benefits, and entitlements" },
    domain: "REVENUE",
    route: "/admin/membership",
    icon: "Crown",
    featureKey: "revenue.membership",
    requiredPermissions: ["revenue.view"],
    allowedRoles: ["super_admin", "admin", "revenue_manager", "editor"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["membership", "patrons", "tiers", "subscriptions", "entitlements"],
    status: "ACTIVE",
    priority: 80
  },

  // 9. AUDIENCE
  {
    moduleId: "audience.users",
    label: "User Accounts & IAM",
    localizedLabel: { ne: "प्रयोगकर्ता तथा अनुमति", en: "User Accounts & IAM" },
    description: "Manage system staff roles, custom permission packages, and access logs",
    localizedDescription: { ne: "कर्मचारी भूमिका, सुरक्षा अनुमति र प्रयोगकर्ता व्यवस्थापन", en: "User management and permissions" },
    domain: "AUDIENCE",
    route: "/admin/users",
    icon: "Users",
    requiredPermissions: ["users.manage"],
    allowedRoles: ["super_admin", "admin"],
    tenantAware: false,
    navigationVisibility: "ADMIN_ONLY",
    searchKeywords: ["users", "roles", "permissions", "iam", "staff"],
    status: "ACTIVE",
    priority: 90
  },
  {
    moduleId: "audience.reader_analytics",
    label: "Reader Insights & Activity",
    localizedLabel: { ne: "पाठक तथ्याङ्क", en: "Reader Insights & Activity" },
    description: "Article readership metrics, category heatmaps, and retention data",
    localizedDescription: { ne: "पाठक संलग्नता र पठन गतिविधिको विस्तृत विश्लेषण", en: "Reader analytics and engagement" },
    domain: "AUDIENCE",
    route: "/admin/reader-analytics",
    icon: "BarChart3",
    requiredPermissions: ["revenue.view"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "analyst"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["readers", "analytics", "views", "engagement"],
    status: "ACTIVE",
    priority: 85
  },
  {
    moduleId: "audience.notifications",
    label: "Push Notifications Dispatch",
    localizedLabel: { ne: "सूचना पठाउने प्रणाली", en: "Push Notifications Dispatch" },
    description: "Send breaking news alerts, daily digests, and editorial push notices",
    localizedDescription: { ne: "ताजा समाचार तथा सूचनाहरू मोबाइल र वेबमा पठाउने", en: "Push notification broadcasts" },
    domain: "AUDIENCE",
    route: "/admin/notifications",
    icon: "Bell",
    requiredPermissions: ["news.override"],
    allowedRoles: ["super_admin", "admin", "editorial_admin"],
    tenantAware: false,
    navigationVisibility: "ADMIN_ONLY",
    searchKeywords: ["notifications", "push", "alerts", "broadcast"],
    status: "ACTIVE",
    priority: 80
  },
  {
    moduleId: "audience.messages",
    label: "Inquiries & Contact Messages",
    localizedLabel: { ne: "सम्पर्क सन्देशहरू", en: "Inquiries & Contact Messages" },
    description: "Manage incoming citizen tips, inquiries, and reader contact submissions",
    localizedDescription: { ne: "नागरिक सन्देश, सुझाव र सम्पर्क फारम व्यवस्थापन", en: "Reader messages and inquiries" },
    domain: "AUDIENCE",
    route: "/admin/contact-messages",
    icon: "Mail",
    requiredPermissions: ["settings.manage"],
    allowedRoles: ["super_admin", "admin", "editorial_admin"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["messages", "contact", "inquiries", "inbox"],
    status: "ACTIVE",
    priority: 75,
    legacyAliases: ["/admin/inquiries"]
  },

  // 10. AI & AUTOMATION
  {
    moduleId: "ai.observability",
    label: "AI Observability & Tokens",
    localizedLabel: { ne: "एआई अवलोकन", en: "AI Observability & Tokens" },
    description: "Gemini token consumption, latency telemetry, model errors, and quota",
    localizedDescription: { ne: "जेमिनाई मोडेल प्रयोग, लागत र कार्यसम्पादन विश्लेषण", en: "AI token telemetry and logs" },
    domain: "AI_AUTOMATION",
    route: "/admin/ai-observability",
    icon: "Cpu",
    requiredPermissions: ["settings.manage"],
    allowedRoles: ["super_admin", "admin"],
    tenantAware: false,
    navigationVisibility: "ADMIN_ONLY",
    searchKeywords: ["ai", "gemini", "tokens", "latency", "models"],
    status: "ACTIVE",
    priority: 90
  },
  {
    moduleId: "ai.translation",
    label: "Multilingual Translation Desk",
    localizedLabel: { ne: "अनुवाद कार्यकक्ष", en: "Multilingual Translation Desk" },
    description: "Manage automated English/Hindi translation queues and editorial sign-offs",
    localizedDescription: { ne: "नेपालीबाट अंग्रेजी र हिन्दी अनुवाद समीक्षा", en: "Editorial translation management" },
    domain: "AI_AUTOMATION",
    route: "/admin/translation",
    icon: "Globe",
    featureKey: "core.news",
    requiredPermissions: ["news.edit"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "senior_editor"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["translation", "multilingual", "english", "hindi", "i18n"],
    status: "ACTIVE",
    priority: 85
  },
  {
    moduleId: "ai.workflows",
    label: "Workflow Automation",
    localizedLabel: { ne: "स्वचालित कार्यप्रवाह", en: "Workflow Automation" },
    description: "Background editorial triggers, webhook syndications, and automated tasks",
    localizedDescription: { ne: "स्वचालित समाचार कार्यप्रवाह र ट्रिगरहरू", en: "Background task automation" },
    domain: "AI_AUTOMATION",
    route: "/admin/workflows",
    icon: "Workflow",
    requiredPermissions: ["settings.manage"],
    allowedRoles: ["super_admin", "admin"],
    tenantAware: false,
    navigationVisibility: "ADMIN_ONLY",
    searchKeywords: ["workflows", "automation", "triggers", "webhooks"],
    status: "ACTIVE",
    priority: 80
  },

  // 11. PLATFORM
  {
    moduleId: "platform.feature_control",
    label: "Feature Control OS",
    localizedLabel: { ne: "सुविधा नियन्त्रण प्रणाली", en: "Feature Control OS" },
    description: "Manage 57 canonical feature flags, rollout profiles, and emergency shutdown",
    localizedDescription: { ne: "५७ प्रणाली सुविधाहरूको नियन्त्रण तथा रोलआउट प्रोफाइल", en: "Feature flag matrix and rollout profiles" },
    domain: "PLATFORM",
    route: "/admin/feature-control",
    icon: "Sliders",
    requiredPermissions: ["settings.manage"],
    allowedRoles: ["super_admin", "admin"],
    tenantAware: true,
    navigationVisibility: "ADMIN_ONLY",
    searchKeywords: ["features", "flags", "toggle", "rollout", "profiles", "emergency"],
    status: "ACTIVE",
    priority: 95
  },
  {
    moduleId: "platform.disaster_recovery",
    label: "Disaster Recovery & Backup",
    localizedLabel: { ne: "विपद् पुनर्स्थापना र ब्याकअप", en: "Disaster Recovery & Backup" },
    description: "Manage cryptographic backups, dry-run restores, and non-destructive drills",
    localizedDescription: { ne: "प्रणाली ब्याकअप, पुनर्स्थापना र आरपीओ/आरटीओ ड्रिल", en: "Backups, restore plans, and drills" },
    domain: "PLATFORM",
    route: "/admin/disaster-recovery",
    icon: "LifeBuoy",
    requiredPermissions: ["settings.manage"],
    allowedRoles: ["super_admin"],
    tenantAware: false,
    navigationVisibility: "SUPER_ADMIN_ONLY",
    searchKeywords: ["backup", "restore", "recovery", "dr", "snapshots", "rollback"],
    status: "ACTIVE",
    priority: 90,
    dependencies: ["platform.system_health"]
  },
  {
    moduleId: "platform.system_health",
    label: "System Health & Gateways",
    localizedLabel: { ne: "प्रणाली स्वास्थ्य तथा कोटा", en: "System Health & Gateways" },
    description: "Firestore circuit breaker status, memory pressure, and quota monitoring",
    localizedDescription: { ne: "फायरस्टोर कोटा, मेमोरी र सर्भर स्वास्थ्य अवलोकन", en: "Quota circuit breaker and service telemetry" },
    domain: "PLATFORM",
    route: "/admin/system-health",
    icon: "Activity",
    requiredPermissions: ["settings.manage"],
    allowedRoles: ["super_admin", "admin"],
    tenantAware: false,
    navigationVisibility: "ADMIN_ONLY",
    searchKeywords: ["health", "quota", "circuit breaker", "memory", "server", "telemetry"],
    status: "ACTIVE",
    priority: 85,
    legacyAliases: ["/admin/health", "/admin/system-integrity"]
  },
  {
    moduleId: "platform.tenants",
    label: "Tenant Federation",
    localizedLabel: { ne: "संस्थागत महासंघ", en: "Tenant Federation" },
    description: "Multi-tenant domain routing, localized brands, and organizational isolation",
    localizedDescription: { ne: "बहु-संस्थागत शाखा तथा डोमेन व्यवस्थापन", en: "Multi-tenant federation and domains" },
    domain: "PLATFORM",
    route: "/admin/tenants",
    icon: "Building2",
    requiredPermissions: ["governance.manage"],
    allowedRoles: ["super_admin"],
    tenantAware: false,
    navigationVisibility: "SUPER_ADMIN_ONLY",
    searchKeywords: ["tenants", "federation", "multi-tenant", "brands", "organizations"],
    status: "ACTIVE",
    priority: 80,
    legacyAliases: ["/admin/developer-api"]
  },
  {
    moduleId: "platform.governance",
    label: "Audit Logs & Governance",
    localizedLabel: { ne: "अडिट तथा सुशासन", en: "Audit Logs & Governance" },
    description: "Immutable privileged administrative audit trail and security logs",
    localizedDescription: { ne: "प्रशासकीय कार्यहरूको अपरिवर्तनीय अडिट लग", en: "Privileged action audit logs" },
    domain: "PLATFORM",
    route: "/admin/governance",
    icon: "ShieldCheck",
    requiredPermissions: ["governance.manage"],
    allowedRoles: ["super_admin", "admin"],
    tenantAware: true,
    navigationVisibility: "ADMIN_ONLY",
    searchKeywords: ["audit", "governance", "logs", "security", "trace"],
    status: "ACTIVE",
    priority: 75,
    legacyAliases: ["/admin/data-governance", "/admin/content-audit"]
  },
  {
    moduleId: "platform.navigation",
    label: "Navigation, Menus & Layout",
    localizedLabel: { ne: "नेभिगेसन, मेनु र लेआउट", en: "Navigation, Menus & Layout" },
    description: "Manage public header, footer, mobile navigation menus, and page builder layouts",
    localizedDescription: { ne: "सार्वजनिक मेनु, हेडर, फुटर र पृष्ठ लेआउट व्यवस्थापन", en: "Header, footer, and navigation menu manager" },
    domain: "PLATFORM",
    route: "/admin/menu",
    icon: "Layout",
    requiredPermissions: ["settings.manage"],
    allowedRoles: ["super_admin", "admin", "editorial_admin"],
    tenantAware: false,
    navigationVisibility: "ADMIN_ONLY",
    searchKeywords: ["navigation", "menu", "menus", "header", "footer", "layout"],
    status: "ACTIVE",
    priority: 74,
    legacyAliases: ["/admin/design-os", "/admin/page-builder"]
  },
  {
    moduleId: "platform.search_index",
    label: "Search & Discovery Index",
    localizedLabel: { ne: "खोज तथा अनुक्रमणिका (SEO)", en: "Search & Discovery Index" },
    description: "Unified cross-module search index, canonical URLs, sitemaps, and discovery ranking",
    localizedDescription: { ne: "एकीकृत खोज अनुक्रमणिका, एसईओ र साइटम्याप व्यवस्थापन", en: "Cross-module search index and SEO" },
    domain: "PLATFORM",
    route: "/admin/seo-os",
    icon: "Compass",
    requiredPermissions: ["news.edit"],
    allowedRoles: ["super_admin", "admin", "editorial_admin", "senior_editor", "editor"],
    tenantAware: false,
    navigationVisibility: "STAFF_ONLY",
    searchKeywords: ["search", "index", "seo", "sitemap", "discovery"],
    status: "ACTIVE",
    priority: 72
  },
  {
    moduleId: "platform.settings",
    label: "System Settings",
    localizedLabel: { ne: "प्लेटफर्म सेटिङहरू", en: "System Settings" },
    description: "Global site metadata, branding logos, contact info, and legal policies",
    localizedDescription: { ne: "वेबसाइटको मुख्य सेटिङ, लोगो र सम्पर्क विवरण", en: "Global platform configuration" },
    domain: "PLATFORM",
    route: "/admin/settings",
    icon: "Settings",
    requiredPermissions: ["settings.manage"],
    allowedRoles: ["super_admin", "admin"],
    tenantAware: false,
    navigationVisibility: "ADMIN_ONLY",
    searchKeywords: ["settings", "config", "branding", "logo", "meta"],
    status: "ACTIVE",
    priority: 70,
    legacyAliases: ["/admin/setup-guide"]
  }
];

// Quick index lookup
const MODULE_ID_MAP = new Map<string, AdminModule>();
const ROUTE_MAP = new Map<string, AdminModule>();
const ALIAS_MAP = new Map<string, string>();

for (const mod of ADMIN_MODULES) {
  MODULE_ID_MAP.set(mod.moduleId, mod);
  ROUTE_MAP.set(mod.route, mod);
  if (mod.legacyAliases) {
    for (const alias of mod.legacyAliases) {
      ALIAS_MAP.set(alias, mod.route);
    }
  }
}

/**
 * Access Evaluator: Determines whether a module is visible/permitted for given user & system context
 */
export function evaluateAdminModuleAccess(
  moduleOrId: AdminModule | string,
  context: AdminUserContext
): { decision: ModuleAccessDecision; reason: string } {
  const mod = typeof moduleOrId === "string" ? MODULE_ID_MAP.get(moduleOrId) : moduleOrId;
  if (!mod) {
    return { decision: "HIDDEN", reason: "Module not found in registry" };
  }

  // 1. Module Retired
  if (mod.status === "RETIRED") {
    return { decision: "HIDDEN", reason: "Module has been permanently retired" };
  }

  // 2. Global Maintenance Mode
  if (context.isMaintenanceMode && !context.isSuperAdmin) {
    return { decision: "MAINTENANCE", reason: "System is in maintenance mode" };
  }
  if (mod.status === "MAINTENANCE" && !context.isSuperAdmin) {
    return { decision: "MAINTENANCE", reason: "Module is under scheduled maintenance" };
  }

  // 3. Super Admin bypass (except retired)
  if (context.isSuperAdmin) {
    return { decision: "VISIBLE", reason: "Super administrator full capability access" };
  }

  // 4. Feature Control check
  if (mod.featureKey && context.featureStates) {
    const fState = context.featureStates[mod.featureKey];
    if (fState === "off") {
      return { decision: "FEATURE_OFF", reason: `Feature '${mod.featureKey}' is disabled in Feature Control` };
    }
    if (fState === "admin_only" && context.role !== "admin" && context.role !== "super_admin") {
      return { decision: "UNAUTHORIZED", reason: `Feature '${mod.featureKey}' is restricted to administrators` };
    }
  }

  // 5. Navigation Visibility Policy
  if (mod.navigationVisibility === "SUPER_ADMIN_ONLY" && !context.isSuperAdmin && context.role !== "super_admin") {
    return { decision: "UNAUTHORIZED", reason: "Super Administrator privilege required" };
  }
  if (mod.navigationVisibility === "ADMIN_ONLY" && context.role !== "admin" && context.role !== "super_admin") {
    return { decision: "UNAUTHORIZED", reason: "Administrator privilege required" };
  }
  if (mod.navigationVisibility === "INTERNAL") {
    return { decision: "HIDDEN", reason: "Internal-only diagnostic module" };
  }

  // 6. Role check (legacy fallback)
  if (mod.allowedRoles && mod.allowedRoles.length > 0 && context.role) {
    if (!mod.allowedRoles.includes(context.role)) {
      return { decision: "UNAUTHORIZED", reason: `Role '${context.role}' is not in allowed roles list` };
    }
  }

  // 7. Granular Permissions check
  if (mod.requiredPermissions && mod.requiredPermissions.length > 0) {
    const userPerms = new Set(context.permissions || []);
    if (!userPerms.has("*")) {
      const hasAll = mod.requiredPermissions.every(p => userPerms.has(p));
      if (!hasAll) {
        return { decision: "UNAUTHORIZED", reason: `Missing required permission: ${mod.requiredPermissions.filter(p => !userPerms.has(p)).join(", ")}` };
      }
    }
  }

  // 8. Dependency Check (only if user is otherwise authorized)
  if (mod.dependencies && mod.dependencies.length > 0) {
    for (const depId of mod.dependencies) {
      const depMod = MODULE_ID_MAP.get(depId);
      if (depMod) {
        const depAccess = evaluateAdminModuleAccess(depMod, context);
        if (depAccess.decision === "FEATURE_OFF" || depAccess.decision === "HIDDEN" || depAccess.decision === "UNAUTHORIZED") {
          return { decision: "DEPENDENCY_BLOCKED", reason: `Prerequisite module '${depMod.label}' is unavailable (${depAccess.reason})` };
        }
      }
    }
  }

  return { decision: "VISIBLE", reason: "Authorized" };
}

/**
 * Helper to get module by Route
 */
export function getAdminModuleByRoute(route: string): AdminModule | undefined {
  const clean = route.split("?")[0].replace(/\/$/, "");
  const target = clean || "/admin";
  if (ROUTE_MAP.has(target)) return ROUTE_MAP.get(target);
  if (ALIAS_MAP.has(target)) {
    const canonicalRoute = ALIAS_MAP.get(target)!;
    return ROUTE_MAP.get(canonicalRoute);
  }
  return undefined;
}

/**
 * Helper to build breadcrumb segments from route
 */
export function getAdminBreadcrumbs(route: string): Array<{ label: string; route: string }> {
  const mod = getAdminModuleByRoute(route);
  const crumbs: Array<{ label: string; route: string }> = [
    { label: "Admin", route: "/admin" }
  ];

  if (!mod) {
    return crumbs;
  }

  if (mod.route === "/admin") {
    return crumbs;
  }

  const domainMeta = ADMIN_DOMAINS[mod.domain];
  if (domainMeta) {
    crumbs.push({ label: domainMeta.labelEn, route: "/admin" });
  }

  crumbs.push({ label: mod.label, route: mod.route });
  return crumbs;
}

/**
 * Filter modules for navigation tree
 */
export function getVisibleAdminNavigation(context: AdminUserContext): Record<AdminDomain, AdminModule[]> {
  const result: Record<AdminDomain, AdminModule[]> = {
    COMMAND_CENTER: [],
    EDITORIAL: [],
    MEDIA: [],
    KNOWLEDGE: [],
    COMMUNITY: [],
    ACADEMY: [],
    EVENTS_COMMERCE: [],
    REVENUE: [],
    AUDIENCE: [],
    AI_AUTOMATION: [],
    PLATFORM: []
  };

  for (const mod of ADMIN_MODULES) {
    const evalResult = evaluateAdminModuleAccess(mod, context);
    if (evalResult.decision === "VISIBLE") {
      result[mod.domain].push(mod);
    }
  }

  return result;
}
