import React, { useState } from "react";
import { KnowledgeArticle, KNOWLEDGE_BASE_ARTICLES } from "./TrainingData";
import { 
  BookOpen, 
  Search, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Tag,
  ArrowRight
} from "lucide-react";

interface KnowledgeBaseSectionProps {
  searchQuery: string;
  onSelectTrackBySlug?: (trackId: string) => void;
}

const CATEGORIES = [
  "All Articles",
  "Getting Started",
  "AI Newsroom",
  "MediaOS",
  "SGIS",
  "Commerce",
  "Governance",
  "Admin & Telemetry",
  "Troubleshooting"
];

export default function KnowledgeBaseSection({
  searchQuery,
  onSelectTrackBySlug
}: KnowledgeBaseSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All Articles");
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);

  const filteredArticles = KNOWLEDGE_BASE_ARTICLES.filter(art => {
    const matchesCategory = selectedCategory === "All Articles" || art.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesQuery = 
      art.title.toLowerCase().includes(query) ||
      art.titleNepali.includes(query) ||
      art.summary.toLowerCase().includes(query) ||
      art.tags.some(t => t.toLowerCase().includes(query)) ||
      art.steps.some(s => s.toLowerCase().includes(query));

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-6">
      
      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? "bg-primary text-white shadow-sm"
                : "bg-card dark:bg-zinc-900 border border-border-theme dark:border-zinc-800 text-muted-text hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles Count & Status */}
      <div className="flex items-center justify-between text-xs text-muted-text font-bold">
        <span>Showing {filteredArticles.length} documentation articles</span>
        <span>Standard Operating Procedures (SOPs)</span>
      </div>

      {/* Articles Grid / List */}
      <div className="space-y-4">
        {filteredArticles.map((article) => {
          const isExpanded = expandedArticleId === article.id;

          return (
            <div 
              key={article.id}
              className="bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-2xl p-6 transition-all shadow-sm hover:border-primary/40"
            >
              <div 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                onClick={() => setExpandedArticleId(isExpanded ? null : article.id)}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted-area dark:bg-zinc-900 text-muted-text border border-border-theme dark:border-zinc-800">
                      {article.category}
                    </span>
                    <span className="text-xs font-bold text-primary">
                      {article.titleNepali}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-foreground dark:text-white">
                    {article.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-text dark:text-zinc-400">
                    {article.summary}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {isExpanded ? "Hide SOP Guide" : "View SOP Guide"}
                  </span>
                  <ChevronRight 
                    size={18} 
                    className={`text-primary transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`} 
                  />
                </div>
              </div>

              {/* Expanded Step-by-Step SOP Breakdown */}
              {isExpanded && (
                <div className="mt-6 pt-6 border-t border-border-theme dark:border-zinc-800 space-y-6">
                  
                  {/* Step List */}
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-3">
                      Standard Operational Procedure (SOP Steps)
                    </span>
                    <div className="space-y-2.5">
                      {article.steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-foreground dark:text-zinc-300 bg-muted-area/40 dark:bg-zinc-900/50 p-3 rounded-xl border border-border-theme/60 dark:border-zinc-800/60">
                          <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-snug">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Troubleshooting Tips */}
                  {article.troubleshootingTips && article.troubleshootingTips.length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        <AlertTriangle size={14} />
                        <span>Troubleshooting & Failure Resolution</span>
                      </div>
                      <ul className="space-y-1.5 pl-5 list-disc text-xs">
                        {article.troubleshootingTips.map((tip, idx) => (
                          <li key={idx} className="leading-relaxed">{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tags and Link to Related Track */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <div className="flex flex-wrap gap-1.5">
                      {article.tags.map((tag, idx) => (
                        <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted-area dark:bg-zinc-900 text-muted-text">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {article.relatedTrackId && onSelectTrackBySlug && (
                      <button
                        onClick={() => onSelectTrackBySlug(article.relatedTrackId!)}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Go to related training track</span>
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </div>

                </div>
              )}
            </div>
          );
        })}

        {filteredArticles.length === 0 && (
          <div className="text-center py-12 bg-card dark:bg-slate-950 border border-border-theme dark:border-zinc-800 rounded-3xl p-8">
            <HelpCircle size={36} className="mx-auto text-muted-text mb-3" />
            <h4 className="text-base font-black text-foreground dark:text-white">No documentation found</h4>
            <p className="text-xs text-muted-text mt-1">Try adjusting your search query or selecting "All Articles".</p>
          </div>
        )}
      </div>

    </div>
  );
}
