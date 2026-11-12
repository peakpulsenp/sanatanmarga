import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { SEOHead } from "@/src/components/common/SEOHead";
import { Layers, BookOpen, ChevronRight, RefreshCw, User, Calendar, ArrowRight } from "lucide-react";
import { BlogSeries, BlogPost } from "@/src/types";
import { sanatanBlogService } from "@/src/services/sanatanBlogService";
import { useLanguage } from "@/src/context/LanguageContext";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";

export const BlogSeriesPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const isNe = language === "ne";
  const [series, setSeries] = useState<BlogSeries | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!slug) return;
      try {
        setLoading(true);
        const data = await sanatanBlogService.getPostsBySeries(slug);
        if (isMounted) {
          setSeries(data.series);
          setPosts(data.posts);
        }
      } catch (e) {
        console.error("Failed to load series posts:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [slug]);

  const seriesTitle = series ? ((isNe && series.titleNe) ? series.titleNe : series.title) : slug;
  const seriesDesc = series ? ((isNe && series.descriptionNe) ? series.descriptionNe : series.description) : "";

  return (
    <div className="min-h-screen bg-app-bg text-main-text flex flex-col">
      <SEOHead 
        title={seriesTitle}
        description={seriesDesc || `Read the complete Sanatan Blog series on ${seriesTitle}.`}
      />

      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-xs text-muted-text mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-muted-text/50" />
          <Link to="/blog" className="hover:text-primary transition-colors">Sanatan Blog</Link>
          <ChevronRight className="w-3 h-3 text-muted-text/50" />
          <span className="text-main-text font-medium">{seriesTitle}</span>
        </div>

        {series && (
          <div className="relative rounded-2xl overflow-hidden bg-card-bg border border-border-theme/60 mb-10 shadow-sm">
            {series.featuredImage && (
              <div className="h-64 sm:h-80 w-full overflow-hidden relative">
                <img src={series.featuredImage} alt={seriesTitle} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-wider mb-2">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{series.totalParts} Parts Series</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                    {seriesTitle}
                  </h1>
                </div>
              </div>
            )}

            <div className="p-6 sm:p-8">
              {seriesDesc && (
                <p className="text-sm sm:text-base text-muted-text leading-relaxed mb-6 font-serif">
                  {seriesDesc}
                </p>
              )}

              {series.authorName && (
                <div className="flex items-center gap-2 text-xs text-muted-text pt-4 border-t border-border-theme/40">
                  <User className="w-4 h-4 text-primary" />
                  <span>Curated & authored by <strong>{series.authorName}</strong></span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-main-text mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span>Table of Contents ({posts.length} Essays)</span>
          </h2>

          {loading ? (
            <div className="py-12 text-center text-muted-text flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <span>Loading series parts...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-12 text-center bg-card-bg border border-border-theme/60 rounded-xl p-6">
              <p className="text-sm text-muted-text">No articles found in this series yet.</p>
            </div>
          ) : (
            posts.map((post, idx) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group flex flex-col sm:flex-row gap-4 p-5 rounded-xl bg-card-bg border border-border-theme/60 hover:border-primary/50 hover:shadow-sm transition-all"
              >
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-black text-sm">
                  {idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xxs text-muted-text mb-1">
                    <span>Part {idx + 1} of {series?.totalParts || posts.length}</span>
                    <span>•</span>
                    <span>{post.readingTimeMinutes || 5} min read</span>
                  </div>

                  <h3 className="text-base font-bold text-main-text group-hover:text-primary transition-colors line-clamp-1 mb-1">
                    {(isNe && post.titleNe) ? post.titleNe : post.title}
                  </h3>

                  <p className="text-xs text-muted-text line-clamp-2 leading-relaxed">
                    {(isNe && post.excerptNe) ? post.excerptNe : post.excerpt}
                  </p>
                </div>

                <div className="flex items-center text-xs font-bold text-primary group-hover:translate-x-1 transition-transform self-end sm:self-center">
                  <span>Read</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Link>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogSeriesPage;
