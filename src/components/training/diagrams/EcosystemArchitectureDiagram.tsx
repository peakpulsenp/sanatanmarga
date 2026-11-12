import React, { useState } from "react";
import { 
  Radio, 
  BookOpen, 
  ShieldCheck, 
  ShoppingBag, 
  GraduationCap, 
  Sparkles, 
  Database, 
  Cpu, 
  Layers, 
  ArrowRight,
  CheckCircle2,
  Lock,
  Globe,
  Activity
} from "lucide-react";

interface PillarDetail {
  id: string;
  name: string;
  nameNepali: string;
  icon: any;
  color: string;
  accentBg: string;
  description: string;
  descriptionNepali: string;
  keyServices: string[];
  securityConstraint: string;
}

const PILLARS: PillarDetail[] = [
  {
    id: "media",
    name: "MediaOS & Broadcasting",
    nameNepali: "मिडिया तथा प्रसारण ओएस",
    icon: Radio,
    color: "text-red-500",
    accentBg: "bg-red-500/10 border-red-500/30",
    description: "24/7 RadioOS continuous audio streaming, LiveOS temple relays, and high-performance CDN media storage.",
    descriptionNepali: "२४/७ निरन्तर रेडियो अडियो प्रसारण, मन्दिरहरूको प्रत्यक्ष भिडियो रिले र द्रुत मिडिया लाइब्रेरी।",
    keyServices: ["RadioOS 24/7 Engine", "LiveOS YouTube Relay", "Persistent Mini-Player", "Sponsor Audio OS"],
    securityConstraint: "Zero-latency audio delivery with offline fallback loops."
  },
  {
    id: "knowledge",
    name: "KnowledgeOS & SGIS",
    nameNepali: "ज्ञानकोष तथा एसजिआइएस",
    icon: BookOpen,
    color: "text-cyan-500",
    accentBg: "bg-cyan-500/10 border-cyan-500/30",
    description: "Manuscript digitization, Licchavi OCR, semantic knowledge graph nodes, and Ask Sanatan conversational AI grounding.",
    descriptionNepali: "प्राचीन पाण्डुलिपि डिजिटलाइजेसन, ओसिआर, ज्ञान सञ्जाल र आस्क सनातन एआईको आधार।",
    keyServices: ["Manuscript Ingestion", "Knowledge Graph Engine", "Ask Sanatan AI", "Licchavi Epigraphy"],
    securityConstraint: "Strictly grounded outputs without synthetic hallucination."
  },
  {
    id: "newsroom",
    name: "AI Newsroom OS",
    nameNepali: "एआई न्यूजरुम प्रणाली",
    icon: Sparkles,
    color: "text-purple-500",
    accentBg: "bg-purple-500/10 border-purple-500/30",
    description: "Autonomous news discovery with Google Grounding, 72-hour freshness gate, and 'No Source = No Story' verification.",
    descriptionNepali: "गुगल ग्राउन्डिङद्वारा खोज, ७२-घण्टा ताजापन नियम र प्रमाणमा आधारित स्वचालित पत्रकारिता।",
    keyServices: ["Google Search Grounding", "Temporal Fact Audit", "72h Freshness Gate", "Four-Eyes Publishing"],
    securityConstraint: "Fail-closed truth gate: No real source = No story generated."
  },
  {
    id: "governance",
    name: "GovernanceOS & AuditOS",
    nameNepali: "सुशासन तथा अडिट ओएस",
    icon: ShieldCheck,
    color: "text-violet-500",
    accentBg: "bg-violet-500/10 border-violet-500/30",
    description: "Granular Role-Based Access Control (RBAC), four-eyes approval pipelines, and immutable platform event logging.",
    descriptionNepali: "भूमिकामा आधारित पहुँच नियन्त्रण, दोहोरो सम्पादकीय स्वीकृति र अकाट्य अडिट लेजर।",
    keyServices: ["RBAC Permission Matrix", "Immutable Audit Ledger", "Transparency Reporting", "Tenant Federation"],
    securityConstraint: "Principle of least privilege with cryptographically auditable trails."
  },
  {
    id: "commerce",
    name: "Commerce & Store",
    nameNepali: "वाणिज्य तथा स्टोर",
    icon: ShoppingBag,
    color: "text-emerald-500",
    accentBg: "bg-emerald-500/10 border-emerald-500/30",
    description: "Sacred cultural artifacts, verified Rudraksha, Vedic literature, and zero-friction WhatsApp One-Click checkout.",
    descriptionNepali: "पवित्र धार्मिक सामग्री, रुद्राक्ष, ग्रन्थ र ह्वाट्सएप एक-क्लिक खरिद व्यवस्थापन।",
    keyServices: ["Sacred Product Catalog", "Inventory Alerts", "WhatsApp 1-Click Checkout", "Revenue Analytics"],
    securityConstraint: "Authentic physical provenance verified prior to listing."
  },
  {
    id: "academy",
    name: "AssessmentOS & Academy",
    nameNepali: "मूल्यांकन तथा अकादेमी",
    icon: GraduationCap,
    color: "text-amber-500",
    accentBg: "bg-amber-500/10 border-amber-500/30",
    description: "Curriculum authoring, video courses, randomized anti-cheat exam engine, and HMAC cryptographically verifiable certificates.",
    descriptionNepali: "पाठ्यक्रम निर्माण, भिडियो कक्षा, अनलाइन परीक्षा र विश्वभर प्रमाणीकरण योग्य डिजिटल प्रमाणपत्र।",
    keyServices: ["Modular Course Builder", "Exam & Question Bank", "HMAC Certificate Engine", "Public /verify Portal"],
    securityConstraint: "Anti-forgery SHA-256 HMAC digital seal on all credentials."
  }
];

