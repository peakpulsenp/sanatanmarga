import React, { useState } from 'react';
import { MapPin, Activity, Search, ShieldAlert, Award, FileText, CloudSun, TrendingUp, Compass, CheckCircle2 } from 'lucide-react';
import { ALL_77_DISTRICTS, getTodayObject } from '@/src/services/todayEngine';
import type { DistrictIntelligenceNode } from '@/src/types/today';

export default function DistrictIntelligenceHub() {
  const today = getTodayObject();
  const [selectedProvince, setSelectedProvince] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [followedDistricts, setFollowedDistricts] = useState<string[]>(['kathmandu', 'lalitpur', 'dailekh']);
  const [activeDistrictModal, setActiveDistrictModal] = useState<DistrictIntelligenceNode | null>(null);

  const provinces = ['All', 'Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'];

  const filteredDistricts = today.districtsIntelligence.filter(d => {
    const matchesProvince = selectedProvince === 'All' || d.province === selectedProvince;
    const matchesSearch = d.districtNameNepali.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.districtNameEnglish.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProvince && matchesSearch;
  });

  const toggleFollow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (followedDistricts.includes(id)) {
      setFollowedDistricts(followedDistricts.filter(d => d !== id));
    } else {
      setFollowedDistricts([...followedDistricts, id]);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium text-xs tracking-wider uppercase mb-1">
            <Compass className="w-4 h-4" /> 77 Districts Intelligence Network
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            मेरो जिल्ला र नेपाल ७७ जिल्ला इन्टेलिजेन्स
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            प्रत्येक जिल्लाको प्रत्यक्ष गतिविधि स्कोर, स्थानीय समाचार, सरकारी सूचना र मौसम अपडेट।
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="जिल्ला खोज्नुहोस् (Search 77 districts)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Followed Districts Cockpit ("मेरो जिल्ला") */}
      <div className="mb-8 p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-600" /> फलो गरिएका जिल्लाहरू (My Followed Districts Cockpit)
        </h3>
        <div className="flex flex-wrap gap-3">
          {followedDistricts.map(fId => {
            const node = today.districtsIntelligence.find(d => d.districtId === fId);
            if (!node) return null;
            return (
              <div
                key={fId}
                onClick={() => setActiveDistrictModal(node)}
                className="bg-white dark:bg-zinc-900 border border-amber-200 dark:border-zinc-700 rounded-xl px-4 py-3 shadow-xs hover:border-amber-500 cursor-pointer transition-all flex items-center gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{node.districtNameNepali}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      node.intelligenceActivity === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                      node.intelligenceActivity === 'Moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      Score: {node.activityScore}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{node.metrics.weatherAlert}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Province Selector Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-3 mb-6 scrollbar-none">
        {provinces.map(prov => (
          <button
            key={prov}
            onClick={() => setSelectedProvince(prov)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedProvince === prov
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {prov === 'All' ? 'सबै प्रदेश (All 77)' : prov}
          </button>
        ))}
      </div>

      {/* Districts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDistricts.map(district => {
          const isFollowed = followedDistricts.includes(district.districtId);
          return (
            <div
              key={district.districtId}
              onClick={() => setActiveDistrictModal(district)}
              className="bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl p-4 hover:border-amber-500 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-medium">{district.province}</span>
                    <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 transition-colors">
                      {district.districtNameNepali} <span className="text-xs font-normal text-zinc-400">({district.districtNameEnglish})</span>
                    </h4>
                  </div>
                  <button
                    onClick={(e) => toggleFollow(district.districtId, e)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      isFollowed
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:text-amber-600'
                    }`}
                    title={isFollowed ? 'Unfollow' : 'Follow to My District'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300 my-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Activity Level:</span>
                    <span className={`font-semibold ${
                      district.intelligenceActivity === 'High' ? 'text-red-600' :
                      district.intelligenceActivity === 'Moderate' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {district.intelligenceActivity} ({district.activityScore})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">News & Notices:</span>
                    <span className="font-medium">{district.metrics.newsCount} stories</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Agriculture:</span>
                    <span className="font-medium truncate max-w-[140px]">{district.metrics.agriStatus}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-medium">
                <span>इन्टेलिजेन्स विवरण हेर्नुहोस्</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* District Detail Modal */}
      {activeDistrictModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveDistrictModal(null)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-lg font-bold p-2"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-950/55 rounded-xl text-amber-700 dark:text-amber-400">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase text-amber-600">{activeDistrictModal.province} Province</span>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {activeDistrictModal.districtNameNepali} ({activeDistrictModal.districtNameEnglish})
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <span className="text-xs text-zinc-400 block">Intelligence Score</span>
                <span className="text-lg font-bold text-amber-600">{activeDistrictModal.activityScore} / 100</span>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <span className="text-xs text-zinc-400 block">Activity Status</span>
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{activeDistrictModal.intelligenceActivity}</span>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <span className="text-xs text-zinc-400 block">Govt Notices</span>
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{activeDistrictModal.metrics.govtNoticesCount} Active</span>
              </div>
            </div>

            <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl">
                <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> पछिल्लो आधिकारिक सूचना
                </h4>
                <p>{activeDistrictModal.latestLocalNotice}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl">
                  <span className="text-xs text-zinc-400 block mb-1">कृषि तथा बजार (Agri & Market)</span>
                  <p className="font-medium text-xs">{activeDistrictModal.metrics.agriStatus} — {activeDistrictModal.metrics.marketActivity}</p>
                </div>
                <div className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl">
                  <span className="text-xs text-zinc-400 block mb-1">पर्यटन तथा मौसम (Tourism & Weather)</span>
                  <p className="font-medium text-xs">{activeDistrictModal.metrics.tourismStatus} — {activeDistrictModal.metrics.weatherAlert}</p>
                </div>
              </div>

              {/* Provenance & Source Governance Footer */}
              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <span>स्रोत:</span>
                  <span className="font-sans font-bold text-zinc-900 dark:text-zinc-100">
                    जिल्ला प्रशासन कार्यालय / DHM / स्थानीय निकाय
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    ✓ VERIFIED SGIS
                  </span>
                  <span className="text-[10px] text-zinc-400">अपडेट: हालै</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setActiveDistrictModal(null)}
                className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
              >
                बन्द गर्नुहोस् (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
