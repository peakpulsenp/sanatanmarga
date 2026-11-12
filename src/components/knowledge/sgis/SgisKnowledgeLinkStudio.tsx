import React, { useState } from "react";
import { Network, Sparkles, Plus, Trash2, Check, RefreshCw, Landmark, BookMarked, UserCheck, Calendar, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { SgisGrantha, SgisRole, SgisKnowledgeLinker, SgisKnowledgeLink, SgisOSService } from "@/src/services/sgisOSService";
import { CANONICAL_ENTITIES } from "@/src/services/knowledgeOS";

interface Props {
  selectedManuscript: SgisGrantha;
  currentRole: SgisRole;
  onManuscriptUpdated: (updated: SgisGrantha) => void;
}

export default function SgisKnowledgeLinkStudio({ selectedManuscript, currentRole, onManuscriptUpdated }: Props) {
  const [knowledgeLinks, setKnowledgeLinks] = useState<SgisKnowledgeLink[]>(
    selectedManuscript.knowledgeLinks || []
  );
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const [isLinking, setIsLinking] = useState(false);
  const [customEntityName, setCustomEntityName] = useState("");
  const [customEntityType, setCustomEntityType] = useState<any>("tradition");

  const handleAutoLinkWithKnowledgeOs = async () => {
    setIsLinking(true);
    toast.info("Knowledge OS को शास्त्रीय ग्राफसँग स्वचालित समन्वय गरिँदैछ...");

    try {
      const res = await SgisKnowledgeLinker.linkToKnowledgeGraph({
        text: selectedManuscript.originalText,
        title: selectedManuscript.titleNepali
      });

      if (res.success) {
        setKnowledgeLinks(prev => {
          const existingIds = new Set(prev.map(p => p.entityId));
          const newOnes = (res.matchedEntities || []).filter(e => !existingIds.has(e.entityId));
          return [...prev, ...newOnes];
        });
        if (res.suggestedCategories) setSuggestedCategories(res.suggestedCategories);
        toast.success(`ज्ञानकोष समन्वय सम्पन्न! ${res.matchedEntities.length} शाश्वत नोडहरू जोडियो।`);
      }
    } catch (err: any) {
      toast.error(err.message || "ज्ञानकोष समन्वयमा समस्या आयो।");
    } finally {
      setIsLinking(false);
    }
  };

  const handleAddCustomLink = () => {
    if (!customEntityName.trim()) {
      toast.error("कृपया संस्था वा पात्रको नाम प्रविष्ट गर्नुहोस्।");
      return;
    }

    const newLink: SgisKnowledgeLink = {
      entityId: `custom:${Date.now()}`,
      canonicalName: customEntityName.trim(),
      entityType: customEntityType,
      relevanceReason: "विद्वान् सम्पादकद्वारा प्रत्यक्ष प्रमाणित सम्बन्ध",
      confidence: 1.0,
      linkedAt: new Date().toISOString()
    };

    setKnowledgeLinks(prev => [...prev, newLink]);
    setCustomEntityName("");
    toast.success(`'${newLink.canonicalName}' ज्ञानकोषमा सफलतापूर्वक जोडियो।`);
  };

  const handleRemoveLink = (entityId: string) => {
    setKnowledgeLinks(prev => prev.filter(k => k.entityId !== entityId));
    toast.info("सम्बन्ध हटाइयो।");
  };

  const handleSaveKnowledgeLinks = () => {
    const updatedMs: SgisGrantha = {
      ...selectedManuscript,
      knowledgeLinks,
      auditTrail: [
        ...(selectedManuscript.auditTrail || []),
        {
          id: `aud-${Date.now()}`,
          actor: `User (${currentRole})`,
          actorRole: currentRole,
          timestamp: new Date().toLocaleString(),
          manuscriptId: selectedManuscript.id,
          version: selectedManuscript.versionHistory?.length ? selectedManuscript.versionHistory[selectedManuscript.versionHistory.length - 1].version : 1.0,
          action: "KNOWLEDGE_GRAPH_LINKED",
          reason: `Linked ${knowledgeLinks.length} canonical knowledge entities`
        }
      ]
    };

    onManuscriptUpdated(updatedMs);
    toast.success("ज्ञानकोष सम्बन्धहरू सुरक्षित भए!");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <Network size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              ज्ञानकोष समन्वय स्टुडियो (Knowledge Graph & Entity Linking)
            </h3>
            <p className="text-xs text-muted-text">
              {selectedManuscript.titleNepali} • {knowledgeLinks.length} जोडिएका नोडहरू
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoLinkWithKnowledgeOs}
            disabled={isLinking}
            className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm shadow-primary/20 cursor-pointer disabled:opacity-50"
          >
            {isLinking ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
            AI ज्ञानकोष स्वतः समन्वय (Auto-Link)
          </button>
          <button
            onClick={handleSaveKnowledgeLinks}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <Check size={14} /> सुरक्षित गर्नुहोस् (Save Links)
          </button>
        </div>
      </div>

      {/* Linked Nodes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Linked Entities (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border-theme pb-3">
              <span className="text-xs font-black text-foreground uppercase tracking-wider">
                प्रमाणित ज्ञान नोडहरू ({knowledgeLinks.length})
              </span>
              <span className="text-[10px] text-muted-text">
                Knowledge OS Entity Graph ID सँग जोडिएको
              </span>
            </div>

            {knowledgeLinks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {knowledgeLinks.map((link) => (
                  <div
                    key={link.entityId}
                    className="p-3.5 rounded-xl bg-muted-area/50 border border-border-theme flex flex-col justify-between gap-2 hover:border-primary/40 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-foreground">{link.canonicalName}</span>
                        <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                          {link.entityType}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-text leading-tight">{link.relevanceReason}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border-theme/60 text-[10px]">
                      <span className="text-emerald-600 font-black">
                        विश्वास: {Math.round(link.confidence * 100)}%
                      </span>
                      <button
                        onClick={() => handleRemoveLink(link.entityId)}
                        className="text-red-500 hover:text-red-700 font-bold transition-all cursor-pointer"
                      >
                        हटाउनुहोस्
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-muted-text">
                कुनै ज्ञानकोष नोड जोडिएको छैन। माथिको 'AI ज्ञानकोष स्वतः समन्वय' थिच्नुहोस् वा दायाँबाट म्यानुअल रूपमा थप्नुहोस्।
              </div>
            )}
          </div>
        </div>

        {/* Right: Add Custom Link & Canonical Reference (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Plus size={14} className="text-primary" /> नयाँ ज्ञान नोड जोड्नुहोस्
            </h4>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase text-muted-text block mb-1">
                  इकाई वा पात्रको नाम (Entity Name)
                </label>
                <input
                  type="text"
                  value={customEntityName}
                  onChange={(e) => setCustomEntityName(e.target.value)}
                  placeholder="उदा. श्री पशुपतिनाथ मन्दिर, आदि शङ्कराचार्य..."
                  className="w-full p-2.5 rounded-xl bg-background border border-border-theme text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted-text block mb-1">
                  प्रकार (Entity Type)
                </label>
                <select
                  value={customEntityType}
                  onChange={(e) => setCustomEntityType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-background border border-border-theme text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="deity">देवता / ईश्वरीय स्वरूप (Deity)</option>
                  <option value="place">तीर्थ / मन्दिर / स्थान (Place)</option>
                  <option value="scholar">ऋषि / विद्वान् (Scholar)</option>
                  <option value="tradition">दर्शन / परम्परा (Tradition)</option>
                  <option value="text">ग्रन्थ (Sacred Text)</option>
                </select>
              </div>

              <button
                onClick={handleAddCustomLink}
                className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-primary/20"
              >
                <Plus size={13} /> सम्बन्ध थप्नुहोस् (Add Link)
              </button>
            </div>
          </div>

          {/* Canonical Knowledge OS Entities Quick Picker */}
          <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm space-y-2.5">
            <span className="text-[10px] font-black uppercase text-muted-text block">
              Knowledge OS प्रमाणित सूचीबाट तत्काल थप्नुहोस्:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {CANONICAL_ENTITIES.slice(0, 8).map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => {
                    if (knowledgeLinks.some(k => k.entityId === entity.id)) {
                      toast.info("पहिले नै जोडिएको छ।");
                      return;
                    }
                    setKnowledgeLinks(prev => [
                      ...prev,
                      {
                        entityId: entity.id,
                        canonicalName: entity.canonicalNameNp,
                        entityType: entity.type as any,
                        relevanceReason: `Knowledge OS प्रमाणित ${entity.type}`,
                        confidence: 0.98,
                        linkedAt: new Date().toISOString()
                      }
                    ]);
                    toast.success(`'${entity.canonicalNameNp}' जोडियो!`);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-muted-area hover:bg-primary/10 hover:text-primary border border-border-theme text-[11px] font-bold transition-all cursor-pointer text-foreground"
                >
                  + {entity.canonicalNameNp}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
