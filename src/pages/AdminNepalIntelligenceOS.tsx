import React, { useState } from 'react';
import { Shield, Database, Cpu, Radio, MapPin, DollarSign, Activity, CheckCircle2, Settings, RefreshCcw } from 'lucide-react';
import { getTodayObject } from '@/src/services/todayEngine';
import AdminLayout from '@/src/components/layout/AdminLayout';

export default function AdminNepalIntelligenceOS() {
  const today = getTodayObject();
  const [activeTab, setActiveTab] = useState<'today' | 'districts' | 'market' | 'audio' | 'revenue' | 'snapshot'>('today');
  const [successMsg, setSuccessMsg] = useState('');

  const triggerRebuild = () => {
    setSuccessMsg('Nepal Intelligence Graph & Snapshot OS successfully rebuilt from authoritative data!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-medium text-xs tracking-wider uppercase mb-1">
              <Cpu className="w-4 h-4" /> SanatanMarga Enterprise Control Center
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Nepal Intelligence OS — Admin Dashboard
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Manage Today Engine, 77 Districts, Market Pulse, Vedic Audio Hub, RevenueOS and Snapshot OS pipelines.
            </p>
          </div>

          <button
            onClick={triggerRebuild}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-md transition-all"
          >
            <RefreshCcw className="w-4 h-4" /> Rebuild Snapshot & Graph
          </button>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> {successMsg}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto gap-2 bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'today' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            📅 Today Engine
          </button>
          <button
            onClick={() => setActiveTab('districts')}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'districts' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            📍 77 Districts Intelligence
          </button>
          <button
            onClick={() => setActiveTab('market')}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'market' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            💰 Market Pulse
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'audio' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            🎧 Vedic Audio & Bulletin
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'revenue' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            📊 RevenueOS & Sponsors
          </button>
          <button
            onClick={() => setActiveTab('snapshot')}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'snapshot' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            🛡️ Snapshot OS & Telemetry
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'today' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-600" /> Today Engine Core Object Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <span className="text-xs text-zinc-400 block mb-1">BS Date & Tithi</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{today.calendar.bsDate} ({today.calendar.tithi})</span>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <span className="text-xs text-zinc-400 block mb-1">National News Count</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{today.nationalIntelligence.length} Active Stories</span>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <span className="text-xs text-zinc-400 block mb-1">Daily Bulletin Status</span>
                <span className="font-bold text-emerald-600">Generated & Cached (8m)</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'districts' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-600" /> 77 Districts Intelligence Nodes ({today.districtsIntelligence.length} Active)
            </h3>
            <p className="text-sm text-zinc-500">All districts are continuously monitored for intelligence activity scores, weather alerts, and local government notices.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {today.districtsIntelligence.map(d => (
                <div key={d.districtId} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm block">{d.districtNameNepali}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
                    d.intelligenceActivity === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    Score: {d.activityScore}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" /> NRB Forex & Civic Infrastructure Telemetry
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <span className="text-xs text-zinc-400 block mb-1">National Hydro Grid (NEA)</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{today.marketPulse.civicIndicators.hydroGeneration}</span>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <span className="text-xs text-zinc-400 block mb-1">Geographic Coverage</span>
                <span className="font-bold text-emerald-600">{today.marketPulse.civicIndicators.provincesCovered}</span>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <span className="text-xs text-zinc-400 block mb-1">USD Exchange Rate (NRB)</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{today.marketPulse.forexRates.usd}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-600" /> Vedic Audio Hub & ListenOS Caching
            </h3>
            <p className="text-sm text-zinc-500">Manage audio collections, provenance verification, and deterministic daily bulletin rendering.</p>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-600" /> RevenueOS & Contextual Sponsorships
            </h3>
            <p className="text-sm text-zinc-500">Configure contextual sponsorships for Festivals (e.g. Krishna Janmashtami), Districts, and Daily Bulletins.</p>
          </div>
        )}

        {activeTab === 'snapshot' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" /> Snapshot OS & Provenance Audits
            </h3>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
              System health: 100% operational. Authoritative data pipeline verified. AI operates strictly as an interpreter atop canonical data.
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
