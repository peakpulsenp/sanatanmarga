import React, { useState } from "react";
import { 
  Search, 
  ShieldAlert, 
  Clock, 
  FileCheck, 
  Users, 
  UploadCloud, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  AlertTriangle 
} from "lucide-react";

interface PipelineStage {
  stageNumber: number;
  title: string;
  titleNepali: string;
  icon: any;
  color: string;
  bgColor: string;
  summary: string;
  summaryNepali: string;
  criteria: string[];
  rejectionCase: string;
}

const STAGES: PipelineStage[] = [
  {
    stageNumber: 1,
    title: "Google Search Grounding",
    titleNepali: "गुगल खोज ग्राउन्डिङ",
    icon: Search,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 border-blue-500/30",
    summary: "Retrieves live candidate articles from reputable publisher domains using real-time search grounding.",
    summaryNepali: "सत्य र स्थापित सञ्चारमाध्यमहरूबाट ताजा समाचारका उम्मेदवारहरू गुगल ग्राउन्डिङद्वारा खोज गर्दछ।",
    criteria: ["Official publisher domain", "Strip search-engine redirect wrappers", "Extract raw published text and quotes"],
    rejectionCase: "REJECT if URL is a search-query wrapper (e.g. google.com/search) or anonymous blog."
  },
  {
    stageNumber: 2,
    title: "72-Hour Freshness Gate",
    titleNepali: "७२-घण्टा ताजापन नियम",
    icon: Clock,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10 border-amber-500/30",
    summary: "Enforces strict temporal validity against Asia/Kathmandu time. Stories older than 72 hours are rejected.",
    summaryNepali: "काठमाडौँ समय अनुसार पछिल्लो ७२ घण्टाभित्रको घटना प्रमाणित हुनुपर्छ। पुराना समाचार अस्वीकृत हुन्छन्।",
    criteria: ["Authoritative ISO timestamp resolution", "Reject ambiguous phrases like 'आज' or 'हिजो' without date", "Freshness <= 72h window"],
    rejectionCase: "REJECT if timestamp is older than 72 hours or unresolvable."
  },
  {
    stageNumber: 3,
    title: "Temporal Fact & Source Audit",
    titleNepali: "तथ्य तथा स्रोत अडिट",
    icon: ShieldAlert,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10 border-purple-500/30",
    summary: "Corroborates claims across independent publishers. Non-breaking news requires at least two distinct sources.",
    summaryNepali: "कम्तीमा दुई स्वतन्त्र सञ्चारमाध्यमबाट घटनाको सत्यता पुष्टि गर्दछ।",
    criteria: [">= 2 independent publisher citations", "Factual quotes & figure matching", "Cross-domain entity verification"],
    rejectionCase: "REJECT if claim is an unsubstantiated single-source rumor."
  },
  {
    stageNumber: 4,
    title: "Truth Gate Validation",
    titleNepali: "सत्यता गेट परीक्षण (Truth Gate)",
    icon: FileCheck,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10 border-rose-500/30",
    summary: "The foundational 'No Source = No Story' barrier. If factual evidence is lacking, generation terminates immediately.",
    summaryNepali: "'प्रमाण छैन त समाचार छैन' को कडा सुरक्षा घेरा। प्रमाण नभए एआईले समाचार लेख्न पाउँदैन।",
    criteria: ["Zero synthetic hallucinations", "Mandatory verifiable external proof", "Explicit attribution preserved"],
    rejectionCase: "TERMINATE pipeline with DISCOVERY_FAILED_NO_VERIFIED_SOURCES."
  },
  {
    stageNumber: 5,
    title: "Four-Eyes Editorial Review",
    titleNepali: "दोहोरो सम्पादकीय समीक्षा",
    icon: Users,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10 border-emerald-500/30",
    summary: "Certified Human Editor inspects the Devanagari draft, validates photo credits, and reviews legal accuracy.",
    summaryNepali: "प्रमाणित सम्पादकले भाषा, तस्बिरको प्रतिलिपि अधिकार र कानूनी पक्षको दोहोरो परीक्षण गर्दछ।",
    criteria: ["Devanagari headline precision", "Verified photo attribution & alt-text", "Editorial balance & neutrality"],
    rejectionCase: "RETURN TO DRAFT if headline is sensational or photo lacks copyright credit."
  },
  {
    stageNumber: 6,
    title: "Push & Snapshot Invalidation",
    titleNepali: "प्रकाशन तथा तत्काल वितरण",
    icon: UploadCloud,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10 border-cyan-500/30",
    summary: "Simultaneous deployment to Live Web, PWA Push notifications, and instant static snapshot cache invalidation.",
    summaryNepali: "वेबसाइट, मोबाइल एप, पुश नोटिफिकेसन र स्न्यापसट क्यासमा तुरुन्तै समाचार पुग्छ।",
    criteria: ["Instant cache revalidation", "Web Push notification to subscribers", "Archived to sovereign Firestore ledger"],
    rejectionCase: "Instant rollback available in Admin Audit Center if post-publish error occurs."
  }
];

