import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { SEOHead } from "@/src/components/common/SEOHead";
import { BookOpen, Compass, ChevronRight, RefreshCw, ArrowLeft } from "lucide-react";
import { BlogCategory, BlogPost } from "@/src/types";
import { sanatanBlogService } from "@/src/services/sanatanBlogService";
import { BlogCard } from "@/src/components/blog/BlogCard";
import { useLanguage } from "@/src/context/LanguageContext";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";

export const BlogCategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const isNe = language === "ne";
  const [category, setCategory] = useState<BlogCategory | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!slug) return;
      try {
        setLoading(true);
        const data = await sanatanBlogService.getPostsByCategory(slug);
        if (isMounted) {
          setCategory(data.category);
          setPosts(data.posts);
        }
      } catch (e) {
        console.error("Failed to load category posts:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [slug]);

  const catName = category ? ((isNe && category.nameNe) ? category.nameNe : category.name) : slug;
  const catDesc = category ? ((isNe && category.descriptionNe) ? category.descriptionNe : category.description) : "";

  return (
    <div className="min-h-screen bg-app-bg text-main-text flex flex-col">
      <SEOHead 
        title={catName}
        description={catDesc || `Explore scholarly Sanatan essays on ${catName}.`}
      />

      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-xs text-muted-text mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-muted-text/50" />
          <Link to="/blog" className="hover:text-primary transition-colors">Sanatan Blog</Link>
          <ChevronRight className="w-3 h-3 text-muted-text/50" />
          <span className="text-main-text font-medium">{catName}</span>
        </div>

        <div className="p-8 rounded-2xl bg-card-bg border border-border-theme/60 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Compass className="w-3.5 h-3.5" />
            <span>Category Taxonomy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-main-text mb-3">
            {catName}
          </h1>
          {catDesc && (
            <p className="text-sm sm:text-base text-muted-text max-w-3xl leading-relaxed">
              {catDesc}
            </p>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-text flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span>Loading category essays...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center bg-card-bg border border-border-theme/60 rounded-xl p-8">
            <BookOpen className="w-8 h-8 text-muted-text mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-text font-medium mb-4">
              {isNe ? "यस विधामा हाल कुनै लेख प्रकाशित गरिएको छैन।" : "No blog posts published in this category yet."}
            </p>
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

export default BlogCategoryPage;
