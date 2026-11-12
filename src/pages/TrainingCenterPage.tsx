import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { 
  TRAINING_TRACKS, 
  CERTIFICATION_PATHS, 
  TrainingTrack, 
  Lesson,
  CertificationPath 
} from "../components/training/TrainingData";

import TrainingHeader, { TrainingTabType } from "../components/training/TrainingHeader";
import TrainingTrackCard from "../components/training/TrainingTrackCard";
import LessonView from "../components/training/LessonView";
import CertificationExamModal from "../components/training/CertificationExamModal";
import KnowledgeBaseSection from "../components/training/KnowledgeBaseSection";

// Phase 2 Interactive Learning & Operational Modules
import ProductToursModal from "../components/training/tours/ProductToursModal";
import RoleBasedLearningPaths from "../components/training/paths/RoleBasedLearningPaths";
import VisualFeatureExplainers from "../components/training/explainers/VisualFeatureExplainers";
import VideoTrainingLibrary from "../components/training/video/VideoTrainingLibrary";
import SGISMasterAcademy from "../components/training/sgis/SGISMasterAcademy";
import SanatanSimulator from "../components/training/simulator/SanatanSimulator";
import CertificationFrameworkView from "../components/training/certifications/CertificationFrameworkView";
import EnterprisePresentationMode from "../components/training/presentation/EnterprisePresentationMode";
import SearchableHelpCenter from "../components/training/help/SearchableHelpCenter";
import TrainingAnalyticsDashboard from "../components/training/analytics/TrainingAnalyticsDashboard";
import OfflineTrainingManager from "../components/training/offline/OfflineTrainingManager";

// Phase 3 & 4 Enterprise Modules
import CompetencyOSView from "../components/training/competency/CompetencyOSView";
import { TrainingAIMentorModal } from "../components/training/mentor/TrainingAIMentorModal";
import TrainingRealityAuditModal from "../components/training/audit/TrainingRealityAuditModal";
import { 
  trainingPersistence, 
  UserTrainingProgress, 
  UserCertificationRecord 
} from "../services/trainingPersistenceService";
import { getActiveInstitution, InstitutionalPartner } from "../services/institutionalTrainingService";
import { Link } from "react-router-dom";

import EcosystemArchitectureDiagram from "../components/training/diagrams/EcosystemArchitectureDiagram";
import AINewsroomPipelineDiagram from "../components/training/diagrams/AINewsroomPipelineDiagram";
import SGISPipelineDiagram from "../components/training/diagrams/SGISPipelineDiagram";
import RBACApprovalChainDiagram from "../components/training/diagrams/RBACApprovalChainDiagram";
import SnapshotOSResilienceDiagram from "../components/training/diagrams/SnapshotOSResilienceDiagram";

import { 
  Award, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  HelpCircle, 
  Layers, 
  GraduationCap,
  Building2,
  ExternalLink,
  Bot,
  ShieldCheck
} from "lucide-react";

