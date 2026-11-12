import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, X, BookOpen, Scroll, FileText, Calendar, GraduationCap, 
  ShoppingBag, Radio, Compass, ArrowRight, Sparkles, Command, ShieldAlert
} from "lucide-react";
import NepaliInput from "@/src/components/ui/NepaliInput";
import { useLanguage } from "@/src/context/LanguageContext";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import type { Article } from "@/src/types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchGroup {
  id: string;
  titleNp: string;
  titleEn: string;
  icon: any;
  items: {
    id: string;
    title: string;
    subtitle?: string;
    url: string;
    badge?: string;
  }[];
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [results, setResults] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { language } = useLanguage();

  // Handle ESC or CMD+K hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open
          window.dispatchEvent(new CustomEvent("open-command-palette"));
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Execute grouped search when query changes
  useEffect(() => {
    if (!isOpen) return;

    const performSearch = async () => {
      setLoading(true);
      try {
        const hpSnap = await snapshotEngine.getHomepageSnapshot();
        const allArticles: Article[] = [
          ...(hpSnap.latestNews || []),
          ...(hpSnap.trendingNews || []),
          ...((hpSnap as any).featuredNews || (hpSnap as any).featuredArticles || [])
        ];

        const searchTerm = query.toLowerCase().trim();

        // 1. Articles Group
        const matchedArticles = allArticles
          .filter(a => !searchTerm || a.title?.toLowerCase().includes(searchTerm) || a.excerpt?.toLowerCase().includes(searchTerm))
          .slice(0, 4)
          .map(a => ({
            id: a.id,
            title: a.title,
            subtitle: a.categoryName || a.categoryId || "समाचार",
            url: `/article/${a.id}`,
            badge: "समाचार"
          }));

        // 2. Knowledge Group
        const knowledgeItems = [
          { id: "k1", title: "सारस्वती ग्रन्थालय (Saraswati Knowledge Base)", subtitle: "Vedic & Historical Manuscripts", url: "/knowledge", badge: "ज्ञानकोष" },
          { id: "k2", title: "ज्ञान चित्र (Knowledge Graph Engine)", subtitle: "Entity Relationship Map", url: "/knowledge", badge: "ज्ञानकोष" },
          { id: "k3", title: "धार्मिक स्थल र मन्दिर अभिलेख", subtitle: "Sanctuary Directory", url: "/directory", badge: "स्थल" }
        ].filter(k => !searchTerm || k.title.toLowerCase().includes(searchTerm));

        // 3. Archives Group
        const archiveItems = [
          { id: "ar1", title: "नेपालको संविधान २०७२ (Constitution of Nepal)", subtitle: "Fundamental Law", url: "/archives", badge: "अभिलेख" },
          { id: "ar2", title: "सुगौली सन्धि १८१६ (Treaty of Sugauli)", subtitle: "Historical Treaty Document", url: "/archives", badge: "सन्धि" },
          { id: "ar3", title: "मुलुकी ऐन अभिलेख (Muluki Ain Record)", subtitle: "Legal Code Document", url: "/archives", badge: "ऐन" }
        ].filter(a => !searchTerm || a.title.toLowerCase().includes(searchTerm));

        // 4. Timeline Group
        const timelineItems = [
          { id: "t1", title: "नेपाल एकीकरण कालक्रम (Unification Period)", subtitle: "1825 BS - 1860 BS", url: "/timeline", badge: "कालक्रम" },
          { id: "t2", title: "राणा शासन स्थापना कालक्रम (Rana Regime)", subtitle: "1903 BS", url: "/timeline", badge: "कालक्रम" }
        ].filter(t => !searchTerm || t.title.toLowerCase().includes(searchTerm));

        // 5. Courses / Academy
        const academyItems = [
          { id: "ac1", title: "नेपाली इतिहास र सभ्यता अध्ययन (Civilizational Course)", subtitle: "Academy Certificate Track", url: "/academy", badge: "अकादेमी" },
          { id: "ac2", title: "संस्कृत र देवनागरी अभिलेख पाठ्यसामग्री", subtitle: "Manuscript Reading Course", url: "/academy", badge: "अकादेमी" }
        ].filter(ac => !searchTerm || ac.title.toLowerCase().includes(searchTerm));

        // 6. Store
        const storeItems = [
          { id: "s1", title: "नेपाल सभ्यता मानचित्र र पुस्तक", subtitle: "Sanatan Marga Publishing", url: "/store", badge: "स्टोर" }
        ].filter(s => !searchTerm || s.title.toLowerCase().includes(searchTerm));

        const groups: SearchGroup[] = [];

        if (matchedArticles.length > 0) {
          groups.push({
            id: "articles",
            titleNp: `समाचार (${matchedArticles.length})`,
            titleEn: `Articles (${matchedArticles.length})`,
            icon: FileText,
            items: matchedArticles
          });
        }

        if (knowledgeItems.length > 0) {
          groups.push({
            id: "knowledge",
            titleNp: `ज्ञानकोष (${knowledgeItems.length})`,
            titleEn: `Knowledge Nodes (${knowledgeItems.length})`,
            icon: BookOpen,
            items: knowledgeItems
          });
        }

        if (archiveItems.length > 0) {
          groups.push({
            id: "archives",
            titleNp: `अभिलेख (${archiveItems.length})`,
            titleEn: `Archives (${archiveItems.length})`,
            icon: Scroll,
            items: archiveItems
          });
        }

        if (timelineItems.length > 0) {
          groups.push({
            id: "timeline",
            titleNp: `कालक्रम (${timelineItems.length})`,
            titleEn: `Timeline (${timelineItems.length})`,
            icon: Calendar,
            items: timelineItems
          });
        }

        if (academyItems.length > 0) {
          groups.push({
            id: "academy",
            titleNp: `अकादेमी (${academyItems.length})`,
            titleEn: `Academy (${academyItems.length})`,
            icon: GraduationCap,
            items: academyItems
          });
        }

        if (storeItems.length > 0) {
          groups.push({
            id: "store",
            titleNp: `स्टोर (${storeItems.length})`,
            titleEn: `Store (${storeItems.length})`,
            icon: ShoppingBag,
            items: storeItems
          });
        }

        setResults(groups);
      } catch (err) {
        console.warn("Command palette search error:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 150);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const handleSelectItem = (url: string) => {
    navigate(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-card border border-border-theme rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="p-4 border-b border-border-theme flex items-center gap-3 bg-muted-area/40">
          <Search size={22} className="text-primary shrink-0" />
          <NepaliInput
            ref={inputRef}
            value={query}
            onChange={setQuery}
            placeholder={language === 'en' ? "Search articles, archives, knowledge, timeline, courses... (CMD + K)" : "समाचार, ज्ञानकोष, अभिलेख, कालक्रम, पाठ्यक्रम खोज्नुहोस्... (CMD + K)"}
            className="w-full bg-transparent text-base font-bold text-card-foreground outline-hidden"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-text hover:text-card-foreground hover:bg-muted-area transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-4 flex flex-col gap-6">
          {loading ? (
            <div className="py-12 text-center text-xs font-bold text-muted-text animate-pulse">
              {language === 'en' ? 'Searching Civilizational Index...' : 'सभ्यतामूलक खोज सूचकांक विश्लेषण हुँदैछ...'}
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center gap-2">
              <ShieldAlert size={32} className="text-amber-500/60" />
              <p className="text-sm font-bold text-card-foreground">
                {language === 'en' ? 'No matching items found.' : 'कुनै परिणाम भेटिएन।'}
              </p>
              <p className="text-xs text-muted-text">
                Try searching for "नेपाल", "संविधान", "सुगौली", "समाचार" or "ग्रन्थ"
              </p>
            </div>
          ) : (
            results.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.id} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest px-2">
                    <Icon size={14} />
                    <span>{language === 'en' ? group.titleEn : group.titleNp}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    {group.items.map((item, itemIdx) => (
                      <button
                        key={`${item.id || 'item'}-${itemIdx}`}
                        onClick={() => handleSelectItem(item.url)}
                        className="group flex items-center justify-between p-3 rounded-2xl bg-muted-area/30 hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all text-left cursor-pointer"
                      >
                        <div className="flex flex-col min-w-0 pr-4">
                          <span className="text-sm font-bold text-card-foreground group-hover:text-primary transition-colors truncate">
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span className="text-xs font-semibold text-muted-text truncate">
                              {item.subtitle}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.badge && (
                            <span className="bg-primary/10 text-primary text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              {item.badge}
                            </span>
                          )}
                          <ArrowRight size={16} className="text-muted-text group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="p-3 bg-muted-area/60 border-t border-border-theme flex items-center justify-between text-[11px] font-bold text-muted-text px-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-card border border-border-theme rounded text-[10px] font-mono">ESC</kbd> Close
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-card border border-border-theme rounded text-[10px] font-mono">⌘ K</kbd> Toggle Palette
            </span>
          </div>
          <span className="text-primary font-black uppercase tracking-widest text-[10px]">
            SANATAN MARGA INDEX v5.2
          </span>
        </div>
      </div>
    </div>
  );
}
