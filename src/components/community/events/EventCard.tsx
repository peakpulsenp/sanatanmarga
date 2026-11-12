import { Link } from "react-router-dom";
import { Calendar, MapPin, Globe, Sparkles, ShieldCheck, HelpCircle, RefreshCw, Compass } from "lucide-react";
import { useLanguage } from "@/src/context/LanguageContext";
import { formatDate } from "@/src/lib/utils";

interface Event {
  id: string;
  title: string;
  featuredImage: string;
  date: string;
  location: string;
  district?: string;
  province?: string;
  isLiveOnNepalHub?: boolean;
  knowledgeEntities?: string[];
  status?: string;
  
  // v3.8 temporal truth and metadata
  lifecycleStatus?: string;
  temporalState?: string;
  freshness?: 'fresh' | 'aging' | 'stale';
  confidence?: 'verified' | 'corroborated' | 'single-source';
  lastVerifiedAt?: string;
  sourcesCount?: number;
  whyItMatters?: string;
  featureScore?: number;
}

export default function EventCard({ event }: { event: Event }) {
  const { language } = useLanguage();
  const primaryEntity = event.knowledgeEntities?.[0];

  // Helper for confidence badge
  const getTrustStrip = () => {
    const isEng = language === "en";
    const confidence = event.confidence || "verified";
    const sourcesCount = event.sourcesCount || 2;
    const lastChecked = event.lastVerifiedAt || "10 min ago";

    let label = "";
    let color = "";

    if (confidence === "verified") {
      label = isEng ? `VERIFIED · ${sourcesCount} SOURCES` : `प्रमाणित · ${sourcesCount} स्रोतहरू`;
      color = "text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
    } else if (confidence === "corroborated") {
      label = isEng ? `CORROBORATED · ${sourcesCount} SOURCES` : `पुष्टि गरिएको · ${sourcesCount} स्रोतहरू`;
      color = "text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/5";
    } else {
      label = isEng ? `AGING · LAST VERIFIED ${lastChecked}` : `पूर्व प्रमाणित · ${lastChecked}`;
      color = "text-amber-600/80 dark:text-amber-400/80 border-amber-500/10 bg-amber-500/5";
    }

    return { label, color };
  };

  const getTemporalStateLabel = () => {
    const isEng = language === "en";
    const state = event.temporalState || event.status || "scheduled";
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

  const trust = getTrustStrip();
  const tempStateLabel = getTemporalStateLabel();

  return (
    <Link to={`/events/${event.id}`} className="group block h-full">
      <div className="bg-card rounded-3xl overflow-hidden border border-border-theme transition-all duration-300 hover:shadow-xl hover:border-primary/50 flex flex-col h-full">
        {/* Image Area */}
        <div className="aspect-[16/10] overflow-hidden relative bg-muted-area">
          <img 
            src={event.featuredImage || "/placeholder_event.png"} 
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          {/* Live indicator or Temporal state overlay */}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            {event.isLiveOnNepalHub && (
              <span className="bg-red-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                <Globe size={10} className="animate-spin-slow" /> {language === 'en' ? "Nepal Hub Live" : "नेपाल हब प्रत्यक्ष"}
              </span>
            )}
            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md ${
              (event.temporalState === 'happening-now' || event.status === 'happening-now') 
                ? 'bg-emerald-600 text-white' 
                : (event.temporalState === 'starting-soon' || event.status === 'starting-soon')
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900/80 backdrop-blur-md text-white border border-white/10'
            }`}>
              {tempStateLabel}
            </span>
          </div>

          {primaryEntity && (
            <div className="absolute bottom-3 right-3 bg-purple-950/80 backdrop-blur-md text-purple-200 border border-purple-500/30 text-[9px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1">
              <Sparkles size={9} className="text-purple-400" /> {primaryEntity}
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-6 flex flex-col flex-1 justify-between gap-4">
          <div className="space-y-3">
            {/* Trust strip info */}
            <div className={`px-2.5 py-1 text-[9px] font-black rounded-lg border w-fit uppercase tracking-widest flex items-center gap-1 ${trust.color}`}>
              <ShieldCheck size={10} />
              {trust.label}
            </div>

            <h3 className="text-xl font-black text-card-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
              {event.title}
            </h3>

            {event.whyItMatters && (
              <p className="text-xs text-muted-text font-medium line-clamp-2 italic leading-relaxed pt-1">
                "{event.whyItMatters}"
              </p>
            )}
          </div>

          {/* District / Meta Row */}
          <div className="flex flex-col gap-2 text-xs font-bold text-muted-text pt-4 border-t border-border-theme/60">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-primary" /> 
              <span>{formatDate(event.date, language)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin size={14} className="text-primary shrink-0" /> 
                <span className="truncate">{event.location} {event.district ? `(${event.district})` : ""}</span>
              </div>
              
              {/* Optional Local proximity badge */}
              {event.district && (
                <span className="text-[10px] font-black text-primary/80 uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                  <Compass size={11} /> {language === 'en' ? "Near You" : "नजिकै"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
