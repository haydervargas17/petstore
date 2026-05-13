import { handleRouteError, ok } from "@/shared/lib/api";
import { setAuthCookies } from "@/shared/lib/auth";
import { registerSchema } from "@/modules/auth/auth.schemas";
import { registerCustomer } from "@/modules/auth/auth.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = registerSchema.parse(await request.json());
    const user = await registerCustomer(input);
    await setAuthCookies(user);
    return ok({ user }, 201, "Registro completado");
  } catch (error) {
    return handleRouteError(error);
  }
}
