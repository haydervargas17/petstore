import { handleRouteError, ok } from "@/shared/lib/api";
import { requireRole } from "@/shared/lib/auth";
import { restockProductSchema } from "@/modules/products/products.schemas";
import { restockProduct } from "@/modules/products/products.service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireRole("ADMIN");
    const { productId } = await context.params;
    const input = restockProductSchema.parse(await request.json());
    const product = await restockProduct(productId, input);
    return ok({ product }, 200, "Stock actualizado");
  } catch (error) {
    return handleRouteError(error);
  }
}
