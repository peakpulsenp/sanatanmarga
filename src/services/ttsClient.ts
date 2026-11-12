/**
 * Client-side TTS service connecting to the Human Nepali Audio API
 * Supports deterministic hashing, in-memory Blob URL caching, IndexedDB persistence,
 * background pre-generation, and cache invalidation.
 */

// In-memory cache for audio object URLs: key -> Blob URL
const memoryAudioCache = new Map<string, string>();
const activePreloadJobs = new Set<string>();
let ttsRateLimitCooldownUntil = 0;

export interface TTSOptions {
  articleId?: string;
  contentId?: string;
  contentType?: string;
  contentVersion?: string | number;
  voice?: "female" | "male" | "Aoede" | "Kore" | "Fenrir" | "Puck" | string;
  speed?: number;
  title?: string;
  language?: "ne" | "en";
  audioUrl?: string;
}

/**
 * Computes deterministic cache key: audio/{language}/{voice}/{articleId}_v{contentVersion}
 */
export function computeDeterministicAudioKey(
  articleId?: string,
  contentVersion: string | number = "1",
  language = "ne",
  voice = "Aoede"
): string {
  const normVoice = (voice || "Aoede").toLowerCase();
  const normLang = (language || "ne").toLowerCase();
  const idPart = (articleId || "custom").replace(/[^a-zA-Z0-9_-]/g, "");
  const verPart = String(contentVersion || "1");
  return `audio/${normLang}/${normVoice}/${idPart}_v${verPart}`;
}

// Helper: IndexedDB for persistent audio storage across sessions
const DB_NAME = "SanatanAudioStorage";
const DB_VERSION = 1;
const STORE_NAME = "audio_cache";

function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

async function getFromIndexedDB(key: string): Promise<string | null> {
  const db = await openDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          const blobUrl = URL.createObjectURL(req.result.blob);
          memoryAudioCache.set(key, blobUrl);
          resolve(blobUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

const MAX_INDEXEDDB_ENTRIES = 50;

async function saveToIndexedDB(key: string, blob: Blob): Promise<void> {
  const db = await openDB();
  if (!db) return;
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ blob, timestamp: Date.now() }, key);

    // Bounded policy: Evict oldest entries if storage exceeds MAX_INDEXEDDB_ENTRIES
    const countReq = store.count();
    countReq.onsuccess = () => {
      if (countReq.result > MAX_INDEXEDDB_ENTRIES) {
        const cursorReq = store.openCursor();
        let deleted = 0;
        const toDelete = countReq.result - MAX_INDEXEDDB_ENTRIES;
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor && deleted < toDelete) {
            store.delete(cursor.key);
            deleted++;
            cursor.continue();
          }
        };
      }
    };
  } catch (e) {
    console.warn("[IndexedDB] Failed to save audio blob:", e);
  }
}

/**
 * Invalidates cached audio entry for a specific article or all cache
 */
export function invalidateTTSCacheEntry(articleIdOrKey: string): void {
  if (!articleIdOrKey) return;
  for (const [key, url] of memoryAudioCache.entries()) {
    if (key.includes(articleIdOrKey)) {
      URL.revokeObjectURL(url);
      memoryAudioCache.delete(key);
    }
  }

  openDB().then((db) => {
    if (!db) return;
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.openKeyCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          if (String(cursor.key).includes(articleIdOrKey)) {
            store.delete(cursor.key);
          }
          cursor.continue();
        }
      };
    } catch (e) {
      // ignore
    }
  });
}

/**
 * Clears the entire memory audio cache
 */
export function clearTTSCache(): void {
  for (const url of memoryAudioCache.values()) {
    URL.revokeObjectURL(url);
  }
  memoryAudioCache.clear();
}

/**
 * Generates or retrieves cached human Nepali voice audio URL
 */
