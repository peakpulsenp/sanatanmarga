import { useState, useEffect } from "react";
import { collection, query, safeOnSnapshot as onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { User, Phone, Mail, Plus, Search, Edit2, Trash2, X, CheckCircle, AlertCircle, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Agent } from "@/src/types";
import { toast } from "sonner";

export default function AdminAgents() {
  const { user: currentUser } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    commissionRate: 10,
    isActive: true
  });

  useEffect(() => {
    const q = query(collection(db, "agents"));
    const unsub = onSnapshot(q, (snap) => {
      setAgents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Agent)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    try {
      if (editingAgent) {
        await updateDoc(doc(db, "agents", editingAgent.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        toast.success("Agent updated successfully");
      } else {
        await addDoc(collection(db, "agents"), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success("Agent added successfully");
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error saving agent:", err);
      toast.error("Failed to save agent");
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      bio: agent.bio || "",
      commissionRate: agent.commissionRate || 10,
      isActive: agent.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this agent?")) return;
    try {
      await deleteDoc(doc(db, "agents", id));
      toast.success("Agent deleted");
    } catch (err) {
      console.error("Error deleting agent:", err);
      toast.error("Failed to delete agent");
    }
  };

  const resetForm = () => {
    setEditingAgent(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      bio: "",
      commissionRate: 10,
      isActive: true
    });
  };

  const filteredAgents = agents.filter(a => {
    const q = searchQuery.toLowerCase();
    return (a.name || "").toLowerCase().includes(q) ||
           (a.email || "").toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-card-foreground tracking-tight">एजेन्टहरू</h1>
            <p className="text-sm font-medium text-muted-text">ग्ल्यामर एजेन्टहरू व्यवस्थापन गर्नुहोस्।</p>
          </div>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all self-start sm:self-center"
          >
            <Plus size={20} /> नयाँ एजेन्ट
          </button>
        </header>

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" size={20} />
          <input 
            type="text"
            placeholder="एजेन्ट खोज्नुहोस्..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border-theme rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
          />
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-card h-48 rounded-3xl animate-pulse border border-border-theme" />
            ))
          ) : filteredAgents.length > 0 ? (
            filteredAgents.map((agent) => (
              <motion.div 
                layout
                key={agent.id}
                className="bg-card p-6 rounded-3xl shadow-sm border border-border-theme group hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                      <Briefcase size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-card-foreground tracking-tight">{agent.name}</h3>
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${agent.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">
                          {agent.isActive ? 'सक्रिय' : 'निस्क्रिय'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(agent)} className="p-2 text-muted-text hover:text-primary transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(agent.id)} className="p-2 text-muted-text hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs font-bold text-muted-text">
                    <Mail size={16} className="text-primary" /> {agent.email}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-muted-text">
                    <Phone size={16} className="text-primary" /> {agent.phone}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border-theme flex items-center justify-between">
                    <span className="text-xxs font-black text-muted-text uppercase tracking-widest">कमीसन दर</span>
                    <span className="text-sm font-black text-primary">{agent.commissionRate}%</span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 text-muted-text">
              <AlertCircle size={48} className="opacity-20" />
              <p className="font-bold uppercase tracking-widest text-sm">एजेन्टहरू भेटिएन</p>
            </div>
          )}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-card rounded-[40px] p-8 md:p-10 w-full max-w-xl shadow-2xl border border-border-theme overflow-hidden h-auto max-h-[90vh] flex flex-col"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-card-foreground tracking-tight">{editingAgent ? 'एजेन्ट सम्पादन' : 'नयाँ एजेन्ट थप्नुहोस्'}</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-muted-text hover:text-primary transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-2">
                    <label className="text-xxs font-black text-muted-text uppercase tracking-widest ml-1">नाम</label>
                    <input 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-muted-area border border-border-theme rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                    <label className="text-xxs font-black text-muted-text uppercase tracking-widest ml-1">इमेल</label>
                    <input 
                      required
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-muted-area border border-border-theme rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                    <div className="space-y-2">
                    <label className="text-xxs font-black text-muted-text uppercase tracking-widest ml-1">फोन</label>
                    <input 
                      required
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-muted-area border border-border-theme rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xxs font-black text-muted-text uppercase tracking-widest ml-1">बायो (परिचय)</label>
                    <textarea 
                      value={formData.bio}
                      onChange={e => setFormData({...formData, bio: e.target.value})}
                      className="w-full bg-muted-area border border-border-theme rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none h-32 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xxs font-black text-muted-text uppercase tracking-widest ml-1">कमीसन दर (%)</label>
                      <input 
                        type="number"
                        value={formData.commissionRate}
                        onChange={e => setFormData({...formData, commissionRate: parseInt(e.target.value)})}
                        className="w-full bg-muted-area border border-border-theme rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xxs font-black text-muted-text uppercase tracking-widest ml-1">स्थिति</label>
                      <select 
                        value={formData.isActive ? 'true' : 'false'}
                        onChange={e => setFormData({...formData, isActive: e.target.value === 'true'})}
                        className="w-full bg-muted-area border border-border-theme rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                      >
                        <option value="true">सक्रिय</option>
                        <option value="false">निस्क्रिय</option>
                      </select>
                    </div>
                  </div>

                  <button className="w-full bg-primary text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    {editingAgent ? 'पिरिवर्तन सुरक्षित गर्नुहोस्' : 'एजेन्ट थप्नुहोस्'} <CheckCircle size={20} />
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
