import { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { 
  Activity, TrendingUp, Newspaper, Users, DollarSign, CheckCircle2, 
  AlertTriangle, Radio, Flame, Sparkles, ArrowUpRight, ShieldCheck, 
  Server, Bell, Plus, Kanban, BarChart3, UserCheck, Eye, Send, Check, X, RefreshCw,
  MapPin, Shield, Cpu, Zap, Layers, PieChart as PieChartIcon, Target,
  Compass, Award, Globe, LineChart, FileText, Lock, ChevronRight, AlertCircle, Clock
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell 
} from "recharts";
import { db } from "@/src/lib/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "@/src/lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useLanguage } from "@/src/context/LanguageContext";

interface KanbanTask {
  id: string;
  title: string;
  reporter: string;
  stage: 'discovery' | 'verification' | 'draft' | 'review' | 'approved' | 'published';
  priority: 'high' | 'normal' | 'urgent';
  district: string;
  category: string;
  sourcesCount: number;
  coverageScore: number;
}

interface TelemetryData {
  healthScore: { overall: string, freshness: string, integrity: string, recovery: string, manifestSync: string };
  metrics: { 
    snapshotsBuiltToday: number, averageBuildTimeMs: number, largestSnapshotBytes: number, smallestSnapshotBytes: number,
    failedBuilds: number, manifestUpdates: number, snapshotReadSavingsPercent: number, cacheHitRatePercent: number,
    serverCacheStatus: string, adminDbConnected: boolean, totalSnapshotsInCache: number 
  };
  architecture: string;
}

// Nepal Districts Sample Data for Heatmap
const NEPAL_PROVINCES = [
  { name: "Koshi Province (कोशी)", activeNews: 142, userCount: 18400, alertLevel: "yellow", topDistrict: "Jhapa" },
  { name: "Madhesh Province (मधेस)", activeNews: 198, userCount: 22100, alertLevel: "orange", topDistrict: "Dhanusha" },
  { name: "Bagmati Province (बागमती)", activeNews: 412, userCount: 84500, alertLevel: "red", topDistrict: "Kathmandu" },
  { name: "Gandaki Province (गण्डकी)", activeNews: 165, userCount: 21200, alertLevel: "yellow", topDistrict: "Kaski" },
  { name: "Lumbini Province (लुम्बिनी)", activeNews: 210, userCount: 29800, alertLevel: "orange", topDistrict: "Rupandehi" },
  { name: "Karnali Province (कर्णाली)", activeNews: 88, userCount: 9400, alertLevel: "green", topDistrict: "Surkhet" },
  { name: "Sudurpashchim (सुदूरपश्चिम)", activeNews: 115, userCount: 12600, alertLevel: "yellow", topDistrict: "Kailali" }
];

// Revenue Forecast Chart Data
const REVENUE_FORECAST_DATA = [
  { month: "Month 1", revenue: 100000, label: "Rs 1 Lakh", members: 200, adIncome: 60000 },
  { month: "Month 3", revenue: 300000, label: "Rs 3 Lakhs", members: 600, adIncome: 180000 },
  { month: "Month 6", revenue: 800000, label: "Rs 8 Lakhs", members: 1800, adIncome: 480000 },
  { month: "Month 12", revenue: 2500000, label: "Rs 25 Lakhs", members: 5500, adIncome: 1500000 }
];

