import { motion } from "motion/react";
import { useState } from "react";
import NewsletterInfoModal from "./NewsletterInfoModal";

interface InlineBannerProps {
  imageSrc: string;
  title: string;
  description: string;
  link: string;
}

export default function InlineBanner({ imageSrc, title, description, link }: InlineBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full overflow-hidden rounded-2xl bg-white shadow-md border border-slate-100 my-8"
    >
      <div className="flex items-center gap-6 p-4">
        {imageSrc?.trim() && (
          <div className="w-1/3 h-24 overflow-hidden rounded-lg">
            <img 
              src={imageSrc || null} 
              alt={title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600 mt-1">{description}</p>
          <div className="flex gap-2 mt-3">
            <a href={link || "#"} target="_blank" rel="noopener noreferrer" className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              थप जानकारी
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
