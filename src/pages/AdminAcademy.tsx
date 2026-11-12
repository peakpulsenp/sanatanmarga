import React from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import AcademyOSAdmin from "@/src/components/admin/academy/AcademyOSAdmin";
import { useAuth } from "@/src/lib/auth";
import { AdminSkeleton } from "@/src/components/ui/PageLoaders";
import { Navigate } from "react-router-dom";

export default function AdminAcademy() {
  const { user, loading } = useAuth();

  if (loading) return <AdminSkeleton />;
  if (!user || !["admin", "super_admin", "acharya", "editor", "editor_in_chief"].includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
        <AcademyOSAdmin />
      </div>
    </AdminLayout>
  );
}
