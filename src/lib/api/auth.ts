/**
 * Auth Implementation
 * Supports: Firebase Auth (production) + Local Demo Auth (fallback)
 */

import type {
  IAuth,
  User,
  AuthResult,
  IdTokenResult,
  DecodedToken,
  AuthProvider,
  AuthProviderType,
  UserRole,
  UserProvider,
} from "./config";

export type { IAuth, User };
import { auth as demoAuth, signInWithEmailAndPassword as demoSignIn, createUserWithEmailAndPassword as demoCreateUser, signInWithPopup as demoSignInPopup, signOut as demoSignOut, onAuthStateChanged as demoOnAuthStateChanged, getDemoAuthUser, roleFromEmail, demoSignInAs } from "../authClient";
import { demoAuth as demoAuthExport } from "../authClient";

/* ============================================================
 * Firebase Auth Implementation
 * ============================================================ */

class FirebaseAuth implements IAuth {
  private auth: any;
  private initialized = false;

  constructor(config: any) {
    this.initializeApp(config);
  }

  private initializeApp(config: any) {
    import("firebase/app").then(({ initializeApp, getApps }) => {
      const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
      return import("firebase/auth").then((authMod: any) => ({ app, authMod }));
    }).then(({ app, authMod }: any) => {
      this.auth = authMod.getAuth(app);
      if (config.useEmulator && authMod.connectAuthEmulator) {
        authMod.connectAuthEmulator(this.auth, `http://${config.emulatorHost || "localhost"}:${config.emulatorPort || 9099}`);
      }
      if (authMod.setPersistence && authMod.browserLocalPersistence) {
        authMod.setPersistence(this.auth, authMod.browserLocalPersistence).catch(console.warn);
      }
      this.initialized = true;
    }).catch(console.error);
  }

  private ensureAuth() {
    if (!this.initialized || !this.auth) throw new Error("Firebase Auth not initialized");
    return this.auth;
  }

  getCurrentUser(): User | null {
    const user = this.ensureAuth().currentUser;
    if (!user) return null;
    return this.mapUser(user);
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    const auth = this.ensureAuth();
    return auth.onAuthStateChanged((user: any) => {
      callback(user ? this.mapUser(user) : null);
    });
  }

  async signInWithEmailAndPassword(email: string, password: string): Promise<AuthResult> {
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    const cred = await signInWithEmailAndPassword(this.ensureAuth(), email, password);
    return { user: this.mapUser(cred.user), credential: cred };
  }

  async createUserWithEmailAndPassword(email: string, password: string, displayName?: string): Promise<AuthResult> {
    const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
    const cred = await createUserWithEmailAndPassword(this.ensureAuth(), email, password);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    return { user: this.mapUser(cred.user), credential: cred };
  }

  async signInWithPopup(provider: AuthProvider): Promise<AuthResult> {
    const { signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, TwitterAuthProvider, GithubAuthProvider, MicrosoftAuthProvider, AppleAuthProvider, YahooAuthProvider } = await import("firebase/auth");

    let fbProvider: any;
    switch (provider.providerId) {
      case "google.com": fbProvider = new GoogleAuthProvider(); break;
      case "facebook.com": fbProvider = new FacebookAuthProvider(); break;
      case "twitter.com": fbProvider = new TwitterAuthProvider(); break;
      case "github.com": fbProvider = new GithubAuthProvider(); break;
      case "microsoft.com": fbProvider = new MicrosoftAuthProvider(); break;
      case "apple.com": fbProvider = new AppleAuthProvider(); break;
      case "yahoo.com": fbProvider = new YahooAuthProvider(); break;
      default: throw new Error(`Unsupported provider: ${provider.providerId}`);
    }

    const cred = await signInWithPopup(this.ensureAuth(), fbProvider);
    return { user: this.mapUser(cred.user), credential: cred };
  }

  async signOut(): Promise<void> {
    const { signOut } = await import("firebase/auth");
    await signOut(this.ensureAuth());
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    const user = this.ensureAuth().currentUser;
    if (!user) return null;
    return user.getIdToken(forceRefresh);
  }

  async getIdTokenResult(forceRefresh = false): Promise<IdTokenResult> {
    const user = this.ensureAuth().currentUser;
    if (!user) throw new Error("No current user");
    const result = await user.getIdTokenResult(forceRefresh);
    return {
      token: result.token,
      expirationTime: result.expirationTime,
      authTime: result.authTime,
      issuedAt: result.issuedAt,
      claims: result.claims,
    };
  }

  async updateProfile(data: { displayName?: string; photoURL?: string }): Promise<void> {
    const { updateProfile } = await import("firebase/auth");
    const user = this.ensureAuth().currentUser;
    if (!user) throw new Error("No current user");
    await updateProfile(user, data);
  }

  async sendEmailVerification(): Promise<void> {
    const { sendEmailVerification } = await import("firebase/auth");
    const user = this.ensureAuth().currentUser;
    if (!user) throw new Error("No current user");
    await sendEmailVerification(user);
  }

  // Admin methods (require Admin SDK - would be server-side)
  async verifyIdToken(token: string): Promise<DecodedToken> {
    // In production, use Firebase Admin SDK on server
    // For client-side, we can only parse the JWT (not verify signature)
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid token format");
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return { uid: payload.uid, email: payload.email || null, emailVerified: payload.email_verified || false, claims: payload };
  }

