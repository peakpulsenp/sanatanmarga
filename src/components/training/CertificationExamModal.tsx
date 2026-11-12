import React, { useState } from "react";
import { CertificationPath, QuizQuestion } from "./TrainingData";
import { trainingPersistence } from "@/src/services/trainingPersistenceService";
import { 
  X, 
  Award, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink,
  Printer,
  Sparkles,
  ArrowRight,
  GraduationCap
} from "lucide-react";

interface CertificationExamModalProps {
  certification: CertificationPath;
  onClose: () => void;
  onCertificateEarned: (certId: string) => void;
}

export default function CertificationExamModal({
  certification,
  onClose,
  onCertificateEarned
}: CertificationExamModalProps) {
  const [candidateName, setCandidateName] = useState<string>("SanatanMarga Practitioner");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [generatedCertId, setGeneratedCertId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [serverScore, setServerScore] = useState<number | null>(null);
  const [serverPassed, setServerPassed] = useState<boolean>(false);

  const totalQuestions = certification.questions.length;

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (submitted || isSubmitting) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const calculateScore = () => {
    let correct = 0;
    certification.questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswerIndex) {
        correct++;
      }
    });
    return {
      correct,
      total: totalQuestions,
      percentage: totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0
    };
  };

  const scoreResult = calculateScore();
  const passed = serverScore !== null ? serverPassed : (scoreResult.percentage >= certification.passingScorePercent);

  const handleSubmitExam = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      const currentUid = trainingPersistence.getCurrentUserId();
      // Step 1: Submit answers to server for authoritative grading
      const submitResp = await fetch("/api/training/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: certification.id,
          answers: selectedAnswers,
          userId: currentUid,
          userName: candidateName
        })
      });

      const submitData = await submitResp.json();
      if (!submitResp.ok || !submitData.success) {
        setSubmissionError(submitData.error || "Assessment submission rejected by server.");
        setIsSubmitting(false);
        return;
      }

      const attempt = submitData.attempt;
      setServerScore(attempt.scorePercent);
      setServerPassed(attempt.passed);
      setSubmitted(true);

      if (!attempt.passed) {
        setIsSubmitting(false);
        return;
      }

      // Step 2: Authoritative certificate issuance
      const issueResp = await fetch("/api/training/certificate/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certId: certification.id,
          userId: currentUid,
          userName: candidateName,
          userEmail: "candidate@sanatanmarga.com"
        })
      });

      const issueData = await issueResp.json();
      if (issueResp.ok && issueData.success && issueData.certificate?.id) {
        setGeneratedCertId(issueData.certificate.id);
        onCertificateEarned(certification.id);
      } else {
        setSubmissionError(issueData.error || "Official certificate issuance rejected by server.");
      }
    } catch (err: any) {
      console.error("[CertificationExamModal] Submission failure:", err);
      setSubmissionError(err.message || "Failed to communicate with training authority server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setGeneratedCertId(null);
    setSubmissionError(null);
    setServerScore(null);
    setServerPassed(false);
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const isAllAnswered = answeredCount === totalQuestions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-border-theme dark:border-zinc-800 flex items-center justify-between bg-muted-area/40 dark:bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-black">
              <Award size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {certification.code}
                </span>
                <span className="text-xs text-muted-text">Passing: {certification.passingScorePercent}%</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-foreground dark:text-white mt-0.5">
                {certification.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-text hover:text-foreground hover:bg-muted-area dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Candidate Name Input */}
          {!submitted && (
            <div className="bg-muted-area/40 dark:bg-zinc-900/40 p-4 rounded-2xl border border-border-theme dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-black text-foreground dark:text-white block">
                  Candidate Name for Credential Seal:
                </span>
                <span className="text-xs text-muted-text block">
                  This name will be inscribed upon passing the certification exam.
                </span>
              </div>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Your Full Name"
                className="px-4 py-2 bg-card dark:bg-zinc-950 border border-border-theme dark:border-zinc-800 rounded-xl text-xs sm:text-sm font-bold text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 w-full sm:w-64"
              />
            </div>
          )}

          {/* Result Banner if Submitted */}
          {submitted && (
            <div className={`p-6 rounded-3xl border ${
              passed 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${passed ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
                    {passed ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black">
                      {passed ? "Congratulations! You Passed!" : "Exam Not Passed"}
                    </h3>
                    <p className="text-xs mt-1">
                      Score: <strong>{scoreResult.percentage}%</strong> ({scoreResult.correct} of {scoreResult.total} correct) • Passing threshold: {certification.passingScorePercent}%
                    </p>
                  </div>
                </div>

                {!passed && (
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-2 hover:bg-rose-700 transition-all cursor-pointer"
                  >
                    <RefreshCw size={14} />
                    <span>Retake Exam</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Generated Certificate Display on Pass */}
          {submitted && passed && generatedCertId && (
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-500/40 rounded-3xl p-8 relative overflow-hidden shadow-2xl text-center space-y-5">
              <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                <ShieldCheck size={16} /> Official Cryptographic Verification Seal
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-widest font-mono text-muted-text">
                  SanatanMarga Platform Academy
                </h4>
                <h3 className="text-2xl sm:text-3xl font-black text-foreground dark:text-white mt-1">
                  Certificate of Competence & Operational Mastery
                </h3>
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {certification.title} ({certification.titleNepali})
                </p>
              </div>

              <div className="py-2">
                <span className="text-xs text-muted-text block">This certifies that</span>
                <span className="text-2xl font-black text-foreground dark:text-white border-b-2 border-amber-500/60 pb-1 px-4 inline-block mt-1">
                  {candidateName}
                </span>
                <span className="text-xs text-muted-text block mt-2">
                  has demonstrated rigorous command of editorial integrity, verification standards, and operational guidelines.
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-amber-500/20 text-xs font-mono">
                <div>
                  <span className="text-muted-text block">Credential ID:</span>
                  <span className="font-black text-foreground dark:text-white">{generatedCertId}</span>
                </div>
                <div>
                  <span className="text-muted-text block">Issue Date:</span>
                  <span className="font-black text-foreground dark:text-white">{new Date().toISOString().split("T")[0]}</span>
                </div>
                <div>
                  <span className="text-muted-text block">Status:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">HMAC-SHA256 VERIFIED</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <a
                  href={`/verify/${generatedCertId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-black flex items-center gap-2 hover:bg-amber-600 transition-all shadow-md shadow-amber-500/20"
                >
                  <ExternalLink size={14} />
                  <span>Verify on Public Portal (/verify)</span>
                </a>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl border border-border-theme dark:border-zinc-800 bg-card dark:bg-zinc-950 text-xs font-bold text-foreground dark:text-white flex items-center gap-2 hover:bg-muted-area transition-all cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Print Certificate</span>
                </button>
              </div>
            </div>
          )}

          {submissionError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle size={18} className="shrink-0 text-rose-500" />
              <div className="flex-1 font-bold">
                {submissionError}
              </div>
            </div>
          )}

          {/* Exam Questions List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs font-bold text-muted-text pb-2 border-b border-border-theme dark:border-zinc-800">
              <span>All Questions ({totalQuestions})</span>
              <span>Answered: {answeredCount} / {totalQuestions}</span>
            </div>

            {certification.questions.map((q, qIndex) => {
              const selectedOpt = selectedAnswers[q.id];
              const isCorrect = selectedOpt === q.correctAnswerIndex;

              return (
                <div 
                  key={q.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    submitted
                      ? isCorrect
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : "bg-rose-500/5 border-rose-500/30"
                      : "bg-muted-area/30 dark:bg-zinc-900/40 border-border-theme dark:border-zinc-800"
                  }`}
                >
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-black flex items-center justify-center">
                        {qIndex + 1}
                      </span>
                      <h4 className="text-sm font-black text-foreground dark:text-white">
                        {q.question}
                      </h4>
                    </div>
                    <p className="text-xs font-bold text-primary pl-8">
                      {q.questionNepali}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-2 pl-8">
                    {q.options.map((opt, optIndex) => {
                      const isOptionSelected = selectedOpt === optIndex;
                      const isOptionCorrect = q.correctAnswerIndex === optIndex;

                      let optStyle = "bg-card dark:bg-zinc-950 border-border-theme dark:border-zinc-800 hover:border-primary/40";
                      if (submitted) {
                        if (isOptionCorrect) {
                          optStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold";
                        } else if (isOptionSelected && !isOptionCorrect) {
                          optStyle = "bg-rose-500/10 border-rose-500 text-rose-800 dark:text-rose-300";
                        }
                      } else if (isOptionSelected) {
                        optStyle = "bg-primary/10 border-primary text-primary font-bold";
                      }

                      return (
                        <button
                          key={optIndex}
                          disabled={submitted}
                          onClick={() => handleSelectOption(q.id, optIndex)}
                          className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 cursor-pointer ${optStyle}`}
                        >
                          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {String.fromCharCode(65 + optIndex)}
                          </span>
                          <div>
                            <span className="block text-foreground dark:text-zinc-200">{opt}</span>
                            {q.optionsNepali && q.optionsNepali[optIndex] && (
                              <span className="block text-[11px] text-muted-text mt-0.5">{q.optionsNepali[optIndex]}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation after submission */}
                  {submitted && (
                    <div className="mt-4 ml-8 p-3 rounded-xl bg-card dark:bg-zinc-950 border border-border-theme dark:border-zinc-800 text-xs text-muted-text space-y-1">
                      <strong className="font-bold text-foreground dark:text-white block">Explanation (स्पष्टीकरण):</strong>
                      <p>{q.explanation}</p>
                      <p className="italic text-[11px] text-muted-text">{q.explanationNepali}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-border-theme dark:border-zinc-800 bg-muted-area/40 dark:bg-zinc-900/60 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-muted-text hover:text-foreground cursor-pointer"
          >
            Close Window
          </button>

          {!submitted ? (
            <button
              disabled={!isAllAnswered || isSubmitting}
              onClick={handleSubmitExam}
              className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-black disabled:opacity-40 hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Verifying & Issuing Credential...</span>
                </>
              ) : (
                <>
                  <span>Submit Exam ({answeredCount}/{totalQuestions} Answered)</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-foreground text-background dark:bg-white dark:text-zinc-900 text-xs font-black cursor-pointer"
            >
              Finish & Return
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
