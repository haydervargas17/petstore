import { z } from "zod";

export const updateDeliverySchema = z.object({
  action: z.enum(["start", "incident"]),
  incidentNote: z.string().min(5).optional()
});

export const verifyDeliverySchema = z.object({
  code: z.string().regex(/^\d{6}$/, "El código debe tener 6 dígitos")
});

export type UpdateDeliveryInput = z.infer<typeof updateDeliverySchema>;
export type VerifyDeliveryInput = z.infer<typeof verifyDeliverySchema>;
