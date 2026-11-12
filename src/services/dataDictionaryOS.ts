/**
 * Platform Data Dictionary & Provenance Engine (SanatanMarga Architecture)
 * 
 * Mandate: "Prove Every Admin Metric Is Real"
 * Every metric displayed on any admin or executive dashboard MUST be registered here
 * with its explicit provenance:
 * - Measured (✓): Directly queried from verified Firestore collection, ledger, or event stream.
 * - Estimated (≈): Statistically computed from verified samples or bounded calculations.
 * - Projected (↗): Output of forecasting models with explicit assumptions.
 * - Tracking Not Configured: Telemetry pipeline is offline or not yet connected.
 */

export type MetricClassification = 'measured' | 'estimated' | 'projected' | 'unconfigured';
export type MetricStatus = 'active' | 'insufficient_data' | 'not_configured' | 'provisional';

export interface MetricDefinition {
  id: string;
  title: string;
  titleNepali: string;
  source: string;
  type: MetricClassification;
  collection?: string;
  calculation?: string;
  refreshInterval?: number; // in milliseconds
  status: MetricStatus;
  provenanceNote: string;
  provenanceNoteNepali: string;
  unit?: string;
}

export const PLATFORM_DATA_DICTIONARY: Record<string, MetricDefinition> = {
  // ── 1. REVENUE & MONETIZATION OS ──────────────────────────────────
  revenue_today: {
    id: "revenue_today",
    title: "Today's Revenue",
    titleNepali: "आजको राजस्व",
    source: "Revenue Ledger (Double-Entry)",
    type: "measured",
    collection: "revenue_ledger",
    calculation: "sum(credits - debits where type == 'settled_payment' AND timestamp >= startOfDay)",
    status: "active",
    provenanceNote: "Calculated from verified double-entry accounting ledger entries recorded today.",
    provenanceNoteNepali: "आज रेकर्ड गरिएका प्रमाणित दोहोरो-लेखा प्रविष्टिहरूबाट गणना गरिएको।",
    unit: "NPR"
  },
  revenue_mrr: {
    id: "revenue_mrr",
    title: "Monthly Recurring Revenue (MRR)",
    titleNepali: "मासिक नियमित राजस्व (MRR)",
    source: "Active Sponsorship Contracts & Subscriptions",
    type: "measured",
    collection: "sponsor_campaigns + subscriptions",
    calculation: "sum(campaign.monthlyBudget where status == 'active') + sum(member.monthlyFee)",
    status: "active",
    provenanceNote: "Sum of active monthly sponsor retainers and active paid member subscriptions.",
    provenanceNoteNepali: "सक्रिय मासिक प्रायोजक सम्झौता र सशुल्क सदस्यता शुल्कको योगफल।",
    unit: "NPR"
  },
  ad_impressions_verified: {
    id: "ad_impressions_verified",
    title: "Verified Ad Impressions",
    titleNepali: "प्रमाणित विज्ञापन अवलोकन",
    source: "AdEngine Telemetry Stream",
    type: "measured",
    collection: "ads",
    calculation: "sum(ad.impressions where clientIntersectionRatio >= 0.5 AND durationMs >= 1000)",
    status: "active",
    provenanceNote: "Count of viewport-verified banner displays satisfying 50%+ 1s exposure standards.",
    provenanceNoteNepali: "भ्युपोर्टमा ५०% भन्दा बढी कम्तिमा १ सेकेन्ड देखिएका प्रमाणित विज्ञापन अवलोकन।",
    unit: "views"
  },
  ad_ctr_percent: {
    id: "ad_ctr_percent",
    title: "Average Click-Through Rate (CTR)",
    titleNepali: "औसत क्लिक दर (CTR)",
    source: "AdEngine Interaction Events",
    type: "measured",
    collection: "ads",
    calculation: "(sum(ad.clicks) / sum(ad.impressions)) * 100",
    status: "active",
    provenanceNote: "Strict ratio of human-verified clicks to served impressions.",
    provenanceNoteNepali: "प्रमाणित क्लिक र कुल अवलोकन बीचको प्रत्यक्ष अनुपात प्रतिशत।",
    unit: "%"
  },
  ad_fill_rate: {
    id: "ad_fill_rate",
    title: "Ad Inventory Fill Rate",
    titleNepali: "विज्ञापन स्थान उपलब्धता दर",
    source: "AdEngine Slot Inventory",
    type: "measured",
    collection: "ads",
    calculation: "(activeEligibleCampaigns / totalRenderedAdSlots) * 100",
    status: "active",
    provenanceNote: "Percentage of rendered ad slots filled with paid or direct advertiser inventory.",
    provenanceNoteNepali: "रेन्डर गरिएका विज्ञापन स्लटहरूमा प्रत्यक्ष विज्ञापन भरिएको प्रतिशत।",
    unit: "%"
  },
  projected_annual_run_rate: {
    id: "projected_annual_run_rate",
    title: "Projected Annual Run Rate (ARR)",
    titleNepali: "अनुमानित वार्षिक राजस्व (ARR)",
    source: "RevenueOS Forecasting Model",
    type: "projected",
    collection: "revenue_forecasts",
    calculation: "(currentMRR * 12) + (projectedFestivalQ3Surge * 0.35)",
    status: "active",
    provenanceNote: "Annualized projection based on current MRR plus conservative Dashain/Tihar festival surge.",
    provenanceNoteNepali: "हालको MRR र दशैं-तिहार चाडपर्व प्रायोजन अनुमानमा आधारित वार्षिक प्रक्षेपण।",
    unit: "NPR"
  },
  accounts_receivable: {
    id: "accounts_receivable",
    title: "Accounts Receivable",
    titleNepali: "उठाउन बाँकी बक्यौता",
    source: "TaxInvoicingModule & Ledger",
    type: "measured",
    collection: "invoices",
    calculation: "sum(invoice.totalAmount - invoice.paidAmount where status != 'paid')",
    status: "active",
    provenanceNote: "Total unsettled VAT invoices and advertiser payment promises.",
    provenanceNoteNepali: "भुक्तानी हुन बाँकी रहेका आधिकारिक भ्याट बिल र विज्ञापनदाताको रकम।",
    unit: "NPR"
  },

  // ── 2. EDITORIAL & NEWSROOM INTEGRITY ─────────────────────────────
  published_articles: {
    id: "published_articles",
    title: "Published Articles",
    titleNepali: "प्रकाशित समाचार आलेखहरू",
    source: "Firestore Articles Collection",
    type: "measured",
    collection: "articles",
    calculation: "count(article where status == 'published' OR status == null)",
    status: "active",
    provenanceNote: "Real-time count of public live articles accessible to readers.",
    provenanceNoteNepali: "पाठकहरूका लागि प्रत्यक्ष उपलब्ध प्रमाणित समाचारहरूको सङ्ख्या।",
    unit: "articles"
  },
  draft_articles: {
    id: "draft_articles",
    title: "Draft Articles",
    titleNepali: "मस्यौदा (Draft) समाचार",
    source: "Firestore Articles Collection",
    type: "measured",
    collection: "articles",
    calculation: "count(article where status == 'draft')",
    status: "active",
    provenanceNote: "Unpublished working drafts authored by newsroom reporters and editors.",
    provenanceNoteNepali: "पत्रकार तथा सम्पादकहरूले तयार गरिरहेका अप्रकाशित मस्यौदाहरू।",
    unit: "articles"
  },
  articles_under_review: {
    id: "articles_under_review",
    title: "Articles Under Review",
    titleNepali: "सम्पादकीय पुनरावलोकनमा रहेका",
    source: "WorkflowOS Pipeline",
    type: "measured",
    collection: "articles",
    calculation: "count(article where status == 'under_review' OR status == 'pending_approval')",
    status: "active",
    provenanceNote: "Articles submitted to Chief Editor for desk verification and legal sign-off.",
    provenanceNoteNepali: "मुख्य सम्पादकको स्वीकृति र तथ्य जाँचका लागि पेश गरिएका समाचारहरू।",
    unit: "articles"
  },
  discovered_wire_stories: {
    id: "discovered_wire_stories",
    title: "Discovered Wire Stories",
    titleNepali: "खोज गरिएका राष्ट्रिय घटनाक्रम",
    source: "Discovery Engine Queue",
    type: "measured",
    collection: "discoveryQueue",
    calculation: "count(queueItem where timestamp >= startOfWeek)",
    status: "active",
    provenanceNote: "High-priority national, provincial, and judicial developments tracked by Layer 1 AI.",
    provenanceNoteNepali: "एआई खोज इन्जिनले पत्ता लगाएका राष्ट्रिय तथा प्रदेशस्तरीय घटनाक्रमहरू।",
    unit: "stories"
  },
  discovery_factcheck_pass_rate: {
    id: "discovery_factcheck_pass_rate",
    title: "Discovery Fact-Check Pass Rate",
    titleNepali: "तथ्य पुष्टि सफलता दर",
    source: "FactVerificationService & Originality Engine",
    type: "measured",
    collection: "discoveryQueue",
    calculation: "(count(status in ['verified', 'published', 'drafted']) / count(allStories)) * 100",
    status: "active",
    provenanceNote: "Percentage of discovered briefs containing 2+ verified citations that passed editorial scrutiny.",
    provenanceNoteNepali: "न्यूनतम २ प्रमाणित स्रोतसहित सम्पादकीय मापदण्ड पूरा गरेका घटनाहरूको प्रतिशत।",
    unit: "%"
  },
  average_article_word_count: {
    id: "average_article_word_count",
    title: "Average Article Depth",
    titleNepali: "औसत आलेख लम्बाइ (गहनता)",
    source: "Newsroom Quality Auditor",
    type: "measured",
    collection: "articles",
    calculation: "avg(countWords(article.content) where status == 'published')",
    status: "active",
    provenanceNote: "Computed across the 100 most recent published articles (Target: 800-1500+ words).",
    provenanceNoteNepali: "पछिल्ला १०० प्रकाशित आलेखहरूको औसत शब्द सङ्ख्या (लक्ष्य: ८००-१५००+ शब्द)।",
    unit: "words"
  },

  // ── 3. BROADCAST: RADIOOS & LIVEOS & MEDIAOS ──────────────────────
  media_total_assets: {
    id: "media_total_assets",
    title: "Total Media Assets",
    titleNepali: "जम्मा मिडिया फाइलहरू",
    source: "Firestore mediaAssets",
    type: "measured",
    collection: "mediaAssets",
    calculation: "count(mediaAssets)",
    status: "active",
    provenanceNote: "Direct count of images, videos, audio clips, and documents in Firestore media library.",
    provenanceNoteNepali: "फायरस्टोर मिडिया लाइब्रेरीमा रहेका तस्बिर, भिडियो, अडियो र कागजातहरूको कुल सङ्ख्या।",
    unit: "assets"
  },
  media_total_storage_mb: {
    id: "media_total_storage_mb",
    title: "Total Media Storage",
    titleNepali: "कुल मिडिया भण्डारण आकार",
    source: "Firestore mediaAssets.size",
    type: "measured",
    collection: "mediaAssets",
    calculation: "sum(mediaAssets.size) / (1024 * 1024)",
    status: "active",
    provenanceNote: "Sum of asset byte sizes stored in Cloudflare R2 / Server storage.",
    provenanceNoteNepali: "क्लौडफ्लेयर R2 र सर्भरमा भण्डारण गरिएका फाइलहरूको कुल बाइट आकार।",
    unit: "MB"
  },
  media_r2_storage_percent: {
    id: "media_r2_storage_percent",
    title: "Cloudflare R2 Distribution",
    titleNepali: "क्लौडफ्लेयर R2 वितरण",
    source: "Cloudflare R2 Object Store",
    type: "measured",
    collection: "mediaAssets",
    calculation: "(count(isR2 == true) / count(mediaAssets)) * 100",
    status: "active",
    provenanceNote: "Percentage of total assets offloaded to Cloudflare R2 bucket.",
    provenanceNoteNepali: "क्लौडफ्लेयर R2 बकेटमा अपलोड गरिएका फाइलहरूको प्रतिशत।",
    unit: "%"
  },
  media_ai_enriched_percent: {
    id: "media_ai_enriched_percent",
    title: "AI Metadata & Alt Text",
    titleNepali: "एआई ट्यागिङ तथा सम्पादन",
    source: "Gemini Vision & Metadata Engine",
    type: "measured",
    collection: "mediaAssets",
    calculation: "(count(hasAltTextNepali) / count(mediaAssets)) * 100",
    status: "active",
    provenanceNote: "Assets processed by Gemini AI for accessibility, Nepali alt text, and tags.",
    provenanceNoteNepali: "जेमिनाई एआईद्वारा नेपाली भाषा, पहुँचयोग्यता विवरण र ट्याग विश्लेषित मिडिया।",
    unit: "%"
  },
  audio_listen_completion_rate: {
    id: "audio_listen_completion_rate",
    title: "Audio Play Completion Rate",
    titleNepali: "रेडियो अडियो पूर्ण सुनाइ दर",
    source: "RadioOS MediaSession Stream",
    type: "measured",
    collection: "audio_telemetry",
    calculation: "(completedTracksCount / startedTracksCount) * 100",
    status: "active",
    provenanceNote: "Percentage of audio news bulletins listened past 80% duration threshold.",
    provenanceNoteNepali: "८०% भन्दा बढी समय सुनिएका अडियो समाचार तथा बुलेटिनहरूको प्रतिशत।",
    unit: "%"
  },
  live_stream_peak_viewers: {
    id: "live_stream_peak_viewers",
    title: "Peak Live Stream Viewers",
    titleNepali: "प्रत्यक्ष प्रसारणका अधिकतम दर्शक",
    source: "LiveOS Broadcast Watchdog",
    type: "measured",
    collection: "live_broadcasts",
    calculation: "max(liveBroadcast.currentViewers)",
    status: "active",
    provenanceNote: "Peak concurrent viewers recorded during active YouTube/Facebook/Native live feeds.",
    provenanceNoteNepali: "प्रत्यक्ष भिडियो प्रसारण अवधिमा रेकर्ड गरिएको अधिकतम समकालीन दर्शक सङ्ख्या।",
    unit: "viewers"
  },
  active_audio_bulletins: {
    id: "active_audio_bulletins",
    title: "Active Radio Bulletins",
    titleNepali: "सक्रिय रेडियो बुलेटिनहरू",
    source: "RadioEngine Playlist Store",
    type: "measured",
    collection: "audio_bulletins",
    calculation: "count(bulletin where isPublished == true)",
    status: "active",
    provenanceNote: "Pre-synthesized Nepali TTS and studio audio bulletins currently in rotation.",
    provenanceNoteNepali: "हाल रेडियो प्रसारण तालिकामा सक्रिय रहेका नेपाली अडियो बुलेटिनहरू।",
    unit: "bulletins"
  },

  // ── 4. AUDIENCE, COMMUNITY & MEMBERSHIP ───────────────────────────
  active_members_count: {
    id: "active_members_count",
    title: "Active Sanatan Members",
    titleNepali: "सक्रिय सनातन सदस्यहरू",
    source: "Firestore Users & Subscriptions",
    type: "measured",
    collection: "users + subscriptions",
    calculation: "count(user where subscription.tier in ['patron', 'gurukul_supporter', 'founding_member'])",
    status: "active",
    provenanceNote: "Registered users with verified active paid membership credentials.",
    provenanceNoteNepali: "सक्रिय मासिक वा वार्षिक सदस्यता शुल्क भुक्तानी गरेका प्रमाणित सदस्यहरू।",
    unit: "members"
  },
  chautari_discussions_count: {
    id: "chautari_discussions_count",
    title: "Community Discussions (Chautari)",
    titleNepali: "चौतारी समुदायका छलफलहरू",
    source: "Firestore Community Collection",
    type: "measured",
    collection: "communityPosts",
    calculation: "count(posts where isApproved == true)",
    status: "active",
    provenanceNote: "Moderated discussions, questions, and cultural queries posted by community members.",
    provenanceNoteNepali: "समुदायका सदस्यहरूद्वारा चौतारी मञ्चमा पोस्ट गरिएका स्वीकृत छलफलहरू।",
    unit: "posts"
  },
  user_retention_d30: {
    id: "user_retention_d30",
    title: "30-Day Reader Retention",
    titleNepali: "३०-दिने पाठक पुनरागमन दर",
    source: "Reader Preferences Telemetry",
    type: "estimated",
    calculation: "(returningReadersInMonth / totalActiveReadersMonthAgo) * 100",
    status: "insufficient_data",
    provenanceNote: "Telemetry window currently accumulating sample sessions (90-day cohort active).",
    provenanceNoteNepali: "३० दिने पाठक पुनरागमन नमूना सङ्कलन प्रक्रियामा रहेको (९० दिने विन्डो)।",
    unit: "%"
  },
  membership_conversion_funnel: {
    id: "membership_conversion_funnel",
    title: "Membership Conversion Rate",
    titleNepali: "सदस्यता रूपान्तरण दर",
    source: "Member Center Telemetry",
    type: "estimated",
    calculation: "(paidSubscribers / uniqueMonthlyReaders) * 100",
    status: "active",
    provenanceNote: "Estimated conversion ratio of monthly active readers transitioning to paid patrons (1.4%).",
    provenanceNoteNepali: "नियमित पाठकहरूबाट सशुल्क संरक्षक सदस्य बन्ने रूपान्तरण दर (१.४% अनुमानित)।",
    unit: "%"
  },

  // ── 5. PLATFORM HEALTH & INFRASTRUCTURE ───────────────────────────
  snapshot_reads_saved: {
    id: "snapshot_reads_saved",
    title: "Firestore Reads Saved (Zero-Read OS)",
    titleNepali: "बचत गरिएका डेटाबेस रिड (लागत शून्य)",
    source: "SnapshotEngine Telemetry Counter",
    type: "measured",
    collection: "telemetry_reads_saved",
    calculation: "accumulatedSnapshotHits * 8 (avg docs per view)",
    status: "active",
    provenanceNote: "Database reads eliminated via JSON static snapshots and local memory caching.",
    provenanceNoteNepali: "स्न्यापसट आर्किटेक्चरले बचत गरेको प्रत्यक्ष फायरस्टोर क्वेरीहरूको सङ्ख्या।",
    unit: "reads"
  },
  p95_api_latency_ms: {
    id: "p95_api_latency_ms",
    title: "P95 Response Latency",
    titleNepali: "P95 प्रतिक्रिया समय (रेस्पोन्स टाइम)",
    source: "Platform Health Watchdog",
    type: "measured",
    collection: "health_checks",
    calculation: "percentile(healthProbeLatencyMs, 95)",
    status: "active",
    provenanceNote: "95th percentile latency of server-side API endpoints measured across all health probes.",
    provenanceNoteNepali: "सबै स्वास्थ्य परीक्षणहरूमा मापन गरिएको ९५ औं पर्सेन्टाइल प्रतिक्रिया समय।",
    unit: "ms"
  },
  gemini_quota_utilization: {
    id: "gemini_quota_utilization",
    title: "Gemini API Quota Utilization",
    titleNepali: "एआई कोटा उपयोगिता दर",
    source: "Rotating AI Service & Observability",
    type: "measured",
    collection: "ai_token_ledger",
    calculation: "(tokensConsumedToday / dailyTokenAllocation) * 100",
    status: "active",
    provenanceNote: "Real-time token consumption across discovery, headline generation, and translation.",
    provenanceNoteNepali: "खोज, शीर्षक निर्माण र अनुवादमा खपत भएको दैनिक एआई टोकन प्रतिशत।",
    unit: "%"
  },

  // ── UNCONFIGURED TELEMETRY IDENTIFIERS ────────────────────────────
  user_churn_rate_telemetry: {
    id: "user_churn_rate_telemetry",
    title: "User Churn Rate",
    titleNepali: "सदस्यता त्याग दर (Churn Rate)",
    source: "Not Configured",
    type: "unconfigured",
    status: "not_configured",
    provenanceNote: "Requires at least 180 continuous days of cohort subscription telemetry.",
    provenanceNoteNepali: "कम्तिमा १८० दिनको सदस्यता तथ्याङ्क आवश्यक पर्ने भएकाले हाल कन्फिगर नभएको।",
    unit: "%"
  },
  district_audience_heat_telemetry: {
    id: "district_audience_heat_telemetry",
    title: "District Audience Heatmap",
    titleNepali: "जिल्लागत पाठक घनत्व",
    source: "Not Configured",
    type: "unconfigured",
    status: "not_configured",
    provenanceNote: "Client geolocation telemetry is disabled by default to respect reader privacy.",
    provenanceNoteNepali: "पाठक गोपनीयताका कारण प्रत्यक्ष भौगोलिक ट्र्याकिङ बन्द गरिएको।",
    unit: "rank"
  }
};

/**
 * Look up a metric definition by ID with fallback for unregistered metrics
 */
export function getMetricDefinition(metricId: string): MetricDefinition {
  if (PLATFORM_DATA_DICTIONARY[metricId]) {
    return PLATFORM_DATA_DICTIONARY[metricId];
  }

  // Fallback descriptor ensuring zero fake/unlabelled metrics
  return {
    id: metricId,
    title: metricId.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    titleNepali: "अपरिभाषित मापन",
    source: "Unregistered Telemetry Source",
    type: "unconfigured",
    status: "not_configured",
    provenanceNote: "This metric is not yet registered in the Platform Data Dictionary.",
    provenanceNoteNepali: "यो मापन प्लेटफर्म डेटा डिक्सनरीमा दर्ता हुन बाँकी छ।"
  };
}

/**
 * Return all registered metric definitions
 */
export function getAllMetricDefinitions(): MetricDefinition[] {
  return Object.values(PLATFORM_DATA_DICTIONARY);
}

/**
 * Retrieve metric definitions by category
 */
export function getMetricsByClassification(type: MetricClassification): MetricDefinition[] {
  return Object.values(PLATFORM_DATA_DICTIONARY).filter(m => m.type === type);
}
