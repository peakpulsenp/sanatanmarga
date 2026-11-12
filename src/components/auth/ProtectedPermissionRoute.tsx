import React from "react";
import { Link, Navigate } from "react-router-dom";
import { ShieldAlert, Lock, ArrowLeft, KeyRound, Sparkles } from "lucide-react";
import { useAuth } from "@/src/lib/auth";
import { usePermissions } from "@/src/context/PermissionsContext";
import { UserPermission } from "@/src/constants/permissions";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";

interface ProtectedPermissionRouteProps {
  children: React.ReactNode;
  permission?: UserPermission;
  permissions?: UserPermission[];
  requireAll?: boolean;
  role?: string;
  redirectTo?: string;
}

export default function ProtectedPermissionRoute({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  redirectTo = "/login"
}: ProtectedPermissionRouteProps) {
  const { user, loading } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions, userRole, userStatus, isSuperAdmin } = usePermissions();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-muted-foreground">अनुमति प्रमाणित हुँदैछ...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (userStatus === "banned" || userStatus === "suspended") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <Header />
        <main className="container-custom py-16 flex flex-col items-center justify-center text-center px-4">
          <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-4">
            <ShieldAlert size={48} />
          </div>
          <h1 className="text-2xl font-bold font-display">खाता रोक्का वा प्रतिबन्धित (Account Restricted)</h1>
          <p className="text-sm text-muted-foreground max-w-md mt-2">
            तपाईंको खाता नियम उल्लङ्घन वा प्रशासकीय आदेश अनुसार {userStatus === "banned" ? "प्रतिबन्धित (Banned)" : "निलम्बित (Suspended)"} गरिएको छ।
          </p>
          <Link
            to="/contact"
            className="mt-6 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 transition-colors"
          >
            सहायता कक्षमा सम्पर्क गर्नुहोस्
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  let isAuthorized = true;

  if (isSuperAdmin) {
    isAuthorized = true;
  } else if (permission) {
    isAuthorized = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    isAuthorized = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  } else if (role) {
    isAuthorized = userRole === role || userRole === "super_admin" || userRole === "admin";
  }

  if (!isAuthorized) {
    const requiredPermissionStr = permission || (permissions ? permissions.join(", ") : role || "रिक्वायर्ड अनुमति");

    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <Header />
        <main className="container-custom py-16 flex flex-col items-center justify-center text-center px-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-4 shadow-sm">
            <Lock size={48} />
          </div>

          <div className="space-y-2 max-w-lg">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20">
              403 FORBIDDEN • PERMISSIONS OS
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold font-display">
              पहुँच अस्वीकृत (Permission Required)
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              तपाईंको वर्तमान भूमिका <span className="font-bold text-foreground font-mono">[{userRole}]</span> सँग यो पृष्ठ वा कार्य सञ्चालन गर्ने अधिकार छैन।
            </p>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-card border border-border text-left w-full max-w-md space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">आवश्यक अनुमति (Required Permission):</span>
              <span className="font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {requiredPermissionStr}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border/40 pt-2">
              <span className="text-muted-foreground font-medium">प्रयोगकर्ता खाता:</span>
              <span className="font-medium text-foreground">{user.email}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/admin"
              className="px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-xs font-bold transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              <span>मुख्य ड्यासबोर्डमा फर्कनुहोस्</span>
            </Link>

            <Link
              to="/contact"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
            >
              <KeyRound size={16} />
              <span>भूमिका परिवर्तन अनुरोध गर्नुहोस्</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return <>{children}</>;
}
