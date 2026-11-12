import type { Env, AuthUser } from "./types";
import { HttpError } from "./http";
import { base64UrlDecode, copyBytes, timingSafeEqual } from "./util";

interface JwkKey {
  kty: string;
  alg: string;
  use: string;
  kid: string;
  n: string;
  e: string;
}

interface JwksResponse {
  keys: JwkKey[];
}

let cachedJwks: { keys: Map<string, CryptoKey>; expiresAt: number } | null = null;

async function getGoogleJwks(): Promise<Map<string, CryptoKey>> {
  const now = Date.now();
  if (cachedJwks && now < cachedJwks.expiresAt) {
    return cachedJwks.keys;
  }

  const res = await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com");
  if (!res.ok) {
    throw new HttpError(500, "jwks_fetch_failed");
  }

  // Cache-Control max-age header
  const cc = res.headers.get("Cache-Control") || "";
  const match = cc.match(/max-age=(\d+)/);
  const maxAge = match ? parseInt(match[1], 10) : 3600;

  const data = (await res.json()) as JwksResponse;
  const keyMap = new Map<string, CryptoKey>();

  for (const jwk of data.keys) {
    if (jwk.kty === "RSA" && jwk.alg === "RS256") {
      try {
        const cryptoKey = await crypto.subtle.importKey(
          "jwk",
          jwk,
          { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
          false,
          ["verify"]
        );
        keyMap.set(jwk.kid, cryptoKey);
      } catch (err) {
        console.warn("[JWKS] Failed to import key", jwk.kid, err);
      }
    }
  }

  cachedJwks = { keys: keyMap, expiresAt: now + maxAge * 1000 };
  return keyMap;
}

export async function verifyFirebaseIdToken(token: string, projectId: string): Promise<AuthUser> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new HttpError(401, "invalid_token_format");
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  let header: { alg: string; kid: string };
  let payload: {
    iss: string;
    aud: string;
    sub: string;
    exp: number;
    iat: number;
    email?: string;
    email_verified?: boolean;
    role?: string;
    [key: string]: unknown;
  };

  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlDecode(headerB64)));
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
  } catch {
    throw new HttpError(401, "malformed_token_json");
  }

  if (header.alg !== "RS256" || !header.kid) {
    throw new HttpError(401, "unsupported_token_algorithm");
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowSec) {
    throw new HttpError(401, "token_expired");
  }
  if (payload.iat && payload.iat > nowSec + 300) {
    throw new HttpError(401, "token_issued_in_future");
  }

  if (projectId) {
    const expectedIss = `https://securetoken.google.com/${projectId}`;
    if (payload.iss !== expectedIss) {
      throw new HttpError(401, "invalid_issuer");
    }
    if (payload.aud !== projectId) {
      throw new HttpError(401, "invalid_audience");
    }
  }

  if (!payload.sub) {
    throw new HttpError(401, "missing_subject");
  }

  const jwks = await getGoogleJwks();
  const publicKey = jwks.get(header.kid);
  if (!publicKey) {
    throw new HttpError(401, "unknown_signing_key");
  }

  const signedContent = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(signatureB64);

  const isValid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    publicKey,
    copyBytes(signature),
    copyBytes(signedContent)
  );

  if (!isValid) {
    throw new HttpError(401, "invalid_signature");
  }

  return {
    uid: payload.sub,
    email: payload.email || null,
    emailVerified: Boolean(payload.email_verified),
    claims: payload,
  };
}

export async function authenticateRequest(req: Request, env: Env): Promise<AuthUser | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  // Check Admin API Token shortcut
  if (env.ADMIN_API_TOKEN && timingSafeEqual(token, env.ADMIN_API_TOKEN)) {
    return {
      uid: "system_admin",
      email: "admin@sanatanmarga.com",
      emailVerified: true,
      claims: { role: "super_admin", admin: true },
      viaAdminToken: true,
    };
  }

  const projectId = env.FIREBASE_PROJECT_ID || "";
  return verifyFirebaseIdToken(token, projectId);
}

export async function requireUser(req: Request, env: Env): Promise<AuthUser> {
  const user = await authenticateRequest(req, env);
  if (!user) {
    throw new HttpError(401, "authentication_required");
  }
  return user;
}

export async function requireAdmin(req: Request, env: Env): Promise<AuthUser> {
  const user = await requireUser(req, env);
  if (user.viaAdminToken) return user;

  const role = (user.claims.role as string) || "";
  const isPrivileged = role === "super_admin" || role === "admin" || user.claims.admin === true;

  const adminEmails = (env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const userEmail = (user.email || "").toLowerCase();
  const isEmailAdmin = userEmail && user.emailVerified && adminEmails.includes(userEmail);

  if (!isPrivileged && !isEmailAdmin) {
    throw new HttpError(403, "admin_permission_required");
  }

  return user;
}
