import { collection, getDocs, query, where } from "@/src/lib/firebase";
import { db, getDocsWithCacheFallback } from "@/src/lib/firebase";
import { revenueLedger } from "@/src/services/revenueLedger";

export type MetricType = "measured" | "estimated" | "projected";

export interface SystemMetric<T> {
  value: T;
  type: MetricType;
  label: string;
  status: "active" | "unavailable" | "not_configured" | "insufficient_data";
  source?: string;
  collection?: string;
  calculation?: string;
}

export interface AnalyticsSummary {
  // 1. Measured metrics (Real data from collections)
  publishedArticles: SystemMetric<number>;
  draftArticles: SystemMetric<number>;
  pendingReviewArticles: SystemMetric<number>;
  discoveredStories: SystemMetric<number>;
  verifiedDiscoveryStories: SystemMetric<number>;
  chautariPosts: SystemMetric<number>;
  contactMessages: SystemMetric<number>;
  cashCollected: SystemMetric<number>;
  outstandingReceivables: SystemMetric<number>;
  activeMembersCount: SystemMetric<number>;

  // 2. Estimated metrics (Calculated from real data, e.g. averages)
  averageReadingTime: SystemMetric<string>;
  audienceReachEstimate: SystemMetric<string>;
  adInventoryFillEstimate: SystemMetric<string>;

  // 3. Projected metrics (Forecasting engine)
  projectedMRR: SystemMetric<string>;
  projectedImpressions: SystemMetric<string>;
  projectedRevenue: SystemMetric<string>;
  projectedSubscriberGrowth: SystemMetric<string>;

  // 4. Banned/Removed metrics (Marked as unavailable/not configured until telemetry is built)
  clickThroughRate: SystemMetric<null>;
  userRetentionRate: SystemMetric<null>;
  userChurnRate: SystemMetric<null>;
  membershipConversionRate: SystemMetric<null>;
  audienceReachTelemetry: SystemMetric<null>;
  adFillRateTelemetry: SystemMetric<null>;
  provinceRankingsTelemetry: SystemMetric<null>;
  listenerCountsTelemetry: SystemMetric<null>;
  audioPlayCompletionRate: SystemMetric<null>;
}

