import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/src/components/common/SEOHead";
import { 
  BookOpen, Sparkles, Flame, Compass, Layers, Building2, 
  Calendar, Activity, Globe, GraduationCap, ArrowRight, 
  Search, Clock, User, Filter, RefreshCw
} from "lucide-react";
import { BlogHomepageSnapshot, BlogPost, BlogCategory } from "@/src/types";
import { sanatanBlogService } from "@/src/services/sanatanBlogService";
import { BlogCard } from "@/src/components/blog/BlogCard";
import { useLanguage } from "@/src/context/LanguageContext";
import AdBanner from "@/src/components/ads/AdBanner";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";

const categoryIconMap: Record<string, any> = {
  Flame, BookOpen, Sparkles, Compass, Layers, Building2, Calendar, Activity, Globe, GraduationCap
};

export const BlogHomePage: React.FC = () => {
  const { language } = useLanguage();
  const isNe = language === "ne";
  const [snapshot, setSnapshot] = useState<BlogHomepageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const data = await sanatanBlogService.getBlogHomepageSnapshot();
        if (isMounted) setSnapshot(data);
      } catch (e) {
        console.error("Failed to load blog homepage snapshot:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const categories = snapshot?.categories || [];
  const latestPosts = snapshot?.latestPosts || [];
  const featuredEssay = snapshot?.featuredEssay;

  const filteredPosts = latestPosts.filter(post => {
    const matchesCategory = selectedCategory === "all" || post.categoryId === selectedCategory || post.categorySlug === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || 
      post.title.toLowerCase().includes(q) || 
      (post.titleNe && post.titleNe.toLowerCase().includes(q)) ||
      post.excerpt.toLowerCase().includes(q) ||
      post.tags.some(t => t.toLowerCase().includes(q));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-app-bg text-main-text flex flex-col">
      <SEOHead 
        title={isNe ? "सनातन धर्म दर्शन र निबन्ध ब्लग" : "Sanatan Blog - Long-Form Dharma, Darshan, Philosophy & Himalayan Heritage"}
        description="Long-form scholarly essays on Sanatan Dharma, Upanishads, Bhagavad Gita, Temple Architecture, Yoga, and Himalayan traditions."
      />

      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Blog Hero Header */}
        <div className="relative mb-10 p-8 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-card-bg border border-primary/20 overflow-hidden shadow-sm">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-4">
              <Flame className="w-3.5 h-3.5" />
              <span>{isNe ? "सनातन धर्म, दर्शन तथा संस्कृति" : "Sanatan Civilizational & Scriptural Essays"}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-main-text leading-tight mb-4">
              {isNe ? "शाश्वत दर्शन, शास्त्र तथा हिमालयीय परम्परा" : "Timeless Wisdom, Scripture & Himalayan Heritage"}
            </h1>
            <p className="text-base sm:text-lg text-muted-text leading-relaxed">
              {isNe 
                ? "वेद, उपनिषद्, भगवद्गीता, तीर्थ सम्पदा तथा वैदिक दर्शनका प्रामाणिक एवं अनुसन्धानमूलक आलेखहरू।" 
                : "Authoritative, long-form scholarly essays on Upanishadic inquiry, Bhagavad Gita ethics, sacred temple geography, and living Himalayan spiritual traditions."
              }
            </p>
          </div>

          {/* Quick Search & Filter Bar */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isNe ? "शास्त्र, विषय वा लेखक खोज्नुहोस्..." : "Search scriptures, philosophy, topics..."}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card-bg border border-border-theme/70 text-sm text-main-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Featured Essay Hero (if present) */}
        {featuredEssay && !searchQuery && selectedCategory === "all" && (
          <div className="mb-12">
            <BlogCard post={featuredEssay} variant="featured" />
          </div>
        )}

        {/* RevenueOS Banner */}
        <div className="mb-10">
          <AdBanner position="blog_header" />
        </div>

        {/* Taxonomy Categories Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-main-text flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" />
                <span>{isNe ? "प्रमुख विषय तथा विधा" : "Sanatan Topics & Taxonomy"}</span>
              </h2>
              <p className="text-xs text-muted-text mt-1">
                {isNe ? "दार्शनिक तथा शास्त्रीय विधाहरू अनुसार अध्ययन गर्नुहोस्" : "Explore essays by classical Vedic disciplines and heritage"}
              </p>
            </div>
            {selectedCategory !== "all" && (
              <button
                onClick={() => setSelectedCategory("all")}
                className="text-xs font-bold text-primary hover:underline"
              >
                {isNe ? "सबै देखाउनुहोस्" : "Show All"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {categories.map((cat) => {
              const IconComp = categoryIconMap[cat.icon || "BookOpen"] || BookOpen;
              const isSelected = selectedCategory === cat.slug || selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? "all" : cat.slug)}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected 
                      ? "bg-primary text-white border-primary shadow-md" 
                      : "bg-card-bg border-border-theme/60 text-main-text hover:border-primary/50 hover:bg-muted-area/40"
                  }`}
                >
                  <div className={`p-2 rounded-lg w-fit mb-3 ${isSelected ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight line-clamp-1">
                      {isNe ? cat.nameNe : cat.name}
                    </div>
                    <div className={`text-xxs mt-1 ${isSelected ? "text-white/80" : "text-muted-text"}`}>
                      {cat.postCount || 10} {isNe ? "लेख" : "essays"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Feed: Filtered Posts Grid */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6 border-b border-border-theme/60 pb-3">
            <h2 className="text-xl font-bold text-main-text flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>{isNe ? "पछिल्ला प्रकाशित आलेखहरू" : "Latest Long-Form Essays"}</span>
              <span className="text-xs font-normal text-muted-text ml-2">({filteredPosts.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="py-16 text-center text-muted-text flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <span>Loading Sanatan Blog snapshots...</span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-12 text-center bg-card-bg border border-border-theme/60 rounded-xl p-8">
              <BookOpen className="w-8 h-8 text-muted-text mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-text font-medium">
                {isNe ? "कुनै लेख भेटिएन।" : "No blog posts found matching your criteria."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <BlogCard key={post.id} post={post} variant="standard" />
              ))}
            </div>
          )}
        </div>

        {/* Featured Series Showcase */}
        {snapshot?.featuredSeries && snapshot.featuredSeries.length > 0 && (
          <div className="mb-14 p-6 sm:p-8 rounded-2xl bg-card-bg border border-border-theme/60">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-main-text flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  <span>{isNe ? "विशेष अध्ययन शृङ्खलाहरू" : "Curated Essay Series"}</span>
                </h3>
                <p className="text-xs text-muted-text mt-1">
                  {isNe ? "विषयगत गम्भीर अध्ययनका लागि श्रृंखलाबद्ध आलेखहरू" : "Multi-part thematic studies for structured scriptural inquiry"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {snapshot.featuredSeries.map((s) => (
                <Link
                  key={s.id}
                  to={`/blog/series/${s.slug}`}
                  className="group relative flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-muted-area/40 border border-border-theme/60 hover:border-primary/50 transition-all"
                >
                  <img src={s.featuredImage || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400"} alt={s.title} className="w-full sm:w-36 h-32 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-xxs font-bold uppercase tracking-wider text-primary">
                        {s.postsCount} {isNe ? "भागको शृङ्खला" : "Parts Series"}
                      </span>
                      <h4 className="text-sm font-bold text-main-text group-hover:text-primary transition-colors line-clamp-2 mt-1">
                        {isNe ? s.titleNe : s.title}
                      </h4>
                      <p className="text-xs text-muted-text line-clamp-2 mt-1">
                        {isNe ? s.descriptionNe : s.description}
                      </p>
                    </div>
                    <div className="text-xs font-semibold text-primary flex items-center gap-1 mt-2">
                      <span>{isNe ? "शृङ्खला अध्ययन गर्नुहोस्" : "Explore Series"}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Saraswati Knowledge & Manuscript Connection Strip */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-card-bg to-primary/5 border border-primary/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Saraswati Global Information System (SGIS)</span>
            </div>
            <h3 className="text-xl font-bold text-main-text">
              {isNe ? "प्राचीन पाण्डुलिपि र ज्ञानमण्डल अन्वेषण गर्नुहोस्" : "Explore Ancient Manuscripts & Primary Grantha Archives"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-text mt-2">
              {isNe 
                ? "नेपालका तालपत्र, भोजपत्र तथा दुर्लभ शिलालेखहरूको डिजिटलाइज्ड अभिलेख सरस्वती नलेज सिस्टममा उपलब्ध छ।"
                : "Connect with thousands of preserved palm-leaf folios, epigraphy, and authentic Sanskrit commentaries."
              }
            </p>
          </div>

          <Link
            to="/sgis"
            className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary/90 transition-all flex items-center gap-2 flex-shrink-0"
          >
            <span>{isNe ? "सरस्वती नलेज खोल्नुहोस्" : "Launch Saraswati Knowledge"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogHomePage;
