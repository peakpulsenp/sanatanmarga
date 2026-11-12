import { Play, Radio, MapPin, Eye, CheckCircle2 } from "lucide-react";
import { LiveVideo } from "../../types/live";
import { useNavigate } from "react-router-dom";

interface LiveNowRailProps {
  liveNow: LiveVideo[];
  activeVideoId?: string;
}

export default function LiveNowRail({ liveNow, activeVideoId }: LiveNowRailProps) {
  const navigate = useNavigate();

  if (!liveNow || liveNow.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 text-center">
        <p className="text-xs text-zinc-400">हाल अन्य कुनै प्रत्यक्ष प्रसारण छैन (No other active live streams)</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black tracking-wider text-red-500 uppercase flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>🔴 LIVE NOW ({liveNow.length})</span>
        </h3>
        <span className="text-[10px] text-zinc-400 font-mono">Real-time Feed</span>
      </div>

      <div className="space-y-2.5 max-h-[380px] overflow-y-auto no-scrollbar">
        {liveNow.map((video) => {
          const isActive = video.id === activeVideoId;
          return (
            <div
              key={video.id}
              onClick={() => navigate(`/live/${video.id}`)}
              className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                isActive
                  ? "bg-amber-500/10 border-amber-500/40 shadow-md shadow-amber-500/5"
                  : "bg-zinc-950/60 hover:bg-zinc-800/60 border-zinc-800/80"
              }`}
            >
              {/* THUMBNAIL */}
              <div className="relative w-20 h-12 rounded-lg bg-zinc-900 overflow-hidden flex-shrink-0">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-red-500 bg-zinc-900">
                    <Radio size={16} className="animate-pulse" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <Play size={14} className="text-white fill-white opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* DETAILS */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[9px] uppercase">
                    LIVE
                  </span>
                  {(video.province || video.district) && (
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1 truncate">
                      <MapPin size={10} className="text-amber-500 flex-shrink-0" />
                      {video.district || video.province}
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-zinc-100 truncate group-hover:text-amber-400 transition-colors">
                  {video.title}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                  <span>{video.broadcasterName || "सनातन मार्ग"}</span>
                  {typeof video.viewerCount === "number" && video.viewerCount > 0 && (
                    <span className="flex items-center gap-1 font-mono text-zinc-300">
                      <Eye size={10} className="text-red-400" />
                      {video.viewerCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