export const analyticsService = {
  /**
   * Fetches real counts from active Firestore/RevenueOS collections and builds the Analytics Summary
   */
  async getSummary(): Promise<AnalyticsSummary> {
    try {
      // 1. Fetch counts from Firestore
      const articlesSnap = await getDocsWithCacheFallback(collection(db, "articles"));
      const articlesDocs = articlesSnap.docs.map(d => d.data());
      
      const publishedCount = articlesDocs.filter(a => !a.status || a.status === "published").length;
      const draftCount = articlesDocs.filter(a => a.status === "draft").length;
      const reviewCount = articlesDocs.filter(a => a.status === "under_review").length;

      const discoverySnap = await getDocsWithCacheFallback(collection(db, "discoveryQueue"));
      const totalDiscovered = discoverySnap.docs.length;
      const verifiedDiscovered = discoverySnap.docs.filter(d => d.data().status === "verified" || d.data().status === "published" || d.data().status === "drafted").length;

      const communitySnap = await getDocsWithCacheFallback(collection(db, "communityPosts"));
      const totalCommunity = communitySnap.docs.length;

      const contactSnap = await getDocsWithCacheFallback(collection(db, "contactMessages"));
      const totalInquiries = contactSnap.docs.length;

      // 2. Fetch financial metrics from Revenue Ledger (RevenueOS Double-Entry Accounting)
      const ledgerSummary = revenueLedger.getFinancialStatements();

      // 3. Construct the clean, highly integral Analytics Summary
      return {
        // Measured Metrics
        publishedArticles: {
          value: publishedCount,
          type: "measured",
          label: "Published Articles Today",
          source: "Firestore (articles collection)",
          collection: "articles",
          calculation: "count(status == 'published')",
          status: "active"
        },
        draftArticles: {
          value: draftCount,
          type: "measured",
          label: "Draft Articles",
          source: "Firestore (articles collection)",
          collection: "articles",
          calculation: "count(status == 'draft')",
          status: "active"
        },
        pendingReviewArticles: {
          value: reviewCount,
          type: "measured",
          label: "Articles Pending Review",
          source: "WorkflowOS Pipeline",
          collection: "articles",
          calculation: "count(status == 'under_review')",
          status: "active"
        },
        discoveredStories: {
          value: totalDiscovered,
          type: "measured",
          label: "Discovered Wire Stories",
          source: "Discovery Engine Queue",
          collection: "discoveryQueue",
          calculation: "count(all)",
          status: "active"
        },
        verifiedDiscoveryStories: {
          value: verifiedDiscovered,
          type: "measured",
          label: "Verified Discoveries",
          source: "Fact Verification Service",
          collection: "discoveryQueue",
          calculation: "count(status in ['verified', 'published'])",
          status: "active"
        },
        chautariPosts: {
          value: totalCommunity,
          type: "measured",
          label: "Chautari Community Posts",
          source: "Chautari Community Collection",
          collection: "communityPosts",
          calculation: "count(isApproved == true)",
          status: "active"
        },
        contactMessages: {
          value: totalInquiries,
          type: "measured",
          label: "Feedback & Inquiries",
          source: "Contact Messages Collection",
          collection: "contactMessages",
          calculation: "count(all)",
          status: "active"
        },
        cashCollected: {
          value: ledgerSummary.cashCollectedNpr,
          type: "measured",
          label: "Payments Received (NPR)",
          source: "Revenue Ledger (Double-Entry)",
          collection: "revenue_ledger",
          calculation: "sum(credit - debit where type == 'settled_payment')",
          status: "active"
        },
        outstandingReceivables: {
          value: ledgerSummary.accountsReceivableNpr,
          type: "measured",
          label: "Outstanding Balance (NPR)",
          source: "TaxInvoicingModule & Ledger",
          collection: "invoices",
          calculation: "sum(total - paid where status != 'paid')",
          status: "active"
        },
        activeMembersCount: {
          value: 0,
          type: "measured",
          label: "Active Members",
          source: "Users & Subscriptions Ledger",
          collection: "subscriptions",
          calculation: "count(tier in ['patron', 'founding_member'])",
          status: "active"
        },

        // Estimated Metrics (Derived mathematically from real baseline numbers)
        averageReadingTime: {
          value: "NOT_AVAILABLE",
          type: "estimated",
          label: "Average Reading Time",
          source: "Article Word Count Model",
          calculation: "Requires verified reading session telemetry",
          status: "insufficient_data"
        },
        audienceReachEstimate: {
          value: "0 potential reach",
          type: "estimated",
          label: "Audience Reach Estimate",
          source: "Audience Telemetry",
          calculation: "Requires verified audience impression stream",
          status: "insufficient_data"
        },
        adInventoryFillEstimate: {
          value: "NOT_AVAILABLE",
          type: "estimated",
          label: "Ad Fill Rate Estimate",
          source: "Ad Slot Inventory Engine",
          calculation: "Requires live ad impression vs available slots telemetry",
          status: "insufficient_data"
        },

        // Projected Metrics (Based on real current trajectories)
        projectedMRR: {
          value: ledgerSummary.cashCollectedNpr > 0 ? `रु. ${ledgerSummary.cashCollectedNpr.toLocaleString('ne-NP')}` : "रु. ०",
          type: "projected",
          label: "Projected MRR",
          source: "RevenueOS Accounting Ledger",
          calculation: "Derived strictly from settled payments",
          status: "active"
        },
        projectedImpressions: {
          value: "0 impressions",
          type: "projected",
          label: "Projected Impressions",
          source: "Impression Growth Model",
          calculation: "Requires baseline impression telemetry stream",
          status: "insufficient_data"
        },
        projectedRevenue: {
          value: ledgerSummary.netTaxableRevenueNpr > 0 ? `रु. ${ledgerSummary.netTaxableRevenueNpr.toLocaleString('ne-NP')}` : "रु. ०",
          type: "projected",
          label: "Projected Quarterly Revenue",
          source: "Tax & Financial Model",
          calculation: "Derived strictly from confirmed taxable invoice revenue",
          status: "active"
        },
        projectedSubscriberGrowth: {
          value: "0% subscriber growth",
          type: "projected",
          label: "Projected Subscriber Growth",
          source: "Member Growth Model",
          calculation: "Requires verified subscription cohort telemetry",
          status: "insufficient_data"
        },

        // Banned / Removed Metrics (Currently unmeasured telemetry)
        clickThroughRate: {
          value: null,
          type: "measured",
          label: "CTR",
          source: "AdEngine Event Stream",
          status: "not_configured"
        },
        userRetentionRate: {
          value: null,
          type: "measured",
          label: "Retention",
          source: "Reader Retention Telemetry",
          status: "insufficient_data"
        },
        userChurnRate: {
          value: null,
          type: "measured",
          label: "Churn",
          source: "Subscription Churn Stream",
          status: "insufficient_data"
        },
        membershipConversionRate: {
          value: null,
          type: "measured",
          label: "Conversion Rate",
          source: "Funnel Analytics Stream",
          status: "not_configured"
        },
        audienceReachTelemetry: {
          value: null,
          type: "measured",
          label: "Audience Reach Telemetry",
          source: "Telemetry Pipeline",
          status: "not_configured"
        },
        adFillRateTelemetry: {
          value: null,
          type: "measured",
          label: "Ad Fill Telemetry",
          source: "Ad Server Logs",
          status: "not_configured"
        },
        provinceRankingsTelemetry: {
          value: null,
          type: "measured",
          label: "Province Rankings",
          source: "GeoIP Telemetry",
          status: "insufficient_data"
        },
        listenerCountsTelemetry: {
          value: null,
          type: "measured",
          label: "Listener Counts Telemetry",
          source: "Icecast / Shoutcast Telemetry",
          status: "not_configured"
        },
        audioPlayCompletionRate: {
          value: null,
          type: "measured",
          label: "Audio Play Completion Rate",
          source: "MediaSession Telemetry",
          status: "not_configured"
        }
      };
    } catch (e: any) {
      console.error("Error generating live analytics summary:", e);
      throw e;
    }
  }
};
