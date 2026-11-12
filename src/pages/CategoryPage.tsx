import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Clock, ChevronRight, Eye, Calendar, Share2, Headphones, Play } from "lucide-react";
import { useMediaOS } from "@/src/context/MediaOSContext";
import { collection, query, where, orderBy, safeOnSnapshot as onSnapshot, limit, startAfter, getDocs } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { shareToChautari } from "@/src/utils/shareUtils";
import Header from "@/src/components/layout/Header";
import SEOHead from "@/src/components/common/SEOHead";
import Footer from "@/src/components/layout/Footer";
import Sidebar from "@/src/components/layout/Sidebar";
import FloatingActions from "@/src/components/layout/FloatingActions";
import TopicsIndex from "@/src/components/news/TopicsIndex";
import CreatePostModal from "@/src/components/community/CreatePostModal";
import { formatDate } from "@/src/lib/utils";
import { getDocsWithCacheFallback, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import type { Article } from "@/src/types";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { normalizeArticleCategory, isArticleInCategory, CANONICAL_CATEGORIES } from "@/src/constants/categories";
import { continuityEngine } from "@/src/lib/continuityEngine";
import { useLanguage } from "@/src/context/LanguageContext";

import { SidebarGridSkeleton } from "@/src/components/ui/PageLoaders";

export default function CategoryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language, getLocalized } = useLanguage();
  const { playQueue } = useMediaOS();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categoryNameNepali, setCategoryNameNepali] = useState<string>("");
  const [categoryNameEnglish, setCategoryNameEnglish] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [showTopics, setShowTopics] = useState(false);
  const [selectedArticleToShare, setSelectedArticleToShare] = useState<Article | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [resolvedCatId, setResolvedCatId] = useState<string>("");
  const [resolvedCatSlug, setResolvedCatSlug] = useState<string>("");

  useEffect(() => {
    if (!slug) return;

    const loadCategoryData = async () => {
      try {
        setLoading(true);

        const decodedSlug = decodeURIComponent(slug).trim();
        const norm = normalizeArticleCategory(decodedSlug);

        // Match against canonical categories
        const canonical = CANONICAL_CATEGORIES.find(c => 
          c.slug.toLowerCase() === decodedSlug.toLowerCase() || 
          c.id.toLowerCase() === decodedSlug.toLowerCase() ||
          c.nameNepali.toLowerCase() === decodedSlug.toLowerCase() ||
          c.nameEnglish.toLowerCase() === decodedSlug.toLowerCase() ||
          c.slug.toLowerCase() === norm.categorySlug.toLowerCase() ||
          c.id.toLowerCase() === norm.categoryId.toLowerCase()
        );

        const targetCategory = {
          id: canonical?.id || norm.categoryId || decodedSlug,
          slug: canonical?.slug || norm.categorySlug || decodedSlug,
          nameNepali: canonical?.nameNepali || norm.categoryName || decodedSlug,
          nameEnglish: canonical?.nameEnglish || (norm.categorySlug.charAt(0).toUpperCase() + norm.categorySlug.slice(1))
        };

        setCategoryNameNepali(targetCategory.nameNepali);
        setCategoryNameEnglish(targetCategory.nameEnglish);
        setResolvedCatId(targetCategory.id);
        setResolvedCatSlug(targetCategory.slug);

        const collectedArticles: Article[] = [];

        // 1. Fetch from Snapshots (Categories, Homepage, and Latest)
        try {
          const [catSnap, hpSnap, latestSnap] = await Promise.all([
            snapshotEngine.getCategoriesSnapshot().catch(() => null),
            snapshotEngine.getHomepageSnapshot().catch(() => null),
            snapshotEngine.getLatestSnapshot().catch(() => null)
          ]);

          // Check direct categoryArticles maps
          const checkMap = (catArticles?: Record<string, Article[]>) => {
            if (!catArticles) return;
            Object.entries(catArticles).forEach(([key, list]) => {
              if (Array.isArray(list)) {
                list.forEach((art: any) => {
                  if (art && isArticleInCategory(art, targetCategory)) {
                    collectedArticles.push(art);
                  }
                });
              }
            });
          };

          checkMap(catSnap?.categoryArticles);
          checkMap(hpSnap?.categoryArticles);

          // Check article pools
          const pools = [
            ...(hpSnap?.latestNews || []),
            ...(hpSnap?.featuredArticles || []),
            ...(hpSnap?.trendingNews || []),
            ...(latestSnap?.articles || [])
          ];

          pools.forEach((art: any) => {
            if (art && isArticleInCategory(art, targetCategory)) {
              collectedArticles.push(art);
            }
          });
        } catch (e) {
          // Non-blocking snapshot read
        }

        // 2. Fetch dynamic in-memory articles
        try {
          const dynamicArticles = snapshotEngine.getDynamicArticles();
          dynamicArticles.forEach((art: any) => {
            if (art && isArticleInCategory(art, targetCategory)) {
              collectedArticles.push(art);
            }
          });
        } catch (e) {}

        // 2b. Fetch from backend category endpoint
        try {
          const apiRes = await fetch(`/api/category/${encodeURIComponent(targetCategory.slug)}`);
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (apiData.success && Array.isArray(apiData.articles)) {
              apiData.articles.forEach((art: any) => {
                if (art && isArticleInCategory(art, targetCategory)) {
                  collectedArticles.push(art);
                }
              });
            }
          }
        } catch (e) {}

        // If we found articles from snapshots, display immediately for instant UI feedback
        if (collectedArticles.length > 0) {
          const initialUnique = Array.from(
            new Map(collectedArticles.filter(a => a && a.id).map(a => [a.id, a])).values()
          ).sort((a, b) => new Date(b.createdAt || (b as any).date || 0).getTime() - new Date(a.createdAt || (a as any).date || 0).getTime());
          
          setArticles(initialUnique);
          setLoading(false);
        }

        // 3. Query Firestore / DB and filter strictly by category
        try {
          const matchKeys = Array.from(new Set([
            targetCategory.id,
            targetCategory.slug,
            targetCategory.nameNepali,
            canonical?.id,
            canonical?.slug,
            norm.categoryId,
            norm.categorySlug
          ].filter(Boolean)));

          const q = query(
            collection(db, "articles"),
            where("categoryId", "in", matchKeys.slice(0, 10)),
            where("status", "==", "published"),
            orderBy("createdAt", "desc"),
            limit(30)
          );

          const snap = await getDocsWithCacheFallback(q);
          const dbArticles = snap.docs
            .map(d => ({ id: d.id, ...d.data() } as Article))
            .filter(a => isArticleInCategory(a, targetCategory));

          if (dbArticles.length > 0) {
            collectedArticles.unshift(...dbArticles);
            setLastDoc(snap.docs[snap.docs.length - 1]);
            setHasMore(dbArticles.length >= 20);
          }
        } catch (qErr) {
          // If compound query fails (e.g. index building), use continuityEngine with strict filter
          try {
            const fallbackArticles = await continuityEngine.getRecentArticles(30, targetCategory.slug);
            const matched = fallbackArticles.filter(a => isArticleInCategory(a, targetCategory));
            if (matched.length > 0) {
              collectedArticles.unshift(...matched);
            }
          } catch (e) {}
        }

        // Deduplicate and finalize articles
        const finalUnique = Array.from(
          new Map(
            collectedArticles
              .filter(a => a && a.id && isArticleInCategory(a, targetCategory))
              .map(a => [a.id, a])
          ).values()
        ).sort((a, b) => {
          const timeA = new Date(a.createdAt || (a as any).date || 0).getTime();
          const timeB = new Date(b.createdAt || (b as any).date || 0).getTime();
          return timeB - timeA;
        });

        setArticles(finalUnique);
      } catch (err) {
        console.warn("Category load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCategoryData();
  }, [slug]);

  const isValidDocSnap = (d: any) => {
    return Boolean(d && typeof d === 'object' && typeof d !== 'function' && typeof d.data === 'function' && d.id);
  };

  const loadMore = async () => {
    if (!lastDoc || !resolvedCatId || !isValidDocSnap(lastDoc)) return;

    try {
      const qConstraints: any[] = [
        where("categoryId", "in", [resolvedCatId, resolvedCatSlug]),
        where("status", "==", "published"),
        orderBy("createdAt", "desc"),
      ];
      if (isValidDocSnap(lastDoc)) {
        qConstraints.push(startAfter(lastDoc));
      }
      qConstraints.push(limit(10));

      const q = query(
        collection(db, "articles"),
        ...qConstraints
      );

      let snapshot;
      try {
        snapshot = await getDocsWithCacheFallback(q);
      } catch (err) {
        const fallbackConstraints: any[] = [
          where("categoryId", "==", resolvedCatId),
          where("status", "==", "published"),
          orderBy("createdAt", "desc"),
        ];
        if (isValidDocSnap(lastDoc)) {
          fallbackConstraints.push(startAfter(lastDoc));
        }
        fallbackConstraints.push(limit(10));

        const fallbackQ = query(
          collection(db, "articles"),
          ...fallbackConstraints
        );
        snapshot = await getDocsWithCacheFallback(fallbackQ);
      }

      const targetCategory = {
        id: resolvedCatId,
        slug: resolvedCatSlug,
        nameNepali: categoryNameNepali,
        nameEnglish: categoryNameEnglish
      };

      const newArticles = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Article))
        .filter(a => isArticleInCategory(a, targetCategory));

      setArticles(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        const filteredNew = newArticles.filter(a => !existingIds.has(a.id));
        return [...prev, ...filteredNew];
      });
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(newArticles.length === 10);
    } catch (err) {
      console.error("Error loading more articles:", err);
    }
  };

  const handleShare = (e: React.MouseEvent, article: Article) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate("/login");
    setSelectedArticleToShare(article);
    setShowShareModal(true);
  };

  const displayCategoryName = language === 'en' 
    ? (categoryNameEnglish || categoryNameNepali || slug || "Category")
    : (categoryNameNepali || categoryNameEnglish || slug || "विधा");

  if (loading) return <SidebarGridSkeleton />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={language === 'en' ? `${displayCategoryName} - Latest News & Analysis` : `${displayCategoryName} - ताजा समाचार र विचार`}
        description={language === 'en' 
          ? `Top news, analysis, reports and opinion stories in ${displayCategoryName} on Sanatan Marga.`
          : `'${displayCategoryName}' विधा अन्तर्गतका प्रमुख नेपाली समाचार, विश्लेषण, विचार तथा विश्लेषण सामग्रीहरू।`}
        url={`/category/${slug}`}
        keywords={[displayCategoryName, "नेपाली समाचार", "Sanatan Marga", "ताजा खबर", "Nepal News"]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": `${displayCategoryName} ${language === 'en' ? 'News' : 'समाचार'}`,
            "url": `https://sanatanmarga.com/category/${slug}`
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": language === 'en' ? "Home" : "गृहपृष्ठ",
                "item": "https://sanatanmarga.com/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": displayCategoryName,
                "item": `https://sanatanmarga.com/category/${slug}`
              }
            ]
          }
        ]}
      />
      <Header />
      
      <main className="flex-grow py-12">
        <div className="container-custom">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xxs font-black text-muted-text uppercase tracking-widest mb-10">
            <Link to="/" className="hover:text-primary transition-colors">{t("home")}</Link>
            <ChevronRight size={12} />
            <span className="text-card-foreground uppercase">{displayCategoryName}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-8">
              <div className="flex flex-col gap-6 mb-16">
                <div className="flex items-center gap-4">
                  <span className="bg-primary text-white text-xxs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-primary/20">
                    {language === 'en' ? "Category Archive" : "विधा आर्काइभ"}
                  </span>
                  <div className="h-px flex-grow bg-border-theme"></div>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                  <div className="space-y-2">
                    <h1 className="text-4xl md:text-7xl font-black text-card-foreground tracking-tight uppercase">
                      {displayCategoryName}
                    </h1>
                    {articles.length > 0 && (
                      <button
                        onClick={() => playQueue(articles, `🎧 ${displayCategoryName} — Category Queue`)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        <Headphones size={16} />
                        <Play size={12} className="fill-current" />
                        <span>{language === 'en' ? 'Listen to This Page' : 'यस पृष्ठका समाचार सुन्नुहोस्'}</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] md:text-xs font-black text-muted-text uppercase tracking-widest pb-1 md:pb-2">
                    <Calendar size={16} className="text-primary" />
                    <span>
                      {language === 'en' 
                        ? `Total ${articles.length} Stories`
                        : `कुल ${articles.length} समाचारहरू`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {articles.length > 0 ? articles.map((article, index) => {
                  const title = getLocalized(article, 'title');
                  const excerpt = getLocalized(article, 'excerpt');
                  return (
                    <Link 
                      key={`${article.id || 'article'}-${index}`} 
                      id={`article-${article.id}`}
                      to={`/article/${article.id}`} 
                      className="group flex flex-col gap-6 bg-card p-5 rounded-3xl border border-border-theme shadow-sm hover:shadow-2xl hover:shadow-black/10 transition-all duration-500"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl shadow-lg border border-border-theme/50">
                        <img 
                          src={article.featuredImage || null} 
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      <div className="flex flex-col gap-4 px-2">
                        <h2 className="text-2xl font-black text-card-foreground group-hover:text-primary transition-colors leading-[1.2] line-clamp-2 tracking-tight">
                          {title}
                        </h2>
                        <p className="text-muted-text text-sm leading-relaxed line-clamp-3 font-medium">
                          {excerpt}
                        </p>
                        <div className="flex items-center justify-between pt-6 border-t border-border-theme">
                          <div className="flex items-center gap-4 text-xxs font-black text-muted-text uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Clock size={14} className="text-primary" /> {formatDate(article.createdAt, language)}</span>
                            <span className="flex items-center gap-1.5"><Eye size={14} className="text-primary" /> {article.views}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => handleShare(e, article)}
                              className="w-8 h-8 rounded-full bg-muted-area/50 flex items-center justify-center hover:bg-primary/10 text-muted-text hover:text-primary transition-all cursor-pointer"
                              title={language === 'en' ? "Share to Chautari" : "चौतारीमा साझा गर्नुहोस्"}
                            >
                              <Share2 size={14} />
                            </button>
                            <div className="w-8 h-8 rounded-full bg-muted-area/50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all text-muted-text">
                              <ChevronRight size={16} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                }) : (
                  <div className="col-span-full py-32 text-center flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-muted-area/30 rounded-full flex items-center justify-center text-muted-text">
                      <Calendar size={40} />
                    </div>
                    <p className="text-muted-text font-black uppercase tracking-widest">
                      {language === 'en' ? "No stories found in this category." : "यस विधामा कुनै समाचार भेटिएन।"}
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination / Load More */}
              {hasMore && articles.length > 0 && (
                <div className="mt-20 flex justify-center">
                  <button 
                    onClick={loadMore}
                    className="bg-card text-card-foreground border border-border-theme px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl flex items-center gap-3 group cursor-pointer"
                  >
                    {language === 'en' ? "Load More Stories" : "थप समाचार लोड गर्नुहोस्"}
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-[160px] transition-all duration-300">
                <Sidebar onShare={(article) => {
                  setSelectedArticleToShare(article);
                  setShowShareModal(true);
                }} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <CreatePostModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        initialData={selectedArticleToShare ? {
          title: language === 'en' ? `Discussion on: ${getLocalized(selectedArticleToShare, 'title')}` : `समाचार बारे अपडेट: ${selectedArticleToShare.title}`,
          content: `${getLocalized(selectedArticleToShare, 'excerpt')}\n\n${language === 'en' ? "What are your thoughts on this? Let's discuss." : "यस बारे तपाईंको के धारणा छ? छलफल गरौं।"}`,
          imageUrl: selectedArticleToShare.featuredImage,
          category: "News",
          linkedArticleId: selectedArticleToShare.id
        } : undefined}
      />

      <FloatingActions 
        articles={articles.map(a => ({ id: a.id, title: getLocalized(a, 'title') || a.title }))} 
        onOpenTopics={() => setShowTopics(true)} 
      />
      <TopicsIndex articles={articles} isOpen={showTopics} onClose={() => setShowTopics(false)} />
    </div>
  );
}
