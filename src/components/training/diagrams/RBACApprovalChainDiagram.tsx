import React, { useState } from "react";
import { 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Lock, 
  FileEdit, 
  Eye, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight
} from "lucide-react";

interface RoleHierarchyItem {
  id: string;
  roleTitle: string;
  roleNepali: string;
  badgeColor: string;
  level: number;
  permissions: string[];
  responsibilities: string;
}

const ROLES: RoleHierarchyItem[] = [
  {
    id: "super_admin",
    roleTitle: "Platform SuperAdmin",
    roleNepali: "सर्वोच्च प्रणाली प्रशासक",
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/30",
    level: 5,
    permissions: ["Full system control", "Tenant configuration", "Disaster recovery rollback", "RBAC permission grant/revoke", "API keys"],
    responsibilities: "Responsible for core infrastructure, SnapshotOS rehydration, tenant federation, and executive operations."
  },
  {
    id: "admin",
    roleTitle: "Operations Administrator",
    roleNepali: "सञ्चालन प्रशासक",
    badgeColor: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
    level: 4,
    permissions: ["User management", "Store & inventory control", "Ad campaigns & revenue", "Audit log inspection", "Live stream configuration"],
    responsibilities: "Oversees daily business operations, e-commerce catalog, advertiser placements, and system telemetry."
  },
  {
    id: "editor",
    roleTitle: "Senior Editor (Truth Guardian)",
    roleNepali: "वरिष्ठ सम्पादक (सत्य संरक्षक)",
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    level: 3,
    permissions: ["Publish drafted stories", "Reject/Return articles", "Push notification dispatch", "Four-eyes approval signoff", "Media library curate"],
    responsibilities: "Enforces editorial policy, reviews journalist drafts, validates image rights, and approves breaking news pushes."
  },
  {
    id: "journalist",
    roleTitle: "Field Correspondent & Journalist",
    roleNepali: "संवाददाता तथा खोज पत्रकार",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    level: 2,
    permissions: ["Draft articles", "Upload raw media", "District field reporting", "Trigger AI search discovery", "View personal analytics"],
    responsibilities: "Conducts investigative reporting, gathers verified evidence, writes Devanagari drafts, and submits for editorial review."
  },
  {
    id: "reader",
    roleTitle: "Reader & Chautari Citizen",
    roleNepali: "पाठक तथा चौतारी सदस्य",
    badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    level: 1,
    permissions: ["Read news & archives", "Listen to RadioOS & TTS", "Participate in Chautari", "Bookmark & offline sync", "Store WhatsApp checkout"],
    responsibilities: "Enjoys verified civilizational intelligence and contributes respectful discourse in the civic forum."
  }
];

export default function RBACApprovalChainDiagram() {
  const [selectedRole, setSelectedRole] = useState<string>("editor");

  const currentRole = ROLES.find(r => r.id === selectedRole) || ROLES[2];

  return (
    <div className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-theme dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">
            <ShieldCheck size={14} /> Governance & Security Architecture
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground dark:text-white mt-1">
            RBAC Permission Hierarchy & Four-Eyes Approval
          </h3>
          <p className="text-xs sm:text-sm text-muted-text dark:text-zinc-400 mt-1">
            Zero-trust role boundaries ensuring no single actor can bypass independent editorial fact-checking.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 px-3 py-1.5 rounded-full text-xs font-mono font-bold">
          Zero-Trust RBAC Enforced
        </div>
      </div>

      {/* Role Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-6">
        {ROLES.map((role) => {
          const isSelected = role.id === selectedRole;

          return (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected 
                  ? "bg-violet-500/10 border-violet-500/40 ring-2 ring-violet-500/30 shadow-lg scale-[1.02]" 
                  : "bg-muted-area/40 dark:bg-zinc-900/40 border-border-theme dark:border-zinc-800 hover:border-violet-500/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-muted-text">Tier {role.level}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${role.badgeColor}`}>
                  L{role.level}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-text block">{role.roleNepali}</span>
                <span className="text-xs font-black text-foreground dark:text-zinc-100 block leading-tight mt-0.5">
                  {role.roleTitle.split(" ")[0]}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Role Details & Permissions */}
      <div className="bg-muted-area/60 dark:bg-zinc-900/60 border border-border-theme dark:border-zinc-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-theme/60 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-black text-foreground dark:text-white">
                {currentRole.roleTitle}
              </h4>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${currentRole.badgeColor}`}>
                {currentRole.roleNepali}
              </span>
            </div>
            <p className="text-xs text-muted-text dark:text-zinc-400 mt-1">
              {currentRole.responsibilities}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-text dark:text-zinc-400 block mb-2.5">
            Explicit System Privileges & Guardrails
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {currentRole.permissions.map((perm, idx) => (
              <div key={idx} className="bg-card dark:bg-zinc-950 border border-border-theme dark:border-zinc-800 rounded-xl p-3 flex items-center gap-2.5 shadow-sm">
                <CheckCircle2 size={14} className="text-violet-500 shrink-0" />
                <span className="text-xs font-bold text-foreground dark:text-zinc-200">{perm}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Four-Eyes Visual Chain Callout */}
        <div className="mt-5 p-4 rounded-xl bg-card dark:bg-zinc-950 border border-border-theme dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Lock size={18} />
            </div>
            <div>
              <span className="text-xs font-black text-foreground dark:text-white block">
                The Four-Eyes Principle in Action
              </span>
              <span className="text-xs text-muted-text dark:text-zinc-400 block">
                Journalist writes draft → Automated fact gate checks claims → Editor conducts review → Live publishing.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-muted-area dark:bg-zinc-900 px-3 py-1.5 rounded-lg text-muted-text">
            <span>Enforced by: ProtectedPermissionRoute</span>
          </div>
        </div>
      </div>
    </div>
  );
}
