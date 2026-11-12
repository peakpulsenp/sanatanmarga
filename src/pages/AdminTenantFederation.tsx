import { useState } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { useTenant } from "@/src/lib/tenantContext";
import { 
  Building2, 
  Layers, 
  Plus, 
  CheckCircle2, 
  Globe, 
  ShieldCheck, 
  DollarSign, 
  Users, 
  ArrowRight, 
  Check, 
  Settings2, 
  Radio, 
  Cpu, 
  Sparkles,
  ExternalLink,
  Crown,
  Trash2,
  Edit3,
  Search,
  X,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TenantType, Tenant } from "@/src/types";

export default function AdminTenantFederation() {
  const { activeTenant, allTenants, switchTenant, addNewTenant, updateTenant, deleteTenant, toggleTenantModule } = useTenant();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // New / Edit Tenant Form State
  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "media" as TenantType,
    subdomain: "",
    customDomain: "",
    ownerName: "",
    ownerEmail: "",
    plan: "institutional" as "starter" | "institutional" | "enterprise",
    monthlyRateNpr: 35000
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenCreateModal = () => {
    setEditingTenant(null);
    setForm({
      name: "",
      code: "",
      type: "media",
      subdomain: "",
      customDomain: "",
      ownerName: "",
      ownerEmail: "",
      plan: "institutional",
      monthlyRateNpr: 35000
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: Tenant) => {
    setEditingTenant(t);
    setForm({
      name: t.name,
      code: t.code,
      type: t.type,
      subdomain: t.subdomain,
      customDomain: t.customDomain || "",
      ownerName: t.ownerName,
      ownerEmail: t.ownerEmail,
      plan: (t.billing?.plan as "starter" | "institutional" | "enterprise") || "institutional",
      monthlyRateNpr: t.billing?.monthlyRateNpr || 35000
    });
    setIsModalOpen(true);
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.subdomain) return;

    if (editingTenant) {
      await updateTenant(editingTenant.id, {
        name: form.name,
        code: form.code,
        type: form.type,
        subdomain: form.subdomain.toLowerCase().trim(),
        customDomain: form.customDomain,
        ownerName: form.ownerName,
        ownerEmail: form.ownerEmail,
        billing: {
          ...editingTenant.billing,
          plan: form.plan,
          monthlyRateNpr: Number(form.monthlyRateNpr)
        }
      });
      showToast(`टेनान्ट "${form.name}" को विवरण सफलतापूर्वक अद्यावधिक गरियो!`);
    } else {
      await addNewTenant({
        name: form.name,
        code: form.code || form.subdomain.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
        type: form.type,
        subdomain: form.subdomain.toLowerCase().trim(),
        customDomain: form.customDomain,
        ownerName: form.ownerName || "संस्थापक प्रमुख",
        ownerEmail: form.ownerEmail || "admin@institution.org",
        billing: {
          plan: form.plan,
          monthlyRateNpr: Number(form.monthlyRateNpr),
          status: "paid",
          nextBillingDate: "2026-12-31"
        }
      });
      showToast(`नयाँ टेनान्ट "${form.name}" दर्ता भयो!`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    if (id === "sanatan-media") {
      alert("मुख्य (Core Master) टेनान्ट मेटाउन मिल्दैन!");
      return;
    }
    if (confirm(`के तपाईं निश्चित हुनुहुन्छ कि टेनान्ट "${name}" मेटाउन चाहनुहुन्छ?`)) {
      await deleteTenant(id);
      showToast(`टेनान्ट "${name}" हटाइयो।`);
    }
  };

  const handleToggleModule = async (tenantId: string, moduleId: string, moduleName: string) => {
    await toggleTenantModule(tenantId, moduleId);
    showToast(`मोड्युल "${moduleName}" को अवस्था अद्यावधिक भयो।`);
  };

  const totalFederationMrr = allTenants.reduce((acc, t) => acc + (t.billing?.monthlyRateNpr || 0), 0);
  const totalFederationUsers = allTenants.reduce((acc, t) => acc + (t.stats?.totalUsers || 0), 0);

  const filteredTenants = allTenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const tenantTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
    PLATFORM: { label: "प्लेटफर्म (Platform)", icon: Crown, color: "text-amber-500 bg-amber-500/10" },
    MEDIA: { label: "मिडिया (Media)", icon: Radio, color: "text-blue-500 bg-blue-500/10" },
    PARTNER: { label: "साझेदार (Partner)", icon: Globe, color: "text-emerald-500 bg-emerald-500/10" },
    INSTITUTION: { label: "संस्था (Institution)", icon: Building2, color: "text-purple-500 bg-purple-500/10" },
    CLIENT: { label: "क्लायन्ट (Client)", icon: Users, color: "text-indigo-500 bg-indigo-500/10" },
    media: { label: "मिडिया (Media)", icon: Radio, color: "text-amber-500 bg-amber-500/10" },
    school: { label: "विद्यालय (School)", icon: Building2, color: "text-emerald-500 bg-emerald-500/10" },
    college: { label: "महाविद्यालय (College)", icon: Crown, color: "text-purple-500 bg-purple-500/10" },
    ngo: { label: "गैर-सरकारी (NGO)", icon: Users, color: "text-blue-500 bg-blue-500/10" },
    municipality: { label: "नगरपालिका (Municipality)", icon: Globe, color: "text-indigo-500 bg-indigo-500/10" },
    hospital: { label: "अस्पताल/स्वास्थ्य (Healthcare)", icon: Cpu, color: "text-rose-500 bg-rose-500/10" },
    corporate: { label: "व्यावसायिक (Corporate)", icon: Layers, color: "text-cyan-500 bg-cyan-500/10" }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* TOAST NOTIFICATION */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 right-6 z-50 bg-emerald-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-400/30"
            >
              <CheckCircle2 size={16} />
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-theme pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                MULTI-TENANT FEDERATION OS V3.0
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                {allTenants.length} संस्थागत टेनान्टहरू
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-card-foreground mt-1">
              बहु-संस्थागत सञ्जाल कमान्ड (Tenant Federation)
            </h1>
            <p className="text-xs md:text-sm text-muted-text mt-1">
              सनातन सूत्र OS अन्तर्गत मिडिया, विद्यालय, नगरपालिका तथा संस्थाहरूको साझा सञ्जाल सञ्चालन।
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            <Plus size={16} /> नयाँ टेनान्ट दर्ता गर्नुहोस्
          </button>
        </div>

        {/* ACTIVE TENANT INDICATOR */}
        <div className="bg-gradient-to-r from-amber-500/10 via-card to-card border border-amber-500/30 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Crown size={28} />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase">
                सक्रिय काम भइरहेको टेनान्ट (Current Active Context)
              </span>
              <h2 className="text-xl font-black text-card-foreground flex items-center gap-2">
                {activeTenant.name}
                <span className="px-2 py-0.5 rounded-md bg-muted-area text-xs font-mono font-bold text-muted-text border border-border-theme">
                  {activeTenant.code}
                </span>
              </h2>
              <p className="text-xs text-muted-text mt-0.5">
                डोमेन: <span className="font-mono text-primary font-bold">{activeTenant.customDomain || `${activeTenant.subdomain}.sutraos.np`}</span> • योजना: <span className="uppercase font-bold">{activeTenant.billing?.plan}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-xs border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SUTRA FEDERATION LINKED
            </span>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-card border border-border-theme rounded-3xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-muted-text">
              <span className="text-xs font-bold uppercase tracking-wider">सञ्जाल टेनान्ट संख्या</span>
              <Building2 size={18} className="text-primary" />
            </div>
            <div className="text-2xl font-black text-card-foreground font-mono">
              {allTenants.length} संस्थाहरू
            </div>
            <p className="text-xs text-muted-text">
              सक्रिय मिडिया, विद्यालय, र पालिका सञ्जाल
            </p>
          </div>

          <div className="bg-card border border-border-theme rounded-3xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-muted-text">
              <span className="text-xs font-bold uppercase tracking-wider">सञ्जाल MRR (मासिक राजस्व)</span>
              <DollarSign size={18} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-card-foreground font-mono">
              रू {totalFederationMrr.toLocaleString("ne-NP")}
            </div>
            <p className="text-xs text-emerald-600 font-bold">
              सबै टेनान्टहरूबाट प्राप्त कुल मासिक शुल्क
            </p>
          </div>

          <div className="bg-card border border-border-theme rounded-3xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-muted-text">
              <span className="text-xs font-bold uppercase tracking-wider">सञ्जाल प्रयोगकर्ता पदछाप</span>
              <Users size={18} className="text-blue-500" />
            </div>
            <div className="text-2xl font-black text-card-foreground font-mono">
              {totalFederationUsers.toLocaleString()} सदस्यहरू
            </div>
            <p className="text-xs text-blue-600 font-bold">
              एकीकृत बहु-संस्थागत पाठक तथा सदस्यहरू
            </p>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border-theme p-4 rounded-3xl">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-3 text-muted-text" />
            <input
              type="text"
              placeholder="टेनान्ट खोज्नुहोस्..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted-area/50 border border-border-theme rounded-xl text-xs font-bold text-card-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-muted-text shrink-0">प्रकार:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-muted-area/50 border border-border-theme rounded-xl px-3 py-2 text-xs font-bold text-card-foreground focus:outline-none focus:border-primary"
            >
              <option value="all">सबै (All Types)</option>
              <option value="media">मिडिया (Media)</option>
              <option value="school" disabled>विद्यालय (School - Future Dev)</option>
              <option value="college">महाविद्यालय (College)</option>
              <option value="municipality" disabled>नगरपालिका (Municipality - Future Dev)</option>
              <option value="hospital" disabled>स्वास्थ्य (Hospital - Future Dev)</option>
              <option value="ngo">गैर-सरकारी (NGO)</option>
              <option value="corporate">व्यावसायिक (Corporate)</option>
            </select>
          </div>
        </div>

        {/* TENANTS FEDERATION GRID */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-card-foreground text-lg flex items-center gap-2">
              <Layers size={20} className="text-primary" /> दर्ता भएका संस्थागत टेनान्टहरू ({filteredTenants.length})
            </h3>
            <span className="text-xs font-bold text-muted-text">
              मोड्युलमा थिचेर अन/अफ गर्नुहोस् वा सक्रिय स्विच गर्नुहोस्
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTenants.map((t) => {
              const isCurrent = t.id === activeTenant.id;
              const meta = tenantTypeLabels[t.type] || tenantTypeLabels.media;
              const IconComp = meta.icon;

              return (
                <div
                  key={t.id}
                  className={`bg-card border rounded-3xl p-6 transition-all relative overflow-hidden flex flex-col justify-between ${
                    isCurrent 
                      ? "border-primary ring-2 ring-primary/20 shadow-md" 
                      : "border-border-theme hover:border-primary/50 shadow-sm"
                  }`}
                >
                  <div className="space-y-4">
                    {/* TOP BADGE & ACTIONS */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${meta.color}`}>
                        <IconComp size={14} />
                        {meta.label}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(t)}
                          className="p-1.5 rounded-xl bg-muted-area hover:bg-primary/10 text-muted-text hover:text-primary transition-all"
                          title="सम्पादन गर्नुहोस्"
                        >
                          <Edit3 size={14} />
                        </button>
                        {t.id !== "sanatan-media" && (
                          <button
                            onClick={() => handleDeleteTenant(t.id, t.name)}
                            className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                            title="मेटाउनुहोस्"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {isCurrent ? (
                          <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1">
                            <Check size={12} /> हालको टेनान्ट
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              switchTenant(t.id);
                              showToast(`सक्रिय टेनान्ट परिवर्तन भयो: "${t.name}"`);
                            }}
                            className="px-3 py-1 rounded-xl bg-muted-area hover:bg-primary/10 text-card-foreground hover:text-primary border border-border-theme text-xs font-bold transition-all"
                          >
                            सक्रिय गर्नुहोस्
                          </button>
                        )}
                      </div>
                    </div>

                    {/* TITLE & CODE */}
                    <div>
                      <h4 className="font-black text-lg text-card-foreground">
                        {t.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-text mt-1">
                        <span className="font-mono text-primary font-bold">@{t.subdomain}</span>
                        <span>•</span>
                        <span>प्रबन्धक: {t.ownerName}</span>
                      </div>
                    </div>

                    {/* DOMAIN & BILLING */}
                    <div className="p-3.5 rounded-2xl bg-muted-area/50 border border-border-theme/50 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-text block text-[10px] uppercase font-bold">अनुकूल डोमेन</span>
                        <span className="font-mono font-bold text-card-foreground truncate block">
                          {t.customDomain || `${t.subdomain}.sutraos.np`}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-text block text-[10px] uppercase font-bold">मासिक शुल्क</span>
                        <span className="font-mono font-bold text-emerald-600 block">
                          रू {t.billing?.monthlyRateNpr?.toLocaleString("ne-NP") || 0}
                        </span>
                      </div>
                    </div>

                    {/* TENANT HEALTH SCORECARD */}
                    <div className="p-3.5 rounded-2xl bg-muted-area/80 border border-border-theme/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-text">
                          Tenant Health Score
                        </span>
                        {(() => {
                          const score = (t.stats?.totalUsers || 10) * 8 + (t.billing?.monthlyRateNpr ? 35 : 10);
                          const finalScore = Math.min(98, Math.max(68, score % 100));
                          const isHealthy = finalScore >= 85;
                          const isGrowing = finalScore >= 75 && finalScore < 85;

                          return (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              isHealthy ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                              isGrowing ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                              "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            }`}>
                              {finalScore}/100 • {isHealthy ? "Healthy" : isGrowing ? "Growing" : "At Risk"}
                            </span>
                          );
                        })()}
                      </div>

                      {/* SCORE PROGRESS BAR */}
                      {(() => {
                        const score = (t.stats?.totalUsers || 10) * 8 + (t.billing?.monthlyRateNpr ? 35 : 10);
                        const finalScore = Math.min(98, Math.max(68, score % 100));
                        return (
                          <div className="w-full bg-border-theme rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                finalScore >= 85 ? "bg-emerald-500" : finalScore >= 75 ? "bg-amber-500" : "bg-rose-500"
                              }`}
                              style={{ width: `${finalScore}%` }}
                            />
                          </div>
                        );
                      })()}
                    </div>

                    {/* ENABLED MODULES WITH INTERACTIVE TOGGLES */}
                    <div>
                      <span className="text-xs font-bold text-muted-text block mb-2">
                        सक्रिय मोड्युलहरू (क्लिक गरेर अन/अफ गर्नुहोस्):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {t.modules?.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => handleToggleModule(t.id, m.id, m.name)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                              m.enabled 
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20" 
                                : "bg-muted-area text-muted-text border-border-theme opacity-60 hover:opacity-100"
                            }`}
                            title={`Click to ${m.enabled ? 'disable' : 'enable'}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${m.enabled ? 'bg-emerald-500' : 'bg-muted-text'}`} />
                            {m.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM FOOTER */}
                  <div className="pt-4 mt-5 border-t border-border-theme/40 flex items-center justify-between text-xs text-muted-text">
                    <span>दर्ता: {new Date(t.createdAt).toLocaleDateString("ne-NP")}</span>
                    <span className="font-mono font-bold text-card-foreground">
                      {t.stats?.totalUsers || 0} प्रयोगकर्ता
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* NEW / EDIT TENANT MODAL */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border-theme rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-border-theme pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                      <Building2 size={22} />
                    </div>
                    <div>
                      <h3 className="font-black text-card-foreground text-lg">
                        {editingTenant ? "टेनान्ट सम्पादन गर्नुहोस्" : "नयाँ संस्थागत टेनान्ट दर्ता"}
                      </h3>
                      <p className="text-xs text-muted-text">
                        {editingTenant ? "संस्थाको नाम, डोमेन र योजना अद्यावधिक गर्नुहोस्" : "सनातन सूत्र OS बहु-संस्थागत सञ्जालमा जोडिनुहोस्"}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-muted-area text-muted-text">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveTenant} className="space-y-4 text-xs font-bold">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-muted-text mb-1">संस्थाको पुरा नाम *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="उदा: काठमाडौँ राष्ट्रिय विद्यालय"
                        className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-muted-text mb-1">संस्थागत प्रकार (Type) *</label>
                      <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value as TenantType })}
                        className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-3 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                      >
                        <option value="media">मिडिया (Media)</option>
                        <option value="school" disabled>विद्यालय (School - Future Dev)</option>
                        <option value="college">महाविद्यालय (College)</option>
                        <option value="municipality" disabled>नगरपालिका (Municipality - Future Dev)</option>
                        <option value="hospital" disabled>अस्पताल/स्वास्थ्य (Healthcare - Future Dev)</option>
                        <option value="ngo">गैर-सरकारी (NGO)</option>
                        <option value="corporate">व्यावसायिक (Corporate)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-muted-text mb-1">सब-डोमेन नाम (Subdomain) *</label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={form.subdomain}
                          onChange={(e) => setForm({ ...form, subdomain: e.target.value })}
                          placeholder="ktm-school"
                          className="w-full bg-muted-area/50 border border-border-theme rounded-l-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary font-mono"
                          required
                        />
                        <span className="bg-muted-area border border-l-0 border-border-theme rounded-r-xl px-3 py-2.5 text-muted-text font-mono text-[11px] shrink-0">
                          .sutraos.np
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-muted-text mb-1">अनुकूल डोमेन (Custom Domain)</label>
                      <input
                        type="text"
                        value={form.customDomain}
                        onChange={(e) => setForm({ ...form, customDomain: e.target.value })}
                        placeholder="school.edu.np"
                        className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-muted-text mb-1">प्रबन्धकको नाम</label>
                      <input
                        type="text"
                        value={form.ownerName}
                        onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                        placeholder="उदा: प्रा. डा. रामप्रसाद शर्मा"
                        className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-muted-text mb-1">प्रबन्धकको इमेल</label>
                      <input
                        type="email"
                        value={form.ownerEmail}
                        onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                        placeholder="admin@school.edu.np"
                        className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-muted-text mb-1">वार्षिक/मासिक सदस्यता योजना</label>
                      <select
                        value={form.plan}
                        onChange={(e) => setForm({ ...form, plan: e.target.value as any })}
                        className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-3 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                      >
                        <option value="starter">स्टार्टर (Starter - NPR 15,000/mo)</option>
                        <option value="institutional">संस्थागत (Institutional - NPR 35,000/mo)</option>
                        <option value="enterprise">एन्टरप्राइज (Enterprise - NPR 120,000+/mo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-muted-text mb-1">मासिक दर (NPR)</label>
                      <input
                        type="number"
                        value={form.monthlyRateNpr}
                        onChange={(e) => setForm({ ...form, monthlyRateNpr: Number(e.target.value) })}
                        className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-border-theme">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl bg-muted-area text-card-foreground hover:bg-muted-area/80 transition-all"
                    >
                      रद्द गर्नुहोस्
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                    >
                      {editingTenant ? "अद्यावधिक सुरक्षित गर्नुहोस्" : "टेनान्ट दर्ता गर्नुहोस्"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
}
