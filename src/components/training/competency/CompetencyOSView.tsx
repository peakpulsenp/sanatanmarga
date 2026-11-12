import React, { useState } from "react";
import { 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  BookOpen, 
  Radio, 
  Play, 
  FileCheck,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { 
  CompetencyDomain, 
  DomainScore, 
  TrainingRecommendation, 
  calculateCompetencyMatrix, 
  generateTrainingRecommendations 
} from "../../../services/competencyEngine";
import { UserTrainingProgress, UserCertificationRecord } from "../../../services/trainingPersistenceService";
import { getActiveInstitution, InstitutionalPartner } from "../../../services/institutionalTrainingService";
import TrainingRealityAuditModal from "../audit/TrainingRealityAuditModal";

interface CompetencyOSViewProps {
  progress: UserTrainingProgress;
  certificates: UserCertificationRecord[];
  onSelectTrack: (trackSlug: string) => void;
  onOpenExam?: (certId: string) => void;
}

const DOMAIN_ICONS: Record<CompetencyDomain, React.ElementType> = {
  journalism: FileCheck,
  sgis: Layers,
  governance: ShieldCheck,
  academy: BookOpen,
  mediaos: Radio,
  infrastructure: Cpu
};

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Beginner: { bg: "bg-stone-100 dark:bg-stone-800", text: "text-stone-700 dark:text-stone-300", border: "border-stone-300 dark:border-stone-700" },
  Practitioner: { bg: "bg-emerald-50 dark:bg-emerald-950/50", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-800" },
  Advanced: { bg: "bg-blue-50 dark:bg-blue-950/50", text: "text-blue-700 dark:text-blue-300", border: "border-blue-300 dark:border-blue-800" },
  Expert: { bg: "bg-purple-50 dark:bg-purple-950/50", text: "text-purple-700 dark:text-purple-300", border: "border-purple-300 dark:border-purple-800" },
  Master: { bg: "bg-amber-50 dark:bg-amber-950/50", text: "text-amber-700 dark:text-amber-300", border: "border-amber-300 dark:border-amber-800" }
};

export default function CompetencyOSView({
  progress,
  certificates,
  onSelectTrack,
  onOpenExam
}: CompetencyOSViewProps) {
  const [showAuditModal, setShowAuditModal] = useState(false);
  const institution: InstitutionalPartner = getActiveInstitution();
  const matrix = calculateCompetencyMatrix(progress, certificates);
  const recommendations = generateTrainingRecommendations(matrix, progress.completedLessons);

  // Calculate overall competency average
  const domainList = Object.values(matrix);
  const averageScore = Math.round(
    domainList.reduce((sum, d) => sum + d.score, 0) / domainList.length
  );

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-500/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                SanatanMarga Competency OS
              </span>
              <span className="text-xs text-stone-300">
                Institutional Partner: <strong className="text-amber-300">{institution.name}</strong>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
              Personalized Competency Radar & Skill Gaps
            </h2>

            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              Every completed lesson, verified quiz, hands-on simulator drill, and active certification feeds your verified operational score. Strict philosophy: <strong>No Measurement = No Metric</strong>.
            </p>
          </div>

          {/* Aggregate Score Pill & Audit Action */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[170px]">
              <div className="text-[11px] font-medium text-stone-300">Verified Platform Index</div>
              <div className="text-3xl font-serif font-bold text-amber-300 mt-0.5">
                {averageScore}%
              </div>
              <div className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Auditable Competency
              </div>
            </div>

            <button
              onClick={() => setShowAuditModal(true)}
              className="w-full px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Run Reality Audit (v1.0)
            </button>
          </div>
        </div>

        {/* Quick Link to Institutional Compliance Matrix */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-stone-300">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Institutional Target: {institution.requiredCompliancePercent}% Staff Certified</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAuditModal(true)}
              className="text-amber-300 hover:text-amber-200 font-mono text-xs flex items-center gap-1 underline underline-offset-2"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Inspect TRAIN-P0-01 → TRAIN-E2E-03 Suite
            </button>
            <Link
              to="/organization/compliance"
              className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-semibold hover:underline"
            >
              <span>View Organization Compliance</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Production Reality Audit Modal */}
      <TrainingRealityAuditModal 
        isOpen={showAuditModal} 
        onClose={() => setShowAuditModal(false)} 
      />

      {/* Domain Competency Cards Grid (6 Domains) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Domain Competency Matrix (6 Specializations)</span>
          </h3>
          <span className="text-xs text-stone-500 font-mono">
            5 Levels: Beginner → Practitioner → Advanced → Expert → Master
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {domainList.map((domain) => {
            const Icon = DOMAIN_ICONS[domain.domain];
            const tierStyle = TIER_COLORS[domain.tier] || TIER_COLORS.Beginner;

            return (
              <div 
                key={domain.domain}
                className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4 hover:border-amber-400/60 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-stone-900 dark:text-white">
                          {domain.label}
                        </h4>
                        <div className="text-[11px] text-stone-400 font-serif">
                          {domain.labelNepali}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}>
                      {domain.tier}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-stone-500">Competency Score</span>
                      <span className="font-bold text-stone-900 dark:text-white">{domain.score}%</span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-amber-600 h-2 rounded-full transition-all duration-700"
                        style={{ width: `${domain.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Telemetry metadata */}
                  <div className="text-[11px] text-stone-500 space-y-1 border-t border-stone-100 dark:border-stone-800/80 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span>Lessons Completed:</span>
                      <span className="font-mono font-semibold text-stone-800 dark:text-stone-200">
                        {domain.lessonsCompleted} / {domain.totalTrackLessons}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Credential Status:</span>
                      <span className={domain.hasActiveCertification ? "text-emerald-600 font-bold" : "text-stone-400"}>
                        {domain.hasActiveCertification ? "✓ Active Certified" : "Uncertified"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Milestone Next Step */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 space-y-2">
                  <div className="text-[11px] text-stone-500 italic line-clamp-1">
                    🎯 Next: {domain.nextMilestone}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendation Engine (Personalized Learning Roadmap) */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Skill Gap Optimization</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-white mt-0.5">
              Recommended Next Steps
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Curated by the Competency Engine based on your lowest domain scores and upcoming institutional audits.
            </p>
          </div>

          <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            {recommendations.length} High-Impact Recommendations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => (
            <div 
              key={rec.id}
              className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800 space-y-3 flex flex-col justify-between hover:border-amber-400/50 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    rec.priority === "high" 
                      ? "bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                      : "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  }`}>
                    {rec.priority.toUpperCase()} PRIORITY
                  </span>
                  <span className="text-xs text-stone-400 font-mono">
                    ~{rec.estimatedMinutes} mins
                  </span>
                </div>

                <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                  {rec.title}
                </h4>

                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {rec.reason}
                </p>
              </div>

              <div className="pt-2">
                {rec.type === "certification" && rec.certId && onOpenExam ? (
                  <button
                    onClick={() => onOpenExam(rec.certId!)}
                    className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Launch Certification Assessment</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onSelectTrack(rec.trackSlug)}
                    className="w-full py-2 px-3 rounded-xl bg-stone-900 hover:bg-black dark:bg-stone-800 dark:hover:bg-stone-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <span>Start Recommended Track</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
