import React from "react";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import SEOHead from "@/src/components/common/SEOHead";
import { 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  Scale, 
  Lock, 
  Award,
  Globe,
  Building2
} from "lucide-react";

export default function TransparencyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEOHead
        title="पारदर्शिता तथा सम्पादकीय आचारसंहिता (Transparency Center) | सनातन मार्ग"
        description="Sanatan Marga's editorial policies, No Source No Story doctrine, AI disclosure, fact-checking methodology, and funding transparency."
        url="/transparency"
      />
      <Header />

      <main className="flex-grow container-custom max-w-4xl py-12 space-y-10">
        {/* Banner Header */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">
            <ShieldCheck size={14} /> Public Trust & Ethics Infrastructure
          </span>
          <h1 className="text-3xl sm:text-5xl font-black font-display text-foreground tracking-tight">
            सम्पादकीय पारदर्शिता तथा आचारसंहिता
          </h1>
          <p className="text-muted-text text-sm sm:text-base max-w-2xl mx-auto">
            सनातन मार्ग डिजिटल मिडियाको विश्वसनियता, तथ्य जाँच विधि, AI प्रयोग सीमा र वित्तीय स्वायत्तता सम्बन्धी सार्वजनिक प्रतिबद्धता।
          </p>
        </div>

        {/* Core Ethics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
              <FileText size={20} />
            </div>
            <h3 className="text-base font-black text-card-foreground">१. No Source = No Story सिद्धान्त</h3>
            <p className="text-xs text-muted-text leading-relaxed">
              कुनै पनि समाचार वा खोजमूलक सामाग्री प्राथमिक आधिकारिक स्रोत (सरकारी दस्तावेज, प्रत्यक्षदर्शी, विज्ञ वा प्रत्यक्ष अडियो/भिडियो प्रमाण) बिना प्रकाशित गरिँदैन।
            </p>
          </div>

          <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-black">
              <Sparkles size={20} />
            </div>
            <h3 className="text-base font-black text-card-foreground">२. AI प्रयोग तथा प्रविधि सीमा</h3>
            <p className="text-xs text-muted-text leading-relaxed">
              AI (Gemini OS) लाई भाषा सम्पादन, अनुवाद र सारांश तयार गर्न प्रयोग गरिन्छ। तर समाचारको अन्तिम सम्पादन र तथ्य प्रमाणीकरण मानव सम्पादकले नै गर्दछन्।
            </p>
          </div>

          <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="text-base font-black text-card-foreground">३. तथ्य-जाँच तथा गल्ती सच्याउने नीति</h3>
            <p className="text-xs text-muted-text leading-relaxed">
              यदि कुनै सामाग्रीमा त्रुटि भेटिएमा वा थप स्पष्टीकरण आवश्यक परेमा तत्काल सार्वजनिक रूपमा सच्याइनेछ र संशोधन नोट (Correction Note) समावेश गरिनेछ।
            </p>
          </div>

          <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center font-black">
              <Building2 size={20} />
            </div>
            <h3 className="text-base font-black text-card-foreground">४. वित्तीय स्वायत्तता र लगानी पारदर्शिता</h3>
            <p className="text-xs text-muted-text leading-relaxed">
              सनातन मार्ग पाठक सदस्यता, ई-कमर्स (सनातन बजार), र विज्ञापनबाट सञ्चालित हुन्छ। विज्ञापनदाताले हाम्रो सम्पादकीय स्वतन्त्रतालाई प्रभाव पार्न पाउने छैनन्।
            </p>
          </div>
        </div>

        {/* Full Commitment Document */}
        <div className="bg-card border border-border-theme rounded-3xl p-8 space-y-6 shadow-sm">
          <h2 className="text-xl font-black text-card-foreground border-b border-border-theme pb-4">
            नेपाल तथा विश्वभरका पाठकहरूप्रति हाम्रो आधिकारिक प्रतिबद्धता
          </h2>
          <div className="space-y-4 text-xs md:text-sm text-muted-text leading-relaxed">
            <p>
              सनातन मार्ग डिजिटल मिडियाले नेपालका ७७ वटै जिल्लाका नागरिकहरूका आवाज, सभ्यतागत ज्ञानकोष र निष्पक्ष राष्ट्रिय समाचारलाई एउटै प्लेटफर्ममा समेट्ने लक्ष्य राखेको छ।
            </p>
            <p>
              हामी पत्रकारिताको निष्पक्षता, व्यक्तिगत गोपनीयताको रक्षा र डिजिटल मिडिया सुशासनका अन्तर्राष्ट्रिय मापदण्डहरूको पूर्ण पालना गर्दछौँ।
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
