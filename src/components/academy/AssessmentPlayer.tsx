import React, { useState, useEffect } from "react";
import { 
  Award, Clock, CheckCircle2, AlertCircle, HelpCircle, ChevronLeft, 
  ChevronRight, RefreshCw, FileText, Download, ShieldCheck, Sparkles, AlertTriangle
} from "lucide-react";
import { CourseQuestion, AssessmentConfig } from "@/src/types/assessment";
import { useAuth } from "@/src/lib/auth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";

interface AssessmentPlayerProps {
  courseId: string;
  courseTitle: string;
  onExamComplete?: (score: number, passed: boolean) => void;
}

export default function AssessmentPlayer({ courseId, courseTitle, onExamComplete }: AssessmentPlayerProps) {
  const { user } = useAuth();

  const [step, setStep] = useState<"briefing" | "taking" | "results">("briefing");
  const [config, setConfig] = useState<AssessmentConfig | null>(null);
  const [questions, setQuestions] = useState<CourseQuestion[]>([]);
  const [attemptId, setAttemptId] = useState<string>("");
  const [attemptNumber, setAttemptNumber] = useState<number>(1);

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900); // 15 mins default

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resultData, setResultData] = useState<any>(null);

  // Load Assessment Config on mount
  useEffect(() => {
    fetchConfig();
  }, [courseId]);

  // Countdown timer during exam
  useEffect(() => {
    if (step !== "taking") return;
    if (secondsRemaining <= 0) {
      toast.warning("समय समाप्त भयो! परीक्षा स्वचालित रूपमा बुझाइँदैछ...");
      handleSubmitExam();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [step, secondsRemaining]);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/assessment/config`);
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
      }
    } catch (e) {
      console.error("Config fetch error", e);
    }
  };

  const handleStartExam = async () => {
    if (!user) {
      toast.info("परीक्षा दिन कृपया लगइन गर्नुहोस्");
      return;
    }

    try {
      const res = await fetch(`/api/courses/${courseId}/assessment/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          userName: user.displayName || user.email?.split("@")[0] || "विद्यार्थी"
        })
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "परीक्षा सुरु गर्न सकिएन");
        return;
      }

      setAttemptId(data.attemptId);
      setAttemptNumber(data.attemptNumber || 1);
      setQuestions(data.questions || []);
      setSecondsRemaining((data.timeLimitMinutes || 15) * 60);
      setUserAnswers({});
      setCurrentIdx(0);
      setStep("taking");
      toast.success("अन्तिम परीक्षा सुरु भयो! शुभ-कामना!");
    } catch (e: any) {
      toast.error("प्रणाली त्रुटि: " + e.message);
    }
  };

  const handleOptionSelect = (qId: string, optId: string) => {
    setUserAnswers({ ...userAnswers, [qId]: optId });
  };

  const handleSubmitExam = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/courses/${courseId}/assessment/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          userAnswers,
          userId: user?.uid,
          studentName: user?.displayName || user?.email?.split("@")[0] || "विद्यार्थी",
          courseTitle
        })
      });

      const data = await res.json();
      if (data.success) {
        setResultData(data);
        setStep("results");
        if (onExamComplete) {
          onExamComplete(data.percentage, data.passed);
        }
        if (data.passed) {
          toast.success(`बधाई छ! तपाईंले ${data.percentage}% प्राप्ताङ्क प्राप्त गरी परीक्षा उत्तीर्ण गर्नुभयो!`);
        } else {
          toast.error(`परीक्षा पूरा भयो। प्राप्ताङ्क: ${data.percentage}% (उत्तीर्णाङ्क: ${config?.passingScore || 70}%)`);
        }
      } else {
        toast.error("परीक्षा बुझाउन त्रुटि भयो: " + (data.error || "अज्ञात त्रुटि"));
      }
    } catch (e: any) {
      toast.error("प्रणाली त्रुटि: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="bg-card border border-border-theme rounded-3xl p-6 md:p-8 space-y-6 shadow-sm relative overflow-hidden">
      {/* BRIEFING STAGE */}
      {step === "briefing" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-border-theme pb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Award size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                आधिकारिक योग्यता परीक्षा (Final Assessment)
              </span>
              <h2 className="text-xl font-black text-card-foreground mt-1">
                {courseTitle} - अन्तिम परीक्षा
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-muted-area/50 border border-border-theme space-y-1">
              <span className="text-muted-text font-bold">उत्तीर्णाङ्क (Pass Score):</span>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {config?.passingScore || 70}%
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-muted-area/50 border border-border-theme space-y-1">
              <span className="text-muted-text font-bold">प्रश्न सङ्ख्या:</span>
              <div className="text-base font-black text-card-foreground">
                {config?.questionCount || 5} वटा
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-muted-area/50 border border-border-theme space-y-1">
              <span className="text-muted-text font-bold">समय सीमा:</span>
              <div className="text-base font-black text-card-foreground">
                {config?.timeLimitMinutes || 15} मिनेट
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-muted-area/50 border border-border-theme space-y-1">
              <span className="text-muted-text font-bold">अधिकतम प्रयास:</span>
              <div className="text-base font-black text-card-foreground">
                {config?.maxAttempts || 3} पटक
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-card-foreground space-y-2">
            <div className="font-black flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <ShieldCheck size={16} />
              <span>परीक्षा निर्देशन तथा सुरक्षा नियमहरू:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-muted-text font-medium leading-relaxed">
              <li>यो परीक्षा सर्व-अधिकार सम्पन्न सर्भर-ग्रेड स्वचालित उत्तर प्रणालीबाट जाँच गरिन्छ।</li>
              <li>परीक्षा उत्तीर्ण भएपश्चात् तपाईंका नाममा डिजिटल HMAC cryptographic HMAC-SHA256 प्रमाणपत्र जारी हुनेछ।</li>
              <li>सबै प्रश्नका विकल्पहरू छानेपछि मात्र 'परीक्षा बुझाउनुहोस्' मा क्लिक गर्नुहोस्।</li>
            </ul>
          </div>

          <button
            onClick={handleStartExam}
            className="w-full py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all cursor-pointer"
          >
            <Sparkles size={16} />
            <span>अन्तिम परीक्षा सुरु गर्नुहोस् (Start Final Assessment)</span>
          </button>
        </div>
      )}

      {/* TAKING STAGE */}
      {step === "taking" && questions.length > 0 && (
        <div className="space-y-6">
          {/* Exam Header bar */}
          <div className="flex items-center justify-between border-b border-border-theme pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-card-foreground">
                प्रश्न {currentIdx + 1} / {questions.length}
              </span>
              <span className="text-xs text-muted-text font-bold">• प्रयास #{attemptNumber}</span>
            </div>

            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-black text-xs ${
              secondsRemaining < 120
                ? "bg-rose-500/10 border-rose-500/30 text-rose-600 animate-pulse"
                : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
            }`}>
              <Clock size={14} />
              <span>बाँकी समय: {formatTime(secondsRemaining)}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full bg-muted-area overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Card */}
          {questions[currentIdx] && (
            <div className="space-y-4">
              <h3 className="text-base font-black text-card-foreground leading-snug">
                {currentIdx + 1}. {questions[currentIdx].question}
              </h3>

              {/* Options */}
              <div className="space-y-2.5">
                {questions[currentIdx].options?.map((opt) => {
                  const isSelected = userAnswers[questions[currentIdx].id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionSelect(questions[currentIdx].id, opt.id)}
                      className={`w-full p-4 rounded-2xl text-left text-xs font-bold border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 border-primary text-primary shadow-sm"
                          : "bg-muted-area/50 border-border-theme hover:bg-muted-area text-card-foreground"
                      }`}
                    >
                      <span>{opt.text}</span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? "border-primary bg-primary text-white" : "border-border-theme"
                      }`}>
                        {isSelected && <CheckCircle2 size={12} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-border-theme">
            <button
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2.5 rounded-xl bg-muted-area text-card-foreground font-bold text-xs flex items-center gap-1 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>अघिल्लो</span>
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                className="px-5 py-2.5 rounded-xl bg-primary text-white font-black text-xs flex items-center gap-1 shadow-md shadow-primary/20 hover:bg-primary/90 cursor-pointer"
              >
                <span>पछिल्लो</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>परीक्षा बुझाउनुहोस् (Submit Exam)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* RESULTS STAGE */}
      {step === "results" && resultData && (
        <div className="space-y-6 text-center">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center border-4 shadow-xl ${
            resultData.passed
              ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-emerald-500/20"
              : "bg-rose-500/10 border-rose-500 text-rose-500 shadow-rose-500/20"
          }`}>
            {resultData.passed ? <Award size={40} /> : <AlertTriangle size={40} />}
          </div>

          <div>
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              resultData.passed
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
            }`}>
              {resultData.passed ? "परीक्षा उत्तीर्ण (Assessment Passed)" : "पुनः प्रयास आवश्यक (Retake Needed)"}
            </span>

            <h2 className="text-3xl font-black text-card-foreground mt-2">
              {resultData.percentage}% प्राप्ताङ्क
            </h2>
            <p className="text-xs text-muted-text font-bold mt-1">
              ग्रेड: <span className="text-primary font-black">{resultData.grade}</span> • मिलेको उत्तर: {resultData.score} / {resultData.total}
            </p>
          </div>

          {resultData.passed && resultData.certificate && (
            <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-card-foreground space-y-3">
              <div className="text-xs font-black text-amber-600 dark:text-amber-400">
                🎉 बधाई छ! तपाईंको नाममा HMAC Cryptographically Signed डिजिटल प्रमाणपत्र तयार भयो!
              </div>
              <p className="text-xs text-muted-text">
                प्रमाणपत्र कोड: <code className="font-mono bg-muted-area px-2 py-0.5 rounded text-card-foreground font-bold">{resultData.certificate.certId}</code>
              </p>
              <Link
                to={`/verify-certificate/${resultData.certificate.certId}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Download size={14} />
                <span>प्रमाणपत्र डाउनलोड तथा रुजु गर्नुहोस्</span>
              </Link>
            </div>
          )}

          {/* Detailed Feedback Review */}
          {resultData.detailedFeedback && resultData.detailedFeedback.length > 0 && (
            <div className="text-left space-y-3 pt-4 border-t border-border-theme">
              <h4 className="text-xs font-black text-card-foreground">उत्तर समीक्षा (Answer Review):</h4>
              <div className="space-y-2">
                {resultData.detailedFeedback.map((fb: any, i: number) => (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl border text-xs space-y-1 ${
                      fb.isCorrect
                        ? "bg-emerald-500/5 border-emerald-500/30 text-card-foreground"
                        : "bg-rose-500/5 border-rose-500/30 text-card-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>प्रश्न #{i + 1}</span>
                      <span className={fb.isCorrect ? "text-emerald-500 font-black" : "text-rose-500 font-black"}>
                        {fb.isCorrect ? "सही उत्तर ✓" : "गलत उत्तर ✗"}
                      </span>
                    </div>
                    {fb.explanation && (
                      <p className="text-[11px] text-muted-text leading-relaxed">
                        व्याख्या: {fb.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => setStep("briefing")}
              className="px-6 py-2.5 rounded-xl bg-muted-area text-card-foreground font-bold text-xs hover:bg-muted-area/80 transition-colors"
            >
              पुनः सुरु गर्नुहोस् (Retake Assessment)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
