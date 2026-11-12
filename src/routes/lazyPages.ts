import { lazy, ComponentType } from "react";

/**
 * Robust lazy loading with automatic single reload fallback for stale chunk caches in Safari/WebKit.
 */
function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch((error) => {
      if (typeof window !== "undefined") {
        const storageKey = `chunk_retry_${window.location.pathname}`;
        const hasRetried = sessionStorage.getItem(storageKey);
        if (!hasRetried) {
          sessionStorage.setItem(storageKey, "true");
          window.location.reload();
        }
      }
      throw error;
    })
  );
}

// Public Core Pages (Lazy loaded for subroutes)
export const HomePage = lazyWithRetry(() => import("../pages/HomePage"));
export const LoginPage = lazyWithRetry(() => import("../pages/LoginPage"));
export const CategoryPage = lazyWithRetry(() => import("../pages/CategoryPage"));
export const ArticlePage = lazyWithRetry(() => import("../pages/ArticlePage"));
export const DistrictPage = lazyWithRetry(() => import("../pages/DistrictPage"));
export const LivePage = lazyWithRetry(() => import("../pages/LivePage"));
export const SearchPage = lazyWithRetry(() => import("../pages/SearchPage"));
export const TrendingPage = lazyWithRetry(() => import("../pages/TrendingPage"));
export const LatestNewsPage = lazyWithRetry(() => import("../pages/LatestNewsPage"));
export const AboutPage = lazyWithRetry(() => import("../pages/AboutPage"));
export const ContactPage = lazyWithRetry(() => import("../pages/ContactPage"));
export const ProfilePage = lazyWithRetry(() => import("../pages/ProfilePage"));
export const TermsPage = lazyWithRetry(() => import("../pages/TermsPage"));
export const PrivacyPage = lazyWithRetry(() => import("../pages/PrivacyPage"));
export const DownloadPage = lazyWithRetry(() => import("../pages/DownloadPage"));
export const CommunityPage = lazyWithRetry(() => import("../pages/CommunityPage"));
export const CommunityPostPage = lazyWithRetry(() => import("../pages/CommunityPostPage"));
export const EventsPage = lazyWithRetry(() => import("../pages/EventsPage"));
export const EventPostPage = lazyWithRetry(() => import("../pages/EventPostPage"));
export const ModelsPage = lazyWithRetry(() => import("../pages/ModelsPage"));
export const ModelProfilePage = lazyWithRetry(() => import("../pages/ModelProfilePage"));
export const SocialHubPage = lazyWithRetry(() => import("../pages/SocialHubPage"));
export const KnowledgeBasePage = lazyWithRetry(() => import("../pages/KnowledgeBasePage"));
export const NepalHubPage = lazyWithRetry(() => import("../pages/NepalHubPage"));
export const NepalHubLivePage = lazyWithRetry(() => import("../pages/NepalHubLivePage"));
export const StorylinesPage = lazyWithRetry(() => import("../pages/StorylinesPage"));
export const MySanatanPage = lazyWithRetry(() => import("../pages/MySanatanPage"));
export const DailyDigestPage = lazyWithRetry(() => import("../pages/DailyDigestPage"));
export const StorePage = lazyWithRetry(() => import("../pages/StorePage"));
export const ProductDetailsPage = lazyWithRetry(() => import("../pages/ProductDetailsPage"));
export const MembershipPage = lazyWithRetry(() => import("../pages/MembershipPage"));
export const AcademyPage = lazyWithRetry(() => import("../pages/AcademyPage"));
export const CourseDetailPage = lazyWithRetry(() => import("../pages/CourseDetailPage"));
export const StudentAcademyResultsPage = lazyWithRetry(() => import("../pages/StudentAcademyResultsPage"));
export const CertificateVerificationPage = lazyWithRetry(() => import("../pages/CertificateVerificationPage"));
export const TrainingCenterPage = lazyWithRetry(() => import("../pages/TrainingCenterPage"));
export const PublicDemoPage = lazyWithRetry(() => import("../pages/PublicDemoPage"));
export const OrganizationCompliancePage = lazyWithRetry(() => import("../pages/OrganizationCompliancePage"));
export const GlobalSearchPage = lazyWithRetry(() => import("../pages/GlobalSearchPage"));
export const InstitutionalDirectoryPage = lazyWithRetry(() => import("../pages/InstitutionalDirectoryPage"));
export const FestivalEnginePage = lazyWithRetry(() => import("../pages/FestivalEnginePage"));
export const TransparencyPage = lazyWithRetry(() => import("../pages/TransparencyPage"));
export const ArchivesPage = lazyWithRetry(() => import("../pages/ArchivesPage"));
export const AskSanatanPage = lazyWithRetry(() => import("../pages/AskSanatanPage"));
export const TimelinePage = lazyWithRetry(() => import("../pages/TimelinePage"));
export const TenantOnboardingPage = lazyWithRetry(() => import("../pages/TenantOnboardingPage"));
export const ListenPage = lazyWithRetry(() => import("../pages/ListenPage"));
export const RadioPage = lazyWithRetry(() => import("../pages/RadioPage"));
export const AdvertiserDashboard = lazyWithRetry(() => import("../pages/AdvertiserDashboard"));
export const OrganizationDashboard = lazyWithRetry(() => import("../pages/OrganizationDashboard"));

