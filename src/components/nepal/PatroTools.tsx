import React, { useState } from 'react';
import { Calendar as CalendarIcon, Sunrise, Sunset, Moon, BookOpen, Sparkles, Search, Compass } from 'lucide-react';
import { getTodayObject } from '@/src/services/todayEngine';

export default function PatroTools() {
  const today = getTodayObject();
  const [activeTab, setActiveTab] = useState<'patro' | 'panchang' | 'sapana'>('patro');
  const [sapanaQuery, setSapanaQuery] = useState('');

  const sapanaDictionary = [
    { dream: 'आकाशमा उड्नु (Flying in sky)', meaning: 'उच्च सफलता, मानप्रतिष्ठा र बौद्धिक प्रगतिको संकेत।' },
    { dream: 'नदी तर्नु (Crossing a river)', meaning: 'समस्याबाट मुक्ति र नयाँ अवसरको प्रवेश।' },
    { dream: 'गाई देख्नु (Seeing a cow)', meaning: 'शुभ फल, पारिवारिक सुख र शान्तिको प्रतीक।' },
    { dream: 'वर्षा भएको देख्नु (Rainfall)', meaning: 'व्यापारमा लाभ, कृषि उब्जनी राम्रो हुने संकेत।' },
    { dream: 'साप वा सर्प देख्नु (Snake)', meaning: 'विशेष सतर्कता अपनाउनु पर्ने, गुप्त शत्रुबाट सावधानी।' }
  ];

  const filteredSapana = sapanaDictionary.filter(s => 
    s.dream.toLowerCase().includes(sapanaQuery.toLowerCase()) ||
    s.meaning.toLowerCase().includes(sapanaQuery.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm my-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium text-xs tracking-wider uppercase mb-1">
            <CalendarIcon className="w-4 h-4" /> Toyanath Patro & Panchang OS
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            आजको पात्रो, पञ्चाङ्ग तथा सपनाको फल (Patro & Panchang)
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            विक्रम सम्वत् पात्रो, तिथि, नक्षत्र, योग, सूर्योदय/सूर्यास्त र परम्परागत सांस्कृतिक निर्देशिका।
          </p>
        </div>

        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('patro')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'patro' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            📅 आजको पात्रो
          </button>
          <button
            onClick={() => setActiveTab('panchang')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'panchang' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            🕉️ पञ्चाङ्ग तथा साइत
          </button>
          <button
            onClick={() => setActiveTab('sapana')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'sapana' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            🌙 सपनाको फल
          </button>
        </div>
      </div>

      {activeTab === 'patro' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-amber-500/10 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-6 text-center flex flex-col justify-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-1">विक्रम सम्वत् २०८३</span>
            <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-1">{today.calendar.bsDate}</h3>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-4">{today.calendar.dayOfWeek}</p>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-3 border-t border-amber-200/50">
              English: {today.calendar.adDate}
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" /> आजका प्रमुख पर्व तथा विशेषताहरू
              </h4>
              <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
                {today.calendar.festivals.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    <span className="font-semibold">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center gap-3">
                <Sunrise className="w-8 h-8 text-amber-500" />
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase">सूर्योदय (Sunrise)</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{today.calendar.sunrise}</span>
                </div>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center gap-3">
                <Sunset className="w-8 h-8 text-amber-600" />
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase">सूर्यास्त (Sunset)</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{today.calendar.sunset}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'panchang' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <span className="text-xs text-amber-600 font-semibold uppercase block mb-1">तिथि (Tithi)</span>
            <h4 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{today.calendar.tithi}</h4>
          </div>
          <div className="p-5 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <span className="text-xs text-amber-600 font-semibold uppercase block mb-1">नक्षत्र (Nakshatra)</span>
            <h4 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{today.calendar.nakshatra}</h4>
          </div>
          <div className="p-5 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <span className="text-xs text-amber-600 font-semibold uppercase block mb-1">योग (Yoga)</span>
            <h4 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{today.calendar.yoga}</h4>
          </div>
          <div className="p-5 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <span className="text-xs text-amber-600 font-semibold uppercase block mb-1">करण (Karana)</span>
            <h4 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{today.calendar.karana}</h4>
          </div>
        </div>
      )}

      {activeTab === 'sapana' && (
        <div>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="सपनामा देखेको विषय खोज्नुहोस् (Search dream meaning)..."
              value={sapanaQuery}
              onChange={(e) => setSapanaQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-3">
            {filteredSapana.map((s, idx) => (
              <div key={idx} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-1">{s.dream}</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-300"><span className="font-semibold text-amber-600">परम्परागत अर्थ:</span> {s.meaning}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
