/**
 * AudioPlaybackManager - Single Global Audio Controller for SanatanMarga ListenOS
 * 
 * Responsibilities:
 * - Exactly one active audio playback controller per browser tab.
 * - Manages HTMLAudioElement lifecycle (play, pause, resume, stop, seek, volume).
 * - Request generation ID (requestId) and AbortController to prevent race conditions.
 * - Canonical playback states: IDLE | LOADING | PLAYING | PAUSED | STOPPING | ERROR | ENDED.
 * - Autoplay restriction handling (NotAllowedError guidance).
 * - Comprehensive telemetry logging for Admin System Integrity.
 */

export type AudioSourceType = "LOCAL" | "REMOTE_CDN" | "RADIO_STREAM" | "TTS_CACHE";

export type AudioState = "IDLE" | "LOADING" | "PLAYING" | "PAUSED" | "STOPPING" | "ERROR" | "ENDED" | "AUTOP_BLOCKED" | "STREAM_UNAVAILABLE";

export interface AudioTrackMetadata {
  id?: string;
  title: string;
  titleNepali?: string;
  sourceUrl: string;
  duration?: number;
  language?: "ne" | "en";
  voice?: string;
  contentHash?: string;
  sourceType?: AudioSourceType;
  isLiveStream?: boolean;
}

export interface AudioErrorDiagnostic {
  code: number | null;
  codeName: string;
  message: string;
  src: string;
  currentTrackId: string | null;
  cacheKey: string | null;
  sourceType: AudioSourceType;
  networkState: number;
  networkStateName: string;
  readyState: number;
  readyStateName: string;
  timestamp: string;
}

export interface AudioTelemetryStats {
  activePlayers: number;
  playbackStarts: number;
  playbackFailures: number;
  autoplayFailures: number;
  notFoundAssets: number;
  r2Failures: number;
  cdnFailures: number;
  ttsFailures: number;
  abortedRequests: number;
  overlappingIncidents: number;
  startupTimesMs: number[];
  cacheHits: number;
  cacheMisses: number;
  networkDisconnects: number;
  streamUnavailability: number;
}

type AudioListener = (state: AudioState, track: AudioTrackMetadata | null, currentTime: number, duration: number) => void;

class AudioPlaybackManagerClass {
  private audioElement: HTMLAudioElement | null = null;
  private currentTrack: AudioTrackMetadata | null = null;
  private currentState: AudioState = "IDLE";
  private currentRequestId = 0;
  private currentAbortController: AbortController | null = null;
  private listeners: Set<AudioListener> = new Set();
  private volume = 1.0;
  private startupTimerStart = 0;
  private lastErrorDiagnostic: AudioErrorDiagnostic | null = null;

  public telemetry: AudioTelemetryStats = {
    activePlayers: 0,
    playbackStarts: 0,
    playbackFailures: 0,
    autoplayFailures: 0,
    notFoundAssets: 0,
    r2Failures: 0,
    cdnFailures: 0,
    ttsFailures: 0,
    abortedRequests: 0,
    overlappingIncidents: 0,
    startupTimesMs: [],
    cacheHits: 0,
    cacheMisses: 0,
    networkDisconnects: 0,
    streamUnavailability: 0,
  };

  private playbackRate = 1.0;

  constructor() {
    if (typeof window !== "undefined") {
      this.audioElement = new Audio();
      this.audioElement.preload = "auto";
      this.setupAudioListeners();
    }
  }

