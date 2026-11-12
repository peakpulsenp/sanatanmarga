export type UserRole = 
  | "super_admin" 
  | "admin" 
  | "chief_editor" 
  | "senior_editor"
  | "editor" 
  | "reporter"
  | "contributor"
  | "journalist" 
  | "moderator" 
  | "revenue_manager"
  | "fact_checker" 
  | "photographer" 
  | "video_editor" 
  | "advertiser" 
  | "subscriber" 
  | "member"
  | "public"
  | "guest"
  | "user"
  | string;

export interface TimelineStep {
  time: string;
  title: string;
  description: string;
}

export interface EventItem {
  id: string;
  title: string;
  tagline?: string;
  date: string;
  location: string;
  district?: string;
  province?: string;
  featuredImage: string;
  status: "draft" | "published";
  isFeatured?: boolean;
  timeline?: TimelineStep[];
  
  // Nepal Hub Integration
  nepalHubCategory?: "festivals" | "disaster" | "elections" | "national";
  isLiveOnNepalHub?: boolean;
  nepalHubLiveUpdateId?: string;
  
  // Saraswati Knowledge Graph Integration
  knowledgeEntities?: string[];
  knowledgeTags?: string[];
  
  createdAt?: any;
  updatedAt?: any;
}

export interface TemporalRole {
  id: string;
  titleEn: string;
  titleNp: string;
  officeCategory: 
    | "Political Leadership"
    | "Government Officials"
    | "Mayors"
    | "Ministers"
    | "Chief Ministers"
    | "Institution Heads"
    | "Royal/Religious Offices"
    | "International Leaders"
    | "Sports Leadership"
    | "Organizational Leadership";
  institutionEn?: string;
  institutionNp?: string;
  startDate: string; // ISO date e.g. "2026-03-27"
  endDate?: string | null; // null if currently active
  status: "current" | "former" | "contested" | "interim";
  primaryAuthority: string; // e.g. "Government of Nepal / Official Gazette"
  verificationSource?: string;
  lastVerifiedDate: string; // e.g. "2026-08-24"
  confidenceScore?: number;
}

export interface TemporalEntityRecord {
  id: string; // e.g. "person:balen_shah"
  entityType: "person" | "institution" | "office" | "event";
  canonicalNameEn: string;
  canonicalNameNp: string;
  aliases: string[];
  currentStatus: "ACTIVE" | "INACTIVE" | "UNVERIFIED" | "CONTESTED";
  roles: TemporalRole[];
  primaryAuthority: string;
  lastVerified: string;
  verificationStatus: "VERIFIED" | "UNVERIFIED" | "CONTESTED";
}

export * from "./knowledge";
import { KnowledgeEntity } from "./knowledge";
export type KnowledgeNode = KnowledgeEntity;


export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  customPermissions?: string[];
  membershipTier?: "free" | "patron" | "sadhak" | "sanrakshak" | "corporate";
  reputationScore?: number;
  reputationLevel?: "explorer" | "contributor" | "reporter" | "scholar" | "guardian" | "acharya";
  district?: string;
  status?: "active" | "suspended" | "banned";
  photoURL?: string;
  bio?: string;
  location?: string;
  website?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  roleRequest?: {
    requestedRole: UserRole;
    status: "pending" | "approved" | "rejected";
    requestedAt: string;
    message?: string;
  };
  preferredLanguage?: string;
  createdAt: any;
}

export interface Category {
  id: string;
  nameNepali: string;
  nameEnglish: string;
  slug: string;
  order: number;
  homepageStyle?: "grid" | "featured_list" | "cards" | "alternating" | "magazine" | "masonry" | "overlay";
  postCount?: number;
  isHidden?: boolean;
}

export type ArticleStatus = 
  | "draft" 
  | "assigned" 
  | "under_review" 
  | "fact_checked"
  | "fact_check" 
  | "approved" 
  | "scheduled" 
  | "published" 
  | "archived";

