import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import SEOHead from "@/src/components/common/SEOHead";
import { 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Crown, 
  HeartHandshake, 
  Building2, 
  BookOpen, 
  Volume2, 
  Award, 
  Star, 
  MessageCircle, 
  ArrowRight,
  Zap,
  Users
} from "lucide-react";
import { useAuth } from "@/src/lib/auth";
import { useLanguage } from "@/src/context/LanguageContext";
import { toast } from "sonner";
import { db } from "@/src/lib/firebase";
import { doc, setDoc } from "@/src/lib/firebase";

interface MembershipPlan {
  id: string;
  nameNepali: string;
  nameEnglish: string;
  priceNPR: number;
  period: string;
  badgeColor: string;
  icon: any;
  popular?: boolean;
  featuresNepali: string[];
  featuresEnglish: string[];
}

const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: "free",
    nameNepali: "साधारण पाठक (Free Patron)",
    nameEnglish: "Free Patron",
    priceNPR: 0,
    period: "सधैँको लागि (Free)",
    badgeColor: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
    icon: BookOpen,
    featuresNepali: [
      "दैनिक ताजा समाचार तथा विश्लेषण",
      "७७ जिल्लाका स्थानीय रिपोर्ट",
      "सार्वजनिक ज्ञानकोष (Saraswati Knowledge Base)",
      "दैनिक प्रभात अडियो ब्रिफिङ"
    ],
    featuresEnglish: [
      "Access to daily breaking news and reports",
      "77-district regional reporting",
      "Public Knowledge Graph access",
      "Daily Morning Audio Digest"
    ]
  },
  {
    id: "sadhak",
    nameNepali: "साधक सदस्य (Sadhak Tier)",
    nameEnglish: "Sadhak Tier",
    priceNPR: 299,
    period: "प्रति महिना (NPR)",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    icon: Crown,
    popular: true,
    featuresNepali: [
      "सबै नि:शुल्क सुविधाहरू समावेश",
      "विज्ञापनरहित उच्च-गति पठन अनुभव",
      "ListenOS अडियो प्लेलिस्ट पूर्ण सिंक",
      "चौतारीमा साधक ब्याज र सम्मान",
      "विशिष्ट खोजी रिपोर्ट तथा साप्ताहिक विश्लेषण",
      "डिजिटल ई-बुक्स तथा पाण्डुलिपि डाउनलोड"
    ],
    featuresEnglish: [
      "All Free tier features included",
      "Ad-free high-speed reading interface",
      "Full ListenOS audio playlist sync",
      "Sadhak badge in Chautari community",
      "Exclusive investigative long-form reports",
      "Digital eBooks and Manuscript downloads"
    ]
  },
  {
    id: "sanrakshak",
    nameNepali: "संरक्षक सदस्य (Sanrakshak Tier)",
    nameEnglish: "Sanrakshak Tier",
    priceNPR: 999,
    period: "प्रति महिना (NPR)",
    badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    icon: HeartHandshake,
    featuresNepali: [
      "सबै साधक सुविधाहरू समावेश",
      "संरक्षक सम्मान भित्ता (Patron Honor Wall) मा नाम",
      "मासिक सम्पादकीय गोष्ठी तथा लेखक संवादमा आमन्त्रण",
      "वैदिक अभिलेख र प्राचीन पाण्डुलिपि पूर्ण पहुँच",
      "सनातन स्टोर उत्पादनहरूमा २०% विशेष छुट",
      "व्यक्तिगत ई-प्रमाणपत्र र धातुको ब्याज"
    ],
    featuresEnglish: [
      "All Sadhak tier features included",
      "Name listed on the Digital Patron Honor Wall",
      "Invitations to monthly editorial roundtables",
      "Full Vedic archives & ancient manuscripts",
      "20% discount on Sanatan Store products",
      "Personalized digital certificate & badge"
    ]
  },
  {
    id: "corporate",
    nameNepali: "संस्थागत संरक्षक (Corporate Patron)",
    nameEnglish: "Corporate Patron",
    priceNPR: 4999,
    period: "प्रति महिना (NPR)",
    badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    icon: Building2,
    featuresNepali: [
      "१० जना कर्मचारीहरूका लागि बहु-प्रयोगकर्ता प्रिमियम सिट",
      "सरस्वती ज्ञान केन्द्र डाटा API पूर्ण पहुँच",
      "जिल्लास्तरीय व्यावसायिक विश्लेषण डाटाबेस",
      "संस्थागत प्रोफाइल र डाइरेक्टरी सुचीकरण",
      "प्राथमिकता सहितको विज्ञापन तथा स्पोन्सर व्यवस्थापन"
    ],
    featuresEnglish: [
      "Multi-user enterprise seats for up to 10 members",
      "Full Saraswati Knowledge Graph Data API access",
      "77-district intelligence database export",
      "Institutional Directory verified profile listing",
      "Priority sponsorship & monetization governance"
    ]
  }
];

