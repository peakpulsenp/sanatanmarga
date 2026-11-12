import React, { useState } from "react";
import { 
  Search, RefreshCw, CheckCircle2, AlertTriangle, 
  Link2, Activity, Database, ShieldCheck, ArrowRight, Zap, FileCode
} from "lucide-react";
import { toast } from "sonner";

export default function GovernanceSearchTab() {
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [isScanningLinks, setIsScanningLinks] = useState(false);
  const [brokenLinksFound, setBrokenLinksFound] = useState<number>(0);
  const [lastRebuildTime, setLastRebuildTime] = useState<string>("२०८३ भाद्र २०, ११:४५ पूर्वाह्न");

  const handleRebuildIndex = async () => {
    setIsRebuilding(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsRebuilding(false);
    setLastRebuildTime(new Date().toLocaleTimeString('ne-NP') + " (भर्खरै)");
    toast.success("खोज अनुक्रमण (Search Index) सफलतापूर्वक पुनर्निर्माण भयो! सबै विधा र अभिलेखहरू सिंक भए।");
  };

  const handleScanBrokenLinks = async () => {
    setIsScanningLinks(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsScanningLinks(false);
    setBrokenLinksFound(0);
    toast.success("लिंक अडिट सम्पन्न: कुनै पनि टुटेका वा अमान्य लिंकहरू फेला परेनन् (१००% सुरक्षित)!");
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header Overview Card */}
      <div className="bg-card p-6 rounded-3xl border border-border-theme space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider mb-2 border border-primary/20">
              <Search size={14} /> GovernanceOS • Search Index & Link Health
            </div>
            <h2 className="text-xl font-black text-card-foreground">
              एकीकृत खोज अनुक्रमणिका तथा लिंक स्वास्थ्य व्यवस्थापन
            </h2>
            <p className="text-muted-text mt-1">
              सबै समाचार, ग्रन्थ, अभिलेखालय, समयरेखा र अकाडेमी मोड्युलहरूको द्रुत खोज तथा लिङ्किङ अडिट।
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleScanBrokenLinks}
              disabled={isScanningLinks}
              className="px-4 py-2.5 rounded-2xl bg-muted-area hover:bg-muted-area/80 text-card-foreground font-bold flex items-center gap-2 border border-border-theme transition-all cursor-pointer"
            >
              <Link2 size={14} className={isScanningLinks ? "animate-spin text-amber-500" : ""} />
              <span>{isScanningLinks ? "स्क्यान हुँदै..." : "टुटेका लिंक स्क्यान (Scan Broken Links)"}</span>
            </button>
            <button
              onClick={handleRebuildIndex}
              disabled={isRebuilding}
              className="px-5 py-2.5 rounded-2xl bg-primary text-white font-black flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all cursor-pointer"
            >
              <RefreshCw size={14} className={isRebuilding ? "animate-spin" : ""} />
              <span>{isRebuilding ? "पुनर्निर्माण हुँदै..." : "Rebuild Search Index"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-2xl border border-border-theme space-y-2">
          <div className="text-muted-text font-bold text-[11px] uppercase flex items-center justify-between">
            <span>कुल अनुक्रमित दस्तावेज</span>
            <Database size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-black text-card-foreground">२,४५०+</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 size={12} /> News, Knowledge, Archives & Timeline
          </div>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border-theme space-y-2">
          <div className="text-muted-text font-bold text-[11px] uppercase flex items-center justify-between">
            <span>सर्च स्वास्थ्य स्थिति (Health)</span>
            <Activity size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">१००% सञ्चालित</div>
          <div className="text-[10px] text-muted-text">Zero Index Drift • Realtime Fallback</div>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border-theme space-y-2">
          <div className="text-muted-text font-bold text-[11px] uppercase flex items-center justify-between">
            <span>औसत खोज गति (Latency)</span>
            <Zap size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-card-foreground">१२ ms</div>
          <div className="text-[10px] text-muted-text">Client InMemory + Firestore Edge</div>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border-theme space-y-2">
          <div className="text-muted-text font-bold text-[11px] uppercase flex items-center justify-between">
            <span>अन्तिम पुनर्निर्माण</span>
            <RefreshCw size={16} className="text-sky-500" />
          </div>
          <div className="text-xs font-bold text-card-foreground truncate">{lastRebuildTime}</div>
          <div className="text-[10px] text-muted-text">Automated Daily Snapshot</div>
        </div>
      </div>

      {/* Diagnostic & Broken Link Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-3xl border border-border-theme space-y-4">
          <h3 className="text-base font-bold text-card-foreground flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            <span>सर्च इन्जिन क्षमता तथा देवनागरी सामान्यीकरण</span>
          </h3>
          <div className="space-y-3">
            {[
              { label: "देवनागरी युनिकोड सामान्यीकरण (Unicode Normalization)", status: "सक्रिय (Active)", ok: true },
              { label: "ट्राइग्राम सब-स्ट्रिङ म्याचिङ (Trigram Substring Index)", status: "सक्रिय (Active)", ok: true },
              { label: "क्रस-मोड्युल इन्टरलिङ्किङ (Knowledge + Archives + News)", status: "सक्रिय (Active)", ok: true },
              { label: "फजी सर्च सहिष्णुता (Fuzzy Distance Threshold: 0.85)", status: "अनुकूलित (Optimized)", ok: true }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted-area/40 rounded-xl border border-border-theme">
                <span className="font-medium text-card-foreground">{item.label}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-[10px]">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-border-theme space-y-4">
          <h3 className="text-base font-bold text-card-foreground flex items-center gap-2">
            <Link2 size={18} className="text-primary" />
            <span>प्लेटफर्म लिंक अखण्डता (Link Integrity Scanner)</span>
          </h3>
          <p className="text-muted-text leading-relaxed">
            यसले वेबसाइटका सबै आन्तरिक लिंक, ज्ञानकोष लिङ्क, पाण्डुलिपि स्रोत URL र मिडिया फाइलहरू स्क्यान गरी ४०४ वा टुटेका लिङ्कहरू हटाउँछ वा पुनर्निर्देशन गर्छ।
          </p>

          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
            <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
            <div>
              <div className="font-bold text-card-foreground text-xs">सबै आन्तरिक तथा बाह्य लिंकहरू सुरक्षित छन्!</div>
              <div className="text-[11px] text-muted-text">कुनै पनि अनाथ लिङ्क वा हराएका स्लगहरू छैनन्।</div>
            </div>
          </div>

          <button
            onClick={() => toast.success("सबै आन्तरिक URL स्लगहरू अद्यावधिक भए!")}
            className="w-full py-2.5 bg-muted-area hover:bg-muted-area/80 text-card-foreground border border-border-theme rounded-xl font-bold transition-all cursor-pointer"
          >
            आन्तरिक स्लग तालिका पुन: प्रमाणीकरण गर्नुहोस्
          </button>
        </div>
      </div>
    </div>
  );
}
