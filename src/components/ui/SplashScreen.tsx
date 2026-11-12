import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/src/lib/auth";
import { doc } from "@/src/lib/firebase";
import { db, getDocWithCacheFallback } from "@/src/lib/firebase";
import LogoImage from "@/src/components/ui/LogoImage";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const { user } = useAuth();
  const [tenantName, setTenantName] = useState("SANATAN MEDIA");
  const [logoUrl, setLogoUrl] = useState("/logo.svg");
  const [loadingText, setLoadingText] = useState("Loading Sanatan Media Engine...");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "site");
        const docSnap = await getDocWithCacheFallback(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.siteName) {
            setTenantName(data.siteName.toUpperCase());
          }
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl);
          }
        }
      } catch (err: any) {
        if (!err?.message?.includes('resource-exhausted')) {
          console.error("Error fetching site settings for splash:", err);
        }
      }
    };
    fetchSettings();

    // Sequence loading text updates
    const t1 = setTimeout(() => {
      setLoadingText("Initializing Sanatan Knowledge Engine...");
    }, 800);
    const t2 = setTimeout(() => {
      setLoadingText("Syncing Live Media Network...");
    }, 1500);

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2400); // 2.4 seconds total splash duration

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(timer);
    };
  }, []);

  // Determine dynamic greeting based on time of day and user
  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = "शुभ प्रभात";
    if (hour >= 12 && hour < 17) {
      timeGreeting = "शुभ दिन";
    } else if (hour >= 17) {
      timeGreeting = "शुभ सन्ध्या";
    }

    if (user?.displayName) {
      return `${timeGreeting}, ${user.displayName}`;
    }
    return `${timeGreeting} • Welcome to SanatanMedia.com`;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] } }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden bg-[#100E0D] text-[#FAF6F0]"
        >
          {/* Ambient Vermilion & Saffron Radial Glow */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.22, scale: 1.2 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className="absolute w-[550px] h-[550px] rounded-full bg-[#EA381E] blur-[150px] pointer-events-none"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.15, scale: 1.1 }}
            transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
            className="absolute w-[400px] h-[400px] rounded-full bg-[#F5A623] blur-[120px] pointer-events-none"
          />

          <div className="relative z-10 flex flex-col items-center max-w-lg px-6 text-center">
            
            {/* Logo Emblem Reveal with Sacred Glow */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
              className="relative w-36 h-36 md:w-44 md:h-44 mb-6 flex items-center justify-center p-3 rounded-full bg-[#1A1817]/80 border border-[#EA381E]/40 shadow-[0_0_60px_rgba(234,56,30,0.3)] backdrop-blur-xl"
            >
              <LogoImage
                src={logoUrl}
                alt={tenantName}
                className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(234,56,30,0.4)]"
              />
            </motion.div>

            {/* Brand Title */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center mb-2"
            >
              <h1 className="text-2xl md:text-3xl font-black tracking-[0.15em] text-[#FAF6F0] uppercase font-sans">
                {tenantName}
              </h1>
            </motion.div>

            {/* Sanskrit Motto: धर्मो रक्षति रक्षितः */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex items-center gap-3 text-sm md:text-base font-black text-[#EA381E] tracking-wider mb-6"
            >
              <span className="w-8 h-[1.5px] bg-[#EA381E]/60"></span>
              <span>धर्मो रक्षति रक्षितः</span>
              <span className="w-8 h-[1.5px] bg-[#EA381E]/60"></span>
            </motion.div>

            {/* Dynamic Daily Greeting */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="mb-8 px-5 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-[#FAF6F0]/80 backdrop-blur-md shadow-inner"
            >
              {getGreeting()}
            </motion.div>

            {/* Loading Progress Indicator */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-2.5 h-2.5 rounded-full bg-[#EA381E]"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <div className="w-8 h-0.5 bg-gradient-to-r from-[#EA381E] to-[#F5A623]" />
                <motion.div 
                  className="w-3 h-3 rounded-full bg-[#F5A623] shadow-[0_0_15px_rgba(245,166,35,0.8)]"
                  animate={{ scale: [1.2, 1, 1.2], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                />
                <div className="w-8 h-0.5 bg-gradient-to-r from-[#F5A623] to-[#EA381E]" />
                <motion.div 
                  className="w-2.5 h-2.5 rounded-full bg-[#EA381E]"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
                />
              </div>

              <motion.span
                key={loadingText}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] font-bold tracking-widest text-[#A8A092] uppercase"
              >
                {loadingText}
              </motion.span>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
