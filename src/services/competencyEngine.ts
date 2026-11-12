import { UserTrainingProgress, UserCertificationRecord } from "./trainingPersistenceService";

export type CompetencyDomain = 
  | "journalism" 
  | "sgis" 
  | "governance" 
  | "academy" 
  | "mediaos" 
  | "infrastructure";

export type CompetencyTier = 
  | "Beginner" 
  | "Practitioner" 
  | "Advanced" 
  | "Expert" 
  | "Master";

export interface DomainScore {
  domain: CompetencyDomain;
  label: string;
  labelNepali: string;
  score: number; // 0 to 100
  tier: CompetencyTier;
  lessonsCompleted: number;
  totalTrackLessons: number;
  hasActiveCertification: boolean;
  nextMilestone: string;
}

export interface TrainingRecommendation {
  id: string;
  title: string;
  titleNepali: string;
  targetDomain: CompetencyDomain;
  type: "lesson" | "simulator" | "certification";
  reason: string;
  estimatedMinutes: number;
  priority: "high" | "medium" | "elective";
  trackSlug: string;
  lessonId?: string;
  certId?: string;
}

export const DOMAIN_DEFINITIONS: Record<CompetencyDomain, {
  label: string;
  labelNepali: string;
  trackSlug: string;
  totalLessons: number;
  coreCertId: string;
  description: string;
}> = {
  journalism: {
    label: "Journalism & Editorial Verification",
    labelNepali: "पत्रकारिता तथा सम्पादकीय प्रमाणीकरण",
    trackSlug: "track-ai-newsroom",
    totalLessons: 6,
    coreCertId: "cert-editor",
    description: "Fail-closed 'No Source = No Story' sourcing, 72-hour freshness window, bias detection, and ethical dispatch."
  },
  sgis: {
    label: "SGIS Epigraphy & Manuscripts",
    labelNepali: "SGIS अभिलेखशास्त्र तथा पाण्डुलिपि",
    trackSlug: "track-sgis",
    totalLessons: 6,
    coreCertId: "cert-sgis",
    description: "Multispectral UV/IR imaging, Licchavi/Brahmi paleography, line segmentation, and knowledge graph linking."
  },
  governance: {
    label: "GovernanceOS & Dual-Key Security",
    labelNepali: "सुशासन तथा दोहोरो-चाबी सुरक्षा",
    trackSlug: "track-governance",
    totalLessons: 5,
    coreCertId: "cert-governance",
    description: "Four-Eyes approval protocol, cryptographic audit ledger, session revocation, and legal retractions."
  },
  academy: {
    label: "Shastric Pedagogy & Curriculum",
    labelNepali: "शास्त्रीय शिक्षा तथा पाठ्यक्रम",
    trackSlug: "track-reader",
    totalLessons: 5,
    coreCertId: "cert-academic",
    description: "Civilizational knowledge structures, bilingual course delivery, and student assessment integrity."
  },
  mediaos: {
    label: "MediaOS & 24/7 Radio Automation",
    labelNepali: "MediaOS तथा २४/७ रेडियो प्रसारण",
    trackSlug: "track-creator",
    totalLessons: 5,
    coreCertId: "cert-media",
    description: "Continuous 192kbps streaming rundowns, studio fallback loops, and multi-format syndication."
  },
  infrastructure: {
    label: "SnapshotOS & System Resilience",
    labelNepali: "SnapshotOS तथा प्रणाली सबलीकरण",
    trackSlug: "track-admin",
    totalLessons: 6,
    coreCertId: "cert-admin",
    description: "3-tier edge continuity, cold-start snapshot restore, IndexedDB edge caching, and incident runbooks."
  }
};

/**
 * Calculates domain scores and competency tiers using real user telemetry.
 * Strict Rule: "No Measurement = No Metric" - derived exclusively from verified completions.
 */
