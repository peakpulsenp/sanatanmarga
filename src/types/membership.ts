import { UserPermission } from "../constants/permissions";

export type MembershipTier = "free" | "patron" | "sadhak" | "sanrakshak" | "corporate";

export type ReputationLevelKey = "explorer" | "contributor" | "reporter" | "scholar" | "guardian" | "acharya";

export interface UserMembershipProfile {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  customPermissions?: UserPermission[]; // Explicit permission overrides granted to user
  membershipTier: MembershipTier;
  reputationScore: number;
  reputationLevel: ReputationLevelKey;
  district?: string;
  status: "active" | "suspended" | "banned";
  bio?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt?: string;
  lastActiveAt?: string;
}

export interface UserBulkActionRequest {
  uids: string[];
  action: "promote_role" | "assign_tier" | "suspend" | "ban" | "reset_permissions" | "adjust_reputation";
  targetRole?: string;
  targetTier?: MembershipTier;
  reputationDelta?: number;
}
