/**
 * SANATANMARGA 5.0 BETA — CLIENT IAM & PROFILE OPERATIONS SERVICE
 * Phase 3E: User-Partitioned Caching, Bounded UX Capabilities Projection, Session Operations & Anti-Leakage Logout
 */

import { 
  UserAccount, 
  EffectivePermissionsResult, 
  ClientCapabilityProjection, 
  UserSession 
} from "../types/iam";

export class ClientIamOS {
  private currentUid: string | null = null;
  private memoryProfile: UserAccount | null = null;
  private memoryCapabilities: ClientCapabilityProjection | null = null;

  constructor() {
    // Initialized client-side
  }

  public setActiveUser(uid: string | null) {
    if (this.currentUid && this.currentUid !== uid) {
      // Swapped user: Immediately purge memory to prevent cross-account leakage
      this.memoryProfile = null;
      this.memoryCapabilities = null;
    }
    this.currentUid = uid;
    if (uid) {
      this.restorePartitionedCache(uid);
    }
  }

  private restorePartitionedCache(uid: string) {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(`sm_iam_profile_${uid}`);
      if (stored) {
        this.memoryProfile = JSON.parse(stored);
      }
      const caps = localStorage.getItem(`sm_iam_caps_${uid}`);
      if (caps) {
        this.memoryCapabilities = JSON.parse(caps);
      }
    } catch (e) {
      console.warn("[IamOS] Could not restore partitioned user cache:", e);
    }
  }

  public onLogout() {
    if (typeof window !== "undefined" && this.currentUid) {
      // Clear memory references
      this.memoryProfile = null;
      this.memoryCapabilities = null;
      this.currentUid = null;
    }
  }

  public getCachedProfile(uid?: string): UserAccount | null {
    if (uid && uid === this.currentUid) {
      return this.memoryProfile;
    }
    if (typeof window !== "undefined" && uid) {
      try {
        const stored = localStorage.getItem(`sm_iam_profile_${uid}`);
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
    return this.memoryProfile;
  }

  public async getMyProfile(options?: { forceRefresh?: boolean }): Promise<UserAccount | null> {
    if (this.memoryProfile && !options?.forceRefresh) {
      return this.memoryProfile;
    }

    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          this.memoryProfile = data.user;
          this.memoryCapabilities = data.capabilities;
          if (typeof window !== "undefined" && data.user.uid) {
            localStorage.setItem(`sm_iam_profile_${data.user.uid}`, JSON.stringify(data.user));
            if (data.capabilities) {
              localStorage.setItem(`sm_iam_caps_${data.user.uid}`, JSON.stringify(data.capabilities));
            }
          }
          return data.user;
        }
      }
    } catch (err) {
      console.warn("[IamOS] Network error fetching profile, using offline partitioned fallback:", err);
    }

    return this.memoryProfile;
  }

  public async updateProfile(fields: Record<string, any>): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields)
      });
      const data = await res.json();
      if (res.ok && data.user) {
        this.memoryProfile = data.user;
        if (typeof window !== "undefined" && data.user.uid) {
          localStorage.setItem(`sm_iam_profile_${data.user.uid}`, JSON.stringify(data.user));
        }
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || "UPDATE_FAILED" };
    } catch (err: any) {
      return { success: false, error: err.message || "NETWORK_ERROR" };
    }
  }

  public async getMySessions(): Promise<UserSession[]> {
    try {
      const res = await fetch("/api/me/sessions");
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data.sessions) ? data.sessions : [];
      }
    } catch (e) {
      console.warn("[IamOS] Error fetching sessions:", e);
    }
    return [];
  }

  public async revokeAllSessions(): Promise<{ success: boolean; revokedCount?: number }> {
    try {
      const res = await fetch("/api/me/sessions/revoke-all", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, revokedCount: data.revokedCount };
      }
    } catch (e) {
      console.warn("[IamOS] Error revoking sessions:", e);
    }
    return { success: false };
  }

  public getCapabilities(): ClientCapabilityProjection {
    if (this.memoryCapabilities) {
      return this.memoryCapabilities;
    }
    return {
      canView: true,
      canEdit: false,
      canPublish: false,
      canDelete: false,
      canModerate: false,
      canManageUsers: false,
      canManageRoles: false,
      canManageSettings: false,
      canManageRevenue: false,
      canVerifySGIS: false,
      canManageAcademy: false,
      _source: "UX_HINT_ONLY"
    };
  }

  public can(capability: keyof Omit<ClientCapabilityProjection, "_source">): boolean {
    const caps = this.getCapabilities();
    return !!caps[capability];
  }
}

export const iamOS = new ClientIamOS();
