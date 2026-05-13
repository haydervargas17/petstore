import Link from "next/link";
import {
  LayoutDashboard,
  LogIn,
  PawPrint,
  ShoppingCart,
  Truck,
  UserPlus
} from "lucide-react";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  active?: "catalog" | "cart" | "login" | "register" | "customer" | "admin" | "delivery";
};

const navItems = [
  { href: "/", label: "Catálogo", icon: PawPrint, key: "catalog" },
  { href: "/carrito", label: "Carrito", icon: ShoppingCart, key: "cart" },
  { href: "/cliente", label: "Cliente", icon: LayoutDashboard, key: "customer" },
  { href: "/admin", label: "Admin", icon: LayoutDashboard, key: "admin" },
  { href: "/repartidor", label: "Repartidor", icon: Truck, key: "delivery" }
] as const;

export function AppShell({ children, active = "catalog" }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Pet Store">
          <span className="brand-mark">
            <PawPrint size={21} />
          </span>
          <span>Pet Store</span>
        </Link>

        <nav className="main-nav" aria-label="Navegación principal">
          {navItems.map((item) => {
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
          <Link className="icon-link" href="/login" aria-label="Iniciar sesión">
            <LogIn size={18} />
          </Link>
          <Link className="primary-link" href="/registro">
            <UserPlus size={17} />
            <span>Registro</span>
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
