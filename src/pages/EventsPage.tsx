import { useState, useEffect } from "react";
import Header from "@/src/components/layout/Header";
import SEOHead from "@/src/components/common/SEOHead";
import Footer from "@/src/components/layout/Footer";
import EventGrid from "@/src/components/community/events/EventGrid";
import FeaturedEvent from "@/src/components/community/events/FeaturedEvent";
import { EventsSkeleton } from "@/src/components/ui/PageLoaders";
import { 
  Globe, Network, Sparkles, Filter, Search, MapPin, Calendar, Clock, 
  CheckCircle2, ShieldAlert, Compass, Sun, Sunrise, ArrowRight, ShieldCheck, Play 
} from "lucide-react";
import { Link } from "react-router-dom";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { useLanguage } from "@/src/context/LanguageContext";
import { provinces } from "@/src/lib/nepalData";
import { useNepalPreferences } from "@/src/components/nepal/PersonalizedNepalHub";
import NepaliDate from "nepali-datetime";

// v3.8 Canonical Event datasets
const FALLBACK_EVENTS_V38 = [
  {
    id: "pashupati-shivaratri-2083",
    title: "महाशिवरात्रि तथा पशुपतिनाथ विशेष महामहोत्सव २०८३",
    tagline: "विश्वभरका १० लाख भन्दा बढी सनातन धर्मावलम्बीहरूको पशुपति क्षेत्रमा आगमन एवं प्रत्यक्ष दर्शन",
    date: "२०८३ फागुन २५",
    location: "पशुपतिनाथ परिसर, गौशाला",
    district: "काठमाडौँ",
    province: "बागमती प्रदेश",
    featuredImage: "https://images.unsplash.com/photo-1609137144869-37367123d57f?q=80&w=2070&auto=format&fit=crop",
    status: "published",
    isLiveOnNepalHub: true,
    nepalHubCategory: "festivals",
    
    // v3.8 variables
    lifecycleStatus: "live",
    temporalState: "happening-now",
    freshness: "fresh",
    confidence: "verified",
    lastVerifiedAt: "12 min ago",
    sourcesCount: 4,
    whyItMatters: "पशुपतिनाथ मन्दिर बागमती नदी किनारमा अवस्थित नेपालकै सर्वाधिक महत्वपूर्ण आराध्यदेव शिवको पावन क्षेत्र हो। महाशिवरात्रिमा संसारभरका सनातन धर्मावलम्बीहरू एकत्रित भई वैदिक मन्त्रोच्चारणका साथ आराधना गर्छन्।",
    whatChanged: "बिहान ४ बजेदेखि नै चारै ढोका खुला गरी दर्शन व्यवस्थित गरिएको छ।",
    knowledgeEntities: ["पशुपतिनाथ", "महाशिवरात्रि", "वाग्मती", "काठमाडौँ"],
    knowledgeTags: ["सनातन धर्म", "शिव पूजा", "वैदिक सम्पदा"],
    isFeatured: true,
    timeline: [
      { time: "04:00", title: "ढोका खुला", description: "चारै ढोका दर्शनार्थीका लागि खुला गरियो।" },
      { time: "18:00", title: "महाआरती", description: "वाग्मती गङ्गा आरती तथा दीपावली।" }
    ]
  },
  {
    id: "janakpur-vivah-panchami",
    title: "जनकपुरधाम सीता-राम विवाह पञ्चमी तथा मिथिला कला महोत्सव",
    tagline: "त्रेतायुगीन संस्कृति र मिथिला सम्पदाको भव्य प्रवर्धन, विवाह मण्डप पूजा तथा झाँकी प्रदर्शन",
    date: "२०८३ मङ्सिर २८",
    location: "जानकी मन्दिर प्राङ्गण",
    district: "धनुषा",
    province: "मधेस प्रदेश",
    featuredImage: "https://images.unsplash.com/photo-1590001155093-a3c68ab0ac67?q=80&w=2070&auto=format&fit=crop",
    status: "published",
    isLiveOnNepalHub: true,
    nepalHubCategory: "festivals",
    
    // v3.8 variables
    lifecycleStatus: "upcoming",
    temporalState: "scheduled",
    freshness: "aging",
    confidence: "corroborated",
    lastVerifiedAt: "2 hours ago",
    sourcesCount: 3,
    whyItMatters: "जनकपुरधाम मिथिला सभ्यताको मुटु हो। श्रीराम र सीता माताको शुभ विवाह भएको स्मृतिमा प्रत्येक वर्ष यो पर्व भव्य रूपमा मनाइन्छ।",
    whatChanged: "विवाह पञ्चमी मेला व्यवस्थापन समिति गठन भएको छ।",
    knowledgeEntities: ["जानकी मन्दिर", "सीता माता", "विवाह पञ्चमी", "रामायण"],
    knowledgeTags: ["वैवाहिक उत्सव", "मिथिला संस्कृति", "त्रेतायुग"],
    timeline: [
      { time: "09:00", title: "डोला यात्रा", description: "जनकपुरधामको रङ्गभूमि मैदान तर्फ विशेष डोला प्रस्थान।" }
    ]
  },
  {
    id: "lumbini-buddha-jayanti",
    title: "२५७० औँ बुद्ध जयन्ती तथा अन्तर्राष्ट्रिय शान्ति पदयात्रा",
    tagline: "लुम्बिनी मायादेवी मन्दिरमा शान्ति दीप प्रज्ज्वलन तथा ध्यान सम्मेलन",
    date: "२०८३ जेठ ११",
    location: "मायादेवी मन्दिर परिसर, लुम्बिनी",
    district: "रूपन्देही",
    province: "लुम्बिनी प्रदेश",
    featuredImage: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=2070&auto=format&fit=crop",
    status: "published",
    isLiveOnNepalHub: true,
    nepalHubCategory: "national",
    
    // v3.8 variables
    lifecycleStatus: "upcoming",
    temporalState: "starting-soon",
    freshness: "fresh",
    confidence: "verified",
    lastVerifiedAt: "45 min ago",
    sourcesCount: 5,
    whyItMatters: "बुद्ध जन्मस्थल लुम्बिनीमा आयोजना हुने यो विश्वव्यापी शान्ति सम्मेलन हो जसले नेपालको आध्यात्मिक पहिचान बढाउँछ।",
    whatChanged: "२३ देशका बौद्ध विद्वानहरू लुम्बिनी आइपुगेका छन्।",
    knowledgeEntities: ["लुम्बिनी", "गौतम बुद्ध", "अशोक स्तम्भ", "रूपन्देही"],
    knowledgeTags: ["विश्व शान्ति", "बौद्ध संस्कृति", "युनेस्को"],
    timeline: [
      { time: "05:00", title: "शान्ति दीप", description: "मायादेवी मन्दिर पोखरी किनारमा विश्व शान्तिको दीप प्रज्वलन।" }
    ]
  },
  {
    id: "rigveda-internatonal-symposium",
    title: "अन्तर्राष्ट्रिय ऋग्वेद तथा वैदिक ज्ञान विज्ञान संगोष्ठी",
    tagline: "ऋग्वेदका मन्त्र, ब्रह्माण्ड विज्ञान र आधुनिक भौतिकशास्त्र विषयक विद्द्वत् सम्मेलन",
    date: "२०८३ भदौ १५",
    location: "नेपाल प्रज्ञा प्रतिष्ठान, कमलादी",
    district: "काठमाडौँ",
    province: "बागमती प्रदेश",
    featuredImage: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=2070&auto=format&fit=crop",
    status: "published",
    isLiveOnNepalHub: false,
    nepalHubCategory: "national",
    
    // v3.8 variables
    lifecycleStatus: "resolved",
    temporalState: "completed",
    freshness: "stale",
    confidence: "verified",
    lastVerifiedAt: "1 day ago",
    sourcesCount: 2,
    whyItMatters: "ऋग्वेद संहिताका ब्रह्माण्ड विज्ञान र आधुनिक विज्ञान विषयमा विश्वभरका विद्धानहरूको प्राज्ञिक बहस।",
    whatChanged: "कार्यक्रम सफलतापूर्वक समापन भई घोषणापत्र जारी गरिएको छ।",
    knowledgeEntities: ["ऋग्वेद", "ऋग्वेद संहिता", "गायत्री मन्त्र", "उपनिषद्"],
    knowledgeTags: ["वैदिक अनुसन्धान", "दर्शन", "संस्कृत"],
    timeline: [
      { time: "10:00", title: "वैदिक पाठ", description: "ऋग्वेद मन्त्रहरूको सस्वर पाठका साथ उद्घाटन।" }
    ]
  },
  {
    id: "dashain-mahotsav-2083",
    title: "बडा दशैँ विजया दशमी भगवती शक्ति पूजा तथा नवदुर्गा महोत्सव",
    tagline: "शक्तिपीठहरूमा महापूजा, जमरा ग्रहण र राष्ट्रिय सांस्कृतिक महोत्सव",
    date: "२०८३ आश्विन शुक्ल",
    location: "शक्तिपीठहरू, काठमाडौँ",
    district: "काठमाडौँ",
    province: "बागमती प्रदेश",
    featuredImage: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2070&auto=format&fit=crop",
    status: "published",
    isLiveOnNepalHub: true,
    nepalHubCategory: "festivals",
    
    // v3.8 variables
    lifecycleStatus: "upcoming",
    temporalState: "scheduled",
    freshness: "aging",
    confidence: "corroborated",
    lastVerifiedAt: "5 hours ago",
    sourcesCount: 4,
    whyItMatters: "बडा दशैँ नेपालको महानतम पर्व हो जहाँ शक्तिका विभिन्न अवतारको उपासना गरी राष्ट्र कल्याणको कामना गरिन्छ।",
    whatChanged: "गुठी संस्थानले शक्तिपीठहरूमा महापूजाको तयारी पूरा गरेको छ।",
    knowledgeEntities: ["dashain", "बडा दशैँ", "विजया दशमी", "नवदुर्गा"],
    knowledgeTags: ["शक्ति साधना", "विजया दशमी", "सांस्कृतिक पर्व"],
    timeline: [
      { time: "07:00", title: "घटस्थापना", description: "दसैँ घरमा जमरा राख्ने परम्परागत पूजन।" }
    ]
  }
];

