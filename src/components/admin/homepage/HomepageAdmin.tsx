import { useState, useEffect } from "react";
import { 
  Tv, Layout, Star, Flame, Eye, Save, RefreshCw, 
  CheckCircle, ShieldAlert, Sparkles, Sliders, Play, Link as LinkIcon, Database, Check,
  Command, SlidersHorizontal, Radio, Search, Navigation, Lock, Undo2, Archive
} from "lucide-react";
import { doc, getDoc, setDoc, updateDoc } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { setDocWithQueue } from "@/src/lib/offlineQueue";
import { toast } from "sonner";
import SnapshotTraceDashboard from "@/src/components/admin/SnapshotTraceDashboard";

const SHADOW_PRESETS = [
  { label: "Cinematic Intense", value: "0 4px 16px rgba(0,0,0,0.95), 0 0 32px rgba(0,0,0,0.7), -1px -1px 0 rgba(0,0,0,0.4), 1px -1px 0 rgba(0,0,0,0.4), -1px 1px 0 rgba(0,0,0,0.4), 1px 1px 0 rgba(0,0,0,0.4)" },
  { label: "Subtle Glow", value: "0 2px 8px rgba(0,0,0,0.5), 0 0 16px rgba(0,0,0,0.3)" },
  { label: "Bold Shadow", value: "0 4px 8px rgba(0,0,0,0.8)" },
  { label: "Outline Only", value: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" },
  { label: "None", value: "none" }
];

export default function HomepageAdmin() {
  const [activeTab, setActiveTab] = useState<"hero" | "header" | "layout" | "breaking" | "audit">("hero");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Hero Configuration State
  const [heroEnabled, setHeroEnabled] = useState(true);
  const [heroType, setHeroType] = useState<"youtube" | "local" | "image">("youtube");
  const [heroVideoUrl, setHeroVideoUrl] = useState("https://www.youtube.com/watch?v=1La4QzGeaaQ");
  const [heroMobileVideoUrl, setHeroMobileVideoUrl] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=2000");
  const [heroTitle, setHeroTitle] = useState("Sanatan Marga");
  const [heroSubtitle, setHeroSubtitle] = useState("Nepal's Civilizational Media Network");
  const [heroCtaText, setHeroCtaText] = useState("Latest News");
  const [heroOverlayOpacity, setHeroOverlayOpacity] = useState(15);
  const [allowUserHide, setAllowUserHide] = useState(true);

  // New Hardening & Customization State Fields (Phase 6)
  const [heroMediaOpacity, setHeroMediaOpacity] = useState(75);
  const [heroOverlayColor, setHeroOverlayColor] = useState("#020617");
  const [heroBlurAmount, setHeroBlurAmount] = useState(0.5);
  const [heroTextShadow, setHeroTextShadow] = useState("0 4px 16px rgba(0,0,0,0.95), 0 0 32px rgba(0,0,0,0.7), -1px -1px 0 rgba(0,0,0,0.4), 1px -1px 0 rgba(0,0,0,0.4), -1px 1px 0 rgba(0,0,0,0.4), 1px 1px 0 rgba(0,0,0,0.4)");
  const [heroTextOpacity, setHeroTextOpacity] = useState(100);
  const [heroThemeStyle, setHeroThemeStyle] = useState<"dark" | "light" | "gold" | "crimson">("dark");

  // Rollback & Draft History States (Phase 7)
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState(false);

  // Header & Command Bar Experience State
  const [headerTransparentMode, setHeaderTransparentMode] = useState(true);
  const [headerStickyMode, setHeaderStickyMode] = useState(true);
  const [enableUtilityBar, setEnableUtilityBar] = useState(true);
  const [enableLiveTicker, setEnableLiveTicker] = useState(true);

  // Layout Toggles
  const [layoutConfig, setLayoutConfig] = useState({
    hero: true,
    breakingNews: true,
    categoryGrid: true,
    featuredStories: true,
    latestNews: true,
    categoryBlocks: true,
    districtIntelligence: true,
    knowledgeOS: true,
    communityOnboarding: true,
  });

  // Pinned and Breaking State
  const [pinnedBreakingHeadlines, setPinnedBreakingHeadlines] = useState<string[]>([
    "नेपाल राष्ट्रिय सभाद्वारा पूर्वाधार तथा सम्पदा संरक्षण ऐन सर्वसम्मत पारित",
    "नेपाल राष्ट्र बैंकद्वारा दोस्रो त्रैमासिक मौद्रिक नीति समीक्षा सार्वजनिक"
  ]);
  const [newHeadline, setNewHeadline] = useState("");

  // Load existing homepage config and historic rollback states
  useEffect(() => {
    const fetchHomepageConfig = async () => {
      try {
        setLoading(true);
        
        // Check for saved drafts in local storage first
        const savedDraft = localStorage.getItem("sm_homepage_draft");
        if (savedDraft) {
          setHasUnsavedDraft(true);
        }

        const docRef = doc(db, "settings", "homepage");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.hero) {
            setHeroEnabled(data.hero.enabled ?? true);
            setHeroType(data.hero.type || "youtube");
            setHeroVideoUrl(data.hero.videoUrl || "https://www.youtube.com/watch?v=1La4QzGeaaQ");
            setHeroMobileVideoUrl(data.hero.mobileVideoUrl || "");
            setHeroImageUrl(data.hero.imageUrl || "");
            setHeroTitle(data.hero.title || "Sanatan Marga");
            setHeroSubtitle(data.hero.subtitle || "Nepal's Civilizational Media Network");
            setHeroCtaText(data.hero.ctaText || "Latest News");
            setHeroOverlayOpacity(data.hero.overlayOpacity ?? 15);
            setAllowUserHide(data.hero.allowUserHide ?? true);
            
            // Populate Phase 6 Properties
            setHeroMediaOpacity(data.hero.mediaOpacity ?? 75);
            setHeroOverlayColor(data.hero.overlayColor || "#020617");
            setHeroBlurAmount(data.hero.blurAmount ?? 0.5);
            setHeroTextShadow(data.hero.textShadow || "0 4px 16px rgba(0,0,0,0.95), 0 0 32px rgba(0,0,0,0.7), -1px -1px 0 rgba(0,0,0,0.4), 1px -1px 0 rgba(0,0,0,0.4), -1px 1px 0 rgba(0,0,0,0.4), 1px 1px 0 rgba(0,0,0,0.4)");
            setHeroTextOpacity(data.hero.textOpacity ?? 100);
            setHeroThemeStyle(data.hero.themeStyle || "dark");
          }
          if (data.header) {
            setHeaderTransparentMode(data.header.transparentMode ?? true);
            setHeaderStickyMode(data.header.stickyMode ?? true);
            setEnableUtilityBar(data.header.enableUtilityBar ?? true);
            setEnableLiveTicker(data.header.enableLiveTicker ?? true);
          }
          if (data.layout) {
            setLayoutConfig((prev) => ({ ...prev, ...data.layout }));
          }
          if (Array.isArray(data.pinnedBreakingHeadlines)) {
            setPinnedBreakingHeadlines(data.pinnedBreakingHeadlines);
          }
        }

        // Fetch historic rollbacks from settings/homepage_history doc
        const historyRef = doc(db, "settings", "homepage_history");
        const historySnap = await getDoc(historyRef);
        if (historySnap.exists()) {
          setHistoryList(historySnap.data().history || []);
        } else {
          // Fallback static starter history
          setHistoryList([]);
        }

      } catch (err) {
        console.warn("Failed to load homepage admin settings from Firestore:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageConfig();
  }, []);

  // Helper to compile payload
  const compilePayload = () => {
    return {
      updatedAt: new Date().toISOString(),
      hero: {
        enabled: heroEnabled,
        type: heroType,
        videoUrl: heroVideoUrl,
        mobileVideoUrl: heroMobileVideoUrl,
        imageUrl: heroImageUrl,
        title: heroTitle,
        subtitle: heroSubtitle,
        ctaText: heroCtaText,
        overlayOpacity: heroOverlayOpacity,
        allowUserHide,
        mediaOpacity: heroMediaOpacity,
        overlayColor: heroOverlayColor,
        blurAmount: heroBlurAmount,
        textShadow: heroTextShadow,
        textOpacity: heroTextOpacity,
        themeStyle: heroThemeStyle,
      },
      header: {
        transparentMode: headerTransparentMode,
        stickyMode: headerStickyMode,
        enableUtilityBar,
        enableLiveTicker
      },
      layout: layoutConfig,
      pinnedBreakingHeadlines
    };
  };

  // Safe Staging Draft Handler
  const handleSaveDraft = () => {
    const payload = compilePayload();
    localStorage.setItem("sm_homepage_draft", JSON.stringify(payload));
    setHasUnsavedDraft(true);
    toast.success("Draft staged successfully to local workspace storage!");
  };

  // Load Staged Draft
  const handleLoadDraft = () => {
    try {
      const draftStr = localStorage.getItem("sm_homepage_draft");
      if (!draftStr) return;
      const data = JSON.parse(draftStr);
      
      if (data.hero) {
        setHeroEnabled(data.hero.enabled ?? true);
        setHeroType(data.hero.type || "youtube");
        setHeroVideoUrl(data.hero.videoUrl || "");
        setHeroMobileVideoUrl(data.hero.mobileVideoUrl || "");
        setHeroImageUrl(data.hero.imageUrl || "");
        setHeroTitle(data.hero.title || "");
        setHeroSubtitle(data.hero.subtitle || "");
        setHeroCtaText(data.hero.ctaText || "");
        setHeroOverlayOpacity(data.hero.overlayOpacity ?? 15);
        setAllowUserHide(data.hero.allowUserHide ?? true);
        
        setHeroMediaOpacity(data.hero.mediaOpacity ?? 75);
        setHeroOverlayColor(data.hero.overlayColor || "#020617");
        setHeroBlurAmount(data.hero.blurAmount ?? 0.5);
        setHeroTextShadow(data.hero.textShadow || "none");
        setHeroTextOpacity(data.hero.textOpacity ?? 100);
        setHeroThemeStyle(data.hero.themeStyle || "dark");
      }
      toast.success("Staged draft settings applied to sliders & controls!");
    } catch (e) {
      toast.error("Failed to load draft configuration.");
    }
  };

  // Clear Staged Draft
  const handleClearDraft = () => {
    localStorage.removeItem("sm_homepage_draft");
    setHasUnsavedDraft(false);
    toast.info("Staged local draft cleared.");
  };

  // Rollback Action
  const handleApplyRollback = (historicConfig: any) => {
    if (!historicConfig || !historicConfig.hero) {
      toast.error("Invalid history entry selected");
      return;
    }
    const h = historicConfig.hero;
    setHeroEnabled(h.enabled ?? true);
    setHeroType(h.type || "youtube");
    setHeroVideoUrl(h.videoUrl || "");
    setHeroImageUrl(h.imageUrl || "");
    setHeroTitle(h.title || "");
    setHeroSubtitle(h.subtitle || "");
    setHeroCtaText(h.ctaText || "");
    setHeroOverlayOpacity(h.overlayOpacity ?? 15);
    setHeroMediaOpacity(h.mediaOpacity ?? 75);
    setHeroOverlayColor(h.overlayColor || "#020617");
    setHeroBlurAmount(h.blurAmount ?? 0.5);
    setHeroTextShadow(h.textShadow || "none");
    setHeroTextOpacity(h.textOpacity ?? 100);
    setHeroThemeStyle(h.themeStyle || "dark");
    toast.success(`Applied historic snapshot configuration from ${new Date(historicConfig.updatedAt || Date.now()).toLocaleTimeString()}`);
  };

  // Save/Publish Live config
  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      const configPayload = compilePayload();

      // Read current config to push to rollback history stack
      const docRef = doc(db, "settings", "homepage");
      const currentSnap = await getDoc(docRef);
      if (currentSnap.exists()) {
        const prevData = currentSnap.data();
        const historyRef = doc(db, "settings", "homepage_history");
        const historySnap = await getDoc(historyRef);
        let currentHistory = [];
        if (historySnap.exists()) {
          currentHistory = historySnap.data().history || [];
        }
        // Limit historical stack to top 5
        const updatedHistory = [prevData, ...currentHistory].slice(0, 5);
        await setDoc(historyRef, { history: updatedHistory }, { merge: true });
        setHistoryList(updatedHistory);
      }

      // Save live configuration to Firestore settings collection
      try {
        await setDoc(docRef, configPayload, { merge: true });
        await setDoc(doc(db, "settings", "site_settings"), { heroVideoUrl }, { merge: true });
      } catch (directErr) {
        // Fallback to offlineQueue with reliable background sync
        await setDocWithQueue(docRef, configPayload, { merge: true });
        await setDocWithQueue(doc(db, "settings", "site_settings"), { heroVideoUrl }, { merge: true });
      }

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("sanatan_homepage_settings", JSON.stringify(configPayload));
          window.dispatchEvent(new CustomEvent("sanatan_homepage_settings_updated", { detail: configPayload }));
        } catch (e) {}
      }

      // Invalidate client and server snapshot to force generation
      try {
        snapshotEngine.clearCache();
        await snapshotEngine.triggerServerRebuild({ triggerSource: "admin_homepage_save" });
      } catch (snapErr) {
        console.warn("Snapshot rebuild trigger deferred:", snapErr);
      }

      localStorage.removeItem("sm_homepage_draft");
      setHasUnsavedDraft(false);

      toast.success("Civilizational Hero Customizer & Layout published LIVE successfully!");
    } catch (err: any) {
      console.error("Failed to publish homepage settings:", err);
      toast.error("Failed to publish: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleAddHeadline = () => {
    if (!newHeadline.trim()) return;
    setPinnedBreakingHeadlines((prev) => [newHeadline.trim(), ...prev]);
    setNewHeadline("");
  };

  const handleRemoveHeadline = (index: number) => {
    setPinnedBreakingHeadlines((prev) => prev.filter((_, i) => i !== index));
  };

  // Live styling previews helper calculations
  const textOpacity = heroTextOpacity / 100;
  const opacityHex = Math.round(heroOverlayOpacity * 2.55).toString(16).padStart(2, '0');
  const previewBgColor = `${heroOverlayColor}${opacityHex}`;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border-theme shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl">
            <Tv size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-card-foreground tracking-tight">
              Civilizational Command OS Manager
            </h1>
            <p className="text-xs font-semibold text-muted-text">
              Real-time tuning and preview of the Video Hero, translucent headers, and rollback history
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleSaveDraft}
            className="border border-border-theme hover:bg-muted-area text-card-foreground font-black text-xs px-5 py-3 rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Archive size={16} />
            <span>Stage Draft</span>
          </button>

          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-white font-black text-xs px-6 py-3 rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{saving ? "Publishing Live..." : "Publish Live Architecture"}</span>
          </button>
        </div>
      </div>

      {/* Unsaved Draft Bar Notification */}
      {hasUnsavedDraft && (
        <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-amber-500">
            <Sparkles size={16} className="animate-pulse" />
            <span className="text-xs font-bold">Workspace contains a staged, unpublished configuration draft.</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleLoadDraft}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              Apply Draft to Sliders
            </button>
            <button 
              onClick={handleClearDraft}
              className="hover:bg-muted-area text-muted-text font-black text-[10px] px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              Discard Draft
            </button>
          </div>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex flex-wrap gap-2 bg-card p-2 rounded-2xl border border-border-theme">
        {[
          { id: "hero", label: "Cinematic Hero Tuner", icon: Tv },
          { id: "header", label: "Header & Command Bar", icon: Command },
          { id: "layout", label: "Section Architecture", icon: Layout },
          { id: "breaking", label: "Live Operations Ticker", icon: Flame },
          { id: "audit", label: "Delivery Audit", icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-white shadow-md"
                  : "text-muted-text hover:text-card-foreground hover:bg-muted-area"
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Video Hero Manager */}
      {activeTab === "hero" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Controls Card */}
          <div className="lg:col-span-2 bg-card p-6 md:p-8 rounded-3xl border border-border-theme flex flex-col gap-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border-theme pb-4">
              <h2 className="text-base font-black text-card-foreground flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                <span>Cinematic Hero Customizer Panel</span>
              </h2>

              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-xs font-bold text-card-foreground">Hero Enabled</span>
                <input
                  type="checkbox"
                  checked={heroEnabled}
                  onChange={(e) => setHeroEnabled(e.target.checked)}
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-card-foreground uppercase tracking-wider">
                  Hero Media Type
                </label>
                <div className="flex bg-muted-area p-1 rounded-xl">
                  {(["youtube", "local", "image"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setHeroType(type)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                        heroType === type ? "bg-card text-primary shadow-sm" : "text-muted-text"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {heroType === "youtube" ? (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-card-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <LinkIcon size={14} className="text-primary" />
                    YouTube Video URL
                  </label>
                  <input
                    type="text"
                    value={heroVideoUrl}
                    onChange={(e) => setHeroVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="bg-muted-area border border-border-theme rounded-xl px-4 py-2.5 text-xs font-mono text-card-foreground focus:outline-hidden focus:border-primary"
                  />
                </div>
              ) : heroType === "local" ? (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-card-foreground uppercase tracking-wider">
                    Direct MP4 Video URL
                  </label>
                  <input
                    type="text"
                    value={heroVideoUrl}
                    onChange={(e) => setHeroVideoUrl(e.target.value)}
                    placeholder="https://domain.com/hero-video.mp4"
                    className="bg-muted-area border border-border-theme rounded-xl px-4 py-2.5 text-xs font-mono text-card-foreground focus:outline-hidden focus:border-primary"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-card-foreground uppercase tracking-wider">
                    Direct Image URL
                  </label>
                  <input
                    type="text"
                    value={heroImageUrl}
                    onChange={(e) => setHeroImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="bg-muted-area border border-border-theme rounded-xl px-4 py-2.5 text-xs font-mono text-card-foreground focus:outline-hidden focus:border-primary"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-card-foreground uppercase tracking-wider">
                  Display Title (Bilingual Friendly)
                </label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="bg-muted-area border border-border-theme rounded-xl px-4 py-2.5 text-xs font-bold text-card-foreground focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-card-foreground uppercase tracking-wider">
                  Display Subtitle
                </label>
                <input
                  type="text"
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  className="bg-muted-area border border-border-theme rounded-xl px-4 py-2.5 text-xs font-bold text-card-foreground focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-card-foreground uppercase tracking-wider">
                  CTA Action Button Label
                </label>
                <input
                  type="text"
                  value={heroCtaText}
                  onChange={(e) => setHeroCtaText(e.target.value)}
                  className="bg-muted-area border border-border-theme rounded-xl px-4 py-2.5 text-xs font-bold text-card-foreground focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-card-foreground uppercase tracking-wider">
                  Premium Accent Theme Style
                </label>
                <select
                  value={heroThemeStyle}
                  onChange={(e) => setHeroThemeStyle(e.target.value as any)}
                  className="bg-muted-area border border-border-theme rounded-xl px-4 py-2.5 text-xs font-bold text-card-foreground focus:outline-hidden focus:border-primary"
                >
                  <option value="dark">Standard Dark Luxury</option>
                  <option value="light">Refined High-Contrast Light</option>
                  <option value="gold">Saraswati Golden Glow</option>
                  <option value="crimson">Himalayan Crimson</option>
                </select>
              </div>

              {/* Advanced Sliders */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <label className="text-xs font-black text-card-foreground uppercase tracking-wider">
                    Background Media Opacity ({heroMediaOpacity}%)
                  </label>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={heroMediaOpacity}
                  onChange={(e) => setHeroMediaOpacity(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-muted-area rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <label className="text-xs font-black text-card-foreground uppercase tracking-wider">
                    Backdrop Overlay Opacity ({heroOverlayOpacity}%)
                  </label>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={heroOverlayOpacity}
                  onChange={(e) => setHeroOverlayOpacity(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-muted-area rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-card-foreground uppercase tracking-wider">
                  Backdrop Overlay Ambient Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={heroOverlayColor}
                    onChange={(e) => setHeroOverlayColor(e.target.value)}
                    className="w-9 h-9 border border-border-theme rounded-xl cursor-pointer p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={heroOverlayColor}
                    onChange={(e) => setHeroOverlayColor(e.target.value)}
                    className="flex-1 bg-muted-area border border-border-theme rounded-xl px-4 py-2.5 text-xs font-mono text-card-foreground focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <label className="text-xs font-black text-card-foreground uppercase tracking-wider">
                    Glassmorphic Backdrop Blur ({heroBlurAmount}px)
                  </label>
                </div>
                <input
                  type="range"
                  min={0}
                  max={8}
                  step={0.5}
                  value={heroBlurAmount}
                  onChange={(e) => setHeroBlurAmount(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-muted-area rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-card-foreground uppercase tracking-wider">
                  Display Text Shadow Preset
                </label>
                <select
                  value={SHADOW_PRESETS.find(p => p.value === heroTextShadow)?.value || "custom"}
                  onChange={(e) => {
                    if (e.target.value !== "custom") {
                      setHeroTextShadow(e.target.value);
                    }
                  }}
                  className="bg-muted-area border border-border-theme rounded-xl px-4 py-2.5 text-xs font-bold text-card-foreground focus:outline-hidden focus:border-primary"
                >
                  {SHADOW_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>{preset.label}</option>
                  ))}
                  <option value="custom">Custom Inline CSS Shadow</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <label className="text-xs font-black text-card-foreground uppercase tracking-wider">
                    Text Transparency Opacity ({heroTextOpacity}%)
                  </label>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={heroTextOpacity}
                  onChange={(e) => setHeroTextOpacity(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-muted-area rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {heroTextShadow === "custom" || !SHADOW_PRESETS.some(p => p.value === heroTextShadow) ? (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-card-foreground uppercase tracking-wider">
                  Custom Text Shadow Style (CSS Value)
                </label>
                <input
                  type="text"
                  value={heroTextShadow}
                  onChange={(e) => setHeroTextShadow(e.target.value)}
                  placeholder="0 4px 16px rgba(0,0,0,0.9)"
                  className="bg-muted-area border border-border-theme rounded-xl px-4 py-2.5 text-xs font-mono text-card-foreground focus:outline-hidden"
                />
              </div>
            ) : null}

            <div className="flex items-center gap-3 border-t border-border-theme pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowUserHide}
                  onChange={(e) => setAllowUserHide(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-card-foreground">
                  Allow Users to [Hide Hero] and restore from Header
                </span>
              </label>
            </div>
          </div>

          {/* Real-time Preview & Rollbacks Column */}
          <div className="flex flex-col gap-6">
            {/* Real-time Live Tuning Preview (Phase 7) */}
            <div className="bg-card p-6 rounded-3xl border border-border-theme shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-black text-card-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={14} className="text-primary" />
                Live Tuning Preview
              </h3>

              <div 
                style={{ backgroundColor: heroOverlayColor }}
                className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border-theme"
              >
                {/* Media backdrop mockup */}
                <div 
                  style={{ opacity: heroMediaOpacity / 100 }}
                  className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=600')] bg-cover bg-center"
                />

                {/* Overlays */}
                <div 
                  style={{ backgroundColor: previewBgColor }}
                  className="absolute inset-0 z-10"
                />
                <div 
                  style={{ backdropFilter: `blur(${heroBlurAmount}px)` }}
                  className="absolute inset-0 z-10"
                />

                {/* Simulated Content */}
                <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 text-center">
                  <div className="flex justify-between items-center">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded border border-amber-500/30 ${
                      heroThemeStyle === "gold" ? "text-amber-300 bg-amber-500/20" : "text-white bg-slate-800/80"
                    }`}>
                      LIVE PREVIEW
                    </span>
                  </div>

                  <div className="my-auto flex flex-col gap-1">
                    <h4 
                      style={{ textShadow: heroTextShadow, opacity: textOpacity }}
                      className={`text-lg md:text-xl font-black leading-tight ${
                        heroThemeStyle === "light" ? "text-slate-900" : "text-white"
                      }`}
                    >
                      {heroTitle || "Title"}
                    </h4>
                    <p 
                      style={{ textShadow: heroTextShadow, opacity: textOpacity }}
                      className={`text-[9px] md:text-[10px] font-bold ${
                        heroThemeStyle === "light" ? "text-slate-700" : "text-slate-200"
                      }`}
                    >
                      {heroSubtitle || "Subtitle"}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <span className={`text-[8px] font-black px-3 py-1 rounded-md shadow-md ${
                      heroThemeStyle === "gold" ? "bg-amber-400 text-slate-950" : 
                      heroThemeStyle === "crimson" ? "bg-red-600 text-white" : "bg-primary text-white"
                    }`}>
                      {heroCtaText || "Latest News"}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-bold text-muted-text text-center italic">
                Simulated real-time workspace canvas rendering
              </p>
            </div>

            {/* Quick Rollback Control Stack (Phase 7) */}
            <div className="bg-card p-6 rounded-3xl border border-border-theme shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-black text-card-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Undo2 size={14} className="text-primary" />
                Restore Architectural Snapshots
              </h3>

              {historyList.length === 0 ? (
                <div className="p-4 rounded-xl bg-muted-area/40 border border-border-theme text-center">
                  <p className="text-[10px] font-bold text-muted-text">
                    No historic snapshots archived yet. History is automatically updated upon publishing live changes.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {historyList.map((hist, index) => {
                    const dateStr = hist.updatedAt 
                      ? new Date(hist.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : `Revision #${index + 1}`;
                    return (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted-area/40 border border-border-theme hover:border-primary/40 transition-colors"
                      >
                        <div>
                          <span className="text-[10px] font-black text-card-foreground block">
                            {dateStr}
                          </span>
                          <span className="text-[9px] text-muted-text font-semibold truncate max-w-[140px] block">
                            Title: {hist.hero?.title || "Untitled"}
                          </span>
                        </div>
                        <button
                          onClick={() => handleApplyRollback(hist)}
                          className="bg-primary/10 hover:bg-primary/20 text-primary font-black text-[9px] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          Restore
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Header & Command Bar Settings */}
      {activeTab === "header" && (
        <div className="bg-card p-6 md:p-8 rounded-3xl border border-border-theme flex flex-col gap-6 shadow-sm">
          <h2 className="text-lg font-black text-card-foreground border-b border-border-theme pb-4 flex items-center gap-2">
            <Command size={18} className="text-primary" />
            <span>Civilizational Command Bar Configuration</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted-area/40 border border-border-theme">
              <div>
                <span className="text-xs font-bold text-card-foreground block">Layer 1: Utility Intelligence Bar</span>
                <span className="text-[10px] text-muted-text">Shows Date, Panchang, Trust Messages, Language Switcher</span>
              </div>
              <input
                type="checkbox"
                checked={enableUtilityBar}
                onChange={(e) => setEnableUtilityBar(e.target.checked)}
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted-area/40 border border-border-theme">
              <div>
                <span className="text-xs font-bold text-card-foreground block">Layer 3: Live Operations Ticker Strip</span>
                <span className="text-[10px] text-muted-text">Shows pulsating live breaking news ticker beneath main navigation</span>
              </div>
              <input
                type="checkbox"
                checked={enableLiveTicker}
                onChange={(e) => setEnableLiveTicker(e.target.checked)}
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted-area/40 border border-border-theme">
              <div>
                <span className="text-xs font-bold text-card-foreground block">Transparent Hero Glass Morphing</span>
                <span className="text-[10px] text-muted-text">Header renders transparent over Video Hero and turns glassmorphic on scroll</span>
              </div>
              <input
                type="checkbox"
                checked={headerTransparentMode}
                onChange={(e) => setHeaderTransparentMode(e.target.checked)}
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted-area/40 border border-border-theme">
              <div>
                <span className="text-xs font-bold text-card-foreground block">Sticky Navigation Header</span>
                <span className="text-[10px] text-muted-text">Pins main command header to top of viewport when scrolling</span>
              </div>
              <input
                type="checkbox"
                checked={headerStickyMode}
                onChange={(e) => setHeaderStickyMode(e.target.checked)}
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Section Architecture Layout */}
      {activeTab === "layout" && (
        <div className="bg-card p-6 md:p-8 rounded-3xl border border-border-theme flex flex-col gap-6 shadow-sm">
          <h2 className="text-lg font-black text-card-foreground border-b border-border-theme pb-4">
            Homepage Layout Section Toggles (v5.2 Order)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "hero", label: "1. Cinematic Video Hero" },
              { key: "breakingNews", label: "2. Breaking News Strip (🔴 LIVE)" },
              { key: "categoryGrid", label: "3. Primary Category Nav Grid" },
              { key: "featuredStories", label: "4. Featured Newsroom Grid (1 Lead + 4 Secondary)" },
              { key: "latestNews", label: "5. Latest News Feed" },
              { key: "categoryBlocks", label: "6. Dynamic Category Blocks" },
              { key: "districtIntelligence", label: "7. Nepal 77 District Intelligence Map" },
              { key: "knowledgeOS", label: "8. Saraswati KnowledgeOS Showcase" },
              { key: "communityOnboarding", label: "9. Chautari Community Hub Onboarding" },
            ].map((section) => (
              <div
                key={section.key}
                className="flex items-center justify-between p-4 rounded-2xl bg-muted-area/40 border border-border-theme"
              >
                <span className="text-xs font-bold text-card-foreground">{section.label}</span>
                <input
                  type="checkbox"
                  checked={(layoutConfig as any)[section.key] ?? true}
                  onChange={(e) =>
                    setLayoutConfig((prev) => ({ ...prev, [section.key]: e.target.checked }))
                  }
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Breaking News Headlines */}
      {activeTab === "breaking" && (
        <div className="bg-card p-6 md:p-8 rounded-3xl border border-border-theme flex flex-col gap-6 shadow-sm">
          <h2 className="text-lg font-black text-card-foreground border-b border-border-theme pb-4">
            Pinned Live Headlines Ticker
          </h2>

          <div className="flex gap-3">
            <input
              type="text"
              value={newHeadline}
              onChange={(e) => setNewHeadline(e.target.value)}
              placeholder="Enter custom live breaking headline..."
              className="flex-grow bg-muted-area border border-border-theme rounded-2xl px-4 py-3 text-xs font-bold text-card-foreground focus:outline-hidden focus:border-primary"
            />
            <button
              onClick={handleAddHeadline}
              className="bg-primary hover:bg-primary/90 text-white font-black text-xs px-6 py-3 rounded-2xl transition-all cursor-pointer"
            >
              Add Headline
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {pinnedBreakingHeadlines.map((headline, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-2xl bg-muted-area/40 border border-border-theme"
              >
                <span className="text-xs font-bold text-card-foreground">{headline}</span>
                <button
                  onClick={() => handleRemoveHeadline(idx)}
                  className="text-red-500 hover:text-red-600 text-xs font-bold cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Delivery Audit */}
      {activeTab === "audit" && (
        <div className="bg-card p-6 md:p-8 rounded-3xl border border-border-theme shadow-sm">
          <SnapshotTraceDashboard />
        </div>
      )}
    </div>
  );
}
