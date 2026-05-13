import { CustomerDashboard } from "@/modules/customer/components/CustomerDashboard";
import { AppShell } from "@/shared/components/AppShell";

export default function CustomerPage() {
  return (
    <AppShell active="customer">
      <CustomerDashboard />
    </AppShell>
  );
}
