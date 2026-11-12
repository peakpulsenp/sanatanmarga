import React, { useState, useEffect, useMemo } from "react";
import { 
  Sparkles, Shield, AlertTriangle, CheckCircle2, Lock, Eye, 
  Search, RefreshCw, Sliders, History, Activity, 
  ToggleLeft, ToggleRight, Layers, HelpCircle, Save, ChevronRight
} from "lucide-react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { useAuth } from "@/src/lib/auth";
import { featureControlOS } from "@/src/services/featureControlOS";
import { 
  CANONICAL_FEATURE_REGISTRY, 
  FeatureDefinition, 
  FeatureState, 
  FeatureCategory, 
  RolloutPresetName,
  ROLLOUT_PROFILES,
  FeatureAuditRecord
} from "@/src/config/featureRegistry";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { toast } from "sonner";

export default function AdminFeatureControl() {
  const { user } = useAuth();
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1200);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<FeatureCategory | "all">("all");
  const [stateFilter, setStateFilter] = useState<FeatureState | "all">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [stats, setStats] = useState(() => featureControlOS.getSummaryStats());
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [auditRecords, setAuditRecords] = useState<FeatureAuditRecord[]>([]);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Listen to feature control updates
  useEffect(() => {
    const handleUpdate = () => {
      setStats(featureControlOS.getSummaryStats());
      setLastUpdated(Date.now());
    };

    window.addEventListener("feature-control-updated", handleUpdate);
    return () => window.removeEventListener("feature-control-updated", handleUpdate);
  }, []);

  // Load audit trail
  const openAuditTrail = () => {
    const config = featureControlOS.getConfig();
    setAuditRecords(config.auditTrail || []);
    setShowAuditModal(true);
  };

  // Categories list
  const categories: { id: FeatureCategory | "all"; labelNe: string; labelEn: string }[] = [
    { id: "all", labelNe: "सबै", labelEn: "All" },
    { id: "core", labelNe: "कोर", labelEn: "Core" },
    { id: "homepage", labelNe: "होमपेज", labelEn: "Homepage" },
    { id: "article", labelNe: "लेख मोड्युल", labelEn: "Article" },
    { id: "navigation", labelNe: "नेभिगेसन", labelEn: "Navigation" },
    { id: "sidebar", labelNe: "साइडबार", labelEn: "Sidebar" },
    { id: "media", labelNe: "मिडिया", labelEn: "Media" },
    { id: "ai", labelNe: "एआई / टीटीएस", labelEn: "AI & TTS" },
    { id: "knowledge", labelNe: "ज्ञान केन्द्र", labelEn: "Knowledge" },
    { id: "community", labelNe: "समुदाय", labelEn: "Community" },
    { id: "commerce", labelNe: "इ-कमर्स", labelEn: "Commerce" },
    { id: "revenue", labelNe: "राजस्व", labelEn: "Revenue" },
    { id: "training", labelNe: "प्रशिक्षण", labelEn: "Training" },
    { id: "notifications", labelNe: "सूचनाहरू", labelEn: "Notifications" },
    { id: "nepal_hub", labelNe: "नेपाल हब", labelEn: "Nepal Hub" },
    { id: "blog", labelNe: "ब्लग", labelEn: "Blog" },
    { id: "infrastructure", labelNe: "पूर्वाधार", labelEn: "Infrastructure" }
  ];

  // Filter features
  const filteredFeatures = useMemo(() => {
    return CANONICAL_FEATURE_REGISTRY.filter(feature => {
      // Category filter
      if (activeCategory !== "all" && feature.category !== activeCategory) {
        return false;
      }

      // State filter
      const effectiveState = featureControlOS.getEffectiveState(feature.id);
      if (stateFilter !== "all" && effectiveState !== stateFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = feature.id.toLowerCase().includes(query);
        const matchesNe = feature.nameNe.toLowerCase().includes(query);
        const matchesEn = feature.nameEn.toLowerCase().includes(query);
        const matchesDesc = feature.descriptionEn.toLowerCase().includes(query) || feature.descriptionNe.toLowerCase().includes(query);
        return matchesId || matchesNe || matchesEn || matchesDesc;
      }

      return true;
    });
  }, [activeCategory, stateFilter, searchQuery, lastUpdated]);

  const handleStateChange = async (feature: FeatureDefinition, targetState: FeatureState) => {
    const currentState = featureControlOS.getDirectState(feature.id);
    if (currentState === targetState) return;

    const actor = {
      id: user?.uid || "admin",
      email: user?.email || undefined,
      role: (user as any)?.role || "admin"
    };

    const executeChange = async () => {
      const res = await featureControlOS.setFeatureState(feature.id, targetState, actor, `Admin UI updated ${feature.id} to ${targetState}`);
      if (res.success) {
        toast.success(`${feature.nameEn} (${feature.id}) state changed to ${targetState.toUpperCase()}`);
        setStats(featureControlOS.getSummaryStats());
        setLastUpdated(Date.now());
      } else {
        toast.error(res.error || "Failed to update feature state");
      }
    };

    if (feature.critical && targetState === "off") {
      setConfirmModal({
        isOpen: true,
        title: `क्रिटिकल फिचर चेतावनी: ${feature.nameEn}`,
        message: `यो फिचर क्रिटिकल प्रणाली कम्पोनेन्ट हो। यसलाई बन्द गर्दा सम्बन्धित मोड्युल वा प्रयोगकर्ता अनुभवमा गम्भीर असर पर्न सक्छ। के तपाईं निश्चित हुनुहुन्छ?`,
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          executeChange();
        }
      });
      return;
    }

    await executeChange();
  };

  const handleApplyPreset = (presetName: RolloutPresetName) => {
    const profile = ROLLOUT_PROFILES[presetName];
    if (!profile) return;

    setConfirmModal({
      isOpen: true,
      title: `रोलआउट प्रोफाइल लागू गर्नुहोस्: ${profile.nameEn}`,
      message: `${profile.descriptionEn} (${profile.descriptionNe})। के तपाईं यो प्रोफाइलका सबै सेटिङहरू लागू गर्न निश्चित हुनुहुन्छ?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        const actor = {
          id: user?.uid || "admin",
          email: user?.email || undefined,
          role: (user as any)?.role || "admin"
        };
        const res = await featureControlOS.applyRolloutProfile(presetName, actor, `Applied preset ${presetName} via Admin UI`);
        if (res.success) {
          toast.success(`Rollout profile ${profile.nameEn} applied successfully`);
          setStats(featureControlOS.getSummaryStats());
          setLastUpdated(Date.now());
        } else {
          toast.error(res.error || "Failed to apply rollout profile");
        }
      }
    });
  };

  const handleResetDefaults = () => {
    setConfirmModal({
      isOpen: true,
      title: "प्रारम्भिक मानमा रिसेट गर्नुहोस् (Reset to Defaults)",
      message: "सबै फिचरहरूलाई तिनको आधारभूत (Compiled Defaults) सेटिङमा फर्काइनेछ। यो अपरिवर्तनीय कार्य हो।",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        const actor = {
          id: user?.uid || "admin",
          email: user?.email || undefined,
          role: (user as any)?.role || "super_admin"
        };
        const res = await featureControlOS.resetToDefaults(actor, "Admin UI reset to compiled defaults");
        if (res.success) {
          toast.success("Feature states reset to compiled defaults");
          setStats(featureControlOS.getSummaryStats());
          setLastUpdated(Date.now());
        } else {
          toast.error(res.error || "Reset failed");
        }
      }
    });
  };

  const getStateBadgeColor = (state: FeatureState) => {
    switch (state) {
      case "public":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "beta":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "admin_only":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "off":
      default:
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    }
  };

  return (
    <AdminLayout title="फिचर नियन्त्रण तथा विमोचन प्रणाली">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border-theme px-4 pl-28 lg:pl-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sliders size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black text-card-foreground">
                  फिचर नियन्त्रण तथा विमोचन प्रणाली
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Feature Control OS v1
                </span>
              </div>
              <p className="text-xs text-muted-text">
                Centralized Launch Governance, Gradual Rollout & Real-Time Kill Switches
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openAuditTrail}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-border-theme bg-card hover:bg-muted transition-colors text-muted-text hover:text-foreground"
            >
              <History size={14} />
              अडिट लग (Audit Log)
            </button>
            <button
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 transition-colors"
            >
              <RefreshCw size={14} />
              रिसेट (Defaults)
            </button>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Statistics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-card p-4 rounded-2xl border border-border-theme flex flex-col gap-1 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">कुल फिचरहरू (Total)</span>
              <span className="text-2xl font-black text-card-foreground">{stats.total}</span>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-1 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">सार्वजनिक (Public)</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.publicCount}</span>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex flex-col gap-1 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">बिटा (Beta)</span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.betaCount}</span>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex flex-col gap-1 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">एडमिन मात्र (Admin Only)</span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.adminOnlyCount}</span>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex flex-col gap-1 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">निष्क्रिय (Off)</span>
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.offCount}</span>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col gap-1 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">सुरक्षित (Critical)</span>
              <span className="text-2xl font-black text-primary">{stats.criticalCount}</span>
            </div>
          </div>

          {/* Rollout Preset Profiles */}
          <div className="bg-card p-5 rounded-2xl border border-border-theme space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-primary" />
                <h2 className="text-sm font-black text-card-foreground uppercase tracking-wider">
                  विमोचन प्रोफाइलहरू (Rollout Profiles)
                </h2>
              </div>
              <span className="text-xs text-muted-text">
                पूर्वनिर्धारित प्रोफाइल एक क्लिकमा सक्रिय गर्नुहोस्
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {(Object.keys(ROLLOUT_PROFILES) as RolloutPresetName[]).map(presetKey => {
                const profile = ROLLOUT_PROFILES[presetKey];
                const isEmergency = presetKey === "EMERGENCY_MODE";
                return (
                  <button
                    key={presetKey}
                    onClick={() => handleApplyPreset(presetKey)}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all ${
                      isEmergency
                        ? "border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        : "border-border-theme bg-background hover:border-primary/50 text-card-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">{profile.nameEn}</span>
                      {isEmergency && <AlertTriangle size={13} className="text-rose-500" />}
                    </div>
                    <span className="text-[10px] text-muted-text leading-tight line-clamp-2">
                      {profile.descriptionNe}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="फिचरको नाम, आईडी वा विवरण खोज्नुहोस्..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-border-theme bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 text-card-foreground"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={stateFilter}
                onChange={e => setStateFilter(e.target.value as any)}
                aria-label="Filter features by status"
                className="px-3 py-2 text-xs rounded-xl border border-border-theme bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">सबै स्थिति (All Status)</option>
                <option value="public">सार्वजनिक (Public)</option>
                <option value="beta">बिटा (Beta)</option>
                <option value="admin_only">एडमिन मात्र (Admin Only)</option>
                <option value="off">निष्क्रिय (Off)</option>
              </select>
            </div>
          </div>

          {/* Categories Tab Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
            {categories.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-card border border-border-theme text-muted-text hover:text-card-foreground"
                  }`}
                >
                  {cat.labelNe} ({cat.labelEn})
                </button>
              );
            })}
          </div>

          {/* Feature List Table */}
          <div className="bg-card rounded-2xl border border-border-theme overflow-hidden shadow-xs">
            <div className="p-4 border-b border-border-theme flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted-text">
                फिचर सूची ({filteredFeatures.length} परिणाम)
              </span>
              <span className="text-[11px] text-muted-text">
                नियम: कोड अवस्थित हुनु भनेको सार्वजनिक हुनु होइन।
              </span>
            </div>

            <div className="divide-y divide-border-theme/60">
              {filteredFeatures.map(feature => {
                const directState = featureControlOS.getDirectState(feature.id);
                const evaluation = featureControlOS.evaluateFeature(feature.id);
                const effectiveState = evaluation.effectiveState;
                const isOverridden = directState !== feature.defaultState;
                const isBlockedByParent = directState === "public" && effectiveState !== "public";

                return (
                  <div
                    key={feature.id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted-area/5 transition-colors"
                  >
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-primary">
                          {feature.id}
                        </span>
                        {feature.critical && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <Shield size={10} /> CRITICAL
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-text">
                          {feature.category}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {evaluation.lifecycleState}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-text bg-muted border border-border-theme">
                          {evaluation.exposure}
                        </span>
                        {isOverridden && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            Overridden
                          </span>
                        )}
                        {evaluation.reason !== "OK" && evaluation.reason !== "PUBLIC_ACCESS" && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            Reason: {evaluation.reason}
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-bold text-card-foreground">
                        {feature.nameNe} &bull; <span className="font-normal text-muted-text">{feature.nameEn}</span>
                      </div>

                      <p className="text-xs text-muted-text">
                        {feature.descriptionNe || feature.descriptionEn}
                      </p>

                      {/* Operational Controls Status */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-mono">
                        <span className={`px-1.5 py-0.5 rounded ${evaluation.routeAllowed ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-text line-through"}`}>
                          Route
                        </span>
                        <span className={`px-1.5 py-0.5 rounded ${evaluation.mountAllowed ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-text line-through"}`}>
                          Mount
                        </span>
                        <span className={`px-1.5 py-0.5 rounded ${evaluation.snapshotAllowed ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-text line-through"}`}>
                          Snapshot
                        </span>
                        <span className={`px-1.5 py-0.5 rounded ${evaluation.seoAllowed ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-text line-through"}`}>
                          SEO
                        </span>
                        <span className={`px-1.5 py-0.5 rounded ${evaluation.listenerAllowed ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-text line-through"}`}>
                          Listener
                        </span>
                        <span className={`px-1.5 py-0.5 rounded ${evaluation.backgroundAllowed ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-text line-through"}`}>
                          Job
                        </span>
                      </div>

                      {/* Parent or Dependency Warnings */}
                      {(feature.parentId || (feature.dependencies && feature.dependencies.length > 0)) && (
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-text">
                          {feature.parentId && (
                            <span>
                              मूल (Parent): <code className="font-mono text-foreground">{feature.parentId}</code>
                            </span>
                          )}
                          {feature.dependencies && feature.dependencies.length > 0 && (
                            <span>
                              निर्भरता (Deps): <code className="font-mono text-foreground">{feature.dependencies.join(", ")}</code>
                            </span>
                          )}
                          {isBlockedByParent && (
                            <span className="text-rose-500 font-bold flex items-center gap-1">
                              <AlertTriangle size={11} /> मूल वा निर्भरता निष्क्रिय भएकाले प्रभावकारी स्थिति घटाइएको छ
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* State Selector Buttons */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border-theme">
                        {(["off", "admin_only", "beta", "public"] as FeatureState[]).map(st => {
                          const isSelected = directState === st;
                          return (
                            <button
                              key={st}
                              onClick={() => handleStateChange(feature, st)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                isSelected
                                  ? `${getStateBadgeColor(st)} font-black border shadow-xs`
                                  : "text-muted-text hover:text-foreground"
                              }`}
                            >
                              {st === "off" && "बन्द (Off)"}
                              {st === "admin_only" && "एडमिन (Admin)"}
                              {st === "beta" && "बिटा (Beta)"}
                              {st === "public" && "सार्वजनिक (Public)"}
                            </button>
                          );
                        })}
                      </div>

                      <div className="text-[10px] text-muted-text flex items-center gap-2">
                        <span>प्रभावकारी (Effective):</span>
                        <span className={`px-1.5 py-0.5 rounded font-bold border ${getStateBadgeColor(effectiveState)}`}>
                          {effectiveState.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredFeatures.length === 0 && (
                <div className="p-12 text-center text-muted-text text-xs space-y-2">
                  <AlertTriangle size={24} className="mx-auto text-muted-text/50" />
                  <p>कुनै पनि फिचर फेला परेन। कृपया फिल्टर वा खोज शब्द जाँच गर्नुहोस्।</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Audit Log Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-2xl rounded-2xl border border-border-theme p-6 space-y-4 shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border-theme pb-3">
              <div className="flex items-center gap-2">
                <History size={18} className="text-primary" />
                <h3 className="text-base font-black text-card-foreground">
                  फिचर अडिट लग (Feature Audit Trail)
                </h3>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-muted-text hover:text-foreground text-xs font-bold px-2 py-1 rounded"
              >
                बन्द गर्नुहोस्
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border-theme/60 space-y-2">
              {auditRecords.map(rec => (
                <div key={rec.id} className="pt-2 text-xs space-y-1">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-primary">{rec.featureId}</span>
                    <span className="text-[10px] text-muted-text">
                      {new Date(rec.timestamp).toLocaleString("ne-NP")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className={`px-1.5 py-0.5 rounded font-bold border ${getStateBadgeColor(rec.previousState)}`}>
                      {rec.previousState}
                    </span>
                    <ChevronRight size={12} className="text-muted-text" />
                    <span className={`px-1.5 py-0.5 rounded font-bold border ${getStateBadgeColor(rec.newState)}`}>
                      {rec.newState}
                    </span>
                    <span className="text-muted-text ml-auto">
                      द्वारा: {rec.actorEmail || rec.actorId} ({rec.actorRole})
                    </span>
                  </div>
                  {rec.reason && (
                    <p className="text-[11px] text-muted-text italic">
                      कारण: {rec.reason}
                    </p>
                  )}
                </div>
              ))}

              {auditRecords.length === 0 && (
                <div className="p-8 text-center text-muted-text text-xs">
                  कुनै अडिट लग रेकर्ड फेला परेन।
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
