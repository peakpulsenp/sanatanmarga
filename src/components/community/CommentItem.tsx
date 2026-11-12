import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { doc, updateDoc, increment, deleteDoc, addDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from "@/src/lib/firebase";
import { db, getDocsWithCacheFallback } from "@/src/lib/firebase";
import NepaliInput from "@/src/components/ui/NepaliInput";
import { updateDocWithQueue, setDocWithQueue, deleteDocWithQueue, addDocWithQueue, offlineQueue } from "@/src/lib/offlineQueue";
import { chautariStore } from "@/src/utils/chautariStore";
import { useAuth } from "@/src/lib/auth";
import { CommunityComment } from "@/src/types";
import { ArrowBigUp, ArrowBigDown, MessageSquare, MoreVertical, Edit2, Trash2, Flag, ShieldCheck, Share2, Send, X, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { toSafeDate } from "@/src/lib/utils";
import { toast } from "sonner";

interface CommentItemProps {
  comment: CommunityComment;
  replies?: CommunityComment[];
  onReplyAdded?: () => void;
}

export default function CommentItem({ comment, replies = [], onReplyAdded }: CommentItemProps) {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editContent, setEditContent] = useState(comment.text);
  const [replyText, setReplyText] = useState("");
  const [userVote, setUserVote] = useState<"up" | "down" | null>(() => chautariStore.getUserVote(comment.id));
  const [scoreDelta, setScoreDelta] = useState(0);
  const [submittingReply, setSubmittingReply] = useState(false);

  const isAdmin = user?.role === "admin";
  const isEditor = user?.role === "editor" || isAdmin;
  const isAuthor = user?.uid === comment.authorId;

  useEffect(() => {
    if (user && user.uid) {
      const checkVote = async () => {
        const q = query(
          collection(db, "communityVotes"),
          where("userId", "==", user.uid),
          where("targetId", "==", comment.id)
        );
        try {
          const snapshot = await getDocsWithCacheFallback(q, "comment_vote");
          if (!snapshot.empty) {
            const vType = snapshot.docs[0].data().type as "up" | "down";
            setUserVote(vType);
            chautariStore.setUserVote(comment.id, vType);
          }
        } catch (err) {
          console.error("Error checking vote:", err);
        }
      };
      checkVote();
    }
  }, [user, comment.id]);

  const handleVote = async (type: "up" | "down") => {
    if (!user) return window.location.href = "/login";
    
    const oldVote = userVote;
    let newVote: "up" | "down" | null = null;
    let delta = 0;

    if (oldVote === type) {
      newVote = null;
      delta = type === "up" ? -1 : 1;
    } else {
      newVote = type;
      if (!oldVote) {
        delta = type === "up" ? 1 : -1;
      } else {
        delta = type === "up" ? 2 : -2;
      }
    }

    setUserVote(newVote);
    setScoreDelta(prev => prev + delta);
    chautariStore.setUserVote(comment.id, newVote);

    if (newVote === null) {
      offlineQueue.queueAction({
        type: 'ARTICLE_DELETE',
        collection: 'communityVotes',
        docId: `${user.uid}_${comment.id}`
      });
      offlineQueue.queueAction({
        type: 'CUSTOM',
        collection: 'communityComments',
        docId: comment.id,
        data: {
          [type === "up" ? "upvotes" : "downvotes"]: { _type: 'increment', value: -1 }
        }
      });
    } else {
      offlineQueue.queueAction({
        type: 'CUSTOM',
        collection: 'communityVotes',
        docId: `${user.uid}_${comment.id}`,
        data: {
          userId: user.uid,
          targetId: comment.id,
          type,
          createdAt: serverTimestamp()
        }
      });

      const updates: any = {
        [type === "up" ? "upvotes" : "downvotes"]: { _type: 'increment', value: 1 }
      };
      if (oldVote) {
        updates[oldVote === "up" ? "upvotes" : "downvotes"] = { _type: 'increment', value: -1 };
      }
      offlineQueue.queueAction({
        type: 'CUSTOM',
        collection: 'communityComments',
        docId: comment.id,
        data: updates
      });
    }
  };

  const handleEdit = async () => {
    if (!isAuthor || !editContent.trim()) return;
    try {
      const commentRef = doc(db, "communityComments", comment.id);
      await updateDocWithQueue(commentRef, {
        text: editContent.trim(),
        updatedAt: serverTimestamp()
      });
      setIsEditing(false);
      toast.success("Comment updated!");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleDelete = async () => {
    if (!isAdmin && !isAuthor) return;
    if (confirm("Are you sure you want to delete this comment?")) {
      try {
        await deleteDocWithQueue(doc(db, "communityComments", comment.id));
        await updateDocWithQueue(doc(db, "communityPosts", comment.postId), {
          commentCount: increment(-1)
        });
        toast.success("Comment deleted");
      } catch (err) {
        toast.error("Delete failed");
      }
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      await addDocWithQueue("communityComments", {
        postId: comment.postId,
        parentId: comment.id,
        authorId: user.uid,
        authorName: user.displayName || "Anonymous",
        authorPhoto: user.photoURL || null,
        text: replyText.trim(),
        upvotes: 0,
        downvotes: 0,
        createdAt: serverTimestamp()
      });

      await updateDocWithQueue(doc(db, "communityPosts", comment.postId), {
        commentCount: increment(1)
      });

      setReplyText("");
      setIsReplying(false);
      toast.success("Reply posted!");
      if (onReplyAdded) onReplyAdded();
    } catch (err) {
      console.error("Error replying:", err);
      toast.error("Reply failed");
    } finally {
      setSubmittingReply(false);
    }
  };

  if (isCollapsed) {
    return (
      <div className="flex items-center gap-2 py-2">
        <button 
          onClick={() => setIsCollapsed(false)}
          className="w-5 h-5 flex items-center justify-center bg-muted-area rounded-md text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus size={12} className="font-black" />
        </button>
        <Link 
          to={comment.authorId ? `/profile/${comment.authorId}` : `/profile/${encodeURIComponent(comment.authorName)}`}
          className="text-xs font-black text-card-foreground hover:text-primary transition-colors cursor-pointer"
        >
          u/{comment.authorName}
        </Link>
        <span className="text-[10px] text-muted-text/50">{comment.createdAt ? formatDistanceToNow(toSafeDate(comment.createdAt)) + " ago" : "Just now"}</span>
      </div>
    );
  }

  return (
    <div id={`comment-${comment.id}`} className="flex flex-col">
      <div className="group relative">
        <div 
          onClick={() => setIsCollapsed(true)}
          className="absolute left-[11px] sm:left-[15px] top-8 bottom-0 w-0.5 bg-border-theme/30 hover:bg-primary/50 cursor-pointer transition-colors"
          title="Collapse thread"
        />

        <div className="flex gap-2 sm:gap-3">
          <Link 
            to={comment.authorId ? `/profile/${comment.authorId}` : `/profile/${encodeURIComponent(comment.authorName)}`}
            className="flex flex-col items-center group/avatar cursor-pointer"
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] sm:text-xs font-black border border-primary/20 shrink-0 group-hover/avatar:scale-105 group-hover/avatar:border-primary transition-all">
              {comment.authorName.charAt(0)}
            </div>
          </Link>

          <div className="flex-1 min-w-0 pb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                <Link 
                  to={comment.authorId ? `/profile/${comment.authorId}` : `/profile/${encodeURIComponent(comment.authorName)}`}
                  className="font-black text-card-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  u/{comment.authorName}
                </Link>
                <span className="text-muted-text/30">•</span>
                <span className="text-muted-text">{comment.createdAt ? formatDistanceToNow(toSafeDate(comment.createdAt)) + " ago" : "Just now"}</span>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 hover:bg-muted-area rounded-full text-muted-text transition-colors"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
                <AnimatePresence>
                  {showMenu && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-1 w-40 bg-card rounded-xl shadow-xl border border-border-theme py-1.5 z-50 overflow-hidden"
                    >
                      {isAuthor && (
                        <button 
                          onClick={() => { setIsEditing(true); setShowMenu(false); }}
                          className="w-full text-left px-4 py-2 text-xs text-card-foreground hover:bg-muted-area flex items-center gap-2"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                      {(isAuthor || isAdmin) && (
                        <button 
                          onClick={() => { handleDelete(); setShowMenu(false); }}
                          className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-3 mt-2">
                <NepaliInput 
                  value={editContent}
                  onChange={(val) => setEditContent(val)}
                  type="textarea"
                  rows={3}
                  className="w-full bg-muted-area/30 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <div className="flex gap-2">
                  <button onClick={handleEdit} className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold">Save</button>
                  <button onClick={() => setIsEditing(false)} className="bg-muted-area text-muted-text px-3 py-1.5 rounded-lg text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <p className="text-card-foreground leading-relaxed text-sm sm:text-base font-medium break-words">
                {comment.text}
              </p>
            )}

            <div className="mt-2 flex items-center gap-2 sm:gap-4">
              <div className="flex items-center bg-muted-area/30 rounded-full border border-border-theme/30 p-0.5 scale-90 sm:scale-100 -ml-1 sm:ml-0">
                <button 
                  onClick={() => handleVote("up")}
                  className={`p-1 rounded-full transition-all ${userVote === "up" ? "text-orange-600 bg-orange-100" : "text-muted-text hover:text-orange-500"}`}
                >
                  <ArrowBigUp size={18} className={userVote === "up" ? "fill-current" : ""} />
                </button>
                <span className={`text-[10px] sm:text-xs font-black tabular-nums px-1 ${userVote === "up" ? "text-orange-600" : userVote === "down" ? "text-indigo-600" : "text-card-foreground"}`}>
                  {(comment.upvotes || 0) - (comment.downvotes || 0) + scoreDelta}
                </span>
                <button 
                  onClick={() => handleVote("down")}
                  className={`p-1 rounded-full transition-all ${userVote === "down" ? "text-indigo-600 bg-indigo-100" : "text-muted-text hover:text-indigo-500"}`}
                >
                  <ArrowBigDown size={18} className={userVote === "down" ? "fill-current" : ""} />
                </button>
              </div>

              <button 
                onClick={() => setIsReplying(!isReplying)}
                className="text-[10px] sm:text-xs font-black text-muted-text hover:bg-muted-area px-2 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Reply
              </button>
              
              <button 
                onClick={() => {
                   const url = `${window.location.origin}/community/post/${comment.postId}#comment-${comment.id}`;
                   navigator.clipboard.writeText(url);
                   toast.success("Link copied!");
                }}
                className="text-[10px] sm:text-xs font-black text-muted-text hover:bg-muted-area px-2 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            </div>

            <AnimatePresence>
              {isReplying && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <form onSubmit={handleReply} className="flex flex-col gap-2">
                    <NepaliInput 
                      placeholder="Write a reply..."
                      value={replyText}
                      onChange={(val) => setReplyText(val)}
                      type="textarea"
                      rows={2}
                      className="w-full bg-muted-area/30 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        type="button"
                        onClick={() => setIsReplying(false)}
                        className="bg-muted-area text-muted-text px-3 py-1.5 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={submittingReply || !replyText.trim()}
                        className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                      >
                        {submittingReply ? "Posting..." : "Reply"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {replies.length > 0 && (
        <div className="ml-3 sm:ml-6 pl-3 sm:pl-6 border-l-[1.5px] border-border-theme/30 mt-1 space-y-3">
          {replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} onReplyAdded={onReplyAdded} />
          ))}
        </div>
      )}
    </div>
  );
}

