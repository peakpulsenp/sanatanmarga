import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/src/components/layout/Header";
import SEOHead from "@/src/components/common/SEOHead";
import Footer from "@/src/components/layout/Footer";
import { useTenant } from "@/src/lib/tenantContext";
import { useAuth } from "@/src/lib/auth";
import { useLanguage } from "@/src/context/LanguageContext";
import { formatDate } from "@/src/lib/utils";
import PersonalizedNepalHubBanner, { useNepalPreferences } from "../components/nepal/PersonalizedNepalHub";
import { MyNepalCockpit } from "@/src/components/nepal/MyNepalCockpit";
import NationalSituationRoom from "@/src/components/nepal/NationalSituationRoom";
import { NepalPanchangService, PanchangData } from "../services/nepalPanchangService";
import { NepalDistrictService, DistrictRecord } from "../services/nepalDistrictService";
import { audioPlaybackManager, AudioState } from "../services/audioPlaybackManager";
import { 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Sun, 
  MapPin, 
  Volume2, 
  Sparkles, 
  Radio, 
  Compass, 
  ExternalLink,
  ShieldCheck,
  Building2,
  PhoneCall,
  Music,
  Upload,
  Pause,
  Play,
  Trash2
} from "lucide-react";
import { collection, query, where, getDocs, doc, safeOnSnapshot as onSnapshot, addDoc, deleteDoc } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { toast } from "sonner";

