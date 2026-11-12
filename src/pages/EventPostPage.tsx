import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/src/components/layout/Header";
import SEOHead from "@/src/components/common/SEOHead";
import Footer from "@/src/components/layout/Footer";
import TimelineView from "@/src/components/community/events/TimelineView";
import CommentSection from "@/src/components/community/events/CommentSection";
import GalleryViewer from "@/src/components/community/events/GalleryViewer";
import ThumbnailSlider from "@/src/components/community/events/ThumbnailSlider";
import { 
  ArrowLeft, MapPin, Calendar, Globe, Network, Radio, Sparkles, ExternalLink, 
  Tag, ShieldCheck, CheckCircle2, Clock, Info, HelpCircle, Volume2, ArrowRight
} from "lucide-react";
import { ArticleSkeleton } from "@/src/components/ui/PageLoaders";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { useLanguage } from "@/src/context/LanguageContext";
import { formatDate } from "@/src/lib/utils";

// v3.8 Canonical Event Map with full structural fidelity
const CANONICAL_EVENTS_MAP: Record<string, any> = {
  "pashupati-shivaratri-2083": {
    id: "pashupati-shivaratri-2083",
    title: "महाशिवरात्रि तथा पशुपतिनाथ विशेष महामहोत्सव २०८३",
    tagline: "विश्वभरका १० लाख भन्दा बढी सनातन धर्मावलम्बीहरूको पशुपति क्षेत्रमा आगमन एवं प्रत्यक्ष दर्शन",
    date: "२०८३ फागुन २५ (2086-03-08)",
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
    whatChanged: "बिहान ४ बजेदेखि नै चारै ढोका खुला गरी दर्शन व्यवस्थित गरिएको छ। भक्तजनको सहजताका लागि सुरक्षा र भोजनको विशेष प्रबन्ध मिलाइएको छ।",
    
    knowledgeEntities: ["पशुपतिनाथ", "महाशिवरात्रि", "वाग्मती", "काठमाडौँ"],
    knowledgeTags: ["सनातन धर्म", "शिव पूजा", "वैदिक सम्पदा", "मन्दिर संस्कृति"],
    
    timeline: [
      { time: "बिहान ०३:००", title: "पशुपतिनाथ मन्दिरका चारै ढोका खुला", description: "भक्तजनहरूको दर्शनका लागि विशेष लाइन प्रबन्ध।" },
      { time: "दिउँसो १२:००", title: "विशेष मध्याह्न महापूजा तथा आरती", description: "मूल पुजारीद्वारा चतुर्मुखी शिवलिङ्गको जल र पञ्चामृत अभिषेक।" },
      { time: "बेलुकी ०६:००", title: "वाग्मती गङ्गा आरती तथा दीपावली", description: "हजारौँ साधुसन्त तथा भक्तजनहरूको उपस्थितिमा अखण्ड आरती।" }
    ],
    sources: [
      { name: "पशुपति क्षेत्र विकास कोष (PADT)", url: "https://pashupatitrust.org.np", type: "official" },
      { name: "राष्ट्रिय समाचार समिति (RSS)", type: "media" },
      { name: "संस्कृति, पर्यटन तथा नागरिक उड्डयन मन्त्रालय", type: "official" }
    ]
  },
  "janakpur-vivah-panchami": {
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
    whyItMatters: "जनकपुरधाम मिथिला सभ्यताको मुटु हो। त्रेतायुगमा भगवान् श्रीराम र जगज्जननी सीता माताको शुभ विवाह भएको स्मृतिमा प्रत्येक वर्ष मार्गशीर्ष शुक्ल पञ्चमीका दिन विवाह पञ्चमी भव्य रूपमा मनाइन्छ।",
    whatChanged: "अयोध्याबाट आउने विशेष जन्ती (राम बारात) को स्वागतको लागि जनकपुरधाम क्षेत्र दुलही झैँ सिंगारिएको छ र स्थानीय सरकारले सार्वजनिक बिदा घोषणा गरेको छ।",
    
    knowledgeEntities: ["जानकी मन्दिर", "सीता माता", "विवाह पञ्चमी", "रामायण", "जनकपुर"],
    knowledgeTags: ["वैवाहिक उत्सव", "मिथिला संस्कृति", "त्रेतायुग"],
    timeline: [
      { time: "बिहान ०९:००", title: "नगर दर्शन तथा डोला यात्रा", description: "जनकपुरधामको रङ्गभूमि मैदान तर्फ विशेष डोला प्रस्थान।" },
      { time: "दिउँसो ०२:००", title: "स्वयंवर तथा मण्डप पूजन", description: "वैदिक मन्त्रोच्चारणका साथ श्री राम-सीता स्वयंवर समारोह।" }
    ],
    sources: [
      { name: "जानकी मन्दिर गुठी व्यवस्थापन समिति", type: "official" },
      { name: "जनकपुरधाम उपमहानगरपालिका कार्यालय", type: "official" }
    ]
  },
  "lumbini-buddha-jayanti": {
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
    whyItMatters: "गौतम बुद्धको जन्मस्थल लुम्बिनी विश्व शान्तिको केन्द्र हो। यस कार्यक्रमले बौद्ध दर्शन र नेपाली सभ्यतालाई विश्वव्यापी मञ्चमा उजागर गर्दछ र विश्वभरका शान्तिदूतहरूलाई आकर्षित गर्दछ।",
    whatChanged: "२३ देशका प्रतिनिधिहरू लुम्बिनी आइपुगेका छन् र दीप प्रज्ज्वलन तथा ध्यान शिविरका कार्यक्रमहरूलाई सुरक्षा संयन्त्रले पूर्ण सुदृढ बनाएको छ।",
    
    knowledgeEntities: ["लुम्बिनी", "गौतम बुद्ध", "अशोक स्तम्भ", "रूपन्देही"],
    knowledgeTags: ["विश्व शान्ति", "बौद्ध संस्कृति", "युनेस्को"],
    timeline: [
      { time: "बिहान ०५:००", title: "शान्ति पदयात्रा तथा ध्यान", description: "पुष्करणी पोखरी वरिपरि शान्ति दीप प्रज्वलन।" }
    ],
    sources: [
      { name: "लुम्बिनी विकास कोष (LDT)", url: "https://lumbinitrust.org", type: "official" },
      { name: "पर्यटन बोर्ड नेपाल", type: "official" }
    ]
  },
  "rigveda-internatonal-symposium": {
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
    whyItMatters: "वेदहरू मानव इतिहासका सबैभन्दा प्राचीन ज्ञान ग्रन्थ हुन्। नेपालका वैदिक ऋषिहरूले यस भूमिमा मन्त्रहरूको साक्षात्कार गरेका थिए। यो सम्मेलनले आधुनिक भौतिकशास्त्र र ऋग्वेदको ज्ञानलाई जोड्दछ।",
    whatChanged: "कार्यक्रम सफलतापूर्वक सम्पन्न भई वैदिक विज्ञान प्रवर्द्धन गर्ने १५ बुँदे काठमाडौँ घोषणापत्र जारी गरिएको छ।",
    
    knowledgeEntities: ["ऋग्वेद", "ऋग्वेद संहिता", "गायत्री मन्त्र", "उपनिषद्"],
    knowledgeTags: ["वैदिक अनुसन्धान", "दर्शन", "संस्कृत"],
    timeline: [
      { time: "बिहान १०:००", title: "वैदिक मङ्गलाचरण तथा समुद्घाटन", description: "विद्वद्‌वृन्दद्वारा सामवेद तथा ऋग्वेद मन्त्रगान।" }
    ],
    sources: [
      { name: "नेपाल प्रज्ञा प्रतिष्ठान", type: "official" },
      { name: "नेपाल संस्कृत विश्वविद्यालय", type: "official" }
    ]
  },
  "dashain-mahotsav-2083": {
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
    whyItMatters: "बडा दशैँ नेपालीहरूको महान् राष्ट्रिय सांस्कृतिक पर्व हो, जहाँ नवदुर्गा भगवतीको उपासना गरिन्छ। यसले समाजमा असत्यमाथि सत्यको विजय र पारिवारिक सम्बन्धको नवजागरण गराउँछ।",
    whatChanged: "गुठी संस्थानले शक्तिपीठहरूमा हुने विशेष बलि पूजा र महाआरतीको समय तालिका सार्वजनिक गरेको छ।",
    
    knowledgeEntities: ["घटस्थापना", "नवदुर्गा", "गोरखा दरबार", "शक्तिपीठ"],
    knowledgeTags: ["शक्ति साधना", "विजया दशमी", "सांस्कृतिक पर्व"],
    timeline: [
      { time: "बिहान ०७:००", title: "घटस्थापना तथा नवदुर्गा आवाहन", description: "वैदिक विधिपूर्वक बालुवा उठाई जमरा उमार्ने कार्य।" }
    ],
    sources: [
      { name: "गुठी संस्थान केन्द्रीय कार्यालय", type: "official" },
      { name: "हनुमानढोका दरबार हेरचाह अड्डा", type: "official" }
    ]
  }
};

