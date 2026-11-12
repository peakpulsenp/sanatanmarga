import { useState } from "react";
import { 
  ShieldCheck, 
  Percent, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Plus, 
  Scale, 
  Sparkles,
  Info
} from "lucide-react";
import { DEFAULT_TAX_RULES, TaxRule } from "@/src/services/taxRuleEngine";
import { toast } from "sonner";

export default function TaxRulesConfigModule() {
  const [rules, setRules] = useState<TaxRule[]>(DEFAULT_TAX_RULES);
  const [editingRule, setEditingRule] = useState<TaxRule | null>(null);

  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(r => {
      if (r.id === id) {
        const updated = { ...r, enabled: !r.enabled };
        toast.info(`${r.nameNe} ${updated.enabled ? "सक्रिय गरियो" : "निष्क्रिय गरियो"}`);
        return updated;
      }
      return r;
    }));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    setRules(prev => prev.map(r => r.id === editingRule.id ? editingRule : r));
    setEditingRule(null);
    toast.success("कर नियम सफलतापूर्वक परिमार्जन भयो!");
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-theme pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-card-foreground">
              नेपाल कर नियम व्यवस्थापन इन्जिन (Tax Rules Configuration)
            </h2>
            <span className="text-xxs font-black bg-blue-500/10 text-blue-600 px-2.5 py-0.5 rounded-full border border-blue-500/20">
              IRD Rules
            </span>
          </div>
          <p className="text-xs text-muted-text mt-1">
            मूल्य अभिवृद्धि कर ऐन तथा आयकर ऐन अनुसार विज्ञापन सेवाहरूमा लागू हुने कर नियमहरूलाई गतिशील रूपमा व्यवस्थापन गर्नुहोस्।
          </p>
        </div>
      </div>

      {/* LEGAL DISCLAIMER CALLOUT (Required by Directive) */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
        <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600" />
        <div className="space-y-1">
          <div className="font-black text-sm">प्रणाली कर गणना तथा कानुनी सूचना (Legal Disclaimer)</div>
          <p className="leading-relaxed">
            यो प्रणालीमा कर गणना हालको नियम तथा आन्तरिक राजस्व विभाग (IRD) अभ्यास अनुसार स्वचालित गरिएको छ। वास्तविक कारोबार, संस्थागत प्रकृति र अग्रिम कर कट्टीको दायित्वको लागि सम्बन्धित प्रमाणित लेखा परीक्षक वा कर सल्लाहकारबाट प्रमाणीकरण गराउनु सिफारिस गरिन्छ।
          </p>
        </div>
      </div>

      {/* RULES CARDS */}
      <div className="grid grid-cols-1 gap-4">
        {rules.map((rule) => (
          <div 
            key={rule.id}
            className={`p-5 rounded-2xl border transition-all ${
              rule.enabled 
                ? "bg-card border-border-theme" 
                : "bg-muted-area/30 border-border-theme/60 opacity-70"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted-area text-purple-600 border border-border-theme">
                    {rule.code}
                  </span>
                  <h3 className="text-base font-black text-card-foreground">
                    {rule.nameNe}
                  </h3>
                  <span className="text-xs font-mono text-muted-text">({rule.nameEn})</span>
                </div>
                <p className="text-xs text-muted-text">{rule.descriptionNe}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-lg font-black text-card-foreground font-mono">
                    {rule.ratePct}%
                  </div>
                  <span className="text-[10px] text-muted-text block">लागू दर (Rate)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      rule.enabled
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-muted-area text-muted-text border-border-theme"
                    }`}
                  >
                    {rule.enabled ? "सक्रिय (Active)" : "निष्क्रिय (Disabled)"}
                  </button>
                  <button
                    onClick={() => setEditingRule(rule)}
                    className="p-2 rounded-xl bg-muted-area hover:bg-muted-area/80 text-card-foreground border border-border-theme cursor-pointer"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-info bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-border-theme text-xxs text-muted-text font-mono">
              <div>
                <span className="font-bold text-card-foreground">क्षेत्राधिकार:</span> {rule.jurisdiction}
              </div>
              <div>
                <span className="font-bold text-card-foreground">लागू मिति:</span> {rule.effectiveFrom} {rule.effectiveUntil ? `देखि ${rule.effectiveUntil}` : "(हालसम्म)"}
              </div>
              <div className="truncate">
                <span className="font-bold text-card-foreground">ऐन/कानुन:</span> {rule.legalReferenceNe}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* EDIT RULE MODAL */}
      {editingRule && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border-theme rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-theme pb-3">
              <h3 className="text-base font-black text-card-foreground">
                कर नियम परिमार्जन ({editingRule.code})
              </h3>
              <button onClick={() => setEditingRule(null)} className="p-1 text-muted-text hover:text-card-foreground">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-muted-text font-bold">नियमको नाम (नेपाली):</label>
                <input
                  type="text"
                  required
                  value={editingRule.nameNe}
                  onChange={e => setEditingRule({ ...editingRule, nameNe: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-muted-area/50 border border-border-theme"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-muted-text font-bold">कर प्रतिशत (Rate %):</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editingRule.ratePct}
                    onChange={e => setEditingRule({ ...editingRule, ratePct: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-muted-area/50 border border-border-theme font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-muted-text font-bold">लागू हुने मिति (Effective):</label>
                  <input
                    type="date"
                    required
                    value={editingRule.effectiveFrom}
                    onChange={e => setEditingRule({ ...editingRule, effectiveFrom: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted-area/50 border border-border-theme font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-muted-text font-bold">कानुनी सन्दर्भ (Legal Reference):</label>
                <input
                  type="text"
                  required
                  value={editingRule.legalReferenceNe}
                  onChange={e => setEditingRule({ ...editingRule, legalReferenceNe: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-muted-area/50 border border-border-theme"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-text font-bold">विवरण (Description):</label>
                <textarea
                  rows={2}
                  value={editingRule.descriptionNe}
                  onChange={e => setEditingRule({ ...editingRule, descriptionNe: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-muted-area/50 border border-border-theme"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2 rounded-xl bg-muted-area text-muted-text hover:text-card-foreground font-bold cursor-pointer"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-black cursor-pointer shadow-sm hover:opacity-90"
                >
                  परिमार्जन सुरक्षित गर्नुहोस्
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
