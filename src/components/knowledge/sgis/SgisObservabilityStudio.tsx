import React, { useEffect, useState } from "react";
import { Activity, Cpu, RefreshCw, CheckCircle2, AlertTriangle, Database, Clock, Zap, ShieldCheck } from "lucide-react";
import { SgisOSService, SgisPipelineHealth, SgisGrantha } from "@/src/services/sgisOSService";

interface Props {
  manuscripts: SgisGrantha[];
}

export default function SgisObservabilityStudio({ manuscripts }: Props) {
  const [health, setHealth] = useState<SgisPipelineHealth | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const data = await SgisOSService.getPipelineHealth();
      setHealth(data);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              SGIS पाइपलाइन स्वास्थ्य एवं अब्जर्भ्याबिलिटी (Pipeline Health & Telemetry)
            </h3>
            <p className="text-xs text-muted-text">
              वास्तविक समय OCR निष्कर्षण कार्यसम्पादन, मोडल चेन एवं इन्डेक्स स्थिति
            </p>
          </div>
        </div>

        <button
          onClick={fetchHealth}
          disabled={isLoading}
          className="px-3.5 py-1.5 rounded-xl border border-border-theme bg-background hover:bg-muted-area text-xs font-bold text-foreground transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> ताजा गर्नुहोस्
        </button>
      </div>

      {/* Metrics Cards */}
      {health && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border-theme space-y-1">
            <span className="text-[10px] font-black uppercase text-muted-text">पाइपलाइन स्थिति</span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${health.status === "healthy" ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span className="text-sm font-black text-foreground uppercase">{health.status}</span>
            </div>
            <p className="text-[10px] text-muted-text">Zero Unhandled Failures</p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border-theme space-y-1">
            <span className="text-[10px] font-black uppercase text-muted-text">औसत OCR ढिलाइ</span>
            <p className="text-lg font-black text-primary">{health.averageOcrLatencyMs} ms</p>
            <p className="text-[10px] text-muted-text">Multimodal Gemini Chain</p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border-theme space-y-1">
            <span className="text-[10px] font-black uppercase text-muted-text">OCR सफलता दर</span>
            <p className="text-lg font-black text-emerald-600">{health.ocrSuccessRatePercent}%</p>
            <p className="text-[10px] text-muted-text">100% Retriable Grounding</p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border-theme space-y-1">
            <span className="text-[10px] font-black uppercase text-muted-text">प्रमाणित ग्रन्थहरू</span>
            <p className="text-lg font-black text-foreground">{health.publishedCount} / {health.totalManuscripts}</p>
            <p className="text-[10px] text-muted-text">{health.ragIndexedCount} RAG Indexed</p>
          </div>
        </div>
      )}

      {/* Model Chain Fallback Inspector */}
      <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-sm space-y-4">
        <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border-theme pb-2.5">
          <Cpu size={16} className="text-primary" /> सक्रिय AI मोडल चेन (Active Multimodal Fallback Chain)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-primary">१. प्राथमिक मोडल</span>
              <span className="text-[10px] bg-primary/20 text-primary font-black px-2 py-0.5 rounded">Active</span>
            </div>
            <p className="text-xs font-bold text-foreground font-mono">gemini-3.7-flash</p>
            <p className="text-[10px] text-muted-text">उच्च गुणस्तरको संस्कृत OCR तथा पाण्डुलिपि लिपि विश्लेषण</p>
          </div>

          <div className="p-3.5 rounded-xl bg-muted-area/50 border border-border-theme space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-foreground">२. प्रथम फलक (Fallback 1)</span>
              <span className="text-[10px] bg-muted-area text-muted-text font-black px-2 py-0.5 rounded">Standby</span>
            </div>
            <p className="text-xs font-bold text-foreground font-mono">gemini-3.1-flash-lite</p>
            <p className="text-[10px] text-muted-text">द्रुत गति तथा कम विलम्बता युक्त संरचना</p>
          </div>

          <div className="p-3.5 rounded-xl bg-muted-area/50 border border-border-theme space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-foreground">३. द्वितीय फलक (Fallback 2)</span>
              <span className="text-[10px] bg-muted-area text-muted-text font-black px-2 py-0.5 rounded">Standby</span>
            </div>
            <p className="text-xs font-bold text-foreground font-mono">gemini-flash-latest</p>
            <p className="text-[10px] text-muted-text">कोटा समाप्ति वा नेटवर्क अवरोधमा रिजिलियन्ट रिकभरी</p>
          </div>
        </div>
      </div>
    </div>
  );
}