export interface Article {
  id: string;
  slug?: string;
  title: string;
  content: string;
  excerpt: string;
  categoryId: string;
  categorySlug?: string;
  category?: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  authorAvatar?: string;
  authorRole?: string;
  generatedByUserId?: string;
  generatedByUserName?: string;
  sourcePublishers?: string[];
  status: ArticleStatus;
  verificationStatus?: "verified" | "pending" | "rejected" | "unverified";
  verificationEvidence?: string[];
  verifiedBy?: string;
  sourceName?: string;
  sourceUrl?: string;
  featuredImage: string;
  videoUrl?: string;
  views: number;
  commentCount?: number;
  isBreaking?: boolean;
  storyType?: 'breaking' | 'trending' | 'ordinary' | string;
  discoveryStats?: {
    candidates: number;
    freshnessPassed: number;
    verificationPassed: number;
    clusters: number;
    breakingStories?: number;
    trendingStories?: number;
    ordinaryStories?: number;
  };
  provenanceData?: any;
  isFeatured?: boolean;
  isSponsored?: boolean;
  sponsorName?: string;
  sponsorLogo?: string;
  sponsorUrl?: string;
  sponsorId?: string;
  disclosureStatement?: string;
  promotionType?: "sponsored_article" | "brand_story" | "product_review" | "press_release";
  districts?: string[];
  sourceUrls?: string[];
  socialHook?: string;
  seoHeadline?: string;
  seoDescription?: string;
  editorialHeadline?: string;
  socialHeadline?: string;
  qualityScore?: number;
  factDensity?: number;
  sourceCoverage?: number;
  fillerScore?: number;
  // Bilingual Translation Fields (Dual-Language Architecture)
  title_en?: string;
  excerpt_en?: string;
  content_en?: string;
  titleEn?: string;
  excerptEn?: string;
  contentEn?: string;
  seoHeadline_en?: string;
  seoDescription_en?: string;
  socialHook_en?: string;
  // Soft Delete & Governance Metadata
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deleteRetentionExpiresAt?: string;
  categoryName?: string;
  needsEditorialReview?: boolean;
  trustScore?: number;
  isBackup?: boolean;
  source?: string;
  sources?: (string | { name?: string; title?: string; url?: string })[];
  province?: string;
  municipalities?: string[];
  structuralScore?: number;
  similarityScore?: number;
  editorialStatus?: string;
  provenance?: {
    verified: boolean;
    verifiedAt?: string;
    verifiedBy?: string;
  };
  editorialConfidence?: number;
  sourceStrength?: 'high' | 'medium' | 'low';
  qaAudit?: {
    wordCount: number;
    structuralScore: number;
    trustScore: number;
    similarityScore: number;
    confidence: number;
    sourceStrength: string;
    passed: boolean;
    warnings: string[];
  };
  publishAt?: string; // ISO String for scheduled publishing
  publishedAt?: string; // ISO String or Timestamp for published date
  sourcePublishedAt?: string; // Authoritative source publication timestamp
  originalPublishedAt?: string; // Original source publication timestamp
  canonicalPublishedAt?: string; // Immutable source of truth for freshness decisions
  modifiedAt?: string; // Source modification date
  fetchedAt?: string; // Timestamp when source was crawled/fetched
  ingestedAt?: string; // Timestamp when record entered system
  lastVerifiedAt?: string; // Timestamp when verified by fact-check/gate
  generatedAt?: string; // Timestamp when AI text generation completed
  editHistory?: {
    updatedAt: any;
    updatedBy: string;
    updatedByName: string;
  }[];
  // Newsroom OS v3 properties
  mappedClaims?: {
    claim: string;
    source: string;
    verified: boolean;
  }[];
  verificationTime?: string;
  discoveryEngineConfidence?: number;
  hallucinationScore?: number;
  hallucinationFlaggedClaims?: {
    type: string;
    severity: string;
    text: string;
    description: string;
  }[];
  storyTimeline?: {
    status: string;
    date: string;
    title: string;
  }[];
  originalityScore?: number;
  originalityRecommendation?: 'accept' | 'flag_for_review' | 'reject';
  originalityJustification?: string;
  overlappingPhrases?: string[];
  sourceAuthorityScore?: number;
  articleTrustScore?: number;
  storyUpdates?: {
    id?: string;
    timestamp: string;
    timeLabel?: string;
    title: string;
    content?: string;
    sourceLabel?: string;
    sourceUrl?: string;
    verified?: boolean;
    importance?: "high" | "medium" | "low";
  }[];
  articleVersionHistory?: {
    version: number;
    timestamp: string;
    updatedBy: string;
    updatedByName?: string;
    changeSummary: string;
    diffSnippet?: string;
  }[];
  districtImpact?: {
    district: string;
    severity: "critical" | "moderate" | "advisory" | "normal";
    detail?: string;
  }[];
  relatedEventId?: string;
  relatedEventTitle?: string;
  isLiveSituation?: boolean;
  liveDispatchId?: string;
  createdAt: any;
  updatedAt: any;
}

export type NotificationTargetType = 
  | "article" 
  | "event" 
  | "live_dispatch" 
  | "knowledge_entity" 
  | "sgis_manuscript" 
  | "chautari_post" 
  | "community_post"
  | "comment"
  | "course"
  | "scholar_review"
  | "external";

