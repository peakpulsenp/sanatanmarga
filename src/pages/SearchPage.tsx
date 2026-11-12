import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Header from "@/src/components/layout/Header";
import SEOHead from "@/src/components/common/SEOHead";
import Footer from "@/src/components/layout/Footer";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";
import { Search as SearchIcon, Clock, ChevronRight, Share2 } from "lucide-react";
import CreatePostModal from "@/src/components/community/CreatePostModal";
import { useAuth } from "@/src/lib/auth";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/src/context/LanguageContext";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { continuityEngine } from "@/src/lib/continuityEngine";

export default function SearchPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language, getLocalized } = useLanguage();
  const [searchParams] = useSearchParams();
  const queryText = searchParams.get("q") || "";
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticleToShare, setSelectedArticleToShare] = useState<any | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShare = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate("/login");
    setSelectedArticleToShare(item);
    setShowShareModal(true);
  };

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const items = await continuityEngine.getSearchIndex();
        
        const qLower = queryText.toLowerCase();
        const filtered = items.filter(item => 
          (item.title && item.title.toLowerCase().includes(qLower)) ||
          (item.title_en && item.title_en.toLowerCase().includes(qLower)) ||
          (item.excerpt && item.excerpt.toLowerCase().includes(qLower)) ||
          (item.excerpt_en && item.excerpt_en.toLowerCase().includes(qLower)) ||
          (item.content && item.content.toLowerCase().includes(qLower)) ||
          (item.categoryId && item.categoryId.toLowerCase().includes(qLower))
        );
        
        setResults(filtered);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (queryText) {
      fetchResults();
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [queryText]);

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      <SEOHead
        title={queryText 
          ? (language === 'en' ? `Search Results: ${queryText}` : `खोज परिणाम: ${queryText}`) 
          : (language === 'en' ? "Search Stories" : "समाचार खोज्नुहोस्")}
        description={language === 'en' ? `Search results for '${queryText}' on Sanatan Marga.` : `'${queryText}' को लागि सनातन मार्ग समाचार खोज परिणामहरू।`}
        url={`/search?q=${encodeURIComponent(queryText)}`}
        noindex={true}
      />
      <Header />
      
      <main className="flex-grow py-12">
        <div className="container-custom max-w-5xl">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-black text-card-foreground tracking-tight flex items-center gap-3">
                <SearchIcon className="text-primary" size={32} />
                {language === 'en' ? `Search Results: "${queryText}"` : `खोज नतिजा: "${queryText}"`}
              </h1>
              <p className="text-sm font-bold text-muted-text uppercase tracking-widest">
                {language === 'en' ? `Found ${results.length} results` : `कुल ${results.length} नतिजाहरू फेला परे`}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card p-6 rounded-[2rem] shadow-sm border border-border-theme flex flex-col md:flex-row gap-6 items-center">
                    <Skeleton className="w-full md:w-48 aspect-video md:aspect-square flex-shrink-0 rounded-2xl bg-muted-area" />
                    <div className="flex flex-col gap-3 flex-grow w-full">
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-20 h-6 rounded-full bg-muted-area" />
                        <Skeleton className="w-32 h-4 bg-muted-area" />
                      </div>
                      <Skeleton className="w-full h-8 bg-muted-area" />
                      <Skeleton className="w-3/4 h-8 bg-muted-area" />
                      <Skeleton className="w-full h-4 mt-2 bg-muted-area" />
                      <Skeleton className="w-5/6 h-4 bg-muted-area" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {results.map((item) => {
                  const title = getLocalized(item, 'title');
                  const excerpt = getLocalized(item, 'excerpt');

                  const isSponsored = Boolean(item.isSponsored || item.promotionType);
                  const badge = (() => {
                    if (isSponsored) {
                      const sponsor = item.sponsorName || "Sponsored Partner";
                      return {
                        label: language === 'en' ? `⭐ Sponsored • ${sponsor}` : `⭐ प्रायोजित • ${sponsor}`,
                        style: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40 font-black"
                      };
                    }

                    switch (item.type) {
                      case "saraswati":
                        return {
                          label: language === 'en' ? `📚 Knowledge Graph (${item.categoryId})` : `📚 ज्ञान सञ्जाल | Saraswati (${item.categoryId})`,
                          style: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                        };
                      case "nepalhub":
                        return {
                          label: language === 'en' ? `🗺 Nepal Hub (${item.categoryId})` : `🗺 नेपाल हब | Nepal Hub (${item.categoryId})`,
                          style: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                        };
                      case "community":
                        return {
                          label: language === 'en' ? `👥 Chautari Community (${item.categoryId})` : `👥 चौतारी | Community (${item.categoryId})`,
                          style: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                        };
                      default:
                        return {
                          label: language === 'en' ? `📰 News (${item.categoryId})` : `📰 समाचार | News (${item.categoryId})`,
                          style: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                        };
                    }
                  })();

                  return (
                    <Link 
                      key={item.id} 
                      to={item.url || `/article/${item.id}`}
                      className="group bg-card p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all border border-border-theme flex flex-col md:flex-row gap-6 items-center"
                    >
                      <div className="w-full md:w-48 aspect-video md:aspect-square flex-shrink-0 overflow-hidden rounded-2xl bg-muted-area/30">
                        <img 
                          src={item.featuredImage || null} 
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex flex-col gap-3 flex-grow min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border ${badge.style}`}>
                            {badge.label}
                          </span>
                          <span className="text-xxs font-bold text-muted-text uppercase tracking-widest flex items-center gap-1">
                            <Clock size={12} /> {formatDate(item.createdAt, language)}
                          </span>
                        </div>
                        <div className="flex justify-between items-start gap-4">
                          <h2 className="text-xl md:text-2xl font-black text-card-foreground group-hover:text-primary transition-colors leading-tight truncate-2-lines">
                            {title}
                          </h2>
                          <button 
                            onClick={(e) => handleShare(e, item)}
                            className="p-2.5 bg-muted-area/50 text-muted-text hover:bg-primary/10 hover:text-primary rounded-xl transition-all shrink-0 cursor-pointer"
                            title={language === 'en' ? "Share to Chautari" : "चौतारीमा साझा गर्नुहोस्"}
                          >
                            <Share2 size={18} />
                          </button>
                        </div>
                        <p className="text-muted-text text-sm line-clamp-2 leading-relaxed">
                          {excerpt}
                        </p>
                      </div>
                      <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-muted-area text-muted-text group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                        <ChevronRight size={24} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-muted-area rounded-full flex items-center justify-center text-muted-text">
                  <SearchIcon size={40} />
                </div>
                <p className="text-muted-text font-bold uppercase tracking-widest">
                  {language === 'en' ? "No results found" : "कुनै नतिजा फेला परेन"}
                </p>
                <Link to="/" className="text-primary font-black uppercase tracking-widest hover:underline">
                  {language === 'en' ? "Return to Homepage" : "गृहपृष्ठमा फर्कनुहोस्"}
                </Link>
              </div>
            )}
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
    </div>
  );
}
