import React from "react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, Sparkles, Radio, MapPin, Eye, Clock, Bookmark, Share2 } from "lucide-react";

// 1. Card Component
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-card border border-border-theme rounded-2xl p-5 shadow-sm hover:shadow-md transition-all",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// 2. ArticleCard Component
export interface ArticleCardProps {
  title: string;
  excerpt?: string;
  category?: string;
  image?: string;
  publishedAt?: string;
  readTime?: string;
  views?: number;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "compact" | "horizontal" | "hero";
}

export function ArticleCard({
  title,
  excerpt,
  category,
  image,
  publishedAt,
  readTime,
  views,
  onClick,
  className,
  variant = "default"
}: ArticleCardProps) {
  if (variant === "compact") {
    return (
      <div 
        onClick={onClick}
        className={cn("group flex items-start gap-3 p-3 rounded-xl hover:bg-muted-area cursor-pointer transition-colors", className)}
      >
        {image && (
          <img 
            src={image} 
            alt={title} 
            className="w-16 h-16 object-cover rounded-lg shrink-0 group-hover:scale-105 transition-transform" 
            referrerPolicy="no-referrer"
          />
        )}
        <div className="space-y-1 flex-1 min-w-0">
          {category && <span className="text-[10px] font-black uppercase text-primary tracking-wider">{category}</span>}
          <h4 className="text-xs font-bold text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h4>
          <div className="flex items-center gap-2 text-[10px] text-muted-text">
            {publishedAt && <span>{publishedAt}</span>}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "horizontal") {
    return (
      <div 
        onClick={onClick}
        className={cn("group flex flex-col sm:flex-row gap-4 p-4 bg-card border border-border-theme rounded-2xl hover:border-primary/50 cursor-pointer transition-all", className)}
      >
        {image && (
          <img 
            src={image} 
            alt={title} 
            className="w-full sm:w-40 h-32 object-cover rounded-xl shrink-0 group-hover:scale-[1.02] transition-transform" 
            referrerPolicy="no-referrer"
          />
        )}
        <div className="space-y-2 flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            {category && <span className="text-[10px] font-black uppercase text-primary">{category}</span>}
            <h3 className="text-sm sm:text-base font-black text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </h3>
            {excerpt && <p className="text-xs text-muted-text line-clamp-2 leading-relaxed">{excerpt}</p>}
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-text pt-2 border-t border-border-theme/60">
            <span className="flex items-center gap-1"><Clock size={12} /> {publishedAt || "Recently"}</span>
            {views !== undefined && <span className="flex items-center gap-1"><Eye size={12} /> {views} reads</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={cn("group bg-card border border-border-theme rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/50 cursor-pointer transition-all flex flex-col justify-between", className)}
    >
      <div>
        {image && (
          <div className="aspect-video w-full overflow-hidden bg-muted-area relative">
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              referrerPolicy="no-referrer"
            />
            {category && (
              <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-md text-white text-[10px] font-black uppercase rounded-lg">
                {category}
              </span>
            )}
          </div>
        )}
        <div className="p-5 space-y-2.5">
          {!image && category && <span className="text-[10px] font-black uppercase text-primary">{category}</span>}
          <h3 className="text-base font-black text-card-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {title}
          </h3>
          {excerpt && <p className="text-xs text-muted-text line-clamp-2 leading-relaxed">{excerpt}</p>}
        </div>
      </div>
      <div className="px-5 pb-5 pt-0 flex items-center justify-between text-[11px] text-muted-text border-t border-border-theme/40 pt-3">
        <span className="flex items-center gap-1"><Clock size={12} /> {publishedAt || "Today"}</span>
        {views !== undefined && <span className="flex items-center gap-1"><Eye size={12} /> {views}</span>}
      </div>
    </div>
  );
}

// 3. StoryCard Component (For Reels/Visuals)
export function StoryCard({ title, image, views, author, onClick }: { title: string; image: string; views?: string; author?: string; onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-md bg-slate-900"
    >
      <img src={image || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=600"} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-4 text-white">
        <div className="flex justify-between items-center">
          <span className="px-2 py-0.5 bg-primary text-white text-[9px] font-black uppercase rounded-full">Story</span>
          {views && <span className="text-[10px] font-bold bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">{views}</span>}
        </div>
        <div className="space-y-1">
          {author && <p className="text-[10px] text-amber-300 font-bold">{author}</p>}
          <h4 className="text-xs sm:text-sm font-bold line-clamp-2 group-hover:underline">{title}</h4>
        </div>
      </div>
    </div>
  );
}

// 4. LiveCard Component
export function LiveCard({ title, time, category, location, urgent, onClick }: { title: string; time: string; category: string; location?: string; urgent?: boolean; onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-4 rounded-2xl border transition-all cursor-pointer bg-card hover:shadow-md",
        urgent ? "border-red-500/50 bg-red-500/5" : "border-border-theme hover:border-primary/50"
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase flex items-center gap-1", urgent ? "bg-red-500 text-white animate-pulse" : "bg-primary/10 text-primary")}>
            <Radio size={10} /> {category}
          </span>
          {location && <span className="text-[10px] font-bold text-muted-text flex items-center gap-1"><MapPin size={10} /> {location}</span>}
        </div>
        <span className="text-[10px] font-mono text-muted-text font-bold">{time}</span>
      </div>
      <h4 className="text-sm font-black text-card-foreground group-hover:text-primary leading-snug">
        {title}
      </h4>
    </div>
  );
}

// 5. DistrictCard Component
export function DistrictCard({ name, nepaliName, count, active, onClick }: { name: string; nepaliName: string; count?: number; active?: boolean; onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-4 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1",
        active ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105" : "bg-card border-border-theme hover:border-primary/50 hover:bg-muted-area text-card-foreground"
      )}
    >
      <MapPin size={16} className={active ? "text-white" : "text-primary"} />
      <h4 className="text-xs font-black">{nepaliName || name}</h4>
      <span className={cn("text-[10px] font-mono", active ? "text-white/80" : "text-muted-text")}>{name} {count !== undefined && `• ${count}`}</span>
    </div>
  );
}

// 6. Tag Component
export function Tag({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <span 
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5",
        active ? "bg-primary text-white shadow-sm" : "bg-muted-area text-muted-text hover:text-card-foreground hover:bg-muted"
      )}
    >
      {label}
    </span>
  );
}

