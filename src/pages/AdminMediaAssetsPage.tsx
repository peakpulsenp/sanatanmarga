import React, { useState, useEffect } from "react";
import {
  Upload,
  Search,
  Grid,
  List as ListIcon,
  Folder,
  Tag,
  Database,
  Sparkles,
  Layers,
  RefreshCw,
  Server,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Plus,
  Trash2,
  Archive,
  Radio,
  Tv,
  Volume2,
  Play,
  Pause,
  BarChart3,
  AlertCircle,
  Copy,
  Check,
  Eye,
  FileText,
  Video,
  Music,
  File as FileIcon,
  X,
  Filter,
  ArrowRight,
  Wifi,
  Sliders,
  Calendar
} from "lucide-react";
import { MediaAsset, MediaOSAnalytics } from "../types/media";
import {
  fetchMediaAssets,
  fetchStorageConfig,
  fetchMediaAnalytics,
  executeBatchMediaAction,
  deleteMediaAsset
} from "../services/mediaService";
import MediaUploadCenter from "../components/media/MediaUploadCenter";
import MediaAssetInspector from "../components/media/MediaAssetInspector";
import AdminLayout from "../components/layout/AdminLayout";
import ProvenanceMetricCard from "../components/ui/ProvenanceMetricCard";
import ProvenanceBadge from "../components/ui/ProvenanceBadge";
import { RadioEngine } from "../services/radioEngine";
import { LiveService } from "../services/liveService";
import { useMediaOS } from "../context/MediaOSContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

type ControlTab = "assets" | "upload" | "radio" | "live" | "analytics";

interface AdminMediaAssetsPageProps {
  defaultTab?: ControlTab;
}

