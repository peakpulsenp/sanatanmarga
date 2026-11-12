import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PWAUpdatePrompt() {
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').then((reg) => {
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setNeedRefresh(true);
        }
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setNeedRefresh(true);
              }
            });
          }
        });
      }).catch((err) => {
        console.warn('SW registration failed:', err);
      });
    }
  }, []);

  const updateServiceWorker = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : true);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsInstalled(isStandalone);
    
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {isMobile && ((offlineReady && !needRefresh) || (needRefresh && isInstalled)) && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 sm:left-4 sm:right-auto z-50 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 sm:max-w-sm w-auto sm:w-full flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-grow">
              <h4 className="text-sm font-bold text-slate-900">
                {offlineReady
                  ? 'App ready to work offline'
                  : 'New update available!'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {offlineReady
                  ? 'You can now use this app without an internet connection.'
                  : 'A new version of the app is available. Please update to get the latest features.'}
              </p>
            </div>
            <button
              onClick={close}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>
          
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker()}
              className="w-full bg-primary text-white py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <RefreshCw size={14} /> Update Now
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