  async createCustomToken(uid: string, claims?: Record<string, any>): Promise<string> {
    // Requires Admin SDK - would be called from Cloud Function
    throw new Error("createCustomToken requires Admin SDK (server-side)");
  }

  private mapUser(user: any): User {
    const providerData: UserProvider[] = user.providerData?.map((p: any) => ({
      providerId: p.providerId,
      displayName: p.displayName,
      email: p.email,
      photoURL: p.photoURL,
    })) || [];

    // Determine role from custom claims or email
    const role = (user.customClaims?.role as UserRole) || roleFromEmail(user.email);

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous,
      tenantId: user.tenantId,
      providerData,
      role,
      metadata: {
        createdAt: user.metadata?.creationTime || new Date().toISOString(),
        lastLoginAt: user.metadata?.lastSignInTime || new Date().toISOString(),
      },
    };
  }
}

/* ============================================================
 * Demo Auth Implementation (Current)
 * ============================================================ */

class DemoAuthImpl implements IAuth {
  private listeners = new Set<(user: User | null) => void>();

  getCurrentUser(): User | null {
    const u = getDemoAuthUser();
    return u ? this.mapUser(u) : null;
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.listeners.add(callback);
    // Notify immediately with current user
    callback(this.getCurrentUser());

    const unsub = demoOnAuthStateChanged(null, (user: any) => {
      for (const cb of this.listeners) cb(user ? this.mapUser(user) : null);
    });

    return () => {
      this.listeners.delete(callback);
      unsub();
    };
  }

  async signInWithEmailAndPassword(email: string, password: string): Promise<AuthResult> {
    const { user } = await demoSignIn(demoAuthExport, email, password);
    return { user: this.mapUser(user) };
  }

  async createUserWithEmailAndPassword(email: string, password: string, displayName?: string): Promise<AuthResult> {
    const { user } = await demoCreateUser(demoAuthExport, email, password);
    if (displayName && user) user.displayName = displayName;
    return { user: this.mapUser(user) };
  }

  async signInWithPopup(provider: AuthProvider): Promise<AuthResult> {
    const { user } = await demoSignInPopup(demoAuthExport, provider);
    return { user: this.mapUser(user) };
  }

  async signOut(): Promise<void> {
    await demoSignOut(demoAuthExport);
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    const user = this.getCurrentUser();
    if (!user) return null;
    // Return mock token
    return `demo_token_${user.uid}_${Date.now()}`;
  }

  async getIdTokenResult(forceRefresh = false): Promise<IdTokenResult> {
    const token = await this.getIdToken(forceRefresh);
    if (!token) throw new Error("No current user");
    const user = this.getCurrentUser()!;
    return {
      token,
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      authTime: new Date().toISOString(),
      issuedAt: new Date().toISOString(),
      claims: { role: user.role, uid: user.uid, email: user.email },
    };
  }

  async updateProfile(data: { displayName?: string; photoURL?: string }): Promise<void> {
    // In demo mode, we just update localStorage
    const current = getDemoAuthUser();
    if (!current) throw new Error("No current user");
    const updated = { ...current, displayName: data.displayName || current.displayName, photoURL: data.photoURL || current.photoURL };
    localStorage.setItem("sm_demo_auth_user_v1", JSON.stringify(updated));
    // Notify listeners
    for (const cb of this.listeners) cb(this.mapUser(updated));
  }

  async sendEmailVerification(): Promise<void> {
    // No-op in demo
  }

  async verifyIdToken(token: string): Promise<DecodedToken> {
    if (!token.startsWith("demo_token_")) throw new Error("Invalid demo token");
    const parts = token.split("_");
    const uid = parts[2];
    const user = getDemoAuthUser();
    return { uid, email: user?.email || null, emailVerified: true, claims: { role: user?.role, uid } };
  }

  async createCustomToken(uid: string, claims?: Record<string, any>): Promise<string> {
    return `demo_custom_${uid}_${Date.now()}`;
  }

  private mapUser(user: any): User {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous,
      tenantId: user.tenantId,
      providerData: user.providerData?.map((p: any) => ({
        providerId: p.providerId,
        displayName: p.displayName,
        email: p.email,
        photoURL: p.photoUrl,
      })) || [],
      role: user.role,
      metadata: {
        createdAt: user.createdAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
    };
  }
}

/* ============================================================
 * Auth Providers
 * ============================================================ */

function makeProvider(id: string): AuthProvider {
  const p: AuthProvider = {
    providerId: id,
    setCustomParameters: () => p,
  };
  return p;
}

export function createGoogleProvider(): AuthProvider { return makeProvider("google.com"); }
export function createFacebookProvider(): AuthProvider { return makeProvider("facebook.com"); }
export function createTwitterProvider(): AuthProvider { return makeProvider("twitter.com"); }
export function createGithubProvider(): AuthProvider { return makeProvider("github.com"); }
export function createMicrosoftProvider(): AuthProvider { return makeProvider("microsoft.com"); }
export function createAppleProvider(): AuthProvider { return makeProvider("apple.com"); }
export function createYahooProvider(): AuthProvider { return makeProvider("yahoo.com"); }

/* ============================================================
 * Factory
 * ============================================================ */

export function createAuth(config: any): IAuth {
  if (config.mode === "demo" || !config.firebase) {
    return new DemoAuthImpl();
  }

  return new FirebaseAuth(config.firebase);
}

/* ============================================================
 * Role Helpers (re-export from authClient)
 * ============================================================ */

export { roleFromEmail, demoSignInAs };
export type { UserRole };