import React, { useState, useEffect } from "react";
import { 
  Calendar, Plus, Search, Edit3, Trash2, Flame, 
  Sparkles, Clock, X, Save, Star
} from "lucide-react";
import { db, safeOnSnapshot, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { collection, doc, setDoc, deleteDoc } from "@/src/lib/firebase";
import { UPCOMING_FESTIVALS, FestivalEvent } from "@/src/pages/FestivalEnginePage";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export default function FestivalOSAdmin() {
  const [festivals, setFestivals] = useState<FestivalEvent[]>(UPCOMING_FESTIVALS);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nameNepali: "",
    nameEnglish: "",
    tithi: "",
    dateBS: "",
    dateAD: "",
    daysRemaining: 30,
    image: "",
    significanceNepali: "",
    significanceEnglish: "",
    ritualsNepali: ""
  });

  useEffect(() => {
    let isMounted = true;
    let seededOnce = false;

    const unsub = safeOnSnapshot(
      collection(db, "festivals"),
      async (snap) => {
        if (!isMounted) return;
        if (snap.empty && !seededOnce) {
          seededOnce = true;
          for (const item of UPCOMING_FESTIVALS) {
            try {
              await setDoc(doc(db, "festivals", item.id), item, { merge: true });
            } catch (e) {}
          }
          return;
        }
        if (!snap.empty) {
          setFestivals(snap.docs.map(d => ({ id: d.id, ...d.data() } as FestivalEvent)));
        }
      },
      "admin_festivals_listener"
    );

    return () => {
      isMounted = false;
      if (typeof unsub === "function") unsub();
    };
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      nameNepali: "",
      nameEnglish: "",
      tithi: "कार्तिक शुक्ल पूर्णिमा",
      dateBS: "२०८३ कार्तिक २५",
      dateAD: "2026 November 10",
      daysRemaining: 65,
      image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
      significanceNepali: "",
      significanceEnglish: "",
      ritualsNepali: "स्नान तथा पूजा, दीप प्रज्वलन, प्रसाद वितरण"
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (fest: FestivalEvent) => {
    setEditingId(fest.id);
    setFormData({
      nameNepali: fest.nameNepali || "",
      nameEnglish: fest.nameEnglish || "",
      tithi: fest.tithi || "",
      dateBS: fest.dateBS || "",
      dateAD: fest.dateAD || "",
      daysRemaining: fest.daysRemaining || 0,
      image: fest.image || "",
      significanceNepali: fest.significanceNepali || "",
      significanceEnglish: fest.significanceEnglish || "",
      ritualsNepali: (fest.ritualsNepali || []).join(", ")
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameNepali || !formData.significanceNepali) {
      toast.error("कृपया पर्वको नाम र महत्त्व भर्नुहोस्");
      return;
    }

    const docId = editingId || `fest-${Date.now()}`;
    const payload: FestivalEvent = {
      id: docId,
      nameNepali: formData.nameNepali.trim(),
      nameEnglish: formData.nameEnglish.trim() || formData.nameNepali.trim(),
      tithi: formData.tithi.trim(),
      dateBS: formData.dateBS.trim(),
      dateAD: formData.dateAD.trim(),
      daysRemaining: Number(formData.daysRemaining) || 0,
      image: formData.image.trim() || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
      significanceNepali: formData.significanceNepali.trim(),
      significanceEnglish: formData.significanceEnglish.trim() || formData.significanceNepali.trim(),
      ritualsNepali: formData.ritualsNepali.split(",").map(s => s.trim()).filter(Boolean)
    };

    try {
      await setDoc(doc(db, "festivals", docId), payload, { merge: true });
      toast.success(editingId ? "पर्व विवरण अद्यावधिक भयो!" : "नयाँ सांस्कृतिक पर्व थपियो!");
      setIsModalOpen(false);
    } catch (err: any) {
      handleFirestoreError(err, editingId ? OperationType.UPDATE : OperationType.CREATE, `festivals/${docId}`);
      toast.error("सेभ गर्न असफल");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("के तपाईं यो पर्व विवरण हटाउन चाहनुहुन्छ?")) return;
    try {
      await deleteDoc(doc(db, "festivals", id));
      toast.success("पर्व हटाइयो!");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `festivals/${id}`);
      toast.error("हटाउन असफल");
    }
  };

  const filtered = festivals.filter(f => {
    const s = searchTerm.toLowerCase();
    return (f.nameNepali || "").toLowerCase().includes(s) ||
           (f.nameEnglish || "").toLowerCase().includes(s) ||
           (f.tithi || "").toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border-theme shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-black uppercase tracking-wider mb-2 border border-amber-500/20">
            <Flame size={14} /> Festival Engine Admin • पञ्चाङ्ग तथा पर्व व्यवस्थापन
          </div>
          <h2 className="text-xl md:text-2xl font-black text-card-foreground">
            सांस्कृतिक पर्व तथा पञ्चाङ्ग इन्जिन व्यवस्थापक
          </h2>
          <p className="text-xs md:text-sm text-muted-text">
            नेपाली राष्ट्रिय तथा क्षेत्रीय चाडपर्वहरू, तिथि, काउन्टडाउन र पूजा विधिहरू व्यवस्थापन गर्नुहोस्।
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-2xl bg-primary text-white text-xs font-black flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>नयाँ चाडपर्व थप्नुहोस्</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
        <input
          type="text"
          placeholder="पर्वको नाम वा तिथि खोज्नुहोस्..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border-theme rounded-2xl text-xs font-medium focus:outline-none focus:border-primary"
        />
      </div>

      {/* Grid of Festivals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(fest => (
          <div
            key={fest.id}
            className="bg-card border border-border-theme rounded-3xl p-5 hover:border-primary/40 transition-all shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-amber-600 dark:text-amber-400">
                <span className="flex items-center gap-1"><Calendar size={12} /> {fest.dateBS}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px]">
                  {fest.daysRemaining} दिन बाँकी
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-bold text-muted-text">{fest.tithi}</div>
                <h3 className="text-base font-black text-card-foreground">{fest.nameNepali}</h3>
                <p className="text-[11px] text-muted-text">{fest.nameEnglish}</p>
              </div>

              <p className="text-xs text-muted-text line-clamp-2">
                {fest.significanceNepali}
              </p>

              <div className="pt-2 border-t border-border-theme/60">
                <span className="text-[10px] font-bold uppercase text-muted-text block mb-1">विधि:</span>
                <div className="flex flex-wrap gap-1">
                  {fest.ritualsNepali?.slice(0, 3).map((r, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-muted-area text-muted-text text-[10px]">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-theme/60">
              <button
                onClick={() => handleOpenEdit(fest)}
                className="p-2 hover:bg-primary/10 text-primary rounded-xl transition-colors cursor-pointer"
                title="सम्पादन गर्नुहोस्"
              >
                <Edit3 size={15} />
              </button>
              <button
                onClick={() => handleDelete(fest.id)}
                className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors cursor-pointer"
                title="हटाउनुहोस्"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Edit / Create */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card text-card-foreground border border-border-theme rounded-3xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border-theme">
                <h3 className="text-base font-black flex items-center gap-2">
                  <Flame size={18} className="text-amber-500" />
                  {editingId ? "चाडपर्व सम्पादन" : "नयाँ सांस्कृतिक पर्व थप्नुहोस् (Festival Details)"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-xl text-muted-text hover:text-foreground hover:bg-muted-area"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 mt-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-muted-text mb-1">नेपाली पर्व नाम *</label>
                    <input
                      type="text"
                      required
                      value={formData.nameNepali}
                      onChange={e => setFormData(p => ({ ...p, nameNepali: e.target.value }))}
                      placeholder="उदा: वडा दशैँ (विजयादशमी)"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-muted-text mb-1">English Name</label>
                    <input
                      type="text"
                      value={formData.nameEnglish}
                      onChange={e => setFormData(p => ({ ...p, nameEnglish: e.target.value }))}
                      placeholder="e.g. Bada Dashain"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-muted-text mb-1">तिथि (Tithi)</label>
                    <input
                      type="text"
                      value={formData.tithi}
                      onChange={e => setFormData(p => ({ ...p, tithi: e.target.value }))}
                      placeholder="उदा: आश्विन शुक्ल प्रतिपदा देखि पूर्णिमा"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-muted-text mb-1">वि.सं. मिति</label>
                    <input
                      type="text"
                      value={formData.dateBS}
                      onChange={e => setFormData(p => ({ ...p, dateBS: e.target.value }))}
                      placeholder="उदा: २०८३ आश्विन २८"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-muted-text mb-1">बाँकी दिन (Countdown)</label>
                    <input
                      type="number"
                      value={formData.daysRemaining}
                      onChange={e => setFormData(p => ({ ...p, daysRemaining: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-muted-text mb-1">नेपाली सांस्कृतिक महत्त्व *</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.significanceNepali}
                    onChange={e => setFormData(p => ({ ...p, significanceNepali: e.target.value }))}
                    placeholder="पर्वको धार्मिक, सांस्कृतिक र दार्शनिक महत्त्व..."
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-muted-text mb-1">प्रमुख पूजा तथा परम्परागत विधिहरू (अल्पविरामले छुट्याउनुहोस्)</label>
                  <input
                    type="text"
                    value={formData.ritualsNepali}
                    onChange={e => setFormData(p => ({ ...p, ritualsNepali: e.target.value }))}
                    placeholder="उदा: घटस्थापना, फूलपाती, महाअष्टमी कालरात्री, टीका"
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-muted-text mb-1">तस्बिर URL (Banner Image)</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={e => setFormData(p => ({ ...p, image: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-theme">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-muted-area hover:bg-muted-area/80 font-bold"
                  >
                    रद्द गर्नुहोस्
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-white font-bold flex items-center gap-1.5"
                  >
                    <Save size={14} /> सुरक्षित गर्नुहोस्
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