export interface Notification {
  id: string;
  userId?: string; // Recipient UID
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "workflow" | "editorial" | "system" | "community" | "business";
  isRead: boolean;
  createdAt: any;
  entityType?: string;
  entityId?: string;
  targetRoute?: string;
  targetType?: NotificationTargetType;
  targetId?: string;
  targetSlug?: string;
  articleId?: string;
  assignmentId?: string;
  campaignId?: string;
  link?: string;
  linkUrl?: string;
  url?: string;
  postId?: string;
  courseId?: string;
  eventId?: string;
  liveDispatchId?: string;
  manuscriptId?: string;
  extra?: Record<string, any>;
}

export interface NotificationTemplate {
  id: string;
  code: string; // e.g. ASSIGNMENT_CREATED
  title: string; // Template title with placeholders
  body: string;  // Template body with placeholders
  category: "workflow" | "editorial" | "system" | "community" | "business";
  isActive: boolean;
  updatedAt: any;
}

export interface NotificationCampaign {
  id: string;
  name: string; // Campaign Name e.g. "Breaking News Alert"
  title: string; // Broadcast title
  body: string; // Broadcast body
  audience: "all_users" | "editorial_staff" | "subscribers" | "admins";
  status: "draft" | "scheduled" | "sent" | "failed";
  scheduledAt?: string; // ISO Date String
  sentAt?: string; // ISO Date String
  metrics?: {
    targetedCount: number;
    deliveredCount: number;
    clickedCount: number;
  };
  createdAt: any;
}

export type AdPosition = 
  | "hero_slider"
  | "homepage_top"
  | "homepage_mid"
  | "homepage_bottom"
  | "sidebar"
  | "header"
  | "article_inline"
  | "article_top"
  | "article_bottom"
  | "blog_header"
  | "blog_sidebar"
  | "blog_inline"
  | "blog_bottom"
  | "category_top"
  | "category_bottom"
  | "left_skin"
  | "right_skin"
  | "mobile_sticky"
  | "popup_takeover"
  | "sponsored_story"
  | "homepage_hero_sponsor"
  | "homepage_premium_banner"
  | "homepage_native_story"
  | "homepage_video_sponsor"
  | "category_sponsor"
  | "category_native_story"
  | "category_newsletter_sponsor"
  | "district_sponsor"
  | "district_hero_sponsor"
  | "article_sponsor"
  | "article_infeed_sponsor"
  | "article_audio_sponsor"
  | "listenos_sponsor"
  | "listenos_preroll"
  | "listenos_queue_sponsor";

export type AdStatus = 
  | "draft" 
  | "pending_review" 
  | "needs_changes" 
  | "approved" 
  | "scheduled" 
  | "active" 
  | "completed" 
  | "archived" 
  | "paused" 
  | "expired" 
  | "rejected";

export interface SponsoredStoryGovernance {
  isSponsored: boolean;
  advertiserName: string;
  advertiserLogo?: string;
  sponsorUrl?: string;
  sponsorId?: string;
  publishedDate: string;
  lastUpdated?: string;
  disclosureStatement: string;
  disclosureType: "sponsored_article" | "brand_story" | "product_review" | "press_release";
  editorialDisclaimer: string;
  verifiedByEditorial: boolean;
}

export interface CampaignCheckItem {
  key: string;
  label: string;
  passed: boolean;
  message: string;
}

export interface AdBudget {
  totalBudget?: number; // Total campaign budget in NPR
  dailyBudget?: number; // Daily spend limit
  pricingModel?: "cpm" | "cpc" | "flat_rate";
  cpmRate?: number; // Cost per 1000 impressions
  cpcRate?: number; // Cost per click
  spent?: number; // Total amount spent so far
}

export interface Ad {
  id?: string;
  title: string;
  advertiserId?: string;
  advertiserName?: string;
  advertiserContact?: string;
  imageUrl: string;
  linkUrl: string;
  position: AdPosition;
  
  // Campaign Scheduling
  startDate?: string; // ISO String (e.g. 2026-08-01T00:00:00Z)
  endDate?: string;   // ISO String (e.g. 2026-08-31T23:59:59Z)
  
  // Rotation & Priority
  priority?: number;  // 1 to 10 (Higher = more weight in rotation)
  weight?: number;    // Weight multiplier (defaults to priority or 1)
  
  // Performance Metrics
  impressions?: number;
  clicks?: number;
  ctr?: number; // Click-through-rate percentage e.g. 2.45%
  
  // Targeted Inventory
  targetCountries?: string[];
  targetDistricts?: string[];
  targetProvinces?: string[];
  targetMunicipalities?: string[];
  targetCategories?: string[];
  targetDevices?: ("desktop" | "mobile" | "tablet")[];
  targetLanguages?: ("ne" | "en")[];
  
  frequencyCap?: number; // Max impressions per user per session
  
  // Lifecycle Status & Review Pipeline
  status?: AdStatus;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  isActive: boolean;
  isSponsored?: boolean;
  isHouseAd?: boolean;
  sponsorship?: {
    disclosureText?: { ne?: string; en?: string };
    sponsorStatementAudioUrl?: string;
  };
  
