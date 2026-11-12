import React from "react";
import { BookOpen, Sparkles, Quote, Copy, Check } from "lucide-react";
import { ScriptureReference } from "@/src/types";
import { toast } from "sonner";

interface ScriptureReferenceBoxProps {
  references: ScriptureReference[];
}

export const ScriptureReferenceBox: React.FC<ScriptureReferenceBoxProps> = ({ references }) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!references || references.length === 0) return null;

  const handleCopy = (ref: ScriptureReference, idx: number) => {
    const textToCopy = `${ref.text} ${ref.chapter ? `(${ref.chapter}:${ref.verse || ''})` : ''}\n${ref.devanagariText || ''}\n${ref.englishTranslation || ref.nepaliTranslation || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(`ref_${idx}`);
    toast.success("Scripture citation copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="my-8 space-y-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
        <BookOpen className="w-4 h-4" />
        <span>Canonical Scriptural References (शास्त्रीय प्रमाण)</span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {references.map((ref, idx) => (
          <div
            key={idx}
            className="relative bg-muted-area/40 border-l-4 border-l-primary border-y border-r border-border-theme/60 rounded-r-[var(--sm-radius,12px)] p-5 transition-all hover:bg-muted-area/60"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <span className="text-xs font-black tracking-wide text-primary uppercase">
                  {ref.text}
                </span>
                {(ref.bookOrKanda || ref.chapter || ref.verse) && (
                  <span className="text-xs text-muted-text font-medium ml-2">
                    {[ref.bookOrKanda, ref.chapter ? `Chapter ${ref.chapter}` : null, ref.verse ? `Verse ${ref.verse}` : null].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>

              <button
                onClick={() => handleCopy(ref, idx)}
                className="p-1 rounded text-muted-text hover:text-primary transition-colors"
                title="Copy Citation"
              >
                {copiedId === `ref_${idx}` ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {ref.devanagariText && (
              <div className="text-lg md:text-xl font-serif text-main-text font-semibold my-2 leading-relaxed tracking-wide text-center bg-card-bg/60 p-3 rounded border border-border-theme/30">
                {ref.devanagariText}
              </div>
            )}

            {ref.transliteration && (
              <div className="text-xs italic text-muted-text font-mono text-center mb-3">
                {ref.transliteration}
              </div>
            )}

            {ref.englishTranslation && (
              <div className="text-sm text-main-text leading-relaxed mt-2 flex gap-2">
                <Quote className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{ref.englishTranslation}</span>
              </div>
            )}

            {ref.nepaliTranslation && (
              <div className="text-sm text-muted-text leading-relaxed mt-2 pl-6">
                <strong>नेपाली अनुवाद: </strong> {ref.nepaliTranslation}
              </div>
            )}

            {ref.commentaryBy && (
              <div className="mt-3 pt-2 border-t border-border-theme/30 text-xxs text-muted-text">
                Commentary: {ref.commentaryBy}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
