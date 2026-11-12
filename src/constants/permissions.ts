export const PERMISSIONS = {
  // News & Content Permissions
  NEWS_CREATE: "news.create",
  NEWS_EDIT: "news.edit",
  NEWS_PUBLISH: "news.publish",
  NEWS_DELETE: "news.delete",
  NEWS_OVERRIDE: "news.override",

  // Media Permissions
  MEDIA_UPLOAD: "media.upload",
  MEDIA_MANAGE: "media.manage",

  // Broadcast & Streaming Permissions
  LIVE_CREATE: "live.create",
  LIVE_EDIT: "live.edit",
  RADIO_MANAGE: "radio.manage",

  // Revenue & Monetization Permissions
  ADS_MANAGE: "ads.manage",
  SPONSORS_MANAGE: "sponsors.manage",
  REVENUE_VIEW: "revenue.view",

  // Community & Social Permissions
  COMMUNITY_POST: "community.post",
  COMMUNITY_COMMENT: "community.comment",
  COMMUNITY_MODERATE: "community.moderate",

  // User & Administrative Permissions
  USERS_MANAGE: "users.manage",
  ROLES_MANAGE: "roles.manage",
  SETTINGS_MANAGE: "settings.manage",
  GOVERNANCE_MANAGE: "governance.manage",

  // Events OS Governance Permissions
  EVENTS_CREATE: "events.create",
  EVENTS_EDIT: "events.edit",
  EVENTS_VERIFY: "events.verify",
  EVENTS_PUBLISH: "events.publish",
  EVENTS_RETRACT: "events.retract",
  EVENTS_EXPIRE: "events.expire",
  EVENTS_MERGE: "events.merge",
  EVENTS_DELETE: "events.delete",
  EVENTS_MANAGE_RECURRENCE: "events.manage_recurrence",
  EVENTS_MANAGE_FESTIVALS: "events.manage_festivals",
  EVENTS_MANAGE_SOURCES: "events.manage_sources",
  EVENTS_MANAGE_KNOWLEDGE_LINKS: "events.manage_knowledge_links",
} as const;

export type UserPermission = typeof PERMISSIONS[keyof typeof PERMISSIONS] | string;

export interface PermissionPackage {
  id: string;
  nameNe: string;
  nameEn: string;
  descriptionNe: string;
  permissions: UserPermission[];
  badgeColor: string;
}

export const PERMISSION_PACKAGES: Record<string, PermissionPackage> = {
  editorial: {
    id: "editorial",
    nameNe: "सम्पादकीय प्याकेज (Editorial Package)",
    nameEn: "Editorial Package",
    descriptionNe: "समाचार सिर्जना, सम्पादन, मिडिया अपलोड र लाइभ अपडेट अधिकार।",
    permissions: [
      PERMISSIONS.NEWS_CREATE,
      PERMISSIONS.NEWS_EDIT,
      PERMISSIONS.NEWS_PUBLISH,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_MANAGE,
      PERMISSIONS.LIVE_CREATE,
    ],
    badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
  },
  revenue: {
    id: "revenue",
    nameNe: "राजस्व प्याकेज (Revenue Package)",
    nameEn: "Revenue Package",
    descriptionNe: "विज्ञापन अभियान्ता, प्रायोजक व्यवस्थापन र RevenueOS पहुँच।",
    permissions: [
      PERMISSIONS.ADS_MANAGE,
      PERMISSIONS.SPONSORS_MANAGE,
      PERMISSIONS.REVENUE_VIEW,
    ],
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20"
  },
  community: {
    id: "community",
    nameNe: "समुदाय प्याकेज (Community Package)",
    nameEn: "Community Moderation Package",
    descriptionNe: "चौतारी पोस्टिङ, टिप्पणी र समुदाय मोडरेसन अधिकार।",
    permissions: [
      PERMISSIONS.COMMUNITY_POST,
      PERMISSIONS.COMMUNITY_COMMENT,
      PERMISSIONS.COMMUNITY_MODERATE,
    ],
    badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20"
  },
  radio: {
    id: "radio",
    nameNe: "रेडियो प्याकेज (RadioOS Package)",
    nameEn: "RadioOS Broadcast Package",
    descriptionNe: "रेडियो प्रसारण, बुलेटिन स्वीकृति र श्रव्य मिडिया व्यवस्थापन।",
    permissions: [
      PERMISSIONS.RADIO_MANAGE,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_MANAGE,
    ],
    badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/20"
  },
  liveos: {
    id: "liveos",
    nameNe: "लाइभ प्याकेज (LiveOS Streaming Package)",
    nameEn: "LiveOS Streaming Package",
    descriptionNe: "प्रत्यक्ष भिडियो प्रसारण र प्रत्यक्ष कभरेज सिर्जना।",
    permissions: [
      PERMISSIONS.LIVE_CREATE,
      PERMISSIONS.LIVE_EDIT,
      PERMISSIONS.MEDIA_UPLOAD,
    ],
    badgeColor: "bg-rose-500/10 text-rose-500 border-rose-500/20"
  },
  analytics: {
    id: "analytics",
    nameNe: "विश्लेषण प्याकेज (AnalyticsOS Package)",
    nameEn: "AnalyticsOS Package",
    descriptionNe: "पाठक, सम्पादकीय र वित्तीय तथ्याङ्क विश्लेषणात्मक पहुँच।",
    permissions: [
      PERMISSIONS.REVENUE_VIEW,
      PERMISSIONS.GOVERNANCE_MANAGE,
    ],
    badgeColor: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
  }
};

