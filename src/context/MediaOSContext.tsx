import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Article } from "@/src/types";
import { PlaylistEngine, PlaylistPolicyEngine, PlaylistItem, SavedPlaylist, ListenOSDiagnostics } from "@/src/services/playlistEngine";
import type { MembershipTier } from "@/src/services/articleModuleRegistry";
import { getHumanNepaliAudio, pregenerateQueueAudio } from "@/src/services/ttsClient";
import { continuityEngine } from "@/src/lib/continuityEngine";
import { audioPlaybackManager, AudioState } from "@/src/services/audioPlaybackManager";

export type PlayerUIState = "hidden" | "minimized" | "expanded";
export type RepeatMode = "off" | "all" | "one";

// Helper: Check if article timestamp matches today in Nepal Timezone (Asia/Kathmandu: UTC+05:45)
export function isNepalToday(isoOrTimestamp?: string | number | Date): boolean {
  if (!isoOrTimestamp) return false;
  const nepalOffsetMs = 345 * 60 * 1000;
  const nowMs = Date.now();
  const nepalNow = new Date(nowMs + nepalOffsetMs);
  const todayNepalStr = `${nepalNow.getUTCFullYear()}-${String(nepalNow.getUTCMonth() + 1).padStart(2, "0")}-${String(nepalNow.getUTCDate()).padStart(2, "0")}`;

  const targetDate = new Date(isoOrTimestamp);
  if (isNaN(targetDate.getTime())) return false;
  const nepalTarget = new Date(targetDate.getTime() + nepalOffsetMs);
  const targetNepalStr = `${nepalTarget.getUTCFullYear()}-${String(nepalTarget.getUTCMonth() + 1).padStart(2, "0")}-${String(nepalTarget.getUTCDate()).padStart(2, "0")}`;

  return todayNepalStr === targetNepalStr;
}

interface MediaOSContextType {
  currentTrack: PlaylistItem | null;
  queue: PlaylistItem[];
  currentIndex: number;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
  playerState: PlayerUIState;
  queueTitle: string;
  voiceGender: "female" | "male";
  savedPlaylists: SavedPlaylist[];
  diagnostics: ListenOSDiagnostics | null;
  
  // Actions
  playArticle: (article: Article) => Promise<void>;
  playTrack: (track: Partial<PlaylistItem> & { id: string; title: string; audioUrl?: string; subtitle?: string; type?: string }) => Promise<void>;
  enqueueArticle: (article: Article) => void;
  playQueue: (articles: Article[], queueTitle: string) => Promise<void>;
  playSavedPlaylist: (playlist: SavedPlaylist) => Promise<void>;
  deletePlaylist: (playlistId: string) => void;
  refreshListenOSQueue: (tier?: MembershipTier) => Promise<void>;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  seek: (seconds: number) => void;
  skipSeconds: (seconds: number) => void;
  setRate: (rate: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  setRepeat: (mode: RepeatMode) => void;
  setPlayerState: (state: PlayerUIState) => void;
  setVoiceGender: (gender: "female" | "male") => void;
  removeFromQueue: (itemId: string) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  closePlayer: () => void;
  savePlaylist: (title: string) => void;
}

const MediaOSContext = createContext<MediaOSContextType | null>(null);

export const MediaOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [playerState, setPlayerState] = useState<PlayerUIState>("hidden");
  const [queueTitle, setQueueTitle] = useState<string>("SanatanMarga Queue");
  const [voiceGender, setVoiceGender] = useState<"female" | "male">("female");
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>([]);
  const [diagnostics, setDiagnostics] = useState<ListenOSDiagnostics | null>(null);

  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSpeechFallback = useRef<boolean>(false);
  const lastEmittedTimeRef = useRef<number>(0);
  const lastTrackStartTimeRef = useRef<number>(0);

