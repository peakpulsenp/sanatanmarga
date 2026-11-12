import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Activity, 
  Droplets, 
  Waves, 
  Zap, 
  TrendingUp, 
  DollarSign, 
  Flame, 
  Fuel, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  Radio, 
  FileText,
  Clock,
  Layers,
  ArrowUpRight,
  Wifi,
  WifiOff
} from "lucide-react";
import { 
  NepalSituationRoomService, 
  NationalSituationData, 
  ProvenanceMetadata 
} from "../../services/nepalSituationRoomService";
import { DataTruthBadge } from "../common/DataTruthBadge";
import { toast } from "sonner";

interface NationalSituationRoomProps {
  selectedDistrict?: string;
  onDistrictSelect?: (district: string) => void;
}

export default function NationalSituationRoom({ selectedDistrict = "Kathmandu", onDistrictSelect }: NationalSituationRoomProps) {
  const [data, setData] = useState<NationalSituationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "alerts" | "markets" | "notices">("all");
  const [isSimulatingOffline, setIsSimulatingOffline] = useState(false);

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const snap = await NepalSituationRoomService.getSituationSnapshot();
      setData(snap);
    } catch (e) {
      console.error("Failed to load situation room data:", e);
      toast.error("राष्ट्रिय अवस्था डाटा संकलनमा त्रुटि");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 60000); // 1-minute live telemetry polling
    return () => clearInterval(interval);
  }, []);

  const handleToggleOffline = () => {
    const nextState = !isSimulatingOffline;
    setIsSimulatingOffline(nextState);
    NepalSituationRoomService.toggleOfflineSimulation(nextState);
    fetchTelemetry();
    if (nextState) {
      toast.warning("सिमुलेशन: स्रोत विच्छेद (Awaiting source recovery simulation active)");
    } else {
      toast.success("प्रत्यक्ष स्रोत पुनः जडान भयो (Live source connection re-established)");
    }
  };

  const renderProvenanceFooter = (prov: ProvenanceMetadata) => {
    return (
      <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <span className="text-zinc-500">स्रोत:</span>
          {prov.sourceUrl ? (
            <a 
              href={prov.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-amber-400 hover:underline flex items-center gap-1 font-sans font-bold"
            >
              {prov.sourceName}
              <ExternalLink size={10} />
            </a>
          ) : (
            <span className="text-zinc-200 font-sans font-bold">{prov.sourceName}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DataTruthBadge
            record={prov}
            timestamp={prov.fetchedAt}
            sourceName={prov.sourceName}
            sourceUrl={prov.sourceUrl}
            size="xs"
            showTimestamp={true}
          />
          <span className="text-zinc-400 text-[10px] hidden sm:inline">{prov.updatedAgo}</span>
        </div>
      </div>
    );
  };

  return (
    <section 
      id="nepal-national-situation-room"
      className="w-full bg-zinc-950 border border-zinc-800/90 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl text-zinc-100"
    >
      {/* 1. SITUATION ROOM COMMAND HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Activity size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-amber-500">
                  NEPAL OPERATIONAL INTELLIGENCE DASHBOARD
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  SGIS v3.0
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                राष्ट्रिय परिस्थिति कक्ष (National Situation Room)
              </h2>
            </div>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Strict Zero-Placeholder Data Governance • Real-time Hydro-meteorological, Seismic, NRB Forex & Official Gazette Telemetry.
          </p>
        </div>

        {/* CONTROLS: REFRESH & SOURCE GOVERNANCE AUDITOR */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleToggleOffline}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 border cursor-pointer ${
              isSimulatingOffline 
                ? "bg-red-500/20 text-red-300 border-red-500/50" 
                : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800"
            }`}
            title="Test source disconnection & recovery behavior"
          >
            {isSimulatingOffline ? <WifiOff size={13} className="text-red-400" /> : <Wifi size={13} />}
            <span>{isSimulatingOffline ? "Recovery Simulation" : "Source Governance"}</span>
          </button>

          <button
            onClick={fetchTelemetry}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>अपडेट (Refresh)</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "all", label: "सम्पूर्ण दृश्य (All Command)" },
          { id: "alerts", label: "विपद् तथा मौसम सतर्कता (Disaster & Hydro)" },
          { id: "markets", label: "विनिमय दर (NRB Forex Reference)" },
          { id: "notices", label: "सरकारी सूचना तथा राजपत्र (Gov Gazettes)" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-amber-500 text-black shadow-md font-black"
                : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. SITUATION ROOM MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* CARD B: HYDRO-METEOROLOGICAL & FLOOD ALERTS */}
        {(activeTab === "all" || activeTab === "alerts") && data?.hydromet && data.hydromet.length > 0 && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-amber-500/40 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                    <Waves size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">नदी जलस्तर तथा बाढी सतर्कता</h3>
                    <span className="text-[10px] text-zinc-400 font-mono">Hydrology River Basin Telemetry</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                  {data.hydromet[0].dangerLevel}
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {data.hydromet.map(basin => (
                  <div key={basin.id} className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-zinc-100">{basin.riverBasin}</span>
                      <span className="font-mono text-blue-400 font-bold">{basin.currentLevelMeters}m / {basin.dangerThresholdMeters}m</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>स्टेसन: {basin.station}</span>
                      <span className="font-bold text-emerald-400">प्रवृत्ति: {basin.trend}</span>
                    </div>
                    {/* Water Level Bar */}
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-amber-500" 
                        style={{ width: `${Math.min(100, (basin.currentLevelMeters / basin.dangerThresholdMeters) * 100)}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {renderProvenanceFooter(data.hydromet[0].provenance)}
          </div>
        )}

        {/* CARD C: SEISMIC TELEMETRY (EARTHQUAKE MONITOR) */}
        {(activeTab === "all" || activeTab === "alerts") && data?.seismic && data.seismic.length > 0 && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-amber-500/40 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
                    <Zap size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">राष्ट्रिय भूकम्प मापन केन्द्र</h3>
                    <span className="text-[10px] text-zinc-400 font-mono">Real-time Seismic Telemetry</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                  LIVE TELEMETRY
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">पछिल्लो मापन:</span>
                  <span className="text-lg font-black text-amber-400 font-mono">
                    M {data.seismic[0].magnitude} म्याग्निच्युड
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="text-zinc-400">केन्द्रबिन्दु:</span>
                    <span className="font-bold">{data.seismic[0].epicenter}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span>गहिराइ: {data.seismic[0].depthKm} किमी</span>
                    <span className="font-mono">{data.seismic[0].timestampNpt}</span>
                  </div>
                </div>
              </div>
            </div>

            {renderProvenanceFooter(data.seismic[0].provenance)}
          </div>
        )}

        {/* CARD E: FOREX EXCHANGE (NRB) */}
        {(activeTab === "all" || activeTab === "markets") && data?.commodities && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-amber-500/40 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">विदेशी विनिमय दर (Forex NRB)</h3>
                    <span className="text-[10px] text-zinc-400 font-mono">Central Bank Official Rates</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {data.commodities.filter(c => c.category === "FOREX").map(forex => (
                  <div key={forex.id} className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-zinc-100">{forex.nameNe}</span>
                      <span className="text-xs font-mono text-zinc-300 font-black">{forex.unit}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-mono text-amber-400 font-bold">{forex.rateFormatted}</span>
                      <span className="text-[10px] text-emerald-400">{forex.changeFormatted}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {renderProvenanceFooter(data.commodities.find(c => c.category === "FOREX")?.provenance || data.nepse.provenance)}
          </div>
        )}

        {/* CARD F: GOVERNMENT NOTICES & GAZETTES */}
        {(activeTab === "all" || activeTab === "notices") && data?.notices && data.notices.length > 0 && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-amber-500/40 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">सरकारी सूचना तथा राजपत्र</h3>
                    <span className="text-[10px] text-zinc-400 font-mono">Government Gazette & Emergency Notices</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 font-bold text-[10px]">
                  {data.notices[0].urgentLevel}
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {data.notices.map(notice => (
                  <div key={notice.id} className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-400 uppercase">{notice.ministry}</span>
                    <h4 className="text-xs font-bold text-zinc-100 leading-snug line-clamp-2">
                      {notice.titleNe}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                      <span>{notice.gazetteNumber}</span>
                      <span className="font-mono">{notice.publishedDateNpt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {renderProvenanceFooter(data.notices[0].provenance)}
          </div>
        )}

      </div>
    </section>
  );
}
