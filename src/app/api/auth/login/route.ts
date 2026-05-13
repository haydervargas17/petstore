import { handleRouteError, ok } from "@/shared/lib/api";
import { setAuthCookies } from "@/shared/lib/auth";
import { loginSchema } from "@/modules/auth/auth.schemas";
import { loginUser } from "@/modules/auth/auth.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const user = await loginUser(input);
    await setAuthCookies(user);
    return ok({ user }, 200, "Sesión iniciada");
  } catch (error) {
    return handleRouteError(error);
  }
}
