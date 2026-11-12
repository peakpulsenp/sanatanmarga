import React from "react";
import { Link } from "react-router-dom";
import { Database, Sparkles, ExternalLink, FileText, Landmark } from "lucide-react";
import { SgisReference } from "@/src/types";

interface SgisKnowledgeBoxProps {
  references: SgisReference[];
}

export const SgisKnowledgeBox: React.FC<SgisKnowledgeBoxProps> = ({ references }) => {
  if (!references || references.length === 0) return null;

  return (
    <div className="my-6 p-5 bg-gradient-to-r from-primary/5 via-card-bg to-muted-area border border-primary/20 rounded-[var(--sm-radius,12px)]">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
        <Database className="w-4 h-4" />
        <span>Saraswati Knowledge & Manuscript Integration (SGIS)</span>
      </div>

      <p className="text-xs text-muted-text mb-4">
        This article connects directly to authoritative manuscript folios and civilizational knowledge nodes preserved in the Saraswati Global Information System.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {references.map((ref, idx) => (
          <Link
            key={idx}
            to={ref.deepLink || `/sgis?entity=${encodeURIComponent(ref.entityId || ref.title)}`}
            className="group flex items-start justify-between p-3 bg-card-bg border border-border-theme/60 rounded-lg hover:border-primary/50 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="p-2 rounded bg-primary/10 text-primary mt-0.5">
                {ref.entityType === "temple" ? <Landmark className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-main-text group-hover:text-primary transition-colors truncate">
                  {ref.title}
                </div>
                {ref.titleNe && (
                  <div className="text-xxs text-muted-text truncate">{ref.titleNe}</div>
                )}
                {ref.manuscriptNumber && (
                  <div className="text-xxs font-mono text-primary/80 mt-1">
                    MS: {ref.manuscriptNumber}
                  </div>
                )}
              </div>
            </div>

            <ExternalLink className="w-3.5 h-3.5 text-muted-text group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
          </Link>
        ))}
      </div>
    </div>
  );
};
