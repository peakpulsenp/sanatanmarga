import React, { useState } from "react";
import { Play, Video, X, ExternalLink, Volume2 } from "lucide-react";
import VideoEmbed from "@/src/components/common/VideoEmbed";

interface ArticleVideoPlayerProps {
  videoUrl: string;
  posterImage?: string;
  title?: string;
  autoplay?: boolean;
  className?: string;
}

export default function ArticleVideoPlayer({
  videoUrl,
  posterImage,
  title,
  autoplay = false,
  className = "",
}: ArticleVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoplay);

  return (
    <div
      className={`relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-black border border-border-theme/40 shadow-2xl group ${className}`}
    >
      {isPlaying ? (
        <VideoEmbed 
          url={videoUrl}
          title={title}
          poster={posterImage}
          onClose={() => setIsPlaying(false)}
        />
      ) : (
        <div className="relative w-full h-full cursor-pointer" onClick={() => setIsPlaying(true)}>
          {posterImage && posterImage.trim() !== "" ? (
            <img
              src={posterImage}
              alt={title || "Video thumbnail"}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Video size={48} className="text-primary animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">भिडियो समाचार</span>
            </div>
          )}

          {/* Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 flex flex-col justify-between p-6">
            <div className="flex items-center justify-between">
              <span className="bg-red-600 text-white text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                <Video size={12} />
                भिडियो
              </span>
              <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20 flex items-center gap-1">
                <Volume2 size={12} className="text-primary" /> साउण्ड उपलब्ध
              </span>
            </div>

            {/* Play Button Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300 border-2 border-white/40">
                <Play size={32} className="fill-current translate-x-1" />
              </div>
            </div>

            <div className="flex items-center justify-between text-white/80 text-xs font-bold">
              <span className="line-clamp-1">{title}</span>
              <span className="text-primary font-black uppercase text-[10px] tracking-wider flex items-center gap-1 hover:underline">
                प्ले गर्न क्लिक गर्नुहोस् <ExternalLink size={12} />
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
