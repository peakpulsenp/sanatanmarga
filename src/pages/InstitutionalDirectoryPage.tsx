import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import SEOHead from "@/src/components/common/SEOHead";
import { 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Search, 
  BookOpen, 
  ShoppingBag, 
  ExternalLink, 
  Phone, 
  Mail, 
  Network,
  Sparkles
} from "lucide-react";
import { useLanguage } from "@/src/context/LanguageContext";

export interface DirectoryEntity {
  id: string;
  nameNepali: string;
  nameEnglish: string;
  type: "temple" | "gurukul" | "ashram" | "library" | "publisher" | "research";
  district: string;
  province: string;
  established: string;
  isVerified: boolean;
  image: string;
  descriptionNepali: string;
  descriptionEnglish: string;
  contactPhone?: string;
  website?: string;
  knowledgeNodeId?: string;
}

export const INSTITUTIONAL_ENTITIES: DirectoryEntity[] = [
  {
    id: "pashupati-fund",
    nameNepali: "श्री पशुपतिनाथ क्षेत्र विकास कोष",
    nameEnglish: "Pashupati Area Development Trust (PADT)",
    type: "temple",
    district: "काठमाडौँ",
    province: "बागमती",
    established: "ने.सं. १००+ (प्राचीन)",
    isVerified: true,
    image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    descriptionNepali: "विश्वसम्पदा सूचीमा सूचीकृत श्री पशुपतिनाथ मन्दिर, पाशुपत क्षेत्र, घाट तथा सम्पूर्ण वैदिक पूजा व्यवस्थापन कोष।",
    descriptionEnglish: "UNESCO World Heritage site governing sacred Pashupatinath Temple and Vedic culture.",
    contactPhone: "+977-1-4467262",
    website: "https://pashupatinath.org.np",
    knowledgeNodeId: "kn_pashupati"
  },
  {
    id: "janaki-temple-board",
    nameNepali: "श्री जानकी मन्दिर व्यवस्थापन समिति",
    nameEnglish: "Janaki Temple Trust, Janakpurdham",
    type: "temple",
    district: "धनुषा",
    province: "मधेश",
    established: "वि.सं. १९६८",
    isVerified: true,
    image: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&w=800&q=80",
    descriptionNepali: "माता सीताको जन्मभूमि जनकपुरधाममा अवस्थित नवलखा मन्दिर, रामजानकी विवाह उत्सव तथा मिथिला संस्कृति संरक्षण।",
    descriptionEnglish: "Governing trust of historic Janaki Temple in Mithila culture.",
    contactPhone: "+977-41-520112",
    knowledgeNodeId: "kn_janaki"
  },
  {
    id: "valmiki-gurukul",
    nameNepali: "नेपाल संस्कृत विश्वविद्यालय (वाल्मीकि विद्यापीठ)",
    nameEnglish: "Nepal Sanskrit University (Valmiki Campus)",
    type: "gurukul",
    district: "काठमाडौँ",
    province: "बागमती",
    established: "वि.सं. २००८",
    isVerified: true,
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
    descriptionNepali: "नेपालको जेठो संस्कृत शिक्षण संस्थान, जहाँ वेद, न्याय, व्याकरण, ज्योतिष तथा दर्शन विषयमा उच्च शिक्षा दिइन्छ।",
    descriptionEnglish: "Pioneer Sanskrit higher learning institute teaching Vedas and Eastern Philosophy.",
    contactPhone: "+977-1-4221198",
    website: "https://nsu.edu.np"
  },
  {
    id: "national-manuscript-library",
    nameNepali: "राष्ट्रिय अभिलेखालय (National Archives of Nepal)",
    nameEnglish: "National Archives of Nepal",
    type: "library",
    district: "काठमाडौँ",
    province: "बागमती",
    established: "वि.सं. २०२४",
    isVerified: true,
    image: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
    descriptionNepali: "नेपालका ५०,००० भन्दा बढी दुर्लभ ताडपत्र, स्वर्ण अक्षरयुक्त भोजपत्र तथा प्राचीन हस्तलिखित ग्रन्थहरूको राष्ट्रिय भण्डार।",
    descriptionEnglish: "National repository preserving over 50,000 rare palm-leaf and gold-inscribed ancient manuscripts.",
    contactPhone: "+977-1-4262961"
  }
];

