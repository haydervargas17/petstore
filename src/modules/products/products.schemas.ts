import { z } from "zod";
import { PRODUCT_CATEGORIES } from "@/shared/lib/product-categories";

export const productFiltersSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  availability: z
    .enum(["available", "out_of_stock", "discounted", "all"])
    .default("all"),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional()
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().min(10),
  imageUrl: z.string().trim().url(),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0).default(5),
  categoryName: z.enum(PRODUCT_CATEGORIES),
  discountPercentage: z.coerce.number().min(0).max(95).optional()
});

export const restockProductSchema = z.object({
  quantity: z.coerce.number().int().positive(),
  reason: z.string().trim().min(3).default("Reabastecimiento")
});

export type ProductFilters = z.infer<typeof productFiltersSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type RestockProductInput = z.infer<typeof restockProductSchema>;
