import React, { useState } from "react";
import { Network, GitMerge, Link2, Sparkles, CheckCircle2, ArrowRight, Layers, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function EntityRelationshipsAdmin() {
  const [sourceEntity, setSourceEntity] = useState("pashupatinath");
  const [targetEntity, setTargetEntity] = useState("kathmandu-valley");
  const [relationshipType, setRelationshipType] = useState("located_in");
  const [isMerging, setIsMerging] = useState(false);

  const handleCreateRelationship = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`सम्बन्ध कायम भयो: [${sourceEntity}] --(${relationshipType})--> [${targetEntity}]`);
  };

  const handleMergeEntities = () => {
    setIsMerging(true);
    setTimeout(() => {
      setIsMerging(false);
      toast.success("सफलतापूर्वक अस्तित्व मर्ज (Entity Merge) सम्पन्न भयो!");
    }, 800);
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border-theme shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-500 text-xs font-black uppercase tracking-wider mb-2 border border-sky-500/20">
            <Network size={14} /> Knowledge Graph • सम्बन्ध तथा मर्ज इन्जिन
          </div>
          <h2 className="text-xl md:text-2xl font-black text-card-foreground">
            ज्ञानकोष सम्बन्ध (Relationships) तथा अस्तित्व विलय (Entity Merging)
          </h2>
          <p className="text-xs md:text-sm text-muted-text">
            सभ्यतागत नोडहरू बीच द्वि-दिशात्मक सम्बन्ध स्थापना गर्नुहोस् र दोहोरिएका नोडहरूलाई मर्ज गर्नुहोस्।
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Relationship Card */}
        <div className="bg-card p-6 rounded-3xl border border-border-theme space-y-4">
          <h3 className="text-base font-bold text-card-foreground flex items-center gap-2">
            <Link2 size={16} className="text-primary" /> नयाँ ज्ञान सम्बन्ध जोड्नुहोस् (Link Graph Nodes)
          </h3>
          <form onSubmit={handleCreateRelationship} className="space-y-3">
            <div>
              <label className="block font-bold text-muted-text mb-1">Source Node ID</label>
              <input
                type="text"
                value={sourceEntity}
                onChange={e => setSourceEntity(e.target.value)}
                placeholder="e.g. pashupatinath"
                className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-muted-text mb-1">Relationship Type (सम्बन्ध प्रकार)</label>
              <select
                value={relationshipType}
                onChange={e => setRelationshipType(e.target.value)}
                className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs"
              >
                <option value="located_in">located_in (स्थान अवस्थिति)</option>
                <option value="authored_by">authored_by (रचनाकार)</option>
                <option value="associated_deity">associated_deity (सम्बद्ध देव/देवी)</option>
                <option value="historical_era">historical_era (कालखण्ड सम्बन्ध)</option>
                <option value="celebrates_festival">celebrates_festival (पर्व उत्सव)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-muted-text mb-1">Target Node ID</label>
              <input
                type="text"
                value={targetEntity}
                onChange={e => setTargetEntity(e.target.value)}
                placeholder="e.g. kathmandu-valley"
                className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:bg-primary/90"
            >
              <Sparkles size={14} /> सम्बन्ध लिंक गर्नुहोस्
            </button>
          </form>
        </div>

        {/* Entity Merging Card */}
        <div className="bg-card p-6 rounded-3xl border border-border-theme space-y-4">
          <h3 className="text-base font-bold text-card-foreground flex items-center gap-2">
            <GitMerge size={16} className="text-amber-500" /> दोहोरिएका नोड विलय (Entity Deduplication & Merge)
          </h3>
          <p className="text-muted-text leading-relaxed">
            यदि एउटै विषयमा दुई भिन्न नोड वा पर्यायवाची नामहरू सिर्जना भएका छन् भने तिनका सम्बन्धहरू, लेखहरू र खोज अनुक्रमणलाई स्वचालित रूपमा एउटै मुख्य नोडमा मर्ज गर्नुहोस्।
          </p>

          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-muted-text mb-1">Duplicate Node (मर्ज हुने)</label>
                <input
                  type="text"
                  placeholder="उदा: pashupati-nath-temple"
                  className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-muted-text mb-1">Primary Canonical Node (स्थायी)</label>
                <input
                  type="text"
                  placeholder="उदा: pashupatinath"
                  className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleMergeEntities}
              disabled={isMerging}
              className="w-full py-2.5 bg-amber-500 text-slate-950 rounded-xl font-black flex items-center justify-center gap-1.5 cursor-pointer hover:bg-amber-400 transition-all"
            >
              <RefreshCw size={14} className={isMerging ? "animate-spin" : ""} />
              <span>{isMerging ? "विलय प्रक्रिया जारी छ..." : "अस्तित्व विलय (Merge Nodes) गर्नुहोस्"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
