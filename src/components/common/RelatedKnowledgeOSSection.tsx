import React, { useState } from "react";
import { 
  Network, 
  Newspaper, 
  Video, 
  Flame, 
  MapPin, 
  BookOpen, 
  Feather, 
  UserCheck, 
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { KnowledgeOSEngine, RelatedKnowledgeBundle } from "@/src/services/knowledgeOS";
import { useLanguage } from "@/src/context/LanguageContext";
import { Link } from "react-router-dom";

interface RelatedKnowledgeOSSectionProps {
  entityType?: "article" | "festival" | "place" | "manuscript" | "store_product" | "general";
  entityIdOrAlias: string;
  titleOverride?: string;
  className?: string;
}

export default function RelatedKnowledgeOSSection({
  entityType = "general",
  entityIdOrAlias,
  titleOverride,
  className = ""
}: RelatedKnowledgeOSSectionProps) {
  const { language } = useLanguage();
  const bundle: RelatedKnowledgeBundle = KnowledgeOSEngine.getRelationshipsForEntity(entityIdOrAlias);
  const entity = bundle.canonicalEntity;
  const res = bundle.resolution;

  const [activeTab, setActiveTab] = useState<
    "news" | "live" | "events" | "places" | "sgis" | "commentary" | "scholars" | "store"
  >("news");

  // Determine non-empty counts
  const counts = {
    news: bundle.newsArticles.length,
    live: bundle.liveVideos.length,
    events: bundle.events.length,
    places: bundle.places.length,
    sgis: bundle.sgisTexts.length,
    commentary: bundle.scholarCommentaries.length,
    scholars: bundle.scholars.length,
    store: bundle.storeProducts.length
  };

  return (
    <div className={`p-6 sm:p-8 rounded-3xl bg-card border-2 border-primary/20 shadow-xl space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <Network size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                KnowledgeOS Engine v3.0
              </span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <ShieldCheck size={12} /> Verified Graph
              </span>
              {res && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  res.confidence >= 0.90 
                    ? "bg-emerald-500/10 text-emerald-600" 
                    : res.confidence >= 0.70 
                    ? "bg-amber-500/10 text-amber-600" 
                    : "bg-red-500/10 text-red-500"
                }`}>
                  Match Confidence: {Math.round(res.confidence * 100)}% ({res.matchType})
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-card-foreground">
              {titleOverride || (entity ? `सम्बन्धित सामग्री: ${entity.canonicalNameNp}` : "सम्बन्धित ज्ञानकोष सामग्री")}
            </h3>
          </div>
        </div>

        {entity && (
          <Link
            to={`/knowledge?node=${entity.id}`}
            className="px-4 py-2 rounded-xl bg-muted-area hover:bg-primary/10 text-primary border border-primary/20 text-xs font-black transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>ज्ञानकोषमा हेर्नुहोस्</span>
            <ChevronRight size={14} />
          </Link>
        )}
      </div>

      {/* Domain Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "news", label: "समाचार", count: counts.news, icon: Newspaper },
          { id: "live", label: "पावन भिडियो", count: counts.live, icon: Video },
          { id: "events", label: "पर्व / उत्सव", count: counts.events, icon: Flame },
          { id: "places", label: "पावन स्थल", count: counts.places, icon: MapPin },
          { id: "sgis", label: "शास्त्र र पाण्डुलिपि", count: counts.sgis, icon: BookOpen },
          { id: "commentary", label: "विद्वत् टीका", count: counts.commentary, icon: Feather },
          { id: "scholars", label: "विद्वान्", count: counts.scholars, icon: UserCheck },
          { id: "store", label: "पुस्तक र सामग्री", count: counts.store, icon: ShoppingBag }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-muted-area/60 text-muted-text hover:text-card-foreground border border-border-theme/60"
              }`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? "bg-white/20 text-white" : "bg-card text-muted-text"
              }`}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Rendering */}
      <div className="min-h-[160px]">
        {/* NEWS */}
        {activeTab === "news" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bundle.newsArticles.length > 0 ? (
              bundle.newsArticles.map(a => (
                <div key={a.id} className="p-4 rounded-2xl bg-muted-area/40 border border-border-theme/60 hover:border-primary/40 transition-all space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">{a.category} • {a.date}</span>
                  <h4 className="text-sm font-bold text-card-foreground line-clamp-2">{a.title}</h4>
                  <p className="text-xs text-muted-text line-clamp-2">{a.excerpt}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-text italic">यस शीर्षकमा थप समाचार उपलब्ध छैन।</p>
            )}
          </div>
        )}

        {/* LIVE VIDEOS */}
        {activeTab === "live" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bundle.liveVideos.length > 0 ? (
              bundle.liveVideos.map(v => (
                <div key={v.id} className="p-4 rounded-2xl bg-muted-area/40 border border-border-theme/60 space-y-2">
                  <span className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1">
                    <Video size={12} /> Live Broadcast
                  </span>
                  <h4 className="text-sm font-bold text-card-foreground">{v.title}</h4>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-text italic">यस विषयसँग जोडिएका प्रत्यक्ष प्रसारण भिडियो उपलब्ध छैन।</p>
            )}
          </div>
        )}

        {/* EVENTS */}
        {activeTab === "events" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bundle.events.length > 0 ? (
              bundle.events.map(e => (
                <div key={e.id} className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                  <span className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-1">
                    <Flame size={12} /> {e.date}
                  </span>
                  <h4 className="text-sm font-black text-card-foreground">{e.nameNp}</h4>
                  <p className="text-xs text-muted-text">{e.location}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-text italic">यस क्षेत्रसँग जोडिएका विशेष सांस्कृतिक पर्व उपलब्ध छैन।</p>
            )}
          </div>
        )}

        {/* PLACES */}
        {activeTab === "places" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {bundle.places.length > 0 ? (
              bundle.places.map(p => (
                <div key={p.id} className="p-3 rounded-2xl bg-muted-area/50 border border-border-theme flex items-center gap-3">
                  <MapPin size={18} className="text-primary" />
                  <div>
                    <h5 className="text-xs font-black text-card-foreground">{p.nameNp}</h5>
                    <span className="text-[10px] text-muted-text">{p.district}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-text italic">सम्बद्ध भौगोलिक स्थानहरू सूचीकृत छैनन्।</p>
            )}
          </div>
        )}

        {/* SGIS TEXTS */}
        {activeTab === "sgis" && (
          <div className="space-y-3">
            {bundle.sgisTexts.length > 0 ? (
              bundle.sgisTexts.map(s => (
                <div key={s.id} className="p-4 rounded-2xl bg-sacred/5 border border-sacred/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-sacred uppercase tracking-wider">{s.verseReference}</span>
                    <span className="text-[9px] font-bold text-muted-text">SGIS Canonical Graph</span>
                  </div>
                  <p className="text-xs font-black text-sacred font-sanskrit">{s.titleSanskrit}</p>
                  <p className="text-xs text-card-foreground font-medium">{s.excerpt}</p>
                  {s.relationshipRationale && (
                    <div className="p-2 rounded-xl bg-sacred/10 border border-sacred/20 text-[11px] font-bold text-sacred flex items-center gap-1.5">
                      <span>🔗</span>
                      <span>{s.relationshipRationale}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-text italic">यस विषयसँग जोडिएका पाण्डुलिपि वा श्लोकहरू SGIS सङ्ग्रहमा भेटिएनन्।</p>
            )}
          </div>
        )}

        {/* SCHOLAR COMMENTARIES */}
        {activeTab === "commentary" && (
          <div className="space-y-3">
            {bundle.scholarCommentaries.length > 0 ? (
              bundle.scholarCommentaries.map(c => (
                <div key={c.id} className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-1">
                  <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">{c.scholarName} ({c.tradition})</span>
                  <p className="text-xs text-card-foreground italic">"{c.textNp}"</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-text italic">विद्वत् टीका तथा भाष्यहरू उपलब्ध छैनन्।</p>
            )}
          </div>
        )}

        {/* SCHOLARS */}
        {activeTab === "scholars" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bundle.scholars.map(sc => (
              <div key={sc.id} className="p-4 rounded-2xl bg-muted-area/40 border border-border-theme space-y-1">
                <span className="text-[10px] font-black text-primary uppercase">{sc.era}</span>
                <h4 className="text-sm font-bold text-card-foreground">{sc.nameNp}</h4>
                <p className="text-xs text-muted-text">{sc.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* STORE PRODUCTS */}
        {activeTab === "store" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {bundle.storeProducts.length > 0 ? (
              bundle.storeProducts.map(p => (
                <Link key={p.id} to="/store" className="p-3 rounded-2xl bg-muted-area/50 border border-border-theme hover:border-emerald-500/50 transition-all flex items-center gap-3 group">
                  <img src={p.image || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200"} alt={p.nameNp} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <h5 className="text-xs font-bold text-card-foreground group-hover:text-emerald-600 transition-colors line-clamp-1">{p.nameNp}</h5>
                    <span className="text-xs font-black text-emerald-600">रु. {p.price}</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-xs text-muted-text italic">सनातन स्टोरमा कुनै पुस्तक वा सामग्री उपलब्ध छैन।</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
