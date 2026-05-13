import type { Prisma } from "@prisma/client";

export function toNumber(value: Prisma.Decimal | number | string) {
  return typeof value === "number" ? value : Number(value);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value);
}

export function calculateDiscount(price: number, discount?: {
  percentage: number | null;
  amount: number | null;
}) {
  if (!discount) {
    return 0;
  }

  if (discount.percentage) {
    return Math.round((price * discount.percentage) / 100);
  }

  return Math.min(price, discount.amount ?? 0);
}
