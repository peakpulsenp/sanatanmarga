import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc, orderBy } from "@/src/lib/firebase";
import { db, auth } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { 
  Megaphone, TrendingUp, Eye, MousePointerClick, DollarSign, Plus, 
  Download, Calendar, MapPin, Sliders, ShieldCheck, FileText, CheckCircle2, 
  Clock, Sparkles, Layers, Printer, RefreshCw, Filter, Search, ArrowUpRight,
  BarChart3, Building2, AlertCircle, Edit, Trash2, ExternalLink, Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Ad, AdPosition, AdStatus } from "@/src/types";
import AlertModal from "@/src/components/ui/AlertModal";
import MediaAssetPickerModal from "@/src/components/media/MediaAssetPickerModal";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { offlineQueue } from "@/src/lib/offlineQueue";
import { adEngine, NEPAL_PROVINCES } from "@/src/services/adEngine";
import { handleFirestoreError, OperationType } from "@/src/lib/errorHandling";
import { Link } from "react-router-dom";
import CampaignPerformanceReport from "@/src/components/revenue/CampaignPerformanceReport";
import CampaignMilestoneTimeline from "@/src/components/revenue/CampaignMilestoneTimeline";
import { calculateCampaignPacing } from "@/src/services/pacingEngine";
import AdvertiserPitchSection from "@/src/components/advertiser/AdvertiserPitchSection";
import { 
  campaignService, 
  adAnalyticsEngine, 
  invoiceEngine, 
  paymentEngine, 
  revenueReconciliationEngine, 
  creativeService,
  CreativeAsset
} from "@/src/services/revenue";

const PLACEMENT_OPTIONS: Record<string, { label: string; dimensions: string; category: string; minBudget: number; estImpressions: string }> = {
  hero_slider: { label: "हिरो स्लाइडर (Hero Slider)", dimensions: "1200 x 600 px", category: "High Impact", minBudget: 15000, estImpressions: "50,000+ / हप्ता" },
  header: { label: "मुख्य हेडर ब्यानर (Header Top)", dimensions: "728 x 90 px / 970 x 90 px", category: "Premium", minBudget: 20000, estImpressions: "100,000+ / हप्ता" },
  homepage_top: { label: "गृहपृष्ठ शीर्ष (Homepage Top)", dimensions: "970 x 250 px", category: "Display", minBudget: 12000, estImpressions: "40,000+ / हप्ता" },
  homepage_mid: { label: "गृहपृष्ठ मध्य (Homepage Mid)", dimensions: "970 x 250 px", category: "Display", minBudget: 8000, estImpressions: "30,000+ / हप्ता" },
  homepage_bottom: { label: "गृहपृष्ठ तल (Homepage Bottom)", dimensions: "970 x 250 px", category: "Display", minBudget: 5000, estImpressions: "20,000+ / हप्ता" },
  sidebar: { label: "साइडबार स्क्वायर (Sidebar)", dimensions: "300 x 250 px", category: "Standard", minBudget: 6000, estImpressions: "35,000+ / हप्ता" },
  article_top: { label: "समाचार शीर्ष (Article Top)", dimensions: "728 x 90 px", category: "In-Read", minBudget: 10000, estImpressions: "45,000+ / हप्ता" },
  article_inline: { label: "समाचार भित्र (Article Inline)", dimensions: "728 x 90 px / 300 x 250 px", category: "In-Read", minBudget: 12000, estImpressions: "60,000+ / हप्ता" },
  article_bottom: { label: "समाचार तल (Article Bottom)", dimensions: "970 x 250 px", category: "Display", minBudget: 7000, estImpressions: "25,000+ / हप्ता" },
  category_top: { label: "क्याटगोरी शीर्ष (Category Top)", dimensions: "970 x 250 px", category: "Display", minBudget: 8000, estImpressions: "25,000+ / हप्ता" },
  category_bottom: { label: "क्याटगोरी तल (Category Bottom)", dimensions: "970 x 250 px", category: "Display", minBudget: 5000, estImpressions: "15,000+ / हप्ता" },
  left_skin: { label: "बायाँ ब्याकग्राउन्ड स्किन (Left Skin)", dimensions: "300 x 1080 px", category: "Wallpaper", minBudget: 25000, estImpressions: "80,000+ / हप्ता" },
  right_skin: { label: "दायाँ ब्याकग्राउन्ड स्किन (Right Skin)", dimensions: "300 x 1080 px", category: "Wallpaper", minBudget: 25000, estImpressions: "80,000+ / हप्ता" },
  mobile_sticky: { label: "मोबाइल स्टिकी ब्यानर (Mobile Sticky)", dimensions: "320 x 50 px", category: "Mobile", minBudget: 18000, estImpressions: "120,000+ / हप्ता" },
  popup_takeover: { label: "पपअप टेकओभर (Modal Takeover)", dimensions: "600 x 600 px", category: "High Impact", minBudget: 35000, estImpressions: "150,000+ / हप्ता" },
  sponsored_story: { label: "प्रायोजित समाचार कार्ड (Sponsored Story)", dimensions: "1200 x 675 px", category: "Native", minBudget: 15000, estImpressions: "50,000+ / हप्ता" }
};

const CATEGORIES_LIST = [
  { id: "all", label: "सबै विधा (All Categories)" },
  { id: "politics", label: "राजनीति (Politics)" },
  { id: "economy", label: "अर्थतन्त्र (Economy)" },
  { id: "sports", label: "खेलकुद (Sports)" },
  { id: "tech", label: "प्रविधि (Tech)" },
  { id: "glamour", label: "ग्ल्यामर (Glamour)" },
  { id: "nepal-hub", label: "नेपाल हब (Nepal Hub)" },
  { id: "world", label: "अन्तर्राष्ट्रिय (World)" }
];

