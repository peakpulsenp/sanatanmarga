import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import SEOHead from "@/src/components/common/SEOHead";
import { 
  Play, 
  CheckCircle2, 
  Lock, 
  Clock, 
  Award, 
  BookOpen, 
  ChevronLeft, 
  Sparkles, 
  Download, 
  FileText, 
  Volume2, 
  Share2,
  Check,
  GraduationCap
} from "lucide-react";
import { SAMPLE_COURSES } from "./AcademyPage";
import { useLanguage } from "@/src/context/LanguageContext";
import { useAuth } from "@/src/lib/auth";
import { toast } from "sonner";
import AssessmentPlayer from "@/src/components/academy/AssessmentPlayer";
import AcademyVideoPlayer from "@/src/components/academy/AcademyVideoPlayer";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const course = SAMPLE_COURSES.find(c => c.id === id);
  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [isGeneratingCert, setIsGeneratingCert] = useState<boolean>(false);
  const [classroomTab, setClassroomTab] = useState<"notes" | "qa" | "sgis" | "assignments">("notes");
  const [noteTimestamp, setNoteTimestamp] = useState<string>("04:15");
  const [noteInput, setNoteInput] = useState<string>("");
  const [studentNotes, setStudentNotes] = useState<Array<{ id: string; timestamp: string; text: string; lessonIdx: number }>>([
    { id: "n1", timestamp: "02:30", text: "कर्मयोगको मूल सूत्र: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन' (अध्याय २, श्लोक ४७)", lessonIdx: 0 },
    { id: "n2", timestamp: "08:45", text: "स्थितप्रज्ञ व्यक्तिको लक्षण र मनको सन्तुलन विधि।", lessonIdx: 0 }
  ]);
  const [qaInput, setQaInput] = useState<string>("");
  const [qaList, setQaList] = useState<Array<{ id: string; timestamp: string; student: string; question: string; acharyaReply: string }>>([
    {
      id: "q1",
      timestamp: "05:12",
      student: "साधक प्रकाश अधिकारी",
      question: "आचार्यज्यू, निष्काम कर्म र संन्यास बीचको व्यावहारिक भिन्नता के हो?",
      acharyaReply: "डा. स्वामी रामानन्द: फलको आसक्ति त्यागेर समाज र धर्मका लागि कर्तव्य पूरा गर्नु नै निष्काम कर्मयोग हो।"
    }
  ]);
  const [attendanceMarked, setAttendanceMarked] = useState<boolean>(true);
  const [assignmentSubmitted, setAssignmentSubmitted] = useState<boolean>(false);

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <SEOHead title="पाठ्यक्रम फेला परेन - सनातन अकाडेमी" description="अनुरोध गरिएको पाठ्यक्रम फेला परेन।" url="/academy" />
        <Header />
        <main className="flex-grow container-custom max-w-4xl py-16 text-center space-y-4">
          <GraduationCap className="w-16 h-16 mx-auto text-muted-text opacity-40" />
          <h1 className="text-2xl font-black">पाठ्यक्रम फेला परेन (Course Not Found)</h1>
          <p className="text-muted-text">तपाईंले खोज्नुभएको पाठ्यक्रम उपलब्ध छैन वा हटाइएको हुन सक्छ।</p>
          <Link to="/academy" className="inline-block px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl mt-4">
            अकाडेमी सूचीमा फर्कनुहोस्
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const lessons = [
    { id: 1, title: "पाठ १: प्रवेश, पृष्ठभूमी र मङ्गलाचरण", duration: "१५ मिनेट", type: "video", isFree: true },
    { id: 2, title: "पाठ २: अर्जुनविषादयोग र जीवनको द्वन्द्व", duration: "२० मिनेट", type: "video", isFree: true },
    { id: 3, title: "पाठ ३: साङ्ख्ययोग: आत्माको अमरता र शरीर", duration: "२२ मिनेट", type: "audio", isFree: false },
    { id: 4, title: "पाठ ४: कर्मयोग: फलासक्तिरहित कर्तव्य", duration: "२५ मिनेट", type: "video", isFree: false },
    { id: 5, title: "पाठ ५: ज्ञानकर्मसंन्यासयोग र आधुनिक जीवन", duration: "१८ मिनेट", type: "video", isFree: false },
    { id: 6, title: "पाठ ६: निष्कर्ष, सारसङ्क्षेप र परीक्षा", duration: "३० मिनेट", type: "quiz", isFree: false }
  ];

  const currentLesson = lessons[activeLessonIndex];

  const toggleComplete = (idx: number) => {
    if (completedLessons.includes(idx)) {
      setCompletedLessons(completedLessons.filter(i => i !== idx));
    } else {
      setCompletedLessons([...completedLessons, idx]);
      toast.success("पाठ पूरा भयो!");
    }
  };

  const handleDownloadCertificate = () => {
    if (!user) {
      toast.info("प्रमाणपत्र प्राप्त गर्न कृपया लगइन गर्नुहोस्");
      navigate("/login");
      return;
    }
    setIsGeneratingCert(true);
    setTimeout(() => {
      setIsGeneratingCert(false);
      toast.success("प्रमाणपत्र (PDF) सफलतापुर्वक डाउनलोड भयो!");
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEOHead
        title={`${course.titleNepali} - सनातन अकाडेमी`}
        description={course.descriptionNepali}
        url={`/academy/course/${course.id}`}
      />
      <Header />

      <main className="flex-grow container-custom max-w-6xl py-6 md:py-10 space-y-8">
        <Link
          to="/academy"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-text hover:text-primary transition-colors"
        >
          <ChevronLeft size={16} />
          <span>अकाडेमीमा फर्कनुहोस्</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video / Content Area OR Assessment Player */}
          <div className="lg:col-span-2 space-y-6">
            {currentLesson.type === "quiz" ? (
              <AssessmentPlayer courseId={course.id} courseTitle={course.titleNepali} />
            ) : (
              <>
                <AcademyVideoPlayer
                  courseId={course.id}
                  courseTitle={`${course.titleNepali} - ${currentLesson.title}`}
                  courseCategory={course.category}
                  courseVideoUrl=""
                  thumbnailUrl={course.image}
                  userTier={(user as any)?.role === "premium" ? "premium" : (user ? "member" : "free")}
                  onLessonComplete={() => toggleComplete(activeLessonIndex)}
                />

                {/* Lesson Details & Controls */}
                <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border-theme pb-4">
                    <h2 className="text-xl font-black text-card-foreground">
                      {currentLesson.title}
                    </h2>
                    <button
                      onClick={() => toggleComplete(activeLessonIndex)}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                        completedLessons.includes(activeLessonIndex)
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-primary text-white hover:bg-primary/90"
                      }`}
                    >
                      <Check size={14} />
                      <span>{completedLessons.includes(activeLessonIndex) ? "पाठ सकियो (Completed)" : "पाठ पूरा गर्नुहोस्"}</span>
                    </button>
                  </div>

                  <p className="text-xs text-muted-text leading-relaxed">
                    {course.descriptionNepali}
                  </p>

                  {/* Course Progress Bar */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs font-bold text-muted-text">
                      <span>प्रगति (Progress): {Math.round((completedLessons.length / lessons.length) * 100)}%</span>
                      <span>{completedLessons.length}/{lessons.length} पाठ सकियो</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted-area overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${(completedLessons.length / lessons.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {completedLessons.length === lessons.length && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-card-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Award size={28} className="text-amber-500 shrink-0" />
                        <div>
                          <div className="text-xs font-black">बधाई छ! तपाईंले यो कोर्स पुरा गर्नुभयो!</div>
                          <div className="text-[11px] text-muted-text">सनातन ज्ञान अकाडेमीको आधिकारिक प्रमाणपत्र डाउनलोड गर्नुहोस्।</div>
                        </div>
                      </div>
                      <button
                        onClick={handleDownloadCertificate}
                        disabled={isGeneratingCert}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-amber-400 transition-all shrink-0 cursor-pointer"
                      >
                        <Download size={14} />
                        <span>{isGeneratingCert ? "तयार हुँदैछ..." : "प्रमाणपत्र (PDF)"}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* GURUKUL INTERACTIVE CLASSROOM WORKSPACE: TIMESTAMP NOTES, Q&A, SGIS & ASSIGNMENTS */}
                <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 border-b border-border-theme pb-3">
                    {[
                      { id: "notes", label: "टाइमस्ट्याम्प टिपोट (Timestamp Notes)" },
                      { id: "qa", label: "प्रश्नोत्तर संवाद (Timestamp Q&A)" },
                      { id: "sgis", label: "SGIS ग्रन्थ र पाण्डुलिपि (SGIS References)" },
                      { id: "assignments", label: "गृहकार्य र हाजिरी (Assignments & Attendance)" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setClassroomTab(tab.id as any)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          classroomTab === tab.id
                            ? "bg-primary text-white shadow-sm"
                            : "bg-muted-area text-muted-text hover:text-foreground border border-border-theme"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* TAB 1: TIMESTAMPED STUDENT NOTES */}
                  {classroomTab === "notes" && (
                    <div className="space-y-4">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!noteInput.trim()) return;
                          setStudentNotes([
                            ...studentNotes,
                            { id: `n_${Date.now()}`, timestamp: noteTimestamp || "00:00", text: noteInput.trim(), lessonIdx: activeLessonIndex },
                          ]);
                          setNoteInput("");
                          toast.success("टाइमस्ट्याम्प टिपोट सुरक्षित गरियो!");
                        }}
                        className="flex flex-col sm:flex-row gap-2"
                      >
                        <input
                          type="text"
                          value={noteTimestamp}
                          onChange={(e) => setNoteTimestamp(e.target.value)}
                          placeholder="04:15"
                          className="w-24 px-3 py-2 rounded-xl bg-muted-area border border-border-theme text-xs font-mono font-bold text-primary"
                        />
                        <input
                          type="text"
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="यस पाठको टाइमस्ट्याम्पमा आफ्नो अध्ययन टिपोट थप्नुहोस्..."
                          className="flex-1 px-3.5 py-2 rounded-xl bg-muted-area border border-border-theme text-xs"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-black shrink-0"
                        >
                          टिपोट सेभ गर्नुहोस्
                        </button>
                      </form>

                      <div className="space-y-2">
                        {studentNotes.map((note) => (
                          <div key={note.id} className="p-3 rounded-2xl bg-muted-area/40 border border-border-theme flex items-start gap-3">
                            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[11px] font-bold shrink-0">
                              [{note.timestamp}]
                            </span>
                            <p className="text-xs text-card-foreground">{note.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: TIMESTAMP-LINKED Q&A & DISCUSSIONS */}
                  {classroomTab === "qa" && (
                    <div className="space-y-4">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!qaInput.trim()) return;
                          setQaList([
                            ...qaList,
                            {
                              id: `q_${Date.now()}`,
                              timestamp: noteTimestamp || "06:20",
                              student: (user as any)?.displayName || "विद्यार्थी साधक",
                              question: qaInput.trim(),
                              acharyaReply: "आचार्य कक्षमा प्रश्न दर्ता भयो — आगामी प्रत्यक्ष सत्रमा उत्तर दिइनेछ।",
                            },
                          ]);
                          setQaInput("");
                          toast.success("आचार्य समक्ष प्रश्न पठाइयो!");
                        }}
                        className="flex flex-col sm:flex-row gap-2"
                      >
                        <input
                          type="text"
                          value={qaInput}
                          onChange={(e) => setQaInput(e.target.value)}
                          placeholder="पाठको विशेष समय-बिन्दु उल्लेख गरी आचार्यलाई प्रश्न सोध्नुहोस्..."
                          className="flex-1 px-3.5 py-2 rounded-xl bg-muted-area border border-border-theme text-xs"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-black shrink-0"
                        >
                          प्रश्न सोध्नुहोस्
                        </button>
                      </form>

                      <div className="space-y-3">
                        {qaList.map((item) => (
                          <div key={item.id} className="p-3.5 rounded-2xl bg-muted-area/40 border border-border-theme space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono text-[10px] font-bold">
                                @{item.timestamp}
                              </span>
                              <span className="font-black text-card-foreground">{item.student}:</span>
                              <span className="text-card-foreground">{item.question}</span>
                            </div>
                            <div className="pl-4 border-l-2 border-primary text-xs text-muted-text">
                              {item.acharyaReply}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: SGIS SCRIPTURE & MANUSCRIPT REFERENCES */}
                  {classroomTab === "sgis" && (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-text">
                        यस पाठमा सन्दर्भित प्राथमिक ग्रन्थ र सनातन ग्रन्थ सूचना प्रणाली (SGIS) पाण्डुलिपि अभिलेखहरू:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-2xl bg-muted-area/40 border border-border-theme space-y-1.5">
                          <div className="text-xs font-black text-card-foreground">श्रीमद्भगवद्गीता ताडपत्र पाण्डुलिपि (SGIS #MS-108)</div>
                          <div className="text-[11px] text-muted-text">अध्याय २ • साङ्ख्ययोग श्लोक ४७–५५ • संस्कृत मूल र नेपाली भाष्य</div>
                          <Link to="/archives" className="inline-block text-[11px] font-bold text-primary hover:underline">
                            SGIS डिप-जुम अभिलेखालयमा हेर्नुहोस् →
                          </Link>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-muted-area/40 border border-border-theme space-y-1.5">
                          <div className="text-xs font-black text-card-foreground">चाँगुनारायण मानदेव शिलालेख (SGIS #EP-464)</div>
                          <div className="text-[11px] text-muted-text">लिच्छवि लिपि लिप्यन्तरण र ऐतिहासिक कालक्रम</div>
                          <Link to="/knowledge" className="inline-block text-[11px] font-bold text-primary hover:underline">
                            ज्ञानकोष (Knowledge OS) मा हेर्नुहोस् →
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: ASSIGNMENTS, ATTENDANCE & COMPETENCY */}
                  {classroomTab === "assignments" && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-muted-area/40 border border-border-theme flex items-center justify-between">
                        <div>
                          <div className="text-xs font-black text-card-foreground">कक्षा हाजिरी (Classroom Attendance Status)</div>
                          <div className="text-[11px] text-muted-text">प्रत्यक्ष तथा रेकर्ड गरिएका पाठहरूको सहभागिता अभिलेख</div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-black border border-emerald-500/20">
                          {attendanceMarked ? "हाजिरी प्रमाणित (Present • 100%)" : "Pending"}
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-muted-area/40 border border-border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-black text-card-foreground">स्वाध्याय गृहकार्य (Lesson Reflection Assignment)</div>
                          <div className="text-[11px] text-muted-text">यस पाठका मुख्य ३ दार्शनिक सूत्रहरूको संक्षिप्त विवेचना बुझाउनुहोस्।</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAssignmentSubmitted(true);
                            toast.success("गृहकार्य सफलतापूर्वक आचार्य मूल्याङ्कनका लागि पेश गरियो!");
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 ${
                            assignmentSubmitted
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                              : "bg-primary text-white"
                          }`}
                        >
                          {assignmentSubmitted ? "गृहकार्य पेश गरियो (Submitted)" : "गृहकार्य बुझाउनुहोस्"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Lessons Syllabus Sidebar */}
          <div className="space-y-4">
            <div className="bg-card border border-border-theme rounded-3xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-black text-card-foreground flex items-center gap-2 border-b border-border-theme pb-3">
                <BookOpen size={16} className="text-primary" />
                <span>पाठ्यक्रम तालिका (Syllabus)</span>
              </h3>

              <div className="space-y-2">
                {lessons.map((lesson, idx) => {
                  const isActive = idx === activeLessonIndex;
                  const isCompleted = completedLessons.includes(idx);

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLessonIndex(idx)}
                      className={`w-full p-3 rounded-2xl text-left border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isActive
                          ? "bg-primary/10 border-primary text-primary shadow-sm"
                          : "bg-muted-area/50 border-border-theme hover:bg-muted-area text-card-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isCompleted ? (
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-slate-500/20 text-muted-text text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                        )}
                        <div className="truncate text-xs font-bold">
                          {lesson.title}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-text font-medium">{lesson.duration}</span>
                        {!lesson.isFree && !user && <Lock size={12} className="text-muted-text" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
