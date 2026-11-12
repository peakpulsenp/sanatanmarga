import { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  EyeOff, 
  Pin, 
  PinOff,
  Flag, 
  Reply, 
  Users, 
  ShieldCheck, 
  Award, 
  X, 
  MoreVertical, 
  VolumeX, 
  Ban, 
  Clock, 
  Search,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { 
  LiveChatMessage, 
  LiveStreamSettings, 
  LiveParticipant, 
  LiveChatPresentation 
} from "../../types/live";
import { LiveService } from "../../services/liveService";
import NepaliInput from "../ui/NepaliInput";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface LiveChatProps {
  liveVideoId: string;
  settings?: LiveStreamSettings;
  className?: string;
  presentation?: LiveChatPresentation;
  onChangePresentation?: (mode: LiveChatPresentation) => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

const REACTION_EMOJIS = ["🙏", "❤️", "🔥", "👏", "🇳🇵", "🚩"];

export default function LiveChat({ 
  liveVideoId, 
  settings, 
  className = "", 
  presentation = "side",
  onChangePresentation,
  isMobileDrawer = false,
  onCloseMobileDrawer
}: LiveChatProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"chat" | "participants">("chat");
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [participants, setParticipants] = useState<LiveParticipant[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<LiveChatMessage | null>(null);
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null);
  const [reportingMessage, setReportingMessage] = useState<LiveChatMessage | null>(null);
  const [reportReason, setReportReason] = useState<"spam" | "hate" | "misinformation" | "harassment" | "other">("spam");
  const [selectedUserForMod, setSelectedUserForMod] = useState<LiveParticipant | null>(null);
  const [participantSearch, setParticipantSearch] = useState("");
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastSentAtRef = useRef<number>(0);

  const isStaff = user && ["super_admin", "admin", "chief_editor", "editor", "moderator"].includes(user.role);
  const isMuted = user && participants.find(p => p.userId === user.uid)?.isMuted;
  const isBanned = user && participants.find(p => p.userId === user.uid)?.isBanned;

  // Poll chat messages & participants every 3.5s
  useEffect(() => {
    if (!liveVideoId) return;

    let isMounted = true;
    const fetchChatAndParticipants = async () => {
      const fetchedMsgs = await LiveService.getChatMessages(liveVideoId);
      const fetchedParticipants = LiveService.getParticipants(liveVideoId);
      const pinnedId = LiveService.getPinnedMessageId(liveVideoId);

      if (isMounted) {
        setMessages(fetchedMsgs);
        setParticipants(fetchedParticipants);
        setPinnedMessageId(pinnedId);
      }
    };

    fetchChatAndParticipants();
    const interval = setInterval(fetchChatAndParticipants, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [liveVideoId]);

  // Auto scroll to bottom
  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, activeTab]);

  // Cooldown timer interval
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setTimeout(() => {
      setCooldownRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldownRemaining]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      toast.error("लाइभ च्याटमा सन्देश पठाउन साइन इन आवश्यक छ (Sign in required)");
      return;
    }

    if (isBanned) {
      toast.error("तपाईंलाई यो च्याटबाट प्रतिबन्ध गरिएको छ (Account restricted)");
      return;
    }

    if (isMuted) {
      toast.error("तपाईं हाल म्यूट हुनुहुन्छ (You are temporarily muted)");
      return;
    }

    const trimmed = inputText.trim();
    if (!trimmed) return;

    // Slow mode enforcement
    const now = Date.now();
    const slowModeSec = settings?.slowModeSeconds || 3;
    const cooldown = slowModeSec * 1000;
    if (now - lastSentAtRef.current < cooldown) {
      const waitTime = Math.ceil((cooldown - (now - lastSentAtRef.current)) / 1000);
      setCooldownRemaining(waitTime);
      toast.warning(`कृपया ${waitTime} सेकेन्ड पर्खनुहोस्`);
      return;
    }

    // Link block check if disabled in settings
    if (!settings?.allowLinks && /(https?:\/\/|www\.)[^\s]+/gi.test(trimmed)) {
      toast.error("च्याटमा बाह्य लिङ्क राख्न अनुमति छैन (Links disabled)");
      return;
    }

    setIsSubmitting(true);
    lastSentAtRef.current = now;
    setCooldownRemaining(slowModeSec);

    try {
      const newMsg = await LiveService.sendChatMessage({
        liveVideoId,
        userId: user.uid,
        displayName: user.displayName || user.email?.split("@")[0] || "नागरिक श्रोता",
        avatarUrl: user.photoURL || undefined,
        message: trimmed,
        role: user.role,
        membershipTier: (user.membershipTier as any) || "free",
        replyTo: replyingTo ? {
          messageId: replyingTo.id,
          displayName: replyingTo.displayName,
          snippet: replyingTo.message.substring(0, 40)
        } : undefined
      });

      if (newMsg) {
        setMessages(prev => [...prev, newMsg]);
        setInputText("");
        setReplyingTo(null);
      }
    } catch (err) {
      toast.error("सन्देश पठाउन सकिएन");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!user) {
      toast.error("प्रतिक्रिया दिन साइन इन आवश्यक छ");
      return;
    }
    await LiveService.reactToChatMessage(messageId, liveVideoId, emoji, user.uid);
    // Optimistic update locally
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const reactions = { ...(m.reactions || {}) };
      reactions[emoji] = (reactions[emoji] || 0) + 1;
      return { ...m, reactions };
    }));
  };

  const handlePin = async (msgId: string) => {
    if (!user || !isStaff) return;
    const isAlreadyPinned = pinnedMessageId === msgId;
    const nextState = !isAlreadyPinned;
    await LiveService.pinChatMessage(msgId, liveVideoId, nextState, user.uid, user.displayName || "सञ्चालक");
    setPinnedMessageId(nextState ? msgId : null);
    toast.success(nextState ? "सन्देश पिन गरियो" : "पिन हटाइयो");
  };

  const handleModerate = async (msgId: string, action: "hide" | "delete") => {
    if (!user || !isStaff) return;
    const success = await LiveService.moderateChatMessage(msgId, action, user.uid, user.displayName || "सञ्चालक");
    if (success) {
      setMessages(prev => prev.filter(m => m.id !== msgId));
      toast.success(action === "delete" ? "सन्देश मेटियो" : "सन्देश लुकाइयो");
    }
  };

  const handleSubmitReport = async () => {
    if (!reportingMessage || !user) return;
    await LiveService.reportChatMessage({
      messageId: reportingMessage.id,
      liveVideoId,
      reporterUserId: user.uid,
      reason: reportReason
    });
    setReportingMessage(null);
    toast.success("रिपोर्ट दर्ता भयो। सम्पादकीय टोलीले समीक्षा गर्नेछ।");
  };

  const handleMuteUser = (participant: LiveParticipant, minutes: number) => {
    if (!user || !isStaff) return;
    LiveService.muteParticipant(liveVideoId, participant.userId, minutes, user.uid, user.displayName || "सञ्चालक");
    toast.success(`${participant.displayName} लाई ${minutes} मिनेटका लागि म्यूट गरियो`);
    setSelectedUserForMod(null);
    setParticipants(LiveService.getParticipants(liveVideoId));
  };

  const handleBanUser = (participant: LiveParticipant, scope: "stream" | "global") => {
    if (!user || !isStaff) return;
    LiveService.banParticipant(liveVideoId, participant.userId, scope, user.uid, user.displayName || "सञ्चालक");
    toast.success(`${participant.displayName} लाई प्रतिबन्ध लगाइयो`);
    setSelectedUserForMod(null);
    setParticipants(LiveService.getParticipants(liveVideoId));
  };

  const pinnedMsg = messages.find(m => m.id === pinnedMessageId);

  const filteredParticipants = participants.filter(p => 
    p.displayName.toLowerCase().includes(participantSearch.toLowerCase()) ||
    (p.role && p.role.toLowerCase().includes(participantSearch.toLowerCase()))
  );

  // ================= TIKTOK-STYLE OVERLAY CHAT RENDERER =================
  if (presentation === "overlay") {
    const visibleMessages = messages.slice(- (isMobileDrawer ? 4 : 6));

    return (
      <div 
        id="sanatan-live-chat-overlay"
        className={`relative flex flex-col justify-end h-full w-full pointer-events-none select-none ${className}`}
      >
        {/* PINNED MESSAGE OVERLAY CARD */}
        {pinnedMsg && (
          <div className="pointer-events-auto mb-2 bg-amber-500/20 backdrop-blur-md border border-amber-500/40 p-2 px-3 rounded-2xl max-w-[85%] sm:max-w-xs shadow-xl animate-fade-in flex items-start gap-2 text-xs">
            <Pin size={12} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-bold text-amber-300 text-[11px] block">{pinnedMsg.displayName}</span>
              <p className="text-white text-[11px] line-clamp-2">{pinnedMsg.message}</p>
            </div>
          </div>
        )}

        {/* OVERLAY MESSAGE STACK */}
        <div className="space-y-2 overflow-hidden max-h-[300px] p-1 flex flex-col justify-end">
          <AnimatePresence initial={false}>
            {visibleMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-auto bg-black/60 backdrop-blur-md border border-white/15 rounded-2xl p-2 px-3 shadow-2xl max-w-[88%] sm:max-w-sm text-xs text-white"
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-amber-300 text-[11px] truncate">
                    {msg.displayName}
                  </span>
                  {msg.isOfficial && (
                    <span className="px-1 py-0.2 rounded bg-amber-500 text-black font-black text-[9px] uppercase">
                      आधिकारिक
                    </span>
                  )}
                  {msg.isModerator && (
                    <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[9px] border border-emerald-500/40">
                      सञ्चालक
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Quoted parent reply */}
                {msg.replyTo && (
                  <div className="mt-0.5 text-[10px] text-amber-400/80 truncate italic">
                    @{msg.replyTo.displayName}: {msg.replyTo.snippet}
                  </div>
                )}

                <p className="text-zinc-100 text-xs mt-0.5 leading-snug break-words font-normal">
                  {msg.message}
                </p>

                {/* Reactions */}
                <div className="flex items-center gap-1.5 mt-1">
                  {REACTION_EMOJIS.slice(0, 4).map((emoji) => {
                    const count = msg.reactions?.[emoji] || 0;
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReact(msg.id, emoji)}
                        className="inline-flex items-center gap-0.5 text-[10px] text-zinc-300 hover:text-white transition-transform active:scale-125"
                      >
                        <span>{emoji}</span>
                        {count > 0 && <span className="font-bold text-[9px]">{count}</span>}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="p-0.5 text-zinc-400 hover:text-white text-[10px] ml-auto"
                    title="जवाफ"
                  >
                    <Reply size={10} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* OVERLAY COMPOSER */}
        {user ? (
          <form 
            onSubmit={handleSendMessage} 
            className="pointer-events-auto mt-2 flex items-center gap-2 bg-black/80 backdrop-blur-xl border border-white/20 rounded-full p-1.5 px-3 shadow-2xl max-w-[95%] sm:max-w-md"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="प्रत्यक्ष सन्देश लेख्नुहोस् (टाइप रोमन -> नेपाली)..."
              className="flex-1 bg-transparent text-white text-xs placeholder:text-zinc-400 outline-none px-1"
            />
            <button
              type="submit"
              disabled={isSubmitting || !inputText.trim() || cooldownRemaining > 0}
              className="p-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold disabled:opacity-40 transition-all cursor-pointer"
            >
              <Send size={12} />
            </button>
          </form>
        ) : (
          <div className="pointer-events-auto mt-2 bg-black/75 backdrop-blur-xl border border-white/20 rounded-full p-1.5 px-3 shadow-2xl max-w-xs text-center text-xs text-zinc-300">
            <a href="/login" className="text-amber-400 font-bold hover:underline">
              साइन इन गरी च्याट गर्नुहोस् →
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      id="sanatan-live-chat-container"
      className={`flex flex-col h-full bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/90 rounded-2xl overflow-hidden shadow-2xl ${className}`}
    >
      {/* 1. CHAT HEADER & TABS */}
      <div className="p-3 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-zinc-900 rounded-xl p-1 border border-zinc-800">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "chat" 
                ? "bg-amber-500 text-black shadow-md" 
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <MessageSquare size={13} />
            <span>च्याट (Chat)</span>
          </button>

          <button
            onClick={() => setActiveTab("participants")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "participants" 
                ? "bg-amber-500 text-black shadow-md" 
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Users size={13} />
            <span>सहभागी ({participants.length})</span>
          </button>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1">
          {onChangePresentation && !isMobileDrawer && (
            <button
              onClick={() => onChangePresentation((presentation as string) === "overlay" ? "side" : "overlay")}
              title={(presentation as string) === "overlay" ? "साइडमा राख्नुहोस् (Side Dock)" : "भिडियो माथि राख्नुहोस् (Overlay Mode)"}
              className="text-[11px] font-semibold text-zinc-400 hover:text-amber-400 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 transition-colors"
            >
              {(presentation as string) === "overlay" ? "साइड" : "ओभरले"}
            </button>
          )}

          {isMobileDrawer && onCloseMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="बन्द गर्नुहोस्"
              aria-label="Close Chat Drawer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 2. PINNED MESSAGE BANNER */}
      {activeTab === "chat" && pinnedMsg && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 p-2 px-3 flex items-start justify-between gap-2 shrink-0 animate-fade-in">
          <div className="flex items-start gap-2 min-w-0">
            <Pin size={13} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-amber-300 truncate">{pinnedMsg.displayName}</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1 rounded font-bold">पिन गरिएको सन्देश</span>
              </div>
              <p className="text-zinc-200 line-clamp-2 mt-0.5 leading-relaxed">{pinnedMsg.message}</p>
            </div>
          </div>
          {isStaff && (
            <button
              onClick={() => handlePin(pinnedMsg.id)}
              className="text-zinc-400 hover:text-red-400 p-1 rounded hover:bg-zinc-800 shrink-0"
              title="पिन हटाउनुहोस्"
            >
              <PinOff size={13} />
            </button>
          )}
        </div>
      )}

      {/* 3. TAB CONTENT: MESSAGES LIST */}
      {activeTab === "chat" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar text-xs">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2">
              <MessageSquare size={28} className="text-zinc-700" />
              <p className="font-bold text-zinc-400">च्याट सुरु गर्नुहोस्</p>
              <p className="text-[11px] text-zinc-600 max-w-xs">
                सभ्य र सकारात्मक टिप्पणी गर्नुहोस्। सबै विचारहरूको सम्मान गरौं।
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMsgOfficial = msg.isOfficial;
              const isMsgModerator = msg.isModerator;
              const hasReply = !!msg.replyTo;

              return (
                <div 
                  key={msg.id}
                  className={`group relative p-2.5 rounded-xl transition-all ${
                    isMsgOfficial 
                      ? "bg-amber-500/10 border border-amber-500/30" 
                      : isMsgModerator 
                        ? "bg-emerald-950/20 border border-emerald-500/20" 
                        : "hover:bg-zinc-900/60"
                  }`}
                >
                  {/* Quoted parent reply banner */}
                  {hasReply && msg.replyTo && (
                    <div className="mb-1.5 pl-2 border-l-2 border-amber-500/60 text-[11px] text-zinc-400 flex items-center gap-1 truncate">
                      <Reply size={10} className="text-amber-400 shrink-0" />
                      <span className="font-bold text-amber-300/80 shrink-0">@{msg.replyTo.displayName}:</span>
                      <span className="truncate">{msg.replyTo.snippet}</span>
                    </div>
                  )}

                  {/* Header: User & Badges */}
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="font-bold text-zinc-200 truncate">
                        {msg.displayName}
                      </span>

                      {/* Official or Staff Badges */}
                      {isMsgOfficial && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500 text-black font-black text-[9px] uppercase tracking-wider">
                          <Award size={9} />
                          आधिकारिक
                        </span>
                      )}

                      {isMsgModerator && !isMsgOfficial && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[9px] border border-emerald-500/40">
                          <ShieldCheck size={9} />
                          सञ्चालक
                        </span>
                      )}

                      {/* Membership tier badge */}
                      {msg.membershipTier && msg.membershipTier !== "free" && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-semibold text-[9px] border border-purple-500/30">
                          {msg.membershipTier}
                        </span>
                      )}

                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Action buttons (Reply, Report, Staff Moderate) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                      {/* Reply Button */}
                      <button
                        onClick={() => setReplyingTo(msg)}
                        title="जवाफ दिनुहोस् (Reply)"
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                      >
                        <Reply size={12} />
                      </button>

                      {/* Report Button */}
                      <button
                        onClick={() => setReportingMessage(msg)}
                        title="रिपोर्ट गर्नुहोस् (Report)"
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-amber-400"
                      >
                        <Flag size={12} />
                      </button>

                      {/* Staff Controls */}
                      {isStaff && (
                        <>
                          <button
                            onClick={() => handlePin(msg.id)}
                            title={pinnedMessageId === msg.id ? "पिन हटाउनुहोस्" : "सन्देश पिन गर्नुहोस्"}
                            className={`p-1 rounded hover:bg-zinc-800 ${pinnedMessageId === msg.id ? "text-amber-400" : "text-zinc-400 hover:text-amber-400"}`}
                          >
                            <Pin size={12} />
                          </button>
                          <button
                            onClick={() => handleModerate(msg.id, "hide")}
                            title="सन्देश लुकाउनुहोस्"
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-yellow-400"
                          >
                            <EyeOff size={12} />
                          </button>
                          <button
                            onClick={() => handleModerate(msg.id, "delete")}
                            title="सन्देश मेट्नुहोस्"
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-red-400"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Body: Message text */}
                  <p className="text-zinc-100 leading-relaxed break-words font-normal">
                    {msg.message}
                  </p>

                  {/* Reactions Bar */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {REACTION_EMOJIS.map((emoji) => {
                      const count = msg.reactions?.[emoji] || 0;
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleReact(msg.id, emoji)}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] transition-all cursor-pointer ${
                            count > 0 
                              ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 shadow-xs" 
                              : "opacity-40 hover:opacity-100 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          <span>{emoji}</span>
                          {count > 0 && <span className="font-bold">{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* 4. TAB CONTENT: PARTICIPANTS LIST */}
      {activeTab === "participants" && (
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-2 text-xs">
          {/* Search participants */}
          <div className="relative mb-2">
            <Search size={13} className="absolute left-2.5 top-2.5 text-zinc-500" />
            <input
              type="text"
              value={participantSearch}
              onChange={(e) => setParticipantSearch(e.target.value)}
              placeholder="सहभागी खोज्नुहोस्..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div className="space-y-1">
            {filteredParticipants.map((p) => (
              <div 
                key={p.userId}
                className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
                    {p.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-white truncate">{p.displayName}</span>
                      {p.isStaff && (
                        <span className="px-1 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                          सञ्चालक
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <span>{p.membershipTier}</span>
                      {p.isMuted && <span className="text-red-400 font-bold">• म्यूट</span>}
                      {p.isBanned && <span className="text-red-500 font-bold">• प्रतिबन्धित</span>}
                    </div>
                  </div>
                </div>

                {/* Staff moderation menu trigger */}
                {isStaff && p.userId !== user?.uid && (
                  <button
                    onClick={() => setSelectedUserForMod(p)}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="सञ्चालन कार्य (Moderation Actions)"
                  >
                    <MoreVertical size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. REPLY PREVIEW BAR */}
      {replyingTo && (
        <div className="bg-zinc-900 border-t border-zinc-800 p-2 px-3 flex items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Reply size={12} className="text-amber-400 shrink-0" />
            <span className="text-zinc-400">जवाफ दिँदै:</span>
            <span className="font-bold text-amber-300 truncate">@{replyingTo.displayName}</span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-zinc-400 hover:text-white p-0.5 rounded"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* 6. CHAT INPUT BAR */}
      {activeTab === "chat" && (
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/60 shrink-0">
          {isBanned ? (
            <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/30 text-red-400 text-xs text-center font-medium">
              तपाईंलाई यो प्रत्यक्ष च्याटबाट प्रतिबन्ध गरिएको छ।
            </div>
          ) : isMuted ? (
            <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-400 text-xs text-center font-medium">
              तपाईं हाल म्यूट हुनुहुन्छ। कृपया केही समय पर्खनुहोस्।
            </div>
          ) : !user ? (
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-1">
              <p className="text-xs text-zinc-300 font-semibold">प्रत्यक्ष च्याटमा भाग लिन साइन इन गर्नुहोस्</p>
              <a 
                href="/login"
                className="inline-block text-[11px] text-amber-400 font-bold hover:underline"
              >
                साइन इन गर्नुहोस् (Login to Chat) →
              </a>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className="relative flex items-center">
                <NepaliInput
                  value={inputText}
                  onChange={(val) => setInputText(val)}
                  placeholder="यहाँ सन्देश लेख्नुहोस् (टाइप रोमन -> नेपाली)..."
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 pr-10 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !inputText.trim() || cooldownRemaining > 0}
                  className="absolute right-1.5 p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-black transition-all cursor-pointer"
                  title="सन्देश पठाउनुहोस्"
                >
                  <Send size={13} />
                </button>
              </div>

              {/* Cooldown or slow mode notice */}
              <div className="flex items-center justify-between text-[10px] text-zinc-500 px-1">
                <span>सभ्य संवाद सनातन मर्यादा हो</span>
                {cooldownRemaining > 0 ? (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Clock size={10} />
                    पर्खनुहोस्: {cooldownRemaining}s
                  </span>
                ) : (
                  <span>स्लो मोड: {settings?.slowModeSeconds || 3}s</span>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {/* ================= 7. MODERATION MODALS ================= */}

      {/* REPORT MESSAGE MODAL */}
      {reportingMessage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Flag size={15} className="text-amber-400" />
                सन्देश रिपोर्ट गर्नुहोस्
              </h3>
              <button 
                onClick={() => setReportingMessage(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300">
              <span className="font-bold text-amber-300">@{reportingMessage.displayName}:</span>
              <p className="mt-0.5 italic">"{reportingMessage.message}"</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">कारण चयन गर्नुहोस्:</label>
              {[
                { id: "spam", label: "स्प्याम / अनावश्यक प्रचार (Spam)" },
                { id: "hate", label: "घृणास्पद / अपमानजनक भाषा (Hate Speech)" },
                { id: "misinformation", label: "गलत / भ्रामक सूचना (Misinformation)" },
                { id: "harassment", label: "दुर्व्यवहार (Harassment)" },
                { id: "other", label: "अन्य (Other)" }
              ].map((r) => (
                <label key={r.id} className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer p-1.5 rounded-lg hover:bg-zinc-800">
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.id}
                    checked={reportReason === r.id}
                    onChange={() => setReportReason(r.id as any)}
                    className="text-amber-500 focus:ring-amber-500"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setReportingMessage(null)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white"
              >
                रद्द गर्नुहोस्
              </button>
              <button
                onClick={handleSubmitReport}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-black shadow-md"
              >
                रिपोर्ट पठाउनुहोस्
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER MODERATION ACTION MODAL (STAFF) */}
      {selectedUserForMod && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-400" />
                सञ्चालन कार्य: {selectedUserForMod.displayName}
              </h3>
              <button 
                onClick={() => setSelectedUserForMod(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-2 pt-1">
              <p className="text-xs text-zinc-400">समय अनुसार म्यूट गर्नुहोस् (Temporary Mute):</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 5, 15, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => handleMuteUser(selectedUserForMod, mins)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-center text-xs font-bold text-white hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    {mins} मिनेट
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <button
                  onClick={() => handleBanUser(selectedUserForMod, "stream")}
                  className="w-full p-2.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <VolumeX size={14} />
                  <span>यो प्रसारणमा प्रतिबन्ध (Stream Ban)</span>
                </button>

                <button
                  onClick={() => handleBanUser(selectedUserForMod, "global")}
                  className="w-full p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Ban size={14} />
                  <span>स्थायी च्याट प्रतिबन्ध (Global Ban)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
