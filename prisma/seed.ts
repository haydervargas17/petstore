import {
  Prisma,
  PrismaClient,
  ProductStatus,
  RoleName
} from "@prisma/client";
import { hashPassword } from "../src/shared/lib/password";
import { slugify } from "../src/shared/lib/slug";

const prisma = new PrismaClient();

const categories = [
  { name: "Alimentos", description: "Nutrición diaria para perros y gatos" },
  { name: "Accesorios", description: "Juguetes, camas, collares y cuidado" },
  { name: "Salud", description: "Productos de bienestar y cuidado preventivo" },
  { name: "Gatos", description: "Productos especializados para gatos" }
];

const products = [
  {
    name: "Alimento premium para perro",
    description:
      "Croquetas balanceadas para perros adultos, con proteína animal y fibra digestiva.",
    category: "Alimentos",
    imageUrl:
      "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=900&q=80",
    price: 89000,
    stock: 18,
    discountPercentage: 13
  },
  {
    name: "Arena sanitaria aglomerante",
    description:
      "Arena de rápida absorción con control de olores para gatos de interior.",
    category: "Gatos",
    imageUrl:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=80",
    price: 42000,
    stock: 8
  },
  {
    name: "Juguete mordedor resistente",
    description:
      "Mordedor flexible para reducir ansiedad y fortalecer mandíbula.",
    category: "Accesorios",
    imageUrl:
      "https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?auto=format&fit=crop&w=900&q=80",
    price: 26000,
    stock: 0
  },
  {
    name: "Shampoo hipoalergénico",
    description:
      "Limpieza suave para piel sensible, sin fragancias agresivas.",
    category: "Salud",
    imageUrl:
      "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&w=900&q=80",
    price: 31000,
    stock: 14
  }
];

async function upsertRoles() {
  await Promise.all(
    Object.values(RoleName).map((name) =>
      prisma.role.upsert({
        where: { name },
        update: {},
        create: { name }
      })
    )
  );
}

async function upsertUsers() {
  const [adminRole, deliveryRole, customerRole] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { name: RoleName.ADMIN } }),
    prisma.role.findUniqueOrThrow({ where: { name: RoleName.DELIVERY } }),
    prisma.role.findUniqueOrThrow({ where: { name: RoleName.CUSTOMER } })
  ]);

  await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL ?? "admin@petstore.local" },
    update: {},
    create: {
      fullName: "Admin General",
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@petstore.local",
      phone: "3000000000",
      age: 30,
      address: "Oficina principal",
      passwordHash: await hashPassword(
        process.env.SEED_ADMIN_PASSWORD ?? "Admin123!"
      ),
      roleId: adminRole.id
    }
  });

  await prisma.user.upsert({
    where: {
      email: process.env.SEED_DELIVERY_EMAIL ?? "repartidor@petstore.local"
    },
    update: {},
    create: {
      fullName: "Repartidor Demo",
      email: process.env.SEED_DELIVERY_EMAIL ?? "repartidor@petstore.local",
      phone: "3110000000",
      age: 24,
      address: "Zona de despacho",
      passwordHash: await hashPassword(
        process.env.SEED_DELIVERY_PASSWORD ?? "Repartidor123!"
      ),
      roleId: deliveryRole.id
    }
  });

  await prisma.user.upsert({
    where: { email: process.env.SEED_CUSTOMER_EMAIL ?? "cliente@petstore.local" },
    update: {},
    create: {
      fullName: "Cliente Demo",
      email: process.env.SEED_CUSTOMER_EMAIL ?? "cliente@petstore.local",
      phone: "3220000000",
      age: 28,
      address: "Carrera 10 #20-30",
      passwordHash: await hashPassword(
        process.env.SEED_CUSTOMER_PASSWORD ?? "Cliente123!"
      ),
      roleId: customerRole.id
    }
  });
}

async function upsertCatalog() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: slugify(category.name) },
      update: { description: category.description },
      create: {
        name: category.name,
        slug: slugify(category.name),
        description: category.description
      }
    });
  }

  for (const item of products) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: slugify(item.category) }
    });
    const slug = slugify(item.name);
    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        description: item.description,
        imageUrl: item.imageUrl,
        price: new Prisma.Decimal(item.price),
        stock: item.stock,
        status:
          item.stock <= 0 ? ProductStatus.OUT_OF_STOCK : ProductStatus.AVAILABLE,
        categoryId: category.id
      },
      create: {
        name: item.name,
        slug,
        description: item.description,
        imageUrl: item.imageUrl,
        price: new Prisma.Decimal(item.price),
        stock: item.stock,
        status:
          item.stock <= 0 ? ProductStatus.OUT_OF_STOCK : ProductStatus.AVAILABLE,
        categoryId: category.id
      }
    });

    if (item.discountPercentage) {
      await prisma.discount.upsert({
        where: { id: `${product.id}-seed-discount` },
        update: {
          percentage: new Prisma.Decimal(item.discountPercentage),
          isActive: true
        },
        create: {
          id: `${product.id}-seed-discount`,
          name: "Oferta inicial",
          percentage: new Prisma.Decimal(item.discountPercentage),
          isActive: true,
          productId: product.id
        }
      });
    }
  }
}

async function main() {
  await upsertRoles();
  await upsertUsers();
  await upsertCatalog();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