export default function InstitutionalDirectoryPage() {
  const { language } = useLanguage();
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredEntities = INSTITUTIONAL_ENTITIES.filter(entity => {
    const matchesType = filterType === "all" || entity.type === filterType;
    const corpus = [entity.nameNepali, entity.nameEnglish, entity.district].join(" ").toLowerCase();
    const matchesSearch = corpus.includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEOHead
        title={language === "en" ? "Institutional Directory - Temples, Gurukuls & Ashrams of Nepal" : "सनातन संस्थागत डाइरेक्टरी - मन्दिर, गुरुकुल, आश्रम र अनुसन्धान केन्द्रहरू"}
        description="Comprehensive verified directory of temples, gurukuls, manuscript archives, and cultural research organizations across Nepal."
        url="/directory"
      />
      <Header />

      <main className="flex-grow container-custom max-w-6xl py-8 md:py-12 space-y-10">
        {/* Header Hero */}
        <div className="bg-card border border-border-theme rounded-3xl p-6 md:p-10 space-y-6 shadow-sm">
          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
              <Building2 size={14} /> राष्ट्रिय संस्थागत अभिलेख (Institutional Registry)
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-card-foreground">
              {language === "en" ? "Institutional Directory of Nepal" : "सनातन संस्था, मन्दिर तथा गुरुकुल डाइरेक्टरी"}
            </h1>
            <p className="text-xs md:text-sm text-muted-text max-w-2xl">
              नेपालभरका प्रसिद्ध मन्दिर, गुरुकुल, अभिलेखालय, पीठ तथा सांस्कृतिक संस्थाको प्रमाणीकृत विवरण।
            </p>
          </div>

          {/* Search & Type Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border-theme/60 pt-6">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="मन्दिर, गुरुकुल वा जिल्लाको नाम खोज्नुहोस्..."
                className="w-full pl-10 pr-4 py-2.5 bg-muted-area border border-border-theme rounded-xl text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: "all", label: "सबै" },
                { id: "temple", label: "मन्दिर / कोष" },
                { id: "gurukul", label: "गुरुकुल" },
                { id: "library", label: "अभिलेखालय" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    filterType === tab.id
                      ? "bg-primary text-white shadow-sm"
                      : "bg-muted-area text-muted-text hover:text-foreground border border-border-theme"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEntities.map(entity => (
            <div
              key={entity.id}
              className="bg-card border border-border-theme rounded-3xl p-6 hover:border-primary/40 transition-all shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={entity.image || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200"} alt={entity.nameNepali} className="w-14 h-14 rounded-2xl object-cover shrink-0 border" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-black text-card-foreground">
                          {language === "en" ? entity.nameEnglish : entity.nameNepali}
                        </h3>
                        {entity.isVerified && (
                          <CheckCircle2 size={16} className="text-primary shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-muted-text flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-primary" /> {entity.district}, {entity.province} • स्थापना: {entity.established}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-text leading-relaxed">
                  {language === "en" ? entity.descriptionEnglish : entity.descriptionNepali}
                </p>
              </div>

              <div className="pt-4 border-t border-border-theme/60 flex items-center justify-between text-xs">
                {entity.contactPhone && (
                  <span className="text-muted-text font-bold flex items-center gap-1">
                    <Phone size={12} className="text-primary" /> {entity.contactPhone}
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <Link
                    to="/knowledge"
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center gap-1 hover:bg-amber-500/20"
                  >
                    <Network size={12} /> ज्ञानकोष
                  </Link>

                  {entity.website && (
                    <a
                      href={entity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-primary text-white font-bold text-[11px] flex items-center gap-1 hover:bg-primary/90"
                    >
                      <ExternalLink size={12} /> वेवसाइट
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
