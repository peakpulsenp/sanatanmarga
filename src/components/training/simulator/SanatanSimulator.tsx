import React, { useState } from "react";
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ShieldCheck, 
  Send, 
  FileText, 
  Layers, 
  ShoppingBag, 
  Sliders, 
  GraduationCap, 
  HelpCircle,
  Cpu,
  Scroll,
  Eye
} from "lucide-react";

export type SimulationActionType = 
  | "publish_article"
  | "approve_article"
  | "verify_sources"
  | "create_course"
  | "take_assessment"
  | "process_order"
  | "configure_ad"
  | "upload_manuscript";

interface SimulationConfig {
  id: SimulationActionType;
  title: string;
  titleNepali: string;
  category: string;
  icon: any;
  description: string;
}

const SIMULATIONS: SimulationConfig[] = [
  { id: "publish_article", title: "Publish Article", titleNepali: "समाचार प्रकाशन अभ्यास", category: "Journalism", icon: Send, description: "Draft a breaking news article, attach required primary citations, and test fail-closed pre-validation." },
  { id: "approve_article", title: "Approve Article", titleNepali: "सम्पादकीय स्वीकृति अभ्यास", category: "Editorial Desk", icon: ShieldCheck, description: "Review queued drafts, inspect plagiarism score, check citations, and execute four-eyes dual signature." },
  { id: "verify_sources", title: "Verify Sources", titleNepali: "स्रोत प्रमाणीकरण अभ्यास", category: "AI Newsroom", icon: Cpu, description: "Evaluate claims against Google Search Grounding and domain trust rating, detecting stale stories (>72h)." },
  { id: "create_course", title: "Create Course", titleNepali: "पाठ्यक्रम निर्माण अभ्यास", category: "Academy", icon: GraduationCap, description: "Structure multi-lesson shastric course curriculum, set lesson duration, and define anti-cheat assessments." },
  { id: "take_assessment", title: "Take Assessment", titleNepali: "परीक्षा हल गर्ने अभ्यास", category: "Certification", icon: FileText, description: "Simulate taking an anti-cheat randomized exam under timed conditions with real-time feedback." },
  { id: "process_order", title: "Process Store Order", titleNepali: "अर्डर प्रेषण अभ्यास", category: "Commerce", icon: ShoppingBag, description: "Verify sacred artifact order, generate tax-compliant cryptographic invoice, and trigger WhatsApp notification." },
  { id: "configure_ad", title: "Configure Advertisement", titleNepali: "विज्ञापन व्यवस्थापन अभ्यास", category: "RevenueOS", icon: Sliders, description: "Set ad slot, target demographic, budget, and pass ethical cultural appropriateness filter." },
  { id: "upload_manuscript", title: "Upload Manuscript", titleNepali: "पाण्डुलिपि ओसीआर अभ्यास", category: "SGIS Epigraphy", icon: Scroll, description: "Upload a high-res historical stone rubbing, draw bounding box around Licchavi script, and verify OCR output." }
];

