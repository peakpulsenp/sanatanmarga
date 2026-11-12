import { CommunityPost, CommunityComment } from "@/src/types";

const POSTS_KEY = "chautari_local_posts";
const VOTES_KEY = "chautari_user_votes";
const COMMENTS_KEY = "chautari_local_comments";

export const chautariStore = {
  // --- POSTS ---
  getLocalPosts(): CommunityPost[] {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(POSTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  },

  addLocalPost(post: CommunityPost): void {
    if (typeof window === "undefined") return;
    try {
      const existing = this.getLocalPosts();
      // Remove duplicate if exists
      const filtered = existing.filter(p => p.id !== post.id);
      const updated = [post, ...filtered].slice(0, 100); // keep up to 100
      localStorage.setItem(POSTS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("chautari-post-created", { detail: post }));
    } catch (e) {
      console.error("Failed to save local chautari post:", e);
    }
  },

  getLocalPostById(postId: string): CommunityPost | null {
    const posts = this.getLocalPosts();
    return posts.find(p => p.id === postId) || null;
  },

  removeLocalPost(postId: string): void {
    if (typeof window === "undefined") return;
    try {
      const existing = this.getLocalPosts();
      const updated = existing.filter(p => p.id !== postId);
      localStorage.setItem(POSTS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("chautari-post-deleted", { detail: postId }));
    } catch (e) {}
  },

  updateLocalPost(postId: string, data: Partial<CommunityPost>): void {
    if (typeof window === "undefined") return;
    try {
      const existing = this.getLocalPosts();
      const updated = existing.map(p => p.id === postId ? { ...p, ...data, updatedAt: new Date().toISOString() } : p);
      localStorage.setItem(POSTS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("chautari-post-updated", { detail: { postId, data } }));
    } catch (e) {}
  },

  // --- VOTES ---
  getUserVotes(): Record<string, "up" | "down"> {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem(VOTES_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  },

  getUserVote(targetId: string): "up" | "down" | null {
    const votes = this.getUserVotes();
    return votes[targetId] || null;
  },

  setUserVote(targetId: string, type: "up" | "down" | null): void {
    if (typeof window === "undefined") return;
    try {
      const votes = this.getUserVotes();
      if (type === null) {
        delete votes[targetId];
      } else {
        votes[targetId] = type;
      }
      localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
      window.dispatchEvent(new CustomEvent("chautari-vote-changed", { detail: { targetId, type } }));
    } catch (e) {
      console.error("Failed to save user vote:", e);
    }
  },

  // --- COMMENTS ---
  getAllLocalComments(): CommunityComment[] {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(COMMENTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  },

  getLocalComments(postId: string): CommunityComment[] {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(COMMENTS_KEY);
      const allComments: CommunityComment[] = saved ? JSON.parse(saved) : [];
      return allComments.filter(c => c.postId === postId);
    } catch (e) {
      return [];
    }
  },

  addLocalComment(comment: CommunityComment): void {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(COMMENTS_KEY);
      const allComments: CommunityComment[] = saved ? JSON.parse(saved) : [];
      const updated = [comment, ...allComments.filter(c => c.id !== comment.id)].slice(0, 200);
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("chautari-comment-created", { detail: comment }));
    } catch (e) {
      console.error("Failed to save local comment:", e);
    }
  }
};
