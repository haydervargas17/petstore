import { Prisma, ProductStatus } from "@prisma/client";
import { calculateDiscount, toNumber } from "@/shared/lib/money";
import { prisma } from "@/shared/lib/prisma";
import { slugify } from "@/shared/lib/slug";
import type { ProductListItem } from "@/shared/types/domain";
import type { CreateProductInput, ProductFilters } from "./products.schemas";

const productInclude = {
  category: true,
  discounts: {
    where: { isActive: true },
    orderBy: { createdAt: "desc" }
  }
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

function getActiveDiscount(product: ProductWithRelations) {
  const now = new Date();

  return product.discounts.find((discount) => {
    const startsOk = !discount.startsAt || discount.startsAt <= now;
    const endsOk = !discount.endsAt || discount.endsAt >= now;
    return startsOk && endsOk;
  });
}

export function mapProduct(product: ProductWithRelations): ProductListItem {
  const price = toNumber(product.price);
  const activeDiscount = getActiveDiscount(product);
  const discount = calculateDiscount(
    price,
    activeDiscount
      ? {
          percentage: activeDiscount.percentage
            ? toNumber(activeDiscount.percentage)
            : null,
          amount: activeDiscount.amount ? toNumber(activeDiscount.amount) : null
        }
      : undefined
  );
  const finalPrice = Math.max(0, price - discount);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    imageUrl: product.imageUrl,
    category: product.category.name,
    categorySlug: product.category.slug,
    price,
    discount,
    finalPrice,
    stock: product.stock,
    status:
      product.stock <= 0
        ? "out_of_stock"
        : discount > 0
          ? "discounted"
          : "available"
  };
}

export async function listProducts(filters: ProductFilters) {
  const where: Prisma.ProductWhereInput = {
    isActive: true
  };

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } }
    ];
  }

  if (filters.category) {
    where.category = { slug: filters.category };
  }

  if (filters.availability === "available") {
    where.stock = { gt: 0 };
  }

  if (filters.availability === "out_of_stock") {
    where.stock = 0;
  }

  if (filters.availability === "discounted") {
    where.discounts = { some: { isActive: true } };
  }

  const products = await prisma.product.findMany({
    where,
    include: productInclude,
    orderBy: [{ status: "asc" }, { name: "asc" }]
  });

  return products
    .map(mapProduct)
    .filter((product) => {
      if (filters.minPrice && product.finalPrice < filters.minPrice) {
        return false;
      }

      if (filters.maxPrice && product.finalPrice > filters.maxPrice) {
        return false;
      }

      return true;
    });
}

export async function createProduct(input: CreateProductInput) {
  const slugBase = slugify(input.name);
  const slug = `${slugBase}-${Date.now().toString(36)}`;

  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      imageUrl: input.imageUrl,
      price: new Prisma.Decimal(input.price),
      stock: input.stock,
      minStock: input.minStock,
      status:
        input.stock <= 0 ? ProductStatus.OUT_OF_STOCK : ProductStatus.AVAILABLE,
      categoryId: input.categoryId
    },
    include: productInclude
  });

  return mapProduct(product);
}
