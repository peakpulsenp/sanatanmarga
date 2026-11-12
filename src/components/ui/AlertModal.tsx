import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function AlertModal({
  isOpen,
  title,
  message,
  type,
  onClose
}: AlertModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-card border border-border-theme rounded-[var(--app-radius)] p-10 max-w-md w-full shadow-2xl flex flex-col gap-6 text-center items-center"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-card-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              type === 'success' ? 'bg-green-100/10 text-green-500' : 'bg-red-100/10 text-red-500'
            }`}>
              {type === 'success' ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-black text-card-foreground uppercase tracking-tight">{title}</h3>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">{message}</p>
            </div>

            <button
              onClick={onClose}
              className={`w-full px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-transform hover:scale-105 ${
                type === 'success' ? 'bg-green-600 shadow-lg shadow-green-200' : 'bg-red-600 shadow-lg shadow-red-200'
              }`}
            >
              ठीक छ
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
