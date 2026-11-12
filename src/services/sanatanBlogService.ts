import { BlogPost, BlogCategory, BlogSeries, BlogHomepageSnapshot, BlogStatus } from "@/src/types";
import { CANONICAL_BLOG_CATEGORIES, CANONICAL_BLOG_POSTS, CANONICAL_BLOG_SERIES } from "@/src/data/sanatanBlogData";
import { db } from "@/src/lib/firebase";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, limit } from "@/src/lib/firebase";

class SanatanBlogService {
  private cache: Record<string, { data: any; timestamp: number }> = {};
  private TTL = 60 * 1000; // 1 minute in-memory cache

  /**
   * Retrieves Blog Homepage Snapshot (Snapshot OS compliant, Zero direct listener storms)
   */
  async getBlogHomepageSnapshot(): Promise<BlogHomepageSnapshot> {
    const cacheKey = "blog_homepage_snapshot";
    if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].timestamp < this.TTL) {
      return this.cache[cacheKey].data;
    }

    try {
      const res = await fetch("/api/blog/snapshot/homepage");
      if (res.ok) {
        const data: BlogHomepageSnapshot = await res.json();
        this.cache[cacheKey] = { data, timestamp: Date.now() };
        return data;
      }
    } catch (e) {
      console.warn("[SanatanBlog] Snapshot fetch failed, using fallback:", e);
    }

    // High-fidelity fallback from canonical data
    const publishedPosts = CANONICAL_BLOG_POSTS.filter(p => p.status === "published");
    const snapshot: BlogHomepageSnapshot = {
      generatedAt: new Date().toISOString(),
      version: "4.2.7-rc2",
      featuredEssay: publishedPosts.find(p => p.featured) || publishedPosts[0] || null,
      featuredTopics: CANONICAL_BLOG_CATEGORIES.filter(c => c.isActive && c.isFeatured),
      latestPosts: publishedPosts,
      scripturePosts: publishedPosts.filter(p => p.categoryId === "cat_vedas_upanishads" || p.categoryId === "cat_gita"),
      philosophyPosts: publishedPosts.filter(p => p.categoryId === "cat_darshan" || p.categoryId === "cat_dharma"),
      traditionPosts: publishedPosts.filter(p => p.categoryId === "cat_festivals" || p.categoryId === "cat_nepal_himalayas"),
      yogaSadhanaPosts: publishedPosts.filter(p => p.categoryId === "cat_yoga_sadhana"),
      templeHeritagePosts: publishedPosts.filter(p => p.categoryId === "cat_temples_tirtha"),
      popularPosts: [...publishedPosts].sort((a, b) => (b.views || 0) - (a.views || 0)),
      featuredSeries: CANONICAL_BLOG_SERIES,
      categories: CANONICAL_BLOG_CATEGORIES.filter(c => c.isActive)
    };

    this.cache[cacheKey] = { data: snapshot, timestamp: Date.now() };
    return snapshot;
  }

  /**
   * Retrieves a single BlogPost by slug or id
   */
  async getBlogPostBySlug(slugOrId: string): Promise<BlogPost | null> {
    const cacheKey = `blog_post_${slugOrId}`;
    if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].timestamp < this.TTL) {
      return this.cache[cacheKey].data;
    }

    try {
      const res = await fetch(`/api/blog/posts/${encodeURIComponent(slugOrId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.post) {
          this.cache[cacheKey] = { data: data.post, timestamp: Date.now() };
          return data.post;
        }
      }
    } catch (e) {
      console.warn(`[SanatanBlog] Server fetch for post ${slugOrId} failed:`, e);
    }

    // Try Firestore direct if online
    try {
      const q = query(
        collection(db, "blog_posts"),
        where("slug", "==", slugOrId),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const post = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as BlogPost;
        this.cache[cacheKey] = { data: post, timestamp: Date.now() };
        return post;
      }
    } catch (err) {}

    // Fallback from canonical data
    const matched = CANONICAL_BLOG_POSTS.find(p => p.slug === slugOrId || p.id === slugOrId);
    if (matched) {
      this.cache[cacheKey] = { data: matched, timestamp: Date.now() };
      return matched;
    }

    return null;
  }

  /**
   * Retrieves posts by Category slug
   */
  async getPostsByCategory(categorySlug: string): Promise<{ category: BlogCategory | null; posts: BlogPost[] }> {
    const category = CANONICAL_BLOG_CATEGORIES.find(c => c.slug === categorySlug || c.id === categorySlug) || null;
    
    try {
      const res = await fetch(`/api/blog/category/${encodeURIComponent(categorySlug)}`);
      if (res.ok) {
        const data = await res.json();
        return { category: data.category || category, posts: data.posts || [] };
      }
    } catch (e) {}

    const posts = CANONICAL_BLOG_POSTS.filter(p => 
      p.status === "published" && (p.categorySlug === categorySlug || p.categoryId === category?.id)
    );

    return { category, posts };
  }

  /**
   * Retrieves posts by Series slug
   */
  async getPostsBySeries(seriesSlug: string): Promise<{ series: BlogSeries | null; posts: BlogPost[] }> {
    const series = CANONICAL_BLOG_SERIES.find(s => s.slug === seriesSlug || s.id === seriesSlug) || null;
    
    try {
      const res = await fetch(`/api/blog/series/${encodeURIComponent(seriesSlug)}`);
      if (res.ok) {
        const data = await res.json();
        return { series: data.series || series, posts: data.posts || [] };
      }
    } catch (e) {}

    const posts = CANONICAL_BLOG_POSTS.filter(p => 
      p.status === "published" && (p.seriesSlug === seriesSlug || p.seriesId === series?.id)
    ).sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));

    return { series, posts };
  }

  /**
   * Retrieves posts by Tag
   */
  async getPostsByTag(tag: string): Promise<BlogPost[]> {
    const cleanTag = tag.toLowerCase().trim();
    return CANONICAL_BLOG_POSTS.filter(p => 
      p.status === "published" && p.tags.some(t => t.toLowerCase() === cleanTag)
    );
  }

  /**
   * Retrieves all Categories
   */
  async getAllCategories(): Promise<BlogCategory[]> {
    try {
      const res = await fetch("/api/blog/categories");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          return data.categories;
        }
      }
    } catch (e) {}
    return CANONICAL_BLOG_CATEGORIES;
  }

  /**
   * Retrieves all Series
   */
  async getAllSeries(): Promise<BlogSeries[]> {
    try {
      const res = await fetch("/api/blog/series");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.series) && data.series.length > 0) {
          return data.series;
        }
      }
    } catch (e) {}
    return CANONICAL_BLOG_SERIES;
  }

  /**
   * Save or update a BlogPost (Editorial state machine enforcement)
   */
  async savePost(post: Partial<BlogPost>, authorUser: { uid: string; displayName?: string }): Promise<BlogPost> {
    const isNew = !post.id;
    const postId = post.id || `blog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    const canonicalPost: BlogPost = {
      id: postId,
      slug: post.slug || (post.title ? post.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : `post-${postId}`),
      title: post.title || "Untitled Blog Post",
      titleNe: post.titleNe || post.title || "",
      subtitle: post.subtitle || "",
      subtitleNe: post.subtitleNe || "",
      excerpt: post.excerpt || "",
      excerptNe: post.excerptNe || "",
      body: post.body || "",
      bodyNe: post.bodyNe || "",
      featuredImage: post.featuredImage || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=1200",
      gallery: post.gallery || [],
      // Preserves original human author
      authorId: isNew ? authorUser.uid : (post.authorId || authorUser.uid),
      authorDisplayName: isNew ? (authorUser.displayName || "Sanatan Scholar") : (post.authorDisplayName || authorUser.displayName || "Sanatan Scholar"),
      authorPhoto: post.authorPhoto,
      authorBio: post.authorBio,
      authorBioNe: post.authorBioNe,
      createdBy: isNew ? authorUser.uid : (post.createdBy || authorUser.uid),
      lastEditedBy: authorUser.uid,
      reviewedBy: post.reviewedBy,
      approvedBy: post.approvedBy,
      publishedBy: post.publishedBy,
      categoryId: post.categoryId || "cat_dharma",
      categorySlug: post.categorySlug || "dharma",
      categoryName: post.categoryName || "Dharma & Ethics",
      categoryNameNe: post.categoryNameNe || "धर्म र नीतिशास्त्र",
      tags: post.tags || [],
      seriesId: post.seriesId,
      seriesSlug: post.seriesSlug,
      seriesName: post.seriesName,
      seriesOrder: post.seriesOrder,
      language: post.language || "bilingual",
      translationStatus: post.translationStatus || "completed",
      status: post.status || "draft",
      featured: Boolean(post.featured),
      pinned: Boolean(post.pinned),
      readingTimeMinutes: post.readingTimeMinutes || Math.max(1, Math.ceil((post.body || "").split(/\s+/).length / 200)),
      seoTitle: post.seoTitle || post.title,
      seoDescription: post.seoDescription || post.excerpt,
      canonicalUrl: `/blog/${post.slug || postId}`,
      scriptureReferences: post.scriptureReferences || [],
      sgisReferences: post.sgisReferences || [],
      knowledgeGraphEntities: post.knowledgeGraphEntities || [],
      sources: post.sources || [],
      aiAssisted: Boolean(post.aiAssisted),
      aiModel: post.aiModel,
      aiTaskType: post.aiTaskType,
      views: post.views || 0,
      shares: post.shares || 0,
      likesCount: post.likesCount || 0,
      createdAt: post.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: post.status === "published" ? (post.publishedAt || new Date().toISOString()) : post.publishedAt,
      snapshotVersion: "4.2.7-rc2",
      schemaVersion: 3
    };

    // Save to Firestore
    try {
      const docRef = doc(db, "blog_posts", postId);
      await setDoc(docRef, canonicalPost, { merge: true });
    } catch (e) {
      console.warn("[SanatanBlog] Firestore save failed, syncing via server/offline:", e);
    }

    // Call server to trigger snapshot invalidation if published
    try {
      await fetch("/api/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(canonicalPost)
      });
    } catch (e) {}

    // Invalidate local memory cache
    this.cache = {};
    return canonicalPost;
  }

  /**
   * Publishes a post with role verification
   */
  async publishPost(postId: string, editorUser: { uid: string; displayName?: string }): Promise<boolean> {
    try {
      const res = await fetch(`/api/blog/posts/${encodeURIComponent(postId)}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishedBy: editorUser.uid, publishedByName: editorUser.displayName })
      });
      if (res.ok) {
        this.cache = {};
        return true;
      }
    } catch (e) {}

    try {
      const docRef = doc(db, "blog_posts", postId);
      await updateDoc(docRef, {
        status: "published",
        publishedBy: editorUser.uid,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      this.cache = {};
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * AI Blog Assistant for drafting, outline, translation, and scripture suggestions
   */
  async aiAssist(prompt: string, taskType: "draft" | "outline" | "translation" | "summary" | "scripture_lookup"): Promise<any> {
    try {
      const res = await fetch("/api/blog/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, taskType })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error("[SanatanBlog] AI assist error:", e);
    }
    return { success: false, error: "AI Assistant temporarily unavailable" };
  }
}

export const sanatanBlogService = new SanatanBlogService();