  budget?: AdBudget;
  notes?: string;
  
  createdAt: any;
  updatedAt: any;
}

export interface AdDeliveryEvent {
  id: string; // Deterministic eventKey: e.g. campaignId:pageViewId:placement:eventType
  campaignId: string;
  advertiserId?: string;
  eventType: "impression" | "click";
  placement: AdPosition;
  route?: string;
  deviceClass?: "desktop" | "mobile" | "tablet";
  sessionId?: string;
  pageViewId?: string;
  timestamp: string;
  membershipTier?: string;
  targetingContext?: {
    category?: string;
    district?: string;
    province?: string;
  };
  source: "web" | "pwa";
  verified: boolean;
}

export interface AdvertiserProfile {
  id: string;
  legalName: string;
  displayName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
  pan: string; // 9-digit PAN Number
  vatNumber?: string;
  billingAddress?: string;
  paymentTerms?: "immediate" | "net15" | "net30" | "net60";
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  updatedAt?: string;
}

export interface TaxInvoice {
  id: string;
  invoiceNumber: string; // e.g. SM-INV-2083-0149
  campaignId: string;
  campaignTitle: string;
  advertiserId: string;
  advertiserName: string;
  advertiserPan: string;
  advertiserAddress?: string;
  taxableAmountNpr: number;
  vatRatePct: number; // 13%
  vatAmountNpr: number;
  tdsRatePct: number; // 1.5%
  tdsAmountNpr: number;
  totalPayableNpr: number; // Taxable + VAT
  netReceivableNpr: number; // Total Payable - TDS Withholding
  status: "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "VOID";
  dueDate: string;
  issuedAt: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentReceipt {
  id: string;
  paymentId: string; // e.g. PAY-2083-001
  invoiceId: string;
  invoiceNumber: string;
  advertiserId: string;
  advertiserName: string;
  advertiserPan: string;
  amountNpr: number;
  cashAmountNpr: number;
  tdsAmountNpr: number;
  currency: "NPR";
  paymentMethod: "bank_transfer" | "esewa" | "khalti" | "fonepay" | "cash";
  transactionReference: string;
  paidAt: string;
  verifiedBy: string;
  verifiedAt: string;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "REFUNDED";
  createdAt: string;
}

export interface CampaignFinancials {
  campaignId: string;
  contractedRevenue: number;
  deliveredRevenue: number;
  invoicedRevenue: number;
  collectedRevenue: number;
  outstandingRevenue: number; // Math.max(invoicedRevenue - collectedRevenue, 0)
  remainingBudget: number;   // Math.max(contractedRevenue - deliveredRevenue, 0)
}

export interface AdAnalyticsEvent {
  adId: string;
  type: "impression" | "click";
  timestamp: string;
  position?: string;
  category?: string;
  district?: string;
  device?: string;
  referrer?: string;
}

export interface AdStatsSummary {
  totalCampaigns: number;
  activeCampaigns: number;
  scheduledCampaigns: number;
  pausedCampaigns: number;
  expiredCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  averageCtr: number;
  contractedRevenue: number;
  deliveredRevenue: number;
  invoicedRevenue: number;
  collectedRevenue: number;
  outstandingRevenue: number;
  positionStats: Record<string, { impressions: number; clicks: number; ctr: number }>;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  category: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  imageUrl?: string;
  hashtags?: string[];
  linkedArticleId?: string;
  status: "active" | "removed" | "flagged";
  // Soft Delete & Governance Metadata
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deleteRetentionExpiresAt?: string;
  classification?: string;
  createdAt: any;
  updatedAt: any;
}

export interface CommunityComment {
  id: string;
  postId: string;
  parentId?: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  text: string;
  upvotes: number;
  downvotes?: number;
  createdAt: any;
}

export interface CommunityVote {
  id: string;
  userId: string;
  targetId: string; // Post or Comment ID
  type: "up" | "down";
  createdAt: any;
}

export interface CommunityReport {
  id: string;
  reporterId: string;
  targetId: string;
  targetType: "post" | "comment";
  reason: string;
  status: "pending" | "resolved";
  createdAt: any;
}

export type ModelCategory = "Fashion" | "Commercial" | "Actor" | "Influencer" | "Kids" | "Photographer";
export type ModelGender = "Male" | "Female" | "Other";

export interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
  createdAt: any;
}

