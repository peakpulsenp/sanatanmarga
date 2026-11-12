import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { useTenant } from "@/src/lib/tenantContext";
import { toast } from "sonner";
import { TenantType, TenantModule } from "@/src/types";
import { 
  Building2, 
  CheckCircle2, 
  Sparkles, 
  Globe, 
  Radio, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Users, 
  Crown, 
  ArrowRight, 
  Check, 
  Zap,
  Rocket
} from "lucide-react";
import { motion } from "motion/react";

export default function TenantOnboardingPage() {
  const navigate = useNavigate();
  const { addNewTenant } = useTenant();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState<TenantType>("media");
  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [plan, setPlan] = useState<"starter" | "institutional" | "enterprise">("institutional");

  // Selected Modules
  const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>({
    editorial_cms: true,
    community_chautari: true,
    knowledge_graph: true,
    ai_newsroom: false,
    revenue_os: false,
    municipal_portal: false
  });

  const availableModulesList = [
    { id: "editorial_cms", name: "Editorial & Content CMS", desc: "लेखन, सम्पादन तथा समाचार सम्पादन कमान्ड", category: "Core" },
    { id: "community_chautari", name: "Chautari Community Forum", desc: "नागरिक तथा प्रयोगकर्ता संवाद चौतारी", category: "Core" },
    { id: "knowledge_graph", name: "Saraswati Knowledge OS", desc: "ज्ञानकोष, ग्रन्थ तथा सम्पदा खोज प्रणाली", category: "Intelligence" },
    { id: "ai_newsroom", name: "Grounded AI Co-Pilot", desc: "स्वायत्त AI समाचार Co-pilot तथा बहु-भाषा अनुवाद", category: "AI" },
    { id: "revenue_os", name: "Sponsorship & Revenue OS", desc: "प्रायोजन प्रस्ताव तथा राजस्व खाता प्रबन्धन", category: "Business" },
    { id: "municipal_portal", name: "Municipal Citizen Portal", desc: "नागरिक सिफारिस, सूचना तथा बडा पत्र", category: "Civic" }
  ];

  const handleToggleModule = (id: string) => {
    setSelectedModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [isDeploying, setIsDeploying] = useState(false);

  const handleCompleteOnboarding = async () => {
    setIsDeploying(true);

    const modules: TenantModule[] = Object.keys(selectedModules).map(key => ({
      id: key,
      name: availableModulesList.find(m => m.id === key)?.name || key,
      enabled: selectedModules[key],
      version: "3.0"
    }));

    const monthlyRateMap = {
      starter: 25000,
      institutional: 45000,
      enterprise: 120000
    };

    await addNewTenant({
      name: name || "नयाँ संस्थागत टेनान्ट",
      code: subdomain.toUpperCase().replace(/[^A-Z0-9]/g, '_') || "SUTRA_TENANT",
      type: type,
      subdomain: subdomain.toLowerCase().trim() || `tenant-${Date.now()}`,
      customDomain: customDomain,
      ownerName: ownerName || "संस्थापक प्रमुख",
      ownerEmail: ownerEmail || "admin@institution.org",
      modules: modules,
      billing: {
        plan: plan,
        monthlyRateNpr: monthlyRateMap[plan],
        status: "paid",
        nextBillingDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
      }
    });

    setTimeout(() => {
      setIsDeploying(false);
      navigate("/admin/tenants");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors">
      <Header />

      <main className="flex-1 py-10 px-4 max-w-4xl mx-auto w-full">
        
        {/* HEADER */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
            <Sparkles size={14} /> SANATANOS SELF-SERVICE ONBOARDING
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-card-foreground">
            संस्थागत टेनान्ट स्वतः-दर्ता (Institutional Workspace Deployment)
          </h1>
          <p className="text-sm text-muted-text max-w-xl mx-auto">
            तपाईंको विद्यालय, मिडिया गृह, नगरपालिका वा संस्थाको लागि छुट्टै SanatanOS Workpace ३ मिनेटमा स्थापना गर्नुहोस्।
          </p>
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="flex items-center justify-between border-b border-border-theme pb-6 mb-8 text-xs font-bold">
          {[
            { num: 1, title: "१. संस्थागत परिचय" },
            { num: 2, title: "२. सब-डोमेन र ठेगाना" },
            { num: 3, title: "३. मोड्युल छनोट" },
            { num: 4, title: "४. योजना र तैनाथी" }
          ].map((item) => (
            <div
              key={item.num}
              onClick={() => step > item.num && setStep(item.num as any)}
              className={`flex items-center gap-2 cursor-pointer transition-all ${
                step === item.num
                  ? "text-primary border-b-2 border-primary pb-2 font-black"
                  : step > item.num
                  ? "text-emerald-600 font-bold"
                  : "text-muted-text opacity-60"
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                step === item.num
                  ? "bg-primary text-primary-foreground"
                  : step > item.num
                  ? "bg-emerald-500 text-white"
                  : "bg-muted-area text-muted-text"
              }`}>
                {step > item.num ? <Check size={12} /> : item.num}
              </span>
              <span className="hidden sm:inline">{item.title}</span>
            </div>
          ))}
        </div>

        {/* WIZARD CARD */}
        <div className="bg-card border border-border-theme rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          
          {/* STEP 1: INSTITUTION PROFILE */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-card-foreground">संस्थागत विवरण (Institution Profile)</h2>
                <p className="text-xs text-muted-text mt-1">तपाईंको संस्था वा निकायको नाम तथा प्रकृति छनोट गर्नुहोस्।</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-card-foreground">संस्थाको पूर्ण नाम (Official Name) *</label>
                  <input
                    type="text"
                    placeholder="उदा: वाल्मीकि विद्यापीठ / धरान उपमहानगरपालिका"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-muted-area border border-border-theme text-card-foreground font-medium text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-card-foreground">संस्थाको प्रकृति (Institution Type) *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { id: "school", label: "विद्यालय / गुरुकुल", icon: Building2, isFuture: true },
                      { id: "college", label: "महाविद्यालय / क्याम्पस", icon: Crown },
                      { id: "media", label: "मिडिया / पत्रपत्रिका", icon: Radio },
                      { id: "municipality", label: "नगरपालिका / गाउँपालिका", icon: Globe, isFuture: true },
                      { id: "hospital", label: "अस्पताल / आयुर्वेद", icon: Cpu, isFuture: true },
                      { id: "ngo", label: "गैर-सरकारी / गुठी", icon: Users }
                    ].map((item) => {
                      const IconComp = item.icon;
                      const isSelected = type === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (item.isFuture) {
                              toast.info(`${item.label} प्रणाली भविष्यको विकासका लागि आरक्षित छ।`);
                              return;
                            }
                            setType(item.id as TenantType);
                          }}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-2 relative ${
                            item.isFuture
                              ? "bg-muted-area/20 border-border-theme/40 text-muted-text/40 cursor-not-allowed"
                              : isSelected
                              ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
                              : "bg-muted-area/40 border-border-theme text-muted-text hover:bg-muted-area"
                          }`}
                        >
                          {item.isFuture && (
                            <span className="absolute top-1 right-1 text-[8px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1 py-0.5 rounded-md uppercase tracking-wider scale-90">
                              भविष्य
                            </span>
                          )}
                          <IconComp size={22} className={item.isFuture ? "opacity-30" : ""} />
                          <span className="text-xs font-bold">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="font-bold text-card-foreground">प्रबन्धक / प्रमुखको नाम</label>
                    <input
                      type="text"
                      placeholder="उदा: डा. रामप्रसाद शर्मा"
                      value={ownerName}
                      onChange={e => setOwnerName(e.target.value)}
                      className="w-full p-3.5 rounded-2xl bg-muted-area border border-border-theme text-card-foreground outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-card-foreground">सम्पर्क इमेल</label>
                    <input
                      type="email"
                      placeholder="contact@institution.edu.np"
                      value={ownerEmail}
                      onChange={e => setOwnerEmail(e.target.value)}
                      className="w-full p-3.5 rounded-2xl bg-muted-area border border-border-theme text-card-foreground outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  disabled={!name}
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md"
                >
                  अगाडि बढ्नुहोस् <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: SUBDOMAIN */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-card-foreground">सब-डोमेन तथा वेब ठेगाना (Subdomain)</h2>
                <p className="text-xs text-muted-text mt-1">तपाईंको Workspace को लागि अद्वितीय डिजिटल ठेगाना चयन गर्नुहोस्।</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-card-foreground">निःशुल्क SanatanOS सब-डोमेन prefix *</label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      placeholder="valmiki-campus"
                      value={subdomain}
                      onChange={e => setSubdomain(e.target.value)}
                      className="w-full p-3.5 rounded-l-2xl bg-muted-area border border-border-theme text-card-foreground font-mono text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                    <span className="p-3.5 bg-card border border-l-0 border-border-theme rounded-r-2xl font-mono text-xs font-bold text-primary">
                      .sutraos.np
                    </span>
                  </div>
                  {subdomain && (
                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1">
                      <CheckCircle2 size={12} /> उपलब्ध छ: <span className="font-mono">{subdomain}.sutraos.np</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="font-bold text-card-foreground">कस्टम डोमेन (Custom Domain - Optional)</label>
                  <input
                    type="text"
                    placeholder="उदा: valmiki.edu.np"
                    value={customDomain}
                    onChange={e => setCustomDomain(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-muted-area border border-border-theme text-card-foreground font-mono outline-none"
                  />
                  <p className="text-[11px] text-muted-text">कस्टम डोमेन जोड्न CNAME रेकर्ड <span className="font-mono text-card-foreground">cname.sutraos.np</span> मा औंल्याउनुपर्नेछ।</p>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-2xl bg-muted-area hover:bg-border-theme text-muted-text font-bold text-xs"
                >
                  पछाडि
                </button>
                <button
                  disabled={!subdomain}
                  onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md"
                >
                  मोड्युल छनोट गर्नुहोस् <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: MODULE MARKETPLACE */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-card-foreground">मोड्युल मार्केटप्लेस (Select Workspace Modules)</h2>
                <p className="text-xs text-muted-text mt-1">तपाईंको संस्थालाई आवश्यक पर्ने सञ्चालन मोड्युलहरू छान्नुहोस्।</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableModulesList.map((mod) => {
                  const isChecked = selectedModules[mod.id] ?? false;
                  return (
                    <div
                      key={mod.id}
                      onClick={() => handleToggleModule(mod.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isChecked 
                          ? "bg-primary/10 border-primary shadow-sm" 
                          : "bg-muted-area/40 border-border-theme hover:bg-muted-area"
                      }`}
                    >
                      <div className={`mt-0.5 p-1 rounded-lg border ${
                        isChecked ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border-theme text-transparent"
                      }`}>
                        <Check size={14} />
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-card-foreground text-sm">{mod.name}</span>
                          <span className="px-2 py-0.5 rounded-md bg-muted-area text-[10px] font-mono text-muted-text border border-border-theme">
                            {mod.category}
                          </span>
                        </div>
                        <p className="text-muted-text">{mod.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-3 rounded-2xl bg-muted-area hover:bg-border-theme text-muted-text font-bold text-xs"
                >
                  पछाडि
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md"
                >
                  योजना चयन र तैनाथी <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: PLAN & DEPLOYMENT */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-card-foreground">संस्थागत सदस्यता योजना (Institutional SaaS Plan)</h2>
                <p className="text-xs text-muted-text mt-1">तपाईंको आवश्यकता अनुसारको उपयुक्त योजना रोज्नुहोस्।</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    id: "starter",
                    title: "Starter Plan",
                    price: "रू २५,०००",
                    desc: "सानात तथा स्थानीय संस्थाहरूको लागि",
                    features: ["५ जना सम्पादक", "१०,००० मासिक पाठक", "दैनिक Cloud Backups"]
                  },
                  {
                    id: "institutional",
                    title: "Institutional Plan",
                    price: "रू ४५,०००",
                    desc: "विद्यालय, क्याम्पस तथा मिडियाको लागि",
                    popular: true,
                    features: ["२५ जना सम्पादक", "१,००,०००+ पाठक", "Grounded AI Co-Pilot", "Saraswati Knowledge OS"]
                  },
                  {
                    id: "enterprise",
                    title: "Enterprise Plan",
                    price: "रू १,२०,०००+",
                    desc: "नगरपालिका तथा ठूला निगमहरू",
                    features: ["अनगिन्ती प्रयोगकर्ता", "Custom Domain CNAME", "Dedicated Account Manager", "SLA 99.98% Guarantee"]
                  }
                ].map((p) => {
                  const isSelected = plan === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setPlan(p.id as any)}
                      className={`p-5 rounded-3xl border cursor-pointer transition-all relative flex flex-col justify-between space-y-4 ${
                        isSelected 
                          ? "bg-primary/10 border-primary ring-2 ring-primary/20 shadow-lg" 
                          : "bg-muted-area/40 border-border-theme hover:bg-muted-area"
                      }`}
                    >
                      {p.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-wider">
                          लोकप्रिय छनोट
                        </span>
                      )}

                      <div className="space-y-2">
                        <h3 className="font-black text-card-foreground text-base">{p.title}</h3>
                        <div className="text-2xl font-black text-primary font-mono">{p.price}<span className="text-xs text-muted-text font-normal">/महिना</span></div>
                        <p className="text-xs text-muted-text">{p.desc}</p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-border-theme/40 text-xs text-card-foreground">
                        {p.features.map((feat, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Check size={12} className="text-emerald-500" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SUMMARY BOX */}
              <div className="p-4 rounded-2xl bg-muted-area/60 border border-border-theme text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-card-foreground block">छनोट भएको Workspace Summary:</span>
                  <p className="text-muted-text mt-0.5">
                    संस्था: <span className="font-bold text-card-foreground">{name || "नयाँ टेनान्ट"}</span> • Subdomain: <span className="font-mono text-primary font-bold">{subdomain}.sutraos.np</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-text block uppercase font-bold">मासिक लागत</span>
                  <span className="font-mono font-black text-emerald-600 text-sm">
                    {plan === "starter" ? "रू २५,०००" : plan === "institutional" ? "रू ४५,०००" : "रू १,२०,०००"}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="px-5 py-3 rounded-2xl bg-muted-area hover:bg-border-theme text-muted-text font-bold text-xs"
                >
                  पछाडि
                </button>
                <button
                  disabled={isDeploying}
                  onClick={handleCompleteOnboarding}
                  className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
                >
                  {isDeploying ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Workspace तैनाथ हुँदैछ...
                    </>
                  ) : (
                    <>
                      <Rocket size={18} /> Workspace तैनाथ गर्नुहोस्
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

        </div>

      </main>

      <Footer />
    </div>
  );
}
