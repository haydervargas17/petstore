"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    });
  }

  return (
    <button
      className="icon-link logout-button"
      type="button"
      aria-label="Cerrar sesion"
      title="Cerrar sesion"
      disabled={isPending}
      onClick={signOut}
    >
      <LogOut size={18} />
    </button>
  );
}