export interface Model {
  id: string;
  name: string;
  profileImage: string;
  coverImages?: string[];
  gallery?: GalleryImage[];
  category: ModelCategory;
  gender: ModelGender;
  location: string;
  bio?: string;
  age?: number;
  height?: string;
  weight?: string;
  experienceYears?: number;
  languages?: string[];
  skills?: string[];
  isVerified?: boolean;
  isFeatured?: boolean;
  agentId?: string;
  agentName?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio?: string;
  photoURL?: string;
  commissionRate?: number;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface GalleryReaction {
  id: string;
  modelId?: string;
  imageId: string;
  userId: string;
  type: "like" | "heart" | "wow" | "clap" | "fire" | "laugh";
  createdAt: any;
}

export interface GalleryComment {
  id: string;
  modelId: string;
  imageId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: any;
}

export type InquiryStatus = "new" | "contacted" | "closed";
export type ProjectType = "Photoshoot" | "Music Video" | "Movie" | "Advertisement" | "Other";

export interface ModelInquiry {
  id: string;
  modelId: string;
  modelName: string;
  name: string;
  email: string;
  phone?: string;
  projectType: ProjectType;
  budget?: string;
  message?: string;
  status: InquiryStatus;
  createdAt: any;
}

export type MenuItemType = "category" | "district" | "city" | "custom";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  createdAt: any;
}

export interface MenuItem {
  id: string;
  label: string;
  path: string;
  type: MenuItemType;
  order: number;
  isActive: boolean;
  placement?: "header" | "hamburger" | "footer" | "all";
  parentId?: string;
}

// Enterprise Media Operations Additions
export interface AuditLog {
  id?: string;
  action: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  articleId?: string;
  metadata?: Record<string, any>;
  timestamp: any;
}

export interface StoryAssignment {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // userId of journalist/reporter
  assignedToName: string;
  assignedBy: string; // userId of editor
  assignedByName: string;
  deadline: string; // ISO String
  status: "assigned" | "in_progress" | "submitted" | "completed";
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface CoverageCalendarEvent {
  id: string;
  title: string;
  description: string;
  category: string; // Politics, Festivals, Sports, etc.
  eventDate: string; // ISO Date String
  location?: string;
  assignedTo?: string[]; // userIds
  status: "planned" | "active" | "completed";
  createdAt: any;
}

export interface ArticleVersion {
  id: string;
  articleId: string;
  title: string;
  content: string;
  excerpt: string;
  versionNumber: number;
  updatedBy: string;
  updatedByName: string;
  timestamp: any;
}

export interface BreakingNewsConfig {
  id: string;
  title: string;
  articleId?: string;
  isActive: boolean;
  homepageTakeover: boolean;
  stickyBanner: boolean;
  pushNotification: boolean;
  emergencyAlert: boolean;
  createdAt: any;
}

export interface AdCampaign {
  id: string;
  name: string;
  advertiserName: string;
  creativeUrl: string;
  placement: "sidebar" | "homepage_mid" | "article_bottom" | "header" | "article_inline";
  startDate: string; // ISO Date String
  endDate: string; // ISO Date String
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  isActive: boolean;
  createdAt: any;
}

export interface MediaAnalytics {
  id?: string;
  articleId?: string;
  category?: string;
  journalistId?: string;
  pageViews: number;
  uniqueReaders: number;
  avgReadingTime: number; // in seconds
  scrollDepth: number; // average percentage e.g. 75
  bounceRate: number; // percentage e.g. 35
  timestamp: string; // ISO Date (YYYY-MM-DD)
}

export type MediaLicenseType = "internal" | "owned" | "creative_commons" | "partner" | "sponsored" | "restricted";
export type MediaMimeType = "image" | "video" | "audio" | "document";

export interface MediaAsset {
  id: string;
  title: string;
  caption?: string;
  altText?: string;
  tags: string[];
  photographer?: string;
  copyrightOwner?: string;
  licenseType: MediaLicenseType;
  storagePath: string; // The URL or path to the asset
  mimeType: MediaMimeType;
  uploadedBy: string; // UID of user
  uploadedByName?: string; // Cache displayName of uploader
  usageRights?: string;
  expirationDate?: string; // Optional expiration date ISO string
  linkedArticlesCount?: number; // Cached counter of how many articles use it
  createdAt: any;
  deleted?: boolean;
  deletedBy?: string;
  deletedByName?: string;
  deletedAt?: string;
  restoredAt?: string;
  restoredBy?: string;
}

// SPRINT G — MODERATION OS TYPES
export type ReportReason = "spam" | "harassment" | "hate_speech" | "violence" | "misinformation" | "other";
export type ReportStatus = "open" | "resolved" | "dismissed";

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: "post" | "comment";
  targetId: string;
  targetTitle: string;
  targetContent: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  moderatedAt?: any;
  createdAt: any;
}

export type EnforcementLevel = "warning" | "mute" | "temp_ban" | "perm_ban" | "shadow_ban";

export interface ModerationAction {
  id: string;
  moderatorId: string;
  moderatorName: string;
  targetUserId: string;
  targetUserName: string;
  action: EnforcementLevel;
  reason: string;
  durationDays?: number; // Optional duration for temp bans or mutes
  createdAt: any;
}

