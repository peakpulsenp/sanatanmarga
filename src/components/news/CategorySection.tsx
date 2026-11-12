import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";

interface CategorySectionProps {
  title: string;
  slug: string;
  articles: Article[];
  variant?: "grid" | "list" | "featured";
}

export default function CategorySection({ title, slug, articles, variant = "grid" }: CategorySectionProps) {
  if (articles.length === 0) return null;

  return (
    <section className="py-12 border-t border-border-theme">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-card-foreground border-l-4 border-primary pl-4">
          {title}
        </h2>
        <Link 
          to={`/category/${slug}`} 
          className="group/btn relative px-8 py-2.5 bg-primary/5 hover:bg-primary text-primary hover:text-white rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 overflow-hidden"
        >
          <span className="relative z-10 transition-transform group-hover/btn:translate-x-[-4px]">सबै हेर्नुहोस्</span>
          <ArrowRight size={16} className="relative z-10 transition-transform group-hover/btn:translate-x-1" />
          <div className="absolute inset-0 bg-primary translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
        </Link>
      </div>

      {variant === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {articles.map((article, idx) => (
            <Link key={`${article.id || 'sec'}-grid-${idx}`} to={`/article/${article.id}`} className="group flex flex-col gap-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-post-card shadow-md">
                <img 
                  src={article.featuredImage || null} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {article.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5"><Clock size={12} /> {formatDate(article.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {variant === "featured" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6">
            <Link to={`/article/${articles[0].id}`} className="group flex flex-col gap-6">
              <div className="relative aspect-[16/10] overflow-hidden rounded-post-card shadow-xl">
                <img 
                  src={articles[0].featuredImage || null} 
                  alt={articles[0].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-2xl md:text-3xl font-extrabold text-card-foreground group-hover:text-primary transition-colors leading-tight">
                  {articles[0].title}
                </h3>
                <p className="text-muted-foreground leading-relaxed line-clamp-3">
                  {articles[0].excerpt}
                </p>
              </div>
            </Link>
          </div>
          <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.slice(1, 5).map((article, idx) => (
              <Link key={`${article.id || 'sec'}-feat-${idx}`} to={`/article/${article.id}`} className="group flex gap-4">
                <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-[calc(var(--app-post-card-radius)-8px)] shadow-sm">
                  <img 
                    src={article.featuredImage || null} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="text-sm font-bold text-card-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
