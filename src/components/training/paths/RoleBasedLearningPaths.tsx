import React, { useState } from "react";
import { 
  Compass, 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  Lock, 
  Award, 
  BookOpen, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  Clock,
  ExternalLink
} from "lucide-react";

export interface PathLevel {
  levelNumber: number;
  title: string;
  titleNepali: string;
  durationMinutes: number;
  competencies: string[];
  competenciesNepali: string[];
  prerequisites: string;
  associatedTrackId: string;
  associatedLessonId?: string;
  examId?: string;
  operationalChecklist: string[];
}

export interface RoleLearningPath {
  id: string;
  roleName: string;
  roleNameNepali: string;
  roleDescription: string;
  badgeTitle: string;
  color: string;
  levels: PathLevel[];
}

export const ROLE_PATHS: RoleLearningPath[] = [
  {
    id: "path-reader",
    roleName: "Reader & Citizen Scholar",
    roleNameNepali: "पाठक तथा नागरिक अनुसन्धाता",
    roleDescription: "Progress from basic news consumption to enlightened community discourse and primary historical archive discovery.",
    badgeTitle: "Certified Sanatan Reader",
    color: "amber",
    levels: [
      {
        levelNumber: 1,
        title: "Platform Basics & Accessibility",
        titleNepali: "प्रणाली परिचय तथा देवनागरी वाचन",
        durationMinutes: 25,
        prerequisites: "None (Open to all)",
        associatedTrackId: "track-reader",
        competencies: [
          "Bilingual Devanagari/English typography scaling",
          "24/7 continuous TTS audio player navigation",
          "Bookmarking articles and offline reading mode"
        ],
        competenciesNepali: [
          "देवनागरी अक्षर आकार र उज्यालो समायोजन",
          "२४/७ अडियो प्लेयर मार्फत समाचार श्रवण",
          "अफलाइन पढ्नका लागि लेखहरू सुरक्षित गर्ने"
        ],
        operationalChecklist: [
          "Test dyslexia-friendly Devanagari font scaling",
          "Pin the 24/7 audio player to bottom dock while navigating",
          "Save an article for offline reading via SnapshotOS"
        ]
      },
      {
        levelNumber: 2,
        title: "Chautari Civil Community Participation",
        titleNepali: "चौतारी सामुदायिक शिष्ट संवाद",
        durationMinutes: 35,
        prerequisites: "Completion of Level 1",
        associatedTrackId: "track-reader",
        competencies: [
          "Civil discourse conduct according to Shastric Sambhashana guidelines",
          "Submitting fact-check tips and reporting dubious claims",
          "Managing verified citizen identity and privacy preferences"
        ],
        competenciesNepali: [
          "शास्त्रीय मर्यादा अनुसार सभ्य टिप्पणी र संवाद",
          "शंकास्पद समाचारको तथ्य जाँचका लागि सूचना पठाउने",
          "नागरिक परिचय र गोपनीयता सेटिङ व्यवस्थापन"
        ],
        operationalChecklist: [
          "Verify email/phone for comment authorization",
          "Submit a respectful comment on a civilizational analysis",
          "Utilize the citizen report flag on a mock spam message"
        ]
      },
      {
        levelNumber: 3,
        title: "Knowledge Discovery & Gyan Kosh Mastery",
        titleNepali: "ज्ञान कोष तथा अभिलेख खोजी प्रवीणता",
        durationMinutes: 45,
        prerequisites: "Completion of Level 2",
        associatedTrackId: "track-sgis",
        examId: "cert-reader",
        competencies: [
          "Navigating the Sanatan civilizational ontology and knowledge graphs",
          "Cross-referencing Bikram Sambat and Saka dates with historical inscriptions",
          "Consulting the Ask Sanatan grounded AI engine for scriptural inquiries"
        ],
        competenciesNepali: [
          "सभ्यतागत ज्ञान सञ्जाल र अभिलेखहरू खोजी गर्ने",
          "विक्रम संवत् र शक संवत् ऐतिहासिक मितिहरू तुलना गर्ने",
          "आस्क सनातन एआई मार्फत धर्मशास्त्रीय ज्ञान सोध्ने"
        ],
        operationalChecklist: [
          "Locate a 5th-century Licchavi inscription in the digital corpus",
          "Trace an ontological lineage between a deity, temple, and monarch",
          "Execute an inquiry on Ask Sanatan and verify the primary citations"
        ]
      }
    ]
  },
  {
    id: "path-editor",
    roleName: "Journalist & Editorial Desk",
    roleNameNepali: "पत्रकार तथा सम्पादकीय डेस्क",
    roleDescription: "Master field dispatch composition, algorithmic source grounding, the four-eyes review gate, and press governance.",
    badgeTitle: "Certified Editorial Guardian",
    color: "purple",
    levels: [
      {
        levelNumber: 1,
        title: "Editorial Standards & Neutrality",
        titleNepali: "सम्पादकीय मापदण्ड तथा निष्पक्षता",
        durationMinutes: 40,
        prerequisites: "Journalist onboarding verification",
        associatedTrackId: "track-newsroom",
        competencies: [
          "Adherence to 'No Source = No Story' fail-closed mandate",
          "Strict Devanagari grammatical orthography and vocabulary rules",
          "Attribution standards for primary interviews and photographic evidence"
        ],
        competenciesNepali: [
          "'स्रोत विना समाचार छैन' नियमको पूर्ण पालना",
          "शुद्ध नेपाली भाषा, व्याकरण र मानक हिज्जे नियम",
          "स्थलगत अन्तर्वार्ता र तस्विर स्रोत खुलाउने नियम"
        ],
        operationalChecklist: [
          "Review the complete SanatanMarga Editorial Code of Ethics",
          "Pass the Devanagari standard orthography assessment",
          "Draft a mock field dispatch with two verified primary citations"
        ]
      },
      {
        levelNumber: 2,
        title: "Verification Workflow & Grounding Engines",
        titleNepali: "तथ्य प्रमाणीकरण तथा ग्राउन्डिङ प्रणाली",
        durationMinutes: 50,
        prerequisites: "Completion of Level 1",
        associatedTrackId: "track-newsroom",
        competencies: [
          "Operating Google Search Grounding with entity-level query filters",
          "Enforcing the 72-hour freshness temporal gate",
          "Analyzing corroboration matrices and eliminating hallucinated claims"
        ],
        competenciesNepali: [
          "गुगल सर्च ग्राउन्डिङ मार्फत तथ्य संकलन र जाँच",
          "७२-घण्टे ताजापन सुरक्षा गेट सञ्चालन",
          "दोहोरो स्रोत प्रमाणीकरण र भ्रामक समाचारको पहिचान"
        ],
        operationalChecklist: [
          "Execute an entity verification run on breaking national news",
          "Demonstrate fail-closed rejection of a story older than 72 hours",
          "Confirm domain trust ranking for external citation URLs"
        ]
      },
      {
        levelNumber: 3,
        title: "Publishing Workflow & Multi-Channel Push",
        titleNepali: "प्रकाशन प्रक्रिया तथा बहु-प्रसारण प्रेषण",
        durationMinutes: 45,
        prerequisites: "Completion of Level 2",
        associatedTrackId: "track-newsroom",
        competencies: [
          "Formatting bilingual headlines and social teaser metadata",
          "Triggering real-time TTS audio generation for the persistent player",
          "Broadcasting to web, PWA push notifications, Telegram, and radio ticker"
        ],
        competenciesNepali: [
          "द्विभाषिक शीर्षक र सामाजिक सञ्जाल मेटाडाटा मिलाउने",
          "स्वचालित नेपाली अडियो (TTS) निर्माण गर्ने",
          "वेबसाइट, मोबाइल एप, टेलिग्राम र रेडियोमा एकैपटक समाचार पठाउने"
        ],
        operationalChecklist: [
          "Preview responsive layout on mobile viewport simulator",
          "Verify audio rendering before issuing publication trigger",
          "Tag appropriate civilizational categories and regional tags"
        ]
      },
      {
        levelNumber: 4,
        title: "Governance Review & Four-Eyes Dual Signoff",
        titleNepali: "सुशासन समीक्षा तथा चार-आँखे अन्तिम स्वीकृति",
        durationMinutes: 60,
        prerequisites: "Completion of Level 3",
        associatedTrackId: "track-governance",
        examId: "cert-governance",
        competencies: [
          "Executing dual cryptographic signature approvals (Editor A + Editor B)",
          "Managing published correction notices and retraction protocol",
          "Exporting auditable SHA-256 logs for Press Council and regulatory reviews"
        ],
        competenciesNepali: [
          "दुई सम्पादकको डिजिटल हस्ताक्षर (Four-Eyes Gate) द्वारा प्रमाणीकरण",
          "त्रुटि सच्याउने तथा खण्डन सूचना जारी गर्ने विधि",
          "प्रेस काउन्सिलका लागि प्रमाणित अडिट फाइल निकाल्ने"
        ],
        operationalChecklist: [
          "Simulate a four-eyes dual-signature approval in the queue",
          "Publish a mock timestamped correction notice preserving original context",
          "Export and inspect an SHA-256 audit ledger bundle"
        ]
      }
    ]
  },
  {
    id: "path-admin",
    roleName: "Mission Control & Systems Administrator",
    roleNameNepali: "प्रणाली प्रशासक तथा मिसन कन्ट्रोल",
    roleDescription: "Oversee multi-tenant federation, SnapshotOS 3-tier disaster resilience, RBAC privilege enforcement, and immutable audit ledgers.",
    badgeTitle: "Master Systems Architect",
    color: "blue",
    levels: [
      {
        levelNumber: 1,
        title: "Mission Control Topology & Navigation",
        titleNepali: "मिसन कन्ट्रोल संरचना तथा नेभिगेसन",
        durationMinutes: 30,
        prerequisites: "SuperAdmin / DevOps authorization",
        associatedTrackId: "track-admin",
        competencies: [
          "Mission Control dashboard telemetry and live service statuses",
          "Multi-tenant switching between regional diaspora instances",
          "Edge CDN caching status and server health metrics"
        ],
        competenciesNepali: [
          "प्रणाली स्वास्थ्य र प्रत्यक्ष सर्भर अवस्था अवलोकन",
          "नेपाल र अन्तर्राष्ट्रिय शाखाहरू बीच स्विच गर्ने विधि",
          "क्यास गति र सर्भर भार व्यवस्थापन"
        ],
        operationalChecklist: [
          "Inspect the live operational health status of all 10 core subsystems",
          "Switch between main Kathmandu portal and global diaspora shards",
          "Monitor live visitor traffic and active radio stream listeners"
        ]
      },
      {
        levelNumber: 2,
        title: "RBAC Privilege Enforcement (L1 to L5)",
        titleNepali: "शून्य-विश्वास अधिकार व्यवस्थापन (L1 देखि L5)",
        durationMinutes: 45,
        prerequisites: "Completion of Level 1",
        associatedTrackId: "track-governance",
        competencies: [
          "Least-privilege role assignment and multi-factor authentication enforcement",
          "Suspending compromised accounts and revoking session tokens",
          "Inviting accredited scholars and managing institutional permissions"
        ],
        competenciesNepali: [
          "५ तहको अधिकार बाँडफाँड र सेक्युरिटी टोकन अनिवार्य गर्ने",
          "शंकास्पद खाता तत्काल रोक्का गर्ने र सेसन रद्द गर्ने",
          "विद्वान तथा अनुसन्धाताहरूलाई विशेष अधिकार दिने विधि"
        ],
        operationalChecklist: [
          "Assign an L3 Editor role with hardware token authentication",
          "Execute an immediate session kill on a mock rogue token",
          "Verify RBAC permission boundary preventing unilateral publishing"
        ]
      },
      {
        levelNumber: 3,
        title: "Institutional Governance & Policy Gates",
        titleNepali: "संस्थागत सुशासन तथा नीति नियम",
        durationMinutes: 45,
        prerequisites: "Completion of Level 2",
        associatedTrackId: "track-governance",
        competencies: [
          "Configuring four-eyes approval thresholds for high-impact stories",
          "Managing ethical cultural advertiser blacklists and compliance rules",
          "Managing GDPR/Nepal Privacy Act data redaction requests"
        ],
        competenciesNepali: [
          "संवेदनशील समाचारका लागि चार-आँखे स्वीकृति अनिवार्य गर्ने",
          "जुवा, मदिरा जस्ता हानिकारक विज्ञापन पूर्ण रूपमा रोक्ने नियम",
          "व्यक्तिगत गोपनीयता ऐन अनुसार डाटा हटाउने प्रक्रिया"
        ],
        operationalChecklist: [
          "Adjust four-eyes threshold requirements for political breaking news",
          "Review ethical advertiser compliance flags in the ad registry",
          "Simulate a formal citizen data export and redaction request"
        ]
      },
      {
        levelNumber: 4,
        title: "Infrastructure & SnapshotOS 3-Tier Resilience",
        titleNepali: "पूर्वाधार तथा स्न्यापसट ३-तह ब्याकअप",
        durationMinutes: 60,
        prerequisites: "Completion of Level 3",
        associatedTrackId: "track-admin",
        competencies: [
          "Managing 3-tier fallback synchronization (Firestore → IndexedDB → CDN)",
          "Triggering manual cache invalidations across distributed Edge locations",
          "Monitoring the 24/7 radio audio buffer health and silent failover switch"
        ],
        competenciesNepali: [
          "सर्भर डाउन हुँदा पनि चल्ने ३-तहको स्न्यापसट ब्याकअप सञ्चालन",
          "विश्वभरिका क्यास सर्भर तुरुन्त सफा गर्ने विधि",
          "रेडियो स्ट्रिमको ब्याकअप स्विच परीक्षण गर्ने"
        ],
        operationalChecklist: [
          "Trigger an on-demand global snapshot build and verify JSON checksum",
          "Simulate a Firestore offline event and verify seamless IndexedDB fallback",
          "Purge Edge CDN cache for the primary breaking news feed"
        ]
      },
      {
        levelNumber: 5,
        title: "Cryptographic Audit & Disaster Failover",
        titleNepali: "सुरक्षित अडिट तथा विपद् पुनःस्थापना",
        durationMinutes: 75,
        prerequisites: "Completion of Level 4",
        associatedTrackId: "track-admin",
        examId: "cert-admin",
        competencies: [
          "Exporting cryptographic SHA-256 audit ledgers with tamper evidence",
          "Executing complete cold-start platform restore from decentralized snapshots",
          "Conducting simulated external penetration tests and security drills"
        ],
        competenciesNepali: [
          "ह्यास कोड सहितको स्थायी अडिट फाइल प्रमाणित गर्ने",
          "सम्पूर्ण प्रणाली नष्ट भए पनि ब्याकअपबाट १० मिनेटमा ब्युँझाउने",
          "सुरक्षा कमजोरी र साइबर आक्रमण विरुद्ध पूर्वतयारी अभ्यास"
        ],
        operationalChecklist: [
          "Verify the SHA-256 Merkle root of the editorial audit ledger",
          "Perform a disaster recovery dry run restoring state in under 8 minutes",
          "Generate the comprehensive quarterly compliance & resilience certificate"
        ]
      }
    ]
  }
];

