export interface Env {
  BUCKET: R2Bucket;
  RATE_KV?: KVNamespace;

  // [vars]
  ALLOWED_ORIGINS?: string;
  R2_PUBLIC_URL?: string;
  FIREBASE_PROJECT_ID?: string;
  GEMINI_MODEL?: string;
  GEMINI_TTS_MODEL?: string;
  AI_DAILY_REQUEST_LIMIT?: string;
  ADMIN_EMAILS?: string;

  // secrets
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ADMIN_API_TOKEN?: string;
  UPLOAD_SIGNING_SECRET?: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  claims: Record<string, unknown>;
  /** true when authenticated via ADMIN_API_TOKEN instead of a Firebase ID token */
  viaAdminToken?: boolean;
}

export interface RouteContext {
  req: Request;
  env: Env;
  ctx: ExecutionContext;
  url: URL;
  params: Record<string, string>;
}

export type Handler = (rc: RouteContext) => Promise<Response> | Response;
