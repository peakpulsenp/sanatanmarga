import * as Sentry from "@sentry/react";
import { auth } from "./firebase";
import { addDocWithQueue } from "./offlineQueue";

const SENTRY_DSN = (import.meta as any).env?.VITE_SENTRY_DSN || "";

export function initSentry() {
  if (SENTRY_DSN) {
    try {
      Sentry.init({
        dsn: SENTRY_DSN,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration(),
        ],
        tracesSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      });
      console.log("Sentry frontend successfully initialized.");
    } catch (err) {
      console.error("Failed to initialize Sentry:", err);
    }
  } else {
    console.warn("Sentry DSN (VITE_SENTRY_DSN) is empty. Frontend Sentry is disabled or running in simulated local mode.");
  }
}

export async function reportErrorToFirestore(severity: "low" | "medium" | "high" | "critical", message: string, route: string = window.location.pathname, extra: any = {}) {
  try {
    const user = auth.currentUser;
    const errorData = {
      severity,
      source: "frontend",
      message: message || "Unknown error occurred",
      route: route || "/",
      actorId: user?.uid || "anonymous",
      actorEmail: user?.email || "anonymous",
      extra: extra ? JSON.parse(JSON.stringify(extra)) : {},
      timestamp: new Date().toISOString(),
    };
    
    await addDocWithQueue("errorEvents", errorData);
    console.log("Logged error event to queue/Firestore");
  } catch (err) {
    console.warn("Could not log error event:", err);
  }
}

export function captureException(error: any, context?: any) {
  console.error("Captured Exception:", error, context);
  
  // 1. Report to Sentry
  if (SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }

  // 2. Report to Firestore
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  reportErrorToFirestore(
    "critical",
    errorMessage,
    window.location.pathname,
    { stack: errorStack, ...context }
  );
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = "info") {
  console.log("Captured Message:", message);
  if (SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
}
