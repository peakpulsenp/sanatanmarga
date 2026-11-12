import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { SEOHead } from "@/src/components/common/SEOHead";
import { 
  Clock, Calendar, User, Share2, ArrowLeft, Bookmark, 
  MessageSquare, BookOpen, Sparkles, Check, Copy, Tag, 
  Layers, Volume2, Globe, Heart, ChevronRight
} from "lucide-react";
import { BlogPost, BlogSeries } from "@/src/types";
import { sanatanBlogService } from "@/src/services/sanatanBlogService";
import { ScriptureReferenceBox } from "@/src/components/blog/ScriptureReferenceBox";
import { SgisKnowledgeBox } from "@/src/components/blog/SgisKnowledgeBox";
import { BlogSidebar } from "@/src/components/blog/BlogSidebar";
import { ArticleAudioReader } from "@/src/components/news/ArticleAudioReader";
import { useLanguage } from "@/src/context/LanguageContext";
import AdBanner from "@/src/components/ads/AdBanner";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [series, setSeries] = useState<BlogSeries | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState<"en" | "ne">(language === "ne" ? "ne" : "en");
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadPost() {
      if (!slug) return;
      try {
        setLoading(true);
        const data = await sanatanBlogService.getBlogPostBySlug(slug);
        if (isMounted && data) {
          setPost(data);
          setLikesCount(data.likesCount || 0);

          // If post belongs to series, fetch series
          if (data.seriesSlug || data.seriesId) {
            const seriesData = await sanatanBlogService.getPostsBySeries(data.seriesSlug || data.seriesId || "");
            if (isMounted) setSeries(seriesData.series);
          }

          // Fetch related posts from same category
          const catPosts = await sanatanBlogService.getPostsByCategory(data.categorySlug || data.categoryId);
          if (isMounted) {
            setRelatedPosts(catPosts.posts.filter(p => p.id !== data.id));
          }
        }
      } catch (e) {
        console.error("Failed to load blog post:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPost();
    return () => { isMounted = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-20 text-center text-muted-text">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted-area rounded w-3/4 mx-auto" />
            <div className="h-4 bg-muted-area rounded w-1/2 mx-auto" />
            <div className="h-64 bg-muted-area rounded mt-8" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-20 text-center">
          <BookOpen className="w-12 h-12 text-muted-text mx-auto mb-4 opacity-50" />
          <h1 className="text-2xl font-bold text-main-text mb-2">Essay Not Found</h1>
          <p className="text-sm text-muted-text mb-6">The requested Sanatan Blog essay does not exist or has been archived.</p>
          <Link to="/blog" className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm">
            Back to Sanatan Blog
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isNepaliActive = selectedLang === "ne" && Boolean(post.bodyNe);
  const activeTitle = isNepaliActive ? (post.titleNe || post.title) : post.title;
  const activeSubtitle = isNepaliActive ? (post.subtitleNe || post.subtitle) : post.subtitle;
  const activeBody = isNepaliActive ? (post.bodyNe || post.body) : post.body;
  const activeExcerpt = isNepaliActive ? (post.excerptNe || post.excerpt) : post.excerpt;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Article link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    if (!liked) {
      setLiked(true);
      setLikesCount(prev => prev + 1);
      toast.success("Thank you for appreciating this essay");
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-main-text flex flex-col">
      <SEOHead 
        title={activeTitle}
        description={activeExcerpt || post.excerpt}
        image={post.featuredImage}
        type="article"
      />

      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-muted-text mb-6 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-muted-text/50" />
          <Link to="/blog" className="hover:text-primary transition-colors">Sanatan Blog</Link>
          <ChevronRight className="w-3 h-3 text-muted-text/50" />
          <Link to={`/blog/category/${post.categorySlug}`} className="hover:text-primary transition-colors font-medium">
            {post.categoryName}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Article Content Column */}
          <article className="lg:col-span-8 flex flex-col">
            {/* Header / Meta Bar */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <Link
                  to={`/blog/category/${post.categorySlug}`}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition-all"
                >
                  {post.categoryName}
                </Link>

                {/* Bilingual Language Selector */}
                {post.bodyNe && (
                  <div className="inline-flex rounded-lg border border-border-theme/70 bg-card-bg p-1 text-xs font-bold">
                    <button
                      onClick={() => setSelectedLang("en")}
                      className={`px-3 py-1 rounded-md transition-colors ${selectedLang === "en" ? "bg-primary text-white" : "text-muted-text hover:text-main-text"}`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setSelectedLang("ne")}
                      className={`px-3 py-1 rounded-md transition-colors ${selectedLang === "ne" ? "bg-primary text-white" : "text-muted-text hover:text-main-text"}`}
                    >
                      नेपाली
                    </button>
                  </div>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-main-text tracking-tight leading-tight mb-4">
                {activeTitle}
              </h1>

              {activeSubtitle && (
                <p className="text-base sm:text-lg text-muted-text leading-relaxed mb-6 font-serif">
                  {activeSubtitle}
                </p>
              )}

              {/* Author & Publishing Timestamp */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-border-theme/50">
                <div className="flex items-center gap-3">
                  {post.authorPhoto ? (
                    <img src={post.authorPhoto} alt={post.authorDisplayName} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {post.authorDisplayName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-main-text">{post.authorDisplayName}</div>
                    <div className="text-xxs text-muted-text flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readingTimeMinutes || 5} min read
                      </span>
                    </div>
                  </div>
                </div>

                {/* Social Share & Like Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      liked ? "bg-rose-500/10 border-rose-500 text-rose-500" : "bg-card-bg border-border-theme text-muted-text hover:text-rose-500"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current text-rose-500" : ""}`} />
                    <span>{likesCount}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card-bg border border-border-theme text-xs font-semibold text-muted-text hover:text-primary transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Share"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ListenOS Human TTS Reader */}
            <div className="mb-8">
              <ArticleAudioReader
                title={activeTitle}
                content={activeBody}
                language={isNepaliActive ? "ne" : "en"}
                article={post}
              />
            </div>

            {/* Featured Image */}
            {post.featuredImage && (
              <div className="mb-8 rounded-2xl overflow-hidden bg-muted-area border border-border-theme/60">
                <img
                  src={post.featuredImage}
                  alt={activeTitle}
                  className="w-full h-auto max-h-[500px] object-cover"
                />
              </div>
            )}

            {/* Canonical Scriptural Reference Box (Top highlight if available) */}
            {post.scriptureReferences && post.scriptureReferences.length > 0 && (
              <ScriptureReferenceBox references={post.scriptureReferences} />
            )}

            {/* Main Article Body (Markdown Rich Typography) */}
            <div className="prose prose-lg dark:prose-invert max-w-none text-main-text leading-relaxed font-sans font-normal mb-8">
              <div className="markdown-body">
                <ReactMarkdown>{activeBody}</ReactMarkdown>
              </div>
            </div>

            {/* RevenueOS Inline Ad Slot */}
            <div className="my-8">
              <AdBanner position="blog_inline" />
            </div>

            {/* Saraswati Global Information System (SGIS) Manuscript Box */}
            {post.sgisReferences && post.sgisReferences.length > 0 && (
              <SgisKnowledgeBox references={post.sgisReferences} />
            )}

            {/* Scholarly Sources and Citations */}
            {post.sources && post.sources.length > 0 && (
              <div className="my-6 p-4 rounded-xl bg-muted-area/50 border border-border-theme/40 text-xs">
                <h4 className="font-bold text-main-text uppercase tracking-wider mb-2">Sources & Scholarly Editions:</h4>
                <ul className="list-disc pl-4 space-y-1 text-muted-text">
                  {post.sources.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Post Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="pt-6 border-t border-border-theme/50 flex flex-wrap items-center gap-2 mb-8">
                <span className="text-xs font-bold text-muted-text uppercase flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  Tags:
                </span>
                {post.tags.map((tag, idx) => (
                  <Link
                    key={idx}
                    to={`/blog/tag/${tag}`}
                    className="px-3 py-1 rounded-md bg-muted-area text-xs text-muted-text font-medium hover:bg-primary hover:text-white transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* RevenueOS Bottom Banner */}
            <div className="mb-10">
              <AdBanner position="blog_bottom" />
            </div>
          </article>

          {/* Desktop Sticky Sidebar */}
          <div className="lg:col-span-4">
            <BlogSidebar post={post} series={series} relatedPosts={relatedPosts} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPostPage;
