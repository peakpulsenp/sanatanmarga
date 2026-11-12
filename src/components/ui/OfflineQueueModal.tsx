import React, { useState } from 'react';
import { offlineQueue } from '@/src/lib/offlineQueue';
import { X, RefreshCw, Trash2, CheckSquare, Square, AlertCircle, Clock, Database } from 'lucide-react';
import { motion } from 'motion/react';

interface OfflineQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OfflineQueueModal({ isOpen, onClose }: OfflineQueueModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queue = offlineQueue.getQueue();

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === queue.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(queue.map(op => op.id));
    }
  };

  const handleCancelSelected = () => {
    if (selectedIds.length === 0) return;
    offlineQueue.cancelOperations(selectedIds);
    setSelectedIds([]);
  };

  const handleRetrySelected = () => {
    if (selectedIds.length === 0) return;
    offlineQueue.retryOperations(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card text-card-foreground border border-border-theme rounded-2xl shadow-2xl max-w-xl w-full p-6 max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-4 border-b border-border-theme">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg text-text-theme">अफलाइन सञ्चालन क्यु (Offline Queue)</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-text hover:text-text-theme transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {queue.length === 0 ? (
          <div className="py-12 text-center text-muted-text">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">क्युमा कुनै पनि पेन्डिङ कार्यहरू छैनन्।</p>
            <p className="text-xs mt-1">सबै परिवर्तनहरू सफलतापूर्वक सिंक भइसकेका छन्।</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between py-3 px-1 text-xs border-b border-border-theme">
              <button 
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 font-semibold text-text-theme hover:text-primary transition-colors"
              >
                {selectedIds.length === queue.length ? (
                  <CheckSquare className="w-4 h-4 text-primary" />
                ) : (
                  <Square className="w-4 h-4 text-muted-text" />
                )}
                <span>सबै छान्नुहोस् ({selectedIds.length}/{queue.length})</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    offlineQueue.retryOperations(queue.map(op => op.id));
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 text-xs transition-colors cursor-pointer shadow-xs"
                  title="सबै पेन्डिङ कार्यहरू तुरुन्त सिंक गर्नुहोस्"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  सबै सिंक गर्नुहोस्
                </button>
                <button
                  onClick={handleRetrySelected}
                  disabled={selectedIds.length === 0}
                  className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors cursor-pointer"
                >
                  छानिएका पुनः प्रयास
                </button>
                <button
                  onClick={handleCancelSelected}
                  disabled={selectedIds.length === 0}
                  className="flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-500 font-bold rounded-lg hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  रद्द गर्नुहोस्
                </button>
              </div>
            </div>

            <div className="overflow-y-auto py-2 flex-1 space-y-2 pr-1">
              {queue.map((op) => {
                const isSelected = selectedIds.includes(op.id);
                return (
                  <div
                    key={op.id}
                    onClick={() => toggleSelect(op.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 text-xs ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border-theme bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="pt-0.5">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-text" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-theme truncate">
                          {op.action.type} · {op.action.collection}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          op.status === 'auth_required' ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' :
                          op.status === 'permission_denied' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400' :
                          op.status === 'failed' ? 'bg-red-500/20 text-red-500' :
                          op.status === 'syncing' ? 'bg-blue-500/20 text-blue-500' :
                          op.status === 'retry_wait' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                          'bg-amber-500/20 text-amber-500'
                        }`}>
                          {op.status === 'auth_required' ? 'लगइन आवश्यक' :
                           op.status === 'permission_denied' ? 'अनुमति अस्वीकृत' :
                           op.status === 'failed' ? 'त्रुटि' :
                           op.status === 'syncing' ? 'सिंक हुँदै...' :
                           op.status === 'retry_wait' ? 'पुनः प्रयास पर्खाइ' :
                           'पेन्डिङ'}
                        </span>
                      </div>
                      {op.error && (
                        <p className={`text-[11px] mt-1 flex items-center gap-1 ${
                          op.status === 'auth_required' ? 'text-orange-600 dark:text-orange-400' :
                          op.status === 'permission_denied' ? 'text-purple-600 dark:text-purple-400' :
                          'text-red-500'
                        }`}>
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{op.error}</span>
                        </p>
                      )}
                      <p className="text-[10px] text-muted-text mt-1">
                        प्रयास: {op.attempts} · {new Date(op.action.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="pt-4 border-t border-border-theme flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-muted text-text-theme font-bold rounded-xl hover:bg-muted/80 text-xs transition-colors"
          >
            बन्द गर्नुहोस्
          </button>
        </div>
      </motion.div>
    </div>
  );
}
