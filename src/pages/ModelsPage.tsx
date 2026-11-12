import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Search, Filter, MapPin, Star, ChevronRight, User, Camera, Video, Award } from "lucide-react";
import type { Model, ModelCategory, ModelGender } from "@/src/types";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { Skeleton } from "@/src/components/ui/Skeleton";

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ModelCategory | "All">("All");
  const [selectedGender, setSelectedGender] = useState<ModelGender | "All">("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [heroSettings, setHeroSettings] = useState({
    title: "TALENTS <span class='text-primary'>&</span> PHOTOGRAPHERS",
    subtitle: "Discover Nepal's most talented professional models, creative artists, and photographers for your next big project.",
    backgroundImage: "https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=2070&auto=format&fit=crop",
    badgeText: "Exclusive Discovery"
  });

  useEffect(() => {
    const fetchGlamour = async () => {
      try {
        const snap = await snapshotEngine.getGlamourSnapshot();
        if (snap) {
          if (snap.hero) {
            setHeroSettings({
              title: snap.hero.title || heroSettings.title,
              subtitle: snap.hero.subtitle || heroSettings.subtitle,
              backgroundImage: snap.hero.backgroundImage || heroSettings.backgroundImage,
              badgeText: snap.hero.badgeText || heroSettings.badgeText
            });
          }
          if (Array.isArray(snap.models)) {
            setModels(snap.models as Model[]);
          }
        }
      } catch (error) {
        console.error("Error fetching glamour snapshot:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGlamour();
  }, []);

  const filteredModels = models.filter(model => {
    const nameMatch = model.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const locationMatch = model.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || locationMatch;
    
    const matchesCategory = selectedCategory === "All" || model.category === selectedCategory;
    const matchesGender = selectedGender === "All" || model.gender === selectedGender;
    return matchesSearch && matchesCategory && matchesGender;
  });

  const categories: (ModelCategory | "All")[] = ["All", "Fashion", "Commercial", "Actor", "Influencer", "Kids"];
  const genders: (ModelGender | "All")[] = ["All", "Male", "Female", "Other"];

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-[350px] h-[45vh] flex items-center justify-center overflow-hidden bg-slate-900 px-6 sm:px-12">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroSettings.backgroundImage || null} 
            alt="Glamour Background" 
            className="w-full h-full object-cover opacity-40 pointer-events-none select-none transition-all duration-1000 scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-background" />
        </div>
        
        <div className="container-custom relative z-10 text-center py-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 md:space-y-8"
          >
            <span className="text-primary text-xs sm:text-sm font-black uppercase tracking-[0.4em] block drop-shadow-sm">
              {heroSettings.badgeText}
            </span>
            <h1 
              className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-white tracking-tighter drop-shadow-2xl leading-[0.95] lg:leading-[1] xl:leading-[1.05] break-words"
              dangerouslySetInnerHTML={{ __html: heroSettings.title }}
            />
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-300 font-medium max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto leading-relaxed md:leading-snug drop-shadow-md">
              {heroSettings.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="sticky top-[94px] z-30 bg-background/80 backdrop-blur-xl border-b border-border-theme py-6 transition-all duration-300">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" size={20} />
              <input 
                type="text"
                placeholder="नाम वा ठेगानाबाट खोज्नुहोस्..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-card border border-border-theme rounded-2xl text-sm font-bold text-card-foreground focus:ring-4 focus:ring-primary/10 transition-all outline-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex-shrink-0 p-2.5 rounded-full transition-all ${isFilterOpen ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-muted-area text-muted-text hover:bg-muted-area/80"}`}
              >
                <Filter size={20} />
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-shrink-0 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    selectedCategory === cat 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "bg-muted-area text-muted-text hover:bg-muted-area/80 hover:text-card-foreground"
                  }`}
                >
                  {cat === "Photographer" ? "फोटोग्राफर" : cat}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-6 flex flex-wrap gap-8 border-t border-border-theme mt-6">
                  <div className="flex flex-col gap-3">
                    <span className="text-xxs font-black text-muted-text uppercase tracking-widest">लिङ्ग (Gender)</span>
                    <div className="flex gap-2">
                      {genders.map((g) => (
                        <button
                          key={g}
                          onClick={() => setSelectedGender(g)}
                          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            selectedGender === g 
                              ? "bg-primary text-white shadow-md shadow-primary/10" 
                              : "bg-muted-area text-muted-text hover:text-card-foreground border border-border-theme"
                          }`}
                        >
                          {g === "Male" ? "पुरुष" : g === "Female" ? "महिला" : g === "Other" ? "अन्य" : "सबै"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Models Grid */}
      <section className="py-16">
        <div className="container-custom">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex flex-col gap-4">
                  <Skeleton className="aspect-[3/4] rounded-[2.5rem] bg-muted-area/30" />
                  <Skeleton className="h-6 w-3/4 rounded-lg bg-muted-area/50" />
                  <Skeleton className="h-4 w-1/2 rounded-lg bg-muted-area/20" />
                </div>
              ))}
            </div>
          ) : filteredModels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredModels.map((model, index) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link 
                    to={`/models/${model.id}`}
                    className="group block relative aspect-[3/4] overflow-hidden rounded-[2.5rem] bg-card shadow-sm hover:shadow-2xl transition-all duration-500 border border-border-theme"
                  >
                    <img 
                      src={model.profileImage || null} 
                      alt={model.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 pointer-events-none select-none"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Badges */}
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                      {model.isVerified && (
                        <div className="bg-white/95 backdrop-blur-md p-2 rounded-full shadow-lg">
                          <Award size={14} className="text-primary" />
                        </div>
                      )}
                      {model.category === "Photographer" && (
                        <div className="bg-primary text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                          Artist
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                          {model.category}
                        </span>
                        <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                          {model.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-1.5 text-white/70 text-xs font-bold">
                            <MapPin size={12} /> {model.location}
                          </div>
                          {model.height && (
                            <>
                              <div className="w-1 h-1 bg-white/30 rounded-full" />
                              <div className="text-white/70 text-xs font-bold">
                                {model.height}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-8 flex items-center gap-2 text-white text-xxs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                        View Portfolio <ChevronRight size={14} className="text-primary" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-card rounded-[3rem] border border-border-theme">
              <div className="w-24 h-24 bg-muted-area rounded-full flex items-center justify-center mx-auto mb-8">
                <Search size={40} className="text-muted-text/30" />
              </div>
              <h3 className="text-3xl font-black text-card-foreground tracking-tight">कुनै परिणाम फेला परेन</h3>
              <p className="text-muted-text font-medium mt-3 max-w-sm mx-auto">तपाईले खोज्नुभएको प्रतिभा फेला पार्न फिल्टरहरू परिवर्तन गर्नुहोस्।</p>
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedGender("All");
                }}
                className="mt-10 px-10 py-4 bg-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
              >
                फिल्टरहरू हटाउनुहोस्
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
