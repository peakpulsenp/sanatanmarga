import type { Env } from "./types";
import { HttpError } from "./http";

const enc = new TextEncoder();

export function toHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, "0");
  return out;
}

export async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const bytes = typeof data === "string" ? enc.encode(data) : data;
  const digest = await crypto.subtle.digest("SHA-256", copyBytes(bytes));
  return toHex(digest);
}

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    copyBytes(enc.encode(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, copyBytes(enc.encode(message)));
  return toHex(sig);
}

/** Copy into a fresh ArrayBuffer-backed Uint8Array (keeps BufferSource typing happy). */
export function copyBytes(src: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(src.byteLength));
  out.set(src);
  return out;
}

/** Constant-time string comparison. */
export function timingSafeEqual(a: string, b: string): boolean {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  const len = Math.max(ab.length, bb.length);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < len; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

export function randomHex(bytes: number): string {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return toHex(b);
}

export function uuid(): string {
  return crypto.randomUUID();
}

export function base64FromBytes(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export function bytesFromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, ""));
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function base64UrlDecode(input: string): Uint8Array<ArrayBuffer> {
  let s = input.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return bytesFromBase64(s);
}

/** Deterministic JSON with sorted object keys. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalJson(obj[k])).join(",") + "}";
}

/** Validate an R2 key: no "..", no leading "/", no backslashes or control chars. */
export function safeKey(key: string): string {
  if (!key || key.length > 1024) throw new HttpError(400, "invalid_key");
  if (key.startsWith("/") || key.includes("..") || key.includes("\\") || key.includes("//")) {
    throw new HttpError(400, "invalid_key");
  }
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(key)) throw new HttpError(400, "invalid_key");
  return key;
}

export function isSafeKey(key: string): boolean {
  try {
    safeKey(key);
    return true;
  } catch {
    return false;
  }
}

export function decodePathKey(raw: string): string {
  try {
    return raw
      .split("/")
      .map((seg) => decodeURIComponent(seg))
      .join("/");
  } catch {
    throw new HttpError(400, "invalid_key");
  }
}

export function sanitizeFileName(name: string): string {
  const base = (name || "file").split(/[\\/]/).pop() || "file";
  const cleaned = base
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+/, "")
    .slice(-120);
  return cleaned || "file";
}

export function sanitizeSegment(v: string, fallback: string): string {
  const s = (v || "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
  return s || fallback;
}

export function publicUrlFor(env: Env, origin: string, key: string): string {
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  const base = (env.R2_PUBLIC_URL || "").replace(/\/+$/, "");
  return base ? `${base}/${encoded}` : `${origin}/api/files/${encoded}`;
}

export function todayUtc(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export async function getJson<T = unknown>(bucket: R2Bucket, key: string): Promise<T | null> {
  const obj = await bucket.get(key);
  if (!obj) return null;
  try {
    return (await obj.json()) as T;
  } catch {
    return null;
  }
}

export async function putJson(
  bucket: R2Bucket,
  key: string,
  data: unknown,
  customMetadata?: Record<string, string>,
): Promise<R2Object | null> {
  return bucket.put(key, JSON.stringify(data), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
    customMetadata,
  });
}

export const MIME_ALLOWED = (mime: string): boolean =>
  /^(image|audio|video)\/[a-zA-Z0-9.+-]+$/.test(mime) || mime === "application/pdf";

export const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
