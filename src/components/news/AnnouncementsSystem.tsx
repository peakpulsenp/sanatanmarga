import { useState, useEffect } from "react";
import { Megaphone, X, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { useLanguage } from "@/src/context/LanguageContext";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "critical";
  date: string;
  linkUrl?: string;
  isPinned?: boolean;
  published?: boolean;
}

interface AnnouncementsSystemProps {
  initialAnnouncements?: Announcement[];
}

export default function AnnouncementsSystem({ initialAnnouncements }: AnnouncementsSystemProps) {
  const { t, getLocalized } = useLanguage();
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (initialAnnouncements && initialAnnouncements.length > 0) {
      setAnnouncements(initialAnnouncements);
      return;
    }

    const fetchAnnouncements = async () => {
      try {
        // 1. Fetch from SnapshotOS authority (Zero Firestore quota cost)
        const snapshot = await snapshotEngine.getHomepageSnapshot();
        const snapAnnouncements = (snapshot as any)?.announcements;
        if (Array.isArray(snapAnnouncements) && snapAnnouncements.length > 0) {
          const valid = snapAnnouncements.map((data: any) => ({
            id: data.id || `ann_${Math.random().toString(36).substring(2, 7)}`,
            title: data.title,
            content: data.content,
            type: data.type || "info",
            date: data.createdAt || data.date || data.updatedAt || new Date().toISOString(),
            isPinned: data.isPinned || false,
            published: data.published !== false
          }));

          const sorted = valid.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });

          setAnnouncements(sorted);
        } else {
          setAnnouncements([
            {
              id: "ann_default_1",
              title: "आधिकारिक सूचना: नेपाल सरकार तथा सनातन मार्ग राष्ट्रिय मिडिया समाचार प्रणाली",
              content: "नेपालभरका राष्ट्रिय, प्रादेशिक र स्थानीय निकायका सत्य, तथ्य तथा आधिकारिक सूचना र प्रेस विज्ञप्तिहरू सनातन मार्ग डिजिटल पोर्टलमा चौबीसै घण्टा उपलब्ध गराइनेछ।",
              type: "info",
              date: new Date().toISOString(),
              isPinned: true,
              published: true
            },
            {
              id: "ann_default_2",
              title: "सार्वजनिक सूचना: सरस्वती ज्ञानकोष तथा ग्रन्थ डिजिटल सङ्ग्रह अद्यावधिक",
              content: "सनातन मार्ग संस्थागत ज्ञानकोष (Knowledge OS) अन्तर्गत नयाँ ग्रन्थ, मन्दिर तथा सांस्कृतिक सम्पदाका आधिकारिक तथ्याङ्कहरू अद्यावधिक गरिएको छ।",
              type: "success",
              date: new Date().toISOString(),
              isPinned: false,
              published: true
            }
          ]);
        }
      } catch (err) {
        console.warn("SnapshotOS announcements retrieval notice:", err);
      }
    };

    fetchAnnouncements();

    const handleRebuilt = () => {
      fetchAnnouncements();
    };
    window.addEventListener("snapshot-rebuilt", handleRebuilt);
    return () => {
      window.removeEventListener("snapshot-rebuilt", handleRebuilt);
    };
  }, [initialAnnouncements]);

  if (announcements.length === 0 || dismissed) return null;

  const active = announcements[currentIndex] || announcements[0];
  if (!active) return null;

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300";
      case "success":
        return "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300";
      case "critical":
        return "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300";
      default:
        return "bg-primary/10 border-primary/30 text-primary";
    }
  };

  const activeTitle = getLocalized(active, "title") || active.title;
  const activeContent = getLocalized(active, "content") || active.content;

  return (
    <div className="container-custom my-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative border rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 shadow-sm ${getTypeStyles(active.type)}`}
      >
        <div className="flex items-center gap-3 flex-grow min-w-0">
          <div className="p-2 bg-background rounded-xl shadow-inner flex-shrink-0 animate-pulse">
            <Megaphone size={16} className="text-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xxs font-black tracking-widest uppercase bg-primary text-white px-2 py-0.5 rounded-md leading-none">
                {t("newUpdate") || "नयाँ अपडेट"}
              </span>
              <h4 className="text-sm font-black truncate">{activeTitle}</h4>
            </div>
            {isOpen && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-xs font-semibold text-muted-text mt-2 leading-relaxed"
              >
                {activeContent}
              </motion.p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 bg-background/60 px-3 py-1.5 rounded-lg border border-border-theme cursor-pointer"
          >
            {isOpen ? (t("cancel") || "बन्द गर्नुहोस्") : (t("readMore") || "विवरण हेर्नुहोस्")}
            <ChevronRight size={12} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          </button>
          
          {announcements.length > 1 && (
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)}
              className="p-1.5 rounded-lg hover:bg-background/40 border border-border-theme text-muted-text hover:text-foreground text-xs font-bold cursor-pointer"
              title="Next Update"
            >
              Next
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg hover:bg-background/40 text-muted-text hover:text-foreground border border-border-theme/40 cursor-pointer"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
