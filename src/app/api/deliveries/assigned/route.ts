import { handleRouteError, ok } from "@/shared/lib/api";
import { requireRole } from "@/shared/lib/auth";
import { listAssignedDeliveries } from "@/modules/deliveries/deliveries.service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireRole("DELIVERY");
    const deliveries = await listAssignedDeliveries(session.id);
    return ok({ deliveries });
  } catch (error) {
    return handleRouteError(error);
  }
}
