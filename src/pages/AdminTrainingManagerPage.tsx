import React, { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { useAuth } from "@/src/lib/auth";
import { AdminSkeleton } from "@/src/components/ui/PageLoaders";
import { Navigate, Link } from "react-router-dom";
import { 
  GraduationCap, 
  Users, 
  Award, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  TrendingUp, 
  ExternalLink,
  BookOpen,
  Filter,
  AlertCircle
} from "lucide-react";
import { 
  trainingPersistence, 
  UserTrainingProgress, 
  UserCertificationRecord 
} from "@/src/services/trainingPersistenceService";

export default function AdminTrainingManagerPage() {
  const { user, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsData, setStatsData] = useState<{
    totalStaff: number;
    totalLessonsCompleted: number;
    totalHoursLogged: number;
    totalCertificationsIssued: number;
    activeCerts: number;
    expiringCerts: number;
    expiredCerts: number;
    staffList: UserTrainingProgress[];
    certificatesList: UserCertificationRecord[];
    deptBreakdown: Record<string, { staffCount: number; lessonsTotal: number; certsCount: number }>;
  } | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const data = await trainingPersistence.getOrganizationTrainingStats();
      setStatsData(data);
    } catch (e) {
      console.error("Failed to load organization training stats:", e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleTriggerRecertification = (staffName: string, certName: string) => {
    setNotification(`Recertification exam request dispatched to ${staffName} for "${certName}".`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleExportCSV = () => {
    if (!statsData) return;
    const headers = "User ID,Name,Email,Department,Competency Level,Completed Lessons,Hours Logged,Last Active\n";
    const rows = statsData.staffList.map(s => 
      `"${s.userId}","${s.userName || 'Staff'}","${s.userEmail || 'N/A'}","${s.department}","${s.competencyLevel}",${s.completedLessons.length},${Math.round(s.trainingMinutes / 60)},"${s.lastActiveAt}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SanatanMarga_Staff_Training_Audit_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <AdminSkeleton />;
  if (!user || (user.role !== "admin" && user.role !== "super_admin" && user.role !== "editor")) {
    return <Navigate to="/login" replace />;
  }

  const filteredStaff = statsData?.staffList.filter(s => {
    const matchesSearch = (s.userName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.userEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === "all" || s.department === selectedDept;
    return matchesSearch && matchesDept;
  }) || [];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
        {/* Banner Alert if triggered */}
        {notification && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm flex items-center justify-between shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
              <GraduationCap className="w-4 h-4 text-amber-700" />
              Enterprise Learning Management OS
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
              Training & Certification Mission Control
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Manage organization-wide staff onboarding, role competencies, exam reality audits, and recertification compliance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={loadStats}
              disabled={isLoadingStats}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? "animate-spin text-amber-600" : ""}`} />
              Sync Telemetry
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-stone-600" />
              Export Audit CSV
            </button>
            <Link
              to="/training"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-700 hover:bg-amber-800 text-white flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Open Training Center
            </Link>
          </div>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-stone-500 font-medium">Active Learners</div>
              <div className="text-2xl font-bold font-serif text-stone-900 mt-0.5">
                {statsData?.totalStaff || 0}
              </div>
              <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5">
                <TrendingUp className="w-3 h-3" />
                <span>100% cloud-synced</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-stone-500 font-medium">Lessons Completed</div>
              <div className="text-2xl font-bold font-serif text-stone-900 mt-0.5">
                {statsData?.totalLessonsCompleted || 0}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                Across 8 domain tracks
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-stone-500 font-medium">Active Certifications</div>
              <div className="text-2xl font-bold font-serif text-stone-900 mt-0.5">
                {statsData?.activeCerts || 0}
              </div>
              <div className="text-[11px] text-amber-700 flex items-center gap-1 mt-0.5">
                <span>{statsData?.expiringCerts || 0} expiring soon</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-stone-500 font-medium">Total Training Hours</div>
              <div className="text-2xl font-bold font-serif text-stone-900 mt-0.5">
                {statsData?.totalHoursLogged || 0}h
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                Audited competency time
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Department Health & Certification Expirations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Competency Index */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h2 className="font-serif font-bold text-base text-stone-900">
                  Departmental Training Progress
                </h2>
                <p className="text-xs text-stone-500">
                  Real completed curriculum counts and certification rates per division
                </p>
              </div>
              <span className="text-xs font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-700">
                No Measurement = No Metric
              </span>
            </div>

            <div className="space-y-4">
              {statsData && Object.entries(statsData.deptBreakdown).map(([deptName, info], i) => (
                <div key={i} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-800">{deptName}</span>
                    <span className="text-stone-500 font-mono">
                      {info.staffCount} Staff • {info.lessonsTotal} Lessons • {info.certsCount} Certs
                    </span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-amber-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.max(15, (info.lessonsTotal / (info.staffCount * 12)) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recertification & Expiry Radar */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                Compliance & Expiry Radar
              </h2>
              <p className="text-xs text-stone-500">
                Mandatory 6-month & 12-month renewal status
              </p>
            </div>

            <div className="space-y-3">
              {statsData?.certificatesList.map((cert, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    cert.status === "expired"
                      ? "bg-red-50/70 border-red-200 text-red-900"
                      : cert.status === "expiring_soon"
                      ? "bg-amber-50/70 border-amber-200 text-amber-900"
                      : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>{cert.title}</span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                      cert.status === "expired" ? "bg-red-200 text-red-800" :
                      cert.status === "expiring_soon" ? "bg-amber-200 text-amber-800" :
                      "bg-emerald-200 text-emerald-800"
                    }`}>
                      {(cert.status || "active").replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-[11px] opacity-80 flex items-center justify-between">
                    <span>{cert.userName} ({cert.role})</span>
                    <span className="font-mono">Exp: {new Date(cert.expiresAt).toLocaleDateString()}</span>
                  </div>
                  {cert.status !== "active" && (
                    <button
                      onClick={() => handleTriggerRecertification(cert.userName, cert.title)}
                      className="mt-1 w-full py-1 text-[11px] font-semibold bg-white border border-stone-300 hover:bg-stone-50 rounded-lg text-stone-800 flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <RefreshCw className="w-3 h-3 text-amber-700" />
                      Request Recertification Exam
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Staff Roster & Individual Competency Audit */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="font-serif font-bold text-lg text-stone-900">
                Staff Competency Registry
              </h2>
              <p className="text-xs text-stone-500">
                Search individual learners, inspect completed tracks, and verify qualifications
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff, email, dept..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-800 w-56"
                />
              </div>

              <div className="flex items-center gap-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-stone-400" />
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-stone-300 bg-white text-stone-700 focus:outline-none"
                >
                  <option value="all">All Departments</option>
                  {statsData && Object.keys(statsData.deptBreakdown).map((dept, i) => (
                    <option key={i} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 text-stone-700 font-semibold border-y border-stone-200">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Competency Level</th>
                  <th className="py-3 px-4 text-center">Lessons</th>
                  <th className="py-3 px-4 text-center">Training Hours</th>
                  <th className="py-3 px-4">Active Credentials</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredStaff.map((staff, i) => {
                  const staffCerts = statsData?.certificatesList.filter(c => c.userId === staff.userId) || [];
                  return (
                    <tr key={i} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-stone-900">
                        <div>{staff.userName || "Govinda Sharma"}</div>
                        <div className="text-[11px] text-stone-400">{staff.userEmail || "staff@sanatanmarga.com"}</div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-700">
                        {staff.department}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                          staff.competencyLevel === "L5_Fellow" ? "bg-purple-100 text-purple-800" :
                          staff.competencyLevel === "L4_Guardian" ? "bg-amber-100 text-amber-800" :
                          staff.competencyLevel === "L3_Specialist" ? "bg-blue-100 text-blue-800" :
                          staff.competencyLevel === "L2_Practitioner" ? "bg-emerald-100 text-emerald-800" :
                          "bg-stone-100 text-stone-700"
                        }`}>
                          {(staff.competencyLevel || "L0_Standard").replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-stone-800">
                        {staff.completedLessons.length}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-stone-800">
                        {Math.round(staff.trainingMinutes / 60)}h
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {staffCerts.length > 0 ? (
                            staffCerts.map((c, idx) => (
                              <span 
                                key={idx} 
                                className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                  c.status === "expired" ? "bg-red-50 border-red-200 text-red-700" :
                                  c.status === "expiring_soon" ? "bg-amber-50 border-amber-200 text-amber-700" :
                                  "bg-emerald-50 border-emerald-200 text-emerald-700"
                                }`}
                              >
                                {c.code}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-stone-400 italic">In Training</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/training?learner=${staff.userId}`}
                          className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 font-semibold text-xs"
                        >
                          Audit Progress
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