export interface Entitlement {
  key: string;
  nameNe: string;
  nameEn: string;
  allowedTiers: Array<"free" | "patron" | "sadhak" | "sanrakshak" | "corporate">;
}

export const ENTITLEMENTS: Record<string, Entitlement> = {
  read_basic_news: {
    key: "read_basic_news",
    nameNe: "दैनिक समाचार पहुँच",
    nameEn: "Basic Daily News Access",
    allowedTiers: ["free", "patron", "sadhak", "sanrakshak", "corporate"],
  },
  listen_radio_stream: {
    key: "listen_radio_stream",
    nameNe: "रेडियो २४/७ स्ट्रिमिङ",
    nameEn: "Sanatan Radio 24/7 Live Stream",
    allowedTiers: ["free", "patron", "sadhak", "sanrakshak", "corporate"],
  },
  ad_light_experience: {
    key: "ad_light_experience",
    nameNe: "विज्ञापन-रहित अनुभव",
    nameEn: "Ad-Free & Distraction-Free Reading",
    allowedTiers: ["patron", "sadhak", "sanrakshak", "corporate"],
  },
  hd_audio_listenos: {
    key: "hd_audio_listenos",
    nameNe: "ListenOS ३२०kbps एचडी अडियो",
    nameEn: "ListenOS HD Audio & Downloads",
    allowedTiers: ["sadhak", "sanrakshak", "corporate"],
  },
  academy_learningos: {
    key: "academy_learningos",
    nameNe: "LearningOS एकेडेमी क्लास",
    nameEn: "LearningOS Academy Full Courses",
    allowedTiers: ["sadhak", "sanrakshak", "corporate"],
  },
  district_intelligence: {
    key: "district_intelligence",
    nameNe: "७७ जिल्ला खोज प्रतिवेदन",
    nameEn: "77 District Intelligence Reports",
    allowedTiers: ["sanrakshak", "corporate"],
  },
  multi_seat_org: {
    key: "multi_seat_org",
    nameNe: "१० टिम मल्टि-युजर संस्थागत खाता",
    nameEn: "Multi-seat Organization Account",
    allowedTiers: ["corporate"],
  },
};

export function checkEntitlement(tier: string, entitlementKey: keyof typeof ENTITLEMENTS | string): boolean {
  const entitlement = ENTITLEMENTS[entitlementKey];
  if (!entitlement) return false;
  return entitlement.allowedTiers.includes(tier as any);
}

export interface RoleDefinition {
  id: string;
  nameNe: string;
  nameEn: string;
  descriptionNe: string;
  descriptionEn: string;
  permissions: UserPermission[];
  badgeColor: string;
}

