import { handleRouteError, ok } from "@/shared/lib/api";
import { requireRole } from "@/shared/lib/auth";
import { updateDeliverySchema } from "@/modules/deliveries/deliveries.schemas";
import { updateDelivery } from "@/modules/deliveries/deliveries.service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ deliveryId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireRole("DELIVERY");
    const { deliveryId } = await context.params;
    const input = updateDeliverySchema.parse(await request.json());
    const delivery = await updateDelivery(session.id, deliveryId, input);
    return ok({ delivery }, 200, "Domicilio actualizado");
  } catch (error) {
    return handleRouteError(error);
  }
}
