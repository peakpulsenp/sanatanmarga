import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import SEOHead from "@/src/components/common/SEOHead";
import {
  Sparkles,
  BookOpen,
  ShieldCheck,
  Clock,
  ArrowRight,
  Database,
  Search,
  CheckCircle2,
  ExternalLink,
  Loader2,
  FileText
} from "lucide-react";
import { useLanguage } from "@/src/context/LanguageContext";

interface GroundedCitation {
  id: string;
  title: string;
  sourceType: string;
  reference: string;
  url: string;
  verified: boolean;
}

interface GroundedResearchResult {
  success: boolean;
  query: string;
  domain: string;
  answer: string;
  citations: GroundedCitation[];
  confidenceScore: number;
  groundedInCorpus: boolean;
  zeroHallucinationGuard: string;
  timestamp: string;
}

const SAMPLE_QUERIES = [
  { label: "चाँगुनारायण मानदेव अभिलेख (464 CE)", query: "चाँगुनारायण मानदेव अभिलेख र लिच्छवि इतिहास", domain: "sgis" },
  { label: "पशुपतिनाथ र पाशुपत दर्शन", query: "पशुपतिनाथ र पाशुपत दर्शनको ऐतिहासिक प्रमाण", domain: "knowledge" },
  { label: "ऋत र धर्मको वैदिक अवधारणा", query: "ऋग्वेद र उपनिषद्मा ऋत र धर्मको अवधारणा", domain: "scriptures" },
  { label: "सुश्रुत संहिता ताडपत्र (878 CE)", query: "सुश्रुत संहिता ताडपत्र पाण्डुलिपि र आयुर्वेद", domain: "sgis" },
];

/**
 * SANATANMARGA 5.0 — ASK SANATAN (PHASE 9 GROUNDED RESEARCH CONSOLE)
 * Invariant: Feature Control OFF by default in canonical nav; interactive Grounded Research Console
 * operates against verified primary corpus with zero-hallucination citation enforcement.
 */
