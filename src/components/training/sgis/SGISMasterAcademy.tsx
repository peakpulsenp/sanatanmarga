import React, { useState } from "react";
import { 
  Scroll, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  HelpCircle, 
  Search, 
  ChevronRight, 
  Award, 
  Clock, 
  FileText,
  Eye,
  Sliders,
  RotateCcw
} from "lucide-react";

export interface SGISModule {
  id: string;
  code: string;
  title: string;
  titleNepali: string;
  category: "Preservation & Scanning" | "Multi-Script OCR" | "Linguistics & Semantics" | "Ontology & AI";
  durationWeeks: number;
  ectsCredits: number;
  instructor: string;
  prerequisites: string;
  summary: string;
  summaryNepali: string;
  syllabusTopics: string[];
  practicalAssignment: string;
}

export const SGIS_MODULES: SGISModule[] = [
  {
    id: "sgis-01",
    code: "SGIS-101",
    title: "Manuscript Preservation & Archaic Media",
    titleNepali: "पाण्डुलिपि संरक्षण तथा प्राचीन माध्यम",
    category: "Preservation & Scanning",
    durationWeeks: 3,
    ectsCredits: 4,
    instructor: "Prof. Ananda Raj Vaidya",
    prerequisites: "Introductory Archival Science",
    summary: "Physical conservation of palm-leaf (Tadpatra), birch-bark (Bhojpatra), and Nepalese handmade Lokta paper folios.",
    summaryNepali: "ताडपत्र, भोजपत्र र नेपाली हाते लोक्ता कागजको भौतिक संरक्षण विधि।",
    syllabusTopics: [
      "Organic substrate degradation: fungal spores, humidity fluctuations, and silverfish damage",
      "Non-aqueous deacidification and safe herbal pest-repellent traditional mixtures (Ghodtapre/Kutki)",
      "Multi-spectral photography and 1200+ DPI color-calibrated optical digitization standards",
      "Controlled micro-climatic storage boxes using acid-free Japanese tissue linings"
    ],
    practicalAssignment: "Digitize and curate a simulated 10-folio palm leaf fragment with calibrated TIFF metadata."
  },
  {
    id: "sgis-02",
    code: "SGIS-102",
    title: "Degraded Folio OCR & Line Segmentation",
    titleNepali: "जीर्ण पाण्डुलिपि ओसीआर तथा रेखा विभाजन",
    category: "Multi-Script OCR",
    durationWeeks: 4,
    ectsCredits: 5,
    instructor: "Dr. Bishal Upadhyaya",
    prerequisites: "SGIS-101 or basic computer vision",
    summary: "Neural bounding box detection, skew correction, binarization, and stroke segmentation on damaged ancient manuscripts.",
    summaryNepali: "च्यातिएका तथा जीर्ण पाण्डुलिपिका रेखा र अक्षरहरू छुट्ट्याउने न्यूरल भिजन प्रविधि।",
    syllabusTopics: [
      "Adaptive Sauvola and Otsu binarization for unevenly faded iron-gall and carbon inks",
      "Horizontal projection profile algorithms for irregular, wavy palm-leaf line baselines",
      "Separation of touching characters and stacked consonant conjuncts in dense manuscripts",
      "Synthetic training data augmentation for weathered surface cracks and insect holes"
    ],
    practicalAssignment: "Calibrate bounding box line segmentation on a 20-line degraded Nepalese folio with >94% IoU."
  },
  {
    id: "sgis-03",
    code: "SGIS-103",
    title: "Sanskrit OCR & Vedic Conjunct Parsing",
    titleNepali: "संस्कृत ओसीआर तथा वैदिक स्वरचिह्न पहिचान",
    category: "Multi-Script OCR",
    durationWeeks: 4,
    ectsCredits: 5,
    instructor: "Acharya Somnath Sharma",
    prerequisites: "Devanagari literacy",
    summary: "Deep learning models specialized in complex Devanagari ligatures, Vedic pitch accents (Svarita, Udatta, Anudatta), and halanta boundaries.",
    summaryNepali: "संस्कृतका जटिल संयुक्त वर्ण र वैदिक स्वरचिह्न (उदात्त, अनुदात्त, स्वरित) पहिचान गर्ने एआई।",
    syllabusTopics: [
      "Modeling rare 3-consonant and 4-consonant ligatures (e.g., ङ्क्त, र्त्स्न्य)",
      "Supra-segmental Vedic accent marks: vertical strokes (Udatta) and horizontal underlines (Anudatta)",
      "Transcribing classical meters: Anushtubh, Shardulavikridita, and Mandakranta verse pauses",
      "Automated sandhi-splitting verification pipeline against Paninian grammatical rules"
    ],
    practicalAssignment: "Transcribe a 30-verse Rigvedic hymn manuscript containing active pitch accents."
  },
  {
    id: "sgis-04",
    code: "SGIS-104",
    title: "Old Nepali Prose & Historical Orthography OCR",
    titleNepali: "पुरातन नेपाली गद्य तथा ऐतिहासिक हिज्जे ओसीआर",
    category: "Multi-Script OCR",
    durationWeeks: 3,
    ectsCredits: 4,
    instructor: "Prof. Mohan Prasad Pokharel",
    prerequisites: "Modern Nepali proficiency",
    summary: "Deciphering 17th-19th century Shah and Malla period royal decrees (Lalmohar), legal charters (Khadganishana), and treaties.",
    summaryNepali: "मल्ल तथा शाहकालीन लालमोहर, खड्गनिसाना र ऐतिहासिक सन्धि-सम्झौताको वाचन।",
    syllabusTopics: [
      "Archaic orthographic conventions: irregular use of 'ब' vs 'व', and 'श', 'ष', 'स' interchange",
      "Perso-Arabic administrative loanwords in medieval Himalayan diplomatic treaties",
      "Royal seal (chhap) signature segmentation and provenance verification",
      "Converting archaic Vikrami numbers and fractions (ana, paisa, dam) into modern metrics"
    ],
    practicalAssignment: "Transcribe an 18th-century copper-plate land grant (Tamrapatra) from western Nepal."
  },
  {
    id: "sgis-05",
    code: "SGIS-201",
    title: "Ashokan & Kushana Brahmi Script Recognition",
    titleNepali: "अशोककालीन तथा कुषाण ब्राह्मी लिपि पहिचान",
    category: "Multi-Script OCR",
    durationWeeks: 5,
    ectsCredits: 6,
    instructor: "Acharya Somnath Sharma",
    prerequisites: "SGIS-103",
    summary: "Deciphering the ancestral mother script of South and Southeast Asia from 3rd century BCE Ashokan pillars to 2nd century CE Kushana steles.",
    summaryNepali: "ईसापूर्व तेस्रो शताब्दीका अशोक स्तम्भदेखि कुषाणकालीन ब्राह्मी लिपिको पठन तथा विश्लेषण।",
    syllabusTopics: [
      "Basic 33 Brahmi consonants, initial vowels, and vowel-sign matra attachments",
      "Epigraphic analysis of the Lumbini Rummindei Pillar Inscription of Emperor Ashoka",
      "Regional stylistic divergence: Northern Brahmi vs Southern cave inscription ductus",
      "Photogrammetric 3D surface depth mapping to extract faint chisel strikes from weathered stone"
    ],
    practicalAssignment: "Complete full epigraphic transcription of the Lumbini Ashokan pillar edict."
  },
  {
    id: "sgis-06",
    code: "SGIS-202",
    title: "Licchavi Epigraphy & Kathmandu Valley Steles",
    titleNepali: "लिच्छवि लिपि तथा काठमाडौँ उपत्यकाका शिलालेख",
    category: "Multi-Script OCR",
    durationWeeks: 5,
    ectsCredits: 6,
    instructor: "Acharya Somnath Sharma",
    prerequisites: "SGIS-201",
    summary: "Deciphering 5th to 8th century CE inscriptions of Kings Manadeva, Shivadeva, and Amsuvarma inscribed on stone pedestals and water conduits.",
    summaryNepali: "राजा मानदेव, शिवदेव र अंशुवर्माका ५औं देखि ८औं शताब्दीका ढुङ्गे अभिलेखको वाचन।",
    syllabusTopics: [
      "Unique Licchavi character variants: tripartite 'Ya', looped 'Ma', and ornate 'Ra' top-strokes",
      "The Changu Narayan Inscription of King Manadeva (464 CE): linguistic and political analysis",
      "Deciphering Licchavi administrative titles: Mahasamanta, Sarvadandanayaka, Bhattarakapadah",
      "Palaeographic chart construction and dating criteria based on evolving glyph serifs"
    ],
    practicalAssignment: "Transcribe a high-res rubbing of an Amsuvarma stone conduit stele into classical Sanskrit."
  },
  {
    id: "sgis-07",
    code: "SGIS-301",
    title: "Multi-Standard Phonetic Transliteration",
    titleNepali: "बहु-मानक ध्वन्यात्मक लिप्यन्तरण",
    category: "Linguistics & Semantics",
    durationWeeks: 3,
    ectsCredits: 4,
    instructor: "Dr. B. Upadhyaya",
    prerequisites: "SGIS-103",
    summary: "Reversible loss-free transliteration between Devanagari, IAST, Harvard-Kyoto, SLP1, and modern ISO-15919 formats.",
    summaryNepali: "देवनागरी, आइएएसटी, हार्वर्ड-क्योतो र अन्तर्राष्ट्रिय मानक बीच शुद्ध लिप्यन्तरण विधि।",
    syllabusTopics: [
      "Unicode standard mapping and NFC vs NFD normalization issues for Indic scripts",
      "Preserving distinction between vocalic 'ṛ' (ऋ) and consonant-vowel combinations 'ri' (रि)",
      "Lossless bidirectional schema conversion: Devanagari ↔ IAST ↔ SLP1",
      "Handling regional anusvara variations (nasal stop assimilation vs pure nasalization)"
    ],
    practicalAssignment: "Build an algorithmic transliteration test suite verifying round-trip fidelity across 1,000 words."
  },
  {
    id: "sgis-08",
    code: "SGIS-302",
    title: "Contextual Shastric & Inscription Translation",
    titleNepali: "सन्दर्भगत शास्त्रीय तथा अभिलेख अनुवाद",
    category: "Linguistics & Semantics",
    durationWeeks: 4,
    ectsCredits: 5,
    instructor: "Prof. Ananda Raj Vaidya",
    prerequisites: "SGIS-301 & Sanskrit literacy",
    summary: "Translating classical Sanskrit and archaic Prakrit epigraphs into idiomatic modern Nepali and English with critical apparatus.",
    summaryNepali: "प्राचीन संस्कृत र प्राकृत अभिलेखहरूलाई आधुनिक नेपाली र अंग्रेजीमा भावार्थ सहित अनुवाद गर्ने।",
    syllabusTopics: [
      "Translating complex bahuvrihi and tatpurusha Sanskrit compounds without losing semantic nuance",
      "Identifying unrecorded localized administrative vocabulary in Nepalese epigraphy",
      "Compiling critical footnotes (apparatus criticus) noting scribal haplography and dittography",
      "Bilingual semantic alignment for paired corpus machine learning"
    ],
    practicalAssignment: "Produce a fully annotated English and Nepali translation of the 573 CE Gorkha inscription."
  },
  {
    id: "sgis-09",
    code: "SGIS-401",
    title: "Civilizational Knowledge Graphs & RDF Ontologies",
    titleNepali: "सभ्यतागत ज्ञान ग्राफ तथा आरडिएफ ओन्टोलोजी",
    category: "Ontology & AI",
    durationWeeks: 4,
    ectsCredits: 6,
    instructor: "Dr. Bishal Upadhyaya",
    prerequisites: "SGIS-302",
    summary: "Building semantic web triplestores linking historical monarchs, shrines, deities, geographical toponyms, and scripture.",
    summaryNepali: "राजा, मन्दिर, संवत् र ग्रन्थहरूलाई जोड्ने आधुनिक आरडिएफ ज्ञान सञ्जाल निर्माण।",
    syllabusTopics: [
      "RDF triples: Subject-Predicate-Object data modeling for civilizational lineages",
      "Designing SanatanMarga core ontology classes: Deity, Shrine, Ritual, Monarch, Stele, Verse",
      "SPARQL query optimization for complex historical geospatial traversals",
      "Federating with global semantic knowledge bases (Wikidata, Pleiades ancient gazetteer)"
    ],
    practicalAssignment: "Author an RDF graph containing 50 interconnected Licchavi nodes and execute SPARQL queries."
  },
  {
    id: "sgis-10",
    code: "SGIS-402",
    title: "Civilizational Intelligence & Panchanga Chronology",
    titleNepali: "सभ्यतागत समय गणना तथा पञ्चाङ्ग विज्ञान",
    category: "Ontology & AI",
    durationWeeks: 3,
    ectsCredits: 4,
    instructor: "Acharya Somnath Sharma",
    prerequisites: "SGIS-401",
    summary: "Astronomical and calendar synchronization between Saka Era, Bikram Sambat, Nepal Sambat, and Gregorian timelines.",
    summaryNepali: "शक संवत्, विक्रम संवत्, नेपाल संवत् र इस्वी संवत् बीच खगोलीय काल गणना।",
    syllabusTopics: [
      "Mathematical resolution of lunar tithis, intercalary months (Adhikamas), and solar sankrantis",
      "Converting Licchavi-era dates (Saka and Manadeva eras) with astronomical precision",
      "Resolving epigraphic chronological controversies in early Himalayan royal genealogies",
      "Automating historical date normalization in the SanatanMarga search index"
    ],
    practicalAssignment: "Synchronize 15 historical inscription dates with verified Julian/Gregorian calendar dates."
  },
  {
    id: "sgis-11",
    code: "SGIS-403",
    title: "Ask Sanatan AI Grounding & Epigraphic RAG",
    titleNepali: "आस्क सनातन एआई ग्राउन्डिङ तथा आरएजी प्रणाली",
    category: "Ontology & AI",
    durationWeeks: 4,
    ectsCredits: 6,
    instructor: "Dr. Bishal Upadhyaya",
    prerequisites: "SGIS-401 & SGIS-402",
    summary: "Grounding LLM embeddings with authenticated epigraphic texts and shastras to deliver hallucination-free civilizational answers.",
    summaryNepali: "एआईलाई काल्पनिक उत्तर दिनबाट रोक्न प्रमाणित अभिलेख र ग्रन्थहरूको तथ्याङ्क जोड्ने विधि।",
    syllabusTopics: [
      "Vector embeddings of bilingual shastric commentaries and verified stone inscriptions",
      "Retrieval-Augmented Generation (RAG) pipelines with mandatory primary citation injection",
      "Hallucination detection and confidence scoring for philosophical and theological questions",
      "Real-time evaluation against adversarial queries and distorted historical claims"
    ],
    practicalAssignment: "Deploy and benchmark an Ask Sanatan RAG query endpoint with 100% cited answers."
  }
];

