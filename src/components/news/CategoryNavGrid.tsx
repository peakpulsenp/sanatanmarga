import { useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Landmark, MapPin, Globe, DollarSign, Trophy, Film, 
  Cpu, Scroll, Compass, Lightbulb, TrendingUp, Layers, ChevronRight, ChevronLeft
} from "lucide-react";
import { useLanguage } from "@/src/context/LanguageContext";

interface CategoryNavGridProps {
  categories?: any[];
}

export default function CategoryNavGrid({ categories }: CategoryNavGridProps) {
  const { language } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Core Categories List with Icons & Nepali / English names
  const coreCategories = [
    { slug: "politics", nameNp: "राजनीति", nameEn: "Politics", icon: Landmark, color: "text-red-500 bg-red-500/10" },
    { slug: "desh", nameNp: "देश", nameEn: "National", icon: MapPin, color: "text-amber-500 bg-amber-500/10" },
    { slug: "pradesh", nameNp: "प्रदेश", nameEn: "Provinces", icon: Layers, color: "text-blue-500 bg-blue-500/10" },
    { slug: "bishwo", nameNp: "विश्व", nameEn: "World", icon: Globe, color: "text-teal-500 bg-teal-500/10" },
    { slug: "economy", nameNp: "अर्थ", nameEn: "Economy", icon: DollarSign, color: "text-emerald-500 bg-emerald-500/10" },
    { slug: "sports", nameNp: "खेलकुद", nameEn: "Sports", icon: Trophy, color: "text-orange-500 bg-orange-500/10" },
    { slug: "entertainment", nameNp: "मनोरञ्जन", nameEn: "Entertainment", icon: Film, color: "text-purple-500 bg-purple-500/10" },
    { slug: "tech", nameNp: "प्रविधि", nameEn: "Tech", icon: Cpu, color: "text-indigo-500 bg-indigo-500/10" },
    { slug: "culture", nameNp: "संस्कृति", nameEn: "Culture", icon: Scroll, color: "text-amber-600 bg-amber-600/10" },
    { slug: "tourism", nameNp: "पर्यटन", nameEn: "Tourism", icon: Compass, color: "text-sky-500 bg-sky-500/10" },
    { slug: "opinion", nameNp: "विचार", nameEn: "Opinion", icon: Lightbulb, color: "text-yellow-500 bg-yellow-500/10" },
    { slug: "development", nameNp: "विकास", nameEn: "Development", icon: TrendingUp, color: "text-green-500 bg-green-500/10" },
  ];

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      const newScrollPosition = direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      scrollRef.current.scrollTo({
        left: newScrollPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <section className="w-full bg-card py-5 border-b border-border-theme/40 shadow-sm">
      <div className="container-custom px-4 relative group">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 bg-primary rounded-full" />
            <h2 className="text-sm md:text-base font-black text-card-foreground uppercase tracking-tight">
              {language === 'en' ? 'Explore Categories' : 'समाचार तथा विषयगत विधाहरू'}
            </h2>
          </div>
          <Link
            to="/categories"
            className="text-[11px] font-bold text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
          >
            <span>{language === 'en' ? 'All Categories' : 'सबै विधाहरू'}</span>
            <ChevronRight size={12} />
          </Link>
        </div>

        {/* Horizontal Scroll Area */}
        <div className="relative w-full flex items-center">
          {/* Left Arrow Button */}
          <button
            onClick={() => handleScroll("left")}
            className="absolute -left-3 z-20 bg-slate-900/90 text-white p-1.5 rounded-full border border-zinc-800 hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100 shadow-md cursor-pointer focus:outline-hidden"
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Horizontally sliding container */}
          <div
            ref={scrollRef}
            className="flex items-center gap-3 overflow-x-auto w-full scroll-smooth py-1 scrollbar-none select-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {coreCategories.map((cat) => {
              const IconComponent = cat.icon;
              const displayName = language === 'en' ? cat.nameEn : cat.nameNp;

              return (
                <Link
                  key={cat.slug}
                  to={`/category/${cat.slug}`}
                  className="group flex-shrink-0 flex items-center gap-2.5 p-2 rounded-xl bg-muted-area/45 hover:bg-primary/10 border border-border-theme/50 hover:border-primary/30 transition-all duration-200 shadow-xs hover:shadow-md min-w-[130px] sm:min-w-[150px] max-w-[180px]"
                >
                  <div className={`p-2 rounded-lg ${cat.color} group-hover:scale-105 transition-transform shrink-0`}>
                    <IconComponent size={15} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-card-foreground group-hover:text-primary transition-colors truncate">
                      {displayName}
                    </span>
                    <span className="text-[9px] font-semibold text-muted-text uppercase tracking-wider truncate">
                      {cat.slug}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={() => handleScroll("right")}
            className="absolute -right-3 z-20 bg-slate-900/90 text-white p-1.5 rounded-full border border-zinc-800 hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100 shadow-md cursor-pointer focus:outline-hidden"
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
