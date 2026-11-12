import React from "react";
import { MapPin, Navigation, ArrowRight, AlertTriangle, ShieldCheck, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import type { Article } from "@/src/types";

interface ArticleDistrictImpactProps {
  article: Article;
  language?: "ne" | "en";
}

export const ArticleDistrictImpact: React.FC<ArticleDistrictImpactProps> = ({
  article,
  language = "ne",
}) => {
  const districts = article.districts || [];
  const province = article.province || "बागमती प्रदेश";
  const municipalities = article.municipalities || [];
  const districtImpact = article.districtImpact || [];

  if (districts.length === 0 && districtImpact.length === 0 && !article.province) {
    return null;
  }

  return (
    <div id="article-district-impact" className="bg-gradient-to-br from-card to-muted-area/40 border border-border-theme rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-card-foreground">
              {language === "en" ? "Geographic & Administrative Impact" : "भौगोलिक तथा प्रशासनिक प्रभाव क्षेत्र"}
            </h3>
            <p className="text-[11px] font-medium text-muted-text">
              {language === "en" ? "Real-time territorial coverage & localized relevance" : "प्रदेश, जिल्ला तथा स्थानीय तहगत प्रभाव विष्लेषण"}
            </p>
          </div>
        </div>

        <Link
          to="/nepal-hub"
          className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3.5 py-1.5 rounded-full"
        >
          <span>{language === "en" ? "Nepal Hub" : "नेपाल हब"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Impact Zone Tags */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Province Card */}
        <div className="bg-card border border-border-theme/80 rounded-2xl p-4 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-text">
            {language === "en" ? "Primary Province" : "प्रमुख प्रदेश"}
          </span>
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-card-foreground break-words">{province}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          </div>
        </div>

        {/* Affected Districts */}
        <div className="bg-card border border-border-theme/80 rounded-2xl p-4 space-y-2 md:col-span-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-text">
            {language === "en" ? "Impacted Districts" : "सम्बन्धित जिल्लाहरू"}
          </span>
          <div className="flex flex-wrap gap-2">
            {districts.map((d) => {
              const impact = districtImpact.find((di) => di.district === d);
              const severity = impact?.severity || "normal";

              const severityBadge =
                severity === "critical"
                  ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30"
                  : severity === "moderate"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                  : "bg-primary/5 text-primary border-primary/20";

              return (
                <Link
                  key={d}
                  to={`/district/${encodeURIComponent(d)}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:scale-105 max-w-full truncate ${severityBadge}`}
                >
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{d}</span>
                  {impact?.detail && (
                    <span className="text-[10px] opacity-75 truncate">({impact.detail})</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Municipalities tag if present */}
      {municipalities.length > 0 && (
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-text">
            {language === "en" ? "Municipalities / Local Bodies:" : "स्थानीय तहहरू:"}
          </span>
          {municipalities.map((m, idx) => (
            <span
              key={idx}
              className="bg-muted-area text-card-foreground px-2.5 py-1 rounded-lg text-xxs font-bold border border-border-theme/60"
            >
              {m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArticleDistrictImpact;
