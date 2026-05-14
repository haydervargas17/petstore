import {
  DeliveryStatus,
  InventoryMovementType,
  OrderStatus,
  PaymentStatus,
  Prisma
} from "@prisma/client";
import { HttpError } from "@/shared/lib/api";
import { hashPassword } from "@/shared/lib/password";
import { prisma } from "@/shared/lib/prisma";
import { mapProduct } from "@/modules/products/products.service";
import type { SessionUser } from "@/shared/types/domain";
import type { UpdateOrderStatusInput } from "./orders.schemas";

const orderInclude = {
  user: { include: { role: true } },
  items: { include: { product: true } },
  delivery: { include: { courier: true } },
  verificationCode: true,
  payment: true
};

function randomVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function serializeOrder(order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>) {
  return {
    id: order.id,
    status: order.status,
    total: Number(order.total),
    subtotal: Number(order.subtotal),
    discountTotal: Number(order.discountTotal),
    deliveryAddress: order.deliveryAddress,
    customerPhone: order.customerPhone,
    customer: {
      id: order.user.id,
      fullName: order.user.fullName,
      email: order.user.email,
      phone: order.user.phone
    },
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      total: Number(item.total)
    })),
    delivery: order.delivery
      ? {
          id: order.delivery.id,
          status: order.delivery.status,
          courierId: order.delivery.courierId,
          courierName: order.delivery.courier?.fullName ?? null,
          incidentNote: order.delivery.incidentNote
        }
      : null,
    paymentStatus: order.payment?.status ?? PaymentStatus.PENDING,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString()
  };
}

export async function createOrderFromCart(userId: string) {
  const code = randomVerificationCode();
  const codeHash = await hashPassword(code);

  const result = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: {
        user: true,
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
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      throw new HttpError(409, "El carrito está vacío");
    }

    if (!cart.user.address) {
      throw new HttpError(409, "El usuario no tiene dirección registrada");
    }

    const mappedItems = cart.items.map((item) => {
      const product = mapProduct(item.product);

      if (product.stock < item.quantity) {
        throw new HttpError(
          409,
          `Stock insuficiente para ${product.name}`,
          product
        );
      }

      return {
        item,
        product,
        total: product.finalPrice * item.quantity,
        discountTotal: product.discount * item.quantity
      };
    });

    const subtotal = mappedItems.reduce(
      (sum, entry) => sum + entry.product.price * entry.item.quantity,
      0
    );
    const discountTotal = mappedItems.reduce(
      (sum, entry) => sum + entry.discountTotal,
      0
    );
    const total = mappedItems.reduce((sum, entry) => sum + entry.total, 0);

    const order = await tx.order.create({
      data: {
        userId,
        subtotal: new Prisma.Decimal(subtotal),
        discountTotal: new Prisma.Decimal(discountTotal),
        total: new Prisma.Decimal(total),
        deliveryAddress: cart.user.address,
        customerPhone: cart.user.phone,
        items: {
          create: mappedItems.map((entry) => ({
            productId: entry.product.id,
            productName: entry.product.name,
            unitPrice: new Prisma.Decimal(entry.product.finalPrice),
            quantity: entry.item.quantity,
            total: new Prisma.Decimal(entry.total)
          }))
        },
        payment: {
          create: {
            amount: new Prisma.Decimal(total),
            status: PaymentStatus.PENDING
          }
        },
        verificationCode: {
          create: {
            codeHash,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
          }
        }
      },
      include: orderInclude
    });

    await Promise.all(
      mappedItems.map((entry) =>
        tx.product.update({
          where: { id: entry.product.id },
          data: {
            stock: { decrement: entry.item.quantity },
            inventoryMovements: {
              create: {
                orderId: order.id,
                type: InventoryMovementType.SALE,
                quantity: entry.item.quantity,
                reason: `Pedido ${order.id}`
              }
            }
          }
        })
      )
    );

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return order;
  });

  return {
    order: serializeOrder(result),
    verificationCode: code
  };
}

export async function listOrders(session: SessionUser) {
  const where: Prisma.OrderWhereInput =
    session.role === "ADMIN"
      ? {}
      : session.role === "CUSTOMER"
        ? { userId: session.id }
        : { delivery: { courierId: session.id } };

  const orders = await prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: "desc" }
  });

  return orders.map(serializeOrder);
}

export async function updateOrderStatus(
  orderId: string,
  input: UpdateOrderStatusInput
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { delivery: true, saleHistory: true, verificationCode: true }
  });

  if (!order) {
    throw new HttpError(404, "Pedido no encontrado");
  }

  const hasCompletedDelivery =
    order.status === OrderStatus.DELIVERED ||
    order.delivery?.status === DeliveryStatus.DELIVERED ||
    Boolean(order.saleHistory) ||
    Boolean(order.verificationCode?.usedAt);

  if (hasCompletedDelivery) {
    throw new HttpError(
      409,
      "Este pedido ya fue entregado y no puede cambiar de estado"
    );
  }

  if (
    order.status === OrderStatus.CANCELLED ||
    order.status === OrderStatus.REJECTED
  ) {
    throw new HttpError(
      409,
      "Este pedido ya esta cerrado y no puede cambiar de estado"
    );
  }

  if (
    order.status === OrderStatus.PENDING &&
    input.status !== OrderStatus.APPROVED &&
    input.status !== OrderStatus.CANCELLED
  ) {
    throw new HttpError(409, "Un pedido pendiente solo puede aprobarse o cancelarse");
  }

  if (
    order.status === OrderStatus.APPROVED &&
    input.status !== OrderStatus.SHIPPED &&
    input.status !== OrderStatus.CANCELLED
  ) {
    throw new HttpError(409, "Un pedido aprobado solo puede enviarse o cancelarse");
  }

  if (
    (order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.ON_THE_WAY) &&
    input.status !== OrderStatus.SHIPPED
  ) {
    throw new HttpError(
      409,
      "Un pedido en reparto solo puede completarlo el repartidor"
    );
  }

  if (input.status === OrderStatus.SHIPPED && !input.courierId) {
    throw new HttpError(422, "Debes asignar un repartidor");
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: input.status,
      delivery:
        input.courierId || input.status === OrderStatus.SHIPPED
          ? {
              upsert: {
                update: {
                  courierId: input.courierId,
                  status:
                    input.status === OrderStatus.DELIVERED
                      ? DeliveryStatus.DELIVERED
                      : DeliveryStatus.ASSIGNED
                },
                create: {
                  courierId: input.courierId,
                  status: DeliveryStatus.ASSIGNED
                }
              }
            }
          : undefined,
      saleHistory:
        input.status === OrderStatus.DELIVERED
          ? {
              upsert: {
                update: { amount: order.total },
                create: { amount: order.total }
              }
            }
          : undefined
    },
    include: orderInclude
  });

  return serializeOrder(updated);
}
