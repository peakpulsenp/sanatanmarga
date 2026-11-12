import React, { useState, useEffect } from "react";
import { 
  Volume2, Plus, Play, Pause, Power, Trash2, Edit3, ShieldCheck, 
  BarChart3, Radio, Sparkles, AlertCircle, CheckCircle2, Clock, Calendar, Users, Eye,
  Upload
} from "lucide-react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { toast } from "sonner";
import { 
  sponsorAudioRegistry, 
  SponsorAudioCampaign 
} from "@/src/services/sponsorAudioRegistry";
import { audioPlaybackManager } from "@/src/services/audioPlaybackManager";
import { articleModuleRegistry } from "@/src/services/articleModuleRegistry";

export default function AdminSponsorAudioOS() {
  const [campaigns, setCampaigns] = useState<SponsorAudioCampaign[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<SponsorAudioCampaign | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    sponsorName: "",
    sponsorLogoUrl: "",
    audioTitle: "",
    audioUrl: "",
    duration: 15,
    startDate: new Date().toISOString().split('T')[0],
    endDate: "2027-12-31",
    active: true,
    priority: 8,
    frequency: 3,
    targetAudience: "free" as 'all' | 'free' | 'member' | 'premium',
    targetPlacement: "all" as 'floating_player' | 'playlist' | 'article_reader' | 'all',
    maxPlaysPerSession: 3,
    maxPlaysPerUserPerDay: 10,
    skipAllowed: true
  });

  useEffect(() => {
    const unsub = sponsorAudioRegistry.subscribe((updated) => {
      setCampaigns(updated);
    });
    return () => unsub();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCampaign(null);
    setFormData({
      sponsorName: "",
      sponsorLogoUrl: "",
      audioTitle: "",
      audioUrl: "",
      duration: 15,
      startDate: new Date().toISOString().split('T')[0],
      endDate: "2027-12-31",
      active: true,
      priority: 8,
      frequency: 3,
      targetAudience: "free",
      targetPlacement: "all",
      maxPlaysPerSession: 3,
      maxPlaysPerUserPerDay: 10,
      skipAllowed: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: SponsorAudioCampaign) => {
    setEditingCampaign(c);
    setFormData({
      sponsorName: c.sponsorName,
      sponsorLogoUrl: c.sponsorLogoUrl || "",
      audioTitle: c.audioTitle,
      audioUrl: c.audioUrl,
      duration: c.duration || 15,
      startDate: c.startDate || new Date().toISOString().split('T')[0],
      endDate: c.endDate || "2027-12-31",
      active: c.active,
      priority: c.priority || 5,
      frequency: c.frequency || 3,
      targetAudience: c.targetAudience || "free",
      targetPlacement: c.targetPlacement || "all",
      maxPlaysPerSession: c.maxPlaysPerSession || 3,
      maxPlaysPerUserPerDay: c.maxPlaysPerUserPerDay || 10,
      skipAllowed: c.skipAllowed !== false
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = (id: string, currentActive: boolean) => {
    sponsorAudioRegistry.toggleActive(id, !currentActive);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("के तपाईं यो प्रायोजित अडियो अभियाण हटाउन निश्चित हुनुहुन्छ?")) {
      sponsorAudioRegistry.deleteCampaign(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sponsorName || !formData.audioTitle || !formData.audioUrl) {
      alert("कृपया प्रायोजकको नाम, अडियो शीर्षक र URL भर्नुहोस्।");
      return;
    }

    if (editingCampaign) {
      sponsorAudioRegistry.updateCampaign(editingCampaign.id, formData);
    } else {
      sponsorAudioRegistry.addCampaign(formData);
    }
    setIsModalOpen(false);
  };

  const handlePreviewAudio = async (url: string, id: string) => {
    if (playingId === id) {
      audioPlaybackManager.pause();
      setPlayingId(null);
    } else {
      await audioPlaybackManager.playTrack({ id, title: "Sponsor Audio Preview", sourceUrl: url });
      setPlayingId(id);
    }
  };

  const activeCount = campaigns.filter(c => c.active).length;
  const totalPlays = campaigns.reduce((acc, c) => acc + (c.playCount || 0), 0);
  const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressionsCount || 0), 0);

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-7 h-7 text-amber-500 animate-pulse" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              ListenOS — प्रायोजित अडियो व्यवस्थापन (Sponsor Audio OS)
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            समाचार र प्रायोजक अडियोको सुरक्षित पृथकीकरण, फ्रिक्वेन्सी क्यापिङ तथा सदस्यतामा आधारित अडियो प्रसारण।
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium flex items-center gap-2 transition shadow-md"
        >
          <Plus className="w-5 h-5" /> नयाँ प्रायोजित अडियो थप्नुहोस्
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">सक्रिय अभियाण</p>
            <p className="text-2xl font-bold mt-1 text-emerald-500">{activeCount} / {campaigns.length}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
            <Power className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">कुल अडियो प्ले</p>
            <p className="text-2xl font-bold mt-1 text-sky-500">{totalPlays.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-sky-500/10 rounded-xl text-sky-500">
            <Volume2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">कुल इम्प्रेसन (Impressions)</p>
            <p className="text-2xl font-bold mt-1 text-indigo-500">{totalImpressions.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">सदस्यता नियम</p>
            <p className="text-xs font-medium mt-1 text-muted-foreground">
              Free: <span className="text-amber-500 font-bold">सक्रिय</span> | Premium: <span className="text-emerald-500 font-bold">100% Sponsor-Free</span>
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Campaign List Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            प्रायोजित अडियो अभियाण सूची
          </h2>
          <span className="text-xs text-muted-foreground">
            नोट: यहाँबाट प्रायोजकलाई तत्काल बन्द (Disable) गर्दा बिना Deploy तुरुन्तै ListenOS मा लागु हुन्छ।
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase border-b border-border">
              <tr>
                <th className="p-3">स्थिति</th>
                <th className="p-3">प्रायोजक / शीर्षक</th>
                <th className="p-3">लक्ष्य समूह</th>
                <th className="p-3">फ्रिक्वेन्सी</th>
                <th className="p-3">प्राथमिकता</th>
                <th className="p-3">मिति दायरा</th>
                <th className="p-3">इम्प्रेसन / प्ले</th>
                <th className="p-3 text-right">कार्यहरू</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition">
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleActive(c.id, c.active)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                        c.active 
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" 
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                      }`}
                      title="तत्काल निष्क्रिय/सक्रिय गर्नुहोस्"
                    >
                      <Power className="w-3.5 h-3.5" />
                      {c.active ? "सक्रिय" : "निष्क्रिय"}
                    </button>
                  </td>
                  <td className="p-3 font-medium">
                    <div className="flex items-center gap-3">
                      {c.sponsorLogoUrl ? (
                        <img src={c.sponsorLogoUrl} alt={c.sponsorName} className="w-8 h-8 rounded-full object-cover border border-border" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs">
                          {c.sponsorName.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          {c.sponsorName}
                          <button 
                            onClick={() => handlePreviewAudio(c.audioUrl, c.id)}
                            className="p-1 text-amber-500 hover:bg-amber-500/10 rounded-full transition"
                            title="अडियो सुन्नुहोस्"
                          >
                            {playingId === c.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <div className="text-xs text-muted-foreground">{c.audioTitle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground font-medium capitalize">
                      {c.targetAudience}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-xs">प्रत्येक {c.frequency} समाचार पछि</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
                      Priority {c.priority}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    <div>{c.startDate} देखि</div>
                    <div>{c.endDate} सम्म</div>
                  </td>
                  <td className="p-3 text-xs">
                    <div className="font-medium text-foreground">{c.impressionsCount} views</div>
                    <div className="text-muted-foreground">{c.playCount} plays</div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditModal(c)}
                        className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition"
                        title="सम्पादन गर्नुहोस्"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-md transition"
                        title="हटाउनुहोस्"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    कुनै प्रायोजित अडियो अभियाण भेटिएन।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-500" />
              {editingCampaign ? "प्रायोजित अडियो सम्पादन गर्नुहोस्" : "नयाँ प्रायोजित अडियो अभियाण थप्नुहोस्"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">प्रायोजकको नाम (Sponsor Name)</label>
                <input
                  type="text"
                  required
                  value={formData.sponsorName}
                  onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  placeholder="उदा: Nepal Telecom, Nabil Bank"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">अडियो शीर्षक (Audio Title)</label>
                <input
                  type="text"
                  required
                  value={formData.audioTitle}
                  onChange={(e) => setFormData({ ...formData, audioTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  placeholder="उदा: ५जी र डिजिटल नेपाल सन्देश"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold">अडियो फाइल / URL (MP3 / WAV / Sound Stream)</label>
                  <label className="text-[11px] font-bold text-amber-500 hover:text-amber-400 cursor-pointer flex items-center gap-1">
                    <Upload size={12} />
                    <span>फाइल अपलोड गर्नुहोस्</span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setFormData(prev => ({
                            ...prev,
                            audioUrl: url,
                            audioTitle: prev.audioTitle || file.name.replace(/\.[^/.]+$/, "")
                          }));
                          toast.success("अडियो फाइल लोड भयो!");
                        }
                      }}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  required
                  value={formData.audioUrl}
                  onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  placeholder="https://... वा माथि 'फाइल अपलोड' थिच्नुहोस्"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">प्रायोजक लोगो URL (वैकल्पिक)</label>
                  <input
                    type="url"
                    value={formData.sponsorLogoUrl}
                    onChange={(e) => setFormData({ ...formData, sponsorLogoUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">अवधि (सेकेन्ड)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">शुरु मिति</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">अन्तिम मिति</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">प्राथमिकता (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">फ्रिक्वेन्सी (समाचार संख्या)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">लक्ष्य समूह</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  >
                    <option value="free">Free Users Only</option>
                    <option value="member">Members & Free</option>
                    <option value="all">All (Non-Premium)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  अभियाण सक्रिय बनाउनुहोस्
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.skipAllowed}
                    onChange={(e) => setFormData({ ...formData, skipAllowed: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  Skip गर्न मिल्ने (Skip Allowed)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition shadow-md"
                >
                  {editingCampaign ? "अद्यावधिक गर्नुहोस्" : "सिर्जना गर्नुहोस्"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
