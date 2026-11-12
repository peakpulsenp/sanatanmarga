import React, { useState } from "react";
import { Wand2, CheckCircle2, XCircle, AlertTriangle, ArrowRight, RefreshCw, Sparkles, Check, FileCheck, Layers, Diff } from "lucide-react";
import { toast } from "sonner";
import { SgisGrantha, SgisRole, SgisManuscriptCleaner, OCRCandidateCorrection, SgisOSService } from "@/src/services/sgisOSService";

interface Props {
  selectedManuscript: SgisGrantha;
  currentRole: SgisRole;
  onManuscriptUpdated: (updated: SgisGrantha) => void;
}

export default function SgisTextCleaner({ selectedManuscript, currentRole, onManuscriptUpdated }: Props) {
  const [cleanedText, setCleanedText] = useState(selectedManuscript.originalText);
  const [candidateCorrections, setCandidateCorrections] = useState<OCRCandidateCorrection[]>(
    selectedManuscript.candidateCorrections || []
  );
  const [isCleaning, setIsCleaning] = useState(false);
  const [activeDiffMode, setActiveDiffMode] = useState<"side_by_side" | "diff">("side_by_side");

  const rawOcrText = selectedManuscript.versionHistory?.[0]?.text || selectedManuscript.originalText;

  const handleRunAutoClean = async () => {
    if (!SgisOSService.hasPermission(currentRole, "text_cleanup")) {
      toast.error(`निषेध: '${currentRole}' भूमिकाले पाठ शुद्धीकरण गर्न पाउँदैन। ('Archivist', 'Editor' वा 'Admin' आवश्यक)`);
      return;
    }

    setIsCleaning(true);
    toast.info("पाण्डुलिपि शुद्धीकरण तथा द्विदण्ड (॥) मानकीकरण हुँदैछ...");

    try {
      const res = await SgisManuscriptCleaner.cleanupText({
        text: selectedManuscript.originalText,
        options: {
          normalizeDanda: true,
          fixHalant: true,
          fixAnusvara: true,
          removeNoise: true
        }
      });

      if (res.success) {
        setCleanedText(res.cleanedText);
        setCandidateCorrections(prev => [...(res.candidateCorrections || []), ...prev]);
        toast.success(`शुद्धीकरण सम्पन्न! ${res.normalizationCount} सुधारहरू पहिचान गरियो।`);
      }
    } catch (err: any) {
      toast.error(err.message || "शुद्धीकरण प्रक्रियामा समस्या आयो।");
    } finally {
      setIsCleaning(false);
    }
  };

  const handleQuickDandaFix = () => {
    const fixed = cleanedText.replace(/(?:।।|\|\|)/g, "॥").replace(/\s+।/g, "।");
    setCleanedText(fixed);
    toast.success("द्विदण्ड (॥) सफलतापूर्वक सच्याइयो!");
  };

  const handleAcceptCorrection = (corrId: string) => {
    const corr = candidateCorrections.find(c => c.id === corrId);
    if (!corr) return;

    if (corr.rawOcrText && corr.suggestedCorrection) {
      const updated = cleanedText.replace(corr.rawOcrText, corr.suggestedCorrection);
      setCleanedText(updated);
    }

    setCandidateCorrections(prev =>
      prev.map(c => (c.id === corrId ? { ...c, status: "approved" as const } : c))
    );
    toast.success(`सुझाव "${corr.suggestedCorrection}" स्वीकार गरियो।`);
  };

  const handleRejectCorrection = (corrId: string) => {
    setCandidateCorrections(prev =>
      prev.map(c => (c.id === corrId ? { ...c, status: "rejected" as const } : c))
    );
    toast.info("सुझाव अस्वीकार गरियो।");
  };

  const handleSaveCleanedVersion = () => {
    if (!SgisOSService.hasPermission(currentRole, "text_cleanup")) {
      toast.error("अनुमति छैन।");
      return;
    }

    const currentVersion = selectedManuscript.versionHistory?.length 
      ? selectedManuscript.versionHistory[selectedManuscript.versionHistory.length - 1].version + 0.1 
      : 1.1;
    const roundedVersion = parseFloat(currentVersion.toFixed(1));

    const newVersion = {
      version: roundedVersion,
      versionTag: `v${roundedVersion} Cleaned`,
      text: cleanedText,
      changedBy: `User (${currentRole})`,
      changedAt: new Date().toLocaleString(),
      changeReason: "Manuscript text cleanup, danda normalization, and candidate corrections applied."
    };

    const auditEvent = {
      id: `aud-${Date.now()}`,
      actor: `User (${currentRole})`,
      actorRole: currentRole,
      timestamp: new Date().toLocaleString(),
      manuscriptId: selectedManuscript.id,
      version: roundedVersion,
      action: "TEXT_CLEANUP_APPLIED" as const,
      reason: "Manuscript text normalized and updated"
    };

    // Evaluate RAG Invalidation
    const { updatedMs, wasInvalidated } = SgisOSService.evaluateRagInvalidation(
      selectedManuscript,
      `User (${currentRole})`,
      currentRole,
      "Canonical text modified in cleanup studio"
    );

    const finalizedMs: SgisGrantha = {
      ...updatedMs,
      originalText: cleanedText,
      lifecycleStatus: "CLEANUP",
      ocrPipelineStatus: "normalized",
      candidateCorrections,
      versionHistory: [...(selectedManuscript.versionHistory || []), newVersion],
      auditTrail: [...(selectedManuscript.auditTrail || []), auditEvent]
    };

    onManuscriptUpdated(finalizedMs);
    toast.success(`संस्करण v${roundedVersion} सुरक्षित भयो!`);
    if (wasInvalidated) {
      toast.warning("ग्रन्थ सम्पादन भएकाले RAG Index स्वचालित रूपमा Invalidate गरियो (Re-indexing आवश्यक)।");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Wand2 size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              पाठ शुद्धीकरण स्टुडियो (Text Normalization & Danda Engine)
            </h3>
            <p className="text-xs text-muted-text">
              {selectedManuscript.titleNepali} ({selectedManuscript.accessionNumber})
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickDandaFix}
            className="px-3 py-1.5 rounded-xl border border-border-theme bg-background hover:bg-muted-area text-xs font-bold text-foreground transition-all cursor-pointer flex items-center gap-1.5"
            title="Convert '।।' or '||' into Sanskrit '॥'"
          >
            ⚡ द्विदण्ड (॥) सच्याउनुहोस्
          </button>
          <button
            onClick={handleRunAutoClean}
            disabled={isCleaning}
            className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm shadow-primary/20 cursor-pointer disabled:opacity-50"
          >
            {isCleaning ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
            AI शुद्धीकरण चलाउनुहोस्
          </button>
          <button
            onClick={handleSaveCleanedVersion}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <Check size={14} /> सुरक्षित गर्नुहोस् (Save v{(selectedManuscript.versionHistory?.length ? selectedManuscript.versionHistory[selectedManuscript.versionHistory.length - 1].version + 0.1 : 1.1).toFixed(1)})
          </button>
        </div>
      </div>

      {/* Side-by-side Editor & Diff Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Raw OCR Text (Read Only) */}
        <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-border-theme pb-2.5">
            <span className="text-xs font-black text-muted-text uppercase tracking-wider">
              १. मूल OCR निष्कर्षण (Raw OCR Text)
            </span>
            <span className="text-[10px] font-black bg-muted-area text-muted-text px-2 py-0.5 rounded-md border border-border-theme">
              अपरिवर्तनीय (Raw Archive)
            </span>
          </div>
          <div className="p-4 rounded-xl bg-muted-area/40 border border-border-theme font-serif text-sm leading-relaxed text-foreground min-h-[260px] whitespace-pre-wrap selection:bg-primary/20">
            {rawOcrText}
          </div>
        </div>

        {/* Right: Cleaned & Normalized Text (Editable) */}
        <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-border-theme pb-2.5">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} /> २. शुद्धीकृत पाठ (Cleaned & Normalized)
            </span>
            <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-500/20">
              सम्पादन योग्य (Editable)
            </span>
          </div>
          <textarea
            value={cleanedText}
            onChange={(e) => setCleanedText(e.target.value)}
            rows={10}
            className="w-full p-4 rounded-xl bg-background border border-border-theme font-serif text-sm leading-relaxed text-foreground focus:ring-2 focus:ring-primary/30 outline-none resize-y min-h-[260px]"
            placeholder="शुद्धीकृत पाठ यहाँ प्रविष्ट गर्नुहोस्..."
          />
        </div>
      </div>

      {/* Candidate Corrections Review Queue */}
      <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border-theme pb-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-primary" />
            <h4 className="text-sm font-black text-foreground">
              सुझावित शुद्धाशुद्धि सूची (Candidate Corrections Queue - {candidateCorrections.length})
            </h4>
          </div>
          <span className="text-[10px] font-bold text-muted-text">
            प्रत्येक सुधार समीक्षा गरी स्वीकार वा अस्वीकार गर्नुहोस्
          </span>
        </div>

        {candidateCorrections.length > 0 ? (
          <div className="divide-y divide-border-theme">
            {candidateCorrections.map((corr) => (
              <div key={corr.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="line-through text-red-500 font-bold font-serif bg-red-500/10 px-2 py-0.5 rounded">
                      {corr.rawOcrText}
                    </span>
                    <ArrowRight size={13} className="text-muted-text" />
                    <span className="text-emerald-600 font-bold font-serif bg-emerald-500/10 px-2 py-0.5 rounded">
                      {corr.suggestedCorrection}
                    </span>
                    <span className="text-[10px] text-muted-text font-bold">({corr.reason})</span>
                  </div>
                  <p className="text-[10px] text-muted-text">
                    प्रस्तावक: <span className="font-bold text-foreground">{corr.submittedBy}</span> • विश्वास:{" "}
                    <span className="text-emerald-600 font-black">{Math.round(corr.confidence * 100)}%</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {corr.status === "approved" ? (
                    <span className="text-emerald-600 font-black flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 size={13} /> स्वीकृत (Applied)
                    </span>
                  ) : corr.status === "rejected" ? (
                    <span className="text-red-500 font-black flex items-center gap-1 bg-red-500/10 px-2.5 py-1 rounded-lg">
                      <XCircle size={13} /> अस्वीकृत
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleAcceptCorrection(corr.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Check size={12} /> स्वीकार
                      </button>
                      <button
                        onClick={() => handleRejectCorrection(corr.id)}
                        className="px-2.5 py-1 rounded-lg bg-muted-area hover:bg-red-500/10 hover:text-red-500 border border-border-theme font-bold transition-all cursor-pointer"
                      >
                        अस्वीकार
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-muted-text">
            कुनै थप शुद्धाशुद्धि बाँकी छैन। पाठ पूर्ण रूपमा मानकीकृत छ।
          </div>
        )}
      </div>
    </div>
  );
}
