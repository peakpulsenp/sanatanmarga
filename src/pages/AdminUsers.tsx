import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, UserPlus, Search, Filter, ShieldCheck, ShieldAlert, Key, 
  Award, Sparkles, CheckCircle2, XCircle, AlertTriangle, Layers, 
  Crown, Edit2, Ban, UserCheck, RefreshCw, Check, Info, ChevronRight,
  Sliders, MapPin, Mail, DollarSign, BookOpen, Star
} from "lucide-react";
import { collection, query, orderBy, safeOnSnapshot as onSnapshot, doc, updateDoc } from "@/src/lib/firebase";
import { db, auth, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { usePermissions } from "@/src/context/PermissionsContext";
import { 
  PERMISSIONS, 
  PERMISSION_PACKAGES,
  ROLE_DEFINITIONS, 
  MEMBERSHIP_TIERS, 
  REPUTATION_LEVELS, 
  REPUTATION_POINTS,
  UserPermission,
  RoleDefinition,
  MembershipPlan,
  ReputationLevelInfo
} from "@/src/constants/permissions";
import type { User } from "@/src/types";
import type { MembershipTier, ReputationLevelKey } from "@/src/types/membership";
import AdminLayout from "@/src/components/layout/AdminLayout";
import NotificationBell from "@/src/components/notifications/NotificationBell";
import { toast } from "sonner";
import { AdminSkeleton } from "@/src/components/ui/PageLoaders";

export default function AdminUsers() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const { hasPermission, isSuperAdmin, isAdmin } = usePermissions();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"directory" | "permission_matrix" | "membership_tiers" | "reputation_os" | "audit_logs">("directory");

  // AuditOS Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const loadAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/audit-logs", {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setAuditLogs(data.logs);
      }
    } catch (e) {
      console.warn("Audit log fetch error:", e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleImpersonateUser = async (targetUser: User) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ targetUid: targetUser.uid })
      });
      const data = await res.json();
      if (data.success && data.impersonation) {
        sessionStorage.setItem("sanatan_impersonation", JSON.stringify(data.impersonation));
        toast.success(`Governance Mode Active: Acting as ${targetUser.email}`);
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to initiate impersonation session");
      }
    } catch (err: any) {
      toast.error(err.message || "Impersonation request failed");
    }
  };

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>("all");

  // Selection for Bulk Actions
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState<boolean>(false);

  // User Profile Drawer / Permissions Modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modal Editing Form State
  const [editRole, setEditRole] = useState<string>("public");
  const [editTier, setEditTier] = useState<MembershipTier>("free");
  const [editStatus, setEditStatus] = useState<"active" | "suspended" | "banned">("active");
  const [editDistrict, setEditDistrict] = useState<string>("");
  const [editReputationScore, setEditReputationScore] = useState<number>(0);
  const [editCustomPermissions, setEditCustomPermissions] = useState<Set<string>>(new Set());

  // Add New User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({ email: "", displayName: "", password: "", role: "member" });

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate("/login");
    }
  }, [currentUser, authLoading, navigate]);

  useEffect(() => {
    if (authLoading || !currentUser) return;

    // Fetch users list
    const loadUsers = async () => {
      setLoading(true);
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/admin/users", {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          // Firestore fallback
          const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
            setUsers(usersData);
          });
          return () => unsubscribe();
        }
      } catch (err) {
        console.warn("Failed to load users via API, using Firestore fallback:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [currentUser, authLoading]);

  // Handle drawer opening for user permissions editing
  const openUserDrawer = (u: User) => {
    setSelectedUser(u);
    setEditRole(u.role || "public");
    setEditTier(u.membershipTier || "free");
    setEditStatus(u.status || "active");
    setEditDistrict(u.district || "");
    setEditReputationScore(u.reputationScore || 0);

    const initialCustomPerms = new Set<string>(u.customPermissions || []);
    setEditCustomPermissions(initialCustomPerms);
    setDrawerOpen(true);
  };

  const handleTogglePermission = (permissionKey: string) => {
    setEditCustomPermissions(prev => {
      const next = new Set(prev);
      if (next.has(permissionKey)) {
        next.delete(permissionKey);
      } else {
        next.add(permissionKey);
      }
      return next;
    });
  };

  const handleSaveUserProfile = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const payload = {
        role: editRole,
        membershipTier: editTier,
        status: editStatus,
        district: editDistrict,
        reputationScore: editReputationScore,
        customPermissions: Array.from(editCustomPermissions)
      };

      const res = await fetch(`/api/users/${selectedUser.uid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        // Direct Firestore fallback
        await updateDoc(doc(db, "users", selectedUser.uid), payload);
      }

      toast.success("प्रयोगकर्ता विवरण र अनुमतिहरू सफलतापुर्वक अद्यावधिक गरियो।");
      
      // Update local state
      setUsers(prev => prev.map(u => u.uid === selectedUser.uid ? { ...u, ...payload } : u));
      setDrawerOpen(false);
    } catch (err: any) {
      toast.error("अपडेट असफल भयो: " + err.message);
    } fontFinally: {
      setIsSubmitting(false);
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.email || !addFormData.password || !addFormData.displayName) {
      toast.error("कृपया सबै विवरणहरू भर्नुहोस्।");
      return;
    }
    setIsSubmitting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify(addFormData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "User creation failed");

      toast.success("नयाँ प्रयोगकर्ता सफलतापुर्वक सिर्जना गरियो!");
      setIsAddModalOpen(false);
      setAddFormData({ email: "", displayName: "", password: "", role: "member" });
      
      // Refresh list
      const reloadRes = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${idToken}` } });
      const reloadData = await reloadRes.json();
      if (reloadData.success) setUsers(reloadData.users);
    } catch (err: any) {
      toast.error("त्रुटि: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk Actions Handling
  const toggleSelectUser = (uid: string) => {
    setSelectedUids(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUids.size === filteredUsers.length) {
      setSelectedUids(new Set());
    } else {
      setSelectedUids(new Set(filteredUsers.map(u => u.uid)));
    }
  };

  const handleBulkAction = async (action: string, extraVal?: any) => {
    if (selectedUids.size === 0) {
      toast.error("कृपया पहिले कम्तीमा एक प्रयोगकर्ता चयन गर्नुहोस्।");
      return;
    }

    setBulkProcessing(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const payload: any = {
        uids: Array.from(selectedUids),
        action
      };

      if (action === "promote_role") payload.targetRole = extraVal;
      if (action === "assign_tier") payload.targetTier = extraVal;
      if (action === "adjust_reputation") payload.reputationDelta = Number(extraVal) || 25;

      const res = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk action failed");

      toast.success(data.message || "बल्क कारबाही सफलतापुर्वक सम्पन्न भयो।");
      setSelectedUids(new Set());

      // Refresh list
      const reloadRes = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${idToken}` } });
      const reloadData = await reloadRes.json();
      if (reloadData.success) setUsers(reloadData.users);
    } catch (err: any) {
      toast.error("बल्क कारबाही त्रुटि: " + err.message);
    } finally {
      setBulkProcessing(false);
    }
  };

  // Filtered Users computation
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.district?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRoleFilter === "all" || u.role === selectedRoleFilter;
    const matchesTier = selectedTierFilter === "all" || (u.membershipTier || "free") === selectedTierFilter;
    const matchesStatus = selectedStatusFilter === "all" || (u.status || "active") === selectedStatusFilter;
    const matchesDistrict = selectedDistrictFilter === "all" || u.district === selectedDistrictFilter;

    return matchesSearch && matchesRole && matchesTier && matchesStatus && matchesDistrict;
  });

  // Calculate statistics
  const totalUsersCount = users.length;
  const activeSubscribersCount = users.filter(u => u.membershipTier && u.membershipTier !== "free").length;
  const activeReportersCount = users.filter(u => u.role === "reporter" || u.role === "editor" || u.role === "senior_editor").length;
  const pendingRoleRequests = users.filter(u => u.roleRequest?.status === "pending").length;

  if (authLoading || loading) return <AdminSkeleton />;

  return (
    <AdminLayout>
      <div className="space-y-8 px-4 sm:px-8 py-6">
        
        {/* HEADER BAR */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm">
                <Users size={26} />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight font-display">
                  MembershipOS & PermissionsOS
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  केन्द्रीकृत सदस्यता, भूमिका, सूक्ष्म अनुमति (Granular Permissions) र प्रतिष्ठा प्रणाली।
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all text-xs"
            >
              <UserPlus size={16} />
              <span>नयाँ प्रयोगकर्ता थप्नुहोस्</span>
            </button>
          </div>
        </header>

        {/* METRICS DASHBOARD CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>कुल दर्ता प्रयोगकर्ता</span>
              <Users size={18} className="text-amber-500" />
            </div>
            <div className="text-2xl font-black text-foreground font-mono">{totalUsersCount}</div>
            <div className="text-[11px] text-muted-foreground">सनातन मार्ग डिजिटल नेटवर्क</div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>सक्रिय प्रिमियम सदस्यहरू</span>
              <Crown size={18} className="text-purple-500" />
            </div>
            <div className="text-2xl font-black text-foreground font-mono">{activeSubscribersCount}</div>
            <div className="text-[11px] text-emerald-500 font-semibold">Patron, Sadhak, Sanrakshak & Corporate</div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>सम्पादकीय तथा संवाददाता टिम</span>
              <ShieldCheck size={18} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-foreground font-mono">{activeReportersCount}</div>
            <div className="text-[11px] text-muted-foreground">Reporter, Editor & Senior Editor</div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>लम्बित भूमिका अनुरोधहरू</span>
              <AlertTriangle size={18} className="text-amber-500" />
            </div>
            <div className="text-2xl font-black text-foreground font-mono">{pendingRoleRequests}</div>
            <div className="text-[11px] text-amber-500 font-semibold">समीक्षा पर्खिरहेको अनुरोध</div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="border-b border-border overflow-x-auto no-scrollbar">
          <nav className="flex space-x-6 min-w-max">
            {[
              { id: "directory", labelNe: "प्रयोगकर्ता डाइरेक्टरी (User Directory)", icon: Users },
              { id: "permission_matrix", labelNe: "अनुमति म्याट्रिक्स (PermissionsOS Catalog)", icon: Key },
              { id: "membership_tiers", labelNe: "सदस्यता योजनाहरू (Membership Tiers)", icon: Crown },
              { id: "reputation_os", labelNe: "प्रतिष्ठा प्रणाली (ReputationOS Rules)", icon: Award },
              { id: "audit_logs", labelNe: "सुरक्षा तथा अडिट लगहरू (AuditOS Logs)", icon: ShieldAlert },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id === "audit_logs") {
                      loadAuditLogs();
                    }
                  }}
                  className={`flex items-center gap-2 py-3 px-1 border-b-2 font-bold text-xs transition-colors ${
                    isActive
                      ? "border-amber-500 text-amber-500"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.labelNe}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* TAB 1: USER DIRECTORY & PERMISSIONS MANAGEMENT */}
        {activeTab === "directory" && (
          <div className="space-y-6">
            
            {/* SEARCH & FILTERS BAR */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Search */}
                <div className="md:col-span-5 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="नाम, इमेल वा जिल्लाबाट खोज्नुहोस्..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Role Filter */}
                <div className="md:col-span-2">
                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground"
                  >
                    <option value="all">सबै भूमिकाहरू (All Roles)</option>
                    {Object.keys(ROLE_DEFINITIONS).map(r => (
                      <option key={r} value={r}>{ROLE_DEFINITIONS[r].nameNe}</option>
                    ))}
                  </select>
                </div>

                {/* Tier Filter */}
                <div className="md:col-span-2">
                  <select
                    value={selectedTierFilter}
                    onChange={(e) => setSelectedTierFilter(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground"
                  >
                    <option value="all">सबै सदस्यता (All Tiers)</option>
                    {Object.keys(MEMBERSHIP_TIERS).map(t => (
                      <option key={t} value={t}>{MEMBERSHIP_TIERS[t].nameNe}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="md:col-span-3">
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground"
                  >
                    <option value="all">सबै स्थिति (All Status)</option>
                    <option value="active">सक्रिय (Active)</option>
                    <option value="suspended">निलम्बित (Suspended)</option>
                    <option value="banned">प्रतिबन्धित (Banned)</option>
                  </select>
                </div>

              </div>

              {/* BULK ACTION TOOLBAR (When Items Selected) */}
              {selectedUids.size > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
                    <Sliders size={16} />
                    <span>{selectedUids.size} जना प्रयोगकर्ता चयन गरिएको छ</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleBulkAction("promote_role", e.target.value);
                          e.target.value = "";
                        }
                      }}
                      disabled={bulkProcessing}
                      className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-bold"
                    >
                      <option value="">-- भूमिका परिवर्तन गर्नुहोस् --</option>
                      {Object.keys(ROLE_DEFINITIONS).map(r => (
                        <option key={r} value={r}>{ROLE_DEFINITIONS[r].nameNe}</option>
                      ))}
                    </select>

                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleBulkAction("assign_tier", e.target.value);
                          e.target.value = "";
                        }
                      }}
                      disabled={bulkProcessing}
                      className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-bold"
                    >
                      <option value="">-- सदस्यता तोक्नुहोस् --</option>
                      {Object.keys(MEMBERSHIP_TIERS).map(t => (
                        <option key={t} value={t}>{MEMBERSHIP_TIERS[t].nameNe}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleBulkAction("suspend")}
                      disabled={bulkProcessing}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 font-bold"
                    >
                      निलम्बित (Suspend)
                    </button>

                    <button
                      onClick={() => handleBulkAction("ban")}
                      disabled={bulkProcessing}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 font-bold"
                    >
                      प्रतिबन्ध (Ban)
                    </button>

                    <button
                      onClick={() => handleBulkAction("reset_permissions")}
                      disabled={bulkProcessing}
                      className="px-3 py-1.5 rounded-lg border border-border hover:bg-accent font-bold"
                    >
                      अनुमति रिसेट (Reset Perms)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* USERS TABLE DIRECTORY (DESKTOP) */}
            <div className="hidden md:block rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-accent/40 border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4 w-10">
                        <input
                          type="checkbox"
                          checked={selectedUids.size > 0 && selectedUids.size === filteredUsers.length}
                          onChange={toggleSelectAll}
                          className="rounded border-border text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-4">प्रयोगकर्ता (User)</th>
                      <th className="p-4">भूमिका (Role)</th>
                      <th className="p-4">सदस्यता (Tier)</th>
                      <th className="p-4">प्रतिष्ठा (Reputation)</th>
                      <th className="p-4">जिल्ला (District)</th>
                      <th className="p-4">स्थिति (Status)</th>
                      <th className="p-4 text-right">कार्य (Action)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => {
                        const roleDef = ROLE_DEFINITIONS[u.role] || ROLE_DEFINITIONS["public"];
                        const tierDef = MEMBERSHIP_TIERS[u.membershipTier || "free"] || MEMBERSHIP_TIERS["free"];
                        const isSelected = selectedUids.has(u.uid);

                        return (
                          <tr key={u.uid} className={`hover:bg-accent/20 transition-colors ${isSelected ? "bg-amber-500/5" : ""}`}>
                            <td className="p-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectUser(u.uid)}
                                className="rounded border-border text-amber-500 focus:ring-amber-500 cursor-pointer"
                              />
                            </td>

                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold flex items-center justify-center uppercase">
                                  {u.displayName ? u.displayName.charAt(0) : "U"}
                                </div>
                                <div>
                                  <div className="font-bold text-foreground">{u.displayName || "नाम नभएको प्रयोगकर्ता"}</div>
                                  <div className="text-[11px] text-muted-foreground">{u.email}</div>
                                </div>
                              </div>
                            </td>

                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${roleDef.badgeColor}`}>
                                {roleDef.nameNe}
                              </span>
                            </td>

                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${tierDef.badgeColor}`}>
                                {tierDef.nameNe}
                              </span>
                            </td>

                            <td className="p-4 font-mono font-bold text-foreground">
                              <div className="flex items-center gap-1.5">
                                <Award size={14} className="text-amber-500" />
                                <span>{u.reputationScore || 0} pts</span>
                              </div>
                            </td>

                            <td className="p-4 text-muted-foreground">
                              {u.district || "—"}
                            </td>

                            <td className="p-4">
                              {u.status === "banned" ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                  प्रतिबन्धित (Banned)
                                </span>
                              ) : u.status === "suspended" ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                  निलम्बित (Suspended)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  सक्रिय (Active)
                                </span>
                              )}
                            </td>

                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isSuperAdmin && u.uid !== currentUser?.uid && (
                                  <button
                                    onClick={() => handleImpersonateUser(u)}
                                    title="Governance Mode: Login As User"
                                    className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white font-bold text-[11px] transition-colors flex items-center gap-1"
                                  >
                                    <ShieldAlert size={13} />
                                    <span>Login As</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => openUserDrawer(u)}
                                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-slate-950 font-bold text-xs transition-colors flex items-center gap-1"
                                >
                                  <Key size={14} />
                                  <span>अनुमति (Edit)</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-xs text-muted-foreground">
                          कुनै प्रयोगकर्ता भेटिएन।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* USERS CARD STACK (MOBILE ONLY) */}
            <div className="block md:hidden space-y-4">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const roleDef = ROLE_DEFINITIONS[u.role] || ROLE_DEFINITIONS["public"];
                  const tierDef = MEMBERSHIP_TIERS[u.membershipTier || "free"] || MEMBERSHIP_TIERS["free"];
                  const isSelected = selectedUids.has(u.uid);

                  return (
                    <div key={u.uid} className={`p-4 rounded-2xl border border-border bg-card shadow-sm space-y-3 ${isSelected ? "ring-2 ring-primary bg-primary/5" : ""}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectUser(u.uid)}
                            className="rounded border-border text-amber-500 focus:ring-amber-500 cursor-pointer"
                          />
                          <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold flex items-center justify-center uppercase">
                            {u.displayName ? u.displayName.charAt(0) : "U"}
                          </div>
                          <div>
                            <div className="font-bold text-foreground">{u.displayName || "नाम नभएको प्रयोगकर्ता"}</div>
                            <div className="text-[11px] text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                        <div>
                          {u.status === "banned" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                              Banned
                            </span>
                          ) : u.status === "suspended" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              Suspended
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xxs pt-1">
                        <div>
                          <div className="text-muted-foreground font-bold">भूमिका (Role)</div>
                          <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${roleDef.badgeColor}`}>
                            {roleDef.nameNe}
                          </span>
                        </div>
                        <div>
                          <div className="text-muted-foreground font-bold">सदस्यता (Tier)</div>
                          <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${tierDef.badgeColor}`}>
                            {tierDef.nameNe}
                          </span>
                        </div>
                        <div>
                          <div className="text-muted-foreground font-bold">प्रतिष्ठा (Reputation)</div>
                          <div className="flex items-center gap-1 font-mono font-bold text-foreground mt-0.5">
                            <Award size={12} className="text-amber-500" />
                            <span>{u.reputationScore || 0} pts</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground font-bold">जिल्ला (District)</div>
                          <div className="text-foreground font-bold mt-0.5">{u.district || "—"}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                        {isSuperAdmin && u.uid !== currentUser?.uid && (
                          <button
                            onClick={() => handleImpersonateUser(u)}
                            className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white font-bold text-[11px] transition-colors flex items-center gap-1"
                          >
                            <ShieldAlert size={13} />
                            <span>Login As</span>
                          </button>
                        )}
                        <button
                          onClick={() => openUserDrawer(u)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-slate-950 font-bold text-xs transition-colors flex items-center gap-1"
                        >
                          <Key size={14} />
                          <span>अनुमति (Edit)</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground rounded-2xl border border-border bg-card">
                  कुनै प्रयोगकर्ता भेटिएन।
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: PERMISSIONS CATALOG & ROLE MATRIX */}
        {activeTab === "permission_matrix" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2 font-display">
                    <Key className="text-amber-500" size={20} />
                    <span>PermissionsOS भूमिका तथा अनुमति म्याट्रिक्स (Role Catalog)</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    hardcoded रोल चेकको सट्टा अधिकार र अनुमतिमा आधारित सुदृढ सुरक्षा प्रणाली।
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-border rounded-xl">
                  <thead className="bg-accent/40 border-b border-border font-bold uppercase text-muted-foreground">
                    <tr>
                      <th className="p-3">भूमिका (Role)</th>
                      <th className="p-3">विवरण (Description)</th>
                      <th className="p-3">अनुमतिहरूको सूची (Explicit Permissions Granted)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {Object.values(ROLE_DEFINITIONS).map((role) => (
                      <tr key={role.id} className="hover:bg-accent/20">
                        <td className="p-3 font-bold text-foreground">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] border ${role.badgeColor}`}>
                            {role.nameNe}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs max-w-xs">
                          {role.descriptionNe}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1.5">
                            {role.permissions.includes("*") ? (
                              <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-bold text-[10px]">
                                * FULL SYSTEM UNRESTRICTED ACCESS
                              </span>
                            ) : role.permissions.length > 0 ? (
                              role.permissions.map(p => (
                                <span key={p} className="px-2 py-0.5 rounded bg-accent border border-border font-mono text-[10px] text-amber-500">
                                  {p}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground italic text-[11px]">कुनै विशेष प्रशासनिक अनुमति छैन (साधारण पढ्ने मात्र)</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MEMBERSHIP TIERS */}
        {activeTab === "membership_tiers" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {Object.values(MEMBERSHIP_TIERS).map((plan) => (
                <div key={plan.id} className={`p-5 rounded-2xl border bg-card flex flex-col justify-between space-y-4 shadow-sm relative ${plan.isPopular ? "border-amber-500 ring-1 ring-amber-500/50" : "border-border"}`}>
                  {plan.isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-amber-500 text-slate-950 shadow-sm">
                      लोकप्रिय
                    </span>
                  )}

                  <div className="space-y-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${plan.badgeColor}`}>
                      {plan.badgeNe}
                    </span>
                    <h3 className="text-base font-bold text-foreground">{plan.nameNe}</h3>
                    <div className="text-xl font-black text-amber-500 font-mono">
                      {plan.priceNprMonthly === 0 ? "निःशुल्क" : `रु ${plan.priceNprMonthly} / महिना`}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{plan.taglineNe}</p>
                  </div>

                  <ul className="space-y-2 text-xs border-t border-border pt-3">
                    {plan.benefitsNe.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground">
                        <CheckCircle2 size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: REPUTATION OS RULES */}
        {activeTab === "reputation_os" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3 font-display">
                  <Award size={18} className="text-amber-500" />
                  <span>ReputationOS तहहरू (Level Progression)</span>
                </h3>

                <div className="space-y-3">
                  {REPUTATION_LEVELS.map((lvl) => (
                    <div key={lvl.levelKey} className="p-3.5 rounded-xl border border-border bg-accent/20 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${lvl.badgeColor}`}>
                            {lvl.nameNe}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground">({lvl.minPoints} - {lvl.maxPoints === 999999 ? "असीमित" : lvl.maxPoints} pts)</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{lvl.perksNe}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3 font-display">
                  <Star size={18} className="text-amber-500" />
                  <span>प्रतिष्ठा अङ्क बाँडफाँड तालिका</span>
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-accent/30 border border-border">
                    <span className="font-semibold text-foreground">समाचार लेख/रिपोर्ट प्रकाशन</span>
                    <span className="font-mono font-bold text-amber-500">+२० pts</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-accent/30 border border-border">
                    <span className="font-semibold text-foreground">प्रमाणित नागरिक प्रतिवेदन (Verified Report)</span>
                    <span className="font-mono font-bold text-amber-500">+१५ pts</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-accent/30 border border-border">
                    <span className="font-semibold text-foreground">उपयोगी उत्तर / अपभोट (Helpful Answer)</span>
                    <span className="font-mono font-bold text-amber-500">+५ pts</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-accent/30 border border-border">
                    <span className="font-semibold text-foreground">चौतारी सामुदायिक पोष्ट</span>
                    <span className="font-mono font-bold text-amber-500">+३ pts</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-accent/30 border border-border">
                    <span className="font-semibold text-foreground">टिप्पणी तथा प्रतिक्रिया</span>
                    <span className="font-mono font-bold text-amber-500">+१ pt</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT OS SECURITY LOGS */}
        {activeTab === "audit_logs" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground font-display flex items-center gap-2">
                  <ShieldAlert size={20} className="text-amber-500" />
                  <span>प्रणाली सुरक्षा तथा सुशासन लगहरू (AuditOS Governance Trail)</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  भूमिका परिवर्तन, अनुमति परिमार्जन, बुलेटिन स्वीकृति तथा प्रशासकीय कार्यहरूको वास्तविक-समय लग।
                </p>
              </div>
              <button
                onClick={loadAuditLogs}
                disabled={loadingLogs}
                className="px-3.5 py-2 rounded-xl bg-accent hover:bg-accent/80 font-bold text-xs flex items-center gap-2 border border-border"
              >
                <RefreshCw size={14} className={loadingLogs ? "animate-spin text-amber-500" : ""} />
                <span>पुनः लोड गर्नुहोस्</span>
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-accent/40 border-b border-border text-muted-foreground font-bold uppercase tracking-wider font-sans">
                    <tr>
                      <th className="p-4">समय (Timestamp)</th>
                      <th className="p-4">कर्ता (Actor)</th>
                      <th className="p-4">कार्य (Action)</th>
                      <th className="p-4">लक्ष्य (Target)</th>
                      <th className="p-4">स्थिति (Status)</th>
                      <th className="p-4">विवरण (Details)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {auditLogs.length > 0 ? (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-accent/20 transition-colors">
                          <td className="p-4 text-muted-foreground text-[11px] whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString("ne-NP")}
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-foreground">{log.actorEmail || log.actorUid}</div>
                            <div className="text-[10px] text-amber-500">{log.actorRole}</div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              log.action.includes("DENIED") || log.action.includes("PRIVILEGE")
                                ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                : log.action.includes("impersonation")
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground text-[11px]">
                            {log.targetUid || log.resourceId || "—"}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.status === "DENIED" || log.status === "FAILED"
                                ? "bg-rose-500 text-white"
                                : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            }`}>
                              {log.status || "SUCCESS"}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground text-[11px] max-w-xs truncate">
                            {JSON.stringify(log.details || log.after || {})}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-xs text-muted-foreground font-sans">
                          {loadingLogs ? "अडिट लगहरू लोड हुँदैछ..." : "कुनै अडिट लग भेटिएन।"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* USER PROFILE & GRANULAR PERMISSIONS DRAWER */}
      {drawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end animate-in fade-in">
          <div className="w-full max-w-2xl bg-card border-l border-border h-full overflow-y-auto p-6 space-y-6 shadow-2xl flex flex-col justify-between">
            
            <div className="space-y-6">
              
              {/* Drawer Top Bar */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground font-display">
                    प्रयोगकर्ता प्रोफाइल तथा सूक्ष्म अनुमति (Granular Permissions)
                  </h3>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* Role, Tier & Status Selector Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">प्लेटफर्म भूमिका (Role):</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-bold text-foreground"
                  >
                    {Object.keys(ROLE_DEFINITIONS).map(r => (
                      <option key={r} value={r}>{ROLE_DEFINITIONS[r].nameNe}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">सदस्यता योजना (Membership Tier):</label>
                  <select
                    value={editTier}
                    onChange={(e) => setEditTier(e.target.value as MembershipTier)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-bold text-foreground"
                  >
                    {Object.keys(MEMBERSHIP_TIERS).map(t => (
                      <option key={t} value={t}>{MEMBERSHIP_TIERS[t].nameNe}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">खाता स्थिति (Account Status):</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-bold text-foreground"
                  >
                    <option value="active">सक्रिय (Active)</option>
                    <option value="suspended">निलम्बित (Suspended)</option>
                    <option value="banned">प्रतिबन्धित (Banned)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">जिल्ला (District):</label>
                  <input
                    type="text"
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    placeholder="जस्तै: Kathmandu, Kaski, Jhapa"
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-medium text-foreground"
                  />
                </div>
              </div>

              {/* Reputation Points Adjuster */}
              <div className="p-4 rounded-xl border border-border bg-accent/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">प्रतिष्ठा अङ्क (Reputation Score):</span>
                  <span className="font-mono font-bold text-amber-500">{editReputationScore} pts</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditReputationScore(prev => prev + 20)}
                    className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 font-bold text-[11px] border border-amber-500/20"
                  >
                    +२० अङ्क बोनस
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditReputationScore(prev => prev + 50)}
                    className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 font-bold text-[11px] border border-amber-500/20"
                  >
                    +५० अङ्क बोनस
                  </button>
                </div>
              </div>

              {/* PERMISSION PACKAGES QUICK SELECTOR */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Layers size={14} className="text-purple-500" />
                    <span>अनुमति प्याकेजहरू (Permission Packages)</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">एकै क्लिकमा प्याकेज थप्नुहोस्</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.values(PERMISSION_PACKAGES).map((pkg) => {
                    const allPkgPerms = pkg.permissions;
                    const hasAll = allPkgPerms.every(p => editCustomPermissions.has(p) || (ROLE_DEFINITIONS[editRole]?.permissions || []).includes(p));

                    const handleApplyPackage = () => {
                      const updated = new Set(editCustomPermissions);
                      if (hasAll) {
                        allPkgPerms.forEach(p => updated.delete(p));
                        toast.info(`${pkg.nameEn} हटाइयो`);
                      } else {
                        allPkgPerms.forEach(p => updated.add(p));
                        toast.success(`${pkg.nameEn} लागू गरियो`);
                      }
                      setEditCustomPermissions(updated);
                    };

                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={handleApplyPackage}
                        className={`p-2 rounded-xl text-left border transition-all flex items-center justify-between ${
                          hasAll
                            ? "bg-purple-500/15 border-purple-500/40 text-purple-300 font-bold shadow-sm"
                            : "bg-accent/40 hover:bg-accent border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="truncate pr-1">
                          <div className="text-[11px] font-bold truncate">{pkg.nameEn}</div>
                          <div className="text-[9px] opacity-70">{pkg.permissions.length} अनुमतिहरू</div>
                        </div>
                        {hasAll && <CheckCircle2 size={13} className="text-purple-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CHECKBOX-BASED GRANULAR PERMISSIONS MATRIX */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Key size={14} className="text-amber-500" />
                    <span>सूक्ष्म अनुमति ओभरराइडहरू (Granular Permission Overrides)</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    चुनेको भूमिका बाहेक थप अनुमतिहरू प्रदान गर्न टिक लगाउनुहोस्।
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto p-3 rounded-xl border border-border bg-background">
                  {Object.entries(PERMISSIONS).map(([key, permVal]) => {
                    const isChecked = editCustomPermissions.has(permVal);
                    const baseRolePerms = ROLE_DEFINITIONS[editRole]?.permissions || [];
                    const isBaseInRole = baseRolePerms.includes(permVal) || baseRolePerms.includes("*");

                    return (
                      <label
                        key={key}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked || isBaseInRole
                            ? "border-amber-500/40 bg-amber-500/10 text-foreground"
                            : "border-border/60 hover:bg-accent text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked || isBaseInRole}
                            disabled={isBaseInRole}
                            onChange={() => handleTogglePermission(permVal)}
                            className="rounded border-border text-amber-500 focus:ring-amber-500 cursor-pointer"
                          />
                          <span className="font-mono text-[11px]">{permVal}</span>
                        </div>

                        {isBaseInRole && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-500">
                            Role Base
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-accent"
              >
                रद्द गर्नुहोस्
              </button>

              <button
                type="button"
                onClick={handleSaveUserProfile}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors shadow-md disabled:opacity-50"
              >
                {isSubmitting ? "सुरक्षित हुँदैछ..." : "विवरण र अनुमति सुरक्षित गर्नुहोस्"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CREATE NEW USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
                <UserPlus size={18} className="text-amber-500" />
                <span>नयाँ प्रयोगकर्ता थप्नुहोस्</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold block mb-1">पूरा नाम (Full Name):</label>
                <input
                  type="text"
                  required
                  value={addFormData.displayName}
                  onChange={(e) => setAddFormData({ ...addFormData, displayName: e.target.value })}
                  placeholder="राम शर्मा"
                  className="w-full p-2.5 rounded-xl border border-border bg-background"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">इमेल (Email):</label>
                <input
                  type="email"
                  required
                  value={addFormData.email}
                  onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                  placeholder="user@sanatanmarga.com"
                  className="w-full p-2.5 rounded-xl border border-border bg-background"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">पासवर्ड (Password):</label>
                <input
                  type="password"
                  required
                  value={addFormData.password}
                  onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-xl border border-border bg-background"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">प्रारम्भिक भूमिका (Initial Role):</label>
                <select
                  value={addFormData.role}
                  onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border bg-background font-bold text-foreground"
                >
                  {Object.keys(ROLE_DEFINITIONS).map(r => (
                    <option key={r} value={r}>{ROLE_DEFINITIONS[r].nameNe}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border font-bold hover:bg-accent"
                >
                  रद्द
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "थपिँदैछ..." : "प्रयोगकर्ता सिर्जना गर्नुहोस्"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
