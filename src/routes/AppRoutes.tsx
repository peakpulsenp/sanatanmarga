import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import ProtectedPermissionRoute from "../components/auth/ProtectedPermissionRoute";
import { RouteFeatureGuard } from "../context/FeatureControlContext";
import * as Pages from "./lazyPages";

function RouteSuspenseFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-muted-text font-medium">लोड हुँदैछ...</span>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteSuspenseFallback />}>
      <Routes>
        {/* Core Public Routes */}
        <Route path="/" element={<Pages.HomePage />} />
        <Route path="/login" element={<Pages.LoginPage />} />
        <Route path="/community" element={
          <RouteFeatureGuard feature="community.chautari">
            <Pages.CommunityPage />
          </RouteFeatureGuard>
        } />
        <Route path="/chautari" element={<Navigate to="/community" replace />} />
        <Route path="/community/post/:id" element={
          <RouteFeatureGuard feature="community.chautari">
            <Pages.CommunityPostPage />
          </RouteFeatureGuard>
        } />
        <Route path="/events" element={
          <RouteFeatureGuard feature="community.events">
            <Pages.EventsPage />
          </RouteFeatureGuard>
        } />
        <Route path="/events/:id" element={
          <RouteFeatureGuard feature="community.events">
            <Pages.EventPostPage />
          </RouteFeatureGuard>
        } />
        <Route path="/models" element={<Pages.ModelsPage />} />
        <Route path="/models/:id" element={<Pages.ModelProfilePage />} />
        <Route path="/social" element={<Pages.SocialHubPage />} />
        <Route path="/sanatan-social" element={<Navigate to="/social" replace />} />

        {/* Admin Dashboard & Management Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminMissionControl />
          </ProtectedRoute>
        } />
        <Route path="/admin/review" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminReviewInboxPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/verification" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminReviewInboxPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/snapshots" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminSnapshotCenter />
          </ProtectedRoute>
        } />
        <Route path="/admin/listen" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminListenPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/panchang" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminPanchangPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/membership" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminMembershipPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/social" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminSocial />
          </ProtectedRoute>
        } />
        <Route path="/admin/community" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminCommunity />
          </ProtectedRoute>
        } />
        <Route path="/admin/events" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminEvents />
          </ProtectedRoute>
        } />
        <Route path="/admin/models" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminModels />
          </ProtectedRoute>
        } />
        <Route path="/admin/inquiries" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminInquiries />
          </ProtectedRoute>
        } />
        <Route path="/admin/contact-messages" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminContactMessages />
          </ProtectedRoute>
        } />
        <Route path="/admin/agents" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Pages.AdminAgents />
          </ProtectedRoute>
        } />
        <Route path="/admin/events/:id" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminEventEditor />
          </ProtectedRoute>
        } />
        <Route path="/admin/events/new" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminEventEditor />
          </ProtectedRoute>
        } />

        {/* Editor Routes */}
        <Route path="/editor" element={
          <ProtectedRoute allowedRoles={['editor']}>
            <Pages.EditorDashboard />
          </ProtectedRoute>
        } />

        {/* Shared Admin/Editor Routes */}
        <Route path="/admin/homepage" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminHomepage />
          </ProtectedRoute>
        } />
        <Route path="/admin/design-os" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminDesignOS />
          </ProtectedRoute>
        } />
        <Route path="/admin/articles" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminArticles />
          </ProtectedRoute>
        } />
        <Route path="/admin/discovery" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminDiscovery />
          </ProtectedRoute>
        } />
        <Route path="/admin/translation" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminTranslationDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/health" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminSystemHealth />
          </ProtectedRoute>
        } />
        <Route path="/admin/system-health" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminSystemHealth />
          </ProtectedRoute>
        } />
        <Route path="/admin/ai-observability" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminAIObservability />
          </ProtectedRoute>
        } />
        <Route path="/admin/editor" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminEditor />
          </ProtectedRoute>
        } />
        <Route path="/admin/editor/:id" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminEditor />
          </ProtectedRoute>
        } />

        {/* Admin Permissions Routes */}
        <Route path="/admin/users" element={
          <ProtectedPermissionRoute permission="users.manage">
            <Pages.AdminUsers />
          </ProtectedPermissionRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Pages.AdminSettings />
          </ProtectedRoute>
        } />
        <Route path="/admin/feature-control" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Pages.AdminFeatureControl />
          </ProtectedRoute>
        } />
        <Route path="/admin/categories" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Pages.AdminCategories />
          </ProtectedRoute>
        } />
        <Route path="/admin/ads" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Pages.AdminAds />
          </ProtectedRoute>
        } />
        <Route path="/admin/menu" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Pages.AdminMenu />
          </ProtectedRoute>
        } />
        <Route path="/admin/setup-guide" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Pages.AdminSetupGuide />
          </ProtectedRoute>
        } />
        <Route path="/admin/command-center" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminEditorialCommandCenter />
          </ProtectedRoute>
        } />
        <Route path="/admin/editorial" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminEditorialCommandCenter />
          </ProtectedRoute>
        } />
        <Route path="/admin/page-builder" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Pages.AdminPageBuilder />
          </ProtectedRoute>
        } />
        <Route path="/admin/media-os" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminMediaAssetsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/media-assets" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminMediaAssetsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/media" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminMediaAssetsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/media-library" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminMediaAssetsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/operations" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminMissionControl />
          </ProtectedRoute>
        } />
        <Route path="/admin/notifications" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Pages.AdminNotifications />
          </ProtectedRoute>
        } />
        <Route path="/admin/moderation" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminModeration />
          </ProtectedRoute>
        } />
        <Route path="/admin/revenue" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminRevenueOS />
          </ProtectedRoute>
        } />
        <Route path="/admin/revenue-os" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminRevenueOS />
          </ProtectedRoute>
        } />
        <Route path="/admin/intelligence-os" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminNepalIntelligenceOS />
          </ProtectedRoute>
        } />
        <Route path="/admin/executive" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Pages.ExecutiveDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/tenants" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Pages.AdminTenantFederation />
          </ProtectedRoute>
        } />
        <Route path="/admin/workflows" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Pages.AdminWorkflowAutomation />
          </ProtectedRoute>
        } />
        <Route path="/admin/developer-api" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Pages.AdminTenantApiKeys />
          </ProtectedRoute>
        } />
        <Route path="/admin/nepal-hub" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminNepalHubPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/radio" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminRadioPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/sponsor-audio" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminSponsorAudioOS />
          </ProtectedRoute>
        } />
        <Route path="/admin/knowledge-hub" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminNepalHubPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/hub-os" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminNepalHubPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/knowledge" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminKnowledgePage />
          </ProtectedRoute>
        } />
        <Route path="/admin/knowledge-os" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminKnowledgePage />
          </ProtectedRoute>
        } />
        <Route path="/admin/archives" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminArchivesPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/timeline" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminTimelinePage />
          </ProtectedRoute>
        } />
        <Route path="/admin/festivals" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminKnowledgePage defaultTab="festivals" />
          </ProtectedRoute>
        } />
        <Route path="/admin/academy" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminAcademy />
          </ProtectedRoute>
        } />
        <Route path="/admin/video-ads" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminAcademy />
          </ProtectedRoute>
        } />
        <Route path="/admin/data-governance" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminGovernancePage />
          </ProtectedRoute>
        } />
        <Route path="/admin/disaster-recovery" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Pages.AdminDisasterRecovery />
          </ProtectedRoute>
        } />
        <Route path="/admin/content-audit" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminGovernancePage />
          </ProtectedRoute>
        } />
        <Route path="/admin/store" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminStorePage />
          </ProtectedRoute>
        } />
        <Route path="/admin/commerce" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminStorePage />
          </ProtectedRoute>
        } />
        <Route path="/admin/commerce-analytics" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminCommerceAnalytics />
          </ProtectedRoute>
        } />
        <Route path="/admin/platform-health" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminMissionControl />
          </ProtectedRoute>
        } />
        <Route path="/admin/mission-control" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminMissionControl />
          </ProtectedRoute>
        } />
        <Route path="/admin/governance" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminGovernancePage />
          </ProtectedRoute>
        } />
        <Route path="/admin/reader-analytics" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Pages.AdminReaderAnalyticsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/system-integrity" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminSystemIntegrity />
          </ProtectedRoute>
        } />

        {/* Public Sections */}
        <Route path="/timeline" element={
          <RouteFeatureGuard feature="knowledge.timeline">
            <Pages.TimelinePage />
          </RouteFeatureGuard>
        } />
        <Route path="/timeline/:id" element={
          <RouteFeatureGuard feature="knowledge.timeline">
            <Pages.TimelinePage />
          </RouteFeatureGuard>
        } />
        <Route path="/transparency" element={<Pages.TransparencyPage />} />
        <Route path="/archives" element={
          <RouteFeatureGuard feature="knowledge.archives">
            <Pages.ArchivesPage />
          </RouteFeatureGuard>
        } />
        <Route path="/archives/:id" element={
          <RouteFeatureGuard feature="knowledge.archives">
            <Pages.ArchivesPage />
          </RouteFeatureGuard>
        } />
        <Route path="/ask" element={<Navigate to="/ask-sanatan" replace />} />
        <Route path="/ask-sanatan" element={<Pages.AskSanatanPage />} />
        <Route path="/membership" element={
          <RouteFeatureGuard feature="revenue.membership">
            <Pages.MembershipPage />
          </RouteFeatureGuard>
        } />
        <Route path="/patrons" element={
          <RouteFeatureGuard feature="revenue.membership">
            <Pages.MembershipPage />
          </RouteFeatureGuard>
        } />
        <Route path="/academy" element={
          <RouteFeatureGuard feature="training.academy">
            <Pages.AcademyPage />
          </RouteFeatureGuard>
        } />
        <Route path="/academy/course/:id" element={
          <RouteFeatureGuard feature="training.academy">
            <Pages.CourseDetailPage />
          </RouteFeatureGuard>
        } />
        <Route path="/academy/results" element={
          <RouteFeatureGuard feature="training.academy">
            <Pages.StudentAcademyResultsPage />
          </RouteFeatureGuard>
        } />
        <Route path="/training" element={
          <RouteFeatureGuard feature="training.academy">
            <Pages.TrainingCenterPage />
          </RouteFeatureGuard>
        } />
        <Route path="/training/:trackId" element={
          <RouteFeatureGuard feature="training.academy">
            <Pages.TrainingCenterPage />
          </RouteFeatureGuard>
        } />
        <Route path="/training/:trackId/:lessonId" element={
          <RouteFeatureGuard feature="training.academy">
            <Pages.TrainingCenterPage />
          </RouteFeatureGuard>
        } />
        <Route path="/academy/sanatanmarga-training" element={<Navigate to="/training" replace />} />
        <Route path="/academy/training" element={<Navigate to="/training" replace />} />
        <Route path="/demo" element={<Pages.PublicDemoPage />} />
        <Route path="/public-demo" element={<Navigate to="/demo" replace />} />
        <Route path="/organization/compliance" element={<Pages.OrganizationCompliancePage />} />
        <Route path="/training/compliance" element={<Navigate to="/organization/compliance" replace />} />
        <Route path="/admin/training" element={
          <ProtectedRoute allowedRoles={['admin', 'editor', 'super_admin']}>
            <Pages.AdminTrainingManagerPage />
          </ProtectedRoute>
        } />
        <Route path="/verify-certificate" element={
          <RouteFeatureGuard feature="training.certification">
            <Pages.CertificateVerificationPage />
          </RouteFeatureGuard>
        } />
        <Route path="/verify-certificate/:certId" element={
          <RouteFeatureGuard feature="training.certification">
            <Pages.CertificateVerificationPage />
          </RouteFeatureGuard>
        } />
        <Route path="/verify" element={<Navigate to="/verify-certificate" replace />} />
        <Route path="/verify/:certId" element={<Navigate to="/verify-certificate" replace />} />
        <Route path="/global-search" element={<Pages.GlobalSearchPage />} />
        <Route path="/directory" element={<Pages.InstitutionalDirectoryPage />} />
        <Route path="/festivals" element={
          <RouteFeatureGuard feature="knowledge.festivals">
            <Pages.FestivalEnginePage />
          </RouteFeatureGuard>
        } />
        <Route path="/onboarding" element={<Pages.TenantOnboardingPage />} />
        <Route path="/nepal-hub" element={
          <RouteFeatureGuard feature="nepalhub.main">
            <Pages.NepalHubPage />
          </RouteFeatureGuard>
        } />
        <Route path="/nepal-hub/live" element={
          <RouteFeatureGuard feature="nepalhub.situationRoom">
            <Pages.NepalHubLivePage />
          </RouteFeatureGuard>
        } />
        <Route path="/nepal-hub/live/:id" element={
          <RouteFeatureGuard feature="nepalhub.situationRoom">
            <Pages.NepalHubLivePage />
          </RouteFeatureGuard>
        } />
        <Route path="/listen" element={
          <RouteFeatureGuard feature="media.listenos">
            <Pages.ListenPage />
          </RouteFeatureGuard>
        } />
        <Route path="/radio" element={
          <RouteFeatureGuard feature="media.radio">
            <Pages.RadioPage />
          </RouteFeatureGuard>
        } />
        <Route path="/media" element={<Navigate to="/radio" replace />} />

        <Route path="/store" element={
          <RouteFeatureGuard feature="commerce.store">
            <Pages.StorePage />
          </RouteFeatureGuard>
        } />
        <Route path="/store/product/:id" element={
          <RouteFeatureGuard feature="commerce.store">
            <Pages.ProductDetailsPage />
          </RouteFeatureGuard>
        } />
        <Route path="/store/:id" element={
          <RouteFeatureGuard feature="commerce.store">
            <Pages.ProductDetailsPage />
          </RouteFeatureGuard>
        } />
        <Route path="/knowledge" element={
          <RouteFeatureGuard feature="knowledge.base">
            <Pages.KnowledgeBasePage />
          </RouteFeatureGuard>
        } />
        <Route path="/knowledge/:id" element={
          <RouteFeatureGuard feature="knowledge.base">
            <Pages.KnowledgeBasePage />
          </RouteFeatureGuard>
        } />
        <Route path="/knowledge/entity/:id" element={
          <RouteFeatureGuard feature="knowledge.base">
            <Pages.KnowledgeBasePage />
          </RouteFeatureGuard>
        } />
        <Route path="/sgis" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminKnowledgePage defaultTab="sgis" />
          </ProtectedRoute>
        } />
        <Route path="/sgis/manuscript/:id" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminKnowledgePage defaultTab="sgis" />
          </ProtectedRoute>
        } />
        <Route path="/admin/sgis" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminKnowledgePage defaultTab="sgis" />
          </ProtectedRoute>
        } />
        <Route path="/admin/sgis/review/:id" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminKnowledgePage defaultTab="sgis" />
          </ProtectedRoute>
        } />
        <Route path="/storylines" element={<Pages.StorylinesPage />} />
        <Route path="/story-evolution" element={<Navigate to="/storylines" replace />} />
        <Route path="/my-sanatan" element={<Pages.MySanatanPage />} />
        <Route path="/saved" element={<Pages.MySanatanPage />} />
        <Route path="/notifications" element={<Pages.MySanatanPage />} />
        <Route path="/digest" element={<Pages.DailyDigestPage />} />
        <Route path="/daily-briefing" element={<Navigate to="/digest" replace />} />

        {/* Sanatan Blog Routes */}
        <Route path="/blog" element={
          <RouteFeatureGuard feature="blog.main">
            <Pages.BlogHomePage />
          </RouteFeatureGuard>
        } />
        <Route path="/blog/:slug" element={
          <RouteFeatureGuard feature="blog.main">
            <Pages.BlogPostPage />
          </RouteFeatureGuard>
        } />
        <Route path="/blog/category/:slug" element={
          <RouteFeatureGuard feature="blog.main">
            <Pages.BlogCategoryPage />
          </RouteFeatureGuard>
        } />
        <Route path="/blog/series/:slug" element={
          <RouteFeatureGuard feature="blog.main">
            <Pages.BlogSeriesPage />
          </RouteFeatureGuard>
        } />
        <Route path="/blog/tag/:tag" element={
          <RouteFeatureGuard feature="blog.main">
            <Pages.BlogTagPage />
          </RouteFeatureGuard>
        } />
        <Route path="/blog/author/:authorId" element={
          <RouteFeatureGuard feature="blog.main">
            <Pages.BlogAuthorPage />
          </RouteFeatureGuard>
        } />
        <Route path="/admin/blog" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminBlog />
          </ProtectedRoute>
        } />

        <Route path="/category/:slug" element={<Pages.CategoryPage />} />
        <Route path="/article/:id" element={<Pages.ArticlePage />} />
        <Route path="/district/:districtName" element={<Pages.DistrictPage />} />
        <Route path="/search" element={<Pages.SearchPage />} />
        <Route path="/admin/newsroom" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminEditor />
          </ProtectedRoute>
        } />
        <Route path="/admin/audit" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminGovernancePage />
          </ProtectedRoute>
        } />
        <Route path="/news" element={<Pages.LatestNewsPage />} />
        <Route path="/discover" element={
          <RouteFeatureGuard feature="knowledge.base">
            <Pages.KnowledgeBasePage />
          </RouteFeatureGuard>
        } />
        <Route path="/verify/:certId" element={
          <RouteFeatureGuard feature="training.certification">
            <Pages.CertificateVerificationPage />
          </RouteFeatureGuard>
        } />
        <Route path="/trending" element={<Pages.TrendingPage />} />
        <Route path="/latest" element={<Pages.LatestNewsPage />} />
        <Route path="/live" element={
          <RouteFeatureGuard feature="media.live">
            <Pages.LivePage />
          </RouteFeatureGuard>
        } />
        <Route path="/live/:videoId" element={
          <RouteFeatureGuard feature="media.live">
            <Pages.LivePage />
          </RouteFeatureGuard>
        } />
        <Route path="/admin/live" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminLive />
          </ProtectedRoute>
        } />
        <Route path="/about" element={<Pages.AboutPage />} />
        <Route path="/contact" element={<Pages.ContactPage />} />
        <Route path="/profile" element={<Pages.ProfilePage />} />
        <Route path="/profile/:uid" element={<Pages.ProfilePage />} />
        <Route path="/dashboard" element={<Pages.ProfilePage />} />
        <Route path="/member-center" element={<Pages.ProfilePage />} />
        <Route path="/terms" element={<Pages.TermsPage />} />
        <Route path="/privacy" element={<Pages.PrivacyPage />} />
        <Route path="/download" element={<Pages.DownloadPage />} />
        <Route path="/advertiser" element={<Pages.AdvertiserDashboard />} />
        <Route path="/advertiser/dashboard" element={<Pages.AdvertiserDashboard />} />
        <Route path="/analytics" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AnalyticsOSDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AnalyticsOSDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/seo-os" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <Pages.AdminSeoOS />
          </ProtectedRoute>
        } />
        <Route path="/organization" element={<Pages.OrganizationDashboard />} />
        <Route path="/organization/dashboard" element={<Pages.OrganizationDashboard />} />
        <Route path="/target-unavailable" element={<Pages.TargetUnavailablePage />} />
        <Route path="/api-test" element={<Pages.ApiTestPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