  // Sync refs to avoid stale closures in callbacks
  const queueRef = useRef<PlaylistItem[]>(queue);
  const currentIndexRef = useRef<number>(currentIndex);
  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  const voiceGenderRef = useRef<"female" | "male">(voiceGender);
  const playbackRateRef = useRef<number>(playbackRate);
  const volumeRef = useRef<number>(volume);
  const isMutedRef = useRef<boolean>(isMuted);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { voiceGenderRef.current = voiceGender; }, [voiceGender]);
  useEffect(() => { playbackRateRef.current = playbackRate; }, [playbackRate]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  const currentTrack = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  // Track termination & Auto-advance
  const handleTrackEnded = useCallback(() => {
    // If track finished/errored in under 1.5s, prevent runaway skip loops across queue
    if (Date.now() - lastTrackStartTimeRef.current < 1500) {
      setIsPlaying(false);
      setIsBuffering(false);
      return;
    }

    const q = queueRef.current;
    const currIdx = currentIndexRef.current;
    const mode = repeatModeRef.current;

    if (mode === "one") {
      playTrackAtIndex(currIdx);
    } else if (currIdx < q.length - 1) {
      playTrackAtIndex(currIdx + 1);
    } else if (mode === "all" && q.length > 0) {
      playTrackAtIndex(0);
    } else {
      setIsPlaying(false);
    }
  }, []);

  // Web Speech Synthesis Fallback
  const fallbackToSpeechSynthesis = useCallback(() => {
    const q = queueRef.current;
    const currIdx = currentIndexRef.current;
    const track = currIdx >= 0 && currIdx < q.length ? q[currIdx] : null;

    if (!track || typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsPlaying(false);
      setIsBuffering(false);
      return;
    }
    window.speechSynthesis.cancel();
    isSpeechFallback.current = true;
    lastTrackStartTimeRef.current = Date.now();

    const summary = track.contentSummary || "";
    const normTitle = track.title.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
    const normSummary = summary.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
    const speechText = (normSummary && normSummary.startsWith(normTitle))
      ? summary
      : `${track.title}। ${summary}`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = "ne-NP";
    utterance.rate = playbackRateRef.current;

    utterance.onend = () => {
      setIsPlaying(false);
      handleTrackEnded();
    };

    utterance.onerror = (e) => {
      console.warn("[MediaOS] SpeechSynthesis error:", e);
      setIsPlaying(false);
      setIsBuffering(false);
    };

    speechUtteranceRef.current = utterance;
    setIsBuffering(false);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  }, [handleTrackEnded]);

  // Load and play a specific track by index via central audioPlaybackManager
  const playTrackAtIndex = useCallback(async (index: number, customVoice?: "female" | "male") => {
    const q = queueRef.current;
    if (index < 0 || index >= q.length) return;
    
    setCurrentIndex(index);
    currentIndexRef.current = index;

    const track = q[index];
    if (!track) return;

    setPlayerState((prev) => (prev === "hidden" ? "minimized" : prev));
    setIsBuffering(true);
    setIsPlaying(false);
    lastTrackStartTimeRef.current = Date.now();

    // Stop any speech synthesis
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sanatan-media-mutex", { detail: { source: "media-os" } }));
    }
    isSpeechFallback.current = false;

    const activeGender = customVoice || voiceGenderRef.current;
    const voiceName = activeGender === "female" ? "Aoede" : "Fenrir";

    // Clean audio source: filter out known 404/dead mock URLs
    const isMock404 = track.audioUrl && track.audioUrl.includes("assets.sanatanmarga.com/audio/tts/");
    const safeAudioUrl = isMock404 ? "" : (track.audioUrl || "");

    try {
      await audioPlaybackManager.playTrack(
        {
          id: track.articleId || track.id,
          title: track.title,
          sourceUrl: safeAudioUrl,
          language: "ne",
          voice: voiceName,
        },
        async (signal) => {
          if (safeAudioUrl) return safeAudioUrl;
          const bodyText = track.contentSummary || track.title;
          const result = await getHumanNepaliAudio(bodyText, {
            title: track.title,
            voice: voiceName,
            speed: playbackRateRef.current,
            articleId: track.articleId || track.id,
            contentId: track.articleId || track.id,
            contentType: "article",
            audioUrl: safeAudioUrl,
          });
          if (signal.aborted) {
            throw new DOMException("Aborted", "AbortError");
          }
          return result.audioUrl;
        }
      );
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.warn("[MediaOS] Network TTS failed, using Web Speech synthesis fallback:", err);
      fallbackToSpeechSynthesis();
    }
  }, [fallbackToSpeechSynthesis]);

  // External Action: Refresh ListenOS Queue with PlaylistPolicyEngine
  const refreshListenOSQueue = useCallback(async (tier: MembershipTier = 'free') => {
    try {
      const articles = await continuityEngine.getRecentArticles(50);
      const { queueTitle: title, items, diagnostics: diag } = PlaylistPolicyEngine.buildListenOSPlaylist(articles, tier);
      setQueue(items);
      queueRef.current = items;
      setQueueTitle(title);
      setDiagnostics(diag);
      if (items.length > 0 && currentIndexRef.current === -1) {
        setCurrentIndex(0);
        currentIndexRef.current = 0;
      }
      pregenerateQueueAudio(items.slice(0, 2), voiceGenderRef.current === "female" ? "Aoede" : "Fenrir", 2);
    } catch (err) {
      console.warn("Failed to refresh ListenOS queue:", err);
    }
  }, []);

  // Subscribe to central audioPlaybackManager events
  useEffect(() => {
    const unsubscribe = audioPlaybackManager.subscribe((state: AudioState, track, time, dur) => {
      if (isSpeechFallback.current) return;

      if (state === "PLAYING") {
        setIsPlaying(true);
        setIsBuffering(false);
      } else if (state === "LOADING") {
        setIsBuffering(true);
      } else if (state === "PAUSED") {
        setIsPlaying(false);
        setIsBuffering(false);
      } else if (state === "ENDED") {
        setIsPlaying(false);
        setIsBuffering(false);
        handleTrackEnded();
      } else if (state === "IDLE" || state === "ERROR") {
        setIsPlaying(false);
        setIsBuffering(false);
      }

      // Throttle sub-second time updates to ~500ms intervals to prevent app-wide render storms
      if (!isNaN(time)) {
        const diff = Math.abs(time - lastEmittedTimeRef.current);
        if (diff >= 0.5 || time === 0) {
          lastEmittedTimeRef.current = time;
          setCurrentTime(time);
        }
      }

      if (!isNaN(dur) && isFinite(dur) && dur > 0) {
        setDuration(dur);
      }
    });

    // Restore previous state if present or load today's verified articles via PlaylistPolicyEngine
    const saved = PlaylistEngine.loadSessionState();
    if (saved && saved.queue.length > 0) {
      setQueue(saved.queue);
      queueRef.current = saved.queue;
      const validIdx = Math.min(saved.currentIndex || 0, saved.queue.length - 1);
      setCurrentIndex(validIdx);
      currentIndexRef.current = validIdx;
      setQueueTitle(saved.queueTitle || "SanatanMarga Queue");
      setPlayerState("minimized");
      pregenerateQueueAudio(saved.queue.slice(0, 2), voiceGenderRef.current === "female" ? "Aoede" : "Fenrir", 2);
    } else {
      refreshListenOSQueue('free');
    }

    setSavedPlaylists(PlaylistEngine.getSavedPlaylists());

    const handleExternalMutex = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.source && detail.source !== "media-os") {
        audioPlaybackManager.pause();
        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("sanatan-media-mutex", handleExternalMutex);
    }

    return () => {
      unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener("sanatan-media-mutex", handleExternalMutex);
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      }
    };
  }, [handleTrackEnded, refreshListenOSQueue]);

  // Save state on queue or index changes
  useEffect(() => {
    if (queue.length > 0) {
      PlaylistEngine.saveSessionState({
        queue,
        currentIndex,
        currentTime,
        queueTitle,
      });
    }
  }, [queue, currentIndex, queueTitle, currentTime]);

  // Change voice gender & regenerate current track if playing
  const handleSetVoiceGender = useCallback((gender: "female" | "male") => {
    setVoiceGender(gender);
    voiceGenderRef.current = gender;
    if (currentIndexRef.current >= 0 && currentIndexRef.current < queueRef.current.length) {
      playTrackAtIndex(currentIndexRef.current, gender);
    }
  }, [playTrackAtIndex]);

  // External Action: Play single article
  const playArticle = useCallback(async (article: Article) => {
    const item = PlaylistEngine.articleToPlaylistItem(article);
    const newQueue = [item];
    setQueue(newQueue);
    queueRef.current = newQueue;
    setQueueTitle(`🎧 ${article.title.slice(0, 30)}...`);
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setPlayerState("minimized");
    await playTrackAtIndex(0);
  }, [playTrackAtIndex]);

  // External Action: Play direct podcast/radio/audio track
  const playTrack = useCallback(async (trackInput: Partial<PlaylistItem> & { id: string; title: string; audioUrl?: string; subtitle?: string; type?: string }) => {
    const item: PlaylistItem = {
      id: trackInput.id,
      articleId: trackInput.articleId || trackInput.id,
      title: trackInput.title,
      category: trackInput.subtitle || trackInput.category || "ListenOS",
      audioUrl: trackInput.audioUrl || "",
      contentSummary: trackInput.contentSummary || trackInput.title,
      duration: trackInput.duration || 180,
      addedAt: trackInput.addedAt || new Date().toISOString(),
      imageUrl: trackInput.imageUrl
    };
    const newQueue = [item];
    setQueue(newQueue);
    queueRef.current = newQueue;
    setQueueTitle(`🎧 ${trackInput.title.slice(0, 30)}`);
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setPlayerState("minimized");
    await playTrackAtIndex(0);
  }, [playTrackAtIndex]);

  // External Action: Enqueue article
  const enqueueArticle = useCallback((article: Article) => {
    const item = PlaylistEngine.articleToPlaylistItem(article);
    setQueue((prev) => {
      const next = [...prev, item];
      queueRef.current = next;
      return next;
    });
    setPlayerState((prev) => (prev === "hidden" ? "minimized" : prev));
  }, []);

  // External Action: Play entire queue (Category / District / Page / Briefing)
  const playQueue = useCallback(async (articles: Article[], title: string) => {
    if (!articles || articles.length === 0) return;
    const items = articles.map((a) => PlaylistEngine.articleToPlaylistItem(a));
    setQueue(items);
    queueRef.current = items;
    setQueueTitle(title);
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setPlayerState("minimized");
    await playTrackAtIndex(0);
  }, [playTrackAtIndex]);

  // External Action: Play saved playlist
  const playSavedPlaylist = useCallback(async (playlist: SavedPlaylist) => {
    if (!playlist.items || playlist.items.length === 0) return;
    setQueue(playlist.items);
    queueRef.current = playlist.items;
    setQueueTitle(`🎧 ${playlist.title}`);
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setPlayerState("minimized");
    await playTrackAtIndex(0);
  }, [playTrackAtIndex]);

  // External Action: Delete saved playlist
  const deletePlaylist = useCallback((playlistId: string) => {
    const updated = PlaylistEngine.deletePlaylist(playlistId);
    setSavedPlaylists(updated);
  }, []);

  // Play / Pause Toggle
  const togglePlay = useCallback(() => {
    const q = queueRef.current;
    const curr = currentIndexRef.current;

    if (!currentTrack && q.length > 0) {
      playTrackAtIndex(0);
      return;
    }

    if (isSpeechFallback.current && typeof window !== "undefined" && window.speechSynthesis) {
      if (isPlaying) {
        window.speechSynthesis.pause();
        setIsPlaying(false);
      } else {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      }
      return;
    }

    const state = audioPlaybackManager.getState();
    if (state === "PLAYING") {
      audioPlaybackManager.pause();
    } else if (state === "PAUSED" || state === "AUTOP_BLOCKED") {
      audioPlaybackManager.resume();
    } else {
      if (curr >= 0 && curr < q.length) {
        playTrackAtIndex(curr);
      } else if (q.length > 0) {
        playTrackAtIndex(0);
      }
    }
  }, [currentTrack, isPlaying, playTrackAtIndex]);

  const playNext = useCallback(() => {
    const q = queueRef.current;
    const curr = currentIndexRef.current;
    if (curr < q.length - 1) {
      playTrackAtIndex(curr + 1);
    } else if (repeatModeRef.current === "all" && q.length > 0) {
      playTrackAtIndex(0);
    }
  }, [playTrackAtIndex]);

  const seek = useCallback((seconds: number) => {
    audioPlaybackManager.seek(seconds);
    lastEmittedTimeRef.current = seconds;
    setCurrentTime(seconds);
  }, []);

  const playPrev = useCallback(() => {
    const curr = currentIndexRef.current;
    if (currentTime > 3) {
      seek(0);
    } else if (curr > 0) {
      playTrackAtIndex(curr - 1);
    } else {
      seek(0);
    }
  }, [currentTime, playTrackAtIndex, seek]);

  const skipSeconds = useCallback((seconds: number) => {
    const newTime = currentTime + seconds;
    seek(newTime);
  }, [currentTime, seek]);

  const setRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    playbackRateRef.current = rate;
    audioPlaybackManager.setPlaybackRate(rate);
  }, []);

  const setVol = useCallback((vol: number) => {
    setVolume(vol);
    volumeRef.current = vol;
    audioPlaybackManager.setVolume(isMutedRef.current ? 0 : vol);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      audioPlaybackManager.setVolume(next ? 0 : volumeRef.current);
      return next;
    });
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((prev) => !prev), []);
  const setRepeat = useCallback((mode: RepeatMode) => setRepeatMode(mode), []);

  const removeFromQueue = useCallback((itemId: string) => {
    setQueue((prev) => {
      const idx = prev.findIndex((i) => i.id === itemId);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);

      if (idx === currentIndexRef.current) {
        if (next.length === 0) {
          audioPlaybackManager.stop();
          setCurrentIndex(-1);
          setPlayerState("hidden");
        } else {
          const nextIdx = Math.min(idx, next.length - 1);
          setCurrentIndex(nextIdx);
        }
      } else if (idx < currentIndexRef.current) {
        setCurrentIndex((c) => c - 1);
      }
      return next;
    });
  }, []);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue((prev) => {
      const result = [...prev];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  }, []);

  const clearQueue = useCallback(() => {
    audioPlaybackManager.stop();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setQueue([]);
    setCurrentIndex(-1);
    setIsPlaying(false);
    setPlayerState("hidden");
  }, []);

  const closePlayer = useCallback(() => {
    audioPlaybackManager.stop();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isSpeechFallback.current = false;
    setIsPlaying(false);
    setIsBuffering(false);
    setPlayerState("hidden");
  }, []);

  const handleSetPlayerState = useCallback((state: PlayerUIState) => {
    if (state === "hidden") {
      audioPlaybackManager.stop();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      isSpeechFallback.current = false;
      setIsPlaying(false);
      setIsBuffering(false);
    }
    setPlayerState(state);
  }, []);

  const savePlaylist = useCallback((title: string) => {
    if (queueRef.current.length === 0) return;
    const updated = PlaylistEngine.savePlaylist(title, queueRef.current);
    setSavedPlaylists(updated);
  }, []);

  // Sync MediaSession API for hardware/lockscreen controls
  useEffect(() => {
    if (typeof navigator !== "undefined" && "mediaSession" in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.category || "SanatanMarga Listen",
        album: currentTrack.district || "Civilizational Media",
        artwork: currentTrack.imageUrl ? [{ src: currentTrack.imageUrl }] : [],
      });

      navigator.mediaSession.setActionHandler("play", () => togglePlay());
      navigator.mediaSession.setActionHandler("pause", () => togglePlay());
      navigator.mediaSession.setActionHandler("previoustrack", () => playPrev());
      navigator.mediaSession.setActionHandler("nexttrack", () => playNext());
    }
  }, [currentTrack, togglePlay, playPrev, playNext]);

  const contextValue = useMemo(() => ({
    currentTrack,
    queue,
    currentIndex,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    playbackRate,
    volume,
    isMuted,
    shuffle,
    repeatMode,
    playerState,
    queueTitle,
    voiceGender,
    savedPlaylists,
    diagnostics,
    playArticle,
    playTrack,
    enqueueArticle,
    playQueue,
    playSavedPlaylist,
    deletePlaylist,
    refreshListenOSQueue,
    togglePlay,
    playNext,
    playPrev,
    seek,
    skipSeconds,
    setRate,
    setVolume: setVol,
    toggleMute,
    toggleShuffle,
    setRepeat,
    setPlayerState: handleSetPlayerState,
    setVoiceGender: handleSetVoiceGender,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    closePlayer,
    savePlaylist,
  }), [
    currentTrack,
    queue,
    currentIndex,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    playbackRate,
    volume,
    isMuted,
    shuffle,
    repeatMode,
    playerState,
    queueTitle,
    voiceGender,
    savedPlaylists,
    diagnostics,
    playArticle,
    playTrack,
    enqueueArticle,
    playQueue,
    playSavedPlaylist,
    deletePlaylist,
    refreshListenOSQueue,
    togglePlay,
    playNext,
    playPrev,
    seek,
    skipSeconds,
    setRate,
    setVol,
    toggleMute,
    toggleShuffle,
    setRepeat,
    handleSetPlayerState,
    handleSetVoiceGender,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    closePlayer,
    savePlaylist,
  ]);

  return (
    <MediaOSContext.Provider value={contextValue}>
      {children}
    </MediaOSContext.Provider>
  );
};

export const useMediaOS = () => {
  const context = useContext(MediaOSContext);
  if (!context) {
    throw new Error("useMediaOS must be used within a MediaOSProvider");
  }
  return context;
};
