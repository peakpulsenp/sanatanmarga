import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import SEOHead from "@/src/components/common/SEOHead";
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  BookOpen, 
  ChevronRight, 
  Flame, 
  Star, 
  Share2, 
  Compass,
  Volume2
} from "lucide-react";
import { useLanguage } from "@/src/context/LanguageContext";

export interface FestivalEvent {
  id: string;
  nameNepali: string;
  nameEnglish: string;
  tithi: string;
  dateBS: string;
  dateAD: string;
  daysRemaining: number;
  image: string;
  significanceNepali: string;
  significanceEnglish: string;
  ritualsNepali: string[];
}

export const UPCOMING_FESTIVALS: FestivalEvent[] = [
  {
    id: "dashain",
    nameNepali: "वडा दशैँ (विजयादशमी)",
    nameEnglish: "Bada Dashain (Vijaya Dashami)",
    tithi: "आश्विन शुक्ल प्रतिपदा देखि पूर्णिमा",
    dateBS: "२०८३ आश्विन २८",
    dateAD: "2026 October 14",
    daysRemaining: 42,
    image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    significanceNepali: "नेपालको सबैभन्दा ठूलो राष्ट्रिय सांस्कृतिक पर्व। असत्यमाथि सत्य र असुरी शक्तिमाथि दैवी शक्तिको विजयको प्रतीक।",
    significanceEnglish: "Nepal's grandest national festival celebrating the victory of good over evil.",
    ritualsNepali: [
      "घटस्थापना र जमरा राख्ने",
      "फूलपाती र महाअष्टमी कालरात्री पूजा",
      "महानवमी बलि र शस्त्र पूजा",
      "विजयादशमी टीका तथा श्रेष्ठजनबाट आशीर्वाद"
    ]
  },
  {
    id: "tihar",
    nameNepali: "तिहार (दीपावली तथा भाइटीका)",
    nameEnglish: "Tihar (Deepawali & Bhai Tika)",
    tithi: "कार्तिक कृष्ण त्रयोदशी देखि शुक्ल द्वितीया",
    dateBS: "२०८३ कार्तिक १५",
    dateAD: "2026 October 31",
    daysRemaining: 59,
    image: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&w=800&q=80",
    significanceNepali: "उजाला, दाजुभाइ-दिदीबहिनीको स्नेह, काग, कुकुर, गाई र लक्ष्मी पूजा गरिने उज्यालोको महान् पर्व।",
    significanceEnglish: "Festival of lights, celebrating nature, animals, and sacred sibling affection.",
    ritualsNepali: [
      "काग तिहार र कुकुर तिहार पूजा",
      "लक्ष्मी पूजा तथा देउसी-भैलो परम्परा",
      "गोवर्धन पूजा र म्हा पूजा (नेवार समुदाय)",
      "भाइटीका र सप्तरङ्गी टीका"
    ]
  },
  {
    id: "shivaratri",
    nameNepali: "महाशिवरात्रि पर्व",
    nameEnglish: "Maha Shivaratri",
    tithi: "फाल्गुन कृष्ण चतुर्दशी",
    dateBS: "२०८३ फाल्गुन १६",
    dateAD: "2027 February 28",
    daysRemaining: 178,
    image: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
    significanceNepali: "भगवान् श्री पशुपतिनाथको पावन मन्दिरमा देशविदेशका लाखौँ साधुसन्त र भक्तालुको सागर उर्लिने पाशुपत व्रत।",
    significanceEnglish: "Great night of Lord Shiva with millions of pilgrims assembling at Pashupatinath Temple.",
    ritualsNepali: [
      "अहोरात्र निराहार व्रत र चार प्रहर पूजा",
      "भस्म धारण र शिवलिङ्ग अभिशेक",
      "पशुपतिनाथमा महाआरती र धुनी परम्परा"
    ]
  }
];

export default function FestivalEnginePage() {
  const { language } = useLanguage();
  const featuredFest = UPCOMING_FESTIVALS[0];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEOHead
        title={language === "en" ? "Nepal Festivals & Panchanga Calendar - Sanatan Marga" : "नेपाली पर्व, पञ्चाङ्ग तथा उत्सव इन्जिन - सनातन मार्ग"}
        description="Upcoming Nepali festivals countdown, Panchanga tithis, ritual guides, and cultural significance of Dashain, Tihar, Shivaratri, Chhath."
        url="/festivals"
      />
      <Header />

      <main className="flex-grow container-custom max-w-6xl py-8 md:py-12 space-y-10">
        {/* Featured Countdown Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white border border-border-theme shadow-2xl p-6 md:p-12">
          <img
            src={featuredFest.image || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=1200"}
            alt={featuredFest.nameNepali}
            className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />

          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider">
              <Flame size={14} /> प्रमुख आगामी पर्व (Featured Festival)
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                {language === "en" ? featuredFest.nameEnglish : featuredFest.nameNepali}
              </h1>
              <p className="text-xs md:text-sm text-slate-300 font-medium">
                तिथि: {featuredFest.tithi} • मिति: {featuredFest.dateBS} ({featuredFest.dateAD})
              </p>
            </div>

            {/* Live Days Countdown Box */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 w-fit">
              <div className="text-center px-3">
                <span className="text-3xl md:text-4xl font-black text-amber-400">{featuredFest.daysRemaining}</span>
                <span className="block text-[10px] font-bold text-slate-300 uppercase">दिन बाँकी</span>
              </div>
              <div className="h-8 w-[1px] bg-white/20" />
              <div className="text-xs text-slate-200">
                <span className="font-bold block">विजयादशमी पर्व गणना</span>
                <span className="text-[11px] text-slate-300">शुभ साइत तथा पञ्चाङ्ग गणना तयार</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {language === "en" ? featuredFest.significanceEnglish : featuredFest.significanceNepali}
            </p>
          </div>
        </div>

        {/* Festival List */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-card-foreground flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            <span>नेपाली मुख्य सांस्कृतिक चाडपर्वहरू</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {UPCOMING_FESTIVALS.map(fest => (
              <div
                key={fest.id}
                className="bg-card border border-border-theme rounded-3xl p-6 hover:border-primary/40 transition-all shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-amber-600 dark:text-amber-400">
                    <span>{fest.dateBS}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px]">
                      {fest.daysRemaining} दिन बाँकी
                    </span>
                  </div>

                  <h3 className="text-base font-black text-card-foreground">
                    {language === "en" ? fest.nameEnglish : fest.nameNepali}
                  </h3>

                  <p className="text-xs text-muted-text line-clamp-3">
                    {language === "en" ? fest.significanceEnglish : fest.significanceNepali}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-border-theme/60">
                    <span className="text-[10px] font-black uppercase text-muted-text">मुख्य विधि तथा परम्परा:</span>
                    <ul className="space-y-1 text-[11px] text-muted-text">
                      {fest.ritualsNepali.slice(0, 3).map((r, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <span className="truncate">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link
                  to={`/search?q=${encodeURIComponent(fest.nameNepali)}`}
                  className="w-full py-2.5 rounded-xl bg-muted-area hover:bg-muted-area/80 text-card-foreground text-xs font-bold flex items-center justify-center gap-1.5 border border-border-theme transition-all cursor-pointer"
                >
                  <span>सम्बन्धित समाचार र ग्रन्थ</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
