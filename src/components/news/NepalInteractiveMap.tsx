import { useState } from "react";
import { Link } from "react-router-dom";
import { provinces } from "@/src/lib/nepalData";
import { 
  MapPin, 
  ArrowRight, 
  BookOpen, 
  Newspaper, 
  CloudSun, 
  Navigation2, 
  Flame, 
  Clock, 
  Users, 
  Sparkles, 
  Building2, 
  Landmark, 
  Compass, 
  X, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Search,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FEATURED_DISTRICT_PROFILES, getDistrictProfile, DistrictProfile } from "@/src/data/exploreNepalData";
import { getKnowledgeNodesByDistrict } from "@/src/data/saraswatiKnowledgeData";
import { useLanguage } from "@/src/context/LanguageContext";

interface NepalInteractiveMapProps {
  onDistrictSelect?: (district: string) => void;
  onOpenKnowledgeNode?: (nodeId: string) => void;
}

export default function NepalInteractiveMap({ onDistrictSelect, onOpenKnowledgeNode }: NepalInteractiveMapProps) {
  const { language } = useLanguage();
  const [selectedProvinceId, setSelectedProvinceId] = useState<number>(3); // Default Bagmati
  const [hoveredProvinceId, setHoveredProvinceId] = useState<number | null>(null);
  const [searchDistrict, setSearchDistrict] = useState("");
  
  // Selected District for Detail Drawer/Modal
  const [activeDistrictProfile, setActiveDistrictProfile] = useState<DistrictProfile | null>(null);
  const [modalTab, setModalTab] = useState<"news" | "history" | "temples" | "festivals" | "tourism" | "businesses" | "nodes">("news");

  const selectedProvince = provinces.find((p) => p.id === selectedProvinceId) || provinces[2];

  // Map Province Paths
  const provincePaths = [
    { id: 7, name: "सुदूरपश्चिम प्रदेश", slug: "sudurpashchim", color: "fill-emerald-500/10 hover:fill-emerald-500/25 stroke-emerald-500/40", activeColor: "fill-emerald-500/30 stroke-emerald-500", path: "M 20,180 L 110,130 L 140,190 L 100,280 L 30,260 Z" },
    { id: 6, name: "कर्णाली प्रदेश", slug: "karnali", color: "fill-blue-500/10 hover:fill-blue-500/25 stroke-blue-500/40", activeColor: "fill-blue-500/30 stroke-blue-500", path: "M 110,130 L 250,110 L 290,180 L 210,270 L 140,190 Z" },
    { id: 5, name: "लुम्बिनी प्रदेश", slug: "lumbini", color: "fill-amber-500/10 hover:fill-amber-500/25 stroke-amber-500/40", activeColor: "fill-amber-500/30 stroke-amber-500", path: "M 140,190 L 210,270 L 350,260 L 380,210 L 290,180 Z" },
    { id: 4, name: "गण्डकी प्रदेश", slug: "gandaki", color: "fill-indigo-500/10 hover:fill-indigo-500/25 stroke-indigo-500/40", activeColor: "fill-indigo-500/30 stroke-indigo-500", path: "M 250,110 L 410,120 L 460,200 L 380,210 L 290,180 Z" },
    { id: 3, name: "बागमती प्रदेश", slug: "bagmati", color: "fill-purple-500/10 hover:fill-purple-500/25 stroke-purple-500/40", activeColor: "fill-purple-500/30 stroke-purple-500", path: "M 410,120 L 580,140 L 590,210 L 480,240 L 460,200 Z" },
    { id: 2, name: "मधेश प्रदेश", slug: "madesh", color: "fill-rose-500/10 hover:fill-rose-500/25 stroke-rose-500/40", activeColor: "fill-rose-500/30 stroke-rose-500", path: "M 480,240 L 590,210 L 710,230 L 680,260 L 540,260 Z" },
    { id: 1, name: "कोशी प्रदेश", slug: "koshi", color: "fill-teal-500/10 hover:fill-teal-500/25 stroke-teal-500/40", activeColor: "fill-teal-500/30 stroke-teal-500", path: "M 580,140 L 780,150 L 790,250 L 710,230 L 590,210 Z" }
  ];

  const handleOpenDistrictModal = (districtName: string) => {
    const profile = getDistrictProfile(districtName);
    setActiveDistrictProfile(profile);
    setModalTab("news");
    if (onDistrictSelect) onDistrictSelect(districtName);
  };

  const trendingDistricts = FEATURED_DISTRICT_PROFILES.filter(d => d.isTrending);

  return (
    <div className="bg-card rounded-[2.5rem] border border-border-theme p-6 lg:p-12 shadow-md flex flex-col gap-12 relative overflow-hidden">
      {/* 1. Full-width Showcase Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-theme/60 pb-8">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xxs font-black tracking-widest uppercase w-fit">
            <Navigation2 size={12} className="rotate-45" />
            <span>नेपाल खोज सञ्जाल (Explore Nepal)</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-black text-card-foreground tracking-tight">
            {language === 'en' ? "Discover Nepal District by District" : "नेपाल खोज सञ्जाल — ७७ जिल्लाको कथा, सम्पदा र समाचार"}
          </h2>
          <p className="text-xs font-bold text-muted-text max-w-3xl leading-relaxed">
            भूगोलबाट इतिहास, स्थानीय समाचार, सम्पदा, धार्मिक तीर्थस्थल र जनचाहनाका मुद्दाहरू सम्म—नेपालका ७ प्रदेश र ७७ जिल्लाको जीवन्त डिजिटल सञ्जाल।
          </p>
        </div>

        {/* Quick District Search Bar */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" />
          <input
            type="text"
            placeholder="जिल्ला खोज्नुहोस् (उदा. मुस्ताङ, काठमाडौँ)..."
            value={searchDistrict}
            onChange={(e) => setSearchDistrict(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchDistrict.trim()) {
                handleOpenDistrictModal(searchDistrict.trim());
              }
            }}
            className="w-full bg-muted-area/20 border border-border-theme rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-card-foreground placeholder:text-muted-text focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* 2. Interactive Map Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-muted-area/10 p-6 lg:p-8 rounded-3xl border border-border-theme/50">
        <div className="lg:col-span-7 flex flex-col gap-3 justify-center bg-card rounded-2xl p-4 border border-border-theme/40 relative group shadow-sm">
          <svg viewBox="0 0 800 360" className="w-full h-auto max-h-[360px] transition-transform duration-500">
            <defs>
              <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-area/40" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" className="rounded-2xl" />

            {provincePaths.map((p) => {
              const isSelected = selectedProvinceId === p.id;
              return (
                <g key={p.id} className="cursor-pointer">
                  <motion.path
                    d={p.path}
                    onClick={() => setSelectedProvinceId(p.id)}
                    onMouseEnter={() => setHoveredProvinceId(p.id)}
                    onMouseLeave={() => setHoveredProvinceId(null)}
                    className={`transition-colors duration-300 stroke-2 linejoin-round ${
                      isSelected ? p.activeColor : p.color
                    }`}
                    whileHover={{ scale: 1.01 }}
                  />
                </g>
              );
            })}

            {/* Labels */}
            {provincePaths.map((p) => {
              const labelCenters: Record<number, { x: number; y: number }> = {
                7: { x: 75, y: 190 }, 6: { x: 190, y: 180 }, 5: { x: 260, y: 220 },
                4: { x: 360, y: 160 }, 3: { x: 490, y: 170 }, 2: { x: 590, y: 240 }, 1: { x: 680, y: 180 }
              };
              const center = labelCenters[p.id];
              const isSelected = selectedProvinceId === p.id;
              return (
                <text
                  key={`label-${p.id}`}
                  x={center.x}
                  y={center.y}
                  textAnchor="middle"
                  onClick={() => setSelectedProvinceId(p.id)}
                  className={`text-[10px] font-black pointer-events-none select-none transition-all ${
                    isSelected ? "fill-primary text-shadow-sm text-[11px]" : "fill-muted-text/80"
                  }`}
                >
                  {p.name.split(" ")[0]}
                </text>
              );
            })}
          </svg>
          <div className="flex justify-between items-center text-[10px] font-bold text-muted-text px-2 pt-2 border-t border-border-theme/30">
            <span>* प्रदेशमा क्लिक गरी जिल्लाहरूको विस्तृत सूची हेर्नुहोस्</span>
            <span className="text-primary font-mono">७ प्रदेश • ७७ जिल्ला</span>
          </div>
        </div>

        {/* Selected Province Info Panel */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-card border border-border-theme/80 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xxs font-black text-primary uppercase tracking-wider block mb-1">
                  Province No. {selectedProvince.id}
                </span>
                <h3 className="text-xl font-extrabold text-card-foreground">
                  {selectedProvince.name}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                <CloudSun size={14} /> २५°C
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-y border-border-theme/40 text-xs">
              <div>
                <span className="text-muted-text block text-xxs font-bold uppercase">जिल्ला संख्या</span>
                <span className="font-black text-card-foreground">{selectedProvince.districts.length} वटा जिल्लाहरू</span>
              </div>
              <div>
                <span className="text-muted-text block text-xxs font-bold uppercase">लाइभ अपडेट</span>
                <span className="font-black text-primary">सक्रिय मिडिया डेस्क</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xxs font-black text-muted-text uppercase tracking-wider">
                जिल्लाको इन्टेलिजेन्स कार्ड खोल्न क्लिक गर्नुहोस्:
              </span>
              <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                {selectedProvince.districts.map((d) => (
                  <button
                    key={d}
                    onClick={() => handleOpenDistrictModal(d)}
                    className="text-xs font-bold px-3 py-2 rounded-xl transition-all border bg-muted-area/20 hover:bg-primary hover:text-white border-border-theme/60 text-card-foreground flex items-center gap-1"
                  >
                    <MapPin size={11} className="text-primary group-hover:text-white" />
                    <span>{d}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 📍 Trending Districts Showcase */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-border-theme/40 pb-3">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-primary animate-pulse" />
            <h3 className="text-lg font-extrabold text-card-foreground">
              📍 ट्रेन्डिङ जिल्लाहरू (Trending Districts)
            </h3>
          </div>
          <span className="text-xxs font-black text-muted-text uppercase tracking-widest">
            उच्च चासो र खोजिएका जिल्लाहरू
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingDistricts.map((district) => (
            <motion.div
              key={district.id}
              whileHover={{ y: -4 }}
              onClick={() => handleOpenDistrictModal(district.nameNepali)}
              className="bg-card border border-border-theme/80 rounded-2xl overflow-hidden cursor-pointer group hover:border-primary/50 transition-all shadow-sm flex flex-col"
            >
              <div className="h-40 relative overflow-hidden">
                <img
                  src={district.heroImage || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=800"}
                  alt={district.nameNepali}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3 bg-primary/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {district.province}
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end text-white">
                  <div>
                    <h4 className="text-xl font-black">{district.nameNepali} ({district.nameEnglish})</h4>
                    <span className="text-xxs font-bold opacity-80 flex items-center gap-1">
                      <MapPin size={10} /> सदरमुकाम: {district.headquarters}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 flex flex-col gap-4 flex-grow justify-between">
                <p className="text-xs text-muted-text font-semibold line-clamp-2 leading-relaxed">
                  {district.overview}
                </p>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-border-theme/40 text-[10px] font-bold text-center bg-muted-area/10 rounded-xl">
                  <div>
                    <span className="text-muted-text block text-[9px]">जनसंख्या</span>
                    <span className="text-card-foreground font-black">{district.population}</span>
                  </div>
                  <div>
                    <span className="text-muted-text block text-[9px]">उचाइ</span>
                    <span className="text-card-foreground font-black">{district.altitude}</span>
                  </div>
                  <div>
                    <span className="text-muted-text block text-[9px]">समाचार</span>
                    <span className="text-primary font-black">{district.latestStoriesCount} वटा</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-black text-primary group-hover:translate-x-1 transition-transform">
                  <span>जिल्ला कार्ड र समाचार खोल्नुहोस्</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 4. District Intelligence Modal / Drawer */}
      <AnimatePresence>
        {activeDistrictProfile && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 lg:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border-theme rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
            >
              {/* Header Banner */}
              <div className="relative h-48 md:h-64 shrink-0 overflow-hidden">
                <img
                  src={activeDistrictProfile.heroImage || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=1200"}
                  alt={activeDistrictProfile.nameNepali}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                
                {/* Close Button */}
                <button
                  onClick={() => setActiveDistrictProfile(null)}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white p-2 rounded-full backdrop-blur-md border border-white/20 transition-all z-10"
                >
                  <X size={18} />
                </button>

                <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4 text-white">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-primary px-3 py-0.5 rounded-full text-xxs font-black uppercase">
                        {activeDistrictProfile.province}
                      </span>
                      <span className="bg-white/20 backdrop-blur-md px-3 py-0.5 rounded-full text-xxs font-black">
                        सदरमुकाम: {activeDistrictProfile.headquarters}
                      </span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black">
                      {activeDistrictProfile.nameNepali} ({activeDistrictProfile.nameEnglish})
                    </h3>
                  </div>

                  {/* District Core Metrics */}
                  <div className="flex items-center gap-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-xs font-mono">
                    <div>
                      <span className="text-[9px] text-gray-300 block uppercase">जनसंख्या</span>
                      <span className="font-black text-white">{activeDistrictProfile.population}</span>
                    </div>
                    <div className="h-6 w-px bg-white/20" />
                    <div>
                      <span className="text-[9px] text-gray-300 block uppercase">उचाइ</span>
                      <span className="font-black text-amber-400">{activeDistrictProfile.altitude}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Tabs */}
              <div className="flex overflow-x-auto bg-muted-area/30 border-b border-border-theme px-6 py-2 gap-2 shrink-0 custom-scrollbar">
                {[
                  { id: "news", label: "📰 समाचार (News)" },
                  { id: "history", label: "🏛 इतिहास (History)" },
                  { id: "temples", label: "🕉 मन्दिर (Temples)" },
                  { id: "festivals", label: "🎉 पर्व (Festivals)" },
                  { id: "tourism", label: "🏔 पर्यटन (Tourism)" },
                  { id: "businesses", label: "🏪 स्थानीय व्यापार" },
                  { id: "nodes", label: "🔗 ज्ञानकोष (Nodes)" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setModalTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                      modalTab === tab.id
                        ? "bg-primary text-white shadow-md"
                        : "bg-card hover:bg-muted-area text-card-foreground border border-border-theme/40"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Modal Body Content */}
              <div className="p-6 md:p-8 overflow-y-auto flex-grow custom-scrollbar space-y-6">
                {modalTab === "news" && (
                  <div className="flex flex-col gap-4">
                    <h4 className="text-base font-black text-card-foreground">
                      {activeDistrictProfile.nameNepali} जिल्लाका ताजा अपडेटहरू
                    </h4>
                    <p className="text-xs text-muted-text leading-relaxed">
                      {activeDistrictProfile.overview}
                    </p>
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-center justify-between">
                      <span className="text-xs font-bold text-card-foreground">
                        यस जिल्लाका सबै समाचार तथा आलेखहरू खोज्नुहोस्
                      </span>
                      <Link
                        to={`/search?q=${encodeURIComponent(activeDistrictProfile.nameNepali)}`}
                        onClick={() => setActiveDistrictProfile(null)}
                        className="bg-primary text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5"
                      >
                        <span>खोज्नुहोस्</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                )}

                {modalTab === "history" && (
                  <div className="flex flex-col gap-4">
                    <h4 className="text-base font-black text-card-foreground">ऐतिहासिक पृष्ठभूमि र सभ्यता</h4>
                    <p className="text-xs text-card-foreground/90 leading-relaxed whitespace-pre-line">
                      {activeDistrictProfile.history}
                    </p>
                  </div>
                )}

                {modalTab === "temples" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeDistrictProfile.majorTemples.map((temple, idx) => (
                      <div key={idx} className="bg-muted-area/20 border border-border-theme p-4 rounded-2xl flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <h5 className="text-sm font-black text-card-foreground">{temple.name}</h5>
                          {temple.heritageStatus && (
                            <span className="bg-sacred/10 text-sacred border border-sacred/20 px-2 py-0.5 rounded-full text-[9px] font-black">
                              {temple.heritageStatus}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-text">{temple.desc}</p>
                      </div>
                    ))}
                  </div>
                )}

                {modalTab === "festivals" && (
                  <div className="space-y-4">
                    {activeDistrictProfile.festivals.map((fest, idx) => (
                      <div key={idx} className="bg-muted-area/20 border border-border-theme p-4 rounded-2xl flex items-start gap-4">
                        <div className="bg-primary/10 text-primary p-3 rounded-xl shrink-0 text-center font-bold">
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-black text-card-foreground">{fest.name}</h5>
                            <span className="text-xxs font-mono text-muted-text">({fest.date})</span>
                          </div>
                          <p className="text-xs text-muted-text mt-1">{fest.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {modalTab === "tourism" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeDistrictProfile.tourismHighlights.map((item, idx) => (
                      <div key={idx} className="bg-muted-area/20 border border-border-theme p-4 rounded-2xl flex flex-col gap-2">
                        <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-full w-fit uppercase">
                          {item.tag}
                        </span>
                        <h5 className="text-sm font-black text-card-foreground">{item.title}</h5>
                        <p className="text-xs text-muted-text">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                )}

                {modalTab === "businesses" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeDistrictProfile.localBusinesses.map((biz, idx) => (
                      <div key={idx} className="bg-muted-area/20 border border-border-theme p-4 rounded-2xl flex justify-between items-center">
                        <div>
                          <h5 className="text-sm font-black text-card-foreground">{biz.name}</h5>
                          <span className="text-xxs font-bold text-muted-text">{biz.type}</span>
                        </div>
                        <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-black">
                          {biz.rating}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {modalTab === "nodes" && (() => {
                  const dynamicNodes = getKnowledgeNodesByDistrict(activeDistrictProfile.nameNepali);
                  return (
                    <div className="flex flex-col gap-4">
                      <h4 className="text-base font-black text-card-foreground">सरस्वती ज्ञान विज्ञान मञ्चसँग जोडिएका नोडहरू (KnowledgeOS Links)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dynamicNodes.map((node) => (
                          <button
                            key={node.id}
                            onClick={() => {
                              setActiveDistrictProfile(null);
                              if (onOpenKnowledgeNode) onOpenKnowledgeNode(node.id);
                            }}
                            className="bg-card border border-border-theme/80 hover:border-sacred p-4 rounded-2xl flex items-center justify-between text-left group transition-all"
                          >
                            <div>
                              <span className="text-[9px] font-black text-sacred uppercase tracking-wider block">
                                {node.categoryNameNepali}
                              </span>
                              <span className="text-sm font-black text-card-foreground group-hover:text-sacred transition-colors">
                                {node.nameNepali} ({node.nameEnglish})
                              </span>
                            </div>
                            <ChevronRight size={16} className="text-sacred group-hover:translate-x-1 transition-transform" />
                          </button>
                        ))}
                        {activeDistrictProfile.relatedKnowledgeNodes.filter(r => !dynamicNodes.some(d => d.id === r.id)).map((node) => (
                          <button
                            key={node.id}
                            onClick={() => {
                              setActiveDistrictProfile(null);
                              if (onOpenKnowledgeNode) onOpenKnowledgeNode(node.id);
                            }}
                            className="bg-card border border-border-theme/80 hover:border-sacred p-4 rounded-2xl flex items-center justify-between text-left group transition-all"
                          >
                            <div>
                              <span className="text-[9px] font-black text-sacred uppercase tracking-wider block">
                                {node.type}
                              </span>
                              <span className="text-sm font-black text-card-foreground group-hover:text-sacred transition-colors">
                                {node.name}
                              </span>
                            </div>
                            <ChevronRight size={16} className="text-sacred group-hover:translate-x-1 transition-transform" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
