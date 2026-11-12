import React, { useState } from 'react';
import { 
  Share2, MessageCircle, Twitter, Facebook, Send, Copy, 
  Check, X, Users, Globe, ExternalLink 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface ShareDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url?: string;
  excerpt?: string;
  category?: string;
  onOpenChautari?: () => void;
  language?: 'en' | 'ne';
}

export default function ShareDrawerModal({
  isOpen,
  onClose,
  title,
  url,
  excerpt = "",
  category = "",
  onOpenChautari,
  language = 'ne'
}: ShareDrawerModalProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedExcerpt = encodeURIComponent(excerpt.slice(0, 140));

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success(language === 'en' ? "Link copied to clipboard!" : "लिङ्क प्रतिलिपि गरियो!");
        setTimeout(() => setCopied(false), 2500);
      } else {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        toast.success(language === 'en' ? "Link copied to clipboard!" : "लिङ्क प्रतिलिपि गरियो!");
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      toast.error(language === 'en' ? "Could not copy link" : "लिङ्क प्रतिलिपि गर्न सकिएन");
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: excerpt ? `${title} — ${excerpt.slice(0, 100)}` : title,
          url: shareUrl,
        });
        onClose();
      } catch (err: any) {
        // AbortError is normal when user cancels dialog
        if (err.name !== 'AbortError') {
          console.warn("Native share failed", err);
        }
      }
    }
  };

  const networks = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-[#25D366] text-white hover:bg-[#20ba59]",
      url: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-[#1877F2] text-white hover:bg-[#1567d3]",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    },
    {
      name: "X (Twitter)",
      icon: Twitter,
      color: "bg-black text-white hover:bg-zinc-800",
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
    },
    {
      name: "Telegram",
      icon: Send,
      color: "bg-[#229ED9] text-white hover:bg-[#1d8cc2]",
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal / Drawer Surface */}
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg bg-card border border-border-theme rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border-theme">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Share2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-card-foreground">
                    {language === 'en' ? "Share this Story" : "समाचार साझा गर्नुहोस्"}
                  </h3>
                  <p className="text-xxs text-muted-text">
                    {language === 'en' ? "Spread factual civilizational journalism" : "सत्य र तथ्यमा आधारित पत्रकारितालाई साझा गर्नुहोस्"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted-area hover:bg-muted-area/80 text-muted-text hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Headline Snippet Preview */}
            <div className="p-3 bg-muted-area/50 rounded-2xl border border-border-theme/60 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary px-2 py-0.5 rounded bg-primary/10 inline-block">
                {category || "News"}
              </span>
              <h4 className="text-xs font-bold text-card-foreground line-clamp-2 leading-snug">
                {title}
              </h4>
            </div>

            {/* Social Network Share Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {networks.map((net) => (
                <a
                  key={net.name}
                  href={net.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 text-center font-black text-xs ${net.color}`}
                >
                  <net.icon size={20} />
                  <span>{net.name}</span>
                </a>
              ))}
            </div>

            {/* Secondary Options: Native Share & Chautari Discussion */}
            <div className="space-y-2.5">
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="w-full p-3 rounded-2xl bg-muted-area hover:bg-muted-area/80 text-card-foreground font-bold text-xs flex items-center justify-center gap-2 border border-border-theme transition-all cursor-pointer"
                >
                  <Globe size={16} className="text-primary" />
                  <span>{language === 'en' ? "More Options (System Share)" : "थप विकल्पहरू (मोबाइल सेयर)"}</span>
                </button>
              )}

              {onOpenChautari && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenChautari();
                  }}
                  className="w-full p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-2 border border-amber-500/20 transition-all cursor-pointer"
                >
                  <Users size={16} className="text-amber-600" />
                  <span>{language === 'en' ? "Start Discussion on Chautari (चौतारी)" : "चौतारीमा खुला छलफल सुरु गर्नुहोस्"}</span>
                </button>
              )}
            </div>

            {/* Copy Link Input Bar */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-text ml-1">
                {language === 'en' ? "Copy Article URL" : "लेखको लिङ्क प्रतिलिपि गर्नुहोस्"}
              </label>
              <div className="flex items-center gap-2 bg-muted-area p-1.5 rounded-2xl border border-border-theme">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent px-3 py-1.5 text-xs text-muted-text outline-none truncate font-mono"
                />
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    copied 
                      ? "bg-emerald-600 text-white" 
                      : "bg-primary text-white hover:bg-primary/90"
                  }`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? (language === 'en' ? "Copied!" : "प्रतिलिपि भयो!") : (language === 'en' ? "Copy" : "प्रतिलिपि")}</span>
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
