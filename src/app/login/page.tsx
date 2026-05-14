import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/modules/auth/components/LoginForm";
import { AppShell } from "@/shared/components/AppShell";
import { getSession } from "@/shared/lib/auth";
import { roleHomePath } from "@/shared/lib/navigation";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect(roleHomePath(session.role));
  }

  return (
    <AppShell active="login">
      <section className="auth-layout">
        <div>
          <p className="eyebrow">Acceso</p>
          <h1>Entra a tu cuenta</h1>
          <p>Clientes, administradores y repartidores entran desde este acceso.</p>
          <Link href="/registro">Crear cuenta de cliente</Link>
        </div>
        <LoginForm />
      </section>
    </AppShell>
  );
}
