import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { motion } from "motion/react";
import { FileText } from "lucide-react";
import { useTheme } from "@/src/components/StyleProvider";
import { useLanguage } from "@/src/context/LanguageContext";
import SEOHead from "@/src/components/common/SEOHead";

export default function TermsPage() {
  const { siteSettings } = useTheme();
  const { language } = useLanguage();
  
  const content = (language === "en" && siteSettings.termsContent_en)
    ? siteSettings.termsContent_en
    : siteSettings.termsContent || (language === "en" ? "Terms & Conditions are currently unavailable." : "नियम र सर्तहरू उपलब्ध छैनन्।");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <SEOHead
        title={language === "en" ? "Terms & Conditions" : "नियम र सर्तहरू"}
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
                <FileText size={32} />
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-card-foreground tracking-tight">
                {language === "en" ? "Terms & Conditions" : "नियम र सर्तहरू"}
              </h1>
              <p className="text-muted-text font-medium uppercase tracking-widest text-sm">
                {language === "en" ? "Terms of Service" : "Terms & Conditions"}
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
