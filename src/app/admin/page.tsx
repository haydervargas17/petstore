import { AdminDashboard } from "@/modules/admin/components/AdminDashboard";
import { AppShell } from "@/shared/components/AppShell";

export default function AdminPage() {
  return (
    <AppShell active="admin">
      <AdminDashboard />
    </AppShell>
  );
}
