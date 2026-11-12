import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, Sparkles } from "lucide-react";
import { useAuth } from "@/src/lib/auth";
import LogoImage from "@/src/components/ui/LogoImage";
import { useTheme } from "@/src/components/StyleProvider";
import { useLanguage } from "@/src/context/LanguageContext";

export default function Footer() {
  const { user } = useAuth();
  const { siteSettings } = useTheme();
  const { t, language } = useLanguage();
  const settings = siteSettings;

  return (
    <footer className="bg-muted-area dark:bg-card text-card-foreground pt-16 pb-24 lg:pb-8 transition-colors">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand & About */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl p-1 flex-shrink-0 flex items-center justify-center shadow-sm overflow-hidden">
                <LogoImage 
                  src={settings.logoUrl} 
                  alt="Logo" 
                  className="w-full h-full object-contain transition-transform group-hover:scale-110"
                />
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl md:text-2xl font-black text-primary tracking-tight leading-none">
                  {settings.siteName.split(" ")[0]} <span className="text-card-foreground">{settings.siteName.split(" ").slice(1).join(" ")}</span>
                </h2>
              </div>
            </Link>
            <p className="text-muted-text text-xs leading-relaxed">
              {language === "en" ? (settings.siteDescription_en || settings.siteDescription) : settings.siteDescription}
            </p>
            <div className="flex gap-2">
              <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="bg-card dark:bg-muted p-2 rounded-full hover:bg-primary hover:text-white transition-all border border-border-theme shadow-sm"><Facebook size={14} /></a>
              <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="bg-card dark:bg-muted p-2 rounded-full hover:bg-primary hover:text-white transition-all border border-border-theme shadow-sm"><Twitter size={14} /></a>
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="bg-card dark:bg-muted p-2 rounded-full hover:bg-primary hover:text-white transition-all border border-border-theme shadow-sm"><Instagram size={14} /></a>
              <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="bg-card dark:bg-muted p-2 rounded-full hover:bg-primary hover:text-white transition-all border border-border-theme shadow-sm"><Youtube size={14} /></a>
            </div>
          </div>

          {/* Quick Categories */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold border-l-4 border-primary pl-2.5 uppercase tracking-tight">{t("categories")}</h3>
            <ul className="flex flex-col gap-2.5 text-xs font-bold text-muted-text">
              <li><Link to="/category/national" className="hover:text-primary transition-colors">{language === 'en' ? 'National' : 'राष्ट्रिय'}</Link></li>
              <li><Link to="/category/politics" className="hover:text-primary transition-colors">{language === 'en' ? 'Politics' : 'राजनीति'}</Link></li>
              <li><Link to="/category/economy" className="hover:text-primary transition-colors">{language === 'en' ? 'Economy' : 'अर्थतन्त्र'}</Link></li>
              <li><Link to="/category/sports" className="hover:text-primary transition-colors">{language === 'en' ? 'Sports' : 'खेलकुद'}</Link></li>
              <li><Link to="/nepal-hub" className="hover:text-primary transition-colors">{t("nepalHub")}</Link></li>
              <li><Link to="/latest" className="text-amber-500 font-bold hover:underline transition-colors">{language === 'en' ? 'Latest News' : 'ताजा समाचार'}</Link></li>
            </ul>
          </div>

          {/* Knowledge & Heritage */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold border-l-4 border-amber-500 pl-2.5 uppercase tracking-tight">ज्ञान तथा सम्पदा</h3>
            <ul className="flex flex-col gap-2.5 text-xs font-bold text-muted-text">
              <li><Link to="/ask-sanatan" className="text-amber-500 font-bold hover:underline transition-colors flex items-center gap-1.5"><Sparkles size={13} className="text-amber-500" /> सोध्नुहोस् (Ask Sanatan AI)</Link></li>
              <li><Link to="/knowledge" className="hover:text-primary transition-colors">ज्ञानकोष (Knowledge Base)</Link></li>
              <li><Link to="/archives" className="hover:text-primary transition-colors">अभिलेख (ArchivesOS)</Link></li>
              <li><Link to="/timeline" className="hover:text-primary transition-colors">कालक्रम (Timeline)</Link></li>
              <li><Link to="/festivals" className="hover:text-primary transition-colors">चाडपर्व तथा पात्रो</Link></li>
              <li><Link to="/directory" className="hover:text-primary transition-colors">मठ-मन्दिर डाइरेक्टरी</Link></li>
            </ul>
          </div>

          {/* Broadcast & Academy */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold border-l-4 border-red-500 pl-2.5 uppercase tracking-tight">प्रसारण र अकादेमी</h3>
            <ul className="flex flex-col gap-2.5 text-xs font-bold text-muted-text">
              <li><Link to="/live" className="text-red-500 font-black hover:underline flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span> प्रत्यक्ष भिडियो (Live)</Link></li>
              <li><Link to="/radio" className="hover:text-amber-400 transition-colors">सनातन रेडियो (Radio 24/7)</Link></li>
              <li><Link to="/academy" className="hover:text-primary transition-colors">सनातन अकादेमी (Academy)</Link></li>
              <li><Link to="/verify-certificate" className="text-emerald-500 font-black hover:underline transition-colors">प्रमाणपत्र प्रमाणीकरण (Verify)</Link></li>
              <li><Link to="/store" className="hover:text-primary transition-colors">सनातन स्टोर (Store)</Link></li>
              <li><Link to="/membership" className="text-amber-400 font-bold hover:underline transition-colors">सदस्यता योजना (Membership)</Link></li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold border-l-4 border-primary pl-2.5 uppercase tracking-tight">{t("aboutUs")}</h3>
            <ul className="flex flex-col gap-2.5 text-xs font-bold text-muted-text">
              <li><Link to="/about" className="hover:text-primary transition-colors">{t("aboutUs")}</Link></li>
              <li><Link to="/transparency" className="text-amber-500 font-black hover:underline transition-colors">पारदर्शिता (Transparency)</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">{t("contact")}</Link></li>
              <li><Link to="/download" className="text-primary font-bold hover:underline transition-colors">{t("downloadApp")}</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">{language === 'en' ? 'Privacy Policy' : 'गोपनीयता नीति'}</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">{language === 'en' ? 'Terms of Service' : 'नियम र सर्तहरू'}</Link></li>
              {user && (
                <li><Link to="/admin" className="text-purple-400 font-black hover:underline transition-colors">मिसन कन्ट्रोल (Admin)</Link></li>
              )}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border-theme/40 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          <p>{settings.copyrightText || `© 2026 ${settings.siteName}. ${language === 'en' ? 'All rights reserved.' : 'सर्वाधिकार सुरक्षित।'}`}</p>
          <p>{language === 'en' ? 'Engineered by' : 'विकास'}: <span className="text-muted-foreground/80">{settings.developerText || "Milijuli Solutions"}</span></p>
        </div>
      </div>
    </footer>
  );
}
