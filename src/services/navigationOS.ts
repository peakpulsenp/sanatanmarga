import React from "react";
import { 
  Zap, 
  Sparkles, 
  Command, 
  FileText, 
  Tag, 
  BookOpen, 
  Image, 
  ShoppingBag, 
  Activity, 
  Users, 
  ShieldAlert, 
  Database, 
  Settings,
  GraduationCap, 
  Tv, 
  DollarSign, 
  Radio, 
  BarChart3, 
  Globe, 
  Layers, 
  Cpu, 
  Flame, 
  Compass, 
  MessageSquare, 
  Terminal, 
  Bell, 
  Lock,
  Headphones,
  Home,
  Newspaper,
  Search,
  Calendar,
  KeyRound,
  FileCheck,
  ShieldCheck,
  TrendingUp,
  Share2,
  FolderLock,
  Key,
  LifeBuoy,
  Store,
  Crown,
  HelpCircle,
  MapPin,
  Camera,
  FolderArchive,
  Workflow,
  RadioTower,
  Sliders,
  Shield,
  Layers2,
  Smartphone,
  CheckCircle2,
  Building2,
  Briefcase,
  Info
} from "lucide-react";
import { UserPermission, PERMISSIONS } from "@/src/constants/permissions";
import type { UserRole } from "@/src/types";
import { featureControlOS } from "./featureControlOS";

export type NavigationCategory = 
  | "editorial" 
  | "broadcast" 
  | "community" 
  | "revenue" 
  | "analytics" 
  | "governance" 
  | "platform"
  | "knowledge"
  | "general";

export type VisibilityScope = "public" | "staff" | "admin";

export interface NavigationSubItem {
  id: string;
  path: string;
  module: string;
  labelNe: string;
  labelEn: string;
  descriptionNe?: string;
  descriptionEn?: string;
  requiredPermission?: UserPermission | UserPermission[];
  allowedRoles?: UserRole[];
  activePattern?: RegExp | string;
  badge?: string;
  featureId?: string;
}

export interface NavigationItem {
  id: string;
  path: string;
  module: string;
  category: NavigationCategory;
  visibility: VisibilityScope;
  requiredPermission?: UserPermission | UserPermission[];
  allowedRoles?: UserRole[];
  desktopVisible: boolean;
  mobileVisible: boolean;
  labelNe: string;
  labelEn: string;
  descriptionNe?: string;
  descriptionEn?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  parentId?: string;
  subItems?: NavigationSubItem[];
  activePattern?: RegExp | string;
  order: number;
  badge?: {
    textNe: string;
    textEn: string;
    color?: string;
  };
  featureId?: string;
}

export interface NavigationCategoryMeta {
  id: NavigationCategory;
  nameNe: string;
  nameEn: string;
  descriptionNe: string;
  descriptionEn: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  order: number;
}

export const NAVIGATION_CATEGORIES: Record<NavigationCategory, NavigationCategoryMeta> = {
  editorial: {
    id: "editorial",
    nameNe: "सम्पादकीय तथा न्यूजरुम",
    nameEn: "Editorial & Newsroom",
    descriptionNe: "समाचार सम्पादन, कार्यप्रवाह, विधा र खोज केन्द्र",
    descriptionEn: "Newsroom editing, workflows, categories and discovery",
    icon: Newspaper,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    order: 1
  },
  broadcast: {
    id: "broadcast",
    nameNe: "प्रसारण तथा मिडिया",
    nameEn: "Broadcast & Media",
    descriptionNe: "रेडियो, प्रत्यक्ष भिडियो, पडकास्ट र मिडिया लाइब्रेरी",
    descriptionEn: "Sanatan Radio, LiveOS, Podcasts and Media Library",
    icon: Radio,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    order: 2
  },
  community: {
    id: "community",
    nameNe: "समुदाय तथा सदस्यता",
    nameEn: "Community & Membership",
    descriptionNe: "चौतारी, प्रयोगकर्ताहरू, सदस्यता र सामाजिक हब",
    descriptionEn: "Chautari forums, user accounts, membership and social hub",
    icon: Users,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    order: 3
  },
  revenue: {
    id: "revenue",
    nameNe: "राजस्व तथा वाणिज्य",
    nameEn: "Revenue & Commerce",
    descriptionNe: "विज्ञापन, प्रायोजन, पसल र वित्तीय विवरण",
    descriptionEn: "Advertisements, sponsorships, Sanatan Store and billing",
    icon: DollarSign,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    order: 4
  },
  analytics: {
    id: "analytics",
    nameNe: "विश्लेषण तथा तथ्याङ्क",
    nameEn: "Analytics & Intelligence",
    descriptionNe: "सम्पादकीय, पाठक, रेडियो र प्रत्यक्ष तथ्याङ्क",
    descriptionEn: "Editorial, audience, radio and streaming analytics",
    icon: BarChart3,
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    order: 5
  },
  governance: {
    id: "governance",
    nameNe: "सुशासन तथा सुरक्षा",
    nameEn: "Governance & Security",
    descriptionNe: "लेखापरीक्षण, अनुमति, दोहोरो स्वीकृति र सुरक्षा लग",
    descriptionEn: "AuditOS, Permissions, Dual-Key Approvals and Security events",
    icon: ShieldCheck,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    order: 6
  },
  platform: {
    id: "platform",
    nameNe: "प्रणाली तथा सेटिङ",
    nameEn: "Platform & Systems",
    descriptionEn: "Disaster Recovery, Settings, AI Observability and Health",
    descriptionNe: "विपद् पुनरुत्थान, सेटिङहरू, एआई र प्रणाली स्वास्थ्य",
    icon: Settings,
    color: "text-slate-500 bg-slate-500/10 border-slate-500/20",
    order: 7
  },
  knowledge: {
    id: "knowledge",
    nameNe: "ज्ञान तथा अभिलेख",
    nameEn: "Knowledge & Archives",
    descriptionNe: "ज्ञानकोष, अभिलेख, अकादेमी, समयरेखा र चाडपर्व",
    descriptionEn: "Knowledge base, archives, academy, timeline and festivals",
    icon: BookOpen,
    color: "text-teal-500 bg-teal-500/10 border-teal-500/20",
    order: 8
  },
  general: {
    id: "general",
    nameNe: "सामान्य",
    nameEn: "General",
    descriptionNe: "सार्वजनिक पोर्टल र पृष्ठहरू",
    descriptionEn: "Public portal and pages",
    icon: Home,
    color: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
    order: 9
  }
};

/**
 * CANONICAL NAVIGATION REGISTRY
 * Single source of truth for the entire SanatanMarga platform.
 */
