"use client";

import { LogIn } from "lucide-react";
import { useState, useTransition } from "react";
import type { ApiEnvelope, SessionUser } from "@/shared/types/domain";

type LoginResponse = ApiEnvelope<{
  user: SessionUser;
}>;

function roleTarget(role: SessionUser["role"]) {
  if (role === "ADMIN") {
    return "/admin";
  }

  if (role === "DELIVERY") {
    return "/repartidor";
  }

  return "/cliente";
}

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password")
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "No se pudo iniciar sesión");
        return;
      }

      const data = payload as LoginResponse;
      window.location.href = roleTarget(data.data.user.role);
    });
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        Correo
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Contraseña
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="primary-button" type="submit" disabled={isPending}>
        <LogIn size={18} />
        <span>{isPending ? "Entrando..." : "Iniciar sesión"}</span>
      </button>
    </form>
  );
}
