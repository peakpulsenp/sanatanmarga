/**
 * Backend configuration — single source of truth for which backend the app
 * talks to. Everything is driven by Vite env vars so the same build artifact
 * logic works for demo, staging and production deployments.
 *
 *   VITE_API_MODE = demo        -> local-first store (public/demo/seed.json + localStorage)
 *   VITE_API_MODE = firebase    -> Firestore + Firebase Auth, R2 (via API gateway) for media,
 *   VITE_API_MODE = firebase+r2    with automatic R2/local fallback when Firestore quota runs out
 *
 * Secrets NEVER live here. R2 access keys and AI keys belong to the Cloudflare
 * Worker gateway (server/worker). The browser only knows public identifiers.
 */

export type BackendMode = "demo" | "firebase";

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
  databaseId?: string;
}

export interface BackendConfig {
  mode: BackendMode;
  firebase: FirebaseWebConfig | null;
  /** Origin of the API gateway (Cloudflare Worker). Empty = same origin `/api/*`. */
  apiBaseUrl: string;
  /** Public R2 bucket URL / custom domain for media and snapshots. */
  r2PublicUrl: string;
  /** Public R2 bucket URL for Marketplace-media bucket. */
  r2MediaPublicUrl: string;
  /** Public R2 bucket URL for sanatanmarga-snapshots bucket. */
  r2SnapshotsPublicUrl: string;
  /** True when an API gateway is expected to answer `/api/*`. */
  hasApiGateway: boolean;
  /** How long to stay on the fallback path after a Firestore quota error. */
  fallbackCooldownMs: number;
  /** Max cooldown after repeated failed recovery probes. */
  fallbackMaxCooldownMs: number;
  bootstrapSuperAdminEmail: string;
  /** Allow the "continue as demo admin" shortcuts and email-prefix roles. */
  demoLoginEnabled: boolean;
  useEmulators: boolean;
  emulatorHost: string;
}

const env: Record<string, any> = (typeof import.meta !== "undefined" && (import.meta as any).env) || {};

function str(key: string, fallback = ""): string {
  const v = env[key];
  if (typeof v !== "string") return fallback;
  const t = v.trim();
  // Treat untouched .env.example placeholders as "not set".
  if (!t || /^your[-_]/i.test(t) || t.includes("xxxxx")) return fallback;
  return t;
}

function num(key: string, fallback: number): number {
  const n = Number(str(key));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function bool(key: string, fallback: boolean): boolean {
  const v = str(key).toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return fallback;
}

function readFirebase(): FirebaseWebConfig | null {
  const projectId = str("VITE_FIREBASE_PROJECT_ID");
  const apiKey = str("VITE_FIREBASE_API_KEY");
  const appId = str("VITE_FIREBASE_APP_ID");
  if (!projectId || !apiKey || !appId) return null;
  return {
    apiKey,
    projectId,
    appId,
    authDomain: str("VITE_FIREBASE_AUTH_DOMAIN", `${projectId}.firebaseapp.com`),
    storageBucket: str("VITE_FIREBASE_STORAGE_BUCKET") || undefined,
    messagingSenderId: str("VITE_FIREBASE_MESSAGING_SENDER_ID") || undefined,
    measurementId: str("VITE_FIREBASE_MEASUREMENT_ID") || undefined,
    databaseId: str("VITE_FIREBASE_DATABASE_ID") || undefined,
  };
}

function resolveMode(firebase: FirebaseWebConfig | null): BackendMode {
  const raw = str("VITE_API_MODE", "demo").toLowerCase();
  if (raw.startsWith("firebase")) {
    if (!firebase) {
      console.error(
        "[Backend] VITE_API_MODE=%s but VITE_FIREBASE_PROJECT_ID / API_KEY / APP_ID are missing. Falling back to demo mode.",
        raw,
      );
      return "demo";
    }
    return "firebase";
  }
  return "demo";
}

function sanitizeBase(url: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) {
    try {
      const u = new URL(url);
      return `${u.origin}${u.pathname.replace(/\/+$/, "")}`;
    } catch {
      return "";
    }
  }
  return "";
}

const firebase = readFirebase();
const mode = resolveMode(firebase);
const apiBaseUrl = sanitizeBase(str("VITE_API_BASE_URL"));

export const backendConfig: BackendConfig = Object.freeze({
  mode,
  firebase: mode === "firebase" ? firebase : null,
  apiBaseUrl,
  r2PublicUrl: sanitizeBase(str("VITE_R2_PUBLIC_URL")) || sanitizeBase(str("VITE_R2_CUSTOM_DOMAIN")),
  r2MediaPublicUrl: sanitizeBase(str("VITE_R2_MEDIA_PUBLIC_URL")),
  r2SnapshotsPublicUrl: sanitizeBase(str("VITE_R2_SNAPSHOTS_PUBLIC_URL")),
  // In firebase mode a gateway is mandatory (AI, media, certificates, journal).
  hasApiGateway: Boolean(apiBaseUrl) || mode === "firebase" || bool("VITE_SAME_ORIGIN_API", false),
  fallbackCooldownMs: num("VITE_FIRESTORE_FALLBACK_COOLDOWN_MS", 10 * 60 * 1000),
  fallbackMaxCooldownMs: num("VITE_FIRESTORE_FALLBACK_MAX_COOLDOWN_MS", 60 * 60 * 1000),
  bootstrapSuperAdminEmail: str("VITE_BOOTSTRAP_SUPERADMIN_EMAIL", "sagarrana@gmail.com").toLowerCase(),
  demoLoginEnabled: bool("VITE_ENABLE_DEMO_LOGIN", mode === "demo"),
  useEmulators: bool("VITE_FIREBASE_USE_EMULATOR", false),
  emulatorHost: str("VITE_FIREBASE_EMULATOR_HOST", "localhost"),
});

export const isDemoMode = () => backendConfig.mode === "demo";
export const isFirebaseMode = () => backendConfig.mode === "firebase";

/** Resolve an `/api/...` path against the configured gateway origin. */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return backendConfig.apiBaseUrl ? `${backendConfig.apiBaseUrl}${p}` : p;
}

/** Public URL for an R2 object key (falls back to the gateway file proxy). */
export function r2ObjectUrl(key: string): string {
  const clean = key.replace(/^\/+/, "");
  if (
    clean.startsWith("media/") ||
    clean.startsWith("images/") ||
    clean.startsWith("audio/") ||
    clean.startsWith("videos/") ||
    clean.startsWith("documents/") ||
    clean.startsWith("docs/")
  ) {
    const base = backendConfig.r2MediaPublicUrl || backendConfig.r2PublicUrl;
    if (base) return `${base}/${clean}`;
  } else if (clean.startsWith("snapshots/") || clean.startsWith("journal/") || clean.startsWith("fallback/")) {
    const base = backendConfig.r2SnapshotsPublicUrl || backendConfig.r2PublicUrl;
    if (base) return `${base}/${clean}`;
  }
  if (backendConfig.r2PublicUrl) return `${backendConfig.r2PublicUrl}/${clean}`;
  return apiUrl(`/api/files/${clean}`);
}

