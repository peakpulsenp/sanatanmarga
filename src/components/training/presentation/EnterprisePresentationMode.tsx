import React, { useState, useEffect } from "react";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Radio, 
  Cpu, 
  Scroll, 
  Users, 
  Building2, 
  GraduationCap, 
  TrendingUp,
  Volume2
} from "lucide-react";

interface PresentationSlide {
  id: string;
  tag: string;
  title: string;
  titleNepali: string;
  subtitle: string;
  metrics: { label: string; value: string }[];
  bulletPoints: string[];
  visualType: "pillars" | "newsroom_gate" | "sgis_pipeline" | "radio_resilience" | "governance_audit" | "growth_impact";
  targetAudienceHighlight: string;
}

const SLIDES: PresentationSlide[] = [
  {
    id: "s1",
    tag: "CIVILIZATIONAL PLATFORM",
    title: "SanatanMarga: The Autonomous Civilizational OS",
    titleNepali: "सनातनमार्ग: डिजिटल सभ्यतागत प्रणाली",
    subtitle: "Uniting Media, Epigraphic Knowledge, Shastric Academy, and Resilient Governance.",
    targetAudienceHighlight: "For Sovereign Governments, Academic Consortia, and Global Cultural Guardians.",
    metrics: [
      { label: "Core Operating Systems", value: "6 Engines" },
      { label: "Verified Articles Published", value: "12,450+" },
      { label: "Daily Active Listeners", value: "185,000+" },
      { label: "Blackout Failover Latency", value: "<400ms" }
    ],
    bulletPoints: [
      "Bilingual real-time news grounded strictly with primary evidence ('No Source = No Story').",
      "World-first epigraphic OCR pipeline deciphering 5th-century Licchavi and Brahmi manuscripts.",
      "24/7 non-stop digital radio broadcast with sub-second automated backup switching.",
      "Zero-trust four-eyes cryptographic governance with immutable audit ledgers."
    ],
    visualType: "pillars"
  },
  {
    id: "s2",
    tag: "JOURNALISTIC INTEGRITY",
    title: "AI Newsroom OS: Zero-Hallucination & Fail-Closed Truth",
    titleNepali: "एआई न्यूजरूम: शून्य-भ्रम तथा कडा सत्य निष्ठा",
    subtitle: "Autonomous Google Search Grounding with Strict 72-Hour Temporal Gates.",
    targetAudienceHighlight: "For Press Councils, Media Organizations, and Disinformation Defense Units.",
    metrics: [
      { label: "False Attribution Incidents", value: "0" },
      { label: "Freshness Window Gate", value: "≤72 Hours" },
      { label: "Corroboration Threshold", value: "≥2 Primary Sources" },
      { label: "Average Drafting Latency", value: "35 Seconds" }
    ],
    bulletPoints: [
      "Mandatory dual-source corroboration before drafts reach the editorial desk.",
      "Automated rejection of clickbait, unverified gossip, and recycled historical events.",
      "Native Devanagari generation preserving nuanced Sanskrit cultural terminology.",
      "Dual cryptographic signatures (Editor A + Editor B) required for publication."
    ],
    visualType: "newsroom_gate"
  },
  {
    id: "s3",
    tag: "DIGITAL HERITAGE",
    title: "SGIS: Preserving Himalayan Epigraphy & Manuscripts",
    titleNepali: "एसजिआइएस: पाण्डुलिपि तथा अभिलेख संरक्षण",
    subtitle: "Multi-Script Neural OCR, RDF Knowledge Graphs, and 'Ask Sanatan' AI Grounding.",
    targetAudienceHighlight: "For Universities, Museums, Archaeology Ministries, and UNESCO Partners.",
    metrics: [
      { label: "Deciphered Inscriptions", value: "2,840+" },
      { label: "OCR Ligature Accuracy", value: "98.4%" },
      { label: "RDF Knowledge Graph Nodes", value: "480,000+" },
      { label: "Scan Resolution Standard", value: "1200+ DPI" }
    ],
    bulletPoints: [
      "Neural segmentation for weathered stone steles, copper plates, and palm-leaf folios.",
      "Decodes Brahmi, Licchavi, and complex Paninian Sanskrit conjuncts automatically.",
      "Triplestore knowledge graph linking deities, monarchs, shrines, and Saka calendar dates.",
      "Grounded RAG architecture powering the conversational 'Ask Sanatan' AI assistant."
    ],
    visualType: "sgis_pipeline"
  },
  {
    id: "s4",
    tag: "BROADCASTING RESILIENCE",
    title: "MediaOS & 24/7 Non-Stop Himalayan Radio",
    titleNepali: "मिडिया प्रणाली तथा २४/७ अविराम रेडियो",
    subtitle: "High-Definition Audio & Temple Relays Engineered for Spotty Infrastructure.",
    targetAudienceHighlight: "For Broadcasters, Telecom Operators, and Cultural Diaspora Networks.",
    metrics: [
      { label: "Stream Uptime Record", value: "99.99%" },
      { label: "Silent Failover Switch", value: "<400ms" },
      { label: "Temple HD Feeds", value: "12 Shrines" },
      { label: "Global Diaspora Reach", value: "42 Countries" }
    ],
    bulletPoints: [
      "Continuous HLS stream management with multi-CDN edge delivery.",
      "Sub-400ms automatic failover prevents broadcast dead air during internet drops.",
      "Live HD video streams from Pashupatinath, Muktinath, and Janakpur Dham.",
      "Persistent non-stop client-side audio player maintains playback across page navigation."
    ],
    visualType: "radio_resilience"
  },
  {
    id: "s5",
    tag: "GOVERNANCE & RESILIENCE",
    title: "SnapshotOS & Four-Eyes Cryptographic Security",
    titleNepali: "स्न्यापसट प्रणाली तथा चार-आँखे सुरक्षा",
    subtitle: "3-Tier Fallback Resilience Guaranteeing 100% Blackout-Proof Availability.",
    targetAudienceHighlight: "For Enterprise Investors, Institutional Regulators, and Security Auditors.",
    metrics: [
      { label: "Resilience Fallback Tiers", value: "3 Tiers" },
      { label: "RBAC Security Levels", value: "L1 to L5" },
      { label: "Audit Ledger Algorithm", value: "SHA-256 HMAC" },
      { label: "Cold Recovery Time", value: "<8 Minutes" }
    ],
    bulletPoints: [
      "Tier 1 (Live Firestore) → Tier 2 (Client IndexedDB) → Tier 3 (Decentralized Static CDN).",
      "No single person—not even system administrators—can unilaterally publish or retract articles.",
      "Every correction notice preserves original text alongside timestamped amendments.",
      "Downloadable cryptographic audit packs verifiable by regulatory press councils."
    ],
    visualType: "governance_audit"
  },
  {
    id: "s6",
    tag: "SCALE & IMPACT",
    title: "Partnership, Commercial Growth, and Cultural Impact",
    titleNepali: "साझेदारी, व्यावसायिक वृद्धि तथा प्रभाव",
    subtitle: "The Premier Global Infrastructure for Himalayan & Sanatan Heritage.",
    targetAudienceHighlight: "For Strategic Investors, Academic Sponsors, and Commercial Partners.",
    metrics: [
      { label: "Monthly Page Impressions", value: "4.2M+" },
      { label: "Academy Course Graduates", value: "18,900+" },
      { label: "Artisan Commerce Revenue", value: "NPR 45M+" },
      { label: "Institutional Partners", value: "28 Entities" }
    ],
    bulletPoints: [
      "Ethical cultural revenue model: No gambling, predatory loans, or clickbait monetization.",
      "Empowers traditional brass metalsmiths and Lokta paper artisans through global commerce.",
      "Accredited shastric certification framework verified via /verify/:certId cryptographic QR.",
      "Turnkey federated deployments available for diaspora cultural centers worldwide."
    ],
    visualType: "growth_impact"
  }
];

