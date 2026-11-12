import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import SEOHead from "@/src/components/common/SEOHead";
import { 
  Sparkles, 
  Clock, 
  Layers, 
  TrendingUp, 
  Bell, 
  BellRing, 
  ChevronRight, 
  Filter, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Search
} from "lucide-react";
import { StoryEvolutionEngine, SEED_STORYLINE_ARCS } from "@/src/services/storyEvolutionEngine";
import { SEED_KNOWLEDGE_NODES } from "@/src/services/knowledgeGraphService";
import type { StorylineArc } from "@/src/types";

export default function StorylinesPage() {
  const [storylines, setStorylines] = useState<StorylineArc[]>(() => StoryEvolutionEngine.getStorylines());
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredStorylines = storylines.filter(s => {
    if (selectedCategory !== "all" && s.category !== selectedCategory) return false;
    if (selectedStatus !== "all" && s.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = s.titleNepali.toLowerCase().includes(q) || s.titleEnglish.toLowerCase().includes(q);
      const matchSummary = s.summaryNepali.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary) return false;
    }
    return true;
  });

  const handleToggleFollow = (id: string) => {
    StoryEvolutionEngine.toggleFollowStory(id);
    setStorylines([...StoryEvolutionEngine.getStorylines()]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-foreground">
      <SEOHead
        title="स्टोरी शृङ्खला तथा घटनाक्रम (Story Evolution Timeline) | सनातन मार्ग"
        description="नेपालका मुख्य राष्ट्रिय नीति, विधेयक, अर्थतन्त्र तथा सम्पदा संरक्षणसम्बन्धी घटनाक्रमको कालक्रमिक अनुगमन र नतिजा शृङ्खला।"
        url="/storylines"
      />
      <Header />

      <main className="flex-grow py-8 sm:py-12">
        <div className="container-custom max-w-6xl mx-auto px-4">
          
          {/* Header Banner */}
          <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-border">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Sanatan Marga NewsOS v3.0 • Story Evolution Engine
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-foreground">
                स्टोरी शृङ्खला तथा घटनाक्रम (Story Evolution)
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
                एउटा समाचार मात्र होइन, सुरुवाती निर्णयदेखि संसदीय बहस, कार्यान्वयन र अन्तिम परिणामसम्मको पूर्ण कालक्रमिक अनुगमन।
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 bg-surface p-3 sm:p-4 rounded-2xl border border-border shrink-0 self-center sm:self-auto">
              <div className="text-center px-2">
                <span className="block text-xl font-black text-primary">{storylines.length}</span>
                <span className="text-[11px] font-bold text-muted-foreground uppercase">सक्रिय शृङ्खला</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center px-2">
                <span className="block text-xl font-black text-emerald-600">१००%</span>
                <span className="text-[11px] font-bold text-muted-foreground uppercase">प्रमाणित स्रोत</span>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="शृङ्खला खोज्नुहोस्..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border text-xs">
                {["all", "developing", "active", "concluded"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                      selectedStatus === st ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {st === "all" ? "सबै स्थिति" : st === "developing" ? "विकासशील" : st === "active" ? "सक्रिय" : "सम्पन्न"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Storylines Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredStorylines.map((story) => {
              const isFollowing = StoryEvolutionEngine.isFollowingStory(story.id);
              const linkedNodes = SEED_KNOWLEDGE_NODES.filter(n => story.entityIds.includes(n.id));

              return (
                <div
                  key={story.id}
                  className="rounded-3xl border border-border bg-surface hover:border-primary/40 transition-all p-6 flex flex-col justify-between shadow-sm group"
                >
                  <div>
                    {/* Top Row Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {story.status === "developing" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3 animate-spin" />
                            विकास भइरहेको घटनाक्रम
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            सक्रिय अनुगमन
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          {story.milestones.length} घटनाक्रम दर्ता
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggleFollow(story.id)}
                        className={`p-2 rounded-xl text-xs transition-all ${
                          isFollowing
                            ? "bg-primary text-white"
                            : "border border-border hover:bg-muted text-muted-foreground"
                        }`}
                        title={isFollowing ? "Unfollow story" : "Follow story updates"}
                      >
                        {isFollowing ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold font-display text-foreground group-hover:text-primary transition-colors leading-snug mb-2">
                      {story.titleNepali}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                      {story.summaryNepali}
                    </p>

                    {/* Linked Knowledge Nodes */}
                    {linkedNodes.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mb-4">
                        <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                          <Layers className="w-3 h-3" /> निकाय:
                        </span>
                        {linkedNodes.map(n => (
                          <span
                            key={n.id}
                            className="text-[11px] font-medium bg-primary/5 text-primary border border-primary/20 px-2 py-0.5 rounded-md"
                          >
                            {n.nameNepali}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Latest Milestone Preview */}
                    {story.milestones.length > 0 && (
                      <div className="p-3 rounded-2xl bg-muted/50 border border-border text-xs mb-4">
                        <span className="font-bold text-primary block mb-0.5">
                          पछिल्लो अपडेट ({story.milestones[story.milestones.length - 1].date}):
                        </span>
                        <p className="text-muted-foreground line-clamp-1 font-medium">
                          {story.milestones[story.milestones.length - 1].title}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer Link */}
                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">
                      {story.subscriberCount || 1000}+ पाठकले फलो गर्दै
                    </span>
                    <Link
                      to={`/category/${story.category}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      सम्बन्धित समाचारहरू <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
