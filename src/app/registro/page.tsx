import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/modules/auth/components/RegisterForm";
import { AppShell } from "@/shared/components/AppShell";
import { getSession } from "@/shared/lib/auth";
import { roleHomePath } from "@/shared/lib/navigation";

export default async function RegisterPage() {
  const session = await getSession();

  if (session) {
    redirect(roleHomePath(session.role));
  }

  return (
    <AppShell active="register">
      <section className="auth-layout">
        <div>
          <p className="eyebrow">Cliente nuevo</p>
          <h1>Crea tu cuenta</h1>
          <p>El registro publico crea solo clientes para comprar y hacer pedidos.</p>
          <Link href="/login">Ya tengo cuenta</Link>
        </div>
        <RegisterForm />
      </section>
    </AppShell>
  );
}
