import type { AppRole } from "@/shared/types/domain";

export function roleHomePath(role: AppRole) {
  if (role === "ADMIN") {
    return "/admin";
  }

  if (role === "DELIVERY") {
    return "/repartidor";
  }

  return "/cliente";
}

export function roleLabel(role: AppRole) {
  if (role === "ADMIN") {
    return "Administracion";
  }

  if (role === "DELIVERY") {
    return "Repartidor";
  }

  return "Cliente";
}
