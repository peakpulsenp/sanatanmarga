import React, { useState, useEffect } from "react";
import { useAuth } from "@/src/lib/auth";
import { canRenderAd } from "@/src/lib/adGate";
import type { Ad, AdPosition } from "@/src/types";
import { AD_PLACEMENT_REGISTRY } from "@/src/constants/adPlacementRegistry";
import { adEngine } from "@/src/services/adEngine";
import { adInventoryCache } from "@/src/services/adInventoryCache";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import AdRenderer from "./AdRenderer";
import HouseAdFallback from "./HouseAdFallback";
import type { HouseAd } from "@/src/constants/revenueInventory";
import SectionErrorBoundary from "../common/SectionErrorBoundary";

interface AdSlotProps {
  position: AdPosition;
  className?: string;
  category?: string;
  district?: string;
  province?: string;
  device?: "desktop" | "mobile" | "tablet";
  allowHouseAdFallback?: boolean;
  showEmptyPlaceholder?: boolean;
}

export default function AdSlot({
  position,
  className = "",
  category,
  district,
  province,
  device,
  allowHouseAdFallback = true,
  showEmptyPlaceholder = false
}: AdSlotProps) {
  const { user } = useAuth();
  const [matchingAds, setMatchingAds] = useState<Ad[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [houseAd, setHouseAd] = useState<HouseAd | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // STEP 1 & 2: CALCULATE ELIGIBILITY CONDITIONS (No early returns before hooks)
  const isAllowedToRender = canRenderAd({ user, placement: position });
  const placementConfig = AD_PLACEMENT_REGISTRY[position];
  const isPremiumUser = user?.membershipTier === "patron" || user?.membershipTier === "sadhak" || user?.membershipTier === "sanrakshak" || user?.membershipTier === "corporate";
  const isPremiumSuppressed = Boolean(placementConfig && placementConfig.premiumAllowed === false && isPremiumUser);
  const targetDevice = device || (typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop");
  const isSupportedDevice = !placementConfig?.supportedDevices || placementConfig.supportedDevices.includes(targetDevice);

  const isEligibleToRunQuery = isAllowedToRender && !isPremiumSuppressed && isSupportedDevice;

  // STEP 3: ELIGIBLE CAMPAIGN QUERY (Cache-First)
  useEffect(() => {
    if (!isEligibleToRunQuery) {
      if (!isAllowedToRender || isPremiumSuppressed) {
        adInventoryCache.incrementTelemetry("suppressedPremiumCount");
      }
      setIsLoaded(true);
      return;
    }

    let isMounted = true;

    const resolveAd = async () => {
      try {
        // Fast in-memory cache check from adInventoryCache
        let candidateAds: Ad[] | null = adInventoryCache.getInventory();

        if (!candidateAds || candidateAds.length === 0) {
          const snapshotAds = await snapshotEngine.getAdsSnapshot(position);
          candidateAds = snapshotAds || [];
          adInventoryCache.setInventory(candidateAds);
        }

        // Filter active status campaigns
        const activeAds = candidateAds.filter((a) => a.isActive && a.status === "active");
        if (candidateAds.length > activeAds.length) {
          adInventoryCache.incrementTelemetry("suppressedStatusCount");
        }

        // Retrieve all eligible matching campaigns for rotation
        const matching = adEngine.getMatchingAds(activeAds, position, {
          category,
          district,
          province,
          device: targetDevice
        });

        if (isMounted) {
          if (matching.length > 0) {
            setMatchingAds(matching);
            setCurrentAdIndex(0);
            setSelectedAd(matching[0]);
            setHouseAd(null);
          } else if (allowHouseAdFallback) {
            setMatchingAds([]);
            setSelectedAd(null);
            const fallback = adEngine.getHouseAd(position);
            setHouseAd(fallback);
            if (fallback) {
              adInventoryCache.incrementTelemetry("houseAdCount");
            } else {
              adInventoryCache.incrementTelemetry("noInventoryCount");
            }
          } else {
            setMatchingAds([]);
            setSelectedAd(null);
            setHouseAd(null);
            adInventoryCache.incrementTelemetry("noInventoryCount");
          }
          setIsLoaded(true);
        }
      } catch (err) {
        if (isMounted) {
          if (allowHouseAdFallback) {
            const fallback = adEngine.getHouseAd(position);
            setHouseAd(fallback);
            if (fallback) {
              adInventoryCache.incrementTelemetry("houseAdCount");
            }
          }
          setIsLoaded(true);
        }
      }
    };

    resolveAd();

    return () => {
      isMounted = false;
    };
  }, [position, user, category, district, province, targetDevice, allowHouseAdFallback, isEligibleToRunQuery, isAllowedToRender, isPremiumSuppressed]);

  // Multi-Ad Carousel Rotation Timer (12s interval, paused when document is hidden)
  useEffect(() => {
    if (matchingAds.length <= 1) return;

    const intervalId = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) {
        return; // Pause rotation while tab is not active
      }
      setCurrentAdIndex((prev) => {
        const next = (prev + 1) % matchingAds.length;
        setSelectedAd(matchingAds[next]);
        return next;
      });
    }, 12000);

    return () => clearInterval(intervalId);
  }, [matchingAds]);

  if (!isEligibleToRunQuery) {
    if (showEmptyPlaceholder) {
      return (
        <div className={`p-4 rounded-xl border border-dashed border-border-theme text-center text-xs text-muted-text ${className}`}>
          विज्ञापन खाली छ (Unfilled Placement)
        </div>
      );
    }
    return null;
  }

  // If loading or collapsed slot
  if (!isLoaded) {
    return null;
  }

  // Render Commercial Ad if available
  if (selectedAd) {
    return (
      <SectionErrorBoundary sectionName={`ad-slot-${position}`} fallback={null}>
        <AdRenderer
          ad={selectedAd}
          position={position}
          className={className}
          category={category}
          district={district}
        />
      </SectionErrorBoundary>
    );
  }

  // Render House Ad Fallback if available
  if (houseAd && allowHouseAdFallback) {
    return (
      <SectionErrorBoundary sectionName={`house-ad-${position}`} fallback={null}>
        <HouseAdFallback
          houseAd={houseAd}
          position={position}
          className={className}
        />
      </SectionErrorBoundary>
    );
  }

  // Optional empty placeholder or collapse
  if (showEmptyPlaceholder) {
    return (
      <div className={`p-4 rounded-xl border border-dashed border-border-theme text-center text-xs text-muted-text ${className}`}>
        विज्ञापन खाली छ (Unfilled Placement)
      </div>
    );
  }

  return null;
}
