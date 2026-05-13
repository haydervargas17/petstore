import { handleRouteError, ok } from "@/shared/lib/api";
import { requireRole } from "@/shared/lib/auth";
import {
  createProductSchema,
  productFiltersSchema
} from "@/modules/products/products.schemas";
import {
  createProduct,
  listProducts
} from "@/modules/products/products.service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters = productFiltersSchema.parse(
      Object.fromEntries(url.searchParams.entries())
    );
    const products = await listProducts(filters);
    return ok({ products });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole("ADMIN");
    const input = createProductSchema.parse(await request.json());
    const product = await createProduct(input);
    return ok({ product }, 201, "Producto creado");
  } catch (error) {
    return handleRouteError(error);
  }
}
