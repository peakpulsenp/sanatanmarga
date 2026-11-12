import { useState, useEffect } from 'react';
import { Database, RefreshCw, AlertCircle, CheckCircle2, CloudOff } from 'lucide-react';
import { syncOS } from '@/src/lib/syncOS';
import { motion, AnimatePresence } from 'motion/react';

export interface SyncStatusBadgeProps {
  showCount?: boolean;
  className?: string;
  compact?: boolean;
}

export default function SyncStatusBadge({ showCount = true, className = '', compact = false }: SyncStatusBadgeProps) {
  const [stats, setStats] = useState(syncOS.getStats());

  useEffect(() => {
    const handleUpdate = () => {
      setStats(syncOS.getStats());
    };

    window.addEventListener('offline-queue-changed', handleUpdate);
    window.addEventListener('offline-queue-updated', handleUpdate);
    window.addEventListener('quota-status-changed', handleUpdate);

    const interval = setInterval(() => {
      setStats(syncOS.getStats());
    }, 3000);

    return () => {
      window.removeEventListener('offline-queue-changed', handleUpdate);
      window.removeEventListener('offline-queue-updated', handleUpdate);
      window.removeEventListener('quota-status-changed', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const { queued, syncing, failed, retryWait, isQuotaExceeded } = stats;
  const totalPending = queued + syncing + retryWait;

  // If nothing is pending, failed, or quota-exceeded, render nothing or quiet status
  if (totalPending === 0 && failed === 0 && !isQuotaExceeded) {
    return null;
  }

  // Derive status label and style
  let badgeText = 'Saved offline';
  let badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
  let Icon = Database;

  if (syncing > 0) {
    badgeText = 'Syncing…';
    badgeColor = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
    Icon = RefreshCw;
  } else if (failed > 0) {
    badgeText = 'Needs attention';
    badgeColor = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    Icon = AlertCircle;
  } else if (isQuotaExceeded) {
    badgeText = 'Continuity Mode';
    badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    Icon = CloudOff;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-colors ${badgeColor} ${className}`}
        role="status"
        aria-label={`SyncOS Status: ${badgeText}`}
      >
        <Icon size={12} className={syncing > 0 ? 'animate-spin' : ''} />
        <span>{badgeText}</span>
        {showCount && totalPending > 0 && (
          <span className="px-1 py-0.2 rounded bg-current/10 font-bold">
            {totalPending}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
