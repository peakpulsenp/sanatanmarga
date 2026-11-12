import { 
  CheckCircle2, 
  Clock, 
  FileCheck, 
  CreditCard, 
  Calendar, 
  Radio, 
  Award,
  AlertCircle
} from "lucide-react";
import { Ad } from "@/src/types";

interface CampaignMilestoneTimelineProps {
  ad: Ad;
}

export type MilestoneStageId = 
  | "submitted"
  | "creative_approved"
  | "payment_confirmed"
  | "scheduled"
  | "live"
  | "completed";

interface MilestoneStage {
  id: MilestoneStageId;
  labelNe: string;
  labelEn: string;
  descriptionNe: string;
  icon: any;
}

export const CAMPAIGN_MILESTONES: MilestoneStage[] = [
  {
    id: "submitted",
    labelNe: "प्रस्ताव दर्ता",
    labelEn: "Submitted",
    descriptionNe: "विज्ञापनदाताद्वारा सामग्री तथा स्लट प्रस्ताव पेश भयो।",
    icon: FileCheck
  },
  {
    id: "creative_approved",
    labelNe: "सम्पादकीय स्वीकृति",
    labelEn: "Creative Approved",
    descriptionNe: "सम्पादकीय टोलीद्वारा सामग्री, ब्यानर र लिंक प्रमाणित।",
    icon: CheckCircle2
  },
  {
    id: "payment_confirmed",
    labelNe: "भुक्तानी प्रमाणित",
    labelEn: "Payment Confirmed",
    descriptionNe: "कर बीजक जारी भई बैंक/वालेट भुक्तानी सम्पन्न।",
    icon: CreditCard
  },
  {
    id: "scheduled",
    labelNe: "तालिकाबद्ध",
    labelEn: "Scheduled",
    descriptionNe: "विज्ञापन इन्भेन्टरी स्लटमा प्रसारण तालिका सुनिश्चित।",
    icon: Calendar
  },
  {
    id: "live",
    labelNe: "सक्रिय प्रसारण",
    labelEn: "Live on SanatanMarga",
    descriptionNe: "पोर्टलमा वास्तविक पाठकहरूमाझ प्रत्यक्ष प्रसारण सुरु।",
    icon: Radio
  },
  {
    id: "completed",
    labelNe: "सम्पन्न तथा अडिट",
    labelEn: "Completed & Audited",
    descriptionNe: "सम्झौता अनुसारको डेलिभरी पूरा भई कार्यसम्पादन प्रतिवेदन तयार।",
    icon: Award
  }
];

export function getCampaignActiveStageIndex(ad: Ad): number {
  const status = ad.status || "active";
  const now = new Date();
  const start = new Date(ad.startDate);
  const end = new Date(ad.endDate);

  if (status === "pending_review") {
    return 0; // Stage 1: Submitted
  }
  if (status === "needs_changes") {
    return 0; // Submitted (requires edit)
  }
  if (status === "approved") {
    return 1; // Stage 2: Creative Approved (Awaiting payment/scheduling)
  }
  if (status === "scheduled" || now < start) {
    return 3; // Stage 4: Scheduled (Payment assumed confirmed)
  }
  if (now > end || status === "completed" || status === "archived") {
    return 5; // Stage 6: Completed
  }
  if (status === "active" || (now >= start && now <= end)) {
    return 4; // Stage 5: Live
  }

  return 2; // Default Payment confirmed / In progress
}

export default function CampaignMilestoneTimeline({ ad }: CampaignMilestoneTimelineProps) {
  const currentStageIndex = getCampaignActiveStageIndex(ad);

  return (
    <div className="bg-card border border-border-theme rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-border-theme pb-2.5">
        <span className="text-xs font-black text-card-foreground flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          अभियान जीवनचक्र ट्र्याकिङ (Campaign Lifecycle Milestone)
        </span>
        <span className="text-[10px] font-mono text-muted-text">
          Stage {currentStageIndex + 1} of {CAMPAIGN_MILESTONES.length}
        </span>
      </div>

      {/* Desktop / Tablet Horizontal Timeline */}
      <div className="hidden sm:grid grid-cols-6 gap-2 relative">
        {CAMPAIGN_MILESTONES.map((stage, idx) => {
          const isDone = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;
          const isUpcoming = idx > currentStageIndex;
          const Icon = stage.icon;

          return (
            <div key={stage.id} className="flex flex-col items-center text-center space-y-2 relative">
              {/* Connector line */}
              {idx < CAMPAIGN_MILESTONES.length - 1 && (
                <div 
                  className={`absolute top-4 left-1/2 w-full h-0.5 -z-0 transition-all ${
                    idx < currentStageIndex ? "bg-emerald-500" : "bg-border-theme"
                  }`} 
                />
              )}

              {/* Circle Icon */}
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all border ${
                  isDone 
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : isCurrent
                    ? "bg-purple-600 text-white border-purple-600 ring-4 ring-purple-500/20 shadow-md animate-pulse"
                    : "bg-muted-area text-muted-text border-border-theme"
                }`}
              >
                {isDone ? <CheckCircle2 size={16} /> : <Icon size={14} />}
              </div>

              {/* Label */}
              <div className="space-y-0.5">
                <div className={`text-xxs font-black leading-tight ${
                  isCurrent ? "text-purple-600 dark:text-purple-400" : isDone ? "text-card-foreground" : "text-muted-text"
                }`}>
                  {stage.labelNe}
                </div>
                <div className="text-[9px] font-mono text-muted-text">
                  {stage.labelEn}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Vertical Timeline */}
      <div className="sm:hidden space-y-3">
        {CAMPAIGN_MILESTONES.map((stage, idx) => {
          const isDone = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;
          const Icon = stage.icon;

          return (
            <div key={stage.id} className="flex items-start gap-3">
              <div 
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 border ${
                  isDone 
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : isCurrent
                    ? "bg-purple-600 text-white border-purple-600 ring-2 ring-purple-500/30"
                    : "bg-muted-area text-muted-text border-border-theme"
                }`}
              >
                {isDone ? <CheckCircle2 size={14} /> : <Icon size={12} />}
              </div>
              <div className="space-y-0.5">
                <div className={`text-xs font-black ${
                  isCurrent ? "text-purple-600" : isDone ? "text-card-foreground" : "text-muted-text"
                }`}>
                  {stage.labelNe} ({stage.labelEn})
                </div>
                <p className="text-[10px] text-muted-text">{stage.descriptionNe}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