export default function AINewsroomPipelineDiagram() {
  const [activeStageNumber, setActiveStageNumber] = useState<number>(1);

  const currentStage = STAGES.find(s => s.stageNumber === activeStageNumber) || STAGES[0];

  return (
    <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-theme dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
            <Sparkles size={14} /> Autonomous Journalism Engine
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground dark:text-white mt-1">
            AI Newsroom 6-Stage Autonomous Pipeline
          </h3>
          <p className="text-xs sm:text-sm text-muted-text dark:text-zinc-400 mt-1">
            The fail-closed verification sequence enforcing: <span className="font-bold text-foreground dark:text-zinc-200">"No Source = No Story"</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-3 py-1.5 rounded-full text-xs font-mono font-bold">
          Strict Gate Active
        </div>
      </div>

      {/* Horizontal Pipeline Steps */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 my-6">
        {STAGES.map((stage) => {
          const Icon = stage.icon;
          const isActive = stage.stageNumber === activeStageNumber;

          return (
            <button
              key={stage.stageNumber}
              onClick={() => setActiveStageNumber(stage.stageNumber)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isActive 
                  ? `${stage.bgColor} ring-2 ring-primary/40 shadow-lg scale-[1.02]` 
                  : "bg-muted-area/40 dark:bg-zinc-900/40 border-border-theme dark:border-zinc-800 hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-muted-text">0{stage.stageNumber}</span>
                <div className={`p-1.5 rounded-lg bg-card dark:bg-zinc-800 ${stage.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-text block">{stage.titleNepali}</span>
                <span className="text-xs font-black text-foreground dark:text-zinc-100 block leading-tight">
                  {stage.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stage Detail Card */}
      <div className="bg-muted-area/60 dark:bg-zinc-900/60 border border-border-theme dark:border-zinc-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-theme/60 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl bg-card dark:bg-zinc-800 ${currentStage.color} shadow-sm`}>
              <currentStage.icon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-black text-foreground dark:text-white">
                  Stage {currentStage.stageNumber}: {currentStage.title}
                </h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  {currentStage.titleNepali}
                </span>
              </div>
              <p className="text-xs text-muted-text dark:text-zinc-400 mt-0.5">
                {currentStage.summary}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={activeStageNumber === 1}
              onClick={() => setActiveStageNumber(prev => Math.max(1, prev - 1))}
              className="px-3 py-1.5 rounded-xl border border-border-theme dark:border-zinc-800 bg-card dark:bg-zinc-950 text-xs font-bold disabled:opacity-30 cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={activeStageNumber === STAGES.length}
              onClick={() => setActiveStageNumber(prev => Math.min(STAGES.length, prev + 1))}
              className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-30 cursor-pointer"
            >
              Next Stage
            </button>
          </div>
        </div>

        {/* Verification Checklist vs Rejection Case */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div className="bg-card dark:bg-zinc-950 border border-border-theme dark:border-zinc-800/80 rounded-xl p-4">
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <CheckCircle2 size={14} /> Mandatory Stage Criteria
            </span>
            <ul className="space-y-2">
              {currentStage.criteria.map((c, i) => (
                <li key={i} className="text-xs text-foreground dark:text-zinc-300 flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 rounded-xl p-4">
            <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <XCircle size={14} /> Fail-Closed Rejection Behavior
            </span>
            <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-mono">
              {currentStage.rejectionCase}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
