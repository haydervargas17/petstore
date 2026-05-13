"use client";

import { UserPlus } from "lucide-react";
import { useState, useTransition } from "react";

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.get("fullName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          age: formData.get("age"),
          address: formData.get("address"),
          password: formData.get("password")
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "No se pudo registrar la cuenta");
        return;
      }

      window.location.href = "/cliente";
    });
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        Nombre completo
        <input name="fullName" autoComplete="name" required />
      </label>
      <label>
        Correo
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Teléfono
        <input name="phone" autoComplete="tel" required />
      </label>
      <label>
        Edad
        <input name="age" type="number" min="13" max="120" />
      </label>
      <label>
        Dirección de domicilio
        <input name="address" autoComplete="street-address" required />
      </label>
      <label>
        Contraseña
        <input name="password" type="password" autoComplete="new-password" required />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="primary-button" type="submit" disabled={isPending}>
        <UserPlus size={18} />
        <span>{isPending ? "Creando..." : "Crear cuenta"}</span>
      </button>
    </form>
  );
}
