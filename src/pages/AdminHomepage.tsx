import AdminLayout from "@/src/components/layout/AdminLayout";
import HomepageAdmin from "@/src/components/admin/homepage/HomepageAdmin";

export default function AdminHomepage() {
  return (
    <AdminLayout title="गृहपृष्ठ नियन्त्रण (Homepage OS)">
      <div className="p-4 md:p-8">
        <HomepageAdmin />
      </div>
    </AdminLayout>
  );
}
