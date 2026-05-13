import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(3, "Ingresa tu nombre completo"),
  email: z.string().email("Correo inválido").toLowerCase(),
  phone: z.string().min(7, "Ingresa un teléfono válido"),
  age: z.coerce.number().int().min(13).max(120).optional(),
  address: z.string().min(5, "Ingresa una dirección válida"),
  password: z.string().min(8, "La contraseña debe tener mínimo 8 caracteres")
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