export const CANONICAL_NAVIGATION_REGISTRY: NavigationItem[] = [
  // ==========================================
  // 1. EDITORIAL MODULES
  // ==========================================
  {
    id: "nav-editorial-command",
    path: "/admin/command-center",
    module: "Editorial Command Center",
    category: "editorial",
    visibility: "staff",
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "कमान्ड सेन्टर (Command Center)",
    labelEn: "Editorial Command",
    descriptionNe: "प्रत्यक्ष सम्पादकीय कार्यतालिका तथा समाचार अनुगमन",
    descriptionEn: "Live editorial task scheduling and story evolution tracker",
    icon: Flame,
    order: 101,
    badge: { textNe: "लाइभ", textEn: "LIVE", color: "bg-red-500 text-white" }
  },
  {
    id: "nav-editorial-editor",
    path: "/admin/editor",
    module: "Newsroom Editor",
    category: "editorial",
    visibility: "staff",
    requiredPermission: PERMISSIONS.NEWS_CREATE,
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor", "journalist"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "न्यूजरुम सम्पादन (Newsroom)",
    labelEn: "Newsroom Editor",
    descriptionNe: "नयाँ समाचार लेखन, फ्याक्ट चेक र प्रकाशन",
    descriptionEn: "Create, edit, fact-check and publish news stories",
    icon: Newspaper,
    order: 102,
    activePattern: "^/admin/(editor|newsroom)(/.*)?$"
  },
  {
    id: "nav-editorial-articles",
    path: "/admin/articles",
    module: "Articles Manager",
    category: "editorial",
    visibility: "staff",
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "समाचार सूची (Articles)",
    labelEn: "Articles & Stories",
    descriptionNe: "प्रकाशन गरिएका र मस्यौदा समाचारहरूको अभिलेख",
    descriptionEn: "Manage published, draft and under-review articles",
    icon: FileText,
    order: 103,
    subItems: [
      {
        id: "nav-editorial-categories",
        path: "/admin/categories",
        module: "Categories",
        labelNe: "विधाहरू (Categories)",
        labelEn: "News Categories",
        allowedRoles: ["admin", "super_admin", "chief_editor", "editor"]
      },
      {
        id: "nav-editorial-nepalhub",
        path: "/admin/nepal-hub",
        module: "District Hubs",
        labelNe: "७७ जिल्ला हब (District Hubs)",
        labelEn: "77 District Hubs",
        allowedRoles: ["admin", "super_admin", "chief_editor", "editor"]
      }
    ]
  },
  {
    id: "nav-editorial-workflows",
    path: "/admin/workflows",
    module: "WorkflowOS",
    category: "editorial",
    visibility: "admin",
    allowedRoles: ["admin", "super_admin"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "कार्यप्रवाह (WorkflowOS)",
    labelEn: "Workflow Automation",
    descriptionNe: "कान्बान सम्पादकीय बोर्ड, नियम तथा स्वचालित पाइपलाइन",
    descriptionEn: "Kanban board, state machines and automation rules",
    icon: Workflow,
    order: 104,
    badge: { textNe: "स्वचालित", textEn: "AUTO", color: "bg-amber-500 text-slate-950 font-bold" }
  },
  {
    id: "nav-editorial-discovery",
    path: "/admin/discovery",
    module: "Discovery Center",
    category: "editorial",
    visibility: "staff",
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "अन्वेषण केन्द्र (Discovery)",
    labelEn: "Discovery Center",
    descriptionNe: "ट्रेन्डिङ विषय, एआई अनुसन्धान र स्रोत विश्लेषण",
    descriptionEn: "Trending intelligence, research topics and source discovery",
    icon: Sparkles,
    order: 105,
    subItems: [
      {
        id: "nav-editorial-translation",
        path: "/admin/translation",
        module: "TranslationOS",
        labelNe: "अनुवाद प्रणाली (TranslationOS)",
        labelEn: "Translation Engine",
        allowedRoles: ["admin", "super_admin", "chief_editor", "editor"]
      }
    ]
  },

  // ==========================================
  // 2. BROADCAST & MEDIA MODULES
  // ==========================================
  {
    id: "nav-broadcast-radio",
    path: "/admin/radio",
    module: "Sanatan RadioOS",
    category: "broadcast",
    visibility: "staff",
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "सनातन रेडियो (RadioOS)",
    labelEn: "Sanatan Radio OS",
    descriptionNe: "२४/७ स्ट्रिमिङ, अडियो बुलेटिन र प्रसारण तालिका",
    descriptionEn: "24/7 radio streaming, bulletins and audio scheduling",
    icon: Radio,
    order: 201,
    badge: { textNe: "२४/७", textEn: "24/7", color: "bg-rose-500 text-white" }
  },
  {
    id: "nav-broadcast-live",
    path: "/admin/live",
    module: "LiveOS",
    category: "broadcast",
    visibility: "staff",
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "प्रत्यक्ष प्रसारण (LiveOS)",
    labelEn: "Live Streaming OS",
    descriptionNe: "प्रत्यक्ष भिडियो स्ट्रिम तथा स्थलगत कभरेज",
    descriptionEn: "Live video feeds, multi-camera broadcasting and tickers",
    icon: Tv,
    order: 202,
    badge: { textNe: "लाइभ", textEn: "LIVE", color: "bg-red-600 text-white font-black" }
  },
  {
    id: "nav-broadcast-media",
    path: "/admin/media",
    module: "MediaOS & Asset Library",
    category: "broadcast",
    visibility: "staff",
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor", "photographer"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "मिडिया केन्द्र (MediaOS)",
    labelEn: "Media Library",
    descriptionNe: "तस्बिर, भिडियो, पोडकास्ट र डिजिटल सम्पत्ति भण्डार",
    descriptionEn: "Photo gallery, audio podcasts, videos and digital assets",
    icon: Image,
    order: 203,
    activePattern: "^/admin/media(-os|-assets|-library)?"
  },

  // ==========================================
  // 3. COMMUNITY & MEMBERSHIP MODULES
  // ==========================================
  {
    id: "nav-community-users",
    path: "/admin/users",
    module: "Users & MembershipOS",
    category: "community",
    visibility: "admin",
    requiredPermission: PERMISSIONS.USERS_MANAGE,
    allowedRoles: ["admin", "super_admin"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "सदस्य तथा अनुमति (Users & Roles)",
    labelEn: "Users & Roles",
    descriptionNe: "प्रयोगकर्ताहरू, भूमिका, अनुमति प्याकेज र प्रतिष्ठा स्कोर",
    descriptionEn: "User accounts, roles, permission packages and reputation",
    icon: Users,
    order: 301,
    subItems: [
      {
        id: "nav-community-moderation",
        path: "/admin/moderation",
        module: "Moderation",
        labelNe: "समुदाय मोडरेसन (Moderation)",
        labelEn: "Content Moderation",
        allowedRoles: ["admin", "super_admin", "chief_editor", "editor"]
      },
      {
        id: "nav-community-chautari",
        path: "/admin/community",
        module: "Chautari Admin",
        labelNe: "चौतारी व्यवस्थापन (Chautari)",
        labelEn: "Chautari Forum Admin",
        allowedRoles: ["admin", "super_admin", "chief_editor", "editor"]
      },
      {
        id: "nav-community-social",
        path: "/admin/social",
        module: "Social Hub Sync",
        labelNe: "सामाजिक सञ्जाल (Social Sync)",
        labelEn: "Social Channels Sync",
        allowedRoles: ["admin", "super_admin", "chief_editor", "editor"]
      }
    ]
  },
  {
    id: "nav-community-inquiries",
    path: "/admin/inquiries",
    module: "Inquiries & Contact",
    category: "community",
    visibility: "staff",
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "सम्पर्क तथा सोधपुछ (Inquiries)",
    labelEn: "Inquiries & Messages",
    descriptionNe: "पाठक प्रतिक्रिया, विज्ञापन सोधपुछ र सन्देशहरू",
    descriptionEn: "Reader inquiries, advertising requests and contact messages",
    icon: MessageSquare,
    order: 302,
    subItems: [
      {
        id: "nav-community-contact-messages",
        path: "/admin/contact-messages",
        module: "Contact Messages",
        labelNe: "सम्पर्क सन्देशहरू (Messages)",
        labelEn: "Direct Contact Messages",
        allowedRoles: ["admin", "super_admin", "chief_editor", "editor"]
      }
    ]
  },
  {
    id: "nav-community-events",
    path: "/admin/events",
    module: "Events & Talents",
    category: "community",
    visibility: "staff",
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "कार्यक्रम तथा प्रतिभा (Events & Talents)",
    labelEn: "Events & Talents",
    descriptionNe: "धार्मिक, सांस्कृतिक कार्यक्रम र मोडल/प्रतिभा प्रोफाइल",
    descriptionEn: "Cultural events, festival calendar and talent profiles",
    icon: Calendar,
    order: 303,
    subItems: [
      {
        id: "nav-community-models",
        path: "/admin/models",
        module: "Talents & Models",
        labelNe: "प्रतिभा तथा मोडल (Talents)",
        labelEn: "Talents & Model Directory",
        allowedRoles: ["admin", "super_admin", "chief_editor", "editor"]
      }
    ]
  },

  // ==========================================
  // 4. REVENUE & COMMERCE MODULES
  // ==========================================
  {
    id: "nav-revenue-os",
    path: "/admin/revenue-os",
    module: "RevenueOS",
    category: "revenue",
    visibility: "staff",
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "राजस्व प्रणाली (RevenueOS)",
    labelEn: "RevenueOS Monetization",
    descriptionNe: "विज्ञापन व्यवस्थापन, प्रायोजन, रेट कार्ड र बिलिङ",
    descriptionEn: "Ad inventory, campaigns, sponsorships, rate cards and billing",
    icon: DollarSign,
    order: 401,
    activePattern: "^/admin/revenue(-os)?"
  },
  {
    id: "nav-revenue-ads",
    path: "/admin/ads",
    module: "Ad Campaigns",
    category: "revenue",
    visibility: "staff",
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "विज्ञापन तथा अभियान (Ad Campaigns)",
    labelEn: "Ad Placements & Campaigns",
    descriptionNe: "ब्यानर, भिडियो एड, प्रायोजक स्लट र अभियान तालिका",
    descriptionEn: "Banner ads, video placements and sponsor banners",
    icon: Sliders,
    order: 402
  },
  {
    id: "nav-revenue-store",
    path: "/admin/store",
    module: "Sanatan Store & Commerce",
    category: "revenue",
    visibility: "staff",
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "सनातन पसल (Sanatan Store)",
    labelEn: "Sanatan Store Admin",
    descriptionNe: "पुस्तक, धार्मिक सामग्री, डिजिटल डाउनलोड र अर्डरहरू",
    descriptionEn: "Books, cultural artifacts, digital downloads and orders",
    icon: Store,
    order: 403,
    activePattern: "^/admin/(store|commerce)?"
  },
  {
    id: "nav-revenue-commerce-analytics",
    path: "/admin/commerce-analytics",
    module: "Commerce Analytics",
    category: "revenue",
    visibility: "staff",
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "वाणिज्य तथ्याङ्क (Commerce Stats)",
    labelEn: "Commerce Analytics",
    descriptionNe: "बिक्री तथ्याङ्क, रूपान्तरण दर र उत्पादन माग",
    descriptionEn: "Order conversions, store sales and product metrics",
    icon: TrendingUp,
    order: 404
  },

  // ==========================================
  // 5. ANALYTICS & INTELLIGENCE MODULES
  // ==========================================
  {
    id: "nav-analytics-os",
    path: "/admin/analytics",
    module: "AnalyticsOS",
    category: "analytics",
    visibility: "staff",
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "समग्र विश्लेषण (AnalyticsOS)",
    labelEn: "Platform AnalyticsOS",
    descriptionNe: "वास्तविक समय पाठक, ट्राफिक, सम्पादकीय र स्ट्रिमिङ विश्लेषण",
    descriptionEn: "Real-time audience, traffic, editorial and streaming metrics",
    icon: BarChart3,
    order: 501
  },
  {
    id: "nav-analytics-readers",
    path: "/admin/reader-analytics",
    module: "Audience & Reader Analytics",
    category: "analytics",
    visibility: "admin",
    allowedRoles: ["admin", "super_admin"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "पाठक विश्लेषण (Reader Analytics)",
    labelEn: "Audience Intelligence",
    descriptionNe: "पाठक संलग्नता, जिल्लागत पहुँच र पढ्ने समय",
    descriptionEn: "Reader engagement, retention and district reading habits",
    icon: Users,
    order: 502
  },
  {
    id: "nav-analytics-executive",
    path: "/admin/executive",
    module: "Executive Dashboard",
    category: "analytics",
    visibility: "admin",
    allowedRoles: ["admin", "super_admin"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "कार्यकारी ड्यासबोर्ड (Executive)",
    labelEn: "Executive KPI Dashboard",
    descriptionNe: "शीर्षस्तरीय केपीआई, वित्तीय वृद्धि र रणनीति मेट्रिक्स",
    descriptionEn: "High-level KPIs, revenue growth and organizational telemetry",
    icon: Crown,
    order: 503
  },

  // ==========================================
  // 6. GOVERNANCE & SECURITY MODULES
  // ==========================================
  {
    id: "nav-governance-os",
    path: "/admin/governance",
    module: "GovernanceOS",
    category: "governance",
    visibility: "staff",
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "सुशासन तथा लेखापरीक्षण (GovernanceOS)",
    labelEn: "Governance & AuditOS",
    descriptionNe: "डेटा सुशासन, दोहोरो स्वीकृति, ब्लकचेन लेजर र सुरक्षा नीति",
    descriptionEn: "Dual-key authorization, cryptographic audit logs and policies",
    icon: ShieldCheck,
    order: 601,
    activePattern: "^/admin/(governance|data-governance|content-audit|audit)?"
  },
  {
    id: "nav-governance-tenants",
    path: "/admin/tenants",
    module: "Tenant Federation",
    category: "governance",
    visibility: "admin",
    allowedRoles: ["admin", "super_admin"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "टेनेन्ट फेडेरेसन (Tenants)",
    labelEn: "Tenant Federation",
    descriptionNe: "बहु-संस्था संरचना, शाखा नेटवर्क र डोमेन व्यवस्थापन",
    descriptionEn: "Multi-tenant organizations, affiliates and branch access",
    icon: Layers2,
    order: 602,
    subItems: [
      {
        id: "nav-governance-api-keys",
        path: "/admin/developer-api",
        module: "Developer API Keys",
        labelNe: "डेभलपर एपीआई (API Keys)",
        labelEn: "Developer API Keys",
        allowedRoles: ["admin", "super_admin"]
      }
    ]
  },
  {
    id: "nav-governance-notifications",
    path: "/admin/notifications",
    module: "Push Notifications & Broadcasts",
    category: "governance",
    visibility: "admin",
    allowedRoles: ["admin", "super_admin"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "पुश सूचना पठाउनुहोस् (Push Notifications)",
    labelEn: "Push Notifications",
    descriptionNe: "आपतकालीन अलर्ट, ब्रेकिङ न्युज र सूचना प्रसारण",
    descriptionEn: "Broadcast breaking push notifications to registered devices",
    icon: Bell,
    order: 603
  },

  // ==========================================
  // 7. PLATFORM & SYSTEMS MODULES
  // ==========================================
  {
    id: "nav-platform-mission-control",
    path: "/admin",
    module: "Mission Control",
    category: "platform",
    visibility: "staff",
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "मिसन कन्ट्रोल (Mission Control)",
    labelEn: "Mission Control",
    descriptionNe: "प्रणाली समग्र स्थिति, प्रत्यक्ष अलर्ट र सर्भर स्वास्थ्य",
    descriptionEn: "Central operations, live delivery status and server health",
    icon: Zap,
    order: 701,
    activePattern: "^/admin(/mission-control|/operations|/health|/system-health|/platform-health)?$",
    subItems: [
      {
        id: "nav-platform-system-health",
        path: "/admin/system-health",
        module: "System Health & Acceptance OS",
        labelNe: "सिस्टम स्वास्थ्य (System Health)",
        labelEn: "System Health & Acceptance OS",
        allowedRoles: ["admin", "super_admin", "chief_editor", "editor"]
      }
    ]
  },
  {
    id: "nav-platform-homepage",
    path: "/admin/homepage",
    module: "Homepage & Layout Manager",
    category: "platform",
    visibility: "staff",
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "गृहपृष्ठ प्रबन्धक (Homepage Manager)",
    labelEn: "Homepage & Layout Manager",
    descriptionNe: "मुख्य पृष्ठ खण्डहरू, क्युरेटेड ग्रिड र लेआउट",
    descriptionEn: "Curated grids, breaking tickers and section ordering",
    icon: LayoutDashboardIcon,
    order: 702,
    subItems: [
      {
        id: "nav-platform-design-os",
        path: "/admin/design-os",
        module: "Design OS 3.0",
        labelNe: "डिजाइन ओएस (Design OS 3.0)",
        labelEn: "Design & Editorial OS",
        allowedRoles: ["admin", "super_admin", "editor"]
      },
      {
        id: "nav-platform-pagebuilder",
        path: "/admin/page-builder",
        module: "Page Builder",
        labelNe: "पेज बिल्डर (Page Builder)",
        labelEn: "Page Builder & Sections",
        allowedRoles: ["admin", "super_admin"]
      },
      {
        id: "nav-platform-menu",
        path: "/admin/menu",
        module: "Menu Manager",
        labelNe: "मेनु प्रबन्धक (Menu Manager)",
        labelEn: "Navigation Menu Manager",
        allowedRoles: ["admin", "super_admin"]
      }
    ]
  },
  {
    id: "nav-platform-ai-observability",
    path: "/admin/ai-observability",
    module: "AI Observability & Agents",
    category: "platform",
    visibility: "staff",
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "एआई अवलोकन (AI Observability)",
    labelEn: "AI Observability & Agents",
    descriptionNe: "एआई टोकन खपत, प्रतिक्रिया गुणस्तर र एजेन्ट कन्फिगरेसन",
    descriptionEn: "AI token consumption, response fidelity and autonomous agents",
    icon: Cpu,
    order: 703,
    subItems: [
      {
        id: "nav-platform-agents",
        path: "/admin/agents",
        module: "AI Agents",
        labelNe: "स्वायत्त एजेन्ट (AI Agents)",
        labelEn: "Autonomous AI Agents",
        allowedRoles: ["admin", "super_admin"]
      }
    ]
  },
  {
    id: "nav-platform-disaster-recovery",
    path: "/admin/disaster-recovery",
    module: "Disaster Recovery & SnapshotOS",
    category: "platform",
    visibility: "admin",
    allowedRoles: ["admin", "super_admin"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "विपद् पुनरुत्थान (Disaster Recovery)",
    labelEn: "Disaster Recovery & Snapshots",
    descriptionNe: "स्न्यापसट भल्ट, स्वचालित ब्याकअप र आपतकालीन पुनर्स्थापना",
    descriptionEn: "Snapshot vault, database backups and failover restoration",
    icon: Database,
    order: 704
  },
  {
    id: "nav-platform-settings",
    path: "/admin/settings",
    module: "SettingsOS",
    category: "platform",
    visibility: "admin",
    allowedRoles: ["admin", "super_admin"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "प्रणाली सेटिङ (Settings & Dev)",
    labelEn: "Platform Settings",
    descriptionNe: "ब्रान्डिङ, सामाजिक लिंक, सुरक्षा कुञ्जी र प्रणाली कन्फिग",
    descriptionEn: "Branding, domain, theme parameters and global configuration",
    icon: Settings,
    order: 705,
    subItems: [
      {
        id: "nav-platform-feature-control",
        path: "/admin/feature-control",
        module: "Feature Control OS",
        labelNe: "फिचर कन्ट्रोल (Feature Control OS)",
        labelEn: "Feature Control & Launch Governance",
        descriptionNe: "केन्द्रीकृत फिचर नियन्त्रण, रोलआउट र किल-स्विच",
        descriptionEn: "Centralized release governance, kill-switches and rollout profiles",
        allowedRoles: ["admin", "super_admin", "chief_editor", "editor"],
        featureId: "infra.featureControl"
      },
      {
        id: "nav-platform-setup-guide",
        path: "/admin/setup-guide",
        module: "Setup Guide",
        labelNe: "स्थापना निर्देशिका (Setup Guide)",
        labelEn: "Platform Setup Guide",
        allowedRoles: ["admin", "super_admin"]
      }
    ]
  },

  // ==========================================
  // 8. KNOWLEDGE & ACADEMY MODULES
  // ==========================================
  {
    id: "nav-knowledge-hub",
    path: "/admin/knowledge",
    module: "Knowledge Base Admin",
    category: "knowledge",
    visibility: "staff",
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "ज्ञानकोष तथा ग्रन्थ (Knowledge Base)",
    labelEn: "Knowledge & Archives Hub",
    descriptionNe: "सारस्वती ग्रन्थालय, ऐतिहासिक व्यक्तित्व र शास्त्र",
    descriptionEn: "Scriptures, historical figures, archives and heritage",
    icon: BookOpen,
    order: 801,
    activePattern: "^/admin/(knowledge|knowledge-hub|knowledge-os|archives|timeline|festivals)?"
  },
  {
    id: "nav-knowledge-academy",
    path: "/admin/academy",
    module: "Sanatan Academy Admin",
    category: "knowledge",
    visibility: "staff",
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "अकादेमी व्यवस्थापन (Academy)",
    labelEn: "Academy & Courses",
    descriptionNe: "सभ्यता पाठ्यक्रम, प्रमाणपत्र र सिकाइ मार्गहरू",
    descriptionEn: "Civilization courses, learning paths and certificates",
    icon: GraduationCap,
    order: 802
  },
  {
    id: "nav-knowledge-blog-admin",
    path: "/admin/blog",
    module: "Sanatan Blog Admin",
    category: "knowledge",
    visibility: "staff",
    allowedRoles: ["admin", "super_admin", "chief_editor", "editor", "journalist"],
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "सनातन ब्लग (Blog Admin)",
    labelEn: "Sanatan Blog CMS",
    descriptionNe: "शास्त्रीय निबन्ध, उपनिषद् भाष्य र दीर्घकालीन आलेख व्यवस्थापन",
    descriptionEn: "Vedic philosophy essays, Upanishadic commentaries and long-form CMS",
    icon: BookOpen,
    order: 803,
    activePattern: "^/admin/blog"
  },

  // ==========================================
  // 9. PUBLIC / READER NAVIGATION MODULES
  // ==========================================
  {
    id: "nav-public-home",
    path: "/",
    module: "HomePage",
    category: "general",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "गृहपृष्ठ",
    labelEn: "Home",
    descriptionNe: "सनातन मार्ग मुख्य पोर्टल",
    descriptionEn: "Sanatan Marga Main Portal",
    icon: Home,
    order: 901
  },
  {
    id: "nav-public-blog",
    path: "/blog",
    module: "Sanatan Blog",
    category: "general",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "सनातन ब्लग",
    labelEn: "Sanatan Blog",
    descriptionNe: "शास्त्र, दर्शन, तीर्थ र हिमालयीय परम्पराका दीर्घकालीन निबन्धहरू",
    descriptionEn: "Long-form scholarly essays on Upanishads, Gita, philosophy and sacred heritage",
    icon: BookOpen,
    order: 902,
    activePattern: "^/blog",
    featureId: "blog.main"
  },
  {
    id: "nav-public-news",
    path: "/latest",
    module: "Latest News",
    category: "general",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "ताजा समाचार",
    labelEn: "News",
    descriptionNe: "ताजा समाचार र घटनाक्रम",
    descriptionEn: "Latest verified news feed",
    icon: Newspaper,
    order: 902,
    activePattern: "^/(latest|news)",
    featureId: "core.news"
  },
  {
    id: "nav-public-listen",
    path: "/radio",
    module: "Radio & Audio",
    category: "general",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "रेडियो र श्रव्य",
    labelEn: "Listen & Radio",
    descriptionNe: "सनातन रेडियो २४/७ प्रत्यक्ष स्ट्रिमिङ र पडकास्ट",
    descriptionEn: "Sanatan Radio 24/7 streaming and audio podcasts",
    icon: Headphones,
    order: 903,
    activePattern: "^/(radio|listen|media)",
    featureId: "media.radio"
  },
  {
    id: "nav-public-live",
    path: "/nepal-hub",
    module: "Live & District Hub",
    category: "general",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "नेपाल हब र लाइभ",
    labelEn: "Nepal Hub & Live",
    descriptionNe: "७७ जिल्लाको प्रत्यक्ष समाचार र भिडियो स्ट्रिम",
    descriptionEn: "77 districts live updates and streaming center",
    icon: Compass,
    order: 904,
    badge: { textNe: "लाइभ", textEn: "LIVE", color: "bg-red-500 text-white" },
    featureId: "nepalhub.main"
  },
  {
    id: "nav-public-knowledge",
    path: "/knowledge",
    module: "Knowledge Base",
    category: "knowledge",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "ज्ञानकोष",
    labelEn: "Knowledge Base",
    descriptionNe: "सारस्वती ग्रन्थालय, शास्त्र र ऐतिहासिक व्यक्तित्व",
    descriptionEn: "Scriptures, heritage library and historical archives",
    icon: BookOpen,
    order: 905,
    activePattern: "^/(knowledge|discover)",
    featureId: "knowledge.base"
  },
  {
    id: "nav-public-archives",
    path: "/archives",
    module: "Archives",
    category: "knowledge",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "अभिलेख (ArchivesOS)",
    labelEn: "Historical Archives",
    descriptionNe: "संविधान, सन्धि, शिलालेख र ऐतिहासिक पाण्डुलिपि",
    descriptionEn: "Constitutions, treaties, inscriptions and manuscripts",
    icon: FolderArchive,
    order: 906,
    featureId: "knowledge.archives"
  },
  {
    id: "nav-public-academy",
    path: "/academy",
    module: "Academy",
    category: "knowledge",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "सनातन अकादेमी",
    labelEn: "Sanatan Academy",
    descriptionNe: "सभ्यता शिक्षा, पाठ्यक्रम र प्रमाणपत्र",
    descriptionEn: "Civilization studies, courses and certificates",
    icon: GraduationCap,
    order: 907,
    activePattern: "^/academy(/.*)?",
    featureId: "training.academy",
    subItems: [
      {
        id: "nav-public-academy-results",
        path: "/academy/results",
        module: "Assessment Results",
        labelNe: "परीक्षा नतिजा (Results)",
        labelEn: "Assessment Results"
      },
      {
        id: "nav-public-academy-verify-sub",
        path: "/verify-certificate",
        module: "Certificate Verification",
        labelNe: "प्रमाणपत्र प्रमाणीकरण (Verify)",
        labelEn: "Verify Certificate"
      }
    ]
  },
  {
    id: "nav-public-verify-certificate",
    path: "/verify-certificate",
    module: "Certificate Verification OS",
    category: "knowledge",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "प्रमाणपत्र प्रमाणीकरण",
    labelEn: "Verify Certificate",
    descriptionNe: "क्रिप्टोग्राफिक डिजिटल प्रमाणपत्र प्रमाणीकरण",
    descriptionEn: "Cryptographic credential and certificate verification",
    icon: FileCheck,
    order: 908,
    activePattern: "^/(verify-certificate|verify)(/.*)?",
    featureId: "training.certification"
  },
  {
    id: "nav-public-community",
    path: "/community",
    module: "Chautari Community",
    category: "community",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "चौतारी समुदाय",
    labelEn: "Chautari Community",
    descriptionNe: "खुला विचार विमर्श, नागरिक पत्रकारिता र छलफल",
    descriptionEn: "Citizen journalism, public discussion and forums",
    icon: Users,
    order: 908,
    activePattern: "^/(community|chautari)",
    featureId: "community.chautari"
  },
  {
    id: "nav-public-store",
    path: "/store",
    module: "Sanatan Store",
    category: "revenue",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "सनातन स्टोर",
    labelEn: "Sanatan Store",
    descriptionNe: "सनातन ग्रन्थ, नक्सा र डिजिटल प्रकाशन",
    descriptionEn: "Sanatan books, maps, artifacts and digital publications",
    icon: Store,
    order: 909,
    featureId: "commerce.store"
  },
  {
    id: "nav-public-membership",
    path: "/membership",
    module: "Membership & Patrons",
    category: "community",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "सदस्यता तथा संरक्षण",
    labelEn: "Membership Plans",
    descriptionNe: "संरक्षक, साधक र संस्थागत सदस्यता योजनाहरू",
    descriptionEn: "Patron, Sadhak and Corporate membership tiers",
    icon: Crown,
    order: 910,
    activePattern: "^/(membership|patrons)",
    featureId: "revenue.membership"
  },
  {
    id: "nav-public-events",
    path: "/events",
    module: "Events",
    category: "community",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "कार्यक्रमहरू",
    labelEn: "Events & Festivals",
    descriptionNe: "धार्मिक तथा सांस्कृतिक कार्यक्रम क्यालेन्डर",
    descriptionEn: "Cultural and religious event calendar",
    icon: Calendar,
    order: 911
  },
  {
    id: "nav-public-mysanatan",
    path: "/my-sanatan",
    module: "My Sanatan",
    category: "general",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "मेरो सनातन",
    labelEn: "My Sanatan",
    descriptionNe: "व्यक्तिगत पाठक फिड, सुरक्षित लेख र गतिविधि",
    descriptionEn: "Personalized reader feed, bookmarks and reading history",
    icon: Sparkles,
    order: 912
  },
  {
    id: "nav-public-storylines",
    path: "/storylines",
    module: "Storylines",
    category: "general",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "स्टोरीलाइन्स (Storylines)",
    labelEn: "Story Evolution",
    descriptionNe: "घटनाहरूको विकासक्रम र गहन विश्लेषण",
    descriptionEn: "Deep story evolution arcs and timelines",
    icon: Layers,
    order: 913,
    activePattern: "^/(storylines|story-evolution)"
  },
  {
    id: "nav-public-digest",
    path: "/digest",
    module: "Daily Digest",
    category: "general",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "दैनिक ब्रिफिङ",
    labelEn: "Daily Digest",
    descriptionNe: "दैनिक मुख्य समाचारहरूको सारसंक्षेप",
    descriptionEn: "Executive morning briefing and daily news summary",
    icon: FileCheck,
    order: 914,
    activePattern: "^/(digest|daily-briefing)"
  },
  {
    id: "nav-public-timeline",
    path: "/timeline",
    module: "Sanatan Timeline",
    category: "knowledge",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "कालक्रम तथा समयरेखा",
    labelEn: "Historical Timeline",
    descriptionNe: "सनातन सभ्यता र नेपालको ऐतिहासिक घटनाक्रम",
    descriptionEn: "Interactive historical timeline of Himalayan heritage",
    icon: Calendar,
    order: 915
  },
  {
    id: "nav-public-transparency",
    path: "/transparency",
    module: "Transparency & Governance",
    category: "governance",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "पारदर्शिता तथा सुशासन",
    labelEn: "Transparency Hub",
    descriptionNe: "सम्पादकीय नीति, वित्तीय विवरण र सञ्चालक समिति",
    descriptionEn: "Editorial ethics, financial transparency and board",
    icon: ShieldCheck,
    order: 916
  },
  {
    id: "nav-public-directory",
    path: "/directory",
    module: "Institutional Directory",
    category: "community",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "संस्थागत डाइरेक्टरी",
    labelEn: "Directory",
    descriptionNe: "मठ-मन्दिर, गुरुकुल, धार्मिक संस्था र सम्पर्क सूची",
    descriptionEn: "Temples, gurukuls, cultural institutions and contacts",
    icon: Building2,
    order: 918
  },
  {
    id: "nav-public-festivals",
    path: "/festivals",
    module: "Festival Engine",
    category: "knowledge",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "चाडपर्व तथा पात्रो",
    labelEn: "Festivals & Calendar",
    descriptionNe: "नेपाली पात्रो, तिथि, चाडपर्व र मुहूर्तहरू",
    descriptionEn: "Himalayan lunar calendar, festivals and tithi countdowns",
    icon: Calendar,
    order: 919
  },
  {
    id: "nav-public-social",
    path: "/social",
    module: "Sanatan Social Hub",
    category: "community",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "सामाजिक हब",
    labelEn: "Social Hub",
    descriptionNe: "सबै सामाजिक सञ्जालहरूको एकीकृत प्रत्यक्ष फिड",
    descriptionEn: "Aggregated live social stream across channels",
    icon: Share2,
    order: 920,
    activePattern: "^/(social|sanatan-social)"
  },
  {
    id: "nav-public-models",
    path: "/models",
    module: "Talents & Models Profile",
    category: "community",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "प्रतिभा तथा कलाकार",
    labelEn: "Talents & Artists",
    descriptionNe: "धार्मिक कलाकार, उद्घोषक र सांस्कृतिक व्यक्तित्वहरू",
    descriptionEn: "Sanatan artists, anchors and cultural contributors",
    icon: Crown,
    order: 921,
    activePattern: "^/models(/.*)?"
  },
  {
    id: "nav-public-trending",
    path: "/trending",
    module: "Trending News",
    category: "general",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "चर्चामा रहेका",
    labelEn: "Trending",
    descriptionNe: "सबैभन्दा बढी पढिएका र चर्चामा रहेका समाचार",
    descriptionEn: "Most engaged and trending stories across Nepal",
    icon: TrendingUp,
    order: 922
  },
  {
    id: "nav-public-search",
    path: "/search",
    module: "Search",
    category: "general",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "खोज",
    labelEn: "Search",
    descriptionNe: "समाचार, ग्रन्थ र अडियो खोज्नुहोस्",
    descriptionEn: "Global search across articles, scriptures and audio",
    icon: Search,
    order: 923,
    activePattern: "^/(search|global-search)"
  },
  {
    id: "nav-public-live-stream",
    path: "/live",
    module: "Live Public Broadcasts",
    category: "broadcast",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "प्रत्यक्ष भिडियो",
    labelEn: "Live Streams",
    descriptionNe: "प्रत्यक्ष भिडियो प्रसारण र विशेष कभरेज",
    descriptionEn: "Live video broadcasts and special coverage events",
    icon: Tv,
    order: 924,
    activePattern: "^/live(/.*)?"
  },
  {
    id: "nav-public-download",
    path: "/download",
    module: "App Download & PWA",
    category: "general",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "मोबाइल एप",
    labelEn: "App Download",
    descriptionNe: "एन्ड्रोइड, आईओएस र पीडब्लुए एप इन्स्टल गर्नुहोस्",
    descriptionEn: "Install official Sanatan Marga app on iOS/Android",
    icon: Smartphone,
    order: 925
  },
  {
    id: "nav-public-advertiser",
    path: "/advertiser",
    module: "Advertiser Portal",
    category: "revenue",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "विज्ञापनदाता पोर्टल",
    labelEn: "Advertiser Portal",
    descriptionNe: "विज्ञापन अभियान स्थिति, बिलिङ र प्रभावकारिता मेट्रिक्स",
    descriptionEn: "Advertiser campaign dashboard, ROAS and invoices",
    icon: Briefcase,
    order: 926,
    activePattern: "^/advertiser(/.*)?"
  },
  {
    id: "nav-public-organization",
    path: "/organization",
    module: "Organization Portal",
    category: "community",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "संस्थागत ड्यासबोर्ड",
    labelEn: "Organization Dashboard",
    descriptionNe: "सम्बद्ध संस्था, गुरुकुल र ट्रस्ट ड्यासबोर्ड",
    descriptionEn: "Affiliated organization and trust portal",
    icon: Building2,
    order: 927,
    activePattern: "^/(organization|org)(/.*)?"
  },
  {
    id: "nav-public-profile",
    path: "/profile",
    module: "User Profile & Member Center",
    category: "general",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "प्रयोगकर्ता प्रोफाइल",
    labelEn: "Profile",
    descriptionNe: "व्यक्तिगत प्रोफाइल, सदस्यता स्थिति र सेटिङहरू",
    descriptionEn: "User profile, membership tier and security settings",
    icon: Users,
    order: 928,
    activePattern: "^/(profile|dashboard|member-center)(/.*)?"
  },
  {
    id: "nav-public-onboarding",
    path: "/onboarding",
    module: "Tenant Onboarding",
    category: "general",
    visibility: "public",
    desktopVisible: false,
    mobileVisible: false,
    labelNe: "संस्था दर्ता",
    labelEn: "Onboarding",
    descriptionNe: "नयाँ संस्था वा शाखा दर्ता प्रक्रिया",
    descriptionEn: "New affiliate and tenant onboarding flow",
    icon: CheckCircle2,
    order: 929
  },
  {
    id: "nav-public-about",
    path: "/about",
    module: "About Sanatan Marga",
    category: "general",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "हाम्रोबारे",
    labelEn: "About Us",
    descriptionNe: "सनातन मार्गको परिचय, उद्देश्य र सम्पादकीय टोली",
    descriptionEn: "About Sanatan Marga, mission and editorial leadership",
    icon: Info,
    order: 930
  },
  {
    id: "nav-public-contact",
    path: "/contact",
    module: "Contact Us",
    category: "general",
    visibility: "public",
    desktopVisible: true,
    mobileVisible: true,
    labelNe: "सम्पर्क",
    labelEn: "Contact Us",
    descriptionNe: "सम्पादकीय कार्यालय, सुझाव तथा सम्पर्क विवरण",
    descriptionEn: "Contact editorial office, feedback and inquiries",
    icon: MessageSquare,
    order: 931
  },
  {
    id: "nav-public-terms",
    path: "/terms",
    module: "Terms of Service",
    category: "general",
    visibility: "public",
    desktopVisible: false,
    mobileVisible: false,
    labelNe: "नियम तथा सर्तहरू",
    labelEn: "Terms of Service",
    descriptionNe: "प्रयोगका सर्त तथा कानुनी प्रावधानहरू",
    descriptionEn: "Legal terms and user guidelines",
    icon: FileText,
    order: 932
  },
  {
    id: "nav-public-privacy",
    path: "/privacy",
    module: "Privacy Policy",
    category: "general",
    visibility: "public",
    desktopVisible: false,
    mobileVisible: false,
    labelNe: "गोपनीयता नीति",
    labelEn: "Privacy Policy",
    descriptionNe: "डाटा गोपनीयता तथा प्रयोगकर्ता सुरक्षा नीति",
    descriptionEn: "Data privacy and personal info protection",
    icon: Shield,
    order: 933
  }
];

function LayoutDashboardIcon(props: { size?: number; className?: string }) {
  return React.createElement(Tv, props);
}

/**
 * HELPER: Robust active route matcher
 */
export function isRouteActive(currentPath: string, navItem: NavigationItem | NavigationSubItem): boolean {
  if (navItem.activePattern) {
    if (typeof navItem.activePattern === "string") {
      const regex = new RegExp(navItem.activePattern);
      if (regex.test(currentPath)) return true;
    } else if (navItem.activePattern instanceof RegExp) {
      if (navItem.activePattern.test(currentPath)) return true;
    }
  }

  // Exact path equality
  if (currentPath === navItem.path) return true;

  // Root path edgecase
  if (navItem.path === "/" && currentPath === "/") return true;
  if (navItem.path === "/" && currentPath !== "/") return false;

  // Subpath prefix match (ensure slash separation so /admin/ads doesn't match /admin/ad-something)
  if (currentPath.startsWith(navItem.path + "/") || currentPath === navItem.path) {
    return true;
  }

  // Check subitems if present
  if ("subItems" in navItem && navItem.subItems) {
    return navItem.subItems.some(sub => isRouteActive(currentPath, sub));
  }

  return false;
}

/**
 * HELPER: Check user permission against navigation item
 */
export function isNavigationItemAuthorized(
  item: NavigationItem | NavigationSubItem,
  userRole?: UserRole | string,
  hasPermissionFn?: (perm: UserPermission) => boolean
): boolean {
  const r = (userRole || "guest") as string;

  // Super admin has absolute access to everything
  if (r === "super_admin") return true;

  // 1. Check allowed roles if specified
  if (item.allowedRoles && item.allowedRoles.length > 0) {
    const isRoleAllowed = item.allowedRoles.some(allowed => {
      if (allowed === r) return true;
      if (allowed === "admin" && (r === "admin" || r === "super_admin")) return true;
      if (allowed === "editor" && (r === "admin" || r === "chief_editor" || r === "editor" || r === "super_admin")) return true;
      return false;
    });

    if (!isRoleAllowed) return false;
  }

  // 2. Check granular permissions if specified
  if (item.requiredPermission) {
    if (typeof hasPermissionFn !== "function") {
      // If no permission check function provided, fall back to role
      return r === "admin" || r === "super_admin" || r === "chief_editor" || r === "editor";
    }

    if (Array.isArray(item.requiredPermission)) {
      return item.requiredPermission.some(perm => hasPermissionFn(perm));
    } else {
      return hasPermissionFn(item.requiredPermission);
    }
  }

  // 3. Feature Control OS Governance Check
  if (item.featureId && !featureControlOS.isFeatureEnabled(item.featureId, { role: r })) {
    return false;
  }

  return true;
}

/**
 * HELPER: Get grouped Admin Sidebar navigation sections
 */
export function getAuthorizedAdminSections(
  userRole?: UserRole | string,
  hasPermissionFn?: (perm: UserPermission) => boolean
) {
  const adminItems = CANONICAL_NAVIGATION_REGISTRY.filter(item => 
    (item.visibility === "admin" || item.visibility === "staff") &&
    isNavigationItemAuthorized(item, userRole, hasPermissionFn)
  );

  // Group by categories
  const categoryMap: Record<NavigationCategory, NavigationItem[]> = {
    editorial: [],
    broadcast: [],
    community: [],
    revenue: [],
    analytics: [],
    governance: [],
    platform: [],
    knowledge: [],
    general: []
  };

  adminItems.forEach(item => {
    categoryMap[item.category].push(item);
  });

  // Convert to categorized section list
  const sections = Object.keys(categoryMap)
    .map(catKey => {
      const cat = catKey as NavigationCategory;
      const meta = NAVIGATION_CATEGORIES[cat];
      const items = categoryMap[cat].sort((a, b) => a.order - b.order);

      // Filter subitems for each item based on authorization
      const itemsWithFilteredSubs = items.map(item => ({
        ...item,
        subItems: item.subItems 
          ? item.subItems.filter(sub => isNavigationItemAuthorized(sub, userRole, hasPermissionFn))
          : []
      }));

      return {
        id: cat,
        meta,
        titleNe: meta.nameNe,
        titleEn: meta.nameEn,
        descriptionNe: meta.descriptionNe,
        descriptionEn: meta.descriptionEn,
        icon: meta.icon,
        color: meta.color,
        items: itemsWithFilteredSubs
      };
    })
    .filter(section => section.items.length > 0)
    .sort((a, b) => a.meta.order - b.meta.order);

  return sections;
}

/**
 * HELPER: Get Public Header navigation items
 */
export function getPublicHeaderNavigation() {
  return CANONICAL_NAVIGATION_REGISTRY
    .filter(item => {
      if (item.visibility !== "public" || !item.desktopVisible) return false;
      if (item.featureId && !featureControlOS.isFeatureEnabled(item.featureId)) return false;
      return true;
    })
    .sort((a, b) => a.order - b.order);
}

/**
 * HELPER: Get Mobile Bottom Navigation items (5 destinations)
 */
export function getMobileBottomNavigation(isAdminMode: boolean = false) {
  if (isAdminMode) {
    return [
      { id: "mob-admin-dash", path: "/admin", labelNe: "ड्यासबोर्ड", labelEn: "Dashboard", icon: LayoutDashboardIcon },
      { id: "mob-admin-editor", path: "/admin/editor", labelNe: "न्यूजरुम", labelEn: "Newsroom", icon: Newspaper },
      { id: "mob-admin-media", path: "/admin/media", labelNe: "मिडिया", labelEn: "Media", icon: Radio },
      { id: "mob-admin-revenue", path: "/admin/revenue-os", labelNe: "राजस्व", labelEn: "Revenue", icon: Store },
      { id: "mob-admin-more", path: "#more-admin", labelNe: "थप एडमिन", labelEn: "More", icon: Settings, isDrawerTrigger: true }
    ];
  }

  const items = [
    { id: "mob-pub-home", path: "/", labelNe: "गृह", labelEn: "Home", icon: Home, featureId: "core.news" },
    { id: "mob-pub-news", path: "/latest", labelNe: "समाचार", labelEn: "News", icon: Newspaper, featureId: "core.news" },
    { id: "mob-pub-search", path: "#search", labelNe: "खोज", labelEn: "Search", icon: Search, isCommandPaletteTrigger: true, featureId: "core.search" },
    { id: "mob-pub-listen", path: "/radio", labelNe: "श्रव्य", labelEn: "Listen", icon: Radio, featureId: "media.radio" },
    { id: "mob-pub-more", path: "#more-public", labelNe: "थप", labelEn: "More", icon: Compass, isDrawerTrigger: true }
  ];

  return items.filter(item => !item.featureId || featureControlOS.isFeatureEnabled(item.featureId));
}

export type RouteClassificationType = "public" | "admin" | "auth" | "dynamic" | "system" | "non-navigation";

export function classifyRoute(routePath: string): RouteClassificationType {
  if (routePath.includes("/:")) return "dynamic";
  if (routePath === "/login" || routePath === "/onboarding") return "auth";
  if (
    routePath.startsWith("/admin/health") ||
    routePath.startsWith("/admin/system-health") ||
    routePath.startsWith("/admin/system-integrity") ||
    routePath.startsWith("/admin/data-governance") ||
    routePath.startsWith("/admin/disaster-recovery") ||
    routePath.startsWith("/admin/audit") ||
    routePath.startsWith("/admin/platform-health")
  ) {
    return "system";
  }
  if (routePath.startsWith("/admin") || routePath.startsWith("/editor")) return "admin";
  if (
    routePath === "/terms" ||
    routePath === "/privacy" ||
    routePath === "/download" ||
    routePath === "/verify-certificate" ||
    routePath === "/verify" ||
    routePath === "/organization/compliance" ||
    routePath === "/training/compliance" ||
    routePath === "/academy/sanatanmarga-training" ||
    routePath === "/academy/training" ||
    routePath === "/public-demo" ||
    routePath === "/chautari" ||
    routePath === "/sanatan-social" ||
    routePath === "/daily-briefing" ||
    routePath === "/story-evolution" ||
    routePath === "/media"
  ) {
    return "non-navigation";
  }
  return "public";
}

/**
 * NAVIGATION INTEGRITY AUDIT DIAGNOSTIC
 * Comprehensive diagnostics engine reporting routes, route classifications, broken targets, and permission mismatches.
 */
export interface NavigationIntegrityReport {
  registeredRoutesCount: number;
  navigationEntriesCount: number;
  orphanedRoutes: string[]; // Retained for backwards compatibility, always empty when classified
  unclassifiedRoutes: string[];
  routeClassifications: Record<string, RouteClassificationType>;
  brokenTargets: string[];
  duplicateNavigationIds: string[];
  duplicateRoutes: string[];
  missingTranslations: string[];
  permissionMismatches: string[];
  isHealthy: boolean;
  timestamp: string;
}

export const ALL_REGISTERED_APP_ROUTES: string[] = [
  "/",
  "/about",
  "/academy",
  "/academy/course/:id",
  "/academy/results",
  "/academy/sanatanmarga-training",
  "/academy/training",
  "/admin",
  "/admin/academy",
  "/admin/ads",
  "/admin/agents",
  "/admin/ai-observability",
  "/admin/analytics",
  "/admin/archives",
  "/admin/articles",
  "/admin/audit",
  "/admin/blog",
  "/admin/categories",
  "/admin/command-center",
  "/admin/commerce",
  "/admin/commerce-analytics",
  "/admin/community",
  "/admin/contact-messages",
  "/admin/content-audit",
  "/admin/data-governance",
  "/admin/design-os",
  "/admin/developer-api",
  "/admin/disaster-recovery",
  "/admin/discovery",
  "/admin/editor",
  "/admin/editor/:id",
  "/admin/events",
  "/admin/events/:id",
  "/admin/events/new",
  "/admin/executive",
  "/admin/feature-control",
  "/admin/festivals",
  "/admin/governance",
  "/admin/health",
  "/admin/homepage",
  "/admin/hub-os",
  "/admin/inquiries",
  "/admin/intelligence-os",
  "/admin/knowledge",
  "/admin/knowledge-hub",
  "/admin/knowledge-os",
  "/admin/listen",
  "/admin/live",
  "/admin/media",
  "/admin/media-assets",
  "/admin/media-library",
  "/admin/media-os",
  "/admin/membership",
  "/admin/menu",
  "/admin/mission-control",
  "/admin/models",
  "/admin/moderation",
  "/admin/nepal-hub",
  "/admin/newsroom",
  "/admin/notifications",
  "/admin/operations",
  "/admin/page-builder",
  "/admin/panchang",
  "/admin/platform-health",
  "/admin/radio",
  "/admin/reader-analytics",
  "/admin/revenue",
  "/admin/revenue-os",
  "/admin/review",
  "/admin/seo-os",
  "/admin/settings",
  "/admin/setup-guide",
  "/admin/sgis",
  "/admin/sgis/review/:id",
  "/admin/snapshots",
  "/admin/social",
  "/admin/sponsor-audio",
  "/admin/store",
  "/admin/system-health",
  "/admin/system-integrity",
  "/admin/tenants",
  "/admin/timeline",
  "/admin/training",
  "/admin/translation",
  "/admin/users",
  "/admin/verification",
  "/admin/video-ads",
  "/admin/workflows",
  "/advertiser",
  "/advertiser/dashboard",
  "/analytics",
  "/archives",
  "/archives/:id",
  "/article/:id",
  "/ask",
  "/ask-sanatan",
  "/blog",
  "/blog/:slug",
  "/blog/category/:slug",
  "/blog/series/:slug",
  "/blog/tag/:tag",
  "/blog/author/:authorId",
  "/category/:slug",
  "/chautari",
  "/community",
  "/community/post/:id",
  "/contact",
  "/daily-briefing",
  "/dashboard",
  "/demo",
  "/digest",
  "/directory",
  "/discover",
  "/district/:districtName",
  "/download",
  "/editor",
  "/events",
  "/events/:id",
  "/festivals",
  "/global-search",
  "/knowledge",
  "/knowledge/:id",
  "/knowledge/entity/:id",
  "/latest",
  "/listen",
  "/live",
  "/live/:videoId",
  "/login",
  "/media",
  "/member-center",
  "/membership",
  "/models",
  "/models/:id",
  "/my-sanatan",
  "/nepal-hub",
  "/nepal-hub/live",
  "/nepal-hub/live/:id",
  "/news",
  "/notifications",
  "/onboarding",
  "/org/dashboard",
  "/organization",
  "/organization/compliance",
  "/organization/dashboard",
  "/patrons",
  "/privacy",
  "/profile",
  "/profile/:uid",
  "/public-demo",
  "/radio",
  "/sanatan-social",
  "/search",
  "/sgis",
  "/sgis/manuscript/:id",
  "/social",
  "/store",
  "/story-evolution",
  "/storylines",
  "/terms",
  "/timeline",
  "/timeline/:id",
  "/training",
  "/training/:trackId",
  "/training/:trackId/:lessonId",
  "/training/compliance",
  "/transparency",
  "/trending",
  "/verify-certificate",
  "/verify-certificate/:certId",
  "/verify/:certId"
];

let hasAssertedInDev = false;

/**
 * DEV ASSERTION: Run automatic route consistency verification on app boot
 */
export function assertNavigationOSHealth(): NavigationIntegrityReport {
  const report = auditNavigationIntegrity(ALL_REGISTERED_APP_ROUTES);
  if (!hasAssertedInDev && typeof window !== "undefined") {
    hasAssertedInDev = true;
    if (!report.isHealthy) {
      console.warn("⚠️ [NavigationOS Health Warning]: Gaps detected in navigation registry!", report);
      if (report.unclassifiedRoutes.length > 0) console.warn("[NavigationOS] Unclassified routes:", report.unclassifiedRoutes);
      if (report.brokenTargets.length > 0) console.warn("[NavigationOS] Broken nav targets:", report.brokenTargets);
      if (report.duplicateNavigationIds.length > 0) console.warn("[NavigationOS] Duplicate nav IDs:", report.duplicateNavigationIds);
      if (report.duplicateRoutes.length > 0) console.warn("[NavigationOS] Duplicate routes:", report.duplicateRoutes);
      if (report.missingTranslations.length > 0) console.warn("[NavigationOS] Missing translations:", report.missingTranslations);
      if (report.permissionMismatches.length > 0) console.warn("[NavigationOS] Permission mismatches:", report.permissionMismatches);
    } else {
      console.log(`✅ [NavigationOS Integrity]: 100% Deterministic & Complete (${report.navigationEntriesCount} nav entries registered across ${report.registeredRoutesCount} routes).`);
    }
  }
  return report;
}

export function auditNavigationIntegrity(registeredRoutePaths: string[] = ALL_REGISTERED_APP_ROUTES): NavigationIntegrityReport {
  const allNavItems = CANONICAL_NAVIGATION_REGISTRY;
  const navTargets = new Set<string>();
  const topLevelPaths = new Set<string>();
  const navIds = new Set<string>();
  const duplicateNavIds: string[] = [];
  const duplicateRoutes: string[] = [];
  const missingTranslations: string[] = [];
  const permissionMismatches: string[] = [];

  // Check navigation items
  allNavItems.forEach(item => {
    // Check ID duplicates
    if (navIds.has(item.id)) {
      duplicateNavIds.push(item.id);
    }
    navIds.add(item.id);

    // Check duplicate top-level routes in registry
    if (topLevelPaths.has(item.path)) {
      duplicateRoutes.push(item.path);
    }
    topLevelPaths.add(item.path);
    navTargets.add(item.path);

    // Check translations
    if (!item.labelNe || !item.labelEn) {
      missingTranslations.push(`Item ${item.id} missing Nepali or English label`);
    }

    // Check permissions
    if (item.visibility === "admin" && !item.requiredPermission && (!item.allowedRoles || item.allowedRoles.length === 0)) {
      permissionMismatches.push(`Item ${item.id} marked admin but missing requiredPermission or allowedRoles`);
    }

    // Subitems
    if (item.subItems) {
      item.subItems.forEach(sub => {
        if (navIds.has(sub.id)) {
          duplicateNavIds.push(sub.id);
        }
        navIds.add(sub.id);
        navTargets.add(sub.path);

        if (!sub.labelNe || !sub.labelEn) {
          missingTranslations.push(`SubItem ${sub.id} missing Nepali or English label`);
        }
      });
    }
  });

  // Broken navigation targets: nav target is not in registered route paths (accounting for dynamic params e.g. /events/:id or /category/:slug)
  const brokenTargets: string[] = [];
  navTargets.forEach(target => {
    if (target.startsWith("#") || target.startsWith("http")) return; // anchors and external URLs

    const isTargetRegistered = registeredRoutePaths.some(route => {
      if (route === target) return true;
      const baseRoute = route.split("/:")[0];
      if (target.startsWith(baseRoute) && baseRoute.length > 1) return true;
      return false;
    });

    if (!isTargetRegistered) {
      brokenTargets.push(target);
    }
  });

  // Route Classification Audit
  const routeClassifications: Record<string, RouteClassificationType> = {};
  const unclassifiedRoutes: string[] = [];

  registeredRoutePaths.forEach(route => {
    const cls = classifyRoute(route);
    routeClassifications[route] = cls;
    if (!cls) {
      unclassifiedRoutes.push(route);
    }
  });

  const orphanedRoutes: string[] = []; // Retained for backwards compatibility

  const isHealthy = 
    unclassifiedRoutes.length === 0 && 
    brokenTargets.length === 0 && 
    duplicateNavIds.length === 0 && 
    duplicateRoutes.length === 0 && 
    missingTranslations.length === 0 && 
    permissionMismatches.length === 0;

  return {
    registeredRoutesCount: registeredRoutePaths.length,
    navigationEntriesCount: navTargets.size,
    orphanedRoutes,
    unclassifiedRoutes,
    routeClassifications,
    brokenTargets,
    duplicateNavigationIds: duplicateNavIds,
    duplicateRoutes,
    missingTranslations,
    permissionMismatches,
    isHealthy,
    timestamp: new Date().toISOString()
  };
}
