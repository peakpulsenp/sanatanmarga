import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { doc, updateDoc, increment, setDoc, deleteDoc, query, collection, where, getDocs, serverTimestamp, getDoc } from "@/src/lib/firebase";
import { db, getDocsWithCacheFallback, getDocWithCacheFallback } from "@/src/lib/firebase";
import { offlineQueue } from "@/src/lib/offlineQueue";
import { useAuth } from "@/src/lib/auth";
import { CommunityPost, Article } from "@/src/types";
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, MoreVertical, Edit2, Trash2, Flag, ShieldCheck, ChevronDown, ArrowRight, Facebook, Twitter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { toSafeDate } from "@/src/lib/utils";
import { toast } from "sonner";

import NepaliInput from "@/src/components/ui/NepaliInput";
import ReportModal from "./ReportModal";
import ImageLightboxModal from "@/src/components/common/ImageLightboxModal";

import { chautariStore } from "@/src/utils/chautariStore";
import { snapshotEngine } from "@/src/services/snapshotEngine";

interface PostCardProps {
  post: CommunityPost;
  isDetail?: boolean;
}

export default function PostCard({ post, isDetail = false }: PostCardProps) {
  const { user } = useAuth();
  const [userVote, setUserVote] = useState<"up" | "down" | null>(() => chautariStore.getUserVote(post.id));
  const [scoreDelta, setScoreDelta] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editTitle, setEditTitle] = useState(post.title);
  const [linkedArticle, setLinkedArticle] = useState<Article | null>(null);
  const [showArticle, setShowArticle] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const isEditor = user?.role === "editor" || isAdmin;
  const isAuthor = user?.uid === post.authorId;

  // Global radius from CSS variables (synced via StyleProvider)
  const cardRadius = "var(--app-post-card-radius, 24px)";
  // Thumbnail follows the "Global Radius" setting specifically
  const thumbRadius = "var(--app-radius, 24px)";

  useEffect(() => {
    if (user && user.uid) {
      const checkVote = async () => {
        const q = query(
          collection(db, "communityVotes"),
          where("userId", "==", user.uid),
          where("targetId", "==", post.id)
        );
        try {
          const snapshot = await getDocsWithCacheFallback(q, "post_vote");
          if (!snapshot.empty) {
            setUserVote(snapshot.docs[0].data().type);
          }
        } catch (err) {
          console.error("Error checking vote:", err);
        }
      };
      checkVote();
    }
  }, [user, post.id]);

  useEffect(() => {
    if (post.linkedArticleId) {
      const fetchArticle = async () => {
        try {
          // 1. Try snapshotEngine
          const snap = await snapshotEngine.getArticleSnapshot(post.linkedArticleId!);
          if (snap && snap.article) {
            setLinkedArticle(snap.article);
            return;
          }

          // 2. Try Firestore
          const docRef = doc(db, "articles", post.linkedArticleId!);
          const docSnap = await getDocWithCacheFallback(docRef, "post_linked_article");
          if (docSnap.exists()) {
            setLinkedArticle({ id: docSnap.id, ...docSnap.data() } as Article);
            return;
          }

          // 3. Try localStorage
          const dynamicStr = localStorage.getItem("sg_dynamic_articles");
          if (dynamicStr) {
            try {
              const dynamicArts: Article[] = JSON.parse(dynamicStr);
              const found = dynamicArts.find(a => a.id === post.linkedArticleId);
              if (found) {
                setLinkedArticle(found);
                return;
              }
            } catch (e) {}
          }

          // 4. Synthetic fallback from post metadata
          if (post.title || post.imageUrl) {
            setLinkedArticle({
              id: post.linkedArticleId!,
              title: post.title.replace(" मा छलफल गरौं", ""),
              content: post.content,
              excerpt: post.content.substring(0, 150),
              featuredImage: post.imageUrl || "",
              categoryId: "desh",
              status: "published",
              createdAt: post.createdAt,
              views: 100
            } as Article);
          }
        } catch (err) {
          console.error("Error fetching linked article:", err);
        }
      };
      fetchArticle();
    }
  }, [post.linkedArticleId, post.title, post.content, post.imageUrl, post.createdAt]);

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
    chautariStore.setUserVote(post.id, newVote);

    const currentUp = Number(post.upvotes || 0);
    const currentDown = Number(post.downvotes || 0);
    let nextUp = currentUp;
    let nextDown = currentDown;

    if (newVote === null) {
      if (type === "up") nextUp = Math.max(0, currentUp - 1);
      else nextDown = Math.max(0, currentDown - 1);
    } else if (newVote === "up") {
      nextUp = currentUp + 1;
      if (oldVote === "down") nextDown = Math.max(0, currentDown - 1);
    } else if (newVote === "down") {
      nextDown = currentDown + 1;
      if (oldVote === "up") nextUp = Math.max(0, currentUp - 1);
    }

    chautariStore.updateLocalPost(post.id, { upvotes: nextUp, downvotes: nextDown });

    if (newVote === null) {
      // Remove vote
      offlineQueue.queueAction({
        type: 'ARTICLE_DELETE',
        collection: 'communityVotes',
        docId: `${user.uid}_${post.id}`
      });
      offlineQueue.queueAction({
        type: 'CUSTOM',
        collection: 'communityPosts',
        docId: post.id,
        data: {
          [type === "up" ? "upvotes" : "downvotes"]: { _type: 'increment', value: -1 }
        }
      });
    } else {
      // Add or change vote
      offlineQueue.queueAction({
        type: 'CUSTOM',
        collection: 'communityVotes',
        docId: `${user.uid}_${post.id}`,
        data: {
          userId: user.uid,
          targetId: post.id,
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
        collection: 'communityPosts',
        docId: post.id,
        data: updates
      });
    }
  };

  const handleEdit = async () => {
    if (!isAuthor && !isEditor && !isAdmin) return;
    chautariStore.updateLocalPost(post.id, {
      title: editTitle,
      content: editContent
    });
    offlineQueue.queueAction({
      type: 'CUSTOM',
      collection: 'communityPosts',
      docId: post.id,
      data: {
        title: editTitle,
        content: editContent,
        updatedAt: serverTimestamp()
      }
    });
    setIsEditing(false);
    toast.success("Post updated successfully");
  };

  const handleDelete = async () => {
    if (!isAdmin && !isEditor && !isAuthor) return;
    if (confirm("Are you sure you want to delete this post?")) {
      try {
        chautariStore.removeLocalPost(post.id);
        offlineQueue.queueAction({
          type: 'ARTICLE_DELETE',
          collection: 'communityPosts',
          docId: post.id
        });
        setIsDeleted(true);
        toast.success("Post deleted successfully");
      } catch (err: any) {
        console.error("Delete error:", err);
        toast.error("Failed to delete post");
      }
    }
  };

  const handleModerate = async (status: "removed" | "flagged" | "active") => {
    if (!isEditor) return;
    offlineQueue.queueAction({
      type: 'CUSTOM',
      collection: 'communityPosts',
      docId: post.id,
      data: { status }
    });
  };

  if (isDeleted) return null;

  return (
    <div 
      style={{ borderRadius: cardRadius }}
      className={`bg-card shadow-sm border border-border-theme overflow-hidden transition-all hover:bg-muted-area/30 ${isDetail ? "" : "hover:shadow-md"}`}
    >
      <div className="p-3 sm:p-5">
        {/* Reddit-style Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px] border border-primary/20 shrink-0">
              {post.category?.charAt(0) || "C"}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5 leading-tight">
              <span className="text-xs font-black text-card-foreground">c/{post.category}</span>
              <span className="hidden sm:inline text-muted-text/30">•</span>
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-text">
                <Link
                  to={post.authorId ? `/profile/${post.authorId}` : `/profile/${encodeURIComponent(post.authorName)}`}
                  className="font-medium hover:underline hover:text-primary transition-colors cursor-pointer"
                >
                  u/{post.authorName}
                </Link>
                <span>•</span>
                <span>{post.createdAt ? formatDistanceToNow(toSafeDate(post.createdAt)) + " ago" : "Just now"}</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-muted-area rounded-full transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-muted-text" />
            </button>
            <AnimatePresence>
                {showMenu && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-card rounded-2xl shadow-xl border border-border-theme py-2 z-50 overflow-hidden"
                  >
                    {isAuthor && (
                      <button 
                        onClick={() => { setIsEditing(true); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-card-foreground hover:bg-muted-area flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" /> Edit Post
                      </button>
                    )}
                    {(isAuthor || isAdmin) && (
                      <button 
                        onClick={() => { handleDelete(); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Post
                      </button>
                    )}
                    {isEditor && !isAuthor && (
                      <button 
                        onClick={() => { handleModerate("removed"); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 dark:text-orange-400 flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" /> Remove (Mod)
                      </button>
                    )}
                    {!isAuthor && (
                      <button 
                        onClick={() => { setIsReportOpen(true); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-muted-text hover:bg-muted-area flex items-center gap-2"
                      >
                        <Flag className="w-4 h-4" /> Report
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
          </div>
        </div>

        {/* Body */}
        {isEditing ? (
          <div className="space-y-4">
            <NepaliInput 
              value={editTitle}
              onChange={setEditTitle}
              className="w-full p-3 rounded-xl border border-border-theme bg-muted-area/50 text-foreground focus:ring-2 focus:ring-primary/20 outline-none font-bold text-xl"
            />
            <NepaliInput 
              value={editContent}
              onChange={setEditContent}
              rows={5}
              type="textarea"
              className="w-full p-3 rounded-xl border border-border-theme bg-muted-area/50 text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
            />
            <div className="flex gap-2">
              <button onClick={handleEdit} className="bg-primary text-white px-4 py-2 rounded-xl font-bold">Save</button>
              <button onClick={() => setIsEditing(false)} className="bg-muted-area text-muted-text px-4 py-2 rounded-xl">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Link to={`/community/post/${post.id}`} className="block group">
              <h3 className="text-lg sm:text-xl font-black text-card-foreground mb-1 sm:mb-2 group-hover:text-primary transition-colors tracking-tight break-words">
                {post.title}
              </h3>
              <p className={`text-muted-text/90 leading-relaxed text-sm sm:text-base font-medium break-words ${isDetail ? "" : "line-clamp-4"}`}>
                {post.content}
              </p>
            </Link>
            
            {post.imageUrl?.trim() && (
              <div 
                style={{ borderRadius: thumbRadius }}
                className="mt-3 overflow-hidden border border-border-theme bg-muted-area/20"
              >
                <img src={post.imageUrl || null} alt={post.title} className="w-full object-contain max-h-[512px] mx-auto" referrerPolicy="no-referrer" />
              </div>
            )}

            {post.hashtags && post.hashtags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {post.hashtags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="text-primary text-xs font-bold hover:underline cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {post.linkedArticleId && (
                <div className="mt-4 border-t border-border-theme pt-4">
                  <div className="bg-primary/5 hover:bg-primary/10 transition-all rounded-2xl p-4 border border-primary/20 group">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <Link 
                        to={`/article/${post.linkedArticleId}`} 
                        className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-90 transition-opacity"
                      >
                        {(linkedArticle?.featuredImage?.trim() || post.imageUrl?.trim()) && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-border-theme shadow-sm flex-shrink-0 bg-muted-area">
                            <img 
                              src={linkedArticle?.featuredImage || post.imageUrl || null} 
                              alt="" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer" 
                            />
                          </div>
                        )}
                        <div className="text-left min-w-0 flex-1">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                            <span>मूल समाचार सामग्री</span>
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-card-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {linkedArticle?.title || post.title.replace(" मा छलफल गरौं", "")}
                          </p>
                        </div>
                      </Link>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-border-theme/40">
                        {linkedArticle?.content && (
                          <button 
                            type="button"
                            onClick={() => setShowArticle(!showArticle)}
                            className="px-2.5 py-1.5 text-[11px] font-bold text-muted-text hover:text-foreground bg-card border border-border-theme rounded-xl transition-colors flex items-center gap-1"
                          >
                            {showArticle ? "संक्षेप लुकाउनुहोस्" : "संक्षेप"}
                            <ChevronDown className={`w-3.5 h-3.5 text-primary transition-transform ${showArticle ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                        <Link 
                          to={`/article/${post.linkedArticleId}`}
                          className="px-3 py-1.5 bg-primary text-white text-[11px] font-black rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1 shadow-sm flex-shrink-0"
                        >
                          पढ्नुहोस् <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    <AnimatePresence>
                      {showArticle && linkedArticle && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-card border border-border-theme rounded-xl mt-3 prose-nepali text-xs sm:text-sm max-h-[250px] overflow-y-auto custom-scrollbar">
                            <div className="text-card-foreground" dangerouslySetInnerHTML={{ __html: linkedArticle.content }} />
                            <Link 
                              to={`/article/${linkedArticle.id}`} 
                              className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs mt-3 hover:underline"
                            >
                              समग्र समाचार पृष्ठमा जानुहोस् <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Reddit-style Action Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center bg-muted-area/50 rounded-full border border-border-theme/50 p-0.5">
            <button 
              onClick={() => handleVote("up")}
              className={`p-1.5 sm:p-2 rounded-full transition-all ${
                userVote === "up" 
                  ? "text-orange-600 bg-orange-100 dark:bg-orange-950/30 dark:text-orange-400" 
                  : "text-muted-text hover:bg-muted-area hover:text-orange-500 active:scale-90"
              }`}
            >
              <ArrowBigUp className={`w-5 h-5 sm:w-6 sm:h-6 ${userVote === "up" ? "fill-current" : ""}`} />
            </button>
            <span className={`text-xs sm:text-sm font-black px-1 tabular-nums ${userVote === "up" ? "text-orange-600" : userVote === "down" ? "text-indigo-600" : "text-card-foreground"}`}>
              {(post.upvotes || 0) - (post.downvotes || 0) + scoreDelta}
            </span>
            <button 
              onClick={() => handleVote("down")}
              className={`p-1.5 sm:p-2 rounded-full transition-all ${
                userVote === "down" 
                  ? "text-indigo-600 bg-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400" 
                  : "text-muted-text hover:bg-muted-area hover:text-indigo-500 active:scale-90"
              }`}
            >
              <ArrowBigDown className={`w-5 h-5 sm:w-6 sm:h-6 ${userVote === "down" ? "fill-current" : ""}`} />
            </button>
          </div>

          <Link 
            to={`/community/post/${post.id}`}
            className="flex items-center gap-2 bg-muted-area/50 hover:bg-muted-area border border-border-theme/50 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 transition-all group"
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-muted-text group-hover:text-primary transition-colors" />
            <span className="text-xs sm:text-sm font-black text-muted-text group-hover:text-card-foreground">
              {post.commentCount || 0}
            </span>
          </Link>

          <button 
            onClick={() => {
              const url = `${window.location.origin}/community/post/${post.id}`;
              if (navigator.share) {
                navigator.share({ title: post.title, url });
              } else {
                navigator.clipboard.writeText(url);
                toast.success("Link copied!");
              }
            }}
            className="flex items-center gap-2 bg-muted-area/50 hover:bg-muted-area border border-border-theme/50 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 transition-all group"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-muted-text group-hover:text-primary transition-colors" />
            <span className="text-xs sm:text-sm font-black text-muted-text group-hover:text-card-foreground">Share</span>
          </button>
        </div>
      </div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetId={post.id}
        targetType="post"
        targetTitle={post.title}
        targetContent={post.content}
      />
    </div>
  );
}
