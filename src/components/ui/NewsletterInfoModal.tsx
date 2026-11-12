import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Info } from "lucide-react";

export default function NewsletterInfoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[100000] backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100000] bg-card border border-border-theme w-full max-w-lg rounded-[var(--app-radius)] p-8 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black tracking-tight text-primary flex items-center gap-2">
                <Info className="text-primary" /> हाम्रो न्युजलेटर किन महत्त्वपूर्ण छ?
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="text-muted-foreground space-y-4">
              <p>हाम्रो हप्ताको न्युजलेटरले तपाईंलाई यस हप्ताका उत्कृष्ट र महत्त्वपूर्ण समाचारहरू सीधै तपाईंको इनबक्समा उपलब्ध गराउँछ।</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>तपाईंलाई समय बचत हुन्छ; समाचार खोजिरहनु पर्दैन।</li>
                <li>सबैभन्दा लोकप्रिय र चर्चामा रहेका समाचारहरू मात्र पाउनुहुनेछ।</li>
                <li>हाम्रा विशेष रिपोर्टहरू र विश्लेषणहरू विशेष रूपमा तपाईंको लागि।</li>
              </ul>
              <p className="font-semibold text-card-foreground">गहिरो विश्लेषण, सजिलो पहुँच — आजै सदस्यता लिनुहोस्।</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
