"use client";

import { UserPlus } from "lucide-react";
import { useTransition } from "react";
import { queueToast, useToast } from "@/shared/components/ToastProvider";

export function RegisterForm() {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
        showToast(payload.error ?? "No se pudo registrar la cuenta", "error");
        return;
      }

      queueToast(payload.message ?? "Usuario creado correctamente", "success");
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
        Telefono
        <input name="phone" autoComplete="tel" required />
      </label>
      <label>
        Edad
        <input name="age" type="number" min="13" max="120" />
      </label>
      <label>
        Direccion de domicilio
        <input name="address" autoComplete="street-address" required />
      </label>
      <label>
        Contrasena
        <input name="password" type="password" autoComplete="new-password" required />
      </label>
      <button className="primary-button" type="submit" disabled={isPending}>
        <UserPlus size={18} />
        <span>{isPending ? "Creando..." : "Crear cuenta"}</span>
      </button>
    </form>
  );
}
