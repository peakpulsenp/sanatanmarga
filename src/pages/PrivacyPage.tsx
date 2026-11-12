import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { motion } from "motion/react";
import { Shield } from "lucide-react";
import { useTheme } from "@/src/components/StyleProvider";
import { useLanguage } from "@/src/context/LanguageContext";
import SEOHead from "@/src/components/common/SEOHead";

export default function PrivacyPage() {
  const { siteSettings } = useTheme();
  const { language } = useLanguage();
  
  const content = (language === "en" && siteSettings.privacyContent_en)
    ? siteSettings.privacyContent_en
    : siteSettings.privacyContent || (language === "en" ? "Privacy policy is currently unavailable." : "गोपनीयता नीति उपलब्ध छैन।");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <SEOHead
        title={language === "en" ? "Privacy Policy" : "गोपनीयता नीति"}
        description={content.slice(0, 160)}
      />
      <Header />
      <main className="flex-grow py-20">
        <div className="container-custom max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-12"
          >
            <div className="flex flex-col gap-4 border-b border-border-theme pb-12">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Shield size={32} />
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-card-foreground tracking-tight">
                {language === "en" ? "Privacy Policy" : "गोपनीयता नीति"}
              </h1>
              <p className="text-muted-text font-medium uppercase tracking-widest text-sm">
                {language === "en" ? "Official Privacy Terms" : "Privacy Policy"}
              </p>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none prose-lg prose-nepali whitespace-pre-wrap text-card-foreground leading-relaxed">
              {content}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
