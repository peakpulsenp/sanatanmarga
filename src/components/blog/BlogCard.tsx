import React from "react";
import { Link } from "react-router-dom";
import { Clock, BookOpen, Sparkles, User, Tag, ArrowRight } from "lucide-react";
import { BlogPost } from "@/src/types";
import { useLanguage } from "@/src/context/LanguageContext";

interface BlogCardProps {
  post: BlogPost;
  variant?: "featured" | "standard" | "compact" | "horizontal";
}

export const BlogCard: React.FC<BlogCardProps> = ({ post, variant = "standard" }) => {
  const { language } = useLanguage();
  const isNe = language === "ne";
  const title = (isNe && post.titleNe) ? post.titleNe : post.title;
  const excerpt = (isNe && post.excerptNe) ? post.excerptNe : post.excerpt;
  const categoryName = (isNe && post.categoryNameNe) ? post.categoryNameNe : post.categoryName;

  if (variant === "featured") {
    return (
      <div className="group relative bg-card-bg border border-border-theme/60 rounded-[var(--sm-radius,12px)] overflow-hidden shadow-sm hover:shadow-md transition-all">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          <div className="lg:col-span-7 relative h-72 lg:h-full min-h-[320px] overflow-hidden bg-muted-area">
            <img
              src={post.featuredImage || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200"}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:hidden" />
            <div className="absolute top-4 left-4 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary text-white shadow-lg">
                <Sparkles className="w-3.5 h-3.5" />
                {isNe ? "मुख्य निबन्ध" : "Featured Essay"}
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between bg-card-bg">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Link
                  to={`/blog/category/${post.categorySlug}`}
                  className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
                >
                  {categoryName}
                </Link>
                <span className="text-muted-text/50">•</span>
                <span className="text-xs text-muted-text flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {post.readingTimeMinutes || 5} {isNe ? "मिनेट" : "min read"}
                </span>
              </div>

              <Link to={`/blog/${post.slug}`}>
                <h2 className="text-xl lg:text-2xl font-bold text-main-text group-hover:text-primary transition-colors leading-snug mb-3">
                  {title}
                </h2>
              </Link>

              <p className="text-sm text-muted-text line-clamp-3 mb-4 leading-relaxed">
                {excerpt}
              </p>

              {post.scriptureReferences && post.scriptureReferences.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium mb-4">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{post.scriptureReferences[0].text}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border-theme/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {post.authorPhoto ? (
                  <img src={post.authorPhoto} alt={post.authorDisplayName} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {post.authorDisplayName.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold text-main-text">{post.authorDisplayName}</div>
                  <div className="text-xxs text-muted-text">{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <Link
                to={`/blog/${post.slug}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:gap-2 transition-all"
              >
                {isNe ? "पढ्नुहोस्" : "Read Essay"}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        to={`/blog/${post.slug}`}
        className="group flex gap-4 items-start p-3 rounded-[var(--sm-radius,12px)] hover:bg-muted-area/50 transition-colors border border-transparent hover:border-border-theme/50"
      >
        <img
          src={post.featuredImage || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400"}
          alt={title}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <div className="text-xxs font-bold text-primary uppercase tracking-wider mb-1">
            {categoryName}
          </div>
          <h3 className="text-sm font-bold text-main-text group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-xxs text-muted-text">
            <span>{post.authorDisplayName}</span>
            <span>•</span>
            <span>{post.readingTimeMinutes || 4} min</span>
          </div>
        </div>
      </Link>
    );
  }

  // Standard Card
  return (
    <div className="group flex flex-col bg-card-bg border border-border-theme/60 rounded-[var(--sm-radius,12px)] overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className="relative h-48 overflow-hidden bg-muted-area">
        <img
          src={post.featuredImage || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800"}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <Link
            to={`/blog/category/${post.categorySlug}`}
            className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white text-xxs font-bold uppercase tracking-wider hover:bg-primary transition-colors"
          >
            {categoryName}
          </Link>
        </div>
        {post.scriptureReferences && post.scriptureReferences.length > 0 && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-0.5 rounded bg-primary/90 text-white text-xxs font-medium flex items-center gap-1 shadow">
              <BookOpen className="w-3 h-3" />
              {post.scriptureReferences[0].text}
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xxs text-muted-text mb-2">
            <Clock className="w-3 h-3" />
            <span>{post.readingTimeMinutes || 5} {isNe ? "मिनेट पढाइ" : "min read"}</span>
            <span>•</span>
            <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
          </div>

          <Link to={`/blog/${post.slug}`}>
            <h3 className="text-base font-bold text-main-text group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2">
              {title}
            </h3>
          </Link>

          <p className="text-xs text-muted-text line-clamp-3 leading-relaxed mb-4">
            {excerpt}
          </p>
        </div>

        <div className="pt-3 border-t border-border-theme/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {post.authorPhoto ? (
              <img src={post.authorPhoto} alt={post.authorDisplayName} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xxs">
                {post.authorDisplayName.charAt(0)}
              </div>
            )}
            <span className="text-xs text-main-text font-medium truncate max-w-[120px]">
              {post.authorDisplayName}
            </span>
          </div>

          <Link
            to={`/blog/${post.slug}`}
            className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
          >
            {isNe ? "विस्तार" : "Read"}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
