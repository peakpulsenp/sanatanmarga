import { Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/src/hooks/usePushNotifications';
import { useState } from 'react';
import { toast } from 'sonner';

export default function PushNotificationPrompt() {
  const { permission, requestPermission, isSupported } = usePushNotifications();
  const [loading, setLoading] = useState(false);

  if (!isSupported) return null;

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const token = await requestPermission();
      if (token) {
        toast.success('तपाइँले सूचनाहरू सफलतापूर्वक सुचारु गर्नुभयो!');
      } else if (typeof window !== 'undefined' && window.Notification?.permission === 'denied') {
        toast.error('कृपया ब्राउजर सेटिङमा गई सूचना अनुमति दिनुहोस्।');
      }
    } catch (err) {
      toast.error('त्रुटि भयो। कृपया फेरि प्रयास गर्नुहोस।');
    } finally {
      setLoading(false);
    }
  };

  if (permission === 'granted') return null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:bg-primary/10">
      <div className="flex items-center gap-4 text-center md:text-left">
        <div className="w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
          <Bell size={24} />
        </div>
        <div>
          <h4 className="text-sm font-black text-card-foreground uppercase tracking-tight">सूचनाहरू सुचारु गर्नुहोस</h4>
          <p className="text-xs text-muted-foreground font-medium">नयाँ समाचार र महत्वपूर्ण अपडेटहरूको तुरुन्त सूचना पाउनुहोस्।</p>
        </div>
      </div>
      
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="bg-primary text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" size={14} /> : <Bell size={14} />}
        सुचारु गर्नुहोस्
      </button>
    </div>
  );
}
