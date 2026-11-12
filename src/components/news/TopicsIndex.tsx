import { useState, useMemo } from "react";
import { X, Calendar, Filter } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";
import { subDays } from "date-fns";

export default function TopicsIndex({ articles, isOpen, onClose, hideFilter = false }: { articles: Article[], isOpen: boolean, onClose: () => void, hideFilter?: boolean }) {
  const [filter, setFilter] = useState<"day" | "week" | "year">("day");

  const filteredArticles = useMemo(() => {
    if (hideFilter) return articles;
    
    const now = new Date();
    let startDate: Date;
    if (filter === "day") startDate = subDays(now, 1);
    else if (filter === "week") startDate = subDays(now, 7);
    else startDate = subDays(now, 365);

    return articles.filter(a => {
      const createdAt = a.createdAt?.toDate?.() || new Date(a.createdAt);
      return createdAt >= startDate;
    });
  }, [articles, filter, hideFilter]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[100000] backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="fixed top-0 right-0 h-full w-full md:w-[400px] bg-card z-[100000] shadow-2xl p-8 overflow-y-auto border-l border-border-theme"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-card-foreground uppercase tracking-tight">विषय सूची</h2>
              <button onClick={onClose} className="p-2 hover:bg-muted-area rounded-full text-card-foreground transition-colors">
                <X size={24} />
              </button>
            </div>

            {!hideFilter && (
              <div className="flex gap-2 mb-8 bg-muted-area p-1 rounded-xl border border-border-theme">
                {(["day", "week", "year"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${filter === f ? "bg-card text-primary shadow-sm" : "text-muted-text hover:text-card-foreground"}`}
                  >
                    {f === "day" ? "आज" : f === "week" ? "हप्ता" : "वर्ष"}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-4">
              {filteredArticles.map((article, idx) => (
                <Link
                  key={`${article.id || 'topic'}-${idx}`}
                  to={`/article/${article.id}`}
                  onClick={onClose}
                  className="group p-4 rounded-2xl hover:bg-muted-area transition-colors border border-border-theme"
                >
                  <h4 className="text-sm font-bold text-card-foreground group-hover:text-primary leading-snug mb-2 transition-colors">
                    {article.title}
                  </h4>
                  <span className="text-xxs font-bold text-muted-text uppercase tracking-widest flex items-center gap-1">
                    <Calendar size={10} className="text-primary" /> {formatDate(article.createdAt)}
                  </span>
                </Link>
              ))}
              {filteredArticles.length === 0 && (
                <p className="text-center text-muted-text py-10 font-bold uppercase tracking-widest">कुनै लेख भेटिएन</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
