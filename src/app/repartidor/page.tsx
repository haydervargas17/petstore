import { redirect } from "next/navigation";
import { DeliveryDashboard } from "@/modules/deliveries/components/DeliveryDashboard";
import { AppShell } from "@/shared/components/AppShell";
import { getSession } from "@/shared/lib/auth";
import { roleHomePath } from "@/shared/lib/navigation";

export default async function DeliveryPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "DELIVERY") {
    redirect(roleHomePath(session.role));
  }

  return (
    <AppShell active="delivery">
      <DeliveryDashboard />
    </AppShell>
  );
}
