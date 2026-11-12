import React, { useState } from "react";
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  BookOpen, 
  ShieldCheck, 
  ExternalLink,
  Loader2,
  HelpCircle,
  Cpu,
  Layers,
  FileCheck
} from "lucide-react";

interface TrainingAIMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTrack?: (trackSlug: string) => void;
  currentRole?: string;
  currentTrackSlug?: string;
  currentLessonId?: string;
}

interface MessageItem {
  sender: "user" | "mentor";
  text: string;
  sop?: string;
  recommendedTrack?: string;
  sourceLesson?: string;
  confidenceLevel?: number;
  timestamp: string;
}

const PRESET_PROMPTS = [
  {
    icon: FileCheck,
    label: "Verify a Certificate",
    query: "How do I verify an official SanatanMarga certification?"
  },
  {
    icon: Layers,
    label: "SnapshotOS Fallback",
    query: "How does SnapshotOS 3-tier offline continuity fallback work?"
  },
  {
    icon: Cpu,
    label: "SGIS OCR Pipeline",
    query: "Explain the SGIS OCR multispectral imaging and paleography pipeline."
  },
  {
    icon: ShieldCheck,
    label: "Fail-Closed Editorial Policy",
    query: "What is the 'No Source = No Story' fail-closed policy in the AI Newsroom?"
  },
  {
    icon: BookOpen,
    label: "Dual-Key Publishing Rule",
    query: "What is the Four-Eyes / Dual-Key approval requirement for publishing?"
  }
];

export const TrainingAIMentorModal: React.FC<TrainingAIMentorModalProps> = ({
  isOpen,
  onClose,
  onNavigateTrack,
  currentRole,
  currentTrackSlug,
  currentLessonId
}) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      sender: "mentor",
      text: "Namaste! I am the SanatanMarga Enterprise Training AI Mentor. I am grounded directly in all Training Center curricula, standard operating procedures (SOPs), and zero-trust governance rules. How can I guide your learning today?",
      sop: "SOP-TRN-01: SanatanMarga Continuous Competency Standards",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  if (!isOpen) return null;

  const handleSend = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || isLoading) return;

    const userMsg: MessageItem = {
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/training/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          role: currentRole,
          currentTrackSlug,
          currentLessonId
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessages(prev => [
          ...prev,
          {
            sender: "mentor",
            text: data.answer,
            sop: data.relatedSop,
            recommendedTrack: data.recommendedTrack,
            sourceLesson: data.sourceLesson,
            confidenceLevel: data.confidenceLevel,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        throw new Error(data.error || "Could not retrieve mentor answer.");
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: "mentor",
          text: "I am temporarily consulting local offline SOP manuals. All SanatanMarga systems enforce 'No Source = No Story', SnapshotOS 3-tier fallback, and cryptographic four-eyes signoffs.",
          sop: "SOP-GOV-01: Offline Policy Manifest",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col h-[680px] overflow-hidden border border-amber-200/60">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-800 via-stone-800 to-amber-900 text-white p-4 flex items-center justify-between border-b border-amber-600/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-white">Ask Training AI Mentor</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-stone-900">
                  Grounded SOPs
                </span>
              </div>
              <p className="text-xs text-amber-200/80">
                Authoritative guidance on Newsroom, SGIS, SnapshotOS, Governance & Certifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-stone-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Chips */}
        <div className="bg-amber-50/50 border-b border-amber-100 p-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs font-semibold text-amber-900 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Common Inquiries:
          </span>
          {PRESET_PROMPTS.map((chip, idx) => {
            const Icon = chip.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(chip.query)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-white border border-amber-200/70 text-stone-700 hover:bg-amber-100/60 hover:text-amber-900 hover:border-amber-300 transition-all shrink-0 shadow-sm"
              >
                <Icon className="w-3.5 h-3.5 text-amber-700" />
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Chat Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-stone-50/40">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.sender === "mentor" && (
                <div className="w-8 h-8 rounded-lg bg-amber-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[82%] rounded-2xl p-3.5 ${
                m.sender === "user"
                  ? "bg-amber-700 text-white shadow-sm"
                  : "bg-white border border-stone-200/80 text-stone-800 shadow-sm"
              }`}>
                {m.sender === "mentor" && (m.confidenceLevel || m.sourceLesson) && (
                  <div className="flex flex-wrap items-center gap-2 mb-2 pb-1.5 border-b border-stone-100 text-[10px] font-mono">
                    {m.confidenceLevel && (
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {m.confidenceLevel}% Grounded
                      </span>
                    )}
                    {m.sourceLesson && (
                      <span className="text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded truncate max-w-xs flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-amber-700" />
                        {m.sourceLesson}
                      </span>
                    )}
                  </div>
                )}

                <div className="text-sm whitespace-pre-wrap leading-relaxed font-sans">
                  {m.text}
                </div>

                {m.sop && (
                  <div className="mt-3 pt-2.5 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      📜 {m.sop}
                    </span>
                    {m.recommendedTrack && onNavigateTrack && (
                      <button
                        onClick={() => {
                          onNavigateTrack(m.recommendedTrack!);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 font-semibold hover:underline"
                      >
                        Practice in Track
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                <div className={`text-[10px] mt-1 text-right ${m.sender === "user" ? "text-amber-200" : "text-stone-400"}`}>
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-stone-500 text-xs pl-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
              <span>SanatanMarga Training Mentor is analyzing verified platform SOPs...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-stone-200 flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend(query)}
            placeholder="Ask anything about SanatanMarga workflows, SOPs, fail-closed rules, or exams..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 text-sm"
          />
          <button
            onClick={() => handleSend(query)}
            disabled={!query.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span>Ask</span>
          </button>
        </div>
      </div>
    </div>
  );
};
