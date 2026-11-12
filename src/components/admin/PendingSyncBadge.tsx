import { useState, useEffect, useRef } from 'react';
import { Database, RefreshCw, Upload, Download, Server, X, CheckCircle } from 'lucide-react';
import { offlineQueue } from '@/src/lib/offlineQueue';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function PendingSyncBadge() {
  const [count, setCount] = useState(offlineQueue.getPendingCount());
  const [isSyncing, setIsSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setCount(e.detail?.count ?? offlineQueue.getPendingCount());
    };

    window.addEventListener('offline-queue-changed' as any, handleUpdate);
    
    const interval = setInterval(() => {
      setCount(offlineQueue.getPendingCount());
    }, 4000);

    return () => {
      window.removeEventListener('offline-queue-changed' as any, handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await offlineQueue.sync();
    setCount(offlineQueue.getPendingCount());
    setIsSyncing(false);
  };

  const handleDirectServerSync = async () => {
    setIsSyncing(true);
    const result = await offlineQueue.syncViaServer();
    if (result.success) {
      toast.success(`${result.count} वटा सामग्री प्रत्यक्ष सर्भरमार्फत सिङ्क भयो!`);
      setShowModal(false);
    } else if (result.error === "AUTH_VERIFIER_UNAVAILABLE") {
      toast.error("सिङ्क सेवा अस्थायी रूपमा उपलब्ध छैन। कृपया केही समयपछि पुनः प्रयास गर्नुहोस्।");
    } else if (result.error === "AUTH_REQUIRED") {
      toast.error("प्रमाणीकरण आवश्यक छ। कृपया पुनः लगइन गर्नुहोस्।");
    } else if (result.error === "PERMISSION_DENIED") {
      toast.error("अनुमति अस्वीकृत। यस कार्यको लागि आवश्यक भूमिका छैन।");
    } else {
      toast.error("सर्भर सिङ्कमा त्रुटि आयो। पुनः प्रयास गर्नुहोस्।");
    }
    setCount(offlineQueue.getPendingCount());
    setIsSyncing(false);
  };

  const handleExportJSON = () => {
    offlineQueue.exportQueueAsJSON();
    toast.success("पेन्डिङ पोस्टहरू डाउनलोड भयो");
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = offlineQueue.importQueueFromJSON(content);
        if (result.success) {
          toast.success(`${result.importedCount} वटा पेन्डिङ सामग्री अर्को डिभाइसबाट थपियो`);
          setCount(offlineQueue.getPendingCount());
          // Auto sync via server
          handleDirectServerSync();
        } else {
          toast.error("फाइल ढाँचा मिलेन। JSON फाइल छान्नुहोस्।");
        }
      }
    };
    reader.readAsText(file);
  };

  if (count === 0 && !showModal) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="flex items-center gap-2 bg-amber-500 text-white px-3 py-1.5 rounded-full shadow-lg border border-amber-400 group cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          <Database size={14} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">{count} पेन्डिङ सिङ्क</span>
          <button 
            onClick={(e) => { e.stopPropagation(); handleManualSync(); }}
            disabled={isSyncing}
            className={`p-1 hover:bg-white/20 rounded-full transition-all ${isSyncing ? 'animate-spin' : ''}`}
            title="सिङ्क गर्नुहोस्"
          >
            <RefreshCw size={12} />
          </button>
        </motion.div>
      </AnimatePresence>

      {/* Cross-Device Sync Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border-theme p-6 rounded-3xl max-w-md w-full shadow-2xl flex flex-col gap-6 text-card-foreground"
            >
              <div className="flex items-center justify-between border-b border-border-theme pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Database size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">अफलाइन र क्रस-डिभाइस सिङ्क केन्द्र</h3>
                    <p className="text-xs text-muted-text">{count} वटा पेन्डिङ कार्यहरू सिङ्क हुन बाँकी</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted-area rounded-full text-muted-text">
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDirectServerSync}
                  disabled={isSyncing || count === 0}
                  className="w-full bg-primary text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-lg disabled:opacity-50"
                >
                  <Server size={18} />
                  {isSyncing ? "सिङ्क हुँदैछ..." : "प्रत्यक्ष सर्भरमार्फत सिङ्क गर्नुहोस् (Bypass Client Limit)"}
                </button>

                <button
                  onClick={handleExportJSON}
                  disabled={count === 0}
                  className="w-full bg-muted-area text-foreground border border-border-theme p-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-border-theme transition-all disabled:opacity-50"
                >
                  <Download size={18} className="text-primary" />
                  पेन्डिङ पोस्टहरू डाउनलोड गर्नुहोस् (.json)
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-muted-area text-foreground border border-border-theme p-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-border-theme transition-all"
                >
                  <Upload size={18} className="text-emerald-500" />
                  अर्को डिभाइसको पोस्ट फाइल इम्पोर्ट गर्नुहोस् (.json)
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImportJSON} 
                  accept=".json" 
                  className="hidden" 
                />
              </div>

              <div className="bg-muted-area/50 p-4 rounded-2xl border border-border-theme/50 text-[11px] text-muted-text leading-relaxed">
                💡 **सुझाव**: अर्को डिभाइसमा रोकिएका समाचार वा पोस्टहरू यस डिभाइसमा ल्याउन, उताबाट `.json` फाइल डाउनलोड गरी यहाँ "इम्पोर्ट" गर्नुहोस्।
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
