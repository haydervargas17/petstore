import { handleRouteError, ok } from "@/shared/lib/api";
import { requireRole } from "@/shared/lib/auth";
import { updateCartItemSchema } from "@/modules/cart/cart.schemas";
import {
  removeCartItem,
  updateCartItem
} from "@/modules/cart/cart.service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireRole("CUSTOMER");
    const { itemId } = await context.params;
    const input = updateCartItemSchema.parse(await request.json());
    const cart = await updateCartItem(session.id, itemId, input);
    return ok({ cart }, 200, "Carrito actualizado");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireRole("CUSTOMER");
    const { itemId } = await context.params;
    const cart = await removeCartItem(session.id, itemId);
    return ok({ cart }, 200, "Producto eliminado del carrito");
  } catch (error) {
    return handleRouteError(error);
  }
}
