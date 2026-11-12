import React, { useState } from "react";
import { Award, ShieldCheck, CheckCircle2, AlertCircle, History, RotateCcw, ArrowRight, UserCheck, Lock, Globe, Database, FileText } from "lucide-react";
import { toast } from "sonner";
import { SgisGrantha, SgisRole, SgisLifecycleStatus, LIFECYCLE_ORDER, SgisOSService, SgisAuditEvent } from "@/src/services/sgisOSService";

interface Props {
  selectedManuscript: SgisGrantha;
  currentRole: SgisRole;
  onManuscriptUpdated: (updated: SgisGrantha) => void;
}

export default function SgisScholarReviewStudio({ selectedManuscript, currentRole, onManuscriptUpdated }: Props) {
  const [scholarName, setScholarName] = useState("प्राज्ञ डा. धनवज्र वज्राचार्य (अभिलेखविद्)");
  const [scholarNotes, setScholarNotes] = useState("संस्कृत व्याकरण, छन्द र मूल पाण्डुलिपि पाठ पूर्णतः शुद्ध र प्रामाणिक ठहरियो।");
  const [selectedTargetState, setSelectedTargetState] = useState<SgisLifecycleStatus>(
    selectedManuscript.lifecycleStatus === "SCHOLAR_REVIEW" ? "VERIFIED" : "LIBRARY_PUBLISHED"
  );
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const handleApplyScholarApproval = () => {
    if (!SgisOSService.hasPermission(currentRole, "scholar_review") && !SgisOSService.hasPermission(currentRole, "publish")) {
      toast.error(`निषेध: '${currentRole}' भूमिकाले विद्वत् प्रमाणीकरण गर्न पाउँदैन। ('Scholar' वा 'Editor'/'Admin' आवश्यक)`);
      return;
    }

    const nextState = selectedTargetState;
    const transitionCheck = SgisOSService.validateLifecycleTransition(selectedManuscript.lifecycleStatus, nextState);
    if (!transitionCheck.isValid) {
      toast.error(transitionCheck.errorReason || "अवैध स्थिति रूपान्तरण");
      return;
    }

    const currentVersion = selectedManuscript.versionHistory?.length 
      ? selectedManuscript.versionHistory[selectedManuscript.versionHistory.length - 1].version + 0.1 
      : 1.2;
    const roundedVersion = parseFloat(currentVersion.toFixed(1));

    const auditEvent: SgisAuditEvent = {
      id: `aud-${Date.now()}`,
      actor: scholarName || `User (${currentRole})`,
      actorRole: currentRole,
      timestamp: new Date().toLocaleString(),
      manuscriptId: selectedManuscript.id,
      version: roundedVersion,
      action: nextState === "LIBRARY_PUBLISHED" ? "LIBRARY_PUBLISHED" : "SCHOLAR_APPROVED",
      reason: scholarNotes || "Scholarly peer-review and canonical validation completed"
    };

    const isPublished = nextState === "LIBRARY_PUBLISHED" || nextState === "RAG_INDEXED" || selectedManuscript.isPublishedToLibrary;
    const isIndexed = nextState === "RAG_INDEXED" || (nextState === "LIBRARY_PUBLISHED" && selectedManuscript.isIndexedInRag);

    const updatedMs: SgisGrantha = {
      ...selectedManuscript,
      lifecycleStatus: nextState,
      scholarValidationStatus: nextState === "VERIFIED" || nextState === "LIBRARY_PUBLISHED" ? "canonical_text" : "editor_approved",
      isPublishedToLibrary: isPublished,
      isIndexedInRag: isIndexed,
      ragStatus: isIndexed ? "INDEXED" : selectedManuscript.ragStatus,
      auditTrail: [...(selectedManuscript.auditTrail || []), auditEvent],
      versionHistory: [
        ...(selectedManuscript.versionHistory || []),
        {
          version: roundedVersion,
          versionTag: `v${roundedVersion} Canonical Verified`,
          text: selectedManuscript.originalText,
          changedBy: scholarName,
          changedAt: new Date().toLocaleString(),
          changeReason: scholarNotes
        }
      ]
    };

    onManuscriptUpdated(updatedMs);
    toast.success(`विद्वत् समीक्षा सम्पन्न! स्थिति '${nextState}' मा अद्यावधिक भयो।`);
  };

  const handleRollbackToVersion = (versionNum: number) => {
    const targetVer = selectedManuscript.versionHistory?.find(v => v.version === versionNum);
    if (!targetVer) return;

    const auditEvent: SgisAuditEvent = {
      id: `aud-${Date.now()}`,
      actor: `User (${currentRole})`,
      actorRole: currentRole,
      timestamp: new Date().toLocaleString(),
      manuscriptId: selectedManuscript.id,
      version: versionNum,
      action: "ROLLED_BACK",
      reason: `Rolled back to version v${versionNum}`
    };

    const { updatedMs } = SgisOSService.evaluateRagInvalidation(
      selectedManuscript,
      `User (${currentRole})`,
      currentRole,
      `Rolled back to v${versionNum}`
    );

    const finalizedMs: SgisGrantha = {
      ...updatedMs,
      originalText: targetVer.text,
      auditTrail: [...(selectedManuscript.auditTrail || []), auditEvent]
    };

    onManuscriptUpdated(finalizedMs);
    toast.warning(`संस्करण v${versionNum} मा सफलतापूर्वक फिर्ता (Rollback) गरियो!`);
  };

  const handlePublishToLibrary = () => {
    if (!SgisOSService.hasPermission(currentRole, "publish")) {
      toast.error(`निषेध: '${currentRole}' ले सार्वजनिक पुस्तकालयमा प्रकाशन गर्न पाउँदैन। ('Admin' वा 'Editor' आवश्यक)`);
      return;
    }

    const preflight = SgisOSService.validateForLibraryPublication(selectedManuscript);
    if (!preflight.isEligible) {
      toast.error(`प्रकाशन पूर्व-सर्त अपूरो: ${preflight.missingRequirements.join(", ")}`);
      return;
    }

    const auditEvent: SgisAuditEvent = {
      id: `aud-${Date.now()}`,
      actor: `User (${currentRole})`,
      actorRole: currentRole,
      timestamp: new Date().toLocaleString(),
      manuscriptId: selectedManuscript.id,
      version: selectedManuscript.versionHistory?.length ? selectedManuscript.versionHistory[selectedManuscript.versionHistory.length - 1].version : 1.0,
      action: "LIBRARY_PUBLISHED",
      reason: "Published to SGIS Public Digital Library with full provenance"
    };

    const updatedMs: SgisGrantha = {
      ...selectedManuscript,
      isPublishedToLibrary: true,
      lifecycleStatus: "LIBRARY_PUBLISHED",
      ragStatus: "INDEXED",
      isIndexedInRag: true,
      auditTrail: [...(selectedManuscript.auditTrail || []), auditEvent]
    };

    onManuscriptUpdated(updatedMs);
    toast.success(`'${selectedManuscript.titleNepali}' सार्वजनिक ग्रन्थालय तथा RAG मा प्रकाशित भयो!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Award size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              विद्वत् समीक्षा एवं प्रामाणिक प्रकाशन (Scholar Review & Canonical Approval)
            </h3>
            <p className="text-xs text-muted-text">
              {selectedManuscript.titleNepali} • Accession: {selectedManuscript.accessionNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedManuscript.isPublishedToLibrary ? (
            <span className="text-xs font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Globe size={14} /> सार्वजनिक ग्रन्थालयमा प्रकाशित (Live)
            </span>
          ) : (
            <button
              onClick={handlePublishToLibrary}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer"
            >
              <Globe size={14} /> सार्वजनिक पुस्तकालयमा प्रकाशन गर्नुहोस् (Publish)
            </button>
          )}
        </div>
      </div>

      {/* Review Form & State Transition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Scholar Signoff Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border-theme pb-2.5">
              <UserCheck size={16} className="text-primary" /> विद्वान् प्रमाणीकरण फारम (Peer-Review Signoff)
            </h4>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase text-muted-text block mb-1">
                  प्रमाणीकरण गर्ने विद्वान् / प्राज्ञको नाम
                </label>
                <input
                  type="text"
                  value={scholarName}
                  onChange={(e) => setScholarName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-background border border-border-theme text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted-text block mb-1">
                  लक्षित जीवनचक्र स्थिति (Target Lifecycle State)
                </label>
                <select
                  value={selectedTargetState}
                  onChange={(e) => setSelectedTargetState(e.target.value as SgisLifecycleStatus)}
                  className="w-full p-2.5 rounded-xl bg-background border border-border-theme text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="VERIFIED">प्रमाणित (VERIFIED - Peer-Reviewed Canonical)</option>
                  <option value="LIBRARY_PUBLISHED">ग्रन्थालय प्रकाशित (LIBRARY_PUBLISHED)</option>
                  <option value="RAG_INDEXED">RAG इन्डेक्स सम्पन्न (RAG_INDEXED)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted-text block mb-1">
                  विद्वत् टिप्पणी एवं सम्पादन कारण (Scholarly Comments & Approval Note)
                </label>
                <textarea
                  value={scholarNotes}
                  onChange={(e) => setScholarNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-background border border-border-theme text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <button
                onClick={handleApplyScholarApproval}
                className="w-full py-3 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/20"
              >
                <ShieldCheck size={15} /> विद्वत् प्रमाणीकरण अनुमोदन गर्नुहोस् (Approve & Transition)
              </button>
            </div>
          </div>
        </div>

        {/* Right: Version History & Audit Trail (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border-theme pb-2.5">
              <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <History size={16} className="text-primary" /> संस्करण इतिहास (Version History)
              </h4>
              <span className="text-[10px] font-black bg-muted-area text-muted-text px-2 py-0.5 rounded-md">
                {selectedManuscript.versionHistory?.length || 1} Versions
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {(selectedManuscript.versionHistory || []).map((ver, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-muted-area/50 border border-border-theme text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-foreground">{ver.versionTag || `v${ver.version}`}</span>
                    <span className="text-[10px] text-muted-text">{ver.changedAt}</span>
                  </div>
                  <p className="text-[11px] text-muted-text font-serif truncate">{ver.text}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-border-theme/60 text-[10px]">
                    <span className="text-muted-text">द्वारा: <strong className="text-foreground">{ver.changedBy}</strong></span>
                    <button
                      onClick={() => handleRollbackToVersion(ver.version)}
                      className="text-amber-600 hover:text-amber-700 font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={11} /> Rollback
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Trail Snippet */}
          <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm space-y-2">
            <span className="text-[10px] font-black uppercase text-muted-text block">
              लेखा परीक्षण अभिलेख (Audit Events): {selectedManuscript.auditTrail?.length || 0} Events
            </span>
            <div className="text-[11px] text-muted-text space-y-1">
              {(selectedManuscript.auditTrail || []).slice(-3).map((aud, i) => (
                <div key={i} className="truncate">
                  • <span className="font-bold text-foreground">{aud.action}</span> by {aud.actor} ({aud.timestamp})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
