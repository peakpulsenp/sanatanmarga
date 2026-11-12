import { useState, useMemo } from "react";
import { 
  TrendingUp, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Sliders, 
  FileText, 
  Sparkles, 
  Search,
  Filter,
  BarChart3,
  Calendar,
  Eye,
  Radio,
  ArrowUpRight
} from "lucide-react";
import { Ad } from "@/src/types";
import { calculateCampaignPacing, CampaignPacingReport } from "@/src/services/pacingEngine";
import CampaignPerformanceReport from "./CampaignPerformanceReport";

interface CampaignPacingModuleProps {
  ads: Ad[];
}

export default function CampaignPacingModule({ ads }: CampaignPacingModuleProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReportAd, setSelectedReportAd] = useState<Ad | null>(null);

  // Compute pacing reports for all ads
  const pacingReports = useMemo(() => {
    return ads.map(ad => ({
      ad,
      pacing: calculateCampaignPacing(ad)
    }));
  }, [ads]);

  const filteredReports = useMemo(() => {
    return pacingReports.filter(({ ad, pacing }) => {
      const matchSearch = 
        ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ad.advertiserName && ad.advertiserName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ad.position.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = 
        statusFilter === "all" || 
        pacing.pacingStatus === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [pacingReports, searchTerm, statusFilter]);

  // Overall pacing health aggregate
  const pacingMetrics = useMemo(() => {
    let onPaceCount = 0;
    let underDeliveringCount = 0;
    let overDeliveringCount = 0;
    let completedCount = 0;

    pacingReports.forEach(({ pacing }) => {
      if (pacing.pacingStatus === "on_pace") onPaceCount++;
      else if (pacing.pacingStatus === "under_delivering") underDeliveringCount++;
      else if (pacing.pacingStatus === "over_delivering") overDeliveringCount++;
      else if (pacing.pacingStatus === "completed") completedCount++;
    });

    return {
      total: pacingReports.length,
      onPaceCount,
      underDeliveringCount,
      overDeliveringCount,
      completedCount
    };
  }, [pacingReports]);

  return (
    <div className="space-y-6">
      
      {/* HEADER & HEALTH OVERVIEW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-theme pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-card-foreground">
              विज्ञापन डेलिभरी पेसिङ तथा गति नियन्त्रण (Campaign Delivery Pacing)
            </h2>
            <span className="text-xxs font-black bg-purple-500/10 text-purple-600 px-2.5 py-0.5 rounded-full border border-purple-500/20">
              Live Engine
            </span>
          </div>
          <p className="text-xs text-muted-text mt-1">
            सम्झौता अनुसारको दैनिक अवलोकन लक्ष्य (Daily Impression Target) र वास्तविक डेलिभरी गतिको वास्तविक समय अनुगमन।
          </p>
        </div>

        {/* Pacing Category Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xxs font-bold">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 size={13} /> तालिका अनुसार: {pacingMetrics.onPaceCount}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1.5">
            <AlertCircle size={13} /> ढिलाइ: {pacingMetrics.underDeliveringCount}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center gap-1.5">
            <TrendingUp size={13} /> तीव्र: {pacingMetrics.overDeliveringCount}
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border-theme">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
          <input
            type="text"
            placeholder="अभियान वा विज्ञापनदाता खोज्नुहोस्..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-muted-area/50 border border-border-theme text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {[
            { id: "all", label: "सबै अभियान" },
            { id: "on_pace", label: "अन-पेस (90-110%)" },
            { id: "under_delivering", label: "डेलिभरी ढिलाइ (<90%)" },
            { id: "over_delivering", label: "तीव्र डेलिभरी (>110%)" },
            { id: "completed", label: "सम्पन्न" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted-area text-muted-text hover:text-card-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* PACING CAMPAIGN CARDS / TABLE */}
      <div className="grid grid-cols-1 gap-4">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center text-muted-text bg-card border border-border-theme rounded-2xl">
            कुनै अभियान भेटिएन।
          </div>
        ) : (
          filteredReports.map(({ ad, pacing }) => {
            const progressPct = Math.min(100, Math.round((pacing.actualImpressions / pacing.targetImpressions) * 100));

            return (
              <div 
                key={ad.id} 
                className="bg-card border border-border-theme rounded-2xl p-5 space-y-4 hover:border-purple-500/30 transition-all shadow-xs"
              >
                {/* Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black text-card-foreground">
                        {ad.title}
                      </h3>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${pacing.pacingColor}`}>
                        {pacing.pacingStatusLabelNe}
                      </span>
                    </div>
                    <p className="text-xs text-muted-text">
                      विज्ञापनदाता: <strong className="text-card-foreground">{ad.advertiserName || "व्यावसायिक साझेदार"}</strong> • स्लट: <span className="font-mono text-purple-600 font-bold">{ad.position}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedReportAd(ad)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/10 text-purple-600 hover:bg-purple-600 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-purple-500/20"
                    >
                      <FileText size={13} /> कार्यसम्पादन प्रतिवेदन (Report)
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Gauges */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-text">
                      डेलिभरी प्रगति: <strong className="text-card-foreground">{pacing.actualImpressions.toLocaleString("ne-NP")}</strong> / {pacing.targetImpressions.toLocaleString("ne-NP")} अवलोकन
                    </span>
                    <span className="font-black text-purple-600">{progressPct}% लक्ष्य पूरा</span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-muted-area overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        pacing.pacingStatus === "under_delivering"
                          ? "bg-amber-500"
                          : pacing.pacingStatus === "over_delivering"
                          ? "bg-blue-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Pacing KPIs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-muted-area/40 border border-border-theme text-xs">
                  <div>
                    <span className="text-muted-text text-xxs uppercase font-bold block">पेसिङ सूचक (Pacing Rate):</span>
                    <strong className={`font-mono text-sm font-black ${
                      pacing.pacingStatus === "under_delivering" ? "text-amber-600" : "text-emerald-600"
                    }`}>
                      {pacing.pacingPct}%
                    </strong>
                  </div>

                  <div>
                    <span className="text-muted-text text-xxs uppercase font-bold block">दैनिक वास्तविक गति:</span>
                    <strong className="font-mono text-card-foreground text-sm font-black">
                      {pacing.currentDailyRunRate.toLocaleString("ne-NP")} <span className="text-[10px] font-normal text-muted-text">/दिन</span>
                    </strong>
                  </div>

                  <div>
                    <span className="text-muted-text text-xxs uppercase font-bold block">आवश्यक दैनिक गति:</span>
                    <strong className="font-mono text-purple-600 text-sm font-black">
                      {pacing.requiredDailyRunRate.toLocaleString("ne-NP")} <span className="text-[10px] font-normal text-muted-text">/दिन</span>
                    </strong>
                  </div>

                  <div>
                    <span className="text-muted-text text-xxs uppercase font-bold block">बाँकी समय (Days):</span>
                    <strong className="font-mono text-card-foreground text-sm font-black">
                      {pacing.remainingDays} दिन <span className="text-[10px] text-muted-text">({pacing.timeElapsedPct}% बित्यो)</span>
                    </strong>
                  </div>
                </div>

                {/* Recommendation Note */}
                <div className="flex items-center gap-2 text-xxs text-muted-text bg-card p-2.5 rounded-xl border border-border-theme">
                  <Sliders size={13} className="text-purple-600 shrink-0" />
                  <span><strong>प्रणाली सिफारिस:</strong> {pacing.recommendationNe}</span>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* MODAL: VERIFIED PERFORMANCE REPORT */}
      {selectedReportAd && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative max-h-[90vh] overflow-y-auto w-full max-w-4xl">
            <CampaignPerformanceReport 
              ad={selectedReportAd} 
              onClose={() => setSelectedReportAd(null)} 
            />
          </div>
        </div>
      )}

    </div>
  );
}
