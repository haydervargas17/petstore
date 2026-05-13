import { RoleName } from "@prisma/client";
import { HttpError } from "@/shared/lib/api";
import { hashPassword, verifyPassword } from "@/shared/lib/password";
import { prisma } from "@/shared/lib/prisma";
import type { SessionUser } from "@/shared/types/domain";
import type { LoginInput, RegisterInput } from "./auth.schemas";

function serializeUser(user: {
  id: string;
  fullName: string;
  email: string;
  role: { name: RoleName };
}): SessionUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role.name
  };
}

async function getOrCreateRole(name: RoleName) {
  return prisma.role.upsert({
    where: { name },
    update: {},
    create: { name }
  });
}

export async function registerCustomer(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email }
  });

  if (existing) {
    throw new HttpError(409, "Este correo ya está registrado");
  }

  const role = await getOrCreateRole(RoleName.CUSTOMER);
  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      age: input.age,
      address: input.address,
      passwordHash,
      roleId: role.id
    },
    include: { role: true }
  });

  return serializeUser(user);
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { role: true }
  });

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new HttpError(401, "Correo o contraseña inválidos");
  }

  if (!user.isActive) {
    throw new HttpError(403, "La cuenta está desactivada");
  }

  return serializeUser(user);
}