export default function TrainingCenterPage() {
  const { trackId, lessonId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TrainingTabType>("tracks");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPersona, setSelectedPersona] = useState<string>("all");

  const [selectedTrack, setSelectedTrack] = useState<TrainingTrack | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const [activeExamCertId, setActiveExamCertId] = useState<string | null>(null);
  const [isToursModalOpen, setIsToursModalOpen] = useState<boolean>(false);
  const [selectedTourId, setSelectedTourId] = useState<string | undefined>(undefined);
  const [isPresentationModeOpen, setIsPresentationModeOpen] = useState<boolean>(false);
  const [isAIMentorOpen, setIsAIMentorOpen] = useState<boolean>(false);
  const [activeInstitution, setActiveInstitution] = useState<InstitutionalPartner>(getActiveInstitution());

  // Cloud & offline training progress state
  const [userProgressRecord, setUserProgressRecord] = useState<UserTrainingProgress | null>(null);
  const [userCertificates, setUserCertificates] = useState<UserCertificationRecord[]>([]);

  // Local storage persistence for user progress
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("sm_completed_lessons");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [earnedCertificates, setEarnedCertificates] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("sm_earned_certificates");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Initial cloud synchronization from Firestore
  useEffect(() => {
    async function loadCloudTrainingData() {
      try {
        const progress = await trainingPersistence.getUserProgress();
        const certs = await trainingPersistence.getUserCertifications();
        setUserProgressRecord(progress);
        setUserCertificates(certs);
        if (progress.completedLessons && progress.completedLessons.length > 0) {
          setCompletedLessons(progress.completedLessons);
        }
      } catch (err) {
        console.warn("[Training Center] Cloud load fallback to local storage:", err);
      }
    }
    loadCloudTrainingData();
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("sm_completed_lessons", JSON.stringify(completedLessons));
    } catch (e) {
      console.warn("Could not save completed lessons to localStorage", e);
    }
  }, [completedLessons]);

  useEffect(() => {
    try {
      localStorage.setItem("sm_earned_certificates", JSON.stringify(earnedCertificates));
    } catch (e) {
      console.warn("Could not save earned certificates to localStorage", e);
    }
  }, [earnedCertificates]);

  // Sync with route params
  useEffect(() => {
    const validTabs: TrainingTabType[] = [
      "tracks", "competency", "paths", "explainers", "videos", "sgis", 
      "simulator", "certifications", "help", "analytics", "architecture"
    ];

    if (trackId && validTabs.includes(trackId as TrainingTabType)) {
      setActiveTab(trackId as TrainingTabType);
      setSelectedTrack(null);
      setSelectedLesson(null);
      return;
    }

    if (trackId) {
      const found = TRAINING_TRACKS.find(t => t.id === trackId || t.slug === trackId);
      if (found) {
        setSelectedTrack(found);
        if (lessonId) {
          const l = found.lessons.find(item => item.id === lessonId);
          setSelectedLesson(l || found.lessons[0]);
        } else {
          setSelectedLesson(found.lessons[0]);
        }
        return;
      }
    }
    
    // Check if exam param is set
    const examParam = searchParams.get("exam");
    if (examParam) {
      setActiveExamCertId(examParam);
    }

    // Check if tab param is set
    const tabParam = searchParams.get("tab") as TrainingTabType;
    if (tabParam && ["tracks", "competency", "paths", "explainers", "videos", "sgis", "simulator", "certifications", "help", "analytics", "architecture"].includes(tabParam)) {
      setActiveTab(tabParam);
    }

    // Check if tour param is set
    const tourParam = searchParams.get("tour");
    if (tourParam) {
      setSelectedTourId(tourParam);
      setIsToursModalOpen(true);
    }

    // Check if presentation param is set
    if (searchParams.get("presentation") === "true") {
      setIsPresentationModeOpen(true);
    }
  }, [trackId, lessonId, searchParams]);

  const toggleLessonComplete = async (lId: string) => {
    const isNowCompleted = !completedLessons.includes(lId);
    setCompletedLessons(prev => 
      prev.includes(lId) ? prev.filter(x => x !== lId) : [...prev, lId]
    );

    if (isNowCompleted && selectedTrack) {
      try {
        const updated = await trainingPersistence.markLessonComplete(lId, selectedTrack.id, 15);
        setUserProgressRecord(updated);
      } catch (err) {
        console.warn("Could not sync lesson to Firestore:", err);
      }
    }
  };

  const handleCertificateEarned = async (certId: string) => {
    setEarnedCertificates(prev => 
      prev.includes(certId) ? prev : [...prev, certId]
    );

    const path = CERTIFICATION_PATHS.find(c => c.id === certId);
    if (path) {
      try {
        const newRecord = await trainingPersistence.saveCertification(path, 95);
        setUserCertificates(prev => [...prev, newRecord]);
      } catch (err) {
        console.warn("Could not save certificate in cloud registry:", err);
      }
    }
  };

  const handleSelectTrack = (track: TrainingTrack) => {
    setSelectedTrack(track);
    setSelectedLesson(track.lessons[0]);
    navigate(`/training/${track.slug}/${track.lessons[0].id}`);
  };

  const handleBackToTracks = () => {
    setSelectedTrack(null);
    setSelectedLesson(null);
    navigate("/training");
  };

  const handleSelectLesson = (lId: string) => {
    if (!selectedTrack) return;
    const l = selectedTrack.lessons.find(item => item.id === lId);
    if (l) {
      setSelectedLesson(l);
      navigate(`/training/${selectedTrack.slug}/${l.id}`);
    }
  };

  // Filter Tracks based on search query and persona
  const filteredTracks = TRAINING_TRACKS.filter(track => {
    const matchesPersona = selectedPersona === "all" || 
      track.targetPersonas.some(p => p.toLowerCase().includes(selectedPersona.toLowerCase())) ||
      track.targetPersonasNepali.some(p => p.includes(selectedPersona));

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesPersona;

    const matchesQuery = 
      track.title.toLowerCase().includes(q) ||
      track.titleNepali.includes(q) ||
      track.tagline.toLowerCase().includes(q) ||
      track.lessons.some(l => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));

    return matchesPersona && matchesQuery;
  });

  const totalLessonsCount = TRAINING_TRACKS.reduce((acc, t) => acc + t.lessons.length, 0);

  // If in lesson view mode
  if (selectedTrack && selectedLesson) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <LessonView
          track={selectedTrack}
          lesson={selectedLesson}
          onBackToTracks={handleBackToTracks}
          onSelectLesson={handleSelectLesson}
          isCompleted={completedLessons.includes(selectedLesson.id)}
          onToggleComplete={toggleLessonComplete}
          onOpenExam={(certId) => setActiveExamCertId(certId)}
        />

        {activeExamCertId && (
          <CertificationExamModal
            certification={CERTIFICATION_PATHS.find(c => c.id === activeExamCertId) || CERTIFICATION_PATHS[0]}
            onClose={() => setActiveExamCertId(null)}
            onCertificateEarned={handleCertificateEarned}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      
      {/* Interactive Header & Search */}
      <TrainingHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedPersona={selectedPersona}
        setSelectedPersona={setSelectedPersona}
        completedLessonsCount={completedLessons.length}
        totalLessonsCount={totalLessonsCount}
        earnedCertificatesCount={earnedCertificates.length}
        onOpenToursModal={() => setIsToursModalOpen(true)}
        onOpenPresentationMode={() => setIsPresentationModeOpen(true)}
        onOpenAIMentor={() => setIsAIMentorOpen(true)}
      />

      {/* Institutional Academy & Compliance Sub-Banner */}
      <div className="bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 py-2.5 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Active Academy: <strong className="text-stone-900 dark:text-white">{activeInstitution.name}</strong></span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold">
              {activeInstitution.badge}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link
              to="/organization/compliance"
              className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 hover:underline"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Org Compliance Matrix</span>
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center gap-1 font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:underline"
            >
              <span>Public Demo Sandbox</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        
        {/* TAB 0: COMPETENCY OS & SKILL GAP ROADMAP */}
        {activeTab === "competency" && (
          <CompetencyOSView
            progress={userProgressRecord || {
              userId: "current-learner",
              department: "Editorial & Newsroom",
              completedLessons,
              completedTracks: [],
              trainingMinutes: completedLessons.length * 15,
              simulatorScores: {},
              competencyLevel: "L1_Citizen",
              lastActiveAt: new Date().toISOString()
            }}
            certificates={userCertificates}
            onSelectTrack={(trackSlug) => {
              const trk = TRAINING_TRACKS.find(t => t.slug === trackSlug || t.id === trackSlug);
              if (trk) handleSelectTrack(trk);
            }}
            onOpenExam={(certId) => setActiveExamCertId(certId)}
          />
        )}

        {/* TAB 1: CURRICULUM TRACKS */}
        {activeTab === "tracks" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs text-muted-text font-bold">
              <span>Showing {filteredTracks.length} of {TRAINING_TRACKS.length} curriculum tracks</span>
              <span>Self-Paced Certification Modules</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTracks.map((track) => (
                <TrainingTrackCard
                  key={track.id}
                  track={track}
                  completedLessons={completedLessons}
                  onSelectTrack={handleSelectTrack}
                  onOpenExam={(certId) => setActiveExamCertId(certId)}
                />
              ))}
            </div>

            {filteredTracks.length === 0 && (
              <div className="text-center py-16 bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-8">
                <HelpCircle size={40} className="mx-auto text-muted-text mb-3" />
                <h3 className="text-lg font-black text-foreground dark:text-white">No matching training tracks</h3>
                <p className="text-xs text-muted-text mt-1">Try resetting the persona filter or search term.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ROLE-BASED LEARNING PATHS */}
        {activeTab === "paths" && (
          <RoleBasedLearningPaths
            completedLessonIds={completedLessons}
            onSelectTrackBySlug={(slug) => {
              const trk = TRAINING_TRACKS.find(t => t.slug === slug || t.id === slug);
              if (trk) handleSelectTrack(trk);
            }}
          />
        )}

        {/* TAB 3: VISUAL FEATURE EXPLAINERS */}
        {activeTab === "explainers" && (
          <VisualFeatureExplainers />
        )}

        {/* TAB 4: VIDEO MASTERCLASSES */}
        {activeTab === "videos" && (
          <VideoTrainingLibrary
            onOpenTour={(tourId) => {
              setSelectedTourId(tourId);
              setIsToursModalOpen(true);
            }}
          />
        )}

        {/* TAB 5: SGIS MASTER ACADEMY */}
        {activeTab === "sgis" && (
          <SGISMasterAcademy />
        )}

        {/* TAB 6: SANATAN SIMULATOR MODE */}
        {activeTab === "simulator" && (
          <SanatanSimulator />
        )}

        {/* TAB 7: CERTIFICATION FRAMEWORK & EXAMS */}
        {activeTab === "certifications" && (
          <CertificationFrameworkView
            earnedCertificates={earnedCertificates}
            onOpenExam={(certId) => setActiveExamCertId(certId)}
          />
        )}

        {/* TAB 8: SEARCHABLE HELP CENTER & SOPS */}
        {activeTab === "help" && (
          <SearchableHelpCenter />
        )}

        {/* TAB 9: TELEMETRY & ADOPTION ANALYTICS */}
        {activeTab === "analytics" && (
          <TrainingAnalyticsDashboard />
        )}

        {/* TAB 10: SYSTEM ARCHITECTURE DIAGRAMS */}
        {activeTab === "architecture" && (
          <div className="space-y-10">
            <div className="pb-4 border-b border-border-theme dark:border-zinc-800">
              <h2 className="text-xl sm:text-2xl font-black text-foreground dark:text-white">
                Interactive Architectural & Operational Visualizers
              </h2>
              <p className="text-xs sm:text-sm text-muted-text dark:text-zinc-400 mt-1">
                Explore the five structural cornerstones of SanatanMarga's sovereign technology stack.
              </p>
            </div>

            {/* Diagram 1: Civilizational Ecosystem */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-primary block">Visualizer 01</span>
              <EcosystemArchitectureDiagram />
            </div>

            {/* Diagram 2: AI Newsroom Pipeline */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 block">Visualizer 02</span>
              <AINewsroomPipelineDiagram />
            </div>

            {/* Diagram 3: SGIS Manuscript Pipeline */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 block">Visualizer 03</span>
              <SGISPipelineDiagram />
            </div>

            {/* Diagram 4: RBAC & Four-Eyes Approval */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400 block">Visualizer 04</span>
              <RBACApprovalChainDiagram />
            </div>

            {/* Diagram 5: SnapshotOS 3-Tier Fallback */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block">Visualizer 05</span>
              <SnapshotOSResilienceDiagram />
            </div>
          </div>
        )}

        {/* Persistent Offline Support Section (SnapshotOS) */}
        <div className="pt-8 border-t border-border-theme dark:border-zinc-800">
          <OfflineTrainingManager />
        </div>

      </main>

      {/* Interactive Product Tours Modal */}
      <ProductToursModal
        isOpen={isToursModalOpen}
        onClose={() => setIsToursModalOpen(false)}
        initialTourId={selectedTourId}
      />

      {/* Enterprise Presentation Fullscreen Mode */}
      <EnterprisePresentationMode
        isOpen={isPresentationModeOpen}
        onClose={() => setIsPresentationModeOpen(false)}
      />

      {/* Certification Exam Modal */}
      {activeExamCertId && (
        <CertificationExamModal
          certification={CERTIFICATION_PATHS.find(c => c.id === activeExamCertId) || CERTIFICATION_PATHS[0]}
          onClose={() => setActiveExamCertId(null)}
          onCertificateEarned={handleCertificateEarned}
        />
      )}

      {/* AI Training Mentor Modal */}
      <TrainingAIMentorModal
        isOpen={isAIMentorOpen}
        onClose={() => setIsAIMentorOpen(false)}
        onNavigateTrack={(trackSlug) => {
          const trk = TRAINING_TRACKS.find(t => t.slug === trackSlug || t.id === trackSlug);
          if (trk) handleSelectTrack(trk);
        }}
        currentTrackSlug={selectedTrack?.slug}
        currentLessonId={selectedLesson?.id}
      />

    </div>
  );
}