// Sanatan Blog Public Pages
export const BlogHomePage = lazyWithRetry(() => import("../pages/BlogHomePage"));
export const BlogPostPage = lazyWithRetry(() => import("../pages/BlogPostPage"));
export const BlogCategoryPage = lazyWithRetry(() => import("../pages/BlogCategoryPage"));
export const BlogSeriesPage = lazyWithRetry(() => import("../pages/BlogSeriesPage"));
export const BlogTagPage = lazyWithRetry(() => import("../pages/BlogTagPage"));
export const BlogAuthorPage = lazyWithRetry(() => import("../pages/BlogAuthorPage"));

// Admin & Editorial Pages
export const AdminDashboard = lazyWithRetry(() => import("../pages/AdminDashboard"));
export const EditorDashboard = lazyWithRetry(() => import("../pages/EditorDashboard"));
export const AdminEditor = lazyWithRetry(() => import("../pages/AdminEditor"));
export const AdminUsers = lazyWithRetry(() => import("../pages/AdminUsers"));
export const AdminSettings = lazyWithRetry(() => import("../pages/AdminSettings"));
export const AdminCategories = lazyWithRetry(() => import("../pages/AdminCategories"));
export const AdminAds = lazyWithRetry(() => import("../pages/AdminAds"));
export const AdminMenu = lazyWithRetry(() => import("../pages/AdminMenu"));
export const AdminSetupGuide = lazyWithRetry(() => import("../pages/AdminSetupGuide"));
export const AdminPageBuilder = lazyWithRetry(() => import("../pages/AdminPageBuilder"));
export const AdminLive = lazyWithRetry(() => import("../pages/AdminLive"));
export const AdminArticles = lazyWithRetry(() => import("../pages/AdminArticles"));
export const AdminDiscovery = lazyWithRetry(() => import("../pages/AdminDiscovery"));
export const AdminHealth = lazyWithRetry(() => import("../pages/AdminHealth"));
export const AdminAIObservability = lazyWithRetry(() => import("../pages/AdminAIObservability"));
export const AdminCommunity = lazyWithRetry(() => import("../pages/AdminCommunity"));
export const AdminEvents = lazyWithRetry(() => import("../pages/AdminEvents"));
export const AdminEventEditor = lazyWithRetry(() => import("../pages/AdminEventEditor"));
export const AdminModels = lazyWithRetry(() => import("../pages/AdminModels"));
export const AdminInquiries = lazyWithRetry(() => import("../pages/AdminInquiries"));
export const AdminContactMessages = lazyWithRetry(() => import("../pages/AdminContactMessages"));
export const AdminAgents = lazyWithRetry(() => import("../pages/AdminAgents"));
export const AdminMediaOS = lazyWithRetry(() => import("../pages/AdminMediaOS"));
export const AdminMediaLibrary = lazyWithRetry(() => import("../pages/AdminMediaLibrary"));
export const AdminOperations = lazyWithRetry(() => import("../pages/AdminOperations"));
export const AdminNotifications = lazyWithRetry(() => import("../pages/AdminNotifications"));
export const AdminModeration = lazyWithRetry(() => import("../pages/AdminModeration"));
export const AdminRevenueOS = lazyWithRetry(() => import("../pages/AdminRevenueOS"));
export const ExecutiveDashboard = lazyWithRetry(() => import("../pages/ExecutiveDashboard"));
export const AdminTenantFederation = lazyWithRetry(() => import("../pages/AdminTenantFederation"));
export const AdminWorkflowAutomation = lazyWithRetry(() => import("../pages/AdminWorkflowAutomation"));
export const AdminTenantApiKeys = lazyWithRetry(() => import("../pages/AdminTenantApiKeys"));
export const AdminNepalHubPage = lazyWithRetry(() => import("../pages/AdminNepalHubPage"));
export const AdminKnowledgePage = lazyWithRetry(() => import("../pages/AdminKnowledgePage"));
export const AdminHomepage = lazyWithRetry(() => import("../pages/AdminHomepage"));
export const AdminAcademy = lazyWithRetry(() => import("../pages/AdminAcademy"));
export const AdminDataGovernance = lazyWithRetry(() => import("../pages/AdminDataGovernance"));
export const AdminDisasterRecovery = lazyWithRetry(() => import("../pages/AdminDisasterRecovery"));
export const AdminMediaAssetsPage = lazyWithRetry(() => import("../pages/AdminMediaAssetsPage"));
export const AnalyticsOSDashboard = lazyWithRetry(() => import("../pages/AnalyticsOSDashboard"));
export const AdminSocial = lazyWithRetry(() => import("../pages/AdminSocial"));
export const AdminEditorialCommandCenter = lazyWithRetry(() => import("../pages/AdminEditorialCommandCenter"));
export const AdminCommerceAnalytics = lazyWithRetry(() => import("../pages/AdminCommerceAnalytics"));
export const AdminContentAudit = lazyWithRetry(() => import("../pages/AdminContentAudit"));
export const AdminStorePage = lazyWithRetry(() => import("../pages/AdminStorePage"));
export const AdminSystemHealth = lazyWithRetry(() => import("../pages/AdminSystemHealth"));
export const AdminTrainingManagerPage = lazyWithRetry(() => import("../pages/AdminTrainingManagerPage"));
export const AdminPlatformHealth = lazyWithRetry(() => import("../pages/AdminPlatformHealth"));
export const AdminMissionControl = lazyWithRetry(() => import("../pages/AdminMissionControl"));
export const AdminArchivesPage = lazyWithRetry(() => import("../pages/AdminArchivesPage"));
export const AdminGovernancePage = lazyWithRetry(() => import("../pages/AdminGovernancePage"));
export const AdminTimelinePage = lazyWithRetry(() => import("../pages/AdminTimelinePage"));
export const AdminReaderAnalyticsPage = lazyWithRetry(() => import("../pages/AdminReaderAnalyticsPage"));
export const AdminSystemIntegrity = lazyWithRetry(() => import("../pages/AdminSystemIntegrity"));
export const AdminNepalIntelligenceOS = lazyWithRetry(() => import("../pages/AdminNepalIntelligenceOS"));
export const AdminDesignOS = lazyWithRetry(() => import("../pages/AdminDesignOS"));
export const AdminBlog = lazyWithRetry(() => import("../pages/AdminBlog"));
export const AdminRadioPage = lazyWithRetry(() => import("../pages/admin/AdminRadioPage"));
export const AdminSponsorAudioOS = lazyWithRetry(() => import("../pages/admin/AdminSponsorAudioOS"));
export const AdminTranslationDashboard = lazyWithRetry(() => import("../pages/AdminTranslationDashboard"));
export const AdminSeoOS = lazyWithRetry(() => import("../pages/AdminSeoOS"));
export const AdminFeatureControl = lazyWithRetry(() => import("../pages/admin/AdminFeatureControl"));
export const AdminReviewInboxPage = lazyWithRetry(() => import("../pages/admin/AdminReviewInboxPage"));
export const AdminSnapshotCenter = lazyWithRetry(() => import("../pages/AdminSnapshotCenter"));
export const AdminListenPage = lazyWithRetry(() => import("../pages/AdminListenPage"));
export const AdminMembershipPage = lazyWithRetry(() => import("../pages/AdminMembershipPage"));
export const AdminPanchangPage = lazyWithRetry(() => import("../pages/AdminPanchangPage"));
export const TargetUnavailablePage = lazyWithRetry(() => import("../pages/TargetUnavailablePage"));
export const ApiTestPage = lazyWithRetry(() => import("../pages/ApiTestPage"));