export default function EcosystemArchitectureDiagram() {
  const [selectedPillar, setSelectedPillar] = useState<string>("newsroom");

  const activePillar = PILLARS.find(p => p.id === selectedPillar) || PILLARS[0];

  return (
    <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-theme dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
            <Layers size={14} /> System Topology Visualization
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground dark:text-white mt-1">
            SanatanMarga Civilizational Architecture
          </h3>
          <p className="text-xs sm:text-sm text-muted-text dark:text-zinc-400 mt-1">
            Click any pillar node to inspect interconnected services, data flows, and security constraints.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-muted-area dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-border-theme dark:border-zinc-800 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
          <Activity size={14} className="animate-pulse" /> Unified Kernel Online
        </div>
      </div>

      {/* Interactive Hub Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-6">
        {PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          const isSelected = pillar.id === selectedPillar;

          return (
            <button
              key={pillar.id}
              onClick={() => setSelectedPillar(pillar.id)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer group ${
                isSelected 
                  ? `${pillar.accentBg} ring-2 ring-primary/40 shadow-lg scale-[1.02]` 
                  : "bg-muted-area/40 dark:bg-zinc-900/40 border-border-theme dark:border-zinc-800 hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className={`p-2 rounded-xl bg-card dark:bg-zinc-800 ${pillar.color} shadow-sm`}>
                  <Icon size={18} />
                </div>
                {isSelected && <span className="w-2 h-2 rounded-full bg-primary animate-ping" />}
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-text dark:text-zinc-400 block">{pillar.nameNepali}</span>
                <span className="text-xs font-black text-foreground dark:text-zinc-100 group-hover:text-primary transition-colors leading-tight block mt-0.5">
                  {pillar.name.split(" ")[0]}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Deep-Dive Inspection Panel */}
      <div className="bg-muted-area/60 dark:bg-zinc-900/60 border border-border-theme dark:border-zinc-800 rounded-2xl p-6 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border-theme/60 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl bg-card dark:bg-zinc-800 ${activePillar.color} shadow-md`}>
              <activePillar.icon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-black text-foreground dark:text-white">
                  {activePillar.name}
                </h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  {activePillar.nameNepali}
                </span>
              </div>
              <p className="text-xs text-muted-text dark:text-zinc-400 mt-0.5 max-w-2xl">
                {activePillar.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-card dark:bg-zinc-950 px-3 py-2 rounded-xl border border-border-theme dark:border-zinc-800 text-muted-text">
            <Lock size={13} className="text-primary" />
            <span>Strict Rule: <span className="text-foreground dark:text-zinc-200 font-bold">{activePillar.securityConstraint}</span></span>
          </div>
        </div>

        {/* Micro Services Flow */}
        <div className="mt-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-text dark:text-zinc-400 block mb-3">
            Core Architectural Services & Integration Points
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {activePillar.keyServices.map((service, idx) => (
              <div 
                key={idx} 
                className="bg-card dark:bg-zinc-950 border border-border-theme dark:border-zinc-800/80 rounded-xl p-3.5 flex items-center gap-2.5 shadow-sm"
              >
                <CheckCircle2 size={16} className={activePillar.color} />
                <span className="text-xs font-bold text-foreground dark:text-zinc-200">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
