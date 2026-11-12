import React, { useState, useEffect } from "react";
import { Plus, Trash2, Sparkles, RefreshCw } from "lucide-react";
import { collection, query, orderBy, safeOnSnapshot as onSnapshot, doc, setDoc, updateDoc } from "@/src/lib/firebase";
import { db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { deleteDocWithQueue, offlineQueue } from "@/src/lib/offlineQueue";
import { useAuth } from "@/src/lib/auth";
import AlertModal from "@/src/components/ui/AlertModal";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { Category } from "@/src/types";
import { 
  mergeWithCanonicalCategories, 
  seedDefaultCategoriesToFirestore,
  cleanCategoryItem 
} from "@/src/utils/categorySeedHelper";
import { CategoryAddRow } from "@/src/components/admin/CategoryAddRow";
import { CategoryItemRow } from "@/src/components/admin/CategoryItemRow";

export default function AdminCategories() {
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ show: false, title: "", message: "", type: 'success' as 'success' | 'error' });
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null as string | null });
  const [isCleaning, setIsCleaning] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');
    if (authLoading || !user || !isAdmin) return;

    const q = query(collection(db, "categories"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      const dynamic = snapshotEngine.getDynamicCategories();
      const merged = mergeWithCanonicalCategories(fetched, dynamic);
      setCategories(merged);
    }, (error) => {
      console.error("Error in categories snapshot:", error);
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.GET, "categories");
      }
      // On error, still show canonical defaults
      const dynamic = snapshotEngine.getDynamicCategories();
      setCategories(mergeWithCanonicalCategories([], dynamic));
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    try {
      const res = await seedDefaultCategoriesToFirestore();
      if (res.success) {
        setAlertInfo({
          show: true,
          title: "डिफल्ट विधा सुरक्षित गरियो",
          message: `सबै ${res.count} वटा आधिकारिक डिफल्ट विधाहरू डेटाबेसमा सफलतापुर्वक लोड गरियो।`,
          type: "success"
        });
        toast.success("डिफल्ट विधाहरू सुरक्षित गरियो");
      } else {
        throw new Error("Seeding failed");
      }
    } catch (err: any) {
      setAlertInfo({
        show: true,
        title: "त्रुटि",
        message: err?.message || "डिफल्ट विधा लोड गर्दा समस्या आयो।",
        type: "error"
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    setIsCleaning(true);
    try {
      const res = await fetch("/api/admin/cleanup-duplicates", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setAlertInfo({
          show: true,
          title: "डुप्लिकेट सफा गरियो",
          message: `${data.deletedCount || 0} डुप्लिकेट/अमान्य विधाहरू र मेनु आइटमहरू सफलतापुर्वक हटाइयो।`,
          type: "success"
        });
      } else {
        setAlertInfo({
          show: true,
          title: "त्रुटि",
          message: data.error || "डुप्लिकेट सफा गर्न सकिएन।",
          type: "error"
        });
      }
    } catch (e: any) {
      setAlertInfo({ show: true, title: "त्रुटि", message: e?.message || "नेटवर्क त्रुटि भयो।", type: "error" });
    } finally {
      setIsCleaning(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditForm(cat);
  };

  const handleSave = async () => {
    if (!editForm.nameNepali || !editForm.slug) {
      toast.error("कृपया नेपाली नाम र Slug भर्नुहोस्");
      return;
    }
    
    try {
      const catId = (editingId && editingId !== 'new') ? editingId : (editForm.slug || `cat-${Date.now()}`);
      const catData = {
        nameNepali: editForm.nameNepali || "",
        nameEnglish: editForm.nameEnglish || "",
        slug: (editForm.slug || "").toLowerCase().trim(),
        order: Number(editForm.order ?? categories.length),
        homepageStyle: editForm.homepageStyle || "grid",
        postCount: Number(editForm.postCount || 0),
        isHidden: Boolean(editForm.isHidden)
      };

      if (editingId === 'new') {
        try {
          await setDoc(doc(db, "categories", catId), catData);
        } catch (err) {
          console.warn("Direct category create warning:", err);
        }
        offlineQueue.queueAction({
          type: 'CATEGORY_CREATE',
          collection: 'categories',
          docId: catId,
          data: catData
        });
      } else if (editingId) {
        try {
          await updateDoc(doc(db, "categories", editingId), catData);
        } catch (err) {
          try {
            await setDoc(doc(db, "categories", editingId), catData, { merge: true });
          } catch (e) {
            console.warn("Direct category update warning:", e);
          }
        }
        offlineQueue.queueAction({
          type: 'CATEGORY_UPDATE',
          collection: 'categories',
          docId: editingId,
          data: catData
        });
      }

      const catObj: Category = {
        id: catId,
        ...catData
      };
      snapshotEngine.injectCategories([catObj]);

      setEditingId(null);
      setIsAdding(false);
      snapshotEngine.triggerPublishRebuild("admin_categories_save");
      toast.success("विधा सुरक्षित गरियो");
      setAlertInfo({ show: true, title: "सफलता!", message: "विधा सुरक्षित गरियो।", type: 'success' });
    } catch (err) {
      console.error("Error saving category:", err);
      setAlertInfo({ show: true, title: "त्रुटि!", message: "बचत गर्दा समस्या आयो।", type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete({ show: true, id });
  };

  const confirmDeleteCategory = async () => {
    if (!confirmDelete.id) return;
    try {
      await deleteDocWithQueue(doc(db, "categories", confirmDelete.id));
      setConfirmDelete({ show: false, id: null });
      snapshotEngine.triggerPublishRebuild("admin_categories_delete");
      toast.success("विधा हटाइयो");
      setAlertInfo({ show: true, title: "सफलता!", message: "विधा हटाइयो।", type: 'success' });
    } catch (err) {
      console.error("Error deleting category:", err);
      setAlertInfo({ show: true, title: "त्रुटि!", message: "हटाउन सकिएन।", type: 'error' });
    }
  };

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const cat1 = categories[index];
    const cat2 = categories[targetIndex];

    const order1 = targetIndex + 1;
    const order2 = index + 1;

    setCategories(prev => {
      return prev.map(c => {
        if (c.id === cat1.id) return { ...c, order: order1 };
        if (c.id === cat2.id) return { ...c, order: order2 };
        return c;
      }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });

    try {
      await updateDoc(doc(db, "categories", cat1.id), { order: order1 });
      await updateDoc(doc(db, "categories", cat2.id), { order: order2 });
      toast.success("विधाको क्रम सारियो");
    } catch (err) {
      console.error("Error reordering category:", err);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    if (sourceIndex === destIndex) return;

    const currentList = [...categories];
    const [movedCat] = currentList.splice(sourceIndex, 1);
    currentList.splice(destIndex, 0, movedCat);

    const updatedList = currentList.map((c, idx) => ({
      ...c,
      order: idx + 1
    }));

    setCategories(updatedList);

    try {
      const updates = updatedList.map(c => 
        updateDoc(doc(db, "categories", c.id), { order: c.order }).catch(err => {
          return setDoc(doc(db, "categories", c.id), c, { merge: true });
        })
      );
      await Promise.all(updates);
      toast.success("ड्र्याग-ड्रप गरी विधाको क्रम बचत गरियो");
    } catch (err) {
      console.error("Error saving category drag order:", err);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <AlertModal 
          isOpen={alertInfo.show} 
          title={alertInfo.title} 
          message={alertInfo.message} 
          type={alertInfo.type} 
          onClose={() => setAlertInfo({ ...alertInfo, show: false })} 
        />
        <ConfirmModal 
          isOpen={confirmDelete.show} 
          title="विधा हटाउनुहोस्" 
          message="के तपाईं यो विधा हटाउन निश्चित हुनुहुन्छ?" 
          confirmText="हटाउनुहोस्"
          cancelText="रद्द गर्नुहोस्"
          onConfirm={confirmDeleteCategory} 
          onCancel={() => setConfirmDelete({ show: false, id: null })} 
        />

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-12 lg:mt-0">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-black text-card-foreground tracking-tight">विधाहरू (Categories)</h1>
                <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full border border-primary/20">
                  {categories.length} विधाहरू
                </span>
              </div>
              <p className="text-muted-text text-sm font-medium">समाचारका विधाहरू, होमपेज प्रदर्शन र क्रम ड्र्याग वा बटनबाट मिलाउनुहोस्</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSeedDefaults}
                disabled={isSeeding}
                title="सबै १२ वटा आधिकारिक डिफल्ट विधाहरू डेटाबेसमा लोड गर्नुहोस्"
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all disabled:opacity-50"
              >
                {isSeeding ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isSeeding ? "लोड गरिँदैछ..." : "डिफल्ट विधा लोड गर्नुहोस्"}
              </button>
              <button
                type="button"
                onClick={handleCleanupDuplicates}
                disabled={isCleaning}
                className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all disabled:opacity-50"
              >
                <Trash2 size={16} /> {isCleaning ? "सफा गरिँदैछ..." : "डुप्लिकेट सफा"}
              </button>
              <button 
                type="button"
                onClick={() => {
                  setEditingId('new');
                  setEditForm({ nameNepali: "", nameEnglish: "", slug: "", order: categories.length + 1, homepageStyle: "grid", postCount: 4, isHidden: false });
                  setIsAdding(true);
                }}
                className="flex items-center justify-center gap-2 bg-primary text-white px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-black text-xs lg:text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
              >
                <Plus size={18} /> नयाँ विधा
              </button>
            </div>
          </div>

          <div className="bg-card rounded-3xl lg:rounded-[2.5rem] shadow-xl border border-border-theme overflow-hidden">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="categories-droppable">
                {(provided) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="overflow-x-auto custom-scrollbar"
                  >
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-muted-area border-b border-border-theme">
                          <th className="px-4 py-6 w-12 text-center text-xxs font-black text-muted-text uppercase tracking-widest">सार्नुहोस्</th>
                          <th className="px-6 py-6 text-xxs font-black text-muted-text uppercase tracking-widest">क्रम</th>
                          <th className="px-8 py-6 text-xxs font-black text-muted-text uppercase tracking-widest">नेपाली नाम</th>
                          <th className="px-8 py-6 text-xxs font-black text-muted-text uppercase tracking-widest">Slug</th>
                          <th className="px-8 py-6 text-xxs font-black text-muted-text uppercase tracking-widest">होमपेज शैली</th>
                          <th className="px-8 py-6 text-xxs font-black text-muted-text uppercase tracking-widest">संख्या</th>
                          <th className="px-8 py-6 text-xxs font-black text-muted-text uppercase tracking-widest">स्थिति</th>
                          <th className="px-8 py-6 text-xxs font-black text-muted-text uppercase tracking-widest text-right">कार्य</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-theme">
                        {isAdding && editingId === 'new' && (
                          <CategoryAddRow
                            editForm={editForm}
                            setEditForm={setEditForm}
                            onSave={handleSave}
                            onCancel={() => { setEditingId(null); setIsAdding(false); }}
                          />
                        )}
                        {categories.map((cat, index) => (
                          <CategoryItemRow
                            key={cat.id || cat.slug || index}
                            cat={cat}
                            index={index}
                            totalCount={categories.length}
                            editingId={editingId}
                            editForm={editForm}
                            setEditForm={setEditForm}
                            onEdit={handleEdit}
                            onSave={handleSave}
                            onCancel={() => { setEditingId(null); setIsAdding(false); }}
                            onDelete={handleDelete}
                            onMove={moveCategory}
                          />
                        ))}
                        {categories.length === 0 && !isAdding && (
                          <tr>
                            <td colSpan={8} className="text-center py-12 text-muted-text">
                              कुनै विधा भेटिएन। माथिको "डिफल्ट विधा लोड गर्नुहोस्" बटन थिच्नुहोस्।
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
