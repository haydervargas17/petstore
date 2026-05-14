import type { Prisma } from "@prisma/client";
import { HttpError } from "@/shared/lib/api";
import { prisma } from "@/shared/lib/prisma";
import { mapProduct } from "@/modules/products/products.service";
import type { AddCartItemInput, UpdateCartItemInput } from "./cart.schemas";

const cartInclude = {
  items: {
    include: {
      product: {
        include: {
          category: true,
          discounts: {
            where: { isActive: true },
            orderBy: { createdAt: "desc" }
          }
        }
      }
    },
    orderBy: { createdAt: "asc" }
  }
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{
  include: typeof cartInclude;
}>;

function mapCart(cart: CartWithItems) {
  const items = cart.items.map((item) => {
    const product = mapProduct(item.product);
    return {
      id: item.id,
      product,
      quantity: item.quantity,
      total: product.finalPrice * item.quantity
    };
  });

  return {
    id: cart.id,
    items,
    total: items.reduce((sum, item) => sum + item.total, 0)
  };
}

async function getOrCreateCart(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: cartInclude
  });

  if (cart) {
    return cart;
  }

  return prisma.cart.create({
    data: { userId },
    include: cartInclude
  });
}

export async function getCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  return mapCart(cart);
}

export async function addCartItem(userId: string, input: AddCartItemInput) {
  const product = await prisma.product.findFirst({
    where: { id: input.productId, isActive: true },
    include: {
      category: true,
      discounts: { where: { isActive: true }, orderBy: { createdAt: "desc" } }
    }
  });

  if (!product) {
    throw new HttpError(404, "Producto no encontrado");
  }

  if (product.stock <= 0) {
    throw new HttpError(409, "Producto agotado");
  }

  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((item) => item.productId === input.productId);
  const nextQuantity = (existing?.quantity ?? 0) + input.quantity;

  if (nextQuantity > product.stock) {
    throw new HttpError(409, "No hay stock suficiente para esa cantidad");
  }

  await prisma.cartItem.upsert({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId: input.productId
      }
    },
    update: {
      quantity: { increment: input.quantity }
    },
    create: {
      cartId: cart.id,
      productId: input.productId,
      quantity: input.quantity
    }
  });

  return getCart(userId);
}

export async function updateCartItem(
  userId: string,
  itemId: string,
  input: UpdateCartItemInput
) {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((cartItem) => cartItem.id === itemId);

  if (!item) {
    throw new HttpError(404, "Producto no encontrado en el carrito");
  }

  if (input.quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    return getCart(userId);
  }

  if (input.quantity > item.product.stock) {
    throw new HttpError(409, "No hay stock suficiente para esa cantidad");
  }

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity: input.quantity }
  });

  return getCart(userId);
}

export async function removeCartItem(userId: string, itemId: string) {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((cartItem) => cartItem.id === itemId);

  if (!item) {
    throw new HttpError(404, "Producto no encontrado en el carrito");
  }

  await prisma.cartItem.delete({ where: { id: itemId } });
  return getCart(userId);
}
