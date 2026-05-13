import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export function ok<T>(data: T, status = 200, message?: string) {
  return NextResponse.json({ data, message }, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof HttpError) {
    return fail(error.message, error.status, error.details);
  }

  if (error instanceof ZodError) {
    return fail("Datos inválidos", 422, error.flatten());
  }

  console.error(error);
  return fail("Error interno del servidor", 500);
}
