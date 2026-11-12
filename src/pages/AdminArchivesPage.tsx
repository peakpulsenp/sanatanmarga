import React from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import ArchivesOSAdmin from "@/src/components/admin/archives/ArchivesOSAdmin";
import { useAuth } from "@/src/lib/auth";
import { AdminSkeleton } from "@/src/components/ui/PageLoaders";
import { Navigate } from "react-router-dom";

export default function AdminArchivesPage() {
  const { user, loading } = useAuth();

  if (loading) return <AdminSkeleton />;
  if (!user || (user.role !== "admin" && user.role !== "super_admin" && user.role !== "editor")) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        <ArchivesOSAdmin />
      </div>
    </AdminLayout>
  );
}