export default function AskSanatanPage() {
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<"all" | "knowledge" | "sgis" | "scriptures" | "news">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GroundedResearchResult | null>(null);

  const handleSearch = async (overrideQuery?: string, overrideDomain?: string) => {
    const activeQuery = (overrideQuery ?? query).trim();
    const activeDomain = overrideDomain ?? domain;
    if (!activeQuery) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ask-sanatan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: activeQuery,
          domain: activeDomain,
          previewResearchMode: true,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || "अनुसन्धान अनुरोध असफल भयो (Research query failed).");
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err?.message || "नेटवर्क त्रुटि (Network error while contacting research engine).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEOHead
        title="सोध्नुहोस् सनातन (Ask Sanatan AI) — प्रामाणिक अनुसन्धान कन्सोल"
        description="सनातन एआई अनुसन्धान सहायक (Ask Sanatan AI) — सरस्वती ज्ञानकोष र SGIS पाण्डुलिपि अभिलेखमा आधारित शून्य-भ्रम अनुसन्धान प्रणाली।"
        url="/ask-sanatan"
      />
      <Header />

      <main className="flex-grow container-custom max-w-5xl py-10 md:py-16 px-4 space-y-8">
        {/* Hero & Governance Banner */}
        <div className="bg-card border border-border-theme rounded-3xl p-8 md:p-10 text-center shadow-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>चरण ९ सम्पन्न • पूर्ण प्रामाणिक अनुसन्धान प्रणाली (Phase 9 Complete — Active & Operational)</span>
          </div>

          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
            <Sparkles size={32} />
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              सोध्नुहोस् सनातन एआई (Ask Sanatan)
            </h1>
            <p className="text-muted-text text-sm md:text-base leading-relaxed">
              सनातन ज्ञानकोष (Saraswati Knowledge OS), प्राचीन पाण्डुलिपि अभिलेखालय (SGIS), र वैदिक वाङ्मयमा आधारित शून्य-भ्रम (Zero-Hallucination) अनुसन्धान सहायक। प्रत्येक उत्तर प्राथमिक शिलालेख र प्रमाणित ग्रन्थमा आधारित छ।
            </p>
          </div>

          {/* Interactive Research Search Bar */}
          <div className="max-w-3xl mx-auto pt-2 space-y-4 text-left">
            <div className="flex flex-wrap items-center gap-2 justify-center">
              {[
                { id: "all", label: "सबै क्षेत्र (All Corpus)" },
                { id: "knowledge", label: "ज्ञानकोष (Knowledge OS)" },
                { id: "sgis", label: "अभिलेख / पाण्डुलिपि (SGIS)" },
                { id: "scriptures", label: "वैदिक ग्रन्थ (Scriptures)" },
                { id: "news", label: "सम्पादकीय संहिता (Editorial)" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDomain(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${domain === tab.id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-muted-area/60 text-muted-text border-border-theme hover:text-foreground"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-grow">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    language === "en"
                      ? "Ask about Licchavi epigraphy, Vedic philosophy, Susruta manuscripts..."
                      : "लिच्छवि शिलालेख, पाशुपत दर्शन, सुश्रुत पाण्डुलिपि वा वैदिक ग्रन्थबारे सोध्नुहोस्..."
                  }
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-background border border-border-theme text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>अनुसन्धान गर्नुहोस् (Research)</span>
              </button>
            </form>

            {/* Sample Query Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-muted-text">उदाहरण प्रश्नहरू:</span>
              {SAMPLE_QUERIES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(sample.query);
                    setDomain(sample.domain as any);
                    handleSearch(sample.query, sample.domain);
                  }}
                  className="text-xs px-3 py-1 rounded-lg bg-muted-area/70 hover:bg-muted-area border border-border-theme text-foreground transition-colors"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-left">
              {error}
            </div>
          )}

          {/* Grounded Research Result Display */}
          {result && (
            <div className="max-w-3xl mx-auto mt-6 p-6 md:p-8 rounded-2xl bg-background/90 border border-emerald-500/30 text-left space-y-6 shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-theme pb-4">
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 size={16} />
                  <span>प्रामाणिक स्रोतमा आधारित (Grounded in Verified Corpus • {Math.round(result.confidenceScore * 100)}% Match)</span>
                </div>
                <span className="text-xs text-muted-text font-mono">
                  Guard: {result.zeroHallucinationGuard}
                </span>
              </div>

              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none whitespace-pre-line text-foreground leading-relaxed">
                {result.answer}
              </div>

              {/* Verified Primary Citations */}
              <div className="space-y-3 pt-4 border-t border-border-theme">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-2">
                  <FileText size={14} className="text-primary" />
                  <span>प्रामाणिक स्रोत तथा सन्दर्भहरू (Verified Primary Citations)</span>
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {result.citations.map((cit) => (
                    <div
                      key={cit.id}
                      className="p-3.5 rounded-xl bg-muted-area/50 border border-border-theme flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-foreground flex items-center gap-2">
                          <span>{cit.title}</span>
                          {cit.verified && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              VERIFIED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-text font-mono">{cit.reference}</p>
                      </div>
                      <Link
                        to={cit.url}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>हेर्नुहोस्</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Architecture Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left">
            <div className="p-5 rounded-2xl bg-muted-area/50 border border-border-theme space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Database size={16} />
                <span>प्रामाणिक ज्ञानकोष</span>
              </div>
              <p className="text-xs text-muted-text">
                मनगढन्ते जवाफहरू निषेध। केवल प्रमाणित वैदिक ग्रन्थ र इतिहासमा आधारित।
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-muted-area/50 border border-border-theme space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <BookOpen size={16} />
                <span>अभिलेख तथा पाण्डुलिपि</span>
              </div>
              <p className="text-xs text-muted-text">
                नेपालका दुर्लभ हस्तलिखित ग्रन्थ तथा सरकारी प्रमाणहरूसँग सोझो लिङ्क।
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-muted-area/50 border border-border-theme space-y-2">
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                <ShieldCheck size={16} />
                <span>शून्य-भ्रम ग्यारेन्टी</span>
              </div>
              <p className="text-xs text-muted-text">
                सम्पादकीय समीक्षा तथा विद्वत् परिषद् द्वारा प्रमाणीकृत एआई अनुसन्धान पाइपलाइन।
              </p>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/knowledge"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
            >
              <BookOpen size={16} />
              <span>ज्ञानकोष अन्वेषण गर्नुहोस् (Explore Knowledge)</span>
            </Link>
            <Link
              to="/archives"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-muted-area hover:bg-muted-area/80 border border-border-theme font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <span>अभिलेखालय हेर्नुहोस्</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
