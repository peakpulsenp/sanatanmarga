import { useState } from "react";
import { Play, Clock, Eye, X, Share2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";
import { useAuth } from "@/src/lib/auth";
import { shareToChautari } from "@/src/utils/shareUtils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "@/src/context/LanguageContext";

import VideoEmbed from "@/src/components/common/VideoEmbed";

interface MultimediaZoneProps {
  articles: Article[];
  onShare?: (article: Article) => void;
}

export default function MultimediaZone({ articles, onShare }: MultimediaZoneProps) {
  const { t, language, getLocalized } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

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

  return (
    <section 
      id="multimedia-zone-section"
      className="bg-slate-900 py-16 my-12 overflow-hidden relative"
      style={{ borderRadius: '48px' }}
    >
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary rounded-full blur-[150px]"
        ></motion.div>
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent rounded-full blur-[150px]"
        ></motion.div>
      </div>

      <div className="container-custom relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 md:mb-20 px-4 md:px-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-12 bg-primary rounded-full"></div>
              <span className="text-primary text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em]">
                {language === 'en' ? "Videos & Multimedia" : "भिडियो र मल्टिमिडिया"}
              </span>
            </div>
            <h2 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-none">
              {language === 'en' ? "News in Motion" : "दृश्यमा समाचार"}
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Link 
              to="/category/video" 
              className="group/btn relative px-10 py-5 bg-white/5 hover:bg-white text-white hover:text-slate-900 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center gap-4 overflow-hidden border border-white/20 hover:border-white shadow-xl"
            >
              <span className="relative z-10">{language === 'en' ? "All Videos" : "सबै भिडियोहरू"}</span>
              <Play size={20} className="relative z-10 transition-transform group-hover/btn:translate-x-1 fill-current" />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {articles.map((article, index) => {
            const localizedTitle = getLocalized(article, "title") || article.title;
            return (
              <motion.div 
                key={`${article.id || 'video'}-zone-${index}`}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group flex flex-col gap-6"
              >
                <div 
                  className="relative aspect-video overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] bg-black group-hover:shadow-primary/20 transition-all duration-700"
                  style={{ borderRadius: '32px' }}
                >
                  <AnimatePresence mode="wait">
                    {playingVideo === article.id ? (
                      <motion.div 
                        key="player"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full relative"
                      >
                        <VideoEmbed 
                          url={article.videoUrl || ""} 
                          title={localizedTitle}
                          onClose={() => setPlayingVideo(null)}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="thumbnail"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full relative"
                      >
                        <img 
                          src={article.featuredImage || null} 
                          alt={localizedTitle}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-70 group-hover:opacity-100"
                          referrerPolicy="no-referrer"
                        />
                        <button 
                          onClick={() => setPlayingVideo(article.id)}
                          className="absolute inset-0 flex items-center justify-center group/play cursor-pointer"
                        >
                          <div className="w-20 h-20 bg-white/10 backdrop-blur-xl text-white rounded-full flex items-center justify-center shadow-2xl group-hover/play:scale-110 transition-all duration-500 border border-white/20">
                            <div className="w-14 h-14 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-xl group-hover/play:bg-primary group-hover/play:text-white transition-colors">
                              <Play size={28} fill="currentColor" />
                            </div>
                          </div>
                        </button>
                        <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
                          <span className="bg-primary/90 text-white text-[10px] font-black px-4 py-1.5 rounded-full w-fit uppercase tracking-[0.2em] shadow-xl backdrop-blur-md">
                            {language === 'en' ? "Video" : "भिडियो"}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex flex-col gap-3 px-2 relative">
                  <Link to={`/article/${article.id}`} className="pr-12 group-hover:translate-x-1 transition-transform">
                    <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors leading-[1.3] line-clamp-2 tracking-tight">
                      {localizedTitle}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
                    <span className="flex items-center gap-2.5 transition-colors group-hover:text-white/70"><Clock size={16} className="text-primary" /> {formatDate(article.createdAt, language)}</span>
                    <span className="flex items-center gap-2.5 transition-colors group-hover:text-white/70"><Eye size={16} className="text-primary" /> {article.views}</span>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    onClick={(e) => handleShareToChautari(e, article)}
                    className="absolute right-0 top-1 p-3 bg-white/5 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-primary z-10 border border-white/10 cursor-pointer"
                    title={language === 'en' ? "Share to Chautari" : "चौतारीमा साझा गर्नुहोस्"}
                  >
                    <Share2 size={18} />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
