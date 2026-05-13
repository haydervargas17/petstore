import { handleRouteError, ok } from "@/shared/lib/api";
import { requireRole } from "@/shared/lib/auth";
import { updateOrderStatusSchema } from "@/modules/orders/orders.schemas";
import { updateOrderStatus } from "@/modules/orders/orders.service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireRole("ADMIN");
    const { orderId } = await context.params;
    const input = updateOrderStatusSchema.parse(await request.json());
    const order = await updateOrderStatus(orderId, input);
    return ok({ order }, 200, "Pedido actualizado");
  } catch (error) {
    return handleRouteError(error);
  }
}
