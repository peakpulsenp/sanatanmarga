import React from "react";
import { Link } from "react-router-dom";
import { BlogPost, BlogSeries } from "@/src/types";
import { User, BookOpen, Database, Sparkles, Tag, Layers, Share2 } from "lucide-react";
import { useAuth } from "@/src/lib/auth";
import AdBanner from "@/src/components/ads/AdBanner";
import { useLanguage } from "@/src/context/LanguageContext";

interface BlogSidebarProps {
  post: BlogPost;
  series?: BlogSeries | null;
  relatedPosts?: BlogPost[];
}

export const BlogSidebar: React.FC<BlogSidebarProps> = ({ post, series, relatedPosts = [] }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isNe = language === "ne";
  const userRole = (user as any)?.role || "guest";

  return (
    <aside className="w-full space-y-6 lg:sticky lg:top-24">
      {/* 1. Author Card */}
      <div className="bg-card-bg border border-border-theme/60 rounded-[var(--sm-radius,12px)] p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          {post.authorPhoto ? (
            <img src={post.authorPhoto} alt={post.authorDisplayName} className="w-12 h-12 rounded-full object-cover border border-primary/20" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
              {post.authorDisplayName.charAt(0)}
            </div>
          )}
          <div>
            <div className="text-xxs font-bold uppercase tracking-wider text-primary">
              {isNe ? "लेखक / विद्वान्" : "Author & Scholar"}
            </div>
            <Link to={`/blog/author/${post.authorId}`} className="text-sm font-bold text-main-text hover:text-primary transition-colors">
              {post.authorDisplayName}
            </Link>
          </div>
        </div>

        <p className="text-xs text-muted-text leading-relaxed">
          {(isNe && post.authorBioNe) ? post.authorBioNe : (post.authorBio || "Sanatan scholar and researcher dedicated to timeless philosophy and Himalayan heritage.")}
        </p>
      </div>

      {/* 2. Series Module (if applicable) */}
      {series && (
        <div className="bg-primary/5 border border-primary/20 rounded-[var(--sm-radius,12px)] p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
            <Layers className="w-4 h-4" />
            <span>{isNe ? "श्रृङ्खला" : "Article Series"}</span>
          </div>
          <h4 className="text-sm font-bold text-main-text mb-2">
            {(isNe && series.titleNe) ? series.titleNe : series.title}
          </h4>
          <p className="text-xs text-muted-text mb-3">
            {(isNe && series.descriptionNe) ? series.descriptionNe : series.description}
          </p>
          <Link
            to={`/blog/series/${series.slug}`}
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            {isNe ? "सम्पूर्ण श्रृंखला हेर्नुहोस्" : "View Entire Series"} ({series.postsCount} {isNe ? "लेख" : "parts"}) →
          </Link>
        </div>
      )}

      {/* 3. RevenueOS Rotating Ad Slot */}
      <div className="my-4">
        <AdBanner position="blog_sidebar" />
      </div>

      {/* 4. Tags Module */}
      {post.tags && post.tags.length > 0 && (
        <div className="bg-card-bg border border-border-theme/60 rounded-[var(--sm-radius,12px)] p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <Tag className="w-3.5 h-3.5" />
            <span>{isNe ? "प्रमुख विषयहरू" : "Related Topics"}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((t, idx) => (
              <Link
                key={idx}
                to={`/blog/tag/${t}`}
                className="px-2.5 py-1 rounded-md bg-muted-area text-muted-text text-xxs font-medium hover:bg-primary hover:text-white transition-colors"
              >
                #{t}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 5. Related Articles */}
      {relatedPosts.length > 0 && (
        <div className="bg-card-bg border border-border-theme/60 rounded-[var(--sm-radius,12px)] p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isNe ? "सम्बन्धित लेखहरू" : "Related Essays"}</span>
          </div>
          <div className="space-y-3">
            {relatedPosts.slice(0, 3).map((rp, idx) => (
              <Link
                key={idx}
                to={`/blog/${rp.slug}`}
                className="group flex gap-3 items-start pb-3 border-b border-border-theme/30 last:border-0 last:pb-0"
              >
                <img src={rp.featuredImage || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200"} alt={rp.title} className="w-14 h-14 rounded-md object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-main-text group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {(isNe && rp.titleNe) ? rp.titleNe : rp.title}
                  </h5>
                  <div className="text-xxs text-muted-text mt-1">
                    {rp.readingTimeMinutes || 4} min read
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
