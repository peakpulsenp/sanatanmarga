import React from "react";
import type { AdPosition } from "@/src/types";
import AdSlot from "./AdSlot";
import SectionErrorBoundary from "../common/SectionErrorBoundary";

interface AdBannerProps {
  position: AdPosition;
  className?: string;
  category?: string;
  district?: string;
  province?: string;
  adSlot?: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
  allowHouseAdFallback?: boolean;
  showEmptyPlaceholder?: boolean;
}

export default function AdBanner({ 
  position, 
  className = "",
  category,
  district,
  province,
  allowHouseAdFallback = true,
  showEmptyPlaceholder = false
}: AdBannerProps) {
  return (
    <SectionErrorBoundary sectionName={`ad-banner-${position}`} fallback={null}>
      <AdSlot
        position={position}
        className={className}
        category={category}
        district={district}
        province={province}
        allowHouseAdFallback={allowHouseAdFallback}
        showEmptyPlaceholder={showEmptyPlaceholder}
      />
    </SectionErrorBoundary>
  );
}
