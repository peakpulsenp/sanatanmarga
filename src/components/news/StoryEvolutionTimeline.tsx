import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  GitCommit, 
  Clock, 
  Bell, 
  BellRing, 
  Share2, 
  ShieldCheck, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Layers
} from "lucide-react";
import type { StorylineArc, StoryMilestone } from "@/src/types";
import { StoryEvolutionEngine } from "@/src/services/storyEvolutionEngine";
import { SEED_KNOWLEDGE_NODES } from "@/src/services/knowledgeGraphService";

interface StoryEvolutionTimelineProps {
  storyline: StorylineArc;
  currentArticleId?: string;
  onShare?: () => void;
}

export const StoryEvolutionTimeline: React.FC<StoryEvolutionTimelineProps> = ({
  storyline,
  currentArticleId,
  onShare
}) => {
  const [isFollowing, setIsFollowing] = useState<boolean>(() => 
    StoryEvolutionEngine.isFollowingStory(storyline.id)
  );
  const [subscriberCount, setSubscriberCount] = useState<number>(storyline.subscriberCount || 1200);

  const handleToggleFollow = () => {
    const nextState = StoryEvolutionEngine.toggleFollowStory(storyline.id);
    setIsFollowing(nextState);
    setSubscriberCount(prev => prev + (nextState ? 1 : -1));
  };

  // Find linked entities
  const linkedNodes = SEED_KNOWLEDGE_NODES.filter(n => storyline.entityIds?.includes(n.id));

  const getMilestoneBadge = (type: StoryMilestone["type"]) => {
    switch (type) {
      case "breaking":
        return <span className="bg-red-500/10 text-red-600 border border-red-200 dark:border-red-800 text-xs px-2 py-0.5 rounded-full font-medium">ताजा अपडेट</span>;
      case "policy_announcement":
        return <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-800 text-xs px-2 py-0.5 rounded-full font-medium">सरकारी निर्णय</span>;
      case "committee_decision":
        return <span className="bg-blue-500/10 text-blue-600 border border-blue-200 dark:border-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">संसदीय समिति</span>;
      case "court_order":
        return <span className="bg-purple-500/10 text-purple-600 border border-purple-200 dark:border-purple-800 text-xs px-2 py-0.5 rounded-full font-medium">अदालती आदेश</span>;
      case "public_protest":
        return <span className="bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-800 text-xs px-2 py-0.5 rounded-full font-medium">सार्वजनिक प्रतिक्रिया</span>;
      default:
        return <span className="bg-stone-500/10 text-stone-600 border border-stone-200 dark:border-stone-800 text-xs px-2 py-0.5 rounded-full font-medium">तथ्य संकलन</span>;
    }
  };

  return (
    <div id="story-evolution-timeline-container" className="my-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.03] to-surface p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary text-white tracking-wide uppercase">
              <Sparkles className="w-3 h-3" />
              Story Evolution
            </span>
            {storyline.status === "developing" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                <Clock className="w-3 h-3 animate-spin" />
                विकास भइरहेको घटनाक्रम
              </span>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-foreground font-display leading-snug">
            {storyline.titleNepali}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            {storyline.summaryNepali}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleToggleFollow}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
              isFollowing
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-surface border border-border hover:bg-muted text-foreground"
            }`}
            title="Follow this storyline to get timeline notifications"
          >
            {isFollowing ? (
              <>
                <BellRing className="w-3.5 h-3.5 text-white animate-bounce" />
                <span>फलो गरियो ({subscriberCount})</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5 text-primary" />
                <span>स्टोरी फलो गर्नुहोस् ({subscriberCount})</span>
              </>
            )}
          </button>
          {onShare && (
            <button
              onClick={onShare}
              className="p-2 rounded-xl border border-border bg-surface hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Share Timeline"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Linked Knowledge Graph Entities */}
      {linkedNodes.length > 0 && (
        <div className="pt-3 pb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground inline-flex items-center gap-1">
            <Layers className="w-3 h-3" /> सम्बद्ध निकाय र पात्रहरू:
          </span>
          {linkedNodes.map(node => (
            <Link
              key={node.id}
              to={`/knowledge?node=${node.id}`}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-surface border border-border hover:border-primary/50 text-foreground font-medium transition-colors hover:text-primary"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {node.nameNepali}
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}

      {/* Chronological Timeline */}
      <div className="relative mt-5 pl-4 sm:pl-6 border-l-2 border-primary/20 space-y-6">
        {storyline.milestones.map((milestone, idx) => {
          const isLatest = idx === storyline.milestones.length - 1;
          const isCurrentArticle = milestone.articleId && milestone.articleId === currentArticleId;

          return (
            <div key={milestone.id} className="relative group">
              {/* Timeline Dot */}
              <div 
                className={`absolute -left-[23px] sm:-left-[31px] top-1 w-4 h-4 rounded-full border-2 transition-transform duration-200 ${
                  isLatest
                    ? "bg-primary border-white dark:border-surface-card ring-4 ring-primary/20 scale-110"
                    : "bg-surface-card border-primary/40 group-hover:border-primary"
                }`}
              />

              {/* Milestone Content Box */}
              <div className={`p-4 rounded-xl border transition-all ${
                isCurrentArticle 
                  ? "bg-primary/5 border-primary/40 shadow-sm"
                  : "bg-surface/80 border-border/80 hover:border-border hover:bg-surface"
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary tracking-wide">
                      {milestone.date}
                    </span>
                    {getMilestoneBadge(milestone.type)}
                  </div>
                  {milestone.verified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheck className="w-3 h-3" /> प्रमाणित
                    </span>
                  )}
                </div>

                <h4 className="text-sm sm:text-base font-bold text-foreground mb-1">
                  {milestone.title}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {milestone.summary}
                </p>

                {milestone.sourceLabel && (
                  <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <span className="italic">स्रोत: {milestone.sourceLabel}</span>
                    {milestone.sourceUrl && (
                      <a
                        href={milestone.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                      >
                        आधिकारिक दस्तावेज <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Insight */}
      <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span>सनातन मार्ग न्युजरुम ओएस (Story Evolution Engine) द्वारा स्वचालित ट्र्याकिङ</span>
        </div>
        <Link
          to="/storylines"
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
        >
          सबै विकास भइरहेका शृङ्खलाहरू हेर्नुहोस्
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
