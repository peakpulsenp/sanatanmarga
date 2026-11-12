import { 
  Smartphone, 
  Download, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  Info, 
  X, 
  Compass, 
  MoreVertical, 
  Monitor,
  Check
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/common/SEOHead';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../context/LanguageContext';

export default function DownloadPage() {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'other'>('other');
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const { language } = useLanguage();
  
  const { isInstallable, installApp, isStandalone } = usePWAInstall();

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
      setActiveGuideTab('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
      setActiveGuideTab('android');
    } else if (/macintosh|windows|linux/.test(userAgent)) {
      setPlatform('desktop');
      setActiveGuideTab('desktop');
    } else {
      setPlatform('other');
      setActiveGuideTab('android');
    }
  }, []);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await installApp();
      if (!success) {
        setShowManualGuide(true);
      }
    } else {
      setShowManualGuide(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-250">
      <SEOHead 
        title={language === "en" ? "Download App - Sanatan Marga" : "एप डाउनलोड गर्नुहोस् - सनातन मार्ग"}
        description={language === "en" ? "Download and install Sanatan Marga application directly on your phone or desktop." : "सत्य, तथ्य र निष्पक्ष समाचार अब तपाईंको मोबाइलमा। प्ले स्टोर वा एप स्टोर बिना नै सजिलै इन्स्टल गरेर होम स्क्रिनमा राख्नुहोस्।"}
      />
      <Header />
      
      <main className="flex-grow pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 bg-primary text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20"
            >
              <Download size={40} />
            </motion.div>
            <h1 className="text-4xl font-black text-foreground tracking-tight mb-4">
              {language === "en" ? "Download App" : "एप डाउनलोड गर्नुहोस्"}
            </h1>
            <p className="text-muted-text dark:text-slate-300 font-medium max-w-lg mx-auto leading-relaxed mb-8">
              {language === "en" 
                ? "Reliable and timely news on your device. Install effortlessly to your home screen without Play Store or App Store."
                : "सत्य, तथ्य र निष्पक्ष समाचार अब तपाईंको मोबाइलमा। प्ले स्टोर वा एप स्टोर बिना नै सजिलै इन्स्टल गरेर होम स्क्रिनमा राख्नुहोस्।"}
            </p>
            
            {isStandalone ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/25 dark:border-emerald-500/20 rounded-3xl p-6 max-w-lg mx-auto flex flex-col items-center text-center gap-3 shadow-sm"
              >
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">
                    {language === "en" ? "App Successfully Installed!" : "एप सफलतापूर्वक इन्स्टल गरिएको छ!"}
                  </h3>
                  <p className="text-sm text-muted-text dark:text-slate-400 mt-1">
                    {language === "en" 
                      ? "You are currently using our official app edition. You can open it directly from your home screen."
                      : "तपाईं अहिले हाम्रो आधिकारिक एप संस्करण चलाइरहनुभएको छ। होम स्क्रिनबाट सिधै खोल्न सक्नुहुन्छ।"}
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <button 
                  onClick={handleInstallClick}
                  className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-black text-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all flex items-center gap-2 mx-auto hover:scale-105 active:scale-95 duration-200"
                >
                  <Download size={24} /> {language === "en" ? "Click Here to Install App" : "यहाँ क्लिक गरेर एप इन्स्टल गर्नुहोस्"}
                </button>
                <p className="text-xs text-muted-text dark:text-slate-500">
                  {isInstallable 
                    ? (language === "en" ? "Your browser supports 1-click install." : "तपाईंको ब्राउजरले सिधै वान-क्लिक इन्स्टल सपोर्ट गर्दछ।")
                    : (language === "en" ? "Click to view easy step-by-step installation instructions." : "सिधै इन्स्टल नभएमा यसले तपाईंलाई सजिलो २-चरण गाइड देखाउनेछ।")}
                </p>
              </div>
            )}
          </div>

          {/* Quick Platform Guides */}
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {/* Step 1: For Android/Chrome */}
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`bg-card rounded-[2.5rem] p-8 shadow-sm border-2 transition-colors duration-250 ${platform === 'android' ? 'border-primary' : 'border-border-theme'}`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold">
                  A
                </div>
                <h3 className="text-lg font-black text-foreground">
                  {language === "en" ? "Android Guide" : "एन्ड्रोइड (Android) गाइड"}
                </h3>
              </div>
              
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <p className="text-sm font-medium text-muted-text dark:text-slate-300">
                    {language === "en" ? "Open this website in Google Chrome browser." : "क्रोम (Chrome) ब्राउजरमा हाम्रो साइट खोल्नुहोस्।"}
                  </p>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <p className="text-sm font-medium text-muted-text dark:text-slate-300">
                    {language === "en" ? 'Tap the "Install App" button above.' : <>माथि रहेको <span className="text-primary font-bold">"यहाँ क्लिक गरेर एप इन्स्टल गर्नुहोस्"</span> बटन थिच्नुहोस्।</>}
                  </p>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <p className="text-sm font-medium text-muted-text dark:text-slate-300">
                    {language === "en" ? "Confirm the prompt by tapping 'Install' or 'Add'." : <>कन्फर्मेसन पपअप आउँदा <b>'Install'</b> वा <b>'Add'</b> मा क्लिक गर्नुहोस्।</>}
                  </p>
                </li>
              </ul>
            </motion.div>

            {/* Step 2: For iOS/Safari */}
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`bg-card rounded-[2.5rem] p-8 shadow-sm border-2 transition-colors duration-250 ${platform === 'ios' ? 'border-primary' : 'border-border-theme'}`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold">
                  i
                </div>
                <h3 className="text-lg font-black text-foreground">
                  {language === "en" ? "iPhone (iOS) Safari Guide" : "आइफोन (iOS) सफारी गाइड"}
                </h3>
              </div>
              
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <p className="text-sm font-medium text-muted-text dark:text-slate-300">
                    {language === "en" ? "Open this page in Safari browser." : "सफारी (Safari) ब्राउजरमा यो पेज खोल्नुहोस्।"}
                  </p>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <p className="text-sm font-medium text-muted-text dark:text-slate-300">
                    {language === "en" ? <>Tap the Safari <Share2 size={16} className="inline mx-1 text-blue-500" /> Share button at the bottom.</> : <>स्क्रिनको तल रहेको सफारीको <Share2 size={16} className="inline mx-1 text-blue-500" /> (Share) बटनमा थिच्नुहोस्।</>}
                  </p>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <p className="text-sm font-medium text-muted-text dark:text-slate-300">
                    {language === "en" ? <>Scroll down and tap <PlusSquare size={16} className="inline mx-1 text-primary animate-pulse" /> <span className="font-bold text-foreground">"Add to Home Screen"</span>.</> : <>मेनु स्क्रोल गरेर <PlusSquare size={16} className="inline mx-1 text-primary animate-pulse" /> <span className="font-bold text-foreground">"Add to Home Screen"</span> रोज्नुहोस्।</>}
                  </p>
                </li>
              </ul>
            </motion.div>
          </div>

          <div className="mt-12 bg-primary/5 rounded-[2.5rem] p-8 border border-primary/20 transition-colors duration-250">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-grow">
                <h4 className="text-xl font-black text-foreground mb-4">
                  {language === "en" ? "Key App Features" : "एपका प्रमुख विशेषताहरू"}
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-muted-text dark:text-slate-300">
                    <CheckCircle2 size={16} className="text-primary flex-shrink-0" /> {language === "en" ? "Low data and battery consumption" : "डाटा र ब्याट्रीको कम खपत"}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-muted-text dark:text-slate-300">
                    <CheckCircle2 size={16} className="text-primary flex-shrink-0" /> {language === "en" ? "Offline reading & bookmarking support" : "अफलाइन पढ्न र सुरक्षित राख्न मिल्ने"}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-muted-text dark:text-slate-300">
                    <CheckCircle2 size={16} className="text-primary flex-shrink-0" /> {language === "en" ? "Instant breaking news notifications" : "ब्रेकिङ न्यूज र तुरुन्त सूचनाहरू"}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-muted-text dark:text-slate-300">
                    <CheckCircle2 size={16} className="text-primary flex-shrink-0" /> {language === "en" ? "Full Dark and Light mode support" : "डार्क र लाइट मोड पूर्ण सपोर्ट"}
                  </div>
                </div>
              </div>
              
              <div className="hidden lg:block w-32 h-32 bg-card p-2 rounded-2xl shadow-inner border border-primary/10 transition-colors duration-250">
                <div className="w-full h-full bg-muted-area/50 flex flex-col items-center justify-center text-center p-2 rounded-xl">
                  <Info size={24} className="text-muted-text/60 mb-1 animate-bounce" />
                  <span className="text-[10px] font-bold text-muted-text">PWA Edition</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Manual Installation Interactive Dialog */}
      <AnimatePresence>
        {showManualGuide && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowManualGuide(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            
            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card rounded-[2.5rem] border border-border-theme shadow-2xl p-6 md:p-8 overflow-hidden z-10 transition-colors duration-250"
            >
              <button 
                onClick={() => setShowManualGuide(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-muted-area hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-muted-text hover:text-foreground"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">
                    {language === "en" ? "App Installation Guide" : "एप इन्स्टालेसन गाइड"}
                  </h3>
                  <p className="text-xs text-muted-text font-medium">
                    {language === "en" ? "Easily install the app on your preferred device" : "तपाईंको डिभाइसमा सजिलै एप इन्स्टल गर्नुहोस्"}
                  </p>
                </div>
              </div>

              {/* Guide Tabs */}
              <div className="flex bg-muted-area p-1.5 rounded-2xl gap-1 mb-6 transition-colors duration-250">
                <button
                  onClick={() => setActiveGuideTab('android')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    activeGuideTab === 'android' 
                      ? 'bg-card text-foreground shadow-sm' 
                      : 'text-muted-text hover:text-foreground'
                  }`}
                >
                  <Smartphone size={14} /> Android
                </button>
                <button
                  onClick={() => setActiveGuideTab('ios')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    activeGuideTab === 'ios' 
                      ? 'bg-card text-foreground shadow-sm' 
                      : 'text-muted-text hover:text-foreground'
                  }`}
                >
                  <Compass size={14} /> iPhone
                </button>
                <button
                  onClick={() => setActiveGuideTab('desktop')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    activeGuideTab === 'desktop' 
                      ? 'bg-card text-foreground shadow-sm' 
                      : 'text-muted-text hover:text-foreground'
                  }`}
                >
                  <Monitor size={14} /> Desktop
                </button>
              </div>

              {/* Tab Contents */}
              <div className="min-h-[220px]">
                {activeGuideTab === 'android' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <p className="text-sm font-medium text-muted-text dark:text-slate-300">
                      {language === "en" ? "In Chrome on Android devices, install the app in 3 quick steps:" : "एन्ड्रोइड फोनमा क्रोम (Chrome) ब्राउजर प्रयोग गरी सजिलै यो एप होम स्क्रिनमा थप्न सक्नुहुन्छ:"}
                    </p>
                    <div className="space-y-3.5 mt-2">
                      <div className="flex gap-3 items-start">
                        <div className="w-6 h-6 rounded-full bg-muted-area text-foreground font-bold flex items-center justify-center text-xs flex-shrink-0 transition-colors duration-250">1</div>
                        <p className="text-sm font-bold text-foreground">
                          {language === "en" ? <>Tap the three-dots menu <MoreVertical size={16} className="inline bg-muted-area rounded p-0.5" /> in the top-right corner of Chrome.</> : <>क्रोम ब्राउजरको माथिल्लो दायाँ कुनामा रहेको तीनवटा थोप्लो मेनु <MoreVertical size={16} className="inline bg-muted-area rounded p-0.5" /> मा थिच्नुहोस्।</>}
                        </p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <div className="w-6 h-6 rounded-full bg-muted-area text-foreground font-bold flex items-center justify-center text-xs flex-shrink-0 transition-colors duration-250">2</div>
                        <p className="text-sm font-bold text-foreground">
                          {language === "en" ? <>Select <span className="text-primary font-black">"Install App"</span> or <span className="text-primary font-black">"Add to Home screen"</span>.</> : <>मेनु सूचीबाट <span className="text-primary font-black">"Install App"</span> वा <span className="text-primary font-black">"Add to Home screen"</span> विकल्प रोज्नुहोस्।</>}
                        </p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <div className="w-6 h-6 rounded-full bg-muted-area text-foreground font-bold flex items-center justify-center text-xs flex-shrink-0 transition-colors duration-250">3</div>
                        <p className="text-sm font-bold text-foreground">
                          {language === "en" ? <>Confirm by tapping <b>'Install'</b>. The app icon will appear on your home screen.</> : <>त्यसपछि आउने स्क्रिनमा <b>'Install'</b> थिचेर सुरक्षित गर्नुहोस्। एप होम स्क्रिनमा थपिनेछ।</>}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeGuideTab === 'ios' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <p className="text-sm font-medium text-muted-text dark:text-slate-300">
                      {language === "en" ? "On iPhone Safari, install to your Home Screen easily:" : "आइफोन (iOS) मा सफारी (Safari) ब्राउजर प्रयोग गरी यो एपलाई आफ्नो होम स्क्रिनमा थप्न सक्नुहुन्छ:"}
                    </p>
                    <div className="space-y-3.5 mt-2">
                      <div className="flex gap-3 items-start">
                        <div className="w-6 h-6 rounded-full bg-muted-area text-foreground font-bold flex items-center justify-center text-xs flex-shrink-0 transition-colors duration-250">1</div>
                        <p className="text-sm font-bold text-foreground">
                          {language === "en" ? <>Tap the <Share2 size={16} className="inline text-blue-500 mx-0.5" /> (Share) icon at the bottom of Safari.</> : <>सफारी ब्राउजरको तल रहेको <Share2 size={16} className="inline text-blue-500 mx-0.5" /> (Share) बटन थिच्नुहोस्।</>}
                        </p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <div className="w-6 h-6 rounded-full bg-muted-area text-foreground font-bold flex items-center justify-center text-xs flex-shrink-0 transition-colors duration-250">2</div>
                        <p className="text-sm font-bold text-foreground">
                          {language === "en" ? <>Scroll down and tap <PlusSquare size={16} className="inline text-primary mx-0.5" /> <span className="text-primary font-black">"Add to Home Screen"</span>.</> : <>मेनु सूचीमा तल स्क्रोल गरी <PlusSquare size={16} className="inline text-primary mx-0.5" /> <span className="text-primary font-black">"Add to Home Screen"</span> विकल्प छनोट गर्नुहोस्।</>}
                        </p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <div className="w-6 h-6 rounded-full bg-muted-area text-foreground font-bold flex items-center justify-center text-xs flex-shrink-0 transition-colors duration-250">3</div>
                        <p className="text-sm font-bold text-foreground">
                          {language === "en" ? <>Tap <b>'Add'</b> in the top right corner. The app is now installed.</> : <>माथि दायाँ कुनामा रहेको <b>'Add'</b> बटन थिच्नुहोस्। एप मोबाइलको गृहपृष्ठमा उपलब्ध हुनेछ।</>}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeGuideTab === 'desktop' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <p className="text-sm font-medium text-muted-text dark:text-slate-300">
                      {language === "en" ? "On desktop/laptop using Chrome or Edge:" : "कम्प्युटर वा ल्यापटपमा क्रोम (Chrome) वा एज (Edge) ब्राउजरबाट एप सिधै इन्स्टल गर्नुहोस्:"}
                    </p>
                    <div className="space-y-3.5 mt-2">
                      <div className="flex gap-3 items-start">
                        <div className="w-6 h-6 rounded-full bg-muted-area text-foreground font-bold flex items-center justify-center text-xs flex-shrink-0 transition-colors duration-250">1</div>
                        <p className="text-sm font-bold text-foreground">
                          {language === "en" ? <>Look for the <Download size={14} className="inline text-primary" /> install icon in your browser's address bar (URL bar).</> : <>ब्राउजरको एड्रेस बार (URL bar) को दायाँ छेउमा रहेको कम्प्युटर / इन्स्टल आइकन <Download size={14} className="inline text-primary" /> खोज्नुहोस्।</>}
                        </p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <div className="w-6 h-6 rounded-full bg-muted-area text-foreground font-bold flex items-center justify-center text-xs flex-shrink-0 transition-colors duration-250">2</div>
                        <p className="text-sm font-bold text-foreground">
                          {language === "en" ? <>Or click menu <MoreVertical size={16} className="inline" /> → <b>"Save and share"</b> → <b>"Install page as app..."</b>.</> : <>अथवा मेनु सूची <MoreVertical size={16} className="inline" /> मा गई <b>"Save and share"</b> → <b>"Install page as app..."</b> विकल्प रोज्नुहोस्।</>}
                        </p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <div className="w-6 h-6 rounded-full bg-muted-area text-foreground font-bold flex items-center justify-center text-xs flex-shrink-0 transition-colors duration-250">3</div>
                        <p className="text-sm font-bold text-foreground">
                          {language === "en" ? <>Click <b>'Install'</b>. The app opens in its own standalone window.</> : <><b>'Install'</b> बटन थिच्नुहोस्। एप छुट्टै झ्याल (Window) मा खुल्नेछ र डेस्कटपमा सर्टकट बन्नेछ।</>}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <button 
                onClick={() => setShowManualGuide(false)}
                className="w-full mt-8 bg-slate-900 dark:bg-slate-800 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                {language === "en" ? "Got It / Close" : "बुझें / बन्द गर्नुहोस्"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
