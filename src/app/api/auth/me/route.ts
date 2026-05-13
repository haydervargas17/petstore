import { ok } from "@/shared/lib/api";
import { getSession } from "@/shared/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSession();
  return ok({ user });
}
