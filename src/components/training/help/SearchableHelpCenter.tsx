import React, { useState } from "react";
import { 
  Search, 
  HelpCircle, 
  FileText, 
  Video, 
  Layers, 
  ShieldCheck, 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  Copy, 
  Check, 
  BookOpen, 
  ExternalLink,
  Info
} from "lucide-react";

export interface HelpSOP {
  id: string;
  code: string;
  title: string;
  titleNepali: string;
  category: "Editorial" | "Governance" | "SGIS" | "Infrastructure" | "Commercial";
  summary: string;
  steps: string[];
}

export interface HelpFAQ {
  id: string;
  question: string;
  questionNepali: string;
  category: "Editorial" | "Governance" | "SGIS" | "Infrastructure" | "Audio";
  answer: string;
  answerNepali: string;
  relatedDoc: string;
}

const SOPS: HelpSOP[] = [
  {
    id: "sop-01",
    code: "SOP-ED-101",
    title: "Breaking News Editorial Verification Checklist",
    titleNepali: "ताजा समाचार सम्पादकीय प्रमाणीकरण कार्यविधि",
    category: "Editorial",
    summary: "Mandatory sequence for publishing breaking events under the 'No Source = No Story' mandate.",
    steps: [
      "Confirm event freshness is strictly within the 72-hour temporal boundary.",
      "Obtain and verify at least two independent primary source URLs or official government affidavits.",
      "Run the automated Google Search Grounding entity check to verify actors and locations.",
      "Verify that Devanagari headline and body text meet standard Nepalese press council orthography.",
      "Submit draft to Editorial Desk for dual-signature Four-Eyes review (Editor A + Editor B signoff)."
    ]
  },
  {
    id: "sop-02",
    code: "SOP-GOV-201",
    title: "Handling Inaccurate News & Publishing Formal Corrections",
    titleNepali: "त्रुटिपूर्ण समाचार सच्याउने तथा खण्डन सूचना जारी गर्ने कार्यविधि",
    category: "Governance",
    summary: "Immutable retraction and correction procedure adhering to truth transparency standards.",
    steps: [
      "Log the grievance report into the GovernanceOS audit queue within 60 minutes of notification.",
      "The Lead Editor conducts independent corroboration of the contested claim.",
      "If error is confirmed: Draft a timestamped correction notice prominently displayed at the top of the article.",
      "Preserve the original text with a strikethrough—never delete past records silently.",
      "Export the cryptographic SHA-256 ledger update certifying the correction timestamp."
    ]
  },
  {
    id: "sop-03",
    code: "SOP-SGIS-301",
    title: "Epigraphic Stone Inscription Digitization & Transcription Protocol",
    titleNepali: "शिलालेख डिजिटलाइजेसन तथा वाचन कार्यविधि",
    category: "SGIS",
    summary: "Standard operating procedure for scanning, segmenting, and transliterating ancient inscriptions.",
    steps: [
      "Capture high-resolution 1200+ DPI scans using calibrated 5000K oblique LED lighting.",
      "Import raw uncompressed TIFF files into the SGIS preservation hub with full provenance metadata.",
      "Execute neural bounding box line segmentation, calibrating for stone cracks and erosion.",
      "Transcribe archaic Licchavi/Brahmi ligatures into standard classical Sanskrit Devanagari.",
      "Attach geographical GIS coordinates and register the text in the civilizational RDF knowledge graph."
    ]
  },
  {
    id: "sop-04",
    code: "SOP-INFRA-401",
    title: "Emergency Blackout Disaster Recovery (SnapshotOS 3-Tier Fallback)",
    titleNepali: "इन्टरनेट वा सर्भर अवरुद्ध हुँदा स्न्यापसट प्रणाली ब्युँझाउने कार्यविधि",
    category: "Infrastructure",
    summary: "Cold-start recovery sequence to maintain 100% portal uptime during external cloud outages.",
    steps: [
      "Detect cloud connection failure (Firestore unreachable > 3,000ms).",
      "System automatically flips active read queries to the local browser IndexedDB cache.",
      "If local cache is unpopulated: Fall back to static decentralized CDN JSON snapshots.",
      "Verify that the 24/7 radio player engages the 400ms silent local audio backup loop.",
      "Once upstream connection stabilizes, trigger background synchronization without page reloads."
    ]
  }
];

