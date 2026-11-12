import React, { createContext, useContext, useMemo, ReactNode } from "react";
import { useAuth } from "@/src/lib/auth";
import { 
  ROLE_DEFINITIONS, 
  MEMBERSHIP_TIERS, 
  REPUTATION_LEVELS, 
  UserPermission, 
  RoleDefinition, 
  MembershipPlan, 
  ReputationLevelInfo 
} from "@/src/constants/permissions";

interface PermissionsContextType {
  userRole: string;
  effectivePermissions: Set<string>;
  hasPermission: (permission: UserPermission) => boolean;
  hasAnyPermission: (permissions: UserPermission[]) => boolean;
  hasAllPermissions: (permissions: UserPermission[]) => boolean;
  roleDefinition: RoleDefinition;
  membershipPlan: MembershipPlan;
  reputationLevel: ReputationLevelInfo;
  reputationScore: number;
  userStatus: "active" | "suspended" | "banned";
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const userRole = user?.role || "public";
  const userStatus = user?.status || "active";
  const reputationScore = user?.reputationScore || 0;
  const membershipTierKey = user?.membershipTier || "free";

  // Derive role definition
  const roleDefinition = useMemo(() => {
    return ROLE_DEFINITIONS[userRole] || ROLE_DEFINITIONS["public"];
  }, [userRole]);

  // Derive effective set of permissions
  const effectivePermissions = useMemo(() => {
    const set = new Set<string>();

    // 1. Role base permissions
    if (roleDefinition.permissions.includes("*")) {
      set.add("*");
    } else {
      roleDefinition.permissions.forEach((p) => set.add(p));
    }

    // 2. Custom explicit user permission overrides
    if (user?.customPermissions && Array.isArray(user.customPermissions)) {
      user.customPermissions.forEach((p) => set.add(p));
    }

    return set;
  }, [roleDefinition, user?.customPermissions]);

  const isSuperAdmin = userRole === "super_admin" || effectivePermissions.has("*");
  const isAdmin = isSuperAdmin || userRole === "admin" || effectivePermissions.has("users.manage");

  const hasPermission = React.useCallback((permission: UserPermission): boolean => {
    if (userStatus === "banned" || userStatus === "suspended") return false;
    if (isSuperAdmin) return true;
    return effectivePermissions.has(permission);
  }, [userStatus, isSuperAdmin, effectivePermissions]);

  const hasAnyPermission = React.useCallback((permissions: UserPermission[]): boolean => {
    if (userStatus === "banned" || userStatus === "suspended") return false;
    if (isSuperAdmin) return true;
    return permissions.some((p) => effectivePermissions.has(p));
  }, [userStatus, isSuperAdmin, effectivePermissions]);

  const hasAllPermissions = React.useCallback((permissions: UserPermission[]): boolean => {
    if (userStatus === "banned" || userStatus === "suspended") return false;
    if (isSuperAdmin) return true;
    return permissions.every((p) => effectivePermissions.has(p));
  }, [userStatus, isSuperAdmin, effectivePermissions]);

  const membershipPlan = useMemo(() => {
    return MEMBERSHIP_TIERS[membershipTierKey] || MEMBERSHIP_TIERS["free"];
  }, [membershipTierKey]);

  const reputationLevel = useMemo(() => {
    const found = REPUTATION_LEVELS.find(
      (lvl) => reputationScore >= lvl.minPoints && reputationScore <= lvl.maxPoints
    );
    return found || REPUTATION_LEVELS[0];
  }, [reputationScore]);

  const contextValue = useMemo(() => ({
    userRole,
    effectivePermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    roleDefinition,
    membershipPlan,
    reputationLevel,
    reputationScore,
    userStatus,
    isSuperAdmin,
    isAdmin,
  }), [
    userRole,
    effectivePermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    roleDefinition,
    membershipPlan,
    reputationLevel,
    reputationScore,
    userStatus,
    isSuperAdmin,
    isAdmin,
  ]);

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextType {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}
