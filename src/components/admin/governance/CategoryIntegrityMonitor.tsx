import React from "react";
import { AlertTriangle, Tag, CheckCircle2, ShieldAlert, Wrench } from "lucide-react";

interface CategoryIntegrityMonitorProps {
  missingCategoryCount: number;
  legacyCategoryCount: number;
  unknownCategoryCount: number;
  onAutoFixCategories?: () => void;
  isFixing?: boolean;
}

export default function CategoryIntegrityMonitor({
  missingCategoryCount,
  legacyCategoryCount,
  unknownCategoryCount,
  onAutoFixCategories,
  isFixing = false
}: CategoryIntegrityMonitorProps) {
  const totalCategoryIssues = missingCategoryCount + legacyCategoryCount + unknownCategoryCount;
  const isHealthy = totalCategoryIssues === 0;

  return (
    <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-theme pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-primary" />
            <h3 className="text-sm font-black text-card-foreground uppercase tracking-wider">
              Category Integrity Monitor (विधा निष्ठा मनिटर)
            </h3>
          </div>
          <p className="text-xs text-muted-text">
            गृहपृष्ठ तथा विधागत पृष्ठहरूमा समाचार हराउन नदिन क्याटगोरी म्यापिङ र स्लग शुद्धता।
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isHealthy ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 size={14} /> १००% विधागत निष्ठा प्रमाणित
            </span>
          ) : (
            <button
              onClick={onAutoFixCategories}
              disabled={isFixing}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Wrench size={14} />
              <span>{isFixing ? "मर्मत हुँदैछ..." : "सबै क्याटगोरी मर्मत गर्नुहोस्"}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Missing Category */}
        <div className={`p-4 rounded-2xl border transition-all ${
          missingCategoryCount > 0 
            ? "bg-rose-500/10 border-rose-500/20 text-rose-500" 
            : "bg-muted-area/40 border-border-theme text-card-foreground"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">
              Articles Missing Category
            </span>
            {missingCategoryCount > 0 ? (
              <AlertTriangle size={16} className="text-rose-500" />
            ) : (
              <CheckCircle2 size={16} className="text-emerald-500" />
            )}
          </div>
          <div className="text-2xl font-black mt-1">
            {missingCategoryCount}
          </div>
          <p className="text-[11px] text-muted-text mt-0.5">
            {missingCategoryCount > 0 ? "विधा नखुलेका समाचारहरू" : "कुनै पनि अनाथ विधा छैन"}
          </p>
        </div>

        {/* Card 2: Legacy Categories */}
        <div className={`p-4 rounded-2xl border transition-all ${
          legacyCategoryCount > 0 
            ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
            : "bg-muted-area/40 border-border-theme text-card-foreground"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">
              Articles Using Legacy Category
            </span>
            {legacyCategoryCount > 0 ? (
              <AlertTriangle size={16} className="text-amber-500" />
            ) : (
              <CheckCircle2 size={16} className="text-emerald-500" />
            )}
          </div>
          <div className="text-2xl font-black mt-1">
            {legacyCategoryCount}
          </div>
          <p className="text-[11px] text-muted-text mt-0.5">
            {legacyCategoryCount > 0 ? "पुरानो स्लग (उदा. samachar) प्रयोग" : "सबै v5.0 मानकमा आधारित"}
          </p>
        </div>

        {/* Card 3: Unknown Categories */}
        <div className={`p-4 rounded-2xl border transition-all ${
          unknownCategoryCount > 0 
            ? "bg-purple-500/10 border-purple-500/20 text-purple-500" 
            : "bg-muted-area/40 border-border-theme text-card-foreground"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">
              Articles Using Unknown Category
            </span>
            {unknownCategoryCount > 0 ? (
              <AlertTriangle size={16} className="text-purple-500" />
            ) : (
              <CheckCircle2 size={16} className="text-emerald-500" />
            )}
          </div>
          <div className="text-2xl font-black mt-1">
            {unknownCategoryCount}
          </div>
          <p className="text-[11px] text-muted-text mt-0.5">
            {unknownCategoryCount > 0 ? "प्रणालीमा सूचीकृत नभएका विधा" : "सबै सूचीकृत क्याटगोरीसँग म्याच"}
          </p>
        </div>
      </div>
    </div>
  );
}
