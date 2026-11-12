import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, safeOnSnapshot as onSnapshot, doc, deleteDoc, addDoc, updateDoc, setDoc, serverTimestamp } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Search, Edit2, Trash2, MoreVertical, 
  MapPin, Award, Star, Filter, X, Upload, 
  Camera, User, Ruler, Weight, Globe, CheckCircle2,
  Save
} from "lucide-react";
import type { Model, ModelCategory, ModelGender, GalleryImage } from "@/src/types";
import { toast } from "sonner";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import AdminLayout from "@/src/components/layout/AdminLayout";

export default function AdminModels() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"talents" | "hero">("talents");
  const [heroSettings, setHeroSettings] = useState({
    title: "TALENTS <span class='text-primary'>&</span> PHOTOGRAPHERS",
    subtitle: "Discover Nepal's most talented professional models, creative artists, and photographers for your next big project.",
    backgroundImage: "https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=2070&auto=format&fit=crop",
    badgeText: "Exclusive Discovery"
  });
  const [isSavingHero, setIsSavingHero] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    profileImage: "",
    coverImages: [] as string[],
    category: "Fashion" as ModelCategory,
    gender: "Female" as ModelGender,
    location: "Kathmandu",
    bio: "",
    age: 20,
    height: "5'7\"",
    weight: "55kg",
    experienceYears: 2,
    languages: [] as string[],
    skills: [] as string[],
    isVerified: false,
    isFeatured: false,
    gallery: [] as GalleryImage[]
  });

  useEffect(() => {
    // Fetch Hero Settings
    const unsubHero = onSnapshot(doc(db, "settings", "glamour_hero"), (dns) => {
      if (dns.exists()) {
        const data = dns.data();
        setHeroSettings({
          title: data.title || heroSettings.title,
          subtitle: data.subtitle || heroSettings.subtitle,
          backgroundImage: data.backgroundImage || heroSettings.backgroundImage,
          badgeText: data.badgeText || heroSettings.badgeText
        });
      }
    });

    const q = query(collection(db, "models"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const modelsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Model));
      setModels(modelsData);
      setLoading(false);
    });
    return () => {
      unsubscribe();
      unsubHero();
    };
  }, []);

  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingHero(true);
    try {
      await setDoc(doc(db, "settings", "glamour_hero"), {
        ...heroSettings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast.success("Hero section updated successfully");
    } catch (err: any) {
      console.error("Error saving hero:", err);
      toast.error("Failed to update hero section: " + err.message);
    } finally {
      setIsSavingHero(false);
    }
  };

  const handleOpenModal = (model?: Model) => {
    if (model) {
      setEditingModel(model);
      setFormData({
        name: model.name,
        profileImage: model.profileImage,
        coverImages: model.coverImages || [],
        category: model.category,
        gender: model.gender,
        location: model.location,
        bio: model.bio || "",
        age: model.age || 20,
        height: model.height || "5'7\"",
        weight: model.weight || "55kg",
        experienceYears: model.experienceYears || 2,
        languages: model.languages || [],
        skills: model.skills || [],
        isVerified: !!model.isVerified,
        isFeatured: !!model.isFeatured,
        gallery: model.gallery || []
      });
    } else {
      setEditingModel(null);
      setFormData({
        name: "",
        profileImage: "",
        coverImages: [],
        category: "Fashion",
        gender: "Female",
        location: "Kathmandu",
        bio: "",
        age: 20,
        height: "5'7\"",
        weight: "55kg",
        experienceYears: 2,
        languages: ["Nepali", "English"],
        skills: ["Posing", "Acting"],
        isVerified: false,
        isFeatured: false,
        gallery: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingModel) {
        await updateDoc(doc(db, "models", editingModel.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        toast.success("Model updated successfully");
      } else {
        await addDoc(collection(db, "models"), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success("Model added successfully");
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving model:", err);
      toast.error("Failed to save model");
    }
  };

  const handleDelete = async () => {
    if (!modelToDelete) return;
    try {
      await deleteDoc(doc(db, "models", modelToDelete));
      toast.success("Model deleted successfully");
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error("Error deleting model:", err);
      toast.error("Failed to delete model");
    }
  };

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
            <div>
              <h1 className="text-4xl font-black text-card-foreground tracking-tighter">Talents & Artists</h1>
              <p className="text-muted-text font-medium">Manage professional model profiles, kids, and artists/photographers.</p>
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
              <Plus size={20} /> Add New Talent
            </button>
          </div>

          <div className="flex gap-4 mb-8 border-b border-border-theme pb-8">
            <button 
              onClick={() => setActiveTab("talents")}
              className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === "talents" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-muted text-muted-text hover:bg-muted/80"}`}
            >
              Talents List
            </button>
            <button 
              onClick={() => setActiveTab("hero")}
              className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === "hero" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-muted text-muted-text hover:bg-muted/80"}`}
            >
              Edit Hero Section
            </button>
          </div>

          {activeTab === "talents" ? (
            <>
              {/* Filters & Search */}
              <div className="bg-card p-4 rounded-3xl shadow-sm border border-border-theme mb-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" size={20} />
              <input 
                type="text"
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-muted-area border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all text-card-foreground placeholder:text-muted-text/50"
              />
            </div>
            <div className="flex gap-2">
              <button className="p-3 bg-muted-area text-muted-text rounded-2xl hover:bg-muted transition-colors">
                <Filter size={20} />
              </button>
            </div>
          </div>

              {/* Models Table/Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-64 bg-card rounded-3xl animate-pulse border border-border-theme" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredModels.map((model) => (
                    <motion.div 
                      layout
                      key={model.id}
                      className="bg-card rounded-[32px] overflow-hidden shadow-sm border border-border-theme group hover:shadow-xl transition-all duration-500"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={model.profileImage} 
                          alt={model.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 right-4 flex gap-2">
                          <button 
                            onClick={() => handleOpenModal(model)}
                            className="p-2 bg-card/90 backdrop-blur-md text-card-foreground rounded-xl shadow-lg hover:bg-primary hover:text-white transition-all border border-border-theme"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              setModelToDelete(model.id);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-2 bg-card/90 backdrop-blur-md text-red-600 rounded-xl shadow-lg hover:bg-red-600 hover:text-white transition-all border border-border-theme"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="absolute bottom-4 left-4 flex gap-2">
                          {model.isVerified && (
                            <div className="bg-primary text-white p-1.5 rounded-full shadow-lg">
                              <Award size={12} />
                            </div>
                          )}
                          {model.isFeatured && (
                            <div className="bg-accent text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                              Featured
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex flex-col gap-1 mb-4">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest">{model.category}</span>
                          <h3 className="text-xl font-black text-card-foreground tracking-tight">{model.name}</h3>
                          <div className="flex items-center gap-2 text-muted-text text-xs font-bold">
                            <MapPin size={12} /> {model.location}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-4 border-y border-border-theme/30 mb-4">
                          <div className="text-center">
                            <p className="text-[10px] font-black text-muted-text uppercase tracking-widest">Height</p>
                            <p className="text-xs font-bold text-card-foreground">{model.height}</p>
                          </div>
                          <div className="text-center border-x border-border-theme/30">
                            <p className="text-[10px] font-black text-muted-text uppercase tracking-widest">Age</p>
                            <p className="text-xs font-bold text-card-foreground">{model.age}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-black text-muted-text uppercase tracking-widest">Exp</p>
                            <p className="text-xs font-bold text-card-foreground">{model.experienceYears}y</p>
                          </div>
                        </div>

                        <Link 
                          to={`/models/${model.id}`}
                          target="_blank"
                          className="w-full py-3 bg-muted-area text-card-foreground rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-muted transition-colors block text-center border border-border-theme"
                        >
                          View Public Profile
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          ) : (
             <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card p-8 md:p-12 rounded-[40px] border border-border-theme shadow-sm"
            >
              <form onSubmit={handleSaveHero} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-primary uppercase tracking-widest border-b border-border-theme pb-2">Appearance Settings</h3>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Hero Badge Text</label>
                    <input 
                      type="text"
                      value={heroSettings.badgeText}
                      onChange={(e) => setHeroSettings({...heroSettings, badgeText: e.target.value})}
                      className="w-full px-5 py-4 bg-muted-area border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all text-card-foreground placeholder:text-muted-text/50"
                      placeholder="e.g. Exclusive Discovery"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Background Image URL</label>
                    <input 
                      type="url"
                      value={heroSettings.backgroundImage}
                      onChange={(e) => setHeroSettings({...heroSettings, backgroundImage: e.target.value})}
                      className="w-full px-5 py-4 bg-muted-area border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all text-card-foreground placeholder:text-muted-text/50"
                      placeholder="https://..."
                    />
                    {heroSettings.backgroundImage && (
                      <div className="mt-4 aspect-video rounded-2xl overflow-hidden border border-border-theme">
                        <img src={heroSettings.backgroundImage || null} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-black text-primary uppercase tracking-widest border-b border-border-theme pb-2">Content Settings</h3>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Hero Title (HTML Supported)</label>
                    <textarea 
                      value={heroSettings.title}
                      onChange={(e) => setHeroSettings({...heroSettings, title: e.target.value})}
                      className="w-full px-5 py-4 bg-muted-area border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px] text-card-foreground placeholder:text-muted-text/50"
                      placeholder="e.g. TALENTS <span class='text-primary'>&</span> PHOTOGRAPHERS"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Hero Subtitle</label>
                    <textarea 
                      value={heroSettings.subtitle}
                      onChange={(e) => setHeroSettings({...heroSettings, subtitle: e.target.value})}
                      className="w-full px-5 py-4 bg-muted-area border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px] text-card-foreground placeholder:text-muted-text/50"
                      placeholder="Hero description text..."
                    />
                  </div>

                  <div className="pt-6">
                    <button 
                      type="submit"
                      disabled={isSavingHero}
                      className="w-full py-5 bg-card-foreground text-background dark:bg-primary dark:text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-card-foreground/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-border-theme dark:border-none"
                    >
                      {isSavingHero ? "Saving Changes..." : <><Save size={18} /> Save Hero Section</>}
                    </button>
                  </div>
                </div>
              </form>

              {/* Preview Box */}
              <div className="mt-12">
                <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4">Real-time Preview</h3>
                <div className="relative h-64 rounded-[40px] overflow-hidden bg-slate-900 flex items-center justify-center">
                   <img 
                    src={heroSettings.backgroundImage} 
                    className="absolute inset-0 w-full h-full object-cover opacity-40" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 to-slate-900" />
                  <div className="relative z-10 text-center px-8">
                     <span className="text-[8px] font-black text-primary uppercase tracking-[0.4em] mb-2 block">{heroSettings.badgeText}</span>
                     <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter" dangerouslySetInnerHTML={{ __html: heroSettings.title }} />
                     <p className="text-[10px] text-slate-300 font-medium max-w-lg mt-2 line-clamp-2">{heroSettings.subtitle}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-card rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-border-theme"
            >
              <div className="p-8 border-b border-border-theme flex items-center justify-between bg-card sticky top-0 z-10">
                <div>
                  <h2 className="text-2xl font-black text-card-foreground tracking-tight">
                    {editingModel ? "Edit Model Profile" : "Add New Model"}
                  </h2>
                  <p className="text-muted-text text-sm font-medium">Fill in the professional details for the model.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-muted-text hover:text-card-foreground transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-8">
                <form id="model-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Basic Info */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-primary uppercase tracking-widest border-b border-border-theme pb-2">Basic Information</h3>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Full Name</label>
                      <input 
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 bg-muted-area border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all text-card-foreground placeholder:text-muted-text/50"
                        placeholder="Model Name"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Category</label>
                        <select 
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value as ModelCategory})}
                          className="w-full px-4 py-3 bg-muted-area border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all text-card-foreground"
                        >
                          <option value="Fashion">Fashion Model</option>
                          <option value="Commercial">Commercial/Ads</option>
                          <option value="Actor">Actor/Actress</option>
                          <option value="Influencer">Social Influencer</option>
                          <option value="Kids">Child Talent</option>
                          <option value="Photographer">Photographer/Artist</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Gender</label>
                        <select 
                          value={formData.gender}
                          onChange={(e) => setFormData({...formData, gender: e.target.value as ModelGender})}
                          className="w-full px-4 py-3 bg-muted-area border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all text-card-foreground"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Location</label>
                      <input 
                        required
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="w-full px-4 py-3 bg-muted-area border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all text-card-foreground placeholder:text-muted-text/50"
                        placeholder="e.g. Kathmandu, Nepal"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Biography</label>
                      <textarea 
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        className="w-full px-4 py-3 bg-muted-area border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px] text-card-foreground placeholder:text-muted-text/50"
                        placeholder="Professional bio..."
                      />
                    </div>
                  </div>

                  {/* Physical Stats & Media */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-primary uppercase tracking-widest border-b border-border-theme pb-2">Physical Stats & Media</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Height</label>
                        <input 
                          type="text"
                          value={formData.height}
                          onChange={(e) => setFormData({...formData, height: e.target.value})}
                          className="w-full px-4 py-3 bg-muted-area border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all text-card-foreground placeholder:text-muted-text/50"
                          placeholder={`e.g. 5'7"`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Weight</label>
                        <input 
                          type="text"
                          value={formData.weight}
                          onChange={(e) => setFormData({...formData, weight: e.target.value})}
                          className="w-full px-4 py-3 bg-muted-area border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all text-card-foreground placeholder:text-muted-text/50"
                          placeholder="e.g. 55kg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Age</label>
                        <input 
                          type="number"
                          value={formData.age}
                          onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})}
                          className="w-full px-4 py-3 bg-muted-area border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all text-card-foreground"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Experience (Years)</label>
                        <input 
                          type="number"
                          value={formData.experienceYears}
                          onChange={(e) => setFormData({...formData, experienceYears: parseInt(e.target.value)})}
                          className="w-full px-4 py-3 bg-muted-area border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all text-card-foreground"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Profile Image URL</label>
                      <input 
                        required
                        type="url"
                        value={formData.profileImage}
                        onChange={(e) => setFormData({...formData, profileImage: e.target.value})}
                        className="w-full px-4 py-3 bg-muted-area border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all text-card-foreground placeholder:text-muted-text/50"
                        placeholder="https://..."
                      />
                    </div>

                    <div className="flex flex-wrap gap-6 text-card-foreground">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${formData.isVerified ? "bg-primary border-primary" : "border-border-theme group-hover:border-primary"}`}>
                          {formData.isVerified && <CheckCircle2 size={14} className="text-white" />}
                        </div>
                        <input 
                          type="checkbox"
                          className="hidden"
                          checked={formData.isVerified}
                          onChange={(e) => setFormData({...formData, isVerified: e.target.checked})}
                        />
                        <span className="text-xs font-bold">Verified Professional</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${formData.isFeatured ? "bg-accent border-accent" : "border-border-theme group-hover:border-accent"}`}>
                          {formData.isFeatured && <Star size={14} className="text-white" />}
                        </div>
                        <input 
                          type="checkbox"
                          className="hidden"
                          checked={formData.isFeatured}
                          onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                        />
                        <span className="text-xs font-bold">Featured Model</span>
                      </label>
                    </div>

                    {/* Gallery Management */}
                    <div className="space-y-4 pt-4">
                      <h3 className="text-xs font-black text-primary uppercase tracking-widest border-b border-border-theme pb-2">Portfolio Gallery</h3>
                      <div className="flex gap-2">
                        <input 
                          type="url"
                          id="new-gallery-image"
                          className="flex-grow px-4 py-3 bg-muted-area border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all text-card-foreground placeholder:text-muted-text/50"
                          placeholder="Image URL..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget;
                              const url = input.value.trim();
                              if (url) {
                                setFormData({
                                  ...formData,
                                  gallery: [...formData.gallery, { id: crypto.randomUUID(), url, createdAt: new Date() }]
                                });
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('new-gallery-image') as HTMLInputElement;
                            const url = input.value.trim();
                            if (url) {
                               setFormData({
                                 ...formData,
                                 gallery: [...formData.gallery, { id: crypto.randomUUID(), url, createdAt: new Date() }]
                               });
                               input.value = '';
                            }
                          }}
                          className="p-3 bg-primary text-white rounded-xl hover:scale-105 transition-transform"
                        >
                          <Plus size={20} />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {formData.gallery.map((img, idx) => (
                          <div key={img.id} className="relative group aspect-square rounded-2xl overflow-hidden border border-border-theme">
                            <img src={img.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <button 
                              type="button"
                              onClick={() => {
                                const newGallery = [...formData.gallery];
                                newGallery.splice(idx, 1);
                                setFormData({...formData, gallery: newGallery});
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-8 border-t border-border-theme bg-muted-area flex justify-end gap-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 text-muted-text font-black uppercase tracking-widest hover:text-card-foreground transition-colors"
                >
                  Cancel
                </button>
                <button 
                  form="model-form"
                  type="submit"
                  className="px-10 py-3 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                >
                  {editingModel ? "Save Changes" : "Add Talent"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Model"
        message="Are you sure you want to delete this model profile? This action cannot be undone."
        confirmText="Delete"
      />
      </div>
    </AdminLayout>
  );
}