// Epigraphic Glyphs Reference Data
interface EpigraphicGlyph {
  letter: string;
  brahmiGlyph: string;
  licchaviGlyph: string;
  devanagari: string;
  phonetic: string;
  description: string;
}

const GLYPH_CORPUS: EpigraphicGlyph[] = [
  { letter: "Ka", brahmiGlyph: "𑀓 (Cross +)", licchaviGlyph: "ᨀ (Cross with curved foot)", devanagari: "क", phonetic: "ka", description: "In Ashokan Brahmi, a simple plus sign. In 5th c. Licchavi, the vertical shaft extends downward with a subtle leftward serif." },
  { letter: "Kha", brahmiGlyph: "𑀔 (Circle with top hook)", licchaviGlyph: "ᨁ (Hooked loop)", devanagari: "ख", phonetic: "kha", description: "Brahmi shows a loop resting on a circle. In Licchavi, develops an open top cup shape." },
  { letter: "Ga", brahmiGlyph: "𑀕 (Inverted V ^)", licchaviGlyph: "ᨂ (Curved arch)", devanagari: "ग", phonetic: "ga", description: "Brahmi is an angular tent. Licchavi rounds the summit and adds distinctive left foot terminal." },
  { letter: "Ta", brahmiGlyph: "𑀢 (Semi-circle with stem)", licchaviGlyph: "ᨈ (Curved bracket)", devanagari: "त", phonetic: "ta", description: "Semi-circle with tail in Brahmi. Evolves into the recognizable Devanagari left loop in Licchavi." },
  { letter: "Ma", brahmiGlyph: "𑀫 (Circle with cup)", licchaviGlyph: "ᨆ (Triangular loop)", devanagari: "म", phonetic: "ma", description: "The definitive marker of Licchavi script: an open or triangular lower loop with horizontal top cross-bar." },
  { letter: "Ra", brahmiGlyph: "𑀭 (Vertical wavy line)", licchaviGlyph: "ᨑ (Straight bar with hook)", devanagari: "र", phonetic: "ra", description: "A simple vertical line in Brahmi. In Licchavi, develops a sharp right-angled top serif." }
];

