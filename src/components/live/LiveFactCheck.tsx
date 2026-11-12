import { useState } from "react";
import { CheckCheck, XCircle, AlertTriangle, ExternalLink, ShieldAlert, Sparkles, BookOpen } from "lucide-react";

export type FactVerdict = "TRUE" | "MISLEADING" | "FALSE" | "UNVERIFIED";

export interface LiveFactItem {
  id: string;
  claim: string;
  claimant: string;
  verdict: FactVerdict;
  verdictLabelNe: string;
  explanationNe: string;
  citations: { label: string; url?: string }[];
  timestampNpt: string;
}

const INITIAL_FACT_CHECKS: LiveFactItem[] = [
  {
    id: "fc-1",
    claim: "नेपालको चालु आर्थिक वर्षको कुल गार्हस्थ्य उत्पादन (GDP) वृद्धिदर ६.५% पुग्ने दाबी।",
    claimant: "अर्थ मन्त्रालय स्रोत",
    verdict: "MISLEADING",
    verdictLabelNe: "तथ्य भ्रामक (Misleading Context)",
    explanationNe: "केन्द्रीय तथ्याङ्क कार्यालय र विश्व बैंकको पछिल्लो प्रक्षेपण अनुसार नेपालको वृद्धिदर ३.९% देखि ४.५% को बीचमा रहने अनुमान छ। ६.५% अघिल्लो प्रारम्भिक लक्ष्य मात्र थियो।",
    citations: [
      { label: "राष्ट्रिय तथ्याङ्क कार्यालय (NSO)", url: "https://nsonepal.gov.np" },
      { label: "विश्व बैंक नेपाल प्रतिवेदन २०२४" }
    ],
    timestampNpt: "१४:३५ NPT"
  },
  {
    id: "fc-2",
    claim: "काठमाडौँ-तराई द्रुतमार्ग (Fast Track) को भौतिक प्रगति ३५% नाघेको।",
    claimant: "नेपाली सेना आयोजना निर्देशनालय",
    verdict: "TRUE",
    verdictLabelNe: "तथ्य प्रमाणित (Verified True)",
    explanationNe: "संसदीय समितिमा पेश गरिएको प्रतिवेदन तथा सुरुङमार्ग र पुल निर्माणको संयुक्त अडिट अनुसार भौतिक प्रगति ३५.८४% पुष्टि भएको छ।",
    citations: [
      { label: "नेपाली सेना फास्ट ट्रयाक कार्यप्रगति विवरण", url: "https://nepalarmy.mil.np" },
      { label: "संसदीय विकास तथा प्रविधि समिति रेकर्ड" }
    ],
    timestampNpt: "१४:१२ NPT"
  }
];

export default function LiveFactCheck({ videoId, className = "" }: { videoId?: string; className?: string }) {
  const [facts, setFacts] = useState<LiveFactItem[]>(INITIAL_FACT_CHECKS);

  const getVerdictBadge = (verdict: FactVerdict) => {
    switch (verdict) {
      case "TRUE":
        return (
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-black flex items-center gap-1">
            <CheckCheck size={13} /> तथ्य प्रमाणित (TRUE)
          </span>
        );
      case "MISLEADING":
        return (
          <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px] font-black flex items-center gap-1">
            <AlertTriangle size={13} /> भ्रामक (MISLEADING)
          </span>
        );
      case "FALSE":
        return (
          <span className="px-2.5 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/30 text-[11px] font-black flex items-center gap-1">
            <XCircle size={13} /> असत्य (FALSE)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-[11px] font-black">
            जाँच भइरहेको (UNVERIFIED)
          </span>
        );
    }
  };

  return (
    <div className={`space-y-4 ${className}`} id="live-broadcast-fact-check-panel">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-black">
            <ShieldAlert size={17} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">प्रत्यक्ष तथ्य जाँच (Live Fact-Check Desk)</h3>
            <span className="text-[10px] text-zinc-400 font-mono">Sanatan Editorial Verification Bureau</span>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[10px] font-mono font-bold">
          LIVE DESK
        </span>
      </div>

      <div className="space-y-3">
        {facts.map((fact) => (
          <div 
            key={fact.id} 
            className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-3 hover:border-zinc-700 transition-all shadow-lg"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                {getVerdictBadge(fact.verdict)}
                <span className="text-[11px] text-zinc-400 font-bold">वक्ता/स्रोत: {fact.claimant}</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">{fact.timestampNpt}</span>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs text-zinc-400 font-bold">दाबी (Claim):</div>
              <p className="text-xs sm:text-sm font-bold text-zinc-100 italic bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60">
                "{fact.claim}"
              </p>
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-zinc-400 font-bold">तथ्य अनुसन्धान तथा विश्लेषण:</div>
              <p className="text-zinc-300 leading-relaxed">
                {fact.explanationNe}
              </p>
            </div>

            {/* CITATIONS */}
            {fact.citations.length > 0 && (
              <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="text-zinc-400 flex items-center gap-1 font-mono">
                  <BookOpen size={11} /> प्रमाण स्रोत:
                </span>
                {fact.citations.map((cite, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300 font-medium">
                    {cite.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
