import { CartPageClient } from "@/modules/cart/components/CartPageClient";
import { AppShell } from "@/shared/components/AppShell";

export default function CartPage() {
  return (
    <AppShell active="cart">
      <CartPageClient />
    </AppShell>
  );
}
