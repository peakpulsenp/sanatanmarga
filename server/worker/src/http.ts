import type { Env } from "./types";

export class HttpError extends Error {
  status: number;
  extra?: Record<string, unknown>;
  constructor(status: number, message: string, extra?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export function json(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  const h = new Headers(headers);
  h.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { status, headers: h });
}

export function errorResponse(status: number, error: string, extra: Record<string, unknown> = {}): Response {
  return json({ success: false, error, ...extra }, status);
}

export const ALLOWED_HEADERS = "Content-Type, Authorization, X-User-Uid, X-User-Email, X-Idempotency-Key";
export const ALLOWED_METHODS = "GET, POST, PUT, DELETE, OPTIONS";

function resolveOrigin(req: Request, env: Env): string | null {
  const origin = req.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.includes("*")) return origin || "*";
  if (origin && allowed.includes(origin)) return origin;
  return null;
}

/** Returns a copy of the response with CORS + security headers applied. */
export function finalize(res: Response, req: Request, env: Env): Response {
  const out = new Response(res.status === 204 || res.status === 304 ? null : res.body, res);
  const h = out.headers;
  const origin = resolveOrigin(req, env);
  if (origin) {
    h.set("Access-Control-Allow-Origin", origin);
    if (origin !== "*") h.set("Access-Control-Allow-Credentials", "true");
  }
  h.append("Vary", "Origin");
  h.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  h.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
  h.set("Access-Control-Expose-Headers", "ETag, Content-Length, Content-Type");
  h.set("Access-Control-Max-Age", "86400");
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("X-Frame-Options", "DENY");
  if (!h.has("Cache-Control")) h.set("Cache-Control", "no-store");
  return out;
}

export async function readText(req: Request, maxBytes: number): Promise<string> {
  const len = Number(req.headers.get("Content-Length") || "0");
  if (len > maxBytes) throw new HttpError(413, "payload_too_large", { maxBytes });
  const text = await req.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new HttpError(413, "payload_too_large", { maxBytes });
  }
  return text;
}

export async function readJson<T = Record<string, unknown>>(req: Request, maxBytes = 1024 * 1024): Promise<T> {
  const text = await readText(req, maxBytes);
  if (!text.trim()) throw new HttpError(400, "empty_body");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, "invalid_json");
  }
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("CF-Connecting-IP") ||
    (req.headers.get("X-Forwarded-For") || "").split(",")[0].trim() ||
    "unknown"
  );
}

export function str(v: unknown, max = 10_000): string {
  if (typeof v !== "string") return "";
  return v.length > max ? v.slice(0, max) : v;
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
