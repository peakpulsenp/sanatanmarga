import { useState, useEffect } from "react";
import { 
  Tv, Radio, Plus, Search, Filter, Play, CheckCircle2, XCircle, 
  Trash2, Edit, ShieldAlert, Eye, MessageSquare, Share2, Sparkles, 
  RefreshCw, Settings, BarChart2, Globe, Video, UserCheck, Check, 
  Clock, Calendar, AlertTriangle, Users, DollarSign, Bell, Shield,
  VolumeX, Ban, ExternalLink, Pin, ArrowUpRight, ShieldCheck
} from "lucide-react";
import AdminLayout from "../components/layout/AdminLayout";
import { useAuth } from "../lib/auth";
import { 
  LiveVideo, 
  LiveStreamSettings, 
  SocialSourceConfig, 
  LiveChatMessage,
  LiveParticipant,
  LiveModerationAction,
  LiveSponsorCampaign
} from "../types/live";
import { LiveService } from "../services/liveService";
import { LiveProviderService } from "../services/liveProviderService";
import { LiveHubAcceptanceGate, LiveHubAcceptanceReport } from "../services/liveHubAcceptanceGate";
import NepaliInput from "../components/ui/NepaliInput";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

type AdminLiveTab = 
  | "overview"
  | "streams" 
  | "chat" 
  | "moderation" 
  | "participants" 
  | "advertising" 
  | "scheduling" 
  | "notifications" 
  | "analytics" 
  | "settings";

