import Link from "next/link";
import { LoginForm } from "@/modules/auth/components/LoginForm";
import { AppShell } from "@/shared/components/AppShell";

export default function LoginPage() {
  return (
    <AppShell active="login">
      <section className="auth-layout">
        <div>
          <p className="eyebrow">Acceso</p>
          <h1>Entra a tu cuenta</h1>
          <p>El sistema abre rutas y acciones según tu rol.</p>
          <Link href="/registro">Crear cuenta de cliente</Link>
        </div>
        <LoginForm />
      </section>
    </AppShell>
  );
}
