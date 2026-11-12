/**
 * SanatanMarga Production API Configuration
 * Supports both:
 * 1. Unified Render Web Service (relative paths /api/...)
 * 2. Split Architecture (VITE_API_BASE_URL=https://api.sanatanmarga.com)
 */

/**
 * Validate that an API base URL is a genuine HTTP(S) URL or valid path prefix,
 * not a credential, token, key, or opaque identifier.
 */
function isValidApiBase(val: unknown): val is string {
  if (typeof val !== "string") return false;
  const trimmed = val.trim();
  if (!trimmed) return false;

  // Check for absolute URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      return Boolean(parsed.hostname);
    } catch {
      return false;
    }
  }

  // Check for valid relative path prefix (e.g. /api or /v1)
  if (trimmed.startsWith("/")) {
    // Relative path should not contain spaces, credentials, colons, or suspicious token lengths
    return /^\/[a-zA-Z0-9_\-/]*$/.test(trimmed) && trimmed.length <= 64;
  }

  return false;
}

export const getApiBaseUrl = (): string => {
  if (typeof window === "undefined") {
    const envBase = process.env.API_BASE_URL;
    if (isValidApiBase(envBase)) {
      return envBase.trim().replace(/\/$/, "");
    }
    return "http://localhost:3000";
  }

  const metaEnv = typeof import.meta !== "undefined" ? (import.meta as any)?.env : undefined;
  const viteApiBase = metaEnv?.VITE_API_BASE_URL;
  if (isValidApiBase(viteApiBase)) {
    return viteApiBase.trim().replace(/\/$/, "");
  }

  return "";
};

export const resolveApiUrl = (path: string): string => {
  if (!path.startsWith("/")) {
    path = "/" + path;
  }
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
};

/**
 * Standard API request wrapper that respects VITE_API_BASE_URL
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let target = input;
  if (typeof input === "string" && input.startsWith("/api/")) {
    target = resolveApiUrl(input);
  }
  return fetch(target, init);
}

/**
 * Backward compatibility interceptor setup (no-op to prevent unsafe window.fetch mutation)
 */
export function initApiInterceptors() {
  const base = getApiBaseUrl();
  if (base) {
    try {
      const parsed = new URL(base, window.location.origin);
      console.info(`[API_CONFIG] API Base URL configured: ${parsed.origin}${parsed.pathname === '/' ? '' : parsed.pathname}`);
    } catch {
      console.info("[API_CONFIG] API Base URL configured (relative endpoint)");
    }
  }
}

