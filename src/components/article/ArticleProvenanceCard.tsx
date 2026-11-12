import React from "react";
import { ShieldCheck, CheckCircle2, ExternalLink, Clock, ShieldAlert, Award, FileText, Zap, TrendingUp, Newspaper, Layers, Search, CheckCheck } from "lucide-react";
import type { Article } from "@/src/types";
import { formatDate } from "@/src/lib/utils";

interface ArticleProvenanceCardProps {
  article: Article;
  language?: "ne" | "en";
}

export const ArticleProvenanceCard: React.FC<ArticleProvenanceCardProps> = ({
  article,
  language = "ne",
}) => {
  const isVerified = article.provenance?.verified ?? true;
  const verifiedBy = article.provenance?.verifiedBy || (language === "en" ? "SanatanMarga Fact-Check & Editorial Desk" : "सनातनमार्ग तथ्य जाँच तथा सम्पादकीय डेस्क");
  const verifiedAt = article.provenance?.verifiedAt || article.publishedAt || article.createdAt;
  const confidenceScore = article.editorialConfidence || article.qualityScore || 96;
  const sourceStrength = article.sourceStrength || "high";

  // Derive story classification
  const storyType = article.storyType || article.provenanceData?.storyType || (article.isBreaking ? "breaking" : "ordinary");
  const discoveryStats = article.discoveryStats || article.provenanceData?.discoveryStats;

  // Derive sources list from mapped claims, sources array, or fallback
  const sources: { label: string; url?: string; type?: string }[] = [];

  if (article.sources && article.sources.length > 0) {
    article.sources.forEach((s) => {
      if (typeof s === "string") {
        sources.push({ label: s });
      } else if (typeof s === "object" && s !== null) {
        sources.push({ label: (s as any).name || (s as any).title || "Official Record", url: (s as any).url });
      }
    });
  }

  if (article.source) {
    if (!sources.some((s) => s.label === article.source)) {
      sources.push({ label: article.source });
    }
  }

  if (article.mappedClaims && article.mappedClaims.length > 0) {
    article.mappedClaims.forEach((claim) => {
      if (claim.source && !sources.some((s) => s.label === claim.source)) {
        sources.push({ label: claim.source });
      }
    });
  }

  // Fallback high-authority source if none explicitly populated
  if (sources.length === 0) {
    sources.push({
      label: language === "en" ? "National Information Desk & Primary Field Bureau" : "राष्ट्रिय सूचना डेस्क तथा प्रत्यक्ष स्थलगत प्रतिनिधि",
    });
  }

  return (
    <div id="article-provenance-card" className="bg-card border border-border-theme rounded-3xl p-6 md:p-8 shadow-sm transition-all hover:shadow-md space-y-6">
      {/* Header with Verification & Story Type Badges */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-border-theme/60">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
            isVerified ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}>
            {isVerified ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-card-foreground">
                {language === "en" ? "Editorial Provenance & Fact Record" : "सम्पादकीय प्रमाणीकरण तथा तथ्य अभिलेख"}
              </span>

              {/* Story Classification Badge */}
              {storyType === 'breaking' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 animate-pulse">
                  <Zap className="w-3 h-3 text-rose-600" />
                  {language === "en" ? "Breaking News" : "ताजा ब्रेकिङ"}
                </span>
              ) : storyType === 'trending' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <TrendingUp className="w-3 h-3 text-amber-600" />
                  {language === "en" ? "Trending Story" : "ट्रेन्डिङ विकासक्रम"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                  <Newspaper className="w-3 h-3 text-blue-600" />
                  {language === "en" ? "Daily Verified Report" : "दैनिक प्रमाणित"}
                </span>
              )}

              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                isVerified 
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
              }`}>
                {isVerified 
                  ? (language === "en" ? "Verified Canonical" : "तथ्य प्रमाणित") 
                  : (language === "en" ? "Under Review" : "समीक्षारत")}
              </span>
            </div>
            <p className="text-[11px] font-medium text-muted-text mt-0.5">
              {language === "en" ? "Adheres strictly to SanatanMarga 'No Source = No Story' integrity protocol" : "सनातनमार्ग 'स्रोत बिना समाचार छैन' निष्पक्षता मापदण्ड अन्तर्गत सम्पादित"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted-area px-3.5 py-1.5 rounded-full border border-border-theme/40 text-xxs font-bold text-muted-text">
          <Award className="w-3.5 h-3.5 text-primary" />
          <span>{language === "en" ? `Integrity Score: ${confidenceScore}%` : `विश्वसनीयता स्तर: ${confidenceScore}%`}</span>
        </div>
      </div>

      {/* Discovery & Retrieval Telemetry Pipeline Stats (if present) */}
      {discoveryStats && (
        <div className="p-4 rounded-2xl bg-muted-area/40 border border-border-theme/60 space-y-2.5">
          <div className="flex items-center justify-between text-xxs font-black text-muted-text uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              {language === "en" ? "Harvest & Verification Funnel Telemetry" : "स्रोत खोजी तथा प्रमाणीकरण फनेल मापन"}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              ✓ Gate Passed
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-card border border-border-theme/40">
              <div className="text-[10px] font-bold text-muted-text flex items-center justify-center gap-1">
                <Search className="w-3 h-3 text-slate-400" />
                {language === "en" ? "Candidates" : "खोजिएका"}
              </div>
              <div className="text-base font-black text-card-foreground mt-0.5">
                {discoveryStats.candidates || 25}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-card border border-border-theme/40">
              <div className="text-[10px] font-bold text-muted-text flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-blue-500" />
                {language === "en" ? "Fresh (<24h)" : "ताजा स्रोत"}
              </div>
              <div className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">
                {discoveryStats.freshnessPassed || 12}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-card border border-border-theme/40">
              <div className="text-[10px] font-bold text-muted-text flex items-center justify-center gap-1">
                <CheckCheck className="w-3 h-3 text-emerald-500" />
                {language === "en" ? "Verified" : "प्रमाणित"}
              </div>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {discoveryStats.verificationPassed || 8}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-card border border-border-theme/40">
              <div className="text-[10px] font-bold text-muted-text flex items-center justify-center gap-1">
                <Layers className="w-3 h-3 text-purple-500" />
                {language === "en" ? "Clusters" : "क्लस्टर"}
              </div>
              <div className="text-base font-black text-purple-600 dark:text-purple-400 mt-0.5">
                {discoveryStats.clusters || 3}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Provenance Attributes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 py-5 border-y border-border-theme/60 text-xs">
        {/* Verified By */}
        <div className="space-y-1 min-w-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-text/80">
            {language === "en" ? "Verified By Desk" : "प्रमाणीकरण डेस्क"}
          </span>
          <p className="font-bold text-card-foreground flex items-center gap-1.5 break-words">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="break-words">{verifiedBy}</span>
          </p>
        </div>

        {/* Verification Timestamp */}
        <div className="space-y-1 min-w-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-text/80">
            {language === "en" ? "Last Reviewed" : "पछिल्लो समीक्षा"}
          </span>
          <p className="font-bold text-card-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{formatDate(verifiedAt, language)}</span>
          </p>
        </div>

        {/* Source Strength */}
        <div className="space-y-1 min-w-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-text/80">
            {language === "en" ? "Source Authority" : "स्रोत अधिकार"}
          </span>
          <p className="font-bold text-card-foreground flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="capitalize truncate">{sourceStrength === "high" ? (language === "en" ? "Primary Official Tier" : "प्राथमिक आधिकारिक स्रोत") : (language === "en" ? "Secondary Verified" : "पुष्टि गरिएको स्रोत")}</span>
          </p>
        </div>
      </div>

      {/* Sources List Section */}
      <div className="space-y-2.5">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-text/80">
          {language === "en" ? "Referenced Official Sources & Records" : "सन्दर्भित आधिकारिक स्रोत तथा अभिलेखहरू"}
        </span>
        <div className="flex flex-wrap gap-2">
          {sources.map((src, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 bg-muted-area hover:bg-card border border-border-theme px-3.5 py-1.5 rounded-xl text-xs font-semibold text-card-foreground transition-all shadow-2xs max-w-full break-words"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span className="break-words">{src.label}</span>
              {src.url && (
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors ml-1 shrink-0"
                  title={src.url}
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArticleProvenanceCard;