// 7. Badge Component
export function Badge({ children, variant = "default", className }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger" | "outline"; className?: string }) {
  const styles = {
    default: "bg-primary/10 text-primary border-primary/20",
    success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    danger: "bg-red-500/10 text-red-600 border-red-500/20",
    outline: "border-border-theme text-card-foreground"
  };
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1", styles[variant], className)}>
      {children}
    </span>
  );
}

// 8. SectionHeader Component
export function SectionHeader({ title, subtitle, actionText, onAction }: { title: string; subtitle?: string; actionText?: string; onAction?: () => void }) {
  return (
    <div className="flex items-end justify-between mb-6 pb-3 border-b border-border-theme">
      <div>
        <h2 className="text-lg sm:text-xl font-black text-card-foreground tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-text mt-0.5">{subtitle}</p>}
      </div>
      {actionText && (
        <button onClick={onAction} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
          <span>{actionText}</span>
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

// 9. EmptyState Component
export function EmptyState({ title, description, actionText, onAction }: { title: string; description: string; actionText?: string; onAction?: () => void }) {
  return (
    <div className="bg-card border border-border-theme rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto my-8">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
        <Sparkles size={24} />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-black text-card-foreground">{title}</h3>
        <p className="text-xs text-muted-text leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <button onClick={onAction} className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary/95 transition-all">
          {actionText}
        </button>
      )}
    </div>
  );
}

// 10. SmartButton Component
export function SmartButton({ children, onClick, variant = "primary", size = "md", className, disabled }: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "outline" | "danger"; size?: "sm" | "md" | "lg"; className?: string; disabled?: boolean }) {
  const variants = {
    primary: "bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary/95",
    secondary: "bg-muted-area text-card-foreground hover:bg-muted",
    outline: "border border-border-theme text-card-foreground hover:bg-muted-area",
    danger: "bg-red-500 text-white shadow-md hover:bg-red-600"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-xl",
    md: "px-4 py-2 text-xs sm:text-sm rounded-2xl",
    lg: "px-6 py-3 text-sm rounded-2xl font-black"
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={cn("font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50", variants[variant], sizes[size], className)}
    >
      {children}
    </button>
  );
}

// 11. Modal Component
export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border-theme rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border-theme">
          <h3 className="text-base font-black text-card-foreground">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-xl bg-muted-area text-muted-text hover:text-card-foreground">
            <X size={18} />
          </button>
        </div>
        <div>{children}</div>
      </motion.div>
    </div>
  );
}

// 12. Drawer Component
export function Drawer({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-card border-l border-border-theme h-full w-full max-w-md shadow-2xl flex flex-col"
      >
        <div className="p-5 border-b border-border-theme flex items-center justify-between">
          <h3 className="text-base font-black text-card-foreground">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-muted-area text-muted-text hover:text-card-foreground">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </motion.div>
    </div>
  );
}
