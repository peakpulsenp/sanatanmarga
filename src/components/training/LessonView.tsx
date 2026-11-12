import React, { useState } from "react";
import { TrainingTrack, Lesson } from "./TrainingData";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Lightbulb, 
  AlertCircle, 
  Award, 
  Layers, 
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Share2,
  HelpCircle,
  RefreshCw,
  ShieldCheck
} from "lucide-react";

import EcosystemArchitectureDiagram from "./diagrams/EcosystemArchitectureDiagram";
import AINewsroomPipelineDiagram from "./diagrams/AINewsroomPipelineDiagram";
import SGISPipelineDiagram from "./diagrams/SGISPipelineDiagram";
import RBACApprovalChainDiagram from "./diagrams/RBACApprovalChainDiagram";
import SnapshotOSResilienceDiagram from "./diagrams/SnapshotOSResilienceDiagram";

interface LessonViewProps {
  track: TrainingTrack;
  lesson: Lesson;
  onBackToTracks: () => void;
  onSelectLesson: (lessonId: string) => void;
  isCompleted: boolean;
  onToggleComplete: (lessonId: string) => void;
  onOpenExam?: (certId: string) => void;
}

interface MiniQuiz {
  question: string;
  questionNepali: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  governanceCode: string;
}

function getLessonMiniQuiz(lesson: Lesson, track: TrainingTrack): MiniQuiz {
  const lId = lesson.id.toLowerCase();
  const tSlug = track.slug.toLowerCase();

  if (tSlug.includes("ai-newsroom") || lId.includes("source") || lId.includes("pipeline")) {
    return {
      question: "What is the mandatory platform consequence if an incoming news dispatch lacks a verified primary source?",
      questionNepali: "यदि समाचार सामग्रीमा आधिकारिक प्राथमिक स्रोत फेला परेन भने प्रणालीले के गर्छ?",
      options: [
        "It publishes the story as an unverified draft with a warning label",
        "It uses AI to automatically invent plausible contextual details",
        "Fail-Closed Rejection: 'No Source = No Story' prevents draft generation and publication entirely",
        "It asks social media readers to vote on story validity"
      ],
      correctIndex: 2,
      explanation: "Under SanatanMarga's fail-closed Zero-Trust policy ('No Source = No Story'), stories without authoritative primary sources are immediately rejected by the autonomous pipeline.",
      governanceCode: "SOP-EDT-02"
    };
  }

  if (tSlug.includes("sgis") || lId.includes("ocr") || lId.includes("manuscript")) {
    return {
      question: "Why is 850nm Infrared (IR) photography deployed for ancient Birch Bark (भूर्जपत्र) manuscripts?",
      questionNepali: "प्राचीन भूर्जपत्र पाण्डुलिपिहरूमा ८५०nm इन्फ्रारेड फोटोग्राफी किन प्रयोग गरिन्छ?",
      options: [
        "It generates high heat to flatten folded parchment folds",
        "Carbon ink absorbs infrared while the darkened wood patina reflects it, revealing obscured text",
        "It provides aesthetic golden ambient lighting for museum showcases",
        "It automatically translates Sanskrit into English"
      ],
      correctIndex: 1,
      explanation: "Carbon-based historical ink remains opaque and absorbs 850nm IR light while organic birch bark patina reflects it, exposing faded ligatures invisible to the naked human eye.",
      governanceCode: "SOP-SGIS-04"
    };
  }

  if (tSlug.includes("governance") || lId.includes("approval") || lId.includes("rbac")) {
    return {
      question: "Under the Four-Eyes / Dual-Key governance framework, who can unilaterally publish high-impact breaking alerts or legal retractions?",
      questionNepali: "चार-आँखे / दोहोरो-चाबी सुशासन अन्तर्गत संवेदनशील समाचार एकल निर्णयबाट कसले प्रकाशित गर्न सक्छ?",
      options: [
        "Any certified journalist who drafted the report",
        "The senior-most platform developer via direct terminal command",
        "No single individual: Publication requires dual-signature signoff from an initiator and an independent certified reviewer",
        "Any registered patron with over 100 loyalty points"
      ],
      correctIndex: 2,
      explanation: "Zero-Trust governance dictates that unilateral publishing of Tier-1 alerts or retractions is impossible. Both keys must be cryptographically signed by two separate staff roles.",
      governanceCode: "SOP-GOV-05"
    };
  }

  if (tSlug.includes("resilience") || tSlug.includes("admin") || lId.includes("snapshot")) {
    return {
      question: "How does SnapshotOS guarantee seamless content availability during severe uplink network failure?",
      questionNepali: "SnapshotOS ले पूर्ण इन्टरनेट विच्छेद हुँदा कसरी सेवा प्रवाह सुरक्षित राख्छ?",
      options: [
        "By displaying a friendly 404 offline error screen to readers",
        "By dynamically activating Tier 2 (IndexedDB/Edge Cache) and Tier 3 (Static JSON Continuity Pack)",
        "By forcing users to connect to a paid satellite uplink",
        "By terminating all active reader sessions immediately"
      ],
      correctIndex: 1,
      explanation: "SnapshotOS's 3-tier continuity automatically transitions the client from Live Firestore to local IndexedDB and the pre-rendered static continuity bundle with zero downtime.",
      governanceCode: "SOP-ARCH-03"
    };
  }

  // Default lesson quiz
  return {
    question: "What is the primary operational rule for completing this SanatanMarga professional competency lesson?",
    questionNepali: "यस तालिम पाठ सफलतापूर्वक सम्पन्न गर्नका लागि मुख्य प्रक्रिया के हो?",
    options: [
      "Reviewing all operational steps, verifying source accuracy, and adhering to institutional governance",
      "Skimming through text without verifying factual correctness",
      "Sharing access credentials with unauthorized external parties",
      "Bypassing editorial approval gates"
    ],
    correctIndex: 0,
    explanation: "True professional competency requires mastering the operational workflow, understanding governance implications, and successfully verifying comprehension.",
    governanceCode: "SOP-TRN-01"
  };
}

