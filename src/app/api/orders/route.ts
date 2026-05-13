import { handleRouteError, HttpError, ok } from "@/shared/lib/api";
import { requireSession } from "@/shared/lib/auth";
import {
  createOrderFromCart,
  listOrders
} from "@/modules/orders/orders.service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireSession();
    const orders = await listOrders(session);
    return ok({ orders });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST() {
  try {
    const session = await requireSession();
    if (session.role !== "CUSTOMER") {
      throw new HttpError(403, "Solo los clientes pueden confirmar pedidos");
    }
    const result = await createOrderFromCart(session.id);
    return ok(result, 201, "Pedido confirmado");
  } catch (error) {
    return handleRouteError(error);
  }
}
