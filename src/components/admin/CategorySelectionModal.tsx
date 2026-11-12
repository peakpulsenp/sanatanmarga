import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Database } from "lucide-react";

interface Category {
  nameNepali: string;
  nameEnglish: string;
  slug: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedCategories: string[], count: number) => void;
  categories: Category[];
}

export default function CategorySelectionModal({ isOpen, onClose, onConfirm, categories }: Props) {
  const [selected, setSelected] = useState<string[]>(categories.map(c => c.slug));
  const [count, setCount] = useState(3);

  const toggleCategory = (slug: string) => {
    setSelected(prev => 
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-card border border-border-theme rounded-[var(--app-radius)] p-10 max-w-lg w-full shadow-2xl flex flex-col gap-8"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-card-foreground uppercase tracking-tight">श्रेणीहरू छान्नुहोस्</h3>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => toggleCategory(cat.slug)}
                  className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                    selected.includes(cat.slug)
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border-theme bg-muted/50 text-muted-foreground hover:border-border-theme/80"
                  }`}
                >
                  {cat.nameNepali}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-xxs font-black text-muted-text uppercase tracking-widest ml-1">समाचार संख्या (प्रति विधा)</label>
              <div className="flex items-center gap-4">
                {[1, 2, 3, 5, 10].map(n => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={`flex-grow py-3 rounded-xl border-2 font-black transition-all ${
                      count === n ? "border-primary bg-primary/5 text-primary" : "border-border-theme text-muted-foreground/50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => onConfirm(selected, count)}
              disabled={selected.length === 0}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Database size={20} /> डमी डेटा थप्नुहोस्
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