const FAQS: HelpFAQ[] = [
  {
    id: "faq-1",
    question: "Why does SanatanMarga enforce 'No Source = No Story'?",
    questionNepali: "सनातनमार्गमा 'स्रोत विना समाचार छैन' नियम किन अनिवार्य छ?",
    category: "Editorial",
    answer: "SanatanMarga is founded on Satya (absolute factual integrity). News without verified primary evidence causes civilizational confusion, legal liability, and societal discord. We prioritize truth over breaking speed.",
    answerNepali: "सनातनमार्ग सत्य निष्ठामा आधारित छ। प्रमाण नभएका समाचारले समाजमा भ्रम फैलाउँछ, त्यसैले हामी गतिको सट्टा सत्यलाई प्राथमिकता दिन्छौं।",
    relatedDoc: "SOP-ED-101"
  },
  {
    id: "faq-2",
    question: "What is the 72-Hour Freshness Gate?",
    questionNepali: "७२-घण्टे ताजापन सुरक्षा गेट भनेको के हो?",
    category: "Editorial",
    answer: "Any news claim whose primary occurrence happened over 72 hours ago cannot be published as breaking news. It must either be corroborated with fresh updates or reclassified as historical commentary.",
    answerNepali: "७२ घण्टाभन्दा अगाडि घटेको घटनालाई ताजा समाचार भनी प्रकाशन गर्न पाइँदैन।",
    relatedDoc: "AI Newsroom OS Architecture"
  },
  {
    id: "faq-3",
    question: "How does the Four-Eyes principle prevent rogue publishing?",
    questionNepali: "चार-आँखे सिद्धान्तले एकलौटी समाचार प्रकाशन कसरी रोक्छ?",
    category: "Governance",
    answer: "Every article requires cryptographic approval signatures from two distinct operators: Editor A (Reviewer) and Editor B (Publisher). No single individual—not even the founder—can publish unilaterally.",
    answerNepali: "दुई जना भिन्न सम्पादकको डिजिटल हस्ताक्षर विना कुनै पनि समाचार पोर्टलमा प्रत्यक्ष प्रकाशन हुन सक्दैन।",
    relatedDoc: "SOP-GOV-201"
  },
  {
    id: "faq-4",
    question: "How do offline readers receive news during network blackouts?",
    questionNepali: "इन्टरनेट नहुँदा पनि समाचार कसरी पढ्न सकिन्छ?",
    category: "Infrastructure",
    answer: "SnapshotOS caches recent articles and audio snippets in the browser's IndexedDB. Readers can read full articles, view diagrams, and listen to cached audio completely offline.",
    answerNepali: "स्न्यापसट प्रणालीले समाचारहरू कम्प्युटर वा मोबाइलमै सुरक्षित राख्ने हुँदा इन्टरनेट नहुँदा पनि पढ्न सकिन्छ।",
    relatedDoc: "SOP-INFRA-401"
  }
];

