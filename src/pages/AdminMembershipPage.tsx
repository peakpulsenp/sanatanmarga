import React, { useState } from "react";
import {
  Crown,
  CheckCircle2,
  ShieldCheck,
  CloudUpload,
  Users,
  Lock
} from "lucide-react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { MEMBERSHIP_TIERS, ENTITLEMENTS, MembershipPlan } from "@/src/constants/permissions";
import { useLanguage } from "@/src/context/LanguageContext";
import { adminFetch } from "@/src/lib/adminFetch";
import { toast } from "sonner";

export default function AdminMembershipPage() {
  const { language } = useLanguage();
  const [plans, setPlans] = useState<MembershipPlan[]>(Object.values(MEMBERSHIP_TIERS));
  const [publishing, setPublishing] = useState(false);

  const handlePublishMembershipSnapshot = async () => {
    setPublishing(true);
    try {
      const res = await adminFetch("/api/snapshots/rebuild", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "admin_membership_plans",
          moduleId: "membership_plans"
        })
      });
      if (res.ok) {
        toast.success("Public membership_plans snapshot published to R2");
      } else {
        toast.error("Snapshot publish returned an error");
      }
    } catch (e) {
      toast.error("Failed to publish membership_plans snapshot");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* 1. Workspace Header */}
        <div className="bg-card border border-border-theme rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
              <Crown size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground">
                {language === "en" ? "Membership OS & Access Tiers" : "सदस्यता ओएस तथा पहुँच तहहरू"}
              </h1>
              <p className="text-xs text-muted-text">
                {language === "en"
                  ? "Manage Reader, Patron, Sadhak, Sanrakshak, and Institutional membership plans, entitlements, and membership_plans snapshots"
                  : "सदस्यता योजना, सुविधा म्याट्रिक्स र सार्वजनिक स्न्यापसट व्यवस्थापन"}
              </p>
            </div>
          </div>

          <button
            onClick={handlePublishMembershipSnapshot}
            disabled={publishing}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CloudUpload size={15} />
            <span>
              {publishing
                ? "Publishing..."
                : language === "en" ? "Publish membership_plans Snapshot" : "membership_plans स्न्यापसट प्रकाशन"}
            </span>
          </button>
        </div>

        {/* 2. Tier Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div
              key={plan.id}
              className="bg-card border border-border-theme rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black border ${plan.badgeColor}`}>
                    {plan.badgeNe}
                  </span>
                  <span className="font-mono text-xs text-muted-text">{plan.tierKey}</span>
                </div>
                <h2 className="text-lg font-black text-foreground mt-2">
                  {language === "en" ? plan.nameEn : plan.nameNe}
                </h2>
                <p className="text-xs text-muted-text mt-1">
                  {language === "en" ? plan.taglineEn : plan.taglineNe}
                </p>

                <div className="mt-4 pt-3 border-t border-border-theme flex items-baseline gap-2">
                  <span className="text-xl font-black text-foreground">
                    NPR {plan.priceNprMonthly.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-text">/ month</span>
                  <span className="text-[11px] text-accent font-bold ml-auto">
                    NPR {plan.priceNprYearly.toLocaleString()} / yr
                  </span>
                </div>

                <ul className="mt-4 space-y-2 text-xs">
                  {(language === "en" ? plan.benefitsEn : plan.benefitsNe).map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-foreground">
                      <CheckCircle2 size={14} className="text-success shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-border-theme flex items-center justify-between text-[11px] text-muted-text">
                <span>Snapshot Category: Cat A (Public Plan)</span>
                <span className="text-success font-bold">Active</span>
              </div>
            </div>
          ))}
        </div>

        {/* 3. Entitlements Matrix */}
        <div className="bg-card border border-border-theme rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              <ShieldCheck size={16} className="text-accent" />
              <span>{language === "en" ? "Cross-Module Entitlement Matrix" : "अन्तर-मोड्युल अधिकार म्याट्रिक्स"}</span>
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-text">
              <Lock size={12} className="text-danger" />
              <span>Private subscriber billing records (Cat D) are strictly excluded from public snapshots</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-theme text-[11px] font-black uppercase text-muted-text">
                  <th className="py-3 px-4">Entitlement Capability</th>
                  <th className="py-3 px-4">Key</th>
                  <th className="py-3 px-4">Allowed Tiers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme">
                {Object.values(ENTITLEMENTS).map(ent => (
                  <tr key={ent.key} className="hover:bg-surface-interactive/40">
                    <td className="py-3 px-4 font-bold text-foreground">
                      {language === "en" ? ent.nameEn : ent.nameNe}
                    </td>
                    <td className="py-3 px-4 font-mono text-accent">{ent.key}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {ent.allowedTiers.map(t => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded bg-surface-interactive border border-border-theme font-mono text-[10px] font-bold uppercase"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

