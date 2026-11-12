import React from 'react';
import { HelpCircle, RefreshCcw, Sparkles, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';
import { getTodayObject } from '@/src/services/todayEngine';

export default function IntelligenceWidgets() {
  const today = getTodayObject();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-8">
      {/* Widget 1: किन महत्वपूर्ण छ? (Why This Matters) */}
      <div className="bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm">
            <Sparkles className="w-4 h-4" /> किन महत्वपूर्ण छ? (Why This Matters)
          </div>
          <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-medium">
            Fact → Interpretation
          </span>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-zinc-800/80 rounded-xl border border-amber-100 dark:border-zinc-700 shadow-2xs">
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider block mb-1">
              अर्थतन्त्र & बजार (Market Pulse)
            </span>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-base mb-1">
              सुनको मूल्य स्थिरता र राष्ट्र बैंकको मौद्रिक समीक्षा
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-3">
              {today.marketPulse.whyItMattersMarket}
            </p>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> प्रमाणित तथ्यमा आधारित विश्लेषणात्मक दृष्टि
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-800/80 rounded-xl border border-amber-100 dark:border-zinc-700 shadow-2xs">
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider block mb-1">
              संस्कृति & उत्सव (Festivals)
            </span>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-base mb-1">
              श्रीकृष्ण जन्माष्टमीको उपत्यका सुरक्षा र यातायात प्रबन्ध
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-3">
              पाटन र हनुमानढोका क्षेत्रमा लाखौं भक्तजनको आवागमन हुने हुँदा सार्वजनिक यातायात रुट डाइभर्ट गरिएको छ जसले दैनिक आवागमनमा विशेष प्रभाव पार्छ।
            </p>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> जिल्ला प्रशासन कार्यालय सूचनामा आधारित
            </div>
          </div>
        </div>
      </div>

      {/* Widget 2: नेपालमा आज के बदलियो? (What Changed Today) */}
      <div className="bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
            <RefreshCcw className="w-4 h-4 text-amber-600 animate-spin-slow" /> नेपालमा आज के बदलियो? (What Changed)
          </div>
          <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2.5 py-0.5 rounded-full font-medium">
            Yesterday → Today Delta
          </span>
        </div>

        <div className="space-y-3">
          {today.whatChangedDeltas.map(delta => (
            <div key={delta.id} className="p-4 bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{delta.category}</span>
                <span className="text-[10px] text-zinc-400">{delta.timestamp}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-2">
                <div className="p-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
                  <span className="text-zinc-400 block text-[10px]">हिजो (Yesterday):</span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">{delta.yesterdayState}</span>
                </div>
                <div className="p-2 bg-amber-50/50 dark:bg-amber-950/30 rounded-lg border border-amber-200/50 dark:border-amber-900/40">
                  <span className="text-amber-700 dark:text-amber-400 block text-[10px]">आज (Today):</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-bold">{delta.todayState}</span>
                </div>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-amber-600" /> <span className="font-medium text-zinc-700 dark:text-zinc-300">प्रभाव:</span> {delta.deltaImpact}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
