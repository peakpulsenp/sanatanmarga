import { useState, useEffect } from "react";
import NepaliInput from "@/src/components/ui/NepaliInput";
import Header from "@/src/components/layout/Header";
import SEOHead from "@/src/components/common/SEOHead";
import Footer from "@/src/components/layout/Footer";
import { handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { addDocWithQueue } from "@/src/lib/offlineQueue";
import { motion } from "motion/react";
import { MapPin, Phone, Mail, Send } from "lucide-react";
import { useTheme } from "@/src/components/StyleProvider";
import { useLanguage } from "@/src/context/LanguageContext";

export default function ContactPage() {
  const { siteSettings } = useTheme();
  const { language, t } = useLanguage();
  const settings = siteSettings;
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await addDocWithQueue("contactMessages", {
        ...formData,
        status: "new",
        createdAt: new Date().toISOString()
      });
      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.CREATE, "contactMessages");
      setStatus("error");
    }
  };

  const contactDescription = language === "en" && settings.contactUs_en
    ? settings.contactUs_en
    : settings.contactUs || (language === "en" 
        ? "Have any questions or suggestions? Contact us using the form below or through direct channels." 
        : "हामीलाई कुनै पनि जिज्ञासा वा सुझाव भएमा तलको फारम मार्फत वा सिधै सम्पर्क गर्न सक्नुहुन्छ।");

  const displayAddress = language === "en" && settings.address_en ? settings.address_en : settings.address || (language === "en" ? "Kathmandu, Nepal" : "काठमाडौं, नेपाल");

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={language === "en" ? `Contact - ${settings.siteName_en || "Sanatan Marga"}` : "सम्पर्क - सनातन मार्ग (Contact Sanatan Marga)"}
        description={contactDescription.slice(0, 160)}
        url="/contact"
        keywords={language === "en" ? ["Contact", "Sanatan Marga", "Advertising", "Editorial Team"] : ["सम्पर्क", "Contact Sanatan Marga", "समाचार विज्ञापन", "सम्पादकीय टोली"]}
      />
      <Header />
      
      <main className="py-16 md:py-24 container-custom">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-10"
          >
            <div className="flex flex-col gap-4">
              <h2 className="text-4xl md:text-5xl font-black text-card-foreground tracking-tight">
                {language === "en" ? "Get in Touch" : "सम्पर्क गर्नुहोस्"}
              </h2>
              <p className="text-lg font-medium text-muted-text leading-relaxed">
                {contactDescription}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-card p-8 rounded-3xl border border-border-theme shadow-sm hover:shadow-xl transition-all group">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MapPin size={24} />
                </div>
                <h4 className="text-xs font-black text-muted-text uppercase tracking-widest mb-2">
                  {language === "en" ? "Our Address" : "हाम्रो ठेगाना"}
                </h4>
                <p className="text-sm font-bold text-card-foreground">{displayAddress}</p>
              </div>

              <div className="bg-card p-8 rounded-3xl border border-border-theme shadow-sm hover:shadow-xl transition-all group">
                <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Phone size={24} />
                </div>
                <h4 className="text-xs font-black text-muted-text uppercase tracking-widest mb-2">
                  {language === "en" ? "Phone Number" : "फोन नम्बर"}
                </h4>
                <p className="text-sm font-bold text-card-foreground">{settings.contactPhone || "+९७७-०१-XXXXXXX"}</p>
              </div>

              <div className="bg-card p-8 rounded-3xl border border-border-theme shadow-sm hover:shadow-xl transition-all group">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Mail size={24} />
                </div>
                <h4 className="text-xs font-black text-muted-text uppercase tracking-widest mb-2">
                  {language === "en" ? "Email Address" : "इमेल ठेगाना"}
                </h4>
                <p className="text-sm font-bold text-card-foreground">{settings.contactEmail || "info@sanatanmarga.com"}</p>
              </div>
            </div>

            <div className="bg-card rounded-[3rem] p-10 md:p-12 shadow-2xl shadow-muted-area/50 border border-border-theme">
              <h3 className="text-2xl font-black text-card-foreground mb-8">
                {language === "en" ? "Send Us a Message" : "हामीलाई सन्देश पठाउनुहोस्"}
              </h3>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xxs font-black text-muted-text uppercase tracking-widest ml-1">
                    {language === "en" ? "Full Name" : "पूरा नाम"}
                  </label>
                  <NepaliInput 
                    value={formData.name} 
                    onChange={val => setFormData({...formData, name: val})} 
                    className="w-full bg-muted-area border border-border-theme rounded-2xl py-4 px-6 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                    placeholder={language === "en" ? "Your name" : "तपाईंको नाम"} 
                    required 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xxs font-black text-muted-text uppercase tracking-widest ml-1">
                    {language === "en" ? "Email Address" : "इमेल ठेगाना"}
                  </label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-muted-area border border-border-theme rounded-2xl py-4 px-6 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all" placeholder="example@email.com" required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xxs font-black text-muted-text uppercase tracking-widest ml-1">
                    {language === "en" ? "Subject" : "विषय"}
                  </label>
                  <NepaliInput 
                    value={formData.subject} 
                    onChange={val => setFormData({...formData, subject: val})} 
                    className="w-full bg-muted-area border border-border-theme rounded-2xl py-4 px-6 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                    placeholder={language === "en" ? "Message subject" : "सन्देशको विषय"} 
                    required 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xxs font-black text-muted-text uppercase tracking-widest ml-1">
                    {language === "en" ? "Message" : "सन्देश"}
                  </label>
                  <NepaliInput 
                    value={formData.message} 
                    onChange={val => setFormData({...formData, message: val})} 
                    className="w-full bg-muted-area border border-border-theme rounded-2xl py-4 px-6 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                    rows={4} 
                    type="textarea"
                    placeholder={language === "en" ? "Write your message here..." : "यहाँ आफ्नो सन्देश लेख्नुहोस्..."} 
                    required 
                  />
                </div>
                <button disabled={status === "sending"} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                  <Send size={18} /> {status === "sending" ? (language === "en" ? "Sending..." : "पठाउँदै...") : (language === "en" ? "Send Message" : "सन्देश पठाउनुहोस्")}
                </button>
                {status === "success" && <p className="text-green-500 font-bold text-center">{language === "en" ? "Message sent successfully!" : "सन्देश सफलतापूर्वक पठाइयो!"}</p>}
                {status === "error" && <p className="text-red-500 font-bold text-center">{language === "en" ? "Failed to send message." : "सन्देश पठाउन असफल भयो।"}</p>}
              </form>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-8 h-full"
          >
            <div className="bg-card rounded-[3rem] p-4 shadow-2xl shadow-muted-area/50 border border-border-theme h-full min-h-[500px] overflow-hidden">
              <iframe 
                src={`https://maps.google.com/maps?q=${encodeURIComponent(settings.address || "Kathmandu, Nepal")}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full rounded-[2.5rem] border-none grayscale hover:grayscale-0 transition-all duration-700 dark:invert dark:brightness-90"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            
            <div className="bg-card text-card-foreground p-10 rounded-[3rem] shadow-xl border border-border-theme">
              <h4 className="text-lg font-black uppercase tracking-widest mb-4">
                {language === "en" ? "Office Hours" : "कार्यालय समय"}
              </h4>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-border-theme pb-2">
                  <span className="text-muted-text font-bold">
                    {language === "en" ? "Sunday - Friday" : "आइतबार - शुक्रबार"}
                  </span>
                  <span className="font-black">१०:०० AM - ६:०० PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-text font-bold">
                    {language === "en" ? "Saturday" : "शनिबार"}
                  </span>
                  <span className="text-accent font-black">
                    {language === "en" ? "Closed / Holiday" : "बिदा"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
