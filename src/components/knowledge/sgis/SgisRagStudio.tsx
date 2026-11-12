import React, { useState } from "react";
import { MessageSquare, Sparkles, Send, RefreshCw, BookOpen, ShieldCheck, AlertCircle, BarChart3, Database, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { SgisGrantha, SgisOSService, RagAssistantResponse } from "@/src/services/sgisOSService";

interface Props {
  manuscripts: SgisGrantha[];
}

export default function SgisRagStudio({ manuscripts }: Props) {
  const [query, setQuery] = useState("");
  const [mode, setRagMode] = useState<"general" | "scholarly">("scholarly");
  const [isLoading, setIsLoading] = useState(false);
  const [ragResult, setRagResult] = useState<RagAssistantResponse | null>(null);

  const ragMetrics = SgisOSService.calculateRagEvaluationMetrics(manuscripts);

  const sampleQueries = [
    "तैत्तिरीयोपनिषद्को शान्तिमन्त्रको मूल संस्कृत श्लोक र तात्पर्य के हो?",
    "श्रीमद्भगवद्गीतामा निष्काम कर्मयोग सम्बन्धी कुन श्लोक प्रमाणित छ?",
    "लिच्छवि कालीन ताडपत्र पाण्डुलिपिहरूमा कुन लिपि प्रयोग भएको छ?"
  ];

  const handleExecuteRag = async (queryText?: string) => {
    const q = queryText || query;
    if (!q || q.trim().length < 3) {
      toast.error("कृपया स्पष्ट प्रश्न सोध्नुहोस्।");
      return;
    }

    setIsLoading(true);
    toast.info("SGIS पाण्डुलिपि भल्टबाट प्रमाण खोजी भइरहेको छ...");

    try {
      const res = await SgisOSService.queryRagAssistant(q, mode);
      setRagResult(res);
      if (res.hasRetrievedEvidence) {
        toast.success(`प्रमाणित उत्तर प्राप्त भयो (${res.evidenceCount} स्रोत प्रमाण)।`);
      } else {
        toast.warning("SGIS भल्टमा प्रमाणित पाण्डुलिपि भेटिएन।");
      }
    } catch (err: any) {
      toast.error(err.message || "RAG प्रश्नोत्तरमा समस्या आयो।");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* RAG Evaluation Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-card border border-border-theme text-center">
          <p className="text-[10px] font-black uppercase text-muted-text">प्रमाण कभरेज (Coverage)</p>
          <p className="text-lg font-black text-emerald-600 mt-1">{ragMetrics.citationCoveragePercent}%</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-card border border-border-theme text-center">
          <p className="text-[10px] font-black uppercase text-muted-text">स्मरण दर (Evidence Recall)</p>
          <p className="text-lg font-black text-emerald-600 mt-1">{ragMetrics.evidenceRecallPercent}%</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-card border border-border-theme text-center">
          <p className="text-[10px] font-black uppercase text-muted-text">अप्रामाणिक उत्तर दर</p>
          <p className="text-lg font-black text-emerald-600 mt-1">{ragMetrics.unsupportedAnswerRatePercent}%</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-card border border-border-theme text-center">
          <p className="text-[10px] font-black uppercase text-muted-text">पुनःप्राप्ति शुद्धता (Precision)</p>
          <p className="text-lg font-black text-primary mt-1">{ragMetrics.retrievalPrecisionPercent}%</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-card border border-border-theme text-center">
          <p className="text-[10px] font-black uppercase text-muted-text">Stale Indexes</p>
          <p className={`text-lg font-black mt-1 ${ragMetrics.staleIndexCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
            {ragMetrics.staleIndexCount}
          </p>
        </div>
        <div className="p-3.5 rounded-2xl bg-card border border-border-theme text-center">
          <p className="text-[10px] font-black uppercase text-muted-text">अन-इन्डेक्स्ड पाण्डुलिपि</p>
          <p className="text-lg font-black text-foreground mt-1">{ragMetrics.unindexedApprovedManuscriptsCount}</p>
        </div>
      </div>

      {/* RAG Query Input */}
      <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-theme pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <h3 className="text-sm font-black text-foreground">सरस्वती RAG अनुसन्धान सहायक (SGIS Grounded Assistant)</h3>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-muted-area p-1 rounded-xl border border-border-theme">
            <button
              onClick={() => setRagMode("scholarly")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === "scholarly" ? "bg-primary text-white shadow" : "text-muted-text hover:text-foreground"
              }`}
            >
              विद्वत् अनुसन्धान (Scholarly Mode)
            </button>
            <button
              onClick={() => setRagMode("general")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === "general" ? "bg-primary text-white shadow" : "text-muted-text hover:text-foreground"
              }`}
            >
              सामान्य अध्ययन (General Study)
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleExecuteRag()}
            placeholder="पाण्डुलिपि, श्लोक वा दार्शनिक सन्दर्भ बारे प्रश्न सोध्नुहोस्..."
            className="flex-1 p-3 rounded-xl bg-background border border-border-theme text-xs font-medium text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
          />
          <button
            onClick={() => handleExecuteRag()}
            disabled={isLoading}
            className="px-5 py-3 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            प्रमाण खोज
          </button>
        </div>

        {/* Sample Queries */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] font-black uppercase text-muted-text">नमूना प्रश्नहरू:</span>
          {sampleQueries.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(sq);
                handleExecuteRag(sq);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-muted-area hover:bg-primary/10 hover:text-primary border border-border-theme transition-all cursor-pointer text-foreground"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* RAG Answer Display */}
      {ragResult && (
        <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border-theme pb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-emerald-600" />
              <h4 className="text-sm font-black text-foreground">प्रमाणित उत्तर (Grounded Answer)</h4>
            </div>
            <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              विश्वसनीयता: {Math.round(ragResult.confidence * 100)}% • Mode: {ragResult.mode}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border-theme text-xs leading-relaxed text-foreground whitespace-pre-wrap">
            {ragResult.answer}
          </div>

          {/* Retrieved Citations Provenance */}
          {ragResult.citations && ragResult.citations.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-muted-text block">
                प्रामाणिक पाण्डुलिपि प्रमाण एवं स्रोत ({ragResult.citations.length} Verified Sources):
              </span>
              <div className="space-y-2">
                {ragResult.citations.map((c, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-muted-area/50 border border-border-theme text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-foreground">{c.granthaTitle} ({c.verseRef})</span>
                      <span className="text-[10px] text-primary font-black bg-primary/10 px-2 py-0.5 rounded">
                        {c.sourceId}
                      </span>
                    </div>
                    <p className="font-serif text-xs text-muted-text italic">"{c.excerpt}"</p>
                    <p className="text-[10px] text-muted-text">अभिलेख स्थान: {c.location}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