export const ROLE_DEFINITIONS: Record<string, RoleDefinition> = {
  public: {
    id: "public",
    nameNe: "सार्वजनिक (अतिथि)",
    nameEn: "Public / Guest",
    descriptionNe: "सामग्री पढ्न, सुन्न र हेर्न सक्ने साधारण प्रयोगकर्ता।",
    descriptionEn: "Can read public content, search, listen to audio, and watch live streams.",
    permissions: [],
    badgeColor: "bg-slate-500/10 text-slate-500 border-slate-500/20"
  },
  member: {
    id: "member",
    nameNe: "साधारण सदस्य (Member)",
    nameEn: "Registered Member",
    descriptionNe: "टिप्पणी गर्ने, चौतारीमा पोष्ट गर्ने र बुकमार्क बनाउन सक्ने प्रयोगकर्ता।",
    descriptionEn: "Can bookmark, follow topics, create Chautari posts, comment, and build audio queues.",
    permissions: [
      PERMISSIONS.COMMUNITY_POST,
      PERMISSIONS.COMMUNITY_COMMENT,
    ],
    badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20"
  },
  contributor: {
    id: "contributor",
    nameNe: "योगदानकर्ता (Contributor)",
    nameEn: "Content Contributor",
    descriptionNe: "समाचार मस्यौदा गर्न, घटना उम्मेदवार पेश गर्न र मिडिया अपलोड गर्न सक्ने।",
    descriptionEn: "Can submit stories, draft articles, upload media, propose event candidates, and submit sources.",
    permissions: [
      PERMISSIONS.COMMUNITY_POST,
      PERMISSIONS.COMMUNITY_COMMENT,
      PERMISSIONS.NEWS_CREATE,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.EVENTS_CREATE,
      PERMISSIONS.EVENTS_MANAGE_SOURCES,
    ],
    badgeColor: "bg-teal-500/10 text-teal-500 border-teal-500/20"
  },
  reporter: {
    id: "reporter",
    nameNe: "संवाददाता (Reporter)",
    nameEn: "Field Reporter",
    descriptionNe: "प्रमाणित समाचार, फिल्ड रिपोर्टिङ, घटना उम्मेदवार र स्रोतहरू पठाउन सक्ने।",
    descriptionEn: "Can submit verified reports, draft field stories, upload media, propose event candidates, suggest locations, and submit sources.",
    permissions: [
      PERMISSIONS.COMMUNITY_POST,
      PERMISSIONS.COMMUNITY_COMMENT,
      PERMISSIONS.NEWS_CREATE,
      PERMISSIONS.NEWS_EDIT,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.LIVE_CREATE,
      PERMISSIONS.EVENTS_CREATE,
      PERMISSIONS.EVENTS_MANAGE_SOURCES,
      PERMISSIONS.EVENTS_MANAGE_KNOWLEDGE_LINKS,
    ],
    badgeColor: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
  },
  researcher: {
    id: "researcher",
    nameNe: "अनुसन्धानकर्ता (Researcher)",
    nameEn: "Researcher",
    descriptionNe: "घटनाहरू अनुसन्धान गर्न, ज्ञानकोष लिंकहरू र प्रमाण थप्न सक्ने।",
    descriptionEn: "Can annotate and edit event candidates, add evidence to sources, and manage Knowledge OS connections.",
    permissions: [
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.EVENTS_EDIT,
      PERMISSIONS.EVENTS_MANAGE_SOURCES,
      PERMISSIONS.EVENTS_MANAGE_KNOWLEDGE_LINKS,
    ],
    badgeColor: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
  },
  editor: {
    id: "editor",
    nameNe: "सम्पादक (Editor)",
    nameEn: "Editorial Desk",
    descriptionNe: "समाचार समीक्षा, घटना मस्यौदा सम्पादन, भूगोल र ज्ञान नोड जडान अधिकार।",
    descriptionEn: "Can review & edit content, edit event candidates, review sources, assign geography, and connect Knowledge nodes.",
    permissions: [
      PERMISSIONS.COMMUNITY_POST,
      PERMISSIONS.COMMUNITY_COMMENT,
      PERMISSIONS.COMMUNITY_MODERATE,
      PERMISSIONS.NEWS_CREATE,
      PERMISSIONS.NEWS_EDIT,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_MANAGE,
      PERMISSIONS.LIVE_CREATE,
      PERMISSIONS.LIVE_EDIT,
      PERMISSIONS.EVENTS_EDIT,
      PERMISSIONS.EVENTS_MANAGE_SOURCES,
      PERMISSIONS.EVENTS_MANAGE_KNOWLEDGE_LINKS,
    ],
    badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
  },
  senior_editor: {
    id: "senior_editor",
    nameNe: "वरिष्ठ सम्पादक (Senior Editor)",
    nameEn: "Senior Editor",
    descriptionNe: "समाचार प्रकाशन, घटना प्रमाणिकरण, मञ्जुरी, र डुप्लिकेट मर्ज अधिकार।",
    descriptionEn: "Can verify events, approve and publish events, resolve/expire/merge duplicates, and override editor decisions.",
    permissions: [
      PERMISSIONS.COMMUNITY_POST,
      PERMISSIONS.COMMUNITY_COMMENT,
      PERMISSIONS.COMMUNITY_MODERATE,
      PERMISSIONS.NEWS_CREATE,
      PERMISSIONS.NEWS_EDIT,
      PERMISSIONS.NEWS_PUBLISH,
      PERMISSIONS.NEWS_DELETE,
      PERMISSIONS.NEWS_OVERRIDE,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_MANAGE,
      PERMISSIONS.LIVE_CREATE,
      PERMISSIONS.LIVE_EDIT,
      PERMISSIONS.RADIO_MANAGE,
      PERMISSIONS.SPONSORS_MANAGE,
      PERMISSIONS.EVENTS_CREATE,
      PERMISSIONS.EVENTS_EDIT,
      PERMISSIONS.EVENTS_VERIFY,
      PERMISSIONS.EVENTS_PUBLISH,
      PERMISSIONS.EVENTS_EXPIRE,
      PERMISSIONS.EVENTS_MERGE,
      PERMISSIONS.EVENTS_MANAGE_SOURCES,
      PERMISSIONS.EVENTS_MANAGE_KNOWLEDGE_LINKS,
    ],
    badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/20"
  },
  editorial_admin: {
    id: "editorial_admin",
    nameNe: "सम्पादकीय प्रशासक (Editorial Admin)",
    nameEn: "Editorial Administrator",
    descriptionNe: "घटना फिर्ता (retract), लाइफसाइकल ओभरराइड, जात्रा पुनरावृत्ति र सम्पादकीय नीति व्यवस्थापन।",
    descriptionEn: "Can retract published events, override lifecycles, manage festival recurrence, configure trusted sources, and manage editorial policies.",
    permissions: [
      PERMISSIONS.COMMUNITY_POST,
      PERMISSIONS.COMMUNITY_COMMENT,
      PERMISSIONS.COMMUNITY_MODERATE,
      PERMISSIONS.NEWS_CREATE,
      PERMISSIONS.NEWS_EDIT,
      PERMISSIONS.NEWS_PUBLISH,
      PERMISSIONS.NEWS_DELETE,
      PERMISSIONS.NEWS_OVERRIDE,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_MANAGE,
      PERMISSIONS.LIVE_CREATE,
      PERMISSIONS.LIVE_EDIT,
      PERMISSIONS.RADIO_MANAGE,
      PERMISSIONS.SPONSORS_MANAGE,
      PERMISSIONS.EVENTS_CREATE,
      PERMISSIONS.EVENTS_EDIT,
      PERMISSIONS.EVENTS_VERIFY,
      PERMISSIONS.EVENTS_PUBLISH,
      PERMISSIONS.EVENTS_RETRACT,
      PERMISSIONS.EVENTS_EXPIRE,
      PERMISSIONS.EVENTS_MERGE,
      PERMISSIONS.EVENTS_DELETE,
      PERMISSIONS.EVENTS_MANAGE_RECURRENCE,
      PERMISSIONS.EVENTS_MANAGE_FESTIVALS,
      PERMISSIONS.EVENTS_MANAGE_SOURCES,
      PERMISSIONS.EVENTS_MANAGE_KNOWLEDGE_LINKS,
      PERMISSIONS.GOVERNANCE_MANAGE,
    ],
    badgeColor: "bg-orange-500/10 text-orange-500 border-orange-500/20"
  },
  revenue_manager: {
    id: "revenue_manager",
    nameNe: "राजस्व व्यवस्थापक (Revenue Manager)",
    nameEn: "Revenue Manager",
    descriptionNe: "विज्ञापन, प्रायोजक र RevenueOS व्यवस्थापन गर्ने। समाचार सम्पादन अधिकार हुँदैन।",
    descriptionEn: "Can manage ads, sponsors, campaigns, and RevenueOS analytics. Cannot edit articles.",
    permissions: [
      PERMISSIONS.ADS_MANAGE,
      PERMISSIONS.SPONSORS_MANAGE,
      PERMISSIONS.REVENUE_VIEW,
    ],
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20"
  },
  moderator: {
    id: "moderator",
    nameNe: "मोडरेटर (Moderator)",
    nameEn: "Community Moderator",
    descriptionNe: "समुदाय पोष्ट र टिप्पणीहरू व्यवस्थापन तथा मोडरेसन गर्ने।",
    descriptionEn: "Can moderate Chautari posts and community comments.",
    permissions: [
      PERMISSIONS.COMMUNITY_POST,
      PERMISSIONS.COMMUNITY_COMMENT,
      PERMISSIONS.COMMUNITY_MODERATE,
    ],
    badgeColor: "bg-pink-500/10 text-pink-500 border-pink-500/20"
  },
  analyst: {
    id: "analyst",
    nameNe: "विश्लेषक (Analyst / Viewer)",
    nameEn: "Viewer / Analyst",
    descriptionNe: "सम्पादकीय तथा राजस्व विश्लेषण डेटा अध्ययन र अवलोकन पहुँच।",
    descriptionEn: "Read-only access to event stats, Nepal Hub reports, and RevenueOS statistics.",
    permissions: [
      PERMISSIONS.REVENUE_VIEW,
    ],
    badgeColor: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
  },
  admin: {
    id: "admin",
    nameNe: "प्रशासक (Admin)",
    nameEn: "Platform Administrator",
    descriptionNe: "प्लेटफर्म सेटिङहरू, प्रयोगकर्ता र अनुमतिहरू व्यवस्थापन गर्ने।",
    descriptionEn: "Can manage platform settings, manage users, roles, and system permissions.",
    permissions: [
      PERMISSIONS.NEWS_CREATE,
      PERMISSIONS.NEWS_EDIT,
      PERMISSIONS.NEWS_PUBLISH,
      PERMISSIONS.NEWS_DELETE,
      PERMISSIONS.NEWS_OVERRIDE,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_MANAGE,
      PERMISSIONS.LIVE_CREATE,
      PERMISSIONS.LIVE_EDIT,
      PERMISSIONS.RADIO_MANAGE,
      PERMISSIONS.ADS_MANAGE,
      PERMISSIONS.SPONSORS_MANAGE,
      PERMISSIONS.REVENUE_VIEW,
      PERMISSIONS.COMMUNITY_MODERATE,
      PERMISSIONS.USERS_MANAGE,
      PERMISSIONS.ROLES_MANAGE,
      PERMISSIONS.SETTINGS_MANAGE,
      PERMISSIONS.GOVERNANCE_MANAGE,
      PERMISSIONS.EVENTS_CREATE,
      PERMISSIONS.EVENTS_EDIT,
      PERMISSIONS.EVENTS_VERIFY,
      PERMISSIONS.EVENTS_PUBLISH,
      PERMISSIONS.EVENTS_RETRACT,
      PERMISSIONS.EVENTS_EXPIRE,
      PERMISSIONS.EVENTS_MERGE,
      PERMISSIONS.EVENTS_DELETE,
      PERMISSIONS.EVENTS_MANAGE_RECURRENCE,
      PERMISSIONS.EVENTS_MANAGE_FESTIVALS,
      PERMISSIONS.EVENTS_MANAGE_SOURCES,
      PERMISSIONS.EVENTS_MANAGE_KNOWLEDGE_LINKS,
    ],
    badgeColor: "bg-rose-500/10 text-rose-500 border-rose-500/20"
  },
  super_admin: {
    id: "super_admin",
    nameNe: "मुख्य प्रशासक (Super Admin)",
    nameEn: "Super Administrator",
    descriptionNe: "प्लेटफर्मका सबै स्रोत, सुरक्षा र प्रणालीमा पूर्ण अधिकार।",
    descriptionEn: "Full system authority over all platform resources, security and governance.",
    permissions: ["*"],
    badgeColor: "bg-rose-600 text-white shadow-sm"
  },
  tenant_admin: {
    id: "tenant_admin",
    nameNe: "टेनान्ट प्रशासक (Tenant Admin)",
    nameEn: "Tenant Administrator",
    descriptionNe: "संस्थागत टेनान्ट भित्र सामग्री, प्रयोगकर्ता, र सेटिङहरू व्यवस्थापन गर्ने।",
    descriptionEn: "Can manage content, users, and settings strictly within their tenant workspace.",
    permissions: [
      PERMISSIONS.NEWS_CREATE,
      PERMISSIONS.NEWS_EDIT,
      PERMISSIONS.NEWS_PUBLISH,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_MANAGE,
      PERMISSIONS.COMMUNITY_MODERATE,
      PERMISSIONS.USERS_MANAGE,
      PERMISSIONS.SETTINGS_MANAGE
    ],
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20"
  },
  tenant_editor: {
    id: "tenant_editor",
    nameNe: "टेनान्ट सम्पादक (Tenant Editor)",
    nameEn: "Tenant Editor",
    descriptionNe: "संस्थागत टेनान्ट भित्र समाचार मस्यौदा, सम्पादन र प्रकाशन गर्ने।",
    descriptionEn: "Can draft, edit, and publish content strictly within their tenant workspace.",
    permissions: [
      PERMISSIONS.NEWS_CREATE,
      PERMISSIONS.NEWS_EDIT,
      PERMISSIONS.NEWS_PUBLISH,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.COMMUNITY_MODERATE
    ],
    badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
  },
  tenant_member: {
    id: "tenant_member",
    nameNe: "टेनान्ट सदस्य (Tenant Member)",
    nameEn: "Tenant Member",
    descriptionNe: "संस्थागत टेनान्ट भित्र टिप्पणी गर्ने र छलफलमा भाग लिने।",
    descriptionEn: "Can participate in community discussions strictly within their tenant workspace.",
    permissions: [
      PERMISSIONS.COMMUNITY_POST,
      PERMISSIONS.COMMUNITY_COMMENT
    ],
    badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20"
  },
  tenant_viewer: {
    id: "tenant_viewer",
    nameNe: "टेनान्ट दर्शक (Tenant Viewer)",
    nameEn: "Tenant Viewer",
    descriptionNe: "संस्थागत टेनान्ट भित्र सामग्री पढ्न र हेर्न सक्ने।",
    descriptionEn: "Can view internal tenant content and resources.",
    permissions: [],
    badgeColor: "bg-slate-500/10 text-slate-500 border-slate-500/20"
  },
  acharya: {
    id: "acharya",
    nameNe: "आचार्य / प्रशिक्षक (Acharya / Instructor)",
    nameEn: "Academy Acharya / Instructor",
    descriptionNe: "अनलाइन गुरुकुल पाठ्यक्रम, कक्षा, परीक्षा, हाजिरी र प्रमाणपत्र मूल्याङ्कन गर्ने।",
    descriptionEn: "Can manage Gurukul courses, live classes, timestamped Q&A, assessments, grading, and competency records.",
    permissions: [
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.LIVE_CREATE,
      PERMISSIONS.LIVE_EDIT,
      PERMISSIONS.EVENTS_MANAGE_KNOWLEDGE_LINKS
    ],
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20"
  },
  radio_producer: {
    id: "radio_producer",
    nameNe: "रेडियो निर्माता / प्रस्तोता (Radio Producer)",
    nameEn: "RadioOS Broadcast Producer",
    descriptionNe: "सनातन रेडियो प्रसारण घडी, कार्यक्रम तालिका, बुलेटिन, जिङ्गल र रेकर्डिङ व्यवस्थापन गर्ने।",
    descriptionEn: "Can manage RadioOS broadcast clock, live/backup streams, presenters, jingles, news bulletins, and archives.",
    permissions: [
      PERMISSIONS.RADIO_MANAGE,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_MANAGE,
      PERMISSIONS.LIVE_CREATE
    ],
    badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/20"
  },
  reader: {
    id: "reader",
    nameNe: "पाठक (Reader)",
    nameEn: "Public Reader",
    descriptionNe: "सार्वजनिक समाचार, रेडियो, ग्रन्थ र पञ्चाङ्ग अध्ययन गर्ने प्रयोगकर्ता।",
    descriptionEn: "Can read public articles, listen to Sanatan Radio, explore SGIS manuscripts, and view Panchang.",
    permissions: [],
    badgeColor: "bg-slate-500/10 text-slate-500 border-slate-500/20"
  },
  fact_checker: {
    id: "fact_checker",
    nameNe: "तथ्य जाँचकर्ता (Fact Checker)",
    nameEn: "Source & Fact Verifier",
    descriptionNe: "समाचारका स्रोत, दाबी र प्रमाण प्रमाणीकरण गर्ने।",
    descriptionEn: "Verifies primary sources, claim-to-source mappings, and fact-check checklists before publication.",
    permissions: [
      PERMISSIONS.NEWS_EDIT,
      PERMISSIONS.EVENTS_VERIFY,
      PERMISSIONS.EVENTS_MANAGE_SOURCES,
    ],
    badgeColor: "bg-emerald-600/10 text-emerald-600 border-emerald-600/20"
  },
  news_editor: {
    id: "news_editor",
    nameNe: "समाचार सम्पादक (News Editor)",
    nameEn: "Newsroom Desk Editor",
    descriptionNe: "समाचार मस्यौदा सम्पादन, विधा वर्गीकरण र समीक्षा गर्ने।",
    descriptionEn: "Edits news drafts, assigns canonical categories, and coordinates desk reviews.",
    permissions: [
      PERMISSIONS.NEWS_CREATE,
      PERMISSIONS.NEWS_EDIT,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_MANAGE,
      PERMISSIONS.EVENTS_EDIT,
    ],
    badgeColor: "bg-teal-600/10 text-teal-600 border-teal-600/20"
  },
  chief_editor: {
    id: "chief_editor",
    nameNe: "प्रधान सम्पादक (Chief Editor)",
    nameEn: "Editor-in-Chief",
    descriptionNe: "सम्पादकीय नीति, अन्तिम प्रकाशन स्वीकृति, गृहपृष्ठ संरचना र सुधार निर्णयको सर्वोच्च सम्पादकीय अधिकार।",
    descriptionEn: "Final editorial authority over publication, Homepage composition, corrections, and takedowns.",
    permissions: [
      PERMISSIONS.NEWS_CREATE,
      PERMISSIONS.NEWS_EDIT,
      PERMISSIONS.NEWS_PUBLISH,
      PERMISSIONS.NEWS_DELETE,
      PERMISSIONS.NEWS_OVERRIDE,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_MANAGE,
      PERMISSIONS.LIVE_CREATE,
      PERMISSIONS.LIVE_EDIT,
      PERMISSIONS.RADIO_MANAGE,
      PERMISSIONS.EVENTS_CREATE,
      PERMISSIONS.EVENTS_EDIT,
      PERMISSIONS.EVENTS_VERIFY,
      PERMISSIONS.EVENTS_PUBLISH,
      PERMISSIONS.EVENTS_RETRACT,
      PERMISSIONS.GOVERNANCE_MANAGE,
    ],
    badgeColor: "bg-amber-600/10 text-amber-600 border-amber-600/20"
  },
  sgis_scholar: {
    id: "sgis_scholar",
    nameNe: "सनातन ग्रन्थ विद्वान् (SGIS Scholar)",
    nameEn: "SGIS Manuscript Scholar",
    descriptionNe: "सनातन ग्रन्थ, संस्कृत श्लोक, भाष्य र उद्धरणहरूको प्राज्ञिक प्रमाणीकरण गर्ने।",
    descriptionEn: "Reviews and approves SGIS manuscripts, Sanskrit verses, translations, and scholarly citations.",
    permissions: [
      PERMISSIONS.NEWS_EDIT,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.EVENTS_MANAGE_KNOWLEDGE_LINKS,
      PERMISSIONS.EVENTS_MANAGE_SOURCES,
    ],
    badgeColor: "bg-amber-700/10 text-amber-700 border-amber-700/20"
  },
  manuscript_curator: {
    id: "manuscript_curator",
    nameNe: "पाण्डुलिपि संरक्षक (Manuscript Curator)",
    nameEn: "Archival Manuscript Curator",
    descriptionNe: "पाण्डुलिपि डिजिटाइजेसन, मेटाडेटा दर्ता र अभिलेख संरक्षण गर्ने।",
    descriptionEn: "Catalogs archival manuscripts, metadata, provenance records, and digitization assets.",
    permissions: [
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_MANAGE,
      PERMISSIONS.EVENTS_MANAGE_KNOWLEDGE_LINKS,
    ],
    badgeColor: "bg-cyan-600/10 text-cyan-600 border-cyan-600/20"
  },
  media_producer: {
    id: "media_producer",
    nameNe: "मिडिया निर्माता (Media Producer)",
    nameEn: "MediaOS & ListenOS Producer",
    descriptionNe: "लाइभ टिभी, पोडकास्ट, भिडियो एपिसोड र ट्रान्सक्रिप्ट उत्पादन गर्ने।",
    descriptionEn: "Manages Live TV broadcasts, VOD clips, ListenOS podcast episodes, and transcripts.",
    permissions: [
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_MANAGE,
      PERMISSIONS.LIVE_CREATE,
      PERMISSIONS.LIVE_EDIT,
      PERMISSIONS.RADIO_MANAGE,
    ],
    badgeColor: "bg-rose-500/10 text-rose-500 border-rose-500/20"
  },
  community_moderator: {
    id: "community_moderator",
    nameNe: "चौतारी मोडरेटर (Community Moderator)",
    nameEn: "Chautari Community Moderator",
    descriptionNe: "चौतारी छलफल, उजुरी समीक्षा र सामुदायिक मर्यादा कायम राख्ने।",
    descriptionEn: "Reviews flagged community posts, enforces civic guidelines, and curates public discussions.",
    permissions: [
      PERMISSIONS.COMMUNITY_POST,
      PERMISSIONS.COMMUNITY_COMMENT,
      PERMISSIONS.COMMUNITY_MODERATE,
    ],
    badgeColor: "bg-pink-500/10 text-pink-500 border-pink-500/20"
  },
  finance_auditor: {
    id: "finance_auditor",
    nameNe: "वित्तीय लेखापरीक्षक (Finance Auditor)",
    nameEn: "Financial Ledger Auditor",
    descriptionNe: "RevenueOS आम्दानी, बीजक र अपरिवर्तनीय लेजर अभिलेखहरूको लेखापरीक्षण गर्ने।",
    descriptionEn: "Read and audit authority over RevenueOS campaigns, invoices, and append-only ledger adjustments.",
    permissions: [
      PERMISSIONS.REVENUE_VIEW,
      PERMISSIONS.GOVERNANCE_MANAGE,
    ],
    badgeColor: "bg-indigo-600/10 text-indigo-600 border-indigo-600/20"
  },
  commerce_manager: {
    id: "commerce_manager",
    nameNe: "वाणिज्य व्यवस्थापक (Commerce Manager)",
    nameEn: "Sanatan Store & Commerce Manager",
    descriptionNe: "सनातन स्टोरका उत्पादन, मूल्य, स्टक र अर्डर वितरण व्यवस्थापन गर्ने।",
    descriptionEn: "Manages Store product catalog, inventory, order fulfillment, and store snapshot publishing.",
    permissions: [
      PERMISSIONS.REVENUE_VIEW,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.SETTINGS_MANAGE,
    ],
    badgeColor: "bg-emerald-600/10 text-emerald-600 border-emerald-600/20"
  }
};

