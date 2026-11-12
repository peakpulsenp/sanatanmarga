import { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share2, PlusSquare, CheckCircle2, ChevronRight, Monitor, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '@/src/hooks/usePWAInstall';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { safeLocalStorage } from '@/src/lib/safeStorage';

export default function PWAInstallBar() {
  const { isInstallable, installApp, isStandalone, isIOS, isAndroid, isInAppBrowser } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');

  useEffect(() => {
    // Check local storage for banner dismissal
    const dismissedAt = safeLocalStorage.getItem('pwa_banner_dismissed');
    const isDismissedRecently = dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 24 * 60 * 60 * 1000;

    if (!isStandalone && !isDismissedRecently) {
      // Delay display slightly for smooth page load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isStandalone]);

  useEffect(() => {
    if (isIOS) setActiveTab('ios');
    else if (isAndroid) setActiveTab('android');
    else setActiveTab('desktop');
  }, [isIOS, isAndroid]);

  const handleDismiss = () => {
    setIsVisible(false);
    safeLocalStorage.setItem('pwa_banner_dismissed', Date.now().toString());
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await installApp();
      if (!success) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  if (isStandalone || !isVisible) return null;

  return (
    <>
      {/* Floating Bottom Sticky Install Bar */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[9999] bg-slate-900/95 dark:bg-slate-900/95 text-white backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-3 safe-bottom-margin"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-tr from-rose-600 to-rose-500 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-rose-600/30">
                <img src="/logo.png" alt="Sanatan Marga" className="w-8 h-8 rounded-lg object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white leading-tight">सनातन मार्ग एप</h4>
                <p className="text-[11px] text-slate-300 font-medium">द्रुत गति, अफलाइन सपोर्ट र पलपलको खबर</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleInstallClick}
                className="bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-lg shadow-rose-600/40 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
              >
                <Download size={14} />
                <span>इन्स्टल</span>
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="बन्द गर्नुहोस्"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Installation Guide Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card rounded-3xl border border-border-theme shadow-2xl p-6 md:p-8 overflow-hidden z-10 transition-colors duration-200"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-muted-area hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-muted-text hover:text-foreground"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Smartphone size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">सनातन मार्ग एप इन्स्टल गाइड</h3>
                  <p className="text-xs text-muted-text font-medium mt-0.5">बिना प्ले स्टोर / एप स्टोर, १ सेकेन्डमा होम स्क्रिनमा राख्नुहोस्</p>
                </div>
              </div>

              {isInAppBrowser && (
                <div className="mb-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 text-xs text-amber-800 dark:text-amber-200 font-medium">
                  ⚠️ तपाईं हाल सामाजिक सञ्जाल (Facebook/Instagram/TikTok) भित्रको ब्राउजरमा हुनुहुन्छ। कृपया माथि ३ थोप्लो मेनु थिचेर <b>"Open in Safari / Chrome"</b> रोज्नुहोस्।
                </div>
              )}

              {/* Tabs */}
              <div className="flex bg-muted-area p-1.5 rounded-2xl gap-1 mb-5">
                <button
                  onClick={() => setActiveTab('android')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all ${activeTab === 'android' ? 'bg-card text-foreground shadow-sm' : 'text-muted-text'}`}
                >
                  Android
                </button>
                <button
                  onClick={() => setActiveTab('ios')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all ${activeTab === 'ios' ? 'bg-card text-foreground shadow-sm' : 'text-muted-text'}`}
                >
                  iPhone (iOS)
                </button>
                <button
                  onClick={() => setActiveTab('desktop')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all ${activeTab === 'desktop' ? 'bg-card text-foreground shadow-sm' : 'text-muted-text'}`}
                >
                  Desktop / PC
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4 min-h-[180px]">
                {activeTab === 'android' && (
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center flex-shrink-0">१</span>
                      <p className="text-sm font-semibold text-foreground">क्रोम (Chrome) वा ब्राउजर मेनु (३ थोप्लो ⋮) मा थिच्नुहोस्।</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center flex-shrink-0">२</span>
                      <p className="text-sm font-semibold text-foreground"><b>"Install App"</b> वा <b>"Add to Home screen"</b> (गृहपृष्ठमा थप्नुहोस्) मा थिच्नुहोस्।</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center flex-shrink-0">३</span>
                      <p className="text-sm font-semibold text-foreground">कन्फर्मेसनमा <b>'Install'</b> रोज्नुहोस्। एप तयार हुनेछ!</p>
                    </div>
                  </div>
                )}

                {activeTab === 'ios' && (
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center flex-shrink-0">१</span>
                      <p className="text-sm font-semibold text-foreground">सफारी (Safari) ब्राउजरको तल रहेको <Share2 size={16} className="inline text-blue-500 mx-1" /> (Share) बटन थिच्नुहोस्।</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center flex-shrink-0">२</span>
                      <p className="text-sm font-semibold text-foreground">मेनुमा स्क्रोल गरी <PlusSquare size={16} className="inline text-primary mx-1" /> <b>"Add to Home Screen"</b> रोज्नुहोस्।</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center flex-shrink-0">३</span>
                      <p className="text-sm font-semibold text-foreground">माथि <b>'Add'</b> थिचेपछि मोबाइलको होम स्क्रिनमा एप देखा पर्नेछ।</p>
                    </div>
                  </div>
                )}

                {activeTab === 'desktop' && (
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center flex-shrink-0">१</span>
                      <p className="text-sm font-semibold text-foreground">ब्राउजरको ठेगाना बार (URL Bar) मा रहेको <Download size={15} className="inline text-primary mx-1" /> (Install App) आइकन थिच्नुहोस्।</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center flex-shrink-0">२</span>
                      <p className="text-sm font-semibold text-foreground">अथवा मेनु मेनु ⋮ मा गई <b>"Install Sanatan Marga"</b> छनोट गर्नुहोस्।</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border-theme flex flex-col sm:flex-row gap-2">
                <Link
                  to="/download"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                >
                  <span>विस्तृत डाउनलोड पेज खोल्नुहोस्</span>
                  <ChevronRight size={16} />
                </Link>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-3 rounded-2xl bg-muted-area text-foreground font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  बन्द गर्नुहोस्
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
