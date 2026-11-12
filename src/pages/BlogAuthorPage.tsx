import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { SEOHead } from "@/src/components/common/SEOHead";
import { User, BookOpen, ChevronRight, RefreshCw, ArrowLeft, Award, Sparkles } from "lucide-react";
import { BlogPost } from "@/src/types";
import { sanatanBlogService } from "@/src/services/sanatanBlogService";
import { BlogCard } from "@/src/components/blog/BlogCard";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";

export const BlogAuthorPage: React.FC = () => {
  const { authorId } = useParams<{ authorId: string }>();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!authorId) return;
      try {
        setLoading(true);
        const snapshot = await sanatanBlogService.getBlogHomepageSnapshot();
        if (isMounted) {
          const authorPosts = snapshot.latestPosts.filter(p => p.authorId === authorId);
          setPosts(authorPosts);
        }
      } catch (e) {
        console.error("Failed to load author posts:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [authorId]);

  const authorName = posts[0]?.authorDisplayName || "Sanatan Scholar";
  const authorBio = posts[0]?.authorBio || "Sanatan scholar and researcher dedicated to timeless philosophy and Himalayan heritage.";
  const authorPhoto = posts[0]?.authorPhoto;

  return (
    <div className="min-h-screen bg-app-bg text-main-text flex flex-col">
      <SEOHead 
        title={authorName}
        description={`Read all philosophical and scriptural essays by ${authorName} on Sanatan Blog.`}
      />

      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-xs text-muted-text mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-muted-text/50" />
          <Link to="/blog" className="hover:text-primary transition-colors">Sanatan Blog</Link>
          <ChevronRight className="w-3 h-3 text-muted-text/50" />
          <span className="text-main-text font-medium">{authorName}</span>
        </div>

        <div className="p-8 rounded-2xl bg-card-bg border border-border-theme/60 mb-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {authorPhoto ? (
            <img src={authorPhoto} alt={authorName} className="w-24 h-24 rounded-full object-cover border-2 border-primary/20 flex-shrink-0" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl flex-shrink-0">
              {authorName.charAt(0)}
            </div>
          )}

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>Sanatan Scholar & Essayist</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-main-text mb-2">
              {authorName}
            </h1>
            <p className="text-sm text-muted-text max-w-2xl leading-relaxed">
              {authorBio}
            </p>
          </div>
        </div>

        <h2 className="text-lg font-bold text-main-text mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <span>Essays by {authorName} ({posts.length})</span>
        </h2>

        {loading ? (
          <div className="py-16 text-center text-muted-text flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span>Loading author essays...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center bg-card-bg border border-border-theme/60 rounded-xl p-8">
            <BookOpen className="w-8 h-8 text-muted-text mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-text font-medium mb-4">No published essays found for this author.</p>
            <Link to="/blog" className="text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all blog posts</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} variant="standard" />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BlogAuthorPage;
