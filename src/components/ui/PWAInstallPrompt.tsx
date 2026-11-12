import { useState, useEffect } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, X, Smartphone, Share2, PlusSquare, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { safeLocalStorage } from '@/src/lib/safeStorage';

export default function PWAInstallPrompt() {
  const { isInstallable, installApp, isStandalone, isIOS, isAndroid, isInAppBrowser } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');

  useEffect(() => {
    if (isIOS) setActiveTab('ios');
    else if (isAndroid) setActiveTab('android');
    else setActiveTab('desktop');

    const dismissedAt = safeLocalStorage.getItem('pwa_prompt_dismissed_time');
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 12 * 60 * 60 * 1000) {
      setDismissed(true);
    }
  }, [isIOS, isAndroid]);

  const handleDismiss = () => {
    setDismissed(true);
    safeLocalStorage.setItem('pwa_prompt_dismissed_time', Date.now().toString());
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

  if (isStandalone || dismissed) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[9990] bg-slate-900/95 text-white dark:bg-slate-900/95 border border-white/20 shadow-2xl rounded-2xl p-4 sm:max-w-sm w-auto sm:w-full flex flex-col gap-3 backdrop-blur-xl transition-colors duration-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 text-rose-400 rounded-xl flex items-center justify-center flex-shrink-0 border border-primary/30">
                <Smartphone size={22} />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">सनातन मार्ग एप</h4>
                <p className="text-xs text-slate-300 font-medium leading-snug">
                  इन्स्टल गर्नुहोस् र ताजा खबर तुरुन्त पाउनुहोस्।
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              title="बन्द गर्नुहोस्"
            >
              <X size={16} />
            </button>
          </div>

          <button
            onClick={handleInstallClick}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download size={16} /> एप इन्स्टल गर्नुहोस् (Install)
          </button>
        </motion.div>
      </AnimatePresence>

      {/* Manual Installation Interactive Dialog */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card rounded-3xl border border-border-theme shadow-2xl p-6 md:p-8 overflow-hidden z-10 transition-colors duration-250"
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
                  <p className="text-xs text-muted-text font-medium mt-0.5">बिना प्ले स्टोर, सिधै १ सेकेन्डमा मोबाइलमा राख्नुहोस्</p>
                </div>
              </div>

              {isInAppBrowser && (
                <div className="mb-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 text-xs text-amber-800 dark:text-amber-200 font-medium">
                  ⚠️ तपाईं हाल सामाजिक सञ्जाल (Facebook/Instagram) भित्र हुनुहुन्छ। कृपया माथि ३ थोप्लो मेनु थिचेर <b>"Open in Safari / Chrome"</b> रोज्नुहोस्।
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
              <div className="space-y-4 min-h-[170px]">
                {activeTab === 'android' && (
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center flex-shrink-0">१</span>
                      <p className="text-sm font-semibold text-foreground">क्रोम (Chrome) ब्राउजरको माथिल्लो दायाँ मेनु (३ थोप्लो ⋮) थिच्नुहोस्।</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center flex-shrink-0">२</span>
                      <p className="text-sm font-semibold text-foreground"><b>"Install App"</b> वा <b>"Add to Home screen"</b> (गृहपृष्ठमा थप्नुहोस्) रोज्नुहोस्।</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center flex-shrink-0">३</span>
                      <p className="text-sm font-semibold text-foreground"><b>'Install'</b> थिच्नुहोस्। एप मोबाइलको स्क्रिनमा उपलब्ध हुनेछ।</p>
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
                      <p className="text-sm font-semibold text-foreground">माथि <b>'Add'</b> थिचेपछि मोबाइलको होम स्क्रिनमा एप उपलब्ध हुनेछ।</p>
                    </div>
                  </div>
                )}

                {activeTab === 'desktop' && (
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center flex-shrink-0">१</span>
                      <p className="text-sm font-semibold text-foreground">ब्राउजरको ठेगाना बार (URL Bar) मा रहेको <Download size={15} className="inline text-primary mx-1" /> (Install App) बटनमा थिच्नुहोस्।</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center flex-shrink-0">२</span>
                      <p className="text-sm font-semibold text-foreground">अथवा ब्राउजर मेनुमा गई <b>"Install Sanatan Marga"</b> रोज्नुहोस्।</p>
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
                  <span>डाउनलोड गाइड पेज</span>
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

