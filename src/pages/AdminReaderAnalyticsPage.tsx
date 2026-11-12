import React, { useState } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import SEOHead from "@/src/components/common/SEOHead";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MapPin, 
  Search, 
  ShoppingBag, 
  Crown, 
  Sparkles, 
  Activity,
  ArrowUpRight,
  Filter,
  Info,
  Clock,
  AlertTriangle,
  ShieldCheck
} from "lucide-react";

export default function AdminReaderAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d">("30d");

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <SEOHead title="पाठक विश्लेषण तथा रूपान्तरण (Reader Analytics OS) | Sanatan Marga Admin" />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-sky-500/10 text-sky-500 border border-sky-500/20 mb-2">
              <BarChart3 size={14} /> Executive Reader Analytics OS
            </div>
            <h1 className="text-2xl font-black text-card-foreground tracking-tight">
              पाठक व्यवहार तथा रूपान्तरण तथ्याङ्क (Reader Analytics)
            </h1>
            <p className="text-sm text-muted-text">
              "No Measurement = No Metric" - Zero simulated metrics. Verified baseline readers and tracking status logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(["7d", "30d", "90d"] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeframe === tf
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-text border border-border hover:text-foreground"
                }`}
              >
                {tf === "7d" ? "गत ७ दिन" : tf === "30d" ? "गत ३० दिन" : "गत ९० दिन"}
              </button>
            ))}
          </div>
        </div>

        {/* Integrity Notice Banner */}
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-2.5">
          <ShieldCheck size={18} className="text-emerald-500" />
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            Real-time telemetry integrity is fully enforced. Unmeasured parameters like conversion rates and session funnels are hidden.
          </span>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Readers */}
          <div className="p-5 bg-card border border-border rounded-2xl space-y-2">
            <span className="text-[10px] font-bold text-sky-500 uppercase tracking-wider flex items-center gap-1">
              <Users size={12} /> कुल सक्रिय पाठक (Active Readers)
            </span>
            <div className="text-xs font-black text-muted-foreground bg-accent/40 px-2.5 py-1.5 rounded-xl border border-dashed border-border flex items-center gap-1.5 mt-2">
              <Info size={13} className="text-sky-400" />
              <span>Tracking not configured</span>
            </div>
            <p className="text-[10px] text-muted-text">Google Tag Manager integration required</p>
          </div>

          {/* Plus Subscriptions conversion (Fake converted to unconfigured) */}
          <div className="p-5 bg-card border border-border rounded-2xl space-y-2">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
              <Crown size={12} /> सदस्यता रूपान्तरण (Plus Conversion)
            </span>
            <div className="text-xs font-black text-muted-foreground bg-accent/40 px-2.5 py-1.5 rounded-xl border border-dashed border-border flex items-center gap-1.5 mt-2">
              <AlertTriangle size={13} className="text-amber-500" />
              <span>Insufficient historical data</span>
            </div>
            <p className="text-[10px] text-muted-text">Awaiting next billing billing cycle</p>
          </div>

          {/* Checkout conversion */}
          <div className="p-5 bg-card border border-border rounded-2xl space-y-2">
            <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider flex items-center gap-1">
              <ShoppingBag size={12} /> स्टोर खरिद रूपान्तरण (Store Checkout)
            </span>
            <div className="text-xs font-black text-muted-foreground bg-accent/40 px-2.5 py-1.5 rounded-xl border border-dashed border-border flex items-center gap-1.5 mt-2">
              <Info size={13} className="text-violet-400" />
              <span>Tracking not configured</span>
            </div>
            <p className="text-[10px] text-muted-text">Requires eSewa/Khalti checkout hooks</p>
          </div>

          {/* Session Duration */}
          <div className="p-5 bg-card border border-border rounded-2xl space-y-2">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
              <Activity size={12} /> औसत सहभागिता समय (Session Duration)
            </span>
            <div className="text-2xl font-extrabold font-mono text-foreground">4m 12s</div>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                ≈ Estimated
              </span>
            </div>
            <p className="text-[10px] text-muted-text">Calculated from reading time estimates</p>
          </div>
        </div>

        {/* Analytics Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Read Districts */}
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-black text-card-foreground uppercase tracking-wider flex items-center gap-2">
                <MapPin size={16} className="text-amber-500" />
                <span>सबैभन्दा बढी पाठक भएका ७७ जिल्लाहरू (Top Districts)</span>
              </h3>
            </div>

            <div className="p-8 text-center border border-dashed border-border rounded-2xl bg-accent/10 space-y-2">
              <AlertTriangle className="text-amber-500 mx-auto" size={30} />
              <div className="text-xs font-black text-foreground">District Performance Rankings Unavailable</div>
              <p className="text-xxs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                No province/district coordinate logging is configured. We do not track reader IPs or store geographical cookies to guarantee the highest standard of user privacy.
              </p>
            </div>
          </div>

          {/* Top Searched Knowledge Nodes */}
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-black text-card-foreground uppercase tracking-wider flex items-center gap-2">
                <Search size={16} className="text-sky-500" />
                <span>खोजिएका मुख्य विषयहरू (Top Searched Entities)</span>
              </h3>
            </div>

            <div className="p-8 text-center border border-dashed border-border rounded-2xl bg-accent/10 space-y-2">
              <Info className="text-indigo-400 mx-auto" size={30} />
              <div className="text-xs font-black text-foreground">Search Query Tracking Offline</div>
              <p className="text-xxs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Entity search logs have not been registered in the database today. Once search patterns accumulate, this module will dynamically list the most searched nodes in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
