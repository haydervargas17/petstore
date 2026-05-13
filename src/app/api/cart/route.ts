import { handleRouteError, ok } from "@/shared/lib/api";
import { requireRole } from "@/shared/lib/auth";
import { addCartItemSchema } from "@/modules/cart/cart.schemas";
import { addCartItem, getCart } from "@/modules/cart/cart.service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireRole("CUSTOMER");
    const cart = await getCart(session.id);
    return ok({ cart });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole("CUSTOMER");
    const input = addCartItemSchema.parse(await request.json());
    const cart = await addCartItem(session.id, input);
    return ok({ cart }, 201, "Producto agregado al carrito");
  } catch (error) {
    return handleRouteError(error);
  }
}
