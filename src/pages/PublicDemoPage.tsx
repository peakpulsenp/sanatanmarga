import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Cpu, 
  BookOpen, 
  Radio, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  Eye, 
  Lock, 
  Globe, 
  Award,
  Presentation,
  Compass,
  FileCheck
} from "lucide-react";

type DemoModule = "newsroom" | "sgis" | "academy" | "mediaos" | "governance";

export default function PublicDemoPage() {
  const [activeModule, setActiveModule] = useState<DemoModule>("newsroom");
  const [demoStep, setDemoStep] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setDemoStep(1);
    const interval = setInterval(() => {
      setDemoStep(prev => {
        if (prev >= 4) {
          clearInterval(interval);
          setIsSimulating(false);
          return 4;
        }
        return prev + 1;
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Top Navigation Bar */}
      <header className="border-b border-stone-800/80 bg-stone-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-serif font-bold text-lg shadow-md shadow-amber-500/20">
              SM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold tracking-tight text-white">SANATANMARGA</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Public Demo
                </span>
              </div>
              <p className="text-[11px] text-stone-400 hidden sm:block">
                Civilizational Intelligence & Autonomous Media Ecosystem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/training?presentation=true"
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 border border-stone-700 transition-colors"
            >
              <Presentation className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Executive Slides</span>
            </Link>

            <Link
              to="/training"
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
            >
              <span>Full Training Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Showcase Header */}
      <section className="relative overflow-hidden py-12 sm:py-16 border-b border-stone-800/60 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Zero Authentication Required • Interactive Partner Sandbox
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
            Experience the SanatanMarga Ecosystem
          </h1>

          <p className="text-sm sm:text-base text-stone-400 max-w-2xl mx-auto leading-relaxed">
            Test-drive the core engines powering our digital media, epigraphic manuscript archives, civilizational academy, and fail-closed governance platform.
          </p>

          {/* Module Selector Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
            <button
              onClick={() => { setActiveModule("newsroom"); setDemoStep(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeModule === "newsroom"
                  ? "bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20 font-bold"
                  : "bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800"
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>AI Newsroom OS</span>
            </button>

            <button
              onClick={() => { setActiveModule("sgis"); setDemoStep(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeModule === "sgis"
                  ? "bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20 font-bold"
                  : "bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>SGIS Epigraphy & OCR</span>
            </button>

            <button
              onClick={() => { setActiveModule("academy"); setDemoStep(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeModule === "academy"
                  ? "bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20 font-bold"
                  : "bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Shastric Academy</span>
            </button>

            <button
              onClick={() => { setActiveModule("mediaos"); setDemoStep(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeModule === "mediaos"
                  ? "bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20 font-bold"
                  : "bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800"
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>MediaOS & 24/7 Radio</span>
            </button>

            <button
              onClick={() => { setActiveModule("governance"); setDemoStep(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeModule === "governance"
                  ? "bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20 font-bold"
                  : "bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Governance & Dual-Key</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Interactive Stage */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* MODULE 1: AI NEWSROOM OS */}
        {activeModule === "newsroom" && (
          <div className="bg-stone-900/90 rounded-2xl border border-stone-800 overflow-hidden shadow-2xl space-y-6 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
              <div>
                <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
                  <Cpu className="w-4 h-4" />
                  <span>AUTONOMOUS JOURNALISM PIPELINE</span>
                </div>
                <h2 className="text-2xl font-serif font-bold text-white mt-1">
                  AI Newsroom Fail-Closed Verification Engine
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  Simulate raw wire ingestion through the "No Source = No Story" validation filter.
                </p>
              </div>

              <button
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isSimulating ? "Ingesting Dispatch..." : "Run Ingestion Simulation"}</span>
              </button>
            </div>

            {/* Pipeline Step Visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl border transition-all ${
                demoStep >= 1 ? "bg-stone-800 border-amber-500/50 text-white" : "bg-stone-950/60 border-stone-800 text-stone-500"
              }`}>
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400">Step 1</div>
                <div className="font-semibold text-sm mt-1">Wire Ingestion</div>
                <p className="text-xs text-stone-400 mt-1">
                  Raw RSS / MoFAGA Gazette feed parsed and deduped.
                </p>
                {demoStep >= 1 && <span className="text-[10px] text-emerald-400 font-mono mt-2 block">✓ 1,240 WPM Ingested</span>}
              </div>

              <div className={`p-4 rounded-xl border transition-all ${
                demoStep >= 2 ? "bg-stone-800 border-amber-500/50 text-white" : "bg-stone-950/60 border-stone-800 text-stone-500"
              }`}>
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400">Step 2</div>
                <div className="font-semibold text-sm mt-1">Fail-Closed Gate</div>
                <p className="text-xs text-stone-400 mt-1">
                  Enforces "No Source = No Story" authority threshold.
                </p>
                {demoStep >= 2 && <span className="text-[10px] text-emerald-400 font-mono mt-2 block">✓ 2 Authoritative Sources</span>}
              </div>

              <div className={`p-4 rounded-xl border transition-all ${
                demoStep >= 3 ? "bg-stone-800 border-amber-500/50 text-white" : "bg-stone-950/60 border-stone-800 text-stone-500"
              }`}>
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400">Step 3</div>
                <div className="font-semibold text-sm mt-1">Fact & Neutrality</div>
                <p className="text-xs text-stone-400 mt-1">
                  Multi-model factual consistency & bias telemetry.
                </p>
                {demoStep >= 3 && <span className="text-[10px] text-emerald-400 font-mono mt-2 block">✓ 99.4% Factual Integrity</span>}
              </div>

              <div className={`p-4 rounded-xl border transition-all ${
                demoStep >= 4 ? "bg-stone-800 border-amber-500/50 text-white" : "bg-stone-950/60 border-stone-800 text-stone-500"
              }`}>
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400">Step 4</div>
                <div className="font-semibold text-sm mt-1">Dual-Key Ready</div>
                <p className="text-xs text-stone-400 mt-1">
                  Draft queued for Chief Editor four-eyes signature.
                </p>
                {demoStep >= 4 && <span className="text-[10px] text-amber-400 font-mono mt-2 block">🔒 Locked for Signoff</span>}
              </div>
            </div>

            {/* Preview Output */}
            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 font-mono text-xs space-y-2">
              <div className="text-stone-400">// LIVE INGESTION LOG OUTPUT</div>
              <div className="text-emerald-400">
                [GATE-PASS] Primary Source: Ministry of Federal Affairs (MoFAGA) • ID: 2026-NP-094
              </div>
              <div className="text-stone-300">
                Headline: "मुलुकभरका ७५३ वटै स्थानीय तहका लागि एकीकृत डिजिटल सुशासन प्रणाली कार्यान्वयन"
              </div>
              <div className="text-amber-300">
                [GOVERNANCE] Requires Tier-1 Editorial Key Signature before frontend push.
              </div>
            </div>
          </div>
        )}

        {/* MODULE 2: SGIS EPIGRAPHY & OCR */}
        {activeModule === "sgis" && (
          <div className="bg-stone-900/90 rounded-2xl border border-stone-800 overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-stone-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-amber-400 font-mono">SANATAN GEOGRAPHIC & INSCRIPTIONAL SYSTEM</div>
                <h2 className="text-2xl font-serif font-bold text-white mt-1">
                  Multispectral Manuscript Preservation
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  Recover carbon inks from weathered birch bark (भूर्जपत्र) and Licchavi stone inscriptions.
                </p>
              </div>
              <Link
                to="/training?tab=sgis"
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
              >
                Open Full SGIS Academy →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-stone-200">Multispectral Waveband Simulator</h3>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-stone-200">Visible Light (400-700nm)</div>
                      <div className="text-[11px] text-stone-500">Surface color and physical degradation layer</div>
                    </div>
                    <span className="font-mono text-amber-400">Baseline 100%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-950 border border-amber-500/30 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-amber-300">Infrared (850nm IR Reflected)</div>
                      <div className="text-[11px] text-stone-400">Carbon soot ink penetrates wood patina</div>
                    </div>
                    <span className="font-mono text-emerald-400">Contrast +340%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-stone-200">Ultraviolet (365nm UV Fluorescence)</div>
                      <div className="text-[11px] text-stone-500">Faded organic red vermilion ink recovery</div>
                    </div>
                    <span className="font-mono text-purple-400">Pigment Active</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-stone-950 border border-stone-800 space-y-3 font-mono text-xs">
                <div className="text-amber-400">// PALEOGRAPHIC CONSENSUS OCR ENGINE</div>
                <div className="text-stone-300">
                  Target: 7th Century Licchavi Inscription (Changu Narayan Compound)
                </div>
                <div className="p-3 rounded bg-stone-900 text-stone-200 border border-stone-800">
                  Transliteration Output: <br />
                  <span className="text-amber-300 font-serif text-sm">
                    "ॐ नमो भगवते वासुदेवाय । श्री मानदेव नृपते..."
                  </span>
                </div>
                <div className="text-emerald-400">
                  ✓ Confidence: 99.1% • Script: Late Brahmi / Early Licchavi
                </div>
                <div className="text-stone-400">
                  Knowledge Graph Linked: Node #KG-MANADEVA-01
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 3: SHASTRIC ACADEMY */}
        {activeModule === "academy" && (
          <div className="bg-stone-900/90 rounded-2xl border border-stone-800 overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-stone-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-amber-400 font-mono">CIVILIZATIONAL LEARNING & CERTIFICATION</div>
                <h2 className="text-2xl font-serif font-bold text-white mt-1">
                  SanatanMarga Shastric Academy
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  Structured courses in Vedic heritage, ethics, Sanskrit phonetics, and modern investigative journalism.
                </p>
              </div>
              <Link
                to="/academy"
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
              >
                Explore Public Courses →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div className="font-semibold text-sm text-stone-100">8 Official Certifications</div>
                <p className="text-xs text-stone-400">
                  Tamper-evident credentials verified with SHA-256 HMAC digital signatures.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="font-semibold text-sm text-stone-100">Bilingual Curricula</div>
                <p className="text-xs text-stone-400">
                  Comprehensive masterclasses in both Nepali and English with transcripts.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div className="font-semibold text-sm text-stone-100">Anti-Cheat Exams</div>
                <p className="text-xs text-stone-400">
                  Timed interactive assessments with randomized question banks and renewal tracking.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 4: MEDIAOS & 24/7 RADIO */}
        {activeModule === "mediaos" && (
          <div className="bg-stone-900/90 rounded-2xl border border-stone-800 overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-stone-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-amber-400 font-mono">CONTINUOUS STREAMING ARCHITECTURE</div>
                <h2 className="text-2xl font-serif font-bold text-white mt-1">
                  MediaOS & 24/7 Radio Automation
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  High-availability audio rundown scheduler with automated fallback streams.
                </p>
              </div>
              <Link
                to="/radio"
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
              >
                Listen Live →
              </Link>
            </div>

            <div className="p-5 rounded-xl bg-stone-950 border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Radio className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-mono font-bold text-emerald-400">LIVE BROADCAST</span>
                  </div>
                  <h4 className="font-serif font-bold text-base text-white mt-0.5">
                    सनातन प्रभात: प्रातःकालीन मन्त्रोच्चार तथा दैनिक चिन्तन
                  </h4>
                  <p className="text-xs text-stone-400">
                    Broadcasting at 192kbps AAC+ • Fallback Tier-2 Loop Ready
                  </p>
                </div>
              </div>

              <div className="text-right font-mono text-xs space-y-1">
                <div className="text-emerald-400">Buffer Health: 100%</div>
                <div className="text-stone-400">Bitrate: 192 kbps</div>
                <div className="text-stone-400">Listeners: 1,420 Active</div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 5: GOVERNANCE & DUAL-KEY */}
        {activeModule === "governance" && (
          <div className="bg-stone-900/90 rounded-2xl border border-stone-800 overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-stone-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-amber-400 font-mono">ZERO-TRUST INSTITUTIONAL SECURITY</div>
                <h2 className="text-2xl font-serif font-bold text-white mt-1">
                  GovernanceOS & Four-Eyes Approval
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  Cryptographic dual-key locks prevent unilateral publishing or tampering.
                </p>
              </div>
              <Link
                to="/training?tab=simulator"
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
              >
                Launch Simulator Drill →
              </Link>
            </div>

            <div className="p-5 rounded-xl bg-stone-950 border border-stone-800 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="text-amber-400 font-semibold">APPROVAL REQUEST #REQ-GOV-2026-09</span>
                <span className="text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                  FOUR-EYES PENDING
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-stone-900 border border-emerald-500/30 space-y-1">
                  <div className="text-emerald-400 font-bold">Key 1: Initiator Signoff</div>
                  <div className="text-stone-300">Staff: Sunita Bhattarai (Senior Journalist)</div>
                  <div className="text-stone-500 text-[11px]">Timestamp: 2026-09-05 21:40 UTC</div>
                  <div className="text-emerald-400 text-[11px]">✓ Validated & Signed</div>
                </div>

                <div className="p-3 rounded-lg bg-stone-900 border border-amber-500/30 space-y-1">
                  <div className="text-amber-400 font-bold">Key 2: Independent Reviewer</div>
                  <div className="text-stone-300">Required: Certified Editor (L4 Guardian)</div>
                  <div className="text-stone-500 text-[11px]">Status: Awaiting cryptographic token</div>
                  <div className="text-amber-300 text-[11px]">⏳ Action Required</div>
                </div>
              </div>

              <div className="text-stone-400 pt-2 text-[11px]">
                Policy Enforced: No breaking release or legal retraction can be finalized without both keys.
              </div>
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-12 text-center space-y-4 pt-6 border-t border-stone-800/80">
          <h3 className="font-serif font-bold text-xl text-white">
            Ready to train your staff or partner with SanatanMarga?
          </h3>
          <p className="text-xs sm:text-sm text-stone-400 max-w-xl mx-auto">
            Access our full 8-track curriculum, interactive simulator drills, and official certifications.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/training"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore All Training Tracks</span>
            </Link>

            <Link
              to="/training?presentation=true"
              className="px-6 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs flex items-center gap-2 border border-stone-700 transition-colors"
            >
              <Presentation className="w-4 h-4 text-amber-400" />
              <span>Launch Institutional Presentation</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
