import React, { useState, useEffect } from "react";
import { 
  GraduationCap, Plus, Search, Edit3, Trash2, BookOpen, 
  Clock, Award, FileText, Music, Video, Sparkles, X, Save, CheckCircle2, HelpCircle,
  Upload, Download, AlertCircle, Play, Pause, ExternalLink, ShieldCheck
} from "lucide-react";
import AssessmentOSAdmin from "./AssessmentOSAdmin";
import AcademyVideoAdsAdmin from "./AcademyVideoAdsAdmin";
import { db, safeOnSnapshot, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { collection, doc, setDoc, deleteDoc } from "@/src/lib/firebase";
import { SAMPLE_COURSES, Course, GURUKUL_SCHOOLS, ACHARYA_FACULTY } from "@/src/pages/AcademyPage";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export interface GurukulSchool {
  id: string;
  nameNe: string;
  nameEn: string;
  descNe: string;
  dean: string;
  coursesCount: number;
  studentsCount: string;
}

export interface AcharyaItem {
  id: string;
  nameNe: string;
  nameEn: string;
  titleNe: string;
  school: string;
  experience: string;
  coursesCount: number;
  verified: boolean;
  photoUrl?: string;
  bio?: string;
}

export interface AdmissionApp {
  id: string;
  student: string;
  school: string;
  attendance: string;
  status: string;
  notes?: string;
}

export interface LessonItem {
  id: string;
  title: string;
  course: string;
  duration: string;
  videoUrl?: string;
  audioUrl?: string;
}

export interface MaterialItem {
  id: string;
  title: string;
  course: string;
  size: string;
  downloads: number;
  fileUrl?: string;
}

export interface AudioTrackItem {
  id: string;
  title: string;
  speaker: string;
  duration: string;
  audioUrl?: string;
}

export interface CertificateConfig {
  passingScore: number;
  signatory: string;
  issuerTitle: string;
  templateHash: string;
}

const DEFAULT_LESSONS: LessonItem[] = [
  { id: "les-1", title: "पाठ १: गीताको ऐतिहासिक पृष्ठभूमि र कुरुक्षेत्र युद्ध", duration: "२५ मिनेट", course: "श्रीमद्भगवद्गीता परिचय", videoUrl: "https://www.youtube.com/watch?v=sample1", audioUrl: "" },
  { id: "les-2", title: "पाठ २: सांख्य योग र आत्मज्ञानको शाश्वत स्वरूप", duration: "३५ मिनेट", course: "श्रीमद्भगवद्गीता परिचय", videoUrl: "https://www.youtube.com/watch?v=sample2", audioUrl: "" },
  { id: "les-3", title: "पाठ ३: कर्मयोग - अनासक्त कर्मको रहस्य", duration: "४० मिनेट", course: "श्रीमद्भगवद्गीता परिचय", videoUrl: "https://www.youtube.com/watch?v=sample3", audioUrl: "" },
  { id: "les-4", title: "पाठ १: देवनागरी वर्णमाला र उच्चारण स्थान", duration: "३० मिनेट", course: "संस्कृत भाषा र व्याकरण", videoUrl: "https://www.youtube.com/watch?v=sample4", audioUrl: "" }
];

const DEFAULT_MATERIALS: MaterialItem[] = [
  { id: "mat-1", title: "श्रीमद्भगवद्गीता पदच्छेद र अन्वय", course: "श्रीमद्भगवद्गीता परिचय", size: "४.२ MB", downloads: 1240, fileUrl: "" },
  { id: "mat-2", title: "संस्कृत व्याकरण सार संग्रह", course: "संस्कृत भाषा र व्याकरण", size: "२.८ MB", downloads: 890, fileUrl: "" },
  { id: "mat-3", title: "वैदिक सभ्यता र लिच्छवि अभिलेख नोट्स", course: "सनातन सभ्यता र नेपालको इतिहास", size: "६.१ MB", downloads: 650, fileUrl: "" }
];

const DEFAULT_AUDIOS: AudioTrackItem[] = [
  { id: "aud-1", title: "ऋग्वेद शान्तिमन्त्र र पुरुषसूक्त गायन", speaker: "आचार्य महेशप्रसाद शास्त्री", duration: "१८:४०", audioUrl: "" },
  { id: "aud-2", title: "गीता द्वितीय अध्याय श्लोक उच्चारण अभ्यास", speaker: "डा. स्वामी रामानन्द", duration: "२८:१५", audioUrl: "" },
  { id: "aud-3", title: "रुद्राष्टाध्यायी एवं शिवस्तुति", speaker: "पशुपतिनाथ मन्दिर वेदपाठक दल", duration: "३२:००", audioUrl: "" }
];

const DEFAULT_ADMISSIONS: AdmissionApp[] = [
  { id: "sch-1", student: "सुमन उपाध्याय (कास्की)", school: "वैदिक दर्शन विद्यापीठ", attendance: "94%", status: "Approved (मेधावी छात्रवृत्ति)" },
  { id: "sch-2", student: "प्रतीक्षा पन्त (कैलाली)", school: "संस्कृत र अभिलेख विद्यापीठ", attendance: "89%", status: "Pending Review" },
  { id: "sch-3", student: "रोशन अधिकारी (मोरङ)", school: "सभ्यता र इतिहास विद्यापीठ", attendance: "92%", status: "Approved (पूर्ण शुल्क मिनाहा)" }
];

export default function AcademyOSAdmin() {
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const s = localStorage.getItem("sanatan_academy_courses");
      if (s) return JSON.parse(s);
    } catch {}
    return SAMPLE_COURSES;
  });

  const [schools, setSchools] = useState<GurukulSchool[]>(() => {
    try {
      const s = localStorage.getItem("sanatan_academy_schools");
      if (s) return JSON.parse(s);
    } catch {}
    return GURUKUL_SCHOOLS as GurukulSchool[];
  });

  const [acharyas, setAcharyas] = useState<AcharyaItem[]>(() => {
    try {
      const s = localStorage.getItem("sanatan_academy_acharyas");
      if (s) return JSON.parse(s);
    } catch {}
    return ACHARYA_FACULTY as AcharyaItem[];
  });

  const [scholarshipApps, setScholarshipApps] = useState<AdmissionApp[]>(() => {
    try {
      const s = localStorage.getItem("sanatan_academy_admissions");
      if (s) return JSON.parse(s);
    } catch {}
    return DEFAULT_ADMISSIONS;
  });

  const [lessons, setLessons] = useState<LessonItem[]>(() => {
    try {
      const s = localStorage.getItem("sanatan_academy_lessons");
      if (s) return JSON.parse(s);
    } catch {}
    return DEFAULT_LESSONS;
  });

  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    try {
      const s = localStorage.getItem("sanatan_academy_materials");
      if (s) return JSON.parse(s);
    } catch {}
    return DEFAULT_MATERIALS;
  });

  const [audios, setAudios] = useState<AudioTrackItem[]>(() => {
    try {
      const s = localStorage.getItem("sanatan_academy_audios");
      if (s) return JSON.parse(s);
    } catch {}
    return DEFAULT_AUDIOS;
  });

  const [certConfig, setCertConfig] = useState<CertificateConfig>(() => {
    try {
      const s = localStorage.getItem("sanatan_academy_certificates");
      if (s) return JSON.parse(s);
    } catch {}
    return {
      passingScore: 70,
      signatory: "सनातन ज्ञान अकाडेमी निर्देशक",
      issuerTitle: "SANATAN ACADEMY OF VEDIC STUDIES",
      templateHash: "#SM-ACAD-8842"
    };
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState<"courses" | "schools" | "acharyas" | "admissions" | "lessons" | "materials" | "audio" | "certificates" | "assessment" | "video_ads">("courses");

  // Modals
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState({
    titleNepali: "",
    titleEnglish: "",
    descriptionNepali: "",
    descriptionEnglish: "",
    instructor: "",
    level: "प्रारम्भिक (Beginner)" as "प्रारम्भिक (Beginner)" | "मध्यम (Intermediate)" | "विशिष्ट (Advanced)",
    duration: "४ हप्ता (१२ पाठ)",
    lessonsCount: 12,
    category: "scripture" as "scripture" | "history" | "language" | "heritage",
    image: "",
    isPopular: false
  });

  // School modal
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [schoolForm, setSchoolForm] = useState({
    nameNe: "",
    nameEn: "",
    descNe: "",
    dean: "",
    coursesCount: 4,
    studentsCount: "५००+"
  });

  // Acharya modal
  const [isAcharyaModalOpen, setIsAcharyaModalOpen] = useState(false);
  const [editingAcharyaId, setEditingAcharyaId] = useState<string | null>(null);
  const [acharyaForm, setAcharyaForm] = useState({
    nameNe: "",
    nameEn: "",
    titleNe: "",
    school: "वैदिक दर्शन विद्यापीठ",
    experience: "१०+ वर्ष",
    coursesCount: 2,
    verified: true,
    photoUrl: ""
  });

  // Admission modal
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [admissionForm, setAdmissionForm] = useState({
    student: "",
    school: "वैदिक दर्शन विद्यापीठ",
    attendance: "90%",
    status: "Pending Review",
    notes: ""
  });

  // Lesson modal
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: "",
    course: "श्रीमद्भगवद्गीता परिचय",
    duration: "३० मिनेट",
    videoUrl: "",
    audioUrl: ""
  });

  // Material modal
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    title: "",
    course: "श्रीमद्भगवद्गीता परिचय",
    size: "३.५ MB",
    fileUrl: ""
  });

  // Audio modal
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [audioForm, setAudioForm] = useState({
    title: "",
    speaker: "",
    duration: "२०:००",
    audioUrl: ""
  });

  // Firebase Realtime Listeners with local fallback
  useEffect(() => {
    let isMounted = true;

    // Courses listener
    const unsubCourses = safeOnSnapshot(
      collection(db, "academy_courses"),
      (snap) => {
        if (!isMounted || snap.empty) return;
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
        setCourses(items);
        try { localStorage.setItem("sanatan_academy_courses", JSON.stringify(items)); } catch {}
      },
      "admin_academy_courses"
    );

    // Schools listener
    const unsubSchools = safeOnSnapshot(
      collection(db, "academy_schools"),
      (snap) => {
        if (!isMounted || snap.empty) return;
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as GurukulSchool));
        setSchools(items);
        try { localStorage.setItem("sanatan_academy_schools", JSON.stringify(items)); } catch {}
      },
      "admin_academy_schools"
    );

    // Acharyas listener
    const unsubAcharyas = safeOnSnapshot(
      collection(db, "academy_acharyas"),
      (snap) => {
        if (!isMounted || snap.empty) return;
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as AcharyaItem));
        setAcharyas(items);
        try { localStorage.setItem("sanatan_academy_acharyas", JSON.stringify(items)); } catch {}
      },
      "admin_academy_acharyas"
    );

    // Lessons listener
    const unsubLessons = safeOnSnapshot(
      collection(db, "academy_lessons"),
      (snap) => {
        if (!isMounted || snap.empty) return;
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as LessonItem));
        setLessons(items);
        try { localStorage.setItem("sanatan_academy_lessons", JSON.stringify(items)); } catch {}
      },
      "admin_academy_lessons"
    );

    // Materials listener
    const unsubMaterials = safeOnSnapshot(
      collection(db, "academy_materials"),
      (snap) => {
        if (!isMounted || snap.empty) return;
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as MaterialItem));
        setMaterials(items);
        try { localStorage.setItem("sanatan_academy_materials", JSON.stringify(items)); } catch {}
      },
      "admin_academy_materials"
    );

    // Audios listener
    const unsubAudios = safeOnSnapshot(
      collection(db, "academy_audios"),
      (snap) => {
        if (!isMounted || snap.empty) return;
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as AudioTrackItem));
        setAudios(items);
        try { localStorage.setItem("sanatan_academy_audios", JSON.stringify(items)); } catch {}
      },
      "admin_academy_audios"
    );

    // Certificate config listener
    const unsubCert = safeOnSnapshot(
      doc(db, "settings", "academy_certificates"),
      (snap) => {
        if (!isMounted || !snap.exists()) return;
        const data = snap.data() as CertificateConfig;
        setCertConfig(data);
        try { localStorage.setItem("sanatan_academy_certificates", JSON.stringify(data)); } catch {}
      },
      "admin_academy_cert"
    );

    return () => {
      isMounted = false;
      if (typeof unsubCourses === "function") unsubCourses();
      if (typeof unsubSchools === "function") unsubSchools();
      if (typeof unsubAcharyas === "function") unsubAcharyas();
      if (typeof unsubLessons === "function") unsubLessons();
      if (typeof unsubMaterials === "function") unsubMaterials();
      if (typeof unsubAudios === "function") unsubAudios();
      if (typeof unsubCert === "function") unsubCert();
    };
  }, []);

  // Media File Uploader
  const handleFileUploadHelper = (file: File, callback: (result: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      callback(reader.result as string);
      toast.success(`${file.name} अपलोड भयो!`);
    };
    reader.onerror = () => {
      toast.error("फाइल पढ्न असफल भयो");
    };
    reader.readAsDataURL(file);
  };

  // ---------------- COURSES CRUD ----------------
  const handleOpenCreateCourse = () => {
    setEditingCourseId(null);
    setCourseForm({
      titleNepali: "",
      titleEnglish: "",
      descriptionNepali: "",
      descriptionEnglish: "",
      instructor: acharyas[0]?.nameNe || "आचार्य / प्राध्यापक",
      level: "प्रारम्भिक (Beginner)",
      duration: "४ हप्ता (१२ पाठ)",
      lessonsCount: 12,
      category: "scripture",
      image: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
      isPopular: false
    });
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourse = (course: Course) => {
    setEditingCourseId(course.id);
    setCourseForm({
      titleNepali: course.titleNepali || "",
      titleEnglish: course.titleEnglish || "",
      descriptionNepali: course.descriptionNepali || "",
      descriptionEnglish: course.descriptionEnglish || "",
      instructor: course.instructor || "",
      level: course.level || "प्रारम्भिक (Beginner)",
      duration: course.duration || "",
      lessonsCount: course.lessonsCount || 10,
      category: course.category || "scripture",
      image: course.image || "",
      isPopular: !!course.isPopular
    });
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.titleNepali || !courseForm.instructor) {
      toast.error("कृपया कोर्सको नाम र प्रशिक्षक भर्नुहोस्");
      return;
    }

    const docId = editingCourseId || `course-${Date.now()}`;
    const payload: Course = {
      id: docId,
      titleNepali: courseForm.titleNepali.trim(),
      titleEnglish: courseForm.titleEnglish.trim() || courseForm.titleNepali.trim(),
      descriptionNepali: courseForm.descriptionNepali.trim(),
      descriptionEnglish: courseForm.descriptionEnglish.trim() || courseForm.descriptionNepali.trim(),
      instructor: courseForm.instructor.trim(),
      level: courseForm.level,
      duration: courseForm.duration.trim(),
      lessonsCount: Number(courseForm.lessonsCount) || 1,
      category: courseForm.category,
      image: courseForm.image.trim() || "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
      isPopular: courseForm.isPopular
    };

    try {
      await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: docId, ...payload }),
      }).catch(() => {});
      await setDoc(doc(db, "academy_courses", docId), payload, { merge: true });
      setCourses(prev => {
        const exists = prev.some(c => c.id === docId);
        const next = exists ? prev.map(c => c.id === docId ? payload : c) : [payload, ...prev];
        try { localStorage.setItem("sanatan_academy_courses", JSON.stringify(next)); } catch {}
        return next;
      });
      toast.success(editingCourseId ? "कोर्स अद्यावधिक भयो!" : "नयाँ कोर्स सुरक्षित भयो!");
      setIsCourseModalOpen(false);
    } catch (err: any) {
      handleFirestoreError(err, editingCourseId ? OperationType.UPDATE : OperationType.CREATE, `academy_courses/${docId}`);
      toast.error("सेभ गर्न असफल");
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("के तपाईं यो कोर्स हटाउन निश्चित हुनुहुन्छ?")) return;
    try {
      await fetch(`/api/courses/${id}`, { method: "DELETE" }).catch(() => {});
      await deleteDoc(doc(db, "academy_courses", id));
      setCourses(prev => {
        const next = prev.filter(c => c.id !== id);
        try { localStorage.setItem("sanatan_academy_courses", JSON.stringify(next)); } catch {}
        return next;
      });
      toast.success("कोर्स हटाइयो!");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `academy_courses/${id}`);
      toast.error("हटाउन असफल");
    }
  };

  // ---------------- SCHOOLS CRUD ----------------
  const handleOpenCreateSchool = () => {
    setEditingSchoolId(null);
    setSchoolForm({
      nameNe: "",
      nameEn: "",
      descNe: "",
      dean: "",
      coursesCount: 4,
      studentsCount: "५००+"
    });
    setIsSchoolModalOpen(true);
  };

  const handleOpenEditSchool = (sch: GurukulSchool) => {
    setEditingSchoolId(sch.id);
    setSchoolForm({
      nameNe: sch.nameNe,
      nameEn: sch.nameEn,
      descNe: sch.descNe,
      dean: sch.dean,
      coursesCount: sch.coursesCount,
      studentsCount: sch.studentsCount
    });
    setIsSchoolModalOpen(true);
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolForm.nameNe || !schoolForm.dean) {
      toast.error("कृपया विद्यापीठको नाम र प्रमुख आचार्य भर्नुहोस्");
      return;
    }

    const docId = editingSchoolId || `school-${Date.now()}`;
    const payload: GurukulSchool = {
      id: docId,
      nameNe: schoolForm.nameNe.trim(),
      nameEn: schoolForm.nameEn.trim() || schoolForm.nameNe.trim(),
      descNe: schoolForm.descNe.trim(),
      dean: schoolForm.dean.trim(),
      coursesCount: Number(schoolForm.coursesCount) || 1,
      studentsCount: schoolForm.studentsCount.trim() || "१००+"
    };

    try {
      await setDoc(doc(db, "academy_schools", docId), payload, { merge: true });
      setSchools(prev => {
        const exists = prev.some(s => s.id === docId);
        const next = exists ? prev.map(s => s.id === docId ? payload : s) : [...prev, payload];
        try { localStorage.setItem("sanatan_academy_schools", JSON.stringify(next)); } catch {}
        return next;
      });
      toast.success(editingSchoolId ? "विद्यापीठ अद्यावधिक भयो!" : "नयाँ विद्यापीठ थपियो!");
      setIsSchoolModalOpen(false);
    } catch (err: any) {
      handleFirestoreError(err, editingSchoolId ? OperationType.UPDATE : OperationType.CREATE, `academy_schools/${docId}`);
      toast.error("विद्यापीठ सेभ गर्न असफल");
    }
  };

  const handleDeleteSchool = async (id: string) => {
    if (!confirm("के तपाईं यो विद्यापीठ हटाउन निश्चित हुनुहुन्छ?")) return;
    try {
      await deleteDoc(doc(db, "academy_schools", id));
      setSchools(prev => {
        const next = prev.filter(s => s.id !== id);
        try { localStorage.setItem("sanatan_academy_schools", JSON.stringify(next)); } catch {}
        return next;
      });
      toast.success("विद्यापीठ हटाइयो!");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `academy_schools/${id}`);
      toast.error("हटाउन असफल");
    }
  };

  // ---------------- ACHARYAS CRUD ----------------
  const handleOpenCreateAcharya = () => {
    setEditingAcharyaId(null);
    setAcharyaForm({
      nameNe: "",
      nameEn: "",
      titleNe: "",
      school: schools[0]?.nameNe || "वैदिक दर्शन विद्यापीठ",
      experience: "१०+ वर्ष",
      coursesCount: 2,
      verified: true,
      photoUrl: ""
    });
    setIsAcharyaModalOpen(true);
  };

  const handleOpenEditAcharya = (a: AcharyaItem) => {
    setEditingAcharyaId(a.id);
    setAcharyaForm({
      nameNe: a.nameNe,
      nameEn: a.nameEn,
      titleNe: a.titleNe,
      school: a.school,
      experience: a.experience,
      coursesCount: a.coursesCount,
      verified: a.verified,
      photoUrl: a.photoUrl || ""
    });
    setIsAcharyaModalOpen(true);
  };

  const handleSaveAcharya = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acharyaForm.nameNe.trim()) {
      toast.error("कृपया आचार्यको नाम भर्नुहोस्");
      return;
    }

    const docId = editingAcharyaId || `ach-${Date.now()}`;
    const payload: AcharyaItem = {
      id: docId,
      nameNe: acharyaForm.nameNe.trim(),
      nameEn: acharyaForm.nameEn.trim() || acharyaForm.nameNe.trim(),
      titleNe: acharyaForm.titleNe.trim() || "गुरुकुल प्राध्यापक",
      school: acharyaForm.school,
      experience: acharyaForm.experience.trim() || "५+ वर्ष",
      coursesCount: Number(acharyaForm.coursesCount) || 1,
      verified: acharyaForm.verified,
      photoUrl: acharyaForm.photoUrl
    };

    try {
      await setDoc(doc(db, "academy_acharyas", docId), payload, { merge: true });
      setAcharyas(prev => {
        const exists = prev.some(a => a.id === docId);
        const next = exists ? prev.map(a => a.id === docId ? payload : a) : [...prev, payload];
        try { localStorage.setItem("sanatan_academy_acharyas", JSON.stringify(next)); } catch {}
        return next;
      });
      toast.success(editingAcharyaId ? "आचार्य विवरण अद्यावधिक भयो!" : "नयाँ आचार्य थपियो!");
      setIsAcharyaModalOpen(false);
    } catch (err: any) {
      handleFirestoreError(err, editingAcharyaId ? OperationType.UPDATE : OperationType.CREATE, `academy_acharyas/${docId}`);
      toast.error("आचार्य सेभ गर्न असफल");
    }
  };

  const handleDeleteAcharya = async (id: string) => {
    if (!confirm("के तपाईं यो आचार्य प्रोफाइल हटाउन निश्चित हुनुहुन्छ?")) return;
    try {
      await deleteDoc(doc(db, "academy_acharyas", id));
      setAcharyas(prev => {
        const next = prev.filter(a => a.id !== id);
        try { localStorage.setItem("sanatan_academy_acharyas", JSON.stringify(next)); } catch {}
        return next;
      });
      toast.success("आचार्य प्रोफाइल हटाइयो!");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `academy_acharyas/${id}`);
      toast.error("हटाउन असफल");
    }
  };

  // ---------------- ADMISSIONS & ATTENDANCE CRUD ----------------
  const handleSaveAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admissionForm.student.trim()) {
      toast.error("कृपया विद्यार्थीको नाम र ठेगाना भर्नुहोस्");
      return;
    }

    const docId = `sch-${Date.now()}`;
    const payload: AdmissionApp = {
      id: docId,
      student: admissionForm.student.trim(),
      school: admissionForm.school,
      attendance: admissionForm.attendance.trim() || "85%",
      status: admissionForm.status,
      notes: admissionForm.notes.trim()
    };

    try {
      await setDoc(doc(db, "academy_admissions", docId), payload, { merge: true });
      setScholarshipApps(prev => {
        const next = [payload, ...prev];
        try { localStorage.setItem("sanatan_academy_admissions", JSON.stringify(next)); } catch {}
        return next;
      });
      toast.success("विद्यार्थी आवेदन सफलतापूर्वक थपियो!");
      setIsAdmissionModalOpen(false);
      setAdmissionForm({
        student: "",
        school: schools[0]?.nameNe || "वैदिक दर्शन विद्यापीठ",
        attendance: "90%",
        status: "Pending Review",
        notes: ""
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, `academy_admissions/${docId}`);
      toast.error("आवेदन थप्न असफल");
    }
  };

  const handleUpdateAdmissionStatus = async (id: string, newStatus: string) => {
    try {
      await setDoc(doc(db, "academy_admissions", id), { status: newStatus }, { merge: true });
      setScholarshipApps(prev => {
        const next = prev.map(item => item.id === id ? { ...item, status: newStatus } : item);
        try { localStorage.setItem("sanatan_academy_admissions", JSON.stringify(next)); } catch {}
        return next;
      });
      toast.success(`स्थिति परिवर्तन भयो: ${newStatus}`);
    } catch (e) {
      toast.error("स्थिति परिवर्तन गर्न असफल");
    }
  };

  const handleDeleteAdmission = async (id: string) => {
    if (!confirm("के तपाईं यो आवेदन हटाउन चाहनुहुन्छ?")) return;
    try {
      await deleteDoc(doc(db, "academy_admissions", id));
      setScholarshipApps(prev => {
        const next = prev.filter(a => a.id !== id);
        try { localStorage.setItem("sanatan_academy_admissions", JSON.stringify(next)); } catch {}
        return next;
      });
      toast.success("आवेदन हटाइयो!");
    } catch (e) {
      toast.error("हटाउन असफल");
    }
  };

  // ---------------- LESSONS CRUD ----------------
  const handleOpenCreateLesson = () => {
    setEditingLessonId(null);
    setLessonForm({
      title: "",
      course: courses[0]?.titleNepali || "श्रीमद्भगवद्गीता परिचय",
      duration: "३० मिनेट",
      videoUrl: "",
      audioUrl: ""
    });
    setIsLessonModalOpen(true);
  };

  const handleOpenEditLesson = (les: LessonItem) => {
    setEditingLessonId(les.id);
    setLessonForm({
      title: les.title,
      course: les.course,
      duration: les.duration,
      videoUrl: les.videoUrl || "",
      audioUrl: les.audioUrl || ""
    });
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonForm.title.trim()) {
      toast.error("कृपया पाठको शीर्षक भर्नुहोस्");
      return;
    }

    const docId = editingLessonId || `les-${Date.now()}`;
    const payload: LessonItem = {
      id: docId,
      title: lessonForm.title.trim(),
      course: lessonForm.course,
      duration: lessonForm.duration.trim() || "३० मिनेट",
      videoUrl: lessonForm.videoUrl.trim(),
      audioUrl: lessonForm.audioUrl.trim()
    };

    try {
      await setDoc(doc(db, "academy_lessons", docId), payload, { merge: true });
      setLessons(prev => {
        const exists = prev.some(l => l.id === docId);
        const next = exists ? prev.map(l => l.id === docId ? payload : l) : [...prev, payload];
        try { localStorage.setItem("sanatan_academy_lessons", JSON.stringify(next)); } catch {}
        return next;
      });
      toast.success(editingLessonId ? "पाठ अद्यावधिक भयो!" : "नयाँ पाठ थपियो!");
      setIsLessonModalOpen(false);
    } catch (err: any) {
      handleFirestoreError(err, editingLessonId ? OperationType.UPDATE : OperationType.CREATE, `academy_lessons/${docId}`);
      toast.error("पाठ सेभ गर्न असफल");
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("के तपाईं यो पाठ हटाउन निश्चित हुनुहुन्छ?")) return;
    try {
      await deleteDoc(doc(db, "academy_lessons", id));
      setLessons(prev => {
        const next = prev.filter(l => l.id !== id);
        try { localStorage.setItem("sanatan_academy_lessons", JSON.stringify(next)); } catch {}
        return next;
      });
      toast.success("पाठ हटाइयो!");
    } catch (e) {
      toast.error("हटाउन असफल");
    }
  };

  // ---------------- STUDY MATERIALS CRUD ----------------
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialForm.title.trim()) {
      toast.error("कृपया सामग्रीको शीर्षक भर्नुहोस्");
      return;
    }

    const docId = `mat-${Date.now()}`;
    const payload: MaterialItem = {
      id: docId,
      title: materialForm.title.trim(),
      course: materialForm.course,
      size: materialForm.size.trim() || "२.५ MB",
      downloads: 0,
      fileUrl: materialForm.fileUrl.trim()
    };

    try {
      await setDoc(doc(db, "academy_materials", docId), payload, { merge: true });
      setMaterials(prev => {
        const next = [payload, ...prev];
        try { localStorage.setItem("sanatan_academy_materials", JSON.stringify(next)); } catch {}
        return next;
      });
      toast.success("नयाँ अध्ययन सामग्री / PDF सुरक्षित भयो!");
      setIsMaterialModalOpen(false);
      setMaterialForm({
        title: "",
        course: courses[0]?.titleNepali || "श्रीमद्भगवद्गीता परिचय",
        size: "३.५ MB",
        fileUrl: ""
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, `academy_materials/${docId}`);
      toast.error("सामग्री सुरक्षित गर्न असफल");
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm("के तपाईं यो अध्ययन सामग्री हटाउन निश्चित हुनुहुन्छ?")) return;
    try {
      await deleteDoc(doc(db, "academy_materials", id));
      setMaterials(prev => {
        const next = prev.filter(m => m.id !== id);
        try { localStorage.setItem("sanatan_academy_materials", JSON.stringify(next)); } catch {}
        return next;
      });
      toast.success("सामग्री हटाइयो!");
    } catch (e) {
      toast.error("हटाउन असफल");
    }
  };

  // ---------------- AUDIO TRACKS CRUD ----------------
  const handleSaveAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioForm.title.trim() || !audioForm.speaker.trim()) {
      toast.error("कृपया अडियो शीर्षक र वक्ता / मन्त्रपाठक भर्नुहोस्");
      return;
    }

    const docId = `aud-${Date.now()}`;
    const payload: AudioTrackItem = {
      id: docId,
      title: audioForm.title.trim(),
      speaker: audioForm.speaker.trim(),
      duration: audioForm.duration.trim() || "१५:००",
      audioUrl: audioForm.audioUrl.trim()
    };

    try {
      await setDoc(doc(db, "academy_audios", docId), payload, { merge: true });
      setAudios(prev => {
        const next = [payload, ...prev];
        try { localStorage.setItem("sanatan_academy_audios", JSON.stringify(next)); } catch {}
        return next;
      });
      toast.success("नयाँ अडियो ट्र्याक सुरक्षित भयो!");
      setIsAudioModalOpen(false);
      setAudioForm({
        title: "",
        speaker: "",
        duration: "२०:००",
        audioUrl: ""
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, `academy_audios/${docId}`);
      toast.error("अडियो सुरक्षित गर्न असफल");
    }
  };

  const handleDeleteAudio = async (id: string) => {
    if (!confirm("के तपाईं यो अडियो ट्र्याक हटाउन निश्चित हुनुहुन्छ?")) return;
    try {
      await deleteDoc(doc(db, "academy_audios", id));
      setAudios(prev => {
        const next = prev.filter(a => a.id !== id);
        try { localStorage.setItem("sanatan_academy_audios", JSON.stringify(next)); } catch {}
        return next;
      });
      toast.success("अडियो ट्र्याक हटाइयो!");
    } catch (e) {
      toast.error("हटाउन असफल");
    }
  };

  // ---------------- CERTIFICATES CONFIG ----------------
  const handleSaveCertificateConfig = async () => {
    try {
      await setDoc(doc(db, "settings", "academy_certificates"), certConfig, { merge: true });
      try { localStorage.setItem("sanatan_academy_certificates", JSON.stringify(certConfig)); } catch {}
      toast.success("डिजिटल प्रमाणपत्र मापदण्ड तथा टेम्प्लेट सुरक्षित भयो!");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, "settings/academy_certificates");
      toast.error("प्रमाणपत्र सेटिङ सेभ गर्न असफल");
    }
  };

  const filteredCourses = courses.filter(c => {
    const s = searchTerm.toLowerCase();
    return (c.titleNepali || "").toLowerCase().includes(s) ||
           (c.titleEnglish || "").toLowerCase().includes(s) ||
           (c.instructor || "").toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border-theme shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-500/20">
            <GraduationCap size={14} /> AcademyOS Admin • सनातन डिजिटल अकाडेमी
          </div>
          <h2 className="text-xl md:text-2xl font-black text-card-foreground">
            ई-अकाडेमी तथा पाठ्यक्रम व्यवस्थापक
          </h2>
          <p className="text-xs md:text-sm text-muted-text">
            कोर्सहरू, विद्यापीठहरू, आचार्यहरू, भर्ना, पाठहरू, PDFs, मन्त्रोच्चारण अडियो तथा डिजिटल प्रमाणपत्रहरू प्रबन्ध गर्नुहोस्।
          </p>
        </div>

        {selectedTab === "courses" && (
          <button
            onClick={handleOpenCreateCourse}
            className="px-5 py-2.5 rounded-2xl bg-primary text-white text-xs font-black flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>नयाँ कोर्स थप्नुहोस्</span>
          </button>
        )}
        {selectedTab === "schools" && (
          <button
            onClick={handleOpenCreateSchool}
            className="px-5 py-2.5 rounded-2xl bg-primary text-white text-xs font-black flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>नयाँ विद्यापीठ थप्नुहोस्</span>
          </button>
        )}
        {selectedTab === "acharyas" && (
          <button
            onClick={handleOpenCreateAcharya}
            className="px-5 py-2.5 rounded-2xl bg-primary text-white text-xs font-black flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>नयाँ आचार्य थप्नुहोस्</span>
          </button>
        )}
        {selectedTab === "admissions" && (
          <button
            onClick={() => setIsAdmissionModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-primary text-white text-xs font-black flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>नयाँ भर्ना / छात्रवृत्ति आवेदन</span>
          </button>
        )}
        {selectedTab === "lessons" && (
          <button
            onClick={handleOpenCreateLesson}
            className="px-5 py-2.5 rounded-2xl bg-primary text-white text-xs font-black flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>नयाँ पाठ थप्नुहोस्</span>
          </button>
        )}
        {selectedTab === "materials" && (
          <button
            onClick={() => setIsMaterialModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-primary text-white text-xs font-black flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>PDF / ई-बुक अपलोड गर्नुहोस्</span>
          </button>
        )}
        {selectedTab === "audio" && (
          <button
            onClick={() => setIsAudioModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-primary text-white text-xs font-black flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>अडियो ट्र्याक थप्नुहोस्</span>
          </button>
        )}
      </div>

      {/* Internal Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-border-theme pb-3 overflow-x-auto">
        {[
          { id: "courses", label: "कोर्सहरू (Courses)", icon: BookOpen },
          { id: "schools", label: "विद्यापीठहरू (Gurukul Schools)", icon: GraduationCap },
          { id: "acharyas", label: "आचार्य व्यवस्थापन (Acharyas)", icon: Award },
          { id: "admissions", label: "छात्रवृत्ति र हाजिरी (Admissions & Attendance)", icon: CheckCircle2 },
          { id: "lessons", label: "पाठहरू (Lessons)", icon: Video },
          { id: "video_ads", label: "भिडियो विज्ञापन OS (Video Ads)", icon: Sparkles },
          { id: "materials", label: "PDFs & अध्ययन सामग्री", icon: FileText },
          { id: "audio", label: "अडियो तथा मन्त्रोच्चारण", icon: Music },
          { id: "certificates", label: "प्रमाणपत्र कन्फिगरेसन", icon: Award },
          { id: "assessment", label: "परीक्षा तथा AssessmentOS", icon: HelpCircle }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setSelectedTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedTab === t.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-muted-area text-muted-text hover:text-foreground border border-border-theme"
              }`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. COURSES TAB */}
      {selectedTab === "courses" && (
        <div className="space-y-4">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
            <input
              type="text"
              placeholder="कोर्सको नाम वा प्रशिक्षक खोज्नुहोस्..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border-theme rounded-2xl text-xs font-medium focus:outline-none focus:border-primary text-card-foreground"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCourses.map(course => (
              <div
                key={course.id}
                className="bg-card border border-border-theme rounded-3xl p-5 hover:border-primary/40 transition-all shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="flex gap-4">
                  <img
                    src={course.image}
                    alt={course.titleNepali}
                    className="w-24 h-24 rounded-2xl object-cover shrink-0 border border-border-theme"
                  />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-black uppercase">
                        {course.level}
                      </span>
                      {course.isPopular && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold">
                          लोकप्रिय
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-card-foreground leading-snug">
                      {course.titleNepali}
                    </h3>
                    <p className="text-[11px] text-muted-text">{course.instructor}</p>
                  </div>
                </div>

                <p className="text-xs text-muted-text line-clamp-2">
                  {course.descriptionNepali}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-border-theme/60 text-xs">
                  <div className="flex items-center gap-3 text-muted-text font-medium text-[11px]">
                    <span className="flex items-center gap-1"><Clock size={12} /> {course.duration}</span>
                    <span className="flex items-center gap-1"><BookOpen size={12} /> {course.lessonsCount} पाठ</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditCourse(course)}
                      className="p-2 hover:bg-primary/10 text-primary rounded-xl transition-colors cursor-pointer"
                      title="सम्पादन गर्नुहोस्"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors cursor-pointer"
                      title="हटाउनुहोस्"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. GURUKUL SCHOOLS TAB */}
      {selectedTab === "schools" && (
        <div className="bg-card p-6 rounded-3xl border border-border-theme space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-card-foreground">अनलाइन गुरुकुल विद्यापीठहरू (Gurukul Academic Schools)</h3>
            <span className="text-xs font-bold text-emerald-500">{schools.length} Active Schools</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schools.map((sch) => (
              <div key={sch.id} className="p-5 rounded-2xl border border-border-theme bg-muted-area/30 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-500">{sch.nameEn}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">{sch.studentsCount} विद्यार्थी</span>
                  </div>
                  <div className="text-base font-black text-card-foreground">{sch.nameNe}</div>
                  <p className="text-xs text-muted-text">{sch.descNe}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border-theme/60 text-xs">
                  <div className="text-xs text-muted-text">
                    प्रमुख आचार्य: <strong className="text-card-foreground">{sch.dean}</strong> • {sch.coursesCount} कोर्स
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditSchool(sch)}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded-lg cursor-pointer"
                      title="सम्पादन गर्नुहोस्"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteSchool(sch.id)}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                      title="हटाउनुहोस्"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. ACHARYAS TAB */}
      {selectedTab === "acharyas" && (
        <div className="bg-card p-6 rounded-3xl border border-border-theme space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold text-card-foreground">आचार्य तथा प्राध्यापक निर्देशिका (Acharya & Instructor Management)</h3>
            <span className="text-xs font-bold text-primary">{acharyas.length} Registered Acharyas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {acharyas.map((a) => (
              <div key={a.id} className="p-4 rounded-2xl border border-border-theme bg-muted-area/30 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-black text-card-foreground flex items-center gap-1.5">
                    <span>{a.nameNe}</span>
                    {a.verified && <CheckCircle2 size={14} className="text-emerald-500" />}
                  </div>
                  <div className="text-xs text-amber-500 font-semibold">{a.titleNe}</div>
                  <div className="text-[11px] text-muted-text">{a.school} • अनुभव: {a.experience}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 text-[11px] font-bold">
                    {a.coursesCount} कोर्स
                  </span>
                  <button
                    onClick={() => handleOpenEditAcharya(a)}
                    className="p-1.5 text-primary hover:bg-primary/10 rounded-lg cursor-pointer"
                    title="सम्पादन"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteAcharya(a.id)}
                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                    title="हटाउनुहोस्"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ADMISSIONS & ATTENDANCE TAB */}
      {selectedTab === "admissions" && (
        <div className="bg-card p-6 rounded-3xl border border-border-theme space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-card-foreground">छात्रवृत्ति, भर्ना र हाजिरी व्यवस्थापन (Scholarships, Admissions & Attendance)</h3>
            <span className="text-xs font-bold text-amber-500">न्यूनतम हाजिरी मापदण्ड: ८०% अनिवार्य</span>
          </div>
          <div className="divide-y divide-border-theme/60 text-xs">
            {scholarshipApps.map((app) => (
              <div key={app.id} className="py-3.5 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="font-bold text-card-foreground text-sm">{app.student}</div>
                  <div className="text-muted-text">{app.school} • हाजिरी (Attendance): <strong className="text-emerald-500">{app.attendance}</strong></div>
                  {app.notes && <div className="text-[11px] text-muted-text italic">नोट: {app.notes}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full font-bold text-[11px] ${
                    app.status.includes("Approved") 
                      ? "bg-emerald-500/10 text-emerald-500" 
                      : app.status.includes("Rejected") 
                      ? "bg-red-500/10 text-red-500" 
                      : "bg-amber-500/10 text-amber-500"
                  }`}>
                    {app.status}
                  </span>
                  {app.status === "Pending Review" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdateAdmissionStatus(app.id, "Approved (छात्रवृत्ति स्वीकृत)")}
                        className="px-3 py-1 rounded-xl bg-primary text-white font-bold text-[11px] cursor-pointer"
                      >
                        स्वीकृत
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateAdmissionStatus(app.id, "Rejected (अस्वीकृत)")}
                        className="px-3 py-1 rounded-xl bg-red-500/20 text-red-500 hover:bg-red-500/30 font-bold text-[11px] cursor-pointer"
                      >
                        अस्वीकृत
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteAdmission(app.id)}
                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                    title="हटाउनुहोस्"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. LESSONS TAB */}
      {selectedTab === "lessons" && (
        <div className="bg-card p-6 rounded-3xl border border-border-theme space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-card-foreground">पाठ्यक्रमका भिडियो तथा अडियो पाठहरू (Curriculum Lessons)</h3>
            <span className="text-xs font-bold text-primary">{lessons.length} पाठहरू दर्ता</span>
          </div>
          <div className="divide-y divide-border-theme/60 text-xs">
            {lessons.map(l => (
              <div key={l.id} className="py-3 flex items-center justify-between hover:bg-muted-area/30 px-2 rounded-xl">
                <div className="space-y-0.5">
                  <div className="font-bold text-card-foreground flex items-center gap-2">
                    <Video size={14} className="text-primary" />
                    <span>{l.title}</span>
                  </div>
                  <div className="text-muted-text text-[11px] flex items-center gap-2">
                    <span>{l.course}</span> • <span className="flex items-center gap-1"><Clock size={10} /> {l.duration}</span>
                    {l.videoUrl && <span className="text-emerald-500 font-bold">• Video Link</span>}
                    {l.audioUrl && <span className="text-amber-500 font-bold">• Audio Link</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditLesson(l)}
                    className="p-1.5 hover:bg-primary/10 text-primary rounded-lg cursor-pointer"
                    title="सम्पादन"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteLesson(l.id)}
                    className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg cursor-pointer"
                    title="हटाउनुहोस्"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. STUDY MATERIALS (PDFs) TAB */}
      {selectedTab === "materials" && (
        <div className="bg-card p-6 rounded-3xl border border-border-theme space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-card-foreground">डिजिटल अध्ययन सामग्री तथा PDFs (Study Notes & Guides)</h3>
            <span className="text-xs font-bold text-primary">{materials.length} सामग्री उपलब्ध</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {materials.map((m) => (
              <div key={m.id} className="p-4 bg-muted-area/40 border border-border-theme rounded-2xl space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-primary font-bold text-xs">
                    <span className="flex items-center gap-1.5"><FileText size={16} /> PDF सामग्री</span>
                    <button
                      onClick={() => handleDeleteMaterial(m.id)}
                      className="p-1 text-red-500 hover:bg-red-500/10 rounded cursor-pointer"
                      title="हटाउनुहोस्"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="font-bold text-card-foreground text-xs">{m.title}</div>
                  <div className="text-[11px] text-muted-text">{m.course}</div>
                </div>
                <div className="text-[10px] text-muted-text flex justify-between items-center pt-2 border-t border-border-theme">
                  <span>साइज: {m.size}</span>
                  {m.fileUrl ? (
                    <a
                      href={m.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline font-bold flex items-center gap-1"
                    >
                      <Download size={11} /> डाउनलोड
                    </a>
                  ) : (
                    <span>{m.downloads} डाउनलोड</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. AUDIO LECTURES TAB */}
      {selectedTab === "audio" && (
        <div className="bg-card p-6 rounded-3xl border border-border-theme space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-card-foreground">अडियो फाइल तथा वैदिक मन्त्रोच्चारण (Audio Lectures)</h3>
            <span className="text-xs font-bold text-primary">{audios.length} अडियो ट्र्याक</span>
          </div>
          <div className="divide-y divide-border-theme/60 text-xs">
            {audios.map((a) => (
              <div key={a.id} className="py-3 flex items-center justify-between hover:bg-muted-area/30 px-2 rounded-xl">
                <div className="space-y-0.5">
                  <div className="font-bold text-card-foreground flex items-center gap-2">
                    <Music size={14} className="text-amber-500" /> {a.title}
                  </div>
                  <div className="text-muted-text text-[11px]">{a.speaker} • {a.duration}</div>
                  {a.audioUrl && (
                    <audio src={a.audioUrl} controls className="h-7 mt-1 w-64 max-w-full" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteAudio(a.id)}
                    className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg cursor-pointer"
                    title="हटाउनुहोस्"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. CERTIFICATES CONFIGURATION TAB */}
      {selectedTab === "certificates" && (
        <div className="bg-card p-6 rounded-3xl border border-border-theme space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-card-foreground flex items-center gap-2">
              <Award size={18} className="text-amber-500" />
              <span>डिजिटल प्रमाणपत्र व्यवस्थापन (Certificate Verification Engine)</span>
            </h3>
            <p className="text-xs text-muted-text">
              कोर्स उत्तीर्ण गर्ने विद्यार्थीहरूका लागि स्वचालित डिजिटल प्रमाणपत्र र QR कोड प्रमाणीकरण।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-5 bg-muted-area/40 rounded-2xl border border-border-theme space-y-4">
              <h4 className="font-bold text-card-foreground">प्रमाणपत्र मापदण्ड (Passing Criteria)</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-muted-text mb-1">न्यूनतम उत्तीर्ण अङ्क (%):</label>
                  <input
                    type="number"
                    value={certConfig.passingScore}
                    onChange={e => setCertConfig(p => ({ ...p, passingScore: Number(e.target.value) || 70 }))}
                    className="w-full bg-card border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                  />
                </div>
                <div>
                  <label className="block text-muted-text mb-1">प्रमाणपत्र जारीकर्ता हस्ताक्षरकर्ता (Signatory):</label>
                  <input
                    type="text"
                    value={certConfig.signatory}
                    onChange={e => setCertConfig(p => ({ ...p, signatory: e.target.value }))}
                    className="w-full bg-card border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                  />
                </div>
                <div>
                  <label className="block text-muted-text mb-1">संस्था / निकाय शीर्षक (Issuer Title):</label>
                  <input
                    type="text"
                    value={certConfig.issuerTitle}
                    onChange={e => setCertConfig(p => ({ ...p, issuerTitle: e.target.value }))}
                    className="w-full bg-card border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveCertificateConfig}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save size={14} /> सेभ गर्नुहोस्
                </button>
              </div>
            </div>

            <div className="p-5 bg-muted-area/40 rounded-2xl border border-border-theme flex flex-col justify-between">
              <div className="space-y-2">
                <h4 className="font-bold text-card-foreground">प्रमाणपत्र प्रिभ्यू</h4>
                <div className="p-5 bg-card border border-amber-500/40 rounded-xl text-center space-y-3 shadow-inner">
                  <Award size={36} className="mx-auto text-amber-500" />
                  <div className="font-black text-sm tracking-wide text-card-foreground">{certConfig.issuerTitle}</div>
                  <div className="text-[11px] text-muted-text">Certificate of Authentic Vedic Mastery</div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    उत्तीर्णाङ्क: {certConfig.passingScore}%
                  </div>
                  <div className="pt-2 border-t border-border-theme text-[10px] text-muted-text">
                    अधिकृत हस्ताक्षरकर्ता: <strong>{certConfig.signatory}</strong>
                  </div>
                  <div className="text-[9px] text-muted-text font-mono">Verification: {certConfig.templateHash}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. VIDEO ADS OS */}
      {selectedTab === "video_ads" && <AcademyVideoAdsAdmin />}

      {/* 10. ASSESSMENT OS */}
      {selectedTab === "assessment" && <AssessmentOSAdmin />}

      {/* ----------------- MODALS ----------------- */}

      {/* Course Modal */}
      <AnimatePresence>
        {isCourseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card text-card-foreground border border-border-theme rounded-3xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border-theme">
                <h3 className="text-base font-black flex items-center gap-2">
                  <GraduationCap size={18} className="text-emerald-500" />
                  {editingCourseId ? "कोर्स सम्पादन" : "नयाँ कोर्स सिर्जना गर्नुहोस्"}
                </h3>
                <button
                  onClick={() => setIsCourseModalOpen(false)}
                  className="p-1 rounded-xl text-muted-text hover:text-foreground hover:bg-muted-area cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveCourse} className="space-y-4 mt-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-muted-text mb-1">नेपाली कोर्स शीर्षक *</label>
                    <input
                      type="text"
                      required
                      value={courseForm.titleNepali}
                      onChange={e => setCourseForm(p => ({ ...p, titleNepali: e.target.value }))}
                      placeholder="उदा: श्रीमद्भगवद्गीता परिचय"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-muted-text mb-1">English Course Title</label>
                    <input
                      type="text"
                      value={courseForm.titleEnglish}
                      onChange={e => setCourseForm(p => ({ ...p, titleEnglish: e.target.value }))}
                      placeholder="e.g. Introduction to Bhagavad Gita"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-muted-text mb-1">प्रशिक्षक / आचार्य *</label>
                    <input
                      type="text"
                      required
                      value={courseForm.instructor}
                      onChange={e => setCourseForm(p => ({ ...p, instructor: e.target.value }))}
                      placeholder="उदा: डा. स्वामी रामानन्द"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-muted-text mb-1">तह (Level)</label>
                    <select
                      value={courseForm.level}
                      onChange={e => setCourseForm(p => ({ ...p, level: e.target.value as any }))}
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    >
                      <option value="प्रारम्भिक (Beginner)">प्रारम्भिक (Beginner)</option>
                      <option value="मध्यम (Intermediate)">मध्यम (Intermediate)</option>
                      <option value="विशिष्ट (Advanced)">विशिष्ट (Advanced)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-muted-text mb-1">विधा (Category)</label>
                    <select
                      value={courseForm.category}
                      onChange={e => setCourseForm(p => ({ ...p, category: e.target.value as any }))}
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    >
                      <option value="scripture">धर्मशास्त्र (Scripture)</option>
                      <option value="history">इतिहास (History)</option>
                      <option value="language">संस्कृत भाषा (Language)</option>
                      <option value="heritage">सम्पदा (Heritage)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-muted-text mb-1">अवधि (Duration Text)</label>
                    <input
                      type="text"
                      value={courseForm.duration}
                      onChange={e => setCourseForm(p => ({ ...p, duration: e.target.value }))}
                      placeholder="उदा: ४ हप्ता (१२ पाठ)"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-muted-text mb-1">पाठ संख्या (Lessons Count)</label>
                    <input
                      type="number"
                      value={courseForm.lessonsCount}
                      onChange={e => setCourseForm(p => ({ ...p, lessonsCount: parseInt(e.target.value) || 1 }))}
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-muted-text mb-1">नेपाली विवरण *</label>
                  <textarea
                    rows={3}
                    required
                    value={courseForm.descriptionNepali}
                    onChange={e => setCourseForm(p => ({ ...p, descriptionNepali: e.target.value }))}
                    placeholder="कोर्सको परिचय र सिकाइ उद्देश्य..."
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                  />
                </div>

                <div>
                  <label className="block font-bold text-muted-text mb-1">कभर तस्बिर (Image URL वा File Upload)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={courseForm.image}
                      onChange={e => setCourseForm(p => ({ ...p, image: e.target.value }))}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    />
                    <label className="px-3 py-2 bg-muted-area hover:bg-muted-area/80 border border-border-theme rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 text-muted-text font-bold">
                      <Upload size={14} />
                      <span>अपलोड</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUploadHelper(f, url => setCourseForm(p => ({ ...p, image: url })));
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="popular"
                    checked={courseForm.isPopular}
                    onChange={e => setCourseForm(p => ({ ...p, isPopular: e.target.checked }))}
                    className="rounded border-border-theme text-primary focus:ring-primary"
                  />
                  <label htmlFor="popular" className="font-bold text-card-foreground cursor-pointer">
                    गृहपृष्ठमा लोकप्रिय कोर्सका रूपमा देखाउनुहोस् (Featured / Popular)
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-theme">
                  <button
                    type="button"
                    onClick={() => setIsCourseModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-muted-area hover:bg-muted-area/80 font-bold cursor-pointer"
                  >
                    रद्द गर्नुहोस्
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-white font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save size={14} /> सुरक्षित गर्नुहोस्
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* School Modal */}
      <AnimatePresence>
        {isSchoolModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card text-card-foreground border border-border-theme rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border-theme">
                <h3 className="text-base font-black flex items-center gap-2">
                  <GraduationCap size={18} className="text-primary" />
                  {editingSchoolId ? "विद्यापीठ सम्पादन" : "नयाँ विद्यापीठ थप्नुहोस्"}
                </h3>
                <button
                  onClick={() => setIsSchoolModalOpen(false)}
                  className="p-1 rounded-xl text-muted-text hover:text-foreground hover:bg-muted-area cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveSchool} className="space-y-4 mt-4 text-xs">
                <div>
                  <label className="block font-bold text-muted-text mb-1">विद्यापीठको नाम (नेपाली) *</label>
                  <input
                    type="text"
                    required
                    value={schoolForm.nameNe}
                    onChange={e => setSchoolForm(p => ({ ...p, nameNe: e.target.value }))}
                    placeholder="उदा: वैदिक दर्शन विद्यापीठ"
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted-text mb-1">School Name (English)</label>
                  <input
                    type="text"
                    value={schoolForm.nameEn}
                    onChange={e => setSchoolForm(p => ({ ...p, nameEn: e.target.value }))}
                    placeholder="e.g. School of Vedic Philosophy"
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-muted-text mb-1">प्रमुख आचार्य (Dean) *</label>
                    <input
                      type="text"
                      required
                      value={schoolForm.dean}
                      onChange={e => setSchoolForm(p => ({ ...p, dean: e.target.value }))}
                      placeholder="उदा: डा. स्वामी रामानन्द"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-muted-text mb-1">विद्यार्थी संख्या</label>
                    <input
                      type="text"
                      value={schoolForm.studentsCount}
                      onChange={e => setSchoolForm(p => ({ ...p, studentsCount: e.target.value }))}
                      placeholder="उदा: १,२००+"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-muted-text mb-1">संक्षिप्त विवरण / विषयक्षेत्र</label>
                  <textarea
                    rows={2}
                    value={schoolForm.descNe}
                    onChange={e => setSchoolForm(p => ({ ...p, descNe: e.target.value }))}
                    placeholder="वेद, उपनिषद्, षड्दर्शन..."
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-theme">
                  <button
                    type="button"
                    onClick={() => setIsSchoolModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-muted-area font-bold cursor-pointer"
                  >
                    रद्द
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-white font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save size={14} /> सुरक्षित गर्नुहोस्
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Acharya Modal */}
      <AnimatePresence>
        {isAcharyaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card text-card-foreground border border-border-theme rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border-theme">
                <h3 className="text-base font-black flex items-center gap-2">
                  <Award size={18} className="text-primary" />
                  {editingAcharyaId ? "आचार्य प्रोफाइल सम्पादन" : "नयाँ आचार्य थप्नुहोस्"}
                </h3>
                <button
                  onClick={() => setIsAcharyaModalOpen(false)}
                  className="p-1 rounded-xl text-muted-text hover:text-foreground hover:bg-muted-area cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveAcharya} className="space-y-4 mt-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-muted-text mb-1">आचार्यको नाम (नेपाली) *</label>
                    <input
                      type="text"
                      required
                      value={acharyaForm.nameNe}
                      onChange={e => setAcharyaForm(p => ({ ...p, nameNe: e.target.value }))}
                      placeholder="उदा: आचार्य विष्णुप्रसाद शर्मा"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-muted-text mb-1">Name (English)</label>
                    <input
                      type="text"
                      value={acharyaForm.nameEn}
                      onChange={e => setAcharyaForm(p => ({ ...p, nameEn: e.target.value }))}
                      placeholder="Acharya Bishnu Prasad"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-muted-text mb-1">उपाधि तथा विशेषज्ञता</label>
                  <input
                    type="text"
                    value={acharyaForm.titleNe}
                    onChange={e => setAcharyaForm(p => ({ ...p, titleNe: e.target.value }))}
                    placeholder="उदा: पाणिनीय व्याकरण प्राध्यापक"
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-muted-text mb-1">सम्बद्ध विद्यापीठ</label>
                    <select
                      value={acharyaForm.school}
                      onChange={e => setAcharyaForm(p => ({ ...p, school: e.target.value }))}
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    >
                      {schools.map(s => (
                        <option key={s.id} value={s.nameNe}>{s.nameNe}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-muted-text mb-1">अध्यापन अनुभव</label>
                    <input
                      type="text"
                      value={acharyaForm.experience}
                      onChange={e => setAcharyaForm(p => ({ ...p, experience: e.target.value }))}
                      placeholder="उदा: १५+ वर्ष"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="ach_verified"
                    checked={acharyaForm.verified}
                    onChange={e => setAcharyaForm(p => ({ ...p, verified: e.target.checked }))}
                    className="rounded border-border-theme text-primary focus:ring-primary"
                  />
                  <label htmlFor="ach_verified" className="font-bold text-card-foreground cursor-pointer">
                    प्रमाणित आचार्य ब्याच देखाउनुहोस् (Verified Badge)
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-theme">
                  <button
                    type="button"
                    onClick={() => setIsAcharyaModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-muted-area font-bold cursor-pointer"
                  >
                    रद्द
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-white font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save size={14} /> सुरक्षित गर्नुहोस्
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admission Modal */}
      <AnimatePresence>
        {isAdmissionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card text-card-foreground border border-border-theme rounded-3xl max-w-lg w-full p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border-theme">
                <h3 className="text-base font-black flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-primary" />
                  नयाँ भर्ना तथा छात्रवृत्ति आवेदन
                </h3>
                <button
                  onClick={() => setIsAdmissionModalOpen(false)}
                  className="p-1 rounded-xl text-muted-text hover:text-foreground hover:bg-muted-area cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveAdmission} className="space-y-4 mt-4 text-xs">
                <div>
                  <label className="block font-bold text-muted-text mb-1">विद्यार्थीको नाम र जिल्ला *</label>
                  <input
                    type="text"
                    required
                    value={admissionForm.student}
                    onChange={e => setAdmissionForm(p => ({ ...p, student: e.target.value }))}
                    placeholder="उदा: रमेश काफ्ले (झापा)"
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-muted-text mb-1">विद्यापीठ</label>
                    <select
                      value={admissionForm.school}
                      onChange={e => setAdmissionForm(p => ({ ...p, school: e.target.value }))}
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    >
                      {schools.map(s => (
                        <option key={s.id} value={s.nameNe}>{s.nameNe}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-muted-text mb-1">हाजिरी प्रतिशत</label>
                    <input
                      type="text"
                      value={admissionForm.attendance}
                      onChange={e => setAdmissionForm(p => ({ ...p, attendance: e.target.value }))}
                      placeholder="उदा: 92%"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-muted-text mb-1">आवेदन स्थिति</label>
                  <select
                    value={admissionForm.status}
                    onChange={e => setAdmissionForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                  >
                    <option value="Pending Review">Pending Review</option>
                    <option value="Approved (मेधावी छात्रवृत्ति)">Approved (मेधावी छात्रवृत्ति)</option>
                    <option value="Approved (पूर्ण शुल्क मिनाहा)">Approved (पूर्ण शुल्क मिनाहा)</option>
                    <option value="Rejected (अस्वीकृत)">Rejected (अस्वीकृत)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-muted-text mb-1">थप टिप्पणी / सिफारिस</label>
                  <textarea
                    rows={2}
                    value={admissionForm.notes}
                    onChange={e => setAdmissionForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="विद्यार्थीको पारिवारिक पृष्ठभूमि वा विशेष योग्यता..."
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-theme">
                  <button
                    type="button"
                    onClick={() => setIsAdmissionModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-muted-area font-bold cursor-pointer"
                  >
                    रद्द
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-white font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save size={14} /> आवेदन दर्ता गर्नुहोस्
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lesson Modal */}
      <AnimatePresence>
        {isLessonModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card text-card-foreground border border-border-theme rounded-3xl max-w-lg w-full p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border-theme">
                <h3 className="text-base font-black flex items-center gap-2">
                  <Video size={18} className="text-primary" />
                  {editingLessonId ? "पाठ सम्पादन" : "नयाँ पाठ थप्नुहोस्"}
                </h3>
                <button
                  onClick={() => setIsLessonModalOpen(false)}
                  className="p-1 rounded-xl text-muted-text hover:text-foreground hover:bg-muted-area cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveLesson} className="space-y-4 mt-4 text-xs">
                <div>
                  <label className="block font-bold text-muted-text mb-1">पाठको शीर्षक *</label>
                  <input
                    type="text"
                    required
                    value={lessonForm.title}
                    onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="उदा: पाठ ४: ज्ञान र कर्म संन्यास योग"
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-muted-text mb-1">सम्बन्धित कोर्स</label>
                    <select
                      value={lessonForm.course}
                      onChange={e => setLessonForm(p => ({ ...p, course: e.target.value }))}
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.titleNepali}>{c.titleNepali}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-muted-text mb-1">अवधि (मिनेट)</label>
                    <input
                      type="text"
                      value={lessonForm.duration}
                      onChange={e => setLessonForm(p => ({ ...p, duration: e.target.value }))}
                      placeholder="उदा: ३५ मिनेट"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-muted-text mb-1">भिडियो URL (YouTube / HLS / MP4)</label>
                  <input
                    type="text"
                    value={lessonForm.videoUrl}
                    onChange={e => setLessonForm(p => ({ ...p, videoUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                  />
                </div>

                <div>
                  <label className="block font-bold text-muted-text mb-1">अडियो पाठ URL / File Upload</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={lessonForm.audioUrl}
                      onChange={e => setLessonForm(p => ({ ...p, audioUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    />
                    <label className="px-3 py-2 bg-muted-area hover:bg-muted-area/80 border border-border-theme rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 text-muted-text font-bold">
                      <Upload size={14} />
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUploadHelper(f, url => setLessonForm(p => ({ ...p, audioUrl: url })));
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-theme">
                  <button
                    type="button"
                    onClick={() => setIsLessonModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-muted-area font-bold cursor-pointer"
                  >
                    रद्द
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-white font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save size={14} /> सुरक्षित गर्नुहोस्
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Material Modal */}
      <AnimatePresence>
        {isMaterialModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card text-card-foreground border border-border-theme rounded-3xl max-w-lg w-full p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border-theme">
                <h3 className="text-base font-black flex items-center gap-2">
                  <FileText size={18} className="text-primary" />
                  PDF / अध्ययन सामग्री अपलोड
                </h3>
                <button
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="p-1 rounded-xl text-muted-text hover:text-foreground hover:bg-muted-area cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveMaterial} className="space-y-4 mt-4 text-xs">
                <div>
                  <label className="block font-bold text-muted-text mb-1">सामग्री शीर्षक *</label>
                  <input
                    type="text"
                    required
                    value={materialForm.title}
                    onChange={e => setMaterialForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="उदा: संस्कृत व्याकरण सार संग्रह"
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-muted-text mb-1">सम्बन्धित कोर्स</label>
                    <select
                      value={materialForm.course}
                      onChange={e => setMaterialForm(p => ({ ...p, course: e.target.value }))}
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.titleNepali}>{c.titleNepali}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-muted-text mb-1">साइज (Size)</label>
                    <input
                      type="text"
                      value={materialForm.size}
                      onChange={e => setMaterialForm(p => ({ ...p, size: e.target.value }))}
                      placeholder="उदा: २.५ MB"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-muted-text mb-1">PDF फाइल URL वा Local Upload</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={materialForm.fileUrl}
                      onChange={e => setMaterialForm(p => ({ ...p, fileUrl: e.target.value }))}
                      placeholder="https://... वा फाइल छान्नुहोस्"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    />
                    <label className="px-3 py-2 bg-muted-area hover:bg-muted-area/80 border border-border-theme rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 text-muted-text font-bold">
                      <Upload size={14} />
                      <span>फाइल</span>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const mb = (f.size / (1024 * 1024)).toFixed(1);
                            setMaterialForm(p => ({ ...p, size: `${mb} MB` }));
                            handleFileUploadHelper(f, url => setMaterialForm(p => ({ ...p, fileUrl: url })));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-theme">
                  <button
                    type="button"
                    onClick={() => setIsMaterialModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-muted-area font-bold cursor-pointer"
                  >
                    रद्द
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-white font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save size={14} /> सुरक्षित गर्नुहोस्
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Audio Modal */}
      <AnimatePresence>
        {isAudioModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card text-card-foreground border border-border-theme rounded-3xl max-w-lg w-full p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border-theme">
                <h3 className="text-base font-black flex items-center gap-2">
                  <Music size={18} className="text-amber-500" />
                  अडियो ट्र्याक तथा मन्त्रोच्चारण
                </h3>
                <button
                  onClick={() => setIsAudioModalOpen(false)}
                  className="p-1 rounded-xl text-muted-text hover:text-foreground hover:bg-muted-area cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveAudio} className="space-y-4 mt-4 text-xs">
                <div>
                  <label className="block font-bold text-muted-text mb-1">अडियो शीर्षक *</label>
                  <input
                    type="text"
                    required
                    value={audioForm.title}
                    onChange={e => setAudioForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="उदा: ऋग्वेद शान्तिमन्त्र र पुरुषसूक्त गायन"
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-muted-text mb-1">वक्ता / मन्त्रपाठक *</label>
                    <input
                      type="text"
                      required
                      value={audioForm.speaker}
                      onChange={e => setAudioForm(p => ({ ...p, speaker: e.target.value }))}
                      placeholder="उदा: पशुपतिनाथ मन्दिर वेदपाठक दल"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-muted-text mb-1">अवधि (Duration)</label>
                    <input
                      type="text"
                      value={audioForm.duration}
                      onChange={e => setAudioForm(p => ({ ...p, duration: e.target.value }))}
                      placeholder="उदा: १८:४०"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-muted-text mb-1">अडियो URL वा Audio File Upload</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={audioForm.audioUrl}
                      onChange={e => setAudioForm(p => ({ ...p, audioUrl: e.target.value }))}
                      placeholder="https://... वा अडियो फाइल छान्नुहोस्"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs text-card-foreground"
                    />
                    <label className="px-3 py-2 bg-muted-area hover:bg-muted-area/80 border border-border-theme rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 text-muted-text font-bold">
                      <Upload size={14} />
                      <span>अडियो</span>
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUploadHelper(f, url => setAudioForm(p => ({ ...p, audioUrl: url })));
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-theme">
                  <button
                    type="button"
                    onClick={() => setIsAudioModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-muted-area font-bold cursor-pointer"
                  >
                    रद्द
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-white font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save size={14} /> सुरक्षित गर्नुहोस्
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
