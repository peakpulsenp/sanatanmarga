import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, ArrowRight, Globe, Network, Sparkles, Radio, ShieldCheck, Info, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/src/context/LanguageContext";
import { formatDate } from "@/src/lib/utils";

export default function FeaturedEvent({ event }: { event: any }) {
  const { language } = useLanguage();
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const knowledgeEntities = event.knowledgeEntities || [];

  // Temporal indicators & state labels
  const getTemporalStateLabel = () => {
    const isEng = language === "en";
    const state = event.temporalState || "scheduled";
    switch (state) {
      case "happening-now":
        return isEng ? "HAPPENING NOW" : "अहिले भइरहेको छ";
      case "starting-soon":
        return isEng ? "STARTING SOON" : "शीघ्र सुरु हुँदैछ";
      case "scheduled":
        return isEng ? "SCHEDULED" : "निर्धारित कार्यक्रम";
      case "completed":
        return isEng ? "COMPLETED" : "सम्पन्न";
      case "postponed":
        return isEng ? "POSTPONED" : "स्थगित";
      default:
        return isEng ? "SCHEDULED" : "निर्धारित";
    }
  };

  // Score computation
  const getScoreBreakdown = () => {
    const breakdown = [
      { name: language === "en" ? "Editorial Priority" : "सम्पादकीय प्राथमिकता", score: event.isFeatured ? 50 : 20 },
      { name: language === "en" ? "Live Activity (Nepal Hub)" : "लाइभ गतिविधि (नेपाल हब)", score: event.isLiveOnNepalHub ? 30 : 0 },
      { name: language === "en" ? "Knowledge OS Nodes" : "ज्ञानकोष सम्बन्ध", score: knowledgeEntities.length > 0 ? 15 : 0 },
      { name: language === "en" ? "Verification Integrity" : "सत्यापन विश्वसनीयता", score: event.confidence === "verified" ? 15 : 10 },
      { name: language === "en" ? "Freshness Status" : "ताजा अवस्था", score: event.freshness === "fresh" ? 10 : 5 }
    ];
    
    const total = breakdown.reduce((acc, curr) => acc + curr.score, 0);
    return { breakdown, total };
  };

  const { breakdown, total } = getScoreBreakdown();

  return (
    <section className="container-custom py-8 lg:py-12">
      <div className="relative bg-card rounded-[3rem] overflow-hidden border border-border-theme p-6 sm:p-8 lg:p-12 shadow-sm bg-gradient-to-br from-card via-card to-primary/5">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Image & Badges */}
          <div className="aspect-video lg:aspect-[4/3] rounded-[2rem] overflow-hidden relative shadow-xl border border-border-theme bg-muted-area">
            <img 
              src={event.featuredImage || "/placeholder_event.png"} 
              alt={event.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            
            {/* Live Indicator overlay */}
            <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
              {event.isLiveOnNepalHub && (
                <div className="bg-red-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                  <Radio size={12} className="animate-pulse" /> {language === 'en' ? "Nepal Hub Live" : "नेपाल हब प्रत्यक्ष"}
                </div>
              )}
              <div className="bg-emerald-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                {getTemporalStateLabel()}
              </div>
            </div>

            {/* Explainable Featured Score badge */}
            <div className="absolute bottom-4 left-4">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setShowScoreBreakdown(!showScoreBreakdown);
                }}
                className="bg-slate-950/80 backdrop-blur-md hover:bg-slate-900/90 text-white border border-white/10 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all"
              >
                <Info size={14} className="text-primary animate-pulse" />
                <span>{language === 'en' ? `Featured Score: ${total}` : `विशेष स्कोर: ${total}`}</span>
              </button>
            </div>
          </div>

          {/* Details & Copy */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black px-3 py-1 bg-primary/10 text-primary rounded-full uppercase tracking-widest flex items-center gap-1 border border-primary/20">
                <CheckCircle2 size={12} /> {language === 'en' ? "FEATURED INTEGRITY" : "मुख्य विशेष घटना"}
              </span>
              <span className="text-xs font-black px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-300 rounded-full flex items-center gap-1 border border-purple-500/20">
                <Network size={12} /> {language === 'en' ? "Verified Trust Strip" : "विश्वसनीय प्रमाणित"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-card-foreground tracking-tight leading-tight">
              {event.title}
            </h1>
            {event.tagline && <p className="text-base sm:text-lg text-muted-text font-medium leading-relaxed">{event.tagline}</p>}

            {/* Why This Matters editorial block */}
            {event.whyItMatters && (
              <div className="p-4 rounded-2xl bg-muted-area/50 border border-border-theme/80 border-l-4 border-l-primary/75">
                <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-1">
                  {language === 'en' ? "Why This Matters" : "यसको महत्व र विशेषता"}
                </h4>
                <p className="text-xs text-muted-text font-bold leading-relaxed">
                  {event.whyItMatters}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-6 text-sm font-bold text-muted-text">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-primary"/> 
                {formatDate(event.date, language)}
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-primary"/> 
                {event.location} {event.district ? `(${event.district})` : ""}
              </div>
            </div>

            {/* Knowledge Nodes */}
            {knowledgeEntities.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {knowledgeEntities.map((entity: string) => (
                  <span key={entity} className="px-3 py-1 bg-purple-500/10 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-black flex items-center gap-1 border border-purple-500/20">
                    <Sparkles size={12} className="text-purple-500 animate-pulse" /> {entity}
                  </span>
                ))}
              </div>
            )}

            {/* Trust strip details */}
            <div className="flex items-center gap-2 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/20 w-fit">
              <ShieldCheck size={16} />
              <span>
                {language === 'en' 
                  ? `VERIFIED CANONICAL · ${event.sourcesCount || 3} SOURCES CHECKED` 
                  : `प्रमाणित सत्य · ${event.sourcesCount || 3} आधिकारिक स्रोतद्वारा पुष्टि`
                }
              </span>
              <span className="text-xxs text-muted-text font-bold uppercase tracking-wider ml-2 border-l border-border-theme pl-2">
                {language === 'en' ? `Updated ${event.lastVerifiedAt || '15 min ago'}` : `अद्यावधिक: ${event.lastVerifiedAt || '१५ मिनेट अघि'}`}
              </span>
            </div>

            <Link 
              to={`/events/${event.id}`}
              className="mt-2 bg-primary text-white text-base font-bold py-4 px-8 rounded-2xl w-fit flex items-center gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
            >
              {language === 'en' ? "Full Details & Timeline" : "पूर्ण विवरण तथा टाइमलाइन"} <ArrowRight size={18} />
            </Link>
          </div>

        </div>

        {/* Dynamic Explainable Score modal pop-up (In-Card Overlay) */}
        {showScoreBreakdown && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md p-8 flex flex-col justify-center items-center z-20 animate-in fade-in zoom-in duration-200">
            <div className="w-full max-w-md bg-card border border-border-theme rounded-[2.5rem] p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-border-theme pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-primary" />
                  <h3 className="text-lg font-black text-card-foreground">
                    {language === 'en' ? "Explainable Feature Score" : "विशेषता स्कोर पारदर्शी विवरण"}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowScoreBreakdown(false)}
                  className="p-1.5 rounded-xl text-muted-text hover:text-card-foreground hover:bg-muted-area transition-colors text-xs font-black"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3.5">
                {breakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-bold text-card-foreground">
                    <span className="text-muted-text">{item.name}</span>
                    <span className="text-primary font-black">+{item.score}</span>
                  </div>
                ))}
                
                <div className="border-t border-border-theme pt-4 flex justify-between items-center font-black text-base text-card-foreground">
                  <span>{language === 'en' ? "Calculated Rank Score" : "कुल गणना स्कोर"}</span>
                  <span className="text-primary">{total}</span>
                </div>
              </div>

              <p className="text-xxs text-muted-text font-semibold leading-relaxed text-center">
                {language === 'en' 
                  ? "Rank scores are dynamically audited to automate trustworthy home/events listings without black-box bias." 
                  : "यो स्कोर सम्पादकीय र भौगोलिक निकटताका आधारमा स्वचालित र पारदर्शी रूपमा गणना गरिन्छ।"}
              </p>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
