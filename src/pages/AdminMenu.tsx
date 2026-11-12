import { useState, useEffect } from "react";
import { collection, query, orderBy, safeOnSnapshot as onSnapshot, doc, deleteDoc, addDoc, updateDoc, setDoc, serverTimestamp, getDocs } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { offlineQueue } from "@/src/lib/offlineQueue";
import { motion, AnimatePresence } from "motion/react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  Plus, Edit2, Trash2, X, Save, ChevronUp, ChevronDown,
  Globe, MapPin, Tag, GripVertical, Eye, EyeOff, Layers, CheckCircle, Navigation
} from "lucide-react";
import type { MenuItem, MenuItemType, Category } from "@/src/types";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { toast } from "sonner";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { provinces } from "@/src/lib/nepalData";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { mergeWithCanonicalCategories } from "@/src/utils/categorySeedHelper";
import { CANONICAL_CATEGORIES } from "@/src/constants/categories";

type PlacementType = "all" | "header" | "hamburger" | "footer";

export default function AdminMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [filterPlacement, setFilterPlacement] = useState<string>("all");

  const [formData, setFormData] = useState({
    label: "",
    path: "",
    type: "custom" as MenuItemType,
    placement: "all" as PlacementType,
    order: 0,
    isActive: true,
    parentId: ""
  });

  useEffect(() => {
    const q = query(collection(db, "menuItems"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const rawItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      const map = new Map<string, MenuItem>();
      const pathMap = new Map<string, string>();

      rawItems.forEach(item => {
        const key = item.id;
        if (!key) return;
        const path = item.path ? item.path.trim().toLowerCase() : "";
        if (path && pathMap.has(path)) {
          const existingKey = pathMap.get(path)!;
          map.set(existingKey, { ...map.get(existingKey), ...item });
        } else {
          map.set(key, item);
          if (path) pathMap.set(path, key);
        }
      });

      const items = Array.from(map.values());
      // Ensure order index is sorted properly
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setMenuItems(items);
      setLoading(false);
    });

    const fetchCategories = async () => {
      try {
        const catSnap = await getDocs(collection(db, "categories"));
        const fetched = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        const dynamic = snapshotEngine.getDynamicCategories();
        const merged = mergeWithCanonicalCategories(fetched, dynamic);
        setCategories(merged);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories(CANONICAL_CATEGORIES as any);
      }
    };

    fetchCategories();
    return () => unsub();
  }, []);

  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        label: item.label,
        path: item.path,
        type: item.type,
        placement: item.placement || "all",
        order: item.order ?? menuItems.length,
        isActive: item.isActive ?? true,
        parentId: item.parentId || ""
      });
    } else {
      setEditingItem(null);
      setFormData({
        label: "",
        path: "",
        type: "custom",
        placement: "all",
        order: menuItems.length,
        isActive: true,
        parentId: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetMenuId = editingItem ? editingItem.id : `menu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const payload = {
        ...formData,
        updatedAt: new Date().toISOString()
      };

      if (editingItem) {
        try {
          await updateDoc(doc(db, "menuItems", editingItem.id), payload);
          toast.success("मेनु आइटम अद्यावधिक गरियो");
        } catch (e) {
          console.warn("Direct update failed, queueing offline:", e);
          offlineQueue.queueAction({
            type: 'MENU_UPDATE',
            collection: 'menuItems',
            docId: editingItem.id,
            data: payload
          });
          toast.success("मेनु आइटम अफलाइन क्युमा सुरक्षित गरियो");
        }
      } else {
        try {
          await setDoc(doc(db, "menuItems", targetMenuId), {
            ...payload,
            createdAt: new Date().toISOString()
          }, { merge: true });
          toast.success("नयाँ मेनु आइटम थपियो");
        } catch (e) {
          console.warn("Direct create failed, queueing offline:", e);
          offlineQueue.queueAction({
            type: 'MENU_CREATE',
            collection: 'menuItems',
            docId: targetMenuId,
            data: {
              ...payload,
              createdAt: new Date().toISOString()
            }
          });
          toast.success("नयाँ मेनु आइटम अफलाइन क्युमा सुरक्षित गरियो");
        }
      }
      snapshotEngine.triggerPublishRebuild("admin_menu_save");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving menu item:", err);
      toast.error("बचत गर्न असफल भयो");
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      try {
        await deleteDoc(doc(db, "menuItems", itemToDelete));
        toast.success("मेनु आइटम हटाइयो");
      } catch (e) {
        console.warn("Direct delete failed, queueing offline:", e);
        offlineQueue.queueAction({
          type: 'MENU_DELETE',
          collection: 'menuItems',
          docId: itemToDelete
        });
        toast.success("मेनु आइटम हटाउने कार्य अफलाइन क्युमा राखियो");
      }
      snapshotEngine.triggerPublishRebuild("admin_menu_delete");
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error("Error deleting menu item:", err);
      toast.error("हटाउन असफल भयो");
    }
  };

  const toggleActive = async (item: MenuItem) => {
    try {
      const newActive = !item.isActive;
      try {
        await updateDoc(doc(db, "menuItems", item.id), {
          isActive: newActive,
          updatedAt: new Date().toISOString()
        });
        toast.success(newActive ? "मेनु लिंक सक्रिय गरियो" : "मेनु लिंक निष्क्रिय गरियो");
      } catch (e) {
        console.warn("Direct toggle failed, queueing offline:", e);
        offlineQueue.queueAction({
          type: 'MENU_UPDATE',
          collection: 'menuItems',
          docId: item.id,
          data: { isActive: newActive, updatedAt: new Date().toISOString() }
        });
        toast.success("अवस्था परिवर्तन अफलाइन क्युमा राखियो");
      }
      snapshotEngine.triggerPublishRebuild("admin_menu_toggle");
    } catch (err) {
      console.error("Error toggling active status:", err);
      toast.error("अवस्था बदल्न सकिएन");
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredMenuItems.length) return;

    const item1 = filteredMenuItems[index];
    const item2 = filteredMenuItems[targetIndex];

    const order1 = item2.order ?? targetIndex;
    const order2 = item1.order ?? index;

    // Optimistically update local state
    setMenuItems(prev => {
      return prev.map(item => {
        if (item.id === item1.id) return { ...item, order: order1 };
        if (item.id === item2.id) return { ...item, order: order2 };
        return item;
      }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });

    try {
      await updateDoc(doc(db, "menuItems", item1.id), { order: order1 });
      await updateDoc(doc(db, "menuItems", item2.id), { order: order2 });
      toast.success("मेनुको स्थान सारियो");
    } catch (err) {
      console.error("Error swapping menu items:", err);
      toast.error("स्थान सार्न सकिएन");
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    if (sourceIndex === destIndex) return;

    const currentFiltered = [...filteredMenuItems];
    const [movedItem] = currentFiltered.splice(sourceIndex, 1);
    currentFiltered.splice(destIndex, 0, movedItem);

    // Re-assign explicit sequential orders
    const updatedOrderList = currentFiltered.map((item, idx) => ({
      ...item,
      order: idx
    }));

    // Update local state immediately
    setMenuItems(prev => {
      const itemMap = new Map(updatedOrderList.map(item => [item.id, item]));
      return prev.map(item => itemMap.get(item.id) || item).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });

    // Write back to Firestore
    try {
      const updates = updatedOrderList.map(item => 
        updateDoc(doc(db, "menuItems", item.id), { order: item.order })
      );
      await Promise.all(updates);
      toast.success("ड्र्याग र ड्रप गरी मेनुको नयाँ क्रम बचत गरियो");
    } catch (err) {
      console.error("Error saving drag reorder:", err);
      toast.error("नयाँ क्रम बचत गर्दा समस्या भयो");
    }
  };

  const allDistricts = provinces.flatMap(p => p.districts);

  const filteredMenuItems = menuItems.filter(item => {
    if (filterPlacement === "all") return true;
    return (item.placement || "all") === filterPlacement || item.placement === "all";
  });

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Navigation size={22} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-card-foreground tracking-tight">नेभिगेसन लिङ्क र मेनु व्यवस्थापन</h1>
                <p className="text-muted-text text-sm font-medium">ड्र्याग र ड्रप वा एरो बटनबाट लिङ्कहरूको स्थान र क्रम सजिलै मिलाउनुहोस्</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={18} /> नयाँ मेनु थप्नुहोस्
          </button>
        </div>

        {/* Filters and Placement Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-card p-2 sm:p-3 rounded-2xl border border-border-theme shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            <span className="text-xs font-black text-muted-text uppercase tracking-widest px-3 flex items-center gap-1.5">
              <Layers size={14} /> फिल्टर:
            </span>
            {[
              { id: "all", label: "सबै लिङ्कहरू" },
              { id: "header", label: "मुख्य हेडर" },
              { id: "hamburger", label: "ह्याम्बर्गर मेनु" },
              { id: "footer", label: "फुटर मेनु" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterPlacement(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  filterPlacement === tab.id
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-muted-text hover:bg-muted-area hover:text-card-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs font-bold text-muted-text px-3 py-1 bg-muted-area rounded-xl">
            कुल लिङ्क: {filteredMenuItems.length}
          </div>
        </div>

        {/* Menu Items Table with Drag & Drop */}
        <div className="bg-card rounded-[32px] shadow-sm border border-border-theme overflow-hidden">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="menu-items-droppable">
              {(provided) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  className="overflow-x-auto custom-scrollbar"
                >
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-muted-area/80 border-b border-border-theme">
                        <th className="px-4 py-4 w-12 text-center text-[10px] font-black text-muted-text uppercase tracking-widest">
                          स्थान
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black text-muted-text uppercase tracking-widest">
                          क्रम (Order)
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black text-muted-text uppercase tracking-widest">
                          लेबल (Label)
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black text-muted-text uppercase tracking-widest">
                          प्रकार (Type)
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black text-muted-text uppercase tracking-widest">
                          राखिने स्थान (Placement)
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black text-muted-text uppercase tracking-widest">
                          लिङ्क (Path)
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black text-muted-text uppercase tracking-widest">
                          अवस्था (Status)
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black text-muted-text uppercase tracking-widest text-right">
                          कार्य (Action)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-theme">
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-muted-text font-medium">
                            डेटा लोड हुँदैछ...
                          </td>
                        </tr>
                      ) : filteredMenuItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-muted-text font-medium">
                            कुनै मेनु लिङ्क फेला परेन। "नयाँ मेनु थप्नुहोस्" बटन थिचेर नयाँ लिङ्क थप्न सक्नुहुन्छ।
                          </td>
                        </tr>
                      ) : (
                        filteredMenuItems.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <tr
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`transition-colors group ${
                                  snapshot.isDragging 
                                    ? "bg-primary/10 border-2 border-primary shadow-2xl rounded-2xl z-50" 
                                    : "hover:bg-muted-area/50"
                                }`}
                              >
                                {/* Drag Handle */}
                                <td className="px-4 py-4 text-center">
                                  <div
                                    {...provided.dragHandleProps}
                                    title="सार्नको लागि समातेर ड्रयाग गर्नुहोस्"
                                    className="cursor-grab active:cursor-grabbing p-2 text-muted-text hover:text-primary rounded-lg hover:bg-primary/10 transition-colors inline-flex items-center justify-center"
                                  >
                                    <GripVertical size={18} />
                                  </div>
                                </td>

                                {/* Order & Up/Down Arrows */}
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 text-xs font-black text-muted-text text-center">
                                      {index + 1}
                                    </span>
                                    <div className="flex flex-col gap-0.5">
                                      <button 
                                        type="button"
                                        onClick={() => moveItem(index, 'up')}
                                        disabled={index === 0}
                                        title="माथि सार्नुहोस्"
                                        className="p-1 rounded text-muted-text hover:text-primary hover:bg-primary/10 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                                      >
                                        <ChevronUp size={14} />
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => moveItem(index, 'down')}
                                        disabled={index === filteredMenuItems.length - 1}
                                        title="तुरुन्तै तल सार्नुहोस्"
                                        className="p-1 rounded text-muted-text hover:text-primary hover:bg-primary/10 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                                      >
                                        <ChevronDown size={14} />
                                      </button>
                                    </div>
                                  </div>
                                </td>

                                {/* Label */}
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-muted-area rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm">
                                      {item.type === 'category' ? <Tag size={16} /> : item.type === 'district' ? <MapPin size={16} /> : <Globe size={16} />}
                                    </div>
                                    <div>
                                      <span className="text-sm font-bold text-card-foreground block">
                                        {item.label}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Type */}
                                <td className="px-6 py-4">
                                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                                    item.type === 'category' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 
                                    item.type === 'district' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 
                                    'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                  }`}>
                                    {item.type === 'category' ? 'विधा' : item.type === 'district' ? 'जिल्ला' : item.type === 'city' ? 'शहर' : 'कस्टम'}
                                  </span>
                                </td>

                                {/* Placement */}
                                <td className="px-6 py-4">
                                  <span className="text-xs font-bold text-muted-text bg-muted-area px-2.5 py-1 rounded-lg border border-border-theme">
                                    {item.placement === 'header' ? 'हेडर' : item.placement === 'hamburger' ? 'ह्याम्बर्गर' : item.placement === 'footer' ? 'फुटर' : 'सबै ठाउँ'}
                                  </span>
                                </td>

                                {/* Path */}
                                <td className="px-6 py-4">
                                  <span className="text-xs font-medium text-muted-text font-mono truncate max-w-[180px] block">
                                    {item.path}
                                  </span>
                                </td>

                                {/* Active Toggle */}
                                <td className="px-6 py-4">
                                  <button
                                    onClick={() => toggleActive(item)}
                                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                                      item.isActive
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
                                    }`}
                                  >
                                    {item.isActive ? (
                                      <>
                                        <Eye size={14} /> सक्रिय
                                      </>
                                    ) : (
                                      <>
                                        <EyeOff size={14} /> निष्क्रिय
                                      </>
                                    )}
                                  </button>
                                </td>

                                {/* Actions */}
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button 
                                      onClick={() => handleOpenModal(item)}
                                      title="सम्पादन गर्नुहोस्"
                                      className="p-2 text-muted-text hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setItemToDelete(item.id);
                                        setIsDeleteModalOpen(true);
                                      }}
                                      title="हटाउनुहोस्"
                                      className="p-2 text-muted-text hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </tbody>
                  </table>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card rounded-[36px] shadow-2xl overflow-hidden border border-border-theme max-h-[90vh] flex flex-col"
            >
              <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl sm:text-2xl font-black text-card-foreground tracking-tight flex items-center gap-2">
                    <Navigation className="text-primary" size={22} />
                    {editingItem ? "मेनु सम्पादन गर्नुहोस्" : "नयाँ मेनु थप्नुहोस्"}
                  </h2>
                  <button 
                    onClick={() => setIsModalOpen(false)} 
                    className="p-2 text-muted-text hover:text-card-foreground rounded-full hover:bg-muted-area transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">प्रकार (Link Type)</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => {
                        const type = e.target.value as MenuItemType;
                        setFormData({ ...formData, type });
                      }}
                      className="w-full px-5 py-3.5 bg-muted-area border border-border-theme rounded-2xl text-sm font-bold text-card-foreground focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="category">विधा (Category)</option>
                      <option value="district">जिल्ला (District)</option>
                      <option value="city">शहर (City)</option>
                      <option value="custom">कस्टम लिङ्क (Custom URL)</option>
                    </select>
                  </div>

                  {formData.type === 'category' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">विधा छान्नुहोस्</label>
                      <select 
                        onChange={(e) => {
                          const cat = categories.find(c => c.id === e.target.value);
                          if (cat) {
                            setFormData({
                              ...formData,
                              label: cat.nameNepali,
                              path: `/category/${cat.slug}`
                            });
                          }
                        }}
                        className="w-full px-5 py-3.5 bg-muted-area border border-border-theme rounded-2xl text-sm font-bold text-card-foreground focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">विधा छान्नुहोस्</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.nameNepali}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.type === 'district' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">जिल्ला छान्नुहोस्</label>
                      <select 
                        onChange={(e) => {
                          const district = e.target.value;
                          if (district) {
                            setFormData({
                              ...formData,
                              label: district,
                              path: `/district/${encodeURIComponent(district)}`
                            });
                          }
                        }}
                        className="w-full px-5 py-3.5 bg-muted-area border border-border-theme rounded-2xl text-sm font-bold text-card-foreground focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">जिल्ला छान्नुहोस्</option>
                        {allDistricts.sort().map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">राखिने स्थान (Placement)</label>
                    <select 
                      value={formData.placement}
                      onChange={(e) => setFormData({ ...formData, placement: e.target.value as PlacementType })}
                      className="w-full px-5 py-3.5 bg-muted-area border border-border-theme rounded-2xl text-sm font-bold text-card-foreground focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="all">सबै ठाउँ (Header, Mobile & Footer)</option>
                      <option value="header">मुख्य हेडर नेभिगेसन मात्र</option>
                      <option value="hamburger">ह्याम्बर्गर / मोबाइल मेनु मात्र</option>
                      <option value="footer">फुटर लिङ्क मात्र</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">मेनुको नाम (Label)</label>
                    <input 
                      required
                      type="text"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      className="w-full px-5 py-3.5 bg-muted-area border border-border-theme rounded-2xl text-sm font-bold text-card-foreground focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-text/50"
                      placeholder="उदाहरण: मुख्य समाचार"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">लिङ्क (URL / Path)</label>
                    <input 
                      required
                      type="text"
                      value={formData.path}
                      onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                      className="w-full px-5 py-3.5 bg-muted-area border border-border-theme rounded-2xl text-sm font-bold text-card-foreground focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-text/50 font-mono text-xs"
                      placeholder="/category/news"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted-area/50 border border-border-theme rounded-2xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-primary" />
                      <span className="text-xs font-bold text-card-foreground">मेनु सक्रिय (Visible)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 accent-primary rounded cursor-pointer"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    <Save size={18} /> {editingItem ? "अद्यावधिक गर्नुहोस्" : "बचत गर्नुहोस्"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="मेनु हटाउनुहोस्"
        message="के तपाईं निश्चित हुनुहुन्छ कि तपाईं यो मेनु लिङ्क हटाउन चाहनुहुन्छ?"
      />
    </AdminLayout>
  );
}
