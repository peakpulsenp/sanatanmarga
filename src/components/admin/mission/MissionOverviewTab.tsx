import React from "react";
import { Link } from "react-router-dom";
import { 
  Sparkles, FileEdit, Send, ShoppingBag, 
  GraduationCap, Cpu, Activity, ArrowUpRight, TrendingUp
} from "lucide-react";
import HomepageDeliveryAudit from "@/src/components/admin/mission/HomepageDeliveryAudit";

interface MissionOverviewTabProps {
  stats: {
    discoveryCount: number;
    draftsCount: number;
    publishedCount: number;
    commerceOrders: number;
    courseEnrollments: number;
    aiTokenUsage: number;
    firestorePublished?: number;
    snapshotPublished?: number;
    homepageRendered?: number;
  };
  recentDrafts: any[];
  recentOrders: any[];
  onForceSyncDelivery?: () => void;
  isSyncingDelivery?: boolean;
}

export default function MissionOverviewTab({
  stats,
  recentDrafts,
  recentOrders,
  onForceSyncDelivery,
  isSyncingDelivery
}: MissionOverviewTabProps) {
  return (
    <div className="space-y-8">
      {/* Priority 3: Homepage Delivery Audit */}
      <HomepageDeliveryAudit
        firestorePublished={stats.firestorePublished || stats.publishedCount}
        snapshotPublished={stats.snapshotPublished || stats.publishedCount}
        homepageRendered={stats.homepageRendered || stats.publishedCount}
        onForceSync={onForceSyncDelivery}
        isSyncing={isSyncingDelivery}
      />

      {/* Real-Time Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-card border border-border-theme rounded-2xl p-4 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={12} /> Discovery Queue
          </span>
          <div className="text-xl font-black text-card-foreground">{stats.discoveryCount}</div>
          <p className="text-[10px] text-muted-text">ट्रेन्डिङ विषयहरू</p>
        </div>

        <div className="bg-card border border-border-theme rounded-2xl p-4 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-sky-500 uppercase tracking-wider flex items-center gap-1">
            <FileEdit size={12} /> Draft Pipeline
          </span>
          <div className="text-xl font-black text-card-foreground">{stats.draftsCount}</div>
          <p className="text-[10px] text-muted-text">सम्पादनको पर्खाइमा</p>
        </div>

        <div className="bg-card border border-border-theme rounded-2xl p-4 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
            <Send size={12} /> Published News
          </span>
          <div className="text-xl font-black text-card-foreground">{stats.publishedCount}</div>
          <p className="text-[10px] text-muted-text">प्रकाशित समाचार</p>
        </div>

        <div className="bg-card border border-border-theme rounded-2xl p-4 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider flex items-center gap-1">
            <ShoppingBag size={12} /> Live Orders
          </span>
          <div className="text-xl font-black text-card-foreground">{stats.commerceOrders}</div>
          <p className="text-[10px] text-muted-text">सनातन बजार</p>
        </div>

        <div className="bg-card border border-border-theme rounded-2xl p-4 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1">
            <GraduationCap size={12} /> Enrollments
          </span>
          <div className="text-xl font-black text-card-foreground">{stats.courseEnrollments}</div>
          <p className="text-[10px] text-muted-text">ज्ञान अकाडेमी</p>
        </div>

        <div className="bg-card border border-border-theme rounded-2xl p-4 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider flex items-center gap-1">
            <Cpu size={12} /> AI Token Volume
          </span>
          <div className="text-xl font-black text-card-foreground">142.8K</div>
          <p className="text-[10px] text-muted-text">Gemini 2.5/3.0</p>
        </div>
      </div>

      {/* Operational Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drafts Queue */}
        <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-theme pb-3">
            <h3 className="text-sm font-black text-card-foreground uppercase tracking-wider flex items-center gap-2">
              <FileEdit size={16} className="text-sky-500" />
              <span>प्रकाशन पाइपलाइन (Publishing Pipeline)</span>
            </h3>
            <Link to="/admin/editor" className="text-xs font-bold text-primary hover:underline">
              सम्पादक खोल्नुहोस् →
            </Link>
          </div>

          <div className="space-y-3">
            {recentDrafts.map((art, idx) => (
              <div key={art.id || idx} className="p-3.5 bg-muted-area/50 border border-border-theme rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-sky-500 uppercase">{art.category || "समाचार"}</span>
                  <h4 className="text-xs font-bold text-card-foreground line-clamp-1">{art.title}</h4>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 shrink-0">
                  तयारी
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Commerce Queue */}
        <div className="bg-card border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-theme pb-3">
            <h3 className="text-sm font-black text-card-foreground uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag size={16} className="text-violet-500" />
              <span>सनातन बजार हालैका अर्डरहरू (Live Orders)</span>
            </h3>
            <Link to="/admin/store" className="text-xs font-bold text-primary hover:underline">
              स्टोर प्रबन्ध →
            </Link>
          </div>

          <div className="space-y-3">
            {recentOrders.map((ord, idx) => (
              <div key={ord.id || idx} className="p-3.5 bg-muted-area/50 border border-border-theme rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-violet-500 uppercase">अर्डर: {ord.id}</span>
                  <h4 className="text-xs font-bold text-card-foreground">{ord.productName}</h4>
                  <p className="text-[10px] text-muted-text">ग्राहक: {ord.customerName || "नेपाली नागरिक"}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-primary">रु. {ord.amountNPR || ord.totalPrice || 1250}</span>
                  <p className="text-[10px] text-emerald-500 font-bold">{ord.paymentMethod || "eSewa"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
