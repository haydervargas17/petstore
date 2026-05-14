import { RoleName } from "@prisma/client";
import { handleRouteError, ok } from "@/shared/lib/api";
import { requireRole } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const couriers = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { name: RoleName.DELIVERY }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true
      },
      orderBy: { fullName: "asc" }
    });

    return ok({ couriers });
  } catch (error) {
    return handleRouteError(error);
  }
}
