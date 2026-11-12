import React from "react";
import { 
  GraduationCap, 
  Search, 
  Award, 
  BookOpen, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Compass,
  Filter,
  Video,
  Play,
  Scroll,
  TrendingUp,
  HelpCircle,
  Tv,
  HardDrive,
  Bot
} from "lucide-react";

export type TrainingTabType = 
  | "tracks" 
  | "competency"
  | "paths" 
  | "explainers" 
  | "videos" 
  | "sgis" 
  | "simulator" 
  | "certifications" 
  | "help" 
  | "analytics" 
  | "architecture";

interface TrainingHeaderProps {
  activeTab: TrainingTabType;
  setActiveTab: (tab: TrainingTabType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedPersona: string;
  setSelectedPersona: (persona: string) => void;
  completedLessonsCount: number;
  totalLessonsCount: number;
  earnedCertificatesCount: number;
  onOpenToursModal: () => void;
  onOpenPresentationMode: () => void;
  onOpenAIMentor?: () => void;
  onToggleOfflineDrawer?: () => void;
  isOfflinePackReady?: boolean;
}

const PERSONA_FILTERS = [
  { id: "all", label: "All Personas", labelNepali: "सबै भूमिका" },
  { id: "reader", label: "Readers & Citizens", labelNepali: "पाठक तथा नागरिक" },
  { id: "journalist", label: "Journalists & Reporters", labelNepali: "पत्रकार तथा संवाददाता" },
  { id: "editor", label: "Editors & Truth Guardians", labelNepali: "सम्पादक" },
  { id: "admin", label: "Administrators", labelNepali: "प्रशासक" },
  { id: "creator", label: "Creators & Audio Hosts", labelNepali: "सर्जक तथा रेडियो सञ्चालक" },
  { id: "advertiser", label: "Advertisers & Sponsors", labelNepali: "विज्ञापनदाता" },
  { id: "instructor", label: "Instructors", labelNepali: "प्रशिक्षक" },
  { id: "commerce", label: "Commerce Managers", labelNepali: "वाणिज्य व्यवस्थापक" }
];

export default function TrainingHeader({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  selectedPersona,
  setSelectedPersona,
  completedLessonsCount,
  totalLessonsCount,
  earnedCertificatesCount,
  onOpenToursModal,
  onOpenPresentationMode,
  onOpenAIMentor,
  onToggleOfflineDrawer,
  isOfflinePackReady
}: TrainingHeaderProps) {
  const progressPercent = totalLessonsCount > 0 
    ? Math.round((completedLessonsCount / totalLessonsCount) * 100) 
    : 0;

  const NAV_TABS = [
    { id: "tracks", label: "Tracks", count: "10", icon: Compass },
    { id: "competency", label: "Competency OS", count: "NEW", icon: TrendingUp },
    { id: "paths", label: "Role Paths", count: "5", icon: Layers },
    { id: "explainers", label: "Explainers", count: "4", icon: Sparkles },
    { id: "videos", label: "Masterclasses", count: "6", icon: Video },
    { id: "sgis", label: "SGIS Academy", count: "11", icon: Scroll },
    { id: "simulator", label: "Simulator", count: "8", icon: Play },
    { id: "certifications", label: "Certifications", count: "8", icon: Award },
    { id: "help", label: "Help & SOPs", count: "4", icon: HelpCircle },
    { id: "analytics", label: "Adoption & Stats", count: "", icon: TrendingUp },
    { id: "architecture", label: "Visualizers", count: "5", icon: BookOpen },
  ];

  return (
    <div className="bg-card dark:bg-slate-950 border-b border-border-theme dark:border-zinc-800 pt-8 pb-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Brand Banner & Progress Telemetry */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider">
              <GraduationCap size={14} />
              <span>SanatanMarga Training & Certification Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground dark:text-white">
              सनातनमार्ग तालिम तथा प्रमाणीकरण केन्द्र
            </h1>
            <p className="text-sm sm:text-base text-muted-text dark:text-zinc-400 max-w-3xl leading-relaxed">
              Master the digital civilizational operating system. Learn autonomous AI journalism, 
              ancient manuscript preservation (SGIS), 24/7 radio broadcasting, governance, and e-commerce through interactive guides and verified credentials.
            </p>
          </div>

          {/* User Progress Stats & Quick Launch Controls */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Quick Action: Guided Product Tours Modal Trigger */}
            <button
              onClick={onOpenToursModal}
              className="px-4 py-2.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-xs font-black transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Sparkles size={15} />
              <span>Interactive Tours (8)</span>
            </button>

            {/* Quick Action: Ask Training AI Mentor Trigger */}
            {onOpenAIMentor && (
              <button
                onClick={onOpenAIMentor}
                className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-black transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Bot size={15} />
                <span>Ask AI Mentor</span>
              </button>
            )}

            {/* Quick Action: Enterprise Presentation Mode Trigger */}
            <button
              onClick={onOpenPresentationMode}
              className="px-4 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-black transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Tv size={15} />
              <span>Presentation Mode</span>
            </button>

            {/* User Progress Card */}
            <div className="bg-muted-area/50 dark:bg-zinc-900/50 border border-border-theme dark:border-zinc-800 rounded-2xl p-3 sm:p-4 flex items-center gap-4 shrink-0 shadow-sm">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-border-theme dark:text-zinc-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-primary transition-all duration-500"
                    strokeDasharray={`${progressPercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[11px] font-black text-foreground dark:text-white">
                  {progressPercent}%
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-text dark:text-zinc-400 block">
                  Your Record
                </span>
                <div className="flex items-center gap-3 text-xs font-bold text-foreground dark:text-zinc-200">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    {completedLessonsCount}/{totalLessonsCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award size={13} className="text-amber-500" />
                    {earnedCertificatesCount}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-text" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lessons, certifications, SGIS epigraphy, AI Newsroom, radio, or troubleshooting..."
            className="w-full pl-11 pr-4 py-2.5 bg-muted-area/50 dark:bg-zinc-900/80 border border-border-theme dark:border-zinc-800 rounded-2xl text-xs sm:text-sm text-foreground dark:text-white placeholder:text-muted-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs font-bold text-muted-text hover:text-foreground cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="space-y-3 pt-1 border-t border-border-theme/60 dark:border-zinc-800/80">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {NAV_TABS.map((tab) => {
              const IconComp = tab.icon;
              const isSelected = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TrainingTabType)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                      : "bg-muted-area/60 dark:bg-zinc-900 text-muted-text hover:text-foreground hover:bg-muted-area"
                  }`}
                >
                  <IconComp size={15} />
                  <span>{tab.label}</span>
                  {tab.count && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isSelected ? "bg-white/20 text-white" : "bg-card dark:bg-zinc-950 text-muted-text"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Persona Filter for Tracks & Paths */}
          {(activeTab === "tracks" || activeTab === "paths") && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-border-theme/40">
              <Filter size={13} className="text-muted-text shrink-0 mr-1" />
              {PERSONA_FILTERS.map((p) => {
                const isSelected = selectedPersona === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPersona(p.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? "bg-foreground text-background dark:bg-white dark:text-zinc-900 shadow-sm"
                        : "text-muted-text hover:text-foreground hover:bg-muted-area"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
