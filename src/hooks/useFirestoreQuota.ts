import { useState, useEffect, useMemo } from 'react';
import { offlineQueue } from '@/src/lib/offlineQueue';
import { telemetry } from '@/src/lib/telemetry';
import { useConnectivity } from '@/src/lib/connectivity';

// Budget Thresholds (Daily Network Reads)
const BUDGET_YELLOW = 20000;
const BUDGET_RED = 40000;

/**
 * Custom hook to listen for Firestore quota status and provide Limited Mode details.
 */
export function useFirestoreQuota() {
  const [quotaStatus, setQuotaStatus] = useState({
    isExceeded: offlineQueue.getIsQuotaExceeded(),
    usageCount: telemetry.getDailyNetworkReads(),
    lastChecked: Date.now()
  });

  useEffect(() => {
    const handleStatus = (e: any) => {
      setQuotaStatus(prev => ({
        ...prev,
        isExceeded: e?.detail?.isExceeded ?? offlineQueue.getIsQuotaExceeded(),
        lastChecked: Date.now()
      }));
    };

    const handleUsage = (e: any) => {
      setQuotaStatus(prev => ({
        ...prev,
        usageCount: e?.detail?.count ?? telemetry.getDailyNetworkReads()
      }));
    };
    
    window.addEventListener('quota-status-changed' as any, handleStatus);
    window.addEventListener('firestore-usage-updated' as any, handleUsage);
    
    return () => {
      window.removeEventListener('quota-status-changed' as any, handleStatus);
      window.removeEventListener('firestore-usage-updated' as any, handleUsage);
    };
  }, []);

  const isBudgetExceeded = quotaStatus.usageCount >= BUDGET_RED;
  const isBudgetWarning = quotaStatus.usageCount >= BUDGET_YELLOW;
  const isExceeded = quotaStatus.isExceeded || isBudgetExceeded;

  return useMemo(() => ({
    isExceeded,
    isWarning: isBudgetWarning,
    usageCount: quotaStatus.usageCount,
    thresholds: { yellow: BUDGET_YELLOW, red: BUDGET_RED }
  }), [isExceeded, isBudgetWarning, quotaStatus.usageCount]);
}

/**
 * Hook specifically for components that need to adapt behavior in Limited Mode.
 */
export function useLimitedMode() {
  const { isExceeded, isWarning, usageCount } = useFirestoreQuota();
  const isOnline = useConnectivity();
  const isOffline = !isOnline;

  const isActive = isExceeded || isOffline;
  
  return useMemo(() => ({
    isActive,
    isWarning: isWarning && !isActive,
    usageCount,
    reason: isOffline ? 'offline' : isExceeded ? 'quota_budget' : null,
    refreshInterval: isActive ? 300000 : isWarning ? 120000 : 60000, 
  }), [isActive, isWarning, usageCount, isOffline, isExceeded]);
}

