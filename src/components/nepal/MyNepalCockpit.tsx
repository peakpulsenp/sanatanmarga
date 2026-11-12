/**
 * MyNepalCockpit.tsx - "मेरो नेपाल" Personalized Daily Intelligence Cockpit for SanatanMarga v5.0
 * Assembles Patro, District Intelligence, Market Pulse, Bulletin, Vedic Audio, and Intelligence Graph.
 */

import React, { useState } from "react";
import { TodayEngine, DailyNepalPackage } from "@/src/services/todayEngine";
import { audioPlaybackManager } from "@/src/services/audioPlaybackManager";
import { Sparkles, Calendar, MapPin, TrendingUp, Headphones, Volume2, ShieldCheck, ChevronRight, Activity, BookOpen, Heart, Share2 } from "lucide-react";

interface MyNepalCockpitProps {
  onSelectDistrict: (districtId: string) => void;
  onOpenAdmin: () => void;
}

export const MyNepalCockpit: React.FC<MyNepalCockpitProps> = ({ onSelectDistrict, onOpenAdmin }) => {
  const [pkg] = useState<DailyNepalPackage>(() => TodayEngine.getTodayPackage());
  const [selectedDistrict, setSelectedDistrict] = useState(pkg.districtHighlights[0]?.id || "ktm");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState<"cockpit" | "graph" | "market" | "districts">("cockpit");

  const currentDistrict = pkg.districtHighlights.find(d => d.id === selectedDistrict) || pkg.districtHighlights[0];

  const handlePlayBulletin = async () => {
    try {
      setIsPlayingAudio(true);
      await TodayEngine.playTodayAudioEdition();
    } catch (e) {
      console.error(e);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 animate-fadeIn">
      {/* Top Header / Greeting Bar */}
      <div className="bg-gradient-to-r from-amber-800 via-orange-900 to-amber-950 text-amber-50 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-amber-300 text-sm font-medium mb-1">
              <Sparkles className="w-4 h-4 animate-pulse text-amber-400" />
              <span>मेरो नेपाल • Personalized Intelligence OS</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-white">
              शुभ प्रभात, सागर जी
            </h1>
            <p className="text-amber-200/90 text-sm md:text-base mt-2 flex items-center gap-3">
              <span>{pkg.panchang.dateBS}</span>
              <span>•</span>
              <span>{pkg.panchang.weekday}</span>
              <span>•</span>
              <span className="text-amber-300 font-semibold">{pkg.panchang.tithi}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handlePlayBulletin}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95"
            >
              <Volume2 className={`w-5 h-5 ${isPlayingAudio ? "animate-bounce" : ""}`} />
              <span>▶ आजको श्रव्य संस्करण (3 मि.)</span>
            </button>
            <button
              onClick={onOpenAdmin}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-amber-100 font-medium rounded-xl border border-white/20 transition-all flex items-center gap-2 text-sm"
            >
              <Activity className="w-4 h-4" />
              <span>Control Center</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3 overflow-x-auto">
        {[
          { id: "cockpit", label: "🪞 आजको ककपिट", icon: Sparkles },
          { id: "graph", label: "🕸️ Intelligence Graph", icon: Activity },
          { id: "market", label: "📈 Market Pulse", icon: TrendingUp },
          { id: "districts", label: "📍 ७७ जिल्ला हब", icon: MapPin },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-amber-600 text-white shadow-md"
                : "bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* COCKPIT VIEW */}
      {activeTab === "cockpit" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Panchang & Today Bulletin */}
          <div className="lg:col-span-2 space-y-8">
            {/* Today's Bulletin Box */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-md border border-stone-200 dark:border-stone-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs px-3 py-1 font-semibold rounded-bl-xl">
                SANATANMARGA DAILY
              </div>
              <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-2">
                {pkg.dailyBulletin.title}
              </h2>
              <p className="text-stone-600 dark:text-stone-300 text-sm leading-relaxed mb-4">
                {pkg.dailyBulletin.summaryNepali}
              </p>
              
              {/* AI Analysis Box */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-4 rounded-r-xl my-4 text-xs md:text-sm text-stone-700 dark:text-stone-300">
                <span className="font-bold text-amber-800 dark:text-amber-400 block mb-1">किन महत्वपूर्ण छ? (AI Verified Analysis):</span>
                {pkg.marketPulse.aiAnalysis}
              </div>

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                {pkg.topNews.map(news => (
                  <div key={news.id} className="flex-1 min-w-[250px] bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl border border-stone-200 dark:border-stone-700">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{news.category} • {news.source}</span>
                    <h4 className="font-semibold text-stone-800 dark:text-stone-200 text-sm mt-1 line-clamp-2">{news.titleNepali}</h4>
                  </div>
                ))}
              </div>
            </div>

            {/* Panchang & Tithi Summary Card */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-md border border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🕉️</span>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">आजको पञ्चाङ्ग तथा मुहूर्त</h3>
                </div>
                <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full font-medium">
                  {pkg.panchang.vratOrParba}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-stone-50 dark:bg-stone-800 p-3 rounded-xl">
                  <span className="text-stone-500 text-xs block">तिथि</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{pkg.panchang.tithi}</span>
                </div>
                <div className="bg-stone-50 dark:bg-stone-800 p-3 rounded-xl">
                  <span className="text-stone-500 text-xs block">नक्षत्र</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{pkg.panchang.nakshatra}</span>
                </div>
                <div className="bg-stone-50 dark:bg-stone-800 p-3 rounded-xl">
                  <span className="text-stone-500 text-xs block">सूर्योदय / सूर्यास्त</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{pkg.panchang.sunrise}</span>
                </div>
                <div className="bg-stone-50 dark:bg-stone-800 p-3 rounded-xl">
                  <span className="text-stone-500 text-xs block">शुभ साइत</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400 text-xs">{pkg.panchang.saait}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: District Quick Select & Market Pulse Widget */}
          <div className="space-y-6">
            {/* District Quick Hub */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-md border border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-stone-900 dark:text-stone-100">मेरो जिल्ला हब</h3>
                </div>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700"
                >
                  {pkg.districtHighlights.map(d => (
                    <option key={d.id} value={d.id}>{d.nameNepali} ({d.name})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-stone-900 dark:text-stone-100">{currentDistrict.nameNepali} ({currentDistrict.provinceNepali})</h4>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Verified</span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mb-2">🌾 <b>कृषि:</b> {currentDistrict.agricultureNotes}</p>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mb-3">🏔️ <b>पर्यटन:</b> {currentDistrict.tourismHighlights}</p>
                  
                  {currentDistrict.localNotices[0] && (
                    <div className="bg-white dark:bg-stone-900 p-2.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200">
                      🏛️ <b>सूचना:</b> {currentDistrict.localNotices[0].title}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Market Pulse Widget */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-md border border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-stone-900 dark:text-stone-100">Market Pulse (बजार)</h3>
                </div>
                <span className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-2 py-1 rounded">NRB Official</span>
              </div>

              <div className="space-y-2.5 text-xs">
                {pkg.marketPulse.items.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl">
                    <div>
                      <span className="font-bold text-stone-800 dark:text-stone-200 block">{m.nameNepali}</span>
                      <span className="text-[10px] text-stone-500">{m.source}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-stone-900 dark:text-stone-100">NPR {m.buy}</span>
                      <span className="text-[10px] text-emerald-600 font-bold block">{m.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INTELLIGENCE GRAPH VIEW */}
      {activeTab === "graph" && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-8 shadow-lg border border-stone-200 dark:border-stone-800 text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold">Daily Intelligence Graph</span>
            <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">महाशिवरात्रि तथा पशुपतिनाथ ज्ञान सम्बन्ध सम्बन्ध ग्राफ</h2>
            <p className="text-sm text-stone-600 dark:text-stone-300">
              SanatanMarga connects festival dates, panchang, districts, mantras, and market pulses into a unified semantic intelligence graph.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 py-8">
            {pkg.intelligenceGraphNode.connections.map((node, i) => (
              <div key={i} className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 px-5 py-3 rounded-xl shadow-md text-amber-900 dark:text-amber-200 font-medium text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>{node}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MARKET PULSE VIEW */}
      {activeTab === "market" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-md border border-stone-200 dark:border-stone-800">
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-4">बजार धड्कन • Market Pulse & Localized Economic Intelligence</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pkg.marketPulse.items.map(m => (
                <div key={m.id} className="p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-stone-900 dark:text-stone-100 text-base">{m.nameNepali}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">{m.verifiedState}</span>
                  </div>
                  <div className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-1">NPR {m.buy}</div>
                  <div className="text-xs text-stone-500 flex justify-between">
                    <span>Source: {m.source}</span>
                    <span className="text-emerald-600 font-bold">{m.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DISTRICTS VIEW */}
      {activeTab === "districts" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-md border border-stone-200 dark:border-stone-800">
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-4">७७ जिल्ला इन्टेलिजेन्स प्रोफाइल (77 Districts Intelligence)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pkg.districtHighlights.map(d => (
                <div key={d.id} className="p-5 bg-stone-50 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">{d.nameNepali} <span className="text-xs text-stone-500 font-normal">({d.name})</span></h3>
                    <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-2 py-0.5 rounded font-medium">{d.provinceNepali}</span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300">🌾 <b>कृषि:</b> {d.agricultureNotes}</p>
                  <p className="text-xs text-stone-600 dark:text-stone-300">🏔️ <b>पर्यटन:</b> {d.tourismHighlights}</p>
                  <p className="text-xs text-stone-600 dark:text-stone-300">🌤️ <b>मौसम:</b> {d.weatherSummary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
