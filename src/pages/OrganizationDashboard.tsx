import React, { useState, useEffect } from "react";
import { 
  Building2, Users, UserPlus, ShieldCheck, Mail, CheckCircle2, Trash2, 
  Download, FileText, DollarSign, Crown, Sparkles, RefreshCw, Layers
} from "lucide-react";
import { useAuth } from "@/src/lib/auth";
import { toast } from "sonner";
import { MEMBERSHIP_TIERS } from "@/src/constants/permissions";

interface OrgMember {
  uid: string;
  email: string;
  name: string;
  role: "owner" | "manager" | "analyst" | "viewer";
  joinedAt: string;
}

export default function OrganizationDashboard() {
  const { user } = useAuth();
  const [orgName, setOrgName] = useState("Nepal National Media & Tech Group");
  const [orgDomain, setOrgDomain] = useState("media.np");
  const [members, setMembers] = useState<OrgMember[]>([
    { uid: user?.uid || "u1", email: user?.email || "admin@media.np", name: user?.displayName || "Organization Admin", role: "owner", joinedAt: "2026-01-15" },
    { uid: "u2", email: "editor@media.np", name: "सुशीला शर्मा", role: "manager", joinedAt: "2026-02-01" },
    { uid: "u3", email: "analyst@media.np", name: "प्रकाश सापकोटा", role: "analyst", joinedAt: "2026-03-10" },
    { uid: "u4", email: "viewer@media.np", name: "अनिता क्षेत्री", role: "viewer", joinedAt: "2026-04-05" },
  ]);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "analyst" | "viewer">("viewer");
  const [isAdding, setIsAdding] = useState(false);

  const maxSeats = 10;
  const usedSeats = members.length;

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("कृपया इमेल ठेगाना प्रविष्ट गर्नुहोस्");
      return;
    }
    if (usedSeats >= maxSeats) {
      toast.error("संस्थागत १० सिटको सीमा पूरा भयो।");
      return;
    }

    const newM: OrgMember = {
      uid: `u_${Date.now()}`,
      email: inviteEmail.trim(),
      name: inviteEmail.split("@")[0],
      role: inviteRole,
      joinedAt: new Date().toISOString().slice(0, 10)
    };

    setMembers(prev => [...prev, newM]);
    setInviteEmail("");
    toast.success(`निमन्त्रणा पठाइयो: ${newM.email}`);
  };

  const handleRemoveMember = (uid: string) => {
    setMembers(prev => prev.filter(m => m.uid !== uid));
    toast.info("टिम सदस्य हटाइयो");
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Building2 size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
                  Corporate Multi-Seat OS
                </span>
                <span className="text-xs text-muted-foreground font-mono">{usedSeats}/{maxSeats} Seats Used</span>
              </div>
              <h1 className="text-2xl font-bold font-display text-foreground mt-1">{orgName}</h1>
              <p className="text-xs text-muted-foreground">डोमेन: <b className="text-foreground">{orgDomain}</b> • योजना: <b className="text-emerald-500">Corporate Member</b></p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => toast.success("Invoice generated & downloaded")}
              className="px-4 py-2.5 rounded-xl border border-border bg-accent hover:bg-accent/80 font-bold text-xs flex items-center gap-2 transition-colors"
            >
              <Download size={15} />
              <span>कर बिजक डाउनलोड (VAT Invoice)</span>
            </button>
          </div>
        </div>

        {/* Seat Allocation & Invite Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <h3 className="font-bold text-base font-display flex items-center gap-2">
              <UserPlus size={18} className="text-emerald-500" />
              <span>नयाँ टिम सदस्य थप्नुहोस्</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              १० जना सम्मका कर्मचारी, सम्पादक तथा विश्लेषकहरूलाई संस्थागत खातामा सामेल गराउनुहोस्।
            </p>

            <form onSubmit={handleInviteMember} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">कर्मचारी इमेल:</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">संस्थागत भूमिका (Role):</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-bold text-foreground"
                >
                  <option value="manager">प्रबन्धक (Manager - पूर्ण अधिकार)</option>
                  <option value="analyst">विश्लेषक (Analyst - Analytics/Reports)</option>
                  <option value="viewer">अवलोकनकर्ता (Viewer - Read Premium Content)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Mail size={15} />
                <span>निमन्त्रणा पठाउनुहोस् ({maxSeats - usedSeats} सिट बाँकी)</span>
              </button>
            </form>
          </div>

          {/* Active Members Table */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base font-display flex items-center gap-2">
                  <Users size={18} className="text-indigo-500" />
                  <span>सक्रिय टिम सदस्यहरू (Organization Roster)</span>
                </h3>
                <p className="text-xs text-muted-foreground">प्रिमियम पहुँच र AnalyticsOS सुविधा प्राप्त प्रयोगकर्ताहरू।</p>
              </div>
              <span className="text-xs font-mono font-bold bg-accent px-3 py-1 rounded-lg border border-border">
                {usedSeats} / {maxSeats} Seats
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-accent/40 border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">कर्मचारी (Member)</th>
                    <th className="p-3">भूमिका (Role)</th>
                    <th className="p-3">थपिएको मिति</th>
                    <th className="p-3 text-right">कार्य (Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {members.map((m) => (
                    <tr key={m.uid} className="hover:bg-accent/20 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-foreground">{m.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{m.email}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          m.role === "owner"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : m.role === "manager"
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                            : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        }`}>
                          {m.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground text-[11px] font-mono">{m.joinedAt}</td>
                      <td className="p-3 text-right">
                        {m.role !== "owner" && (
                          <button
                            onClick={() => handleRemoveMember(m.uid)}
                            title="टिमबाट हटाउनुहोस्"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
