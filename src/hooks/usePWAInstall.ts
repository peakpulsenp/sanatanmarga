import { useState, useEffect } from 'react';
import { collection, addDoc } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";

const logPwaTelemetry = async (eventName: string, details: any = {}) => {
  try {
    const ua = navigator.userAgent;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const timestamp = new Date().toISOString();

    await addDoc(collection(db, "pwa_telemetry"), {
      event: eventName,
      userAgent: ua,
      screenSize: `${screenWidth}x${screenHeight}`,
      timestamp,
      referrer: document.referrer || "direct",
      ...details
    });
  } catch (err) {
    console.warn("Telemetry log failed:", err);
  }
};

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone PWA mode
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(checkStandalone);

    // Detect platform & user agent
    const ua = navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) || (typeof navigator !== 'undefined' && (navigator as any).platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
    const android = /android/.test(ua);
    const inApp = /fban|fbav|instagram|tik|line|twitter|micromessenger|snapchat/.test(ua);

    setIsIOS(ios);
    setIsAndroid(android);
    setIsInAppBrowser(inApp);

    // Check if window already captured beforeinstallprompt earlier
    const prePrompt = (window as any).deferredPWAInstallPrompt;
    if (prePrompt && !checkStandalone) {
      setDeferredPrompt(prePrompt);
      setIsInstallable(true);
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      if (checkStandalone) return;
      (window as any).deferredPWAInstallPrompt = e;
      setDeferredPrompt(e);
      setIsInstallable(true);
      logPwaTelemetry('beforeinstallprompt_captured', { platform: android ? 'android' : 'desktop' });
    };

    const handleCustomInstallable = () => {
      const p = (window as any).deferredPWAInstallPrompt;
      if (p && !checkStandalone) {
        setDeferredPrompt(p);
        setIsInstallable(true);
      }
    };

    const handleAppInstalled = () => {
      logPwaTelemetry('app_installed_native');
      setIsStandalone(true);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('pwa-installable', handleCustomInstallable);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('pwa-installable', handleCustomInstallable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    const promptObj = deferredPrompt || (window as any).deferredPWAInstallPrompt;

    if (!promptObj) {
      logPwaTelemetry('install_error_no_prompt');
      return false;
    }

    try {
      logPwaTelemetry('install_prompt_triggered');
      await promptObj.prompt();
      const { outcome } = await promptObj.userChoice;
      logPwaTelemetry('install_choice_outcome', { outcome });
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setIsStandalone(true);
        setDeferredPrompt(null);
        (window as any).deferredPWAInstallPrompt = null;
        return true;
      } else {
        setDeferredPrompt(null);
        (window as any).deferredPWAInstallPrompt = null;
        return false;
      }
    } catch (err) {
      console.error('Error triggering PWA install prompt:', err);
      logPwaTelemetry('install_prompt_exception', { error: String(err) });
      return false;
    }
  };

  return { 
    isInstallable, 
    installApp, 
    isStandalone, 
    isIOS, 
    isAndroid, 
    isInAppBrowser 
  };
}

