import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  Copy, 
  Check, 
  ChevronRight, 
  Flame, 
  BookOpen, 
  Send, 
  MapPin, 
  ShieldCheck, 
  Compass, 
  Bell, 
  ArrowRight,
  TrendingUp,
  Headphones
} from "lucide-react";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import SEOHead from "@/src/components/common/SEOHead";
import { useLanguage } from "@/src/context/LanguageContext";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { StoryEvolutionEngine } from "@/src/services/storyEvolutionEngine";
import { KnowledgeGraphEngine } from "@/src/services/knowledgeGraphService";
import type { Article } from "@/src/types";
import NepaliDate from "nepali-datetime";
import { toast } from "sonner";
import { ArticleAudioReader } from "@/src/components/news/ArticleAudioReader";

export default function DailyDigestPage() {
  const { language } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");

  // Computed Date info
  const nepaliDate = new NepaliDate();
  const nepDateStr = nepaliDate.format("YYYY MMMM DD, dddd");
  const gregDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const developingStorylines = StoryEvolutionEngine.getStorylines().filter(s => s.status === 'developing').slice(0, 3);
  const randomNode = KnowledgeGraphEngine.getNodes()[0] || null;

  useEffect(() => {
    async function loadDigestContent() {
      setLoading(true);
      try {
        const hp = await snapshotEngine.getHomepageSnapshot();
        const combined = [...(hp.breakingNews || []), ...(hp.trendingNews || []), ...(hp.latestNews || [])];
        const unique = Array.from(new Map(combined.map(a => [a.id, a])).values());
        setArticles(unique.slice(0, 5));
      } catch (err) {
        console.error("Error loading digest:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDigestContent();
  }, []);

  const fullDigestScript = `
    सनातन मार्ग दैनिक प्रभात इन्टेलिजन्स बुलेटिन। 
    आज मिति ${nepDateStr}। 
    प्रमुख समाचारहरू: 
    ${articles.map((a, i) => `${a.title}`).join("। ")}। 
    विकासशील शृङ्खलाहरू: 
    ${developingStorylines.map(s => `${s.titleNepali}: हालको स्थिति ${s.status}`).join("। ")}। 
    ज्ञानकोष सन्दर्भ: ${randomNode ? `${randomNode.nameNepali}: ${randomNode.description}` : ""}। 
    थप विवरणका लागि सनातन मार्ग पोर्टल हेर्नुहोस्।
  `.replace(/\s+/g, " ").trim();

  const handleCopyDigest = () => {
    const text = `📰 *सनातन मार्ग दैनिक ब्रिफिङ (${nepDateStr})*\n\n` +
      `🔥 *प्रमुख समाचारहरू:*\n` +
      articles.map((a, i) => `${i + 1}. ${a.title} (https://sanatanmarga.com/article/${a.id})`).join("\n") +
      `\n\n📌 *विकासशील शृङ्खलाहरू:*\n` +
      developingStorylines.map(s => `• ${s.titleNepali} [${s.milestones?.length || 0} घटनाक्रम]`).join("\n") +
      `\n\n📖 *ज्ञानकोष सन्दर्भ:*\n${randomNode?.nameNepali}: ${randomNode?.description}\n\n` +
      `🔗 पूर्ण समाचार: https://sanatanmarga.com/digest`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("दैनिक ब्रिफिङ क्लिपबोर्डमा कपी भयो!");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    toast.success("दैनिक विहानी बुलेटिन सफलतापूर्वक सक्रिय भयो!");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEOHead
        title={language === "en" ? "Daily Intelligence Digest - Sanatan Marga" : "दैनिक प्रभात इन्टेलिजन्स ब्रिफिङ - सनातन मार्ग"}
        description="Daily curated Nepal news intelligence, developing storylines, Vedic Panchanga, and Knowledge Graph highlights."
        url="/digest"
      />
      <Header />

      <main className="flex-grow container-custom max-w-4xl py-8 md:py-12 space-y-8">
        {/* Header Hero */}
        <div className="border border-border-theme bg-card/60 backdrop-blur-xl rounded-3xl p-6 md:p-10 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} /> {language === "en" ? "Morning Intelligence Brief" : "दैनिक प्रभात बुलेटिन"}
                </span>
                <span className="text-[11px] font-bold text-muted-text">
                  Edition 2083-D
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-card-foreground tracking-tight">
                {language === "en" ? "Nepal Intelligence Daily Digest" : "नेपाल दैनिक इन्टेलिजन्स प्रभात बुलेटिन"}
              </h1>
              <p className="text-xs md:text-sm text-muted-text font-medium">
                {language === "en" 
                  ? `${gregDateStr} • Bikram Sambat ${nepDateStr}` 
                  : `वि.सं. ${nepDateStr} (${gregDateStr})`}
              </p>
            </div>

            {/* Top action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyDigest}
                className="px-3.5 py-2 rounded-xl bg-muted-area hover:bg-muted-area/80 text-xs font-bold flex items-center gap-1.5 border border-border-theme transition-all"
                title="Copy Text for WhatsApp/Telegram"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copied ? (language === "en" ? "Copied" : "कपी भयो") : (language === "en" ? "Copy Brief" : "कपी गर्नुहोस्")}</span>
              </button>
            </div>
          </div>

          {/* High Fidelity Human Nepali Audio Player */}
          <div className="pt-2">
            <ArticleAudioReader
              title={language === "en" ? "Daily Nepal Intelligence Morning Briefing" : "नेपाल दैनिक इन्टेलिजन्स प्रभात बुलेटिन"}
              content={fullDigestScript}
              language={language as any}
            />
          </div>
        </div>

        {/* Section 1: Developing Storylines */}
        {developingStorylines.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-red-500" />
                <h2 className="text-lg md:text-xl font-black text-card-foreground">
                  {language === "en" ? "Active Storyline Arcs" : "सक्रिय विकासशील शृङ्खलाहरू (Developing Storylines)"}
                </h2>
              </div>
              <Link to="/storylines" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                {language === "en" ? "View all" : "सबै हेर्नुहोस्"} <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {developingStorylines.map(story => (
                <Link
                  key={story.id}
                  to="/storylines"
                  className="p-5 rounded-2xl bg-card border border-border-theme hover:border-primary/40 transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-500/10 text-red-500">
                      {story.status}
                    </span>
                    <span className="text-[10px] font-bold text-muted-text">
                      {story.milestones?.length || 0} घटनाक्रम
                    </span>
                  </div>
                  <h3 className="text-xs md:text-sm font-bold text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {language === "en" ? (story.titleEnglish || story.titleNepali) : story.titleNepali}
                  </h3>
                  <p className="text-[11px] text-muted-text line-clamp-2">
                    {language === "en" ? (story.summaryEnglish || story.summaryNepali) : story.summaryNepali}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Top Curated News Highlights */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            <h2 className="text-lg md:text-xl font-black text-card-foreground">
              {language === "en" ? "Today's Core Intelligence Briefs" : "आजका मुख्य समाचार सार (Key Briefs)"}
            </h2>
          </div>

          <div className="space-y-3">
            {articles.map((art, idx) => (
              <Link
                key={art.id}
                to={`/article/${art.id}`}
                className="p-4 md:p-5 rounded-2xl bg-card border border-border-theme hover:border-primary/40 transition-all flex items-start gap-4 group"
              >
                <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                      {art.categoryId}
                    </span>
                    {art.districts && art.districts[0] && (
                      <span className="text-[10px] font-bold text-muted-text flex items-center gap-0.5">
                        <MapPin size={10} /> {art.districts[0]}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-card-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {art.title}
                  </h3>
                  <p className="text-xs text-muted-text line-clamp-2">
                    {art.excerpt}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-text group-hover:text-primary shrink-0 self-center transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Section 3: Knowledge Node of the Day */}
        {randomNode && (
          <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-3xl p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm md:text-base font-black text-card-foreground">
                  {language === "en" ? "Knowledge Node of the Day" : "आजको ज्ञानकोष सन्दर्भ (Node of the Day)"}
                </h3>
              </div>
              <Link to={`/knowledge?entity=${randomNode.id}`} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                {language === "en" ? "Explore" : "विस्तृत हेर्नुहोस्"} <ChevronRight size={14} />
              </Link>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase">
                  {randomNode.type}
                </span>
                {randomNode.district && (
                  <span className="text-xs font-bold text-muted-text">
                    📍 {randomNode.district}
                  </span>
                )}
              </div>
              <h4 className="text-base md:text-lg font-black text-card-foreground">
                {randomNode.nameNepali} {randomNode.nameEnglish ? `(${randomNode.nameEnglish})` : ""}
              </h4>
              <p className="text-xs md:text-sm text-muted-text leading-relaxed">
                {randomNode.description}
              </p>
            </div>
          </div>
        )}

        {/* Section 4: Daily Email / Telegram Newsletter Subscription */}
        <div className="border border-border-theme bg-card rounded-3xl p-6 md:p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Bell size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base md:text-lg font-black text-card-foreground">
              {language === "en" ? "Subscribe to Daily Morning Intelligence" : "हरेक बिहान ६ बजे दैनिक ब्रिफिङ पाउनुहोस्"}
            </h3>
            <p className="text-xs text-muted-text max-w-md mx-auto">
              {language === "en" 
                ? "Get verified morning briefing sent directly to your inbox or mobile app." 
                : "नेपालका ताजा तथ्यपरक विश्लेषण र प्रमुख विकासक्रम इमेल वा नोटिफिकेसनमा।" }
            </p>
          </div>

          {subscribed ? (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs font-bold text-emerald-600 dark:text-emerald-400">
              ✓ तपाईंको इमेल सुरक्षित भयो। धन्यवाद!
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-2.5 bg-muted-area border border-border-theme rounded-xl text-xs focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-all cursor-pointer"
              >
                {language === "en" ? "Subscribe" : "सब्स्क्राइब"}
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
