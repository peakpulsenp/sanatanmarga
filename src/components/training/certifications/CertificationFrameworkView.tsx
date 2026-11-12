import React, { useState } from "react";
import { 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  ChevronRight, 
  ExternalLink, 
  Download, 
  Clock, 
  Star,
  FileCheck
} from "lucide-react";
import { CERTIFICATION_PATHS, CertificationPath } from "../TrainingData";

export type CertTier = "bronze" | "silver" | "gold" | "expert" | "master";

interface TierInfo {
  tier: CertTier;
  label: string;
  labelNepali: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  minScore: number;
  rbacPrivilege: string;
  description: string;
}

export const CERT_TIERS: TierInfo[] = [
  {
    tier: "bronze",
    label: "Bronze Associate",
    labelNepali: "कांस्य सहयोगी (Bronze)",
    color: "text-amber-700 dark:text-amber-500",
    badgeBg: "bg-amber-700/10",
    badgeBorder: "border-amber-700/30",
    minScore: 70,
    rbacPrivilege: "Level 1: Read, Citizen Reporting, Forum Participant",
    description: "Foundational literacy in platform navigation, ethical guidelines, and basic reader tools."
  },
  {
    tier: "silver",
    label: "Silver Practitioner",
    labelNepali: "रजत अभ्यासी (Silver)",
    color: "text-slate-600 dark:text-slate-300",
    badgeBg: "bg-slate-500/10",
    badgeBorder: "border-slate-500/30",
    minScore: 80,
    rbacPrivilege: "Level 2: Contributing Journalist, Store Merchant, Course Instructor",
    description: "Demonstrated competence in drafting verified news, adhering to the 72-hour freshness window, and dispatching artifacts."
  },
  {
    tier: "gold",
    label: "Gold Professional",
    labelNepali: "स्वर्ण विशेषज्ञ (Gold)",
    color: "text-yellow-600 dark:text-yellow-400",
    badgeBg: "bg-yellow-500/10",
    badgeBorder: "border-yellow-500/30",
    minScore: 85,
    rbacPrivilege: "Level 3: Editorial Desk Reviewer, Epigraphic Transcriber, Revenue Manager",
    description: "High-level editorial authority: First-signature verification, Licchavi stone rubbing transliteration, and ethical ad vetting."
  },
  {
    tier: "expert",
    label: "Expert Guardian",
    labelNepali: "विज्ञ संरक्षक (Expert)",
    color: "text-purple-600 dark:text-purple-400",
    badgeBg: "bg-purple-500/10",
    badgeBorder: "border-purple-500/30",
    minScore: 90,
    rbacPrivilege: "Level 4: Lead Editor, Four-Eyes Publisher, Shastric Curriculum Dean",
    description: "Second-signature publishing gatekeeper, grievance resolution, and university course accreditation."
  },
  {
    tier: "master",
    label: "Master Architect",
    labelNepali: "महा-संरक्षक (Master Architect)",
    color: "text-rose-600 dark:text-rose-400",
    badgeBg: "bg-rose-500/10",
    badgeBorder: "border-rose-500/30",
    minScore: 95,
    rbacPrivilege: "Level 5: Cryptographic Keyholder, SnapshotOS Disaster Recovery Commander",
    description: "Sovereignty gatekeeper: Emergency broadcast failover, cold-start snapshot restore, and immutable ledger governance."
  }
];

export const SPECIALIZATIONS = [
  { id: "all", label: "All Specializations" },
  { id: "journalism", label: "Journalism & Reporting" },
  { id: "ai_newsroom", label: "AI Newsroom OS" },
  { id: "sgis", label: "SGIS Epigraphy" },
  { id: "media_os", label: "MediaOS & Radio" },
  { id: "governance", label: "GovernanceOS & Audit" },
  { id: "academy", label: "Shastric Academy" },
  { id: "commerce", label: "Commerce & Artifacts" },
  { id: "administration", label: "System Administration" }
];

interface CertificationFrameworkViewProps {
  earnedCertificates: string[];
  onOpenExam: (certId: string) => void;
}

