import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Eye, TrendingUp, ChevronRight, Mail, Facebook, Twitter, Youtube, Instagram, Share2, MessageCircle, Send, Video, Music, ExternalLink } from "lucide-react";
import { collection, query, where, orderBy, limit, serverTimestamp } from "@/src/lib/firebase";
import { db, getDocsWithCacheFallback } from "@/src/lib/firebase";
import { addDocWithQueue } from "@/src/lib/offlineQueue";
import { formatDate } from "@/src/lib/utils";
import type { Article, SocialAccount } from "@/src/types";
import { defaultSocialAccounts } from "@/src/data/defaultSocialData";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import AdBanner from "../ads/AdBanner";
import { Skeleton } from "../ui/Skeleton";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/lib/auth";
import { shareToChautari } from "@/src/utils/shareUtils";
import { FeatureGate } from "@/src/context/FeatureControlContext";

export default function Sidebar({ 
  hideMostRead = false, 
  onShare 
}: { 
  hideMostRead?: boolean, 
  onShare?: (article: Article) => void 
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mostRead, setMostRead] = useState<Article[]>([]);
  const [loadingMostRead, setLoadingMostRead] = useState(true);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>(defaultSocialAccounts);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchMostRead = async () => {
      try {
        setLoadingMostRead(true);
        // Try snapshot first
        const hpSnap = await snapshotEngine.getHomepageSnapshot();
        const snapMostRead = hpSnap.trendingNews || hpSnap.latestNews || [];
        const organicSnap = snapMostRead.filter(a => 
          !(a as any).isAd && 
          !(a as any).isSponsored && 
          !(a as any).position && 
          (!(a as any).linkUrl || (a.content && a.content.length > 20))
        ).slice(0, 5);

        setMostRead(organicSnap);
      } catch (err) {
        console.error("Error fetching most read in sidebar:", err);
        setMostRead([]);
      } finally {
        setLoadingMostRead(false);
      }
    };
    fetchMostRead();

    const fetchSocial = async () => {
      try {
        const accQ = query(collection(db, "socialAccounts"), orderBy("order", "asc"));
        const snap = await getDocsWithCacheFallback(accQ, "sidebar_social_accounts");
        if (!snap.empty) {
          const accs = snap.docs.map(d => ({ id: d.id, ...d.data() } as SocialAccount));
          
          // Merge fetched accounts with default ones to ensure we always have the 8 core platforms
          // with functional links and icons from defaultSocialAccounts even during quota exhaust
          const merged = defaultSocialAccounts.map(defAcc => {
            const fetched = accs.find(a => a.platform?.toLowerCase() === defAcc.platform?.toLowerCase());
            if (fetched) {
              return {
                ...defAcc,
                ...fetched,
                platform: defAcc.platform, // Keep standard platform identifier
                isActive: fetched.isActive !== false
              };
            }
            return defAcc;
          });
          setSocialAccounts(merged);
        } else {
          setSocialAccounts(defaultSocialAccounts);
        }
      } catch (err) {
        console.warn("Using default social accounts in sidebar:", err);
        setSocialAccounts(defaultSocialAccounts);
      }
    };
    fetchSocial();
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case "youtube": return <Youtube size={16} />;
      case "facebook": return <Facebook size={16} />;
      case "instagram": return <Instagram size={16} />;
      case "twitter": return <Twitter size={16} />;
      case "whatsapp": return <MessageCircle size={16} />;
      case "telegram": return <Send size={16} />;
      case "tiktok": return <Video size={16} />;
      case "spotify": return <Music size={16} />;
      default: return <Share2 size={16} />;
    }
  };

  const getPlatformBg = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case "youtube": return "bg-[#FF0000] hover:bg-[#cc0000]";
      case "facebook": return "bg-[#1877F2] hover:bg-[#145dbf]";
      case "instagram": return "bg-[#E4405F] hover:bg-[#b8334c]";
      case "twitter": return "bg-[#1DA1F2] hover:bg-[#1a8cd8]";
      case "whatsapp": return "bg-[#25D366] hover:bg-[#1ebe57]";
      case "telegram": return "bg-[#0088cc] hover:bg-[#006699]";
      case "tiktok": return "bg-slate-900 dark:bg-slate-800 hover:bg-slate-800";
      case "spotify": return "bg-[#1DB954] hover:bg-[#1aa34a]";
      default: return "bg-primary hover:bg-primary/90";
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      await addDocWithQueue("newsletterSubscribers", {
        email,
        joinedAt: serverTimestamp()
      });
      toast.success("धन्यवाद! तपाईं सफलतापूर्वक न्यूजलेटरको सदस्य बन्नुभएको छ।", {
        description: "अब नयाँ अपडेटहरू तपाईंको इमेलमा प्राप्त गर्नुहुनेछ।"
      });
      setEmail("");
    } catch (error) {
      console.error("Error subscribing:", error);
      toast.error("माफ गर्नुहोस्, सदस्यता लिन सकिएन। कृपया फेरि प्रयास गर्नुहोस्।");
    } finally {
      setIsSubmitting(false);
    }
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
          toast.success("चौतारीमा साझा गरियो!");
          navigate(`/community/post/${postId}`);
        }
      } catch (err) {
        console.error("Error sharing to Chautari:", err);
        toast.error("साझा गर्न असमर्थ भयो।");
      }
    }
  };

  const socialMedia = [
    { name: "Facebook", icon: <Facebook size={18} />, color: "bg-[#1877F2]", count: "२.५ लाख", link: "#" },
    { name: "Twitter", icon: <Twitter size={18} />, color: "bg-[#1DA1F2]", count: "१.२ लाख", link: "#" },
    { name: "YouTube", icon: <Youtube size={18} />, color: "bg-[#FF0000]", count: "५.८ लाख", link: "#" },
    { name: "Instagram", icon: <Instagram size={18} />, color: "bg-[#E4405F]", count: "९५ हजार", link: "#" },
  ];

  return (
    <FeatureGate feature="sidebar.global">
      <aside className="flex flex-col gap-12">
        {/* Most Read Section */}
        {!hideMostRead && (
          <FeatureGate feature="sidebar.mostRead">
            <div className="flex flex-col gap-8 bg-card p-8 rounded-[40px] border border-border-theme shadow-sm">
              <div className="flex items-center justify-between border-b-2 border-border-theme pb-4">
                <h3 className="text-xl font-black text-card-foreground border-l-4 border-primary pl-4 uppercase tracking-tight">
                  धेरै पढिएको
                </h3>
                <TrendingUp size={22} className="text-primary" />
              </div>
              <div className="flex flex-col gap-6">
                {mostRead.length > 0 ? (
                  mostRead.map((article, index) => (
                    <div key={`${article.id || 'sb'}-${index}`} className="relative group">
                      <Link to={`/article/${article.id}`} className="flex items-start gap-5">
                        <span className="text-4xl font-black text-muted-area group-hover:text-primary transition-all leading-none w-10 flex-shrink-0 text-center -mt-1 group-hover:scale-110">
                          {index + 1}
                        </span>
                        <div className="flex flex-col gap-2 flex-grow min-w-0 pr-8">
                          <h4 className="text-[15px] font-black text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-2 tracking-tight">
                            {article.title}
                          </h4>
                          <div className="flex items-center gap-4 text-[10px] font-black text-muted-text uppercase tracking-widest">
                            <span className="flex items-center gap-2"><Clock size={12} className="text-primary" /> {formatDate(article.createdAt)}</span>
                            <span className="flex items-center gap-2"><Eye size={12} className="text-primary" /> {article.views}</span>
                          </div>
                        </div>
                      </Link>
                      <button 
                        onClick={(e) => handleShareToChautari(e, article)}
                        className="absolute right-0 top-1 p-3 bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all hover:bg-primary hover:text-white z-10 shadow-lg shadow-primary/20"
                        title="चौतारीमा साझा गर्नुहोस्"
                      >
                        <Share2 size={14} />
                      </button>
                    </div>
                  ))
                ) : loadingMostRead ? (
                  <div className="flex flex-col gap-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-start gap-5">
                        <Skeleton className="w-10 h-10 rounded-2xl flex-shrink-0" />
                        <div className="flex-grow flex flex-col gap-2">
                          <Skeleton className="h-5 w-full rounded-md" />
                          <Skeleton className="h-4 w-3/4 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-text text-xs font-bold">
                    कुनै समाचार उपलब्ध छैन
                  </div>
                )}
              </div>
            </div>
          </FeatureGate>
        )}

        {/* Social Media Widgets */}
        <FeatureGate feature="sidebar.social">
          <div className="flex flex-col gap-6 bg-card p-8 rounded-[40px] border border-border-theme shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-card-foreground border-l-4 border-primary pl-4 uppercase tracking-tight flex items-center gap-3">
                हामीसँग जोडिनुहोस्
              </h3>
              <Link to="/social" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                सबै <ExternalLink size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {socialAccounts
                .filter(acc => acc.isActive !== false)
                .filter((acc, index, self) => 
                  self.findIndex(a => a.platform?.toLowerCase() === acc.platform?.toLowerCase()) === index
                )
                .slice(0, 4)
                .map((account) => (
                  <a 
                    key={account.id} 
                    href={account.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`${getPlatformBg(account.platform)} text-white p-3.5 rounded-3xl flex flex-col items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg shadow-primary/5 dark:shadow-none hover:shadow-primary/15 group text-center`}
                    title={`${account.name} (${account.followerCount})`}
                  >
                    <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/40 transition-colors">
                      {getPlatformIcon(account.platform)}
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] font-black uppercase tracking-wider truncate max-w-[110px]">{account.platform}</span>
                      <span className="text-[9px] font-bold opacity-90 truncate max-w-[110px]">{account.followerCount}</span>
                    </div>
                  </a>
                ))}
            </div>
            <Link 
              to="/social" 
              className="w-full py-3 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest text-center transition-all flex items-center justify-center gap-2"
            >
              <span>आधिकारिक सामाजिक सञ्जाल हब</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </FeatureGate>

        {/* Newsletter */}
        <FeatureGate feature="sidebar.newsletter">
          <div className="bg-primary/5 dark:bg-primary/20 border border-primary/20 rounded-[40px] p-8 flex flex-col gap-6 shadow-sm">
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-2xl text-primary">
                  <Mail size={24} />
                </div>
                न्यूजलेटर
              </h3>
              <p className="text-xs text-muted-text font-black uppercase tracking-widest leading-relaxed opacity-80 pl-1">हरेक बिहान ताजा समाचार आफ्नो इमेलमा प्राप्त गर्नुहोस्।</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-4">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="तपाईंको इमेल..." 
                className="w-full bg-card border border-border-theme px-6 py-4 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold placeholder:text-muted-text/50"
                required
              />
              <button 
                type="submit"
                disabled={isSubmitting}
                className="button-fancy w-full"
              >
                {isSubmitting ? "पठाउँदै..." : "सदस्य बन्नुहोस्"}
              </button>
            </form>
          </div>
        </FeatureGate>

        {/* Advertisement Section */}
        <FeatureGate feature="sidebar.ads">
          <div className="flex flex-col gap-6 rounded-[40px] overflow-hidden">
            <AdBanner position="sidebar" />
          </div>
        </FeatureGate>
      </aside>
    </FeatureGate>
  );
}
