import React from "react";
import { Link } from "react-router-dom";
import { Clock, ShieldCheck, MapPin, BookOpen, ChevronRight, Sparkles, ExternalLink } from "lucide-react";
import type { StoryMilestone, KnowledgeNode } from "@/src/types";

interface KnowledgeTimelineProps {
  milestones: StoryMilestone[];
  knowledgeNodes?: KnowledgeNode[];
  className?: string;
}

export default function KnowledgeTimeline({ milestones, knowledgeNodes = [], className = "" }: KnowledgeTimelineProps) {
  if (!milestones || milestones.length === 0) {
    return (
      <div className={`p-6 text-center text-xs text-muted-text bg-muted-area/30 rounded-2xl border border-border-theme ${className}`}>
        घट्नाक्रम टाइमलाइन उपलब्ध छैन।
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between border-b border-border-theme pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary text-white">
            <Clock size={16} />
          </div>
          <div>
            <h3 className="text-sm font-black text-card-foreground">
              ज्ञान टाइमलाइन (Knowledge & Story Timeline)
            </h3>
            <p className="text-[10px] text-muted-text">
              ऐतिहासिक सन्दर्भ, प्रमाणीकृत निर्णयहरू र निरन्तर घटनाक्रम
            </p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase">
          {milestones.length} माइलस्टोन
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border-theme">
        {milestones.map((ms, idx) => {
          // Find matching Knowledge Node if referenced
          const matchedNode = knowledgeNodes.find(n => 
            n.nameNepali.toLowerCase().includes(ms.title.toLowerCase()) || 
            ms.summary.toLowerCase().includes(n.nameNepali.toLowerCase())
          );

          return (
            <div key={ms.id || idx} className="relative group">
              {/* Timeline Marker Dot */}
              <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-card shadow-sm group-hover:scale-125 transition-transform" />

              <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm hover:border-primary/40 transition-all space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-text font-bold">
                  <span className="flex items-center gap-1 text-primary font-mono">
                    <Clock size={12} /> {ms.date}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-muted-area text-foreground font-black uppercase">
                    {ms.type}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-card-foreground group-hover:text-primary transition-colors">
                  {ms.title}
                </h4>

                <p className="text-xs text-muted-text leading-relaxed">
                  {ms.summary}
                </p>

                {/* Linked Knowledge Context Badge if matched */}
                {matchedNode && (
                  <div className="pt-2 border-t border-border-theme/60 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <BookOpen size={12} /> {matchedNode.nameNepali} ({matchedNode.type})
                    </span>
                    <Link to={`/knowledge?entity=${matchedNode.id}`} className="text-primary hover:underline font-bold flex items-center gap-0.5">
                      नलेज ग्राफ <ChevronRight size={10} />
                    </Link>
                  </div>
                )}

                {/* Link to article if present */}
                {ms.articleId && (
                  <div className="pt-1">
                    <Link
                      to={`/article/${ms.articleId}`}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      सम्बन्धित समाचार हेर्नुहोस् <ExternalLink size={10} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
