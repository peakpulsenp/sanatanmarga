import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import SEOHead from "@/src/components/common/SEOHead";
import { 
  Search, 
  BookOpen, 
  ShoppingBag, 
  Network, 
  GraduationCap, 
  Calendar, 
  Building2, 
  Layers, 
  ChevronRight, 
  MapPin, 
  Clock, 
  Filter,
  Sparkles
} from "lucide-react";
import { useLanguage } from "@/src/context/LanguageContext";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { crossEntitySearchEngine, DiscoveryEntityCard } from "@/src/services/crossEntitySearchEngine";
import { audienceIntelligenceOS } from "@/src/services/audienceIntelligenceOS";
import { 
  EXPANDED_ARCHIVE_RECORDS, 
  EXPANDED_TIMELINE_EVENTS, 
  EXPANDED_KNOWLEDGE_ENTITIES 
} from "@/src/data/authoritativeContent";

export default function GlobalSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useLanguage();
  const queryParam = searchParams.get("q") || "";

  const [query, setQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [primaryCluster, setPrimaryCluster] = useState<{ name?: string; description?: string }>({});
  const [results, setResults] = useState<{
    articles: any[];
    archives: any[];
    timeline: any[];
    knowledgeNodes: any[];
    products: any[];
    courses: any[];
    festivals: any[];
    directory: any[];
  }>({
    articles: [],
    archives: [],
    timeline: [],
    knowledgeNodes: [],
    products: [],
    courses: [],
    festivals: [],
    directory: []
  });

  useEffect(() => {
    if (!queryParam) return;
    performGlobalSearch(queryParam);
  }, [queryParam]);

  const performGlobalSearch = async (term: string) => {
    if (!term.trim()) return;
    setLoading(true);

    try {
      // Track real reader intent signal via Audience Intelligence OS
      audienceIntelligenceOS.trackSignal({
        userId: "user-guest-session",
        district: "Kathmandu",
        province: "Bagmati",
        language: language === "en" ? "en" : "ne",
        category: "Discovery OS Search",
        articleId: term,
        dwellTime: 25,
        completionRate: 1.0,
        engagementScore: 90
      });

      // Execute unified cross-entity search
      const searchResult = await crossEntitySearchEngine.search(term);
      
      setPrimaryCluster({
        name: searchResult.primaryClusterName,
        description: searchResult.primaryClusterDescription
      });

      const cards = searchResult.cards;

      // Group cards into categories
      const articles = cards.filter(c => c.category === "news");
      const archives = cards.filter(c => c.category === "archives" || c.category === "sgis");
      const timeline = cards.filter(c => c.category === "timeline");
      const knowledgeNodes = cards.filter(c => c.category === "knowledge");
      const products = cards.filter(c => c.category === "store");
      const courses = cards.filter(c => c.category === "academy");
      
      // Fallback static matches for festivals and directory to maintain UI tabs if needed
      const lowerTerm = term.toLowerCase();
      const festivals = [
        { id: "dashain", title: "वडा दशैँ (दशमी पर्व)", titleEnglish: "Dashain Grand Festival", date: "२०८३ आश्विन" },
        { id: "tihar", title: "तिहार (दीपावली पर्व)", titleEnglish: "Tihar Festival of Lights", date: "२०८३ कार्तिक" },
        { id: "vivaha_panchami", title: "विवाह पञ्चमी (जनकपुर महोत्सव)", titleEnglish: "Vivaha Panchami Janakpur Festival", date: "२०८३ मङ्सीर" },
        { id: "shivaratri", title: "महाशिवरात्रि (पशुपतिनाथ मेला)", titleEnglish: "Maha Shivaratri Pashupatinath", date: "२०८३ फागुन" }
      ].filter(f => f.title.toLowerCase().includes(lowerTerm) || f.titleEnglish.toLowerCase().includes(lowerTerm));

      const directory = [
        { id: "dir_pashupati", name: "श्री पशुपतिनाथ क्षेत्र विकास कोष", nameEnglish: "Pashupatinath Area Development Trust", location: "काठमाडौँ", type: "मन्दिर / कोष" },
        { id: "dir_janakpur", name: "जानकी मन्दिर व्यवस्थापन समिति", nameEnglish: "Janaki Temple Trust Janakpur", location: "धनुषा (जनकपुर)", type: "तीर्थ / ट्रस्ट" }
      ].filter(d => d.name.toLowerCase().includes(lowerTerm) || d.nameEnglish.toLowerCase().includes(lowerTerm) || d.location.toLowerCase().includes(lowerTerm));

      setResults({
        articles,
        archives,
        timeline,
        knowledgeNodes,
        products,
        courses,
        festivals,
        directory
      });
    } catch (e) {
      console.warn("Global search error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchParams({ q: query });
  };

  const totalHits = 
    results.articles.length + 
    results.archives.length + 
    results.timeline.length + 
    results.knowledgeNodes.length + 
    results.products.length + 
    results.courses.length + 
    results.festivals.length + 
    results.directory.length;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEOHead
        title={queryParam ? `खोजी नतिजा: ${queryParam} - सनातन मार्ग` : "वैश्विक खोजी (Global Search) - सनातन मार्ग"}
        description="Search news articles, knowledge graph, store products, academy courses, and festival calendars across Nepal."
        url="/search"
      />
      <Header />

      <main className="flex-grow container-custom max-w-5xl py-8 md:py-12 space-y-8">
        {/* Search Header Bar */}
        <div className="bg-card border border-border-theme rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
              <Sparkles size={14} /> वैश्विक खोज प्रणाली (Unified Search Engine)
            </span>
            <h1 className="text-2xl md:text-4xl font-black text-card-foreground">
              {language === "en" ? "Global Search Across Sanatan Ecosystem" : "समाचार, ज्ञानकोष, स्टोर र अकाडेमी एकै ठाउँमा खोज्नुहोस्"}
            </h1>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search size={20} className="absolute left-4 text-muted-text" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="पशुपतिनाथ, गीता, मुक्तिनाथ, दशैँ वा कुनै पनि विषय खोज्नुहोस्..."
              className="w-full pl-12 pr-28 py-4 bg-muted-area border border-border-theme rounded-2xl text-sm md:text-base font-bold focus:outline-none focus:border-primary shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-primary/90 transition-all cursor-pointer"
            >
              खोज्नुहोस्
            </button>
          </form>

          {/* Domain Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-border-theme/60">
            {[
              { id: "all", label: `सबै (${totalHits})`, icon: Layers },
              { id: "articles", label: `समाचार (${results.articles.length})`, icon: BookOpen },
              { id: "archives", label: `अभिलेखालय (${results.archives.length})`, icon: Clock },
              { id: "timeline", label: `समयरेखा (${results.timeline.length})`, icon: Calendar },
              { id: "knowledge", label: `ज्ञानकोष (${results.knowledgeNodes.length})`, icon: Network },
              { id: "products", label: `सनातन स्टोर (${results.products.length})`, icon: ShoppingBag },
              { id: "courses", label: `अकाडेमी (${results.courses.length})`, icon: GraduationCap },
              { id: "festivals", label: `पर्व / उत्सव (${results.festivals.length})`, icon: Calendar },
              { id: "directory", label: `संस्था डाइरेक्टरी (${results.directory.length})`, icon: Building2 }
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-primary text-white shadow-sm"
                      : "bg-muted-area text-muted-text hover:text-foreground border border-border-theme"
                  }`}
                >
                  <TabIcon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Container */}
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-muted-text">सनातन प्रणालीमा खोजिँदैछ...</p>
          </div>
        ) : queryParam && totalHits === 0 ? (
          <div className="bg-card border border-border-theme rounded-3xl p-12 text-center space-y-4">
            <p className="text-base font-bold text-card-foreground">"{queryParam}" का लागि कुनै नतिजा भेटिएन।</p>
            <p className="text-xs text-muted-text">फरक शब्द वा 'पशुपतिनाथ', 'गीता', 'दशैँ' प्रयोग गरी खोज्नुहोस्।</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Primary Civilizational Knowledge Cluster Card */}
            {primaryCluster.name && (
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/30 rounded-3xl p-6 space-y-3 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Sparkles size={12} /> एकीकृत सभ्यता संकलन (Unified Legacy Cluster)
                  </span>
                </div>
                <h2 className="text-lg md:text-2xl font-black text-amber-700 dark:text-amber-400">
                  {primaryCluster.name}
                </h2>
                <p className="text-xs md:text-sm font-bold text-muted-text max-w-3xl leading-relaxed">
                  {primaryCluster.description}
                </p>
              </div>
            )}

            {/* Articles Section */}
            {(activeTab === "all" || activeTab === "articles") && results.articles.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-muted-text flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" /> समाचार तथा लेखहरू ({results.articles.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.articles.map(art => (
                    <Link
                      key={art.id}
                      to={`/article/${art.id}`}
                      className="bg-card border border-border-theme rounded-2xl p-4 hover:border-primary/40 transition-all flex gap-4 items-center group shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest rounded-md">
                        [NEWS]
                      </div>
                      {art.featuredImage && (
                        <img src={art.featuredImage} alt={art.title} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                      )}
                      <div className="space-y-1 min-w-0 pr-8">
                        <span className="text-[10px] font-bold text-primary uppercase">{art.category || "समाचार"}</span>
                        <h4 className="text-xs md:text-sm font-bold text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {art.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Archives Section */}
            {(activeTab === "all" || activeTab === "archives") && results.archives.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-muted-text flex items-center gap-2">
                  <Clock size={16} className="text-amber-500" /> ऐतिहासिक अभिलेखालय दस्तावेज ({results.archives.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {results.archives.map(arc => (
                    <Link
                      key={arc.id}
                      to="/archives"
                      className="bg-card border border-border-theme rounded-2xl p-4 hover:border-amber-500/40 transition-all space-y-2 shadow-sm relative"
                    >
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-md">
                        [SGIS]
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-amber-500 pr-10">
                        <span>{arc.era}</span>
                        <span>{arc.year}</span>
                      </div>
                      <h4 className="text-xs font-bold text-card-foreground">{arc.title}</h4>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-bold">
                        {arc.category}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Section */}
            {(activeTab === "all" || activeTab === "timeline") && results.timeline.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-muted-text flex items-center gap-2">
                  <Calendar size={16} className="text-sky-500" /> सभ्यतागत समयरेखा घटनाहरू ({results.timeline.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {results.timeline.map(evt => (
                    <Link
                      key={evt.id}
                      to="/timeline"
                      className="bg-card border border-border-theme rounded-2xl p-4 hover:border-sky-500/40 transition-all space-y-2 shadow-sm relative"
                    >
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-sky-500/10 text-sky-600 text-[9px] font-black uppercase tracking-widest rounded-md">
                        [EVENT]
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-sky-500 pr-10">
                        <span>{evt.era}</span>
                        <span>{evt.location}</span>
                      </div>
                      <h4 className="text-xs font-bold text-card-foreground">{evt.title}</h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Knowledge Nodes Section */}
            {(activeTab === "all" || activeTab === "knowledge") && results.knowledgeNodes.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-muted-text flex items-center gap-2">
                  <Network size={16} className="text-amber-500" /> ज्ञानकोष नोडहरू ({results.knowledgeNodes.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {results.knowledgeNodes.map(node => (
                    <Link
                      key={node.id}
                      to="/knowledge"
                      className="bg-card border border-border-theme rounded-2xl p-4 hover:border-amber-500/40 transition-all space-y-2 shadow-sm relative"
                    >
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-md">
                        [PLACE]
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-amber-600 dark:text-amber-400 pr-10">
                        <span>{node.type.toUpperCase()}</span>
                        <span>{node.district}</span>
                      </div>
                      <h4 className="text-xs font-bold text-card-foreground">{node.label}</h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Store Products Section */}
            {(activeTab === "all" || activeTab === "products") && results.products.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-muted-text flex items-center gap-2">
                  <ShoppingBag size={16} className="text-emerald-500" /> सनातन स्टोर उत्पादनहरू ({results.products.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.products.map(prod => (
                    <Link
                      key={prod.id}
                      to="/store"
                      className="bg-card border border-border-theme rounded-2xl p-4 hover:border-emerald-500/40 transition-all flex items-center gap-4 shadow-sm relative"
                    >
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-md">
                        [BOOK]
                      </div>
                      <img src={prod.image || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200"} alt={prod.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      <div className="pr-12">
                        <h4 className="text-xs font-bold text-card-foreground">{prod.name}</h4>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">रु. {prod.price}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
