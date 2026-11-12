import { useState, useEffect } from "react";
import { collection, query, orderBy, safeOnSnapshot as onSnapshot, doc, updateDoc, deleteDoc } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, Phone, Calendar, User, MessageSquare, 
  Trash2, CheckCircle2, Clock, Filter, Search, 
  MoreVertical, ChevronRight, ExternalLink, Info
} from "lucide-react";
import type { ContactMessage } from "@/src/types";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { toast } from "sonner";
import { toSafeDate, normalizeSearchText } from "@/src/lib/utils";
import ConfirmModal from "@/src/components/ui/ConfirmModal";


interface NormalizedContactMessage extends ContactMessage {
  isMalformed?: boolean;
}

function normalizeContactMessage(doc: any): NormalizedContactMessage {
  const id = String(doc?.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const name = typeof doc?.name === "string" ? doc.name.trim() : "";
  const email = typeof doc?.email === "string" ? doc.email.trim() : "";
  const subject = typeof doc?.subject === "string" ? doc.subject.trim() : "";
  const message = typeof doc?.message === "string" ? doc.message.trim() : "";
  const status = ["new", "read", "replied", "archived"].includes(doc?.status) ? doc.status : "new";
  const createdAt = doc?.createdAt || new Date().toISOString();
  
  const isMalformed = !name && !email && !subject && !message;

  return {
    id,
    name: name || "अज्ञात प्रेषक",
    email: email || "noreply@sanatanmarga.com",
    subject: subject || "विषय खुलाइएको छैन",
    message: message || "कुनै सन्देश सामग्री छैन",
    status,
    createdAt,
    isMalformed
  };
}

export default function AdminContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContactMessage["status"] | "All">("All");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "contactMessages"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => normalizeContactMessage({ id: doc.id, ...doc.data() }));
      setMessages(messagesData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id: string, status: ContactMessage["status"]) => {
    try {
      await updateDoc(doc(db, "contactMessages", id), { status });
      toast.success(`अवस्था अपडेट गरियो: ${status}`);
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("अवस्था अपडेट गर्न असफल भयो");
    }
  };

  const handleDelete = async () => {
    if (!messageToDelete) return;
    try {
      await deleteDoc(doc(db, "contactMessages", messageToDelete));
      toast.success("सन्देश सफलतापूर्वक हटाइयो");
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error("Error deleting message:", err);
      toast.error("सन्देश हटाउन असफल भयो");
    }
  };

  const filteredMessages = messages.filter(m => {
    const q = normalizeSearchText(searchQuery);
    const matchesSearch = !q ||
                         normalizeSearchText(m.name).includes(q) || 
                         normalizeSearchText(m.subject).includes(q) ||
                         normalizeSearchText(m.email).includes(q);
    const matchesStatus = statusFilter === "All" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: ContactMessage["status"]) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-600";
      case "read": return "bg-slate-100 text-slate-600";
      case "replied": return "bg-green-100 text-green-600";
      case "archived": return "bg-orange-100 text-orange-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-black text-card-foreground tracking-tighter">सम्पर्क सन्देशहरू</h1>
            <p className="text-muted-text font-medium">सम्पर्क पेजबाट आएका सन्देशहरू यहाँबाट व्यवस्थापन गर्नुहोस्।</p>
          </div>

          {/* Filters */}
          <div className="bg-card p-4 rounded-3xl shadow-sm border border-border-theme mb-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" size={20} />
              <input 
                type="text"
                placeholder="नाम, इमेल वा विषय खोज्नुहोस्..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-muted-area border-none rounded-2xl text-sm font-bold text-card-foreground focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {["All", "new", "read", "replied", "archived"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as any)}
                  className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    statusFilter === status 
                      ? "bg-slate-900 dark:bg-primary text-white" 
                      : "bg-muted-area text-muted-text hover:bg-muted"
                  }`}
                >
                  {status === "All" ? "सबै" : status === "new" ? "नयाँ" : status === "read" ? "पढिएको" : status === "replied" ? "जवाफ दिइएको" : "आर्काइभ"}
                </button>
              ))}
            </div>
          </div>

          {/* Messages List */}
          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-32 bg-card rounded-3xl animate-pulse border border-border-theme" />)
            ) : filteredMessages.length > 0 ? (
              filteredMessages.map((msg) => (
                <motion.div 
                  layout
                  key={msg.id}
                  className={`bg-card p-6 rounded-[32px] shadow-sm border border-border-theme flex flex-col lg:flex-row lg:items-center gap-8 group hover:shadow-xl transition-all duration-500 ${msg.status === 'new' ? 'ring-2 ring-primary/40 bg-primary/5 dark:bg-primary/[0.03]' : ''}`}
                >
                  {/* Status & Date */}
                  <div className="flex flex-col gap-2 min-w-[120px]">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-center ${getStatusColor(msg.status)}`}>
                      {msg.status === "new" ? "नयाँ" : msg.status === "read" ? "पढिएको" : msg.status === "replied" ? "जवाफ दिइएको" : "आर्काइभ"}
                    </span>
                    <span className="text-xxs font-bold text-muted-text uppercase tracking-widest flex items-center gap-1">
                      <Clock size={10} /> {toSafeDate(msg.createdAt).toLocaleDateString('ne-NP')}
                    </span>
                  </div>

                  {/* Message Info */}
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">प्रेषक</span>
                      <h3 className="text-lg font-black text-card-foreground tracking-tight">{msg.name}</h3>
                      <a href={`mailto:${msg.email}`} className="text-xs font-bold text-primary hover:underline flex items-center gap-2 mt-1">
                        <Mail size={12} /> {msg.email}
                      </a>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">विषय</span>
                      <h4 className="text-sm font-black text-card-foreground tracking-tight">{msg.subject}</h4>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">सन्देश</span>
                      <p className="text-xs font-medium text-muted-text line-clamp-2 italic">
                        "{msg.message}"
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 lg:border-l lg:border-border-theme/50 lg:pl-8">
                    {msg.status === "new" && (
                      <button 
                        onClick={() => handleUpdateStatus(msg.id, "read")}
                        className="p-3 bg-muted-area text-muted-text rounded-2xl hover:bg-slate-900 dark:hover:bg-primary hover:text-white transition-all shadow-sm"
                        title="Mark as Read"
                      >
                        <CheckCircle2 size={20} />
                      </button>
                    )}
                    {msg.status !== "replied" && (
                      <button 
                        onClick={() => handleUpdateStatus(msg.id, "replied")}
                        className="p-3 bg-green-500/10 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                        title="Mark as Replied"
                      >
                        <MessageSquare size={20} />
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setMessageToDelete(msg.id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-3 bg-red-500/10 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                      title="Delete Message"
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
                <h3 className="text-2xl font-black text-card-foreground tracking-tight">कुनै सन्देश भेटिएन</h3>
                <p className="text-muted-text font-medium mt-2">सम्पर्क पेजबाट आएका सन्देशहरू यहाँ देखिनेछन्।</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="सन्देश हटाउनुहोस्"
        message="के तपाईं यो सन्देश हटाउन निश्चित हुनुहुन्छ? यो कार्य फिर्ता लिन सकिने छैन।"
        confirmText="हटाउनुहोस्"
      />
    </AdminLayout>
  );
}
