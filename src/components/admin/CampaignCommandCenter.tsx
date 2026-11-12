import { useState, useEffect } from "react";
import { Ad, AdStatus, CampaignCheckItem } from "@/src/types";
import { adEngine } from "@/src/services/adEngine";
import { adDeliveryEventStore } from "@/src/services/adDeliveryEventStore";
import { billingEngine } from "@/src/services/billingEngine";
import { 
  ArrowLeft, 
  BarChart3, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  Calendar, 
  Target, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  FileText,
  TrendingUp,
  Smartphone,
  Monitor,
  Tablet,
  Printer
} from "lucide-react";
import { toast } from "sonner";

interface CampaignCommandCenterProps {
  campaign: Ad;
  onBack: () => void;
  onUpdateStatus?: (newStatus: AdStatus) => void;
}

export default function CampaignCommandCenter({ campaign, onBack, onUpdateStatus }: CampaignCommandCenterProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "performance" | "financials" | "governance" | "audit">("overview");

  // Verified Analytics & Financials
  const analytics = adDeliveryEventStore.getCampaignAnalytics(campaign);

  // Invoices & Payments for this campaign
  const campaignInvoices = billingEngine.getInvoices().filter(i => i.campaignId === campaign.id || i.campaignTitle === campaign.title);
  const invoicedTotal = campaignInvoices.reduce((sum, i) => sum + i.totalPayableNpr, 0);
  const paidTotal = campaignInvoices.filter(i => i.status === "PAID").reduce((sum, i) => sum + i.totalPayableNpr, 0);

  const financials = adDeliveryEventStore.calculateCampaignFinancials(campaign, invoicedTotal, paidTotal);
  const validation = adEngine.validateCampaign(campaign);

  const formatNpr = (val: number) => `रु ${Math.round(val || 0).toLocaleString("ne-NP")}`;

  const getStatusBadge = (st?: AdStatus) => {
    switch (st) {
      case "active":
        return <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> सक्रिय (Active)</span>;
      case "scheduled":
        return <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 text-xs font-black flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> तालिकाबद्ध (Scheduled)</span>;
      case "pending_review":
        return <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-black flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> समीक्षा प्रतिक्षा (Pending)</span>;
      case "paused":
        return <span className="px-3 py-1 rounded-full bg-orange-500/15 text-orange-700 dark:text-orange-300 text-xs font-black flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> रोकिएको (Paused)</span>;
      case "draft":
        return <span className="px-3 py-1 rounded-full bg-gray-500/15 text-gray-700 dark:text-gray-300 text-xs font-black flex items-center gap-1.5">मस्यौदा (Draft)</span>;
      case "completed":
        return <span className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 text-xs font-black flex items-center gap-1.5">सम्पन्न (Completed)</span>;
      case "expired":
        return <span className="px-3 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 text-xs font-black flex items-center gap-1.5">समाप्त (Expired)</span>;
      case "rejected":
        return <span className="px-3 py-1 rounded-full bg-red-500/15 text-red-700 dark:text-red-300 text-xs font-black flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> अस्वीकृत (Rejected)</span>;
      case "archived":
        return <span className="px-3 py-1 rounded-full bg-slate-500/15 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center gap-1.5">अभिलेख (Archived)</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-slate-500/15 text-slate-700 dark:text-slate-300 text-xs font-black">अज्ञात (Unknown)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border-theme shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2.5 rounded-xl hover:bg-muted-area text-foreground transition-colors border border-border-theme shrink-0"
            title="पछाडि फर्कनुहोस्"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xxs uppercase tracking-widest font-black text-rose-600 dark:text-rose-400">
                RevenueOS Command Center v3.0
              </span>
              <span className="text-muted-text text-xs">• ID: {campaign.id}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-foreground">
              {campaign.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {getStatusBadge(campaign.status)}
          
          {campaign.status === "pending_review" && onUpdateStatus && (
            <button
              onClick={() => onUpdateStatus("approved")}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>अभियान स्वीकृत गर्नुहोस्</span>
            </button>
          )}

          {campaign.status === "active" && onUpdateStatus && (
            <button
              onClick={() => onUpdateStatus("paused")}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span>अभियान रोक्नुहोस् (Pause)</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-border-theme overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === "overview" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-text hover:bg-muted-area"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>विवरण तथा स्थान</span>
        </button>

        <button
          onClick={() => setActiveTab("performance")}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === "performance" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-text hover:bg-muted-area"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>कार्यसम्पादन (Performance)</span>
        </button>

        <button
          onClick={() => setActiveTab("financials")}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === "financials" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-text hover:bg-muted-area"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>वित्तीय हिसाब (Revenue Ledger)</span>
        </button>

        <button
          onClick={() => setActiveTab("governance")}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === "governance" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-text hover:bg-muted-area"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>१०-विन्दु तत्परता जाँच ({validation.checks.filter(c => c.passed).length}/10)</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Creative Preview */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-5 rounded-2xl bg-card border border-border-theme shadow-xs space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>विज्ञापन क्रिएटिभ (Banner Preview)</span>
              </h3>
              
              <div className="relative aspect-video rounded-xl overflow-hidden border border-border-theme bg-muted-area/50">
                <img 
                  src={campaign.imageUrl} 
                  alt={campaign.title} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold backdrop-blur-md">
                  {campaign.position}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-text">
                  <span>गन्तव्य लिंक:</span>
                  <a 
                    href={campaign.linkUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 hover:underline truncate max-w-[180px]"
                  >
                    <span>{campaign.linkUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center justify-between text-muted-text">
                  <span>प्रायोजित सामग्री (Sponsored):</span>
                  <span className="font-bold text-foreground">{campaign.isSponsored ? "हो (Yes)" : "होइन (No)"}</span>
                </div>
                <div className="flex items-center justify-between text-muted-text">
                  <span>फ्रिक्वेन्सी क्याप:</span>
                  <span className="font-bold text-foreground">{campaign.frequencyCap ? `${campaign.frequencyCap} पटक / दिन` : "असीमित"}</span>
                </div>
              </div>
            </div>

            {/* Target Criteria */}
            <div className="p-5 rounded-2xl bg-card border border-border-theme shadow-xs space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-rose-500" />
                <span>लक्षित विन्यास (Targeting Rules)</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-muted-text block mb-1">लक्षित विधा (Categories):</span>
                  <div className="flex flex-wrap gap-1">
                    {campaign.targetCategories?.length ? campaign.targetCategories.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-muted-area text-foreground font-semibold">{c}</span>
                    )) : <span className="font-bold text-foreground">सबै विधा (All Categories)</span>}
                  </div>
                </div>

                <div>
                  <span className="text-muted-text block mb-1">लक्षित जिल्ला (Districts):</span>
                  <div className="flex flex-wrap gap-1">
                    {campaign.targetDistricts?.length ? campaign.targetDistricts.map((d, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-muted-area text-foreground font-semibold">{d}</span>
                    )) : <span className="font-bold text-foreground">सबै ७७ जिल्ला (All Districts)</span>}
                  </div>
                </div>

                <div>
                  <span className="text-muted-text block mb-1">लक्षित उपकरण (Devices):</span>
                  <div className="flex flex-wrap gap-1">
                    {campaign.targetDevices?.length ? campaign.targetDevices.map((dev, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-muted-area text-foreground font-semibold capitalize">{dev}</span>
                    )) : <span className="font-bold text-foreground">सबै उपकरणहरू</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details & Schedule */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-card border border-border-theme shadow-xs space-y-4">
              <h3 className="text-sm font-black text-foreground">अभियान र विज्ञापनदाता विवरण</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted-area/50 space-y-1">
                  <span className="text-xxs uppercase tracking-wider text-muted-text font-bold">विज्ञापनदाता (Advertiser)</span>
                  <p className="text-sm font-black text-foreground">{campaign.advertiserName || "Ncell Axiata Ltd."}</p>
                  <p className="text-xs text-muted-text">{campaign.advertiserContact || "contact@advertiser.com"}</p>
                </div>

                <div className="p-4 rounded-xl bg-muted-area/50 space-y-1">
                  <span className="text-xxs uppercase tracking-wider text-muted-text font-bold">समय तालिका (Schedule)</span>
                  <p className="text-xs font-bold text-foreground">
                    {campaign.startDate ? campaign.startDate.split("T")[0] : "तुरुन्तै"} देखि {campaign.endDate ? campaign.endDate.split("T")[0] : "अनिश्चित"} सम्म
                  </p>
                  <p className="text-xxs text-muted-text">समय क्षेत्र: Asia/Kathmandu (NPT)</p>
                </div>

                <div className="p-4 rounded-xl bg-muted-area/50 space-y-1">
                  <span className="text-xxs uppercase tracking-wider text-muted-text font-bold">प्राथमिकता र भार (Priority & Weight)</span>
                  <p className="text-sm font-black text-foreground">Priority: {campaign.priority || 5} • Weight: {campaign.weight || 5}</p>
                  <p className="text-xxs text-muted-text">रोटेसन सम्भाव्यता भार</p>
                </div>

                <div className="p-4 rounded-xl bg-muted-area/50 space-y-1">
                  <span className="text-xxs uppercase tracking-wider text-muted-text font-bold">प्राइसिङ मोडल (Pricing Model)</span>
                  <p className="text-sm font-black text-foreground capitalize">{campaign.budget?.pricingModel || "cpm"}</p>
                  <p className="text-xs text-muted-text">
                    {campaign.budget?.pricingModel === "cpm" ? `CPM Rate: रु ${campaign.budget?.cpmRate || 150} / 1000 Imp` : `CPC Rate: रु ${campaign.budget?.cpcRate || 20} / Click`}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border-theme shadow-xs space-y-1">
                <span className="text-xxs font-bold uppercase tracking-wider text-muted-text">कुल छाप (Impressions)</span>
                <p className="text-2xl font-black text-foreground">{analytics.impressions.toLocaleString()}</p>
                <span className="text-xxs text-emerald-600 dark:text-emerald-400 font-bold">प्रमाणित डेलिभरी घटना</span>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border-theme shadow-xs space-y-1">
                <span className="text-xxs font-bold uppercase tracking-wider text-muted-text">कुल क्लिक (Clicks)</span>
                <p className="text-2xl font-black text-foreground">{analytics.clicks.toLocaleString()}</p>
                <span className="text-xxs text-rose-600 dark:text-rose-400 font-bold">CTR: {analytics.ctr}%</span>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border-theme shadow-xs space-y-1">
                <span className="text-xxs font-bold uppercase tracking-wider text-muted-text">अनुबन्धित बजेट (Contracted)</span>
                <p className="text-2xl font-black text-foreground">{formatNpr(financials.contractedRevenue)}</p>
                <span className="text-xxs text-muted-text">बाँकी: {formatNpr(financials.remainingBudget)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERFORMANCE ANALYTICS */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border-theme shadow-xs space-y-4">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              <span>दैनिक प्रदर्शन प्रवृत्ति (Daily Performance Trend)</span>
            </h3>

            {analytics.dailyTrend.length > 0 ? (
              <div className="divide-y divide-border-theme">
                {analytics.dailyTrend.map((d, i) => (
                  <div key={i} className="py-3 flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{d.date}</span>
                    <div className="flex items-center gap-6">
                      <span className="text-muted-text">Impressions: <strong className="text-foreground">{d.impressions}</strong></span>
                      <span className="text-muted-text">Clicks: <strong className="text-foreground">{d.clicks}</strong></span>
                      <span className="font-black text-rose-600 dark:text-rose-400">CTR: {d.ctr}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-text py-4 text-center">अहिलेसम्म डेलिभरी घटनाहरू दर्ता भएका छैनन्।</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Device Distribution */}
            <div className="p-5 rounded-2xl bg-card border border-border-theme shadow-xs space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-text flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-500" />
                <span>उपकरण अनुसार वितरण (Device Breakdown)</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted-area/50">
                  <span className="flex items-center gap-2 font-bold"><Monitor className="w-4 h-4 text-muted-text" /> Desktop</span>
                  <span className="font-black text-foreground">{analytics.deviceBreakdown.desktop || 0} impressions</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted-area/50">
                  <span className="flex items-center gap-2 font-bold"><Smartphone className="w-4 h-4 text-muted-text" /> Mobile</span>
                  <span className="font-black text-foreground">{analytics.deviceBreakdown.mobile || 0} impressions</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted-area/50">
                  <span className="flex items-center gap-2 font-bold"><Tablet className="w-4 h-4 text-muted-text" /> Tablet</span>
                  <span className="font-black text-foreground">{analytics.deviceBreakdown.tablet || 0} impressions</span>
                </div>
              </div>
            </div>

            {/* Placement Breakdown */}
            <div className="p-5 rounded-2xl bg-card border border-border-theme shadow-xs space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-text flex items-center gap-2">
                <Target className="w-4 h-4 text-teal-500" />
                <span>स्थान अनुसार प्रदर्शन (Placement Breakdown)</span>
              </h3>

              <div className="space-y-2 text-xs">
                {Object.entries(analytics.placementBreakdown).map(([pl, stats], i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted-area/50">
                    <span className="font-bold text-foreground">{pl}</span>
                    <span className="font-black text-foreground">{stats.impressions} imp / {stats.clicks} clicks</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FINANCIALS */}
      {activeTab === "financials" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-card border border-border-theme shadow-xs space-y-1">
              <span className="text-xxs font-bold uppercase tracking-wider text-muted-text">अनुबन्धित बजेट (Contracted)</span>
              <p className="text-xl font-black text-foreground">{formatNpr(financials.contractedRevenue)}</p>
              <span className="text-xxs text-muted-text">कुल स्वीकृत सम्झौता</span>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border-theme shadow-xs space-y-1">
              <span className="text-xxs font-bold uppercase tracking-wider text-muted-text">वितरित सेवा आय (Delivered)</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatNpr(financials.deliveredRevenue)}</p>
              <span className="text-xxs text-muted-text">वितरित छाप/क्लिक आधारित</span>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border-theme shadow-xs space-y-1">
              <span className="text-xxs font-bold uppercase tracking-wider text-muted-text">बीजक जारी (Invoiced)</span>
              <p className="text-xl font-black text-blue-600 dark:text-blue-400">{formatNpr(financials.invoicedRevenue)}</p>
              <span className="text-xxs text-muted-text">१३% VAT सहित जारी</span>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border-theme shadow-xs space-y-1">
              <span className="text-xxs font-bold uppercase tracking-wider text-muted-text">प्राप्त भुक्तानी (Collected)</span>
              <p className="text-xl font-black text-purple-600 dark:text-purple-400">{formatNpr(financials.collectedRevenue)}</p>
              <span className="text-xxs text-muted-text">बाँकी उठ्न बाँकी: {formatNpr(financials.outstandingRevenue)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="p-5 rounded-2xl bg-card border border-border-theme shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>डेलिभरी बजेट प्रगति (Spend Progress)</span>
              <span>{Math.round((financials.deliveredRevenue / (financials.contractedRevenue || 1)) * 100)}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-muted-area overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((financials.deliveredRevenue / (financials.contractedRevenue || 1)) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GOVERNANCE */}
      {activeTab === "governance" && (
        <div className="p-6 rounded-2xl bg-card border border-border-theme shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-foreground">अभियान १०-विन्दु तत्परता स्थिति (Readiness Audit)</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-black ${validation.ready ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/15 text-rose-700 dark:text-rose-300"}`}>
              {validation.ready ? "प्रकाशनका लागि पूर्ण योग्य (Ready for Delivery)" : "त्रुटिहरू सच्याउनुहोस्"}
            </span>
          </div>

          <div className="divide-y divide-border-theme">
            {validation.checks.map((c, i) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  {c.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                  <span className="font-bold text-foreground">{c.category}:</span>
                  <span className="text-muted-text">{c.message}</span>
                </div>
                <span className={`font-black ${c.passed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {c.passed ? "PASS" : "FAIL"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
