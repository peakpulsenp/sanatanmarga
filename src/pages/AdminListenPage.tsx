import React, { useState, useEffect } from "react";
import {
  Headphones,
  Plus,
  Play,
  Pause,
  FileText,
  Clock,
  CheckCircle2,
  CloudUpload,
  Search,
  Sparkles,
  BookOpen,
  Mic2,
  ListMusic,
  Upload
} from "lucide-react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { useLanguage } from "@/src/context/LanguageContext";
import { useMediaOS } from "@/src/context/MediaOSContext";
import { adminFetch } from "@/src/lib/adminFetch";
import { toast } from "sonner";

export interface PodcastEpisodeRecord {
  id: string;
  seriesTitle: string;
  titleNe: string;
  titleEn: string;
  host: string;
  duration: string;
  language: "NP" | "EN" | "SA";
  audioUrl: string;
  transcriptStatus: "APPROVED" | "PENDING_REVIEW" | "DRAFT";
  status: "PUBLISHED" | "REVIEW" | "DRAFT";
  chaptersCount: number;
  linkedGranthaId?: string;
  publishedAt: string;
}

const INITIAL_EPISODES: PodcastEpisodeRecord[] = [
  {
    id: "ep-sanatan-01",
    seriesTitle: "Sanatan Darshan & Civilizational Dialogues",
    titleNe: "उपनिषद् चिन्तन र आधुनिक समाजमा नैतिक नेतृत्व",
    titleEn: "Upanishadic Thought & Ethical Leadership in Modern Society",
    host: "आचार्य डा. विश्वनाथ उपाध्याय",
    duration: "28:40",
    language: "NP",
    audioUrl: "https://actions.google.com/sounds/v1/ambiences/morning_birds.ogg",
    transcriptStatus: "APPROVED",
    status: "PUBLISHED",
    chaptersCount: 5,
    linkedGranthaId: "grantha-isha-upanishad",
    publishedAt: "2026-11-10"
  },
  {
    id: "ep-sanatan-02",
    seriesTitle: "Nepal Policy & Economics Podcast",
    titleNe: "नेपालको जलस्रोत, ऊर्जा कूटनीति र दिगो आर्थिक विकास",
    titleEn: "Nepal Hydropower, Energy Diplomacy & Sustainable Economic Growth",
    host: "सम्पादकीय विश्लेषण डेस्क",
    duration: "34:15",
    language: "NP",
    audioUrl: "https://actions.google.com/sounds/v1/ambiences/wind_chimes.ogg",
    transcriptStatus: "APPROVED",
    status: "PUBLISHED",
    chaptersCount: 6,
    publishedAt: "2026-11-09"
  },
  {
    id: "ep-sanatan-03",
    seriesTitle: "Sanatan Gurukul Audio Lectures",
    titleNe: "पाणिनीय व्याकरण र संस्कृत ध्वनि विज्ञानको परिचय",
    titleEn: "Introduction to Paninian Grammar & Sanskrit Phonetics",
    host: "गुरुकुल प्रज्ञा पीठ",
    duration: "41:10",
    language: "SA",
    audioUrl: "https://actions.google.com/sounds/v1/ambiences/morning_birds.ogg",
    transcriptStatus: "PENDING_REVIEW",
    status: "REVIEW",
    chaptersCount: 4,
    linkedGranthaId: "grantha-ashtadhyayi",
    publishedAt: "2026-11-11"
  }
];

