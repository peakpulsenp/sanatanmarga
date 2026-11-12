import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, query, where, orderBy, safeOnSnapshot as onSnapshot, addDoc, serverTimestamp, updateDoc, increment } from "@/src/lib/firebase";
import { db, getDocWithCacheFallback, safeOnSnapshot, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { useAuth } from "@/src/lib/auth";
import { useLanguage } from "@/src/context/LanguageContext";
import { formatDate } from "@/src/lib/utils";
import { CommunityPost, CommunityComment } from "@/src/types";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import PostCard from "@/src/components/community/PostCard";
import CommentItem from "@/src/components/community/CommentItem";
import NepaliInput from "@/src/components/ui/NepaliInput";
import { ArrowLeft, Send, MessageSquare, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { ArticleSkeleton } from "@/src/components/ui/PageLoaders";

import { formatDistanceToNow } from "date-fns";
import { toSafeDate } from "@/src/lib/utils";
import { toast } from "sonner";
import { offlineQueue } from "@/src/lib/offlineQueue";

import { chautariStore } from "@/src/utils/chautariStore";

export default function CommunityPostPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);

    const combineComments = (remoteComments: CommunityComment[]) => {
      const localComments = chautariStore.getLocalComments(id);
      const map = new Map<string, CommunityComment>();
      remoteComments.forEach(c => { if (c && c.id) map.set(c.id, c); });
      localComments.forEach(c => { if (c && c.id) map.set(c.id, c); });
      return Array.from(map.values()).sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
    };

    const loadThread = async () => {
      // 1. Check local store first for newly created/shared post
      const localPost = chautariStore.getLocalPostById(id);
      if (localPost && isMounted) {
        setPost(localPost);
        setComments(combineComments([]));
        setLoading(false);
      }

      try {
        const threadSnap = await snapshotEngine.getChautariThreadSnapshot(id);
        if (threadSnap && threadSnap.post) {
          if (isMounted) {
            setPost(threadSnap.post);
            if (Array.isArray(threadSnap.comments)) {
              setComments(combineComments(threadSnap.comments));
            }
            setLoading(false);
          }
          return;
        }
      } catch (e) {}

      // Fallback to Firestore
      try {
        const postRef = doc(db, "communityPosts", id);
        const postSnap = await getDocWithCacheFallback(postRef);
        if (postSnap.exists() && isMounted) {
          setPost({ id: postSnap.id, ...postSnap.data() } as CommunityPost);
        }
      } catch (err) {
        console.error("Error fetching community post:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadThread();

    // Fetch Comments via safeOnSnapshot for real-time interaction
    const commentsRef = collection(db, "communityComments");
    const q = query(
      commentsRef, 
      where("postId", "==", id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = safeOnSnapshot(q, (snapshot) => {
      if (!isMounted) return;
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommunityComment[];
      setComments(combineComments(commentsData));
    }, `community/post/${id}/comments`);

    const handleCommentCreated = () => {
      if (isMounted) {
        setComments(prev => combineComments(prev));
      }
    };

    window.addEventListener("chautari-comment-created", handleCommentCreated);

    return () => {
      isMounted = false;
      window.removeEventListener("chautari-comment-created", handleCommentCreated);
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [id]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !newComment.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const commentId = Math.random().toString(36).substring(2, 15);
      const commentObj: CommunityComment = {
        id: commentId,
        postId: id,
        authorId: user.uid,
        authorName: user.displayName || "Anonymous",
        authorPhoto: user.photoURL || null,
        text: newComment.trim(),
        upvotes: 0,
        downvotes: 0,
        createdAt: new Date().toISOString()
      };

      chautariStore.addLocalComment(commentObj);

      offlineQueue.queueAction({
        type: 'COMMENT_CREATE',
        collection: 'communityComments',
        docId: commentId,
        data: {
          ...commentObj,
          createdAt: serverTimestamp()
        },
        userId: user.uid
      });

      // Update comment count on post
      offlineQueue.queueAction({
        type: 'CUSTOM',
        collection: 'communityPosts',
        docId: id,
        data: {
          commentCount: ((post?.commentCount || 0) + 1)
        }
      });

      setNewComment("");
      toast.success("प्रतिक्रिया सुरक्षित गरियो");
    } catch (err: any) {
      console.error("Error posting comment:", err);
      setError(language === 'en' ? "Failed to post comment. Please try again." : "प्रतिक्रिया पठाउन असफल भयो। कृपया पुनः प्रयास गर्नुहोस्।");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ArticleSkeleton />;
  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-card-foreground mb-4">
          {language === 'en' ? "Post not found" : "पोस्ट फेला परेन"}
        </h2>
        <Link to="/community" className="text-primary font-bold flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> 
          {language === 'en' ? "Back to Community" : "चौतारीमा फर्कनुहोस्"}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <Link to="/community" className="inline-flex items-center gap-2 text-muted-text hover:text-primary transition-colors font-black text-[10px] uppercase tracking-[0.2em] mb-2">
              <ArrowLeft className="w-4 h-4" />
              {language === 'en' ? "Back to Community" : "चौतारीमा फर्कनुहोस्"}
            </Link>

            <PostCard post={post} isDetail />

            {/* Comment Form (Integrated look) */}
            <div className="bg-card rounded-xl p-4 sm:p-6 border border-border-theme shadow-sm">
               {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black">
                      {user.displayName?.charAt(0) || "U"}
                    </div>
                    <span className="text-xs font-bold text-muted-text">
                      {language === 'en' ? `Comment as ${user.displayName || "user"}` : `${user.displayName || "प्रयोगकर्ता"}को रूपमा टिप्पणी गर्नुहोस्`}
                    </span>
                  </div>
                  <form onSubmit={handleComment} className="space-y-3">
                    <NepaliInput 
                      placeholder={language === 'en' ? "What are your thoughts?" : "तपाईंको विचार के छ? लेख्नुहोस्..."}
                      value={newComment}
                      onChange={(val) => setNewComment(val)}
                      type="textarea"
                      rows={3}
                      className="w-full bg-muted-area/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none text-sm placeholder:text-muted-text/30"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting || !newComment.trim()}
                        className="bg-primary text-white px-6 py-2 rounded-full text-xs font-black shadow-md hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {submitting 
                          ? (language === 'en' ? "Posting..." : "पठाउँदै...") 
                          : (language === 'en' ? "Comment" : "टिप्पणी गर्नुहोस्")}
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="text-center py-6 bg-muted-area/30 rounded-xl border border-dashed border-border-theme">
                  <p className="text-xs font-bold text-muted-text mb-3">
                    {language === 'en' ? "Join the conversation" : "छलफलमा सामेल हुनुहोस्"}
                  </p>
                  <Link to="/login" className="bg-primary text-white px-6 py-2 rounded-full text-xs font-black inline-block shadow-md">
                    {language === 'en' ? "Log In" : "लग-इन"}
                  </Link>
                </div>
              )}
            </div>

            {/* Comments List */}
            <div className="space-y-6 pt-6">
               {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments
                    .filter(c => !c.parentId)
                    .map((comment) => (
                      <CommentItem 
                        key={comment.id} 
                        comment={comment} 
                        replies={comments.filter(r => r.parentId === comment.id)}
                        onReplyAdded={() => {}}
                      />
                    ))
                  }
                </div>
              ) : (
                <div className="text-center py-20 bg-card rounded-xl border border-border-theme shadow-inner">
                  <MessageSquare className="w-12 h-12 text-muted-text/10 mx-auto mb-4" />
                  <p className="text-sm font-bold text-muted-text">
                    {language === 'en' ? "No comments yet. Be the first to share your thoughts!" : "अहिलेसम्म कुनै टिप्पणी छैन। आफ्नो विचार राख्ने पहिलो व्यक्ति बन्नुहोस्!"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside className="hidden lg:block w-80 space-y-4 shrink-0">
            <div className="sticky top-24 space-y-4">
               <div className="bg-card rounded-2xl border border-border-theme p-6 shadow-sm">
                <h4 className="text-xs font-black text-card-foreground mb-4 uppercase tracking-widest opacity-50">
                  {language === 'en' ? "About Post" : "पोस्ट बारे"}
                </h4>
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-text">{language === 'en' ? "Category" : "वर्ग"}</span>
                    <span className="font-bold text-primary">c/{post.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-text">{language === 'en' ? "Created" : "प्रकाशित"}</span>
                    <span className="font-bold">{post.createdAt ? formatDistanceToNow(toSafeDate(post.createdAt)) : (language === 'en' ? "Just now" : "भर्खरै")} {language === 'en' ? "ago" : "अघि"}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