export interface MembershipPlan {
  id: string;
  tierKey: "free" | "patron" | "sadhak" | "sanrakshak" | "corporate";
  nameNe: string;
  nameEn: string;
  priceNprMonthly: number;
  priceNprYearly: number;
  taglineNe: string;
  taglineEn: string;
  badgeNe: string;
  badgeColor: string;
  benefitsNe: string[];
  benefitsEn: string[];
  isPopular?: boolean;
}

export const MEMBERSHIP_TIERS: Record<string, MembershipPlan> = {
  free: {
    id: "tier-free",
    tierKey: "free",
    nameNe: "साधारण (Free)",
    nameEn: "Free Visitor",
    priceNprMonthly: 0,
    priceNprYearly: 0,
    taglineNe: "सनातन समाचार तथा प्रसारणको निःशुल्क पहुँच",
    taglineEn: "Basic access to daily news, live audio, and public broadcasts",
    badgeNe: "निःशुल्क",
    badgeColor: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    benefitsNe: [
      "दैनिक राष्ट्रिय तथा क्षेत्रीय समाचार",
      "सनातन रेडियो २४/७ प्रत्यक्ष पहुँच",
      "सार्वजनिक लाइभ स्ट्रिमहरू",
      "खोज तथा ज्ञान सामग्री"
    ],
    benefitsEn: [
      "Access to daily news articles",
      "Sanatan Radio 24/7 live stream",
      "Public live events & streams",
      "Basic search & knowledge hub"
    ]
  },
  patron: {
    id: "tier-patron",
    tierKey: "patron",
    nameNe: "संरक्षक (Patron)",
    nameEn: "Patron Member",
    priceNprMonthly: 250,
    priceNprYearly: 2500,
    taglineNe: "कम विज्ञापन र विशेष साप्ताहिक समाचार बुलेटिन",
    taglineEn: "Ad-light experience & exclusive weekly intelligence digest",
    badgeNe: "संरक्षक",
    badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    benefitsNe: [
      "विज्ञापन-रहित/कम विज्ञापन अनुभव (Ad-Light)",
      "साप्ताहिक विशेष सम्पादकीय सामाचार",
      "चौतारीमा प्राथमिकताका साथ पोष्ट प्रकाशन",
      "अफलाइन समाचार सङ्ग्रह (Offline Reading)"
    ],
    benefitsEn: [
      "Ad-light distraction-free reading",
      "Weekly editorial intelligence newsletter",
      "Priority posting on Chautari community",
      "Offline reading collection"
    ]
  },
  sadhak: {
    id: "tier-sadhak",
    tierKey: "sadhak",
    nameNe: "साधक (Sadhak)",
    nameEn: "Sadhak Subscriber",
    priceNprMonthly: 500,
    priceNprYearly: 5000,
    taglineNe: "एचडी अडियो, विशेष श्रव्य शृङ्खला र सिकाइ एकेडेमी",
    taglineEn: "Premium ListenOS audio, saved playlists & LearningOS Academy",
    badgeNe: "साधक (Popular)",
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    isPopular: true,
    benefitsNe: [
      "ListenOS उच्च गुणस्तरीय अडियो (HD Audio Streaming)",
      "अनुकूलित अडियो सङ्ग्रह र असीमित प्लेलिस्ट",
      "एकेडेमी (LearningOS) पाठ्यक्रमहरूमा पूर्ण पहुँच",
      "दैनिक सम्पादकीय अडियो ब्रिफिङ",
      "सबै 'संरक्षक' सुविधा समावेश"
    ],
    benefitsEn: [
      "ListenOS High-Definition lossless audio",
      "Custom audio playlists & unlimited bookmarks",
      "Full access to LearningOS Academy courses",
      "Daily executive audio news briefing",
      "Includes all Patron benefits"
    ]
  },
  sanrakshak: {
    id: "tier-sanrakshak",
    tierKey: "sanrakshak",
    nameNe: "संस्थापक संरक्षक (Sanrakshak)",
    nameEn: "Sanrakshak Fellow",
    priceNprMonthly: 1500,
    priceNprYearly: 15000,
    taglineNe: "विशेष अनुसन्धान, जिल्ला जासुसी रिपोर्ट र भीआईपी सम्पादकीय संवाद",
    taglineEn: "Exclusive district intelligence, investigative dossiers & VIP events",
    badgeNe: "संस्थापक संरक्षक",
    badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    benefitsNe: [
      "७७ वटा जिल्लाको विशेष खोजमूलक प्रतिवेदन (District Intelligence)",
      "वरिष्ठ सम्पादकहरूसँग प्रत्यक्ष पाक्षिक भर्चुअल संवाद",
      "विशेष राष्ट्रिय तथा धार्मिक समारोहमा भीआईपी निमन्त्रणा",
      "सनातन ज्ञानकोषमा डिजिटल नाम अङ्कन",
      "सबै 'साधक' सुविधा समावेश"
    ],
    benefitsEn: [
      "Exclusive 77-district investigative reports",
      "Bi-weekly live dialogue with Senior Editors",
      "VIP invitations to national heritage & cultural events",
      "Digital recognition in Sanatan Knowledge Archives",
      "Includes all Sadhak benefits"
    ]
  },
  corporate: {
    id: "tier-corporate",
    tierKey: "corporate",
    nameNe: "संस्थागत (Corporate)",
    nameEn: "Corporate & Institutional",
    priceNprMonthly: 5000,
    priceNprYearly: 50000,
    taglineNe: "टिम खाता, मिडिया विश्लेषणात्मक र विशेष प्रायोजन अवसरहरू",
    taglineEn: "Multi-seat team accounts, media analytics & sponsorship perks",
    badgeNe: "संस्थागत",
    badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    benefitsNe: [
      "१० जनासम्मका लागि टिम सदस्य खाता (10 Team Seats)",
      "RevenueOS र पाठक विश्लेषणात्मक रिपोर्ट पहुँच",
      "रेडियो र नेपाल हबमा संस्थागत प्रायोजनमा छुट",
      "विशेष मिडिया विज्ञप्ति सम्प्रेषण सुविधा"
    ],
    benefitsEn: [
      "Multi-seat team account (up to 10 users)",
      "Access to media analytics & readership dashboards",
      "Discounted sponsorship rates on RadioOS & Nepal Hub",
      "Priority press release distribution service"
    ]
  }
};