interface RoleBasedLearningPathsProps {
  onSelectTrack?: (trackId: string) => void;
  onSelectTrackBySlug?: (slug: string) => void;
  onOpenExam?: (examId: string) => void;
  completedLessonIds?: string[];
}

export default function RoleBasedLearningPaths({
  onSelectTrack,
  onSelectTrackBySlug,
  onOpenExam,
  completedLessonIds = []
}: RoleBasedLearningPathsProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("path-reader");
  const [completedLevels, setCompletedLevels] = useState<Record<string, number[]>>(() => {
    try {
      const saved = localStorage.getItem("sm_role_path_levels");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const currentRole = ROLE_PATHS.find(r => r.id === selectedRoleId) || ROLE_PATHS[0];
  const roleDoneLevels = completedLevels[currentRole.id] || [];

  const handleToggleLevel = (roleId: string, levelNum: number) => {
    setCompletedLevels(prev => {
      const existing = prev[roleId] || [];
      const updated = existing.includes(levelNum)
        ? existing.filter(n => n !== levelNum)
        : [...existing, levelNum];
      const next = { ...prev, [roleId]: updated };
      try {
        localStorage.setItem("sm_role_path_levels", JSON.stringify(next));
      } catch (e) {
        console.warn("Could not save path levels", e);
      }
      return next;
    });
  };

  const totalLevels = currentRole.levels.length;
  const progressPercent = Math.round((roleDoneLevels.length / totalLevels) * 100);

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-theme dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
            <Compass size={14} />
            <span>Structured Role Progression Tracks</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground dark:text-white">
            भूमिका-आधारित सिकाइ मार्ग (Role Learning Paths)
          </h2>
          <p className="text-xs sm:text-sm text-muted-text dark:text-zinc-400 mt-1 max-w-3xl">
            Step through rigorous progressive curricula designed specifically for your organizational responsibility. 
            Unlock higher security tiers, complete operational checklists, and earn official credentials.
          </p>
        </div>
      </div>

      {/* Role Switcher Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROLE_PATHS.map((role) => {
          const isSelected = selectedRoleId === role.id;
          const completedCount = (completedLevels[role.id] || []).length;
          const pct = Math.round((completedCount / role.levels.length) * 100);

          return (
            <div
              key={role.id}
              onClick={() => setSelectedRoleId(role.id)}
              className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-card dark:bg-slate-900/90 border-primary ring-2 ring-primary/20 shadow-xl"
                  : "bg-card dark:bg-slate-950/60 border-border-theme dark:border-zinc-800 hover:border-primary/50"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-primary">
                    {role.levels.length} Progression Levels
                  </span>
                  <span className="text-xs font-mono font-bold text-muted-text">
                    {pct}% Complete
                  </span>
                </div>

                <h3 className="text-lg font-black text-foreground dark:text-white">
                  {role.roleName}
                </h3>
                <p className="text-xs font-bold text-primary">
                  {role.roleNameNepali}
                </p>
                <p className="text-xs text-muted-text leading-relaxed">
                  {role.roleDescription}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-border-theme/60 dark:border-zinc-800/80">
                <div className="w-full h-2 rounded-full bg-muted-area dark:bg-zinc-900 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Role Path Progression Timeline */}
      <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
        
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-theme dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                Active Learning Track
              </span>
              <span className="text-xs text-muted-text font-mono">
                • {roleDoneLevels.length} of {totalLevels} Levels Mastered
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground dark:text-white">
              {currentRole.roleName} Journey
            </h3>
            <p className="text-xs text-muted-text mt-0.5">
              Achieve Level {totalLevels} to qualify for the <strong className="text-foreground dark:text-white">{currentRole.badgeTitle}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-primary font-mono">
              {progressPercent}%
            </span>
            <div className="w-28 h-3 rounded-full bg-muted-area dark:bg-zinc-900 overflow-hidden border border-border-theme dark:border-zinc-800">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Levels Timeline Stack */}
        <div className="space-y-6">
          {currentRole.levels.map((level, idx) => {
            const isDone = roleDoneLevels.includes(level.levelNumber);
            const isPriorDone = idx === 0 || roleDoneLevels.includes(currentRole.levels[idx - 1].levelNumber);

            return (
              <div
                key={level.levelNumber}
                className={`p-6 sm:p-7 rounded-3xl border transition-all ${
                  isDone
                    ? "bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30"
                    : isPriorDone
                    ? "bg-muted-area/30 dark:bg-zinc-900/40 border-border-theme dark:border-zinc-800"
                    : "opacity-60 bg-muted-area/10 dark:bg-zinc-900/10 border-dashed border-border-theme dark:border-zinc-800"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  
                  {/* Left Column: Number badge and Level Info */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shadow-sm ${
                        isDone
                          ? "bg-emerald-500 text-white"
                          : isPriorDone
                          ? "bg-primary text-white"
                          : "bg-muted-area text-muted-text"
                      }`}>
                        L{level.levelNumber}
                      </span>

                      <span className="text-xs font-mono font-bold text-muted-text flex items-center gap-1 bg-muted-area dark:bg-zinc-900 px-2.5 py-0.5 rounded-lg border border-border-theme dark:border-zinc-800">
                        <Clock size={12} />
                        {level.durationMinutes} mins
                      </span>

                      <span className="text-xs font-mono text-muted-text">
                        Prerequisites: {level.prerequisites}
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-foreground dark:text-white">
                      Level {level.levelNumber}: {level.title}
                    </h4>
                    <p className="text-xs font-bold text-primary">
                      {level.titleNepali}
                    </p>

                    {/* Competencies */}
                    <div className="pt-2 space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-muted-text block">
                        Core Competencies Acquired:
                      </span>
                      <ul className="space-y-1.5">
                        {level.competencies.map((comp, cIdx) => (
                          <li key={cIdx} className="text-xs text-foreground dark:text-zinc-200 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                            <span>{comp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Right Column: Operational Checklist & Action */}
                  <div className="lg:w-80 space-y-4 pt-4 lg:pt-0 lg:border-l lg:border-border-theme/60 dark:lg:border-zinc-800/80 lg:pl-6">
                    <span className="text-[11px] font-black uppercase tracking-wider text-muted-text block">
                      Practical Operational Checklist:
                    </span>

                    <div className="space-y-2">
                      {level.operationalChecklist.map((task, tIdx) => (
                        <div key={tIdx} className="p-2.5 rounded-xl bg-card dark:bg-zinc-950 border border-border-theme dark:border-zinc-800 text-xs text-muted-text dark:text-zinc-300 leading-snug flex items-start gap-2">
                          <CheckCircle2 size={13} className="text-primary shrink-0 mt-0.5" />
                          <span>{task}</span>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Action buttons */}
                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        onClick={() => handleToggleLevel(currentRole.id, level.levelNumber)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isDone
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                            : "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20"
                        }`}
                      >
                        <CheckCircle2 size={15} />
                        <span>{isDone ? "Level Completed (Marked)" : "Mark Level Complete"}</span>
                      </button>

                      {level.examId && onOpenExam && (
                        <button
                          onClick={() => onOpenExam(level.examId!)}
                          className="w-full py-2 px-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-amber-500/20 cursor-pointer"
                        >
                          <Award size={14} />
                          <span>Take Milestone Exam</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
