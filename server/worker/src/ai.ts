import type { Env, RouteContext } from "./types";
import { HttpError, clientIp, json } from "./http";
import { sha256Hex, todayUtc, base64FromBytes, bytesFromBase64, getSnapshotBucket } from "./util";

// In-memory sliding window rate limiting
const ipWindows = new Map<string, { count: number; resetAt: number }>();

export function checkIpRateLimit(req: Request, maxPerMinute = 25): void {
  const ip = clientIp(req);
  const now = Date.now();
  const entry = ipWindows.get(ip);

  if (!entry || now > entry.resetAt) {
    ipWindows.set(ip, { count: 1, resetAt: now + 60000 });
    return;
  }

  if (entry.count >= maxPerMinute) {
    throw new HttpError(429, "rate_limit_exceeded", {
      code: "QUOTA_EXCEEDED",
      fallbackToBrowser: true,
      error: "दर सीमा नाघ्यो (Too many requests, please slow down).",
    });
  }

  entry.count += 1;
}

export async function checkDailyQuota(env: Env, ctx: ExecutionContext): Promise<void> {
  const limit = parseInt(env.AI_DAILY_REQUEST_LIMIT || "5000", 10);
  if (!limit || limit <= 0) return;

  const today = todayUtc();
  const key = `system/ai-usage/${today}.json`;

  try {
    const bucket = getSnapshotBucket(env);
    const obj = await bucket.get(key);
    let count = 0;
    if (obj) {
      const data = (await obj.json()) as { count?: number };
      count = data.count || 0;
    }

    if (count >= limit) {
      throw new HttpError(429, "daily_ai_limit_reached", {
        code: "QUOTA_EXCEEDED",
        fallbackToBrowser: true,
        error: "दैनिक एआई कोटा समाप्त भयो (Daily AI quota reached).",
      });
    }

    // Async increment usage
    ctx.waitUntil(
      (async () => {
        try {
          await bucket.put(key, JSON.stringify({ count: count + 1, date: today }), {
            httpMetadata: { contentType: "application/json" },
          });
        } catch {}
      })()
    );
  } catch (e) {
    if (e instanceof HttpError) throw e;
  }
}

/**
 * Wrap raw 16-bit mono 24kHz PCM into valid WAV container
 */
export function pcmToWav(pcmBytes: Uint8Array, sampleRate = 24000, numChannels = 1): Uint8Array<ArrayBuffer> {
  const pcmLen = pcmBytes.byteLength;
  const buffer = new ArrayBuffer(44 + pcmLen);
  const view = new DataView(buffer);
  const outBytes = new Uint8Array(buffer);

  // RIFF identifier
  outBytes.set([0x52, 0x49, 0x46, 0x46], 0); // 'RIFF'
  // File length - 8
  view.setUint32(4, 36 + pcmLen, true);
  // WAVE identifier
  outBytes.set([0x57, 0x41, 0x56, 0x45], 8); // 'WAVE'

  // fmt subchunk
  outBytes.set([0x66, 0x6d, 0x74, 0x20], 12); // 'fmt '
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  const byteRate = sampleRate * numChannels * 2;
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, numChannels * 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // data subchunk
  outBytes.set([0x64, 0x61, 0x74, 0x61], 36); // 'data'
  view.setUint32(40, pcmLen, true); // Subchunk2Size

  outBytes.set(pcmBytes, 44);
  return outBytes;
}

export async function callGeminiGenerate(
  env: Env,
  prompt: string,
  systemInstruction?: string,
  jsonMode = false,
  modelOverride?: string
): Promise<{ text: string; model: string }> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new HttpError(503, "ai_not_configured", {
      code: "AI_NOT_CONFIGURED",
      fallbackToBrowser: true,
      error: "Gemini API key is not configured.",
    });
  }

  const model = modelOverride || env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 3000,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  if (jsonMode) {
    body.generationConfig.responseMimeType = "application/json";
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 429) {
    throw new HttpError(429, "gemini_quota_exceeded", {
      code: "QUOTA_EXCEEDED",
      fallbackToBrowser: true,
      error: "Gemini सेवा कोटा समाप्त भयो (Gemini API quota exceeded).",
    });
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new HttpError(502, "gemini_error", {
      detail: errText,
      error: "Gemini AI सेवामा त्रुटि देखियो।",
    });
  }

  const data: any = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return { text, model };
}

export async function callGeminiTts(
  env: Env,
  text: string,
  voiceName = "Kore"
): Promise<{ audioWavBytes: Uint8Array<ArrayBuffer> }> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new HttpError(503, "ai_not_configured", {
      code: "AI_NOT_CONFIGURED",
      fallbackToBrowser: true,
      error: "Gemini API key is not configured.",
    });
  }

  const model = env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voiceName || "Kore",
          },
        },
      },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 429) {
    throw new HttpError(429, "tts_quota_exceeded", {
      code: "QUOTA_EXCEEDED",
      fallbackToBrowser: true,
      error: "वाचन सेवा हाल सीमित छ (Gemini TTS rate limit).",
    });
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new HttpError(502, "tts_generation_failed", { detail: errText });
  }

  const data: any = await res.json();
  const pcmBase64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!pcmBase64) {
    throw new HttpError(502, "no_audio_in_response");
  }

  const pcmBytes = bytesFromBase64(pcmBase64);
  const wavBytes = pcmToWav(pcmBytes, 24000, 1);
  return { audioWavBytes: wavBytes };
}