export interface ReputationLevelInfo {
  levelKey: string;
  nameNe: string;
  nameEn: string;
  minPoints: number;
  maxPoints: number;
  badgeNe: string;
  badgeColor: string;
  perksNe: string;
}

export const REPUTATION_LEVELS: ReputationLevelInfo[] = [
  {
    levelKey: "explorer",
    nameNe: "अन्वेषक (Explorer)",
    nameEn: "Explorer",
    minPoints: 0,
    maxPoints: 99,
    badgeNe: "अन्वेषक",
    badgeColor: "bg-slate-500/10 text-slate-500",
    perksNe: "सामान्य पाठक तथा टिप्पणी गर्ने अधिकार।"
  },
  {
    levelKey: "contributor",
    nameNe: "योगदानकर्ता (Contributor)",
    nameEn: "Contributor",
    minPoints: 100,
    maxPoints: 299,
    badgeNe: "योगदानकर्ता",
    badgeColor: "bg-blue-500/10 text-blue-500",
    perksNe: "चौतारीमा तस्वीर र मिडिया पोष्ट गर्न पाउने।"
  },
  {
    levelKey: "reporter",
    nameNe: "संवाददाता (Reporter)",
    nameEn: "Reporter",
    minPoints: 300,
    maxPoints: 599,
    badgeNe: "संवाददाता",
    badgeColor: "bg-indigo-500/10 text-indigo-500",
    perksNe: "प्रमाणित नागरिक रिपोर्ट पठाउन र ब्याज पाउने।"
  },
  {
    levelKey: "scholar",
    nameNe: "विद्वान् (Scholar)",
    nameEn: "Scholar",
    minPoints: 600,
    maxPoints: 999,
    badgeNe: "विद्वान्",
    badgeColor: "bg-purple-500/10 text-purple-500",
    perksNe: "ज्ञानकोष सम्पादन प्रस्ताव गर्न र लेख समीक्षा गर्न पाउने।"
  },
  {
    levelKey: "guardian",
    nameNe: "संरक्षक (Guardian)",
    nameEn: "Guardian",
    minPoints: 1000,
    maxPoints: 1999,
    badgeNe: "संरक्षक",
    badgeColor: "bg-amber-500/10 text-amber-500",
    perksNe: "मोडरेटर अधिकार र प्रत्यक्ष सम्पादकीय संवाद।"
  },
  {
    levelKey: "acharya",
    nameNe: "आचार्य (Acharya)",
    nameEn: "Acharya Master",
    minPoints: 2000,
    maxPoints: 999999,
    badgeNe: "आचार्य",
    badgeColor: "bg-rose-500/10 text-rose-500 font-bold",
    perksNe: "शीर्ष सभ्यतागत सल्लाहकार र विशिष्ट दर्जा।"
  }
];

export const REPUTATION_POINTS = {
  ARTICLE_PUBLISHED: 20,
  VERIFIED_REPORT: 15,
  HELPFUL_ANSWER: 5,
  CHAUTARI_POST: 3,
  COMMENT_ADDED: 1,
  ARTICLE_BOOKMARKED: 1,
} as const;
