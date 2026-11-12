import { useState } from "react";
import { Play, Film, MapPin, Clock, Eye, ChevronRight } from "lucide-react";
import { LiveVideo } from "../../types/live";
import { useNavigate } from "react-router-dom";

interface ReplayGridProps {
  latestVideos: LiveVideo[];
}

export default function ReplayGrid({ latestVideos }: ReplayGridProps) {
  const [filterType, setFilterType] = useState<string>("ALL");
  const navigate = useNavigate();

  const filtered = latestVideos.filter(v => {
    if (filterType === "ALL") return true;
    if (filterType === "REPLAY") return v.status === "ended" || v.status === "archived";
    if (filterType === "HIGHLIGHTS") return v.category?.includes("Highlights") || v.title.includes("विशेष");
    return true;
  });

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Film size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wide">
              ▶ REPLAYS & ARCHIVE (पुनःप्रसारण तथा अभिलेख)
            </h3>
            <p className="text-[11px] text-zinc-400">Past sessions, parliamentary debriefs & explanatory video intelligence</p>
          </div>
        </div>

        {/* FILTER BUTTONS */}
        <div className="flex items-center gap-1.5">
          {["ALL", "REPLAY", "HIGHLIGHTS"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === t
                  ? "bg-amber-500 text-black shadow"
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              }`}
            >
              {t === "ALL" ? "सबै" : t === "REPLAY" ? "रेप्लें" : "हाइलाइट्स"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((video) => (
          <div
            key={video.id}
            onClick={() => navigate(`/live/${video.id}`)}
            className="group bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between shadow-lg"
          >
            {/* THUMBNAIL */}
            <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-900">
                  <Film size={32} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-amber-500/90 text-black flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                  <Play size={18} fill="currentColor" className="ml-0.5" />
                </div>
              </div>
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-amber-400 font-bold text-[10px] border border-white/10">
                {video.category || "रेकर्डिङ"}
              </div>
            </div>

            {/* CONTENT */}
            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                {(video.province || video.district) && (
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <MapPin size={11} className="text-amber-500" />
                    <span>{video.district || video.province}</span>
                  </div>
                )}
                <h4 className="text-xs font-bold text-zinc-100 group-hover:text-amber-400 transition-colors line-clamp-2">
                  {video.title}
                </h4>
              </div>

              <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-400">
                <span>{video.broadcasterName || "सनातन मार्ग"}</span>
                <span className="text-amber-400 font-bold flex items-center gap-0.5">
                  हेर्नुहोस् <ChevronRight size={13} />
                </span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-xs text-zinc-400">
            कुनै पुनःप्रसारण भिडियोहरू उपलब्ध छैनन्।
          </div>
        )}
      </div>
    </div>
  );
}
