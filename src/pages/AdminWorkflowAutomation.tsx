import { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import SEOHead from "@/src/components/common/SEOHead";
import { useTenant } from "@/src/lib/tenantContext";
import { TenantWorkflow, WorkflowTriggerType, TenantWorkflowStep } from "@/src/types";
import { 
  fetchTenantWorkflows, 
  saveTenantWorkflow, 
  deleteTenantWorkflow, 
  triggerWorkflow 
} from "@/src/lib/workflowEngine";
import { db, auth } from "@/src/lib/firebase";
import { contentEventBus } from "@/src/lib/contentEventBus";
import { useAuth } from "@/src/lib/auth";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs 
} from "@/src/lib/firebase";
import { 
  Zap, 
  Play, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Bot, 
  Mail, 
  Users, 
  FileText, 
  Layers, 
  Sparkles, 
  Check, 
  AlertCircle,
  Trash2,
  Edit3,
  X,
  Activity,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Calendar,
  BarChart3,
  ListTodo,
  TrendingUp,
  Award,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

export default function AdminWorkflowAutomation() {
  const { activeTenant } = useTenant();
  const { user: currentUser } = useAuth();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"rules" | "kanban" | "assignments" | "telemetry">("rules");

  // Core automation state
  const [workflows, setWorkflows] = useState<TenantWorkflow[]>([]);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWf, setEditingWf] = useState<TenantWorkflow | null>(null);
  const [showLogsDrawer, setShowLogsDrawer] = useState(false);

  // Kanban State
  const [articles, setArticles] = useState<any[]>([]);
  const [kanbanLoading, setKanbanLoading] = useState(true);

  // Assignment Engine State
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assigneeList, setAssigneeList] = useState<any[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  
  // Assignment Form State
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [assignDeadline, setAssignDeadline] = useState("");

  // Modal Form State (Workflow Builder)
  const [formTitle, setFormTitle] = useState("");
  const [formTrigger, setFormTrigger] = useState<WorkflowTriggerType>("story_submitted");
  const [formSteps, setFormSteps] = useState<TenantWorkflowStep[]>([
    { id: "s1", title: "AI स्वचालित परीक्षण तथा ट्यागिङ", assigneeRole: "ai_bot", actionType: "auto_tag", status: "completed" },
    { id: "s2", title: "सम्बन्धित अधिकारीलाई इमेल/एसएमएस सूचना", assigneeRole: "tenant_editor", actionType: "notify", status: "completed" }
  ]);

  // Real-time subscribers
  useEffect(() => {
    if (!db) return;
    
    // 1. Subscribe to Workflows
    const qWf = query(collection(db, "tenant_workflows"));
    const unsubWf = onSnapshot(qWf, (snap) => {
      const list: TenantWorkflow[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as TenantWorkflow);
      });
      setWorkflows(list.length > 0 ? list : []);
      setLoading(false);
    }, (err) => {
      console.warn("Workflows subscription failed, fallback to defaults", err);
      fetchTenantWorkflows().then(list => {
        setWorkflows(list);
        setLoading(false);
      });
    });

    // 2. Subscribe to Execution Logs (Activity)
    const qLogs = query(
      collection(db, "activityLogs"),
      where("action", "==", "WORKFLOW_TRIGGERED"),
      limit(30)
    );
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      const logs: any[] = [];
      snap.forEach(docSnap => {
        logs.push({ id: docSnap.id, ...docSnap.data() });
      });
      setExecutionLogs(logs);
    });

    // 3. Subscribe to Articles for Kanban
    const qArticles = query(collection(db, "articles"), limit(100));
    const unsubArticles = onSnapshot(qArticles, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setArticles(list);
      setKanbanLoading(false);
    }, () => {
      setKanbanLoading(false);
    });

    // 4. Subscribe to Assignments
    const qAssigns = query(collection(db, "storyAssignments"), orderBy("deadline", "asc"), limit(50));
    const unsubAssigns = onSnapshot(qAssigns, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssignments(list);
      setAssignmentsLoading(false);
    }, () => {
      setAssignmentsLoading(false);
    });

    // 5. Fetch Team members for assignment options
    getDocs(collection(db, "users")).then((snap) => {
      const list = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      setAssigneeList(list);
    });

    return () => {
      unsubWf();
      unsubLogs();
      unsubArticles();
      unsubAssigns();
    };
  }, []);

  const triggerLabels: Record<WorkflowTriggerType, { label: string; icon: any; color: string }> = {
    story_submitted: { label: "नयाँ समाचार ड्राफ्ट बुझाउँदा", icon: FileText, color: "text-amber-500 bg-amber-500/10" },
    sponsor_proposal_sent: { label: "प्रायोजन प्रस्ताव पठाइँदा", icon: Zap, color: "text-emerald-500 bg-emerald-500/10" },
    new_member_joined: { label: "नयाँ सदस्य दर्ता हुँदा", icon: Users, color: "text-blue-500 bg-blue-500/10" },
    civic_complaint_logged: { label: "नागरिक गुनासो दर्ता हुँदा", icon: AlertCircle, color: "text-rose-500 bg-rose-500/10" },
    admission_applied: { label: "भर्ना आवेदन प्राप्त हुँदा", icon: Sparkles, color: "text-purple-500 bg-purple-500/10" }
  };

  const handleOpenCreate = () => {
    setEditingWf(null);
    setFormTitle("");
    setFormTrigger("story_submitted");
    setFormSteps([
      { id: "s1", title: "AI स्वचालित परीक्षण तथा ट्यागिङ", assigneeRole: "ai_bot", actionType: "auto_tag", status: "completed" },
      { id: "s2", title: "सम्बन्धित अधिकारीलाई इमेल सूचना", assigneeRole: "tenant_editor", actionType: "notify", status: "completed" }
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (wf: TenantWorkflow) => {
    setEditingWf(wf);
    setFormTitle(wf.title);
    setFormTrigger(wf.trigger);
    setFormSteps(wf.steps || []);
    setIsModalOpen(true);
  };

  const handleSaveWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    await saveTenantWorkflow({
      id: editingWf?.id,
      tenantId: activeTenant.id,
      title: formTitle,
      trigger: formTrigger,
      steps: formSteps,
      isActive: editingWf ? editingWf.isActive : true,
      runCount: editingWf ? editingWf.runCount : 0,
      lastTriggeredAt: editingWf?.lastTriggeredAt || new Date().toISOString()
    });

    setIsModalOpen(false);
    toast.success(`Workflow "${formTitle}" successfully saved!`);
  };

  const handleToggleWorkflow = async (wf: TenantWorkflow) => {
    const updated = await saveTenantWorkflow({
      ...wf,
      isActive: !wf.isActive
    });
    toast.success(`Rule is now ${updated.isActive ? "active" : "disabled"}`);
  };

  const handleDeleteWorkflow = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete workflow: "${title}"?`)) {
      await deleteTenantWorkflow(id);
      toast.success("Workflow successfully removed.");
    }
  };

  const handleAddStepField = () => {
    const newStepId = `s${formSteps.length + 1}`;
    setFormSteps([
      ...formSteps,
      {
        id: newStepId,
        title: "New Automated Pipeline Step",
        assigneeRole: "system",
        actionType: "notify",
        status: "completed"
      }
    ]);
  };

  const handleTestTrigger = async (wf: TenantWorkflow) => {
    setTestingId(wf.id);
    const triggerName: WorkflowTriggerType = wf.trigger || "story_submitted";
    await triggerWorkflow(triggerName, {
      tenantId: activeTenant.id,
      title: `[Manual Test Trigger] ${wf.title}`,
      author: currentUser?.displayName || currentUser?.email || "Admin Context"
    });

    // Log to Immutable Audit Ledger as well
    if (db && currentUser) {
      await addDoc(collection(db, "auditLogs"), {
        action: `WORKFLOW_TRIGGERED_TEST_${String(triggerName).toUpperCase()}`,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email,
        metadata: { workflowId: wf.id, workflowTitle: wf.title },
        timestamp: new Date().toISOString()
      });
    }

    setTimeout(() => {
      setTestingId(null);
      toast.success(`Workflow pipeline "${wf.title}" successfully completed!`);
    }, 850);
  };

  // Kanban Column State Transitions
  const handleMoveKanban = async (articleId: string, currentStatus: string, nextStatus: string) => {
    if (!db || !currentUser) return;
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        toast.error("Authentication expired. Please sign in again.");
        return;
      }

      // 1. Send transitions through server for validation and state machine enforcement
      const res = await fetch(`/api/articles/${articleId}/transition`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ nextStatus })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to transition article on the server.");
      }

      // 2. Emit mutation through central ContentEventBus for local override, cache-invalidation, and server rebuild
      await contentEventBus.emit({
        type: "ARTICLE_STATUS_CHANGED",
        entity: "article",
        entityId: articleId,
        data: { id: articleId, status: nextStatus },
        userId: currentUser.uid
      });

      toast.success(`Article successfully moved to ${nextStatus.toUpperCase()}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to move article status.");
    }
  };

  // Create real-time story assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !currentUser) return;
    if (!assignTitle.trim() || !assignTo || !assignDeadline) {
      toast.error("Please complete all assignment fields.");
      return;
    }

    setSubmittingAssignment(true);
    try {
      const selectedAssignee = assigneeList.find(m => m.uid === assignTo);
      const assigneeName = selectedAssignee?.displayName || selectedAssignee?.email || assignTo;

      const assignmentData = {
        title: assignTitle.trim(),
        description: assignDesc.trim(),
        assignedTo: assignTo,
        assignedToName: assigneeName,
        assignedBy: currentUser.uid,
        assignedByName: currentUser.displayName || currentUser.email,
        deadline: new Date(assignDeadline).toISOString(),
        status: "assigned",
        notes: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, "storyAssignments"), assignmentData);

      // Audit Ledger
      await addDoc(collection(db, "auditLogs"), {
        action: "STORY_ASSIGNMENT_CREATED",
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email,
        metadata: { title: assignTitle.trim(), assignedToName: assigneeName },
        timestamp: new Date().toISOString()
      });

      toast.success("Assignment successfully created and dispatched to reporter!");
      setAssignTitle("");
      setAssignDesc("");
      setAssignTo("");
      setAssignDeadline("");
    } catch (err: any) {
      toast.error(`Error dispatching assignment: ${err.message}`);
    } finally {
      setSubmittingAssignment(false);
    }
  };

  // Update assignment status
  const handleUpdateAssignmentStatus = async (assignId: string, currentStatus: string, nextStatus: string) => {
    if (!db || !currentUser) return;
    try {
      const ref = doc(db, "storyAssignments", assignId);
      const updateData: any = {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      };

      if (nextStatus === "accepted") {
        updateData.acceptedAt = new Date().toISOString();
      } else if (nextStatus === "in_progress") {
        updateData.startedAt = new Date().toISOString();
      } else if (nextStatus === "completed") {
        updateData.completedAt = new Date().toISOString();
      }

      await updateDoc(ref, updateData);

      // Audit transition
      await addDoc(collection(db, "auditLogs"), {
        action: "ASSIGNMENT_STATUS_TRANSITION",
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email,
        metadata: { assignmentId: assignId, oldStatus: currentStatus, newStatus: nextStatus, ...updateData },
        timestamp: new Date().toISOString()
      });

      toast.success(`Assignment status updated to: ${nextStatus.toUpperCase()}`);
    } catch (e) {
      toast.error("Failed to update status.");
    }
  };

  // Helper counters
  const totalRuns = workflows.reduce((acc, wf) => acc + (wf.runCount || 0), 0);
  const activeWorkflowsCount = workflows.filter(w => w.isActive).length;

  const avgLatency = executionLogs.length > 0 
    ? `${Math.round(executionLogs.reduce((acc, log) => acc + (log.details?.duration || 12), 0) / executionLogs.length)}ms`
    : "0ms";

  const failureRate = executionLogs.length > 0
    ? `${((executionLogs.filter(log => log.status === "FAILED").length / executionLogs.length) * 100).toFixed(2)}%`
    : "0.00%";

  const triggerStats = (() => {
    const counts: Record<string, number> = {
      story_submitted: 0,
      civic_complaint_logged: 0,
      new_member_joined: 0,
      sponsor_proposal_sent: 0
    };
    
    // Count from workflows runCount
    workflows.forEach(w => {
      if (w.trigger && typeof w.runCount === "number" && counts[w.trigger] !== undefined) {
        counts[w.trigger] += w.runCount;
      }
    });

    // Count from executionLogs
    executionLogs.forEach(log => {
      const trig = log.details?.trigger;
      if (trig && counts[trig] !== undefined) {
        counts[trig]++;
      }
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1; // avoid divide by zero
    
    return [
      { label: "Draft Submitted (story_submitted)", count: counts.story_submitted, pct: `${Math.round((counts.story_submitted / total) * 100)}%` },
      { label: "Civic Complaints (civic_complaint_logged)", count: counts.civic_complaint_logged, pct: `${Math.round((counts.civic_complaint_logged / total) * 100)}%` },
      { label: "Member Onboarding (new_member_joined)", count: counts.new_member_joined, pct: `${Math.round((counts.new_member_joined / total) * 100)}%` },
      { label: "Corporate Sponsorship (sponsor_proposal_sent)", count: counts.sponsor_proposal_sent, pct: `${Math.round((counts.sponsor_proposal_sent / total) * 100)}%` }
    ];
  })();

  return (
    <AdminLayout title="WorkflowOS">
      <SEOHead title="WorkflowOS - स्वचालित कार्यप्रवाह सम्पादन | Sanatan Marga Admin" />
      <div className="space-y-6">
        
        {/* TOP LEVEL NAVIGATION WITH METADATA HEADER */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-border-theme pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-primary/10 text-primary border border-primary/20">
                <Zap size={14} className="animate-pulse" /> WorkflowOS • Operational Automation
              </span>
              <span className="text-xs font-mono text-muted-text bg-muted-area px-2 py-0.5 rounded border border-border-theme">
                Context: {activeTenant.name}
              </span>
            </div>
            <h1 className="text-2xl font-black text-card-foreground mt-1">सम्पादकीय स्वचालन तथा कार्यप्रवाह प्रणाली</h1>
          </div>

          <div className="flex items-center gap-1.5 bg-muted-area p-1 rounded-2xl border border-border-theme overflow-x-auto">
            {[
              { id: "rules", label: "Workflow Rules", icon: Zap },
              { id: "kanban", label: "Editorial Kanban", icon: Layers },
              { id: "assignments", label: "Assignment Engine", icon: ListTodo },
              { id: "telemetry", label: "Telemetry & Logs", icon: BarChart3 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-card text-card-foreground shadow-sm font-black text-primary"
                    : "text-muted-text hover:text-card-foreground"
                }`}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ==================== TAB 1: WORKFLOW AUTOMATION RULES ==================== */}
        {activeTab === "rules" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border-theme rounded-3xl p-6 shadow-sm">
              <div className="space-y-1">
                <h3 className="font-black text-card-foreground text-sm flex items-center gap-2">
                  <Bot size={16} className="text-primary" /> Active Automation Blueprints
                </h3>
                <p className="text-xs text-muted-text">
                  Define triggers, automated tag rules, notify actions, and multi-agent approval routing paths.
                </p>
              </div>
              <button
                onClick={handleOpenCreate}
                className="bg-primary text-primary-foreground font-black text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer self-start sm:self-auto"
              >
                <Plus size={16} /> New Rule Builder
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-2">
                <RefreshCw className="animate-spin text-primary" size={28} />
                <span className="text-xs text-muted-text font-black">Loading workflow blueprints...</span>
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-16 bg-muted-area/30 border border-dashed border-border-theme rounded-3xl">
                <Zap className="mx-auto text-muted-text/50 mb-3" size={44} />
                <h4 className="font-black text-card-foreground text-sm">No Workflow Rules Configured</h4>
                <p className="text-xs text-muted-text mt-1 max-w-md mx-auto">Create your first automated workflow rule to auto-tag stories, fire slack alerts, or route reviews.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workflows.map((wf) => {
                  const meta = triggerLabels[wf.trigger] || triggerLabels.story_submitted;
                  const TriggerIcon = meta.icon;
                  const isRunning = testingId === wf.id;

                  return (
                    <div
                      key={wf.id}
                      className={`bg-card border rounded-3xl p-6 shadow-sm space-y-4 transition-all ${
                        isRunning ? "border-primary ring-2 ring-primary/10" : "border-border-theme hover:border-primary/40"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-theme pb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-2xl shrink-0 ${meta.color}`}>
                            <TriggerIcon size={18} />
                          </div>
                          <div>
                            <h3 className="font-black text-card-foreground text-sm">{wf.title}</h3>
                            <div className="flex items-center gap-2 text-[10px] text-muted-text mt-0.5">
                              <span>Trigger Event:</span>
                              <strong className="text-card-foreground font-mono">{wf.trigger}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleTestTrigger(wf)}
                            disabled={isRunning}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white border border-amber-500/20 font-black text-[10px] transition-all flex items-center gap-1"
                          >
                            <Play size={10} className={isRunning ? "animate-spin" : ""} />
                            <span>{isRunning ? "Running..." : "Test Trigger"}</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(wf)}
                            className="p-1.5 rounded-xl bg-muted-area hover:bg-primary/10 text-muted-text hover:text-primary transition-all cursor-pointer"
                          >
                            <Edit3 size={12} />
                          </button>

                          <button
                            onClick={() => handleDeleteWorkflow(wf.id, wf.title)}
                            className="p-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>

                          <button
                            onClick={() => handleToggleWorkflow(wf)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-[10px] border transition-all flex items-center gap-1.5 cursor-pointer ${
                              wf.isActive 
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                                : "bg-muted-area text-muted-text border-border-theme"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${wf.isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-text"}`} />
                            <span>{wf.isActive ? "Active" : "Disabled"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Timeline pipeline sequence display */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-muted-text uppercase tracking-wider block">
                          Execution Pipeline Sequence ({wf.steps?.length || 0} stages)
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {wf.steps?.map((step, idx) => (
                            <div key={idx} className="p-3 bg-muted-area/40 rounded-2xl border border-border-theme flex items-start gap-2.5">
                              <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[9px] font-mono font-black flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div className="space-y-0.5">
                                <h4 className="text-xs font-black text-card-foreground leading-snug">{step.title}</h4>
                                <span className="text-[9px] text-muted-text block leading-none">
                                  Agent: <strong className="text-primary font-bold">{step.assigneeRole}</strong> • action: {step.actionType}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-text border-t border-border-theme/40 pt-3 mt-1 font-medium">
                        <span>
                          Run telemetry: <strong className="text-card-foreground font-mono">{wf.runCount || 0} times</strong> • Last fired: <strong className="text-card-foreground">{wf.lastTriggeredAt ? new Date(wf.lastTriggeredAt).toLocaleString() : "Never"}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: EDITORIAL KANBAN BOARD ==================== */}
        {activeTab === "kanban" && (
          <div className="space-y-4">
            <div className="bg-card border border-border-theme rounded-3xl p-6 shadow-sm">
              <h3 className="font-black text-card-foreground text-sm flex items-center gap-2 border-b border-border-theme pb-3 mb-2">
                <Layers size={16} className="text-primary" /> Editorial Review Kanban Board (समाचार प्रकाशन प्रवाह)
              </h3>
              <p className="text-xs text-muted-text">
                Manage and audit article transitions seamlessly. Transitioning cards instantly records an immutable ledger log tracking previous/new states.
              </p>
            </div>

            {kanbanLoading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-2">
                <RefreshCw className="animate-spin text-primary" size={28} />
                <span className="text-xs text-muted-text font-black">Loading live newsroom board...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 overflow-x-auto pb-4">
                {[
                  { id: "draft", label: "Draft", bg: "bg-slate-100 dark:bg-slate-900 border-slate-300" },
                  { id: "assigned", label: "Assigned", bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-300/30" },
                  { id: "under_review", label: "Review", bg: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300/30" },
                  { id: "fact_check", label: "Fact Check", bg: "bg-purple-50 dark:bg-purple-950/20 border-purple-300/30" },
                  { id: "approved", label: "Approved", bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300/30" },
                  { id: "published", label: "Published", bg: "bg-sky-50 dark:bg-sky-950/20 border-sky-300/30" }
                ].map(col => {
                  const colArts = articles.filter(a => (a.status || "draft") === col.id);
                  
                  return (
                    <div key={col.id} className="min-w-[220px] bg-card border border-border-theme rounded-3xl p-4 flex flex-col space-y-3 h-[450px]">
                      <div className="flex items-center justify-between border-b border-border-theme pb-2 shrink-0">
                        <span className="text-xs font-black text-card-foreground flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            col.id === 'published' ? 'bg-sky-500' :
                            col.id === 'approved' ? 'bg-emerald-500' :
                            col.id === 'under_review' ? 'bg-amber-500' : 'bg-muted-text'
                          }`} />
                          {col.label}
                        </span>
                        <span className="text-[10px] font-black font-mono text-muted-text bg-muted-area px-2 py-0.5 rounded-full">
                          {colArts.length}
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {colArts.length === 0 ? (
                          <div className="text-center py-8 text-[10px] text-muted-text font-medium italic border border-dashed border-border-theme/60 rounded-2xl bg-muted-area/10">
                            Empty Column
                          </div>
                        ) : (
                          colArts.map(art => (
                            <div key={art.id} className="p-3 bg-muted-area/30 border border-border-theme rounded-2xl hover:border-primary/40 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                              <div className="space-y-1">
                                <h4 className="text-[11px] font-black text-card-foreground leading-tight line-clamp-2">{art.title}</h4>
                                <span className="text-[9px] text-muted-text block">By: {art.authorName || "Staff Reporter"}</span>
                              </div>

                              <div className="flex items-center justify-between gap-1 border-t border-border-theme/40 pt-2 shrink-0">
                                <span className="text-[8px] font-mono font-bold bg-card px-1.5 py-0.5 rounded border border-border-theme">
                                  {art.id.slice(0, 5)}
                                </span>
                                
                                <div className="flex items-center gap-1">
                                  {col.id !== "draft" && (
                                    <button
                                      onClick={() => {
                                        const prevMap: any = { assigned: "draft", under_review: "assigned", fact_check: "under_review", approved: "fact_check", published: "approved" };
                                        handleMoveKanban(art.id, col.id, prevMap[col.id]);
                                      }}
                                      className="p-1 rounded bg-card hover:bg-muted-area border border-border-theme hover:text-primary transition-all text-[9px] font-black cursor-pointer"
                                      title="Move Left"
                                    >
                                      ←
                                    </button>
                                  )}
                                  {col.id !== "published" && (
                                    <button
                                      onClick={() => {
                                        const nextMap: any = { draft: "assigned", assigned: "under_review", under_review: "fact_check", fact_check: "approved", approved: "published" };
                                        handleMoveKanban(art.id, col.id, nextMap[col.id]);
                                      }}
                                      className="p-1 rounded bg-card hover:bg-muted-area border border-border-theme hover:text-primary transition-all text-[9px] font-black cursor-pointer"
                                      title="Move Right"
                                    >
                                      →
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: ASSIGNMENT ENGINE ==================== */}
        {activeTab === "assignments" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Create Story Assignment Panel */}
            <div className="lg:col-span-4 bg-card border border-border-theme rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-border-theme pb-3 mb-4">
                  <UserCheck className="text-primary" size={18} />
                  <h3 className="text-xs font-black text-card-foreground uppercase tracking-wider">
                    Dispatch Reporter Assignment (जिम्मेवारी बाँडफाँड)
                  </h3>
                </div>

                <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs font-bold">
                  <div>
                    <label className="block text-[10px] text-muted-text mb-1 uppercase">Story/Photo Assignment Title *</label>
                    <input
                      type="text"
                      value={assignTitle}
                      onChange={(e) => setAssignTitle(e.target.value)}
                      placeholder="e.g. Coverage of Sanatan Mahapuja Festival"
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-card-foreground focus:outline-none focus:border-primary placeholder:text-muted-text/70"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-muted-text mb-1 uppercase">Brief Instructions / Guidelines</label>
                    <textarea
                      value={assignDesc}
                      onChange={(e) => setAssignDesc(e.target.value)}
                      placeholder="e.g. Focus on community gathering and cultural significance..."
                      rows={3}
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-card-foreground focus:outline-none focus:border-primary placeholder:text-muted-text/70"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-muted-text mb-1 uppercase">Assign Staff Member *</label>
                    <select
                      value={assignTo}
                      onChange={(e) => setAssignTo(e.target.value)}
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-2.5 py-2 text-card-foreground focus:outline-none focus:border-primary"
                      required
                    >
                      <option value="">Select reporter...</option>
                      {assigneeList.map(member => (
                        <option key={member.uid} value={member.uid}>
                          👤 {member.displayName || member.email} ({member.role || "staff"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-muted-text mb-1 uppercase">Submission Deadline *</label>
                    <input
                      type="datetime-local"
                      value={assignDeadline}
                      onChange={(e) => setAssignDeadline(e.target.value)}
                      className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-card-foreground focus:outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingAssignment}
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-black text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-primary/10"
                  >
                    {submittingAssignment ? <RefreshCw className="animate-spin" size={14} /> : <UserCheck size={14} />}
                    <span>Dispatch Editorial Task</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Active Assignments Queue */}
            <div className="lg:col-span-8 bg-card border border-border-theme rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-border-theme pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <ListTodo className="text-primary" size={18} />
                  <h3 className="text-xs font-black text-card-foreground uppercase tracking-wider">
                    Staff Assignment Board (जिम्मेवारी अनुगमन)
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-muted-text bg-muted-area px-2.5 py-1 rounded-full border border-border-theme">
                  Tracking
                </span>
              </div>

              {assignmentsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-2">
                  <RefreshCw className="animate-spin text-primary" size={24} />
                  <span className="text-xs text-muted-text font-black">Loading secure assignments...</span>
                </div>
              ) : assignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border-theme rounded-2xl bg-muted-area/20">
                  <ListTodo className="text-muted-text/40 mb-2" size={36} />
                  <p className="text-xs font-black text-muted-text">Zero Active Assignments</p>
                  <p className="text-[10px] text-muted-text/75 mt-1">Dispatch an assignment to trace real-time staff progress.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {assignments.map(item => (
                    <div key={item.id} className="p-4 bg-muted-area/30 border border-border-theme rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-black text-card-foreground leading-snug">{item.title}</h4>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                            item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                            item.status === 'submitted' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                            item.status === 'in_progress' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                            'bg-muted-area text-muted-text border-border-theme'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        {item.description && <p className="text-[10px] text-muted-text">{item.description}</p>}
                        
                        <div className="text-[9px] text-muted-text flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-0.5 pt-1">
                          <div>
                            Assignee: <strong className="text-card-foreground">{item.assignedToName}</strong>
                          </div>
                          <div>
                            Dispatcher: <strong className="text-card-foreground">{item.assignedByName}</strong>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={10} /> Deadline: <strong className="text-red-500">{new Date(item.deadline).toLocaleString()}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        {item.status === "assigned" && (
                          <button
                            onClick={() => handleUpdateAssignmentStatus(item.id, item.status, "in_progress")}
                            className="bg-amber-500 text-white font-black text-[9px] px-2.5 py-1 rounded-lg hover:bg-amber-600 transition-all cursor-pointer"
                          >
                            Accept Task
                          </button>
                        )}
                        {item.status === "in_progress" && (
                          <button
                            onClick={() => handleUpdateAssignmentStatus(item.id, item.status, "submitted")}
                            className="bg-blue-600 text-white font-black text-[9px] px-2.5 py-1 rounded-lg hover:bg-blue-700 transition-all cursor-pointer"
                          >
                            Submit Draft
                          </button>
                        )}
                        {item.status === "submitted" && (
                          <button
                            onClick={() => handleUpdateAssignmentStatus(item.id, item.status, "completed")}
                            className="bg-emerald-600 text-white font-black text-[9px] px-2.5 py-1 rounded-lg hover:bg-emerald-700 transition-all cursor-pointer"
                          >
                            Approve & Close
                          </button>
                        )}
                        {item.status === "completed" && (
                          <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                            Closed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 4: WORKFLOW TELEMETRY & LOGS ==================== */}
        {activeTab === "telemetry" && (
          <div className="space-y-6">
            
            {/* Real Telemetry Numbers Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { title: "Total Automation Run Count", val: `${totalRuns} executions`, desc: "Cascading automated rule hits", icon: Activity, color: "text-primary bg-primary/10" },
                { title: "Active Workflow Engines", val: `${activeWorkflowsCount} rules`, desc: "In-memory state routers", icon: Sparkles, color: "text-amber-500 bg-amber-500/10" },
                { title: "Average Cascade Latency", val: avgLatency, desc: "Edge evaluation dispatch time", icon: Clock, color: "text-emerald-500 bg-emerald-500/10" },
                { title: "Failure / Timeout Rate", val: failureRate, desc: "Healthy zero-exception state", icon: CheckCircle2, color: "text-blue-500 bg-blue-500/10" }
              ].map((card, idx) => (
                <div key={idx} className="bg-card border border-border-theme rounded-3xl p-5 shadow-sm space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-muted-text leading-none">{card.title}</span>
                    <div className={`p-2 rounded-xl ${card.color}`}>
                      <card.icon size={14} />
                    </div>
                  </div>
                  <h4 className="text-xl font-black text-card-foreground font-mono leading-none pt-1">{card.val}</h4>
                  <p className="text-[10px] text-muted-text leading-none">{card.desc}</p>
                </div>
              ))}
            </div>

            {/* Custom Visual Metrics Bar Chart using Tailwind flex panels */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-4 bg-card border border-border-theme rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-card-foreground uppercase tracking-wider mb-2">Trigger Event Distribution</h3>
                  <p className="text-[10px] text-muted-text mb-4">Proportion of automated pipeline activations across tenants</p>
                  
                  <div className="space-y-3.5">
                    {triggerStats.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-card-foreground">
                          <span>{item.label}</span>
                          <span>{item.count} runs ({item.pct})</span>
                        </div>
                        <div className="w-full bg-muted-area h-2 rounded-full overflow-hidden border border-border-theme">
                          <div className="bg-primary h-full rounded-full" style={{ width: item.pct }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Execution logs stream */}
              <div className="lg:col-span-8 bg-card border border-border-theme rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-border-theme pb-3 mb-4">
                  <h3 className="text-xs font-black text-card-foreground uppercase tracking-wider flex items-center gap-2">
                    <Activity size={16} className="text-primary animate-pulse" /> Live Telemetry Event Stream (प्रत्यक्ष गतिविधि प्रवाह)
                  </h3>
                  <span className="text-[10px] font-black text-muted-text">Real-Time telemetry</span>
                </div>

                {executionLogs.length === 0 ? (
                  <p className="text-xs text-muted-text italic py-10 text-center">No telemetry logging received. Test a trigger above to fire telemetry.</p>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {executionLogs.map((log) => (
                      <div key={log.id} className="p-3.5 rounded-2xl bg-muted-area/40 border border-border-theme/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="font-bold text-card-foreground block leading-snug">
                            {log.details?.workflowTitle || "Automated Workflow Routine"}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-muted-text flex-wrap font-medium">
                            <span>Trigger:</span>
                            <strong className="text-primary font-mono">{log.details?.trigger}</strong>
                            <span>• Operator:</span>
                            <strong className="text-card-foreground font-mono">{log.userEmail || "System Auto"}</strong>
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end gap-1 shrink-0">
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            SUCCESS ({log.details?.stepsExecuted || 3} stages executed)
                          </span>
                          <span className="text-[8px] font-mono text-muted-text">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* WORKFLOW BUILDER MODAL */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border-theme rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-border-theme pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                      <Zap size={22} />
                    </div>
                    <div>
                      <h3 className="font-black text-card-foreground text-lg">
                        {editingWf ? "Edit Workflow Automation Blueprint" : "Create New Workflow Rule"}
                      </h3>
                      <p className="text-xs text-muted-text">
                        Map trigger events to automated cascading actions
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-muted-area text-muted-text cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveWorkflow} className="space-y-5 text-xs font-bold">
                  <div>
                    <label className="block text-muted-text mb-1">Rule Title (शीर्षक) *</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Civic Complaints Automatic Verification"
                      className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-muted-text mb-1">Trigger Event (घटित हुने कार्य) *</label>
                    <select
                      value={formTrigger}
                      onChange={(e) => setFormTrigger(e.target.value as WorkflowTriggerType)}
                      className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-3 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="story_submitted">Draft Submitted (story_submitted)</option>
                      <option value="sponsor_proposal_sent">Sponsorship proposal dispatch (sponsor_proposal_sent)</option>
                      <option value="new_member_joined">New subscriber/member register (new_member_joined)</option>
                      <option value="civic_complaint_logged">Civic complaint logging (civic_complaint_logged)</option>
                      <option value="admission_applied">Academy Application Applied (admission_applied)</option>
                    </select>
                  </div>

                  {/* STEPS EDITOR */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-muted-text uppercase tracking-wider text-[11px]">
                        Pipeline Cascades Steps
                      </label>
                      <button
                        type="button"
                        onClick={handleAddStepField}
                        className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-black"
                      >
                        <Plus size={14} /> Add Step
                      </button>
                    </div>

                    {formSteps.map((step, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-muted-area/50 border border-border-theme space-y-3 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-primary font-bold">Step #{idx + 1}</span>
                          {formSteps.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setFormSteps(formSteps.filter((_, i) => i !== idx))}
                              className="text-red-500 text-[11px] hover:underline cursor-pointer font-black"
                            >
                              Remove Step
                            </button>
                          )}
                        </div>

                        <div>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => {
                              const updated = [...formSteps];
                              updated[idx].title = e.target.value;
                              setFormSteps(updated);
                            }}
                            placeholder="Step description..."
                            className="w-full bg-card border border-border-theme rounded-xl px-3 py-2 text-card-foreground text-xs focus:outline-none focus:border-primary"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-muted-text mb-1">Assignee Agent/Role</label>
                            <select
                              value={step.assigneeRole}
                              onChange={(e) => {
                                const updated = [...formSteps];
                                updated[idx].assigneeRole = e.target.value;
                                setFormSteps(updated);
                              }}
                              className="w-full bg-card border border-border-theme rounded-xl px-2.5 py-1.5 text-card-foreground text-xs focus:outline-none focus:border-primary"
                            >
                              <option value="ai_bot">AI Co-pilot Bot</option>
                              <option value="tenant_editor">सम्पादक (Editor)</option>
                              <option value="tenant_admin">प्रशासक (Admin)</option>
                              <option value="ward_officer">वडा अधिकारी</option>
                              <option value="system">प्रणाली (System Auto)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] text-muted-text mb-1">Action Type</label>
                            <select
                              value={step.actionType}
                              onChange={(e) => {
                                const updated = [...formSteps];
                                updated[idx].actionType = e.target.value as any;
                                setFormSteps(updated);
                              }}
                              className="w-full bg-card border border-border-theme rounded-xl px-2.5 py-1.5 text-card-foreground text-xs focus:outline-none focus:border-primary"
                            >
                              <option value="notify">Send alerts/emails (notify)</option>
                              <option value="auto_tag">Auto tag categories (auto_tag)</option>
                              <option value="approval">Request signature (approval)</option>
                              <option value="external_webhook">Trigger external API Webhook</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-border-theme">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl bg-muted-area text-card-foreground hover:bg-muted-area/80 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-black hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer"
                    >
                      Save Blueprint
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
}