export type AppealStatus = "pending" | "approved" | "rejected";

export interface Appeal {
  id: string;
  userId: string;
  userName: string;
  actionId: string;
  appealText: string;
  status: AppealStatus;
  moderatorNotes?: string;
  createdAt: any;
}

export interface BannedUser {
  id: string; // matches userId
  userId: string;
  userName: string;
  bannedBy: string;
  banType: EnforcementLevel;
  reason: string;
  expiresAt?: any; // null for permanent/shadow
  createdAt: any;
}

// TENANT FEDERATION OS TYPES
export * from "./tenant";
export type TenantModule = import("./tenant").TenantModuleItem;

export interface TenantBilling {
  plan: "starter" | "institutional" | "enterprise";
  monthlyRateNpr: number;
  status: "paid" | "past_due" | "trialing";
  nextBillingDate: string;
}

export interface TenantUser {
  id: string; // uid_tenantId
  userId: string;
  tenantId: string;
  tenantRole: "tenant_admin" | "tenant_editor" | "tenant_member" | "tenant_viewer";
  joinedAt: any;
}

// WORKFLOW AUTOMATION TYPES
export type WorkflowTriggerType = "story_submitted" | "sponsor_proposal_sent" | "new_member_joined" | "civic_complaint_logged" | "admission_applied";

export interface TenantWorkflowStep {
  id: string;
  title: string;
  assigneeRole: string;
  actionType: "notify" | "approval" | "auto_tag" | "external_webhook";
  status: "pending" | "completed" | "skipped";
}

export interface TenantWorkflow {
  id: string;
  tenantId: string;
  title: string;
  trigger: WorkflowTriggerType;
  steps: TenantWorkflowStep[];
  isActive: boolean;
  runCount: number;
  lastTriggeredAt?: string;
}

// DEVELOPER API KEY TYPES
export interface TenantApiKey {
  id: string;
  tenantId: string;
  keyName: string;
  publicKey: string; // e.g. "sk_sutra_live_9a8f..."
  scopes: string[]; // ["articles:read", "community:write", "analytics:read"]
  status: "active" | "revoked";
  requestsCountToday: number;
  createdAt: string;
  lastUsedAt?: string;
}

// TENANT HEALTH SCORECARD
export interface TenantHealthScore {
  tenantId: string;
  overallScore: number; // 0-100
  usageScore: number;
  retentionScore: number;
  contentActivityScore: number;
  revenueScore: number;
  communityScore: number;
  statusCategory: "healthy" | "growing" | "at_risk";
  lastAuditedAt: string;
}

// SANATAN MARGA SOCIAL MEDIA TYPES
export type SocialPlatform = 
  | "youtube"
  | "facebook"
  | "twitter"
  | "instagram"
  | "tiktok"
  | "telegram"
  | "whatsapp"
  | "spotify"
  | "threads"
  | "linkedin";

export interface SocialAccount {
  id: string;
  name: string;             // e.g. "सनातन मार्ग - YouTube" or "Sanatan Media Official"
  platform: SocialPlatform;
  handle: string;           // e.g. "@SanatanMargaOfficial"
  url: string;              // e.g. "https://youtube.com/@SanatanMargaOfficial"
  followerCount?: string;   // e.g. "250K+ Subscribers"
  description?: string;     // e.g. "सनातन धर्म, दर्शन, संस्कृति तथा अध्यात्मको आधिकारिक आवाज"
  avatarUrl?: string;       // Custom icon / logo URL
  isVerified?: boolean;     // Verified badge
  isActive: boolean;        // Active/inactive switch
  isFeatured?: boolean;     // Featured pin on hero section
  category?: string;        // e.g. "अध्यात्म", "प्रवचन", "भजन", "समाचार"
  order: number;
  createdAt: any;
  updatedAt?: any;
}

export type SocialContentType = "video" | "reel" | "post" | "live" | "podcast" | "channel";

export interface SocialPost {
  id: string;
  title: string;            // Post or Video Title
  platform: SocialPlatform;
  contentType: SocialContentType;
  url: string;              // Direct URL to post or video
  embedId?: string;         // YouTube Video ID, FB embed URL, Instagram post code
  thumbnailUrl?: string;    // Thumbnail image
  caption?: string;         // Post caption / summary
  authorName?: string;      // e.g. "सनातन मिडिया"
  authorHandle?: string;    // e.g. "@SanatanMedia"
  likesCount?: number;
  viewsCount?: number;
  sharesCount?: number;
  isFeatured?: boolean;     // Highlighted post
  publishedAt?: string;     // ISO Date String
  createdAt: any;
  updatedAt?: any;
}

