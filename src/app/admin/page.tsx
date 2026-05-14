import { redirect } from "next/navigation";
import { AdminDashboard } from "@/modules/admin/components/AdminDashboard";
import { AppShell } from "@/shared/components/AppShell";
import { getSession } from "@/shared/lib/auth";
import { roleHomePath } from "@/shared/lib/navigation";

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "ADMIN") {
    redirect(roleHomePath(session.role));
  }

  return (
    <AppShell active="admin">
      <AdminDashboard />
    </AppShell>
  );
}
