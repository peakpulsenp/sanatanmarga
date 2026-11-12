import { useState, useEffect } from "react";
import { Languages, Volume2, Globe, Subtitles } from "lucide-react";

interface LiveTranslationCaptionsProps {
  className?: string;
}

export default function LiveTranslationCaptions({ className = "" }: LiveTranslationCaptionsProps) {
  const [targetLang, setTargetLang] = useState<"ne" | "en">("ne");
  const [currentCaptionIdx, setCurrentCaptionIdx] = useState(0);

  const CAPTIONS = [
    {
      ne: "प्रस्तोता: 'नेपालको जलविद्युत निर्यात सम्झौता र प्रसारण लाइन विस्तारको प्रगतिबारे आज हामी प्रत्यक्ष छलफल गर्दैछौं।'",
      en: "Host: 'Today we are discussing Nepal's cross-border hydropower export agreements and transmission grid expansion in real-time.'"
    },
    {
      ne: "विशेषज्ञ: 'ढल्केबर-मुजफ्फरपुर प्रसारण लाइनको क्षमता अभिवृद्धिले आगामी हिउँदमा विद्युत आपूर्तिलाई थप सहज बनाउनेछ।'",
      en: "Expert: 'Upgrading the Dhalkebar-Muzaffarpur line capacity will ensure seamless regional electricity transmission in upcoming months.'"
    },
    {
      ne: "प्रस्तोता: 'अब हामी संसदको विशेष अधिवेशनबाट प्रत्यक्ष प्रसारणमा जोडिँदैछौं।'",
      en: "Host: 'We are now transitioning to live parliamentary proceedings in the main house.'"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCaptionIdx((prev) => (prev + 1) % CAPTIONS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [CAPTIONS.length]);

  return (
    <div className={`bg-zinc-950 border border-zinc-800/80 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">
        <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
          <Subtitles size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-black">
              LIVE CAPTIONS & TRANSLATION
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-xs font-medium text-zinc-100 italic truncate sm:whitespace-normal">
            {targetLang === "ne" ? CAPTIONS[currentCaptionIdx].ne : CAPTIONS[currentCaptionIdx].en}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
        <button
          onClick={() => setTargetLang("ne")}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
            targetLang === "ne" ? "bg-amber-500 text-black font-black" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          नेपाली
        </button>
        <button
          onClick={() => setTargetLang("en")}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
            targetLang === "en" ? "bg-amber-500 text-black font-black" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          English
        </button>
      </div>
    </div>
  );
}