export default function CertificationFrameworkView({
  earnedCertificates,
  onOpenExam
}: CertificationFrameworkViewProps) {
  const [selectedTier, setSelectedTier] = useState<CertTier>("all" as any);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("all");

  const filteredCerts = CERTIFICATION_PATHS.filter(cert => {
    if (selectedSpecialization !== "all") {
      const spec = selectedSpecialization.toLowerCase();
      const matches = cert.title.toLowerCase().includes(spec) || 
                      cert.role.toLowerCase().includes(spec) ||
                      cert.code.toLowerCase().includes(spec);
      if (!matches) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-theme dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
            <Award size={14} />
            <span>Cryptographic Accreditation Standard</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground dark:text-white">
            प्रमाणीकरण संरचना (Certification Framework)
          </h2>
          <p className="text-xs sm:text-sm text-muted-text dark:text-zinc-400 mt-1 max-w-3xl">
            A 5-tier professional qualification hierarchy (Bronze, Silver, Gold, Expert, Master) across 8 platform specializations. 
            All certificates feature SHA-256 HMAC digital signatures and public /verify QR codes.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3.5 py-1.5 rounded-full">
          <ShieldCheck size={14} />
          <span>{earnedCertificates.length} Certificates Earned</span>
        </div>
      </div>

      {/* 5 TIER PROGRESSION RIBBON */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {CERT_TIERS.map((tier) => (
          <div
            key={tier.tier}
            className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2 ${tier.badgeBg} ${tier.badgeBorder}`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`text-[10px] font-mono font-black uppercase ${tier.color}`}>
                  Tier {tier.tier.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono font-bold text-muted-text">
                  Min {tier.minScore}%
                </span>
              </div>
              <h4 className={`text-xs sm:text-sm font-black ${tier.color}`}>
                {tier.label}
              </h4>
              <p className="text-[10px] text-muted-text line-clamp-1 mt-0.5">
                {tier.labelNepali}
              </p>
            </div>

            <div className="pt-2 border-t border-border-theme/40 text-[10px] text-muted-text">
              <span className="font-bold text-foreground dark:text-zinc-300 block">RBAC Privilege:</span>
              <span className="line-clamp-2">{tier.rbacPrivilege}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Specialization Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SPECIALIZATIONS.map((spec) => (
          <button
            key={spec.id}
            onClick={() => setSelectedSpecialization(spec.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedSpecialization === spec.id
                ? "bg-primary text-white shadow-sm"
                : "bg-muted-area dark:bg-zinc-900 text-muted-text hover:text-foreground"
            }`}
          >
            {spec.label}
          </button>
        ))}
      </div>

      {/* Certification Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCerts.map((cert) => {
          const isEarned = earnedCertificates.includes(cert.id);

          return (
            <div
              key={cert.id}
              className={`p-6 sm:p-7 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                isEarned
                  ? "bg-amber-500/5 border-amber-500/30 ring-1 ring-amber-500/20 shadow-md"
                  : "bg-card dark:bg-slate-950 border-border-theme dark:border-zinc-800 hover:border-primary/40 shadow-sm"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {cert.code}
                    </span>
                    <span className="text-xs font-bold text-muted-text">
                      Role: {cert.role}
                    </span>
                  </div>

                  {isEarned && (
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Certified
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-xs font-bold text-primary block">
                    {cert.titleNepali}
                  </span>
                  <h3 className="text-lg font-black text-foreground dark:text-white">
                    {cert.title}
                  </h3>
                  <p className="text-xs text-muted-text dark:text-zinc-400 leading-relaxed mt-1">
                    {cert.description}
                  </p>
                </div>

                {/* Prerequisites list */}
                <div className="py-2.5 border-t border-border-theme/60 dark:border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-text">
                    <span className="font-bold uppercase tracking-wider text-muted-text">
                      Syllabus & Governance Standard:
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      Validity: {cert.code.includes("GOV") || cert.code.includes("ADM") ? "6 Months (Zero-Trust)" : "12 Months"}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {cert.prerequisites.map((p, idx) => (
                      <li key={idx} className="text-xs text-foreground dark:text-zinc-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-4 border-t border-border-theme/60 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-muted-text">
                  <span>{cert.questions.length} Questions • Passing: <strong>{cert.passingScorePercent}%</strong></span>
                  {isEarned && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold mt-0.5">
                      ✓ Active Status • Cryptographically Valid
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isEarned && (
                    <a
                      href={`/verify-certificate/${cert.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl text-xs font-bold border border-border-theme hover:bg-muted-area text-muted-text hover:text-foreground transition-all flex items-center gap-1.5"
                    >
                      <ExternalLink size={13} />
                      <span>Verify</span>
                    </a>
                  )}
                  <button
                    onClick={() => onOpenExam(cert.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                      isEarned
                        ? "bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/20"
                        : "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20"
                    }`}
                  >
                    <Award size={14} />
                    <span>{isEarned ? "Renew / Recertify" : "Take Examination"}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
