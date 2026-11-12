import React, { useState, useEffect } from "react";
import {
  Play,
  Plus,
  Trash2,
  Edit,
  BarChart3,
  Video,
  DollarSign,
  Layers,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Target,
  Clock,
  Eye,
  MousePointer,
  Filter,
  FileCode
} from "lucide-react";
import { VideoCampaign, Advertiser, CampaignAnalytics } from "@/src/types/advertising";
import { advertisingStorage } from "@/src/services/advertisingStorage";
import { AcademyMonetizationGate, AcademyMonetizationReport } from "@/src/services/academyMonetizationGate";
import { toast } from "sonner";

export default function AcademyVideoAdsAdmin() {
  const [activeTab, setActiveTab] = useState<"campaigns" | "advertisers" | "analytics" | "gate">("campaigns");

  const [campaigns, setCampaigns] = useState<VideoCampaign[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [analytics, setAnalytics] = useState<CampaignAnalytics[]>([]);

  // Gate Report
  const [gateReport, setGateReport] = useState<AcademyMonetizationReport | null>(null);
  const [runningGate, setRunningGate] = useState(false);

  // Edit/Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Partial<VideoCampaign> | null>(null);

  // Advertiser Modal State
  const [isAdvModalOpen, setIsAdvModalOpen] = useState(false);
  const [editingAdv, setEditingAdv] = useState<Partial<Advertiser> | null>(null);

  const reloadData = () => {
    setCampaigns(advertisingStorage.getCampaigns());
    setAdvertisers(advertisingStorage.getAdvertisers());
    setAnalytics(advertisingStorage.getCampaignAnalytics());
  };

  useEffect(() => {
    reloadData();
  }, []);

  const runGateTest = async () => {
    setRunningGate(true);
    try {
      const rep = await AcademyMonetizationGate.runAcceptanceSuite();
      setGateReport(rep);
      toast.success(`Monetization Gate executed: ${rep.passCount}/${rep.totalTests} Passed`);
    } catch (e: any) {
      toast.error(`Gate execution error: ${e.message}`);
    } finally {
      setRunningGate(false);
    }
  };

  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign?.campaignName || !editingCampaign?.videoUrl) {
      toast.error("Please enter Campaign Name and Video URL");
      return;
    }

    const saved = advertisingStorage.saveCampaign(editingCampaign);
    toast.success(`Campaign "${saved.campaignName}" saved!`);
    setIsModalOpen(false);
    setEditingCampaign(null);
    reloadData();
  };

  const handleDeleteCampaign = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete campaign "${name}"?`)) {
      advertisingStorage.deleteCampaign(id);
      toast.success("Campaign deleted");
      reloadData();
    }
  };

  const handleSaveAdvertiser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdv?.name) {
      toast.error("Please enter Advertiser Name");
      return;
    }
    const saved = advertisingStorage.saveAdvertiser(editingAdv);
    toast.success(`Advertiser "${saved.name}" saved!`);
    setIsAdvModalOpen(false);
    setEditingAdv(null);
    reloadData();
  };

  const totalImpressions = analytics.reduce((acc, a) => acc + a.impressions, 0);
  const totalClicks = analytics.reduce((acc, a) => acc + a.clicks, 0);
  const totalRevenue = analytics.reduce((acc, a) => acc + a.estimatedRevenueNpr, 0);
  const avgCtr = analytics.length > 0 ? (analytics.reduce((acc, a) => acc + a.ctr, 0) / analytics.length).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Video size={30} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">Academy Video Sponsorship OS</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Revenue OS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              YouTube-Style Academy Video Ad Decision Engine, Membership Entitlements &amp; Inventory OS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runGateTest}
            disabled={runningGate}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-600/20 cursor-pointer transition-all"
          >
            <ShieldCheck size={16} className={runningGate ? "animate-spin" : ""} />
            <span>{runningGate ? "Running Gate..." : "Run Monetization Gate (101-125)"}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Eye size={13} className="text-amber-400" />
            <span>Total Impressions</span>
          </div>
          <div className="text-xl font-black text-white font-mono mt-1">{totalImpressions.toLocaleString()}</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MousePointer size={13} className="text-cyan-400" />
            <span>Clicks &amp; CTR</span>
          </div>
          <div className="text-xl font-black text-white font-mono mt-1">
            {totalClicks.toLocaleString()} <span className="text-xs text-cyan-400 font-bold">({avgCtr}%)</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign size={13} className="text-emerald-400" />
            <span>Est. Ad Revenue</span>
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">NPR {totalRevenue.toLocaleString()}</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={13} className="text-purple-400" />
            <span>Active Campaigns</span>
          </div>
          <div className="text-xl font-black text-white font-mono mt-1">{campaigns.filter(c => c.status === "active").length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 ${
            activeTab === "campaigns"
              ? "bg-amber-500/10 text-amber-400 border-b-2 border-amber-500"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Video size={14} />
          <span>Video Campaigns ({campaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("advertisers")}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 ${
            activeTab === "advertisers"
              ? "bg-amber-500/10 text-amber-400 border-b-2 border-amber-500"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Target size={14} />
          <span>Advertisers ({advertisers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 ${
            activeTab === "analytics"
              ? "bg-amber-500/10 text-amber-400 border-b-2 border-amber-500"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <BarChart3 size={14} />
          <span>Analytics &amp; Performance</span>
        </button>

        <button
          onClick={() => setActiveTab("gate")}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 ${
            activeTab === "gate"
              ? "bg-amber-500/10 text-amber-400 border-b-2 border-amber-500"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ShieldCheck size={14} />
          <span>Verification Gate Suite</span>
        </button>
      </div>

      {/* TAB 1: CAMPAIGNS */}
      {activeTab === "campaigns" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Campaign Inventory</h2>
            <button
              onClick={() => {
                setEditingCampaign({
                  status: "active",
                  priority: 80,
                  skipAfterSeconds: 5,
                  targetTiers: ["free", "member"],
                  placements: ["pre-roll", "mid-roll"],
                  dailyImpressionLimit: 5000,
                  totalImpressionLimit: 100000
                });
                setIsModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
            >
              <Plus size={14} />
              <span>Create Campaign</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map(camp => (
              <div key={camp.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {camp.advertiserLogo ? (
                        <img src={camp.advertiserLogo} alt={camp.advertiserName} className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                          AD
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-400">{camp.advertiserName}</div>
                        <h3 className="text-base font-black text-white">{camp.campaignName}</h3>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      camp.status === "active" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                    }`}>
                      {camp.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-[11px] text-slate-400">
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <div className="text-[9px] uppercase font-bold text-slate-400">Placements</div>
                      <div className="font-bold text-slate-200 mt-0.5">{camp.placements.join(", ")}</div>
                    </div>

                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <div className="text-[9px] uppercase font-bold text-slate-400">Skip Delay</div>
                      <div className="font-mono font-bold text-amber-400 mt-0.5">{camp.skipAfterSeconds}s</div>
                    </div>

                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <div className="text-[9px] uppercase font-bold text-slate-400">Priority</div>
                      <div className="font-mono font-bold text-cyan-400 mt-0.5">{camp.priority}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                  <div className="text-xs font-mono text-slate-400">
                    Impressions: <span className="text-slate-200 font-bold">{camp.currentTotalImpressions}</span> / {camp.totalImpressionLimit}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingCampaign(camp);
                        setIsModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(camp.id, camp.campaignName)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ADVERTISERS */}
      {activeTab === "advertisers" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Partner Advertisers</h2>
            <button
              onClick={() => {
                setEditingAdv({ status: "active" });
                setIsAdvModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
            >
              <Plus size={14} />
              <span>Add Advertiser</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {advertisers.map(adv => (
              <div key={adv.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {adv.logoUrl ? (
                    <img src={adv.logoUrl} alt={adv.name} className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-sm">
                      ADV
                    </div>
                  )}
                  <div>
                    <h3 className="font-black text-white text-sm">{adv.name}</h3>
                    <div className="text-xs text-slate-400">{adv.contactEmail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Campaign Analytics &amp; Conversion Funnel</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Campaign</th>
                  <th className="p-3">Advertiser</th>
                  <th className="p-3">Impressions</th>
                  <th className="p-3">25%</th>
                  <th className="p-3">50%</th>
                  <th className="p-3">Completed</th>
                  <th className="p-3">Skip Rate</th>
                  <th className="p-3">Clicks</th>
                  <th className="p-3">CTR</th>
                  <th className="p-3">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {analytics.map(a => (
                  <tr key={a.campaignId} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-white font-sans">{a.campaignName}</td>
                    <td className="p-3 text-slate-400 font-sans">{a.advertiserName}</td>
                    <td className="p-3 text-amber-400 font-bold">{a.impressions.toLocaleString()}</td>
                    <td className="p-3">{a.watch25.toLocaleString()}</td>
                    <td className="p-3">{a.watch50.toLocaleString()}</td>
                    <td className="p-3 text-emerald-400 font-bold">{a.completions.toLocaleString()}</td>
                    <td className="p-3 text-red-400">{a.skipRate}%</td>
                    <td className="p-3 text-cyan-400 font-bold">{a.clicks.toLocaleString()}</td>
                    <td className="p-3 text-cyan-400">{a.ctr}%</td>
                    <td className="p-3 text-emerald-400 font-bold">NPR {a.estimatedRevenueNpr.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: GATE VERIFICATION SUITE */}
      {activeTab === "gate" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Academy Monetization Gate v1.0</h2>
              <p className="text-xs text-slate-400">Comprehensive 25-Point Acceptance Test Suite (Tests 101–125)</p>
            </div>

            <button
              onClick={runGateTest}
              disabled={runningGate}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <RefreshCw size={14} className={runningGate ? "animate-spin" : ""} />
              <span>Run Suite</span>
            </button>
          </div>

          {gateReport ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    gateReport.overallStatus === "PASS" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400"
                  }`}>
                    {gateReport.overallStatus}
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    Passed: <strong className="text-emerald-400">{gateReport.passCount}</strong> / {gateReport.totalTests}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-400">{gateReport.executedAt}</div>
              </div>

              <pre className="bg-slate-950 border border-slate-800 text-amber-300 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
                {gateReport.formattedSummaryText}
              </pre>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <FileCode size={36} className="mx-auto text-amber-400 opacity-60" />
              <div className="text-sm font-bold text-white">No Gate Report Executed Yet</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Click "Run Suite" above to execute all 25 acceptance tests for campaign activation, targeting, skip countdown, telemetry, and zero-ad premium invariants.
              </p>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT CAMPAIGN MODAL */}
      {isModalOpen && editingCampaign && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveCampaign} className="bg-slate-950 border border-slate-800 text-white p-6 rounded-3xl max-w-2xl w-full space-y-4">
            <h3 className="text-lg font-black">{editingCampaign.id ? "Edit Campaign" : "New Video Campaign"}</h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-400">Campaign Name</label>
                <input
                  type="text"
                  value={editingCampaign.campaignName || ""}
                  onChange={e => setEditingCampaign({ ...editingCampaign, campaignName: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
                  placeholder="e.g. Himalayan Bank Student Grant"
                />
              </div>

              <div>
                <label className="font-bold text-slate-400">Advertiser Name</label>
                <input
                  type="text"
                  value={editingCampaign.advertiserName || ""}
                  onChange={e => setEditingCampaign({ ...editingCampaign, advertiserName: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  placeholder="e.g. Himalayan Bank Ltd."
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="font-bold text-slate-400">Video MP4 URL (CDN / Storage)</label>
              <input
                type="text"
                value={editingCampaign.videoUrl || ""}
                onChange={e => setEditingCampaign({ ...editingCampaign, videoUrl: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-amber-300"
                placeholder="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-400">Skip After (Seconds)</label>
                <input
                  type="number"
                  value={editingCampaign.skipAfterSeconds ?? 5}
                  onChange={e => setEditingCampaign({ ...editingCampaign, skipAfterSeconds: Number(e.target.value) })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-400">Priority (1-100)</label>
                <input
                  type="number"
                  value={editingCampaign.priority ?? 80}
                  onChange={e => setEditingCampaign({ ...editingCampaign, priority: Number(e.target.value) })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-400">Status</label>
                <select
                  value={editingCampaign.status || "active"}
                  onChange={e => setEditingCampaign({ ...editingCampaign, status: e.target.value as any })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg"
              >
                Save Campaign
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
