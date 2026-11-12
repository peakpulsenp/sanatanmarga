/**
 * Boot-time shims.
 *
 * This module must be the FIRST import in main.tsx. Several services
 * (featureControlOS, snapshotEngine) issue fetches from module-level
 * constructors while the app bundle is still evaluating. Installing the
 * static cache bridge here guarantees those requests are rewritten to the
 * shipped snapshot tree before any of them run.
 */
import { installStaticCacheBridge } from "./lib/staticCacheBridge";

installStaticCacheBridge();