export default function SearchableHelpCenter() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [copiedSOPId, setCopiedSOPId] = useState<string | null>(null);
  const [expandedFaqIds, setExpandedFaqIds] = useState<string[]>(["faq-1"]);

  // Instant AI Answer Generator State
  const [aiAnswerPrompt, setAiAnswerPrompt] = useState<string>("");
  const [aiAnswerResult, setAiAnswerResult] = useState<string | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  const handleCopySOP = (sop: HelpSOP) => {
    const text = `${sop.code}: ${sop.title}\n\n${sop.summary}\n\nSteps:\n${sop.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopiedSOPId(sop.id);
    setTimeout(() => setCopiedSOPId(null), 2000);
  };

  const toggleFaq = (faqId: string) => {
    setExpandedFaqIds(prev => 
      prev.includes(faqId) ? prev.filter(id => id !== faqId) : [...prev, faqId]
    );
  };

  const handleAskInstantAi = () => {
    if (!aiAnswerPrompt.trim()) return;
    setIsAiGenerating(true);
    setAiAnswerResult(null);

    setTimeout(() => {
      setIsAiGenerating(false);
      const q = aiAnswerPrompt.toLowerCase();
      if (q.includes("freshness") || q.includes("72")) {
        setAiAnswerResult("Grounded Answer: The 72-hour freshness gate is an automated temporal filter in the AI Newsroom. Any incoming claim with an original publication or event timestamp older than 72 hours without fresh corroboration is halted with a Fail-Closed condition. (Citation: SOP-ED-101 / Editorial Charter Section 4.2)");
      } else if (q.includes("source") || q.includes("no source")) {
        setAiAnswerResult("Grounded Answer: 'No Source = No Story' requires at least two independent primary source URLs (government whitepapers, wire agencies, eyewitness affidavits) before an article is eligible for editorial queue submission. (Citation: SanatanMarga Constitution Article 3)");
      } else {
        setAiAnswerResult(`Grounded Answer regarding '${aiAnswerPrompt}': According to SanatanMarga's operational governance framework, all platform actions are secured via zero-trust RBAC tiers (L1 to L5) and logged permanently to the SHA-256 audit ledger. (Citation: GovernanceOS Standard Operating Spec v2.4)`);
      }
    }, 600);
  };

  // Filtered SOPs
  const filteredSOPs = SOPS.filter(sop => {
    if (activeCategory !== "All" && sop.category !== activeCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return sop.title.toLowerCase().includes(q) || sop.titleNepali.includes(q) || sop.summary.toLowerCase().includes(q) || sop.code.toLowerCase().includes(q);
  });

  // Filtered FAQs
  const filteredFAQs = FAQS.filter(faq => {
    if (activeCategory !== "All" && faq.category !== activeCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return faq.question.toLowerCase().includes(q) || faq.questionNepali.includes(q) || faq.answer.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-theme dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider mb-2">
            <HelpCircle size={14} />
            <span>Unified Knowledge & SOP Center</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground dark:text-white">
            सहायता केन्द्र तथा कार्यविधि (Help & SOPs)
          </h2>
          <p className="text-xs sm:text-sm text-muted-text dark:text-zinc-400 mt-1 max-w-3xl">
            Search across standard operating procedures (SOPs), governance policies, 
            instant AI-assisted question answering, and comprehensive technical FAQs.
          </p>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-text" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across all SOPs, policies, lesson topics, and technical rules..."
            className="w-full pl-12 pr-4 py-3 bg-muted-area/50 dark:bg-zinc-900 border border-border-theme rounded-2xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
          />
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {["All", "Editorial", "Governance", "SGIS", "Infrastructure", "Commercial"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? "bg-primary text-white shadow-sm"
                  : "bg-muted-area dark:bg-zinc-900 text-muted-text hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Instant AI-Assisted Grounded Answer Box */}
      <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent border border-primary/30 rounded-3xl p-6 sm:p-7 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
          <Sparkles size={16} />
          <span>Ask Sanatan Instant AI Help Assistant (Grounded in Platform Constitution)</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={aiAnswerPrompt}
            onChange={(e) => setAiAnswerPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAskInstantAi()}
            placeholder="e.g., What happens if an article fails the 72-hour freshness gate?"
            className="flex-1 px-4 py-2.5 bg-card dark:bg-slate-950 border border-border-theme rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleAskInstantAi}
            disabled={isAiGenerating || !aiAnswerPrompt.trim()}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
          >
            {isAiGenerating ? "Querying..." : "Ask AI"}
          </button>
        </div>

        {aiAnswerResult && (
          <div className="p-4 rounded-2xl bg-card dark:bg-slate-950 border border-primary/40 space-y-2 animate-in fade-in duration-200">
            <span className="text-[10px] font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
              CITED KNOWLEDGE RESPONSE
            </span>
            <p className="text-xs sm:text-sm text-foreground dark:text-zinc-200 leading-relaxed font-medium">
              {aiAnswerResult}
            </p>
          </div>
        )}
      </div>

      {/* Standard Operating Procedures (SOPs) Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-foreground dark:text-white flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            <span>Standard Operating Procedures ({filteredSOPs.length})</span>
          </h3>
          <span className="text-xs text-muted-text font-mono">Formal Enterprise Protocols</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSOPs.map((sop) => (
            <div
              key={sop.id}
              className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {sop.code}
                  </span>
                  <span className="text-[10px] font-mono text-muted-text">
                    Category: {sop.category}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-black text-foreground dark:text-white">
                    {sop.title}
                  </h4>
                  <p className="text-xs font-bold text-primary mt-0.5">
                    {sop.titleNepali}
                  </p>
                </div>

                <p className="text-xs text-muted-text leading-relaxed">
                  {sop.summary}
                </p>

                {/* Steps List */}
                <div className="pt-2 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-text block">
                    Execution Steps:
                  </span>
                  <div className="space-y-1.5">
                    {sop.steps.map((step, sIdx) => (
                      <div key={sIdx} className="p-2 rounded-xl bg-muted-area/40 dark:bg-zinc-900/40 text-xs text-foreground dark:text-zinc-200 flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                          {sIdx + 1}
                        </span>
                        <span className="leading-snug">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border-theme/60 flex items-center justify-between">
                <button
                  onClick={() => handleCopySOP(sop)}
                  className="px-3 py-1.5 rounded-xl bg-muted-area dark:bg-zinc-900 hover:bg-muted-area/80 text-xs font-bold text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSOPId === sop.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  <span>{copiedSOPId === sop.id ? "Copied to Clipboard" : "Copy SOP Steps"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categorized FAQs Accordion */}
      <div className="space-y-4 pt-4 border-t border-border-theme dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-foreground dark:text-white flex items-center gap-2">
            <HelpCircle size={18} className="text-amber-500" />
            <span>Frequently Asked Operational Questions ({filteredFAQs.length})</span>
          </h3>
          <span className="text-xs text-muted-text">Verified Policy Answers</span>
        </div>

        <div className="space-y-3">
          {filteredFAQs.map((faq) => {
            const isExpanded = expandedFaqIds.includes(faq.id);

            return (
              <div
                key={faq.id}
                className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-muted-area/30 transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-black text-foreground dark:text-white">
                      {faq.question}
                    </h4>
                    <p className="text-xs text-primary font-bold">
                      {faq.questionNepali}
                    </p>
                  </div>
                  <div className={`p-1 rounded-lg text-muted-text transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                    <ChevronDown size={18} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-0 border-t border-border-theme/40 dark:border-zinc-800/60 bg-muted-area/20 dark:bg-zinc-900/20 space-y-3 text-xs sm:text-sm text-muted-text dark:text-zinc-300 leading-relaxed">
                    <p>{faq.answer}</p>
                    <p className="text-xs text-muted-text/80 italic">{faq.answerNepali}</p>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-[10px] font-mono font-bold text-muted-text">Related Specification:</span>
                      <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {faq.relatedDoc}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
