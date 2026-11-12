import { useState, useEffect } from "react";
import { 
  ShieldAlert, AlertTriangle, CheckCircle, Ban, Eye, 
  Trash2, Filter, MessageSquare, UserMinus, UserCheck, 
  RefreshCw, TrendingUp, HelpCircle, Archive, AlertCircle, Calendar
} from "lucide-react";
import { 
  collection, query, orderBy, limit, onSnapshot, 
  doc, updateDoc, deleteDoc, addDoc, serverTimestamp, setDoc, getDoc
} from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { formatDate } from "@/src/lib/utils";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import type { Report, ModerationAction, Appeal, BannedUser, EnforcementLevel } from "@/src/types";

export default function AdminModeration() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [actions, setActions] = useState<ModerationAction[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  
  const [activeTab, setActiveTab] = useState<'reports' | 'appeals' | 'actions' | 'banned' | 'analytics'>('reports');
  const [reportFilter, setReportFilter] = useState<'all' | 'open' | 'resolved' | 'dismissed'>('open');

  // Interactive Enforcement Modal state
  const [enforcingReport, setEnforcingReport] = useState<Report | null>(null);
  const [enforcementType, setEnforcementType] = useState<EnforcementLevel>("warning");
  const [enforcementReason, setEnforcementReason] = useState("");
  const [enforcementDuration, setEnforcementDuration] = useState("3"); // days
  const [removeContent, setRemoveContent] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);

  // Appeal Decision Modal state
  const [decidingAppeal, setDecidingAppeal] = useState<Appeal | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [decidingStatus, setDecidingStatus] = useState<"approved" | "rejected">("approved");

  // Real-time listener configuration
  useEffect(() => {
    // 1. Reports Listener
    const reportsQuery = query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(100));
    const unsubReports = onSnapshot(reportsQuery, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Report));
      setReports(list);
    }, (error) => {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load community reports.");
    });

    // 2. Moderation Actions Listener
    const actionsQuery = query(collection(db, "moderationActions"), orderBy("createdAt", "desc"), limit(100));
    const unsubActions = onSnapshot(actionsQuery, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ModerationAction));
      setActions(list);
    }, (error) => {
      console.error("Error fetching actions:", error);
    });

    // 3. Appeals Listener
    const appealsQuery = query(collection(db, "appeals"), orderBy("createdAt", "desc"), limit(100));
    const unsubAppeals = onSnapshot(appealsQuery, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Appeal));
      setAppeals(list);
    }, (error) => {
      console.error("Error fetching appeals:", error);
    });

    // 4. Banned Users Listener
    const bannedQuery = query(collection(db, "bannedUsers"), orderBy("createdAt", "desc"), limit(100));
    const unsubBanned = onSnapshot(bannedQuery, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as BannedUser));
      setBannedUsers(list);
    }, (error) => {
      console.error("Error fetching banned users:", error);
    });

    return () => {
      unsubReports();
      unsubActions();
      unsubAppeals();
      unsubBanned();
    };
  }, []);

  // Dismiss a report with no action
  const handleDismissReport = async (reportId: string) => {
    if (!confirm("Are you sure you want to dismiss this report? No penalties will be applied.")) return;
    try {
      await updateDoc(doc(db, "reports", reportId), {
        status: "dismissed",
        moderatedAt: serverTimestamp(),
      });
      toast.success("Report dismissed successfully.");
    } catch (err: any) {
      toast.error("Failed to dismiss report: " + err.message);
    }
  };

  // Execute enforcement action
  const handleEnforceAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !enforcingReport) return;
    if (!enforcementReason.trim()) {
      toast.error("Please specify a reason for this moderation action.");
      return;
    }

    setLoadingAction(true);
    try {
      // 1. Fetch targeted user's name/details if possible (reporter fields already contain target content)
      // We will derive the target authorId from target post or comments. Let's do a search.
      let targetUserId = "";
      let targetUserName = "Community Member";

      if (enforcingReport.targetType === "post") {
        const postSnap = await getDoc(doc(db, "communityPosts", enforcingReport.targetId));
        if (postSnap.exists()) {
          const postData = postSnap.data();
          targetUserId = postData.authorId;
          targetUserName = postData.authorName || "Community Member";
        }
      } else {
        const commentSnap = await getDoc(doc(db, "communityComments", enforcingReport.targetId));
        if (commentSnap.exists()) {
          const commentData = commentSnap.data();
          targetUserId = commentData.authorId;
          targetUserName = commentData.authorName || "Community Member";
        }
      }

      if (!targetUserId) {
        // Fallback: report reporterId is who flagged it, let's check if we can get authorId from report
        // If not, we cannot penalize.
        toast.error("Could not find the target user ID for this content.");
        setLoadingAction(false);
        return;
      }

      // Calculate expiration for temporary actions
      let expiresAt = null;
      if (enforcementType === "mute" || enforcementType === "temp_ban") {
        const days = parseInt(enforcementDuration) || 3;
        const d = new Date();
        d.setDate(d.getDate() + days);
        expiresAt = d.toISOString();
      }

      // 2. Save immutable moderationActions log
      const actionRef = await addDoc(collection(db, "moderationActions"), {
        moderatorId: user.uid,
        moderatorName: user.displayName || "Moderator Staff",
        targetUserId,
        targetUserName,
        action: enforcementType,
        reason: enforcementReason.trim(),
        durationDays: (enforcementType === "mute" || enforcementType === "temp_ban") ? parseInt(enforcementDuration) : null,
        createdAt: serverTimestamp(),
      });

      // 3. Register user under bannedUsers if appropriate
      if (enforcementType !== "warning") {
        await setDoc(doc(db, "bannedUsers", targetUserId), {
          userId: targetUserId,
          userName: targetUserName,
          bannedBy: user.displayName || "Staff",
          banType: enforcementType,
          reason: enforcementReason.trim(),
          expiresAt,
          createdAt: serverTimestamp(),
        });
      }

      // 4. Soft-delete target content in Chautari if checked
      if (removeContent) {
        if (enforcingReport.targetType === "post") {
          await updateDoc(doc(db, "communityPosts", enforcingReport.targetId), {
            status: "removed",
            updatedAt: serverTimestamp(),
          });
        } else {
          // comments delete
          await deleteDoc(doc(db, "communityComments", enforcingReport.targetId));
        }
      }

      // 5. Update Report Status to resolved
      await updateDoc(doc(db, "reports", enforcingReport.id), {
        status: "resolved",
        moderatedAt: serverTimestamp(),
      });

      toast.success(`Enforced ${enforcementType.toUpperCase()} and resolved report.`);
      setEnforcingReport(null);
      setEnforcementReason("");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to enforce action: " + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Submit appeal decision
  const handleDecideAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !decidingAppeal) return;

    try {
      // 1. Update Appeal status
      await updateDoc(doc(db, "appeals", decidingAppeal.id), {
        status: decidingStatus,
        moderatorNotes: decisionNotes,
        moderatedAt: serverTimestamp(),
      });

      // 2. If approved, lift active ban
      if (decidingStatus === "approved") {
        await deleteDoc(doc(db, "bannedUsers", decidingAppeal.userId));
        toast.success(`Appeal approved! ${decidingAppeal.userName}'s active ban has been lifted.`);
      } else {
        toast.info("Appeal rejected. Ban remains active.");
      }

      setDecidingAppeal(null);
      setDecisionNotes("");
    } catch (err: any) {
      toast.error("Failed to process appeal: " + err.message);
    }
  };

  // Unban user directly
  const handleLiftBan = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to lift the restriction for u/${userName}?`)) return;
    try {
      await deleteDoc(doc(db, "bannedUsers", userId));
      toast.success(`Active ban lifted for u/${userName}`);
    } catch (err: any) {
      toast.error("Failed to lift ban: " + err.message);
    }
  };

  // Filtered reports
  const filteredReports = reports.filter(r => {
    if (reportFilter === 'all') return true;
    return r.status === reportFilter;
  });

  // Calculate high-level metrics for analytics
  const openReportsCount = reports.filter(r => r.status === 'open').length;
  const resolvedReportsCount = reports.filter(r => r.status === 'resolved').length;
  const dismissedReportsCount = reports.filter(r => r.status === 'dismissed').length;
  const activeBansCount = bannedUsers.length;

  const reasonCounts = reports.reduce((acc, r) => {
    acc[r.reason] = (acc[r.reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const actionCounts = actions.reduce((acc, a) => {
    acc[a.action] = (acc[a.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-theme">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-card-foreground flex items-center gap-2">
              <ShieldAlert className="w-7 h-7 text-primary" />
              मोडरेसन OS <span className="text-xs font-mono font-bold text-muted-text px-2 py-0.5 bg-muted-area border border-border-theme rounded-full">v2.1.0-prod</span>
            </h1>
            <p className="text-xs text-muted-text font-medium">
              Chautari community safety, citizen reporting lines, moderation appeals, and enforcement audit trails.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                toast.info("Syncing moderation engines...");
              }}
              className="p-2 bg-muted-area hover:bg-muted-area/80 border border-border-theme rounded-xl text-muted-text transition-all"
              title="Sync Database"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="flex items-center bg-muted-area/50 p-1 border border-border-theme rounded-xl text-xs font-bold gap-1 select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1.5" />
              <span className="text-muted-text uppercase tracking-widest text-[9px] pr-1.5">Live Agent Sync</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap border-b border-border-theme gap-1">
          {[
            { id: 'reports', label: `Reports Queue (${openReportsCount})`, icon: AlertTriangle },
            { id: 'appeals', label: `User Appeals (${appeals.filter(a => a.status === 'pending').length})`, icon: MessageSquare },
            { id: 'banned', label: `Restricted Users (${activeBansCount})`, icon: Ban },
            { id: 'actions', label: "Action Log History", icon: Archive },
            { id: 'analytics', label: "Insights & Analytics", icon: TrendingUp },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all relative ${
                  active 
                    ? "border-primary text-primary bg-primary/5 font-black" 
                    : "border-transparent text-muted-text hover:text-card-foreground"
                }`}
              >
                <Icon size={14} className={active ? "text-primary animate-pulse" : ""} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Panels */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="min-h-[400px]"
          >
            {/* REPORTS QUEUE */}
            {activeTab === 'reports' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex items-center justify-between bg-muted-area/20 p-3 rounded-2xl border border-border-theme/60">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-text" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-text pr-2 border-r border-border-theme">Filter Queue</span>
                    <div className="flex gap-1.5 ml-2">
                      {(['open', 'resolved', 'dismissed', 'all'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setReportFilter(f)}
                          className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase border transition-all ${
                            reportFilter === f
                              ? "bg-primary text-white border-primary shadow-sm"
                              : "bg-card text-muted-text border-border-theme/40 hover:border-primary/20"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <span className="text-xxs font-mono text-muted-text font-bold">
                    Showing {filteredReports.length} flagged tickets
                  </span>
                </div>

                {/* Queue List */}
                {filteredReports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border-theme border-dashed">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mb-3 animate-bounce" />
                    <h3 className="text-sm font-black text-card-foreground uppercase tracking-wider">Reports Queue Clear</h3>
                    <p className="text-xs text-muted-text max-w-xs text-center mt-1">
                      No matching user-reported flags in the queue. Chautari is safe and healthy!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredReports.map(report => (
                      <div 
                        key={report.id}
                        className={`bg-card rounded-2xl border p-4 sm:p-5 transition-all hover:shadow-lg relative overflow-hidden ${
                          report.status === 'open' 
                            ? "border-amber-500/20 bg-amber-500/[0.01]" 
                            : report.status === 'resolved'
                            ? "border-emerald-500/15 bg-emerald-500/[0.01]"
                            : "border-border-theme/60 opacity-75"
                        }`}
                      >
                        {/* Flag banner indicator */}
                        <div className={`absolute top-0 right-0 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-bl-xl ${
                          report.status === 'open'
                            ? "bg-amber-500/10 text-amber-500 border-l border-b border-amber-500/10"
                            : report.status === 'resolved'
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-muted-area text-muted-text"
                        }`}>
                          {report.status}
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            {/* Headline */}
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                report.targetType === "post"
                                  ? "bg-indigo-500/10 text-indigo-500"
                                  : "bg-purple-500/10 text-purple-500"
                              }`}>
                                {report.targetType}
                              </span>
                              <span className="text-xxs text-muted-text font-bold">
                                Reported by <strong>u/{report.reporterName}</strong> • {report.createdAt ? formatDate(report.createdAt) : "Just now"}
                              </span>
                            </div>

                            {/* Reason details */}
                            <div className="space-y-1">
                              <p className="text-xs font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Reason: {report.reason.toUpperCase()}
                              </p>
                              {report.description && (
                                <p className="text-xs text-muted-text bg-muted-area/30 px-3 py-2 rounded-xl border border-border-theme/40 italic">
                                  "{report.description}"
                                </p>
                              )}
                            </div>

                            {/* Flagged content review */}
                            <div className="p-3 bg-muted-area/20 rounded-xl border border-border-theme/60 space-y-1">
                              <h4 className="text-xs font-black text-card-foreground">
                                {report.targetTitle}
                              </h4>
                              <p className="text-xs text-muted-text line-clamp-3">
                                {report.targetContent}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          {report.status === 'open' && (
                            <div className="flex flex-row lg:flex-col gap-2 shrink-0 lg:w-48 self-end lg:self-start">
                              <button
                                onClick={() => setEnforcingReport(report)}
                                className="flex-1 py-2 px-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/15"
                              >
                                <Ban className="w-3.5 h-3.5" /> Enforce Penalty
                              </button>
                              <button
                                onClick={() => handleDismissReport(report.id)}
                                className="flex-1 py-2 px-3 bg-muted-area hover:bg-muted-area/80 border border-border-theme text-xs font-black uppercase tracking-widest rounded-xl text-muted-text transition-all flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Dismiss Flag
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* APPEALS TICKET AGENT */}
            {activeTab === 'appeals' && (
              <div className="space-y-4">
                {appeals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border-theme border-dashed">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
                    <h3 className="text-sm font-black text-card-foreground uppercase tracking-wider">No Pending Appeals</h3>
                    <p className="text-xs text-muted-text max-w-xs text-center mt-1">
                      No restriction relief appeals waiting for response. Clear queue!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {appeals.map(appeal => (
                      <div 
                        key={appeal.id}
                        className={`bg-card rounded-2xl border p-4 sm:p-5 transition-all hover:shadow-lg relative overflow-hidden ${
                          appeal.status === 'pending'
                            ? "border-amber-500/20 bg-amber-500/[0.01]"
                            : appeal.status === 'approved'
                            ? "border-emerald-500/15 bg-emerald-500/[0.01]"
                            : "border-red-500/15 bg-red-500/[0.01]"
                        }`}
                      >
                        <div className={`absolute top-0 right-0 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-bl-xl ${
                          appeal.status === 'pending'
                            ? "bg-amber-500/10 text-amber-500"
                            : appeal.status === 'approved'
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-red-500/10 text-red-500"
                        }`}>
                          {appeal.status}
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-card-foreground">u/{appeal.userName}</span>
                              <span className="text-xxs text-muted-text">• Appeal Ticket ID: {appeal.id.slice(0, 8)} • {appeal.createdAt ? formatDate(appeal.createdAt) : "Just now"}</span>
                            </div>

                            <p className="text-xs text-muted-text bg-muted-area/40 p-3 rounded-xl border border-border-theme italic">
                              "{appeal.appealText}"
                            </p>

                            {appeal.moderatorNotes && (
                              <div className="text-xs p-3 bg-card rounded-xl border border-border-theme space-y-1">
                                <span className="font-black text-[10px] text-primary uppercase tracking-widest block">Decision Notes</span>
                                <p className="text-muted-text italic">"{appeal.moderatorNotes}"</p>
                              </div>
                            )}
                          </div>

                          {appeal.status === 'pending' && (
                            <div className="shrink-0 flex lg:flex-col gap-2 self-end lg:self-start lg:w-48">
                              <button
                                onClick={() => {
                                  setDecidingAppeal(appeal);
                                  setDecidingStatus("approved");
                                }}
                                className="flex-1 py-2 px-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-1.5"
                              >
                                <UserCheck className="w-3.5 h-3.5" /> Approve & Lift
                              </button>
                              <button
                                onClick={() => {
                                  setDecidingAppeal(appeal);
                                  setDecidingStatus("rejected");
                                }}
                                className="flex-1 py-2 px-3 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-500 transition-all flex items-center justify-center gap-1.5"
                              >
                                <UserMinus className="w-3.5 h-3.5" /> Reject Appeal
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* RESTRICTED USERS REGISTER */}
            {activeTab === 'banned' && (
              <div className="bg-card rounded-2xl border border-border-theme overflow-hidden">
                <div className="p-4 border-b border-border-theme bg-muted-area/10">
                  <h3 className="text-xs font-black uppercase tracking-widest text-card-foreground">Active Restrictions Registry</h3>
                </div>

                {bannedUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
                    <h4 className="text-xs font-black text-card-foreground uppercase tracking-wider">No Active Restrictions</h4>
                    <p className="text-[11px] text-muted-text mt-0.5">All community members are currently in good standing.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border-theme bg-muted-area/20 text-muted-text font-black text-[10px] uppercase tracking-widest">
                          <th className="p-4">User</th>
                          <th className="p-4">Restriction Type</th>
                          <th className="p-4">Reason</th>
                          <th className="p-4">Expires At</th>
                          <th className="p-4">Enforced By</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bannedUsers.map((ban) => (
                          <tr key={ban.id} className="border-b border-border-theme/60 text-xs hover:bg-muted-area/10">
                            <td className="p-4 font-black text-card-foreground">u/{ban.userName}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                ban.banType === 'mute'
                                  ? "bg-amber-500/10 text-amber-500"
                                  : ban.banType === 'shadow_ban'
                                  ? "bg-slate-500/10 text-slate-500"
                                  : "bg-red-500/10 text-red-500"
                              }`}>
                                {ban.banType.replace("_", " ")}
                              </span>
                            </td>
                            <td className="p-4 text-muted-text italic pr-8 max-w-xs truncate" title={ban.reason}>
                              "{ban.reason}"
                            </td>
                            <td className="p-4 text-muted-text font-medium">
                              {ban.expiresAt ? (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {formatDate({ toMillis: () => Date.parse(ban.expiresAt) })}
                                </span>
                              ) : (
                                "Indefinite / Permanent"
                              )}
                            </td>
                            <td className="p-4 text-muted-text">u/{ban.bannedBy}</td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleLiftBan(ban.userId, ban.userName)}
                                className="py-1 px-3 bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                              >
                                Lift Ban
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* IMMUTABLE ACTION AUDIT LOGS */}
            {activeTab === 'actions' && (
              <div className="bg-card rounded-2xl border border-border-theme overflow-hidden">
                <div className="p-4 border-b border-border-theme bg-muted-area/10 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-card-foreground">Immutable Enforcement Audit Trails</h3>
                  <span className="text-[10px] font-mono text-muted-text">SECURE-LOG-CHAIN</span>
                </div>

                {actions.length === 0 ? (
                  <div className="py-16 text-center text-muted-text text-xs">
                    No moderation logs saved yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border-theme bg-muted-area/20 text-muted-text font-black text-[10px] uppercase tracking-widest">
                          <th className="p-4">Timestamp</th>
                          <th className="p-4">Staff Moderator</th>
                          <th className="p-4">Target User</th>
                          <th className="p-4">Action Enforced</th>
                          <th className="p-4">Reason Statement</th>
                          <th className="p-4">Period</th>
                        </tr>
                      </thead>
                      <tbody>
                        {actions.map((act) => (
                          <tr key={act.id} className="border-b border-border-theme/60 text-xs hover:bg-muted-area/10">
                            <td className="p-4 font-mono text-muted-text">
                              {act.createdAt ? formatDate(act.createdAt) : "Just now"}
                            </td>
                            <td className="p-4 font-bold text-card-foreground">u/{act.moderatorName}</td>
                            <td className="p-4 font-bold text-card-foreground">u/{act.targetUserName}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                act.action === 'warning'
                                  ? "bg-amber-500/5 text-amber-500 border-amber-500/10"
                                  : act.action === 'mute'
                                  ? "bg-orange-500/5 text-orange-500 border-orange-500/10"
                                  : "bg-red-500/5 text-red-500 border-red-500/10"
                              }`}>
                                {act.action.replace("_", " ")}
                              </span>
                            </td>
                            <td className="p-4 text-muted-text italic max-w-xs truncate" title={act.reason}>
                              "{act.reason}"
                            </td>
                            <td className="p-4 text-muted-text">
                              {act.durationDays ? `${act.durationDays} Days` : "Permanent"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* INSIGHTS & ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Active Restrict Logs", val: activeBansCount, desc: "Currently banned or muted accounts", color: "text-red-500 bg-red-500/5" },
                    { label: "Pending Flags Queue", val: openReportsCount, desc: "Awaiting administrator resolution", color: "text-amber-500 bg-amber-500/5" },
                    { label: "Enforcements Logged", val: actions.length, desc: "Immutable total enforcement events", color: "text-indigo-500 bg-indigo-500/5" },
                    { label: "Pending Appeals", val: appeals.filter(a => a.status === 'pending').length, desc: "User relief ticket submissions", color: "text-emerald-500 bg-emerald-500/5" },
                  ].map((s, idx) => (
                    <div key={idx} className="bg-card p-5 rounded-2xl border border-border-theme shadow-sm space-y-2">
                      <p className="text-[10px] font-black text-muted-text uppercase tracking-widest">{s.label}</p>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-black ${s.color.split(" ")[0]}`}>{s.val}</span>
                        <span className="text-[10px] text-muted-text font-mono">active</span>
                      </div>
                      <p className="text-xxs text-muted-text leading-snug">{s.desc}</p>
                    </div>
                  ))}
                </div>

                {/* SVG Visual Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Flag Reason Distributions */}
                  <div className="bg-card p-5 rounded-2xl border border-border-theme space-y-4">
                    <div className="border-b border-border-theme pb-2 flex justify-between items-center">
                      <h3 className="text-xs font-black uppercase tracking-widest text-card-foreground">Flag Reason Distributions</h3>
                      <span className="text-[10px] text-muted-text">Category Map</span>
                    </div>

                    <div className="space-y-4 pt-2">
                      {["spam", "harassment", "hate_speech", "violence", "misinformation", "other"].map(reason => {
                        const count = reasonCounts[reason] || 0;
                        const total = reports.length || 1;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={reason} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-card-foreground">
                              <span className="uppercase tracking-wider text-[10px]">{reason.replace("_", " ")}</span>
                              <span className="font-mono text-muted-text">{count} ({pct}%)</span>
                            </div>
                            <div className="w-full h-2 bg-muted-area rounded-full overflow-hidden border border-border-theme/40">
                              <div 
                                className="h-full bg-primary rounded-full" 
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Enforcement Type Breaks */}
                  <div className="bg-card p-5 rounded-2xl border border-border-theme space-y-4">
                    <div className="border-b border-border-theme pb-2 flex justify-between items-center">
                      <h3 className="text-xs font-black uppercase tracking-widest text-card-foreground">Action Distributions</h3>
                      <span className="text-[10px] text-muted-text">Action Mix</span>
                    </div>

                    <div className="space-y-4 pt-2">
                      {["warning", "mute", "temp_ban", "perm_ban", "shadow_ban"].map(act => {
                        const count = actionCounts[act] || 0;
                        const total = actions.length || 1;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={act} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-card-foreground">
                              <span className="uppercase tracking-wider text-[10px]">{act.replace("_", " ")}</span>
                              <span className="font-mono text-muted-text">{count} ({pct}%)</span>
                            </div>
                            <div className="w-full h-2 bg-muted-area rounded-full overflow-hidden border border-border-theme/40">
                              <div 
                                className="h-full bg-red-500 rounded-full" 
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ENFORCEMENT PENALTY MODAL */}
        <AnimatePresence>
          {enforcingReport && (
            <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEnforcingReport(null)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              />

              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border-theme overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="p-4 border-b border-border-theme bg-red-500/5 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-card-foreground flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" /> Enforce Penalty
                  </h3>
                  <button 
                    onClick={() => setEnforcingReport(null)}
                    className="p-1.5 hover:bg-muted-area rounded-lg text-muted-text text-xs font-bold"
                  >
                    Close
                  </button>
                </div>

                <form onSubmit={handleEnforceAction} className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
                  {/* Content Target Review */}
                  <div className="p-3.5 bg-muted-area/40 rounded-xl border border-border-theme space-y-1">
                    <span className="text-[10px] font-mono text-muted-text uppercase block">TARGET LOGS</span>
                    <p className="text-xs font-black text-card-foreground line-clamp-1">"{enforcingReport.targetTitle}"</p>
                    <p className="text-xs text-muted-text italic line-clamp-2">"{enforcingReport.targetContent}"</p>
                  </div>

                  {/* Penalty Selection */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-text mb-2">
                      Restriction Action / सजाय प्रकार
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {([
                        { value: "warning", label: "Warning", desc: "No restriction" },
                        { value: "mute", label: "Mute", desc: "Muted from posts" },
                        { value: "temp_ban", label: "Temp Ban", desc: "Temporary block" },
                        { value: "perm_ban", label: "Perm Ban", desc: "Indefinite block" },
                        { value: "shadow_ban", label: "Shadow Ban", desc: "Silent hide" },
                      ] as const).map(p => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setEnforcementType(p.value)}
                          className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                            enforcementType === p.value
                              ? "bg-red-500/5 border-red-500 ring-1 ring-red-500/25 shadow-sm"
                              : "bg-muted-area/20 border-border-theme hover:bg-muted-area/40"
                          }`}
                        >
                          <span className="text-xs font-black text-card-foreground">{p.label}</span>
                          <span className="text-[9px] text-muted-text mt-0.5">{p.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Temporary Ban/Mute Duration */}
                  {(enforcementType === "mute" || enforcementType === "temp_ban") && (
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-muted-text mb-1.5">
                        Duration (Days) / सजाय अवधि (दिन)
                      </label>
                      <select
                        value={enforcementDuration}
                        onChange={(e) => setEnforcementDuration(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-border-theme bg-muted-area/30 text-card-foreground outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="1">1 Day / १ दिन</option>
                        <option value="3">3 Days / ३ दिन</option>
                        <option value="7">7 Days / ७ दिन</option>
                        <option value="30">30 Days / ३० दिन</option>
                      </select>
                    </div>
                  )}

                  {/* Remove target content toggle */}
                  <label className="flex items-center gap-3 p-3 bg-muted-area/20 rounded-xl border border-border-theme cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={removeContent}
                      onChange={(e) => setRemoveContent(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <div className="text-left">
                      <span className="text-xs font-black text-card-foreground block">Remove Abusive Content</span>
                      <span className="text-[10px] text-muted-text">Soft-delete post or permanently purge comment.</span>
                    </div>
                  </label>

                  {/* Enforcement Reason Statement */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-text mb-1.5">
                      Reason Statement (Visible to Target User) / कारण स्पष्टीकरण
                    </label>
                    <textarea
                      value={enforcementReason}
                      onChange={(e) => setEnforcementReason(e.target.value)}
                      rows={3}
                      placeholder="e.g. Hate speech and target bullying violating community section 3.2..."
                      className="w-full text-xs p-3 rounded-xl border border-border-theme bg-muted-area/30 text-card-foreground placeholder:text-muted-text/50 outline-none resize-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setEnforcingReport(null)}
                      className="flex-1 py-3 bg-muted-area text-muted-text rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-muted-area/80 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loadingAction}
                      className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-500 transition-all flex items-center justify-center gap-1.5"
                    >
                      {loadingAction ? "Processing..." : "Enforce & Close"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* APPEAL DECISION MODAL */}
        <AnimatePresence>
          {decidingAppeal && (
            <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDecidingAppeal(null)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              />

              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border-theme overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="p-4 border-b border-border-theme bg-muted-area/30 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-card-foreground">
                    Process Restriction Appeal
                  </h3>
                  <button 
                    onClick={() => setDecidingAppeal(null)}
                    className="p-1.5 hover:bg-muted-area rounded-lg text-muted-text text-xs font-bold"
                  >
                    Close
                  </button>
                </div>

                <form onSubmit={handleDecideAppeal} className="p-5 space-y-4">
                  {/* User appeal text review */}
                  <div className="p-4 bg-muted-area/40 rounded-xl border border-border-theme space-y-1.5">
                    <span className="text-[9px] font-black text-muted-text uppercase block">Appeal Statement</span>
                    <p className="text-xs font-black text-card-foreground">u/{decidingAppeal.userName}</p>
                    <p className="text-xs text-muted-text italic">"{decidingAppeal.appealText}"</p>
                  </div>

                  {/* Decision Type */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-text mb-2">
                      Decision Action / निर्णय प्रकार
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDecidingStatus("approved")}
                        className={`py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${
                          decidingStatus === "approved"
                            ? "bg-emerald-600/10 border-emerald-500 text-emerald-600 font-black shadow-sm"
                            : "bg-muted-area/20 border-border-theme text-muted-text"
                        }`}
                      >
                        Approve & Lift
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecidingStatus("rejected")}
                        className={`py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${
                          decidingStatus === "rejected"
                            ? "bg-red-600/10 border-red-500 text-red-600 font-black shadow-sm"
                            : "bg-muted-area/20 border-border-theme text-muted-text"
                        }`}
                      >
                        Reject Appeal
                      </button>
                    </div>
                  </div>

                  {/* Decision Notes */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-text mb-1.5">
                      Decision Notes (Visible to User) / निर्णयको विवरण
                    </label>
                    <textarea
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      rows={3}
                      placeholder="e.g. Ban lifted after user acknowledged norms and apologized in good faith..."
                      className="w-full text-xs p-3 rounded-xl border border-border-theme bg-muted-area/30 text-card-foreground placeholder:text-muted-text/50 outline-none resize-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setDecidingAppeal(null)}
                      className="flex-1 py-3 bg-muted-area text-muted-text rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-muted-area/80 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`flex-1 py-3 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all ${
                        decidingStatus === "approved" ? "bg-emerald-600" : "bg-red-600"
                      }`}
                    >
                      Submit Decision
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
