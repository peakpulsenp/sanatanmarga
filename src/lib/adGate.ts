/**
 * SanatanMarga RevenueOS Global Ad Gate
 * Production Truth OS v1.0
 * 
 * Strict Zero-Ad Guarantee: Premium members (Sanrakshak, Sadhak, Corporate, Patron)
 * and verified administrators receive 0 advertisements across ALL platform placements.
 */

import { User } from "@/src/types";

export interface CanRenderAdOptions {
  user?: User | null;
  placement?: string;
  context?: Record<string, any>;
}

export interface AdExemptionResult {
  canRender: boolean;
  reason: 
    | "EXEMPT_PREMIUM_SANRAKSHAK"
    | "EXEMPT_PREMIUM_SADHAK"
    | "EXEMPT_PREMIUM_CORPORATE"
    | "EXEMPT_PREMIUM_PATRON"
    | "EXEMPT_ADMIN_ROLE"
    | "EXEMPT_SUPER_ADMIN"
    | "ELIGIBLE_FREE_TIER"
    | "ELIGIBLE_ANONYMOUS";
}

/**
 * Universal Gatekeeper function to decide if an advertisement is permitted to render.
 */
export function canRenderAd(options: CanRenderAdOptions): boolean {
  return evaluateAdExemption(options).canRender;
}

/**
 * Detailed evaluation of user ad exemption status with diagnostic reason code.
 */
export function evaluateAdExemption({ user }: CanRenderAdOptions): AdExemptionResult {
  if (!user) {
    return { canRender: true, reason: "ELIGIBLE_ANONYMOUS" };
  }

  // 1. Check Super Admin & Admin Roles
  if (user.role === "super_admin") {
    return { canRender: false, reason: "EXEMPT_SUPER_ADMIN" };
  }
  if (user.role === "admin") {
    return { canRender: false, reason: "EXEMPT_ADMIN_ROLE" };
  }

  // 2. Check Membership Tiers
  const tier = user.membershipTier?.toLowerCase();

  if (tier === "sanrakshak") {
    return { canRender: false, reason: "EXEMPT_PREMIUM_SANRAKSHAK" };
  }
  if (tier === "sadhak") {
    return { canRender: false, reason: "EXEMPT_PREMIUM_SADHAK" };
  }
  if (tier === "corporate") {
    return { canRender: false, reason: "EXEMPT_PREMIUM_CORPORATE" };
  }
  if (tier === "patron") {
    return { canRender: false, reason: "EXEMPT_PREMIUM_PATRON" };
  }

  return { canRender: true, reason: "ELIGIBLE_FREE_TIER" };
}
