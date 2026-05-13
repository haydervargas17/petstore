export type AppRole = "CUSTOMER" | "ADMIN" | "DELIVERY";

export type ProductAvailability = "available" | "out_of_stock" | "discounted";

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  category: string;
  categorySlug: string;
  price: number;
  discount: number;
  finalPrice: number;
  stock: number;
  status: ProductAvailability;
};

export type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  role: AppRole;
};

export type ApiEnvelope<T> = {
  data: T;
  message?: string;
};

export type ApiErrorEnvelope = {
  error: string;
  details?: unknown;
};
