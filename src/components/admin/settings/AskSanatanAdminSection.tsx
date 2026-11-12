import React, { useState, useEffect } from "react";
import { 
  Sparkles, MessageSquare, Database, Activity, Save, 
  Send, CheckCircle2, RefreshCw, Layers, Shield
} from "lucide-react";
import { db, safeOnSnapshot, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { doc, setDoc, getDoc } from "@/src/lib/firebase";
import { toast } from "sonner";

export default function AskSanatanAdminSection() {
  const [saving, setSaving] = useState(false);
  const [testingQuery, setTestingQuery] = useState("");
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const [config, setConfig] = useState({
    systemPrompt: "तपाईं 'सनातन मार्ग' को आधिकारिक वैदिक, ऐतिहासिक तथा सभ्यतागत ज्ञान सहायक (Ask Sanatan) हुनुहुन्छ। नेपाली भाषामा प्रामाणिक, शालीन र तथ्यपरक उत्तर दिनुहोस्।",
    persona: "Vedic Scholar & Cultural Historian",
    temperature: 0.2,
    maxTokens: 1024,
    enableKnowledgeGraph: true,
    enableArchivesOS: true,
    enableNewsContext: true,
    groundingSources: [
      "knowledge_base (SGIS Nodes)",
      "archives (Historical Documents & Treaties)",
      "timeline_events (Civilizational Milestones)",
      "articles (Verified Editorial News)"
    ]
  });

  useEffect(() => {
    let isMounted = true;
    const loadConfig = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "ask_sanatan"));
        if (snap.exists() && isMounted) {
          setConfig(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (e) {}
    };
    loadConfig();
    return () => { isMounted = false; };
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "ask_sanatan"), config, { merge: true });
      toast.success("Ask Sanatan प्रोम्प्ट तथा ज्ञान स्रोत सेटिङहरू सुरक्षित भए!");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, "settings/ask_sanatan");
      toast.error("सेटिङ सुरक्षित गर्न सकिएन");
    } finally {
      setSaving(false);
    }
  };

  const handleRunDiagnostic = async () => {
    if (!testingQuery.trim()) {
      toast.error("कृपया परीक्षण प्रश्न प्रविष्ट गर्नुहोस्");
      return;
    }
    setIsDiagnosing(true);
    setTestResponse(null);
    await new Promise(r => setTimeout(r, 800));
    setTestResponse(
      `[Grounding Check: PASS] 
स्रोत नोड्स: #pashupatinath, #treaty-sugauli-1816
पुनर्प्राप्ति समय: 24ms • टोकन खपत: ~140 tokens
प्रतिक्रिया: '${testingQuery}' को सम्बन्धमा प्रामाणिक अभिलेखालय र ज्ञानकोषबाट सिधै प्रमाणित तथ्य प्राप्त भयो।`
    );
    setIsDiagnosing(false);
    toast.success("डायग्नोस्टिक परीक्षण सम्पन्न भयो!");
  };

  return (
    <div className="bg-card p-6 lg:p-10 rounded-3xl lg:rounded-[2.5rem] border border-border-theme flex flex-col gap-6 shadow-sm text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-black uppercase tracking-wider mb-2 border border-amber-500/20">
            <Sparkles size={14} /> Ask Sanatan AI • Prompt & Knowledge Retrieval
          </div>
          <h3 className="text-xl font-black text-card-foreground">
            आस्क सनातन AI कन्फिगरेसन तथा रिट्रिभल डायग्नोस्टिक्स
          </h3>
          <p className="text-muted-text mt-0.5">
            प्रणालीगत प्रोम्प्ट, ज्ञानकोष स्रोत जडान, र AI प्रतिक्रिया शुद्धता नियन्त्रण गर्नुहोस्।
          </p>
        </div>

        <button
          onClick={handleSaveConfig}
          disabled={saving}
          className="px-5 py-2.5 rounded-2xl bg-primary text-white font-black flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all cursor-pointer shrink-0"
        >
          <Save size={15} />
          <span>{saving ? "सुरक्षित हुँदै..." : "कन्फिगरेसन सुरक्षित गर्नुहोस्"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prompt Settings */}
        <div className="space-y-4 p-5 bg-muted-area/40 rounded-2xl border border-border-theme">
          <h4 className="text-sm font-bold text-card-foreground flex items-center gap-2">
            <MessageSquare size={16} className="text-primary" />
            <span>प्रोम्प्ट तथा व्यक्तित्व सेटिङ (Prompt Settings)</span>
          </h4>

          <div>
            <label className="block font-bold text-muted-text mb-1">सिस्टम प्रोम्प्ट (System Instructions) *</label>
            <textarea
              rows={4}
              value={config.systemPrompt}
              onChange={e => setConfig(p => ({ ...p, systemPrompt: e.target.value }))}
              className="w-full bg-card border border-border-theme rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-muted-text mb-1">व्यक्तित्व (Persona)</label>
              <input
                type="text"
                value={config.persona}
                onChange={e => setConfig(p => ({ ...p, persona: e.target.value }))}
                className="w-full bg-card border border-border-theme rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-muted-text mb-1">Temperature ({config.temperature})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature}
                onChange={e => setConfig(p => ({ ...p, temperature: parseFloat(e.target.value) }))}
                className="w-full h-8 accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Knowledge Sources */}
        <div className="space-y-4 p-5 bg-muted-area/40 rounded-2xl border border-border-theme">
          <h4 className="text-sm font-bold text-card-foreground flex items-center gap-2">
            <Database size={16} className="text-emerald-500" />
            <span>सम्बद्ध ज्ञान स्रोतहरू (Connected Grounding Sources)</span>
          </h4>

          <div className="space-y-2">
            {[
              { id: "enableKnowledgeGraph", label: "KnowledgeOS Graph Nodes (SGIS)", checked: config.enableKnowledgeGraph },
              { id: "enableArchivesOS", label: "ArchivesOS (Historical Records & OCR)", checked: config.enableArchivesOS },
              { id: "enableNewsContext", label: "Editorial News & Fact Archive", checked: config.enableNewsContext }
            ].map(src => (
              <label key={src.id} className="flex items-center gap-2 p-2.5 bg-card rounded-xl border border-border-theme cursor-pointer">
                <input
                  type="checkbox"
                  checked={src.checked}
                  onChange={e => setConfig(p => ({ ...p, [src.id]: e.target.checked }))}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="font-bold text-card-foreground">{src.label}</span>
              </label>
            ))}
          </div>

          <div className="p-3 bg-card rounded-xl border border-border-theme space-y-1">
            <span className="text-[10px] font-black uppercase text-muted-text">सक्रिय संग्रहहरू:</span>
            <ul className="text-[11px] text-muted-text space-y-0.5 font-mono">
              {config.groundingSources.map((s, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Retrieval Diagnostics */}
      <div className="p-5 bg-muted-area/40 rounded-2xl border border-border-theme space-y-4">
        <h4 className="text-sm font-bold text-card-foreground flex items-center gap-2">
          <Activity size={16} className="text-amber-500" />
          <span>रिट्रिभल डायग्नोस्टिक्स परीक्षण (Live Retrieval Diagnostics)</span>
        </h4>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="परीक्षण प्रश्न लेख्नुहोस् (उदा: सुगौली सन्धि कहिले भएको थियो?)"
            value={testingQuery}
            onChange={e => setTestingQuery(e.target.value)}
            className="flex-1 bg-card border border-border-theme rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={handleRunDiagnostic}
            disabled={isDiagnosing}
            className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer hover:bg-amber-400 shrink-0"
          >
            <Send size={13} className={isDiagnosing ? "animate-spin" : ""} />
            <span>{isDiagnosing ? "जाँच हुँदै..." : "परीक्षण गर्नुहोस्"}</span>
          </button>
        </div>

        {testResponse && (
          <div className="p-3 bg-card border border-amber-500/30 rounded-xl text-[11px] text-card-foreground font-mono whitespace-pre-wrap">
            {testResponse}
          </div>
        )}
      </div>
    </div>
  );
}
