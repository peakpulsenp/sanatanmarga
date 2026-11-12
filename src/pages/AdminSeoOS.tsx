import React from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import SEOHead from "@/src/components/common/SEOHead";
import SeoOsDashboard from "@/src/components/admin/SeoOsDashboard";

export default function AdminSeoOS() {
  return (
    <AdminLayout title="SEO & Discoverability OS">
      <SEOHead
        title="SEO & Search Discoverability OS | Sanatan Marga Admin"
        description="SanatanMarga Technical SEO OS, Canonical Domain Management, Indexability Policies, Google News Sitemaps, and Structured Data Graph."
        noindex={true}
      />
      <SeoOsDashboard />
    </AdminLayout>
  );
}