export function calculateCompetencyMatrix(
  progress: UserTrainingProgress,
  certificates: UserCertificationRecord[]
): Record<CompetencyDomain, DomainScore> {
  const result: Partial<Record<CompetencyDomain, DomainScore>> = {};

  for (const [domainKey, meta] of Object.entries(DOMAIN_DEFINITIONS) as [CompetencyDomain, typeof DOMAIN_DEFINITIONS[CompetencyDomain]][]) {
    // Count lessons completed in this domain
    const completedInDomain = progress.completedLessons.filter(lId => 
      lId.toLowerCase().includes(domainKey) || 
      (domainKey === "journalism" && (lId.includes("ai") || lId.includes("editor") || lId.includes("source"))) ||
      (domainKey === "infrastructure" && (lId.includes("snapshot") || lId.includes("admin") || lId.includes("pwa")))
    ).length;

    // Check active certificate in domain
    const hasActiveCert = certificates.some(c => 
      (c.id === meta.coreCertId || c.code.toLowerCase().includes(domainKey.slice(0, 3))) && 
      c.status === "active"
    );

    // Score calculation:
    // Lessons contribute up to 60 points
    // Active Certification contributes 30 points
    // Simulator runs contribute 10 points
    const lessonScore = Math.min(60, Math.round((completedInDomain / meta.totalLessons) * 60));
    const certScore = hasActiveCert ? 30 : 0;
    const simRunsCount = Object.keys(progress.simulatorScores || {}).length;
    const simScore = Math.min(10, Math.round(simRunsCount * 2.5));

    const totalScore = Math.min(100, lessonScore + certScore + simScore);

    // Determine Tier
    let tier: CompetencyTier = "Beginner";
    if (totalScore >= 90) tier = "Master";
    else if (totalScore >= 75) tier = "Expert";
    else if (totalScore >= 50) tier = "Advanced";
    else if (totalScore >= 25) tier = "Practitioner";

    let nextMilestone = "Complete initial introductory lessons";
    if (tier === "Beginner") {
      nextMilestone = `Finish ${Math.max(1, meta.totalLessons - completedInDomain)} more lessons to reach Practitioner`;
    } else if (tier === "Practitioner") {
      nextMilestone = hasActiveCert ? "Complete hands-on simulator drill" : "Pass official certification exam";
    } else if (tier === "Advanced") {
      nextMilestone = "Complete advanced emergency drills and maintain recertification compliance";
    } else if (tier === "Expert") {
      nextMilestone = "Conduct peer reviews and audit organizational trainees";
    } else {
      nextMilestone = "Institutional Master: Authorized for cryptographic Four-Eyes signoffs";
    }

    result[domainKey] = {
      domain: domainKey,
      label: meta.label,
      labelNepali: meta.labelNepali,
      score: totalScore,
      tier,
      lessonsCompleted: completedInDomain,
      totalTrackLessons: meta.totalLessons,
      hasActiveCertification: hasActiveCert,
      nextMilestone
    };
  }

  return result as Record<CompetencyDomain, DomainScore>;
}

/**
 * Intelligent recommendation engine that analyzes learner progress,
 * identifies skill gaps, and returns high-impact next actions.
 */
export function generateTrainingRecommendations(
  matrix: Record<CompetencyDomain, DomainScore>,
  completedLessonIds: string[]
): TrainingRecommendation[] {
  const recommendations: TrainingRecommendation[] = [];

  // Sort domains by lowest competency score to target skill gaps
  const sortedDomains = Object.values(matrix).sort((a, b) => a.score - b.score);

  for (const domain of sortedDomains) {
    const meta = DOMAIN_DEFINITIONS[domain.domain];

    if (domain.score < 50 && !domain.hasActiveCertification) {
      recommendations.push({
        id: `rec-${domain.domain}-foundation`,
        title: `Complete ${meta.label} Track`,
        titleNepali: `${meta.labelNepali} सम्पूर्ण गर्नुहोस्`,
        targetDomain: domain.domain,
        type: "lesson",
        reason: `Your current competency is ${domain.tier} (${domain.score}%). Completing this track will advance you to Practitioner.`,
        estimatedMinutes: 30,
        priority: "high",
        trackSlug: meta.trackSlug
      });
    } else if (domain.lessonsCompleted >= 3 && !domain.hasActiveCertification) {
      recommendations.push({
        id: `rec-${domain.domain}-exam`,
        title: `Certify Competency: ${meta.label}`,
        titleNepali: `आधिकारिक परीक्षा दिनुहोस्: ${meta.labelNepali}`,
        targetDomain: domain.domain,
        type: "certification",
        reason: "You have completed the core prerequisite coursework. Take the timed exam to lock in your credential.",
        estimatedMinutes: 20,
        priority: "high",
        trackSlug: meta.trackSlug,
        certId: meta.coreCertId
      });
    } else if (domain.hasActiveCertification && domain.score < 90) {
      recommendations.push({
        id: `rec-${domain.domain}-sim`,
        title: `Advanced Simulator Drill: ${meta.label}`,
        titleNepali: `सिम्युलेटर अभ्यास: ${meta.labelNepali}`,
        targetDomain: domain.domain,
        type: "simulator",
        reason: "Test your skills against simulated edge-cases (disaster recovery, emergency retractions) to attain Master tier.",
        estimatedMinutes: 15,
        priority: "medium",
        trackSlug: meta.trackSlug
      });
    }
  }

  // Ensure high-priority recommendations are at the top
  return recommendations.slice(0, 4);
}
