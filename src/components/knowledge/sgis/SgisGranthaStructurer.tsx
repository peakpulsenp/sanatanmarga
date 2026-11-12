import React, { useState } from "react";
import { BookOpen, Languages, Sparkles, Plus, Trash2, Check, RefreshCw, Layers, Edit3, MessageSquare, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { SgisGrantha, SgisRole, SgisGranthaProcessor, GranthaVerse, SgisOSService } from "@/src/services/sgisOSService";

interface Props {
  selectedManuscript: SgisGrantha;
  currentRole: SgisRole;
  onManuscriptUpdated: (updated: SgisGrantha) => void;
}

export default function SgisGranthaStructurer({ selectedManuscript, currentRole, onManuscriptUpdated }: Props) {
  const [verses, setVerses] = useState<GranthaVerse[]>(
    selectedManuscript.verses && selectedManuscript.verses.length > 0
      ? selectedManuscript.verses
      : SgisGranthaProcessor.localDeterministicStructuring(selectedManuscript.originalText, selectedManuscript.titleNepali).verses
  );
  const [iastText, setIastText] = useState(
    selectedManuscript.transliterationIAST || SgisGranthaProcessor.devanagariToIast(selectedManuscript.originalText)
  );
  const [nepaliTranslation, setNepaliTranslation] = useState(selectedManuscript.translationNepali || "");
  const [englishTranslation, setEnglishTranslation] = useState(selectedManuscript.translationEnglish || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedVerseIndex, setSelectedVerseIndex] = useState(0);

  const handleAutoStructureWithAi = async () => {
    if (!SgisOSService.hasPermission(currentRole, "translate")) {
      toast.error(`निषेध: '${currentRole}' भूमिकाले अनुवाद/संरचना सम्पादन गर्न पाउँदैन।`);
      return;
    }

    setIsProcessing(true);
    toast.info("ग्रन्थलाई श्लोक, IAST र द्विभाषिक अनुवादमा संरचना गरिँदैछ...");

    try {
      const res = await SgisGranthaProcessor.structureGranthaText({
        text: selectedManuscript.originalText,
        granthaTitle: selectedManuscript.titleNepali
      });

      if (res.success) {
        if (res.verses && res.verses.length > 0) setVerses(res.verses);
        if (res.iastComplete) setIastText(res.iastComplete);
        if (res.nepaliTranslationSummary) setNepaliTranslation(res.nepaliTranslationSummary);
        if (res.englishTranslationSummary) setEnglishTranslation(res.englishTranslationSummary);
        toast.success(`संरचना सम्पन्न! ${res.verses.length} श्लोकहरू तयार पारियो।`);
      }
    } catch (err: any) {
      toast.error(err.message || "संरचना प्रक्रियामा समस्या आयो।");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveStructuring = () => {
    const updatedMs: SgisGrantha = {
      ...selectedManuscript,
      verses,
      transliterationIAST: iastText,
      translationNepali: nepaliTranslation,
      translationEnglish: englishTranslation,
      lifecycleStatus: "TRANSLITERATION",
      auditTrail: [
        ...(selectedManuscript.auditTrail || []),
        {
          id: `aud-${Date.now()}`,
          actor: `User (${currentRole})`,
          actorRole: currentRole,
          timestamp: new Date().toLocaleString(),
          manuscriptId: selectedManuscript.id,
          version: selectedManuscript.versionHistory?.length ? selectedManuscript.versionHistory[selectedManuscript.versionHistory.length - 1].version : 1.0,
          action: "TRANSLITERATION_GENERATED",
          reason: `Structured ${verses.length} classical verses with IAST and dual translations`
        }
      ]
    };

    onManuscriptUpdated(updatedMs);
    toast.success("ग्रन्थ संरचना (Verses, IAST, Translations) सफलतापूर्वक सुरक्षित भयो!");
  };

  const activeVerse = verses[selectedVerseIndex] || verses[0];

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <BookOpen size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              ग्रन्थ संरचना, IAST लिप्यन्तरण एवं भाष्य स्टुडियो
            </h3>
            <p className="text-xs text-muted-text">
              {selectedManuscript.titleNepali} • {verses.length} श्लोकहरू
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoStructureWithAi}
            disabled={isProcessing}
            className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm shadow-primary/20 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
            AI श्लोक संरचना एवं अनुवाद (Auto-Structure)
          </button>
          <button
            onClick={handleSaveStructuring}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <Check size={14} /> संरचना सुरक्षित गर्नुहोस् (Save Grantha)
          </button>
        </div>
      </div>

      {/* Main Structuring Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Verse List Navigator (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-border-theme pb-2">
              <span className="text-xs font-black text-foreground">श्लोक सूची (Verse List)</span>
              <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {verses.length} श्लोक
              </span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {verses.map((v, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedVerseIndex(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedVerseIndex === idx
                      ? "bg-primary/10 border-primary text-primary shadow-sm"
                      : "bg-muted-area/40 border-border-theme hover:bg-muted-area text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black">
                      अध्याय {v.chapter || 1} • श्लोक {v.verseNumber || idx + 1}
                    </span>
                    <span className="text-[10px] text-muted-text">
                      {v.translations?.length || 0} अनुवाद
                    </span>
                  </div>
                  <p className="font-serif text-xs truncate opacity-90">{v.sanskritVerse}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Verse Editor, IAST, Translation, Commentary (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeVerse ? (
            <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border-theme pb-3">
                <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                  <Languages size={16} className="text-primary" />
                  श्लोक सम्पादन (अध्याय {activeVerse.chapter || 1}, श्लोक {activeVerse.verseNumber || selectedVerseIndex + 1})
                </h4>
              </div>

              {/* Sanskrit Shloka Box */}
              <div>
                <label className="text-[10px] font-black uppercase text-muted-text block mb-1">
                  मूल संस्कृत श्लोक (Devanagari Sanskrit Verse)
                </label>
                <textarea
                  value={activeVerse.sanskritVerse}
                  onChange={(e) => {
                    const text = e.target.value;
                    setVerses(prev =>
                      prev.map((v, i) => (i === selectedVerseIndex ? { ...v, sanskritVerse: text } : v))
                    );
                  }}
                  rows={3}
                  className="w-full p-3.5 rounded-xl bg-background border border-border-theme font-serif text-sm leading-relaxed text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              {/* IAST Box */}
              <div>
                <label className="text-[10px] font-black uppercase text-muted-text block mb-1">
                  IAST अन्तर्राष्ट्रिय संस्कृत लिप्यन्तरण (IAST Romanized)
                </label>
                <input
                  type="text"
                  value={activeVerse.iastTransliteration || ""}
                  onChange={(e) => {
                    const text = e.target.value;
                    setVerses(prev =>
                      prev.map((v, i) => (i === selectedVerseIndex ? { ...v, iastTransliteration: text } : v))
                    );
                  }}
                  className="w-full p-3 rounded-xl bg-background border border-border-theme font-mono text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              {/* Dual Translations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-muted-text block mb-1">
                    नेपाली भावार्थ (Nepali Translation)
                  </label>
                  <textarea
                    value={activeVerse.translations?.find(t => t.language === "ne")?.text || ""}
                    onChange={(e) => {
                      const text = e.target.value;
                      setVerses(prev =>
                        prev.map((v, i) => {
                          if (i !== selectedVerseIndex) return v;
                          const existingTrans = v.translations || [];
                          const neIdx = existingTrans.findIndex(t => t.language === "ne");
                          let updatedTrans;
                          if (neIdx >= 0) {
                            updatedTrans = [...existingTrans];
                            updatedTrans[neIdx] = { ...updatedTrans[neIdx], text };
                          } else {
                            updatedTrans = [...existingTrans, { language: "ne", translatorName: "SGIS Scholar", text, translationType: "manual", reviewStatus: "approved", version: 1 }];
                          }
                          return { ...v, translations: updatedTrans };
                        })
                      );
                    }}
                    rows={3}
                    className="w-full p-3 rounded-xl bg-background border border-border-theme text-xs leading-relaxed text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-muted-text block mb-1">
                    English Translation
                  </label>
                  <textarea
                    value={activeVerse.translations?.find(t => t.language === "en")?.text || ""}
                    onChange={(e) => {
                      const text = e.target.value;
                      setVerses(prev =>
                        prev.map((v, i) => {
                          if (i !== selectedVerseIndex) return v;
                          const existingTrans = v.translations || [];
                          const enIdx = existingTrans.findIndex(t => t.language === "en");
                          let updatedTrans;
                          if (enIdx >= 0) {
                            updatedTrans = [...existingTrans];
                            updatedTrans[enIdx] = { ...updatedTrans[enIdx], text };
                          } else {
                            updatedTrans = [...existingTrans, { language: "en", translatorName: "SGIS Scholar", text, translationType: "manual", reviewStatus: "approved", version: 1 }];
                          }
                          return { ...v, translations: updatedTrans };
                        })
                      );
                    }}
                    rows={3}
                    className="w-full p-3 rounded-xl bg-background border border-border-theme text-xs leading-relaxed text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              {/* Classical Commentary Box */}
              <div>
                <label className="text-[10px] font-black uppercase text-muted-text block mb-1">
                  शास्त्रीय भाष्य एवं टीका (Traditional Commentary)
                </label>
                <div className="p-3 rounded-xl bg-muted-area/40 border border-border-theme space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span>{activeVerse.commentaries?.[0]?.scholarName || "आदि शङ्कराचार्य परम्परा"}</span>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {activeVerse.commentaries?.[0]?.tradition || "अद्वैत वेदान्त"}
                    </span>
                  </div>
                  <textarea
                    value={activeVerse.commentaries?.[0]?.commentaryText || ""}
                    onChange={(e) => {
                      const text = e.target.value;
                      setVerses(prev =>
                        prev.map((v, i) => {
                          if (i !== selectedVerseIndex) return v;
                          return {
                            ...v,
                            commentaries: [
                              {
                                id: `comm-${selectedVerseIndex + 1}`,
                                scholarName: "आदि शङ्कराचार्य परम्परा",
                                tradition: "अद्वैत वेदान्त",
                                commentaryText: text
                              }
                            ]
                          };
                        })
                      );
                    }}
                    rows={2}
                    placeholder="भाष्य यहाँ लेख्नुहोस्..."
                    className="w-full p-2.5 rounded-lg bg-background border border-border-theme text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-muted-text bg-card border border-border-theme rounded-2xl">
              कृपया कुनै श्लोक चयन गर्नुहोस्।
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