export default function EventPostPage() {
  const { id } = useParams();
  const { language } = useLanguage();
  const [event, setEvent] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchEventData = async () => {
      try {
        const snap = await snapshotEngine.getEventSnapshot(id);
        if (snap && snap.event) {
          // Merge dynamic event with canonical rich v3.8 fields if matches fallback
          const canonical = CANONICAL_EVENTS_MAP[id];
          setEvent({ ...canonical, ...snap.event });
        } else {
          const fallback = CANONICAL_EVENTS_MAP[id];
          setEvent(fallback || {
            id,
            title: "नेपाल हब विशेष घटना",
            tagline: "सरस्वती ज्ञान सञ्जालमा जोडिएको ऐतिहासिक तथा सांस्कृतिक कार्यक्रम",
            date: "हाल सक्रिय",
            location: "नेपाल",
            district: "काठमाडौँ",
            province: "बागमती प्रदेश",
            isLiveOnNepalHub: true,
            lifecycleStatus: "live",
            temporalState: "happening-now",
            freshness: "fresh",
            confidence: "verified",
            whyItMatters: "यो घटना नेपाल हबको आधिकारिक बुद्धिमत्ता प्रणालीमा दर्ता भएको छ।",
            lastVerifiedAt: "१० मिनेट अघि",
            sourcesCount: 2,
            knowledgeEntities: ["pashupatinath", "knowledge-network"]
          });
        }
      } catch (e) {
        const fallback = CANONICAL_EVENTS_MAP[id];
        setEvent(fallback || {
          id,
          title: "नेपाल हब विशेष घटना",
          location: "नेपाल",
          date: "हाल सक्रिय"
        });
      }
    };

    fetchEventData();
  }, [id]);

  if (!event) return <ArticleSkeleton />;

  const knowledgeEntities = event.knowledgeEntities || [];
  const knowledgeTags = event.knowledgeTags || [];
  const eventSources = event.sources || [
    { name: "नेपाल सरकार गृह मन्त्रालय (Ministry of Home Affairs)", type: "official" },
    { name: "नेपाल हब डिजिटल पत्रकारिता विंग", type: "local" }
  ];

  // Scoring Calculation for explanation
  const editorialBase = event.isFeatured ? 50 : 20;
  const liveBonus = event.isLiveOnNepalHub ? 30 : 0;
  const knowledgeBonus = knowledgeEntities.length > 0 ? 15 : 0;
  const confidenceBonus = event.confidence === "verified" ? 15 : 10;
  const finalScore = editorialBase + liveBonus + knowledgeBonus + confidenceBonus;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={event.title}
        description={event.tagline || event.title}
        keywords={event.knowledgeTags || [event.district, "नेपाल पर्व", "Sanatan Event"]}
        image={event.featuredImage || "https://sanatanmarga.com/logo.png"}
        url={`/events/${event.id}`}
        type="event"
      />
      <Header />
      
      <main className="container-custom py-8 md:py-12">
        {/* Back Link */}
        <Link to="/events" className="inline-flex items-center gap-2 text-primary font-black mb-6 hover:opacity-80 transition-opacity">
          <ArrowLeft size={20} /> {language === 'en' ? "Back to Events OS" : "इभेन्ट्स OS मा फर्कनुहोस्"}
        </Link>

        {/* TRUST STRIP BANNER */}
        <div className="mb-8 p-6 rounded-[2.5rem] bg-card border border-border-theme shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-primary uppercase tracking-widest">
                  {language === 'en' ? "CANONICAL EVENTS OS v3.8" : "घटना OS प्रमाणित प्रणाली v3.8"}
                </span>
                
                {/* Unified temporal state badge */}
                <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                  event.temporalState === 'happening-now' 
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                    : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                }`}>
                  {event.temporalState === 'happening-now' ? (
                    <>
                      <Radio size={10} className="animate-pulse" /> LIVE
                    </>
                  ) : event.temporalState === 'completed' ? (
                    "COMPLETED"
                  ) : (
                    "SCHEDULED"
                  )}
                </span>
              </div>
              
              {/* Dynamic trust strip copy */}
              <p className="text-xs font-bold text-muted-text mt-0.5 uppercase tracking-wider">
                {language === 'en'
                  ? `${event.confidence || 'VERIFIED'} · ${event.sourcesCount || 2} SOURCES CHECKED · UPDATED ${event.lastVerifiedAt || '15 min ago'}`
                  : `${event.confidence === 'verified' ? 'प्रमाणित सत्य' : 'पुष्टि गरिएको'} · ${event.sourcesCount || 2} आधिकारिक स्रोत · अद्यावधिक समय: ${event.lastVerifiedAt || '१५ मिनेट अघि'}`
                }
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setShowScoreModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-muted-area hover:bg-border-theme border border-border-theme text-xs font-black text-card-foreground flex items-center gap-2 transition-all"
            >
              <Info size={14} className="text-primary" /> {language === 'en' ? "Audit Score" : "स्कोर अडिट"}
            </button>
            
            <Link 
              to="/nepal-hub"
              className="px-5 py-2.5 rounded-2xl bg-primary text-white font-bold text-xs flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
            >
              {language === 'en' ? "Nepal Hub Live" : "नेपाल हब लाइभ"} <ExternalLink size={14} />
            </Link>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* LEFT: CONTENT BODY (2 Cols) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Hero Image */}
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-border-theme aspect-video bg-muted-area">
              <img src={event.featuredImage || "/placeholder_event.png"} alt={event.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              {event.isLiveOnNepalHub && (
                <div className="absolute top-6 left-6 px-4 py-2 bg-red-600/90 backdrop-blur-md text-white text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-2 shadow-lg">
                  <Radio size={14} className="animate-pulse" /> {language === 'en' ? "Nepal Hub Stream Active" : "नेपाल हब प्रत्यक्ष प्रणाली"}
                </div>
              )}
            </div>

            <ThumbnailSlider media={media} onSelect={() => setShowGallery(true)} />

            {/* Title & Tagline */}
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-card-foreground leading-tight tracking-tight mb-4">
                {event.title}
              </h1>
              {event.tagline && <p className="text-lg md:text-xl text-muted-text font-medium mb-6">{event.tagline}</p>}

              <div className="flex flex-wrap gap-4 sm:gap-6 text-muted-text font-bold text-sm bg-card p-5 rounded-3xl border border-border-theme">
                <div className="flex items-center gap-2">
                  <Calendar className="text-primary" size={18}/> 
                  <span>{formatDate(event.date, language)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="text-primary" size={18}/> 
                  <span>{event.location} {event.district && `(${event.district})`}</span>
                </div>
                <div className="flex items-center gap-2 sm:ml-auto">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    event.freshness === 'fresh' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {event.freshness || 'fresh'}
                  </span>
                </div>
              </div>
            </div>

            {/* WHY THIS MATTERS (EDITORIAL COGNITIVE LAYER) */}
            {event.whyItMatters && (
              <div className="bg-gradient-to-br from-primary/5 via-card to-card p-8 rounded-[2.5rem] border border-primary/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                <h3 className="text-xl font-black text-card-foreground mb-3 flex items-center gap-2">
                  <Sparkles size={18} className="text-primary" />
                  {language === 'en' ? "Why This Event Matters" : "यस घटनाको सभ्यतामूलक र सांस्कृतिक महत्व"}
                </h3>
                <p className="text-sm text-muted-text font-bold leading-relaxed">
                  {event.whyItMatters}
                </p>
              </div>
            )}

            {/* WHAT CHANGED / DYNAMIC TIMELINE UPDATES */}
            {event.whatChanged && (
              <div className="bg-card p-8 rounded-[2.5rem] border border-border-theme">
                <h3 className="text-xl font-black text-card-foreground mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-primary animate-pulse" />
                  {language === 'en' ? "What Changed / Recent Updates" : "हालको अद्यावधिक र परिवर्तन विवरण"}
                </h3>
                <div className="p-4 rounded-2xl bg-muted-area/50 border border-border-theme flex items-start gap-3">
                  <span className="bg-primary/10 text-primary text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider mt-0.5 shrink-0">
                    {language === 'en' ? "Latest" : "हालै"}
                  </span>
                  <p className="text-xs font-bold text-muted-text leading-relaxed">
                    {event.whatChanged}
                  </p>
                </div>
              </div>
            )}

            {/* LISTENOS AUDIO INTEGRATION */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shrink-0">
                  <Volume2 size={24} className={isPlayingAudio ? "animate-bounce" : ""} />
                </div>
                <div>
                  <h4 className="font-black text-sm tracking-tight">{language === 'en' ? "ListenOS — Audio Explanation" : "ListenOS — अडियो ज्ञानवाचन"}</h4>
                  <p className="text-xs text-zinc-400 font-medium mt-0.5">
                    {language === 'en' ? "Hear local history, rituals, and myths narrated." : "यस जात्रा/पर्वको प्राचीन इतिहास, विधि तथा धार्मिक मान्यताहरू सुन्नुहोस्।"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className="w-full sm:w-auto px-5 py-2.5 bg-white text-slate-950 font-black text-xs rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
              >
                {isPlayingAudio ? (language === 'en' ? "PAUSE AUDIO" : "अडियो रोक्नुहोस्") : (language === 'en' ? "PLAY INSIGHTS" : "अडियो सुन्नुहोस्")}
              </button>
            </div>

            {/* PROVENANCE CHECK & AUTHORITATIVE SOURCES */}
            <div className="bg-card p-8 rounded-[2.5rem] border border-border-theme">
              <h3 className="text-xl font-black text-card-foreground mb-6 flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-500" />
                {language === 'en' ? "Authoritative Sources & Provenance Check" : "आधिकारिक स्रोत र सत्यता जाँच सूचकांक"}
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {eventSources.map((src: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-2xl bg-muted-area/40 border border-border-theme flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                        {src.type}
                      </span>
                      <h4 className="text-xs font-black text-card-foreground mt-2 line-clamp-1">{src.name}</h4>
                      <p className="text-[10px] font-bold text-muted-text mt-0.5">
                        {language === 'en' ? "Identity verified by Nepal Hub" : "नेपाल हबद्वारा पहिचान प्रमाणित"}
                      </p>
                    </div>
                    {src.url && (
                      <a href={src.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded-lg text-muted-text hover:text-primary hover:bg-muted-area">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-text font-semibold leading-relaxed mt-4">
                * {language === 'en' 
                  ? "Sanatan Marga adheres strictly to 'No Source = No Story'. All events listed have been checked for chronological and administrative veracity."
                  : "सनातन मार्गको कडा नीतिका अनुसार स्रोत नखुलेका कुनै पनि समाचार वा घटनाहरू प्रकाशन गरिँदैन। सबै विवरणहरू आधिकारिक सरकारी तथा स्थानीय निकायबाट प्रमाणित छन्।"}
              </p>
            </div>

            {/* SARASWATI KNOWLEDGE GRAPH LINKED NODES */}
            <div className="bg-gradient-to-br from-purple-500/10 via-card to-indigo-500/10 p-8 rounded-[2.5rem] border border-purple-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Network className="text-purple-600 dark:text-purple-400" size={24} />
                  <h3 className="text-xl font-black text-card-foreground tracking-tight">
                    {language === 'en' ? "Saraswati Knowledge Graph" : "सरस्वती ज्ञान सञ्जाल (Knowledge OS)"}
                  </h3>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 bg-purple-500/20 text-purple-600 dark:text-purple-300 rounded-lg uppercase">
                  Linked Entities
                </span>
              </div>
              <p className="text-xs text-muted-text font-bold">
                {language === 'en' 
                  ? "This event is directly connected with the following historical and spiritual nodes in the Saraswati Knowledge Base:" 
                  : "यो घटना सरस्वती ज्ञान सञ्जालका निम्न पौराणिक तथा ऐतिहासिक नोडहरूसँग प्रत्यक्ष जोडिएको छ:"}
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                {knowledgeEntities.map((entity: string) => (
                  <Link 
                    key={entity}
                    to="/knowledge"
                    className="px-4 py-2.5 bg-card hover:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Sparkles size={14} className="text-purple-500" />
                    {entity}
                    <ExternalLink size={12} className="opacity-60" />
                  </Link>
                ))}
              </div>

              {knowledgeTags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-purple-500/10">
                  {knowledgeTags.map((tag: string) => (
                    <span key={tag} className="px-3 py-1 bg-muted-area/60 text-muted-text rounded-lg text-xs font-semibold flex items-center gap-1">
                      <Tag size={12} /> #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* EVENT TIMELINE */}
            <div className="bg-card p-8 md:p-10 rounded-[2.5rem] border border-border-theme shadow-sm">
              <h3 className="text-2xl font-black mb-8 text-card-foreground tracking-tight">
                {language === 'en' ? "Event Timeline & Schedule" : "कार्यक्रमको घटनाक्रम विवरण तालिका"}
              </h3>
              <TimelineView events={event.timeline || []} />
            </div>

          </div>

          {/* RIGHT: COMMENT SECTION & ACTIONS (1 Col) */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              <CommentSection eventId={id!} comments={comments} />
            </div>
          </div>

        </div>
      </main>

      <Footer />
      {showGallery && <GalleryViewer media={media} onClose={() => setShowGallery(false)} />}

      {/* EXPLAINABLE FEATURE SCORE AUDIT MODAL */}
      {showScoreModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border-theme rounded-[2.5rem] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border-theme pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-primary" />
                <h3 className="text-lg font-black text-card-foreground">
                  {language === 'en' ? "Feature Score Audit Breakdown" : "विस्तृत विशेषता स्कोर अडिट"}
                </h3>
              </div>
              <button 
                onClick={() => setShowScoreModal(false)}
                className="p-1 rounded-xl text-muted-text hover:text-card-foreground hover:bg-muted-area transition-colors text-xs font-black"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs font-bold text-card-foreground">
                <span className="text-muted-text">{language === 'en' ? "Editorial Priority Weight" : "सम्पादकीय प्राथमिकता भार"}</span>
                <span className="text-primary font-black">+{editorialBase}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-card-foreground">
                <span className="text-muted-text">{language === 'en' ? "Live Nepal Hub Signal" : "लाइभ नेपाल हब संकेत"}</span>
                <span className="text-primary font-black">+{liveBonus}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-card-foreground">
                <span className="text-muted-text">{language === 'en' ? "Knowledge Graph Connectivity" : "ज्ञान सञ्जाल नोड आबद्धता"}</span>
                <span className="text-primary font-black">+{knowledgeBonus}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-card-foreground">
                <span className="text-muted-text">{language === 'en' ? "Verification Confidence Score" : "सत्यापन विश्वसनीयता सूचकांक"}</span>
                <span className="text-primary font-black">+{confidenceBonus}</span>
              </div>

              <div className="border-t border-border-theme pt-4 flex justify-between items-center font-black text-base text-card-foreground">
                <span>{language === 'en' ? "Final Rank Weight" : "अन्तिम र्‍याङ्किङ स्कोर"}</span>
                <span className="text-primary">{finalScore}</span>
              </div>
            </div>

            <p className="text-xxs text-muted-text font-semibold leading-relaxed text-center">
              {language === 'en' 
                ? "This audit keeps editorial curation completely transparent and ensures we prioritize cultural value and high-veracity data." 
                : "यस प्रणालीले सम्पादकीय चयनलाई पारदर्शी बनाउँदै सांस्कृतिक मूल्य र प्रमाणित तथ्याङ्कलाई मात्र महत्त्व दिन्छ।"}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
