import { useState, useEffect } from "react";
import { collection, query, where, orderBy, setDoc, deleteDoc, doc, serverTimestamp } from "@/src/lib/firebase";
import { db, safeOnSnapshot, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { addDocWithQueue } from "@/src/lib/offlineQueue";
import { useAuth } from "@/src/lib/auth";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, X, Send, MessageCircle, Share2, Check } from "lucide-react";
import type { GalleryReaction, GalleryComment } from "@/src/types";
import { toast } from "sonner";

export interface LightboxImageItem {
  id: string;
  url: string;
  title?: string;
  subtitle?: string;
  authorName?: string;
  authorPhoto?: string;
  modelId?: string;
}

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: LightboxImageItem[];
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
}

export const REACTION_EMOJIS: { type: GalleryReaction["type"]; emoji: string; label: string; activeStyle: string }[] = [
  { type: "heart", emoji: "❤️", label: "मन पर्यो (Love)", activeStyle: "bg-rose-500/20 text-rose-500 border-rose-500/50 ring-1 ring-rose-500/30" },
  { type: "like", emoji: "👍", label: "राम्रो (Like)", activeStyle: "bg-blue-500/20 text-blue-500 border-blue-500/50 ring-1 ring-blue-500/30" },
  { type: "fire", emoji: "🔥", label: "उत्कृष्ट (Fire)", activeStyle: "bg-amber-500/20 text-amber-500 border-amber-500/50 ring-1 ring-amber-500/30" },
  { type: "wow", emoji: "😮", label: "आश्चर्य (Wow)", activeStyle: "bg-purple-500/20 text-purple-500 border-purple-500/50 ring-1 ring-purple-500/30" },
  { type: "laugh", emoji: "😂", label: "हाँसो (Haha)", activeStyle: "bg-yellow-500/20 text-yellow-500 border-yellow-500/50 ring-1 ring-yellow-500/30" },
  { type: "clap", emoji: "👏", label: "ताली (Clap)", activeStyle: "bg-emerald-500/20 text-emerald-500 border-emerald-500/50 ring-1 ring-emerald-500/30" },
];