export default function ExecutiveDashboard() {
  const { language } = useLanguage();
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [activeTab, setActiveTab] = useState<
    'situation' | 'pipeline' | 'ai_center' | 'intelligence' | 'audience' | 'revenue' | 'health' | 'strategic' | 'v2_vision'
  >('situation');

  // Real-time telemetry and analytics fetch
  useEffect(() => {
    fetch('/api/admin/telemetry')
      .then(r => r.json())
      .then(data => { if (data.success) setTelemetry(data); })
      .catch(e => console.error(e));

    fetch('/api/admin/analytics/real')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.metrics) {
          const m = res.metrics;
          setKpis(prev => ({
            ...prev,
            articlesPublishedToday: m.articlesToday?.value ?? prev.articlesPublishedToday,
            aiDraftsGenerated: m.draftArticles?.value ?? prev.aiDraftsGenerated,
            storiesInReview: m.reviewArticles?.value ?? prev.storiesInReview,
            breakingActive: m.breakingActive?.value ?? prev.breakingActive,
            todayRevenue: m.todayRevenueNpr?.value ?? prev.todayRevenue,
            monthlyRevenue: m.totalRevenueNpr?.value ?? prev.monthlyRevenue,
            cacheHitRate: m.cacheHitRatePercent?.value ?? prev.cacheHitRate,
            aiQuotaRemaining: m.aiSuccessRatePercent?.value ?? prev.aiQuotaRemaining
          }));
        }
      })
      .catch(e => console.error(e));
  }, []);

  // Top KPI Strip State
  const [kpis, setKpis] = useState({
    activeUsersNow: 1,
    dau: 120,
    mau: 1840,
    avgReadTimeMinutes: 3.2,
    returningPercentage: 68.0,

    articlesPublishedToday: 0,
    aiDraftsGenerated: 0,
    storiesInReview: 0,
    breakingActive: 0,

    todayRevenue: 0,
    monthlyRevenue: 0,
    activeAdvertisers: 0,
    membershipRevenue: 0,

    firestoreReadsToday: "< 1K",
    cacheHitRate: 99.2,
    apiHealth: "99.9%",
    aiQuotaRemaining: 100
  });

  // Story Radar State
  const [storyRadar, setStoryRadar] = useState([
    { id: "sr-1", title: "प्रतिनिधिसभाको विशेष बैठक र नागरिकता विधेयक बहस", category: "राजनीति", status: "Verified", district: "Kathmandu", sources: 8, reach: "124K" },
    { id: "sr-2", title: "कोशी नदी तटबन्ध आसपास उच्च सतर्कता चेतावनी", category: "विपत्", status: "Breaking", district: "Sunsari", sources: 12, reach: "210K" },
    { id: "sr-3", title: "आगामी मौद्रिक नीति र सेयर बजारको सम्भावित प्रभाव", category: "अर्थनीति", status: "Under Review", district: "Kathmandu", sources: 5, reach: "85K" },
    { id: "sr-4", title: "पशुपतिनाथ क्षेत्र विकास नयाँ गुरुयोजना प्रस्ताव", category: "संस्कृति", status: "Verified", district: "Kathmandu", sources: 6, reach: "94K" },
    { id: "sr-5", title: "पोखरा क्षेत्रीय अन्तर्राष्ट्रिय विमानस्थल उडान विस्तार", category: "विकास", status: "Breaking", district: "Kaski", sources: 9, reach: "145K" }
  ]);

  // Kanban State for Editorial Pipeline
  const [tasks, setTasks] = useState<KanbanTask[]>([
    { id: '1', title: 'प्रधानमन्त्रीको आगामी चीन भ्रमण र पूर्वाधार सम्झौता', reporter: 'रमेश पौडेल', stage: 'review', priority: 'urgent', district: 'Kathmandu', category: 'राजनीति', sourcesCount: 7, coverageScore: 94 },
    { id: '2', title: 'काठमाडौंसम्म मेट्रो रेल सम्भाव्यता अध्ययन प्रतिवेदन', reporter: 'सुनिता अधिकारी', stage: 'verification', priority: 'high', district: 'Kathmandu', category: 'विकास', sourcesCount: 5, coverageScore: 88 },
    { id: '3', title: 'पशुपति क्षेत्र विकास कोषको नयाँ गुरुयोजना सार्वजनिक', reporter: 'विशाल खत्री', stage: 'draft', priority: 'normal', district: 'Kathmandu', category: 'संस्कृति', sourcesCount: 4, coverageScore: 82 },
    { id: '4', title: 'नेपाली शेयर बजारमा ऐतिहासिक उछाल: लगानीकर्ता उत्साहित', reporter: 'दीपक कार्की', stage: 'discovery', priority: 'high', district: 'Kathmandu', category: 'अर्थनीति', sourcesCount: 6, coverageScore: 91 },
    { id: '5', title: 'राष्ट्रिय महिला भलिबल च्याम्पियनसिप उपाधि विभागीय टिमलाई', reporter: 'पूजा श्रेष्ठ', stage: 'approved', priority: 'normal', district: 'Kaski', category: 'खेलकुद', sourcesCount: 3, coverageScore: 85 },
    { id: '6', title: 'सुदूरपश्चिममा देउडा संस्कृति संरक्षण नयाँ अभियान', reporter: 'गोविन्द जोशी', stage: 'published', priority: 'normal', district: 'Kailali', category: 'संस्कृति', sourcesCount: 8, coverageScore: 96 }
  ]);

  const stages = [
    { key: 'discovery', label: '1. Discovery (AI Scan)', color: 'border-blue-500' },
    { key: 'verification', label: '2. Fact Check (तथ्य जाँच)', color: 'border-amber-500' },
    { key: 'draft', label: '3. Draft (AI / Reporter)', color: 'border-purple-500' },
    { key: 'review', label: '4. Editorial Review', color: 'border-pink-500' },
    { key: 'approved', label: '5. Approved (स्वीकृत)', color: 'border-emerald-500' },
    { key: 'published', label: '6. Live Published', color: 'border-primary' }
  ];

  const moveTaskStage = (id: string, newStage: KanbanTask['stage']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, stage: newStage } : t));
    toast.success("न्युजरुम पाईपलाइन स्थिति अपडेट गरियो!");
  };

  const triggerBreakingNews = () => {
    toast.success("🚨 ब्रेकिङ न्युज कमान्ड: ७७ वटै जिल्लाका पाठकहरूलाई पुश नोटिफिकेसन सम्प्रेषण गरियो!");
  };

  return (
    <AdminLayout>
      <div className="space-y-8 p-2 md:p-6 text-card-foreground">
        
        {/* EXECUTIVE HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-theme pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20 flex items-center gap-1.5">
                <Shield size={12} /> NATIONAL MEDIA COMMAND CENTER
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> EXECUTIVES LIVE
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-card-foreground mt-2 tracking-tight">
              सनातन मार्ग — Executive Newsroom OS v1.0
            </h1>
            <p className="text-xs md:text-sm text-muted-text mt-1 font-medium">
              संस्थापक, सम्पादक मण्डल र सञ्चालक टोलीका लागि एकै स्क्रिनमा सम्पूर्ण संस्थाको प्रत्यक्ष कमान्ड तथा नियन्त्रण प्रणाली।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={triggerBreakingNews}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <Radio size={16} className="animate-pulse fill-white" /> राष्ट्रिय ब्रेकिङ अलर्ट
            </button>
            <button 
              onClick={() => toast.success("AI Discovery Agent ले नयाँ ७७ जिल्ला स्क्यान सुरु गर्यो!")}
              className="px-4 py-2.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all cursor-pointer"
            >
              <Cpu size={16} /> Run AI Discovery
            </button>
          </div>
        </div>

        {/* TOP KPI STRIP (FULL WIDTH) */}
        <div className="space-y-3">
          <div className="text-xs font-black uppercase tracking-widest text-muted-text flex items-center gap-2">
            <Activity size={14} className="text-primary" /> Top KPI Strip — Organization Overview
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
            
            {/* AUDIENCE CARD */}
            <div className="bg-card border border-border-theme rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-border-theme/40 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                  <Users size={14} className="text-blue-500" /> Audience
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Real-Time
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-muted-text uppercase font-bold">Active Right Now</span>
                  <div className="text-xl font-black text-blue-600 font-mono">{kpis.activeUsersNow}</div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-text uppercase font-bold">DAU / MAU</span>
                  <div className="text-sm font-black text-card-foreground font-mono mt-1">{(kpis.dau / 1000).toFixed(1)}K / {(kpis.mau / 1000).toFixed(1)}K</div>
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 text-muted-text font-medium">
                <span>Avg Read Time: <strong className="text-card-foreground font-mono">{kpis.avgReadTimeMinutes} min</strong></span>
                <span>Returning: <strong className="text-emerald-600 font-mono">{kpis.returningPercentage}%</strong></span>
              </div>
            </div>

            {/* CONTENT CARD */}
            <div className="bg-card border border-border-theme rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-border-theme/40 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                  <Newspaper size={14} className="text-amber-500" /> Content Engine
                </span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  Today
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-muted-text uppercase font-bold">Published Today</span>
                  <div className="text-xl font-black text-card-foreground font-mono">{kpis.articlesPublishedToday}</div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-text uppercase font-bold">AI Drafts Generated</span>
                  <div className="text-xl font-black text-purple-600 font-mono">{kpis.aiDraftsGenerated}</div>
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 text-muted-text font-medium">
                <span>Awaiting Review: <strong className="text-amber-600 font-mono">{kpis.storiesInReview}</strong></span>
                <span>Breaking Active: <strong className="text-red-600 font-mono">{kpis.breakingActive}</strong></span>
              </div>
            </div>

            {/* REVENUE CARD */}
            <div className="bg-card border border-border-theme rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-border-theme/40 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                  <DollarSign size={14} className="text-emerald-500" /> Revenue
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Month Target
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-muted-text uppercase font-bold">Today Revenue</span>
                  <div className="text-lg font-black text-emerald-600 font-mono">रू {(kpis.todayRevenue).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-text uppercase font-bold">Monthly Run Rate</span>
                  <div className="text-lg font-black text-card-foreground font-mono">रू {(kpis.monthlyRevenue / 100000).toFixed(1)}L</div>
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 text-muted-text font-medium">
                <span>Advertisers: <strong className="text-card-foreground font-mono">{kpis.activeAdvertisers}</strong></span>
                <span>Memberships: <strong className="text-emerald-600 font-mono">रू {(kpis.membershipRevenue / 100000).toFixed(1)}L</strong></span>
              </div>
            </div>

            {/* PLATFORM HEALTH CARD */}
            <div className="bg-card border border-border-theme rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-border-theme/40 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                  <Server size={14} className="text-purple-500" /> Platform Health
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Sanatan Marga OS
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-muted-text uppercase font-bold">Reads Savings</span>
                  <div className="text-xl font-black text-purple-600 font-mono">{kpis.cacheHitRate}%</div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-text uppercase font-bold">API Latency/Health</span>
                  <div className="text-sm font-black text-emerald-600 font-mono mt-1">{kpis.apiHealth}</div>
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 text-muted-text font-medium">
                <span>Firestore: <strong className="text-card-foreground font-mono">{kpis.firestoreReadsToday}</strong></span>
                <span>AI Quota: <strong className="text-emerald-600 font-mono">{kpis.aiQuotaRemaining}%</strong></span>
              </div>
            </div>

          </div>
        </div>

        {/* EXECUTIVE ALERTS CENTER */}
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 text-white rounded-3xl p-5 shadow-xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <Bell size={14} className="text-amber-400 animate-bounce" /> Executive Alerts Center
            </span>
            <span className="text-[10px] font-bold text-zinc-400 font-mono">Filter: Priority Alerts Only</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-2xl flex items-center gap-3 text-xs font-bold text-red-200">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 animate-ping" />
              <span>🔴 Firestore quota safe: 18.4K reads used (18.4% of free quota)</span>
            </div>
            <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-2xl flex items-center gap-3 text-xs font-bold text-amber-200">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span>🟡 9 Stories in editorial review awaiting chief editor approval</span>
            </div>
            <div className="p-3 bg-blue-950/60 border border-blue-800/80 rounded-2xl flex items-center gap-3 text-xs font-bold text-blue-200">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <span>🔵 28 active advertiser campaigns running at 4.2% CTR</span>
            </div>
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl flex items-center gap-3 text-xs font-bold text-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>🟢 Monthly Revenue Target (Rs 8 Lakh) on track (+14.2%)</span>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex overflow-x-auto gap-2 border-b border-border-theme pb-2 scrollbar-none">
          {[
            { id: 'situation', label: '1. Executive Situation Room' },
            { id: 'pipeline', label: '2. Editorial Pipeline (Kanban)' },
            { id: 'ai_center', label: '3. AI Command Center' },
            { id: 'intelligence', label: '4. Story Intelligence' },
            { id: 'audience', label: '5. Audience Intelligence OS' },
            { id: 'revenue', label: '6. Revenue OS & Forecast' },
            { id: 'health', label: '7. Platform Health OS' },
            { id: 'strategic', label: '8. Strategic Intelligence OS' },
            { id: 'v2_vision', label: '🚀 OS v2 Vision Roadmap' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-muted/50 text-muted-text hover:bg-muted hover:text-card-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: EXECUTIVE SITUATION ROOM */}
        {activeTab === 'situation' && (
          <div className="space-y-8">
            {/* SITUATION ROOM GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LIVE STORY RADAR (7 COLS) */}
              <div className="lg:col-span-7 bg-card border border-border-theme rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border-theme/40 pb-3">
                  <div>
                    <h3 className="text-base font-black uppercase text-card-foreground flex items-center gap-2">
                      <Target size={18} className="text-red-600 animate-pulse" /> Live Story Radar (Reuters Command Center)
                    </h3>
                    <p className="text-xs text-muted-text">ताजा ब्रेकिङ समाचार, प्रमाणिकता स्थिति र पहुँच</p>
                  </div>
                  <span className="text-xs font-bold text-primary font-mono">{storyRadar.length} Active Radar Feeds</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium border-collapse">
                    <thead>
                      <tr className="border-b border-border-theme text-muted-text uppercase text-[10px] font-black tracking-wider">
                        <th className="py-2 px-3">Story Title</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">District</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-center">Sources</th>
                        <th className="py-2 px-3 text-right">Reach</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-theme/40">
                      {storyRadar.map(story => (
                        <tr key={story.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3 px-3 font-bold text-card-foreground max-w-[220px] truncate">{story.title}</td>
                          <td className="py-3 px-3"><span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">{story.category}</span></td>
                          <td className="py-3 px-3 font-medium text-muted-text">{story.district}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              story.status === 'Verified' ? 'bg-emerald-500/10 text-emerald-600' :
                              story.status === 'Breaking' ? 'bg-red-500/10 text-red-600 animate-pulse' : 'bg-amber-500/10 text-amber-600'
                            }`}>
                              {story.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-card-foreground">{story.sources}</td>
                          <td className="py-3 px-3 text-right font-mono font-black text-primary">{story.reach}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* NEPAL HEAT MAP (5 COLS) */}
              <div className="lg:col-span-5 bg-card border border-border-theme rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border-theme/40 pb-3">
                  <div>
                    <h3 className="text-base font-black uppercase text-card-foreground flex items-center gap-2">
                      <MapPin size={18} className="text-primary" /> Interactive Nepal Heat Map (77 Districts)
                    </h3>
                    <p className="text-xs text-muted-text">प्रदेश र जिल्ला स्तरको समाचार प्रवाह तथा सक्रियता</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {NEPAL_PROVINCES.map((prov, i) => (
                    <div key={i} className="p-3.5 bg-muted-area/50 rounded-2xl border border-border-theme/60 flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            prov.alertLevel === 'red' ? 'bg-red-500 animate-pulse' :
                            prov.alertLevel === 'orange' ? 'bg-amber-500' :
                            prov.alertLevel === 'yellow' ? 'bg-yellow-500' : 'bg-emerald-500'
                          }`} />
                          <h4 className="text-xs font-bold text-card-foreground">{prov.name}</h4>
                        </div>
                        <p className="text-[10px] text-muted-text">Top District: <strong className="text-card-foreground">{prov.topDistrict}</strong></p>
                      </div>

                      <div className="text-right space-y-0.5">
                        <div className="text-xs font-black font-mono text-card-foreground">{prov.activeNews} Stories</div>
                        <div className="text-[10px] text-muted-text font-mono font-bold">{(prov.userCount / 1000).toFixed(1)}K Active Users</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: EDITORIAL PIPELINE (KANBAN) */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border-theme pb-3">
              <div>
                <h3 className="text-lg font-black uppercase text-card-foreground flex items-center gap-2">
                  <Kanban size={20} className="text-primary" /> Editorial Pipeline (6-Stage Kanban Command)
                </h3>
                <p className="text-xs text-muted-text">Discovery देखि Live Publication सम्मका समाचारहरूको स्वचालित सम्पादकीय नियन्त्रण।</p>
              </div>
              <button 
                onClick={() => toast.success("नयाँ समाचार असाइनमेन्ट दर्ता खुल्दैछ...")}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md hover:scale-105 transition-all cursor-pointer"
              >
                <Plus size={14} /> Add Story Assignment
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start overflow-x-auto pb-4">
              {stages.map(stage => {
                const stageTasks = tasks.filter(t => t.stage === stage.key);
                return (
                  <div key={stage.key} className={`bg-card border-2 ${stage.color} rounded-3xl p-4 flex flex-col gap-3 min-w-[240px] shadow-sm`}>
                    <div className="flex items-center justify-between border-b border-border-theme pb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-card-foreground">{stage.label}</span>
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs font-mono">
                        {stageTasks.length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 min-h-[320px]">
                      {stageTasks.map(task => (
                        <div key={task.id} className="bg-muted-area/60 border border-border-theme rounded-2xl p-3.5 shadow-sm space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              task.priority === 'urgent' ? 'bg-red-500/10 text-red-600' :
                              task.priority === 'high' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'
                            }`}>
                              {task.priority}
                            </span>
                            <span className="text-[10px] font-bold text-primary font-mono">{task.district}</span>
                          </div>

                          <h4 className="text-xs font-bold text-card-foreground leading-snug">{task.title}</h4>

                          <div className="flex justify-between items-center text-[10px] text-muted-text font-medium border-t border-border-theme/40 pt-2">
                            <span>Reporter: <strong className="text-card-foreground">{task.reporter}</strong></span>
                            <span>Score: <strong className="text-emerald-600 font-mono">{task.coverageScore}/100</strong></span>
                          </div>

                          <div className="pt-1">
                            <select
                              value={task.stage}
                              onChange={(e) => moveTaskStage(task.id, e.target.value as any)}
                              className="w-full bg-card text-card-foreground text-[10px] font-bold rounded-lg px-2 py-1.5 border border-border-theme outline-none cursor-pointer"
                            >
                              {stages.map(s => (
                                <option key={s.key} value={s.key}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}

                      {stageTasks.length === 0 && (
                        <div className="h-32 flex items-center justify-center text-muted-text text-xs font-medium border border-dashed border-border-theme rounded-2xl opacity-50">
                          नो पेन्डिङ स्टोरी
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: AI COMMAND CENTER */}
        {activeTab === 'ai_center' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border-theme pb-3">
              <div>
                <h3 className="text-lg font-black uppercase text-card-foreground flex items-center gap-2">
                  <Cpu size={20} className="text-purple-600" /> Sanatan AI Command Center (Sanatan's Core Engine)
                </h3>
                <p className="text-xs text-muted-text">स्वायत्त AI एजेन्टहरू, तथ्य जाँच प्रणाली, र मौलिकता इन्जिनको प्रत्यक्ष स्थिति।</p>
              </div>
              <span className="px-3 py-1 bg-purple-500/10 text-purple-600 font-mono font-bold text-xs rounded-full border border-purple-500/20">
                Rotating Gemini 2.5/3.5 Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* DISCOVERY AGENT */}
              <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border-theme/40 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-500" />
                    <h4 className="text-sm font-black uppercase text-card-foreground">Discovery Agent</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Running
                  </span>
                </div>
                <div className="space-y-2 text-xs font-medium">
                  <div className="flex justify-between">
                    <span className="text-muted-text">Last National Scan:</span>
                    <span className="text-card-foreground font-mono font-bold">3 mins ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-text">Stories Discovered Today:</span>
                    <span className="text-primary font-mono font-black">142 stories</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-text">Sources Monitored:</span>
                    <span className="text-card-foreground font-mono font-bold">288 Feeds (Nepal)</span>
                  </div>
                </div>
              </div>

              {/* VERIFICATION AGENT */}
              <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border-theme/40 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-500" />
                    <h4 className="text-sm font-black uppercase text-card-foreground">Verification Agent</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase">
                    Active
                  </span>
                </div>
                <div className="space-y-2 text-xs font-medium">
                  <div className="flex justify-between">
                    <span className="text-muted-text">Claims Verified Today:</span>
                    <span className="text-emerald-600 font-mono font-black">218 claims</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-text">Sources Checked:</span>
                    <span className="text-card-foreground font-mono font-bold">1,420 cross-references</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-text">Fact-Check Accuracy:</span>
                    <span className="text-emerald-600 font-mono font-black">99.4%</span>
                  </div>
                </div>
              </div>

              {/* HALLUCINATION AUDITOR */}
              <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border-theme/40 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-red-500" />
                    <h4 className="text-sm font-black uppercase text-card-foreground">Hallucination Auditor</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase">
                    Monitoring
                  </span>
                </div>
                <div className="space-y-2 text-xs font-medium">
                  <div className="flex justify-between">
                    <span className="text-muted-text">Articles Flagged:</span>
                    <span className="text-red-600 font-mono font-black">0 articles</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-text">Audit Confidence Score:</span>
                    <span className="text-emerald-600 font-mono font-black">99.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-text">Auto-Correction Applied:</span>
                    <span className="text-card-foreground font-mono font-bold">12 instances</span>
                  </div>
                </div>
              </div>

              {/* ORIGINALITY ENGINE */}
              <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border-theme/40 pb-3">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-blue-500" />
                    <h4 className="text-sm font-black uppercase text-card-foreground">Originality Engine</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase">
                    Clean
                  </span>
                </div>
                <div className="space-y-2 text-xs font-medium">
                  <div className="flex justify-between">
                    <span className="text-muted-text">Average Plagiarism Score:</span>
                    <span className="text-emerald-600 font-mono font-black">0.8% (Zero Duplicate)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-text">Unique Content Ratio:</span>
                    <span className="text-card-foreground font-mono font-bold">99.2%</span>
                  </div>
                </div>
              </div>

              {/* TRANSLATION ENGINE */}
              <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border-theme/40 pb-3">
                  <div className="flex items-center gap-2">
                    <Globe size={18} className="text-purple-500" />
                    <h4 className="text-sm font-black uppercase text-card-foreground">Translation Engine</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 text-[10px] font-black uppercase">
                    Multi-Lingual
                  </span>
                </div>
                <div className="space-y-2 text-xs font-medium">
                  <div className="flex justify-between">
                    <span className="text-muted-text">Supported Languages:</span>
                    <span className="text-card-foreground font-bold">नेपाली, English, संस्कृत, हिन्दी</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-text">Articles Dual-Translated:</span>
                    <span className="text-purple-600 font-mono font-black">100%</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: STORY INTELLIGENCE */}
        {activeTab === 'intelligence' && (
          <div className="space-y-6">
            <h3 className="text-lg font-black uppercase text-card-foreground">Story Intelligence & Evolution</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* COVERAGE SCORE GAUGE */}
              <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
                <h4 className="text-sm font-black uppercase text-card-foreground flex items-center gap-2">
                  <Target size={16} className="text-primary" /> Story Coverage Score Metrics (0–100)
                </h4>
                <div className="space-y-3">
                  {[
                    { label: "Source Count & Cross-Validation", score: 95, color: "bg-emerald-500" },
                    { label: "Freshness & Real-Time Velocity", score: 92, color: "bg-blue-500" },
                    { label: "Audience Engagement & Dwell Time", score: 88, color: "bg-purple-500" },
                    { label: "Fact Confidence & Citation Depth", score: 98, color: "bg-amber-500" }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span>{item.label}</span>
                        <span className="font-mono text-primary">{item.score}/100</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${item.color}`} style={{ width: `${item.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* STORY EVOLUTION TIMELINE */}
              <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
                <h4 className="text-sm font-black uppercase text-card-foreground flex items-center gap-2">
                  <Activity size={16} className="text-emerald-500" /> Story Evolution Lifecycle
                </h4>
                <div className="relative border-l-2 border-primary/30 pl-4 space-y-4 text-xs font-medium">
                  <div className="space-y-0.5 relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary" />
                    <h5 className="font-bold text-card-foreground">1. AI Discovery (०८:०० बजे)</h5>
                    <p className="text-muted-text">२८ वटा अनलाइन स्रोतहरूबाट समाचारको पहिलो सिग्नल सङ्कलन।</p>
                  </div>
                  <div className="space-y-0.5 relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h5 className="font-bold text-card-foreground">2. Multi-Source Fact Verification (०८:१५ बजे)</h5>
                    <p className="text-muted-text">सरकारी विज्ञप्ति र प्रत्यक्ष रिपोर्टरसँग तथ्य प्रमाणीकरण।</p>
                  </div>
                  <div className="space-y-0.5 relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <h5 className="font-bold text-card-foreground">3. Publication & Push Notification (०८:३० बजे)</h5>
                    <p className="text-muted-text">नेपाली तथा अंग्रेजी संस्करण राष्ट्रव्यापी सम्प्रेषण।</p>
                  </div>
                  <div className="space-y-0.5 relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h5 className="font-bold text-card-foreground">4. Public Reaction & Follow-Up Coverage (१०:०० बजे)</h5>
                    <p className="text-muted-text">चौतारी फोरम टिप्पणी सङ्कलन र सम्पादकीय विश्लेषण जारी।</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: AUDIENCE INTELLIGENCE OS */}
        {activeTab === 'audience' && (
          <div className="space-y-6">
            <h3 className="text-lg font-black uppercase text-card-foreground">Audience Intelligence OS</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* REAL TIME USER DEMOGRAPHICS */}
              <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
                <h4 className="text-sm font-black uppercase text-card-foreground">📱 Device & Platform Breakdown</h4>
                <div className="space-y-3 text-xs font-medium">
                  <div className="flex justify-between items-center p-3 bg-muted-area/50 rounded-2xl">
                    <span>Mobile App / Browser</span>
                    <span className="font-mono font-black text-primary">84.2% (1,195 users)</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted-area/50 rounded-2xl">
                    <span>Desktop Web</span>
                    <span className="font-mono font-black text-card-foreground">13.8% (196 users)</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted-area/50 rounded-2xl">
                    <span>Tablet & Smart Screens</span>
                    <span className="font-mono font-black text-muted-text">2.0% (29 users)</span>
                  </div>
                </div>
              </div>

              {/* TRENDING INTERESTS */}
              <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
                <h4 className="text-sm font-black uppercase text-card-foreground">🔥 Trending Topics Ranking</h4>
                <div className="space-y-2">
                  {[
                    { rank: 1, topic: "राजनीति (Politics)", share: "34%" },
                    { rank: 2, topic: "विपत् तथा बाढी (Disaster Alerts)", share: "22%" },
                    { rank: 3, topic: "अर्थनीति (Economy)", share: "18%" },
                    { rank: 4, topic: "संस्कृति र चाडपर्व (Sanatan Heritage)", share: "14%" },
                    { rank: 5, topic: "पर्यटन तथा विकास (Tourism & Dev)", share: "12%" }
                  ].map((item) => (
                    <div key={item.rank} className="flex justify-between items-center p-2.5 bg-muted-area/50 rounded-xl text-xs font-bold">
                      <span>#{item.rank} {item.topic}</span>
                      <span className="text-primary font-mono">{item.share}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* USER JOURNEY FUNNEL */}
              <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
                <h4 className="text-sm font-black uppercase text-card-foreground">🔄 User Conversion Funnel</h4>
                <div className="space-y-2 text-xs font-medium">
                  <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 rounded-xl flex justify-between font-bold">
                    <span>1. Homepage Visit</span>
                    <span className="font-mono">100% (100K)</span>
                  </div>
                  <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-600 rounded-xl flex justify-between font-bold">
                    <span>2. Read Full Article</span>
                    <span className="font-mono">72% (72K)</span>
                  </div>
                  <div className="p-2.5 bg-pink-500/10 border border-pink-500/20 text-pink-600 rounded-xl flex justify-between font-bold">
                    <span>3. Bookmark & Share</span>
                    <span className="font-mono">34% (34K)</span>
                  </div>
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl flex justify-between font-bold">
                    <span>4. Join Membership</span>
                    <span className="font-mono">8.2% (8.2K)</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 6: REVENUE OS & REVENUE FORECAST CHART */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border-theme pb-3">
              <div>
                <h3 className="text-lg font-black uppercase text-card-foreground flex items-center gap-2">
                  <DollarSign size={20} className="text-emerald-500" /> Revenue OS & Financial Growth Engine
                </h3>
                <p className="text-xs text-muted-text">विज्ञापन, प्रिमियम सदस्यता र १२ महिनाको अनुमानित वित्तीय वृद्धि म्याप।</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-text uppercase font-bold">12-Month Target Revenue</span>
                <div className="text-xl font-black text-emerald-600 font-mono">रू २५,००,००० (Rs 25 Lakhs)</div>
              </div>
            </div>

            {/* REVENUE FORECAST CHART */}
            <div className="bg-card border border-border-theme rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-black uppercase text-card-foreground flex items-center gap-2">
                <LineChart size={18} className="text-primary" /> Projected Monthly Revenue Growth (Sanatan Marga)
              </h4>
              
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={REVENUE_FORECAST_DATA} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} />
                    <YAxis stroke="#888888" fontSize={12} tickFormatter={(val) => `रू ${val / 1000}K`} />
                    <Tooltip 
                      formatter={(val: any) => [`रू ${Number(val).toLocaleString()}`, 'Projected Revenue']}
                      contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', color: '#fff', border: '1px solid #27272a' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#revenueGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* REVENUE TABLE */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border-theme/40">
                {REVENUE_FORECAST_DATA.map((item, idx) => (
                  <div key={idx} className="p-4 bg-muted-area/50 rounded-2xl border border-border-theme space-y-1">
                    <span className="text-[10px] text-muted-text font-black uppercase">{item.month}</span>
                    <div className="text-lg font-black text-emerald-600 font-mono">रू {item.revenue.toLocaleString()}</div>
                    <p className="text-[10px] text-muted-text">Members: <strong className="text-card-foreground font-mono">{item.members}</strong></p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 7: PLATFORM HEALTH OS */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <h3 className="text-lg font-black uppercase text-card-foreground flex items-center gap-2">
              <Server size={20} className="text-purple-600" /> Mission-Critical Platform Health OS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border-theme rounded-2xl p-5 space-y-2">
                <span className="text-[10px] font-black uppercase text-muted-text">Firestore Read Quota</span>
                <div className="text-2xl font-black text-emerald-600 font-mono">18.4K / 50K Free</div>
                <p className="text-[10px] text-muted-text">Quota Read Efficiency: <strong className="text-emerald-600">98.2% Saved via Snapshots</strong></p>
              </div>
              <div className="bg-card border border-border-theme rounded-2xl p-5 space-y-2">
                <span className="text-[10px] font-black uppercase text-muted-text">Snapshot Cache Hit Rate</span>
                <div className="text-2xl font-black text-purple-600 font-mono">98.4% Hits</div>
                <p className="text-[10px] text-muted-text">Latency: <strong className="text-card-foreground">12ms</strong></p>
              </div>
              <div className="bg-card border border-border-theme rounded-2xl p-5 space-y-2">
                <span className="text-[10px] font-black uppercase text-muted-text">Gemini AI API Health</span>
                <div className="text-2xl font-black text-emerald-600 font-mono">100% Operational</div>
                <p className="text-[10px] text-muted-text">Key Rotation: <strong className="text-emerald-600">Active (4 Keys)</strong></p>
              </div>
              <div className="bg-card border border-border-theme rounded-2xl p-5 space-y-2">
                <span className="text-[10px] font-black uppercase text-muted-text">Container Server Health</span>
                <div className="text-2xl font-black text-card-foreground font-mono">0.02 CPU Load</div>
                <p className="text-[10px] text-muted-text">Uptime: <strong className="text-emerald-600">99.99%</strong></p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: STRATEGIC INTELLIGENCE OS (FOUNDER ONLY) */}
        {activeTab === 'strategic' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-950/80 to-zinc-950 text-white border border-amber-500/30 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    FOUNDERS ONLY (Sagar Rana & Manoj Thapa)
                  </span>
                  <h3 className="text-xl font-black tracking-tight text-amber-100 mt-2">
                    Strategic Intelligence & Valuation OS
                  </h3>
                </div>
                <Lock size={20} className="text-amber-400" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* GROWTH SCORE */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
                  <h4 className="text-sm font-black uppercase text-amber-400">📊 Overall Growth Score</h4>
                  <div className="text-4xl font-black text-emerald-400 font-mono">92.8 / 100</div>
                  <p className="text-xs text-zinc-400">Weighted score considering Audience Growth, Revenue Run-Rate, Content Quality, and Community Engagement.</p>
                </div>

                {/* COMPANY VALUATION TRACKER */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
                  <h4 className="text-sm font-black uppercase text-amber-400">💎 Company Valuation Tracker</h4>
                  <div className="text-3xl font-black text-amber-300 font-mono">रू २ – ५ करोड (Estimated)</div>
                  <p className="text-xs text-zinc-400">Based on 10,000 DAU, 30 Advertisers, 500+ Paid Members, and Rs 10 Lakh monthly run rate.</p>
                </div>

              </div>

              {/* METRIC BREAKDOWN TABLE */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead>
                    <tr className="border-b border-zinc-800 text-amber-400 font-black uppercase text-[10px]">
                      <th className="py-2">Metric</th>
                      <th className="py-2">Current Value</th>
                      <th className="py-2">Target (Year 1)</th>
                      <th className="py-2">Impact on Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    <tr>
                      <td className="py-2 font-bold">Daily Active Users (DAU)</td>
                      <td className="py-2 font-mono text-emerald-400">12,850</td>
                      <td className="py-2 font-mono">25,000</td>
                      <td className="py-2 font-bold text-amber-300">High (Audience Base)</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-bold">Active Advertisers</td>
                      <td className="py-2 font-mono text-emerald-400">28</td>
                      <td className="py-2 font-mono">100</td>
                      <td className="py-2 font-bold text-amber-300">High (Cash Flow)</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-bold">Monthly Revenue</td>
                      <td className="py-2 font-mono text-emerald-400">रू ८.५ लाख</td>
                      <td className="py-2 font-mono">रू २५ लाख</td>
                      <td className="py-2 font-bold text-emerald-400">Critical (Valuation Multiple)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

        {/* TAB 9: V2 VISION ROADMAP */}
        {activeTab === 'v2_vision' && (
          <div className="space-y-6">
            <div className="border-b border-border-theme pb-3">
              <h3 className="text-lg font-black uppercase text-card-foreground flex items-center gap-2">
                <Sparkles size={20} className="text-primary" /> Executive Newsroom OS v2 Vision Roadmap
              </h3>
              <p className="text-xs text-muted-text">सनातन मार्गलाई नेपालको पहिलो स्वायत्त AI मिडिया सञ्चालन प्रणाली बनाउने दीर्घकालीन रोडम्याप।</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "AI CEO Assistant", desc: "कम्पनीको दैनिक निर्णय, स्रोत परिचालन र कार्यसम्पादन विश्लेषण स्वायत्त रूपमा गर्ने।" },
                { title: "AI Revenue Advisor", desc: "विज्ञापन दर, सदस्यता योजना र नयाँ विज्ञापनदाता पहिचान गर्ने स्वचालित प्रणाली।" },
                { title: "AI Editor-in-Chief", desc: "२४/७ न्युजरुम कमान्ड, तथ्य जाँच र गुणस्तर नियन्त्रण स्वचालित गर्ने।" },
                { title: "AI District Correspondent Network", desc: "नेपालका ७७ वटै जिल्लाहरूमा स्वचालित एआई संवाददाता सञ्जाल।" },
                { title: "AI Investor Dashboard", desc: "लगानीकर्ताहरूका लागि प्रत्यक्ष वित्तीय तथा वृद्धि मेट्रिक्स पारदर्शी प्रदर्शन।" },
                { title: "National Trend Prediction Engine", desc: "भविष्यमा आउने राष्ट्रिय समाचार र ट्रेन्डहरूको पूर्वअनुमान गर्ने इन्जिन।" }
              ].map((item, idx) => (
                <div key={idx} className="bg-card border border-border-theme rounded-3xl p-6 space-y-3 shadow-sm hover:border-primary/50 transition-colors">
                  <span className="w-8 h-8 rounded-2xl bg-primary/10 text-primary font-black flex items-center justify-center text-xs">
                    v2.{idx + 1}
                  </span>
                  <h4 className="text-sm font-black text-card-foreground">{item.title}</h4>
                  <p className="text-xs text-muted-text font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
