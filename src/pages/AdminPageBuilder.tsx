import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { Save, GripVertical, Plus, Trash2, LayoutTemplate, X } from "lucide-react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import type { Category } from "@/src/types";
import { mergeWithCanonicalCategories } from "@/src/utils/categorySeedHelper";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { CANONICAL_CATEGORIES } from "@/src/constants/categories";

interface Section {
  id: string;
  type: string;
  title?: string;
  categoryId?: string;
  adPosition?: string;
}

const DEFAULT_SECTIONS: Section[] = [
  { id: "featured_slider", type: "slider", title: "Featured News" },
  { id: "most_read", type: "most_read", "title": "Most Read" },
  { id: "latest_news", type: "latest_news", "title": "Latest News" },
  { id: "multimedia", type: "multimedia", "title": "Multimedia Zone" },
];

export default function AdminPageBuilder() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState<{ show: boolean, type: string }>({ show: false, type: '' });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAdPosition, setSelectedAdPosition] = useState('homepage_mid');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "settings", "homepage_layout");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().sections) {
          setSections(docSnap.data().sections);
        } else {
          setSections(DEFAULT_SECTIONS);
        }

        const catQ = query(collection(db, "categories"), orderBy("order", "asc"));
        const catSnap = await getDocs(catQ);
        const fetched = catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
        const dynamic = snapshotEngine.getDynamicCategories();
        setCategories(mergeWithCanonicalCategories(fetched, dynamic));
      } catch (error) {
        console.error("Error fetching data:", error);
        setCategories(CANONICAL_CATEGORIES as any);
        toast.error("डेटा लोड गर्न समस्या भयो");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSections(items);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "homepage_layout"), { sections });
      toast.success("लेआउट सुरक्षित गरियो");
    } catch (error) {
      console.error("Error saving layout:", error);
      toast.error("लेआउट सुरक्षित गर्न समस्या भयो");
    } finally {
      setSaving(false);
    }
  };

  const addSection = (type: string) => {
    if (type === 'category' || type === 'ad_banner') {
      setShowModal({ show: true, type });
      return;
    }

    const newSection: Section = {
      id: `${type}_${Date.now()}`,
      type,
      title: `New ${type}`,
    };
    setSections([...sections, newSection]);
  };

  const confirmAddSection = () => {
    if (showModal.type === 'category' && !selectedCategory) {
      toast.error("कृपया विधा छान्नुहोस्");
      return;
    }

    const newSection: Section = {
      id: `${showModal.type}_${Date.now()}`,
      type: showModal.type,
      title: showModal.type === 'category' ? categories.find(c => c.slug === selectedCategory)?.nameNepali : `Ad Banner`,
      categoryId: showModal.type === 'category' ? selectedCategory : undefined,
      adPosition: showModal.type === 'ad_banner' ? selectedAdPosition : undefined,
    };

    setSections([...sections, newSection]);
    setShowModal({ show: false, type: '' });
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const getSectionName = (type: string) => {
    switch (type) {
      case 'slider': return 'Featured Slider';
      case 'most_read': return 'Most Read';
      case 'latest_news': return 'Latest News';
      case 'category': return 'Category Block';
      case 'multimedia': return 'Multimedia Zone';
      case 'ad_banner': return 'Ad Banner';
      default: return type;
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <header className="flex items-center justify-between mb-12">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-card-foreground tracking-tight flex items-center gap-3">
              <LayoutTemplate className="text-primary" /> पेज बिल्डर
            </h1>
            <p className="text-sm font-medium text-muted-text">गृहपृष्ठको लेआउट ड्र्याग र ड्रप गरेर मिलाउनुहोस्।</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform disabled:opacity-50"
          >
            <Save size={20} /> {saving ? "सुरक्षित गर्दै..." : "सुरक्षित गर्नुहोस्"}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-card rounded-[2.5rem] shadow-sm border border-border-theme p-8">
              <h3 className="text-xl font-black text-card-foreground mb-6 uppercase tracking-tight">सक्रिय सेक्सनहरू</h3>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="sections">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-4">
                      {sections.map((section, index) => (
                        <Draggable key={section.id} draggableId={section.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="flex items-center justify-between bg-muted-area p-4 rounded-2xl border border-border-theme group"
                            >
                              <div className="flex items-center gap-4">
                                <div {...provided.dragHandleProps} className="p-2 text-muted-text hover:text-primary cursor-grab active:cursor-grabbing">
                                  <GripVertical size={20} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-card-foreground">{getSectionName(section.type)}</span>
                                  <span className="text-xs text-muted-text">{section.title || section.categoryId || section.adPosition || 'No details'}</span>
                                </div>
                              </div>
                              <button 
                                onClick={() => removeSection(section.id)}
                                className="p-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-card rounded-[2.5rem] shadow-sm border border-border-theme p-8 sticky top-8">
              <h3 className="text-xl font-black text-card-foreground mb-6 uppercase tracking-tight">सेक्सन थप्नुहोस्</h3>
              <div className="flex flex-col gap-3">
                {['category', 'ad_banner', 'multimedia', 'slider', 'latest_news', 'most_read'].map((type) => (
                  <button
                    key={type}
                    onClick={() => addSection(type)}
                    className="flex items-center justify-between p-4 rounded-2xl border border-border-theme hover:border-primary hover:bg-primary/5 transition-colors text-left group"
                  >
                    <span className="font-bold text-muted-text group-hover:text-primary">{getSectionName(type)}</span>
                    <Plus size={18} className="text-muted-text/30 group-hover:text-primary" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal.show && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
              onClick={() => setShowModal({ show: false, type: '' })}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-card rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl flex flex-col gap-6 border border-border-theme"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight">
                  {showModal.type === 'category' ? 'विधा छान्नुहोस्' : 'विज्ञापन स्थान छान्नुहोस्'}
                </h3>
                <button 
                  onClick={() => setShowModal({ show: false, type: '' })}
                  className="p-2 text-muted-text hover:bg-muted-area rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {showModal.type === 'category' ? (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-muted-text uppercase tracking-widest">विधा</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-muted-area border border-border-theme rounded-2xl py-3 px-4 text-sm font-medium text-card-foreground focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                  >
                    <option value="" className="bg-card">विधा छान्नुहोस्...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.slug} className="bg-card">{cat.nameNepali}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-muted-text uppercase tracking-widest">स्थान</label>
                  <select
                    value={selectedAdPosition}
                    onChange={(e) => setSelectedAdPosition(e.target.value)}
                    className="w-full bg-muted-area border border-border-theme rounded-2xl py-3 px-4 text-sm font-medium text-card-foreground focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                  >
                    <option value="hero_slider" className="bg-card">Hero Slider Ad</option>
                    <option value="homepage_top" className="bg-card">Homepage Top</option>
                    <option value="homepage_mid" className="bg-card">Homepage Mid</option>
                    <option value="homepage_bottom" className="bg-card">Homepage Bottom</option>
                  </select>
                </div>
              )}

              <button
                onClick={confirmAddSection}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                थप्नुहोस्
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
