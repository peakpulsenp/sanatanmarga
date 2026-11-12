import { Link } from "react-router-dom";
import { Clock, Share2 } from "lucide-react";
import { cn, formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";
import { motion } from "motion/react";

interface TopNewsGridProps {
  mainArticle: Article;
  sideArticles: Article[];
}

export default function TopNewsGrid({ mainArticle, sideArticles }: TopNewsGridProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section className="py-8">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        {/* Main Featured Article */}
        <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col gap-4 group">
          <Link to={`/article/${mainArticle.id}`} className="relative overflow-hidden rounded-[32px] aspect-[16/9] shadow-2xl shadow-primary/5 border border-border-theme/50">
            <img 
              src={mainArticle.featuredImage || null} 
              alt={mainArticle.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6 md:p-12">
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full w-fit mb-4 uppercase tracking-[0.2em] shadow-lg shadow-primary/30"
              >
                मुख्य समाचार
              </motion.span>
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-5 group-hover:text-primary transition-colors tracking-tight">
                {mainArticle.title}
              </h2>
              <div className="flex items-center gap-6 text-white/70 text-xs font-bold uppercase tracking-widest">
                <span className="flex items-center gap-2"><Clock size={16} className="text-primary" /> {formatDate(mainArticle.createdAt)}</span>
                <span className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors"><Share2 size={16} className="text-primary" /> सेयर</span>
              </div>
            </div>
          </Link>
          <p className="text-muted-text text-lg leading-relaxed line-clamp-2 px-2 font-medium opacity-80">
            {mainArticle.excerpt}
          </p>
        </motion.div>

        {/* Side List Articles */}
        <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-border-theme pb-4 mb-2">
            <h3 className="text-xl font-black text-card-foreground border-l-4 border-primary pl-4 uppercase tracking-tight">
              ताजा अपडेट
            </h3>
            <Link to="/category/breaking" className="text-xs font-black text-primary hover:underline uppercase tracking-widest">सबै हेर्नुहोस्</Link>
          </div>
          
          <div className="flex flex-col gap-5">
            {sideArticles.map((article, index) => (
              <motion.div
                key={`${article.id || 'side'}-${index}`}
                variants={itemVariants}
                custom={index}
              >
                <Link 
                  to={`/article/${article.id}`}
                  className="flex gap-5 group items-center p-2 rounded-2xl hover:bg-muted-area/30 transition-all border border-transparent hover:border-border-theme/50"
                >
                  <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-2xl shadow-md border border-border-theme/20">
                    <img 
                      src={article.featuredImage || null} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-col justify-center flex-grow">
                    <h4 className="text-base font-bold text-card-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2 tracking-tight">
                      {article.title}
                    </h4>
                    <span className="text-[10px] text-muted-text font-black uppercase tracking-widest flex items-center gap-2">
                      <Clock size={12} className="text-primary" /> {formatDate(article.createdAt)}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