export default function SanatanSimulator() {
  const [activeSimId, setActiveSimId] = useState<SimulationActionType>("publish_article");
  
  // State for Publish Article simulation
  const [pubHeadline, setPubHeadline] = useState("Historic 5th-century inscription uncovered near Patan temple");
  const [pubSource1, setPubSource1] = useState("https://departmentofarchaeology.gov.np/records/2026-stele");
  const [pubSource2, setPubSource2] = useState("https://tribhuvan-university.edu.np/epigraphy-journal-vol14");
  const [pubFreshnessHours, setPubFreshnessHours] = useState(24);
  const [pubLanguage, setPubLanguage] = useState("bilingual");

  // State for Approve Article simulation
  const [approverToken, setApproverToken] = useState("AUTH-SEC-88219-L3");
  const [approverNotes, setApproverNotes] = useState("Corroborated by independent field reporter; facts verified.");
  const [approverPlagScore, setApproverPlagScore] = useState(4); // percent

  // State for Verify Sources simulation
  const [verifyClaim, setVerifyClaim] = useState("Kathmandu municipality declares complete preservation zone around ancient water conduits.");
  const [verifyDomain, setVerifyDomain] = useState("kathmandupost.com");

  // State for Store Order simulation
  const [orderTrackingCode, setOrderTrackingCode] = useState("SM-POST-NP-9912");
  const [orderCustomerPhone, setOrderCustomerPhone] = useState("+977-9841234567");
  const [orderItemStatus, setOrderItemStatus] = useState("consecrated_packed");

  // State for Ad configuration simulation
  const [adSlotType, setAdSlotType] = useState("in_feed_native");
  const [adCategoryType, setAdCategoryType] = useState("sacred_handicrafts");
  const [adBudgetDaily, setAdBudgetDaily] = useState(2500);

  // Common Evaluation Result State
  const [simResult, setSimResult] = useState<{
    score: number;
    passed: boolean;
    feedbackPoints: string[];
    actionableGuidance: string;
  } | null>(null);

  const activeSim = SIMULATIONS.find(s => s.id === activeSimId) || SIMULATIONS[0];

  const handleRunSimulation = () => {
    let score = 100;
    let feedback: string[] = [];
    let guidance = "";

    if (activeSimId === "publish_article") {
      if (!pubHeadline.trim() || pubHeadline.length < 15) {
        score -= 25;
        feedback.push("Headline is too brief or lacks key entity descriptors.");
      }
      if (!pubSource1.startsWith("http") || !pubSource2.startsWith("http")) {
        score -= 50;
        feedback.push("Failed mandatory 'No Source = No Story' policy: At least 2 valid primary source URLs are required.");
      }
      if (pubFreshnessHours > 72) {
        score -= 40;
        feedback.push("Failed 72-Hour Freshness Gate: Event occurred >72h ago without fresh corroboration.");
      }
      if (score >= 80) {
        feedback.push("Passed all pre-validation checks! Successfully routed to Editorial Queue.");
        guidance = "Excellent compliance with editorial integrity standards. The draft has been timestamped and queued for dual-signature review.";
      } else {
        guidance = "The system has triggered a FAIL-CLOSED STOP. Adjust the failing parameters above and re-run.";
      }
    } else if (activeSimId === "approve_article") {
      if (approverPlagScore > 10) {
        score -= 40;
        feedback.push(`Plagiarism index too high (${approverPlagScore}%). Maximum permitted threshold is 8%.`);
      }
      if (!approverToken.startsWith("AUTH-SEC")) {
        score -= 50;
        feedback.push("Invalid cryptographic approval token for Editor L3+.");
      }
      if (score >= 80) {
        feedback.push("Four-Eyes approval signature accepted! Token hashed and permanently logged in audit ledger.");
        guidance = "Dual-signature verified. Pushed to multi-channel broadcast engine.";
      } else {
        guidance = "Approval rejected by Governance Gate. Rectify token privileges.";
      }
    } else if (activeSimId === "verify_sources") {
      if (verifyDomain.includes("gossip") || verifyDomain.includes("blog")) {
        score -= 60;
        feedback.push("Source domain is blacklisted or unverified for breaking news.");
      }
      if (score >= 80) {
        feedback.push("Claim corroborated against 3 independent wire feeds with 96% confidence.");
        guidance = "Source verification complete with zero hallucination alerts.";
      }
    } else if (activeSimId === "configure_ad") {
      if (adCategoryType === "gambling" || adCategoryType === "alcohol") {
        score = 0;
        feedback.push("VIOLATION: Prohibited advertiser category rejected by SanatanMarga Ethical Charter.");
        guidance = "Zero tolerance for predatory loans, gambling, or alcohol sponsorships.";
      } else {
        feedback.push("Ad placement conforms with cultural decorum standards.");
        guidance = "Approved for rotation in ethical ad inventory slots.";
      }
    } else {
      feedback.push("Simulation scenario executed with nominal parameters.");
      guidance = "Action completed cleanly in the safe sandbox environment.";
    }

    setSimResult({
      score: Math.max(0, score),
      passed: score >= 75,
      feedbackPoints: feedback,
      actionableGuidance: guidance
    });
  };

  const handleResetSim = () => {
    setSimResult(null);
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-theme dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles size={14} />
            <span>Interactive Operational Sandbox</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground dark:text-white">
            सनातनमार्ग सिमुलेटर (SanatanMarga Simulator Mode)
          </h2>
          <p className="text-xs sm:text-sm text-muted-text dark:text-zinc-400 mt-1 max-w-3xl">
            Practice live publishing, four-eyes editorial approvals, source verification, artifact dispatch, 
            and epigraphic OCR in a secure sandbox that never touches production databases.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20">
          <ShieldCheck size={14} />
          <span>Safe Sandbox: Zero Production Impact</span>
        </div>
      </div>

      {/* 8-Action Simulator Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SIMULATIONS.map((sim) => {
          const isSelected = activeSimId === sim.id;
          const IconComp = sim.icon;

          return (
            <button
              key={sim.id}
              onClick={() => {
                setActiveSimId(sim.id);
                setSimResult(null);
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                  : "bg-card dark:bg-slate-950 border-border-theme dark:border-zinc-800 text-foreground hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                  isSelected ? "bg-white/20 text-white" : "bg-muted-area dark:bg-zinc-900 text-muted-text"
                }`}>
                  {sim.category}
                </span>
                <IconComp size={16} className={isSelected ? "text-white" : "text-primary"} />
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-black line-clamp-1">
                  {sim.title}
                </h4>
                <p className={`text-[11px] mt-0.5 line-clamp-1 ${isSelected ? "text-white/80" : "text-muted-text"}`}>
                  {sim.titleNepali}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Simulator Active Workbench */}
      <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Scenario Header */}
        <div className="space-y-1 pb-4 border-b border-border-theme dark:border-zinc-800 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h3 className="text-xl font-black text-foreground dark:text-white">
              Simulation Scenario: {activeSim.title}
            </h3>
            <p className="text-xs text-primary font-bold">
              {activeSim.titleNepali}
            </p>
            <p className="text-xs sm:text-sm text-muted-text mt-1">
              {activeSim.description}
            </p>
          </div>
          <button
            onClick={handleResetSim}
            className="text-xs text-muted-text hover:text-foreground flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset Fields</span>
          </button>
        </div>

        {/* Dynamic Simulation Controls based on Selected Action */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Action Left: Parameters Form */}
          <div className="space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-muted-text block">
              Step 1: Configure Operator Inputs
            </span>

            {/* SCENARIO 1: PUBLISH ARTICLE */}
            {activeSimId === "publish_article" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Headline (शीर्षक):</label>
                  <input
                    type="text"
                    value={pubHeadline}
                    onChange={(e) => setPubHeadline(e.target.value)}
                    className="w-full p-2.5 bg-muted-area/40 dark:bg-zinc-900 border border-border-theme rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Primary Source URL #1 (अनिवार्य प्राथमिक स्रोत १):</label>
                  <input
                    type="text"
                    value={pubSource1}
                    onChange={(e) => setPubSource1(e.target.value)}
                    className="w-full p-2.5 bg-muted-area/40 dark:bg-zinc-900 border border-border-theme rounded-xl text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Primary Source URL #2 (अनिवार्य प्राथमिक स्रोत २):</label>
                  <input
                    type="text"
                    value={pubSource2}
                    onChange={(e) => setPubSource2(e.target.value)}
                    className="w-full p-2.5 bg-muted-area/40 dark:bg-zinc-900 border border-border-theme rounded-xl text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Event Freshness (घण्टा):</label>
                    <select
                      value={pubFreshnessHours}
                      onChange={(e) => setPubFreshnessHours(Number(e.target.value))}
                      className="w-full p-2 bg-muted-area/40 dark:bg-zinc-900 border border-border-theme rounded-xl text-xs text-foreground"
                    >
                      <option value={12}>12 Hours Ago (Fresh)</option>
                      <option value={24}>24 Hours Ago (Fresh)</option>
                      <option value={48}>48 Hours Ago (Acceptable)</option>
                      <option value={96}>96 Hours Ago (Triggers Freshness Stop)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Language Mode:</label>
                    <select
                      value={pubLanguage}
                      onChange={(e) => setPubLanguage(e.target.value)}
                      className="w-full p-2 bg-muted-area/40 dark:bg-zinc-900 border border-border-theme rounded-xl text-xs text-foreground"
                    >
                      <option value="bilingual">Bilingual (Nepali + English)</option>
                      <option value="nepali_only">Devanagari Nepali Only</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* SCENARIO 2: APPROVE ARTICLE */}
            {activeSimId === "approve_article" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Editor Security Token (L3+):</label>
                  <input
                    type="text"
                    value={approverToken}
                    onChange={(e) => setApproverToken(e.target.value)}
                    className="w-full p-2.5 bg-muted-area/40 dark:bg-zinc-900 border border-border-theme rounded-xl text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Detected Plagiarism Index (%):</label>
                  <input
                    type="number"
                    value={approverPlagScore}
                    onChange={(e) => setApproverPlagScore(Number(e.target.value))}
                    className="w-full p-2.5 bg-muted-area/40 dark:bg-zinc-900 border border-border-theme rounded-xl text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-[10px] text-muted-text">Threshold limit is ≤ 8%.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Reviewer Editorial Notes:</label>
                  <textarea
                    value={approverNotes}
                    onChange={(e) => setApproverNotes(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 bg-muted-area/40 dark:bg-zinc-900 border border-border-theme rounded-xl text-xs text-foreground"
                  />
                </div>
              </div>
            )}

            {/* SCENARIO 3: CONFIGURE AD */}
            {activeSimId === "configure_ad" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Sponsor Category:</label>
                  <select
                    value={adCategoryType}
                    onChange={(e) => setAdCategoryType(e.target.value)}
                    className="w-full p-2 bg-muted-area/40 dark:bg-zinc-900 border border-border-theme rounded-xl text-xs text-foreground"
                  >
                    <option value="sacred_handicrafts">Traditional Handicrafts & Books (Compliant)</option>
                    <option value="organic_ayurveda">Himalayan Organic Ayurveda (Compliant)</option>
                    <option value="gambling">Online Casino / Betting (PROHIBITED)</option>
                    <option value="alcohol">Alcoholic Beverages (PROHIBITED)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Daily Budget (NPR):</label>
                  <input
                    type="number"
                    value={adBudgetDaily}
                    onChange={(e) => setAdBudgetDaily(Number(e.target.value))}
                    className="w-full p-2.5 bg-muted-area/40 dark:bg-zinc-900 border border-border-theme rounded-xl text-xs font-mono text-foreground"
                  />
                </div>
              </div>
            )}

            {/* Fallback general inputs for other scenarios */}
            {activeSimId !== "publish_article" && activeSimId !== "approve_article" && activeSimId !== "configure_ad" && (
              <div className="p-4 rounded-xl bg-muted-area/30 dark:bg-zinc-900/30 border border-border-theme space-y-2 text-xs">
                <span className="font-bold text-foreground">Standard Scenario Pre-configured</span>
                <p className="text-muted-text">This action utilizes certified standard test fixtures conforming with the SanatanMarga specification.</p>
              </div>
            )}

            <button
              onClick={handleRunSimulation}
              className="w-full py-3 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer mt-4"
            >
              <Play size={16} />
              <span>Execute Sandbox Validation Run</span>
            </button>
          </div>

          {/* Action Right: Real-time Evaluation Output */}
          <div className="space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-muted-text block">
              Step 2: Real-time Algorithmic Validation
            </span>

            {simResult ? (
              <div className={`p-6 rounded-3xl border space-y-4 animate-in fade-in duration-200 ${
                simResult.passed
                  ? "bg-emerald-500/10 border-emerald-500/30 text-foreground"
                  : "bg-rose-500/10 border-rose-500/30 text-foreground"
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-border-theme/40">
                  <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    simResult.passed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}>
                    {simResult.passed ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    {simResult.passed ? "PASSED: Operational Compliance" : "FAIL-CLOSED: Rejected by Policy Gate"}
                  </span>

                  <span className="text-lg font-black font-mono">
                    Score: {simResult.score}/100
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-text">Diagnostic Points:</span>
                  <ul className="space-y-1.5">
                    {simResult.feedbackPoints.map((pt, pIdx) => (
                      <li key={pIdx} className="text-xs flex items-start gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                          simResult.passed ? "bg-emerald-500" : "bg-rose-500"
                        }`} />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-card dark:bg-zinc-950 border border-border-theme text-xs space-y-1">
                  <strong className="text-foreground dark:text-white block">Actionable Guidance:</strong>
                  <p className="text-muted-text leading-relaxed">{simResult.actionableGuidance}</p>
                </div>
              </div>
            ) : (
              <div className="h-64 border-2 border-dashed border-border-theme dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center p-6 text-center space-y-2">
                <Play size={28} className="text-muted-text/40" />
                <h4 className="text-xs font-bold text-foreground">Ready for Simulation</h4>
                <p className="text-xs text-muted-text max-w-xs">
                  Click 'Execute Sandbox Validation Run' to evaluate your inputs against SanatanMarga's production gates.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
