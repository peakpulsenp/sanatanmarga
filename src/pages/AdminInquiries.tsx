import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, safeOnSnapshot as onSnapshot, doc, updateDoc, deleteDoc } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, Phone, Calendar, User, MessageSquare, 
  Trash2, CheckCircle2, Clock, Filter, Search, 
  MoreVertical, ChevronRight, ExternalLink, Briefcase, DollarSign
} from "lucide-react";
import type { ModelInquiry, InquiryStatus } from "@/src/types";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { toast } from "sonner";
import { toSafeDate } from "@/src/lib/utils";
import ConfirmModal from "@/src/components/ui/ConfirmModal";

export default function AdminInquiries() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [inquiries, setInquiries] = useState<ModelInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | "All">("All");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "modelInquiries"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inquiriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ModelInquiry));
      setInquiries(inquiriesData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id: string, status: InquiryStatus) => {
    try {
      await updateDoc(doc(db, "modelInquiries", id), { status });
      toast.success(`Status updated to ${status}`);
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!inquiryToDelete) return;
    try {
      await deleteDoc(doc(db, "modelInquiries", inquiryToDelete));
      toast.success("Inquiry deleted successfully");
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error("Error deleting inquiry:", err);
      toast.error("Failed to delete inquiry");
    }
  };

  const filteredInquiries = inquiries.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         i.modelName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: InquiryStatus) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-600";
      case "contacted": return "bg-orange-100 text-orange-600";
      case "closed": return "bg-green-100 text-green-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-black text-card-foreground tracking-tighter">Booking Inquiries</h1>
            <p className="text-muted-text font-medium">Manage and respond to model booking requests.</p>
          </div>

          {/* Filters */}
          <div className="bg-card p-4 rounded-3xl shadow-sm border border-border-theme mb-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" size={20} />
              <input 
                type="text"
                placeholder="Search by name or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-muted-area border-none rounded-2xl text-sm font-bold text-card-foreground focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-text/50"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {["All", "new", "contacted", "closed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as any)}
                  className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    statusFilter === status 
                      ? "bg-primary text-white" 
                      : "bg-muted-area text-muted-text hover:bg-muted"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Inquiries List */}
          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-32 bg-card rounded-3xl animate-pulse" />)
            ) : filteredInquiries.length > 0 ? (
              filteredInquiries.map((inquiry) => (
                <motion.div 
                  layout
                  key={inquiry.id}
                  className="bg-card p-6 rounded-[32px] shadow-sm border border-border-theme flex flex-col lg:flex-row lg:items-center gap-8 group hover:shadow-xl transition-all duration-500"
                >
                  {/* Status & Date */}
                  <div className="flex flex-col gap-2 min-w-[120px]">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-center ${getStatusColor(inquiry.status)}`}>
                      {inquiry.status}
                    </span>
                    <span className="text-xxs font-bold text-muted-text uppercase tracking-widest flex items-center gap-1">
                      <Clock size={10} /> {toSafeDate(inquiry.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Client Info */}
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">Client</span>
                      <h3 className="text-lg font-black text-card-foreground tracking-tight">{inquiry.name}</h3>
                      <div className="flex flex-col gap-1 mt-1">
                        <a href={`mailto:${inquiry.email}`} className="text-xs font-bold text-primary hover:underline flex items-center gap-2">
                          <Mail size={12} /> {inquiry.email}
                        </a>
                        {inquiry.phone && (
                          <a href={`tel:${inquiry.phone}`} className="text-xs font-bold text-muted-text flex items-center gap-2">
                            <Phone size={12} /> {inquiry.phone}
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">Model & Project</span>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-black text-card-foreground tracking-tight">{inquiry.modelName}</h4>
                        <Link to={`/models/${inquiry.modelId}`} target="_blank" className="text-muted-text hover:text-primary transition-colors">
                          <ExternalLink size={14} />
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-3 py-1 bg-muted-area text-muted-text rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                          <Briefcase size={10} /> {inquiry.projectType}
                        </span>
                        {inquiry.budget && (
                          <span className="px-3 py-1 bg-muted-area text-muted-text rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                            <DollarSign size={10} /> {inquiry.budget}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">Message</span>
                      <p className="text-xs font-medium text-muted-text line-clamp-2 italic">
                        "{inquiry.message || "No message provided."}"
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 lg:border-l lg:border-border-theme lg:pl-8">
                    {inquiry.status === "new" && (
                      <button 
                        onClick={() => handleUpdateStatus(inquiry.id, "contacted")}
                        className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                        title="Mark as Contacted"
                      >
                        <Clock size={20} />
                      </button>
                    )}
                    {inquiry.status !== "closed" && (
                      <button 
                        onClick={() => handleUpdateStatus(inquiry.id, "closed")}
                        className="p-3 bg-green-500/10 text-green-500 rounded-2xl hover:bg-green-500 hover:text-white transition-all shadow-sm"
                        title="Close Inquiry"
                      >
                        <CheckCircle2 size={20} />
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setInquiryToDelete(inquiry.id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                      title="Delete Inquiry"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-card p-20 rounded-[40px] text-center border border-border-theme">
                <div className="w-20 h-20 bg-muted-area rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail size={32} className="text-muted-text/30" />
                </div>
                <h3 className="text-2xl font-black text-card-foreground tracking-tight">No inquiries found</h3>
                <p className="text-muted-text font-medium mt-2">When clients book models, their requests will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Inquiry"
        message="Are you sure you want to delete this booking inquiry? This action cannot be undone."
        confirmText="Delete"
      />
    </AdminLayout>
  );
}
