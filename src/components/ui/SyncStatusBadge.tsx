import React, { useState, useEffect } from 'react';
import { offlineQueue } from '@/src/lib/offlineQueue';
import { Cloud, CloudOff, RefreshCw, AlertCircle, List } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import OfflineQueueModal from './OfflineQueueModal';

interface SyncStatusBadgeProps {
  className?: string;
}

export default function SyncStatusBadge({ className = "" }: SyncStatusBadgeProps) {
  const [stats, setStats] = useState(offlineQueue.getStats());
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      const newStats = offlineQueue.getStats();
      setStats(newStats);
      
      // Show badge ONLY if there are pending or failed items, or if currently syncing
      if (newStats.pending > 0 || newStats.failed > 0 || newStats.syncing > 0) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('offline-queue-updated', handleUpdate);
    window.addEventListener('offline-queue-changed' as any, handleUpdate);
    window.addEventListener('action-queued' as any, handleUpdate);
    
    // Initial check
    handleUpdate();

    return () => {
      window.removeEventListener('offline-queue-updated', handleUpdate);
      window.removeEventListener('offline-queue-changed' as any, handleUpdate);
      window.removeEventListener('action-queued' as any, handleUpdate);
    };
  }, []);

  const handleDirectSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const allIds = offlineQueue.getQueue().map(op => op.id);
      offlineQueue.retryOperations(allIds);
      await offlineQueue.sync(true);
    } catch (err) {
      console.error("Direct sync error:", err);
    } finally {
      setIsSyncing(false);
      setStats(offlineQueue.getStats());
    }
  };

  if (!isVisible && !isModalOpen) return null;

  const hasItemsToSync = stats.pending > 0 || stats.failed > 0;
  const isSyncInProgress = stats.syncing > 0 || isSyncing;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-card text-card-foreground border border-border-theme shadow-2xl rounded-full p-1.5 pl-3.5 text-xs font-bold ${className}`}
      >
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none cursor-pointer pr-1"
          title="क्यु विवरण हेर्नुहोस् (View Queue List)"
        >
          {isSyncInProgress ? (
            <>
              <RefreshCw className="w-4 h-4 text-primary animate-spin" />
              <span className="text-primary font-bold">सिंक हुँदैछ ({stats.pending + stats.syncing})...</span>
            </>
          ) : stats.failed > 0 ? (
            <>
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-500 font-bold">{stats.failed} असफल</span>
            </>
          ) : (
            <>
              <Cloud className="w-4 h-4 text-amber-500" />
              <span className="text-amber-500 font-bold">{stats.pending} क्युमा</span>
            </>
          )}
          <List className="w-3.5 h-3.5 text-muted-text hover:text-text-theme" />
        </button>
        
        {/* Direct Sync Action Button on the Floating Dialog */}
        {hasItemsToSync && (
          <button 
            onClick={handleDirectSync}
            disabled={isSyncInProgress}
            className="flex items-center gap-1.5 bg-primary text-white px-3.5 py-1.5 rounded-full hover:bg-primary/90 active:scale-95 disabled:opacity-50 transition-all shadow-sm cursor-pointer text-xs font-bold"
            title="सबै पेन्डिङ कार्यहरू तुरुन्त सिंक गर्नुहोस् (Sync All Items Now)"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncInProgress ? 'animate-spin' : ''}`} />
            <span>{isSyncInProgress ? "सिंक..." : stats.failed > 0 ? "पुनः प्रयास" : "सिंक गर्नुहोस्"}</span>
          </button>
        )}
      </motion.div>

      <OfflineQueueModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
