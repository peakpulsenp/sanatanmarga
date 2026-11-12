import { useState, useMemo } from "react";
import { Radio, Search, Filter, Calendar, Tv, Sparkles } from "lucide-react";
import { LiveVideo } from "../../types/live";
import LiveVideoCard from "./LiveVideoCard";
import LiveCategoryBar from "./LiveCategoryBar";

interface LiveVideoGridProps {
  liveNow: LiveVideo[];
  scheduled: LiveVideo[];
  latestVideos: LiveVideo[];
  categories: string[];
}

export default function LiveVideoGrid({ liveNow, scheduled, latestVideos, categories }: LiveVideoGridProps) {
  const [activeTab, setActiveTab] = useState<"all" | "live" | "latest" | "scheduled">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Combine and deduplicate
  const allVideos = useMemo(() => {
    const map = new Map<string, LiveVideo>();
    [...liveNow, ...latestVideos, ...scheduled].forEach(v => {
      if (v.id) map.set(v.id, v);
    });
    return Array.from(map.values());
  }, [liveNow, latestVideos, scheduled]);

  // Filtered dataset
  const filteredVideos = useMemo(() => {
    return allVideos.filter(video => {
      // Tab filter
      if (activeTab === "live" && !(video.status === "live" || video.isLive)) return false;
      if (activeTab === "scheduled" && video.status !== "scheduled") return false;
      if (activeTab === "latest" && (video.status === "live" || video.isLive)) return false;

      // Category filter
      if (selectedCategory && video.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (video.title || "").toLowerCase().includes(q);
        const matchDesc = (video.description || "").toLowerCase().includes(q);
        const matchBroadcaster = (video.broadcasterName || "").toLowerCase().includes(q);
        const matchDistrict = (video.district || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchBroadcaster && !matchDistrict) return false;
      }

      return true;
    });
  }, [allVideos, activeTab, selectedCategory, searchQuery]);

  return (
    <section className="w-full max-w-7xl mx-auto py-8 px-4 space-y-6">
      
      {/* SECTION TITLE & TAB BAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Tv size={20} />
            </span>
            <h2 className="text-xl font-black text-white">
              लाइभ तथा भिडियो (Live & Videos)
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            सनातन मार्ग डिजिटल समाचार कक्ष तथा प्रमाणित सञ्चार साझेदारहरूबाट प्रत्यक्ष प्रसारण र भिडियो रिपोर्टहरू
          </p>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-2xl border border-zinc-800 text-xs font-bold w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "all" ? "bg-amber-500 text-black shadow-md" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            सबै (All)
          </button>
          {liveNow.length > 0 && (
            <button
              onClick={() => setActiveTab("live")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "live" ? "bg-red-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>लाइभ अहिले ({liveNow.length})</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab("latest")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "latest" ? "bg-amber-500 text-black shadow-md" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            भर्खरका भिडियोहरू
          </button>
          {scheduled.length > 0 && (
            <button
              onClick={() => setActiveTab("scheduled")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "scheduled" ? "bg-amber-500 text-black shadow-md" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              आगामी कार्यक्रम ({scheduled.length})
            </button>
          )}
        </div>
      </div>

      {/* SEARCH & CATEGORY BAR */}
      <div className="space-y-3">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="प्रत्यक्ष प्रसारण वा भिडियो खोज्नुहोस्..."
            className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs rounded-xl pl-10 pr-4 py-2.5 focus:border-amber-500 focus:outline-hidden"
          />
        </div>

        <LiveCategoryBar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* VIDEO GRID */}
      {filteredVideos.length === 0 ? (
        <div className="w-full bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-12 text-center space-y-3">
          <Radio size={36} className="mx-auto text-zinc-600" />
          <h3 className="font-bold text-zinc-200 text-base">कुनै प्रत्यक्ष प्रसारण वा भिडियो भेटिएन</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            चयन गरिएको विधा वा खोजी अनुसार कुनै सामग्री उपलब्ध छैन। कृपया अन्य विधा चयन गर्नुहोस्।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredVideos.map((video) => (
            <LiveVideoCard key={video.id} video={video} />
          ))}
        </div>
      )}

    </section>
  );
}
