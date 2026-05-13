import { ok } from "@/shared/lib/api";

export const runtime = "nodejs";

export function GET() {
  return ok({
    status: "ok",
    service: "pet-store",
    time: new Date().toISOString()
  });
}
