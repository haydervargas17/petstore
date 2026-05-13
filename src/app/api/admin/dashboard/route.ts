import { handleRouteError, ok } from "@/shared/lib/api";
import { requireRole } from "@/shared/lib/auth";
import { getDashboardStats } from "@/modules/admin/admin.service";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const dashboard = await getDashboardStats();
    return ok({ dashboard });
  } catch (error) {
    return handleRouteError(error);
  }
}
