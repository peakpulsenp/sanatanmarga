import { X } from "lucide-react";
import { motion } from "motion/react";

export default function GalleryViewer({ media, onClose }: { media: any[], onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100000] bg-black/90 flex items-center justify-center p-4">
      <button onClick={onClose} className="absolute top-8 right-8 text-white"><X size={40} /></button>
      <div className="max-w-4xl w-full">
         {/* Simplified viewer for now */}
         {media[0]?.url && <img src={media[0].url || null} alt="Gallery view" className="w-full h-auto rounded-3xl" referrerPolicy="no-referrer" />}
      </div>
    </motion.div>
  );
}