  private setupAudioListeners() {
    if (!this.audioElement) return;

    this.audioElement.addEventListener("playing", () => {
      this.currentState = "PLAYING";
      this.telemetry.activePlayers = 1;
      const startupDuration = performance.now() - this.startupTimerStart;
      if (startupDuration > 0 && startupDuration < 10000) {
        this.telemetry.startupTimesMs.push(Math.round(startupDuration));
      }
      this.notifyListeners();
    });

    this.audioElement.addEventListener("timeupdate", () => {
      this.notifyListeners();
    });

    this.audioElement.addEventListener("loadedmetadata", () => {
      this.notifyListeners();
    });

    this.audioElement.addEventListener("waiting", () => {
      if (this.currentState !== "STOPPING" && this.currentState !== "IDLE") {
        this.currentState = "LOADING";
        this.notifyListeners();
      }
    });

    this.audioElement.addEventListener("canplay", () => {
      if (this.currentState === "LOADING" && !this.audioElement?.paused) {
        this.currentState = "PLAYING";
      }
      this.notifyListeners();
    });

    this.audioElement.addEventListener("pause", () => {
      if (this.currentState === "PLAYING") {
        this.currentState = "PAUSED";
        this.notifyListeners();
      }
    });

    this.audioElement.addEventListener("ended", () => {
      this.currentState = "ENDED";
      this.telemetry.activePlayers = 0;
      this.notifyListeners();
    });

    this.audioElement.addEventListener("error", (e) => {
      if (this.currentState === "IDLE" || this.currentState === "STOPPING" || !this.audioElement?.src || this.audioElement?.src === window.location.href) {
        return;
      }

      const mediaError = this.audioElement?.error;
      const isLive = this.currentTrack?.isLiveStream || this.currentTrack?.sourceType === "RADIO_STREAM";
      
      this.currentState = isLive ? "STREAM_UNAVAILABLE" : "ERROR";
      this.telemetry.activePlayers = 0;
      this.telemetry.playbackFailures++;
      if (isLive) {
        this.telemetry.streamUnavailability++;
      }

      const errorCodeMap: Record<number, string> = {
        1: "MEDIA_ERR_ABORTED",
        2: "MEDIA_ERR_NETWORK",
        3: "MEDIA_ERR_DECODE",
        4: isLive ? "RADIO_STREAM_UNAVAILABLE" : "MEDIA_ERR_SRC_NOT_SUPPORTED"
      };

      const netStateMap: Record<number, string> = {
        0: "NETWORK_EMPTY",
        1: "NETWORK_IDLE",
        2: "NETWORK_LOADING",
        3: "NETWORK_NO_SOURCE"
      };

      const readyStateMap: Record<number, string> = {
        0: "HAVE_NOTHING",
        1: "HAVE_METADATA",
        2: "HAVE_CURRENT_DATA",
        3: "HAVE_FUTURE_DATA",
        4: "HAVE_ENOUGH_DATA"
      };

      const diagnostic: AudioErrorDiagnostic = {
        code: mediaError?.code ?? null,
        codeName: mediaError?.code ? (errorCodeMap[mediaError.code] || "UNKNOWN_ERROR") : "NO_MEDIA_ERROR",
        message: mediaError?.message || (isLive ? "Radio stream unavailable or format not supported by browser" : "HTMLMediaElement reported playback error"),
        src: this.audioElement?.src || "",
        currentTrackId: this.currentTrack?.id || null,
        cacheKey: this.currentTrack?.contentHash || null,
        sourceType: this.currentTrack?.sourceType || "REMOTE_CDN",
        networkState: this.audioElement?.networkState ?? 0,
        networkStateName: netStateMap[this.audioElement?.networkState ?? 0] || "UNKNOWN",
        readyState: this.audioElement?.readyState ?? 0,
        readyStateName: readyStateMap[this.audioElement?.readyState ?? 0] || "UNKNOWN",
        timestamp: new Date().toISOString()
      };

      this.lastErrorDiagnostic = diagnostic;
      console.warn("[AudioPlaybackManager] Detailed Audio Diagnostic Error:", diagnostic);
      this.notifyListeners();
    });
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    const dur = (this.currentTrack?.isLiveStream || this.currentTrack?.sourceType === "RADIO_STREAM") 
      ? 0 
      : (this.audioElement?.duration || 0);
    listener(this.currentState, this.currentTrack, this.audioElement?.currentTime || 0, dur);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const time = this.audioElement?.currentTime || 0;
    const isLive = this.currentTrack?.isLiveStream || this.currentTrack?.sourceType === "RADIO_STREAM";
    const dur = isLive ? 0 : (this.audioElement?.duration || 0);
    for (const l of this.listeners) {
      try {
        l(this.currentState, this.currentTrack, time, dur);
      } catch (err) {
        console.error("[AudioPlaybackManager] Listener error:", err);
      }
    }
  }

