import Link from "next/link";
import { RegisterForm } from "@/modules/auth/components/RegisterForm";
import { AppShell } from "@/shared/components/AppShell";

export default function RegisterPage() {
  return (
    <AppShell active="register">
      <section className="auth-layout">
        <div>
          <p className="eyebrow">Cliente nuevo</p>
          <h1>Crea tu cuenta</h1>
          <p>Necesitas una cuenta para agregar productos al carrito y confirmar pedidos.</p>
          <Link href="/login">Ya tengo cuenta</Link>
        </div>
        <RegisterForm />
      </section>
    </AppShell>
  );
}
