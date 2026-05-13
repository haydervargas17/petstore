import { handleRouteError, ok } from "@/shared/lib/api";
import { requireRole } from "@/shared/lib/auth";
import { verifyDeliverySchema } from "@/modules/deliveries/deliveries.schemas";
import { verifyDeliveryCode } from "@/modules/deliveries/deliveries.service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ deliveryId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireRole("DELIVERY");
    const { deliveryId } = await context.params;
    const input = verifyDeliverySchema.parse(await request.json());
    const delivery = await verifyDeliveryCode(session.id, deliveryId, input);
    return ok({ delivery }, 200, "Entrega confirmada");
  } catch (error) {
    return handleRouteError(error);
  }
}
