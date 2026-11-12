import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Clock, Eye, MapPin, ChevronRight } from "lucide-react";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import Sidebar from "@/src/components/layout/Sidebar";
import SEOHead from "@/src/components/common/SEOHead";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";
import { motion } from "motion/react";
import { useLanguage } from "@/src/context/LanguageContext";
import { continuityEngine } from "@/src/lib/continuityEngine";

import { SidebarGridSkeleton } from "@/src/components/ui/PageLoaders";

export default function DistrictPage() {
  const { districtName } = useParams();
  const { t, language, getLocalized } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!districtName) return;

    const fetchDistrict = async () => {
      try {
        const loaded = await continuityEngine.getRecentArticles(30, districtName);
        setArticles(loaded || []);
      } catch (err) {
        console.warn("Error fetching district articles:", err);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDistrict();
  }, [districtName]);

  if (loading) return <SidebarGridSkeleton />;

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      <SEOHead
        title={language === 'en' ? `${districtName} District - News & Updates` : `${districtName} जिल्ला - ताजा समाचार र अपडेट`}
        description={language === 'en' ? `Latest news, cultural updates, local events and reports from ${districtName} district, Nepal.` : `${districtName} जिल्लाका ताजा समाचार, स्थानीय गतिविधि, घटनाक्रम तथा सांस्कृतिक रिपोर्टिङ।`}
        url={`/district/${districtName}`}
      />
      <Header />
      
      <main className="flex-grow py-12">
        <div className="container-custom">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xxs font-black text-muted-text uppercase tracking-widest mb-12">
            <Link to="/" className="hover:text-primary transition-colors">{t("home")}</Link>
            <ChevronRight size={12} className="text-muted-text/30" />
            <Link to="/nepal-hub" className="hover:text-primary transition-colors">{t("nepalHub")}</Link>
            <ChevronRight size={12} className="text-muted-text/30" />
            <span className="text-card-foreground">
              {language === 'en' ? `${districtName} District` : `${districtName} जिल्ला`}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-8">
              <div className="flex flex-col gap-12">
                <div className="flex flex-col gap-4">
                  <h1 className="text-3xl md:text-5xl font-black text-card-foreground flex items-center gap-3 md:gap-4">
                    <MapPin size={32} className="text-primary md:w-10 md:h-10" /> {districtName}
                  </h1>
                  <div className="h-1 w-24 md:w-32 bg-primary rounded-full"></div>
                  <p className="text-muted-text font-bold uppercase tracking-widest text-[10px] md:text-xs">
                    {language === 'en' ? `Latest updates and reports from ${districtName} district` : `${districtName} जिल्लाका ताजा समाचारहरू`}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-12">
                  {articles.length > 0 ? (
                    articles.map((article, index) => {
                      const title = getLocalized(article, 'title');
                      const excerpt = getLocalized(article, 'excerpt');
                      return (
                        <motion.div 
                          key={`${article.id || 'district'}-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          className="group grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
                        >
                          <div className="md:col-span-5 relative aspect-[16/10] overflow-hidden rounded-[2rem] shadow-xl">
                            <Link to={`/article/${article.id}`}>
                              <img 
                                src={article.featuredImage || null} 
                                alt={title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                referrerPolicy="no-referrer"
                              />
                            </Link>
                          </div>
                          <div className="md:col-span-7 flex flex-col gap-4">
                            <Link to={`/article/${article.id}`}>
                              <h2 className="text-2xl font-black text-card-foreground group-hover:text-primary transition-colors leading-tight">
                                {title}
                              </h2>
                            </Link>
                            <p className="text-muted-text text-sm line-clamp-3 leading-relaxed">
                              {excerpt}
                            </p>
                            <div className="flex items-center gap-6 text-xxs font-black text-muted-text uppercase tracking-widest">
                              <span className="flex items-center gap-2"><Clock size={14} className="text-primary" /> {formatDate(article.createdAt, language)}</span>
                              <span className="flex items-center gap-2">
                                <Eye size={14} className="text-primary" /> 
                                {language === 'en' ? `${article.views} views` : `${article.views} पटक हेरिएको`}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="py-20 text-center bg-muted-area rounded-[3rem] border-2 border-dashed border-border-theme">
                      <p className="text-muted-text font-black uppercase tracking-widest">
                        {language === 'en' ? "No stories found in this district." : "यस जिल्लामा कुनै समाचार भेटिएन।"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-[160px]">
                <Sidebar />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
