import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Headphones,
  User,
  Download,
  Loader2,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import { getHumanNepaliAudio, formatAudioTime } from "@/src/services/ttsClient";
import { useMediaOS } from "@/src/context/MediaOSContext";
import { audioPlaybackManager, AudioState } from "@/src/services/audioPlaybackManager";
import { extractPageReadableContent } from "@/src/utils/contentExtractor";

interface ArticleAudioReaderProps {
  title: string;
  content: string;
  language?: "ne" | "en";
  article?: any;
}

export const ArticleAudioReader: React.FC<ArticleAudioReaderProps> = ({
  title,
  content,
  language = "ne",
  article,
}) => {
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceType, setVoiceType] = useState<"female" | "male">("female");
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string>("");

  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Extract clean text from HTML content
  const getCleanText = (raw: string) => {
    if (typeof window === "undefined") return raw || "";
    const doc = new DOMParser().parseFromString(raw || "", "text/html");
    const cleanBody = doc.body.textContent || "";
    return cleanBody.replace(/\s+/g, " ").trim();
  };

  const textToRead = getCleanText(content);
  const wordCount = textToRead.split(/\s+/).length;
  const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 130));

  let mediaOS: any = null;
  try {
    mediaOS = useMediaOS();
  } catch (e) {
    // MediaOS provider fallback
  }

  const isSyncMode = !!(mediaOS && article);
  const isThisTrackActive = isSyncMode && mediaOS.currentTrack?.articleId === article?.id;

  // Derived synced state variables
  const activeIsPlaying = isSyncMode ? (isThisTrackActive && mediaOS.isPlaying) : isPlaying;
  const activeIsPaused = isSyncMode ? (isThisTrackActive && !mediaOS.isPlaying && mediaOS.currentTime > 0) : isPaused;
  const activeIsLoading = isSyncMode ? (isThisTrackActive && mediaOS.isBuffering) : isLoading;
  const activeCurrentTime = isSyncMode ? (isThisTrackActive ? mediaOS.currentTime : 0) : currentTime;
  const activeDuration = isSyncMode ? (isThisTrackActive ? mediaOS.duration : 0) : duration;
  const activePlaybackRate = isSyncMode ? (isThisTrackActive ? mediaOS.playbackRate : 1.0) : playbackRate;
  const activeVoiceType = isSyncMode ? (isThisTrackActive ? mediaOS.voiceGender : voiceType) : voiceType;
  const activeIsMuted = isSyncMode ? (isThisTrackActive ? mediaOS.isMuted : false) : isMuted;

  const handlePlayInMediaOS = () => {
    if (mediaOS) {
      if (article) {
        mediaOS.playArticle(article);
      } else {
        mediaOS.playArticle({
          id: `art-${title.slice(0, 20)}`,
          title,
          content,
          summary: textToRead,
        });
      }
    }
  };

  // Subscribe to single global audioPlaybackManager
  useEffect(() => {
    if (isSyncMode) return; // Skip local subscription in sync mode
    const unsubscribe = audioPlaybackManager.subscribe((state: AudioState, track, time, dur) => {
      const isThisTrack = track?.title === title;

      if (isThisTrack) {
        if (state === "PLAYING") {
          setIsPlaying(true);
          setIsPaused(false);
          setIsLoading(false);
        } else if (state === "LOADING") {
          setIsLoading(true);
          setIsPlaying(false);
          setIsPaused(false);
        } else if (state === "PAUSED") {
          setIsPlaying(false);
          setIsPaused(true);
          setIsLoading(false);
        } else if (state === "ENDED" || state === "IDLE") {
          setIsPlaying(false);
          setIsPaused(false);
          setIsLoading(false);
        } else if (state === "ERROR") {
          setIsPlaying(false);
          setIsPaused(false);
          setIsLoading(false);
        }

        if (!isNaN(time)) setCurrentTime(time);
        if (!isNaN(dur) && isFinite(dur) && dur > 0) setDuration(dur);
      } else {
        // Another track is playing elsewhere
        if (state === "PLAYING" || state === "LOADING") {
          setIsPlaying(false);
          setIsPaused(false);
          setIsLoading(false);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [title, isSyncMode]);

  // Primary Human AI Audio Playback Handler using AudioPlaybackManager singleton
  const handlePlayAI = async (selectedVoice = voiceType) => {
    setErrorNotice(null);
    setIsLoading(true);

    const voiceParam = selectedVoice === "female" ? "Aoede" : "Fenrir";

    try {
      const cleanText = textToRead || extractPageReadableContent().bodyText;

      await audioPlaybackManager.playTrack(
        {
          id: article?.id,
          title,
          sourceUrl: article?.audioUrl || article?.tts?.audioUrl || "",
          language,
          voice: voiceParam,
        },
        async (signal) => {
          const res = await getHumanNepaliAudio(cleanText, {
            voice: voiceParam,
            speed: playbackRate,
            title,
            language,
            articleId: article?.id,
            contentId: article?.id,
            contentType: "article",
            audioUrl: article?.audioUrl || article?.tts?.audioUrl,
          });
          if (signal.aborted) {
            throw new DOMException("Aborted", "AbortError");
          }
          setCurrentAudioUrl(res.audioUrl);
          return res.audioUrl;
        }
      );

      setIsLoading(false);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("[TTS Generation Error]:", err);
      setIsLoading(false);
      setIsPlaying(false);
      setErrorNotice(
        language === "en"
          ? "Human Voice Studio is preparing or temporarily busy. Please tap Listen again to retry."
          : "मानव आवाज सेवा तयारीमा छ वा व्यस्त छ। पुनः प्रयास गर्न 'Listen' थिच्नुहोस्।"
      );
    }
  };

  const handlePlay = () => {
    if (isSyncMode) {
      if (isThisTrackActive) {
        mediaOS.togglePlay();
      } else if (article) {
        mediaOS.playArticle(article);
      }
      return;
    }

    if (isPlaying) {
      audioPlaybackManager.pause();
      return;
    }
    if (isPaused) {
      audioPlaybackManager.resume();
      return;
    }

    const currentTrack = audioPlaybackManager.getCurrentTrack();
    const currentState = audioPlaybackManager.getState();
    if (currentTrack?.title === title && (currentState === "ENDED" || currentState === "PAUSED")) {
      audioPlaybackManager.toggle();
      return;
    }

    handlePlayAI(voiceType);
  };

  const handleStop = () => {
    if (isSyncMode) {
      if (isThisTrackActive) {
        mediaOS.togglePlay();
      }
      return;
    }

    audioPlaybackManager.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTime(0);
  };

  const handleVoiceChange = (newVoice: "female" | "male") => {
    if (isSyncMode) {
      if (isThisTrackActive) {
        mediaOS.setVoiceGender(newVoice);
      } else {
        setVoiceType(newVoice);
      }
      return;
    }

    if (newVoice === voiceType) return;
    setVoiceType(newVoice);
    if (isPlaying || isPaused) {
      handleStop();
      setTimeout(() => {
        handlePlayAI(newVoice);
      }, 150);
    }
  };

  const toggleRate = () => {
    if (isSyncMode) {
      if (isThisTrackActive) {
        const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
        const nextIdx = (rates.indexOf(activePlaybackRate) + 1) % rates.length;
        mediaOS.setRate(rates[nextIdx]);
      }
      return;
    }

    const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    audioPlaybackManager.setPlaybackRate(nextRate);
  };

  const handleSkip = (seconds: number) => {
    if (isSyncMode) {
      if (isThisTrackActive) {
        mediaOS.skipSeconds(seconds);
      }
      return;
    }

    const newTime = Math.max(0, Math.min(currentTime + seconds, duration || estimatedMinutes * 60));
    audioPlaybackManager.seek(newTime);
    setCurrentTime(newTime);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSyncMode) {
      if (isThisTrackActive && progressBarRef.current && activeDuration > 0) {
        const rect = progressBarRef.current.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        mediaOS.seek(pos * activeDuration);
      }
      return;
    }

    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTime = pos * duration;
    audioPlaybackManager.seek(seekTime);
    setCurrentTime(seekTime);
  };

  const handleDownload = () => {
    if (currentAudioUrl) {
      const a = document.createElement("a");
      a.href = currentAudioUrl;
      a.download = `sanatan-audio-${title.slice(0, 20)}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      handlePlayAI(voiceType).then(() => {
        if (currentAudioUrl) {
          const a = document.createElement("a");
          a.href = currentAudioUrl;
          a.download = `sanatan-audio-${title.slice(0, 20)}.wav`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      });
    }
  };

  const progressPercent = activeDuration > 0 ? (activeCurrentTime / activeDuration) * 100 : 0;
  const isNe = language === "ne";

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-primary/5 to-amber-600/5 border border-primary/20 rounded-2xl p-4 sm:p-5 my-5 shadow-xs transition-all">
      {/* Header & Badges */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              activeIsPlaying
                ? "bg-primary text-white shadow-lg shadow-primary/30 animate-pulse"
                : "bg-primary/10 text-primary"
            }`}
          >
            <Headphones size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-black uppercase tracking-wider text-card-foreground">
                {isNe ? "यो समाचार सुन्नुहोस् (Human Audio)" : "Listen to Article (Human Audio)"}
              </h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/20">
                <Sparkles size={10} />
                {isNe ? "मानव नेपाली आवाज" : "Human Nepali Voice"}
              </span>
              {activeIsPlaying && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {isNe ? "बज्दैछ" : "Playing"}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-text font-medium mt-0.5">
              {isNe
                ? `प्राकृतिक समाचार वाचक • करिब ${estimatedMinutes} मिनेटको वाचन`
                : `Natural Newsreader • ~${estimatedMinutes} min listen`}
            </p>
            {mediaOS && (
              <button
                onClick={handlePlayInMediaOS}
                className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white text-[11px] font-bold transition-all cursor-pointer"
              >
                <Headphones size={12} />
                <span>{isNe ? "पृष्ठभूमिमा सुन्नुहोस् (Persistent Media OS)" : "Listen in Background Player"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Voice Selection (Female / Male) */}
        <div className="flex items-center gap-1.5 bg-background/80 p-1 rounded-xl border border-border-theme self-end sm:self-auto">
          <button
            onClick={() => handleVoiceChange("female")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
              activeVoiceType === "female"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-text hover:text-card-foreground"
            }`}
            title="महिला वाचक (Female Voice)"
          >
            <User size={12} />
            {isNe ? "महिला वाचक" : "Female Voice"}
          </button>
          <button
            onClick={() => handleVoiceChange("male")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
              activeVoiceType === "male"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-text hover:text-card-foreground"
            }`}
            title="पुरुष वाचक (Male Voice)"
          >
            <User size={12} />
            {isNe ? "पुरुष वाचक" : "Male Voice"}
          </button>
        </div>
      </div>

      {/* Interactive Progress Bar */}
      <div className="pt-3 pb-2">
        <div
          ref={progressBarRef}
          onClick={handleSeek}
          className="h-2 w-full bg-muted-area hover:bg-muted-area/80 rounded-full cursor-pointer relative overflow-hidden transition-all group"
        >
          <div
            className="h-full bg-primary rounded-full transition-all duration-150 relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-xs border border-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] font-bold text-muted-text mt-1">
          <span>{formatAudioTime(activeCurrentTime, isNe)}</span>
          {/* Animated visualizer spectrum while playing */}
          {activeIsPlaying && (
            <div className="flex items-center gap-0.5 h-3">
              <span className="w-0.5 bg-primary rounded-full animate-[bounce_1s_infinite_100ms] h-2" />
              <span className="w-0.5 bg-primary rounded-full animate-[bounce_1s_infinite_300ms] h-3" />
              <span className="w-0.5 bg-primary rounded-full animate-[bounce_1s_infinite_200ms] h-1.5" />
              <span className="w-0.5 bg-primary rounded-full animate-[bounce_1s_infinite_400ms] h-2.5" />
              <span className="w-0.5 bg-primary rounded-full animate-[bounce_1s_infinite_150ms] h-2" />
            </div>
          )}
          <span>{activeDuration > 0 ? formatAudioTime(activeDuration, isNe) : formatAudioTime(estimatedMinutes * 60, isNe)}</span>
        </div>
      </div>

      {/* Control Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {/* Playback Transport Controls */}
        <div className="flex items-center gap-2">
          {/* Skip Backward 10s */}
          <button
            onClick={() => handleSkip(-10)}
            disabled={activeDuration <= 0 && !activeIsPlaying && !activeIsPaused}
            className="p-2 rounded-xl bg-background/80 hover:bg-muted-area text-muted-text hover:text-card-foreground transition-all border border-border-theme disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title={isNe ? "१० सेकेन्ड पछाडि" : "Rewind 10s"}
          >
            <RotateCcw size={14} />
          </button>

          {/* Primary Play / Pause Button */}
          <button
            onClick={handlePlay}
            disabled={activeIsLoading}
            className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
          >
            {activeIsLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{isNe ? "लोड हुँदैछ..." : "Loading..."}</span>
              </>
            ) : activeIsPlaying ? (
              <>
                <Pause size={14} />
                <span>{isNe ? "रोक्नुहोस्" : "Pause"}</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>{activeIsPaused ? (isNe ? "जारी राख्नुहोस्" : "Resume") : (isNe ? "सुन्नुहोस्" : "Play Audio")}</span>
              </>
            )}
          </button>

          {/* Skip Forward 10s */}
          <button
            onClick={() => handleSkip(10)}
            disabled={activeDuration <= 0 && !activeIsPlaying && !activeIsPaused}
            className="p-2 rounded-xl bg-background/80 hover:bg-muted-area text-muted-text hover:text-card-foreground transition-all border border-border-theme disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title={isNe ? "१० सेकेन्ड अगाडि" : "Forward 10s"}
          >
            <RotateCw size={14} />
          </button>

          {/* Stop / Reset */}
          {(activeIsPlaying || activeIsPaused) && (
            <button
              onClick={handleStop}
              className="p-2 rounded-xl bg-background/80 hover:bg-red-500/10 hover:text-red-500 text-muted-text transition-all border border-border-theme cursor-pointer"
              title={isNe ? "रिसेट गर्नुहोस्" : "Reset"}
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        {/* Speed, Volume, and Download Options */}
        <div className="flex items-center gap-2">
          {/* Speed Toggle */}
          <button
            onClick={toggleRate}
            className="px-2.5 py-1.5 rounded-xl bg-background/80 hover:bg-muted-area text-[11px] font-black text-card-foreground transition-all border border-border-theme cursor-pointer"
            title={isNe ? "वाचन गति" : "Playback Speed"}
          >
            {activePlaybackRate}x
          </button>

          {/* Mute Toggle */}
          <button
            onClick={() => {
              if (isSyncMode && isThisTrackActive) {
                mediaOS.toggleMute();
              } else {
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                audioPlaybackManager.setVolume(nextMuted ? 0 : volume);
              }
            }}
            className="p-2 rounded-xl bg-background/80 hover:bg-muted-area text-muted-text hover:text-card-foreground transition-all border border-border-theme cursor-pointer"
            title={activeIsMuted ? (isNe ? "ध्वनि खोल्नुहोस्" : "Unmute") : (isNe ? "मौन राख्नुहोस्" : "Mute")}
          >
            {activeIsMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          {/* Download Audio */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-xl bg-background/80 hover:bg-primary/10 hover:text-primary text-muted-text transition-all border border-border-theme cursor-pointer"
            title={isNe ? "अडियो डाउनलोड गर्नुहोस्" : "Download Audio"}
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Error / Fallback Notice */}
      {errorNotice && (
        <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}
    </div>
  );
};

export default ArticleAudioReader;