export default function ImageLightboxModal({
  isOpen,
  onClose,
  images,
  currentIndex = 0,
  onIndexChange
}: ImageLightboxModalProps) {
  const { user } = useAuth();
  const [index, setIndex] = useState(currentIndex);
  const [reactions, setReactions] = useState<GalleryReaction[]>([]);
  const [comments, setComments] = useState<GalleryComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIndex(currentIndex);
  }, [currentIndex]);

  const activeItem = images[index] || images[0];

  // Sync index change to parent if callback provided
  const handleNext = () => {
    if (images.length === 0) return;
    const newIdx = (index + 1) % images.length;
    setIndex(newIdx);
    onIndexChange?.(newIdx);
  };

  const handlePrev = () => {
    if (images.length === 0) return;
    const newIdx = (index - 1 + images.length) % images.length;
    setIndex(newIdx);
    onIndexChange?.(newIdx);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, index, images.length]);

  // Realtime subscription for reactions & comments for active image
  useEffect(() => {
    if (!isOpen || !activeItem) return;

    const imageId = activeItem.id;

    // Reactions Realtime
    const qR = query(collection(db, "galleryReactions"), where("imageId", "==", imageId));
    const unsubR = safeOnSnapshot(
      qR,
      (snapR) => {
        setReactions(snapR.docs.map(d => ({ id: d.id, ...d.data() } as GalleryReaction)));
      },
      "image_reactions_snapshot"
    );

    // Comments Realtime
    const qC = query(collection(db, "galleryComments"), where("imageId", "==", imageId), orderBy("createdAt", "asc"));
    const unsubC = safeOnSnapshot(
      qC,
      (snapC) => {
        setComments(snapC.docs.map(d => ({ id: d.id, ...d.data() } as GalleryComment)));
      },
      "image_comments_snapshot"
    );

    return () => {
      unsubR();
      unsubC();
    };
  }, [isOpen, activeItem?.id]);

  if (!isOpen || !activeItem) return null;

  // Handle reaction click with optimistic update
  const handleReaction = async (type: GalleryReaction["type"]) => {
    if (!user) {
      toast.error("प्रतिक्रिया दिन कृपया पहिले लगइन गर्नुहोस् (Please login to react)");
      return;
    }

    const imageId = activeItem.id;
    const reactionId = `${imageId}_${user.uid}`;
    const existingReaction = reactions.find(r => r.userId === user.uid);

    // Optimistically update local reactions state
    if (existingReaction) {
      if (existingReaction.type === type) {
        // Toggle off
        setReactions(prev => prev.filter(r => r.userId !== user.uid));
      } else {
        // Change reaction type
        setReactions(prev => prev.map(r => r.userId === user.uid ? { ...r, type } : r));
      }
    } else {
      // Add new reaction
      setReactions(prev => [
        ...prev,
        {
          id: reactionId,
          modelId: activeItem.modelId || "",
          imageId,
          userId: user.uid,
          type,
          createdAt: new Date()
        }
      ]);
    }

    try {
      if (existingReaction && existingReaction.type === type) {
        await deleteDoc(doc(db, "galleryReactions", reactionId));
      } else {
        await setDoc(doc(db, "galleryReactions", reactionId), {
          modelId: activeItem.modelId || "",
          imageId,
          userId: user.uid,
          type,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Error updating reaction:", err);
      handleFirestoreError(err, OperationType.WRITE, "galleryReactions");
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("टिप्पणी गर्न कृपया पहिले लगइन गर्नुहोस् (Please login to comment)");
      return;
    }
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const result = await addDocWithQueue("galleryComments", {
        modelId: activeItem.modelId || "",
        imageId: activeItem.id,
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "प्रयोगकर्ता",
        userPhoto: user.photoURL || "",
        text: commentText.trim(),
        createdAt: serverTimestamp()
      });

      if (result && "queued" in (result as any)) {
        toast.info("सञ्जाल नभएकाले टिप्पणी क्युमा राखियो।");
      }
      setCommentText("");
    } catch (err) {
      console.error("Comment submit error:", err);
      toast.error("टिप्पणी पोस्ट गर्न सकिएन");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeItem.url);
    setCopied(true);
    toast.success("फोटोको लिङ्क प्रतिलिपि गरियो!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-2 sm:p-4 md:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-6xl h-full max-h-[92vh] bg-card rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-border-theme z-10"
        >
          {/* Main Image Section */}
          <div className="relative flex-grow bg-slate-950 flex items-center justify-center overflow-hidden group select-none min-h-[300px] md:min-h-[500px]">
            <motion.img
              key={activeItem.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              src={activeItem.url}
              alt={activeItem.title || "Image"}
              className="max-w-full max-h-full object-contain pointer-events-none"
              referrerPolicy="no-referrer"
              onContextMenu={(e) => e.preventDefault()}
            />

            {/* Navigation Buttons (Prev / Next) */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-3 p-3 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all opacity-80 md:opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
                  title="अघिल्लो फोटो"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-3 p-3 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all opacity-80 md:opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
                  title="पछिल्लो फोटो"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2.5 bg-black/50 text-white rounded-full md:hidden backdrop-blur-md hover:bg-black/80"
              title="बन्द गर्नुहोस्"
            >
              <X size={20} />
            </button>

            {/* Image Counter Badge */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-4 bg-black/60 text-white/90 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
                {index + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Right Sidebar - Reactions, Author, Comments */}
          <div className="w-full md:w-[420px] flex flex-col bg-card border-t md:border-t-0 md:border-l border-border-theme h-[45vh] md:h-auto overflow-hidden">
            {/* Header */}
            <div className="p-4 md:p-5 border-b border-border-theme flex items-center justify-between bg-muted-area/30">
              <div className="flex items-center gap-3">
                {activeItem.authorPhoto ? (
                  <img
                    src={activeItem.authorPhoto}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-primary/20"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {(activeItem.authorName || activeItem.title || "S")[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-foreground truncate leading-tight">
                    {activeItem.authorName || activeItem.title || "फोटो"}
                  </h4>
                  {activeItem.subtitle && (
                    <p className="text-[11px] font-medium text-muted-text truncate mt-0.5">
                      {activeItem.subtitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyLink}
                  className="p-2 text-muted-text hover:text-foreground rounded-xl hover:bg-muted-area transition-colors"
                  title="लिङ्क सेयर गर्नुहोस्"
                >
                  {copied ? <Check size={18} className="text-emerald-500" /> : <Share2 size={18} />}
                </button>
                <button
                  onClick={onClose}
                  className="hidden md:flex p-2 text-muted-text hover:text-foreground rounded-xl hover:bg-muted-area transition-colors"
                  title="बन्द गर्नुहोस्"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Reactions Bar Section */}
            <div className="p-4 border-b border-border-theme bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-muted-text">
                  प्रतिक्रियाहरू (Reactions)
                </span>
                <span className="text-xs font-black text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-full">
                  {reactions.length} जना
                </span>
              </div>

              {/* Emoji Reaction Selector with Counts */}
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {REACTION_EMOJIS.map(({ type, emoji, label, activeStyle }) => {
                  const count = reactions.filter((r) => r.type === type).length;
                  const isUserReacted =
                    user && reactions.some((r) => r.userId === user.uid && r.type === type);

                  return (
                    <button
                      key={type}
                      onClick={() => handleReaction(type)}
                      title={label}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-150 active:scale-95 ${
                        isUserReacted
                          ? `${activeStyle} scale-105 shadow-md`
                          : "bg-muted-area/40 border-border-theme/60 hover:bg-muted-area hover:border-primary/30 text-muted-text hover:text-foreground"
                      }`}
                    >
                      <span className="text-xl leading-none transition-transform hover:scale-125">
                        {emoji}
                      </span>
                      <span
                        className={`text-[11px] font-black font-mono mt-1 ${
                          isUserReacted ? "text-foreground" : "text-muted-text"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comments Scrollable List */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5 items-start group">
                    <img
                      src={
                        comment.userPhoto ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          comment.userName || "U"
                        )}&background=random`
                      }
                      alt=""
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5 border border-border-theme"
                    />
                    <div className="flex-grow min-w-0">
                      <div className="bg-muted-area/70 group-hover:bg-muted-area p-2.5 rounded-2xl rounded-tl-none transition-colors border border-border-theme/40">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-black text-foreground truncate">
                            {comment.userName}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/90 leading-relaxed break-words font-medium">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-8">
                  <MessageCircle size={28} className="mb-1.5 text-muted-text" />
                  <p className="text-xs font-bold text-muted-text">पहिलो प्रतिक्रिया लेख्नुहोस्</p>
                </div>
              )}
            </div>

            {/* Comment Form Input */}
            <div className="p-3 md:p-4 border-t border-border-theme bg-muted-area/20">
              <form onSubmit={handleCommentSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={user ? "प्रतिक्रिया लेख्नुहोस्..." : "लगइन गरी प्रतिक्रिया दिनुहोस्"}
                  disabled={!user || isSubmittingComment}
                  className="w-full pl-3.5 pr-11 py-2.5 bg-card border border-border-theme rounded-xl text-xs font-medium text-foreground placeholder:text-muted-text focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-60 outline-none"
                />
                <button
                  type="submit"
                  disabled={!user || !commentText.trim() || isSubmittingComment}
                  className="absolute right-1.5 p-2 bg-primary text-primary-foreground rounded-lg hover:scale-105 transition-transform disabled:opacity-0 shadow-sm"
                  title="पठाउनुहोस्"
                >
                  {isSubmittingComment ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