// STORY EVOLUTION ENGINE TYPES (NewsOS v3.0)
export type StoryMilestoneType = 
  | "breaking" 
  | "committee_decision" 
  | "court_order" 
  | "press_briefing" 
  | "policy_announcement" 
  | "public_protest" 
  | "fact_finding" 
  | "final_outcome";

export interface StoryMilestone {
  id: string;
  storyArcId: string;
  date: string; // ISO date string or formatted date
  title: string;
  summary: string;
  type: StoryMilestoneType;
  articleId?: string;
  articleSlug?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  importance: "high" | "medium" | "low";
  verified: boolean;
}

export interface StorylineArc {
  id: string;
  slug: string;
  titleNepali: string;
  titleEnglish: string;
  summaryNepali: string;
  summaryEnglish?: string;
  category: string;
  districts: string[];
  entityIds: string[]; // Linked Knowledge Graph nodes
  status: "developing" | "active" | "concluded" | "archived";
  startedAt: string;
  lastUpdated: string;
  coverImage?: string;
  subscriberCount?: number;
  milestones: StoryMilestone[];
  articleIds: string[];
  pinnedArticleId?: string;
  importanceTier: 1 | 2 | 3; // 1: National Critical, 2: Provincial/Sectoral, 3: Regional
}

// RSS & WIRE SOURCE POLLER TYPES
export interface RSSFeedSource {
  id: string;
  name: string;
  url: string;
  type: "rss" | "atom" | "gov_gazette" | "press_release" | "api";
  categoryDefault: string;
  authorityTier: 1 | 2 | 3 | 4;
  isActive: boolean;
  pollIntervalMinutes: number;
  lastPolledAt?: string;
  lastSuccessfulItemCount?: number;
  errorCount?: number;
  lastErrorMessage?: string;
}

export interface PolledFeedItem {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  link: string;
  pubDate: string;
  snippet: string;
  contentHtml?: string;
  district?: string;
  category?: string;
  author?: string;
  processedStatus: "queued" | "imported" | "ignored" | "duplicate";
  discoveredAt: string;
  similarityFingerprint?: string;
}

export interface DiscoveryStory {
  id: string;
  title: string;
  titleNe?: string;
  summary: string;
  summaryNe?: string;
  category: string;
  source: string;
  sourceUrl?: string;
  freshnessMins: number;
  district: string;
  isGovNotice: boolean;
  governmentDept?: string;
  status: "new" | "drafted" | "ignored" | "published";
  scores: {
    freshness: number;
    authority: number;
    relevance: number;
    civilizational: number;
    communityInterest: number;
    duplicateRisk: number;
  };
  tags: string[];
  createdAt: string;
}

// READER PREFERENCES & MEMBERSHIP INTELLIGENCE
export interface ReaderPreferences {
  followedDistricts: string[];
  followedEntityIds: string[];
  followedStoryArcIds: string[];
  followedCategories: string[];
  readingSpeedWpm?: number;
  offlineSyncEnabled: boolean;
  newsletterSubscribed: boolean;
  dailyDigestTime?: string; // e.g. "06:00"
}

