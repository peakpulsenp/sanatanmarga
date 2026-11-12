import { useState } from "react";
import { serverTimestamp } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { X, AlertTriangle, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { addDocWithQueue } from "@/src/lib/offlineQueue";
import { ReportReason } from "@/src/types";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: "post" | "comment";
  targetTitle: string;
  targetContent: string;
}

const REASONS: { value: ReportReason; label: string; desc: string }[] = [
  { value: "spam", label: "Spam / स्पाम", desc: "Repeated, commercial, or robotic content." },
  { value: "harassment", label: "Harassment / दुर्व्यवहार", desc: "Attacking, bullying, or targeting individuals." },
  { value: "hate_speech", label: "Hate Speech / घृणास्पद अभिव्यक्ति", desc: "Disparaging based on identity, group, or beliefs." },
  { value: "violence", label: "Violence / हिंसा", desc: "Incitement to violence, self-harm, or physical threat." },
  { value: "misinformation", label: "Misinformation / भ्रमक जानकारी", desc: "Blatantly false, dangerous, or manipulative content." },
  { value: "other", label: "Other / अन्य", desc: "Any other violation of Chautari community norms." },
];

export default function ReportModal({
  isOpen,
  onClose,
  targetId,
  targetType,
  targetTitle,
  targetContent,
}: ReportModalProps) {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to report content.");
      return;
    }
    if (!selectedReason) {
      toast.error("Please select a reason for reporting.");
      return;
    }

    setLoading(true);
    try {
      await addDocWithQueue("reports", {
        reporterId: user.uid,
        reporterName: user.displayName || "Anonymous User",
        targetType,
        targetId,
        targetTitle: targetTitle || (targetType === "comment" ? "Comment" : "Untitled Post"),
        targetContent: targetContent || "",
        reason: selectedReason,
        description: description.trim(),
        status: "open",
        createdAt: serverTimestamp(),
      });

      toast.success("Thank you. Report submitted successfully to Sanatan Media moderators.");
      setSelectedReason(null);
      setDescription("");
      onClose();
    } catch (err: any) {
      console.error("Report submit error:", err);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border-theme overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-theme bg-muted-area/30">
              <div className="flex items-center gap-2 text-amber-500">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
                <h2 className="text-xs font-black uppercase tracking-widest text-card-foreground">
                  Report Community Content
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-muted-area rounded-lg flex items-center gap-1 text-muted-text text-xs font-bold transition-colors"
              >
                <X size={16} /> Close
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {/* Target Snippet */}
              <div className="p-3.5 bg-amber-500/5 rounded-xl border border-amber-500/10 space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Flagging Content
                </p>
                <p className="text-xs font-bold text-card-foreground line-clamp-1">
                  {targetType === "post" ? `Post: "${targetTitle}"` : `Comment by author`}
                </p>
                <p className="text-xs text-muted-text line-clamp-2 italic">
                  "{targetContent}"
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-muted-text mb-2.5">
                    Select Reason / कारण रोज्नुहोस्
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {REASONS.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setSelectedReason(r.value)}
                        className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                          selectedReason === r.value
                            ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20"
                            : "bg-muted-area/20 border-border-theme/60 hover:bg-muted-area/40 hover:border-border-theme"
                        }`}
                      >
                        <span className="text-xs font-black text-card-foreground">
                          {r.label}
                        </span>
                        <span className="text-[10px] text-muted-text mt-0.5">
                          {r.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-muted-text mb-1.5">
                    Additional Details (Optional) / थप विवरण (ऐच्छिक)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Provide context or links that might help our moderators..."
                    className="w-full text-xs p-3 rounded-xl border border-border-theme bg-muted-area/20 text-foreground placeholder:text-muted-text/50 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 bg-muted-area text-muted-text rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-muted-area/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedReason}
                    className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
                  >
                    {loading ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