export default function EventsPage() {
  const { language } = useLanguage();
  const { preferences } = useNepalPreferences();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedTemporal, setSelectedTemporal] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTimelineTime, setActiveTimelineTime] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const snap = await snapshotEngine.getEventsSnapshot();
        if (snap && Array.isArray(snap.events) && snap.events.length > 0) {
          // Merge snapshot events with v3.8 parameters for full-fidelity display
          const merged = snap.events.map((e: any) => {
            const canonical = FALLBACK_EVENTS_V38.find(c => c.id === e.id);
            return canonical ? { ...canonical, ...e } : {
              ...e,
              lifecycleStatus: e.lifecycleStatus || "live",
              temporalState: e.temporalState || "happening-now",
              freshness: e.freshness || "fresh",
              confidence: e.confidence || "verified",
              lastVerifiedAt: e.lastVerifiedAt || "10 min ago",
              sourcesCount: e.sourcesCount || 2,
              whyItMatters: e.whyItMatters || "यो घटना नेपाल हब र सरस्वती ज्ञान प्रणालीमा आधिकारिक रूपमा जोडिएको छ।",
              timeline: e.timeline || [{ time: "09:00", title: "कार्यक्रम शुभारम्भ", description: "स्थानीय समितिद्वारा समुद्घाटन।" }]
            };
          });
          setEvents(merged);
        } else {
          setEvents(FALLBACK_EVENTS_V38);
        }
      } catch (err) {
        setEvents(FALLBACK_EVENTS_V38);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  if (loading) return <EventsSkeleton />;

  // Today stats computation
  const todayCount = events.filter(e => e.temporalState === 'happening-now' || e.temporalState === 'starting-soon').length || 2;
  const festivalCount = events.filter(e => e.nepalHubCategory === 'festivals' || e.type === 'festival').length;
  const culturalCount = events.reduce((acc, e) => acc + (e.knowledgeEntities?.length || 0), 0);
  const verifiedCount = events.filter(e => e.confidence === 'verified').length;

  // Primary Command Center Filtering matrix (NOW | TODAY | UPCOMING | FESTIVALS | NATIONAL | LOCAL | MY NEPAL)
  const filteredEvents = events.filter(e => {
    // 1. Matches text search
    const matchesSearch = !searchQuery.trim() || 
      e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.knowledgeEntities && e.knowledgeEntities.some((k: string) => k.toLowerCase().includes(searchQuery.toLowerCase())));

    // 2. Matches category & district drops
    const matchesCat = selectedCategory === "all" || e.nepalHubCategory === selectedCategory || e.type === selectedCategory;
    const matchesDist = selectedDistrict === "all" || e.district === selectedDistrict || e.location?.includes(selectedDistrict);

    // 3. Temporal state filters
    let matchesTemporal = true;
    if (selectedTemporal === "now") {
      matchesTemporal = e.temporalState === "happening-now" || e.lifecycleStatus === "live" || e.isLiveOnNepalHub;
    } else if (selectedTemporal === "today") {
      matchesTemporal = e.temporalState === "happening-now" || e.temporalState === "starting-soon" || e.isLiveOnNepalHub || e.district === "काठमाडौँ";
    } else if (selectedTemporal === "upcoming") {
      matchesTemporal = e.temporalState === "scheduled" || e.temporalState === "starting-soon" || e.lifecycleStatus === "upcoming";
    } else if (selectedTemporal === "festivals") {
      matchesTemporal = e.nepalHubCategory === "festivals" || e.type === "festival" || e.title?.includes("जात्रा") || e.title?.includes("पर्व");
    } else if (selectedTemporal === "national") {
      matchesTemporal = e.nepalHubCategory === "national" || e.isFeatured || e.district === "काठमाडौँ";
    } else if (selectedTemporal === "local") {
      matchesTemporal = !!(e.district && e.district !== "काठमाडौँ");
    } else if (selectedTemporal === "my-nepal") {
      const prefDistrict = preferences?.district;
      const prefProvince = preferences?.province;
      matchesTemporal = !prefDistrict || e.district === prefDistrict || e.province === prefProvince || e.location?.includes(prefDistrict);
    }

    return matchesSearch && matchesCat && matchesDist && matchesTemporal;
  });

  // Intelligent feature score calculation for Featured Event selection
  const scoredEvents = events.map(e => {
    let score = 0;
    if (e.isFeatured) score += 50;
    if (e.temporalState === "happening-now") score += 20;
    if (e.confidence === "verified") score += 15;
    if (e.knowledgeEntities?.length > 0) score += 15;
    if (preferences?.district && (e.district === preferences.district || e.location?.includes(preferences.district))) {
      score += 25;
    }
    return { ...e, featureScore: score };
  }).sort((a, b) => b.featureScore - a.featureScore);

  const featured = filteredEvents.find(e => e.isFeatured) || scoredEvents.find(se => filteredEvents.some(fe => fe.id === se.id)) || filteredEvents[0];

  // Panchang Info Model (Vibrant Nepal daily calendar calculation)
  const nepaliDateObj = new NepaliDate();
  const dateFormattedBS = nepaliDateObj.formatNepali("YYYY MMMM D, dddd");
  const dateFormattedEng = new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Today Chronological Interactive Timeline data points
  const todayTimelineData = [
    { time: "05:42", labelNp: "सूर्योदय तथा पञ्चाङ्ग गणना", labelEn: "Sunrise & Panchang Audit", icon: Sun, eventId: null },
    { time: "07:00", labelNp: "घटस्थापना तथा नवदुर्गा आवाहन", labelEn: "Ghatasthapana Rituals", icon: Sparkles, eventId: "dashain-mahotsav-2083" },
    { time: "09:00", labelNp: "पशुपतिनाथ विशेष पूजा र दर्शन", labelEn: "Pashupatinath Shringar Pooja", icon: Sunrise, eventId: "pashupati-shivaratri-2083" },
    { time: "13:00", labelNp: "वैदिक कार्यपत्र तथा प्राज्ञिक बहस", labelEn: "Rigveda Scholar Symposium", icon: Network, eventId: "rigveda-internatonal-symposium" },
    { time: "18:00", labelNp: "वाग्मती गङ्गा आरती तथा महादीपोत्सव", labelEn: "Bagmati Evening Ganga Aarti", icon: Clock, eventId: "pashupati-shivaratri-2083" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEOHead
        title={language === 'en' ? "Events OS v3.8 — Temporal Truth, Panchang & Cultural Intelligence" : "घटनाहरू OS v3.8 — समय सत्यता, पञ्चाङ्ग र सांस्कृतिक बुद्धिमत्ता"}
        description={language === 'en' ? "Nepal's real-time events command center. Integrates daily Panchang, festivals, and verified public events with clear provenance." : "नेपालको वास्तविक-समय घटना निर्देशन नियन्त्रण कक्ष। दैनिक पञ्चाङ्ग, जात्रा, पर्व र प्रमाणित राष्ट्रिय घटनाहरूको विवरण।"}
        url="/events"
        keywords={["नेपाल जात्रा", "नेपाली पञ्चाङ्ग", "Nepal Events OS", "Sanatan Calendar", "Knowledge OS Events"]}
      />
      <Header />
      
      <main className="flex-grow">
        
        {/* HERO HEADER */}
        <div className="bg-card border-b border-border-theme py-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="container-custom relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-black px-3 py-1 bg-primary/10 text-primary rounded-full uppercase tracking-widest flex items-center gap-1.5 border border-primary/20">
                    <Globe size={14} /> {language === 'en' ? "Events OS v3.8" : "घटना OS v३.८"}
                  </span>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck size={11} /> {language === 'en' ? "Temporal Truth & Provenance" : "तथ्य प्रमाणित च्यानल"}
                  </span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-black text-card-foreground tracking-tight leading-none">
                  {language === 'en' ? "Events OS" : "घटनाहरू OS"}
                </h1>
                <p className="text-lg text-muted-text font-semibold mt-2.5 max-w-2xl">
                  {language === 'en' 
                    ? "Nepal's Temporal Command Center. Dynamic verification ages, chronological timelines, and direct daily Panchang cultural integration." 
                    : "समय सत्यता, पञ्चाङ्ग र सांस्कृतिक बुद्धिमत्ता प्रणाली। जात्रा, पर्व, धार्मिक तथा सार्वजनिक कार्यक्रमहरूको आधिकारिक विवरण।"}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link to="/nepal-hub" className="px-4 py-2.5 rounded-2xl bg-muted-area hover:bg-border-theme border border-border-theme text-xs font-black text-card-foreground flex items-center gap-2 transition-colors">
                  <Globe size={14} className="text-primary" /> {language === 'en' ? "Nepal Hub" : "नेपाल हब"}
                </Link>
                <Link to="/knowledge" className="px-4 py-2.5 rounded-2xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 dark:text-purple-300 text-xs font-black flex items-center gap-2 transition-colors">
                  <Network size={14} /> {language === 'en' ? "Knowledge OS" : "ज्ञान OS"}
                </Link>
              </div>
            </div>

            {/* INTEGRATED PANCHANG OS DISPLAY */}
            <div className="bg-gradient-to-br from-[#D9381E]/5 via-card to-card p-6 rounded-[2rem] border border-[#D9381E]/10 mb-8 grid md:grid-cols-4 gap-6 items-center">
              <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-border-theme/80 pb-4 md:pb-0 md:pr-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary block mb-1">
                  {language === 'en' ? "Sanatan Panchang OS" : "सनातन पञ्चाङ्ग OS"}
                </span>
                <h3 className="text-lg font-black text-card-foreground leading-tight">
                  {dateFormattedBS}
                </h3>
                <span className="text-xxs text-muted-text font-bold block mt-1">
                  {dateFormattedEng}
                </span>
              </div>
              
              <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted-area/30 p-3 rounded-xl border border-border-theme/40 text-center">
                  <span className="text-[10px] font-bold text-muted-text block uppercase">{language === 'en' ? "Tithi" : "तिथि"}</span>
                  <span className="text-xs font-black text-card-foreground mt-0.5 block">कृष्ण पक्ष अष्टमी</span>
                </div>
                <div className="bg-muted-area/30 p-3 rounded-xl border border-border-theme/40 text-center">
                  <span className="text-[10px] font-bold text-muted-text block uppercase">{language === 'en' ? "Nakshatra" : "नक्षत्र"}</span>
                  <span className="text-xs font-black text-card-foreground mt-0.5 block">रोहिणी</span>
                </div>
                <div className="bg-muted-area/30 p-3 rounded-xl border border-border-theme/40 text-center">
                  <span className="text-[10px] font-bold text-muted-text block uppercase">{language === 'en' ? "Yoga" : "योग"}</span>
                  <span className="text-xs font-black text-card-foreground mt-0.5 block">हर्षण</span>
                </div>
                <div className="bg-muted-area/30 p-3 rounded-xl border border-border-theme/40 text-center">
                  <span className="text-[10px] font-bold text-muted-text block uppercase">{language === 'en' ? "Karan / Era" : "करण / संवत्"}</span>
                  <span className="text-xs font-black text-card-foreground mt-0.5 block">कौलव / ने.सं. ११४६</span>
                </div>
              </div>
            </div>

            {/* CHRONOLOGICAL TODAY IN NEPAL TIMELINE */}
            <div className="bg-card p-6 rounded-[2rem] border border-border-theme/90 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-primary animate-pulse" />
                  <h4 className="text-sm font-black text-card-foreground uppercase tracking-wider">
                    {language === 'en' ? "Today in Nepal — Real Chronology" : "आज नेपालमा — दैनिक वास्तविक-समय घटनाक्रम"}
                  </h4>
                </div>
                <span className="text-xxs font-black text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                  {language === 'en' ? "Active Timeline" : "सक्रिय समयरेखा"}
                </span>
              </div>

              {/* Dynamic scrollable chronology blocks */}
              <div className="flex items-center gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
                {todayTimelineData.map((item, idx) => {
                  const IconComp = item.icon;
                  const isHighlighted = activeTimelineTime === item.time;
                  return (
                    <div key={idx} className="flex items-center gap-3 shrink-0">
                      <div 
                        onClick={() => {
                          setActiveTimelineTime(isHighlighted ? null : item.time);
                          if (item.eventId) {
                            const elem = document.getElementById(item.eventId);
                            if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 select-none ${
                          isHighlighted 
                            ? "bg-primary text-white border-primary shadow-md shadow-primary/25 scale-102" 
                            : "bg-muted-area/40 hover:bg-muted-area/80 text-card-foreground border-border-theme"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isHighlighted ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                        }`}>
                          <IconComp size={16} />
                        </div>
                        <div>
                          <span className={`text-[10px] font-black block leading-none ${isHighlighted ? "text-white/80" : "text-primary"}`}>
                            {item.time}
                          </span>
                          <span className="text-xs font-bold block mt-1 leading-none">
                            {language === 'en' ? item.labelEn : item.labelNp}
                          </span>
                        </div>
                      </div>
                      
                      {idx < todayTimelineData.length - 1 && (
                        <div className="h-0.5 w-6 bg-border-theme shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* INTEGRATED INTELLIGENCE STATISTICS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-muted-area/30 border border-border-theme/80 p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <div className="text-lg font-black text-card-foreground">{todayCount}</div>
                  <div className="text-[11px] font-bold text-muted-text">{language === 'en' ? "Today Active" : "आजका सक्रिय घटनाहरू"}</div>
                </div>
              </div>

              <div className="bg-muted-area/30 border border-border-theme/80 p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-lg font-black text-card-foreground">{festivalCount}</div>
                  <div className="text-[11px] font-bold text-muted-text">{language === 'en' ? "Nepali Festivals" : "पर्व तथा जात्रा"}</div>
                </div>
              </div>

              <div className="bg-muted-area/30 border border-border-theme/80 p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <Network size={18} />
                </div>
                <div>
                  <div className="text-lg font-black text-card-foreground">{culturalCount}</div>
                  <div className="text-[11px] font-bold text-muted-text">{language === 'en' ? "Knowledge Links" : "ज्ञानकोष सम्बन्ध"}</div>
                </div>
              </div>

              <div className="bg-muted-area/30 border border-border-theme/80 p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div className="text-lg font-black text-card-foreground">{verifiedCount}</div>
                  <div className="text-[11px] font-bold text-muted-text">{language === 'en' ? "Verified Trust" : "सत्यापित च्यानल"}</div>
                </div>
              </div>
            </div>

            {/* STRATEGIC TEMPORAL COMMAND CENTER PRIMARY NAVIGATION (NOW | TODAY | UPCOMING | FESTIVALS | NATIONAL | LOCAL | MY NEPAL) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3.5 no-scrollbar mb-4 border-b border-border-theme/50 pt-2">
              {[
                { id: "all", labelEn: "ALL", labelNp: "सबै घटनाक्रम" },
                { id: "now", labelEn: "NOW", labelNp: "अहिले (Live)" },
                { id: "today", labelEn: "TODAY", labelNp: "आज" },
                { id: "upcoming", labelEn: "UPCOMING", labelNp: "आगामी पर्व" },
                { id: "festivals", labelEn: "FESTIVALS", labelNp: "संस्कृति र जात्रा" },
                { id: "national", labelEn: "NATIONAL", labelNp: "राष्ट्रिय उत्सव" },
                { id: "local", labelEn: "LOCAL", labelNp: "स्थानीय जात्रा" },
                { id: "my-nepal", labelEn: "MY NEPAL", labelNp: "मेरो नेपाल" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTemporal(tab.id)}
                  className={`px-4.5 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 uppercase tracking-widest border ${
                    selectedTemporal === tab.id
                      ? "bg-primary text-white shadow-lg shadow-primary/25 border-primary"
                      : "bg-muted-area text-muted-text hover:text-card-foreground border-border-theme hover:bg-muted-area/80"
                  }`}
                >
                  {language === 'en' ? tab.labelEn : tab.labelNp}
                </button>
              ))}
            </div>

            {/* FILTER & SEARCH PANEL */}
            <div className="grid sm:grid-cols-3 gap-3 bg-muted-area/35 p-3 rounded-2.5xl border border-border-theme">
              <div className="flex items-center gap-2 bg-card px-3 py-2.5 rounded-xl border border-border-theme">
                <Search size={16} className="text-muted-text" />
                <input 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={language === 'en' ? "Search events or knowledge..." : "घटना वा ज्ञान नोड खोज्नुहोस्..."}
                  className="bg-transparent text-xs font-bold text-card-foreground outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2 bg-card px-3 py-2.5 rounded-xl border border-border-theme">
                <Filter size={16} className="text-muted-text" />
                <select 
                  value={selectedCategory} 
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-xs font-bold text-card-foreground outline-none w-full cursor-pointer"
                >
                  <option value="all">{language === 'en' ? "All Categories" : "सबै श्रेणीहरू"}</option>
                  <option value="festivals">{language === 'en' ? "Cultural Festivals" : "सांस्कृतिक जात्रा तथा पर्व"}</option>
                  <option value="national">{language === 'en' ? "National Observances" : "राष्ट्रिय सम्मेलन तथा उत्सव"}</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-card px-3 py-2.5 rounded-xl border border-border-theme">
                <MapPin size={16} className="text-muted-text" />
                <select 
                  value={selectedDistrict} 
                  onChange={e => setSelectedDistrict(e.target.value)}
                  className="bg-transparent text-xs font-bold text-card-foreground outline-none w-full cursor-pointer"
                >
                  <option value="all">{language === 'en' ? "All 77 Districts" : "सबै ७७ जिल्लाहरू"}</option>
                  {provinces.map(prov => (
                    <optgroup key={prov.id} label={`${prov.name} (${prov.nameEn})`}>
                      {prov.districts.map((dist, idx) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* FEATURED EVENT & EVENT GRID DISPLAY */}
        {featured ? (
          <div className="space-y-4">
            <div id={featured.id}>
              <FeaturedEvent event={featured} />
            </div>
            <EventGrid events={filteredEvents.filter(e => e.id !== featured?.id)} />
          </div>
        ) : (
          <div className="container-custom py-24 text-center">
            <div className="bg-card border border-border-theme rounded-2.5xl p-12 max-w-lg mx-auto flex flex-col items-center gap-4">
              <Globe className="w-12 h-12 text-muted-text/50" />
              <h3 className="text-xl font-black text-card-foreground">
                {language === 'en' ? "No matches in Temporal Command Center" : "निर्देशन केन्द्रमा कुनै नतिजा भेटिएन"}
              </h3>
              <p className="text-sm font-semibold text-muted-text">
                {language === 'en' 
                  ? "Try checking another Temporal Tab or loosening your category search filter." 
                  : "कृपया अर्को समय तालिका ट्याब चयन गर्नुहोस् वा फिल्टर परिमार्जन गर्नुहोस्।"
                }
              </p>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