export default function NepalHubPage() {
  const { activeTenant } = useTenant();
  const { preferences, setPreferences } = useNepalPreferences();
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const role = user?.role || "guest";
  const isAdmin = Boolean(user && ["super_admin", "admin"].includes(role));

  // Selected District state (Synced with Preferences & 77 Districts OS)
  const [selectedDistrict, setSelectedDistrict] = useState(preferences.district || "Kathmandu");

  useEffect(() => {
    if (preferences.district) {
      setSelectedDistrict(preferences.district);
    }
  }, [preferences.district]);

  // Panchang State (from NepalPanchangService)
  const [panchang, setPanchang] = useState<PanchangData | null>(null);

  // District Intelligence State (from NepalDistrictService)
  const allDistricts = NepalDistrictService.getAllDistricts();
  const currentDistrictRecord = NepalDistrictService.getDistrict(selectedDistrict);

  useEffect(() => {
    // Load Panchang for selected district
    const pData = NepalPanchangService.getPanchangForDistrict(selectedDistrict);
    setPanchang(pData);
  }, [selectedDistrict]);

  // Connected Events State
  const [hubEvents, setHubEvents] = useState<any[]>([]);
  const [eventFilterCategory, setEventFilterCategory] = useState<string>("all");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, "events"), where("status", "==", "published"));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setHubEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } else {
          setHubEvents([
            {
              id: "pashupati-shivaratri-2083",
              title: "महाशिवरात्रि तथा पशुपतिनाथ विशेष महामहोत्सव २०८३",
              tagline: "विश्वभरका १० लाख भन्दा बढी सनातन धर्मावलम्बीहरूको पशुपति क्षेत्रमा आगमन एवं प्रत्यक्ष दर्शन",
              date: "२०८३ फागुन २५ (2083 Phalgun 25)",
              location: "पशुपतिनाथ परिसर",
              district: "Kathmandu",
              province: "Bagmati",
              featuredImage: "https://images.unsplash.com/photo-1609137144869-37367123d57f?q=80&w=2070&auto=format&fit=crop",
              nepalHubCategory: "festivals",
              isLiveOnNepalHub: true,
              knowledgeEntities: ["pashupatinath", "rigveda", "काठमाडौँ उपत्यका"]
            }
          ]);
        }
      } catch (e) {
        setHubEvents([]);
      }
    };
    fetchEvents();
  }, []);

  // Vedic Audio Hub State
  const [audios, setAudios] = useState<any[]>([
    { id: "gayatri", title: "गायत्री मन्त्र (Gayatri Mantra)", duration: "११ मिनेट", category: "बिहानी ध्यान", audioUrl: "https://actions.google.com/sounds/v1/ambiences/morning_birds.ogg", sourceType: "REMOTE_CDN" },
    { id: "rudram", title: "श्री रुद्रम् पाठ (Sri Rudram Chanting)", duration: "२४ मिनेट", category: "वैदिक पाठ", audioUrl: "https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg", sourceType: "REMOTE_CDN" },
    { id: "briefing-1", title: "दैनिक सनातन अडियो ब्रिफिङ (Daily Sanatan Bulletin)", duration: "०८ मिनेट", category: "ब्रीफिङ", audioUrl: "https://actions.google.com/sounds/v1/ambiences/morning_birds.ogg", sourceType: "REMOTE_CDN" }
  ]);

  // Admin Audio Upload
  const [audioTitle, setAudioTitle] = useState("");
  const [audioCategory, setAudioCategory] = useState("स्तोत्रम्");
  const [audioDuration, setAudioDuration] = useState("०५ मिनेट");
  const [audioUrl, setAudioUrl] = useState("");
  const [isSavingAudio, setIsSavingAudio] = useState(false);
  const [editingAudioId, setEditingAudioId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editUrl, setEditUrl] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    try {
      const unsub = onSnapshot(collection(db, "nepalAudios"), (snap) => {
        if (!snap.empty) {
          setAudios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      });
      return () => unsub();
    } catch (e) {}
  }, [isAdmin]);

  // Global Audio Playback Manager Subscriptions
  const [audioState, setAudioState] = useState<AudioState>("IDLE");
  const [currentTrack, setCurrentTrack] = useState<any | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);

  useEffect(() => {
    const unsub = audioPlaybackManager.subscribe((state, track, time, dur) => {
      setAudioState(state);
      setCurrentTrack(track);
      if (dur > 0) {
        setAudioProgress((time / dur) * 100);
      } else {
        setAudioProgress(0);
      }
    });
    return () => unsub();
  }, []);

  const handlePlayTrack = async (track: any) => {
    try {
      await audioPlaybackManager.playTrack({
        id: track.id,
        title: track.title,
        sourceUrl: track.audioUrl,
        sourceType: track.sourceType || "REMOTE_CDN",
        isLiveStream: track.isLiveStream || false
      });
      toast.success(`प्ले हुँदैछ: ${track.title}`);
    } catch (e: any) {
      if (e?.name === "NotAllowedError") {
        toast.error("अटोप्ले प्रतिबन्धित छ। कृपया प्ले बटन फेरि थिच्नुहोस्।");
      } else {
        toast.error("अडियो प्ले गर्न सकिएन");
      }
    }
  };

  const handleSaveAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioTitle || !audioUrl) {
      toast.error("कृपया शीर्षक र अडियो लिङ्क भर्नुहोस्!");
      return;
    }
    setIsSavingAudio(true);
    try {
      const data = {
        title: audioTitle,
        category: audioCategory,
        duration: audioDuration || "०५ मिनेट",
        audioUrl: audioUrl,
        sourceType: "REMOTE_CDN",
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, "nepalAudios"), data);
      setAudios(prev => [{ id: docRef.id, ...data }, ...prev]);
      setAudioTitle("");
      setAudioUrl("");
      toast.success("वैदिक अडियो सफलतापूर्वक थपियो!");
    } catch (e) {
      toast.error("अडियो सेभ गर्न असफल भयो।");
    } finally {
      setIsSavingAudio(false);
    }
  };

  const handleDeleteAudio = async (id: string) => {
    if (!confirm("के तपाईं यो अडियो हटाउन चाहनुहुन्छ?")) return;
    try {
      await deleteDoc(doc(db, "nepalAudios", id));
      setAudios(prev => prev.filter(a => a.id !== id));
      toast.success("अडियो हटाइयो!");
    } catch (e) {
      toast.error("हटाउन असफल।");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors">
      <SEOHead
        title={language === 'en' ? "Nepal Hub OS - Panchang, Market Rates, 77 Districts & Vedic Audio" : "नेपाल हब (Nepal Hub OS) - पञ्चाङ्ग, बजार मूल्य, ७७ जिल्ला र वैदिक अडियो"}
        description={language === 'en' ? "Authoritative Nepal intelligence network with verified market pulse, district weather, and live streams." : "प्रमाणित बजार मूल्य, पञ्चाङ्ग, जिल्ला विशेष सूचना तथा लाइभ स्ट्रिमसहितको नेपाल डिजिटल हब।"}
        url="/nepal-hub"
      />
      <Header />

      <main className="flex-1 py-8 px-4 max-w-7xl mx-auto w-full space-y-8">
        
        {/* MY NEPAL PERSONALIZED INTELLIGENCE COCKPIT */}
        <MyNepalCockpit 
          onSelectDistrict={(id) => {
            setSelectedDistrict(id);
            setPreferences({ ...preferences, district: id });
          }}
          onOpenAdmin={() => window.location.href = "/admin/nepal-hub"}
        />

        {/* PERSONALIZATION BANNER */}
        <PersonalizedNepalHubBanner preferences={preferences} setPreferences={setPreferences} />

        {/* HERO BANNER */}
        <div className="bg-gradient-to-r from-red-600/10 via-amber-500/10 to-primary/10 border border-border-theme p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 bg-card border border-border-theme px-3 py-1 rounded-full text-xs font-black text-primary uppercase tracking-wider">
              <Sparkles size={14} className="text-amber-500" />
              <span>{language === 'en' ? "Sanatan Nepal & Regional Intelligence OS" : "सनातन नेपाल तथा क्षेत्रीय इन्टेलिजेन्स ओ.एस."}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-foreground">
              {language === 'en' ? "Nepal Digital Information, Panchang & Cultural Dashboard" : "नेपाल डिजिटल सूचना, पञ्चाङ्ग एवं सांस्कृतिक ड्यासबोर्ड"}
            </h1>
            <p className="text-sm text-muted-text max-w-2xl font-medium">
              {language === 'en' 
                ? "Authoritative real-time market rates, location-aware Panchang calendar, and 77-district intelligence powered by verified OS services."
                : "प्रमाणित सेवामार्फत सञ्चालित वास्तविक बजार मूल्य, पञ्चाङ्ग पात्रो तथा ७७ जिल्ला विशेष सूचना सञ्जाल।"}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/nepal-hub/live"
              className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all"
            >
              <Radio size={16} className="animate-pulse" />
              <span>{language === 'en' ? "Nepal Live Stream OS" : "नेपाल लाइभ स्ट्रिम"}</span>
            </Link>
          </div>
        </div>

        {/* SECTION 1: UNIFIED NATIONAL SITUATION ROOM OS */}
        <NationalSituationRoom 
          selectedDistrict={selectedDistrict}
          onDistrictSelect={(dist) => {
            setSelectedDistrict(dist);
            setPreferences({ ...preferences, district: dist });
          }}
        />

        {/* SECTION 2: PANCHANG & ASTRONOMICAL OS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border-theme rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border-theme pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">
                    {language === 'en' ? "Bikram Sambat Panchang & Ephemeris" : "विक्रम सम्वत् पञ्चाङ्ग तथा खगोलीय स्थिति"}
                  </h2>
                  <p className="text-xs text-muted-text font-bold">
                    {language === 'en' ? `Location: ${panchang?.location || selectedDistrict} | Source: ${panchang?.source || 'Ephemeris Engine'}` : `स्थान: ${panchang?.location || selectedDistrict} | स्रोत: सनातन पञ्चाङ्ग प्रणाली`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-black bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>● {language === 'en' ? "Live Ephemeris" : "सटीक पञ्चाङ्ग"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-muted-area/60 border border-border-theme p-4 rounded-2xl text-center space-y-1">
                <div className="text-xs text-muted-text font-bold">{language === 'en' ? "Date (BS)" : "मिति (वि.सं.)"}</div>
                <div className="text-xs font-black text-foreground">{panchang?.dateBS || "२०८३ फागुन १२"}</div>
              </div>

              <div className="bg-muted-area/60 border border-border-theme p-4 rounded-2xl text-center space-y-1">
                <div className="text-xs text-muted-text font-bold">{language === 'en' ? "Tithi / Paksha" : "तिथि / पक्ष"}</div>
                <div className="text-xs font-black text-foreground">{panchang?.tithi || "चतुर्दशी"}</div>
              </div>

              <div className="bg-muted-area/60 border border-border-theme p-4 rounded-2xl text-center space-y-1">
                <div className="text-xs text-muted-text font-bold">{language === 'en' ? "Nakshatra" : "नक्षत्र"}</div>
                <div className="text-xs font-black text-foreground">{panchang?.nakshatra || "पुष्य"}</div>
              </div>

              <div className="bg-muted-area/60 border border-border-theme p-4 rounded-2xl text-center space-y-1">
                <div className="text-xs text-muted-text font-bold">{language === 'en' ? "Yoga" : "योग"}</div>
                <div className="text-xs font-black text-foreground">{panchang?.yoga || "सिद्धि"}</div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-xs font-black text-primary uppercase">
                  {language === 'en' ? "Sunrise & Sunset Timings" : "सूर्योदय तथा सूर्यास्त समय"}
                </div>
                <div className="text-sm font-black text-foreground">
                  {language === 'en' ? `Sunrise: ${panchang?.sunrise} | Sunset: ${panchang?.sunset}` : `सूर्योदय: ${panchang?.sunrise} | सूर्यास्त: ${panchang?.sunset}`}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-muted-text">
                <Sun size={14} className="text-amber-500" />
                <span>{panchang?.weekday || "मंगलबार"}</span>
              </div>
            </div>
          </div>

          {/* AI AUDIO BRIEFING CARD */}
          <div className="bg-gradient-to-br from-primary/10 via-card to-card border border-border-theme rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-black uppercase">
                  {language === 'en' ? "AI Audio Briefing OS" : "एआई अडियो ब्रिफिङ"}
                </span>
                <Radio size={18} className="text-primary animate-pulse" />
              </div>

              <h3 className="text-xl font-black text-foreground">
                {language === 'en' ? "Daily Sanatan Intelligence Briefing" : "दैनिक सनातन इन्टेलिजेन्स बुलेटिन"}
              </h3>

              <div className="space-y-2 text-xs font-medium text-muted-text">
                <div className="flex items-start gap-2 bg-card/60 p-2.5 rounded-xl border border-border-theme">
                  <span className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0"></span>
                  <span>{language === 'en' ? "Verified market pulse rates for gold, silver and foreign exchange." : "सुन, चाँदी तथा विदेशी मुद्राको प्रमाणित बजार मूल्य।"}</span>
                </div>
                <div className="flex items-start gap-2 bg-card/60 p-2.5 rounded-xl border border-border-theme">
                  <span className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0"></span>
                  <span>{language === 'en' ? "District specific weather and agricultural alerts." : "जिल्ला विशेष मौसम तथा कृषि अपडेट।"}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handlePlayTrack({
                id: "ai-briefing-daily",
                title: language === 'en' ? "Daily Sanatan Audio Briefing" : "दैनिक सनातन अडियो ब्रिफिङ",
                audioUrl: "https://actions.google.com/sounds/v1/ambiences/morning_birds.ogg",
                sourceType: "REMOTE_CDN"
              })}
              className="w-full py-3 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all cursor-pointer"
            >
              <Volume2 size={16} />
              <span>{language === 'en' ? "Play Daily Audio Briefing" : "दैनिक अडियो ब्रिफिङ सुन्नुहोस्"}</span>
            </button>
          </div>
        </div>

        {/* SECTION 3: 77 DISTRICTS INTELLIGENCE */}
        <div className="bg-card border border-border-theme rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border-theme pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-black">
                <MapPin size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">
                  {language === 'en' ? "77 Districts Intelligence Network" : "७७ जिल्ला विशेष सूचना तथा समाचार सञ्जाल"}
                </h2>
                <p className="text-xs text-muted-text font-bold">
                  {language === 'en' ? "Select any district in Nepal for real-time weather, notices, and heritage." : "नेपालका ७७ वटै जिल्लाका स्थानीय मौसम, सूचना तथा मन्दिरहरू हेर्नुहोस्।"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-text">{language === 'en' ? "District:" : "जिल्ला:"}</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="px-4 py-2 rounded-xl bg-muted-area border border-border-theme text-xs font-black text-foreground focus:outline-none"
              >
                {allDistricts.map(d => (
                  <option key={d.id} value={d.nameEn}>
                    {language === 'en' ? d.nameEn : d.nameNe} ({d.provinceNe})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-muted-area/60 border border-border-theme p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-primary uppercase">{language === 'en' ? "Local Weather" : "स्थानीय मौसम"}</span>
                <span className="text-xs font-black text-amber-500">{currentDistrictRecord.temperature}</span>
              </div>
              <div className="text-sm font-black text-foreground">{currentDistrictRecord.weather}</div>
              <div className="text-[11px] text-muted-text font-bold">{currentDistrictRecord.headquarters} (Headquarters)</div>
            </div>

            <div className="bg-muted-area/60 border border-border-theme p-5 rounded-2xl space-y-3">
              <span className="text-xs font-black text-primary uppercase">{language === 'en' ? "Major Local News" : "प्रमुख स्थानीय समाचार"}</span>
              <div className="text-xs font-bold text-foreground leading-relaxed">{currentDistrictRecord.newsSummary}</div>
              <div className="text-[11px] text-muted-text font-bold">{currentDistrictRecord.localNotice}</div>
            </div>

            <div className="bg-muted-area/60 border border-border-theme p-5 rounded-2xl space-y-3">
              <span className="text-xs font-black text-primary uppercase">{language === 'en' ? "Key Temples & Heritage Sites" : "प्रमुख मन्दिरहरू / तीर्थस्थल"}</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentDistrictRecord.temples.map((t, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-card text-xs font-bold border border-border-theme text-foreground">
                    🛕 {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: VEDIC AUDIO & MANTRA HUB */}
        <div className="bg-card border border-border-theme rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border-theme pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                <Music size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">
                  {language === 'en' ? "Vedic Audio & Mantra Hub" : "वैदिक ध्वनी, मन्त्र तथा स्तोत्र सङ्ग्रह"}
                </h2>
                <p className="text-xs text-muted-text font-bold">
                  {language === 'en' ? "Powered by AudioPlaybackManager" : "वैश्विक अडियो प्लेयरमार्फत सञ्चालित"}
                </p>
              </div>
            </div>
          </div>

          {isAdmin && (
            <form onSubmit={handleSaveAudio} className="bg-muted-area/60 border border-border-theme p-5 rounded-2xl space-y-4">
              <div className="text-sm font-black text-foreground flex items-center gap-2">
                <Upload size={16} className="text-primary" />
                <span>{language === 'en' ? "Add New Vedic Audio" : "नयाँ वैदिक अडियो थप्नुहोस्"}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Title"
                  value={audioTitle}
                  onChange={(e) => setAudioTitle(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-card border border-border-theme text-xs font-bold text-foreground"
                />
                <select
                  value={audioCategory}
                  onChange={(e) => setAudioCategory(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-card border border-border-theme text-xs font-bold text-foreground"
                >
                  <option value="स्तोत्रम्">स्तोत्रम्</option>
                  <option value="वैदिक पाठ">वैदिक पाठ</option>
                  <option value="बिहानी ध्यान">बिहानी ध्यान</option>
                </select>
                <input
                  type="text"
                  placeholder="Audio MP3 URL"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-card border border-border-theme text-xs font-bold text-foreground sm:col-span-2"
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-black shadow-md">
                  {language === 'en' ? "Save Audio" : "सुरक्षित गर्नुहोस्"}
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {audios.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const isPlaying = isCurrent && audioState === "PLAYING";

              return (
                <div key={track.id} className="bg-muted-area/50 border border-border-theme p-4 rounded-2xl flex items-center justify-between gap-3">
                  <div className="space-y-1 overflow-hidden">
                    <div className="text-xs font-black text-primary">{track.category}</div>
                    <div className="text-sm font-bold text-foreground truncate">{track.title}</div>
                    <div className="text-[11px] text-muted-text font-bold">{track.duration}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handlePlayTrack(track)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-all ${
                        isPlaying ? "bg-amber-500 text-white animate-pulse" : "bg-primary text-white hover:bg-primary/90"
                      }`}
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteAudio(track.id)}
                        className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
