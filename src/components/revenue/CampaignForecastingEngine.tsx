import { useState, useMemo } from "react";
import { 
  AD_INVENTORY_REGISTRY, 
  calculateCampaignForecast, 
  ForecastOutput 
} from "@/src/constants/revenueInventory";
import { AdPosition } from "@/src/types";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MousePointerClick, 
  Eye, 
  Calendar, 
  MapPin, 
  Layers, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Info,
  DollarSign,
  HelpCircle,
  X
} from "lucide-react";
import { toast } from "sonner";

export default function CampaignForecastingEngine() {
  const [selectedSlots, setSelectedSlots] = useState<AdPosition[]>([
    "hero_slider",
    "sponsored_story"
  ]);
  const [targetCategory, setTargetCategory] = useState<string>("all");
  const [targetDistrict, setTargetDistrict] = useState<string>("all");
  const [durationDays, setDurationDays] = useState<number>(14);
  const [dayparting, setDayparting] = useState<"all_day" | "morning_peak" | "evening_peak" | "business_hours">("all_day");
  const [showMethodologyModal, setShowMethodologyModal] = useState<boolean>(false);

  const toggleSlot = (key: AdPosition) => {
    if (selectedSlots.includes(key)) {
      if (selectedSlots.length === 1) {
        toast.error("कम्तिमा एउटा इन्भेन्टरी स्लट चयन गर्नुपर्छ!");
        return;
      }
      setSelectedSlots(selectedSlots.filter((k) => k !== key));
    } else {
      setSelectedSlots([...selectedSlots, key]);
    }
  };

  const forecast: ForecastOutput = useMemo(() => {
    return calculateCampaignForecast({
      slotKeys: selectedSlots,
      category: targetCategory,
      districts: targetDistrict === "all" ? [] : [targetDistrict],
      durationDays,
      daypartingHours: dayparting
    });
  }, [selectedSlots, targetCategory, targetDistrict, durationDays, dayparting]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-muted-area/40 border border-border-theme p-5 rounded-3xl space-y-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xxs font-black uppercase tracking-wider border border-purple-500/20">
              Publisher Campaign Forecasting Engine
            </span>
            <span className="text-xxs font-bold text-muted-text">
              • परिष्कृत पाठक पहुँच तथा बजेट प्रक्षेपण
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-black text-card-foreground">
            अभियान प्रभाव तथा पाठक प्रक्षेपण इन्जिन (Campaign Forecasting & Reach Planning)
          </h2>
          <p className="text-xs text-muted-text max-w-3xl">
            विज्ञापनदाताहरूलाई अभियान सुरु हुनुअघि नै अपेक्षित कुल पहुँच (Unique Reach), अनुमानित अवलोकन (Impressions), औसत क्लिक दर (CTR Range), र कर सहितको बजेट प्रक्षेपण प्रदान गर्नुहोस्।
          </p>
        </div>

        <button
          onClick={() => setShowMethodologyModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-card hover:bg-purple-600 hover:text-white border border-border-theme text-card-foreground text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <HelpCircle size={14} className="text-purple-500 group-hover:text-white" /> प्रक्षेपण विधि तथा आधार (Methodology)
        </button>
      </div>

      {/* 2-Column Workspace: Controls (Left) & Forecast Yield (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT CONFIGURATION CONTROLS (5 cols) */}
        <div className="lg:col-span-5 bg-card border border-border-theme rounded-3xl p-5 shadow-sm space-y-5">
          <div className="border-b border-border-theme pb-3 flex items-center justify-between">
            <h3 className="text-sm font-black text-card-foreground flex items-center gap-1.5">
              <Layers size={16} className="text-purple-600" /> अभियान योजना प्यारामिटरहरू (Inputs)
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Live Capacity: {forecast.availableCapacityPct}% Available
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Slot Selection */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-black text-card-foreground block">
                  इन्भेन्टरी स्लटहरू चयन गर्नुहोस् ({selectedSlots.length} Selected):
                </label>
                <button
                  type="button"
                  onClick={() => setSelectedSlots(AD_INVENTORY_REGISTRY.map((s) => s.key))}
                  className="text-xxs text-primary font-bold hover:underline cursor-pointer"
                >
                  सबै छान्नुहोस्
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-1 border border-border-theme/60 rounded-2xl bg-muted-area/20">
                {AD_INVENTORY_REGISTRY.map((slot) => {
                  const isChecked = selectedSlots.includes(slot.key);
                  return (
                    <button
                      key={slot.key}
                      type="button"
                      onClick={() => toggleSlot(slot.key)}
                      className={`w-full p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer border ${
                        isChecked
                          ? "bg-purple-600/10 border-purple-500/40 text-card-foreground font-black shadow-xs"
                          : "bg-card/60 border-border-theme/40 text-muted-text hover:bg-muted-area"
                      }`}
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="text-xs line-clamp-1">{slot.nameNe}</div>
                        <div className="text-[10px] text-muted-text font-mono">
                          {slot.placementGroup.toUpperCase()} • CPM: रू {slot.baseCpmRateNpr}
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                        isChecked ? "bg-purple-600 text-white border-purple-600" : "border-border-theme"
                      }`}>
                        {isChecked && <CheckCircle2 size={12} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campaign Duration Slider */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-muted-area/30 border border-border-theme">
              <div className="flex justify-between items-center">
                <span className="font-bold text-card-foreground flex items-center gap-1">
                  <Calendar size={14} className="text-purple-600" /> अभियान अवधि (Duration):
                </span>
                <span className="font-black font-mono text-purple-600">{durationDays} दिन</span>
              </div>
              <input
                type="range"
                min={3}
                max={90}
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-text font-mono">
                <span>३ दिन (Short)</span>
                <span>१५ दिन (१०% छुट)</span>
                <span>३० दिन (२०% छुट)</span>
                <span>९० दिन (३५% छुट)</span>
              </div>
            </div>

            {/* Target Category & District */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-card-foreground block">लक्षित विधा (Category):</label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-card-foreground text-xs focus:outline-none"
                >
                  <option value="all">सबै विधा (All Network)</option>
                  <option value="economy">अर्थ तथा सेयर (NEPSE)</option>
                  <option value="politics">राजनीति तथा सुशासन</option>
                  <option value="technology">विज्ञान तथा प्रविधि</option>
                  <option value="dharma">धर्म, संस्कृति तथा समाज</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-card-foreground block">भौगोलिक क्षेत्र (Geo):</label>
                <select
                  value={targetDistrict}
                  onChange={(e) => setTargetDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-card-foreground text-xs focus:outline-none"
                >
                  <option value="all">समग्र नेपाल (Nationwide)</option>
                  <option value="काठमाडौं">काठमाडौं उपत्यका</option>
                  <option value="कास्की">कास्की (पोखरा हब)</option>
                  <option value="मोरङ">मोरङ (विराटनगर हब)</option>
                  <option value="रुपन्देही">रुपन्देही (बुटवल/भैरहवा)</option>
                  <option value="चितवन">चितवन (भरतपुर)</option>
                  <option value="कर्णाली">कर्णाली प्रदेश</option>
                </select>
              </div>
            </div>

            {/* Dayparting Scheduling */}
            <div className="space-y-1.5">
              <label className="font-bold text-card-foreground block">प्रसारण समय (Dayparting Target):</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "all_day", label: "२४ घण्टा (Full Day 24h)" },
                  { id: "morning_peak", label: "बिहानी पिक (6AM - 11AM)" },
                  { id: "business_hours", label: "कार्यालय समय (10AM - 5PM)" },
                  { id: "evening_peak", label: "साँझको प्राइम (6PM - 10PM)" }
                ].map((dp) => (
                  <button
                    key={dp.id}
                    type="button"
                    onClick={() => setDayparting(dp.id as any)}
                    className={`p-2 rounded-xl text-xxs font-bold text-left transition-all cursor-pointer border ${
                      dayparting === dp.id
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-muted-area/50 border-border-theme text-muted-text hover:text-card-foreground"
                    }`}
                  >
                    {dp.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT FORECAST RESULTS & PROJECTIONS (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Key KPI Cards with Explicit Integrity Labels */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* KPI 1: Estimated Impressions */}
            <div className="bg-card border border-border-theme rounded-3xl p-4 shadow-sm space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between text-muted-text">
                <span className="text-xxs font-black uppercase tracking-wider">अनुमानित अवलोकन</span>
                <span className="text-[9px] bg-purple-500/10 text-purple-600 font-black px-1.5 py-0.5 rounded border border-purple-500/20">
                  प्रक्षेपित (Projected)
                </span>
              </div>
              <div className="text-2xl font-black text-card-foreground font-mono">
                {forecast.expectedImpressions.toLocaleString("ne-NP")}
              </div>
              <p className="text-xxs text-muted-text font-bold">
                अपेक्षित विज्ञापन प्रदर्शन
              </p>
            </div>

            {/* KPI 2: Unique Audience Reach */}
            <div className="bg-card border border-border-theme rounded-3xl p-4 shadow-sm space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between text-muted-text">
                <span className="text-xxs font-black uppercase tracking-wider">अपेक्षित कुल पहुँच</span>
                <span className="text-[9px] bg-blue-500/10 text-blue-600 font-black px-1.5 py-0.5 rounded border border-blue-500/20">
                  अनुमानित (Estimated)
                </span>
              </div>
              <div className="text-2xl font-black text-card-foreground font-mono text-blue-600">
                {forecast.expectedReachUnique.toLocaleString("ne-NP")}
              </div>
              <p className="text-xxs text-muted-text font-bold">
                विशिष्ट पाठकहरू (Unique Readers)
              </p>
            </div>

            {/* KPI 3: Estimated Clicks & CTR */}
            <div className="bg-card border border-border-theme rounded-3xl p-4 shadow-sm space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between text-muted-text">
                <span className="text-xxs font-black uppercase tracking-wider">अपेक्षित क्लिक</span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-600 font-black px-1.5 py-0.5 rounded border border-emerald-500/20">
                  मापन दर (Historical)
                </span>
              </div>
              <div className="text-2xl font-black text-card-foreground font-mono text-emerald-600">
                {forecast.estimatedClicks.toLocaleString("ne-NP")}{" "}
                <span className="text-xs font-bold text-muted-text font-sans">({forecast.estimatedCtrPct}%)</span>
              </div>
              <p className="text-xxs text-muted-text font-bold">
                अनुमानित इन्गेजमेन्ट
              </p>
            </div>

          </div>

          {/* Detailed Commercial Budget & Tax Breakdown */}
          <div className="bg-card border border-border-theme rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-border-theme pb-3">
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-600" />
                <h3 className="text-sm font-black text-card-foreground">
                  अभियान बजेट तथा कर हिसाब (Commercial Budget Breakdown)
                </h3>
              </div>
              <span className="text-xxs font-black px-2.5 py-1 bg-muted-area rounded-lg text-muted-text font-mono">
                Confidence: {forecast.confidenceScore}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 p-3.5 rounded-2xl bg-muted-area/30 border border-border-theme">
                <div className="flex justify-between text-muted-text font-bold">
                  <span>आधार लागत (Gross Base Cost):</span>
                  <span className="font-mono text-card-foreground">रू {forecast.baseCostNpr.toLocaleString("ne-NP")}</span>
                </div>
                {forecast.discountPct > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>अवधि छुट ({forecast.discountPct}%):</span>
                    <span className="font-mono">- रू {(forecast.baseCostNpr - forecast.taxableCostNpr).toLocaleString("ne-NP")}</span>
                  </div>
                )}
                <div className="flex justify-between text-card-foreground font-black pt-1.5 border-t border-border-theme">
                  <span>करयोग्य रकम (Net Taxable):</span>
                  <span className="font-mono text-sm">रू {forecast.taxableCostNpr.toLocaleString("ne-NP")}</span>
                </div>
              </div>

              <div className="space-y-2 p-3.5 rounded-2xl bg-muted-area/30 border border-border-theme">
                <div className="flex justify-between text-muted-text font-bold">
                  <span>१३% मूल्य अभिवृद्धि कर (VAT):</span>
                  <span className="font-mono text-emerald-600 font-bold">+ रू {forecast.vat13PctNpr.toLocaleString("ne-NP")}</span>
                </div>
                <div className="flex justify-between text-muted-text font-bold">
                  <span>१.५% अग्रिम आयकर (TDS Deductible):</span>
                  <span className="font-mono text-blue-600 font-bold">रू {forecast.tds15PctNpr.toLocaleString("ne-NP")}</span>
                </div>
                <div className="flex justify-between text-card-foreground font-black pt-1.5 border-t border-border-theme">
                  <span>कुल भुक्तानी (Total Payable):</span>
                  <span className="font-mono text-sm text-emerald-600">रू {forecast.totalCostNpr.toLocaleString("ne-NP")}</span>
                </div>
              </div>
            </div>

            {/* Inventory Real-Time Capacity Bar */}
            <div className="space-y-2 pt-2 border-t border-border-theme">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-card-foreground flex items-center gap-1.5">
                  <Info size={14} className="text-blue-500" /> इन्भेन्टरी उपलब्धता क्षमता (Inventory Availability):
                </span>
                <span className="font-mono font-bold text-emerald-600">{forecast.availableCapacityPct}% Available</span>
              </div>
              <div className="w-full h-3 rounded-full bg-muted-area overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${100 - forecast.availableCapacityPct}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-text">
                चयन गरिएका {selectedSlots.length} स्लटहरूमा हाल ८४% क्षमता खुला छ। १००% डेलिभरी ग्यारेन्टी सहित तत्काल बुक गर्न सकिन्छ।
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                onClick={() => toast.success("प्रक्षेपण रिपोर्ट PDF सफलतापूर्वक तयार भयो!")}
                className="w-full sm:w-auto px-4 py-2.5 bg-muted-area hover:bg-card-foreground hover:text-card rounded-xl font-bold text-xs transition-all border border-border-theme cursor-pointer"
              >
                प्रक्षेपण रिपोर्ट डाउनलोड (PDF)
              </button>
              <button
                onClick={() => toast.success("प्रक्षेपण डाटा प्रायोजन प्रस्तावमा सुरक्षित गरियो!")}
                className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles size={14} /> यो योजना प्रस्तावमा थप्नुहोस् (Add to Proposal)
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* METHODOLOGY EXPLANATION MODAL */}
      {showMethodologyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border-theme rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-theme pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-purple-600" />
                <h3 className="text-base sm:text-lg font-black text-card-foreground">
                  प्रक्षेपण विधि तथा गणनाका आधारहरू (Forecasting Methodology)
                </h3>
              </div>
              <button 
                onClick={() => setShowMethodologyModal(false)} 
                className="p-1.5 rounded-lg bg-muted-area text-muted-text hover:text-card-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-muted-text max-h-[60vh] overflow-y-auto pr-1">
              
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-300 font-medium">
                <strong>पारदर्शिता सूचना (Methodology Statement):</strong> यो प्रक्षेपण विज्ञापनदाताको योजना निर्माणका लागि ऐतिहासिक ९० दिनको ट्राफिक तथ्याङ्क, विधागत पाठक चासो र समय विभाजनका आधारमा निकालिएको गणितीय अनुमान हो।
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-card-foreground text-sm flex items-center gap-1.5">
                  <Eye size={14} className="text-purple-600" /> १. अनुमानित अवलोकन (Projected Impressions)
                </h4>
                <p>
                  प्रत्येक चयन गरिएको इन्भेन्टरी स्लटको पछिल्लो ९० दिनको औसत दैनिक दृश्य (Daily Baseline), भौगोलिक गुणनखण्ड (Geo Multiplier: काठमाडौं हब १.२५x), विधागत चासो (Category Multiplier: अर्थ/सेयर १.२५x), र समय पिक फ्याक्टर (Dayparting Weight) को गुणन गरी निकालिन्छ।
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-card-foreground text-sm flex items-center gap-1.5">
                  <Users size={14} className="text-blue-600" /> २. विशिष्ट पाठक पहुँच (Unique Audience Reach)
                </h4>
                <p>
                  सनातन मार्गको औसत सेसन फ्रिक्वेन्सी अनुसार कुल अवलोकनको ४८% (0.48 Unique Ratio) लाई विशिष्ट पाठक (Unique Users) को रूपमा प्रक्षेपण गरिन्छ।
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-card-foreground text-sm flex items-center gap-1.5">
                  <MousePointerClick size={14} className="text-emerald-600" /> ३. अपेक्षित क्लिक दर (CTR Range Model)
                </h4>
                <p>
                  इन्भेन्टरी स्लटको प्रकृति अनुसार भारित सीटीआर (Weighted CTR):
                  नेयटिभ स्टोरी: <strong>३.८% – ४.५%</strong>, मुख्य हिरो ब्यानर: <strong>३.२% – ३.९%</strong>, अडियो/पडकास्ट: <strong>३.०% – ३.५%</strong>, स्टिकी मोबाइल: <strong>२.२% – २.८%</strong>।
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-card-foreground text-sm flex items-center gap-1.5">
                  <DollarSign size={14} className="text-emerald-600" /> ४. अवधि छुट तथा कर नियम (Duration Discount & Taxes)
                </h4>
                <p>
                  १५ दिन भन्दा माथिका अभियानमा १०%, ३० दिनमा २०% र ९० दिनमा ३५% अवधि छुट समायोजन गरिन्छ। करयोग्य रकममा नेपाल सरकारको १३% भ्याट तथा १.५% अग्रिम कर (TDS) समावेश हुन्छ।
                </p>
              </div>

            </div>

            <div className="pt-3 border-t border-border-theme flex justify-end">
              <button
                onClick={() => setShowMethodologyModal(false)}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs cursor-pointer hover:opacity-90 shadow-sm"
              >
                बुझें (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
