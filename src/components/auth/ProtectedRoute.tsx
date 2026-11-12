import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/lib/auth";
import type { UserRole } from "@/src/types";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const isRoleAllowed = (role?: UserRole): boolean => {
    if (!role) return false;
    const r = role as string;
    if (r === 'super_admin') return true;
    if (allowedRoles.includes(role)) return true;
    if (allowedRoles.includes('admin') && (r === 'admin' || r === 'super_admin')) return true;
    if (allowedRoles.includes('editor') && (r === 'admin' || r === 'chief_editor' || r === 'editor' || r === 'super_admin')) return true;
    return false;
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (!isRoleAllowed(user.role)) {
        navigate("/");
      }
    }
  }, [user, loading, allowedRoles, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">प्रमाणिकरण हुँदैछ...</p>
        </div>
      </div>
    );
  }

  if (!user || !isRoleAllowed(user.role)) {
    return null;
  }

  return <>{children}</>;
}
