import React from "react";
import { CheckCircle2, ArrowRight, Upload, Scan, Wand2, BookOpen, Network, Award, Globe, Database } from "lucide-react";
import { SgisLifecycleStatus, LIFECYCLE_ORDER } from "@/src/services/sgis/types";

interface Props {
  currentStatus: SgisLifecycleStatus;
  onSelectStep?: (status: SgisLifecycleStatus) => void;
}

const STEP_DEFINITIONS: Array<{
  status: SgisLifecycleStatus;
  stepNum: number;
  labelNe: string;
  labelEn: string;
  icon: any;
}> = [
  { status: "UPLOADED", stepNum: 1, labelNe: "१. पाण्डुलिपि अपलोड", labelEn: "Upload Manuscript", icon: Upload },
  { status: "OCR_COMPLETE", stepNum: 2, labelNe: "२. OCR पाठ निष्कर्षण", labelEn: "OCR Extraction", icon: Scan },
  { status: "CLEANUP", stepNum: 3, labelNe: "३. पाठ शुद्धीकरण", labelEn: "Text Cleanup & Danda", icon: Wand2 },
  { status: "TRANSLITERATION", stepNum: 4, labelNe: "४. ग्रन्थ संरचना (IAST/अनुवाद)", labelEn: "Grantha Structuring", icon: BookOpen },
  { status: "SCHOLAR_REVIEW", stepNum: 5, labelNe: "५. ज्ञानकोष लिङ्किङ", labelEn: "Knowledge Graph Link", icon: Network },
  { status: "VERIFIED", stepNum: 6, labelNe: "६. विद्वत् समीक्षा (Editorial)", labelEn: "Scholar Review & Publish", icon: Award }
];

export default function SgisPipelineStepper({ currentStatus, onSelectStep }: Props) {
  const currentIdx = LIFECYCLE_ORDER.indexOf(currentStatus);

  return (
    <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest bg-sacred/10 text-sacred px-2.5 py-0.5 rounded-full">
            SGIS 6-Step Pipeline
          </span>
          <span className="text-xs font-bold text-muted-text">
            पाण्डुलिपि देखि प्रमाणित ग्रन्थ सम्मको ६-चरणीय यात्रा
          </span>
        </div>
        <div className="text-xs font-bold text-foreground bg-muted-area px-2.5 py-1 rounded-lg border border-border-theme">
          वर्तमान स्थिति: <span className="text-primary font-black">{currentStatus}</span>
        </div>
      </div>

      {/* Stepper Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {STEP_DEFINITIONS.map((s, idx) => {
          const Icon = s.icon;
          const stepOrderIdx = LIFECYCLE_ORDER.indexOf(s.status);
          const isCompleted = currentIdx > stepOrderIdx;
          const isCurrent = currentStatus === s.status;

          return (
            <button
              key={s.status}
              onClick={() => onSelectStep && onSelectStep(s.status)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[76px] ${
                isCurrent
                  ? "bg-primary/10 border-primary text-primary shadow-sm shadow-primary/20"
                  : isCompleted
                  ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-muted-area/50 border-border-theme text-muted-text hover:bg-muted-area"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                  isCurrent
                    ? "bg-primary text-white"
                    : isCompleted
                    ? "bg-emerald-600 text-white"
                    : "bg-border-theme text-muted-text"
                }`}>
                  {isCompleted ? <CheckCircle2 size={13} /> : s.stepNum}
                </div>
                <Icon size={14} className={isCurrent ? "text-primary" : isCompleted ? "text-emerald-600" : "text-muted-text"} />
              </div>
              <div>
                <p className="text-xs font-black leading-tight truncate">{s.labelNe}</p>
                <p className="text-[10px] opacity-75 truncate">{s.labelEn}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