export async function getHumanNepaliAudio(
  text: string,
  options: TTSOptions = {}
): Promise<{ audioUrl: string; fromCache: boolean; mimeType: string; cacheKey: string }> {
  const voice = options.voice || "Aoede";
  const title = options.title || "";
  const language = options.language || "ne";
  const id = options.contentId || options.articleId;

  // Use deterministic key with text length and version to guarantee updated audio on content change/restore
  const textSample = (title + text).slice(0, 80).replace(/\s+/g, "");
  const versionKey = `${options.contentVersion || "1"}_${textSample.length}`;
  const cacheKey = id
    ? computeDeterministicAudioKey(id, versionKey, language, voice)
    : `${voice}:${title.slice(0, 50)}:${text.slice(0, 300)}`;

  // 0. If pre-generated canonical R2 audioUrl is provided from Snapshot OS, use directly
  // Skip non-existent assets.sanatanmarga.com mock assets to avoid 404s
  if (options.audioUrl && (options.audioUrl.startsWith("http://") || options.audioUrl.startsWith("https://") || options.audioUrl.startsWith("/uploads/"))) {
    if (!options.audioUrl.includes("assets.sanatanmarga.com/audio/tts/")) {
      return {
        audioUrl: options.audioUrl,
        fromCache: true,
        mimeType: "audio/wav",
        cacheKey
      };
    }
  }

  // 1. Check in-memory Blob URL cache
  if (memoryAudioCache.has(cacheKey)) {
    return {
      audioUrl: memoryAudioCache.get(cacheKey)!,
      fromCache: true,
      mimeType: "audio/wav",
      cacheKey
    };
  }

  // 2. Check IndexedDB persistent client storage
  const idbBlobUrl = await getFromIndexedDB(cacheKey);
  if (idbBlobUrl) {
    return {
      audioUrl: idbBlobUrl,
      fromCache: true,
      mimeType: "audio/wav",
      cacheKey
    };
  }

  // Check if active rate limit cooldown is in effect
  if (Date.now() < ttsRateLimitCooldownUntil) {
    throw new Error("वाचन सेवा हाल सीमित छ (Gemini TTS API rate limit). कृपया केही क्षणपछि पुनः प्रयास गर्नुहोस्।");
  }

  // 3. Request server generation / R2 CDN cache
  try {
    const res = await fetch("/api/tts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        title,
        voice,
        speed: options.speed || 1.0,
        articleId: options.articleId,
        contentId: options.contentId || options.articleId,
        contentType: options.contentType || "article",
        language: options.language || "ne",
        contentVersion: options.contentVersion
      }),
    });

    if (res.status === 429) {
      ttsRateLimitCooldownUntil = Date.now() + 45000; // 45-second cooldown
      throw new Error("वाचन सेवा हाल सीमित छ (Gemini TTS API rate limit). कृपया केही क्षणपछि पुनः प्रयास गर्नुहोस्।");
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${res.status}`);
    }

    const data = await res.json();
    if (data.fallbackToBrowser || !data.success) {
      if (data.code === "QUOTA_EXCEEDED") {
        ttsRateLimitCooldownUntil = Date.now() + 45000;
      }
      throw new Error(data.error || "Web Speech fallback requested");
    }

    // Direct R2 Cloudflare URL returned
    if (data.audioUrl && !data.audioBase64) {
      memoryAudioCache.set(cacheKey, data.audioUrl);
      return {
        audioUrl: data.audioUrl,
        fromCache: data.fromCache || false,
        mimeType: data.mimeType || "audio/wav",
        cacheKey
      };
    }

    if (data.audioBase64) {
      // Convert base64 to Blob URL
      const binary = atob(data.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.mimeType || "audio/wav" });
      const audioUrl = URL.createObjectURL(blob);

      memoryAudioCache.set(cacheKey, audioUrl);
      saveToIndexedDB(cacheKey, blob);

      return {
        audioUrl,
        fromCache: data.fromCache || false,
        mimeType: data.mimeType || "audio/wav",
        cacheKey
      };
    }

    if (data.audioUrl) {
      return {
        audioUrl: data.audioUrl,
        fromCache: data.fromCache || false,
        mimeType: data.mimeType || "audio/wav",
        cacheKey
      };
    }

    throw new Error("No audio payload received");
  } catch (err: any) {
    console.warn("[TTS Client] Fallback to direct stream or speech synthesis:", err);
    throw err;
  }
}

/**
 * Background Audio Pre-loader with Immediate Caching
 * Pre-generates and warms audio for all recent news articles to eliminate buffering time.
 */
export async function pregenerateQueueAudio(
  items: Array<{ articleId: string; title: string; contentSummary: string; audioUrl?: string; contentVersion?: string | number }>,
  voice = "Aoede",
  maxItems = 3
): Promise<void> {
  if (!items || items.length === 0) return;
  const targetItems = items.slice(0, maxItems);

  // Process items in small concurrent batches of 2 for fast yet gentle background caching
  const batchSize = 2;
  for (let i = 0; i < targetItems.length; i += batchSize) {
    const batch = targetItems.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async (item) => {
        const cacheKey = computeDeterministicAudioKey(item.articleId, item.contentVersion || "1", "ne", voice);

        // Skip if already in memory or active preload job
        if (memoryAudioCache.has(cacheKey) || activePreloadJobs.has(cacheKey)) return;

        // Check IndexedDB
        const idbUrl = await getFromIndexedDB(cacheKey);
        if (idbUrl) {
          memoryAudioCache.set(cacheKey, idbUrl);
          return;
        }

        // If direct audioUrl exists on the item and is not a known dead asset, warm it directly
        if (item.audioUrl && !item.audioUrl.includes("assets.sanatanmarga.com/audio/tts/")) {
          try {
            const res = await fetch(item.audioUrl, { method: "GET" });
            if (res.ok) {
              const blob = await res.blob();
              const objectUrl = URL.createObjectURL(blob);
              memoryAudioCache.set(cacheKey, objectUrl);
              saveToIndexedDB(cacheKey, blob);
            }
          } catch (e) {
            // Non-blocking network fallback
          }
          return;
        }

        // If no pre-existing audioUrl is provided, do not perform unrequested AI synthesis in background preload.
        // Synthesis is reserved for on-demand playback to respect API rate limits and quotas.
        return;
      })
    );
  }
}

/**
 * Preloads all recent news audio immediately on page load
 */
export async function preloadAllRecentNewsAudio(
  articles: Array<{ id: string; title: string; content?: string; summary?: string; excerpt?: string; audioUrl?: string; tts?: { audioUrl?: string } }>,
  voice = "Aoede"
): Promise<void> {
  if (!articles || articles.length === 0) return;
  const items = articles.map((art) => ({
    articleId: String(art.id),
    title: art.title || "",
    contentSummary: art.content || art.summary || art.excerpt || art.title || "",
    audioUrl: art.audioUrl || art.tts?.audioUrl || undefined,
  }));
  await pregenerateQueueAudio(items, voice, 30);
}

/**
 * Formats seconds into MM:SS format with optional Nepali numeral conversion
 */
export function formatAudioTime(seconds: number, inNepali = true): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  const formatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  if (!inNepali) return formatted;

  const nepaliDigits: Record<string, string> = {
    "0": "०",
    "1": "१",
    "2": "२",
    "3": "३",
    "4": "४",
    "5": "५",
    "6": "६",
    "7": "७",
    "8": "८",
    "9": "९",
  };

  return formatted.replace(/\d/g, (d) => nepaliDigits[d] || d);
}
