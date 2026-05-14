import { redirect } from "next/navigation";
import { CartPageClient } from "@/modules/cart/components/CartPageClient";
import { AppShell } from "@/shared/components/AppShell";
import { getSession } from "@/shared/lib/auth";
import { roleHomePath } from "@/shared/lib/navigation";

export default async function CartPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "CUSTOMER") {
    redirect(roleHomePath(session.role));
  }

  return (
    <AppShell active="cart">
      <CartPageClient />
    </AppShell>
  );
}
