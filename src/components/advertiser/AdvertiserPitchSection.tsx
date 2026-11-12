import { useState } from "react";
import { 
  ShieldCheck, Target, Layers, TrendingUp, Sparkles, MapPin, 
  Tv, Radio, BookOpen, ShoppingBag, CheckCircle2, ArrowRight, 
  HelpCircle, Calculator, Send, FileText, Award, Users, Globe, ChevronRight, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ADVERTISING_PRODUCTS, 
  MARKET_POSITIONING_MATRIX, 
  calculateCampaignEstimate,
  AdProduct 
} from "@/src/services/revenueOSContextEngine";
import { NEPAL_PROVINCES } from "@/src/services/adEngine";
import { db } from "@/src/lib/firebase";
import { collection, addDoc } from "@/src/lib/firebase";
import { offlineQueue } from "@/src/lib/offlineQueue";

interface AdvertiserPitchSectionProps {
  onGoToCampaignManager?: () => void;
}

export default function AdvertiserPitchSection({ onGoToCampaignManager }: AdvertiserPitchSectionProps) {
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>("Precision Display");
  const [activeMockupProduct, setActiveMockupProduct] = useState<AdProduct>(ADVERTISING_PRODUCTS[0]);

  // Campaign Estimator & Inquiry Form State
  const [budgetNpr, setBudgetNpr] = useState<number>(25000);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  
  // Inquiry Form Inputs
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const estimate = calculateCampaignEstimate({
    budgetNpr,
    productCategory: selectedProductCategory,
    durationDays,
    targetProvince: selectedProvince,
  });

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !email) return;

    setIsSubmitting(true);
    const inquiryData = {
      companyName,
      contactName,
      email,
      phone,
      notes,
      productCategory: selectedProductCategory,
      estimatedBudgetNpr: budgetNpr,
      durationDays,
      targetProvince: selectedProvince,
      createdAt: new Date().toISOString(),
      status: "pending_review",
    };

    try {
      await addDoc(collection(db, "advertiser_inquiries"), inquiryData);
      setSubmitSuccess(true);
    } catch (err) {
      console.warn("Firestore inquiry offline fallback:", err);
      offlineQueue.queueAction({
        type: "AD_CREATE",
        collection: "advertiser_inquiries",
        data: inquiryData,
      });
      setSubmitSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 py-4">
      {/* 1. HERO & MARKET POSITIONING BANNER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-8 md:p-12 text-white shadow-2xl border border-emerald-500/20">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
            <Sparkles className="h-4 w-4" />
            <span>NEPAL'S CIVILIZATIONAL KNOWLEDGE & MEDIA NETWORK</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-slate-100">
            Reach High-Intent Audiences on Nepal's Most Trusted Knowledge Infrastructure
          </h1>

          <p className="text-base md:text-xl text-slate-300 font-normal leading-relaxed">
            SanatanMarga connects brands, institutions, and cultural patrons to an authentic, educated global Nepali audience across <strong className="text-emerald-300 font-semibold">Knowledge OS, Timeline OS, Archives OS, SGIS Geographic Hub, Live Media, and Ecosystem Commerce</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => {
                const el = document.getElementById("partnership-inquiry");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Partner With Us</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {onGoToCampaignManager && (
              <button
                onClick={onGoToCampaignManager}
                className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-all cursor-pointer flex items-center gap-2"
              >
                <Layers className="h-4 w-4 text-emerald-400" />
                <span>Launch Self-Serve Campaign</span>
              </button>
            )}
          </div>

          {/* Key Evidence Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-slate-800/80">
            <div className="space-y-1">
              <div className="text-2xl font-extrabold text-emerald-400">100%</div>
              <div className="text-xs text-slate-400 font-medium">Brand-Safe Environment</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-extrabold text-sky-400">77 Districts</div>
              <div className="text-xs text-slate-400 font-medium">SGIS Geo-Targeting</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-extrabold text-amber-400">Zero</div>
              <div className="text-xs text-slate-400 font-medium">Clickbait & Fake Impressions</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-extrabold text-teal-400">Verified</div>
              <div className="text-xs text-slate-400 font-medium">RevenueOS Analytics</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHY SANATANMARGA - VALUE PROPOSITION */}
      <section className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Why Partner with SanatanMarga Network?
          </h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
            Built for brand-safe, contextual engagement that respects user trust and delivers measurable ROI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">100% Brand Safety</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Your ads appear alongside verified, curated knowledge, historical archives, and cultural news—never next to sensationalist clickbait.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 w-fit">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">High-Intent Audience</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Reach educated professionals, scholars, cultural enthusiasts, local leaders, and the global Nepali diaspora seeking authentic depth.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">SGIS Geo-Precision</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Target campaigns by specific Province or District (Kathmandu, Pokhara, Jhapa, Mustang) without wasting budget outside target boundaries.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Audited RevenueOS</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Real-time delivery logs, verified CTR analytics, pacing calculators, and downloadable reconciliation statements.
            </p>
          </div>
        </div>
      </section>

      {/* 3. ADVERTISING PRODUCTS SHOWCASE (#9) */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="text-xs font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">Commercial Product Catalog</div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
              5 Core Advertising & Sponsorship Products
            </h2>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {ADVERTISING_PRODUCTS.map((prod) => (
              <button
                key={prod.id}
                onClick={() => {
                  setSelectedProductCategory(prod.category);
                  setActiveMockupProduct(prod);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedProductCategory === prod.category
                    ? "bg-emerald-600 text-white shadow-md"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {prod.category}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Product Detail Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase">
              Inventory Source: {activeMockupProduct.inventorySource}
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {activeMockupProduct.titleEn}
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                {activeMockupProduct.titleNe}
              </p>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeMockupProduct.descriptionEn}
            </p>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Placements</h4>
              <div className="flex flex-wrap gap-2">
                {activeMockupProduct.placements.map((plc, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
                    {plc}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Product Highlights</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeMockupProduct.keyBenefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Starting Rate: </span>
                <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                  NPR {activeMockupProduct.baseRateNpr.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-medium"> ({activeMockupProduct.rateUnit})</span>
              </div>

              <button
                onClick={() => {
                  const el = document.getElementById("partnership-inquiry");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Request Format</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Format Mockup Preview */}
          <div className="lg:col-span-5 bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-slate-400 ml-2">Format Mockup Preview</span>
              </div>
              <span className="text-xs font-mono text-emerald-400">SanatanMarga Network</span>
            </div>

            {/* Simulated Canvas */}
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-4 min-h-[300px] flex flex-col justify-center">
              {activeMockupProduct.mockupFormat === "banner" && (
                <div className="space-y-3">
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-900/40 to-slate-900 border border-emerald-500/40 space-y-2 text-center">
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Sponsored Headline Display</div>
                    <div className="text-sm font-semibold text-white">Your Brand Message Here — High Impact Billboard</div>
                    <div className="inline-block px-3 py-1 rounded bg-emerald-500 text-slate-950 text-xs font-bold">Visit Partner Website</div>
                  </div>
                  <div className="h-3 bg-slate-800/60 rounded w-full" />
                  <div className="h-3 bg-slate-800/60 rounded w-5/6" />
                </div>
              )}

              {activeMockupProduct.mockupFormat === "knowledge_card" && (
                <div className="p-4 rounded-xl bg-slate-800 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">KNOWLEDGE PATRON SPONSOR</span>
                    <span className="text-[10px] text-slate-400">Knowledge OS Node #482</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                      SM
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Pashupatinath Sacred Complex</div>
                      <div className="text-xs text-slate-400">Presented by [Your Heritage Brand / Bank]</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-300 leading-snug">
                    "Supporting the digital archiving and preservation of Nepal's ancient manuscript lineage."
                  </div>
                </div>
              )}

              {activeMockupProduct.mockupFormat === "live_banner" && (
                <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video border border-slate-800 flex flex-col justify-between p-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold animate-pulse">● LIVE BROADCAST</span>
                    <span className="text-[10px] text-slate-400 font-mono">Nepal Hub Stream</span>
                  </div>
                  {/* Lower Third */}
                  <div className="p-2.5 rounded-lg bg-slate-900/90 backdrop-blur border border-emerald-500/40 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-emerald-400 font-bold uppercase">PRESENTING SPONSOR</div>
                      <div className="text-xs font-bold text-white">Your Official Live Stream Logo</div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">SANATANMARGA LIVE</span>
                  </div>
                </div>
              )}

              {activeMockupProduct.mockupFormat === "store_spotlight" && (
                <div className="p-4 rounded-xl bg-slate-800/90 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">STORE VERIFIED PRODUCT</span>
                    <span className="text-[10px] text-slate-400">Sanatan Store</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="h-14 w-14 rounded-lg bg-slate-700 flex items-center justify-center text-amber-400 font-bold text-xs">
                      PROD
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white">Handcrafted Temple Bell (Authentic Patan Bronze)</div>
                      <div className="text-xs font-bold text-emerald-400">NPR 4,500 <span className="text-[10px] text-slate-400 line-through">NPR 5,200</span></div>
                      <div className="text-[10px] text-slate-400">Directly from Certified Artisan Guild</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="text-center text-[11px] text-slate-500 font-mono">
              Live Responsive Preview Rendering for {activeMockupProduct.category}
            </div>
          </div>
        </div>
      </section>

      {/* 4. MARKET POSITIONING MATRIX (#12) */}
      <section className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="text-xs font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">Strategic Category Positioning</div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Explicit Market Differentiation
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            How SanatanMarga's Knowledge & Media Infrastructure outperforms traditional news portals and generic social ad networks.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase">
                <th className="p-4">Dimension</th>
                <th className="p-4 text-slate-400">Traditional News Portals</th>
                <th className="p-4 text-slate-400">Social Ad Networks</th>
                <th className="p-4 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">SanatanMarga Network</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {MARKET_POSITIONING_MATRIX.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{row.dimension}</td>
                  <td className="p-4 text-slate-500">{row.traditionalNewsPortals}</td>
                  <td className="p-4 text-slate-500">{row.socialNetworks}</td>
                  <td className="p-4 font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/5">
                    {row.sanatanMargaNetwork}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. CAMPAIGN ESTIMATOR & PARTNERSHIP INQUIRY CTA (#10) */}
      <section id="partnership-inquiry" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
        {/* Estimator Calculator */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-emerald-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Evidence-Based Campaign Estimator
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                <span>Monthly Budget (NPR)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">NPR {budgetNpr.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min={5000}
                max={500000}
                step={5000}
                value={budgetNpr}
                onChange={(e) => setBudgetNpr(Number(e.target.value))}
                className="w-full mt-2 accent-emerald-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Target Product Category</label>
              <select
                value={selectedProductCategory}
                onChange={(e) => setSelectedProductCategory(e.target.value)}
                className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {ADVERTISING_PRODUCTS.map((p) => (
                  <option key={p.id} value={p.category}>
                    {p.category} — ({p.pricingModel} @ NPR {p.baseRateNpr})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Target Geographic Province</label>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Nepal & Global Diaspora</option>
                {Object.entries(NEPAL_PROVINCES).map(([key, prov]) => (
                  <option key={key} value={key}>
                    {prov.nameEn} ({prov.nameNe})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Calculated Output Box */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 font-mono text-xs">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">
              Audited Delivery Estimate
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Est. Impressions:</span>
              <span className="text-emerald-400 font-bold text-sm">{estimate.estImpressions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Est. Clicks (CTR):</span>
              <span className="text-sky-400 font-bold text-sm">{estimate.estClicks} ({estimate.avgCtr})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Est. Unique Reach:</span>
              <span className="text-amber-400 font-bold text-sm">{estimate.estReach}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-800 pt-2">
              <span className="text-slate-400">Daily Pacing:</span>
              <span className="text-slate-200">NPR {estimate.dailyPacingNpr.toLocaleString()} / day</span>
            </div>
          </div>
        </div>

        {/* Partnership Inquiry Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Direct Concierge Inquiry</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Submit Partnership Inquiry
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Our advertising team will contact you within 24 hours with custom media kits and placement availability.
            </p>
          </div>

          {submitSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 space-y-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <div className="font-bold text-base">Inquiry Submitted Successfully!</div>
              <p className="text-xs">
                Thank you for reaching out to SanatanMarga Commercial Partnerships. Our team has received your request for <strong>{selectedProductCategory}</strong> and will get back to you shortly.
              </p>
              <button
                onClick={() => setSubmitSuccess(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
              >
                Submit Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleInquirySubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Company / Organization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nepal Heritage Bank"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full mt-1.5 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="Your Full Name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full mt-1.5 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Official Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1.5 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Phone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+977 98XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full mt-1.5 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Campaign Objectives & Special Requirements</label>
                <textarea
                  rows={3}
                  placeholder="Describe your target audience, launch timelines, or specific placement preferences..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                <span>{isSubmitting ? "Submitting Inquiry..." : "Submit Partnership Inquiry"}</span>
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
