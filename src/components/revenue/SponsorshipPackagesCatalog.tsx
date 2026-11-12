import { useState } from "react";
import { 
  SPONSORSHIP_PACKAGES, 
  SponsorshipPackage 
} from "@/src/constants/revenueInventory";
import { 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Building2, 
  HeartHandshake, 
  ArrowUpRight, 
  Download,
  Eye
} from "lucide-react";
import { toast } from "sonner";

export default function SponsorshipPackagesCatalog() {
  const [packages] = useState<SponsorshipPackage[]>(SPONSORSHIP_PACKAGES);
  const [selectedPkg, setSelectedPkg] = useState<SponsorshipPackage | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredPackages = packages.filter(
    (p) => selectedCategory === "all" || p.category === selectedCategory
  );

  const handleBookPackage = (pkg: SponsorshipPackage) => {
    toast.success(`'${pkg.nameNe}' को प्रस्ताव सफलतापूर्वक सिर्जना भयो र सम्पादकीय टोलीलाई पठाइयो!`);
    setSelectedPkg(null);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted-area/40 border border-border-theme p-5 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xxs font-black uppercase tracking-wider border border-amber-500/20">
              Commercial Sponsorship Packages
            </span>
            <span className="text-xxs font-bold text-muted-text">
              • बन्डल गरिएका उच्च-प्रभाव प्रायोजन प्याकेजहरू
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-black text-card-foreground">
            कर्पोरेट तथा सांस्कृतिक प्रायोजन प्याकेजहरू (Turnkey Sponsorship Solutions)
          </h2>
          <p className="text-xs text-muted-text max-w-3xl">
            चाडपर्व, प्रादेशिक अधिपत्य, सेयरबजार/वित्तीय साक्षरता तथा सांस्कृतिक सम्पदा सम्बन्धी एकीकृत डिजिटल ब्रान्डिङ प्याकेजहरू।
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => toast.success("प्रायोजन क्याटलग ब्रोसर डाउनलोड भयो!")}
            className="px-4 py-2 bg-card hover:bg-muted-area text-card-foreground border border-border-theme text-xs font-black rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Download size={14} /> प्याकेज ब्रोसर (PDF)
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "all", label: "सबै प्याकेजहरू (All Packages)" },
          { id: "festival", label: "महापर्व विशेष (Festival)", icon: Calendar },
          { id: "province", label: "प्रादेशिक अधिपत्य (Province)", icon: MapPin },
          { id: "business", label: "अर्थ एवं सेयर (NEPSE/Economy)", icon: TrendingUp },
          { id: "heritage", label: "सम्पदा तथा पर्यटन (Heritage)", icon: Building2 }
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === cat.id
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-muted-area/60 text-muted-text hover:text-card-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPackages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-card border border-border-theme hover:border-amber-500/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5 relative overflow-hidden group"
          >
            {/* Discount Badge */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {pkg.badge}
              </span>
              <span className="text-xxs font-black text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {pkg.discountPct}% बन्डल छुट समावेश
              </span>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-black text-card-foreground group-hover:text-amber-600 transition-colors leading-snug">
                {pkg.nameNe}
              </h3>
              <p className="text-xs text-muted-text leading-relaxed">
                {pkg.descriptionNe}
              </p>
            </div>

            {/* Key Metrics Strip with Integrity Tag */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-muted-area/40 border border-border-theme">
              <div className="space-y-0.5">
                <span className="text-xxs text-muted-text font-bold uppercase">अपेक्षित अवलोकन</span>
                <div className="text-sm font-black text-card-foreground font-mono">{pkg.expectedImpressions}</div>
              </div>
              <div className="space-y-0.5">
                <span className="text-xxs text-muted-text font-bold uppercase">अपेक्षित पाठक पहुँच</span>
                <div className="text-sm font-black text-blue-600 font-mono">{pkg.expectedReach}</div>
              </div>
            </div>

            {/* Included Placements */}
            <div className="space-y-2">
              <span className="text-xs font-black text-card-foreground block">
                प्याकेजमा समावेश इन्भेन्टरी (Included Placements):
              </span>
              <ul className="space-y-1.5 text-xs text-muted-text">
                {pkg.includedPlacements.map((plc, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-card-foreground/90 font-medium">{plc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing & CTA */}
            <div className="pt-4 border-t border-border-theme flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xxs text-muted-text font-bold uppercase">प्याकेज मूल्य ({pkg.duration})</span>
                <div className="text-xl sm:text-2xl font-black text-card-foreground font-mono text-emerald-600">
                  रू {pkg.pricingNpr.toLocaleString("ne-NP")}
                </div>
                <div className="text-[10px] text-muted-text">+ १३% भ्याट नियम अनुसार</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPkg(pkg)}
                  className="px-3.5 py-2 rounded-xl bg-muted-area hover:bg-card-foreground hover:text-card text-xs font-bold transition-all cursor-pointer"
                >
                  विवरण हेर्नुहोस्
                </button>
                <button
                  onClick={() => handleBookPackage(pkg)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1"
                >
                  <Sparkles size={14} /> तत्काल बुक (Book)
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* DETAIL PREVIEW MODAL */}
      {selectedPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border-theme rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-theme pb-4">
              <div className="space-y-1">
                <span className="text-xxs font-black px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  {selectedPkg.badge}
                </span>
                <h3 className="text-base font-black text-card-foreground">{selectedPkg.nameNe}</h3>
              </div>
              <button
                onClick={() => setSelectedPkg(null)}
                className="p-1.5 rounded-lg bg-muted-area text-muted-text hover:text-card-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-muted-area/40 border border-border-theme space-y-1">
                <span className="font-bold text-card-foreground">प्याकेज विवरण (English Description):</span>
                <p className="text-muted-text">{selectedPkg.descriptionEn}</p>
              </div>

              <div className="space-y-2">
                <span className="font-black text-card-foreground block">विशेषता तथा सुविधाहरू (Key Highlights):</span>
                <div className="grid grid-cols-1 gap-2">
                  {selectedPkg.features.map((feat, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-card border border-border-theme flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-600 shrink-0" />
                      <span className="text-card-foreground font-bold">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex justify-between items-center">
                <div>
                  <span className="text-xxs font-bold text-emerald-800 dark:text-emerald-300 uppercase">एकमुष्ट प्रायोजन लगानी</span>
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                    रू {selectedPkg.pricingNpr.toLocaleString("ne-NP")}
                  </div>
                </div>
                <button
                  onClick={() => handleBookPackage(selectedPkg)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  यो प्याकेज सुरक्षित गर्नुहोस्
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
