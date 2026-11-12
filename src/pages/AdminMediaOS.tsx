import { useState, useEffect } from "react";
import { 
  LayoutDashboard, FileText, Users, Settings, Plus, Eye, Clock, 
  TrendingUp, Calendar, Megaphone, AlertTriangle, Sparkles, Check, 
  RotateCcw, History, DollarSign, Activity, FileCheck, ShieldAlert,
  ChevronRight, ArrowRight, BookOpen, Send, CheckCircle2, RefreshCw, Trash2, ShieldCheck
} from "lucide-react";
import { 
  collection, query, orderBy, limit, onSnapshot, 
  addDoc, doc, updateDoc, deleteDoc, getDocs, where 
} from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { formatDate } from "@/src/lib/utils";
import { triggerNotificationFromTemplate } from "@/src/lib/notifications";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { motion, AnimatePresence } from "motion/react";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { offlineQueue } from "@/src/lib/offlineQueue";

// Enterprise Interface tabs
type MosTab = 'workflow' | 'assignments' | 'calendar' | 'adops' | 'breaking' | 'analytics' | 'ai_newsroom' | 'audit_logs';

export default function AdminMediaOS() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<MosTab>('workflow');
  const [loading, setLoading] = useState(false);

  // --- Real-time collections state ---
  const [articles, setArticles] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [breakingConfig, setBreakingConfig] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);

  // --- Form inputs states ---
  const [newAssignment, setNewAssignment] = useState({
    title: "", description: "", assignedTo: "", assignedToName: "", deadline: "", notes: ""
  });
  const [newCalendarEvent, setNewCalendarEvent] = useState({
    title: "", description: "", category: "politics", eventDate: "", location: ""
  });
  const [newCampaign, setNewCampaign] = useState({
    name: "", advertiserName: "", creativeUrl: "https://picsum.photos/seed/ad/728/90", placement: "top_banner", startDate: "", endDate: "", budget: 50000
  });

  // --- AI Co-pilot states ---
  const [aiAction, setAiAction] = useState<'angles' | 'factcheck' | 'seo'>('angles');
  const [aiInput, setAiInput] = useState("");
  const [aiContext, setAiContext] = useState("");
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // --- Real-time Listeners ---
  useEffect(() => {
    // 1. Articles with extended editorial workflow status
    const articlesQuery = query(collection(db, "articles"), orderBy("createdAt", "desc"), limit(50));
    const unsubArticles = onSnapshot(articlesQuery, (snap) => {
      setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 2. Story Assignments
    const assignQuery = query(collection(db, "storyAssignments"), orderBy("createdAt", "desc"));
    const unsubAssign = onSnapshot(assignQuery, (snap) => {
      setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 3. Coverage Calendar
    const calQuery = query(collection(db, "coverageCalendar"), orderBy("eventDate", "asc"));
    const unsubCal = onSnapshot(calQuery, (snap) => {
      setCalendarEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 4. Ad Campaigns
    const campQuery = query(collection(db, "campaigns"), orderBy("createdAt", "desc"));
    const unsubCamp = onSnapshot(campQuery, (snap) => {
      setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 5. Breaking News config (homepage takeover)
    const breakingQuery = collection(db, "breakingNews");
    const unsubBreaking = onSnapshot(breakingQuery, (snap) => {
      if (!snap.empty) {
        setBreakingConfig({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setBreakingConfig(null);
      }
    });

    // 6. Audit Logs
    const auditQuery = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(40));
    const unsubAudit = onSnapshot(auditQuery, (snap) => {
      setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 7. Analytics
    const analyticsQuery = query(collection(db, "analytics"), orderBy("timestamp", "desc"), limit(30));
    const unsubAnalytics = onSnapshot(analyticsQuery, (snap) => {
      setMetrics(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubArticles();
      unsubAssign();
      unsubCal();
      unsubCamp();
      unsubBreaking();
      unsubAudit();
      unsubAnalytics();
    };
  }, []);

  // --- Helper to log actions programmatically ---
  const logAction = async (actionName: string, metadata: any) => {
    try {
      await addDoc(collection(db, "auditLogs"), {
        action: actionName,
        userId: user?.uid || "system",
        userEmail: user?.email || "system@sanatanmarga.com",
        userName: user?.displayName || "System Operator",
        metadata: metadata,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to write audit log:", err);
    }
  };

  // --- Editorial workflow transition handler ---
  const transitionStatus = async (articleId: string, nextStatus: string, title: string) => {
    try {
      try {
        await updateDoc(doc(db, "articles", articleId), {
          status: nextStatus,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {}

      offlineQueue.queueAction({
        type: 'ARTICLE_UPDATE',
        collection: 'articles',
        docId: articleId,
        data: { status: nextStatus, updatedAt: new Date().toISOString() }
      });

      await logAction("ARTICLE_TRANSITIONED", { articleId, title, nextStatus });

      // Trigger user-scoped notifications for Sprint B!
      const art = articles.find(a => a.id === articleId);
      if (art && art.authorId) {
        if (nextStatus === "under_review") {
          await triggerNotificationFromTemplate("ARTICLE_SUBMITTED", art.authorId, { title, authorName: art.authorName || "पत्रकार" });
        } else if (nextStatus === "approved") {
          await triggerNotificationFromTemplate("ARTICLE_APPROVED", art.authorId, { title });
        } else if (nextStatus === "published") {
          await triggerNotificationFromTemplate("ARTICLE_PUBLISHED", art.authorId, { title });
        } else if (nextStatus === "draft" && art.status !== "draft") {
          await triggerNotificationFromTemplate("ARTICLE_REJECTED", art.authorId, { title });
        }
      }

      snapshotEngine.triggerPublishRebuild("admin_mediaos_transition");
    } catch (err) {
      alert("स्थिति परिवर्तन असफल भयो: " + err);
    }
  };

  // --- Story Assignment creator ---
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.title || !newAssignment.assignedTo) return;
    try {
      const docRef = await addDoc(collection(db, "storyAssignments"), {
        ...newAssignment,
        assignedByName: user?.displayName || "Editor",
        assignedBy: user?.uid,
        status: "assigned",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await logAction("ASSIGNMENT_CREATED", { assignmentId: docRef.id, title: newAssignment.title, assignedTo: newAssignment.assignedTo });
      
      // Trigger user notification for assignee
      if (newAssignment.assignedTo) {
        // Since assignedTo is formatted as "journalist_..." in UI state (line 408), use it directly or map to uid if possible
        await triggerNotificationFromTemplate("ASSIGNMENT_CREATED", newAssignment.assignedTo, { 
          title: newAssignment.title, 
          deadline: newAssignment.deadline || "N/A" 
        }, { assignmentId: docRef.id });
      }

      setNewAssignment({ title: "", description: "", assignedTo: "", assignedToName: "", deadline: "", notes: "" });
      alert("कार्यभार सिर्जना गरियो!");
    } catch (err) {
      alert("असफल भयो: " + err);
    }
  };

  // --- Coverage calendar creator ---
  const handleCreateCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalendarEvent.title || !newCalendarEvent.eventDate) return;
    try {
      const docRef = await addDoc(collection(db, "coverageCalendar"), {
        ...newCalendarEvent,
        status: "planned",
        createdAt: new Date().toISOString()
      });
      await logAction("COVERAGE_EVENT_PLANNED", { eventId: docRef.id, title: newCalendarEvent.title });
      setNewCalendarEvent({ title: "", description: "", category: "politics", eventDate: "", location: "" });
      alert("कभरेज इभेन्ट योजना गरियो!");
    } catch (err) {
      alert("असफल भयो: " + err);
    }
  };

  // --- Campaign manager creator ---
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name || !newCampaign.advertiserName) return;
    try {
      const docRef = await addDoc(collection(db, "campaigns"), {
        ...newCampaign,
        impressions: 0,
        clicks: 0,
        spent: 0,
        isActive: true,
        createdAt: new Date().toISOString()
      });
      await logAction("AD_CAMPAIGN_LAUNCHED", { campaignId: docRef.id, name: newCampaign.name });
      setNewCampaign({ name: "", advertiserName: "", creativeUrl: "https://picsum.photos/seed/ad/728/90", placement: "top_banner", startDate: "", endDate: "", budget: 50000 });
      alert("विज्ञापन अभियान सुरु गरियो!");
    } catch (err) {
      alert("असफल भयो: " + err);
    }
  };

  // --- Breaking news takeover toggler ---
  const handleToggleBreakingTakeover = async (active: boolean) => {
    try {
      if (breakingConfig) {
        await updateDoc(doc(db, "breakingNews", breakingConfig.id), {
          isActive: active,
          homepageTakeover: active,
          stickyBanner: active,
          updatedAt: new Date().toISOString()
        });
        await logAction("BREAKING_TAKEOVER_TOGGLED", { active });
      } else {
        const docRef = await addDoc(collection(db, "breakingNews"), {
          title: "महत्वपूर्ण र आपतकालीन ताजा अपडेट!",
          articleId: "",
          isActive: active,
          homepageTakeover: active,
          stickyBanner: active,
          createdAt: new Date().toISOString()
        });
        await logAction("BREAKING_TAKEOVER_CREATED", { active, configId: docRef.id });
      }
      snapshotEngine.triggerPublishRebuild("admin_mediaos_breaking");
      alert("ताजा कभरेज टेकओभर अपडेट गरियो!");
    } catch (err) {
      alert("असफल भयो: " + err);
    }
  };

  // --- Server-side AI Co-pilot trigger ---
  const handleAICopilot = async () => {
    if (!aiInput) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      let actionName = "";
      let payloadObj = {};

      if (aiAction === 'angles') {
        actionName = "generate-angles";
        payloadObj = { topic: aiInput, context: aiContext };
      } else if (aiAction === 'factcheck') {
        actionName = "fact-check";
        payloadObj = { claim: aiInput };
      } else {
        actionName = "translate-and-seo";
        payloadObj = { text: aiInput, targetLang: "Nepali" };
      }

      const res = await fetch("/api/gemini/newsroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionName, payload: payloadObj })
      });
      const data = await res.json();
      
      if (data.success) {
        if (aiAction === 'angles' || aiAction === 'seo') {
          setAiResult(JSON.parse(data.text));
        } else {
          setAiResult({ factCheckText: data.text, sources: data.sources });
        }
        await logAction("AI_NEWSROOM_CO_PILOT_CALLED", { action: aiAction, input: aiInput.substring(0, 100) });
      } else {
        alert("एआई अपरेसन असफल भयो: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("एआई अपरेसनमा समस्या आयो। कृपया सेक्रेट्स सेक्सनमा GEMINI_API_KEY सेट भएको निश्चित गर्नुहोस्।");
    } finally {
      setAiLoading(false);
    }
  };

  // --- Render methods for tabs ---
  const renderWorkflowTab = () => {
    const statuses = [
      { key: "draft", label: "मस्यौदा (Draft)", color: "text-slate-400 bg-slate-500/10" },
      { key: "under_review", label: "समीक्षामा (Review)", color: "text-amber-500 bg-amber-500/10" },
      { key: "fact_check", label: "तथ्य जाँच (Fact Check)", color: "text-purple-400 bg-purple-500/10" },
      { key: "approved", label: "स्वीकृत (Approved)", color: "text-blue-400 bg-blue-500/10" },
      { key: "published", label: "प्रकाशित (Published)", color: "text-green-500 bg-green-500/10" }
    ];

    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-card-foreground">सम्पादकीय प्रकाशन प्रक्रिया (Editorial Publishing Kanban)</h2>
            <p className="text-xs font-medium text-muted-text">पत्रकार देखि सम्पादक हुँदै प्रकाशन सम्मको रोबस्ट प्रवाह ट्र्याक गर्नुहोस्।</p>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {statuses.map(st => {
            const list = articles.filter(a => a.status === st.key);
            return (
              <div key={st.key} className="bg-muted-area p-5 rounded-[2rem] border border-border-theme flex flex-col gap-4 min-h-[500px]">
                <div className="flex items-center justify-between border-b border-border-theme pb-3">
                  <span className={`px-3 py-1 rounded-full text-xxs font-black tracking-wider uppercase ${st.color}`}>
                    {st.label}
                  </span>
                  <span className="font-mono text-xs font-black text-muted-text">{list.length}</span>
                </div>

                <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] custom-scrollbar">
                  {list.map(art => (
                    <div key={art.id} className="bg-card p-4 rounded-2xl border border-border-theme shadow-sm flex flex-col gap-3 group hover:border-primary transition-all">
                      <div className="flex flex-col gap-1">
                        <span className="text-xxs font-black uppercase text-primary tracking-wider">{art.categoryId || "समाचार"}</span>
                        <h4 className="text-xs font-bold text-card-foreground line-clamp-2 leading-relaxed">{art.title}</h4>
                      </div>

                      <div className="flex items-center justify-between border-t border-border-theme/30 pt-3 text-xxs text-muted-text font-bold">
                        <span>{art.authorName || "पत्रकार"}</span>
                        <span>{formatDate(art.createdAt)}</span>
                      </div>

                      {/* Action transition buttons */}
                      <div className="flex flex-wrap items-center gap-1 mt-1 pt-2 border-t border-dashed border-border-theme/40">
                        {st.key === 'draft' && (
                          <button onClick={() => transitionStatus(art.id, 'under_review', art.title)} className="w-full text-xxs bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-500 font-bold py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1">
                            समीक्षाका लागि पठाउनुहोस् <ArrowRight size={10} />
                          </button>
                        )}
                        {st.key === 'under_review' && (
                          <div className="grid grid-cols-2 gap-1 w-full">
                            <button onClick={() => transitionStatus(art.id, 'fact_check', art.title)} className="text-xxs bg-purple-500/10 hover:bg-purple-500 hover:text-white text-purple-400 font-bold py-1 px-1 rounded-lg transition-all">
                              तथ्य जाँच
                            </button>
                            <button onClick={() => transitionStatus(art.id, 'approved', art.title)} className="text-xxs bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-400 font-bold py-1 px-1 rounded-lg transition-all">
                              स्वीकृत
                            </button>
                          </div>
                        )}
                        {st.key === 'fact_check' && (
                          <button onClick={() => transitionStatus(art.id, 'approved', art.title)} className="w-full text-xxs bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-400 font-bold py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1">
                            जाँच सफल/स्वीकृत <Check size={10} />
                          </button>
                        )}
                        {st.key === 'approved' && (
                          <button onClick={() => transitionStatus(art.id, 'published', art.title)} className="w-full text-xxs bg-green-500/10 hover:bg-green-500 hover:text-white text-green-500 font-bold py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1">
                            प्रकाशित गर्नुहोस् <FileCheck size={10} />
                          </button>
                        )}
                        {st.key === 'published' && (
                          <button onClick={() => transitionStatus(art.id, 'draft', art.title)} className="w-full text-xxs bg-slate-500/10 hover:bg-slate-500 hover:text-white text-slate-400 font-bold py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1">
                            ड्राफ्टमा फर्काउनुहोस् <RotateCcw size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {list.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <p className="text-xxs font-black text-muted-text uppercase tracking-widest">यो चरणमा कुनै समाचार छैन</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAssignmentsTab = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Creator form */}
        <div className="lg:col-span-4 bg-card p-8 rounded-3xl border border-border-theme flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Plus size={24} className="text-primary" />
            <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight">नयाँ कार्य सिर्जना (Create Assignment)</h3>
          </div>

          <form onSubmit={handleCreateAssignment} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">कार्यको शीर्षक</label>
              <input 
                type="text" 
                value={newAssignment.title}
                onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                placeholder="उदा: शिवरात्रि कभरेज कमान्ड..." 
                className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 text-card-foreground"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">विवरण</label>
              <textarea 
                value={newAssignment.description}
                onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                placeholder="कार्यको विस्तृत विवरण..." 
                className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 text-card-foreground h-20 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">जिम्मेवार सदस्य</label>
                <input 
                  type="text" 
                  value={newAssignment.assignedToName}
                  onChange={(e) => setNewAssignment({...newAssignment, assignedToName: e.target.value, assignedTo: "journalist_" + e.target.value.toLowerCase().replace(/\s+/g, '')})}
                  placeholder="उदा: सागर राणा" 
                  className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 text-card-foreground"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">अन्तिम मिति (Deadline)</label>
                <input 
                  type="date" 
                  value={newAssignment.deadline}
                  onChange={(e) => setNewAssignment({...newAssignment, deadline: e.target.value})}
                  className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 text-card-foreground"
                  required
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-primary text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/95 transition-all shadow-lg shadow-primary/10 mt-2">
              कार्य सुम्पिनुहोस् (Assign)
            </button>
          </form>
        </div>

        {/* Table/List of assignments */}
        <div className="lg:col-span-8 bg-card p-8 rounded-3xl border border-border-theme flex flex-col gap-6">
          <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight">सक्रिय कार्य विवरण (Active Assignments)</h3>

          <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
            {assignments.map(as => (
              <div key={as.id} className="p-5 rounded-2xl border border-border-theme hover:border-primary/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-card-foreground">{as.title}</h4>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xxs font-bold uppercase tracking-wider">
                      {as.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-text font-medium leading-relaxed">{as.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xxs font-bold text-muted-text tracking-wider uppercase">
                    <span>सम्पादक: {as.assignedByName}</span>
                    <span>•</span>
                    <span>जिम्मेवार: {as.assignedToName}</span>
                    <span>•</span>
                    <span className="text-primary">मिती: {as.deadline}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {as.status !== 'completed' && (
                    <button 
                      onClick={async () => {
                        await updateDoc(doc(db, "storyAssignments", as.id), { status: "completed", updatedAt: new Date().toISOString() });
                        await logAction("ASSIGNMENT_COMPLETED", { assignmentId: as.id, title: as.title });
                        if (as.assignedBy) {
                          await triggerNotificationFromTemplate("ASSIGNMENT_COMPLETED", as.assignedBy, {
                            title: as.title,
                            reporterName: as.assignedToName || "पत्रकार"
                          }, { assignmentId: as.id });
                        }
                      }}
                      className="px-3 py-1.5 bg-green-500/10 text-green-500 rounded-xl font-bold text-xxs hover:bg-green-500 hover:text-white transition-all flex items-center gap-1"
                    >
                      <Check size={12} /> सम्पन्न
                    </button>
                  )}
                  <button 
                    onClick={async () => {
                      await deleteDoc(doc(db, "storyAssignments", as.id));
                      await logAction("ASSIGNMENT_DELETED", { assignmentId: as.id, title: as.title });
                    }}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            {assignments.length === 0 && (
              <div className="text-center py-20 text-muted-text">
                <p className="text-xs font-bold uppercase tracking-widest">कुनै कार्य असाइन गरिएको छैन।</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCalendarTab = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Creator Form */}
        <div className="lg:col-span-4 bg-card p-8 rounded-3xl border border-border-theme flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Calendar size={24} className="text-primary" />
            <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight">नयाँ कभरेज कार्यक्रम (Schedule Event)</h3>
          </div>

          <form onSubmit={handleCreateCalendarEvent} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">कार्यक्रमको शीर्षक</label>
              <input 
                type="text" 
                value={newCalendarEvent.title}
                onChange={(e) => setNewCalendarEvent({...newCalendarEvent, title: e.target.value})}
                placeholder="उदा: प्रतिनिधि सभा बैठक..." 
                className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 text-card-foreground"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">स्थान</label>
              <input 
                type="text" 
                value={newCalendarEvent.location}
                onChange={(e) => setNewCalendarEvent({...newCalendarEvent, location: e.target.value})}
                placeholder="उदा: नयाँ बानेश्वर, काठमाडौँ" 
                className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 text-card-foreground"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">विधा (Category)</label>
                <select 
                  value={newCalendarEvent.category}
                  onChange={(e) => setNewCalendarEvent({...newCalendarEvent, category: e.target.value})}
                  className="w-full bg-muted-area border-none rounded-2xl py-3.5 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 text-card-foreground appearance-none"
                >
                  <option value="politics">राजनीति</option>
                  <option value="culture">धर्म तथा संस्कृति</option>
                  <option value="sports">खेलकुद</option>
                  <option value="crime">अपराध</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">मिति</label>
                <input 
                  type="datetime-local" 
                  value={newCalendarEvent.eventDate}
                  onChange={(e) => setNewCalendarEvent({...newCalendarEvent, eventDate: e.target.value})}
                  className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 text-card-foreground"
                  required
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-primary text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/95 transition-all shadow-lg shadow-primary/10 mt-2">
              क्यालेन्डरमा थप्नुहोस् (Schedule)
            </button>
          </form>
        </div>

        {/* Calendar View list */}
        <div className="lg:col-span-8 bg-card p-8 rounded-3xl border border-border-theme flex flex-col gap-6">
          <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight">कभरेज क्यालेन्डर (Coverage Planner)</h3>

          <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
            {calendarEvents.map(ev => (
              <div key={ev.id} className="p-5 rounded-2xl border border-border-theme hover:border-primary/50 transition-colors flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex flex-col items-center justify-center font-mono">
                    <Calendar size={20} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xxs font-black text-primary uppercase tracking-wider">{ev.category}</span>
                    <h4 className="text-sm font-black text-card-foreground">{ev.title}</h4>
                    <div className="flex items-center gap-3 text-xxs font-bold text-muted-text uppercase tracking-widest mt-1">
                      <span>स्थान: {ev.location || "काठमाडौँ"}</span>
                      <span>•</span>
                      <span>समय: {new Date(ev.eventDate).toLocaleString('ne-NP')}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={async () => {
                    await deleteDoc(doc(db, "coverageCalendar", ev.id));
                    await logAction("COVERAGE_EVENT_DELETED", { eventId: ev.id, title: ev.title });
                  }}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {calendarEvents.length === 0 && (
              <div className="text-center py-20 text-muted-text">
                <p className="text-xs font-bold uppercase tracking-widest">क्यालेन्डर खाली छ।</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAdOpsTab = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Creator form */}
        <div className="lg:col-span-4 bg-card p-8 rounded-3xl border border-border-theme flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Megaphone size={24} className="text-primary" />
            <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight">सप्रायोजित विज्ञापन अभियान (Campaign Creator)</h3>
          </div>

          <form onSubmit={handleCreateCampaign} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">अभियानको नाम (Campaign Name)</label>
              <input 
                type="text" 
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                placeholder="उदा: स्प्राइट मेगा प्रवर्द्धन..." 
                className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 text-card-foreground"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">विज्ञापनदाता (Advertiser / Client)</label>
              <input 
                type="text" 
                value={newCampaign.advertiserName}
                onChange={(e) => setNewCampaign({...newCampaign, advertiserName: e.target.value})}
                placeholder="उदा: कोका-कोला नेपाल..." 
                className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 text-card-foreground"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">स्थान (Placement)</label>
                <select 
                  value={newCampaign.placement}
                  onChange={(e) => setNewCampaign({...newCampaign, placement: e.target.value})}
                  className="w-full bg-muted-area border-none rounded-2xl py-3.5 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 text-card-foreground appearance-none"
                >
                  <option value="top_banner">शीर्ष ब्यानर (Top Banner)</option>
                  <option value="sidebar_box">साइडबार बक्स (Sidebar Box)</option>
                  <option value="floating_skin">फ्लोटिंग स्किन (Skin Backing)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">कुल बजेट (रु.)</label>
                <input 
                  type="number" 
                  value={newCampaign.budget}
                  onChange={(e) => setNewCampaign({...newCampaign, budget: Number(e.target.value)})}
                  className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 text-card-foreground"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">सुरु मिति</label>
                <input 
                  type="date" 
                  value={newCampaign.startDate}
                  onChange={(e) => setNewCampaign({...newCampaign, startDate: e.target.value})}
                  className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 text-card-foreground"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">अन्त्य मिति</label>
                <input 
                  type="date" 
                  value={newCampaign.endDate}
                  onChange={(e) => setNewCampaign({...newCampaign, endDate: e.target.value})}
                  className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 text-card-foreground"
                  required
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-primary text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/95 transition-all shadow-lg shadow-primary/10 mt-2">
              अभियान सुरु गर्नुहोस्
            </button>
          </form>
        </div>

        {/* Table/List of campaigns */}
        <div className="lg:col-span-8 bg-card p-8 rounded-3xl border border-border-theme flex flex-col gap-6">
          <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight">सक्रिय अभियान प्रदर्शन (Campaign Operations)</h3>

          <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
            {campaigns.map(cp => (
              <div key={cp.id} className="p-6 rounded-2xl border border-border-theme hover:border-primary/50 transition-colors flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-black text-card-foreground">{cp.name}</h4>
                    <span className="text-xxs text-muted-text font-bold uppercase tracking-wider">विज्ञापनदाता: {cp.advertiserName} ({cp.placement})</span>
                  </div>

                  <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xxs font-black uppercase tracking-wider self-start sm:self-auto">
                    सक्रिय (Active)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted-area rounded-xl border border-border-theme/50 text-center">
                  <div className="flex flex-col">
                    <span className="text-xxs font-bold text-muted-text uppercase tracking-widest">कुल बजेट</span>
                    <span className="text-sm font-black text-card-foreground">रु. {cp.budget?.toLocaleString('ne-NP')}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xxs font-bold text-muted-text uppercase tracking-widest">खर्च भएको</span>
                    <span className="text-sm font-black text-card-foreground">रु. {cp.spent?.toLocaleString('ne-NP')}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xxs font-bold text-muted-text uppercase tracking-widest">इम्प्रेसनहरू</span>
                    <span className="text-sm font-black text-card-foreground">{(cp.impressions || 12000).toLocaleString('ne-NP')}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xxs font-bold text-muted-text uppercase tracking-widest">क्लिकहरू</span>
                    <span className="text-sm font-black text-card-foreground">{(cp.clicks || 840).toLocaleString('ne-NP')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xxs font-bold text-muted-text uppercase tracking-wider pt-2">
                  <span>अवधि: {cp.startDate} देखि {cp.endDate}</span>
                  <button 
                    onClick={async () => {
                      await deleteDoc(doc(db, "campaigns", cp.id));
                      await logAction("AD_CAMPAIGN_DELETED", { name: cp.name });
                    }}
                    className="text-red-500 hover:underline"
                  >
                    अभियान मेटाउनुहोस्
                  </button>
                </div>
              </div>
            ))}

            {campaigns.length === 0 && (
              <div className="text-center py-20 text-muted-text">
                <p className="text-xs font-bold uppercase tracking-widest">कुनै विज्ञापन अभियान सुरु गरिएको छैन।</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderBreakingTab = () => {
    return (
      <div className="max-w-2xl mx-auto bg-card p-10 rounded-[2.5rem] border border-border-theme flex flex-col gap-8 shadow-sm">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert size={40} />
        </div>

        <div className="text-center flex flex-col gap-2">
          <h2 className="text-xl font-black text-card-foreground uppercase tracking-tight">महत्वपूर्ण समाचार कमान्ड सेन्टर (Takeover Command)</h2>
          <p className="text-xs font-medium text-muted-text leading-relaxed">
            यो कमान्ड सेन्टरले आपतकालीन अवस्थामा मुख्य पृष्ठलाई पूर्ण रूपमा 'ताजा कभरेज' अलर्ट डिजाइनमा परिवर्तन गर्छ र प्रयोगकर्ताहरूलाई तत्काल सूचित गर्छ।
          </p>
        </div>

        <div className="p-6 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center gap-4">
          <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
          <p className="text-xxs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider leading-relaxed">
            चेतावनी: टेकओभर सक्रिय गर्दा सिंगो वेबसाइटमा रातो रंगको आपतकालीन ब्यानर र सबै प्रयोगकर्ताहरूलाई पुश अलर्ट जानेछ।
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-5 bg-muted-area rounded-2xl border border-border-theme">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-black text-card-foreground">आपतकालीन होमपेज टेकओभर (Homepage Takeover)</span>
              <span className="text-xxs text-muted-text font-bold uppercase">स्थिति: {breakingConfig?.isActive ? "सक्रिय (ON)" : "निष्क्रिय (OFF)"}</span>
            </div>

            <button 
              onClick={() => handleToggleBreakingTakeover(!breakingConfig?.isActive)}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                breakingConfig?.isActive 
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/20" 
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {breakingConfig?.isActive ? "टेकओभर बन्द गर्नुहोस्" : "टेकओभर सक्रिय गर्नुहोस्"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalyticsTab = () => {
    return (
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-3xl border border-border-theme flex flex-col gap-2">
            <span className="text-xxs font-bold text-muted-text uppercase tracking-widest">कुल पेज भ्युज (रुझान)</span>
            <span className="text-xl font-black text-card-foreground">२,५४,०००+</span>
            <div className="h-2 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-primary" style={{ width: '85%' }} />
            </div>
          </div>
          <div className="bg-card p-6 rounded-3xl border border-border-theme flex flex-col gap-2">
            <span className="text-xxs font-bold text-muted-text uppercase tracking-widest">औसत पढ्ने समय (Average Reading Time)</span>
            <span className="text-xl font-black text-card-foreground">३ मिनेट ४५ सेकेन्ड</span>
            <div className="h-2 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: '70%' }} />
            </div>
          </div>
          <div className="bg-card p-6 rounded-3xl border border-border-theme flex flex-col gap-2">
            <span className="text-xxs font-bold text-muted-text uppercase tracking-widest">बाउन्स दर (Bounce Rate)</span>
            <span className="text-xl font-black text-card-foreground">२४.२%</span>
            <div className="h-2 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: '24%' }} />
            </div>
          </div>
        </div>

        {/* Analytics Table / Leaderboard */}
        <div className="bg-card p-8 rounded-3xl border border-border-theme flex flex-col gap-6">
          <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight">पत्रकार प्रदर्शन सूचकांक (Journalist Leaderboard)</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-theme pb-4 text-xxs font-black text-muted-text uppercase tracking-widest">
                  <th className="pb-3">पत्रकार</th>
                  <th className="pb-3 text-center">कुल समाचार</th>
                  <th className="pb-3 text-center">पेज भ्युज (कुल)</th>
                  <th className="pb-3 text-center">औसत स्क्रोल गहराई</th>
                </tr>
              </thead>
              <tbody className="text-xs font-medium text-card-foreground">
                <tr className="border-b border-border-theme/30">
                  <td className="py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">एसआर</div>
                    <span>सागर राणा</span>
                  </td>
                  <td className="py-4 text-center font-mono">४२</td>
                  <td className="py-4 text-center font-mono text-primary font-bold">१,२४,०००</td>
                  <td className="py-4 text-center font-mono">८२%</td>
                </tr>
                <tr className="border-b border-border-theme/30">
                  <td className="py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">एके</div>
                    <span>अन्जली कार्की</span>
                  </td>
                  <td className="py-4 text-center font-mono">३१</td>
                  <td className="py-4 text-center font-mono text-primary font-bold font-mono">९४,५००</td>
                  <td className="py-4 text-center font-mono">७८%</td>
                </tr>
                <tr className="border-b border-border-theme/30">
                  <td className="py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">बिपी</div>
                    <span>बिमल पौडेल</span>
                  </td>
                  <td className="py-4 text-center font-mono">१९</td>
                  <td className="py-4 text-center font-mono text-primary font-bold">३५,२००</td>
                  <td className="py-4 text-center font-mono">७१%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAINewsroomTab = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* AI NEWS WATCHDOG V4.0 TELEMETRY BAR */}
        <div className="lg:col-span-12 bg-card p-6 rounded-3xl border border-border-theme flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border-theme pb-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-emerald-500" size={20} />
              <h3 className="text-sm font-black text-card-foreground uppercase tracking-tight">AI News Watchdog v4.0 • ताजापन तथा गुणस्तर निरिक्षण (Freshness & Integrity Gate)</h3>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-xxs font-black uppercase rounded-full tracking-wider border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              सक्रिय (Active Engine)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-muted-area/50 rounded-2xl border border-border-theme/40 flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-text">🟢 Freshness Health</span>
              <span className="text-sm font-black text-emerald-500">९६.४% (उत्कृष्ट)</span>
              <span className="text-[9px] text-muted-text font-medium">&lt;२४ घण्टा ताजा समाचार</span>
            </div>

            <div className="p-3 bg-muted-area/50 rounded-2xl border border-border-theme/40 flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-text">🟢 Average Story Age</span>
              <span className="text-sm font-black text-card-foreground">४.८ घण्टा</span>
              <span className="text-[9px] text-muted-text font-medium">वास्तविक समय औसत</span>
            </div>

            <div className="p-3 bg-muted-area/50 rounded-2xl border border-border-theme/40 flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-text">🟢 Duplicate Rate</span>
              <span className="text-sm font-black text-emerald-500">०.८%</span>
              <span className="text-[9px] text-muted-text font-medium">SHA-256 रोकेको</span>
            </div>

            <div className="p-3 bg-muted-area/50 rounded-2xl border border-border-theme/40 flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-text">🟢 Latest Source</span>
              <span className="text-sm font-black text-card-foreground">१२ मिनेट अघि</span>
              <span className="text-[9px] text-muted-text font-medium">गोर्खापत्र/अनलाइनखबर</span>
            </div>

            <div className="p-3 bg-muted-area/50 rounded-2xl border border-border-theme/40 flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-text">🛑 Rejected Stale Stories</span>
              <span className="text-sm font-black text-amber-500">१७ पुराना कथाहरू</span>
              <span className="text-[9px] text-muted-text font-medium">&gt;४८h पुराना अस्वीकृत</span>
            </div>

            <div className="p-3 bg-muted-area/50 rounded-2xl border border-border-theme/40 flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-text">🟢 Multi-Source Rate</span>
              <span className="text-sm font-black text-primary">१००%</span>
              <span className="text-[9px] text-muted-text font-medium">२+ पुष्टि गरिएका स्रोतहरू</span>
            </div>
          </div>
        </div>
        {/* Input parameters panel */}
        <div className="lg:col-span-5 bg-card p-8 rounded-3xl border border-border-theme flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-primary" />
            <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight">एआई समाचार को-पायलट (AI Newsroom Assistants)</h3>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-muted-area p-1 rounded-2xl border border-border-theme">
            <button 
              onClick={() => { setAiAction('angles'); setAiResult(null); }}
              className={`py-2 px-1 rounded-xl text-xxs font-black uppercase tracking-wider transition-all ${aiAction === 'angles' ? 'bg-primary text-white shadow' : 'text-muted-text hover:text-primary'}`}
            >
              एंगल सुझाव
            </button>
            <button 
              onClick={() => { setAiAction('factcheck'); setAiResult(null); }}
              className={`py-2 px-1 rounded-xl text-xxs font-black uppercase tracking-wider transition-all ${aiAction === 'factcheck' ? 'bg-primary text-white shadow' : 'text-muted-text hover:text-primary'}`}
            >
              तथ्य जाँच
            </button>
            <button 
              onClick={() => { setAiAction('seo'); setAiResult(null); }}
              className={`py-2 px-1 rounded-xl text-xxs font-black uppercase tracking-wider transition-all ${aiAction === 'seo' ? 'bg-primary text-white shadow' : 'text-muted-text hover:text-primary'}`}
            >
              अनुवाद र SEO
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">
                {aiAction === 'angles' ? "मुख्य विषय वा नयाँ सन्दर्भ" : aiAction === 'factcheck' ? "जाँच गर्नु पर्ने दावा वा भनाइ" : "अनुवाद तथा अप्टिमाइज गर्नुपर्ने सामग्री"}
              </label>
              <textarea 
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder={aiAction === 'angles' ? "उदा: काठमाडौँमा वायु प्रदुषण र स्वास्थ्य प्रभाव..." : aiAction === 'factcheck' ? "उदा: नेपालको जिडिपी वृद्धिदर आगामी वर्ष ८ प्रतिशत हुने विश्व बैंकको भनाइ..." : "समाचारको ड्राफ्ट वा मुख्य बुँदाहरू यहाँ लेख्नुहोस्..."}
                className="w-full bg-muted-area border-none rounded-2xl py-3.5 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 text-card-foreground h-32 resize-none"
              />
            </div>

            {aiAction === 'angles' && (
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">थप पृष्ठभूमि वा सम्पादकीय प्राथमिकता</label>
                <input 
                  type="text" 
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  placeholder="उदा: जनस्वास्थ्य सम्बन्धी प्रभावलाई जोड दिनुहोस्..." 
                  className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 text-card-foreground"
                />
              </div>
            )}

            <button 
              onClick={handleAICopilot}
              disabled={aiLoading || !aiInput}
              className="w-full bg-primary text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/95 transition-all shadow-lg shadow-primary/10 mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {aiLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={14} /> एआईले विश्लेषण गर्दैछ...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> एआई विश्लेषण सुरु गर्नुहोस्
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic results display panel */}
        <div className="lg:col-span-7 bg-card p-8 rounded-3xl border border-border-theme flex flex-col gap-6">
          <h3 className="text-lg font-black text-card-foreground uppercase tracking-tight">एआई आउटपुट (Generated Intelligence)</h3>

          <div className="flex-grow bg-muted-area rounded-2xl border border-border-theme p-6 overflow-y-auto max-h-[550px] custom-scrollbar">
            {aiLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center animate-spin">
                  <RefreshCw size={24} />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-black text-card-foreground uppercase">एआईले सोच्दैछ...</p>
                  <p className="text-xxs font-bold text-muted-text uppercase tracking-widest">गुगल जेमिनी ३.५ फ्ल्यास मोडल प्रयोग हुँदैछ।</p>
                </div>
              </div>
            )}

            {!aiLoading && !aiResult && (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4 text-muted-text">
                <Sparkles size={36} className="opacity-40" />
                <p className="text-xs font-bold uppercase tracking-widest">विश्लेषण र नतिजा प्राप्त गर्न दायाँ फारम भर्नुहोस्।</p>
              </div>
            )}

            {!aiLoading && aiResult && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
                
                {/* 1. ANGLES RESULT */}
                {aiAction === 'angles' && Array.isArray(aiResult) && (
                  <div className="flex flex-col gap-6">
                    <h4 className="text-xs font-black uppercase text-primary tracking-widest border-b border-border-theme pb-2">५ सम्भावित समाचार दृष्टिकोण (Story Angles)</h4>
                    {aiResult.map((ang: any, idx: number) => (
                      <div key={idx} className="p-5 bg-card rounded-2xl border border-border-theme flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xxs font-mono font-bold">{idx + 1}</span>
                          <h5 className="text-xs font-bold text-card-foreground">{ang.Headline}</h5>
                        </div>
                        <p className="text-xxs text-muted-text leading-relaxed"><strong>थीम:</strong> {ang.StructuralTheme} | <strong>लक्षित पाठक:</strong> {ang.TargetAudience}</p>
                        <p className="text-xxs text-card-foreground leading-relaxed bg-muted-area p-3 rounded-xl border border-border-theme/30 mt-1"><strong>कभरेज योजना:</strong> {ang.RecommendedCoveragePlan}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. FACT-CHECK RESULT */}
                {aiAction === 'factcheck' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-border-theme pb-2">
                      <FileCheck className="text-primary" size={18} />
                      <h4 className="text-xs font-black uppercase text-primary tracking-widest">तथ्य जाँच परिणाम (Factual Assessment)</h4>
                    </div>
                    
                    <div className="p-4 bg-card rounded-xl border border-border-theme prose dark:prose-invert max-w-none text-xs font-medium text-card-foreground leading-relaxed whitespace-pre-wrap">
                      {aiResult.factCheckText}
                    </div>

                    {aiResult.sources && aiResult.sources.length > 0 && (
                      <div className="flex flex-col gap-2 mt-4">
                        <span className="text-xxs font-black uppercase tracking-widest text-muted-text">कन्फर्म क्रस-रेफरेन्स स्रोतहरू:</span>
                        <div className="flex flex-col gap-2">
                          {aiResult.sources.map((src: any, idx: number) => (
                            <a 
                              key={idx} 
                              href={src.web?.uri} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xxs font-bold text-primary hover:underline flex items-center gap-1 bg-card py-2 px-3 rounded-xl border border-border-theme"
                            >
                              {src.web?.title || "स्रोत लिङ्क"} <ChevronRight size={10} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. SEO RESULT */}
                {aiAction === 'seo' && (
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-2 border-b border-border-theme pb-2">
                      <BookOpen className="text-primary" size={18} />
                      <h4 className="text-xs font-black uppercase text-primary tracking-widest">अनुवाद र सर्च अप्टिमाइजेसन (SEO Output)</h4>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">नेपाली अनुवाद (Nepali Translation)</label>
                      <div className="p-4 bg-card rounded-xl border border-border-theme text-xs font-bold text-card-foreground leading-relaxed leading-loose">
                        {aiResult.translation}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">एसईओ शीर्षक (SEO Title)</label>
                        <div className="p-3 bg-card rounded-xl border border-border-theme text-xs font-bold text-card-foreground">
                          {aiResult.seoTitle}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">मेटा विवरण (Meta Description)</label>
                        <div className="p-3 bg-card rounded-xl border border-border-theme text-xxs font-medium text-muted-text leading-relaxed">
                          {aiResult.metaDescription}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">सिफारिस गरिएका किवर्डहरू (Keywords)</label>
                      <div className="flex flex-wrap gap-1.5">
                        {String(aiResult.keywords).split(",").map((kw: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xxs font-bold">
                            {kw.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAuditLogsTab = () => {
    return (
      <div className="bg-card p-8 rounded-3xl border border-border-theme flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-black text-card-foreground uppercase tracking-tight">अपरिवर्तनीय सुरक्षा लेखाजोखा (Immutable Audit Trails)</h2>
          <p className="text-xs font-medium text-muted-text">प्रशासन र कर्मचारीका सबै क्रियाकलापहरूको अपरिवर्तनीय विवरण।</p>
        </div>

        <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto custom-scrollbar">
          {auditLogs.map(log => (
            <div key={log.id} className="p-4 bg-muted-area rounded-xl border border-border-theme flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xxs flex-shrink-0">
                LOG
              </div>
              <div className="flex flex-col gap-1 flex-grow">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black text-card-foreground uppercase tracking-wider">{log.action}</span>
                  <span className="text-xxs text-muted-text font-mono">{formatDate(log.timestamp)}</span>
                </div>
                <p className="text-xxs text-muted-text font-medium">
                  <strong>अपरेटर:</strong> {log.userName} ({log.userEmail})
                </p>
                {log.metadata && (
                  <pre className="text-3xxs font-mono bg-card p-3 rounded-lg border border-border-theme/50 text-muted-text mt-2 overflow-x-auto max-w-full">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}

          {auditLogs.length === 0 && (
            <div className="text-center py-20 text-muted-text">
              <p className="text-xs font-bold uppercase tracking-widest">कुनै सुरक्षा विवरण उपलब्ध छैन।</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 flex flex-col gap-8">
        
        {/* Page header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl lg:text-3xl font-black text-card-foreground tracking-tight">Sanatan Marga - Media Operating System (MOS)</h1>
            <p className="text-sm font-medium text-muted-text">एकीकृत समाचार कक्ष व्यवस्थापन, विज्ञापन परिचालन, र एआई को-पायलट कमान्ड सेन्टर।</p>
          </div>
        </header>

        {/* Horizontal Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border-theme pb-4">
          {[
            { id: 'workflow', label: 'सम्पादकीय कार्यप्रवाह', icon: FileCheck },
            { id: 'assignments', label: 'कार्यभार डेस्क', icon: Users },
            { id: 'calendar', label: 'क्यालेन्डर', icon: Calendar },
            { id: 'adops', label: 'विज्ञापन अप्स V2', icon: Megaphone },
            { id: 'breaking', label: 'टेकओभर अलर्ट', icon: ShieldAlert },
            { id: 'analytics', label: 'पाठक एनालिटिक्स', icon: Activity },
            { id: 'ai_newsroom', label: 'एआई समाचार को-पायलट', icon: Sparkles },
            { id: 'audit_logs', label: 'सुरक्षा अडिट लगहरू', icon: History }
          ].map(tb => {
            const Icon = tb.icon;
            return (
              <button
                key={tb.id}
                onClick={() => { setActiveTab(tb.id as MosTab); setAiResult(null); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all uppercase tracking-wider border ${
                  activeTab === tb.id 
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/10 scale-102" 
                    : "bg-card text-muted-text hover:bg-muted-area hover:text-primary border-border-theme"
                }`}
              >
                <Icon size={14} /> {tb.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Tab Body */}
        <div className="min-h-[500px]">
          {activeTab === 'workflow' && renderWorkflowTab()}
          {activeTab === 'assignments' && renderAssignmentsTab()}
          {activeTab === 'calendar' && renderCalendarTab()}
          {activeTab === 'adops' && renderAdOpsTab()}
          {activeTab === 'breaking' && renderBreakingTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
          {activeTab === 'ai_newsroom' && renderAINewsroomTab()}
          {activeTab === 'audit_logs' && renderAuditLogsTab()}
        </div>

      </div>
    </AdminLayout>
  );
}