  public async playTrack(track: AudioTrackMetadata, fetchPromiseGenerator?: (signal: AbortSignal) => Promise<string>): Promise<void> {
    const requestId = ++this.currentRequestId;
    this.startupTimerStart = performance.now();

    this.stop();

    if (this.currentTrack) {
      this.telemetry.overlappingIncidents++;
    }

    this.currentState = "LOADING";
    this.currentTrack = track;
    this.notifyListeners();

    if (this.currentAbortController) {
      this.currentAbortController.abort();
    }
    this.currentAbortController = new AbortController();
    const signal = this.currentAbortController.signal;

    try {
      let resolvedUrl = track.sourceUrl;

      if (fetchPromiseGenerator) {
        resolvedUrl = await fetchPromiseGenerator(signal);
      }

      if (requestId !== this.currentRequestId || signal.aborted) {
        this.telemetry.abortedRequests++;
        return;
      }

      if (!this.audioElement) {
        this.audioElement = new Audio();
        this.setupAudioListeners();
      }

      const isLive = track.isLiveStream || track.sourceType === "RADIO_STREAM";
      this.audioElement.preload = isLive ? "none" : "auto";
      this.audioElement.src = resolvedUrl;
      this.audioElement.volume = this.volume;
      this.audioElement.playbackRate = this.playbackRate;
      this.audioElement.load();

      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        await playPromise;
        this.telemetry.playbackStarts++;
      }
    } catch (err: any) {
      if (err.name === "AbortError" || signal.aborted || requestId !== this.currentRequestId) {
        this.telemetry.abortedRequests++;
        return;
      }

      const isLive = track.isLiveStream || track.sourceType === "RADIO_STREAM";
      const isAutoplay = err.name === "NotAllowedError" || err.message?.includes("autoplay") || err.message?.includes("user gesture");

      this.currentState = isAutoplay ? "AUTOP_BLOCKED" : (isLive ? "STREAM_UNAVAILABLE" : "ERROR");
      this.telemetry.playbackFailures++;
      
      if (isAutoplay) {
        this.telemetry.autoplayFailures++;
      } else if (isLive) {
        this.telemetry.streamUnavailability++;
      }

      this.lastErrorDiagnostic = {
        code: null,
        codeName: isAutoplay ? "AUTOPLAY_BLOCKED" : (isLive ? "RADIO_STREAM_UNAVAILABLE" : "PLAYBACK_PROMISE_REJECTED"),
        message: err.message || String(err),
        src: this.audioElement?.src || track.sourceUrl,
        currentTrackId: track.id || null,
        cacheKey: track.contentHash || null,
        sourceType: track.sourceType || "REMOTE_CDN",
        networkState: this.audioElement?.networkState ?? 0,
        networkStateName: "UNKNOWN",
        readyState: this.audioElement?.readyState ?? 0,
        readyStateName: "UNKNOWN",
        timestamp: new Date().toISOString()
      };

      console.warn("[AudioPlaybackManager] Detailed Playback Exception Diagnostic:", this.lastErrorDiagnostic);
      this.notifyListeners();
      throw err;
    }
  }

  public pause() {
    if (this.audioElement && this.currentState === "PLAYING") {
      this.audioElement.pause();
      this.currentState = "PAUSED";
      this.notifyListeners();
    }
  }

  public resume() {
    if (this.audioElement && (this.currentState === "PAUSED" || this.currentState === "AUTOP_BLOCKED" || this.currentState === "ENDED")) {
      this.audioElement.play().then(() => {
        this.currentState = "PLAYING";
        this.notifyListeners();
      }).catch(err => {
        console.error("[AudioPlaybackManager] Resume failed:", err);
        this.currentState = "ERROR";
        this.notifyListeners();
      });
    }
  }

  public stop() {
    this.currentState = "STOPPING";
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
      try {
        this.audioElement.currentTime = 0;
        this.audioElement.removeAttribute("src");
        this.audioElement.load();
      } catch (e) {
        // Non-blocking cleanup
      }
    }
    this.currentState = "IDLE";
    this.currentTrack = null;
    this.telemetry.activePlayers = 0;
    this.notifyListeners();
  }

  public toggle() {
    if (this.currentState === "PLAYING") {
      this.pause();
    } else if (this.currentState === "PAUSED" || this.currentState === "AUTOP_BLOCKED") {
      this.resume();
    } else if (this.currentState === "ENDED") {
      if (this.audioElement) {
        this.audioElement.currentTime = 0;
      }
      this.resume();
    }
  }

  public seek(seconds: number) {
    if (this.currentTrack?.isLiveStream || this.currentTrack?.sourceType === "RADIO_STREAM") {
      return; // Live streams cannot be seeked
    }
    if (this.audioElement && !isNaN(this.audioElement.duration)) {
      this.audioElement.currentTime = Math.max(0, Math.min(seconds, this.audioElement.duration));
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
  }

  public setPlaybackRate(rate: number) {
    if (this.currentTrack?.isLiveStream || this.currentTrack?.sourceType === "RADIO_STREAM") {
      return;
    }
    this.playbackRate = Math.max(0.5, Math.min(3.0, rate));
    if (this.audioElement) {
      this.audioElement.playbackRate = this.playbackRate;
    }
  }

  public getPlaybackRate(): number {
    return this.playbackRate;
  }

  public getCurrentTime(): number {
    return this.audioElement?.currentTime || 0;
  }

  public getDuration(): number {
    if (this.currentTrack?.isLiveStream || this.currentTrack?.sourceType === "RADIO_STREAM") {
      return 0;
    }
    return this.audioElement?.duration || 0;
  }

  public getCurrentTrack(): AudioTrackMetadata | null {
    return this.currentTrack;
  }

  public getState(): AudioState {
    return this.currentState;
  }

  public getLastErrorDiagnostic(): AudioErrorDiagnostic | null {
    return this.lastErrorDiagnostic;
  }

  public getListenerCount(): number {
    return this.listeners.size;
  }
}

export const audioPlaybackManager = new AudioPlaybackManagerClass();
