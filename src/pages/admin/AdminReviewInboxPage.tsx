import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/src/components/layout/AdminLayout";
import AdminPageHeader from "@/src/components/admin/AdminPageHeader";
import SEOHead from "@/src/components/common/SEOHead";
import { 
  Inbox, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter, 
  ArrowUpRight, 
  FileText, 
  Calendar, 
  ShieldAlert, 
  BookOpen, 
  Search,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/src/lib/auth";
import { adminFetch } from "@/src/lib/adminFetch";

export interface ReviewItem {
  reviewId: string;
  reviewType: string;
  domain: string;
  entityType: string;
  entityId: string;
  title: string;
  reason: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";
  assignedTo?: string;
  submittedBy?: string;
  createdAt: string;
  updatedAt: string;
  targetRoute: string;
  allowedActions: string[];
  tenantId?: string;
}

export default function AdminReviewInboxPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("PENDING");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      } else {
        // Fallback default
        setReviews([
          {
            reviewId: "rev_art_101",
            reviewType: "ARTICLE_REVIEW",
            domain: "EDITORIAL",
            entityType: "articles",
            entityId: "art-ancient-temples-heritage",
            title: "काठमाडौँका प्राचीन मन्दिरहरूको ऐतिहासिक सम्पदा",
            reason: "New editorial draft awaiting editorial sign-off before snapshot publication",
            priority: "NORMAL",
            status: "PENDING",
            submittedBy: "editor_staff",
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            updatedAt: new Date(Date.now() - 3600000).toISOString(),
            targetRoute: "/admin/editor/art-ancient-temples-heritage",
            allowedActions: ["APPROVE", "REJECT", "REQUEST_CHANGES"]
          },
          {
            reviewId: "rev_event_indra",
            reviewType: "EVENT_APPROVAL",
            domain: "EVENTS_COMMERCE",
            entityType: "events",
            entityId: "indra-jatra-2026",
            title: "इन्द्रजात्रा महोत्सव २०८३ - तिथि प्रमाणीकरण",
            reason: "Festival lunar calendar recurrence date verification required",
            priority: "HIGH",
            status: "PENDING",
            submittedBy: "researcher_staff",
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            updatedAt: new Date(Date.now() - 7200000).toISOString(),
            targetRoute: "/admin/events/indra-jatra-2026",
            allowedActions: ["VERIFY", "REVISE"]
          }
        ]);
      }
    } catch (e) {
      console.warn("Error fetching reviews:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleUpdateStatus = async (reviewId: string, newStatus: ReviewItem["status"]) => {
    try {
      const res = await adminFetch(`/api/admin/reviews/${reviewId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success(`Review item marked as ${newStatus}`);
      }
      setReviews(prev =>
        prev.map(r => (r.reviewId === reviewId ? { ...r, status: newStatus } : r))
      );
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (selectedDomain !== "ALL" && r.domain !== selectedDomain) return false;
    if (selectedPriority !== "ALL" && r.priority !== selectedPriority) return false;
    if (selectedStatus !== "ALL" && r.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.title.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q);
    }
    return true;
  });

  const getDomainIcon = (domain: string) => {
    switch (domain) {
      case "EDITORIAL": return <FileText size={14} className="text-amber-500" />;
      case "EVENTS_COMMERCE": return <Calendar size={14} className="text-blue-500" />;
      case "COMMUNITY": return <ShieldAlert size={14} className="text-rose-500" />;
      case "KNOWLEDGE": return <BookOpen size={14} className="text-emerald-500" />;
      default: return <Inbox size={14} className="text-primary" />;
    }
  };

  const getPriorityBadge = (priority: ReviewItem["priority"]) => {
    switch (priority) {
      case "URGENT":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">Urgent</span>;
      case "HIGH":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">High</span>;
      case "NORMAL":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">Normal</span>;
      case "LOW":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-500 border border-slate-500/20">Low</span>;
    }
  };

  return (
    <AdminLayout title="Review Inbox">
      <SEOHead title="समीक्षा इनबक्स (Universal Review Inbox) | Sanatan Marga Admin" />
      
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        <AdminPageHeader
          title="समीक्षा इनबक्स (Universal Review Inbox)"
          description="सम्पादकीय मस्यौदा, सामग्री प्रमाणीकरण, र मोडरेसनका कार्यहरू एकै स्थानमा समीक्षा गर्नुहोस्।"
          breadcrumbs={[
            { label: "Admin", route: "/admin" },
            { label: "Review Inbox", route: "/admin/review" }
          ]}
          statusBadge={
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-primary/10 text-primary border border-primary/20">
              {filteredReviews.length} कार्यहरू
            </span>
          }
          primaryAction={{
            label: "ताजा गर्नुहोस्",
            icon: <RefreshCw size={14} className={loading ? "animate-spin" : ""} />,
            onClick: fetchReviews
          }}
        />

        {/* Filter Controls Bar */}
        <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 custom-scrollbar text-xs font-bold">
            <span className="text-muted-text flex items-center gap-1 shrink-0 mr-1">
              <Filter size={13} /> विधा:
            </span>
            {["ALL", "EDITORIAL", "EVENTS_COMMERCE", "COMMUNITY", "KNOWLEDGE"].map(dom => (
              <button
                key={dom}
                onClick={() => setSelectedDomain(dom)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                  selectedDomain === dom 
                    ? "bg-primary text-white shadow-xs" 
                    : "bg-muted-area hover:bg-muted-area/80 text-muted-text hover:text-foreground border border-border-theme"
                }`}
              >
                {dom === "ALL" ? "सबै विधा" : dom.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="खोज्नुहोस् (शीर्षक, कारण)..."
                className="w-full pl-8 pr-3 py-1.5 bg-muted-area border border-border-theme rounded-xl text-xs text-foreground placeholder:text-muted-text focus:outline-none focus:border-primary"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-muted-area border border-border-theme rounded-xl text-xs font-bold text-foreground focus:outline-none"
            >
              <option value="ALL">सबै स्थिति (All Status)</option>
              <option value="PENDING">प्रतीक्षारत (Pending)</option>
              <option value="IN_REVIEW">समीक्षामा (In Review)</option>
              <option value="APPROVED">स्वीकृत (Approved)</option>
              <option value="REJECTED">अस्वीकृत (Rejected)</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-3">
          {filteredReviews.length === 0 ? (
            <div className="bg-card border border-border-theme rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle size={22} />
              </div>
              <h3 className="text-base font-bold text-card-foreground">
                कुनै समीक्षा बाँकी छैन (Inbox Zero)
              </h3>
              <p className="text-xs text-muted-text max-w-sm mx-auto">
                चयन गरिएको मापदण्ड अनुसार सबै सम्पादकीय र प्रमाणीकरण कार्यहरू सम्पन्न भएका छन्।
              </p>
            </div>
          ) : (
            filteredReviews.map(item => (
              <div 
                key={item.reviewId}
                className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-muted-text">
                      {getDomainIcon(item.domain)}
                      {item.domain}
                    </span>
                    <span className="text-muted-text/40">•</span>
                    {getPriorityBadge(item.priority)}
                    <span className="text-muted-text/40">•</span>
                    <span className="text-[11px] font-mono text-muted-text flex items-center gap-1">
                      <Clock size={11} /> {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    {item.submittedBy && (
                      <span className="text-[11px] text-muted-text">
                        by <span className="font-semibold text-foreground">{item.submittedBy}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-black text-card-foreground group-hover:text-primary transition-colors truncate">
                    {item.title}
                  </h3>

                  <p className="text-xs text-muted-text line-clamp-2 leading-relaxed">
                    {item.reason}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Link
                    to={item.targetRoute}
                    className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>खोल्नुहोस्</span>
                    <ArrowUpRight size={13} />
                  </Link>

                  {item.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(item.reviewId, "APPROVED")}
                        className="p-1.5 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-colors cursor-pointer"
                        title="स्वीकृत गर्नुहोस् (Approve)"
                      >
                        <CheckCircle size={18} />
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(item.reviewId, "REJECTED")}
                        className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors cursor-pointer"
                        title="अस्वीकृत गर्नुहोस् (Reject)"
                      >
                        <XCircle size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
