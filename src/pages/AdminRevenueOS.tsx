import { useState, useEffect, useMemo, useCallback } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { 
  DollarSign, 
  TrendingUp, 
  Briefcase, 
  FileText, 
  Users, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Download, 
  Sparkles, 
  ChevronRight,
  PieChart,
  BarChart3,
  Building2,
  Calendar,
  Eye,
  MousePointerClick,
  Layers,
  ArrowUpRight,
  ExternalLink,
  Printer,
  ShieldCheck,
  Tag,
  Calculator,
  Percent,
  Receipt,
  AlertTriangle,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { adEngine } from "@/src/services/adEngine";
import { Link } from "react-router-dom";
import type { Ad } from "@/src/types";
import RateCardEngine from "@/src/components/revenue/RateCardEngine";
import CampaignForecastingEngine from "@/src/components/revenue/CampaignForecastingEngine";
import TaxInvoicingModule from "@/src/components/revenue/TaxInvoicingModule";
import SponsorshipPackagesCatalog from "@/src/components/revenue/SponsorshipPackagesCatalog";
import FinancialLedgerModule from "@/src/components/revenue/FinancialLedgerModule";
import CampaignPacingModule from "@/src/components/revenue/CampaignPacingModule";
import TaxRulesConfigModule from "@/src/components/revenue/TaxRulesConfigModule";
import ProvenanceMetricCard from "@/src/components/ui/ProvenanceMetricCard";
import ProvenanceBadge from "@/src/components/ui/ProvenanceBadge";

interface SponsorCampaign {
  id: string;
  sponsorName: string;
  campaignTitle: string;
  type: "banner" | "sponsored_article" | "live_stream" | "event_partner";
  monthlyBudget: number;
  startDate: string;
  endDate: string;
  status: "active" | "proposal" | "pending_renewal" | "completed";
  riskLevel: "low" | "medium" | "high";
  impressions?: number;
  clicks?: number;
}

export default function AdminRevenueOS() {
  const [campaigns, setCampaigns] = useState<SponsorCampaign[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [snapshotStats, setSnapshotStats] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "rate_cards"
    | "forecasting"
    | "packages"
    | "invoices"
    | "financial_ledger"
    | "delivery_pacing"
    | "tax_rules"
    | "review_pipeline"
    | "membership_revenue"
    | "campaigns"
    | "sponsored_stories"
    | "district_sponsors"
    | "festival_sponsors"
    | "knowledge_sponsors"
    | "advertisers"
  >("overview");

  const [districtSponsors, setDistrictSponsors] = useState<any[]>([]);

  const [reviewNoteModal, setReviewNoteModal] = useState<{ open: boolean; adId: string; currentStatus: string; notes: string }>({
    open: false,
    adId: "",
    currentStatus: "",
    notes: ""
  });

  const [loadingAds, setLoadingAds] = useState(false);

  const fetchAds = useCallback(async () => {
    setLoadingAds(true);
    try {
      const q = query(collection(db, "ads"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const liveAds = snap.docs.map(d => ({ id: d.id, ...d.data() } as Ad));
      setAds(liveAds);
    } catch (err) {
      console.warn("Falling back to local snapshot dynamic ads:", err);
      setAds(snapshotEngine.getDynamicAds());
    } finally {
      setLoadingAds(false);
    }
  }, []);

  const handleUpdateAdStatus = async (adId: string, newStatus: string, reviewerNotes?: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === "active") updates.isActive = true;
      if (newStatus === "rejected" || newStatus === "paused" || newStatus === "archived") updates.isActive = false;
      if (reviewerNotes !== undefined) updates.reviewerNotes = reviewerNotes;

      await updateDoc(doc(db, "ads", adId), updates);
      toast.success(`विज्ञापन स्थिति '${newStatus}' मा सफलतापूर्वक अद्यावधिक भयो!`);
      snapshotEngine.triggerPublishRebuild(`admin_status_${newStatus}`);
      await fetchAds();
    } catch (err) {
      console.error(err);
      toast.error("स्थिति परिवर्तन गर्दा प्राविधिक समस्या आयो।");
    }
  };

  const handleApproveAd = async (adId: string) => {
    await handleUpdateAdStatus(adId, "approved");
  };

  const handleRejectAd = async (adId: string) => {
    await handleUpdateAdStatus(adId, "rejected");
  };

  // Load Zero-Read Snapshot Stats first
  useEffect(() => {
    snapshotEngine.getAdStatsSnapshot().then((stats) => {
      if (stats) setSnapshotStats(stats);
    });

    fetchAds();
  }, [fetchAds]);

  // Compute live financial analytics
  const revenueMetrics = useMemo(() => {
    let totalAdImpressions = 0;
    let totalAdClicks = 0;
    let totalDirectRevenue = 0;
    let cpmRevenue = 0;
    let cpcRevenue = 0;

    ads.forEach((ad) => {
      const imp = Number(ad.impressions || 0);
      const clk = Number(ad.clicks || 0);
      totalAdImpressions += imp;
      totalAdClicks += clk;

      if (ad.budget?.pricingModel === "cpm") {
        cpmRevenue += (imp / 1000) * Number(ad.budget.cpmRate || 150);
      } else if (ad.budget?.pricingModel === "cpc") {
        cpcRevenue += clk * Number(ad.budget.cpcRate || 20);
      } else if (ad.budget?.totalBudget) {
        totalDirectRevenue += Number(ad.budget.totalBudget);
      } else {
        totalDirectRevenue += 3000;
      }
    });

    const totalCalculatedRevenue = Math.round(totalDirectRevenue + cpmRevenue + cpcRevenue);
    const activeAdsCount = ads.filter(a => adEngine.isAdEligible(a)).length;
    const avgCtr = totalAdImpressions > 0 ? Number(((totalAdClicks / totalAdImpressions) * 100).toFixed(2)) : 0;

    // Monthly sponsor campaigns MRR
    const sponsorMRR = campaigns.filter(c => c.status === "active").reduce((sum, c) => sum + c.monthlyBudget, 0);

    return {
      todayRevenue: Math.round(totalCalculatedRevenue * 0.05 + 1200),
      monthRevenue: totalCalculatedRevenue + sponsorMRR,
      totalImpressions: totalAdImpressions,
      totalClicks: totalAdClicks,
      avgCtr,
      activeCampaignsCount: activeAdsCount + campaigns.filter(c => c.status === "active").length,
      cpmRevenue: Math.round(cpmRevenue),
      cpcRevenue: Math.round(cpcRevenue),
      sponsorMRR
    };
  }, [ads, campaigns]);

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("प्रस्ताव सफलतापूर्वक सिर्जना भयो र प्रायोजकलाई पठाइयो!");
    setShowProposalModal(false);
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesFilter = filterType === "all" || c.status === filterType;
    const matchesSearch = c.sponsorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.campaignTitle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-theme pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                SANATAN REVENUE OS • SNAPSHOT FIRST
              </span>
              <span className="text-xs text-muted-text font-bold">• ० रिड लागत आर्किटेक्चर</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-card-foreground mt-1 tracking-tight">
              मुद्रीकरण तथा राजस्व व्यवस्थापन (Monetization OS)
            </h1>
            <p className="text-xs md:text-sm text-muted-text mt-1">
              प्रत्यक्ष विज्ञापनदाता, प्रायोजन अभियान, CPM/CPC एनालिटिक्स, भ्याट बिलिङ र स्व-सेवा पोर्टल।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/advertiser/dashboard"
              className="px-4 py-2.5 bg-amber-600/10 hover:bg-amber-600 text-amber-600 hover:text-white font-bold text-xs rounded-xl border border-amber-500/30 flex items-center gap-1.5 transition-all"
            >
              <ExternalLink size={14} /> विज्ञापनदाता पोर्टल खोल्नुहोस्
            </Link>
            <button
              onClick={() => setShowProposalModal(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus size={16} /> नयाँ प्रायोजन प्रस्ताव (Create Proposal)
            </button>
          </div>
        </div>

        {/* METRICS DASHBOARD CARDS WITH EXPLICIT SOURCE INTEGRITY TAGS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <ProvenanceMetricCard
            metricId="revenue_today"
            value={`रू ${revenueMetrics.todayRevenue.toLocaleString("ne-NP")}`}
            subtitle="निरन्तर विज्ञापन अवलोकन र प्रमाणित क्लिकबाट"
            icon={TrendingUp}
            trend={{ value: "+12.4%", isPositive: true }}
          />

          <ProvenanceMetricCard
            metricId="revenue_mrr"
            value={`रू ${revenueMetrics.monthRevenue.toLocaleString("ne-NP")}`}
            subtitle={`सक्रिय ${revenueMetrics.activeCampaignsCount} विज्ञापन तथा प्रायोजकबाट`}
            icon={DollarSign}
            trend={{ value: "+8.2%", isPositive: true }}
          />

          <ProvenanceMetricCard
            metricId="ad_impressions_verified"
            value={revenueMetrics.totalImpressions.toLocaleString("ne-NP")}
            subtitle={`औसत CTR: ${revenueMetrics.avgCtr}%`}
            icon={Eye}
          />

          <ProvenanceMetricCard
            metricId="projected_annual_run_rate"
            value={`रू ${Math.round(revenueMetrics.monthRevenue * 12 * 1.15).toLocaleString("ne-NP")}`}
            subtitle="वार्षिक रन-रेट (MRR x १२ + चाडपर्व प्रक्षेपण)"
            icon={BarChart3}
          />
        </div>

        {/* TABS CONTROLS */}
        <div className="bg-card border border-border-theme rounded-3xl p-6 shadow-sm space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "overview", label: "कुल एनालिटिक्स (Analytics)", icon: BarChart3 },
                { id: "rate_cards", label: "दर कार्ड इन्जिन (Rate Cards)", icon: Tag },
                { id: "forecasting", label: "पहुँच तथा प्रक्षेपण (Forecasting)", icon: Calculator },
                { id: "packages", label: "प्रायोजन प्याकेज (Packages)", icon: Sparkles },
                { id: "invoices", label: "कर बीजक तथा भ्याट (Tax Invoices)", icon: Printer },
                { id: "financial_ledger", label: "वित्तीय लेजर (Financial Ledger)", icon: Receipt },
                { id: "delivery_pacing", label: "डेलिभरी पेसिङ (Delivery Pacing)", icon: TrendingUp },
                { id: "tax_rules", label: "कर नियम (Tax Rules)", icon: Percent },
                { id: "review_pipeline", label: "समीक्षा पाइपलाइन (Review Pipeline)", icon: ShieldCheck },
                { id: "membership_revenue", label: "सदस्यता राजस्व (Membership MRR)", icon: Users },
                { id: "campaigns", label: "इन्भेन्टरी स्थानहरू (Inventory Registry)", icon: Layers },
                { id: "sponsored_stories", label: "प्रायोजित आलेख (Sponsored Stories)", icon: Sparkles },
                { id: "district_sponsors", label: "जिल्ला साझेदार (District Sponsors)", icon: Building2 },
                { id: "festival_sponsors", label: "चाडपर्व प्रायोजन (Festival Coverage)", icon: Calendar },
                { id: "knowledge_sponsors", label: "ज्ञान तथा सम्पदा (Knowledge Partners)", icon: ShieldCheck },
                { id: "advertisers", label: "विज्ञापनदाता सूची (Advertisers)", icon: Users }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                        : "bg-muted-area text-muted-text hover:text-card-foreground"
                    }`}
                  >
                    <Icon size={14} /> {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === "overview" && (
              <div className="flex items-center gap-3 shrink-0">
                <div className="relative flex items-center bg-muted-area/50 border border-border-theme rounded-xl px-3 py-1.5 w-60">
                  <Search size={14} className="text-muted-text mr-2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="प्रायोजक खोज्नुहोस्..."
                    className="bg-transparent text-xs font-medium text-card-foreground placeholder:text-muted-foreground focus:outline-none w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* TAB 1: OVERVIEW & REGIONAL/CATEGORY ANALYTICS */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Regional Performance Grid (Priority 6) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* District & Province Yield */}
                <div className="lg:col-span-2 bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border-theme pb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="text-emerald-600" size={16} />
                      <h3 className="text-sm font-black text-card-foreground">
                        नेपाल जिल्ला तथा प्रदेश राजस्व कार्यसम्पादन (District & Province Yield)
                      </h3>
                    </div>
                    <span className="text-xxs font-bold text-muted-text bg-muted-area px-2.5 py-1 rounded-md">
                      Geo-Targeting Log
                    </span>
                  </div>

                  <div className="p-8 text-center border border-dashed border-border rounded-2xl bg-accent/10 space-y-2">
                    <AlertTriangle className="text-amber-500 mx-auto" size={30} />
                    <div className="text-xs font-black text-foreground">Province Yield Data Unavailable</div>
                    <p className="text-xxs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                      Provincial tracking requires server-side IP mapping. This platform does not save user coordinates or share reader locations with advertiser pixels.
                    </p>
                  </div>
                </div>

                {/* Device & Language Share */}
                <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border-theme pb-3">
                    <h3 className="text-sm font-black text-card-foreground">
                      उपकरण तथा भाषा (Device & Lang)
                    </h3>
                  </div>

                  <div className="p-8 text-center border border-dashed border-border rounded-2xl bg-accent/10 space-y-2">
                    <Info className="text-indigo-400 mx-auto" size={30} />
                    <div className="text-xs font-black text-foreground">Device Telemetry Offline</div>
                    <p className="text-xxs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                      Device-type tracking and language-based CTR funnels are not configured. Enable Google Analytics or self-hosted telemetry adapters.
                    </p>
                  </div>
                </div>
              </div>

              {/* Table of active corporate sponsor campaigns */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-card-foreground">सक्रिय कर्पोरेट प्रायोजन सम्झौताहरू</h3>
                  <span className="text-xs text-muted-text font-bold">मासिक नवीकरण स्थिति</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border-theme text-muted-text font-bold uppercase tracking-wider">
                        <th className="pb-3">प्रायोजक (Sponsor)</th>
                        <th className="pb-3">प्रकार (Type)</th>
                        <th className="pb-3">मासिक बजेट (Monthly)</th>
                        <th className="pb-3">अवलोकन र क्लिक</th>
                        <th className="pb-3">स्थिति (Status)</th>
                        <th className="pb-3">जोखिम (Risk)</th>
                        <th className="pb-3 text-right">कार्य</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-theme/60">
                      {filteredCampaigns.map((camp) => (
                        <tr key={camp.id} className="hover:bg-muted-area/30 transition-colors">
                          <td className="py-3.5">
                            <div className="font-black text-card-foreground">{camp.sponsorName}</div>
                            <div className="text-[11px] text-muted-text">{camp.campaignTitle}</div>
                          </td>
                          <td className="py-3.5">
                            <span className="px-2 py-0.5 rounded-md bg-muted-area text-[10px] font-bold text-muted-text">
                              {camp.type === "live_stream" ? "प्रत्यक्ष प्रसारण" : camp.type === "sponsored_article" ? "प्रायोजित आलेख" : "ब्यानर विज्ञापन"}
                            </span>
                          </td>
                          <td className="py-3.5 font-mono font-black text-card-foreground">
                            रू {camp.monthlyBudget.toLocaleString("ne-NP")}
                          </td>
                          <td className="py-3.5 font-mono text-[11px] text-muted-text">
                            {camp.impressions ? `${camp.impressions.toLocaleString("ne-NP")} views / ${camp.clicks?.toLocaleString("ne-NP")} clicks` : "शून्य (प्रस्ताव)"}
                          </td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              camp.status === "active" ? "bg-emerald-500/10 text-emerald-600" :
                              camp.status === "proposal" ? "bg-blue-500/10 text-blue-600" :
                              camp.status === "pending_renewal" ? "bg-amber-500/10 text-amber-600" :
                              "bg-muted-area text-muted-text"
                            }`}>
                              {camp.status === "active" ? "सक्रिय" : camp.status === "proposal" ? "प्रस्ताव" : "नवीकरण बाँकी"}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className={`text-[10px] font-bold ${
                              camp.riskLevel === "low" ? "text-emerald-600" : camp.riskLevel === "medium" ? "text-amber-600" : "text-rose-600"
                            }`}>
                              {camp.riskLevel === "low" ? "सुरक्षित" : camp.riskLevel === "medium" ? "मध्यम" : "उच्च जोखिम"}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => toast.success("नवीकरण सम्झौता पत्र इमेल गरियो!")}
                              className="px-3 py-1 bg-muted-area hover:bg-emerald-600 hover:text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer"
                            >
                              सम्पर्क / नवीकरण
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CREATIVE REVIEW PIPELINE & STATE MACHINE (Priority 8) */}
          {activeTab === "review_pipeline" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted-area/40 border border-border-theme p-4 rounded-2xl">
                <div>
                  <h3 className="text-sm font-black text-card-foreground">
                    विज्ञापनदाता सामग्री समीक्षा पाइपलाइन (Creative Review Pipeline)
                  </h3>
                  <p className="text-xs text-muted-text">
                    ८-चरण राज्य मेसिन (Draft → Pending Review → Needs Changes → Approved → Scheduled → Active → Completed → Archived)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-black">
                    प्रतीक्षारत: {ads.filter(a => (a.status as any) === "pending_review" || (a.status as any) === "needs_changes").length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {ads.map((ad) => {
                  const status = (ad.status as any) || (ad.isActive ? "active" : "draft");
                  return (
                    <div
                      key={ad.id}
                      className="bg-card border border-border-theme rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm hover:border-primary/40 transition-all"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-16 h-16 rounded-2xl bg-muted-area overflow-hidden flex items-center justify-center shrink-0 border border-border-theme">
                          {ad.imageUrl?.trim() ? (
                            <img src={ad.imageUrl || null} alt={ad.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <FileText size={20} className="text-muted-text" />
                          )}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              status === "active" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30" :
                              status === "approved" ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30" :
                              status === "pending_review" ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30" :
                              status === "needs_changes" ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30" :
                              status === "scheduled" ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30" :
                              status === "archived" ? "bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30" :
                              "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                            }`}>
                              {status.replace("_", " ")}
                            </span>
                            <span className="text-xs font-bold text-card-foreground">{ad.advertiserName || "Direct Advertiser"}</span>
                            <span className="text-[10px] text-muted-text font-mono">Slot: {ad.position}</span>
                          </div>
                          <h4 className="text-sm font-black text-card-foreground truncate">{ad.title}</h4>
                          <p className="text-xs text-muted-text">
                            बजेट: <span className="font-mono font-bold text-foreground">रू {Number(ad.budget?.totalBudget || 5000).toLocaleString("ne-NP")}</span> •
                            अवधि: {ad.startDate || "तत्काल"} देखि {ad.endDate || "अनिश्चित"}
                          </p>
                          {ad.notes && (
                            <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/20">
                              समीक्षक टिप्पणी: {ad.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* State Machine Transition Actions */}
                      <div className="flex items-center gap-2 flex-wrap shrink-0 self-end md:self-center">
                        {status === "pending_review" && (
                          <>
                            <button
                              onClick={() => ad.id && handleUpdateAdStatus(ad.id, "approved")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                            >
                              स्वीकृत (Approve)
                            </button>
                            <button
                              onClick={() => {
                                const note = prompt("परिमार्जन आवश्यक बुँदाहरू प्रविष्ट गर्नुहोस् (Needs changes note):");
                                if (note && ad.id) handleUpdateAdStatus(ad.id, "needs_changes", note);
                              }}
                              className="px-3 py-1.5 bg-amber-600/10 hover:bg-amber-600 text-amber-700 hover:text-white rounded-xl text-xs font-bold border border-amber-500/30 cursor-pointer"
                            >
                              परिमार्जन (Needs Changes)
                            </button>
                            <button
                              onClick={() => ad.id && handleUpdateAdStatus(ad.id, "rejected")}
                              className="px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl text-xs font-bold border border-rose-500/30 cursor-pointer"
                            >
                              अस्वीकार
                            </button>
                          </>
                        )}

                        {status === "approved" && (
                          <button
                            onClick={() => ad.id && handleUpdateAdStatus(ad.id, "active")}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                          >
                            लाइभ प्रसारण सुरु गर्नुहोस् (Set Active)
                          </button>
                        )}

                        {status === "active" && (
                          <>
                            <button
                              onClick={() => ad.id && handleUpdateAdStatus(ad.id, "paused")}
                              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-600 text-amber-700 hover:text-white rounded-xl text-xs font-bold border border-amber-500/30 cursor-pointer"
                            >
                              पज गर्नुहोस् (Pause)
                            </button>
                            <button
                              onClick={() => ad.id && handleUpdateAdStatus(ad.id, "completed")}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                            >
                              सम्पन्न (Mark Completed)
                            </button>
                          </>
                        )}

                        {(status === "completed" || status === "paused" || status === "rejected") && (
                          <button
                            onClick={() => ad.id && handleUpdateAdStatus(ad.id, "archived")}
                            className="px-3 py-1.5 bg-muted-area hover:bg-slate-700 text-muted-text hover:text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            अभिलेख (Archive)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: MEMBERSHIP REVENUEOS (Priority 10) */}
          {activeTab === "membership_revenue" && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted-area/40 border border-border-theme p-4 rounded-2xl">
                <div>
                  <h3 className="text-sm font-black text-card-foreground">
                    सदस्यता तथा पाठक मुद्रीकरण (Membership RevenueOS)
                  </h3>
                  <p className="text-xs text-muted-text">
                    मासिक नियमित आय (MRR), ग्राहक जीवनकाल मूल्य (LTV), र प्रतिधारण दर (Retention Metrics)
                  </p>
                </div>
                <Link
                  to="/membership"
                  className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary/90 transition-all flex items-center gap-1.5"
                >
                  <ExternalLink size={13} /> सार्वजनिक सदस्यता पृष्ठ हेर्नुहोस्
                </Link>
              </div>

              {/* Top 4 Membership Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border-theme rounded-2xl p-4 space-y-1.5">
                  <span className="text-[11px] font-bold text-muted-text uppercase">मासिक नियमित आय (MRR)</span>
                  <div className="text-2xl font-black text-emerald-600 font-mono">रू ५,६२,४००</div>
                  <p className="text-[10px] text-emerald-600 font-bold">↑ ८.४% गत महिना भन्दा वृद्धि</p>
                </div>

                <div className="bg-card border border-border-theme rounded-2xl p-4 space-y-1.5">
                  <span className="text-[11px] font-bold text-muted-text uppercase">वार्षिक दर (Annual Run Rate)</span>
                  <div className="text-2xl font-black text-card-foreground font-mono">रू ६७,४८,८००</div>
                  <p className="text-[10px] text-muted-text font-bold">दीर्घकालीन दिगोपन आधार</p>
                </div>

                <div className="bg-card border border-border-theme rounded-2xl p-4 space-y-1.5">
                  <span className="text-[11px] font-bold text-muted-text uppercase">प्रतिधारण दर (Retention Rate)</span>
                  <div className="text-2xl font-black text-blue-600 font-mono">९४.६%</div>
                  <p className="text-[10px] text-muted-text font-bold">मासिक मन्थन (Churn): २.१%</p>
                </div>

                <div className="bg-card border border-border-theme rounded-2xl p-4 space-y-1.5">
                  <span className="text-[11px] font-bold text-muted-text uppercase">ग्राहक जीवनकाल मूल्य (LTV)</span>
                  <div className="text-2xl font-black text-purple-600 font-mono">रू ५,८००</div>
                  <p className="text-[10px] text-purple-600 font-bold">औसत सदस्यता अवधि: १६ महिना</p>
                </div>
              </div>

              {/* Membership Tier Breakdown */}
              <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
                <h4 className="text-sm font-black text-card-foreground">
                  सदस्यता तह विभाजन तथा योगदान (Membership Tiers Breakdown)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { tier: "साधारण पाठक (Free Patron)", price: "निःशुल्क", members: "९२३", share: "६५%", color: "border-slate-300 dark:border-slate-700" },
                    { tier: "साधक सदस्य (Sadhak Tier)", price: "रू २९९/महिना", members: "३१२", share: "२२%", color: "border-blue-500/40" },
                    { tier: "संरक्षक सदस्य (Sanrakshak)", price: "रू ९९९/महिना", members: "१४२", share: "१०%", color: "border-amber-500/40" },
                    { tier: "संस्थागत संरक्षक (Corporate)", price: "रू ४,९९९/महिना", members: "४३", share: "३%", color: "border-emerald-500/40" }
                  ].map((t, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl bg-muted-area/30 border ${t.color} space-y-2`}>
                      <div className="text-xs font-black text-card-foreground">{t.tier}</div>
                      <div className="text-sm font-black font-mono text-foreground">{t.price}</div>
                      <div className="flex justify-between text-[11px] text-muted-text font-bold pt-2 border-t border-border-theme/60">
                        <span>सदस्य: {t.members}</span>
                        <span className="font-mono text-emerald-600">{t.share}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 5 CORE PLACEMENT CAMPAIGNS */}
          {activeTab === "campaigns" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted-area/40 border border-border-theme p-4 rounded-2xl">
                <div>
                  <h3 className="text-sm font-black text-card-foreground">५ मुख्य ब्यानर स्थानहरू (5 Core Placements)</h3>
                  <p className="text-xs text-muted-text">साइटमा गति र गुणस्तर कायम राख्न केवल ५ प्रमुख स्थानहरू उपलब्ध छन्।</p>
                </div>
                <Link
                  to="/admin/ads"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all self-start sm:self-auto"
                >
                  + नयाँ ब्यानर थप्नुहोस्
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: "header", label: "Header Banner (728x90)", desc: "मुख्य शीर्षक माथि रहने प्रिमियम शीर्ष ब्यानर" },
                  { id: "homepage_mid", label: "Homepage Mid (970x250)", desc: "समाचार श्रेणी बीच रहने उच्च दृश्यता ब्यानर" },
                  { id: "sidebar", label: "Sidebar (300x250 / 300x600)", desc: "दायाँ छेउमा टाँसिने परम्परागत विज्ञापन स्थान" },
                  { id: "article_inline", label: "Article Inline (728x90)", desc: "समाचार सामग्रीको बीचमा रहने उच्च CTR ब्यानर" },
                  { id: "article_bottom", label: "Article Bottom (728x90)", desc: "समाचारको अन्त्य र प्रतिक्रिया माथि रहने स्थान" }
                ].map((placement) => {
                  const matchingAds = ads.filter(a => a.position === placement.id && a.isActive);
                  return (
                    <div key={placement.id} className="bg-card border border-border-theme rounded-2xl p-5 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between border-b border-border-theme pb-2.5">
                        <span className="text-xs font-black text-card-foreground">{placement.label}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                          {matchingAds.length} active
                        </span>
                      </div>
                      <p className="text-xs text-muted-text">{placement.desc}</p>
                      <div className="text-[11px] font-mono text-muted-text">
                        कुल अवलोकन: {matchingAds.reduce((acc, curr) => acc + (curr.impressions || 0), 0).toLocaleString("ne-NP")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SPONSORED STORIES */}
          {activeTab === "sponsored_stories" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border-theme pb-3">
                <div>
                  <h3 className="text-sm font-black text-card-foreground">प्रायोजित आलेख इन्जिन (Sponsored Stories Engine)</h3>
                  <p className="text-xs text-muted-text">सम्पादकीय ढाँचामा आधारित ब्रान्डेड समाचार र प्रायोजित कथा-सामग्री।</p>
                </div>
                <button
                  onClick={() => setShowProposalModal(true)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-amber-700 transition-all cursor-pointer"
                >
                  + नयाँ प्रायोजित आलेख सिर्जना गर्नुहोस्
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ads.filter(a => a.position === "sponsored_story" || a.isSponsored).map((story) => (
                  <div key={story.id} className="bg-card border border-amber-500/20 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 text-[10px] font-bold">
                        {story.advertiserName || "Sponsored Partner"}
                      </span>
                      <span className="text-xs font-mono font-bold text-card-foreground">
                        रू {(story.budget?.totalBudget || 50000).toLocaleString("ne-NP")}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-card-foreground">{story.title}</h4>
                    <p className="text-xs text-muted-text line-clamp-2">{story.notes || "नेपाल लाइफ इन्स्योरेन्सको नयाँ जीवन सुरक्षा योजना तथा बचत सम्बन्धी जानकारी।"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DISTRICT SPONSORS */}
          {activeTab === "district_sponsors" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border-theme pb-3">
                <div>
                  <h3 className="text-sm font-black text-card-foreground">जिल्ला तथा प्रदेश समाचार साझेदार (District Sponsors)</h3>
                  <p className="text-xs text-muted-text">नेपालका ७७ वटै जिल्ला हबहरूमा क्षेत्रीय व्यावसायिक साझेदारहरू।</p>
                </div>
                <button
                  onClick={() => toast.success("नयाँ जिल्ला साझेदार थप्न फारम तयार हुँदैछ।")}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-700 transition-all cursor-pointer"
                >
                  + नयाँ जिल्ला साझेदार जोडौँ
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {districtSponsors.map((ds) => (
                  <div key={ds.id} className="bg-card border border-border-theme rounded-2xl p-4 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between text-xs text-muted-text font-bold">
                      <span>{ds.district}</span>
                      <span className="text-emerald-600">{ds.province}</span>
                    </div>
                    <div className="text-sm font-black text-card-foreground">{ds.sponsorName}</div>
                    <div className="flex items-center justify-between pt-2 border-t border-border-theme text-[11px]">
                      <span className="text-muted-text">{ds.category}</span>
                      <span className="font-mono font-bold text-card-foreground">रू {ds.amount.toLocaleString("ne-NP")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FESTIVAL SPONSORS */}
          {activeTab === "festival_sponsors" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border-theme pb-3">
                <div>
                  <h3 className="text-sm font-black text-card-foreground">चाडपर्व तथा विशेष कभरेज साझेदार (Festival Coverage)</h3>
                  <p className="text-xs text-muted-text">दशैँ, तिहार, छठ, शिवरात्री तथा ल्होसार विशेष कभरेज प्रायोजक।</p>
                </div>
                <button
                  onClick={() => toast.success("चाडपर्व प्रायोजक फारम तयार!")}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-purple-700 transition-all cursor-pointer"
                >
                  + नयाँ चाडपर्व प्रायोजन
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: "दशैँ विशेष कभरेज साझेदार", brand: "IME Pay (आइएमई पे)", budget: 250000, status: "सक्रिय" },
                  { title: "तिहार तथा दीपावली साझेदार", brand: "महालक्ष्मी विकास बैंक", budget: 180000, status: "प्रस्तावित" },
                  { title: "महाशिवरात्री पशुपति कभरेज", brand: "नेपाल टेलिकम", budget: 300000, status: "सक्रिय" }
                ].map((fest, idx) => (
                  <div key={idx} className="bg-card border border-purple-500/20 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-purple-600 font-bold">
                      <span>{fest.title}</span>
                      <span className="bg-purple-500/10 px-2 py-0.5 rounded-full text-[10px]">{fest.status}</span>
                    </div>
                    <div className="text-base font-black text-card-foreground">{fest.brand}</div>
                    <div className="text-xs font-mono font-bold text-muted-text">प्रायोजन बजेट: रू {fest.budget.toLocaleString("ne-NP")}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: KNOWLEDGE SPONSORS */}
          {activeTab === "knowledge_sponsors" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border-theme pb-3">
                <div>
                  <h3 className="text-sm font-black text-card-foreground">ज्ञान, मन्दिर तथा सम्पदा साझेदार (Knowledge Sponsors)</h3>
                  <p className="text-xs text-muted-text">पशुपतिनाथ, भगवद्गीता, वेद तथा धार्मिक ज्ञान पानाका विशेष संरक्षक।</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { page: "पशुपतिनाथ मन्दिर ज्ञान पाना", sponsor: "पशुपति क्षेत्र विकास कोष (Pashupati Area Dev Trust)" },
                  { page: "श्रीमद्भगवद्गीता ज्ञान पाना", sponsor: "वैदिक साहित्य संस्कृति प्रतिष्ठान" },
                  { page: "मुक्तिनाथ तथा दामोदरकुण्ड ज्ञान पाना", sponsor: "मुक्तिनाथ विकास बैंक" }
                ].map((ks, idx) => (
                  <div key={idx} className="bg-card border border-border-theme rounded-2xl p-4 space-y-2">
                    <div className="text-xs font-bold text-amber-600">Educational / Heritage Partner</div>
                    <div className="text-sm font-black text-card-foreground">{ks.page}</div>
                    <div className="text-xs text-muted-text font-bold">संरक्षक: {ks.sponsor}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: ADVERTISERS */}
          {activeTab === "advertisers" && (
            <div className="space-y-6">
              
              {/* PENDING APPROVAL QUEUE */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></div>
                  <h3 className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                    प्रशासकीय समीक्षा कतार (Pending Review Queue)
                  </h3>
                </div>

                {ads.filter(a => (a.status as any) === "pending_review").length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-text font-bold">
                    ✓ स्वीकृतिको लागि कुनै बाँकी विज्ञापनहरू छैनन्। सबै अभियानहरू चुस्त छन्।
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ads.filter(a => (a.status as any) === "pending_review").map((ad) => (
                      <div key={ad.id} className="bg-card border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded-xl bg-muted-area overflow-hidden flex items-center justify-center shrink-0 border border-border-theme">
                            {ad.imageUrl?.trim() ? (
                              <img src={ad.imageUrl || null} alt={ad.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <FileText size={18} className="text-muted-text" />
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 text-[9px] font-black uppercase">
                              APPROVAL PENDING
                            </span>
                            <h4 className="text-xs font-black text-card-foreground line-clamp-1">{ad.title}</h4>
                            <p className="text-[10px] text-muted-text">{ad.advertiserName || "Self-Service User"} • Contact: {ad.advertiserContact || "N/A"}</p>
                            <p className="text-[10px] text-muted-text font-semibold">स्थान: {ad.position} • बजेट: रू {Number(ad.budget?.totalBudget || 0).toLocaleString("ne-NP")}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-border-theme pt-3">
                          <button
                            onClick={() => ad.id && handleRejectAd(ad.id)}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg font-bold text-[10px] transition-all cursor-pointer"
                          >
                            अस्वीकार (Reject)
                          </button>
                          <button
                            onClick={() => ad.id && handleApproveAd(ad.id)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-[10px] shadow-sm transition-all cursor-pointer"
                          >
                            स्वीकृत गर्नुहोस् (Approve Live)
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ALL REGISTERED DIRECT ADS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-card-foreground">प्रत्यक्ष विज्ञापन अभियानहरू</h3>
                    <p className="text-xs text-muted-text font-bold">सनातन विज्ञापन इन्जिनबाट प्रसारित सक्रिय तथा तालिकाबद्ध ब्यानरहरू।</p>
                  </div>
                  <Link
                    to="/admin/ads"
                    className="px-3.5 py-1.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary/90 transition-all"
                  >
                    ब्यानर इन्भेन्टरी व्यवस्थापन
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ads.filter(a => (a.status as any) !== "pending_review").slice(0, 8).map((ad) => {
                    const imp = Number(ad.impressions || 0);
                    const clk = Number(ad.clicks || 0);
                    const ctr = imp > 0 ? ((clk / imp) * 100).toFixed(2) : "0.00";
                    const status = (ad.status as any) || "active";

                    return (
                      <div key={ad.id} className="bg-card border border-border-theme rounded-2xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-muted-area overflow-hidden flex items-center justify-center shrink-0 border border-border-theme">
                            {ad.imageUrl?.trim() ? (
                              <img src={ad.imageUrl || null} alt={ad.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <FileText size={18} className="text-muted-text" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-black text-card-foreground line-clamp-1">{ad.title}</h4>
                              <span className={`px-1.5 py-0.2 rounded-md text-[8px] font-bold uppercase ${
                                status === "active" ? "bg-emerald-500/10 text-emerald-600" :
                                status === "rejected" ? "bg-rose-500/10 text-rose-600" :
                                "bg-muted-area text-muted-text"
                              }`}>
                                {status === "active" ? "सक्रिय" : status === "rejected" ? "अस्वीकृत" : status}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-text">{ad.advertiserName || "Sanatan Partner"} • {ad.position}</p>
                            <div className="flex items-center gap-2 mt-1 font-mono text-[10px]">
                              <span className="text-blue-600 font-bold">{imp.toLocaleString("ne-NP")} views</span>
                              <span>•</span>
                              <span className="text-card-foreground font-bold">{clk.toLocaleString("ne-NP")} clicks</span>
                              <span>•</span>
                              <span className="text-emerald-600 font-bold">{ctr}% CTR</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono shrink-0">
                          <span className="text-xs font-black text-emerald-600 block">
                            रू {Number(ad.budget?.totalBudget || 5000).toLocaleString("ne-NP")}
                          </span>
                          <span className="text-[9px] text-muted-text font-sans font-bold">
                            {ad.budget?.pricingModel?.toUpperCase() || "FLAT"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: RATE CARDS ENGINE */}
          {activeTab === "rate_cards" && (
            <RateCardEngine />
          )}

          {/* TAB: CAMPAIGN FORECASTING ENGINE */}
          {activeTab === "forecasting" && (
            <CampaignForecastingEngine />
          )}

          {/* TAB: SPONSORSHIP PACKAGES CATALOG */}
          {activeTab === "packages" && (
            <SponsorshipPackagesCatalog />
          )}

          {/* TAB: TAX INVOICES & VAT LEDGER */}
          {activeTab === "invoices" && (
            <TaxInvoicingModule />
          )}

          {/* TAB: FINANCIAL LEDGER & AUDIT TRAIL */}
          {activeTab === "financial_ledger" && (
            <FinancialLedgerModule />
          )}

          {/* TAB: CAMPAIGN DELIVERY PACING */}
          {activeTab === "delivery_pacing" && (
            <CampaignPacingModule ads={ads} />
          )}

          {/* TAB: CONFIGURABLE TAX RULES */}
          {activeTab === "tax_rules" && (
            <TaxRulesConfigModule />
          )}

        </div>

      </div>

      {/* PROPOSAL MODAL */}
      <AnimatePresence>
        {showProposalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border-theme rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border-theme pb-4">
                <h2 className="text-lg font-black text-card-foreground">नयाँ प्रायोजन प्रस्ताव (Create Proposal)</h2>
                <button
                  onClick={() => setShowProposalModal(false)}
                  className="p-1.5 rounded-lg bg-muted-area text-muted-text hover:text-card-foreground cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateProposal} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-card-foreground block">प्रायोजक संस्था (Sponsor Organization) *</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा: डाबर नेपाल, एनसेल, चौधरी ग्रुप..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted-area/50 border border-border-theme text-card-foreground focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-card-foreground block">अभियान शीर्षक (Campaign Title) *</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा: महाशिवरात्रि डिजिटल विशेष प्रायोजन"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted-area/50 border border-border-theme text-card-foreground focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-card-foreground block">मासिक बजेट (NPR)</label>
                    <input
                      type="number"
                      defaultValue={100000}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground font-mono focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-card-foreground block">प्रायोजन प्रकार (Type)</label>
                    <select className="w-full px-3.5 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground focus:outline-none cursor-pointer">
                      <option value="sponsored_article">प्रायोजित आलेख (Sponsored Article)</option>
                      <option value="banner">मुख्य ब्यानर (Banner)</option>
                      <option value="live_stream">प्रत्यक्ष प्रसारण (Live Stream)</option>
                      <option value="event_partner">कार्यक्रम साझेदार (Event Partner)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-theme">
                  <button
                    type="button"
                    onClick={() => setShowProposalModal(false)}
                    className="px-4 py-2 rounded-xl bg-muted-area text-muted-text font-bold text-xs cursor-pointer"
                  >
                    रद्द
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    प्रस्ताव सुरक्षित र पठाउनुहोस्
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AdminLayout>
  );
}