export default function LessonView({
  track,
  lesson,
  onBackToTracks,
  onSelectLesson,
  isCompleted,
  onToggleComplete,
  onOpenExam
}: LessonViewProps) {
  const currentLessonIndex = track.lessons.findIndex(l => l.id === lesson.id);
  const prevLesson = currentLessonIndex > 0 ? track.lessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < track.lessons.length - 1 ? track.lessons[currentLessonIndex + 1] : null;
  const isLastLesson = currentLessonIndex === track.lessons.length - 1;

  // In-Lesson Mini Quiz Assessment State
  const miniQuiz = getLessonMiniQuiz(lesson, track);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isQuizAnswered, setIsQuizAnswered] = useState<boolean>(false);

  // Reset quiz state when lesson changes
  React.useEffect(() => {
    setSelectedOption(null);
    setIsQuizAnswered(false);
  }, [lesson.id]);

  const isCorrectAnswer = selectedOption === miniQuiz.correctIndex;

  // Render workflow diagram if specified
  const renderDiagram = () => {
    switch (lesson.workflowDiagramType) {
      case "ecosystem":
        return <EcosystemArchitectureDiagram />;
      case "ai_pipeline":
        return <AINewsroomPipelineDiagram />;
      case "sgis":
        return <SGISPipelineDiagram />;
      case "rbac":
        return <RBACApprovalChainDiagram />;
      case "snapshot":
        return <SnapshotOSResilienceDiagram />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-theme dark:border-zinc-800">
        <button
          onClick={onBackToTracks}
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-text hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to All Tracks (सबै तालिम ट्रयाकहरू)</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-muted-text bg-muted-area dark:bg-zinc-900 px-3 py-1 rounded-full border border-border-theme dark:border-zinc-800">
            Track 0{track.number} • Lesson {currentLessonIndex + 1} of {track.lessons.length}
          </span>
          <button
            onClick={() => onToggleComplete(lesson.id)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isCompleted
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : "bg-primary text-white shadow-sm hover:bg-primary/90"
            }`}
          >
            <CheckCircle2 size={14} />
            <span>{isCompleted ? "Marked as Completed" : "Mark as Completed"}</span>
          </button>
        </div>
      </div>

      {/* Lesson Header Hero */}
      <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-br ${track.gradient} blur-3xl opacity-50 pointer-events-none rounded-full`} />

        <div className="space-y-3 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
              {track.title}
            </span>
            <span className="text-xs font-mono font-bold text-muted-text flex items-center gap-1 bg-muted-area dark:bg-zinc-900 px-2.5 py-1 rounded-lg border border-border-theme dark:border-zinc-800">
              <Clock size={12} />
              {lesson.durationMinutes} minutes duration
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-foreground dark:text-white tracking-tight">
            {lesson.title}
          </h1>
          <p className="text-base font-bold text-primary">
            {lesson.titleNepali}
          </p>

          <p className="text-sm text-muted-text dark:text-zinc-400 max-w-4xl leading-relaxed pt-1">
            {lesson.description}
          </p>
          <p className="text-xs text-muted-text/80 dark:text-zinc-500 italic">
            {lesson.descriptionNepali}
          </p>
        </div>
      </div>

      {/* Embedded Architectural Diagram (if applicable) */}
      {lesson.workflowDiagramType && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-text">
            <Layers size={14} className="text-primary" />
            <span>Interactive Operational Diagram</span>
          </div>
          {renderDiagram()}
        </div>
      )}

      {/* Learning Objectives & Key Takeaways Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Objectives */}
        <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary mb-4">
            <CheckCircle2 size={16} />
            <span>Learning Objectives (सिक्ने उद्देश्यहरू)</span>
          </div>
          <ul className="space-y-3">
            {lesson.learningObjectives.map((obj, idx) => (
              <li key={idx} className="text-xs sm:text-sm text-foreground dark:text-zinc-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-snug">{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Takeaways */}
        <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-500 mb-4">
            <Lightbulb size={16} />
            <span>Core Takeaways & Operational Principles</span>
          </div>
          <ul className="space-y-3">
            {lesson.keyTakeaways.map((takeaway, idx) => (
              <li key={idx} className="text-xs sm:text-sm text-foreground dark:text-zinc-200 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                <span className="leading-snug">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Annotated Feature Screenshot Placeholders & Deep Dives */}
      {lesson.annotatedFeatures && lesson.annotatedFeatures.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-foreground dark:text-white">
              <Sparkles size={16} className="text-purple-500" />
              <span>Annotated Feature Guides & UI Walkthrough</span>
            </div>
            <span className="text-xs text-muted-text font-mono">
              {lesson.annotatedFeatures.length} Feature Callouts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lesson.annotatedFeatures.map((feature, idx) => (
              <div 
                key={idx}
                className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-primary/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      {feature.tag}
                    </span>
                    {feature.uiSelectorHint && (
                      <span className="text-[9px] font-mono text-muted-text bg-muted-area dark:bg-zinc-900 px-2 py-0.5 rounded border border-border-theme dark:border-zinc-800">
                        {feature.uiSelectorHint}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-foreground dark:text-white mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-muted-text dark:text-zinc-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step-by-Step Practical Operator Guide */}
      <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border-theme dark:border-zinc-800">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Step-by-Step Operator Guide
            </span>
            <h3 className="text-xl font-black text-foreground dark:text-white mt-0.5">
              Practical Execution Workflow
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-muted-text bg-muted-area dark:bg-zinc-900 px-3 py-1 rounded-full border border-border-theme dark:border-zinc-800">
            {lesson.stepByStepGuide.length} Guided Steps
          </span>
        </div>

        <div className="space-y-4">
          {lesson.stepByStepGuide.map((step) => (
            <div 
              key={step.stepNumber}
              className="p-5 rounded-2xl bg-muted-area/40 dark:bg-zinc-900/50 border border-border-theme dark:border-zinc-800/80 space-y-2.5"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-primary text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm">
                  {step.stepNumber}
                </span>
                <h4 className="text-sm font-black text-foreground dark:text-white">
                  {step.title}
                </h4>
              </div>

              <p className="text-xs sm:text-sm text-muted-text dark:text-zinc-300 leading-relaxed pl-10">
                {step.instructions}
              </p>

              {step.proTip && (
                <div className="ml-10 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                  <Lightbulb size={14} className="shrink-0 mt-0.5 text-amber-500" />
                  <div>
                    <strong className="font-bold">Pro-Tip (सुझाव): </strong>
                    <span>{step.proTip}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Before / After Operational Comparison (if defined) */}
      {lesson.beforeAfterComparison && (
        <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
            <BookOpen size={16} />
            <span>Before & After Quality Benchmark</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before */}
            <div className="p-5 rounded-2xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 space-y-2">
              <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle size={14} />
                {lesson.beforeAfterComparison.beforeLabel}
              </span>
              <p className="text-xs sm:text-sm text-muted-text dark:text-zinc-300 leading-relaxed">
                {lesson.beforeAfterComparison.beforeText}
              </p>
            </div>

            {/* After */}
            <div className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-2">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                {lesson.beforeAfterComparison.afterLabel}
              </span>
              <p className="text-xs sm:text-sm text-foreground dark:text-zinc-200 leading-relaxed font-medium">
                {lesson.beforeAfterComparison.afterText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive In-Lesson Assessment (Mini Knowledge Check) */}
      <div className="bg-card dark:bg-slate-950 border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
        <div className="flex items-center justify-between gap-4 border-b border-border-theme dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <HelpCircle size={18} />
            </div>
            <div>
              <div className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <ShieldCheck size={12} />
                <span>Competency Verification Mini-Check • {miniQuiz.governanceCode}</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-foreground dark:text-white">
                ज्ञान परीक्षण (Interactive Lesson Comprehension Check)
              </h3>
            </div>
          </div>

          <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
            isQuizAnswered && isCorrectAnswer
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
              : "bg-muted-area text-muted-text border-border-theme"
          }`}>
            {isQuizAnswered && isCorrectAnswer ? "✓ Competency Verified" : "Required for Mastery"}
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-xs sm:text-sm font-bold text-foreground dark:text-zinc-100">
            {miniQuiz.question}
          </p>
          <p className="text-xs text-muted-text font-serif italic">
            {miniQuiz.questionNepali}
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {miniQuiz.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isThisCorrect = idx === miniQuiz.correctIndex;
            
            let btnStyle = "bg-muted-area/40 dark:bg-zinc-900/60 border-border-theme dark:border-zinc-800 text-foreground dark:text-zinc-200 hover:border-amber-500/40";
            if (isQuizAnswered) {
              if (isThisCorrect) {
                btnStyle = "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold ring-1 ring-emerald-500";
              } else if (isSelected && !isThisCorrect) {
                btnStyle = "bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 line-through";
              }
            } else if (isSelected) {
              btnStyle = "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 font-bold";
            }

            return (
              <button
                key={idx}
                disabled={isQuizAnswered && isCorrectAnswer}
                onClick={() => {
                  setSelectedOption(idx);
                  setIsQuizAnswered(true);
                  if (idx === miniQuiz.correctIndex) {
                    if (!isCompleted) {
                      onToggleComplete(lesson.id);
                    }
                  }
                }}
                className={`p-4 rounded-2xl border text-left text-xs transition-all flex items-start gap-3 cursor-pointer ${btnStyle}`}
              >
                <span className="w-5 h-5 rounded-full border border-current text-[11px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="leading-relaxed">{option}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback Explanation Alert */}
        {isQuizAnswered && (
          <div className={`p-4 rounded-2xl border text-xs space-y-1.5 transition-all ${
            isCorrectAnswer
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
          }`}>
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                {isCorrectAnswer ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
                {isCorrectAnswer ? "Correct Answer! Lesson Verified ✓" : "Incorrect selection. Review the explanation:"}
              </span>
              {!isCorrectAnswer && (
                <button
                  onClick={() => {
                    setIsQuizAnswered(false);
                    setSelectedOption(null);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/60 dark:bg-zinc-800 text-foreground font-bold hover:bg-white transition-colors"
                >
                  <RefreshCw size={12} /> Retry Question
                </button>
              )}
            </div>
            <p className="leading-relaxed opacity-90 pl-5">
              {miniQuiz.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Pagination & Exam Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-border-theme dark:border-zinc-800">
        <div>
          {prevLesson ? (
            <button
              onClick={() => onSelectLesson(prevLesson.id)}
              className="py-2.5 px-4 rounded-xl border border-border-theme dark:border-zinc-800 bg-card dark:bg-zinc-950 text-xs font-bold text-foreground dark:text-zinc-200 hover:border-primary/50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>Previous: {prevLesson.title.slice(0, 30)}...</span>
            </button>
          ) : (
            <button
              onClick={onBackToTracks}
              className="py-2.5 px-4 rounded-xl border border-border-theme dark:border-zinc-800 bg-card dark:bg-zinc-950 text-xs font-bold text-muted-text hover:text-foreground transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to Track List</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {nextLesson ? (
            <button
              onClick={() => {
                if (!isCompleted) onToggleComplete(lesson.id);
                onSelectLesson(nextLesson.id);
              }}
              className="py-2.5 px-5 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
            >
              <span>Next Lesson</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            track.associatedCertId && onOpenExam && (
              <button
                onClick={() => {
                  if (!isCompleted) onToggleComplete(lesson.id);
                  onOpenExam(track.associatedCertId!);
                }}
                className="py-2.5 px-5 rounded-xl bg-amber-500 text-white text-xs font-black hover:bg-amber-600 transition-all flex items-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Award size={16} />
                <span>Track Finished: Take Certification Exam!</span>
              </button>
            )
          )}
        </div>
      </div>

    </div>
  );
}
