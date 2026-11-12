import React from "react";
import { ExternalLink, Video as VideoIcon, X, Youtube } from "lucide-react";

export interface VideoEmbedInfo {
  type: "iframe" | "video";
  src: string;
  rawUrl: string;
  isYouTube?: boolean;
}

export const parseVideoUrl = (url?: string): VideoEmbedInfo | null => {
  if (!url) return null;
  const cleanUrl = url.trim();

  // YouTube match
  if (cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be") || /^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    let videoId = "";
    if (cleanUrl.includes("v=")) {
      videoId = cleanUrl.split("v=")[1]?.split("&")[0] || "";
    } else if (cleanUrl.includes("youtu.be/")) {
      videoId = cleanUrl.split("youtu.be/")[1]?.split("?")[0] || "";
    } else if (cleanUrl.includes("embed/")) {
      videoId = cleanUrl.split("embed/")[1]?.split("?")[0] || "";
    } else if (cleanUrl.includes("/shorts/")) {
      videoId = cleanUrl.split("/shorts/")[1]?.split("?")[0] || "";
    } else if (cleanUrl.includes("/live/")) {
      videoId = cleanUrl.split("/live/")[1]?.split("?")[0] || "";
    } else if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
      videoId = cleanUrl;
    }

    if (videoId) {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const originParam = origin ? `&origin=${encodeURIComponent(origin)}` : "";
      
      // Using youtube-nocookie.com + enablejsapi=1 + mute=1 for autoplay to fix Error 153
      return {
        type: "iframe",
        src: `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=1&rel=0&playsinline=1&modestbranding=1${originParam}`,
        rawUrl: cleanUrl.startsWith("http") ? cleanUrl : `https://www.youtube.com/watch?v=${videoId}`,
        isYouTube: true,
      };
    }
  }

  // Vimeo
  if (cleanUrl.includes("vimeo.com")) {
    const vimeoId = cleanUrl.split("vimeo.com/")[1]?.split("?")[0] || "";
    if (vimeoId) {
      return {
        type: "iframe",
        src: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`,
        rawUrl: cleanUrl,
      };
    }
  }

  // Facebook
  if (cleanUrl.includes("facebook.com") || cleanUrl.includes("fb.watch")) {
    return {
      type: "iframe",
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanUrl)}&show_text=false&autoplay=true`,
      rawUrl: cleanUrl,
    };
  }

  // Direct video file or generic URL
  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return { type: "video", src: cleanUrl, rawUrl: cleanUrl };
  }

  return null;
};

interface VideoEmbedProps {
  url: string;
  title?: string;
  poster?: string;
  onClose?: () => void;
  className?: string;
}

export default function VideoEmbed({ url, title, poster, onClose, className = "" }: VideoEmbedProps) {
  const embed = parseVideoUrl(url);
  const [videoError, setVideoError] = React.useState(false);

  const directUrl = embed?.rawUrl || url;

  if (!embed || videoError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center gap-4 ${className}`}>
        <VideoIcon size={48} className="text-primary opacity-50" />
        <p className="text-sm font-medium">
          यो भिडियो प्लेयरमा सिधै प्ले हुन सकेन वा YouTube/प्लेटफर्ममा प्रतिबन्धित छ। सिधै हेर्नुहोस्:
        </p>
        <a
          href={directUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-2.5 bg-red-600 text-white rounded-full text-xs font-black flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
        >
          <Youtube size={16} />
          <span>YouTube मा हेर्नुहोस् (Watch on YouTube)</span>
          <ExternalLink size={14} />
        </a>
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-black group ${className}`}>
      {embed.type === "iframe" ? (
        <iframe
          src={embed.src}
          title={title || "Video Player"}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <video
          src={embed.src}
          poster={poster}
          controls
          autoPlay
          muted
          playsInline
          onError={() => setVideoError(true)}
          className="w-full h-full object-contain"
        />
      )}

      {/* Quick Direct Link Bar Overlay */}
      {embed.isYouTube && (
        <a
          href={directUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 left-3 z-40 bg-black/80 hover:bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition-all shadow-xl opacity-80 group-hover:opacity-100"
          title="Watch on YouTube"
        >
          <Youtube size={12} className="text-red-500 group-hover:text-white" />
          <span>YouTube मा हेर्नुहोस्</span>
          <ExternalLink size={10} />
        </a>
      )}

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/60 text-white rounded-full hover:bg-black transition-colors backdrop-blur-md border border-white/20"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
}

