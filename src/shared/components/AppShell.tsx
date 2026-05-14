import Link from "next/link";
import {
  LayoutDashboard,
  LogIn,
  PawPrint,
  ShoppingCart,
  Truck,
  User,
  UserPlus
} from "lucide-react";
import type { ReactNode } from "react";
import { LogoutButton } from "@/shared/components/LogoutButton";
import { getSession } from "@/shared/lib/auth";
import { roleLabel } from "@/shared/lib/navigation";
import type { AppRole } from "@/shared/types/domain";

type AppShellProps = {
  children: ReactNode;
  active?: "catalog" | "cart" | "login" | "register" | "customer" | "admin" | "delivery";
};

const navItems = [
  { href: "/", label: "Catalogo", icon: PawPrint, key: "catalog" },
  { href: "/carrito", label: "Carrito", icon: ShoppingCart, key: "cart" },
  { href: "/cliente", label: "Cliente", icon: LayoutDashboard, key: "customer" },
  { href: "/admin", label: "Administracion", icon: LayoutDashboard, key: "admin" },
  { href: "/repartidor", label: "Repartidor", icon: Truck, key: "delivery" }
] as const;

function allowedKeysForRole(role: AppRole | null) {
  if (role === "CUSTOMER") {
    return new Set(["catalog", "cart", "customer"]);
  }

  if (role === "ADMIN") {
    return new Set(["catalog", "admin"]);
  }

  if (role === "DELIVERY") {
    return new Set(["catalog", "delivery"]);
  }

  return new Set(["catalog"]);
}

export async function AppShell({ children, active = "catalog" }: AppShellProps) {
  const session = await getSession();
  const allowedKeys = allowedKeysForRole(session?.role ?? null);
  const visibleNavItems = navItems.filter((item) => allowedKeys.has(item.key));

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Pet Store">
          <span className="brand-mark">
            <PawPrint size={21} />
          </span>
          <span>Pet Store</span>
        </Link>

        <nav className="main-nav" aria-label="Navegacion principal">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active === item.key ? "nav-link is-active" : "nav-link"}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="topbar-actions">
          {session ? (
            <>
              <span className="user-chip">
                <User size={16} />
                <span>{roleLabel(session.role)}</span>
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                className="session-link secondary-session-link"
                href="/login"
                aria-label="Iniciar sesion"
              >
                <LogIn size={18} />
                <span>Iniciar sesion</span>
              </Link>
              <Link className="session-link primary-session-link" href="/registro">
                <UserPlus size={17} />
                <span>Crear cuenta</span>
              </Link>
            </>
          )}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
