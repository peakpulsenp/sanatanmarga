import { useState, useEffect } from "react";
import { collection, query, orderBy, safeOnSnapshot as onSnapshot, getDocs, doc, updateDoc, deleteDoc } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { CommunityPost, CommunityComment } from "@/src/types";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { Shield, Trash2, CheckCircle, AlertTriangle, Eye, MessageSquare, User, Share2, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { toSafeDate } from "@/src/lib/utils";

import { snapshotEngine } from "@/src/services/snapshotEngine";
import { AdminSkeleton } from "@/src/components/ui/PageLoaders";
import { offlineQueue } from "@/src/lib/offlineQueue";
import { chautariStore } from "@/src/utils/chautariStore";
import { toast } from "sonner";

export default function AdminCommunity() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "shared_articles" | "comments">("posts");
  const [filter, setFilter] = useState<"all" | "active" | "flagged" | "removed">("all");

  useEffect(() => {
    const combine = (remote: CommunityPost[]) => {
      const local = chautariStore.getLocalPosts();
      const map = new Map<string, CommunityPost>();
      remote.forEach(p => { if (p && p.id) map.set(p.id, p); });
      local.forEach(p => { if (p && p.id) map.set(p.id, p); });
      return Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    };

    // Hydrate local posts immediately
    const initialLocal = chautariStore.getLocalPosts();
    if (initialLocal.length > 0) {
      setPosts(initialLocal);
      setLoading(false);
    }

    const q1 = query(collection(db, "communityPosts"), orderBy("createdAt", "desc"));
    const unsubscribe1 = onSnapshot(q1, async (snapshot) => {
      let postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommunityPost[];

      if (postsData.length === 0) {
        try {
          const snap2 = await getDocs(query(collection(db, "community_posts"), orderBy("createdAt", "desc")));
          postsData = snap2.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as CommunityPost[];
        } catch (e) {}
      }

      setPosts(combine(postsData));
      setLoading(false);
    });

    // Also fetch recent comments for moderation
    const fetchComments = async () => {
      try {
        const cSnap = await getDocs(query(collection(db, "communityComments"), orderBy("createdAt", "desc")));
        const remoteComments = cSnap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityComment));
        const localComments = chautariStore.getAllLocalComments ? chautariStore.getAllLocalComments() : [];
        const cMap = new Map<string, CommunityComment>();
        remoteComments.forEach(c => cMap.set(c.id, c));
        localComments.forEach(c => cMap.set(c.id, c));
        setComments(Array.from(cMap.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
      } catch (e) {
        if (chautariStore.getAllLocalComments) {
          setComments(chautariStore.getAllLocalComments());
        }
      }
    };
    fetchComments();

    return () => unsubscribe1();
  }, []);

  const filteredPosts = posts.filter(post => {
    if (activeTab === "shared_articles") {
      const isShared = Boolean(post.linkedArticleId || post.category === "article_share" || post.hashtags?.includes("समाचार"));
      if (!isShared) return false;
    }
    if (filter === "all") return true;
    return post.status === filter;
  });

  const handleStatusChange = async (postId: string, status: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: status as any } : p));
    chautariStore.updateLocalPost(postId, { status: status as any });
    try {
      await updateDoc(doc(db, "communityPosts", postId), { status });
    } catch (e) {}
    offlineQueue.queueAction({
      type: 'ARTICLE_UPDATE',
      collection: 'communityPosts',
      docId: postId,
      data: { status }
    });
    toast.success(`पोस्टको स्थिति '${status}' मा परिवर्तन भयो।`);
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm("Permanently delete this post?")) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      chautariStore.removeLocalPost(postId);
      try {
        await deleteDoc(doc(db, "communityPosts", postId));
      } catch (e) {}
      try {
        await deleteDoc(doc(db, "community_posts", postId));
      } catch (e) {}
      offlineQueue.queueAction({
        type: 'ARTICLE_DELETE',
        collection: 'communityPosts',
        docId: postId
      });
      toast.success("पोस्ट सफलतापूर्वक हटाइयो।");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (confirm("Permanently delete this comment?")) {
      setComments(prev => prev.filter(c => c.id !== commentId));
      try {
        await deleteDoc(doc(db, "communityComments", commentId));
      } catch (e) {}
      toast.success("टिप्पणी हटाइयो।");
    }
  };

  if (loading) return <AdminSkeleton />;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-card-foreground flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                चौतारी सञ्चालन तथा अनुगमन (Chautari Moderation OS)
              </h1>
              <p className="text-muted-text text-xs sm:text-sm font-medium">
                सार्वजनिक नागरिक संवाद, साझा गरिएका समाचार र टिप्पणीहरूको निगरानी तथा स्वीकृति कक्ष
              </p>
            </div>

            {/* View Mode Tabs */}
            <div className="flex bg-muted-area p-1 rounded-2xl border border-border-theme">
              <button
                onClick={() => setActiveTab("posts")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "posts" ? "bg-card text-foreground shadow-sm" : "text-muted-text hover:text-foreground"
                }`}
              >
                सबै पोस्टहरू ({posts.length})
              </button>
              <button
                onClick={() => setActiveTab("shared_articles")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  activeTab === "shared_articles" ? "bg-card text-foreground shadow-sm" : "text-muted-text hover:text-foreground"
                }`}
              >
                <Share2 size={13} />
                <span>साझा समाचार</span>
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  activeTab === "comments" ? "bg-card text-foreground shadow-sm" : "text-muted-text hover:text-foreground"
                }`}
              >
                <MessageCircle size={13} />
                <span>टिप्पणीहरू ({comments.length})</span>
              </button>
            </div>
          </div>

          {activeTab !== "comments" && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-text">फिल्टर:</span>
              <div className="flex bg-card p-1 rounded-xl shadow-xs border border-border-theme">
                {["all", "active", "flagged", "removed"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                      filter === f ? "bg-primary text-white" : "text-muted-text hover:bg-muted-area"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "comments" ? (
            <div className="grid gap-3">
              {comments.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-3xl border border-dashed border-border-theme">
                  <p className="text-muted-text font-bold">कुनै टिप्पणी फेला परेन।</p>
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="bg-card p-4 rounded-2xl border border-border-theme flex items-start justify-between gap-4">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-card-foreground">{c.authorName || "अज्ञात प्रयोगकर्ता"}</span>
                        <span className="text-muted-text">•</span>
                        <span className="text-muted-text">{c.createdAt ? format(toSafeDate(c.createdAt), "MMM d, yyyy HH:mm") : "N/A"}</span>
                      </div>
                      <p className="text-card-foreground text-sm">{c.text || (c as any).content}</p>
                      <div className="text-[11px] text-muted-text">थ्रेड ID: <span className="font-mono">{c.postId}</span></div>
                    </div>
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                      title="Delete Comment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    layout
                    className="bg-card p-6 rounded-3xl shadow-xs border border-border-theme flex flex-col md:flex-row md:items-start justify-between gap-4"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          post.status === 'active' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                          post.status === 'flagged' ? 'bg-orange-500/10 text-orange-600' :
                          'bg-red-500/10 text-red-600'
                        }`}>
                          {post.status}
                        </span>
                        {post.linkedArticleId && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center gap-1">
                            <Share2 size={10} /> साझा समाचार (Article)
                          </span>
                        )}
                        <span className="text-muted-text/30">•</span>
                        <span className="font-bold text-card-foreground flex items-center gap-1">
                          <User className="w-3 h-3" /> {post.authorName}
                        </span>
                        <span className="text-muted-text/30">•</span>
                        <span className="text-muted-text">{post.createdAt ? format(toSafeDate(post.createdAt), "MMM d, yyyy") : "N/A"}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-card-foreground">{post.title}</h3>
                      <p className="text-muted-text text-xs sm:text-sm line-clamp-3 leading-relaxed">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs font-bold text-muted-text/70 pt-1">
                        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> {post.upvotes || 0} Upvotes</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3 text-primary" /> {post.commentCount || 0} Comments</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-start">
                      <button 
                        onClick={() => handleStatusChange(post.id, "active")}
                        className="p-2.5 bg-green-500/10 text-green-600 rounded-xl hover:bg-green-500/20 transition-colors cursor-pointer"
                        title="Approve / Active"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleStatusChange(post.id, "flagged")}
                        className="p-2.5 bg-orange-500/10 text-orange-600 rounded-xl hover:bg-orange-500/20 transition-colors cursor-pointer"
                        title="Flag"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2.5 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500/20 transition-colors cursor-pointer"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => window.open(`/community/post/${post.id}`, "_blank")}
                        className="p-2.5 bg-muted-area text-muted-text rounded-xl hover:bg-muted transition-colors border border-border-theme cursor-pointer"
                        title="View Post"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border-theme">
                  <p className="text-muted-text font-bold">कुनै पोस्ट फेला परेन।</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