export default function AdminMediaAssetsPage({ defaultTab = "assets" }: AdminMediaAssetsPageProps) {
  const [activeTab, setActiveTab] = useState<ControlTab>(defaultTab);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [analytics, setAnalytics] = useState<MediaOSAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [storageConfig, setStorageConfig] = useState({
    isR2Configured: false,
    bucket: "sanatanos-assets",
    storageType: "Checking...",
  });

  // Filter States
  const [selectedTenant, setSelectedTenant] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAssetType, setSelectedAssetType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Batch Multi-Select State
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  const [showBatchCategoryModal, setShowBatchCategoryModal] = useState(false);
  const [targetBatchCategory, setTargetBatchCategory] = useState("articles");
  const [showBatchTagModal, setShowBatchTagModal] = useState(false);
  const [targetBatchTags, setTargetBatchTags] = useState("");

  // Inspectors & Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [inspectingAsset, setInspectingAsset] = useState<MediaAsset | null>(null);

  // RadioOS & LiveOS State
  const [radioData, setRadioData] = useState<any>(null);
  const [liveVideos, setLiveVideos] = useState<any[]>([]);
  const [liveStatus, setLiveStatus] = useState<boolean>(false);
  const { currentTrack, isPlaying, togglePlay } = useMediaOS();

  useEffect(() => {
    loadConfigAndAssets();
  }, [selectedTenant, selectedCategory, selectedAssetType]);

  useEffect(() => {
    if (activeTab === "analytics") {
      loadAnalyticsData();
    } else if (activeTab === "radio") {
      loadRadioData();
    } else if (activeTab === "live") {
      loadLiveData();
    }
  }, [activeTab]);

  const loadConfigAndAssets = async () => {
    setLoading(true);
    try {
      const cfg = await fetchStorageConfig();
      setStorageConfig(cfg);

      const data = await fetchMediaAssets({
        tenantId: selectedTenant,
        category: selectedCategory,
        search: searchQuery,
        limitCount: 150,
      });

      let filtered = data;
      if (selectedAssetType !== "all") {
        filtered = filtered.filter((a) => {
          const mime = (a.mimeType || "").toLowerCase();
          if (selectedAssetType === "image") return mime.startsWith("image/");
          if (selectedAssetType === "video") return mime.startsWith("video/");
          if (selectedAssetType === "audio") return mime.startsWith("audio/");
          if (selectedAssetType === "document") return mime.includes("pdf") || mime.includes("doc");
          return true;
        });
      }

      setAssets(filtered);
    } catch (e) {
      console.error("Error loading Media OS:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await fetchMediaAnalytics();
      if (data) setAnalytics(data);
    } catch (e) {
      console.error("Error loading analytics:", e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadRadioData = async () => {
    try {
      const snap = await RadioEngine.fetchSnapshot();
      setRadioData(snap);
    } catch (e) {
      console.error("Error loading radio data:", e);
    }
  };

  const loadLiveData = async () => {
    try {
      const snap = await LiveService.getLiveSnapshot();
      const all = [...(snap.liveNow || []), ...(snap.latestVideos || [])];
      setLiveVideos(all);
      setLiveStatus(snap.liveNow && snap.liveNow.length > 0);
    } catch (e) {
      console.error("Error loading live videos:", e);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadConfigAndAssets();
  };

  // Selection handlers
  const toggleSelectAsset = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAssetIds.length === assets.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(assets.map((a) => a.id));
    }
  };

  // Batch actions
  const handleBatchDelete = async () => {
    if (selectedAssetIds.length === 0) return;
    if (!window.confirm(`के तपाईं निश्चित हुनुहुन्छ? छनोट गरिएका ${selectedAssetIds.length} मिडिया फाइलहरू मेटिनेछन्।`)) {
      return;
    }
    setBatchActionLoading(true);
    try {
      const res = await executeBatchMediaAction("delete", selectedAssetIds);
      if (res.success) {
        toast.success(`${res.processedCount} मिडिया फाइलहरू सफलतापुर्वक मेटियो!`);
        setSelectedAssetIds([]);
        loadConfigAndAssets();
      } else {
        toast.error(`बैच मेट्न असफल (${res.failedCount} फाइलहरू विफल): ${Object.values(res.errors)[0] || 'त्रुटि'}`);
      }
    } catch (e) {
      toast.error("त्रुटि भयो");
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleBatchCategorySubmit = async () => {
    if (selectedAssetIds.length === 0) return;
    setBatchActionLoading(true);
    try {
      const res = await executeBatchMediaAction("set_category", selectedAssetIds, {
        category: targetBatchCategory,
      });
      if (res.success) {
        toast.success(`वर्ग '${targetBatchCategory}' मा अद्यावधिक गरियो!`);
        setShowBatchCategoryModal(false);
        setSelectedAssetIds([]);
        loadConfigAndAssets();
      } else {
        toast.error(`वर्ग परिवर्तन गर्न असफल: ${Object.values(res.errors)[0] || 'त्रुटि'}`);
      }
    } catch (e) {
      toast.error("त्रुटि भयो");
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleBatchTagsSubmit = async () => {
    if (selectedAssetIds.length === 0) return;
    const tagList = targetBatchTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (tagList.length === 0) {
      toast.error("कम्तिमा एउटा ट्याग प्रविष्ट गर्नुहोस्");
      return;
    }

    setBatchActionLoading(true);
    try {
      const res = await executeBatchMediaAction("add_tags", selectedAssetIds, { tags: tagList });
      if (res.success) {
        toast.success("ट्यागहरू अद्यावधिक गरियो!");
        setShowBatchTagModal(false);
        setTargetBatchTags("");
        setSelectedAssetIds([]);
        loadConfigAndAssets();
      } else {
        toast.error(`ट्याग थप्न असफल: ${Object.values(res.errors)[0] || 'त्रुटि'}`);
      }
    } catch (e) {
      toast.error("त्रुटि भयो");
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleBatchArchive = async () => {
    if (selectedAssetIds.length === 0) return;
    setBatchActionLoading(true);
    try {
      const res = await executeBatchMediaAction("archive", selectedAssetIds);
      if (res.success) {
        toast.success(`${res.processedCount} फाइलहरू आर्काइभ गरियो`);
        setSelectedAssetIds([]);
        loadConfigAndAssets();
      } else {
        toast.error(`आर्काइभ गर्न असफल: ${Object.values(res.errors)[0] || 'त्रुटि'}`);
      }
    } catch (e) {
      toast.error("त्रुटि भयो");
    } finally {
      setBatchActionLoading(false);
    }
  };

  const totalSize = assets.reduce((acc, curr) => acc + (curr.size || 0), 0);
  const sizeInMb = (totalSize / (1024 * 1024)).toFixed(2);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Title & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-theme">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-foreground tracking-tight">
                MediaOS Control Center
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  storageConfig.isR2Configured
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    : "bg-blue-500/10 text-blue-600 border border-blue-500/30"
                }`}
              >
                <Server size={14} />
                {storageConfig.storageType}
              </span>
            </div>
            <p className="text-xs text-muted-text mt-1">
              Unified Storage Federation • Cloudflare R2 S3 CDN • RadioOS • LiveOS Broadcast • Gemini AI Tagging
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadConfigAndAssets();
                if (activeTab === "analytics") loadAnalyticsData();
              }}
              className="p-2.5 rounded-xl border border-border-theme bg-card hover:bg-muted-area text-foreground transition-colors"
              title="पुनः लोड गर्नुहोस्"
            >
              <RefreshCw size={16} className={loading || analyticsLoading ? "animate-spin" : ""} />
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-lg hover:bg-primary/90 flex items-center gap-2 transition-all scale-[1.01]"
            >
              <Plus size={16} />
              नयाँ मिडिया फाइल अपलोड
            </button>
          </div>
        </div>

        {/* Global Control Tabs */}
        <div className="flex items-center gap-2 border-b border-border-theme/60 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("assets")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === "assets"
                ? "bg-primary text-white shadow-md"
                : "bg-card border border-border-theme text-muted-text hover:text-foreground"
            }`}
          >
            <Folder size={15} />
            मिडिया पुस्तकालय (Library)
            <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-mono">
              {assets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === "upload"
                ? "bg-primary text-white shadow-md"
                : "bg-card border border-border-theme text-muted-text hover:text-foreground"
            }`}
          >
            <Upload size={15} />
            अपलोड सेन्टर (Upload OS)
          </button>

          <button
            onClick={() => setActiveTab("radio")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === "radio"
                ? "bg-rose-600 text-white shadow-md"
                : "bg-card border border-border-theme text-muted-text hover:text-foreground"
            }`}
          >
            <Radio size={15} />
            सनातन रेडियो (RadioOS)
            <span className="px-2 py-0.5 rounded-md bg-rose-500/30 text-[10px] font-mono">
              24/7 Live
            </span>
          </button>

          <button
            onClick={() => setActiveTab("live")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === "live"
                ? "bg-red-600 text-white shadow-md"
                : "bg-card border border-border-theme text-muted-text hover:text-foreground"
            }`}
          >
            <Tv size={15} />
            प्रत्यक्ष प्रसारण (LiveOS)
            {liveStatus && (
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === "analytics"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-card border border-border-theme text-muted-text hover:text-foreground"
            }`}
          >
            <BarChart3 size={15} />
            वास्तविक तथ्याङ्क (Real Analytics)
          </button>
        </div>

        {/* TAB 1: MEDIA ASSET LIBRARY */}
        {activeTab === "assets" && (
          <div className="space-y-6">
            {/* Metric Summary Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-card border border-border-theme shadow-sm space-y-1">
                <div className="flex items-center justify-between text-muted-text">
                  <span className="text-xs font-bold">जम्मा मिडिया फाइल</span>
                  <Database size={18} className="text-primary" />
                </div>
                <div className="text-2xl font-black text-foreground">{assets.length}</div>
                <p className="text-[11px] text-muted-text">Cloudflare R2 & Firestore</p>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border-theme shadow-sm space-y-1">
                <div className="flex items-center justify-between text-muted-text">
                  <span className="text-xs font-bold">कुल भण्डारण आकार</span>
                  <Server size={18} className="text-amber-500" />
                </div>
                <div className="text-2xl font-black text-foreground">{sizeInMb} MB</div>
                <p className="text-[11px] text-emerald-500 font-semibold">Zero Egress Bandwidth Fees</p>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border-theme shadow-sm space-y-1">
                <div className="flex items-center justify-between text-muted-text">
                  <span className="text-xs font-bold">R2 Storage Offload</span>
                  <ShieldCheck size={18} className="text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-foreground">
                  {assets.length > 0
                    ? Math.round((assets.filter((a) => a.isR2).length / assets.length) * 100)
                    : 100}
                  %
                </div>
                <p className="text-[11px] text-muted-text">Object Key Directory Isolation</p>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border-theme shadow-sm space-y-1">
                <div className="flex items-center justify-between text-muted-text">
                  <span className="text-xs font-bold">AI Auto Tagging</span>
                  <Sparkles size={18} className="text-sacred" />
                </div>
                <div className="text-2xl font-black text-foreground">Gemini 3.5</div>
                <p className="text-[11px] text-muted-text">Nepali Alt Text & Vision OS</p>
              </div>
            </div>

            {/* Filter and Control Bar */}
            <div className="p-4 rounded-2xl bg-card border border-border-theme shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
                <input
                  type="text"
                  placeholder="फाइलको नाम, Alt Text वा ट्याग खोज्नुहोस्..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted-area/50 border border-border-theme rounded-xl pl-10 pr-4 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </form>

              <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                {/* Asset Type Selector */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Sliders size={14} className="text-indigo-500" />
                  <select
                    value={selectedAssetType}
                    onChange={(e) => setSelectedAssetType(e.target.value)}
                    className="bg-muted-area/50 border border-border-theme rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none"
                  >
                    <option value="all">सबै प्रकार (All Types)</option>
                    <option value="image">तस्बिर (Images)</option>
                    <option value="video">भिडियो (Videos)</option>
                    <option value="audio">अडियो (Audio)</option>
                    <option value="document">कागजात (Documents)</option>
                  </select>
                </div>

                {/* Tenant Selector */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Folder size={14} className="text-primary" />
                  <select
                    value={selectedTenant}
                    onChange={(e) => setSelectedTenant(e.target.value)}
                    className="bg-muted-area/50 border border-border-theme rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none"
                  >
                    <option value="all">सबै Tenants (All)</option>
                    <option value="sanatan-media">Sanatan Media</option>
                    <option value="pokhara-metro">Pokhara Metro</option>
                    <option value="purbanchal-cancer">Purbanchal Cancer</option>
                    <option value="janakpur-submetro">Janakpurdham Sub-Metro</option>
                    <option value="lumbini-trust">Lumbini Dev Trust</option>
                  </select>
                </div>

                {/* Category Selector */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Tag size={14} className="text-emerald-500" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-muted-area/50 border border-border-theme rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none"
                  >
                    <option value="all">सबै Categories</option>
                    <option value="articles">Articles</option>
                    <option value="nepal_hub">Nepal Hub</option>
                    <option value="knowledge_base">Knowledge OS</option>
                    <option value="banners">Banners & Ads</option>
                    <option value="community">Chautari Community</option>
                    <option value="avatars">User Avatars</option>
                  </select>
                </div>

                {/* Select All Toggle */}
                <button
                  onClick={toggleSelectAll}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors shrink-0 ${
                    selectedAssetIds.length > 0 && selectedAssetIds.length === assets.length
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-muted-area/50 border-border-theme text-muted-text hover:text-foreground"
                  }`}
                >
                  {selectedAssetIds.length === assets.length && assets.length > 0
                    ? "सबै चयन रद्द"
                    : "सबै छान्नुहोस्"}
                </button>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-muted-area/50 p-1 rounded-xl border border-border-theme shrink-0">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      viewMode === "grid" ? "bg-card text-foreground shadow-sm" : "text-muted-text hover:text-foreground"
                    }`}
                  >
                    <Grid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-text hover:text-foreground"
                    }`}
                  >
                    <ListIcon size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Batch Action Toolbar */}
            <AnimatePresence>
              {selectedAssetIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3.5 rounded-2xl bg-primary/10 border border-primary/30 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-black">
                      {selectedAssetIds.length} छनोट गरिएको
                    </span>
                    <span className="text-xs text-foreground font-semibold">
                      सामूहिक कार्य गर्नुहोस्:
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setShowBatchCategoryModal(true)}
                      disabled={batchActionLoading}
                      className="px-3 py-1.5 rounded-xl bg-card border border-border-theme text-foreground text-xs font-bold hover:bg-muted-area flex items-center gap-1.5"
                    >
                      <Folder size={14} className="text-amber-500" />
                      वर्ग परिवर्तन
                    </button>

                    <button
                      onClick={() => setShowBatchTagModal(true)}
                      disabled={batchActionLoading}
                      className="px-3 py-1.5 rounded-xl bg-card border border-border-theme text-foreground text-xs font-bold hover:bg-muted-area flex items-center gap-1.5"
                    >
                      <Tag size={14} className="text-emerald-500" />
                      ट्याग थप्नुहोस्
                    </button>

                    <button
                      onClick={handleBatchArchive}
                      disabled={batchActionLoading}
                      className="px-3 py-1.5 rounded-xl bg-card border border-border-theme text-foreground text-xs font-bold hover:bg-muted-area flex items-center gap-1.5"
                    >
                      <Archive size={14} className="text-indigo-500" />
                      आर्काइभ गर्नुहोस्
                    </button>

                    <button
                      onClick={handleBatchDelete}
                      disabled={batchActionLoading}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 flex items-center gap-1.5 shadow-sm"
                    >
                      <Trash2 size={14} />
                      सामूहिक मेट्नुहोस्
                    </button>

                    <button
                      onClick={() => setSelectedAssetIds([])}
                      className="p-1.5 rounded-lg text-muted-text hover:text-foreground"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Media Assets Display Grid or List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-text space-y-3">
                <RefreshCw size={28} className="animate-spin text-primary" />
                <p className="text-xs font-bold">Cloudflare R2 & Firestore बाट मिडिया फाइलहरू प्राप्त भइरहेछ...</p>
              </div>
            ) : assets.length === 0 ? (
              <div className="bg-card border border-border-theme rounded-2xl p-12 text-center space-y-4 shadow-sm">
                <Database size={48} className="mx-auto text-muted-text/40" />
                <h3 className="font-bold text-lg text-foreground">कुनै मिडिया सम्पत्ति फेला परेन</h3>
                <p className="text-xs text-muted-text max-w-md mx-auto">
                  छनोट गरिएको फिल्टर वा खोज शब्द अनुसार कुनै मिडिया भेटिएन। नयाँ मिडिया फाइल ड्र्याग एण्ड ड्रप गरी अपलोड गर्नुहोस्।
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary/90"
                >
                  फाइल अपलोड गर्नुहोस्
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {assets.map((asset) => {
                  const isSelected = selectedAssetIds.includes(asset.id);
                  const isVideo = asset.mimeType?.startsWith("video/");
                  const isAudio = asset.mimeType?.startsWith("audio/");
                  const isDoc = asset.mimeType?.includes("pdf") || asset.mimeType?.includes("doc");

                  return (
                    <div
                      key={asset.id}
                      className={`group bg-card rounded-2xl border transition-all duration-300 relative flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border-theme hover:border-primary/50"
                      }`}
                    >
                      {/* Checkbox for batch selection */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectAsset(asset.id);
                        }}
                        className={`absolute top-2.5 left-2.5 z-20 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-primary border-primary text-white shadow-md"
                            : "bg-black/60 border-white/40 text-transparent hover:border-white"
                        }`}
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>

                      <div onClick={() => setInspectingAsset(asset)} className="cursor-pointer">
                        {/* Thumbnail / Media Visualizer */}
                        <div className="relative aspect-video bg-slate-950/20 overflow-hidden flex items-center justify-center">
                          {isDoc ? (
                            <div className="flex flex-col items-center justify-center p-4 text-muted-text">
                              <FileIcon size={36} className="text-amber-500 mb-1" />
                              <span className="text-[10px] font-mono font-bold uppercase">PDF Document</span>
                            </div>
                          ) : isAudio ? (
                            <div className="flex flex-col items-center justify-center p-4 text-muted-text">
                              <Music size={36} className="text-rose-500 mb-1" />
                              <span className="text-[10px] font-mono font-bold uppercase">Audio Track</span>
                            </div>
                          ) : isVideo ? (
                            <div className="relative w-full h-full">
                              <img
                                src={asset.thumbnailUrl || asset.url}
                                alt={asset.altText || asset.fileName}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Video size={32} className="text-white drop-shadow-md" />
                              </div>
                            </div>
                          ) : (
                            <img
                              src={asset.thumbnailUrl || asset.url}
                              alt={asset.altText || asset.fileName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                          )}

                          <div className="absolute top-2.5 right-2 flex items-center gap-1">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider backdrop-blur-md ${
                                asset.isR2
                                  ? "bg-amber-500/90 text-black shadow-sm"
                                  : "bg-blue-600/90 text-white shadow-sm"
                              }`}
                            >
                              {asset.isR2 ? "R2" : "Local"}
                            </span>
                          </div>

                          {asset.usedIn && asset.usedIn.length > 0 && (
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-[9px] font-bold flex items-center gap-1 shadow-md">
                              <CheckCircle2 size={10} /> Used ({asset.usedIn.length})
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="p-3.5 space-y-2">
                          <h4 className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                            {asset.title || asset.altText || asset.fileName}
                          </h4>

                          <div className="flex items-center justify-between text-[10px] text-muted-text font-mono">
                            <span className="bg-muted-area px-1.5 py-0.5 rounded-md font-bold">
                              {asset.category}
                            </span>
                            <span>{(asset.size / 1024).toFixed(1)} KB</span>
                          </div>

                          <div className="flex flex-wrap gap-1 pt-1">
                            {asset.tags?.slice(0, 3).map((t, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-semibold text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded-md"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="px-3.5 py-2 border-t border-border-theme/50 bg-muted-area/20 text-[10px] font-semibold text-muted-text flex items-center justify-between">
                        <span>{new Date(asset.createdAt).toLocaleDateString("ne-NP")}</span>
                        <button
                          onClick={() => setInspectingAsset(asset)}
                          className="text-primary hover:underline font-bold"
                        >
                          विवरण &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-card border border-border-theme rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted-area/50 border-b border-border-theme text-muted-text font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5 w-10">
                        <input
                          type="checkbox"
                          checked={selectedAssetIds.length === assets.length && assets.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded text-primary focus:ring-primary"
                        />
                      </th>
                      <th className="p-3.5">पूर्वावलोकन</th>
                      <th className="p-3.5">फाइलको नाम / शीर्षक</th>
                      <th className="p-3.5">Tenant & Category</th>
                      <th className="p-3.5">आकार</th>
                      <th className="p-3.5">स्टोरेज प्रकार</th>
                      <th className="p-3.5">मिति</th>
                      <th className="p-3.5 text-right">कार्य</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-theme/50 text-foreground font-semibold">
                    {assets.map((asset) => {
                      const isSelected = selectedAssetIds.includes(asset.id);
                      return (
                        <tr
                          key={asset.id}
                          className={`hover:bg-muted-area/30 cursor-pointer transition-colors ${
                            isSelected ? "bg-primary/5" : ""
                          }`}
                        >
                          <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectAsset(asset.id)}
                              className="rounded text-primary focus:ring-primary"
                            />
                          </td>
                          <td className="p-3.5 w-16" onClick={() => setInspectingAsset(asset)}>
                            <img
                              src={asset.thumbnailUrl || asset.url}
                              alt={asset.altText}
                              className="w-12 h-9 object-cover rounded-lg border border-border-theme"
                              referrerPolicy="no-referrer"
                            />
                          </td>
                          <td className="p-3.5 font-bold" onClick={() => setInspectingAsset(asset)}>
                            <p className="truncate max-w-xs">{asset.title || asset.altText || asset.fileName}</p>
                            <span className="text-[10px] font-mono text-muted-text">{asset.objectKey}</span>
                          </td>
                          <td className="p-3.5" onClick={() => setInspectingAsset(asset)}>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-muted-area text-foreground text-[10px] font-bold rounded-md">
                                {asset.tenantId}
                              </span>
                              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-md">
                                {asset.category}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 text-muted-text" onClick={() => setInspectingAsset(asset)}>
                            {(asset.size / 1024).toFixed(1)} KB
                          </td>
                          <td className="p-3.5" onClick={() => setInspectingAsset(asset)}>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                asset.isR2 ? "bg-amber-500/10 text-amber-600" : "bg-blue-500/10 text-blue-600"
                              }`}
                            >
                              {asset.isR2 ? "R2 Bucket" : "Local Disk"}
                            </span>
                          </td>
                          <td className="p-3.5 text-muted-text" onClick={() => setInspectingAsset(asset)}>
                            {new Date(asset.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3.5 text-right" onClick={() => setInspectingAsset(asset)}>
                            <button className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary/20">
                              विवरण
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: UPLOAD CENTER */}
        {activeTab === "upload" && (
          <div className="bg-card border border-border-theme rounded-2xl p-6 shadow-sm max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-border-theme">
              <div>
                <h3 className="font-bold text-lg text-foreground">
                  AssetOS Unified Upload Pipeline
                </h3>
                <p className="text-xs text-muted-text">
                  Direct Multi-part or Cloudflare R2 Presigned Upload with Gemini AI Automatic Metadata Tagging
                </p>
              </div>
            </div>

            <MediaUploadCenter
              onUploadSuccess={() => {
                loadConfigAndAssets();
                toast.success("मिडिया सफलतापुर्वक अपलोड गरियो!");
              }}
              defaultTenantId={selectedTenant !== "all" ? selectedTenant : "sanatan-media"}
              defaultCategory={selectedCategory !== "all" ? selectedCategory : "articles"}
            />
          </div>
        )}

        {/* TAB 3: RADIOOS HUB */}
        {activeTab === "radio" && (
          <div className="space-y-6">
            {/* Live Station Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950/40 via-card to-card border border-rose-500/30 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shrink-0">
                  <Radio size={32} className="animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-rose-500/30">
                      <Wifi size={12} className="animate-ping" /> 24/7 Live Stream
                    </span>
                    <span className="text-xs text-muted-text font-mono">FM 108.0 MHz</span>
                  </div>
                  <h2 className="text-xl font-black text-foreground">
                    {radioData?.station?.nameNe || "सनातन धर्म रेडियो १०८"}
                  </h2>
                  <p className="text-xs text-muted-text">
                    {radioData?.station?.sloganNe || "सनातन सत्य र वैदिक विचारको आवाज"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <a
                  href="/radio"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl border border-border-theme bg-card hover:bg-muted-area text-xs font-bold text-foreground flex items-center gap-2"
                >
                  <ExternalLink size={14} />
                  रेडियो पोर्टल हेर्नुहोस्
                </a>
                <a
                  href="/admin/radio"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-lg hover:bg-rose-700 flex items-center gap-2"
                >
                  <Sliders size={14} />
                  पूर्ण RadioOS प्रबन्धन
                </a>
              </div>
            </div>

            {/* Radio Audio Bulletins List */}
            <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border-theme">
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    हालैका रेडियो अडियो बुलेटिनहरू (Radio Bulletins)
                  </h3>
                  <p className="text-xs text-muted-text">
                    TTS Synthesized & Studio Broadcast Audio Files
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-muted-area text-xs font-bold text-foreground">
                  {radioData?.bulletins?.length || 0} बुलेटिनहरू
                </span>
              </div>

              {radioData?.bulletins && radioData.bulletins.length > 0 ? (
                <div className="space-y-3">
                  {radioData.bulletins.map((bulletin: any) => (
                    <div
                      key={bulletin.id}
                      className="p-4 rounded-xl border border-border-theme/60 bg-muted-area/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-rose-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => togglePlay()}
                          className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 shrink-0"
                        >
                          {currentTrack?.id === bulletin.id && isPlaying ? (
                            <Pause size={18} />
                          ) : (
                            <Play size={18} className="ml-0.5" />
                          )}
                        </button>
                        <div>
                          <h4 className="font-bold text-xs text-foreground">
                            {bulletin.titleNe || bulletin.titleEn}
                          </h4>
                          <p className="text-[11px] text-muted-text line-clamp-1">
                            {bulletin.scriptNe || bulletin.scriptEn}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-text font-mono">
                            <span>{bulletin.durationSeconds || 120} Sec</span>
                            <span>•</span>
                            <span>{bulletin.publishedAt ? new Date(bulletin.publishedAt).toLocaleDateString() : 'अप्रकाशित'}</span>
                          </div>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                        सक्रिय प्रसारण
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-text py-6 text-center">
                  कुनै अडियो बुलेटिनहरू उपलब्ध छैनन्। पूर्ण RadioOS पेजमा गई नयाँ TTS बुलेटिन निर्माण गर्नुहोस्।
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: LIVEOS BROADCAST */}
        {activeTab === "live" && (
          <div className="space-y-6">
            {/* Live Banner Status */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-red-950/40 via-card to-card border border-red-500/30 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shrink-0">
                  <Tv size={32} className="animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                        liveStatus
                          ? "bg-red-500/20 text-red-500 border-red-500/30"
                          : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${liveStatus ? "bg-red-500 animate-ping" : "bg-slate-500"}`} />
                      {liveStatus ? "ON AIR STREAMING" : "OFF AIR"}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-foreground">
                    LiveOS Broadcast & Multi-Camera Switcher
                  </h2>
                  <p className="text-xs text-muted-text">
                    Direct RTMP / YouTube / HLS Feed Controller and Moderated Live Chat Ticker
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <a
                  href="/live"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl border border-border-theme bg-card hover:bg-muted-area text-xs font-bold text-foreground flex items-center gap-2"
                >
                  <ExternalLink size={14} />
                  लाइभ पोर्टल हेर्नुहोस्
                </a>
                <a
                  href="/admin/live"
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <Video size={14} />
                  पूर्ण LiveOS प्रबन्धन
                </a>
              </div>
            </div>

            {/* Live Videos Grid */}
            <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border-theme">
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    प्रत्यक्ष प्रसारण र रेकर्डेड भिडियोहरू (Live Streams)
                  </h3>
                  <p className="text-xs text-muted-text">Active Streams, YouTube Videos & Archive</p>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-muted-area text-xs font-bold text-foreground">
                  {liveVideos.length} भिडियोहरू
                </span>
              </div>

              {liveVideos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {liveVideos.map((video) => (
                    <div
                      key={video.id}
                      className="bg-card rounded-xl border border-border-theme overflow-hidden shadow-sm flex flex-col justify-between"
                    >
                      <div className="relative aspect-video bg-black">
                        <img
                          src={video.thumbnailUrl || "https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?auto=format&fit=crop&q=80&w=800"}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {video.isLive && (
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-red-600 text-white font-black text-[9px] uppercase tracking-wider rounded-md shadow-md flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            LIVE
                          </span>
                        )}
                      </div>

                      <div className="p-3 space-y-1.5">
                        <h4 className="font-bold text-xs text-foreground line-clamp-1">
                          {video.title}
                        </h4>
                        <p className="text-[10px] text-muted-text line-clamp-1">
                          {video.broadcasterName || "सनातन मार्ग डिजिटल"}
                        </p>
                      </div>

                      <div className="p-3 border-t border-border-theme/50 bg-muted-area/20 flex items-center justify-between text-[10px] font-semibold text-muted-text">
                        <span>{video.district || "काठमाडौँ"}</span>
                        <a
                          href={`/live/${video.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline font-bold"
                        >
                          हेर्नुहोस् &rarr;
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-text py-6 text-center">
                  कुनै प्रत्यक्ष भिडियोहरू भेटिएनन्। पूर्ण LiveOS मा नयाँ स्ट्रिम लिङ्क प्रविष्ट गर्नुहोस्।
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: REAL DATA ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-card border border-border-theme shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  MediaOS Provenance Analytics & Storage Audit
                </h3>
                <p className="text-xs text-muted-text">
                  100% Real Persisted Database Metrics • Zero Mock Data Guarantee
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20 flex items-center gap-1.5">
                <ShieldCheck size={14} /> Measured Telemetry
              </span>
            </div>

            {analyticsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-text space-y-3">
                <RefreshCw size={28} className="animate-spin text-primary" />
                <p className="text-xs font-bold">डेटाबेसबाट वास्तविक मिडिया मेट्रिक्स प्राप्त भइरहेछ...</p>
              </div>
            ) : analytics ? (
              <div className="space-y-6">
                {/* Provenance Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <ProvenanceMetricCard
                    metricId="media_total_assets"
                    value={analytics.totalAssets.value}
                    customTitle="Total Media Assets"
                    customTitleNepali="जम्मा मिडिया फाइलहरू"
                    icon={Database}
                  />

                  <ProvenanceMetricCard
                    metricId="media_total_storage_mb"
                    value={`${(analytics.totalStorageBytes.value / (1024 * 1024)).toFixed(2)} MB`}
                    customTitle="Total Storage Used"
                    customTitleNepali="कुल मिडिया भण्डारण आकार"
                    icon={Server}
                    highlightColor="amber"
                  />

                  <ProvenanceMetricCard
                    metricId="media_r2_storage_percent"
                    value={`${analytics.r2StoragePercent.value}%`}
                    customTitle="Cloudflare R2 Ratio"
                    customTitleNepali="R2 बकेट वितरण प्रतिशत"
                    icon={ShieldCheck}
                    highlightColor="emerald"
                  />

                  <ProvenanceMetricCard
                    metricId="media_ai_enriched_percent"
                    value={`${analytics.aiMetadataEnrichedPercent.value}%`}
                    customTitle="AI Tagged Ratio"
                    customTitleNepali="एआई विवरणात्मक प्रतिशत"
                    icon={Sparkles}
                    highlightColor="indigo"
                  />
                </div>

                {/* Additional Broadcast Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ProvenanceMetricCard
                    metricId="active_audio_bulletins"
                    value={analytics.totalRadioBulletins.value}
                    customTitle="Radio Audio Bulletins"
                    customTitleNepali="रेडियो अडियो बुलेटिन सङ्ख्या"
                    icon={Radio}
                    highlightColor="rose"
                  />

                  <ProvenanceMetricCard
                    metricId="live_stream_peak_viewers"
                    value={analytics.totalLiveStreams.value}
                    customTitle="Live Video Feeds"
                    customTitleNepali="प्रत्यक्ष भिडियो स्ट्रिमहरू"
                    icon={Tv}
                    highlightColor="rose"
                  />

                  <div className="p-5 rounded-3xl bg-card border border-border-theme shadow-sm space-y-2 relative overflow-hidden">
                    <div className="flex items-center justify-between text-muted-text">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        पछिल्लो २४ घण्टा अपलोड (Last 24h)
                      </span>
                      <ProvenanceBadge metricId="media_total_assets" />
                    </div>
                    <div className="text-3xl font-black text-foreground font-mono">
                      {analytics.recentUploadsCount.value}
                    </div>
                    <p className="text-[11px] text-muted-text">Recent Uploads Count</p>
                  </div>
                </div>

                {/* Breakdown by Category */}
                <div className="p-6 rounded-2xl bg-card border border-border-theme shadow-sm space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-text">
                    वर्गानुसार मिडिया वितरण (Category Breakdown)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(analytics.categoryBreakdown || {}).map(([cat, count]) => (
                      <div key={cat} className="p-3 rounded-xl bg-muted-area/40 border border-border-theme/60 space-y-1">
                        <span className="text-[11px] font-bold text-foreground block capitalize">{cat}</span>
                        <div className="text-xl font-black text-primary font-mono">{count}</div>
                        <span className="text-[10px] text-muted-text">फाइलहरू</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border-theme rounded-2xl p-12 text-center text-muted-text">
                तथ्याङ्क उपलब्ध हुन सकेन।
              </div>
            )}
          </div>
        )}

        {/* Modal & Inspector Side Drawer */}
        {showUploadModal && (
          <div className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-2xl">
              <MediaUploadCenter
                onClose={() => setShowUploadModal(false)}
                onUploadSuccess={() => {
                  loadConfigAndAssets();
                }}
              />
            </div>
          </div>
        )}

        {/* Batch Category Modal */}
        {showBatchCategoryModal && (
          <div className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-card border border-border-theme rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-border-theme">
                <h3 className="font-bold text-sm text-foreground">
                  सामूहिक वर्ग परिवर्तन ({selectedAssetIds.length} फाइलहरू)
                </h3>
                <button
                  onClick={() => setShowBatchCategoryModal(false)}
                  className="p-1 rounded-lg text-muted-text hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">नयाँ वर्ग छान्नुहोस्:</label>
                <select
                  value={targetBatchCategory}
                  onChange={(e) => setTargetBatchCategory(e.target.value)}
                  className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="articles">Articles</option>
                  <option value="nepal_hub">Nepal Hub</option>
                  <option value="knowledge_base">Knowledge OS</option>
                  <option value="banners">Banners & Ads</option>
                  <option value="community">Chautari Community</option>
                  <option value="avatars">User Avatars</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowBatchCategoryModal(false)}
                  className="px-4 py-2 rounded-xl border border-border-theme text-xs font-bold text-muted-text hover:text-foreground"
                >
                  रद्द
                </button>
                <button
                  onClick={handleBatchCategorySubmit}
                  disabled={batchActionLoading}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 shadow-md"
                >
                  अद्यावधिक गर्नुहोस्
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Batch Tag Modal */}
        {showBatchTagModal && (
          <div className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-card border border-border-theme rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-border-theme">
                <h3 className="font-bold text-sm text-foreground">
                  सामूहिक ट्याग थप्नुहोस् ({selectedAssetIds.length} फाइलहरू)
                </h3>
                <button
                  onClick={() => setShowBatchTagModal(false)}
                  className="p-1 rounded-lg text-muted-text hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">
                  ट्यागहरू (अल्पविराम `,` ले छुट्याउनुहोस्):
                </label>
                <input
                  type="text"
                  placeholder="उदा: नेपाल, पशुपतिनाथ, Heritage"
                  value={targetBatchTags}
                  onChange={(e) => setTargetBatchTags(e.target.value)}
                  className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowBatchTagModal(false)}
                  className="px-4 py-2 rounded-xl border border-border-theme text-xs font-bold text-muted-text hover:text-foreground"
                >
                  रद्द
                </button>
                <button
                  onClick={handleBatchTagsSubmit}
                  disabled={batchActionLoading}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 shadow-md"
                >
                  ट्याग थप्नुहोस्
                </button>
              </div>
            </div>
          </div>
        )}

        <MediaAssetInspector
          asset={inspectingAsset}
          onClose={() => setInspectingAsset(null)}
          onAssetDeleted={() => loadConfigAndAssets()}
          onAssetUpdated={() => loadConfigAndAssets()}
        />
      </div>
    </AdminLayout>
  );
}
