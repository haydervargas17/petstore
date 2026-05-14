import { redirect } from "next/navigation";
import { CustomerDashboard } from "@/modules/customer/components/CustomerDashboard";
import { AppShell } from "@/shared/components/AppShell";
import { getSession } from "@/shared/lib/auth";
import { roleHomePath } from "@/shared/lib/navigation";

export default async function CustomerPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "CUSTOMER") {
    redirect(roleHomePath(session.role));
  }

  return (
    <AppShell active="customer">
      <CustomerDashboard />
    </AppShell>
  );
}