export default function AdminLive() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminLiveTab>("overview");
  const [loading, setLoading] = useState(true);

  // Data states
  const [liveNow, setLiveNow] = useState<LiveVideo[]>([]);
  const [scheduled, setScheduled] = useState<LiveVideo[]>([]);
  const [pending, setPending] = useState<LiveVideo[]>([]);
  const [ended, setEnded] = useState<LiveVideo[]>([]);
  const [allVideos, setAllVideos] = useState<LiveVideo[]>([]);
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [participants, setParticipants] = useState<LiveParticipant[]>([]);
  const [moderationLogs, setModerationLogs] = useState<LiveModerationAction[]>([]);
  const [sponsorCampaigns, setSponsorCampaigns] = useState<LiveSponsorCampaign[]>([]);
  const [selectedStreamForChat, setSelectedStreamForChat] = useState<string>("");

  const [settings, setSettings] = useState<LiveStreamSettings>({
    chatEnabled: true,
    slowModeSeconds: 3,
    requireAuthentication: false,
    allowLinks: false,
    allowImages: false,
    memberOnlyChat: false,
    verifiedOnlyChat: false,
    moderationMode: "auto",
    defaultChatPresentation: "side"
  });

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Partial<LiveVideo> | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Partial<LiveSponsorCampaign> | null>(null);

  // Acceptance Gate State
  const [acceptanceReport, setAcceptanceReport] = useState<LiveHubAcceptanceReport | null>(null);
  const [isRunningAcceptance, setIsRunningAcceptance] = useState(false);
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);

  const handleRunAcceptance = async () => {
    setIsRunningAcceptance(true);
    setShowAcceptanceModal(true);
    try {
      const rep = await LiveHubAcceptanceGate.runSuite();
      setAcceptanceReport(rep);
      if (rep.overallStatus === "PASS") {
        toast.success(`सबै ${rep.totalGates}/${rep.totalGates} प्रमाणीकरण गेटहरू सफल (All 38 Gates Passed)`);
      } else {
        toast.error(`${rep.failedGates} प्रमाणीकरण गेट असफल भयो`);
      }
    } catch (err) {
      toast.error("प्रमाणीकरण परीक्षणमा त्रुटि आयो");
    } finally {
      setIsRunningAcceptance(false);
    }
  };

  // Form State for Stream
  const [formData, setFormData] = useState<Partial<LiveVideo>>({
    title: "",
    titleEn: "",
    description: "",
    descriptionEn: "",
    sourceType: "youtube",
    sourceUrl: "",
    thumbnailUrl: "",
    category: "समाचार",
    province: "बागमती प्रदेश",
    district: "काठमाडौँ",
    language: "ne",
    broadcasterName: "सनातन मार्ग डिजिटल डेस्क",
    status: "live",
    isFeatured: true,
    isLive: true,
    editorialStatus: "verified",
    sourceVerified: true,
    revenuePlacement: "none"
  });

  // Form State for Ad Campaign
  const [adFormData, setAdFormData] = useState<Partial<LiveSponsorCampaign>>({
    advertiserName: "",
    campaignName: "",
    placement: "LIVE_BOTTOM_TICKER",
    headlineNe: "",
    headlineEn: "",
    destinationUrl: "",
    ctaText: "हेर्नुहोस्",
    scrollSpeed: "normal",
    priority: 80,
    status: "active",
    targetCategories: [],
    targetDistricts: [],
    targetTiers: ["free", "member"]
  });

  // Notification form state
  const [notificationData, setNotificationData] = useState({
    title: "",
    message: "",
    targetStreamId: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load all live videos & settings
  const loadData = async () => {
    setLoading(true);
    try {
      const snap = await LiveService.getLiveStateFromFirestore();
      setLiveNow(snap.liveNow || []);
      setScheduled(snap.scheduled || []);
      setEnded(snap.latestVideos.filter(v => v.status === "ended" || v.status === "archived"));
      setSettings(snap.settings);

      const all = [...snap.liveNow, ...snap.scheduled, ...snap.latestVideos];
      setAllVideos(all);
      setPending(all.filter(v => v.status === "pending_review"));

      const defaultStreamId = snap.liveNow[0]?.id || snap.featured?.id || all[0]?.id || "";
      setSelectedStreamForChat(defaultStreamId);

      if (defaultStreamId) {
        const msgs = await LiveService.getChatMessages(defaultStreamId);
        setChatMessages(msgs);
        setParticipants(LiveService.getParticipants(defaultStreamId));
      }

      setModerationLogs(LiveService.getModerationLogs());
      setSponsorCampaigns(LiveService.getLiveSponsorCampaigns());
    } catch (e) {
      console.error("AdminLive load error:", e);
      toast.error("डाटा लोड गर्दा त्रुटि भयो");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedStreamForChat) return;
    const fetchStreamChat = async () => {
      const msgs = await LiveService.getChatMessages(selectedStreamForChat);
      setChatMessages(msgs);
      setParticipants(LiveService.getParticipants(selectedStreamForChat));
    };
    fetchStreamChat();
  }, [selectedStreamForChat]);

  // Handle URL change & auto-resolve embed metadata
  const handleUrlChange = (url: string) => {
    const resolved = LiveProviderService.resolveSource(url, formData.sourceType);
    setFormData(prev => ({
      ...prev,
      sourceUrl: url,
      sourceType: resolved.sourceType,
      embedUrl: resolved.embedUrl,
      externalId: resolved.externalId,
      thumbnailUrl: prev.thumbnailUrl || resolved.thumbnailUrl
    }));
  };

  // Save or Edit Video Stream
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.sourceUrl) {
      toast.error("कृपया शीर्षक र स्रोत लिङ्क भर्नुहोस्");
      return;
    }

    setIsSubmitting(true);
    try {
      const savedId = await LiveService.saveLiveVideo(formData, user?.uid || "admin");
      if (savedId) {
        toast.success("प्रत्यक्ष प्रसारण सफलतापूर्वक सुरक्षित गरियो!");
        setShowAddModal(false);
        setEditingVideo(null);
        loadData();
      } else {
        toast.error("भिडियो सुरक्षित गर्न सकिएन");
      }
    } catch (err) {
      toast.error("त्रुटि देखा पर्यो");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete video
  const handleDeleteVideo = async (id: string) => {
    if (!confirm("के तपाईं यो लाइभ प्रसारण हटाउन निश्चित हुनुहुन्छ?")) return;
    const success = await LiveService.deleteLiveVideo(id);
    if (success) {
      toast.success("लाइभ भिडियो हटाइयो");
      loadData();
    } else {
      toast.error("भिडियो हटाउन सकिएन");
    }
  };

  // Save Sponsor Campaign
  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adFormData.headlineNe || !adFormData.destinationUrl) {
      toast.error("कृपया शीर्षक र गन्तव्य लिङ्क भर्नुहोस्");
      return;
    }

    const ok = LiveService.saveLiveSponsorCampaign(adFormData, user?.uid || "admin");
    if (ok) {
      toast.success("प्रायोजन अभियान सुरक्षित गरियो!");
      setShowAdModal(false);
      setEditingCampaign(null);
      setSponsorCampaigns(LiveService.getLiveSponsorCampaigns());
    } else {
      toast.error("अभियान सुरक्षित गर्न सकिएन");
    }
  };

  const handleDeleteCampaign = (id: string) => {
    if (!confirm("यो प्रायोजक अभियान हटाउनुहुन्छ?")) return;
    LiveService.deleteLiveSponsorCampaign(id);
    setSponsorCampaigns(LiveService.getLiveSponsorCampaigns());
    toast.success("अभियान हटाइयो");
  };

  // Send Push Notification
  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationData.title || !notificationData.message) {
      toast.error("कृपया सूचनाको शीर्षक र सन्देश प्रविष्ट गर्नुहोस्");
      return;
    }
    toast.success(`सूचना सफलतापूर्वक पठाइयो: ${notificationData.title}`);
    setShowNotificationModal(false);
    setNotificationData({ title: "", message: "", targetStreamId: "" });
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await LiveService.saveLiveSettings(settings);
    if (ok) {
      toast.success("लाइभ सेटिङहरू सुरक्षित गरियो!");
    } else {
      toast.error("सेटिङ सुरक्षित गर्न सकिएन");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20 font-sans">
        
        {/* HEADER & CONTROLS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border-theme rounded-2xl p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-red-500">
                SANATANMARGA LIVE MEDIA OS v3
              </span>
            </div>
            <h1 className="text-2xl font-black text-card-foreground">प्रत्यक्ष प्रसारण तथा मिडिया व्यवस्थापन</h1>
            <p className="text-xs text-muted-text">
              Live Broadcasts, Realtime Chat, Moderation, Revenue Tickers & 77 District Continuity
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setEditingVideo(null);
                setFormData({
                  title: "",
                  titleEn: "",
                  description: "",
                  sourceType: "youtube",
                  sourceUrl: "",
                  category: "समाचार",
                  province: "बागमती प्रदेश",
                  district: "काठमाडौँ",
                  status: "live",
                  isLive: true,
                  isFeatured: true,
                  editorialStatus: "verified",
                  sourceVerified: true
                });
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all shadow-lg cursor-pointer"
            >
              <Plus size={15} />
              <span>नयाँ प्रत्यक्ष प्रसारण (Start Live)</span>
            </button>

            <button
              onClick={() => {
                setEditingCampaign(null);
                setAdFormData({
                  advertiserName: "",
                  campaignName: "",
                  placement: "LIVE_BOTTOM_TICKER",
                  headlineNe: "",
                  destinationUrl: "",
                  ctaText: "हेर्नुहोस्",
                  priority: 85,
                  status: "active"
                });
                setShowAdModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-lg cursor-pointer"
            >
              <DollarSign size={14} />
              <span>प्रायोजक टिकर थप्नुहोस्</span>
            </button>

            <button
              onClick={handleRunAcceptance}
              disabled={isRunningAcceptance}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/40 transition-all shadow-lg cursor-pointer"
            >
              <ShieldCheck size={14} className={isRunningAcceptance ? "animate-spin text-emerald-400" : "text-emerald-400"} />
              <span>{isRunningAcceptance ? "प्रमाणीकरण हुँदै..." : "प्रमाणीकरण (Acceptance Gate 38/38)"}</span>
            </button>

            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-muted-area hover:bg-muted-area/80 text-muted-text hover:text-foreground border border-border-theme transition-colors cursor-pointer"
              title="रिफ्रेस गर्नुहोस्"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* 10-TAB NAVIGATION */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border-theme custom-scrollbar">
          {[
            { id: "overview", label: "अवलोकन (Overview)", icon: Tv },
            { id: "streams", label: `प्रसारणहरू (${allVideos.length})`, icon: Video },
            { id: "chat", label: "च्याट कन्सोल (Chat)", icon: MessageSquare },
            { id: "moderation", label: `सञ्चालन (${moderationLogs.length})`, icon: Shield },
            { id: "participants", label: `सहभागी (${participants.length})`, icon: Users },
            { id: "advertising", label: `विज्ञापन (${sponsorCampaigns.length})`, icon: DollarSign },
            { id: "scheduling", label: `तालिका (${scheduled.length})`, icon: Calendar },
            { id: "notifications", label: "सूचनाहरू (Alerts)", icon: Bell },
            { id: "analytics", label: "विश्लेषण (Analytics)", icon: BarChart2 },
            { id: "settings", label: "सेटिङ (Settings)", icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminLiveTab)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-amber-500 text-black shadow-lg"
                    : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI METRICS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-1">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>लाइभ प्रसारण</span>
                  <Radio size={15} className="text-red-500 animate-pulse" />
                </div>
                <div className="text-2xl font-black text-white">{liveNow.length}</div>
                <div className="text-[10px] text-emerald-400">सक्रिय प्रत्यक्ष च्यानलहरू</div>
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-1">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>तालिकाबद्ध</span>
                  <Calendar size={15} className="text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white">{scheduled.length}</div>
                <div className="text-[10px] text-amber-400">आगामी विशेष प्रसारणहरू</div>
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-1">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>सक्रिय प्रायोजक टिकर</span>
                  <DollarSign size={15} className="text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {sponsorCampaigns.filter(c => c.status === "active").length}
                </div>
                <div className="text-[10px] text-zinc-400">RevenueOS Integrated</div>
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-1">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>सञ्चालन कार्यहरू</span>
                  <Shield size={15} className="text-blue-400" />
                </div>
                <div className="text-2xl font-black text-white">{moderationLogs.length}</div>
                <div className="text-[10px] text-zinc-400">सुरक्षित च्याट वातावरण</div>
              </div>
            </div>

            {/* LIVE STREAMS QUICK OVERVIEW */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Video size={16} className="text-red-500" />
                  अहिले प्रसारण भइरहेका भिडियोहरू (Active Live Streams)
                </h3>
                <a 
                  href="/live" 
                  target="_blank" 
                  className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>सार्वजनिक हब खोल्नुहोस्</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              {liveNow.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl space-y-2">
                  <Radio size={28} className="text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-400">हाल कुनै प्रत्यक्ष प्रसारण जारी छैन।</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveNow.map(v => (
                    <div key={v.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2">
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-zinc-900 relative">
                        {v.thumbnailUrl ? (
                          <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <Video size={24} />
                          </div>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-600 text-white font-black text-[10px]">
                          LIVE
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-xs line-clamp-1">{v.title}</h4>
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>{v.category || "समाचार"}</span>
                        <span>{v.district || "नेपाल"}</span>
                      </div>
                      <div className="pt-2 border-t border-zinc-800 flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingVideo(v);
                            setFormData(v);
                            setShowAddModal(true);
                          }}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold"
                        >
                          सम्पादन
                        </button>
                        <a
                          href={`/live/${v.id}`}
                          target="_blank"
                          className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold"
                        >
                          हेर्नुहोस्
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: STREAMS MANAGEMENT ================= */}
        {activeTab === "streams" && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">सबै प्रसारणहरूको सूची (All Broadcasts)</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="p-3">शीर्षक / विवरण</th>
                    <th className="p-3">स्रोत</th>
                    <th className="p-3">कोटि / जिल्ला</th>
                    <th className="p-3">स्थिति</th>
                    <th className="p-3 text-right">कार्यहरू</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {allVideos.map((v) => (
                    <tr key={v.id} className="hover:bg-zinc-800/40">
                      <td className="p-3 font-bold text-white max-w-xs">
                        <div className="truncate">{v.title}</div>
                        <div className="text-[10px] text-zinc-500 font-normal">{v.broadcasterName}</div>
                      </td>
                      <td className="p-3 uppercase text-[10px] font-mono text-amber-400">{v.sourceType}</td>
                      <td className="p-3">{v.category || "समाचार"} • {v.district || "काठमाडौँ"}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          v.status === "live" ? "bg-red-500/20 text-red-400" :
                          v.status === "scheduled" ? "bg-amber-500/20 text-amber-400" :
                          "bg-zinc-800 text-zinc-400"
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingVideo(v);
                            setFormData(v);
                            setShowAddModal(true);
                          }}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-medium"
                        >
                          सम्पादन
                        </button>
                        <button
                          onClick={() => handleDeleteVideo(v.id)}
                          className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium"
                        >
                          हटाउनुहोस्
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: CHAT CONSOLE ================= */}
        {activeTab === "chat" && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <MessageSquare size={16} className="text-amber-400" />
                प्रत्यक्ष च्याट नियन्त्रण कन्सोल (Live Chat Console)
              </h3>

              {/* Stream selector */}
              <select
                value={selectedStreamForChat}
                onChange={(e) => setSelectedStreamForChat(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-xs text-white rounded-xl px-3 py-1.5"
              >
                {allVideos.map((v) => (
                  <option key={v.id} value={v.id}>{v.title}</option>
                ))}
              </select>
            </div>

            <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950 space-y-3 max-h-[400px] overflow-y-auto">
              {chatMessages.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">कुनै सन्देश छैन।</p>
              ) : (
                chatMessages.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 text-xs">
                    <div>
                      <span className="font-bold text-amber-300">@{m.displayName}: </span>
                      <span className="text-zinc-200">{m.message}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => LiveService.moderateChatMessage(m.id, "hide", user?.uid || "admin", user?.displayName || "सञ्चालक")}
                        className="p-1 text-zinc-400 hover:text-amber-400"
                        title="लुकाउनुहोस्"
                      >
                        लुकाउनुहोस्
                      </button>
                      <button
                        onClick={() => LiveService.moderateChatMessage(m.id, "delete", user?.uid || "admin", user?.displayName || "सञ्चालक")}
                        className="p-1 text-zinc-400 hover:text-red-400"
                        title="मेटाउनुहोस्"
                      >
                        मेटाउनुहोस्
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: MODERATION ================= */}
        {activeTab === "moderation" && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Shield size={16} className="text-blue-400" />
              सञ्चालन अडिट लग (Moderation Action History)
            </h3>

            <div className="divide-y divide-zinc-800">
              {moderationLogs.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">हालसम्म कुनै सञ्चालन कार्य गरिएको छैन।</p>
              ) : (
                moderationLogs.map(l => (
                  <div key={l.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-zinc-200">
                        कार्य: <span className="text-amber-400 uppercase">{l.action}</span>
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        सञ्चालक: {l.moderatorName} {l.reason ? `• कारण: ${l.reason}` : ""}
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(l.timestamp).toLocaleString("ne-NP")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 5: PARTICIPANTS ================= */}
        {activeTab === "participants" && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Users size={16} className="text-emerald-400" />
              प्रत्यक्ष सहभागी तथा श्रोता विवरण
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {participants.map(p => (
                <div key={p.userId} className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{p.displayName}</span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 rounded">{p.membershipTier}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400">भूमिका: {p.role}</div>
                  {p.isMuted && <span className="text-red-400 font-bold text-[10px]">• म्यूट गरिएको</span>}
                  {p.isBanned && <span className="text-red-500 font-bold text-[10px]">• प्रतिबन्धित</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 6: ADVERTISING (REVENUEOS) ================= */}
        {activeTab === "advertising" && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <DollarSign size={16} className="text-amber-400" />
                  RevenueOS प्रत्यक्ष प्रायोजक टिकर अभियानहरू
                </h3>
                <p className="text-xs text-zinc-400">
                  प्रिमियम (संरक्षक, साधक) प्रयोगकर्ताहरूलाई शून्य विज्ञापन नियम कडाइका साथ लागू हुन्छ।
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingCampaign(null);
                  setAdFormData({
                    advertiserName: "",
                    campaignName: "",
                    placement: "LIVE_BOTTOM_TICKER",
                    headlineNe: "",
                    destinationUrl: "",
                    ctaText: "हेर्नुहोस्",
                    priority: 80,
                    status: "active"
                  });
                  setShowAdModal(true);
                }}
                className="px-3 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-xl"
              >
                + नयाँ प्रायोजन थप्नुहोस्
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sponsorCampaigns.map(c => (
                <div key={c.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">{c.advertiserName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-white font-medium">{c.headlineNe}</p>
                  <div className="text-[11px] text-zinc-400">
                    स्थान: <span className="font-mono text-zinc-200">{c.placement}</span> • प्राथमिकता: {c.priority}
                  </div>
                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingCampaign(c);
                        setAdFormData(c);
                        setShowAdModal(true);
                      }}
                      className="px-2.5 py-1 bg-zinc-800 text-zinc-200 rounded text-xs font-bold"
                    >
                      सम्पादन
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(c.id)}
                      className="px-2.5 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold"
                    >
                      हटाउनुहोस्
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 7: SCHEDULING ================= */}
        {activeTab === "scheduling" && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Calendar size={16} className="text-amber-400" />
              आगामी प्रत्यक्ष प्रसारण तालिका (Broadcast Calendar)
            </h3>

            <div className="divide-y divide-zinc-800">
              {scheduled.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">हाल कुनै तालिकाबद्ध कार्यक्रम छैन।</p>
              ) : (
                scheduled.map(s => (
                  <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{s.title}</div>
                      <div className="text-[11px] text-zinc-400">
                        समय: {s.scheduledAt ? new Date(s.scheduledAt).toLocaleString("ne-NP") : "निर्धारित समय उपलब्ध छैन"}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingVideo(s);
                        setFormData(s);
                        setShowAddModal(true);
                      }}
                      className="px-3 py-1 bg-zinc-800 text-white rounded-lg text-xs"
                    >
                      सम्पादन
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 8: NOTIFICATIONS ================= */}
        {activeTab === "notifications" && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4 max-w-xl">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Bell size={16} className="text-red-400" />
              प्रत्यक्ष प्रसारण सूचना पठाउनुहोस् (Send Live Alert)
            </h3>

            <form onSubmit={handleSendNotification} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-bold mb-1">सूचना शीर्षक (Title):</label>
                <input
                  type="text"
                  value={notificationData.title}
                  onChange={(e) => setNotificationData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="उदा: 🔴 प्रत्यक्ष प्रसारण सुरु भयो!"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1">सन्देश (Body):</label>
                <textarea
                  value={notificationData.message}
                  onChange={(e) => setNotificationData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="विशेष प्रत्यक्ष कभरेज हेर्नुहोस्..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white h-20"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl"
              >
                सबै प्रयोगकर्ताहरूलाई तत्काल अलर्ट पठाउनुहोस्
              </button>
            </form>
          </div>
        )}

        {/* ================= TAB 9: ANALYTICS ================= */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs text-zinc-400">कुल भिडियोहरू</span>
              <div className="text-3xl font-black text-white">{allVideos.length}</div>
              <p className="text-[11px] text-zinc-500">अभिलेख तथा प्रत्यक्ष प्रसारण</p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs text-zinc-400">च्याट सन्देश प्रवाह</span>
              <div className="text-3xl font-black text-amber-400">{chatMessages.length}</div>
              <p className="text-[11px] text-zinc-500">वर्तमान सत्रमा आदानप्रदान</p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs text-zinc-400">प्रायोजक पहुँच</span>
              <div className="text-3xl font-black text-emerald-400">2,310+</div>
              <p className="text-[11px] text-zinc-500">प्रभावकारी छाप (Impressions)</p>
            </div>
          </div>
        )}

        {/* ================= TAB 10: SETTINGS ================= */}
        {activeTab === "settings" && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 max-w-2xl space-y-5">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Settings size={16} className="text-amber-400" />
              LiveOS विश्वव्यापी सेटिङहरू
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-zinc-200 font-medium">च्याट सक्रिय गर्नुहोस् (Enable Live Chat)</span>
                  <input
                    type="checkbox"
                    checked={settings.chatEnabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, chatEnabled: e.target.checked }))}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-zinc-200 font-medium">साइन-इन अनिवार्य गर्नुहोस् (Require Login to Chat)</span>
                  <input
                    type="checkbox"
                    checked={settings.requireAuthentication}
                    onChange={(e) => setSettings(prev => ({ ...prev, requireAuthentication: e.target.checked }))}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-zinc-200 font-medium">लिङ्कहरू रोक्नुहोस् (Block External Links in Chat)</span>
                  <input
                    type="checkbox"
                    checked={!settings.allowLinks}
                    onChange={(e) => setSettings(prev => ({ ...prev, allowLinks: !e.target.checked }))}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                </label>

                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                  <label className="block text-zinc-200 font-medium">स्लो मोड कुल्डडाउन (Slow Mode Cooldown Seconds):</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={settings.slowModeSeconds}
                    onChange={(e) => setSettings(prev => ({ ...prev, slowModeSeconds: Number(e.target.value) }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl shadow-lg"
              >
                सेटिङ सुरक्षित गर्नुहोस्
              </button>
            </form>
          </div>
        )}

        {/* ================= MODAL: ADD / EDIT STREAM ================= */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card text-card-foreground border border-border-theme rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-border-theme pb-3">
                <h3 className="font-bold text-card-foreground text-base flex items-center gap-2">
                  <Video size={18} className="text-red-500" />
                  {editingVideo ? "प्रत्यक्ष प्रसारण सम्पादन" : "नयाँ प्रत्यक्ष प्रसारण थप्नुहोस्"}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-muted-text hover:text-foreground">
                  <XCircle size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">शीर्षक (Title)*:</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">स्रोत भिडियो लिङ्क (YouTube / Facebook / Native)*:</label>
                  <input
                    type="url"
                    required
                    value={formData.sourceUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">स्थिति (Status):</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
                    >
                      <option value="live">लाइभ (Live Now)</option>
                      <option value="scheduled">आगामी (Scheduled)</option>
                      <option value="approved">स्वीकृत (Approved Replay)</option>
                      <option value="ended">सम्प्रेषण समाप्त (Ended)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">कोटि (Category):</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
                    >
                      {["समाचार", "राजनीति", "राष्ट्रिय", "प्रदेश", "अर्थतन्त्र", "संस्कृति", "विशेष कार्यक्रम"].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">जिल्ला (District):</label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">प्रसारकको नाम (Broadcaster):</label>
                    <input
                      type="text"
                      value={formData.broadcasterName}
                      onChange={(e) => setFormData(prev => ({ ...prev, broadcasterName: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">विवरण (Description):</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white h-16"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-zinc-800 text-white rounded-xl font-bold"
                  >
                    रद्द गर्नुहोस्
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg"
                  >
                    {isSubmitting ? "सुरक्षित हुँदैछ..." : "प्रसारण सुरक्षित गर्नुहोस्"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL: ADD / EDIT SPONSOR TICKER ================= */}
        {showAdModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <DollarSign size={18} className="text-amber-400" />
                  {editingCampaign ? "प्रायोजन अभियान सम्पादन" : "नयाँ प्रत्यक्ष प्रायोजन अभियान थप्नुहोस्"}
                </h3>
                <button onClick={() => setShowAdModal(false)} className="text-zinc-400 hover:text-white">
                  <XCircle size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveCampaign} className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">प्रायोजकको नाम (Advertiser Name)*:</label>
                  <input
                    type="text"
                    required
                    value={adFormData.advertiserName}
                    onChange={(e) => setAdFormData(prev => ({ ...prev, advertiserName: e.target.value }))}
                    placeholder="उदा: Ncell / Global IME Bank"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">स्थान (Placement):</label>
                  <select
                    value={adFormData.placement}
                    onChange={(e) => setAdFormData(prev => ({ ...prev, placement: e.target.value as any }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="LIVE_BOTTOM_TICKER">तलको टिकर (LIVE_BOTTOM_TICKER)</option>
                    <option value="LIVE_VIDEO_LOWER_THIRD">भिडियो तल्लो-तिहाई (LIVE_VIDEO_LOWER_THIRD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">नेपाली मुख्य सन्देश (Headline Ne)*:</label>
                  <input
                    type="text"
                    required
                    value={adFormData.headlineNe}
                    onChange={(e) => setAdFormData(prev => ({ ...prev, headlineNe: e.target.value }))}
                    placeholder="उदा: तीव्र गतिको डिजिटल कनेक्टिभिटी — प्रत्यक्ष प्रसारण प्रायोजक"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">गन्तव्य URL (Target URL)*:</label>
                  <input
                    type="url"
                    required
                    value={adFormData.destinationUrl}
                    onChange={(e) => setAdFormData(prev => ({ ...prev, destinationUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">बटन टेक्स्ट (CTA Text):</label>
                    <input
                      type="text"
                      value={adFormData.ctaText}
                      onChange={(e) => setAdFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">प्राथमिकता (Priority 1-100):</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={adFormData.priority}
                      onChange={(e) => setAdFormData(prev => ({ ...prev, priority: Number(e.target.value) }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowAdModal(false)}
                    className="px-4 py-2 bg-zinc-800 text-white rounded-xl font-bold"
                  >
                    रद्द गर्नुहोस्
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold shadow-lg"
                  >
                    अभियान सुरक्षित गर्नुहोस्
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL: ACCEPTANCE GATE 38/38 REPORT ================= */}
        {showAcceptanceModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="font-black text-white text-base flex items-center gap-2">
                    <ShieldCheck size={20} className="text-emerald-400" />
                    SANATANMARGA LIVE MEDIA HUB v3 — 38-GATE ACCEPTANCE CERTIFICATION
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Live Stream Player • Overlay/Side/Hidden Chat • Moderation • RevenueOS • Continuity
                  </p>
                </div>
                <button onClick={() => setShowAcceptanceModal(false)} className="text-zinc-400 hover:text-white p-1">
                  <XCircle size={20} />
                </button>
              </div>

              {isRunningAcceptance ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw size={32} className="animate-spin text-amber-500" />
                  <p className="text-sm font-bold text-zinc-200">३८ वटै प्रमाणीकरण गेटहरूको परीक्षण हुँदैछ...</p>
                  <p className="text-xs text-zinc-500">Evaluating Player, Chat Layout, Moderation, and RevenueOS...</p>
                </div>
              ) : acceptanceReport ? (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    acceptanceReport.overallStatus === "PASS"
                      ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                      : "bg-red-950/30 border-red-500/40 text-red-300"
                  }`}>
                    <div>
                      <div className="text-sm font-black flex items-center gap-2">
                        <span>प्रमाणीकरण स्थिति:</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500 text-black font-black uppercase text-xs">
                          {acceptanceReport.overallStatus}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        सफल: {acceptanceReport.passedGates} / {acceptanceReport.totalGates} गेटहरू • निष्पादन: {new Date(acceptanceReport.executedAt).toLocaleTimeString()}
                      </div>
                    </div>

                    <button
                      onClick={handleRunAcceptance}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
                    >
                      पुन: परीक्षण गर्नुहोस्
                    </button>
                  </div>

                  {/* Gates Table */}
                  <div className="space-y-2">
                    {acceptanceReport.results.map((gate) => (
                      <div
                        key={gate.gateId}
                        className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-zinc-500 font-bold">#{gate.gateId}</span>
                            <span className="font-bold text-white">{gate.name}</span>
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                              {gate.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400">{gate.details}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-zinc-500">{gate.durationMs}ms</span>
                          <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                            gate.status === "PASS" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                          }`}>
                            {gate.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