export default function AdvertiserDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [selectedInvoiceAd, setSelectedInvoiceAd] = useState<Ad | null>(null);
  const [selectedReportAd, setSelectedReportAd] = useState<Ad | null>(null);
  const [selectedTimelineAd, setSelectedTimelineAd] = useState<Ad | null>(null);
  const [alertInfo, setAlertInfo] = useState({ show: false, title: "", message: "", type: "success" as "success" | "error" });
  
  // Tab and Filters
  const [mainMode, setMainMode] = useState<"pitch" | "portal">("pitch");
  const [activeTab, setActiveTab] = useState<"campaigns" | "creatives" | "analytics" | "invoices" | "reconciliation">("campaigns");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Creative Modal & State
  const [creatives, setCreatives] = useState<CreativeAsset[]>([]);
  const [newCreativeTitle, setNewCreativeTitle] = useState("");
  const [newCreativeImage, setNewCreativeImage] = useState("");
  const [newCreativeUrl, setNewCreativeUrl] = useState("https://");
  const [isCreativeModalOpen, setIsCreativeModalOpen] = useState(false);

  // CSV Report Export
  const handleExportCSV = useCallback(() => {
    const headers = ["Campaign ID", "Title", "Advertiser", "Position", "Status", "Total Budget (NPR)", "Impressions", "Clicks", "CTR (%)", "Spent (NPR)", "Start Date", "End Date"];
    const rows = ads.map(c => {
      const m = adAnalyticsEngine.getCampaignMetrics(c);
      return [
        c.id,
        `"${(c.title || "").replace(/"/g, '""')}"`,
        `"${(c.advertiserName || "").replace(/"/g, '""')}"`,
        c.position,
        c.status,
        c.budget?.totalBudget || 10000,
        m.totalImpressions,
        m.totalClicks,
        m.ctr,
        m.totalSpend,
        c.startDate || "",
        c.endDate || ""
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SanatanMarga_Campaign_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [ads]);

  // Form State
  const [formData, setFormData] = useState<Partial<Ad>>({
    title: "",
    advertiserName: user?.displayName || "",
    advertiserContact: user?.email || "",
    imageUrl: "",
    linkUrl: "",
    position: "sidebar",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    priority: 5,
    weight: 5,
    frequencyCap: 3,
    isActive: true,
    targetCategories: ["all"],
    targetDistricts: ["all"],
    budget: {
      totalBudget: 10000,
      pricingModel: "cpm",
      cpmRate: 150,
      cpcRate: 20
    }
  });

  // Fetch campaigns for this advertiser (or all if admin)
  const fetchAds = useCallback(async () => {
    if (authLoading) return;
    
    // Check if user is advertiser or admin
    const isAdmin = user && (user.role === "admin" || user.role === "super_admin");
    const advertiserId = user?.uid;

    let q;
    if (isAdmin) {
      q = query(collection(db, "ads"), orderBy("createdAt", "desc"));
    } else if (advertiserId) {
      q = query(collection(db, "ads"), where("advertiserId", "==", advertiserId));
    } else {
      setLoading(false);
      return;
    }

    try {
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Ad));
      setAds(docs);
      setLoading(false);
    } catch (error) {
      console.warn("Advertiser ads query fallback:", error);
      // Fallback to local snapshot engine
      const dynamic = snapshotEngine.getDynamicAds();
      setAds(dynamic);
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // Financial & Performance Summaries
  const metrics = useMemo(() => {
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalBudget = 0;
    let totalSpent = 0;
    let activeCampaigns = 0;

    ads.forEach((ad) => {
      const imp = Number(ad.impressions || 0);
      const clk = Number(ad.clicks || 0);
      totalImpressions += imp;
      totalClicks += clk;

      const budget = Number(ad.budget?.totalBudget || 5000);
      totalBudget += budget;

      let spend = 0;
      if (ad.budget?.pricingModel === "cpm") {
        spend = (imp / 1000) * Number(ad.budget.cpmRate || 150);
      } else if (ad.budget?.pricingModel === "cpc") {
        spend = clk * Number(ad.budget.cpcRate || 20);
      } else {
        spend = Math.min(budget, budget * 0.7);
      }
      totalSpent += Math.min(spend, budget);

      if (adEngine.isAdEligible(ad)) {
        activeCampaigns++;
      }
    });

    const averageCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
    const remainingBudget = Math.max(0, totalBudget - totalSpent);

    return {
      totalCampaigns: ads.length,
      activeCampaigns,
      totalImpressions,
      totalClicks,
      averageCtr,
      totalBudget: Math.round(totalBudget),
      totalSpent: Math.round(totalSpent),
      remainingBudget: Math.round(remainingBudget)
    };
  }, [ads]);

  const handleOpenModal = (ad?: Ad) => {
    if (ad) {
      setEditingAd(ad);
      setFormData({
        ...ad,
        priority: ad.priority || 5,
        frequencyCap: ad.frequencyCap || 3,
        targetCategories: ad.targetCategories || ["all"],
        targetDistricts: ad.targetDistricts || ["all"],
        budget: ad.budget || {
          totalBudget: 10000,
          pricingModel: "cpm",
          cpmRate: 150,
          cpcRate: 20
        }
      });
    } else {
      setEditingAd(null);
      setFormData({
        title: "",
        advertiserName: user?.displayName || "व्यावसायिक साझेदार",
        advertiserContact: user?.email || "",
        imageUrl: "",
        linkUrl: "https://",
        position: "sidebar",
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        priority: 5,
        weight: 5,
        frequencyCap: 3,
        isActive: true,
        targetCategories: ["all"],
        targetDistricts: ["all"],
        budget: {
          totalBudget: 10000,
          pricingModel: "cpm",
          cpmRate: 150,
          cpcRate: 20
        }
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveCampaign = async () => {
    if (!formData.title || !formData.imageUrl || !formData.linkUrl) {
      setAlertInfo({ show: true, title: "जानकारी अपूर्ण", message: "कृपया अभियानको शीर्षक, तस्बिर ब्यानर र लिंक URL प्रविष्ट गर्नुहोस्।", type: "error" });
      return;
    }

    try {
      const isAdmin = user && (user.role === "admin" || user.role === "super_admin" || user.role === "editor" || user.role === "chief_editor");
      const targetAdId = editingAd?.id || `adv_${user?.uid || 'guest'}_${Date.now()}`;
      const nowIso = new Date().toISOString();

      const newAdObj: Ad = {
        id: targetAdId,
        title: formData.title,
        advertiserId: user?.uid || "self_service_advertiser",
        advertiserName: formData.advertiserName || user?.displayName || "व्यावसायिक साझेदार",
        advertiserContact: formData.advertiserContact || user?.email || "",
        imageUrl: formData.imageUrl,
        linkUrl: formData.linkUrl,
        position: (formData.position as AdPosition) || "sidebar",
        startDate: formData.startDate,
        endDate: formData.endDate,
        priority: Number(formData.priority) || 5,
        weight: Number(formData.priority) || 5,
        frequencyCap: Number(formData.frequencyCap) || 3,
        impressions: editingAd?.impressions || 0,
        clicks: editingAd?.clicks || 0,
        ctr: editingAd?.ctr || 0,
        targetCategories: formData.targetCategories || ["all"],
        targetDistricts: formData.targetDistricts || ["all"],
        isActive: formData.isActive !== false,
        status: (editingAd?.status ? (isAdmin ? editingAd.status : "pending_review") : (isAdmin ? "active" : "pending_review")) as any,
        budget: formData.budget || {
          totalBudget: 10000,
          pricingModel: "cpm",
          cpmRate: 150,
          cpcRate: 20
        },
        createdAt: editingAd?.createdAt || nowIso,
        updatedAt: nowIso
      };

      // 1. Instant preview in Snapshot OS
      snapshotEngine.removeDynamicAd(targetAdId);
      snapshotEngine.injectAds([newAdObj]);

      // 2. Queue for durable sync
      offlineQueue.queueAction({
        type: editingAd && editingAd.id ? "AD_UPDATE" : "AD_CREATE",
        collection: "ads",
        docId: targetAdId,
        data: newAdObj
      });

      // 3. Persist to Firestore
      try {
        await setDoc(doc(db, "ads", targetAdId), newAdObj as any, { merge: true });
      } catch (e) {}

      // 4. Trigger snapshot OS rebuild
      snapshotEngine.triggerPublishRebuild("advertiser_portal_save");
      await fetchAds();

      setIsModalOpen(false);
      const alertMsg = isAdmin 
        ? "तपाईंको नयाँ विज्ञापन अभियान सफलतापूर्वक सक्रिय भयो।" 
        : "तपाईंको नयाँ विज्ञापन अभियान सफलतापूर्वक दर्ता भयो र व्यवस्थापकको स्वीकृतिको पर्खाइमा छ।";
      setAlertInfo({ 
        show: true, 
        title: isAdmin ? "सफलतापूर्वक प्रकाशित!" : "स्वीकृतिको पर्खाइमा (Pending Review)!", 
        message: alertMsg, 
        type: "success" 
      });
    } catch (error: any) {
      console.error("Error saving advertiser campaign:", error);
      setAlertInfo({ show: true, title: "त्रुटि", message: "अभियान सुरक्षित गर्दा समस्या आयो।", type: "error" });
    }
  };

  const handleDeleteCampaign = async (adId: string) => {
    if (window.confirm("के तपाईं यो विज्ञापन अभियान रद्द वा हटाउन चाहनुहुन्छ?")) {
      try {
        try {
          await deleteDoc(doc(db, "ads", adId));
        } catch (e) {}
        snapshotEngine.removeDynamicAd(adId);
        offlineQueue.queueAction({
          type: "AD_DELETE",
          collection: "ads",
          docId: adId
        });
        snapshotEngine.triggerPublishRebuild("advertiser_portal_delete");
        await fetchAds();
        setAlertInfo({ show: true, title: "अभियान हटाइयो", message: "विज्ञापन अभियान सफलतापूर्वक हटाइएको छ।", type: "success" });
      } catch (e) {
        setAlertInfo({ show: true, title: "त्रुटि", message: "अभियान हटाउन सकिएन।", type: "error" });
      }
    }
  };

  const filteredCampaigns = useMemo(() => {
    return ads.filter((ad) => {
      const status = adEngine.calculateAdStatus(ad);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const queryStr = searchTerm.toLowerCase();
        const matchesTitle = (ad.title || "").toLowerCase().includes(queryStr);
        const matchesPosition = (ad.position || "").toLowerCase().includes(queryStr);
        if (!matchesTitle && !matchesPosition) return false;
      }
      return true;
    });
  }, [ads, statusFilter, searchTerm]);

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* TOP BAR / BREADCRUMBS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Megaphone size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black border border-amber-500/20">
                  SANATAN REVENUE OS & ADVERTISER NETWORK
                </span>
                <span className="text-xs font-bold text-muted-text">• नेपालको प्रथम ज्ञान तथा मिडिया नेटवर्क</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-card-foreground mt-0.5 tracking-tight">
                विज्ञापन, प्रायोजन तथा अभियान ड्यासबोर्ड
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 rounded-xl bg-muted-area hover:bg-muted-area/80 text-muted-text hover:text-card-foreground font-bold text-xs flex items-center gap-1.5 transition-all border border-border-theme"
            >
              गृहपृष्ठमा फर्कनुहोस्
            </Link>
            <button
              onClick={() => {
                setMainMode("portal");
                handleOpenModal();
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
            >
              <Plus size={16} /> नयाँ अभियान सुरु गर्नुहोस् (Launch Campaign)
            </button>
          </div>
        </div>

        {/* DUAL MODE VIEW SELECTOR (PITCH VS PORTAL) */}
        <div className="flex items-center gap-3 bg-muted-area/50 p-1.5 rounded-2xl border border-border-theme w-fit">
          <button
            onClick={() => setMainMode("pitch")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              mainMode === "pitch"
                ? "bg-amber-600 text-white shadow-md"
                : "text-muted-text hover:text-card-foreground"
            }`}
          >
            <Sparkles size={16} />
            <span>व्यावसायिक सम्भावना तथा नेटवर्क प्रस्ताव (Network Pitch & Products)</span>
          </button>

          <button
            onClick={() => setMainMode("portal")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              mainMode === "portal"
                ? "bg-amber-600 text-white shadow-md"
                : "text-muted-text hover:text-card-foreground"
            }`}
          >
            <Layers size={16} />
            <span>स्व-सेवा अभियान ड्यासबोर्ड (Active Campaign Portal)</span>
          </button>
        </div>

        {/* RENDER ACTIVE MODE */}
        {mainMode === "pitch" ? (
          <AdvertiserPitchSection onGoToCampaignManager={() => setMainMode("portal")} />
        ) : (
          <div className="space-y-8">
        {/* METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Impressions */}
          <div className="bg-card border border-border-theme rounded-3xl p-5 shadow-sm space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-muted-text">
              <span className="text-xs font-bold uppercase tracking-wider">कुल अवलोकन (Impressions)</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                <Eye size={18} />
              </div>
            </div>
            <div className="text-3xl font-black text-card-foreground font-mono">
              {metrics.totalImpressions.toLocaleString("ne-NP")}
            </div>
            <p className="text-[11px] text-blue-600 font-bold flex items-center gap-1">
              <TrendingUp size={12} /> {metrics.activeCampaigns} सक्रिय अभियानबाट प्रमाणित भ्युज
            </p>
          </div>

          {/* Card 2: Clicks & CTR */}
          <div className="bg-card border border-border-theme rounded-3xl p-5 shadow-sm space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-muted-text">
              <span className="text-xs font-bold uppercase tracking-wider">क्लिक तथा CTR दर</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                <MousePointerClick size={18} />
              </div>
            </div>
            <div className="text-3xl font-black text-card-foreground font-mono">
              {metrics.totalClicks.toLocaleString("ne-NP")}{" "}
              <span className="text-sm font-bold text-muted-text">({metrics.averageCtr}% CTR)</span>
            </div>
            <p className="text-[11px] text-purple-600 font-bold">
              उच्च प्रभावकारी रूपान्तरण दर
            </p>
          </div>

          {/* Card 3: Total Spend */}
          <div className="bg-card border border-border-theme rounded-3xl p-5 shadow-sm space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-muted-text">
              <span className="text-xs font-bold uppercase tracking-wider">कुल खर्च (Spend)</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                <DollarSign size={18} />
              </div>
            </div>
            <div className="text-3xl font-black text-card-foreground font-mono">
              रू {metrics.totalSpent.toLocaleString("ne-NP")}
            </div>
            <p className="text-[11px] text-emerald-600 font-bold">
              कुल बजेट: रू {metrics.totalBudget.toLocaleString("ne-NP")}
            </p>
          </div>

          {/* Card 4: Remaining Budget */}
          <div className="bg-card border border-border-theme rounded-3xl p-5 shadow-sm space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-muted-text">
              <span className="text-xs font-bold uppercase tracking-wider">बाँकी ब्यालेन्स (Remaining)</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="text-3xl font-black text-card-foreground font-mono">
              रू {metrics.remainingBudget.toLocaleString("ne-NP")}
            </div>
            <p className="text-[11px] text-amber-600 font-bold">
              सुरक्षित विज्ञापन क्रेडिट
            </p>
          </div>

        </div>

        {/* NAVIGATION TABS & FILTER BAR */}
        <div className="bg-card border border-border-theme rounded-3xl p-6 shadow-sm space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
            
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "campaigns", label: "अभियानहरू (Campaigns)", icon: Megaphone },
                { id: "creatives", label: "विज्ञापन एसेटहरू (Creatives)", icon: ImageIcon },
                { id: "analytics", label: "स्थान अनुसार प्रभावकारिता (Placements)", icon: BarChart3 },
                { id: "invoices", label: "बिल तथा भ्याट (Invoices)", icon: FileText },
                { id: "reconciliation", label: "वित्तीय हिसावकिताब (Reconciliation)", icon: ShieldCheck }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                        : "bg-muted-area text-muted-text hover:text-card-foreground"
                    }`}
                  >
                    <Icon size={14} /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Filter Search & Export CSV */}
            {activeTab === "campaigns" && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title="सबै अभियानको विस्तृत रिपोर्ट CSV ढाँचामा डाउनलोड गर्नुहोस्"
                >
                  <Download size={14} /> CSV प्रतिवेदन (Export CSV)
                </button>
                <div className="relative flex items-center bg-muted-area/60 border border-border-theme rounded-xl px-3 py-1.5 w-60">
                  <Search size={14} className="text-muted-text mr-2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="अभियान खोज्नुहोस्..."
                    className="bg-transparent text-xs font-medium text-card-foreground placeholder:text-muted-foreground focus:outline-none w-full"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-muted-area border border-border-theme rounded-xl px-3 py-1.5 text-xs font-bold text-card-foreground focus:outline-none cursor-pointer"
                >
                  <option value="all">सबै स्थिति (All)</option>
                  <option value="active">सक्रिय (Active)</option>
                  <option value="scheduled">तालिकाबद्ध (Scheduled)</option>
                  <option value="paused">रोकिएको (Paused)</option>
                  <option value="expired">समाप्त (Expired)</option>
                </select>
              </div>
            )}
          </div>

          {/* TAB 1: CAMPAIGNS LIST */}
          {activeTab === "campaigns" && (
            <div className="space-y-4">
              {filteredCampaigns.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border-theme rounded-2xl bg-muted-area/30">
                  <Megaphone size={40} className="mx-auto text-muted-text mb-3 opacity-50" />
                  <p className="text-sm font-bold text-card-foreground">कुनै विज्ञापन अभियान फेला परेन।</p>
                  <p className="text-xs text-muted-text mt-1">तपाईं आफ्नो व्यवसाय वा ब्रान्ड प्रवर्द्धन गर्न नयाँ विज्ञापन सिर्जना गर्न सक्नुहुन्छ।</p>
                  <button
                    onClick={() => handleOpenModal()}
                    className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    नयाँ अभियान सुरु गर्नुहोस्
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCampaigns.map((ad) => {
                    const status = adEngine.calculateAdStatus(ad);
                    const placementInfo = PLACEMENT_OPTIONS[ad.position] || { label: ad.position, dimensions: "" };
                    const imp = Number(ad.impressions || 0);
                    const clk = Number(ad.clicks || 0);
                    const ctr = imp > 0 ? ((clk / imp) * 100).toFixed(2) : "0.00";

                    return (
                      <div
                        key={ad.id}
                        className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm hover:border-amber-500/40 transition-all flex flex-col justify-between gap-4 relative group"
                      >
                        <div className="space-y-3">
                          {/* Header row */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-16 rounded-xl bg-muted-area border border-border-theme overflow-hidden flex items-center justify-center shrink-0">
                                {ad.imageUrl?.trim() ? (
                                  <img src={ad.imageUrl || null} alt={ad.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <ImageIcon size={24} className="text-muted-text" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    status === "active" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                                    status === "scheduled" ? "bg-blue-500/10 text-blue-600 border border-blue-500/20" :
                                    status === "paused" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                                    "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                  }`}>
                                    {status === "active" ? "सक्रिय (Live)" : status === "scheduled" ? "तालिकाबद्ध" : status === "paused" ? "रोकिएको" : "समाप्त"}
                                  </span>
                                  <span className="text-[10px] font-bold text-muted-text">
                                    {placementInfo.label}
                                  </span>
                                </div>
                                <h3 className="text-sm font-black text-card-foreground mt-1 line-clamp-1">
                                  {ad.title}
                                </h3>
                                <p className="text-[11px] text-muted-text font-mono truncate max-w-xs">
                                  {ad.linkUrl}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setSelectedReportAd(ad)}
                                title="विस्तृत कार्यसम्पादन प्रतिवेदन (Performance Report)"
                                className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 transition-all cursor-pointer"
                              >
                                <BarChart3 size={14} />
                              </button>
                              <button
                                onClick={() => setSelectedTimelineAd(ad)}
                                title="अभियान माइलस्टोन र समयरेखा (Timeline & Milestones)"
                                className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 transition-all cursor-pointer"
                              >
                                <Clock size={14} />
                              </button>
                              <button
                                onClick={() => setSelectedInvoiceAd(ad)}
                                title="बिल तथा अडिट स्टेटमेन्ट (View Invoice)"
                                className="p-1.5 rounded-lg bg-muted-area hover:bg-muted-area/80 text-muted-text hover:text-card-foreground transition-all cursor-pointer"
                              >
                                <FileText size={14} />
                              </button>
                              <button
                                onClick={() => handleOpenModal(ad)}
                                title="सम्पादन गर्नुहोस्"
                                className="p-1.5 rounded-lg bg-muted-area hover:bg-muted-area/80 text-muted-text hover:text-card-foreground transition-all cursor-pointer"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => ad.id && handleDeleteCampaign(ad.id)}
                                title="हटाउनुहोस्"
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 transition-all cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-2 bg-muted-area/50 p-2.5 rounded-xl border border-border-theme/50 text-center font-mono">
                            <div>
                              <span className="text-[10px] font-bold text-muted-text block">अवलोकन</span>
                              <span className="text-xs font-black text-card-foreground">{imp.toLocaleString("ne-NP")}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-muted-text block">क्लिक</span>
                              <span className="text-xs font-black text-card-foreground">{clk.toLocaleString("ne-NP")}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-muted-text block">CTR दर</span>
                              <span className="text-xs font-black text-primary">{ctr}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Footer info */}
                        <div className="flex items-center justify-between text-[11px] text-muted-text pt-2 border-t border-border-theme font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {ad.startDate || "तत्काल"} देखि {ad.endDate || "असीमित"}
                          </span>
                          <span className="font-bold text-emerald-600">
                            बजेट: रू {Number(ad.budget?.totalBudget || 5000).toLocaleString("ne-NP")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PLACEMENT & PERFORMANCE ANALYSIS */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-muted-area/40 border border-border-theme space-y-1">
                  <span className="text-xs font-bold text-muted-text">सर्वश्रेष्ठ प्रदर्शनकारी स्थान</span>
                  <p className="text-lg font-black text-card-foreground">समाचार भित्र (Article Inline)</p>
                  <p className="text-[11px] text-emerald-600 font-bold">औसत CTR: 3.4%</p>
                </div>
                <div className="p-4 rounded-2xl bg-muted-area/40 border border-border-theme space-y-1">
                  <span className="text-xs font-bold text-muted-text">उच्चतम भ्युज स्थान</span>
                  <p className="text-lg font-black text-card-foreground">मुख्य हेडर (Header Top)</p>
                  <p className="text-[11px] text-blue-600 font-bold">प्रति दिन ४०,०००+ पाठक</p>
                </div>
                <div className="p-4 rounded-2xl bg-muted-area/40 border border-border-theme space-y-1">
                  <span className="text-xs font-bold text-muted-text">उच्च प्रभावकारी ब्रान्डिङ</span>
                  <p className="text-lg font-black text-card-foreground">ब्याकग्राउन्ड स्किन (Wallpaper)</p>
                  <p className="text-[11px] text-amber-600 font-bold">डेस्कटप १००% भिजिविलिटी</p>
                </div>
              </div>

              {/* Placements Rate Card & Availability */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border-theme text-muted-text font-bold uppercase tracking-wider">
                      <th className="pb-3">विज्ञापन स्थान (Placement)</th>
                      <th className="pb-3">आकार (Dimensions)</th>
                      <th className="pb-3">श्रेणी (Category)</th>
                      <th className="pb-3">अनुमानित अवलोकन (Impressions)</th>
                      <th className="pb-3">न्यूनतम बजेट (Min Budget)</th>
                      <th className="pb-3 text-right">कार्य (Action)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-theme/60">
                    {Object.entries(PLACEMENT_OPTIONS).map(([posKey, opt]) => (
                      <tr key={posKey} className="hover:bg-muted-area/30 transition-colors">
                        <td className="py-3 font-black text-card-foreground">{opt.label}</td>
                        <td className="py-3 font-mono text-muted-text">{opt.dimensions}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-md bg-muted-area font-bold text-[10px] text-muted-text">
                            {opt.category}
                          </span>
                        </td>
                        <td className="py-3 font-bold text-blue-600">{opt.estImpressions}</td>
                        <td className="py-3 font-bold text-emerald-600 font-mono">रू {opt.minBudget.toLocaleString("ne-NP")}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              handleOpenModal();
                              setFormData(prev => ({ ...prev, position: posKey as AdPosition, budget: { ...prev.budget, totalBudget: opt.minBudget } }));
                            }}
                            className="px-3 py-1 bg-amber-600/10 hover:bg-amber-600 text-amber-600 hover:text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer"
                          >
                            बुक गर्नुहोस्
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: INVOICES & BILLING STATEMENTS */}
          {activeTab === "invoices" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-card-foreground">विज्ञापन बिल तथा कार्यसम्पादन स्टेटमेन्ट</h3>
                  <p className="text-xs text-muted-text">प्रमाणित अवलोकन, क्लिक तथा भ्याट बिल विवरण।</p>
                </div>
              </div>

              {ads.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border-theme rounded-2xl">
                  <FileText size={32} className="mx-auto text-muted-text mb-2 opacity-50" />
                  <p className="text-xs font-bold text-muted-text">कुनै बिल उपलब्ध छैन।</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ads.map((ad) => {
                    const budget = Number(ad.budget?.totalBudget || 5000);
                    const vat = Math.round(budget * 0.13);
                    const grandTotal = budget + vat;

                    return (
                      <div
                        key={ad.id}
                        className="bg-card border border-border-theme rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-500/30 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">
                              INVOICE #{ad.id?.slice(-6).toUpperCase()}
                            </span>
                            <span className="text-xs font-black text-card-foreground">{ad.title}</span>
                          </div>
                          <p className="text-xs text-muted-text">
                            अवधि: {ad.startDate || "२०२६-०८-०१"} देखि {ad.endDate || "२०२६-०८-३१"} • अवलोकन: {Number(ad.impressions || 0).toLocaleString("ne-NP")} • क्लिक: {Number(ad.clicks || 0).toLocaleString("ne-NP")}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="text-right font-mono">
                            <span className="text-xs font-black text-card-foreground block">
                              रू {grandTotal.toLocaleString("ne-NP")}
                            </span>
                            <span className="text-[10px] text-muted-text font-bold">
                              (१३% भ्याट सहित)
                            </span>
                          </div>

                          <button
                            onClick={() => setSelectedInvoiceAd(ad)}
                            className="px-3.5 py-1.5 bg-muted-area hover:bg-amber-600 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-border-theme cursor-pointer"
                          >
                            <Printer size={14} /> बिल प्रिन्ट
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATIVE MANAGEMENT OS */}
          {activeTab === "creatives" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-card-foreground">विज्ञापन एसेट तथा सिर्जनात्मक सामाग्री व्यवस्थापन (Creative OS)</h3>
                  <p className="text-xs text-muted-text">अपलोड, स्वतः-प्रमाणीकरण, संस्करण नियन्त्रण तथा स्वीकृतिको स्थिति।</p>
                </div>
                <button
                  onClick={() => setIsCreativeModalOpen(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus size={14} /> नयाँ एसेट अपलोड (Upload Creative)
                </button>
              </div>

              {/* Creative Upload Modal */}
              {isCreativeModalOpen && (
                <div className="p-5 rounded-2xl bg-muted-area/50 border border-border-theme space-y-4">
                  <h4 className="text-sm font-black text-card-foreground">नयाँ ब्यानर वा भिडियो एसेट थप्नुहोस्</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="एसेटको नाम (उदा: Ncell 5G Banner)"
                      value={newCreativeTitle}
                      onChange={(e) => setNewCreativeTitle(e.target.value)}
                      className="px-3.5 py-2 rounded-xl bg-card border border-border-theme text-xs"
                    />
                    <input
                      type="url"
                      placeholder="तस्बिर URL (HTTPS protocol mandatory)"
                      value={newCreativeImage}
                      onChange={(e) => setNewCreativeImage(e.target.value)}
                      className="px-3.5 py-2 rounded-xl bg-card border border-border-theme text-xs"
                    />
                    <input
                      type="url"
                      placeholder="गन्तव्य URL (https://...)"
                      value={newCreativeUrl}
                      onChange={(e) => setNewCreativeUrl(e.target.value)}
                      className="px-3.5 py-2 rounded-xl bg-card border border-border-theme text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setIsCreativeModalOpen(false)}
                      className="px-3.5 py-1.5 rounded-xl bg-muted-area text-xs font-bold text-muted-text hover:text-card-foreground cursor-pointer"
                    >
                      रद्द गर्नुहोस्
                    </button>
                    <button
                      onClick={() => {
                        if (!newCreativeTitle || !newCreativeImage) return;
                        creativeService.createCreative({
                          advertiserId: user?.uid || "adv-ncell",
                          advertiserName: user?.displayName || "व्यावसायिक साझेदार",
                          title: newCreativeTitle,
                          imageUrl: newCreativeImage,
                          destinationUrl: newCreativeUrl
                        });
                        setCreatives(creativeService.getCreativesForAdvertiser(user?.uid || "adv-ncell", true));
                        setIsCreativeModalOpen(false);
                        setNewCreativeTitle("");
                        setNewCreativeImage("");
                        setAlertInfo({ show: true, title: "एसेट दर्ता भयो", message: "एसेट स्वतः-प्रमाणीकरण उत्तीर्ण गरी समीक्षार्थ दर्ता भयो।", type: "success" });
                      }}
                      className="px-4 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold cursor-pointer"
                    >
                      सुरक्षित तथा समीक्षा गर्नुहोस्
                    </button>
                  </div>
                </div>
              )}

              {/* Creative Assets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {creativeService.getCreativesForAdvertiser(user?.uid || "adv-ncell", true).map((cr) => (
                  <div key={cr.id} className="bg-card border border-border-theme rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            cr.status === "active" ? "bg-emerald-500/10 text-emerald-600" :
                            cr.status === "approved" ? "bg-blue-500/10 text-blue-600" :
                            cr.status === "review" ? "bg-amber-500/10 text-amber-600" : "bg-rose-500/10 text-rose-600"
                          }`}>
                            v{cr.version} • {cr.status}
                          </span>
                          <span className="text-[10px] font-bold text-muted-text font-mono">
                            {cr.dimensions.width}x{cr.dimensions.height} px
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-card-foreground mt-1">{cr.title}</h4>
                      </div>
                      <span className="text-[10px] text-muted-text font-mono">{cr.aspectRatio}</span>
                    </div>

                    <div className="h-32 bg-muted-area/50 border border-border-theme rounded-xl overflow-hidden flex items-center justify-center">
                      <img src={cr.imageUrl} alt={cr.title} className="max-h-full object-contain" referrerPolicy="no-referrer" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-text font-mono pt-2 border-t border-border-theme">
                      <span>HTTPS: {cr.httpsCompliant ? "✓ Valid" : "✕ Insecure"}</span>
                      <span>प्रायोजित नाम: {cr.advertiserName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: REVENUE OS FINANCIAL RECONCILIATION */}
          {activeTab === "reconciliation" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-card-foreground">राजस्व तथा हिसावकिताब मिलान अटोमेशन (Reconciliation OS)</h3>
                  <p className="text-xs text-muted-text">अनुबन्ध बजेट, प्रवाहित विज्ञापन, उठान भएको रकम तथा दोहोरो खाता सन्तुलन मिलान विवरण।</p>
                </div>
              </div>

              <div className="space-y-4">
                {ads.map((ad) => {
                  const recon = revenueReconciliationEngine.reconcileCampaign(ad);
                  return (
                    <div key={ad.id} className="bg-card border border-border-theme rounded-2xl p-5 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between border-b border-border-theme pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase">
                              CAMPAIGN #{ad.id}
                            </span>
                            <span className="text-xs font-bold text-muted-text">• {ad.position}</span>
                          </div>
                          <h4 className="text-sm font-black text-card-foreground mt-0.5">{ad.title}</h4>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 ${
                            recon.reconciliationPassed 
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                              : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                          }`}>
                            <ShieldCheck size={14} />
                            {recon.reconciliationPassed ? "प्रमाणित सन्तुलित (RECONCILED)" : "हिसाब असन्तुलन (VIOLATION)"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-center font-mono">
                        <div className="bg-muted-area/40 p-2.5 rounded-xl border border-border-theme/60">
                          <span className="text-[10px] text-muted-text font-bold block">सम्पन्न सम्झौता</span>
                          <span className="text-xs font-black text-card-foreground">रू {recon.contractValue.toLocaleString("ne-NP")}</span>
                        </div>
                        <div className="bg-muted-area/40 p-2.5 rounded-xl border border-border-theme/60">
                          <span className="text-[10px] text-muted-text font-bold block">प्रवाहित मूल्य</span>
                          <span className="text-xs font-black text-blue-600">रू {recon.deliveredValue.toLocaleString("ne-NP")}</span>
                        </div>
                        <div className="bg-muted-area/40 p-2.5 rounded-xl border border-border-theme/60">
                          <span className="text-[10px] text-muted-text font-bold block">जारी बिल रकम</span>
                          <span className="text-xs font-black text-purple-600">रू {recon.invoicedValue.toLocaleString("ne-NP")}</span>
                        </div>
                        <div className="bg-muted-area/40 p-2.5 rounded-xl border border-border-theme/60">
                          <span className="text-[10px] text-muted-text font-bold block">उठान नगद</span>
                          <span className="text-xs font-black text-emerald-600">रू {recon.collectedValue.toLocaleString("ne-NP")}</span>
                        </div>
                        <div className="bg-muted-area/40 p-2.5 rounded-xl border border-border-theme/60">
                          <span className="text-[10px] text-muted-text font-bold block">TDS कट्टी (1.5%)</span>
                          <span className="text-xs font-black text-amber-600">रू {recon.tdsWithheldValue.toLocaleString("ne-NP")}</span>
                        </div>
                        <div className="bg-muted-area/40 p-2.5 rounded-xl border border-border-theme/60">
                          <span className="text-[10px] text-muted-text font-bold block">बाँकी बक्यौता</span>
                          <span className="text-xs font-black text-rose-600">रू {recon.outstandingValue.toLocaleString("ne-NP")}</span>
                        </div>
                      </div>

                      {recon.violations.length > 0 && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
                          <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                            <AlertCircle size={14} /> अटोमेशन उल्लङ्घनहरू:
                          </span>
                          <ul className="list-disc list-inside text-[11px] text-rose-600 space-y-0.5">
                            {recon.violations.map((v, idx) => <li key={idx}>{v}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </div>

      {/* CREATE / EDIT CAMPAIGN MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border-theme rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border-theme pb-4">
                <div>
                  <h2 className="text-xl font-black text-card-foreground">
                    {editingAd ? "अभियान सम्पादन गर्नुहोस्" : "नयाँ विज्ञापन अभियान सिर्जना"}
                  </h2>
                  <p className="text-xs text-muted-text mt-0.5">
                    सनातन मिडिया नेटवर्कमा आफ्नो विज्ञापन लक्षित पाठकहरू समक्ष पुर्‍याउनुहोस्।
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl bg-muted-area text-muted-text hover:text-card-foreground cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                
                {/* Title */}
                <div className="space-y-1">
                  <label className="font-bold text-card-foreground block">अभियानको शीर्षक (Campaign Title) *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="उदा: डाबर नेपाल दशैँ अफर २०२६"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted-area/50 border border-border-theme text-card-foreground focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Placement & Pricing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-card-foreground block">विज्ञापन स्थान (Placement) *</label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value as AdPosition })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {Object.entries(PLACEMENT_OPTIONS).map(([key, opt]) => (
                        <option key={key} value={key}>{opt.label} - ({opt.dimensions})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-card-foreground block">मूल्य निर्धारण मोडल (Pricing Model)</label>
                    <select
                      value={formData.budget?.pricingModel || "cpm"}
                      onChange={(e) => setFormData({
                        ...formData,
                        budget: { ...formData.budget, pricingModel: e.target.value as any }
                      })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="cpm">CPM (प्रति १००० अवलोकन - NPR 150)</option>
                      <option value="cpc">CPC (प्रति क्लिक - NPR 20)</option>
                      <option value="flat_rate">फ्ल्याट मासिक दर (Flat Rate)</option>
                    </select>
                  </div>
                </div>

                {/* Image Banner Selection */}
                <div className="space-y-1">
                  <label className="font-bold text-card-foreground block">ब्यानर तस्बिर (Banner Image URL) *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-muted-area/50 border border-border-theme text-card-foreground focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="px-4 py-2.5 bg-muted-area hover:bg-muted-area/80 text-muted-text hover:text-card-foreground font-bold rounded-xl border border-border-theme shrink-0 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ImageIcon size={14} /> मिडिया ग्यालरी
                    </button>
                  </div>
                  {formData.imageUrl?.trim() && (
                    <div className="mt-2 p-2 bg-muted-area/30 border border-border-theme rounded-xl overflow-hidden max-h-36 flex items-center justify-center">
                      <img src={formData.imageUrl || null} alt="Preview" className="max-h-32 object-contain" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>

                {/* Destination Link */}
                <div className="space-y-1">
                  <label className="font-bold text-card-foreground block">गन्तव्य लिंक (Destination URL) *</label>
                  <input
                    type="url"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    placeholder="https://yourwebsite.com/landing-page"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted-area/50 border border-border-theme text-card-foreground focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Date Scheduling */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-card-foreground block">सुरु मिति (Start Date)</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground focus:outline-none"
                    >
                    </input>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-card-foreground block">समाप्त मिति (End Date)</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground focus:outline-none"
                    >
                    </input>
                  </div>
                </div>

                {/* Budget & Frequency Capping */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-card-foreground block">कुल बजेट (Total Budget in NPR)</label>
                    <input
                      type="number"
                      value={formData.budget?.totalBudget || 10000}
                      onChange={(e) => setFormData({
                        ...formData,
                        budget: { ...formData.budget, totalBudget: Number(e.target.value) }
                      })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-card-foreground block">फ्रिक्वेन्सी क्याप (Max Views/User/Day)</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={formData.frequencyCap || 3}
                      onChange={(e) => setFormData({ ...formData, frequencyCap: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Geo / District Targeting */}
                <div className="space-y-1">
                  <label className="font-bold text-card-foreground block">लक्षित प्रदेश तथा जिल्ला (Geo-Targeting)</label>
                  <select
                    value={formData.targetDistricts?.[0] || "all"}
                    onChange={(e) => setFormData({ ...formData, targetDistricts: [e.target.value] })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="all">सबै नेपाल (All Nepal)</option>
                    {Object.entries(NEPAL_PROVINCES).map(([pKey, pVal]) => (
                      <optgroup key={pKey} label={`${pVal.nameNe} (${pVal.nameEn})`}>
                        {pVal.districts.map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-theme">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-muted-area text-muted-text hover:text-card-foreground font-bold text-xs cursor-pointer"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  type="button"
                  onClick={handleSaveCampaign}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-lg shadow-amber-600/20 cursor-pointer"
                >
                  अभियान सुरक्षित र सक्रिय गर्नुहोस्
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MEDIA PICKER MODAL */}
      <MediaAssetPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(asset) => {
          setFormData(prev => ({ ...prev, imageUrl: asset.url }));
          setIsMediaPickerOpen(false);
        }}
      />

      {/* INVOICE & AUDIT PRINT MODAL */}
      <AnimatePresence>
        {selectedInvoiceAd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border-theme rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl"
            >
              <div className="border-b-2 border-primary pb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black text-card-foreground">सनातन मार्ग मिडिया प्रा. लि.</h2>
                  <p className="text-xs text-muted-text font-medium">काठमाडौँ, नेपाल • प्यान नं: ६०९८१२३४५</p>
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-1">
                    कर बीजक (TAX INVOICE) & PERFORMANCE CERTIFICATE
                  </p>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="font-bold text-muted-text block">बीजक नं: #{selectedInvoiceAd.id?.slice(-8).toUpperCase()}</span>
                  <span className="text-[10px] text-muted-text">मिति: {new Date().toISOString().slice(0, 10)}</span>
                </div>
              </div>

              <div className="bg-muted-area/40 p-4 rounded-2xl border border-border-theme text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-muted-text">विज्ञापनदाता:</span>
                  <span className="font-black text-card-foreground">{selectedInvoiceAd.advertiserName || "Sanatan Partner"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-muted-text">अभियान:</span>
                  <span className="font-black text-card-foreground">{selectedInvoiceAd.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-muted-text">स्थान (Placement):</span>
                  <span className="font-bold text-card-foreground">{selectedInvoiceAd.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-muted-text">प्रमाणित अवलोकन (Verified Impressions):</span>
                  <span className="font-black text-primary font-mono">{Number(selectedInvoiceAd.impressions || 0).toLocaleString("ne-NP")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-muted-text">प्रमाणित क्लिक (Verified Clicks):</span>
                  <span className="font-black text-card-foreground font-mono">{Number(selectedInvoiceAd.clicks || 0).toLocaleString("ne-NP")}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-border-theme pt-4 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-text font-sans font-bold">विज्ञापन शुल्क (Subtotal):</span>
                  <span className="font-black text-card-foreground">रू {Number(selectedInvoiceAd.budget?.totalBudget || 5000).toLocaleString("ne-NP")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-text font-sans font-bold">१३% मूल्य अभिवृद्धि कर (VAT 13%):</span>
                  <span className="font-black text-card-foreground">रू {Math.round(Number(selectedInvoiceAd.budget?.totalBudget || 5000) * 0.13).toLocaleString("ne-NP")}</span>
                </div>
                <div className="flex justify-between text-sm font-black border-t border-border-theme pt-2 text-emerald-600">
                  <span className="font-sans font-bold">जम्मा रकम (Grand Total):</span>
                  <span>रू {(Number(selectedInvoiceAd.budget?.totalBudget || 5000) + Math.round(Number(selectedInvoiceAd.budget?.totalBudget || 5000) * 0.13)).toLocaleString("ne-NP")}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border-theme">
                <span className="text-[10px] text-muted-text font-medium">
                  ✓ Snapshot OS द्वारा डिजिटल रूपमा प्रमाणित
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedInvoiceAd(null)}
                    className="px-4 py-2 rounded-xl bg-muted-area text-muted-text hover:text-card-foreground font-bold text-xs cursor-pointer"
                  >
                    बन्द गर्नुहोस्
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Printer size={14} /> प्रिन्ट गर्नुहोस्
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PERFORMANCE REPORT MODAL */}
      <AnimatePresence>
        {selectedReportAd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border-theme rounded-3xl p-6 sm:p-8 max-w-4xl w-full my-8 space-y-6 shadow-2xl relative"
            >
              <CampaignPerformanceReport
                ad={selectedReportAd}
                onClose={() => setSelectedReportAd(null)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MILESTONE TIMELINE MODAL */}
      <AnimatePresence>
        {selectedTimelineAd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border-theme rounded-3xl p-6 sm:p-8 max-w-3xl w-full my-8 space-y-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-border-theme pb-4">
                <h3 className="text-base sm:text-lg font-black text-card-foreground">
                  अभियान समयरेखा तथा माइलस्टोन विवरण (Campaign Lifecycle & Milestones)
                </h3>
                <button
                  onClick={() => setSelectedTimelineAd(null)}
                  className="px-3 py-1.5 rounded-xl bg-muted-area text-muted-text hover:text-card-foreground font-bold text-xs cursor-pointer"
                >
                  बन्द (Close)
                </button>
              </div>

              <CampaignMilestoneTimeline ad={selectedTimelineAd} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ALERT MODAL */}
      <AlertModal
        isOpen={alertInfo.show}
        onClose={() => setAlertInfo({ ...alertInfo, show: false })}
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
      />
    </div>
  );
}
