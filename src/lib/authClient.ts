/**
 * Local demo authentication.
 *
 * Mirrors the small surface of firebase/auth that this app uses, but stores the
 * signed-in user in localStorage. No network calls and no credentials needed.
 */
import { ensureDemoDb, getDemoDoc, setDemoDoc } from "./demoStore";

export type DemoRole =
  | "super_admin"
  | "admin"
  | "chief_editor"
  | "editor"
  | "moderator"
  | "author"
  | "member"
  | "user";

export interface DemoUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
  isAnonymous: boolean;
  tenantId: string | null;
  providerData: Array<{ providerId: string; displayName?: string; email?: string; photoUrl?: string }>;
  role: DemoRole;
  status?: string;
  membershipTier?: string;
  reputationScore?: number;
  createdAt?: string;
  getIdToken?: (forceRefresh?: boolean) => Promise<string>;
}

const AUTH_KEY = "sm_demo_auth_user_v1";

export const BOOTSTRAP_SUPERADMIN_EMAIL = "sagarrana@gmail.com";

export function roleFromEmail(email?: string | null): DemoRole {
  const value = (email || "").toLowerCase().trim();
  if (!value) return "user";
  if (value === BOOTSTRAP_SUPERADMIN_EMAIL || value.startsWith("admin@") || value === "admin") {
    return "super_admin";
  }
  if (value.startsWith("chief@")) return "chief_editor";
  if (value.startsWith("editor@")) return "editor";
  if (value.startsWith("moderator@")) return "moderator";
  if (value.startsWith("author@")) return "author";
  if (value.startsWith("member@")) return "member";
  return "user";
}

function displayNameFromEmail(email: string): string {
  const base = (email || "प्रयोगकर्ता").split("@")[0];
  return base
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function makeUser(email: string, name?: string): DemoUser {
  const role = roleFromEmail(email);
  return {
    uid: `demo_u_${btoa(email).replace(/[^a-z0-9]/gi, "").slice(0, 18)}`,
    email,
    displayName: name || displayNameFromEmail(email),
    emailVerified: true,
    isAnonymous: false,
    tenantId: null,
    providerData: [{ providerId: "password", email, displayName: name }],
    role,
    status: "active",
    membershipTier: role === "user" ? "free" : "institutional",
    reputationScore: role === "super_admin" ? 980 : role === "editor" ? 640 : 120,
    createdAt: new Date().toISOString(),
    getIdToken: async () => "demo-token",
  };
}

const listeners = new Set<(user: DemoUser | null) => void>();
let currentUser: DemoUser | null = null;
let initialized = false;

function persist(user: DemoUser | null) {
  if (typeof localStorage !== "undefined") {
    try {
      if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      else localStorage.removeItem(AUTH_KEY);
    } catch {}
  }
}

function emit() {
  for (const cb of listeners) {
    try {
      cb(currentUser);
    } catch (err) {
      console.warn("[DemoAuth] listener error", err);
    }
  }
}

function setCurrent(user: DemoUser | null) {
  currentUser = user;
  persist(user);
  emit();
}

async function ensureProfile(user: DemoUser) {
  await ensureDemoDb();
  const existing = getDemoDoc(`users/${user.uid}`);
  if (!existing) {
    setDemoDoc(`users/${user.uid}`, { ...user });
  } else {
    // Keep role aligned with the demo email convention.
    const merged = { ...existing, ...user, role: user.role };
    setDemoDoc(`users/${user.uid}`, merged, true);
  }
}

export function getDemoAuthUser(): DemoUser | null {
  return currentUser;
}

export const demoAuth = {
  get currentUser() {
    return currentUser;
  },
  get uid() {
    return currentUser?.uid || null;
  },
  get email() {
    return currentUser?.email || null;
  },
  onAuthStateChanged(next: (user: DemoUser | null) => void, error?: (err: any) => void) {
    return onAuthStateChanged(demoAuth, next, error);
  },
};

/** firebase/auth compatible helpers */
export const auth = demoAuth;
export const googleProvider = { providerId: "google.com" };

export function onAuthStateChanged(
  _auth: any,
  next: (user: DemoUser | null) => void,
  _error?: (err: any) => void,
  _complete?: () => void,
) {
  listeners.add(next);
  if (!initialized) {
    initialized = true;
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(AUTH_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        currentUser = parsed;
        ensureProfile(parsed);
      }
    } catch {}
  }
  // Always notify asynchronously, like the Firebase SDK.
  setTimeout(() => next(currentUser), 0);
  return () => {
    listeners.delete(next);
  };
}

function authError(code: string, message: string) {
  const err: any = new Error(message);
  err.code = code;
  return err;
}

export async function signInWithEmailAndPassword(
  _auth: any,
  email: string,
  password: string,
): Promise<{ user: DemoUser }> {
  if (!email || !email.includes("@")) {
    throw authError("auth/invalid-email", "Please enter a valid email address.");
  }
  if (!password || password.length < 1) {
    throw authError("auth/invalid-credential", "Please enter your password.");
  }
  const user = makeUser(email);
  await ensureProfile(user);
  setCurrent(user);
  return { user };
}

export async function createUserWithEmailAndPassword(
  _auth: any,
  email: string,
  password: string,
): Promise<{ user: DemoUser }> {
  if (!email || !email.includes("@")) {
    throw authError("auth/invalid-email", "Please enter a valid email address.");
  }
  if (!password || password.length < 6) {
    throw authError("auth/weak-password", "Password must be at least 6 characters.");
  }
  const user = makeUser(email);
  await ensureProfile(user);
  setCurrent(user);
  return { user };
}

export async function sendEmailVerification(_user: any): Promise<void> {
  return;
}

export async function signInWithPopup(_auth: any, _provider: any): Promise<{ user: DemoUser }> {
  const user = makeUser("reader@sanatanmarga.com", "Demo Reader");
  await ensureProfile(user);
  setCurrent(user);
  return { user };
}

export async function signOut(_auth?: any): Promise<void> {
  setCurrent(null);
  initialized = true;
  await Promise.resolve();
}

/** Immediate demo sign-in used by the "Continue as demo admin" shortcut. */
export async function demoSignInAs(role: DemoRole = "super_admin"): Promise<DemoUser> {
  const email =
    role === "admin" || role === "super_admin"
      ? "admin@sanatanmarga.com"
      : role === "editor" || role === "chief_editor"
        ? "editor@sanatanmarga.com"
        : "reader@sanatanmarga.com";
  const user = makeUser(email);
  user.role = role;
  await ensureProfile(user);
  setCurrent(user);
  return user;
}