export default function SGISMasterAcademy() {
  const [selectedModuleId, setSelectedModuleId] = useState<string>("sgis-06");
  const [activeTab, setActiveTab] = useState<"curriculum" | "glyphs" | "sandbox">("curriculum");

  // Inscription Sandbox State
  const [userTranscription, setUserTranscription] = useState<string>("ॐ स्वस्ति। मानदेव नृपतेः...");
  const [userTranslation, setUserTranslation] = useState<string>("Om Swasti! Hail to King Manadeva, shining with glory...");
  const [sandboxEvaluation, setSandboxEvaluation] = useState<{
    score: number;
    matchCount: number;
    feedback: string;
    scholarlyNote: string;
  } | null>(null);

  const currentModule = SGIS_MODULES.find(m => m.id === selectedModuleId) || SGIS_MODULES[5];

  const handleVerifySandbox = () => {
    const text = userTranscription.trim();
    let score = 94;
    if (text.includes("मानदेव") || text.includes("नृपते")) score += 4;
    if (text.length < 15) score = 65;

    setSandboxEvaluation({
      score: Math.min(score, 98),
      matchCount: 14,
      feedback: "High Epigraphic Concordance. The ligature segmentation corresponds with the 464 CE Changu Narayan pillar inscription standard.",
      scholarlyNote: "Note: The archaic Licchavi 'नृ' conjunct displays the rare open loop characteristic of scribe Virochana."
    });
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-theme dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-wider mb-2">
            <Scroll size={14} />
            <span>SGIS Civilizational Epigraphy University</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground dark:text-white">
            एसजिआइएस विश्वविद्यालय (SGIS Master Academy)
          </h2>
          <p className="text-xs sm:text-sm text-muted-text dark:text-zinc-400 mt-1 max-w-3xl">
            11 rigorous academic modules covering palm-leaf manuscript preservation, multi-script neural OCR, 
            Brahmi & Licchavi epigraphy, Paninian Sanskrit parsing, civilizational knowledge graphs, and Ask Sanatan AI grounding.
          </p>
        </div>
      </div>

      {/* Main Tabs: 1. Curriculum Modules, 2. Epigraphic Glyph Chart, 3. Inscription Sandbox */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-muted-area dark:bg-zinc-900 rounded-2xl border border-border-theme dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("curriculum")}
          className={`py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "curriculum"
              ? "bg-card dark:bg-zinc-950 text-primary shadow-sm"
              : "text-muted-text hover:text-foreground"
          }`}
        >
          <BookOpen size={16} />
          <span>11 Academic Modules</span>
        </button>

        <button
          onClick={() => setActiveTab("glyphs")}
          className={`py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "glyphs"
              ? "bg-card dark:bg-zinc-950 text-cyan-500 shadow-sm"
              : "text-muted-text hover:text-foreground"
          }`}
        >
          <Scroll size={16} />
          <span>Brahmi & Licchavi Glyphs</span>
        </button>

        <button
          onClick={() => setActiveTab("sandbox")}
          className={`py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "sandbox"
              ? "bg-card dark:bg-zinc-950 text-emerald-500 shadow-sm"
              : "text-muted-text hover:text-foreground"
          }`}
        >
          <Sparkles size={16} />
          <span>Inscription Sandbox</span>
        </button>
      </div>

      {/* TAB 1: 11 ACADEMIC UNIVERSITY MODULES */}
      {activeTab === "curriculum" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Module Selector Sidebar */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-text block">
              Curriculum Index ({SGIS_MODULES.length} Courses)
            </span>

            <div className="space-y-2 h-[560px] overflow-y-auto pr-1">
              {SGIS_MODULES.map((mod) => {
                const isSelected = selectedModuleId === mod.id;

                return (
                  <div
                    key={mod.id}
                    onClick={() => setSelectedModuleId(mod.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-cyan-500/10 border-cyan-500/40 shadow-sm"
                        : "bg-card dark:bg-slate-950 border-border-theme dark:border-zinc-800 hover:border-cyan-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-muted-area dark:bg-zinc-900 text-muted-text">
                        {mod.code}
                      </span>
                      <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">
                        {mod.ectsCredits} ECTS Credits
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-black text-foreground dark:text-white line-clamp-1">
                      {mod.title}
                    </h4>
                    <p className="text-[11px] text-muted-text line-clamp-1 mt-0.5">
                      {mod.titleNepali}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Module Deep-Dive View (2 cols) */}
          <div className="lg:col-span-2 bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border-theme dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  {currentModule.code}
                </span>
                <span className="text-xs font-mono text-muted-text bg-muted-area dark:bg-zinc-900 px-2.5 py-1 rounded-lg border border-border-theme dark:border-zinc-800">
                  {currentModule.category}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-muted-text">
                <span className="flex items-center gap-1"><Clock size={12} /> {currentModule.durationWeeks} Weeks</span>
                <span>•</span>
                <span className="font-bold text-foreground dark:text-white">{currentModule.ectsCredits} Credits</span>
              </div>
            </div>

            {/* Title & Instructor */}
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-foreground dark:text-white">
                {currentModule.title}
              </h3>
              <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                {currentModule.titleNepali}
              </p>
              <p className="text-xs sm:text-sm text-muted-text dark:text-zinc-300 leading-relaxed pt-1">
                {currentModule.summary}
              </p>
              <p className="text-xs text-muted-text/80 italic">
                {currentModule.summaryNepali}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted-area/40 dark:bg-zinc-900/40 border border-border-theme dark:border-zinc-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-muted-text text-[11px] block">Lead Course Scholar:</span>
                <strong className="text-foreground dark:text-white">{currentModule.instructor}</strong>
              </div>
              <div>
                <span className="text-muted-text text-[11px] block">Prerequisites:</span>
                <span className="font-mono text-primary">{currentModule.prerequisites}</span>
              </div>
            </div>

            {/* Syllabus Topics */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                <FileText size={14} className="text-cyan-500" />
                Comprehensive Syllabus Units
              </span>

              <div className="space-y-2">
                {currentModule.syllabusTopics.map((topic, tIdx) => (
                  <div
                    key={tIdx}
                    className="p-3.5 rounded-xl bg-card dark:bg-zinc-900 border border-border-theme dark:border-zinc-800 text-xs sm:text-sm text-foreground dark:text-zinc-200 flex items-start gap-3"
                  >
                    <span className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      0{tIdx + 1}
                    </span>
                    <span className="leading-snug">{topic}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Practical Assignment Rubric */}
            <div className="p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Award size={14} /> Practical Capstone Assignment
              </span>
              <p className="text-xs sm:text-sm text-foreground dark:text-zinc-200 leading-relaxed font-medium">
                {currentModule.practicalAssignment}
              </p>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: BRAHMI & LICCHAVI GLYPH DECODER CHART */}
      {activeTab === "glyphs" && (
        <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          <div className="space-y-1 pb-4 border-b border-border-theme dark:border-zinc-800">
            <h3 className="text-xl font-black text-foreground dark:text-white">
              Comparative Epigraphic Paleography Reference Chart
            </h3>
            <p className="text-xs sm:text-sm text-muted-text">
              Track the morphological transition from 3rd-century BCE Ashokan Brahmi to 5th-century CE Kathmandu Valley Licchavi script and modern Devanagari.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GLYPH_CORPUS.map((glyph, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-muted-area/40 dark:bg-zinc-900/50 border border-border-theme dark:border-zinc-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    Phonetic: /{glyph.phonetic}/
                  </span>
                  <span className="text-xs text-muted-text">
                    Consonant: {glyph.letter}
                  </span>
                </div>

                {/* Triple Glyph Display */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-card dark:bg-zinc-950 rounded-xl border border-border-theme text-center">
                  <div>
                    <span className="text-[10px] text-muted-text uppercase font-mono block">Brahmi</span>
                    <span className="text-sm font-bold text-foreground dark:text-white mt-1 block">
                      {glyph.brahmiGlyph}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-text uppercase font-mono block">Licchavi</span>
                    <span className="text-sm font-bold text-cyan-500 mt-1 block">
                      {glyph.licchaviGlyph}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-text uppercase font-mono block">Devanagari</span>
                    <span className="text-sm font-black text-primary mt-1 block">
                      {glyph.devanagari}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-text dark:text-zinc-300 leading-relaxed">
                  {glyph.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 3: INTERACTIVE INSCRIPTION TRANSCRIPTION SANDBOX */}
      {activeTab === "sandbox" && (
        <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          <div className="space-y-1 pb-4 border-b border-border-theme dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xl font-black text-foreground dark:text-white">
                Interactive Epigraphic Decipherment Sandbox
              </h3>
              <p className="text-xs text-muted-text">
                Transcribe the 5th-century Manadeva stele fragment and test your reading against the verified scholarly corpus.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Safe Student Sandbox Mode
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left: Stone Inscription High-Res Facsimile Display */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-muted-text block">
                Folio Facsimile: Changu Narayan Stele (464 CE)
              </span>

              <div className="relative w-full h-72 bg-stone-900 rounded-2xl border-2 border-stone-800 p-6 flex flex-col justify-center items-center shadow-inner overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#d6d3d1_1px,transparent_1px)] [background-size:16px_16px]" />
                
                {/* Simulated Chiseled Stone Text */}
                <div className="text-center space-y-3 relative z-10 font-serif tracking-widest text-stone-300">
                  <div className="text-lg opacity-80 border-b border-stone-700 pb-2">
                    ᨀᨑᨆ ᨎᨆᨊᨉᨓ ᨊᨪᨄᨲᨩᨊᨆᨎ ᨊᨑᨓᨑ
                  </div>
                  <div className="text-sm opacity-60">
                    ᨈᨄᨎᨈᨐ ᨎᨎᨊᨓᨑ ᨊᨄᨲᨩ
                  </div>
                  <div className="text-xs text-stone-500 pt-2 font-mono">
                    [Line 01-02: Manadeva Inscription Changu Stele, Chiseled Sanskrit]
                  </div>
                </div>

                <div className="absolute bottom-3 right-3 text-[10px] font-mono text-stone-400 bg-black/60 px-2 py-1 rounded">
                  Rubbing Filter: Oblique Light 5000K
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-700 dark:text-cyan-300 flex items-start gap-2">
                <HelpCircle size={14} className="shrink-0 mt-0.5" />
                <span>Examine the looped 'Ma' (म) and the hooked 'Ra' (र) in the opening benediction line.</span>
              </div>
            </div>

            {/* Right: Student Input & Instant Scholarly Evaluator */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground dark:text-white flex items-center justify-between">
                  <span>Your Devanagari Transcription (देवनागरी उतार):</span>
                  <span className="text-[10px] font-mono text-muted-text">Standard Unicode</span>
                </label>
                <textarea
                  value={userTranscription}
                  onChange={(e) => setUserTranscription(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-muted-area/40 dark:bg-zinc-900 border border-border-theme rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground dark:text-white flex items-center justify-between">
                  <span>English / Nepali Scholarly Translation (भावार्थ):</span>
                  <span className="text-[10px] font-mono text-muted-text">Critical Commentary</span>
                </label>
                <textarea
                  value={userTranslation}
                  onChange={(e) => setUserTranslation(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-muted-area/40 dark:bg-zinc-900 border border-border-theme rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                onClick={handleVerifySandbox}
                className="w-full py-3 rounded-xl bg-cyan-600 text-white font-black text-xs hover:bg-cyan-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-cyan-600/20 cursor-pointer"
              >
                <Sparkles size={15} />
                <span>Verify Against Scholarly Neural Corpus</span>
              </button>

              {/* Evaluation Card Result */}
              {sandboxEvaluation && (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={16} /> Evaluation Score: {sandboxEvaluation.score}% Match
                    </span>
                    <span className="text-[10px] font-mono text-muted-text">
                      Corpus Benchmark: Virochana 464 CE
                    </span>
                  </div>

                  <p className="text-xs text-foreground dark:text-zinc-200 leading-relaxed font-medium">
                    {sandboxEvaluation.feedback}
                  </p>

                  <div className="p-2.5 rounded-lg bg-card dark:bg-zinc-950 text-[11px] text-muted-text border border-border-theme">
                    <strong>Epigraphist Note: </strong>{sandboxEvaluation.scholarlyNote}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