export default function AdminListenPage() {
  const { language } = useLanguage();
  const mediaOS = useMediaOS();
  const [episodes, setEpisodes] = useState<PodcastEpisodeRecord[]>(INITIAL_EPISODES);
  const [searchQuery, setSearchQuery] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newEpisode, setNewEpisode] = useState({
    seriesTitle: "Sanatan Darshan & Civilizational Dialogues",
    titleNe: "",
    titleEn: "",
    host: "",
    duration: "25:00",
    audioUrl: "",
    linkedGranthaId: ""
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sg_listenos_episodes");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEpisodes(parsed);
        }
      }
    } catch (e) {}
  }, []);

  const saveEpisodes = (updated: PodcastEpisodeRecord[]) => {
    setEpisodes(updated);
    try {
      localStorage.setItem("sg_listenos_episodes", JSON.stringify(updated));
    } catch (e) {}
  };

  const handleCreateEpisode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEpisode.titleNe.trim() && !newEpisode.titleEn.trim()) {
      toast.error("Please enter an episode title");
      return;
    }
    const created: PodcastEpisodeRecord = {
      id: `ep-${Date.now()}`,
      seriesTitle: newEpisode.seriesTitle,
      titleNe: newEpisode.titleNe || newEpisode.titleEn,
      titleEn: newEpisode.titleEn || newEpisode.titleNe,
      host: newEpisode.host || "Sanatan Editorial Host",
      duration: newEpisode.duration || "20:00",
      language: "NP",
      audioUrl: newEpisode.audioUrl || "https://actions.google.com/sounds/v1/ambiences/morning_birds.ogg",
      transcriptStatus: "PENDING_REVIEW",
      status: "REVIEW",
      chaptersCount: 3,
      linkedGranthaId: newEpisode.linkedGranthaId || undefined,
      publishedAt: new Date().toISOString().slice(0, 10)
    };
    saveEpisodes([created, ...episodes]);
    setIsNewModalOpen(false);
    setNewEpisode({
      seriesTitle: "Sanatan Darshan & Civilizational Dialogues",
      titleNe: "",
      titleEn: "",
      host: "",
      duration: "25:00",
      audioUrl: "",
      linkedGranthaId: ""
    });
    toast.success("Podcast episode added to review queue");
  };

  const handleApproveAndPublishEpisode = (id: string) => {
    const updated = episodes.map(ep =>
      ep.id === id
        ? { ...ep, transcriptStatus: "APPROVED" as const, status: "PUBLISHED" as const }
        : ep
    );
    saveEpisodes(updated);
    toast.success("Episode & transcript approved for ListenOS catalog");
  };

  const handlePublishListenSnapshot = async () => {
    setPublishing(true);
    try {
      const res = await adminFetch("/api/snapshots/rebuild", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "admin_listen_catalog",
          moduleId: "listen_catalog"
        })
      });
      if (res.ok) {
        toast.success("ListenOS catalog snapshot (listen_catalog) published to R2");
      } else {
        toast.error("Snapshot publish returned an error");
      }
    } catch (e) {
      toast.error("Failed to publish ListenOS snapshot");
    } finally {
      setPublishing(false);
    }
  };

  const filtered = episodes.filter(ep => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ep.titleNe.toLowerCase().includes(q) ||
      ep.titleEn.toLowerCase().includes(q) ||
      ep.seriesTitle.toLowerCase().includes(q) ||
      ep.host.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* 1. Header & Status Summary */}
        <div className="bg-card border border-border-theme rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
              <Headphones size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground">
                {language === "en" ? "ListenOS — Podcasts, Spoken Audio & Transcripts" : "ListenOS — पोडकास्ट, श्रव्य सामग्री र ट्रान्सक्रिप्ट"}
              </h1>
              <p className="text-xs text-muted-text">
                {language === "en"
                  ? "Manage podcast shows, episodes, chapter markers, human-approved transcripts, and listen_catalog snapshots"
                  : "पोडकास्ट शृङ्खला, एपिसोड, अध्याय चिन्ह, प्रमाणित ट्रान्सक्रिप्ट र स्न्यापसट प्रकाशन"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-border-theme bg-surface-interactive hover:bg-muted-area text-foreground text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <Plus size={15} />
              <span>{language === "en" ? "New Episode" : "नयाँ एपिसोड"}</span>
            </button>
            <button
              onClick={handlePublishListenSnapshot}
              disabled={publishing}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CloudUpload size={15} />
              <span>
                {publishing
                  ? "Publishing..."
                  : language === "en" ? "Publish listen_catalog Snapshot" : "listen_catalog स्न्यापसट प्रकाशन"}
              </span>
            </button>
          </div>
        </div>

        {/* 2. Search Bar */}
        <div className="bg-card border border-border-theme rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={language === "en" ? "Search podcast shows, episodes, hosts..." : "पोडकास्ट, एपिसोड वा प्रस्तोता खोज्नुहोस्..."}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface-interactive border border-border-theme text-xs text-foreground focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* 3. Episodes Table */}
        <div className="bg-card border border-border-theme rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-theme bg-surface-interactive/60 text-[11px] font-black uppercase tracking-wider text-muted-text">
                  <th className="py-3.5 px-4">Episode & Series</th>
                  <th className="py-3.5 px-4">Host & Duration</th>
                  <th className="py-3.5 px-4">Transcript Gate</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme text-xs">
                {filtered.map(ep => (
                  <tr key={ep.id} className="hover:bg-surface-interactive/40">
                    <td className="py-3.5 px-4">
                      <div className="text-[10px] font-black uppercase tracking-wider text-accent">
                        {ep.seriesTitle}
                      </div>
                      <div className="font-bold text-foreground mt-0.5">
                        {language === "en" ? ep.titleEn : ep.titleNe}
                      </div>
                      {ep.linkedGranthaId && (
                        <div className="text-[11px] text-secondary-accent font-mono mt-0.5 flex items-center gap-1">
                          <BookOpen size={11} />
                          <span>Linked SGIS: {ep.linkedGranthaId}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-muted-text">
                      <div className="font-bold text-foreground flex items-center gap-1">
                        <Mic2 size={12} className="text-accent" />
                        <span>{ep.host}</span>
                      </div>
                      <div className="font-mono text-[11px] mt-0.5 flex items-center gap-2">
                        <span><Clock size={11} className="inline mr-1" />{ep.duration}</span>
                        <span>• {ep.chaptersCount} Chapters</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black ${
                          ep.transcriptStatus === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        <FileText size={11} />
                        <span>{ep.transcriptStatus}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black ${
                          ep.status === "PUBLISHED"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {ep.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            mediaOS.playTrack({
                              id: ep.id,
                              title: language === "en" ? ep.titleEn : ep.titleNe,
                              subtitle: ep.seriesTitle,
                              audioUrl: ep.audioUrl,
                              type: "podcast"
                            } as any)
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-border-theme bg-surface-interactive hover:bg-muted-area text-foreground font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Play size={12} />
                          <span>Preview</span>
                        </button>
                        {ep.status !== "PUBLISHED" && (
                          <button
                            onClick={() => handleApproveAndPublishEpisode(ep.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 size={12} />
                            <span>Approve & Publish</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Episode Modal */}
        {isNewModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleCreateEpisode}
              className="bg-card border border-border-theme rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
            >
              <h3 className="text-base font-black text-foreground">
                {language === "en" ? "Create Podcast Episode" : "नयाँ पोडकास्ट एपिसोड थप्नुहोस्"}
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-muted-text mb-1">Series Title</label>
                  <input
                    type="text"
                    value={newEpisode.seriesTitle}
                    onChange={e => setNewEpisode({ ...newEpisode, seriesTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-interactive border border-border-theme text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted-text mb-1">Episode Title (Nepali)</label>
                  <input
                    type="text"
                    value={newEpisode.titleNe}
                    onChange={e => setNewEpisode({ ...newEpisode, titleNe: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-interactive border border-border-theme text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted-text mb-1">Episode Title (English)</label>
                  <input
                    type="text"
                    value={newEpisode.titleEn}
                    onChange={e => setNewEpisode({ ...newEpisode, titleEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-interactive border border-border-theme text-foreground"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-muted-text mb-1">Host / Speaker</label>
                    <input
                      type="text"
                      value={newEpisode.host}
                      onChange={e => setNewEpisode({ ...newEpisode, host: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-surface-interactive border border-border-theme text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-muted-text mb-1">Duration (MM:SS)</label>
                    <input
                      type="text"
                      value={newEpisode.duration}
                      onChange={e => setNewEpisode({ ...newEpisode, duration: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-surface-interactive border border-border-theme text-foreground font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-muted-text mb-1">Linked SGIS Grantha ID (Optional)</label>
                  <input
                    type="text"
                    value={newEpisode.linkedGranthaId}
                    onChange={e => setNewEpisode({ ...newEpisode, linkedGranthaId: e.target.value })}
                    placeholder="e.g., grantha-isha-upanishad"
                    className="w-full px-3 py-2 rounded-lg bg-surface-interactive border border-border-theme text-foreground font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-muted-text">अडियो मिडिया (Audio URL / File Upload)</label>
                    <label className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1">
                      <Upload size={12} />
                      <span>अडियो फाइल अपलोड</span>
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setNewEpisode(prev => ({
                              ...prev,
                              audioUrl: url,
                              titleNe: prev.titleNe || file.name.replace(/\.[^/.]+$/, "")
                            }));
                            toast.success("अडियो फाइल लोड भयो!");
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={newEpisode.audioUrl}
                    onChange={e => setNewEpisode({ ...newEpisode, audioUrl: e.target.value })}
                    placeholder="https://actions.google.com/sounds/v1/ambiences/morning_birds.ogg"
                    className="w-full px-3 py-2 rounded-lg bg-surface-interactive border border-border-theme text-foreground font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border-theme text-xs font-bold text-muted-text cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black cursor-pointer"
                >
                  Save to Review Queue
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

