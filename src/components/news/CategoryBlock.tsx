import { Link, useNavigate } from "react-router-dom";
import { Clock, Eye, ChevronRight, ArrowRight, Zap, Star, Share2 } from "lucide-react";
import { formatDate, getCategoryColor } from "@/src/lib/utils";
import type { Article, Category } from "@/src/types";
import { motion, AnimatePresence } from "motion/react";
import { shareToChautari } from "@/src/utils/shareUtils";
import { useAuth } from "@/src/lib/auth";
import { toast } from "sonner";
import { useLanguage } from "@/src/context/LanguageContext";

interface CategoryBlockProps {
  category: Category;
  articles: Article[];
  onShare?: (article: Article) => void;
}

const ArticleTags = ({ article }: { article: Article }) => {
  const { language } = useLanguage();
  return (
    <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
      {article.isBreaking && (
        <motion.span 
          animate={{ scale: [1, 1.1, 1], backgroundColor: ["#ef4444", "#dc2626", "#ef4444"] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="bg-red-500 text-white text-xxs font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg"
        >
          <Zap size={10} /> {language === 'en' ? 'Breaking' : 'ताजा समाचार'}
        </motion.span>
      )}
      {article.isFeatured && (
        <motion.span 
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="bg-amber-500 text-white text-xxs font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg"
        >
          <Star size={10} /> {language === 'en' ? 'Special' : 'विशेष'}
        </motion.span>
      )}
    </div>
  );
};

const CategoryHeader = ({ category, catColor }: { category: Category, catColor: string }) => {
  const { t, language } = useLanguage();
  const localizedName = language === "en" 
    ? (category.nameEnglish || category.nameNepali || category.slug || "News")
    : (category.nameNepali || category.nameEnglish || category.slug || "समाचार");
  return (
    <div className="flex items-center justify-between relative">
      <div className="relative group">
        {/* Advanced Light Trail Container */}
        <div 
          className="relative p-[3px] overflow-hidden bg-muted-area/50 shadow-lg"
          style={{ borderRadius: 'var(--app-radius)' }}
        >
          {/* Primary Rotating Trail (Fast) */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-200%] z-0"
            style={{
              background: "conic-gradient(from 0deg, transparent 0%, #0090E0 10%, #ef4444 25%, #0090E0 40%, transparent 60%, transparent 100%)",
              filter: "blur(20px)",
            }}
          />
          
          {/* Secondary Rotating Trail (Slow - Motion Blur Effect) */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-200%] z-0 opacity-40"
            style={{
              background: "conic-gradient(from 0deg, transparent 0%, #b91c1c 15%, #0072B5 35%, transparent 55%, transparent 100%)",
              filter: "blur(30px)",
            }}
          />

          {/* Third Layer (Counter-Rotating for complexity) */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-200%] z-0 opacity-30"
            style={{
              background: "conic-gradient(from 0deg, transparent 0%, #0072B5 20%, #b91c1c 40%, transparent 60%, transparent 100%)",
              filter: "blur(40px)",
            }}
          />
          
          {/* Inner Content (The "Button") */}
          <div 
            className="relative z-10 flex items-center bg-card px-6 py-2.5"
            style={{ borderRadius: 'calc(var(--app-radius) - 3px)' }}
          >
            <motion.div 
              className={`w-1.5 h-6 ${catColor} rounded-full mr-4`}
              animate={{ height: [16, 24, 16] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <h3 className="text-2xl font-black text-card-foreground uppercase tracking-tight">
              {localizedName}
            </h3>
          </div>
        </div>
        
        {/* Extra Glow Effect on Hover */}
        <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
      </div>
      
      <Link to={`/category/${category.slug}`} className={`${catColor.replace('bg-', 'text-')} text-sm font-black uppercase tracking-widest hover:underline flex items-center gap-2 group`}>
        {t("viewAll")} 
        <motion.span
          animate={{ x: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <ChevronRight size={16} />
        </motion.span>
      </Link>
    </div>
  );
};

export default function CategoryBlock({ category, articles, onShare }: CategoryBlockProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language, getLocalized } = useLanguage();
  const style = category.homepageStyle || "grid";
  const count = category.postCount || 4;
  const displayArticles = articles.slice(0, count);
  const catColor = getCategoryColor(category.slug);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const handleShareToChautari = async (e: React.MouseEvent, article: Article) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate("/login");
    
    if (onShare) {
      onShare(article);
    } else {
      try {
        const postId = await shareToChautari(article, user as any);
        if (postId) {
          toast.success(language === 'en' ? "Shared to Chautari!" : "चौतारीमा साझा गरियो!");
          navigate(`/community/post/${postId}`);
        }
      } catch (err) {
        console.error("Error sharing to Chautari:", err);
        toast.error(language === 'en' ? "Failed to share." : "साझा गर्न असमर्थ भयो।");
      }
    }
  };

  if (!articles || articles.length === 0) {
    return null;
  }

  // Pattern 1: Grid (2x2)
  if (style === "grid") {
    return (
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
        className="flex flex-col gap-6 pt-4 border-t border-border-theme"
      >
        <CategoryHeader category={category} catColor={catColor} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8">
          {displayArticles.map((article, idx) => (
            <motion.div key={`${article.id || 'grid'}-${category.id || category.slug || 'cat'}-${idx}`} variants={itemVariants} className="relative group/card">
              <Link to={`/article/${article.id}`} className="group flex flex-col gap-3 sm:gap-4">
                <div className="relative aspect-video overflow-hidden rounded-2xl sm:rounded-cat-hero shadow-xl border border-border-theme/50">
                  <ArticleTags article={article} />
                  <img 
                    src={article.featuredImage || null} 
                    alt={getLocalized(article, 'title')}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                </div>
                <div className="flex flex-col gap-1 sm:gap-2">
                  <h4 className="text-base sm:text-xl font-bold text-card-foreground group-hover:text-primary transition-colors leading-tight line-clamp-2 tracking-tight">
                    {getLocalized(article, 'title')}
                  </h4>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-muted-text uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Clock size={10} /> {formatDate(article.createdAt, language)}</span>
                  </div>
                </div>
              </Link>
              <button 
                onClick={(e) => handleShareToChautari(e, article)}
                className="absolute right-4 bottom-16 sm:bottom-20 p-3 bg-primary/20 backdrop-blur-md text-primary rounded-xl opacity-0 group-hover/card:opacity-100 transition-all hover:bg-primary hover:text-white z-20 shadow-xl cursor-pointer"
                title={language === 'en' ? "Share to Chautari" : "चौतारीमा साझा गर्नुहोस्"}
              >
                <Share2 size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      </motion.section>
    );
  }

  // Pattern 2: Featured Left + List Right
  if (style === "featured_list") {
    const featured = displayArticles[0];
    const rest = displayArticles.slice(1);
    return (
      <section className="flex flex-col gap-8 pt-6 border-t border-border-theme">
        <CategoryHeader category={category} catColor={catColor} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 relative group/card">
            <Link to={`/article/${featured.id}`} className="group flex flex-col gap-6">
              <div className="relative aspect-[16/10] overflow-hidden rounded-cat-hero shadow-2xl border border-border-theme/50">
                <ArticleTags article={featured} />
                <img 
                  src={featured.featuredImage || null} 
                  alt={getLocalized(featured, 'title')}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="text-3xl font-black text-card-foreground group-hover:text-primary transition-colors leading-tight tracking-tight">
                  {getLocalized(featured, 'title')}
                </h4>
                <p className="text-muted-text line-clamp-2 leading-relaxed font-medium">
                  {getLocalized(featured, 'excerpt')}
                </p>
              </div>
            </Link>
            <button 
              onClick={(e) => handleShareToChautari(e, featured)}
              className="absolute right-6 top-6 p-4 bg-primary/20 backdrop-blur-md text-primary rounded-2xl opacity-0 group-hover/card:opacity-100 transition-all hover:bg-primary hover:text-white z-20 shadow-2xl scale-110 cursor-pointer"
              title={language === 'en' ? "Share to Chautari" : "चौतारीमा साझा गर्नुहोस्"}
            >
              <Share2 size={20} />
            </button>
          </div>
          <div className="lg:col-span-5 flex flex-col gap-6">
            {rest.map((article, idx) => (
              <div key={`${article.id || 'fl'}-${category.id || category.slug || 'cat'}-${idx}`} className="relative group/mini-card">
                <Link to={`/article/${article.id}`} className="group flex gap-4 items-center p-4 bg-muted-area/50 rounded-3xl hover:bg-card hover:shadow-xl transition-all border border-transparent hover:border-border-theme pr-12">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-md border border-border-theme">
                    <img src={article.featuredImage || null} alt={getLocalized(article, 'title')} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h4 className="text-sm font-bold text-card-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {getLocalized(article, 'title')}
                    </h4>
                    <div className="flex items-center gap-3 text-xxs font-bold text-muted-text uppercase tracking-widest">
                      <span>{formatDate(article.createdAt, language)}</span>
                    </div>
                  </div>
                </Link>
                <button 
                  onClick={(e) => handleShareToChautari(e, article)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-primary/10 text-primary rounded-full opacity-0 group-hover/mini-card:opacity-100 transition-all hover:bg-primary hover:text-white z-10 cursor-pointer"
                  title={language === 'en' ? "Share to Chautari" : "चौतारीमा साझा गर्नुहोस्"}
                >
                  <Share2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Pattern 3: Horizontal Scroll / Cards
  if (style === "cards") {
    return (
      <section className="flex flex-col gap-8 pt-6 border-t border-border-theme">
        <CategoryHeader category={category} catColor={catColor} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayArticles.map((article, idx) => (
            <div key={`${article.id || 'card'}-${category.id || category.slug || 'cat'}-${idx}`} className="relative group/card">
              <Link to={`/article/${article.id}`} className="group flex flex-col gap-4 bg-card p-4 rounded-post-card shadow-sm border border-border-theme hover:shadow-xl transition-all">
                <div className="relative aspect-square overflow-hidden rounded-[calc(var(--app-post-card-radius)-8px)] shadow-inner">
                  <ArticleTags article={article} />
                  <img 
                    src={article.featuredImage || null} 
                    alt={getLocalized(article, 'title')}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h4 className="text-base font-bold text-card-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2 tracking-tight">
                  {getLocalized(article, 'title')}
                </h4>
              </Link>
              <button 
                onClick={(e) => handleShareToChautari(e, article)}
                className="absolute right-6 top-6 p-2.5 bg-primary/20 backdrop-blur-md text-primary rounded-lg opacity-0 group-hover/card:opacity-100 transition-all hover:bg-primary hover:text-white z-20 shadow-lg cursor-pointer"
                title={language === 'en' ? "Share to Chautari" : "चौतारीमा साझा गर्नुहोस्"}
              >
                <Share2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Pattern 5: Magazine Style
  if (style === "magazine") {
    return (
      <section className="flex flex-col gap-8 pt-6 border-t border-border-theme">
        <CategoryHeader category={category} catColor={catColor} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Link to={`/article/${displayArticles[0].id}`} className="group flex flex-col gap-6">
              <div className="relative aspect-video overflow-hidden rounded-cat-hero shadow-2xl border border-border-theme/50">
                <ArticleTags article={displayArticles[0]} />
                <img src={displayArticles[0].featuredImage || null} alt={getLocalized(displayArticles[0], 'title')} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <h4 className="text-3xl font-black text-card-foreground group-hover:text-primary transition-colors leading-tight tracking-tight">{getLocalized(displayArticles[0], 'title')}</h4>
              <p className="text-muted-text line-clamp-2 font-medium">{getLocalized(displayArticles[0], 'excerpt')}</p>
            </Link>
          </div>
          <div className="flex flex-col gap-8">
            {displayArticles.slice(1, 4).map((article, idx) => (
              <Link key={`${article.id || 'mag'}-${category.id || category.slug || 'cat'}-${idx}`} to={`/article/${article.id}`} className="group flex flex-col gap-3 border-b border-border-theme pb-6 last:border-0">
                <h4 className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors leading-tight line-clamp-2">{getLocalized(article, 'title')}</h4>
                <span className="text-xxs font-bold text-muted-text uppercase tracking-widest">{formatDate(article.createdAt, language)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Pattern 6: Masonry Style (Simulated with columns)
  if (style === "masonry") {
    return (
      <section className="flex flex-col gap-8 pt-6 border-t border-border-theme">
        <CategoryHeader category={category} catColor={catColor} />
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {displayArticles.map((article, idx) => (
            <Link key={`${article.id || 'mas'}-${category.id || category.slug || 'cat'}-${idx}`} to={`/article/${article.id}`} className="group break-inside-avoid flex flex-col gap-4 bg-card p-6 rounded-post-card shadow-sm border border-border-theme hover:shadow-xl transition-all">
              <div className={`relative overflow-hidden rounded-[calc(var(--app-post-card-radius)-8px)] shadow-inner ${idx % 3 === 0 ? 'aspect-square' : 'aspect-video'}`}>
                <ArticleTags article={article} />
                <img src={article.featuredImage || null} alt={getLocalized(article, 'title')} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <h4 className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors leading-tight">{getLocalized(article, 'title')}</h4>
              <p className="text-sm text-muted-text line-clamp-2 font-medium">{getLocalized(article, 'excerpt')}</p>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  // Pattern 7: Overlay Style
  if (style === "overlay") {
    return (
      <section className="flex flex-col gap-8 pt-6 border-t border-border-theme">
        <CategoryHeader category={category} catColor={catColor} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {displayArticles.slice(0, 2).map((article, idx) => (
            <div key={`${article.id || 'ov'}-${category.id || category.slug || 'cat'}-${idx}`} className="group relative aspect-video overflow-hidden rounded-cat-hero shadow-2xl border border-border-theme/50">
              <Link to={`/article/${article.id}`} className="absolute inset-0 z-0">
                <ArticleTags article={article} />
                <img src={article.featuredImage || null} alt={getLocalized(article, 'title')} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              </Link>
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-end p-10 pointer-events-none">
                <Link to={`/article/${article.id}`} className="pointer-events-auto">
                  <h4 className="text-2xl font-black text-white group-hover:text-primary transition-colors leading-tight mb-4 tracking-tight">{getLocalized(article, 'title')}</h4>
                </Link>
                <div className="flex items-center gap-4 text-xxs font-black text-white/70 uppercase tracking-widest pointer-events-auto">
                  <span>{formatDate(article.createdAt, language)}</span>
                  <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                  <Link to={`/profile/${article.authorId}`} className="hover:text-white transition-colors">{article.authorName}</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Pattern 4: Alternating Row
  return (
    <section className="flex flex-col gap-8 pt-6 border-t border-border-theme">
      <CategoryHeader category={category} catColor={catColor} />
      <div className="flex flex-col gap-12">
        {displayArticles.slice(0, 2).map((article, idx) => (
          <div key={`${article.id || 'alt'}-${category.id || category.slug || 'cat'}-${idx}`} className={`group grid grid-cols-1 md:grid-cols-12 gap-8 items-center ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
            <Link to={`/article/${article.id}`} className={`md:col-span-5 relative aspect-video overflow-hidden rounded-cat-hero shadow-xl border border-border-theme ${idx % 2 === 1 ? 'md:order-2' : ''}`}>
              <ArticleTags article={article} />
              <img 
                src={article.featuredImage || null} 
                alt={getLocalized(article, 'title')}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
            </Link>
            <div className="md:col-span-7 flex flex-col gap-4">
              <Link to={`/article/${article.id}`}>
                <h4 className="text-2xl md:text-4xl font-black text-card-foreground group-hover:text-primary transition-colors leading-tight tracking-tight">
                  {getLocalized(article, 'title')}
                </h4>
              </Link>
              <p className="text-muted-text line-clamp-2 leading-relaxed font-medium">
                {getLocalized(article, 'excerpt')}
              </p>
              <div className="flex items-center gap-4 text-xs font-bold text-muted-text uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Clock size={14} /> {formatDate(article.createdAt, language)}</span>
                <Link to={`/profile/${article.authorId}`} className="text-primary hover:underline">{article.authorName}</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
