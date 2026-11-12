import { Play, Eye, Calendar, CheckCircle2, MapPin, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import { LiveVideo } from "../../types/live";

interface LiveVideoCardProps {
  video: LiveVideo;
  isCompact?: boolean;
}

export default function LiveVideoCard({ video, isCompact = false }: LiveVideoCardProps) {
  const isLiveNow = video.status === "live" || video.isLive;

  return (
    <div className="group bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-amber-500/40 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      
      {/* THUMBNAIL AREA */}
      <Link to={`/live/${video.id}`} className="relative aspect-video w-full bg-zinc-950 overflow-hidden block">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-amber-500/40">
            <Radio size={36} />
          </div>
        )}

        {/* OVERLAY PLAY BUTTON ON HOVER */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="p-3 rounded-full bg-amber-500 text-black shadow-lg transform group-hover:scale-110 transition-transform">
            <Play size={20} className="fill-black ml-0.5" />
          </div>
        </div>

        {/* TOP LEFT BADGE */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
          {isLiveNow ? (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-red-600 text-white font-black text-[10px] tracking-wider uppercase shadow-md animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              लाइभ
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-zinc-900/90 text-zinc-300 font-bold text-[10px] backdrop-blur-md border border-zinc-700/60">
              {video.category || "भिडियो"}
            </span>
          )}
        </div>

        {/* BOTTOM RIGHT DURATION / VIEWER BADGE */}
        <div className="absolute bottom-2.5 right-2.5 z-10">
          {isLiveNow && typeof video.viewerCount === "number" && video.viewerCount > 0 ? (
            <span className="px-2 py-0.5 rounded bg-black/80 text-red-400 font-bold text-[10px] backdrop-blur-md flex items-center gap-1">
              <Eye size={12} />
              {video.viewerCount.toLocaleString("ne-NP")}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-black/80 text-zinc-300 font-mono text-[10px] backdrop-blur-md">
              {video.duration || "भिडियो"}
            </span>
          )}
        </div>
      </Link>

      {/* CONTENT DETAILS */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <Link to={`/live/${video.id}`} className="block">
            <h3 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
              {video.title}
            </h3>
          </Link>

          {video.description && !isCompact && (
            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
              {video.description}
            </p>
          )}
        </div>

        {/* BROADCASTER & LOCATION FOOTER */}
        <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 font-medium truncate max-w-[65%]">
            <span className="truncate text-zinc-300 font-bold">
              {video.broadcasterName || "सनातन मार्ग"}
            </span>
            {video.sourceVerified && (
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500">
            <Calendar size={12} />
            <span>
              {new Date(video.createdAt).toLocaleDateString("ne-NP")}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
