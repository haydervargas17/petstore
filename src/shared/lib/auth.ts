import { RoleName } from "@prisma/client";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { HttpError } from "@/shared/lib/api";
import { env, getJwtSecret } from "@/shared/lib/env";
import { prisma } from "@/shared/lib/prisma";
import type { AppRole, SessionUser } from "@/shared/types/domain";

const ACCESS_COOKIE = "pet_access_token";
const REFRESH_COOKIE = "pet_refresh_token";

type TokenPayload = {
  sub: string;
  email: string;
  name: string;
  role: AppRole;
};

function roleToAppRole(role: RoleName): AppRole {
  return role;
}

export async function signAccessToken(user: SessionUser) {
  return new SignJWT({
    email: user.email,
    name: user.fullName,
    role: user.role
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${env.accessTokenMinutes}m`)
    .sign(getJwtSecret("access"));
}

export async function signRefreshToken(user: SessionUser) {
  return new SignJWT({
    email: user.email,
    name: user.fullName,
    role: user.role
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${env.refreshTokenDays}d`)
    .sign(getJwtSecret("refresh"));
}

export async function setAuthCookies(user: SessionUser) {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(user),
    signRefreshToken(user)
  ]);

  cookieStore.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: env.accessTokenMinutes * 60
  });

  cookieStore.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: env.refreshTokenDays * 24 * 60 * 60
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, getJwtSecret("access"));
    const payload = verified.payload as TokenPayload & { sub: string };

    return {
      id: payload.sub,
      fullName: payload.name,
      email: payload.email,
      role: payload.role
    };
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    throw new HttpError(401, "Debes iniciar sesión");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { role: true }
  });

  if (!user || !user.isActive) {
    throw new HttpError(401, "Sesión inválida o cuenta inactiva");
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: roleToAppRole(user.role.name)
  } satisfies SessionUser;
}

export async function requireRole(...allowed: AppRole[]) {
  const session = await requireSession();

  if (!allowed.includes(session.role)) {
    throw new HttpError(403, "No tienes permisos para esta acción");
  }

  return session;
}
