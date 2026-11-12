// Must stay first: installs the /api/cache -> /snapshots bridge before any
// module-level service constructors run their fetches.
import "./boot.ts";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { initApiInterceptors } from "./lib/apiConfig.ts";
import { installStaticCacheBridge } from "./lib/staticCacheBridge.ts";
import { ensureDemoDb } from "./lib/demoStore.ts";
import { SanatanMargaApi } from "./lib/api";

// Route SnapshotOS/API cache reads to the shipped static snapshot tree so the
// app runs on any static host without the Express backend.
installStaticCacheBridge();

// Initialize API interceptors for custom domains / split hosting
initApiInterceptors();

// Warm the local demo data layer (replaces the hosted Firestore backend).
ensureDemoDb().catch((err) => console.warn("[DemoDB] init failed:", err));

// Initialize the unified API facade
// This configures all services (DB, Storage, AI, Snapshots, Auth, Features)
// based on VITE_API_MODE and related environment variables.
SanatanMargaApi.initialize();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (import.meta.env.DEV) {
      // Development: never let an old service worker serve stale bundles.
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) registration.unregister();
      });
      if ("caches" in window) {
        caches.keys().then((keys) => {
          for (const key of keys) caches.delete(key);
        });
      }
    }
  });
}

// Export for debugging
declare global {
  interface Window {
    __SANATAN_API__: SanatanMargaApi;
  }
}
window.__SANATAN_API__ = SanatanMargaApi.getInstance();