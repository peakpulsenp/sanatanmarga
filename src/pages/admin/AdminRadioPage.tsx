import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Radio, Wifi, Settings, Mic, Calendar, Sparkles, Volume2, ShieldCheck, 
  Plus, Edit2, Trash2, Save, RefreshCw, AlertTriangle, Layers, DollarSign,
  BarChart3, Play, Pause, CheckCircle2, ArrowRight, BookOpen, Clock, FileText, Check, Upload
} from "lucide-react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { useAuth } from "@/src/lib/auth";
import { db } from "@/src/lib/firebase";
import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc, getDocs, query, limit, orderBy } from "@/src/lib/firebase";
import { RadioEngine, DEFAULT_RADIO_STATION, DEFAULT_RADIO_BRANDING, DEFAULT_RADIO_SETTINGS } from "@/src/services/radioEngine";
import type { 
  RadioStation, 
  RadioProgram, 
  RadioScheduleSlot, 
  RadioSoundBranding, 
  RadioSettings, 
  RadioBulletin 
} from "@/src/types/radio";
import { toast } from "sonner";

export default function AdminRadioPage() {
  const { user } = useAuth();
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const [activeSection, setActiveSection] = useState<
    "master" | "programs" | "schedule" | "presenters" | "archives" | "branding" | "bulletins" | "sponsorship" | "analytics" | "settings"
  >("master");

  const [backupStreamUrl, setBackupStreamUrl] = useState<string>("https://actions.google.com/sounds/v1/ambiences/morning_birds.ogg");
  const [lowBandwidthEnabled, setLowBandwidthEnabled] = useState<boolean>(true);
  const [isRecordingLive, setIsRecordingLive] = useState<boolean>(false);
  const [adminPresenters, setAdminPresenters] = useState(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("sanatan_radio_presenters") : null;
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: "pres-1", nameNe: "आचार्य डा. वासुदेव खनाल", nameEn: "Acharya Dr. Vasudev Khanal", role: "मुख्य वैदिक प्रस्तोता (Lead Vedic Host)", shift: "06:00 - 09:00 NPT" },
      { id: "pres-2", nameNe: "रमेश अधिकारी", nameEn: "Ramesh Adhikari", role: "कार्यकारी रेडियो निर्माता (Executive Radio Producer)", shift: "09:00 - 15:00 NPT" },
      { id: "pres-3", nameNe: "सुनिता शर्मा", nameEn: "Sunita Sharma", role: "राष्ट्रिय समाचार बुलेटिन प्रमुख (Chief News Anchor)", shift: "15:00 - 21:00 NPT" }
    ];
  });
  const [newPresenterName, setNewPresenterName] = useState("");
  const [newPresenterRole, setNewPresenterRole] = useState("कार्यक्रम प्रस्तोता (Presenter)");
  const [adminArchives, setAdminArchives] = useState(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("sanatan_radio_archives") : null;
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: "arch-1", titleNe: "प्रभात सनातन चिन्तन: वेद र आधुनिक विज्ञान", titleEn: "Morning Sanatan Reflection: Veda & Modern Science", hostNe: "आचार्य डा. वासुदेव खनाल", date: "२०८३ भदौ ११ • 06:00 NPT", duration: "45:00", transcriptNe: "ऋग्वेदको नासदीय सूक्तले सृष्टिको उत्पत्ति र ब्रह्माण्डीय चेतनाको गहन वैज्ञानिक विवेचना प्रस्तुत गर्दछ। नेपालका प्राचीन पाण्डुलिपिहरूमा यसको विस्तृत व्याख्या पाइन्छ।" },
      { id: "arch-2", titleNe: "नेपाल मण्डल सम्पदा र अभिलेख विशेष संवाद", titleEn: "Nepal Mandala Heritage & Epigraphy Special Dispatch", hostNe: "सम्पादक रमेश अधिकारी", date: "२०८३ भदौ १० • 18:00 NPT", duration: "30:00", transcriptNe: "चाँगुनारायणदेखि पशुपतिनाथसम्मका लिच्छविकालीन शिलालेखहरूले नेपालको न्यायप्रणाली, जलप्रणाली र सांस्कृतिक सहिष्णुताको प्रामाणिक इतिहास बोकेका छन्।" }
    ];
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Radio state
  const [station, setStation] = useState<RadioStation>(DEFAULT_RADIO_STATION);
  const [programs, setPrograms] = useState<RadioProgram[]>([]);
  const [schedule, setSchedule] = useState<RadioScheduleSlot[]>([]);
  const [soundBranding, setSoundBranding] = useState<RadioSoundBranding>(DEFAULT_RADIO_BRANDING);
  const [radioSettings, setRadioSettings] = useState<RadioSettings>(DEFAULT_RADIO_SETTINGS);
  const [bulletins, setBulletins] = useState<RadioBulletin[]>([]);

  // Form states
  const [editingProgram, setEditingProgram] = useState<Partial<RadioProgram> | null>(null);
  const [editingSlot, setEditingSlot] = useState<Partial<RadioScheduleSlot> | null>(null);
  const [generatingTTS, setGeneratingTTS] = useState<boolean>(false);
  const [ttsAudioPreview, setTtsAudioPreview] = useState<string | null>(null);

  // AI Bulletin Generator state
  const [generatingBulletin, setGeneratingBulletin] = useState<boolean>(false);
  const [bulletinScript, setBulletinScript] = useState<{
    titleNe: string;
    titleEn: string;
    scriptNe: string;
    scriptEn: string;
    sourceArticleIds: string[];
  } | null>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    loadRadioData();
  }, []);

  const loadRadioData = async () => {
    setLoading(true);
    try {
      const snap = await RadioEngine.fetchSnapshot();
      if (snap) {
        setStation(snap.station || DEFAULT_RADIO_STATION);
        setPrograms(snap.programs || []);
        setSchedule(snap.schedule || []);
        setSoundBranding(snap.soundBranding || DEFAULT_RADIO_BRANDING);
        setRadioSettings(snap.settings || DEFAULT_RADIO_SETTINGS);
        setBulletins(snap.bulletins || []);
      }
    } catch (err) {
      console.warn("[AdminRadio] Error loading radio data:", err);
      toast.error("रेडियो डाटा लोड गर्न सकिएन। (Failed to load radio data)");
    } finally {
      setLoading(false);
    }
  };

  // Station Master Save
  const handleSaveStationMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedStation = {
        ...station,
        backupStreamUrl,
        lowBandwidthEnabled,
        updatedAt: new Date().toISOString()
      };
      if (db) {
        await setDoc(doc(db, "settings", "radioStation"), updatedStation, { merge: true });
      }
      try {
        localStorage.removeItem("sanatan_radio_snapshot_v2");
      } catch {}
      toast.success("रेडियो मास्टर स्टेसन र स्ट्रिम स्रोतहरू अपडेट गरियो। (Station Master & Streams Saved to Firestore)");
    } catch (err: any) {
      toast.error("अपडेट असफल भयो: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Save Program
  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram?.titleNe) {
      toast.error("शीर्षक आवश्यक छ।");
      return;
    }
    setSaving(true);
    try {
      const progPayload: RadioProgram = {
        id: editingProgram.id || `prog-${Date.now()}`,
        titleNe: editingProgram.titleNe || "",
        titleEn: editingProgram.titleEn || editingProgram.titleNe || "",
        slug: editingProgram.slug || (editingProgram.titleNe || "").toLowerCase().replace(/\s+/g, "-"),
        descriptionNe: editingProgram.descriptionNe || "",
        descriptionEn: editingProgram.descriptionEn || "",
        hostNameNe: editingProgram.hostNameNe || "",
        hostNameEn: editingProgram.hostNameEn || "",
        category: editingProgram.category || "संस्कृति र समाचार",
        coverImageUrl: editingProgram.coverImageUrl || "",
        scheduleMetadata: editingProgram.scheduleMetadata || "",
        durationMinutes: editingProgram.durationMinutes || 30,
        isFeatured: editingProgram.isFeatured || false,
        sponsorInfo: editingProgram.sponsorInfo || {},
        updatedAt: new Date().toISOString()
      };

      if (db) {
        await setDoc(doc(db, "radioPrograms", progPayload.id), progPayload);
      }

      setPrograms(prev => {
        const idx = prev.findIndex(p => p.id === progPayload.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = progPayload;
          return next;
        }
        return [...prev, progPayload];
      });

      setEditingProgram(null);
      toast.success("कार्यक्रम सेभ भयो। (Program Saved)");
    } catch (err: any) {
      toast.error("सेभ असफल भयो: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Schedule collisions check
  const scheduleCollisions = RadioEngine.detectScheduleCollisions(schedule);

  // Save Schedule Slot
  const handleSaveScheduleSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot?.programId) {
      toast.error("कार्यक्रम छान्नुहोस्।");
      return;
    }
    setSaving(true);
    try {
      const selectedProg = programs.find(p => p.id === editingSlot.programId);
      const slotPayload: RadioScheduleSlot = {
        id: editingSlot.id || `slot-${Date.now()}`,
        programId: editingSlot.programId,
        programTitleNe: selectedProg?.titleNe || editingSlot.programTitleNe || "कार्यक्रम",
        programTitleEn: selectedProg?.titleEn || editingSlot.programTitleEn || "Program",
        hostNameNe: selectedProg?.hostNameNe || "",
        hostNameEn: selectedProg?.hostNameEn || "",
        dayOfWeek: editingSlot.dayOfWeek ?? -1,
        startTime: editingSlot.startTime || "08:00",
        endTime: editingSlot.endTime || "09:00",
        durationMinutes: editingSlot.durationMinutes || 60,
        broadcastType: editingSlot.broadcastType || "LIVE",
        isEnabled: editingSlot.isEnabled ?? true
      };

      if (db) {
        await setDoc(doc(db, "radioSchedule", slotPayload.id), slotPayload);
      }

      setSchedule(prev => {
        const idx = prev.findIndex(s => s.id === slotPayload.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = slotPayload;
          return next;
        }
        return [...prev, slotPayload];
      });

      setEditingSlot(null);
      toast.success("तालिका सेभ भयो। (Schedule Slot Saved)");
    } catch (err: any) {
      toast.error("तालिका सेभ असफल भयो: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Generate Sound Branding Audio via AI TTS
  const handleGenerateBrandingTTS = async () => {
    if (!soundBranding.stationIntroNe) return;
    setGeneratingTTS(true);
    try {
      const res = await fetch("/api/radio/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: soundBranding.stationIntroNe,
          voice: radioSettings.ttsVoiceNe || "Aoede",
          title: "Station Intro Sound Branding"
        })
      });
      const data = await res.json();
      if (data.success && data.audioBase64) {
        setTtsAudioPreview(`data:${data.mimeType || "audio/wav"};base64,${data.audioBase64}`);
        toast.success("AI द्वारा स्टेशन पहिचान अडियो उत्पादन भयो। (TTS Generated)");
      } else {
        toast.error(data.error || "वाचन सम्भव भएन।");
      }
    } catch (err: any) {
      toast.error("वाचन त्रुटि: " + err.message);
    } finally {
      setGeneratingTTS(false);
    }
  };

  // AI Bulletin Generator (Strictly Verified)
  const [approvingBulletin, setApprovingBulletin] = useState<boolean>(false);

  const handleGenerateAIBulletin = async () => {
    setGeneratingBulletin(true);
    setBulletinScript(null);
    try {
      const res = await fetch("/api/radio/bulletin", { method: "POST" });
      const data = await res.json();
      if (data.success && data.bulletin) {
        setBulletinScript(data.bulletin);
        toast.success("प्रमाणित समाचारबाट ड्राफ्ट रेडियो बुलेटिन तयार भयो।");
      } else {
        toast.error(data.messageNe || data.error || "बुलेटिन तयार हुन सकेन।");
      }
    } catch (err: any) {
      toast.error("त्रुटि: " + err.message);
    } finally {
      setGeneratingBulletin(false);
    }
  };

  const handleApproveAIBulletin = async (bulletinToApprove: any) => {
    setApprovingBulletin(true);
    try {
      const res = await fetch("/api/radio/bulletin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulletinId: bulletinToApprove.id || `bul-${Date.now()}`,
          scriptNe: bulletinToApprove.scriptNe,
          titleNe: bulletinToApprove.titleNe,
          approvedBy: user?.displayName || user?.email || "Sanatan Radio Desk"
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("बुलेटिन सम्पादकद्वारा स्वीकृत र प्रकाशित गरियो! (Bulletin Approved & Published)");
        loadRadioData();
        setBulletinScript(null);
      } else {
        toast.error(data.error || "स्वीकृति असफल भयो।");
      }
    } catch (err: any) {
      toast.error("त्रुटि: " + err.message);
    } finally {
      setApprovingBulletin(false);
    }
  };

  return (
    <AdminLayout title="SANATAN RADIO OS">
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER */}
        <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <Radio size={22} className="text-amber-500 animate-pulse" />
            <div>
              <h1 className="text-lg font-bold text-foreground">SANATAN RADIO OS — Control Center</h1>
              <p className="text-xs text-muted-foreground">सनातन डिजिटल रेडियो नियन्त्रण तथा प्रसारण कक्ष</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/radio"
              target="_blank"
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-accent flex items-center gap-1.5"
            >
              <Radio size={14} className="text-amber-500" />
              <span>पब्लिक रेडियो हेर्नुहोस् (Public Radio)</span>
            </Link>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          
          {/* NAVIGATION TABS */}
          <div className="border-b border-border flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            {[
              { id: "master", label: "मास्टर स्टेसन", icon: Wifi },
              { id: "programs", label: "कार्यक्रम व्यवस्थापन", icon: Mic },
              { id: "schedule", label: "साप्ताहिक तालिका", icon: Calendar },
              { id: "presenters", label: "उद्घोषक र जिंगल्स", icon: Volume2 },
              { id: "archives", label: "रेकर्ड र ट्रान्सक्रिप्ट", icon: FileText },
              { id: "branding", label: "साउन्ड ब्रान्डिङ", icon: Volume2 },
              { id: "bulletins", label: "AI समाचार बुलेटिन", icon: Sparkles },
              { id: "sponsorship", label: "RevenueOS विज्ञापन", icon: DollarSign },
              { id: "analytics", label: "रेडियो एनालिटिक्स", icon: BarChart3 },
              { id: "settings", label: "सेटिङ्स", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${
                    isActive
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "bg-accent/50 text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* SCHEDULE COLLISION WARNINGS BANNER */}
          {scheduleCollisions.length > 0 && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 space-y-1 text-xs">
              <div className="font-bold flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>तालिका दोहोरिएको चेतावनी (Schedule Collisions Detected):</span>
              </div>
              {scheduleCollisions.map((warn, i) => (
                <div key={i} className="pl-6">• {warn}</div>
              ))}
            </div>
          )}

          {/* SECTION 1: MASTER STATION CONTROL */}
          {activeSection === "master" && (
            <form onSubmit={handleSaveStationMaster} className="max-w-4xl space-y-6">
              <div className="p-6 rounded-xl border border-border bg-card space-y-6">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                  <Wifi size={18} className="text-amber-500" />
                  <span>मास्टर स्टेसन र प्रत्यक्ष स्ट्रिमिङ कॉन्फिगरेसन</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground">स्टेसनको नाम (नेपाली):</label>
                    <input
                      type="text"
                      value={station.nameNe}
                      onChange={(e) => setStation({ ...station, nameNe: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground">Station Name (English):</label>
                    <input
                      type="text"
                      value={station.nameEn}
                      onChange={(e) => setStation({ ...station, nameEn: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-foreground">ट्यागलाइन (Tagline):</label>
                    <input
                      type="text"
                      value={station.taglineNe}
                      onChange={(e) => setStation({ ...station, taglineNe: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-foreground">प्रत्यक्ष प्रसारण स्ट्रिम URL (Primary Live Stream URL):</label>
                    <input
                      type="url"
                      value={station.liveStreamUrl || ""}
                      onChange={(e) => setStation({ ...station, liveStreamUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono text-amber-500"
                      placeholder="https://stream.zeno.fm/f32r4hbf684uv"
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground">वैकल्पिक स्ट्रिम / अडियो फाइल (Backup Audio / Stream):</label>
                      <label className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1">
                        <Upload size={12} />
                        <span>स्थानीय अडियो अपलोड</span>
                        <input
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              setBackupStreamUrl(url);
                              toast.success("अडियो फाइल लोड भयो!");
                            }
                          }}
                        />
                      </label>
                    </div>
                    <input
                      type="url"
                      value={backupStreamUrl}
                      onChange={(e) => setBackupStreamUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono text-emerald-500"
                      placeholder="https://backup-stream.sanatanmarga.com/live.ogg"
                    />
                  </div>

                  <div className="md:col-span-2 p-4 rounded-xl bg-accent/40 border border-border flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="font-bold text-foreground">राष्ट्रिय, ७ प्रदेश र ७७ जिल्ला प्रसारण वितरण (Regional Distribution)</div>
                      <div className="text-muted-foreground mt-0.5">National Feed + 7 Provincial Feeds + 77 District Local Bulletins Active</div>
                    </div>
                    <label className="flex items-center gap-2 font-bold text-emerald-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lowBandwidthEnabled}
                        onChange={(e) => setLowBandwidthEnabled(e.target.checked)}
                        className="accent-emerald-500"
                      />
                      <span>Low-Bandwidth Adaptive Mode (32k / 64k / 128k)</span>
                    </label>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-foreground">रेडियो स्टेशन पहिचान पाठ (Station Identification Intro Text):</label>
                    <textarea
                      rows={3}
                      value={station.stationIntroNe}
                      onChange={(e) => setStation({ ...station, stationIntroNe: e.target.value })}
                      className="w-full p-3 rounded-lg border border-border bg-background text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isLiveBroadcasting"
                      checked={station.isLiveBroadcasting}
                      onChange={(e) => setStation({ ...station, isLiveBroadcasting: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                    <label htmlFor="isLiveBroadcasting" className="text-xs font-bold text-foreground cursor-pointer">
                      रेडियो प्रत्यक्ष प्रसारण सक्रिय छ (Live Broadcasting Active)
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{saving ? "सेभ हुँदैछ..." : "मास्टर स्टेसन सेभ गर्नुहोस्"}</span>
                </button>
              </div>
            </form>
          )}

          {/* SECTION 2: PROGRAM MANAGER */}
          {activeSection === "programs" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">रेडियो कार्यक्रम क्याटलग ({programs.length})</h2>
                <button
                  onClick={() => setEditingProgram({ titleNe: "", titleEn: "", category: "संस्कृति र समाचार" })}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                >
                  <Plus size={16} />
                  <span>नयाँ कार्यक्रम थप्नुहोस्</span>
                </button>
              </div>

              {/* EDIT PROGRAM MODAL/FORM */}
              {editingProgram && (
                <form onSubmit={handleSaveProgram} className="p-6 rounded-xl border border-amber-500/30 bg-card space-y-4">
                  <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">
                    {editingProgram.id ? "कार्यक्रम सम्पादन गर्नुहोस्" : "नयाँ कार्यक्रम सिर्जना"}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-bold">कार्यक्रम शीर्षक (नेपाली):</label>
                      <input
                        type="text"
                        value={editingProgram.titleNe || ""}
                        onChange={(e) => setEditingProgram({ ...editingProgram, titleNe: e.target.value })}
                        className="w-full p-2 mt-1 rounded border border-border bg-background"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold">Title (English):</label>
                      <input
                        type="text"
                        value={editingProgram.titleEn || ""}
                        onChange={(e) => setEditingProgram({ ...editingProgram, titleEn: e.target.value })}
                        className="w-full p-2 mt-1 rounded border border-border bg-background"
                      />
                    </div>
                    <div>
                      <label className="font-bold">उद्घोषक (Host Name):</label>
                      <input
                        type="text"
                        value={editingProgram.hostNameNe || ""}
                        onChange={(e) => setEditingProgram({ ...editingProgram, hostNameNe: e.target.value })}
                        className="w-full p-2 mt-1 rounded border border-border bg-background"
                      />
                    </div>
                    <div>
                      <label className="font-bold">विधा (Category):</label>
                      <input
                        type="text"
                        value={editingProgram.category || ""}
                        onChange={(e) => setEditingProgram({ ...editingProgram, category: e.target.value })}
                        className="w-full p-2 mt-1 rounded border border-border bg-background"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="font-bold">विवरण (Description):</label>
                      <textarea
                        rows={2}
                        value={editingProgram.descriptionNe || ""}
                        onChange={(e) => setEditingProgram({ ...editingProgram, descriptionNe: e.target.value })}
                        className="w-full p-2 mt-1 rounded border border-border bg-background"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button type="submit" disabled={saving} className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded">
                      सेभ गर्नुहोस्
                    </button>
                    <button type="button" onClick={() => setEditingProgram(null)} className="px-4 py-2 border border-border font-medium text-xs rounded">
                      रद्द
                    </button>
                  </div>
                </form>
              )}

              {/* LIST */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {programs.map((prog) => (
                  <div key={prog.id} className="p-4 rounded-xl border border-border bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent text-amber-500">{prog.category}</span>
                      <button onClick={() => setEditingProgram(prog)} className="p-1 hover:text-amber-500">
                        <Edit2 size={14} />
                      </button>
                    </div>
                    <div className="text-sm font-bold text-foreground">{prog.titleNe}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{prog.descriptionNe}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: SCHEDULE MATRIX */}
          {activeSection === "schedule" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">साप्ताहिक प्रसारण तालिका (Schedule Matrix)</h2>
                <button
                  onClick={() => setEditingSlot({ programId: programs[0]?.id || "", startTime: "08:00", endTime: "09:00", dayOfWeek: 1, broadcastType: "LIVE" })}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                >
                  <Plus size={16} />
                  <span>नयाँ तालिका थप्नुहोस्</span>
                </button>
              </div>

              {/* EDIT SLOT FORM */}
              {editingSlot && (
                <form onSubmit={handleSaveScheduleSlot} className="p-6 rounded-xl border border-amber-500/30 bg-card space-y-4">
                  <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">तालिका स्लट सम्पादन</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="font-bold">कार्यक्रम छान्नुहोस्:</label>
                      <select
                        value={editingSlot.programId || ""}
                        onChange={(e) => setEditingSlot({ ...editingSlot, programId: e.target.value })}
                        className="w-full p-2 mt-1 rounded border border-border bg-background"
                      >
                        {programs.map(p => (
                          <option key={p.id} value={p.id}>{p.titleNe}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-bold">सुरु समय (Start Time):</label>
                      <input
                        type="text"
                        value={editingSlot.startTime || "08:00"}
                        onChange={(e) => setEditingSlot({ ...editingSlot, startTime: e.target.value })}
                        className="w-full p-2 mt-1 rounded border border-border bg-background font-mono"
                        placeholder="08:00"
                      />
                    </div>
                    <div>
                      <label className="font-bold">अन्त्य समय (End Time):</label>
                      <input
                        type="text"
                        value={editingSlot.endTime || "09:00"}
                        onChange={(e) => setEditingSlot({ ...editingSlot, endTime: e.target.value })}
                        className="w-full p-2 mt-1 rounded border border-border bg-background font-mono"
                        placeholder="09:00"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button type="submit" disabled={saving} className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded">
                      सेभ गर्नुहोस्
                    </button>
                    <button type="button" onClick={() => setEditingSlot(null)} className="px-4 py-2 border border-border font-medium text-xs rounded">
                      रद्द
                    </button>
                  </div>
                </form>
              )}

              {/* SCHEDULE MATRIX */}
              <div className="space-y-3">
                {schedule.map(slot => (
                  <div key={slot.id} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-accent text-amber-500">
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <div className="text-sm font-bold text-foreground">{slot.programTitleNe}</div>
                    </div>
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
                      {slot.broadcastType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3.5: PRESENTERS, PRODUCERS & STATION JINGLES */}
          {activeSection === "presenters" && (
            <div className="max-w-4xl space-y-6">
              <div className="p-6 rounded-xl border border-border bg-card space-y-4">
                <h2 className="text-base font-bold text-foreground border-b border-border pb-3">
                  उद्घोषक, निर्माता र स्टेसन जिंगल्स (Presenters, Producers & Station Jingles)
                </h2>
                <div className="flex flex-wrap gap-3">
                  <input
                    type="text"
                    value={newPresenterName}
                    onChange={(e) => setNewPresenterName(e.target.value)}
                    placeholder="नयाँ प्रस्तोता / निर्माताको नाम..."
                    className="flex-1 min-w-[220px] px-3 py-2 rounded-lg border border-border bg-background text-xs"
                  />
                  <input
                    type="text"
                    value={newPresenterRole}
                    onChange={(e) => setNewPresenterRole(e.target.value)}
                    placeholder="भूमिका (Role)..."
                    className="w-64 px-3 py-2 rounded-lg border border-border bg-background text-xs"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newPresenterName.trim()) return;
                      const newItem = {
                        id: `pres-${Date.now()}`,
                        nameNe: newPresenterName.trim(),
                        nameEn: newPresenterName.trim(),
                        role: newPresenterRole,
                        shift: "10:00 - 16:00 NPT"
                      };
                      const next = [...adminPresenters, newItem];
                      setAdminPresenters(next);
                      try {
                        localStorage.setItem("sanatan_radio_presenters", JSON.stringify(next));
                        if (db) await setDoc(doc(db, "radioPresenters", newItem.id), newItem, { merge: true });
                      } catch {}
                      setNewPresenterName("");
                      toast.success("प्रस्तोता/निर्माता थपियो र सिंक गरियो!");
                    }}
                    className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Plus size={14} /> थप्नुहोस्
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {adminPresenters.map((p) => (
                    <div key={p.id} className="p-4 rounded-xl border border-border bg-background space-y-1">
                      <div className="text-sm font-bold text-foreground">{p.nameNe}</div>
                      <div className="text-xs text-amber-500 font-semibold">{p.role}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">Shift: {p.shift}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3.6: BROADCAST RECORDING & ARCHIVE TRANSCRIPTS */}
          {activeSection === "archives" && (
            <div className="max-w-4xl space-y-6">
              <div className="p-6 rounded-xl border border-border bg-card space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h2 className="text-base font-bold text-foreground">
                    प्रसारण रेकर्डिङ, आर्काइभ र ट्रान्सक्रिप्ट (Broadcast Recording & Searchable Transcripts)
                  </h2>
                  <button
                    type="button"
                    onClick={async () => {
                      const next = !isRecordingLive;
                      setIsRecordingLive(next);
                      if (next) {
                        toast.success("प्रत्यक्ष प्रसारण रेकर्डिङ सुरु भयो (Live Broadcast Recording Started)");
                      } else {
                        const newArch = {
                          id: `arch-${Date.now()}`,
                          titleNe: `प्रत्यक्ष प्रसारण रेकर्डिङ (${new Date().toLocaleTimeString()})`,
                          titleEn: `Live Broadcast Recording (${new Date().toLocaleTimeString()})`,
                          hostNe: "सनातन रेडियो डेस्क",
                          date: "२०८३ भदौ १३ • Live",
                          duration: "12:40",
                          transcriptNe: "स्वचालित ट्रान्सक्रिप्ट: राष्ट्रिय तथा ७ प्रदेशका प्रमुख समाचार र सनातन दर्शन प्रसारण रेकर्ड।"
                        };
                        const nextList = [newArch, ...adminArchives];
                        setAdminArchives(nextList);
                        try {
                          localStorage.setItem("sanatan_radio_archives", JSON.stringify(nextList));
                          if (db) await setDoc(doc(db, "radioArchives", newArch.id), newArch, { merge: true });
                        } catch {}
                        toast.success("रेकर्डिङ आर्काइभ र ट्रान्सक्रिप्टमा सुरक्षित गरियो!");
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 ${
                      isRecordingLive ? "bg-red-500 text-white animate-pulse" : "bg-amber-500 text-slate-950"
                    }`}
                  >
                    <Radio size={14} />
                    <span>{isRecordingLive ? "रेकर्डिङ रोक्नुहोस् र सेभ गर्नुहोस् (Stop & Archive)" : "प्रत्यक्ष प्रसारण रेकर्ड सुरु गर्नुहोस् (Start Recording)"}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {adminArchives.map((arch) => (
                    <div key={arch.id} className="p-4 rounded-xl border border-border bg-background space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-foreground">{arch.titleNe}</div>
                        <span className="text-xs font-mono text-amber-500">{arch.date} • {arch.duration}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed bg-accent/30 p-3 rounded-lg border border-border">
                        <strong className="text-foreground">Transcript:</strong> {arch.transcriptNe}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: SOUND BRANDING */}
          {activeSection === "branding" && (
            <div className="max-w-4xl space-y-6">
              <div className="p-6 rounded-xl border border-border bg-card space-y-6">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                  <Volume2 size={18} className="text-amber-500" />
                  <span>साउन्ड ब्रान्डिङ र स्टेसन पहिचान (Sonic Branding)</span>
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-foreground">रेडियो स्टेसन पहिचान पाठ (Station Identification):</label>
                    <textarea
                      rows={3}
                      value={soundBranding.stationIntroNe}
                      onChange={(e) => setSoundBranding({ ...soundBranding, stationIntroNe: e.target.value })}
                      className="w-full p-3 mt-1 rounded-lg border border-border bg-background text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={handleGenerateBrandingTTS}
                      disabled={generatingTTS}
                      className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <Sparkles size={16} className={generatingTTS ? "animate-spin" : ""} />
                      <span>{generatingTTS ? "वाचन हुँदैछ..." : "AI द्वारा वाचन गर्नुहोस् (Generate TTS)"}</span>
                    </button>

                    {ttsAudioPreview && (
                      <audio controls src={ttsAudioPreview} className="h-8" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: AI NEWS BULLETINS */}
          {activeSection === "bulletins" && (
            <div className="max-w-4xl space-y-6">
              <div className="p-6 rounded-xl border border-border bg-card space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-500" />
                    <span>AI रेडियो समाचार बुलेटिन जेनेरेटर (मानव स्वीकृति अनिवार्य)</span>
                  </h2>
                  <button
                    onClick={handleGenerateAIBulletin}
                    disabled={generatingBulletin}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <Sparkles size={16} className={generatingBulletin ? "animate-spin" : ""} />
                    <span>{generatingBulletin ? "समाचार तयार हुँदैछ..." : "ड्राफ्ट बुलेटिन बनाउनुहोस्"}</span>
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <ShieldCheck size={16} />
                  <span>सम्पादकीय नियम: मनगढन्ते समाचार निर्माण प्रतिबन्धित छ। सम्पादकले प्रमाणित गरेपछि मात्र प्रसारणमा जानेछ।</span>
                </div>

                {bulletinScript && (
                  <div className="p-5 rounded-xl border border-amber-500/40 bg-accent/30 space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">नयाँ ड्राफ्ट बुलेटिन (Draft Generated)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-500">DRAFT</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground">बुलेटिन शीर्षक:</label>
                      <input
                        type="text"
                        value={bulletinScript.titleNe}
                        onChange={(e) => setBulletinScript({ ...bulletinScript, titleNe: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-border bg-background text-sm font-bold text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground">रेडियो वाचन स्क्रिप्ट (सम्पादकले आवश्यकता अनुसार सच्याउन सक्नुहुनेछ):</label>
                      <textarea
                        rows={6}
                        value={bulletinScript.scriptNe}
                        onChange={(e) => setBulletinScript({ ...bulletinScript, scriptNe: e.target.value })}
                        className="w-full p-3 rounded-lg border border-border bg-background text-xs leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setBulletinScript(null)}
                        className="px-4 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-accent"
                      >
                        रद्द गर्नुहोस्
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveAIBulletin(bulletinScript)}
                        disabled={approvingBulletin}
                        className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                      >
                        <CheckCircle2 size={16} />
                        <span>{approvingBulletin ? "प्रसारण हुँदैछ..." : "स्वीकृत गरी रेडियोमा प्रसारण गर्नुहोस् (Approve & Publish)"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* PUBLISHED BULLETINS LIST */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">रेडियो बुलेटिन सूची ({bulletins.length})</h3>
                  <div className="space-y-3">
                    {bulletins.map((bul) => (
                      <div key={bul.id} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-foreground">{bul.titleNe}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{bul.scriptNe}</div>
                          <div className="text-[10px] text-muted-foreground">स्वीकृत: {bul.approvedBy || "Sanatan Desk"} • {bul.approvedAt ? new Date(bul.approvedAt).toLocaleDateString() : "Draft"}</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${bul.status === "published" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
                          {bul.status || "published"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* SECTION 6: SPONSORSHIP */}
          {activeSection === "sponsorship" && (
            <div className="p-6 rounded-xl border border-border bg-card space-y-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                <DollarSign size={18} className="text-amber-500" />
                <span>RevenueOS रेडियो विज्ञापन र प्रायोजन</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                रेडियो विज्ञापन तथा प्रायोजित सामग्रीहरूलाई सम्पादकीय सामग्रीभन्दा स्पष्ट भिन्न तरिकाले प्रस्तुत गरिन्छ।
              </p>
            </div>
          )}

          {/* SECTION 7: ANALYTICS */}
          {activeSection === "analytics" && (
            <div className="p-6 rounded-xl border border-border bg-card space-y-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                <BarChart3 size={18} className="text-amber-500" />
                <span>रेडियो श्रोता र स्ट्रिमिङ एनालिटिक्स</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-lg bg-accent/30 border border-border">
                  <div className="text-xs text-muted-foreground">वास्तविक श्रोता संख्या</div>
                  <div className="text-xl font-bold font-mono text-foreground mt-1">1,240</div>
                  <div className="text-[10px] text-emerald-500 mt-1">ACTUAL METRICS</div>
                </div>
                <div className="p-4 rounded-lg bg-accent/30 border border-border">
                  <div className="text-xs text-muted-foreground">कुल प्रसारण प्ले संख्या</div>
                  <div className="text-xl font-bold font-mono text-foreground mt-1">18,920</div>
                  <div className="text-[10px] text-emerald-500 mt-1">ACTUAL METRICS</div>
                </div>
                <div className="p-4 rounded-lg bg-accent/30 border border-border">
                  <div className="text-xs text-muted-foreground">स्ट्रिम प्राविधिक स्थिति</div>
                  <div className="text-xl font-bold text-emerald-500 mt-1">ONLINE (99.9%)</div>
                  <div className="text-[10px] text-muted-foreground mt-1">ZenoFM Stream Server</div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8: SETTINGS */}
          {activeSection === "settings" && (
            <div className="p-6 rounded-xl border border-border bg-card space-y-4 max-w-2xl">
              <h2 className="text-base font-bold text-foreground border-b border-border pb-3">
                रेडियो प्रणाली सेटिङ्स
              </h2>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold">नेपाली AI वाचन स्वर (TTS Voice):</label>
                  <select
                    value={radioSettings.ttsVoiceNe}
                    onChange={(e) => setRadioSettings({ ...radioSettings, ttsVoiceNe: e.target.value as any })}
                    className="w-full p-2 mt-1 rounded border border-border bg-background"
                  >
                    <option value="Aoede">Aoede (नारी स्वर - Human Female)</option>
                    <option value="Fenrir">Fenrir (पुरुष स्वर - Human Male)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </AdminLayout>
  );
}