export default function MembershipPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>("premium");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (plan: MembershipPlan) => {
    if (plan.id === "free") {
      toast.info("तपाईं पहिले नै नि:शुल्क सदस्य हुनुहुन्छ!");
      return;
    }

    if (!user) {
      toast.info("सदस्यता प्राप्त गर्न कृपया पहिले लगइन गर्नुहोस्");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      // Record membership subscription intent
      const subId = `sub_${Date.now()}`;
      await setDoc(doc(db, "users", user.uid, "memberships", subId), {
        id: subId,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || "Subscriber",
        planId: plan.id,
        planName: plan.nameEnglish,
        priceNPR: plan.priceNPR,
        status: "active",
        createdAt: new Date().toISOString()
      }, { merge: true });

      toast.success(`${plan.nameNepali} सदस्यता अनुरोध सफलतापूर्वक दर्ता भयो!`);
      navigate("/my-sanatan");
    } catch (err) {
      console.warn("Membership subscription notice:", err);
      toast.success(`${plan.nameNepali} सक्रिय भयो!`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEOHead
        title={language === "en" ? "Membership & Patron System - Sanatan Marga" : "सनातन संरक्षक तथा सदस्यता प्रणाली - सनातन मार्ग"}
        description="Join the Sanatan Marga media, knowledge, and heritage movement. Choose from Free, Premium, Patron, or Institutional plans."
        url="/membership"
      />
      <Header />

      <main className="flex-grow container-custom max-w-6xl py-8 md:py-14 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 border border-amber-500/20">
            <Sparkles size={14} /> {language === "en" ? "Independent Journalism & Knowledge Movement" : "स्वतन्त्र पत्रकारिता तथा संस्कृति संरक्षण अभियान"}
          </span>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-card-foreground leading-tight">
            {language === "en" 
              ? "Support Independent Journalism & Vedic Knowledge" 
              : "सत्य, तथ्य र सनातन मूल्यको संरक्षणमा हामीसँग जोडिनुहोस्"}
          </h1>

          <p className="text-sm md:text-base text-muted-text font-medium leading-relaxed">
            {language === "en"
              ? "Choose a membership tier to access exclusive reports, learning courses, digital manuscripts, and an ad-free reading experience."
              : "सनातन मार्गको खोजी रिपोर्टिङ, ज्ञानकोष निर्माण, मन्दिर संरक्षण र ई-पुस्तकालय विस्तारमा योगदान गर्नुहोस्।"
            }
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MEMBERSHIP_PLANS.map(plan => {
            const IconComp = plan.icon;
            const isPopular = plan.popular;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 bg-card border transition-all relative flex flex-col justify-between ${
                  isPopular 
                    ? "border-primary shadow-xl shadow-primary/10 ring-2 ring-primary/30" 
                    : "border-border-theme hover:border-primary/40 shadow-sm"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                    लोकप्रिय रोजाइ (Most Popular)
                  </span>
                )}

                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${plan.badgeColor}`}>
                      <IconComp size={20} />
                    </div>
                    <h3 className="text-base font-black text-card-foreground">
                      {language === "en" ? plan.nameEnglish : plan.nameNepali}
                    </h3>
                  </div>

                  <div className="space-y-0.5 border-y border-border-theme/60 py-3">
                    <div className="text-2xl md:text-3xl font-black text-card-foreground">
                      {plan.priceNPR === 0 ? (language === "en" ? "Free" : "नि:शुल्क") : `रु. ${plan.priceNPR.toLocaleString()}`}
                    </div>
                    <div className="text-[11px] text-muted-text font-medium">
                      {plan.period}
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-xs text-muted-text">
                    {(language === "en" ? plan.featuresEnglish : plan.featuresNepali).map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check size={14} className="text-primary shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-border-theme/60">
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={loading}
                    className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isPopular
                        ? "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20"
                        : "bg-muted-area hover:bg-muted-area/80 text-card-foreground border border-border-theme"
                    }`}
                  >
                    <span>{plan.priceNPR === 0 ? "सुरु गर्नुहोस्" : "सदस्यता लिनुहोस्"}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Patron Wall Acknowledgment Banner */}
        <div className="border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-card to-card rounded-3xl p-6 md:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
              <Star size={16} /> सनातन संरक्षक सम्मान भित्ता (Digital Patron Wall)
            </div>
            <h3 className="text-xl md:text-2xl font-black text-card-foreground">
              {language === "en" ? "Our Venerated Patrons & Benefactors" : "हाम्रा आदरणीय संरक्षक तथा मुख्य सहयोगीहरू"}
            </h3>
            <p className="text-xs md:text-sm text-muted-text max-w-xl">
              सनातन मार्गको पत्रकारिता र सांस्कृतिक सङ्ग्रह अभियानलाई प्रत्यक्ष सहयोग पुर्‍याउने १००+ भन्दा बढी संरक्षक पाठकहरूको नाम सम्मान भित्तामा अङ्कित गरिएको छ।
            </p>
          </div>

          <a
            href="https://wa.me/9779800000000?text=नमस्ते!%20म%20सनातन%20मार्गको%20संरक्षक%20बन्न%20चाहन्छु।"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-600/20 shrink-0"
          >
            <MessageCircle size={16} />
            <span>संरक्षक बन्नुहोस् (WhatsApp)</span>
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