interface EnterprisePresentationModeProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnterprisePresentationMode({
  isOpen,
  onClose
}: EnterprisePresentationModeProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [audienceFilter, setAudienceFilter] = useState<string>("All Stakeholders");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowRight" || e.key === "Space") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentSlideIndex]);

  if (!isOpen) return null;

  const currentSlide = SLIDES[currentSlideIndex];

  const nextSlide = () => {
    if (currentSlideIndex < SLIDES.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between overflow-hidden animate-in fade-in duration-300">
      
      {/* Presentation Top Control Bar */}
      <div className="p-4 sm:p-6 bg-slate-900/80 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="text-xs font-mono font-bold uppercase text-primary tracking-widest block">
              SanatanMarga Enterprise Presentation
            </span>
            <span className="text-xs text-slate-400">
              Slide {currentSlideIndex + 1} of {SLIDES.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-300 transition-colors cursor-pointer"
            title="Exit Presentation"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Slide Body */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          
          {/* Header Tag & Audience Callout */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 tracking-wider uppercase">
              {currentSlide.tag}
            </span>
            <span className="text-xs text-amber-400/90 font-mono italic">
              {currentSlide.targetAudienceHighlight}
            </span>
          </div>

          {/* Slide Title */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {currentSlide.title}
            </h1>
            <p className="text-lg sm:text-xl font-bold text-primary">
              {currentSlide.titleNepali}
            </p>
            <p className="text-sm sm:text-base text-slate-300 max-w-4xl leading-relaxed pt-1">
              {currentSlide.subtitle}
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {currentSlide.metrics.map((m, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 shadow-lg"
              >
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-primary font-mono">
                  {m.value}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          {/* Bullet Points Stack */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4 shadow-xl">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
              Architectural Highlights & Proven Capacities
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentSlide.bulletPoints.map((bp, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/60 flex items-start gap-3 text-xs sm:text-sm text-slate-200"
                >
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    0{idx + 1}
                  </span>
                  <span className="leading-relaxed">{bp}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Presentation Bottom Navigation Dock */}
      <div className="p-4 sm:p-6 bg-slate-900/80 border-t border-slate-800/80 backdrop-blur-md flex items-center justify-between z-20">
        
        <button
          onClick={prevSlide}
          disabled={currentSlideIndex === 0}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            currentSlideIndex === 0
              ? "opacity-30 cursor-not-allowed bg-slate-800 text-slate-500"
              : "bg-slate-800 text-white hover:bg-slate-700"
          }`}
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        {/* Slide Selector Pips */}
        <div className="flex items-center gap-2">
          {SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                idx === currentSlideIndex
                  ? "w-8 bg-primary"
                  : "w-2.5 bg-slate-700 hover:bg-slate-500"
              }`}
              title={`Jump to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          disabled={currentSlideIndex === SLIDES.length - 1}
          className={`px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            currentSlideIndex === SLIDES.length - 1
              ? "opacity-30 cursor-not-allowed bg-slate-800 text-slate-500"
              : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
          }`}
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>

      </div>

    </div>
  );
}
