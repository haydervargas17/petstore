export const PRODUCT_CATEGORIES = [
  "Alimentos",
  "Accesorios",
  "Medicamentos permitidos",
  "Juguetes",
  "Productos de higiene",
  "Camas y collares"
] as const;

export type ProductCategoryName = (typeof PRODUCT_CATEGORIES)[number];
