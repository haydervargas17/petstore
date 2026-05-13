import { ok } from "@/shared/lib/api";
import { clearAuthCookies } from "@/shared/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  await clearAuthCookies();
  return ok({ signedOut: true }, 200, "Sesión cerrada");
}
