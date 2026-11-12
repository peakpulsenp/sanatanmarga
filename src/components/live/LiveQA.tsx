import { useState } from "react";
import { MessageSquare, ThumbsUp, Send, ShieldCheck, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export interface LiveQuestion {
  id: string;
  authorName: string;
  district?: string;
  question: string;
  upvotes: number;
  status: "pending" | "approved" | "answered";
  timestamp: string;
}

interface LiveQAProps {
  videoId?: string;
  className?: string;
}

const INITIAL_QUESTIONS: LiveQuestion[] = [
  {
    id: "q-1",
    authorName: "रमेश आचार्य",
    district: "Kaski",
    question: "पोखरा क्षेत्रीय अन्तर्राष्ट्रिय विमानस्थलबाट नियमित अन्तर्राष्ट्रिय उडान सञ्चालन गर्ने विषयमा सरकारको पछिल्लो निर्णय के छ?",
    upvotes: 42,
    status: "approved",
    timestamp: "५ मिनेट अगाडि"
  },
  {
    id: "q-2",
    authorName: "सुमित्रा दाहाल",
    district: "Kathmandu",
    question: "काठमाडौँ उपत्यकाको फोहोर व्यवस्थापनका लागि दीर्घकालीन प्लान्ट निर्माण कार्य कुन चरणमा पुगेको छ?",
    upvotes: 29,
    status: "approved",
    timestamp: "१२ मिनेट अगाडि"
  },
  {
    id: "q-3",
    authorName: "गोविन्द न्यौपाने",
    district: "Chitwan",
    question: "नारायणगढ-बुटवल सडक खण्डको विस्तार कार्य कहिलेसम्म सम्पन्न हुने सम्झौता छ?",
    upvotes: 18,
    status: "answered",
    timestamp: "२० मिनेट अगाडि"
  }
];

export default function LiveQA({ videoId, className = "" }: LiveQAProps) {
  const [questions, setQuestions] = useState<LiveQuestion[]>(INITIAL_QUESTIONS);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [district, setDistrict] = useState("Kathmandu");
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) {
      toast.error("कृपया प्रश्न लेख्नुहोस्");
      return;
    }

    const newQ: LiveQuestion = {
      id: `q-${Date.now()}`,
      authorName: authorName.trim() || "अज्ञात दर्शक (Viewer)",
      district: district,
      question: newQuestionText.trim(),
      upvotes: 1,
      status: "pending",
      timestamp: "भर्खरै (Just now)"
    };

    setQuestions([newQ, ...questions]);
    setNewQuestionText("");
    toast.success("तपाईंको प्रश्न सम्पादकीय टोलीमा पठाइयो (Question sent to Moderation Queue)");
  };

  const handleUpvote = (qId: string) => {
    if (upvotedIds.has(qId)) {
      toast.info("तपाईंले पहिले नै समर्थन गरिसक्नुभएको छ");
      return;
    }

    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return { ...q, upvotes: q.upvotes + 1 };
      }
      return q;
    }));

    setUpvotedIds(new Set([...upvotedIds, qId]));
    toast.success("प्रश्नलाई समर्थन गरियो (+1)");
  };

  return (
    <div className={`space-y-4 ${className}`} id="live-broadcast-qa-panel">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-black">
            <MessageSquare size={17} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">प्रत्यक्ष प्रश्नोत्तर (Live Broadcast Q&A)</h3>
            <span className="text-[10px] text-zinc-400 font-mono">Moderated Newsroom Audience Queue</span>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
          <ShieldCheck size={11} /> MODERATED
        </span>
      </div>

      {/* QUESTION INPUT FORM */}
      <form onSubmit={handleSubmit} className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input 
            type="text"
            placeholder="तपाईंको नाम (Your Name)..."
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none"
          />
          <input 
            type="text"
            placeholder="जिल्ला (District)..."
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <input 
            type="text"
            placeholder="प्रस्तोता वा अतिथिलाई सोध्नुहोस् (Ask broadcaster / guest)..."
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <Send size={13} />
            <span className="hidden sm:inline">पठाउनुहोस्</span>
          </button>
        </div>
      </form>

      {/* QUESTIONS STREAM */}
      <div className="space-y-2.5">
        {questions.map((q) => {
          const isUpvoted = upvotedIds.has(q.id);

          return (
            <div 
              key={q.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                q.status === "answered" 
                  ? "bg-zinc-900/40 border-zinc-800/60 opacity-80" 
                  : q.status === "approved"
                  ? "bg-zinc-900/90 border-zinc-800 hover:border-zinc-700"
                  : "bg-amber-500/5 border-amber-500/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-bold text-zinc-200">{q.authorName}</span>
                    {q.district && (
                      <span className="text-zinc-400 font-mono">({q.district})</span>
                    )}
                    <span className="text-zinc-400">• {q.timestamp}</span>

                    {q.status === "answered" && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                        ✓ उत्तर दिइएको (Answered On Air)
                      </span>
                    )}
                    {q.status === "pending" && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                        समीक्षा हुँदै (Under Review)
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-100 leading-snug">
                    {q.question}
                  </p>
                </div>

                {/* UPVOTE BUTTON */}
                <button
                  onClick={() => handleUpvote(q.id)}
                  className={`flex flex-col items-center px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    isUpvoted
                      ? "bg-blue-600/20 border-blue-500 text-blue-400"
                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <ThumbsUp size={13} className={isUpvoted ? "fill-current" : ""} />
                  <span className="font-mono text-xs font-bold mt-0.5">{q.upvotes}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
