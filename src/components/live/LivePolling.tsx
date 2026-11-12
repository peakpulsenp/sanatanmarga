import { useState, useEffect } from "react";
import { Vote, CheckCircle2, BarChart2, Users, Sparkles, Clock } from "lucide-react";
import { toast } from "sonner";

export interface LivePollOption {
  id: string;
  labelNe: string;
  labelEn: string;
  votes: number;
}

export interface LivePoll {
  id: string;
  questionNe: string;
  questionEn: string;
  category: string;
  totalVotes: number;
  isActive: boolean;
  endsInMinutes?: number;
  options: LivePollOption[];
}

interface LivePollingProps {
  videoId?: string;
  className?: string;
}

const INITIAL_POLLS: LivePoll[] = [
  {
    id: "poll-fuel-prices-2082",
    questionNe: "के स्वचालित मूल्य प्रणाली अनुसार नेपाल आयल निगमले पेट्रोलियम पदार्थको मूल्य अझै घटाउनुपर्छ?",
    questionEn: "Should Nepal Oil Corporation further reduce petroleum prices in line with auto-pricing?",
    category: "अर्थतन्त्र तथा जनचासो (Economy)",
    totalVotes: 3420,
    isActive: true,
    endsInMinutes: 45,
    options: [
      { id: "opt-1", labelNe: "अवश्य घटाउनुपर्छ (Yes, immediately)", labelEn: "Yes, immediately", votes: 2462 },
      { id: "opt-2", labelNe: "अहिलेको मूल्य यथार्थपरक छ (Current is realistic)", labelEn: "Current is realistic", votes: 684 },
      { id: "opt-3", labelNe: "निगमको घाटा अनुसार समायोजन होस् (Depends on NOC reserves)", labelEn: "Adjust as per NOC reserves", votes: 274 }
    ]
  },
  {
    id: "poll-parliament-debate",
    questionNe: "संसद्को जारी बजेट छलफलमा सांसदहरूको जनसरोकार सम्बोधन कस्तो पाउनुभयो?",
    questionEn: "How do you rate parliamentarians' focus on public welfare in the ongoing session?",
    category: "संसदीय विशेष (Parliament Special)",
    totalVotes: 1890,
    isActive: true,
    endsInMinutes: 120,
    options: [
      { id: "opt-a", labelNe: "सन्तोषजनक (Satisfactory)", labelEn: "Satisfactory", votes: 415 },
      { id: "opt-b", labelNe: "सुधार आवश्यक (Needs major improvement)", labelEn: "Needs major improvement", votes: 1280 },
      { id: "opt-c", labelNe: "दलगत स्वार्थ केन्द्रित (Partisan bias)", labelEn: "Partisan bias", votes: 195 }
    ]
  }
];

export default function LivePolling({ videoId, className = "" }: LivePollingProps) {
  const [polls, setPolls] = useState<LivePoll[]>(() => {
    try {
      const saved = localStorage.getItem("sanatan_live_polls");
      return saved ? JSON.parse(saved) : INITIAL_POLLS;
    } catch {
      return INITIAL_POLLS;
    }
  });

  const [userVotes, setUserVotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("sanatan_user_poll_votes");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleVote = (pollId: string, optionId: string) => {
    if (userVotes[pollId]) {
      toast.info("तपाईंले यो पोलमा पहिले नै मतदान गरिसक्नुभएको छ");
      return;
    }

    const updatedPolls = polls.map(p => {
      if (p.id === pollId) {
        const nextOptions = p.options.map(opt => {
          if (opt.id === optionId) {
            return { ...opt, votes: opt.votes + 1 };
          }
          return opt;
        });
        return {
          ...p,
          totalVotes: p.totalVotes + 1,
          options: nextOptions
        };
      }
      return p;
    });

    const nextUserVotes = { ...userVotes, [pollId]: optionId };
    setPolls(updatedPolls);
    setUserVotes(nextUserVotes);

    try {
      localStorage.setItem("sanatan_live_polls", JSON.stringify(updatedPolls));
      localStorage.setItem("sanatan_user_poll_votes", JSON.stringify(nextUserVotes));
    } catch {}

    toast.success("मतदान सुरक्षित गरियो! (Vote recorded in live tally)");
  };

  return (
    <div className={`space-y-4 ${className}`} id="live-broadcast-polling-panel">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-black">
            <Vote size={17} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">प्रत्यक्ष जनमत (Live Newsroom Polling)</h3>
            <span className="text-[10px] text-zinc-400 font-mono">Broadcast Studio Audience Tally</span>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {polls.map((poll) => {
          const hasVoted = Boolean(userVotes[poll.id]);
          const selectedOption = userVotes[poll.id];

          return (
            <div 
              key={poll.id} 
              className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all shadow-lg"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-sans font-bold">
                    {poll.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> समाप्त हुन: {poll.endsInMinutes} मिनेट
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-black text-zinc-100 leading-snug">
                  {poll.questionNe}
                </h4>
              </div>

              {/* OPTIONS LIST */}
              <div className="space-y-2">
                {poll.options.map((opt) => {
                  const percentage = poll.totalVotes > 0 
                    ? Math.round((opt.votes / poll.totalVotes) * 100) 
                    : 0;
                  const isSelected = selectedOption === opt.id;

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleVote(poll.id, opt.id)}
                      disabled={hasVoted}
                      className={`w-full relative overflow-hidden rounded-xl border p-3 text-left transition-all cursor-pointer ${
                        isSelected 
                          ? "border-amber-500 bg-amber-500/10 text-white font-bold" 
                          : hasVoted
                          ? "border-zinc-800/80 bg-zinc-950/60 text-zinc-300 cursor-default"
                          : "border-zinc-800 bg-zinc-950/80 hover:border-amber-500/50 hover:bg-zinc-900 text-zinc-200"
                      }`}
                    >
                      {/* VOTE PERCENTAGE FILL BAR (VISIBLE AFTER VOTING OR CONTINUOUS) */}
                      <div 
                        className={`absolute inset-y-0 left-0 transition-all duration-700 ${
                          isSelected ? "bg-amber-500/20" : "bg-zinc-800/40"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />

                      <div className="relative z-10 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          {isSelected && <CheckCircle2 size={14} className="text-amber-400 shrink-0" />}
                          <span className="truncate">{opt.labelNe}</span>
                        </div>
                        <span className="font-mono font-bold text-amber-400 shrink-0">
                          {percentage}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* FOOTER STATS */}
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span className="flex items-center gap-1">
                  <Users size={12} /> कुल मत: {poll.totalVotes.toLocaleString("ne-NP")}
                </span>
                {hasVoted ? (
                  <span className="text-emerald-400 font-bold">✓ मतदान सम्पन्न</span>
                ) : (
                  <span className="text-amber-400 font-bold">विकल्प चयन गरी मत दिनुहोस्</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
