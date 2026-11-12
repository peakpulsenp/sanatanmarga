import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Radio, ChevronRight, Zap, Flame, ShieldAlert } from "lucide-react";
import type { Article } from "@/src/types";
import { useLanguage } from "@/src/context/LanguageContext";

interface BreakingNewsStripProps {
  articles?: Article[];
}

export default function BreakingNewsStrip({ articles = [] }: BreakingNewsStripProps) {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fallback items if articles empty
  const defaultItems = [
    {
      id: "b1",
      title: language === 'en' ? "Nepal Assembly passes key national infrastructure and heritage conservation update" : "नेपाल राष्ट्रिय सभाद्वारा पूर्वाधार तथा सम्पदा संरक्षण ऐन सर्वसम्मत पारित",
      createdAt: new Date().toISOString()
    },
    {
      id: "b2",
      title: language === 'en' ? "Central Bank releases updated quarterly economic and liquidity forecast" : "नेपाल राष्ट्र बैंकद्वारा दोस्रो त्रैमासिक मौद्रिक नीति समीक्षा सार्वजनिक",
      createdAt: new Date().toISOString()
    },
    {
      id: "b3",
      title: language === 'en' ? "Saraswati Grantha Intelligence Knowledge Graph expands 120 new manuscripts" : "सरस्वती ग्रन्थ ज्ञान प्रणालीमा १२० नयाँ प्राचीन हस्तलिखित ग्रन्थ समावेश",
      createdAt: new Date().toISOString()
    }
  ];

  const breakingList = articles.length > 0 ? articles : defaultItems;

  useEffect(() => {
    if (breakingList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % breakingList.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [breakingList.length]);

  const activeArticle = breakingList[currentIndex];

  return (
    <section id="breaking-news-strip" className="w-full bg-slate-900 border-b border-border-theme shadow-md text-white">
      <div className="container-custom py-2.5 px-4 flex items-center justify-between gap-4 overflow-hidden">
        {/* LIVE Badge */}
        <div className="flex items-center gap-2 flex-shrink-0 bg-primary px-3 py-1 rounded-full text-white font-black text-xs uppercase tracking-widest shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <Radio size={14} className="animate-pulse" />
          <span>{language === 'en' ? 'LIVE BREAKING' : '🔴 LIVE'}</span>
        </div>

        {/* Ticker Item */}
        <div className="flex-grow min-w-0 flex items-center overflow-hidden">
          <Link
            to={activeArticle.id ? `/article/${activeArticle.id}` : "/latest"}
            className="text-xs sm:text-sm font-bold text-slate-100 hover:text-amber-400 transition-colors truncate block"
          >
            {activeArticle.title}
          </Link>
        </div>

        {/* Pagination indicator / Nav */}
        <div className="flex items-center gap-2 flex-shrink-0 text-xs text-slate-400 font-mono">
          <span className="text-amber-400 font-bold">{currentIndex + 1}</span>
          <span>/</span>
          <span>{breakingList.length}</span>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % breakingList.length)}
            className="ml-1 text-slate-300 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            title="Next Breaking Story"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
