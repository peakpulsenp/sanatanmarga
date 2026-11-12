import { useState } from "react";
import { 
  RATE_CARD_MATRIX, 
  RateCardSlot,
  AD_INVENTORY_REGISTRY 
} from "@/src/constants/revenueInventory";
import { 
  DollarSign, 
  Sliders, 
  Calculator, 
  Tag, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  Percent,
  Download,
  Info
} from "lucide-react";
import { toast } from "sonner";

export default function RateCardEngine() {
  const [rateCards, setRateCards] = useState<RateCardSlot[]>(RATE_CARD_MATRIX);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [editingSlot, setEditingSlot] = useState<RateCardSlot | null>(null);

  // Quick Pricing Simulator State
  const [simSlot, setSimSlot] = useState<string>(RATE_CARD_MATRIX[0].slotId);
  const [simDays, setSimDays] = useState<number>(14);
  const [simCategory, setSimCategory] = useState<string>("general");
  const [simDistrict, setSimDistrict] = useState<string>("nationwide");
  const [simModel, setSimModel] = useState<"time" | "cpm">("time");
  const [simTargetImpressions, setSimTargetImpressions] = useState<number>(100000);

  const filteredSlots = rateCards.filter(
    (s) => selectedGroup === "all" || s.placementGroup === selectedGroup
  );

  // Calculate live simulator pricing
  const currentSimSlot = rateCards.find((r) => r.slotId === simSlot) || rateCards[0];
  
  const calculateSimQuote = () => {
    let basePrice = 0;
    
    if (simModel === "time") {
      basePrice = currentSimSlot.dailyRateNpr * simDays;
    } else {
      basePrice = (simTargetImpressions / 1000) * currentSimSlot.cpmRateNpr;
    }

    // Duration discount
    let discountPct = 0;
    if (simDays >= 90) discountPct = 35;
    else if (simDays >= 30) discountPct = 20;
    else if (simDays >= 15) discountPct = 10;

    // Premium multipliers
    let premiumPct = 0;
    if (simCategory === "economy") premiumPct += currentSimSlot.categoryPremiumPct.economy || 20;
    else if (simCategory === "politics") premiumPct += currentSimSlot.categoryPremiumPct.politics || 15;
    else if (simCategory === "technology") premiumPct += currentSimSlot.categoryPremiumPct.technology || 15;

    if (simDistrict === "kathmandu") premiumPct += currentSimSlot.districtPremiumPct.kathmandu || 25;
    else if (simDistrict === "kaski") premiumPct += currentSimSlot.districtPremiumPct.kaski || 15;

    const netBeforeTax = Math.round(basePrice * (1 - discountPct / 100) * (1 + premiumPct / 100));
    const vat13 = Math.round(netBeforeTax * 0.13);
    const tds15 = Math.round(netBeforeTax * 0.015);
    const totalWithVat = netBeforeTax + vat13;

    return {
      basePrice,
      discountPct,
      premiumPct,
      netBeforeTax,
      vat13,
      tds15,
      totalWithVat
    };
  };

  const quote = calculateSimQuote();

  const handleUpdateRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    setRateCards((prev) =>
      prev.map((item) => (item.slotId === editingSlot.slotId ? editingSlot : item))
    );
    toast.success(`'${editingSlot.nameNe}' को दर सूची सफलतापूर्वक अद्यावधिक भयो!`);
    setEditingSlot(null);
  };

  return (
    <div className="space-y-8">
      {/* Rate Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted-area/40 border border-border-theme p-5 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xxs font-black uppercase tracking-wider border border-blue-500/20">
              Commercial Rate Card Matrix
            </span>
            <span className="text-xxs font-bold text-muted-text">
              • १५-स्थान इन्भेन्टरी मूल्य तालिका (FY 2083/84)
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-black text-card-foreground">
            प्रकाशक विज्ञापन दर कार्ड इन्जिन (Official Publisher Rate Card)
          </h2>
          <p className="text-xs text-muted-text max-w-2xl">
            प्रत्येक इन्भेन्टरी स्लटको आधार दैनिक दर, साप्ताहिक/मासिक छुट, CPM दर तथा विधा/जिल्ला प्रिमियम निर्धारण।
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => toast.success("आधिकारिक दर सूची PDF डाउनलोड भयो!")}
            className="px-4 py-2 bg-card hover:bg-muted-area text-card-foreground border border-border-theme text-xs font-black rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Download size={14} /> दर सूची डाउनलोड (PDF)
          </button>
        </div>
      </div>

      {/* Group Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "all", label: "सबै इन्भेन्टरी (All 15 Slots)" },
          { id: "homepage", label: "गृह पृष्ठ (Homepage Slots)" },
          { id: "category", label: "विधागत (Category Slots)" },
          { id: "district", label: "जिल्ला हब (District Slots)" },
          { id: "article", label: "आलेख भित्र (Article In-Feed)" },
          { id: "listenos", label: "ListenOS अडियो (Audio Slots)" }
        ].map((grp) => (
          <button
            key={grp.id}
            onClick={() => setSelectedGroup(grp.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              selectedGroup === grp.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted-area/60 text-muted-text hover:text-card-foreground"
            }`}
          >
            {grp.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Rate Table (Left 2 cols) & Live Quote Calculator (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table of Rate Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border-theme rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted-area/50 text-muted-text font-black uppercase text-xxs tracking-wider border-b border-border-theme">
                  <tr>
                    <th className="p-4">इन्भेन्टरी स्थान (Slot Name)</th>
                    <th className="p-4">दैनिक दर (Daily NPR)</th>
                    <th className="p-4">मासिक दर (Monthly NPR)</th>
                    <th className="p-4">CPM दर</th>
                    <th className="p-4">न्यूनतम दिन</th>
                    <th className="p-4 text-right">कार्य</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-theme">
                  {filteredSlots.map((slot) => {
                    const inv = AD_INVENTORY_REGISTRY.find((i) => i.key === slot.key);
                    return (
                      <tr key={slot.slotId} className="hover:bg-muted-area/20 transition-colors">
                        <td className="p-4 space-y-0.5">
                          <div className="font-black text-card-foreground flex items-center gap-1.5">
                            <span>{slot.nameNe}</span>
                            {inv?.tier === "hero" && (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-600 font-bold px-1.5 py-0.2 rounded border border-emerald-500/20">
                                100% SOV
                              </span>
                            )}
                          </div>
                          <div className="text-xxs font-mono text-muted-text">{slot.nameEn} • {inv?.tier?.toUpperCase()}</div>
                        </td>
                        <td className="p-4 font-mono font-black text-card-foreground">
                          रू {slot.dailyRateNpr.toLocaleString("ne-NP")}
                        </td>
                        <td className="p-4 font-mono font-black text-emerald-600">
                          रू {slot.monthlyRateNpr.toLocaleString("ne-NP")}
                        </td>
                        <td className="p-4 font-mono text-muted-text font-bold">
                          रू {slot.cpmRateNpr} / 1k
                        </td>
                        <td className="p-4 text-muted-text font-bold">
                          {slot.minDurationDays} दिन
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setEditingSlot(slot)}
                            className="px-2.5 py-1 bg-muted-area hover:bg-card-foreground hover:text-card rounded-lg text-xxs font-black transition-all cursor-pointer"
                          >
                            सम्पादन
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Policy Insights */}
          <div className="p-4 rounded-2xl bg-muted-area/30 border border-border-theme grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-black text-card-foreground flex items-center gap-1">
                <Percent size={14} className="text-emerald-600" /> अवधि छुट संरचना (Duration Discounts)
              </span>
              <p className="text-muted-text text-[11px]">
                १५ दिन: १०% छुट | ३० दिन: २०% छुट | ९० दिन+: ३५% दीर्घकालीन छुट
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-black text-card-foreground flex items-center gap-1">
                <TrendingUp size={14} className="text-blue-600" /> विधा प्रिमियम (Category Premiums)
              </span>
              <p className="text-muted-text text-[11px]">
                अर्थ/NEPSE: +२५% | राजनीति: +२०% | प्रविधि: +१५%
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-black text-card-foreground flex items-center gap-1">
                <Layers size={14} className="text-purple-600" /> जिल्ला प्रिमियम (Metro Premiums)
              </span>
              <p className="text-muted-text text-[11px]">
                काठमाडौँ उपत्यका: +२५% | कास्की (पोखरा): +१५%
              </p>
            </div>
          </div>
        </div>

        {/* Live Instant Rate Calculator */}
        <div className="bg-card border border-border-theme rounded-3xl p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-border-theme pb-3">
            <Calculator className="text-emerald-600" size={18} />
            <div>
              <h3 className="text-sm font-black text-card-foreground">
                प्रत्यक्ष दर सिम्युलेटर (Instant Rate Simulator)
              </h3>
              <p className="text-xxs text-muted-text">अभियान बजेट तथा कर (VAT/TDS) तत्काल हिसाब गर्नुहोस्</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {/* Slot selection */}
            <div className="space-y-1">
              <label className="font-bold text-card-foreground block">इन्भेन्टरी स्लट चयन:</label>
              <select
                value={simSlot}
                onChange={(e) => setSimSlot(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted-area/50 border border-border-theme text-card-foreground text-xs focus:outline-none cursor-pointer"
              >
                {rateCards.map((s) => (
                  <option key={s.slotId} value={s.slotId}>
                    {s.nameNe} (रू {s.dailyRateNpr}/दिन)
                  </option>
                ))}
              </select>
            </div>

            {/* Model Type */}
            <div className="space-y-1">
              <label className="font-bold text-card-foreground block">खरिद ढाँचा (Pricing Model):</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSimModel("time")}
                  className={`py-1.5 rounded-xl font-black text-xxs cursor-pointer border ${
                    simModel === "time"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted-area text-muted-text border-transparent"
                  }`}
                >
                  दिन आधारित (Time / Flat)
                </button>
                <button
                  type="button"
                  onClick={() => setSimModel("cpm")}
                  className={`py-1.5 rounded-xl font-black text-xxs cursor-pointer border ${
                    simModel === "cpm"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted-area text-muted-text border-transparent"
                  }`}
                >
                  CPM आधारित (Impressions)
                </button>
              </div>
            </div>

            {/* Duration or Impressions */}
            {simModel === "time" ? (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="font-bold text-card-foreground">अभियान अवधि (दिन):</label>
                  <span className="font-mono font-bold text-primary">{simDays} दिन</span>
                </div>
                <input
                  type="range"
                  min={currentSimSlot.minDurationDays || 3}
                  max={90}
                  step={1}
                  value={simDays}
                  onChange={(e) => setSimDays(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="font-bold text-card-foreground block">लक्षित इम्प्रेशन (Views):</label>
                <select
                  value={simTargetImpressions}
                  onChange={(e) => setSimTargetImpressions(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-card-foreground text-xs focus:outline-none"
                >
                  <option value={50000}>५०,००० Views</option>
                  <option value={100000}>१,००,००० Views</option>
                  <option value={250000}>२,५०,००० Views</option>
                  <option value={500000}>५,००,००० Views</option>
                  <option value={1000000}>१०,००,००० Views</option>
                </select>
              </div>
            )}

            {/* Geo and Category Targeting */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-card-foreground block">लक्षित विधा:</label>
                <select
                  value={simCategory}
                  onChange={(e) => setSimCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground text-xs focus:outline-none"
                >
                  <option value="general">सामान्य (Standard)</option>
                  <option value="economy">अर्थ तथा सेयर (+२५%)</option>
                  <option value="politics">राजनीति (+२०%)</option>
                  <option value="technology">प्रविधि (+१५%)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-card-foreground block">लक्षित क्षेत्र:</label>
                <select
                  value={simDistrict}
                  onChange={(e) => setSimDistrict(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground text-xs focus:outline-none"
                >
                  <option value="nationwide">देशभर (Nationwide)</option>
                  <option value="kathmandu">काठमाडौँ (+२५%)</option>
                  <option value="kaski">पोखरा/कास्की (+१५%)</option>
                </select>
              </div>
            </div>

            {/* Quotation Breakdown Box */}
            <div className="p-4 rounded-2xl bg-muted-area/50 border border-border-theme space-y-2 mt-4">
              <div className="flex justify-between text-muted-text">
                <span>आधार दर (Base Value):</span>
                <span className="font-mono font-bold">रू {quote.basePrice.toLocaleString("ne-NP")}</span>
              </div>
              {quote.discountPct > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>अवधि छुट ({quote.discountPct}%):</span>
                  <span className="font-mono">- रू {Math.round(quote.basePrice * (quote.discountPct / 100)).toLocaleString("ne-NP")}</span>
                </div>
              )}
              {quote.premiumPct > 0 && (
                <div className="flex justify-between text-amber-600 font-bold">
                  <span>विधा/जिल्ला प्रिमियम (+{quote.premiumPct}%):</span>
                  <span className="font-mono">+ रू {Math.round(quote.basePrice * (quote.premiumPct / 100)).toLocaleString("ne-NP")}</span>
                </div>
              )}
              <div className="flex justify-between text-card-foreground font-black pt-2 border-t border-border-theme">
                <span>करयोग्य रकम (Taxable):</span>
                <span className="font-mono">रू {quote.netBeforeTax.toLocaleString("ne-NP")}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-text font-bold">
                <span>१३% मूल्य अभिवृद्धि कर (VAT):</span>
                <span className="font-mono text-emerald-600">+ रू {quote.vat13.toLocaleString("ne-NP")}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-text font-bold">
                <span>१.५% अग्रिम कट्टी (TDS):</span>
                <span className="font-mono text-blue-600">रू {quote.tds15.toLocaleString("ne-NP")}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-emerald-600 pt-2 border-t border-border-theme">
                <span>कुल भुक्तानी (Total NPR):</span>
                <span className="font-mono text-base">रू {quote.totalWithVat.toLocaleString("ne-NP")}</span>
              </div>
            </div>

            <button
              onClick={() => toast.success("सिम्युलेटेड दर कोटेशन सुरक्षित गरियो र क्लिपबोर्डमा प्रतिलिपि भयो!")}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles size={14} /> आधिकारिक कोटेशन प्रतिलिपि गर्नुहोस्
            </button>
          </div>
        </div>

      </div>

      {/* EDIT RATE MODAL */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border-theme rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-theme pb-3">
              <h3 className="text-sm font-black text-card-foreground">
                दर सूची सम्पादन ({editingSlot.nameNe})
              </h3>
              <button
                onClick={() => setEditingSlot(null)}
                className="p-1 text-muted-text hover:text-card-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateRate} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-card-foreground">दैनिक दर (Daily NPR):</label>
                <input
                  type="number"
                  value={editingSlot.dailyRateNpr}
                  onChange={(e) =>
                    setEditingSlot({ ...editingSlot, dailyRateNpr: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-muted-area border border-border-theme font-mono text-card-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-card-foreground">मासिक दर (Monthly Flat NPR):</label>
                <input
                  type="number"
                  value={editingSlot.monthlyRateNpr}
                  onChange={(e) =>
                    setEditingSlot({ ...editingSlot, monthlyRateNpr: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-muted-area border border-border-theme font-mono text-card-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-card-foreground">CPM दर (प्रति १००० अवलोकन):</label>
                <input
                  type="number"
                  value={editingSlot.cpmRateNpr}
                  onChange={(e) =>
                    setEditingSlot({ ...editingSlot, cpmRateNpr: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-muted-area border border-border-theme font-mono text-card-foreground focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-theme">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 rounded-xl bg-muted-area text-muted-text font-bold cursor-pointer"
                >
                  रद्द
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  दर सुरक्षित गर्नुहोस्
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
