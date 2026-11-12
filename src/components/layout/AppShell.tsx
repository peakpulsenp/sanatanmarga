import React, { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useMediaOS } from "@/src/context/MediaOSContext";
import ScrollToTopOnNav from "./ScrollToTopOnNav";
import AnalyticsTracker from "./AnalyticsTracker";
import ScrollProgress from "../ui/ScrollProgress";
import PWAUpdatePrompt from "../ui/PWAUpdatePrompt";
import PWAInstallPrompt from "../ui/PWAInstallPrompt";
import SyncStatusBadge from "../ui/SyncStatusBadge";
import MobileBottomNav from "./MobileBottomNav";
import PersistentPlayer from "../media/PersistentPlayer";
import FloatingActions from "./FloatingActions";

export interface StickyUIConfig {
  header: boolean;
  bottomNavigation: boolean;
  notificationBell: boolean;
  premiumFab: boolean;
  mobileActions: boolean;
  readingProgress: boolean;
  persistentPlayer: boolean;
  offlineBanner: boolean;
}

export const DEFAULT_STICKY_CONFIG: StickyUIConfig = {
  header: true,
  bottomNavigation: true,
  notificationBell: true,
  premiumFab: true,
  mobileActions: true,
  readingProgress: true,
  persistentPlayer: true,
  offlineBanner: true
};

export function getRouteStickyConfig(pathname: string): StickyUIConfig {
  // Admin routes: disable public bottom nav & floating actions
  if (pathname.startsWith("/admin")) {
    return {
      header: false,
      bottomNavigation: false,
      notificationBell: false,
      premiumFab: false,
      mobileActions: false,
      readingProgress: false,
      persistentPlayer: false,
      offlineBanner: true
    };
  }

  // Auth / Login routes
  if (pathname === "/login") {
    return {
      header: false,
      bottomNavigation: false,
      notificationBell: false,
      premiumFab: false,
      mobileActions: false,
      readingProgress: false,
      persistentPlayer: false,
      offlineBanner: true
    };
  }

  // Article reading routes: enable reading progress, sticky floating tools
  if (pathname.startsWith("/article/")) {
    return {
      header: true,
      bottomNavigation: true,
      notificationBell: true,
      premiumFab: true,
      mobileActions: true,
      readingProgress: true,
      persistentPlayer: true,
      offlineBanner: true
    };
  }

  // Live broadcast / full-screen media
  if (pathname === "/live") {
    return {
      header: true,
      bottomNavigation: true,
      notificationBell: false,
      premiumFab: true,
      mobileActions: true,
      readingProgress: false,
      persistentPlayer: true,
      offlineBanner: true
    };
  }

  return DEFAULT_STICKY_CONFIG;
}

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const mediaOS = useMediaOS();
  const stickyConfig = getRouteStickyConfig(location.pathname);
  const isPlayerDocked = stickyConfig.persistentPlayer && mediaOS.playerState !== "hidden";

  return (
    <div className="relative min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Route-level Navigation & Telemetry Listeners */}
      <ScrollToTopOnNav />
      <AnalyticsTracker />
      
      {/* Sticky Progress & System Layer */}
      {stickyConfig.readingProgress && <ScrollProgress />}
      <PWAUpdatePrompt />
      <PWAInstallPrompt />
      <SyncStatusBadge />

      {/* Main Routed Page Content */}
      <main className={`flex-1 w-full relative transition-all duration-300 ${isPlayerDocked ? "md:pb-20 pb-28" : ""}`}>
        {children}
      </main>

      {/* Global Sticky Floating Action Layer */}
      {stickyConfig.premiumFab && (
        <FloatingActions />
      )}

      {/* Global Docked Persistent Audio OS */}
      {stickyConfig.persistentPlayer && (
        <PersistentPlayer />
      )}

      {/* Global Sticky Mobile Bottom Navigation */}
      {stickyConfig.bottomNavigation && (
        <MobileBottomNav />
      )}
    </div>
  );
}
