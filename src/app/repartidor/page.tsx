import { DeliveryDashboard } from "@/modules/deliveries/components/DeliveryDashboard";
import { AppShell } from "@/shared/components/AppShell";

export default function DeliveryPage() {
  return (
    <AppShell active="delivery">
      <DeliveryDashboard />
    </AppShell>
  );
}
