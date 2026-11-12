import React, { useState } from "react";
import { 
  Scroll, 
  Scan, 
  FileText, 
  GitFork, 
  Sparkles, 
  CheckCircle2, 
  Search, 
  MapPin 
} from "lucide-react";

interface SGISStep {
  step: number;
  title: string;
  titleNepali: string;
  icon: any;
  color: string;
  description: string;
  technicalDetails: string[];
}

const SGIS_STEPS: SGISStep[] = [
  {
    step: 1,
    title: "Manuscript Scanning & Folio Digitization",
    titleNepali: "पाण्डुलिपि स्क्यानिङ र डिजिटलाइजेसन",
    icon: Scan,
    color: "text-amber-500",
    description: "Ultra-high resolution non-invasive optical capture of palm-leaf (ताडपत्र), birch-bark (भोजपत्र), and stone inscriptions (शिलालेख).",
    technicalDetails: ["1200 DPI archival scans", "Preserve physical folio numbering", "Provenance metadata: temple, district, century"]
  },
  {
    step: 2,
    title: "Multi-Script OCR Extraction",
    titleNepali: "नेवारी तथा ब्राह्मी ओसिआर प्रशोधन",
    icon: FileText,
    color: "text-blue-500",
    description: "Specialized character recognition trained on historical Licchavi Brahmi, Prachalit Nepal Lipi, Ranjana, and archaic Devanagari.",
    technicalDetails: ["Conjunct ligature segmentation", "Dual-pane human verification loupe", "Confidence scoring per glyph"]
  },
  {
    step: 3,
    title: "Transliteration & Sanskrit Parsing",
    titleNepali: "संस्कृत व्याकरण विश्लेषण तथा अनुवाद",
    icon: GitFork,
    color: "text-purple-500",
    description: "Grammatical sandhi splitting, meter identification (छन्द), and parallel Devanagari, Nepali, and English translation.",
    technicalDetails: ["Paninian grammar engine", "Preserve poetic meter and cadence", "Cross-checked with Saraswati Granthalaya"]
  },
  {
    step: 4,
    title: "Semantic Knowledge Graph Linking",
    titleNepali: "ज्ञान सञ्जाल तथा भौगोलिक नक्साङ्कन",
    icon: MapPin,
    color: "text-emerald-500",
    description: "Extracted entities (deities, kings, dates, rivers, mantras) are converted into RDF triplets and mapped to sacred GPS coordinates.",
    technicalDetails: ["Entity relationships (e.g. Pashupatinath -> Shiva)", "Geospatial boundary indexing", "77-district cultural hierarchy"]
  },
  {
    step: 5,
    title: "Grounded 'Ask Sanatan' Intelligence",
    titleNepali: "आस्क सनातन एआई द्वारा प्रमाणित उत्तर",
    icon: Sparkles,
    color: "text-cyan-500",
    description: "The knowledge graph acts as an infallible truth anchor for conversational inquiries, providing exact folio citations.",
    technicalDetails: ["Zero hallucination guarantee", "Direct links to source folios", "Available via /ask-sanatan"]
  }
];

export default function SGISPipelineDiagram() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const current = SGIS_STEPS.find(s => s.step === activeStep) || SGIS_STEPS[0];

  return (
    <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-theme dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
            <Scroll size={14} /> Civilizational Intelligence Engine
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground dark:text-white mt-1">
            SGIS: Palm-Leaf to Semantic Knowledge Graph
          </h3>
          <p className="text-xs sm:text-sm text-muted-text dark:text-zinc-400 mt-1">
            How historical epigraphy is preserved, transcribed, and queried without synthetic distortion.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 px-3 py-1.5 rounded-full text-xs font-mono font-bold">
          SGIS v2.4 Active
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-6">
        {SGIS_STEPS.map((step) => {
          const Icon = step.icon;
          const isSelected = step.step === activeStep;

          return (
            <button
              key={step.step}
              onClick={() => setActiveStep(step.step)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected 
                  ? "bg-cyan-500/10 border-cyan-500/40 ring-2 ring-cyan-500/30 shadow-lg scale-[1.02]" 
                  : "bg-muted-area/40 dark:bg-zinc-900/40 border-border-theme dark:border-zinc-800 hover:border-cyan-500/40"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-muted-text">Step 0{step.step}</span>
                <div className={`p-1.5 rounded-lg bg-card dark:bg-zinc-800 ${step.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-text block">{step.titleNepali}</span>
                <span className="text-xs font-black text-foreground dark:text-zinc-100 block leading-tight mt-0.5">
                  {step.title.split(" ")[0]}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-muted-area/60 dark:bg-zinc-900/60 border border-border-theme dark:border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border-theme/60 dark:border-zinc-800">
          <div className={`p-3 rounded-2xl bg-card dark:bg-zinc-800 ${current.color} shadow-sm`}>
            <current.icon size={24} />
          </div>
          <div>
            <h4 className="text-lg font-black text-foreground dark:text-white">
              Step {current.step}: {current.title}
            </h4>
            <p className="text-xs text-muted-text dark:text-zinc-400 mt-0.5">
              {current.description}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-text dark:text-zinc-400 block mb-2">
            Technical Implementation & Grounding Specs
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {current.technicalDetails.map((detail, idx) => (
              <div key={idx} className="bg-card dark:bg-zinc-950 border border-border-theme dark:border-zinc-800 rounded-xl p-3 flex items-center gap-2">
                <CheckCircle2 size={14} className={current.color} />
                <span className="text-xs font-bold text-foreground dark:text-zinc-200">{detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
