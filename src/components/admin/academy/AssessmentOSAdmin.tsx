import React, { useState, useEffect } from "react";
import { 
  Sparkles, CheckCircle2, AlertCircle, Plus, Trash2, Edit3, 
  Settings, Award, HelpCircle, FileText, Bot, RefreshCw, Filter, Clock, ChevronRight,
  BarChart2, AlertTriangle, ShieldCheck
} from "lucide-react";
import { CourseQuestion, AssessmentConfig, CourseRanking } from "@/src/types/assessment";
import { SAMPLE_COURSES, Course } from "@/src/pages/AcademyPage";
import { SAMPLE_QUESTIONS } from "@/src/data/sampleQuestions";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export default function AssessmentOSAdmin() {
  const [courses] = useState<Course[]>(SAMPLE_COURSES);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(SAMPLE_COURSES[0].id);

  const [questions, setQuestions] = useState<CourseQuestion[]>([]);
  const [config, setConfig] = useState<AssessmentConfig>({
    courseId: selectedCourseId,
    passingScore: 70,
    questionCount: 5,
    timeLimitMinutes: 15,
    maxAttempts: 3,
    randomizeQuestions: true,
    randomizeOptions: true,
    showCorrectAnswersAfterSubmit: true,
    allowRetake: true,
    certificateRequired: true
  });

  const [rankings, setRankings] = useState<CourseRanking[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"questions" | "ai_generator" | "config" | "rankings" | "analytics">("questions");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "draft">("all");
  const [loading, setLoading] = useState<boolean>(false);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  // Manual Question Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<CourseQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState({
    question: "",
    type: "mcq" as "mcq" | "true_false",
    optA: "",
    optB: "",
    optC: "",
    optD: "",
    correctAnswer: "opt-a",
    explanation: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    lessonTitle: "पाठ १: परिचय"
  });

  // AI Generator state
  const [aiForm, setAiForm] = useState({
    lessonTitle: "पाठ १: श्रीमद्भगवद्गीता परिचय र दर्शन",
    lessonContent: "भगवद्गीता महाभारतको भीष्म पर्व अन्तर्गत पर्दछ। यसमा १८ अध्याय र ७०० श्लोकहरू रहेका छन्। अर्जुनको विषाद शान्त पार्न श्रीकृष्णले कर्मयोग, ज्ञानयोग र भक्तियोगको उपदेश दिनुभएको थियो। 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन' गीताको मूल सन्देश हो।",
    count: 3,
    difficulty: "medium" as "easy" | "medium" | "hard"
  });

  // Fetch Questions, Config, Rankings
  useEffect(() => {
    loadCourseData(selectedCourseId);
  }, [selectedCourseId]);

  const loadCourseData = async (cId: string) => {
    setLoading(true);
    try {
      // 1. Fetch Config
      const confRes = await fetch(`/api/courses/${cId}/assessment/config`);
      const confData = await confRes.json();
      if (confData.success && confData.config) {
        setConfig(confData.config);
      }

      // 2. Fetch Questions
      const qRes = await fetch(`/api/courses/${cId}/questions`);
      const qData = await qRes.json();
      if (qData.success && qData.questions && qData.questions.length > 0) {
        setQuestions(qData.questions);
      } else {
        // Fallback to sample questions for demo if empty
        const samples = SAMPLE_QUESTIONS.filter(q => q.courseId === cId || cId === "gita-intro");
        setQuestions(samples);
      }

      // 3. Fetch Rankings
      const rankRes = await fetch(`/api/courses/${cId}/rankings`);
      const rankData = await rankRes.json();
      if (rankData.success && rankData.rankings) {
        setRankings(rankData.rankings);
      }

      // 4. Fetch Analytics
      const analyticsRes = await fetch(`/api/courses/${cId}/assessment/analytics`);
      const analyticsData = await analyticsRes.json();
      if (analyticsData.success && analyticsData.analytics) {
        setAnalytics(analyticsData.analytics);
      }
    } catch (e) {
      console.error("Failed loading course data", e);
      setQuestions(SAMPLE_QUESTIONS);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      const res = await fetch(`/api/courses/${selectedCourseId}/assessment/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("परीक्षा नियमावली र सेटिङहरू बचत भयो!");
      } else {
        toast.error("सेटिङ बचत गर्दा त्रुटि भयो");
      }
    } catch (e) {
      toast.error("प्रणाली त्रुटि");
    }
  };

  const handleApproveQuestion = async (qId: string) => {
    try {
      const res = await fetch(`/api/courses/${selectedCourseId}/questions/${qId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("प्रश्न स्वीकृत (Approved) भयो!");
        setQuestions(questions.map(q => q.id === qId ? { ...q, status: "approved" } : q));
      }
    } catch (e) {
      toast.error("स्वीकृति विफल भयो");
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm("के तपाईं यो प्रश्न हटाउन चाहनुहुन्छ?")) return;
    try {
      const res = await fetch(`/api/courses/${selectedCourseId}/questions/${qId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        toast.success("प्रश्न हटाइयो");
        setQuestions(questions.filter(q => q.id !== qId));
      }
    } catch (e) {
      toast.error("हटाउँदा त्रुटि भयो");
    }
  };

  const handleSaveManualQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.question.trim()) {
      toast.error("कृपया प्रश्न लेख्नुहोस्");
      return;
    }

    const payload = {
      courseId: selectedCourseId,
      type: questionForm.type,
      question: questionForm.question,
      options: [
        { id: "opt-a", text: questionForm.optA || "विकल्प क" },
        { id: "opt-b", text: questionForm.optB || "विकल्प ख" },
        { id: "opt-c", text: questionForm.optC || "विकल्प ग" },
        { id: "opt-d", text: questionForm.optD || "विकल्प घ" }
      ],
      correctAnswer: questionForm.correctAnswer,
      explanation: questionForm.explanation,
      difficulty: questionForm.difficulty,
      lessonTitle: questionForm.lessonTitle,
      status: "approved",
      source: "manual",
      createdBy: "प्रशासक (Admin)"
    };

    try {
      const res = await fetch(`/api/courses/${selectedCourseId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.question) {
        toast.success("नयाँ प्रश्न बैंकमा थपियो!");
        setQuestions([data.question, ...questions]);
        setIsModalOpen(false);
      }
    } catch (e) {
      toast.error("प्रश्न सिर्जना गर्दा त्रुटि भयो");
    }
  };

  const handleGenerateAiQuestions = async () => {
    if (!aiForm.lessonContent.trim()) {
      toast.error("कृपया पाठको विषयवस्तु वा ट्रान्सक्रिप्ट प्रविष्ट गर्नुहोस्");
      return;
    }

    setIsAiGenerating(true);
    try {
      const res = await fetch(`/api/courses/${selectedCourseId}/questions/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonTitle: aiForm.lessonTitle,
          lessonContent: aiForm.lessonContent,
          count: Number(aiForm.count),
          difficulty: aiForm.difficulty
        })
      });
      const data = await res.json();
      if (data.success && data.questions) {
        toast.success(data.message || "AI प्रश्नहरू सिर्जना भयो! कृपया समीक्षा गर्नुहोस्।");
        setQuestions([...data.questions, ...questions]);
        setActiveTab("questions");
        setStatusFilter("draft");
      } else {
        toast.error("AI प्रश्न सिर्जना विफल भयो: " + (data.error || "अज्ञात त्रुटि"));
      }
    } catch (e: any) {
      toast.error("प्रणाली त्रुटि: " + e.message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (statusFilter === "approved") return q.status === "approved";
    if (statusFilter === "draft") return q.status === "draft";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border-theme shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/20">
              ExamOS & Assessment Operating System
            </span>
            <span className="text-xs text-muted-text font-bold">• E-Academy Governance</span>
          </div>
          <h1 className="text-2xl font-black text-card-foreground mt-1">
            परीक्षा, प्रश्न बैंक तथा AI प्रश्न निष्कर्षण
          </h1>
          <p className="text-xs text-muted-text mt-0.5">
            पाठ्यक्रम परीक्षा नियमावली, प्रश्न बैङ्किङ, AI स्वचालित प्रश्न उत्पादन र विद्यार्थी नतिजा व्यवस्थापन।
          </p>
        </div>

        {/* Course Select Dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          <label className="text-xs font-bold text-muted-text">कोर्स चयन:</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground text-xs font-bold focus:outline-none focus:border-primary"
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.titleNepali}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-theme pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("questions")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "questions"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-card border border-border-theme text-muted-text hover:text-card-foreground"
            }`}
          >
            <HelpCircle size={15} />
            <span>प्रश्न बैंक ({questions.length})</span>
            {questions.some(q => q.status === "draft") && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("ai_generator")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "ai_generator"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-card border border-border-theme text-muted-text hover:text-card-foreground"
            }`}
          >
            <Bot size={15} />
            <span>AI प्रश्न उत्पादन (Gemini 3.7)</span>
          </button>

          <button
            onClick={() => setActiveTab("config")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "config"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-card border border-border-theme text-muted-text hover:text-card-foreground"
            }`}
          >
            <Settings size={15} />
            <span>परीक्षा सेटिङ नियमावली</span>
          </button>

          <button
            onClick={() => setActiveTab("rankings")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "rankings"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-card border border-border-theme text-muted-text hover:text-card-foreground"
            }`}
          >
            <Award size={15} />
            <span>विद्यार्थी श्रेणी तथा नतिजा</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "analytics"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-card border border-border-theme text-muted-text hover:text-card-foreground"
            }`}
          >
            <BarChart2 size={15} />
            <span>Assessment AnalyticsOS</span>
          </button>
        </div>

        {activeTab === "questions" && (
          <button
            onClick={() => {
              setEditingQuestion(null);
              setQuestionForm({
                question: "",
                type: "mcq",
                optA: "",
                optB: "",
                optC: "",
                optD: "",
                correctAnswer: "opt-a",
                explanation: "",
                difficulty: "medium",
                lessonTitle: "पाठ १: परिचय"
              });
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-black flex items-center gap-1.5 hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer shrink-0"
          >
            <Plus size={15} />
            <span>नयाँ प्रश्न थप्नुहोस्</span>
          </button>
        )}
      </div>

      {/* TAB 1: QUESTION BANK */}
      {activeTab === "questions" && (
        <div className="space-y-4">
          {/* Subfilter */}
          <div className="flex items-center justify-between gap-4 bg-muted-area/40 p-3 rounded-2xl border border-border-theme text-xs font-bold">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-muted-text" />
              <span className="text-muted-text">फिल्टर:</span>
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-lg transition-all ${statusFilter === "all" ? "bg-card text-card-foreground shadow-sm" : "text-muted-text hover:text-card-foreground"}`}
              >
                सबै ({questions.length})
              </button>
              <button
                onClick={() => setStatusFilter("approved")}
                className={`px-3 py-1 rounded-lg transition-all ${statusFilter === "approved" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black" : "text-muted-text hover:text-card-foreground"}`}
              >
                स्वीकृत (Approved) ({questions.filter(q => q.status === "approved").length})
              </button>
              <button
                onClick={() => setStatusFilter("draft")}
                className={`px-3 py-1 rounded-lg transition-all ${statusFilter === "draft" ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black" : "text-muted-text hover:text-card-foreground"}`}
              >
                AI ड्राफ्ट/समीक्षा बाँकी ({questions.filter(q => q.status === "draft").length})
              </button>
            </div>

            <button
              onClick={() => loadCourseData(selectedCourseId)}
              className="p-1.5 rounded-lg text-muted-text hover:text-card-foreground transition-colors"
              title="पुनः लोड गर्नुहोस्"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="bg-card border border-border-theme rounded-3xl p-12 text-center space-y-3">
              <HelpCircle size={36} className="mx-auto text-muted-text/50" />
              <div className="text-sm font-bold text-card-foreground">प्रश्न बैंकमा प्रश्नहरू फेला परेनन्</div>
              <p className="text-xs text-muted-text max-w-md mx-auto">
                नयाँ प्रश्न म्यानुअल तरिकाले थप्नुहोस् वा AI Generator प्रयोग गरी पाठ्यपुस्तक वा ट्रान्सक्रिप्टबाट स्वचालित प्रश्नहरू निष्कर्षण गर्नुहोस्।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredQuestions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className={`bg-card border rounded-3xl p-5 space-y-4 shadow-sm relative transition-all ${
                    q.status === "draft" ? "border-amber-500/40 bg-amber-500/5" : "border-border-theme"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        q.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-black"
                      }`}>
                        {q.status === "approved" ? "स्वीकृत (Approved)" : "ड्राफ्ट / AI समीक्षा बाँकी"}
                      </span>

                      <span className="px-2 py-0.5 rounded-md bg-muted-area text-muted-text text-[10px] font-bold">
                        {q.difficulty === "easy" ? "सजिलो" : q.difficulty === "medium" ? "मध्यम" : "कठिन"}
                      </span>

                      <span className="text-[10px] text-muted-text font-bold">
                        स्रोत: {q.source === "ai_extracted" ? "AI (Gemini)" : "म्यानुअल"}
                      </span>

                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-black">
                        v{q.version || 1}
                      </span>

                      {q.model && (
                        <span className="px-1.5 py-0.5 rounded bg-muted-area text-muted-text text-[9px] font-mono">
                          {q.model}
                        </span>
                      )}

                      {q.sourceType && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-bold flex items-center gap-1">
                          🎥 {q.lessonTitle || "पाठ"} ({q.sourceTimestampStart || "00:00"} - {q.sourceTimestampEnd || "05:00"})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {q.status === "draft" && (
                        <button
                          onClick={() => handleApproveQuestion(q.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-[10px] hover:bg-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
                          title="स्वीकृत गर्नुहोस्"
                        >
                          <CheckCircle2 size={12} />
                          <span>स्वीकृत</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="हटाउनुहोस्"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider">{q.lessonTitle || "पाठ्यसामग्री"}</span>
                    <h3 className="text-sm font-black text-card-foreground mt-0.5 leading-snug">
                      {idx + 1}. {q.question}
                    </h3>
                  </div>

                  {/* Options List */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
                      {q.options.map(opt => {
                        const isCorrect = opt.id === q.correctAnswer;
                        return (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                              isCorrect
                                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold"
                                : "bg-muted-area/50 border-border-theme text-muted-text"
                            }`}
                          >
                            <span>{opt.text}</span>
                            {isCorrect && <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="text-[11px] text-muted-text bg-muted-area/60 p-2.5 rounded-xl border border-border-theme">
                      <span className="font-bold text-card-foreground">व्याख्या: </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI QUESTION GENERATOR */}
      {activeTab === "ai_generator" && (
        <div className="bg-card border border-border-theme rounded-3xl p-6 md:p-8 space-y-6 shadow-sm max-w-3xl">
          <div className="flex items-center gap-3 border-b border-border-theme pb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-card-foreground">
                AI स्वचालित प्रश्न निष्कर्षण प्रणाली (Gemini 3.7 Flash)
              </h2>
              <p className="text-xs text-muted-text">
                पाठको पाठ्यपुस्तक सामग्री वा भिडियो ट्रान्सक्रिप्टबाट आधिकारिक प्रश्नहरू सिर्जना गर्नुहोस्। उत्पादित प्रश्नहरू मानव समीक्षा (Human Review) पश्चात् मात्र स्वीकृत हुनेछन्।
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-card-foreground mb-1.5">
                पाठको शीर्षक (Lesson Title):
              </label>
              <input
                type="text"
                value={aiForm.lessonTitle}
                onChange={(e) => setAiForm({ ...aiForm, lessonTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground text-xs font-bold focus:outline-none focus:border-primary"
                placeholder="उदा. पाठ ३: कर्मयोग र जीवन दर्शन"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-card-foreground mb-1.5">
                पाठ्य सामग्री वा ट्रान्सक्रिप्ट (Lesson Text / Transcript):
              </label>
              <textarea
                rows={6}
                value={aiForm.lessonContent}
                onChange={(e) => setAiForm({ ...aiForm, lessonContent: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-muted-area border border-border-theme text-card-foreground text-xs font-medium focus:outline-none focus:border-primary leading-relaxed"
                placeholder="यहाँ पाठ्यपुस्तकका अध्याय, श्लोकको व्याख्या वा भिडियोको ट्रान्सक्रिप्ट टाँस्नुहोस्..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-card-foreground mb-1.5">
                  प्रश्न सङ्ख्या (Number of Questions):
                </label>
                <select
                  value={aiForm.count}
                  onChange={(e) => setAiForm({ ...aiForm, count: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground text-xs font-bold focus:outline-none focus:border-primary"
                >
                  <option value={3}>३ वटा प्रश्न</option>
                  <option value={5}>५ वटा प्रश्न</option>
                  <option value={10}>१० वटा प्रश्न</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-card-foreground mb-1.5">
                  कठिनाई स्तर (Difficulty Level):
                </label>
                <select
                  value={aiForm.difficulty}
                  onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground text-xs font-bold focus:outline-none focus:border-primary"
                >
                  <option value="easy">सजिलो (Easy)</option>
                  <option value="medium">मध्यम (Medium)</option>
                  <option value="hard">कठिन (Hard)</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleGenerateAiQuestions}
                disabled={isAiGenerating}
                className="w-full py-3.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isAiGenerating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Gemini AI द्वारा विश्लेषण तथा प्रश्न उत्पादन हुँदैछ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>AI प्रश्न निष्कर्षण गर्नुहोस् (Extract Questions)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ASSESSMENT CONFIG */}
      {activeTab === "config" && (
        <div className="bg-card border border-border-theme rounded-3xl p-6 md:p-8 space-y-6 shadow-sm max-w-3xl">
          <div className="flex items-center gap-3 border-b border-border-theme pb-4">
            <Settings size={22} className="text-primary shrink-0" />
            <div>
              <h2 className="text-lg font-black text-card-foreground">
                परीक्षा नियमावली र मानक सेटिङहरू (Assessment Governance)
              </h2>
              <p className="text-xs text-muted-text">
                उत्तीर्णाङ्क (Passing Score), समय सीमा, अधिकतम प्रयास सङ्ख्या र प्रमाणपत्र सर्तहरू सेट गर्नुहोस्।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-bold text-card-foreground mb-1.5">
                उत्तीर्णाङ्क % (Passing Score Percentage):
              </label>
              <input
                type="number"
                min={40}
                max={100}
                value={config.passingScore}
                onChange={(e) => setConfig({ ...config, passingScore: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground font-bold focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-card-foreground mb-1.5">
                परीक्षामा सोधिने प्रश्न सङ्ख्या (Question Count):
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={config.questionCount}
                onChange={(e) => setConfig({ ...config, questionCount: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground font-bold focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-card-foreground mb-1.5">
                समय सीमा - मिनेट (Time Limit Minutes):
              </label>
              <input
                type="number"
                min={5}
                max={180}
                value={config.timeLimitMinutes}
                onChange={(e) => setConfig({ ...config, timeLimitMinutes: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground font-bold focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-card-foreground mb-1.5">
                अधिकतम प्रयास सीमा (Max Allowed Attempts):
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={config.maxAttempts}
                onChange={(e) => setConfig({ ...config, maxAttempts: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-card-foreground font-bold focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-border-theme">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.randomizeQuestions}
                onChange={(e) => setConfig({ ...config, randomizeQuestions: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <span className="text-xs font-bold text-card-foreground">प्रश्नहरूको क्रम र्‍यान्डम (Randomize Question Order) गर्ने</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showCorrectAnswersAfterSubmit}
                onChange={(e) => setConfig({ ...config, showCorrectAnswersAfterSubmit: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <span className="text-xs font-bold text-card-foreground">परीक्षा बुझाएपछि उत्तर र व्याख्या देखाउने (Show Answer Review)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.certificateRequired}
                onChange={(e) => setConfig({ ...config, certificateRequired: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <span className="text-xs font-bold text-card-foreground">परीक्षा उत्तीर्ण गरेपछि मात्र HMAC डिजिटल प्रमाणपत्र अनलक हुने</span>
            </label>
          </div>

          <div className="pt-4">
            <button
              onClick={handleSaveConfig}
              className="px-6 py-3 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-wider hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer"
            >
              नियमावली सेटिङ बचत गर्नुहोस्
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: RANKINGS & LEADERBOARD */}
      {activeTab === "rankings" && (
        <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-theme pb-4">
            <div>
              <h2 className="text-lg font-black text-card-foreground">
                कोर्स श्रेणी बोर्ड तथा परीक्षा प्रयास इतिहास (Leaderboard)
              </h2>
              <p className="text-xs text-muted-text">
                विद्यार्थीको प्राप्ताङ्क, परीक्षा अवधि, प्रयास सङ्ख्या र श्रेणीक्रम।
              </p>
            </div>
          </div>

          {rankings.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-text font-bold">
              अहिलेसम्म कुनै विद्यार्थीले परीक्षा दिएका छैनन्।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border-theme text-muted-text font-bold">
                    <th className="py-3 px-4">श्रेणी (Rank)</th>
                    <th className="py-3 px-4">विद्यार्थी नाम</th>
                    <th className="py-3 px-4">प्राप्ताङ्क (%)</th>
                    <th className="py-3 px-4">ग्रेड</th>
                    <th className="py-3 px-4">प्रयास सङ्ख्या</th>
                    <th className="py-3 px-4">अवधि</th>
                    <th className="py-3 px-4">मिति</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-theme/50 font-medium text-card-foreground">
                  {rankings.map((r, i) => (
                    <tr key={i} className="hover:bg-muted-area/50 transition-colors">
                      <td className="py-3 px-4 font-black">
                        {r.rank === 1 ? "🥇 #1" : r.rank === 2 ? "🥈 #2" : r.rank === 3 ? "🥉 #3" : `#${r.rank}`}
                      </td>
                      <td className="py-3 px-4 font-bold">{r.userName || "विद्यार्थी"}</td>
                      <td className="py-3 px-4 font-black text-primary">{r.percentage}%</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-black">
                          {r.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4">{r.attempts} / {config.maxAttempts}</td>
                      <td className="py-3 px-4">{Math.round((r.durationSeconds || 0) / 60)} मिनेट</td>
                      <td className="py-3 px-4 text-muted-text text-[11px]">
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("ne-NP") : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ASSESSMENT ANALYTICS OS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-black text-muted-text uppercase tracking-wider">उत्तीर्ण दर (Pass Rate)</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {analytics?.passRatePercentage ?? 85}%
              </div>
              <p className="text-[11px] text-muted-text font-medium">
                {analytics?.passedStudents ?? 0} / {analytics?.uniqueStudentsAttempted ?? 0} विद्यार्थी पास
              </p>
            </div>

            <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-black text-muted-text uppercase tracking-wider">औसत प्राप्ताङ्क (Avg Score)</span>
              <div className="text-2xl font-black text-primary">
                {analytics?.averageScorePercentage ?? 78}%
              </div>
              <p className="text-[11px] text-muted-text font-medium">
                कुल परीक्षा प्रयास: {analytics?.totalAttempts ?? 0}
              </p>
            </div>

            <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-black text-muted-text uppercase tracking-wider">जारी प्रमाणपत्र सङ्ख्या</span>
              <div className="text-2xl font-black text-amber-500">
                {analytics?.certificatesIssuedCount ?? 0}
              </div>
              <p className="text-[11px] text-muted-text font-medium">
                HMAC SHA256 डिजिटल प्रमाण
              </p>
            </div>

            <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-black text-muted-text uppercase tracking-wider">औसत परीक्षा अवधि</span>
              <div className="text-2xl font-black text-card-foreground">
                {Math.round((analytics?.averageDurationSeconds ?? 360) / 60)} मिनेट
              </div>
              <p className="text-[11px] text-muted-text font-medium">
                समय सीमा: {config.timeLimitMinutes} मिनेट
              </p>
            </div>
          </div>

          {/* Question Level Intelligence Table */}
          <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border-theme pb-4">
              <div>
                <h2 className="text-base font-black text-card-foreground flex items-center gap-2">
                  <BarChart2 size={18} className="text-emerald-600" />
                  <span>प्रश्न-स्तर बुद्धिमत्ता तथा त्रुटि दर (Question Failure Rate Intelligence)</span>
                </h2>
                <p className="text-xs text-muted-text">
                  कुन प्रश्नहरूमा धेरै विद्यार्थी असफल भए भनी विश्लेषण गरी पाठ्यसामग्री वा प्रश्न परिमार्जन गर्नुहोस्।
                </p>
              </div>

              <button
                onClick={() => loadCourseData(selectedCourseId)}
                className="px-3 py-1.5 rounded-xl bg-muted-area hover:bg-border-theme text-xs font-bold text-card-foreground transition-colors flex items-center gap-1.5"
              >
                <RefreshCw size={13} />
                <span>डाटा अद्यावधिक</span>
              </button>
            </div>

            {!analytics?.questionIntelligence || analytics.questionIntelligence.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-text font-bold">
                अहिलेसम्म विश्लेषणात्मक डाटा प्राप्त भएको छैन।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border-theme text-muted-text font-bold">
                      <th className="py-3 px-4">प्रश्न</th>
                      <th className="py-3 px-4">कठिनाई</th>
                      <th className="py-3 px-4">जम्मा उत्तर</th>
                      <th className="py-3 px-4">सही उत्तर</th>
                      <th className="py-3 px-4">गलत उत्तर</th>
                      <th className="py-3 px-4">त्रुटि/असफलता दर (%)</th>
                      <th className="py-3 px-4">स्थिति</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-theme/50 font-medium text-card-foreground">
                    {analytics.questionIntelligence.map((q: any, i: number) => (
                      <tr key={i} className="hover:bg-muted-area/50 transition-colors">
                        <td className="py-3 px-4 max-w-xs font-bold truncate">
                          {q.question}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-muted-area text-muted-text text-[10px] font-bold">
                            {q.difficulty}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold">{q.totalAnswers}</td>
                        <td className="py-3 px-4 font-bold text-emerald-600">{q.correctAnswers}</td>
                        <td className="py-3 px-4 font-bold text-rose-500">{q.incorrectAnswers}</td>
                        <td className="py-3 px-4 font-black">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            q.failureRate > 50 ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 font-black" : "bg-emerald-500/10 text-emerald-600"
                          }`}>
                            {q.failureRate}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {q.flaggedHighFailure ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-[10px] flex items-center gap-1 w-fit">
                              <AlertTriangle size={12} />
                              <span>पुनरावलोकन आवश्यक (&gt;50% Failure)</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold flex items-center gap-1 w-fit">
                              <ShieldCheck size={12} />
                              <span>सामान्य</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border-theme rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-border-theme pb-3">
                <h3 className="text-base font-black text-card-foreground">
                  नयाँ प्रश्न थप्नुहोस् (Add Manual Question)
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted-area text-muted-text"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveManualQuestion} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-card-foreground mb-1">प्रश्न (Question Text):</label>
                  <textarea
                    rows={3}
                    value={questionForm.question}
                    onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-card-foreground font-bold focus:outline-none focus:border-primary"
                    placeholder="प्रश्न यहाँ लेख्नुहोस्..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-card-foreground mb-1">विकल्प क (Option A):</label>
                    <input
                      type="text"
                      value={questionForm.optA}
                      onChange={(e) => setQuestionForm({ ...questionForm, optA: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-card-foreground font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-card-foreground mb-1">विकल्प ख (Option B):</label>
                    <input
                      type="text"
                      value={questionForm.optB}
                      onChange={(e) => setQuestionForm({ ...questionForm, optB: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-card-foreground font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-card-foreground mb-1">विकल्प ग (Option C):</label>
                    <input
                      type="text"
                      value={questionForm.optC}
                      onChange={(e) => setQuestionForm({ ...questionForm, optC: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-card-foreground font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-card-foreground mb-1">विकल्प घ (Option D):</label>
                    <input
                      type="text"
                      value={questionForm.optD}
                      onChange={(e) => setQuestionForm({ ...questionForm, optD: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-card-foreground font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-card-foreground mb-1">सही उत्तर (Correct Answer):</label>
                    <select
                      value={questionForm.correctAnswer}
                      onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-card-foreground font-bold"
                    >
                      <option value="opt-a">विकल्प क (Option A)</option>
                      <option value="opt-b">विकल्प ख (Option B)</option>
                      <option value="opt-c">विकल्प ग (Option C)</option>
                      <option value="opt-d">विकल्प घ (Option D)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-card-foreground mb-1">कठिनाई (Difficulty):</label>
                    <select
                      value={questionForm.difficulty}
                      onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-card-foreground font-bold"
                    >
                      <option value="easy">सजिलो</option>
                      <option value="medium">मध्यम</option>
                      <option value="hard">कठिन</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-card-foreground mb-1">व्याख्या (Explanation):</label>
                  <input
                    type="text"
                    value={questionForm.explanation}
                    onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-card-foreground font-medium"
                    placeholder="सही उत्तरको शास्त्रीय वा तार्किक व्याख्या..."
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-muted-area text-muted-text font-bold hover:text-card-foreground"
                  >
                    रद्द गर्नुहोस्
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-white font-black shadow-md shadow-primary/20 hover:bg-primary/90"
                  >
                    बचत गर्नुहोस्
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
