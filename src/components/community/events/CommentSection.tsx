import { useState } from "react";
import { Send, User } from "lucide-react";
import { useAuth } from "@/src/lib/auth";
import { serverTimestamp } from "@/src/lib/firebase";
import { addDocWithQueue } from "@/src/lib/offlineQueue";
import { db } from "@/src/lib/firebase";

interface Comment { id: string; userName: string; content: string; }

export default function CommentSection({ eventId, comments }: { eventId: string, comments: Comment[] }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await addDocWithQueue("event_comments", {
        eventId, userId: user?.uid || "anonymous",
        userName: user?.displayName || user?.email || "अज्ञात",
        content: text.trim(), createdAt: serverTimestamp()
      });
      setText("");
    } catch (err: any) {
      console.error("Error posting event comment:", err);
      setError("प्रतिक्रिया पठाउन असफल भयो।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card p-8 rounded-4xl border border-border-theme flex flex-col gap-6 shadow-sm">
      <h3 className="text-2xl font-black text-card-foreground uppercase tracking-tight">प्रतिक्रिया</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="text-xs font-bold text-red-500">{error}</p>}
        <div className="flex gap-4">
          <input
            value={text} onChange={(e) => setText(e.target.value)}
            disabled={isSubmitting}
            placeholder="तपाईंको विचार..."
            className="flex-grow bg-muted-area border-none rounded-2xl py-4 px-6 text-sm outline-none text-card-foreground focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <button 
            type="submit" 
            disabled={isSubmitting || !text.trim()}
            className="bg-primary text-white p-4 rounded-2xl shadow-xl shadow-primary/20 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
      <div className="flex flex-col gap-4">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-4 p-5 bg-muted-area rounded-2xl">
            <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center text-muted-text"><User size={20} /></div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-card-foreground">{c.userName}</span>
              <p className="text-sm text-muted-text">{c.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
