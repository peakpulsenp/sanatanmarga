import React from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import AdminKnowledgeUnified, { KnowledgeTab } from "@/src/components/admin/knowledge/AdminKnowledgeUnified";
import { useAuth } from "@/src/lib/auth";
import { AdminSkeleton } from "@/src/components/ui/PageLoaders";
import { Navigate } from "react-router-dom";

export default function AdminKnowledgePage({ defaultTab = "nodes" }: { defaultTab?: KnowledgeTab }) {
  const { user, loading } = useAuth();

  if (loading) return <AdminSkeleton />;
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        <AdminKnowledgeUnified defaultTab={defaultTab} />
      </div>
    </AdminLayout>
  );
}