// SANATAN STORE & COMMERCE TYPES
export interface StoreProduct {
  id: string;
  name: string;
  nameNepali: string;
  slug: string;
  description: string;
  descriptionNepali: string;
  price: number;
  salePrice?: number;
  category: "books" | "merchandise" | "digital" | "artwork" | "puja";
  images: string[];
  stock: number;
  whatsappNumber: string;
  status: "active" | "out_of_stock" | "draft";
  isFeatured?: boolean;
  isCertified?: boolean;
  certificationDetails?: string;
  authorOrMaker?: string;
  language?: "nepali" | "sanskrit" | "english" | "multilingual";
  downloadUrl?: string; // For digital products (PDFs/Audio)
  fileFormat?: string; // e.g. "PDF", "MP3", "EPUB"
  pageCount?: number;
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreOrder {
  id?: string;
  orderId?: string;
  customerName: string;
  phone?: string;
  customerPhone?: string;
  email?: string;
  district?: string;
  address: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPriceLocked?: number;
  totalPrice: number;
  paymentMethod: "whatsapp_cod" | "cod_whatsapp" | "esewa" | "khalti" | "fonepay" | "bank_transfer" | string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "PENDING_RECOVERY";
  storageClass?: "AUTHORITATIVE_DURABLE" | "LOCAL_RECOVERY_ONLY" | "CLIENT_RECOVERY_ONLY";
  idempotencyKey?: string | null;
  recoveryReason?: string;
  notes?: string;
  whatsappSent?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// SANATAN BLOG DATA MODEL & TAXONOMY
export type BlogStatus = "draft" | "under_review" | "approved" | "published" | "archived";

export interface ScriptureReference {
  id?: string;
  nodeId?: string;
  granthaId?: string;
  granthaTitleNepali?: string;
  granthaTitleEnglish?: string;
  sanskritVerse?: string;
  translation?: string;
  text?: string; // e.g. "Bhagavad Gita", "Rigveda", "Katha Upanishad"
  bookOrKanda?: string;
  chapter?: string | number;
  verse?: string | number;
  sourceEdition?: string;
  devanagariText?: string;
  transliteration?: string;
  englishTranslation?: string;
  nepaliTranslation?: string;
  commentaryBy?: string;
}

export interface SgisReference {
  id?: string;
  entityId?: string;
  entityType?: "manuscript" | "grantha" | "temple" | "philosopher" | "concept";
  title: string;
  titleNe?: string;
  sanskritTitle?: string;
  manuscriptNumber?: string;
  folioNumber?: string;
  deepLink?: string;
}

export interface BlogCategory {
  id: string;
  slug: string;
  name: string;
  nameNe: string;
  description?: string;
  descriptionNe?: string;
  icon?: string;
  bannerImage?: string;
  order: number;
  isActive: boolean;
  isFeatured?: boolean;
  postCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogSeries {
  id: string;
  slug: string;
  title: string;
  titleNe: string;
  description?: string;
  descriptionNe?: string;
  featuredImage?: string;
  authorId?: string;
  authorName?: string;
  totalParts: number;
  postsCount: number;
  status: "active" | "completed" | "archived";
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogTag {
  id: string;
  slug: string;
  name: string;
  nameNe: string;
  postCount?: number;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  titleNe: string;
  subtitle?: string;
  subtitleNe?: string;
  excerpt: string;
  excerptNe: string;
  body: string; // Markdown or rich formatted text (English/Primary)
  bodyNe?: string; // Nepali rich text
  featuredImage: string;
  gallery?: string[];
  
  // Canonical Human Authorship (Preserves Initiating Human, not AI)
  authorId: string;
  authorDisplayName: string;
  authorPhoto?: string;
  authorBio?: string;
  authorBioNe?: string;
  
  // Editorial Governance & Audit Trail
  createdBy: string;
  lastEditedBy?: string;
  reviewedBy?: string;
  approvedBy?: string;
  publishedBy?: string;
  
  // Categorization & Series
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  categoryNameNe?: string;
  tags: string[];
  seriesId?: string;
  seriesSlug?: string;
  seriesName?: string;
  seriesOrder?: number;
  
  // Language & Translation State
  language: "en" | "ne" | "bilingual";
  translationStatus?: "completed" | "in_progress" | "pending";
  
  // Status & Priority
  status: BlogStatus;
  featured?: boolean;
  pinned?: boolean;
  readingTimeMinutes?: number;
  
  // SEO & OpenGraph
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  
  // Scholarly Citations & Saraswati Knowledge Integration
  scriptureReferences?: ScriptureReference[];
  sgisReferences?: SgisReference[];
  knowledgeGraphEntities?: string[]; // IDs or names of linked deities, temples, concepts
  sources?: string[];
  
  // AI Assistance Metadata (Strict separation from human author)
  aiAssisted?: boolean;
  aiModel?: string;
  aiTaskType?: "draft" | "outline" | "translation" | "summary" | "scripture_lookup";
  
  // Engagement & Metrics
  views?: number;
  shares?: number;
  likesCount?: number;
  
  // Timestamps
  createdAt: any;
  updatedAt: any;
  publishedAt?: any;
  
  // Snapshot OS
  snapshotVersion?: string;
  schemaVersion?: number;
}

export interface BlogHomepageSnapshot {
  generatedAt: string;
  version: string;
  featuredEssay: BlogPost | null;
  featuredTopics: BlogCategory[];
  latestPosts: BlogPost[];
  scripturePosts: BlogPost[];
  philosophyPosts: BlogPost[];
  traditionPosts: BlogPost[];
  yogaSadhanaPosts: BlogPost[];
  templeHeritagePosts: BlogPost[];
  popularPosts: BlogPost[];
  featuredSeries: BlogSeries[];
  categories: BlogCategory[];
}

export * from "./live";
export * from "./assessment";
export * from "./provenance";

export interface AdminDomainHealth {
  status: "HEALTHY" | "DEGRADED" | "WARNING" | "CRITICAL" | "UNAVAILABLE" | "UNVERIFIED";
  message: string;
  lastChecked: string;
  metrics: Record<string, any>;
}

export interface AdminAttentionItem {
  attentionId: string;
  domain: string;
  type: string;
  severity: "INFO" | "WARNING" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  entityId?: string;
  entityType?: string;
  targetRoute: string;
  createdAt: string;
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  source: string;
  tenantId?: string;
  requiredPermission?: string;
  dedupeKey: string;
}

export * from "./readerActivity";
export * from "./language";
export * from "./iam";
export * from "./developer";

