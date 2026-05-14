import { DeliveryStatus, OrderStatus, PaymentStatus } from "@prisma/client";
import { HttpError } from "@/shared/lib/api";
import { verifyPassword } from "@/shared/lib/password";
import { prisma } from "@/shared/lib/prisma";
import type { UpdateDeliveryInput, VerifyDeliveryInput } from "./deliveries.schemas";

const deliveryInclude = {
  courier: true,
  order: {
    include: {
      user: true,
      items: true,
      verificationCode: true
    }
  }
};

function serializeDelivery(delivery: Awaited<ReturnType<typeof findDelivery>>) {
  if (!delivery) {
    return null;
  }

  return {
    id: delivery.id,
    status: delivery.status,
    incidentNote: delivery.incidentNote,
    order: {
      id: delivery.order.id,
      status: delivery.order.status,
      total: Number(delivery.order.total),
      deliveryAddress: delivery.order.deliveryAddress,
      customerPhone: delivery.order.customerPhone,
      customerName: delivery.order.user.fullName,
      items: delivery.order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity
      }))
    }
  };
}

async function findDelivery(deliveryId: string) {
  return prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: deliveryInclude
  });
}

export async function listAssignedDeliveries(courierId: string) {
  const deliveries = await prisma.delivery.findMany({
    where: { courierId },
    include: deliveryInclude,
    orderBy: { assignedAt: "desc" }
  });

  return deliveries.map((delivery) => serializeDelivery(delivery));
}

export async function updateDelivery(
  courierId: string,
  deliveryId: string,
  input: UpdateDeliveryInput
) {
  const delivery = await findDelivery(deliveryId);

  if (!delivery || delivery.courierId !== courierId) {
    throw new HttpError(404, "Domicilio no encontrado");
  }

  const updated = await prisma.delivery.update({
    where: { id: deliveryId },
    data:
      input.action === "start"
        ? {
            status: DeliveryStatus.ON_THE_WAY,
            order: { update: { status: OrderStatus.ON_THE_WAY } }
          }
        : {
            status: DeliveryStatus.INCIDENT_REPORTED,
            incidentNote: input.incidentNote,
            order: { update: { status: OrderStatus.ON_THE_WAY } }
          },
    include: deliveryInclude
  });

  return serializeDelivery(updated);
}

export async function verifyDeliveryCode(
  courierId: string,
  deliveryId: string,
  input: VerifyDeliveryInput
) {
  const delivery = await findDelivery(deliveryId);

  if (!delivery || delivery.courierId !== courierId) {
    throw new HttpError(404, "Domicilio no encontrado");
  }

  const verification = delivery.order.verificationCode;

  if (!verification || verification.usedAt) {
    throw new HttpError(409, "El código ya fue usado o no existe");
  }

  if (verification.expiresAt < new Date()) {
    throw new HttpError(409, "El código está vencido");
  }

  if (!(await verifyPassword(input.code, verification.codeHash))) {
    throw new HttpError(403, "Código de verificación incorrecto");
  }

  const updated = await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      status: DeliveryStatus.DELIVERED,
      deliveredAt: new Date(),
      order: {
        update: {
          status: OrderStatus.DELIVERED,
          payment: {
            update: { status: PaymentStatus.PAID }
          },
          verificationCode: {
            update: { usedAt: new Date() }
          },
          saleHistory: {
            upsert: {
              update: { amount: delivery.order.total },
              create: { amount: delivery.order.total }
            }
          }
        }
      }
    },
    include: deliveryInclude
  });

  return serializeDelivery(updated);
}
