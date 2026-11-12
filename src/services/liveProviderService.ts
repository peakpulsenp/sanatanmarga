import { LiveVideoSourceType, LiveEmbedCapability } from "../types/live";

export interface ResolvedLiveMetadata {
  sourceType: LiveVideoSourceType;
  externalId: string;
  embedUrl: string;
  thumbnailUrl: string;
  embedCapability: LiveEmbedCapability;
  isLiveSupported: boolean;
  normalizedSourceUrl: string;
}

export class LiveProviderService {
  /**
   * Parses and normalizes video URL from supported platforms.
   */
  public static resolveSource(url: string, explicitType?: LiveVideoSourceType): ResolvedLiveMetadata {
    const cleanUrl = (url || "").trim();
    
    // Default fallback & URL safety guard
    const lower = cleanUrl.toLowerCase();
    if (!cleanUrl || lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("blob:") || lower.startsWith("file:")) {
      return {
        sourceType: "external",
        externalId: "",
        embedUrl: "",
        thumbnailUrl: "",
        embedCapability: "UNAVAILABLE",
        isLiveSupported: false,
        normalizedSourceUrl: ""
      };
    }

    // 1. YouTube Detection (supports youtube.com, youtu.be, youtube-nocookie.com, shorts, live, embed, and direct video IDs)
    if (
      cleanUrl.includes("youtube.com") || 
      cleanUrl.includes("youtu.be") || 
      cleanUrl.includes("youtube-nocookie.com") ||
      explicitType === "youtube"
    ) {
      return this.resolveYouTube(cleanUrl);
    }

    // 2. Facebook Detection
    if (cleanUrl.includes("facebook.com") || cleanUrl.includes("fb.watch")) {
      return this.resolveFacebook(cleanUrl);
    }

    // 3. Instagram Detection
    if (cleanUrl.includes("instagram.com")) {
      return this.resolveInstagram(cleanUrl);
    }

    // 4. Native / Direct Video Stream (.mp4, .m3u8, .webm)
    if (/\.(mp4|m3u8|webm)($|\?)/i.test(cleanUrl) || explicitType === "native") {
      return {
        sourceType: "native",
        externalId: cleanUrl,
        embedUrl: cleanUrl,
        thumbnailUrl: "/assets/images/live-placeholder.jpg",
        embedCapability: "SUPPORTED_EMBED",
        isLiveSupported: cleanUrl.includes(".m3u8"),
        normalizedSourceUrl: cleanUrl
      };
    }

    // 5. Generic External / Custom IFrame Embed
    if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
      return {
        sourceType: "external",
        externalId: cleanUrl,
        embedUrl: cleanUrl,
        thumbnailUrl: "/assets/images/live-placeholder.jpg",
        embedCapability: "SUPPORTED_EMBED",
        isLiveSupported: true,
        normalizedSourceUrl: cleanUrl
      };
    }

    return {
      sourceType: "external",
      externalId: cleanUrl,
      embedUrl: "",
      thumbnailUrl: "",
      embedCapability: "UNAVAILABLE",
      isLiveSupported: false,
      normalizedSourceUrl: cleanUrl
    };
  }

  private static resolveYouTube(url: string): ResolvedLiveMetadata {
    let videoId = "";
    
    // Comprehensive regex for standard, short, live, embed, and nocookie YouTube URLs
    const regExp = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/|shorts\/))([\w-]{11})/;
    const match = url.match(regExp);
    
    if (match && match[1]) {
      videoId = match[1];
    } else if (/^[\w-]{11}$/.test(url.trim())) {
      videoId = url.trim();
    } else if (url.includes("v=")) {
      videoId = url.split("v=")[1]?.split("&")[0]?.split("?")[0] || "";
    } else if (url.includes("/live/")) {
      videoId = url.split("/live/")[1]?.split("?")[0]?.split("&")[0] || "";
    }

    const embedUrl = videoId 
      ? `https://www.youtube.com/embed/${videoId}` 
      : url;

    const thumbnailUrl = videoId 
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` 
      : "";

    return {
      sourceType: "youtube",
      externalId: videoId,
      embedUrl,
      thumbnailUrl,
      embedCapability: videoId ? "SUPPORTED_EMBED" : "EXTERNAL_LINK_ONLY",
      isLiveSupported: true,
      normalizedSourceUrl: url
    };
  }

  private static resolveFacebook(url: string): ResolvedLiveMetadata {
    const encodedUrl = encodeURIComponent(url);
    const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=false&autoplay=true`;

    return {
      sourceType: "facebook",
      externalId: url,
      embedUrl,
      thumbnailUrl: "",
      embedCapability: "SUPPORTED_EMBED",
      isLiveSupported: true,
      normalizedSourceUrl: url
    };
  }

  private static resolveInstagram(url: string): ResolvedLiveMetadata {
    // Instagram imposes strict embed constraints for live video; provided as external link or embed iframe if public reel/post
    const isEmbeddable = url.includes("/p/") || url.includes("/reel/");
    const embedUrl = isEmbeddable ? `${url.replace(/\/$/, "")}/embed` : url;

    return {
      sourceType: "instagram",
      externalId: url,
      embedUrl,
      thumbnailUrl: "",
      embedCapability: isEmbeddable ? "SUPPORTED_EMBED" : "EXTERNAL_LINK_ONLY",
      isLiveSupported: false,
      normalizedSourceUrl: url
    };
  }
}
